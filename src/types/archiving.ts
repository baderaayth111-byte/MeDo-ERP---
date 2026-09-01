import {
  JournalEntry,
  Invoice,
  PaymentVoucher,
  StockMovement,
  POSTransaction,
  PurchaseOrder,
  PayrollRun,
} from './accounting';

export type ArchiveDocumentType =
  | 'JOURNAL_ENTRY'
  | 'INVOICE'
  | 'PAYMENT_VOUCHER'
  | 'POS_ORDER'
  | 'STOCK_MOVEMENT'
  | 'PURCHASE_ORDER'
  | 'PAYROLL_RUN';

export interface ArchiveDocumentTypeConfig {
  type: ArchiveDocumentType;
  labelAr: string;
  labelEn: string;
  description: string;
  iconName: string;
  color: string;
}

export interface ArchiveFilterCriteria {
  cutoffDate: string; // YYYY-MM-DD - archive items on or before this date
  fiscalPeriodId?: string; // Optional: Link to a specific closed fiscal period
  fiscalPeriodName?: string;
  selectedTypes: ArchiveDocumentType[];
  onlyClosedAndSettled: boolean; // Only PAID invoices, POSTED journal entries, COMPLETED vouchers
  notes?: string;
}

export interface ArchivePayload {
  journalEntries: JournalEntry[];
  invoices: Invoice[];
  paymentVouchers: PaymentVoucher[];
  posOrders: POSTransaction[];
  stockMovements: StockMovement[];
  purchaseOrders: PurchaseOrder[];
  payrollRuns: PayrollRun[];
}

export interface ArchiveBatch {
  id: string;
  batchNumber: string; // e.g. "ARCH-2026-001"
  title: string;
  createdAt: string; // ISO Timestamp
  archivedBy: string;
  cutoffDate: string;
  fiscalPeriodId?: string;
  fiscalPeriodName?: string;
  notes?: string;
  totalDocumentsCount: number;
  documentsByType: Record<ArchiveDocumentType, number>;
  totalFinancialVolumeInBase: number; // in YER
  estimatedSizeKb: number;
  status: 'ARCHIVED' | 'RESTORED' | 'PARTIALLY_RESTORED';
  restoredAt?: string;
  restoredBy?: string;
  payload: ArchivePayload;
}

export interface ArchiveSimulationResult {
  eligibleJournalEntries: JournalEntry[];
  eligibleInvoices: Invoice[];
  eligiblePaymentVouchers: PaymentVoucher[];
  eligiblePosOrders: POSTransaction[];
  eligibleStockMovements: StockMovement[];
  eligiblePurchaseOrders: PurchaseOrder[];
  eligiblePayrollRuns: PayrollRun[];
  countsByType: Record<ArchiveDocumentType, number>;
  totalEligibleCount: number;
  totalFinancialVolumeInBase: number;
  estimatedBytesSaved: number;
  cutoffDate: string;
}

export interface ArchivingPolicy {
  autoArchiveEnabled: boolean;
  retentionPeriodMonths: number;
  alertThresholdRecords: number;
  protectUnsettledDocuments: boolean;
  requireApprovalForRestoration: boolean;
  lastRunDate?: string;
}
