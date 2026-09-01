// Offline Sync Manager & Local Storage Database Utilities

export interface OfflineAction {
  id: string;
  timestamp: string;
  module: string;
  actionType: 'CREATE' | 'UPDATE' | 'DELETE' | 'STATUS_CHANGE';
  entityName: string;
  recordId: string;
  payload: any;
  synced: boolean;
}

const OFFLINE_QUEUE_KEY = 'medo_erp_offline_sync_queue_v1';
const LAST_SYNC_KEY = 'medo_erp_last_sync_timestamp';

// 1. Get queued offline actions
export function getOfflineQueue(): OfflineAction[] {
  try {
    const raw = localStorage.getItem(OFFLINE_QUEUE_KEY);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch (e) {
    console.error('Error reading offline queue:', e);
    return [];
  }
}

// 2. Save queue
export function saveOfflineQueue(queue: OfflineAction[]): void {
  try {
    localStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(queue));
  } catch (e) {
    console.error('Error saving offline queue:', e);
  }
}

// 3. Enqueue new offline action
export function recordOfflineAction(action: Omit<OfflineAction, 'id' | 'timestamp' | 'synced'>): OfflineAction {
  const newAction: OfflineAction = {
    ...action,
    id: 'off-act-' + Date.now() + '-' + Math.random().toString(36).substr(2, 4),
    timestamp: new Date().toISOString(),
    synced: false,
  };

  const queue = getOfflineQueue();
  queue.push(newAction);
  saveOfflineQueue(queue);

  return newAction;
}

// 4. Mark actions as synced
export function clearSyncedActions(): void {
  try {
    localStorage.removeItem(OFFLINE_QUEUE_KEY);
    localStorage.setItem(LAST_SYNC_KEY, new Date().toISOString());
  } catch (e) {
    console.error('Error clearing synced queue:', e);
  }
}

export function getLastSyncTime(): string | null {
  try {
    return localStorage.getItem(LAST_SYNC_KEY);
  } catch {
    return null;
  }
}

// 5. Generate Full Offline JSON Database Snapshot
export function generateFullDatabaseBackup(): string {
  const backupData: Record<string, any> = {
    system: 'MeDo ERP S/4HANA Enterprise',
    version: '2026.4.1',
    exportDate: new Date().toISOString(),
    exportedOffline: !navigator.onLine,
    storage: {},
  };

  try {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith('medo_erp_')) {
        const val = localStorage.getItem(key);
        try {
          backupData.storage[key] = JSON.parse(val || '');
        } catch {
          backupData.storage[key] = val;
        }
      }
    }
  } catch (err) {
    console.error('Failed to generate full backup:', err);
  }

  return JSON.stringify(backupData, null, 2);
}

// 6. Download Backup File Locally
export function downloadOfflineBackupFile(): void {
  const jsonContent = generateFullDatabaseBackup();
  const blob = new Blob([jsonContent], { type: 'application/json;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const dateStr = new Date().toISOString().slice(0, 10);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', `MeDo_ERP_Local_Backup_${dateStr}.json`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
