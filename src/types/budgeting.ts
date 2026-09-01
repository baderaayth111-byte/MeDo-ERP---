import { AccountType, Currency } from './accounting';

export type BudgetPeriod = 'FULL_YEAR' | 'Q1' | 'Q2' | 'Q3' | 'Q4' | 'M01' | 'M02' | 'M03' | 'M04' | 'M05' | 'M06' | 'M07' | 'M08' | 'M09' | 'M10' | 'M11' | 'M12';

export type BudgetScenarioStatus = 'DRAFT' | 'APPROVED' | 'ACTIVE' | 'ARCHIVED';

export interface QuarterlyBudgetBreakdown {
  q1: number;
  q2: number;
  q3: number;
  q4: number;
}

export interface MonthlyBudgetBreakdown {
  m1: number;
  m2: number;
  m3: number;
  m4: number;
  m5: number;
  m6: number;
  m7: number;
  m8: number;
  m9: number;
  m10: number;
  m11: number;
  m12: number;
}

export interface BudgetItem {
  id: string;
  accountCode: string;
  accountNameAr: string;
  accountNameEn: string;
  accountType: AccountType;
  category: string;
  parentCode?: string;
  annualBudget: number; // In base currency YER
  quarterly: QuarterlyBudgetBreakdown;
  monthly?: MonthlyBudgetBreakdown;
  costCenterId?: string;
  notes?: string;
  warningThresholdPercent?: number; // e.g. 80%
  criticalThresholdPercent?: number; // e.g. 100%
  updatedAt?: string;
  updatedBy?: string;
}

export interface BudgetAuditLog {
  id: string;
  timestamp: string;
  user: string;
  userRole?: string;
  action: 'CREATE' | 'UPDATE' | 'APPROVE' | 'IMPORT_EXCEL' | 'AUTO_DISTRIBUTE' | 'ROLLOVER';
  description: string;
  affectedAccountsCount?: number;
  totalBudgetChange?: number;
}

export interface BudgetScenario {
  id: string;
  fiscalYear: number;
  code: string; // e.g. "BUD-2026-V1"
  nameAr: string;
  nameEn: string;
  version: number;
  status: BudgetScenarioStatus;
  baseCurrency: Currency;
  totalRevenueBudget: number;
  totalExpenseBudget: number;
  netBudgetedProfit: number;
  totalCapexBudget: number;
  items: BudgetItem[];
  auditHistory: BudgetAuditLog[];
  approvedBy?: string;
  approvedAt?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export type VarianceStatus = 'FAVORABLE' | 'UNFAVORABLE' | 'ON_TRACK' | 'WARNING' | 'CRITICAL' | 'OVER_BUDGET';

export interface BudgetVarianceRecord {
  accountCode: string;
  accountNameAr: string;
  accountNameEn: string;
  accountType: AccountType;
  category: string;
  budgetAmount: number;
  actualAmount: number;
  varianceAmount: number; // Difference in amount
  variancePercentage: number; // % variance from budget
  completionRate: number; // Actual / Budget * 100
  isFavorable: boolean; // True if revenue actual > budget OR expense actual < budget
  status: VarianceStatus;
  statusLabelAr: string;
  statusColor: string; // Tailwind color class
  warningThreshold: number;
  criticalThreshold: number;
  isWarning: boolean;
  isOverBudget: boolean;
}

export interface BudgetAlertConfig {
  warningThresholdPercent: number; // Default 80
  criticalThresholdPercent: number; // Default 100
  notifyFinanceManager: boolean;
  notifyGeneralManager: boolean;
  notifySystemAdmin: boolean;
  notifyViaWhatsApp: boolean;
  whatsappRecipientNumber: string;
  autoDispatchInternalNotifications: boolean;
  alertOnExpenseOverrun: boolean;
  alertOnRevenueShortfall: boolean;
}

export interface BudgetAlertItem {
  id: string;
  accountCode: string;
  accountNameAr: string;
  accountType: AccountType;
  budgetAmount: number;
  actualAmount: number;
  usagePercentage: number;
  severity: 'WARNING' | 'CRITICAL' | 'OVER_BUDGET';
  messageAr: string;
  timestamp: string;
  acknowledged: boolean;
}
