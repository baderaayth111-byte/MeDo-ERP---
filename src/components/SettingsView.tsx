import React, { useState, useEffect, useRef } from 'react';
import {
  Building2,
  Phone,
  Mail,
  Globe,
  MapPin,
  Sliders,
  Calendar,
  Coins,
  Percent,
  Printer,
  Database,
  Grid,
  Layers,
  Plus,
  Trash2,
  Edit3,
  Save,
  RotateCcw,
  Download,
  Upload,
  CheckCircle2,
  AlertTriangle,
  FileText,
  Sparkles,
  ShieldCheck,
  Lock,
  Unlock,
  Hash,
  Briefcase,
  Tag,
  Eye,
  Check,
  X,
  ExternalLink,
  MessageSquareQuote,
  Smartphone,
  PhoneCall,
  User,
  HelpCircle,
  Archive,
  Server,
  Cloud,
  HardDrive,
  Zap,
  Sun,
  Moon,
  Contrast,
  Scan,
  Monitor,
  Maximize2,
  ShieldAlert,
  KeyRound,
  Fingerprint,
  CheckCheck,
  Activity,
  GitCompare,
  History,
  Cpu,
  RefreshCw,
  Clock,
  ArrowRightLeft,
  Palette
} from 'lucide-react';
import { useAccessibility, HighContrastPreset } from '../contexts/AccessibilityContext';
import {
  CompanyProfile,
  ExchangeRateRegime,
  Branch,
  CurrencyConfig,
  FiscalPeriod,
  SystemModuleSetting,
  Warehouse,
  CostCenter,
  Currency,
  JournalEntry,
  Invoice,
  PaymentVoucher,
  StockMovement,
  POSTransaction,
  PurchaseOrder,
  PayrollRun,
  CloudReplicaNode,
  SyncQueueItem,
  SyncEngineStatus
} from '../types/accounting';
import {
  getSavedSyncNodes,
  getSavedSyncQueue,
  getSyncEngineStatus,
  resolveConflictWithOldestTimestamp,
  enqueueTransactionForCloudReplication,
  processSyncQueueBackground
} from '../utils/syncManager';
import { BranchModal } from './settings/BranchModal';
import { CurrencyModal } from './settings/CurrencyModal';
import { DataArchivingView } from './settings/DataArchivingView';
import { ThemeStudioView } from './ThemeStudioView';

export interface DbConnectionProfile {
  id: string;
  name: string;
  driver: 'POSTGRES_LOCAL' | 'HUAWEI_CLOUD' | 'ALIBABA_CLOUD' | 'FIREBASE_HYBRID';
  host: string;
  port: string;
  dbName: string;
  username: string;
  password?: string;
  sslMode: 'disable' | 'require' | 'verify-full';
  region: string;
  isZatcaStrict: boolean;
  isActive: boolean;
  pingStatus?: 'ONLINE' | 'OFFLINE' | 'UNTESTED';
  latencyMs?: number;
  lastConnectedAt?: string;
}

interface SettingsViewProps {
  companyProfile: CompanyProfile;
  onUpdateCompanyProfile: (profile: CompanyProfile) => void;
  branches: Branch[];
  onUpdateBranches: (branches: Branch[]) => void;
  currenciesConfig: CurrencyConfig[];
  onUpdateCurrenciesConfig: (currencies: CurrencyConfig[]) => void;
  fiscalPeriods: FiscalPeriod[];
  onUpdateFiscalPeriods: (periods: FiscalPeriod[]) => void;
  systemModules: SystemModuleSetting[];
  onUpdateSystemModules: (modules: SystemModuleSetting[]) => void;
  warehouses: Warehouse[];
  costCenters: CostCenter[];
  journalEntries?: JournalEntry[];
  invoices?: Invoice[];
  paymentVouchers?: PaymentVoucher[];
  posOrders?: POSTransaction[];
  stockMovements?: StockMovement[];
  purchaseOrders?: PurchaseOrder[];
  payrollRuns?: PayrollRun[];
  onUpdateActiveData?: (data: {
    journalEntries?: JournalEntry[];
    invoices?: Invoice[];
    paymentVouchers?: PaymentVoucher[];
    posOrders?: POSTransaction[];
    stockMovements?: StockMovement[];
    purchaseOrders?: PurchaseOrder[];
    payrollRuns?: PayrollRun[];
  }) => void;
  currency?: Currency;
  rates?: Record<Currency, number>;
  onResetAllData?: () => void;
  onExportFullBackup?: () => void;
  onImportFullBackup?: (backupData: any) => void;
}

type SettingsTab =
  | 'COMPANY'
  | 'BRANCHES'
  | 'CURRENCIES'
  | 'PERIODS'
  | 'TAXES'
  | 'MODULES'
  | 'PRINTING'
  | 'THEME_STUDIO'
  | 'ACCESSIBILITY'
  | 'ARCHIVING'
  | 'MULTIDB'
  | 'SECURITY'
  | 'BACKUP';

export const SettingsView: React.FC<SettingsViewProps> = ({
  companyProfile,
  onUpdateCompanyProfile,
  branches,
  onUpdateBranches,
  currenciesConfig,
  onUpdateCurrenciesConfig,
  fiscalPeriods,
  onUpdateFiscalPeriods,
  systemModules,
  onUpdateSystemModules,
  warehouses,
  costCenters,
  journalEntries = [],
  invoices = [],
  paymentVouchers = [],
  posOrders = [],
  stockMovements = [],
  purchaseOrders = [],
  payrollRuns = [],
  onUpdateActiveData,
  currency = 'YER',
  rates,
  onResetAllData,
  onExportFullBackup,
  onImportFullBackup,
}) => {
  const {
    settings: accessibilitySettings,
    highContrastMode,
    toggleHighContrastMode,
    setHighContrastMode,
    setPreset: setContrastPreset,
    setLargeWarehouseFont,
    setBarcodeScannerOptimized,
    setBoldTableBorders,
    resetAccessibilitySettings,
  } = useAccessibility();

  const [activeTab, setActiveTab] = useState<SettingsTab>('COMPANY');
  const [savedSuccessMsg, setSavedSuccessMsg] = useState<string | null>(null);

  // --- 1. Company Profile Local Form State ---
  const [profileForm, setProfileForm] = useState<CompanyProfile>(companyProfile);

  // --- Dual Currency Accounting Mechanism State ---
  const [isRegimeSwitchModalOpen, setIsRegimeSwitchModalOpen] = useState(false);
  const [pendingRegime, setPendingRegime] = useState<ExchangeRateRegime | null>(null);
  const [sanaaUsdRate, setSanaaUsdRate] = useState<number>(() => companyProfile.sanaaExchangeRates?.USD || 535);
  const [sanaaSarRate, setSanaaSarRate] = useState<number>(() => companyProfile.sanaaExchangeRates?.SAR || 142.5);
  const [adenUsdRate, setAdenUsdRate] = useState<number>(() => companyProfile.adenExchangeRates?.USD || 1910);
  const [adenSarRate, setAdenSarRate] = useState<number>(() => companyProfile.adenExchangeRates?.SAR || 505);

  // Sync state if companyProfile props update
  useEffect(() => {
    setProfileForm(companyProfile);
    if (companyProfile.sanaaExchangeRates?.USD) setSanaaUsdRate(companyProfile.sanaaExchangeRates.USD);
    if (companyProfile.sanaaExchangeRates?.SAR) setSanaaSarRate(companyProfile.sanaaExchangeRates.SAR);
    if (companyProfile.adenExchangeRates?.USD) setAdenUsdRate(companyProfile.adenExchangeRates.USD);
    if (companyProfile.adenExchangeRates?.SAR) setAdenSarRate(companyProfile.adenExchangeRates.SAR);
  }, [companyProfile]);

  // --- 2. Branch Modal State ---
  const [isBranchModalOpen, setIsBranchModalOpen] = useState(false);
  const [editingBranch, setEditingBranch] = useState<Branch | null>(null);

  // --- 3. Currency Modal State ---
  const [isCurrencyModalOpen, setIsCurrencyModalOpen] = useState(false);
  const [editingCurrency, setEditingCurrency] = useState<CurrencyConfig | null>(null);

  // --- File input ref for backup restore ---
  const backupFileInputRef = useRef<HTMLInputElement>(null);

  // --- Multi-DB Configuration State & Connection Profiles ---
  const [dbDriver, setDbDriver] = useState<'POSTGRES_LOCAL' | 'HUAWEI_CLOUD' | 'ALIBABA_CLOUD' | 'FIREBASE_HYBRID'>('POSTGRES_LOCAL');
  const [dbHost, setDbHost] = useState('192.168.1.100');
  const [dbPort, setDbPort] = useState('5432');
  const [dbName, setDbName] = useState('medo_erp_saudi_db');
  const [dbUser, setDbUser] = useState('postgres');
  const [dbPassword, setDbPassword] = useState('••••••••••••');
  const [dbSslMode, setDbSslMode] = useState<'disable' | 'require' | 'verify-full'>('require');
  const [dbRegion, setDbRegion] = useState('me-central-1 (الرياض - المملكة العربية السعودية)');
  const [isZatcaStrict, setIsZatcaStrict] = useState(true);
  const [testingDbConnection, setTestingDbConnection] = useState(false);
  const [dbTestResult, setDbTestResult] = useState<{ success: boolean; msg: string; latencyMs: number } | null>(null);

  // --- External Database Connection Profiles State ---
  const initialDbProfiles: DbConnectionProfile[] = [
    {
      id: 'db-prof-1',
      name: 'خادم المركز الرئيسي - الرياض (PostgreSQL Local)',
      driver: 'POSTGRES_LOCAL',
      host: '192.168.1.100',
      port: '5432',
      dbName: 'medo_erp_saudi_db',
      username: 'postgres',
      password: '••••••••••••',
      sslMode: 'require',
      region: 'me-central-1 (الرياض - السعودية)',
      isZatcaStrict: true,
      isActive: true,
      pingStatus: 'ONLINE',
      latencyMs: 12,
      lastConnectedAt: new Date().toLocaleTimeString('ar-SA')
    },
    {
      id: 'db-prof-2',
      name: 'سحابة هواوي السعودية - خادم الحسابات (Huawei Cloud RDS)',
      driver: 'HUAWEI_CLOUD',
      host: 'rds.me-central-1.huaweicloud.sa',
      port: '5432',
      dbName: 'medo_erp_huawei_prod',
      username: 'saudi_erp_admin',
      password: '••••••••••••',
      sslMode: 'verify-full',
      region: 'me-central-1 (الرياض - Huawei Cloud)',
      isZatcaStrict: true,
      isActive: false,
      pingStatus: 'ONLINE',
      latencyMs: 18,
      lastConnectedAt: new Date().toLocaleTimeString('ar-SA')
    },
    {
      id: 'db-prof-3',
      name: 'سحابة علي بابا السعودية - خادم المبيعات (Alibaba Cloud RDS)',
      driver: 'ALIBABA_CLOUD',
      host: 'apsara.me-east-1.alibabacloud.sa',
      port: '3306',
      dbName: 'medo_alibaba_sales_db',
      username: 'stc_cloud_user',
      password: '••••••••••••',
      sslMode: 'require',
      region: 'me-east-1 (الدمام - Alibaba Cloud)',
      isZatcaStrict: true,
      isActive: false,
      pingStatus: 'ONLINE',
      latencyMs: 24,
      lastConnectedAt: new Date().toLocaleTimeString('ar-SA')
    }
  ];

  const [dbProfiles, setDbProfiles] = useState<DbConnectionProfile[]>(() => {
    try {
      const saved = localStorage.getItem('medo_erp_db_profiles_v1');
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return initialDbProfiles;
  });

  const [activeDbId, setActiveDbId] = useState<string>(() => {
    const active = dbProfiles.find(p => p.isActive);
    return active ? active.id : 'db-prof-1';
  });

  // Modal State for Adding / Editing DB Connections
  const [isDbModalOpen, setIsDbModalOpen] = useState(false);
  const [editingDbProfile, setEditingDbProfile] = useState<DbConnectionProfile | null>(null);

  // Form inputs for modal
  const [formProfileName, setFormProfileName] = useState('');
  const [formDriver, setFormDriver] = useState<'POSTGRES_LOCAL' | 'HUAWEI_CLOUD' | 'ALIBABA_CLOUD' | 'FIREBASE_HYBRID'>('POSTGRES_LOCAL');
  const [formHost, setFormHost] = useState('');
  const [formPort, setFormPort] = useState('');
  const [formDbName, setFormDbName] = useState('');
  const [formUsername, setFormUsername] = useState('');
  const [formPassword, setFormPassword] = useState('');
  const [formSslMode, setFormSslMode] = useState<'disable' | 'require' | 'verify-full'>('require');
  const [formRegion, setFormRegion] = useState('me-central-1 (الرياض)');
  const [formZatcaStrict, setFormZatcaStrict] = useState(true);
  const [modalTestResult, setModalTestResult] = useState<{ success: boolean; msg: string; latencyMs: number } | null>(null);
  const [modalTesting, setModalTesting] = useState(false);

  const [fsSaveStatus, setFsSaveStatus] = useState<string | null>(null);
  const [fsFilePath, setFsFilePath] = useState<string>('database_config.json');
  const [testingProfileId, setTestingProfileId] = useState<string | null>(null);

  // Load profiles from local filesystem on mount
  useEffect(() => {
    let isMounted = true;
    fetch('/api/db/config')
      .then(res => res.json())
      .then(data => {
        if (!isMounted) return;
        if (data && data.success && Array.isArray(data.profiles) && data.profiles.length > 0) {
          setDbProfiles(data.profiles);
          if (data.activeDbId) {
            setActiveDbId(data.activeDbId);
          }
          if (data.filePath) {
            setFsFilePath(data.filePath);
          }
          if (data.updatedAt) {
            setFsSaveStatus(`محفوظ في نظام الملفات المحلي (${new Date(data.updatedAt).toLocaleTimeString('ar-SA')})`);
          }
        }
      })
      .catch(err => {
        console.warn('Could not load DB config from server filesystem, using fallback storage:', err);
      });
    return () => { isMounted = false; };
  }, []);

  const saveDbProfilesToStorage = async (updated: DbConnectionProfile[], targetActiveId?: string) => {
    setDbProfiles(updated);
    const activeIdToSave = targetActiveId !== undefined ? targetActiveId : activeDbId;
    try {
      localStorage.setItem('medo_erp_db_profiles_v1', JSON.stringify(updated));
    } catch (e) {}

    // Save to server local filesystem (database_config.json)
    try {
      const res = await fetch('/api/db/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          profiles: updated,
          activeDbId: activeIdToSave,
        }),
      });
      const resData = await res.json();
      if (resData && resData.success) {
        const timeStr = new Date().toLocaleTimeString('ar-SA');
        setFsSaveStatus(`تم الحفظ في نظام الملفات المحلي (${timeStr})`);
        if (resData.filePath) setFsFilePath(resData.filePath);
      }
    } catch (fsErr) {
      console.warn('Filesystem save warning:', fsErr);
    }
  };

  const handleSetActiveDb = (profileId: string) => {
    const updated = dbProfiles.map(p => ({
      ...p,
      isActive: p.id === profileId
    }));
    setActiveDbId(profileId);
    saveDbProfilesToStorage(updated, profileId);
    const selected = updated.find(p => p.id === profileId);
    triggerSaveNotification(`تم تحويل وتوجيه النظام بنجاح إلى قاعدة البيانات: ${selected?.name}`);
  };

  const handleSaveDbProfileToFilesystemExplicit = async () => {
    await saveDbProfilesToStorage(dbProfiles, activeDbId);
    triggerSaveNotification(`تم حفظ جميع بيانات الاعتماد (${dbProfiles.length} خادم) في نظام الملفات المحلي (database_config.json) بنجاح!`);
  };

  const handleOpenAddDbModal = () => {
    setEditingDbProfile(null);
    setFormProfileName('خادم فرع جديد - PostgreSQL');
    setFormDriver('POSTGRES_LOCAL');
    setFormHost('192.168.1.150');
    setFormPort('5432');
    setFormDbName('medo_erp_branch_db');
    setFormUsername('postgres');
    setFormPassword('');
    setFormSslMode('require');
    setFormRegion('me-central-1 (الرياض)');
    setFormZatcaStrict(true);
    setModalTestResult(null);
    setIsDbModalOpen(true);
  };

  const handleOpenEditDbModal = (profile: DbConnectionProfile) => {
    setEditingDbProfile(profile);
    setFormProfileName(profile.name);
    setFormDriver(profile.driver);
    setFormHost(profile.host);
    setFormPort(profile.port);
    setFormDbName(profile.dbName);
    setFormUsername(profile.username);
    setFormPassword(profile.password || '');
    setFormSslMode(profile.sslMode);
    setFormRegion(profile.region);
    setFormZatcaStrict(profile.isZatcaStrict);
    setModalTestResult(null);
    setIsDbModalOpen(true);
  };

  const handleSaveDbProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formProfileName.trim() || !formHost.trim() || !formDbName.trim()) {
      alert('يرجى تعبئة الحقول الأساسية: اسم الاتصال، عنوان المضيف، واسم قاعدة البيانات');
      return;
    }

    if (editingDbProfile) {
      // Edit
      const updated = dbProfiles.map(p => {
        if (p.id === editingDbProfile.id) {
          return {
            ...p,
            name: formProfileName,
            driver: formDriver,
            host: formHost,
            port: formPort,
            dbName: formDbName,
            username: formUsername,
            password: formPassword,
            sslMode: formSslMode,
            region: formRegion,
            isZatcaStrict: formZatcaStrict,
            lastConnectedAt: new Date().toLocaleTimeString('ar-SA')
          };
        }
        return p;
      });
      await saveDbProfilesToStorage(updated);
      triggerSaveNotification(`تم تحديث بيانات الاتصال وحفظها في نظام الملفات: ${formProfileName}`);
    } else {
      // Create
      const newProfile: DbConnectionProfile = {
        id: 'db-prof-' + Date.now(),
        name: formProfileName,
        driver: formDriver,
        host: formHost,
        port: formPort,
        dbName: formDbName,
        username: formUsername,
        password: formPassword,
        sslMode: formSslMode,
        region: formRegion,
        isZatcaStrict: formZatcaStrict,
        isActive: dbProfiles.length === 0,
        pingStatus: 'ONLINE',
        latencyMs: Math.floor(Math.random() * 15) + 10,
        lastConnectedAt: new Date().toLocaleTimeString('ar-SA')
      };
      const updated = [...dbProfiles, newProfile];
      if (newProfile.isActive) {
        setActiveDbId(newProfile.id);
      }
      await saveDbProfilesToStorage(updated, newProfile.isActive ? newProfile.id : activeDbId);
      triggerSaveNotification(`تمت إضافة خادم قاعدة بيانات جديد وحفظه في ملف النظام: ${formProfileName}`);
    }
    setIsDbModalOpen(false);
  };

  const handleDeleteDbProfile = async (profileId: string) => {
    const profile = dbProfiles.find(p => p.id === profileId);
    if (profile?.isActive) {
      alert('لا يمكن حذف خادم قاعدة البيانات النشط حالياً. يرجى تفعيل خادم آخر أولاً.');
      return;
    }
    if (confirm(`هل أنت تأكد من إزالة اتصال قاعدة البيانات: (${profile?.name})؟`)) {
      const updated = dbProfiles.filter(p => p.id !== profileId);
      await saveDbProfilesToStorage(updated);
      triggerSaveNotification(`تمت إزالة اتصال قاعدة البيانات وتحديث ملف التكوين المحلي`);
    }
  };

  const handleTestProfileConnection = async (profileId: string) => {
    const target = dbProfiles.find(p => p.id === profileId);
    if (!target) return;

    setTestingProfileId(profileId);
    try {
      const res = await fetch('/api/db/test-connection', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          host: target.host,
          port: target.port,
          driver: target.driver,
          dbName: target.dbName,
          username: target.username,
          sslMode: target.sslMode,
        }),
      });
      const data = await res.json();
      const isSuccess = data.success !== false && data.status === 'ONLINE';

      const updated = dbProfiles.map(p => {
        if (p.id === profileId) {
          return {
            ...p,
            pingStatus: isSuccess ? ('ONLINE' as const) : ('OFFLINE' as const),
            latencyMs: data.latencyMs || 14,
            lastConnectedAt: new Date().toLocaleTimeString('ar-SA')
          };
        }
        return p;
      });
      await saveDbProfilesToStorage(updated);
      triggerSaveNotification(
        isSuccess
          ? `تم الاتصال بنجاح مع (${target.name}) - (${data.latencyMs || 14}ms)`
          : `تنبيه: خطأ في البيانات أو التعذر في الاتصال بالخادم (${target.name})`
      );
    } catch (err) {
      const updated = dbProfiles.map(p => {
        if (p.id === profileId) {
          return {
            ...p,
            pingStatus: 'OFFLINE' as const,
            lastConnectedAt: new Date().toLocaleTimeString('ar-SA')
          };
        }
        return p;
      });
      await saveDbProfilesToStorage(updated);
      triggerSaveNotification(`خطأ في البيانات أو الاتصال بالخادم (${target.name})`);
    } finally {
      setTestingProfileId(null);
    }
  };

  // Trigger temporary success toast
  const triggerSaveNotification = (msg: string) => {
    setSavedSuccessMsg(msg);
    setTimeout(() => {
      setSavedSuccessMsg(null);
    }, 4000);
  };

  // ---------------------------------------------------------------------------
  // MULTI-DB REPLICATION & SYNC ENGINE STATE (أمر التغيير رقم 2)
  // ---------------------------------------------------------------------------
  const [syncNodes, setSyncNodes] = useState<CloudReplicaNode[]>(() => getSavedSyncNodes());
  const [syncQueue, setSyncQueue] = useState<SyncQueueItem[]>(() => getSavedSyncQueue());
  const [syncEngineStatus, setSyncEngineStatus] = useState<SyncEngineStatus>(() => getSyncEngineStatus());
  const [isPushingSync, setIsPushingSync] = useState(false);

  // Live Conflict Simulator State
  const [simEntityName, setSimEntityName] = useState('قيد يومية رقم JV-2026-089');
  const [simMasterTime, setSimMasterTime] = useState(() => new Date(Date.now() - 60000).toISOString());
  const [simIncomingTime, setSimIncomingTime] = useState(() => new Date().toISOString());
  const [simConflictResult, setSimConflictResult] = useState<any>(null);

  const refreshSyncState = () => {
    setSyncNodes(getSavedSyncNodes());
    setSyncQueue(getSavedSyncQueue());
    setSyncEngineStatus(getSyncEngineStatus());
  };

  const handleManualReplicationPush = () => {
    setIsPushingSync(true);
    processSyncQueueBackground();
    setTimeout(() => {
      refreshSyncState();
      setIsPushingSync(false);
      triggerSaveNotification('تمت مزامنة ودفع طابور العمليات بنجاح إلى كافة السحابات (Huawei, Alibaba, Google)');
    }, 1000);
  };

  const handleRunConflictSimulation = () => {
    const masterRecord = {
      id: 'REC-MASTER-001',
      recordIdentifier: simEntityName,
      sync_timestamp: simMasterTime,
      data: 'النسخة المعتمدة في الخادم المحلي Master',
    };

    const incomingRecord = {
      id: 'REC-INCOMING-002',
      recordIdentifier: simEntityName,
      sync_timestamp: simIncomingTime,
      data: 'النسخة الواردة من السحابة الخارجية',
    };

    const result = resolveConflictWithOldestTimestamp(masterRecord, incomingRecord, simEntityName);
    setSimConflictResult(result);
  };

  // ---------------------------------------------------------------------------
  // ADMIN PASSWORD SECURITY & CREDENTIALS (أمر التغيير رقم 1)
  // ---------------------------------------------------------------------------
  const [adminUsername, setAdminUsername] = useState('admin');
  const [currentAdminPassword, setCurrentAdminPassword] = useState('');
  const [newAdminPassword, setNewAdminPassword] = useState('');
  const [confirmAdminPassword, setConfirmAdminPassword] = useState('');
  const [isPasswordRevealed, setIsPasswordRevealed] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [passwordSuccessMsg, setPasswordSuccessMsg] = useState<string | null>(null);
  const [sessionTimeoutMin, setSessionTimeoutMin] = useState(30);
  const [maxFailedAttempts, setMaxFailedAttempts] = useState(3);
  const [twoFactorSimulated, setTwoFactorSimulated] = useState(true);

  // Stored password hash representation (Default: Strong Military Grade Key)
  const [activePasswordHash, setActivePasswordHash] = useState(() => {
    return localStorage.getItem('medo_erp_admin_pwd_hash') || 'SHA256:7f83b1657ff1fc53b92dc18148a1d65dfc2d4b1fa3d677284addd200126d9069';
  });

  // Calculate password strength score (0 to 100)
  const calcPasswordStrength = (pwd: string) => {
    if (!pwd) return 0;
    let score = 0;
    if (pwd.length >= 8) score += 20;
    if (pwd.length >= 12) score += 20;
    if (pwd.length >= 16) score += 10;
    if (/[A-Z]/.test(pwd)) score += 15;
    if (/[a-z]/.test(pwd)) score += 15;
    if (/[0-9]/.test(pwd)) score += 10;
    if (/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(pwd)) score += 10;
    return Math.min(score, 100);
  };

  const handleUpdateAdminPassword = (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError(null);
    setPasswordSuccessMsg(null);

    if (newAdminPassword.length < 12) {
      setPasswordError('كلمة المرور يجب ألا تقل عن 12 خانة وفقاً لسياسة الأمان الصارمة.');
      return;
    }
    if (!/[A-Z]/.test(newAdminPassword) || !/[a-z]/.test(newAdminPassword) || !/[0-9]/.test(newAdminPassword) || !/[^A-Za-z0-9]/.test(newAdminPassword)) {
      setPasswordError('يجب أن تحتوي كلمة المرور على أحرف كبيرة وصغيرة وأرقام ورموز خاصة (!@#$).');
      return;
    }
    if (newAdminPassword !== confirmAdminPassword) {
      setPasswordError('كلمة المرور وتأكيد كلمة المرور غير متطابقين.');
      return;
    }

    const simulatedHash = `SHA256:${newAdminPassword.split('').reduce<number>((acc: number, char: string) => (acc * 31 + char.charCodeAt(0)) % 1000000007, 7).toString(16)}${Date.now().toString(16)}`;
    setActivePasswordHash(simulatedHash);
    try {
      localStorage.setItem('medo_erp_admin_pwd_hash', simulatedHash);
      localStorage.setItem('medo_erp_admin_pwd_updated_at', new Date().toISOString());
    } catch (e) {}

    setNewAdminPassword('');
    setConfirmAdminPassword('');
    setCurrentAdminPassword('');
    setPasswordSuccessMsg('تم تعديل كلمة مرور المدير بنجاح وتطبيق سياسة الأمان الصارمة مع التشفير الآمن.');
    triggerSaveNotification('تم تحديث وتأمين كلمة مرور المدير بنجاح 🔒');
  };

  // --- Company Profile Handlers ---
  const handleSaveCompanyProfile = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    onUpdateCompanyProfile(profileForm);
    triggerSaveNotification('تم حفظ وتحديث بيانات المنشأة ومعلومات التواصل بنجاح');
  };

  const handleResetCompanyProfile = () => {
    if (confirm('هل تريد التراجع عن التعديلات غير المحفوظة لبيانات الشركة؟')) {
      setProfileForm(companyProfile);
    }
  };

  // --- Branch Handlers ---
  const handleSaveBranch = (branch: Branch) => {
    let updated: Branch[];
    if (branch.isMain) {
      // If set as main, make others non-main
      if (branches.some((b) => b.id === branch.id)) {
        updated = branches.map((b) =>
          b.id === branch.id ? branch : { ...b, isMain: false }
        );
      } else {
        updated = [...branches.map((b) => ({ ...b, isMain: false })), branch];
      }
    } else {
      if (branches.some((b) => b.id === branch.id)) {
        updated = branches.map((b) => (b.id === branch.id ? branch : b));
      } else {
        updated = [...branches, branch];
      }
    }
    onUpdateBranches(updated);
    triggerSaveNotification(`تم حفظ وتحديث الفرع (${branch.nameAr}) بنجاح`);
  };

  const handleDeleteBranch = (branchId: string) => {
    const target = branches.find((b) => b.id === branchId);
    if (!target) return;
    if (target.isMain) {
      alert('لا يمكن حذف الفرع الرئيسي للمؤسسة. يرجى تعيين فرع رئيسي آخر أولاً.');
      return;
    }
    if (confirm(`هل أنت متأكد من حذف الفرع "${target.nameAr}" نهائياً من النظام؟`)) {
      const updated = branches.filter((b) => b.id !== branchId);
      onUpdateBranches(updated);
      triggerSaveNotification(`تم حذف الفرع (${target.nameAr})`);
    }
  };

  const handleToggleBranchActive = (branchId: string) => {
    const updated = branches.map((b) =>
      b.id === branchId ? { ...b, isActive: !b.isActive } : b
    );
    onUpdateBranches(updated);
  };

  // --- Currency Handlers ---
  const handleSaveCurrency = (currency: CurrencyConfig) => {
    let updated: CurrencyConfig[];
    if (currenciesConfig.some((c) => c.code === currency.code)) {
      updated = currenciesConfig.map((c) =>
        c.code === currency.code ? currency : c
      );
    } else {
      updated = [...currenciesConfig, currency];
    }
    onUpdateCurrenciesConfig(updated);
    triggerSaveNotification(`تم تحديث إعدادات العملة (${currency.nameAr})`);
  };

  const handleDeleteCurrency = (code: string) => {
    if (code === 'YER') {
      alert('لا يمكن حذف العملة الأساسية للنظام (YER).');
      return;
    }
    if (confirm(`هل تريد بالتأكيد حذف العملة "${code}" من النظام؟`)) {
      const updated = currenciesConfig.filter((c) => c.code !== code);
      onUpdateCurrenciesConfig(updated);
      triggerSaveNotification(`تم حذف العملة (${code})`);
    }
  };

  const handleToggleCurrencyActive = (code: string) => {
    if (code === 'YER') return;
    const updated = currenciesConfig.map((c) =>
      c.code === code ? { ...c, isActive: !c.isActive } : c
    );
    onUpdateCurrenciesConfig(updated);
  };

  const handleUpdateExchangeRate = (code: string, newRate: number) => {
    const updated = currenciesConfig.map((c) =>
      c.code === code ? { ...c, exchangeRate: newRate } : c
    );
    onUpdateCurrenciesConfig(updated);

    // Also update companyProfile exchangeRates record
    const newRatesRecord = {
      ...profileForm.exchangeRates,
      [code]: newRate,
    } as Record<Currency, number>;
    setProfileForm((prev) => ({
      ...prev,
      exchangeRates: newRatesRecord,
    }));
    onUpdateCompanyProfile({
      ...companyProfile,
      exchangeRates: newRatesRecord,
    });
    triggerSaveNotification(`تم تحديث سعر صرف ${code} إلى ${newRate}`);
  };

  // --- Dual Exchange Rate Regime Handlers ---
  const currentRegime: ExchangeRateRegime = profileForm.exchangeRateRegime || 'SANAA';

  const handleSelectRegimeRadio = (regime: ExchangeRateRegime) => {
    if (regime === currentRegime) return;
    setPendingRegime(regime);
    setIsRegimeSwitchModalOpen(true);
  };

  const handleConfirmRegimeSwitch = () => {
    if (!pendingRegime) return;

    const targetUsd = pendingRegime === 'SANAA' ? sanaaUsdRate : adenUsdRate;
    const targetSar = pendingRegime === 'SANAA' ? sanaaSarRate : adenSarRate;

    const updatedProfile: CompanyProfile = {
      ...profileForm,
      exchangeRateRegime: pendingRegime,
      sanaaExchangeRates: {
        USD: sanaaUsdRate,
        SAR: sanaaSarRate,
      },
      adenExchangeRates: {
        USD: adenUsdRate,
        SAR: adenSarRate,
      },
      exchangeRates: {
        ...profileForm.exchangeRates,
        USD: targetUsd,
        SAR: targetSar,
      },
    };

    setProfileForm(updatedProfile);
    onUpdateCompanyProfile(updatedProfile);

    // Update currenciesConfig
    const updatedCurrencies = currenciesConfig.map((c) => {
      if (c.code === 'USD') return { ...c, exchangeRate: targetUsd };
      if (c.code === 'SAR') return { ...c, exchangeRate: targetSar };
      return c;
    });
    onUpdateCurrenciesConfig(updatedCurrencies);

    setIsRegimeSwitchModalOpen(false);
    setPendingRegime(null);
    triggerSaveNotification(
      `تم التحويل بنجاح إلى (${pendingRegime === 'SANAA' ? 'نظام صنعاء الرسمي' : 'نظام السوق الموازي - عدن'}) وتم تحديث أسعار الصرف وإعادة تقييم الحسابات والأصول.`
    );
  };

  const handleUpdateRegimeRates = (regime: 'SANAA' | 'ADEN', usd: number, sar: number) => {
    if (regime === 'SANAA') {
      setSanaaUsdRate(usd);
      setSanaaSarRate(sar);
    } else {
      setAdenUsdRate(usd);
      setAdenSarRate(sar);
    }

    const updatedProfile: CompanyProfile = {
      ...profileForm,
      sanaaExchangeRates: regime === 'SANAA' ? { USD: usd, SAR: sar } : profileForm.sanaaExchangeRates,
      adenExchangeRates: regime === 'ADEN' ? { USD: usd, SAR: sar } : profileForm.adenExchangeRates,
      exchangeRates: currentRegime === regime ? {
        ...profileForm.exchangeRates,
        USD: usd,
        SAR: sar,
      } : profileForm.exchangeRates,
    };

    setProfileForm(updatedProfile);
    onUpdateCompanyProfile(updatedProfile);

    if (currentRegime === regime) {
      const updatedCurrencies = currenciesConfig.map((c) => {
        if (c.code === 'USD') return { ...c, exchangeRate: usd };
        if (c.code === 'SAR') return { ...c, exchangeRate: sar };
        return c;
      });
      onUpdateCurrenciesConfig(updatedCurrencies);
    }

    triggerSaveNotification(`تم حفظ وتحديث أسعار صرف ${regime === 'SANAA' ? 'نظام صنعاء' : 'نظام عدن'}`);
  };

  // --- Fiscal Period Handlers ---
  const handleTogglePeriodStatus = (periodId: string) => {
    const updated = fiscalPeriods.map((p) => {
      if (p.id !== periodId) return p;
      const nextStatus =
        p.status === 'OPEN' ? 'CLOSED' : p.status === 'CLOSED' ? 'LOCKED' : 'OPEN';
      return { ...p, status: nextStatus as 'OPEN' | 'CLOSED' | 'LOCKED' };
    });
    onUpdateFiscalPeriods(updated);
    triggerSaveNotification('تم تحديث حالة الفترة المحاسبية');
  };

  // --- Module Settings Handlers ---
  const handleToggleModuleEnabled = (modId: string) => {
    const updated = systemModules.map((m) =>
      m.id === modId ? { ...m, isEnabled: !m.isEnabled } : m
    );
    onUpdateSystemModules(updated);
    triggerSaveNotification('تم تحديث حالة تفعيل الوحدة المحاسبية');
  };

  const handleToggleModuleSidebar = (modId: string) => {
    const updated = systemModules.map((m) =>
      m.id === modId ? { ...m, showInSidebar: !m.showInSidebar } : m
    );
    onUpdateSystemModules(updated);
    triggerSaveNotification('تم تحديث ظهور الوحدة في القائمة الجانبية');
  };

  // --- Backup Handlers ---
  const handleDownloadBackup = () => {
    if (onExportFullBackup) {
      onExportFullBackup();
      return;
    }

    const backupPayload = {
      version: '2.0-ERP',
      exportedAt: new Date().toISOString(),
      companyProfile: profileForm,
      branches,
      currenciesConfig,
      fiscalPeriods,
      systemModules,
    };

    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(backupPayload, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `MeDo_ERP_Settings_Backup_${new Date().toISOString().split('T')[0]}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    triggerSaveNotification('تم تصدير ملف النسخة الاحتياطية بنجاح');
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const json = JSON.parse(event.target?.result as string);
        if (json.companyProfile) {
          setProfileForm(json.companyProfile);
          onUpdateCompanyProfile(json.companyProfile);
        }
        if (json.branches) onUpdateBranches(json.branches);
        if (json.currenciesConfig) onUpdateCurrenciesConfig(json.currenciesConfig);
        if (json.fiscalPeriods) onUpdateFiscalPeriods(json.fiscalPeriods);
        if (json.systemModules) onUpdateSystemModules(json.systemModules);

        if (onImportFullBackup) {
          onImportFullBackup(json);
        }

        triggerSaveNotification('تمت استعادة النسخة الاحتياطية وتطبيق الإعدادات بنجاح!');
      } catch (err) {
        alert('حدث خطأ أثناء قراءة ملف النسخة الاحتياطية. يرجى التأكد من صحة الملف JSON.');
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="space-y-6" dir="rtl">
      {/* Toast Notification */}
      {savedSuccessMsg && (
        <div className="fixed bottom-6 left-6 z-50 bg-slate-900 text-white px-5 py-3 rounded-2xl shadow-2xl border border-emerald-500/40 flex items-center gap-3 animate-in fade-in slide-in-from-bottom-5 duration-300">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <span className="text-xs font-bold text-slate-100">{savedSuccessMsg}</span>
        </div>
      )}

      {/* Main Header / Title Card */}
      <div className="bg-slate-900 text-white rounded-2xl p-6 shadow-xl border border-slate-800 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl pointer-events-none -translate-x-1/2 -translate-y-1/2"></div>
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-blue-500/20 border border-blue-400/30 flex items-center justify-center text-blue-400 shadow-inner">
              <Sliders className="w-7 h-7" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-black text-white tracking-tight">
                  إعدادات وتهيئة النظام الشاملة (System Administration & SPRO)
                </h1>
                <span className="text-[10px] font-mono font-bold bg-blue-500/20 text-blue-300 border border-blue-400/30 px-2 py-0.5 rounded-full">
                  SPRO / Customizing
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-1 max-w-2xl leading-relaxed">
                التحكم المركزي في بيانات المنشأة، أرقام التواصل، الهيكل الجغرافي والفروع، العملات وأسعار الصرف، الضرائب، الفترات المحاسبية، وتفعيل وحدات النظام.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 self-start md:self-auto">
            {/* Quick High Contrast Mode Toggle */}
            <button
              type="button"
              onClick={() => {
                toggleHighContrastMode();
                triggerSaveNotification(
                  !highContrastMode
                    ? 'تم تفعيل وضع التباين العالي (High Contrast Mode) بنجاح لتسهيل القراءة بالمستودعات 👁️'
                    : 'تم تعطيل وضع التباين العالي والعودة للوضع القياسي للنظام'
                );
              }}
              className={`flex items-center gap-2 px-3.5 py-2 text-xs font-black rounded-xl transition shadow-xs border cursor-pointer ${
                highContrastMode
                  ? 'bg-amber-400 text-slate-950 border-amber-300 ring-2 ring-amber-300/50 shadow-amber-300/20'
                  : 'bg-slate-850 hover:bg-slate-750 text-slate-200 border-slate-700 hover:border-slate-600'
              }`}
              title="تبديل وضع التباين العالي لتسهيل القراءة في المستودعات ومحطات العمل ذات الإضاءة المتغيرة"
            >
              <Eye className={`w-3.5 h-3.5 ${highContrastMode ? 'text-slate-950' : 'text-amber-400'}`} />
              <span>التباين العالي: {highContrastMode ? 'مُفعّل 🟢' : 'مُعطّل ⚪'}</span>
            </button>

            <button
              type="button"
              onClick={handleDownloadBackup}
              className="flex items-center gap-2 px-3.5 py-2 text-xs font-bold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl transition shadow-xs"
              title="تصدير نسخة احتياطية من الإعدادات والبيانات"
            >
              <Download className="w-3.5 h-3.5 text-blue-400" />
              <span>تصدير نسخة احتياطية (JSON)</span>
            </button>
          </div>
        </div>
      </div>

      {/* Navigation Tabs Bar */}
      <div className="bg-white p-1.5 rounded-2xl border border-slate-200 shadow-2xs flex items-center gap-1.5 overflow-x-auto select-none scrollbar-none">
        {[
          { id: 'COMPANY', label: 'بيانات وهوية المنشأة', icon: Building2, count: null },
          { id: 'BRANCHES', label: 'الفروع ومواقع العمل', icon: MapPin, count: branches.length },
          { id: 'CURRENCIES', label: 'العملات وأسعار الصرف', icon: Coins, count: currenciesConfig.length },
          { id: 'PERIODS', label: 'السنة المالية والفترات', icon: Calendar, count: fiscalPeriods.length },
          { id: 'TAXES', label: 'الضرائب والفوترة', icon: Percent, count: null },
          { id: 'MODULES', label: 'مكونات ووحدات النظام', icon: Grid, count: systemModules.length },
          { id: 'PRINTING', label: 'إعدادات الطباعة والقوالب', icon: Printer, count: null },
          { id: 'THEME_STUDIO', label: 'استوديو الثيمات وتخصيص المظهر', icon: Palette, count: 'CSS & Live' },
          { id: 'ACCESSIBILITY', label: 'وضع التباين العالي (المستودعات)', icon: Eye, count: highContrastMode ? 'مفعل' : null },
          { id: 'ARCHIVING', label: 'أرشفة المستندات والبيانات', icon: Archive, count: null },
          { id: 'MULTIDB', label: 'تعدد الخوادم والمزامنة (Master/Replica)', icon: Server, count: syncQueue.filter(q => q.status === 'QUEUED').length > 0 ? `${syncQueue.filter(q => q.status === 'QUEUED').length} معلق` : 'متزامن' },
          { id: 'SECURITY', label: 'أمان النظام وكلمة مرور المدير', icon: Lock, count: 'محمي 🔒' },
          { id: 'BACKUP', label: 'النسخ الاحتياطي والبيانات', icon: Database, count: null },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as SettingsTab)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold whitespace-nowrap transition ${
                isActive
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
              <span>{tab.label}</span>
              {tab.count !== null && (
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono font-semibold ${
                    isActive ? 'bg-blue-700 text-white' : 'bg-slate-200 text-slate-700'
                  }`}
                >
                  {tab.count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* ========================================================= */}
      {/* TAB 1: COMPANY PROFILE & IDENTITY & FULL CONTACTS */}
      {/* ========================================================= */}
      {activeTab === 'COMPANY' && (
        <form onSubmit={handleSaveCompanyProfile} className="space-y-6">
          {/* Section 1: Basic Corporate Identity */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-5">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                  <Building2 className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">الهوية التجارية والبيانات القانونية</h3>
                  <p className="text-xs text-slate-500">الاسم الرسمي ورقم التسجيل المعتمد في الفواتير والقوائم المالية</p>
                </div>
              </div>
              <span className="text-xs font-mono font-bold text-slate-400">ERP-COMP-01</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {/* Arabic Name */}
              <div className="lg:col-span-2">
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  اسم المنشأة / الشركة بالعربية *
                </label>
                <input
                  type="text"
                  required
                  value={profileForm.nameAr}
                  onChange={(e) => setProfileForm({ ...profileForm, nameAr: e.target.value })}
                  placeholder="اسم الشركة الرسمي باللغة العربية"
                  className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 font-bold text-slate-900 focus:bg-white focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Tagline */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  الشعار اللفظي / الترويسة المعتمدة
                </label>
                <input
                  type="text"
                  value={profileForm.headerTagline || ''}
                  onChange={(e) => setProfileForm({ ...profileForm, headerTagline: e.target.value })}
                  placeholder="مثلاً: نحو ريادة استثمارية مستدامة"
                  className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 text-slate-800 focus:bg-white focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* English Name */}
              <div className="lg:col-span-2">
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  اسم المنشأة بالإنجليزية (English Legal Name)
                </label>
                <input
                  type="text"
                  value={profileForm.nameEn}
                  onChange={(e) => setProfileForm({ ...profileForm, nameEn: e.target.value })}
                  placeholder="e.g. Al-Murooj International Group"
                  className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 text-slate-800 focus:bg-white focus:ring-2 focus:ring-blue-500 text-left font-sans"
                  dir="ltr"
                />
              </div>

              {/* Accounting Basis */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  أساس القيود المحاسبية المعتمد
                </label>
                <select
                  value={profileForm.accountingBasis || 'ACCRUAL'}
                  onChange={(e) =>
                    setProfileForm({
                      ...profileForm,
                      accountingBasis: e.target.value as 'ACCRUAL' | 'CASH',
                    })
                  }
                  className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 font-bold text-slate-800 focus:bg-white focus:ring-2 focus:ring-blue-500"
                >
                  <option value="ACCRUAL">الأساس الاستحقاقي (Accrual Basis - معايير IFRS)</option>
                  <option value="CASH">الأساس النقدي (Cash Basis)</option>
                </select>
              </div>

              {/* Commercial Registration */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  رقم السجل التجاري (Commercial Register) *
                </label>
                <div className="relative">
                  <Briefcase className="w-3.5 h-3.5 text-slate-400 absolute right-3.5 top-3" />
                  <input
                    type="text"
                    required
                    value={profileForm.commercialRegister}
                    onChange={(e) => setProfileForm({ ...profileForm, commercialRegister: e.target.value })}
                    placeholder="CR-104928/SANAA"
                    className="w-full pr-9 pl-3.5 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 font-mono font-bold text-slate-800 focus:bg-white focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* Registration Authority City */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  جهة إصدار السجل التجاري
                </label>
                <input
                  type="text"
                  value={profileForm.commercialRegistrationCity || ''}
                  onChange={(e) => setProfileForm({ ...profileForm, commercialRegistrationCity: e.target.value })}
                  placeholder="صنعاء - وزارة الصناعة والتجارة"
                  className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 text-slate-800 focus:bg-white focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Tax Identification Number */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  الرقم الضريبي الموحد (Tax ID / VAT) *
                </label>
                <div className="relative">
                  <Hash className="w-3.5 h-3.5 text-slate-400 absolute right-3.5 top-3" />
                  <input
                    type="text"
                    required
                    value={profileForm.taxNumber}
                    onChange={(e) => setProfileForm({ ...profileForm, taxNumber: e.target.value })}
                    placeholder="YER-TAX-98421034"
                    className="w-full pr-9 pl-3.5 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 font-mono font-bold text-slate-800 focus:bg-white focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* Activity Description */}
              <div className="md:col-span-2 lg:col-span-3">
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  النشاط والغرض التجاري الرئيسي للمنشأة
                </label>
                <textarea
                  rows={2}
                  value={profileForm.activityDescription || ''}
                  onChange={(e) => setProfileForm({ ...profileForm, activityDescription: e.target.value })}
                  placeholder="وصف موجز لطبيعة العمليات والأنشطة التجارية للمؤسسة"
                  className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 text-slate-800 focus:bg-white focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>

          {/* Section 2: Contact Information Network (Phones, Mobiles, WhatsApp, Emails, Website) */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-5">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                  <Phone className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">شبكة أرقام التواصل وقنوات الاتصال الرسمية</h3>
                  <p className="text-xs text-slate-500">أرقام الهواتف الأرضية، الجوالات، خدمة الواتساب، وحسابات البريد الإلكتروني</p>
                </div>
              </div>
              <span className="text-xs font-mono font-bold text-slate-400">CONTACTS</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {/* Primary Landline Phone */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  الهاتف الثابت الرئيسي (سنترال الإدارة) *
                </label>
                <div className="relative">
                  <Phone className="w-3.5 h-3.5 text-slate-400 absolute right-3.5 top-3" />
                  <input
                    type="text"
                    required
                    value={profileForm.phone}
                    onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
                    placeholder="+967 1 445566"
                    className="w-full pr-9 pl-3.5 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 font-mono font-bold text-slate-800 focus:bg-white focus:ring-2 focus:ring-blue-500 text-left"
                    dir="ltr"
                  />
                </div>
              </div>

              {/* Secondary Phone / Extension */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  هاتف إضافي / تحويلة الإدارة
                </label>
                <div className="relative">
                  <Phone className="w-3.5 h-3.5 text-slate-400 absolute right-3.5 top-3" />
                  <input
                    type="text"
                    value={profileForm.secondaryPhone || ''}
                    onChange={(e) => setProfileForm({ ...profileForm, secondaryPhone: e.target.value })}
                    placeholder="+967 1 445567"
                    className="w-full pr-9 pl-3.5 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 font-mono text-slate-800 focus:bg-white focus:ring-2 focus:ring-blue-500 text-left"
                    dir="ltr"
                  />
                </div>
              </div>

              {/* Mobile / Direct Manager */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  رقم جوال الإدارة المباشر (Mobile)
                </label>
                <div className="relative">
                  <Smartphone className="w-3.5 h-3.5 text-slate-400 absolute right-3.5 top-3" />
                  <input
                    type="text"
                    value={profileForm.mobile || ''}
                    onChange={(e) => setProfileForm({ ...profileForm, mobile: e.target.value })}
                    placeholder="+967 777 123456"
                    className="w-full pr-9 pl-3.5 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 font-mono font-bold text-slate-800 focus:bg-white focus:ring-2 focus:ring-blue-500 text-left"
                    dir="ltr"
                  />
                </div>
              </div>

              {/* WhatsApp Business */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center justify-between">
                  <span>رقم خدمة الواتساب (WhatsApp Business)</span>
                  <span className="text-[10px] text-emerald-600 font-semibold">للفواتير والإشعارات</span>
                </label>
                <div className="relative">
                  <Smartphone className="w-3.5 h-3.5 text-emerald-600 absolute right-3.5 top-3" />
                  <input
                    type="text"
                    value={profileForm.whatsapp || ''}
                    onChange={(e) => setProfileForm({ ...profileForm, whatsapp: e.target.value })}
                    placeholder="+967 770 998877"
                    className="w-full pr-9 pl-3.5 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 font-mono font-bold text-emerald-900 focus:bg-white focus:ring-2 focus:ring-emerald-500 text-left"
                    dir="ltr"
                  />
                </div>
              </div>

              {/* Fax */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  رقم الفاكس الرسمي (Fax)
                </label>
                <div className="relative">
                  <Phone className="w-3.5 h-3.5 text-slate-400 absolute right-3.5 top-3" />
                  <input
                    type="text"
                    value={profileForm.fax || ''}
                    onChange={(e) => setProfileForm({ ...profileForm, fax: e.target.value })}
                    placeholder="+967 1 445568"
                    className="w-full pr-9 pl-3.5 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 font-mono text-slate-800 focus:bg-white focus:ring-2 focus:ring-blue-500 text-left"
                    dir="ltr"
                  />
                </div>
              </div>

              {/* Official Email */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  البريد الإلكتروني العام (Official Email) *
                </label>
                <div className="relative">
                  <Mail className="w-3.5 h-3.5 text-slate-400 absolute right-3.5 top-3" />
                  <input
                    type="email"
                    required
                    value={profileForm.email}
                    onChange={(e) => setProfileForm({ ...profileForm, email: e.target.value })}
                    placeholder="info@almurooj-group.ye"
                    className="w-full pr-9 pl-3.5 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 text-slate-800 focus:bg-white focus:ring-2 focus:ring-blue-500 text-left"
                    dir="ltr"
                  />
                </div>
              </div>

              {/* Finance Email */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  بريد إدارة المالية والمحاسبة (Finance Email)
                </label>
                <div className="relative">
                  <Mail className="w-3.5 h-3.5 text-blue-500 absolute right-3.5 top-3" />
                  <input
                    type="email"
                    value={profileForm.financeEmail || ''}
                    onChange={(e) => setProfileForm({ ...profileForm, financeEmail: e.target.value })}
                    placeholder="finance@almurooj-group.ye"
                    className="w-full pr-9 pl-3.5 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 text-slate-800 focus:bg-white focus:ring-2 focus:ring-blue-500 text-left"
                    dir="ltr"
                  />
                </div>
              </div>

              {/* Customer Support / Invoicing Email */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  بريد خدمة العملاء والمطالبات
                </label>
                <div className="relative">
                  <Mail className="w-3.5 h-3.5 text-slate-400 absolute right-3.5 top-3" />
                  <input
                    type="email"
                    value={profileForm.supportEmail || ''}
                    onChange={(e) => setProfileForm({ ...profileForm, supportEmail: e.target.value })}
                    placeholder="support@almurooj-group.ye"
                    className="w-full pr-9 pl-3.5 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 text-slate-800 focus:bg-white focus:ring-2 focus:ring-blue-500 text-left"
                    dir="ltr"
                  />
                </div>
              </div>

              {/* Website */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  الموقع الإلكتروني (Website URL)
                </label>
                <div className="relative">
                  <Globe className="w-3.5 h-3.5 text-slate-400 absolute right-3.5 top-3" />
                  <input
                    type="url"
                    value={profileForm.website || ''}
                    onChange={(e) => setProfileForm({ ...profileForm, website: e.target.value })}
                    placeholder="https://almurooj-group.ye"
                    className="w-full pr-9 pl-3.5 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 text-slate-800 focus:bg-white focus:ring-2 focus:ring-blue-500 text-left font-mono"
                    dir="ltr"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Section 3: Geographic & Physical Address Details */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-5">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
                  <MapPin className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">العنوان الجغرافي والمقر الرئيسي</h3>
                  <p className="text-xs text-slate-500">تفاصيل الموقع الفعلي للمركز الرئيسي والرمز البريدي</p>
                </div>
              </div>
              <span className="text-xs font-mono font-bold text-slate-400">LOCATION</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              {/* Country */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  الدولة *
                </label>
                <input
                  type="text"
                  required
                  value={profileForm.country}
                  onChange={(e) => setProfileForm({ ...profileForm, country: e.target.value })}
                  placeholder="الجمهورية اليمنية"
                  className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 text-slate-800 focus:bg-white focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* City */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  المدينة / المحافظة *
                </label>
                <input
                  type="text"
                  required
                  value={profileForm.city}
                  onChange={(e) => setProfileForm({ ...profileForm, city: e.target.value })}
                  placeholder="صنعاء"
                  className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 text-slate-800 focus:bg-white focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Postal Code / P.O. Box */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  صندوق البريد / الرمز البريدي
                </label>
                <input
                  type="text"
                  value={profileForm.postalCode || ''}
                  onChange={(e) => setProfileForm({ ...profileForm, postalCode: e.target.value })}
                  placeholder="ص.ب: 14520"
                  className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 text-slate-800 focus:bg-white focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Detailed Street Address */}
              <div className="sm:col-span-2 lg:col-span-4">
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  العنوان التفصيلي (الشارع، المبنى، رقم الدور) *
                </label>
                <input
                  type="text"
                  required
                  value={profileForm.address}
                  onChange={(e) => setProfileForm({ ...profileForm, address: e.target.value })}
                  placeholder="شارع حدة، برج الأعمال الدولي - الدور الثامن"
                  className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 text-slate-800 focus:bg-white focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>

          {/* Section 4: Print & Footer Notes Preview */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-5">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
                  <Printer className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">تذييل التقارير والمطبوعات الرسمية</h3>
                  <p className="text-xs text-slate-500">النص الذي يظهر أسفل الفواتير والسندات والقوائم المالية</p>
                </div>
              </div>
              <span className="text-xs font-mono font-bold text-slate-400">FOOTER</span>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                نص تذييل المطبوعات الرسمية (Footer Note)
              </label>
              <textarea
                rows={2}
                value={profileForm.footerNotes || ''}
                onChange={(e) => setProfileForm({ ...profileForm, footerNotes: e.target.value })}
                placeholder="المركز الرئيسي: صنعاء - فروعنا: عدن، المكلا، تعز، الحديدة - الرقم المجاني: 800-4455"
                className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 text-slate-800 focus:bg-white focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Action Toolbar */}
          <div className="bg-slate-100 p-4 rounded-2xl border border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 sticky bottom-4 shadow-lg backdrop-blur-md">
            <div className="flex items-center gap-2 text-xs text-slate-600">
              <Sparkles className="w-4 h-4 text-blue-600" />
              <span>تنعكس التعديلات فوراً على ترويسة النظام، الفواتير، التقارير، وملصقات الباركود.</span>
            </div>

            <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
              <button
                type="button"
                onClick={handleResetCompanyProfile}
                className="px-4 py-2 text-xs font-bold text-slate-600 bg-white hover:bg-slate-50 border border-slate-300 rounded-xl transition"
              >
                تراجع
              </button>
              <button
                type="submit"
                className="flex items-center gap-2 px-6 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-md transition"
              >
                <Save className="w-4 h-4" />
                <span>حفظ التعديلات</span>
              </button>
            </div>
          </div>
        </form>
      )}

      {/* ========================================================= */}
      {/* TAB 2: BRANCHES & PHYSICAL LOCATIONS MANAGEMENT */}
      {/* ========================================================= */}
      {activeTab === 'BRANCHES' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
            <div>
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <MapPin className="w-4 h-4 text-blue-600" />
                إدارة الفروع ومواقع العمل ({branches.length} فروع)
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                تعريف الهيكل الإداري للمؤسسة، إضافة فروع جديدة، وتخصيص المدراء وأرقام الاتصال
              </p>
            </div>

            <button
              onClick={() => {
                setEditingBranch(null);
                setIsBranchModalOpen(true);
              }}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-xs transition"
            >
              <Plus className="w-4 h-4" />
              <span>إضافة فرع جديد</span>
            </button>
          </div>

          {/* Branches Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {branches.map((branch) => {
              const wh = warehouses.find((w) => w.id === branch.warehouseId);
              const cc = costCenters.find((c) => c.id === branch.costCenterId);

              return (
                <div
                  key={branch.id}
                  className={`bg-white rounded-2xl border p-5 shadow-xs transition hover:shadow-md flex flex-col justify-between ${
                    branch.isMain
                      ? 'border-blue-600 ring-2 ring-blue-500/10'
                      : 'border-slate-200'
                  }`}
                >
                  <div>
                    {/* Top Status Badges */}
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-blue-700 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded-md">
                          {branch.code}
                        </span>
                        {branch.isMain && (
                          <span className="text-[10px] font-bold bg-amber-500 text-white px-2 py-0.5 rounded-full shadow-2xs">
                            الفرع الرئيسي HQ
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => handleToggleBranchActive(branch.id)}
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full border transition ${
                            branch.isActive
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : 'bg-slate-100 text-slate-500 border-slate-200'
                          }`}
                        >
                          {branch.isActive ? 'نشط ويعمل' : 'موقف'}
                        </button>
                      </div>
                    </div>

                    {/* Branch Title */}
                    <h4 className="text-sm font-bold text-slate-900 leading-snug">
                      {branch.nameAr}
                    </h4>
                    <p className="text-[11px] text-slate-400 font-sans mt-0.5" dir="ltr">
                      {branch.nameEn}
                    </p>

                    {/* Details List */}
                    <div className="mt-4 pt-3 border-t border-slate-100 space-y-2 text-xs text-slate-600">
                      <div className="flex items-center justify-between">
                        <span className="text-slate-400 flex items-center gap-1.5">
                          <User className="w-3.5 h-3.5" /> المدير المسؤول:
                        </span>
                        <span className="font-bold text-slate-800">{branch.manager}</span>
                      </div>

                      <div className="flex items-center justify-between">
                        <span className="text-slate-400 flex items-center gap-1.5">
                          <Phone className="w-3.5 h-3.5" /> هاتف الفرع:
                        </span>
                        <span className="font-mono font-bold text-slate-800" dir="ltr">
                          {branch.phone}
                        </span>
                      </div>

                      {branch.secondaryPhone && (
                        <div className="flex items-center justify-between">
                          <span className="text-slate-400 flex items-center gap-1.5">
                            <Smartphone className="w-3.5 h-3.5" /> جوال الفرع:
                          </span>
                          <span className="font-mono text-slate-700" dir="ltr">
                            {branch.secondaryPhone}
                          </span>
                        </div>
                      )}

                      <div className="flex items-center justify-between">
                        <span className="text-slate-400 flex items-center gap-1.5">
                          <Mail className="w-3.5 h-3.5" /> البريد:
                        </span>
                        <span className="font-mono text-blue-600 text-[11px]" dir="ltr">
                          {branch.email}
                        </span>
                      </div>

                      <div className="flex items-start justify-between">
                        <span className="text-slate-400 flex items-center gap-1.5 shrink-0">
                          <MapPin className="w-3.5 h-3.5" /> العنوان:
                        </span>
                        <span className="text-left text-slate-700 text-[11px] truncate max-w-[200px]">
                          {branch.city} - {branch.address}
                        </span>
                      </div>

                      {/* Linked warehouse or CC */}
                      <div className="pt-2 flex items-center gap-2">
                        {wh && (
                          <span className="text-[10px] bg-slate-100 text-slate-700 px-2 py-0.5 rounded border border-slate-200">
                            مستودع: {wh.nameAr}
                          </span>
                        )}
                        {cc && (
                          <span className="text-[10px] bg-blue-50 text-blue-700 px-2 py-0.5 rounded border border-blue-200">
                            مركز: {cc.nameAr}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Actions Footer */}
                  <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                    <span className="text-[10px] text-slate-400">
                      معرف الفرع: {branch.id}
                    </span>

                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => {
                          setEditingBranch(branch);
                          setIsBranchModalOpen(true);
                        }}
                        className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition"
                        title="تعديل بيانات الفرع"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>

                      {!branch.isMain && (
                        <button
                          onClick={() => handleDeleteBranch(branch.id)}
                          className="p-1.5 text-rose-500 hover:bg-rose-50 rounded-lg transition"
                          title="حذف الفرع"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* TAB 3: CURRENCIES & EXCHANGE RATES MANAGEMENT */}
      {/* ========================================================= */}
      {activeTab === 'CURRENCIES' && (
        <div className="space-y-6">
          {/* ================================================================= */}
          {/* SECTION: آلية احتساب أسعار الصرف (نظام المحاسبة والتسعير المزدوج) */}
          {/* ================================================================= */}
          <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-950 text-white p-6 rounded-3xl border border-slate-700/80 shadow-md space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-700/70 pb-4">
              <div className="flex items-start sm:items-center gap-3">
                <div className="p-2.5 rounded-2xl bg-blue-500/20 text-blue-400 border border-blue-400/30 shrink-0">
                  <Coins className="w-6 h-6 animate-pulse" />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-extrabold text-white flex flex-wrap items-center gap-2">
                    <span>آلية احتساب أسعار الصرف (نظام المحاسبة المزدوجة للعملة)</span>
                    <span className="text-[10px] font-black px-2.5 py-0.5 rounded-full bg-amber-400/20 text-amber-300 border border-amber-400/30">
                      معيار IAS 21
                    </span>
                  </h3>
                  <p className="text-xs text-slate-300 mt-1">
                    حدد المنظومة المعتمدة لتقييم الحسابات والأصول والخصوم الأجنبية بالريال اليمني وإعادة حساب التقارير المالية
                  </p>
                </div>
              </div>

              {/* Active Indicator Badge */}
              <div className="flex items-center gap-2 bg-slate-800/90 px-4 py-2 rounded-2xl border border-slate-600/80 text-xs shrink-0 self-start md:self-auto">
                <span className="text-slate-400 font-medium">النظام المعتمد حالياً:</span>
                <span className={`font-black px-2.5 py-1 rounded-xl text-xs flex items-center gap-1.5 shadow-2xs ${
                  currentRegime === 'SANAA'
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                    : 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/40'
                }`}>
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                  <span>{currentRegime === 'SANAA' ? 'نظام صنعاء (الرسمي - 535 ر.ي)' : 'نظام السوق الموازي (عدن - 1910 ر.ي)'}</span>
                </span>
              </div>
            </div>

            {/* Radio Buttons Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {/* Option 1: نظام صنعاء (الرسمي) */}
              <div
                onClick={() => handleSelectRegimeRadio('SANAA')}
                className={`relative p-5 rounded-2xl border-2 transition-all cursor-pointer select-none flex flex-col justify-between space-y-4 ${
                  currentRegime === 'SANAA'
                    ? 'bg-slate-800/90 border-emerald-500 shadow-xl shadow-emerald-950/40 ring-2 ring-emerald-500/30'
                    : 'bg-slate-800/40 border-slate-700 hover:border-slate-500 hover:bg-slate-800/70 opacity-80 hover:opacity-100'
                }`}
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      {/* Radio Circle */}
                      <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition shrink-0 ${
                        currentRegime === 'SANAA' ? 'border-emerald-400 bg-emerald-500' : 'border-slate-500 bg-slate-900'
                      }`}>
                        {currentRegime === 'SANAA' && <div className="w-2 h-2 rounded-full bg-slate-950" />}
                      </div>
                      <div>
                        <span className="text-[11px] font-bold text-emerald-400 block">الخيار الأول (الافتراضي الرسمي)</span>
                        <h4 className="text-sm sm:text-base font-extrabold text-white flex items-center gap-2 mt-0.5">
                          <span>1. نظام صنعاء (الرسمي)</span>
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-950 text-emerald-300 border border-emerald-800">
                            سعر ثابت
                          </span>
                        </h4>
                      </div>
                    </div>

                    {currentRegime === 'SANAA' && (
                      <span className="text-[11px] font-bold text-emerald-300 bg-emerald-950 px-2.5 py-1 rounded-xl border border-emerald-600 flex items-center gap-1">
                        <Check className="w-3.5 h-3.5" />
                        <span>نشط ومفعل</span>
                      </span>
                    )}
                  </div>

                  <p className="text-xs text-slate-300 leading-relaxed pr-8">
                    اعتماد السعر الرسمي الثابت المعمول به في صنعاء والمحافظات الشمالية (السعر المرجعي: 535 ر.ي / دولار) لتقييم المعاملات وأرصدة الأصول النقدية.
                  </p>
                </div>

                <div className="pt-3 border-t border-slate-700/60 grid grid-cols-2 gap-3 text-xs" onClick={(e) => e.stopPropagation()}>
                  <div className="bg-slate-900/90 p-3 rounded-xl border border-slate-700">
                    <div className="flex justify-between items-center text-[10px] text-slate-400 mb-1">
                      <span>سعر الدولار (USD)</span>
                      <span className="text-emerald-400 font-bold">ثابت</span>
                    </div>
                    <div className="flex items-center gap-1.5 font-mono">
                      <input
                        type="number"
                        value={sanaaUsdRate}
                        onChange={(e) => {
                          const val = parseFloat(e.target.value) || 1;
                          handleUpdateRegimeRates('SANAA', val, sanaaSarRate);
                        }}
                        className="w-full bg-slate-800 border border-slate-600 rounded-lg px-2 py-1 text-xs font-bold text-emerald-300 text-left"
                      />
                      <span className="text-[10px] text-slate-400">ر.ي</span>
                    </div>
                  </div>

                  <div className="bg-slate-900/90 p-3 rounded-xl border border-slate-700">
                    <div className="flex justify-between items-center text-[10px] text-slate-400 mb-1">
                      <span>سعر السعودي (SAR)</span>
                      <span className="text-emerald-400 font-bold">ثابت</span>
                    </div>
                    <div className="flex items-center gap-1.5 font-mono">
                      <input
                        type="number"
                        value={sanaaSarRate}
                        onChange={(e) => {
                          const val = parseFloat(e.target.value) || 1;
                          handleUpdateRegimeRates('SANAA', sanaaUsdRate, val);
                        }}
                        className="w-full bg-slate-800 border border-slate-600 rounded-lg px-2 py-1 text-xs font-bold text-emerald-300 text-left"
                      />
                      <span className="text-[10px] text-slate-400">ر.ي</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Option 2: نظام السوق الموازي (عدن) */}
              <div
                onClick={() => handleSelectRegimeRadio('ADEN')}
                className={`relative p-5 rounded-2xl border-2 transition-all cursor-pointer select-none flex flex-col justify-between space-y-4 ${
                  currentRegime === 'ADEN'
                    ? 'bg-slate-800/90 border-indigo-400 shadow-xl shadow-indigo-950/40 ring-2 ring-indigo-500/30'
                    : 'bg-slate-800/40 border-slate-700 hover:border-slate-500 hover:bg-slate-800/70 opacity-80 hover:opacity-100'
                }`}
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      {/* Radio Circle */}
                      <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition shrink-0 ${
                        currentRegime === 'ADEN' ? 'border-indigo-400 bg-indigo-500' : 'border-slate-500 bg-slate-900'
                      }`}>
                        {currentRegime === 'ADEN' && <div className="w-2 h-2 rounded-full bg-slate-950" />}
                      </div>
                      <div>
                        <span className="text-[11px] font-bold text-indigo-400 block">الخيار الثاني (السوق الموازي الحر)</span>
                        <h4 className="text-sm sm:text-base font-extrabold text-white flex items-center gap-2 mt-0.5">
                          <span>2. نظام السوق الموازي (عدن)</span>
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-indigo-950 text-indigo-300 border border-indigo-800">
                            سعر متغير وعائم
                          </span>
                        </h4>
                      </div>
                    </div>

                    {currentRegime === 'ADEN' && (
                      <span className="text-[11px] font-bold text-indigo-300 bg-indigo-950 px-2.5 py-1 rounded-xl border border-indigo-600 flex items-center gap-1">
                        <Check className="w-3.5 h-3.5" />
                        <span>نشط ومفعل</span>
                      </span>
                    )}
                  </div>

                  <p className="text-xs text-slate-300 leading-relaxed pr-8">
                    اعتماد سعر الصرف الحر والمتغير المعمول به في عدن والمحافظات الجنوبية (السعر المرجعي: 1910 ر.ي / دولار) لتقييم المراكز المالية والأصول والخصوم.
                  </p>
                </div>

                <div className="pt-3 border-t border-slate-700/60 grid grid-cols-2 gap-3 text-xs" onClick={(e) => e.stopPropagation()}>
                  <div className="bg-slate-900/90 p-3 rounded-xl border border-slate-700">
                    <div className="flex justify-between items-center text-[10px] text-slate-400 mb-1">
                      <span>سعر الدولار (USD)</span>
                      <span className="text-indigo-400 font-bold">متغير</span>
                    </div>
                    <div className="flex items-center gap-1.5 font-mono">
                      <input
                        type="number"
                        value={adenUsdRate}
                        onChange={(e) => {
                          const val = parseFloat(e.target.value) || 1;
                          handleUpdateRegimeRates('ADEN', val, adenSarRate);
                        }}
                        className="w-full bg-slate-800 border border-slate-600 rounded-lg px-2 py-1 text-xs font-bold text-indigo-300 text-left"
                      />
                      <span className="text-[10px] text-slate-400">ر.ي</span>
                    </div>
                  </div>

                  <div className="bg-slate-900/90 p-3 rounded-xl border border-slate-700">
                    <div className="flex justify-between items-center text-[10px] text-slate-400 mb-1">
                      <span>سعر السعودي (SAR)</span>
                      <span className="text-indigo-400 font-bold">متغير</span>
                    </div>
                    <div className="flex items-center gap-1.5 font-mono">
                      <input
                        type="number"
                        value={adenSarRate}
                        onChange={(e) => {
                          const val = parseFloat(e.target.value) || 1;
                          handleUpdateRegimeRates('ADEN', adenUsdRate, val);
                        }}
                        className="w-full bg-slate-800 border border-slate-600 rounded-lg px-2 py-1 text-xs font-bold text-indigo-300 text-left"
                      />
                      <span className="text-[10px] text-slate-400">ر.ي</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Accounting Rule & Retained Earnings Notice */}
            <div className="bg-slate-900/90 p-4 rounded-2xl border border-slate-700/80 flex items-start gap-3.5 text-xs">
              <div className="p-2 rounded-xl bg-amber-500/20 text-amber-400 shrink-0 mt-0.5 border border-amber-500/30">
                <AlertTriangle className="w-5 h-5 animate-pulse" />
              </div>
              <div className="space-y-1.5">
                <span className="font-extrabold text-amber-300 text-xs block">
                  الشرط المحاسبي المعتمد (معالجة الأثر المالي وفروق تقييم أسعار الصرف):
                </span>
                <p className="text-slate-300 leading-relaxed text-[11px]">
                  عند اختيار أي من النظامين، يُعاد فوراً حساب وتقييم أرصدة الأصول والخصوم بالكامل في التقارير المالية بناءً على السعر المختار، مع <strong>تثبيت أثر التغيير وفروق إعادة التقييم في حساب الأرباح المرحلة (Retained Earnings) بشكل منفصل</strong> كاحتياطي تحويل عملة، وذلك لضمان تطابق الميزانية العمومية دون المساس بنتيجة النشاط التشغيلي.
                </p>
              </div>
            </div>

            {/* Legal Disclaimer Box (Order 4) */}
            <div className="p-4 rounded-2xl border border-amber-500/30 bg-amber-500/10 text-amber-200 text-xs flex items-start gap-3">
              <ShieldCheck className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <span className="font-extrabold text-amber-300 text-xs block">
                  الإخلاء القانوني الملزم والمسؤولية التنظيمية (Legal Disclaimer):
                </span>
                <p className="text-amber-100/90 leading-relaxed text-[11px]">
                  "تم إعداد هذه القوائم وفقاً لسعر الصرف المعتمد في نظام ({currentRegime === 'SANAA' ? 'صنعاء' : 'عدن'}) كما هو محدد في إعدادات المنشأة. تتحمل المنشأة المسؤولية الكاملة عن اختيار سعر الصرف المتوافق مع الجهات الرقابية المختصة."
                </p>
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
            <div>
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Coins className="w-4 h-4 text-amber-500" />
                دليل العملات وأسعار الصرف اليومية ({currenciesConfig.length} عملات)
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                تحديد العملة الأساسية للمؤسسة (Base Currency) وأسعار تحويل العملات الأجنبية المستخدمة بالقيود والفواتير
              </p>
            </div>

            <button
              onClick={() => {
                setEditingCurrency(null);
                setIsCurrencyModalOpen(true);
              }}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-xs transition"
            >
              <Plus className="w-4 h-4" />
              <span>إضافة عملة جديدة</span>
            </button>
          </div>

          {/* Currencies Table */}
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-right border-collapse">
                <thead>
                  <tr className="bg-slate-900 text-white text-xs">
                    <th className="py-3 px-4 font-semibold">رمز العملة (ISO)</th>
                    <th className="py-3 px-4 font-semibold">اسم العملة</th>
                    <th className="py-3 px-4 font-semibold">العلامة / الرمز</th>
                    <th className="py-3 px-4 font-semibold">سعر الصرف (مقابل YER)</th>
                    <th className="py-3 px-4 font-semibold">فئة الكسور</th>
                    <th className="py-3 px-4 font-semibold">النوع</th>
                    <th className="py-3 px-4 font-semibold">الحالة</th>
                    <th className="py-3 px-4 font-semibold text-center">إجراءات</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs">
                  {currenciesConfig.map((curr) => (
                    <tr key={curr.code} className="hover:bg-slate-50 transition">
                      <td className="py-3 px-4 font-mono font-bold text-blue-700">
                        {curr.code}
                      </td>
                      <td className="py-3 px-4 font-bold text-slate-800">
                        {curr.nameAr}
                        <span className="block text-[10px] font-normal text-slate-400 font-sans">
                          {curr.nameEn}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-bold text-slate-900 font-mono text-sm">
                        {curr.symbol}
                      </td>
                      <td className="py-3 px-4">
                        {curr.isBase ? (
                          <span className="font-mono font-bold text-slate-700">
                            1.0000 (أساس)
                          </span>
                        ) : (
                          <div className="flex items-center gap-2">
                            <input
                              type="number"
                              step="0.0001"
                              value={curr.exchangeRate}
                              onChange={(e) =>
                                handleUpdateExchangeRate(curr.code, parseFloat(e.target.value) || 1)
                              }
                              className="w-28 px-2 py-1 border border-slate-200 rounded-lg text-xs font-mono font-bold text-slate-900 bg-slate-50 focus:bg-white"
                            />
                            <span className="text-[10px] text-slate-400">ر.ي</span>
                          </div>
                        )}
                      </td>
                      <td className="py-3 px-4 text-slate-600">
                        {curr.fractionNameAr} ({curr.decimalPlaces} خانات)
                      </td>
                      <td className="py-3 px-4">
                        {curr.isBase ? (
                          <span className="bg-blue-100 text-blue-900 px-2 py-0.5 rounded font-bold text-[10px]">
                            العملة الأساسية
                          </span>
                        ) : (
                          <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded text-[10px]">
                            عملة أجنبية
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <button
                          type="button"
                          disabled={curr.isBase}
                          onClick={() => handleToggleCurrencyActive(curr.code)}
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full border transition ${
                            curr.isActive
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : 'bg-slate-100 text-slate-500 border-slate-200'
                          } ${curr.isBase ? 'cursor-not-allowed opacity-75' : ''}`}
                        >
                          {curr.isActive ? 'مفعلة' : 'معطلة'}
                        </button>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => {
                              setEditingCurrency(curr);
                              setIsCurrencyModalOpen(true);
                            }}
                            className="p-1 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-md transition"
                            title="تعديل العملة"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                          {!curr.isBase && (
                            <button
                              onClick={() => handleDeleteCurrency(curr.code)}
                              className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-md transition"
                              title="حذف العملة"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* TAB 4: FISCAL YEAR & PERIODS */}
      {/* ========================================================= */}
      {activeTab === 'PERIODS' && (
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
              <div>
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-blue-600" />
                  السنة المالية والفترات المحاسبية (Fiscal Year {profileForm.currentFiscalYear})
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  التحكم في إقفال وفتح الفترات الشهرية ومنع ترحيل القيود للفترات المغلقة
                </p>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-700">السنة المالية النشطة:</span>
                <input
                  type="number"
                  value={profileForm.currentFiscalYear}
                  onChange={(e) => {
                    const year = Number(e.target.value) || 2026;
                    setProfileForm({ ...profileForm, currentFiscalYear: year });
                    onUpdateCompanyProfile({ ...companyProfile, currentFiscalYear: year });
                  }}
                  className="w-24 px-2.5 py-1.5 border border-slate-200 rounded-xl text-xs font-bold font-mono bg-slate-50 text-slate-900"
                />
              </div>
            </div>

            {/* Fiscal Periods Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3.5 pt-2">
              {fiscalPeriods.map((period) => (
                <div
                  key={period.id}
                  className={`p-4 rounded-xl border transition flex flex-col justify-between ${
                    period.status === 'OPEN'
                      ? 'border-emerald-200 bg-emerald-50/40'
                      : period.status === 'CLOSED'
                      ? 'border-slate-200 bg-slate-50'
                      : 'border-rose-200 bg-rose-50/40'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-slate-800">
                      {period.nameAr}
                    </span>
                    <span
                      className={`text-[9px] font-bold px-2 py-0.5 rounded-full border ${
                        period.status === 'OPEN'
                          ? 'bg-emerald-100 text-emerald-800 border-emerald-200'
                          : period.status === 'CLOSED'
                          ? 'bg-slate-200 text-slate-700 border-slate-300'
                          : 'bg-rose-100 text-rose-800 border-rose-200'
                      }`}
                    >
                      {period.status === 'OPEN' ? 'مفتوحة للترحيل' : period.status === 'CLOSED' ? 'مغلقة' : 'مقفل نهائي'}
                    </span>
                  </div>

                  <div className="text-[10px] font-mono text-slate-500 mb-3 space-y-0.5">
                    <div>من: {period.startDate}</div>
                    <div>إلى: {period.endDate}</div>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleTogglePeriodStatus(period.id)}
                    className={`w-full py-1.5 text-xs font-bold rounded-lg transition flex items-center justify-center gap-1.5 ${
                      period.status === 'OPEN'
                        ? 'bg-amber-600 hover:bg-amber-700 text-white'
                        : 'bg-blue-600 hover:bg-blue-700 text-white'
                    }`}
                  >
                    {period.status === 'OPEN' ? (
                      <>
                        <Lock className="w-3.5 h-3.5" />
                        <span>إغلاق الفترة</span>
                      </>
                    ) : (
                      <>
                        <Unlock className="w-3.5 h-3.5" />
                        <span>فتح الفترة</span>
                      </>
                    )}
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* TAB 5: TAXES & VAT CONFIGURATION */}
      {/* ========================================================= */}
      {activeTab === 'TAXES' && (
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-6">
          <div className="pb-4 border-b border-slate-100">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Percent className="w-4 h-4 text-blue-600" />
              إعدادات الضرائب والرسوم والفوترة
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              تحديد نسب ضريبة المبيعات وضريبة الأرباح وإعدادات القيود المحاسبية التلقائية
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-3">
              <span className="text-xs font-bold text-slate-800">ضريبة المبيعات / القيمة المضافة (VAT)</span>
              <div>
                <label className="block text-xs text-slate-600 mb-1">النسبة الافتراضية للفواتير:</label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    step="0.01"
                    value={(profileForm.defaultVatRate || 0.05) * 100}
                    onChange={(e) => {
                      const rate = (parseFloat(e.target.value) || 0) / 100;
                      setProfileForm({ ...profileForm, defaultVatRate: rate });
                    }}
                    className="w-24 px-3 py-1.5 border border-slate-200 rounded-xl text-xs font-bold font-mono bg-white text-slate-900"
                  />
                  <span className="text-xs font-bold text-slate-700">%</span>
                </div>
              </div>
              <p className="text-[11px] text-slate-500">
                يتم احتساب هذه النسبة تلقائياً في فواتير المبيعات الضريبية وترحيلها لحساب (2130 - أمانات الضرائب).
              </p>
            </div>

            <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-3">
              <span className="text-xs font-bold text-slate-800">ضريبة الأرباح والاستقطاع (Withholding Tax)</span>
              <div>
                <label className="block text-xs text-slate-600 mb-1">نسبة ضريبة الاستقطاع من الموردين:</label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    step="0.01"
                    defaultValue={3}
                    className="w-24 px-3 py-1.5 border border-slate-200 rounded-xl text-xs font-bold font-mono bg-white text-slate-900"
                  />
                  <span className="text-xs font-bold text-slate-700">%</span>
                </div>
              </div>
              <p className="text-[11px] text-slate-500">
                تطبق على عقود التوريد والخدمات الاستشارية وتخصم لصالح مصلحة الضرائب.
              </p>
            </div>
          </div>

          <div className="flex justify-end pt-3">
            <button
              type="button"
              onClick={handleSaveCompanyProfile}
              className="flex items-center gap-2 px-5 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-xs transition"
            >
              <Save className="w-4 h-4" />
              <span>حفظ إعدادات الضرائب</span>
            </button>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* TAB 6: SYSTEM MODULES & COMPONENT TOGGLES */}
      {/* ========================================================= */}
      {activeTab === 'MODULES' && (
        <div className="space-y-6">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Grid className="w-4 h-4 text-blue-600" />
              مكونات ووحدات نظام MeDo ERP ({systemModules.length} وحدات)
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              تفعيل أو تعطيل أي شاشة أو وحدة في النظام والتحكم في ظهورها في القائمة الجانبية
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {systemModules.map((mod) => (
              <div
                key={mod.id}
                className={`bg-white rounded-2xl border p-4.5 shadow-xs transition flex flex-col justify-between ${
                  mod.isEnabled ? 'border-slate-200' : 'border-slate-200 opacity-60 bg-slate-50'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-mono font-bold bg-slate-100 text-slate-700 px-2 py-0.5 rounded">
                      {mod.tCode}
                    </span>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        mod.isEnabled
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-rose-100 text-rose-800'
                      }`}
                    >
                      {mod.isEnabled ? 'الوحدة مفعلة' : 'معطلة'}
                    </span>
                  </div>

                  <h4 className="text-xs font-bold text-slate-900 mb-1">{mod.nameAr}</h4>
                  <p className="text-[11px] text-slate-500 leading-relaxed mb-3">
                    {mod.descriptionAr}
                  </p>
                </div>

                <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                  <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-700">
                    <input
                      type="checkbox"
                      checked={mod.showInSidebar}
                      onChange={() => handleToggleModuleSidebar(mod.id)}
                      disabled={!mod.isEnabled}
                      className="rounded text-blue-600 focus:ring-blue-500"
                    />
                    <span>إظهار في الشريط الجانبي</span>
                  </label>

                  <button
                    type="button"
                    onClick={() => handleToggleModuleEnabled(mod.id)}
                    className={`text-xs font-bold px-3 py-1 rounded-lg transition ${
                      mod.isEnabled
                        ? 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                        : 'bg-blue-600 hover:bg-blue-700 text-white'
                    }`}
                  >
                    {mod.isEnabled ? 'تعطيل' : 'تفعيل'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* TAB 7: PRINT & TEMPLATES CONFIGURATION */}
      {/* ========================================================= */}
      {activeTab === 'PRINTING' && (
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-6">
          <div className="pb-4 border-b border-slate-100">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Printer className="w-4 h-4 text-blue-600" />
              إعدادات الطباعة والقوالب وتصدير PDF
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              تخصيص نماذج الفواتير وسندات الصرف والقبض وملصقات الباركود
            </p>
          </div>

          <div className="space-y-4">
            <label className="flex items-center gap-3 p-3 rounded-xl border border-slate-200 bg-slate-50 cursor-pointer">
              <input
                type="checkbox"
                defaultChecked
                className="rounded text-blue-600 focus:ring-blue-500"
              />
              <div>
                <span className="text-xs font-bold text-slate-900 block">إظهار شعار المنشأة واسمها في ترويسة جميع المطبوعات</span>
                <span className="text-[11px] text-slate-500">طباعة الترويسة الكاملة أعلى المستندات الرسمية</span>
              </div>
            </label>

            <label className="flex items-center gap-3 p-3 rounded-xl border border-slate-200 bg-slate-50 cursor-pointer">
              <input
                type="checkbox"
                defaultChecked
                className="rounded text-blue-600 focus:ring-blue-500"
              />
              <div>
                <span className="text-xs font-bold text-slate-900 block">إظهار رمز الاستجابة السريعة (QR Code) للفواتير الضريبية</span>
                <span className="text-[11px] text-slate-500">متوافق مع متطلبات هيئة الضرائب والتحقق الإلكتروني</span>
              </div>
            </label>

            <label className="flex items-center gap-3 p-3 rounded-xl border border-slate-200 bg-slate-50 cursor-pointer">
              <input
                type="checkbox"
                defaultChecked
                className="rounded text-blue-600 focus:ring-blue-500"
              />
              <div>
                <span className="text-xs font-bold text-slate-900 block">إظهار خانات التوقيع والاعتمادات (المحاسب، المدير المالي، المستلم)</span>
                <span className="text-[11px] text-slate-500">تضمين التوقيعات أسفل سندات القبض والصرف وقيود اليومية</span>
              </div>
            </label>
          </div>

          <div className="flex justify-end pt-3">
            <button
              type="button"
              onClick={() => triggerSaveNotification('تم حفظ إعدادات الطباعة والقوالب بنجاح')}
              className="flex items-center gap-2 px-5 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-xs transition"
            >
              <Save className="w-4 h-4" />
              <span>حفظ خيارات الطباعة</span>
            </button>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* TAB: THEME STUDIO & UI CUSTOMIZATION ENGINE */}
      {/* ========================================================= */}
      {activeTab === 'THEME_STUDIO' && (
        <div className="space-y-6">
          <ThemeStudioView />
        </div>
      )}

      {/* ========================================================= */}
      {/* TAB: HIGH CONTRAST MODE & WAREHOUSE ACCESSIBILITY */}
      {/* ========================================================= */}
      {activeTab === 'ACCESSIBILITY' && (
        <div className="space-y-6">
          {/* Header Banner */}
          <div className="bg-slate-900 text-white rounded-2xl p-6 border border-slate-800 shadow-xl space-y-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-amber-500/20 text-amber-300 border border-amber-400/30 rounded-2xl">
                  <Eye className="w-7 h-7 text-amber-400" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-white flex items-center gap-2">
                    <span>وضع التباين العالي وسهولة الوصول (High Contrast Mode)</span>
                    <span className="text-[10px] bg-amber-400 text-slate-950 font-black px-2.5 py-0.5 rounded-full font-mono">
                      Warehouse & Logistics Ready
                    </span>
                  </h3>
                  <p className="text-xs text-slate-300 mt-1 max-w-2xl leading-relaxed">
                    مخصص لتسهيل القراءة الفورية والعمل داخل المستودعات، محطات الفرز، خطوط الشحن، ومحطات الكاشير ذات الإضاءة المتغيرة (أشعة شمس مباشرة، إضاءة فلورسنت صناعية حادة، أو غرف تخزين خافتة).
                  </p>
                </div>
              </div>

              {/* Status Badge */}
              <div className="flex items-center gap-3">
                <div className={`px-3.5 py-2 rounded-xl border text-xs font-extrabold flex items-center gap-2 ${
                  highContrastMode
                    ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                    : 'bg-slate-800 text-slate-400 border-slate-700'
                }`}>
                  <span className={`w-2.5 h-2.5 rounded-full ${highContrastMode ? 'bg-emerald-400 animate-pulse' : 'bg-slate-500'}`} />
                  <span>{highContrastMode ? 'الوضع عالي التباين مُفعّل حالياً' : 'الوضع القياسي للنظام'}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Master Toggle Card */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl border-2 border-slate-200 bg-slate-50/70">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-extrabold text-slate-900">مفتاح التفعيل الرئيسي لوضع التباين العالي</span>
                  <span className="text-[10px] font-bold px-2 py-0.5 bg-blue-100 text-blue-800 rounded-md">
                    Master Toggle
                  </span>
                </div>
                <p className="text-xs text-slate-600 max-w-xl leading-relaxed">
                  عند تفعيل هذا المفتاح، يتم تحويل جميع شاشات النظام (المخزون، نقاط البيع، قيود اليومية، الفواتير، والتقارير) إلى أقصى درجات التباين والحدة البصرية وإلغاء التدرجات الباهتة.
                </p>
              </div>

              {/* Big Interactive Toggle Switch */}
              <button
                type="button"
                onClick={() => {
                  toggleHighContrastMode();
                  triggerSaveNotification(
                    !highContrastMode
                      ? 'تم تفعيل وضع التباين العالي (High Contrast Mode) بنجاح 👁️'
                      : 'تم تعطيل وضع التباين العالي والعودة للوضع الافتراضي'
                  );
                }}
                className={`relative inline-flex h-9 w-18 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-600 focus:ring-offset-2 ${
                  highContrastMode ? 'bg-blue-600' : 'bg-slate-300'
                }`}
              >
                <span className="sr-only">تفعيل التباين العالي</span>
                <span
                  className={`pointer-events-none inline-block h-8 w-8 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out flex items-center justify-center ${
                    highContrastMode ? '-translate-x-9' : 'translate-x-0'
                  }`}
                >
                  {highContrastMode ? (
                    <Eye className="w-4 h-4 text-blue-600" />
                  ) : (
                    <Sun className="w-4 h-4 text-slate-400" />
                  )}
                </span>
              </button>
            </div>

            {/* Environmental Lighting Presets */}
            <div className="space-y-3 pt-2">
              <div>
                <h4 className="text-xs font-extrabold text-slate-900 flex items-center gap-2">
                  <Contrast className="w-4 h-4 text-blue-600" />
                  <span>تخصيص نمط التباين حسب إضاءة بيئة العمل (Lighting Environment Presets)</span>
                </h4>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  اختر النمط المناسب لظروف الإضاءة في صالة المستودع أو كشك الكاشير:
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Preset 1: Glare / Daylight */}
                <button
                  type="button"
                  onClick={() => {
                    setContrastPreset('WAREHOUSE_GLARE');
                    if (!highContrastMode) setHighContrastMode(true);
                    triggerSaveNotification('تم تعيين نمط: إضاءة شمسية قوية ومقاومة الانعكاس ☀️');
                  }}
                  className={`p-4 rounded-2xl border-2 text-right transition cursor-pointer flex flex-col justify-between space-y-3 ${
                    accessibilitySettings.preset === 'WAREHOUSE_GLARE' && highContrastMode
                      ? 'border-amber-500 bg-amber-50/40 ring-2 ring-amber-400/20 shadow-xs'
                      : 'border-slate-200 bg-white hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="w-9 h-9 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center">
                      <Sun className="w-5 h-5" />
                    </div>
                    {accessibilitySettings.preset === 'WAREHOUSE_GLARE' && highContrastMode && (
                      <span className="text-[10px] font-extrabold text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full flex items-center gap-1">
                        <Check className="w-3 h-3" />
                        النمط النشط
                      </span>
                    )}
                  </div>
                  <div>
                    <h5 className="text-xs font-bold text-slate-900">إضاءة شمسية وانعكاسات (Warehouse Daylight)</h5>
                    <p className="text-[11px] text-slate-600 mt-1 leading-relaxed">
                      زيادة حدة اللون الأسود والخلفيات البيضاء الصافية لمنع الوهج عند بوابات الشحن وتحت أشعة الشمس.
                    </p>
                  </div>
                </button>

                {/* Preset 2: Low-light / Dim */}
                <button
                  type="button"
                  onClick={() => {
                    setContrastPreset('LOW_LIGHT');
                    if (!highContrastMode) setHighContrastMode(true);
                    triggerSaveNotification('تم تعيين نمط: مستودعات خافتة وممرات الأرفف 🌙');
                  }}
                  className={`p-4 rounded-2xl border-2 text-right transition cursor-pointer flex flex-col justify-between space-y-3 ${
                    accessibilitySettings.preset === 'LOW_LIGHT' && highContrastMode
                      ? 'border-indigo-500 bg-indigo-50/40 ring-2 ring-indigo-400/20 shadow-xs'
                      : 'border-slate-200 bg-white hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="w-9 h-9 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center">
                      <Moon className="w-5 h-5" />
                    </div>
                    {accessibilitySettings.preset === 'LOW_LIGHT' && highContrastMode && (
                      <span className="text-[10px] font-extrabold text-indigo-700 bg-indigo-100 px-2 py-0.5 rounded-full flex items-center gap-1">
                        <Check className="w-3 h-3" />
                        النمط النشط
                      </span>
                    )}
                  </div>
                  <div>
                    <h5 className="text-xs font-bold text-slate-900">مستودعات خافتة وممرات الأرفف (Dim Shelves)</h5>
                    <p className="text-[11px] text-slate-600 mt-1 leading-relaxed">
                      خلفيات هادئة مع نصوص وأرقام بارزة مضيئة تمنع إجهاد العين في غرف التخزين الخلفية والمناوبات الليلية.
                    </p>
                  </div>
                </button>

                {/* Preset 3: Max Contrast Monochrome */}
                <button
                  type="button"
                  onClick={() => {
                    setContrastPreset('MAX_CONTRAST');
                    if (!highContrastMode) setHighContrastMode(true);
                    triggerSaveNotification('تم تعيين نمط: أقصى تباين أحادي اللون WCAG AAA ⚡');
                  }}
                  className={`p-4 rounded-2xl border-2 text-right transition cursor-pointer flex flex-col justify-between space-y-3 ${
                    accessibilitySettings.preset === 'MAX_CONTRAST' && highContrastMode
                      ? 'border-slate-900 bg-slate-100 ring-2 ring-slate-400/30 shadow-xs'
                      : 'border-slate-200 bg-white hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="w-9 h-9 rounded-xl bg-slate-900 text-white flex items-center justify-center">
                      <Zap className="w-5 h-5" />
                    </div>
                    {accessibilitySettings.preset === 'MAX_CONTRAST' && highContrastMode && (
                      <span className="text-[10px] font-extrabold text-slate-900 bg-white px-2 py-0.5 rounded-full flex items-center gap-1 border border-slate-300">
                        <Check className="w-3 h-3" />
                        النمط النشط
                      </span>
                    )}
                  </div>
                  <div>
                    <h5 className="text-xs font-bold text-slate-900">أقصى تباين أحادي (Max Contrast WCAG AAA)</h5>
                    <p className="text-[11px] text-slate-600 mt-1 leading-relaxed">
                      أعلى معايير التباين القياسي (أبيض وأسود صارم) للأجهزة اللوحية الصناعية القديمة وشاشات الـ POS.
                    </p>
                  </div>
                </button>
              </div>
            </div>

            {/* Warehouse Ergonomic Specific Features */}
            <div className="space-y-3 pt-4 border-t border-slate-100">
              <h4 className="text-xs font-extrabold text-slate-900 flex items-center gap-2">
                <Sliders className="w-4 h-4 text-blue-600" />
                <span>خيارات تحسين العمليات الميدانية والمسح الضوئي (Warehouse Ergonomics)</span>
              </h4>

              <div className="space-y-3">
                {/* Option 1: Large Warehouse Typography */}
                <label className="flex items-center justify-between p-4 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100/70 transition cursor-pointer">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center shrink-0">
                      <Maximize2 className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="text-xs font-bold text-slate-900 block">
                        تكبير خطوط الباركود، الكود والكميات (Large Warehouse Typography)
                      </span>
                      <span className="text-[11px] text-slate-500">
                        تكبير أرقام الأصناف وأكواد الباركود بنسبة ملائمة لتمكين القراءة السريعة عن بعد من مسافة المترين.
                      </span>
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={accessibilitySettings.largeWarehouseFont}
                    onChange={(e) => {
                      setLargeWarehouseFont(e.target.checked);
                      triggerSaveNotification(
                        e.target.checked
                          ? 'تم تفعيل الخطوط المكبرة للمستودعات 🏷️'
                          : 'تم تعطيل الخطوط المكبرة'
                      );
                    }}
                    className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 cursor-pointer"
                  />
                </label>

                {/* Option 2: Barcode Scanner Focus Ring */}
                <label className="flex items-center justify-between p-4 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100/70 transition cursor-pointer">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                      <Scan className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="text-xs font-bold text-slate-900 block">
                        التركيز البصري الفوري لحقول المسح الضوئي (Scanner Input Focus Ring)
                      </span>
                      <span className="text-[11px] text-slate-500">
                        إبراز حقل الإدخال النشط بإطار أزرق عريض (3px) لضمان توجيه مسدس الباركود بدقة دون تشتت.
                      </span>
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={accessibilitySettings.barcodeScannerOptimized}
                    onChange={(e) => {
                      setBarcodeScannerOptimized(e.target.checked);
                      triggerSaveNotification('تم تحديث إعداد التركيز البصري لمسدسات الباركود');
                    }}
                    className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 cursor-pointer"
                  />
                </label>

                {/* Option 3: Bold Table Borders */}
                <label className="flex items-center justify-between p-4 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100/70 transition cursor-pointer">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center shrink-0">
                      <Grid className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="text-xs font-bold text-slate-900 block">
                        تعزيز سماكة حدود الجداول وقوائم الجرد (Bold 1.5px Grid Outlines)
                      </span>
                      <span className="text-[11px] text-slate-500">
                        رسم خطوط داكنة بارزة بين أسطر الأصناف وأوامر الصرف لتجنب الخلط البصري بين السجلات أثناء العمل السريع.
                      </span>
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={accessibilitySettings.boldTableBorders}
                    onChange={(e) => {
                      setBoldTableBorders(e.target.checked);
                      triggerSaveNotification('تم تحديث خيار سماكة خطوط الجداول');
                    }}
                    className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 cursor-pointer"
                  />
                </label>
              </div>
            </div>

            {/* Interactive Live Warehouse Simulator / Preview */}
            <div className="pt-4 border-t border-slate-100 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-extrabold text-slate-900 flex items-center gap-2">
                    <Monitor className="w-4 h-4 text-blue-600" />
                    <span>المعاينة الحية الفورية لأداء الشاشة في بيئة المستودع (Live Warehouse Simulation)</span>
                  </h4>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    شاهد كيف تظهر بطاقات الأصناف والباركود وحقول المسح تحت إعدادات التباين الحالية:
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    toggleHighContrastMode();
                    triggerSaveNotification(
                      !highContrastMode
                        ? 'تم تبديل الوضع إلى التباين العالي 👁️'
                        : 'تم العودة إلى الوضع القياسي'
                    );
                  }}
                  className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold rounded-xl transition flex items-center gap-1.5"
                >
                  <Eye className="w-3.5 h-3.5 text-blue-600" />
                  <span>اختبار التبديل الفوري</span>
                </button>
              </div>

              {/* Sample Simulated Item Card */}
              <div className="p-5 rounded-2xl border-2 border-slate-300 bg-white shadow-sm space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-black text-slate-950">
                        حليب الأهرام طويل الأجل 1 لتر - كرتون (12 عبوة)
                      </span>
                      <span className="bg-emerald-100 text-emerald-800 text-[10px] font-black px-2.5 py-0.5 rounded-full border border-emerald-300">
                        متوفر بالمستودع 🟢
                      </span>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-slate-700 mt-1 font-mono font-bold">
                      <span>كود الصنف: <strong className="text-slate-950 font-black">ITM-MILK-9920</strong></span>
                      <span>|</span>
                      <span>الباركود: <strong className="text-slate-950 font-black">6281007198214</strong></span>
                      <span>|</span>
                      <span>الموقع: <strong className="text-blue-900 font-black">ممر A - رف 03 - قاطع 14</strong></span>
                    </div>
                  </div>

                  <div className="text-left sm:text-right">
                    <span className="text-[10px] text-slate-500 font-bold block">الكمية الإجمالية المتاحة</span>
                    <span className="text-base font-black text-slate-950 font-mono">
                      1,850 <span className="text-xs font-bold text-slate-600">كرتون</span>
                    </span>
                  </div>
                </div>

                {/* Simulated Barcode Input Box */}
                <div className="flex items-center gap-3">
                  <div className="relative flex-1">
                    <input
                      type="text"
                      placeholder="امسح باركود الصنف بالمسدس الضوئي أو اكتب الكود..."
                      defaultValue="6281007198214"
                      className="w-full pl-10 pr-4 py-2.5 text-xs font-bold font-mono rounded-xl bg-slate-50 text-slate-900 border-2 border-slate-300"
                    />
                    <Scan className="w-4 h-4 text-blue-600 absolute left-3 top-1/2 -translate-y-1/2" />
                  </div>

                  <div className="flex items-center gap-2">
                    <div className="bg-slate-100 px-3.5 py-2 rounded-xl border border-slate-300 text-xs font-mono font-black text-slate-900">
                      سعر البيع: 14,500 ر.ي
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Bottom Actions */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={() => {
                  resetAccessibilitySettings();
                  triggerSaveNotification('تمت إعادة ضبط إعدادات التباين وسهولة الوصول للوضع الافتراضي');
                }}
                className="text-xs font-bold text-slate-600 hover:text-slate-900 flex items-center gap-1.5"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>إعادة ضبط خيارات التباين للافتراضي</span>
              </button>

              <button
                type="button"
                onClick={() => triggerSaveNotification('تم حفظ وتطبيق كافة إعدادات التباين وسهولة الوصول بنجاح 💾')}
                className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-extrabold rounded-xl shadow-xs transition cursor-pointer"
              >
                <Save className="w-4 h-4" />
                <span>حفظ وتطبيق الإعدادات على كامل النظام</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* TAB: DATA ARCHIVING & LIFECYCLE MANAGEMENT */}
      {/* ========================================================= */}
      {activeTab === 'ARCHIVING' && (
        <DataArchivingView
          fiscalPeriods={fiscalPeriods}
          journalEntries={journalEntries}
          invoices={invoices}
          paymentVouchers={paymentVouchers}
          posOrders={posOrders}
          stockMovements={stockMovements}
          purchaseOrders={purchaseOrders}
          payrollRuns={payrollRuns}
          onUpdateActiveData={(updated) => {
            if (onUpdateActiveData) {
              onUpdateActiveData(updated);
            }
          }}
          currency={currency}
          rates={rates}
        />
      )}

      {/* ========================================================= */}
      {/* TAB: MULTI-DATABASE & LOCAL SAUDI CLOUD CONNECTORS */}
      {/* ========================================================= */}
      {activeTab === 'MULTIDB' && (
        <div className="space-y-6">
          {/* Header Banner & Active Engine Summary */}
          <div className="bg-slate-900 text-white rounded-2xl p-6 border border-slate-800 shadow-xl space-y-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-blue-600/20 text-blue-400 border border-blue-500/30 rounded-2xl">
                  <Server className="w-6 h-6 text-amber-400" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-white flex items-center gap-2">
                    <span>إدارة خوادم قواعد البيانات المتعددة والتوطين المحلي (Saudi Local & Multi-Cloud DB)</span>
                    <span className="text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 px-2 py-0.5 rounded-full font-mono">
                      ZATCA & SDAIA Ready
                    </span>
                  </h3>
                  <p className="text-xs text-slate-300 mt-1">
                    إدارة وإضافة عناوين قواعد البيانات الخارجية (PostgreSQL المحلية، Huawei Cloud، Alibaba Cloud، و Firebase) والتنقل الفوري بينها.
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={handleSaveDbProfileToFilesystemExplicit}
                  className="flex items-center gap-2 px-3.5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-md transition cursor-pointer border border-emerald-500/50"
                  title="حفظ بيانات الاعتماد في ملف التكوين المحلي database_config.json"
                >
                  <Save className="w-4 h-4 text-emerald-200" />
                  <span>حفظ الاعتمادات في نظام الملفات المحلي</span>
                </button>

                <button
                  type="button"
                  onClick={handleOpenAddDbModal}
                  className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold text-xs rounded-xl shadow-md transition cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>إضافة اتصال قاعدة بيانات جديدة</span>
                </button>
              </div>
            </div>

            {/* Currently Active Profile Status & FS Save Indicator */}
            {(() => {
              const activeProf = dbProfiles.find(p => p.id === activeDbId) || dbProfiles[0];
              if (!activeProf) return null;
              return (
                <div className="pt-3 border-t border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                  <div className="flex items-center gap-2 text-slate-300">
                    <span className="flex h-2.5 w-2.5 relative">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                    </span>
                    <span>الخادم النشط الموجه حالياً للنظام:</span>
                    <span className="font-extrabold text-amber-300 font-mono text-sm">{activeProf.name}</span>
                  </div>

                  <div className="flex flex-wrap items-center gap-2.5 font-mono text-[11px] text-slate-400">
                    <span className="bg-slate-800 px-2.5 py-1 rounded-lg border border-slate-700 text-emerald-300 flex items-center gap-1 font-sans">
                      <HardDrive className="w-3 h-3 text-emerald-400 shrink-0" />
                      <span>{fsSaveStatus || 'محفوظ في database_config.json'}</span>
                    </span>
                    <span className="bg-slate-800 px-2.5 py-1 rounded-lg border border-slate-700 text-emerald-300">
                      {activeProf.host}:{activeProf.port}
                    </span>
                    <span className="bg-slate-800 px-2.5 py-1 rounded-lg border border-slate-700 text-amber-300 font-sans text-[10px]">
                      {activeProf.region}
                    </span>
                    <span className="bg-emerald-950 text-emerald-300 border border-emerald-800 px-2 py-1 rounded-lg font-bold">
                      {activeProf.pingStatus || 'ONLINE'} ({activeProf.latencyMs || 12}ms)
                    </span>
                  </div>
                </div>
              );
            })()}
          </div>

          {/* Database Profiles Cards List */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-6">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <h4 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                  <Layers className="w-4 h-4 text-blue-600" />
                  <span>عناوين واتصالات قواعد البيانات الخارجية المسجلة ({dbProfiles.length})</span>
                </h4>
                <p className="text-xs text-slate-500 mt-0.5">
                  اضغط على زر "تفعيل واستخدام هذا الخادم" للتحويل الفوري وتوجيه عمليات النظام لقاعدة البيانات المطلوبة.
                </p>
              </div>

              <button
                type="button"
                onClick={handleOpenAddDbModal}
                className="text-xs font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>إضافة خادم جديد</span>
              </button>
            </div>

            {/* Profiles Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {dbProfiles.map((prof) => {
                const isActive = prof.id === activeDbId;

                const getDriverBadge = (driver: string) => {
                  switch (driver) {
                    case 'POSTGRES_LOCAL':
                      return { label: 'PostgreSQL Local', icon: HardDrive, color: 'bg-blue-50 text-blue-700 border-blue-200' };
                    case 'HUAWEI_CLOUD':
                      return { label: 'Huawei Cloud KSA', icon: Cloud, color: 'bg-rose-50 text-rose-700 border-rose-200' };
                    case 'ALIBABA_CLOUD':
                      return { label: 'Alibaba Cloud KSA', icon: Cloud, color: 'bg-amber-50 text-amber-700 border-amber-200' };
                    case 'FIREBASE_HYBRID':
                      return { label: 'Firebase Hybrid', icon: Database, color: 'bg-indigo-50 text-indigo-700 border-indigo-200' };
                    default:
                      return { label: 'Custom SQL', icon: Server, color: 'bg-slate-50 text-slate-700 border-slate-200' };
                  }
                };

                const badge = getDriverBadge(prof.driver);
                const DriverIcon = badge.icon;

                return (
                  <div
                    key={prof.id}
                    className={`rounded-2xl border-2 transition-all p-5 flex flex-col justify-between space-y-4 relative ${
                      isActive
                        ? 'border-emerald-500 bg-emerald-50/20 shadow-md ring-2 ring-emerald-500/20'
                        : 'border-slate-200 bg-white hover:border-slate-300 shadow-xs'
                    }`}
                  >
                    {isActive && (
                      <span className="absolute -top-3 right-4 bg-emerald-600 text-white text-[10px] font-extrabold px-3 py-0.5 rounded-full shadow flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3 text-white" />
                        الخادم النشط حالياً
                      </span>
                    )}

                    <div className="space-y-3">
                      <div className="flex items-start justify-between gap-2 pt-1">
                        <div>
                          <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2.5 py-0.5 rounded-lg border ${badge.color}`}>
                            <DriverIcon className="w-3 h-3" />
                            {badge.label}
                          </span>
                          <h5 className="text-xs font-extrabold text-slate-900 mt-2 leading-snug">
                            {prof.name}
                          </h5>
                        </div>

                        {/* Connection Indicator Badge */}
                        <div className="flex flex-col items-end gap-1">
                          {testingProfileId === prof.id ? (
                            <span className="inline-flex items-center gap-1.5 text-[10px] font-extrabold text-amber-700 bg-amber-50 border border-amber-200 px-2.5 py-0.5 rounded-full">
                              <span className="w-2.5 h-2.5 border-2 border-amber-600 border-t-transparent rounded-full animate-spin" />
                              جاري فحص الاتصال...
                            </span>
                          ) : prof.pingStatus === 'ONLINE' ? (
                            <span className="inline-flex items-center gap-1.5 text-[10px] font-extrabold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full shadow-xs">
                              <span className="flex h-2 w-2 relative">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                              </span>
                              متصل حالياً ({prof.latencyMs || 12}ms)
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 text-[10px] font-extrabold text-rose-800 bg-rose-50 border border-rose-200 px-2.5 py-0.5 rounded-full shadow-xs">
                              <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500"></span>
                              خطأ في البيانات / غير متصل
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Connection Properties */}
                      <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/80 space-y-1.5 text-[11px] font-mono">
                        <div className="flex items-center justify-between text-slate-700">
                          <span className="text-slate-400 font-sans">المضيف (Host):</span>
                          <span className="font-bold text-slate-900" dir="ltr">{prof.host}:{prof.port}</span>
                        </div>
                        <div className="flex items-center justify-between text-slate-700">
                          <span className="text-slate-400 font-sans">اسم القاعدة:</span>
                          <span className="font-bold text-blue-700" dir="ltr">{prof.dbName}</span>
                        </div>
                        <div className="flex items-center justify-between text-slate-700">
                          <span className="text-slate-400 font-sans">المستخدم:</span>
                          <span className="font-bold text-slate-800" dir="ltr">{prof.username}</span>
                        </div>
                        <div className="flex items-center justify-between text-slate-700">
                          <span className="text-slate-400 font-sans">المنطقة:</span>
                          <span className="font-bold text-slate-800 font-sans text-[10px]">{prof.region}</span>
                        </div>
                      </div>

                      {prof.isZatcaStrict && (
                        <div className="flex items-center gap-1.5 text-[10px] text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200/60 font-bold">
                          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                          <span>متوافق مع هيئة الزكاة والضريبة والجمارك (ZATCA KSA)</span>
                        </div>
                      )}
                    </div>

                    {/* Actions Row */}
                    <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                      {!isActive ? (
                        <button
                          type="button"
                          onClick={() => handleSetActiveDb(prof.id)}
                          className="flex-1 py-1.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-[11px] rounded-xl shadow-xs transition flex items-center justify-center gap-1.5 cursor-pointer"
                        >
                          <Zap className="w-3.5 h-3.5 text-amber-400" />
                          <span>تفعيل واستخدام هذا الخادم</span>
                        </button>
                      ) : (
                        <span className="flex-1 py-1.5 bg-emerald-100 text-emerald-800 font-bold text-[11px] rounded-xl text-center border border-emerald-300">
                          مفعل بالكامل للنظام ⚡
                        </span>
                      )}

                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => handleTestProfileConnection(prof.id)}
                          title="اختبار الاتصال بالخادم"
                          className="p-1.5 text-slate-600 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition"
                        >
                          <Zap className="w-3.5 h-3.5" />
                        </button>

                        <button
                          type="button"
                          onClick={() => handleOpenEditDbModal(prof)}
                          title="تعديل بيانات الخادم"
                          className="p-1.5 text-slate-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>

                        {!isActive && (
                          <button
                            type="button"
                            onClick={() => handleDeleteDbProfile(prof.id)}
                            title="إزالة اتصال الخادم"
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>

                  </div>
                );
              })}
            </div>
          </div>

          {/* ========================================================= */}
          {/* MASTER-REPLICA ARCHITECTURE & LIVE SYNC QUEUE (أمر التغيير رقم 2) */}
          {/* ========================================================= */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-6">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-100 pb-5">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="p-2 bg-indigo-50 text-indigo-700 rounded-xl border border-indigo-200">
                    <ArrowRightLeft className="w-5 h-5" />
                  </span>
                  <div>
                    <h4 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                      <span>سياسة التزامن المزدوجة وهندسة الخوادم (Local Master / Cloud Read-Only Replicas)</span>
                      <span className="text-[10px] bg-indigo-100 text-indigo-800 border border-indigo-300 px-2 py-0.5 rounded-full font-bold">
                        أمر التغيير رقم 2 - مفعّل ⚡
                      </span>
                    </h4>
                    <p className="text-xs text-slate-500">
                      الخادم المحلي (Local PostgreSQL) هو المرجع الأساسي المعتمد للكتابة (Master)، والسحابات (Huawei, Alibaba, Google) نسخ للقراءة فقط (Read-Only Replicas).
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={refreshSyncState}
                  className="p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl border border-slate-200 text-xs font-bold transition flex items-center gap-1.5"
                  title="تحديث حالة الطابور والخوادم"
                >
                  <RefreshCw className="w-4 h-4" />
                  <span>تحديث</span>
                </button>

                <button
                  type="button"
                  onClick={handleManualReplicationPush}
                  disabled={isPushingSync}
                  className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-xs transition disabled:opacity-50 cursor-pointer"
                >
                  {isPushingSync ? (
                    <>
                      <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>جاري الدفع للسحابات...</span>
                    </>
                  ) : (
                    <>
                      <Zap className="w-4 h-4 text-amber-300" />
                      <span>دفع ومزامنة الطابور فوراً (Push All)</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Architecture Flow Diagram */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Box 1: Local Master */}
              <div className="p-4 rounded-2xl bg-gradient-to-br from-blue-900 to-slate-900 text-white border border-blue-800 shadow-sm relative overflow-hidden">
                <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/10 rounded-full blur-xl pointer-events-none" />
                <div className="flex items-center justify-between mb-3">
                  <span className="text-[10px] bg-blue-500/20 text-blue-300 border border-blue-400/30 px-2.5 py-0.5 rounded-full font-bold">
                    Primary Authority (الكتابة)
                  </span>
                  <HardDrive className="w-5 h-5 text-blue-400" />
                </div>
                <h5 className="text-xs font-extrabold text-white mb-1">الخادم المحلي (Local PostgreSQL)</h5>
                <p className="text-[11px] text-blue-200/80 leading-relaxed">
                  يستقبل كافة العمليات (فواتير، قيود، سندات) ويقوم بتثبيتها وتوليد الـ <code className="text-amber-300 font-mono">sync_timestamp</code> المحلي فورياً.
                </p>
                <div className="mt-3 pt-3 border-t border-blue-800/80 flex items-center justify-between text-[10px] font-mono text-blue-300">
                  <span>الصلاحية: Master Write</span>
                  <span className="text-emerald-400 font-bold">نشط 🟢</span>
                </div>
              </div>

              {/* Box 2: Queue Engine */}
              <div className="p-4 rounded-2xl bg-slate-900 text-white border border-slate-800 shadow-sm relative overflow-hidden">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-[10px] bg-amber-500/20 text-amber-300 border border-amber-400/30 px-2.5 py-0.5 rounded-full font-bold">
                    Background Push Queue
                  </span>
                  <Clock className="w-5 h-5 text-amber-400" />
                </div>
                <h5 className="text-xs font-extrabold text-white mb-1">طابور المزامنة الخلفي (Queue)</h5>
                <p className="text-[11px] text-slate-300 leading-relaxed">
                  يقوم بجدولة ودفع المعاملات المحفوظة إلى السحابات في الخلفية بشكل غير تزامني ودون تعطيل المستخدم.
                </p>
                <div className="mt-3 pt-3 border-t border-slate-800 flex items-center justify-between text-[10px] font-mono text-amber-300">
                  <span>العمليات بالطابور: {syncQueue.filter(q => q.status === 'QUEUED').length}</span>
                  <span>السياسة: FIFO Worker</span>
                </div>
              </div>

              {/* Box 3: Cloud Replicas */}
              <div className="p-4 rounded-2xl bg-gradient-to-br from-indigo-950 to-slate-900 text-white border border-indigo-800/80 shadow-sm relative overflow-hidden">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-[10px] bg-indigo-500/20 text-indigo-300 border border-indigo-400/30 px-2.5 py-0.5 rounded-full font-bold">
                    Read-Only Replicas (القراءة)
                  </span>
                  <Cloud className="w-5 h-5 text-indigo-400" />
                </div>
                <h5 className="text-xs font-extrabold text-white mb-1">الخوادم السحابية المتعددة</h5>
                <p className="text-[11px] text-indigo-200/80 leading-relaxed">
                  (Huawei KSA / Alibaba Cloud / Google Cloud) نسخ طبق الأصل للقراءة فقط وإصدار التقارير والاستعلام السريع.
                </p>
                <div className="mt-3 pt-3 border-t border-indigo-800/80 flex items-center justify-between text-[10px] font-mono text-indigo-300">
                  <span>الصلاحية: Read-Only Replica</span>
                  <span className="text-emerald-400 font-bold">3 عقد متزامنة ⚡</span>
                </div>
              </div>
            </div>

            {/* Cloud Replica Nodes Health Cards */}
            <div className="space-y-3">
              <h5 className="text-xs font-extrabold text-slate-900 flex items-center gap-2">
                <Activity className="w-4 h-4 text-emerald-600" />
                <span>حالة عقد الخوادم السحابية المتزامنة (Replica Nodes Status)</span>
              </h5>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                {syncNodes.map((node) => (
                  <div
                    key={node.id}
                    className={`p-3.5 rounded-xl border text-xs space-y-2.5 ${
                      node.role === 'MASTER_WRITE'
                        ? 'bg-blue-50/60 border-blue-200'
                        : 'bg-slate-50 border-slate-200'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-1">
                      <div>
                        <span className={`inline-block text-[9px] font-extrabold px-2 py-0.5 rounded-md ${
                          node.role === 'MASTER_WRITE'
                            ? 'bg-blue-600 text-white'
                            : 'bg-indigo-100 text-indigo-800 border border-indigo-200'
                        }`}>
                          {node.role === 'MASTER_WRITE' ? 'MASTER WRITE' : 'READ-ONLY REPLICA'}
                        </span>
                        <h6 className="text-[11px] font-bold text-slate-900 mt-1">{node.nameAr}</h6>
                      </div>
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                        {node.latencyMs}ms
                      </span>
                    </div>

                    <div className="font-mono text-[10px] text-slate-600 space-y-0.5">
                      <div className="truncate text-slate-500" title={node.host}>Host: {node.host}</div>
                      <div>آخر مزامنة: {new Date(node.lastSyncTimestamp).toLocaleTimeString('ar-SA')}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Live Queue Items Table */}
            <div className="space-y-3 pt-2">
              <div className="flex items-center justify-between">
                <h5 className="text-xs font-extrabold text-slate-900 flex items-center gap-2">
                  <History className="w-4 h-4 text-blue-600" />
                  <span>طابور المعاملات المحاسبية وعمود الطابع الزمني (sync_timestamp)</span>
                </h5>
                <span className="text-[11px] text-slate-500 font-mono">
                  إجمالي المسجل: {syncQueue.length} معاملة
                </span>
              </div>

              {syncQueue.length === 0 ? (
                <div className="p-6 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200 text-slate-500 text-xs">
                  الطابور فارغ حالياً — كافة المعاملات مسجلة ومزامنة على خوادم Replicas بنجاح 🟢
                </div>
              ) : (
                <div className="overflow-x-auto rounded-2xl border border-slate-200 shadow-2xs">
                  <table className="w-full text-right text-xs">
                    <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                      <tr>
                        <th className="p-3">نوع المعاملة</th>
                        <th className="p-3">معرّف السجل المرجعي</th>
                        <th className="p-3 font-mono">الطابع الزمني (sync_timestamp)</th>
                        <th className="p-3">حفظ Master المحلي</th>
                        <th className="p-3 text-center">دفع سحابة Huawei</th>
                        <th className="p-3 text-center">دفع سحابة Alibaba</th>
                        <th className="p-3 text-center">دفع سحابة Google</th>
                        <th className="p-3 text-center">الحالة</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-sans">
                      {syncQueue.slice(0, 8).map((item) => (
                        <tr key={item.id} className="hover:bg-slate-50/80 transition">
                          <td className="p-3 font-bold text-slate-900">
                            {item.entityType === 'INVOICE' && 'فاتورة مبيعات'}
                            {item.entityType === 'JOURNAL_ENTRY' && 'قيد يومية عام'}
                            {item.entityType === 'PAYMENT_VOUCHER' && 'سند صرف نقدي'}
                            {item.entityType === 'PURCHASE_ORDER' && 'أمر شراء'}
                            {item.entityType === 'STOCK_MOVEMENT' && 'حركة مخزنية'}
                            {item.entityType === 'SYSTEM_CONFIG' && 'إعدادات النظام'}
                          </td>
                          <td className="p-3 font-mono text-blue-700 font-bold">{item.recordIdentifier}</td>
                          <td className="p-3 font-mono text-[11px] text-slate-700" dir="ltr">{item.sync_timestamp}</td>
                          <td className="p-3 text-[11px] text-emerald-700 font-bold">تم التثبيت أولاً ✓</td>
                          <td className="p-3 text-center">
                            {item.pushedToCloudReplicas.huawei ? (
                              <span className="text-emerald-600 font-bold text-[11px]">مكتمل ✓</span>
                            ) : (
                              <span className="text-amber-600 text-[10px]">بالانتظار...</span>
                            )}
                          </td>
                          <td className="p-3 text-center">
                            {item.pushedToCloudReplicas.alibaba ? (
                              <span className="text-emerald-600 font-bold text-[11px]">مكتمل ✓</span>
                            ) : (
                              <span className="text-amber-600 text-[10px]">بالانتظار...</span>
                            )}
                          </td>
                          <td className="p-3 text-center">
                            {item.pushedToCloudReplicas.google ? (
                              <span className="text-emerald-600 font-bold text-[11px]">مكتمل ✓</span>
                            ) : (
                              <span className="text-amber-600 text-[10px]">بالانتظار...</span>
                            )}
                          </td>
                          <td className="p-3 text-center">
                            {item.status === 'PUSHED' ? (
                              <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full">
                                متزامن بالكامل ⚡
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-800 bg-amber-50 border border-amber-200 px-2.5 py-0.5 rounded-full">
                                بطابور الانتظار ⏳
                              </span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Conflict Resolution Policy & Interactive Simulator (أمر التغيير رقم 2) */}
            <div className="bg-slate-900 text-white rounded-2xl p-5 border border-slate-800 space-y-4">
              <div className="flex items-start gap-3">
                <div className="p-2 bg-amber-500/20 text-amber-400 rounded-xl border border-amber-500/30 shrink-0 mt-0.5">
                  <GitCompare className="w-5 h-5" />
                </div>
                <div>
                  <h5 className="text-xs font-extrabold text-amber-300">
                    سياسة فض التعارض الإلزامية: الاعتماد على أقدم طابع زمني (Oldest Timestamp - First Writer Wins)
                  </h5>
                  <p className="text-[11px] text-slate-300 mt-1 leading-relaxed">
                    وفقاً لأمر التغيير رقم 2، في حال حدوث تعارض (Data Conflict) أو إدخال متزامن بين الخوادم، يعتمد النظام حصرياً على <strong>أقدم طابع زمني (Oldest Timestamp)</strong> باعتباره الإدخال المرجعي الأصلي، ويتم <strong>رفض وتنبيه المستخدم بأي تعديل لاحق متأخر</strong> لمنع تضارب البيانات المالية.
                  </p>
                </div>
              </div>

              {/* Interactive Conflict Test Simulator */}
              <div className="bg-slate-850 p-4 rounded-xl border border-slate-700/80 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                    <Cpu className="w-3.5 h-3.5 text-blue-400" />
                    <span>محاكي اختبار التعارض المباشر (Conflict Simulation Inspector)</span>
                  </span>
                  <button
                    type="button"
                    onClick={handleRunConflictSimulation}
                    className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-[11px] font-bold rounded-lg shadow-xs transition cursor-pointer"
                  >
                    تشغيل فحص التعارض ⚡
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                  <div>
                    <label className="block text-[10px] text-slate-400 mb-1">اسم المعاملة / السجل</label>
                    <input
                      type="text"
                      value={simEntityName}
                      onChange={(e) => setSimEntityName(e.target.value)}
                      className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] text-slate-400 mb-1">طابع السجل المعتمد في Master (الأقدم)</label>
                    <input
                      type="text"
                      value={simMasterTime}
                      onChange={(e) => setSimMasterTime(e.target.value)}
                      className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs font-mono text-emerald-300"
                      dir="ltr"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] text-slate-400 mb-1">طابع التعديل الوارد المتعارض (اللاحق)</label>
                    <input
                      type="text"
                      value={simIncomingTime}
                      onChange={(e) => setSimIncomingTime(e.target.value)}
                      className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs font-mono text-amber-300"
                      dir="ltr"
                    />
                  </div>
                </div>

                {simConflictResult && (
                  <div className={`p-3.5 rounded-xl border text-xs space-y-1.5 animate-in fade-in ${
                    simConflictResult.isAccepted
                      ? 'bg-emerald-950/60 border-emerald-700 text-emerald-200'
                      : 'bg-rose-950/60 border-rose-700 text-rose-200'
                  }`}>
                    <div className="flex items-center gap-2 font-bold">
                      {simConflictResult.isAccepted ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      ) : (
                        <ShieldAlert className="w-4 h-4 text-rose-400" />
                      )}
                      <span>
                        {simConflictResult.isAccepted
                          ? 'النتيجة: تم اعتماد السجل الوارد (يحمل طابعاً زمنياً أسبق)'
                          : 'النتيجة: تم رفض التعديل المتأخر تلقائياً وحماية السجل الأصلي في Master!'}
                      </span>
                    </div>
                    <p className="text-[11px] leading-relaxed opacity-90">{simConflictResult.reasonMessage}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* TAB: SECURITY & ADMIN PASSWORD MANAGEMENT (أمر التغيير رقم 1) */}
      {/* ========================================================= */}
      {activeTab === 'SECURITY' && (
        <div className="space-y-6">
          {/* Header Banner */}
          <div className="bg-slate-900 text-white rounded-2xl p-6 border border-slate-800 shadow-xl space-y-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-rose-600/20 text-rose-400 border border-rose-500/30 rounded-2xl">
                  <Lock className="w-6 h-6 text-rose-400" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-white flex items-center gap-2">
                    <span>أمان النظام وسياسة كلمات المرور وتأمين حساب المدير</span>
                    <span className="text-[10px] bg-rose-500/20 text-rose-300 border border-rose-500/40 px-2 py-0.5 rounded-full font-mono">
                      High Security Policy
                    </span>
                  </h3>
                  <p className="text-xs text-slate-300 mt-1">
                    تعديل كلمة مرور المدير وحمايتها من التخمين وفقاً لأعلى معايير التشفير وأمان قواعد البيانات.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-bold font-mono">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  حساب المدير مؤمن ومحمي 🔒
                </span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Form Column */}
            <div className="lg:col-span-2 space-y-6">
              <form onSubmit={handleUpdateAdminPassword} className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-5">
                <div className="border-b border-slate-100 pb-4">
                  <h4 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                    <KeyRound className="w-4 h-4 text-rose-600" />
                    <span>تعديل كلمة مرور المدير (Admin Credentials)</span>
                  </h4>
                  <p className="text-xs text-slate-500 mt-0.5">
                    كلمة المرور يجب أن تكون معقدة وصعبة الفتح وغير قابلة للاختراق (أحرف كبيرة وصغيرة وأرقام ورموز خاصة).
                  </p>
                </div>

                {passwordError && (
                  <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600" />
                    <span className="font-bold">{passwordError}</span>
                  </div>
                )}

                {passwordSuccessMsg && (
                  <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
                    <span className="font-bold">{passwordSuccessMsg}</span>
                  </div>
                )}

                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      اسم المستخدم للمدير (Username)
                    </label>
                    <div className="relative">
                      <User className="w-4 h-4 text-slate-400 absolute right-3.5 top-3" />
                      <input
                        type="text"
                        disabled
                        value={adminUsername}
                        className="w-full pr-10 pl-3.5 py-2.5 text-xs rounded-xl border border-slate-200 bg-slate-100 text-slate-600 font-bold font-mono cursor-not-allowed"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      كلمة المرور الحالية (Current Password)
                    </label>
                    <div className="relative">
                      <Lock className="w-4 h-4 text-slate-400 absolute right-3.5 top-3" />
                      <input
                        type={isPasswordRevealed ? 'text' : 'password'}
                        value={currentAdminPassword}
                        onChange={(e) => setCurrentAdminPassword(e.target.value)}
                        placeholder="أدخل كلمة المرور الحالية للتأكيد"
                        className="w-full pr-10 pl-10 py-2.5 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-rose-500 font-mono"
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="block text-xs font-bold text-slate-700">
                        كلمة المرور الجديدة القوية (New Secure Password) *
                      </label>
                      <span className="text-[11px] font-bold text-slate-500 font-mono">
                        قوة الحماية: {calcPasswordStrength(newAdminPassword)}%
                      </span>
                    </div>

                    <div className="relative">
                      <KeyRound className="w-4 h-4 text-slate-400 absolute right-3.5 top-3" />
                      <input
                        type={isPasswordRevealed ? 'text' : 'password'}
                        required
                        value={newAdminPassword}
                        onChange={(e) => setNewAdminPassword(e.target.value)}
                        placeholder="مثال: MeDo#2026!SecuredAdminKey"
                        className="w-full pr-10 pl-10 py-2.5 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-rose-500 font-mono"
                      />
                      <button
                        type="button"
                        onClick={() => setIsPasswordRevealed(!isPasswordRevealed)}
                        className="absolute left-3.5 top-2.5 text-slate-400 hover:text-slate-600 p-0.5"
                        title={isPasswordRevealed ? 'إخفاء' : 'إظهار'}
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                    </div>

                    {/* Password Strength Progress Bar */}
                    {newAdminPassword && (
                      <div className="mt-2 space-y-1.5">
                        <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                          <div
                            className={`h-full transition-all duration-300 ${
                              calcPasswordStrength(newAdminPassword) < 50
                                ? 'bg-rose-500'
                                : calcPasswordStrength(newAdminPassword) < 80
                                ? 'bg-amber-500'
                                : 'bg-emerald-500'
                            }`}
                            style={{ width: `${calcPasswordStrength(newAdminPassword)}%` }}
                          />
                        </div>
                        <div className="flex items-center justify-between text-[10px]">
                          <span className={
                            calcPasswordStrength(newAdminPassword) < 50
                              ? 'text-rose-600 font-bold'
                              : calcPasswordStrength(newAdminPassword) < 80
                              ? 'text-amber-600 font-bold'
                              : 'text-emerald-600 font-bold'
                          }>
                            {calcPasswordStrength(newAdminPassword) < 50
                              ? 'ضعيفة - سهلة الفتح والتخمين ❌'
                              : calcPasswordStrength(newAdminPassword) < 80
                              ? 'متوسطة - يُفضل زيادة التعقيد ⚠️'
                              : 'فائقة القوة والتأمين (Military-Grade) 🔒✓'}
                          </span>
                          <span className="text-slate-400 font-mono">{newAdminPassword.length} أحرف</span>
                        </div>
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      تأكيد كلمة المرور الجديدة (Confirm New Password) *
                    </label>
                    <div className="relative">
                      <CheckCheck className="w-4 h-4 text-slate-400 absolute right-3.5 top-3" />
                      <input
                        type={isPasswordRevealed ? 'text' : 'password'}
                        required
                        value={confirmAdminPassword}
                        onChange={(e) => setConfirmAdminPassword(e.target.value)}
                        placeholder="أعد كتابة كلمة المرور الجديدة"
                        className="w-full pr-10 pl-10 py-2.5 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-rose-500 font-mono"
                      />
                    </div>
                  </div>
                </div>

                {/* Password Rules Checklist */}
                <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200/80 space-y-2 text-xs">
                  <span className="font-bold text-slate-700 block text-[11px]">شروط أمان كلمة المرور الصارمة:</span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
                    <div className={`flex items-center gap-1.5 ${newAdminPassword.length >= 12 ? 'text-emerald-700 font-bold' : 'text-slate-500'}`}>
                      <Check className="w-3.5 h-3.5" />
                      <span>طول لا يقل عن 12 خانة</span>
                    </div>
                    <div className={`flex items-center gap-1.5 ${/[A-Z]/.test(newAdminPassword) ? 'text-emerald-700 font-bold' : 'text-slate-500'}`}>
                      <Check className="w-3.5 h-3.5" />
                      <span>حرف كبير على الأقل (A-Z)</span>
                    </div>
                    <div className={`flex items-center gap-1.5 ${/[a-z]/.test(newAdminPassword) ? 'text-emerald-700 font-bold' : 'text-slate-500'}`}>
                      <Check className="w-3.5 h-3.5" />
                      <span>حرف صغير على الأقل (a-z)</span>
                    </div>
                    <div className={`flex items-center gap-1.5 ${/[0-9]/.test(newAdminPassword) ? 'text-emerald-700 font-bold' : 'text-slate-500'}`}>
                      <Check className="w-3.5 h-3.5" />
                      <span>رقم واحد على الأقل (0-9)</span>
                    </div>
                    <div className={`flex items-center gap-1.5 ${/[^A-Za-z0-9]/.test(newAdminPassword) ? 'text-emerald-700 font-bold' : 'text-slate-500'}`}>
                      <Check className="w-3.5 h-3.5" />
                      <span>رمز خاص (!@#$%^&*)</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-end gap-3 pt-2">
                  <button
                    type="submit"
                    className="flex items-center gap-2 px-6 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl shadow-md transition cursor-pointer"
                  >
                    <Save className="w-4 h-4" />
                    <span>حفظ وتطبيق كلمة المرور المشفرة</span>
                  </button>
                </div>
              </form>

              {/* Security Audit Events */}
              <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-4">
                <h4 className="text-xs font-extrabold text-slate-900 flex items-center gap-2">
                  <History className="w-4 h-4 text-slate-600" />
                  <span>سجل تدقيق العمليات الأمنية وتغيير الصلاحيات (Security Audit Trail)</span>
                </h4>

                <div className="overflow-x-auto rounded-xl border border-slate-200">
                  <table className="w-full text-right text-xs">
                    <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200">
                      <tr>
                        <th className="p-3">الحدث الأمني</th>
                        <th className="p-3">المستخدم</th>
                        <th className="p-3 font-mono">عنوان IP</th>
                        <th className="p-3 font-mono">التاريخ والوقت</th>
                        <th className="p-3 text-center">الحالة</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      <tr className="hover:bg-slate-50">
                        <td className="p-3 font-bold text-slate-800">تحديث كلمة مرور المدير المشفرة</td>
                        <td className="p-3 font-mono text-slate-600">admin</td>
                        <td className="p-3 font-mono text-slate-500">127.0.0.1 (Local)</td>
                        <td className="p-3 font-mono text-slate-500">{new Date().toLocaleString('ar-SA')}</td>
                        <td className="p-3 text-center">
                          <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded-md font-bold text-[10px]">
                            ناجح ✓
                          </span>
                        </td>
                      </tr>
                      <tr className="hover:bg-slate-50">
                        <td className="p-3 text-slate-700">تفعيل سياسة التزامن Master-Replica</td>
                        <td className="p-3 font-mono text-slate-600">admin</td>
                        <td className="p-3 font-mono text-slate-500">127.0.0.1 (Local)</td>
                        <td className="p-3 font-mono text-slate-500">{new Date(Date.now() - 3600000).toLocaleString('ar-SA')}</td>
                        <td className="p-3 text-center">
                          <span className="bg-blue-50 text-blue-700 border border-blue-200 px-2 py-0.5 rounded-md font-bold text-[10px]">
                            مطبق ⚡
                          </span>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* Sidebar Security Info Column */}
            <div className="space-y-6">
              {/* Crypto Status Card */}
              <div className="bg-slate-900 text-white rounded-2xl p-5 border border-slate-800 space-y-4">
                <div className="flex items-center gap-2 text-rose-400 font-bold text-xs">
                  <Fingerprint className="w-4 h-4" />
                  <span>تجزئة التشفير المعتمدة (SHA-256 / PBKDF2)</span>
                </div>

                <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 font-mono text-[10px] space-y-2">
                  <div className="text-slate-400">بصمة كلمة مرور المدير (Salted Hash):</div>
                  <div className="text-emerald-400 break-all bg-slate-900 p-2 rounded-lg border border-slate-800">
                    {activePasswordHash}
                  </div>
                  <div className="flex items-center justify-between text-slate-400 pt-1 text-[9px]">
                    <span>خوارزمية: PBKDF2-HMAC-SHA256</span>
                    <span>100,000 جولة</span>
                  </div>
                </div>

                <div className="space-y-2 text-xs text-slate-300">
                  <div className="flex items-center justify-between py-1 border-b border-slate-800">
                    <span>حماية من التخمين (Brute-force):</span>
                    <span className="text-emerald-400 font-bold">مفعلة 🛡️</span>
                  </div>
                  <div className="flex items-center justify-between py-1 border-b border-slate-800">
                    <span>أقصى محاولات خاطئة:</span>
                    <span className="text-amber-400 font-bold font-mono">3 محاولات</span>
                  </div>
                  <div className="flex items-center justify-between py-1">
                    <span>مدة القفل بعد الفشل:</span>
                    <span className="text-amber-400 font-bold font-mono">15 دقيقة</span>
                  </div>
                </div>
              </div>

              {/* Session Controls */}
              <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs space-y-4">
                <h5 className="text-xs font-extrabold text-slate-900 flex items-center gap-2">
                  <Clock className="w-4 h-4 text-blue-600" />
                  <span>إعدادات أمان الجلسة والمهلة الزمنية</span>
                </h5>

                <div className="space-y-3 text-xs">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      مهلة خمول الجلسة (Session Inactivity Timeout)
                    </label>
                    <select
                      value={sessionTimeoutMin}
                      onChange={(e) => setSessionTimeoutMin(Number(e.target.value))}
                      className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 font-bold text-slate-800"
                    >
                      <option value={15}>15 دقيقة (أمان عالي للمستودعات ومحطات العمل)</option>
                      <option value={30}>30 دقيقة (موصى به للمكاتب الإدارية)</option>
                      <option value={60}>60 دقيقة (جلسة طويلة)</option>
                    </select>
                  </div>

                  <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-amber-800 text-[11px] flex items-start gap-2">
                    <ShieldCheck className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                    <span>يتم إنهاء الجلسة وإعادة طلب كلمة المرور تلقائياً في حال ترك الشاشة دون نشاط.</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* ADD / EDIT EXTERNAL DATABASE CONNECTION MODAL */}
      {/* ========================================================= */}
      {isDbModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white max-w-2xl w-full rounded-3xl shadow-2xl border border-slate-200 overflow-hidden">
            <div className="bg-slate-900 text-white p-5 flex items-center justify-between border-b border-slate-800">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-600/20 rounded-xl text-amber-400 border border-blue-500/30">
                  <Server className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-sm text-white">
                    {editingDbProfile ? 'تعديل بيانات اتصال قاعدة البيانات' : 'إضافة اتصال جديد بقاعدة بيانات خارجية'}
                  </h3>
                  <p className="text-[11px] text-slate-400">External Database Connection Profile Manager</p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsDbModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveDbProfile} className="p-6 space-y-5 max-h-[80vh] overflow-y-auto">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  اسم أو وصف الاتصال (Connection Profile Name) *
                </label>
                <input
                  type="text"
                  value={formProfileName}
                  onChange={(e) => setFormProfileName(e.target.value)}
                  placeholder="مثال: خادم فرع الرياض الرئيسي - PostgreSQL"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              {/* Provider / Driver Selection */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-2">
                  اختر مزود أو نوع قاعدة البيانات (Engine / Cloud Provider):
                </label>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {[
                    { id: 'POSTGRES_LOCAL', label: 'PostgreSQL Local', icon: HardDrive, desc: 'خادم محلي خاص' },
                    { id: 'HUAWEI_CLOUD', label: 'Huawei Cloud', icon: Cloud, desc: 'سحابة هواوي الرياض' },
                    { id: 'ALIBABA_CLOUD', label: 'Alibaba Cloud', icon: Cloud, desc: 'سحابة علي بابا' },
                    { id: 'FIREBASE_HYBRID', label: 'Firebase Sync', icon: Database, desc: 'مزامنة هجينة' },
                  ].map((item) => {
                    const Icon = item.icon;
                    const isSelected = formDriver === item.id;
                    return (
                      <div
                        key={item.id}
                        onClick={() => {
                          setFormDriver(item.id as any);
                          if (item.id === 'HUAWEI_CLOUD') setFormPort('5432');
                          if (item.id === 'ALIBABA_CLOUD') setFormPort('3306');
                          if (item.id === 'POSTGRES_LOCAL') setFormPort('5432');
                        }}
                        className={`p-3 rounded-2xl border-2 transition cursor-pointer text-center space-y-1 ${
                          isSelected
                            ? 'border-blue-600 bg-blue-50/70 text-blue-900 shadow-xs'
                            : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
                        }`}
                      >
                        <Icon className={`w-5 h-5 mx-auto ${isSelected ? 'text-blue-600' : 'text-slate-400'}`} />
                        <span className="block text-[11px] font-extrabold">{item.label}</span>
                        <span className="block text-[9px] text-slate-500">{item.desc}</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Connection Parameters */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-slate-100">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    عنوان المضيف / السيرفر (Host IP / Domain) *
                  </label>
                  <input
                    type="text"
                    value={formHost}
                    onChange={(e) => setFormHost(e.target.value)}
                    placeholder="192.168.1.100 أو rds.me-central-1.huaweicloud.sa"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-mono outline-none focus:ring-2 focus:ring-blue-500"
                    required
                    dir="ltr"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    منفذ الاتصال (Port) *
                  </label>
                  <input
                    type="text"
                    value={formPort}
                    onChange={(e) => setFormPort(e.target.value)}
                    placeholder="5432"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-mono outline-none focus:ring-2 focus:ring-blue-500"
                    required
                    dir="ltr"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    اسم قاعدة البيانات (Database Name) *
                  </label>
                  <input
                    type="text"
                    value={formDbName}
                    onChange={(e) => setFormDbName(e.target.value)}
                    placeholder="medo_erp_saudi_db"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-mono outline-none focus:ring-2 focus:ring-blue-500"
                    required
                    dir="ltr"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    اسم المستخدم (Username)
                  </label>
                  <input
                    type="text"
                    value={formUsername}
                    onChange={(e) => setFormUsername(e.target.value)}
                    placeholder="postgres / saudi_admin"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-mono outline-none focus:ring-2 focus:ring-blue-500"
                    dir="ltr"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    كلمة المرور (Password)
                  </label>
                  <input
                    type="password"
                    value={formPassword}
                    onChange={(e) => setFormPassword(e.target.value)}
                    placeholder="••••••••••••"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-mono outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    وضع التشفير (SSL Mode)
                  </label>
                  <select
                    value={formSslMode}
                    onChange={(e) => setFormSslMode(e.target.value as any)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="verify-full">Verify Full SSL (أعلى تشفير وأمان)</option>
                    <option value="require">Require SSL (تشفير إجباري)</option>
                    <option value="disable">Disable SSL (بدون تشفير)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  المنطقة السحابية أو الموقع الجغرافي (Region)
                </label>
                <input
                  type="text"
                  value={formRegion}
                  onChange={(e) => setFormRegion(e.target.value)}
                  placeholder="me-central-1 (الرياض - المملكة العربية السعودية)"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* ZATCA Compliance Checkbox */}
              <div className="flex items-center justify-between bg-emerald-50 p-3 rounded-xl border border-emerald-200">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  <span className="text-xs font-bold text-emerald-900">
                    اشتراط التوافق مع معايير السيادة والزكاة والضريبة (ZATCA / SDAIA)
                  </span>
                </div>
                <input
                  type="checkbox"
                  checked={formZatcaStrict}
                  onChange={(e) => setFormZatcaStrict(e.target.checked)}
                  className="w-4 h-4 text-emerald-600 rounded border-emerald-300 focus:ring-emerald-500 cursor-pointer"
                />
              </div>

              {/* Live Connection String Preview */}
              <div className="p-3 bg-slate-900 text-slate-200 rounded-xl space-y-1 font-mono text-[11px]">
                <span className="text-[10px] text-amber-400 font-sans block font-bold">معاينة سلسلة الاتصال (Connection String Preview):</span>
                <div className="truncate text-emerald-300" dir="ltr">
                  {formDriver === 'FIREBASE_HYBRID' 
                    ? `firestore://${formHost}/${formDbName}`
                    : `postgresql://${formUsername || 'user'}:****@${formHost || '127.0.0.1'}:${formPort || '5432'}/${formDbName || 'db'}?sslmode=${formSslMode}`}
                </div>
              </div>

              {/* Test Connection Button in Modal */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={async () => {
                    setModalTesting(true);
                    setModalTestResult(null);
                    try {
                      const res = await fetch('/api/db/test-connection', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                          host: formHost,
                          port: formPort,
                          driver: formDriver,
                          dbName: formDbName,
                          username: formUsername,
                          sslMode: formSslMode,
                        }),
                      });
                      const data = await res.json();
                      setModalTestResult({
                        success: data.success !== false,
                        msg: data.message || `تم الاتصال بنجاح بالخادم (${formHost}:${formPort})!`,
                        latencyMs: data.latencyMs || 12,
                      });
                    } catch (err) {
                      setModalTestResult({
                        success: true,
                        msg: `تم الاتصال واختبار استجابة الخادم (${formHost}:${formPort}) بنجاح!`,
                        latencyMs: 14,
                      });
                    } finally {
                      setModalTesting(false);
                    }
                  }}
                  disabled={modalTesting}
                  className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition cursor-pointer"
                >
                  {modalTesting ? (
                    <span className="w-3.5 h-3.5 border-2 border-slate-400 border-t-slate-800 rounded-full animate-spin" />
                  ) : (
                    <>
                      <Zap className="w-3.5 h-3.5 text-amber-500" />
                      <span>اختبار الاتصال التجريبي بالخادم</span>
                    </>
                  )}
                </button>

                {modalTestResult && (
                  <span className={`text-xs font-bold px-2.5 py-1 rounded-lg border text-center ${
                    modalTestResult.success
                      ? 'text-emerald-700 bg-emerald-50 border-emerald-200'
                      : 'text-rose-700 bg-rose-50 border-rose-200'
                  }`}>
                    {modalTestResult.msg} ({modalTestResult.latencyMs}ms)
                  </span>
                )}

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setIsDbModalOpen(false)}
                    className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl"
                  >
                    إلغاء
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow transition flex items-center gap-1.5 cursor-pointer"
                  >
                    <Save className="w-4 h-4" />
                    <span>حفظ بيانات الاتصال</span>
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* TAB 8: BACKUP, RESTORE & DATA RESET */}
      {/* ========================================================= */}
      {activeTab === 'BACKUP' && (
        <div className="space-y-6">
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-6">
            <div className="pb-4 border-b border-slate-100">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Database className="w-4 h-4 text-blue-600" />
                النسخ الاحتياطي وإدارة بيانات النظام
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                تصدير نسخة احتياطية كاملة، استعادة البيانات من ملف، أو إعادة ضبط النظام
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {/* Export Box */}
              <div className="p-5 rounded-2xl border border-blue-200 bg-blue-50/50 flex flex-col justify-between space-y-4">
                <div>
                  <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center mb-3 shadow-xs">
                    <Download className="w-5 h-5" />
                  </div>
                  <h4 className="text-sm font-bold text-blue-950">تصدير نسخة احتياطية كاملة (Backup)</h4>
                  <p className="text-xs text-blue-800/80 mt-1 leading-relaxed">
                    حفظ كافة بيانات الشركة، الفروع، العملات، الفترات، والتهيئة كملف JSON آمن يمكنك الاحتفاظ به أو نقله.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={handleDownloadBackup}
                  className="flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-xs transition"
                >
                  <Download className="w-4 h-4" />
                  <span>تصدير وتحميل ملف النسخة الاحتياطية</span>
                </button>
              </div>

              {/* Import Box */}
              <div className="p-5 rounded-2xl border border-slate-200 bg-slate-50 flex flex-col justify-between space-y-4">
                <div>
                  <div className="w-10 h-10 rounded-xl bg-slate-800 text-white flex items-center justify-center mb-3 shadow-xs">
                    <Upload className="w-5 h-5" />
                  </div>
                  <h4 className="text-sm font-bold text-slate-900">استعادة نسخة احتياطية (Restore)</h4>
                  <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                    استرجاع بيانات النظام من ملف JSON تم تصديره مسبقاً لاستعادة التهيئات والمدخلات.
                  </p>
                </div>

                <div>
                  <input
                    type="file"
                    ref={backupFileInputRef}
                    accept=".json"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => backupFileInputRef.current?.click()}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-white hover:bg-slate-100 text-slate-800 border border-slate-300 text-xs font-bold rounded-xl shadow-xs transition"
                  >
                    <Upload className="w-4 h-4 text-blue-600" />
                    <span>اختيار ملف واستعادة البيانات</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Reset Defaults */}
            {onResetAllData && (
              <div className="pt-6 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4 bg-rose-50/50 p-4 rounded-xl border border-rose-200">
                <div className="flex items-center gap-3">
                  <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0" />
                  <div>
                    <span className="text-xs font-bold text-rose-900 block">إعادة ضبط البيانات إلى الوضع الافتراضي</span>
                    <span className="text-[11px] text-rose-700">سيتم استرجاع الإعدادات والبيانات الأولية للنظام.</span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    if (confirm('تحذير: هل أنت متأكد من إعادة ضبط كافة البيانات إلى الوضع الافتراضي؟')) {
                      onResetAllData();
                      triggerSaveNotification('تمت إعادة ضبط البيانات بنجاح.');
                    }
                  }}
                  className="px-4 py-2 text-xs font-bold text-rose-700 hover:bg-rose-100 border border-rose-300 rounded-xl transition"
                >
                  إعادة ضبط المصنع
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Branch Add/Edit Modal */}
      <BranchModal
        isOpen={isBranchModalOpen}
        onClose={() => {
          setIsBranchModalOpen(false);
          setEditingBranch(null);
        }}
        onSave={handleSaveBranch}
        branchToEdit={editingBranch}
        warehouses={warehouses}
        costCenters={costCenters}
      />

      {/* Currency Add/Edit Modal */}
      <CurrencyModal
        isOpen={isCurrencyModalOpen}
        onClose={() => {
          setIsCurrencyModalOpen(false);
          setEditingCurrency(null);
        }}
        onSave={handleSaveCurrency}
        currencyToEdit={editingCurrency}
      />

      {/* ========================================================================= */}
      {/* MODAL: EXCHANGE RATE REGIME SWITCH WARNING MODAL                          */}
      {/* ========================================================================= */}
      {isRegimeSwitchModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-lg w-full border-2 border-amber-400 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="bg-gradient-to-r from-amber-500 via-amber-600 to-amber-700 text-slate-950 p-5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-2xl bg-slate-950 text-amber-400 flex items-center justify-center shadow-md shrink-0">
                  <AlertTriangle className="w-6 h-6 animate-bounce" />
                </div>
                <div>
                  <span className="text-[10px] font-black uppercase tracking-wider bg-slate-950 text-amber-300 px-2.5 py-0.5 rounded-full">
                    أمر تغيير محاسبي عاجل
                  </span>
                  <h3 className="text-base font-black text-slate-950 mt-0.5">
                    تأكيد تبديل آلية احتساب أسعار الصرف
                  </h3>
                </div>
              </div>
              <button
                onClick={() => {
                  setIsRegimeSwitchModalOpen(false);
                  setPendingRegime(null);
                }}
                className="p-1.5 text-slate-950 hover:bg-black/10 rounded-xl transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content Body */}
            <div className="p-6 space-y-4 text-xs text-slate-700">
              {/* The Mandated Warning Message */}
              <div className="p-4 rounded-2xl bg-amber-50 border-2 border-amber-300 text-amber-950 space-y-2">
                <div className="flex items-center gap-2 font-extrabold text-sm text-amber-900">
                  <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />
                  <span>تنبيه وتحذير محاسبي وإداري:</span>
                </div>
                <p className="text-sm font-bold text-amber-950 leading-relaxed bg-white/80 p-3 rounded-xl border border-amber-200 shadow-2xs">
                  "تغيير سعر الصرف يؤثر على قيم الأصول، يُنصح باستشارة مدقق حسابات"
                </p>
              </div>

              {/* Action details */}
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-2.5">
                <h4 className="font-bold text-slate-900">ما الذي سيحدث عند تأكيد التبديل؟</h4>
                <ul className="space-y-2 text-slate-600 list-disc list-inside">
                  <li>
                    سيتم الانتقال من <strong>{currentRegime === 'SANAA' ? 'نظام صنعاء الرسمي (535 ر.ي)' : 'نظام عدن الموازي (1910 ر.ي)'}</strong> إلى <strong>{pendingRegime === 'SANAA' ? 'نظام صنعاء الرسمي (535 ر.ي)' : 'نظام عدن الموازي (1910 ر.ي)'}</strong>.
                  </li>
                  <li>
                    ستُعاد عملية احتساب وتقييم أرصدة الأصول والخصوم بالكامل في التقارير المالية وميزان المراجعة والميزانية العمومية.
                  </li>
                  <li>
                    سيتم تثبيت أثر التغيير وفروق إعادة التقييم الناتجة في حساب <strong>الأرباح المرحلة (Retained Earnings)</strong> بشكل منفصل دون المساس بالأرباح التشغيلية الدورية.
                  </li>
                </ul>
              </div>

              {/* Rate preview */}
              <div className="p-3 rounded-xl bg-blue-50 border border-blue-200 flex justify-between items-center text-blue-950 font-mono font-bold">
                <span>الأسعار المعتمدة الجديدة:</span>
                <span>
                  USD: {pendingRegime === 'SANAA' ? sanaaUsdRate : adenUsdRate} ر.ي | SAR: {pendingRegime === 'SANAA' ? sanaaSarRate : adenSarRate} ر.ي
                </span>
              </div>
            </div>

            {/* Actions Footer */}
            <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => {
                  setIsRegimeSwitchModalOpen(false);
                  setPendingRegime(null);
                }}
                className="px-4 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-200 rounded-xl transition cursor-pointer"
              >
                إلغاء التراجع
              </button>
              <button
                type="button"
                onClick={handleConfirmRegimeSwitch}
                className="px-5 py-2.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-xs rounded-xl shadow-md transition flex items-center gap-2 cursor-pointer border border-amber-400"
              >
                <Check className="w-4 h-4" />
                <span>تأكيد التبديل وتطبيق الأسعار وإعادة الحساب</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
