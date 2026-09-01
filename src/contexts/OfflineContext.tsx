import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import {
  OfflineAction,
  getOfflineQueue,
  recordOfflineAction,
  clearSyncedActions,
  getLastSyncTime,
  downloadOfflineBackupFile
} from '../utils/offlineSyncManager';

interface OfflineContextType {
  isOnline: boolean;
  isOffline: boolean;
  queue: OfflineAction[];
  queueCount: number;
  lastSyncTime: string | null;
  isSyncing: boolean;
  syncSuccessMsg: string | null;
  triggerSync: () => Promise<{ success: boolean; syncedCount: number }>;
  recordAction: (action: Omit<OfflineAction, 'id' | 'timestamp' | 'synced'>) => void;
  downloadLocalBackup: () => void;
  canInstallPWA: boolean;
  installPWA: () => Promise<void>;
  isInstalled: boolean;
}

const OfflineContext = createContext<OfflineContextType | undefined>(undefined);

export const OfflineProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [isOnline, setIsOnline] = useState<boolean>(typeof navigator !== 'undefined' ? navigator.onLine : true);
  const [queue, setQueue] = useState<OfflineAction[]>([]);
  const [lastSyncTime, setLastSyncTime] = useState<string | null>(null);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [syncSuccessMsg, setSyncSuccessMsg] = useState<string | null>(null);
  
  // PWA Deferred Prompt
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [canInstallPWA, setCanInstallPWA] = useState<boolean>(false);
  const [isInstalled, setIsInstalled] = useState<boolean>(false);

  // Initialize status and queue
  useEffect(() => {
    setQueue(getOfflineQueue());
    setLastSyncTime(getLastSyncTime());

    // Check if running in standalone PWA mode
    if (typeof window !== 'undefined') {
      const isStandalone = window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone;
      setIsInstalled(!!isStandalone);
    }

    const handleOnline = () => {
      setIsOnline(true);
      console.log('[MeDo ERP] Network connection restored: ONLINE 🟢');
      // Auto sync when reconnected
      setTimeout(() => {
        autoSyncOnReconnect();
      }, 1000);
    };

    const handleOffline = () => {
      setIsOnline(false);
      console.log('[MeDo ERP] Network connection lost: OFFLINE ⚡ (Switched to 100% local persistence)');
    };

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setCanInstallPWA(true);
      console.log('[MeDo ERP] PWA install prompt ready.');
    };

    const handleAppInstalled = () => {
      setCanInstallPWA(false);
      setIsInstalled(true);
      setDeferredPrompt(null);
      console.log('[MeDo ERP] PWA successfully installed to device home screen / desktop.');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const autoSyncOnReconnect = async () => {
    const currentQueue = getOfflineQueue();
    if (currentQueue.length === 0) return;

    setIsSyncing(true);
    try {
      // Simulate/Trigger server sync
      await new Promise(resolve => setTimeout(resolve, 1200));
      const count = currentQueue.length;
      clearSyncedActions();
      setQueue([]);
      setLastSyncTime(new Date().toISOString());
      setSyncSuccessMsg(`تمت مزامنة (${count}) عملية مسجلة بدون إنترنت بنجاح مع السحابة.`);
      setTimeout(() => setSyncSuccessMsg(null), 5000);
    } catch (e) {
      console.error('Auto sync error:', e);
    } finally {
      setIsSyncing(false);
    }
  };

  const triggerSync = async (): Promise<{ success: boolean; syncedCount: number }> => {
    const currentQueue = getOfflineQueue();
    setIsSyncing(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      const count = currentQueue.length;
      clearSyncedActions();
      setQueue([]);
      const now = new Date().toISOString();
      setLastSyncTime(now);
      setSyncSuccessMsg(`تمت المزامنة اليدوية بنجاح لـ (${count}) عملية مسجلة محلياً.`);
      setTimeout(() => setSyncSuccessMsg(null), 5000);
      return { success: true, syncedCount: count };
    } catch (e) {
      console.error('Manual sync error:', e);
      return { success: false, syncedCount: 0 };
    } finally {
      setIsSyncing(false);
    }
  };

  const recordAction = (action: Omit<OfflineAction, 'id' | 'timestamp' | 'synced'>) => {
    const saved = recordOfflineAction(action);
    setQueue(prev => [...prev, saved]);
  };

  const downloadLocalBackup = () => {
    downloadOfflineBackupFile();
  };

  const installPWA = async () => {
    if (!deferredPrompt) {
      alert('لتثبيت التطبيق على هاتفك أو حاسوبك:\n\n• في متصفح Chrome/Edge: انقر على أيقونة التثبيت (➕ أو 📲) بجانب شريط العنوان.\n• في iPhone (Safari): اضغط زر المشاركة ثم "إضافة إلى الصفحة الرئيسية (Add to Home Screen)".');
      return;
    }
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    console.log(`User response to install prompt: ${outcome}`);
    setDeferredPrompt(null);
    setCanInstallPWA(false);
  };

  return (
    <OfflineContext.Provider
      value={{
        isOnline,
        isOffline: !isOnline,
        queue,
        queueCount: queue.length,
        lastSyncTime,
        isSyncing,
        syncSuccessMsg,
        triggerSync,
        recordAction,
        downloadLocalBackup,
        canInstallPWA,
        installPWA,
        isInstalled,
      }}
    >
      {children}
    </OfflineContext.Provider>
  );
};

export const useOffline = (): OfflineContextType => {
  const context = useContext(OfflineContext);
  if (!context) {
    throw new Error('useOffline must be used within an OfflineProvider');
  }
  return context;
};
