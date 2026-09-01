import React, { useState, useMemo, useRef, useEffect } from 'react';
import {
  Package,
  Building2,
  ArrowDownLeft,
  ArrowUpRight,
  Repeat,
  Search,
  Filter,
  Plus,
  Minus,
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
} from 'lucide-react';
import {
  InventoryItem,
  Warehouse,
  StockMovement,
  JournalEntry,
  Currency,
} from '../types/accounting';
import { ItemModal } from './inventory/ItemModal';
import { WarehouseModal } from './inventory/WarehouseModal';
import { StockMovementModal } from './inventory/StockMovementModal';
import { CsvImportModal } from './inventory/CsvImportModal';
import { ItemBarcodeLabelModal } from './inventory/ItemBarcodeLabelModal';
import { SmartInventoryAlertsCard } from './SmartInventoryAlertsCard';
import { HighlightedText } from './common/HighlightedText';
import { searchAndRankItems } from '../utils/searchEngine';

interface InventoryManagementViewProps {
  items: InventoryItem[];
  setItems: React.Dispatch<React.SetStateAction<InventoryItem[]>>;
  warehouses: Warehouse[];
  setWarehouses: React.Dispatch<React.SetStateAction<Warehouse[]>>;
  movements: StockMovement[];
  setMovements: React.Dispatch<React.SetStateAction<StockMovement[]>>;
  onAddJournalEntry: (entry: JournalEntry) => void;
  onNavigateToGeneralLedger?: () => void;
  currency?: Currency;
  rates?: Record<Currency, number>;
}

export const InventoryManagementView: React.FC<InventoryManagementViewProps> = ({
  items,
  setItems,
  warehouses,
  setWarehouses,
  movements,
  setMovements,
  onAddJournalEntry,
  onNavigateToGeneralLedger,
  currency = 'YER',
  rates = { YER: 1, USD: 535, SAR: 142 },
}) => {
  // Navigation tab
  const [activeTab, setActiveTab] = useState<'ITEMS' | 'WAREHOUSES' | 'MOVEMENTS'>('ITEMS');

  // Search and filters
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [selectedWarehouse, setSelectedWarehouse] = useState<string>('ALL');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');

  // Live Sorting state
  const [sortField, setSortField] = useState<'code' | 'nameAr' | 'category' | 'warehouseId' | 'quantity' | 'salePrice' | 'costPrice' | 'margin' | 'status'>('code');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  // Pagination for items
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState<number>(25);

  // Search input ref for keyboard shortcut
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Keyboard shortcut listener for instantaneous focus (/ or F2 or Ctrl+F)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // If user is already typing in an input or textarea, don't hijack unless it's F2 or Ctrl+K
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

  // Modal states
  const [isItemModalOpen, setIsItemModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);

  const [isWarehouseModalOpen, setIsWarehouseModalOpen] = useState(false);
  const [editingWarehouse, setEditingWarehouse] = useState<Warehouse | null>(null);

  const [isMovementModalOpen, setIsMovementModalOpen] = useState(false);
  const [isCsvModalOpen, setIsCsvModalOpen] = useState(false);
  const [isLabelModalOpen, setIsLabelModalOpen] = useState(false);
  const [selectedItemForLabel, setSelectedItemForLabel] = useState<InventoryItem | null>(null);

  // Quick live inline quantity adjustment (+1 or -1 or custom)
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

  // Categories list and live counts derived from items
  const categories = useMemo(() => {
    const set = new Set(items.map((i) => i.category));
    return Array.from(set).filter(Boolean);
  }, [items]);

  // Live status counts
  const liveStatusCounts = useMemo(() => {
    let available = 0;
    let lowStock = 0;
    let outOfStock = 0;

    items.forEach((item) => {
      if (item.quantity <= 0) {
        outOfStock++;
      } else if (item.quantity <= item.minStockLevel) {
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

  // Toggle sort handler
  const handleSort = (field: typeof sortField) => {
    if (sortField === field) {
      setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  // Live Filtered & Sorted items
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
      const matchesWarehouse = selectedWarehouse === 'ALL' || item.warehouseId === selectedWarehouse;
      const matchesStatus =
        selectedStatus === 'ALL' ||
        (selectedStatus === 'LOW_STOCK' && item.quantity > 0 && item.quantity <= item.minStockLevel) ||
        (selectedStatus === 'OUT_OF_STOCK' && item.quantity <= 0) ||
        (selectedStatus === 'AVAILABLE' && item.quantity > item.minStockLevel);

      return matchesSearch && matchesCategory && matchesWarehouse && matchesStatus;
    });

    // Apply Live Sorting
    return filtered.sort((a, b) => {
      let comparison = 0;
      if (sortField === 'code') {
        comparison = a.code.localeCompare(b.code, undefined, { numeric: true });
      } else if (sortField === 'nameAr') {
        comparison = a.nameAr.localeCompare(b.nameAr, 'ar');
      } else if (sortField === 'category') {
        comparison = a.category.localeCompare(b.category, 'ar');
      } else if (sortField === 'warehouseId') {
        comparison = (a.warehouseId || '').localeCompare(b.warehouseId || '');
      } else if (sortField === 'quantity') {
        comparison = a.quantity - b.quantity;
      } else if (sortField === 'salePrice') {
        comparison = a.salePrice - b.salePrice;
      } else if (sortField === 'costPrice') {
        comparison = a.costPrice - b.costPrice;
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

  // Live Summary of currently filtered records
  const filteredSummary = useMemo(() => {
    let units = 0;
    let costVal = 0;
    let saleVal = 0;

    filteredItems.forEach((it) => {
      units += it.quantity;
      costVal += it.quantity * it.costPrice;
      saleVal += it.quantity * it.salePrice;
    });

    const profitVal = saleVal - costVal;
    const avgMarginPct = saleVal > 0 ? (profitVal / saleVal) * 100 : 0;

    return {
      units,
      costVal,
      saleVal,
      profitVal,
      avgMarginPct,
    };
  }, [filteredItems]);

  // Paginated items
  const totalPages = Math.ceil(filteredItems.length / itemsPerPage) || 1;
  const paginatedItems = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredItems.slice(start, start + itemsPerPage);
  }, [filteredItems, currentPage, itemsPerPage]);

  // Overall KPIs
  const totalItemCount = items.length;
  const totalStockValue = useMemo(() => {
    return items.reduce((sum, item) => sum + item.quantity * item.costPrice, 0);
  }, [items]);

  const lowStockCount = useMemo(() => {
    return items.filter((it) => it.quantity > 0 && it.quantity <= it.minStockLevel).length;
  }, [items]);

  const outOfStockCount = useMemo(() => {
    return items.filter((it) => it.quantity <= 0).length;
  }, [items]);

  // Item actions
  const handleSaveItem = (itemToSave: InventoryItem) => {
    if (editingItem) {
      setItems((prev) => prev.map((it) => (it.id === itemToSave.id ? itemToSave : it)));
    } else {
      setItems((prev) => [itemToSave, ...prev]);
    }
    setEditingItem(null);
  };

  const handleDeleteItem = (id: string) => {
    if (window.confirm('هل أنت متأكد من رغبتك في حذف هذا الصنف من قاعدة البيانات؟')) {
      setItems((prev) => prev.filter((it) => it.id !== id));
    }
  };

  // Warehouse actions
  const handleSaveWarehouse = (whToSave: Warehouse) => {
    if (editingWarehouse) {
      setWarehouses((prev) => prev.map((w) => (w.id === whToSave.id ? whToSave : w)));
    } else {
      setWarehouses((prev) => [...prev, whToSave]);
    }
    setEditingWarehouse(null);
  };

  // Movement & Auto Journal Entry action
  const handleSaveMovement = (movement: StockMovement, autoEntry?: JournalEntry) => {
    setMovements((prev) => [movement, ...prev]);

    // Update quantities of items
    setItems((prevItems) => {
      return prevItems.map((item) => {
        const line = movement.lines.find((l) => l.itemId === item.id || l.itemCode === item.code);
        if (!line) return item;

        let newQty = item.quantity;
        if (movement.type === 'GOODS_RECEIPT') {
          newQty += line.quantity;
        } else if (movement.type === 'GOODS_ISSUE') {
          newQty = Math.max(0, newQty - line.quantity);
        }

        let newStatus = item.status;
        if (newQty <= 0) newStatus = 'نفذت الكمية';
        else if (newQty <= item.minStockLevel) newStatus = 'منخفض';
        else newStatus = 'متوفر';

        return {
          ...item,
          quantity: newQty,
          status: newStatus,
          lastUpdated: new Date().toISOString().split('T')[0],
        };
      });
    });

    // If a Journal Entry was generated, push it into General Ledger
    if (autoEntry) {
      onAddJournalEntry(autoEntry);
    }
  };

  // CSV Bulk Import Action
  const handleImportItems = (newItems: InventoryItem[], mergeMode: 'REPLACE' | 'APPEND') => {
    if (mergeMode === 'REPLACE') {
      setItems(newItems);
    } else {
      // Append / Merge: update existing by code or insert new
      setItems((prev) => {
        const itemMap = new Map<string, InventoryItem>();
        prev.forEach((it) => itemMap.set(it.code, it));
        newItems.forEach((it) => itemMap.set(it.code, it));
        return Array.from(itemMap.values());
      });
    }
    setCurrentPage(1);
  };

  // Export visible items to CSV
  const handleExportCsv = () => {
    const headers = ['item_code', 'item_name', 'sale_price', 'cost_price', 'quantity', 'unit', 'category', 'status'];
    const rows = filteredItems.map((i) => [
      `"${i.code}"`,
      `"${i.nameAr.replace(/"/g, '""')}"`,
      i.salePrice,
      i.costPrice,
      i.quantity,
      `"${i.unit}"`,
      `"${i.category}"`,
      `"${i.status}"`,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `inventory_export_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Header & Main Actions */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-blue-600/10 text-blue-600 flex items-center justify-center">
              <Package className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900">
                إدارة المخزون والمستودعات (SAP MM / SCM)
              </h1>
              <p className="text-xs text-slate-500">
                كتالوج المواد، بطاقات الأصناف، حركات الصادر والوارد، والربط المحاسبي التلقائي
              </p>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={() => {
              setSelectedItemForLabel(null);
              setIsLabelModalOpen(true);
            }}
            className="flex items-center gap-2 px-3.5 py-2 text-xs font-bold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-xl transition shadow-2xs"
            title="طباعة كروت تعريف الأصناف وملصقات الباركود والأسعار بتنسيق PDF"
          >
            <Tag className="w-4 h-4 text-blue-600" />
            <span>طباعة كروت الباركود (PDF)</span>
          </button>

          <button
            onClick={() => setIsCsvModalOpen(true)}
            className="flex items-center gap-2 px-3.5 py-2 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-200/80 rounded-xl transition"
          >
            <UploadCloud className="w-4 h-4 text-slate-600" />
            استيراد CSV
          </button>

          <button
            onClick={handleExportCsv}
            className="flex items-center gap-2 px-3.5 py-2 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-200/80 rounded-xl transition"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
            تصدير Excel
          </button>

          <button
            onClick={() => setIsMovementModalOpen(true)}
            className="flex items-center gap-2 px-3.5 py-2 text-xs font-bold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 rounded-xl transition"
          >
            <Repeat className="w-4 h-4" />
            حركة مخزنية (MIGO)
          </button>

          <button
            onClick={() => {
              setEditingItem(null);
              setIsItemModalOpen(true);
            }}
            className="flex items-center gap-2 px-4 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-xs transition"
          >
            <Plus className="w-4 h-4" />
            إضافة صنف جديد
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-500">إجمالي الأصناف المعرفة</span>
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <Layers className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-slate-900 font-mono">
            {totalItemCount.toLocaleString('en-US')}
          </div>
          <div className="text-[11px] text-slate-500 mt-1 flex items-center gap-1">
            <span className="font-semibold text-blue-600">{categories.length}</span> تصنيفات مخزنية
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-500">القيمة التقديرية للمخزون</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-slate-900 font-mono">
            {totalStockValue.toLocaleString('en-US', { maximumFractionDigits: 0 })} <span className="text-xs font-normal text-slate-500">YER</span>
          </div>
          <div className="text-[11px] text-emerald-600 font-medium mt-1 flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5" />
            مطابق للأستاذ العام (ح/ 1130)
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-500">المستودعات والمراكز</span>
            <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <Building2 className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-slate-900 font-mono">
            {warehouses.length}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            {warehouses.filter((w) => w.isActive).length} مستودع نشط تشغيلياً
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-500">تنبيهات انخفاض المخزون</span>
            <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-amber-600 font-mono">
            {lowStockCount + outOfStockCount}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            {lowStockCount} أوشك على النفاد | {outOfStockCount} رصيد صفري
          </div>
        </div>
      </div>

      {/* Smart Inventory Alerts Banner */}
      <SmartInventoryAlertsCard
        items={items}
        currency={currency}
      />

      {/* Tabs Bar */}
      <div className="flex items-center justify-between border-b border-slate-200 bg-white px-4 rounded-t-2xl">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab('ITEMS')}
            className={`flex items-center gap-2 py-3.5 px-4 text-xs font-bold border-b-2 transition ${
              activeTab === 'ITEMS'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <Package className="w-4 h-4" />
            دليل وبطاقات الأصناف ({items.length})
          </button>

          <button
            onClick={() => setActiveTab('WAREHOUSES')}
            className={`flex items-center gap-2 py-3.5 px-4 text-xs font-bold border-b-2 transition ${
              activeTab === 'WAREHOUSES'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <Building2 className="w-4 h-4" />
            المستودعات والمواقع ({warehouses.length})
          </button>

          <button
            onClick={() => setActiveTab('MOVEMENTS')}
            className={`flex items-center gap-2 py-3.5 px-4 text-xs font-bold border-b-2 transition ${
              activeTab === 'MOVEMENTS'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <Repeat className="w-4 h-4" />
            سجل حركات المخزن (MIGO) ({movements.length})
          </button>
        </div>

        {activeTab === 'ITEMS' && (
          <span className="text-xs text-slate-500 font-mono">
            عرض {paginatedItems.length} من أصل {filteredItems.length} صنف مطابقة
          </span>
        )}
      </div>

      {/* Tab 1: ITEMS CATALOG (LIVE INTERACTIVE TABLE & SEARCH) */}
      {activeTab === 'ITEMS' && (
        <div className="bg-white rounded-b-2xl border border-t-0 border-slate-200 p-6 space-y-5 shadow-2xs">
          {/* Live Search & Quick Filter Stream Bar */}
          <div className="bg-slate-900 text-white p-4 rounded-2xl shadow-sm border border-slate-800 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="flex h-2.5 w-2.5 relative">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                </span>
                <h4 className="text-xs sm:text-sm font-black text-amber-400 flex items-center gap-1.5">
                  <Zap className="w-4 h-4 text-amber-400" />
                  شريط البحث المباشر وجدول الأصناف التفاعلي (Live Inventory Stream)
                </h4>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-mono bg-slate-800 text-emerald-400 px-2.5 py-0.5 rounded-full border border-slate-700">
                  ⚡ نتائج فورية: {filteredItems.length} من أصل {items.length} صنف
                </span>
                <span className="hidden sm:inline-flex items-center gap-1 text-[10px] text-slate-400">
                  اضغط <kbd className="bg-slate-800 text-amber-300 px-1.5 py-0.5 rounded text-[10px] font-mono border border-slate-700">/</kbd> أو <kbd className="bg-slate-800 text-amber-300 px-1.5 py-0.5 rounded text-[10px] font-mono border border-slate-700">F2</kbd> للتركيز
                </span>
              </div>
            </div>

            {/* Main Live Search Input & Dropdowns */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-2.5">
              {/* Live Search Input */}
              <div className="lg:col-span-6 relative">
                <Search className="w-4 h-4 absolute right-3.5 top-3 text-slate-400" />
                <input
                  ref={searchInputRef}
                  type="text"
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setCurrentPage(1);
                  }}
                  placeholder="ابحث فورياً برمز الصنف، الاسم، التصنيف، المستودع..."
                  className="w-full pr-10 pl-9 py-2.5 text-xs bg-slate-800/90 text-white placeholder:text-slate-400 border border-slate-700 rounded-xl focus:ring-2 focus:ring-amber-400 focus:border-amber-400 font-bold transition"
                />
                {searchTerm && (
                  <button
                    type="button"
                    onClick={() => {
                      setSearchTerm('');
                      setCurrentPage(1);
                      searchInputRef.current?.focus();
                    }}
                    className="absolute left-3 top-2.5 text-slate-400 hover:text-white p-0.5 rounded transition cursor-pointer"
                    title="مسح البحث"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>

              {/* Warehouse Filter */}
              <div className="lg:col-span-3">
                <select
                  value={selectedWarehouse}
                  onChange={(e) => {
                    setSelectedWarehouse(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="w-full px-3 py-2.5 text-xs bg-slate-800 text-slate-200 border border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-hidden font-bold"
                >
                  <option value="ALL">🏢 كافة المستودعات والمواقع</option>
                  {warehouses.map((w) => (
                    <option key={w.id} value={w.id}>
                      {w.nameAr} ({w.code})
                    </option>
                  ))}
                </select>
              </div>

              {/* Category Filter */}
              <div className="lg:col-span-3">
                <select
                  value={selectedCategory}
                  onChange={(e) => {
                    setSelectedCategory(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="w-full px-3 py-2.5 text-xs bg-slate-800 text-slate-200 border border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-hidden font-bold"
                >
                  <option value="ALL">📦 كافة التصنيفات المخزنية</option>
                  {categories.map((c) => (
                    <option key={c} value={c}>
                      {c} ({liveCategoryCounts[c] || 0})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Quick Live Status Badges Filter */}
            <div className="flex items-center gap-2 pt-1 overflow-x-auto scrollbar-none text-xs">
              <span className="text-[11px] text-slate-400 font-bold shrink-0">حالة التوفر:</span>
              <button
                type="button"
                onClick={() => {
                  setSelectedStatus('ALL');
                  setCurrentPage(1);
                }}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition flex items-center gap-1.5 shrink-0 cursor-pointer ${
                  selectedStatus === 'ALL'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
                }`}
              >
                <span>الكل</span>
                <span className="px-1.5 py-0.2 rounded-full bg-slate-900/60 font-mono text-[10px]">
                  {liveStatusCounts.ALL}
                </span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setSelectedStatus('AVAILABLE');
                  setCurrentPage(1);
                }}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition flex items-center gap-1.5 shrink-0 cursor-pointer ${
                  selectedStatus === 'AVAILABLE'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
                }`}
              >
                <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                <span>متوفر كافٍ</span>
                <span className="px-1.5 py-0.2 rounded-full bg-slate-900/60 font-mono text-[10px]">
                  {liveStatusCounts.AVAILABLE}
                </span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setSelectedStatus('LOW_STOCK');
                  setCurrentPage(1);
                }}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition flex items-center gap-1.5 shrink-0 cursor-pointer ${
                  selectedStatus === 'LOW_STOCK'
                    ? 'bg-amber-600 text-white shadow-xs'
                    : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
                }`}
              >
                <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse"></span>
                <span>منخفض (تحت حد الطلب)</span>
                <span className="px-1.5 py-0.2 rounded-full bg-slate-900/60 font-mono text-[10px]">
                  {liveStatusCounts.LOW_STOCK}
                </span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setSelectedStatus('OUT_OF_STOCK');
                  setCurrentPage(1);
                }}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition flex items-center gap-1.5 shrink-0 cursor-pointer ${
                  selectedStatus === 'OUT_OF_STOCK'
                    ? 'bg-rose-600 text-white shadow-xs'
                    : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
                }`}
              >
                <span className="w-2 h-2 rounded-full bg-rose-400 animate-ping"></span>
                <span>نفذ المخزون (0)</span>
                <span className="px-1.5 py-0.2 rounded-full bg-slate-900/60 font-mono text-[10px]">
                  {liveStatusCounts.OUT_OF_STOCK}
                </span>
              </button>
            </div>
          </div>

          {/* Live Interactive Table Header & Page Controls */}
          <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2">
              <span className="font-bold text-slate-700">ترتيب الجدول حسب:</span>
              <span className="font-black text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                {sortField === 'code' && 'رمز الصنف'}
                {sortField === 'nameAr' && 'اسم الصنف'}
                {sortField === 'category' && 'التصنيف'}
                {sortField === 'warehouseId' && 'المستودع'}
                {sortField === 'quantity' && 'الكمية'}
                {sortField === 'salePrice' && 'سعر البيع'}
                {sortField === 'costPrice' && 'التكلفة'}
                {sortField === 'margin' && 'هامش الربح %'}
                {sortField === 'status' && 'الحالة'}
                {' '}({sortDirection === 'asc' ? 'تصاعدي ↑' : 'تنازلي ↓'})
              </span>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-slate-500 font-bold">عدد السجلات لكل صفحة:</span>
              <select
                value={itemsPerPage}
                onChange={(e) => {
                  setItemsPerPage(Number(e.target.value));
                  setCurrentPage(1);
                }}
                className="px-2.5 py-1 text-xs font-bold rounded-lg border border-slate-300 bg-white focus:outline-hidden focus:ring-1 focus:ring-blue-500"
              >
                <option value={10}>10 أصناف</option>
                <option value={25}>25 صنف</option>
                <option value={50}>50 صنف</option>
                <option value={100}>100 صنف</option>
                <option value={9999}>عرض كافة الأصناف</option>
              </select>
            </div>
          </div>

          {/* Live Items Table */}
          <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-xs bg-white">
            <div className="overflow-x-auto">
              <table className="w-full text-right text-xs">
                <thead className="bg-slate-100/80 text-slate-700 font-bold border-b border-slate-200 select-none">
                  <tr>
                    {/* Code Column */}
                    <th
                      onClick={() => handleSort('code')}
                      className="p-3 w-20 text-center cursor-pointer hover:bg-slate-200 transition"
                      title="انقر للترتيب حسب الرمز"
                    >
                      <div className="flex items-center justify-center gap-1">
                        <span>الرمز</span>
                        {sortField === 'code' ? (
                          sortDirection === 'asc' ? <ArrowUp className="w-3.5 h-3.5 text-blue-600" /> : <ArrowDown className="w-3.5 h-3.5 text-blue-600" />
                        ) : (
                          <ArrowUpDown className="w-3 h-3 text-slate-400" />
                        )}
                      </div>
                    </th>

                    {/* Name Column */}
                    <th
                      onClick={() => handleSort('nameAr')}
                      className="p-3 cursor-pointer hover:bg-slate-200 transition"
                      title="انقر للترتيب حسب الاسم"
                    >
                      <div className="flex items-center gap-1">
                        <span>اسم ومواصفات الصنف</span>
                        {sortField === 'nameAr' ? (
                          sortDirection === 'asc' ? <ArrowUp className="w-3.5 h-3.5 text-blue-600" /> : <ArrowDown className="w-3.5 h-3.5 text-blue-600" />
                        ) : (
                          <ArrowUpDown className="w-3 h-3 text-slate-400" />
                        )}
                      </div>
                    </th>

                    {/* Category Column */}
                    <th
                      onClick={() => handleSort('category')}
                      className="p-3 cursor-pointer hover:bg-slate-200 transition"
                      title="انقر للترتيب حسب التصنيف"
                    >
                      <div className="flex items-center gap-1">
                        <span>التصنيف</span>
                        {sortField === 'category' ? (
                          sortDirection === 'asc' ? <ArrowUp className="w-3.5 h-3.5 text-blue-600" /> : <ArrowDown className="w-3.5 h-3.5 text-blue-600" />
                        ) : (
                          <ArrowUpDown className="w-3 h-3 text-slate-400" />
                        )}
                      </div>
                    </th>

                    {/* Warehouse Column */}
                    <th
                      onClick={() => handleSort('warehouseId')}
                      className="p-3 cursor-pointer hover:bg-slate-200 transition"
                      title="انقر للترتيب حسب المستودع"
                    >
                      <div className="flex items-center gap-1">
                        <span>المستودع</span>
                        {sortField === 'warehouseId' ? (
                          sortDirection === 'asc' ? <ArrowUp className="w-3.5 h-3.5 text-blue-600" /> : <ArrowDown className="w-3.5 h-3.5 text-blue-600" />
                        ) : (
                          <ArrowUpDown className="w-3 h-3 text-slate-400" />
                        )}
                      </div>
                    </th>

                    {/* Quantity & Meter Column */}
                    <th
                      onClick={() => handleSort('quantity')}
                      className="p-3 text-center cursor-pointer hover:bg-slate-200 transition min-w-[140px]"
                      title="انقر للترتيب حسب الكمية"
                    >
                      <div className="flex items-center justify-center gap-1">
                        <span>الرصيد الحي ومقياس التوفر</span>
                        {sortField === 'quantity' ? (
                          sortDirection === 'asc' ? <ArrowUp className="w-3.5 h-3.5 text-blue-600" /> : <ArrowDown className="w-3.5 h-3.5 text-blue-600" />
                        ) : (
                          <ArrowUpDown className="w-3 h-3 text-slate-400" />
                        )}
                      </div>
                    </th>

                    {/* Unit Column */}
                    <th className="p-3 text-center w-14">الوحدة</th>

                    {/* Sale Price Column */}
                    <th
                      onClick={() => handleSort('salePrice')}
                      className="p-3 text-left cursor-pointer hover:bg-slate-200 transition"
                      title="انقر للترتيب حسب سعر البيع"
                    >
                      <div className="flex items-center justify-end gap-1">
                        <span>سعر البيع</span>
                        {sortField === 'salePrice' ? (
                          sortDirection === 'asc' ? <ArrowUp className="w-3.5 h-3.5 text-blue-600" /> : <ArrowDown className="w-3.5 h-3.5 text-blue-600" />
                        ) : (
                          <ArrowUpDown className="w-3 h-3 text-slate-400" />
                        )}
                      </div>
                    </th>

                    {/* Cost Price Column */}
                    <th
                      onClick={() => handleSort('costPrice')}
                      className="p-3 text-left cursor-pointer hover:bg-slate-200 transition"
                      title="انقر للترتيب حسب التكلفة"
                    >
                      <div className="flex items-center justify-end gap-1">
                        <span>التكلفة</span>
                        {sortField === 'costPrice' ? (
                          sortDirection === 'asc' ? <ArrowUp className="w-3.5 h-3.5 text-blue-600" /> : <ArrowDown className="w-3.5 h-3.5 text-blue-600" />
                        ) : (
                          <ArrowUpDown className="w-3 h-3 text-slate-400" />
                        )}
                      </div>
                    </th>

                    {/* Profit Margin % Column */}
                    <th
                      onClick={() => handleSort('margin')}
                      className="p-3 text-center cursor-pointer hover:bg-slate-200 transition"
                      title="انقر للترتيب حسب هامش الربح"
                    >
                      <div className="flex items-center justify-center gap-1">
                        <span>هامش الربح %</span>
                        {sortField === 'margin' ? (
                          sortDirection === 'asc' ? <ArrowUp className="w-3.5 h-3.5 text-blue-600" /> : <ArrowDown className="w-3.5 h-3.5 text-blue-600" />
                        ) : (
                          <ArrowUpDown className="w-3 h-3 text-slate-400" />
                        )}
                      </div>
                    </th>

                    {/* Status Column */}
                    <th
                      onClick={() => handleSort('status')}
                      className="p-3 text-center cursor-pointer hover:bg-slate-200 transition"
                      title="انقر للترتيب حسب الحالة"
                    >
                      <div className="flex items-center justify-center gap-1">
                        <span>الحالة</span>
                        {sortField === 'status' ? (
                          sortDirection === 'asc' ? <ArrowUp className="w-3.5 h-3.5 text-blue-600" /> : <ArrowDown className="w-3.5 h-3.5 text-blue-600" />
                        ) : (
                          <ArrowUpDown className="w-3 h-3 text-slate-400" />
                        )}
                      </div>
                    </th>

                    {/* Actions Column */}
                    <th className="p-3 w-28 text-center">إجراءات سريعة</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {paginatedItems.length === 0 ? (
                    <tr>
                      <td colSpan={11} className="p-12 text-center text-slate-400 bg-slate-50/50">
                        <Package className="w-12 h-12 mx-auto text-slate-300 mb-2" />
                        <p className="font-bold text-slate-600">لا توجد أصناف مطابقة للبحث أو الفلتر المحدد</p>
                        <p className="text-xs text-slate-400 mt-1">جرب تعديل كلمة البحث أو إلغاء تصفية الحالة</p>
                        <button
                          type="button"
                          onClick={() => {
                            setSearchTerm('');
                            setSelectedCategory('ALL');
                            setSelectedWarehouse('ALL');
                            setSelectedStatus('ALL');
                          }}
                          className="mt-3 px-3 py-1.5 bg-blue-50 text-blue-700 font-bold rounded-lg text-xs hover:bg-blue-100 transition"
                        >
                          إعادة تعيين كافة الفلاتر
                        </button>
                      </td>
                    </tr>
                  ) : (
                    paginatedItems.map((item) => {
                      const isLow = item.quantity > 0 && item.quantity <= item.minStockLevel;
                      const isOut = item.quantity <= 0;
                      const wh = warehouses.find((w) => w.id === item.warehouseId);
                      const marginPct = item.salePrice > 0 ? ((item.salePrice - item.costPrice) / item.salePrice) * 100 : 0;
                      const stockRatio = item.minStockLevel > 0 ? Math.min(100, (item.quantity / (item.minStockLevel * 2)) * 100) : item.quantity > 0 ? 100 : 0;

                      return (
                        <tr key={item.id} className="hover:bg-blue-50/40 transition group">
                          {/* Code */}
                          <td className="p-3 text-center font-mono font-bold text-blue-700 bg-slate-50/40 group-hover:bg-blue-100/50 transition">
                            <HighlightedText text={item.code} highlight={searchTerm} />
                          </td>

                          {/* Arabic Name */}
                          <td className="p-3 font-semibold text-slate-900">
                            <div className="flex flex-col">
                              <HighlightedText text={item.nameAr} highlight={searchTerm} className="font-bold text-slate-900" />
                              {item.nameEn && (
                                <span className="text-[10px] text-slate-400 font-sans">
                                  <HighlightedText text={item.nameEn} highlight={searchTerm} />
                                </span>
                              )}
                            </div>
                          </td>

                          {/* Category */}
                          <td className="p-3 text-slate-600">
                            <span className="px-2 py-0.5 rounded-md bg-slate-100 text-[11px] font-medium border border-slate-200">
                              <HighlightedText text={item.category} highlight={searchTerm} />
                            </span>
                          </td>

                          {/* Warehouse */}
                          <td className="p-3 text-slate-600 text-[11px]">
                            <span className="flex items-center gap-1">
                              <Building2 className="w-3 h-3 text-slate-400" />
                              <HighlightedText text={wh?.nameAr || 'المستودع الرئيسي'} highlight={searchTerm} />
                            </span>
                          </td>

                          {/* Quantity with live +/- adjuster and visual bar */}
                          <td className="p-3 text-center font-mono">
                            <div className="flex flex-col items-center gap-1">
                              <div className="flex items-center justify-center gap-1.5">
                                <button
                                  type="button"
                                  onClick={() => handleQuickAdjustQty(item.id, -1)}
                                  className="w-5 h-5 rounded bg-slate-100 hover:bg-rose-100 hover:text-rose-700 text-slate-600 flex items-center justify-center transition font-bold text-xs"
                                  title="إنقاص الكمية -1"
                                >
                                  -
                                </button>
                                <span
                                  className={`px-2 py-0.5 rounded-md font-bold text-xs ${
                                    isOut
                                      ? 'bg-rose-100 text-rose-800'
                                      : isLow
                                      ? 'bg-amber-100 text-amber-800'
                                      : 'bg-emerald-100 text-emerald-800'
                                  }`}
                                >
                                  {item.quantity.toLocaleString('en-US')}
                                </span>
                                <button
                                  type="button"
                                  onClick={() => handleQuickAdjustQty(item.id, 1)}
                                  className="w-5 h-5 rounded bg-slate-100 hover:bg-emerald-100 hover:text-emerald-700 text-slate-600 flex items-center justify-center transition font-bold text-xs"
                                  title="زيادة الكمية +1"
                                >
                                  +
                                </button>
                              </div>
                              {/* Mini Health Bar */}
                              <div className="w-20 bg-slate-200 h-1.5 rounded-full overflow-hidden">
                                <div
                                  className={`h-full rounded-full transition-all duration-300 ${
                                    isOut ? 'bg-rose-500' : isLow ? 'bg-amber-500' : 'bg-emerald-500'
                                  }`}
                                  style={{ width: `${Math.max(5, stockRatio)}%` }}
                                ></div>
                              </div>
                            </div>
                          </td>

                          {/* Unit */}
                          <td className="p-3 text-center text-slate-600 font-bold">{item.unit}</td>

                          {/* Sale Price */}
                          <td className="p-3 text-left font-mono font-bold text-slate-900">
                            {item.salePrice.toLocaleString('en-US', { minimumFractionDigits: 1 })}
                          </td>

                          {/* Cost Price */}
                          <td className="p-3 text-left font-mono text-slate-600">
                            {item.costPrice.toLocaleString('en-US', { minimumFractionDigits: 1 })}
                          </td>

                          {/* Profit Margin % */}
                          <td className="p-3 text-center font-mono">
                            <span
                              className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                                marginPct >= 20
                                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                  : marginPct > 0
                                  ? 'bg-blue-50 text-blue-700 border border-blue-200'
                                  : 'bg-rose-50 text-rose-700 border border-rose-200'
                              }`}
                            >
                              %{marginPct.toFixed(1)}
                            </span>
                          </td>

                          {/* Live Status Badge with pulse indicator */}
                          <td className="p-3 text-center">
                            {isOut ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-bold rounded-full bg-rose-50 text-rose-700 border border-rose-200">
                                <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-ping"></span>
                                نفذت الكمية
                              </span>
                            ) : isLow ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-bold rounded-full bg-amber-50 text-amber-700 border border-amber-200">
                                <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></span>
                                منخفض ({item.minStockLevel})
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-bold rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                                متوفر
                              </span>
                            )}
                          </td>

                          {/* Actions */}
                          <td className="p-3 text-center">
                            <div className="flex items-center justify-center gap-1">
                              <button
                                onClick={() => {
                                  setSelectedItemForLabel(item);
                                  setIsLabelModalOpen(true);
                                }}
                                className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition"
                                title="طباعة كرت تعريف وباركود الصنف (PDF)"
                              >
                                <Tag className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => {
                                  setEditingItem(item);
                                  setIsItemModalOpen(true);
                                }}
                                className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition"
                                title="تعديل بيانات الصنف"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => handleDeleteItem(item.id)}
                                className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
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

                {/* Live Dynamic Table Summary Footer */}
                {filteredItems.length > 0 && (
                  <tfoot className="bg-slate-900 text-white font-bold border-t-2 border-slate-700 text-xs">
                    <tr>
                      <td colSpan={4} className="p-3 text-right">
                        <div className="flex items-center gap-2">
                          <Activity className="w-4 h-4 text-emerald-400" />
                          <span>إجمالي الأصناف المعروضة بالجدول ({filteredItems.length} صنف):</span>
                        </div>
                      </td>
                      <td className="p-3 text-center font-mono text-amber-300">
                        {filteredSummary.units.toLocaleString('en-US')} وحدة
                      </td>
                      <td className="p-3 text-center text-slate-400">-</td>
                      <td className="p-3 text-left font-mono text-emerald-400">
                        {filteredSummary.saleVal.toLocaleString('en-US', { minimumFractionDigits: 1 })} {currency}
                      </td>
                      <td className="p-3 text-left font-mono text-slate-300">
                        {filteredSummary.costVal.toLocaleString('en-US', { minimumFractionDigits: 1 })} {currency}
                      </td>
                      <td className="p-3 text-center font-mono text-amber-300">
                        +{filteredSummary.profitVal.toLocaleString('en-US', { minimumFractionDigits: 0 })} ({filteredSummary.avgMarginPct.toFixed(1)}%)
                      </td>
                      <td colSpan={2} className="p-3 text-center text-[11px] text-slate-400">
                        صافي القيمة التقديرية الحية
                      </td>
                    </tr>
                  </tfoot>
                )}
              </table>
            </div>

            {/* Pagination footer */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between p-3 bg-slate-50 border-t border-slate-200 text-xs">
                <span className="text-slate-500">
                  الصفحة <span className="font-bold text-slate-800">{currentPage}</span> من{' '}
                  <span className="font-bold text-slate-800">{totalPages}</span> (إجمالي {filteredItems.length} صنف)
                </span>
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="px-2.5 py-1.5 rounded-lg border border-slate-200 hover:bg-white disabled:opacity-40 transition flex items-center gap-1 font-bold cursor-pointer"
                  >
                    <ChevronRight className="w-4 h-4" />
                    <span>السابق</span>
                  </button>

                  <div className="flex items-center gap-1">
                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                      const pageNum = i + 1;
                      return (
                        <button
                          key={pageNum}
                          onClick={() => setCurrentPage(pageNum)}
                          className={`w-7 h-7 rounded-lg font-bold text-xs transition cursor-pointer ${
                            currentPage === pageNum
                              ? 'bg-blue-600 text-white shadow-xs'
                              : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
                          }`}
                        >
                          {pageNum}
                        </button>
                      );
                    })}
                    {totalPages > 5 && <span className="text-slate-400">...</span>}
                  </div>

                  <button
                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    className="px-2.5 py-1.5 rounded-lg border border-slate-200 hover:bg-white disabled:opacity-40 transition flex items-center gap-1 font-bold cursor-pointer"
                  >
                    <span>التالي</span>
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tab 2: WAREHOUSES */}
      {activeTab === 'WAREHOUSES' && (
        <div className="bg-white rounded-b-2xl border border-t-0 border-slate-200 p-6 space-y-6 shadow-2xs">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-900">مستودعات الشركة والمواقع اللوجستية</h3>
              <p className="text-xs text-slate-500">توزيع المخزون السلعي ومسؤولو الفروع ونسب الإشغال</p>
            </div>
            <button
              onClick={() => {
                setEditingWarehouse(null);
                setIsWarehouseModalOpen(true);
              }}
              className="flex items-center gap-2 px-3.5 py-1.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition"
            >
              <Plus className="w-4 h-4" />
              تعريف مستودع جديد
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {warehouses.map((wh) => {
              const whItems = items.filter((it) => it.warehouseId === wh.id);
              const whStockVal = whItems.reduce((acc, it) => acc + it.quantity * it.costPrice, 0);

              return (
                <div
                  key={wh.id}
                  className="bg-slate-50/60 rounded-2xl border border-slate-200/80 p-5 space-y-4 hover:shadow-md hover:border-blue-300 transition"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="w-10 h-10 rounded-xl bg-blue-600/10 text-blue-600 flex items-center justify-center font-mono font-bold text-xs">
                        {wh.code.slice(0, 3)}
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-slate-900">{wh.nameAr}</h4>
                        <span className="font-mono text-[11px] text-blue-600 font-semibold">
                          {wh.code}
                        </span>
                      </div>
                    </div>
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        wh.isActive
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : 'bg-slate-200 text-slate-600'
                      }`}
                    >
                      {wh.isActive ? 'نشط' : 'متوقف'}
                    </span>
                  </div>

                  <div className="space-y-2 text-xs text-slate-600 pt-2 border-t border-slate-200/60">
                    <div className="flex justify-between">
                      <span className="text-slate-400">الموقع / العنوان:</span>
                      <span className="font-medium text-slate-800">{wh.location || 'المقر الرئيسي'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">أمين المستودع:</span>
                      <span className="font-medium text-slate-800">{wh.manager || 'غير محدد'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">حساب الأستاذ العام:</span>
                      <span className="font-mono text-blue-600 font-bold">{wh.accountCode} (المخزون)</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">عدد الأصناف المخزنة:</span>
                      <span className="font-mono font-bold text-slate-900">{whItems.length} صنف</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">إجمالي قيمة المخزون:</span>
                      <span className="font-mono font-bold text-emerald-700">
                        {whStockVal.toLocaleString('en-US', { maximumFractionDigits: 0 })} YER
                      </span>
                    </div>
                  </div>

                  {/* Capacity Bar */}
                  <div className="space-y-1.5 pt-1">
                    <div className="flex justify-between text-[11px]">
                      <span className="text-slate-500">نسبة إشغال المستودع:</span>
                      <span className="font-bold text-slate-800">{wh.capacityPercent}%</span>
                    </div>
                    <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full ${
                          wh.capacityPercent > 85
                            ? 'bg-rose-500'
                            : wh.capacityPercent > 65
                            ? 'bg-amber-500'
                            : 'bg-blue-600'
                        }`}
                        style={{ width: `${wh.capacityPercent}%` }}
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200/60">
                    <button
                      onClick={() => {
                        setEditingWarehouse(wh);
                        setIsWarehouseModalOpen(true);
                      }}
                      className="px-3 py-1 text-xs font-bold text-blue-600 hover:bg-blue-50 rounded-lg transition"
                    >
                      تعديل البيانات
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Tab 3: STOCK MOVEMENTS (MIGO) */}
      {activeTab === 'MOVEMENTS' && (
        <div className="bg-white rounded-b-2xl border border-t-0 border-slate-200 p-6 space-y-5 shadow-2xs">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                سجل حركات المخزن وتكامل القيود اليومية (MIGO)
              </h3>
              <p className="text-xs text-slate-500">
                أوامر التوريد، أذون الصرف، والمناقلات المخزنية المرتبطة مباشرة بحسابات الأستاذ العام
              </p>
            </div>
            <button
              onClick={() => setIsMovementModalOpen(true)}
              className="flex items-center gap-2 px-3.5 py-1.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition"
            >
              <Plus className="w-4 h-4" />
              تسجيل حركة جديدة
            </button>
          </div>

          <div className="border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
            <div className="overflow-x-auto">
              <table className="w-full text-right text-xs">
                <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200">
                  <tr>
                    <th className="p-3 w-32">رقم المستند</th>
                    <th className="p-3 w-28">النوع</th>
                    <th className="p-3 w-24">التاريخ</th>
                    <th className="p-3">المستودع</th>
                    <th className="p-3">البيان والتفاصيل</th>
                    <th className="p-3 text-center">عدد البنود</th>
                    <th className="p-3 text-left">إجمالي القيمة (YER)</th>
                    <th className="p-3 text-center">القيد المحاسبي</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {movements.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="p-8 text-center text-slate-400">
                        لم يتم تسجيل حركات مخزنية بعد
                      </td>
                    </tr>
                  ) : (
                    movements.map((mov) => {
                      const wh = warehouses.find((w) => w.id === mov.warehouseId);
                      const toWh = mov.toWarehouseId ? warehouses.find((w) => w.id === mov.toWarehouseId) : null;

                      return (
                        <tr key={mov.id} className="hover:bg-slate-50/70 transition">
                          <td className="p-3 font-mono font-bold text-blue-700">
                            {mov.movementNumber}
                          </td>
                          <td className="p-3">
                            {mov.type === 'GOODS_RECEIPT' ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 text-[10px] font-bold rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                                <ArrowDownLeft className="w-3 h-3" /> وارد (GR 101)
                              </span>
                            ) : mov.type === 'GOODS_ISSUE' ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 text-[10px] font-bold rounded-full bg-amber-50 text-amber-700 border border-amber-200">
                                <ArrowUpRight className="w-3 h-3" /> صادر (GI 201)
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 text-[10px] font-bold rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                                <Repeat className="w-3 h-3" /> مناقلة (TR 301)
                              </span>
                            )}
                          </td>
                          <td className="p-3 font-mono text-slate-600">{mov.date}</td>
                          <td className="p-3 text-slate-700 font-medium">
                            {mov.type === 'TRANSFER'
                              ? `${wh?.nameAr || 'المصدر'} ⬅️ ${toWh?.nameAr || 'الوجهة'}`
                              : wh?.nameAr || 'المستودع الرئيسي'}
                          </td>
                          <td className="p-3 text-slate-600">
                            <div>{mov.description}</div>
                            {mov.reference && (
                              <span className="text-[10px] font-mono text-slate-400">مرجع: {mov.reference}</span>
                            )}
                          </td>
                          <td className="p-3 text-center font-mono font-bold text-slate-800">
                            {mov.lines.length}
                          </td>
                          <td className="p-3 text-left font-mono font-bold text-slate-900">
                            {mov.totalAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                          </td>
                          <td className="p-3 text-center">
                            {mov.journalEntryId ? (
                              <button
                                onClick={onNavigateToGeneralLedger}
                                className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-mono font-bold rounded-md bg-indigo-50 text-indigo-700 hover:bg-indigo-100 transition"
                                title="انقر لعرض القيود اليومية في دفتر الأستاذ"
                              >
                                {mov.journalEntryId.slice(0, 14)}
                                <ExternalLink className="w-3 h-3" />
                              </button>
                            ) : (
                              <span className="text-slate-400 text-[10px]">-</span>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Modals */}
      <ItemModal
        isOpen={isItemModalOpen}
        onClose={() => {
          setIsItemModalOpen(false);
          setEditingItem(null);
        }}
        onSave={handleSaveItem}
        editItem={editingItem}
        warehouses={warehouses}
      />

      <WarehouseModal
        isOpen={isWarehouseModalOpen}
        onClose={() => {
          setIsWarehouseModalOpen(false);
          setEditingWarehouse(null);
        }}
        onSave={handleSaveWarehouse}
        editWarehouse={editingWarehouse}
      />

      <StockMovementModal
        isOpen={isMovementModalOpen}
        onClose={() => setIsMovementModalOpen(false)}
        items={items}
        warehouses={warehouses}
        onSaveMovement={handleSaveMovement}
      />

      <CsvImportModal
        isOpen={isCsvModalOpen}
        onClose={() => setIsCsvModalOpen(false)}
        onImportItems={handleImportItems}
        currentWarehouseId={warehouses[0]?.id || 'WH-01'}
      />

      {/* Item Barcode & Label Print Modal */}
      <ItemBarcodeLabelModal
        isOpen={isLabelModalOpen}
        onClose={() => {
          setIsLabelModalOpen(false);
          setSelectedItemForLabel(null);
        }}
        items={items}
        warehouses={warehouses}
        initialSelectedItem={selectedItemForLabel}
        currency={currency}
        rates={rates}
      />
    </div>
  );
};
