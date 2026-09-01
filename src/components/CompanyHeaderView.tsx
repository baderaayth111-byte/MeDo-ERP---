import React from 'react';
import { CompanyProfile } from '../types/accounting';

interface CompanyHeaderViewProps {
  companyProfile?: CompanyProfile;
  align?: 'center' | 'right' | 'left';
  size?: 'sm' | 'md' | 'lg';
  showSubtitle?: boolean;
}

export const CompanyHeaderView: React.FC<CompanyHeaderViewProps> = ({
  companyProfile,
  align = 'center',
  size = 'md'
}) => {
  const alignClass = align === 'right' ? 'text-right items-end' : align === 'left' ? 'text-left items-start' : 'text-center items-center';
  const mainSize = size === 'sm' ? 'text-xs font-bold' : size === 'lg' ? 'text-xl font-black' : 'text-base font-black';
  const subSize = size === 'sm' ? 'text-[10px]' : size === 'lg' ? 'text-sm' : 'text-xs';

  // Check if we are in Demo / Trial mode or general mode vs Original/Official version
  const isDemoMode = typeof window !== 'undefined' && (
    window.location.search.includes('demo') ||
    window.location.search.includes('isolate') ||
    localStorage.getItem('medo_erp_demo_session_v3') !== null
  );

  if (isDemoMode) {
    const generalName = companyProfile?.nameAr || 'مجموعة المروج الدولية للاستثمار والتجارة';
    return (
      <div className={`flex flex-col ${alignClass}`}>
        <div className={`${mainSize} text-slate-900 tracking-tight`}>
          {generalName}
        </div>
      </div>
    );
  }

  return (
    <div className={`flex flex-col ${alignClass}`}>
      <div className={`${subSize} font-bold text-[#0A2540] tracking-tight`}>
        ميدو تك للحلول البرمجية
      </div>
      <div className={`${mainSize} text-slate-900 tracking-tight`}>
        Bin Ziad Trading Group
      </div>
    </div>
  );
};
