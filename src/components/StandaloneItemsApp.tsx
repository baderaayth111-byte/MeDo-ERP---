import React, { useState, useMemo, useRef, useEffect } from 'react';
import {
  Package,
  Search,
  Filter,
  Plus,
  Minus,
  Download,
  UploadCloud,
  FileSpreadsheet,
  AlertTriangle,
  CheckCircle,
  TrendingDown,
  TrendingUp,
  Edit2,
  Trash2,
  ExternalLink,
  DollarSign,
  Layers,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  Tag,
  Printer,
  QrCode,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  X,
  Sparkles,
  Zap,
  Activity,
  Copy,
  Check,
  Share2,
  ArrowRight,
  Building2,
  Barcode as BarcodeIcon,
  RefreshCw,
  SlidersHorizontal,
  FileText,
  Boxes,
  History,
  Clock
} from 'lucide-react';
import {
  InventoryItem,
  Warehouse,
  Currency,
  CompanyProfile,
} from '../types/accounting';
import { CompanyHeaderView } from './CompanyHeaderView';
import { ItemModal } from './inventory/ItemModal';
import { CsvImportModal } from './inventory/CsvImportModal';
import { ItemBarcodeLabelModal } from './inventory/ItemBarcodeLabelModal';
import { SmartInventoryAlertsCard } from './SmartInventoryAlertsCard';
import { Barcode } from './inventory/BarcodeGenerator';
import { HighlightedText } from './common/HighlightedText';
import { formatCurrency } from '../utils/formatters';

interface StandaloneItemsAppProps {
  items: InventoryItem[];
  setItems: React.Dispatch<React.SetStateAction<InventoryItem[]>>;
  warehouses: Warehouse[];
  setWarehouses?: React.Dispatch<React.SetStateAction<Warehouse[]>>;
  companyProfile: CompanyProfile;
  currency: Currency;
  rates: Record<Currency, number>;
  onBackToParentSystem: () => void;
  isIsolatedMode?: boolean;
}

export const StandaloneItemsApp: React.FC<StandaloneItemsAppProps> = ({
  items,
  setItems,
  warehouses,
  setWarehouses,
  companyProfile,
  currency = 'YER' as Currency,
  rates = { YER: 1, USD: 535, SAR: 142 },
  onBackToParentSystem,
  isIsolatedMode = false,
}) => {
  // Search and filters
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [selectedSubCategory, setSelectedSubCategory] = useState<string>('ALL');
  const [selectedWarehouse, setSelectedWarehouse] = useState<string>('ALL');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
  const [viewMode, setViewMode] = useState<'TABLE' | 'CARDS'>('TABLE');

  // Live Sorting state
  const [sortField, setSortField] = useState<'code' | 'nameAr' | 'category' | 'quantity' | 'salePrice' | 'costPrice' | 'margin' | 'status'>('code');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState<number>(20);

  // Modals
  const [isItemModalOpen, setIsItemModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);
  const [isCsvModalOpen, setIsCsvModalOpen] = useState(false);
  const [isLabelModalOpen, setIsLabelModalOpen] = useState(false);
  const [selectedItemForLabel, setSelectedItemForLabel] = useState<InventoryItem | null>(null);
  
  // Stock History Log Modal
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [selectedHistoryItem, setSelectedHistoryItem] = useState<InventoryItem | null>(null);

  // Generate deterministic mock history based on item
  const getMockItemHistory = (item: InventoryItem) => {
    if (!item) return [];
    
    // Hash based on ID to make the history deterministic per item
    const hash = item.id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    
    const history = [];
    let runningQty = item.quantity || 0;
    
    const operations = [
      { type: 'OUT', label: 'مبيعات (صرف)', note: 'فاتورة مبيعات INV-203', user: 'محمد علي' },
      { type: 'IN', label: 'مشتريات (توريد)', note: 'أمر شراء PO-900', user: 'أحمد محمود' },
      { type: 'ADJ', label: 'تسوية جردية', note: 'تعديل كمية بعد الجرد', user: 'مدير النظام' },
      { type: 'OUT', label: 'صرف داخلي', note: 'صرف عهدة للمشروع X', user: 'سالم سعد' },
      { type: 'IN', label: 'مرتجع مبيعات', note: 'إرجاع من العميل (مذكرة إشعار)', user: 'ياسر فهد' },
    ];
  
    // Determine random number of movements for this item (between 3 and 10)
    const numMoves = (hash % 8) + 3;
    
    for (let i = 0; i < numMoves; i++) {
      const opIndex = (hash + i * 3) % operations.length;
      const op = operations[opIndex];
      const qtyChange = (op.type === 'IN' || op.type === 'ADJ') ? (Math.floor((hash + i) % 15) + 1) : -(Math.floor((hash + i) % 5) + 1);
      
      const pastDate = new Date();
      pastDate.setDate(pastDate.getDate() - i - (hash % 3));
      
      history.push({
        id: `hist-${i}`,
        date: pastDate,
        operation: op.label,
        note: op.note,
        user: op.user,
        qtyChange,
        balanceAfter: runningQty,
        type: op.type
      });
      
      runningQty = runningQty - qtyChange;
    }
    
    return history;
  };
  
  // Link copied state
  const [copiedLink, setCopiedLink] = useState(false);
  const [notificationToast, setNotificationToast] = useState<string | null>(null);

  // Push Notifications State (Stock Alerts)
  interface PushNotification {
    id: string;
    itemId: string;
    message: string;
    type: 'WARNING' | 'ERROR';
    timestamp: Date;
  }
  const [pushNotifications, setPushNotifications] = useState<PushNotification[]>([]);
  const prevItemsRef = useRef<InventoryItem[]>([]);

  // Monitor stock levels and generate push notifications
  useEffect(() => {
    const newNotifications: PushNotification[] = [];
    
    items.forEach(item => {
      const prevItem = prevItemsRef.current.find(i => i.id === item.id);
      
      // Stock dropped to 0
      if (item.quantity <= 0) {
        if (!prevItem || prevItem.quantity > 0) {
          newNotifications.push({
            id: `pn-err-${Date.now()}-${item.id}`,
            itemId: item.id,
            message: `تنبيه عاجل: لقد نفذت كمية الصنف [${item.nameAr}] بالكامل! يرجى إعادة الطلب فوراً.`,
            type: 'ERROR',
            timestamp: new Date()
          });

          // 🚨 Trigger External Email Notification for Financial Manager
          fetch('/api/notifications/email/stock-alert', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              itemId: item.id,
              itemName: item.nameAr,
              currentQuantity: item.quantity,
              minStockLevel: item.minStockLevel,
              managerEmail: 'finance.manager@medo-erp.com'
            })
          }).catch(err => console.error('Failed to trigger email alert:', err));
        }
      } 
      // Stock dropped below or equal to minStockLevel
      else if (item.quantity <= item.minStockLevel) {
        if (!prevItem || prevItem.quantity > item.minStockLevel) {
          newNotifications.push({
            id: `pn-warn-${Date.now()}-${item.id}`,
            itemId: item.id,
            message: `تحذير: لقد انخفض مخزون الصنف [${item.nameAr}] عن الحد الأدنى (${item.minStockLevel}). الكمية الحالية: ${item.quantity}. يرجى طلب كمية جديدة!`,
            type: 'WARNING',
            timestamp: new Date()
          });
        }
      }
    });

    if (newNotifications.length > 0) {
      setPushNotifications(prev => [...newNotifications, ...prev]);
    }
    
    prevItemsRef.current = items;
  }, [items]);

  // Auto-dismiss push notifications after 15 seconds
  useEffect(() => {
    if (pushNotifications.length > 0) {
      const timer = setTimeout(() => {
        setPushNotifications(prev => prev.filter(pn => Date.now() - pn.timestamp.getTime() < 15000));
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [pushNotifications]);

  const dismissPushNotification = (id: string) => {
    setPushNotifications(prev => prev.filter(pn => pn.id !== id));
  };

  // Search input ref for keyboard shortcut

  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        (e.key === '/' && document.activeElement?.tagName !== 'INPUT' && document.activeElement?.tagName !== 'TEXTAREA') ||
        e.key === 'F2' ||
        ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k')
      ) {
        e.preventDefault();
        searchInputRef.current?.focus();
        searchInputRef.current?.select();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const showToast = (msg: string) => {
    setNotificationToast(msg);
    setTimeout(() => setNotificationToast(null), 3500);
  };

  // Generate dedicated standalone URL
  const standaloneUrl = useMemo(() => {
    try {
      const url = new URL(window.location.href);
      url.searchParams.set('app', 'items');
      return url.toString();
    } catch {
      return `${window.location.origin}${window.location.pathname}?app=items`;
    }
  }, []);

  const handleCopyStandaloneLink = () => {
    try {
      navigator.clipboard.writeText(standaloneUrl);
      setCopiedLink(true);
      showToast('تم نسخ الرابط الخاص بتطبيق الأصناف بنجاح!');
      setTimeout(() => setCopiedLink(false), 2500);
    } catch {
      showToast('يرجى نسخ الرابط من شريط العنوان: ' + standaloneUrl);
    }
  };

  // Quick live inline quantity adjustment (+1 or -1)
  const handleQuickAdjustQty = (itemId: string, delta: number) => {
    setItems((prev) =>
      prev.map((it) => {
        if (it.id !== itemId) return it;
        const newQty = Math.max(0, (it.quantity || 0) + delta);
        let newStatus = it.status;
        if (newQty <= 0) newStatus = 'نفذت الكمية';
        else if (newQty <= it.minStockLevel) newStatus = 'منخفض';
        else newStatus = 'متوفر';

        return {
          ...it,
          quantity: newQty,
          status: newStatus,
          lastUpdated: new Date().toISOString().split('T')[0],
        };
      })
    );
  };

  // Categories list and counts
  const categories = useMemo(() => {
    const set = new Set(items.map((i) => i.category));
    return Array.from(set).filter(Boolean);
  }, [items]);

  const subCategories = useMemo(() => {
    const relevantItems = selectedCategory === 'ALL' ? items : items.filter(i => i.category === selectedCategory);
    const set = new Set(relevantItems.map((i) => i.subCategory).filter(Boolean));
    return Array.from(set) as string[];
  }, [items, selectedCategory]);

  // Live status counts
  const liveStatusCounts = useMemo(() => {
    let available = 0;
    let lowStock = 0;
    let outOfStock = 0;
    let totalStockValue = 0;
    let totalSaleValue = 0;

    items.forEach((item) => {
      const qty = item.quantity || 0;
      const cost = item.costPrice || 0;
      const sale = item.salePrice || 0;

      totalStockValue += qty * cost;
      totalSaleValue += qty * sale;

      if (qty <= 0) {
        outOfStock++;
      } else if (qty <= item.minStockLevel) {
        lowStock++;
      } else {
        available++;
      }
    });

    return {
      ALL: items.length,
      AVAILABLE: available,
      LOW_STOCK: lowStock,
      OUT_OF_STOCK: outOfStock,
      totalStockValue,
      totalSaleValue,
      expectedProfit: totalSaleValue - totalStockValue,
    };
  }, [items]);

  // Category counts
  const liveCategoryCounts = useMemo(() => {
    const map: Record<string, number> = {};
    items.forEach((it) => {
      map[it.category] = (map[it.category] || 0) + 1;
    });
    return map;
  }, [items]);

  // Toggle sort
  const handleSort = (field: typeof sortField) => {
    if (sortField === field) {
      setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  // Filtered & Sorted items
  const filteredItems = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();

    const filtered = items.filter((item) => {
      const wh = warehouses.find((w) => w.id === item.warehouseId);
      const matchesSearch =
        !query ||
        item.code.toLowerCase().includes(query) ||
        item.nameAr.toLowerCase().includes(query) ||
        item.category.toLowerCase().includes(query) ||
        (item.unit && item.unit.toLowerCase().includes(query)) ||
        (wh && wh.nameAr.toLowerCase().includes(query));

      const matchesCategory = selectedCategory === 'ALL' || item.category === selectedCategory;
      const matchesSubCategory = selectedSubCategory === 'ALL' || item.subCategory === selectedSubCategory;
      const matchesWarehouse = selectedWarehouse === 'ALL' || item.warehouseId === selectedWarehouse;
      const matchesStatus =
        selectedStatus === 'ALL' ||
        (selectedStatus === 'LOW_STOCK' && item.quantity > 0 && item.quantity <= item.minStockLevel) ||
        (selectedStatus === 'OUT_OF_STOCK' && item.quantity <= 0) ||
        (selectedStatus === 'AVAILABLE' && item.quantity > item.minStockLevel);

      return matchesSearch && matchesCategory && matchesSubCategory && matchesWarehouse && matchesStatus;
    });

    return filtered.sort((a, b) => {
      let comparison = 0;
      if (sortField === 'code') {
        comparison = a.code.localeCompare(b.code, undefined, { numeric: true });
      } else if (sortField === 'nameAr') {
        comparison = a.nameAr.localeCompare(b.nameAr, 'ar');
      } else if (sortField === 'category') {
        comparison = a.category.localeCompare(b.category, 'ar');
      } else if (sortField === 'quantity') {
        comparison = (a.quantity || 0) - (b.quantity || 0);
      } else if (sortField === 'salePrice') {
        comparison = (a.salePrice || 0) - (b.salePrice || 0);
      } else if (sortField === 'costPrice') {
        comparison = (a.costPrice || 0) - (b.costPrice || 0);
      } else if (sortField === 'margin') {
        const marginA = a.salePrice > 0 ? ((a.salePrice - a.costPrice) / a.salePrice) * 100 : 0;
        const marginB = b.salePrice > 0 ? ((b.salePrice - b.costPrice) / b.salePrice) * 100 : 0;
        comparison = marginA - marginB;
      } else if (sortField === 'status') {
        comparison = a.status.localeCompare(b.status, 'ar');
      }
      return sortDirection === 'asc' ? comparison : -comparison;
    });
  }, [items, searchTerm, selectedCategory, selectedWarehouse, selectedStatus, warehouses, sortField, sortDirection]);

  // Paginated records
  const totalPages = Math.max(1, Math.ceil(filteredItems.length / itemsPerPage));
  const paginatedItems = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredItems.slice(start, start + itemsPerPage);
  }, [filteredItems, currentPage, itemsPerPage]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, selectedCategory, selectedWarehouse, selectedStatus, itemsPerPage]);

  // Handle Save Item
  const handleSaveItem = (itemData: InventoryItem) => {
    setItems((prev) => {
      const exists = prev.some((i) => i.id === itemData.id);
      if (exists) {
        return prev.map((i) => (i.id === itemData.id ? itemData : i));
      }
      return [itemData, ...prev];
    });
    showToast(`تم حفظ بيانات الصنف "${itemData.nameAr}" بنجاح.`);
  };

  // Handle Delete Item
  const handleDeleteItem = (id: string, name: string) => {
    if (window.confirm(`هل أنت متأكد من رغبتك في حذف الصنف "${name}"؟`)) {
      setItems((prev) => prev.filter((i) => i.id !== id));
      showToast(`تم حذف الصنف "${name}"`);
    }
  };

  // Export to CSV
  const handleExportCsv = () => {
    const headers = [
      'رمز الصنف',
      'اسم الصنف بالعربي',
      'التصنيف',
      'الوحدة',
      'المستودع',
      'سعر التكلفة',
      'سعر البيع',
      'الكمية المتوفرة',
      'حد الطلب الأدنى',
      'هامش الربح %',
      'حالة التوفر',
      'تاريخ التحديث'
    ];

    const rows = filteredItems.map((it) => {
      const wh = warehouses.find((w) => w.id === it.warehouseId);
      const margin = it.salePrice > 0 ? (((it.salePrice - it.costPrice) / it.salePrice) * 100).toFixed(1) : '0';
      return [
        `"${it.code}"`,
        `"${it.nameAr.replace(/"/g, '""')}"`,
        `"${it.category}"`,
        `"${it.unit || 'حبه'}"`,
        `"${wh?.nameAr || it.warehouseId || ''}"`,
        it.costPrice,
        it.salePrice,
        it.quantity,
        it.minStockLevel,
        `"${margin}%"`,
        `"${it.status}"`,
        `"${it.lastUpdated || ''}"`
      ].join(',');
    });

    const csvContent = '\uFEFF' + [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `MeDo_Items_Catalog_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('تم تصدير ملف إكسيل بنجاح');
  };

  // Inject sample market items for fast field testing
  const handleInjectMarketSampleItems = () => {
    const sampleItems: InventoryItem[] = [
      {
        id: 'ITM-MKT-01',
        code: 'E101',
        nameAr: 'شاحن أنكر سريع 20 واط Type-C',
        category: 'إلكترونيات واكسسوارات',
        warehouseId: warehouses[0]?.id || 'WH-01',
        costPrice: 4200,
        salePrice: 6500,
        quantity: 45,
        unit: 'حبه',
        minStockLevel: 10,
        status: 'متوفر',
        lastUpdated: new Date().toISOString().split('T')[0],
      },
      {
        id: 'ITM-MKT-02',
        code: 'E102',
        nameAr: 'سماعة بلوتوث لاسلكية TWS Pro',
        category: 'إلكترونيات واكسسوارات',
        warehouseId: warehouses[0]?.id || 'WH-01',
        costPrice: 8500,
        salePrice: 13000,
        quantity: 18,
        unit: 'حبه',
        minStockLevel: 5,
        status: 'متوفر',
        lastUpdated: new Date().toISOString().split('T')[0],
      },
      {
        id: 'ITM-MKT-03',
        code: 'F201',
        nameAr: 'حليب نيدو مجفف 2.5 كجم',
        category: 'مواد غذائية واستهلاكية',
        warehouseId: warehouses[0]?.id || 'WH-01',
        costPrice: 12000,
        salePrice: 14500,
        quantity: 4,
        unit: 'علبة',
        minStockLevel: 8,
        status: 'منخفض',
        lastUpdated: new Date().toISOString().split('T')[0],
      },
      {
        id: 'ITM-MKT-04',
        code: 'F202',
        nameAr: 'زيت طبخ عافية 1.5 لتر',
        category: 'مواد غذائية واستهلاكية',
        warehouseId: warehouses[0]?.id || 'WH-01',
        costPrice: 3100,
        salePrice: 3800,
        quantity: 0,
        unit: 'قنينة',
        minStockLevel: 12,
        status: 'نفذت الكمية',
        lastUpdated: new Date().toISOString().split('T')[0],
      },
      {
        id: 'ITM-MKT-05',
        code: 'C301',
        nameAr: 'قميص رجالي قطن كلاسيك فاخر',
        category: 'أزياء وملبوسات',
        warehouseId: warehouses[0]?.id || 'WH-01',
        costPrice: 9000,
        salePrice: 16000,
        quantity: 32,
        unit: 'قطعة',
        minStockLevel: 6,
        status: 'متوفر',
        lastUpdated: new Date().toISOString().split('T')[0],
      },
    ];

    setItems((prev) => {
      const existingCodes = new Set(prev.map((p) => p.code));
      const toAdd = sampleItems.filter((s) => !existingCodes.has(s.code));
      if (toAdd.length === 0) {
        showToast('الأصناف التجريبية موجودة بالفعل في الكتالوج');
        return prev;
      }
      showToast(`تمت إضافة ${toAdd.length} أصناف تجريبية للميدان بنجاح`);
      return [...toAdd, ...prev];
    });
  };

  return (
    <div className="min-h-screen bg-slate-100 text-slate-800 font-sans flex flex-col" dir="rtl">
      
      {/* Standalone Market Testing Header */}
      <header className="bg-slate-900 text-white sticky top-0 z-40 border-b border-slate-800 shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex flex-wrap items-center justify-between gap-3">
          
          {/* Logo & Identity */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-blue-700 text-white flex items-center justify-center shadow-md shadow-indigo-500/20">
              <Boxes className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base font-black text-white tracking-tight">
                  MeDo Items | إدارة الأصناف والكتالوج الذكي
                </h1>
                <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 text-[10px] font-black px-2 py-0.5 rounded-full">
                  نسخة تجربة السوق الميدانية
                </span>
              </div>
              <div className="space-y-0.5 pt-1">
                <CompanyHeaderView align="right" size="sm" />
                <div className="font-mono text-[10px] text-slate-400">SAP MM-IM Isolated Edition</div>
              </div>
            </div>
          </div>

          {/* Action Bar & Share Link */}
          <div className="flex items-center gap-2 flex-wrap">
            
            {/* Copy Dedicated Link Button */}
            <button
              onClick={handleCopyStandaloneLink}
              className={`px-3 py-1.5 rounded-xl text-xs font-black flex items-center gap-1.5 transition-all shadow-xs cursor-pointer ${
                copiedLink
                  ? 'bg-emerald-600 text-white'
                  : 'bg-indigo-600/30 hover:bg-indigo-600/50 text-indigo-200 border border-indigo-500/40'
              }`}
              title="نسخ الرابط المخصص للتطبيق الميداني"
            >
              {copiedLink ? <Check className="w-4 h-4" /> : <Share2 className="w-4 h-4" />}
              <span>{copiedLink ? 'تم نسخ الرابط!' : 'رابط التطبيق الخاص'}</span>
            </button>

            {/* Quick Sample Items */}
            <button
              onClick={handleInjectMarketSampleItems}
              className="px-3 py-1.5 rounded-xl text-xs font-black bg-slate-800 hover:bg-slate-700 text-amber-300 border border-amber-500/30 flex items-center gap-1.5 transition shadow-xs cursor-pointer"
              title="إضافة عينات أصناف من السوق للاختبار السريع"
            >
              <Sparkles className="w-4 h-4 text-amber-400" />
              <span>أصناف تجريبية</span>
            </button>

            {/* Switch to Parent ERP System */}
            {!isIsolatedMode && (
              <button
                onClick={onBackToParentSystem}
                className="px-3.5 py-1.5 rounded-xl text-xs font-black bg-slate-800 hover:bg-slate-700 text-white border border-slate-700 flex items-center gap-1.5 transition shadow-xs cursor-pointer"
                title="العودة لكامل النظام المحاسبي MeDo ERP"
              >
                <span>نظام MeDo ERP الأم</span>
                <ArrowLeftIcon className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
        
        {/* Dedicated Link Banner */}
        <div className="bg-gradient-to-r from-indigo-950 via-slate-900 to-slate-950 border border-indigo-500/30 rounded-2xl p-4 sm:p-5 text-white shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></span>
              <h2 className="text-sm font-black text-white">
                رابط تشغيل مستقل وتجربة حية للأصناف والمخزون
              </h2>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed max-w-2xl">
              تم عزل الأصناف في هذه الواجهة مع الاحتفاظ الكامل بنفس الألوان والخانات والعظام والشاشات وبطاقات المواد. يمكنك مشاركة الرابط أدناه مباشرة مع مسؤولي المستودعات والمندوبين في السوق.
            </p>
            <div className="pt-1 flex items-center gap-2 font-mono text-[11px] text-indigo-300 bg-slate-950/60 px-3 py-1.5 rounded-lg border border-slate-800 break-all select-all">
              <Tag className="w-3.5 h-3.5 shrink-0 text-indigo-400" />
              <span>{standaloneUrl}</span>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={handleCopyStandaloneLink}
              className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-black flex items-center gap-2 shadow-lg shadow-indigo-600/30 transition cursor-pointer active:scale-95"
            >
              <Copy className="w-4 h-4" />
              <span>نسخ الرابط الميداني</span>
            </button>
          </div>
        </div>

        {/* KPI & Summary Metrics Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          {/* Total Items */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-slate-500">إجمالي الأصناف بالكتالوج</p>
              <h3 className="text-xl sm:text-2xl font-black text-slate-900 font-mono mt-1">
                {liveStatusCounts.ALL}
              </h3>
              <p className="text-[11px] text-slate-400 mt-0.5">{categories.length} تصنيفات نشطة</p>
            </div>
            <div className="w-11 h-11 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <Package className="w-6 h-6" />
            </div>
          </div>

          {/* Available Stock */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-slate-500">أصناف متوفرة (سليمة)</p>
              <h3 className="text-xl sm:text-2xl font-black text-emerald-600 font-mono mt-1">
                {liveStatusCounts.AVAILABLE}
              </h3>
              <p className="text-[11px] text-emerald-600 mt-0.5 font-bold">مخزون كافٍ ومستقر</p>
            </div>
            <div className="w-11 h-11 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <CheckCircle className="w-6 h-6" />
            </div>
          </div>

          {/* Low Stock Alerts */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-slate-500">أصناف تقترب من النفاد</p>
              <h3 className="text-xl sm:text-2xl font-black text-amber-600 font-mono mt-1">
                {liveStatusCounts.LOW_STOCK}
              </h3>
              <p className="text-[11px] text-amber-600 mt-0.5 font-bold">دون الحد الأدنى</p>
            </div>
            <div className="w-11 h-11 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <AlertTriangle className="w-6 h-6" />
            </div>
          </div>

          {/* Out of Stock */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-slate-500">أصناف نفذت بالكامل</p>
              <h3 className="text-xl sm:text-2xl font-black text-rose-600 font-mono mt-1">
                {liveStatusCounts.OUT_OF_STOCK}
              </h3>
              <p className="text-[11px] text-rose-600 mt-0.5 font-bold">تحتاج إعادة طلب فورية</p>
            </div>
            <div className="w-11 h-11 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
              <TrendingDown className="w-6 h-6" />
            </div>
          </div>
        </div>

        {/* Smart Low Stock Alert Card (if any low or out of stock) */}
        {(liveStatusCounts.LOW_STOCK > 0 || liveStatusCounts.OUT_OF_STOCK > 0) && (
          <SmartInventoryAlertsCard
            items={items}
            warehouses={warehouses}
            onQuickReorder={(item) => {
              setEditingItem(item);
              setIsItemModalOpen(true);
            }}
          />
        )}

        {/* Main Operational Container */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          
          {/* Controls, Search & Filter Bar */}
          <div className="p-4 sm:p-5 border-b border-slate-100 space-y-4">
            
            {/* Top row: Search, Add Item, Import/Export */}
            <div className="flex flex-wrap items-center justify-between gap-3">
              
              {/* Search Bar with Hotkey support */}
              <div className="relative flex-1 min-w-[260px]">
                <Search className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2" />
                <input
                  ref={searchInputRef}
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="ابحث برمز الصنف (SKU)، الاسم، الباركود، التصنيف، الوحدة... (اضغط / أو F2 للبحث)"
                  className="w-full pl-16 pr-10 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition outline-hidden"
                />
                {searchTerm ? (
                  <button
                    onClick={() => setSearchTerm('')}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                ) : (
                  <kbd className="absolute left-3 top-1/2 -translate-y-1/2 bg-white border border-slate-200 text-slate-400 text-[10px] px-1.5 py-0.5 rounded font-mono shadow-2xs">
                    /
                  </kbd>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2 flex-wrap">
                
                {/* Add New Item Button (MM01) */}
                <button
                  onClick={() => {
                    setEditingItem(null);
                    setIsItemModalOpen(true);
                  }}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold px-4 py-2.5 rounded-xl transition flex items-center gap-2 shadow-sm active:scale-95 cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>إضافة صنف جديد (MM01)</span>
                </button>

                {/* Import Excel */}
                <button
                  onClick={() => setIsCsvModalOpen(true)}
                  className="bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold px-3 py-2.5 rounded-xl transition flex items-center gap-1.5 cursor-pointer"
                  title="استيراد أصناف من ملف Excel / CSV"
                >
                  <UploadCloud className="w-4 h-4 text-slate-600" />
                  <span>استيراد</span>
                </button>

                {/* Export Excel */}
                <button
                  onClick={handleExportCsv}
                  className="bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold px-3 py-2.5 rounded-xl transition flex items-center gap-1.5 cursor-pointer"
                  title="تصدير كشف الأصناف إلى Excel"
                >
                  <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                  <span>تصدير Excel</span>
                </button>

                {/* View Mode Toggle */}
                <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200">
                  <button
                    onClick={() => setViewMode('TABLE')}
                    className={`px-2.5 py-1 text-xs font-bold rounded-lg transition ${
                      viewMode === 'TABLE' ? 'bg-white text-indigo-900 shadow-xs' : 'text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    جدول
                  </button>
                  <button
                    onClick={() => setViewMode('CARDS')}
                    className={`px-2.5 py-1 text-xs font-bold rounded-lg transition ${
                      viewMode === 'CARDS' ? 'bg-white text-indigo-900 shadow-xs' : 'text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    بطاقات
                  </button>
                </div>
              </div>
            </div>

            {/* Category Quick Filter Pills */}
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs no-scrollbar">
                <span className="text-slate-400 font-bold ml-1 shrink-0 flex items-center gap-1">
                  <Filter className="w-3 h-3" />
                  التصنيف:
                </span>
                <button
                  onClick={() => setSelectedCategory('ALL')}
                  className={`px-3 py-1 rounded-lg font-bold shrink-0 transition ${
                    selectedCategory === 'ALL'
                      ? 'bg-indigo-900 text-white'
                      : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
                  }`}
                >
                  الكل ({items.length})
                </button>
                {categories.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => {
                      setSelectedCategory(cat);
                      setSelectedSubCategory('ALL'); // Reset sub-category when changing main category
                    }}
                    className={`px-3 py-1 rounded-lg font-bold shrink-0 transition flex items-center gap-1.5 ${
                      selectedCategory === cat
                        ? 'bg-indigo-900 text-white'
                        : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
                    }`}
                  >
                    <span>{cat}</span>
                    <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                      selectedCategory === cat ? 'bg-indigo-800 text-indigo-200' : 'bg-slate-200 text-slate-600'
                    }`}>
                      {liveCategoryCounts[cat] || 0}
                    </span>
                  </button>
                ))}
              </div>

              {/* Sub-Category Quick Filter Pills */}
              {(selectedCategory !== 'ALL' || subCategories.length > 0) && (
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs no-scrollbar">
                  <span className="text-slate-400 font-bold ml-1 shrink-0 flex items-center gap-1">
                    <Filter className="w-3 h-3 opacity-50" />
                    الفرعي:
                  </span>
                  <button
                    onClick={() => setSelectedSubCategory('ALL')}
                    className={`px-3 py-1 rounded-lg font-bold shrink-0 transition ${
                      selectedSubCategory === 'ALL'
                        ? 'bg-blue-900 text-white'
                        : 'bg-slate-50 hover:bg-slate-200 text-slate-500 border border-slate-100'
                    }`}
                  >
                    الكل
                  </button>
                  {subCategories.map((subCat) => (
                    <button
                      key={subCat}
                      onClick={() => setSelectedSubCategory(subCat)}
                      className={`px-3 py-1 rounded-lg font-bold shrink-0 transition flex items-center gap-1.5 ${
                        selectedSubCategory === subCat
                          ? 'bg-blue-900 text-white'
                          : 'bg-slate-50 hover:bg-slate-200 text-slate-500 border border-slate-100'
                      }`}
                    >
                      <span>{subCat}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Status & Warehouse Secondary Filters */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-1 border-t border-slate-100 text-xs">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-slate-500 font-bold">حالة التوفر:</span>
                <select
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value)}
                  className="bg-slate-50 border border-slate-200 text-slate-700 text-xs rounded-lg px-2.5 py-1.5 font-bold focus:outline-hidden"
                >
                  <option value="ALL">جميع الحالات ({liveStatusCounts.ALL})</option>
                  <option value="AVAILABLE">متوفر فقط ({liveStatusCounts.AVAILABLE})</option>
                  <option value="LOW_STOCK">منخفض (تحت حد الطلب) ({liveStatusCounts.LOW_STOCK})</option>
                  <option value="OUT_OF_STOCK">نفذت الكمية ({liveStatusCounts.OUT_OF_STOCK})</option>
                </select>

                <span className="text-slate-500 font-bold mr-2">المستودع:</span>
                <select
                  value={selectedWarehouse}
                  onChange={(e) => setSelectedWarehouse(e.target.value)}
                  className="bg-slate-50 border border-slate-200 text-slate-700 text-xs rounded-lg px-2.5 py-1.5 font-bold focus:outline-hidden"
                >
                  <option value="ALL">جميع المستودعات</option>
                  {warehouses.map((w) => (
                    <option key={w.id} value={w.id}>
                      {w.nameAr} ({w.code})
                    </option>
                  ))}
                </select>
              </div>

              <div className="text-slate-500 font-bold text-xs">
                عرض <span className="font-mono text-slate-900 font-black">{paginatedItems.length}</span> من أصل <span className="font-mono text-slate-900 font-black">{filteredItems.length}</span> صنف
              </div>
            </div>
          </div>

          {/* TABLE VIEW */}
          {viewMode === 'TABLE' ? (
            <div className="overflow-x-auto">
              <table className="w-full text-right text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50 text-slate-600 font-black border-b border-slate-200 select-none">
                    <th
                      onClick={() => handleSort('code')}
                      className="py-3 px-4 cursor-pointer hover:bg-slate-100 transition"
                    >
                      <div className="flex items-center gap-1">
                        <span>رمز الصنف (SKU)</span>
                        <ArrowUpDown className="w-3 h-3 text-slate-400" />
                      </div>
                    </th>
                    <th
                      onClick={() => handleSort('nameAr')}
                      className="py-3 px-4 cursor-pointer hover:bg-slate-100 transition"
                    >
                      <div className="flex items-center gap-1">
                        <span>اسم الصنف المحاسبي</span>
                        <ArrowUpDown className="w-3 h-3 text-slate-400" />
                      </div>
                    </th>
                    <th
                      onClick={() => handleSort('category')}
                      className="py-3 px-3 cursor-pointer hover:bg-slate-100 transition"
                    >
                      <div className="flex items-center gap-1">
                        <span>التصنيف</span>
                        <ArrowUpDown className="w-3 h-3 text-slate-400" />
                      </div>
                    </th>
                    <th className="py-3 px-3 text-center">الوحدة</th>
                    <th
                      onClick={() => handleSort('costPrice')}
                      className="py-3 px-3 cursor-pointer hover:bg-slate-100 transition text-left"
                    >
                      <div className="flex items-center justify-end gap-1">
                        <span>سعر التكلفة</span>
                        <ArrowUpDown className="w-3 h-3 text-slate-400" />
                      </div>
                    </th>
                    <th
                      onClick={() => handleSort('salePrice')}
                      className="py-3 px-3 cursor-pointer hover:bg-slate-100 transition text-left"
                    >
                      <div className="flex items-center justify-end gap-1">
                        <span>سعر البيع</span>
                        <ArrowUpDown className="w-3 h-3 text-slate-400" />
                      </div>
                    </th>
                    <th
                      onClick={() => handleSort('margin')}
                      className="py-3 px-2 cursor-pointer hover:bg-slate-100 transition text-center"
                    >
                      <div className="flex items-center justify-center gap-1">
                        <span>الهامش %</span>
                        <ArrowUpDown className="w-3 h-3 text-slate-400" />
                      </div>
                    </th>
                    <th
                      onClick={() => handleSort('quantity')}
                      className="py-3 px-3 cursor-pointer hover:bg-slate-100 transition text-center"
                    >
                      <div className="flex items-center justify-center gap-1">
                        <span>الكمية المتاحة</span>
                        <ArrowUpDown className="w-3 h-3 text-slate-400" />
                      </div>
                    </th>
                    <th
                      onClick={() => handleSort('status')}
                      className="py-3 px-3 cursor-pointer hover:bg-slate-100 transition text-center"
                    >
                      <div className="flex items-center justify-center gap-1">
                        <span>الحالة</span>
                        <ArrowUpDown className="w-3 h-3 text-slate-400" />
                      </div>
                    </th>
                    <th className="py-3 px-4 text-center">الإجراءات والباركود</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100">
                  {paginatedItems.length === 0 ? (
                    <tr>
                      <td colSpan={10} className="py-12 text-center text-slate-500 font-bold">
                        <Package className="w-12 h-12 text-slate-300 mx-auto mb-2" />
                        <p className="text-sm font-bold text-slate-700">لا توجد أصناف مطابقة للبحث أو الفلتر</p>
                        <p className="text-xs text-slate-400 mt-1">جرب تغيير كلمات البحث أو إضافة أصناف تجريبية</p>
                      </td>
                    </tr>
                  ) : (
                    paginatedItems.map((it) => {
                      const margin = it.salePrice > 0 ? (((it.salePrice - it.costPrice) / it.salePrice) * 100) : 0;
                      const isLow = (it.quantity || 0) > 0 && (it.quantity || 0) <= it.minStockLevel;
                      const isOut = (it.quantity || 0) <= 0;

                      return (
                        <tr
                          key={it.id}
                          className="hover:bg-indigo-50/30 transition-colors group"
                        >
                          {/* Item Code */}
                          <td className="py-3 px-4 font-mono font-black text-slate-900 text-xs">
                            <span className="bg-slate-100 px-2 py-0.5 rounded-md border border-slate-200">
                              <HighlightedText text={it.code} highlight={searchTerm} />
                            </span>
                          </td>

                          {/* Item Name */}
                          <td className="py-3 px-4 font-bold text-slate-900">
                            <div>
                              <HighlightedText text={it.nameAr} highlight={searchTerm} />
                              {it.description && (
                                <p className="text-[11px] text-slate-400 font-normal truncate max-w-xs">{it.description}</p>
                              )}
                            </div>
                          </td>

                          {/* Category */}
                          <td className="py-3 px-3">
                            <div className="flex flex-col gap-1 items-start">
                              <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded text-[11px] font-bold">
                                {it.category}
                              </span>
                              {it.subCategory && (
                                <span className="bg-blue-50 text-blue-700 border border-blue-100 px-2 py-0.5 rounded text-[10px] font-bold">
                                  {it.subCategory}
                                </span>
                              )}
                            </div>
                          </td>

                          {/* Unit */}
                          <td className="py-3 px-3 text-center text-slate-600 font-bold">
                            {it.unit || 'حبه'}
                          </td>

                          {/* Cost Price */}
                          <td className="py-3 px-3 text-left font-mono font-bold text-slate-600">
                            {formatCurrency(it.costPrice || 0, currency, rates)}
                          </td>

                          {/* Sale Price */}
                          <td className="py-3 px-3 text-left font-mono font-black text-indigo-950">
                            {formatCurrency(it.salePrice || 0, currency, rates)}
                          </td>

                          {/* Margin */}
                          <td className="py-3 px-2 text-center font-mono font-bold">
                            <span className={`text-[11px] ${margin >= 20 ? 'text-emerald-700 font-black' : margin > 0 ? 'text-amber-700' : 'text-rose-700'}`}>
                              {margin.toFixed(1)}%
                            </span>
                          </td>

                          {/* Quantity with quick adjust controls (+ / -) */}
                          <td className="py-3 px-3 text-center">
                            <div className="inline-flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-lg p-1">
                              <button
                                onClick={() => handleQuickAdjustQty(it.id, -1)}
                                className="w-5 h-5 bg-white hover:bg-slate-200 text-slate-700 rounded flex items-center justify-center font-bold text-xs shadow-2xs cursor-pointer active:scale-90"
                                title="إنقاص الكمية (-1)"
                              >
                                <Minus className="w-3 h-3" />
                              </button>
                              <span className={`font-mono font-black px-1.5 text-xs ${isOut ? 'text-rose-600' : isLow ? 'text-amber-600' : 'text-slate-900'}`}>
                                {it.quantity || 0}
                              </span>
                              <button
                                onClick={() => handleQuickAdjustQty(it.id, 1)}
                                className="w-5 h-5 bg-white hover:bg-slate-200 text-slate-700 rounded flex items-center justify-center font-bold text-xs shadow-2xs cursor-pointer active:scale-90"
                                title="زيادة الكمية (+1)"
                              >
                                <Plus className="w-3 h-3" />
                              </button>
                            </div>
                          </td>

                          {/* Status Badge */}
                          <td className="py-3 px-3 text-center">
                            <span
                              className={`inline-block px-2.5 py-0.5 rounded-full text-[11px] font-black border ${
                                isOut
                                  ? 'bg-rose-50 text-rose-700 border-rose-200'
                                  : isLow
                                  ? 'bg-amber-50 text-amber-700 border-amber-200'
                                  : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              }`}
                            >
                              {it.status}
                            </span>
                          </td>

                          {/* Actions */}
                          <td className="py-3 px-4 text-center">
                            <div className="flex items-center justify-center gap-1">
                              {/* Stock History */}
                              <button
                                onClick={() => {
                                  setSelectedHistoryItem(it);
                                  setIsHistoryModalOpen(true);
                                }}
                                className="p-1.5 bg-slate-100 hover:bg-emerald-100 text-slate-700 hover:text-emerald-800 rounded-lg transition"
                                title="سجل حركات الصنف"
                              >
                                <History className="w-3.5 h-3.5" />
                              </button>

                              {/* Print Barcode Label */}
                              <button
                                onClick={() => {
                                  setSelectedItemForLabel(it);
                                  setIsLabelModalOpen(true);
                                }}
                                className="p-1.5 bg-slate-100 hover:bg-indigo-100 text-slate-700 hover:text-indigo-800 rounded-lg transition"
                                title="طباعة ملصق الباركود والسعر"
                              >
                                <BarcodeIcon className="w-3.5 h-3.5" />
                              </button>

                              {/* Edit Item (MM02) */}
                              <button
                                onClick={() => {
                                  setEditingItem(it);
                                  setIsItemModalOpen(true);
                                }}
                                className="p-1.5 bg-slate-100 hover:bg-blue-100 text-slate-700 hover:text-blue-800 rounded-lg transition"
                                title="تعديل بطاقة الصنف"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>

                              {/* Delete Item */}
                              <button
                                onClick={() => handleDeleteItem(it.id, it.nameAr)}
                                className="p-1.5 bg-slate-100 hover:bg-rose-100 text-slate-700 hover:text-rose-800 rounded-lg transition"
                                title="حذف الصنف"
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
          ) : (
            /* CARDS VIEW */
            <div className="p-4 sm:p-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {paginatedItems.map((it) => {
                const margin = it.salePrice > 0 ? (((it.salePrice - it.costPrice) / it.salePrice) * 100) : 0;
                const isLow = (it.quantity || 0) > 0 && (it.quantity || 0) <= it.minStockLevel;
                const isOut = (it.quantity || 0) <= 0;

                return (
                  <div
                    key={it.id}
                    className="bg-white border border-slate-200 rounded-2xl p-4 shadow-2xs hover:shadow-md hover:border-indigo-300 transition-all flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <span className="font-mono font-black text-xs bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                          {it.code}
                        </span>
                        <span
                          className={`text-[10px] font-black px-2 py-0.5 rounded-full border ${
                            isOut
                              ? 'bg-rose-50 text-rose-700 border-rose-200'
                              : isLow
                              ? 'bg-amber-50 text-amber-700 border-amber-200'
                              : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          }`}
                        >
                          {it.status}
                        </span>
                      </div>

                      <h4 className="font-black text-sm text-slate-900 mb-1 leading-snug">
                        {it.nameAr}
                      </h4>
                      <p className="text-xs text-slate-500 mb-3">
                        {it.category}
                        {it.subCategory && <span className="mx-1 text-blue-600 font-medium">({it.subCategory})</span>}
                      </p>

                      {/* Barcode representation */}
                      <div className="bg-slate-50 p-2 rounded-xl border border-slate-100 flex items-center justify-center my-2">
                        <Barcode value={it.code} width={1.2} height={30} />
                      </div>

                      <div className="grid grid-cols-2 gap-2 text-xs pt-2 border-t border-slate-100">
                        <div>
                          <span className="text-slate-400 block text-[10px]">سعر البيع</span>
                          <span className="font-black font-mono text-indigo-950">
                            {formatCurrency(it.salePrice || 0, currency, rates)}
                          </span>
                        </div>
                        <div>
                          <span className="text-slate-400 block text-[10px]">هامش الربح</span>
                          <span className="font-bold font-mono text-emerald-700">
                            {margin.toFixed(1)}%
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="pt-3 mt-3 border-t border-slate-100 flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs text-slate-500">الكمية:</span>
                        <span className="font-black font-mono text-xs">{it.quantity || 0} {it.unit || 'حبه'}</span>
                      </div>

                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => {
                            setSelectedItemForLabel(it);
                            setIsLabelModalOpen(true);
                          }}
                          className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-slate-100 rounded-lg"
                        >
                          <BarcodeIcon className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => {
                            setEditingItem(it);
                            setIsItemModalOpen(true);
                          }}
                          className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-slate-100 rounded-lg"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Pagination Footer */}
          {filteredItems.length > 0 && (
            <div className="px-4 py-3 bg-slate-50 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2">
                <span className="text-slate-600 font-bold">عدد السجلات بالصفحة:</span>
                <select
                  value={itemsPerPage}
                  onChange={(e) => setItemsPerPage(Number(e.target.value))}
                  className="bg-white border border-slate-200 text-slate-800 text-xs rounded-lg px-2 py-1 font-bold focus:outline-hidden"
                >
                  <option value={10}>10</option>
                  <option value={20}>20</option>
                  <option value={50}>50</option>
                  <option value={100}>100</option>
                </select>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-slate-600">
                  الصفحة <strong className="text-slate-900 font-mono">{currentPage}</strong> من <strong className="text-slate-900 font-mono">{totalPages}</strong>
                </span>
                <div className="flex items-center gap-1">
                  <button
                    disabled={currentPage <= 1}
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    className="p-1.5 bg-white border border-slate-200 rounded-lg text-slate-700 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                  <button
                    disabled={currentPage >= totalPages}
                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                    className="p-1.5 bg-white border border-slate-200 rounded-lg text-slate-700 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          )}

        </div>

        <footer className="mt-8 py-4 text-center text-xs font-semibold text-slate-500 border-t border-slate-200/60 w-full max-w-7xl mx-auto">
          كل الحقوق محفوظة لميدو تك للحلول البرمجية، 8/2026
        </footer>
      </main>

      {/* Item Modal (Create/Edit MM01/MM02) */}
      {isItemModalOpen && (
        <ItemModal
          isOpen={isItemModalOpen}
          onClose={() => setIsItemModalOpen(false)}
          onSave={handleSaveItem}
          editItem={editingItem}
          warehouses={warehouses}
        />
      )}

      {/* CSV / Excel Import Modal */}
      {isCsvModalOpen && (
        <CsvImportModal
          isOpen={isCsvModalOpen}
          onClose={() => setIsCsvModalOpen(false)}
          onImport={(imported) => {
            setItems((prev) => [...imported, ...prev]);
            showToast(`تم استيراد ${imported.length} صنف بنجاح!`);
          }}
          warehouses={warehouses}
        />
      )}

      {/* Barcode & Price Tag Label Modal */}
      {isLabelModalOpen && (
        <ItemBarcodeLabelModal
          isOpen={isLabelModalOpen}
          onClose={() => setIsLabelModalOpen(false)}
          item={selectedItemForLabel}
          companyProfile={companyProfile}
          currency={currency}
          rates={rates}
        />
      )}

      {/* Floating Notification Toast */}
      {notificationToast && (
        <div className="fixed bottom-6 left-6 z-50 bg-slate-900 text-white px-4 py-3 rounded-2xl shadow-2xl border border-slate-700 text-xs font-bold flex items-center gap-2 animate-in fade-in slide-in-from-bottom-3 duration-200">
          <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{notificationToast}</span>
        </div>
      )}

      {/* Push Notifications Queue */}
      <div className="fixed top-6 left-6 z-[60] flex flex-col gap-3 pointer-events-none">
        {pushNotifications.map((pn) => (
          <div
            key={pn.id}
            className={`pointer-events-auto flex items-start gap-3 p-4 rounded-xl shadow-2xl border w-80 sm:w-96 animate-in slide-in-from-left-8 fade-in duration-300 ${
              pn.type === 'ERROR'
                ? 'bg-rose-50 border-rose-200 text-rose-900'
                : 'bg-amber-50 border-amber-200 text-amber-900'
            }`}
          >
            <div className={`mt-0.5 shrink-0 p-1.5 rounded-full ${pn.type === 'ERROR' ? 'bg-rose-100 text-rose-600' : 'bg-amber-100 text-amber-600'}`}>
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div className="flex-1">
              <h4 className={`text-sm font-bold mb-1 ${pn.type === 'ERROR' ? 'text-rose-800' : 'text-amber-800'}`}>
                {pn.type === 'ERROR' ? 'تنبيه نفاذ المخزون' : 'تنبيه انخفاض المخزون'}
              </h4>
              <p className="text-xs leading-relaxed opacity-90">{pn.message}</p>
            </div>
            <button
              onClick={() => dismissPushNotification(pn.id)}
              className={`shrink-0 p-1 rounded-md opacity-60 hover:opacity-100 transition-opacity ${pn.type === 'ERROR' ? 'hover:bg-rose-100' : 'hover:bg-amber-100'}`}
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>

      {/* Stock History Log Modal */}
      {isHistoryModalOpen && selectedHistoryItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs" dir="rtl">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-emerald-100 text-emerald-700 rounded-xl">
                  <History className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-800 text-lg">سجل حركات الصنف</h3>
                  <p className="text-xs text-slate-500 font-medium mt-0.5">
                    {selectedHistoryItem.nameAr} <span className="mx-1 text-slate-300">|</span> <span className="font-mono">{selectedHistoryItem.code}</span>
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  setIsHistoryModalOpen(false);
                  setSelectedHistoryItem(null);
                }}
                className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-0 overflow-y-auto flex-1">
              <div className="px-6 py-5">
                <div className="flex items-center justify-between mb-4 bg-slate-50 p-4 rounded-xl border border-slate-100">
                  <div>
                    <div className="text-xs text-slate-500 font-medium mb-1">الرصيد الحالي المتوفر</div>
                    <div className="text-xl font-black text-slate-800 flex items-baseline gap-1">
                      {selectedHistoryItem.quantity} <span className="text-sm text-slate-500 font-medium">{selectedHistoryItem.unit}</span>
                    </div>
                  </div>
                  <div className="w-px h-10 bg-slate-200 mx-4"></div>
                  <div>
                    <div className="text-xs text-slate-500 font-medium mb-1">آخر تحديث للرصيد</div>
                    <div className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                      {new Date().toLocaleDateString('ar-SA')}
                    </div>
                  </div>
                  <div className="w-px h-10 bg-slate-200 mx-4 hidden sm:block"></div>
                  <div className="hidden sm:block">
                    <div className="text-xs text-slate-500 font-medium mb-1">المستودع الرئيسي</div>
                    <div className="text-sm font-bold text-slate-800">
                      {warehouses.find(w => w.id === selectedHistoryItem.warehouseId)?.nameAr || 'المستودع الرئيسي'}
                    </div>
                  </div>
                </div>

                <div className="border border-slate-200 rounded-xl overflow-hidden shadow-xs">
                  <table className="w-full text-right border-collapse">
                    <thead className="bg-slate-50 border-b border-slate-200">
                      <tr>
                        <th className="py-3 px-4 text-xs font-bold text-slate-600 whitespace-nowrap">التاريخ</th>
                        <th className="py-3 px-4 text-xs font-bold text-slate-600 whitespace-nowrap">نوع الحركة</th>
                        <th className="py-3 px-4 text-xs font-bold text-slate-600 whitespace-nowrap">المستخدم</th>
                        <th className="py-3 px-4 text-xs font-bold text-slate-600">البيان (التفاصيل)</th>
                        <th className="py-3 px-4 text-xs font-bold text-slate-600 text-left whitespace-nowrap">التغير بالكمية</th>
                        <th className="py-3 px-4 text-xs font-bold text-slate-600 text-left whitespace-nowrap">الرصيد بعد الحركة</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 bg-white">
                      {getMockItemHistory(selectedHistoryItem).map((log) => (
                        <tr key={log.id} className="hover:bg-slate-50/70 transition-colors group">
                          <td className="py-3 px-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-slate-700">
                              {log.date.toLocaleDateString('en-GB')}
                            </div>
                            <div className="text-[10px] text-slate-400 mt-0.5">
                              {log.date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                            </div>
                          </td>
                          <td className="py-3 px-4 whitespace-nowrap">
                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-bold ${
                              log.type === 'IN' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' :
                              log.type === 'OUT' ? 'bg-rose-50 text-rose-700 border border-rose-100' :
                              'bg-indigo-50 text-indigo-700 border border-indigo-100'
                            }`}>
                              {log.type === 'IN' && <TrendingUp className="w-3.5 h-3.5" />}
                              {log.type === 'OUT' && <TrendingDown className="w-3.5 h-3.5" />}
                              {log.type === 'ADJ' && <Edit2 className="w-3.5 h-3.5" />}
                              {log.operation}
                            </span>
                          </td>
                          <td className="py-3 px-4 whitespace-nowrap">
                            <div className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                              <div className="w-5 h-5 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 font-bold uppercase text-[9px]">
                                {log.user.substring(0,2)}
                              </div>
                              {log.user}
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            <div className="text-xs text-slate-600">{log.note}</div>
                          </td>
                          <td className="py-3 px-4 text-left whitespace-nowrap">
                            <span className={`text-sm font-black ${
                              log.qtyChange > 0 ? 'text-emerald-600' :
                              log.qtyChange < 0 ? 'text-rose-600' :
                              'text-slate-600'
                            }`} dir="ltr">
                              {log.qtyChange > 0 ? '+' : ''}{log.qtyChange}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-left whitespace-nowrap">
                            <span className="text-sm font-black text-slate-800">
                              {log.balanceAfter}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
            
            {/* Modal Footer */}
            <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex justify-end">
              <button
                onClick={() => {
                  setIsHistoryModalOpen(false);
                  setSelectedHistoryItem(null);
                }}
                className="px-5 py-2.5 bg-white border border-slate-300 text-slate-700 font-bold text-sm rounded-xl hover:bg-slate-50 transition-colors shadow-xs"
              >
                إغلاق
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

function ArrowLeftIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M19 12H5M12 19l-7-7 7-7" />
    </svg>
  );
}
