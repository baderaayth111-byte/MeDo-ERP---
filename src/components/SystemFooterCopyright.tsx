import React from 'react';

export const SystemFooterCopyright: React.FC = () => {
  return (
    <div className="py-3 px-4 text-center text-xs text-slate-500 border-t border-slate-200/60 bg-white/80 backdrop-blur-xs flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-4 font-sans shadow-xs">
      <div className="flex items-center gap-2 font-bold text-slate-700">
        <span className="px-2.5 py-0.5 rounded-md bg-[#0A2540] text-[#D4AF37] font-mono text-[10px] tracking-wider shadow-xs border border-amber-500/30">
          MDOtkBZ
        </span>
        <span className="text-[10px]">© All rights reserved to MeDo Tech for Software Solutions - Bin Ziad Ltd</span>
      </div>
      <div className="flex items-center gap-3 text-[10px] text-slate-500 font-mono">
        <a href="mailto:bdr.zyad@yandex.com" className="hover:text-blue-600 transition">bdr.zyad@yandex.com</a>
        <span className="text-slate-300">•</span>
        <a href="tel:+967715779976" dir="ltr" className="hover:text-blue-600 transition">+967715779976</a>
        <span className="text-slate-300">•</span>
        <span>Yemen, Amran</span>
      </div>
    </div>
  );
};
