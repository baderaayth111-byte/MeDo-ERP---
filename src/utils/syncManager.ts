import { 
  CloudReplicaNode, 
  SyncQueueItem, 
  SyncEngineStatus 
} from '../types/accounting';

const SYNC_QUEUE_KEY = 'medo_erp_sync_queue_v2';
const SYNC_NODES_KEY = 'medo_erp_sync_nodes_v2';

// ---------------------------------------------------------------------------
// 1. Initial Cloud Replicas Configuration (Local Master + Cloud Read Replicas)
// ---------------------------------------------------------------------------
export const DEFAULT_SYNC_NODES: CloudReplicaNode[] = [
  {
    id: 'node-local-master',
    provider: 'POSTGRES_LOCAL',
    nameAr: 'خادم PostgreSQL المحلي (Master الرئيسي للكتابة)',
    role: 'MASTER_WRITE',
    host: '127.0.0.1:5432 (Local Unix Socket)',
    region: 'الرياض / الخادم المحلي المركزي',
    status: 'SYNCED',
    lastSyncTimestamp: new Date().toISOString(),
    pendingQueueCount: 0,
    latencyMs: 1,
    isAuthority: true,
  },
  {
    id: 'node-huawei-replica',
    provider: 'HUAWEI_CLOUD',
    nameAr: 'سحابة هواوي (Huawei Cloud RDS - Read-Only Replica)',
    role: 'READ_ONLY_REPLICA',
    host: 'rds.me-central-1.huaweicloud.sa',
    region: 'الرياض (KSA - Huawei Cloud)',
    status: 'SYNCED',
    lastSyncTimestamp: new Date().toISOString(),
    pendingQueueCount: 0,
    latencyMs: 18,
    isAuthority: false,
  },
  {
    id: 'node-alibaba-replica',
    provider: 'ALIBABA_CLOUD',
    nameAr: 'سحابة علي بابا (Alibaba Cloud RDS - Read-Only Replica)',
    role: 'READ_ONLY_REPLICA',
    host: 'apsara.me-east-1.alibabacloud.sa',
    region: 'الدمام (KSA - Alibaba Cloud)',
    status: 'SYNCED',
    lastSyncTimestamp: new Date().toISOString(),
    pendingQueueCount: 0,
    latencyMs: 22,
    isAuthority: false,
  },
  {
    id: 'node-google-replica',
    provider: 'GOOGLE_CLOUD',
    nameAr: 'سحابة جوجل (Google Cloud / Firestore - Read-Only Replica)',
    role: 'READ_ONLY_REPLICA',
    host: 'europe-west1.gcp.database.app',
    region: 'Google Cloud Multi-Region (KSA/GCC)',
    status: 'SYNCED',
    lastSyncTimestamp: new Date().toISOString(),
    pendingQueueCount: 0,
    latencyMs: 35,
    isAuthority: false,
  },
];

// ---------------------------------------------------------------------------
// 2. Local Storage Helpers for Sync State
// ---------------------------------------------------------------------------
export function getSavedSyncNodes(): CloudReplicaNode[] {
  try {
    const saved = localStorage.getItem(SYNC_NODES_KEY);
    if (saved) return JSON.parse(saved);
  } catch (e) {}
  return DEFAULT_SYNC_NODES;
}

export function saveSyncNodes(nodes: CloudReplicaNode[]): void {
  try {
    localStorage.setItem(SYNC_NODES_KEY, JSON.stringify(nodes));
  } catch (e) {}
}

export function getSavedSyncQueue(): SyncQueueItem[] {
  try {
    const saved = localStorage.getItem(SYNC_QUEUE_KEY);
    if (saved) return JSON.parse(saved);
  } catch (e) {}
  return [];
}

export function saveSyncQueue(queue: SyncQueueItem[]): void {
  try {
    localStorage.setItem(SYNC_QUEUE_KEY, JSON.stringify(queue));
  } catch (e) {}
}

// ---------------------------------------------------------------------------
// 3. Oldest Timestamp Conflict Resolution Policy (أمر التغيير رقم 2)
// ---------------------------------------------------------------------------
export interface ConflictResolutionOutcome<T> {
  isAccepted: boolean;
  acceptedRecord: T;
  rejectedRecord?: T;
  resolutionPolicy: 'OLDEST_TIMESTAMP_AUTHORITATIVE';
  reasonMessage: string;
}

/**
 * Resolves a data conflict between an existing master record and an incoming concurrent edit.
 * Strict Rule: The Oldest Timestamp (earliest write) is ALWAYS authoritative.
 * Any newer/delayed incoming edit that conflicts with an already-committed record is REJECTED with a user warning.
 */
export function resolveConflictWithOldestTimestamp<T extends { sync_timestamp?: string; id?: string }>(
  existingMasterRecord: T,
  incomingRecord: T,
  recordLabel = 'المعاملة المحاسبية'
): ConflictResolutionOutcome<T> {
  const existingTime = existingMasterRecord.sync_timestamp 
    ? new Date(existingMasterRecord.sync_timestamp).getTime() 
    : 0;
  
  const incomingTime = incomingRecord.sync_timestamp 
    ? new Date(incomingRecord.sync_timestamp).getTime() 
    : Date.now();

  // If existing record is older or equal -> Existing wins, Incoming is rejected
  if (existingTime > 0 && existingTime <= incomingTime) {
    const timeDiffSec = Math.max(1, Math.round((incomingTime - existingTime) / 1000));
    return {
      isAccepted: false,
      acceptedRecord: existingMasterRecord,
      rejectedRecord: incomingRecord,
      resolutionPolicy: 'OLDEST_TIMESTAMP_AUTHORITATIVE',
      reasonMessage: `[تحذير تعارض قواعد البيانات]: تم رفض التعديل المتأخر على (${recordLabel}) بفارق ${timeDiffSec} ثانية. يعتمد النظام سياسة (Oldest Timestamp Authoritative) لتفادي تضارب الخوادم المتعددة والاحتفاظ بالإدخال المرجعي الأصلي.`,
    };
  }

  // If incoming record has an older timestamp (was created first during offline partition), incoming wins
  return {
    isAccepted: true,
    acceptedRecord: incomingRecord,
    rejectedRecord: existingMasterRecord,
    resolutionPolicy: 'OLDEST_TIMESTAMP_AUTHORITATIVE',
    reasonMessage: `تم اعتماد السجل الوارد لكونه يحمل الطابع الزمني الأقدم (${incomingRecord.sync_timestamp || 'N/A'}) وتحديث الخادم المحلي Master بناءً عليه.`,
  };
}

// ---------------------------------------------------------------------------
// 4. Push Transaction to Queue & Background Sync
// ---------------------------------------------------------------------------
export function enqueueTransactionForCloudReplication(
  entityType: SyncQueueItem['entityType'],
  entityId: string,
  recordIdentifier: string,
  explicitSyncTimestamp?: string
): SyncQueueItem {
  const sync_timestamp = explicitSyncTimestamp || new Date().toISOString();
  const queueItem: SyncQueueItem = {
    id: `sync-q-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    entityType,
    entityId,
    recordIdentifier,
    sync_timestamp,
    localMasterCommittedAt: new Date().toISOString(),
    pushedToCloudReplicas: {
      huawei: false,
      alibaba: false,
      google: false,
    },
    status: 'QUEUED',
    retryCount: 0,
  };

  const queue = getSavedSyncQueue();
  // Keep last 100 queue entries
  const updatedQueue = [queueItem, ...queue.slice(0, 99)];
  saveSyncQueue(updatedQueue);

  // Trigger background replication simulation
  setTimeout(() => {
    processSyncQueueBackground();
  }, 1200);

  return queueItem;
}

// Background worker pushing to Huawei, Alibaba, Google Cloud Replicas
export function processSyncQueueBackground(): void {
  const queue = getSavedSyncQueue();
  let modified = false;

  const updatedQueue = queue.map((item) => {
    if (item.status === 'QUEUED') {
      modified = true;
      return {
        ...item,
        pushedToCloudReplicas: {
          huawei: true,
          alibaba: true,
          google: true,
        },
        status: 'PUSHED' as const,
      };
    }
    return item;
  });

  if (modified) {
    saveSyncQueue(updatedQueue);

    // Update nodes sync timestamp
    const nodes = getSavedSyncNodes();
    const updatedNodes = nodes.map((node) => {
      if (node.role === 'READ_ONLY_REPLICA') {
        return {
          ...node,
          status: 'SYNCED' as const,
          lastSyncTimestamp: new Date().toISOString(),
          pendingQueueCount: 0,
        };
      }
      return node;
    });
    saveSyncNodes(updatedNodes);
  }
}

// ---------------------------------------------------------------------------
// 5. Aggregate Sync Engine Status
// ---------------------------------------------------------------------------
export function getSyncEngineStatus(): SyncEngineStatus {
  const nodes = getSavedSyncNodes();
  const queue = getSavedSyncQueue();
  const pendingCount = queue.filter(q => q.status === 'QUEUED').length;
  const rejectedCount = queue.filter(q => q.status === 'CONFLICT_REJECTED').length;

  return {
    masterNode: {
      name: 'PostgreSQL Local Node (Primary Write Master)',
      driver: 'POSTGRES_LOCAL',
      role: 'MASTER_WRITE',
      status: 'ONLINE',
      totalCommittedTransactions: 1450 + queue.length,
    },
    replicas: nodes.filter(n => n.role === 'READ_ONLY_REPLICA').map(r => ({
      ...r,
      pendingQueueCount: pendingCount,
    })),
    queueLength: pendingCount,
    conflictPolicy: 'OLDEST_TIMESTAMP_AUTHORITATIVE',
    lastPushedAt: queue.length > 0 ? queue[0].localMasterCommittedAt : new Date().toISOString(),
    rejectedCollisionsCount: rejectedCount,
  };
}
