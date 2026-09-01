import React, { useState, useMemo } from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area
} from 'recharts';
import { 
  Users, 
  Truck, 
  TrendingUp, 
  ArrowUpRight, 
  ArrowDownLeft, 
  Scale, 
  PieChart as PieChartIcon, 
  BarChart3, 
  Layers, 
  ExternalLink,
  Info,
  CheckCircle2,
  AlertTriangle
} from 'lucide-react';
import { Customer, Vendor, Currency } from '../types/accounting';
import { formatCurrency, convertAmount } from '../utils/formatters';

interface ReceivablesPayablesWidgetProps {
  customers: Customer[];
  vendors: Vendor[];
  currency: Currency;
  rates: Record<Currency, number>;
  onNavigateToModule?: (moduleKey: string) => void;
}

type TabType = 'overview' | 'customers' | 'vendors' | 'cities';

// Sophisticated corporate color palette
const COLORS = {
  arPrimary: '#2563eb', // Blue-600
  arPaid: '#10b981',    // Emerald-500
  arOutstanding: '#3b82f6', // Blue-500
  apPrimary: '#f59e0b', // Amber-500
  apPaid: '#059669',    // Emerald-600
  apOutstanding: '#ef4444', // Red-500
  pieColors: ['#2563eb', '#0284c7', '#0d9488', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#64748b']
};

export const ReceivablesPayablesWidget: React.FC<ReceivablesPayablesWidgetProps> = ({
  customers,
  vendors,
  currency,
  rates,
  onNavigateToModule,
}) => {
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [chartViewType, setChartViewType] = useState<'bar' | 'pie'>('bar');
  const [topCount, setTopCount] = useState<number>(7);

  // 1. Overall Aggregations
  const stats = useMemo(() => {
    // Customers (AR)
    const totalArBalanceYER = customers.reduce((sum, c) => sum + (c.currentBalance || 0), 0);
    const totalArPaidYER = customers.reduce((sum, c) => sum + (c.totalPaid || 0), 0);
    const totalArOpsYER = customers.reduce((sum, c) => sum + (c.totalOperations || (c.currentBalance + (c.totalPaid || 0))), 0);
    const arCollectionRate = totalArOpsYER > 0 ? (totalArPaidYER / totalArOpsYER) * 100 : 0;
    const customersWithDebt = customers.filter(c => (c.currentBalance || 0) > 0).length;

    // Vendors (AP)
    const totalApBalanceYER = vendors.reduce((sum, v) => sum + (v.currentBalance || 0), 0);
    const totalApPaidYER = vendors.reduce((sum, v) => sum + (v.totalPaid || 0), 0);
    const totalApOpsYER = vendors.reduce((sum, v) => sum + (v.totalOperations || (v.currentBalance + (v.totalPaid || 0))), 0);
    const apPaymentRate = totalApOpsYER > 0 ? (totalApPaidYER / totalApOpsYER) * 100 : 0;
    const vendorsWithPayable = vendors.filter(v => (v.currentBalance || 0) > 0).length;

    // Net Liquidity / Position
    const netPositionYER = totalArBalanceYER - totalApBalanceYER;

    return {
      totalArBalance: convertAmount(totalArBalanceYER, 'YER', currency, rates),
      totalArPaid: convertAmount(totalArPaidYER, 'YER', currency, rates),
      totalArOps: convertAmount(totalArOpsYER, 'YER', currency, rates),
      arCollectionRate,
      customersWithDebt,

      totalApBalance: convertAmount(totalApBalanceYER, 'YER', currency, rates),
      totalApPaid: convertAmount(totalApPaidYER, 'YER', currency, rates),
      totalApOps: convertAmount(totalApOpsYER, 'YER', currency, rates),
      apPaymentRate,
      vendorsWithPayable,

      netPosition: convertAmount(netPositionYER, 'YER', currency, rates),
      netPositionYER,
    };
  }, [customers, vendors, currency, rates]);

  // 2. Overview Comparison Chart Data
  const comparisonData = useMemo(() => {
    return [
      {
        category: 'الذمم المدينة (العملاء)',
        'الرصيد المتبقي': stats.totalArBalance,
        'المبالغ المحصلة/المسددة': stats.totalArPaid,
        'إجمالي التعاملات': stats.totalArOps,
      },
      {
        category: 'الذمم الدائنة (الموردين)',
        'الرصيد المتبقي': stats.totalApBalance,
        'المبالغ المحصلة/المسددة': stats.totalApPaid,
        'إجمالي التعاملات': stats.totalApOps,
      },
    ];
  }, [stats]);

  // 3. Top Debtors (Customers)
  const topCustomersData = useMemo(() => {
    return [...customers]
      .sort((a, b) => (b.currentBalance || 0) - (a.currentBalance || 0))
      .slice(0, topCount)
      .map(c => ({
        name: c.nameAr.length > 20 ? c.nameAr.substring(0, 18) + '...' : c.nameAr,
        fullName: c.nameAr,
        code: c.code,
        'المديونية القائمة': convertAmount(c.currentBalance || 0, 'YER', currency, rates),
        'المسدد': convertAmount(c.totalPaid || 0, 'YER', currency, rates),
        collectionRate: c.paymentRate || 0,
      }));
  }, [customers, topCount, currency, rates]);

  // 4. Top Payable Vendors
  const topVendorsData = useMemo(() => {
    return [...vendors]
      .sort((a, b) => (b.currentBalance || 0) - (a.currentBalance || 0))
      .slice(0, topCount)
      .map(v => ({
        name: v.nameAr.length > 20 ? v.nameAr.substring(0, 18) + '...' : v.nameAr,
        fullName: v.nameAr,
        code: v.code,
        'المستحقات القائمة': convertAmount(v.currentBalance || 0, 'YER', currency, rates),
        'المسدد': convertAmount(v.totalPaid || 0, 'YER', currency, rates),
        paymentRate: v.paymentRate || 0,
      }));
  }, [vendors, topCount, currency, rates]);

  // 5. Debt Brackets (شرائح مديونيات العملاء)
  const customerBrackets = useMemo(() => {
    const brackets = [
      { name: 'أكثر من 500 ألف', min: 500000, max: Infinity, count: 0, total: 0 },
      { name: '200 - 500 ألف', min: 200000, max: 500000, count: 0, total: 0 },
      { name: '50 - 200 ألف', min: 50000, max: 200000, count: 0, total: 0 },
      { name: 'أقل من 50 ألف', min: 1, max: 50000, count: 0, total: 0 },
      { name: 'مسدد بالكامل (0)', min: 0, max: 0, count: 0, total: 0 },
    ];

    customers.forEach(c => {
      const bal = c.currentBalance || 0;
      if (bal === 0) {
        brackets[4].count += 1;
      } else {
        for (let i = 0; i < 4; i++) {
          if (bal >= brackets[i].min && bal < brackets[i].max) {
            brackets[i].count += 1;
            brackets[i].total += bal;
            break;
          }
        }
      }
    });

    return brackets.map(b => ({
      name: b.name,
      count: b.count,
      value: convertAmount(b.total, 'YER', currency, rates),
    }));
  }, [customers, currency, rates]);

  // 6. Vendor Brackets (شرائح مستحقات الموردين)
  const vendorBrackets = useMemo(() => {
    const brackets = [
      { name: 'أكثر من 500 ألف', min: 500000, max: Infinity, count: 0, total: 0 },
      { name: '200 - 500 ألف', min: 200000, max: 500000, count: 0, total: 0 },
      { name: '50 - 200 ألف', min: 50000, max: 200000, count: 0, total: 0 },
      { name: 'أقل من 50 ألف', min: 1, max: 50000, count: 0, total: 0 },
      { name: 'مسدد بالكامل (0)', min: 0, max: 0, count: 0, total: 0 },
    ];

    vendors.forEach(v => {
      const bal = v.currentBalance || 0;
      if (bal === 0) {
        brackets[4].count += 1;
      } else {
        for (let i = 0; i < 4; i++) {
          if (bal >= brackets[i].min && bal < brackets[i].max) {
            brackets[i].count += 1;
            brackets[i].total += bal;
            break;
          }
        }
      }
    });

    return brackets.map(b => ({
      name: b.name,
      count: b.count,
      value: convertAmount(b.total, 'YER', currency, rates),
    }));
  }, [vendors, currency, rates]);

  // 7. Geographic Distribution (حسب المدن/المحافظات)
  const cityDistribution = useMemo(() => {
    const cityMap: Record<string, { city: string; arBalance: number; apBalance: number; countC: number; countV: number }> = {};

    customers.forEach(c => {
      const city = c.city || 'الرئيسية';
      if (!cityMap[city]) {
        cityMap[city] = { city, arBalance: 0, apBalance: 0, countC: 0, countV: 0 };
      }
      cityMap[city].arBalance += c.currentBalance || 0;
      cityMap[city].countC += 1;
    });

    vendors.forEach(v => {
      const city = v.city || 'الرئيسية';
      if (!cityMap[city]) {
        cityMap[city] = { city, arBalance: 0, apBalance: 0, countC: 0, countV: 0 };
      }
      cityMap[city].apBalance += v.currentBalance || 0;
      cityMap[city].countV += 1;
    });

    return Object.values(cityMap)
      .map(item => ({
        city: item.city,
        'مديونيات العملاء': convertAmount(item.arBalance, 'YER', currency, rates),
        'مستحقات الموردين': convertAmount(item.apBalance, 'YER', currency, rates),
        total: item.arBalance + item.apBalance,
      }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 6);
  }, [customers, vendors, currency, rates]);

  // Custom Formatter Tooltip
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-slate-900/95 text-white p-3 rounded-lg shadow-xl border border-slate-800 text-xs z-50 min-w-[200px]" dir="rtl">
          <p className="font-bold text-slate-100 mb-1.5 border-b border-slate-700 pb-1">{label}</p>
          {payload.map((entry: any, index: number) => (
            <div key={`tooltip-${index}`} className="flex items-center justify-between py-1 gap-3">
              <span className="flex items-center gap-1.5 text-slate-300">
                <span className="w-2.5 h-2.5 rounded-sm inline-block" style={{ backgroundColor: entry.color || entry.fill }} />
                <span>{entry.name}:</span>
              </span>
              <span className="font-mono font-bold text-slate-100">
                {formatCurrency(entry.value, currency)}
              </span>
            </div>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-white border border-slate-200 rounded-xl shadow-xs p-5 sm:p-6 mb-6">
      {/* Widget Header & Navigation Tabs */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-100">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <BarChart3 className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-800 flex items-center gap-2">
                لوحة تحليلات الذمم والمديونيات (AR & AP Distribution)
                <span className="text-[10px] font-semibold bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full border border-emerald-100">
                  Recharts محرك بياني
                </span>
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                توزيع ومقارنة أرصدة مديونيات {customers.length} عميل مقابل التزامات {vendors.length} مورد ودائن
              </p>
            </div>
          </div>
        </div>

        {/* Tab Buttons */}
        <div className="flex items-center flex-wrap gap-1.5 bg-slate-100/80 p-1 rounded-xl">
          <button
            onClick={() => setActiveTab('overview')}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg transition ${
              activeTab === 'overview'
                ? 'bg-white text-blue-600 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            الموقف الإجمالي (AR / AP)
          </button>
          <button
            onClick={() => setActiveTab('customers')}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg transition ${
              activeTab === 'customers'
                ? 'bg-white text-blue-600 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            مديونيات العملاء
          </button>
          <button
            onClick={() => setActiveTab('vendors')}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg transition ${
              activeTab === 'vendors'
                ? 'bg-white text-blue-600 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            مستحقات الموردين
          </button>
          <button
            onClick={() => setActiveTab('cities')}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg transition ${
              activeTab === 'cities'
                ? 'bg-white text-blue-600 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            التوزيع الجغرافي
          </button>
        </div>
      </div>

      {/* Mini KPI Highlights Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 my-5">
        {/* AR Box */}
        <div className="bg-blue-50/50 border border-blue-100 rounded-xl p-3.5 flex items-center justify-between">
          <div>
            <div className="text-[11px] font-semibold text-blue-700 flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5 text-blue-600" />
              <span>صافي مديونيات العملاء</span>
            </div>
            <div className="text-lg font-bold text-blue-900 font-mono mt-1">
              {formatCurrency(stats.totalArBalance, currency)}
            </div>
            <div className="text-[10px] text-blue-600/80 mt-0.5">
              نسبة التحصيل: {stats.arCollectionRate.toFixed(1)}% ({stats.customersWithDebt} عميل مدين)
            </div>
          </div>
          {onNavigateToModule && (
            <button
              onClick={() => onNavigateToModule('accounts-receivable')}
              className="p-1.5 bg-blue-100 hover:bg-blue-200 text-blue-700 rounded-lg transition"
              title="فتح كشف العملاء"
            >
              <ExternalLink className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* AP Box */}
        <div className="bg-amber-50/50 border border-amber-100 rounded-xl p-3.5 flex items-center justify-between">
          <div>
            <div className="text-[11px] font-semibold text-amber-700 flex items-center gap-1.5">
              <Truck className="w-3.5 h-3.5 text-amber-600" />
              <span>مستحقات الموردين القائمة</span>
            </div>
            <div className="text-lg font-bold text-amber-900 font-mono mt-1">
              {formatCurrency(stats.totalApBalance, currency)}
            </div>
            <div className="text-[10px] text-amber-600/80 mt-0.5">
              نسبة السداد: {stats.apPaymentRate.toFixed(1)}% ({stats.vendorsWithPayable} جهة دائنة)
            </div>
          </div>
          {onNavigateToModule && (
            <button
              onClick={() => onNavigateToModule('accounts-payable')}
              className="p-1.5 bg-amber-100 hover:bg-amber-200 text-amber-700 rounded-lg transition"
              title="فتح كشف الموردين"
            >
              <ExternalLink className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Net Liquidity / Balance Gap */}
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 flex items-center justify-between">
          <div>
            <div className="text-[11px] font-semibold text-slate-700 flex items-center gap-1.5">
              <Scale className="w-3.5 h-3.5 text-slate-600" />
              <span>الفارق المالي (AR - AP)</span>
            </div>
            <div className={`text-lg font-bold font-mono mt-1 ${stats.netPositionYER >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
              {formatCurrency(stats.netPosition, currency)}
            </div>
            <div className="text-[10px] text-slate-500 mt-0.5">
              {stats.netPositionYER >= 0 ? 'فائض مستحقات لصالح المنشأة' : 'عجز والتزامات دائنة تفوق المديونيات'}
            </div>
          </div>
        </div>

        {/* Collection & Payment Efficiency */}
        <div className="bg-emerald-50/50 border border-emerald-100 rounded-xl p-3.5 flex items-center justify-between">
          <div>
            <div className="text-[11px] font-semibold text-emerald-700 flex items-center gap-1.5">
              <TrendingUp className="w-3.5 h-3.5 text-emerald-600" />
              <span>المبالغ المحصلة والمسددة</span>
            </div>
            <div className="text-sm font-bold text-emerald-800 font-mono mt-1">
              تحصيل: {formatCurrency(stats.totalArPaid, currency)}
            </div>
            <div className="text-[10px] text-emerald-700/80 mt-0.5 font-mono">
              سداد: {formatCurrency(stats.totalApPaid, currency)}
            </div>
          </div>
        </div>
      </div>

      {/* Main Chart Area Based on Active Tab */}
      <div className="pt-2">
        {/* 1. OVERVIEW TAB */}
        {activeTab === 'overview' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between text-xs text-slate-500 mb-2">
              <span className="font-semibold text-slate-700">مقارنة إجماليات الذمم المدينة (AR) مقابل الذمم الدائنة (AP)</span>
              <span className="text-[11px] text-slate-400">القيم معروضة بـ {currency}</span>
            </div>

            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={comparisonData}
                  margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                  <XAxis dataKey="category" tick={{ fill: '#475569', fontSize: 12, fontWeight: 'bold' }} />
                  <YAxis 
                    tickFormatter={(val) => `${(val / 1000000).toFixed(1)}M`} 
                    tick={{ fill: '#64748b', fontSize: 11 }}
                    orientation="right"
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend 
                    verticalAlign="top" 
                    height={36} 
                    iconType="circle"
                    formatter={(value) => <span className="text-xs font-semibold text-slate-700 ml-3">{value}</span>}
                  />
                  <Bar dataKey="الرصيد المتبقي" fill="#2563eb" radius={[6, 6, 0, 0]} maxBarSize={60} />
                  <Bar dataKey="المبالغ المحصلة/المسددة" fill="#10b981" radius={[6, 6, 0, 0]} maxBarSize={60} />
                  <Bar dataKey="إجمالي التعاملات" fill="#94a3b8" radius={[6, 6, 0, 0]} maxBarSize={60} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Quick Insights Cards Below Chart */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
              <div className="bg-slate-50 border border-slate-100 rounded-xl p-4 flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center shrink-0 mt-0.5">
                  <Info className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-800">مؤشر دورة التحصيل التجاري</h4>
                  <p className="text-[11px] text-slate-600 mt-1 leading-relaxed">
                    بلغت نسبة التحصيل من العملاء <strong className="text-blue-700">{stats.arCollectionRate.toFixed(1)}%</strong>، مما يعكس كفاءة جيدة في تدفقات النقدية الواردة مع بقاء {stats.customersWithDebt} عميل بحاجة لمتابعة دورية.
                  </p>
                </div>
              </div>

              <div className="bg-slate-50 border border-slate-100 rounded-xl p-4 flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center shrink-0 mt-0.5">
                  <CheckCircle2 className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-800">مؤشر الوفاء بالتزامات التوريد</h4>
                  <p className="text-[11px] text-slate-600 mt-1 leading-relaxed">
                    تم سداد <strong className="text-emerald-700">{stats.apPaymentRate.toFixed(1)}%</strong> من إجمالي فواتير التوريد، وتبلغ المديونية المتبقية للموردين {formatCurrency(stats.totalApBalance, currency)}.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 2. CUSTOMERS DEEP DIVE TAB */}
        {activeTab === 'customers' && (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <span className="text-xs font-bold text-slate-700">
                أعلى {topCount} عملاء مديونية (الذمم المدينة) ونسب السداد
              </span>
              
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-500">عرض:</span>
                {[5, 7, 10].map(cnt => (
                  <button
                    key={cnt}
                    onClick={() => setTopCount(cnt)}
                    className={`px-2 py-1 rounded text-xs font-bold ${
                      topCount === cnt ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    أعلى {cnt}
                  </button>
                ))}

                <div className="border-r border-slate-200 h-4 mx-1"></div>

                <div className="flex items-center bg-slate-100 p-0.5 rounded-lg">
                  <button
                    onClick={() => setChartViewType('bar')}
                    className={`p-1 rounded ${chartViewType === 'bar' ? 'bg-white shadow-xs text-blue-600' : 'text-slate-500'}`}
                    title="مخطط أعمدة"
                  >
                    <BarChart3 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => setChartViewType('pie')}
                    className={`p-1 rounded ${chartViewType === 'pie' ? 'bg-white shadow-xs text-blue-600' : 'text-slate-500'}`}
                    title="توزيع الشرائح (دائري)"
                  >
                    <PieChartIcon className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>

            {chartViewType === 'bar' ? (
              <div className="h-72 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={topCustomersData}
                    margin={{ top: 20, right: 30, left: 20, bottom: 25 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                    <XAxis 
                      dataKey="name" 
                      tick={{ fill: '#334155', fontSize: 11, fontWeight: 600 }}
                      interval={0}
                      angle={-15}
                      textAnchor="end"
                    />
                    <YAxis 
                      tickFormatter={(val) => `${(val / 1000).toFixed(0)}k`} 
                      tick={{ fill: '#64748b', fontSize: 11 }}
                      orientation="right"
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend 
                      verticalAlign="top" 
                      height={32}
                      formatter={(value) => <span className="text-xs font-semibold text-slate-700 ml-3">{value}</span>}
                    />
                    <Bar dataKey="المديونية القائمة" fill="#2563eb" radius={[6, 6, 0, 0]} maxBarSize={45} />
                    <Bar dataKey="المسدد" fill="#10b981" radius={[6, 6, 0, 0]} maxBarSize={45} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 items-center">
                <div className="h-72 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={customerBrackets.filter(b => b.value > 0)}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={95}
                        paddingAngle={4}
                        dataKey="value"
                      >
                        {customerBrackets.map((_, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS.pieColors[index % COLORS.pieColors.length]} />
                        ))}
                      </Pie>
                      <Tooltip content={<CustomTooltip />} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>

                <div className="space-y-2">
                  <h4 className="text-xs font-bold text-slate-700 mb-2">شرائح مبالغ مديونيات العملاء:</h4>
                  {customerBrackets.map((bracket, idx) => (
                    <div key={bracket.name} className="flex items-center justify-between p-2 rounded-lg bg-slate-50 text-xs">
                      <div className="flex items-center gap-2">
                        <span 
                          className="w-3 h-3 rounded-full shrink-0" 
                          style={{ backgroundColor: COLORS.pieColors[idx % COLORS.pieColors.length] }}
                        />
                        <span className="font-medium text-slate-700">{bracket.name}</span>
                        <span className="text-[10px] text-slate-400">({bracket.count} عميل)</span>
                      </div>
                      <span className="font-mono font-bold text-slate-800">
                        {formatCurrency(bracket.value, currency)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* 3. VENDORS DEEP DIVE TAB */}
        {activeTab === 'vendors' && (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <span className="text-xs font-bold text-slate-700">
                أعلى {topCount} موردين مستحقات (الذمم الدائنة) والمبالغ المسددة
              </span>
              
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-500">عرض:</span>
                {[5, 7, 10].map(cnt => (
                  <button
                    key={cnt}
                    onClick={() => setTopCount(cnt)}
                    className={`px-2 py-1 rounded text-xs font-bold ${
                      topCount === cnt ? 'bg-amber-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    أعلى {cnt}
                  </button>
                ))}

                <div className="border-r border-slate-200 h-4 mx-1"></div>

                <div className="flex items-center bg-slate-100 p-0.5 rounded-lg">
                  <button
                    onClick={() => setChartViewType('bar')}
                    className={`p-1 rounded ${chartViewType === 'bar' ? 'bg-white shadow-xs text-amber-600' : 'text-slate-500'}`}
                    title="مخطط أعمدة"
                  >
                    <BarChart3 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => setChartViewType('pie')}
                    className={`p-1 rounded ${chartViewType === 'pie' ? 'bg-white shadow-xs text-amber-600' : 'text-slate-500'}`}
                    title="توزيع الشرائح (دائري)"
                  >
                    <PieChartIcon className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>

            {chartViewType === 'bar' ? (
              <div className="h-72 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={topVendorsData}
                    margin={{ top: 20, right: 30, left: 20, bottom: 25 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                    <XAxis 
                      dataKey="name" 
                      tick={{ fill: '#334155', fontSize: 11, fontWeight: 600 }}
                      interval={0}
                      angle={-15}
                      textAnchor="end"
                    />
                    <YAxis 
                      tickFormatter={(val) => `${(val / 1000).toFixed(0)}k`} 
                      tick={{ fill: '#64748b', fontSize: 11 }}
                      orientation="right"
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend 
                      verticalAlign="top" 
                      height={32}
                      formatter={(value) => <span className="text-xs font-semibold text-slate-700 ml-3">{value}</span>}
                    />
                    <Bar dataKey="المستحقات القائمة" fill="#f59e0b" radius={[6, 6, 0, 0]} maxBarSize={45} />
                    <Bar dataKey="المسدد" fill="#059669" radius={[6, 6, 0, 0]} maxBarSize={45} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 items-center">
                <div className="h-72 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={vendorBrackets.filter(b => b.value > 0)}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={95}
                        paddingAngle={4}
                        dataKey="value"
                      >
                        {vendorBrackets.map((_, index) => (
                          <Cell key={`cell-v-${index}`} fill={COLORS.pieColors[index % COLORS.pieColors.length]} />
                        ))}
                      </Pie>
                      <Tooltip content={<CustomTooltip />} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>

                <div className="space-y-2">
                  <h4 className="text-xs font-bold text-slate-700 mb-2">شرائح مستحقات الموردين:</h4>
                  {vendorBrackets.map((bracket, idx) => (
                    <div key={bracket.name} className="flex items-center justify-between p-2 rounded-lg bg-slate-50 text-xs">
                      <div className="flex items-center gap-2">
                        <span 
                          className="w-3 h-3 rounded-full shrink-0" 
                          style={{ backgroundColor: COLORS.pieColors[idx % COLORS.pieColors.length] }}
                        />
                        <span className="font-medium text-slate-700">{bracket.name}</span>
                        <span className="text-[10px] text-slate-400">({bracket.count} مورد)</span>
                      </div>
                      <span className="font-mono font-bold text-slate-800">
                        {formatCurrency(bracket.value, currency)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* 4. CITIES & GEOGRAPHIC TAB */}
        {activeTab === 'cities' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between text-xs text-slate-500 mb-2">
              <span className="font-semibold text-slate-700">التوزيع الجغرافي للمديونيات والمستحقات حسب المحافظات والمدن</span>
              <span className="text-[11px] text-slate-400">القيم بـ {currency}</span>
            </div>

            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={cityDistribution}
                  margin={{ top: 20, right: 30, left: 20, bottom: 10 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                  <XAxis dataKey="city" tick={{ fill: '#334155', fontSize: 12, fontWeight: 'bold' }} />
                  <YAxis 
                    tickFormatter={(val) => `${(val / 1000000).toFixed(1)}M`} 
                    tick={{ fill: '#64748b', fontSize: 11 }}
                    orientation="right"
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend 
                    verticalAlign="top" 
                    height={32}
                    formatter={(value) => <span className="text-xs font-semibold text-slate-700 ml-3">{value}</span>}
                  />
                  <Bar dataKey="مديونيات العملاء" fill="#2563eb" radius={[6, 6, 0, 0]} maxBarSize={50} />
                  <Bar dataKey="مستحقات الموردين" fill="#f59e0b" radius={[6, 6, 0, 0]} maxBarSize={50} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
