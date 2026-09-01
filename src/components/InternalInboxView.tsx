import React, { useState } from 'react';
import { 
  Inbox, 
  Bell, 
  Search, 
  Filter, 
  CheckCheck, 
  Archive, 
  Trash2, 
  PlusCircle, 
  Send, 
  DollarSign, 
  ShoppingBag, 
  Users, 
  ShieldAlert, 
  MessageSquare, 
  CheckCircle2, 
  Clock, 
  ExternalLink, 
  ChevronLeft, 
  Sparkles, 
  Share2, 
  AlertCircle,
  FileText,
  Mail,
  User,
  ArrowUpRight,
  Eye,
  Check
} from 'lucide-react';
import { AppNotification, NotificationType, NotificationPriority } from '../types/workflow';
import { ADMIN_WHATSAPP_NUMBER } from '../data/userCredentials';

interface InternalInboxViewProps {
  notifications: AppNotification[];
  onMarkAsRead: (id: string) => void;
  onMarkAllAsRead: () => void;
  onArchiveNotification: (id: string) => void;
  onDeleteNotification: (id: string) => void;
  onAddNotification: (notification: AppNotification) => void;
  onNavigateToModule: (moduleKey: string, targetId?: string) => void;
}

export const InternalInboxView: React.FC<InternalInboxViewProps> = ({
  notifications,
  onMarkAsRead,
  onMarkAllAsRead,
  onArchiveNotification,
  onDeleteNotification,
  onAddNotification,
  onNavigateToModule,
}) => {
  const [activeTab, setActiveTab] = useState<'ALL' | NotificationType>('ALL');
  const [stateFilter, setStateFilter] = useState<'ALL' | 'UNREAD' | 'ARCHIVED'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedNotification, setSelectedNotification] = useState<AppNotification | null>(null);
  const [isComposeModalOpen, setIsComposeModalOpen] = useState(false);

  // New notification form state
  const [newTitle, setNewTitle] = useState('');
  const [newMessage, setNewMessage] = useState('');
  const [newType, setNewType] = useState<NotificationType>('GENERAL');
  const [newPriority, setNewPriority] = useState<NotificationPriority>('MEDIUM');
  const [sendWhatsApp, setSendWhatsApp] = useState(true);
  const [sendTelegram, setSendTelegram] = useState(true);

  // Statistics
  const totalCount = notifications.length;
  const unreadCount = notifications.filter(n => !n.isRead && !n.isArchived).length;
  const financialCount = notifications.filter(n => n.type === 'FINANCIAL' && !n.isArchived).length;
  const salesCount = notifications.filter(n => n.type === 'SALES' && !n.isArchived).length;
  const procurementCount = notifications.filter(n => n.type === 'PROCUREMENT' && !n.isArchived).length;
  const systemCount = notifications.filter(n => n.type === 'SYSTEM' && !n.isArchived).length;
  const archivedCount = notifications.filter(n => n.isArchived).length;

  // Filtered list
  const filteredList = notifications
    .filter(n => {
      if (stateFilter === 'UNREAD') return !n.isRead && !n.isArchived;
      if (stateFilter === 'ARCHIVED') return n.isArchived;
      return !n.isArchived; // default active (read & unread)
    })
    .filter(n => {
      if (activeTab === 'ALL') return true;
      return n.type === activeTab;
    })
    .filter(n => {
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      return (
        n.title.toLowerCase().includes(q) ||
        n.message.toLowerCase().includes(q) ||
        n.sender.name.toLowerCase().includes(q) ||
        (n.targetId && n.targetId.toLowerCase().includes(q))
      );
    });

  const handleCreateBroadcast = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newMessage.trim()) return;

    const channels: ('IN_APP' | 'EMAIL' | 'WHATSAPP' | 'TELEGRAM')[] = ['IN_APP', 'EMAIL'];
    if (sendWhatsApp) channels.push('WHATSAPP');
    if (sendTelegram) channels.push('TELEGRAM');

    const whatsappText = `📢 *تعميم وإشعار داخلي MeDo ERP*\n*العنوان:* ${newTitle}\n*الأهمية:* ${newPriority === 'URGENT' ? '🔴 عاجل جداً' : newPriority === 'HIGH' ? '🟠 هام' : '🟢 عادي'}\n*التفاصيل:* ${newMessage}\n*المرسل:* إدارة النظام والمجموعة`;
    const whatsappUrl = `https://wa.me/${ADMIN_WHATSAPP_NUMBER}?text=${encodeURIComponent(whatsappText)}`;

    const newNotif: AppNotification = {
      id: `NOTIF-${Date.now().toString().slice(-4)}`,
      title: newTitle,
      message: newMessage,
      type: newType,
      priority: newPriority,
      timestamp: new Date().toISOString(),
      isRead: false,
      isArchived: false,
      sender: {
        name: 'ميدو تك للحلول البرمجية',
        role: 'مدير النظام الرئيسي',
      },
      channels,
      whatsappUrl,
    };

    onAddNotification(newNotif);
    setIsComposeModalOpen(false);
    setNewTitle('');
    setNewMessage('');
  };

  const getTypeIcon = (type: NotificationType) => {
    switch (type) {
      case 'FINANCIAL': return <DollarSign className="w-4 h-4 text-emerald-600" />;
      case 'PROCUREMENT': return <ShoppingBag className="w-4 h-4 text-purple-600" />;
      case 'SALES': return <Users className="w-4 h-4 text-blue-600" />;
      case 'SYSTEM': return <ShieldAlert className="w-4 h-4 text-rose-600" />;
      case 'GENERAL': default: return <MessageSquare className="w-4 h-4 text-amber-600" />;
    }
  };

  const getTypeLabel = (type: NotificationType) => {
    switch (type) {
      case 'FINANCIAL': return 'مالية ومصروفات';
      case 'PROCUREMENT': return 'مشتريات وتوريد';
      case 'SALES': return 'مبيعات وعملاء';
      case 'SYSTEM': return 'نظام وأمان';
      case 'GENERAL': default: return 'عام وملاحظات';
    }
  };

  const getPriorityBadge = (priority: NotificationPriority) => {
    switch (priority) {
      case 'URGENT':
        return <span className="bg-rose-100 text-rose-800 border border-rose-300 text-[10px] font-black px-2 py-0.5 rounded-full">عاجل جداً</span>;
      case 'HIGH':
        return <span className="bg-amber-100 text-amber-800 border border-amber-300 text-[10px] font-bold px-2 py-0.5 rounded-full">هام</span>;
      case 'MEDIUM':
        return <span className="bg-blue-100 text-blue-800 border border-blue-200 text-[10px] font-medium px-2 py-0.5 rounded-full">متوسط</span>;
      default:
        return <span className="bg-slate-100 text-slate-700 border border-slate-200 text-[10px] font-medium px-2 py-0.5 rounded-full">عادي</span>;
    }
  };

  return (
    <div className="space-y-6" dir="rtl">
      {/* Top Banner & Header */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white rounded-2xl p-6 shadow-xl border border-indigo-900">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-blue-600/30 rounded-2xl border border-blue-400/30">
              <Inbox className="w-8 h-8 text-blue-300" />
            </div>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-xl sm:text-2xl font-black">صندوق الوارد والرسائل والإشعارات الداخلية</h1>
                {unreadCount > 0 && (
                  <span className="bg-rose-500 text-white text-xs font-black px-2.5 py-0.5 rounded-full animate-pulse shadow-sm">
                    {unreadCount} غير مقروء
                  </span>
                )}
              </div>
              <p className="text-sm text-slate-300 mt-1">
                مركز التنبيهات اللحظية، دورات اعتماد المستندات، والمراسلات بين الإدارات والأقسام
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => setIsComposeModalOpen(true)}
              className="bg-blue-600 hover:bg-blue-500 text-white text-xs font-black px-4 py-2.5 rounded-xl shadow-lg transition flex items-center gap-2 cursor-pointer"
            >
              <PlusCircle className="w-4 h-4" />
              <span>إرسال تعميم / إشعار داخلي</span>
            </button>

            {unreadCount > 0 && (
              <button
                onClick={onMarkAllAsRead}
                className="bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-bold px-3 py-2.5 rounded-xl transition flex items-center gap-1.5 cursor-pointer"
                title="تحديد الكل كمقروء"
              >
                <CheckCheck className="w-4 h-4 text-emerald-400" />
                <span>قراءة الكل</span>
              </button>
            )}
          </div>
        </div>

        {/* Quick KPI Stat Pills */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3 mt-6 pt-6 border-t border-indigo-900/60">
          <div className="bg-white/5 backdrop-blur-sm p-3 rounded-xl border border-white/10">
            <div className="text-[11px] text-slate-300">كافة الإشعارات</div>
            <div className="text-lg font-black mt-1 text-white">{totalCount}</div>
          </div>
          <div className="bg-rose-500/10 backdrop-blur-sm p-3 rounded-xl border border-rose-500/20">
            <div className="text-[11px] text-rose-300">غير المقروءة</div>
            <div className="text-lg font-black mt-1 text-rose-400">{unreadCount}</div>
          </div>
          <div className="bg-emerald-500/10 backdrop-blur-sm p-3 rounded-xl border border-emerald-500/20">
            <div className="text-[11px] text-emerald-300">الإشعارات المالية</div>
            <div className="text-lg font-black mt-1 text-emerald-400">{financialCount}</div>
          </div>
          <div className="bg-blue-500/10 backdrop-blur-sm p-3 rounded-xl border border-blue-500/20">
            <div className="text-[11px] text-blue-300">المبيعات والعملاء</div>
            <div className="text-lg font-black mt-1 text-blue-400">{salesCount}</div>
          </div>
          <div className="bg-purple-500/10 backdrop-blur-sm p-3 rounded-xl border border-purple-500/20">
            <div className="text-[11px] text-purple-300">المشتريات والتوريد</div>
            <div className="text-lg font-black mt-1 text-purple-400">{procurementCount}</div>
          </div>
          <div className="bg-slate-500/10 backdrop-blur-sm p-3 rounded-xl border border-slate-500/20">
            <div className="text-[11px] text-slate-300">الأرشيف والمحفوظات</div>
            <div className="text-lg font-black mt-1 text-slate-300">{archivedCount}</div>
          </div>
        </div>
      </div>

      {/* Main Inbox Card */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {/* Filter Toolbar */}
        <div className="p-4 border-b border-slate-200 bg-slate-50/70 flex flex-col md:flex-row md:items-center justify-between gap-4">
          {/* Category Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
            {[
              { key: 'ALL', label: 'كافة الأقسام', count: notifications.filter(n => !n.isArchived).length },
              { key: 'FINANCIAL', label: 'المالية والخزينة', count: financialCount },
              { key: 'SALES', label: 'المبيعات', count: salesCount },
              { key: 'PROCUREMENT', label: 'المشتريات', count: procurementCount },
              { key: 'SYSTEM', label: 'النظام والأمان', count: systemCount },
              { key: 'GENERAL', label: 'ملاحظات عامة', count: notifications.filter(n => n.type === 'GENERAL' && !n.isArchived).length },
            ].map(tab => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key as any)}
                className={`px-3 py-1.5 rounded-xl font-bold text-xs shrink-0 transition flex items-center gap-1.5 cursor-pointer ${
                  activeTab === tab.key
                    ? 'bg-slate-900 text-white shadow-sm'
                    : 'bg-white text-slate-600 hover:bg-slate-200/70 border border-slate-200'
                }`}
              >
                <span>{tab.label}</span>
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                  activeTab === tab.key ? 'bg-slate-700 text-slate-200' : 'bg-slate-100 text-slate-500'
                }`}>
                  {tab.count}
                </span>
              </button>
            ))}
          </div>

          {/* Search and State Filters */}
          <div className="flex items-center gap-2">
            <div className="relative flex-1 md:w-64">
              <Search className="w-4 h-4 text-slate-400 absolute right-3 top-2.5" />
              <input
                type="text"
                placeholder="بحث في الإشعارات والرسائل..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full pl-3 pr-9 py-1.5 bg-white border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>

            {/* Read/Unread/Archived Filter */}
            <select
              value={stateFilter}
              onChange={e => setStateFilter(e.target.value as any)}
              className="bg-white border border-slate-200 text-slate-700 text-xs font-bold rounded-xl px-3 py-1.5 focus:ring-2 focus:ring-blue-500 focus:outline-none"
            >
              <option value="ALL">النشطة (الكل)</option>
              <option value="UNREAD">غير المقروءة فقط</option>
              <option value="ARCHIVED">المؤرشفة</option>
            </select>
          </div>
        </div>

        {/* Notifications List */}
        <div className="divide-y divide-slate-100">
          {filteredList.length === 0 ? (
            <div className="p-12 text-center text-slate-400 flex flex-col items-center justify-center gap-3">
              <Inbox className="w-14 h-14 text-slate-300 stroke-[1.5]" />
              <span className="text-base font-bold text-slate-600">لا توجد رسائل أو تنبيهات مطابقة</span>
              <span className="text-xs text-slate-400">كافة الإجراءات والمعاملات تحت المراقبة والتحديث المستمر</span>
            </div>
          ) : (
            filteredList.map(item => (
              <div
                key={item.id}
                className={`p-4 transition hover:bg-slate-50 flex flex-col md:flex-row md:items-start justify-between gap-4 ${
                  !item.isRead ? 'bg-blue-50/40 border-r-4 border-r-blue-600' : ''
                }`}
              >
                <div className="flex items-start gap-3.5 flex-1 min-w-0">
                  {/* Category Icon */}
                  <div className="p-2.5 rounded-xl border shrink-0 bg-slate-100 border-slate-200">
                    {getTypeIcon(item.type)}
                  </div>

                  {/* Body */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <span className={`text-sm font-extrabold ${!item.isRead ? 'text-slate-900' : 'text-slate-700'}`}>
                        {item.title}
                      </span>
                      {getPriorityBadge(item.priority)}
                      <span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded font-medium border border-slate-200">
                        {getTypeLabel(item.type)}
                      </span>
                      {!item.isRead && (
                        <span className="w-2 h-2 rounded-full bg-blue-600"></span>
                      )}
                    </div>

                    <p className="text-xs text-slate-600 leading-relaxed mb-3">
                      {item.message}
                    </p>

                    {/* Sender and Channels Footer */}
                    <div className="flex items-center gap-4 flex-wrap text-xs text-slate-500">
                      <div className="flex items-center gap-1.5">
                        <User className="w-3.5 h-3.5 text-slate-400" />
                        <span className="font-bold text-slate-700">{item.sender.name}</span>
                        <span className="text-slate-400">({item.sender.role})</span>
                      </div>

                      <div className="flex items-center gap-1 text-slate-400">
                        <Clock className="w-3.5 h-3.5" />
                        <span>{new Date(item.timestamp).toLocaleString('ar-YE')}</span>
                      </div>

                      {/* Multi-channel Delivery Indicators */}
                      <div className="flex items-center gap-1.5 text-[10px]">
                        <span className="text-slate-400">القنوات:</span>
                        {item.channels.map(ch => (
                          <span
                            key={ch}
                            className="bg-slate-100 text-slate-600 px-1.5 py-0.2 rounded text-[9px] font-bold border border-slate-200"
                          >
                            {ch === 'IN_APP' ? 'داخل النظام' : ch === 'WHATSAPP' ? 'واتساب' : ch === 'EMAIL' ? 'بريد' : 'تيليجرام'}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Right / Left Action Buttons */}
                <div className="flex items-center gap-2 self-end md:self-center shrink-0">
                  {item.whatsappUrl && (
                    <a
                      href={item.whatsappUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-300 text-xs font-bold px-3 py-1.5 rounded-xl transition flex items-center gap-1.5"
                      title="فتح محادثة الواتساب لإرسال الإشعار الخارجي"
                    >
                      <span>واتساب</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  )}

                  {item.targetModule && (
                    <button
                      onClick={() => {
                        onMarkAsRead(item.id);
                        onNavigateToModule(item.targetModule!, item.targetId);
                      }}
                      className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-black px-3.5 py-1.5 rounded-xl transition flex items-center gap-1.5 shadow-xs cursor-pointer"
                    >
                      <span>{item.actionLabel || 'عرض المستند'}</span>
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                  )}

                  {!item.isRead && (
                    <button
                      onClick={() => onMarkAsRead(item.id)}
                      className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition"
                      title="تحديد كمقروء"
                    >
                      <Check className="w-4 h-4" />
                    </button>
                  )}

                  <button
                    onClick={() => onArchiveNotification(item.id)}
                    className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition"
                    title={item.isArchived ? 'إلغاء الأرشفة' : 'أرشفة الإشعار'}
                  >
                    <Archive className="w-4 h-4" />
                  </button>

                  <button
                    onClick={() => onDeleteNotification(item.id)}
                    className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                    title="حذف الإشعار"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Compose Broadcast / Notification Modal */}
      {isComposeModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-slate-200 overflow-hidden" dir="rtl">
            <div className="bg-slate-900 text-white p-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Send className="w-5 h-5 text-blue-400" />
                <h3 className="font-bold text-sm">إرسال تعميم / إشعار داخلي جديد</h3>
              </div>
              <button
                onClick={() => setIsComposeModalOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateBroadcast} className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">عنوان الإشعار / التعميم *</label>
                <input
                  type="text"
                  required
                  placeholder="مثال: موعد إقفال قيود الشهر أو توجيه مالي"
                  value={newTitle}
                  onChange={e => setNewTitle(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">القسم المستهدف / النوع</label>
                  <select
                    value={newType}
                    onChange={e => setNewType(e.target.value as NotificationType)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  >
                    <option value="GENERAL">عام لكافة الموظفين</option>
                    <option value="FINANCIAL">المالية والحسابات</option>
                    <option value="SALES">المبيعات ونقاط البيع</option>
                    <option value="PROCUREMENT">المشتريات والمخازن</option>
                    <option value="SYSTEM">الأمان وإدارة النظام</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">درجة الأهمية</label>
                  <select
                    value={newPriority}
                    onChange={e => setNewPriority(e.target.value as NotificationPriority)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  >
                    <option value="LOW">عادي (Low)</option>
                    <option value="MEDIUM">متوسط (Medium)</option>
                    <option value="HIGH">هام (High)</option>
                    <option value="URGENT">عاجل جداً (Urgent)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">نص الرسالة / التفاصيل *</label>
                <textarea
                  rows={4}
                  required
                  placeholder="اكتب التوجيه أو التعميم بالتفصيل..."
                  value={newMessage}
                  onChange={e => setNewMessage(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              {/* Multi-channel toggles */}
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-2">
                <div className="text-xs font-bold text-slate-700">قنوات الإرسال المتزامنة:</div>
                <div className="flex items-center gap-4 text-xs">
                  <label className="flex items-center gap-1.5 text-slate-700 font-medium cursor-pointer">
                    <input type="checkbox" checked={true} disabled className="rounded text-blue-600" />
                    <span>داخل النظام (In-App)</span>
                  </label>
                  <label className="flex items-center gap-1.5 text-slate-700 font-medium cursor-pointer">
                    <input
                      type="checkbox"
                      checked={sendWhatsApp}
                      onChange={e => setSendWhatsApp(e.target.checked)}
                      className="rounded text-emerald-600"
                    />
                    <span>واتساب ({ADMIN_WHATSAPP_NUMBER})</span>
                  </label>
                  <label className="flex items-center gap-1.5 text-slate-700 font-medium cursor-pointer">
                    <input
                      type="checkbox"
                      checked={sendTelegram}
                      onChange={e => setSendTelegram(e.target.checked)}
                      className="rounded text-blue-500"
                    />
                    <span>تيليجرام</span>
                  </label>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsComposeModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-black rounded-xl transition shadow-md flex items-center gap-2"
                >
                  <Send className="w-4 h-4" />
                  <span>إرسال التعميم الآن</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
