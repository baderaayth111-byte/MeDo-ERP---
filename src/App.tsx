import { VoiceCommandWidget } from './components/VoiceCommandWidget';
import React, { useState, useEffect } from 'react';
import { SplashScreen } from './components/SplashScreen';
import { 
  initialCompanyProfile, 
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
  exchangeRates 
} from './data/initialData';
import { SystemFooterCopyright } from './components/SystemFooterCopyright';
import { UnifiedHeader } from './components/UnifiedHeader';
import { initialWarehouses, initialStockMovements } from './data/inventoryData';
import { 
  getLoadedCompanyProfile, 
  saveCompanyProfileToStorage,
  getLoadedBranches,
  saveBranchesToStorage,
  getLoadedCurrenciesConfig,
  saveCurrenciesConfigToStorage,
  getLoadedFiscalPeriods,
  saveFiscalPeriodsToStorage,
  getLoadedSystemModules,
  saveSystemModulesToStorage,
  defaultCompanyProfile
} from './data/settingsData';
import {
  STORAGE_KEYS,
  saveToStorage,
  getLoadedEmployees,
  getLoadedPayrollRuns,
  getLoadedLeaveRequests,
  getLoadedAttendanceRecords,
  getLoadedAccounts,
  getLoadedJournalEntries,
  getLoadedCustomers,
  getLoadedVendors,
  getLoadedInvoices,
  getLoadedPaymentVouchers,
  getLoadedFixedAssets,
  getLoadedCostCenters,
  getLoadedProfitCenters,
  getLoadedBankAccounts,
  getLoadedInventoryItems,
  getLoadedWarehouses,
  getLoadedStockMovements,
  getLoadedPosSessions,
  getLoadedPosOrders,
  getLoadedPurchaseRequisitions,
  getLoadedPurchaseOrders,
  getLoadedGoodsReceiptNotes,
  getLoadedEInvoices,
  resetAllStorageToDefaults
} from './data/persistence';
import { 
  Currency, 
  Account, 
  JournalEntry, 
  Customer, 
  Vendor, 
  Invoice, 
  PaymentVoucher, 
  FixedAsset, 
  CostCenter, 
  ProfitCenter, 
  CompanyProfile,
  InventoryItem,
  Warehouse,
  StockMovement,
  Branch,
  CurrencyConfig,
  FiscalPeriod,
  SystemModuleSetting,
  Employee,
  PayrollRun,
  LeaveRequest,
  AttendanceRecord,
  PurchaseRequisition,
  PurchaseOrder,
  GoodsReceiptNote,
  EInvoiceData,
  POSSession,
  POSTransaction
} from './types/accounting';
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
  initialPosOrders
} from './data/advancedModulesData';
import { Header } from './components/Header';
import { Sidebar } from './components/Sidebar';
import { FioriLaunchpad } from './components/FioriLaunchpad';
import { GeneralLedgerView } from './components/GeneralLedgerView';
import { ChartOfAccountsView } from './components/ChartOfAccountsView';
import { AccountsReceivableView } from './components/AccountsReceivableView';
import { AccountsPayableView } from './components/AccountsPayableView';
import { FixedAssetsView } from './components/FixedAssetsView';
import { CostControllingView } from './components/CostControllingView';
import { FinancialReportsView } from './components/FinancialReportsView';
import { BudgetingView } from './components/BudgetingView';
import { BankReconciliationView } from './components/BankReconciliationView';
import { InventoryManagementView } from './components/InventoryManagementView';
import { StandaloneItemsApp } from './components/StandaloneItemsApp';
import { SettingsView } from './components/SettingsView';
import { SalesManagementView } from './components/SalesManagementView';
import { POSView } from './components/POSView';
import { HRPayrollView } from './components/HRPayrollView';
import { ProcurementView } from './components/ProcurementView';
import { EInvoicingView } from './components/EInvoicingView';
import { ForeignExchangeView } from './components/ForeignExchangeView';
import { 
  getLoadedFxVaults, 
  saveFxVaultsToStorage, 
  getLoadedFxDeals, 
  saveFxDealsToStorage, 
  getLoadedRemittances, 
  saveRemittancesToStorage 
} from './data/fxData';
import { FxVaultBalance, FxDeal, RemittanceTransaction, RemittanceStatus } from './types/foreignExchange';
import { DualControlVoucher, ExpenseCategory, RevenueCategory, VoucherWorkflowStatus, ExpenseDepartment, DailyExpenseItem } from './types/expensesRevenues';
import { 
  getLoadedDualControlVouchers, 
  saveDualControlVouchers, 
  getLoadedExpenseCategories, 
  saveExpenseCategories, 
  getLoadedRevenueCategories, 
  saveRevenueCategories,
  getLoadedExpenseDepartments,
  saveExpenseDepartments,
  getLoadedDailyExpenses,
  saveDailyExpenses
} from './data/expensesRevenuesData';
import { AppNotification, NotificationType, NotificationPriority } from './types/workflow';
import { getLoadedNotifications, saveNotifications } from './data/notificationsData';
import { ExpensesRevenuesView } from './components/ExpensesRevenuesView';
import { InternalInboxView } from './components/InternalInboxView';
import { AiAssistantModal } from './components/AiAssistantModal';
import { CrudTestingLabModal } from './components/CrudTestingLabModal';
import { useAuth } from './contexts/AuthContext';
import { useTransactionLimit } from './contexts/TransactionLimitContext';
import { LoginForm } from './components/LoginForm';
import { RoleManagementView } from './components/RoleManagementView';
import { GlobalSearchModal } from './components/GlobalSearchModal';
import { MandatoryPasswordChangeModal } from './components/MandatoryPasswordChangeModal';
import { AccountLockoutScreen } from './components/AccountLockoutScreen';
import { OfflineStatusBanner } from './components/OfflineStatusBanner';
import { ShieldAlert } from 'lucide-react';

export default function App() {
  const { user, loading: authLoading, profile, hasPermission, logout, changePassword } = useAuth();
  const { isLocked, transactionCount, maxTransactions, unlockAccount, recordTransaction } = useTransactionLimit();

  const [showSplashScreen, setShowSplashScreen] = useState<boolean>(() => {
    try {
      const hasShown = sessionStorage.getItem('medo_splash_shown');
      return !hasShown;
    } catch {
      return false;
    }
  });

  const handleSplashFinish = () => {
    setShowSplashScreen(false);
    try {
      sessionStorage.setItem('medo_splash_shown', 'true');
    } catch {
      // ignore
    }
  };

  // Navigation & Direct URL Routing
  const [activeModule, setActiveModule] = useState<string>(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const appParam = params.get('app');
      const modeParam = params.get('mode');
      const standaloneParam = params.get('standalone');
      if (
        appParam === 'items' ||
        modeParam === 'items' ||
        modeParam === 'standalone-items' ||
        standaloneParam === 'items'
      ) {
        return 'standalone-items';
      }
      const requestedModule = params.get('module') || params.get('tab') || params.get('view');
      if (requestedModule) return requestedModule;
    } catch {
      // ignore
    }
    return 'launchpad';
  });

  // Automatically redirect Cashier / Sales role to POS view on login if on launchpad
  useEffect(() => {
    if (profile?.role === 'CASHIER' && activeModule === 'launchpad') {
      setActiveModule('pos');
    }
  }, [profile?.role]);

  // Dispatch real-time notification to Management when Cashier opens or operates POS
  useEffect(() => {
    if (activeModule === 'pos' && profile) {
      const activeCashier = profile.displayName || profile.email?.split('@')[0] || 'كاشير الفرع الرئيسي';
      const posEnterNotif: AppNotification = {
        id: `NOTIF-POS-ACTIVE-${Date.now()}`,
        title: `🟢 الكاشير متصل ونشط الآن: (${activeCashier})`,
        message: `الكاشير (${activeCashier}) متواجد حالياً على شاشة المبيعات ونقاط البيع (POS) ويقوم بإدارة الفواتير بالفرع الرئيسي.`,
        type: 'SYSTEM',
        priority: 'MEDIUM',
        timestamp: new Date().toISOString(),
        isRead: false,
        isArchived: false,
        targetModule: 'pos',
        actionLabel: 'عرض المبيعات ونقاط البيع',
        sender: {
          name: activeCashier,
          role: profile.role === 'CASHIER' ? 'كاشير المبيعات POS' : 'مستخدم النظام',
        },
        channels: ['IN_APP', 'WHATSAPP'],
        whatsappUrl: `https://wa.me/967715779976?text=${encodeURIComponent(
          `🟢 *تنبيه MeDo ERP - الكاشير نشط ومتصل*\n👤 الكاشير: ${activeCashier}\n📧 البريد: ${profile.email}\n⏰ الوقت: ${new Date().toLocaleTimeString('ar-YE')}\n📍 الحالة: متواجد حالياً بشاشة نقاط البيع (POS)`
        )}`,
      };

      setNotifications(prev => {
        const alreadyNotified = prev.some(
          n => n.targetModule === 'pos' && n.sender?.name === activeCashier &&
          (new Date().getTime() - new Date(n.timestamp).getTime()) < 120000
        );
        if (alreadyNotified) return prev;
        return [posEnterNotif, ...prev];
      });
    }
  }, [activeModule, profile]);

  // Keep URL parameters updated for direct linking
  useEffect(() => {
    try {
      const url = new URL(window.location.href);
      if (activeModule === 'standalone-items') {
        url.searchParams.set('app', 'items');
        url.searchParams.delete('module');
        url.searchParams.delete('tab');
        url.searchParams.delete('view');
      } else if (activeModule && activeModule !== 'launchpad') {
        url.searchParams.delete('app');
        url.searchParams.delete('standalone');
        url.searchParams.set('module', activeModule);
      } else {
        url.searchParams.delete('app');
        url.searchParams.delete('standalone');
        url.searchParams.delete('module');
        url.searchParams.delete('tab');
        url.searchParams.delete('view');
      }
      window.history.replaceState({}, '', url.toString());
    } catch {
      // ignore
    }
  }, [activeModule]);
  
  // Settings & System Administration Persistent State
  const [companyProfile, setCompanyProfile] = useState<CompanyProfile>(() => getLoadedCompanyProfile());
  const [branches, setBranches] = useState<Branch[]>(() => getLoadedBranches());
  const [currenciesConfig, setCurrenciesConfig] = useState<CurrencyConfig[]>(() => getLoadedCurrenciesConfig());
  const [fiscalPeriods, setFiscalPeriods] = useState<FiscalPeriod[]>(() => getLoadedFiscalPeriods());
  const [systemModules, setSystemModules] = useState<SystemModuleSetting[]>(() => getLoadedSystemModules());

  // Currency & Rate State
  const [currency, setCurrency] = useState<Currency>(() => companyProfile.baseCurrency || 'YER');
  const [rates, setRates] = useState<Record<Currency, number>>(() => ({
    YER: 1,
    USD: companyProfile.exchangeRates?.USD || exchangeRates.USD,
    SAR: companyProfile.exchangeRates?.SAR || exchangeRates.SAR,
  }));

  // System Master & Transactional Data State (Persistent)
  const [accounts, setAccounts] = useState<Account[]>(() => getLoadedAccounts());
  const [journalEntries, setJournalEntries] = useState<JournalEntry[]>(() => getLoadedJournalEntries());
  const [customers, setCustomers] = useState<Customer[]>(() => getLoadedCustomers());
  const [vendors, setVendors] = useState<Vendor[]>(() => getLoadedVendors());
  const [invoices, setInvoices] = useState<Invoice[]>(() => getLoadedInvoices());
  const [paymentVouchers, setPaymentVouchers] = useState<PaymentVoucher[]>(() => getLoadedPaymentVouchers());
  const [fixedAssets, setFixedAssets] = useState<FixedAsset[]>(() => getLoadedFixedAssets());
  const [costCenters, setCostCenters] = useState<CostCenter[]>(() => getLoadedCostCenters());
  const [profitCenters, setProfitCenters] = useState<ProfitCenter[]>(() => getLoadedProfitCenters());
  const [bankAccounts, setBankAccounts] = useState(() => getLoadedBankAccounts());

  // Inventory & Warehouse Management Data State
  const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>(() => getLoadedInventoryItems());
  const [warehouses, setWarehouses] = useState<Warehouse[]>(() => getLoadedWarehouses());
  const [stockMovements, setStockMovements] = useState<StockMovement[]>(() => getLoadedStockMovements());

  // POS State
  const [posSessions, setPosSessions] = useState<POSSession[]>(() => getLoadedPosSessions());
  const [posOrders, setPosOrders] = useState<POSTransaction[]>(() => getLoadedPosOrders());

  // HR & Payroll State (Persistent)
  const [employees, setEmployees] = useState<Employee[]>(() => getLoadedEmployees());
  const [payrollRuns, setPayrollRuns] = useState<PayrollRun[]>(() => getLoadedPayrollRuns());
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>(() => getLoadedLeaveRequests());
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>(() => getLoadedAttendanceRecords());

  // Procurement State
  const [purchaseRequisitions, setPurchaseRequisitions] = useState<PurchaseRequisition[]>(() => getLoadedPurchaseRequisitions());
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>(() => getLoadedPurchaseOrders());
  const [goodsReceiptNotes, setGoodsReceiptNotes] = useState<GoodsReceiptNote[]>(() => getLoadedGoodsReceiptNotes());

  // E-Invoicing (ZATCA QR) State
  const [eInvoices, setEInvoices] = useState<EInvoiceData[]>(() => getLoadedEInvoices());

  // Foreign Exchange & Remittances State
  const [fxVaults, setFxVaults] = useState<FxVaultBalance[]>(() => getLoadedFxVaults());
  const [fxDeals, setFxDeals] = useState<FxDeal[]>(() => getLoadedFxDeals());
  const [remittances, setRemittances] = useState<RemittanceTransaction[]>(() => getLoadedRemittances());

  // Expenses & Revenues Dual Control, Daily Expenses & Departments State
  const [dualControlVouchers, setDualControlVouchers] = useState<DualControlVoucher[]>(() => getLoadedDualControlVouchers());
  const [expenseCategories, setExpenseCategories] = useState<ExpenseCategory[]>(() => getLoadedExpenseCategories());
  const [revenueCategories, setRevenueCategories] = useState<RevenueCategory[]>(() => getLoadedRevenueCategories());
  const [expenseDepartments, setExpenseDepartments] = useState<ExpenseDepartment[]>(() => getLoadedExpenseDepartments());
  const [dailyExpenses, setDailyExpenses] = useState<DailyExpenseItem[]>(() => getLoadedDailyExpenses());

  // Global Notifications & Internal Inbox State
  const [notifications, setNotifications] = useState<AppNotification[]>(() => getLoadedNotifications());

  // Modals & UI Controls
  const [isAiModalOpen, setIsAiModalOpen] = useState(false);
  const [isCrudLabOpen, setIsCrudLabOpen] = useState(false);
  const [isGlobalSearchOpen, setIsGlobalSearchOpen] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  // Clean Demo Mode Initializer (بدون أصناف / بدون عملاء / بدون تطبيق الصرافة)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      if (urlParams.get('clean_demo') === 'true' || urlParams.get('clean_items') === 'true') {
        setCustomers([]);
        setInventoryItems([]);
        setSystemModules(prev =>
          prev.map(m =>
            m.id === 'FOREIGN_EXCHANGE' || m.id === 'REMITTANCES'
              ? { ...m, isEnabled: false }
              : m
          )
        );
      }
    }
  }, []);

  // Global Keyboard Shortcut (Ctrl+K / Cmd+K) for Search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && (e.key === 'k' || e.key === 'K')) {
        e.preventDefault();
        e.stopPropagation();
        setIsGlobalSearchOpen(prev => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // --- Persistent Storage Sync Effects (Auto-Save on ANY changes) ---
  useEffect(() => { saveToStorage(STORAGE_KEYS.EMPLOYEES, employees); }, [employees]);
  useEffect(() => { saveToStorage(STORAGE_KEYS.PAYROLL_RUNS, payrollRuns); }, [payrollRuns]);
  useEffect(() => { saveToStorage(STORAGE_KEYS.LEAVE_REQUESTS, leaveRequests); }, [leaveRequests]);
  useEffect(() => { saveToStorage(STORAGE_KEYS.ATTENDANCE_RECORDS, attendanceRecords); }, [attendanceRecords]);
  useEffect(() => { saveToStorage(STORAGE_KEYS.ACCOUNTS, accounts); }, [accounts]);
  useEffect(() => { saveToStorage(STORAGE_KEYS.JOURNAL_ENTRIES, journalEntries); }, [journalEntries]);
  useEffect(() => { saveToStorage(STORAGE_KEYS.CUSTOMERS, customers); }, [customers]);
  useEffect(() => { saveToStorage(STORAGE_KEYS.VENDORS, vendors); }, [vendors]);
  useEffect(() => { saveToStorage(STORAGE_KEYS.INVOICES, invoices); }, [invoices]);
  useEffect(() => { saveToStorage(STORAGE_KEYS.PAYMENT_VOUCHERS, paymentVouchers); }, [paymentVouchers]);
  useEffect(() => { saveToStorage(STORAGE_KEYS.FIXED_ASSETS, fixedAssets); }, [fixedAssets]);
  useEffect(() => { saveToStorage(STORAGE_KEYS.COST_CENTERS, costCenters); }, [costCenters]);
  useEffect(() => { saveToStorage(STORAGE_KEYS.PROFIT_CENTERS, profitCenters); }, [profitCenters]);
  useEffect(() => { saveToStorage(STORAGE_KEYS.BANK_ACCOUNTS, bankAccounts); }, [bankAccounts]);
  useEffect(() => { saveToStorage(STORAGE_KEYS.INVENTORY_ITEMS, inventoryItems); }, [inventoryItems]);
  useEffect(() => { saveToStorage(STORAGE_KEYS.WAREHOUSES, warehouses); }, [warehouses]);
  useEffect(() => { saveToStorage(STORAGE_KEYS.STOCK_MOVEMENTS, stockMovements); }, [stockMovements]);
  useEffect(() => { saveToStorage(STORAGE_KEYS.POS_SESSIONS, posSessions); }, [posSessions]);
  useEffect(() => { saveToStorage(STORAGE_KEYS.POS_ORDERS, posOrders); }, [posOrders]);
  useEffect(() => { saveToStorage(STORAGE_KEYS.PURCHASE_REQUISITIONS, purchaseRequisitions); }, [purchaseRequisitions]);
  useEffect(() => { saveToStorage(STORAGE_KEYS.PURCHASE_ORDERS, purchaseOrders); }, [purchaseOrders]);
  useEffect(() => { saveToStorage(STORAGE_KEYS.GOODS_RECEIPT_NOTES, goodsReceiptNotes); }, [goodsReceiptNotes]);
  useEffect(() => { saveToStorage(STORAGE_KEYS.E_INVOICES, eInvoices); }, [eInvoices]);
  useEffect(() => { saveFxVaultsToStorage(fxVaults); }, [fxVaults]);
  useEffect(() => { saveFxDealsToStorage(fxDeals); }, [fxDeals]);
  useEffect(() => { saveRemittancesToStorage(remittances); }, [remittances]);
  useEffect(() => { saveDualControlVouchers(dualControlVouchers); }, [dualControlVouchers]);
  useEffect(() => { saveExpenseCategories(expenseCategories); }, [expenseCategories]);
  useEffect(() => { saveRevenueCategories(revenueCategories); }, [revenueCategories]);
  useEffect(() => { saveExpenseDepartments(expenseDepartments); }, [expenseDepartments]);
  useEffect(() => { saveDailyExpenses(dailyExpenses); }, [dailyExpenses]);
  useEffect(() => { saveNotifications(notifications); }, [notifications]);

  // Handlers for Foreign Exchange & Remittances
  const handleAddFxDeal = (deal: FxDeal) => {
    setFxDeals(prev => [deal, ...prev]);
  };

  const handleAddRemittance = (remittance: RemittanceTransaction) => {
    setRemittances(prev => [remittance, ...prev]);
  };

  const handleUpdateRemittanceStatus = (id: string, status: RemittanceStatus, payoutInfo?: { payoutDate: string; payoutBranch: string; payoutUser: string }) => {
    setRemittances(prev => prev.map(r => {
      if (r.id === id) {
        return {
          ...r,
          status,
          ...(payoutInfo || {})
        };
      }
      return r;
    }));
  };

  // Handlers for POS
  const handleAddPosOrder = (newOrder: POSTransaction) => {
    setPosOrders(prev => [newOrder, ...prev]);

    // Automatically update inventory quantity for each sold item
    setInventoryItems(prevItems =>
      prevItems.map(item => {
        const sold = newOrder.items.find(it => it.itemId === item.id || it.itemCode === item.code);
        if (sold) {
          const newQty = Math.max(0, item.quantity - sold.quantity);
          return {
            ...item,
            quantity: newQty,
            status: newQty <= 0 ? 'نفذت الكمية' : newQty < 10 ? 'منخفض' : 'متوفر',
          };
        }
        return item;
      })
    );

    // Update active POS session statistics
    setPosSessions(prevSessions =>
      prevSessions.map(sess => {
        if (sess.status === 'OPEN') {
          return {
            ...sess,
            totalTransactionsCount: sess.totalTransactionsCount + 1,
            totalGrossRevenue: sess.totalGrossRevenue + newOrder.grandTotal,
            totalSalesCash: newOrder.paymentMethod === 'CASH' ? sess.totalSalesCash + newOrder.grandTotal : sess.totalSalesCash,
            totalSalesCard: newOrder.paymentMethod === 'CARD' ? sess.totalSalesCard + newOrder.grandTotal : sess.totalSalesCard,
            totalSalesCredit: newOrder.paymentMethod === 'CREDIT' ? (sess.totalSalesCredit || 0) + newOrder.grandTotal : sess.totalSalesCredit,
            totalSalesTransfer: newOrder.paymentMethod === 'TRANSFER' ? (sess.totalSalesTransfer || 0) + newOrder.grandTotal : sess.totalSalesTransfer,
          };
        }
        return sess;
      })
    );

    // Automatically record General Ledger Journal Entry for POS Sales
    const totalTax = newOrder.taxTotal || 0;
    const je: JournalEntry = {
      id: `JE-POS-${newOrder.id}`,
      entryNumber: `JE-POS-${Date.now().toString().slice(-4)}`,
      date: newOrder.date.split(' ')[0],
      reference: newOrder.receiptNumber,
      description: `مبيعات نقدية / نقطة بيع - فاتورة ${newOrder.receiptNumber} - ${newOrder.cashierName}`,
      status: 'POSTED',
      totalDebit: newOrder.grandTotal,
      totalCredit: newOrder.grandTotal,
      createdBy: newOrder.cashierName,
      postedAt: new Date().toISOString(),
      lines: [
        {
          id: `line-1-${Date.now()}`,
          accountCode: newOrder.paymentMethod === 'CASH' ? '1111' : '1112',
          accountName: newOrder.paymentMethod === 'CASH' ? 'النقدية بالصندوق الرئيسي' : 'البنك - الحساب الجاري',
          debit: newOrder.grandTotal,
          credit: 0,
          currency: newOrder.currency,
          exchangeRate: 1,
          amountInBase: newOrder.grandTotal,
          description: `تحصيل مبيعات كاشير ${newOrder.receiptNumber}`,
        },
        {
          id: `line-2-${Date.now()}`,
          accountCode: '4110',
          accountName: 'إيرادات مبيعات البضائع والخدمات',
          debit: 0,
          credit: newOrder.subtotal,
          currency: newOrder.currency,
          exchangeRate: 1,
          amountInBase: newOrder.subtotal,
          description: `إيراد مبيعات فاتورة ${newOrder.receiptNumber}`,
        },
        ...(totalTax > 0 ? [{
          id: `line-3-${Date.now()}`,
          accountCode: '2130',
          accountName: 'ضريبة القيمة المضافة المحصلة (مخرجات)',
          debit: 0,
          credit: totalTax,
          currency: newOrder.currency,
          exchangeRate: 1,
          amountInBase: totalTax,
          description: `ضريبة 5% فاتورة ${newOrder.receiptNumber}`,
        }] : []),
      ],
    };
    handleAddJournalEntry(je);

    // Send Real-Time Notification to System Management (Admin Inbox & Alerts)
    const posNotif: AppNotification = {
      id: `NOTIF-POS-${Date.now()}`,
      title: `إشعار مبيعات كاشير آلي (${newOrder.receiptNumber})`,
      message: `قام الكاشير (${newOrder.cashierName}) بإصدار فاتورة مبيعات جديدة بقيمة ${newOrder.grandTotal.toLocaleString()} ${newOrder.currency} عبر نقطة بيع الفرع الرئيسي (${newOrder.paymentMethod === 'CASH' ? 'نقداً' : newOrder.paymentMethod === 'CARD' ? 'شبكة/بطاقة' : 'آجل'}).`,
      type: 'SALES',
      priority: 'MEDIUM',
      timestamp: new Date().toISOString(),
      isRead: false,
      isArchived: false,
      targetModule: 'pos',
      targetId: newOrder.id,
      actionLabel: 'مراجعة المبيعات في الحسابات',
      sender: {
        name: newOrder.cashierName || 'كاشير الفرع الرئيسي',
        role: 'كاشير المبيعات ونقاط البيع POS',
      },
      channels: ['IN_APP', 'WHATSAPP'],
      whatsappUrl: `https://wa.me/967715779976?text=${encodeURIComponent(`🛒 *تنبيه MeDo ERP - مبيعات كاشير جديدة*\nرقم الفاتورة: ${newOrder.receiptNumber}\nالكاشير: ${newOrder.cashierName}\nالمبلغ الإجمالي: ${newOrder.grandTotal.toLocaleString()} ${newOrder.currency}\nطريقة الدفع: ${newOrder.paymentMethod}`)}`,
    };
    setNotifications(prev => [posNotif, ...prev]);
  };

  // Handlers for HR
  const handleAddEmployee = (emp: Employee) => {
    setEmployees(prev => [emp, ...prev]);
  };

  const handleUpdateEmployee = (emp: Employee) => {
    setEmployees(prev => prev.map(e => (e.id === emp.id ? emp : e)));
  };

  const handleDeleteEmployee = (empId: string) => {
    setEmployees(prev => prev.filter(e => e.id !== empId));
  };

  const handleAddPayrollRun = (payroll: PayrollRun) => {
    setPayrollRuns(prev => [payroll, ...prev]);
  };

  const handlePostPayrollToGL = (runId: string) => {
    const run = payrollRuns.find(r => r.id === runId);
    if (!run) return;

    // Create journal entry for Payroll
    const je: JournalEntry = {
      id: `JE-PAY-${Date.now().toString().slice(-4)}`,
      entryNumber: `JV-PAY-0${journalEntries.length + 10}`,
      date: run.dateProcessed || new Date().toISOString().split('T')[0],
      reference: run.payrollNumber,
      description: `إثبات واعتماد مسير رواتب ${run.periodName} وإيداع المستحقات`,
      status: 'POSTED',
      createdBy: 'إدارة الموارد البشرية والرواتب',
      postedAt: new Date().toLocaleString('ar-YE'),
      totalDebit: run.totalGrossAmount + run.totalCompanyContributions,
      totalCredit: run.totalGrossAmount + run.totalCompanyContributions,
      lines: [
        {
          id: '1',
          accountCode: '5210',
          accountName: 'الرواتب والأجور والبدلات والمكافآت',
          debit: run.totalGrossAmount,
          credit: 0,
          currency: 'YER',
          exchangeRate: 1,
          amountInBase: run.totalGrossAmount,
          description: `إجمالي رواتب الموظفين عن ${run.periodName}`,
        },
        ...(run.totalCompanyContributions > 0 ? [{
          id: '2',
          accountCode: '5210',
          accountName: 'مساهمة المنشأة في التأمينات الاجتماعية (11%)',
          debit: run.totalCompanyContributions,
          credit: 0,
          currency: 'YER' as Currency,
          exchangeRate: 1,
          amountInBase: run.totalCompanyContributions,
          description: 'مساهمة صاحب العمل في التأمينات الاجتماعية',
        }] : []),
        ...(run.totalDeductionsAmount > 0 ? [{
          id: '3',
          accountCode: '2130',
          accountName: 'مستحقات التأمينات الاجتماعية وضريبة كسب العمل',
          debit: 0,
          credit: run.totalDeductionsAmount + run.totalCompanyContributions,
          currency: 'YER' as Currency,
          exchangeRate: 1,
          amountInBase: run.totalDeductionsAmount + run.totalCompanyContributions,
          description: 'استقطاعات الموظفين + مساهمة الشركة في التأمينات والضرائب',
        }] : []),
        {
          id: '4',
          accountCode: '1112',
          accountName: 'بنك التضامن الإسلامي الدولي (ريال)',
          debit: 0,
          credit: run.totalNetAmount,
          currency: 'YER',
          exchangeRate: 1,
          amountInBase: run.totalNetAmount,
          description: `صافي الرواتب المحولة لحسابات الموظفين (${run.totalEmployees} موظف)`,
        },
      ],
    };

    handleAddJournalEntry(je);

    // Update payroll run status
    setPayrollRuns(prev =>
      prev.map(r =>
        r.id === runId
          ? {
              ...r,
              status: 'POSTED_TO_GL',
              journalEntryId: je.entryNumber,
              postedBy: 'أ. سارة المنصوري (رئيس الحسابات)',
              postedAt: new Date().toLocaleString('ar-YE'),
            }
          : r
      )
    );
  };

  const handleApproveLeave = (leaveId: string) => {
    setLeaveRequests(prev =>
      prev.map(l => (l.id === leaveId ? { ...l, status: 'APPROVED', approvedBy: 'إدارة الموارد البشرية' } : l))
    );
  };

  const handleRejectLeave = (leaveId: string) => {
    setLeaveRequests(prev =>
      prev.map(l => (l.id === leaveId ? { ...l, status: 'REJECTED' } : l))
    );
  };

  const handleAddLeaveRequest = (leave: LeaveRequest) => {
    setLeaveRequests(prev => [leave, ...prev]);
  };

  const handleAddAttendanceRecord = (att: AttendanceRecord) => {
    setAttendanceRecords(prev => [att, ...prev]);
  };

  // Handlers for Procurement
  const handleAddPurchaseRequisition = (pr: PurchaseRequisition) => {
    setPurchaseRequisitions(prev => [pr, ...prev]);
  };

  const handleUpdatePurchaseRequisition = (pr: PurchaseRequisition) => {
    setPurchaseRequisitions(prev => prev.map(item => item.id === pr.id ? pr : item));
  };

  const handleAddPurchaseOrder = (po: PurchaseOrder) => {
    setPurchaseOrders(prev => [po, ...prev]);
  };

  const handleUpdatePurchaseOrder = (po: PurchaseOrder) => {
    setPurchaseOrders(prev => prev.map(item => item.id === po.id ? po : item));
  };

  const handleAddGoodsReceipt = (grn: GoodsReceiptNote) => {
    setGoodsReceiptNotes(prev => [grn, ...prev]);
  };

  // Handlers for E-Invoicing
  const handleAddEInvoice = (inv: EInvoiceData) => {
    setEInvoices(prev => [inv, ...prev]);
  };

  // --- Settings Handlers ---
  const handleUpdateCompanyProfile = (updatedProfile: CompanyProfile) => {
    setCompanyProfile(updatedProfile);
    saveCompanyProfileToStorage(updatedProfile);

    // Update rates if exchangeRates changed
    if (updatedProfile.exchangeRates) {
      const newUsd = updatedProfile.exchangeRates.USD || rates.USD;
      const newSar = updatedProfile.exchangeRates.SAR || rates.SAR;
      setRates(prev => ({
        ...prev,
        USD: newUsd,
        SAR: newSar,
      }));

      // Synchronize currenciesConfig
      setCurrenciesConfig(prev => {
        const synced = prev.map(c => {
          if (c.code === 'USD') return { ...c, exchangeRate: newUsd };
          if (c.code === 'SAR') return { ...c, exchangeRate: newSar };
          return c;
        });
        saveCurrenciesConfigToStorage(synced);
        return synced;
      });
    }
  };

  const handleUpdateBranches = (updatedBranches: Branch[]) => {
    setBranches(updatedBranches);
    saveBranchesToStorage(updatedBranches);
  };

  const handleUpdateCurrenciesConfig = (updatedCurrencies: CurrencyConfig[]) => {
    setCurrenciesConfig(updatedCurrencies);
    saveCurrenciesConfigToStorage(updatedCurrencies);

    // Sync exchange rates
    const usd = updatedCurrencies.find(c => c.code === 'USD')?.exchangeRate || rates.USD;
    const sar = updatedCurrencies.find(c => c.code === 'SAR')?.exchangeRate || rates.SAR;
    setRates({
      YER: 1,
      USD: usd,
      SAR: sar,
    });
  };

  const handleUpdateFiscalPeriods = (updatedPeriods: FiscalPeriod[]) => {
    setFiscalPeriods(updatedPeriods);
    saveFiscalPeriodsToStorage(updatedPeriods);
  };

  const handleUpdateSystemModules = (updatedModules: SystemModuleSetting[]) => {
    setSystemModules(updatedModules);
    saveSystemModulesToStorage(updatedModules);
  };

  const handleResetAllData = () => {
    resetAllStorageToDefaults();
    setCompanyProfile(defaultCompanyProfile);
    setAccounts(initialAccounts);
    setJournalEntries(initialJournalEntries);
    setCustomers(initialCustomers);
    setVendors(initialVendors);
    setInvoices(initialInvoices);
    setPaymentVouchers(initialPaymentVouchers);
    setFixedAssets(initialFixedAssets);
    setCostCenters(initialCostCenters);
    setProfitCenters(initialProfitCenters);
    setBankAccounts(initialBankAccounts);
    setInventoryItems(getLoadedInventoryItems());
    setWarehouses(initialWarehouses);
    setStockMovements(initialStockMovements);
    setEmployees(initialEmployees);
    setPayrollRuns(initialPayrollRuns);
    setLeaveRequests(initialLeaveRequests);
    setAttendanceRecords(initialAttendanceRecords);
    setPurchaseRequisitions(initialPurchaseRequisitions);
    setPurchaseOrders(initialPurchaseOrders);
    setGoodsReceiptNotes(initialGoodsReceiptNotes);
    setEInvoices(initialEInvoices);
    setPosSessions(initialPosSessions);
    setPosOrders(initialPosOrders);
    setBranches(getLoadedBranches());
    setCurrenciesConfig(getLoadedCurrenciesConfig());
    setFiscalPeriods(getLoadedFiscalPeriods());
    setSystemModules(getLoadedSystemModules());
    setDualControlVouchers(getLoadedDualControlVouchers());
    setExpenseCategories(getLoadedExpenseCategories());
    setRevenueCategories(getLoadedRevenueCategories());
    setExpenseDepartments(getLoadedExpenseDepartments());
    setDailyExpenses(getLoadedDailyExpenses());
    setNotifications(getLoadedNotifications());
  };

  const handleExportFullBackup = () => {
    const fullBackup = {
      system: 'MeDo ERP S/4HANA Enterprise',
      backupDate: new Date().toISOString(),
      companyProfile,
      branches,
      currenciesConfig,
      fiscalPeriods,
      systemModules,
      accounts,
      journalEntries,
      customers,
      vendors,
      invoices,
      paymentVouchers,
      fixedAssets,
      costCenters,
      profitCenters,
      bankAccounts,
      inventoryItems,
      warehouses,
      stockMovements,
      employees,
      payrollRuns,
      leaveRequests,
      attendanceRecords,
      purchaseRequisitions,
      purchaseOrders,
      goodsReceiptNotes,
      eInvoices,
      posSessions,
      posOrders,
      dualControlVouchers,
      expenseCategories,
      revenueCategories,
      expenseDepartments,
      dailyExpenses,
      notifications,
    };

    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(fullBackup, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `MeDo_ERP_Full_Backup_${new Date().toISOString().split('T')[0]}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const handleImportFullBackup = (backup: any) => {
    if (backup.companyProfile) handleUpdateCompanyProfile(backup.companyProfile);
    if (backup.branches) handleUpdateBranches(backup.branches);
    if (backup.currenciesConfig) handleUpdateCurrenciesConfig(backup.currenciesConfig);
    if (backup.fiscalPeriods) handleUpdateFiscalPeriods(backup.fiscalPeriods);
    if (backup.systemModules) handleUpdateSystemModules(backup.systemModules);
    if (backup.accounts) setAccounts(backup.accounts);
    if (backup.journalEntries) setJournalEntries(backup.journalEntries);
    if (backup.customers) setCustomers(backup.customers);
    if (backup.vendors) setVendors(backup.vendors);
    if (backup.invoices) setInvoices(backup.invoices);
    if (backup.paymentVouchers) setPaymentVouchers(backup.paymentVouchers);
    if (backup.fixedAssets) setFixedAssets(backup.fixedAssets);
    if (backup.costCenters) setCostCenters(backup.costCenters);
    if (backup.profitCenters) setProfitCenters(backup.profitCenters);
    if (backup.bankAccounts) setBankAccounts(backup.bankAccounts);
    if (backup.inventoryItems) setInventoryItems(backup.inventoryItems);
    if (backup.warehouses) setWarehouses(backup.warehouses);
    if (backup.stockMovements) setStockMovements(backup.stockMovements);
    if (backup.employees) setEmployees(backup.employees);
    if (backup.payrollRuns) setPayrollRuns(backup.payrollRuns);
    if (backup.leaveRequests) setLeaveRequests(backup.leaveRequests);
    if (backup.attendanceRecords) setAttendanceRecords(backup.attendanceRecords);
    if (backup.purchaseRequisitions) setPurchaseRequisitions(backup.purchaseRequisitions);
    if (backup.purchaseOrders) setPurchaseOrders(backup.purchaseOrders);
    if (backup.goodsReceiptNotes) setGoodsReceiptNotes(backup.goodsReceiptNotes);
    if (backup.eInvoices) setEInvoices(backup.eInvoices);
    if (backup.posSessions) setPosSessions(backup.posSessions);
    if (backup.posOrders) setPosOrders(backup.posOrders);
    if (backup.dualControlVouchers) setDualControlVouchers(backup.dualControlVouchers);
    if (backup.expenseCategories) setExpenseCategories(backup.expenseCategories);
    if (backup.revenueCategories) setRevenueCategories(backup.revenueCategories);
    if (backup.expenseDepartments) setExpenseDepartments(backup.expenseDepartments);
    if (backup.dailyExpenses) setDailyExpenses(backup.dailyExpenses);
    if (backup.notifications) setNotifications(backup.notifications);
  };

  // --- Handlers ---
  const handleAddJournalEntry = (newEntry: JournalEntry) => {
    recordTransaction();
    setJournalEntries(prev => [newEntry, ...prev]);

    // Update account balances based on lines
    setAccounts(prevAccounts =>
      prevAccounts.map(acc => {
        const line = newEntry.lines.find(l => l.accountCode === acc.code);
        if (!line) return acc;
        const isDebitNormal = acc.type === 'ASSET' || acc.type === 'EXPENSE';
        const netChange = isDebitNormal ? (line.debit - line.credit) : (line.credit - line.debit);
        return {
          ...acc,
          balance: acc.balance + netChange,
        };
      })
    );
  };

  const handleReverseEntry = (entryId: string) => {
    const target = journalEntries.find(j => j.id === entryId);
    if (!target) return;

    // Create a reversal entry
    const reversalEntry: JournalEntry = {
      id: `REV-${Date.now().toString().slice(-4)}`,
      entryNumber: `REV-${target.entryNumber}`,
      date: new Date().toISOString().split('T')[0],
      reference: `REV-OF-${target.reference}`,
      description: `عكس وإلغاء القيد رقم (${target.entryNumber}) - ${target.description}`,
      status: 'REVERSED',
      createdBy: 'المحاسب المالي',
      postedAt: new Date().toLocaleString('ar-YE'),
      totalDebit: target.totalDebit,
      totalCredit: target.totalCredit,
      lines: target.lines.map((l, i) => ({
        ...l,
        id: `rev-${i}`,
        debit: l.credit, // Invert
        credit: l.debit, // Invert
        description: `عكس: ${l.description}`,
      })),
    };

    setJournalEntries(prev => [
      reversalEntry,
      ...prev.map(j => (j.id === entryId ? { ...j, status: 'REVERSED' as const } : j)),
    ]);

    // Revert account balances
    setAccounts(prevAccounts =>
      prevAccounts.map(acc => {
        const line = target.lines.find(l => l.accountCode === acc.code);
        if (!line) return acc;
        const isDebitNormal = acc.type === 'ASSET' || acc.type === 'EXPENSE';
        const netRevert = isDebitNormal ? (line.credit - line.debit) : (line.debit - line.credit);
        return {
          ...acc,
          balance: acc.balance + netRevert,
        };
      })
    );

    alert(`تم عكس وإلغاء القيد المحاسبي ${target.entryNumber} بنجاح!`);
  };

  const handleAddAccount = (newAccount: Account) => {
    setAccounts(prev => [...prev, newAccount]);
  };

  const handleAddCustomer = (newCustomer: Customer) => {
    setCustomers(prev => [...prev, newCustomer]);
  };

  const handleAddInvoice = (newInvoice: Invoice) => {
    setInvoices(prev => [newInvoice, ...prev]);

    // Handle Customer Invoice (Sales) or Sales Return
    if (newInvoice.type === 'CUSTOMER_INVOICE') {
      const balanceDelta = (newInvoice.paymentMethod === 'CREDIT' || (newInvoice.remainingAmount && newInvoice.remainingAmount > 0))
        ? (newInvoice.remainingAmount ?? newInvoice.grandTotal)
        : 0;

      if (balanceDelta > 0) {
        setCustomers(prev =>
          prev.map(c => (c.id === newInvoice.entityId ? { ...c, currentBalance: c.currentBalance + balanceDelta } : c))
        );
      }

      // Deduct inventory quantities for items with valid itemId/itemCode
      if (newInvoice.items && newInvoice.items.length > 0) {
        setInventoryItems(prev =>
          prev.map(invItem => {
            const soldMatch = newInvoice.items.find(
              it => (it.itemId && it.itemId === invItem.id) || (it.itemCode && it.itemCode === invItem.code)
            );
            if (soldMatch) {
              const newQty = Math.max(0, invItem.quantity - (soldMatch.quantity || 0));
              return {
                ...invItem,
                quantity: newQty,
                currentStock: newQty,
                status: newQty === 0 ? 'نفذت الكمية' : newQty <= invItem.minStockLevel ? 'منخفض' : 'متوفر',
                lastUpdated: new Date().toISOString().split('T')[0]
              };
            }
            return invItem;
          })
        );
      }
    } else if (newInvoice.type === 'SALES_RETURN') {
      // Return: decrease customer balance if on credit or update stock
      setCustomers(prev =>
        prev.map(c => (c.id === newInvoice.entityId ? { ...c, currentBalance: Math.max(0, c.currentBalance - newInvoice.grandTotal) } : c))
      );

      if (newInvoice.items && newInvoice.items.length > 0) {
        setInventoryItems(prev =>
          prev.map(invItem => {
            const retMatch = newInvoice.items.find(
              it => (it.itemId && it.itemId === invItem.id) || (it.itemCode && it.itemCode === invItem.code)
            );
            if (retMatch) {
              const newQty = invItem.quantity + (retMatch.quantity || 0);
              return {
                ...invItem,
                quantity: newQty,
                currentStock: newQty,
                status: newQty === 0 ? 'نفذت الكمية' : newQty <= invItem.minStockLevel ? 'منخفض' : 'متوفر',
                lastUpdated: new Date().toISOString().split('T')[0]
              };
            }
            return invItem;
          })
        );
      }
    }
  };

  const handleAddReceiptVoucher = (voucher: PaymentVoucher) => {
    setPaymentVouchers(prev => [voucher, ...prev]);

    // Decrease customer balance
    setCustomers(prev =>
      prev.map(c => (c.id === voucher.entityId ? { ...c, currentBalance: Math.max(0, c.currentBalance - voucher.amount) } : c))
    );

    // Create journal entry for cash/bank receipt
    const je: JournalEntry = {
      id: `JE-RCV-${Date.now().toString().slice(-4)}`,
      entryNumber: `JV-RCV-0${paymentVouchers.length + 10}`,
      date: voucher.date,
      reference: voucher.voucherNumber,
      description: voucher.notes || `تحصيل من العميل ${voucher.entityName}`,
      status: 'POSTED',
      createdBy: 'أمين الصندوق / الخزينة',
      postedAt: new Date().toLocaleString('ar-YE'),
      totalDebit: voucher.amount,
      totalCredit: voucher.amount,
      lines: [
        {
          id: '1',
          accountCode: voucher.paymentMethod === 'CASH' ? '1111' : '1112',
          accountName: voucher.paymentMethod === 'CASH' ? 'الصندوق الرئيسي' : 'بنك التضامن الإسلامي',
          debit: voucher.amount,
          credit: 0,
          currency: 'YER',
          exchangeRate: 1,
          amountInBase: voucher.amount,
          description: 'استلام وتحصيل نقدي / بنكي',
        },
        {
          id: '2',
          accountCode: '1121',
          accountName: 'عملاء القطاع التجاري والحكومي',
          debit: 0,
          credit: voucher.amount,
          currency: 'YER',
          exchangeRate: 1,
          amountInBase: voucher.amount,
          description: `سداد من العميل ${voucher.entityName}`,
        },
      ],
    };

    handleAddJournalEntry(je);
  };

  const handleAddVendor = (newVendor: Vendor) => {
    setVendors(prev => [...prev, newVendor]);
  };

  const handleAddBill = (newBill: Invoice) => {
    setInvoices(prev => [newBill, ...prev]);

    // Increase vendor balance
    setVendors(prev =>
      prev.map(v => (v.id === newBill.entityId ? { ...v, currentBalance: v.currentBalance + newBill.grandTotal } : v))
    );

    // Post bill entry
    const je: JournalEntry = {
      id: `JE-BILL-${Date.now().toString().slice(-4)}`,
      entryNumber: `JV-BILL-0${invoices.length + 10}`,
      date: newBill.date,
      reference: newBill.invoiceNumber,
      description: `إثبات فاتورة مشتريات وتوريد رقم ${newBill.invoiceNumber} من المورد ${newBill.entityName}`,
      status: 'POSTED',
      createdBy: 'قسم المشتريات والمخازن',
      postedAt: new Date().toLocaleString('ar-YE'),
      totalDebit: newBill.grandTotal,
      totalCredit: newBill.grandTotal,
      lines: [
        {
          id: '1',
          accountCode: '5100',
          accountName: 'تكلفة المبيعات والبضاعة المشتراة',
          debit: newBill.subtotal,
          credit: 0,
          currency: 'YER',
          exchangeRate: 1,
          amountInBase: newBill.subtotal,
          description: 'مشتريات بضاعة ومواد',
        },
        ...(newBill.taxTotal > 0 ? [{
          id: '2',
          accountCode: '1130',
          accountName: 'ضريبة القيمة المضافة المدفوعة للموردين',
          debit: newBill.taxTotal,
          credit: 0,
          currency: 'YER' as Currency,
          exchangeRate: 1,
          amountInBase: newBill.taxTotal,
          description: 'ضريبة مدخلات قابلة للخصم',
        }] : []),
        {
          id: '3',
          accountCode: '2110',
          accountName: 'موردو البضائع والخدمات المحلية والدولية',
          debit: 0,
          credit: newBill.grandTotal,
          currency: 'YER',
          exchangeRate: 1,
          amountInBase: newBill.grandTotal,
          description: `استحقاق المورد ${newBill.entityName}`,
        },
      ],
    };

    handleAddJournalEntry(je);
  };

  const handleAddPaymentVoucher = (voucher: PaymentVoucher) => {
    setPaymentVouchers(prev => [voucher, ...prev]);

    // Decrease vendor balance
    setVendors(prev =>
      prev.map(v => (v.id === voucher.entityId ? { ...v, currentBalance: Math.max(0, v.currentBalance - voucher.amount) } : v))
    );

    // Create payment journal entry
    const je: JournalEntry = {
      id: `JE-PAY-${Date.now().toString().slice(-4)}`,
      entryNumber: `JV-PAY-0${paymentVouchers.length + 10}`,
      date: voucher.date,
      reference: voucher.voucherNumber,
      description: voucher.notes || `صرف وسداد للمورد ${voucher.entityName}`,
      status: 'POSTED',
      createdBy: 'الإدارة المالية - الصرف',
      postedAt: new Date().toLocaleString('ar-YE'),
      totalDebit: voucher.amount,
      totalCredit: voucher.amount,
      lines: [
        {
          id: '1',
          accountCode: '2110',
          accountName: 'موردو البضائع والخدمات المحلية والدولية',
          debit: voucher.amount,
          credit: 0,
          currency: 'YER',
          exchangeRate: 1,
          amountInBase: voucher.amount,
          description: `سداد مستحقات المورد ${voucher.entityName}`,
        },
        {
          id: '2',
          accountCode: voucher.paymentMethod === 'CASH' ? '1111' : '1112',
          accountName: voucher.paymentMethod === 'CASH' ? 'الصندوق الرئيسي' : 'بنك التضامن الإسلامي',
          debit: 0,
          credit: voucher.amount,
          currency: 'YER',
          exchangeRate: 1,
          amountInBase: voucher.amount,
          description: 'صرف بنكي / نقدي',
        },
      ],
    };

    handleAddJournalEntry(je);
  };

  const handleAddFixedAsset = (newAsset: FixedAsset) => {
    setFixedAssets(prev => [...prev, newAsset]);
  };

  const handleRunDepreciation = (journalEntry: JournalEntry, updatedAssets: FixedAsset[]) => {
    setFixedAssets(updatedAssets);
    handleAddJournalEntry(journalEntry);
  };

  const handleAddCostCenter = (newCostCenter: CostCenter) => {
    setCostCenters(prev => [...prev, newCostCenter]);
  };

  const handleAddProfitCenter = (newProfitCenter: ProfitCenter) => {
    setProfitCenters(prev => [...prev, newProfitCenter]);
  };

  // --- Expenses & Revenues Dual Control Handlers ---
  const handleAddDualControlVoucher = (newVoucher: DualControlVoucher) => {
    setDualControlVouchers(prev => [newVoucher, ...prev]);
    recordTransaction();

    // Auto-generate in-app notification for manager / accountant
    const newNotif: AppNotification = {
      id: `notif-${Date.now()}`,
      title: `طلب اعتماد سند: ${newVoucher.voucherNumber}`,
      message: `تم إنشاء سند ${newVoucher.type === 'PAYMENT' ? 'صرف مصروفات' : 'قبض إيرادات'} بمبلغ ${newVoucher.amount.toLocaleString()} ${newVoucher.currency} لصالح ${newVoucher.beneficiaryOrPayer} بواسطة ${newVoucher.createdBy.name}. بانتظار الاعتماد.`,
      type: 'FINANCIAL',
      priority: 'HIGH',
      timestamp: new Date().toISOString(),
      isRead: false,
      isArchived: false,
      targetModule: 'expenses-revenues',
      targetId: newVoucher.id,
      actionLabel: 'مراجعة واعتماد السند',
      sender: {
        name: newVoucher.createdBy.name,
        role: newVoucher.createdBy.role,
      },
      channels: ['IN_APP', 'EMAIL', 'WHATSAPP'],
    };
    setNotifications(prev => [newNotif, ...prev]);
  };

  const handleUpdateVoucherStatus = (
    voucherId: string, 
    newStatus: VoucherWorkflowStatus, 
    approverData?: DualControlVoucher['approvedBy'],
    rejectionReason?: string
  ) => {
    let affectedVoucher: DualControlVoucher | undefined;

    setDualControlVouchers(prev =>
      prev.map(v => {
        if (v.id === voucherId) {
          const updated: DualControlVoucher = {
            ...v,
            workflowStatus: newStatus,
            approvedBy: approverData || v.approvedBy,
            approvedAt: newStatus === 'APPROVED' || newStatus === 'POSTED' ? new Date().toISOString() : v.approvedAt,
            approvalNotes: rejectionReason !== undefined ? rejectionReason : v.approvalNotes,
          };
          affectedVoucher = updated;
          return updated;
        }
        return v;
      })
    );

    recordTransaction();

    if (affectedVoucher) {
      // If approved or posted, post automatic journal entry to GL
      if (newStatus === 'APPROVED' || newStatus === 'POSTED') {
        const v = affectedVoucher;
        const entryId = `JV-EXP-${Date.now().toString().slice(-4)}`;
        const debitAccountCode = v.type === 'PAYMENT' ? v.accountCode : v.treasuryOrBankCode;
        const debitAccountName = v.type === 'PAYMENT' ? v.accountName : v.treasuryOrBankName;
        const creditAccountCode = v.type === 'PAYMENT' ? v.treasuryOrBankCode : v.accountCode;
        const creditAccountName = v.type === 'PAYMENT' ? v.treasuryOrBankName : v.accountName;

        const newEntry: JournalEntry = {
          id: `je-${Date.now()}`,
          entryNumber: entryId,
          date: v.date,
          reference: v.voucherNumber,
          description: `${v.type === 'PAYMENT' ? 'سند صرف مصروفات معتمد' : 'سند قبض إيرادات معتمد'} (${v.voucherNumber}) - ${v.beneficiaryOrPayer} - ${v.description}`,
          lines: [
            {
              id: `jel-${Date.now()}-1`,
              accountCode: debitAccountCode,
              accountName: debitAccountName,
              description: v.type === 'PAYMENT' ? `مصروف: ${v.description}` : `إيداع نقدية/بنك: ${v.beneficiaryOrPayer}`,
              debit: v.amount,
              credit: 0,
              currency: v.currency,
              exchangeRate: v.exchangeRate || 1,
              amountInBase: v.amountInBase || v.amount,
              costCenterId: v.costCenterId
            },
            {
              id: `jel-${Date.now()}-2`,
              accountCode: creditAccountCode,
              accountName: creditAccountName,
              description: v.type === 'PAYMENT' ? `سداد من الخزينة/البنك: ${v.beneficiaryOrPayer}` : `إيراد: ${v.description}`,
              debit: 0,
              credit: v.amount,
              currency: v.currency,
              exchangeRate: v.exchangeRate || 1,
              amountInBase: v.amountInBase || v.amount,
              costCenterId: v.costCenterId
            }
          ],
          totalDebit: v.amount,
          totalCredit: v.amount,
          status: 'POSTED',
          postedAt: new Date().toISOString(),
          createdBy: profile?.displayName || user?.displayName || 'مدير النظام'
        };

        handleAddJournalEntry(newEntry);
      }

      // Add Notification
      const statusLabel = newStatus === 'APPROVED' ? 'تمت الموافقة والاعتماد' : newStatus === 'REJECTED' ? 'تم الرفض' : 'تم التحديث';
      const notif: AppNotification = {
        id: `notif-${Date.now()}`,
        title: `تحديث حالة سند ${affectedVoucher.voucherNumber}: ${statusLabel}`,
        message: `${statusLabel} لسند بمبلغ ${affectedVoucher.amount.toLocaleString()} ${affectedVoucher.currency} للجهة: ${affectedVoucher.beneficiaryOrPayer}. ${rejectionReason ? `الملاحظات: ${rejectionReason}` : ''}`,
        type: 'FINANCIAL',
        priority: newStatus === 'APPROVED' || newStatus === 'REJECTED' ? 'HIGH' : 'MEDIUM',
        timestamp: new Date().toISOString(),
        isRead: false,
        isArchived: false,
        targetModule: 'expenses-revenues',
        targetId: affectedVoucher.id,
        actionLabel: 'عرض تفاصيل السند',
        sender: {
          name: profile?.displayName || user?.displayName || 'المدير المالي',
          role: profile?.role || 'ADMIN'
        },
        channels: ['IN_APP', 'WHATSAPP']
      };
      setNotifications(prev => [notif, ...prev]);
    }
  };

  const handleAddVoucherComment = (voucherId: string, commentText: string) => {
    const newComment = {
      id: `comm-${Date.now()}`,
      userId: user?.uid || 'usr-1',
      userName: profile?.displayName || user?.displayName || 'مدير النظام',
      role: profile?.role || 'ADMIN',
      text: commentText,
      createdAt: new Date().toISOString()
    };

    setDualControlVouchers(prev =>
      prev.map(v => {
        if (v.id === voucherId) {
          return {
            ...v,
            comments: [...(v.comments || []), newComment]
          };
        }
        return v;
      })
    );
  };

  const handleAddDailyExpense = (item: DailyExpenseItem) => {
    setDailyExpenses(prev => [item, ...prev]);
    recordTransaction();

    // Update department spent amounts
    setExpenseDepartments(prev => prev.map(d => {
      if (d.id === item.departmentId) {
        return {
          ...d,
          spentThisMonth: (d.spentThisMonth || 0) + item.amountInBase,
          spentYTD: (d.spentYTD || 0) + item.amountInBase,
        };
      }
      return d;
    }));

    // Automatically record General Ledger Journal Entry for the Daily Expense
    const je: JournalEntry = {
      id: `JE-DAY-${Date.now()}`,
      entryNumber: `JV-DAY-0${journalEntries.length + 10}`,
      date: item.date,
      reference: item.receiptNumber || item.voucherNumber,
      description: `صرف مصروف ونثريات يومية (${item.voucherNumber}) - قسم ${item.departmentName} - ${item.title} - ${item.beneficiary}`,
      status: 'POSTED',
      createdBy: item.paidBy,
      postedAt: new Date().toISOString(),
      totalDebit: item.amountInBase,
      totalCredit: item.amountInBase,
      lines: [
        {
          id: `jel-${Date.now()}-1`,
          accountCode: item.expenseAccountCode,
          accountName: item.expenseAccountName,
          description: `مصروف ونثرية: ${item.title} (${item.departmentName})`,
          debit: item.amount,
          credit: 0,
          currency: item.currency,
          exchangeRate: item.exchangeRate || 1,
          amountInBase: item.amountInBase,
          costCenterId: item.costCenterId,
        },
        {
          id: `jel-${Date.now()}-2`,
          accountCode: item.pettyCashAccountCode,
          accountName: item.pettyCashAccountName,
          description: `صرف من صندوق النثريات للمستفيد ${item.beneficiary}`,
          debit: 0,
          credit: item.amount,
          currency: item.currency,
          exchangeRate: item.exchangeRate || 1,
          amountInBase: item.amountInBase,
          costCenterId: item.costCenterId,
        }
      ]
    };
    handleAddJournalEntry(je);
  };

  const handleAddExpenseDepartment = (dept: ExpenseDepartment) => {
    setExpenseDepartments(prev => [...prev, dept]);
    recordTransaction();
  };

  // --- Internal Notifications & Inbox Handlers ---
  const handleMarkNotificationAsRead = (id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
  };

  const handleMarkAllNotificationsAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
  };

  const handleArchiveNotification = (id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, isArchived: true } : n));
  };

  const handleDeleteNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const handleAddNotification = (notif: AppNotification) => {
    setNotifications(prev => [notif, ...prev]);
  };

  if (showSplashScreen) {
    return <SplashScreen onFinish={handleSplashFinish} durationMs={1600} />;
  }

  if (authLoading) {
    return <div className="min-h-screen flex items-center justify-center bg-[#0A2540] text-[#D4AF37] font-bold">جاري تحميل النظام...</div>;
  }

  if (!user) {
    return <LoginForm />;
  }

  // 1. Mandatory Forced Password Change Flow (Security Policy Enforcement)
  if (profile?.mustChangePassword) {
    return (
      <MandatoryPasswordChangeModal
        userEmail={profile.email}
        userDisplayName={profile.displayName || profile.email}
        onPasswordChanged={(newPass) => changePassword(newPass, profile.email)}
        onLogout={logout}
      />
    );
  }

  // 2. Operational Quota Hard Lockout Screen (50 Transactions limit reached)
  if (isLocked) {
    return (
      <AccountLockoutScreen
        userName={profile?.displayName || 'مستخدم النظام'}
        userEmail={profile?.email || ''}
        userRole={profile?.role || 'USER'}
        transactionCount={transactionCount}
        maxTransactions={maxTransactions}
        onAdminUnlock={unlockAccount}
        onLogout={logout}
      />
    );
  }

  // 3. Dedicated Standalone Items App Mode (Direct Link & Market Testing Mode)
  if (activeModule === 'standalone-items') {
    const isIsolated = new URLSearchParams(window.location.search).get('demo') === 'true' || new URLSearchParams(window.location.search).get('isolate') === 'true';
    return (
      <StandaloneItemsApp
        items={inventoryItems}
        setItems={setInventoryItems}
        warehouses={warehouses}
        setWarehouses={setWarehouses}
        companyProfile={companyProfile}
        currency={currency}
        rates={rates}
        onBackToParentSystem={() => setActiveModule('inventory')}
        isIsolatedMode={isIsolated}
      />
    );
  }

  return (
    <div className="flex h-screen w-screen bg-slate-50 text-slate-800 font-sans selection:bg-blue-600 selection:text-white overflow-hidden" dir="rtl">
      {/* Sleek Dark Geometric Sidebar */}
      <Sidebar
        activeModule={activeModule}
        onSelectModule={setActiveModule}
        onOpenAiAssistant={() => setIsAiModalOpen(true)}
        isOpenMobile={isMobileSidebarOpen}
        onCloseMobile={() => setIsMobileSidebarOpen(false)}
        systemModules={systemModules}
      />

      {/* Main Workspace Column */}
      <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden bg-slate-50">
        {/* Top Clean White Header */}
        <Header
          companyProfile={companyProfile}
          currency={currency}
          onCurrencyChange={setCurrency}
          onOpenAiAssistant={() => setIsAiModalOpen(true)}
          onOpenCrudLab={() => setIsCrudLabOpen(true)}
          onOpenGlobalSearch={() => setIsGlobalSearchOpen(true)}
          activeModule={activeModule}
          onNavigate={setActiveModule}
          onToggleMobileSidebar={() => setIsMobileSidebarOpen(prev => !prev)}
          notifications={notifications}
          onMarkNotificationAsRead={handleMarkNotificationAsRead}
          onMarkAllNotificationsAsRead={handleMarkAllNotificationsAsRead}
          onOpenInbox={() => setActiveModule('internal-inbox')}
        />

        {/* Global Offline Status Notification Banner */}
        <OfflineStatusBanner />

        {/* Scrollable Main Workspace */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          <div className="max-w-7xl mx-auto">
            {!hasPermission(activeModule) && activeModule !== 'launchpad' ? (
              <div className="bg-white p-8 sm:p-12 rounded-3xl border border-slate-200 shadow-sm text-center my-8 max-w-xl mx-auto space-y-5">
                <div className="w-16 h-16 bg-rose-50 text-rose-600 rounded-2xl flex items-center justify-center mx-auto shadow-sm border border-rose-100">
                  <ShieldAlert className="w-8 h-8" />
                </div>
                <div>
                  <span className="bg-rose-100 text-rose-800 text-xs font-bold px-3 py-1 rounded-full border border-rose-200 inline-block mb-3">
                    عذراً - وصول غير مصرح به (403 Access Denied)
                  </span>
                  <h2 className="text-2xl font-bold text-slate-900">غير مسموح بالوصول لهذا الموديول</h2>
                  <p className="text-sm text-slate-500 mt-2 leading-relaxed">
                    دورك الحالي في النظام هو <strong className="text-slate-800 font-bold bg-slate-100 px-2 py-0.5 rounded">{profile?.role}</strong>. يتطلب موديول (<span className="font-mono text-blue-600 font-bold">{activeModule}</span>) صلاحيات أعلى غير المتاحة لحسابك الحالي.
                  </p>
                </div>
                <div className="pt-4 border-t border-slate-100 flex items-center justify-center gap-3">
                  <button
                    onClick={() => setActiveModule('launchpad')}
                    className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl transition shadow-md"
                  >
                    العودة للوحة التحكم (Launchpad)
                  </button>
                </div>
              </div>
            ) : (
              <>
                {activeModule === 'launchpad' && (
              <FioriLaunchpad
                accounts={accounts}
                journalEntries={journalEntries}
                customers={customers}
                vendors={vendors}
                fixedAssets={fixedAssets}
                inventoryItems={inventoryItems}
                currency={currency}
                rates={rates}
                onSelectModule={setActiveModule}
                onOpenAiAssistant={() => setIsAiModalOpen(true)}
              />
            )}

            {activeModule === 'sales-management' && (
              <SalesManagementView
                invoices={invoices}
                customers={customers}
                inventoryItems={inventoryItems}
                companyProfile={companyProfile}
                currency={currency}
                rates={rates}
                onAddInvoice={handleAddInvoice}
                onUpdateInventoryQuantity={(itemId, newQty) => {
                  setInventoryItems(prev =>
                    prev.map(i =>
                      i.id === itemId
                        ? {
                            ...i,
                            quantity: newQty,
                            currentStock: newQty,
                            status: newQty <= 0 ? 'نفذت الكمية' : newQty < 10 ? 'منخفض' : 'متوفر',
                          }
                        : i
                    )
                  );
                }}
                onAddJournalEntry={handleAddJournalEntry}
                onNavigateToCustomers={() => setActiveModule('accounts-receivable')}
              />
            )}

            {activeModule === 'pos' && (
              <POSView
                inventoryItems={inventoryItems}
                warehouses={warehouses}
                customers={customers}
                posSessions={posSessions}
                posTransactions={posOrders}
                posOrders={posOrders}
                onAddTransaction={handleAddPosOrder}
                onAddPosOrder={handleAddPosOrder}
                onUpdateInventoryQuantity={(itemId, newQty) => {
                  setInventoryItems(prev =>
                    prev.map(i =>
                      i.id === itemId
                        ? {
                            ...i,
                            quantity: newQty,
                            status: newQty <= 0 ? 'نفذت الكمية' : newQty < 10 ? 'منخفض' : 'متوفر',
                          }
                        : i
                    )
                  );
                }}
                companyProfile={companyProfile}
                currency={currency}
                rates={rates}
              />
            )}

            {activeModule === 'e-invoicing' && (
              <EInvoicingView
                eInvoices={eInvoices}
                onAddEInvoice={handleAddEInvoice}
                companyProfile={companyProfile}
                currency={currency}
                rates={rates}
                customers={customers}
                inventoryItems={inventoryItems}
              />
            )}

            {activeModule === 'procurement' && (
              <ProcurementView
                purchaseRequisitions={purchaseRequisitions}
                purchaseOrders={purchaseOrders}
                goodsReceiptNotes={goodsReceiptNotes}
                inventoryItems={inventoryItems}
                vendors={vendors}
                warehouses={warehouses}
                costCenters={costCenters}
                branches={branches}
                companyProfile={companyProfile}
                onAddPurchaseRequisition={handleAddPurchaseRequisition}
                onAddRequisition={handleAddPurchaseRequisition}
                onUpdatePurchaseRequisition={handleUpdatePurchaseRequisition}
                onAddPurchaseOrder={handleAddPurchaseOrder}
                onUpdatePurchaseOrder={handleUpdatePurchaseOrder}
                onAddGoodsReceiptNote={(grn) => {
                  handleAddGoodsReceipt(grn);
                  // Update inventory stock safely
                  setInventoryItems(prevItems =>
                    prevItems.map(item => {
                      const receivedItem = grn.items.find(gi => gi.itemId === item.id || gi.itemCode === item.code);
                      if (receivedItem) {
                        const qty = Number(receivedItem.receivedQuantity || receivedItem.receivedQty || 0);
                        const current = Number(item.quantity ?? item.currentStock ?? 0);
                        return {
                          ...item,
                          quantity: current + qty,
                          currentStock: current + qty,
                          status: (current + qty) <= 0 ? 'نفذت الكمية' : (current + qty) < 10 ? 'منخفض' : 'متوفر',
                        };
                      }
                      return item;
                    })
                  );
                }}
                onAddGoodsReceipt={(grn) => {
                  handleAddGoodsReceipt(grn);
                  setInventoryItems(prevItems =>
                    prevItems.map(item => {
                      const receivedItem = grn.items.find(gi => gi.itemId === item.id || gi.itemCode === item.code);
                      if (receivedItem) {
                        const qty = Number(receivedItem.receivedQuantity || receivedItem.receivedQty || 0);
                        const current = Number(item.quantity ?? item.currentStock ?? 0);
                        return {
                          ...item,
                          quantity: current + qty,
                          currentStock: current + qty,
                          status: (current + qty) <= 0 ? 'نفذت الكمية' : (current + qty) < 10 ? 'منخفض' : 'متوفر',
                        };
                      }
                      return item;
                    })
                  );
                }}
                onAddJournalEntry={handleAddJournalEntry}
                currency={currency}
                rates={rates}
              />
            )}

            {activeModule === 'hr-payroll' && (
              <HRPayrollView
                employees={employees}
                payrollRuns={payrollRuns}
                leaveRequests={leaveRequests}
                attendanceRecords={attendanceRecords}
                costCenters={costCenters}
                branches={branches}
                currency={currency}
                rates={rates}
                companyProfile={companyProfile}
                onAddEmployee={handleAddEmployee}
                onUpdateEmployee={handleUpdateEmployee}
                onDeleteEmployee={handleDeleteEmployee}
                onAddPayrollRun={handleAddPayrollRun}
                onPostPayrollToGL={handlePostPayrollToGL}
                onApproveLeave={handleApproveLeave}
                onRejectLeave={handleRejectLeave}
                onAddLeaveRequest={handleAddLeaveRequest}
                onAddAttendanceRecord={handleAddAttendanceRecord}
              />
            )}

            {activeModule === 'general-ledger' && (
              <GeneralLedgerView
                accounts={accounts}
                journalEntries={journalEntries}
                costCenters={costCenters}
                profitCenters={profitCenters}
                onAddJournalEntry={handleAddJournalEntry}
                onReverseEntry={handleReverseEntry}
                currency={currency}
                rates={rates}
              />
            )}

            {activeModule === 'chart-of-accounts' && (
              <ChartOfAccountsView
                accounts={accounts}
                onAddAccount={handleAddAccount}
                currency={currency}
                rates={rates}
              />
            )}

            {activeModule === 'inventory' && (
              <InventoryManagementView
                items={inventoryItems}
                setItems={setInventoryItems}
                warehouses={warehouses}
                setWarehouses={setWarehouses}
                movements={stockMovements}
                setMovements={setStockMovements}
                onAddJournalEntry={handleAddJournalEntry}
                onNavigateToGeneralLedger={() => setActiveModule('general-ledger')}
                currency={currency}
                rates={rates}
              />
            )}

            {activeModule === 'accounts-receivable' && (
              <AccountsReceivableView
                customers={customers}
                setCustomers={setCustomers}
                invoices={invoices}
                paymentVouchers={paymentVouchers}
                inventoryItems={inventoryItems}
                companyProfile={companyProfile}
                onAddCustomer={handleAddCustomer}
                onAddInvoice={handleAddInvoice}
                onAddReceiptVoucher={handleAddReceiptVoucher}
                onUpdateInventoryQuantity={(itemId, newQty) => {
                  setInventoryItems(prev =>
                    prev.map(i =>
                      i.id === itemId
                        ? {
                            ...i,
                            quantity: newQty,
                            status: newQty <= 0 ? 'نفذت الكمية' : newQty < 10 ? 'منخفض' : 'متوفر',
                          }
                        : i
                    )
                  );
                }}
                currency={currency}
                rates={rates}
              />
            )}

            {activeModule === 'accounts-payable' && (
              <AccountsPayableView
                vendors={vendors}
                setVendors={setVendors}
                invoices={invoices}
                paymentVouchers={paymentVouchers}
                costCenters={costCenters}
                onAddVendor={handleAddVendor}
                onAddBill={handleAddBill}
                onAddPaymentVoucher={handleAddPaymentVoucher}
                currency={currency}
                rates={rates}
                companyProfile={companyProfile}
              />
            )}

            {activeModule === 'fixed-assets' && (
              <FixedAssetsView
                fixedAssets={fixedAssets}
                costCenters={costCenters}
                onAddFixedAsset={handleAddFixedAsset}
                onRunDepreciation={handleRunDepreciation}
                currency={currency}
                rates={rates}
              />
            )}

            {activeModule === 'controlling' && (
              <CostControllingView
                costCenters={costCenters}
                profitCenters={profitCenters}
                onAddCostCenter={handleAddCostCenter}
                onAddProfitCenter={handleAddProfitCenter}
                currency={currency}
                rates={rates}
              />
            )}

            {activeModule === 'budgeting' && (
              <BudgetingView
                accounts={accounts}
                journalEntries={journalEntries}
                companyProfile={companyProfile}
                currency={currency}
                rates={rates}
                onNavigateToGeneralLedger={() => setActiveModule('general-ledger')}
                onDispatchNotification={(title, message, type) => {
                  setNotifications(prev => [
                    {
                      id: `notif-${Date.now()}`,
                      title,
                      message,
                      type,
                      priority: 'MEDIUM',
                      timestamp: new Date().toISOString(),
                      isRead: false,
                      isArchived: false,
                      channels: ['IN_APP'],
                    },
                    ...prev,
                  ]);
                }}
              />
            )}

            {activeModule === 'financial-reports' && (
              <FinancialReportsView
                accounts={accounts}
                journalEntries={journalEntries}
                companyProfile={companyProfile}
                currency={currency}
                rates={rates}
              />
            )}

            {activeModule === 'bank-reconciliation' && (
              <BankReconciliationView
                bankAccounts={bankAccounts}
                onAddJournalEntry={handleAddJournalEntry}
                currency={currency}
                rates={rates}
              />
            )}

            {activeModule === 'foreign-exchange' && (
              <ForeignExchangeView
                companyProfile={companyProfile}
                fxVaults={fxVaults}
                onUpdateVaults={setFxVaults}
                fxDeals={fxDeals}
                onAddFxDeal={handleAddFxDeal}
                remittances={remittances}
                onAddRemittance={handleAddRemittance}
                onUpdateRemittanceStatus={handleUpdateRemittanceStatus}
                onAddJournalEntry={handleAddJournalEntry}
              />
            )}

            {activeModule === 'expenses-revenues' && (
              <ExpensesRevenuesView
                vouchers={dualControlVouchers}
                expenseCategories={expenseCategories}
                revenueCategories={revenueCategories}
                departments={expenseDepartments}
                dailyExpenses={dailyExpenses}
                costCenters={costCenters}
                accounts={accounts}
                currency={currency}
                rates={rates}
                companyProfile={companyProfile}
                onAddVoucher={handleAddDualControlVoucher}
                onUpdateVoucherStatus={handleUpdateVoucherStatus}
                onAddVoucherComment={handleAddVoucherComment}
                onAddExpenseCategory={(cat) => setExpenseCategories(prev => [...prev, cat])}
                onAddRevenueCategory={(cat) => setRevenueCategories(prev => [...prev, cat])}
                onAddDailyExpense={handleAddDailyExpense}
                onAddDepartment={handleAddExpenseDepartment}
                onNavigateToGeneralLedger={() => setActiveModule('general-ledger')}
              />
            )}

            {activeModule === 'internal-inbox' && (
              <InternalInboxView
                notifications={notifications}
                onMarkAsRead={handleMarkNotificationAsRead}
                onMarkAllAsRead={handleMarkAllNotificationsAsRead}
                onArchive={handleArchiveNotification}
                onDelete={handleDeleteNotification}
                onAddNotification={handleAddNotification}
                onNavigateToModule={(mod, targetId) => setActiveModule(mod)}
              />
            )}

            {activeModule === 'settings' && (
              <SettingsView
                companyProfile={companyProfile}
                onUpdateCompanyProfile={handleUpdateCompanyProfile}
                branches={branches}
                onUpdateBranches={handleUpdateBranches}
                currenciesConfig={currenciesConfig}
                onUpdateCurrenciesConfig={handleUpdateCurrenciesConfig}
                fiscalPeriods={fiscalPeriods}
                onUpdateFiscalPeriods={handleUpdateFiscalPeriods}
                systemModules={systemModules}
                onUpdateSystemModules={handleUpdateSystemModules}
                warehouses={warehouses}
                costCenters={costCenters}
                journalEntries={journalEntries}
                invoices={invoices}
                paymentVouchers={paymentVouchers}
                posOrders={posOrders}
                stockMovements={stockMovements}
                purchaseOrders={purchaseOrders}
                payrollRuns={payrollRuns}
                onUpdateActiveData={(updated) => {
                  if (updated.journalEntries !== undefined) setJournalEntries(updated.journalEntries);
                  if (updated.invoices !== undefined) setInvoices(updated.invoices);
                  if (updated.paymentVouchers !== undefined) setPaymentVouchers(updated.paymentVouchers);
                  if (updated.posOrders !== undefined) setPosOrders(updated.posOrders);
                  if (updated.stockMovements !== undefined) setStockMovements(updated.stockMovements);
                  if (updated.purchaseOrders !== undefined) setPurchaseOrders(updated.purchaseOrders);
                  if (updated.payrollRuns !== undefined) setPayrollRuns(updated.payrollRuns);
                }}
                currency={currency}
                rates={rates}
                onResetAllData={handleResetAllData}
                onExportFullBackup={handleExportFullBackup}
                onImportFullBackup={handleImportFullBackup}
              />
            )}

            {activeModule === 'role-management' && (
              <RoleManagementView />
            )}
              </>
            )}
          </div>
          
          <SystemFooterCopyright />
        </main>
      </div>

      {/* AI Assistant Modal (Gemini Copilot) */}
      <AiAssistantModal
        isOpen={isAiModalOpen}
        onClose={() => setIsAiModalOpen(false)}
        accounts={accounts}
        journalEntries={journalEntries}
        companyProfile={companyProfile}
        currency={currency}
      />

      {/* CRUD & Persistence Testing Lab Modal */}
      <CrudTestingLabModal
        isOpen={isCrudLabOpen}
        onClose={() => setIsCrudLabOpen(false)}
        employees={employees}
        customers={customers}
        vendors={vendors}
        invoices={invoices}
        paymentVouchers={paymentVouchers}
        inventoryItems={inventoryItems}
        journalEntries={journalEntries}
        fixedAssets={fixedAssets}
        costCenters={costCenters}
        leaveRequests={leaveRequests}
        attendanceRecords={attendanceRecords}
        currency={currency}
        rates={rates}
        onAddEmployee={handleAddEmployee}
        onDeleteEmployee={handleDeleteEmployee}
        onAddCustomer={handleAddCustomer}
        onAddVendor={handleAddVendor}
        onAddInvoice={handleAddInvoice}
        onAddPaymentVoucher={handleAddPaymentVoucher}
        onAddInventoryItem={(newItem) => setInventoryItems(prev => [newItem, ...prev])}
        onAddJournalEntry={handleAddJournalEntry}
        onAddFixedAsset={handleAddFixedAsset}
        onNavigate={setActiveModule}
        onResetAllData={handleResetAllData}
      />

      {/* Global System-Wide Search Modal */}
      <GlobalSearchModal
        isOpen={isGlobalSearchOpen}
        onClose={() => setIsGlobalSearchOpen(false)}
        onNavigate={(mod) => {
          setActiveModule(mod);
          setIsGlobalSearchOpen(false);
        }}
        accounts={accounts}
        customers={customers}
        vendors={vendors}
        inventoryItems={inventoryItems}
        purchaseOrders={purchaseOrders}
        purchaseRequisitions={purchaseRequisitions}
        invoices={invoices}
        employees={employees}
        currency={currency}
      />

      {/* Floating Smart ERP Voice Assistant Widget */}
      <VoiceCommandWidget
        onSelectModule={setActiveModule}
        onOpenAiAssistant={() => setIsAiModalOpen(true)}
      />
    </div>
  );
}
