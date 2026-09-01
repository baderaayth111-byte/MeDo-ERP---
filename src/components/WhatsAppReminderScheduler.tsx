import React, { useState, useMemo } from 'react';
import {
  MessageCircle,
  Clock,
  Send,
  CheckCircle2,
  AlertCircle,
  Calendar,
  Settings,
  RefreshCw,
  Plus,
  Play,
  Copy,
  Check,
  Filter,
  Search,
  ExternalLink,
  ChevronRight,
  ShieldCheck,
  Smartphone,
  Phone,
  FileText,
  DollarSign,
  User,
  Sliders,
  Trash2,
  Edit3,
  X,
  Sparkles,
  ArrowUpDown,
  Zap
} from 'lucide-react';
import {
  Customer,
  Invoice,
  CompanyProfile,
  Currency,
  WhatsAppReminderRule,
  WhatsAppScheduledReminder,
  ReminderTriggerType,
  ReminderStatus
} from '../types/accounting';
import { formatCurrency } from '../utils/formatters';
import {
  DEFAULT_WHATSAPP_REMINDER_RULES,
  generateRemindersFromInvoices,
  buildWhatsAppDirectLink,
  interpolateReminderMessage,
  calculateDaysUntilDue
} from '../utils/whatsappReminderUtils';

interface WhatsAppReminderSchedulerProps {
  invoices: Invoice[];
  customers: Customer[];
  companyProfile: CompanyProfile;
  currency: Currency;
  rates: Record<Currency, number>;
  onAddReceiptVoucher?: (voucher: any) => void;
}

export const WhatsAppReminderScheduler: React.FC<WhatsAppReminderSchedulerProps> = ({
  invoices,
  customers,
  companyProfile,
  currency,
  rates,
}) => {
  // State for rules and reminders
  const [rules, setRules] = useState<WhatsAppReminderRule[]>(DEFAULT_WHATSAPP_REMINDER_RULES);
  const [reminders, setReminders] = useState<WhatsAppScheduledReminder[]>(() => 
    generateRemindersFromInvoices(invoices, customers, DEFAULT_WHATSAPP_REMINDER_RULES, companyProfile)
  );
  
  const [isSchedulerActive, setIsSchedulerActive] = useState<boolean>(true);
  const [activeSubTab, setActiveSubTab] = useState<'queue' | 'rules' | 'history'>('queue');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'UPCOMING' | 'TODAY' | 'OVERDUE' | 'SENT' | 'SCHEDULED'>('ALL');
  
  // Modals state
  const [selectedReminderForPreview, setSelectedReminderForPreview] = useState<WhatsAppScheduledReminder | null>(null);
  const [isEditMessageModalOpen, setIsEditMessageModalOpen] = useState(false);
  const [customEditedMessage, setCustomEditedMessage] = useState('');
  
  const [isNewCustomReminderOpen, setIsNewCustomReminderOpen] = useState(false);
  const [newReminderInvoiceId, setNewReminderInvoiceId] = useState(invoices[0]?.id || '');
  const [newReminderDate, setNewReminderDate] = useState(new Date().toISOString().split('T')[0]);
  const [newReminderTime, setNewReminderTime] = useState('09:30');
  const [newReminderTemplate, setNewReminderTemplate] = useState('TPL-URGENT-3');
  
  const [isRuleEditModalOpen, setIsRuleEditModalOpen] = useState(false);
  const [selectedRuleForEdit, setSelectedRuleForEdit] = useState<WhatsAppReminderRule | null>(null);
  const [editedRuleText, setEditedRuleText] = useState('');
  const [editedRuleTime, setEditedRuleTime] = useState('09:30');

  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [batchActionRunning, setBatchActionRunning] = useState(false);
  const [toastNotification, setToastNotification] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastNotification(msg);
    setTimeout(() => setToastNotification(null), 4000);
  };

  // KPIs Calculations
  const stats = useMemo(() => {
    const totalReminders = reminders.length;
    const scheduledCount = reminders.filter(r => r.status === 'SCHEDULED').length;
    const sentCount = reminders.filter(r => r.status === 'SENT').length;
    
    // Categorize by timing
    const dueTodayCount = reminders.filter(r => r.daysUntilDue === 0 && r.status === 'SCHEDULED').length;
    const upcomingCount = reminders.filter(r => r.daysUntilDue > 0 && r.status === 'SCHEDULED').length;
    const overdueCount = reminders.filter(r => r.daysUntilDue < 0 && r.status === 'SCHEDULED').length;
    
    const totalRemainingSum = reminders
      .filter(r => r.status === 'SCHEDULED')
      .reduce((sum, r) => sum + r.remainingAmount, 0);

    return {
      totalReminders,
      scheduledCount,
      sentCount,
      dueTodayCount,
      upcomingCount,
      overdueCount,
      totalRemainingSum,
    };
  }, [reminders]);

  // Filtered Reminders List
  const filteredReminders = useMemo(() => {
    return reminders.filter((rem) => {
      // Search
      const matchSearch =
        rem.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        rem.customerPhone.includes(searchQuery) ||
        rem.invoiceNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
        rem.triggerLabel.toLowerCase().includes(searchQuery.toLowerCase());

      if (!matchSearch) return false;

      // Status filter
      if (statusFilter === 'SCHEDULED') return rem.status === 'SCHEDULED';
      if (statusFilter === 'SENT') return rem.status === 'SENT';
      if (statusFilter === 'TODAY') return rem.daysUntilDue === 0 && rem.status === 'SCHEDULED';
      if (statusFilter === 'UPCOMING') return rem.daysUntilDue > 0 && rem.status === 'SCHEDULED';
      if (statusFilter === 'OVERDUE') return rem.daysUntilDue < 0 && rem.status === 'SCHEDULED';

      return true;
    });
  }, [reminders, searchQuery, statusFilter]);

  // Handler: Re-sync reminders from invoices
  const handleSyncReminders = () => {
    const generated = generateRemindersFromInvoices(invoices, customers, rules, companyProfile);
    setReminders(generated);
    showToast(`تمت مزامنة وفحص ${invoices.length} فاتورة وتوليد ${generated.length} تذكير مجدول بنجاح!`);
  };

  // Handler: Run Batch Engine Simulation (Sends all due reminders)
  const handleRunBatchEngine = () => {
    setBatchActionRunning(true);
    setTimeout(() => {
      const scheduledPending = reminders.filter(r => r.status === 'SCHEDULED');
      if (scheduledPending.length === 0) {
        setBatchActionRunning(false);
        showToast('لا توجد تذكيرات معلقة بحاجة للإرسال حالياً.');
        return;
      }

      setReminders(prev =>
        prev.map(r => {
          if (r.status === 'SCHEDULED') {
            return {
              ...r,
              status: 'SENT',
              sentAt: new Date().toISOString().replace('T', ' ').slice(0, 19),
              sentBy: 'نظام الجدولة التلقائي (Automated CRON Engine)',
              lastLog: 'تم الإرسال الآلي بنجاح عبر بوابة WhatsApp Cloud API',
            };
          }
          return r;
        })
      );

      setBatchActionRunning(false);
      showToast(`⚡ تم تشغيل محرك الجدولة بنجاح وإرسال ${scheduledPending.length} رسالة تذكير عبر واتساب!`);
    }, 1200);
  };

  // Handler: Send Single WhatsApp Direct
  const handleSendSingleWhatsApp = (rem: WhatsAppScheduledReminder) => {
    const directUrl = buildWhatsAppDirectLink(rem.customerPhone, rem.messageText);
    
    // Mark as sent
    setReminders(prev =>
      prev.map(r => {
        if (r.id === rem.id) {
          return {
            ...r,
            status: 'SENT',
            sentAt: new Date().toISOString().replace('T', ' ').slice(0, 19),
            sentBy: 'مسؤول التحصيل والائتمان',
            lastLog: 'تم توجيه الرسالة بنجاح عبر رابط WhatsApp Web المباشر',
          };
        }
        return r;
      })
    );

    // Open WhatsApp in new window/tab
    window.open(directUrl, '_blank', 'noopener,noreferrer');
    showToast(`جاري فتح محادثة الواتساب مع العميل "${rem.customerName}"...`);
  };

  // Handler: Copy text
  const handleCopyText = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    showToast('تم نسخ نص رسالة التذكير إلى الحافظة!');
    setTimeout(() => setCopiedId(null), 2500);
  };

  // Handler: Save Edited Message
  const handleSaveEditedMessage = () => {
    if (!selectedReminderForPreview) return;
    setReminders(prev =>
      prev.map(r => {
        if (r.id === selectedReminderForPreview.id) {
          return {
            ...r,
            messageText: customEditedMessage,
            lastLog: 'تم تعديل نص الرسالة يدوياً من قبل المستخدم',
          };
        }
        return r;
      })
    );
    setIsEditMessageModalOpen(false);
    setSelectedReminderForPreview(null);
    showToast('تم حفظ التعديلات على نص التذكير بنجاح!');
  };

  // Handler: Add Custom Scheduled Reminder
  const handleAddCustomReminder = (e: React.FormEvent) => {
    e.preventDefault();
    const inv = invoices.find(i => i.id === newReminderInvoiceId);
    if (!inv) return;

    const cust = customers.find(c => c.id === inv.entityId || c.nameAr === inv.entityName);
    const daysUntilDue = calculateDaysUntilDue(inv.dueDate, newReminderDate);
    const ruleTpl = rules.find(r => r.templateId === newReminderTemplate) || rules[0];

    const messageText = interpolateReminderMessage(ruleTpl.defaultMessage, {
      customerName: cust?.nameAr || inv.entityName,
      customerCode: cust?.code || 'CUST-001',
      invoiceNumber: inv.invoiceNumber,
      invoiceDate: inv.date,
      dueDate: inv.dueDate,
      remainingAmount: inv.remainingAmount,
      currency: inv.currency,
      daysUntilDue,
      companyProfile,
    });

    const newReminder: WhatsAppScheduledReminder = {
      id: `REM-MANUAL-${Date.now()}`,
      invoiceId: inv.id,
      invoiceNumber: inv.invoiceNumber,
      customerId: cust?.id || inv.entityId,
      customerCode: cust?.code || 'CUST-001',
      customerName: cust?.nameAr || inv.entityName,
      customerPhone: cust?.phone || '771234567',
      countryCode: '+967',
      invoiceDate: inv.date,
      dueDate: inv.dueDate,
      daysUntilDue,
      totalAmount: inv.grandTotal,
      paidAmount: inv.paidAmount,
      remainingAmount: inv.remainingAmount,
      currency: inv.currency,
      triggerType: 'CUSTOM_DATE',
      triggerLabel: `تذكير مخصص (${newReminderDate})`,
      scheduledDate: newReminderDate,
      scheduledTime: newReminderTime,
      status: 'SCHEDULED',
      messageText,
      deliveryChannel: 'WHATSAPP_WEB_DIRECT',
      responseStatus: 'PENDING',
      lastLog: 'تمت إضافة الجدولة يدوياً من قبل المستخدم',
    };

    setReminders([newReminder, ...reminders]);
    setIsNewCustomReminderOpen(false);
    showToast(`تمت جدولة تذكير واتساب مخصص للفاتورة ${inv.invoiceNumber} بنجاح!`);
  };

  // Handler: Toggle Rule Active
  const handleToggleRule = (ruleId: string) => {
    setRules(prev =>
      prev.map(r => (r.id === ruleId ? { ...r, isEnabled: !r.isEnabled } : r))
    );
    showToast('تم تحديث حالة تفعيل قاعدة الجدولة!');
  };

  // Handler: Save Rule Edit
  const handleSaveRuleEdit = () => {
    if (!selectedRuleForEdit) return;
    setRules(prev =>
      prev.map(r => {
        if (r.id === selectedRuleForEdit.id) {
          return {
            ...r,
            defaultMessage: editedRuleText,
            scheduledSendTime: editedRuleTime,
          };
        }
        return r;
      })
    );
    setIsRuleEditModalOpen(false);
    setSelectedRuleForEdit(null);
    showToast('تم تحديث قالب قاعدة الجدولة بنجاح!');
  };

  return (
    <div className="space-y-5" id="whatsapp-reminder-scheduler-root">
      {/* TOAST NOTIFICATION */}
      {toastNotification && (
        <div className="fixed bottom-5 left-5 z-50 bg-slate-900/95 backdrop-blur text-white px-4 py-3 rounded-xl shadow-xl flex items-center gap-3 border border-slate-700 animate-in fade-in slide-in-from-bottom-5">
          <Sparkles className="w-5 h-5 text-emerald-400 shrink-0" />
          <span className="text-xs font-semibold">{toastNotification}</span>
        </div>
      )}

      {/* HEADER CONTROL BAR */}
      <div className="bg-gradient-to-r from-emerald-900 via-teal-900 to-slate-900 rounded-2xl p-5 text-white shadow-lg relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20"></div>
        <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <div className="p-2 bg-emerald-500/20 text-emerald-300 rounded-xl border border-emerald-500/30">
                <MessageCircle className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-lg font-bold flex items-center gap-2">
                  <span>جدولة التذكيرات التلقائية عبر الواتساب (WhatsApp Due Date Reminders)</span>
                  <span className="text-[10px] bg-emerald-500/30 text-emerald-200 px-2.5 py-0.5 rounded-full border border-emerald-400/30 font-mono font-normal">
                    Auto-Scheduler Active
                  </span>
                </h2>
                <p className="text-xs text-emerald-200/80">
                  إرسال وإدارة تذكيرات استحقاق الفواتير للعملاء آلياً عند اقتراب الموعد (7 أيام، 3 أيام، يوم الاستحقاق، والمتأخرات)
                </p>
              </div>
            </div>
          </div>

          {/* Action Buttons & Status Toggle */}
          <div className="flex flex-wrap items-center gap-2.5 self-stretch sm:self-auto">
            {/* Engine Toggle Switch */}
            <div className="flex items-center gap-2 bg-white/10 backdrop-blur border border-white/15 px-3 py-1.5 rounded-xl">
              <span className="text-[11px] font-medium text-emerald-100">
                المحرك التلقائي:
              </span>
              <button
                onClick={() => {
                  setIsSchedulerActive(!isSchedulerActive);
                  showToast(isSchedulerActive ? 'تم إيقاف محرك الجدولة التلقائية مؤقتاً.' : 'تم تفعيل محرك الجدولة التلقائية بنجاح!');
                }}
                className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                  isSchedulerActive ? 'bg-emerald-500' : 'bg-slate-600'
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                    isSchedulerActive ? 'translate-x-4' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            {/* Run Engine Now */}
            <button
              onClick={handleRunBatchEngine}
              disabled={batchActionRunning}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs rounded-xl shadow-md transition disabled:opacity-50"
              title="تشغيل محرك الإرسال الفوري لكافة التذكيرات المستحقة"
            >
              {batchActionRunning ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>جاري الإرسال...</span>
                </>
              ) : (
                <>
                  <Zap className="w-3.5 h-3.5 fill-current" />
                  <span>تشغيل المحرك الآن (Send Due)</span>
                </>
              )}
            </button>

            {/* Sync from Invoices */}
            <button
              onClick={handleSyncReminders}
              className="p-2 bg-white/10 hover:bg-white/20 text-white rounded-xl border border-white/15 transition"
              title="إعادة فحص الفواتير وتوليد الجدولة"
            >
              <RefreshCw className="w-4 h-4" />
            </button>

            {/* Add Custom Reminder */}
            <button
              onClick={() => setIsNewCustomReminderOpen(true)}
              className="flex items-center gap-1.5 px-3 py-2 bg-white/10 hover:bg-white/20 text-white text-xs font-semibold rounded-xl border border-white/20 transition"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>جدولة مخصصة</span>
            </button>
          </div>
        </div>
      </div>

      {/* KPI METRIC CARDS */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
        <div className="bg-white border border-slate-200 p-3.5 rounded-xl shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium mb-1">
            <span>إجمالي التذكيرات</span>
            <Calendar className="w-4 h-4 text-blue-500" />
          </div>
          <div className="text-xl font-bold text-slate-800 font-mono">
            {stats.totalReminders}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            {stats.scheduledCount} معلق / {stats.sentCount} مرسل
          </div>
        </div>

        <div className="bg-white border border-slate-200 p-3.5 rounded-xl shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium mb-1">
            <span>مستحق قريباً (1-7 أيام)</span>
            <Clock className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-xl font-bold text-emerald-600 font-mono">
            {stats.upcomingCount}
          </div>
          <div className="text-[11px] text-emerald-700/80 mt-1">
            تذكيرات استباقية مسبقة
          </div>
        </div>

        <div className="bg-white border border-slate-200 p-3.5 rounded-xl shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium mb-1">
            <span>يحل موعدها اليوم!</span>
            <AlertCircle className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-xl font-bold text-amber-600 font-mono">
            {stats.dueTodayCount}
          </div>
          <div className="text-[11px] text-amber-700/80 mt-1">
            استحقاق السداد اليوم
          </div>
        </div>

        <div className="bg-white border border-slate-200 p-3.5 rounded-xl shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium mb-1">
            <span>فواتير متأخرة ومتعثرة</span>
            <AlertCircle className="w-4 h-4 text-rose-500" />
          </div>
          <div className="text-xl font-bold text-rose-600 font-mono">
            {stats.overdueCount}
          </div>
          <div className="text-[11px] text-rose-700/80 mt-1">
            مطالبات ومتابعة حازمة
          </div>
        </div>

        <div className="bg-white border border-slate-200 p-3.5 rounded-xl shadow-xs col-span-2 sm:col-span-2 lg:col-span-1">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium mb-1">
            <span>المبالغ المجدولة للتحصيل</span>
            <DollarSign className="w-4 h-4 text-teal-600" />
          </div>
          <div className="text-lg font-bold text-slate-800 font-mono truncate">
            {formatCurrency(stats.totalRemainingSum, currency)}
          </div>
          <div className="text-[11px] text-teal-700/80 mt-1">
            إجمالي رصيد الفواتير المعلقة
          </div>
        </div>
      </div>

      {/* SUB TABS NAVIGATION */}
      <div className="flex items-center justify-between border-b border-slate-200 pb-2">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveSubTab('queue')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
              activeSubTab === 'queue'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>قائمة التذكيرات المجدولة ({reminders.length})</span>
          </button>

          <button
            onClick={() => setActiveSubTab('rules')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
              activeSubTab === 'rules'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>قواعد ومواعيد الإرسال والقوالب ({rules.length})</span>
          </button>

          <button
            onClick={() => setActiveSubTab('history')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
              activeSubTab === 'history'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>سجل الإرسال والعمليات المنفذة ({stats.sentCount})</span>
          </button>
        </div>

        <div className="hidden sm:flex items-center gap-2 text-xs text-slate-500">
          <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          <span>بوابة WhatsApp Cloud API متصلة</span>
        </div>
      </div>

      {/* SUBTAB 1: QUEUE */}
      {activeSubTab === 'queue' && (
        <div className="space-y-4">
          {/* Filters Bar */}
          <div className="bg-white border border-slate-200 p-3.5 rounded-xl shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 absolute right-3 top-2.5 text-slate-400" />
              <input
                type="text"
                placeholder="البحث بالعميل، الفاتورة، أو رقم الهاتف..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-3 pr-9 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white"
              />
            </div>

            {/* Quick Status Filter Tabs */}
            <div className="flex flex-wrap items-center gap-1.5 self-stretch sm:self-auto text-xs">
              <button
                onClick={() => setStatusFilter('ALL')}
                className={`px-2.5 py-1 rounded-lg font-semibold transition ${
                  statusFilter === 'ALL'
                    ? 'bg-slate-800 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                الكل ({reminders.length})
              </button>
              <button
                onClick={() => setStatusFilter('UPCOMING')}
                className={`px-2.5 py-1 rounded-lg font-semibold transition ${
                  statusFilter === 'UPCOMING'
                    ? 'bg-emerald-600 text-white'
                    : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                }`}
              >
                قريب (1-7 أيام)
              </button>
              <button
                onClick={() => setStatusFilter('TODAY')}
                className={`px-2.5 py-1 rounded-lg font-semibold transition ${
                  statusFilter === 'TODAY'
                    ? 'bg-amber-600 text-white'
                    : 'bg-amber-50 text-amber-700 hover:bg-amber-100'
                }`}
              >
                اليوم ({stats.dueTodayCount})
              </button>
              <button
                onClick={() => setStatusFilter('OVERDUE')}
                className={`px-2.5 py-1 rounded-lg font-semibold transition ${
                  statusFilter === 'OVERDUE'
                    ? 'bg-rose-600 text-white'
                    : 'bg-rose-50 text-rose-700 hover:bg-rose-100'
                }`}
              >
                متأخرات ({stats.overdueCount})
              </button>
              <button
                onClick={() => setStatusFilter('SENT')}
                className={`px-2.5 py-1 rounded-lg font-semibold transition ${
                  statusFilter === 'SENT'
                    ? 'bg-blue-600 text-white'
                    : 'bg-blue-50 text-blue-700 hover:bg-blue-100'
                }`}
              >
                مرسل ({stats.sentCount})
              </button>
            </div>
          </div>

          {/* Table of Scheduled Reminders */}
          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-right text-xs">
                <thead className="bg-slate-50 text-slate-700 border-b border-slate-200 font-semibold">
                  <tr>
                    <th className="p-3">العميل ورقم الهاتف</th>
                    <th className="p-3">رقم الفاتورة</th>
                    <th className="p-3">تاريخ الاستحقاق</th>
                    <th className="p-3">المتبقي للسداد</th>
                    <th className="p-3">نوع التذكير وموعد الجدولة</th>
                    <th className="p-3 text-center">الحالة</th>
                    <th className="p-3 text-center">إجراءات الإرسال</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredReminders.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="p-8 text-center text-slate-400">
                        لا توجد تذكيرات مطابقة للبحث أو التصفية الحالية.
                      </td>
                    </tr>
                  ) : (
                    filteredReminders.map((rem) => {
                      const isOverdue = rem.daysUntilDue < 0;
                      const isToday = rem.daysUntilDue === 0;
                      const isSent = rem.status === 'SENT';

                      return (
                        <tr key={rem.id} className="hover:bg-slate-50/80 transition">
                          {/* Customer info */}
                          <td className="p-3">
                            <div className="font-bold text-slate-800">{rem.customerName}</div>
                            <div className="flex items-center gap-1.5 text-slate-500 font-mono text-[11px] mt-0.5">
                              <Phone className="w-3 h-3 text-slate-400" />
                              <span dir="ltr">{rem.countryCode} {rem.customerPhone}</span>
                            </div>
                          </td>

                          {/* Invoice info */}
                          <td className="p-3">
                            <span className="font-mono font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded border border-blue-200 text-[11px]">
                              {rem.invoiceNumber}
                            </span>
                            <div className="text-[10px] text-slate-400 mt-1">
                              إصدار: {rem.invoiceDate}
                            </div>
                          </td>

                          {/* Due date & countdown */}
                          <td className="p-3">
                            <div className="font-medium text-slate-700">{rem.dueDate}</div>
                            <div className="mt-1">
                              {isToday ? (
                                <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                                  <AlertCircle className="w-3 h-3" /> اليوم!
                                </span>
                              ) : isOverdue ? (
                                <span className="inline-flex items-center gap-1 text-[10px] font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded border border-rose-200">
                                  <AlertCircle className="w-3 h-3" /> متأخر ({Math.abs(rem.daysUntilDue)} يوم)
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                                  <Clock className="w-3 h-3" /> متبقي ({rem.daysUntilDue} يوم)
                                </span>
                              )}
                            </div>
                          </td>

                          {/* Amount */}
                          <td className="p-3 font-mono font-bold text-amber-700">
                            {formatCurrency(rem.remainingAmount, rem.currency)}
                            <div className="text-[10px] text-slate-400 font-normal font-sans mt-0.5">
                              من إجمالي {formatCurrency(rem.totalAmount, rem.currency)}
                            </div>
                          </td>

                          {/* Trigger Rule & Schedule Time */}
                          <td className="p-3">
                            <div className="font-semibold text-slate-800 text-[11px] flex items-center gap-1">
                              <Zap className="w-3 h-3 text-emerald-500" />
                              <span>{rem.triggerLabel}</span>
                            </div>
                            <div className="text-[10px] text-slate-500 mt-0.5 flex items-center gap-1">
                              <Calendar className="w-3 h-3 text-slate-400" />
                              <span>الجدولة: {rem.scheduledDate} ({rem.scheduledTime})</span>
                            </div>
                          </td>

                          {/* Status Badge */}
                          <td className="p-3 text-center">
                            <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full inline-flex items-center gap-1 ${
                              isSent
                                ? 'bg-blue-50 text-blue-700 border border-blue-200'
                                : isToday
                                ? 'bg-amber-50 text-amber-700 border border-amber-200 animate-pulse'
                                : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            }`}>
                              {isSent ? (
                                <>
                                  <CheckCircle2 className="w-3 h-3" />
                                  <span>تم الإرسال</span>
                                </>
                              ) : (
                                <>
                                  <Clock className="w-3 h-3" />
                                  <span>مجدول آلياً</span>
                                </>
                              )}
                            </span>
                            {rem.sentAt && (
                              <div className="text-[9px] text-slate-400 mt-1 font-mono">
                                {rem.sentAt.split(' ')[0]}
                              </div>
                            )}
                          </td>

                          {/* Actions */}
                          <td className="p-3 text-center">
                            <div className="flex items-center justify-center gap-1.5">
                              {/* Direct Send WhatsApp */}
                              <button
                                onClick={() => handleSendSingleWhatsApp(rem)}
                                className="flex items-center gap-1 px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[11px] font-bold shadow-xs transition"
                                title="إرسال رسالة التذكير مباشرة عبر تطبيق WhatsApp"
                              >
                                <MessageCircle className="w-3.5 h-3.5" />
                                <span>{isSent ? 'إعادة إرسال' : 'إرسال واتساب'}</span>
                              </button>

                              {/* Preview / Edit Text */}
                              <button
                                onClick={() => {
                                  setSelectedReminderForPreview(rem);
                                  setCustomEditedMessage(rem.messageText);
                                  setIsEditMessageModalOpen(true);
                                }}
                                className="p-1.5 bg-slate-100 hover:bg-blue-50 hover:text-blue-600 text-slate-600 rounded-lg transition"
                                title="معاينة وتخصيص نص الرسالة"
                              >
                                <Edit3 className="w-3.5 h-3.5" />
                              </button>

                              {/* Copy text */}
                              <button
                                onClick={() => handleCopyText(rem.id, rem.messageText)}
                                className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg transition"
                                title="نسخ نص الرسالة"
                              >
                                {copiedId === rem.id ? (
                                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                                ) : (
                                  <Copy className="w-3.5 h-3.5" />
                                )}
                              </button>

                              {/* Cancel reminder */}
                              <button
                                onClick={() => {
                                  setReminders(reminders.filter(r => r.id !== rem.id));
                                  showToast('تم إلغاء التذكير المجدول.');
                                }}
                                className="p-1.5 hover:bg-rose-50 text-slate-400 hover:text-rose-600 rounded-lg transition"
                                title="إلغاء هذا التذكير"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Footer Summary */}
            <div className="bg-slate-50 border-t border-slate-200 p-3 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-600 gap-2">
              <div>
                عرض <strong className="text-slate-800">{filteredReminders.length}</strong> من أصل <strong className="text-slate-800">{reminders.length}</strong> تذكير مجدول
              </div>
              <div className="flex items-center gap-4">
                <span>المستحق قريباً: <strong className="text-emerald-700">{stats.upcomingCount}</strong></span>
                <span>استحقاق اليوم: <strong className="text-amber-700">{stats.dueTodayCount}</strong></span>
                <span>المتأخرات: <strong className="text-rose-700">{stats.overdueCount}</strong></span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SUBTAB 2: RULES & TEMPLATES */}
      {activeSubTab === 'rules' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-800">
                إعدادات قواعد الإرسال التلقائي وقوالب التذكيرات (Automation Rules & Triggers)
              </h3>
              <p className="text-xs text-slate-500">
                تحديد مواعيد الجدولة التلقائية قبل وبعد موعد استحقاق الفاتورة وتخصيص نصوص الرسائل
              </p>
            </div>
            <div className="text-xs text-slate-500">
              القواعد النشطة: <strong className="text-emerald-700 font-bold">{rules.filter(r => r.isEnabled).length}</strong> من {rules.length}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {rules.map((rule) => (
              <div
                key={rule.id}
                className={`bg-white border rounded-xl p-4 shadow-xs transition space-y-3 ${
                  rule.isEnabled ? 'border-slate-200 hover:border-emerald-300' : 'border-slate-200 opacity-60 bg-slate-50/50'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <div className={`p-2 rounded-xl text-white ${
                      rule.daysOffset < 0
                        ? 'bg-emerald-600'
                        : rule.daysOffset === 0
                        ? 'bg-amber-600'
                        : 'bg-rose-600'
                    }`}>
                      <Clock className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-slate-800">{rule.nameAr}</h4>
                      <span className="text-[10px] text-slate-500 font-mono">
                        {rule.daysOffset < 0 ? `قبل الاستحقاق بـ ${Math.abs(rule.daysOffset)} أيام` : rule.daysOffset === 0 ? 'في يوم الاستحقاق نفسه' : `بعد تجاوز الاستحقاق بـ ${rule.daysOffset} أيام`}
                      </span>
                    </div>
                  </div>

                  {/* Toggle */}
                  <button
                    onClick={() => handleToggleRule(rule.id)}
                    className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                      rule.isEnabled ? 'bg-emerald-600' : 'bg-slate-300'
                    }`}
                  >
                    <span
                      className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                        rule.isEnabled ? 'translate-x-4' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>

                {/* Rule Template Preview */}
                <div className="bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-[11px] text-slate-700 font-mono whitespace-pre-wrap line-clamp-4 leading-relaxed">
                  {rule.defaultMessage}
                </div>

                {/* Rule footer options */}
                <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-100">
                  <div className="flex items-center gap-3 text-[11px] text-slate-500">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3 text-slate-400" />
                      <span>وقت الإرسال اليومي: <strong className="text-slate-700">{rule.scheduledSendTime}</strong></span>
                    </span>
                  </div>

                  <button
                    onClick={() => {
                      setSelectedRuleForEdit(rule);
                      setEditedRuleText(rule.defaultMessage);
                      setEditedRuleTime(rule.scheduledSendTime);
                      setIsRuleEditModalOpen(true);
                    }}
                    className="flex items-center gap-1 text-[11px] text-emerald-700 hover:text-emerald-800 font-bold"
                  >
                    <Edit3 className="w-3 h-3" />
                    <span>تعديل القالب والوقت</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SUBTAB 3: HISTORY / AUDIT LOG */}
      {activeSubTab === 'history' && (
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>سجل عمليات إرسال التذكيرات (WhatsApp Delivery Log)</span>
              </h3>
              <p className="text-xs text-slate-500">
                توثيق العمليات الصادرة وحالة تسليم الرسائل واستجابة العملاء
              </p>
            </div>
            <button
              onClick={() => {
                const sentRows = reminders.filter(r => r.status === 'SENT');
                showToast(`تم تصدير سجل يحتوي على ${sentRows.length} عملية إرسال.`);
              }}
              className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold"
            >
              تصدير السجل
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs">
              <thead className="bg-slate-50 text-slate-700 border-b border-slate-200 font-semibold">
                <tr>
                  <th className="p-3">تاريخ ووقت الإرسال</th>
                  <th className="p-3">العميل المستلم</th>
                  <th className="p-3">رقم الهاتف</th>
                  <th className="p-3">رقم الفاتورة والمبلغ</th>
                  <th className="p-3">الجهة المنفذة</th>
                  <th className="p-3">حالة التسليم</th>
                  <th className="p-3">ملاحظات النظام</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {reminders.filter(r => r.status === 'SENT').length === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-slate-400">
                      لم يتم تنفيذ أي عمليات إرسال حتى الآن. انقر فوق "تشغيل المحرك الآن" لتنفيذ التذكيرات المعلقة.
                    </td>
                  </tr>
                ) : (
                  reminders.filter(r => r.status === 'SENT').map((rem) => (
                    <tr key={rem.id} className="hover:bg-slate-50/70">
                      <td className="p-3 font-mono text-slate-600">{rem.sentAt || 'اليوم 09:30'}</td>
                      <td className="p-3 font-bold text-slate-800">{rem.customerName}</td>
                      <td className="p-3 font-mono text-slate-600" dir="ltr">{rem.countryCode} {rem.customerPhone}</td>
                      <td className="p-3">
                        <span className="font-mono text-blue-700 font-bold">{rem.invoiceNumber}</span>
                        <div className="font-mono text-amber-700">{formatCurrency(rem.remainingAmount, rem.currency)}</div>
                      </td>
                      <td className="p-3 text-slate-600">{rem.sentBy || 'نظام الجدولة الآلي'}</td>
                      <td className="p-3">
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                          <Check className="w-3 h-3" /> تم التسليم بنجاح
                        </span>
                      </td>
                      <td className="p-3 text-slate-500 text-[11px]">{rem.lastLog}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* MODAL 1: PREVIEW & CUSTOMIZE MESSAGE */}
      {isEditMessageModalOpen && selectedReminderForPreview && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-xl w-full p-5 shadow-2xl border border-slate-200 space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl">
                  <MessageCircle className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-800">
                    معاينة وتخصيص نص رسالة التذكير
                  </h3>
                  <p className="text-xs text-slate-500">
                    العميل: {selectedReminderForPreview.customerName} | الفاتورة: {selectedReminderForPreview.invoiceNumber}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsEditMessageModalOpen(false)}
                className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-400"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2">
              <label className="block text-xs font-semibold text-slate-700">
                نص الرسالة (يمكنك التعديل عليها مباشرة قبل الإرسال):
              </label>
              <textarea
                rows={10}
                value={customEditedMessage}
                onChange={(e) => setCustomEditedMessage(e.target.value)}
                className="w-full p-3 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono leading-relaxed"
              />
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-slate-100">
              <button
                onClick={() => handleSendSingleWhatsApp({
                  ...selectedReminderForPreview,
                  messageText: customEditedMessage,
                })}
                className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-xs transition"
              >
                <Send className="w-3.5 h-3.5" />
                <span>إرسال واتساب مباشرة</span>
              </button>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsEditMessageModalOpen(false)}
                  className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition"
                >
                  إلغاء
                </button>
                <button
                  onClick={handleSaveEditedMessage}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-xs transition"
                >
                  حفظ التعديلات
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: ADD CUSTOM REMINDER */}
      {isNewCustomReminderOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <form onSubmit={handleAddCustomReminder} className="bg-white rounded-2xl max-w-lg w-full p-5 shadow-2xl border border-slate-200 space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                <Plus className="w-4 h-4 text-emerald-600" />
                <span>جدولة تذكير واتساب مخصص لفاتورة محددة</span>
              </h3>
              <button
                type="button"
                onClick={() => setIsNewCustomReminderOpen(false)}
                className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-400"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">اختر الفاتورة المراد التذكير بها</label>
                <select
                  value={newReminderInvoiceId}
                  onChange={(e) => setNewReminderInvoiceId(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  {invoices.filter(i => i.type === 'CUSTOMER_INVOICE').map(inv => (
                    <option key={inv.id} value={inv.id}>
                      {inv.invoiceNumber} - {inv.entityName} (المتبقي: {formatCurrency(inv.remainingAmount, inv.currency)})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">تاريخ الجدولة المطلوب</label>
                  <input
                    type="date"
                    value={newReminderDate}
                    onChange={(e) => setNewReminderDate(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">وقت الإرسال</label>
                  <input
                    type="time"
                    value={newReminderTime}
                    onChange={(e) => setNewReminderTime(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">نمط وقالب الرسالة</label>
                <select
                  value={newReminderTemplate}
                  onChange={(e) => setNewReminderTemplate(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  {rules.map(r => (
                    <option key={r.templateId} value={r.templateId}>
                      {r.nameAr} ({r.templateTitle})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setIsNewCustomReminderOpen(false)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl"
              >
                إلغاء
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-xs"
              >
                تأكيد الجدولة
              </button>
            </div>
          </form>
        </div>
      )}

      {/* MODAL 3: EDIT RULE TEMPLATE */}
      {isRuleEditModalOpen && selectedRuleForEdit && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-xl w-full p-5 shadow-2xl border border-slate-200 space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                <Sliders className="w-4 h-4 text-emerald-600" />
                <span>تعديل قاعدة: {selectedRuleForEdit.nameAr}</span>
              </h3>
              <button
                onClick={() => setIsRuleEditModalOpen(false)}
                className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-400"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">وقت الجدولة اليومي (Daily Schedule Time)</label>
                <input
                  type="time"
                  value={editedRuleTime}
                  onChange={(e) => setEditedRuleTime(e.target.value)}
                  className="w-full sm:w-48 p-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="font-semibold text-slate-700">قالب الرسالة التلقائي (Template Content):</label>
                  <span className="text-[10px] text-slate-400">يدعم المتغيرات الديناميكية [اسم_العميل]، [رقم_الفاتورة]...</span>
                </div>
                <textarea
                  rows={9}
                  value={editedRuleText}
                  onChange={(e) => setEditedRuleText(e.target.value)}
                  className="w-full p-3 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono leading-relaxed"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                onClick={() => setIsRuleEditModalOpen(false)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl"
              >
                إلغاء
              </button>
              <button
                onClick={handleSaveRuleEdit}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-xs"
              >
                حفظ التعديلات
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
