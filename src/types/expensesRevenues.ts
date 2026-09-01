import { Currency } from './accounting';

export type ExpenseCategoryType = 'ADMINISTRATIVE' | 'OPERATIONAL' | 'MARKETING' | 'CAPITAL' | 'OTHER';
export type RevenueCategoryType = 'OPERATING' | 'RENTAL' | 'INVESTMENT' | 'NON_OPERATING' | 'OTHER';

export type DailyExpenseType = 
  | 'PETTY_CASH'           // نثريات عامة ومصاريف نثرية
  | 'HOSPITALITY'          // بوفيه وضيافة واستقبال
  | 'TRANSPORT_FUEL'       // مواصلات وبترول وانتقالات
  | 'OFFICE_SUPPLIES'      // قرطاسية ومطبوعات وأدوات مكتبية
  | 'EMERGENCY_MAINTENANCE'// صيانة طارئة وقطع غيار سريعة
  | 'COMMUNICATION'        // رصيد اتصالات وإنترنت طارئ
  | 'CLEANING'             // نظافة ومستلزمات بيئية
  | 'OTHER';               // مصاريف يومية أخرى

export interface ExpenseDepartment {
  id: string;
  code: string;
  nameAr: string;
  nameEn: string;
  managerName: string;
  managerPhone?: string;
  allocatedMonthlyBudget: number;
  allocatedAnnualBudget: number;
  spentYTD: number;
  spentThisMonth: number;
  headCount?: number;
  color: string;
  description?: string;
  isActive: boolean;
}

export interface DailyExpenseItem {
  id: string;
  date: string;
  time?: string;
  voucherNumber: string;
  type: DailyExpenseType;
  departmentId: string;
  departmentName: string;
  categoryId: string;
  categoryName: string;
  title: string;
  description: string;
  amount: number;
  currency: Currency;
  exchangeRate: number;
  amountInBase: number;
  beneficiary: string;
  pettyCashAccountCode: string; // 1111 (الصندوق الرئيسي) أو 1111-02 (صندوق النثريات)
  pettyCashAccountName: string;
  expenseAccountCode: string;
  expenseAccountName: string;
  costCenterId?: string;
  receiptNumber?: string;
  paidBy: string;
  status: VoucherWorkflowStatus;
  notes?: string;
  createdAt: string;
}

export interface ExpenseCategory {
  id: string;
  code: string;
  nameAr: string;
  nameEn: string;
  type: ExpenseCategoryType;
  defaultAccountCode: string;
  defaultAccountName: string;
  budgetAnnual: number;
  spentYTD: number;
  description: string;
  iconName?: string;
  color?: string;
  isActive: boolean;
}

export interface RevenueCategory {
  id: string;
  code: string;
  nameAr: string;
  nameEn: string;
  type: RevenueCategoryType;
  defaultAccountCode: string;
  defaultAccountName: string;
  targetAnnual: number;
  collectedYTD: number;
  description: string;
  iconName?: string;
  color?: string;
  isActive: boolean;
}

export type VoucherWorkflowStatus = 
  | 'DRAFT'              // مسودة
  | 'PENDING_APPROVAL'  // بانتظار اعتماد المدير المالي (Dual Control)
  | 'APPROVED'          // معتمد ومصرح للصرف/القبض
  | 'REJECTED'          // مرفوض مع ذكر السبب
  | 'POSTED'            // مرحل مالياً للأستاذ العام ومسدد/مقبوض
  | 'CANCELLED';        // ملغي

export interface VoucherComment {
  id: string;
  authorId: string;
  authorName: string;
  authorRole: string;
  text: string;
  createdAt: string;
  type?: 'COMMENT' | 'APPROVAL_NOTE' | 'REJECTION_NOTE';
}

export interface DualControlVoucher {
  id: string;
  voucherNumber: string; // e.g. PV-2026-00101 or RV-2026-00085
  type: 'PAYMENT' | 'RECEIPT'; // صرف أو قبض
  categoryType: 'EXPENSE' | 'REVENUE';
  categoryId: string;
  categoryName: string;
  date: string;
  beneficiaryOrPayer: string; // المستفيد أو المستلم منه
  beneficiaryPhone?: string;
  accountCode: string; // حساب المصروف أو الإيراد في الأستاذ العام
  accountName: string;
  amount: number;
  currency: Currency;
  exchangeRate: number;
  amountInBase: number;
  paymentMethod: 'CASH' | 'BANK_TRANSFER' | 'CHEQUE';
  treasuryOrBankCode: string; // 1111 (صندوق) أو 1112 (بنك التضامن) أو 1113 (بنك YKB)
  treasuryOrBankName: string;
  referenceNumber: string; // رقم الشيك أو إشعار التحويل البنكي
  checkOrTransferDate?: string;
  bankName?: string;
  costCenterId?: string;
  costCenterName?: string;
  departmentId?: string;
  departmentName?: string;
  isDailyExpense?: boolean;
  dailyExpenseType?: DailyExpenseType;
  description: string;
  attachments?: string[];
  workflowStatus: VoucherWorkflowStatus;
  
  // Dual Control Governance (الرقابة المزدوجة)
  createdBy: {
    id: string;
    name: string;
    email: string;
    role: string;
  };
  createdAt: string;
  
  approvedBy?: {
    id: string;
    name: string;
    email: string;
    role: string;
  };
  approvedAt?: string;
  approvalNotes?: string;
  
  rejectedBy?: {
    id: string;
    name: string;
    email: string;
    role: string;
  };
  rejectedAt?: string;
  rejectionReason?: string;
  
  journalEntryId?: string;
  comments: VoucherComment[];
  notes?: string;
}
