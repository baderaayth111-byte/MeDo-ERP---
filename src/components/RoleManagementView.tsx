import React, { useEffect, useState } from 'react';
import { 
  ShieldAlert, 
  User, 
  Check, 
  X, 
  ShieldCheck, 
  UserPlus, 
  Search, 
  Filter, 
  Users, 
  CheckCircle2, 
  XCircle, 
  Lock, 
  KeyRound,
  Zap,
  Info,
  Eye,
  EyeOff,
  Edit3,
  RotateCcw,
  Trash2,
  Copy,
  CheckCheck,
  Building,
  Phone,
  Mail,
  Shield,
  Sparkles,
  RefreshCw,
  Sliders,
  FileSpreadsheet,
  Printer,
  FilePlus2,
  History,
  MessageSquare,
  ExternalLink,
  Download,
  AlertTriangle,
  PlusCircle
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { UserProfile, AppRole, ROLE_LABELS, CustomRoleDefinition, ModuleActionPermissions } from '../types/auth';
import { 
  UserAccountCredential, 
  getLoadedUserCredentials, 
  saveUserCredentials, 
  getLoadedCustomRoles,
  saveCustomRoles,
  INITIAL_USER_ACCOUNTS,
  INITIAL_CUSTOM_ROLES,
  getLoginAuditLogs,
  clearLoginAuditLogs,
  generateAdminWhatsAppNotificationUrl,
  resetUserTransactions,
  resetAllUsersTransactions,
  ADMIN_PHONE_NUMBER,
  DEFAULT_MAX_TRANSACTIONS
} from '../data/userCredentials';
import { validatePasswordPolicy } from '../utils/cryptoSecurity';

export const RoleManagementView: React.FC = () => {
  const { profile, changePassword, refreshUserAccounts, triggerMassPasswordReset } = useAuth();
  const [activeTab, setActiveTab] = useState<'USERS' | 'ROLES' | 'AUDIT'>('USERS');
  
  // Users state
  const [users, setUsers] = useState<UserAccountCredential[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('ALL');
  const [copiedUid, setCopiedUid] = useState<string | null>(null);

  // Custom Roles state
  const [customRoles, setCustomRoles] = useState<CustomRoleDefinition[]>([]);
  const [selectedRoleForEdit, setSelectedRoleForEdit] = useState<CustomRoleDefinition | null>(null);
  const [isRoleModalOpen, setIsRoleModalOpen] = useState(false);

  // Security Audit state
  const [auditLogs, setAuditLogs] = useState(() => getLoginAuditLogs());

  // Password Change Modal State
  const [passwordModalUser, setPasswordModalUser] = useState<UserAccountCredential | null>(null);
  const [newPasswordValue, setNewPasswordValue] = useState('');
  const [showPasswordText, setShowPasswordText] = useState(false);
  const [passwordSuccessMessage, setPasswordSuccessMessage] = useState('');
  const [passwordErrorMessage, setPasswordErrorMessage] = useState('');

  // Add / Edit User Modal state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<UserAccountCredential | null>(null);
  const [formDisplayName, setFormDisplayName] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formRole, setFormRole] = useState<AppRole>('ACCOUNTANT');
  const [formPhone, setFormPhone] = useState('');
  const [formDepartment, setFormDepartment] = useState('');
  const [formPassword, setFormPassword] = useState('');
  const [formEditClosedInvoices, setFormEditClosedInvoices] = useState(false);
  const [formMaxTransactions, setFormMaxTransactions] = useState(50);

  // Delete User Modal
  const [deleteTargetUser, setDeleteTargetUser] = useState<UserAccountCredential | null>(null);

  // Notification Banner
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  useEffect(() => {
    fetchUsers();
    setCustomRoles(getLoadedCustomRoles());
    setAuditLogs(getLoginAuditLogs());
  }, []);

  const fetchUsers = () => {
    setLoading(true);
    try {
      const localCreds = getLoadedUserCredentials();
      setUsers(localCreds);
    } catch (err) {
      console.warn('Error loading users:', err);
    } finally {
      setLoading(false);
    }
  };

  const updateUserRole = (uid: string, updatedRole: AppRole) => {
    const updated = users.map(u => u.uid === uid ? { ...u, role: updatedRole } : u);
    setUsers(updated);
    saveUserCredentials(updated);
    refreshUserAccounts();
    showToast('تم تحديث دور المستخدم بنجاح');
  };

  const toggleUserStatus = (uid: string, currentStatus: boolean) => {
    if (uid === profile?.uid) {
      alert('لا يمكنك إيقاف حسابك الحالي بنفسك!');
      return;
    }
    const updated = users.map(u => u.uid === uid ? { ...u, isActive: !currentStatus } : u);
    setUsers(updated);
    saveUserCredentials(updated);
    refreshUserAccounts();
    showToast(!currentStatus ? 'تم تفعيل الحساب' : 'تم إيقاف الحساب');
  };

  const toggleEditClosedInvoices = (uid: string, currentValue: boolean) => {
    const updated = users.map(u => u.uid === uid ? { ...u, editClosedInvoices: !currentValue } : u);
    setUsers(updated);
    saveUserCredentials(updated);
    refreshUserAccounts();
    showToast(!currentValue ? 'تم منح صلاحية تعديل الفواتير المغلقة' : 'تم سحب صلاحية تعديل الفواتير المغلقة');
  };

  const handleResetUserQuota = (emailOrUid: string) => {
    resetUserTransactions(emailOrUid, DEFAULT_MAX_TRANSACTIONS);
    fetchUsers();
    refreshUserAccounts();
    showToast('تم تجديد وتفعيل الرصيد التشغيلي للكاشير بدون أي قيود أو حدود (غير محدود ♾️)');
  };

  const handleResetAllQuotas = () => {
    if (window.confirm('هل ترغب في تجديد وتفعيل الرصيد التشغيلي لكافة مستخدمي الكاشير والنظام بلا حدود؟')) {
      resetAllUsersTransactions();
      fetchUsers();
      refreshUserAccounts();
      showToast('تم فتح ورسخ سعة العمليات لكافة الحسابات بلا حدود (غير محدود ♾️)');
    }
  };

  const handleMassPasswordReset = () => {
    if (window.confirm('🚨 تحذير أمني: هل أنت متأكد من رغبتك في تسفير كلمات المرور لكافة المستخدمين وإلزامهم بتعيين كلمة مرور مشفرة عند أول تسجيل دخول؟')) {
      const res = triggerMassPasswordReset();
      fetchUsers();
      setAuditLogs(getLoginAuditLogs());
      showToast(`تم بنجاح تسفير وإلزام (${res.count}) مستخدم بتغيير كلمات المرور`);
    }
  };

  const handleOpenPasswordModal = (user: UserAccountCredential) => {
    setPasswordModalUser(user);
    setNewPasswordValue('');
    setPasswordSuccessMessage('');
    setPasswordErrorMessage('');
  };

  const handleSavePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!passwordModalUser) return;
    
    const policy = validatePasswordPolicy(newPasswordValue);
    if (!policy.isValid) {
      setPasswordErrorMessage(policy.errorsAr[0] || 'كلمة المرور يجب أن تستوفي المعايير الأمنية');
      return;
    }

    const res = await changePassword(newPasswordValue, passwordModalUser.email);
    if (res.success) {
      setPasswordSuccessMessage(`تم تغيير وتشفير كلمة المرور للمستخدم (${passwordModalUser.displayName}) بنجاح!`);
      fetchUsers();
      setTimeout(() => {
        setPasswordModalUser(null);
        setPasswordSuccessMessage('');
      }, 1500);
    } else {
      setPasswordErrorMessage(res.message || 'حدث خطأ أثناء تحديث كلمة المرور');
    }
  };

  const handleOpenAddModal = () => {
    setEditingUser(null);
    setFormDisplayName('');
    setFormEmail('');
    setFormRole('ACCOUNTANT');
    setFormPhone('');
    setFormDepartment('الإدارة المالية والحسابات');
    setFormPassword('');
    setFormEditClosedInvoices(false);
    setFormMaxTransactions(999999);
    setIsAddModalOpen(true);
  };

  const handleOpenEditModal = (u: UserAccountCredential) => {
    setEditingUser(u);
    setFormDisplayName(u.displayName || '');
    setFormEmail(u.email);
    setFormRole(u.role);
    setFormPhone(u.phone || '');
    setFormDepartment(u.department || '');
    setFormPassword(u.password || u.defaultPassword || '');
    setFormEditClosedInvoices(!!u.editClosedInvoices);
    setFormMaxTransactions(u.maxTransactions ?? 999999);
    setIsAddModalOpen(true);
  };

  const handleSaveUserForm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formDisplayName.trim() || !formEmail.trim()) {
      alert('يرجى كتابة الاسم والبريد الإلكتروني');
      return;
    }

    if (editingUser) {
      const updated = users.map(u => {
        if (u.uid === editingUser.uid) {
          return {
            ...u,
            displayName: formDisplayName.trim(),
            email: formEmail.trim(),
            role: formRole,
            phone: formPhone.trim(),
            department: formDepartment.trim(),
            password: formPassword.trim() || u.password || 'Account@2026',
            editClosedInvoices: formRole === 'ADMIN' ? true : formEditClosedInvoices,
            maxTransactions: formRole === 'ADMIN' ? 999999 : Number(formMaxTransactions),
            lastPasswordChanged: new Date().toISOString()
          };
        }
        return u;
      });

      setUsers(updated);
      saveUserCredentials(updated);
      refreshUserAccounts();
      showToast('تم تحديث بيانات المستخدم بنجاح');
    } else {
      const newUserObj: UserAccountCredential = {
        uid: 'usr-' + Date.now(),
        displayName: formDisplayName.trim(),
        email: formEmail.trim(),
        role: formRole,
        phone: formPhone.trim() || '+967 770 000 000',
        department: formDepartment.trim() || 'إدارة العمليات',
        isActive: true,
        password: formPassword.trim() || 'Account@2026',
        defaultPassword: formPassword.trim() || 'Account@2026',
        createdAt: new Date().toISOString(),
        lastPasswordChanged: new Date().toISOString(),
        mustChangePassword: true, // Force change on first login
        dailyTransactionsCount: 0,
        maxTransactions: formRole === 'ADMIN' ? 999999 : Number(formMaxTransactions),
        editClosedInvoices: formRole === 'ADMIN' ? true : formEditClosedInvoices,
      };

      const updated = [newUserObj, ...users];
      setUsers(updated);
      saveUserCredentials(updated);
      refreshUserAccounts();
      showToast('تمت إضافة المستخدم الجديد وإلزامه بتغيير كلمة المرور عند الدخول');
    }

    setIsAddModalOpen(false);
    setEditingUser(null);
  };

  const handleDeleteUser = () => {
    if (!deleteTargetUser) return;
    if (deleteTargetUser.uid === profile?.uid) {
      alert('لا يمكنك حذف حسابك الحالي!');
      setDeleteTargetUser(null);
      return;
    }

    const updated = users.filter(u => u.uid !== deleteTargetUser.uid);
    setUsers(updated);
    saveUserCredentials(updated);
    refreshUserAccounts();
    setDeleteTargetUser(null);
    showToast('تم حذف المستخدم من النظام');
  };

  // Custom Roles Management handlers
  const handleToggleModuleAction = (roleId: string, moduleKey: string, action: keyof ModuleActionPermissions) => {
    const updatedRoles = customRoles.map(r => {
      if (r.id === roleId) {
        const perms = { ...r.permissions };
        const currentMod = perms[moduleKey] || { view: false, create: false, edit: false, delete: false, print: false, export: false };
        perms[moduleKey] = {
          ...currentMod,
          [action]: !currentMod[action]
        };
        return { ...r, permissions: perms };
      }
      return r;
    });
    setCustomRoles(updatedRoles);
    saveCustomRoles(updatedRoles);
    showToast('تم تحديث مصفوفة الصلاحيات');
  };

  const handleToggleRoleClosedInvoices = (roleId: string) => {
    const updatedRoles = customRoles.map(r => {
      if (r.id === roleId) {
        return { ...r, editClosedInvoices: !r.editClosedInvoices };
      }
      return r;
    });
    setCustomRoles(updatedRoles);
    saveCustomRoles(updatedRoles);
    showToast('تم تحديث صلاحية تعديل الفواتير المغلقة للدور');
  };

  if (profile?.role !== 'ADMIN') {
    return (
      <div className="p-12 text-center bg-white rounded-3xl border border-slate-200 shadow-sm max-w-lg mx-auto my-12" dir="rtl">
        <ShieldAlert className="w-16 h-16 text-rose-500 mx-auto mb-4 animate-bounce" />
        <h2 className="text-xl font-bold text-slate-900">عذراً، وصول محظور (403 Forbidden)</h2>
        <p className="text-slate-500 mt-2 text-sm leading-relaxed">
          وحدة إدارة الصلاحيات والأمن وحسابات المستخدمين (T-Code: SU01 / RBAC) مخصصة حصرياً لمدير النظام الرئيسي (ADMIN).
        </p>
      </div>
    );
  }

  const filteredUsers = users.filter(u => {
    const matchesSearch = (u.displayName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                          u.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          (u.department || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = roleFilter === 'ALL' || u.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  const activeCount = users.filter(u => u.isActive).length;
  const adminCount = users.filter(u => u.role === 'ADMIN').length;

  const modulesList = [
    { key: 'expenses-revenues', nameAr: 'تسجيل المصروفات النثرية والإيرادات' },
    { key: 'accounts-receivable', nameAr: 'المبيعات والعملاء (SD/AR)' },
    { key: 'procurement', nameAr: 'المشتريات والموردين (MM/AP)' },
    { key: 'inventory', nameAr: 'المخزون والمستودعات (Inventory)' },
    { key: 'general-ledger', nameAr: 'الأستاذ العام والقيود (GL)' },
    { key: 'pos', nameAr: 'نقاط البيع المباشرة (POS)' },
    { key: 'hr-payroll', nameAr: 'الموارد البشرية والرواتب (HR)' },
    { key: 'bank-reconciliation', nameAr: 'البنوك والتسويات (Bank)' },
    { key: 'foreign-exchange', nameAr: 'الصرافة والعملات (FX)' },
    { key: 'financial-reports', nameAr: 'التقارير المالية والختامية' },
    { key: 'settings', nameAr: 'إعدادات النظام (SPRO)' },
  ];

  return (
    <div className="space-y-6" dir="rtl">
      
      {/* Toast Banner */}
      {toastMessage && (
        <div className="fixed top-5 left-1/2 -translate-x-1/2 z-50 bg-slate-900 text-white px-5 py-2.5 rounded-2xl shadow-xl border border-slate-700 text-xs font-bold flex items-center gap-2 animate-in slide-in-from-top-4">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Page Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-rose-50 text-rose-600 rounded-xl border border-rose-200/60">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl font-black text-slate-900 flex items-center gap-2">
                وحدة إدارة المستخدمين والأمن والصلاحيات (RBAC)
                <span className="text-xs bg-rose-100 text-rose-800 font-mono px-2 py-0.5 rounded-full font-bold">SU01 / Security Engine</span>
              </h1>
              <p className="text-xs text-slate-500 mt-0.5">
                إدارة الصلاحيات (إضافة، تعديل، حذف، طباعة، تصدير)، تقييد تعديل الفواتير المغلقة، تسفير كلمات المرور، والحد التشغيلي لكاشير المبيعات (غير محدود / بلا حدود ♾️).
              </p>
            </div>
          </div>
        </div>

        {/* Global Security Actions */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={handleMassPasswordReset}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-xl font-bold text-xs transition border border-rose-200 cursor-pointer shadow-2xs"
            title="تسفير كلمات المرور لكافة الموظفين وإلزامهم بالتغيير عند تسجيل الدخول"
          >
            <Lock className="w-3.5 h-3.5 text-rose-600 animate-pulse" />
            <span>تسفير كلمات المرور الشامل</span>
          </button>

          <button
            onClick={handleResetAllQuotas}
            className="flex items-center gap-1.5 px-3 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 rounded-xl font-bold text-xs transition border border-emerald-200 cursor-pointer"
            title="تفعيل وإتاحة سعة العمليات التشغيلية لكافة الكاشيرات والمستخدمين بلا حدود"
          >
            <RotateCcw className="w-3.5 h-3.5 text-emerald-600" />
            <span>سعة الكاشير (بلا حدود ♾️)</span>
          </button>

          <button
            onClick={handleOpenAddModal}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-xs shadow-md transition shrink-0 cursor-pointer"
          >
            <UserPlus className="w-4 h-4" />
            إضافة مستخدم جديد
          </button>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="flex border-b border-slate-200 bg-white rounded-2xl p-1 shadow-2xs gap-1">
        <button
          onClick={() => setActiveTab('USERS')}
          className={`flex-1 py-3 px-4 rounded-xl text-xs font-black transition flex items-center justify-center gap-2 cursor-pointer ${
            activeTab === 'USERS' 
              ? 'bg-blue-600 text-white shadow-xs' 
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>حسابات المستخدمين والتشغيل ({users.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('ROLES')}
          className={`flex-1 py-3 px-4 rounded-xl text-xs font-black transition flex items-center justify-center gap-2 cursor-pointer ${
            activeTab === 'ROLES' 
              ? 'bg-blue-600 text-white shadow-xs' 
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
          }`}
        >
          <Sliders className="w-4 h-4" />
          <span>مصفوفة الأدوار والصلاحيات الدقيقة (RBAC Matrix)</span>
        </button>

        <button
          onClick={() => setActiveTab('AUDIT')}
          className={`flex-1 py-3 px-4 rounded-xl text-xs font-black transition flex items-center justify-center gap-2 cursor-pointer ${
            activeTab === 'AUDIT' 
              ? 'bg-blue-600 text-white shadow-xs' 
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
          }`}
        >
          <History className="w-4 h-4" />
          <span>سجل تسجيل الدخول والأمان ({auditLogs.length})</span>
        </button>
      </div>

      {/* TAB 1: USERS & QUOTA MANAGEMENT */}
      {activeTab === 'USERS' && (
        <div className="space-y-4">
          {/* Quick Metrics */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                <Users className="w-5 h-5" />
              </div>
              <div>
                <p className="text-[11px] text-slate-500 font-bold">إجمالي المستخدمين</p>
                <p className="text-lg font-black text-slate-900">{users.length} حساب</p>
              </div>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <div>
                <p className="text-[11px] text-slate-500 font-bold">الحسابات النشطة</p>
                <p className="text-lg font-black text-emerald-700">{activeCount} نشط</p>
              </div>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
                <Zap className="w-5 h-5" />
              </div>
              <div>
                <p className="text-[11px] text-slate-500 font-bold">الحد التشغيلي</p>
                <p className="text-sm font-black text-amber-800">50 عملية / جلسة</p>
              </div>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center shrink-0">
                <Lock className="w-5 h-5" />
              </div>
              <div>
                <p className="text-[11px] text-slate-500 font-bold">تشفير كلمات المرور</p>
                <p className="text-xs font-black text-rose-700 font-mono">Salted SHA-256</p>
              </div>
            </div>
          </div>

          {/* Filter Bar */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row gap-3 items-center justify-between">
            <div className="relative w-full sm:w-80">
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="بحث بالاسم أو البريد أو القسم..."
                className="w-full pl-4 pr-10 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 font-medium"
              />
              <Search className="w-4 h-4 text-slate-400 absolute right-3 top-2.5" />
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <Filter className="w-4 h-4 text-slate-400 shrink-0" />
              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                className="text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500 font-bold"
              >
                <option value="ALL">جميع الأدوار</option>
                {(Object.keys(ROLE_LABELS) as AppRole[]).map(r => (
                  <option key={r} value={r}>{ROLE_LABELS[r].nameAr}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Users Table */}
          <div className="bg-white rounded-2xl shadow-xs border border-slate-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-right text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-700 font-bold">
                  <tr>
                    <th className="p-4">المستخدم والقسم</th>
                    <th className="p-4">البريد والهاتف</th>
                    <th className="p-4">الدور الوظيفي</th>
                    <th className="p-4 text-center">الرصيد التشغيلي (50 عملية)</th>
                    <th className="p-4 text-center">تعديل الفواتير المغلقة</th>
                    <th className="p-4 text-center">حالة الحساب</th>
                    <th className="p-4 text-center">الإجراءات</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredUsers.map(u => {
                    const isSelf = u.uid === profile?.uid;
                    const isAdm = u.role === 'ADMIN';
                    const usedCount = u.dailyTransactionsCount || 0;
                    const maxCount = u.maxTransactions || 50;
                    const isQuotaExceeded = !isAdm && usedCount >= maxCount;

                    return (
                      <tr key={u.uid} className={`hover:bg-slate-50/80 transition-colors ${isQuotaExceeded ? 'bg-rose-50/40' : ''}`}>
                        {/* Name */}
                        <td className="p-4">
                          <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-full bg-slate-900 text-white flex items-center justify-center font-black text-xs shrink-0">
                              {u.displayName ? u.displayName.charAt(0) : 'U'}
                            </div>
                            <div>
                              <div className="font-bold text-slate-900 flex items-center gap-1.5">
                                <span>{u.displayName}</span>
                                {isSelf && (
                                  <span className="text-[9px] bg-blue-100 text-blue-800 font-bold px-1.5 py-0.2 rounded">
                                    حسابك
                                  </span>
                                )}
                              </div>
                              <span className="text-[11px] text-slate-500">{u.department || 'إدارة العمليات'}</span>
                            </div>
                          </div>
                        </td>

                        {/* Contact */}
                        <td className="p-4">
                          <div className="font-mono text-slate-700">{u.email}</div>
                          <div className="text-[11px] text-slate-400 mt-0.5">{u.phone || '-'}</div>
                        </td>

                        {/* Role */}
                        <td className="p-4">
                          <select
                            value={u.role}
                            disabled={isSelf}
                            onChange={(e) => updateUserRole(u.uid, e.target.value as AppRole)}
                            className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1 text-xs font-bold text-slate-800 outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-60"
                          >
                            {(Object.keys(ROLE_LABELS) as AppRole[]).map(r => (
                              <option key={r} value={r}>{ROLE_LABELS[r].nameAr}</option>
                            ))}
                          </select>
                        </td>

                        {/* Transaction Quota */}
                        <td className="p-4 text-center">
                          {isAdm ? (
                            <span className="inline-block px-2 py-0.5 bg-slate-100 text-slate-600 rounded-md text-[11px] font-bold">
                              غير محدود (Admin)
                            </span>
                          ) : (
                            <div className="inline-flex items-center gap-2">
                              <span className={`px-2 py-0.5 rounded-full text-xs font-mono font-bold ${
                                isQuotaExceeded
                                  ? 'bg-rose-100 text-rose-800 border border-rose-300'
                                  : usedCount > 35
                                  ? 'bg-amber-100 text-amber-800'
                                  : 'bg-emerald-50 text-emerald-700'
                              }`}>
                                {usedCount} / {maxCount}
                              </span>
                              <button
                                onClick={() => handleResetUserQuota(u.uid)}
                                className="p-1 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition"
                                title="تصفير العداد وتجديد رصيد العمليات"
                              >
                                <RotateCcw className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          )}
                        </td>

                        {/* Closed Invoices Permission */}
                        <td className="p-4 text-center">
                          {isAdm ? (
                            <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
                              مسموح دائماً
                            </span>
                          ) : (
                            <button
                              onClick={() => toggleEditClosedInvoices(u.uid, !!u.editClosedInvoices)}
                              className={`px-2.5 py-1 rounded-full text-[11px] font-bold transition flex items-center gap-1 mx-auto ${
                                u.editClosedInvoices
                                  ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                              }`}
                            >
                              {u.editClosedInvoices ? <CheckCircle2 className="w-3 h-3 text-emerald-600" /> : <XCircle className="w-3 h-3 text-slate-400" />}
                              <span>{u.editClosedInvoices ? 'ممنوحة' : 'محظورة'}</span>
                            </button>
                          )}
                        </td>

                        {/* Status */}
                        <td className="p-4 text-center">
                          <button
                            onClick={() => toggleUserStatus(u.uid, u.isActive)}
                            disabled={isSelf}
                            className={`px-2.5 py-1 rounded-full text-[11px] font-bold transition ${
                              u.isActive
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                : 'bg-rose-50 text-rose-700 border border-rose-200'
                            }`}
                          >
                            {u.isActive ? 'مفعّل' : 'معطّل'}
                          </button>
                        </td>

                        {/* Actions */}
                        <td className="p-4 text-center">
                          <div className="flex items-center justify-center gap-1">
                            <button
                              onClick={() => handleOpenPasswordModal(u)}
                              className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition"
                              title="تغيير كلمة المرور المشفرة"
                            >
                              <KeyRound className="w-4 h-4" />
                            </button>

                            <button
                              onClick={() => handleOpenEditModal(u)}
                              className="p-1.5 text-slate-600 hover:bg-slate-100 rounded-lg transition"
                              title="تعديل بيانات المستخدم والحد التشغيلي"
                            >
                              <Edit3 className="w-4 h-4" />
                            </button>

                            {!isSelf && (
                              <button
                                onClick={() => setDeleteTargetUser(u)}
                                className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg transition"
                                title="حذف الحساب"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: RBAC PERMISSIONS MATRIX */}
      {activeTab === 'ROLES' && (
        <div className="space-y-6">
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-2xl text-xs text-blue-900 flex items-start gap-3">
            <Info className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
            <div>
              <strong className="block font-black text-blue-950 mb-0.5">
                مصفوفة التحكم بالصلاحيات الدقيقة (Granular Role-Based Access Control):
              </strong>
              يمكنك تخصيص كل دور (مثل: محاسب، مشتري، مدير مبيعات، مراجع) عبر تحديد الصلاحيات الفرعية (إضافة، تعديل، حذف، طباعة، تصدير) على كل وحدة نظام، والتحكم بصلاحية "تعديل الفواتير المغلقة" بشكل مستقل.
            </div>
          </div>

          <div className="space-y-4">
            {customRoles.map((role) => {
              const isAdmin = role.id === 'ROLE-ADMIN';

              return (
                <div key={role.id} className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
                  {/* Role Header */}
                  <div className="p-4 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-slate-900 text-white flex items-center justify-center font-bold">
                        <Shield className="w-4 h-4 text-blue-400" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="text-sm font-black text-slate-900">{role.nameAr}</h3>
                          <span className="text-[10px] font-mono text-slate-500">({role.nameEn})</span>
                        </div>
                        <p className="text-xs text-slate-500 mt-0.5">{role.desc}</p>
                      </div>
                    </div>

                    {/* Dedicated Closed Invoices Permission Toggle */}
                    <div className="flex items-center gap-3 bg-white p-2 rounded-xl border border-slate-200">
                      <span className="text-xs font-bold text-slate-700">تعديل الفواتير المغلقة:</span>
                      <button
                        onClick={() => !isAdmin && handleToggleRoleClosedInvoices(role.id)}
                        disabled={isAdmin}
                        className={`px-3 py-1 rounded-lg text-xs font-black transition flex items-center gap-1.5 ${
                          role.editClosedInvoices
                            ? 'bg-emerald-600 text-white shadow-xs'
                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                        }`}
                      >
                        {role.editClosedInvoices ? <CheckCircle2 className="w-3.5 h-3.5" /> : <XCircle className="w-3.5 h-3.5" />}
                        <span>{role.editClosedInvoices ? 'مسموح (Granted)' : 'محظور (Restricted)'}</span>
                      </button>
                    </div>
                  </div>

                  {/* Modules Permissions Grid */}
                  <div className="p-4 overflow-x-auto">
                    <table className="w-full text-right text-xs">
                      <thead>
                        <tr className="border-b border-slate-200 text-slate-500 font-bold">
                          <th className="pb-2 text-right">الوحدة / الموديول</th>
                          <th className="pb-2 text-center">عرض (View)</th>
                          <th className="pb-2 text-center">إضافة (Create)</th>
                          <th className="pb-2 text-center">تعديل (Edit)</th>
                          <th className="pb-2 text-center">حذف (Delete)</th>
                          <th className="pb-2 text-center">طباعة (Print)</th>
                          <th className="pb-2 text-center">تصدير (Export)</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {modulesList.map((mod) => {
                          const perms = role.permissions?.[mod.key] || {
                            view: isAdmin,
                            create: isAdmin,
                            edit: isAdmin,
                            delete: isAdmin,
                            print: isAdmin,
                            export: isAdmin
                          };

                          return (
                            <tr key={mod.key} className="hover:bg-slate-50/60">
                              <td className="py-2.5 font-bold text-slate-800">{mod.nameAr}</td>
                              {(['view', 'create', 'edit', 'delete', 'print', 'export'] as const).map((action) => (
                                <td key={action} className="py-2.5 text-center">
                                  <input
                                    type="checkbox"
                                    checked={isAdmin ? true : !!perms[action]}
                                    disabled={isAdmin}
                                    onChange={() => handleToggleModuleAction(role.id, mod.key, action)}
                                    className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500 cursor-pointer disabled:opacity-75"
                                  />
                                </td>
                              ))}
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 3: LOGIN SECURITY AUDIT & NOTIFICATIONS */}
      {activeTab === 'AUDIT' && (
        <div className="space-y-4">
          <div className="bg-slate-900 text-white p-5 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <History className="w-5 h-5 text-blue-400" />
                <h3 className="text-sm font-black">سجل الرقابة وإشعارات الدخول الفورية</h3>
                <span className="text-[10px] bg-rose-500/30 text-rose-300 border border-rose-500/40 px-2 py-0.5 rounded-full font-bold">
                  تنبيه واتساب مباشر
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-1">
                رصد فوري لجميع عمليات الدخول مع تسجيل عنوان IP، نوع المتصفح، نظام التشغيل، والتوقيت بدقة.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setAuditLogs(getLoginAuditLogs())}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl text-xs font-bold transition flex items-center gap-1"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>تحديث</span>
              </button>

              <button
                onClick={() => {
                  if (window.confirm('هل ترغب في مسح السجل بالكامل؟')) {
                    clearLoginAuditLogs();
                    setAuditLogs([]);
                  }
                }}
                className="px-3 py-1.5 bg-rose-950/80 hover:bg-rose-900 text-rose-300 border border-rose-800 rounded-xl text-xs font-bold transition flex items-center gap-1"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>مسح السجل</span>
              </button>
            </div>
          </div>

          {/* Logs List */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs divide-y divide-slate-100 overflow-hidden">
            {auditLogs.length === 0 ? (
              <div className="p-12 text-center text-slate-400">
                <ShieldCheck className="w-12 h-12 text-slate-300 mx-auto mb-2" />
                <p className="text-sm font-bold text-slate-600">لا توجد سجلات دخول حتى الآن</p>
              </div>
            ) : (
              auditLogs.map((log) => {
                const waUrl = generateAdminWhatsAppNotificationUrl(log);

                return (
                  <div key={log.id} className="p-4 hover:bg-slate-50 transition flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 mt-0.5">
                        <CheckCircle2 className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <strong className="text-slate-900 font-bold">{log.userName}</strong>
                          <span className="font-mono text-slate-500">({log.userEmail})</span>
                          <span className="text-[10px] bg-slate-100 text-slate-700 px-1.5 py-0.2 rounded font-bold">
                            {log.role}
                          </span>
                        </div>
                        <div className="flex items-center gap-3 text-slate-500 mt-1 flex-wrap">
                          <span>⏰ {new Date(log.timestamp).toLocaleString('ar-YE')}</span>
                          <span className="font-mono">🌐 IP: <strong>{log.ip}</strong></span>
                          <span>💻 {log.browser} / {log.os}</span>
                        </div>
                      </div>
                    </div>

                    <a
                      href={waUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-xl text-xs font-bold transition flex items-center gap-1.5"
                    >
                      <MessageSquare className="w-3.5 h-3.5 text-emerald-600" />
                      <span>إرسال لواتساب المدير ({ADMIN_PHONE_NUMBER})</span>
                      <ExternalLink className="w-3 h-3 text-emerald-500" />
                    </a>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* Password Reset / Change Modal */}
      {passwordModalUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs" dir="rtl">
          <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden animate-in zoom-in-95 duration-150">
            <div className="bg-slate-900 text-white p-5 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <KeyRound className="w-5 h-5 text-amber-400" />
                <h3 className="text-sm font-black">تغيير وتشفير كلمة المرور</h3>
              </div>
              <button
                onClick={() => setPasswordModalUser(null)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSavePassword} className="p-6 space-y-4">
              <div>
                <p className="text-xs text-slate-600 mb-1">
                  المستخدم: <strong className="text-slate-900">{passwordModalUser.displayName}</strong>
                </p>
                <p className="text-[11px] font-mono text-slate-400">{passwordModalUser.email}</p>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  كلمة المرور الجديدة المعتمدة:
                </label>
                <div className="relative">
                  <input
                    type={showPasswordText ? 'text' : 'password'}
                    value={newPasswordValue}
                    onChange={(e) => setNewPasswordValue(e.target.value)}
                    placeholder="8 خانات، كبير، صغير، رقم، رمز خاص..."
                    className="w-full pl-10 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 font-bold focus:outline-none focus:border-blue-500"
                    autoFocus
                  />
                  <button
                    type="button"
                    onClick={() => setShowPasswordText(!showPasswordText)}
                    className="absolute left-3 top-2.5 text-slate-400 hover:text-slate-600"
                  >
                    {showPasswordText ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {passwordErrorMessage && (
                <p className="text-xs text-rose-600 font-bold">{passwordErrorMessage}</p>
              )}

              {passwordSuccessMessage && (
                <p className="text-xs text-emerald-600 font-bold">{passwordSuccessMessage}</p>
              )}

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setPasswordModalUser(null)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-black shadow-md cursor-pointer"
                >
                  حفظ وتشفير
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add / Edit User Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs" dir="rtl">
          <div className="w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden animate-in zoom-in-95 duration-150">
            <div className="bg-slate-900 text-white p-5 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <UserPlus className="w-5 h-5 text-blue-400" />
                <h3 className="text-sm font-black">
                  {editingUser ? 'تعديل بيانات المستخدم والحد التشغيلي' : 'إضافة مستخدم جديد للنظام'}
                </h3>
              </div>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveUserForm} className="p-6 space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">الاسم الكامل للمستخدم:</label>
                  <input
                    type="text"
                    required
                    value={formDisplayName}
                    onChange={(e) => setFormDisplayName(e.target.value)}
                    placeholder="مثال: أحمد محمد القاسمي"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">البريد الإلكتروني:</label>
                  <input
                    type="email"
                    required
                    value={formEmail}
                    onChange={(e) => setFormEmail(e.target.value)}
                    placeholder="user@medo-erp.com"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono text-slate-800"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">الدور الوظيفي:</label>
                  <select
                    value={formRole}
                    onChange={(e) => setFormRole(e.target.value as AppRole)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800"
                  >
                    {(Object.keys(ROLE_LABELS) as AppRole[]).map(r => (
                      <option key={r} value={r}>{ROLE_LABELS[r].nameAr}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">القسم / الإدارة:</label>
                  <input
                    type="text"
                    value={formDepartment}
                    onChange={(e) => setFormDepartment(e.target.value)}
                    placeholder="الإدارة المالية"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">رقم الهاتف:</label>
                  <input
                    type="text"
                    value={formPhone}
                    onChange={(e) => setFormPhone(e.target.value)}
                    placeholder="+967 770 000 000"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono text-slate-800"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">الحد الأقصى للعمليات (Quota):</label>
                  <input
                    type="number"
                    min="10"
                    max="1000"
                    value={formMaxTransactions}
                    onChange={(e) => setFormMaxTransactions(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800"
                  />
                </div>
              </div>

              {/* Edit Closed Invoices Toggle */}
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between">
                <div>
                  <strong className="block text-slate-800 font-bold">صلاحية تعديل الفواتير المغلقة:</strong>
                  <span className="text-[11px] text-slate-500">تمكين المستخدم من فتح وتعديل فواتير المبيعات/المشتريات بعد اعتمادها</span>
                </div>
                <input
                  type="checkbox"
                  checked={formEditClosedInvoices}
                  onChange={(e) => setFormEditClosedInvoices(e.target.checked)}
                  className="w-5 h-5 text-blue-600 rounded cursor-pointer"
                />
              </div>

              {!editingUser && (
                <div>
                  <label className="block font-bold text-slate-700 mb-1">كلمة المرور الأولية (سيطلب منه تغييرها عند الدخول):</label>
                  <input
                    type="text"
                    value={formPassword}
                    onChange={(e) => setFormPassword(e.target.value)}
                    placeholder="Account@2026"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono text-slate-800"
                  />
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-black shadow-md cursor-pointer"
                >
                  {editingUser ? 'حفظ التعديلات' : 'إضافة وتفعيل الحساب'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete User Confirmation Modal */}
      {deleteTargetUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs" dir="rtl">
          <div className="w-full max-w-sm bg-white rounded-3xl shadow-2xl border border-slate-200 p-6 text-center space-y-4 animate-in zoom-in-95 duration-150">
            <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-black text-slate-900">تأكيد حذف الحساب نهائياً</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              هل أنت متأكد من رغبتك في حذف حساب المستخدم <strong className="text-slate-800">{deleteTargetUser.displayName}</strong> ({deleteTargetUser.email})؟
            </p>
            <div className="flex items-center justify-center gap-2 pt-2">
              <button
                onClick={() => setDeleteTargetUser(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold"
              >
                إلغاء
              </button>
              <button
                onClick={handleDeleteUser}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-black shadow-md cursor-pointer"
              >
                تأكيد الحذف
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
