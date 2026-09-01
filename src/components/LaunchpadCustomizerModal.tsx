import React from 'react';
import {
  X,
  Eye,
  EyeOff,
  ArrowUp,
  ArrowDown,
  RotateCcw,
  Check,
  LayoutDashboard,
  Sparkles,
  SlidersHorizontal,
  Briefcase,
  UserCheck,
  Store,
  ShoppingBag,
  TrendingUp,
  Scale
} from 'lucide-react';
import { AppRole } from '../types/auth';

export interface WidgetItem {
  id: string;
  titleAr: string;
  descAr: string;
  categoryAr: string;
  visible: boolean;
  badgeAr?: string;
}

export interface RolePreset {
  id: string;
  nameAr: string;
  role: string;
  descAr: string;
  icon: any;
  visibleWidgetIds: string[];
  orderWidgetIds: string[];
}

interface LaunchpadCustomizerModalProps {
  isOpen: boolean;
  onClose: () => void;
  widgets: WidgetItem[];
  onToggleVisibility: (widgetId: string) => void;
  onMoveWidget: (index: number, direction: 'up' | 'down') => void;
  onApplyPreset: (preset: RolePreset) => void;
  onResetToDefault: () => void;
  currentRole?: AppRole;
}

export const ROLE_PRESETS: RolePreset[] = [
  {
    id: 'default_all',
    nameAr: 'العرض الشامل (افتراضي النظام)',
    role: 'ALL',
    descAr: 'عرض كافة البطاقات والمؤشرات وشبكة التطبيقات بالترتيب القياسي',
    icon: LayoutDashboard,
    visibleWidgetIds: ['kpi_metrics', 'financial_analytics', 'receivables_payables', 'cost_centers', 'recent_transactions', 'fiori_tiles', 'ai_advisor'],
    orderWidgetIds: ['kpi_metrics', 'financial_analytics', 'receivables_payables', 'cost_centers', 'recent_transactions', 'fiori_tiles', 'ai_advisor'],
  },
  {
    id: 'accountant_cfo',
    nameAr: 'رئيس الحسابات والمالية (FI / GL)',
    role: 'ACCOUNTANT',
    descAr: 'التركيز على التحليل المالي، ميزان الحسابات، التدفقات النقدية والقيود اليومية',
    icon: Scale,
    visibleWidgetIds: ['financial_analytics', 'kpi_metrics', 'recent_transactions', 'receivables_payables', 'fiori_tiles'],
    orderWidgetIds: ['financial_analytics', 'kpi_metrics', 'recent_transactions', 'receivables_payables', 'fiori_tiles', 'cost_centers', 'ai_advisor'],
  },
  {
    id: 'executive_ceo',
    nameAr: 'الإدارة العليا والتنفيذية (Executive / CEO)',
    role: 'ADMIN',
    descAr: 'البطاقة التحليلية المتقدمة في الصدارة متبوعة بالمؤشرات العامة ومراكز التكلفة',
    icon: TrendingUp,
    visibleWidgetIds: ['financial_analytics', 'kpi_metrics', 'cost_centers', 'receivables_payables', 'ai_advisor'],
    orderWidgetIds: ['financial_analytics', 'kpi_metrics', 'cost_centers', 'receivables_payables', 'ai_advisor', 'fiori_tiles', 'recent_transactions'],
  },
  {
    id: 'sales_pos',
    nameAr: 'المبيعات ونقاط البيع (Sales & POS)',
    role: 'CASHIER',
    descAr: 'تصدير الذمم المدينة، فواتير المبيعات، تطبيقات الكاشير والفوترة الإلكترونية',
    icon: Store,
    visibleWidgetIds: ['kpi_metrics', 'receivables_payables', 'fiori_tiles', 'recent_transactions'],
    orderWidgetIds: ['kpi_metrics', 'receivables_payables', 'fiori_tiles', 'recent_transactions', 'financial_analytics', 'cost_centers', 'ai_advisor'],
  },
  {
    id: 'procurement_mm',
    nameAr: 'المشتريات وإدارة المخازن (Procurement & MM)',
    role: 'PROCUREMENT',
    descAr: 'التركيز على مستحقات الموردين، أوامر الشراء وسلاسل الإمداد ومراكز التكلفة',
    icon: ShoppingBag,
    visibleWidgetIds: ['kpi_metrics', 'receivables_payables', 'cost_centers', 'fiori_tiles'],
    orderWidgetIds: ['kpi_metrics', 'receivables_payables', 'cost_centers', 'fiori_tiles', 'financial_analytics', 'recent_transactions', 'ai_advisor'],
  },
  {
    id: 'hr_payroll',
    nameAr: 'الموارد البشرية والرواتب (HR & Payroll)',
    role: 'HR',
    descAr: 'شؤون الموظفين، مسيرات الرواتب ومصروفات مراكز التكلفة التشغيلية',
    icon: UserCheck,
    visibleWidgetIds: ['kpi_metrics', 'cost_centers', 'fiori_tiles', 'ai_advisor'],
    orderWidgetIds: ['kpi_metrics', 'cost_centers', 'fiori_tiles', 'ai_advisor', 'financial_analytics', 'receivables_payables', 'recent_transactions'],
  },
];

export const LaunchpadCustomizerModal: React.FC<LaunchpadCustomizerModalProps> = ({
  isOpen,
  onClose,
  widgets,
  onToggleVisibility,
  onMoveWidget,
  onApplyPreset,
  onResetToDefault,
}) => {
  if (!isOpen) return null;

  const visibleCount = widgets.filter(w => w.visible).length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-150" dir="rtl">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="p-6 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600/30 border border-blue-500/40 flex items-center justify-center text-blue-300">
              <SlidersHorizontal className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <span>تخصيص وترتيب بطاقات لوحة التحكم (Launchpad)</span>
              </h2>
              <p className="text-xs text-slate-300 mt-0.5">
                اختر البطاقات النشطة ورتّبها حسب دورك الوظيفي أو اختر قالباً مسبق الإعداد
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body with Presets and Widgets List */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Quick Role Presets Section */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <Briefcase className="w-4 h-4 text-blue-600" />
                <span>قوالب التخصيص السريع حسب الدور الوظيفي:</span>
              </h3>
              <span className="text-[11px] text-slate-500">اختر قالباً للتطبيق الفوري</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
              {ROLE_PRESETS.map((preset) => {
                const Icon = preset.icon;
                return (
                  <button
                    key={preset.id}
                    onClick={() => onApplyPreset(preset)}
                    className="text-right p-3.5 rounded-2xl border border-slate-200 hover:border-blue-500/80 bg-slate-50/70 hover:bg-blue-50/40 transition group flex flex-col justify-between"
                  >
                    <div className="flex items-start gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-white border border-slate-200 flex items-center justify-center text-slate-700 group-hover:text-blue-600 group-hover:border-blue-300 shrink-0 shadow-2xs">
                        <Icon className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="text-xs font-bold text-slate-800 group-hover:text-blue-700 transition">
                          {preset.nameAr}
                        </div>
                        <div className="text-[11px] text-slate-500 mt-1 line-clamp-2 leading-relaxed">
                          {preset.descAr}
                        </div>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          <hr className="border-slate-200" />

          {/* Interactive Work Cards / Widgets Reordering & Visibility */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <div>
                <h3 className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                  <LayoutDashboard className="w-4 h-4 text-blue-600" />
                  <span>ترتيب وتفعيل بطاقات العمل ({visibleCount} من أصل {widgets.length} مفعّلة):</span>
                </h3>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  استخدم الأسهم لتحريك البطاقة للأعلى أو للأسفل، وأيقونة العين لإظهارها أو إخفائها
                </p>
              </div>

              <button
                onClick={onResetToDefault}
                className="flex items-center gap-1.5 text-xs text-slate-600 hover:text-rose-600 font-bold px-3 py-1.5 rounded-xl border border-slate-200 hover:border-rose-200 bg-white hover:bg-rose-50 transition"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>إعادة ضبط للافتراضي</span>
              </button>
            </div>

            <div className="space-y-2.5">
              {widgets.map((widget, index) => (
                <div
                  key={widget.id}
                  className={`p-3.5 rounded-2xl border transition flex items-center justify-between gap-3 ${
                    widget.visible
                      ? 'bg-white border-slate-200 shadow-2xs'
                      : 'bg-slate-50 border-dashed border-slate-300 opacity-60'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="w-6 h-6 rounded-full bg-slate-100 text-slate-600 font-bold font-mono text-xs flex items-center justify-center shrink-0">
                      {index + 1}
                    </span>

                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className={`text-xs font-bold ${widget.visible ? 'text-slate-800' : 'text-slate-500'}`}>
                          {widget.titleAr}
                        </span>
                        {widget.badgeAr && (
                          <span className="text-[10px] bg-blue-50 text-blue-700 border border-blue-200 px-2 py-0.5 rounded-md font-bold">
                            {widget.badgeAr}
                          </span>
                        )}
                        <span className="text-[10px] text-slate-400">({widget.categoryAr})</span>
                      </div>
                      <p className="text-[11px] text-slate-500 mt-0.5 truncate">
                        {widget.descAr}
                      </p>
                    </div>
                  </div>

                  {/* Action Controls */}
                  <div className="flex items-center gap-1.5 shrink-0">
                    {/* Reorder Buttons */}
                    <button
                      onClick={() => onMoveWidget(index, 'up')}
                      disabled={index === 0}
                      className="p-1.5 rounded-lg border border-slate-200 hover:border-blue-400 text-slate-600 hover:text-blue-600 disabled:opacity-30 disabled:cursor-not-allowed transition bg-white"
                      title="تحريك لأعلى"
                    >
                      <ArrowUp className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => onMoveWidget(index, 'down')}
                      disabled={index === widgets.length - 1}
                      className="p-1.5 rounded-lg border border-slate-200 hover:border-blue-400 text-slate-600 hover:text-blue-600 disabled:opacity-30 disabled:cursor-not-allowed transition bg-white"
                      title="تحريك لأسفل"
                    >
                      <ArrowDown className="w-4 h-4" />
                    </button>

                    {/* Visibility Toggle */}
                    <button
                      onClick={() => onToggleVisibility(widget.id)}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition border ${
                        widget.visible
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                          : 'bg-slate-100 text-slate-600 border-slate-300 hover:bg-slate-200'
                      }`}
                    >
                      {widget.visible ? (
                        <>
                          <Eye className="w-3.5 h-3.5" />
                          <span>معروضة</span>
                        </>
                      ) : (
                        <>
                          <EyeOff className="w-3.5 h-3.5" />
                          <span>مخفية</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
          <span className="text-xs text-slate-500">
            * يتم حفظ الترتيب والتخصيص تلقائياً وربطه بحسابك وتفضيلاتك.
          </span>

          <button
            onClick={onClose}
            className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-xs transition flex items-center gap-1.5"
          >
            <Check className="w-4 h-4" />
            <span>حفظ وتطبيق التغييرات</span>
          </button>
        </div>
      </div>
    </div>
  );
};
