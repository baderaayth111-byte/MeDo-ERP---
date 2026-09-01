import { CompanyProfile, Branch, CurrencyConfig, FiscalPeriod, SystemModuleSetting, Currency } from '../types/accounting';

const SETTINGS_STORAGE_KEY = 'medo_erp_company_profile_v1';
const BRANCHES_STORAGE_KEY = 'medo_erp_branches_v1';
const CURRENCIES_STORAGE_KEY = 'medo_erp_currencies_v1';
const PERIODS_STORAGE_KEY = 'medo_erp_periods_v1';
const MODULES_STORAGE_KEY = 'medo_erp_modules_v1';

export const defaultCompanyProfile: CompanyProfile = {
  nameAr: 'Bin Ziad Trading Group',
  nameEn: 'Bin Ziad Trading Group',
  taxNumber: 'YER-TAX-98421034',
  commercialRegister: 'CR-104928/SANAA',
  commercialRegistrationCity: 'صنعاء - وزارة التجارة والصناعة',
  baseCurrency: 'YER',
  exchangeRateRegime: 'SANAA', // الافتراضي: نظام صنعاء (الرسمي)
  sanaaExchangeRates: {
    USD: 535,
    SAR: 142.5,
  },
  adenExchangeRates: {
    USD: 1910,
    SAR: 505,
  },
  exchangeRates: {
    YER: 1,
    USD: 535,
    SAR: 142.5,
  },
  currentFiscalYear: 2026,
  phone: '+967 1 445566',
  secondaryPhone: '+967 1 445567',
  mobile: '+967 777 123456',
  fax: '+967 1 445568',
  whatsapp: '+967 770 998877',
  email: 'info@almurooj-group.ye',
  financeEmail: 'finance@almurooj-group.ye',
  supportEmail: 'support@almurooj-group.ye',
  website: 'https://almurooj-group.ye',
  address: 'شارع حدة، برج الأعمال الدولي - الدور الثامن',
  city: 'صنعاء',
  country: 'الجمهورية اليمنية',
  postalCode: 'P.O. Box 14520',
  activityDescription: 'استيراد وتوزيع المواد الغذائية والتقنيات وإدارة المشروعات التجارية واللوجستية',
  logoUrl: '',
  headerTagline: 'نحو ريادة اقتصادية واستثمار مستدام',
  footerNotes: 'المركز الرئيسي: صنعاء - فروعنا: عدن، المكلا، تعز، الحديدة - الرقم المجاني: 800-4455',
  defaultVatRate: 0.05,
  accountingBasis: 'ACCRUAL',
};

export const defaultBranches: Branch[] = [
  {
    id: 'BR-01',
    code: 'HQ-SANAA',
    nameAr: 'الفرع الرئيسي - الإدارة العامة (صنعاء)',
    nameEn: 'Main Headquarters - Sanaa',
    manager: 'م. أحمد ناصر العولقي',
    phone: '+967 1 445566',
    secondaryPhone: '+967 777 123456',
    email: 'hq-sanaa@almurooj-group.ye',
    city: 'صنعاء',
    address: 'شارع حدة، برج الأعمال الدولي',
    isMain: true,
    isActive: true,
    warehouseId: 'WH-01',
    costCenterId: 'CC-100',
  },
  {
    id: 'BR-02',
    code: 'BR-ADEN',
    nameAr: 'فرع المنطقة الجنوبية واللوجستيات (عدن)',
    nameEn: 'Aden Southern Regional Branch',
    manager: 'أ. سامي فضل المعمري',
    phone: '+967 2 248899',
    secondaryPhone: '+967 771 654321',
    email: 'aden-branch@almurooj-group.ye',
    city: 'عدن',
    address: 'المعلا، الشارع الرئيسي، جوار ميناء المعلا',
    isMain: false,
    isActive: true,
    warehouseId: 'WH-02',
    costCenterId: 'CC-200',
  },
  {
    id: 'BR-03',
    code: 'BR-MUKALLA',
    nameAr: 'فرع إقليم حضرموت والشرق (المكلا)',
    nameEn: 'Mukalla & Eastern Region Branch',
    manager: 'م. خالد عمر بن دغار',
    phone: '+967 5 304411',
    secondaryPhone: '+967 773 987654',
    email: 'mukalla@almurooj-group.ye',
    city: 'المكلا',
    address: 'فوه، الشارع التجاري العام، مقابل برج النور',
    isMain: false,
    isActive: true,
    warehouseId: 'WH-03',
    costCenterId: 'CC-300',
  },
  {
    id: 'BR-04',
    code: 'BR-TAIZ',
    nameAr: 'فرع المنطقة الوسطى والتوزيع (تعز)',
    nameEn: 'Taiz Central Region Branch',
    manager: 'أ. طارق عبدالكريم شمسان',
    phone: '+967 4 256677',
    secondaryPhone: '+967 775 443322',
    email: 'taiz@almurooj-group.ye',
    city: 'تعز',
    address: 'شارع الحوبان التجاري، مجمع النصر',
    isMain: false,
    isActive: true,
    warehouseId: 'WH-01',
    costCenterId: 'CC-400',
  },
];

export const defaultCurrenciesConfig: CurrencyConfig[] = [
  {
    code: 'YER',
    nameAr: 'ريال يمني',
    nameEn: 'Yemeni Rial',
    symbol: 'ر.ي',
    exchangeRate: 1,
    fractionNameAr: 'فلس',
    isBase: true,
    isActive: true,
    decimalPlaces: 2,
  },
  {
    code: 'USD',
    nameAr: 'دولار أمريكي',
    nameEn: 'US Dollar',
    symbol: '$',
    exchangeRate: 535,
    fractionNameAr: 'سنت',
    isBase: false,
    isActive: true,
    decimalPlaces: 2,
  },
  {
    code: 'SAR',
    nameAr: 'ريال سعودي',
    nameEn: 'Saudi Riyal',
    symbol: 'ر.س',
    exchangeRate: 142.5,
    fractionNameAr: 'هللة',
    isBase: false,
    isActive: true,
    decimalPlaces: 2,
  },
  {
    code: 'EUR',
    nameAr: 'يورو أوروبي',
    nameEn: 'Euro',
    symbol: '€',
    exchangeRate: 580,
    fractionNameAr: 'سنت',
    isBase: false,
    isActive: false,
    decimalPlaces: 2,
  },
  {
    code: 'AED',
    nameAr: 'درهم إماراتي',
    nameEn: 'UAE Dirham',
    symbol: 'د.إ',
    exchangeRate: 145.6,
    fractionNameAr: 'فلس',
    isBase: false,
    isActive: false,
    decimalPlaces: 2,
  },
  {
    code: 'OMR',
    nameAr: 'ريال عماني',
    nameEn: 'Omani Rial',
    symbol: 'ر.ع',
    exchangeRate: 1390,
    fractionNameAr: 'بيسة',
    isBase: false,
    isActive: false,
    decimalPlaces: 3,
  },
];

export const defaultFiscalPeriods: FiscalPeriod[] = [
  { id: 'FP-01', periodNumber: 1, nameAr: 'يناير 2026', startDate: '2026-01-01', endDate: '2026-01-31', status: 'CLOSED' },
  { id: 'FP-02', periodNumber: 2, nameAr: 'فبراير 2026', startDate: '2026-02-01', endDate: '2026-02-28', status: 'CLOSED' },
  { id: 'FP-03', periodNumber: 3, nameAr: 'مارس 2026', startDate: '2026-03-01', endDate: '2026-03-31', status: 'CLOSED' },
  { id: 'FP-04', periodNumber: 4, nameAr: 'أبريل 2026', startDate: '2026-04-01', endDate: '2026-04-30', status: 'CLOSED' },
  { id: 'FP-05', periodNumber: 5, nameAr: 'مايو 2026', startDate: '2026-05-01', endDate: '2026-05-31', status: 'CLOSED' },
  { id: 'FP-06', periodNumber: 6, nameAr: 'يونيو 2026', startDate: '2026-06-01', endDate: '2026-06-30', status: 'CLOSED' },
  { id: 'FP-07', periodNumber: 7, nameAr: 'يوليو 2026', startDate: '2026-07-01', endDate: '2026-07-31', status: 'CLOSED' },
  { id: 'FP-08', periodNumber: 8, nameAr: 'أغسطس 2026 (الفترة الحالية)', startDate: '2026-08-01', endDate: '2026-08-31', status: 'OPEN' },
  { id: 'FP-09', periodNumber: 9, nameAr: 'سبتمبر 2026', startDate: '2026-09-01', endDate: '2026-09-30', status: 'OPEN' },
  { id: 'FP-10', periodNumber: 10, nameAr: 'أكتوبر 2026', startDate: '2026-10-01', endDate: '2026-10-31', status: 'OPEN' },
  { id: 'FP-11', periodNumber: 11, nameAr: 'نوفمبر 2026', startDate: '2026-11-01', endDate: '2026-11-30', status: 'OPEN' },
  { id: 'FP-12', periodNumber: 12, nameAr: 'ديسمبر 2026 (إقفال الحسابات)', startDate: '2026-12-01', endDate: '2026-12-31', status: 'OPEN' },
];

export const defaultSystemModules: SystemModuleSetting[] = [
  {
    id: 'mod-1',
    key: 'general-ledger',
    nameAr: 'الأستاذ العام وقيود اليومية',
    nameEn: 'General Ledger & Journal Entries',
    descriptionAr: 'تسجيل القيود المزدوجة، ميزان المراجعة، وعكس القيود التلقائي',
    tCode: 'FB50 / FBL3N',
    category: 'FINANCIAL',
    isEnabled: true,
    showInSidebar: true,
    order: 1,
  },
  {
    id: 'mod-2',
    key: 'chart-of-accounts',
    nameAr: 'دليل الحسابات الشجري (COA)',
    nameEn: 'Chart of Accounts',
    descriptionAr: 'شجرة الحسابات المالية متعددة المستويات والمطابقة للمعايير الدولية',
    tCode: 'FS00',
    category: 'FINANCIAL',
    isEnabled: true,
    showInSidebar: true,
    order: 2,
  },
  {
    id: 'mod-3',
    key: 'inventory',
    nameAr: 'إدارة المخزون والمستودعات',
    nameEn: 'Inventory & Materials Management (MM)',
    descriptionAr: 'تتبع الأصناف، سندات الإدخال والإخراج والتحويل، باركود وطباعة ملصقات',
    tCode: 'MM01 / MIGO',
    category: 'OPERATIONAL',
    isEnabled: true,
    showInSidebar: true,
    order: 3,
  },
  {
    id: 'mod-4',
    key: 'accounts-receivable',
    nameAr: 'العملاء والذمم المدينة',
    nameEn: 'Accounts Receivable (AR)',
    descriptionAr: 'إدارة سجلات العملاء، فواتير المبيعات الضريبية، وسندات القبض',
    tCode: 'FB70 / FBL5N',
    category: 'OPERATIONAL',
    isEnabled: true,
    showInSidebar: true,
    order: 4,
  },
  {
    id: 'mod-5',
    key: 'accounts-payable',
    nameAr: 'الموردين والذمم الدائنة',
    nameEn: 'Accounts Payable (AP)',
    descriptionAr: 'إدارة الموردين، فواتير المشتريات والتوريد، وسندات الصرف والتحويل',
    tCode: 'FB60 / FBL1N',
    category: 'OPERATIONAL',
    isEnabled: true,
    showInSidebar: true,
    order: 5,
  },
  {
    id: 'mod-6',
    key: 'fixed-assets',
    nameAr: 'الأصول الثابتة والإهلاك',
    nameEn: 'Fixed Assets Management (AA)',
    descriptionAr: 'سجل الأصول، احتساب الإهلاك الشهري التلقائي، والقيمة الدفترية',
    tCode: 'AS01 / AFAB',
    category: 'FINANCIAL',
    isEnabled: true,
    showInSidebar: true,
    order: 6,
  },
  {
    id: 'mod-7',
    key: 'controlling',
    nameAr: 'مراكز التكلفة والربحية',
    nameEn: 'Controlling & Cost Centers (CO)',
    descriptionAr: 'توزيع التكاليف، قياس هوامش الربحية، ومراقبة الموازنات التقديرية',
    tCode: 'KS01 / KE51',
    category: 'ANALYTICS',
    isEnabled: true,
    showInSidebar: true,
    order: 7,
  },
  {
    id: 'mod-8',
    key: 'bank-reconciliation',
    nameAr: 'الخزينة والتسويات البنكية',
    nameEn: 'Cash & Bank Reconciliation',
    descriptionAr: 'مطابقة كشوفات الحساب البنكية، مراقبة السيولة، وإدارة أوراق القبض والدفع',
    tCode: 'FF67 / FF_5',
    category: 'FINANCIAL',
    isEnabled: true,
    showInSidebar: true,
    order: 8,
  },
  {
    id: 'mod-9',
    key: 'financial-reports',
    nameAr: 'التقارير والقوائم المالية',
    nameEn: 'Financial Reports & Statements',
    descriptionAr: 'قائمة الدخل، الميزانية العمومية، ميزان المراجعة، والتدفقات النقدية',
    tCode: 'F.01',
    category: 'ANALYTICS',
    isEnabled: true,
    showInSidebar: true,
    order: 9,
  },
  {
    id: 'mod-12',
    key: 'budgeting',
    nameAr: 'الموازنات التقديرية والفعلية',
    nameEn: 'Budgeting & Variance Analysis',
    descriptionAr: 'التخطيط المالي السنوي، مقارنة Actual vs. Budget، والتنبيهات الرقابية الذكية',
    tCode: 'FMBB / S_ALR',
    category: 'ANALYTICS',
    isEnabled: true,
    showInSidebar: true,
    order: 10,
  },
  {
    id: 'mod-11',
    key: 'foreign-exchange',
    nameAr: 'تطبيق الصرافة والتحويلات المصرفية',
    nameEn: 'Foreign Exchange & Remittances (FX)',
    descriptionAr: 'بيع وشراء العملات، الحوالات المالية السريعة، أسعار الصرف الحية والامتثال المصرفي',
    tCode: 'FX-DEAL / FIN-FX',
    category: 'FINANCIAL',
    isEnabled: true,
    showInSidebar: true,
    order: 10,
  },
  {
    id: 'mod-10',
    key: 'settings',
    nameAr: 'تهيئة وإعدادات النظام الشاملة',
    nameEn: 'System Configuration & Settings (SPRO)',
    descriptionAr: 'بيانات المنشأة، أرقام التواصل، الفروع، العملات، الفترات، وتفعيل المكونات',
    tCode: 'SPRO / S_ALR',
    category: 'SYSTEM',
    isEnabled: true,
    showInSidebar: true,
    order: 11,
  },
];

// --- Persistent Storage Helpers ---

export function getLoadedCompanyProfile(): CompanyProfile {
  try {
    const raw = localStorage.getItem(SETTINGS_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return { ...defaultCompanyProfile, ...parsed };
    }
  } catch (e) {
    console.error('Failed to load company profile from localStorage', e);
  }
  return defaultCompanyProfile;
}

export function saveCompanyProfileToStorage(profile: CompanyProfile): void {
  try {
    localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(profile));
  } catch (e) {
    console.error('Failed to save company profile to localStorage', e);
  }
}

export function getLoadedBranches(): Branch[] {
  try {
    const raw = localStorage.getItem(BRANCHES_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch (e) {
    console.error('Failed to load branches from localStorage', e);
  }
  return defaultBranches;
}

export function saveBranchesToStorage(branches: Branch[]): void {
  try {
    localStorage.setItem(BRANCHES_STORAGE_KEY, JSON.stringify(branches));
  } catch (e) {
    console.error('Failed to save branches to localStorage', e);
  }
}

export function getLoadedCurrenciesConfig(): CurrencyConfig[] {
  try {
    const raw = localStorage.getItem(CURRENCIES_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch (e) {
    console.error('Failed to load currencies config from localStorage', e);
  }
  return defaultCurrenciesConfig;
}

export function saveCurrenciesConfigToStorage(currencies: CurrencyConfig[]): void {
  try {
    localStorage.setItem(CURRENCIES_STORAGE_KEY, JSON.stringify(currencies));
  } catch (e) {
    console.error('Failed to save currencies to localStorage', e);
  }
}

export function getLoadedFiscalPeriods(): FiscalPeriod[] {
  try {
    const raw = localStorage.getItem(PERIODS_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch (e) {
    console.error('Failed to load fiscal periods from localStorage', e);
  }
  return defaultFiscalPeriods;
}

export function saveFiscalPeriodsToStorage(periods: FiscalPeriod[]): void {
  try {
    localStorage.setItem(PERIODS_STORAGE_KEY, JSON.stringify(periods));
  } catch (e) {
    console.error('Failed to save fiscal periods to localStorage', e);
  }
}

export function getLoadedSystemModules(): SystemModuleSetting[] {
  let modules = defaultSystemModules;
  try {
    const raw = localStorage.getItem(MODULES_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        modules = parsed;
      }
    }
  } catch (e) {
    console.error('Failed to load system modules from localStorage', e);
  }
  
  if (typeof window !== 'undefined' && window.location.search.includes('clean_demo=true')) {
    modules = modules.map(m => m.key === 'foreign-exchange' ? { ...m, isEnabled: false, showInSidebar: false } : m);
  }
  
  return modules;
}

export function saveSystemModulesToStorage(modules: SystemModuleSetting[]): void {
  try {
    localStorage.setItem(MODULES_STORAGE_KEY, JSON.stringify(modules));
  } catch (e) {
    console.error('Failed to save system modules to localStorage', e);
  }
}
