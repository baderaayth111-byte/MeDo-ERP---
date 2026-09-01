export type Currency = 'YER' | 'USD' | 'SAR';

export type AccountType = 'ASSET' | 'LIABILITY' | 'EQUITY' | 'REVENUE' | 'EXPENSE';

export interface Account {
  code: string;
  nameAr: string;
  nameEn: string;
  type: AccountType;
  category: string; // e.g. 'أصول متداولة', 'أصول غير متداولة', 'خصوم متداولة', 'حقوق ملكية'
  parentCode?: string;
  level: number;
  balance: number; // in base currency YER
  currency: Currency;
  isActive: boolean;
  description?: string;
}

export interface JournalEntryLine {
  id: string;
  accountCode: string;
  accountName: string;
  debit: number;
  credit: number;
  currency: Currency;
  exchangeRate: number; // rate to base currency
  amountInBase: number;
  costCenterId?: string;
  profitCenterId?: string;
  description: string;
}

export type EntryStatus = 'POSTED' | 'DRAFT' | 'REVERSED';

export type RecurringFrequency = 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'QUARTERLY' | 'SEMI_ANNUAL' | 'ANNUAL';
export type RecurringStatus = 'ACTIVE' | 'PAUSED' | 'EXPIRED' | 'COMPLETED';
export type RecurringCategory = 'RENT' | 'SALARY' | 'DEPRECIATION' | 'SUBSCRIPTION' | 'INSURANCE' | 'UTILITIES' | 'LOAN_INTEREST' | 'OTHER';

export interface RecurringJournalEntryTemplate {
  id: string;
  templateCode: string;
  templateName: string;
  category: RecurringCategory;
  description: string;
  frequency: RecurringFrequency;
  intervalDays?: number;
  executionDayOfMonth?: number;
  startDate: string;
  endDate?: string;
  nextRunDate: string;
  lastRunDate?: string;
  totalOccurrences?: number;
  executedOccurrences: number;
  status: RecurringStatus;
  autoPost: boolean;
  currency: Currency;
  exchangeRate?: number;
  lines: JournalEntryLine[];
  totalDebit: number;
  totalCredit: number;
  notes?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface JournalEntry {
  id: string;
  entryNumber: string;
  date: string; // YYYY-MM-DD
  hijriDate?: string;
  reference: string;
  description: string;
  lines: JournalEntryLine[];
  totalDebit: number;
  totalCredit: number;
  status: EntryStatus;
  attachments?: string[];
  createdBy: string;
  postedAt?: string;
  reversalOfId?: string;
  recurringTemplateId?: string;
  notes?: string;
  sync_timestamp?: string;
}

export interface Customer {
  id: string;
  code: string;
  nameAr: string;
  nameEn: string;
  taxNumber?: string;
  commercialRegister?: string;
  phone: string;
  email: string;
  city: string;
  address: string;
  currency: Currency;
  creditLimit: number;
  currentBalance: number;
  totalCollected?: number;
  totalOperations?: number;
  collectionRate?: number;
  status: 'ACTIVE' | 'BLOCKED' | 'SUSPENDED';
  notes?: string;
}

export interface Vendor {
  id: string;
  code: string;
  nameAr: string;
  nameEn: string;
  taxNumber?: string;
  phone: string;
  email: string;
  city: string;
  address?: string;
  bankName?: string;
  iban?: string;
  currency: Currency;
  currentBalance: number;
  totalPaid?: number;
  totalOperations?: number;
  paymentRate?: number;
  paymentTerms?: string;
  paymentTermsDays: number;
  status: 'ACTIVE' | 'BLOCKED';
  notes?: string;
}

export interface InvoiceItem {
  id: string;
  itemId?: string;
  itemCode?: string;
  barcode?: string;
  description: string;
  quantity: number;
  unit?: string;
  unitPrice: number;
  taxRate: number; // e.g. 5% or 0%
  taxAmount: number;
  subtotal: number;
  total: number;
  accountCode?: string;
  accountName?: string;
  costCenterId?: string;
  currentStock?: number;
}

export type InvoiceStatus = 'PAID' | 'PARTIAL' | 'UNPAID' | 'OVERDUE' | 'CANCELLED';

export type InvoiceType = 'CUSTOMER_INVOICE' | 'VENDOR_BILL' | 'SALES_RETURN' | 'PURCHASE_RETURN';

export interface Invoice {
  id: string;
  invoiceNumber: string;
  type: InvoiceType;
  entityId: string;
  entityName: string;
  date: string;
  dueDate: string;
  items: InvoiceItem[];
  subtotal: number;
  taxTotal: number;
  attachments?: string[];
  expensesAmount?: number;
  expensesDescription?: string;
  discountAmount?: number;
  grandTotal: number;
  paidAmount: number;
  remainingAmount: number;
  paymentMethod?: string; // 'CASH' | 'WALLET' | 'BANK_TRANSFER' | 'CREDIT' | 'CHEQUE' | 'SPLIT' | string
  walletName?: string; // 'جوالي (Jawwali)' | 'جيب (Jaib)' | 'فلوسك (Flousak)' | 'ون كاش (OneCash)' | 'موبايل موني (Mobile Money)' | 'كاش (Kash)' | string
  walletTransferRef?: string;
  exchangeNetworkName?: string; // 'صرافة الكريمي' | 'شبكة النجم' | 'شبكة الامتياز' | 'بنك التضامن' | 'بنك القطيبي' | 'الحزمي للصرافة' | 'الرائد للصرافة' | string
  exchangeTransferRef?: string;
  cashierName?: string;
  currency: Currency;
  exchangeRate: number;
  status: InvoiceStatus;
  notes?: string;
  referenceInvoiceNumber?: string;
  returnReason?: string;
  journalEntryId?: string;
  sync_timestamp?: string;
}

export interface PaymentVoucher {
  id: string;
  voucherNumber: string;
  type: 'RECEIPT' | 'PAYMENT'; // قبض أو صرف
  date: string;
  entityId: string;
  entityName: string;
  amount: number;
  currency: Currency;
  exchangeRate: number;
  amountInBase: number;
  paymentMethod: 'CASH' | 'BANK_TRANSFER' | 'CHEQUE';
  referenceNumber: string;
  debitAccountCode: string;
  creditAccountCode: string;
  costCenterId?: string;
  notes: string;
  status: 'COMPLETED' | 'CANCELLED';
  attachments?: string[];
  journalEntryId?: string;
  sync_timestamp?: string;
}

export type AssetCategory = 'BUILDINGS' | 'MACHINERY' | 'VEHICLES' | 'IT_EQUIPMENT' | 'FURNITURE';
export type DepreciationMethod = 'STRAIGHT_LINE' | 'DECLINING_BALANCE';

export interface FixedAsset {
  id: string;
  assetCode: string;
  nameAr: string;
  nameEn: string;
  category: AssetCategory;
  purchaseDate: string;
  purchaseCost: number;
  salvageValue: number;
  usefulLifeMonths: number;
  depreciationMethod: DepreciationMethod;
  accumulatedDepreciation: number;
  bookValue: number;
  costCenterId: string;
  assetAccountCode: string;
  depreciationExpenseAccountCode: string;
  accumulatedDepreciationAccountCode: string;
  status: 'ACTIVE' | 'DISPOSED' | 'FULLY_DEPRECIATED';
  lastDepreciationDate?: string;
  attachments?: string[];
}

export interface CostCenter {
  id: string;
  code: string;
  nameAr: string;
  nameEn: string;
  manager: string;
  department?: string;
  allocatedBudget: number;
  actualSpent: number;
  variance: number;
  budgetAnnual?: number;
  actualCostYTD?: number;
  currency?: Currency;
}

export interface ProfitCenter {
  id: string;
  code: string;
  nameAr: string;
  nameEn: string;
  manager?: string;
  segment?: string;
  totalRevenue: number;
  totalExpenses: number;
  netProfit: number;
  profitMargin: number;
  revenueTarget?: number;
  actualRevenue?: number;
  currency?: Currency;
}

export interface BankAccount {
  id: string;
  bankNameAr: string;
  bankNameEn: string;
  accountNumber: string;
  iban?: string;
  currency: Currency;
  accountCode: string;
  currentBalance: number;
  isActive: boolean;
}

export interface BankReconciliationItem {
  id: string;
  date: string;
  description: string;
  bankAmount: number;
  bookAmount: number;
  difference: number;
  status: 'MATCHED' | 'UNMATCHED' | 'DISCREPANCY';
  suggestedAction?: string;
}

export type ExchangeRateRegime = 'SANAA' | 'ADEN';

export interface CompanyProfile {
  nameAr: string;
  nameEn: string;
  taxNumber: string;
  commercialRegister: string;
  commercialRegistrationCity?: string;
  baseCurrency: Currency;
  exchangeRates: Record<Currency, number>; // YER to USD, SAR
  currentFiscalYear: number;
  exchangeRateRegime?: ExchangeRateRegime; // 'SANAA' (الرسمي) | 'ADEN' (السوق الموازي)
  sanaaExchangeRates?: { USD: number; SAR: number };
  adenExchangeRates?: { USD: number; SAR: number };
  phone: string;
  secondaryPhone?: string;
  mobile?: string;
  fax?: string;
  whatsapp?: string;
  email: string;
  financeEmail?: string;
  supportEmail?: string;
  website?: string;
  address: string;
  city: string;
  country: string;
  postalCode?: string;
  activityDescription?: string;
  logoUrl?: string;
  headerTagline?: string;
  footerNotes?: string;
  defaultVatRate?: number;
  accountingBasis?: 'ACCRUAL' | 'CASH';
}

export interface Branch {
  id: string;
  code: string;
  nameAr: string;
  nameEn: string;
  manager: string;
  phone: string;
  secondaryPhone?: string;
  email: string;
  city: string;
  address: string;
  isMain: boolean;
  isActive: boolean;
  warehouseId?: string;
  costCenterId?: string;
}

export interface CurrencyConfig {
  code: string;
  nameAr: string;
  nameEn: string;
  symbol: string;
  exchangeRate: number; // rate relative to base currency (YER = 1)
  fractionNameAr: string;
  isBase: boolean;
  isActive: boolean;
  decimalPlaces: number;
}

export interface FiscalPeriod {
  id: string;
  periodNumber: number;
  nameAr: string;
  startDate: string;
  endDate: string;
  status: 'OPEN' | 'CLOSED' | 'LOCKED';
}

export interface SystemModuleSetting {
  id: string;
  key: string;
  nameAr: string;
  nameEn: string;
  descriptionAr: string;
  tCode: string;
  category: 'FINANCIAL' | 'OPERATIONAL' | 'ANALYTICS' | 'SYSTEM';
  isEnabled: boolean;
  showInSidebar: boolean;
  order: number;
}

export interface FioriTile {
  id: string;
  titleAr: string;
  titleEn: string;
  subtitleAr: string;
  subtitleEn: string;
  category: string;
  iconName: string;
  kpiValue?: string;
  kpiTrend?: 'up' | 'down' | 'neutral';
  kpiTrendValue?: string;
  viewKey: string;
  badge?: string;
  tCode?: string;
}

export interface AIMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  suggestedEntry?: Partial<JournalEntry>;
  suggestedAction?: string;
}

// Inventory & Warehouse Management (MM / IM)
export interface Warehouse {
  id: string;
  code: string;
  nameAr: string;
  nameEn: string;
  location: string;
  manager: string;
  phone: string;
  capacityPercent: number;
  isActive: boolean;
  accountCode: string; // e.g. 1130
}

export interface InventoryItem {
  id: string;
  code: string;
  nameAr: string;
  nameEn?: string;
  salePrice: number;
  costPrice: number;
  quantity: number;
  unit: string;
  status: 'متوفر' | 'منخفض' | 'نفذت الكمية' | 'موقوف' | string;
  warehouseId: string;
  category: string;
  subCategory?: string;
  minStockLevel: number;
  maxStockLevel?: number;
  barcode?: string;
  lastUpdated?: string;
}

export type StockMovementType = 'GOODS_RECEIPT' | 'GOODS_ISSUE' | 'TRANSFER' | 'ADJUSTMENT';

export interface StockMovementLine {
  id: string;
  itemId: string;
  itemCode: string;
  itemName: string;
  quantity: number;
  unit: string;
  unitCost: number;
  totalCost: number;
}

export interface StockMovement {
  id: string;
  movementNumber: string; // e.g. MIGO-GR-2026-001 or MIGO-GI-2026-001
  type: StockMovementType;
  date: string;
  warehouseId: string;
  toWarehouseId?: string; // For transfers
  reference: string; // e.g. PO number, Sales Invoice, Delivery note
  description: string;
  lines: StockMovementLine[];
  totalAmount: number;
  status: 'POSTED' | 'DRAFT' | 'CANCELLED';
  createdBy: string;
  postedAt?: string;
  journalEntryId?: string;
  sync_timestamp?: string;
}

// -------------------------------------------------------------
// 1. POS & Retail Management (SD / POS)
// -------------------------------------------------------------
export type POSPaymentMethod = 'CASH' | 'CARD' | 'CREDIT' | 'TRANSFER' | 'SPLIT';

export interface POSCartItem {
  itemId: string;
  itemCode: string;
  nameAr: string;
  unit: string;
  unitPrice: number;
  costPrice: number;
  quantity: number;
  discountPercent: number;
  discountAmount: number;
  taxRate: number;
  taxAmount: number;
  total: number;
  barcode?: string;
}

export interface POSTransaction {
  id: string;
  receiptNumber: string;
  sessionId: string;
  cashierName: string;
  branchId: string;
  warehouseId: string;
  customerId?: string;
  customerName: string;
  date: string; // ISO date-time
  items: POSCartItem[];
  subtotal: number;
  discountTotal: number;
  taxTotal: number;
  attachments?: string[];
  grandTotal: number;
  amountPaid: number;
  changeDue: number;
  paymentMethod: POSPaymentMethod;
  paymentDetails?: {
    cashAmount?: number;
    cardAmount?: number;
    cardRef?: string;
    transferRef?: string;
    creditCustomerAccount?: string;
  };
  currency: Currency;
  type?: 'SALE' | 'RETURN';
  status: 'COMPLETED' | 'REFUNDED' | 'VOIDED';
  qrCodeData?: string;
  journalEntryId?: string;
  notes?: string;
  sync_timestamp?: string;
}

export interface POSSession {
  id: string;
  sessionNumber: string;
  cashierName: string;
  posTerminalName: string;
  branchId: string;
  warehouseId: string;
  openedAt: string;
  closedAt?: string;
  openingCash: number;
  closingCashActual?: number;
  closingCashExpected?: number;
  cashDifference?: number;
  totalSalesCash: number;
  totalSalesCard: number;
  totalSalesCredit: number;
  totalSalesTransfer: number;
  totalTransactionsCount: number;
  totalDiscounts: number;
  totalTax: number;
  totalGrossRevenue: number;
  status: 'OPEN' | 'CLOSED';
  notes?: string;
}

// -------------------------------------------------------------
// 2. HR & Payroll Management (HCM / PY)
// -------------------------------------------------------------
export type EmployeeContractType = 'FULL_TIME' | 'PART_TIME' | 'CONTRACT' | 'PROBATION';
export type EmployeeStatus = 'ACTIVE' | 'ON_LEAVE' | 'RESIGNED' | 'TERMINATED';

export interface Employee {
  id: string;
  employeeCode: string;
  nationalIdOrIqama: string;
  firstNameAr: string;
  lastNameAr: string;
  fullNameEn: string;
  gender: 'MALE' | 'FEMALE';
  nationality: string;
  jobTitle: string;
  department: string;
  costCenterId: string;
  branchId: string;
  joinDate: string;
  phone: string;
  email: string;
  contractType: EmployeeContractType;
  status: EmployeeStatus;
  
  // Salary Structure
  basicSalary: number;
  housingAllowance: number;
  transportAllowance: number;
  foodAllowance: number;
  otherAllowances: number;
  gosiDeductionPct: number; // Social insurance e.g. 9% employee
  gosiCompanyContributionPct: number; // e.g. 11% company
  taxDeductionPct: number;
  
  // Bank Info
  bankName: string;
  ibanOrAccountNumber: string;
  
  // Leave balances (days)
  annualLeaveBalance: number;
  sickLeaveBalance: number;
  emergencyLeaveBalance: number;
}

export interface LeaveRequest {
  id: string;
  employeeId: string;
  employeeName: string;
  employeeCode: string;
  type: 'ANNUAL' | 'SICK' | 'UNPAID' | 'EMERGENCY' | 'MATERNITY' | 'HAJJ';
  startDate: string;
  endDate: string;
  daysCount: number;
  reason: string;
  status: 'APPROVED' | 'PENDING' | 'REJECTED';
  approvedBy?: string;
  appliedDate: string;
}

export interface AttendanceRecord {
  id: string;
  employeeId: string;
  employeeName: string;
  date: string;
  checkIn: string; // HH:mm
  checkOut: string; // HH:mm
  workHours: number;
  overtimeHours: number;
  status: 'PRESENT' | 'ABSENT' | 'LATE' | 'ON_LEAVE';
  notes?: string;
}

export interface Payslip {
  id: string;
  employeeId: string;
  employeeCode: string;
  employeeName: string;
  jobTitle: string;
  department: string;
  costCenterId: string;
  bankName: string;
  iban: string;
  month: number; // 1-12
  year: number;
  
  // Earnings
  basicSalary: number;
  housingAllowance: number;
  transportAllowance: number;
  foodAllowance: number;
  overtimeAmount: number;
  bonuses: number;
  grossSalary: number;
  
  // Deductions
  gosiEmployeeDeduction: number;
  incomeTaxDeduction: number;
  advancesAndLoansDeduction: number;
  absenceAndPenaltiesDeduction: number;
  totalDeductions: number;
  
  // Net
  netSalary: number;
  
  // Company Side
  gosiCompanyContribution: number;
  
  status: 'DRAFT' | 'APPROVED' | 'PAID';
  paymentDate?: string;
}

export interface PayrollRun {
  id: string;
  payrollNumber: string; // e.g. PAY-2026-04
  month: number;
  year: number;
  periodName: string;
  dateProcessed: string;
  totalEmployees: number;
  totalGrossAmount: number;
  totalDeductionsAmount: number;
  totalNetAmount: number;
  totalCompanyContributions: number;
  currency: Currency;
  status: 'DRAFT' | 'REVIEWED' | 'POSTED_TO_GL';
  payslips: Payslip[];
  journalEntryId?: string;
  postedBy?: string;
  postedAt?: string;
}

// -------------------------------------------------------------
// 3. Procurement & Purchase Orders (MM / PUR)
// -------------------------------------------------------------
export type PRStatus = 'DRAFT' | 'SUBMITTED' | 'APPROVED' | 'REJECTED' | 'ORDERED';
export type POStatus = 'DRAFT' | 'ISSUED' | 'PARTIALLY_RECEIVED' | 'COMPLETED' | 'CANCELLED';

export interface PRLineItem {
  id: string;
  itemId?: string;
  itemCode?: string;
  description: string;
  quantity: number;
  unit: string;
  estimatedUnitPrice: number;
  estimatedTotal: number;
  requiredDate: string;
}

export interface PurchaseRequisition {
  id: string;
  prNumber: string; // PR-2026-001
  department: string;
  costCenterId: string;
  requesterName: string;
  requestDate: string;
  requiredDate: string;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  purpose: string;
  items: PRLineItem[];
  totalEstimatedAmount: number;
  currency: Currency;
  status: PRStatus;
  approvedBy?: string;
  notes?: string;
  sync_timestamp?: string;
}

export interface POLineItem {
  id: string;
  itemId?: string;
  itemCode: string;
  description: string;
  quantity: number;
  receivedQuantity: number;
  unit: string;
  unitPrice: number;
  discountPercent: number;
  taxRate: number;
  taxAmount: number;
  subtotal: number;
  total: number;
}

export interface PurchaseOrder {
  id: string;
  poNumber: string; // PO-2026-001
  vendorId: string;
  vendorName: string;
  vendorTaxNumber?: string;
  vendorPhone?: string;
  date: string;
  expectedDeliveryDate: string;
  paymentTerms: string;
  warehouseId: string;
  branchId: string;
  costCenterId?: string;
  prReference?: string;
  items: POLineItem[];
  subtotal: number;
  discountTotal: number;
  taxTotal: number;
  attachments?: string[];
  grandTotal: number;
  currency: Currency;
  status: POStatus;
  shippingAddress: string;
  notes?: string;
  goodsReceiptIds?: string[];
  invoiceId?: string;
  createdBy: string;
  sync_timestamp?: string;
}

export interface GoodsReceiptNote {
  id: string;
  grnNumber: string; // GRN-2026-001
  poId: string;
  poNumber: string;
  vendorId: string;
  vendorName: string;
  warehouseId: string;
  deliveryNoteNumber: string;
  date: string;
  receivedBy: string;
  items: {
    itemId: string;
    itemCode: string;
    itemName: string;
    orderedQty: number;
    receivedQty: number;
    unit: string;
    unitCost: number;
    totalCost: number;
  }[];
  totalAmount: number;
  status: 'ACCEPTED' | 'REJECTED' | 'PARTIAL';
  stockMovementId?: string;
  notes?: string;
}

// -------------------------------------------------------------
// 4. E-Invoicing & ZATCA QR Code (E-Invoice)
// -------------------------------------------------------------
export type EInvoiceType = 'TAX_INVOICE_B2B' | 'SIMPLIFIED_B2C' | 'CREDIT_NOTE' | 'DEBIT_NOTE';

export interface EInvoiceData {
  id: string;
  invoiceNumber: string;
  uuid: string;
  type: EInvoiceType;
  issueDate: string; // YYYY-MM-DD
  issueTime: string; // HH:mm:ss
  sellerName: string;
  sellerTaxNumber: string;
  sellerCommercialRegister: string;
  sellerAddress: string;
  sellerCity: string;
  buyerName: string;
  buyerTaxNumber?: string;
  buyerCommercialRegister?: string;
  buyerAddress?: string;
  buyerCity?: string;
  items: {
    name: string;
    quantity: number;
    unitPrice: number;
    vatRate: number;
    vatAmount: number;
    totalWithVat: number;
  }[];
  totalTaxExclusive: number;
  totalTaxAmount: number;
  totalTaxInclusive: number;
  currency: Currency;
  tlvQrBase64: string;
  cryptographicStamp: string;
  previousInvoiceHash?: string;
  zatcaStatus: 'REPORTED' | 'CLEARED' | 'PENDING' | 'OFFLINE';
  complianceStatus: 'VALID' | 'WARNING' | 'NON_COMPLIANT';
}

// -------------------------------------------------------------
// 5. Voice Assistant & Smart Commands
// -------------------------------------------------------------
export interface VoiceCommandAction {
  type: 'NAVIGATE' | 'CREATE_ENTRY' | 'QUERY_BALANCE' | 'GENERATE_REPORT' | 'POS_ACTION' | 'HR_ACTION';
  targetModule?: string;
  payload?: any;
  confidenceScore: number;
  confirmationRequired?: boolean;
}

// -------------------------------------------------------------
// 6. Automated WhatsApp Due Date Reminders & Scheduling (AR)
// -------------------------------------------------------------
export type ReminderTriggerType = 
  | 'BEFORE_DUE_7_DAYS'
  | 'BEFORE_DUE_3_DAYS'
  | 'BEFORE_DUE_1_DAY'
  | 'ON_DUE_DATE'
  | 'OVERDUE_3_DAYS'
  | 'OVERDUE_7_DAYS'
  | 'OVERDUE_15_DAYS'
  | 'OVERDUE_30_DAYS'
  | 'CUSTOM_DATE';

export type ReminderStatus = 'SCHEDULED' | 'SENT' | 'FAILED' | 'CANCELLED' | 'PAUSED';

export interface WhatsAppReminderRule {
  id: string;
  nameAr: string;
  triggerType: ReminderTriggerType;
  daysOffset: number; // negative for before due, 0 for on due date, positive for overdue
  templateId: string;
  templateTitle: string;
  defaultMessage: string;
  isEnabled: boolean;
  scheduledSendTime: string; // e.g. "09:30"
  includePaymentLink: boolean;
  includePdfStatement: boolean;
  autoSend: boolean; // if true, system triggers automatically; if false, requires 1-click confirmation
}

export interface WhatsAppScheduledReminder {
  id: string;
  invoiceId: string;
  invoiceNumber: string;
  customerId: string;
  customerCode: string;
  customerName: string;
  customerPhone: string;
  countryCode?: string;
  invoiceDate: string;
  dueDate: string;
  daysUntilDue: number; // negative if overdue, 0 if today, positive if remaining
  totalAmount: number;
  paidAmount: number;
  remainingAmount: number;
  currency: Currency;
  ruleId?: string;
  triggerType: ReminderTriggerType;
  triggerLabel: string;
  scheduledDate: string; // YYYY-MM-DD
  scheduledTime: string; // HH:mm
  status: ReminderStatus;
  messageText: string;
  sentAt?: string;
  sentBy?: string;
  deliveryChannel: 'WHATSAPP_BUSINESS_API' | 'WHATSAPP_WEB_DIRECT' | 'SMS_FALLBACK';
  responseStatus?: 'PENDING' | 'VIEWED' | 'PAID' | 'PROMISED_PAYMENT' | 'NO_RESPONSE';
  lastLog?: string;
}

// -------------------------------------------------------------
// 7. Multi-Cloud Synchronization & Local Master Replicas
// -------------------------------------------------------------
export type ServerRole = 'MASTER_WRITE' | 'READ_ONLY_REPLICA';

export interface CloudReplicaNode {
  id: string;
  provider: 'POSTGRES_LOCAL' | 'HUAWEI_CLOUD' | 'ALIBABA_CLOUD' | 'GOOGLE_CLOUD';
  nameAr: string;
  role: ServerRole; // Local = MASTER_WRITE, Clouds = READ_ONLY_REPLICA
  host: string;
  region: string;
  status: 'SYNCED' | 'SYNCING' | 'PENDING_QUEUE' | 'OFFLINE';
  lastSyncTimestamp: string;
  pendingQueueCount: number;
  latencyMs: number;
  isAuthority: boolean; // Only true for Local PostgreSQL
}

export interface SyncQueueItem {
  id: string;
  entityType: 'JOURNAL_ENTRY' | 'INVOICE' | 'PAYMENT_VOUCHER' | 'POS_TRANSACTION' | 'STOCK_MOVEMENT' | 'PURCHASE_ORDER';
  entityId: string;
  recordIdentifier: string; // e.g. "INV-2026-001" or "JE-2026-0042"
  sync_timestamp: string; // ISO 8601 string
  localMasterCommittedAt: string;
  pushedToCloudReplicas: {
    huawei: boolean;
    alibaba: boolean;
    google: boolean;
  };
  status: 'QUEUED' | 'PUSHED' | 'FAILED' | 'CONFLICT_REJECTED';
  retryCount: number;
  conflictDetails?: {
    conflictingRecordId: string;
    conflictingTimestamp: string;
    resolution: 'OLDEST_TIMESTAMP_ACCEPTED' | 'DELAYED_INPUT_REJECTED';
    warningMessage: string;
  };
}

export interface SyncEngineStatus {
  masterNode: {
    name: string;
    driver: 'POSTGRES_LOCAL';
    role: 'MASTER_WRITE';
    status: 'ONLINE';
    totalCommittedTransactions: number;
  };
  replicas: CloudReplicaNode[];
  queueLength: number;
  conflictPolicy: 'OLDEST_TIMESTAMP_AUTHORITATIVE';
  lastPushedAt: string;
  rejectedCollisionsCount: number;
}

