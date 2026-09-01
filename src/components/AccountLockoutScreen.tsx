import React, { useState } from 'react';
import { 
  Lock, 
  ShieldAlert, 
  PhoneCall, 
  MessageSquare, 
  RotateCcw, 
  LogOut, 
  KeyRound, 
  CheckCircle2, 
  XCircle,
  AlertOctagon,
  Clock,
  User,
  ShieldCheck,
  Zap
} from 'lucide-react';
import { ADMIN_PHONE_NUMBER, ADMIN_WHATSAPP_NUMBER, MASTER_RECOVERY_PIN } from '../data/userCredentials';

interface AccountLockoutScreenProps {
  userName: string;
  userEmail: string;
  userRole: string;
  transactionCount: number;
  maxTransactions: number;
  onAdminUnlock: (masterPinOrPassword: string) => boolean;
  onLogout: () => void;
}

export const AccountLockoutScreen: React.FC<AccountLockoutScreenProps> = ({
  userName,
  userEmail,
  userRole,
  transactionCount,
  maxTransactions,
  onAdminUnlock,
  onLogout,
}) => {
  const [showAdminUnlockBox, setShowAdminUnlockBox] = useState(false);
  const [adminPin, setAdminPin] = useState('');
  const [unlockError, setUnlockError] = useState('');
  const [unlockSuccess, setUnlockSuccess] = useState(false);

  const handleWhatsAppContact = () => {
    const message = `السلام عليكم ورحمة الله وبركاته،
طلب امتلاك وترخيص نظام MeDo ERP (استنفاد رصيد العمليات التجريبية):
المستخدم: ${userName}
البريد الإلكتروني: ${userEmail}
الدور الوظيفي: ${userRole}
العمليات المنجزة: ${transactionCount} من أصل ${maxTransactions} عملية تجريبية.
أرغب في شراء وامتلاك ترخيص النظام المؤسسي الكامل وتفعيل الحساب بشكل دائم.`;

    const url = `https://api.whatsapp.com/send?phone=${ADMIN_WHATSAPP_NUMBER}&text=${encodeURIComponent(message)}`;
    window.open(url, '_blank');
  };

  const handleAdminOverrideSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setUnlockError('');

    if (!adminPin) {
      setUnlockError('يرجى إدخال رمز الأمان أو كلمة مرور مدير النظام');
      return;
    }

    const success = onAdminUnlock(adminPin);
    if (success) {
      setUnlockSuccess(true);
    } else {
      setUnlockError('رمز فك القفل غير صحيح. (رمز الطوارئ المعتمد: 1995 أو كلمة مرور الأدمن)');
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4 selection:bg-rose-500 selection:text-white" dir="rtl">
      {/* Background radial glowing effects */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-rose-600/20 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-amber-600/15 rounded-full blur-3xl" />
      </div>

      <div className="relative w-full max-w-xl bg-slate-900/90 backdrop-blur-xl border-2 border-rose-600/40 rounded-3xl shadow-2xl overflow-hidden text-right text-slate-100">
        
        {/* Top Warning Stripe */}
        <div className="bg-gradient-to-r from-rose-700 via-rose-600 to-amber-600 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <AlertOctagon className="w-6 h-6 text-amber-200 animate-pulse" />
            <span className="text-xs font-black tracking-wider uppercase text-white">
              نظام الحماية والرقابة التشغيلية (MeDo ERP Security Lock)
            </span>
          </div>
          <span className="text-[10px] font-mono bg-black/30 text-rose-100 px-2 py-0.5 rounded-full font-bold">
            T-CODE: SEC_LOCK_200
          </span>
        </div>

        {/* Lockout Main Hero */}
        <div className="p-8 space-y-6">
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5">
            <div className="w-20 h-20 rounded-3xl bg-rose-950/80 border-2 border-rose-500/50 flex items-center justify-center text-rose-400 shrink-0 shadow-lg shadow-rose-900/50">
              <Lock className="w-10 h-10 animate-bounce" />
            </div>
            
            <div className="flex-1 text-center sm:text-right">
              <span className="inline-block px-3 py-1 bg-rose-500/20 text-rose-300 border border-rose-500/40 rounded-full text-xs font-black mb-2">
                🔴 تم استنفاد العمليات التجريبية (200 عملية)
              </span>
              <h1 className="text-xl sm:text-2xl font-black text-white leading-tight">
                تم بلوغ الحد الأقصى للعمليات التجريبية المسموحة
              </h1>
              <p className="text-xs text-slate-400 mt-1">
                المستخدم: <strong className="text-slate-200">{userName}</strong> ({userEmail})
              </p>
            </div>
          </div>

          {/* User & Quota Card */}
          <div className="grid grid-cols-2 gap-3 p-4 bg-slate-950/60 rounded-2xl border border-slate-800 text-xs">
            <div>
              <span className="text-slate-400 block text-[11px]">الرصيد التشغيلي المستنفذ:</span>
              <span className="text-lg font-black text-rose-400 font-mono">
                {transactionCount} / {maxTransactions} عملية
              </span>
            </div>
            <div>
              <span className="text-slate-400 block text-[11px]">حالة القفل التلقائي:</span>
              <span className="text-xs font-bold text-amber-300 flex items-center gap-1.5 mt-1">
                <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
                تم إقفال النظام بعد استكمال 200 عملية
              </span>
            </div>
          </div>

          {/* Exact Required Lockout Notice Text */}
          <div className="p-5 bg-rose-950/40 border border-rose-700/60 rounded-2xl text-xs sm:text-sm text-rose-200 leading-relaxed font-semibold">
            "لقد استنفدت رصيد الـ 200 عملية التجريبية الممنوحة لك في نظام MeDo ERP. تم إقفال النظام بنجاح، يُرجى التواصل مع الإدارة عبر الواتساب لامتلاك النظام وتفعيل الترخيص الدائم غير المحدود."
          </div>

          {/* Action Buttons */}
          <div className="space-y-3">
            <button
              onClick={handleWhatsAppContact}
              className="w-full py-4 px-4 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-2xl font-black text-sm transition shadow-lg shadow-emerald-900/40 flex items-center justify-center gap-2 cursor-pointer border border-emerald-400/30 animate-pulse"
            >
              <MessageSquare className="w-5 h-5 text-emerald-100" />
              <span>امتلك النظام الآن - تواصل مع الإدارة عبر واتساب ({ADMIN_PHONE_NUMBER})</span>
            </button>

            <div className="flex flex-col sm:flex-row items-center gap-3">
              <button
                type="button"
                onClick={() => setShowAdminUnlockBox(!showAdminUnlockBox)}
                className="w-full sm:flex-1 py-3 px-4 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-2xl text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer"
              >
                <KeyRound className="w-4 h-4 text-amber-400" />
                <span>{showAdminUnlockBox ? 'إخفاء خيار المدير' : 'فك القفل المباشر بواسطة المشرف (Admin Override)'}</span>
              </button>

              <button
                type="button"
                onClick={onLogout}
                className="w-full sm:w-auto py-3 px-5 bg-slate-800 hover:bg-rose-950 hover:text-rose-300 text-slate-300 border border-slate-700 hover:border-rose-800 rounded-2xl text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer"
              >
                <LogOut className="w-4 h-4" />
                <span>تسجيل خروج</span>
              </button>
            </div>
          </div>

          {/* Admin Override PIN Input Box */}
          {showAdminUnlockBox && (
            <div className="p-4 bg-slate-950 border border-amber-500/30 rounded-2xl space-y-3 animate-in fade-in zoom-in-95 duration-150">
              <div className="flex items-center gap-2 text-amber-400 text-xs font-bold">
                <ShieldCheck className="w-4 h-4" />
                <span>إلغاء القفل وتصفير عداد العمليات (يتطلب صلاحية الإدارة):</span>
              </div>
              <form onSubmit={handleAdminOverrideSubmit} className="flex gap-2">
                <input
                  type="password"
                  value={adminPin}
                  onChange={(e) => setAdminPin(e.target.value)}
                  placeholder="أدخل رمز الطوارئ (1995) أو كلمة مرور الأدمن..."
                  className="flex-1 px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
                  autoFocus
                />
                <button
                  type="submit"
                  className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black rounded-xl text-xs transition cursor-pointer"
                >
                  فتح الحساب الآن
                </button>
              </form>

              {unlockError && (
                <p className="text-[11px] text-rose-400 font-bold flex items-center gap-1">
                  <XCircle className="w-3.5 h-3.5" />
                  {unlockError}
                </p>
              )}

              {unlockSuccess && (
                <p className="text-[11px] text-emerald-400 font-bold flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  تم فك القفل وتجديد رصيد العمليات بنجاح!
                </p>
              )}
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-slate-950/90 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-500">
          <span>MeDo ERP Cloud Platform &copy; 2026</span>
          <span>Security Policy: Active ISO/IEC 27001</span>
        </div>
      </div>
    </div>
  );
};
