import {
  Account,
  JournalEntry,
  Customer,
  Vendor,
  Invoice,
  PaymentVoucher,
  FixedAsset,
  CostCenter,
  ProfitCenter,
  InventoryItem,
  Warehouse,
  StockMovement,
  Employee,
  PayrollRun,
  LeaveRequest,
  AttendanceRecord,
  PurchaseRequisition,
  PurchaseOrder,
  GoodsReceiptNote,
  EInvoiceData,
  POSSession,
  POSTransaction,
} from '../types/accounting';

import {
  initialAccounts,
  initialJournalEntries,
  initialCustomers,
  initialVendors,
  initialInvoices,
  initialPaymentVouchers,
  initialFixedAssets,
  initialCostCenters,
  initialProfitCenters,
  initialBankAccounts,
} from './initialData';

import { initialWarehouses, initialStockMovements } from './inventoryData';
import { getLoadedInitialInventoryItems } from './inventoryLoader';
import {
  initialEmployees,
  initialPayrollRuns,
  initialLeaveRequests,
  initialAttendanceRecords,
  initialPurchaseRequisitions,
  initialPurchaseOrders,
  initialGoodsReceiptNotes,
  initialEInvoices,
  initialPosSessions,
  initialPosOrders,
} from './advancedModulesData';

// Storage Keys
export const STORAGE_KEYS = {
  EMPLOYEES: 'medo_erp_employees_v2',
  PAYROLL_RUNS: 'medo_erp_payroll_runs_v2',
  LEAVE_REQUESTS: 'medo_erp_leave_requests_v2',
  ATTENDANCE_RECORDS: 'medo_erp_attendance_records_v2',
  ACCOUNTS: 'medo_erp_accounts_v2',
  JOURNAL_ENTRIES: 'medo_erp_journal_entries_v2',
  CUSTOMERS: 'medo_erp_customers_v2',
  VENDORS: 'medo_erp_vendors_v2',
  INVOICES: 'medo_erp_invoices_v2',
  PAYMENT_VOUCHERS: 'medo_erp_payment_vouchers_v2',
  FIXED_ASSETS: 'medo_erp_fixed_assets_v2',
  COST_CENTERS: 'medo_erp_cost_centers_v2',
  PROFIT_CENTERS: 'medo_erp_profit_centers_v2',
  BANK_ACCOUNTS: 'medo_erp_bank_accounts_v2',
  INVENTORY_ITEMS: 'medo_erp_inventory_items_v2',
  WAREHOUSES: 'medo_erp_warehouses_v2',
  STOCK_MOVEMENTS: 'medo_erp_stock_movements_v2',
  POS_SESSIONS: 'medo_erp_pos_sessions_v2',
  POS_ORDERS: 'medo_erp_pos_orders_v2',
  PURCHASE_REQUISITIONS: 'medo_erp_purchase_requisitions_v2',
  PURCHASE_ORDERS: 'medo_erp_purchase_orders_v2',
  GOODS_RECEIPT_NOTES: 'medo_erp_goods_receipt_notes_v2',
  E_INVOICES: 'medo_erp_e_invoices_v2',
};

// Generic Safe Load
export function loadFromStorage<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    const parsed = JSON.parse(raw);
    if (Array.isArray(fallback) && !Array.isArray(parsed)) {
      return fallback;
    }
    return parsed as T;
  } catch (err) {
    console.warn(`[Storage] Failed to load key "${key}", using fallback:`, err);
    return fallback;
  }
}

// Generic Safe Save
export function saveToStorage<T>(key: string, data: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (err) {
    console.error(`[Storage] Failed to save key "${key}":`, err);
  }
}

// Specific Loaders with Default Fallbacks
export const getLoadedEmployees = (): Employee[] => loadFromStorage(STORAGE_KEYS.EMPLOYEES, initialEmployees);
export const getLoadedPayrollRuns = (): PayrollRun[] => loadFromStorage(STORAGE_KEYS.PAYROLL_RUNS, initialPayrollRuns);
export const getLoadedLeaveRequests = (): LeaveRequest[] => loadFromStorage(STORAGE_KEYS.LEAVE_REQUESTS, initialLeaveRequests);
export const getLoadedAttendanceRecords = (): AttendanceRecord[] => loadFromStorage(STORAGE_KEYS.ATTENDANCE_RECORDS, initialAttendanceRecords);

export const getLoadedAccounts = (): Account[] => loadFromStorage(STORAGE_KEYS.ACCOUNTS, initialAccounts);
export const getLoadedJournalEntries = (): JournalEntry[] => loadFromStorage(STORAGE_KEYS.JOURNAL_ENTRIES, initialJournalEntries);
export const getLoadedCustomers = (): Customer[] => {
  if (typeof window !== 'undefined' && (window.location.search.includes('clean_demo=true') || window.location.search.includes('clean_items=true'))) {
    return [];
  }
  return loadFromStorage(STORAGE_KEYS.CUSTOMERS, initialCustomers);
};
export const getLoadedVendors = (): Vendor[] => loadFromStorage(STORAGE_KEYS.VENDORS, initialVendors);
export const getLoadedInvoices = (): Invoice[] => loadFromStorage(STORAGE_KEYS.INVOICES, initialInvoices);
export const getLoadedPaymentVouchers = (): PaymentVoucher[] => loadFromStorage(STORAGE_KEYS.PAYMENT_VOUCHERS, initialPaymentVouchers);
export const getLoadedFixedAssets = (): FixedAsset[] => loadFromStorage(STORAGE_KEYS.FIXED_ASSETS, initialFixedAssets);
export const getLoadedCostCenters = (): CostCenter[] => loadFromStorage(STORAGE_KEYS.COST_CENTERS, initialCostCenters);
export const getLoadedProfitCenters = (): ProfitCenter[] => loadFromStorage(STORAGE_KEYS.PROFIT_CENTERS, initialProfitCenters);
export const getLoadedBankAccounts = () => loadFromStorage(STORAGE_KEYS.BANK_ACCOUNTS, initialBankAccounts);

export const getLoadedWarehouses = (): Warehouse[] => loadFromStorage(STORAGE_KEYS.WAREHOUSES, initialWarehouses);
export const getLoadedStockMovements = (): StockMovement[] => loadFromStorage(STORAGE_KEYS.STOCK_MOVEMENTS, initialStockMovements);
export const getLoadedInventoryItems = (): InventoryItem[] => {
  if (typeof window !== 'undefined' && (window.location.search.includes('clean_items=true') || window.location.search.includes('clean_demo=true'))) {
    return getLoadedInitialInventoryItems(); // This will return [] based on inventoryLoader logic
  }
  return loadFromStorage(STORAGE_KEYS.INVENTORY_ITEMS, getLoadedInitialInventoryItems());
};

export const getLoadedPosSessions = (): POSSession[] => loadFromStorage(STORAGE_KEYS.POS_SESSIONS, initialPosSessions);
export const getLoadedPosOrders = (): POSTransaction[] => loadFromStorage(STORAGE_KEYS.POS_ORDERS, initialPosOrders);

export const getLoadedPurchaseRequisitions = (): PurchaseRequisition[] => loadFromStorage(STORAGE_KEYS.PURCHASE_REQUISITIONS, initialPurchaseRequisitions);
export const getLoadedPurchaseOrders = (): PurchaseOrder[] => loadFromStorage(STORAGE_KEYS.PURCHASE_ORDERS, initialPurchaseOrders);
export const getLoadedGoodsReceiptNotes = (): GoodsReceiptNote[] => loadFromStorage(STORAGE_KEYS.GOODS_RECEIPT_NOTES, initialGoodsReceiptNotes);
export const getLoadedEInvoices = (): EInvoiceData[] => loadFromStorage(STORAGE_KEYS.E_INVOICES, initialEInvoices);

// Clear and reset all storage
export function resetAllStorageToDefaults(): void {
  try {
    Object.values(STORAGE_KEYS).forEach((key) => {
      localStorage.removeItem(key);
    });
  } catch (err) {
    console.error('[Storage] Error resetting storage:', err);
  }
}
