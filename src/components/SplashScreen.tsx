import React, { useEffect, useState } from 'react';

interface SplashScreenProps {
  onFinish?: () => void;
  durationMs?: number;
}

export const SplashScreen: React.FC<SplashScreenProps> = ({ 
  onFinish, 
  durationMs = 1800 
}) => {
  const [progress, setProgress] = useState(0);
  const [isVisible, setIsVisible] = useState(true);
  const [fadeOut, setFadeOut] = useState(false);

  useEffect(() => {
    const startTime = Date.now();
    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const currentProgress = Math.min(100, Math.floor((elapsed / durationMs) * 100));
      setProgress(currentProgress);

      if (elapsed >= durationMs) {
        clearInterval(interval);
        setFadeOut(true);
        setTimeout(() => {
          setIsVisible(false);
          if (onFinish) onFinish();
        }, 400);
      }
    }, 30);

    return () => clearInterval(interval);
  }, [durationMs, onFinish]);

  if (!isVisible) return null;

  return (
    <div 
      className={`fixed inset-0 z-[9999] flex flex-col items-center justify-between p-8 select-none transition-opacity duration-400 ${
        fadeOut ? 'opacity-0 pointer-events-none' : 'opacity-100'
      }`}
      style={{
        background: 'linear-gradient(135deg, #0A2540 0%, #003366 50%, #0A2540 100%)',
        color: '#ffffff'
      }}
      dir="rtl"
    >
      {/* Decorative ambient background glows */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-[#D4AF37]/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Top spacer */}
      <div className="w-full flex items-center justify-between text-xs text-slate-400 opacity-60">
        <span className="font-mono">v1.0.0</span>
        <span>نظام السحابة الموحد</span>
      </div>

      {/* Center Brand Logo & Name */}
      <div className="flex flex-col items-center text-center my-auto space-y-6 animate-in fade-in zoom-in-90 duration-700">
        
        {/* Luxury Gold Icon Badge */}
        <div className="relative group">
          <div className="w-28 h-28 sm:w-32 sm:h-32 rounded-[28px] bg-gradient-to-br from-[#0A2540] to-[#003366] p-1 border-2 border-[#D4AF37]/60 shadow-2xl shadow-[#D4AF37]/20 flex items-center justify-center relative overflow-hidden">
            {/* Ambient inner shimmer */}
            <div className="absolute inset-0 bg-gradient-to-tr from-[#D4AF37]/20 via-transparent to-white/10" />
            
            {/* Gold Crown / Dot */}
            <div className="absolute top-3 w-3.5 h-3.5 rounded-full bg-gradient-to-br from-[#F3E5AB] via-[#D4AF37] to-[#AA7C11] shadow-md shadow-[#D4AF37]/50 animate-pulse" />

            {/* Letter M in Gold */}
            <span 
              className="text-5xl sm:text-6xl font-black tracking-tight"
              style={{
                background: 'linear-gradient(135deg, #FFF6D5 0%, #D4AF37 50%, #AA7C11 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                filter: 'drop-shadow(0 2px 8px rgba(212, 175, 55, 0.4))'
              }}
            >
              M
            </span>
          </div>
        </div>

        {/* Brand Titles */}
        <div className="space-y-1">
          <div className="flex items-center justify-center gap-2">
            <h1 
              className="text-3xl sm:text-4xl font-black tracking-wide"
              style={{
                background: 'linear-gradient(135deg, #FFFFFF 0%, #F3E5AB 50%, #D4AF37 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}
            >
              MeDo ERP
            </h1>
            <span className="px-2 py-0.5 rounded-md bg-[#D4AF37]/20 text-[#D4AF37] text-[11px] font-mono font-bold border border-[#D4AF37]/40">
              S/4HANA
            </span>
          </div>
          <p className="text-sm font-medium text-slate-300">
            النظام المؤسسي المتكامل لإدارة الأعمال والمحاسبة
          </p>
        </div>

        {/* Animated Gold Progress Bar */}
        <div className="w-64 sm:w-80 space-y-2 pt-4">
          <div className="w-full h-2 bg-slate-800/80 rounded-full overflow-hidden p-0.5 border border-[#D4AF37]/30 shadow-inner">
            <div 
              className="h-full rounded-full transition-all duration-75 ease-out shadow-sm"
              style={{ 
                width: `${progress}%`,
                background: 'linear-gradient(90deg, #AA7C11 0%, #D4AF37 50%, #FFF6D5 100%)',
                boxShadow: '0 0 12px rgba(212, 175, 55, 0.6)'
              }}
            />
          </div>
          <div className="flex items-center justify-between text-[11px] text-slate-400 font-mono">
            <span>جارِ تهيئة النظام وقواعد البيانات...</span>
            <span className="text-[#D4AF37] font-bold">{progress}%</span>
          </div>
        </div>
      </div>

      {/* Bottom Footer Text */}
      <div className="text-center space-y-1 text-slate-400 pb-2">
        <p className="text-xs font-bold text-white tracking-wide">
          ميدو تك للحلول البرمجية المتكاملة
        </p>
        <p className="text-[10px] text-slate-500 font-mono">
          MeDo Tech Software Solutions © 2026 • جميع الحقوق محفوظة
        </p>
      </div>
    </div>
  );
};
