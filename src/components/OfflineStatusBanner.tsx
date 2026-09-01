import React, { useState } from 'react';
import {
  Wifi,
  WifiOff,
  RefreshCw,
  Download,
  Smartphone,
  CheckCircle2,
  HardDrive,
  Clock,
  ShieldCheck,
  X,
  Database,
  ArrowUpRight,
  Info
} from 'lucide-react';
import { useOffline } from '../contexts/OfflineContext';

export const OfflineStatusBanner: React.FC = () => {
  const {
    isOnline,
    isOffline,
    queue,
    queueCount,
    lastSyncTime,
    isSyncing,
    syncSuccessMsg,
    triggerSync,
    downloadLocalBackup,
    canInstallPWA,
    installPWA,
    isInstalled,
  } = useOffline();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);

  return (
    <>
      {/* 1. Offline Notification Bar (Appears when connection is lost) */}
      {isOffline && !isDismissed && (
        <div 
          className="bg-gradient-to-r from-amber-600 via-orange-600 to-amber-700 text-white px-4 py-2 text-xs font-bold shadow-lg flex items-center justify-between z-40 sticky top-0 border-b border-amber-400/40 animate-in slide-in-from-top duration-300"
          dir="rtl"
        >
          <div className="flex items-center gap-2.5">
            <span className="p-1 bg-black/20 rounded-lg flex items-center justify-center">
              <WifiOff className="w-4 h-4 text-amber-200 animate-pulse" />
            </span>
            <span>
              <strong>وضع عدم الاتصال (بدون إنترنت):</strong> أنت تعمل الآن محلياً بكفاءة 100%، وجميع العمليات والفواتير تُحفظ في جهازك تلقائياً.
            </span>
            {queueCount > 0 && (
              <span className="bg-black/30 px-2 py-0.5 rounded-full text-[11px] font-mono text-amber-200">
                ({queueCount}) عمليات مسجلة محلياً
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsModalOpen(true)}
              className="px-3 py-1 bg-white text-slate-900 hover:bg-amber-50 rounded-lg text-xs font-black shadow-xs transition cursor-pointer flex items-center gap-1"
            >
              <Database className="w-3.5 h-3.5 text-amber-600" />
              <span>إدارة وضع عدم الاتصال</span>
            </button>
            <button
              onClick={() => setIsDismissed(true)}
              className="p-1 hover:bg-white/20 rounded-lg text-amber-200 hover:text-white transition"
              title="إغلاق التنبيه"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* 2. Reconnection Sync Toast */}
      {syncSuccessMsg && (
        <div 
          className="fixed bottom-6 left-6 z-50 bg-emerald-900 text-emerald-100 p-4 rounded-2xl shadow-2xl border border-emerald-500 flex items-center gap-3 animate-in slide-in-from-bottom duration-300 text-xs font-bold"
          dir="rtl"
        >
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <span>{syncSuccessMsg}</span>
        </div>
      )}

      {/* 3. Offline Capabilities & Sync Management Modal */}
      {isModalOpen && (
        <div 
          className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200"
          dir="rtl"
        >
          <div className="bg-white max-w-xl w-full rounded-3xl shadow-2xl border border-slate-200 overflow-hidden text-right">
            {/* Header */}
            <div className="bg-slate-900 p-5 text-white flex items-center justify-between border-b border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className={`p-2 rounded-xl border ${isOnline ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' : 'bg-amber-500/20 text-amber-400 border-amber-500/30'}`}>
                  {isOnline ? <Wifi className="w-5 h-5" /> : <WifiOff className="w-5 h-5" />}
                </div>
                <div>
                  <h3 className="text-base font-black text-white">إدارة العمل بدون إنترنت (Offline PWA Engine)</h3>
                  <p className="text-[11px] text-slate-400">حفظ محلي فوري ومزامنة ذكية تلقائية</p>
                </div>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 hover:bg-slate-800 rounded-xl text-slate-400 hover:text-white transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 space-y-5 max-h-[80vh] overflow-y-auto">
              {/* Status Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-2xl text-center">
                  <span className="text-[11px] text-slate-500 block">حالة الاتصال الحالية</span>
                  <div className="flex items-center justify-center gap-1.5 mt-1">
                    <span className={`w-2.5 h-2.5 rounded-full ${isOnline ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`} />
                    <span className={`text-xs font-black ${isOnline ? 'text-emerald-700' : 'text-amber-700'}`}>
                      {isOnline ? 'متصل بالشبكة 🟢' : 'بدون إنترنت ⚡'}
                    </span>
                  </div>
                </div>

                <div className="p-3 bg-slate-50 border border-slate-200 rounded-2xl text-center">
                  <span className="text-[11px] text-slate-500 block">قاعدة البيانات المحلية</span>
                  <div className="flex items-center justify-center gap-1 mt-1 text-xs font-black text-slate-800">
                    <HardDrive className="w-3.5 h-3.5 text-blue-600" />
                    <span>نشطة (Offline Ready)</span>
                  </div>
                </div>

                <div className="p-3 bg-slate-50 border border-slate-200 rounded-2xl text-center">
                  <span className="text-[11px] text-slate-500 block">عمليات بانتظار المزامنة</span>
                  <div className="flex items-center justify-center gap-1 mt-1 text-xs font-black text-slate-800 font-mono">
                    <Clock className="w-3.5 h-3.5 text-indigo-600" />
                    <span>{queueCount} عملية</span>
                  </div>
                </div>
              </div>

              {/* Offline Actions Queue Summary */}
              {queueCount > 0 ? (
                <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl space-y-2">
                  <div className="flex items-center justify-between text-xs font-bold text-amber-900">
                    <span className="flex items-center gap-1.5">
                      <Clock className="w-4 h-4 text-amber-700" />
                      العمليات المسجلة محلياً في انتظار المزامنة ({queueCount}):
                    </span>
                    <button
                      onClick={triggerSync}
                      disabled={isSyncing}
                      className="px-3 py-1 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-[11px] font-black transition flex items-center gap-1 shadow-xs cursor-pointer disabled:opacity-50"
                    >
                      <RefreshCw className={`w-3 h-3 ${isSyncing ? 'animate-spin' : ''}`} />
                      <span>{isSyncing ? 'جاري المزامنة...' : 'مزامنة يدوية الآن'}</span>
                    </button>
                  </div>
                  <div className="max-h-32 overflow-y-auto space-y-1.5 pr-1">
                    {queue.map((item) => (
                      <div key={item.id} className="p-2 bg-white rounded-xl border border-amber-200/80 flex items-center justify-between text-[11px]">
                        <div>
                          <strong className="text-slate-800">{item.entityName}</strong> ({item.actionType})
                          <span className="text-slate-500 block text-[10px]">{new Date(item.timestamp).toLocaleTimeString('ar-YE')}</span>
                        </div>
                        <span className="px-2 py-0.5 bg-amber-100 text-amber-800 rounded font-mono text-[10px]">
                          {item.module}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center gap-2.5 text-xs text-emerald-800 font-bold">
                  <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>جميع البيانات والعمليات متزامنة ومحفوظة بنجاح مع آخر طابع زمني ({lastSyncTime ? new Date(lastSyncTime).toLocaleTimeString('ar-YE') : 'الآن'}).</span>
                </div>
              )}

              {/* Install PWA as Desktop / Mobile App */}
              <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-2xl flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-md shadow-blue-500/20 shrink-0">
                    <Smartphone className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-black text-slate-900">تثبيت التطبيق على الحاسوب أو الهاتف (PWA)</h4>
                    <p className="text-[11px] text-slate-600">لتشغيل النظام بضغطة واحدة من سطح المكتب أو الشاشة الرئيسية حتى بدون إنترنت</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={installPWA}
                  className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-black transition shadow-md shadow-blue-600/20 flex items-center gap-1.5 shrink-0 cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>{isInstalled ? 'مُثبت كبرنامج ✅' : 'تثبيت الآن 📲'}</span>
                </button>
              </div>

              {/* Download Local JSON Backup */}
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <Database className="w-5 h-5 text-slate-700 shrink-0" />
                  <div>
                    <h4 className="text-xs font-black text-slate-900">تصدير نسخة احتياطية محلية (Full Offline Backup)</h4>
                    <p className="text-[11px] text-slate-500">حفظ كافة فواتيرك وقيودك ومخزونك في ملف JSON على جهازك الشخصي</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={downloadLocalBackup}
                  className="px-3.5 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-black transition flex items-center gap-1.5 shrink-0 cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5 text-slate-300" />
                  <span>تحميل النسخة 💾</span>
                </button>
              </div>

              {/* Instructions Guide */}
              <div className="p-3.5 bg-slate-100 rounded-2xl border border-slate-200 text-[11px] text-slate-600 leading-relaxed space-y-1">
                <div className="font-bold text-slate-800 flex items-center gap-1">
                  <Info className="w-3.5 h-3.5 text-blue-600" />
                  <span>كيف يعمل نظام MeDo ERP بدون إنترنت؟</span>
                </div>
                <p>1. تم تفعيل تقنية Service Worker لتخزين جميع ملفات الواجهة والخطوط والبرمجيات داخل المتصفح.</p>
                <p>2. تُحفظ الحسابات والقيود وفواتير المبيعات ونقاط البيع تلقائياً في التخزين المحلي الآمن بجهازك.</p>
                <p>3. عند عودة الاتصال، يكتشف النظام الشبكة ويقوم بمزامنة العمليات تلقائياً وبأمان تام.</p>
              </div>
            </div>

            {/* Footer */}
            <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end">
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl transition cursor-pointer"
              >
                إغلاق
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
