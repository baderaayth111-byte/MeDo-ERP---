import React, { useState, useMemo, useRef } from 'react';
import { 
  Users, 
  Plus, 
  FileText, 
  Receipt, 
  Printer, 
  Search, 
  Phone, 
  Mail, 
  MapPin, 
  QrCode, 
  Clock,
  X,
  Upload,
  Download,
  RotateCcw,
  LayoutGrid,
  Table as TableIcon,
  CheckCircle2,
  AlertCircle,
  TrendingUp,
  ArrowUpDown,
  FileSpreadsheet,
  Eye,
  Percent,
  Wallet,
  MessageCircle,
  Send,
  Zap,
  Share2,
  Package,
  Check,
  Layers,
  Barcode,
  Sparkles,
  Copy,
  Trash2
} from 'lucide-react';
import { Customer, Invoice, InvoiceItem, PaymentVoucher, Currency, CompanyProfile, InventoryItem } from '../types/accounting';
import { formatCurrency, tafqeetArabic, exportToCsv } from '../utils/formatters';
import { parseCustomersCsv, RAW_CUSTOMERS_CSV, getLoadedInitialCustomers } from '../data/partnersData';
import { getLoadedInitialInventoryItems } from '../data/inventoryLoader';
import { getIndexedEngine, useDebounce, SearchStats } from '../utils/searchEngine';
import { WhatsAppReminderScheduler } from './WhatsAppReminderScheduler';
import { CompanyHeaderView } from './CompanyHeaderView';
import { DocumentShareModal, DocumentShareData } from './DocumentShareModal';
import { DocumentArchiver } from './DocumentArchiver';

interface AccountsReceivableViewProps {
  customers: Customer[];
  setCustomers?: React.Dispatch<React.SetStateAction<Customer[]>>;
  invoices: Invoice[];
  paymentVouchers: PaymentVoucher[];
  inventoryItems?: InventoryItem[];
  companyProfile: CompanyProfile;
  onAddCustomer: (customer: Customer) => void;
  onAddInvoice: (invoice: Invoice) => void;
  onAddReceiptVoucher: (voucher: PaymentVoucher) => void;
  onUpdateInventoryQuantity?: (itemId: string, newQty: number) => void;
  currency: Currency;
  rates: Record<Currency, number>;
}

export const AccountsReceivableView: React.FC<AccountsReceivableViewProps> = ({
  customers,
  setCustomers,
  invoices,
  paymentVouchers,
  inventoryItems = [],
  companyProfile,
  onAddCustomer,
  onAddInvoice,
  onAddReceiptVoucher,
  onUpdateInventoryQuantity,
  currency,
  rates,
}) => {
  const [activeTab, setActiveTab] = useState<'customers' | 'invoices' | 'aging' | 'whatsapp-scheduler' | 'new-invoice' | 'new-receipt'>('customers');
  const [selectedInvoiceForPrint, setSelectedInvoiceForPrint] = useState<Invoice | null>(null);
  const [shareModalDoc, setShareModalDoc] = useState<DocumentShareData | null>(null);

  // Customer Directory State
  const [searchQuery, setSearchQuery] = useState('');
  const [invoiceSearchQuery, setInvoiceSearchQuery] = useState('');
  const [invoiceStatusFilter, setInvoiceStatusFilter] = useState<'ALL' | 'PAID' | 'PARTIAL' | 'UNPAID'>('ALL');
  const [filterCategory, setFilterCategory] = useState<'ALL' | 'WITH_BALANCE' | 'FULLY_COLLECTED' | 'LOW_RATE' | 'HIGH_BALANCE'>('ALL');
  const [viewMode, setViewMode] = useState<'table' | 'cards'>('table');
  const [selectedCustomerForStatement, setSelectedCustomerForStatement] = useState<Customer | null>(null);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [isAddCustomerModalOpen, setIsAddCustomerModalOpen] = useState(false);
  const [importCsvText, setImportCsvText] = useState('');

  // New Customer Form State
  const [newCustName, setNewCustName] = useState('');
  const [newCustPhone, setNewCustPhone] = useState('');
  const [newCustCity, setNewCustCity] = useState('صنعاء');
  const [newCustBalance, setNewCustBalance] = useState<number>(0);
  const [newCustCollected, setNewCustCollected] = useState<number>(0);

  // New Invoice Form State
  const [selectedCustomerId, setSelectedCustomerId] = useState(customers[0]?.id || '');
  const [invoiceDate, setInvoiceDate] = useState(new Date().toISOString().split('T')[0]);
  const [invoiceDueDate, setInvoiceDueDate] = useState(
    new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  );
  const [invoiceNotes, setInvoiceNotes] = useState('فاتورة مبيعات ضريبية - استحقاق السداد خلال 30 يوماً');
  const [invoiceAttachments, setInvoiceAttachments] = useState<string[]>([]);
  const [invoiceItems, setInvoiceItems] = useState<InvoiceItem[]>([]);

  // Dual Rapid Item Entry State (Name & Code Search)
  const [itemSearchNameQuery, setItemSearchNameQuery] = useState('');
  const [itemSearchCodeQuery, setItemSearchCodeQuery] = useState('');
  const [isNameDropdownOpen, setIsNameDropdownOpen] = useState(false);
  const [isCodeDropdownOpen, setIsCodeDropdownOpen] = useState(false);
  const [selectedInventoryItem, setSelectedInventoryItem] = useState<InventoryItem | null>(null);

  // Draft Item Data Binding Fields
  const [itemDraftItemId, setItemDraftItemId] = useState('');
  const [itemDraftItemCode, setItemDraftItemCode] = useState('');
  const [itemDraftBarcode, setItemDraftBarcode] = useState('');
  const [itemDraftDescription, setItemDraftDescription] = useState('');
  const [itemDraftUnit, setItemDraftUnit] = useState('حبه');
  const [itemDraftAccountCode, setItemDraftAccountCode] = useState('4111');
  const [itemDraftAccountName, setItemDraftAccountName] = useState('إيرادات المبيعات');
  const [itemDraftCurrentStock, setItemDraftCurrentStock] = useState<number>(0);
  const [itemDraftQuantity, setItemDraftQuantity] = useState<number>(1);
  const [itemDraftUnitPrice, setItemDraftUnitPrice] = useState<number>(0);
  const [itemDraftTaxRate, setItemDraftTaxRate] = useState<number>(0.05);

  const routineNameInputRef = useRef<HTMLInputElement>(null);
  const routineCodeInputRef = useRef<HTMLInputElement>(null);

  // Table Row Inline Autocomplete State (for Name & Code in-line search)
  const [activeTableSearchRowIndex, setActiveTableSearchRowIndex] = useState<number | null>(null);
  const [activeTableCodeSearchRowIndex, setActiveTableCodeSearchRowIndex] = useState<number | null>(null);

  // Inventory Catalog Modal State
  const [isCatalogModalOpen, setIsCatalogModalOpen] = useState(false);
  const [catalogSearchQuery, setCatalogSearchQuery] = useState('');
  const [catalogCategoryFilter, setCatalogCategoryFilter] = useState('ALL');

  // Combined inventory catalogue guaranteeing items always exist
  const allInventoryCatalog = useMemo(() => {
    if (inventoryItems && inventoryItems.length > 0) {
      return inventoryItems;
    }
    return getLoadedInitialInventoryItems();
  }, [inventoryItems]);

  // Categories extracted from catalogue
  const catalogCategories = useMemo(() => {
    const cats = new Set<string>();
    allInventoryCatalog.forEach(i => {
      if (i.category) cats.add(i.category);
    });
    return Array.from(cats);
  }, [allInventoryCatalog]);

  // New Receipt Voucher Form State
  const [receiptCustomerId, setReceiptCustomerId] = useState(customers[0]?.id || '');
  const [receiptAmount, setReceiptAmount] = useState<number>(0);
  const [receiptMethod, setReceiptMethod] = useState<'CASH' | 'BANK_TRANSFER' | 'CHEQUE'>('BANK_TRANSFER');
  const [receiptRef, setReceiptRef] = useState(`TX-${Date.now().toString().slice(-6)}`);
  const [receiptNotes, setReceiptNotes] = useState('');
  const [receiptAttachments, setReceiptAttachments] = useState<string[]>([]);

  const customerInvoices = useMemo(() => invoices.filter(i => i.type === 'CUSTOMER_INVOICE'), [invoices]);

  const filteredCustomerInvoices = useMemo(() => {
    return customerInvoices.filter((inv) => {
      const matchStatus = invoiceStatusFilter === 'ALL' || inv.status === invoiceStatusFilter;
      if (!invoiceSearchQuery.trim()) return matchStatus;
      const q = invoiceSearchQuery.toLowerCase().trim();
      const matchNum = inv.invoiceNumber.toLowerCase().includes(q);
      const matchName = inv.entityName.toLowerCase().includes(q);
      const matchItem = inv.items?.some(i => i.description.toLowerCase().includes(q));
      const matchDate = (inv.date || '').includes(q) || (inv.dueDate || '').includes(q);
      return matchStatus && (matchNum || matchName || matchItem || matchDate);
    });
  }, [customerInvoices, invoiceSearchQuery, invoiceStatusFilter]);

  // KPI Calculations across all customers
  const totalCustomersCount = customers.length;
  const totalCollectedAmount = useMemo(() => {
    return customers.reduce((sum, c) => sum + (c.totalCollected ?? (c.currentBalance > 0 ? 0 : c.creditLimit)), 0);
  }, [customers]);

  const totalRemainingBalance = useMemo(() => {
    return customers.reduce((sum, c) => sum + c.currentBalance, 0);
  }, [customers]);

  const totalOperationsTurnover = useMemo(() => {
    return customers.reduce((sum, c) => sum + (c.totalOperations ?? (c.totalCollected || 0) + c.currentBalance), 0);
  }, [customers]);

  const overallCollectionPercentage = totalOperationsTurnover > 0 
    ? ((totalCollectedAmount / totalOperationsTurnover) * 100).toFixed(2) 
    : '0.00';

  // Filtered customers
  const filteredCustomers = useMemo(() => {
    return customers.filter((cust) => {
      const matchSearch = 
        cust.nameAr.toLowerCase().includes(searchQuery.toLowerCase()) ||
        cust.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (cust.city && cust.city.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (cust.phone && cust.phone.includes(searchQuery));

      if (!matchSearch) return false;

      const rate = cust.collectionRate ?? (cust.totalOperations ? ((cust.totalCollected || 0) / cust.totalOperations) * 100 : 0);

      if (filterCategory === 'WITH_BALANCE') {
        return cust.currentBalance > 0;
      } else if (filterCategory === 'FULLY_COLLECTED') {
        return cust.currentBalance <= 0 || rate >= 99.5;
      } else if (filterCategory === 'LOW_RATE') {
        return rate < 50 && cust.currentBalance > 0;
      } else if (filterCategory === 'HIGH_BALANCE') {
        return cust.currentBalance >= 100000;
      }
      return true;
    });
  }, [customers, searchQuery, filterCategory]);

  // High-Performance In-Memory Search Engine & Index (B-Tree + Inverted Token Index)
  const searchIndex = useMemo(() => getIndexedEngine(allInventoryCatalog), [allInventoryCatalog]);

  // Debounced Search Inputs to eliminate keystroke lag
  const debouncedNameQuery = useDebounce(itemSearchNameQuery, 75);
  const debouncedCodeQuery = useDebounce(itemSearchCodeQuery, 40);

  // Indexed Rapid Item Lookup by Name (Capped at 15 items, < 0.8ms)
  const { results: nameSearchResults, stats: nameSearchStats } = useMemo(() => {
    return searchIndex.search(debouncedNameQuery, {
      category: 'ALL',
      limit: 15,
      minScoreThreshold: debouncedNameQuery.trim() ? 25 : 1,
    });
  }, [searchIndex, debouncedNameQuery]);

  const matchingNameInventoryItems = useMemo(() => {
    return nameSearchResults.map(r => r.item);
  }, [nameSearchResults]);

  // Indexed Rapid Item Lookup by Code / Barcode (O(1) Hash Map)
  const { results: codeSearchResults, stats: codeSearchStats } = useMemo(() => {
    return searchIndex.search(debouncedCodeQuery, {
      category: 'ALL',
      limit: 15,
      isCodeSearchOnly: true,
      minScoreThreshold: debouncedCodeQuery.trim() ? 25 : 1,
    });
  }, [searchIndex, debouncedCodeQuery]);

  const matchingCodeInventoryItems = useMemo(() => {
    return codeSearchResults.map(r => r.item);
  }, [codeSearchResults]);

  // In-Row Table Autocomplete suggestions (Computed ONLY for the focused row to avoid O(N*M) loop lag)
  const activeRowNameMatchingItems = useMemo(() => {
    if (activeTableSearchRowIndex === null) return [];
    const currentItem = invoiceItems[activeTableSearchRowIndex];
    if (!currentItem || !currentItem.description || !currentItem.description.trim()) return [];
    return searchIndex.search(currentItem.description, { limit: 8, minScoreThreshold: 20 }).items;
  }, [searchIndex, activeTableSearchRowIndex, invoiceItems]);

  const activeRowCodeMatchingItems = useMemo(() => {
    if (activeTableCodeSearchRowIndex === null) return [];
    const currentItem = invoiceItems[activeTableCodeSearchRowIndex];
    if (!currentItem || !currentItem.itemCode || !currentItem.itemCode.trim()) return [];
    return searchIndex.search(currentItem.itemCode, { limit: 8, minScoreThreshold: 20 }).items;
  }, [searchIndex, activeTableCodeSearchRowIndex, invoiceItems]);

  // Complete Data Binding for selected inventory item
  const handleSelectInventoryItem = (item: InventoryItem) => {
    setSelectedInventoryItem(item);
    setItemDraftItemId(item.id);
    setItemDraftItemCode(item.code);
    setItemDraftBarcode(item.barcode || '');
    setItemDraftDescription(item.nameAr);
    setItemDraftUnit(item.unit || 'حبه');
    setItemDraftUnitPrice(item.salePrice || 0);
    setItemDraftAccountCode('4111');
    setItemDraftAccountName('إيرادات المبيعات');
    setItemDraftCurrentStock(item.quantity);
    setItemSearchNameQuery(item.nameAr);
    setItemSearchCodeQuery(item.code);
    setIsNameDropdownOpen(false);
    setIsCodeDropdownOpen(false);

    if (routineNameInputRef.current) {
      routineNameInputRef.current.focus();
    }
  };

  // Instant 1-click addition to invoice with complete metadata binding
  const handleInstantAddItem = (item: InventoryItem, customQty: number = 1) => {
    const qty = Math.max(1, customQty);
    const price = Math.max(0, item.salePrice || 0);
    const taxRate = 0.05;
    const sub = qty * price;
    const tax = sub * taxRate;

    setInvoiceItems(prev => [
      ...prev,
      {
        id: Math.random().toString(),
        itemId: item.id,
        itemCode: item.code,
        barcode: item.barcode || '',
        description: item.nameAr,
        unit: item.unit || 'حبه',
        quantity: qty,
        unitPrice: price,
        taxRate: taxRate,
        taxAmount: tax,
        subtotal: sub,
        total: sub + tax,
        accountCode: '4111',
        accountName: 'إيرادات المبيعات',
        currentStock: item.quantity,
      }
    ]);

    // Clear search for next rapid item
    setItemSearchNameQuery('');
    setItemSearchCodeQuery('');
    setItemDraftDescription('');
    setItemDraftItemId('');
    setItemDraftItemCode('');
    setItemDraftBarcode('');
    setSelectedInventoryItem(null);
    setItemDraftQuantity(1);
    setItemDraftUnitPrice(0);
    setItemDraftCurrentStock(0);
    setIsNameDropdownOpen(false);
    setIsCodeDropdownOpen(false);
    
    if (routineNameInputRef.current) {
      routineNameInputRef.current.focus();
    }
  };

  // Handler for selecting an item inside a table row inline autocomplete
  const handleSelectRowItem = (rowIndex: number, item: InventoryItem) => {
    const currentItem = invoiceItems[rowIndex];
    const qty = currentItem ? currentItem.quantity : 1;
    const price = Math.max(0, item.salePrice || 0);
    const taxRate = currentItem ? currentItem.taxRate : 0.05;
    const sub = qty * price;
    const tax = sub * taxRate;

    setInvoiceItems(prev =>
      prev.map((it, idx) =>
        idx === rowIndex
          ? {
              ...it,
              itemId: item.id,
              itemCode: item.code,
              barcode: item.barcode || '',
              description: item.nameAr,
              unit: item.unit || 'حبه',
              unitPrice: price,
              accountCode: '4111',
              accountName: 'إيرادات المبيعات',
              currentStock: item.quantity,
              subtotal: sub,
              taxAmount: tax,
              total: sub + tax,
            }
          : it
      )
    );
    setActiveTableSearchRowIndex(null);
    setActiveTableCodeSearchRowIndex(null);
  };

  // Filtered items for Catalog Browser Modal
  const filteredCatalogItems = useMemo(() => {
    return allInventoryCatalog.filter(item => {
      const matchCat = catalogCategoryFilter === 'ALL' || item.category === catalogCategoryFilter;
      const q = catalogSearchQuery.toLowerCase().trim();
      const matchQuery = !q || (
        item.nameAr.toLowerCase().includes(q) ||
        (item.nameEn && item.nameEn.toLowerCase().includes(q)) ||
        item.code.toLowerCase().includes(q) ||
        (item.barcode && item.barcode.includes(q)) ||
        (item.category && item.category.toLowerCase().includes(q))
      );
      return matchCat && matchQuery;
    });
  }, [allInventoryCatalog, catalogSearchQuery, catalogCategoryFilter]);

  const handleRoutineAddItem = (e?: React.FormEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    
    const desc = (itemDraftDescription || itemSearchNameQuery || itemSearchCodeQuery).trim();
    if (!desc) {
      if (routineNameInputRef.current) routineNameInputRef.current.focus();
      return;
    }

    const matched = selectedInventoryItem || allInventoryCatalog.find(
      i => (itemSearchCodeQuery && i.code.toLowerCase() === itemSearchCodeQuery.trim().toLowerCase()) ||
           (itemSearchCodeQuery && i.barcode && i.barcode === itemSearchCodeQuery.trim()) ||
           (itemSearchNameQuery && i.nameAr.toLowerCase() === itemSearchNameQuery.trim().toLowerCase()) ||
           i.nameAr.toLowerCase() === desc.toLowerCase()
    );

    const qty = Math.max(1, Number(itemDraftQuantity) || 1);
    const price = Math.max(0, Number(itemDraftUnitPrice) || (matched ? (matched.salePrice || 0) : 0));
    const taxRate = Number(itemDraftTaxRate) || 0;
    const sub = qty * price;
    const tax = sub * taxRate;

    const newItem: InvoiceItem = {
      id: Math.random().toString(),
      itemId: matched ? matched.id : (itemDraftItemId || `ITEM-MANUAL-${Date.now().toString().slice(-4)}`),
      itemCode: matched ? matched.code : (itemDraftItemCode || itemSearchCodeQuery || `ITM-${Date.now().toString().slice(-3)}`),
      barcode: matched?.barcode || itemDraftBarcode || '',
      description: matched ? matched.nameAr : desc,
      unit: matched ? (matched.unit || 'حبه') : (itemDraftUnit || 'حبه'),
      quantity: qty,
      unitPrice: price,
      taxRate: taxRate,
      taxAmount: tax,
      subtotal: sub,
      total: sub + tax,
      accountCode: itemDraftAccountCode || '4111',
      accountName: itemDraftAccountName || 'إيرادات المبيعات',
      currentStock: matched ? matched.quantity : (itemDraftCurrentStock || 0),
    };

    setInvoiceItems(prev => [...prev, newItem]);

    // Reset draft fields for seamless next item entry
    setItemSearchNameQuery('');
    setItemSearchCodeQuery('');
    setItemDraftDescription('');
    setItemDraftItemId('');
    setItemDraftItemCode('');
    setItemDraftBarcode('');
    setSelectedInventoryItem(null);
    setItemDraftQuantity(1);
    setItemDraftUnitPrice(0);
    setItemDraftCurrentStock(0);
    setIsNameDropdownOpen(false);
    setIsCodeDropdownOpen(false);

    // Keep focus on input for rapid sequential entry
    setTimeout(() => {
      if (routineNameInputRef.current) {
        routineNameInputRef.current.focus();
      }
    }, 50);
  };

  const handleQuickAddChip = (item: InventoryItem) => {
    handleInstantAddItem(item, 1);
  };

  // Invoice calculations
  const invoiceSubtotal = invoiceItems.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);
  const invoiceTaxTotal = invoiceItems.reduce((sum, item) => sum + (item.quantity * item.unitPrice * item.taxRate), 0);
  const invoiceGrandTotal = invoiceSubtotal + invoiceTaxTotal;

  const handleAddItem = () => {
    setInvoiceItems([
      ...invoiceItems,
      {
        id: Math.random().toString(),
        itemId: `ITEM-${Date.now().toString().slice(-4)}`,
        itemCode: `ITM-${Date.now().toString().slice(-3)}`,
        description: '',
        unit: 'حبه',
        quantity: 1,
        unitPrice: 0,
        taxRate: 0.05,
        taxAmount: 0,
        subtotal: 0,
        total: 0,
        accountCode: '4111',
        accountName: 'إيرادات المبيعات',
        currentStock: 0,
      },
    ]);
  };

  const handleDuplicateItem = (index: number) => {
    const item = invoiceItems[index];
    if (!item) return;
    const copy: InvoiceItem = {
      ...item,
      id: Math.random().toString(),
    };
    setInvoiceItems([...invoiceItems.slice(0, index + 1), copy, ...invoiceItems.slice(index + 1)]);
  };

  const handleRemoveItem = (index: number) => {
    if (invoiceItems.length === 1) {
      // Clear instead of removing last item
      setInvoiceItems([{
        id: Math.random().toString(),
        description: '',
        quantity: 1,
        unitPrice: 0,
        taxRate: 0.05,
        taxAmount: 0,
        subtotal: 0,
        total: 0,
      }]);
      return;
    }
    setInvoiceItems(invoiceItems.filter((_, i) => i !== index));
  };

  const handleClearAllItems = () => {
    setInvoiceItems([{
      id: Math.random().toString(),
      description: '',
      quantity: 1,
      unitPrice: 0,
      taxRate: 0.05,
      taxAmount: 0,
      subtotal: 0,
      total: 0,
    }]);
  };

  const handleItemChange = (index: number, field: keyof InvoiceItem, val: any) => {
    const updated = [...invoiceItems];
    (updated[index] as any)[field] = val;
    
    const qty = Number(updated[index].quantity) || 0;
    const price = Number(updated[index].unitPrice) || 0;
    const taxRate = Number(updated[index].taxRate) || 0;
    const sub = qty * price;
    const tax = sub * taxRate;
    
    updated[index].subtotal = sub;
    updated[index].taxAmount = tax;
    updated[index].total = sub + tax;
    
    setInvoiceItems(updated);
  };

  const handleCreateInvoice = (e: React.FormEvent) => {
    e.preventDefault();
    const cust = customers.find(c => c.id === selectedCustomerId);
    if (!cust) return;

    const newInv: Invoice = {
      id: `INV-${Date.now().toString().slice(-4)}`,
      invoiceNumber: `INV-2026-00${customerInvoices.length + 93}`,
      type: 'CUSTOMER_INVOICE',
      entityId: cust.id,
      entityName: cust.nameAr,
      date: invoiceDate,
      dueDate: invoiceDueDate,
      items: invoiceItems,
      subtotal: invoiceSubtotal,
      taxTotal: invoiceTaxTotal,
      grandTotal: invoiceGrandTotal,
      paidAmount: 0,
      remainingAmount: invoiceGrandTotal,
      currency: 'YER',
      exchangeRate: 1,
      status: 'UNPAID',
      notes: invoiceNotes,
      attachments: invoiceAttachments
    };

    onAddInvoice(newInv);
    setInvoiceAttachments([]);
    alert(`تم إصدار الفاتورة الضريبية رقم ${newInv.invoiceNumber} بنجاح!`);
    setActiveTab('invoices');
  };

  const handleCreateReceipt = (e: React.FormEvent) => {
    e.preventDefault();
    const cust = customers.find(c => c.id === receiptCustomerId);
    if (!cust || receiptAmount <= 0) {
      alert('يرجى اختيار العميل وتحديد مبلغ التحصيل.');
      return;
    }

    const newVoucher: PaymentVoucher = {
      id: `RCV-${Date.now().toString().slice(-4)}`,
      voucherNumber: `RCV-2026-00${paymentVouchers.length + 115}`,
      type: 'RECEIPT',
      date: new Date().toISOString().split('T')[0],
      entityId: cust.id,
      entityName: cust.nameAr,
      amount: receiptAmount,
      currency: 'YER',
      exchangeRate: 1,
      amountInBase: receiptAmount,
      paymentMethod: receiptMethod,
      referenceNumber: receiptRef,
      debitAccountCode: '1112',
      creditAccountCode: '1121',
      notes: receiptNotes || `سند تحصيل وقبض نقدي/بنكي من العميل ${cust.nameAr}`,
      status: 'COMPLETED',
      attachments: receiptAttachments
    };

    onAddReceiptVoucher(newVoucher);
    setReceiptAttachments([]);
    alert(`تم إصدار سند القبض رقم ${newVoucher.voucherNumber} بمبلغ ${formatCurrency(receiptAmount, 'YER')} وتحديث رصيد العميل!`);
    setReceiptAmount(0);
    setActiveTab('customers');
  };

  const handleExportCustomersCsv = () => {
    const headers = [
      'م',
      'كود العميل',
      'اسم العميل',
      'التحصيل (ريال)',
      'الرصيد المتبقي (ريال)',
      'إجمالي العمليات (ريال)',
      'نسبة التحصيل %',
      'رقم الهاتف',
      'المدينة',
      'الحالة'
    ];

    const rows = filteredCustomers.map((c, idx) => [
      idx + 1,
      c.code,
      c.nameAr,
      (c.totalCollected ?? 0).toFixed(2),
      c.currentBalance.toFixed(2),
      ((c.totalOperations ?? ((c.totalCollected || 0) + c.currentBalance))).toFixed(2),
      ((c.collectionRate ?? 0)).toFixed(2) + '%',
      c.phone,
      c.city,
      c.currentBalance > 0 ? 'عليه مديونية' : 'مسدد بالكامل'
    ]);

    exportToCsv('كشف_حسابات_العملاء_والتحصيل', headers, rows);
  };

  const handleImportCustomersFromText = (csvContent: string) => {
    if (!csvContent.trim()) return;
    try {
      const parsed = parseCustomersCsv(csvContent);
      if (parsed.length === 0) {
        alert('لم يتم العثور على سجلات صالحة في ملف CSV.');
        return;
      }
      if (setCustomers) {
        setCustomers(parsed);
      }
      setIsImportModalOpen(false);
      setImportCsvText('');
      alert(`تم استيراد ${parsed.length} عميل بنجاح وتحديث كشف حسابات العملاء!`);
    } catch (err: any) {
      alert(`خطأ أثناء استيراد الملف: ${err.message}`);
    }
  };

  const handleResetToDefaultCsv = () => {
    if (confirm('هل ترغب بإعادة تحميل كشف العملاء الافتراضي (100 عميل)؟')) {
      const defaultList = getLoadedInitialCustomers();
      if (setCustomers) {
        setCustomers(defaultList);
      }
      alert('تمت استعادة كشف العملاء الكامل (100 عميل) بنجاح!');
    }
  };

  const handleManualAddCustomer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCustName.trim()) return;

    const totalOps = (newCustCollected || 0) + (newCustBalance || 0);
    const rate = totalOps > 0 ? ((newCustCollected / totalOps) * 100) : 0;
    const newCode = `C-${String(customers.length + 1).padStart(4, '0')}`;

    const newCust: Customer = {
      id: `CUST-${Date.now().toString().slice(-4)}`,
      code: newCode,
      nameAr: newCustName,
      nameEn: `Customer ${newCode}`,
      phone: newCustPhone || '+967 77' + Math.floor(1000000 + Math.random() * 8999999),
      email: `client_${newCode.toLowerCase()}@clients.ye`,
      city: newCustCity,
      address: 'اليمن - المحافظات الرئيسية',
      currency: 'YER',
      creditLimit: Math.max(500000, totalOps * 1.5),
      currentBalance: newCustBalance,
      totalCollected: newCustCollected,
      totalOperations: totalOps,
      collectionRate: parseFloat(rate.toFixed(2)),
      status: 'ACTIVE',
      notes: 'عميل مضاف يدوياً',
    };

    onAddCustomer(newCust);
    setIsAddCustomerModalOpen(false);
    setNewCustName('');
    setNewCustPhone('');
    setNewCustBalance(0);
    setNewCustCollected(0);
    alert(`تمت إضافة العميل ${newCust.nameAr} بكود (${newCust.code}) بنجاح!`);
  };

  return (
    <div className="space-y-6">
      {/* Top Header & Tab Navigation */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white border border-slate-200 p-5 rounded-xl shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <span className="bg-emerald-50 text-emerald-700 text-xs px-2.5 py-0.5 rounded-md font-mono font-bold border border-emerald-200">
              SAP T-Code: FB70 / FBL5N
            </span>
            <h2 className="text-lg sm:text-xl font-bold text-slate-800">إدارة العملاء والذمم المدينة (Accounts Receivable)</h2>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            كشف حسابات العملاء، تتبع التحصيل، إصدار الفواتير وسندات القبض، وتحليل أعمار الديون.
          </p>
        </div>

        <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl border border-slate-200 overflow-x-auto w-full sm:w-auto">
          <button
            onClick={() => setActiveTab('customers')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition whitespace-nowrap flex items-center gap-1.5 ${
              activeTab === 'customers' ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>كشف ودليل العملاء ({totalCustomersCount})</span>
          </button>
          <button
            onClick={() => setActiveTab('invoices')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition whitespace-nowrap flex items-center gap-1.5 ${
              activeTab === 'invoices' ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>فواتير المبيعات ({customerInvoices.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('whatsapp-scheduler')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition whitespace-nowrap flex items-center gap-1.5 ${
              activeTab === 'whatsapp-scheduler' ? 'bg-emerald-600 text-white shadow-xs' : 'text-emerald-700 hover:bg-emerald-50'
            }`}
          >
            <MessageCircle className="w-3.5 h-3.5 text-emerald-400" />
            <span>جدولة تذكيرات الواتساب ⚡</span>
          </button>
          <button
            onClick={() => setActiveTab('aging')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition whitespace-nowrap flex items-center gap-1.5 ${
              activeTab === 'aging' ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>أعمار الديون (Aging)</span>
          </button>
          <button
            onClick={() => setActiveTab('new-invoice')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition whitespace-nowrap flex items-center gap-1.5 ${
              activeTab === 'new-invoice' ? 'bg-emerald-600 text-white shadow-xs' : 'text-emerald-700 hover:bg-emerald-50'
            }`}
          >
            <Plus className="w-3.5 h-3.5" />
            <span>+ فاتورة مبيعات</span>
          </button>
          <button
            onClick={() => setActiveTab('new-receipt')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition whitespace-nowrap flex items-center gap-1.5 ${
              activeTab === 'new-receipt' ? 'bg-teal-600 text-white shadow-xs' : 'text-teal-700 hover:bg-teal-50'
            }`}
          >
            <Receipt className="w-3.5 h-3.5" />
            <span>+ سند قبض</span>
          </button>
        </div>
      </div>

      {/* TAB 1: CUSTOMERS DIRECTORY & LEDGER (IMPORTED FROM CSV) */}
      {activeTab === 'customers' && (
        <div className="space-y-4">
          {/* Top KPI Metrics Banner */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            <div className="bg-white border border-slate-200 p-3.5 rounded-xl shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold text-slate-500">إجمالي العملاء المسجلين</span>
                <Users className="w-4 h-4 text-blue-500" />
              </div>
              <div className="text-xl font-bold font-mono text-slate-900 mt-1">
                {totalCustomersCount} <span className="text-xs font-normal text-slate-400">عميل</span>
              </div>
              <span className="text-[10px] text-blue-600 font-medium mt-0.5 block">مستورد ومطابق من CSV</span>
            </div>

            <div className="bg-white border border-slate-200 p-3.5 rounded-xl shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold text-slate-500">إجمالي مبالغ التحصيل</span>
                <TrendingUp className="w-4 h-4 text-emerald-500" />
              </div>
              <div className="text-lg font-bold font-mono text-emerald-600 mt-1">
                {formatCurrency(totalCollectedAmount, currency)}
              </div>
              <span className="text-[10px] text-slate-400 mt-0.5 block">مبالغ مقبوضة فعلياً</span>
            </div>

            <div className="bg-white border border-slate-200 p-3.5 rounded-xl shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold text-slate-500">إجمالي الأرصدة المتبقية</span>
                <AlertCircle className="w-4 h-4 text-amber-500" />
              </div>
              <div className="text-lg font-bold font-mono text-amber-600 mt-1">
                {formatCurrency(totalRemainingBalance, currency)}
              </div>
              <span className="text-[10px] text-slate-400 mt-0.5 block">مديونيات مستحقة السداد</span>
            </div>

            <div className="bg-white border border-slate-200 p-3.5 rounded-xl shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold text-slate-500">إجمالي حجم التعاملات</span>
                <Wallet className="w-4 h-4 text-indigo-500" />
              </div>
              <div className="text-lg font-bold font-mono text-indigo-600 mt-1">
                {formatCurrency(totalOperationsTurnover, currency)}
              </div>
              <span className="text-[10px] text-slate-400 mt-0.5 block">التحصيل + المتبقي</span>
            </div>

            <div className="bg-white border border-slate-200 p-3.5 rounded-xl shadow-xs col-span-2 md:col-span-1">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold text-slate-500">متوسط نسبة التحصيل</span>
                <Percent className="w-4 h-4 text-teal-500" />
              </div>
              <div className="text-lg font-bold font-mono text-teal-600 mt-1">
                {overallCollectionPercentage}%
              </div>
              <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden mt-1.5">
                <div 
                  className="bg-teal-500 h-full rounded-full" 
                  style={{ width: `${Math.min(100, parseFloat(overallCollectionPercentage))}%` }}
                />
              </div>
            </div>
          </div>

          {/* Action Toolbar */}
          <div className="bg-white border border-slate-200 rounded-xl p-3.5 shadow-xs flex flex-col md:flex-row items-center justify-between gap-3">
            {/* Search Input */}
            <div className="relative w-full md:w-80">
              <Search className="w-4 h-4 absolute right-3 top-2.5 text-slate-400" />
              <input
                type="text"
                placeholder="بحث بالاسم، الكود، المدينة، الهاتف..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-3 pr-9 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute left-2.5 top-2 text-slate-400 hover:text-slate-600 text-xs"
                >
                  ✕
                </button>
              )}
            </div>

            {/* Category Filter Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto pb-1 md:pb-0">
              <button
                onClick={() => setFilterCategory('ALL')}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition ${
                  filterCategory === 'ALL' ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                الكل ({customers.length})
              </button>
              <button
                onClick={() => setFilterCategory('WITH_BALANCE')}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition ${
                  filterCategory === 'WITH_BALANCE' ? 'bg-amber-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                عليهم رصيد مستحق ({customers.filter(c => c.currentBalance > 0).length})
              </button>
              <button
                onClick={() => setFilterCategory('FULLY_COLLECTED')}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition ${
                  filterCategory === 'FULLY_COLLECTED' ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                مسدد بالكامل ({customers.filter(c => c.currentBalance <= 0 || (c.collectionRate && c.collectionRate >= 99.5)).length})
              </button>
              <button
                onClick={() => setFilterCategory('LOW_RATE')}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition ${
                  filterCategory === 'LOW_RATE' ? 'bg-rose-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                نسبة تحصيل منخفضة &lt;50% ({customers.filter(c => (c.collectionRate ?? 0) < 50 && c.currentBalance > 0).length})
              </button>
              <button
                onClick={() => setFilterCategory('HIGH_BALANCE')}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition ${
                  filterCategory === 'HIGH_BALANCE' ? 'bg-purple-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                كبار المديونيات (&gt;100K)
              </button>
            </div>

            {/* Quick Action Buttons */}
            <div className="flex items-center gap-1.5 w-full md:w-auto justify-end">
              <div className="flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200 ml-1">
                <button
                  onClick={() => setViewMode('table')}
                  className={`p-1 rounded ${viewMode === 'table' ? 'bg-white text-blue-600 shadow-xs' : 'text-slate-500'}`}
                  title="عرض جدول كشف الحسابات"
                >
                  <TableIcon className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => setViewMode('cards')}
                  className={`p-1 rounded ${viewMode === 'cards' ? 'bg-white text-blue-600 shadow-xs' : 'text-slate-500'}`}
                  title="عرض البطاقات الذكية"
                >
                  <LayoutGrid className="w-3.5 h-3.5" />
                </button>
              </div>

              <button
                onClick={handleExportCustomersCsv}
                className="px-2.5 py-1.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-lg text-xs font-semibold flex items-center gap-1 shadow-xs"
                title="تصدير كشف العملاء إلى CSV"
              >
                <Download className="w-3.5 h-3.5 text-emerald-600" />
                <span>تصدير CSV</span>
              </button>

              <button
                onClick={() => setIsImportModalOpen(true)}
                className="px-2.5 py-1.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-lg text-xs font-semibold flex items-center gap-1 shadow-xs"
                title="استيراد كشف عملاء جديد من CSV"
              >
                <Upload className="w-3.5 h-3.5 text-blue-600" />
                <span>استيراد CSV</span>
              </button>

              <button
                onClick={handleResetToDefaultCsv}
                className="p-1.5 bg-white hover:bg-slate-50 text-slate-500 border border-slate-200 rounded-lg shadow-xs"
                title="استعادة كشف الـ 100 عميل الأصلي"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>

              <button
                onClick={() => setIsAddCustomerModalOpen(true)}
                className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold flex items-center gap-1 shadow-xs"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>+ عميل جديد</span>
              </button>
            </div>
          </div>

          {/* TABLE VIEW */}
          {viewMode === 'table' ? (
            <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
              <div className="overflow-x-auto">
                <table className="w-full text-right text-xs">
                  <thead className="bg-slate-50 text-slate-700 border-b border-slate-200 font-semibold">
                    <tr>
                      <th className="p-3 w-12 text-center">م</th>
                      <th className="p-3">كود العميل</th>
                      <th className="p-3">اسم العميل</th>
                      <th className="p-3 text-left">التحصيل (المسدد)</th>
                      <th className="p-3 text-left">الرصيد المتبقي</th>
                      <th className="p-3 text-left">إجمالي التعاملات</th>
                      <th className="p-3 text-center w-36">نسبة التحصيل %</th>
                      <th className="p-3 text-center">الحالة</th>
                      <th className="p-3 text-center">الإجراءات</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredCustomers.length === 0 ? (
                      <tr>
                        <td colSpan={9} className="p-8 text-center text-slate-400">
                          لا توجد نتائج مطابقة لبحثك أو التصنيف المحدد.
                        </td>
                      </tr>
                    ) : (
                      filteredCustomers.map((cust, index) => {
                        const rate = cust.collectionRate ?? (cust.totalOperations ? Math.round(((cust.totalCollected || 0) / cust.totalOperations) * 100) : 0);
                        const isComplete = cust.currentBalance <= 0 || rate >= 99.5;
                        const isLow = rate < 50 && cust.currentBalance > 0;

                        return (
                          <tr key={cust.id} className="hover:bg-slate-50/80 transition">
                            <td className="p-3 text-center font-mono text-slate-400 font-semibold">{index + 1}</td>
                            <td className="p-3 font-mono font-bold text-blue-700 bg-blue-50/30">
                              {cust.code}
                            </td>
                            <td className="p-3 font-bold text-slate-800">
                              <div className="flex items-center gap-2">
                                <span>{cust.nameAr}</span>
                                {cust.notes && (
                                  <span className="text-[10px] text-slate-400 font-normal">({cust.notes})</span>
                                )}
                              </div>
                            </td>
                            <td className="p-3 text-left font-mono font-bold text-emerald-600">
                              {formatCurrency(cust.totalCollected ?? 0, currency)}
                            </td>
                            <td className="p-3 text-left font-mono font-bold text-amber-600">
                              {formatCurrency(cust.currentBalance, currency)}
                            </td>
                            <td className="p-3 text-left font-mono text-slate-700">
                              {formatCurrency(cust.totalOperations ?? ((cust.totalCollected || 0) + cust.currentBalance), currency)}
                            </td>
                            <td className="p-3 text-center">
                              <div className="flex flex-col items-center gap-1">
                                <span className={`font-mono text-[11px] font-bold ${
                                  isComplete ? 'text-emerald-700' : isLow ? 'text-rose-600' : 'text-blue-600'
                                }`}>
                                  {rate.toFixed(1)}%
                                </span>
                                <div className="w-24 bg-slate-100 h-1.5 rounded-full overflow-hidden">
                                  <div 
                                    className={`h-full rounded-full ${
                                      isComplete ? 'bg-emerald-500' : isLow ? 'bg-rose-500' : 'bg-blue-500'
                                    }`}
                                    style={{ width: `${Math.min(100, Math.max(0, rate))}%` }}
                                  />
                                </div>
                              </div>
                            </td>
                            <td className="p-3 text-center">
                              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${
                                isComplete 
                                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                                  : isLow
                                  ? 'bg-rose-50 text-rose-700 border-rose-200'
                                  : 'bg-amber-50 text-amber-700 border-amber-200'
                              }`}>
                                {isComplete ? 'مسدد بالكامل' : isLow ? 'تحصيل منخفض' : 'جاري المتابعة'}
                              </span>
                            </td>
                            <td className="p-3 text-center">
                              <div className="flex items-center justify-center gap-1">
                                <button
                                  onClick={() => setSelectedCustomerForStatement(cust)}
                                  className="p-1.5 bg-slate-100 hover:bg-blue-50 hover:text-blue-600 text-slate-600 rounded-lg transition"
                                  title="عرض كشف حساب العميل التفصيلي"
                                >
                                  <Eye className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={() => {
                                    setShareModalDoc({
                                      type: 'ACCOUNT_STATEMENT',
                                      documentNumber: cust.code,
                                      date: new Date().toISOString().split('T')[0],
                                      recipientName: cust.nameAr,
                                      recipientPhone: cust.phone || '771234567',
                                      amount: cust.currentBalance,
                                      currentBalance: cust.currentBalance,
                                      currency: currency,
                                      notes: `كشف حساب ومطالبة سداد الرصيد المستحق: ${formatCurrency(cust.currentBalance, currency)}`,
                                    });
                                  }}
                                  className="p-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-lg transition"
                                  title="إرسال تذكير بالرصيد وكشف الحساب عبر الواتساب"
                                >
                                  <MessageCircle className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={() => {
                                    setReceiptCustomerId(cust.id);
                                    setReceiptAmount(cust.currentBalance > 0 ? cust.currentBalance : 0);
                                    setActiveTab('new-receipt');
                                  }}
                                  className="p-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-lg transition"
                                  title="إصدار سند قبض سريع لهذا العميل"
                                >
                                  <Receipt className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={() => {
                                    setSelectedCustomerId(cust.id);
                                    setActiveTab('new-invoice');
                                  }}
                                  className="p-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg transition"
                                  title="إصدار فاتورة مبيعات جديدة لهذا العميل"
                                >
                                  <Plus className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>

              {/* Table Footer Summary */}
              <div className="bg-slate-50 border-t border-slate-200 p-3 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-600 gap-2">
                <div>
                  عرض <strong className="text-slate-800">{filteredCustomers.length}</strong> من أصل <strong className="text-slate-800">{customers.length}</strong> عميل
                </div>
                <div className="flex items-center gap-4">
                  <span>إجمالي التحصيل المعروض: <strong className="text-emerald-700 font-mono">{formatCurrency(filteredCustomers.reduce((s, c) => s + (c.totalCollected || 0), 0), currency)}</strong></span>
                  <span>إجمالي المتبقي المعروض: <strong className="text-amber-700 font-mono">{formatCurrency(filteredCustomers.reduce((s, c) => s + c.currentBalance, 0), currency)}</strong></span>
                </div>
              </div>
            </div>
          ) : (
            /* CARDS VIEW */
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredCustomers.map((cust) => {
                const rate = cust.collectionRate ?? (cust.totalOperations ? Math.round(((cust.totalCollected || 0) / cust.totalOperations) * 100) : 0);
                const isComplete = cust.currentBalance <= 0 || rate >= 99.5;

                return (
                  <div key={cust.id} className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs space-y-3 hover:border-blue-300 transition">
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200 font-bold">
                            {cust.code}
                          </span>
                          <h3 className="text-sm font-bold text-slate-900">{cust.nameAr}</h3>
                        </div>
                        <p className="text-[11px] text-slate-400 mt-0.5">{cust.city}</p>
                      </div>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                        isComplete ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-amber-50 text-amber-700 border-amber-200'
                      }`}>
                        {isComplete ? 'مسدد' : 'متبقي رصيد'}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 p-2.5 bg-slate-50 rounded-lg border border-slate-200 text-xs">
                      <div>
                        <span className="text-[10px] text-slate-500 block">المبلغ المحصل</span>
                        <span className="font-mono font-bold text-emerald-600">
                          {formatCurrency(cust.totalCollected || 0, currency)}
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-500 block">الرصيد المتبقي</span>
                        <span className="font-mono font-bold text-amber-600">
                          {formatCurrency(cust.currentBalance, currency)}
                        </span>
                      </div>
                    </div>

                    <div className="space-y-1">
                      <div className="flex justify-between text-[11px]">
                        <span className="text-slate-500">نسبة التحصيل:</span>
                        <span className="font-mono font-bold text-slate-700">{rate.toFixed(1)}%</span>
                      </div>
                      <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                        <div 
                          className={`h-full rounded-full ${isComplete ? 'bg-emerald-500' : 'bg-blue-500'}`} 
                          style={{ width: `${Math.min(100, Math.max(0, rate))}%` }}
                        />
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                      <button
                        onClick={() => setSelectedCustomerForStatement(cust)}
                        className="text-xs text-blue-600 hover:text-blue-800 font-semibold flex items-center gap-1"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>كشف الحساب</span>
                      </button>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => {
                            setShareModalDoc({
                              type: 'ACCOUNT_STATEMENT',
                              documentNumber: cust.code,
                              date: new Date().toISOString().split('T')[0],
                              recipientName: cust.nameAr,
                              recipientPhone: cust.phone || '771234567',
                              amount: cust.currentBalance,
                              currentBalance: cust.currentBalance,
                              currency: currency,
                              notes: `كشف حساب ومطالبة سداد الرصيد المستحق: ${formatCurrency(cust.currentBalance, currency)}`,
                            });
                          }}
                          className="p-1 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 rounded"
                          title="تذكير واتساب"
                        >
                          <MessageCircle className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => {
                            setReceiptCustomerId(cust.id);
                            setReceiptAmount(cust.currentBalance > 0 ? cust.currentBalance : 0);
                            setActiveTab('new-receipt');
                          }}
                          className="px-2 py-1 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 rounded text-[11px] font-bold"
                        >
                          سند قبض
                        </button>
                        <button
                          onClick={() => {
                            setSelectedCustomerId(cust.id);
                            setActiveTab('new-invoice');
                          }}
                          className="px-2 py-1 bg-blue-50 text-blue-700 hover:bg-blue-100 rounded text-[11px] font-bold"
                        >
                          فاتورة
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: INVOICES LIST */}
      {activeTab === 'invoices' && (
        <div className="space-y-4">
          {/* Quick Header Banner */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-white border border-slate-200 p-3.5 rounded-xl shadow-xs">
            <div>
              <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                <FileText className="w-4 h-4 text-blue-600" />
                <span>سجل فواتير مبيعات العملاء (Customer Sales Invoices)</span>
              </h3>
              <p className="text-xs text-slate-500">
                متابعة الفواتير الصادرة وتواريخ استحقاق السداد وتوليد التذكيرات التلقائية
              </p>
            </div>

            <button
              onClick={() => setActiveTab('whatsapp-scheduler')}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-xl text-xs font-bold shadow-xs transition"
            >
              <MessageCircle className="w-4 h-4" />
              <span>جدولة تذكيرات الواتساب الذكية ⚡</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white border border-slate-200 p-4 rounded-xl shadow-xs">
              <span className="text-xs text-slate-500 font-semibold block">إجمالي قيمة الفواتير الصادرة</span>
              <div className="text-lg font-bold text-slate-800 mt-1 font-mono">
                {formatCurrency(customerInvoices.reduce((s, i) => s + i.grandTotal, 0), currency)}
              </div>
            </div>
            <div className="bg-white border border-slate-200 p-4 rounded-xl shadow-xs">
              <span className="text-xs text-slate-500 font-semibold block">المبالغ المحصلة</span>
              <div className="text-lg font-bold text-emerald-600 mt-1 font-mono">
                {formatCurrency(customerInvoices.reduce((s, i) => s + i.paidAmount, 0), currency)}
              </div>
            </div>
            <div className="bg-white border border-slate-200 p-4 rounded-xl shadow-xs">
              <span className="text-xs text-slate-500 font-semibold block">الرصيد المتبقي قيد التحصيل</span>
              <div className="text-lg font-bold text-amber-600 mt-1 font-mono">
                {formatCurrency(customerInvoices.reduce((s, i) => s + i.remainingAmount, 0), currency)}
              </div>
            </div>
          </div>

          {/* Search & Filter Bar for Invoices */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
            <div className="relative flex-1 w-full">
              <Search className="w-4 h-4 text-slate-400 absolute right-3 top-2.5" />
              <input
                type="text"
                value={invoiceSearchQuery}
                onChange={(e) => setInvoiceSearchQuery(e.target.value)}
                placeholder="بحث برقم الفاتورة، اسم العميل، التاريخ، أو البنود..."
                className="w-full text-xs pr-9 pl-8 py-2 rounded-lg border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
              />
              {invoiceSearchQuery && (
                <button
                  onClick={() => setInvoiceSearchQuery('')}
                  className="absolute left-2.5 top-2.5 text-slate-400 hover:text-slate-600"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <select
                value={invoiceStatusFilter}
                onChange={(e) => setInvoiceStatusFilter(e.target.value as any)}
                className="text-xs px-3 py-2 rounded-lg border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-semibold w-full sm:w-auto"
              >
                <option value="ALL">جميع حالات الفواتير</option>
                <option value="PAID">مدفوعة بالكامل</option>
                <option value="PARTIAL">سداد جزئي</option>
                <option value="UNPAID">غير مسددة</option>
              </select>
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
            <table className="w-full text-right text-xs">
              <thead className="bg-slate-50 text-slate-700 border-b border-slate-200 font-semibold">
                <tr>
                  <th className="p-3">رقم الفاتورة</th>
                  <th className="p-3">العميل</th>
                  <th className="p-3">تاريخ الإصدار</th>
                  <th className="p-3">تاريخ الاستحقاق</th>
                  <th className="p-3 text-left">الإجمالي مع الضريبة</th>
                  <th className="p-3 text-left">المتبقي</th>
                  <th className="p-3 text-center">الحالة</th>
                  <th className="p-3 text-center">الإجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredCustomerInvoices.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="p-8 text-center text-slate-400 font-medium">
                      {invoiceSearchQuery || invoiceStatusFilter !== 'ALL'
                        ? 'لا توجد فواتير مبيعات تطابق معايير البحث والفلترة الحالية'
                        : 'لا توجد فواتير مبيعات صادرة حتى الآن'}
                    </td>
                  </tr>
                ) : (
                  filteredCustomerInvoices.map((inv) => {
                  const cust = customers.find(c => c.id === inv.entityId || c.nameAr === inv.entityName);
                  return (
                    <tr key={inv.id} className="hover:bg-slate-50/80 transition">
                      <td className="p-3 font-mono font-bold text-blue-600">{inv.invoiceNumber}</td>
                      <td className="p-3 font-semibold text-slate-800">{inv.entityName}</td>
                      <td className="p-3 text-slate-500">{inv.date}</td>
                      <td className="p-3 text-slate-500 font-mono">{inv.dueDate}</td>
                      <td className="p-3 text-left font-mono font-bold text-slate-800">
                        {formatCurrency(inv.grandTotal, currency)}
                      </td>
                      <td className="p-3 text-left font-mono font-bold text-amber-600">
                        {formatCurrency(inv.remainingAmount, currency)}
                      </td>
                      <td className="p-3 text-center">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                          inv.status === 'PAID'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : inv.status === 'PARTIAL'
                            ? 'bg-amber-50 text-amber-700 border border-amber-200'
                            : 'bg-rose-50 text-rose-700 border border-rose-200'
                        }`}>
                          {inv.status === 'PAID' ? 'مدفوعة بالكامل' : inv.status === 'PARTIAL' ? 'سداد جزئي' : 'غير مسددة'}
                        </span>
                      </td>
                      <td className="p-3 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          {/* Send WhatsApp Reminder */}
                          <button
                            onClick={() => {
                              setShareModalDoc({
                                type: 'INVOICE',
                                documentNumber: inv.invoiceNumber,
                                date: inv.date,
                                dueDate: inv.dueDate,
                                recipientName: inv.entityName,
                                recipientPhone: cust?.phone || '771234567',
                                amount: inv.grandTotal,
                                currentBalance: inv.remainingAmount,
                                currency: inv.currency,
                                notes: inv.notes,
                                items: inv.items?.map(it => ({
                                  name: it.description,
                                  quantity: it.quantity,
                                  unitPrice: it.unitPrice,
                                  total: it.total
                                }))
                              });
                            }}
                            className="p-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-lg transition"
                            title="إرسال تذكير استحقاق الفاتورة عبر واتساب / SMS"
                          >
                            <MessageCircle className="w-4 h-4" />
                          </button>

                          {/* Print Invoice */}
                          <button
                            onClick={() => setSelectedInvoiceForPrint(inv)}
                            className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition"
                            title="طباعة ومعاينة الفاتورة الضريبية"
                          >
                            <Printer className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                }))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB: WHATSAPP REMINDER SCHEDULER */}
      {activeTab === 'whatsapp-scheduler' && (
        <WhatsAppReminderScheduler
          invoices={invoices}
          customers={customers}
          companyProfile={companyProfile}
          currency={currency}
          rates={rates}
          onAddReceiptVoucher={onAddReceiptVoucher}
        />
      )}

      {/* TAB 3: AGING ANALYSIS */}
      {activeTab === 'aging' && (
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
              <Clock className="w-5 h-5 text-amber-500" />
              <span>تقرير أعمار الديون المدينة (Accounts Receivable Aging Report)</span>
            </h3>
            <button
              onClick={() => {
                const headers = ['العميل', '0 - 30 يوم', '31 - 60 يوم', '61 - 90 يوم', '+90 يوم', 'إجمالي المستحق'];
                const rows = customers.map(c => [
                  c.nameAr,
                  c.currentBalance * 0.5,
                  c.currentBalance * 0.3,
                  c.currentBalance * 0.15,
                  c.currentBalance * 0.05,
                  c.currentBalance
                ]);
                exportToCsv('تقرير_أعمار_الديون_المدينة', headers, rows);
              }}
              className="px-3 py-1.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-lg text-xs font-semibold"
            >
              تصدير التقرير
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs">
              <thead className="bg-slate-50 text-slate-700 border-b border-slate-200 font-semibold">
                <tr>
                  <th className="p-3">العميل</th>
                  <th className="p-3 text-left">0 - 30 يوم (حالي)</th>
                  <th className="p-3 text-left">31 - 60 يوم</th>
                  <th className="p-3 text-left">61 - 90 يوم</th>
                  <th className="p-3 text-left">+90 يوم (متعثر)</th>
                  <th className="p-3 text-left">إجمالي المديونية</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {customers.slice(0, 50).map((c) => {
                  const b30 = c.currentBalance * 0.5;
                  const b60 = c.currentBalance * 0.3;
                  const b90 = c.currentBalance * 0.15;
                  const bOver = c.currentBalance * 0.05;
                  return (
                    <tr key={c.id} className="hover:bg-slate-50/70">
                      <td className="p-3 font-semibold text-slate-800">{c.nameAr}</td>
                      <td className="p-3 text-left font-mono text-emerald-600">{formatCurrency(b30, 'YER')}</td>
                      <td className="p-3 text-left font-mono text-blue-600">{formatCurrency(b60, 'YER')}</td>
                      <td className="p-3 text-left font-mono text-amber-600">{formatCurrency(b90, 'YER')}</td>
                      <td className="p-3 text-left font-mono text-rose-600 font-bold">{formatCurrency(bOver, 'YER')}</td>
                      <td className="p-3 text-left font-mono font-bold text-slate-900">{formatCurrency(c.currentBalance, 'YER')}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 4: NEW INVOICE FORM WITH RAPID ROUTINE ITEM ENTRY */}
      {activeTab === 'new-invoice' && (
        <form onSubmit={handleCreateInvoice} className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-5">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-200 pb-3">
            <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
              <Plus className="w-5 h-5 text-emerald-600" />
              <span>إنشاء وإصدار فاتورة مبيعات ضريبية رسمية للعميل (Tax Sales Invoice)</span>
            </h3>
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-semibold bg-blue-50 text-blue-700 px-2.5 py-1 rounded-lg border border-blue-200">
                تسجيل آلي للبنود وإضافة روتينية سريعة ⚡
              </span>
            </div>
          </div>

          {/* Invoice Header Details */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">العميل المستلم</label>
              <select
                value={selectedCustomerId}
                onChange={(e) => setSelectedCustomerId(e.target.value)}
                className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-800 font-semibold focus:ring-2 focus:ring-blue-500 focus:outline-none"
              >
                {customers.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.nameAr} - (الرصيد: {formatCurrency(c.currentBalance, 'YER')})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">تاريخ الفاتورة</label>
              <input
                type="date"
                value={invoiceDate}
                onChange={(e) => setInvoiceDate(e.target.value)}
                className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-800 focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">تاريخ الاستحقاق</label>
              <input
                type="date"
                value={invoiceDueDate}
                onChange={(e) => setInvoiceDueDate(e.target.value)}
                className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-800 focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>
          </div>

          {/* ========================================================= */}
          {/* RAPID ROUTINE ITEM ENTRY BOX (خانة إضافة الصنف الروتينية) */}
          {/* ========================================================= */}
          <div className="bg-gradient-to-r from-blue-50/90 via-indigo-50/50 to-slate-50 border-2 border-blue-200 rounded-2xl p-4 shadow-sm space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-blue-100/80 pb-2.5">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-blue-600 text-white flex items-center justify-center shadow-xs">
                  <Zap className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                    <span>محرك البحث الفوري والمفهرس للأصناف (Indexed Item Engine)</span>
                    <span className="bg-emerald-100 text-emerald-800 text-[10px] px-2 py-0.5 rounded-full font-mono font-bold border border-emerald-200 flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse"></span>
                      <span>B-Tree & Inverted ({allInventoryCatalog.length} صنف)</span>
                    </span>
                  </h4>
                  <p className="text-[11px] text-slate-500 flex items-center gap-2">
                    <span>استجابة فائقة السرعة ({nameSearchStats.latencyMs}ms) • بدون تجميد واجهة • حد أقصى 15 نتيجة</span>
                    {nameSearchStats.cacheHit && (
                      <span className="text-[10px] font-bold text-blue-600 bg-blue-100/80 px-1.5 py-0.2 rounded font-mono">
                        ⚡ LRU Cache Hit (&lt;0.1ms)
                      </span>
                    )}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsCatalogModalOpen(true)}
                  className="px-3 py-1.5 bg-white hover:bg-blue-50 border border-blue-200 hover:border-blue-300 text-blue-700 text-xs font-bold rounded-xl transition flex items-center gap-1.5 shadow-2xs"
                >
                  <Package className="w-3.5 h-3.5 text-blue-600" />
                  <span>تصفح دليل الأصناف الكامل</span>
                </button>
              </div>
            </div>

            {/* Routine Input Controls Row */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-2.5 items-end">
              {/* 1. Item Code / Barcode Lookup */}
              <div className="md:col-span-3 relative">
                <label className="block text-[11px] font-bold text-slate-700 mb-1 flex items-center justify-between">
                  <span className="flex items-center gap-1">
                    <Barcode className="w-3.5 h-3.5 text-blue-600" />
                    <span>كود الصنف / الباركود</span>
                  </span>
                  <span className="text-[9px] text-blue-600 font-mono">Code / Barcode</span>
                </label>
                <div className="relative">
                  <input
                    ref={routineCodeInputRef}
                    type="text"
                    value={itemSearchCodeQuery}
                    onChange={(e) => {
                      const val = e.target.value;
                      setItemSearchCodeQuery(val);
                      setItemDraftItemCode(val);
                      setIsCodeDropdownOpen(true);
                      setIsNameDropdownOpen(false);
                      // Instant exact match check
                      const exact = allInventoryCatalog.find(
                        i => i.code.toLowerCase() === val.trim().toLowerCase() || (i.barcode && i.barcode === val.trim())
                      );
                      if (exact) {
                        handleSelectInventoryItem(exact);
                      }
                    }}
                    onFocus={() => {
                      setIsCodeDropdownOpen(true);
                      setIsNameDropdownOpen(false);
                    }}
                    onKeyDown={(e) => {
                      e.stopPropagation();
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        if (matchingCodeInventoryItems.length > 0 && !selectedInventoryItem) {
                          handleSelectInventoryItem(matchingCodeInventoryItems[0]);
                        } else {
                          handleRoutineAddItem();
                        }
                      } else if (e.key === 'Escape') {
                        setIsCodeDropdownOpen(false);
                      }
                    }}
                    placeholder="كود الصنف أو الباركود (مثل: ITM-CEM-01 أو 628...)"
                    className="w-full bg-white border-2 border-blue-300 focus:border-blue-600 rounded-xl pr-8 pl-2 py-2 text-xs font-mono font-bold text-slate-900 focus:ring-2 focus:ring-blue-200 focus:outline-none"
                  />
                  <Barcode className="w-4 h-4 text-blue-500 absolute right-2.5 top-2.5" />
                  {itemSearchCodeQuery && (
                    <button
                      type="button"
                      onClick={() => {
                        setItemSearchCodeQuery('');
                        setItemDraftItemCode('');
                      }}
                      className="absolute left-2 top-2.5 text-slate-400 hover:text-slate-600"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                {/* Code Dropdown */}
                {isCodeDropdownOpen && itemSearchCodeQuery.trim() !== '' && (
                  <div 
                    className="absolute z-40 top-full mt-1 right-0 w-80 bg-white border-2 border-blue-200 rounded-2xl shadow-2xl max-h-60 overflow-y-auto divide-y divide-slate-100 animate-in fade-in zoom-in-95"
                    onMouseDown={(e) => e.preventDefault()}
                  >
                    {matchingCodeInventoryItems.length > 0 ? (
                      <>
                        <div className="p-2 bg-blue-50 text-[10px] font-bold text-blue-800 flex justify-between px-3 sticky top-0 border-b border-blue-100 z-10">
                          <span>مطابقة الكود والباركود ({matchingCodeInventoryItems.length})</span>
                          <span>اختر للربط</span>
                        </div>
                        {matchingCodeInventoryItems.map((itm) => (
                          <div
                            key={itm.id}
                            onClick={() => handleSelectInventoryItem(itm)}
                            className="p-2.5 hover:bg-blue-50 cursor-pointer flex items-center justify-between text-xs transition"
                          >
                            <div>
                              <div className="font-bold text-slate-900 flex items-center gap-1.5">
                                <span className="font-mono text-blue-700 bg-blue-100/70 px-1.5 py-0.5 rounded text-[10px] font-bold">{itm.code}</span>
                                <span>{itm.nameAr}</span>
                              </div>
                              <div className="text-[10px] text-slate-500 mt-0.5 flex items-center gap-2">
                                <span>الوحدة: {itm.unit || 'حبه'}</span>
                                <span>•</span>
                                <span className="text-emerald-700 font-bold">المتوفر: {itm.quantity}</span>
                              </div>
                            </div>
                            <span className="font-mono font-bold text-blue-700 text-xs">
                              {formatCurrency(itm.salePrice, 'YER')}
                            </span>
                          </div>
                        ))}
                      </>
                    ) : (
                      <div className="p-3 text-center text-xs text-slate-500">
                        لا توجد أصناف مطابقة للكود أو الباركود "{itemSearchCodeQuery}"
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* 2. Item Name Lookup */}
              <div className="md:col-span-4 relative">
                <label className="block text-[11px] font-bold text-slate-700 mb-1 flex items-center justify-between">
                  <span className="flex items-center gap-1">
                    <Search className="w-3.5 h-3.5 text-blue-600" />
                    <span>اسم وبيان الصنف *</span>
                  </span>
                  <span className="text-[9px] text-emerald-600 font-semibold">بحث فوري بالاسم</span>
                </label>
                <div className="relative">
                  <input
                    ref={routineNameInputRef}
                    type="text"
                    value={itemSearchNameQuery}
                    onChange={(e) => {
                      const val = e.target.value;
                      setItemSearchNameQuery(val);
                      setItemDraftDescription(val);
                      setIsNameDropdownOpen(true);
                      setIsCodeDropdownOpen(false);
                    }}
                    onFocus={() => {
                      setIsNameDropdownOpen(true);
                      setIsCodeDropdownOpen(false);
                    }}
                    onKeyDown={(e) => {
                      e.stopPropagation();
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        if (matchingNameInventoryItems.length > 0 && !selectedInventoryItem) {
                          handleSelectInventoryItem(matchingNameInventoryItems[0]);
                        } else {
                          handleRoutineAddItem();
                        }
                      } else if (e.key === 'Escape') {
                        setIsNameDropdownOpen(false);
                      }
                    }}
                    placeholder="ابحث باسم الصنف (مثل: أسمنت، كابل، شاشة، سيرفر)..."
                    className="w-full bg-white border-2 border-blue-300 focus:border-blue-600 rounded-xl pr-8 pl-2 py-2 text-xs font-semibold text-slate-900 focus:ring-2 focus:ring-blue-200 focus:outline-none"
                  />
                  <Search className="w-4 h-4 text-blue-500 absolute right-2.5 top-2.5" />
                  {itemSearchNameQuery && (
                    <button
                      type="button"
                      onClick={() => {
                        setItemSearchNameQuery('');
                        setItemDraftDescription('');
                        setSelectedInventoryItem(null);
                      }}
                      className="absolute left-2 top-2.5 text-slate-400 hover:text-slate-600"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                {/* Instant Name Dropdown */}
                {isNameDropdownOpen && itemSearchNameQuery.trim() !== '' && (
                  <div 
                    className="absolute z-40 top-full mt-1 right-0 left-0 bg-white border-2 border-blue-200 rounded-2xl shadow-2xl max-h-64 overflow-y-auto divide-y divide-slate-100 animate-in fade-in zoom-in-95"
                    onMouseDown={(e) => e.preventDefault()}
                  >
                    {matchingNameInventoryItems.length > 0 ? (
                      <>
                        <div className="p-2 bg-gradient-to-r from-blue-50 to-slate-50 text-[10px] font-bold text-slate-600 flex justify-between px-3 sticky top-0 border-b border-slate-100 z-10">
                          <span className="flex items-center gap-1 text-blue-800">
                            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                            <span>نتائج البحث الفوري ({matchingNameInventoryItems.length})</span>
                          </span>
                          <span className="text-[10px] text-emerald-700">اضغط للاختيار والربط ⚡</span>
                        </div>
                        {matchingNameInventoryItems.map((itm) => (
                          <div
                            key={itm.id}
                            onClick={() => handleSelectInventoryItem(itm)}
                            className="p-2.5 hover:bg-blue-50/90 cursor-pointer flex items-center justify-between text-xs transition group"
                          >
                            <div className="flex items-center gap-2 flex-1">
                              <div className="w-7 h-7 rounded-lg bg-blue-100/70 group-hover:bg-blue-200 flex items-center justify-center text-blue-700 shrink-0 transition">
                                <Package className="w-3.5 h-3.5" />
                              </div>
                              <div>
                                <div className="font-bold text-slate-900 group-hover:text-blue-900 text-xs">
                                  {itm.nameAr}
                                </div>
                                <div className="text-[10px] font-mono text-slate-500 flex items-center gap-2 mt-0.5">
                                  <span className="bg-slate-100 text-slate-600 px-1 py-0.2 rounded font-sans">{itm.category || 'عام'}</span>
                                  <span>كود: {itm.code}</span>
                                  <span>•</span>
                                  <span>الوحدة: {itm.unit || 'حبه'}</span>
                                  <span>•</span>
                                  <span className="text-emerald-700 font-bold">المتوفر: {itm.quantity}</span>
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center gap-2 shrink-0">
                              <div className="font-mono font-bold text-blue-700 text-xs text-left">
                                {formatCurrency(itm.salePrice, 'YER')}
                              </div>
                            </div>
                          </div>
                        ))}
                      </>
                    ) : (
                      <div className="p-4 text-center text-xs text-slate-500">
                        لا توجد أصناف مطابقة للبحث عن "{itemSearchNameQuery}" في المستودع
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* 3. Quantity */}
              <div className="md:col-span-2">
                <label className="block text-[11px] font-bold text-slate-700 mb-1">الكمية</label>
                <div className="flex items-center">
                  <button
                    type="button"
                    onClick={() => setItemDraftQuantity(prev => Math.max(1, (Number(prev) || 1) - 1))}
                    className="px-2 py-2 bg-white border-2 border-r-2 border-l-0 border-slate-300 rounded-r-xl text-slate-600 hover:bg-slate-100 text-xs font-bold"
                  >
                    -
                  </button>
                  <input
                    type="number"
                    min="1"
                    value={itemDraftQuantity}
                    onChange={(e) => setItemDraftQuantity(Math.max(1, parseFloat(e.target.value) || 1))}
                    onKeyDown={(e) => {
                      e.stopPropagation();
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleRoutineAddItem();
                      }
                    }}
                    className="w-full bg-white border-y-2 border-slate-300 text-center py-2 text-xs font-mono font-bold text-slate-900 focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setItemDraftQuantity(prev => (Number(prev) || 1) + 1)}
                    className="px-2 py-2 bg-white border-2 border-l-2 border-r-0 border-slate-300 rounded-l-xl text-slate-600 hover:bg-slate-100 text-xs font-bold"
                  >
                    +
                  </button>
                </div>
              </div>

              {/* 4. Unit Price (Editable without breaking binding) */}
              <div className="md:col-span-2">
                <label className="block text-[11px] font-bold text-slate-700 mb-1">سعر الوحدة (ر.ي)</label>
                <input
                  type="number"
                  min="0"
                  value={itemDraftUnitPrice || ''}
                  onChange={(e) => setItemDraftUnitPrice(Math.max(0, parseFloat(e.target.value) || 0))}
                  onKeyDown={(e) => {
                    e.stopPropagation();
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleRoutineAddItem();
                    }
                  }}
                  placeholder="0"
                  className="w-full bg-white border-2 border-slate-300 focus:border-blue-500 rounded-xl px-2.5 py-2 text-xs font-mono font-bold text-left text-slate-900 focus:ring-2 focus:ring-blue-200 focus:outline-none"
                />
              </div>

              {/* 5. Add to Invoice Button */}
              <div className="md:col-span-1">
                <button
                  type="button"
                  onClick={handleRoutineAddItem}
                  className="w-full py-2 px-2 bg-blue-600 hover:bg-blue-700 active:scale-98 text-white rounded-xl text-xs font-bold shadow-sm transition flex items-center justify-center gap-1"
                  title="إضافة البند للفاتورة"
                >
                  <Plus className="w-4 h-4" />
                  <span>إضافة</span>
                </button>
              </div>
            </div>

            {/* Active Selected Item Binding Status Card */}
            {selectedInventoryItem && (
              <div className="p-2.5 bg-emerald-50/90 border border-emerald-200 rounded-xl flex flex-wrap items-center justify-between gap-2 text-xs">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                  <span className="font-bold text-emerald-900">تم ربط الصنف بنجاح:</span>
                  <span className="font-semibold text-slate-800">{selectedInventoryItem.nameAr}</span>
                  <span className="font-mono bg-white px-2 py-0.5 rounded border border-emerald-200 text-emerald-800 text-[11px] font-bold">
                    كود: {selectedInventoryItem.code}
                  </span>
                </div>
                <div className="flex items-center gap-3 text-[11px] text-emerald-800">
                  <span>الوحدة: <strong>{selectedInventoryItem.unit || 'حبه'}</strong></span>
                  <span>•</span>
                  <span>المخزون المتاح: <strong className="font-mono">{selectedInventoryItem.quantity}</strong></span>
                  <span>•</span>
                  <span>الحساب الدائن: <strong>4111 - إيرادات المبيعات</strong></span>
                </div>
              </div>
            )}

            {/* Quick 1-Click Common Items Bar */}
            {allInventoryCatalog.length > 0 && (
              <div className="pt-2 border-t border-blue-100 flex items-center gap-2 overflow-x-auto text-xs scrollbar-none">
                <span className="text-[11px] font-bold text-slate-500 whitespace-nowrap flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                  أصناف شائعة للإضافة السريعة:
                </span>
                {allInventoryCatalog.slice(0, 8).map((itm) => (
                  <button
                    key={itm.id}
                    type="button"
                    onClick={() => handleInstantAddItem(itm, 1)}
                    className="bg-white hover:bg-blue-100 border border-slate-200 hover:border-blue-300 px-2.5 py-1 rounded-lg text-[11px] font-semibold text-slate-700 whitespace-nowrap transition flex items-center gap-1.5 shadow-2xs"
                  >
                    <span>+ {itm.nameAr}</span>
                    <span className="font-mono text-blue-600 font-bold">({formatCurrency(itm.salePrice, 'YER')})</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* ========================================================= */}
          {/* INVOICE ITEMS TABLE WITH FULL DATA BINDING */}
          {/* ========================================================= */}
          <div className="border border-slate-200 rounded-xl overflow-hidden bg-white shadow-xs">
            <div className="p-3 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-2">
              <h4 className="text-xs font-bold text-slate-800 flex items-center gap-2">
                <Layers className="w-4 h-4 text-blue-600" />
                <span>جدول بنود الفاتورة الحالية ({invoiceItems.length} بنود)</span>
              </h4>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsCatalogModalOpen(true)}
                  className="px-2.5 py-1 bg-blue-50 hover:bg-blue-100 border border-blue-200 text-blue-700 rounded-lg text-xs font-bold transition flex items-center gap-1 shadow-2xs"
                >
                  <Package className="w-3.5 h-3.5 text-blue-600" />
                  <span>دليل الأصناف</span>
                </button>
                <button
                  type="button"
                  onClick={handleAddItem}
                  className="px-2.5 py-1 bg-white hover:bg-slate-100 border border-slate-200 text-blue-600 rounded-lg text-xs font-bold transition flex items-center gap-1"
                >
                  <Plus className="w-3 h-3" />
                  سطر يدوي جديد
                </button>
                {invoiceItems.length > 0 && (
                  <button
                    type="button"
                    onClick={handleClearAllItems}
                    className="px-2.5 py-1 bg-white hover:bg-rose-50 border border-rose-200 text-rose-600 rounded-lg text-xs font-bold transition flex items-center gap-1"
                  >
                    <Trash2 className="w-3 h-3" />
                    تفريغ الجدول
                  </button>
                )}
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-right text-xs">
                <thead className="bg-slate-100/70 text-slate-700 border-b border-slate-200 font-bold">
                  <tr>
                    <th className="p-2.5 w-10 text-center">#</th>
                    <th className="p-2.5 w-28">رمز الصنف</th>
                    <th className="p-2.5 min-w-[240px]">بيان واسم الصنف (بحث فوري)</th>
                    <th className="p-2.5 w-24">الوحدة</th>
                    <th className="p-2.5 w-32">الحساب المحاسبي</th>
                    <th className="p-2.5 w-20 text-center">المخزون</th>
                    <th className="p-2.5 w-20 text-center">الكمية</th>
                    <th className="p-2.5 w-28 text-left">سعر الوحدة</th>
                    <th className="p-2.5 w-24">الضريبة</th>
                    <th className="p-2.5 w-28 text-left">المجموع</th>
                    <th className="p-2.5 w-16 text-center">إجراءات</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {invoiceItems.length === 0 ? (
                    <tr>
                      <td colSpan={10} className="p-8 text-center bg-slate-50/50">
                        <div className="flex flex-col items-center justify-center gap-2 max-w-md mx-auto text-slate-400">
                          <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center">
                            <Package className="w-5 h-5" />
                          </div>
                          <p className="text-xs font-bold text-slate-700">لا توجد أصناف مضافة في الفاتورة حتى الآن</p>
                          <p className="text-[11px] text-slate-500 leading-relaxed">
                            استخدم شريط البحث السريع بالأعلى للبحث عن أي صنف بالاسم أو الكود (مثل: "أسمنت" أو "شاشة" أو "كابل") ثم اضغط على زر "إضافة" لإدراجه مباشرة في الفاتورة.
                          </p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    invoiceItems.map((item, idx) => {
                    return (
                      <tr key={item.id} className="hover:bg-slate-50/70 transition">
                        <td className="p-2.5 text-center text-slate-400 font-mono font-bold">
                          {idx + 1}
                        </td>

                        {/* Item Code (with in-row autocomplete) */}
                        <td className="p-2 relative">
                          <input
                            type="text"
                            value={item.itemCode || ''}
                            onChange={(e) => {
                              handleItemChange(idx, 'itemCode', e.target.value);
                              setActiveTableCodeSearchRowIndex(idx);
                              setActiveTableSearchRowIndex(null);
                            }}
                            onFocus={() => {
                              setActiveTableCodeSearchRowIndex(idx);
                              setActiveTableSearchRowIndex(null);
                            }}
                            placeholder="الكود"
                            className="w-full bg-white border border-slate-300 focus:border-blue-500 rounded-lg px-2 py-1.5 text-xs font-mono font-bold text-blue-900 focus:ring-1 focus:ring-blue-500 focus:outline-none"
                          />

                          {/* Row Code Suggestions Dropdown */}
                          {activeTableCodeSearchRowIndex === idx && activeRowCodeMatchingItems.length > 0 && (
                            <div 
                              className="absolute z-50 top-full mt-1 right-0 w-64 bg-white border-2 border-blue-200 rounded-xl shadow-2xl max-h-48 overflow-y-auto divide-y divide-slate-100"
                              onMouseDown={(e) => e.preventDefault()}
                            >
                              <div className="p-1.5 bg-blue-50 text-[10px] font-bold text-blue-800 flex justify-between px-2">
                                <span>مطابقة الكود (مفهرس)</span>
                                <span>السعر</span>
                              </div>
                              {activeRowCodeMatchingItems.map((itm) => (
                                <div
                                  key={itm.id}
                                  onClick={() => handleSelectRowItem(idx, itm)}
                                  className="p-2 hover:bg-blue-50 cursor-pointer flex items-center justify-between text-xs transition"
                                >
                                  <div>
                                    <span className="font-mono font-bold text-blue-700 text-xs">{itm.code}</span>
                                    <div className="text-[10px] text-slate-600 font-medium">{itm.nameAr}</div>
                                  </div>
                                  <span className="font-mono font-bold text-emerald-700 text-xs">
                                    {formatCurrency(itm.salePrice, 'YER')}
                                  </span>
                                </div>
                              ))}
                            </div>
                          )}
                        </td>

                        {/* Description / Item Name (with in-row autocomplete) */}
                        <td className="p-2 relative">
                          <div className="relative">
                            <input
                              type="text"
                              value={item.description}
                              onChange={(e) => {
                                handleItemChange(idx, 'description', e.target.value);
                                setActiveTableSearchRowIndex(idx);
                                setActiveTableCodeSearchRowIndex(null);
                              }}
                              onFocus={() => {
                                setActiveTableSearchRowIndex(idx);
                                setActiveTableCodeSearchRowIndex(null);
                              }}
                              placeholder="اكتب اسم الصنف للبحث والاختيار المباشر..."
                              required
                              onKeyDown={(e) => {
                                e.stopPropagation();
                                if (e.key === 'Escape') {
                                  setActiveTableSearchRowIndex(null);
                                }
                              }}
                              className="w-full bg-white border border-slate-300 focus:border-blue-500 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 font-medium focus:ring-2 focus:ring-blue-500 focus:outline-none"
                            />

                            {/* Row Name Autocomplete Suggestions Dropdown */}
                            {activeTableSearchRowIndex === idx && activeRowNameMatchingItems.length > 0 && (
                              <div 
                                className="absolute z-50 top-full mt-1 right-0 left-0 bg-white border-2 border-blue-200 rounded-xl shadow-2xl max-h-48 overflow-y-auto divide-y divide-slate-100"
                                onMouseDown={(e) => e.preventDefault()}
                              >
                                <div className="p-1.5 bg-blue-50 text-[10px] font-bold text-blue-800 flex justify-between px-2">
                                  <span>أصناف مطابقة مفهرسة - اضغط للربط</span>
                                  <span>السعر</span>
                                </div>
                                {activeRowNameMatchingItems.map((itm) => (
                                  <div
                                    key={itm.id}
                                    onClick={() => handleSelectRowItem(idx, itm)}
                                    className="p-2 hover:bg-blue-50 cursor-pointer flex items-center justify-between text-xs transition"
                                  >
                                    <div className="flex items-center gap-1.5">
                                      <Package className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                                      <span className="font-bold text-slate-800">{itm.nameAr}</span>
                                      <span className="text-[10px] text-slate-400 font-mono">({itm.quantity} {itm.unit || 'حبه'})</span>
                                    </div>
                                    <span className="font-mono font-bold text-blue-700 text-xs">
                                      {formatCurrency(itm.salePrice, 'YER')}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        </td>

                        {/* Unit */}
                        <td className="p-2">
                          <input
                            type="text"
                            value={item.unit || 'حبه'}
                            onChange={(e) => handleItemChange(idx, 'unit', e.target.value)}
                            className="w-full bg-white border border-slate-200 rounded-lg px-2 py-1.5 text-xs text-slate-800 text-center font-medium focus:ring-1 focus:ring-blue-500 focus:outline-none"
                          />
                        </td>

                        {/* Accounting Account */}
                        <td className="p-2">
                          <span className="inline-block w-full bg-slate-100 border border-slate-200 rounded-lg px-2 py-1.5 text-[10px] font-mono text-slate-700 text-center whitespace-nowrap">
                            4111 - المبيعات
                          </span>
                        </td>

                        {/* Current Stock */}
                        <td className="p-2 text-center font-mono font-bold text-slate-600 text-xs">
                          {item.currentStock !== undefined ? item.currentStock : '-'}
                        </td>

                        {/* Quantity */}
                        <td className="p-2">
                          <input
                            type="number"
                            min="1"
                            value={item.quantity}
                            onChange={(e) => handleItemChange(idx, 'quantity', parseFloat(e.target.value) || 1)}
                            onKeyDown={(e) => e.stopPropagation()}
                            className="w-full bg-white border border-slate-200 rounded-lg px-2 py-1.5 text-xs text-slate-800 text-center font-mono font-bold focus:ring-2 focus:ring-blue-500 focus:outline-none"
                          />
                        </td>

                        {/* Unit Price (Editable without breaking item binding) */}
                        <td className="p-2">
                          <input
                            type="number"
                            min="0"
                            value={item.unitPrice}
                            onChange={(e) => handleItemChange(idx, 'unitPrice', parseFloat(e.target.value) || 0)}
                            onKeyDown={(e) => e.stopPropagation()}
                            className="w-full bg-white border border-slate-200 rounded-lg px-2 py-1.5 text-xs text-slate-800 text-left font-mono font-bold focus:ring-2 focus:ring-blue-500 focus:outline-none"
                          />
                        </td>

                        {/* Tax Rate */}
                        <td className="p-2">
                          <select
                            value={item.taxRate}
                            onChange={(e) => handleItemChange(idx, 'taxRate', parseFloat(e.target.value) || 0)}
                            className="w-full bg-white border border-slate-200 rounded-lg px-1.5 py-1.5 text-xs text-slate-800 font-medium focus:ring-2 focus:ring-blue-500 focus:outline-none"
                          >
                            <option value={0.05}>5% مبيعات</option>
                            <option value={0}>0% معفاة</option>
                            <option value={0.15}>15% عام</option>
                          </select>
                        </td>

                        {/* Total */}
                        <td className="p-2 text-left font-mono font-bold text-emerald-700">
                          {formatCurrency(item.total, 'YER')}
                        </td>

                        {/* Actions */}
                        <td className="p-2 text-center">
                          <div className="flex items-center justify-center gap-1">
                            <button
                              type="button"
                              onClick={() => handleDuplicateItem(idx)}
                              title="تكرار البند"
                              className="p-1 text-slate-400 hover:text-blue-600 rounded transition"
                            >
                              <Copy className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleRemoveItem(idx)}
                              title="حذف البند"
                              className="p-1 text-slate-400 hover:text-rose-600 rounded transition"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Notes & Attachments */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">شروط وملاحظات الفاتورة</label>
              <textarea
                rows={2}
                value={invoiceNotes}
                onChange={(e) => setInvoiceNotes(e.target.value)}
                onKeyDown={(e) => e.stopPropagation()}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-800 focus:ring-2 focus:ring-blue-500 focus:bg-white focus:outline-none"
              />
            </div>
            <div className="flex flex-col justify-end">
              <DocumentArchiver
                attachments={invoiceAttachments}
                onAddAttachment={(url) => setInvoiceAttachments(prev => [...prev, url])}
                onRemoveAttachment={(url) => setInvoiceAttachments(prev => prev.filter(u => u !== url))}
              />
            </div>
          </div>

          {/* Totals & Submit */}
          <div className="flex flex-col sm:flex-row items-end justify-between gap-4 pt-4 border-t border-slate-200 bg-slate-50/50 p-4 rounded-xl">
            <div className="w-full sm:w-80 space-y-1.5 text-xs">
              <div className="flex justify-between text-slate-600">
                <span>المجموع قبل الضريبة:</span>
                <span className="font-mono font-bold">{formatCurrency(invoiceSubtotal, 'YER')}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>ضريبة المبيعات المحسوبة:</span>
                <span className="font-mono font-bold text-amber-700">{formatCurrency(invoiceTaxTotal, 'YER')}</span>
              </div>
              <div className="flex justify-between text-base font-bold text-slate-900 pt-2 border-t border-slate-200">
                <span>المجموع الإجمالي النهائي:</span>
                <span className="font-mono text-emerald-700">{formatCurrency(invoiceGrandTotal, 'YER')}</span>
              </div>
            </div>

            <div className="flex items-center gap-3 w-full sm:w-auto">
              <button
                type="button"
                onClick={() => setActiveTab('invoices')}
                className="px-4 py-2.5 bg-white border border-slate-300 text-slate-700 text-xs font-bold rounded-xl hover:bg-slate-100 transition"
              >
                إلغاء
              </button>
              <button
                type="submit"
                className="flex-1 sm:flex-none px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-md transition flex items-center justify-center gap-2"
              >
                <Check className="w-4 h-4" />
                <span>حفظ وترحيل الفاتورة الضريبية</span>
              </button>
            </div>
          </div>
        </form>
      )}

      {/* TAB 5: NEW RECEIPT VOUCHER */}
      {activeTab === 'new-receipt' && (
        <form onSubmit={handleCreateReceipt} className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-4 max-w-xl mx-auto">
          <h3 className="text-base font-bold text-slate-800 border-b border-slate-200 pb-3 flex items-center gap-2">
            <Receipt className="w-4 h-4 text-teal-600" />
            <span>إصدار سند قبض وتحصيل نقدي / بنكي (Receipt Voucher)</span>
          </h3>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">العميل المقبوض منه</label>
            <select
              value={receiptCustomerId}
              onChange={(e) => setReceiptCustomerId(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:ring-2 focus:ring-blue-500 focus:bg-white focus:outline-none"
            >
              {customers.map((c) => (
                <option key={c.id} value={c.id}>{c.nameAr} - الرصيد الحالي: {formatCurrency(c.currentBalance, 'YER')}</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">المبلغ المحصل (بالريال YER)</label>
              <input
                type="number"
                required
                min="1"
                value={receiptAmount === 0 ? '' : receiptAmount}
                onChange={(e) => setReceiptAmount(parseFloat(e.target.value) || 0)}
                placeholder="0.00"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-emerald-600 font-mono font-bold text-left focus:ring-2 focus:ring-blue-500 focus:bg-white focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">طريقة القبض</label>
              <select
                value={receiptMethod}
                onChange={(e) => setReceiptMethod(e.target.value as any)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:ring-2 focus:ring-blue-500 focus:bg-white focus:outline-none"
              >
                <option value="BANK_TRANSFER">تحويل بنكي (بنك التضامن)</option>
                <option value="CASH">نقداً (الصندوق الرئيسي)</option>
                <option value="CHEQUE">شيك بنكي مسحوب</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">رقم الإشعار / الشيك</label>
            <input
              type="text"
              value={receiptRef}
              onChange={(e) => setReceiptRef(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 font-mono focus:ring-2 focus:ring-blue-500 focus:bg-white focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">وذلك عن (البيان)</label>
            <input
              type="text"
              value={receiptNotes}
              onChange={(e) => setReceiptNotes(e.target.value)}
              placeholder="دفعة من حساب الفاتورة..."
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:ring-2 focus:ring-blue-500 focus:bg-white focus:outline-none"
            />
          </div>

          <DocumentArchiver
            attachments={receiptAttachments}
            onAddAttachment={(url) => setReceiptAttachments(prev => [...prev, url])}
            onRemoveAttachment={(url) => setReceiptAttachments(prev => prev.filter(u => u !== url))}
          />

          <div className="pt-3 border-t border-slate-200 flex justify-end">
            <button
              type="submit"
              className="px-6 py-2.5 bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold rounded-xl shadow-xs"
            >
              ترحيل سند القبض
            </button>
          </div>
        </form>
      )}

      {/* CUSTOMER ACCOUNT STATEMENT MODAL */}
      {selectedCustomerForStatement && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-white border border-slate-300 rounded-2xl max-w-2xl w-full p-6 space-y-4 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-700 font-bold font-mono text-xs">
                  {selectedCustomerForStatement.code}
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">{selectedCustomerForStatement.nameAr}</h3>
                  <p className="text-xs text-slate-400">{selectedCustomerForStatement.city} • هاتف: {selectedCustomerForStatement.phone}</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedCustomerForStatement(null)}
                className="p-1 text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Financial Summary */}
            <div className="grid grid-cols-3 gap-3">
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                <span className="text-[11px] text-slate-500 block">إجمالي التعاملات</span>
                <span className="font-mono font-bold text-slate-900 text-sm">
                  {formatCurrency(selectedCustomerForStatement.totalOperations ?? ((selectedCustomerForStatement.totalCollected || 0) + selectedCustomerForStatement.currentBalance), currency)}
                </span>
              </div>

              <div className="p-3 bg-emerald-50/50 border border-emerald-200 rounded-xl">
                <span className="text-[11px] text-emerald-700 block">المبالغ المسددة</span>
                <span className="font-mono font-bold text-emerald-700 text-sm">
                  {formatCurrency(selectedCustomerForStatement.totalCollected ?? 0, currency)}
                </span>
              </div>

              <div className="p-3 bg-amber-50/50 border border-amber-200 rounded-xl">
                <span className="text-[11px] text-amber-700 block">الرصيد المتبقي المستحق</span>
                <span className="font-mono font-bold text-amber-700 text-sm">
                  {formatCurrency(selectedCustomerForStatement.currentBalance, currency)}
                </span>
              </div>
            </div>

            {/* Progress */}
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
              <div className="flex justify-between items-center text-xs">
                <span className="font-semibold text-slate-700">معدل التحصيل والسداد التراكمي:</span>
                <span className="font-mono font-bold text-blue-700">
                  {((selectedCustomerForStatement.collectionRate ?? 0)).toFixed(2)}%
                </span>
              </div>
              <div className="w-full bg-slate-200 h-2.5 rounded-full overflow-hidden">
                <div 
                  className="bg-blue-600 h-full rounded-full transition-all" 
                  style={{ width: `${Math.min(100, selectedCustomerForStatement.collectionRate ?? 0)}%` }}
                />
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200">
              <button
                onClick={() => {
                  setReceiptCustomerId(selectedCustomerForStatement.id);
                  setReceiptAmount(selectedCustomerForStatement.currentBalance > 0 ? selectedCustomerForStatement.currentBalance : 0);
                  setSelectedCustomerForStatement(null);
                  setActiveTab('new-receipt');
                }}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-xs flex items-center gap-1.5"
              >
                <Receipt className="w-3.5 h-3.5" />
                <span>إصدار سند تحصيل</span>
              </button>
              <button
                onClick={() => {
                  setSelectedCustomerId(selectedCustomerForStatement.id);
                  setSelectedCustomerForStatement(null);
                  setActiveTab('new-invoice');
                }}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-xs flex items-center gap-1.5"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>إصدار فاتورة مبيعات</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* IMPORT CSV MODAL */}
      {isImportModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-white border border-slate-300 rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div className="flex items-center gap-2">
                <FileSpreadsheet className="w-5 h-5 text-blue-600" />
                <h3 className="text-base font-bold text-slate-900">استيراد كشف حسابات العملاء من CSV</h3>
              </div>
              <button
                onClick={() => setIsImportModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs text-slate-600">
              <p>
                يمكنك لصق بيانات ملف CSV الخاصة بالعملاء أو رفع ملف مباشرة بالصيغة:
                <br />
                <code className="bg-slate-100 px-1.5 py-0.5 rounded text-[11px] font-mono text-blue-700 mt-1 inline-block">
                  م, اسم العميل, التحصيل, الرصيد, نسبة التحصيل %
                </code>
              </p>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">رفع ملف CSV من جهازك</label>
                <input
                  type="file"
                  accept=".csv,.txt"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      const reader = new FileReader();
                      reader.onload = (event) => {
                        const content = event.target?.result as string;
                        setImportCsvText(content);
                      };
                      reader.readAsText(file);
                    }
                  }}
                  className="w-full text-xs text-slate-500 file:mr-2 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">أو الصق نص CSV هنا</label>
                <textarea
                  rows={6}
                  value={importCsvText}
                  onChange={(e) => setImportCsvText(e.target.value)}
                  placeholder="م,اسم العميل,التحصيل,الرصيد,نسبة التحصيل %&#10;1,سليم قلمي,908600,1281828,0.4148"
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono text-[11px] text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-slate-200">
              <button
                type="button"
                onClick={() => {
                  setImportCsvText(RAW_CUSTOMERS_CSV);
                }}
                className="text-xs text-blue-600 hover:underline font-semibold"
              >
                تحميل نص الكشف الافتراضي
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsImportModalOpen(false)}
                  className="px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold"
                >
                  إلغاء
                </button>
                <button
                  type="button"
                  onClick={() => handleImportCustomersFromText(importCsvText)}
                  className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold shadow-xs"
                >
                  استيراد وتحديث الكشف
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ADD NEW CUSTOMER MODAL */}
      {isAddCustomerModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4 backdrop-blur-xs">
          <form onSubmit={handleManualAddCustomer} className="bg-white border border-slate-300 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-blue-600" />
                <h3 className="text-base font-bold text-slate-900">إضافة عميل جديد للدليل</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsAddCustomerModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-700 font-semibold mb-1">اسم العميل / المنشأة *</label>
                <input
                  type="text"
                  required
                  value={newCustName}
                  onChange={(e) => setNewCustName(e.target.value)}
                  placeholder="مثال: محلات النصر للتجارة"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">رقم الهاتف</label>
                  <input
                    type="text"
                    value={newCustPhone}
                    onChange={(e) => setNewCustPhone(e.target.value)}
                    placeholder="+967 77..."
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">المدينة / المحافظة</label>
                  <input
                    type="text"
                    value={newCustCity}
                    onChange={(e) => setNewCustCity(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">المبالغ المسددة (التحصيل)</label>
                  <input
                    type="number"
                    min="0"
                    value={newCustCollected === 0 ? '' : newCustCollected}
                    onChange={(e) => setNewCustCollected(parseFloat(e.target.value) || 0)}
                    placeholder="0"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-emerald-600 font-mono font-bold focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">الرصيد المتبقي المستحق</label>
                  <input
                    type="number"
                    min="0"
                    value={newCustBalance === 0 ? '' : newCustBalance}
                    onChange={(e) => setNewCustBalance(parseFloat(e.target.value) || 0)}
                    placeholder="0"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-amber-600 font-mono font-bold focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200">
              <button
                type="button"
                onClick={() => setIsAddCustomerModalOpen(false)}
                className="px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold"
              >
                إلغاء
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold shadow-xs"
              >
                إضافة وحفظ العميل
              </button>
            </div>
          </form>
        </div>
      )}

      {/* TAX INVOICE PRINT MODAL */}
      {selectedInvoiceForPrint && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-white border border-slate-300 rounded-2xl max-w-2xl w-full p-6 space-y-4 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3 no-print">
              <h3 className="text-base font-bold text-slate-800">معاينة الفاتورة الضريبية الرسمية</h3>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => window.print()}
                  className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold shadow-xs"
                >
                  طباعة الفاتورة
                </button>
                <button
                  onClick={() => setSelectedInvoiceForPrint(null)}
                  className="px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold"
                >
                  إغلاق
                </button>
              </div>
            </div>

            {/* Official Tax Invoice Sheet */}
            <div className="bg-white text-slate-900 p-6 rounded-xl border border-slate-300 space-y-4 font-sans text-xs">
              <div className="flex justify-between items-start border-b-2 border-slate-900 pb-3">
                <div className="space-y-1">
                  <CompanyHeaderView align="right" size="sm" />
                  <p className="text-[10px] text-slate-600">{companyProfile.nameEn}</p>
                  <p className="text-[10px] text-slate-600 mt-1">الرقم الضريبي: {companyProfile.taxNumber}</p>
                  <p className="text-[10px] text-slate-600">السجل التجاري: {companyProfile.commercialRegister}</p>
                  <p className="text-[10px] text-slate-600">{companyProfile.address} - {companyProfile.city}</p>
                </div>
                <div className="text-left">
                  <div className="inline-block bg-slate-100 border border-slate-400 px-3 py-1 font-bold text-sm">
                    فاتورة ضريبية رسمية
                  </div>
                  <p className="font-mono text-xs font-bold mt-1 text-slate-800">No: {selectedInvoiceForPrint.invoiceNumber}</p>
                  <p className="text-[10px] text-slate-600">التاريخ: {selectedInvoiceForPrint.date}</p>
                  <p className="text-[10px] text-slate-600">الاستحقاق: {selectedInvoiceForPrint.dueDate}</p>
                </div>
              </div>

              {/* Customer Box */}
              <div className="bg-slate-50 p-2.5 border border-slate-200 rounded">
                <strong>العميل المفوتر:</strong> {selectedInvoiceForPrint.entityName}
              </div>

              {/* Table of items */}
              <table className="w-full border-collapse border border-slate-300 text-right text-[11px]">
                <thead className="bg-slate-100">
                  <tr>
                    <th className="border border-slate-300 p-1.5">#</th>
                    <th className="border border-slate-300 p-1.5">البيان والخدمة</th>
                    <th className="border border-slate-300 p-1.5 text-center">الكمية</th>
                    <th className="border border-slate-300 p-1.5 text-left">السعر</th>
                    <th className="border border-slate-300 p-1.5 text-left">الضريبة</th>
                    <th className="border border-slate-300 p-1.5 text-left">الإجمالي</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedInvoiceForPrint.items.map((it, idx) => (
                    <tr key={it.id}>
                      <td className="border border-slate-300 p-1.5 text-center">{idx + 1}</td>
                      <td className="border border-slate-300 p-1.5 font-medium">{it.description}</td>
                      <td className="border border-slate-300 p-1.5 text-center font-mono">{it.quantity}</td>
                      <td className="border border-slate-300 p-1.5 text-left font-mono">{it.unitPrice.toLocaleString()}</td>
                      <td className="border border-slate-300 p-1.5 text-left font-mono">{it.taxAmount.toLocaleString()}</td>
                      <td className="border border-slate-300 p-1.5 text-left font-mono font-bold">{it.total.toLocaleString()}</td>
                    </tr>
                  ))}
                  <tr className="bg-slate-50 font-bold">
                    <td colSpan={5} className="border border-slate-300 p-1.5 text-right">المجموع الصافي قبل الضريبة</td>
                    <td className="border border-slate-300 p-1.5 text-left font-mono">{selectedInvoiceForPrint.subtotal.toLocaleString()} ر.ي</td>
                  </tr>
                  <tr className="bg-slate-50 font-bold">
                    <td colSpan={5} className="border border-slate-300 p-1.5 text-right">إجمالي ضريبة المبيعات</td>
                    <td className="border border-slate-300 p-1.5 text-left font-mono">{selectedInvoiceForPrint.taxTotal.toLocaleString()} ر.ي</td>
                  </tr>
                  <tr className="bg-slate-200 font-bold text-sm">
                    <td colSpan={5} className="border border-slate-400 p-1.5 text-right">المبلغ الإجمالي المستحق</td>
                    <td className="border border-slate-400 p-1.5 text-left font-mono">{selectedInvoiceForPrint.grandTotal.toLocaleString()} ر.ي</td>
                  </tr>
                </tbody>
              </table>

              <div className="p-2 bg-slate-50 border border-slate-200 text-[11px]">
                <strong>المبلغ كتابة:</strong> {tafqeetArabic(selectedInvoiceForPrint.grandTotal, 'YER')}
              </div>

              {selectedInvoiceForPrint.attachments && selectedInvoiceForPrint.attachments.length > 0 && (
                <div className="mt-6 print:hidden">
                  <DocumentArchiver
                    attachments={selectedInvoiceForPrint.attachments}
                    onAddAttachment={() => {}}
                    disabled={true}
                  />
                </div>
              )}

              {/* Footer with QR and signatures */}
              <div className="flex justify-between items-center pt-4">
                <div className="flex items-center gap-2 border border-slate-300 p-2 rounded bg-slate-50">
                  <QrCode className="w-12 h-12 text-slate-800" />
                  <div className="text-[9px] text-slate-600">
                    <p className="font-bold">رمز التحقق الضريبي QR</p>
                    <p>المصلحة العامة للضرائب</p>
                  </div>
                </div>

                <div className="text-center text-[10px]">
                  <p className="font-bold">ختم وتوقيع الإدارة المالية</p>
                  <p className="mt-6 text-slate-400">________________________</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* INVENTORY CATALOG QUICK BROWSER MODAL */}
      {isCatalogModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white border border-slate-200 rounded-3xl max-w-3xl w-full p-6 space-y-4 shadow-2xl max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-blue-100 flex items-center justify-center text-blue-700">
                  <Package className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">دليل ومستودع الأصناف السريع</h3>
                  <p className="text-xs text-slate-500">اختر أي صنف لإضافته مباشرة إلى جدول الفاتورة الحالية</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsCatalogModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Search & Category Filter */}
            <div className="space-y-3">
              <div className="relative">
                <input
                  type="text"
                  value={catalogSearchQuery}
                  onChange={(e) => setCatalogSearchQuery(e.target.value)}
                  onKeyDown={(e) => e.stopPropagation()}
                  placeholder="ابحث بالاسم، الكود، أو الباركود..."
                  className="w-full bg-slate-50 border-2 border-slate-200 focus:border-blue-500 rounded-xl pr-10 pl-3 py-2 text-xs font-semibold text-slate-900 focus:outline-none focus:bg-white"
                  autoFocus
                />
                <Search className="w-4 h-4 text-slate-400 absolute right-3.5 top-2.5" />
                {catalogSearchQuery && (
                  <button
                    type="button"
                    onClick={() => setCatalogSearchQuery('')}
                    className="absolute left-3 top-2.5 text-slate-400 hover:text-slate-600"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Category Filter Chips */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none text-xs">
                <button
                  type="button"
                  onClick={() => setCatalogCategoryFilter('ALL')}
                  className={`px-3 py-1 rounded-lg font-bold whitespace-nowrap transition ${
                    catalogCategoryFilter === 'ALL'
                      ? 'bg-blue-600 text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  الكل ({allInventoryCatalog.length})
                </button>
                {catalogCategories.map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setCatalogCategoryFilter(cat)}
                    className={`px-3 py-1 rounded-lg font-bold whitespace-nowrap transition ${
                      catalogCategoryFilter === cat
                        ? 'bg-blue-600 text-white'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            {/* Catalog Items List */}
            <div className="flex-1 overflow-y-auto divide-y divide-slate-100 border border-slate-200 rounded-2xl p-1 bg-slate-50/50">
              {filteredCatalogItems.length === 0 ? (
                <div className="text-center py-10 text-slate-400 text-xs font-medium">
                  لا توجد أصناف مطابقة لنتائج البحث
                </div>
              ) : (
                filteredCatalogItems.map((item) => (
                  <div
                    key={item.id}
                    className="p-3 bg-white hover:bg-blue-50/80 rounded-xl transition flex items-center justify-between gap-3 my-1 border border-slate-100"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600 shrink-0 font-bold">
                        <Package className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="font-bold text-slate-900 text-xs">{item.nameAr}</div>
                        <div className="text-[10px] text-slate-500 font-mono flex items-center gap-2 mt-0.5">
                          <span className="bg-slate-100 text-slate-600 px-1.5 py-0.2 rounded font-sans">{item.category || 'عام'}</span>
                          <span>كود: {item.code}</span>
                          <span>•</span>
                          <span className="text-emerald-700 font-bold">المتوفر: {item.quantity} {item.unit}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="text-left font-mono">
                        <div className="font-bold text-blue-700 text-xs">
                          {formatCurrency(item.salePrice, 'YER')}
                        </div>
                        <div className="text-[9px] text-slate-400">سعر الوحدة</div>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          handleInstantAddItem(item, 1);
                          setIsCatalogModalOpen(false);
                        }}
                        className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1 shadow-2xs"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>إضافة</span>
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="flex justify-end pt-2 border-t border-slate-200">
              <button
                type="button"
                onClick={() => setIsCatalogModalOpen(false)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition"
              >
                إغلاق
              </button>
            </div>
          </div>
        </div>
      )}

      {/* DOCUMENT SHARING MODAL (WHATSAPP / SMS) */}
      <DocumentShareModal
        isOpen={!!shareModalDoc}
        onClose={() => setShareModalDoc(null)}
        document={shareModalDoc}
        companyProfile={companyProfile}
      />
    </div>
  );
};
