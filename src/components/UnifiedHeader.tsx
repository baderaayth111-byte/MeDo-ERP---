import React from 'react';

interface UnifiedHeaderProps {
  activeModule?: string;
}

export const UnifiedHeader: React.FC<UnifiedHeaderProps> = ({ activeModule }) => {
  const getModuleTitle = (mod: string) => {
    switch (mod) {
      case 'launchpad': return 'لوحة التحكم الرئيسية';
      case 'general-ledger': return 'الأستاذ العام';
      case 'inventory': return 'إدارة المخزون';
      case 'pos': return 'نقاط البيع';
      case 'settings': return 'إعدادات النظام';
      default: return 'MeDo ERP';
    }
  };

  return (
    <div className="w-full bg-[#0A2540] text-white py-3 px-6 flex items-center justify-between border-b-2 border-[#D4AF37]" dir="rtl">
      {/* Right: Logo */}
      <div className="text-xl font-bold tracking-tight">
        MDOtkBZ
      </div>

      {/* Center: Title */}
      <div className="text-lg font-bold">
        {activeModule ? getModuleTitle(activeModule) : 'MeDo ERP'}
      </div>

      {/* Left: Company Names */}
      <div className="text-right">
        <div className="text-sm font-bold">ميدو تك للحلول البرمجية</div>
        <div className="text-[10px] opacity-80">MeDo Tech for Software Solutions</div>
      </div>
    </div>
  );
};
