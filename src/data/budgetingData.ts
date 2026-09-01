import { 
  BudgetScenario, 
  BudgetItem, 
  BudgetAuditLog, 
  BudgetAlertConfig, 
  BudgetVarianceRecord, 
  BudgetPeriod,
  BudgetAlertItem
} from '../types/budgeting';
import { Account, JournalEntry, AccountType } from '../types/accounting';
import { initialAccounts } from './initialData';
import { loadFromStorage, saveToStorage } from './persistence';

const BUDGET_SCENARIOS_STORAGE_KEY = 'medo_erp_budget_scenarios_v1';
const BUDGET_ALERT_CONFIG_STORAGE_KEY = 'medo_erp_budget_alert_config_v1';

export const defaultBudgetAlertConfig: BudgetAlertConfig = {
  warningThresholdPercent: 80,
  criticalThresholdPercent: 100,
  notifyFinanceManager: true,
  notifyGeneralManager: true,
  notifySystemAdmin: true,
  notifyViaWhatsApp: true,
  whatsappRecipientNumber: '+967 777 123456',
  autoDispatchInternalNotifications: true,
  alertOnExpenseOverrun: true,
  alertOnRevenueShortfall: true,
};

// Generate default items from Chart of Accounts
export const generateDefaultBudgetItems = (accounts: Account[], multiplier: number = 1.0): BudgetItem[] => {
  return accounts.map(acc => {
    let annualBudget = 0;

    // Set reasonable default budgets based on account types and current balances
    if (acc.type === 'REVENUE') {
      if (acc.code === '4100') annualBudget = 280000000 * multiplier; // Core sales
      else if (acc.code === '4200') annualBudget = 35000000 * multiplier; // Services
      else if (acc.code === '4300') annualBudget = 6000000 * multiplier; // Other
      else if (acc.code === '4000') annualBudget = 321000000 * multiplier; // Total Revenue parent
      else annualBudget = Math.round((acc.balance * 1.15) * multiplier);
    } else if (acc.type === 'EXPENSE') {
      if (acc.code === '5100') annualBudget = 120000000 * multiplier; // COGS
      else if (acc.code === '5200') annualBudget = 45000000 * multiplier; // G&A
      else if (acc.code === '5210') annualBudget = 30000000 * multiplier; // Salaries
      else if (acc.code === '5220') annualBudget = 9000000 * multiplier; // Rent
      else if (acc.code === '5230') annualBudget = 6500000 * multiplier; // Maintenance
      else if (acc.code === '5300') annualBudget = 14000000 * multiplier; // Marketing
      else if (acc.code === '5400') annualBudget = 9000000 * multiplier; // Depreciation
      else if (acc.code === '5000') annualBudget = 188000000 * multiplier; // Total expense parent
      else annualBudget = Math.round((acc.balance * 1.1) * multiplier);
    } else if (acc.type === 'ASSET' && acc.level > 1) {
      if (acc.code === '1130') annualBudget = 65000000 * multiplier; // Target Inventory
      else if (acc.code === '1200' || acc.code === '1210' || acc.code === '1220') annualBudget = 50000000 * multiplier; // CapEx
      else annualBudget = Math.round(acc.balance * multiplier);
    } else {
      annualBudget = Math.round(acc.balance * multiplier);
    }

    const q1 = Math.round(annualBudget * 0.25);
    const q2 = Math.round(annualBudget * 0.25);
    const q3 = Math.round(annualBudget * 0.25);
    const q4 = annualBudget - (q1 + q2 + q3);

    return {
      id: `bud-item-${acc.code}`,
      accountCode: acc.code,
      accountNameAr: acc.nameAr,
      accountNameEn: acc.nameEn,
      accountType: acc.type,
      category: acc.category,
      parentCode: acc.parentCode,
      annualBudget: annualBudget,
      quarterly: { q1, q2, q3, q4 },
      warningThresholdPercent: 80,
      criticalThresholdPercent: 100,
      updatedAt: '2026-01-05T09:00:00Z',
      updatedBy: 'ميدو تك للحلول البرمجية (مدير النظام)',
    };
  });
};

export const initialBudgetScenarios: BudgetScenario[] = [
  {
    id: 'BUD-SCEN-2026-01',
    fiscalYear: 2026,
    code: 'BUD-2026-MAIN',
    nameAr: 'الموازنة التقديرية التشغيلية المعتمدة - 2026',
    nameEn: 'Approved Operational Budget 2026',
    version: 1,
    status: 'ACTIVE',
    baseCurrency: 'YER',
    totalRevenueBudget: 321000000,
    totalExpenseBudget: 188000000,
    netBudgetedProfit: 133000000,
    totalCapexBudget: 50000000,
    items: generateDefaultBudgetItems(initialAccounts, 1.0),
    auditHistory: [
      {
        id: 'aud-001',
        timestamp: '2026-01-02T10:30:00Z',
        user: 'ميدو تك للحلول البرمجية',
        userRole: 'مدير النظام',
        action: 'CREATE',
        description: 'إنشاء مسودة الموازنة التقديرية للسنة المالية 2026 بناءً على خطة الأداء الاستراتيجي',
        affectedAccountsCount: 22,
      },
      {
        id: 'aud-002',
        timestamp: '2026-01-05T14:15:00Z',
        user: 'د. خالد العمري',
        userRole: 'المدير المالي',
        action: 'APPROVE',
        description: 'اعتماد الموازنة رسمياً من مجلس الإدارة وتفعيل حدود الرقابة والإنفاق الذكي',
        affectedAccountsCount: 22,
      }
    ],
    approvedBy: 'د. خالد العمري (المدير المالي)',
    approvedAt: '2026-01-05T14:15:00Z',
    notes: 'الموازنة الرئيسية المعتمدة لمجموعة المروج الدولية وفق أسس التوسع المالي والتحفظ الرقابي في ضبط النفقات.',
    createdAt: '2026-01-02T10:30:00Z',
    updatedAt: '2026-01-05T14:15:00Z',
  },
  {
    id: 'BUD-SCEN-2027-01',
    fiscalYear: 2027,
    code: 'BUD-2027-PLAN',
    nameAr: 'الخطة التقديرية والتوسعية المستهدفة - 2027',
    nameEn: 'Targeted Growth & Expansion Plan 2027',
    version: 1,
    status: 'DRAFT',
    baseCurrency: 'YER',
    totalRevenueBudget: 385000000,
    totalExpenseBudget: 215000000,
    netBudgetedProfit: 170000000,
    totalCapexBudget: 65000000,
    items: generateDefaultBudgetItems(initialAccounts, 1.2),
    auditHistory: [
      {
        id: 'aud-003',
        timestamp: '2026-08-15T11:00:00Z',
        user: 'ميدو تك للحلول البرمجية',
        userRole: 'مدير النظام',
        action: 'CREATE',
        description: 'إنشاء خطة موازنة أولية استرشادية لسنة 2027 مع افتراض نمو بنسبة 20%',
        affectedAccountsCount: 22,
      }
    ],
    notes: 'مسودة تقديرية أولية للسنة المالية القادمة 2027 قيد المراجعة والمناقشة من قبل لجنة التخطيط المالي.',
    createdAt: '2026-08-15T11:00:00Z',
    updatedAt: '2026-08-15T11:00:00Z',
  }
];

export const getLoadedBudgetScenarios = (): BudgetScenario[] => {
  return loadFromStorage(BUDGET_SCENARIOS_STORAGE_KEY, initialBudgetScenarios);
};

export const saveBudgetScenarios = (scenarios: BudgetScenario[]): void => {
  saveToStorage(BUDGET_SCENARIOS_STORAGE_KEY, scenarios);
};

export const getLoadedBudgetAlertConfig = (): BudgetAlertConfig => {
  return loadFromStorage(BUDGET_ALERT_CONFIG_STORAGE_KEY, defaultBudgetAlertConfig);
};

export const saveBudgetAlertConfig = (config: BudgetAlertConfig): void => {
  saveToStorage(BUDGET_ALERT_CONFIG_STORAGE_KEY, config);
};

// Calculate actuals for an account from Accounts and Journal Entries
export const calculateAccountActual = (
  accountCode: string,
  accounts: Account[],
  journalEntries: JournalEntry[],
  period: BudgetPeriod = 'FULL_YEAR',
  fiscalYear: number = 2026
): number => {
  const account = accounts.find(a => a.code === accountCode);
  if (!account) return 0;

  // If calculating for full year to date, base balance is the primary ledger balance
  if (period === 'FULL_YEAR') {
    return Math.abs(account.balance);
  }

  // Filter journal entries by period & year if specific quarter or month is selected
  let startMonth = 1;
  let endMonth = 12;

  if (period === 'Q1') { startMonth = 1; endMonth = 3; }
  else if (period === 'Q2') { startMonth = 4; endMonth = 6; }
  else if (period === 'Q3') { startMonth = 7; endMonth = 9; }
  else if (period === 'Q4') { startMonth = 10; endMonth = 12; }
  else if (period.startsWith('M')) {
    const mNum = parseInt(period.substring(1), 10);
    startMonth = mNum;
    endMonth = mNum;
  }

  // Calculate sum from journal entries in this period
  let periodSum = 0;
  let hasEntries = false;

  journalEntries.forEach(entry => {
    if (entry.status !== 'POSTED') return;
    const entryDate = new Date(entry.date);
    const entryYear = entryDate.getFullYear();
    const entryMonth = entryDate.getMonth() + 1;

    if (entryYear === fiscalYear && entryMonth >= startMonth && entryMonth <= endMonth) {
      entry.lines.forEach(line => {
        if (line.accountCode === accountCode) {
          hasEntries = true;
          if (account.type === 'REVENUE') {
            periodSum += (line.credit - line.debit) * (line.exchangeRate || 1);
          } else if (account.type === 'EXPENSE' || account.type === 'ASSET') {
            periodSum += (line.debit - line.credit) * (line.exchangeRate || 1);
          } else {
            periodSum += (line.credit - line.debit) * (line.exchangeRate || 1);
          }
        }
      });
    }
  });

  // If no granular entries exist for this specific slice, simulate realistic proportion of account balance
  if (!hasEntries || periodSum === 0) {
    if (period === 'Q1') return Math.round(Math.abs(account.balance) * 0.28);
    if (period === 'Q2') return Math.round(Math.abs(account.balance) * 0.26);
    if (period === 'Q3') return Math.round(Math.abs(account.balance) * 0.24);
    if (period === 'Q4') return Math.round(Math.abs(account.balance) * 0.22);
    if (period.startsWith('M')) return Math.round(Math.abs(account.balance) / 12);
  }

  return Math.abs(periodSum);
};

// Calculate Variance Records for a Given Scenario and Period
export const computeBudgetVariances = (
  scenario: BudgetScenario,
  accounts: Account[],
  journalEntries: JournalEntry[],
  period: BudgetPeriod = 'FULL_YEAR',
  filterType: 'ALL' | AccountType = 'ALL',
  alertConfig: BudgetAlertConfig = defaultBudgetAlertConfig
): BudgetVarianceRecord[] => {
  return scenario.items
    .filter(item => filterType === 'ALL' || item.accountType === filterType)
    .map(item => {
      // 1. Determine period budget amount
      let budgetAmount = item.annualBudget;
      if (period === 'Q1') budgetAmount = item.quarterly.q1;
      else if (period === 'Q2') budgetAmount = item.quarterly.q2;
      else if (period === 'Q3') budgetAmount = item.quarterly.q3;
      else if (period === 'Q4') budgetAmount = item.quarterly.q4;
      else if (period.startsWith('M')) {
        const mIdx = parseInt(period.substring(1), 10);
        if (item.monthly) {
          const key = `m${mIdx}` as keyof typeof item.monthly;
          budgetAmount = item.monthly[key] || Math.round(item.annualBudget / 12);
        } else {
          budgetAmount = Math.round(item.annualBudget / 12);
        }
      }

      // 2. Get actual amount
      const actualAmount = calculateAccountActual(
        item.accountCode,
        accounts,
        journalEntries,
        period,
        scenario.fiscalYear
      );

      // 3. Compute variance and completion rate
      // For Revenue: Variance = Actual - Budget (Positive is Good/Favorable)
      // For Expense: Variance = Budget - Actual (Positive is Good/Favorable, Negative is Over Budget)
      let varianceAmount = 0;
      let isFavorable = true;
      let completionRate = budgetAmount > 0 ? (actualAmount / budgetAmount) * 100 : 0;
      let variancePercentage = budgetAmount > 0 ? ((actualAmount - budgetAmount) / budgetAmount) * 100 : 0;

      const warningLimit = item.warningThresholdPercent || alertConfig.warningThresholdPercent || 80;
      const criticalLimit = item.criticalThresholdPercent || alertConfig.criticalThresholdPercent || 100;

      let status: BudgetVarianceRecord['status'] = 'ON_TRACK';
      let statusLabelAr = 'ضمن الخطة';
      let statusColor = 'text-emerald-700 bg-emerald-50 border-emerald-200';
      let isWarning = false;
      let isOverBudget = false;

      if (item.accountType === 'REVENUE') {
        varianceAmount = actualAmount - budgetAmount;
        isFavorable = actualAmount >= budgetAmount;
        if (completionRate >= 100) {
          status = 'FAVORABLE';
          statusLabelAr = 'تجاوز المستهدف (ممتاز)';
          statusColor = 'text-emerald-700 bg-emerald-50 border-emerald-300';
        } else if (completionRate >= 80) {
          status = 'ON_TRACK';
          statusLabelAr = 'أداء جيد ومقارب';
          statusColor = 'text-blue-700 bg-blue-50 border-blue-200';
        } else if (completionRate >= 60) {
          status = 'WARNING';
          statusLabelAr = 'تحت المستهدف (متأخر)';
          statusColor = 'text-amber-700 bg-amber-50 border-amber-300';
          isWarning = true;
        } else {
          status = 'UNFAVORABLE';
          statusLabelAr = 'عجز إيرادات حاد';
          statusColor = 'text-rose-700 bg-rose-50 border-rose-300';
          isWarning = true;
        }
      } else if (item.accountType === 'EXPENSE') {
        varianceAmount = budgetAmount - actualAmount; // Positive = savings, Negative = overrun
        isFavorable = actualAmount <= budgetAmount;

        if (completionRate >= criticalLimit) {
          status = 'OVER_BUDGET';
          statusLabelAr = 'تجاوز الموازنة (تحذير حرج)';
          statusColor = 'text-rose-700 bg-rose-50 border-rose-300';
          isOverBudget = true;
          isWarning = true;
        } else if (completionRate >= warningLimit) {
          status = 'WARNING';
          statusLabelAr = 'قارب على النفاد (تنبيه)';
          statusColor = 'text-amber-700 bg-amber-50 border-amber-300';
          isWarning = true;
        } else if (completionRate >= 50) {
          status = 'ON_TRACK';
          statusLabelAr = 'صرف منتظم ومقبول';
          statusColor = 'text-blue-700 bg-blue-50 border-blue-200';
        } else {
          status = 'FAVORABLE';
          statusLabelAr = 'وفر في المصروفات';
          statusColor = 'text-emerald-700 bg-emerald-50 border-emerald-200';
        }
      } else {
        varianceAmount = budgetAmount - actualAmount;
        isFavorable = Math.abs(varianceAmount) <= (budgetAmount * 0.1);
        status = 'ON_TRACK';
        statusLabelAr = 'مطابق للمعدل';
        statusColor = 'text-slate-700 bg-slate-50 border-slate-200';
      }

      return {
        accountCode: item.accountCode,
        accountNameAr: item.accountNameAr,
        accountNameEn: item.accountNameEn,
        accountType: item.accountType,
        category: item.category,
        budgetAmount,
        actualAmount,
        varianceAmount,
        variancePercentage,
        completionRate,
        isFavorable,
        status,
        statusLabelAr,
        statusColor,
        warningThreshold: warningLimit,
        criticalThreshold: criticalLimit,
        isWarning,
        isOverBudget,
      };
    });
};

// Scan and generate Active Budget Alerts
export const scanBudgetAlerts = (
  variances: BudgetVarianceRecord[],
  alertConfig: BudgetAlertConfig
): BudgetAlertItem[] => {
  const alerts: BudgetAlertItem[] = [];

  variances.forEach(v => {
    if (v.accountType === 'EXPENSE') {
      if (v.completionRate >= v.criticalThreshold && alertConfig.alertOnExpenseOverrun) {
        alerts.push({
          id: `alt-crit-${v.accountCode}-${Date.now()}`,
          accountCode: v.accountCode,
          accountNameAr: v.accountNameAr,
          accountType: v.accountType,
          budgetAmount: v.budgetAmount,
          actualAmount: v.actualAmount,
          usagePercentage: Math.round(v.completionRate),
          severity: 'OVER_BUDGET',
          messageAr: `تم تجاوز الموازنة المعتمدة لحساب (${v.accountNameAr} - ${v.accountCode}) حيث بلغت نسبة الصرف الفعلي ${v.completionRate.toFixed(1)}% بقيمة منصرفة ${v.actualAmount.toLocaleString()} ريال مقارنة بموازنة ${v.budgetAmount.toLocaleString()} ريال.`,
          timestamp: new Date().toISOString(),
          acknowledged: false,
        });
      } else if (v.completionRate >= v.warningThreshold && alertConfig.alertOnExpenseOverrun) {
        alerts.push({
          id: `alt-warn-${v.accountCode}-${Date.now()}`,
          accountCode: v.accountCode,
          accountNameAr: v.accountNameAr,
          accountType: v.accountType,
          budgetAmount: v.budgetAmount,
          actualAmount: v.actualAmount,
          usagePercentage: Math.round(v.completionRate),
          severity: 'WARNING',
          messageAr: `اقتراب استنفاد موازنة حساب (${v.accountNameAr} - ${v.accountCode})؛ بلغت نسبة الصرف ${v.completionRate.toFixed(1)}% (تجاوزت حد التنبيه ${v.warningThreshold}%).`,
          timestamp: new Date().toISOString(),
          acknowledged: false,
        });
      }
    } else if (v.accountType === 'REVENUE' && alertConfig.alertOnRevenueShortfall) {
      if (v.completionRate < 60) {
        alerts.push({
          id: `alt-rev-${v.accountCode}-${Date.now()}`,
          accountCode: v.accountCode,
          accountNameAr: v.accountNameAr,
          accountType: v.accountType,
          budgetAmount: v.budgetAmount,
          actualAmount: v.actualAmount,
          usagePercentage: Math.round(v.completionRate),
          severity: 'WARNING',
          messageAr: `عجز في تحقيق إيرادات حساب (${v.accountNameAr} - ${v.accountCode})؛ لم يتحقق سوى ${v.completionRate.toFixed(1)}% من المستهدف التقديري حتى تاريخه.`,
          timestamp: new Date().toISOString(),
          acknowledged: false,
        });
      }
    }
  });

  return alerts;
};

// Generate Sample CSV Template for Excel Import
export const generateBudgetExcelTemplate = (scenario: BudgetScenario): string => {
  const headers = ['AccountCode', 'AccountNameAr', 'AccountType', 'Category', 'AnnualBudget', 'Q1_Budget', 'Q2_Budget', 'Q3_Budget', 'Q4_Budget', 'Notes'];
  const rows = scenario.items.map(item => [
    item.accountCode,
    `"${item.accountNameAr}"`,
    item.accountType,
    `"${item.category}"`,
    item.annualBudget,
    item.quarterly.q1,
    item.quarterly.q2,
    item.quarterly.q3,
    item.quarterly.q4,
    `"${item.notes || ''}"`
  ]);

  return [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
};

// Parse CSV Content from User File Upload
export const parseBudgetCsvContent = (
  csvText: string,
  existingScenario: BudgetScenario
): { updatedItems: BudgetItem[]; errors: string[] } => {
  const errors: string[] = [];
  const lines = csvText.split(/\r?\n/).filter(line => line.trim().length > 0);
  if (lines.length <= 1) {
    return { updatedItems: existingScenario.items, errors: ['الملف فارغ أو لا يحتوي على صفوف بيانات صالحة'] };
  }

  const itemsMap = new Map<string, BudgetItem>();
  existingScenario.items.forEach(i => itemsMap.set(i.accountCode, { ...i }));

  // Skip header line
  for (let i = 1; i < lines.length; i++) {
    const rawLine = lines[i];
    // Split by comma ignoring commas inside quotes
    const cols = rawLine.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/).map(c => c.replace(/^"|"$/g, '').trim());
    if (cols.length < 5) continue;

    const [accountCode, , , , annualStr, q1Str, q2Str, q3Str, q4Str, notes] = cols;
    const existing = itemsMap.get(accountCode);
    if (!existing) {
      errors.push(`السطر ${i + 1}: الحساب برقم (${accountCode}) غير موجود في دليل الحسابات`);
      continue;
    }

    const annualBudget = parseFloat(annualStr) || 0;
    const q1 = q1Str ? parseFloat(q1Str) : Math.round(annualBudget * 0.25);
    const q2 = q2Str ? parseFloat(q2Str) : Math.round(annualBudget * 0.25);
    const q3 = q3Str ? parseFloat(q3Str) : Math.round(annualBudget * 0.25);
    const q4 = q4Str ? parseFloat(q4Str) : (annualBudget - (q1 + q2 + q3));

    itemsMap.set(accountCode, {
      ...existing,
      annualBudget,
      quarterly: { q1, q2, q3, q4 },
      notes: notes || existing.notes,
      updatedAt: new Date().toISOString(),
      updatedBy: 'استيراد من Excel / CSV',
    });
  }

  return {
    updatedItems: Array.from(itemsMap.values()),
    errors
  };
};
