import React, { useState, useMemo } from 'react';
import { 
  AlertTriangle, 
  PackageX, 
  Clock, 
  TrendingDown, 
  ShoppingBag, 
  CheckCircle2, 
  ArrowRight, 
  Sparkles,
  RefreshCw,
  BellRing,
  ExternalLink,
  Zap,
  ShieldAlert
} from 'lucide-react';
import { InventoryItem, Currency } from '../types/accounting';
import { useLanguage } from '../contexts/LanguageContext';

interface SmartInventoryAlertsCardProps {
  items: InventoryItem[];
  onNavigateToProcurement?: (suggestedItem?: InventoryItem) => void;
  currency?: Currency;
}

export const SmartInventoryAlertsCard: React.FC<SmartInventoryAlertsCardProps> = ({
  items = [],
  onNavigateToProcurement,
  currency = 'YER'
}) => {
  const { language, t } = useLanguage();
  const [activeAlertTab, setActiveAlertTab] = useState<'OUT_OF_STOCK' | 'LOW_STOCK' | 'EXPIRY' | 'OVERSTOCK'>('LOW_STOCK');

  // Categorize Alert Items
  const outOfStockItems = useMemo(() => items.filter(i => i.quantity <= 0), [items]);
  
  const lowStockItems = useMemo(() => {
    return items.filter(i => i.quantity > 0 && i.quantity <= (i.minQuantity || 10));
  }, [items]);

  const expiryAlertItems = useMemo(() => {
    const today = new Date();
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(today.getDate() + 30);

    return items.filter(i => {
      if (!i.expiryDate) return false;
      const exp = new Date(i.expiryDate);
      return exp <= thirtyDaysFromNow;
    });
  }, [items]);

  const overstockItems = useMemo(() => {
    return items.filter(i => i.quantity >= (i.maxQuantity || (i.minQuantity || 10) * 4));
  }, [items]);

  const totalAlertsCount = outOfStockItems.length + lowStockItems.length + expiryAlertItems.length;

  const getActiveList = () => {
    switch (activeAlertTab) {
      case 'OUT_OF_STOCK': return outOfStockItems;
      case 'LOW_STOCK': return lowStockItems;
      case 'EXPIRY': return expiryAlertItems;
      case 'OVERSTOCK': return overstockItems;
      default: return lowStockItems;
    }
  };

  const currentList = getActiveList();

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col font-sans" dir={language === 'ar' ? 'rtl' : 'ltr'}>
      
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-4 px-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-indigo-900/40">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-amber-500/20 border border-amber-400/30 rounded-xl text-amber-300 relative">
            <BellRing className="w-5 h-5 animate-bounce" />
            {totalAlertsCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-rose-500 text-white text-[10px] font-extrabold w-4 h-4 rounded-full flex items-center justify-center border border-slate-900">
                {totalAlertsCount}
              </span>
            )}
          </div>
          <div>
            <h3 className="font-extrabold text-base flex items-center gap-2">
              {t('inv.smartAlertsTitle', 'مركز تنبيهات المخزون والتموين الذكي')}
              <span className="text-[10px] bg-amber-400 text-slate-950 px-2 py-0.5 rounded-full font-extrabold">
                تنبيهات حية
              </span>
            </h3>
            <p className="text-xs text-indigo-200/80">
              تتبع تلقائي ومستمر للسلع الكاسدة، المنتهية، وتأمين نقاط إعادة الطلب (ROP)
            </p>
          </div>
        </div>

        {onNavigateToProcurement && (
          <button
            onClick={() => onNavigateToProcurement()}
            className="px-3.5 py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 font-extrabold text-xs rounded-xl shadow-md transition flex items-center gap-2 shrink-0"
          >
            <ShoppingBag className="w-4 h-4" />
            <span>{t('inv.autoPO', 'إنشاء أمر شراء تلقائي')}</span>
          </button>
        )}
      </div>

      {/* Tabs Filter Bar */}
      <div className="bg-slate-50 px-4 py-2 border-b border-slate-200 flex flex-wrap items-center gap-2 text-xs font-bold">
        <button
          onClick={() => setActiveAlertTab('LOW_STOCK')}
          className={`px-3 py-1.5 rounded-xl transition flex items-center gap-1.5 ${
            activeAlertTab === 'LOW_STOCK'
              ? 'bg-amber-500 text-slate-950 shadow-2xs font-extrabold'
              : 'text-slate-600 hover:bg-slate-200'
          }`}
        >
          <AlertTriangle className="w-3.5 h-3.5" />
          <span>تحت حد الطلب ROP</span>
          <span className="bg-white/80 text-slate-900 px-1.5 py-0.2 rounded-full text-[10px] font-mono">
            {lowStockItems.length}
          </span>
        </button>

        <button
          onClick={() => setActiveAlertTab('OUT_OF_STOCK')}
          className={`px-3 py-1.5 rounded-xl transition flex items-center gap-1.5 ${
            activeAlertTab === 'OUT_OF_STOCK'
              ? 'bg-rose-600 text-white shadow-2xs font-extrabold'
              : 'text-slate-600 hover:bg-slate-200'
          }`}
        >
          <PackageX className="w-3.5 h-3.5" />
          <span>نفاد المخزون</span>
          <span className="bg-white/20 text-white px-1.5 py-0.2 rounded-full text-[10px] font-mono">
            {outOfStockItems.length}
          </span>
        </button>

        <button
          onClick={() => setActiveAlertTab('EXPIRY')}
          className={`px-3 py-1.5 rounded-xl transition flex items-center gap-1.5 ${
            activeAlertTab === 'EXPIRY'
              ? 'bg-purple-600 text-white shadow-2xs font-extrabold'
              : 'text-slate-600 hover:bg-slate-200'
          }`}
        >
          <Clock className="w-3.5 h-3.5" />
          <span>صلاحيات قريبة</span>
          <span className="bg-white/20 text-white px-1.5 py-0.2 rounded-full text-[10px] font-mono">
            {expiryAlertItems.length}
          </span>
        </button>

        <button
          onClick={() => setActiveAlertTab('OVERSTOCK')}
          className={`px-3 py-1.5 rounded-xl transition flex items-center gap-1.5 ${
            activeAlertTab === 'OVERSTOCK'
              ? 'bg-blue-600 text-white shadow-2xs font-extrabold'
              : 'text-slate-600 hover:bg-slate-200'
          }`}
        >
          <TrendingDown className="w-3.5 h-3.5" />
          <span>فائض وراكد</span>
          <span className="bg-white/20 text-white px-1.5 py-0.2 rounded-full text-[10px] font-mono">
            {overstockItems.length}
          </span>
        </button>
      </div>

      {/* Items Alert Table / List */}
      <div className="p-4 overflow-x-auto max-h-72 overflow-y-auto">
        {currentList.length === 0 ? (
          <div className="p-8 text-center text-slate-400 space-y-2">
            <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto opacity-70" />
            <p className="text-xs font-bold text-slate-600">
              لا توجد تنبيهات لهذه الفئة حالياً! المستويات مستقرة.
            </p>
          </div>
        ) : (
          <table className="w-full text-xs text-right border-collapse">
            <thead>
              <tr className="border-b border-slate-200 text-slate-500 font-bold bg-slate-50/50">
                <th className="p-2.5">الكود والباركود</th>
                <th className="p-2.5">اسم الصنف</th>
                <th className="p-2.5 text-center">الكمية الحالية</th>
                <th className="p-2.5 text-center">حد الطلب (ROP)</th>
                <th className="p-2.5 text-center">تاريخ الصلاحية</th>
                <th className="p-2.5 text-center">الإجراء الموصى به</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {currentList.map((item) => {
                const isOutOfStock = item.quantity <= 0;
                const isLow = item.quantity > 0 && item.quantity <= (item.minQuantity || 10);
                
                return (
                  <tr key={item.id} className="hover:bg-slate-50/80 transition">
                    <td className="p-2.5 font-mono font-bold text-slate-700">
                      {item.code || item.barcode || 'N/A'}
                    </td>
                    <td className="p-2.5 font-bold text-slate-900">
                      {language === 'ar' ? item.nameAr : (item.nameEn || item.nameAr)}
                      <span className="block text-[10px] text-slate-400 font-normal">
                        {item.category}
                      </span>
                    </td>
                    <td className="p-2.5 text-center">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-extrabold font-mono ${
                        isOutOfStock 
                          ? 'bg-rose-100 text-rose-700' 
                          : isLow 
                          ? 'bg-amber-100 text-amber-800' 
                          : 'bg-blue-100 text-blue-700'
                      }`}>
                        {item.quantity} {item.unit || 'حبة'}
                      </span>
                    </td>
                    <td className="p-2.5 text-center font-mono font-bold text-slate-600">
                      {item.minQuantity || 10} {item.unit || 'حبة'}
                    </td>
                    <td className="p-2.5 text-center font-mono text-slate-500">
                      {item.expiryDate ? (
                        <span className="text-purple-700 font-bold">
                          {item.expiryDate}
                        </span>
                      ) : (
                        'غير محدد'
                      )}
                    </td>
                    <td className="p-2.5 text-center">
                      {onNavigateToProcurement ? (
                        <button
                          onClick={() => onNavigateToProcurement(item)}
                          className="px-2.5 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-lg text-[11px] font-bold transition flex items-center gap-1 mx-auto"
                        >
                          <Zap className="w-3 h-3 text-amber-500" />
                          <span>طلب توريد</span>
                        </button>
                      ) : (
                        <span className="text-[11px] text-amber-700 font-bold bg-amber-50 px-2 py-0.5 rounded">
                          يتطلب توريد
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

    </div>
  );
};
