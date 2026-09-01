export type AppRole = 'ADMIN' | 'ACCOUNTANT' | 'CASHIER' | 'PROCUREMENT' | 'HR' | 'AUDITOR' | 'VIEWER' | string;

export interface ModuleActionPermissions {
  view: boolean;
  create: boolean;
  edit: boolean;
  delete: boolean;
  print: boolean;
  export: boolean;
}

export interface CustomRoleDefinition {
  id: string;
  nameAr: string;
  nameEn: string;
  desc: string;
  badgeColor: string;
  iconName: string;
  isSystemDefault?: boolean;
  editClosedInvoices: boolean; // Specific strict permission for editing closed/posted invoices
  permissions: Record<string, ModuleActionPermissions>;
}

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string | null;
  role: AppRole;
  isActive: boolean;
  createdAt: string;
  mustChangePassword?: boolean;
  editClosedInvoices?: boolean;
  dailyTransactionsCount?: number;
  maxTransactions?: number;
  lastLoginAt?: string;
  lastLoginIp?: string;
  lastLoginDevice?: string;
}

export interface LoginAuditLog {
  id: string;
  userId: string;
  userEmail: string;
  userName: string;
  role: AppRole;
  timestamp: string;
  ip: string;
  browser: string;
  os: string;
  device: string;
  userAgent: string;
  status: 'SUCCESS' | 'FAILED' | 'PASSWORD_RESET_REQUIRED' | 'ACCOUNT_LOCKED';
  notes?: string;
  whatsappSent?: boolean;
}

export const ROLE_LABELS: Record<string, { nameAr: string; desc: string; badgeColor: string; iconName: string }> = {
  ADMIN: {
    nameAr: 'مدير النظام الرئيسي (Admin)',
    desc: 'وصول شامل لكافة الوظائف، الموديولات، تهيئة الصلاحيات، وإدارة المستخدمين',
    badgeColor: 'bg-rose-50 text-rose-700 border-rose-200',
    iconName: 'ShieldCheck'
  },
  ACCOUNTANT: {
    nameAr: 'محاسب مالي عام (Accountant)',
    desc: 'القيود المحاسبية، دفتر الأستاذ، الذمم المدينة والدائنة، الخزينة، والتقارير المالية',
    badgeColor: 'bg-blue-50 text-blue-700 border-blue-200',
    iconName: 'BookOpen'
  },
  CASHIER: {
    nameAr: 'كاشير ومبيعات (POS)',
    desc: 'واجهة نقاط البيع المباشرة، الكاشير وإصدار الفواتير والباركود',
    badgeColor: 'bg-amber-50 text-amber-700 border-amber-200',
    iconName: 'Store'
  },
  PROCUREMENT: {
    nameAr: 'مشتريات ومخازن (Procurement)',
    desc: 'إدارة طلبات الشراء، أوامر التوريد، استلام البضائع والمستودعات',
    badgeColor: 'bg-purple-50 text-purple-700 border-purple-200',
    iconName: 'ShoppingBag'
  },
  HR: {
    nameAr: 'موارد بشرية ورواتب (HR)',
    desc: 'شؤون الموظفين، مسير الرواتب والأجور، والإجازات والسلف',
    badgeColor: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    iconName: 'UserCheck'
  },
  AUDITOR: {
    nameAr: 'مدقق ومراجع مالي (Auditor)',
    desc: 'مراجعة الدفاتر المحاسبية، تدقيق العمليات، والاطلاع على سجلات الأمان',
    badgeColor: 'bg-teal-50 text-teal-700 border-teal-200',
    iconName: 'CheckCheck'
  },
  VIEWER: {
    nameAr: 'مستعرض تقارير (Viewer)',
    desc: 'استعراض التقارير والقوائم المالية ولوحات العرض فقط دون إمكانية التعديل',
    badgeColor: 'bg-slate-100 text-slate-700 border-slate-200',
    iconName: 'Eye'
  }
};

export const DEFAULT_MODULE_KEYS = [
  { key: 'accounts-receivable', nameAr: 'المبيعات والعملاء (AR)' },
  { key: 'procurement', nameAr: 'المشتريات والموردين (PUR / AP)' },
  { key: 'inventory', nameAr: 'المخزون والمستودعات (MM)' },
  { key: 'general-ledger', nameAr: 'الأستاذ العام والقيود (GL)' },
  { key: 'pos', nameAr: 'نقاط البيع والكاشير (POS)' },
  { key: 'hr-payroll', nameAr: 'الموارد البشرية والرواتب (HR)' },
  { key: 'bank-reconciliation', nameAr: 'الخزينة والتسويات البنكية (Cash)' },
  { key: 'foreign-exchange', nameAr: 'الصرافة والتحويلات (FX)' },
  { key: 'financial-reports', nameAr: 'التقارير والقوائم المالية (Reports)' },
  { key: 'settings', nameAr: 'إعدادات وتهيئة النظام (SPRO)' },
  { key: 'role-management', nameAr: 'إدارة الصلاحيات والأمان (SU01)' },
];

export const ROLE_PERMISSIONS: Record<string, string[]> = {
  ADMIN: ['*'],
  ACCOUNTANT: [
    'general-ledger',
    'chart-of-accounts',
    'expenses-revenues',
    'accounts-receivable',
    'accounts-payable',
    'fixed-assets',
    'controlling',
    'bank-reconciliation',
    'financial-reports',
    'foreign-exchange',
    'e-invoicing',
    'settings'
  ],
  CASHIER: [
    'pos',
    'expenses-revenues',
    'foreign-exchange',
    'e-invoicing'
  ],
  PROCUREMENT: [
    'inventory',
    'procurement',
    'accounts-payable'
  ],
  HR: [
    'hr-payroll'
  ],
  AUDITOR: [
    'general-ledger',
    'financial-reports',
    'foreign-exchange',
    'accounts-receivable',
    'accounts-payable',
    'inventory',
    'launchpad'
  ],
  VIEWER: [
    'financial-reports',
    'foreign-exchange',
    'launchpad'
  ]
};


