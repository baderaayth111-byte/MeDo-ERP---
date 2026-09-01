import React, { useState, useEffect } from 'react';
import {
  Calculator,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  Percent,
  DollarSign,
  ArrowRight,
  Sparkles,
  X,
  Zap,
  Info,
  ShieldAlert,
  ArrowUpRight,
  TrendingDown
} from 'lucide-react';
import { Currency } from '../types/accounting';
import { formatCurrency } from '../utils/formatters';

export interface ProfitMarginData {
  itemId: string;
  itemCode?: string;
  itemName: string;
  costPrice: number;
  salePrice: number;
  quantity?: number;
  unit?: string;
  discountPercent?: number;
}

interface ItemProfitMarginCalculatorModalProps {
  isOpen: boolean;
  onClose: () => void;
  itemData: ProfitMarginData | null;
  currency: Currency;
  rates?: Record<Currency, number>;
  onApplyPrice?: (newPrice: number, newDiscount?: number) => void;
}

export const ItemProfitMarginCalculatorModal: React.FC<ItemProfitMarginCalculatorModalProps> = ({
  isOpen,
  onClose,
  itemData,
  currency,
  rates = { YER: 1, USD: 535, SAR: 142.5 },
  onApplyPrice,
}) => {
  if (!isOpen || !itemData) return null;

  const cost = Math.max(0, Number(itemData.costPrice) || 0);
  const initialSalePrice = Math.max(0, Number(itemData.salePrice) || 0);
  const qty = Math.max(1, Number(itemData.quantity) || 1);
  const initialDiscount = Math.min(100, Math.max(0, Number(itemData.discountPercent) || 0));

  // Editable simulation states
  const [targetSalePrice, setTargetSalePrice] = useState<number>(initialSalePrice);
  const [targetDiscountPct, setTargetDiscountPct] = useState<number>(initialDiscount);
  const [calcMode, setCalcMode] = useState<'BY_PRICE' | 'BY_MARGIN_PCT' | 'BY_PROFIT_AMT'>('BY_PRICE');
  const [inputTargetMarginPct, setInputTargetMarginPct] = useState<number>(() => {
    if (cost > 0 && initialSalePrice > cost) {
      return Math.round(((initialSalePrice - cost) / initialSalePrice) * 100);
    }
    return 20;
  });
  const [inputTargetProfitAmt, setInputTargetProfitAmt] = useState<number>(() => {
    return Math.max(0, initialSalePrice - cost);
  });

  // Keep state synchronized when itemData changes
  useEffect(() => {
    setTargetSalePrice(initialSalePrice);
    setTargetDiscountPct(initialDiscount);
    if (cost > 0 && initialSalePrice > 0) {
      const margin = ((initialSalePrice - cost) / initialSalePrice) * 100;
      setInputTargetMarginPct(Math.round(margin * 10) / 10);
    }
    setInputTargetProfitAmt(Math.max(0, initialSalePrice - cost));
  }, [itemData]);

  // Handle target margin % change
  const handleMarginPctChange = (pct: number) => {
    const margin = Math.min(99, Math.max(-100, pct));
    setInputTargetMarginPct(margin);
    if (margin < 100) {
      // Selling price to achieve Gross Margin % on Selling Price: Price = Cost / (1 - Margin/100)
      const calculatedPrice = margin >= 0 && margin < 100 
        ? cost / (1 - (margin / 100))
        : cost * (1 + (margin / 100));
      const roundedPrice = Math.round(calculatedPrice);
      setTargetSalePrice(roundedPrice);
      setInputTargetProfitAmt(Math.max(0, roundedPrice - cost));
    }
  };

  // Handle target profit amount change
  const handleProfitAmtChange = (profitAmt: number) => {
    const profit = Math.max(-cost, profitAmt);
    setInputTargetProfitAmt(profit);
    const newPrice = Math.round(cost + profit);
    setTargetSalePrice(newPrice);
    if (newPrice > 0) {
      setInputTargetMarginPct(Math.round(((newPrice - cost) / newPrice) * 1000) / 10);
    }
  };

  // Handle direct price change
  const handleDirectPriceChange = (price: number) => {
    const p = Math.max(0, price);
    setTargetSalePrice(p);
    if (p > 0 && cost > 0) {
      const margin = ((p - cost) / p) * 100;
      setInputTargetMarginPct(Math.round(margin * 10) / 10);
      setInputTargetProfitAmt(Math.round(p - cost));
    } else if (cost === 0) {
      setInputTargetMarginPct(100);
      setInputTargetProfitAmt(p);
    }
  };

  // Financial calculations
  const effectiveSalePriceAfterDiscount = targetSalePrice * (1 - targetDiscountPct / 100);
  const unitProfit = effectiveSalePriceAfterDiscount - cost;
  const grossMarginPercent = effectiveSalePriceAfterDiscount > 0
    ? (unitProfit / effectiveSalePriceAfterDiscount) * 100
    : cost === 0 ? 100 : -100;
  const markupPercent = cost > 0 ? (unitProfit / cost) * 100 : 100;

  const totalCost = cost * qty;
  const totalRevenue = effectiveSalePriceAfterDiscount * qty;
  const totalProfit = unitProfit * qty;

  const isLoss = unitProfit < 0;
  const isHealthyMargin = grossMarginPercent >= 15;
  const isThinMargin = grossMarginPercent >= 0 && grossMarginPercent < 15;

  const handleApply = () => {
    if (onApplyPrice) {
      onApplyPrice(targetSalePrice, targetDiscountPct);
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div className="bg-white rounded-3xl max-w-xl w-full shadow-2xl flex flex-col overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 max-h-[92vh]">
        {/* Modal Header */}
        <div className="p-4 sm:p-5 bg-gradient-to-r from-slate-900 via-indigo-950 to-blue-950 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-400 text-slate-950 flex items-center justify-center font-black shadow-md">
              <Calculator className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-black text-sm sm:text-base text-white flex items-center gap-2">
                <span>حاسبة هامش الربح والقرار المالي الفوري</span>
                <span className="text-[10px] bg-amber-400/20 text-amber-300 px-2 py-0.5 rounded-full border border-amber-400/30">
                  Live Margin ⚡
                </span>
              </h3>
              <p className="text-[11px] text-slate-300">
                مقارنة فورية بين تكلفة الشراء وسعر البيع لتسعير عادل ومربح
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1.5 rounded-xl hover:bg-white/10 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-5 text-right">
          {/* Target Item Brief Card */}
          <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200 flex items-center justify-between gap-3">
            <div className="space-y-0.5">
              <span className="text-[11px] font-bold text-slate-400">الصنف المستهدف بالفاتورة:</span>
              <h4 className="font-black text-sm sm:text-base text-slate-900 leading-snug">
                {itemData.itemName}
              </h4>
              {itemData.itemCode && (
                <span className="text-[11px] font-mono text-slate-500 bg-white px-2 py-0.5 rounded-md border border-slate-200 inline-block">
                  كود الصنف: {itemData.itemCode}
                </span>
              )}
            </div>
            <div className="text-left shrink-0">
              <span className="text-[10px] text-slate-500 block font-bold">الكمية المسجلة:</span>
              <span className="text-sm font-black text-blue-700 font-mono bg-blue-50 px-2.5 py-1 rounded-xl border border-blue-200">
                {qty} {itemData.unit || 'حبة'}
              </span>
            </div>
          </div>

          {/* Core Comparison: Cost vs Sale Price */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* 1. Cost Price Card */}
            <div className="bg-amber-50/60 p-4 rounded-2xl border-2 border-amber-200 space-y-1">
              <div className="flex items-center justify-between text-xs font-bold text-amber-900">
                <span className="flex items-center gap-1.5">
                  <DollarSign className="w-3.5 h-3.5 text-amber-700" />
                  تكلفة الشراء (المخزون):
                </span>
                <span className="text-[10px] bg-amber-200/70 text-amber-900 px-1.5 py-0.2 rounded font-mono">
                  ثابتة
                </span>
              </div>
              <div className="text-xl sm:text-2xl font-black text-amber-950 font-mono">
                {formatCurrency(cost, currency, rates)}
              </div>
              <p className="text-[10px] text-amber-800">
                تكلفة الشراء المعتمدة المسجلة في دليل المخزون
              </p>
            </div>

            {/* 2. Current / Target Sale Price */}
            <div className="bg-blue-50/60 p-4 rounded-2xl border-2 border-blue-200 space-y-1">
              <div className="flex items-center justify-between text-xs font-bold text-blue-900">
                <span className="flex items-center gap-1.5">
                  <TrendingUp className="w-3.5 h-3.5 text-blue-700" />
                  سعر البيع الحالي / المقترح:
                </span>
                <span className="text-[10px] bg-blue-200/70 text-blue-900 px-1.5 py-0.2 rounded font-mono">
                  قابل للتعديل
                </span>
              </div>
              <div className="text-xl sm:text-2xl font-black text-blue-950 font-mono">
                {formatCurrency(targetSalePrice, currency, rates)}
              </div>
              <p className="text-[10px] text-blue-800">
                سعر بيع الوحدة قبل خصومات الفاتورة
              </p>
            </div>
          </div>

          {/* Interactive Calculator Mode Selector */}
          <div className="space-y-3 bg-slate-50 p-4 rounded-2xl border border-slate-200">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black text-slate-800 flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-amber-500" />
                طريقة تعديل واحتساب السعر المالي:
              </span>
              <div className="flex items-center gap-1 bg-white p-0.5 rounded-xl border border-slate-200 text-xs">
                <button
                  type="button"
                  onClick={() => setCalcMode('BY_PRICE')}
                  className={`px-2.5 py-1 rounded-lg font-bold transition ${
                    calcMode === 'BY_PRICE'
                      ? 'bg-blue-600 text-white shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  سعر مباشر
                </button>
                <button
                  type="button"
                  onClick={() => setCalcMode('BY_MARGIN_PCT')}
                  className={`px-2.5 py-1 rounded-lg font-bold transition ${
                    calcMode === 'BY_MARGIN_PCT'
                      ? 'bg-blue-600 text-white shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  نسبة هامش %
                </button>
                <button
                  type="button"
                  onClick={() => setCalcMode('BY_PROFIT_AMT')}
                  className={`px-2.5 py-1 rounded-lg font-bold transition ${
                    calcMode === 'BY_PROFIT_AMT'
                      ? 'bg-blue-600 text-white shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  مبلغ ربح محدد
                </button>
              </div>
            </div>

            {/* Calculation Controls */}
            {calcMode === 'BY_PRICE' && (
              <div className="space-y-2">
                <label className="block text-xs font-bold text-slate-700">
                  أدخل سعر البيع المطلوب للوحدة ({currency}):
                </label>
                <div className="relative">
                  <input
                    type="number"
                    min="0"
                    step="any"
                    value={targetSalePrice}
                    onChange={(e) => handleDirectPriceChange(parseFloat(e.target.value) || 0)}
                    className="w-full pl-12 pr-4 py-2.5 bg-white border-2 border-blue-300 rounded-xl text-base font-black font-mono text-slate-900 focus:border-blue-600 focus:outline-none"
                  />
                  <span className="absolute left-3 top-3 text-xs font-bold text-slate-400">
                    {currency}
                  </span>
                </div>
              </div>
            )}

            {calcMode === 'BY_MARGIN_PCT' && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-700">
                    نسبة هامش الربح المستهدفة من سعر البيع:
                  </label>
                  <span className="text-sm font-black font-mono text-blue-700">
                    {inputTargetMarginPct}%
                  </span>
                </div>

                {/* Quick Presets */}
                <div className="flex flex-wrap gap-1.5">
                  {[10, 15, 20, 25, 30, 35, 40, 50].map((pct) => (
                    <button
                      key={pct}
                      type="button"
                      onClick={() => handleMarginPctChange(pct)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-black transition cursor-pointer ${
                        inputTargetMarginPct === pct
                          ? 'bg-blue-600 text-white shadow-xs'
                          : 'bg-white text-slate-700 hover:bg-slate-200 border border-slate-300'
                      }`}
                    >
                      +{pct}%
                    </button>
                  ))}
                </div>

                <input
                  type="range"
                  min="0"
                  max="80"
                  step="1"
                  value={inputTargetMarginPct}
                  onChange={(e) => handleMarginPctChange(parseFloat(e.target.value) || 0)}
                  className="w-full accent-blue-600 cursor-pointer"
                />
              </div>
            )}

            {calcMode === 'BY_PROFIT_AMT' && (
              <div className="space-y-2">
                <label className="block text-xs font-bold text-slate-700">
                  مبلغ صافي الربح المستهدف لكل حبة ({currency}):
                </label>
                <div className="relative">
                  <input
                    type="number"
                    min="0"
                    step="any"
                    value={inputTargetProfitAmt}
                    onChange={(e) => handleProfitAmtChange(parseFloat(e.target.value) || 0)}
                    className="w-full pl-12 pr-4 py-2.5 bg-white border-2 border-emerald-300 rounded-xl text-base font-black font-mono text-slate-900 focus:border-emerald-600 focus:outline-none"
                  />
                  <span className="absolute left-3 top-3 text-xs font-bold text-slate-400">
                    {currency}
                  </span>
                </div>
              </div>
            )}

            {/* Discount Test Simulator */}
            <div className="pt-3 border-t border-slate-200">
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-bold text-slate-700 flex items-center gap-1">
                  <Percent className="w-3.5 h-3.5 text-amber-600" />
                  تجربة منح خصم ترويجي للصنف (%):
                </label>
                <span className="text-xs font-mono font-bold text-amber-700">
                  {targetDiscountPct}% (خصم: {formatCurrency((targetSalePrice * targetDiscountPct) / 100, currency, rates)})
                </span>
              </div>
              <div className="flex items-center gap-2">
                {[0, 3, 5, 10, 15, 20].map((d) => (
                  <button
                    key={d}
                    type="button"
                    onClick={() => setTargetDiscountPct(d)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold transition ${
                      targetDiscountPct === d
                        ? 'bg-amber-500 text-slate-950 font-black shadow-xs'
                        : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    {d === 0 ? 'بدون خصم' : `${d}%`}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Live Decision Analytics Result Box */}
          <div
            className={`p-4 sm:p-5 rounded-2xl border-2 transition-all space-y-3 ${
              isLoss
                ? 'bg-rose-50/90 border-rose-400 text-rose-950'
                : isThinMargin
                ? 'bg-amber-50/90 border-amber-400 text-amber-950'
                : 'bg-emerald-50/90 border-emerald-400 text-emerald-950'
            }`}
          >
            <div className="flex items-center justify-between border-b pb-2.5 border-black/10">
              <div className="flex items-center gap-2 font-black text-xs sm:text-sm">
                {isLoss ? (
                  <>
                    <ShieldAlert className="w-5 h-5 text-rose-600 animate-bounce" />
                    <span>تحذير مالي: البيع بسعر أقل من تكلفة الشراء (خسارة مؤكدة)!</span>
                  </>
                ) : isThinMargin ? (
                  <>
                    <AlertTriangle className="w-5 h-5 text-amber-600" />
                    <span>هامش ربح ضئيل / منخفض (أقل من 15%)</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                    <span>تسعير سليم وهامش ربح ممتاز وصحي</span>
                  </>
                )}
              </div>
              <span
                className={`text-xs px-2.5 py-0.5 rounded-full font-mono font-black border ${
                  isLoss
                    ? 'bg-rose-200 text-rose-900 border-rose-300'
                    : isThinMargin
                    ? 'bg-amber-200 text-amber-900 border-amber-300'
                    : 'bg-emerald-200 text-emerald-900 border-emerald-300'
                }`}
              >
                {grossMarginPercent.toFixed(1)}% هامش ربح
              </span>
            </div>

            {/* 3 Metrics breakdown */}
            <div className="grid grid-cols-3 gap-2 text-center pt-1">
              <div className="bg-white/80 p-2 rounded-xl border border-black/5">
                <span className="text-[10px] text-slate-500 font-bold block mb-0.5">
                  ربح الحبة الواحدة:
                </span>
                <span
                  className={`text-xs sm:text-sm font-black font-mono ${
                    unitProfit >= 0 ? 'text-emerald-700' : 'text-rose-700'
                  }`}
                >
                  {unitProfit >= 0 ? '+' : ''}
                  {formatCurrency(unitProfit, currency, rates)}
                </span>
              </div>

              <div className="bg-white/80 p-2 rounded-xl border border-black/5">
                <span className="text-[10px] text-slate-500 font-bold block mb-0.5">
                  نسبة الزيادة على التكلفة (Markup):
                </span>
                <span className="text-xs sm:text-sm font-black font-mono text-slate-800">
                  {markupPercent.toFixed(1)}%
                </span>
              </div>

              <div className="bg-white/80 p-2 rounded-xl border border-black/5">
                <span className="text-[10px] text-slate-500 font-bold block mb-0.5">
                  إجمالي ربح الكمية ({qty} قطعة):
                </span>
                <span
                  className={`text-xs sm:text-sm font-black font-mono ${
                    totalProfit >= 0 ? 'text-emerald-700' : 'text-rose-700'
                  }`}
                >
                  {totalProfit >= 0 ? '+' : ''}
                  {formatCurrency(totalProfit, currency, rates)}
                </span>
              </div>
            </div>

            {/* Total Line Revenue vs Cost */}
            <div className="flex items-center justify-between text-[11px] font-bold opacity-90 pt-1">
              <span>إجمالي تكلفة البند بالفاتورة: {formatCurrency(totalCost, currency, rates)}</span>
              <span>إجمالي قيمة البيع الصافية: {formatCurrency(totalRevenue, currency, rates)}</span>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex flex-wrap items-center justify-between gap-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold text-xs rounded-xl transition cursor-pointer"
          >
            إلغاء وإغلاق
          </button>

          <div className="flex items-center gap-2">
            {onApplyPrice && (
              <button
                type="button"
                onClick={handleApply}
                className="px-5 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-black text-xs rounded-xl shadow-md transition flex items-center gap-1.5 active:scale-95 cursor-pointer"
              >
                <Zap className="w-4 h-4 text-amber-300 fill-current" />
                <span>تطبيق السعر المالي المقترح على الفاتورة ⏎</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// ============================================================================
// Mini Inline Profit Margin Badge Component (for Table Cells & Item Rows)
// ============================================================================
interface ProfitMarginBadgeProps {
  costPrice: number;
  salePrice: number;
  currency: Currency;
  rates?: Record<Currency, number>;
  onOpenCalculator?: () => void;
  compact?: boolean;
  showCostLabel?: boolean;
}

export const ProfitMarginBadge: React.FC<ProfitMarginBadgeProps> = ({
  costPrice,
  salePrice,
  currency,
  rates = { YER: 1, USD: 535, SAR: 142.5 },
  onOpenCalculator,
  compact = false,
  showCostLabel = true,
}) => {
  const cost = Math.max(0, costPrice || 0);
  const price = Math.max(0, salePrice || 0);
  const profit = price - cost;
  const marginPct = price > 0 ? (profit / price) * 100 : cost === 0 ? 100 : -100;

  const isLoss = profit < 0;
  const isHealthy = marginPct >= 15;
  const isThin = marginPct >= 0 && marginPct < 15;

  if (compact) {
    return (
      <div className="inline-flex items-center gap-1">
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            if (onOpenCalculator) onOpenCalculator();
          }}
          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-black font-mono border transition cursor-pointer active:scale-95 ${
            isLoss
              ? 'bg-rose-100 text-rose-800 border-rose-300 hover:bg-rose-200 animate-pulse'
              : isThin
              ? 'bg-amber-100 text-amber-800 border-amber-300 hover:bg-amber-200'
              : 'bg-emerald-100 text-emerald-800 border-emerald-300 hover:bg-emerald-200'
          }`}
          title={`تكلفة الشراء: ${formatCurrency(cost, currency, rates)} | سعر البيع: ${formatCurrency(price, currency, rates)} | هامش الربح: ${profit >= 0 ? '+' : ''}${formatCurrency(profit, currency, rates)} (${marginPct.toFixed(1)}%) - انقر لفتح الحاسبة`}
        >
          <Calculator className="w-2.5 h-2.5" />
          <span>
            {profit >= 0 ? '+' : ''}{marginPct.toFixed(0)}%
          </span>
        </button>
      </div>
    );
  }

  return (
    <div className="inline-flex flex-col text-right space-y-1">
      {showCostLabel && (
        <div className="text-[10px] font-mono text-slate-500 flex items-center gap-1">
          <span className="text-slate-400">التكلفة:</span>
          <span className="font-bold text-amber-800 bg-amber-50 px-1 py-0.2 rounded border border-amber-200/60">
            {formatCurrency(cost, currency, rates)}
          </span>
        </div>
      )}

      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          if (onOpenCalculator) onOpenCalculator();
        }}
        className={`inline-flex items-center justify-between gap-1.5 px-2 py-0.8 rounded-lg text-[11px] font-mono font-black border transition cursor-pointer shadow-2xs hover:shadow-xs active:scale-95 ${
          isLoss
            ? 'bg-rose-50 text-rose-800 border-rose-300 hover:bg-rose-100'
            : isThin
            ? 'bg-amber-50 text-amber-800 border-amber-300 hover:bg-amber-100'
            : 'bg-emerald-50 text-emerald-800 border-emerald-300 hover:bg-emerald-100'
        }`}
        title="انقر لفتح حاسبة هامش الربح الفورية وتعديل السعر"
      >
        <span className="flex items-center gap-1">
          <Calculator className="w-3 h-3 text-slate-600" />
          <span>هامش:</span>
        </span>
        <span className="font-bold">
          {profit >= 0 ? '+' : ''}{formatCurrency(profit, currency, rates)} ({marginPct.toFixed(0)}%)
        </span>
      </button>
    </div>
  );
};
