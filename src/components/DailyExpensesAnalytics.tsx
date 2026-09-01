import React, { useState, useMemo } from 'react';
import { 
  PieChart as RechartsPie, 
  Pie, 
  Cell, 
  Tooltip, 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Legend, 
  AreaChart, 
  Area,
  ComposedChart,
  Line
} from 'recharts';
import { 
  Building2, 
  TrendingUp, 
  DollarSign, 
  Calendar, 
  PieChart as PieIcon, 
  BarChart3, 
  ArrowUpRight, 
  ArrowDownRight, 
  AlertTriangle, 
  CheckCircle2, 
  Printer, 
  Share2, 
  Filter, 
  Sparkles, 
  Coffee, 
  Fuel, 
  Wrench, 
  Wifi, 
  Package, 
  FileText,
  Sliders,
  ChevronDown,
  Info,
  Layers,
  ArrowRight,
  TrendingDown
} from 'lucide-react';
import { DailyExpenseItem, ExpenseDepartment, DailyExpenseType } from '../types/expensesRevenues';
import { Currency, CompanyProfile } from '../types/accounting';
import { formatCurrency, convertAmount } from '../utils/formatters';
import { ADMIN_WHATSAPP_NUMBER } from '../data/userCredentials';

interface DailyExpensesAnalyticsProps {
  dailyExpenses: DailyExpenseItem[];
  departments: ExpenseDepartment[];
  currency: Currency;
  rates: Record<Currency, number>;
  companyProfile: CompanyProfile;
  onFilterByDepartment?: (deptId: string) => void;
  onNewExpenseClick?: () => void;
}

const DEPARTMENT_COLORS = [
  '#4f46e5', // Indigo
  '#0ea5e9', // Sky
  '#10b981', // Emerald
  '#f59e0b', // Amber
  '#ec4899', // Pink
  '#8b5cf6', // Violet
  '#06b6d4', // Cyan
  '#f97316', // Orange
  '#14b8a6', // Teal
  '#6366f1', // Blue-violet
];

const TYPE_NAMES: Record<DailyExpenseType, { nameAr: string; icon: any; color: string }> = {
  HOSPITALITY: { nameAr: 'بوفيه وضيافة', icon: Coffee, color: '#f59e0b' },
  TRANSPORT_FUEL: { nameAr: 'مواصلات وبترول', icon: Fuel, color: '#0ea5e9' },
  OFFICE_SUPPLIES: { nameAr: 'قرطاسية ومطبوعات', icon: FileText, color: '#10b981' },
  EMERGENCY_MAINTENANCE: { nameAr: 'صيانة طارئة', icon: Wrench, color: '#ef4444' },
  COMMUNICATION: { nameAr: 'شحن واتصالات', icon: Wifi, color: '#8b5cf6' },
  CLEANING: { nameAr: 'نظافة ومستلزمات', icon: Package, color: '#14b8a6' },
  PETTY_CASH: { nameAr: 'نثريات عامة ومصاريف نثرية', icon: Sliders, color: '#6366f1' },
  OTHER: { nameAr: 'مصاريف يومية أخرى', icon: Sliders, color: '#64748b' }
};

export const DailyExpensesAnalytics: React.FC<DailyExpensesAnalyticsProps> = ({
  dailyExpenses,
  departments,
  currency,
  rates,
  companyProfile,
  onFilterByDepartment,
  onNewExpenseClick,
}) => {
  // Current month state format YYYY-MM
  const currentYearMonth = new Date().toISOString().slice(0, 7); // e.g. "2026-08"
  const [selectedMonth, setSelectedMonth] = useState<string>(currentYearMonth);
  const [selectedDepartmentId, setSelectedDepartmentId] = useState<string>('ALL');
  const [viewMode, setViewMode] = useState<'OVERVIEW' | 'DEPARTMENT_COMPARISON' | 'TRENDS'>('OVERVIEW');

  // Filter expenses by selected month
  const monthlyExpenses = useMemo(() => {
    return dailyExpenses.filter(item => {
      if (selectedMonth !== 'ALL') {
        const itemMonth = item.date.slice(0, 7);
        if (itemMonth !== selectedMonth) return false;
      }
      if (selectedDepartmentId !== 'ALL' && item.departmentId !== selectedDepartmentId) {
        return false;
      }
      return true;
    });
  }, [dailyExpenses, selectedMonth, selectedDepartmentId]);

  // Aggregate by Department
  const departmentStats = useMemo(() => {
    const map = new Map<string, {
      id: string;
      code: string;
      nameAr: string;
      allocatedBudget: number;
      actualSpentInBase: number;
      count: number;
      managerName: string;
    }>();

    // Initialize map with all known departments
    departments.forEach(dept => {
      map.set(dept.id, {
        id: dept.id,
        code: dept.code,
        nameAr: dept.nameAr,
        allocatedBudget: dept.allocatedMonthlyBudget || 0,
        actualSpentInBase: 0,
        count: 0,
        managerName: dept.managerName || 'غير محدد',
      });
    });

    // Populate actual spending from monthly daily expenses
    monthlyExpenses.forEach(exp => {
      const deptId = exp.departmentId || 'DEPT-GEN';
      if (map.has(deptId)) {
        const item = map.get(deptId)!;
        item.actualSpentInBase += exp.amountInBase;
        item.count += 1;
      } else {
        // Fallback for any department not in the master list
        map.set(deptId, {
          id: deptId,
          code: 'OTHER',
          nameAr: exp.departmentName || 'قسم آخر',
          allocatedBudget: 0,
          actualSpentInBase: exp.amountInBase,
          count: 1,
          managerName: 'غير محدد',
        });
      }
    });

    return Array.from(map.values());
  }, [departments, monthlyExpenses]);

  // Total metrics
  const totalMonthlySpendInBase = useMemo(() => {
    return monthlyExpenses.reduce((sum, item) => sum + item.amountInBase, 0);
  }, [monthlyExpenses]);

  const totalMonthlyBudgetInBase = useMemo(() => {
    if (selectedDepartmentId !== 'ALL') {
      const d = departments.find(dep => dep.id === selectedDepartmentId);
      return d ? d.allocatedMonthlyBudget : 0;
    }
    return departments.reduce((sum, d) => sum + (d.allocatedMonthlyBudget || 0), 0);
  }, [departments, selectedDepartmentId]);

  const overallBudgetConsumption = totalMonthlyBudgetInBase > 0 
    ? Math.round((totalMonthlySpendInBase / totalMonthlyBudgetInBase) * 100) 
    : 0;

  const totalTransactionsCount = monthlyExpenses.length;
  const averageTransactionInBase = totalTransactionsCount > 0 
    ? Math.round(totalMonthlySpendInBase / totalTransactionsCount) 
    : 0;

  // Find top spending department
  const topSpendingDept = useMemo(() => {
    if (departmentStats.length === 0) return null;
    const sorted = [...departmentStats].sort((a, b) => b.actualSpentInBase - a.actualSpentInBase);
    return sorted[0]?.actualSpentInBase > 0 ? sorted[0] : null;
  }, [departmentStats]);

  // Pie chart data: Spend by department
  const pieChartData = useMemo(() => {
    return departmentStats
      .filter(d => d.actualSpentInBase > 0)
      .map((d, index) => {
        const displayVal = convertAmount(d.actualSpentInBase, 'YER', currency, rates);
        const percent = totalMonthlySpendInBase > 0 
          ? ((d.actualSpentInBase / totalMonthlySpendInBase) * 100).toFixed(1) 
          : '0';
        return {
          id: d.id,
          name: d.nameAr,
          value: displayVal,
          amountInBase: d.actualSpentInBase,
          percent: Number(percent),
          count: d.count,
          color: DEPARTMENT_COLORS[index % DEPARTMENT_COLORS.length],
        };
      })
      .sort((a, b) => b.value - a.value);
  }, [departmentStats, totalMonthlySpendInBase, currency, rates]);

  // Bar chart data: Budget vs Actual
  const budgetVsActualData = useMemo(() => {
    return departmentStats.map(d => {
      const actualDisplay = convertAmount(d.actualSpentInBase, 'YER', currency, rates);
      const budgetDisplay = convertAmount(d.allocatedBudget, 'YER', currency, rates);
      const percent = d.allocatedBudget > 0 
        ? Math.round((d.actualSpentInBase / d.allocatedBudget) * 100) 
        : 0;
      return {
        id: d.id,
        name: d.nameAr,
        المنصرف_الفعلي: actualDisplay,
        الموازنة_المعتمدة: budgetDisplay,
        percent,
        isOverBudget: d.actualSpentInBase > d.allocatedBudget,
      };
    });
  }, [departmentStats, currency, rates]);

  // Timeline Trend: Daily spending across the month days
  const dailyTimelineData = useMemo(() => {
    const daysInMonthMap = new Map<string, number>();
    
    // Fill days of the month
    for (let day = 1; day <= 31; day++) {
      const dayStr = day < 10 ? `0${day}` : `${day}`;
      daysInMonthMap.set(dayStr, 0);
    }

    monthlyExpenses.forEach(exp => {
      const day = exp.date.slice(8, 10);
      const current = daysInMonthMap.get(day) || 0;
      daysInMonthMap.set(day, current + exp.amountInBase);
    });

    return Array.from(daysInMonthMap.entries())
      .map(([day, amountInBase]) => ({
        day: `يوم ${day}`,
        dayNumber: day,
        المصروف: convertAmount(amountInBase, 'YER', currency, rates),
        raw: amountInBase,
      }))
      .filter(item => selectedMonth !== currentYearMonth || parseInt(item.dayNumber) <= new Date().getDate() || item.raw > 0);
  }, [monthlyExpenses, selectedMonth, currentYearMonth, currency, rates]);

  // Aggregation by Daily Expense Type (بوفيه، مواصلات، صيانة...)
  const typeStatsData = useMemo(() => {
    const typeMap = new Map<DailyExpenseType, number>();
    
    monthlyExpenses.forEach(exp => {
      const current = typeMap.get(exp.type) || 0;
      typeMap.set(exp.type, current + exp.amountInBase);
    });

    return Array.from(typeMap.entries()).map(([type, amountInBase]) => {
      const conf = TYPE_NAMES[type] || { nameAr: type, color: '#64748b' };
      const displayVal = convertAmount(amountInBase, 'YER', currency, rates);
      const percent = totalMonthlySpendInBase > 0 
        ? ((amountInBase / totalMonthlySpendInBase) * 100).toFixed(1) 
        : '0';
      return {
        type,
        name: conf.nameAr,
        المبلغ: displayVal,
        amountInBase,
        percent: Number(percent),
        color: conf.color,
      };
    }).sort((a, b) => b.amountInBase - a.amountInBase);
  }, [monthlyExpenses, totalMonthlySpendInBase, currency, rates]);

  // Month options for the selector
  const monthOptions = [
    { value: '2026-08', label: 'أغسطس 2026 (الشهر الحالي)' },
    { value: '2026-07', label: 'يوليو 2026' },
    { value: '2026-06', label: 'يونيو 2026' },
    { value: '2026-05', label: 'مايو 2026' },
    { value: 'ALL', label: 'كافة الفترات المسجلة' },
  ];

  // Format month name for display
  const getMonthDisplayLabel = (m: string) => {
    if (m === 'ALL') return 'كافة الفترات';
    const [y, monthNum] = m.split('-');
    const arabicMonths: Record<string, string> = {
      '01': 'يناير', '02': 'فبراير', '03': 'مارس', '04': 'أبريل',
      '05': 'مايو', '06': 'يونيو', '07': 'يوليو', '08': 'أغسطس',
      '09': 'سبتمبر', '10': 'أكتوبر', '11': 'نوفمبر', '12': 'ديسمبر'
    };
    return `${arabicMonths[monthNum] || monthNum} ${y}`;
  };

  return (
    <div className="space-y-6" dir="rtl">
      {/* Control & Filter Header */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="p-3 bg-gradient-to-br from-indigo-500 to-indigo-700 text-white rounded-2xl shadow-md">
              <PieIcon className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-black text-slate-900">
                  لوحة تحليلات المصروفات اليومية وتوزيع إنفاق الأقسام
                </h2>
                <span className="bg-indigo-50 text-indigo-700 border border-indigo-200 text-[11px] font-black px-2.5 py-0.5 rounded-full">
                  {getMonthDisplayLabel(selectedMonth)}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                مخططات بيانية تفاعلية، تحليل مقارن لموازنات الأقسام، ونسب استهلاك صندوق النثريات
              </p>
            </div>
          </div>

          {/* Filters & Actions */}
          <div className="flex items-center gap-2.5 flex-wrap">
            {/* Month Selector */}
            <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-xl">
              <Calendar className="w-4 h-4 text-indigo-600" />
              <span className="text-xs font-bold text-slate-700">الفترة:</span>
              <select
                value={selectedMonth}
                onChange={e => setSelectedMonth(e.target.value)}
                className="bg-transparent text-xs font-black text-slate-900 focus:outline-none cursor-pointer"
              >
                {monthOptions.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>

            {/* Department Filter */}
            <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-xl">
              <Building2 className="w-4 h-4 text-indigo-600" />
              <select
                value={selectedDepartmentId}
                onChange={e => setSelectedDepartmentId(e.target.value)}
                className="bg-transparent text-xs font-black text-slate-900 focus:outline-none cursor-pointer"
              >
                <option value="ALL">كافة الأقسام</option>
                {departments.map(d => (
                  <option key={d.id} value={d.id}>{d.nameAr}</option>
                ))}
              </select>
            </div>

            {/* Print and Share */}
            <button
              onClick={() => window.print()}
              className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition flex items-center gap-1.5 text-xs font-bold cursor-pointer"
              title="طباعة التقرير التحليلي"
            >
              <Printer className="w-4 h-4" />
              <span className="hidden sm:inline">طباعة التقرير</span>
            </button>

            <a
              href={`https://wa.me/${ADMIN_WHATSAPP_NUMBER}?text=${encodeURIComponent(`📊 *تقرير تحليلات المصروفات اليومية للأقسام*\nالفترة: ${getMonthDisplayLabel(selectedMonth)}\nإجمالي المنصرف: ${formatCurrency(convertAmount(totalMonthlySpendInBase, 'YER', currency, rates), currency)}\nالموازنة المعتمدة: ${formatCurrency(convertAmount(totalMonthlyBudgetInBase, 'YER', currency, rates), currency)}\nنسبة الاستهلاك: ${overallBudgetConsumption}%\nالقسم الأعلى إنفاقاً: ${topSpendingDept ? `${topSpendingDept.nameAr} (${formatCurrency(convertAmount(topSpendingDept.actualSpentInBase, 'YER', currency, rates), currency)})` : 'لا يوجد'}`)}`}
              target="_blank"
              rel="noreferrer"
              className="p-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl transition flex items-center gap-1.5 text-xs font-bold shadow cursor-pointer"
              title="مشاركة الملخص عبر واتساب"
            >
              <Share2 className="w-4 h-4" />
              <span className="hidden sm:inline">مشاركة واتساب</span>
            </a>
          </div>
        </div>

        {/* View Mode Switcher */}
        <div className="flex items-center gap-2 mt-4 pt-4 border-t border-slate-100">
          <button
            onClick={() => setViewMode('OVERVIEW')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
              viewMode === 'OVERVIEW'
                ? 'bg-indigo-900 text-white shadow-sm font-black'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            <PieIcon className="w-3.5 h-3.5" />
            <span>نظرة عامة وتوزيع الأقسام</span>
          </button>

          <button
            onClick={() => setViewMode('DEPARTMENT_COMPARISON')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
              viewMode === 'DEPARTMENT_COMPARISON'
                ? 'bg-indigo-900 text-white shadow-sm font-black'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            <BarChart3 className="w-3.5 h-3.5" />
            <span>مقارنة المنصرف الفعلي بالموازنة</span>
          </button>

          <button
            onClick={() => setViewMode('TRENDS')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
              viewMode === 'TRENDS'
                ? 'bg-indigo-900 text-white shadow-sm font-black'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            <TrendingUp className="w-3.5 h-3.5" />
            <span>المسار اليومي وتصنيفات النثريات</span>
          </button>
        </div>
      </div>

      {/* 4 Executive KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1: Total Spend */}
        <div className="bg-gradient-to-br from-indigo-900 to-slate-900 text-white p-5 rounded-2xl shadow-sm border border-indigo-950">
          <div className="flex items-center justify-between text-xs text-indigo-200">
            <span>إجمالي المنصرف خلال {getMonthDisplayLabel(selectedMonth)}</span>
            <DollarSign className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-xl sm:text-2xl font-black text-white mt-2">
            {formatCurrency(convertAmount(totalMonthlySpendInBase, 'YER', currency, rates), currency)}
          </div>
          <div className="flex items-center justify-between text-[11px] text-indigo-300 mt-2 pt-2 border-t border-indigo-800/60">
            <span>الموازنة المعتمدة:</span>
            <span className="font-bold">{formatCurrency(convertAmount(totalMonthlyBudgetInBase, 'YER', currency, rates), currency)}</span>
          </div>
        </div>

        {/* KPI 2: Budget Consumption */}
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span>نسبة استهلاك الموازنة الإجمالية</span>
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
              overallBudgetConsumption > 100 
                ? 'bg-rose-100 text-rose-800' 
                : overallBudgetConsumption > 80 
                ? 'bg-amber-100 text-amber-800' 
                : 'bg-emerald-100 text-emerald-800'
            }`}>
              {overallBudgetConsumption}%
            </span>
          </div>
          <div className="text-xl font-black text-slate-900 mt-2">
            {overallBudgetConsumption}% من الموازنة
          </div>
          {/* Progress Bar */}
          <div className="w-full bg-slate-100 h-2 rounded-full mt-2.5 overflow-hidden">
            <div 
              className={`h-full transition-all duration-500 ${
                overallBudgetConsumption > 100 
                  ? 'bg-rose-500' 
                  : overallBudgetConsumption > 80 
                  ? 'bg-amber-500' 
                  : 'bg-indigo-600'
              }`}
              style={{ width: `${Math.min(100, overallBudgetConsumption)}%` }}
            ></div>
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            {overallBudgetConsumption > 100 ? '🚨 تنبيه: تم تجاوز الموازنة التقديرية' : '✅ الصرف ضمن الحدود المعتمدة'}
          </div>
        </div>

        {/* KPI 3: Top Department */}
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span>القسم الأعلى إنفاقاً</span>
            <Building2 className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="text-base font-black text-indigo-900 mt-2 truncate">
            {topSpendingDept ? topSpendingDept.nameAr : 'لا توجد حركات'}
          </div>
          <div className="text-sm font-bold text-slate-700 mt-0.5">
            {topSpendingDept 
              ? formatCurrency(convertAmount(topSpendingDept.actualSpentInBase, 'YER', currency, rates), currency) 
              : '0'}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            {topSpendingDept && totalMonthlySpendInBase > 0
              ? `يمثل ${((topSpendingDept.actualSpentInBase / totalMonthlySpendInBase) * 100).toFixed(1)}% من إجمالي النثريات`
              : 'جاهز لتسجيل الحركات'}
          </div>
        </div>

        {/* KPI 4: Transaction Count & Average */}
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span>عدد الحركات ومتوسط الإيصال</span>
            <TrendingUp className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="text-xl font-black text-slate-900 mt-2">
            {totalTransactionsCount} حركة مسجلة
          </div>
          <div className="text-xs text-slate-600 mt-1">
            متوسط الحركة: <span className="font-bold text-indigo-700">{formatCurrency(convertAmount(averageTransactionInBase, 'YER', currency, rates), currency)}</span>
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            المصدر: قيود صندوق النثريات اليومية
          </div>
        </div>
      </div>

      {/* Main Charts Section based on viewMode */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column (Main Chart) */}
        <div className="lg:col-span-7 space-y-6">
          {/* Card 1: Department Distribution (Donut / Pie) */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <PieIcon className="w-5 h-5 text-indigo-600" />
                <h3 className="text-sm font-black text-slate-900">
                  توزيع نسبة الإنفاق لكل قسم (Expense Distribution by Department)
                </h3>
              </div>
              <span className="text-[11px] text-slate-500 font-bold bg-slate-100 px-2.5 py-0.5 rounded-full">
                {pieChartData.length} أقسام مستفيدة
              </span>
            </div>

            {pieChartData.length === 0 ? (
              <div className="h-64 flex flex-col items-center justify-center text-slate-400 gap-2">
                <Coffee className="w-10 h-10 stroke-[1.5] text-slate-300" />
                <span className="text-xs font-bold text-slate-500">لا توجد حركات مصروفات مسجلة لهذا الشهر</span>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-12 items-center gap-4">
                {/* Recharts Pie */}
                <div className="md:col-span-7 h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <RechartsPie>
                      <Pie
                        data={pieChartData}
                        cx="50%"
                        cy="50%"
                        innerRadius={55}
                        outerRadius={85}
                        paddingAngle={3}
                        dataKey="amountInBase"
                        nameKey="name"
                      >
                        {pieChartData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip
                        formatter={(val: any, name: any, item: any) => {
                          const display = formatCurrency(convertAmount(Number(val), 'YER', currency, rates), currency);
                          return [`${display} (${item.payload.percent}%)`, item.payload.name];
                        }}
                        contentStyle={{
                          backgroundColor: '#0f172a',
                          borderRadius: '12px',
                          color: '#fff',
                          fontSize: '12px',
                          border: 'none',
                          textAlign: 'right',
                          direction: 'rtl',
                          boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.3)',
                        }}
                      />
                    </RechartsPie>
                  </ResponsiveContainer>
                </div>

                {/* Legend List with Values and Percentages */}
                <div className="md:col-span-5 space-y-2 max-h-64 overflow-y-auto pr-1">
                  {pieChartData.map((entry) => (
                    <div 
                      key={entry.id}
                      onClick={() => onFilterByDepartment && onFilterByDepartment(entry.id)}
                      className="flex items-center justify-between p-2 rounded-xl hover:bg-slate-50 transition text-xs cursor-pointer border border-transparent hover:border-slate-200"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <span 
                          className="w-3 h-3 rounded-full shrink-0" 
                          style={{ backgroundColor: entry.color }}
                        />
                        <span className="font-bold text-slate-800 truncate">{entry.name}</span>
                      </div>
                      <div className="text-left shrink-0">
                        <div className="font-black text-slate-900">{formatCurrency(entry.value, currency)}</div>
                        <div className="text-[10px] text-slate-500 font-bold">{entry.percent}% ({entry.count} حركة)</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Card 2: Actual vs Budget Comparison Bar Chart */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-indigo-600" />
                <h3 className="text-sm font-black text-slate-900">
                  مقارنة المنصرف الفعلي بالموازنة الشهرية المعتمدة (Actual vs Budget)
                </h3>
              </div>
              <div className="flex items-center gap-3 text-[11px] font-bold">
                <span className="flex items-center gap-1.5 text-indigo-700">
                  <span className="w-3 h-3 bg-indigo-600 rounded-sm"></span>
                  المنصرف الفعلي
                </span>
                <span className="flex items-center gap-1.5 text-slate-500">
                  <span className="w-3 h-3 bg-slate-300 rounded-sm"></span>
                  الموازنة المعتمدة
                </span>
              </div>
            </div>

            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={budgetVsActualData}
                  margin={{ top: 10, right: 10, left: 10, bottom: 25 }}
                >
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis 
                    dataKey="name" 
                    tick={{ fontSize: 11, fill: '#475569' }} 
                    interval={0}
                    angle={-15}
                    textAnchor="end"
                  />
                  <YAxis 
                    tick={{ fontSize: 11, fill: '#475569' }}
                    tickFormatter={(val) => val >= 1000 ? `${(val / 1000).toFixed(0)}k` : val}
                  />
                  <Tooltip
                    formatter={(val: any, name: any) => [
                      formatCurrency(Number(val), currency),
                      name === 'المنصرف_الفعلي' ? 'المنصرف الفعلي' : 'الموازنة الشهرية'
                    ]}
                    contentStyle={{
                      backgroundColor: '#0f172a',
                      borderRadius: '12px',
                      color: '#fff',
                      fontSize: '12px',
                      border: 'none',
                      textAlign: 'right',
                      direction: 'rtl',
                    }}
                  />
                  <Bar dataKey="المنصرف_الفعلي" fill="#4f46e5" radius={[6, 6, 0, 0]} maxBarSize={36} />
                  <Bar dataKey="الموازنة_المعتمدة" fill="#cbd5e1" radius={[6, 6, 0, 0]} maxBarSize={36} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Right Column (Daily Timeline & Category Types) */}
        <div className="lg:col-span-5 space-y-6">
          {/* Daily Spending Trend (Area Chart) */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-indigo-600" />
                <h3 className="text-sm font-black text-slate-900">
                  المسار اليومي للصرف خلال الشهر (Daily Trend)
                </h3>
              </div>
              <span className="text-[10px] text-slate-400 font-bold">حسب أيام الشهر</span>
            </div>

            <div className="h-52">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={dailyTimelineData}
                  margin={{ top: 10, right: 10, left: 10, bottom: 0 }}
                >
                  <defs>
                    <linearGradient id="colorSpend" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.4}/>
                      <stop offset="95%" stopColor="#4f46e5" stopOpacity={0.0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="dayNumber" tick={{ fontSize: 10, fill: '#64748b' }} />
                  <YAxis 
                    tick={{ fontSize: 10, fill: '#64748b' }}
                    tickFormatter={(val) => val >= 1000 ? `${(val / 1000).toFixed(0)}k` : val}
                  />
                  <Tooltip
                    formatter={(val: any) => [formatCurrency(Number(val), currency), 'صرف اليوم']}
                    labelFormatter={(label) => `يوم ${label} من الشهر`}
                    contentStyle={{
                      backgroundColor: '#0f172a',
                      borderRadius: '12px',
                      color: '#fff',
                      fontSize: '12px',
                      border: 'none',
                      textAlign: 'right',
                      direction: 'rtl',
                    }}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="المصروف" 
                    stroke="#4f46e5" 
                    strokeWidth={2.5} 
                    fillOpacity={1} 
                    fill="url(#colorSpend)" 
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Spend by Expense Type */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Sliders className="w-5 h-5 text-indigo-600" />
                <h3 className="text-sm font-black text-slate-900">
                  توزيع النثريات حسب نوع المصروف
                </h3>
              </div>
              <span className="text-[11px] text-slate-500 font-bold">{typeStatsData.length} بنود</span>
            </div>

            <div className="space-y-3">
              {typeStatsData.map((item) => {
                const conf = TYPE_NAMES[item.type as DailyExpenseType] || { icon: Sliders, nameAr: item.name };
                const Icon = conf.icon;
                return (
                  <div key={item.type} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <div className="p-1 rounded bg-slate-100 text-slate-700">
                          <Icon className="w-3.5 h-3.5" />
                        </div>
                        <span className="font-bold text-slate-800">{item.name}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-black text-slate-900">{formatCurrency(item.المبلغ, currency)}</span>
                        <span className="text-[10px] text-slate-500 font-bold w-10 text-left">({item.percent}%)</span>
                      </div>
                    </div>
                    <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                      <div 
                        className="h-full rounded-full transition-all duration-300"
                        style={{ 
                          width: `${item.percent}%`,
                          backgroundColor: item.color || '#4f46e5'
                        }}
                      ></div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* AI Smart Financial Observations Card */}
          <div className="bg-gradient-to-br from-indigo-50 via-slate-50 to-amber-50 rounded-2xl border border-indigo-100 p-5 shadow-sm space-y-3">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-indigo-600" />
              <h4 className="text-xs font-black text-indigo-950">الملاحظات والتوصيات التحليلية الذكية</h4>
            </div>

            <ul className="text-xs text-slate-700 space-y-2 list-disc list-inside leading-relaxed">
              {topSpendingDept && (
                <li>
                  القسم ذو الكثافة الإنفاقية الأعلى هو <strong className="text-indigo-900">{topSpendingDept.nameAr}</strong> بنسبة استهلاك تمثل <strong className="text-indigo-900">{((topSpendingDept.actualSpentInBase / (totalMonthlySpendInBase || 1)) * 100).toFixed(0)}%</strong> من إجمالي النثريات.
                </li>
              )}
              {departmentStats.some(d => d.actualSpentInBase > d.allocatedBudget && d.allocatedBudget > 0) ? (
                <li className="text-rose-700 font-bold">
                  ⚠️ يوجد قسم أو أكثر تجاوز الموازنة التقديرية المخصصة للشهر. يُنصح بمراجعة طلبات الصرف الاستثنائية.
                </li>
              ) : (
                <li className="text-emerald-700 font-bold">
                  ✅ كافة الأقسام منضبطة مالياً وضمن الحدود والموازنات الشهرية المعتمدة.
                </li>
              )}
              <li>
                نوع المصروف الأكثر تكراراً خلال هذه الفترة هو <strong className="text-slate-900">{typeStatsData[0]?.name || 'بوفيه وضيافة'}</strong>.
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Detailed Department Analytics Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 bg-slate-50/80 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-black text-slate-900">
              جدول التحليل المالي والرقابي المفصل للأقسام (Department Financial Audit Table)
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">مقارنة دقيقة بين الموازنة والمنصرف الفعلي ونسبة الاستهلاك لكل قسم</p>
          </div>

          <div className="text-xs text-slate-600 font-bold flex items-center gap-2">
            <span>إجمالي الأقسام: {departmentStats.length}</span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-right text-xs">
            <thead className="bg-slate-100 text-slate-700 font-black border-b border-slate-200">
              <tr>
                <th className="p-3.5">كود واسم القسم</th>
                <th className="p-3.5">المدير المسؤول</th>
                <th className="p-3.5">الموازنة الشهرية المعتمدة</th>
                <th className="p-3.5">المنصرف الفعلي (الشهر)</th>
                <th className="p-3.5">نسبة الاستهلاك والمؤشر</th>
                <th className="p-3.5">المتبقي / (التجاوز)</th>
                <th className="p-3.5">عدد الحركات</th>
                <th className="p-3.5 text-center">حالة الالتزام</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {departmentStats.map((dept) => {
                const actualDisplay = convertAmount(dept.actualSpentInBase, 'YER', currency, rates);
                const budgetDisplay = convertAmount(dept.allocatedBudget, 'YER', currency, rates);
                const varianceInBase = dept.allocatedBudget - dept.actualSpentInBase;
                const varianceDisplay = convertAmount(varianceInBase, 'YER', currency, rates);
                const percent = dept.allocatedBudget > 0 
                  ? Math.round((dept.actualSpentInBase / dept.allocatedBudget) * 100) 
                  : 0;
                const isOverBudget = dept.actualSpentInBase > dept.allocatedBudget && dept.allocatedBudget > 0;
                const isNearLimit = percent >= 80 && percent <= 100;

                return (
                  <tr key={dept.id} className="hover:bg-indigo-50/30 transition">
                    <td className="p-3.5">
                      <div className="font-bold text-slate-900">{dept.nameAr}</div>
                      <div className="text-[10px] font-mono text-slate-400">{dept.code}</div>
                    </td>
                    <td className="p-3.5 text-slate-700 font-medium">
                      {dept.managerName}
                    </td>
                    <td className="p-3.5 font-bold text-slate-800">
                      {formatCurrency(budgetDisplay, currency)}
                    </td>
                    <td className="p-3.5 font-black text-indigo-900">
                      {formatCurrency(actualDisplay, currency)}
                    </td>
                    <td className="p-3.5 w-48">
                      <div className="flex items-center justify-between text-[11px] mb-1 font-bold">
                        <span className={isOverBudget ? 'text-rose-600' : isNearLimit ? 'text-amber-600' : 'text-slate-700'}>
                          {percent}%
                        </span>
                      </div>
                      <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                        <div
                          className={`h-full transition-all duration-300 ${
                            isOverBudget ? 'bg-rose-500' : isNearLimit ? 'bg-amber-500' : 'bg-emerald-500'
                          }`}
                          style={{ width: `${Math.min(100, percent)}%` }}
                        ></div>
                      </div>
                    </td>
                    <td className="p-3.5 font-bold">
                      {varianceInBase >= 0 ? (
                        <span className="text-emerald-700 flex items-center gap-0.5">
                          <ArrowDownRight className="w-3 h-3" />
                          {formatCurrency(varianceDisplay, currency)}
                        </span>
                      ) : (
                        <span className="text-rose-700 font-black flex items-center gap-0.5">
                          <ArrowUpRight className="w-3 h-3" />
                          ({formatCurrency(Math.abs(varianceDisplay), currency)})
                        </span>
                      )}
                    </td>
                    <td className="p-3.5 font-bold text-slate-700">
                      {dept.count} عملية
                    </td>
                    <td className="p-3.5 text-center">
                      {isOverBudget ? (
                        <span className="bg-rose-100 text-rose-800 border border-rose-200 text-[10px] font-black px-2.5 py-1 rounded-full inline-flex items-center gap-1">
                          <AlertTriangle className="w-3 h-3 text-rose-600" />
                          تجاوز الموازنة
                        </span>
                      ) : isNearLimit ? (
                        <span className="bg-amber-100 text-amber-800 border border-amber-200 text-[10px] font-black px-2.5 py-1 rounded-full inline-flex items-center gap-1">
                          <Info className="w-3 h-3 text-amber-600" />
                          اقتراب من الحد
                        </span>
                      ) : (
                        <span className="bg-emerald-100 text-emerald-800 border border-emerald-200 text-[10px] font-black px-2.5 py-1 rounded-full inline-flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                          منضبط بالموازنة
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
