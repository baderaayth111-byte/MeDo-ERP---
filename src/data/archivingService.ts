import {
  ArchiveBatch,
  ArchiveDocumentType,
  ArchiveFilterCriteria,
  ArchivePayload,
  ArchiveSimulationResult,
  ArchivingPolicy,
} from '../types/archiving';
import {
  JournalEntry,
  Invoice,
  PaymentVoucher,
  StockMovement,
  POSTransaction,
  PurchaseOrder,
  PayrollRun,
} from '../types/accounting';
import { loadFromStorage, saveToStorage } from './persistence';

export const ARCHIVE_STORAGE_KEYS = {
  ARCHIVE_BATCHES: 'medo_erp_archive_batches_v2',
  ARCHIVE_POLICY: 'medo_erp_archive_policy_v2',
};

export const defaultArchivingPolicy: ArchivingPolicy = {
  autoArchiveEnabled: false,
  retentionPeriodMonths: 12,
  alertThresholdRecords: 3000,
  protectUnsettledDocuments: true,
  requireApprovalForRestoration: false,
  lastRunDate: '2026-01-01',
};

// Initial historic archive sample for immediate user experience
export const initialArchiveBatches: ArchiveBatch[] = [
  {
    id: 'arch-batch-2025-q4',
    batchNumber: 'ARCH-2025-Q4-001',
    title: 'أرشفة إقفال السنة المالية 2025 (الربع الأخير)',
    createdAt: '2026-01-05T09:30:00Z',
    archivedBy: 'زياد بدر (المدير المالي)',
    cutoffDate: '2025-12-31',
    fiscalPeriodId: 'FP-2025-Q4',
    fiscalPeriodName: 'السنة المالية 2025 - الربع الرابع (مقفلة)',
    notes: 'تمت أرشفة القيود والفواتير المسددة والمقفلة بنجاح بعد اعتماد الميزانية العمومية الختامية.',
    totalDocumentsCount: 42,
    documentsByType: {
      JOURNAL_ENTRY: 18,
      INVOICE: 12,
      PAYMENT_VOUCHER: 8,
      POS_ORDER: 4,
      STOCK_MOVEMENT: 0,
      PURCHASE_ORDER: 0,
      PAYROLL_RUN: 0,
    },
    totalFinancialVolumeInBase: 14850000,
    estimatedSizeKb: 128,
    status: 'ARCHIVED',
    payload: {
      journalEntries: [
        {
          id: 'arch-je-2025-01',
          entryNumber: 'JV-2025-0982',
          date: '2025-12-28',
          reference: 'REF-CLOSING-2025',
          description: 'قيد إقفال المصروفات التشغيلية الدورية - فرع صنعاء',
          status: 'POSTED',
          totalDebit: 1250000,
          totalCredit: 1250000,
          createdBy: 'أحمد المحاسب',
          postedAt: '2025-12-28T16:00:00Z',
          lines: [
            {
              id: 'l1',
              accountCode: '5101',
              accountName: 'مصاريف إيجار المقرات',
              debit: 1250000,
              credit: 0,
              currency: 'YER',
              exchangeRate: 1,
              amountInBase: 1250000,
              description: 'إيجار شهر ديسمبر 2025',
            },
            {
              id: 'l2',
              accountCode: '1011',
              accountName: 'الصندوق الرئيسي - صنعاء',
              debit: 0,
              credit: 1250000,
              currency: 'YER',
              exchangeRate: 1,
              amountInBase: 1250000,
              description: 'سداد نقدي',
            },
          ],
        },
        {
          id: 'arch-je-2025-02',
          entryNumber: 'JV-2025-0995',
          date: '2025-12-30',
          reference: 'REF-DEP-2025',
          description: 'قيد إهلاك الأصول الثابتة السنوي لعام 2025',
          status: 'POSTED',
          totalDebit: 3400000,
          totalCredit: 3400000,
          createdBy: 'زياد بدر',
          postedAt: '2025-12-30T18:00:00Z',
          lines: [
            {
              id: 'l3',
              accountCode: '5201',
              accountName: 'مصروف إهلاك الآلات والمعدات',
              debit: 3400000,
              credit: 0,
              currency: 'YER',
              exchangeRate: 1,
              amountInBase: 3400000,
              description: 'إهلاك سنوي 2025',
            },
            {
              id: 'l4',
              accountCode: '1202',
              accountName: 'مجمع إهلاك الآلات والمعدات',
              debit: 0,
              credit: 3400000,
              currency: 'YER',
              exchangeRate: 1,
              amountInBase: 3400000,
              description: 'مجمع الإهلاك السنوي',
            },
          ],
        },
      ],
      invoices: [
        {
          id: 'arch-inv-2025-01',
          invoiceNumber: 'INV-2025-4421',
          type: 'CUSTOMER_INVOICE',
          entityId: 'CUST-001',
          entityName: 'شركة النجم للمقاولات والتجارة',
          date: '2025-11-15',
          dueDate: '2025-12-15',
          subtotal: 5200000,
          taxTotal: 0,
          grandTotal: 5200000,
          paidAmount: 5200000,
          remainingAmount: 0,
          currency: 'YER',
          exchangeRate: 1,
          status: 'PAID',
          items: [
            {
              id: 'it1',
              description: 'توريد كابلات وتجهيزات كهربائية',
              quantity: 20,
              unitPrice: 260000,
              taxRate: 0,
              taxAmount: 0,
              subtotal: 5200000,
              total: 5200000,
            },
          ],
        },
      ],
      paymentVouchers: [
        {
          id: 'arch-pv-2025-01',
          voucherNumber: 'RCV-2025-0811',
          type: 'RECEIPT',
          date: '2025-12-10',
          entityId: 'CUST-001',
          entityName: 'شركة النجم للمقاولات والتجارة',
          amount: 5200000,
          currency: 'YER',
          exchangeRate: 1,
          amountInBase: 5200000,
          paymentMethod: 'BANK_TRANSFER',
          referenceNumber: 'TRF-BK-99120',
          debitAccountCode: '1021',
          creditAccountCode: '1101',
          notes: 'سداد كامل قيمة الفاتورة INV-2025-4421',
          status: 'COMPLETED',
        },
      ],
      posOrders: [],
      stockMovements: [],
      purchaseOrders: [],
      payrollRuns: [],
    },
  },
];

// Load & Save Archive Batches
export const getLoadedArchiveBatches = (): ArchiveBatch[] => {
  return loadFromStorage<ArchiveBatch[]>(
    ARCHIVE_STORAGE_KEYS.ARCHIVE_BATCHES,
    initialArchiveBatches
  );
};

export const saveArchiveBatchesToStorage = (batches: ArchiveBatch[]): void => {
  saveToStorage(ARCHIVE_STORAGE_KEYS.ARCHIVE_BATCHES, batches);
};

// Load & Save Archiving Policy
export const getLoadedArchivingPolicy = (): ArchivingPolicy => {
  return loadFromStorage<ArchivingPolicy>(
    ARCHIVE_STORAGE_KEYS.ARCHIVE_POLICY,
    defaultArchivingPolicy
  );
};

export const saveArchivingPolicyToStorage = (policy: ArchivingPolicy): void => {
  saveToStorage(ARCHIVE_STORAGE_KEYS.ARCHIVE_POLICY, policy);
};

// Helper: Simulate Archiving to see what matches criteria before committing
export function simulateArchive(
  criteria: ArchiveFilterCriteria,
  activeData: {
    journalEntries: JournalEntry[];
    invoices: Invoice[];
    paymentVouchers: PaymentVoucher[];
    posOrders: POSTransaction[];
    stockMovements: StockMovement[];
    purchaseOrders: PurchaseOrder[];
    payrollRuns: PayrollRun[];
  }
): ArchiveSimulationResult {
  const cutoffTime = new Date(criteria.cutoffDate + 'T23:59:59').getTime();

  // 1. Journal Entries
  let eligibleJournalEntries: JournalEntry[] = [];
  if (criteria.selectedTypes.includes('JOURNAL_ENTRY')) {
    eligibleJournalEntries = activeData.journalEntries.filter((je) => {
      const entryTime = new Date(je.date).getTime();
      if (entryTime > cutoffTime) return false;
      if (criteria.onlyClosedAndSettled) {
        return je.status === 'POSTED' || je.status === 'REVERSED';
      }
      return true;
    });
  }

  // 2. Invoices
  let eligibleInvoices: Invoice[] = [];
  if (criteria.selectedTypes.includes('INVOICE')) {
    eligibleInvoices = activeData.invoices.filter((inv) => {
      const invTime = new Date(inv.date).getTime();
      if (invTime > cutoffTime) return false;
      if (criteria.onlyClosedAndSettled) {
        return inv.status === 'PAID' || inv.status === 'CANCELLED';
      }
      return true;
    });
  }

  // 3. Payment Vouchers
  let eligiblePaymentVouchers: PaymentVoucher[] = [];
  if (criteria.selectedTypes.includes('PAYMENT_VOUCHER')) {
    eligiblePaymentVouchers = activeData.paymentVouchers.filter((pv) => {
      const pvTime = new Date(pv.date).getTime();
      if (pvTime > cutoffTime) return false;
      if (criteria.onlyClosedAndSettled) {
        return pv.status === 'COMPLETED' || pv.status === 'CANCELLED';
      }
      return true;
    });
  }

  // 4. POS Orders
  let eligiblePosOrders: POSTransaction[] = [];
  if (criteria.selectedTypes.includes('POS_ORDER')) {
    eligiblePosOrders = (activeData.posOrders || []).filter((po) => {
      const poTime = new Date(po.date || '').getTime();
      if (isNaN(poTime)) return false;
      return poTime <= cutoffTime;
    });
  }

  // 5. Stock Movements
  let eligibleStockMovements: StockMovement[] = [];
  if (criteria.selectedTypes.includes('STOCK_MOVEMENT')) {
    eligibleStockMovements = (activeData.stockMovements || []).filter((sm) => {
      const smTime = new Date(sm.date).getTime();
      return smTime <= cutoffTime;
    });
  }

  // 6. Purchase Orders
  let eligiblePurchaseOrders: PurchaseOrder[] = [];
  if (criteria.selectedTypes.includes('PURCHASE_ORDER')) {
    eligiblePurchaseOrders = (activeData.purchaseOrders || []).filter((po) => {
      const poTime = new Date(po.date).getTime();
      if (poTime > cutoffTime) return false;
      if (criteria.onlyClosedAndSettled) {
        return po.status === 'COMPLETED' || po.status === 'CANCELLED';
      }
      return true;
    });
  }

  // 7. Payroll Runs
  let eligiblePayrollRuns: PayrollRun[] = [];
  if (criteria.selectedTypes.includes('PAYROLL_RUN')) {
    eligiblePayrollRuns = (activeData.payrollRuns || []).filter((pr) => {
      const prTime = new Date(pr.dateProcessed || '').getTime();
      if (isNaN(prTime)) return false;
      if (prTime > cutoffTime) return false;
      if (criteria.onlyClosedAndSettled) {
        return pr.status === 'POSTED_TO_GL';
      }
      return true;
    });
  }

  const countsByType: Record<ArchiveDocumentType, number> = {
    JOURNAL_ENTRY: eligibleJournalEntries.length,
    INVOICE: eligibleInvoices.length,
    PAYMENT_VOUCHER: eligiblePaymentVouchers.length,
    POS_ORDER: eligiblePosOrders.length,
    STOCK_MOVEMENT: eligibleStockMovements.length,
    PURCHASE_ORDER: eligiblePurchaseOrders.length,
    PAYROLL_RUN: eligiblePayrollRuns.length,
  };

  const totalEligibleCount =
    eligibleJournalEntries.length +
    eligibleInvoices.length +
    eligiblePaymentVouchers.length +
    eligiblePosOrders.length +
    eligibleStockMovements.length +
    eligiblePurchaseOrders.length +
    eligiblePayrollRuns.length;

  // Calculate approximate financial volume in base currency
  let totalFinancialVolumeInBase = 0;
  eligibleJournalEntries.forEach((je) => (totalFinancialVolumeInBase += je.totalDebit || 0));
  eligibleInvoices.forEach((inv) => (totalFinancialVolumeInBase += inv.grandTotal * (inv.exchangeRate || 1)));
  eligiblePaymentVouchers.forEach((pv) => (totalFinancialVolumeInBase += pv.amountInBase || pv.amount || 0));
  eligiblePosOrders.forEach((po) => (totalFinancialVolumeInBase += po.grandTotal || 0));

  // Estimate storage bytes (average JSON size per record ~ 1.2 KB)
  const estimatedBytesSaved = totalEligibleCount * 1250;

  return {
    eligibleJournalEntries,
    eligibleInvoices,
    eligiblePaymentVouchers,
    eligiblePosOrders,
    eligibleStockMovements,
    eligiblePurchaseOrders,
    eligiblePayrollRuns,
    countsByType,
    totalEligibleCount,
    totalFinancialVolumeInBase,
    estimatedBytesSaved,
    cutoffDate: criteria.cutoffDate,
  };
}

// Helper: Execute Archiving Operation
export function executeArchiveOperation(
  criteria: ArchiveFilterCriteria,
  batchTitle: string,
  operatorName: string,
  userNotes: string,
  activeData: {
    journalEntries: JournalEntry[];
    invoices: Invoice[];
    paymentVouchers: PaymentVoucher[];
    posOrders: POSTransaction[];
    stockMovements: StockMovement[];
    purchaseOrders: PurchaseOrder[];
    payrollRuns: PayrollRun[];
  }
): {
  newBatch: ArchiveBatch;
  updatedActiveData: {
    journalEntries: JournalEntry[];
    invoices: Invoice[];
    paymentVouchers: PaymentVoucher[];
    posOrders: POSTransaction[];
    stockMovements: StockMovement[];
    purchaseOrders: PurchaseOrder[];
    payrollRuns: PayrollRun[];
  };
} {
  const simulation = simulateArchive(criteria, activeData);

  const batchId = `arch-batch-${Date.now()}`;
  const now = new Date();
  const yearStr = now.getFullYear();
  const seqStr = String(Math.floor(Math.random() * 900) + 100);
  const batchNumber = `ARCH-${yearStr}-${seqStr}`;

  const payload: ArchivePayload = {
    journalEntries: simulation.eligibleJournalEntries,
    invoices: simulation.eligibleInvoices,
    paymentVouchers: simulation.eligiblePaymentVouchers,
    posOrders: simulation.eligiblePosOrders,
    stockMovements: simulation.eligibleStockMovements,
    purchaseOrders: simulation.eligiblePurchaseOrders,
    payrollRuns: simulation.eligiblePayrollRuns,
  };

  const newBatch: ArchiveBatch = {
    id: batchId,
    batchNumber,
    title: batchTitle || `أرشفة مستندات مالية إلى تاريخ ${criteria.cutoffDate}`,
    createdAt: now.toISOString(),
    archivedBy: operatorName || 'مسؤول النظام (Admin)',
    cutoffDate: criteria.cutoffDate,
    fiscalPeriodId: criteria.fiscalPeriodId,
    fiscalPeriodName: criteria.fiscalPeriodName,
    notes: userNotes || 'تمت الأرشفة لتحسين سرعة وأداء النظام وتخفيف الحمل على البيانات النشطة.',
    totalDocumentsCount: simulation.totalEligibleCount,
    documentsByType: simulation.countsByType,
    totalFinancialVolumeInBase: simulation.totalFinancialVolumeInBase,
    estimatedSizeKb: Math.max(1, Math.round(simulation.estimatedBytesSaved / 1024)),
    status: 'ARCHIVED',
    payload,
  };

  // Filter out archived items from active data
  const archivedJeIds = new Set(simulation.eligibleJournalEntries.map((e) => e.id));
  const archivedInvIds = new Set(simulation.eligibleInvoices.map((e) => e.id));
  const archivedPvIds = new Set(simulation.eligiblePaymentVouchers.map((e) => e.id));
  const archivedPoIds = new Set(simulation.eligiblePosOrders.map((e) => e.id));
  const archivedSmIds = new Set(simulation.eligibleStockMovements.map((e) => e.id));
  const archivedPurchIds = new Set(simulation.eligiblePurchaseOrders.map((e) => e.id));
  const archivedPrIds = new Set(simulation.eligiblePayrollRuns.map((e) => e.id));

  const updatedActiveData = {
    journalEntries: activeData.journalEntries.filter((e) => !archivedJeIds.has(e.id)),
    invoices: activeData.invoices.filter((e) => !archivedInvIds.has(e.id)),
    paymentVouchers: activeData.paymentVouchers.filter((e) => !archivedPvIds.has(e.id)),
    posOrders: (activeData.posOrders || []).filter((e) => !archivedPoIds.has(e.id)),
    stockMovements: (activeData.stockMovements || []).filter((e) => !archivedSmIds.has(e.id)),
    purchaseOrders: (activeData.purchaseOrders || []).filter((e) => !archivedPurchIds.has(e.id)),
    payrollRuns: (activeData.payrollRuns || []).filter((e) => !archivedPrIds.has(e.id)),
  };

  return {
    newBatch,
    updatedActiveData,
  };
}

// Helper: Restore an Archive Batch back to Active Database
export function restoreArchiveBatch(
  batch: ArchiveBatch,
  operatorName: string,
  activeData: {
    journalEntries: JournalEntry[];
    invoices: Invoice[];
    paymentVouchers: PaymentVoucher[];
    posOrders: POSTransaction[];
    stockMovements: StockMovement[];
    purchaseOrders: PurchaseOrder[];
    payrollRuns: PayrollRun[];
  }
): {
  restoredBatch: ArchiveBatch;
  updatedActiveData: {
    journalEntries: JournalEntry[];
    invoices: Invoice[];
    paymentVouchers: PaymentVoucher[];
    posOrders: POSTransaction[];
    stockMovements: StockMovement[];
    purchaseOrders: PurchaseOrder[];
    payrollRuns: PayrollRun[];
  };
} {
  const existingJeIds = new Set(activeData.journalEntries.map((e) => e.id));
  const existingInvIds = new Set(activeData.invoices.map((e) => e.id));
  const existingPvIds = new Set(activeData.paymentVouchers.map((e) => e.id));
  const existingPoIds = new Set((activeData.posOrders || []).map((e) => e.id));
  const existingSmIds = new Set((activeData.stockMovements || []).map((e) => e.id));
  const existingPurchIds = new Set((activeData.purchaseOrders || []).map((e) => e.id));
  const existingPrIds = new Set((activeData.payrollRuns || []).map((e) => e.id));

  // Merge payload into active data avoiding duplicates
  const newJe = (batch.payload.journalEntries || []).filter((e) => !existingJeIds.has(e.id));
  const newInv = (batch.payload.invoices || []).filter((e) => !existingInvIds.has(e.id));
  const newPv = (batch.payload.paymentVouchers || []).filter((e) => !existingPvIds.has(e.id));
  const newPo = (batch.payload.posOrders || []).filter((e) => !existingPoIds.has(e.id));
  const newSm = (batch.payload.stockMovements || []).filter((e) => !existingSmIds.has(e.id));
  const newPurch = (batch.payload.purchaseOrders || []).filter((e) => !existingPurchIds.has(e.id));
  const newPr = (batch.payload.payrollRuns || []).filter((e) => !existingPrIds.has(e.id));

  const updatedActiveData = {
    journalEntries: [...newJe, ...activeData.journalEntries],
    invoices: [...newInv, ...activeData.invoices],
    paymentVouchers: [...newPv, ...activeData.paymentVouchers],
    posOrders: [...newPo, ...(activeData.posOrders || [])],
    stockMovements: [...newSm, ...(activeData.stockMovements || [])],
    purchaseOrders: [...newPurch, ...(activeData.purchaseOrders || [])],
    payrollRuns: [...newPr, ...(activeData.payrollRuns || [])],
  };

  const restoredBatch: ArchiveBatch = {
    ...batch,
    status: 'RESTORED',
    restoredAt: new Date().toISOString(),
    restoredBy: operatorName || 'مسؤول النظام (Admin)',
  };

  return {
    restoredBatch,
    updatedActiveData,
  };
}

// Download archive batch as standalone JSON file
export function downloadArchiveBatchAsJSON(batch: ArchiveBatch): void {
  const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(batch, null, 2));
  const downloadAnchor = document.createElement('a');
  downloadAnchor.setAttribute('href', dataStr);
  downloadAnchor.setAttribute('download', `${batch.batchNumber}_${batch.title.replace(/\s+/g, '_')}.json`);
  document.body.appendChild(downloadAnchor);
  downloadAnchor.click();
  downloadAnchor.remove();
}
