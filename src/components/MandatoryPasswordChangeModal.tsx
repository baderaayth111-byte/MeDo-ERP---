import React, { useState } from 'react';
import { 
  Lock, 
  ShieldAlert, 
  CheckCircle2, 
  XCircle, 
  Eye, 
  EyeOff, 
  KeyRound, 
  Sparkles, 
  ShieldCheck,
  AlertTriangle,
  MessageSquare
} from 'lucide-react';
import { validatePasswordPolicy } from '../utils/cryptoSecurity';
import { ADMIN_PHONE_NUMBER, ADMIN_WHATSAPP_NUMBER } from '../data/userCredentials';

interface MandatoryPasswordChangeModalProps {
  userEmail: string;
  userDisplayName: string;
  onPasswordChanged: (newPassword: string) => Promise<{ success: boolean; message: string }>;
  onLogout: () => void;
}

export const MandatoryPasswordChangeModal: React.FC<MandatoryPasswordChangeModalProps> = ({
  userEmail,
  userDisplayName,
  onPasswordChanged,
  onLogout,
}) => {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const policy = validatePasswordPolicy(newPassword);
  const isMatch = newPassword && confirmPassword && newPassword === confirmPassword;

  const handleWhatsAppInquiry = () => {
    const text = `السلام عليكم ورحمة الله،
أنا المستخدم (${userDisplayName} - ${userEmail}) في النسخة التجريبية لنظام MeDo ERP.
أرغب بالاستفسار عن امتلاك النظام المؤسسي الكامل وتفعيل الترخيص الدائم.`;
    window.open(`https://api.whatsapp.com/send?phone=${ADMIN_WHATSAPP_NUMBER}&text=${encodeURIComponent(text)}`, '_blank');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (!policy.isValid) {
      setErrorMessage(policy.errorsAr[0] || 'يرجى استيفاء جميع معايير كلمة المرور القوية أدناه');
      return;
    }

    if (!isMatch) {
      setErrorMessage('كلمتا المرور غير متطابقتين، يرجى التأكد وإعادة الإدخال');
      return;
    }

    setLoading(true);
    try {
      const res = await onPasswordChanged(newPassword);
      if (res.success) {
        setSuccessMessage('تم تحديث وتشفير كلمة المرور بنجاح! جارِ الدخول إلى مساحة العمل...');
      } else {
        setErrorMessage(res.message || 'حدث خطأ أثناء تعيين كلمة المرور الجديدة');
      }
    } catch (err: any) {
      setErrorMessage(err?.message || 'حدث خطأ في النظام');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md" dir="rtl">
      <div className="w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="bg-gradient-to-r from-amber-600 via-rose-600 to-rose-700 p-6 text-white text-right">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center shrink-0 border border-white/30">
              <ShieldAlert className="w-7 h-7 text-amber-200 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-extrabold uppercase tracking-wider bg-white/20 px-2.5 py-0.5 rounded-full">
                  إجراء أمني إلزامي (Security Enforcement)
                </span>
              </div>
              <h2 className="text-xl font-black mt-1">تحديث وتشفير كلمة المرور</h2>
              <p className="text-xs text-rose-100 mt-0.5">
                مرحباً <span className="font-bold text-white">{userDisplayName}</span> ({userEmail})
              </p>
            </div>
          </div>
        </div>

        {/* Body Notice */}
        <div className="p-6 space-y-5">
          <div className="p-3.5 bg-amber-50 rounded-2xl border border-amber-200 flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
            <div className="text-xs text-amber-900 leading-relaxed font-medium">
              وفقاً لسياسة الأمان والحوكمة المعتمدة في نظام MeDo ERP، تم تسفير كلمة المرور المؤقتة لحسابك. يجب عليك تعيين كلمة مرور قوية ومشفرة (Salted SHA-256) قبل متابعة العمل.
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* New Password Field */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                كلمة المرور الجديدة المعتمدة:
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 right-0 pr-3.5 flex items-center pointer-events-none text-slate-400">
                  <KeyRound className="w-4 h-4" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="أدخل كلمة مرور قوية جديدة..."
                  className="w-full pr-10 pl-11 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-900 focus:bg-white focus:border-rose-500 focus:ring-3 focus:ring-rose-100 transition outline-none"
                  autoFocus
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400 hover:text-slate-700"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>

              {/* Password Strength Meter */}
              {newPassword.length > 0 && (
                <div className="mt-2 space-y-1">
                  <div className="flex items-center justify-between text-[11px] font-bold">
                    <span className="text-slate-600">قوة كلمة المرور:</span>
                    <span className={
                      policy.score >= 80 ? 'text-emerald-600' :
                      policy.score >= 60 ? 'text-blue-600' :
                      policy.score >= 40 ? 'text-amber-600' : 'text-rose-600'
                    }>
                      {policy.score >= 80 ? 'قوية جداً ومحمية (100%)' :
                       policy.score >= 60 ? 'جيدة' :
                       policy.score >= 40 ? 'متوسطة' : 'ضعيفة'}
                    </span>
                  </div>
                  <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full transition-all duration-300 ${
                        policy.score >= 80 ? 'bg-emerald-500' :
                        policy.score >= 60 ? 'bg-blue-500' :
                        policy.score >= 40 ? 'bg-amber-500' : 'bg-rose-500'
                      }`}
                      style={{ width: `${policy.score}%` }}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Confirm Password Field */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                تأكيد كلمة المرور الجديدة:
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 right-0 pr-3.5 flex items-center pointer-events-none text-slate-400">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="أعد كتابة كلمة المرور للتطابق..."
                  className="w-full pr-10 pl-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-900 focus:bg-white focus:border-rose-500 focus:ring-3 focus:ring-rose-100 transition outline-none"
                />
              </div>
              {confirmPassword && !isMatch && (
                <p className="text-[11px] text-rose-600 font-bold mt-1">كلمتا المرور غير متطابقتين</p>
              )}
            </div>

            {/* Strict Policy Checklist */}
            <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
              <div className="text-[11px] font-black text-slate-700 mb-1">
                معايير الأمان الإلزامية لكلمة المرور:
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
                <div className={`flex items-center gap-1.5 ${policy.criteria.minLength ? 'text-emerald-700 font-bold' : 'text-slate-500'}`}>
                  {policy.criteria.minLength ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" /> : <XCircle className="w-3.5 h-3.5 text-slate-300 shrink-0" />}
                  <span>8 خانات على الأقل</span>
                </div>
                <div className={`flex items-center gap-1.5 ${policy.criteria.hasUppercase ? 'text-emerald-700 font-bold' : 'text-slate-500'}`}>
                  {policy.criteria.hasUppercase ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" /> : <XCircle className="w-3.5 h-3.5 text-slate-300 shrink-0" />}
                  <span>حرف كبير إنجليزي (A-Z)</span>
                </div>
                <div className={`flex items-center gap-1.5 ${policy.criteria.hasLowercase ? 'text-emerald-700 font-bold' : 'text-slate-500'}`}>
                  {policy.criteria.hasLowercase ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" /> : <XCircle className="w-3.5 h-3.5 text-slate-300 shrink-0" />}
                  <span>حرف صغير إنجليزي (a-z)</span>
                </div>
                <div className={`flex items-center gap-1.5 ${policy.criteria.hasNumber ? 'text-emerald-700 font-bold' : 'text-slate-500'}`}>
                  {policy.criteria.hasNumber ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" /> : <XCircle className="w-3.5 h-3.5 text-slate-300 shrink-0" />}
                  <span>رقم واحد على الأقل (0-9)</span>
                </div>
                <div className={`flex items-center gap-1.5 sm:col-span-2 ${policy.criteria.hasSpecialChar ? 'text-emerald-700 font-bold' : 'text-slate-500'}`}>
                  {policy.criteria.hasSpecialChar ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" /> : <XCircle className="w-3.5 h-3.5 text-slate-300 shrink-0" />}
                  <span>رمز خاص مثل (! @ # $ % ^ & *)</span>
                </div>
              </div>
            </div>

            {/* Error / Success Feedback */}
            {errorMessage && (
              <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs font-bold flex items-center gap-2">
                <XCircle className="w-4 h-4 shrink-0 text-rose-600" />
                <span>{errorMessage}</span>
              </div>
            )}

            {successMessage && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-bold flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
                <span>{successMessage}</span>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex items-center gap-3 pt-2">
              <button
                type="submit"
                disabled={loading || !policy.isValid || !isMatch}
                className="flex-1 py-3 px-4 bg-gradient-to-r from-rose-600 to-amber-600 hover:from-rose-700 hover:to-amber-700 text-white rounded-2xl text-sm font-black transition shadow-lg shadow-rose-600/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 cursor-pointer"
              >
                <ShieldCheck className="w-4 h-4" />
                <span>{loading ? 'جارِ تشفير وحفظ كلمة المرور...' : 'حفظ وتفعيل كلمة المرور والدخول'}</span>
              </button>
              
              <button
                type="button"
                onClick={onLogout}
                className="py-3 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-2xl text-xs font-bold transition cursor-pointer"
                title="تسجيل الخروج والعودة لشاشة الدخول"
              >
                تسجيل خروج
              </button>
            </div>

            {/* Direct WhatsApp Contact CTA */}
            <div className="pt-2 text-center border-t border-slate-100">
              <button
                type="button"
                onClick={handleWhatsAppInquiry}
                className="inline-flex items-center gap-1.5 text-xs font-black text-emerald-700 hover:text-emerald-800 bg-emerald-50 hover:bg-emerald-100 px-4 py-2 rounded-xl border border-emerald-200 transition cursor-pointer"
              >
                <MessageSquare className="w-4 h-4 text-emerald-600" />
                <span>امتلك النظام الآن - تواصل واتساب مع الإدارة ({ADMIN_PHONE_NUMBER})</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
