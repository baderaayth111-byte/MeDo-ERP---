import React, { useState, useMemo } from 'react';
import { 
  BarChart3, 
  TrendingUp, 
  TrendingDown, 
  Printer, 
  Download, 
  Filter, 
  Search, 
  AlertTriangle, 
  CheckCircle2, 
  Building, 
  Scale, 
  Calendar, 
  PieChart as PieIcon, 
  ArrowUpRight, 
  ArrowDownLeft, 
  SlidersHorizontal,
  FileSpreadsheet,
  FileText,
  HelpCircle,
  Clock,
  Layers,
  ChevronDown,
  Sparkles,
  Share2,
  FileCheck2
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer, 
  Cell, 
  RadialBarChart, 
  RadialBar 
} from 'recharts';
import { 
  BudgetScenario, 
  BudgetVarianceRecord, 
  BudgetPeriod,
  BudgetAlertConfig
} from '../types/budgeting';
import { Account, JournalEntry, Currency, CompanyProfile, AccountType } from '../types/accounting';
import { formatCurrency } from '../utils/formatters';
import { CompanyHeaderView } from './CompanyHeaderView';
import { computeBudgetVariances, defaultBudgetAlertConfig } from '../data/budgetingData';
import { 
  exportDetailedBudgetVarianceExcel, 
  exportCategorySummaryBudgetExcel, 
  getPeriodLabelAr 
} from '../utils/budgetExportUtils';
import { BudgetPdfReportModal } from './BudgetPdfReportModal';

interface BudgetVarianceTabProps {
  scenarios: BudgetScenario[];
  activeScenario: BudgetScenario;
  onSelectScenario: (scenarioId: string) => void;
  accounts: Account[];
  journalEntries: JournalEntry[];
  companyProfile: CompanyProfile;
  currency: Currency;
  rates: Record<Currency, number>;
  alertConfig?: BudgetAlertConfig;
  onNavigateToGeneralLedger?: () => void;
}

export const BudgetVarianceTab: React.FC<BudgetVarianceTabProps> = ({
  scenarios,
  activeScenario,
  onSelectScenario,
  accounts,
  journalEntries,
  companyProfile,
  currency,
  rates,
  alertConfig = defaultBudgetAlertConfig,
  onNavigateToGeneralLedger,
}) => {
  const [selectedPeriod, setSelectedPeriod] = useState<BudgetPeriod>('FULL_YEAR');
  const [selectedTypeFilter, setSelectedTypeFilter] = useState<'ALL' | AccountType>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [isPdfModalOpen, setIsPdfModalOpen] = useState(false);
  const [isExportMenuOpen, setIsExportMenuOpen] = useState(false);

  // Compute all variances for active scenario and period
  const variances = useMemo(() => {
    return computeBudgetVariances(
      activeScenario,
      accounts,
      journalEntries,
      selectedPeriod,
      'ALL',
      alertConfig
    );
  }, [activeScenario, accounts, journalEntries, selectedPeriod, alertConfig]);

  // Filtered Variances for table display
  const filteredVariances = useMemo(() => {
    return variances.filter(v => {
      const matchType = selectedTypeFilter === 'ALL' || v.accountType === selectedTypeFilter;
      const q = searchQuery.trim().toLowerCase();
      const matchQuery = !q || 
        v.accountCode.toLowerCase().includes(q) || 
        v.accountNameAr.toLowerCase().includes(q) ||
        v.category.toLowerCase().includes(q);
      
      let matchStatus = true;
      if (statusFilter === 'OVER_BUDGET') matchStatus = v.isOverBudget;
      else if (statusFilter === 'WARNING') matchStatus = v.isWarning;
      else if (statusFilter === 'FAVORABLE') matchStatus = v.isFavorable;
      else if (statusFilter === 'UNFAVORABLE') matchStatus = !v.isFavorable;

      return matchType && matchQuery && matchStatus;
    });
  }, [variances, selectedTypeFilter, searchQuery, statusFilter]);

  // Executive Totals Summary
  const totals = useMemo(() => {
    const revenueRecords = variances.filter(v => v.accountType === 'REVENUE');
    const expenseRecords = variances.filter(v => v.accountType === 'EXPENSE');

    const totalBudgetRevenue = revenueRecords.reduce((sum, v) => sum + v.budgetAmount, 0);
    const totalActualRevenue = revenueRecords.reduce((sum, v) => sum + v.actualAmount, 0);
    const revenueVariance = totalActualRevenue - totalBudgetRevenue;
    const revenueAchievementRate = totalBudgetRevenue > 0 ? (totalActualRevenue / totalBudgetRevenue) * 100 : 0;

    const totalBudgetExpense = expenseRecords.reduce((sum, v) => sum + v.budgetAmount, 0);
    const totalActualExpense = expenseRecords.reduce((sum, v) => sum + v.actualAmount, 0);
    const expenseVariance = totalBudgetExpense - totalActualExpense; // Positive = Savings
    const expenseSpendingRate = totalBudgetExpense > 0 ? (totalActualExpense / totalBudgetExpense) * 100 : 0;

    const netBudgetProfit = totalBudgetRevenue - totalBudgetExpense;
    const netActualProfit = totalActualRevenue - totalActualExpense;
    const netProfitVariance = netActualProfit - netBudgetProfit;

    const overBudgetCount = expenseRecords.filter(v => v.isOverBudget).length;
    const warningCount = variances.filter(v => v.isWarning).length;

    return {
      totalBudgetRevenue,
      totalActualRevenue,
      revenueVariance,
      revenueAchievementRate,
      totalBudgetExpense,
      totalActualExpense,
      expenseVariance,
      expenseSpendingRate,
      netBudgetProfit,
      netActualProfit,
      netProfitVariance,
      overBudgetCount,
      warningCount,
    };
  }, [variances]);

  // Prepare Data for Comparison Chart (Top Accounts)
  const chartData = useMemo(() => {
    return variances
      .filter(v => (v.accountType === 'REVENUE' || v.accountType === 'EXPENSE') && v.budgetAmount > 0)
      .slice(0, 8)
      .map(v => ({
        name: v.accountNameAr.length > 18 ? v.accountNameAr.substring(0, 16) + '..' : v.accountNameAr,
        code: v.accountCode,
        'الموازنة التقديرية': Math.round(v.budgetAmount / 1000000), // In Millions YER
        'الفعلي حتى اليوم': Math.round(v.actualAmount / 1000000),
        completionRate: Math.round(v.completionRate),
        type: v.accountType,
      }));
  }, [variances]);

  // Export Handlers
  const handleExportDetailedExcel = () => {
    exportDetailedBudgetVarianceExcel(
      activeScenario,
      filteredVariances,
      companyProfile,
      selectedPeriod,
      currency,
      rates
    );
    setIsExportMenuOpen(false);
  };

  const handleExportCategoryExcel = () => {
    exportCategorySummaryBudgetExcel(
      activeScenario,
      variances,
      companyProfile,
      selectedPeriod,
      currency
    );
    setIsExportMenuOpen(false);
  };

  // Trigger Direct Print
  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-4">
      {/* Printable Report Header for Official Export / Printing */}
      <div className="hidden print:block bg-white p-6 border-b-2 border-slate-900 mb-6 text-slate-900 font-sans">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <CompanyHeaderView align="right" size="lg" />
            <p className="text-xs text-slate-600 mt-1">{companyProfile.activityDescription}</p>
            <p className="text-xs text-slate-500 font-mono">الرقم الضريبي: {companyProfile.taxNumber}</p>
          </div>
          <div className="text-left">
            <h2 className="text-lg font-black text-indigo-900">تقرير مقارنة الموازنة التقديرية بالأداء الفعلي</h2>
            <p className="text-xs text-slate-700 font-bold">السنة المالية: {activeScenario.fiscalYear} - الفترة: {getPeriodLabelAr(selectedPeriod)}</p>
            <p className="text-xs text-slate-500 font-mono">تاريخ الطباعة: {new Date().toLocaleDateString('ar-YE')}</p>
          </div>
        </div>
      </div>

      {/* Control & Filtering Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 print:hidden">
        <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
          {/* Fiscal Year & Scenario */}
          <div className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-indigo-900" />
            <span className="text-xs font-black text-slate-700">الموازنة:</span>
            <select
              value={activeScenario.id}
              onChange={(e) => onSelectScenario(e.target.value)}
              className="bg-slate-50 border border-slate-300 text-xs font-black text-slate-900 rounded-xl px-3 py-2 focus:ring-2 focus:ring-indigo-500 cursor-pointer"
            >
              {scenarios.map(s => (
                <option key={s.id} value={s.id}>
                  {s.fiscalYear} - {s.nameAr}
                </option>
              ))}
            </select>
          </div>

          {/* Period Selector (Year / Quarters / Months) */}
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-slate-500" />
            <span className="text-xs font-black text-slate-700">الفترة:</span>
            <select
              value={selectedPeriod}
              onChange={(e) => setSelectedPeriod(e.target.value as BudgetPeriod)}
              className="bg-indigo-50/70 border border-indigo-200 text-xs font-black text-indigo-950 rounded-xl px-3 py-2 focus:ring-2 focus:ring-indigo-500 cursor-pointer"
            >
              <option value="FULL_YEAR">كامل السنة المالية (YTD)</option>
              <option value="Q1">الربع الأول (Q1: يناير - مارس)</option>
              <option value="Q2">الربع الثاني (Q2: أبريل - يونيو)</option>
              <option value="Q3">الربع الثالث (Q3: يوليو - سبتمبر)</option>
              <option value="Q4">الربع الرابع (Q4: أكتوبر - ديسمبر)</option>
              <option value="M01">شهر يناير (M01)</option>
              <option value="M02">شهر فبراير (M02)</option>
              <option value="M03">شهر مارس (M03)</option>
              <option value="M04">شهر أبريل (M04)</option>
              <option value="M05">شهر مايو (M05)</option>
              <option value="M06">شهر يونيو (M06)</option>
              <option value="M07">شهر يوليو (M07)</option>
              <option value="M08">شهر أغسطس (M08)</option>
              <option value="M09">شهر سبتمبر (M09)</option>
              <option value="M10">شهر أكتوبر (M10)</option>
              <option value="M11">شهر نوفمبر (M11)</option>
              <option value="M12">شهر ديسمبر (M12)</option>
            </select>
          </div>
        </div>

        {/* Enhanced Export & Reporting Hub */}
        <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto justify-end relative">
          
          {/* Excel Export Dropdown */}
          <div className="relative">
            <button
              onClick={() => setIsExportMenuOpen(!isExportMenuOpen)}
              className="bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 text-xs font-black px-3.5 py-2 rounded-xl transition flex items-center gap-1.5 cursor-pointer shadow-2xs active:scale-95"
              title="خيارات تصدير التقرير إلى إكسيل"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-700" />
              <span>تصدير Excel</span>
              <ChevronDown className="w-3.5 h-3.5 text-emerald-700" />
            </button>

            {isExportMenuOpen && (
              <div 
                className="absolute left-0 top-full mt-1.5 w-64 bg-white border border-slate-200 rounded-2xl shadow-xl z-30 p-2 space-y-1 text-xs text-right animate-in fade-in zoom-in-95 duration-100"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="px-3 py-1.5 text-[11px] font-black text-slate-400 border-b border-slate-100">
                  صيغ وتقارير Excel (Spreadsheet)
                </div>
                <button
                  onClick={handleExportDetailedExcel}
                  className="w-full text-right px-3 py-2 hover:bg-emerald-50 text-slate-800 hover:text-emerald-900 rounded-xl transition flex items-start gap-2"
                >
                  <FileSpreadsheet className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-black">جدول الفروقات التفصيلي</p>
                    <p className="text-[10px] text-slate-500">كافة الحسابات مع الفوارق والنسب</p>
                  </div>
                </button>
                <button
                  onClick={handleExportCategoryExcel}
                  className="w-full text-right px-3 py-2 hover:bg-emerald-50 text-slate-800 hover:text-emerald-900 rounded-xl transition flex items-start gap-2"
                >
                  <Layers className="w-4 h-4 text-teal-600 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-black">ملخص القطاعات والتصنيفات</p>
                    <p className="text-[10px] text-slate-500">تقرير تنفيذي مجمع لمجلس الإدارة</p>
                  </div>
                </button>
              </div>
            )}
          </div>

          {/* PDF Audit Report Modal Trigger */}
          <button
            onClick={() => setIsPdfModalOpen(true)}
            className="bg-indigo-900 hover:bg-indigo-800 text-white text-xs font-black px-4 py-2 rounded-xl transition shadow flex items-center gap-2 cursor-pointer active:scale-95"
            title="تصدير تقرير التدقيق والمراجعة الإدارية كـ PDF"
          >
            <FileText className="w-4 h-4 text-indigo-300" />
            <span>تقرير التدقيق المالي (PDF)</span>
            <span className="bg-indigo-700/60 text-[10px] px-1.5 py-0.5 rounded-md font-mono">
              رسمي
            </span>
          </button>

          {/* Quick Direct Print */}
          <button
            onClick={handlePrint}
            className="bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold p-2 rounded-xl transition shadow-2xs cursor-pointer"
            title="طباعة سريعة للصفحة"
          >
            <Printer className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* 4 Executive KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Revenue KPI */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-600">أداء الإيرادات التقديرية</span>
            <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
              إنجاز {totals.revenueAchievementRate.toFixed(1)}%
            </span>
          </div>
          
          <div className="mt-3 flex items-baseline justify-between">
            <div>
              <div className="text-lg font-black font-mono text-slate-900">
                {formatCurrency(totals.totalActualRevenue, currency, rates)}
              </div>
              <div className="text-[11px] text-slate-400">
                الموازنة: {formatCurrency(totals.totalBudgetRevenue, currency, rates)}
              </div>
            </div>
            <div className={`text-xs font-black font-mono flex items-center gap-0.5 ${
              totals.revenueVariance >= 0 ? 'text-emerald-600' : 'text-rose-600'
            }`}>
              {totals.revenueVariance >= 0 ? '+' : ''}{formatCurrency(totals.revenueVariance, currency, rates)}
            </div>
          </div>

          {/* Progress Bar */}
          <div className="w-full bg-slate-100 h-2 rounded-full mt-3 overflow-hidden">
            <div 
              className={`h-full rounded-full ${totals.revenueAchievementRate >= 80 ? 'bg-emerald-500' : 'bg-amber-500'}`}
              style={{ width: `${Math.min(100, totals.revenueAchievementRate)}%` }}
            />
          </div>
        </div>

        {/* Expense KPI */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-600">المصروفات التشغيلية والإنفاق</span>
            <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${
              totals.expenseSpendingRate > 100 ? 'bg-rose-100 text-rose-800' : 'bg-blue-100 text-blue-800'
            }`}>
              استهلاك {totals.expenseSpendingRate.toFixed(1)}%
            </span>
          </div>
          
          <div className="mt-3 flex items-baseline justify-between">
            <div>
              <div className="text-lg font-black font-mono text-slate-900">
                {formatCurrency(totals.totalActualExpense, currency, rates)}
              </div>
              <div className="text-[11px] text-slate-400">
                السقف: {formatCurrency(totals.totalBudgetExpense, currency, rates)}
              </div>
            </div>
            <div className={`text-xs font-black font-mono flex items-center gap-0.5 ${
              totals.expenseVariance >= 0 ? 'text-emerald-600' : 'text-rose-600'
            }`}>
              {totals.expenseVariance >= 0 ? 'وفر +' : 'تجاوز -'}{formatCurrency(Math.abs(totals.expenseVariance), currency, rates)}
            </div>
          </div>

          {/* Progress Bar */}
          <div className="w-full bg-slate-100 h-2 rounded-full mt-3 overflow-hidden">
            <div 
              className={`h-full rounded-full ${totals.expenseSpendingRate > 100 ? 'bg-rose-500' : totals.expenseSpendingRate > 80 ? 'bg-amber-500' : 'bg-blue-500'}`}
              style={{ width: `${Math.min(100, totals.expenseSpendingRate)}%` }}
            />
          </div>
        </div>

        {/* Net Profit Margin KPI */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-600">صافي الأرباح التشغيلية</span>
            <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-900">
              فارق {totals.netProfitVariance >= 0 ? '+' : ''}{formatCurrency(totals.netProfitVariance, currency, rates)}
            </span>
          </div>

          <div className="mt-3 flex items-baseline justify-between">
            <div>
              <div className="text-lg font-black font-mono text-indigo-950">
                {formatCurrency(totals.netActualProfit, currency, rates)}
              </div>
              <div className="text-[11px] text-slate-400">
                المستهدف التقديري: {formatCurrency(totals.netBudgetProfit, currency, rates)}
              </div>
            </div>
            <div className={`text-xs font-black font-mono ${totals.netProfitVariance >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
              {totals.netBudgetProfit > 0 ? ((totals.netActualProfit / totals.netBudgetProfit) * 100).toFixed(1) : 0}%
            </div>
          </div>

          <p className="text-[10px] text-slate-500 mt-3">
            {totals.netProfitVariance >= 0 ? 'الأداء الفعلي يتجاوز الربحية المخططة بنجاح' : 'هناك فجوة طفيفة في تحقيق الربح المستهدف'}
          </p>
        </div>

        {/* Budget Control Status KPI */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-600">مؤشرات الرقابة والتجاوز</span>
            <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${
              totals.overBudgetCount > 0 ? 'bg-rose-100 text-rose-800 animate-pulse' : 'bg-emerald-100 text-emerald-800'
            }`}>
              {totals.overBudgetCount > 0 ? `${totals.overBudgetCount} بنود متجاوزة` : 'لا تجاوزات حرجة'}
            </span>
          </div>

          <div className="mt-3 flex items-center justify-between">
            <div>
              <div className="text-lg font-black text-slate-900">
                {totals.warningCount} تنبيهات
              </div>
              <div className="text-[11px] text-slate-400">
                حد التحذير: {alertConfig.warningThresholdPercent}% من الموازنة
              </div>
            </div>
            <AlertTriangle className={`w-8 h-8 ${totals.overBudgetCount > 0 ? 'text-rose-500' : 'text-amber-500'}`} />
          </div>

          <p className="text-[10px] text-slate-500 mt-2">
            تم إرسال إشعارات رقابية فورية للحسابات المقتربة من السقف
          </p>
        </div>
      </div>

      {/* Visual Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 print:hidden">
        {/* Comparative Bar Chart (Budget vs Actual) */}
        <div className="lg:col-span-2 bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-indigo-900" />
              <h3 className="text-xs font-black text-slate-900">مقارنة الموازنة التقديرية بالصرف الفعلي لأهم الحسابات (بالملايين)</h3>
            </div>
            <span className="text-[11px] text-slate-400 font-mono">Million YER</span>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 10, right: 10, left: 10, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" tick={{ fontSize: 10 }} angle={-15} textAnchor="end" height={40} />
                <YAxis tick={{ fontSize: 10 }} />
                <Tooltip
                  formatter={(val: number) => [`${val.toLocaleString()} مليون ريال`, '']}
                  contentStyle={{ backgroundColor: '#0f172a', color: '#fff', borderRadius: '12px', fontSize: '11px' }}
                />
                <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                <Bar dataKey="الموازنة التقديرية" fill="#6366f1" radius={[4, 4, 0, 0]} />
                <Bar dataKey="الفعلي حتى اليوم" fill="#10b981" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Budget Variance Breakdown & Guidance */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Scale className="w-4 h-4 text-amber-500" />
              <h3 className="text-xs font-black text-slate-900">معايير تقييم الفروقات (Variance Evaluation)</h3>
            </div>

            <div className="space-y-2.5 text-xs">
              <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-between">
                <div>
                  <div className="font-black text-emerald-900">أداء إيجابي / وفر في المصروفات</div>
                  <div className="text-[10px] text-emerald-700">إيرادات أعلى من الموازنة أو مصروفات أقل</div>
                </div>
                <span className="font-mono font-black text-emerald-800 text-xs">+{formatCurrency(totals.revenueVariance >= 0 ? totals.revenueVariance : totals.expenseVariance, currency, rates)}</span>
              </div>

              <div className="p-2.5 bg-amber-50 border border-amber-200 rounded-xl flex items-center justify-between">
                <div>
                  <div className="font-black text-amber-900">تنبيه اقتراب السقف (80% - 99%)</div>
                  <div className="text-[10px] text-amber-700">يتطلب مراجعة من إدارة المشتريات</div>
                </div>
                <span className="font-mono font-black text-amber-800 text-xs">{totals.warningCount} حساب</span>
              </div>

              <div className="p-2.5 bg-rose-50 border border-rose-200 rounded-xl flex items-center justify-between">
                <div>
                  <div className="font-black text-rose-900">تجاوز الموازنة المعتمدة (≥100%)</div>
                  <div className="text-[10px] text-rose-700">يتطلب موافقة استثنائية من المدير المالي</div>
                </div>
                <span className="font-mono font-black text-rose-800 text-xs">{totals.overBudgetCount} حساب</span>
              </div>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
            <span>الربط المحاسبي: الأستاذ العام FBL3N</span>
            <button
              onClick={onNavigateToGeneralLedger}
              className="text-indigo-600 font-bold hover:underline"
            >
              استعراض القيود ←
            </button>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar for Table */}
      <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row items-center justify-between gap-3 print:hidden">
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

        {/* Category & Status Filter Tabs */}
        <div className="flex flex-wrap items-center gap-1.5">
          <button
            onClick={() => setSelectedTypeFilter('ALL')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
              selectedTypeFilter === 'ALL'
                ? 'bg-indigo-900 text-white shadow-2xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            جميع الحسابات
          </button>
          <button
            onClick={() => setSelectedTypeFilter('REVENUE')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
              selectedTypeFilter === 'REVENUE'
                ? 'bg-emerald-700 text-white shadow-2xs'
                : 'bg-slate-100 text-emerald-800 hover:bg-emerald-50'
            }`}
          >
            الإيرادات
          </button>
          <button
            onClick={() => setSelectedTypeFilter('EXPENSE')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
              selectedTypeFilter === 'EXPENSE'
                ? 'bg-rose-700 text-white shadow-2xs'
                : 'bg-slate-100 text-rose-800 hover:bg-rose-50'
            }`}
          >
            المصروفات
          </button>
          <button
            onClick={() => setSelectedTypeFilter('ASSET')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
              selectedTypeFilter === 'ASSET'
                ? 'bg-blue-700 text-white shadow-2xs'
                : 'bg-slate-100 text-blue-800 hover:bg-blue-50'
            }`}
          >
            الأصول والرأسمالية
          </button>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-slate-50 border border-slate-200 text-xs font-bold text-slate-700 rounded-xl px-2.5 py-1.5 ml-2 cursor-pointer"
          >
            <option value="ALL">جميع الحالات</option>
            <option value="OVER_BUDGET">المتجاوز للموازنة فقط (حرجة)</option>
            <option value="WARNING">المقترب من السقف (تحذير)</option>
            <option value="FAVORABLE">الأداء الإيجابي والوفر فقط</option>
          </select>
        </div>
      </div>

      {/* COMPARATIVE VARIANCE AUDIT TABLE */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="px-4 py-3 bg-slate-900 text-white flex flex-wrap items-center justify-between text-xs font-bold gap-3">
          <div className="flex items-center gap-2">
            <FileSpreadsheet className="w-4 h-4 text-amber-400" />
            <span>جدول مقارنة الأداء الفعلي بالموازنة التقديرية (Actual vs. Budget Performance)</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[11px] text-slate-300 font-mono pl-2 border-l border-slate-700">
              {filteredVariances.length} حساب مفحوص
            </span>
            <button
              onClick={handleExportDetailedExcel}
              className="bg-slate-800 hover:bg-slate-700 text-emerald-400 text-[11px] font-bold px-2.5 py-1 rounded-lg transition flex items-center gap-1 border border-slate-700 cursor-pointer"
              title="تصدير هذه النتائج إلى Excel"
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              تصدير إكسيل
            </button>
            <button
              onClick={() => setIsPdfModalOpen(true)}
              className="bg-indigo-600 hover:bg-indigo-500 text-white text-[11px] font-bold px-2.5 py-1 rounded-lg transition flex items-center gap-1 cursor-pointer"
              title="تصدير تقرير التدقيق المالي كـ PDF"
            >
              <FileText className="w-3.5 h-3.5" />
              تقرير PDF
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-right border-collapse text-xs">
            <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
              <tr>
                <th className="py-3 px-3 w-20">رمز الحساب</th>
                <th className="py-3 px-3 min-w-[160px]">اسم الحساب</th>
                <th className="py-3 px-2 w-24">النوع</th>
                <th className="py-3 px-3 text-left w-32 bg-indigo-50/50">الموازنة التقديرية</th>
                <th className="py-3 px-3 text-left w-32 bg-slate-50">الرصيد الفعلي</th>
                <th className="py-3 px-3 text-left w-32">الفارق (Variance)</th>
                <th className="py-3 px-2 text-center w-24">نسبة الفارق %</th>
                <th className="py-3 px-3 w-36 text-center">نسبة الإنجاز / الاستهلاك</th>
                <th className="py-3 px-3 w-32 text-center">حالة الالتزام</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-sans">
              {filteredVariances.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-400">
                    لا توجد حسابات مطابقة لمعايير التصفية المختارة
                  </td>
                </tr>
              ) : (
                filteredVariances.map((v, idx) => {
                  const isRev = v.accountType === 'REVENUE';
                  const isExp = v.accountType === 'EXPENSE';
                  return (
                    <tr 
                      key={v.accountCode} 
                      className={`hover:bg-indigo-50/30 transition-colors ${idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'}`}
                    >
                      <td className="py-2.5 px-3 font-mono font-black text-slate-900">
                        {v.accountCode}
                      </td>
                      <td className="py-2.5 px-3">
                        <div className="font-bold text-slate-900">{v.accountNameAr}</div>
                        <div className="text-[10px] text-slate-400 font-sans">{v.category}</div>
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
                      </td>

                      {/* Budget */}
                      <td className="py-2.5 px-3 text-left font-mono font-black text-slate-900 bg-indigo-50/30">
                        {formatCurrency(v.budgetAmount, currency, rates)}
                      </td>

                      {/* Actual */}
                      <td className="py-2.5 px-3 text-left font-mono font-black text-slate-900 bg-slate-50/50">
                        {formatCurrency(v.actualAmount, currency, rates)}
                      </td>

                      {/* Variance Amount */}
                      <td className={`py-2.5 px-3 text-left font-mono font-black ${
                        v.isFavorable ? 'text-emerald-700' : 'text-rose-700'
                      }`}>
                        {v.isFavorable ? '+' : ''}{formatCurrency(v.varianceAmount, currency, rates)}
                      </td>

                      {/* Variance Percentage */}
                      <td className={`py-2.5 px-2 text-center font-mono font-black ${
                        v.isFavorable ? 'text-emerald-700' : 'text-rose-700'
                      }`}>
                        {v.variancePercentage > 0 ? `+${v.variancePercentage.toFixed(1)}%` : `${v.variancePercentage.toFixed(1)}%`}
                      </td>

                      {/* Completion / Spending Rate with Progress Bar */}
                      <td className="py-2.5 px-3 text-center">
                        <div className="flex items-center gap-2">
                          <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full ${
                                isExp
                                  ? v.completionRate >= 100
                                    ? 'bg-rose-600'
                                    : v.completionRate >= 80
                                    ? 'bg-amber-500'
                                    : 'bg-emerald-500'
                                  : v.completionRate >= 100
                                  ? 'bg-emerald-600'
                                  : v.completionRate >= 80
                                  ? 'bg-blue-500'
                                  : 'bg-amber-500'
                              }`}
                              style={{ width: `${Math.min(100, v.completionRate)}%` }}
                            />
                          </div>
                          <span className="font-mono font-black text-[11px] text-slate-800 w-12 text-left">
                            {v.completionRate.toFixed(0)}%
                          </span>
                        </div>
                      </td>

                      {/* Status Badge */}
                      <td className="py-2.5 px-3 text-center">
                        <span className={`inline-block px-2.5 py-1 rounded-lg text-[10px] font-black border ${v.statusColor}`}>
                          {v.statusLabelAr}
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Official Signatures Section for PDF/Print Mode */}
      <div className="hidden print:grid grid-cols-3 gap-8 mt-12 pt-8 border-t border-slate-400 text-center text-xs text-slate-800">
        <div>
          <p className="font-bold">إعداد وتدقيق محاسب الموازنة:</p>
          <div className="h-16"></div>
          <p className="border-t border-dotted border-slate-400 pt-1">أ / محمد رضوان الأهدل</p>
        </div>
        <div>
          <p className="font-bold">مراجعة واعتماد المدير المالي (CFO):</p>
          <div className="h-16"></div>
          <p className="border-t border-dotted border-slate-400 pt-1">د / خالد العمري</p>
        </div>
        <div>
          <p className="font-bold">مصادقة المدير العام والرئيس التنفيذي:</p>
          <div className="h-16"></div>
          <p className="border-t border-dotted border-slate-400 pt-1">ميدو تك للحلول البرمجية</p>
        </div>
      </div>

      {/* PDF Management Audit Report Modal */}
      {isPdfModalOpen && (
        <BudgetPdfReportModal
          isOpen={isPdfModalOpen}
          onClose={() => setIsPdfModalOpen(false)}
          scenario={activeScenario}
          variances={variances}
          companyProfile={companyProfile}
          period={selectedPeriod}
          currency={currency}
          rates={rates}
        />
      )}
    </div>
  );
};
