import React from 'react';
import { 
  LayoutGrid, 
  BookOpen, 
  Layers, 
  Users, 
  Truck, 
  Building, 
  PieChart, 
  Landmark, 
  Scale, 
  Sparkles,
  ChevronLeft,
  X,
  Package,
  Sliders,
  Store,
  UserCheck,
  ShoppingBag,
  QrCode,
  ShieldCheck,
  ArrowLeftRight,
  Receipt,
  Inbox,
  BarChart3,
  Boxes
} from 'lucide-react';
import { SystemModuleSetting } from '../types/accounting';
import { useAuth } from '../contexts/AuthContext';

interface SidebarProps {
  activeModule: string;
  onSelectModule: (moduleKey: string) => void;
  onOpenAiAssistant: () => void;
  isOpenMobile?: boolean;
  onCloseMobile?: () => void;
  systemModules?: SystemModuleSetting[];
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeModule,
  onSelectModule,
  onOpenAiAssistant,
  isOpenMobile = false,
  onCloseMobile,
  systemModules,
}) => {
  const { hasPermission, profile } = useAuth();

  const navItems = [
    {
      key: 'launchpad',
      labelAr: 'لوحة التحكم',
      tCode: 'Fiori Home',
      icon: LayoutGrid,
    },
    {
      key: 'internal-inbox',
      labelAr: 'صندوق الوارد والتنبيهات',
      tCode: 'INBOX / MSG',
      icon: Inbox,
    },
    {
      key: 'expenses-revenues',
      labelAr: 'المصروفات والإيرادات',
      tCode: 'F-02 / DUAL-CTL',
      icon: Receipt,
    },
    {
      key: 'sales-management',
      labelAr: 'إدارة المبيعات ومردودات المبيعات',
      tCode: 'SD-INV / SD-RET',
      icon: Store,
    },
    {
      key: 'procurement',
      labelAr: 'إدارة المشتريات ومردودات المشتريات',
      tCode: 'MM-PUR / MM-RET',
      icon: ShoppingBag,
    },
    {
      key: 'accounts-receivable',
      labelAr: 'العملاء والذمم المدينة (المدينون)',
      tCode: 'FB70 / FBL5N',
      icon: Users,
    },
    {
      key: 'accounts-payable',
      labelAr: 'الموردين والذمم الدائنة (الدائنون)',
      tCode: 'FB60 / FBL1N',
      icon: Truck,
    },
    {
      key: 'inventory',
      labelAr: 'إدارة المخزون والمستودعات',
      tCode: 'MM01 / MIGO',
      icon: Package,
    },
    {
      key: 'pos',
      labelAr: 'نقاط البيع السريعة (POS)',
      tCode: 'POS / SD',
      icon: Boxes,
    },
    {
      key: 'e-invoicing',
      labelAr: 'الفاتورة الإلكترونية والباركود',
      tCode: 'ZATCA / QR',
      icon: QrCode,
    },
    {
      key: 'hr-payroll',
      labelAr: 'الموارد البشرية والرواتب',
      tCode: 'HCM / PA / PY',
      icon: UserCheck,
    },
    {
      key: 'general-ledger',
      labelAr: 'الأستاذ العام',
      tCode: 'FB50 / FBL3N',
      icon: BookOpen,
    },
    {
      key: 'chart-of-accounts',
      labelAr: 'دليل الحسابات',
      tCode: 'FS00',
      icon: Layers,
    },
    {
      key: 'fixed-assets',
      labelAr: 'الأصول الثابتة',
      tCode: 'AS01 / AFAB',
      icon: Building,
    },
    {
      key: 'controlling',
      labelAr: 'مراكز التكلفة والربحية',
      tCode: 'KS01 / KE51',
      icon: PieChart,
    },
    {
      key: 'bank-reconciliation',
      labelAr: 'الخزينة والبنوك',
      tCode: 'FF67 / FF_5',
      icon: Landmark,
    },
    {
      key: 'foreign-exchange',
      labelAr: 'تطبيق الصرافة والتحويلات',
      tCode: 'FX-DEAL / FIN-FX',
      icon: ArrowLeftRight,
    },
    {
      key: 'budgeting',
      labelAr: 'الموازنات التقديرية والفعلية',
      tCode: 'FMBB / S_ALR',
      icon: BarChart3,
    },
    {
      key: 'financial-reports',
      labelAr: 'التقارير والقوائم المالية',
      tCode: 'F.01',
      icon: Scale,
    },
    {
      key: 'settings',
      labelAr: 'إعدادات النظام الشاملة',
      tCode: 'SPRO',
      icon: Sliders,
    },
    ...(profile?.role === 'ADMIN' ? [{
      key: 'role-management',
      labelAr: 'إدارة المستخدمين والصلاحيات',
      tCode: 'SU01',
      icon: ShieldCheck,
    }] : []),
  ];

  const visibleNavItems = navItems.filter((item) => {
    // 1. Check Module Visibility Config
    if (systemModules && item.key !== 'launchpad' && item.key !== 'settings' && item.key !== 'role-management') {
      const modConfig = systemModules.find((m) => m.key === item.key);
      if (modConfig && (!modConfig.isEnabled || !modConfig.showInSidebar)) {
        return false;
      }
    }
    
    // 2. Check RBAC Permissions
    if (item.key === 'launchpad' || item.key === 'role-management') return true;
    return hasPermission(item.key);
  });

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpenMobile && (
        <div 
          onClick={onCloseMobile}
          className="fixed inset-0 bg-black/60 backdrop-blur-xs z-40 lg:hidden"
        />
      )}

      <aside className={`no-print
        fixed lg:sticky top-0 right-0 z-50 lg:z-30
        w-72 h-screen bg-slate-900 text-slate-300 flex flex-col border-l border-slate-800 shrink-0 select-none
        transition-transform duration-300 ease-in-out
        ${isOpenMobile ? 'translate-x-0' : 'translate-x-full lg:translate-x-0'}
      `}>
        {/* Brand Header */}
        <div className="p-5 flex items-center justify-between border-b border-[#003366] bg-[#0A2540]">
          <div 
            onClick={() => {
              onSelectModule('launchpad');
              if (onCloseMobile) onCloseMobile();
            }}
            className="flex items-center gap-3 cursor-pointer group"
          >
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#0A2540] to-[#003366] border-2 border-[#D4AF37] flex items-center justify-center font-black text-xl shadow-lg shadow-[#D4AF37]/20 group-hover:scale-105 transition-transform relative">
              <span className="text-[#D4AF37]" style={{ filter: 'drop-shadow(0 1px 3px rgba(212,175,55,0.5))' }}>M</span>
              <div className="absolute top-1 w-1.5 h-1.5 rounded-full bg-[#D4AF37]" />
            </div>
            <div>
              <div className="text-[10px] font-bold text-[#D4AF37]">ميدو تك للحلول البرمجية</div>
              <div className="text-sm font-black text-white tracking-tight">
                <span>Bin Ziad Trading Group</span>
              </div>
              <p className="text-[10px] text-slate-300 font-medium">MeDo ERP • S/4HANA Suite</p>
            </div>
          </div>

          {onCloseMobile && (
            <button
              onClick={onCloseMobile}
              className="lg:hidden p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 p-3 space-y-1.5 overflow-y-auto">
          <div className="px-3.5 py-2 text-xs font-black text-slate-300 uppercase tracking-wide flex items-center justify-between border-b border-slate-800/80 mb-2">
            <span>الوحدات المحاسبية</span>
            <span className="text-[11px] bg-slate-800 text-blue-400 px-2 py-0.5 rounded-md font-mono font-bold border border-slate-700">
              {visibleNavItems.length} وحدات
            </span>
          </div>

          {visibleNavItems.map((item) => {
            const isActive = activeModule === item.key;
            const Icon = item.icon;
            return (
              <button
                key={item.key}
                onClick={() => {
                  onSelectModule(item.key);
                  if (onCloseMobile) onCloseMobile();
                }}
                className={`nav-item-geometric group ${
                  isActive
                    ? 'nav-item-geometric-active'
                    : 'nav-item-geometric-inactive'
                }`}
              >
                <div className="flex items-center gap-3">
                  {/* Module Icon & Indicator marker */}
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center transition shrink-0 ${
                    isActive
                      ? 'bg-blue-600 text-white shadow-xs shadow-blue-500/30'
                      : 'bg-slate-800/80 text-slate-400 group-hover:bg-slate-700 group-hover:text-white border border-slate-700/60'
                  }`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <span className="text-[14px] font-bold tracking-tight text-right leading-snug">
                    {item.labelAr}
                  </span>
                </div>

                <span className={`text-[10px] font-mono font-bold hidden xl:inline-block px-1.5 py-0.5 rounded ${
                  isActive 
                    ? 'text-blue-200 bg-blue-900/50 border border-blue-400/30' 
                    : 'text-slate-400 bg-slate-800/60 border border-slate-700/40 group-hover:text-slate-300'
                }`}>
                  {item.tCode.split(' ')[0]}
                </span>
              </button>
            );
          })}
        </nav>

        {/* Bottom AI Copilot Card */}
        <div className="p-3.5 mt-auto border-t border-slate-800">
          <div
            onClick={() => {
              onOpenAiAssistant();
              if (onCloseMobile) onCloseMobile();
            }}
            className="bg-blue-950/40 hover:bg-blue-900/40 p-3 rounded-lg border border-blue-800/50 hover:border-blue-600/60 transition cursor-pointer group"
          >
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-1.5 text-xs text-blue-300 font-bold">
                <Sparkles className="w-3.5 h-3.5 text-amber-300 animate-pulse" />
                <span>المساعد الذكي AI</span>
              </div>
              <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
            </div>
            <p className="text-[10px] text-slate-400 leading-tight">
              جاهز لتحليل القيود والتدقيق المالي الفوري وفق المعايير.
            </p>
          </div>
        </div>
      </aside>
    </>
  );
};
