import React, { useState, useEffect } from 'react';
import { 
  Bell, 
  ShieldAlert, 
  User, 
  Clock, 
  Globe, 
  Laptop, 
  Smartphone, 
  CheckCircle2, 
  XCircle, 
  MessageSquare, 
  X, 
  Search, 
  Filter, 
  Trash2, 
  Download, 
  Share2, 
  ExternalLink,
  ShieldCheck
} from 'lucide-react';
import { LoginAuditLog } from '../types/auth';
import { 
  getLoginAuditLogs, 
  clearLoginAuditLogs, 
  generateAdminWhatsAppNotificationUrl,
  ADMIN_PHONE_NUMBER 
} from '../data/userCredentials';

interface AdminLoginNotificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  latestLoginAlert?: LoginAuditLog | null;
  onDismissAlert?: () => void;
}

export const AdminLoginNotificationModal: React.FC<AdminLoginNotificationModalProps> = ({
  isOpen,
  onClose,
  latestLoginAlert,
  onDismissAlert,
}) => {
  const [logs, setLogs] = useState<LoginAuditLog[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState('ALL');

  useEffect(() => {
    if (isOpen) {
      setLogs(getLoginAuditLogs());
    }
  }, [isOpen]);

  const handleClearLogs = () => {
    if (window.confirm('هل أنت متأكد من رغبتك في مسح سجلات تسجيل الدخول بالكامل؟')) {
      clearLoginAuditLogs();
      setLogs([]);
    }
  };

  const handleExportCsv = () => {
    const headers = ['المعرف', 'المستخدم', 'البريد', 'الدور', 'الوقت', 'IP', 'المتصفح', 'النظام', 'الحالة'];
    const rows = logs.map(l => [
      l.id,
      l.userName,
      l.userEmail,
      l.role,
      new Date(l.timestamp).toLocaleString('ar-YE'),
      l.ip,
      l.browser,
      l.os,
      l.status
    ]);

    const csvContent = "data:text/csv;charset=utf-8,\uFEFF" + [headers.join(','), ...rows.map(r => r.map(c => `"${c}"`).join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `medo_login_audit_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const filteredLogs = logs.filter(l => {
    const matchesSearch = 
      (l.userName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (l.userEmail || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (l.ip || '').includes(searchTerm) ||
      (l.device || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = filterRole === 'ALL' || l.role === filterRole;
    return matchesSearch && matchesRole;
  });

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs" dir="rtl">
      <div className="w-full max-w-4xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="bg-slate-900 text-white p-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-blue-600/30 text-blue-400 flex items-center justify-center border border-blue-500/30">
              <Bell className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-black">سجل إشعارات وأمان تسجيل دخول المستخدمين</h2>
                <span className="text-[10px] bg-rose-500/30 text-rose-300 border border-rose-500/40 px-2 py-0.5 rounded-full font-bold">
                  إشعار فوري ومباشر
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                رصد فوري لكافة جلسات الدخول، العناوين الشبكية (IP)، والأجهزة مع إرسال إشعارات تلقائية عبر واتساب ({ADMIN_PHONE_NUMBER})
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Toolbar & Filters */}
        <div className="p-4 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3 flex-1 min-w-[280px]">
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="البحث باسم المستخدم، البريد، عنوان IP أو نوع الجهاز..."
                className="w-full pr-9 pl-4 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-500"
              />
            </div>

            <select
              value={filterRole}
              onChange={(e) => setFilterRole(e.target.value)}
              className="px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:outline-none focus:border-blue-500"
            >
              <option value="ALL">كافة الأدوار</option>
              <option value="ADMIN">مدير النظام (ADMIN)</option>
              <option value="ACCOUNTANT">محاسب (ACCOUNTANT)</option>
              <option value="CASHIER">كاشير (CASHIER)</option>
              <option value="PROCUREMENT">مشتريات (PROCUREMENT)</option>
              <option value="HR">موارد بشرية (HR)</option>
              <option value="AUDITOR">مدقق (AUDITOR)</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleExportCsv}
              className="px-3 py-2 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-2xs"
            >
              <Download className="w-3.5 h-3.5" />
              <span>تصدير Excel/CSV</span>
            </button>

            <button
              onClick={handleClearLogs}
              className="px-3 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-xl text-xs font-bold transition flex items-center gap-1.5"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>مسح السجل</span>
            </button>
          </div>
        </div>

        {/* Audit Logs List */}
        <div className="flex-1 overflow-y-auto p-4 divide-y divide-slate-100">
          {filteredLogs.length === 0 ? (
            <div className="p-12 text-center text-slate-400">
              <ShieldCheck className="w-12 h-12 text-slate-300 mx-auto mb-2" />
              <p className="text-sm font-bold text-slate-600">لا توجد سجلات دخول مسجلة حالياً</p>
              <p className="text-xs text-slate-400 mt-1">سيتم رصد أي محاولة دخول جديدة وعرضها فورياً هنا مع إشعار الواتساب</p>
            </div>
          ) : (
            filteredLogs.map((log) => {
              const waUrl = generateAdminWhatsAppNotificationUrl(log);
              const isSuccess = log.status === 'SUCCESS';

              return (
                <div key={log.id} className="py-3.5 hover:bg-slate-50/80 px-2 rounded-2xl transition flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${
                      isSuccess ? 'bg-emerald-50 text-emerald-600 border border-emerald-200' : 'bg-rose-50 text-rose-600 border border-rose-200'
                    }`}>
                      {isSuccess ? <CheckCircle2 className="w-5 h-5" /> : <XCircle className="w-5 h-5" />}
                    </div>

                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-black text-slate-900">{log.userName}</span>
                        <span className="text-[11px] font-mono text-slate-500">({log.userEmail})</span>
                        <span className="text-[9px] font-bold bg-blue-50 text-blue-700 border border-blue-200 px-1.5 py-0.5 rounded">
                          {log.role}
                        </span>
                        {log.notes && (
                          <span className="text-[10px] bg-amber-50 text-amber-800 border border-amber-200 px-1.5 py-0.2 rounded font-medium">
                            {log.notes}
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-3 text-[11px] text-slate-500 mt-1 flex-wrap font-medium">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3 text-slate-400" />
                          {new Date(log.timestamp).toLocaleString('ar-YE', { dateStyle: 'medium', timeStyle: 'medium' })}
                        </span>
                        <span className="flex items-center gap-1 font-mono">
                          <Globe className="w-3 h-3 text-slate-400" />
                          IP: <strong className="text-slate-700">{log.ip}</strong>
                        </span>
                        <span className="flex items-center gap-1">
                          <Laptop className="w-3 h-3 text-slate-400" />
                          {log.browser} / {log.os}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-end sm:self-center">
                    <a
                      href={waUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-2xs"
                      title="إرسال تفاصيل الدخول إلى بوت واتساب المدير"
                    >
                      <MessageSquare className="w-3.5 h-3.5 text-emerald-600" />
                      <span>إشعار واتساب</span>
                      <ExternalLink className="w-3 h-3 text-emerald-500" />
                    </a>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer info */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
          <span>إجمالي السجلات المسجلة: <strong>{logs.length}</strong> حركة</span>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition"
          >
            إغلاق النافذة
          </button>
        </div>
      </div>
    </div>
  );
};
