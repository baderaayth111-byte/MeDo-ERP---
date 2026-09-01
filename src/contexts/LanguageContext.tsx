import React, { createContext, useContext, useState, useEffect } from 'react';

export type Language = 'ar' | 'en';

export interface LanguageContextType {
  language: Language;
  dir: 'rtl' | 'ltr';
  setLanguage: (lang: Language) => void;
  t: (key: string, fallback?: string) => string;
}

const translations: Record<Language, Record<string, string>> = {
  ar: {
    // General & System
    'app.title': 'نظام ميدو ERP الشامل - ميدو تك للحلول البرمجية',
    'app.designerCredit': 'ميدو تك للحلول البرمجية',
    'app.designerManualBtn': 'دليل المصمم 🔑',
    'app.searchPlaceholder': 'بحث سريع في النظام (T-Codes)...',
    'app.notifications': 'التنبيهات والإشعارات',
    'app.noNotifications': 'لا توجد تنبيهات جديدة',
    'app.close': 'إغلاق',
    'app.save': 'حفظ التغيرات',
    'app.cancel': 'إلغاء',
    'app.delete': 'حذف',
    'app.edit': 'تعديل',
    'app.add': 'إضافة',
    'app.view': 'عرض التفاصيل',
    'app.status': 'الحالة',
    'app.active': 'نشط',
    'app.inactive': 'غير نشط / معطل',
    'app.actions': 'الإجراءات',
    'app.all': 'الكل',
    'app.search': 'بحث',

    // Modules & Navigation
    'nav.launchpad': 'لوحة التحكم الرئيسية (Launchpad)',
    'nav.generalLedger': 'قيود اليومية العامة (GL)',
    'nav.chartOfAccounts': 'شجرة ودليل الحسابات',
    'nav.accountsReceivable': 'العملاء والذمم المدينة (AR)',
    'nav.accountsPayable': 'الموردين والذمم الدائنة (AP)',
    'nav.inventory': 'المخزون والمستودعات',
    'nav.pos': 'نقطة البيع الكاشير (POS)',
    'nav.hrPayroll': 'الموارد البشرية والرواتب (HR)',
    'nav.fixedAssets': 'الأصول الثابتة والإهلاك',
    'nav.controlling': 'مراكز التكلفة والموازنات',
    'nav.bankReconciliation': 'التسويات البنكية والخزينة',
    'nav.financialReports': 'القوائم والتقارير المالية',
    'nav.foreignExchange': 'إدارة العملات والصرف',
    'nav.eInvoicing': 'الفوترة الإلكترونية (ZATCA)',
    'nav.rolesPermissions': 'إدارة المستخدمين والصلاحيات',
    'nav.settings': 'إعدادات الشركة والنظام',

    // Dashboard / Launchpad
    'dash.title': 'لوحة التحليلات والمؤشرات الاستراتيجية (SAP Fiori Dashboard)',
    'dash.subTitle': 'مراقبة فورية لأداء النظام، الذمم، السيولة النقدية، ومؤشرات المخزون الحية',
    'dash.netProfit': 'صافي الأرباح التشغيلية',
    'dash.receivables': 'إجمالي الذمم المدينة (العملاء)',
    'dash.payables': 'إجمالي مستحقات الموردين (AP)',
    'dash.cashLiquidity': 'السيولة النقدية بالبنوك والخزينة',
    'dash.stockAlerts': 'تنبيهات المخزون الذكية',
    'dash.quickActions': 'إجراءات سريعة وشائعة',
    'dash.customize': 'تخصيص اللوحة (Fiori Customizer)',

    // Inventory & Smart Alerts
    'inv.smartAlertsTitle': 'مركز تنبيهات المخزون والتموين الذكي',
    'inv.outOfStock': 'أصناف نافدة من المخزون',
    'inv.lowStock': 'أصناف تحققت بها نقطة إعادة الطلب (ROP)',
    'inv.expiryWarning': 'تنبيهات قرب انتهاء الصلاحية',
    'inv.slowMoving': 'المخزون الفائض والراكد',
    'inv.autoPO': 'إنشاء أمر شراء تلقائي',
    'inv.reorderPoint': 'حد إعادة الطلب',
    'inv.currentStock': 'الكمية الحالية',
    'inv.unitPrice': 'سعر الوحدة',

    // User & Role Management
    'users.title': 'إدارة المستفيدين ومصفوفة الصلاحيات (RBAC Access Matrix)',
    'users.subTitle': 'إدارة حسابات مستخدمي النظام، تعيين الأدوار، وتحديد الصلاحيات المخصصة',
    'users.addUser': 'إضافة مستخدم جديد',
    'users.userList': 'قائمة الحسابات المسجلة',
    'users.permissionMatrix': 'مصفوفة صلاحيات الموديولات',
    'users.roleName': 'اسم الدور / الصلاحية',
    'users.displayName': 'الاسم الكامل',
    'users.email': 'البريد الإلكتروني',
    'users.department': 'القسم / الإدارة',
    'users.phone': 'رقم الهاتف',
    'users.changePassword': 'تغيير كلمة المرور',
    'users.toggleStatus': 'تغيير الحالة',

    // Auth & Header
    'auth.welcome': 'مرحباً بك',
    'auth.logout': 'تسجيل الخروج',
    'auth.login': 'تسجيل الدخول',
  },
  en: {
    // General & System
    'app.title': 'Medo ERP Enterprise Suite by Designer Mido Tech Software Solutions',
    'app.designerCredit': 'Produced by Mido Tech Software Solutions',
    'app.designerManualBtn': 'Designer Vault 🔑',
    'app.searchPlaceholder': 'Quick ERP Search (T-Codes)...',
    'app.notifications': 'Notifications & Alerts',
    'app.noNotifications': 'No new notifications',
    'app.close': 'Close',
    'app.save': 'Save Changes',
    'app.cancel': 'Cancel',
    'app.delete': 'Delete',
    'app.edit': 'Edit',
    'app.add': 'Add',
    'app.view': 'View Details',
    'app.status': 'Status',
    'app.active': 'Active',
    'app.inactive': 'Inactive / Disabled',
    'app.actions': 'Actions',
    'app.all': 'All',
    'app.search': 'Search',

    // Modules & Navigation
    'nav.launchpad': 'Fiori Launchpad Dashboard',
    'nav.generalLedger': 'General Ledger (GL)',
    'nav.chartOfAccounts': 'Chart of Accounts',
    'nav.accountsReceivable': 'Accounts Receivable (AR)',
    'nav.accountsPayable': 'Accounts Payable (AP)',
    'nav.inventory': 'Inventory & Warehouses',
    'nav.pos': 'Point of Sale (POS)',
    'nav.hrPayroll': 'HR & Payroll Management',
    'nav.fixedAssets': 'Fixed Assets & Depreciation',
    'nav.controlling': 'Cost Centers & Controlling',
    'nav.bankReconciliation': 'Bank Reconciliation & Treasury',
    'nav.financialReports': 'Financial Reports & Statements',
    'nav.foreignExchange': 'Foreign Exchange & Currencies',
    'nav.eInvoicing': 'ZATCA E-Invoicing',
    'nav.rolesPermissions': 'Users & Role Permissions',
    'nav.settings': 'Company & System Settings',

    // Dashboard / Launchpad
    'dash.title': 'SAP Fiori Analytics & KPI Dashboard',
    'dash.subTitle': 'Real-time monitoring of ERP performance, receivables, cash flow, and live inventory alerts',
    'dash.netProfit': 'Net Operating Profit',
    'dash.receivables': 'Total Accounts Receivable (AR)',
    'dash.payables': 'Total Accounts Payable (AP)',
    'dash.cashLiquidity': 'Cash & Bank Liquidity',
    'dash.stockAlerts': 'Smart Inventory Alerts',
    'dash.quickActions': 'Quick Actions & Shortcuts',
    'dash.customize': 'Customize Dashboard (Fiori)',

    // Inventory & Smart Alerts
    'inv.smartAlertsTitle': 'Smart Inventory & Replenishment Center',
    'inv.outOfStock': 'Out of Stock Items',
    'inv.lowStock': 'Low Stock / Reorder Point (ROP)',
    'inv.expiryWarning': 'Upcoming Expiry Date Alerts',
    'inv.slowMoving': 'Overstocked & Slow Moving',
    'inv.autoPO': 'Generate Auto Purchase Order',
    'inv.reorderPoint': 'Reorder Point (ROP)',
    'inv.currentStock': 'Current Quantity',
    'inv.unitPrice': 'Unit Price',

    // User & Role Management
    'users.title': 'User Accounts & Access Control Matrix (RBAC)',
    'users.subTitle': 'Manage user accounts, assign roles, and customize module permissions matrix',
    'users.addUser': 'Add New User Account',
    'users.userList': 'Registered Users List',
    'users.permissionMatrix': 'Module Permissions Matrix',
    'users.roleName': 'Role Name',
    'users.displayName': 'Full Name',
    'users.email': 'Email Address',
    'users.department': 'Department / Unit',
    'users.phone': 'Phone Number',
    'users.changePassword': 'Change Password',
    'users.toggleStatus': 'Toggle Status',

    // Auth & Header
    'auth.welcome': 'Welcome',
    'auth.logout': 'Sign Out',
    'auth.login': 'Sign In',
  }
};

const LanguageContext = createContext<LanguageContextType>({
  language: 'ar',
  dir: 'rtl',
  setLanguage: () => {},
  t: (key: string, fallback?: string) => fallback || key,
});

export const useLanguage = () => useContext(LanguageContext);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>(() => {
    const saved = localStorage.getItem('MEDO_ERP_LANG');
    return (saved === 'en' || saved === 'ar') ? saved : 'ar';
  });

  const dir: 'rtl' | 'ltr' = language === 'ar' ? 'rtl' : 'ltr';

  useEffect(() => {
    localStorage.setItem('MEDO_ERP_LANG', language);
    document.documentElement.dir = dir;
    document.documentElement.lang = language;
  }, [language, dir]);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
  };

  const t = (key: string, fallback?: string): string => {
    const currentDict = translations[language];
    if (currentDict && currentDict[key]) {
      return currentDict[key];
    }
    return fallback || translations.ar[key] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, dir, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};
