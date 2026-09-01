import React, { useState, useEffect } from 'react';
import { 
  BookOpen, 
  Layers, 
  Users, 
  Truck, 
  Building, 
  PieChart, 
  CheckCircle2, 
  Scale, 
  Sparkles,
  ArrowUpRight,
  Wallet,
  TrendingUp,
  FileText,
  Activity,
  ArrowRight,
  Package,
  Sliders,
  Store,
  QrCode,
  ShoppingBag,
  UserCheck,
  ArrowLeftRight,
  SlidersHorizontal,
  ArrowUp,
  ArrowDown,
  EyeOff,
  RotateCcw,
  LayoutGrid,
  Check,
  Briefcase,
  ShieldCheck,
  KeyRound,
  Receipt,
  Inbox,
  BarChart3
} from 'lucide-react';
import { Currency, Account, Invoice, FixedAsset, JournalEntry, Customer, Vendor, InventoryItem } from '../types/accounting';
import { formatCurrency, convertAmount } from '../utils/formatters';
import { ReceivablesPayablesWidget } from './ReceivablesPayablesWidget';
import { FinancialAnalyticsCard } from './FinancialAnalyticsCard';
import { SmartInventoryAlertsCard } from './SmartInventoryAlertsCard';
import { useLanguage } from '../contexts/LanguageContext';
import { 
  LaunchpadCustomizerModal, 
  WidgetItem, 
  ROLE_PRESETS, 
  RolePreset 
} from './LaunchpadCustomizerModal';

interface FioriLaunchpadProps {
  onSelectModule: (moduleKey: string) => void;
  accounts: Account[];
  journalEntries: JournalEntry[];
  customers: Customer[];
  vendors: Vendor[];
  fixedAssets: FixedAsset[];
  inventoryItems?: InventoryItem[];
  currency: Currency;
  rates: Record<Currency, number>;
  onOpenAiAssistant?: () => void;
}

const STORAGE_KEY = 'medo_fiori_launchpad_widgets_v2';

const DEFAULT_WIDGETS: WidgetItem[] = [
  {
    id: 'kpi_metrics',
    titleAr: 'بطاقة المؤشرات المالية السريعة (KPIs)',
    descAr: 'مؤشرات صافي الدخل، الذمم المدينة، مستحقات الموردين، والسيولة النقدية',
    categoryAr: 'نظرة عامة',
    visible: true,
    badgeAr: '4 مؤشرات حية',
  },
  {
    id: 'smart_inventory_alerts',
    titleAr: 'مركز تنبيهات المخزون الذكية والتموين',
    descAr: 'تنبيهات الأصناف الكاسدة، المنتهية الصلاحية، والمطلوب إعادة طلبها تلقائياً',
    categoryAr: 'سلسلة الإمداد',
    visible: true,
    badgeAr: 'تنبيهات حية ROP',
  },
  {
    id: 'financial_analytics',
    titleAr: 'البطاقة التحليلية المتقدمة للأداء المالي',
    descAr: 'تحليل التدفق النقدي، مقارنة الإيرادات بالمصروفات، ومؤشرات السيولة والنسب',
    categoryAr: 'تحليلات ذكية',
    visible: true,
    badgeAr: 'Recharts تفاعلي',
  },
  {
    id: 'receivables_payables',
    titleAr: 'بطاقة توزيع الذمم والتحصيل (AR / AP)',
    descAr: 'توزيع ديون العملاء والتزامات الموردين ونسب السداد والتحصيل الجغرافية',
    categoryAr: 'ذمم وحسابات',
    visible: true,
    badgeAr: 'رسم بياني وتوزيع',
  },
  {
    id: 'cost_centers',
    titleAr: 'تحليل مراكز التكلفة والمصروفات',
    descAr: 'نسب استهلاك الموازنات التشغيلية لمختلف الفروع ومراكز التكلفة',
    categoryAr: 'محاسبة إدارية',
    visible: true,
    badgeAr: 'YTD الأداء الفعلي',
  },
  {
    id: 'recent_transactions',
    titleAr: 'سجل آخر الحركات والقيود المحاسبية',
    descAr: 'عرض تفصيلي لأحدث قيود اليومية العامة مع إمكانية الانتقال السريع',
    categoryAr: 'الأستاذ العام',
    visible: true,
    badgeAr: 'تدفق فوري',
  },
  {
    id: 'fiori_tiles',
    titleAr: 'شبكة تطبيقات ووحدات SAP Fiori',
    descAr: 'أيقونات الوصول السريع لموديولات وشاشات العمليات وفق الرموز المعيارية (T-Codes)',
    categoryAr: 'التنقل والعمليات',
    visible: true,
    badgeAr: '12 موديول رئيسي',
  },
  {
    id: 'ai_advisor',
    titleAr: 'شريط المستشار المالي والتدقيق الذكي',
    descAr: 'مركز التحليل والذكاء الاصطناعي لفحص توازن الحسابات واكتشاف الفروقات',
    categoryAr: 'ذكاء اصطناعي',
    visible: true,
    badgeAr: 'AI Advisor',
  },
];

export const FioriLaunchpad: React.FC<FioriLaunchpadProps> = ({
  onSelectModule,
  accounts,
  journalEntries,
  customers,
  vendors,
  fixedAssets,
  inventoryItems = [],
  currency,
  rates,
  onOpenAiAssistant,
}) => {
  const { language, t } = useLanguage();
  const [activeGroup, setActiveGroup] = useState<string>('all');
  const [isCustomizerOpen, setIsCustomizerOpen] = useState<boolean>(false);
  const [activePresetId, setActivePresetId] = useState<string>('default_all');

  // Load widgets configuration from localStorage or default
  const [widgets, setWidgets] = useState<WidgetItem[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed: WidgetItem[] = JSON.parse(saved);
        // Merge with DEFAULT_WIDGETS in case new widgets were added
        const savedIds = new Set(parsed.map(w => w.id));
        const missing = DEFAULT_WIDGETS.filter(w => !savedIds.has(w.id));
        return [...parsed, ...missing];
      }
    } catch (e) {
      console.error('Failed to load launchpad widget config:', e);
    }
    return DEFAULT_WIDGETS;
  });

  // Save changes to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(widgets));
    } catch (e) {
      console.error('Failed to save launchpad widget config:', e);
    }
  }, [widgets]);

  // Widget management handlers
  const handleToggleVisibility = (widgetId: string) => {
    setWidgets(prev =>
      prev.map(w => (w.id === widgetId ? { ...w, visible: !w.visible } : w))
    );
  };

  const handleMoveWidget = (index: number, direction: 'up' | 'down') => {
    setWidgets(prev => {
      const copy = [...prev];
      const targetIndex = direction === 'up' ? index - 1 : index + 1;
      if (targetIndex < 0 || targetIndex >= copy.length) return prev;
      const temp = copy[index];
      copy[index] = copy[targetIndex];
      copy[targetIndex] = temp;
      return copy;
    });
  };

  const handleApplyPreset = (preset: RolePreset) => {
    setActivePresetId(preset.id);
    setWidgets(prev => {
      const map = new Map<string, WidgetItem>(prev.map(w => [w.id, w]));
      const newOrdered: WidgetItem[] = [];

      // Add ordered ones first
      preset.orderWidgetIds.forEach(id => {
        const item = map.get(id);
        if (item) {
          newOrdered.push({
            ...item,
            visible: preset.visibleWidgetIds.includes(id),
          });
          map.delete(id);
        }
      });

      // Add any remaining
      map.forEach(item => {
        newOrdered.push({
          ...item,
          visible: preset.visibleWidgetIds.includes(item.id),
        });
      });

      return newOrdered;
    });
  };

  const handleResetToDefault = () => {
    setWidgets(DEFAULT_WIDGETS);
    setActivePresetId('default_all');
  };

  // Live KPI Calculations
  const cashAccounts = accounts.filter(a => a.parentCode === '1110' || a.code.startsWith('111'));
  const totalCashYER = cashAccounts.reduce((sum, a) => sum + (a.balance || 0), 0);
  const totalCashDisplay = convertAmount(totalCashYER, 'YER', currency, rates);

  const totalReceivablesYER = customers.reduce((sum, c) => sum + (c.currentBalance || 0), 0);
  const totalReceivablesDisplay = convertAmount(totalReceivablesYER, 'YER', currency, rates);

  const totalPayablesYER = vendors.reduce((sum, v) => sum + (v.currentBalance || 0), 0);
  const totalPayablesDisplay = convertAmount(totalPayablesYER, 'YER', currency, rates);

  const totalRevenueYER = accounts.find(a => a.code === '4000')?.balance || 295000000;
  const totalExpensesYER = accounts.find(a => a.code === '5000')?.balance || 175000000;
  const netProfitYER = totalRevenueYER - totalExpensesYER;
  const netProfitDisplay = convertAmount(netProfitYER, 'YER', currency, rates);
  const netMarginPct = totalRevenueYER > 0 ? ((netProfitYER / totalRevenueYER) * 100).toFixed(1) : '24.5';

  const groups = [
    { id: 'all', labelAr: 'كافة التطبيقات والوحدات' },
    { id: 'sales_pos', labelAr: 'المبيعات ونقاط البيع (POS & SD)' },
    { id: 'fi', labelAr: 'المحاسبة المالية (FI)' },
    { id: 'supply_chain', labelAr: 'المشتريات والمخزون (MM)' },
    { id: 'hr', labelAr: 'الموارد البشرية (HCM / HR)' },
    { id: 'ar_ap', labelAr: 'العملاء والموردين (AR / AP)' },
    { id: 'co_aa', labelAr: 'الأصول والتكاليف (CO / AA)' },
    { id: 'analytics', labelAr: 'التقارير والذكاء المالي' },
  ];

  const tiles = [
    // Sales & POS & E-Invoicing
    {
      id: 'sales_management_app',
      group: 'sales_pos',
      titleAr: 'إدارة المبيعات ومردودات المبيعات',
      subtitleAr: 'فواتير المبيعات، المردودات، مصروفات الشحن، ومحافظ الدفع والصرافة',
      tCode: 'SD-INV / SD-RET',
      icon: Store,
      iconBg: 'bg-emerald-600',
      viewKey: 'sales-management',
      badge: 'فواتير ومردودات ومحافظ',
      kpi: 'دفع متعدد + صرافة',
    },
    {
      id: 'pos_terminal',
      group: 'sales_pos',
      titleAr: 'نقاط البيع والمبيعات المباشرة (POS)',
      subtitleAr: 'واجهة كاشير سريعة، قارئ باركود، ومشاركة الفواتير فوري',
      tCode: 'POS / SD',
      icon: Store,
      iconBg: 'bg-teal-600',
      viewKey: 'pos',
      badge: 'واجهة كاشير فورية',
      kpi: 'دعم قارئ الباركود',
    },
    {
      id: 'einvoice_zatca',
      group: 'sales_pos',
      titleAr: 'الفاتورة الإلكترونية والباركود الذكي',
      subtitleAr: 'فواتير B2B و B2C المشفرة بـ TLV QR ومحاكي ZATCA',
      tCode: 'ZATCA / QR',
      icon: QrCode,
      iconBg: 'bg-purple-600',
      viewKey: 'e-invoicing',
      badge: 'ZATCA Phase 1 & 2',
      kpi: 'مشفر 100% TLV',
    },
    {
      id: 'procurement_orders',
      group: 'supply_chain',
      titleAr: 'المشتريات وأوامر الشراء',
      subtitleAr: 'طلبات الشراء، عروض الأسعار، وأوامر التوريد والاستلام',
      tCode: 'MM-PUR',
      icon: ShoppingBag,
      iconBg: 'bg-amber-600',
      viewKey: 'procurement',
      badge: 'دورة مشتريات كاملة',
      kpi: 'سندات استلام GRN',
    },
    {
      id: 'hr_payroll_mod',
      group: 'hr',
      titleAr: 'الموارد البشرية والرواتب',
      subtitleAr: 'ملفات الموظفين، مسيرات الرواتب الشهرية والترحيل المحاسبي',
      tCode: 'HCM / PA / PY',
      icon: UserCheck,
      iconBg: 'bg-blue-600',
      viewKey: 'hr-payroll',
      badge: 'مسير رواتب آلي',
      kpi: 'ترحيل قيد الأجور',
    },

    // FI
    {
      id: 'gl_entry',
      group: 'fi',
      titleAr: 'ترحيل قيد يومية',
      subtitleAr: 'إنشاء وموازنة القيود المحاسبية للأستاذ العام',
      tCode: 'FB50',
      icon: BookOpen,
      iconBg: 'bg-blue-600',
      viewKey: 'general-ledger',
      badge: `${journalEntries.length} قيد مرحّل`,
      kpi: 'متوازن 100%',
    },
    {
      id: 'chart_accounts',
      group: 'fi',
      titleAr: 'دليل الحسابات الشجري',
      subtitleAr: 'هيكلية الأصول، الخصوم، الإيرادات والمصروفات',
      tCode: 'FS00',
      icon: Layers,
      iconBg: 'bg-slate-700',
      viewKey: 'chart-of-accounts',
      badge: `${accounts.length} حساب مالي`,
      kpi: '5 مستويات شجرية',
    },
    {
      id: 'bank_rec',
      group: 'fi',
      titleAr: 'التسويات البنكية والخزينة',
      subtitleAr: 'مطابقة كشوفات الحساب والتحويلات النقدية',
      tCode: 'FF67',
      icon: CheckCircle2,
      iconBg: 'bg-cyan-600',
      viewKey: 'bank-reconciliation',
      badge: '4 حسابات نشطة',
      kpi: 'مطابقة آلية',
    },
    {
      id: 'expenses_revenues_app',
      group: 'fi',
      titleAr: 'إدارة المصروفات والإيرادات (الرقابة المزدوجة)',
      subtitleAr: 'سندات الصرف والقبض، شجرة التصنيفات واعتماد السيولة اليومية',
      tCode: 'F-02 / DUAL-CTL',
      icon: Receipt,
      iconBg: 'bg-rose-700',
      viewKey: 'expenses-revenues',
      badge: 'رقابة مزدوجة Dual Control',
      kpi: 'ربط أستاذ عام آلي',
    },
    {
      id: 'internal_inbox_app',
      group: 'fi',
      titleAr: 'صندوق الوارد والرسائل والإشعارات',
      subtitleAr: 'شبكة الاتصالات والتنبيهات ودورات اعتماد الفواتير والسندات',
      tCode: 'INBOX / MSG',
      icon: Inbox,
      iconBg: 'bg-indigo-700',
      viewKey: 'internal-inbox',
      badge: 'تنبيهات فورية',
      kpi: 'واتساب وتيليجرام',
    },

    // MM / Inventory
    {
      id: 'inventory_mgmt',
      group: 'supply_chain',
      titleAr: 'إدارة المخزون والمستودعات',
      subtitleAr: 'دليل الأصناف، أرصدة المستودعات وحركات MIGO',
      tCode: 'MM01 / MIGO',
      icon: Package,
      iconBg: 'bg-teal-600',
      viewKey: 'inventory',
      badge: '1100+ صنف مسجل',
      kpi: 'ربط محاسبي آلي',
    },

    // AR / AP
    {
      id: 'ar_invoices',
      group: 'ar_ap',
      titleAr: 'العملاء والذمم المدينة',
      subtitleAr: 'فواتير المبيعات الضريبية وسندات القبض',
      tCode: 'FB70',
      icon: Users,
      iconBg: 'bg-emerald-600',
      viewKey: 'accounts-receivable',
      badge: `${customers.length} عملاء رئيسيين`,
      kpi: formatCurrency(totalReceivablesDisplay, currency),
    },
    {
      id: 'ap_bills',
      group: 'ar_ap',
      titleAr: 'الموردين والذمم الدائنة',
      subtitleAr: 'فواتير المشتريات، الاستحقاقات وسندات الصرف',
      tCode: 'FB60',
      icon: Truck,
      iconBg: 'bg-amber-600',
      viewKey: 'accounts-payable',
      badge: `${vendors.length} موردين معتمدين`,
      kpi: formatCurrency(totalPayablesDisplay, currency),
    },

    // CO & AA
    {
      id: 'fixed_assets',
      group: 'co_aa',
      titleAr: 'محاسبة الأصول الثابتة',
      subtitleAr: 'سجل الأصول ودورات الإهلاك الآلية الشهرية',
      tCode: 'AS01',
      icon: Building,
      iconBg: 'bg-purple-600',
      viewKey: 'fixed-assets',
      badge: `${fixedAssets.length} أصول مسجلة`,
      kpi: 'إهلاك آلي AFAB',
    },
    {
      id: 'controlling_cost',
      group: 'co_aa',
      titleAr: 'مراكز التكلفة والربحية',
      subtitleAr: 'الموازنات التقديرية وتحليل الانحراف المالي',
      tCode: 'KS01',
      icon: PieChart,
      iconBg: 'bg-rose-600',
      viewKey: 'controlling',
      badge: '4 مراكز تكلفة',
      kpi: 'تحليل الانحراف YTD',
    },
    {
      id: 'budgeting_management',
      group: 'analytics',
      titleAr: 'الموازنات التقديرية والفعلية',
      subtitleAr: 'التخطيط المالي، مقارنة Actual vs. Budget، والتنبيهات الذكية',
      tCode: 'FMBB / S_ALR',
      icon: BarChart3,
      iconBg: 'bg-indigo-900',
      viewKey: 'budgeting',
      badge: 'رقابة مالية استراتيجية',
      kpi: 'تحليل الفروقات الحية',
    },

    // Reports & AI
    {
      id: 'financial_reports',
      group: 'analytics',
      titleAr: 'التقارير والقوائم المالية',
      subtitleAr: 'ميزان المراجعة، قائمة الدخل، والميزانية العمومية',
      tCode: 'F.01',
      icon: Scale,
      iconBg: 'bg-indigo-700',
      viewKey: 'financial-reports',
      badge: 'معايير IFRS',
      kpi: `هامش الربح ${netMarginPct}%`,
    },
    {
      id: 'system_settings',
      group: 'fi',
      titleAr: 'تهيئة وإعدادات النظام الشاملة',
      subtitleAr: 'بيانات المنشأة، الفروع، العملات، الضرائب، ووحدات النظام',
      tCode: 'SPRO',
      icon: Sliders,
      iconBg: 'bg-slate-800',
      viewKey: 'settings',
      badge: 'SPRO Administration',
      kpi: 'إعدادات مركزية',
    },
    {
      id: 'security_role_management',
      group: 'fi',
      titleAr: 'إدارة المستخدمين والأدوار وكلمات المرور',
      subtitleAr: 'تعديل صلاحيات الأدوار، إعادة تعيين كلمات المرور، وإصدار الحسابات',
      tCode: 'SU01 / Security',
      icon: ShieldCheck,
      iconBg: 'bg-rose-700',
      viewKey: 'role-management',
      badge: 'تحكم أمان كامل',
      kpi: 'إعادة تعيين كلمات المرور',
    },
  ];

  const filteredTiles = activeGroup === 'all'
    ? tiles
    : tiles.filter(t => t.group === activeGroup);

  // Quick helper to render card actions bar (move up, move down, hide)
  const renderCardControls = (widgetIndex: number, widgetId: string) => {
    return (
      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          onClick={(e) => {
            e.stopPropagation();
            handleMoveWidget(widgetIndex, 'up');
          }}
          disabled={widgetIndex === 0}
          className="p-1 rounded-md bg-white border border-slate-200 text-slate-500 hover:text-blue-600 disabled:opacity-20 transition"
          title="تحريك لأعلى"
        >
          <ArrowUp className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation();
            handleMoveWidget(widgetIndex, 'down');
          }}
          disabled={widgetIndex === widgets.length - 1}
          className="p-1 rounded-md bg-white border border-slate-200 text-slate-500 hover:text-blue-600 disabled:opacity-20 transition"
          title="تحريك لأسفل"
        >
          <ArrowDown className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation();
            handleToggleVisibility(widgetId);
          }}
          className="p-1 rounded-md bg-white border border-slate-200 text-slate-500 hover:text-rose-600 transition"
          title="إخفاء البطاقة من اللوحة"
        >
          <EyeOff className="w-3.5 h-3.5" />
        </button>
      </div>
    );
  };

  // Helper to render individual widgets based on their ID
  const renderWidgetContent = (widget: WidgetItem, index: number) => {
    if (!widget.visible) return null;

    switch (widget.id) {
      case 'kpi_metrics':
        return (
          <div key="kpi_metrics" className="group relative">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-slate-500 flex items-center gap-1.5">
                <Wallet className="w-3.5 h-3.5 text-blue-600" />
                <span>المؤشرات المالية الرئيسية (KPIs)</span>
              </span>
              {renderCardControls(index, widget.id)}
            </div>

            {/* 4-Card Geometric Metric Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
              <div className="bg-white p-5 border border-slate-200 rounded-2xl shadow-xs hover:border-slate-300 transition">
                <div className="text-xs text-slate-500 mb-1.5 font-semibold flex items-center justify-between">
                  <span>صافي الدخل التشغيلي</span>
                  <span className="text-[10px] text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full font-bold">+12.4%</span>
                </div>
                <div className="text-2xl font-bold text-emerald-600 font-mono">
                  {formatCurrency(netProfitDisplay, currency)}
                </div>
                <div className="text-[11px] text-slate-400 mt-1">
                  هامش ربح إجمالي {netMarginPct}%
                </div>
              </div>

              <div className="bg-white p-5 border border-slate-200 rounded-2xl shadow-xs hover:border-slate-300 transition">
                <div className="text-xs text-slate-500 mb-1.5 font-semibold flex items-center justify-between">
                  <span>إجمالي الذمم المدينة (AR)</span>
                  <span className="text-[10px] text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full font-bold">متابعة تحصيل</span>
                </div>
                <div className="text-2xl font-bold text-slate-800 font-mono">
                  {formatCurrency(totalReceivablesDisplay, currency)}
                </div>
                <div className="text-[11px] text-slate-400 mt-1">
                  {customers.length} عملاء قطاع تجاري وحكومي
                </div>
              </div>

              <div className="bg-white p-5 border border-slate-200 rounded-2xl shadow-xs hover:border-slate-300 transition">
                <div className="text-xs text-slate-500 mb-1.5 font-semibold flex items-center justify-between">
                  <span>إجمالي مستحقات الموردين (AP)</span>
                  <span className="text-[10px] text-slate-600 bg-slate-100 px-2 py-0.5 rounded-full font-bold">ضمن الميزانية</span>
                </div>
                <div className="text-2xl font-bold text-rose-500 font-mono">
                  {formatCurrency(totalPayablesDisplay, currency)}
                </div>
                <div className="text-[11px] text-slate-400 mt-1">
                  {vendors.length} فواتير توريد مستحقة خلال 30 يوم
                </div>
              </div>

              <div className="bg-white p-5 border border-slate-200 rounded-2xl shadow-xs hover:border-slate-300 transition">
                <div className="text-xs text-slate-500 mb-1.5 font-semibold flex items-center justify-between">
                  <span>سيولة الصندوق والبنوك</span>
                  <span className="text-[10px] text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full font-bold">جاهزية نقدية</span>
                </div>
                <div className="text-2xl font-bold text-blue-600 font-mono">
                  {formatCurrency(totalCashDisplay, currency)}
                </div>
                <div className="text-[11px] text-slate-400 mt-1">
                  4 حسابات وخزن بنكية نشطة
                </div>
              </div>
            </div>
          </div>
        );

      case 'smart_inventory_alerts':
        return (
          <div key="smart_inventory_alerts" className="group relative">
            <div className="flex items-center justify-end mb-2">
              {renderCardControls(index, widget.id)}
            </div>
            <SmartInventoryAlertsCard
              items={inventoryItems}
              onNavigateToProcurement={() => onSelectModule('procurement')}
              currency={currency}
            />
          </div>
        );

      case 'financial_analytics':
        return (
          <div key="financial_analytics" className="group relative">
            <div className="flex items-center justify-end mb-2">
              {renderCardControls(index, widget.id)}
            </div>
            <FinancialAnalyticsCard
              accounts={accounts}
              journalEntries={journalEntries}
              currency={currency}
              rates={rates}
              onNavigate={onSelectModule}
              onOpenAiAssistant={onOpenAiAssistant}
            />
          </div>
        );

      case 'receivables_payables':
        return (
          <div key="receivables_payables" className="group relative">
            <div className="flex items-center justify-end mb-2">
              {renderCardControls(index, widget.id)}
            </div>
            <ReceivablesPayablesWidget
              customers={customers}
              vendors={vendors}
              currency={currency}
              rates={rates}
              onNavigateToModule={onSelectModule}
            />
          </div>
        );

      case 'cost_centers':
        return (
          <div key="cost_centers" className="group relative">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-slate-500 flex items-center gap-1.5">
                <PieChart className="w-3.5 h-3.5 text-rose-600" />
                <span>مراكز التكلفة والمصروفات</span>
              </span>
              {renderCardControls(index, widget.id)}
            </div>
            <div className="bg-white border border-slate-200 rounded-2xl shadow-xs p-6">
              <div className="flex justify-between items-center mb-5">
                <h3 className="font-bold text-slate-800 text-sm">
                  تحليل مراكز التكلفة والمصروفات الفعلية
                </h3>
                <span className="text-[11px] text-blue-600 font-bold bg-blue-50 px-2.5 py-1 rounded-lg">
                  YTD الأداء الفعلي
                </span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <div className="flex items-center justify-between text-xs mb-1.5">
                    <span className="text-slate-700 font-medium">فرع صنعاء - المبيعات والعمليات</span>
                    <span className="text-slate-800 font-bold font-mono">74.2%</span>
                  </div>
                  <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
                    <div className="w-[74.2%] h-full bg-blue-600 rounded-full"></div>
                  </div>
                </div>

                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <div className="flex items-center justify-between text-xs mb-1.5">
                    <span className="text-slate-700 font-medium">الإدارة العليا والمركز الرئيسي</span>
                    <span className="text-slate-800 font-bold font-mono">69.3%</span>
                  </div>
                  <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
                    <div className="w-[69.3%] h-full bg-emerald-500 rounded-full"></div>
                  </div>
                </div>

                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <div className="flex items-center justify-between text-xs mb-1.5">
                    <span className="text-slate-700 font-medium">فرع عدن - اللوجستيات والميناء</span>
                    <span className="text-slate-800 font-bold font-mono">76.1%</span>
                  </div>
                  <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
                    <div className="w-[76.1%] h-full bg-amber-500 rounded-full"></div>
                  </div>
                </div>

                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <div className="flex items-center justify-between text-xs mb-1.5">
                    <span className="text-slate-700 font-medium">التحول الرقمي والبنية السحابية</span>
                    <span className="text-slate-800 font-bold font-mono">66.4%</span>
                  </div>
                  <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
                    <div className="w-[66.4%] h-full bg-purple-500 rounded-full"></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );

      case 'recent_transactions':
        return (
          <div key="recent_transactions" className="group relative">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-slate-500 flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-indigo-600" />
                <span>حركات الأستاذ العام الحديثة</span>
              </span>
              {renderCardControls(index, widget.id)}
            </div>
            <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
              <div className="p-4 bg-slate-50 border-b border-slate-200 flex justify-between items-center">
                <h3 className="font-bold text-slate-800 text-sm">
                  آخر الحركات والقيود المحاسبية
                </h3>
                <button 
                  onClick={() => onSelectModule('general-ledger')}
                  className="text-[11px] text-blue-600 hover:text-blue-700 font-bold transition"
                >
                  عرض سجل الأستاذ العام ←
                </button>
              </div>

              <div className="divide-y divide-slate-100">
                {journalEntries.slice(0, 5).map((je) => (
                  <div 
                    key={je.id}
                    onClick={() => onSelectModule('general-ledger')}
                    className="p-3.5 flex items-center justify-between hover:bg-slate-50 transition-colors cursor-pointer"
                  >
                    <div>
                      <div className="text-xs font-bold text-slate-800 flex items-center gap-2">
                        <span>{je.entryNumber}</span>
                        <span className="text-[10px] font-normal text-slate-400 font-mono">{je.date}</span>
                      </div>
                      <div className="text-[11px] text-slate-500 mt-0.5 line-clamp-1">
                        {je.description}
                      </div>
                    </div>

                    <div className="text-left font-mono text-xs font-bold text-slate-900">
                      {formatCurrency(je.totalDebit, 'YER')}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        );

      case 'fiori_tiles':
        return (
          <div key="fiori_tiles" className="group relative space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-sm sm:text-base font-extrabold text-slate-800 flex items-center gap-2">
                  <LayoutGrid className="w-5 h-5 text-blue-600" />
                  <span>تطبيقات ووحدات النظام المحاسبية (SAP Fiori Modules):</span>
                </span>
              </div>
              {renderCardControls(index, widget.id)}
            </div>

            {/* Category Navigation Pills */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1">
              {groups.map((grp) => (
                <button
                  key={grp.id}
                  onClick={() => setActiveGroup(grp.id)}
                  className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition whitespace-nowrap ${
                    activeGroup === grp.id
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'bg-white text-slate-700 border border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                  }`}
                >
                  {grp.labelAr}
                </button>
              ))}
            </div>

            {/* SAP Fiori Geometric Tile Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {filteredTiles.map((tile) => {
                const Icon = tile.icon;
                return (
                  <div
                    key={tile.id}
                    onClick={() => onSelectModule(tile.viewKey)}
                    className="bg-white hover:bg-blue-50/20 border border-slate-200 hover:border-blue-500/60 rounded-2xl p-5 cursor-pointer transition shadow-xs hover:shadow-md flex flex-col justify-between group/tile"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-3.5">
                        <div className={`w-11 h-11 rounded-xl ${tile.iconBg} text-white flex items-center justify-center shadow-xs group-hover/tile:scale-105 transition-transform`}>
                          <Icon className="w-5 h-5" />
                        </div>
                        <span className="text-[11px] font-mono font-bold text-slate-600 bg-slate-100 px-2.5 py-0.5 rounded-md border border-slate-200">
                          {tile.tCode}
                        </span>
                      </div>

                      <h3 className="text-base sm:text-[17px] font-extrabold text-slate-900 group-hover/tile:text-blue-600 transition-colors leading-snug">
                        {tile.titleAr}
                      </h3>
                      <p className="text-xs text-slate-500 mt-1.5 line-clamp-2 leading-relaxed">
                        {tile.subtitleAr}
                      </p>
                    </div>

                    <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                      <span className="text-xs font-bold text-slate-700 font-mono">
                        {tile.kpi}
                      </span>
                      <span className="text-blue-600 font-bold flex items-center gap-1 group-hover/tile:translate-x-[-3px] transition-transform text-xs">
                        فتح
                        <ArrowRight className="w-3.5 h-3.5 rotate-180" />
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );

      case 'ai_advisor':
        return (
          <div key="ai_advisor" className="group relative">
            <div className="flex items-center justify-end mb-2">
              {renderCardControls(index, widget.id)}
            </div>
            <div className="bg-slate-900 rounded-2xl p-6 text-white flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 relative overflow-hidden border border-slate-800 shadow-md">
              <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full -mr-16 -mt-16"></div>
              <div className="relative z-10">
                <div className="flex items-center gap-2 mb-1">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                  <h4 className="text-sm font-bold text-blue-400">تحليلات الذكاء الاصطناعي والمستشار المالي</h4>
                </div>
                <p className="text-xs text-slate-300 max-w-2xl leading-relaxed">
                  محرك الذكاء المالي جاهز لفحص توازن ميزان المراجعة، اكتشاف فروقات التسوية البنكية، وتقديم الاستشارات المحاسبية وفق المعايير والقوانين الضريبية.
                </p>
              </div>
              {onOpenAiAssistant && (
                <button
                  onClick={onOpenAiAssistant}
                  className="bg-blue-600 hover:bg-blue-500 text-white text-xs px-6 py-2.5 rounded-xl font-bold transition-colors z-10 whitespace-nowrap shadow-sm shrink-0"
                >
                  بدء التدقيق الذكي
                </button>
              )}
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header Title, Greeting, and Customizer Trigger */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl sm:text-2xl font-bold text-slate-800">
              لوحة التحكم المركزية - MeDo S/4HANA ERP
            </h1>
            <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs px-2.5 py-0.5 rounded-full font-bold">
              السنة المالية 2026
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            نظرة موحدة على الأداء المالي، التدفقات النقدية، المؤشرات التحليلية، والوصول المباشر لتطبيقات النظام
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* Customize Launchpad Button */}
          <button
            onClick={() => setIsCustomizerOpen(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-bold border border-slate-300/80 transition shadow-2xs"
            title="تخصيص وترتيب بطاقات العمل"
          >
            <SlidersHorizontal className="w-4 h-4 text-blue-600" />
            <span>تخصيص وترتيب البطاقات</span>
            <span className="bg-blue-600 text-white text-[10px] px-1.5 py-0.2 rounded-full font-mono">
              {widgets.filter(w => w.visible).length}
            </span>
          </button>

          {onOpenAiAssistant && (
            <button
              onClick={onOpenAiAssistant}
              className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-xs transition"
            >
              <Sparkles className="w-4 h-4 text-amber-300" />
              <span>طلب تدقيق مالي ذكي</span>
            </button>
          )}
        </div>
      </div>

      {/* Quick Role Switcher Bar */}
      <div className="bg-slate-50/90 border border-slate-200 rounded-2xl p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
        <div className="flex items-center gap-2 text-xs font-bold text-slate-700">
          <Briefcase className="w-4 h-4 text-blue-600 shrink-0" />
          <span>تخصيص الشاشة السريع حسب الدور:</span>
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          {ROLE_PRESETS.map(preset => (
            <button
              key={preset.id}
              onClick={() => handleApplyPreset(preset)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition flex items-center gap-1.5 ${
                activePresetId === preset.id
                  ? 'bg-blue-600 text-white shadow-2xs'
                  : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
              }`}
            >
              {activePresetId === preset.id && <Check className="w-3 h-3 text-white" />}
              <span>{preset.nameAr.split('(')[0].trim()}</span>
            </button>
          ))}

          <button
            onClick={handleResetToDefault}
            className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-white transition"
            title="إعادة ضبط للافتراضي"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Render All Work Cards (Widgets) dynamically in customized order */}
      <div className="space-y-6">
        {widgets.map((widget, index) => renderWidgetContent(widget, index))}
      </div>

      {/* Launchpad Customizer Modal */}
      <LaunchpadCustomizerModal
        isOpen={isCustomizerOpen}
        onClose={() => setIsCustomizerOpen(false)}
        widgets={widgets}
        onToggleVisibility={handleToggleVisibility}
        onMoveWidget={handleMoveWidget}
        onApplyPreset={handleApplyPreset}
        onResetToDefault={handleResetToDefault}
      />
    </div>
  );
};
