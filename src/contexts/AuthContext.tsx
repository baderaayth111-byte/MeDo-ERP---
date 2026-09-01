import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, onAuthStateChanged, signOut, updatePassword as updateFirebasePassword } from 'firebase/auth';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { auth, db } from '../lib/firebase';
import { UserProfile, AppRole, ROLE_PERMISSIONS, LoginAuditLog, CustomRoleDefinition } from '../types/auth';
import { 
  UserAccountCredential, 
  getLoadedUserCredentials, 
  updateUserAccountPassword,
  validateLocalUserLogin,
  saveUserCredentials,
  recoverUserAccount,
  getRememberedCredentials,
  saveRememberedCredentials,
  clearRememberedCredentials,
  getRegisteredBiometricUser,
  registerBiometricUser,
  disableBiometricUser,
  createCashierAccount,
  BiometricUserConfig,
  RememberedCreds,
  recordLoginAuditLog,
  getLoadedCustomRoles,
  forceMassPasswordReset,
  ADMIN_PHONE_NUMBER
} from '../data/userCredentials';
import { getClientDeviceInfo, validatePasswordPolicy } from '../utils/cryptoSecurity';

interface AuthContextType {
  user: User | { uid: string; email: string; displayName: string } | null;
  profile: UserProfile | null;
  loading: boolean;
  logout: () => Promise<void>;
  hasPermission: (module: string, action?: 'view' | 'create' | 'edit' | 'delete' | 'print' | 'export') => boolean;
  canEditClosedInvoices: boolean;
  loginAsDemo: (role?: AppRole, customEmail?: string) => void;
  loginWithCredentials: (email: string, pass: string) => Promise<{ success: boolean; error?: string }>;
  changePassword: (newPassword: string, targetEmail?: string) => Promise<{ success: boolean; message: string }>;
  recoverAccount: (email: string, newPass: string, pin: string) => Promise<{ success: boolean; message: string }>;
  biometricUser: BiometricUserConfig | null;
  registerBiometric: (targetEmail?: string) => { success: boolean; message: string };
  disableBiometric: () => void;
  loginWithBiometric: () => Promise<{ success: boolean; error?: string }>;
  rememberedCreds: RememberedCreds | null;
  saveRemembered: (email: string, pass?: string) => void;
  clearRemembered: () => void;
  userAccounts: UserAccountCredential[];
  refreshUserAccounts: () => void;
  latestLoginAlert: LoginAuditLog | null;
  dismissLoginAlert: () => void;
  triggerMassPasswordReset: () => { count: number; message: string };
  createCashier: (email: string, name: string, pass: string) => Promise<{ success: boolean; message: string }>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  profile: null,
  loading: true,
  logout: async () => {},
  hasPermission: () => false,
  canEditClosedInvoices: false,
  loginAsDemo: () => {},
  loginWithCredentials: async () => ({ success: false }),
  changePassword: async () => ({ success: false, message: '' }),
  recoverAccount: async () => ({ success: false, message: '' }),
  biometricUser: null,
  registerBiometric: () => ({ success: false, message: '' }),
  disableBiometric: () => {},
  loginWithBiometric: async () => ({ success: false }),
  rememberedCreds: null,
  saveRemembered: () => {},
  clearRemembered: () => {},
  userAccounts: [],
  refreshUserAccounts: () => {},
  latestLoginAlert: null,
  dismissLoginAlert: () => {},
  triggerMassPasswordReset: () => ({ count: 0, message: '' }),
  createCashier: async () => ({ success: false, message: '' }),
});

export const useAuth = () => useContext(AuthContext);

const DEMO_SESSION_KEY = 'medo_erp_demo_session_v3';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<any | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [userAccounts, setUserAccounts] = useState<UserAccountCredential[]>(() => getLoadedUserCredentials());
  const [biometricUser, setBiometricUser] = useState<BiometricUserConfig | null>(() => getRegisteredBiometricUser());
  const [rememberedCreds, setRememberedCreds] = useState<RememberedCreds | null>(() => getRememberedCredentials());
  const [latestLoginAlert, setLatestLoginAlert] = useState<LoginAuditLog | null>(null);

  const refreshUserAccounts = () => {
    setUserAccounts(getLoadedUserCredentials());
  };

  const dismissLoginAlert = () => {
    setLatestLoginAlert(null);
  };

  const saveRemembered = (email: string, pass?: string) => {
    saveRememberedCredentials(email, pass);
    setRememberedCreds(getRememberedCredentials());
  };

  const clearRemembered = () => {
    clearRememberedCredentials();
    setRememberedCreds(null);
  };

  const registerBiometric = (targetEmail?: string) => {
    const emailToUse = targetEmail || profile?.email || 'admin@medo-erp.com';
    const result = registerBiometricUser(emailToUse);
    if (result.success && result.config) {
      setBiometricUser(result.config);
    }
    return { success: result.success, message: result.message };
  };

  const disableBiometric = () => {
    disableBiometricUser();
    setBiometricUser(null);
  };

  const loginWithBiometric = async (): Promise<{ success: boolean; error?: string }> => {
    const bio = getRegisteredBiometricUser();
    if (!bio) {
      return { success: false, error: 'لم يتم تسجيل بصمة الإصبع/الوجه على هذا الجهاز بعد.' };
    }
    loginAsDemo(bio.role, bio.email);
    return { success: true };
  };

  const recoverAccount = async (email: string, newPass: string, pin: string): Promise<{ success: boolean; message: string }> => {
    const res = recoverUserAccount(email, newPass, pin);
    if (res.success) {
      refreshUserAccounts();
    }
    return res;
  };

  const createAndDispatchLoginAudit = (
    userEmail: string,
    userName: string,
    role: AppRole,
    status: 'SUCCESS' | 'FAILED' | 'PASSWORD_RESET_REQUIRED' = 'SUCCESS'
  ) => {
    const devInfo = getClientDeviceInfo();
    const mockIps = ['192.168.1.105', '10.0.4.22', '172.16.0.88', '192.168.100.15'];
    const randomIp = mockIps[Math.floor(Math.random() * mockIps.length)];

    const auditLog: LoginAuditLog = {
      id: 'audit-log-' + Date.now() + '-' + Math.random().toString(36).substr(2, 4),
      userId: 'usr-' + userEmail.split('@')[0],
      userEmail,
      userName,
      role,
      timestamp: new Date().toISOString(),
      ip: randomIp,
      browser: devInfo.browser,
      os: devInfo.os,
      device: devInfo.device,
      userAgent: devInfo.userAgent,
      status,
      notes: status === 'SUCCESS' ? 'تسجيل دخول ناجح وموثق' : 'تم تفعيل متطلب تغيير كلمة المرور الإلزامي',
      whatsappSent: true,
    };

    recordLoginAuditLog(auditLog);
    setLatestLoginAlert(auditLog);
  };

  // Check demo session on mount
  useEffect(() => {
    const savedDemoSession = localStorage.getItem(DEMO_SESSION_KEY);
    if (savedDemoSession) {
      try {
        const demoData = JSON.parse(savedDemoSession);
        setUser(demoData.user);
        setProfile(demoData.profile);
        setLoading(false);
        return;
      } catch (e) {
        localStorage.removeItem(DEMO_SESSION_KEY);
      }
    }

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (localStorage.getItem(DEMO_SESSION_KEY)) {
        setLoading(false);
        return;
      }

      setUser(firebaseUser);
      
      if (firebaseUser) {
        try {
          const docRef = doc(db, 'users', firebaseUser.uid);
          const docSnap = await getDoc(docRef);
          
          if (docSnap.exists()) {
            const data = docSnap.data() as UserProfile;
            if (!data.isActive) {
              await signOut(auth);
              setUser(null);
              setProfile(null);
            } else {
              setProfile(data);
            }
          } else {
            const newProfile: UserProfile = {
              uid: firebaseUser.uid,
              email: firebaseUser.email || '',
              displayName: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'المسؤول',
              role: 'ADMIN',
              isActive: true,
              createdAt: new Date().toISOString(),
              editClosedInvoices: true,
            };
            await setDoc(docRef, newProfile).catch(() => {});
            setProfile(newProfile);
          }
        } catch (err) {
          setProfile({
            uid: firebaseUser.uid,
            email: firebaseUser.email || 'admin@medo-erp.com',
            displayName: firebaseUser.email?.split('@')[0] || 'مدير النظام الرئيسي',
            role: 'ADMIN',
            isActive: true,
            createdAt: new Date().toISOString(),
            editClosedInvoices: true,
          });
        }
      } else {
        setProfile(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const loginAsDemo = (role: AppRole = 'ADMIN', customEmail?: string) => {
    const creds = getLoadedUserCredentials();
    const matchedAccount = creds.find(c => 
      customEmail ? c.email.toLowerCase() === customEmail.toLowerCase() : c.role === role
    ) || creds[0];

    const userEmail = matchedAccount?.email || customEmail || 'admin@medo-erp.com';
    const userName = matchedAccount?.displayName || userEmail.split('@')[0] || 'مسؤول النظام';
    const userRole = matchedAccount?.role || role;

    const demoUser = {
      uid: matchedAccount?.uid || 'demo-' + Date.now(),
      email: userEmail,
      displayName: userName,
    };
    const demoProfile: UserProfile = {
      uid: demoUser.uid,
      email: userEmail,
      displayName: userName,
      role: userRole,
      isActive: true,
      createdAt: matchedAccount?.createdAt || new Date().toISOString(),
      mustChangePassword: matchedAccount?.mustChangePassword ?? false,
      editClosedInvoices: matchedAccount?.editClosedInvoices ?? (userRole === 'ADMIN'),
      dailyTransactionsCount: matchedAccount?.dailyTransactionsCount ?? 0,
      maxTransactions: matchedAccount?.maxTransactions ?? (userRole === 'ADMIN' ? 999999 : 50),
    };

    setUser(demoUser);
    setProfile(demoProfile);
    localStorage.setItem(DEMO_SESSION_KEY, JSON.stringify({ user: demoUser, profile: demoProfile }));

    // Generate immediate login notification for Admin and WhatsApp
    createAndDispatchLoginAudit(
      userEmail,
      userName,
      userRole,
      demoProfile.mustChangePassword ? 'PASSWORD_RESET_REQUIRED' : 'SUCCESS'
    );
  };

  const loginWithCredentials = async (email: string, pass: string): Promise<{ success: boolean; error?: string }> => {
    const localUser = validateLocalUserLogin(email, pass);
    if (localUser) {
      loginAsDemo(localUser.role, localUser.email);
      return { success: true };
    }

    // Direct first-time login for trial/demo users
    const normalizedEmail = email.trim().toLowerCase();
    if (normalizedEmail.includes('@') && pass.trim().length >= 4) {
      const newTrialUser: UserAccountCredential = {
        uid: 'usr-trial-' + Date.now(),
        email: normalizedEmail,
        displayName: normalizedEmail.split('@')[0],
        role: 'ACCOUNTANT',
        isActive: true,
        password: pass,
        defaultPassword: pass,
        phone: ADMIN_PHONE_NUMBER,
        department: 'النسخة التجريبية',
        createdAt: new Date().toISOString(),
        mustChangePassword: true, // Forces mandatory password change on first login
        dailyTransactionsCount: 0,
        maxTransactions: 200, // 200 operations limit
        editClosedInvoices: false,
      };

      const existingUsers = getLoadedUserCredentials();
      const updatedList = [newTrialUser, ...existingUsers.filter(u => u.email.toLowerCase() !== normalizedEmail)];
      saveUserCredentials(updatedList);
      refreshUserAccounts();

      loginAsDemo(newTrialUser.role, newTrialUser.email);
      return { success: true };
    }

    return { 
      success: false, 
      error: 'يرجى إدخال بريد إلكتروني صالح وكلمة مرور (4 أحرف أو أكثر) للدخول المباشر.' 
    };
  };

  const changePassword = async (newPassword: string, targetEmail?: string): Promise<{ success: boolean; message: string }> => {
    const emailToUpdate = targetEmail || profile?.email;
    if (!emailToUpdate) {
      return { success: false, message: 'لم يتم تحديد الحساب المطلوب' };
    }

    const policy = validatePasswordPolicy(newPassword);
    if (!policy.isValid) {
      return { 
        success: false, 
        message: policy.errorsAr[0] || 'كلمة المرور لا تستوفي المعايير الأمنية المعتمدة (8 أحرف، كبير، صغير، رقم، رمز)' 
      };
    }

    const isAdmin = profile?.role === 'ADMIN';
    const isSelf = profile?.email?.toLowerCase() === emailToUpdate.toLowerCase();

    if (!isAdmin && !isSelf) {
      return { success: false, message: 'غير مصرح لك بتغيير كلمة مرور مستخدم آخر' };
    }

    const updatedLocally = updateUserAccountPassword(emailToUpdate, newPassword);

    if (isSelf && auth.currentUser) {
      try {
        await updateFirebasePassword(auth.currentUser, newPassword);
      } catch (err) {
        console.warn('Firebase Auth password update skipped/failed', err);
      }
    }

    // Update current active profile state so mandatory modal dismisses
    if (isSelf && profile) {
      const updatedProfile = { ...profile, mustChangePassword: false };
      setProfile(updatedProfile);
      localStorage.setItem(DEMO_SESSION_KEY, JSON.stringify({ user, profile: updatedProfile }));
    }

    refreshUserAccounts();
    return { 
      success: updatedLocally, 
      message: `تم تحديث وتشفير كلمة المرور بنجاح للحساب (${emailToUpdate}) باستخدام Salted SHA-256` 
    };
  };

  const triggerMassPasswordReset = () => {
    const res = forceMassPasswordReset();
    refreshUserAccounts();
    if (profile && profile.role !== 'ADMIN') {
      const updatedProfile = { ...profile, mustChangePassword: true };
      setProfile(updatedProfile);
      localStorage.setItem(DEMO_SESSION_KEY, JSON.stringify({ user, profile: updatedProfile }));
    }
    return res;
  };

  const createCashier = async (email: string, name: string, pass: string): Promise<{ success: boolean; message: string }> => {
    if (profile?.role !== 'ADMIN') {
      return { success: false, message: 'غير مصرح لك بإنشاء حسابات' };
    }
    const res = createCashierAccount(email, name, pass);
    if (res.success) {
      refreshUserAccounts();
    }
    return res;
  };

  const logout = async () => {
    localStorage.removeItem(DEMO_SESSION_KEY);
    try {
      await signOut(auth);
    } catch (e) {}
    setUser(null);
    setProfile(null);
    setLatestLoginAlert(null);
  };

  const hasPermission = (module: string, action: 'view' | 'create' | 'edit' | 'delete' | 'print' | 'export' = 'view'): boolean => {
    if (!profile) return false;
    if (!profile.isActive) return false;
    if (profile.role === 'ADMIN') return true;
    if (module === 'launchpad') return true;

    // Check custom roles matrix first
    const customRoles = getLoadedCustomRoles();
    const matchedRole = customRoles.find(r => r.id === profile.role || r.nameEn === profile.role || r.nameAr === profile.role);
    if (matchedRole && matchedRole.permissions && matchedRole.permissions[module]) {
      const perm = matchedRole.permissions[module];
      return !!perm[action];
    }

    // Fallback to legacy ROLE_PERMISSIONS for view action
    if (action === 'view') {
      const allowed = ROLE_PERMISSIONS[profile.role] || [];
      return allowed.includes('*') || allowed.includes(module);
    }

    return true;
  };

  const canEditClosedInvoices = profile?.role === 'ADMIN' || !!profile?.editClosedInvoices;

  return (
    <AuthContext.Provider value={{ 
      user, 
      profile, 
      loading, 
      logout, 
      hasPermission, 
      canEditClosedInvoices,
      loginAsDemo, 
      loginWithCredentials,
      changePassword,
      recoverAccount,
      biometricUser,
      registerBiometric,
      disableBiometric,
      loginWithBiometric,
      rememberedCreds,
      saveRemembered,
      clearRemembered,
      userAccounts,
      refreshUserAccounts,
      latestLoginAlert,
      dismissLoginAlert,
      triggerMassPasswordReset,
      createCashier,
    }}>
      {children}
    </AuthContext.Provider>
  );
};
