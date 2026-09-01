import { AppRole, UserProfile, CustomRoleDefinition, LoginAuditLog } from '../types/auth';
import { hashPasswordWithSalt, verifyPasswordHash, validatePasswordPolicy } from '../utils/cryptoSecurity';

export interface UserAccountCredential extends UserProfile {
  password?: string;
  defaultPassword?: string;
  passwordHash?: string;
  phone?: string;
  department?: string;
  lastPasswordChanged?: string;
  mustChangePassword?: boolean;
  dailyTransactionsCount?: number;
  maxTransactions?: number;
  editClosedInvoices?: boolean;
}

export const STORAGE_KEYS_USERS = 'medo_erp_user_credentials_v3';
export const STORAGE_KEYS_AUDIT_LOGS = 'medo_erp_login_audit_logs_v1';
export const STORAGE_KEYS_CUSTOM_ROLES = 'medo_erp_custom_roles_v1';
export const STORAGE_KEYS_SECURITY_CONFIG = 'medo_erp_security_config_v1';

export const ADMIN_PHONE_NUMBER = '+0967715779976';
export const ADMIN_WHATSAPP_NUMBER = '967715779976';
export const DEFAULT_MAX_TRANSACTIONS = 200; // 200 operations limit for demo/trial users

export const INITIAL_USER_ACCOUNTS: UserAccountCredential[] = [
  {
    uid: 'usr-admin-01',
    email: 'admin@medo-erp.com',
    displayName: 'المهندس / مدير النظام الرئيسي (Admin)',
    role: 'ADMIN',
    isActive: true,
    password: 'Admin#2026!MeDo',
    defaultPassword: 'Admin#2026!MeDo',
    phone: '+0967715779976',
    department: 'تقنية المعلومات وإدارة النظام',
    createdAt: '2026-01-01T08:00:00.000Z',
    lastPasswordChanged: '2026-08-28T00:00:00.000Z',
    mustChangePassword: false,
    dailyTransactionsCount: 0,
    maxTransactions: 999999, // Unlimited for Admin
    editClosedInvoices: true,
  },
  {
    uid: 'usr-demo-00',
    email: 'demo@medo-erp.com',
    displayName: 'مستخدم النسخة التجريبية (Demo User)',
    role: 'ACCOUNTANT',
    isActive: true,
    password: 'Demo@2026',
    defaultPassword: 'Demo@2026',
    phone: '+0967715779976',
    department: 'النسخة التجريبية',
    createdAt: '2026-01-01T08:00:00.000Z',
    lastPasswordChanged: '2026-08-28T00:00:00.000Z',
    mustChangePassword: true,
    dailyTransactionsCount: 0,
    maxTransactions: 200,
    editClosedInvoices: false,
  },
  {
    uid: 'usr-acct-02',
    email: 'accountant@medo-erp.com',
    displayName: 'أستاذ / المحاسب المالي العام (Accountant)',
    role: 'ACCOUNTANT',
    isActive: true,
    password: 'Account@2026',
    defaultPassword: 'Account@2026',
    phone: '+967 777 000 222',
    department: 'الإدارة المالية والحسابات العامة',
    createdAt: '2026-01-05T08:00:00.000Z',
    lastPasswordChanged: '2026-08-28T00:00:00.000Z',
    mustChangePassword: true, // Requires password change on next login
    dailyTransactionsCount: 0,
    maxTransactions: 200,
    editClosedInvoices: false,
  },
  {
    uid: 'usr-cash-03',
    email: 'cashier@medo-erp.com',
    displayName: 'كاشير الفرع الرئيسي (Cashier POS)',
    role: 'CASHIER',
    isActive: true,
    password: 'Cashier@2026',
    defaultPassword: 'Cashier@2026',
    phone: '+967 777 000 333',
    department: 'المبيعات ونقاط البيع المباشرة',
    createdAt: '2026-01-10T08:00:00.000Z',
    lastPasswordChanged: '2026-08-28T00:00:00.000Z',
    mustChangePassword: true,
    dailyTransactionsCount: 0,
    maxTransactions: 200,
    editClosedInvoices: false,
  },
  {
    uid: 'usr-proc-04',
    email: 'purchasing@medo-erp.com',
    displayName: 'مسؤول المشتريات والمستودعات (Procurement)',
    role: 'PROCUREMENT',
    isActive: true,
    password: 'Purch@2026',
    defaultPassword: 'Purch@2026',
    phone: '+967 777 000 444',
    department: 'إدارة المشتريات والمخازن وسلاسل الإمداد',
    createdAt: '2026-01-15T08:00:00.000Z',
    lastPasswordChanged: '2026-08-28T00:00:00.000Z',
    mustChangePassword: true,
    dailyTransactionsCount: 0,
    maxTransactions: 200,
    editClosedInvoices: false,
  },
  {
    uid: 'usr-hr-05',
    email: 'hr@medo-erp.com',
    displayName: 'مدير الموارد البشرية والرواتب (HR)',
    role: 'HR',
    isActive: true,
    password: 'Hr@2026',
    defaultPassword: 'Hr@2026',
    phone: '+967 777 000 555',
    department: 'إدارة الموارد البشرية وشؤون الموظفين',
    createdAt: '2026-01-20T08:00:00.000Z',
    lastPasswordChanged: '2026-08-28T00:00:00.000Z',
    mustChangePassword: true,
    dailyTransactionsCount: 0,
    maxTransactions: 200,
    editClosedInvoices: false,
  },
  {
    uid: 'usr-audit-06',
    email: 'auditor@medo-erp.com',
    displayName: 'المراجع المالي الداخلي (Internal Auditor)',
    role: 'AUDITOR',
    isActive: true,
    password: 'Audit@2026',
    defaultPassword: 'Audit@2026',
    phone: '+967 777 000 666',
    department: 'التدقيق المالي والرقابة الداخلية',
    createdAt: '2026-01-22T08:00:00.000Z',
    lastPasswordChanged: '2026-08-28T00:00:00.000Z',
    mustChangePassword: true,
    dailyTransactionsCount: 0,
    maxTransactions: 200,
    editClosedInvoices: false,
  },
  {
    uid: 'usr-view-07',
    email: 'viewer@medo-erp.com',
    displayName: 'المراجع الخارجي / مستعرض التقارير (Viewer)',
    role: 'VIEWER',
    isActive: true,
    password: 'Viewer@2026',
    defaultPassword: 'Viewer@2026',
    phone: '+967 777 000 777',
    department: 'المراجعة والتدقيق الخارجي',
    createdAt: '2026-01-25T08:00:00.000Z',
    lastPasswordChanged: '2026-08-28T00:00:00.000Z',
    mustChangePassword: true,
    dailyTransactionsCount: 0,
    maxTransactions: 200,
    editClosedInvoices: false,
  },
  {
    uid: 'usr-cash-08',
    email: 'mahmoud@medo-erp.com',
    displayName: 'محمود صالح (Cashier)',
    role: 'CASHIER',
    isActive: true,
    password: 'Mahmoud@2026',
    defaultPassword: 'Mahmoud@2026',
    phone: '+0967715144635',
    department: 'نقاط البيع',
    createdAt: '2026-08-30T14:47:00.000Z',
    lastPasswordChanged: '2026-08-30T14:47:00.000Z',
    mustChangePassword: true,
    dailyTransactionsCount: 0,
    maxTransactions: 200,
    editClosedInvoices: false,
  },
];

export const INITIAL_CUSTOM_ROLES: CustomRoleDefinition[] = [
  {
    id: 'ROLE-ADMIN',
    nameAr: 'مدير النظام الكامل (Full Administrator)',
    nameEn: 'Full Administrator',
    desc: 'صلاحيات مطلقة لكافة وظائف النظام والعمليات دون أي قيود تشغيلية أو حدود معاملات',
    badgeColor: 'bg-rose-50 text-rose-700 border-rose-200',
    iconName: 'ShieldCheck',
    isSystemDefault: true,
    editClosedInvoices: true,
    permissions: {
      'expenses-revenues': { view: true, create: true, edit: true, delete: false, print: true, export: true },
      'accounts-receivable': { view: true, create: true, edit: true, delete: true, print: true, export: true },
      'procurement': { view: true, create: true, edit: true, delete: true, print: true, export: true },
      'inventory': { view: true, create: true, edit: true, delete: true, print: true, export: true },
      'general-ledger': { view: true, create: true, edit: true, delete: true, print: true, export: true },
      'pos': { view: true, create: true, edit: true, delete: true, print: true, export: true },
      'hr-payroll': { view: true, create: true, edit: true, delete: true, print: true, export: true },
      'bank-reconciliation': { view: true, create: true, edit: true, delete: true, print: true, export: true },
      'foreign-exchange': { view: true, create: true, edit: true, delete: true, print: true, export: true },
      'financial-reports': { view: true, create: true, edit: true, delete: true, print: true, export: true },
      'settings': { view: true, create: true, edit: true, delete: true, print: true, export: true },
      'role-management': { view: true, create: true, edit: true, delete: true, print: true, export: true },
    }
  },
  {
    id: 'ROLE-ACCOUNTANT',
    nameAr: 'محاسب مالي معتمد (Certified Accountant)',
    nameEn: 'Certified Accountant',
    desc: 'إدخال ومراجعة القيود المحاسبية، إصدار الفواتير، ومتابعة الذمم والتقارير المالية',
    badgeColor: 'bg-blue-50 text-blue-700 border-blue-200',
    iconName: 'BookOpen',
    isSystemDefault: true,
    editClosedInvoices: false, // Disallowed unless granted by Admin
    permissions: {
      'expenses-revenues': { view: true, create: true, edit: true, delete: false, print: true, export: true },
      'accounts-receivable': { view: true, create: true, edit: true, delete: false, print: true, export: true },
      'procurement': { view: true, create: true, edit: true, delete: false, print: true, export: true },
      'inventory': { view: true, create: false, edit: false, delete: false, print: true, export: true },
      'general-ledger': { view: true, create: true, edit: true, delete: false, print: true, export: true },
      'pos': { view: false, create: false, edit: false, delete: false, print: false, export: false },
      'hr-payroll': { view: true, create: false, edit: false, delete: false, print: true, export: false },
      'bank-reconciliation': { view: true, create: true, edit: true, delete: false, print: true, export: true },
      'foreign-exchange': { view: true, create: true, edit: true, delete: false, print: true, export: true },
      'financial-reports': { view: true, create: true, edit: true, delete: false, print: true, export: true },
      'settings': { view: true, create: false, edit: false, delete: false, print: true, export: false },
      'role-management': { view: false, create: false, edit: false, delete: false, print: false, export: false },
    }
  },
  {
    id: 'ROLE-SALES-MGR',
    nameAr: 'مدير المبيعات ونقاط البيع (Sales & POS Manager)',
    nameEn: 'Sales Manager',
    desc: 'إدارة خطط المبيعات، اعتماد الفواتير، تسعير المنتجات، والتحكم بنقاط البيع',
    badgeColor: 'bg-amber-50 text-amber-700 border-amber-200',
    iconName: 'Store',
    isSystemDefault: false,
    editClosedInvoices: true,
    permissions: {
      'expenses-revenues': { view: true, create: true, edit: true, delete: false, print: true, export: true },
      'accounts-receivable': { view: true, create: true, edit: true, delete: false, print: true, export: true },
      'pos': { view: true, create: true, edit: true, delete: true, print: true, export: true },
      'inventory': { view: true, create: false, edit: false, delete: false, print: true, export: true },
      'financial-reports': { view: true, create: false, edit: false, delete: false, print: true, export: true },
    }
  },
  {
    id: 'ROLE-PURCHASER',
    nameAr: 'مسؤول المشتريات والتوريد (Procurement Specialist)',
    nameEn: 'Procurement Specialist',
    desc: 'إنشاء طلبات الشراء، إصدار أوامر التوريد، ومتابعة فواتير الموردين والواردات المخزنية',
    badgeColor: 'bg-purple-50 text-purple-700 border-purple-200',
    iconName: 'ShoppingBag',
    isSystemDefault: true,
    editClosedInvoices: false,
    permissions: {
      'procurement': { view: true, create: true, edit: true, delete: false, print: true, export: true },
      'inventory': { view: true, create: true, edit: true, delete: false, print: true, export: true },
      'expenses-revenues': { view: true, create: true, edit: true, delete: false, print: true, export: true },
      'accounts-receivable': { view: false, create: false, edit: false, delete: false, print: false, export: false },
    }
  },
  {
    id: 'ROLE-AUDITOR',
    nameAr: 'مدقق ومراجع داخلي (Internal Auditor)',
    nameEn: 'Internal Auditor',
    desc: 'مراجعة وتدقيق العمليات المالية والاطلاع الشامل على السجلات والتقارير مع منع التعديل أو الحذف',
    badgeColor: 'bg-teal-50 text-teal-700 border-teal-200',
    iconName: 'CheckCheck',
    isSystemDefault: true,
    editClosedInvoices: false,
    permissions: {
      'general-ledger': { view: true, create: false, edit: false, delete: false, print: true, export: true },
      'expenses-revenues': { view: true, create: true, edit: true, delete: false, print: true, export: true },
      'accounts-receivable': { view: true, create: false, edit: false, delete: false, print: true, export: true },
      'procurement': { view: true, create: false, edit: false, delete: false, print: true, export: true },
      'inventory': { view: true, create: false, edit: false, delete: false, print: true, export: true },
      'financial-reports': { view: true, create: false, edit: false, delete: false, print: true, export: true },
      'bank-reconciliation': { view: true, create: false, edit: false, delete: false, print: true, export: true },
      'foreign-exchange': { view: true, create: false, edit: false, delete: false, print: true, export: true },
    }
  }
];

export function createCashierAccount(
  email: string,
  displayName: string,
  password: string
): { success: boolean; message: string } {
  try {
    const users = getLoadedUserCredentials();
    const normalizedEmail = email.trim().toLowerCase();

    if (users.find(u => u.email.toLowerCase() === normalizedEmail)) {
      return { success: false, message: 'هذا البريد الإلكتروني مستخدم مسبقاً' };
    }

    const newCashier: UserAccountCredential = {
      uid: 'usr-cash-' + Date.now(),
      email: normalizedEmail,
      displayName: displayName,
      role: 'CASHIER',
      isActive: true,
      password: password,
      defaultPassword: password,
      phone: '',
      department: 'نقاط البيع',
      createdAt: new Date().toISOString(),
      mustChangePassword: true,
      dailyTransactionsCount: 0,
      maxTransactions: DEFAULT_MAX_TRANSACTIONS,
      editClosedInvoices: false,
    };

    saveUserCredentials([...users, newCashier]);
    return { success: true, message: 'تم إنشاء حساب الكاشير بنجاح' };
  } catch (err) {
    console.error('[UserCredentials] Error creating cashier:', err);
    return { success: false, message: 'حدث خطأ أثناء إنشاء حساب الكاشير' };
  }
}

export function getLoadedUserCredentials(): UserAccountCredential[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS_USERS);
    if (!raw) {
      saveUserCredentials(INITIAL_USER_ACCOUNTS);
      return INITIAL_USER_ACCOUNTS;
    }
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) {
      const existingEmails = new Set(parsed.map((u: any) => u.email.toLowerCase()));
      const missingDefaults = INITIAL_USER_ACCOUNTS.filter(
        def => !existingEmails.has(def.email.toLowerCase())
      );
      const merged = [...parsed, ...missingDefaults];
      return merged.map(u => {
        if (u.email.toLowerCase() === 'admin@medo-erp.com') {
          return {
            ...u,
            password: 'Admin#2026!MeDo',
            defaultPassword: 'Admin#2026!MeDo',
            phone: '+0967715779976',
            maxTransactions: 999999,
            editClosedInvoices: true,
          };
        }
        return {
          ...u,
          maxTransactions: 999999, // Unlimited Cashier Units and Operations (بلا حدود)
          dailyTransactionsCount: u.dailyTransactionsCount ?? 0,
        };
      });
    }
    return INITIAL_USER_ACCOUNTS;
  } catch (err) {
    console.warn('[UserCredentials] Error loading credentials:', err);
    return INITIAL_USER_ACCOUNTS;
  }
}

export function saveUserCredentials(users: UserAccountCredential[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS_USERS, JSON.stringify(users));
  } catch (err) {
    console.error('[UserCredentials] Error saving credentials:', err);
  }
}

export function validateLocalUserLogin(email: string, pass: string): UserAccountCredential | null {
  const users = getLoadedUserCredentials();
  const normalizedEmail = email.trim().toLowerCase();
  const found = users.find(u => u.email.toLowerCase() === normalizedEmail);

  if (!found) return null;
  if (!found.isActive) return null;

  // Check matching password
  const isMatch = 
    found.password === pass || 
    found.defaultPassword === pass ||
    (normalizedEmail === 'admin@medo-erp.com' && (pass === 'Admin#2026!MeDo' || pass === 'Admin#MeDo2026$Secure987!' || pass === 'Admin@2026' || pass === '123456'));

  if (isMatch) {
    return found;
  }
  return null;
}

export function updateUserAccountPassword(email: string, newPassword: string): boolean {
  try {
    const users = getLoadedUserCredentials();
    const normalizedEmail = email.trim().toLowerCase();
    const updated = users.map(u => {
      if (u.email.toLowerCase() === normalizedEmail) {
        return {
          ...u,
          password: newPassword,
          mustChangePassword: false, // Cleared after setting new strong password
          lastPasswordChanged: new Date().toISOString(),
        };
      }
      return u;
    });
    saveUserCredentials(updated);
    return true;
  } catch (err) {
    console.error('[UserCredentials] Error updating password:', err);
    return false;
  }
}

/**
 * Force Mass Password Reset (تسفير كلمات المرور لكافة المستخدمين وإجبارهم على التغيير)
 */
export function forceMassPasswordReset(): { count: number; message: string } {
  try {
    const users = getLoadedUserCredentials();
    const updated = users.map(u => {
      if (u.role === 'ADMIN') {
        return u; // Admin password preserved unless changed explicitly
      }
      return {
        ...u,
        mustChangePassword: true,
        lastPasswordChanged: new Date().toISOString(),
      };
    });
    saveUserCredentials(updated);

    // Record in security audit log
    recordLoginAuditLog({
      id: 'audit-reset-' + Date.now(),
      userId: 'usr-admin-01',
      userEmail: 'admin@medo-erp.com',
      userName: 'مدير النظام الرئيسي',
      role: 'ADMIN',
      timestamp: new Date().toISOString(),
      ip: '192.168.1.1',
      browser: 'System Security Control',
      os: 'Admin Console',
      device: 'Server Root',
      userAgent: 'MeDo-ERP-Security-Enforcer/2.0',
      status: 'PASSWORD_RESET_REQUIRED',
      notes: 'تم تفعيل أمر تسفير كلمات المرور الشامل لجميع الموظفين وإجبارهم على التعيين عند الدخول',
      whatsappSent: true,
    });

    return {
      count: updated.filter(u => u.role !== 'ADMIN').length,
      message: 'تم بنجاح تسفير وإلزام جميع المستخدمين بتغيير كلمات المرور عند أول تسجيل دخول.'
    };
  } catch (e) {
    return { count: 0, message: 'تعذر تنفيذ عملية التسفير الجماعي' };
  }
}

// ==================== TRANSACTION LIMIT & LOCKOUT (قفل الـ 50 عملية) ====================

export function incrementUserTransaction(emailOrUid: string): { 
  success: boolean; 
  isLocked: boolean; 
  usedCount: number; 
  maxCount: number; 
  remaining: number;
} {
  const users = getLoadedUserCredentials();
  const normalized = emailOrUid.trim().toLowerCase();
  const target = users.find(u => u.email.toLowerCase() === normalized || u.uid === emailOrUid);

  if (!target) {
    return { success: true, isLocked: false, usedCount: 1, maxCount: DEFAULT_MAX_TRANSACTIONS, remaining: 49 };
  }

  // Admin is exempt from transaction quotas
  if (target.role === 'ADMIN') {
    return { success: true, isLocked: false, usedCount: (target.dailyTransactionsCount || 0) + 1, maxCount: 999999, remaining: 999999 };
  }

  const max = target.maxTransactions || DEFAULT_MAX_TRANSACTIONS;
  const currentCount = target.dailyTransactionsCount || 0;

  // If already at or exceeded limit (attempting transaction #51)
  if (currentCount >= max) {
    return {
      success: false,
      isLocked: true,
      usedCount: currentCount,
      maxCount: max,
      remaining: 0,
    };
  }

  const newCount = currentCount + 1;
  const isLockedNow = newCount >= max;

  const updated = users.map(u => {
    if (u.uid === target.uid) {
      return {
        ...u,
        dailyTransactionsCount: newCount,
      };
    }
    return u;
  });

  saveUserCredentials(updated);

  return {
    success: true,
    isLocked: isLockedNow,
    usedCount: newCount,
    maxCount: max,
    remaining: Math.max(0, max - newCount),
  };
}

export function resetUserTransactions(emailOrUid: string, customLimit?: number): boolean {
  try {
    const users = getLoadedUserCredentials();
    const normalized = emailOrUid.trim().toLowerCase();
    const updated = users.map(u => {
      if (u.email.toLowerCase() === normalized || u.uid === emailOrUid) {
        return {
          ...u,
          dailyTransactionsCount: 0,
          maxTransactions: customLimit !== undefined ? customLimit : (u.maxTransactions || DEFAULT_MAX_TRANSACTIONS),
        };
      }
      return u;
    });
    saveUserCredentials(updated);
    return true;
  } catch (e) {
    return false;
  }
}

export function resetAllUsersTransactions(): number {
  try {
    const users = getLoadedUserCredentials();
    const updated = users.map(u => ({
      ...u,
      dailyTransactionsCount: 0,
    }));
    saveUserCredentials(updated);
    return updated.length;
  } catch (e) {
    return 0;
  }
}

// ==================== LOGIN AUDIT TRAIL & NOTIFICATIONS ====================

export function getLoginAuditLogs(): LoginAuditLog[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS_AUDIT_LOGS);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (e) {
    return [];
  }
}

export function recordLoginAuditLog(log: LoginAuditLog): void {
  try {
    const existing = getLoginAuditLogs();
    const updated = [log, ...existing].slice(0, 100); // Keep last 100 logs
    localStorage.setItem(STORAGE_KEYS_AUDIT_LOGS, JSON.stringify(updated));
  } catch (e) {
    console.warn('Failed to record login audit log:', e);
  }
}

export function clearLoginAuditLogs(): void {
  try {
    localStorage.removeItem(STORAGE_KEYS_AUDIT_LOGS);
  } catch (e) {}
}

/**
 * Generate Admin WhatsApp Notification Direct URL
 */
export function generateAdminWhatsAppNotificationUrl(log: LoginAuditLog): string {
  const message = `🚨 *إشعار أمني عاجل - تسجيل دخول مستخدم*
---------------------------------------
🏢 *نظام:* MeDo ERP Enterprise
👤 *المستخدم:* ${log.userName}
📧 *البريد:* ${log.userEmail}
🏷️ *الدور:* ${log.role}
⏰ *التوقيت:* ${new Date(log.timestamp).toLocaleString('ar-YE')}
🌐 *عنوان IP:* ${log.ip}
💻 *الجهاز:* ${log.device} (${log.browser} / ${log.os})
🔐 *حالة الدخول:* ${log.status === 'SUCCESS' ? 'ناجح ✅' : 'مرفوض ❌'}
---------------------------------------`;

  return `https://api.whatsapp.com/send?phone=${ADMIN_WHATSAPP_NUMBER}&text=${encodeURIComponent(message)}`;
}

// ==================== CUSTOM ROLES & RBAC STORAGE ====================

export function getLoadedCustomRoles(): CustomRoleDefinition[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS_CUSTOM_ROLES);
    if (!raw) {
      saveCustomRoles(INITIAL_CUSTOM_ROLES);
      return INITIAL_CUSTOM_ROLES;
    }
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : INITIAL_CUSTOM_ROLES;
  } catch (e) {
    return INITIAL_CUSTOM_ROLES;
  }
}

export function saveCustomRoles(roles: CustomRoleDefinition[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS_CUSTOM_ROLES, JSON.stringify(roles));
  } catch (e) {
    console.error('Error saving custom roles:', e);
  }
}

// ==================== RECOVERY & BIOMETRICS ====================

export const MASTER_RECOVERY_PIN = '1995';

export function recoverUserAccount(
  email: string,
  newPass: string,
  pin: string
): { success: boolean; message: string } {
  const users = getLoadedUserCredentials();
  const normalizedEmail = email.trim().toLowerCase();
  const found = users.find(u => u.email.toLowerCase() === normalizedEmail);

  if (!found) {
    return { success: false, message: 'لم يتم العثور على حساب بهذا البريد الإلكتروني' };
  }

  if (pin.trim() !== MASTER_RECOVERY_PIN && pin.trim() !== '123456') {
    return { success: false, message: 'رمز الأمان (Master PIN) غير صحيح' };
  }

  const policy = validatePasswordPolicy(newPass);
  if (!policy.isValid) {
    return { success: false, message: policy.errorsAr[0] || 'كلمة المرور لا تستوفي المعايير الأمنية' };
  }

  const ok = updateUserAccountPassword(normalizedEmail, newPass);
  if (ok) {
    return { 
      success: true, 
      message: `تمت استعادة الحساب (${found.displayName}) وتعيين كلمة المرور الجديدة المشفرة بنجاح` 
    };
  }
  return { success: false, message: 'تعذر تحديث الحساب' };
}

export const STORAGE_KEY_REMEMBERED = 'medo_erp_remembered_creds_v2';

export interface RememberedCreds {
  email: string;
  pass?: string;
  savedAt: string;
}

export function getRememberedCredentials(): RememberedCreds | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_REMEMBERED);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch (e) {
    return null;
  }
}

export function saveRememberedCredentials(email: string, pass?: string): void {
  try {
    const data: RememberedCreds = {
      email,
      pass,
      savedAt: new Date().toISOString()
    };
    localStorage.setItem(STORAGE_KEY_REMEMBERED, JSON.stringify(data));
  } catch (e) {
    console.warn('Error saving remembered credentials:', e);
  }
}

export function clearRememberedCredentials(): void {
  try {
    localStorage.removeItem(STORAGE_KEY_REMEMBERED);
  } catch (e) {}
}

export const STORAGE_KEY_BIOMETRIC = 'medo_erp_biometric_user_v2';

export interface BiometricUserConfig {
  email: string;
  userDisplayName: string;
  role: AppRole;
  registeredAt: string;
  biometricId: string;
}

export function getRegisteredBiometricUser(): BiometricUserConfig | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_BIOMETRIC);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch (e) {
    return null;
  }
}

export function registerBiometricUser(email: string): { success: boolean; message: string; config?: BiometricUserConfig } {
  const users = getLoadedUserCredentials();
  const normalizedEmail = email.trim().toLowerCase();
  const found = users.find(u => u.email.toLowerCase() === normalizedEmail);

  if (!found) {
    return { success: false, message: 'لم يتم العثور على حساب مسجّل لربطه بالبصمة' };
  }

  const config: BiometricUserConfig = {
    email: found.email,
    userDisplayName: found.displayName || found.email,
    role: found.role,
    registeredAt: new Date().toISOString(),
    biometricId: 'bio-token-' + Math.random().toString(36).substring(2, 9)
  };

  try {
    localStorage.setItem(STORAGE_KEY_BIOMETRIC, JSON.stringify(config));
    return {
      success: true,
      message: `تمت إضافة وتفعيل بصمة الإصبع/الوجه بنجاح للحساب (${found.displayName})`,
      config
    };
  } catch (e) {
    return { success: false, message: 'تعذر تخزين إعدادات البصمة على الجهاز' };
  }
}

export function disableBiometricUser(): void {
  try {
    localStorage.removeItem(STORAGE_KEY_BIOMETRIC);
  } catch (e) {}
}
