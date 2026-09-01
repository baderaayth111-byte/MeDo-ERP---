import React, { useState, useMemo, useRef } from 'react';
import { 
  Save, 
  Upload, 
  Download, 
  Plus, 
  History, 
  CheckCircle2, 
  RotateCcw, 
  Copy, 
  Search, 
  Filter, 
  Building, 
  FileSpreadsheet, 
  AlertCircle, 
  DollarSign, 
  Sparkles, 
  Eye,
  Sliders,
  Calendar,
  Layers,
  ArrowUpDown,
  FileText
} from 'lucide-react';
import { 
  BudgetScenario, 
  BudgetItem, 
  BudgetAuditLog 
} from '../types/budgeting';
import { Account, AccountType, Currency } from '../types/accounting';
import { formatCurrency } from '../utils/formatters';
import { 
  generateBudgetExcelTemplate, 
  parseBudgetCsvContent, 
  generateDefaultBudgetItems 
} from '../data/budgetingData';

interface BudgetSetupTabProps {
  scenarios: BudgetScenario[];
  activeScenario: BudgetScenario;
  onSelectScenario: (scenarioId: string) => void;
  onSaveScenario: (updatedScenario: BudgetScenario, logDescription: string) => void;
  onApproveScenario: (scenarioId: string) => void;
  onCreateNewScenario: (fiscalYear: number, nameAr: string, baseOnScenarioId?: string, growthRate?: number) => void;
  accounts: Account[];
  currency: Currency;
  rates: Record<Currency, number>;
}

export const BudgetSetupTab: React.FC<BudgetSetupTabProps> = ({
  scenarios,
  activeScenario,
  onSelectScenario,
  onSaveScenario,
  onApproveScenario,
  onCreateNewScenario,
  accounts,
  currency,
  rates,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTypeFilter, setSelectedTypeFilter] = useState<'ALL' | AccountType>('ALL');
  const [editedItems, setEditedItems] = useState<BudgetItem[]>(() => activeScenario.items);
  const [isDirty, setIsDirty] = useState(false);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [isNewScenarioModalOpen, setIsNewScenarioModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [importErrors, setImportErrors] = useState<string[]>([]);
  const [importSuccessMsg, setImportSuccessMsg] = useState<string | null>(null);

  // New Scenario Form State
  const [newYear, setNewYear] = useState<number>(activeScenario.fiscalYear + 1);
  const [newScenarioName, setNewScenarioName] = useState('');
  const [copyBaseScenarioId, setCopyBaseScenarioId] = useState<string>(activeScenario.id);
  const [growthRatePercent, setGrowthRatePercent] = useState<number>(10);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Synchronize local edited items when active scenario changes
  React.useEffect(() => {
    setEditedItems(activeScenario.items);
    setIsDirty(false);
    setImportErrors([]);
    setImportSuccessMsg(null);
  }, [activeScenario]);

  // Handle inline change for annual budget
  const handleAnnualBudgetChange = (accountCode: string, value: number) => {
    setEditedItems(prev => prev.map(item => {
      if (item.accountCode === accountCode) {
        const val = Math.max(0, value);
        const q1 = Math.round(val * 0.25);
        const q2 = Math.round(val * 0.25);
        const q3 = Math.round(val * 0.25);
        const q4 = val - (q1 + q2 + q3);
        return {
          ...item,
          annualBudget: val,
          quarterly: { q1, q2, q3, q4 },
        };
      }
      return item;
    }));
    setIsDirty(true);
  };

  // Handle granular quarter change
  const handleQuarterChange = (accountCode: string, qKey: 'q1' | 'q2' | 'q3' | 'q4', value: number) => {
    setEditedItems(prev => prev.map(item => {
      if (item.accountCode === accountCode) {
        const newQuarterly = {
          ...item.quarterly,
          [qKey]: Math.max(0, value),
        };
        const newAnnual = newQuarterly.q1 + newQuarterly.q2 + newQuarterly.q3 + newQuarterly.q4;
        return {
          ...item,
          annualBudget: newAnnual,
          quarterly: newQuarterly,
        };
      }
      return item;
    }));
    setIsDirty(true);
  };

  // Handle threshold edit
  const handleThresholdChange = (accountCode: string, field: 'warningThresholdPercent' | 'criticalThresholdPercent', val: number) => {
    setEditedItems(prev => prev.map(item => {
      if (item.accountCode === accountCode) {
        return {
          ...item,
          [field]: Math.max(1, Math.min(200, val)),
        };
      }
      return item;
    }));
    setIsDirty(true);
  };

  // Auto-distribute all items evenly
  const handleAutoDistributeAll = () => {
    setEditedItems(prev => prev.map(item => {
      const q1 = Math.round(item.annualBudget * 0.25);
      const q2 = Math.round(item.annualBudget * 0.25);
      const q3 = Math.round(item.annualBudget * 0.25);
      const q4 = item.annualBudget - (q1 + q2 + q3);
      return {
        ...item,
        quarterly: { q1, q2, q3, q4 }
      };
    }));
    setIsDirty(true);
  };

  // Save changes
  const handleSave = () => {
    const totalRev = editedItems.filter(i => i.accountType === 'REVENUE').reduce((sum, i) => sum + i.annualBudget, 0);
    const totalExp = editedItems.filter(i => i.accountType === 'EXPENSE').reduce((sum, i) => sum + i.annualBudget, 0);
    const totalCapex = editedItems.filter(i => i.accountType === 'ASSET' && i.category.includes('غير متداولة')).reduce((sum, i) => sum + i.annualBudget, 0);

    const updatedScenario: BudgetScenario = {
      ...activeScenario,
      items: editedItems,
      totalRevenueBudget: totalRev,
      totalExpenseBudget: totalExp,
      netBudgetedProfit: totalRev - totalExp,
      totalCapexBudget: totalCapex,
      updatedAt: new Date().toISOString(),
    };

    onSaveScenario(updatedScenario, `تحديث وتعديل قيم الموازنة التقديرية (${editedItems.length} حساب)`);
    setIsDirty(false);
  };

  // Export Excel / CSV Template
  const handleDownloadTemplate = () => {
    const csvContent = generateBudgetExcelTemplate(activeScenario);
    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `Budget_Template_${activeScenario.fiscalYear}_${activeScenario.code}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Handle Excel/CSV File Upload
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        const { updatedItems, errors } = parseBudgetCsvContent(text, activeScenario);
        if (errors.length > 0) {
          setImportErrors(errors);
        } else {
          setImportErrors([]);
        }
        setEditedItems(updatedItems);
        setIsDirty(true);
        setImportSuccessMsg(`تم استيراد بيانات ${updatedItems.length} حساب بنجاح من الملف.`);
      } catch (err: any) {
        setImportErrors([`حدث خطأ أثناء معالجة الملف: ${err.message || err}`]);
      }
    };
    reader.readAsText(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // Filtered items for display
  const filteredItems = useMemo(() => {
    return editedItems.filter(item => {
      const matchType = selectedTypeFilter === 'ALL' || item.accountType === selectedTypeFilter;
      const q = searchQuery.trim().toLowerCase();
      const matchQuery = !q || 
        item.accountCode.toLowerCase().includes(q) || 
        item.accountNameAr.toLowerCase().includes(q) || 
        item.accountNameEn.toLowerCase().includes(q) ||
        item.category.toLowerCase().includes(q);
      return matchType && matchQuery;
    });
  }, [editedItems, selectedTypeFilter, searchQuery]);

  // Totals calculations
  const totals = useMemo(() => {
    const revenues = editedItems.filter(i => i.accountType === 'REVENUE').reduce((sum, i) => sum + i.annualBudget, 0);
    const expenses = editedItems.filter(i => i.accountType === 'EXPENSE').reduce((sum, i) => sum + i.annualBudget, 0);
    const assets = editedItems.filter(i => i.accountType === 'ASSET').reduce((sum, i) => sum + i.annualBudget, 0);
    const netProfit = revenues - expenses;
    return { revenues, expenses, assets, netProfit };
  }, [editedItems]);

  return (
    <div className="space-y-4">
      {/* Top Controls Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
          {/* Fiscal Year & Scenario Selector */}
          <div className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-indigo-900" />
            <span className="text-xs font-black text-slate-700">السنة المالية:</span>
            <select
              value={activeScenario.id}
              onChange={(e) => onSelectScenario(e.target.value)}
              className="bg-slate-50 border border-slate-300 text-xs font-black text-slate-900 rounded-xl px-3 py-2 focus:ring-2 focus:ring-indigo-500 cursor-pointer"
            >
              {scenarios.map(s => (
                <option key={s.id} value={s.id}>
                  {s.fiscalYear} - {s.nameAr} ({s.status === 'ACTIVE' ? 'نشطة معتمدة' : s.status === 'APPROVED' ? 'معتمدة' : 'مسودة'})
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2">
            <span className={`px-2.5 py-1 rounded-lg text-xs font-black border ${
              activeScenario.status === 'ACTIVE'
                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                : activeScenario.status === 'APPROVED'
                ? 'bg-blue-50 text-blue-700 border-blue-200'
                : 'bg-amber-50 text-amber-700 border-amber-200'
            }`}>
              {activeScenario.status === 'ACTIVE' ? '● موازنة نشطة ونافذة' : activeScenario.status === 'APPROVED' ? '● معتمدة' : '○ مسودة قيد الإعداد'}
            </span>
            <span className="text-[11px] text-slate-500">
              الإصدار v{activeScenario.version}.0
            </span>
          </div>

          <button
            onClick={() => setIsNewScenarioModalOpen(true)}
            className="bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold px-3 py-2 rounded-xl transition flex items-center gap-1.5 cursor-pointer"
            title="إنشاء موازنة لسنة جديدة أو سيناريو بديل"
          >
            <Plus className="w-3.5 h-3.5 text-slate-600" />
            <span>خطة سنة جديدة</span>
          </button>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto justify-end">
          <button
            onClick={() => setIsHistoryModalOpen(true)}
            className="bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 text-xs font-bold px-3 py-2 rounded-xl transition flex items-center gap-1.5 cursor-pointer"
          >
            <History className="w-4 h-4 text-slate-500" />
            <span>سجل التدقيق ({activeScenario.auditHistory?.length || 0})</span>
          </button>

          <button
            onClick={handleDownloadTemplate}
            className="bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 text-xs font-bold px-3 py-2 rounded-xl transition flex items-center gap-1.5 cursor-pointer"
            title="تحميل قالب Excel للموازنة"
          >
            <Download className="w-4 h-4 text-slate-500" />
            <span className="hidden sm:inline">قالب Excel</span>
          </button>

          <button
            onClick={() => setIsImportModalOpen(true)}
            className="bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 text-xs font-bold px-3 py-2 rounded-xl transition flex items-center gap-1.5 cursor-pointer"
            title="استيراد الموازنة من ملف Excel / CSV"
          >
            <Upload className="w-4 h-4 text-indigo-600" />
            <span>استيراد Excel</span>
          </button>

          <button
            onClick={handleAutoDistributeAll}
            className="bg-indigo-50 hover:bg-indigo-100 text-indigo-900 border border-indigo-200 text-xs font-bold px-3 py-2 rounded-xl transition flex items-center gap-1.5 cursor-pointer"
            title="إعادة توزيع المبالغ السنوية على الأرباع بالتساوي 25%"
          >
            <RotateCcw className="w-3.5 h-3.5 text-indigo-600" />
            <span className="hidden sm:inline">توزيع ربع سنوي متساوي</span>
          </button>

          {activeScenario.status === 'DRAFT' && (
            <button
              onClick={() => onApproveScenario(activeScenario.id)}
              className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black px-3.5 py-2 rounded-xl transition shadow flex items-center gap-1.5 cursor-pointer"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>اعتماد الموازنة</span>
            </button>
          )}

          <button
            onClick={handleSave}
            disabled={!isDirty}
            className={`text-xs font-black px-4 py-2 rounded-xl transition shadow flex items-center gap-1.5 cursor-pointer ${
              isDirty 
                ? 'bg-amber-500 hover:bg-amber-400 text-slate-950 ring-2 ring-amber-400/40 animate-pulse'
                : 'bg-slate-200 text-slate-500 cursor-not-allowed'
            }`}
          >
            <Save className="w-4 h-4" />
            <span>حفظ التعديلات {isDirty && '*'}</span>
          </button>
        </div>
      </div>

      {/* Import Notification Banner */}
      {importSuccessMsg && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-900 p-3.5 rounded-xl text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{importSuccessMsg}</span>
          </div>
          <button onClick={() => setImportSuccessMsg(null)} className="text-emerald-700 font-bold hover:underline">إغلاق</button>
        </div>
      )}

      {/* Budget Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="bg-gradient-to-br from-emerald-900 to-emerald-950 text-white p-4 rounded-2xl border border-emerald-800/60 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs text-emerald-200 font-bold">إجمالي الإيرادات التقديرية</span>
            <span className="p-1.5 bg-emerald-500/20 rounded-lg text-emerald-300 font-mono text-xs">REVENUE</span>
          </div>
          <div className="text-xl font-black font-mono mt-2 text-emerald-100">
            {formatCurrency(totals.revenues, currency, rates)}
          </div>
          <p className="text-[11px] text-emerald-300/80 mt-1">المستهدف السنوي لكافة فروع الشركة</p>
        </div>

        <div className="bg-gradient-to-br from-rose-900 to-rose-950 text-white p-4 rounded-2xl border border-rose-800/60 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs text-rose-200 font-bold">سقف المصروفات التشغيلية</span>
            <span className="p-1.5 bg-rose-500/20 rounded-lg text-rose-300 font-mono text-xs">EXPENSE</span>
          </div>
          <div className="text-xl font-black font-mono mt-2 text-rose-100">
            {formatCurrency(totals.expenses, currency, rates)}
          </div>
          <p className="text-[11px] text-rose-300/80 mt-1">الموازنة القصوى المعتمدة للإنفاق</p>
        </div>

        <div className="bg-gradient-to-br from-indigo-900 to-indigo-950 text-white p-4 rounded-2xl border border-indigo-800/60 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs text-indigo-200 font-bold">صافي الأرباح المستهدفة</span>
            <span className="p-1.5 bg-indigo-500/20 rounded-lg text-indigo-300 font-mono text-xs">NET TARGET</span>
          </div>
          <div className="text-xl font-black font-mono mt-2 text-amber-300">
            {formatCurrency(totals.netProfit, currency, rates)}
          </div>
          <p className="text-[11px] text-indigo-300/80 mt-1">هامش الربح التقديري المتوقع</p>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-500 font-bold">عدد بنود الحسابات</span>
            <span className="p-1.5 bg-slate-100 rounded-lg text-slate-700 font-bold text-xs">COA</span>
          </div>
          <div className="text-xl font-black font-mono mt-2 text-slate-900">
            {editedItems.length} حساب
          </div>
          <p className="text-[11px] text-slate-400 mt-1">ربط محاسبي كامل 100% مع دليل الحسابات</p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row items-center justify-between gap-3">
        {/* Search */}
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute right-3 top-3" />
          <input
            type="text"
            placeholder="بحث برقم الحساب أو الاسم أو التصنيف..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 text-xs rounded-xl pr-9 pl-3 py-2.5 focus:bg-white focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        {/* Type Category Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto pb-1 md:pb-0">
          <button
            onClick={() => setSelectedTypeFilter('ALL')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer shrink-0 ${
              selectedTypeFilter === 'ALL'
                ? 'bg-indigo-900 text-white shadow-2xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            الكل ({editedItems.length})
          </button>
          <button
            onClick={() => setSelectedTypeFilter('REVENUE')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer shrink-0 ${
              selectedTypeFilter === 'REVENUE'
                ? 'bg-emerald-700 text-white shadow-2xs'
                : 'bg-slate-100 text-emerald-800 hover:bg-emerald-50'
            }`}
          >
            الإيرادات ({editedItems.filter(i => i.accountType === 'REVENUE').length})
          </button>
          <button
            onClick={() => setSelectedTypeFilter('EXPENSE')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer shrink-0 ${
              selectedTypeFilter === 'EXPENSE'
                ? 'bg-rose-700 text-white shadow-2xs'
                : 'bg-slate-100 text-rose-800 hover:bg-rose-50'
            }`}
          >
            المصروفات ({editedItems.filter(i => i.accountType === 'EXPENSE').length})
          </button>
          <button
            onClick={() => setSelectedTypeFilter('ASSET')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer shrink-0 ${
              selectedTypeFilter === 'ASSET'
                ? 'bg-blue-700 text-white shadow-2xs'
                : 'bg-slate-100 text-blue-800 hover:bg-blue-50'
            }`}
          >
            الأصول والرأسمالية ({editedItems.filter(i => i.accountType === 'ASSET').length})
          </button>
        </div>
      </div>

      {/* SAP-Style Inline Editable Table Grid */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="px-4 py-3 bg-slate-900 text-white flex items-center justify-between text-xs font-bold">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-amber-400" />
            <span>جدول بيانات الموازنة التقديرية (SAP Data Grid View)</span>
          </div>
          <span className="text-[11px] text-slate-300">
            يمكنك التعديل المباشر على الحقول وسيتم حساب وتحديث الأرباع تلقائياً
          </span>
        </div>

        <div className="overflow-x-auto max-h-[580px] scrollbar-thin">
          <table className="w-full text-right border-collapse text-xs">
            <thead className="bg-slate-100 sticky top-0 z-10 text-slate-700 font-bold border-b border-slate-200 shadow-xs">
              <tr>
                <th className="py-3 px-3 w-24">رمز الحساب</th>
                <th className="py-3 px-3 min-w-[180px]">اسم الحساب المحاسبي</th>
                <th className="py-3 px-2 w-28">النوع / التصنيف</th>
                <th className="py-3 px-3 w-40 text-center bg-indigo-50/70 border-x border-indigo-100">
                  الموازنة السنوية (YER)
                </th>
                <th className="py-3 px-2 w-32 text-center">الربع الأول (Q1)</th>
                <th className="py-3 px-2 w-32 text-center">الربع الثاني (Q2)</th>
                <th className="py-3 px-2 w-32 text-center">الربع الثالث (Q3)</th>
                <th className="py-3 px-2 w-32 text-center">الربع الرابع (Q4)</th>
                <th className="py-3 px-2 w-24 text-center">حد التنبيه %</th>
                <th className="py-3 px-2 w-24 text-center">سقف الحرج %</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-sans">
              {filteredItems.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-12 text-center text-slate-400">
                    لا توجد حسابات مطابقة لمعايير البحث المحددة
                  </td>
                </tr>
              ) : (
                filteredItems.map((item, idx) => {
                  const isRev = item.accountType === 'REVENUE';
                  const isExp = item.accountType === 'EXPENSE';
                  return (
                    <tr 
                      key={item.accountCode} 
                      className={`hover:bg-indigo-50/40 transition-colors ${idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'}`}
                    >
                      <td className="py-2.5 px-3 font-mono font-black text-slate-900">
                        {item.accountCode}
                      </td>
                      <td className="py-2.5 px-3">
                        <div className="font-bold text-slate-900">{item.accountNameAr}</div>
                        <div className="text-[10px] text-slate-400 font-sans">{item.accountNameEn}</div>
                      </td>
                      <td className="py-2.5 px-2">
                        <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-black ${
                          isRev 
                            ? 'bg-emerald-100 text-emerald-800' 
                            : isExp 
                            ? 'bg-rose-100 text-rose-800' 
                            : 'bg-blue-100 text-blue-800'
                        }`}>
                          {isRev ? 'إيراد' : isExp ? 'مصروف' : 'أصل / أخرى'}
                        </span>
                        <div className="text-[10px] text-slate-400 truncate max-w-[100px]">{item.category}</div>
                      </td>

                      {/* Annual Budget Input */}
                      <td className="py-2 px-2 bg-indigo-50/40 border-x border-indigo-100">
                        <input
                          type="number"
                          value={item.annualBudget}
                          onChange={(e) => handleAnnualBudgetChange(item.accountCode, parseFloat(e.target.value) || 0)}
                          className="w-full text-left font-mono font-black text-xs bg-white border border-indigo-200 rounded-lg px-2.5 py-1.5 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-indigo-950"
                        />
                      </td>

                      {/* Q1 */}
                      <td className="py-2 px-1.5">
                        <input
                          type="number"
                          value={item.quarterly.q1}
                          onChange={(e) => handleQuarterChange(item.accountCode, 'q1', parseFloat(e.target.value) || 0)}
                          className="w-full text-left font-mono text-[11px] bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 focus:bg-white focus:ring-1 focus:ring-indigo-500"
                        />
                      </td>

                      {/* Q2 */}
                      <td className="py-2 px-1.5">
                        <input
                          type="number"
                          value={item.quarterly.q2}
                          onChange={(e) => handleQuarterChange(item.accountCode, 'q2', parseFloat(e.target.value) || 0)}
                          className="w-full text-left font-mono text-[11px] bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 focus:bg-white focus:ring-1 focus:ring-indigo-500"
                        />
                      </td>

                      {/* Q3 */}
                      <td className="py-2 px-1.5">
                        <input
                          type="number"
                          value={item.quarterly.q3}
                          onChange={(e) => handleQuarterChange(item.accountCode, 'q3', parseFloat(e.target.value) || 0)}
                          className="w-full text-left font-mono text-[11px] bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 focus:bg-white focus:ring-1 focus:ring-indigo-500"
                        />
                      </td>

                      {/* Q4 */}
                      <td className="py-2 px-1.5">
                        <input
                          type="number"
                          value={item.quarterly.q4}
                          onChange={(e) => handleQuarterChange(item.accountCode, 'q4', parseFloat(e.target.value) || 0)}
                          className="w-full text-left font-mono text-[11px] bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 focus:bg-white focus:ring-1 focus:ring-indigo-500"
                        />
                      </td>

                      {/* Warning Threshold */}
                      <td className="py-2 px-1.5 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <input
                            type="number"
                            min="1"
                            max="200"
                            value={item.warningThresholdPercent || 80}
                            onChange={(e) => handleThresholdChange(item.accountCode, 'warningThresholdPercent', parseInt(e.target.value) || 80)}
                            className="w-12 text-center font-mono text-[11px] bg-amber-50/60 border border-amber-200 rounded-lg py-1 text-amber-900 font-bold"
                          />
                          <span className="text-[10px] text-slate-400">%</span>
                        </div>
                      </td>

                      {/* Critical Threshold */}
                      <td className="py-2 px-1.5 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <input
                            type="number"
                            min="1"
                            max="300"
                            value={item.criticalThresholdPercent || 100}
                            onChange={(e) => handleThresholdChange(item.accountCode, 'criticalThresholdPercent', parseInt(e.target.value) || 100)}
                            className="w-12 text-center font-mono text-[11px] bg-rose-50/60 border border-rose-200 rounded-lg py-1 text-rose-900 font-bold"
                          />
                          <span className="text-[10px] text-slate-400">%</span>
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

      {/* AUDIT LOG MODAL */}
      {isHistoryModalOpen && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl max-w-2xl w-full shadow-2xl overflow-hidden border border-slate-200">
            <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <History className="w-5 h-5 text-amber-400" />
                <h3 className="font-black text-sm">سجل التدقيق والتعديلات (Budget Audit Trail)</h3>
              </div>
              <button onClick={() => setIsHistoryModalOpen(false)} className="text-slate-400 hover:text-white font-bold text-lg cursor-pointer">✕</button>
            </div>
            
            <div className="p-6 max-h-[480px] overflow-y-auto space-y-3">
              {activeScenario.auditHistory && activeScenario.auditHistory.length > 0 ? (
                activeScenario.auditHistory.map((log) => (
                  <div key={log.id} className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-black text-indigo-900">{log.user} ({log.userRole || 'مستخدم النظام'})</span>
                      <span className="text-slate-400 font-mono">{new Date(log.timestamp).toLocaleString('ar-YE')}</span>
                    </div>
                    <p className="text-xs text-slate-700 mt-2 font-medium">{log.description}</p>
                    <div className="mt-2 flex items-center gap-2 text-[10px] text-slate-500">
                      <span className="bg-slate-200 px-2 py-0.5 rounded font-mono font-bold">{log.action}</span>
                      {log.affectedAccountsCount && (
                        <span>تأثر {log.affectedAccountsCount} حساب</span>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-center text-xs text-slate-500 py-8">لا توجد سجلات تدقيق سابقة لهذه الموازنة</p>
              )}
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end">
              <button
                onClick={() => setIsHistoryModalOpen(false)}
                className="bg-slate-800 text-white text-xs font-bold px-4 py-2 rounded-xl"
              >
                إغلاق
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CREATE NEW SCENARIO MODAL */}
      {isNewScenarioModalOpen && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full shadow-2xl overflow-hidden border border-slate-200">
            <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Plus className="w-5 h-5 text-amber-400" />
                <h3 className="font-black text-sm">إنشاء موازنة تقديرية لسنة مالية جديدة</h3>
              </div>
              <button onClick={() => setIsNewScenarioModalOpen(false)} className="text-slate-400 hover:text-white font-bold text-lg cursor-pointer">✕</button>
            </div>

            <div className="p-6 space-y-4 text-xs">
              <div>
                <label className="block font-black text-slate-700 mb-1">السنة المالية المستهدفة:</label>
                <input
                  type="number"
                  value={newYear}
                  onChange={(e) => setNewYear(parseInt(e.target.value) || 2027)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 font-mono font-black"
                />
              </div>

              <div>
                <label className="block font-black text-slate-700 mb-1">مسمى خطة الموازنة (عربي):</label>
                <input
                  type="text"
                  placeholder="مثلاً: الموازنة التقديرية التشغيلية - 2027"
                  value={newScenarioName}
                  onChange={(e) => setNewScenarioName(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 font-bold"
                />
              </div>

              <div>
                <label className="block font-black text-slate-700 mb-1">النسخ والاشتقاق من موازنة سابقة:</label>
                <select
                  value={copyBaseScenarioId}
                  onChange={(e) => setCopyBaseScenarioId(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 font-bold"
                >
                  <option value="">-- إنشاء موازنة جديدة فارغة --</option>
                  {scenarios.map(s => (
                    <option key={s.id} value={s.id}>نسخ من: {s.fiscalYear} - {s.nameAr}</option>
                  ))}
                </select>
              </div>

              {copyBaseScenarioId && (
                <div>
                  <label className="block font-black text-slate-700 mb-1">نسبة النمو / التضخم المتوقعة (%):</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      value={growthRatePercent}
                      onChange={(e) => setGrowthRatePercent(parseFloat(e.target.value) || 0)}
                      className="w-24 bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 font-mono font-black text-center"
                    />
                    <span className="text-slate-500 font-medium">% (سيتم زيادة المبالغ التقديرية بهذه النسبة)</span>
                  </div>
                </div>
              )}
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end gap-2">
              <button
                onClick={() => setIsNewScenarioModalOpen(false)}
                className="bg-slate-200 text-slate-700 text-xs font-bold px-4 py-2 rounded-xl"
              >
                إلغاء
              </button>
              <button
                onClick={() => {
                  const title = newScenarioName.trim() || `الموازنة التقديرية لسنة ${newYear}`;
                  onCreateNewScenario(newYear, title, copyBaseScenarioId || undefined, (100 + growthRatePercent) / 100);
                  setIsNewScenarioModalOpen(false);
                }}
                className="bg-indigo-900 hover:bg-indigo-800 text-white text-xs font-black px-5 py-2 rounded-xl transition shadow"
              >
                إنشاء الموازنة الآن
              </button>
            </div>
          </div>
        </div>
      )}

      {/* IMPORT EXCEL MODAL */}
      {isImportModalOpen && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full shadow-2xl overflow-hidden border border-slate-200">
            <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileSpreadsheet className="w-5 h-5 text-emerald-400" />
                <h3 className="font-black text-sm">استيراد الموازنة من ملف Excel / CSV</h3>
              </div>
              <button onClick={() => setIsImportModalOpen(false)} className="text-slate-400 hover:text-white font-bold text-lg cursor-pointer">✕</button>
            </div>

            <div className="p-6 space-y-4 text-xs">
              <p className="text-slate-600 leading-relaxed">
                يمكنك تجهيز موازنة المنشأة وتعبئتها في ملف Excel ثم رفعها مباشرة لتحديث جميع الحسابات بدقة متناهية.
              </p>

              <div className="bg-amber-50 border border-amber-200 p-3.5 rounded-2xl text-amber-900">
                <div className="font-black mb-1">تعليمات الاستيراد:</div>
                <ul className="list-disc list-inside space-y-1 text-[11px] text-amber-800">
                  <li>قم بتحميل "قالب Excel" للتأكد من مطابقة أسماء الأعمدة وأرقام الحسابات.</li>
                  <li>تأكد من عدم تغيير أرقام الحسابات في العمود الأول (AccountCode).</li>
                  <li>الملف يدعم صيغ CSV المنفصلة بفواصل.</li>
                </ul>
              </div>

              <div className="border-2 border-dashed border-slate-300 hover:border-indigo-500 rounded-2xl p-6 text-center cursor-pointer transition bg-slate-50 hover:bg-indigo-50/20"
                onClick={() => fileInputRef.current?.click()}
              >
                <Upload className="w-8 h-8 text-indigo-600 mx-auto mb-2" />
                <span className="font-black text-slate-800 block">انقر لاختيار ملف Excel / CSV من جهازك</span>
                <span className="text-[11px] text-slate-400 mt-1 block">يدعم ملفات .csv و .xlsx المعالجة</span>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv,text/csv"
                  onChange={(e) => {
                    handleFileUpload(e);
                    setIsImportModalOpen(false);
                  }}
                  className="hidden"
                />
              </div>

              {importErrors.length > 0 && (
                <div className="bg-rose-50 border border-rose-200 text-rose-900 p-3 rounded-xl max-h-32 overflow-y-auto">
                  <div className="font-black mb-1">تنبيهات أثناء الاستيراد:</div>
                  {importErrors.map((err, i) => (
                    <div key={i} className="text-[11px] text-rose-700">• {err}</div>
                  ))}
                </div>
              )}
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-between items-center">
              <button
                onClick={handleDownloadTemplate}
                className="text-indigo-700 font-black text-xs hover:underline flex items-center gap-1"
              >
                <Download className="w-3.5 h-3.5" />
                تحميل نموذج الموازنة الفارغ
              </button>
              <button
                onClick={() => setIsImportModalOpen(false)}
                className="bg-slate-200 text-slate-700 text-xs font-bold px-4 py-2 rounded-xl"
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
