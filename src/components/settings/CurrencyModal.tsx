import React, { useState } from 'react';
import { X, Save, Coins, DollarSign, RefreshCw } from 'lucide-react';
import { CurrencyConfig } from '../../types/accounting';

interface CurrencyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (curr: CurrencyConfig) => void;
  currencyToEdit?: CurrencyConfig | null;
}

export const CurrencyModal: React.FC<CurrencyModalProps> = ({
  isOpen,
  onClose,
  onSave,
  currencyToEdit,
}) => {
  const [code, setCode] = useState(currencyToEdit?.code || '');
  const [nameAr, setNameAr] = useState(currencyToEdit?.nameAr || '');
  const [nameEn, setNameEn] = useState(currencyToEdit?.nameEn || '');
  const [symbol, setSymbol] = useState(currencyToEdit?.symbol || '');
  const [exchangeRate, setExchangeRate] = useState(currencyToEdit?.exchangeRate || 1);
  const [fractionNameAr, setFractionNameAr] = useState(currencyToEdit?.fractionNameAr || 'سنت');
  const [decimalPlaces, setDecimalPlaces] = useState(currencyToEdit?.decimalPlaces || 2);
  const [isActive, setIsActive] = useState(currencyToEdit?.isActive ?? true);
  const [isBase, setIsBase] = useState(currencyToEdit?.isBase || false);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim() || !nameAr.trim()) {
      alert('يرجى إدخال رمز العملة واسمها بالعربية');
      return;
    }

    const config: CurrencyConfig = {
      code: code.trim().toUpperCase(),
      nameAr: nameAr.trim(),
      nameEn: nameEn.trim() || nameAr.trim(),
      symbol: symbol.trim() || code.trim().toUpperCase(),
      exchangeRate: isBase ? 1 : Number(exchangeRate) || 1,
      fractionNameAr: fractionNameAr.trim(),
      decimalPlaces: Number(decimalPlaces) || 2,
      isActive,
      isBase,
    };

    onSave(config);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4" dir="rtl">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Modal Header */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-400/30 flex items-center justify-center text-amber-400">
              <Coins className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">
                {currencyToEdit ? 'تعديل بيانات العملة وسعر الصرف' : 'إضافة عملة جديدة للنظام'}
              </h3>
              <p className="text-xs text-slate-300">
                تهيئة العملات وأسعار التحويل المالي مقابل العملة الأساسية
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Code */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                رمز العملة الدولي (ISO Code) *
              </label>
              <input
                type="text"
                required
                maxLength={4}
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="مثلاً: EUR, KWD, AED"
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 font-mono font-bold focus:bg-white focus:ring-2 focus:ring-blue-500 text-left"
                dir="ltr"
              />
            </div>

            {/* Symbol */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                رمز الاختصار / العلامة (Symbol) *
              </label>
              <input
                type="text"
                required
                value={symbol}
                onChange={(e) => setSymbol(e.target.value)}
                placeholder="مثلاً: €, ر.ع, د.ك"
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 font-bold focus:bg-white focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Arabic Name */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                اسم العملة بالعربية *
              </label>
              <input
                type="text"
                required
                value={nameAr}
                onChange={(e) => setNameAr(e.target.value)}
                placeholder="مثلاً: يورو أوروبي، دينار كويتي"
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* English Name */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                اسم العملة بالإنجليزية
              </label>
              <input
                type="text"
                value={nameEn}
                onChange={(e) => setNameEn(e.target.value)}
                placeholder="e.g. Euro, Kuwaiti Dinar"
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500 text-left"
                dir="ltr"
              />
            </div>

            {/* Exchange Rate */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                سعر الصرف (مقابل العملة الأساسية YER) *
              </label>
              <div className="relative">
                <RefreshCw className="w-3.5 h-3.5 text-slate-400 absolute right-3 top-3" />
                <input
                  type="number"
                  step="0.0001"
                  required
                  disabled={isBase}
                  value={exchangeRate}
                  onChange={(e) => setExchangeRate(parseFloat(e.target.value) || 0)}
                  placeholder="مثلاً: 535 أو 142.5"
                  className="w-full pr-8 pl-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 font-mono font-bold focus:bg-white focus:ring-2 focus:ring-blue-500 text-left disabled:bg-slate-100 disabled:opacity-75"
                  dir="ltr"
                />
              </div>
            </div>

            {/* Fraction Name */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                اسم أجزاء العملة / الفكة
              </label>
              <input
                type="text"
                value={fractionNameAr}
                onChange={(e) => setFractionNameAr(e.target.value)}
                placeholder="مثلاً: سنت، فلس، هللة، بيسة"
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Decimal Places */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                عدد الخانات العشرية (Decimals)
              </label>
              <select
                value={decimalPlaces}
                onChange={(e) => setDecimalPlaces(Number(e.target.value))}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 font-bold focus:bg-white focus:ring-2 focus:ring-blue-500"
              >
                <option value={0}>0 (أرقام صحيحة بدون كسور)</option>
                <option value={2}>2 (مثال: 100.50)</option>
                <option value={3}>3 (مثال: 100.500)</option>
                <option value={4}>4 (دقة محاسبية متقدمة)</option>
              </select>
            </div>

            {/* Status Toggle */}
            <div className="flex items-center pt-5">
              <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-slate-700">
                <input
                  type="checkbox"
                  checked={isActive}
                  onChange={(e) => setIsActive(e.target.checked)}
                  className="rounded text-blue-600 focus:ring-blue-500"
                />
                <span>تفعيل استخدام العملة في المعاملات</span>
              </label>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition"
            >
              إلغاء
            </button>
            <button
              type="submit"
              className="flex items-center gap-2 px-5 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-xs transition"
            >
              <Save className="w-4 h-4" />
              <span>{currencyToEdit ? 'حفظ التعديل' : 'إضافة العملة'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
