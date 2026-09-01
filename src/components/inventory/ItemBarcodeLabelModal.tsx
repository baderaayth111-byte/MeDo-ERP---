import React, { useState, useMemo, useRef } from 'react';
import {
  X,
  Printer,
  FileDown,
  Tag,
  Layers,
  Settings2,
  Eye,
  CheckSquare,
  Square,
  Search,
  Grid,
  CreditCard,
  QrCode,
  Building,
  CheckCircle2,
  Sparkles
} from 'lucide-react';
import { InventoryItem, Warehouse, Currency } from '../../types/accounting';
import { formatCurrency, convertAmount } from '../../utils/formatters';
import { Barcode } from './BarcodeGenerator';

interface ItemBarcodeLabelModalProps {
  isOpen: boolean;
  onClose: () => void;
  items: InventoryItem[];
  warehouses: Warehouse[];
  initialSelectedItem?: InventoryItem | null;
  currency?: Currency;
  rates?: Record<Currency, number>;
}

type LabelTemplate = 'SHELF_TAG' | 'COMPACT_STICKER' | 'DETAILED_CARD' | 'JEWELRY_TAG';

export const ItemBarcodeLabelModal: React.FC<ItemBarcodeLabelModalProps> = ({
  isOpen,
  onClose,
  items,
  warehouses,
  initialSelectedItem = null,
  currency = 'YER',
  rates = { YER: 1, USD: 535, SAR: 142 },
}) => {
  // Selected items to print
  const [selectedItemIds, setSelectedItemIds] = useState<string[]>(() => {
    if (initialSelectedItem) return [initialSelectedItem.id];
    return items.slice(0, 4).map((i) => i.id);
  });

  // Search in selection tab
  const [itemSearch, setItemSearch] = useState('');

  // Print Configuration Options
  const [template, setTemplate] = useState<LabelTemplate>('SHELF_TAG');
  const [copiesPerItem, setCopiesPerItem] = useState<number>(1);
  const [useStockQuantityAsCopies, setUseStockQuantityAsCopies] = useState<boolean>(false);
  const [showCompanyName, setShowCompanyName] = useState<boolean>(true);
  const [showCategory, setShowCategory] = useState<boolean>(true);
  const [showWarehouse, setShowWarehouse] = useState<boolean>(true);
  const [showPrice, setShowPrice] = useState<boolean>(true);
  const [showBarcodeText, setShowBarcodeText] = useState<boolean>(true);
  const [showQrCode, setShowQrCode] = useState<boolean>(true);
  const [customNote, setCustomNote] = useState<string>('شامل ضريبة المبيعات');
  const [selectedCurrency, setSelectedCurrency] = useState<Currency>(currency);

  const printAreaRef = useRef<HTMLDivElement>(null);

  // Filtered available items for the picker
  const filteredPickerItems = useMemo(() => {
    if (!itemSearch.trim()) return items;
    const term = itemSearch.toLowerCase();
    return items.filter(
      (item) =>
        item.code.toLowerCase().includes(term) ||
        item.nameAr.toLowerCase().includes(term) ||
        item.category.toLowerCase().includes(term)
    );
  }, [items, itemSearch]);

  // Items currently selected for label generation
  const activeItems = useMemo(() => {
    return items.filter((item) => selectedItemIds.includes(item.id));
  }, [items, selectedItemIds]);

  // Expanded items based on number of copies
  const printableList = useMemo(() => {
    const list: { item: InventoryItem; copyIndex: number }[] = [];
    activeItems.forEach((item) => {
      const numCopies = useStockQuantityAsCopies ? Math.max(1, Math.min(50, Math.floor(item.quantity || 1))) : copiesPerItem;
      for (let i = 0; i < numCopies; i++) {
        list.push({ item, copyIndex: i + 1 });
      }
    });
    return list;
  }, [activeItems, copiesPerItem, useStockQuantityAsCopies]);

  // Selection helpers
  const handleToggleItem = (id: string) => {
    setSelectedItemIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const handleSelectAll = () => {
    setSelectedItemIds(filteredPickerItems.map((i) => i.id));
  };

  const handleDeselectAll = () => {
    setSelectedItemIds([]);
  };

  // Trigger Native Browser Print (which supports Save to PDF natively)
  const handlePrint = () => {
    window.print();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6" dir="rtl">
      {/* Printable Area - Controlled with Print Styles */}
      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          #printable-labels-area, #printable-labels-area * {
            visibility: visible;
          }
          #printable-labels-area {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            background: white !important;
            padding: 0 !important;
            margin: 0 !important;
          }
          .no-print {
            display: none !important;
          }
          .print-break-inside-avoid {
            break-inside: avoid;
            page-break-inside: avoid;
          }
        }
      `}</style>

      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-6xl max-h-[92vh] flex flex-col overflow-hidden no-print animate-in fade-in zoom-in-95 duration-200">
        {/* Modal Header */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-500/20 border border-blue-400/30 flex items-center justify-center text-blue-400">
              <Tag className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                طباعة كروت وتعريفات الأصناف (Item Barcode & Price Labels)
                <span className="text-[10px] font-semibold bg-blue-500/20 text-blue-300 border border-blue-400/30 px-2 py-0.5 rounded-full">
                  PDF / Print Ready
                </span>
              </h3>
              <p className="text-xs text-slate-300 mt-0.5">
                توليد وطباعة ملصقات الباركود والأسعار بدقة متناهية متوافقة مع طابعات الملصقات وورق A4
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-xl shadow-md transition"
            >
              <Printer className="w-4 h-4" />
              <span>طباعة / حفظ كـ PDF</span>
            </button>

            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Body: Split View (Settings & Selection on right, Live Preview on left) */}
        <div className="flex-1 overflow-hidden grid grid-cols-1 lg:grid-cols-12">
          {/* Controls & Configuration Panel (5 Cols) */}
          <div className="lg:col-span-5 border-l border-slate-200 bg-slate-50/70 p-5 overflow-y-auto space-y-5">
            {/* 1. Label Template Choice */}
            <div>
              <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5 mb-2">
                <Settings2 className="w-4 h-4 text-blue-600" />
                نمط وتنسيق بطاقة الصنف (Label Format)
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setTemplate('SHELF_TAG')}
                  className={`p-3 rounded-xl border text-right transition flex flex-col justify-between ${
                    template === 'SHELF_TAG'
                      ? 'border-blue-600 bg-blue-50/80 text-blue-900 shadow-xs'
                      : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-bold">ملصق رفوف وسعر</span>
                    <Tag className="w-4 h-4 text-blue-600" />
                  </div>
                  <span className="text-[10px] text-slate-500">
                    مناسب لأرفف العرض وتفاصيل السعر البارزة
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setTemplate('COMPACT_STICKER')}
                  className={`p-3 rounded-xl border text-right transition flex flex-col justify-between ${
                    template === 'COMPACT_STICKER'
                      ? 'border-blue-600 bg-blue-50/80 text-blue-900 shadow-xs'
                      : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-bold">ملصق باركود مدمج</span>
                    <Grid className="w-4 h-4 text-indigo-600" />
                  </div>
                  <span className="text-[10px] text-slate-500">
                    لاصق صغير للعلب والمنتجات الفردية
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setTemplate('DETAILED_CARD')}
                  className={`p-3 rounded-xl border text-right transition flex flex-col justify-between ${
                    template === 'DETAILED_CARD'
                      ? 'border-blue-600 bg-blue-50/80 text-blue-900 shadow-xs'
                      : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-bold">بطاقة تعريف شاملة</span>
                    <CreditCard className="w-4 h-4 text-emerald-600" />
                  </div>
                  <span className="text-[10px] text-slate-500">
                    كارت مواصفات كامل مع QR والمستودع
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setTemplate('JEWELRY_TAG')}
                  className={`p-3 rounded-xl border text-right transition flex flex-col justify-between ${
                    template === 'JEWELRY_TAG'
                      ? 'border-blue-600 bg-blue-50/80 text-blue-900 shadow-xs'
                      : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-bold">ملصق أفقي مختصر</span>
                    <Layers className="w-4 h-4 text-amber-600" />
                  </div>
                  <span className="text-[10px] text-slate-500">
                    تنسيق أفقي عريض مخصص للطابعات الحرارية
                  </span>
                </button>
              </div>
            </div>

            {/* 2. Print Options & Display Controls */}
            <div className="bg-white p-4 rounded-xl border border-slate-200 space-y-3">
              <h4 className="text-xs font-bold text-slate-800 pb-1 border-b border-slate-100 flex items-center justify-between">
                <span>خيارات العرض والبيانات</span>
                <span className="text-[10px] font-normal text-slate-500">تخصيص الحقول</span>
              </h4>

              <div className="grid grid-cols-2 gap-2 text-xs">
                <label className="flex items-center gap-2 cursor-pointer text-slate-700">
                  <input
                    type="checkbox"
                    checked={showPrice}
                    onChange={(e) => setShowPrice(e.target.checked)}
                    className="rounded text-blue-600 focus:ring-blue-500"
                  />
                  <span>إظهار سعر البيع</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer text-slate-700">
                  <input
                    type="checkbox"
                    checked={showBarcodeText}
                    onChange={(e) => setShowBarcodeText(e.target.checked)}
                    className="rounded text-blue-600 focus:ring-blue-500"
                  />
                  <span>إظهار رقم الباركود</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer text-slate-700">
                  <input
                    type="checkbox"
                    checked={showCompanyName}
                    onChange={(e) => setShowCompanyName(e.target.checked)}
                    className="rounded text-blue-600 focus:ring-blue-500"
                  />
                  <span>اسم المنشأة بالترويسة</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer text-slate-700">
                  <input
                    type="checkbox"
                    checked={showCategory}
                    onChange={(e) => setShowCategory(e.target.checked)}
                    className="rounded text-blue-600 focus:ring-blue-500"
                  />
                  <span>تصنيف الصنف</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer text-slate-700">
                  <input
                    type="checkbox"
                    checked={showWarehouse}
                    onChange={(e) => setShowWarehouse(e.target.checked)}
                    className="rounded text-blue-600 focus:ring-blue-500"
                  />
                  <span>موقع المستودع</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer text-slate-700">
                  <input
                    type="checkbox"
                    checked={showQrCode}
                    onChange={(e) => setShowQrCode(e.target.checked)}
                    className="rounded text-blue-600 focus:ring-blue-500"
                  />
                  <span>رمز QR التحقق</span>
                </label>
              </div>

              {/* Currency Selector */}
              <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-2">
                <span className="text-xs font-semibold text-slate-700">عملة عرض الأسعار:</span>
                <select
                  value={selectedCurrency}
                  onChange={(e) => setSelectedCurrency(e.target.value as Currency)}
                  className="px-2.5 py-1 text-xs rounded-lg border border-slate-200 bg-slate-50 font-bold text-slate-800"
                >
                  <option value="YER">ريال يمني (YER)</option>
                  <option value="USD">دولار أمريكي (USD)</option>
                  <option value="SAR">ريال سعودي (SAR)</option>
                </select>
              </div>

              {/* Custom Footer Note */}
              <div className="pt-2">
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">ملاحظة أسفل البطاقة:</label>
                <input
                  type="text"
                  value={customNote}
                  onChange={(e) => setCustomNote(e.target.value)}
                  placeholder="مثلاً: شامل الضريبة، غير قابل للترجيع بدون الفاتورة"
                  className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-200 bg-slate-50"
                />
              </div>
            </div>

            {/* 3. Number of Copies */}
            <div className="bg-white p-4 rounded-xl border border-slate-200 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-800">عدد النسخ لكل صنف:</span>
                <div className="flex items-center gap-1">
                  {[1, 2, 5, 10].map((num) => (
                    <button
                      key={num}
                      type="button"
                      disabled={useStockQuantityAsCopies}
                      onClick={() => setCopiesPerItem(num)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-bold transition ${
                        copiesPerItem === num && !useStockQuantityAsCopies
                          ? 'bg-blue-600 text-white'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200 disabled:opacity-50'
                      }`}
                    >
                      {num}
                    </button>
                  ))}
                </div>
              </div>

              <label className="flex items-center gap-2 cursor-pointer text-xs text-blue-700 bg-blue-50/70 p-2 rounded-lg border border-blue-100">
                <input
                  type="checkbox"
                  checked={useStockQuantityAsCopies}
                  onChange={(e) => setUseStockQuantityAsCopies(e.target.checked)}
                  className="rounded text-blue-600 focus:ring-blue-500"
                />
                <span className="font-semibold">طباعة عدد ملصقات مطابق للكمية المتوفرة بالمخزن</span>
              </label>
            </div>

            {/* 4. Selected Items Selector */}
            <div className="bg-white p-4 rounded-xl border border-slate-200 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                  <CheckSquare className="w-3.5 h-3.5 text-blue-600" />
                  الأصناف المحددة للطباعة ({selectedItemIds.length})
                </span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleSelectAll}
                    className="text-[11px] font-bold text-blue-600 hover:underline"
                  >
                    تحديد الكل
                  </button>
                  <span className="text-slate-300">|</span>
                  <button
                    type="button"
                    onClick={handleDeselectAll}
                    className="text-[11px] font-bold text-slate-500 hover:underline"
                  >
                    إلغاء التحديد
                  </button>
                </div>
              </div>

              {/* Quick Search */}
              <div className="relative">
                <Search className="w-3.5 h-3.5 absolute right-2.5 top-2.5 text-slate-400" />
                <input
                  type="text"
                  value={itemSearch}
                  onChange={(e) => setItemSearch(e.target.value)}
                  placeholder="بحث في الأصناف..."
                  className="w-full pr-8 pl-2.5 py-1.5 text-xs rounded-lg border border-slate-200 bg-slate-50"
                />
              </div>

              {/* Item selection list */}
              <div className="max-h-40 overflow-y-auto space-y-1 divide-y divide-slate-100">
                {filteredPickerItems.map((item) => {
                  const isSelected = selectedItemIds.includes(item.id);
                  return (
                    <div
                      key={item.id}
                      onClick={() => handleToggleItem(item.id)}
                      className={`flex items-center justify-between p-2 rounded-lg cursor-pointer transition text-xs ${
                        isSelected ? 'bg-blue-50 text-blue-900 font-medium' : 'hover:bg-slate-50 text-slate-700'
                      }`}
                    >
                      <div className="flex items-center gap-2 truncate">
                        {isSelected ? (
                          <CheckSquare className="w-4 h-4 text-blue-600 shrink-0" />
                        ) : (
                          <Square className="w-4 h-4 text-slate-300 shrink-0" />
                        )}
                        <span className="font-mono text-[11px] text-blue-700">{item.code}</span>
                        <span className="truncate">{item.nameAr}</span>
                      </div>
                      <span className="font-mono text-[11px] font-bold text-slate-800 shrink-0 mr-2">
                        {formatCurrency(convertAmount(item.salePrice, 'YER', selectedCurrency, rates), selectedCurrency)}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Live Print Preview Canvas (7 Cols) */}
          <div className="lg:col-span-7 bg-slate-200/80 p-5 overflow-y-auto flex flex-col items-center">
            <div className="w-full flex items-center justify-between mb-3 text-xs text-slate-600">
              <span className="font-bold flex items-center gap-1.5">
                <Eye className="w-4 h-4 text-blue-600" />
                معاينة الطباعة المباشرة (إجمالي {printableList.length} ملصق)
              </span>
              <span className="text-[11px] bg-white px-2.5 py-1 rounded-md border border-slate-300 font-medium">
                جاهز للتصدير كـ PDF A4 أو طابعة الباركود الحرارية
              </span>
            </div>

            {/* Printable Area Container */}
            <div
              id="printable-labels-area"
              ref={printAreaRef}
              className="w-full bg-white p-6 rounded-xl shadow-lg border border-slate-300 min-h-[500px]"
            >
              {printableList.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-slate-400 text-center">
                  <Tag className="w-12 h-12 text-slate-300 mb-2" />
                  <p className="font-bold text-slate-600 text-sm">لم يتم تحديد أي صنف للطباعة</p>
                  <p className="text-xs text-slate-400 mt-1">يرجى اختيار صنف أو أكثر من القائمة الجانبية</p>
                </div>
              ) : (
                <div
                  className={`grid gap-4 ${
                    template === 'COMPACT_STICKER'
                      ? 'grid-cols-2 sm:grid-cols-3 md:grid-cols-4'
                      : template === 'SHELF_TAG'
                      ? 'grid-cols-1 sm:grid-cols-2 md:grid-cols-3'
                      : template === 'JEWELRY_TAG'
                      ? 'grid-cols-1 sm:grid-cols-2'
                      : 'grid-cols-1 sm:grid-cols-2'
                  }`}
                >
                  {printableList.map(({ item, copyIndex }, idx) => {
                    const wh = warehouses.find((w) => w.id === item.warehouseId);
                    const barcodeVal = item.barcode || item.code.replace(/[^a-zA-Z0-9]/g, '') || 'ITEM' + item.id;
                    const priceFormatted = formatCurrency(
                      convertAmount(item.salePrice, 'YER', selectedCurrency, rates),
                      selectedCurrency
                    );

                    // ==========================================
                    // TEMPLATE 1: SHELF & PRICE TAG (60x40mm)
                    // ==========================================
                    if (template === 'SHELF_TAG') {
                      return (
                        <div
                          key={`label-${item.id}-${copyIndex}-${idx}`}
                          className="print-break-inside-avoid bg-white border-2 border-slate-900 rounded-xl p-3.5 flex flex-col justify-between shadow-xs relative overflow-hidden"
                          style={{ minHeight: '180px' }}
                        >
                          {/* Header */}
                          <div>
                            {showCompanyName && (
                              <div className="flex items-center justify-between border-b border-slate-200 pb-1 mb-1.5">
                                <span className="text-[9px] font-bold text-slate-700 tracking-tight">
                                  شركة المنظومة المحاسبية
                                </span>
                                <span className="text-[9px] font-mono text-blue-700 font-bold bg-blue-50 px-1 rounded">
                                  {item.code}
                                </span>
                              </div>
                            )}

                            {/* Item Name */}
                            <h4 className="text-xs font-bold text-slate-950 leading-tight line-clamp-2" title={item.nameAr}>
                              {item.nameAr}
                            </h4>

                            {/* Category & Warehouse */}
                            {(showCategory || showWarehouse) && (
                              <div className="flex items-center gap-1.5 mt-1 text-[9px] text-slate-500">
                                {showCategory && (
                                  <span className="bg-slate-100 px-1.5 py-0.5 rounded text-slate-700 font-medium">
                                    {item.category}
                                  </span>
                                )}
                                {showWarehouse && wh && (
                                  <span className="text-slate-500 truncate">
                                    {wh.nameAr}
                                  </span>
                                )}
                              </div>
                            )}
                          </div>

                          {/* Large Price Highlight */}
                          {showPrice && (
                            <div className="my-2 bg-slate-950 text-white px-2.5 py-1.5 rounded-lg flex items-baseline justify-between">
                              <span className="text-[10px] font-medium text-slate-300">السعر:</span>
                              <div className="text-left font-mono font-black text-base text-white tracking-wide">
                                {priceFormatted}
                              </div>
                            </div>
                          )}

                          {/* Barcode & Footer */}
                          <div className="mt-1 pt-1.5 border-t border-dashed border-slate-200 flex flex-col items-center">
                            <Barcode
                              value={barcodeVal}
                              displayValue={item.code}
                              height={34}
                              moduleWidth={1.3}
                              showText={showBarcodeText}
                            />
                            {customNote && (
                              <span className="text-[8px] text-slate-400 mt-1">{customNote}</span>
                            )}
                          </div>
                        </div>
                      );
                    }

                    // ==========================================
                    // TEMPLATE 2: COMPACT PRODUCT STICKER (40x25mm)
                    // ==========================================
                    if (template === 'COMPACT_STICKER') {
                      return (
                        <div
                          key={`label-compact-${item.id}-${copyIndex}-${idx}`}
                          className="print-break-inside-avoid bg-white border border-slate-800 rounded-lg p-2 flex flex-col justify-between text-center shadow-2xs"
                          style={{ minHeight: '120px' }}
                        >
                          <div className="truncate text-[10px] font-bold text-slate-900 mb-0.5">
                            {item.nameAr}
                          </div>

                          <div className="flex-1 flex flex-col items-center justify-center my-0.5">
                            <Barcode
                              value={barcodeVal}
                              displayValue={item.code}
                              height={26}
                              moduleWidth={1.1}
                              showText={showBarcodeText}
                            />
                          </div>

                          {showPrice && (
                            <div className="text-[11px] font-black font-mono text-slate-950 border-t border-slate-200 pt-1 mt-0.5">
                              {priceFormatted}
                            </div>
                          )}
                        </div>
                      );
                    }

                    // ==========================================
                    // TEMPLATE 3: DETAILED ITEM CARD (100x70mm)
                    // ==========================================
                    if (template === 'DETAILED_CARD') {
                      return (
                        <div
                          key={`label-detailed-${item.id}-${copyIndex}-${idx}`}
                          className="print-break-inside-avoid bg-white border-2 border-blue-900 rounded-2xl p-4 flex flex-col justify-between shadow-xs relative"
                          style={{ minHeight: '220px' }}
                        >
                          {/* Card Top Brand */}
                          <div className="flex items-center justify-between border-b-2 border-blue-900 pb-2 mb-2">
                            <div className="flex items-center gap-1.5">
                              <Building className="w-4 h-4 text-blue-800" />
                              <span className="text-[11px] font-bold text-blue-950">
                                نظام تخطيط الموارد المحاسبي
                              </span>
                            </div>
                            <span className="text-[10px] font-mono font-bold bg-blue-100 text-blue-900 px-2 py-0.5 rounded-md">
                              رمز: {item.code}
                            </span>
                          </div>

                          {/* Title & Specs */}
                          <div className="space-y-1">
                            <h4 className="text-sm font-bold text-slate-900 leading-snug">
                              {item.nameAr}
                            </h4>
                            <div className="grid grid-cols-2 gap-2 text-[10px] text-slate-600 bg-slate-50 p-2 rounded-lg border border-slate-100 mt-2">
                              <div>
                                <span className="text-slate-400">التصنيف: </span>
                                <span className="font-bold text-slate-800">{item.category}</span>
                              </div>
                              <div>
                                <span className="text-slate-400">الوحدة: </span>
                                <span className="font-bold text-slate-800">{item.unit || 'حبة'}</span>
                              </div>
                              <div>
                                <span className="text-slate-400">المستودع: </span>
                                <span className="font-bold text-slate-800">{wh?.nameAr || 'الرئيسي'}</span>
                              </div>
                              <div>
                                <span className="text-slate-400">الرصيد: </span>
                                <span className="font-bold font-mono text-slate-800">{item.quantity} {item.unit}</span>
                              </div>
                            </div>
                          </div>

                          {/* Price & Barcode Row */}
                          <div className="mt-3 pt-2 border-t border-slate-200 flex items-center justify-between gap-3">
                            <div className="flex-1 flex flex-col items-center">
                              <Barcode
                                value={barcodeVal}
                                displayValue={item.code}
                                height={32}
                                moduleWidth={1.2}
                                showText={showBarcodeText}
                              />
                            </div>

                            {showPrice && (
                              <div className="bg-blue-900 text-white px-3 py-1.5 rounded-xl text-center shrink-0">
                                <div className="text-[9px] text-blue-200">سعر البيع</div>
                                <div className="text-sm font-black font-mono text-white">
                                  {priceFormatted}
                                </div>
                              </div>
                            )}
                          </div>

                          {customNote && (
                            <div className="text-center text-[9px] text-slate-400 mt-1 pt-1 border-t border-dashed border-slate-200">
                              {customNote}
                            </div>
                          )}
                        </div>
                      );
                    }

                    // ==========================================
                    // TEMPLATE 4: JEWELRY / WIDE THERMAL TAG
                    // ==========================================
                    return (
                      <div
                        key={`label-wide-${item.id}-${copyIndex}-${idx}`}
                        className="print-break-inside-avoid bg-white border border-slate-900 rounded-lg p-2.5 flex items-center justify-between gap-3 shadow-2xs"
                        style={{ minHeight: '80px' }}
                      >
                        <div className="flex-1 space-y-0.5">
                          <div className="text-[11px] font-bold text-slate-900 truncate">
                            {item.nameAr}
                          </div>
                          <div className="text-[9px] font-mono text-slate-500">
                            {item.code} | {item.category}
                          </div>
                          {showPrice && (
                            <div className="text-xs font-black font-mono text-slate-950 mt-1">
                              {priceFormatted}
                            </div>
                          )}
                        </div>

                        <div className="shrink-0 flex flex-col items-center">
                          <Barcode
                            value={barcodeVal}
                            displayValue={item.code}
                            height={28}
                            moduleWidth={1.1}
                            showText={showBarcodeText}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="text-xs text-slate-500 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-500" />
            <span>
              تم ضبط الأبعاد بدقة هندسية لتلائم مقاسات الورق القياسية A4 وأجهزة الباركود الحرارية (Zebra, Xprinter, Bixolon).
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-bold text-slate-700 bg-white hover:bg-slate-100 border border-slate-300 rounded-xl transition"
            >
              إغلاق
            </button>

            <button
              type="button"
              onClick={handlePrint}
              className="flex items-center gap-2 px-5 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-xs transition"
            >
              <Printer className="w-4 h-4" />
              <span>طباعة الملصقات ({printableList.length})</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
