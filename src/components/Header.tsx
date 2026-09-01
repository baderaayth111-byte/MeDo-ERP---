import React, { useState, useEffect } from 'react';
import { 
  Building2, 
  Search, 
  Sparkles, 
  Globe, 
  Bell, 
  Sliders, 
  Coins, 
  Calendar,
  Menu,
  CheckCircle2,
  FlaskConical,
  LogOut,
  User,
  ShieldCheck,
  ChevronDown,
  KeyRound,
  Lock,
  X,
  Eye,
  EyeOff,
  Clock,
  BookOpen,
  Award,
  Languages,
  Activity,
  MessageSquare,
  ExternalLink,
  Receipt,
  Inbox,
  Boxes,
  Wifi,
  WifiOff,
  Download,
  Smartphone
} from 'lucide-react';
import { Currency, CompanyProfile } from '../types/accounting';
import { useAuth } from '../contexts/AuthContext';
import { useTransactionLimit } from '../contexts/TransactionLimitContext';
import { ROLE_LABELS, AppRole } from '../types/auth';
import { useLanguage } from '../contexts/LanguageContext';
import { useAccessibility } from '../contexts/AccessibilityContext';
import { useOffline } from '../contexts/OfflineContext';
import { EncryptedSystemManualModal } from './EncryptedSystemManualModal';
import { UnifiedHeader } from './UnifiedHeader';
import { AdminLoginNotificationModal } from './AdminLoginNotificationModal';
import { NotificationDropdown } from './NotificationDropdown';
import { AppNotification } from '../types/workflow';
import { generateAdminWhatsAppNotificationUrl, ADMIN_PHONE_NUMBER } from '../data/userCredentials';

interface HeaderProps {
  companyProfile: CompanyProfile;
  currency: Currency;
  onCurrencyChange: (currency: Currency) => void;
  onOpenAiAssistant: () => void;
  onOpenCrudLab?: () => void;
  onOpenGlobalSearch?: () => void;
  activeModule: string;
  onNavigate: (module: string) => void;
  onToggleMobileSidebar?: () => void;
  notifications?: AppNotification[];
  onMarkNotificationAsRead?: (id: string) => void;
  onMarkAllNotificationsAsRead?: () => void;
  onOpenInbox?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  companyProfile,
  currency,
  onCurrencyChange,
  onOpenAiAssistant,
  onOpenCrudLab,
  onOpenGlobalSearch,
  activeModule,
  onNavigate,
  onToggleMobileSidebar,
  notifications = [],
  onMarkNotificationAsRead,
  onMarkAllNotificationsAsRead,
  onOpenInbox,
}) => {
  const { profile, logout, loginAsDemo, changePassword, latestLoginAlert, dismissLoginAlert } = useAuth();
  const { transactionCount, maxTransactions, remainingTransactions } = useTransactionLimit();
  const { language, setLanguage, t } = useLanguage();
  const { highContrastMode, toggleHighContrastMode } = useAccessibility();
  const { isOnline, isOffline, queueCount, canInstallPWA, installPWA, isInstalled } = useOffline();
  const [showRoleMenu, setShowRoleMenu] = useState(false);
  const [isChangePasswordModalOpen, setIsChangePasswordModalOpen] = useState(false);
  const [isAuditModalOpen, setIsAuditModalOpen] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [showPasswordText, setShowPasswordText] = useState(false);
  const [passwordStatusMsg, setPasswordStatusMsg] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);

  const [isManualOpen, setIsManualOpen] = useState(false);
  const [currentTime, setCurrentTime] = useState<Date>(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const getModuleTitle = (mod: string) => {
    switch (mod) {
      case 'launchpad': return 'لوحة التحكم الرئيسية (Fiori Launchpad)';
      case 'general-ledger': return 'الأستاذ العام وقيود اليومية (GL)';
      case 'chart-of-accounts': return 'دليل الحسابات الشجري (COA)';
      case 'sales-management': return 'إدارة المبيعات ومردودات المبيعات (SD-INV / SD-RET)';
      case 'inventory': return 'إدارة المخزون والمستودعات (MM / SCM)';
      case 'procurement': return 'المشتريات ومردودات المشتريات (MM / PUR / RET)';
      case 'pos': return 'نقاط البيع والكاشير المباشر (POS)';
      case 'hr-payroll': return 'الموارد البشرية والرواتب (HR / Payroll)';
      case 'foreign-exchange': return 'الصرافة والتحويلات المالية (FX / Remit)';
      case 'e-invoicing': return 'الفوترة الإلكترونية وهيئة الزكاة (E-Invoice)';
      case 'accounts-receivable': return 'العملاء والذمم المدينة (AR)';
      case 'accounts-payable': return 'الموردين والذمم الدائنة (AP)';
      case 'fixed-assets': return 'الأصول الثابتة وحساب الإهلاك (AA)';
      case 'controlling': return 'مراكز التكلفة والربحية (CO)';
      case 'bank-reconciliation': return 'الخزينة والتسويات البنكية (Cash)';
      case 'financial-reports': return 'التقارير والقوائم المالية (Reports)';
      case 'expenses-revenues': return 'إدارة المصروفات والإيرادات والرقابة المزدوجة (Expenses & Revenues)';
      case 'internal-inbox': return 'صندوق الوارد والرسائل والإشعارات الداخلية (Internal Inbox)';
      case 'settings': return 'تهيئة وإعدادات النظام الشاملة (SPRO)';
      case 'role-management': return 'إدارة المستخدمين والصلاحيات وكلمات المرور (SU01)';
      default: return mod;
    }
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPassword || newPassword.length < 4) {
      setIsSuccess(false);
      setPasswordStatusMsg('كلمة المرور يجب أن تتكون من 4 خانات على الأقل');
      return;
    }

    const res = await changePassword(newPassword);
    if (res.success) {
      setIsSuccess(true);
      setPasswordStatusMsg(res.message);
      setTimeout(() => {
        setIsChangePasswordModalOpen(false);
        setPasswordStatusMsg('');
        setNewPassword('');
      }, 1500);
    } else {
      setIsSuccess(false);
      setPasswordStatusMsg(res.message || 'فشل في تحديث كلمة المرور');
    }
  };

  return (
    <div className="no-print z-30 sticky top-0" dir="rtl">
      <UnifiedHeader activeModule={activeModule} />
      {/* Animated Top Header Bar: Producer Credit & Manual Button (At Start), Quran Verse & Clock */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white text-[11px] sm:text-xs px-3 sm:px-6 py-1.5 flex flex-wrap items-center justify-between border-b border-indigo-900/50 shadow-xs gap-2 select-none">
        {/* Start (Right in RTL): Production Credit Signature & Encrypted Designer Manual Button */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsManualOpen(true)}
            className="flex items-center gap-1.5 bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-500 hover:to-amber-600 text-slate-950 px-3 py-1 rounded-lg border border-amber-300 text-[11px] font-extrabold transition shadow-sm hover:shadow-md cursor-pointer"
            title="انقر لفتح دليل الاستخدام المشفر (خاص بمصمم النظام)"
          >
            <Lock className="w-3.5 h-3.5 text-slate-950 shrink-0" />
            <Award className="w-3.5 h-3.5 text-slate-950 shrink-0" />
            <span>ميدو تك للحلول البرمجية</span>
            <span className="bg-slate-950 text-amber-300 text-[9px] px-1.5 py-0.2 rounded font-extrabold mr-1">
              دليل المصمم 🔑
            </span>
          </button>
        </div>

        {/* Quran Verse */}
        <div className="flex items-center gap-2 font-bold text-amber-300 tracking-wide">
          <BookOpen className="w-3.5 h-3.5 text-amber-400 shrink-0" />
          <span className="truncate">
            ﴿ وَقُلِ اعْمَلُوا فَسَيَرَى اللَّهُ عَمَلَكُمْ وَرَسُولُهُ وَالْمُؤْمِنُونَ ﴾
          </span>
        </div>

        {/* Live Animated Digital Clock */}
        <div className="flex items-center gap-2 bg-slate-800/90 px-3 py-0.5 rounded-full border border-slate-700/80 shadow-2xs font-mono font-bold text-amber-300">
          <Clock className="w-3.5 h-3.5 text-emerald-400 animate-pulse shrink-0" />
          <span>
            {currentTime.toLocaleTimeString('ar-YE', {
              hour: '2-digit',
              minute: '2-digit',
              second: '2-digit',
              hour12: true,
            })}
          </span>
          <span className="text-[10px] text-slate-400 border-r border-slate-700 pr-2 mr-1 hidden md:inline">
            {currentTime.toLocaleDateString('ar-YE', { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' })}
          </span>
        </div>
      </div>

      {/* Main Header Bar */}
      <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-4 sm:px-6 lg:px-8 select-none">
      {/* Right side: Mobile Hamburger, Dedicated Passwords Button, Breadcrumb & Search */}
      <div className="flex items-center gap-2 sm:gap-4">
        {/* Prominent Exit/Logout Button on the rightmost side */}
        <button
          onClick={logout}
          className="flex items-center gap-1.5 bg-rose-600 hover:bg-rose-700 active:scale-95 text-white px-3 py-1.5 rounded-xl text-xs font-black shadow-md hover:shadow-lg transition shrink-0 cursor-pointer border border-rose-500 animate-pulse"
          title="تسجيل الخروج السريع من النظام"
        >
          <LogOut className="w-4 h-4 text-white" />
          <span>خروج</span>
        </button>

        {/* Mobile menu trigger */}
        <button
          onClick={onToggleMobileSidebar}
          className="lg:hidden p-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition"
          title="القائمة الرئيسية"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* PROMINENT PASSWORD CONTROL BUTTON (At the start for Mobile & Desktop) */}
        <button
          onClick={() => setIsChangePasswordModalOpen(true)}
          className="flex items-center gap-1.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 px-2.5 sm:px-3 py-1.5 rounded-xl border border-amber-400 font-extrabold text-xs shadow-sm hover:shadow transition shrink-0 cursor-pointer"
          title="انقر لتغيير كلمة المرور الحالية أو إدارة الأمان"
        >
          <KeyRound className="w-4 h-4 text-slate-950 animate-pulse" />
          <span className="inline">كلمات المرور</span>
        </button>

        {/* Current Active View Pill */}
        <div className="hidden sm:flex items-center gap-2">
          <span className="text-sm sm:text-[15px] font-extrabold text-slate-800 bg-slate-100 hover:bg-slate-200/70 px-3.5 py-1.5 rounded-xl border border-slate-300/80 shadow-2xs flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-blue-600"></span>
            <span>{getModuleTitle(activeModule)}</span>
          </span>
        </div>

        {/* Interactive Global Search Pill */}
        <div className="relative hidden md:block">
          <button
            type="button"
            onClick={onOpenGlobalSearch}
            className="flex items-center gap-2.5 bg-slate-100 hover:bg-slate-200/80 border border-slate-200 rounded-full pr-3.5 pl-4 py-1.5 w-64 lg:w-72 text-xs text-slate-500 transition text-right group shadow-2xs"
          >
            <Search className="w-3.5 h-3.5 text-slate-400 group-hover:text-blue-600 transition" />
            <span className="flex-1 text-slate-500 font-medium">البحث العام الشامل في النظام...</span>
            <kbd className="hidden lg:inline-block bg-white text-[10px] text-slate-400 font-mono px-1.5 py-0.5 rounded border border-slate-200 shadow-2xs">
              Ctrl+K
            </kbd>
          </button>
        </div>
      </div>

      {/* Left side: Actions, Currency, Fiscal info & User */}
      <div className="flex items-center gap-2 sm:gap-4">
        {/* Mobile Search Button */}
        <button
          onClick={onOpenGlobalSearch}
          className="md:hidden p-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition"
          title="البحث العام"
        >
          <Search className="w-5 h-5" />
        </button>

        {/* Fiscal Year info */}
        <div className="hidden xl:flex items-center gap-1.5 text-xs text-slate-500 bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-200">
          <Calendar className="w-3.5 h-3.5 text-blue-600" />
          <span>السنة المالية: <strong className="text-slate-800">{companyProfile.currentFiscalYear} م</strong></span>
        </div>

        {/* Exchange Rate Regime Badge */}
        <button
          onClick={() => onNavigate('settings')}
          className={`hidden lg:flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold border transition cursor-pointer ${
            companyProfile.exchangeRateRegime === 'ADEN'
              ? 'bg-indigo-50 hover:bg-indigo-100 text-indigo-800 border-indigo-200'
              : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border-emerald-200'
          }`}
          title="نظام سعر الصرف المعتمد - انقر لضبط آلية احتساب العملة المزدوجة في SPRO"
        >
          <Coins className="w-3.5 h-3.5" />
          <span>
            {companyProfile.exchangeRateRegime === 'ADEN' ? 'نظام عدن (1910)' : 'نظام صنعاء (535)'}
          </span>
        </button>

        {/* Currency Switcher */}
        <div className="flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200">
          {(['YER', 'USD', 'SAR'] as Currency[]).map((cur) => (
            <button
              key={cur}
              onClick={() => onCurrencyChange(cur)}
              className={`px-2.5 py-1 text-xs rounded-md font-semibold transition ${
                currency === cur
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {cur === 'YER' ? 'ر.ي' : cur === 'USD' ? '$' : 'ر.س'}
            </button>
          ))}
        </div>

        {/* Multi-Language Switcher (ar / en) */}
        <div className="flex items-center bg-indigo-50 p-0.5 rounded-lg border border-indigo-200/80">
          <button
            onClick={() => setLanguage('ar')}
            className={`px-2.5 py-1 text-xs rounded-md font-extrabold transition flex items-center gap-1 ${
              language === 'ar'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'text-indigo-700 hover:text-indigo-900'
            }`}
            title="تحويل واجهة النظام إلى اللغة العربية"
          >
            <Languages className="w-3 h-3" />
            <span>عربي</span>
          </button>
          <button
            onClick={() => setLanguage('en')}
            className={`px-2.5 py-1 text-xs rounded-md font-extrabold transition flex items-center gap-1 ${
              language === 'en'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'text-indigo-700 hover:text-indigo-900'
            }`}
            title="Switch System Interface to English"
          >
            <span>English</span>
          </button>
        </div>

        {/* Standalone Items App Launcher */}
        <button
          onClick={() => onNavigate('standalone-items')}
          className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gradient-to-r from-indigo-50 to-blue-50 hover:from-indigo-100 hover:to-blue-100 text-indigo-900 text-xs font-black border border-indigo-200 transition shadow-2xs cursor-pointer active:scale-95"
          title="فتح تطبيق إدارة الأصناف المعزول (نسخة تجربة السوق الميدانية مع رابط خاص)"
        >
          <Boxes className="w-3.5 h-3.5 text-indigo-600" />
          <span>تطبيق الأصناف المعزول</span>
          <span className="bg-indigo-600 text-white text-[9px] px-1.5 py-0.2 rounded-full font-bold">
            تجربة السوق
          </span>
        </button>

        {/* CRUD Testing Lab Trigger */}
        {onOpenCrudLab && (
          <button
            onClick={onOpenCrudLab}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-bold border border-indigo-200 transition shadow-2xs"
            title="مختبر تجربة الإدخالات والحفظ والمسح عبر كافة التطبيقات"
          >
            <FlaskConical className="w-3.5 h-3.5 text-indigo-600 animate-pulse" />
            <span className="hidden md:inline">مختبر العمليات (CRUD)</span>
          </button>
        )}

        {/* Network & Offline Ready Status Badge */}
        <div 
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold border transition ${
            isOnline 
              ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
              : 'bg-amber-100 text-amber-900 border-amber-300 animate-pulse'
          }`}
          title={
            isOnline
              ? 'النظام متصل بالشبكة والسحابة، والبيانات متزامنة فورياً.'
              : 'أنت في وضع عدم الاتصال (بدون إنترنت). جميع العمليات تُحفظ محلياً 100% في جهازك بأمان تام.'
          }
        >
          {isOnline ? (
            <>
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="hidden xl:inline">أونلاين</span>
              <Wifi className="w-3.5 h-3.5 text-emerald-600" />
            </>
          ) : (
            <>
              <WifiOff className="w-3.5 h-3.5 text-amber-700 animate-bounce" />
              <span>بدون نت (محلي 100%)</span>
              {queueCount > 0 && (
                <span className="bg-amber-800 text-white text-[10px] px-1.5 py-0.2 rounded-full font-mono">
                  {queueCount}
                </span>
              )}
            </>
          )}
        </div>

        {/* PWA App Installation Button */}
        {canInstallPWA && !isInstalled && (
          <button
            onClick={installPWA}
            className="hidden lg:flex items-center gap-1 px-2.5 py-1 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-bold border border-indigo-200 transition cursor-pointer"
            title="تثبيت نظام MeDo ERP كتطبيق مستقل على جهازك للتشغيل بضغطة زر بدون إنترنت"
          >
            <Smartphone className="w-3.5 h-3.5 text-indigo-600" />
            <span>تثبيت التطبيق 📲</span>
          </button>
        )}

        {/* AI Assistant Quick Trigger */}
        <button
          onClick={onOpenAiAssistant}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-bold border border-blue-200 transition"
        >
          <Sparkles className="w-3.5 h-3.5 text-amber-500" />
          <span className="hidden sm:inline">المستشار الذكي</span>
        </button>

        {/* High Contrast Mode Quick Toggle */}
        <button
          onClick={toggleHighContrastMode}
          className={`p-2 rounded-lg border transition cursor-pointer ${
            highContrastMode
              ? 'bg-amber-400 text-slate-950 border-amber-500 ring-2 ring-amber-300/60 shadow-xs'
              : 'bg-slate-50 text-slate-600 hover:text-slate-900 hover:bg-slate-100 border-slate-200'
          }`}
          title={
            highContrastMode
              ? 'وضع التباين العالي مُفعّل (انقر للتعطيل والعودة للوضع القياسي)'
              : 'تفعيل وضع التباين العالي (High Contrast Mode) لتسهيل القراءة بالمستودعات'
          }
        >
          <Eye className={`w-4 h-4 ${highContrastMode ? 'text-slate-950 font-black' : 'text-slate-600'}`} />
        </button>

        {/* Transaction Limit Quota Badge (For non-admins or admins inspecting) */}
        {profile && profile.role !== 'ADMIN' && (
          <div 
            className={`hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold border transition ${
              remainingTransactions <= 5 
                ? 'bg-rose-50 text-rose-700 border-rose-200 animate-pulse' 
                : remainingTransactions <= 15
                ? 'bg-amber-50 text-amber-700 border-amber-200'
                : 'bg-emerald-50 text-emerald-700 border-emerald-200'
            }`}
            title={`الرصيد التشغيلي للجلسة: تم استهلاك ${transactionCount} من أصل ${maxTransactions} عملية مسموحة. المتبقي: ${remainingTransactions} عملية قبل القفل التلقائي.`}
          >
            <Activity className="w-3.5 h-3.5" />
            <span>العمليات: <strong className="font-mono">{transactionCount}</strong>/{maxTransactions}</span>
          </div>
        )}

        {/* Global Internal Inbox & Approval Notifications Dropdown */}
        <NotificationDropdown
          notifications={notifications}
          onMarkAsRead={onMarkNotificationAsRead || (() => {})}
          onMarkAllAsRead={onMarkAllNotificationsAsRead || (() => {})}
          onNavigateToModule={(mod, targetId) => onNavigate(mod)}
          onOpenInbox={onOpenInbox || (() => onNavigate('internal-inbox'))}
        />

        {/* Real-time Login Security Notifications Bell */}
        <button
          onClick={() => setIsAuditModalOpen(true)}
          className="relative p-2 rounded-lg border bg-slate-50 text-slate-600 hover:text-slate-900 hover:bg-slate-100 border-slate-200 transition cursor-pointer"
          title="سجل ورصد إشعارات تسجيل الدخول الفورية (Security Audit Trail)"
        >
          <ShieldCheck className="w-4 h-4 text-slate-600" />
          {latestLoginAlert && (
            <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-rose-500 rounded-full ring-2 ring-white animate-ping" />
          )}
        </button>

        {/* Settings Shortcut Button */}
        <button
          onClick={() => onNavigate('settings')}
          className={`p-2 rounded-lg border transition ${
            activeModule === 'settings'
              ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
              : 'bg-slate-50 text-slate-600 hover:text-slate-900 hover:bg-slate-100 border-slate-200'
          }`}
          title="إعدادات وتهيئة النظام الشاملة (SPRO)"
        >
          <Sliders className="w-4 h-4" />
        </button>

        {/* User Profile Avatar & RBAC Role Switcher */}
        <div className="relative pr-2 border-r border-slate-200">
          <div className="flex items-center gap-2">
            <button 
              onClick={() => setShowRoleMenu(!showRoleMenu)}
              className="flex items-center gap-2 text-right p-1.5 rounded-xl hover:bg-slate-100 transition border border-transparent hover:border-slate-200"
              title="خيارات الحساب وتبديل الدور"
            >
              <div className="w-8 h-8 rounded-full bg-slate-900 text-white flex items-center justify-center text-xs font-bold shadow-xs shrink-0">
                <User className="w-4 h-4" />
              </div>
              <div className="text-right hidden lg:block">
                <p className="text-[11px] font-bold text-slate-800 leading-tight">{profile?.displayName || 'المستخدم'}</p>
                <div className="flex items-center gap-1 mt-0.5">
                  <span className={`text-[9px] font-bold border px-1.5 py-0.2 rounded ${profile?.role && ROLE_LABELS[profile.role] ? ROLE_LABELS[profile.role].badgeColor : 'bg-slate-100 text-slate-700'}`}>
                    {profile?.role}
                  </span>
                  <ChevronDown className="w-3 h-3 text-slate-400" />
                </div>
              </div>
            </button>

            <button
              onClick={logout}
              className="p-1.5 text-rose-500 hover:bg-rose-50 hover:text-rose-600 rounded-lg transition"
              title="تسجيل الخروج"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>

          {/* Role & Security Dropdown */}
          {showRoleMenu && (
            <div className="absolute left-0 mt-2 w-72 bg-white rounded-2xl shadow-2xl border border-slate-200 p-3 z-50 animate-in fade-in zoom-in-95 duration-150 text-right">
              <div className="p-2 border-b border-slate-100 mb-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-blue-600" />
                    حسابي والأمان
                  </span>
                  <span className="text-[9px] font-mono text-slate-400">{profile?.email}</span>
                </div>
                
                {/* Change My Password Action */}
                <button
                  type="button"
                  onClick={() => {
                    setShowRoleMenu(false);
                    setIsChangePasswordModalOpen(true);
                  }}
                  className="mt-2 w-full py-1.5 px-2.5 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 rounded-xl text-xs font-bold transition flex items-center justify-between shadow-2xs"
                >
                  <span className="flex items-center gap-1.5">
                    <KeyRound className="w-3.5 h-3.5 text-amber-600" />
                    تغيير كلمة المرور الخاصة بي
                  </span>
                  <span className="text-[10px] text-amber-600">تعديل</span>
                </button>
              </div>

              <div className="p-1 text-[10px] font-bold text-slate-500 mb-1">
                تبديل الدور المباشر (RBAC Matrix):
              </div>

              <div className="space-y-1">
                {(Object.keys(ROLE_LABELS) as AppRole[]).map((r) => {
                  const isCurrent = profile?.role === r;
                  const label = ROLE_LABELS[r];
                  return (
                    <button
                      key={r}
                      onClick={() => {
                        loginAsDemo(r);
                        setShowRoleMenu(false);
                      }}
                      className={`w-full text-right p-2 rounded-xl text-xs font-bold transition flex items-center justify-between ${
                        isCurrent 
                          ? 'bg-blue-600 text-white shadow-xs' 
                          : 'hover:bg-slate-100 text-slate-700'
                      }`}
                    >
                      <div>
                        <div>{label.nameAr}</div>
                        <div className={`text-[9px] font-normal ${isCurrent ? 'text-blue-100' : 'text-slate-400'}`}>
                          {r}
                        </div>
                      </div>
                      {isCurrent && <span className="text-[10px] bg-white/20 px-1.5 py-0.5 rounded">نشط</span>}
                    </button>
                  );
                })}
              </div>

              {profile?.role === 'ADMIN' && (
                <div className="mt-2 pt-2 border-t border-slate-100 space-y-1">
                  <button
                    onClick={() => {
                      onNavigate('role-management');
                      setShowRoleMenu(false);
                    }}
                    className="w-full py-1.5 px-2 text-right text-xs font-bold text-blue-700 hover:bg-blue-50 rounded-lg transition flex items-center gap-1.5"
                  >
                    <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
                    <span>إدارة المستخدمين وكلمات المرور (SU01)</span>
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* --- QUICK PASSWORD CHANGE MODAL --- */}
      {isChangePasswordModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in" dir="rtl">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-md overflow-hidden">
            <div className="p-5 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2 font-bold text-sm">
                <KeyRound className="w-5 h-5 text-amber-400" />
                <span>تغيير كلمة المرور للحساب الحالي</span>
              </div>
              <button onClick={() => setIsChangePasswordModalOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUpdatePassword} className="p-6 space-y-4 text-right">
              <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200 text-xs">
                <span className="text-slate-500">البريد الإلكتروني: </span>
                <span className="font-bold font-mono text-slate-800" dir="ltr">{profile?.email}</span>
                <div className="text-slate-500 mt-1">
                  الدور الحالي: <span className="font-bold text-slate-800">{profile?.role}</span>
                </div>
              </div>

              {passwordStatusMsg && (
                <div className={`p-3 rounded-xl text-xs font-bold border flex items-center gap-2 ${
                  isSuccess 
                    ? 'bg-emerald-50 text-emerald-800 border-emerald-200' 
                    : 'bg-rose-50 text-rose-800 border-rose-200'
                }`}>
                  {isSuccess ? <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" /> : <X className="w-4 h-4 text-rose-600 shrink-0" />}
                  <span>{passwordStatusMsg}</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">كلمة المرور الجديدة:</label>
                <div className="relative">
                  <input
                    type={showPasswordText ? 'text' : 'password'}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="أدخل كلمة المرور الجديدة..."
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-mono outline-none focus:ring-2 focus:ring-blue-500"
                    dir="ltr"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPasswordText(!showPasswordText)}
                    className="absolute left-3 top-2.5 text-slate-400 hover:text-slate-600"
                  >
                    {showPasswordText ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsChangePasswordModalOpen(false);
                    onNavigate('role-management');
                  }}
                  className="text-[11px] font-bold text-blue-700 hover:text-blue-900 flex items-center gap-1 bg-blue-50 px-2.5 py-1.5 rounded-lg border border-blue-200"
                >
                  <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
                  <span>إدارة حسابات المستخدمين (SU01)</span>
                </button>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setIsChangePasswordModalOpen(false)}
                    className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl"
                  >
                    إلغاء
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-xs flex items-center gap-1.5"
                  >
                    <Lock className="w-3.5 h-3.5" />
                    حفظ التغييرات
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </header>
      {/* ENCRYPTED SYSTEM MANUAL MODAL FOR DESIGNER */}
      <EncryptedSystemManualModal
        isOpen={isManualOpen}
        onClose={() => setIsManualOpen(false)}
      />

      {/* ADMIN LOGIN NOTIFICATIONS AUDIT MODAL */}
      <AdminLoginNotificationModal
        isOpen={isAuditModalOpen}
        onClose={() => setIsAuditModalOpen(false)}
        latestLoginAlert={latestLoginAlert}
        onDismissAlert={dismissLoginAlert}
      />

      {/* FLOATING REAL-TIME LOGIN NOTIFICATION TOAST */}
      {latestLoginAlert && (
        <div className="fixed bottom-4 left-4 z-50 max-w-sm bg-slate-900 text-white rounded-2xl shadow-2xl border border-slate-700 p-4 animate-in slide-in-from-bottom-5 duration-300" dir="rtl">
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-2 text-amber-400 text-xs font-black">
              <Bell className="w-4 h-4 animate-bounce" />
              <span>إشعار أمني: تسجيل دخول فوري</span>
            </div>
            <button
              onClick={dismissLoginAlert}
              className="text-slate-400 hover:text-white p-1 rounded-lg transition"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="mt-2 text-xs space-y-1 text-slate-200">
            <p>
              قام <strong className="text-white">{latestLoginAlert.userName}</strong> ({latestLoginAlert.role}) بتسجيل الدخول للنظام.
            </p>
            <div className="flex items-center gap-2 text-[11px] text-slate-400 font-mono">
              <span>IP: {latestLoginAlert.ip}</span>
              <span>•</span>
              <span>{latestLoginAlert.browser}</span>
            </div>
          </div>

          <div className="mt-3 pt-2 border-t border-slate-800 flex items-center justify-between gap-2">
            <a
              href={generateAdminWhatsAppNotificationUrl(latestLoginAlert)}
              target="_blank"
              rel="noopener noreferrer"
              className="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-[11px] font-bold flex items-center gap-1.5 transition"
            >
              <MessageSquare className="w-3 h-3" />
              <span>تنبيه واتساب ({ADMIN_PHONE_NUMBER})</span>
              <ExternalLink className="w-2.5 h-2.5" />
            </a>

            <button
              onClick={() => {
                dismissLoginAlert();
                setIsAuditModalOpen(true);
              }}
              className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-[11px] font-bold transition"
            >
              عرض السجل
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
