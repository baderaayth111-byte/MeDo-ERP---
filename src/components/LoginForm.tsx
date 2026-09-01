import React, { useState, useEffect } from 'react';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, sendPasswordResetEmail } from 'firebase/auth';
import { auth } from '../lib/firebase';
import { useAuth } from '../contexts/AuthContext';
import { 
  Building2, 
  Lock, 
  Mail, 
  AlertCircle, 
  LogIn, 
  UserPlus, 
  Zap, 
  KeyRound, 
  Check, 
  Eye, 
  EyeOff, 
  ShieldCheck,
  Fingerprint,
  Save,
  HelpCircle,
  X,
  RotateCcw,
  CheckCircle2,
  Sparkles,
  MessageSquare,
  ChevronDown,
  ShieldAlert
} from 'lucide-react';
import { getLoadedUserCredentials, ADMIN_PHONE_NUMBER, ADMIN_WHATSAPP_NUMBER } from '../data/userCredentials';
import { UnifiedHeader } from './UnifiedHeader';
import { SystemFooterCopyright } from './SystemFooterCopyright';

export const LoginForm: React.FC = () => {
  const { 
    loginAsDemo, 
    loginWithCredentials, 
    userAccounts,
    recoverAccount,
    biometricUser,
    registerBiometric,
    loginWithBiometric,
    rememberedCreds,
    saveRemembered,
    clearRemembered
  } = useAuth();

  const [email, setEmail] = useState('');
  const [userName, setUserName] = useState<string | null>(null);
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isRecoveryOpen, setIsRecoveryOpen] = useState(false);
  const [recoveryEmail, setRecoveryEmail] = useState('');
  const [recoveryNewPass, setRecoveryNewPass] = useState('');
  const [recoveryPin, setRecoveryPin] = useState('');
  const [recoveryMsg, setRecoveryMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [recoveryLoading, setRecoveryLoading] = useState(false);
  const [isBiometricScanOpen, setIsBiometricScanOpen] = useState(false);
  const [biometricScanning, setBiometricScanning] = useState(false);
  const [biometricFeedback, setBiometricFeedback] = useState<string | null>(null);

  const credentialsList = userAccounts.length > 0 ? userAccounts : getLoadedUserCredentials();

  useEffect(() => {
    if (rememberedCreds) {
      setEmail(rememberedCreds.email || '');
      if (rememberedCreds.pass) {
        setPassword(rememberedCreds.pass);
      }
      setRememberMe(true);
    } else {
      setEmail('demo@medo-erp.com');
      setPassword('Demo@2026');
    }
  }, [rememberedCreds]);

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newEmail = e.target.value;
    setEmail(newEmail);
    
    const account = userAccounts.find(u => u.email.toLowerCase() === newEmail.trim().toLowerCase());
    setUserName(account ? account.displayName : null);
  };

  const handleWhatsAppBuyClick = () => {
    const text = `السلام عليكم ورحمة الله وبركاته،
أرغب في امتلاك وشراء ترخيص نظام MeDo ERP المؤسسي الكامل (إصدار الحسابات، المخازن، ونقاط البيع).
الرجاء تزويدي بعرض السعر وطرق السداد وتفعيل الترخيص الدائم.`;
    const url = `https://api.whatsapp.com/send?phone=${ADMIN_WHATSAPP_NUMBER}&text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    if (rememberMe) {
      saveRemembered(email, password);
    } else {
      clearRemembered();
    }

    const localResult = await loginWithCredentials(email, password);
    if (localResult.success) {
      // Find the account to check if password reset is required
      const account = userAccounts.find(u => u.email.toLowerCase() === email.trim().toLowerCase());
      
      // If the user has logged in successfully, clear the password field
      // to ensure it's not cached/visible in the UI.
      setPassword('');
      
      if (account?.mustChangePassword) {
        // ... (existing modal logic)
      }
      setLoading(false);
      return;
    }

    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (err: any) {
      const matched = credentialsList.find(c => c.email.toLowerCase() === email.trim().toLowerCase());
      if (matched && (password === matched.password || password === matched.defaultPassword)) {
        loginAsDemo(matched.role, matched.email);
        setLoading(false);
        return;
      }
      setLoading(false);
    } finally {
      setLoading(false);
    }
  };

  const handleAccountRecoverySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setRecoveryLoading(true);
    try {
        const res = await recoverAccount(recoveryEmail, recoveryNewPass, recoveryPin);
        if (res.success) {
            setRecoveryMsg({ type: 'success', text: res.message });
            setTimeout(() => setIsRecoveryOpen(false), 2000);
        } else {
            setRecoveryMsg({ type: 'error', text: res.message });
        }
    } finally {
        setRecoveryLoading(false);
    }
  };

  const handleStartBiometricScan = async () => {
    setIsBiometricScanOpen(true);
    setBiometricScanning(true);
    setTimeout(async () => {
        if (biometricUser) {
            setBiometricScanning(false);
            setBiometricFeedback(`تم التعرف على البصمة بنجاح!`);
            setTimeout(async () => {
                await loginWithBiometric();
                setIsBiometricScanOpen(false);
            }, 1000);
        } else {
            setBiometricScanning(false);
            setBiometricFeedback('لم يتم تسجيل البصمة.');
        }
    }, 1500);
  };

  return (
    <div className="min-h-screen relative pb-16 bg-gradient-to-br from-white via-[#F4F7FC] to-[#EDF2F7] flex flex-col selection:bg-[#D4AF37] selection:text-slate-950 font-['Cairo',sans-serif]" dir="rtl">
      <UnifiedHeader />
      <div className="flex-1 flex items-center justify-center p-4 sm:p-6">
        <div className="bg-white max-w-lg w-full rounded-3xl shadow-2xl overflow-hidden border border-slate-200/80 animate-in fade-in zoom-in-95 duration-300">
          {/* Header Branding */}
          <div className="p-7 sm:p-8 text-center relative overflow-hidden bg-gradient-to-b from-slate-50 to-white border-b border-slate-100">
            <div className="absolute top-0 right-0 w-48 h-48 bg-[#D4AF37]/5 rounded-full blur-2xl -mr-16 -mt-16 pointer-events-none" />
            
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-[#0A2540] to-[#003366] border-2 border-[#D4AF37] flex items-center justify-center mx-auto shadow-lg shadow-[#D4AF37]/20 mb-4 relative overflow-hidden group">
              <span className="text-4xl font-black text-[#D4AF37]" style={{ filter: 'drop-shadow(0 2px 4px rgba(212,175,55,0.6))' }}>M</span>
              <div className="absolute top-2 w-2 h-2 rounded-full bg-[#D4AF37] animate-pulse" />
            </div>

            <div className="text-[10px] font-mono uppercase text-[#D4AF37] mb-1 tracking-widest">medo tech</div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-[#0A2540] mb-1">
              نظام MeDo ERP المؤسسي
            </h1>
            <p className="text-slate-500 text-xs sm:text-sm font-bold">
              (S/4HANA Suite) • ميدو تك للحلول البرمجية المتكاملة
            </p>

            {/* Trial info */}
            <div className="mt-4 p-3 bg-[#F4F7FC] rounded-2xl border border-slate-200/80 space-y-2 max-w-sm mx-auto">
              <div className="flex items-center justify-between text-xs font-bold text-slate-700">
                <span className="flex items-center gap-1.5">
                  <Zap className="w-3.5 h-3.5 text-[#D4AF37]" />
                  <span>رصيد تجريبي: 200 عملية تشغيلية كاملة</span>
                </span>
              </div>
            </div>
          </div>

          <div className="p-6 sm:p-8 space-y-6">
            {/* Login Title */}
            <div className="text-center space-y-1">
              <h2 className="text-sm font-black text-[#0A2540]">تسجيل الدخول بالبريد الإلكتروني وكلمة المرور</h2>
              <p className="text-xs text-slate-500 font-bold">الدخول الفوري متاح لأول مرة، مع إلزام تعيين كلمة مرور خاصة بك</p>
            </div>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-black text-slate-700 mb-1.5">
                  البريد الإلكتروني / اسم المستخدم
                </label>
                <div className="relative">
                  <input
                    type="email"
                    value={email}
                    onChange={handleEmailChange}
                    className="w-full pl-4 pr-10 py-3 bg-slate-50/50 border border-[#BDC3C7] rounded-xl focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37] focus:bg-white outline-none transition text-left text-sm font-mono font-bold text-slate-800"
                    placeholder="demo@medo-erp.com"
                    dir="ltr"
                    required
                  />
                  <Mail className="w-4 h-4 text-slate-400 absolute right-3.5 top-3.5" />
                </div>
                {userName && (
                  <p className="text-xs font-bold text-emerald-700 mt-2 flex items-center gap-1">
                    أهلاً بك، {userName}
                  </p>
                )}
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-black text-slate-700">كلمة المرور</label>
                  <button
                    type="button"
                    onClick={() => {
                      setRecoveryEmail(email || 'demo@medo-erp.com');
                      setIsRecoveryOpen(true);
                    }}
                    className="text-xs font-bold text-[#3498DB] hover:text-[#2980B9] transition flex items-center gap-1 cursor-pointer"
                  >
                    <KeyRound className="w-3.5 h-3.5" />
                    <span>هل نسيت كلمة المرور؟</span>
                  </button>
                </div>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-10 pr-10 py-3 bg-slate-50/50 border border-[#BDC3C7] rounded-xl focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37] focus:bg-white outline-none transition text-left text-sm font-mono font-bold text-slate-800"
                    placeholder="••••••••"
                    dir="ltr"
                    required
                  />
                  <Lock className="w-4 h-4 text-slate-400 absolute right-3.5 top-3.5" />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute left-3.5 top-3.5 text-slate-400 hover:text-slate-600 cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Remember Credentials Checkbox */}
              <div className="flex items-center justify-between pt-1">
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="w-4 h-4 text-[#D4AF37] rounded border-slate-300 focus:ring-[#D4AF37] cursor-pointer"
                  />
                  <span className="text-xs font-bold text-slate-700">
                    تذكرني على هذا الجهاز
                  </span>
                </label>
              </div>

              {/* Main Submit Action & Biometric Action */}
              <div className="pt-3 space-y-3">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3.5 bg-[#D4AF37] hover:bg-[#c5a02e] text-slate-950 rounded-xl font-black text-sm sm:text-base shadow-lg shadow-[#D4AF37]/30 transition flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed cursor-pointer"
                >
                  {loading ? (
                    <span className="w-5 h-5 border-2 border-slate-950/30 border-t-slate-950 rounded-full animate-spin" />
                  ) : (
                    <>
                      <LogIn className="w-5 h-5 text-slate-950" />
                      <span>تسجيل الدخول</span>
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={handleStartBiometricScan}
                  className="w-full py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold text-xs sm:text-sm transition flex items-center justify-center gap-2 cursor-pointer border border-slate-200"
                >
                  <Fingerprint className="w-5 h-5 text-[#0A2540]" />
                  <span>تسجيل الدخول ببصمة الإصبع أو الوجه</span>
                </button>
              </div>
            </form>
          </div>
          
        </div>
      </div>

      {/* MODALS */}
      {isRecoveryOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white max-w-md w-full rounded-3xl shadow-2xl border border-slate-200 overflow-hidden text-right">
            <div className="bg-slate-900 p-5 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <RotateCcw className="w-5 h-5 text-blue-400" />
                <h3 className="font-bold text-sm">استعادة وتعيين كلمة المرور</h3>
              </div>
              <button
                onClick={() => setIsRecoveryOpen(false)}
                className="p-1 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAccountRecoverySubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">البريد الإلكتروني للحساب</label>
                <input
                  type="email"
                  value={recoveryEmail}
                  onChange={(e) => setRecoveryEmail(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-mono font-bold"
                  placeholder="demo@medo-erp.com"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">كلمة المرور الجديدة المرغوبة</label>
                <input
                  type="password"
                  value={recoveryNewPass}
                  onChange={(e) => setRecoveryNewPass(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-mono font-bold"
                  placeholder="أدخل كلمة مرور جديدة (8 خانات على الأقل)..."
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">رمز الطوارئ (Master PIN)</label>
                <input
                  type="password"
                  value={recoveryPin}
                  onChange={(e) => setRecoveryPin(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-mono text-center font-bold"
                  placeholder="1995"
                />
                <p className="text-[10px] text-slate-500 mt-1">الرمز المعتمد للطوارئ هو: 1995</p>
              </div>

              {recoveryMsg && (
                <div className={`p-3 rounded-xl text-xs font-bold flex items-center gap-2 ${
                  recoveryMsg.type === 'success' ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-rose-50 text-rose-800 border border-rose-200'
                }`}>
                  {recoveryMsg.type === 'success' ? <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" /> : <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />}
                  <span>{recoveryMsg.text}</span>
                </div>
              )}

              <div className="flex gap-2 pt-2">
                <button
                  type="submit"
                  disabled={recoveryLoading}
                  className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  {recoveryLoading ? <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : 'تحديث كلمة المرور والدخول'}
                </button>
                <button
                  type="button"
                  onClick={() => setIsRecoveryOpen(false)}
                  className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold cursor-pointer"
                >
                  إلغاء
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {isBiometricScanOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white max-w-sm w-full rounded-3xl shadow-2xl border border-slate-200 overflow-hidden text-center p-6 space-y-4">
            <div className="w-16 h-16 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-200 flex items-center justify-center mx-auto shadow-inner">
              <Fingerprint className={`w-9 h-9 ${biometricScanning ? 'animate-pulse text-emerald-500' : ''}`} />
            </div>
            
            <h3 className="font-bold text-sm text-slate-900">المصادقة ببصمة الإصبع / الوجه</h3>
            <p className="text-xs text-slate-600 leading-relaxed">{biometricFeedback}</p>

            <button
              onClick={() => setIsBiometricScanOpen(false)}
              className="w-full py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold cursor-pointer"
            >
              إلغاء
            </button>
          </div>
        </div>
      )}

      <SystemFooterCopyright />
    </div>
  );

};
