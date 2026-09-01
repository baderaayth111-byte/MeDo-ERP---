import React, { useState, useRef, useEffect } from 'react';
import { 
  Bell, 
  Check, 
  CheckCheck, 
  Trash2, 
  ExternalLink, 
  DollarSign, 
  ShoppingBag, 
  Users, 
  ShieldAlert, 
  MessageSquare, 
  Mail, 
  Send, 
  Clock, 
  Inbox, 
  Sparkles,
  ChevronLeft,
  X,
  AlertCircle
} from 'lucide-react';
import { AppNotification, NotificationType, NotificationPriority } from '../types/workflow';

interface NotificationDropdownProps {
  notifications: AppNotification[];
  onMarkAsRead: (id: string) => void;
  onMarkAllAsRead: () => void;
  onNavigateToModule: (moduleKey: string, targetId?: string) => void;
  onOpenInbox: () => void;
}

export const NotificationDropdown: React.FC<NotificationDropdownProps> = ({
  notifications,
  onMarkAsRead,
  onMarkAllAsRead,
  onNavigateToModule,
  onOpenInbox,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [filterUnreadOnly, setFilterUnreadOnly] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const unreadCount = notifications.filter(n => !n.isRead && !n.isArchived).length;

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const displayList = notifications
    .filter(n => !n.isArchived)
    .filter(n => (!filterUnreadOnly ? true : !n.isRead))
    .slice(0, 10);

  const getTypeIcon = (type: NotificationType) => {
    switch (type) {
      case 'FINANCIAL':
        return <DollarSign className="w-4 h-4 text-emerald-600" />;
      case 'PROCUREMENT':
        return <ShoppingBag className="w-4 h-4 text-purple-600" />;
      case 'SALES':
        return <Users className="w-4 h-4 text-blue-600" />;
      case 'SYSTEM':
        return <ShieldAlert className="w-4 h-4 text-rose-600" />;
      case 'GENERAL':
      default:
        return <MessageSquare className="w-4 h-4 text-amber-600" />;
    }
  };

  const getTypeBg = (type: NotificationType) => {
    switch (type) {
      case 'FINANCIAL': return 'bg-emerald-50 border-emerald-200';
      case 'PROCUREMENT': return 'bg-purple-50 border-purple-200';
      case 'SALES': return 'bg-blue-50 border-blue-200';
      case 'SYSTEM': return 'bg-rose-50 border-rose-200';
      case 'GENERAL': default: return 'bg-amber-50 border-amber-200';
    }
  };

  const getPriorityBadge = (priority: NotificationPriority) => {
    switch (priority) {
      case 'URGENT':
        return <span className="bg-rose-600 text-white text-[9px] font-black px-1.5 py-0.2 rounded-full animate-pulse">عاجل جداً</span>;
      case 'HIGH':
        return <span className="bg-amber-100 text-amber-800 border border-amber-300 text-[9px] font-bold px-1.5 py-0.2 rounded-full">هام</span>;
      default:
        return null;
    }
  };

  const formatTimeAgo = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      const now = new Date();
      const diffSec = Math.floor((now.getTime() - date.getTime()) / 1000);
      if (diffSec < 60) return 'الآن';
      if (diffSec < 3600) return `منذ ${Math.floor(diffSec / 60)} دقيقة`;
      if (diffSec < 86400) return `منذ ${Math.floor(diffSec / 3600)} ساعة`;
      return `منذ ${Math.floor(diffSec / 86400)} يوم`;
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="relative" ref={dropdownRef} dir="rtl">
      {/* Bell Trigger Button with Glowing Red Badge */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`relative p-2 rounded-xl border transition cursor-pointer ${
          isOpen
            ? 'bg-blue-50 text-blue-700 border-blue-300 ring-2 ring-blue-200'
            : 'bg-slate-50 text-slate-700 hover:text-slate-950 hover:bg-slate-100 border-slate-200 shadow-2xs'
        }`}
        title="مركز الإشعارات والتنبيهات والموافقات الداخلية"
        aria-label="مركز الإشعارات"
      >
        <Bell className="w-4 h-4 text-slate-700 hover:text-blue-600 transition" />
        
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] bg-rose-600 text-white text-[10px] font-black rounded-full flex items-center justify-center px-1 border-2 border-white shadow-sm animate-bounce">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* Floating Dropdown Panel */}
      {isOpen && (
        <div className="absolute left-0 sm:left-auto right-auto sm:right-0 mt-2 w-[340px] sm:w-[420px] bg-white rounded-2xl shadow-2xl border border-slate-200 z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-150 text-slate-800">
          {/* Header */}
          <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-3.5 flex items-center justify-between border-b border-indigo-900">
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-blue-600/30 rounded-lg border border-blue-400/40">
                <Bell className="w-4 h-4 text-blue-300" />
              </div>
              <div>
                <div className="text-xs font-black flex items-center gap-1.5">
                  <span>مركز الإشعارات والموافقات</span>
                  {unreadCount > 0 && (
                    <span className="bg-rose-500 text-white text-[10px] font-bold px-1.5 py-0.2 rounded-full">
                      {unreadCount} جديد
                    </span>
                  )}
                </div>
                <div className="text-[10px] text-slate-300">شبكة الاتصالات والتنبيهات المؤسسية</div>
              </div>
            </div>

            <div className="flex items-center gap-1">
              {unreadCount > 0 && (
                <button
                  onClick={onMarkAllAsRead}
                  className="text-[11px] text-amber-300 hover:text-amber-200 hover:underline flex items-center gap-1 px-2 py-1 rounded cursor-pointer"
                  title="تحديد كافة التنبيهات كمقروءة"
                >
                  <CheckCheck className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">قراءة الكل</span>
                </button>
              )}
              <button
                onClick={() => setIsOpen(false)}
                className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Quick Filters */}
          <div className="bg-slate-50 px-3.5 py-2 border-b border-slate-200 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setFilterUnreadOnly(false)}
                className={`px-2.5 py-1 rounded-lg font-bold text-[11px] transition ${
                  !filterUnreadOnly
                    ? 'bg-blue-600 text-white shadow-2xs'
                    : 'text-slate-600 hover:bg-slate-200/70'
                }`}
              >
                الكل ({notifications.filter(n => !n.isArchived).length})
              </button>
              <button
                onClick={() => setFilterUnreadOnly(true)}
                className={`px-2.5 py-1 rounded-lg font-bold text-[11px] transition ${
                  filterUnreadOnly
                    ? 'bg-blue-600 text-white shadow-2xs'
                    : 'text-slate-600 hover:bg-slate-200/70'
                }`}
              >
                غير المقروءة ({unreadCount})
              </button>
            </div>

            <span className="text-[10px] text-slate-600 font-medium">
              آخر 10 إشعارات
            </span>
          </div>

          {/* Notifications Scroll List */}
          <div className="max-h-[380px] overflow-y-auto divide-y divide-slate-100">
            {displayList.length === 0 ? (
              <div className="p-8 text-center text-slate-400 flex flex-col items-center justify-center gap-2">
                <Inbox className="w-10 h-10 text-slate-300 stroke-[1.5]" />
                <span className="text-xs font-bold text-slate-500">لا توجد إشعارات لعرضها حالياً</span>
                <span className="text-[11px] text-slate-400">كافة الإجراءات والموافقات مكتملة</span>
              </div>
            ) : (
              displayList.map(item => (
                <div
                  key={item.id}
                  className={`p-3 transition hover:bg-slate-50 relative group ${
                    !item.isRead ? 'bg-blue-50/40 border-r-4 border-r-blue-600' : ''
                  }`}
                >
                  <div className="flex items-start gap-2.5">
                    {/* Icon */}
                    <div className={`p-2 rounded-xl border shrink-0 ${getTypeBg(item.type)}`}>
                      {getTypeIcon(item.type)}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1 mb-1">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className={`text-xs font-extrabold truncate ${!item.isRead ? 'text-slate-950' : 'text-slate-700'}`}>
                            {item.title}
                          </span>
                          {getPriorityBadge(item.priority)}
                        </div>
                        <span className="text-[10px] text-slate-600 shrink-0 flex items-center gap-1">
                          <Clock className="w-2.5 h-2.5 text-slate-500" />
                          {formatTimeAgo(item.timestamp)}
                        </span>
                      </div>

                      <p className="text-[11px] text-slate-600 leading-relaxed mb-2 line-clamp-2">
                        {item.message}
                      </p>

                      {/* Sender Info & Multi-channel badges */}
                      <div className="flex items-center justify-between gap-2 pt-1 border-t border-slate-100/80 text-[10px]">
                        <div className="text-slate-500 flex items-center gap-1 truncate">
                          <span className="font-bold text-slate-700">{item.sender.name}</span>
                          <span className="text-slate-400">({item.sender.role})</span>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex items-center gap-1.5 shrink-0">
                          {item.whatsappUrl && (
                            <a
                              href={item.whatsappUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="text-[10px] text-emerald-600 hover:text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200 font-bold flex items-center gap-0.5"
                              title="إرسال إشعار خارجي عبر الواتساب"
                            >
                              <span>واتساب</span>
                              <ExternalLink className="w-2.5 h-2.5" />
                            </a>
                          )}

                          {item.targetModule && (
                            <button
                              onClick={() => {
                                onMarkAsRead(item.id);
                                setIsOpen(false);
                                onNavigateToModule(item.targetModule!, item.targetId);
                              }}
                              className="text-[10px] bg-blue-600 hover:bg-blue-700 text-white font-bold px-2 py-0.5 rounded transition flex items-center gap-1 cursor-pointer"
                            >
                              <span>{item.actionLabel || 'عرض'}</span>
                              <ChevronLeft className="w-3 h-3" />
                            </button>
                          )}

                          {!item.isRead && (
                            <button
                              onClick={() => onMarkAsRead(item.id)}
                              className="p-1 text-slate-400 hover:text-blue-600 rounded transition"
                              title="تحديد كمقروء"
                            >
                              <Check className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer - Full Inbox Link */}
          <div className="p-2.5 bg-slate-50 border-t border-slate-200 text-center">
            <button
              onClick={() => {
                setIsOpen(false);
                onOpenInbox();
              }}
              className="w-full py-2 px-3 bg-white hover:bg-slate-100 border border-slate-300 rounded-xl text-xs font-black text-slate-800 transition flex items-center justify-center gap-2 shadow-2xs cursor-pointer"
            >
              <Inbox className="w-4 h-4 text-blue-600" />
              <span>فتح صندوق الوارد الداخلي الشامل (Internal Inbox)</span>
              <ChevronLeft className="w-4 h-4 text-slate-400" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
