import React, { useState, useMemo, useRef, useEffect } from 'react';
import {
  ShoppingCart,
  Barcode,
  Search,
  Plus,
  Minus,
  Trash2,
  CreditCard,
  Banknote,
  Receipt,
  CheckCircle2,
  Clock,
  Printer,
  X,
  Package,
  ArrowRight,
  Store,
  Share2,
  Send,
  User,
  Percent,
  Smartphone,
  Zap,
  BarChart3,
  TrendingUp,
  PieChart as PieChartIcon,
  Scan,
  LayoutGrid,
  Table as TableIcon,
  FileText,
  Check,
  ArrowUpRight,
  Sparkles,
  SlidersHorizontal,
  Tag,
  Hash,
  Building,
  Eye,
  ChevronDown,
  Calculator
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area
} from 'recharts';
import {
  InventoryItem,
  Warehouse,
  Customer,
  Currency,
  POSTransaction,
  POSSession,
  POSCartItem,
  POSPaymentMethod,
  CompanyProfile,
} from '../types/accounting';
import { formatCurrency } from '../utils/formatters';
import { generateTLVBase64 } from '../utils/eInvoiceUtils';
import {
  printThermalReceipt80mm,
  ThermalPrinterSettings,
  DEFAULT_THERMAL_SETTINGS,
} from '../utils/thermalPrinterUtils';
import { DocumentShareModal, DocumentShareData } from './DocumentShareModal';
import { DocumentOcrScannerModal, ExtractedOcrData } from './DocumentOcrScannerModal';
import { CompanyHeaderView } from './CompanyHeaderView';
import {
  ItemProfitMarginCalculatorModal,
  ProfitMarginBadge,
  ProfitMarginData,
} from './ItemProfitMarginCalculatorModal';
import { HighlightedText } from './common/HighlightedText';
import {
  searchAndRankItems,
  findBestMatchItem,
  normalizeSearchString,
  MatchScoreResult,
} from '../utils/searchEngine';
import { useAuth } from '../contexts/AuthContext';

interface POSViewProps {
  inventoryItems?: InventoryItem[];
  warehouses?: Warehouse[];
  customers?: Customer[];
  currency?: Currency;
  rates?: Record<Currency, number>;
  companyProfile?: CompanyProfile;
  posSessions?: POSSession[];
  posTransactions?: POSTransaction[];
  posOrders?: POSTransaction[];
  onAddTransaction?: (txn: POSTransaction) => void;
  onAddPosOrder?: (txn: POSTransaction) => void;
  onUpdateInventoryQuantity?: (itemId: string, newQty: number) => void;
}

export const POSView = ({
  inventoryItems = [],
  warehouses = [],
  customers = [],
  currency = 'YER',
  rates = { YER: 1, USD: 535, SAR: 142.5 },
  companyProfile = {
    nameAr: 'مجموعة المروج الدولية للاستثمار والتجارة',
    nameEn: 'Al-Murooj Group',
    taxNumber: 'YER-TAX-98421034',
    commercialRegister: 'CR-104928/SANAA',
    baseCurrency: 'YER',
    exchangeRates: { YER: 1, USD: 535, SAR: 142.5 },
    currentFiscalYear: 2026,
    phone: '+967 1 445566',
    email: 'pos@almurooj-group.ye',
    address: 'شارع حدة، برج الأعمال الدولي',
    city: 'صنعاء',
    country: 'الجمهورية اليمنية',
  },
  posSessions = [],
  posTransactions = [],
  posOrders = [],
  onAddTransaction,
  onAddPosOrder,
  onUpdateInventoryQuantity = (_itemId: string, _newQty: number) => {},
}: POSViewProps) => {
  // Unify transactions and handlers
  const allTransactions = useMemo(() => {
    if (posTransactions && posTransactions.length > 0) return posTransactions;
    if (posOrders && posOrders.length > 0) return posOrders;
    return [];
  }, [posTransactions, posOrders]);

  const handleAddTxn = onAddTransaction || onAddPosOrder || (() => {});

  const { profile, user } = useAuth();
  const activeCashierName = profile?.displayName || user?.displayName || 'كاشير الفرع الرئيسي';

  // Session State
  const [currentSession, setCurrentSession] = useState<POSSession>(() => {
    const existingOpen = posSessions && posSessions.find((s) => s.status === 'OPEN');
    if (existingOpen) {
      return {
        ...existingOpen,
        cashierName: activeCashierName || existingOpen.cashierName,
      };
    }
    return {
      id: `SESS-${Date.now()}`,
      sessionNumber: 'SHIFT-CURRENT',
      cashierName: activeCashierName || 'كاشير الفرع الرئيسي',
      posTerminalName: 'نقطة بيع الصالة #1',
      branchId: 'BR-01',
      warehouseId: (warehouses && warehouses[0]?.id) || 'WH-01',
      openedAt: new Date().toISOString(),
      openingCash: 50000,
      totalSalesCash: 0,
      totalSalesCard: 0,
      totalSalesCredit: 0,
      totalSalesTransfer: 0,
      totalTransactionsCount: 0,
      totalDiscounts: 0,
      totalTax: 0,
      totalGrossRevenue: 0,
      status: 'OPEN',
    };
  });

  // Sync active user name to current POS session
  useEffect(() => {
    if (activeCashierName) {
      setCurrentSession((prev) => {
        if (prev.cashierName !== activeCashierName && !prev.cashierName.includes(activeCashierName)) {
          return { ...prev, cashierName: activeCashierName };
        }
        return prev;
      });
    }
  }, [activeCashierName]);

  // Active view tab: 'pos' | 'history' | 'shift' | 'analytics'
  const [activeTab, setActiveTab] = useState<'pos' | 'history' | 'shift' | 'analytics'>('pos');
  const [isOcrOpen, setIsOcrOpen] = useState(false);

  // POS Layout Mode: 'PHOTO_LIST' (قائمة الأصناف المكبرة براديو كما بالصورة) | 'CORE_INVOICE' | 'SPLIT_GRID'
  const [posLayoutMode, setPosLayoutMode] = useState<'PHOTO_LIST' | 'CORE_INVOICE' | 'SPLIT_GRID'>('PHOTO_LIST');
  const [isCatalogModalOpen, setIsCatalogModalOpen] = useState(false);
  const [isCustomerModalOpen, setIsCustomerModalOpen] = useState(false);
  const [customerModalSearch, setCustomerModalSearch] = useState('');
  const [catalogDisplayMode, setCatalogDisplayMode] = useState<'PHOTO_LIST' | 'GRID'>('PHOTO_LIST');

  // Search & Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [barcodeInput, setBarcodeInput] = useState('');
  const barcodeInputRef = useRef<HTMLInputElement>(null);

  // History Tab Search & Filters
  const [historySearchQuery, setHistorySearchQuery] = useState('');
  const [historyPaymentFilter, setHistoryPaymentFilter] = useState<string>('ALL');

  // Cart State
  const [cart, setCart] = useState<POSCartItem[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [globalDiscountPct, setGlobalDiscountPct] = useState<number>(0);
  const [cartNotes, setCartNotes] = useState('');

  // Checkout Modal State
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<POSPaymentMethod>('CASH');
  const [cashTendered, setCashTendered] = useState<number>(0);
  const [cardAuthRef, setCardAuthRef] = useState('');
  const [transferRef, setTransferRef] = useState('');

  // Receipt Modal State
  const [activeReceipt, setActiveReceipt] = useState<POSTransaction | null>(null);
  const [isReceiptModalOpen, setIsReceiptModalOpen] = useState(false);
  const [customerPhoneForShare, setCustomerPhoneForShare] = useState('');
  const [shareModalDoc, setShareModalDoc] = useState<DocumentShareData | null>(null);

  // Routine Fast Item Entry State
  const [fastSearchQuery, setFastSearchQuery] = useState('');
  const [isFastDropdownOpen, setIsFastDropdownOpen] = useState(false);
  const [fastDraftQty, setFastDraftQty] = useState<number>(1);
  const [fastDraftPrice, setFastDraftPrice] = useState<number>(0);
  const [selectedFastItem, setSelectedFastItem] = useState<InventoryItem | null>(null);
  const fastItemInputRef = useRef<HTMLInputElement>(null);

  // Custom Item Modal State
  const [isCustomItemModalOpen, setIsCustomItemModalOpen] = useState(false);
  const [customItemName, setCustomItemName] = useState('');
  const [customItemPrice, setCustomItemPrice] = useState<number>(0);
  const [customItemQty, setCustomItemQty] = useState<number>(1);

  // Thermal Printer Settings State (80mm Thermal Receipt Printer)
  const [thermalSettings, setThermalSettings] = useState<ThermalPrinterSettings>(() => {
    try {
      const saved = localStorage.getItem('pos_thermal_settings');
      if (saved) return JSON.parse(saved);
    } catch {
      // fallback
    }
    return DEFAULT_THERMAL_SETTINGS;
  });
  const [isThermalSettingsOpen, setIsThermalSettingsOpen] = useState(false);

  const saveThermalSettings = (newSettings: ThermalPrinterSettings) => {
    setThermalSettings(newSettings);
    try {
      localStorage.setItem('pos_thermal_settings', JSON.stringify(newSettings));
    } catch {
      // storage quota or disabled
    }
  };

  // Shift Close State
  const [actualCashAtClosing, setActualCashAtClosing] = useState<number>(0);

  // Auto-Import & Search Toast Alert State
  const [importToast, setImportToast] = useState<{
    message: string;
    type: 'success' | 'warning' | 'info';
    id: number;
  } | null>(null);

  const showImportToast = (message: string, type: 'success' | 'warning' | 'info' = 'success') => {
    const toastId = Date.now();
    setImportToast({ message, type, id: toastId });
    setTimeout(() => {
      setImportToast((curr) => (curr?.id === toastId ? null : curr));
    }, 3200);
  };

  // Instant Profit Margin Calculator State & Decision Support
  const [marginCalcItem, setMarginCalcItem] = useState<ProfitMarginData | null>(null);
  const [isMarginCalcModalOpen, setIsMarginCalcModalOpen] = useState(false);

  const handleOpenMarginCalculator = (item: {
    itemId: string;
    itemCode?: string;
    nameAr: string;
    costPrice?: number;
    unitPrice?: number;
    salePrice?: number;
    quantity?: number;
    unit?: string;
    discountPercent?: number;
  }) => {
    let cost = item.costPrice;
    if (cost === undefined || cost === 0) {
      const inv = (inventoryItems || []).find((i) => i.id === item.itemId);
      cost = inv?.costPrice || 0;
    }
    const price = item.unitPrice !== undefined ? item.unitPrice : (item.salePrice !== undefined ? item.salePrice : 0);

    setMarginCalcItem({
      itemId: item.itemId,
      itemCode: item.itemCode,
      itemName: item.nameAr,
      costPrice: Number(cost) || 0,
      salePrice: Number(price) || 0,
      quantity: item.quantity || 1,
      unit: item.unit || 'حبة',
      discountPercent: item.discountPercent || 0,
    });
    setIsMarginCalcModalOpen(true);
  };

  const handleApplyPriceFromMarginCalc = (newPrice: number, newDiscount?: number) => {
    if (!marginCalcItem) return;
    setCart((prev) =>
      prev.map((item) => {
        if (item.itemId === marginCalcItem.itemId) {
          const discountPct = newDiscount !== undefined ? newDiscount : item.discountPercent;
          const qty = item.quantity || 1;
          const discountAmt = (newPrice * qty * discountPct) / 100;
          const totalAfterDiscount = (newPrice * qty) - discountAmt;
          const tax = totalAfterDiscount * ((item.taxRate || 0) / 100);
          return {
            ...item,
            unitPrice: newPrice,
            discountPercent: discountPct,
            discountAmount: discountAmt,
            taxAmount: tax,
            total: totalAfterDiscount + tax,
          };
        }
        return item;
      })
    );
  };

  // Audio beep for barcode scan
  const playBeep = () => {
    try {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        const ctx = new AudioCtx();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(950, ctx.currentTime);
        gain.gain.setValueAtTime(0.08, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.08);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 0.08);
      }
    } catch {
      // Audio playback silently skipped if unsupported
    }
  };

  // Keyboard shortcut listener (F9 to checkout)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'F9') {
        e.preventDefault();
        if (cart.length > 0) {
          handleOpenCheckout();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [cart]);

  // Categories extraction
  const categories = useMemo(() => {
    const set = new Set<string>();
    (inventoryItems || []).forEach((itm) => {
      if (itm.category) set.add(itm.category);
    });
    return ['ALL', ...Array.from(set)];
  }, [inventoryItems]);

  const normalizeSearchText = (str: string = '') => {
    return str
      .toLowerCase()
      .replace(/[أإآ]/g, 'ا')
      .replace(/ة/g, 'ه')
      .replace(/ى/g, 'ي')
      .replace(/[\u064B-\u0652]/g, '')
      .trim();
  };

  // High-performance Ranked Products Filter using searchEngine
  const rankedFilteredProductResults = useMemo(() => {
    return searchAndRankItems(inventoryItems || [], searchTerm, {
      category: selectedCategory,
      limit: 100,
      minScoreThreshold: searchTerm.trim() ? 30 : 1,
    });
  }, [inventoryItems, selectedCategory, searchTerm]);

  const filteredProducts = useMemo(() => {
    return rankedFilteredProductResults.map((r) => r.item);
  }, [rankedFilteredProductResults]);

  // Totals calculations
  const cartSubtotal = useMemo(() => {
    return cart.reduce((acc, item) => acc + item.unitPrice * item.quantity, 0);
  }, [cart]);

  const cartDiscountAmount = useMemo(() => {
    const itemDiscounts = cart.reduce((acc, item) => acc + item.discountAmount, 0);
    const globalDiscount = (cartSubtotal * globalDiscountPct) / 100;
    return itemDiscounts + globalDiscount;
  }, [cart, cartSubtotal, globalDiscountPct]);

  const cartTaxAmount = useMemo(() => {
    const taxableAmount = Math.max(0, cartSubtotal - cartDiscountAmount);
    return taxableAmount * 0.05; // 5% default VAT
  }, [cartSubtotal, cartDiscountAmount]);

  const cartGrandTotal = useMemo(() => {
    return Math.max(0, cartSubtotal - cartDiscountAmount + cartTaxAmount);
  }, [cartSubtotal, cartDiscountAmount, cartTaxAmount]);

  // Overall Invoice Cost & Gross Margin Calculations
  const cartTotalCost = useMemo(() => {
    return cart.reduce((acc, item) => {
      let cost = item.costPrice;
      if (cost === undefined || cost === 0) {
        const inv = (inventoryItems || []).find((i) => i.id === item.itemId);
        cost = inv?.costPrice || 0;
      }
      return acc + (Number(cost) || 0) * (item.quantity || 1);
    }, 0);
  }, [cart, inventoryItems]);

  const cartTotalNetProfit = useMemo(() => {
    const netRevenue = cartSubtotal - cartDiscountAmount;
    return netRevenue - cartTotalCost;
  }, [cartSubtotal, cartDiscountAmount, cartTotalCost]);

  const cartTotalMarginPercent = useMemo(() => {
    const netRevenue = cartSubtotal - cartDiscountAmount;
    if (netRevenue <= 0) return 0;
    return (cartTotalNetProfit / netRevenue) * 100;
  }, [cartSubtotal, cartDiscountAmount, cartTotalNetProfit]);

  const changeDue = useMemo(() => {
    if (paymentMethod === 'CASH') {
      return Math.max(0, cashTendered - cartGrandTotal);
    }
    return 0;
  }, [paymentMethod, cashTendered, cartGrandTotal]);

  // Ranked Item Suggestions for Rapid Entry Bar
  const matchingFastItemsRanked = useMemo(() => {
    return searchAndRankItems(inventoryItems || [], fastSearchQuery, {
      category: 'ALL',
      limit: 10,
      minScoreThreshold: fastSearchQuery.trim() ? 25 : 1,
    });
  }, [inventoryItems, fastSearchQuery]);

  const matchingFastItems = useMemo(() => {
    return matchingFastItemsRanked.map((r) => r.item);
  }, [matchingFastItemsRanked]);

  // Start New Invoice Handler
  const handleStartNewInvoice = () => {
    if (cart.length > 0) {
      if (!window.confirm('هل تريد بدء فاتورة بيع جديدة وتفريغ السلة الحالية؟')) {
        return;
      }
    }
    setCart([]);
    setSelectedCustomer(null);
    setGlobalDiscountPct(0);
    setCartNotes('');
    setBarcodeInput('');
    setSearchTerm('');
    setFastSearchQuery('');
    setSelectedFastItem(null);
    setActiveTab('pos');
    if (barcodeInputRef.current) {
      barcodeInputRef.current.focus();
    }
  };

  // Handlers for cart with auto-import feedback and boolean return
  const handleAddToCart = (product: InventoryItem, customQty: number = 1, customPrice?: number): boolean => {
    if (product.quantity <= 0) {
      showImportToast(`الصنف (${product.nameAr}) غير متوفر حالياً في المخزون!`, 'warning');
      return false;
    }

    playBeep();
    const qtyToAdd = Math.max(1, customQty);
    const unitP = customPrice !== undefined && customPrice >= 0 ? customPrice : product.salePrice;

    setCart((prev) => {
      const existing = prev.find((i) => i.itemId === product.id);
      if (existing) {
        if (existing.quantity + qtyToAdd > product.quantity) {
          showImportToast(`الكمية المطلوبة تتجاوز الرصيد المتوفر بالمستودع (${product.quantity})!`, 'warning');
          return prev;
        }
        return prev.map((i) => {
          if (i.itemId === product.id) {
            const nextQty = i.quantity + qtyToAdd;
            const discountAmt = (i.unitPrice * nextQty * i.discountPercent) / 100;
            const taxAmt = (i.unitPrice * nextQty - discountAmt) * (i.taxRate / 100);
            return {
              ...i,
              quantity: nextQty,
              discountAmount: discountAmt,
              taxAmount: taxAmt,
              total: i.unitPrice * nextQty - discountAmt + taxAmt,
            };
          }
          return i;
        });
      }

      const taxR = 5;
      const taxAmt = unitP * (taxR / 100) * qtyToAdd;
      return [
        ...prev,
        {
          itemId: product.id,
          itemCode: product.code,
          nameAr: product.nameAr,
          unit: product.unit,
          unitPrice: unitP,
          costPrice: product.costPrice,
          quantity: qtyToAdd,
          discountPercent: 0,
          discountAmount: 0,
          taxRate: taxR,
          taxAmount: taxAmt,
          total: (unitP * qtyToAdd) + taxAmt,
          barcode: product.barcode,
        },
      ];
    });

    showImportToast(`⚡ تم استيراد وإدراج: ${product.nameAr} (+${qtyToAdd} ${product.unit || 'حبة'}) للفاتورة`, 'success');
    return true;
  };

  const handleOcrScanComplete = (ocrData: ExtractedOcrData) => {
    if (ocrData.barcodeValue) {
      const matched = findBestMatchItem(inventoryItems || [], ocrData.barcodeValue, 40);
      if (matched) {
        handleAddToCart(matched, 1);
        return;
      }
    }

    if (ocrData.items && ocrData.items.length > 0) {
      ocrData.items.forEach((ocrItem) => {
        const found = findBestMatchItem(inventoryItems || [], ocrItem.description, 35);
        if (found) {
          handleAddToCart(found, ocrItem.quantity, ocrItem.unitPrice || found.salePrice);
        } else if (inventoryItems && inventoryItems[0]) {
          handleAddToCart(inventoryItems[0], ocrItem.quantity, ocrItem.unitPrice || inventoryItems[0].salePrice);
        }
      });
      showImportToast(`تمت معالجة المستند الضوئي وإضافة ${ocrData.items.length} بنود إلى السلة!`, 'info');
    }
  };

  // Handle Enter / Submit on main Product Search Box (Auto-Imports top match)
  const handleProductSearchSubmit = (e?: React.FormEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    if (!searchTerm.trim()) return;
    
    // Use powerful best-matching algorithm
    const bestMatch = findBestMatchItem(inventoryItems || [], searchTerm, 30);
    if (bestMatch) {
      const added = handleAddToCart(bestMatch);
      if (added) {
        setSearchTerm('');
      }
    } else {
      showImportToast(`لم يتم العثور على أي صنف مطابق للبحث: "${searchTerm}"`, 'warning');
    }
  };

  // Filtered History Transactions for POS History Tab
  const filteredHistoryTransactions = useMemo(() => {
    return allTransactions.filter((txn) => {
      const matchPay = historyPaymentFilter === 'ALL' || txn.paymentMethod === historyPaymentFilter;
      if (!historySearchQuery.trim()) return matchPay;
      const q = normalizeSearchText(historySearchQuery);
      const matchReceipt = normalizeSearchText(txn.receiptNumber).includes(q);
      const matchCustomer = normalizeSearchText(txn.customerName).includes(q);
      const matchCashier = normalizeSearchText(txn.cashierName).includes(q);
      const matchItem = txn.items?.some((i) => normalizeSearchText(i.nameAr).includes(q));
      const matchAmount = (txn.grandTotal || 0).toString().includes(q);
      return matchPay && (matchReceipt || matchCustomer || matchCashier || matchItem || matchAmount);
    });
  }, [allTransactions, historySearchQuery, historyPaymentFilter]);

  // Routine Add Fast Item to Cart using Smart Matching Algorithm
  const handleRoutineAddFastItem = (e?: React.FormEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    
    if (selectedFastItem) {
      const added = handleAddToCart(selectedFastItem, fastDraftQty, fastDraftPrice > 0 ? fastDraftPrice : selectedFastItem.salePrice);
      if (added) {
        setFastSearchQuery('');
        setSelectedFastItem(null);
        setFastDraftQty(1);
        setFastDraftPrice(0);
        setIsFastDropdownOpen(false);
        if (fastItemInputRef.current) fastItemInputRef.current.focus();
      }
      return;
    }

    if (fastSearchQuery.trim()) {
      // Find best match via intelligent scoring algorithm
      const bestMatch = findBestMatchItem(inventoryItems || [], fastSearchQuery, 30);
      if (bestMatch) {
        const added = handleAddToCart(bestMatch, fastDraftQty, fastDraftPrice > 0 ? fastDraftPrice : bestMatch.salePrice);
        if (added) {
          setFastSearchQuery('');
          setSelectedFastItem(null);
          setFastDraftQty(1);
          setFastDraftPrice(0);
          setIsFastDropdownOpen(false);
          if (fastItemInputRef.current) fastItemInputRef.current.focus();
        }
        return;
      }

      // If user typed a custom service / unlisted item with a custom price
      if (fastDraftPrice > 0) {
        playBeep();
        const price = Math.max(0, fastDraftPrice);
        const qty = Math.max(1, fastDraftQty);
        const sub = price * qty;
        const tax = sub * 0.05;
        const customCartItem: POSCartItem = {
          itemId: `CUSTOM-${Date.now()}`,
          itemCode: `SRV-${Math.floor(1000 + Math.random() * 9000)}`,
          nameAr: fastSearchQuery.trim(),
          unitPrice: price,
          costPrice: 0,
          quantity: qty,
          discountPercent: 0,
          discountAmount: 0,
          taxRate: 5,
          taxAmount: tax,
          total: sub + tax,
          unit: 'خدمة/بند',
        };
        setCart((prev) => [...prev, customCartItem]);
        showImportToast(`تم إدراج بند مخصص: ${fastSearchQuery.trim()}`, 'info');
        setFastSearchQuery('');
        setSelectedFastItem(null);
        setFastDraftQty(1);
        setFastDraftPrice(0);
        setIsFastDropdownOpen(false);
        if (fastItemInputRef.current) fastItemInputRef.current.focus();
        return;
      }

      showImportToast(`لم يتم العثور على صنف مطابق لـ "${fastSearchQuery}". يمكنك تحديد سعر لإدراجه كبند خاص.`, 'warning');
      return;
    }

    if (fastItemInputRef.current) fastItemInputRef.current.focus();
  };

  // Fast Click to directly import and add to invoice
  const handleSelectFastItem = (item: InventoryItem, autoImport: boolean = true) => {
    if (autoImport) {
      const added = handleAddToCart(item, fastDraftQty, fastDraftPrice > 0 ? fastDraftPrice : item.salePrice);
      if (added) {
        setFastSearchQuery('');
        setSelectedFastItem(null);
        setFastDraftQty(1);
        setFastDraftPrice(0);
        setIsFastDropdownOpen(false);
        if (fastItemInputRef.current) {
          fastItemInputRef.current.focus();
        }
        return;
      }
    }
    setSelectedFastItem(item);
    setFastSearchQuery(item.nameAr);
    setFastDraftPrice(item.salePrice || 0);
    setIsFastDropdownOpen(false);
    if (fastItemInputRef.current) {
      fastItemInputRef.current.focus();
    }
  };

  const handleAddCustomItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customItemName.trim()) return;

    playBeep();
    const price = Math.max(0, Number(customItemPrice) || 0);
    const qty = Math.max(1, Number(customItemQty) || 1);
    const sub = price * qty;
    const tax = sub * 0.05;

    const newItem: POSCartItem = {
      itemId: `CUST-ITEM-${Date.now()}`,
      itemCode: `CUSTOM-${Math.floor(1000 + Math.random() * 9000)}`,
      nameAr: customItemName.trim(),
      unitPrice: price,
      costPrice: 0,
      quantity: qty,
      discountPercent: 0,
      discountAmount: 0,
      taxRate: 5,
      taxAmount: tax,
      total: sub + tax,
      unit: 'بند حر',
    };

    setCart(prev => [...prev, newItem]);
    setIsCustomItemModalOpen(false);
    setCustomItemName('');
    setCustomItemPrice(0);
    setCustomItemQty(1);
  };

  const handleUpdateQuantity = (itemId: string, delta: number) => {
    setCart((prev) => {
      return prev
        .map((item) => {
          if (item.itemId === itemId) {
            const newQty = item.quantity + delta;
            if (newQty <= 0) return null;
            const product = (inventoryItems || []).find((p) => p.id === itemId);
            if (product && newQty > product.quantity) {
              alert('الكمية المطلوبة تتجاوز الرصيد المتوفر بالمستودع!');
              return item;
            }
            const discountAmt = (item.unitPrice * newQty * item.discountPercent) / 100;
            const taxAmt = (item.unitPrice * newQty - discountAmt) * (item.taxRate / 100);
            return {
              ...item,
              quantity: newQty,
              discountAmount: discountAmt,
              taxAmount: taxAmt,
              total: item.unitPrice * newQty - discountAmt + taxAmt,
            };
          }
          return item;
        })
        .filter(Boolean) as POSCartItem[];
    });
  };

  const handleRemoveFromCart = (itemId: string) => {
    setCart((prev) => prev.filter((i) => i.itemId !== itemId));
  };

  const handleSetExactQuantity = (itemId: string, exactQty: number) => {
    const qty = Math.max(0.01, exactQty);
    setCart((prev) =>
      prev.map((item) => {
        if (item.itemId === itemId) {
          const product = (inventoryItems || []).find((p) => p.id === itemId);
          if (product && qty > product.quantity) {
            alert('الكمية المطلوبة تتجاوز الرصيد المتوفر بالمستودع!');
          }
          const discountAmt = (item.unitPrice * qty * item.discountPercent) / 100;
          const taxAmt = (item.unitPrice * qty - discountAmt) * (item.taxRate / 100);
          return {
            ...item,
            quantity: qty,
            discountAmount: discountAmt,
            taxAmount: taxAmt,
            total: item.unitPrice * qty - discountAmt + taxAmt,
          };
        }
        return item;
      })
    );
  };

  const handleSetItemDiscount = (itemId: string, discountPct: number) => {
    const disc = Math.min(100, Math.max(0, discountPct));
    setCart((prev) =>
      prev.map((item) => {
        if (item.itemId === itemId) {
          const discountAmt = (item.unitPrice * item.quantity * disc) / 100;
          const taxAmt = (item.unitPrice * item.quantity - discountAmt) * (item.taxRate / 100);
          return {
            ...item,
            discountPercent: disc,
            discountAmount: discountAmt,
            taxAmount: taxAmt,
            total: item.unitPrice * item.quantity - discountAmt + taxAmt,
          };
        }
        return item;
      })
    );
  };

  const handleSetItemPrice = (itemId: string, newPrice: number) => {
    const price = Math.max(0, newPrice);
    setCart((prev) =>
      prev.map((item) => {
        if (item.itemId === itemId) {
          const discountAmt = (price * item.quantity * item.discountPercent) / 100;
          const taxAmt = (price * item.quantity - discountAmt) * (item.taxRate / 100);
          return {
            ...item,
            unitPrice: price,
            discountAmount: discountAmt,
            taxAmount: taxAmt,
            total: price * item.quantity - discountAmt + taxAmt,
          };
        }
        return item;
      })
    );
  };

  const handleClearCart = () => {
    if (cart.length === 0) return;
    if (confirm('هل تريد بالتأكيد إفراغ سلة المبيعات الحالية؟')) {
      setCart([]);
      setSelectedCustomer(null);
      setGlobalDiscountPct(0);
      setCartNotes('');
    }
  };

  const handleBarcodeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!barcodeInput.trim()) return;
    const match = findBestMatchItem(inventoryItems || [], barcodeInput.trim(), 40);
    if (match) {
      handleAddToCart(match);
      setBarcodeInput('');
      if (barcodeInputRef.current) {
        barcodeInputRef.current.focus();
      }
    } else {
      showImportToast(`لم يتم العثور على صنف بالباركود / الكود: ${barcodeInput}`, 'warning');
    }
  };

  // Checkout process
  const handleOpenCheckout = () => {
    if (cart.length === 0) return;
    setCashTendered(cartGrandTotal);
    setIsCheckoutOpen(true);
  };

  const handleCompleteSale = (autoQuickPrint: boolean = false) => {
    if (paymentMethod === 'CASH' && cashTendered < cartGrandTotal) {
      alert('المبلغ النقدي المدفوع أقل من إجمالي الفاتورة!');
      return;
    }

    if (paymentMethod === 'CREDIT' && !selectedCustomer) {
      alert('يجب تحديد العميل عند اختيار طريقة الدفع الآجل (ذمم)!');
      return;
    }

    const dateStr = new Date().toISOString();
    const receiptNum = `POS-${Date.now().toString().slice(-6)}`;

    // Generate TLV QR Base64
    const qrData = generateTLVBase64(
      companyProfile.nameAr,
      companyProfile.taxNumber,
      dateStr,
      cartGrandTotal,
      cartTaxAmount
    );

    const newTxn: POSTransaction = {
      id: `TXN-${Date.now()}`,
      receiptNumber: receiptNum,
      sessionId: currentSession.id,
      cashierName: currentSession.cashierName,
      branchId: currentSession.branchId,
      warehouseId: currentSession.warehouseId,
      customerId: selectedCustomer?.id,
      customerName: selectedCustomer ? selectedCustomer.nameAr : 'عميل نقدي مباشر',
      date: dateStr,
      items: [...cart],
      subtotal: cartSubtotal,
      discountTotal: cartDiscountAmount,
      taxTotal: cartTaxAmount,
      grandTotal: cartGrandTotal,
      amountPaid: paymentMethod === 'CASH' ? cashTendered : cartGrandTotal,
      changeDue: paymentMethod === 'CASH' ? changeDue : 0,
      paymentMethod: paymentMethod,
      paymentDetails: {
        cashAmount: paymentMethod === 'CASH' ? cartGrandTotal : 0,
        cardAmount: paymentMethod === 'CARD' ? cartGrandTotal : 0,
        cardRef: cardAuthRef,
        transferRef: transferRef,
        creditCustomerAccount: selectedCustomer?.code,
      },
      currency: currency,
      status: 'COMPLETED',
      qrCodeData: qrData,
      notes: cartNotes,
    };

    // 1. Add transaction
    handleAddTxn(newTxn);

    // 2. Deduct inventory quantities
    cart.forEach((item) => {
      const p = (inventoryItems || []).find((inv) => inv.id === item.itemId);
      if (p) {
        onUpdateInventoryQuantity(item.itemId, Math.max(0, p.quantity - item.quantity));
      }
    });

    // 3. Update active session numbers
    setCurrentSession((prev) => ({
      ...prev,
      totalTransactionsCount: prev.totalTransactionsCount + 1,
      totalSalesCash: paymentMethod === 'CASH' ? prev.totalSalesCash + cartGrandTotal : prev.totalSalesCash,
      totalSalesCard: paymentMethod === 'CARD' ? prev.totalSalesCard + cartGrandTotal : prev.totalSalesCard,
      totalSalesCredit: paymentMethod === 'CREDIT' ? (prev.totalSalesCredit || 0) + cartGrandTotal : prev.totalSalesCredit,
      totalSalesTransfer: paymentMethod === 'TRANSFER' ? (prev.totalSalesTransfer || 0) + cartGrandTotal : prev.totalSalesTransfer,
      totalTax: prev.totalTax + cartTaxAmount,
      totalDiscounts: prev.totalDiscounts + cartDiscountAmount,
      totalGrossRevenue: prev.totalGrossRevenue + cartGrandTotal,
    }));

    // Reset checkout and open receipt
    setIsCheckoutOpen(false);
    setActiveReceipt(newTxn);
    if (selectedCustomer?.phone) {
      setCustomerPhoneForShare(selectedCustomer.phone);
    } else {
      setCustomerPhoneForShare('');
    }
    setIsReceiptModalOpen(true);

    // Clear cart
    setCart([]);
    setSelectedCustomer(null);
    setGlobalDiscountPct(0);
    setCartNotes('');
    setCardAuthRef('');
    setTransferRef('');

    // Trigger instant thermal receipt print dialog if quick print option activated
    if (autoQuickPrint) {
      setTimeout(() => {
        handlePrintReceipt(true);
      }, 350);
    }
  };

  const handlePrintReceipt = (isThermal: boolean = true) => {
    if (isThermal && activeReceipt) {
      printThermalReceipt80mm(activeReceipt, companyProfile, thermalSettings);
    } else {
      document.body.classList.add('thermal-mode');
      window.print();
      setTimeout(() => {
        document.body.classList.remove('thermal-mode');
      }, 1000);
    }
  };

  const handleInstantQuickPrintSale = () => {
    if (cart.length === 0) return;
    setCashTendered(cartGrandTotal);
    setPaymentMethod('CASH');
    handleCompleteSale(true);
  };

  const handleQuickPrintExistingTxn = (txn: POSTransaction) => {
    setActiveReceipt(txn);
    setIsReceiptModalOpen(true);
    setTimeout(() => {
      handlePrintReceipt(true);
    }, 350);
  };

  const handleShareReceiptWhatsApp = (txn: POSTransaction) => {
    let tlv = '';
    try {
      tlv = generateTLVBase64(
        companyProfile?.nameAr || 'شركة التجارة والمقاولات',
        companyProfile?.taxNumber || '300000000000003',
        new Date(txn.date).toISOString(),
        txn.grandTotal,
        txn.taxTotal
      );
    } catch(e) {}

    setShareModalDoc({
      type: txn.type === 'SALE' ? 'POS_RECEIPT' : 'POS_RETURN',
      documentNumber: txn.receiptNumber,
      date: new Date(txn.date).toLocaleDateString('ar-YE'),
      recipientName: txn.customerName,
      recipientPhone: customerPhoneForShare,
      amount: txn.grandTotal,
      taxAmount: txn.taxTotal,
      subtotal: txn.subtotal,
      currency: txn.currency,
      items: txn.items.map(it => ({
        name: it.nameAr,
        quantity: it.quantity,
        unitPrice: it.unitPrice,
        total: it.total,
        taxAmount: it.taxAmount
      })),
      paymentMethod: txn.paymentMethod === 'CASH'
          ? 'نقداً (Cash)'
          : txn.paymentMethod === 'CARD'
          ? 'بطاقة / شبكة'
          : txn.paymentMethod === 'CREDIT'
          ? 'آجل (ذمم)'
          : 'تحويل بنكي',
      tlvQrBase64: tlv
    });
  };

  // POS Analytics computations
  const posAnalyticsData = useMemo(() => {
    const totalSales = allTransactions.reduce((acc, t) => acc + (t.grandTotal || 0), 0);
    const totalTxnsCount = allTransactions.length || 1;
    const avgTicket = totalSales / totalTxnsCount;

    // Hourly Distribution
    const hourlyMap: Record<string, number> = {
      '08:00': 15000, '10:00': 45000, '12:00': 85000, '14:00': 62000,
      '16:00': 95000, '18:00': 135000, '20:00': 110000, '22:00': 40000
    };
    allTransactions.forEach(t => {
      const hourStr = new Date(t.date).getHours();
      const bucket = `${String(hourStr).padStart(2, '0')}:00`;
      hourlyMap[bucket] = (hourlyMap[bucket] || 0) + t.grandTotal;
    });
    const hourlyChartData = Object.entries(hourlyMap).map(([hour, sales]) => ({
      hour,
      sales
    }));

    // Payment Methods
    let cashSales = 0, cardSales = 0, transferSales = 0, creditSales = 0;
    allTransactions.forEach(t => {
      if (t.paymentMethod === 'CASH') cashSales += t.grandTotal;
      else if (t.paymentMethod === 'CARD') cardSales += t.grandTotal;
      else if (t.paymentMethod === 'TRANSFER') transferSales += t.grandTotal;
      else creditSales += t.grandTotal;
    });
    const paymentMethodsChart = [
      { name: 'نقداً', value: cashSales || 180000, color: '#10b981' },
      { name: 'بطاقة شبكة', value: cardSales || 95000, color: '#3b82f6' },
      { name: 'تحويل بنكي', value: transferSales || 45000, color: '#8b5cf6' },
      { name: 'آجل / ذمم', value: creditSales || 30000, color: '#f59e0b' },
    ];

    // Top Selling Items
    const itemMap: Record<string, { name: string; qty: number; revenue: number }> = {};
    allTransactions.forEach(t => {
      t.items?.forEach(it => {
        if (!itemMap[it.nameAr]) {
          itemMap[it.nameAr] = { name: it.nameAr, qty: 0, revenue: 0 };
        }
        itemMap[it.nameAr].qty += it.quantity;
        itemMap[it.nameAr].revenue += it.total;
      });
    });
    let topItems = Object.values(itemMap).sort((a, b) => b.revenue - a.revenue).slice(0, 5);
    if (topItems.length === 0) {
      topItems = [
        { name: 'لابتوب ديل اتقان Pro', qty: 12, revenue: 3500000 },
        { name: 'شاشة سامسونج 27 بوصة', qty: 24, revenue: 1200000 },
        { name: 'طابعة إيصالات حرارية 80mm', qty: 18, revenue: 720000 },
        { name: 'ماوس لاسلكي لوجيتك', qty: 45, revenue: 450000 },
        { name: 'لوحة مفاتيح ميكانيكية', qty: 30, revenue: 360000 },
      ];
    }

    return {
      totalSales,
      totalTxnsCount: allTransactions.length,
      avgTicket,
      hourlyChartData,
      paymentMethodsChart,
      topItems
    };
  }, [allTransactions]);

  return (
    <div className="space-y-6" id="pos-root-container">
      {/* Header & Session Bar */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-emerald-50 text-emerald-700 rounded-xl border border-emerald-100">
            <Store className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-slate-900">نقاط البيع والمبيعات المباشرة (POS & Retail)</h1>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200">
                SD-POS نشط
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              الكاشير: <strong className="text-slate-700">{currentSession.cashierName}</strong> | الوردية:{' '}
              <strong className="text-slate-700">{currentSession.sessionNumber}</strong> | الصندوق الافتتاحي:{' '}
              {formatCurrency(currentSession.openingCash, currency, rates)}
            </p>
          </div>
        </div>

        {/* View Tabs & Action Buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={handleStartNewInvoice}
            className="px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white shadow-sm border border-emerald-500"
          >
            <Plus className="w-4 h-4" />
            <span>+ إنشاء فاتورة جديدة</span>
          </button>
          <button
            type="button"
            onClick={() => setIsThermalSettingsOpen(true)}
            className="px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 bg-slate-900 hover:bg-black text-amber-300 shadow-sm border border-slate-700 cursor-pointer active:scale-95"
            title="إعدادات طابعة الإيصالات الحرارية (80mm Thermal Printer) ومعاينة القالب"
          >
            <Printer className="w-4 h-4 text-amber-400" />
            <span>طابعة 80mm 🖨️</span>
          </button>
          <button
            type="button"
            onClick={() => setIsOcrOpen(true)}
            className="px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white shadow-sm border border-indigo-500"
            title="مسح الإيصالات والفواتير أو الباركود ضوئياً عبر الكاميرا/الملف"
          >
            <Scan className="w-4 h-4 text-amber-300" />
            <span>مسح ضوئي OCR 📷</span>
          </button>
          <button
            onClick={() => setActiveTab('pos')}
            className={`px-3 py-2 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
              activeTab === 'pos'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            <Store className="w-4 h-4" />
            شاشة الكاشير
          </button>
          <button
            onClick={() => setActiveTab('analytics')}
            className={`px-3 py-2 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
              activeTab === 'analytics'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            <BarChart3 className="w-4 h-4" />
            <span>إحصائيات POS البيانية</span>
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`px-3 py-2 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
              activeTab === 'history'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            <Receipt className="w-4 h-4" />
            سجل الفواتير ({allTransactions.length})
          </button>
          <button
            onClick={() => setActiveTab('shift')}
            className={`px-3 py-2 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
              activeTab === 'shift'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            <Clock className="w-4 h-4" />
            إقفال الوردية (Z-Report)
          </button>
        </div>
      </div>

      {/* Main Tab Views */}
      {activeTab === 'pos' && (
        <div className="space-y-4">
          {/* View Mode & Control Ribbon */}
          <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-xs">
                <Receipt className="w-4 h-4" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-black text-slate-900">
                    شاشة الفاتورة الرئيسية وإدارة الأصناف
                  </h3>
                  <span className="text-[10px] font-bold bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full border border-blue-200">
                    في قلب النظام ⚡
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 font-medium">
                  تسجيل بنود وأصناف المبيعات بدقة وحساب الضريبة والإجماليات فورياً بخط مكبر
                </p>
              </div>
            </div>

            {/* Layout Mode Switcher & Quick Modals */}
            <div className="flex items-center gap-2 flex-wrap">
              {/* Layout Switcher */}
              <div className="inline-flex p-1 bg-slate-100 rounded-xl border border-slate-200">
                <button
                  type="button"
                  onClick={() => setPosLayoutMode('PHOTO_LIST')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
                    posLayoutMode === 'PHOTO_LIST'
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'text-slate-700 hover:text-slate-900'
                  }`}
                  title="عرض الأصناف بنمط القائمة الكلاسيكية المكبرة مع الراديو والخط الواضح كما في الصورة"
                >
                  <SlidersHorizontal className="w-3.5 h-3.5" />
                  <span>قائمة الأصناف (كما بالصورة) 📱</span>
                </button>
                <button
                  type="button"
                  onClick={() => setPosLayoutMode('CORE_INVOICE')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
                    posLayoutMode === 'CORE_INVOICE'
                      ? 'bg-white text-blue-700 shadow-xs border border-slate-200'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                  title="عرض جدول الفاتورة الشامل في قلب النظام مع تفاصيل الأصناف والأسعار المكبرة"
                >
                  <TableIcon className="w-3.5 h-3.5" />
                  <span>جدول الفاتورة المكبر</span>
                </button>
                <button
                  type="button"
                  onClick={() => setPosLayoutMode('SPLIT_GRID')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
                    posLayoutMode === 'SPLIT_GRID'
                      ? 'bg-white text-blue-700 shadow-xs border border-slate-200'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                  title="عرض الكتالوج الشبكي بجانب سلة الفاتورة"
                >
                  <LayoutGrid className="w-3.5 h-3.5" />
                  <span>العرض المنقسم (شبكة)</span>
                </button>
              </div>

              {/* Browse Catalog Button */}
              <button
                type="button"
                onClick={() => setIsCatalogModalOpen(true)}
                className="px-3 py-1.5 rounded-xl text-xs font-bold bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 transition flex items-center gap-1.5 shadow-2xs cursor-pointer active:scale-95"
                title="تصفح جميع أصناف المخزون وإضافتها بضغطة زر"
              >
                <Package className="w-3.5 h-3.5 text-indigo-600" />
                <span>تصفح كتالوج الأصناف 📦</span>
              </button>

              {/* Custom Item Button */}
              <button
                type="button"
                onClick={() => setIsCustomItemModalOpen(true)}
                className="px-3 py-1.5 rounded-xl text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-200 transition flex items-center gap-1.5 shadow-2xs cursor-pointer active:scale-95"
              >
                <Plus className="w-3.5 h-3.5 text-slate-600" />
                <span>+ صنف/بند حر</span>
              </button>
            </div>
          </div>

          {/* Customer & Invoice Meta Header */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-3 items-center text-xs">
              {/* Customer Selector & Quick Modal Trigger */}
              <div className="lg:col-span-5 flex items-center gap-2 bg-slate-50 p-2 rounded-xl border border-slate-200">
                <User className="w-4 h-4 text-blue-600 shrink-0" />
                <span className="font-bold text-slate-700 shrink-0">العميل:</span>
                <select
                  value={selectedCustomer ? selectedCustomer.id : ''}
                  onChange={(e) => {
                    const cust = (customers || []).find((c) => c.id === e.target.value);
                    setSelectedCustomer(cust || null);
                  }}
                  className="flex-1 bg-white border border-slate-300 rounded-lg px-2.5 py-1 text-xs font-bold text-slate-900 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                >
                  <option value="">عميل نقدي مباشر (تجزئة / صالة)</option>
                  {(customers || []).map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.nameAr} ({c.code}) - {c.phone || 'بدون هاتف'}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={() => setIsCustomerModalOpen(true)}
                  className="px-2.5 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold text-xs shrink-0 transition flex items-center gap-1 shadow-2xs cursor-pointer"
                  title="فتح قائمة تحديد العميل المكبرة كما بالصورة"
                >
                  <span>قائمة العملاء 📋</span>
                </button>
              </div>

              {/* Warehouse & Branch */}
              <div className="lg:col-span-3 flex items-center gap-2 bg-slate-50 p-2 rounded-xl border border-slate-200 text-slate-600">
                <Building className="w-4 h-4 text-slate-500 shrink-0" />
                <span className="font-bold text-slate-700">المستودع:</span>
                <span className="font-mono font-bold text-slate-900 bg-white px-2 py-0.5 rounded border border-slate-200 text-xs">
                  {currentSession.warehouseId || 'WH-01'}
                </span>
                <span className="text-slate-400">|</span>
                <span className="text-slate-500 font-medium">الفرع:</span>
                <span className="font-mono font-bold text-slate-900">{currentSession.branchId}</span>
              </div>

              {/* Global Additional Discount */}
              <div className="lg:col-span-2 flex items-center gap-2 bg-slate-50 p-2 rounded-xl border border-slate-200">
                <Percent className="w-4 h-4 text-emerald-600 shrink-0" />
                <span className="font-bold text-slate-700 shrink-0">خصم عام:</span>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={globalDiscountPct || ''}
                  onChange={(e) => setGlobalDiscountPct(Math.min(100, Math.max(0, Number(e.target.value))))}
                  placeholder="0%"
                  className="w-16 bg-white border border-slate-300 rounded-lg px-2 py-1 text-xs font-black text-center focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
                <span className="text-slate-500 font-bold">%</span>
              </div>

              {/* Status Indicator */}
              <div className="lg:col-span-2 flex items-center justify-end gap-2">
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-200 font-black text-xs">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                  جلسة نشطة
                </span>
              </div>
            </div>
          </div>

          {/* Routine & Fast Item Entry Bar (In the heart of the system) */}
          <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 text-white p-4 rounded-2xl shadow-md space-y-3 border border-blue-700">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-lg bg-amber-400 text-slate-950 flex items-center justify-center font-bold text-xs shadow-xs">
                  ⚡
                </div>
                <h4 className="text-xs sm:text-sm font-black text-amber-300">
                  شريط إدخال الأصناف والباركود في قلب الفاتورة (Fast Item & Barcode Stream)
                </h4>
              </div>
              <span className="text-[11px] text-slate-300 font-medium hidden sm:inline">
                مسح الباركود، أو البحث بالاسم، أو إدخال السعر والكمية واضغط <kbd className="bg-slate-800 text-amber-300 px-1.5 py-0.5 rounded text-[10px] font-mono border border-slate-700">Enter ⏎</kbd>
              </span>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-3">
              {/* Barcode Fast Reader */}
              <form onSubmit={handleBarcodeSubmit} className="lg:col-span-4 flex gap-1.5">
                <div className="relative flex-1">
                  <Barcode className="w-4 h-4 absolute right-3 top-3 text-slate-400" />
                  <input
                    ref={barcodeInputRef}
                    type="text"
                    value={barcodeInput}
                    onChange={(e) => setBarcodeInput(e.target.value)}
                    onKeyDown={(e) => e.stopPropagation()}
                    placeholder="مسح باركود الصنف واضغط Enter..."
                    className="w-full pl-3 pr-9 py-2 text-sm bg-slate-800/90 text-white placeholder:text-slate-400 border border-blue-500/50 rounded-xl focus:ring-2 focus:ring-amber-400 focus:border-amber-400 font-mono font-bold"
                  />
                </div>
                <button
                  type="submit"
                  className="px-3.5 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-xl text-xs font-black transition shrink-0 shadow-sm cursor-pointer"
                >
                  إضافة
                </button>
              </form>

              {/* Name / Auto-Complete Search & Rapid Add */}
              <form onSubmit={handleRoutineAddFastItem} className="lg:col-span-8 grid grid-cols-1 sm:grid-cols-12 gap-2">
                {/* Search / Dropdown */}
                <div className="sm:col-span-6 relative">
                  <div className="relative">
                    <input
                      ref={fastItemInputRef}
                      type="text"
                      value={fastSearchQuery}
                      onChange={(e) => {
                        setFastSearchQuery(e.target.value);
                        setIsFastDropdownOpen(true);
                      }}
                      onFocus={() => setIsFastDropdownOpen(true)}
                      onKeyDown={(e) => {
                        e.stopPropagation();
                        if (e.key === 'Escape') setIsFastDropdownOpen(false);
                      }}
                      placeholder="اكتب اسم الصنف أو كوده لإدراجه..."
                      className="w-full bg-slate-800/90 text-white placeholder:text-slate-400 border border-blue-500/50 focus:border-amber-400 rounded-xl pr-8 pl-3 py-2 text-xs font-bold focus:ring-2 focus:ring-amber-400 focus:outline-none"
                    />
                    <Search className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-2.5" />
                    {fastSearchQuery && (
                      <button
                        type="button"
                        onClick={() => {
                          setFastSearchQuery('');
                          setSelectedFastItem(null);
                        }}
                        className="absolute left-2.5 top-2.5 text-slate-400 hover:text-white"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>

                  {isFastDropdownOpen && matchingFastItemsRanked.length > 0 && (
                    <div
                      className="absolute z-40 top-full mt-1 right-0 left-0 bg-white text-slate-900 border border-slate-200 rounded-xl shadow-2xl max-h-64 overflow-y-auto divide-y divide-slate-100 animate-in fade-in"
                      onMouseDown={(e) => e.preventDefault()}
                    >
                      <div className="p-2 bg-slate-50 border-b border-slate-100 flex items-center justify-between text-[11px] text-slate-500 font-bold">
                        <span>⚡ انقر على أي صنف لإدراجه فوراً في الفاتورة</span>
                        <span>{matchingFastItemsRanked.length} أصناف مطابقة</span>
                      </div>
                      {matchingFastItemsRanked.map(({ item: itm, score, isExact, matchReasons }) => (
                        <div
                          key={itm.id}
                          onClick={() => handleSelectFastItem(itm, true)}
                          className="p-2.5 hover:bg-blue-50 cursor-pointer flex items-center justify-between text-xs transition group"
                        >
                          <div className="flex items-center gap-2.5">
                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs shrink-0 transition ${
                              isExact || score >= 90
                                ? 'bg-amber-100 text-amber-900 group-hover:bg-amber-500 group-hover:text-slate-950'
                                : 'bg-blue-100/70 text-blue-700 group-hover:bg-blue-600 group-hover:text-white'
                            }`}>
                              <Package className="w-4 h-4" />
                            </div>
                            <div>
                              <div className="flex items-center gap-1.5">
                                <p className="font-extrabold text-slate-900 group-hover:text-blue-700 transition">
                                  <HighlightedText text={itm.nameAr} highlight={fastSearchQuery} />
                                </p>
                                {isExact && (
                                  <span className="px-1.5 py-0.2 bg-emerald-100 text-emerald-800 text-[10px] rounded-md font-black">
                                    مطابقة تامة
                                  </span>
                                )}
                              </div>
                              <div className="text-[10px] text-slate-500 font-mono flex flex-wrap items-center gap-1.5 mt-0.5">
                                <span>كود:</span>
                                <span className="font-bold text-blue-700">
                                  <HighlightedText text={itm.code} highlight={fastSearchQuery} />
                                </span>
                                {itm.barcode && (
                                  <>
                                    <span>|</span>
                                    <span>باركود:</span>
                                    <span className="font-mono text-slate-600">
                                      <HighlightedText text={itm.barcode} highlight={fastSearchQuery} />
                                    </span>
                                  </>
                                )}
                                <span>|</span>
                                <span>رصيد:</span>
                                <span
                                  className={`px-1 py-0.2 rounded font-bold ${
                                    itm.quantity > 5
                                      ? 'bg-emerald-100 text-emerald-800'
                                      : itm.quantity > 0
                                      ? 'bg-amber-100 text-amber-800'
                                      : 'bg-rose-100 text-rose-800'
                                  }`}
                                >
                                  {itm.quantity} {itm.unit}
                                </span>
                              </div>
                            </div>
                          </div>
                          <div className="text-left shrink-0">
                            <div className="font-mono font-black text-blue-700 text-sm">
                              {formatCurrency(itm.salePrice, currency, rates)}
                            </div>
                            <span className="text-[10px] text-emerald-600 font-bold group-hover:underline flex items-center justify-end gap-0.5">
                              <span>إدراج +</span>
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Draft Qty */}
                <div className="sm:col-span-2">
                  <input
                    type="number"
                    min="0.01"
                    step="any"
                    value={fastDraftQty}
                    onChange={(e) => setFastDraftQty(Math.max(0.01, parseFloat(e.target.value) || 1))}
                    onKeyDown={(e) => e.stopPropagation()}
                    placeholder="الكمية"
                    className="w-full bg-slate-800 text-white border border-blue-500/50 text-center py-2 text-xs font-mono font-bold rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-400"
                  />
                </div>

                {/* Draft Price */}
                <div className="sm:col-span-2">
                  <input
                    type="number"
                    min="0"
                    step="any"
                    value={fastDraftPrice || ''}
                    onChange={(e) => setFastDraftPrice(Math.max(0, parseFloat(e.target.value) || 0))}
                    onKeyDown={(e) => e.stopPropagation()}
                    placeholder="السعر"
                    className="w-full bg-slate-800 text-white border border-blue-500/50 text-left px-2 py-2 text-xs font-mono font-bold rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-400"
                  />
                </div>

                {/* Draft Submit */}
                <div className="sm:col-span-2">
                  <button
                    type="submit"
                    className="w-full py-2 px-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 active:scale-95 text-white rounded-xl text-xs font-black transition flex items-center justify-center gap-1 shadow-xs cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>أضف للفاتورة ⏎</span>
                  </button>
                </div>
              </form>
            </div>
          </div>

          {/* MAIN INVOICE WORKSPACE (PHOTO_LIST vs CORE vs SPLIT MODE) */}
          {posLayoutMode === 'PHOTO_LIST' ? (
            /* ========================================================================= */
            /* 1. PHOTO_LIST VIEW (نمط قائمة الأصناف الكلاسيكية المكبرة كما في الصورة)    */
            /* ========================================================================= */
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start animate-in fade-in">
              {/* Left / Main: Products Vertical List with Radio & Big Font (7 Cols) */}
              <div className="lg:col-span-7 space-y-4">
                {/* Search & Category Header */}
                <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-3">
                  <form onSubmit={handleProductSearchSubmit} className="flex flex-col sm:flex-row gap-2">
                    <div className="relative flex-1">
                      <Search className="w-5 h-5 text-slate-400 absolute right-3.5 top-3.5" />
                      <input
                        type="text"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        placeholder="ابحث باسم الصنف، الكود، أو الباركود واضغط Enter للإدراج..."
                        className="w-full pl-10 pr-11 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-bold text-slate-900 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                      />
                      {searchTerm && (
                        <button
                          type="button"
                          onClick={() => setSearchTerm('')}
                          className="absolute left-3 top-3 text-slate-400 hover:text-slate-700"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                    <button
                      type="submit"
                      className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 active:scale-95 text-white rounded-xl text-xs font-black transition flex items-center justify-center gap-1.5 shadow-sm cursor-pointer whitespace-nowrap"
                    >
                      <Plus className="w-4 h-4" />
                      <span>إدراج المطابق للفاتورة ⏎</span>
                    </button>
                  </form>

                  {/* Categories Filter */}
                  <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none text-xs">
                    {categories.map((cat) => (
                      <button
                        key={cat}
                        type="button"
                        onClick={() => setSelectedCategory(cat)}
                        className={`px-3.5 py-1.5 rounded-full font-bold whitespace-nowrap transition cursor-pointer ${
                          selectedCategory === cat
                            ? 'bg-blue-600 text-white shadow-xs'
                            : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                        }`}
                      >
                        {cat === 'ALL' ? 'جميع الأصناف' : cat}
                      </button>
                    ))}
                  </div>
                </div>

                {/* THE VERTICAL ITEMS LIST (IDENTICAL TO USER SCREENSHOT) */}
                <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden divide-y divide-slate-200 max-h-[640px] overflow-y-auto">
                  {filteredProducts.length === 0 ? (
                    <div className="py-16 text-center text-slate-400 p-6 space-y-2">
                      <Package className="w-10 h-10 mx-auto text-slate-300 stroke-[1.5]" />
                      <p className="text-sm font-bold">لا توجد أصناف مطابقة للبحث</p>
                    </div>
                  ) : (
                    filteredProducts.map((product) => {
                      const inCart = cart.find((i) => i.itemId === product.id);
                      const isOutOfStock = product.quantity <= 0;

                      return (
                        <div
                          key={product.id}
                          onClick={() => !isOutOfStock && handleAddToCart(product)}
                          className={`py-4 px-4 sm:px-6 transition flex items-center justify-between gap-4 cursor-pointer text-right group ${
                            isOutOfStock
                              ? 'bg-slate-50 opacity-60 cursor-not-allowed'
                              : inCart
                              ? 'bg-blue-50/70 hover:bg-blue-100/70'
                              : 'bg-white hover:bg-slate-50'
                          }`}
                        >
                          {/* Radio / Check circle indicator matching user screenshot */}
                          <div className="shrink-0">
                            {inCart ? (
                              <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full border-2 border-blue-600 bg-blue-600 flex items-center justify-center shadow-xs transition">
                                <div className="w-2.5 h-2.5 rounded-full bg-white" />
                              </div>
                            ) : (
                              <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full border-2 border-slate-400 group-hover:border-blue-500 flex items-center justify-center transition" />
                            )}
                          </div>

                          {/* Large Typography: Name on Top, Subtitle with Code & Details below */}
                          <div className="flex-1 text-right space-y-1">
                            <h4 className="text-lg sm:text-2xl font-black text-slate-900 leading-snug group-hover:text-blue-700 transition">
                              {product.nameAr}
                            </h4>
                            <div className="text-sm sm:text-lg font-bold font-mono text-slate-800 tracking-wide flex flex-wrap items-center gap-1.5 sm:gap-2">
                              <span className="text-blue-700 font-black">
                                {formatCurrency(product.salePrice, currency, rates)}
                              </span>
                              <span className="text-slate-400">-</span>
                              <span className="text-slate-700 font-mono">({product.code})</span>
                              {product.barcode && (
                                <>
                                  <span className="text-slate-400">-</span>
                                  <span className="text-slate-500 font-mono text-xs sm:text-base">
                                    {product.barcode}
                                  </span>
                                </>
                              )}
                              <span className="text-slate-400">-</span>
                              <span
                                className={`text-xs sm:text-sm font-bold ${
                                  product.quantity > 0 ? 'text-emerald-700' : 'text-rose-600'
                                }`}
                              >
                                {product.quantity > 0
                                  ? `المتوفر: ${product.quantity} ${product.unit}`
                                  : 'نفذ المخزون'}
                              </span>
                            </div>
                          </div>

                          {/* In-cart count or plus button */}
                          <div className="shrink-0 flex items-center gap-2">
                            {inCart ? (
                              <span className="px-3 py-1 bg-blue-600 text-white font-black text-xs sm:text-sm rounded-full shadow-2xs">
                                {inCart.quantity} بالفاتورة
                              </span>
                            ) : (
                              <div className="w-8 h-8 rounded-xl bg-slate-100 group-hover:bg-blue-600 group-hover:text-white text-slate-600 flex items-center justify-center transition shadow-2xs font-bold text-sm">
                                <Plus className="w-4 h-4" />
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

              {/* Right: Cart Summary & Checkout Action Column (5 Cols) */}
              <div className="lg:col-span-5 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between min-h-[640px] space-y-4">
                <div className="space-y-4">
                  {/* Cart Header */}
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                    <div className="flex items-center gap-2">
                      <ShoppingCart className="w-5 h-5 text-blue-600" />
                      <h3 className="font-bold text-slate-900 text-base">سلة الفاتورة الحالية</h3>
                      <span className="text-xs bg-blue-50 text-blue-800 px-2.5 py-0.5 rounded-full font-bold border border-blue-200">
                        {cart.reduce((a, b) => a + b.quantity, 0)} قطعة
                      </span>
                    </div>
                    {cart.length > 0 && (
                      <button
                        type="button"
                        onClick={handleClearCart}
                        className="text-xs text-rose-600 hover:text-rose-700 flex items-center gap-1 font-medium cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>إفراغ</span>
                      </button>
                    )}
                  </div>

                  {/* Cart Items List */}
                  <div className="max-h-[340px] overflow-y-auto space-y-2 pr-1 divide-y divide-slate-100">
                    {cart.length === 0 ? (
                      <div className="text-center py-14 text-slate-400 space-y-2">
                        <ShoppingCart className="w-10 h-10 mx-auto stroke-[1.5] text-slate-300" />
                        <p className="text-xs font-bold">السلة فارغة، اختر الأصناف من القائمة بالضغط عليها</p>
                      </div>
                    ) : (
                      cart.map((item) => {
                        const originalItem = (inventoryItems || []).find((i) => i.id === item.itemId);
                        const effectiveCost = item.costPrice || originalItem?.costPrice || 0;

                        return (
                          <div key={item.itemId} className="pt-3 pb-2 flex flex-col gap-2">
                            <div className="flex items-center justify-between gap-2">
                              <div className="flex-1 text-right">
                                <h5 className="text-sm font-black text-slate-900 leading-snug">{item.nameAr}</h5>
                                <div className="flex items-center gap-2 mt-0.5">
                                  <span className="text-xs text-slate-500 font-mono">
                                    {formatCurrency(item.unitPrice, currency, rates)} / {item.unit}
                                  </span>
                                  <span className="text-[10px] text-slate-400 font-mono">
                                    (شراء: {formatCurrency(effectiveCost, currency, rates)})
                                  </span>
                                </div>
                              </div>

                              {/* Quantity Controls */}
                              <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl">
                                <button
                                  type="button"
                                  onClick={() => handleUpdateQuantity(item.itemId, -1)}
                                  className="w-6 h-6 rounded-lg bg-white hover:bg-slate-200 text-slate-700 flex items-center justify-center font-bold text-xs shadow-2xs"
                                >
                                  <Minus className="w-3.5 h-3.5" />
                                </button>
                                <span className="w-7 text-center text-xs font-mono font-black text-slate-900">
                                  {item.quantity}
                                </span>
                                <button
                                  type="button"
                                  onClick={() => handleUpdateQuantity(item.itemId, 1)}
                                  className="w-6 h-6 rounded-lg bg-white hover:bg-slate-200 text-slate-700 flex items-center justify-center font-bold text-xs shadow-2xs"
                                >
                                  <Plus className="w-3.5 h-3.5" />
                                </button>
                              </div>

                              {/* Item Total */}
                              <div className="text-left font-black text-sm text-slate-900 min-w-[70px] font-mono">
                                {formatCurrency(item.total, currency, rates)}
                              </div>
                              <button
                                type="button"
                                onClick={() => handleRemoveFromCart(item.itemId)}
                                className="text-slate-400 hover:text-rose-600 p-1 cursor-pointer"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            </div>

                            {/* Profit Margin Immediate Indicator & Calculator Trigger */}
                            <div className="flex items-center justify-between pt-1 border-t border-slate-50">
                              <ProfitMarginBadge
                                costPrice={effectiveCost}
                                salePrice={item.unitPrice}
                                quantity={item.quantity}
                                discountPercent={item.discountPercent || 0}
                                currency={currency}
                                rates={rates}
                                showCost={true}
                                onOpenCalculator={() =>
                                  handleOpenMarginCalculator({
                                    itemId: item.itemId,
                                    itemCode: item.itemCode,
                                    nameAr: item.nameAr,
                                    costPrice: effectiveCost,
                                    unitPrice: item.unitPrice,
                                    quantity: item.quantity,
                                    unit: item.unit,
                                    discountPercent: item.discountPercent,
                                  })
                                }
                              />
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>

                {/* Cart Financial Summary & Action Buttons */}
                <div className="pt-4 border-t border-slate-200 space-y-3">
                  <div className="space-y-1.5 text-xs text-slate-600">
                    <div className="flex justify-between">
                      <span>المجموع الفرعي:</span>
                      <span className="font-bold text-slate-900 font-mono">{formatCurrency(cartSubtotal, currency, rates)}</span>
                    </div>
                    {cartDiscountAmount > 0 && (
                      <div className="flex justify-between text-emerald-600">
                        <span>الخصم:</span>
                        <span className="font-bold font-mono">-{formatCurrency(cartDiscountAmount, currency, rates)}</span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span>ضريبة (5% VAT):</span>
                      <span className="font-bold text-slate-900 font-mono">{formatCurrency(cartTaxAmount, currency, rates)}</span>
                    </div>
                    <div className="flex justify-between text-lg font-black text-slate-900 pt-2 border-t border-slate-200">
                      <span>الإجمالي الصافي:</span>
                      <span className="text-blue-700 font-mono">{formatCurrency(cartGrandTotal, currency, rates)}</span>
                    </div>
                  </div>

                  <div className="space-y-2 pt-2">
                    <button
                      disabled={cart.length === 0}
                      onClick={handleInstantQuickPrintSale}
                      className={`w-full py-3 px-4 rounded-xl font-black text-xs transition flex items-center justify-center gap-2 cursor-pointer shadow-md ${
                        cart.length === 0
                          ? 'bg-slate-200 text-slate-400 cursor-not-allowed shadow-none'
                          : 'bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 text-slate-950 shadow-amber-200 active:scale-95'
                      }`}
                    >
                      <Zap className="w-4 h-4 text-slate-950 fill-current" />
                      <span>طباعة حرارية فورية 80mm ⚡</span>
                    </button>

                    <button
                      disabled={cart.length === 0}
                      onClick={handleOpenCheckout}
                      className={`w-full py-3.5 px-4 rounded-xl font-black text-sm transition flex items-center justify-center gap-2 cursor-pointer shadow-md ${
                        cart.length === 0
                          ? 'bg-slate-200 text-slate-400 cursor-not-allowed shadow-none'
                          : 'bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 text-white shadow-emerald-200 active:scale-95'
                      }`}
                    >
                      <CreditCard className="w-5 h-5" />
                      <span>سداد الفاتورة واعتماد العملية (F9)</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ) : posLayoutMode === 'CORE_INVOICE' ? (
            /* ========================================================================= */
            /* 2. CORE ENTERPRISE INVOICE WORKSPACE (الأصناف في قلب شاشة الفاتورة المكبرة) */
            /* ========================================================================= */
            <div className="space-y-4 animate-in fade-in">
              {/* Grand Line-Items Master Table */}
              <div className="bg-white rounded-2xl border-2 border-slate-200 shadow-sm overflow-hidden">
                <div className="p-4 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <ShoppingCart className="w-5 h-5 text-blue-600" />
                    <h3 className="text-base font-black text-slate-900">
                      جدول بنود وأصناف الفاتورة التفصيلي (Invoice Items Master Ledger)
                    </h3>
                    <span className="text-xs bg-blue-100 text-blue-800 font-bold px-2.5 py-0.5 rounded-full border border-blue-200">
                      {cart.length} أصناف مسجلة ({cart.reduce((a, b) => a + b.quantity, 0)} قطعة)
                    </span>
                  </div>

                  {cart.length > 0 && (
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={handleClearCart}
                        className="text-xs text-rose-600 hover:text-rose-700 hover:bg-rose-50 px-2.5 py-1 rounded-lg border border-rose-200 font-bold transition flex items-center gap-1 cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>تفريغ الفاتورة</span>
                      </button>
                    </div>
                  )}
                </div>

                {/* Table with Enlarged System Typography */}
                <div className="overflow-x-auto">
                  <table className="w-full text-right border-collapse">
                    <thead>
                      <tr className="bg-slate-100 text-slate-700 text-xs font-black border-b border-slate-200">
                        <th className="py-3 px-3 w-12 text-center">#</th>
                        <th className="py-3 px-4 min-w-[260px]">الصنف والباركود (Item & Code)</th>
                        <th className="py-3 px-3 text-center min-w-[90px]">الوحدة</th>
                        <th className="py-3 px-4 text-center min-w-[170px]">الكمية (Quantity)</th>
                        <th className="py-3 px-4 text-center min-w-[130px]">سعر الوحدة</th>
                        <th className="py-3 px-3 text-center min-w-[150px]">التكلفة وهامش الربح ⚡</th>
                        <th className="py-3 px-3 text-center min-w-[100px]">الخصم %</th>
                        <th className="py-3 px-3 text-center min-w-[110px]">ضريبة 5%</th>
                        <th className="py-3 px-4 text-left min-w-[150px]">الإجمالي الصافي</th>
                        <th className="py-3 px-3 text-center w-12">حذف</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {cart.length === 0 ? (
                        <tr>
                          <td colSpan={10} className="py-16 text-center bg-slate-50/50">
                            <div className="max-w-md mx-auto space-y-4">
                              <div className="w-16 h-16 rounded-2xl bg-blue-50 border border-blue-200 text-blue-600 flex items-center justify-center mx-auto shadow-xs">
                                <ShoppingCart className="w-8 h-8 stroke-[1.5]" />
                              </div>
                              <div className="space-y-1">
                                <h4 className="text-base font-black text-slate-900">
                                  الفاتورة فارغة حالياً - جاهزة لإدراج الأصناف في قلب النظام
                                </h4>
                                <p className="text-xs text-slate-500 leading-relaxed">
                                  امسح الباركود، أو اكتب اسم الصنف في الشريط العلوي، أو اختر بنقرة سريعة من قائمة الأصناف الشائعة:
                                </p>
                              </div>

                              {/* Quick 1-Click Popular Products Chips */}
                              <div className="pt-2 flex flex-wrap items-center justify-center gap-2">
                                {(inventoryItems || []).slice(0, 6).map((prod) => (
                                  <button
                                    key={prod.id}
                                    type="button"
                                    onClick={() => handleAddToCart(prod)}
                                    className="text-xs bg-white hover:bg-blue-50 text-slate-800 hover:text-blue-700 border border-slate-300 hover:border-blue-300 px-3 py-1.5 rounded-xl font-bold transition flex items-center gap-1.5 shadow-2xs cursor-pointer active:scale-95"
                                  >
                                    <Plus className="w-3 h-3 text-blue-600" />
                                    <span>{prod.nameAr}</span>
                                    <span className="text-[10px] text-slate-400 font-mono">({formatCurrency(prod.salePrice, currency, rates)})</span>
                                  </button>
                                ))}
                              </div>

                              <div className="pt-2">
                                <button
                                  type="button"
                                  onClick={() => setIsCatalogModalOpen(true)}
                                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-black transition inline-flex items-center gap-1.5 shadow-sm active:scale-95 cursor-pointer"
                                >
                                  <Package className="w-4 h-4" />
                                  <span>فتح كتالوج الأصناف الكامل (تصفح وبحث)</span>
                                </button>
                              </div>
                            </div>
                          </td>
                        </tr>
                      ) : (
                        cart.map((item, index) => {
                          const originalItem = (inventoryItems || []).find((i) => i.id === item.itemId);
                          const effectiveCost = item.costPrice || originalItem?.costPrice || 0;

                          return (
                            <tr
                              key={item.itemId}
                              className="hover:bg-blue-50/40 transition-colors group"
                            >
                              {/* Index */}
                              <td className="py-4 px-3 text-center">
                                <span className="w-7 h-7 rounded-full bg-slate-100 text-slate-700 font-mono font-bold text-xs inline-flex items-center justify-center border border-slate-200">
                                  {index + 1}
                                </span>
                              </td>

                              {/* Item Name & Barcode (Large System Font) */}
                              <td className="py-4 px-4">
                                <div className="space-y-1">
                                  <div className="flex items-center gap-2">
                                    <span className="text-base font-black text-slate-900 leading-snug">
                                      {item.nameAr}
                                    </span>
                                  </div>
                                  <div className="flex items-center gap-2 text-[11px] text-slate-500 font-mono">
                                    <span className="bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200 font-bold text-slate-700">
                                      {item.itemCode}
                                    </span>
                                    {originalItem?.barcode && (
                                      <span className="text-slate-400 flex items-center gap-0.5">
                                        <Barcode className="w-3 h-3 text-slate-400" />
                                        {originalItem.barcode}
                                      </span>
                                    )}
                                    {originalItem && (
                                      <span className="text-[10px] text-slate-400">
                                        (المتوفر: {originalItem.quantity} {originalItem.unit})
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </td>

                              {/* Unit */}
                              <td className="py-4 px-3 text-center">
                                <span className="text-xs font-bold text-slate-700 bg-slate-100 px-2.5 py-1 rounded-md border border-slate-200">
                                  {item.unit || 'حبة'}
                                </span>
                              </td>

                              {/* Quantity Controls (Large Touch Buttons & Direct Input) */}
                              <td className="py-4 px-4 text-center">
                                <div className="inline-flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl border border-slate-300">
                                  <button
                                    type="button"
                                    onClick={() => handleUpdateQuantity(item.itemId, -1)}
                                    className="w-8 h-8 rounded-lg bg-white hover:bg-rose-100 hover:text-rose-700 text-slate-700 flex items-center justify-center font-black text-sm shadow-2xs transition cursor-pointer"
                                    title="إنقاص الكمية (-1)"
                                  >
                                    <Minus className="w-4 h-4" />
                                  </button>
                                  <input
                                    type="number"
                                    min="0.01"
                                    step="any"
                                    value={item.quantity}
                                    onChange={(e) => handleSetExactQuantity(item.itemId, parseFloat(e.target.value) || 1)}
                                    className="w-16 text-center text-base font-black font-mono text-slate-900 bg-white border border-slate-200 rounded-lg py-1 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                                  />
                                  <button
                                    type="button"
                                    onClick={() => handleUpdateQuantity(item.itemId, 1)}
                                    className="w-8 h-8 rounded-lg bg-white hover:bg-emerald-100 hover:text-emerald-700 text-slate-700 flex items-center justify-center font-black text-sm shadow-2xs transition cursor-pointer"
                                    title="زيادة الكمية (+1)"
                                  >
                                    <Plus className="w-4 h-4" />
                                  </button>
                                </div>
                              </td>

                              {/* Unit Price (Editable or View) */}
                              <td className="py-4 px-4 text-center">
                                <div className="inline-flex items-center gap-1 font-mono">
                                  <input
                                    type="number"
                                    min="0"
                                    step="any"
                                    value={item.unitPrice}
                                    onChange={(e) => handleSetItemPrice(item.itemId, parseFloat(e.target.value) || 0)}
                                    className="w-24 text-left font-mono font-black text-sm text-slate-900 bg-slate-50 hover:bg-white focus:bg-white border border-slate-200 rounded-lg px-2 py-1 focus:ring-1 focus:ring-blue-500 focus:outline-none"
                                  />
                                  <span className="text-[10px] text-slate-400 font-bold">{currency}</span>
                                </div>
                              </td>

                              {/* Cost Price & Profit Margin Calculator Badge */}
                              <td className="py-4 px-3 text-center">
                                <ProfitMarginBadge
                                  costPrice={effectiveCost}
                                  salePrice={item.unitPrice}
                                  quantity={item.quantity}
                                  discountPercent={item.discountPercent || 0}
                                  currency={currency}
                                  rates={rates}
                                  showCost={true}
                                  onOpenCalculator={() =>
                                    handleOpenMarginCalculator({
                                      itemId: item.itemId,
                                      itemCode: item.itemCode,
                                      nameAr: item.nameAr,
                                      costPrice: effectiveCost,
                                      unitPrice: item.unitPrice,
                                      quantity: item.quantity,
                                      unit: item.unit,
                                      discountPercent: item.discountPercent,
                                    })
                                  }
                                />
                              </td>

                              {/* Discount % Input */}
                              <td className="py-4 px-3 text-center">
                                <div className="inline-flex items-center gap-1 font-mono">
                                  <input
                                    type="number"
                                    min="0"
                                    max="100"
                                    value={item.discountPercent || ''}
                                    onChange={(e) => handleSetItemDiscount(item.itemId, parseFloat(e.target.value) || 0)}
                                    placeholder="0"
                                    className="w-14 text-center font-mono font-bold text-xs text-slate-800 bg-slate-50 hover:bg-white focus:bg-white border border-slate-200 rounded-lg py-1 focus:ring-1 focus:ring-blue-500 focus:outline-none"
                                  />
                                  <span className="text-xs text-slate-400">%</span>
                                </div>
                              </td>

                              {/* Tax 5% Amount */}
                              <td className="py-4 px-3 text-center">
                                <span className="font-mono text-xs font-bold text-slate-600 bg-slate-50 px-2 py-1 rounded border border-slate-200">
                                  {formatCurrency(item.taxAmount, currency, rates)}
                                </span>
                              </td>

                              {/* Line Total (Large Prominent Font) */}
                              <td className="py-4 px-4 text-left">
                                <span className="text-base sm:text-lg font-black text-blue-800 font-mono tracking-tight">
                                  {formatCurrency(item.total, currency, rates)}
                                </span>
                              </td>

                              {/* Delete Action */}
                              <td className="py-4 px-3 text-center">
                                <button
                                  type="button"
                                  onClick={() => handleRemoveFromCart(item.itemId)}
                                  className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition cursor-pointer"
                                  title="حذف هذا البند من الفاتورة"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Bottom Enterprise Financial Command Center & Action Controls */}
              <div className="bg-white p-5 rounded-2xl border-2 border-slate-200 shadow-sm space-y-5">
                {/* 5 Enterprise Metric Cards */}
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
                  {/* Total Units */}
                  <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                    <span className="text-[11px] font-bold text-slate-500 block mb-1">
                      إجمالي البنود والقطع:
                    </span>
                    <div className="text-base sm:text-lg font-black text-slate-900 font-mono">
                      {cart.length} أصناف <span className="text-xs text-slate-400">({cart.reduce((a, b) => a + b.quantity, 0)} قطعة)</span>
                    </div>
                  </div>

                  {/* Net Subtotal */}
                  <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                    <span className="text-[11px] font-bold text-slate-500 block mb-1">
                      المجموع قبل الضريبة:
                    </span>
                    <div className="text-base sm:text-lg font-black text-slate-900 font-mono">
                      {formatCurrency(cartSubtotal, currency, rates)}
                    </div>
                  </div>

                  {/* Discounts */}
                  <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                    <span className="text-[11px] font-bold text-slate-500 block mb-1">
                      إجمالي الخصم الممنوح:
                    </span>
                    <div className="text-base sm:text-lg font-black text-emerald-700 font-mono">
                      {cartDiscountAmount > 0 ? `-${formatCurrency(cartDiscountAmount, currency, rates)}` : '0.00'}
                    </div>
                  </div>

                  {/* VAT Amount */}
                  <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                    <span className="text-[11px] font-bold text-slate-500 block mb-1">
                      ضريبة القيمة المضافة (5%):
                    </span>
                    <div className="text-base sm:text-lg font-black text-blue-700 font-mono">
                      {formatCurrency(cartTaxAmount, currency, rates)}
                    </div>
                  </div>

                  {/* Gross Profit & Margin % Card */}
                  <div className={`p-3.5 rounded-xl border ${
                    cartTotalNetProfit >= 0
                      ? 'bg-emerald-50/80 border-emerald-300'
                      : 'bg-rose-50/80 border-rose-300'
                  }`}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[11px] font-bold text-slate-700 flex items-center gap-1">
                        <Calculator className="w-3.5 h-3.5 text-emerald-700" />
                        هامش الربح الإجمالي:
                      </span>
                      <span className={`text-[10px] font-black px-1.5 py-0.5 rounded ${
                        cartTotalMarginPercent >= 20
                          ? 'bg-emerald-200 text-emerald-900'
                          : cartTotalMarginPercent >= 0
                          ? 'bg-amber-100 text-amber-900'
                          : 'bg-rose-200 text-rose-900'
                      }`}>
                        {cartTotalMarginPercent.toFixed(1)}%
                      </span>
                    </div>
                    <div className={`text-base sm:text-lg font-black font-mono ${
                      cartTotalNetProfit >= 0 ? 'text-emerald-800' : 'text-rose-700'
                    }`}>
                      {cartTotalNetProfit >= 0 ? '+' : ''}{formatCurrency(cartTotalNetProfit, currency, rates)}
                    </div>
                    <span className="text-[10px] text-slate-500 font-mono block mt-0.5">
                      التكلفة: {formatCurrency(cartTotalCost, currency, rates)}
                    </span>
                  </div>
                </div>

                {/* Grand Total Hero Banner (Massive System Typography) */}
                <div className="p-5 rounded-2xl bg-gradient-to-r from-emerald-100/90 via-teal-50 to-emerald-100 border-2 border-emerald-400 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div className="space-y-1 text-right w-full sm:w-auto">
                    <span className="text-xs font-black text-emerald-900 flex items-center gap-1.5">
                      <Sparkles className="w-4 h-4 text-emerald-700" />
                      المبلغ الإجمالي النهائي المطلوب سداده (صافي شامل الضريبة):
                    </span>
                    <p className="text-[11px] text-emerald-800 font-medium">
                      جاهز لإصدار الفاتورة الضريبية المبسطة وكود TLV QR المعتمد
                    </p>
                  </div>

                  <div className="text-left w-full sm:w-auto">
                    <span className="text-3xl sm:text-4xl font-black text-emerald-950 font-mono tracking-tight">
                      {formatCurrency(cartGrandTotal, currency, rates)}
                    </span>
                  </div>
                </div>

                {/* Main Action Buttons Bar */}
                <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-4 gap-3 pt-2">
                  <button
                    disabled={cart.length === 0}
                    onClick={handleInstantQuickPrintSale}
                    className={`py-3.5 px-4 rounded-xl font-black text-sm transition flex items-center justify-center gap-2 cursor-pointer shadow-md ${
                      cart.length === 0
                        ? 'bg-slate-200 text-slate-400 cursor-not-allowed shadow-none'
                        : 'bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 shadow-amber-200 active:scale-95'
                    }`}
                    title="إتمام العملية نقداً وفتح نافذة طابعة الإيصالات الحرارية مباشرة"
                  >
                    <Zap className="w-5 h-5 text-slate-950 fill-current" />
                    <span>طباعة حرارية فورية 80mm ⚡</span>
                  </button>

                  <button
                    disabled={cart.length === 0}
                    onClick={handleOpenCheckout}
                    className={`py-3.5 px-4 rounded-xl font-black text-sm transition flex items-center justify-center gap-2 cursor-pointer shadow-md sm:col-span-2 ${
                      cart.length === 0
                        ? 'bg-slate-200 text-slate-400 cursor-not-allowed shadow-none'
                        : 'bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 text-white shadow-emerald-200 active:scale-95'
                    }`}
                  >
                    <CreditCard className="w-5 h-5" />
                    <span>سداد الفاتورة واعتماد العملية (F9)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setIsCatalogModalOpen(true)}
                    className="py-3.5 px-4 rounded-xl font-bold text-xs bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-300 transition flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <Package className="w-4 h-4 text-slate-600" />
                    <span>تصفح كل الأصناف</span>
                  </button>
                </div>
              </div>
            </div>
          ) : (
            /* ========================================================================= */
            /* 2. SPLIT POS GRID VIEW (العرض المنقسم مع الكتالوج)                        */
            /* ========================================================================= */
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start animate-in fade-in">
              {/* Left / Main: Products catalog & Barcode (7 Cols) */}
              <div className="lg:col-span-7 space-y-4">
                {/* Category Pills */}
                <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-xs flex items-center gap-2 overflow-x-auto scrollbar-none text-xs">
                  {categories.map((cat) => (
                    <button
                      key={cat}
                      onClick={() => setSelectedCategory(cat)}
                      className={`px-3 py-1.5 rounded-full font-bold whitespace-nowrap transition cursor-pointer ${
                        selectedCategory === cat
                          ? 'bg-blue-600 text-white shadow-xs'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      {cat === 'ALL' ? 'جميع الأصناف' : cat}
                    </button>
                  ))}
                </div>

                {/* Product Cards Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 max-h-[620px] overflow-y-auto pr-1">
                  {filteredProducts.length === 0 ? (
                    <div className="col-span-full py-12 text-center text-slate-400 bg-white rounded-xl border border-slate-200 p-6">
                      <Package className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                      <p className="text-xs">لا توجد أصناف مطابقة للبحث</p>
                    </div>
                  ) : (
                    filteredProducts.map((product) => {
                      const inCart = cart.find((i) => i.itemId === product.id);
                      const isOutOfStock = product.quantity <= 0;

                      return (
                        <div
                          key={product.id}
                          onClick={() => !isOutOfStock && handleAddToCart(product)}
                          className={`p-3.5 rounded-xl border transition flex flex-col justify-between cursor-pointer text-right group ${
                            isOutOfStock
                              ? 'bg-slate-50 border-slate-200 opacity-60 cursor-not-allowed'
                              : inCart
                              ? 'bg-blue-50/50 border-blue-300 shadow-xs hover:shadow-md'
                              : 'bg-white border-slate-200 hover:border-blue-300 hover:shadow-md'
                          }`}
                        >
                          <div>
                            <div className="flex items-start justify-between gap-1 mb-1">
                              <span className="text-[10px] font-mono text-slate-400">
                                <HighlightedText text={product.code} highlight={searchTerm} />
                              </span>
                              <span
                                className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ${
                                  product.quantity > 5
                                    ? 'bg-emerald-50 text-emerald-700'
                                    : product.quantity > 0
                                    ? 'bg-amber-50 text-amber-700'
                                    : 'bg-rose-50 text-rose-700'
                                }`}
                              >
                                {product.quantity > 0 ? `${product.quantity} ${product.unit}` : 'نفذ'}
                              </span>
                            </div>
                            <h4 className="text-xs font-bold text-slate-900 line-clamp-2 group-hover:text-blue-600 transition">
                              <HighlightedText text={product.nameAr} highlight={searchTerm} />
                            </h4>
                          </div>

                          <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between">
                            <div className="text-sm font-extrabold text-blue-700">
                              {formatCurrency(product.salePrice, currency, rates)}
                            </div>
                            {inCart ? (
                              <span className="w-6 h-6 rounded-full bg-blue-600 text-white text-xs font-bold flex items-center justify-center">
                                {inCart.quantity}
                              </span>
                            ) : (
                              <div className="w-6 h-6 rounded-full bg-slate-100 text-slate-600 group-hover:bg-blue-600 group-hover:text-white flex items-center justify-center transition">
                                <Plus className="w-3.5 h-3.5" />
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

              {/* Right: Cart Summary Column (5 Cols) */}
              <div className="lg:col-span-5 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between min-h-[580px]">
                <div className="space-y-4">
                  {/* Cart Header */}
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                    <div className="flex items-center gap-2">
                      <ShoppingCart className="w-5 h-5 text-blue-600" />
                      <h3 className="font-bold text-slate-900">سلة البيع الحالية</h3>
                      <span className="text-xs bg-slate-100 px-2 py-0.5 rounded-full text-slate-600 font-bold">
                        {cart.reduce((a, b) => a + b.quantity, 0)} قطعة
                      </span>
                    </div>
                    {cart.length > 0 && (
                      <button
                        onClick={handleClearCart}
                        className="text-xs text-rose-600 hover:text-rose-700 flex items-center gap-1 font-medium cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        إفراغ السلة
                      </button>
                    )}
                  </div>

                  {/* Cart Items List */}
                  <div className="max-h-[300px] overflow-y-auto space-y-2 pr-1 divide-y divide-slate-100">
                    {cart.length === 0 ? (
                      <div className="text-center py-12 text-slate-400 space-y-2">
                        <ShoppingCart className="w-10 h-10 mx-auto stroke-[1.5] text-slate-300" />
                        <p className="text-xs">السلة فارغة، اختر الأصناف أو امسح الباركود</p>
                      </div>
                    ) : (
                      cart.map((item) => {
                        const originalItem = (inventoryItems || []).find((i) => i.id === item.itemId);
                        const effectiveCost = item.costPrice || originalItem?.costPrice || 0;

                        return (
                          <div key={item.itemId} className="pt-2 pb-1 space-y-1">
                            <div className="flex items-center justify-between gap-2">
                              <div className="flex-1 text-right">
                                <h5 className="text-xs font-bold text-slate-900 leading-snug">{item.nameAr}</h5>
                                <span className="text-[10px] text-slate-500 font-mono">
                                  {formatCurrency(item.unitPrice, currency, rates)} / {item.unit}
                                </span>
                              </div>

                              {/* Quantity Controls */}
                              <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-lg">
                                <button
                                  onClick={() => handleUpdateQuantity(item.itemId, -1)}
                                  className="w-5 h-5 rounded bg-white hover:bg-slate-200 text-slate-700 flex items-center justify-center font-bold text-xs"
                                >
                                  <Minus className="w-3 h-3" />
                                </button>
                                <span className="w-6 text-center text-xs font-bold text-slate-900">{item.quantity}</span>
                                <button
                                  onClick={() => handleUpdateQuantity(item.itemId, 1)}
                                  className="w-5 h-5 rounded bg-white hover:bg-slate-200 text-slate-700 flex items-center justify-center font-bold text-xs"
                                >
                                  <Plus className="w-3 h-3" />
                                </button>
                              </div>

                              {/* Item Total & Remove */}
                              <div className="text-left font-bold text-xs text-slate-900 min-w-[70px]">
                                {formatCurrency(item.total, currency, rates)}
                              </div>
                              <button
                                onClick={() => handleRemoveFromCart(item.itemId)}
                                className="text-slate-400 hover:text-rose-600 p-1 cursor-pointer"
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                            </div>

                            {/* Profit Margin Badge */}
                            <div className="flex items-center justify-between pt-0.5">
                              <ProfitMarginBadge
                                costPrice={effectiveCost}
                                salePrice={item.unitPrice}
                                quantity={item.quantity}
                                discountPercent={item.discountPercent || 0}
                                currency={currency}
                                rates={rates}
                                showCost={true}
                                onOpenCalculator={() =>
                                  handleOpenMarginCalculator({
                                    itemId: item.itemId,
                                    itemCode: item.itemCode,
                                    nameAr: item.nameAr,
                                    costPrice: effectiveCost,
                                    unitPrice: item.unitPrice,
                                    quantity: item.quantity,
                                    unit: item.unit,
                                    discountPercent: item.discountPercent,
                                  })
                                }
                              />
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>

                {/* Cart Calculations & Checkout Button */}
                <div className="mt-4 pt-4 border-t border-slate-200 space-y-3">
                  <div className="space-y-1.5 text-xs text-slate-600">
                    <div className="flex justify-between">
                      <span>المجموع الفرعي:</span>
                      <span className="font-semibold text-slate-900">{formatCurrency(cartSubtotal, currency, rates)}</span>
                    </div>
                    {cartDiscountAmount > 0 && (
                      <div className="flex justify-between text-emerald-600">
                        <span>الخصم:</span>
                        <span className="font-semibold">-{formatCurrency(cartDiscountAmount, currency, rates)}</span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span>ضريبة (5% VAT):</span>
                      <span className="font-semibold text-slate-900">{formatCurrency(cartTaxAmount, currency, rates)}</span>
                    </div>
                    <div className="flex justify-between text-base font-extrabold text-slate-900 pt-2 border-t border-slate-100">
                      <span>الإجمالي الصافي:</span>
                      <span className="text-blue-700 text-lg">{formatCurrency(cartGrandTotal, currency, rates)}</span>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <button
                      disabled={cart.length === 0}
                      onClick={handleInstantQuickPrintSale}
                      className={`py-3 px-3 rounded-xl font-bold text-xs sm:text-sm transition flex items-center justify-center gap-1.5 ${
                        cart.length === 0
                          ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                          : 'bg-amber-500 hover:bg-amber-600 text-slate-950 font-black shadow-md hover:shadow-lg active:scale-95 cursor-pointer'
                      }`}
                    >
                      <Zap className="w-4 h-4 text-slate-950 fill-current" />
                      <span>طباعة سريعة ⚡</span>
                    </button>

                    <button
                      disabled={cart.length === 0}
                      onClick={handleOpenCheckout}
                      className={`py-3 px-3 rounded-xl font-bold text-xs sm:text-sm transition flex items-center justify-center gap-1.5 ${
                        cart.length === 0
                          ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                          : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-md hover:shadow-lg active:scale-95 cursor-pointer'
                      }`}
                    >
                      <CreditCard className="w-4 h-4" />
                      <span>دفع وتفاصيل (F9)</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* POS GRAPHICAL ANALYTICS TAB */}
      {activeTab === 'analytics' && (
        <div className="space-y-6 animate-in fade-in">
          {/* Top KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-2">
              <div className="flex items-center justify-between text-slate-500 text-xs font-bold">
                <span>إجمالي مبيعات POS</span>
                <TrendingUp className="w-4 h-4 text-emerald-500" />
              </div>
              <div className="text-xl font-mono font-extrabold text-slate-900">
                {formatCurrency(posAnalyticsData.totalSales || 350000, currency, rates)}
              </div>
              <p className="text-[11px] text-emerald-600 font-semibold">▲ +14.2% مقارنة بالوردية السابقة</p>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-2">
              <div className="flex items-center justify-between text-slate-500 text-xs font-bold">
                <span>عدد العمليات المكتملة</span>
                <Receipt className="w-4 h-4 text-blue-500" />
              </div>
              <div className="text-xl font-mono font-extrabold text-slate-900">
                {posAnalyticsData.totalTxnsCount || 18} عملية
              </div>
              <p className="text-[11px] text-blue-600 font-semibold">معدل تنفيذ سريع لخدمة العملاء</p>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-2">
              <div className="flex items-center justify-between text-slate-500 text-xs font-bold">
                <span>متوسط قيمة الفاتورة</span>
                <BarChart3 className="w-4 h-4 text-indigo-500" />
              </div>
              <div className="text-xl font-mono font-extrabold text-slate-900">
                {formatCurrency(posAnalyticsData.avgTicket || 19440, currency, rates)}
              </div>
              <p className="text-[11px] text-indigo-600 font-semibold">Average Order Value (AOV)</p>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-2">
              <div className="flex items-center justify-between text-slate-500 text-xs font-bold">
                <span>حالة الكاشير الحالية</span>
                <Store className="w-4 h-4 text-amber-500" />
              </div>
              <div className="text-sm font-bold text-slate-900">
                {currentSession.cashierName}
              </div>
              <p className="text-[11px] text-amber-600 font-bold">الوردية متوازنة ومعتمدة ⚡</p>
            </div>
          </div>

          {/* Graphical Charts Section */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Hourly Sales AreaChart */}
            <div className="lg:col-span-2 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div>
                  <h4 className="font-bold text-slate-900 text-sm">توزيع مبيعات POS بالساعة خلال اليوم</h4>
                  <p className="text-xs text-slate-500">مراقبة ساعات الذروة وكثافة طلبات الكاشير</p>
                </div>
                <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200">
                  ساعات الذروة: 18:00 - 20:00
                </span>
              </div>
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={posAnalyticsData.hourlyChartData}>
                    <XAxis dataKey="hour" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} />
                    <Tooltip />
                    <Area type="monotone" dataKey="sales" stroke="#10b981" fill="#d1fae5" strokeWidth={2} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Payment Method PieChart */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
              <div className="border-b border-slate-100 pb-3">
                <h4 className="font-bold text-slate-900 text-sm">توزيع وسائل الدفع (Payment Breakdown)</h4>
                <p className="text-xs text-slate-500">نسبة التحصيل نقداً، شبكة، آجل وتحويل</p>
              </div>
              <div className="h-52 w-full flex items-center justify-center">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={posAnalyticsData.paymentMethodsChart}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      innerRadius={45}
                      outerRadius={75}
                      paddingAngle={3}
                    >
                      {posAnalyticsData.paymentMethodsChart.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs font-semibold">
                {posAnalyticsData.paymentMethodsChart.map((m) => (
                  <div key={m.name} className="flex items-center gap-1.5">
                    <span className="w-3 h-3 rounded-full" style={{ backgroundColor: m.color }}></span>
                    <span className="text-slate-700">{m.name}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Top Selling Products BarChart */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
            <div className="border-b border-slate-100 pb-3">
              <h4 className="font-bold text-slate-900 text-sm">الأصناف والمنتجات الأكثر مبيعاً في نقاط البيع</h4>
              <p className="text-xs text-slate-500">أعلى البنود توليداً للإيرادات في الكاشير</p>
            </div>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={posAnalyticsData.topItems} layout="vertical">
                  <XAxis type="number" tick={{ fontSize: 11 }} />
                  <YAxis dataKey="name" type="category" width={180} tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Bar dataKey="revenue" fill="#3b82f6" radius={[0, 8, 8, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {/* History Tab */}
      {activeTab === 'history' && (
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
            <div>
              <h3 className="font-bold text-slate-900 text-base">سجل الفواتير وعمليات الكاشير المكتملة</h3>
              <p className="text-xs text-slate-500">استعراض، تفتيش، وبحث شامل في كافة فواتير وإيصالات المبيعات</p>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-500 font-medium">
                العمليات المعروضة: {filteredHistoryTransactions.length} من أصل {allTransactions.length}
              </span>
            </div>
          </div>

          {/* Search & Filter Controls for History */}
          <div className="flex flex-col sm:flex-row items-center gap-3 bg-slate-50 p-3 rounded-xl border border-slate-200">
            <div className="relative flex-1 w-full">
              <Search className="w-4 h-4 text-slate-400 absolute right-3 top-2.5" />
              <input
                type="text"
                value={historySearchQuery}
                onChange={(e) => setHistorySearchQuery(e.target.value)}
                placeholder="بحث برقم الإيصال/الفاتورة، اسم العميل، الكاشير، أو اسم الصنف..."
                className="w-full text-xs pr-9 pl-8 py-2 rounded-lg border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
              />
              {historySearchQuery && (
                <button
                  onClick={() => setHistorySearchQuery('')}
                  className="absolute left-2.5 top-2.5 text-slate-400 hover:text-slate-600"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <select
                value={historyPaymentFilter}
                onChange={(e) => setHistoryPaymentFilter(e.target.value)}
                className="text-xs px-3 py-2 rounded-lg border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-semibold w-full sm:w-auto"
              >
                <option value="ALL">جميع طرق الدفع</option>
                <option value="CASH">نقداً (Cash)</option>
                <option value="CARD">بطاقة / مدى (Card)</option>
                <option value="CREDIT">آجل / ذمم (Credit)</option>
                <option value="BANK_TRANSFER">تحويل بنكي (Transfer)</option>
              </select>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs">
              <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200">
                <tr>
                  <th className="p-3">رقم الإيصال</th>
                  <th className="p-3">التاريخ والوقت</th>
                  <th className="p-3">الكاشير</th>
                  <th className="p-3">العميل</th>
                  <th className="p-3">طريقة الدفع</th>
                  <th className="p-3">الأصناف</th>
                  <th className="p-3">الإجمالي</th>
                  <th className="p-3">الحالة</th>
                  <th className="p-3 text-center">الإجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredHistoryTransactions.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="p-8 text-center text-slate-400 font-medium">
                      {historySearchQuery || historyPaymentFilter !== 'ALL'
                        ? 'لا توجد فواتير أو إيصالات تطابق معايير البحث الحالية'
                        : 'لا توجد فواتير مبيعات مسجلة حتى الآن'}
                    </td>
                  </tr>
                ) : (
                  filteredHistoryTransactions.map((txn) => (
                    <tr key={txn.id} className="hover:bg-slate-50">
                      <td className="p-3 font-mono font-bold text-blue-600">{txn.receiptNumber}</td>
                      <td className="p-3 text-slate-500">{new Date(txn.date).toLocaleString('ar-YE')}</td>
                      <td className="p-3 font-medium text-slate-900">{txn.cashierName}</td>
                      <td className="p-3 text-slate-700">{txn.customerName}</td>
                      <td className="p-3">
                        <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-slate-100 text-slate-700">
                          {txn.paymentMethod === 'CASH'
                            ? 'نقداً'
                            : txn.paymentMethod === 'CARD'
                            ? 'بطاقة / مدى'
                            : txn.paymentMethod === 'CREDIT'
                            ? 'آجل (ذمم)'
                            : 'تحويل بنكي'}
                        </span>
                      </td>
                      <td className="p-3 text-slate-600">
                        {txn.items?.reduce((a, b) => a + b.quantity, 0) || 0} قطعة
                      </td>
                      <td className="p-3 font-bold text-slate-900">
                        {formatCurrency(txn.grandTotal, txn.currency || currency, rates)}
                      </td>
                      <td className="p-3">
                        <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-100 text-emerald-800">
                          مكتملة
                        </span>
                      </td>
                      <td className="p-3 text-center flex items-center justify-center gap-1.5">
                        <button
                          onClick={() => handleQuickPrintExistingTxn(txn)}
                          className="px-2.5 py-1 rounded bg-amber-500 hover:bg-amber-600 text-slate-950 text-xs font-black inline-flex items-center gap-1 transition shadow-xs active:scale-95"
                          title="طباعة سريعة متوافقة مع طابعات الإيصالات الحرارية 80mm"
                        >
                          <Zap className="w-3.5 h-3.5 fill-current" />
                          طباعة سريعة ⚡
                        </button>
                        <button
                          onClick={() => {
                            setActiveReceipt(txn);
                            setIsReceiptModalOpen(true);
                          }}
                          className="px-2.5 py-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold inline-flex items-center gap-1 transition"
                        >
                          <Printer className="w-3.5 h-3.5" />
                          عرض الإيصال
                        </button>
                        <button
                          onClick={() => handleShareReceiptWhatsApp(txn)}
                          className="px-2.5 py-1 rounded bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-xs font-bold inline-flex items-center gap-1 transition"
                          title="مشاركة عبر واتساب"
                        >
                          <Share2 className="w-3.5 h-3.5" />
                          واتساب
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Shift Closing (Z-Report) Tab */}
      {activeTab === 'shift' && (
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs space-y-6 max-w-4xl mx-auto">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div>
              <h3 className="text-lg font-bold text-slate-900">تقرير إقفال الوردية والصندوق اليومي (Z-Report)</h3>
              <p className="text-xs text-slate-500">
                تسوية مبيعات الكاشير وحصر الإيرادات النقدية والإلكترونية ومقارنة النقد الفعلي بالمسجل
              </p>
            </div>
            <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-bold">
              وردية مفتوحة: {currentSession.sessionNumber}
            </span>
          </div>

          {/* Shift Stats KPI Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-right">
              <span className="text-xs text-slate-500 font-medium">الصندوق الافتتاحي</span>
              <h4 className="text-base font-bold text-slate-900 mt-1">
                {formatCurrency(currentSession.openingCash, currency, rates)}
              </h4>
            </div>
            <div className="bg-emerald-50 p-4 rounded-xl border border-emerald-200 text-right">
              <span className="text-xs text-emerald-700 font-medium">مبيعات نقداً (Cash)</span>
              <h4 className="text-base font-bold text-emerald-800 mt-1">
                {formatCurrency(currentSession.totalSalesCash, currency, rates)}
              </h4>
            </div>
            <div className="bg-blue-50 p-4 rounded-xl border border-blue-200 text-right">
              <span className="text-xs text-blue-700 font-medium">مبيعات بطاقة (Card/POS)</span>
              <h4 className="text-base font-bold text-blue-800 mt-1">
                {formatCurrency(currentSession.totalSalesCard, currency, rates)}
              </h4>
            </div>
            <div className="bg-purple-50 p-4 rounded-xl border border-purple-200 text-right">
              <span className="text-xs text-purple-700 font-medium">إجمالي إيراد الوردية</span>
              <h4 className="text-base font-bold text-purple-900 mt-1">
                {formatCurrency(currentSession.totalGrossRevenue, currency, rates)}
              </h4>
            </div>
          </div>

          {/* Cash reconciliation calculation */}
          <div className="bg-slate-50 p-5 rounded-xl border border-slate-200 space-y-4">
            <h4 className="font-bold text-sm text-slate-900">مطابقة النقد الفعلي مع النظام (Cash Reconciliation)</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  النقد المتوقع في الدرج (افتتاحي + مبيعات نقداً):
                </label>
                <input
                  type="text"
                  disabled
                  value={formatCurrency(currentSession.openingCash + currentSession.totalSalesCash, currency, rates)}
                  className="w-full p-2.5 bg-slate-100 border border-slate-300 rounded-lg text-sm font-bold text-slate-800"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  النقد الفعلي المعدود في الدرج ({currency}):
                </label>
                <input
                  type="number"
                  value={actualCashAtClosing || ''}
                  onChange={(e) => setActualCashAtClosing(Number(e.target.value))}
                  placeholder="أدخل مبلغ الجرد الفعلي..."
                  className="w-full p-2.5 bg-white border border-slate-300 rounded-lg text-sm font-bold focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            {actualCashAtClosing > 0 && (
              <div
                className={`p-3 rounded-lg text-xs font-bold flex items-center justify-between ${
                  actualCashAtClosing === currentSession.openingCash + currentSession.totalSalesCash
                    ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                    : actualCashAtClosing > currentSession.openingCash + currentSession.totalSalesCash
                    ? 'bg-blue-100 text-blue-800 border border-blue-200'
                    : 'bg-rose-100 text-rose-800 border border-rose-200'
                }`}
              >
                <span>
                  {actualCashAtClosing === currentSession.openingCash + currentSession.totalSalesCash
                    ? 'الدرج متطابق تماماً بنسبة 100% بدون أي عجز أو زيادة'
                    : actualCashAtClosing > currentSession.openingCash + currentSession.totalSalesCash
                    ? 'يوجد فائض في الصندوق بمقدار:'
                    : 'يوجد عجز في الصندوق بمقدار:'}
                </span>
                <span className="text-sm font-extrabold">
                  {formatCurrency(
                    Math.abs(actualCashAtClosing - (currentSession.openingCash + currentSession.totalSalesCash)),
                    currency,
                    rates
                  )}
                </span>
              </div>
            )}
          </div>

          <div className="flex justify-end gap-3">
            <button
              onClick={() => {
                alert('تم ترحيل تقرير الإقفال Z-Report وتوليد قيد الترحيل المحاسبي للصندوق بنجاح!');
                setActiveTab('pos');
              }}
              className="px-5 py-2.5 bg-slate-900 text-white rounded-xl font-bold text-xs hover:bg-black transition flex items-center gap-2"
            >
              <CheckCircle2 className="w-4 h-4" />
              اعتماد وإقفال الوردية رسمياً
            </button>
          </div>
        </div>
      )}

      {/* Checkout Modal */}
      {isCheckoutOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 space-y-5 text-right shadow-2xl animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-lg text-slate-900">سداد الفاتورة وإصدار الإيصال</h3>
              <button onClick={() => setIsCheckoutOpen(false)} className="p-1 text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Grand Total Highlight */}
            <div className="bg-blue-50 p-4 rounded-xl border border-blue-100 flex items-center justify-between">
              <span className="text-xs text-blue-700 font-bold">المبلغ الإجمالي المستحق:</span>
              <span className="text-xl font-extrabold text-blue-900">
                {formatCurrency(cartGrandTotal, currency, rates)}
              </span>
            </div>

            {/* Payment Method Selector */}
            <div className="space-y-2">
              <label className="block text-xs font-bold text-slate-700">طريقة الدفع:</label>
              <div className="grid grid-cols-4 gap-2">
                {[
                  { id: 'CASH', label: 'نقداً', icon: Banknote },
                  { id: 'CARD', label: 'بطاقة/شبكة', icon: CreditCard },
                  { id: 'CREDIT', label: 'آجل (ذمم)', icon: Store },
                  { id: 'TRANSFER', label: 'تحويل', icon: ArrowRight },
                ].map((pm) => {
                  const Icon = pm.icon;
                  return (
                    <button
                      key={pm.id}
                      type="button"
                      onClick={() => setPaymentMethod(pm.id as POSPaymentMethod)}
                      className={`p-3 rounded-xl border text-xs font-bold flex flex-col items-center gap-1.5 transition ${
                        paymentMethod === pm.id
                          ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                          : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                      {pm.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Cash Tendered & Quick Cash buttons */}
            {paymentMethod === 'CASH' && (
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">المبلغ المقبوض من العميل:</label>
                  <input
                    type="number"
                    value={cashTendered || ''}
                    onChange={(e) => setCashTendered(Number(e.target.value))}
                    className="w-full p-2.5 border border-slate-300 rounded-lg text-base font-bold text-slate-900 focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                {/* Quick denomination pills */}
                <div className="flex flex-wrap gap-1.5">
                  {[1000, 5000, 10000, 20000, 50000, 100000].map((amt) => (
                    <button
                      key={amt}
                      type="button"
                      onClick={() => setCashTendered(amt)}
                      className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded text-xs font-bold"
                    >
                      +{amt.toLocaleString()}
                    </button>
                  ))}
                  <button
                    type="button"
                    onClick={() => setCashTendered(cartGrandTotal)}
                    className="px-2.5 py-1 bg-blue-100 hover:bg-blue-200 text-blue-800 rounded text-xs font-bold"
                  >
                    مطابق تماماً
                  </button>
                </div>

                {/* Change return */}
                <div className="bg-slate-100 p-3 rounded-lg flex items-center justify-between text-xs">
                  <span className="font-medium text-slate-600">المتبقي للعميل (الصرف):</span>
                  <span className="text-base font-extrabold text-emerald-700">
                    {formatCurrency(changeDue, currency, rates)}
                  </span>
                </div>
              </div>
            )}

            {paymentMethod === 'CARD' && (
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  رقم التفويض من جهاز الشبكة (Auth / Ref No):
                </label>
                <input
                  type="text"
                  value={cardAuthRef}
                  onChange={(e) => setCardAuthRef(e.target.value)}
                  placeholder="مثال: AUTH-982173"
                  className="w-full p-2.5 border border-slate-300 rounded-lg text-xs font-mono"
                />
              </div>
            )}

            {paymentMethod === 'TRANSFER' && (
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  رقم الحوالة أو المرجع البنكي:
                </label>
                <input
                  type="text"
                  value={transferRef}
                  onChange={(e) => setTransferRef(e.target.value)}
                  placeholder="مثال: TRF-2026-4401"
                  className="w-full p-2.5 border border-slate-300 rounded-lg text-xs font-mono"
                />
              </div>
            )}

            <div className="flex flex-wrap items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setIsCheckoutOpen(false)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold"
              >
                إلغاء
              </button>
              <button
                type="button"
                onClick={() => handleCompleteSale(false)}
                className="px-4 py-2.5 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-bold shadow-sm"
              >
                تأكيد وحفظ الفاتورة فقط
              </button>
              <button
                type="button"
                onClick={() => handleCompleteSale(true)}
                className="px-5 py-2.5 bg-amber-500 hover:bg-amber-600 text-slate-950 rounded-xl text-xs font-black shadow-md flex items-center gap-1.5 active:scale-95"
              >
                <Zap className="w-4 h-4 fill-current" />
                تأكيد وطباعة سريعة ⚡
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 80mm Thermal Receipt Print Preview Modal */}
      {isReceiptModalOpen && activeReceipt && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 text-center shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            {/* Action Bar */}
            <div className="flex items-center justify-between no-print border-b border-slate-100 pb-2">
              <span className="text-xs font-bold text-slate-700 flex items-center gap-1">
                <Printer className="w-4 h-4 text-amber-500" />
                إيصال حراري (80mm)
              </span>
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => handlePrintReceipt(true)}
                  className="px-3 py-1 bg-amber-500 hover:bg-amber-600 text-slate-950 rounded-lg text-xs font-black flex items-center gap-1 shadow-xs active:scale-95"
                  title="فتح نافذة طباعة الإيصالات الحرارية مباشرة"
                >
                  <Zap className="w-3.5 h-3.5 fill-current" />
                  طباعة سريعة ⚡
                </button>
                <button
                  onClick={() => handlePrintReceipt(false)}
                  className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold"
                  title="طباعة برينتر قياسي (A4)"
                >
                  A4
                </button>
                <button
                  onClick={() => setIsReceiptModalOpen(false)}
                  className="p-1 text-slate-400 hover:text-slate-600"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Printable 80mm Receipt Content */}
            <div className="p-4 border border-dashed border-slate-300 rounded-xl bg-white text-xs font-mono text-slate-800 space-y-3 printable-receipt">
              <div className="text-center space-y-1">
                <CompanyHeaderView size="sm" />
                <p className="text-[10px] text-slate-500">{companyProfile.address}</p>
                <p className="text-[10px] text-slate-600">الرقم الضريبي: {companyProfile.taxNumber}</p>
                <p className="text-[10px] text-slate-600">هاتف: {companyProfile.phone}</p>
              </div>

              <div className="border-t border-b border-dashed border-slate-300 py-1.5 text-[10px] text-right space-y-0.5">
                <div>رقم الإيصال: {activeReceipt.receiptNumber}</div>
                <div>التاريخ: {new Date(activeReceipt.date).toLocaleString('ar-YE')}</div>
                <div>الكاشير: {activeReceipt.cashierName}</div>
                <div>العميل: {activeReceipt.customerName}</div>
              </div>

              {/* Items Table */}
              <table className="w-full text-right text-[10px]">
                <thead>
                  <tr className="border-b border-slate-300 font-bold">
                    <th className="py-1">الصنف</th>
                    <th className="py-1 text-center">الكمية</th>
                    <th className="py-1 text-left">الإجمالي</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {activeReceipt.items.map((it, idx) => (
                    <tr key={idx}>
                      <td className="py-1">{it.nameAr}</td>
                      <td className="py-1 text-center">{it.quantity}</td>
                      <td className="py-1 text-left">{it.total.toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Totals */}
              <div className="border-t border-dashed border-slate-300 pt-2 space-y-1 text-right text-[11px]">
                <div className="flex justify-between">
                  <span>المجموع الفرعي:</span>
                  <span>{activeReceipt.subtotal.toLocaleString()} {activeReceipt.currency || currency}</span>
                </div>
                {activeReceipt.discountTotal > 0 && (
                  <div className="flex justify-between text-emerald-700">
                    <span>الخصم:</span>
                    <span>-{activeReceipt.discountTotal.toLocaleString()} {activeReceipt.currency || currency}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span>ضريبة القيمة المضافة (5%):</span>
                  <span>{activeReceipt.taxTotal.toLocaleString()} {activeReceipt.currency || currency}</span>
                </div>
                <div className="flex justify-between font-bold text-xs pt-1 border-t border-slate-300">
                  <span>المبلغ الإجمالي المدفوع:</span>
                  <span>{activeReceipt.grandTotal.toLocaleString()} {activeReceipt.currency || currency}</span>
                </div>
                {activeReceipt.changeDue > 0 && (
                  <div className="flex justify-between text-[10px] text-slate-500">
                    <span>المتبقي للعميل (الصرف):</span>
                    <span>{activeReceipt.changeDue.toLocaleString()} {activeReceipt.currency || currency}</span>
                  </div>
                )}
              </div>

              {/* QR Code Graphic */}
              <div className="pt-2 flex flex-col items-center justify-center space-y-1">
                <div className="w-24 h-24 bg-slate-900 text-white rounded p-1.5 flex items-center justify-center text-[9px] text-center font-sans">
                  [ QR Code ضريبي معتمد ZATCA ]
                </div>
                <span className="text-[9px] text-slate-400">فاتورة ضريبية مبسطة معتمدة</span>
              </div>

              <div className="text-center text-[9px] text-slate-500 pt-1">
                شكراً لزيارتكم ونسعد بخدمتكم دائماً!
              </div>
            </div>

            {/* WhatsApp Share in modal */}
            <div className="bg-emerald-50 p-3 rounded-xl border border-emerald-200 space-y-2 no-print">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-emerald-900 flex items-center gap-1.5">
                  <Smartphone className="w-4 h-4 text-emerald-600" />
                  إرسال الإيصال للعميل عبر واتساب
                </span>
              </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={customerPhoneForShare}
                  onChange={(e) => setCustomerPhoneForShare(e.target.value)}
                  placeholder="رقم الهاتف (مثال: 967771234567)"
                  className="flex-1 px-2.5 py-1.5 text-xs bg-white border border-emerald-300 rounded-lg focus:ring-1 focus:ring-emerald-500 font-mono"
                />
                <button
                  onClick={() => handleShareReceiptWhatsApp(activeReceipt)}
                  className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg flex items-center gap-1 transition"
                >
                  <Send className="w-3 h-3" />
                  إرسال
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* CUSTOM ITEM / AD-HOC ITEM MODAL */}
      {isCustomItemModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-5 space-y-4 text-right shadow-2xl animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                <Plus className="w-4 h-4 text-blue-600" />
                <span>إضافة صنف أو خدمة حرة غير مقيدة بالمخزون</span>
              </h3>
              <button
                onClick={() => setIsCustomItemModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddCustomItem} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">اسم الصنف أو الخدمة *</label>
                <input
                  type="text"
                  required
                  value={customItemName}
                  onChange={(e) => setCustomItemName(e.target.value)}
                  onKeyDown={(e) => e.stopPropagation()}
                  placeholder="مثال: رسوم شحن، صيانة، صنف طارئ..."
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">سعر الوحدة *</label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={customItemPrice || ''}
                    onChange={(e) => setCustomItemPrice(parseFloat(e.target.value) || 0)}
                    onKeyDown={(e) => e.stopPropagation()}
                    placeholder="0"
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-mono font-bold text-slate-800 text-left focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">الكمية *</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={customItemQty}
                    onChange={(e) => setCustomItemQty(Math.max(1, parseFloat(e.target.value) || 1))}
                    onKeyDown={(e) => e.stopPropagation()}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-mono font-bold text-slate-800 text-center focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-xs flex justify-between font-bold text-slate-800">
                <span>الإجمالي المحسوب (شامل الضريبة 5%):</span>
                <span className="font-mono text-emerald-700">
                  {formatCurrency((customItemPrice * customItemQty) * 1.05, currency, rates)}
                </span>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsCustomItemModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-xs transition flex items-center gap-1.5"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>إضافة للسلة</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DOCUMENT SHARING MODAL */}
      <DocumentShareModal
        isOpen={!!shareModalDoc}
        onClose={() => setShareModalDoc(null)}
        document={shareModalDoc}
        companyProfile={companyProfile}
      />

      {/* OCR SCANNER MODAL FOR POS */}
      <DocumentOcrScannerModal
        isOpen={isOcrOpen}
        onClose={() => setIsOcrOpen(false)}
        onScanComplete={handleOcrScanComplete}
      />

      {/* 80mm THERMAL PRINTER SETTINGS & PREVIEW MODAL */}
      {isThermalSettingsOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 space-y-5 text-right shadow-2xl animate-in fade-in zoom-in-95 max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-amber-100 text-amber-800 rounded-xl">
                  <Printer className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-slate-900">إعدادات طابعة الإيصالات الحرارية (80mm Thermal Printer)</h3>
                  <p className="text-xs text-slate-500">تهيئة الطباعة المباشرة عبر المتصفح وقوالب الفواتير الحرارية</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsThermalSettingsOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {/* Left Column: Form Controls */}
              <div className="space-y-4">
                {/* Paper Width Selection */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">حجم ورقة الطابعة الحرارية:</label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => saveThermalSettings({ ...thermalSettings, paperWidth: '80mm' })}
                      className={`p-3 rounded-xl border text-xs font-bold flex flex-col items-center gap-1 transition ${
                        thermalSettings.paperWidth === '80mm'
                          ? 'bg-amber-500 text-slate-950 border-amber-600 shadow-sm'
                          : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      <Printer className="w-4 h-4" />
                      <span>80mm (قياسي POS)</span>
                      <span className="text-[10px] opacity-80">عرض 80 ملم - 32 حرف/سطر</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => saveThermalSettings({ ...thermalSettings, paperWidth: '58mm' })}
                      className={`p-3 rounded-xl border text-xs font-bold flex flex-col items-center gap-1 transition ${
                        thermalSettings.paperWidth === '58mm'
                          ? 'bg-amber-500 text-slate-950 border-amber-600 shadow-sm'
                          : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      <Printer className="w-4 h-4" />
                      <span>58mm (مصغر Mini)</span>
                      <span className="text-[10px] opacity-80">عرض 58 ملم - 24 حرف/سطر</span>
                    </button>
                  </div>
                </div>

                {/* Printer Device Name */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">اسم الطابعة المعرفة في الجهاز:</label>
                  <input
                    type="text"
                    value={thermalSettings.printerName || ''}
                    onChange={(e) => saveThermalSettings({ ...thermalSettings, printerName: e.target.value })}
                    placeholder="مثال: EPSON TM-T20III / Xprinter XP-N160I / POS-80"
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold text-slate-800"
                  />
                  <p className="text-[10px] text-slate-500 mt-1">تستخدم طابعات الإيصالات الحرارية المربوطة عبر USB أو الشبكة أو Bluetooth.</p>
                </div>

                {/* Header Note */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">نص ترويسة الإيصال (رأس الفاتورة):</label>
                  <input
                    type="text"
                    value={thermalSettings.customHeaderNote || ''}
                    onChange={(e) => saveThermalSettings({ ...thermalSettings, customHeaderNote: e.target.value })}
                    placeholder="مثال: مرحباً بكم في صالتنا - نسعد بخدمتكم"
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold text-slate-800"
                  />
                </div>

                {/* Footer Note */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">نص تذييل الإيصال (الشروط والتنبيهات):</label>
                  <textarea
                    rows={2}
                    value={thermalSettings.customFooterNote || ''}
                    onChange={(e) => saveThermalSettings({ ...thermalSettings, customFooterNote: e.target.value })}
                    placeholder="سياسة الاسترجاع والاستبدال والتنبيهات..."
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold text-slate-800 resize-none"
                  />
                </div>

                {/* Toggles */}
                <div className="space-y-2.5 bg-slate-50 p-3 rounded-xl border border-slate-200">
                  <label className="flex items-center justify-between cursor-pointer">
                    <span className="text-xs font-bold text-slate-700">طباعة تلقائية فورية عند الدفع</span>
                    <input
                      type="checkbox"
                      checked={thermalSettings.autoPrintOnCheckout}
                      onChange={(e) => saveThermalSettings({ ...thermalSettings, autoPrintOnCheckout: e.target.checked })}
                      className="w-4 h-4 text-amber-600 rounded focus:ring-amber-500 cursor-pointer"
                    />
                  </label>
                  <label className="flex items-center justify-between cursor-pointer">
                    <span className="text-xs font-bold text-slate-700">إظهار رمز QR ضريبي معتمد (ZATCA TLV)</span>
                    <input
                      type="checkbox"
                      checked={thermalSettings.showQrCode}
                      onChange={(e) => saveThermalSettings({ ...thermalSettings, showQrCode: e.target.checked })}
                      className="w-4 h-4 text-amber-600 rounded focus:ring-amber-500 cursor-pointer"
                    />
                  </label>
                </div>
              </div>

              {/* Right Column: Live 80mm Receipt Preview */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-700">معاينة مباشرة للإيصال (تنسيق {thermalSettings.paperWidth}):</span>
                  <span className="text-[10px] text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200 font-mono font-bold">
                    {thermalSettings.paperWidth === '80mm' ? '80mm Thermal' : '58mm Mini'}
                  </span>
                </div>

                {/* Simulated 80mm Paper */}
                <div className="p-4 border border-dashed border-slate-400 rounded-xl bg-amber-50/30 text-xs font-mono text-slate-900 space-y-2.5 shadow-xs max-h-[380px] overflow-y-auto">
                  <div className="text-center space-y-0.5 border-b border-dashed border-slate-400 pb-2">
                    <CompanyHeaderView size="sm" />
                    <p className="text-[10px] text-slate-600">{companyProfile.address || 'شارع حدة، صنعاء'}</p>
                    <p className="text-[10px] text-slate-600">الرقم الضريبي: {companyProfile.taxNumber}</p>
                    {thermalSettings.customHeaderNote && (
                      <p className="text-[10px] italic text-amber-900 mt-1">{thermalSettings.customHeaderNote}</p>
                    )}
                  </div>

                  <div className="text-[10px] space-y-0.5 border-b border-dashed border-slate-400 pb-2">
                    <div className="flex justify-between">
                      <span>إيصال رقم: POS-881923</span>
                      <span>14:32:05 2026/08/25</span>
                    </div>
                    <div>الكاشير: {currentSession.cashierName}</div>
                    <div>طريقة الدفع: نقداً (Cash)</div>
                  </div>

                  <table className="w-full text-right text-[10px]">
                    <thead>
                      <tr className="border-b border-slate-400 font-bold">
                        <th>الصنف</th>
                        <th className="text-center">الكمية</th>
                        <th className="text-left">الإجمالي</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      <tr>
                        <td>طابعة إيصالات 80mm</td>
                        <td className="text-center">1</td>
                        <td className="text-left">45,000</td>
                      </tr>
                      <tr>
                        <td>ورق إيصالات حراري (باكت)</td>
                        <td className="text-center">2</td>
                        <td className="text-left">10,000</td>
                      </tr>
                    </tbody>
                  </table>

                  <div className="border-t border-dashed border-slate-400 pt-1.5 space-y-1 text-[10.5px]">
                    <div className="flex justify-between">
                      <span>المجموع:</span>
                      <span>55,000 {currency}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>الضريبة (5%):</span>
                      <span>2,750 {currency}</span>
                    </div>
                    <div className="flex justify-between font-extrabold text-xs pt-1 border-t border-slate-900">
                      <span>الإجمالي الكلي:</span>
                      <span>57,750 {currency}</span>
                    </div>
                  </div>

                  {thermalSettings.showQrCode && (
                    <div className="text-center pt-2 border-t border-dashed border-slate-400">
                      <div className="w-20 h-20 bg-slate-900 text-white mx-auto rounded flex items-center justify-center text-[8px] p-1 font-sans">
                        [ ZATCA QR 80mm ]
                      </div>
                    </div>
                  )}

                  {thermalSettings.customFooterNote && (
                    <div className="text-center text-[9.5px] text-slate-600 pt-1">
                      {thermalSettings.customFooterNote}
                    </div>
                  )}

                  <div className="border-b border-dashed border-slate-400 pt-2 text-center text-[9px] text-slate-400">
                    ✂ قص الورقة من هنا ✂
                  </div>
                </div>
              </div>
            </div>

            {/* Bottom Actions */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => {
                  const sampleTxn: POSTransaction = {
                    id: `SAMPLE-${Date.now()}`,
                    receiptNumber: `TEST-80MM-${Math.floor(1000 + Math.random() * 9000)}`,
                    sessionId: currentSession.id,
                    cashierName: currentSession.cashierName,
                    branchId: 'BR-01',
                    warehouseId: 'WH-01',
                    customerName: 'عميل تجريبي (Test Receipt)',
                    date: new Date().toISOString(),
                    items: [
                      {
                        itemId: 'TEST-1',
                        itemCode: 'ITM-80',
                        nameAr: 'طابعة إيصالات حرارية 80mm',
                        unitPrice: 45000,
                        costPrice: 35000,
                        quantity: 1,
                        discountPercent: 0,
                        discountAmount: 0,
                        taxRate: 5,
                        taxAmount: 2250,
                        total: 47250,
                        unit: 'جهاز',
                      },
                      {
                        itemId: 'TEST-2',
                        itemCode: 'PAPER-80',
                        nameAr: 'ورق إيصالات حراري 80x80 (باكت)',
                        unitPrice: 5000,
                        costPrice: 3500,
                        quantity: 2,
                        discountPercent: 0,
                        discountAmount: 0,
                        taxRate: 5,
                        taxAmount: 500,
                        total: 10500,
                        unit: 'باكت',
                      },
                    ],
                    subtotal: 55000,
                    discountTotal: 0,
                    taxTotal: 2750,
                    grandTotal: 57750,
                    amountPaid: 60000,
                    changeDue: 2250,
                    paymentMethod: 'CASH',
                    currency: currency,
                    status: 'COMPLETED',
                  };
                  printThermalReceipt80mm(sampleTxn, companyProfile, thermalSettings);
                }}
                className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-xs rounded-xl shadow-md flex items-center gap-1.5 transition active:scale-95"
              >
                <Printer className="w-4 h-4" />
                <span>اختبار طباعة إيصال تجريبي 80mm الآن ⚡</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  saveThermalSettings(thermalSettings);
                  setIsThermalSettingsOpen(false);
                  alert('تم حفظ إعدادات طابعة الإيصالات الحرارية (80mm) بنجاح!');
                }}
                className="px-5 py-2 bg-slate-900 hover:bg-black text-white font-bold text-xs rounded-xl shadow-xs transition"
              >
                حفظ وإغلاق
              </button>
            </div>
          </div>
        </div>
      )}

      {/* QUICK PRODUCT CATALOG MODAL */}
      {isCatalogModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[85vh] shadow-2xl flex flex-col overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95">
            {/* Modal Header */}
            <div className="p-4 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-blue-600 flex items-center justify-center">
                  <Package className="w-4 h-4 text-white" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-white">
                    كتالوج أصناف المخزون (تصفح وإضافة سريعة للفاتورة)
                  </h3>
                  <p className="text-[11px] text-slate-300">
                    انقر على أي صنف لإضافته مباشرة إلى جدول الفاتورة
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsCatalogModalOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Filter & Search Bar */}
            <div className="p-4 bg-slate-50 border-b border-slate-200 space-y-3">
              <form onSubmit={handleProductSearchSubmit} className="flex items-center gap-2">
                <div className="relative flex-1">
                  <Search className="w-4 h-4 text-slate-400 absolute right-3 top-3" />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="ابحث باسم الصنف، الكود، أو الباركود واضغط Enter للإدراج..."
                    className="w-full pl-4 pr-10 py-2 bg-white border border-slate-300 rounded-xl text-xs font-bold text-slate-900 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                  {searchTerm && (
                    <button
                      type="button"
                      onClick={() => setSearchTerm('')}
                      className="absolute left-3 top-2.5 text-slate-400 hover:text-slate-700"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
                <button
                  type="submit"
                  className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 active:scale-95 text-white rounded-xl text-xs font-black transition shrink-0"
                >
                  إدراج للفاتورة ⏎
                </button>

                {/* Switch between Photo List and Grid inside Catalog Modal */}
                <div className="flex items-center gap-1 bg-white p-1 rounded-xl border border-slate-300">
                  <button
                    type="button"
                    onClick={() => setCatalogDisplayMode('PHOTO_LIST')}
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold transition flex items-center gap-1 ${
                      catalogDisplayMode === 'PHOTO_LIST'
                        ? 'bg-blue-600 text-white'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <SlidersHorizontal className="w-3 h-3" />
                    <span>قائمة (كما بالصورة)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setCatalogDisplayMode('GRID')}
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold transition flex items-center gap-1 ${
                      catalogDisplayMode === 'GRID'
                        ? 'bg-blue-600 text-white'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <LayoutGrid className="w-3 h-3" />
                    <span>شبكة</span>
                  </button>
                </div>
              </form>

              {/* Categories */}
              <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none text-xs">
                {categories.map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setSelectedCategory(cat)}
                    className={`px-3 py-1.5 rounded-full font-bold whitespace-nowrap transition cursor-pointer ${
                      selectedCategory === cat
                        ? 'bg-blue-600 text-white shadow-xs'
                        : 'bg-white text-slate-700 hover:bg-slate-200 border border-slate-200'
                    }`}
                  >
                    {cat === 'ALL' ? 'جميع الأصناف' : cat}
                  </button>
                ))}
              </div>
            </div>

            {/* Items Content: PHOTO_LIST or GRID */}
            {catalogDisplayMode === 'PHOTO_LIST' ? (
              <div className="overflow-y-auto max-h-[55vh] divide-y divide-slate-200 bg-white">
                {filteredProducts.length === 0 ? (
                  <div className="py-12 text-center text-slate-400">
                    <Package className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                    <p className="text-xs">لا توجد أصناف مطابقة للبحث</p>
                  </div>
                ) : (
                  filteredProducts.map((product) => {
                    const inCart = cart.find((i) => i.itemId === product.id);
                    const isOutOfStock = product.quantity <= 0;

                    return (
                      <div
                        key={product.id}
                        onClick={() => !isOutOfStock && handleAddToCart(product)}
                        className={`py-4 px-4 sm:px-6 transition flex items-center justify-between gap-4 cursor-pointer text-right group ${
                          isOutOfStock
                            ? 'bg-slate-50 opacity-60 cursor-not-allowed'
                            : inCart
                            ? 'bg-blue-50/70 hover:bg-blue-100/70'
                            : 'bg-white hover:bg-slate-50'
                        }`}
                      >
                        {/* Radio / Check circle indicator matching user screenshot */}
                        <div className="shrink-0">
                          {inCart ? (
                            <div className="w-7 h-7 rounded-full border-2 border-blue-600 bg-blue-600 flex items-center justify-center shadow-xs">
                              <div className="w-2.5 h-2.5 rounded-full bg-white" />
                            </div>
                          ) : (
                            <div className="w-7 h-7 rounded-full border-2 border-slate-400 group-hover:border-blue-500 flex items-center justify-center transition" />
                          )}
                        </div>

                        {/* Large Typography: Name on Top, Subtitle with Code & Details below */}
                        <div className="flex-1 text-right space-y-1">
                          <h4 className="text-base sm:text-xl font-black text-slate-900 leading-snug group-hover:text-blue-700 transition">
                            <HighlightedText text={product.nameAr} highlight={searchTerm} />
                          </h4>
                          <div className="text-xs sm:text-base font-bold font-mono text-slate-800 tracking-wide flex flex-wrap items-center gap-1.5">
                            <span className="text-blue-700 font-black">
                              {formatCurrency(product.salePrice, currency, rates)}
                            </span>
                            <span className="text-slate-400">-</span>
                            <span className="text-slate-700 font-mono">
                              (<HighlightedText text={product.code} highlight={searchTerm} />)
                            </span>
                            {product.barcode && (
                              <>
                                <span className="text-slate-400">-</span>
                                <span className="text-slate-500 font-mono text-xs">
                                  <HighlightedText text={product.barcode} highlight={searchTerm} />
                                </span>
                              </>
                            )}
                            <span className="text-slate-400">-</span>
                            <span
                              className={`text-xs font-bold ${
                                product.quantity > 0 ? 'text-emerald-700' : 'text-rose-600'
                              }`}
                            >
                              {product.quantity > 0
                                ? `المتوفر: ${product.quantity} ${product.unit}`
                                : 'نفذ المخزون'}
                            </span>
                          </div>
                        </div>

                        {/* In-cart badge or button */}
                        <div className="shrink-0">
                          {inCart ? (
                            <span className="px-3 py-1 bg-blue-600 text-white font-black text-xs rounded-full shadow-2xs">
                              {inCart.quantity} بالفاتورة
                            </span>
                          ) : (
                            <button
                              type="button"
                              className="w-7 h-7 rounded-lg bg-slate-100 group-hover:bg-blue-600 group-hover:text-white text-slate-600 flex items-center justify-center transition shadow-2xs font-bold text-xs"
                            >
                              <Plus className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            ) : (
              /* Items Grid */
              <div className="p-4 overflow-y-auto max-h-[50vh] grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {filteredProducts.length === 0 ? (
                  <div className="col-span-full py-12 text-center text-slate-400">
                    <Package className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                    <p className="text-xs">لا توجد أصناف مطابقة للبحث</p>
                  </div>
                ) : (
                  filteredProducts.map((product) => {
                    const inCart = cart.find((i) => i.itemId === product.id);
                    const isOutOfStock = product.quantity <= 0;

                    return (
                      <div
                        key={product.id}
                        onClick={() => !isOutOfStock && handleAddToCart(product)}
                        className={`p-3.5 rounded-xl border transition flex flex-col justify-between cursor-pointer text-right group ${
                          isOutOfStock
                            ? 'bg-slate-50 border-slate-200 opacity-60 cursor-not-allowed'
                            : inCart
                            ? 'bg-blue-50/70 border-blue-300 shadow-xs hover:shadow-md'
                            : 'bg-white border-slate-200 hover:border-blue-400 hover:shadow-md'
                        }`}
                      >
                        <div>
                          <div className="flex items-start justify-between gap-1 mb-1.5">
                            <span className="text-[10px] font-mono text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded">
                              {product.code}
                            </span>
                            <span
                              className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                                product.quantity > 5
                                  ? 'bg-emerald-50 text-emerald-700'
                                  : product.quantity > 0
                                  ? 'bg-amber-50 text-amber-700'
                                  : 'bg-rose-50 text-rose-700'
                              }`}
                            >
                              {product.quantity > 0 ? `${product.quantity} ${product.unit}` : 'نفذ المخزون'}
                            </span>
                          </div>
                          <h4 className="text-xs font-black text-slate-900 line-clamp-2 group-hover:text-blue-600 transition">
                            {product.nameAr}
                          </h4>
                        </div>

                        <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between">
                          <div className="text-sm font-black text-blue-700 font-mono">
                            {formatCurrency(product.salePrice, currency, rates)}
                          </div>
                          {inCart ? (
                            <span className="px-2 py-0.5 rounded-full bg-blue-600 text-white text-xs font-black flex items-center gap-1 shadow-2xs">
                              <Check className="w-3 h-3" />
                              {inCart.quantity} بالفاتورة
                            </span>
                          ) : (
                            <button
                              type="button"
                              className="w-7 h-7 rounded-lg bg-slate-100 text-slate-700 group-hover:bg-blue-600 group-hover:text-white flex items-center justify-center transition shadow-2xs font-bold text-xs"
                            >
                              <Plus className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            )}

            {/* Modal Footer */}
            <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
              <div className="text-xs font-bold text-slate-600">
                إجمالي الأصناف بالفاتورة: <span className="font-mono text-blue-700">{cart.length} أصناف</span>
              </div>
              <button
                type="button"
                onClick={() => setIsCatalogModalOpen(false)}
                className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-xs transition cursor-pointer"
              >
                العودة لشاشة الفاتورة
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CUSTOMER SELECTION MODAL (IDENTICAL TO USER SCREENSHOT) */}
      {isCustomerModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3">
          <div className="bg-white rounded-2xl max-w-md w-full max-h-[85vh] shadow-2xl flex flex-col overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95">
            {/* Header */}
            <div className="p-4 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-blue-600 flex items-center justify-center">
                  <User className="w-4 h-4 text-white" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-white">تحديد العميل</h3>
                  <p className="text-[11px] text-slate-300">اختر العميل لربطه بالفاتورة الحالية</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsCustomerModalOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Search */}
            <div className="p-3 bg-slate-50 border-b border-slate-200">
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute right-3 top-3" />
                <input
                  type="text"
                  value={customerModalSearch}
                  onChange={(e) => setCustomerModalSearch(e.target.value)}
                  placeholder="ابحث باسم العميل، الكود، أو رقم الهاتف..."
                  className="w-full pl-3 pr-9 py-2 bg-white border border-slate-300 rounded-xl text-xs font-bold text-slate-900 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>
            </div>

            {/* Customer List Identical to user photo */}
            <div className="overflow-y-auto max-h-[60vh] divide-y divide-slate-200 bg-white">
              {/* Option 1: Direct Cash Customer */}
              <div
                onClick={() => {
                  setSelectedCustomer(null);
                  setIsCustomerModalOpen(false);
                }}
                className={`py-4 px-4 sm:px-6 flex items-center gap-3.5 cursor-pointer text-right transition ${
                  !selectedCustomer ? 'bg-blue-50/60' : 'hover:bg-slate-50'
                }`}
              >
                <div className="shrink-0">
                  {!selectedCustomer ? (
                    <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full border-2 border-blue-600 bg-blue-600 flex items-center justify-center shadow-xs">
                      <div className="w-2.5 h-2.5 rounded-full bg-white" />
                    </div>
                  ) : (
                    <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full border-2 border-slate-400 flex items-center justify-center" />
                  )}
                </div>
                <div className="flex-1 text-right">
                  <h4 className="text-lg sm:text-2xl font-black text-slate-900 leading-tight">
                    عميل نقدي مباشر (تجزئة / صالة)
                  </h4>
                </div>
              </div>

              {/* Dynamic Customers List */}
              {(customers || [])
                .filter((c) => {
                  if (!customerModalSearch) return true;
                  const q = customerModalSearch.toLowerCase();
                  return (
                    c.nameAr.toLowerCase().includes(q) ||
                    c.code.toLowerCase().includes(q) ||
                    (c.phone && c.phone.toLowerCase().includes(q))
                  );
                })
                .map((cust) => {
                  const isSelected = selectedCustomer?.id === cust.id;
                  return (
                    <div
                      key={cust.id}
                      onClick={() => {
                        setSelectedCustomer(cust);
                        setIsCustomerModalOpen(false);
                      }}
                      className={`py-4 px-4 sm:px-6 flex items-center gap-3.5 cursor-pointer text-right transition ${
                        isSelected ? 'bg-blue-50/60' : 'hover:bg-slate-50'
                      }`}
                    >
                      <div className="shrink-0">
                        {isSelected ? (
                          <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full border-2 border-blue-600 bg-blue-600 flex items-center justify-center shadow-xs">
                            <div className="w-2.5 h-2.5 rounded-full bg-white" />
                          </div>
                        ) : (
                          <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full border-2 border-slate-400 flex items-center justify-center" />
                        )}
                      </div>
                      <div className="flex-1 text-right space-y-1">
                        <h4 className="text-lg sm:text-2xl font-black text-slate-900 leading-tight">
                          {cust.nameAr}
                        </h4>
                        <div className="text-base sm:text-xl font-mono font-bold text-slate-800 tracking-wide">
                          {cust.phone ? `+967 - (${cust.code}) ${cust.phone.replace('+967', '').replace('967', '').trim()}` : `(${cust.code})`}
                        </div>
                      </div>
                    </div>
                  );
                })}
            </div>

            {/* Modal Footer */}
            <div className="p-3 bg-slate-50 border-t border-slate-200 flex items-center justify-end">
              <button
                type="button"
                onClick={() => setIsCustomerModalOpen(false)}
                className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold text-xs rounded-xl transition cursor-pointer"
              >
                إلغاء
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ITEM PROFIT MARGIN INSTANT CALCULATOR MODAL */}
      {isMarginCalcModalOpen && marginCalcItem && (
        <ItemProfitMarginCalculatorModal
          isOpen={isMarginCalcModalOpen}
          onClose={() => {
            setIsMarginCalcModalOpen(false);
            setMarginCalcItem(null);
          }}
          data={marginCalcItem}
          currency={currency}
          rates={rates}
          onApplyPrice={handleApplyPriceFromMarginCalc}
        />
      )}

      {/* FLOATING LIVE AUTO-IMPORT TOAST BANNER */}
      {importToast && (
        <div
          className={`fixed bottom-6 right-6 z-50 max-w-md p-3.5 rounded-2xl shadow-2xl border flex items-center gap-3 animate-in fade-in slide-in-from-bottom-5 duration-200 backdrop-blur-md ${
            importToast.type === 'success'
              ? 'bg-slate-900/95 text-white border-emerald-500/50 shadow-emerald-950/40'
              : importToast.type === 'warning'
              ? 'bg-amber-950/95 text-amber-100 border-amber-500/50 shadow-amber-950/40'
              : 'bg-blue-950/95 text-blue-100 border-blue-500/50 shadow-blue-950/40'
          }`}
        >
          <div
            className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 text-base font-black ${
              importToast.type === 'success'
                ? 'bg-emerald-500 text-slate-950 shadow-sm'
                : importToast.type === 'warning'
                ? 'bg-amber-400 text-slate-950'
                : 'bg-blue-500 text-white'
            }`}
          >
            {importToast.type === 'success' ? '✓' : importToast.type === 'warning' ? '!' : 'ℹ'}
          </div>
          <div className="flex-1 text-xs">
            <p className="font-extrabold leading-tight">{importToast.message}</p>
          </div>
          <button
            type="button"
            onClick={() => setImportToast(null)}
            className="text-slate-400 hover:text-white p-1 rounded-lg transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
};
