import React, { useState } from 'react';
import { 
  Target, 
  Plus, 
  TrendingUp, 
  TrendingDown, 
  PieChart, 
  DollarSign, 
  Briefcase, 
  Percent, 
  AlertCircle,
  Download,
  X
} from 'lucide-react';
import { CostCenter, ProfitCenter, Currency } from '../types/accounting';
import { formatCurrency, convertAmount, exportToCsv } from '../utils/formatters';

interface CostControllingViewProps {
  costCenters: CostCenter[];
  profitCenters: ProfitCenter[];
  onAddCostCenter: (costCenter: CostCenter) => void;
  onAddProfitCenter: (profitCenter: ProfitCenter) => void;
  currency: Currency;
  rates: Record<Currency, number>;
}

export const CostControllingView: React.FC<CostControllingViewProps> = ({
  costCenters,
  profitCenters,
  onAddCostCenter,
  onAddProfitCenter,
  currency,
  rates,
}) => {
  const [activeTab, setActiveTab] = useState<'cost-centers' | 'profit-centers'>('cost-centers');
  const [isAddCostCenterOpen, setIsAddCostCenterOpen] = useState(false);
  const [isAddProfitCenterOpen, setIsAddProfitCenterOpen] = useState(false);

  // New Cost Center State
  const [ccCode, setCcCode] = useState('');
  const [ccNameAr, setCcNameAr] = useState('');
  const [ccManager, setCcManager] = useState('');
  const [ccBudget, setCcBudget] = useState<number>(0);

  // New Profit Center State
  const [pcCode, setPcCode] = useState('');
  const [pcNameAr, setPcNameAr] = useState('');
  const [pcManager, setPcManager] = useState('');

  const totalBudget = costCenters.reduce((s, c) => s + c.allocatedBudget, 0);
  const totalActualCost = costCenters.reduce((s, c) => s + c.actualSpent, 0);
  const totalCostVariance = totalBudget - totalActualCost;

  const totalProfitCenterRevenue = profitCenters.reduce((s, p) => s + p.totalRevenue, 0);
  const totalProfitCenterExpenses = profitCenters.reduce((s, p) => s + p.totalExpenses, 0);
  const totalProfitCenterNet = totalProfitCenterRevenue - totalProfitCenterExpenses;

  const handleCreateCostCenter = (e: React.FormEvent) => {
    e.preventDefault();
    if (!ccCode || !ccNameAr) return;

    const newCC: CostCenter = {
      id: `CC-${Date.now().toString().slice(-4)}`,
      code: ccCode,
      nameAr: ccNameAr,
      nameEn: ccNameAr,
      manager: ccManager || 'مدير القسم',
      allocatedBudget: ccBudget,
      actualSpent: 0,
      variance: ccBudget,
    };

    onAddCostCenter(newCC);
    setIsAddCostCenterOpen(false);
    setCcCode('');
    setCcNameAr('');
    setCcBudget(0);
    alert(`تم إنشاء مركز التكلفة (${newCC.nameAr}) بنجاح!`);
  };

  const handleCreateProfitCenter = (e: React.FormEvent) => {
    e.preventDefault();
    if (!pcCode || !pcNameAr) return;

    const newPC: ProfitCenter = {
      id: `PC-${Date.now().toString().slice(-4)}`,
      code: pcCode,
      nameAr: pcNameAr,
      nameEn: pcNameAr,
      manager: pcManager || 'مدير قطاع الأعمال',
      totalRevenue: 0,
      totalExpenses: 0,
      netProfit: 0,
      profitMargin: 0,
    };

    onAddProfitCenter(newPC);
    setIsAddProfitCenterOpen(false);
    setPcCode('');
    setPcNameAr('');
    alert(`تم إنشاء مركز الربحية (${newPC.nameAr}) بنجاح!`);
  };

  return (
    <div className="space-y-6">
      {/* Top Header & Tab Controls */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white border border-slate-200 p-5 rounded-xl shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <span className="bg-indigo-50 text-indigo-700 text-xs px-2.5 py-0.5 rounded-md font-mono font-bold border border-indigo-200">
              SAP T-Code: KS01 / KE51
            </span>
            <h2 className="text-lg sm:text-xl font-bold text-slate-800">محاسبة التكاليف والربحية (Controlling - CO)</h2>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            مراقبة انحرافات الموازنة التقديرية لمراكز التكلفة، وتحليل هوامش صافي الربح لمراكز ومسؤوليات الأعمال.
          </p>
        </div>

        <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl border border-slate-200">
          <button
            onClick={() => setActiveTab('cost-centers')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition ${
              activeTab === 'cost-centers' ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            مراكز التكلفة ({costCenters.length})
          </button>
          <button
            onClick={() => setActiveTab('profit-centers')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition ${
              activeTab === 'profit-centers' ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            مراكز الربحية ({profitCenters.length})
          </button>
        </div>
      </div>

      {/* TAB 1: COST CENTERS */}
      {activeTab === 'cost-centers' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white border border-slate-200 p-4 rounded-xl shadow-xs">
              <span className="text-xs text-slate-500 font-semibold block">إجمالي الموازنة التقديرية المعتمدة</span>
              <div className="text-lg font-bold text-slate-800 mt-1 font-mono">
                {formatCurrency(totalBudget, currency)}
              </div>
            </div>
            <div className="bg-white border border-slate-200 p-4 rounded-xl shadow-xs">
              <span className="text-xs text-slate-500 font-semibold block">الإنفاق الفعلي التراكمي</span>
              <div className="text-lg font-bold text-rose-600 mt-1 font-mono">
                {formatCurrency(totalActualCost, currency)}
              </div>
            </div>
            <div className="bg-white border border-slate-200 p-4 rounded-xl shadow-xs">
              <span className="text-xs text-slate-500 font-semibold block">وفر / عجز الموازنة الإجمالي</span>
              <div className={`text-lg font-bold mt-1 font-mono ${totalCostVariance >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                {formatCurrency(totalCostVariance, currency)}
              </div>
            </div>
          </div>

          <div className="flex justify-end">
            <button
              onClick={() => setIsAddCostCenterOpen(true)}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-xs transition"
            >
              <Plus className="w-4 h-4" />
              <span>إضافة مركز تكلفة جديد</span>
            </button>
          </div>

          {/* Table of Cost Centers */}
          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
            <table className="w-full text-right text-xs">
              <thead className="bg-slate-50 text-slate-700 border-b border-slate-200 font-semibold">
                <tr>
                  <th className="p-3">رمز المركز</th>
                  <th className="p-3">اسم مركز التكلفة</th>
                  <th className="p-3">المسؤول الإداري</th>
                  <th className="p-3 text-left">الموازنة التقديرية</th>
                  <th className="p-3 text-left">المنصرف الفعلي</th>
                  <th className="p-3 text-left">انحراف الموازنة (Variance)</th>
                  <th className="p-3 w-40">نسبة استهلاك الموازنة</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {costCenters.map((cc) => {
                  const percentUsed = cc.allocatedBudget > 0 ? (cc.actualSpent / cc.allocatedBudget) * 100 : 0;
                  const isOverBudget = percentUsed > 100;
                  return (
                    <tr key={cc.id} className="hover:bg-slate-50/80 transition">
                      <td className="p-3 font-mono font-bold text-indigo-700">{cc.code}</td>
                      <td className="p-3 font-semibold text-slate-800">{cc.nameAr}</td>
                      <td className="p-3 text-slate-500">{cc.manager}</td>
                      <td className="p-3 text-left font-mono font-bold text-slate-800">
                        {formatCurrency(cc.allocatedBudget, currency)}
                      </td>
                      <td className="p-3 text-left font-mono font-bold text-rose-600">
                        {formatCurrency(cc.actualSpent, currency)}
                      </td>
                      <td className="p-3 text-left font-mono font-bold">
                        <span className={cc.variance >= 0 ? 'text-emerald-600' : 'text-rose-600'}>
                          {formatCurrency(cc.variance, currency)}
                        </span>
                      </td>
                      <td className="p-3">
                        <div className="flex items-center gap-2">
                          <div className="flex-1 bg-slate-100 h-2 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all ${
                                isOverBudget ? 'bg-rose-500' : percentUsed > 80 ? 'bg-amber-500' : 'bg-emerald-500'
                              }`}
                              style={{ width: `${Math.min(100, percentUsed)}%` }}
                            />
                          </div>
                          <span className={`text-[10px] font-mono font-bold ${isOverBudget ? 'text-rose-600' : 'text-slate-600'}`}>
                            {percentUsed.toFixed(1)}%
                          </span>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 2: PROFIT CENTERS */}
      {activeTab === 'profit-centers' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white border border-slate-200 p-4 rounded-xl shadow-xs">
              <span className="text-xs text-slate-500 font-semibold block">إجمالي إيرادات مراكز الربحية</span>
              <div className="text-lg font-bold text-emerald-600 mt-1 font-mono">
                {formatCurrency(totalProfitCenterRevenue, currency)}
              </div>
            </div>
            <div className="bg-white border border-slate-200 p-4 rounded-xl shadow-xs">
              <span className="text-xs text-slate-500 font-semibold block">إجمالي التكاليف المباشرة والتشغيلية</span>
              <div className="text-lg font-bold text-rose-600 mt-1 font-mono">
                {formatCurrency(totalProfitCenterExpenses, currency)}
              </div>
            </div>
            <div className="bg-white border border-slate-200 p-4 rounded-xl shadow-xs">
              <span className="text-xs text-slate-500 font-semibold block">صافي أرباح الأعمال (Net Margin)</span>
              <div className="text-lg font-bold text-blue-600 mt-1 font-mono">
                {formatCurrency(totalProfitCenterNet, currency)}
              </div>
            </div>
          </div>

          <div className="flex justify-end">
            <button
              onClick={() => setIsAddProfitCenterOpen(true)}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-xs transition"
            >
              <Plus className="w-4 h-4" />
              <span>إضافة مركز ربحية جديد</span>
            </button>
          </div>

          {/* Table of Profit Centers */}
          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
            <table className="w-full text-right text-xs">
              <thead className="bg-slate-50 text-slate-700 border-b border-slate-200 font-semibold">
                <tr>
                  <th className="p-3">رمز المركز</th>
                  <th className="p-3">اسم مركز الربحية / القطاع</th>
                  <th className="p-3">المسؤول التنفيذي</th>
                  <th className="p-3 text-left">إجمالي الإيرادات</th>
                  <th className="p-3 text-left">التكاليف التشغيلية</th>
                  <th className="p-3 text-left">صافي الربح</th>
                  <th className="p-3 text-center">هامش الربح %</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {profitCenters.map((pc) => (
                  <tr key={pc.id} className="hover:bg-slate-50/80 transition">
                    <td className="p-3 font-mono font-bold text-emerald-600">{pc.code}</td>
                    <td className="p-3 font-semibold text-slate-800">{pc.nameAr}</td>
                    <td className="p-3 text-slate-500">{pc.manager}</td>
                    <td className="p-3 text-left font-mono font-bold text-emerald-600">
                      {formatCurrency(pc.totalRevenue, currency)}
                    </td>
                    <td className="p-3 text-left font-mono font-bold text-rose-600">
                      {formatCurrency(pc.totalExpenses, currency)}
                    </td>
                    <td className="p-3 text-left font-mono font-bold text-blue-600">
                      {formatCurrency(pc.netProfit, currency)}
                    </td>
                    <td className="p-3 text-center">
                      <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 px-2.5 py-0.5 rounded-full font-mono font-bold text-[11px]">
                        {pc.profitMargin.toFixed(1)}%
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ADD COST CENTER MODAL */}
      {isAddCostCenterOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-white border border-slate-300 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
                <Target className="w-5 h-5 text-indigo-600" />
                <span>إضافة مركز تكلفة جديد</span>
              </h3>
              <button onClick={() => setIsAddCostCenterOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateCostCenter} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">رمز مركز التكلفة (Code)</label>
                <input
                  type="text"
                  required
                  value={ccCode}
                  onChange={(e) => setCcCode(e.target.value)}
                  placeholder="مثال: CC-600"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 font-mono focus:ring-2 focus:ring-indigo-500 focus:bg-white focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">اسم مركز التكلفة بالعربية</label>
                <input
                  type="text"
                  required
                  value={ccNameAr}
                  onChange={(e) => setCcNameAr(e.target.value)}
                  placeholder="مثال: قسم الصيانة والتشغيل"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:ring-2 focus:ring-indigo-500 focus:bg-white focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">المسؤول / المشرف</label>
                <input
                  type="text"
                  value={ccManager}
                  onChange={(e) => setCcManager(e.target.value)}
                  placeholder="اسم مدير القسم..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:ring-2 focus:ring-indigo-500 focus:bg-white focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">الموازنة السنوية المعتمدة (YER)</label>
                <input
                  type="number"
                  value={ccBudget === 0 ? '' : ccBudget}
                  onChange={(e) => setCcBudget(parseFloat(e.target.value) || 0)}
                  placeholder="0.00"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-emerald-600 font-mono text-left focus:ring-2 focus:ring-indigo-500 focus:bg-white focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsAddCostCenterOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-xs"
                >
                  حفظ مركز التكلفة
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ADD PROFIT CENTER MODAL */}
      {isAddProfitCenterOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-white border border-slate-300 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
                <Briefcase className="w-5 h-5 text-indigo-600" />
                <span>إضافة مركز ربحية جديد</span>
              </h3>
              <button onClick={() => setIsAddProfitCenterOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateProfitCenter} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">رمز مركز الربحية (Code)</label>
                <input
                  type="text"
                  required
                  value={pcCode}
                  onChange={(e) => setPcCode(e.target.value)}
                  placeholder="مثال: PC-400"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 font-mono focus:ring-2 focus:ring-indigo-500 focus:bg-white focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">اسم مركز الربحية</label>
                <input
                  type="text"
                  required
                  value={pcNameAr}
                  onChange={(e) => setPcNameAr(e.target.value)}
                  placeholder="مثال: قطاع الخدمات السحابية والحلول الرقمية"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:ring-2 focus:ring-indigo-500 focus:bg-white focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">المسؤول التنفيذي</label>
                <input
                  type="text"
                  value={pcManager}
                  onChange={(e) => setPcManager(e.target.value)}
                  placeholder="اسم مدير القطاع..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:ring-2 focus:ring-indigo-500 focus:bg-white focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsAddProfitCenterOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-xs"
                >
                  حفظ مركز الربحية
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
