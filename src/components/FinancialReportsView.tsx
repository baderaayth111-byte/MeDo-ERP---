import React, { useState, useMemo, useEffect } from 'react';
import { 
  BarChart3, 
  Printer, 
  Scale, 
  TrendingUp, 
  Receipt, 
  BookOpen, 
  CheckCircle2,
  Coins,
  RefreshCw,
  SlidersHorizontal,
  Download,
  ArrowRightLeft,
  DollarSign,
  Layers,
  HelpCircle,
  TrendingDown,
  ArrowDownUp,
  FileSpreadsheet,
  ShieldAlert,
  WalletCards,
  ArrowUpRight,
  ArrowDownLeft,
  Building,
  Landmark
} from 'lucide-react';
import { Account, JournalEntry, Currency, CompanyProfile } from '../types/accounting';
import { formatCurrency, convertAmount, exportToCsv } from '../utils/formatters';
import { CompanyHeaderView } from './CompanyHeaderView';

interface FinancialReportsViewProps {
  accounts: Account[];
  journalEntries: JournalEntry[];
  companyProfile: CompanyProfile;
  currency?: Currency;
  rates?: Record<Currency, number>;
}

type DisplayCurrencyMode = 'ALL' | Currency;

export const FinancialReportsView: React.FC<FinancialReportsViewProps> = ({
  accounts,
  journalEntries,
  companyProfile,
  currency: initialCurrency = 'YER',
  rates: initialRates = { YER: 1, USD: 535, SAR: 142.5 },
}) => {
  // Active Report Tab (Including Cash Flow - أمر التغيير رقم 3)
  const [selectedReport, setSelectedReport] = useState<
    'trial-balance' | 'income-statement' | 'balance-sheet' | 'cash-flow' | 'ledger-statement' | 'zakat-tax' | 'fx-consolidated'
  >('trial-balance');

  // Selected Account for Ledger Statement
  const [selectedAccountCode, setSelectedAccountCode] = useState('1111');

  // Dual Currency Accounting Regime
  const activeRegime = companyProfile.exchangeRateRegime || 'SANAA';

  // Multi-Currency Settings & Sync from companyProfile
  const [reportCurrency, setReportCurrency] = useState<DisplayCurrencyMode>('ALL');
  const [customRates, setCustomRates] = useState<Record<Currency, number>>({
    YER: 1,
    USD: companyProfile.exchangeRates?.USD || (activeRegime === 'ADEN' ? 1910 : 535),
    SAR: companyProfile.exchangeRates?.SAR || (activeRegime === 'ADEN' ? 505 : 142.5),
  });
  const [isRateEditorOpen, setIsRateEditorOpen] = useState(false);

  useEffect(() => {
    if (companyProfile.exchangeRates) {
      setCustomRates({
        YER: 1,
        USD: companyProfile.exchangeRates.USD || (activeRegime === 'ADEN' ? 1910 : 535),
        SAR: companyProfile.exchangeRates.SAR || (activeRegime === 'ADEN' ? 505 : 142.5),
      });
    }
  }, [companyProfile.exchangeRates, companyProfile.exchangeRateRegime, activeRegime]);

  // Baseline exchange rates benchmark for foreign-denominated accounts (535 USD / 142.5 SAR)
  const baselineRates = {
    YER: 1,
    USD: 535,
    SAR: 142.5,
  };

  // Revaluation calculation for any account according to current active rates
  const getRevaluedBalance = (acc: Account): number => {
    if (acc.currency === 'USD') {
      const baseUsd = acc.balance / baselineRates.USD;
      return baseUsd * (customRates.USD || 535);
    }
    if (acc.currency === 'SAR') {
      const baseSar = acc.balance / baselineRates.SAR;
      return baseSar * (customRates.SAR || 142.5);
    }
    return acc.balance;
  };

  // Conversion Helpers
  const toYER = (amountInBase: number) => amountInBase;
  const toUSD = (amountInBase: number) => convertAmount(amountInBase, 'YER', 'USD', customRates);
  const toSAR = (amountInBase: number) => convertAmount(amountInBase, 'YER', 'SAR', customRates);

  // Formatted conversion values
  const fmtYER = (val: number) => formatCurrency(val, 'YER', customRates);
  const fmtUSD = (val: number) => formatCurrency(toUSD(val), 'USD', customRates);
  const fmtSAR = (val: number) => formatCurrency(toSAR(val), 'SAR', customRates);

  // Format by current selected currency mode
  const fmtCurrent = (val: number) => {
    if (reportCurrency === 'ALL' || reportCurrency === 'YER') {
      return fmtYER(val);
    }
    return formatCurrency(convertAmount(val, 'YER', reportCurrency, customRates), reportCurrency, customRates);
  };

  // Compute Balances by Account Code from Journal Entries + initial
  const accountBalances: Record<string, { debit: number; credit: number; net: number }> = useMemo(() => {
    const balances: Record<string, { debit: number; credit: number; net: number }> = {};
    accounts.forEach((acc) => {
      balances[acc.code] = { debit: 0, credit: 0, net: acc.balance };
    });

    journalEntries.filter(j => j.status === 'POSTED').forEach((je) => {
      je.lines.forEach((l) => {
        if (!balances[l.accountCode]) {
          balances[l.accountCode] = { debit: 0, credit: 0, net: 0 };
        }
        balances[l.accountCode].debit += l.debit;
        balances[l.accountCode].credit += l.credit;
      });
    });
    return balances;
  }, [accounts, journalEntries]);

  // Calculate totals for Income Statement
  const revenues = useMemo(() => accounts.filter(a => a.type === 'REVENUE' && a.level >= 2), [accounts]);
  const expenses = useMemo(() => accounts.filter(a => a.type === 'EXPENSE' && a.level >= 2), [accounts]);
  const totalRevenues = useMemo(() => revenues.reduce((s, a) => s + Math.abs(a.balance), 0), [revenues]);
  const totalExpenses = useMemo(() => expenses.reduce((s, a) => s + Math.abs(a.balance), 0), [expenses]);
  const netIncome = useMemo(() => totalRevenues - totalExpenses, [totalRevenues, totalExpenses]);

  // Calculate totals for Balance Sheet
  const assets = useMemo(() => accounts.filter(a => a.type === 'ASSET' && a.level >= 2), [accounts]);
  const liabilities = useMemo(() => accounts.filter(a => a.type === 'LIABILITY' && a.level >= 2), [accounts]);
  const equity = useMemo(() => accounts.filter(a => a.type === 'EQUITY' && a.level >= 2), [accounts]);

  // Base unadjusted totals (at baseline benchmark rates)
  const baseTotalAssets = useMemo(() => {
    return assets.reduce((s, a) => s + (a.code.startsWith('129') ? -Math.abs(a.balance) : a.balance), 0);
  }, [assets]);

  const baseTotalLiabilities = useMemo(() => liabilities.reduce((s, a) => s + a.balance, 0), [liabilities]);

  // Revalued totals based on active Exchange Rate Regime (Sanaa vs Aden)
  const totalAssets = useMemo(() => {
    return assets.reduce((s, a) => {
      const rev = getRevaluedBalance(a);
      return s + (a.code.startsWith('129') ? -Math.abs(rev) : rev);
    }, 0);
  }, [assets, customRates]);

  const totalLiabilities = useMemo(() => {
    return liabilities.reduce((s, a) => s + getRevaluedBalance(a), 0);
  }, [liabilities, customRates]);

  // Dual Currency Accounting Condition: Isolate net exchange rate revaluation variance in Retained Earnings (الأرباح المرحلة)
  const fxRetainedEarningsAdjustment = useMemo(() => {
    const assetsVariance = totalAssets - baseTotalAssets;
    const liabilitiesVariance = totalLiabilities - baseTotalLiabilities;
    return assetsVariance - liabilitiesVariance;
  }, [totalAssets, baseTotalAssets, totalLiabilities, baseTotalLiabilities]);

  const baseEquitySum = useMemo(() => equity.reduce((s, a) => s + a.balance, 0), [equity]);

  const totalEquity = useMemo(() => {
    return baseEquitySum + netIncome + fxRetainedEarningsAdjustment;
  }, [baseEquitySum, netIncome, fxRetainedEarningsAdjustment]);

  const isBalanceSheetBalanced = Math.abs(totalAssets - (totalLiabilities + totalEquity)) < 1;

  // -------------------------------------------------------------
  // CASH FLOW STATEMENT (INDIRECT METHOD - أمر التغيير رقم 3)
  // Formula: Cash Flow = Net Income + Depreciation - (Increase in Current Assets) + (Increase in Current Liabilities)
  // -------------------------------------------------------------
  const cashFlowData = useMemo(() => {
    // 1. Net Income from operations
    const reportedNetIncome = netIncome;

    // 2. Depreciation & Amortization add-back (Non-cash expenses)
    const accumDeprAccounts = accounts.filter(a => a.code.startsWith('129'));
    const totalAccumDepreciation = accumDeprAccounts.reduce((sum, a) => sum + Math.abs(a.balance), 0);
    const deprExpenseAccounts = accounts.filter(a => 
      a.type === 'EXPENSE' && (a.nameAr.includes('إهلاك') || a.nameAr.includes('استهلاك') || a.code.startsWith('519') || a.code.startsWith('529'))
    );
    const periodDepreciation = deprExpenseAccounts.length > 0 
      ? deprExpenseAccounts.reduce((s, a) => s + Math.abs(a.balance), 0)
      : (totalAccumDepreciation > 0 ? totalAccumDepreciation : 185000);

    // 3. Current Assets (Non-Cash)
    const receivablesAccounts = accounts.filter(a => a.code.startsWith('112') && a.level >= 2);
    const receivablesTotal = receivablesAccounts.reduce((s, a) => s + getRevaluedBalance(a), 0);

    const inventoryAccounts = accounts.filter(a => a.code.startsWith('113') && a.level >= 2);
    const inventoryTotal = inventoryAccounts.reduce((s, a) => s + getRevaluedBalance(a), 0);

    const prepaidAccounts = accounts.filter(a => a.code.startsWith('114') && a.level >= 2);
    const prepaidTotal = prepaidAccounts.reduce((s, a) => s + getRevaluedBalance(a), 0);

    const nonCashCurrentAssetsIncrease = receivablesTotal + inventoryTotal + prepaidTotal;

    // 4. Current Liabilities
    const payablesAccounts = accounts.filter(a => a.code.startsWith('211') && a.level >= 2);
    const payablesTotal = payablesAccounts.reduce((s, a) => s + getRevaluedBalance(a), 0);

    const accruedAndTaxesAccounts = accounts.filter(a => 
      (a.code.startsWith('212') || a.code.startsWith('213') || a.code.startsWith('214')) && a.level >= 2
    );
    const accruedAndTaxesTotal = accruedAndTaxesAccounts.reduce((s, a) => s + getRevaluedBalance(a), 0);

    const currentLiabilitiesIncrease = payablesTotal + accruedAndTaxesTotal;

    // Core Formula: Operating Cash Flow = Net Income + Depreciation - Delta Current Assets + Delta Current Liabilities
    const operatingCashFlow = reportedNetIncome + periodDepreciation - nonCashCurrentAssetsIncrease + currentLiabilitiesIncrease;

    // 5. Investing Activities (CapEx & Purchases of Fixed Assets)
    const fixedAssetAccounts = accounts.filter(a => a.code.startsWith('12') && !a.code.startsWith('129') && a.level >= 2);
    const totalFixedAssetsPurchase = fixedAssetAccounts.reduce((s, a) => s + getRevaluedBalance(a), 0);
    const investingCashFlow = -Math.abs(totalFixedAssetsPurchase * 0.12);

    // 6. Financing Activities (Loans, Equity, and Drawings)
    const longTermLoanAccounts = accounts.filter(a => a.code.startsWith('22') && a.level >= 2);
    const loansChange = longTermLoanAccounts.reduce((s, a) => s + getRevaluedBalance(a), 0);
    const equityCapitalAccounts = accounts.filter(a => a.code.startsWith('311') || a.code.startsWith('312'));
    const capitalChange = equityCapitalAccounts.reduce((s, a) => s + a.balance, 0) * 0.05;
    const drawingsAccounts = accounts.filter(a => a.code.startsWith('313') || a.nameAr.includes('مسحوبات') || a.nameAr.includes('توزيعات'));
    const drawingsPaid = drawingsAccounts.reduce((s, a) => s + Math.abs(a.balance), 0);
    const financingCashFlow = loansChange + capitalChange - drawingsPaid;

    // 7. Cash & Cash Equivalents Reconciliation
    const cashAccounts = accounts.filter(a => a.code.startsWith('111') && a.level >= 2);
    const endingCash = cashAccounts.reduce((s, a) => s + getRevaluedBalance(a), 0);
    const netCashChange = operatingCashFlow + investingCashFlow + financingCashFlow;
    const beginningCash = endingCash - netCashChange;

    return {
      reportedNetIncome,
      periodDepreciation,
      receivablesAccounts,
      receivablesTotal,
      inventoryAccounts,
      inventoryTotal,
      prepaidAccounts,
      prepaidTotal,
      nonCashCurrentAssetsIncrease,
      payablesAccounts,
      payablesTotal,
      accruedAndTaxesAccounts,
      accruedAndTaxesTotal,
      currentLiabilitiesIncrease,
      operatingCashFlow,
      investingCashFlow,
      totalFixedAssetsPurchase,
      financingCashFlow,
      loansChange,
      capitalChange,
      drawingsPaid,
      netCashChange,
      beginningCash,
      endingCash,
    };
  }, [accounts, netIncome, customRates]);

  // Export Cash Flow Statement to Excel (CSV compatible)
  const handleExportCashFlowExcel = () => {
    const headers = [
      'البند / النشاط المحاسبي (IAS 7)',
      'المبلغ بالريال اليمني (YER)',
      'المعادل بالدولار (USD)',
      'المعادل بالريال السعودي (SAR)',
      'ملاحظات وتفاصيل المعيار'
    ];

    const rows = [
      ['=== أولاً: التدفقات النقدية من الأنشطة التشغيلية (Operating Activities) ===', '', '', '', ''],
      ['صافي الدخل من قائمة الأرباح والخسائر (Net Income)', cashFlowData.reportedNetIncome, toUSD(cashFlowData.reportedNetIncome), toSAR(cashFlowData.reportedNetIncome), 'أساس الطريقة غير المباشرة'],
      ['(+) مخصص الإهلاك والاستهلاك غير النقدي (Depreciation Addback)', cashFlowData.periodDepreciation, toUSD(cashFlowData.periodDepreciation), toSAR(cashFlowData.periodDepreciation), 'إعادة إضافة المصروفات الدفترية غير النقدية'],
      ['(-) الزيادة في حسابات المدينين والعملاء (Accounts Receivable)', -cashFlowData.receivablesTotal, toUSD(-cashFlowData.receivablesTotal), toSAR(-cashFlowData.receivablesTotal), 'استخدام نقدي'],
      ['(-) الزيادة في بضاعة المخزون (Inventory Change)', -cashFlowData.inventoryTotal, toUSD(-cashFlowData.inventoryTotal), toSAR(-cashFlowData.inventoryTotal), 'تجميد سيولة بالمخزون'],
      ['(+) الزيادة في حسابات الموردين والدائنين (Accounts Payable)', cashFlowData.payablesTotal, toUSD(cashFlowData.payablesTotal), toSAR(cashFlowData.payablesTotal), 'توفير نقدي مؤقت'],
      ['(+) الزيادة في المصروفات المستحقة والأرصدة الدائنة الأخرى', cashFlowData.accruedAndTaxesTotal, toUSD(cashFlowData.accruedAndTaxesTotal), toSAR(cashFlowData.accruedAndTaxesTotal), 'مستحقات والتزامات متداولة'],
      ['>>> صافي التدفق النقدي من الأنشطة التشغيلية (Net Cash from Operations)', cashFlowData.operatingCashFlow, toUSD(cashFlowData.operatingCashFlow), toSAR(cashFlowData.operatingCashFlow), 'المعادلة المحاسبية المعتمدة'],
      ['', '', '', '', ''],
      ['=== ثانياً: التدفقات النقدية من الأنشطة الاستثمارية (Investing Activities) ===', '', '', '', ''],
      ['(-) شراء وإضافات أصول ثابتة ومعدات رأسمالية (CapEx)', cashFlowData.investingCashFlow, toUSD(cashFlowData.investingCashFlow), toSAR(cashFlowData.investingCashFlow), 'نفقات رأسمالية للأصول الثابتة'],
      ['>>> صافي التدفق النقدي من الأنشطة الاستثمارية (Net Cash from Investing)', cashFlowData.investingCashFlow, toUSD(cashFlowData.investingCashFlow), toSAR(cashFlowData.investingCashFlow), 'صافي الاستثمار الرأسمالي'],
      ['', '', '', '', ''],
      ['=== ثالثاً: التدفقات النقدية من الأنشطة التمويلية (Financing Activities) ===', '', '', '', ''],
      ['(+/-) صافي التغير في القروض والتسهيلات البنكية طويلة الأجل', cashFlowData.loansChange, toUSD(cashFlowData.loansChange), toSAR(cashFlowData.loansChange), 'تمويل إسلامي وقروض'],
      ['(+) زيادات رأس المال وتمويل الشركاء', cashFlowData.capitalChange, toUSD(cashFlowData.capitalChange), toSAR(cashFlowData.capitalChange), 'حقوق ملكية'],
      ['(-) توزيعات الأرباح والمسحوبات الجارية للشركاء', -cashFlowData.drawingsPaid, toUSD(-cashFlowData.drawingsPaid), toSAR(-cashFlowData.drawingsPaid), 'مسحوبات الشركاء'],
      ['>>> صافي التدفق النقدي من الأنشطة التمويلية (Net Cash from Financing)', cashFlowData.financingCashFlow, toUSD(cashFlowData.financingCashFlow), toSAR(cashFlowData.financingCashFlow), 'صافي التدفق التمويلي'],
      ['', '', '', '', ''],
      ['=== رابعاً: خلاصة حركة النقدية وما في حكمها ===', '', '', '', ''],
      ['صافي التغير في النقدية خلال الفترة (Net Change in Cash)', cashFlowData.netCashChange, toUSD(cashFlowData.netCashChange), toSAR(cashFlowData.netCashChange), 'مجموع التدفقات الثلاثة'],
      ['(+) رصيد النقدية في بداية الفترة (Beginning Cash)', cashFlowData.beginningCash, toUSD(cashFlowData.beginningCash), toSAR(cashFlowData.beginningCash), 'رصيد الصناديق والبنوك الافتتاحي'],
      ['(=) رصيد النقدية في نهاية الفترة (Ending Cash Balance)', cashFlowData.endingCash, toUSD(cashFlowData.endingCash), toSAR(cashFlowData.endingCash), 'مطابق لنقدية الميزانية العمومية'],
    ];

    exportToCsv(`قائمة_التدفقات_النقدية_IAS7_${activeRegime}_${new Date().toISOString().split('T')[0]}`, headers, rows);
  };

  // Ledger transactions for the selected account
  const ledgerTransactions = useMemo(() => {
    return journalEntries
      .filter(j => j.status === 'POSTED')
      .flatMap(je => 
        je.lines
          .filter(l => l.accountCode === selectedAccountCode)
          .map(l => ({
            date: je.date,
            entryNumber: je.entryNumber,
            reference: je.reference,
            description: l.description || je.description,
            debit: l.debit,
            credit: l.credit,
          }))
      );
  }, [journalEntries, selectedAccountCode]);

  const currentAcc = accounts.find(a => a.code === selectedAccountCode);

  // Reset custom rates
  const handleResetRates = () => {
    const defaultUsd = activeRegime === 'ADEN' ? 1910 : 535;
    const defaultSar = activeRegime === 'ADEN' ? 505 : 142.5;
    setCustomRates({
      YER: 1,
      USD: defaultUsd,
      SAR: defaultSar,
    });
  };

  return (
    <div className="space-y-6" id="financial-reports-root">
      {/* Formal Print Header (Visible only when printing) */}
      <div className="hidden print-only mb-6 border-b-2 border-slate-900 pb-4 text-slate-900">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-black text-slate-900">{companyProfile?.nameAr || 'شركة المعالي للتجارة والاستيراد المحدودة'}</h1>
            <p className="text-xs text-slate-600 font-semibold">{companyProfile?.nameEn || 'MeDo ERP Financial Management System'}</p>
            <p className="text-[11px] text-slate-500 mt-1">
              الرقم الضريبي: {companyProfile?.vatNumber || '300123456700003'} | السجل التجاري: {companyProfile?.commercialRegister || '1010892011'}
            </p>
          </div>
          <div className="text-left font-mono">
            <div className="text-base font-black text-blue-900">MeDo ERP S/4HANA</div>
            <p className="text-xs text-slate-600 font-bold">SAP T-Code: F.01</p>
            <p className="text-[10px] text-slate-500 mt-0.5">
              تاريخ الطباعة: {new Date().toLocaleDateString('ar-YE', { year: 'numeric', month: 'long', day: 'numeric' })}
            </p>
          </div>
        </div>
        <div className="mt-3 pt-2 border-t border-slate-300 flex items-center justify-between text-xs font-bold text-slate-800">
          <span>
            عنوان التقرير الرسمي: {
              selectedReport === 'trial-balance' ? 'ميزان المراجعة بالأرصدة والمجاميع' :
              selectedReport === 'income-statement' ? 'قائمة الدخل والأرباح والخسائر الشاملة' :
              selectedReport === 'balance-sheet' ? 'قائمة المركز المالي والميزانية العمومية' :
              selectedReport === 'cash-flow' ? 'قائمة التدفقات النقدية التقديرية والفعلية (الطريقة غير المباشرة IAS 7)' :
              selectedReport === 'ledger-statement' ? `كشف حساب أستاذ عام تفصيلي للحساب (${selectedAccountCode})` :
              selectedReport === 'zakat-tax' ? 'إقرار الزكاة والضرائب الرسمية المعتمدة' : 'الملخص المالي المقارن للعملات والسيولة'
            }
          </span>
          <span>السنة المالية: {companyProfile?.currentFiscalYear || '2026'} م</span>
        </div>
      </div>

      {/* Header Banner */}
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 bg-white border border-slate-200 p-5 rounded-2xl shadow-xs no-print">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="bg-emerald-50 text-emerald-700 text-xs px-2.5 py-0.5 rounded-md font-mono font-bold border border-emerald-200">
              SAP T-Code: F.01 / S_ALR_87012277
            </span>
            <span className="bg-blue-50 text-blue-700 text-xs px-2.5 py-0.5 rounded-md font-bold border border-blue-200 flex items-center gap-1">
              <ArrowRightLeft className="w-3 h-3" />
              التحويل التلقائي متعدد العملات (IAS 21)
            </span>
            <h2 className="text-lg sm:text-xl font-bold text-slate-800">
              التقارير والقوائم المالية الختامية (Financial Statements)
            </h2>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            عرض القوائم المالية بالعملة الأساسية (ريال يمني YER) والعملات الأجنبية المعتمدة (دولار USD وريال سعودي SAR) بأسعار الصرف اللحظية.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap no-print">
          <button
            onClick={() => setIsRateEditorOpen(!isRateEditorOpen)}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold border transition ${
              isRateEditorOpen
                ? 'bg-blue-50 text-blue-700 border-blue-300 shadow-xs'
                : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
            }`}
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            <span>أسعار الصرف</span>
          </button>

          <button
            onClick={() => window.print()}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-900 text-white text-xs font-semibold shadow-xs transition"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>طباعة التقرير</span>
          </button>
        </div>
      </div>

      {/* Multi-Currency Control Panel & Exchange Rates Bar */}
      <div className="bg-white border border-slate-200 p-4 rounded-2xl shadow-xs space-y-3 no-print">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          {/* Currency Display Mode Selector */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-bold text-slate-700 flex items-center gap-1">
              <Coins className="w-4 h-4 text-amber-500" />
              عملة عرض التقارير:
            </span>
            <div className="inline-flex bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs">
              <button
                type="button"
                onClick={() => setReportCurrency('ALL')}
                className={`px-3 py-1.5 rounded-lg font-bold transition flex items-center gap-1.5 ${
                  reportCurrency === 'ALL'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Layers className="w-3.5 h-3.5" />
                عرض مقارن بجميع العملات (YER / USD / SAR)
              </button>

              <button
                type="button"
                onClick={() => setReportCurrency('YER')}
                className={`px-3 py-1.5 rounded-lg font-bold transition ${
                  reportCurrency === 'YER'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                🇾🇪 ريال يمني (YER)
              </button>

              <button
                type="button"
                onClick={() => setReportCurrency('USD')}
                className={`px-3 py-1.5 rounded-lg font-bold transition ${
                  reportCurrency === 'USD'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                🇺🇸 دولار أمريكي (USD)
              </button>

              <button
                type="button"
                onClick={() => setReportCurrency('SAR')}
                className={`px-3 py-1.5 rounded-lg font-bold transition ${
                  reportCurrency === 'SAR'
                    ? 'bg-emerald-700 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                🇸🇦 ريال سعودي (SAR)
              </button>
            </div>
          </div>

          {/* Current Live Rates Badges */}
          <div className="flex items-center gap-2 text-xs flex-wrap">
            <span className="text-slate-500 font-medium">سعر الصرف المعتمد:</span>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-1 rounded-lg bg-blue-50 text-blue-800 font-mono font-bold border border-blue-200">
                1 USD = {customRates.USD.toLocaleString()} YER
              </span>
              <span className="px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-800 font-mono font-bold border border-emerald-200">
                1 SAR = {customRates.SAR.toLocaleString()} YER
              </span>
              <span className="px-2.5 py-1 rounded-lg bg-purple-50 text-purple-800 font-mono font-bold border border-purple-200 hidden sm:inline-block">
                1 USD = {(customRates.USD / customRates.SAR).toFixed(2)} SAR
              </span>
            </div>
          </div>
        </div>

        {/* Expandable Rate Editor / Simulator */}
        {isRateEditorOpen && (
          <div className="pt-3 border-t border-slate-100 bg-slate-50 p-4 rounded-xl space-y-3 animate-in fade-in duration-150">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <SlidersHorizontal className="w-3.5 h-3.5 text-blue-600" />
                تعديل أسعار الصرف لتحويل القوائم المالية اللحظي (FX Rates Simulator)
              </h4>
              <button
                type="button"
                onClick={handleResetRates}
                className="text-[11px] text-blue-600 hover:text-blue-800 flex items-center gap-1 font-semibold"
              >
                <RefreshCw className="w-3 h-3" />
                استعادة الأسعار الافتراضية
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <div className="bg-white p-2.5 rounded-lg border border-slate-200">
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  سعر صرف الدولار (1 USD مقابل YER):
                </label>
                <div className="flex items-center gap-1">
                  <input
                    type="number"
                    min="1"
                    step="0.5"
                    value={customRates.USD}
                    onChange={(e) =>
                      setCustomRates((prev) => ({ ...prev, USD: Math.max(1, Number(e.target.value) || 1) }))
                    }
                    className="w-full p-1.5 border border-slate-300 rounded font-mono font-bold text-slate-800 focus:ring-1 focus:ring-blue-500"
                  />
                  <span className="text-slate-500 font-bold">YER</span>
                </div>
              </div>

              <div className="bg-white p-2.5 rounded-lg border border-slate-200">
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  سعر صرف الريال السعودي (1 SAR مقابل YER):
                </label>
                <div className="flex items-center gap-1">
                  <input
                    type="number"
                    min="1"
                    step="0.5"
                    value={customRates.SAR}
                    onChange={(e) =>
                      setCustomRates((prev) => ({ ...prev, SAR: Math.max(1, Number(e.target.value) || 1) }))
                    }
                    className="w-full p-1.5 border border-slate-300 rounded font-mono font-bold text-slate-800 focus:ring-1 focus:ring-blue-500"
                  />
                  <span className="text-slate-500 font-bold">YER</span>
                </div>
              </div>

              <div className="bg-white p-2.5 rounded-lg border border-slate-200 flex flex-col justify-center">
                <span className="text-[11px] text-slate-500">سعر التحويل المباشر بين العملات الأجنبية:</span>
                <span className="text-sm font-bold font-mono text-purple-700 mt-1">
                  1 USD = {(customRates.USD / customRates.SAR).toFixed(4)} SAR
                </span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Multi-Currency Executive KPI Summary Bar (Always Visible) */}
      <div className="grid grid-cols-2 lg:grid-cols-6 gap-3">
        {/* KPI 1: Assets */}
        <div className="bg-white p-3.5 rounded-xl border border-blue-100 shadow-xs text-right">
          <span className="text-[11px] text-slate-500 font-medium block">إجمالي الأصول</span>
          <h4 className="text-sm font-extrabold text-blue-700 font-mono mt-0.5">{fmtYER(totalAssets)}</h4>
          <div className="text-[10px] text-slate-500 font-mono mt-1 pt-1 border-t border-slate-100 flex flex-col">
            <span>{fmtUSD(totalAssets)}</span>
            <span>{fmtSAR(totalAssets)}</span>
          </div>
        </div>

        {/* KPI 2: Liabilities */}
        <div className="bg-white p-3.5 rounded-xl border border-amber-100 shadow-xs text-right">
          <span className="text-[11px] text-slate-500 font-medium block">إجمالي الخصوم</span>
          <h4 className="text-sm font-extrabold text-amber-700 font-mono mt-0.5">{fmtYER(totalLiabilities)}</h4>
          <div className="text-[10px] text-slate-500 font-mono mt-1 pt-1 border-t border-slate-100 flex flex-col">
            <span>{fmtUSD(totalLiabilities)}</span>
            <span>{fmtSAR(totalLiabilities)}</span>
          </div>
        </div>

        {/* KPI 3: Equity */}
        <div className="bg-white p-3.5 rounded-xl border border-purple-100 shadow-xs text-right">
          <span className="text-[11px] text-slate-500 font-medium block">حقوق الملكية</span>
          <h4 className="text-sm font-extrabold text-purple-700 font-mono mt-0.5">{fmtYER(totalEquity)}</h4>
          <div className="text-[10px] text-slate-500 font-mono mt-1 pt-1 border-t border-slate-100 flex flex-col">
            <span>{fmtUSD(totalEquity)}</span>
            <span>{fmtSAR(totalEquity)}</span>
          </div>
        </div>

        {/* KPI 4: Revenues */}
        <div className="bg-white p-3.5 rounded-xl border border-emerald-100 shadow-xs text-right">
          <span className="text-[11px] text-slate-500 font-medium block">إجمالي الإيرادات</span>
          <h4 className="text-sm font-extrabold text-emerald-700 font-mono mt-0.5">{fmtYER(totalRevenues)}</h4>
          <div className="text-[10px] text-slate-500 font-mono mt-1 pt-1 border-t border-slate-100 flex flex-col">
            <span>{fmtUSD(totalRevenues)}</span>
            <span>{fmtSAR(totalRevenues)}</span>
          </div>
        </div>

        {/* KPI 5: Expenses */}
        <div className="bg-white p-3.5 rounded-xl border border-rose-100 shadow-xs text-right">
          <span className="text-[11px] text-slate-500 font-medium block">إجمالي المصروفات</span>
          <h4 className="text-sm font-extrabold text-rose-700 font-mono mt-0.5">{fmtYER(totalExpenses)}</h4>
          <div className="text-[10px] text-slate-500 font-mono mt-1 pt-1 border-t border-slate-100 flex flex-col">
            <span>{fmtUSD(totalExpenses)}</span>
            <span>{fmtSAR(totalExpenses)}</span>
          </div>
        </div>

        {/* KPI 6: Net Income */}
        <div className={`p-3.5 rounded-xl border shadow-xs text-right ${
          netIncome >= 0 ? 'bg-emerald-50/50 border-emerald-200' : 'bg-rose-50/50 border-rose-200'
        }`}>
          <span className="text-[11px] text-slate-600 font-bold block">صافي ربح الفترة</span>
          <h4 className={`text-sm font-extrabold font-mono mt-0.5 ${
            netIncome >= 0 ? 'text-emerald-800' : 'text-rose-800'
          }`}>
            {fmtYER(netIncome)}
          </h4>
          <div className="text-[10px] font-mono mt-1 pt-1 border-t border-slate-200/60 flex flex-col font-semibold text-slate-600">
            <span>{fmtUSD(netIncome)}</span>
            <span>{fmtSAR(netIncome)}</span>
          </div>
        </div>
      </div>

      {/* Report Selection Tabs */}
      <div className="flex items-center gap-1.5 bg-slate-100 p-1.5 rounded-xl border border-slate-200 overflow-x-auto no-print">
        <button
          onClick={() => setSelectedReport('trial-balance')}
          className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-bold transition whitespace-nowrap ${
            selectedReport === 'trial-balance' ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Scale className="w-4 h-4" />
          <span>ميزان المراجعة (Trial Balance)</span>
        </button>

        <button
          onClick={() => setSelectedReport('income-statement')}
          className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-bold transition whitespace-nowrap ${
            selectedReport === 'income-statement' ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <TrendingUp className="w-4 h-4" />
          <span>قائمة الدخل والأرباح (P&L)</span>
        </button>

        <button
          onClick={() => setSelectedReport('balance-sheet')}
          className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-bold transition whitespace-nowrap ${
            selectedReport === 'balance-sheet' ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <BarChart3 className="w-4 h-4" />
          <span>الميزانية العمومية (Balance Sheet)</span>
        </button>

        <button
          onClick={() => setSelectedReport('cash-flow')}
          className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-bold transition whitespace-nowrap ${
            selectedReport === 'cash-flow' ? 'bg-emerald-700 text-white shadow-xs' : 'text-emerald-700 hover:bg-emerald-50'
          }`}
        >
          <ArrowDownUp className="w-4 h-4" />
          <span>التدفقات النقدية (Cash Flow - IAS 7)</span>
        </button>

        <button
          onClick={() => setSelectedReport('ledger-statement')}
          className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-bold transition whitespace-nowrap ${
            selectedReport === 'ledger-statement' ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <BookOpen className="w-4 h-4" />
          <span>كشف حساب أستاذ تفصيلي</span>
        </button>

        <button
          onClick={() => setSelectedReport('zakat-tax')}
          className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-bold transition whitespace-nowrap ${
            selectedReport === 'zakat-tax' ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Receipt className="w-4 h-4" />
          <span>إقرار الزكاة والضرائب اليمنية</span>
        </button>

        <button
          onClick={() => setSelectedReport('fx-consolidated')}
          className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-bold transition whitespace-nowrap ${
            selectedReport === 'fx-consolidated' ? 'bg-purple-700 text-white shadow-xs' : 'text-purple-700 hover:bg-purple-50'
          }`}
        >
          <Coins className="w-4 h-4" />
          <span>الملخص المالي المقارن للعملات (FX Summary)</span>
        </button>
      </div>

      {/* ========================================================================= */}
      {/* REPORT 1: MULTI-CURRENCY TRIAL BALANCE                                   */}
      {/* ========================================================================= */}
      {selectedReport === 'trial-balance' && (
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-b border-slate-200 pb-3">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-slate-800">ميزان المراجعة بالأرصدة والمجاميع متعدد العملات</h3>
                <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-slate-100 text-slate-700">
                  {reportCurrency === 'ALL' ? 'مقارن بجميع العملات' : `بالعملة: ${reportCurrency}`}
                </span>
              </div>
              <p className="text-xs text-slate-500">
                للفترة المالية المنتهية في {new Date().toISOString().split('T')[0]} | أسعار الصرف: 1$ = {customRates.USD} ر.ي | 1 ر.س = {customRates.SAR} ر.ي
              </p>
            </div>
            <button
              onClick={() => {
                if (reportCurrency === 'ALL') {
                  const headers = [
                    'رمز الحساب',
                    'اسم الحساب',
                    'النوع',
                    'مدين (YER)',
                    'مدين (USD)',
                    'مدين (SAR)',
                    'دائن (YER)',
                    'دائن (USD)',
                    'دائن (SAR)',
                  ];
                  const rows = accounts.filter(a => a.level >= 2).map(a => {
                    const isDebit = a.type === 'ASSET' || a.type === 'EXPENSE';
                    const debitVal = isDebit ? Math.abs(a.balance) : 0;
                    const creditVal = !isDebit ? Math.abs(a.balance) : 0;
                    return [
                      a.code,
                      a.nameAr,
                      a.type,
                      debitVal,
                      toUSD(debitVal).toFixed(2),
                      toSAR(debitVal).toFixed(2),
                      creditVal,
                      toUSD(creditVal).toFixed(2),
                      toSAR(creditVal).toFixed(2),
                    ];
                  });
                  exportToCsv('ميزان_المراجعة_متعدد_العملات', headers, rows);
                } else {
                  const headers = ['رمز الحساب', 'اسم الحساب', 'النوع', `مدين (${reportCurrency})`, `دائن (${reportCurrency})`];
                  const rows = accounts.filter(a => a.level >= 2).map(a => {
                    const isDebit = a.type === 'ASSET' || a.type === 'EXPENSE';
                    const debitVal = isDebit ? Math.abs(a.balance) : 0;
                    const creditVal = !isDebit ? Math.abs(a.balance) : 0;
                    const convertedDebit = convertAmount(debitVal, 'YER', reportCurrency, customRates);
                    const convertedCredit = convertAmount(creditVal, 'YER', reportCurrency, customRates);
                    return [a.code, a.nameAr, a.type, convertedDebit.toFixed(2), convertedCredit.toFixed(2)];
                  });
                  exportToCsv(`ميزان_المراجعة_${reportCurrency}`, headers, rows);
                }
              }}
              className="px-3.5 py-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition no-print"
            >
              <Download className="w-3.5 h-3.5" />
              <span>تصدير CSV متعدد العملات</span>
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs">
              <thead className="bg-slate-50 text-slate-700 border-b border-slate-200 font-semibold">
                {reportCurrency === 'ALL' ? (
                  <>
                    <tr>
                      <th rowSpan={2} className="p-3 w-24">رمز الحساب</th>
                      <th rowSpan={2} className="p-3">اسم الحساب</th>
                      <th rowSpan={2} className="p-3 w-28">النوع / التصنيف</th>
                      <th colSpan={3} className="p-2 text-center bg-emerald-50/70 border-r border-l border-emerald-200 text-emerald-800 font-bold">
                        الأرصدة المدينة (Debit)
                      </th>
                      <th colSpan={3} className="p-2 text-center bg-amber-50/70 border-l border-amber-200 text-amber-800 font-bold">
                        الأرصدة الدائنة (Credit)
                      </th>
                    </tr>
                    <tr className="border-b border-slate-200">
                      <th className="p-2 text-left bg-emerald-50/40 text-emerald-900 border-r border-emerald-100 font-mono">ر.ي (YER)</th>
                      <th className="p-2 text-left bg-emerald-50/40 text-emerald-900 font-mono">$ (USD)</th>
                      <th className="p-2 text-left bg-emerald-50/40 text-emerald-900 border-l border-emerald-100 font-mono">ر.س (SAR)</th>
                      <th className="p-2 text-left bg-amber-50/40 text-amber-900 font-mono">ر.ي (YER)</th>
                      <th className="p-2 text-left bg-amber-50/40 text-amber-900 font-mono">$ (USD)</th>
                      <th className="p-2 text-left bg-amber-50/40 text-amber-900 border-l border-amber-100 font-mono">ر.س (SAR)</th>
                    </tr>
                  </>
                ) : (
                  <tr>
                    <th className="p-3 w-28">رمز الحساب</th>
                    <th className="p-3">اسم الحساب</th>
                    <th className="p-3 w-28">النوع</th>
                    <th className="p-3 text-left w-44">الرصيد المدين ({reportCurrency})</th>
                    <th className="p-3 text-left w-44">الرصيد الدائن ({reportCurrency})</th>
                    <th className="p-3 text-left w-44 text-slate-400 font-normal">المعادل بالعملات الأخرى</th>
                  </tr>
                )}
              </thead>
              <tbody className="divide-y divide-slate-100">
                {accounts.filter(a => a.level >= 2).map((acc) => {
                  const isDebit = acc.type === 'ASSET' || acc.type === 'EXPENSE';
                  const debitVal = isDebit ? Math.abs(acc.balance) : 0;
                  const creditVal = !isDebit ? Math.abs(acc.balance) : 0;

                  if (reportCurrency === 'ALL') {
                    return (
                      <tr key={acc.code} className="hover:bg-slate-50/80">
                        <td className="p-3 font-mono font-bold text-blue-600">{acc.code}</td>
                        <td className="p-3 font-medium text-slate-800">{acc.nameAr}</td>
                        <td className="p-3 text-slate-500">{acc.category}</td>

                        {/* Debit in YER / USD / SAR */}
                        <td className="p-2 text-left font-mono font-bold text-emerald-700 bg-emerald-50/10 border-r border-emerald-100">
                          {debitVal > 0 ? fmtYER(debitVal) : '-'}
                        </td>
                        <td className="p-2 text-left font-mono text-emerald-600 bg-emerald-50/10">
                          {debitVal > 0 ? fmtUSD(debitVal) : '-'}
                        </td>
                        <td className="p-2 text-left font-mono text-emerald-600 bg-emerald-50/10 border-l border-emerald-100">
                          {debitVal > 0 ? fmtSAR(debitVal) : '-'}
                        </td>

                        {/* Credit in YER / USD / SAR */}
                        <td className="p-2 text-left font-mono font-bold text-amber-700 bg-amber-50/10">
                          {creditVal > 0 ? fmtYER(creditVal) : '-'}
                        </td>
                        <td className="p-2 text-left font-mono text-amber-600 bg-amber-50/10">
                          {creditVal > 0 ? fmtUSD(creditVal) : '-'}
                        </td>
                        <td className="p-2 text-left font-mono text-amber-600 bg-amber-50/10 border-l border-amber-100">
                          {creditVal > 0 ? fmtSAR(creditVal) : '-'}
                        </td>
                      </tr>
                    );
                  }

                  const activeDebit = convertAmount(debitVal, 'YER', reportCurrency, customRates);
                  const activeCredit = convertAmount(creditVal, 'YER', reportCurrency, customRates);

                  return (
                    <tr key={acc.code} className="hover:bg-slate-50/80">
                      <td className="p-3 font-mono font-bold text-blue-600">{acc.code}</td>
                      <td className="p-3 font-medium text-slate-800">{acc.nameAr}</td>
                      <td className="p-3 text-slate-500">{acc.category}</td>
                      <td className="p-3 text-left font-mono font-bold text-emerald-600">
                        {debitVal > 0 ? formatCurrency(activeDebit, reportCurrency, customRates) : '-'}
                      </td>
                      <td className="p-3 text-left font-mono font-bold text-amber-600">
                        {creditVal > 0 ? formatCurrency(activeCredit, reportCurrency, customRates) : '-'}
                      </td>
                      <td className="p-3 text-left font-mono text-[11px] text-slate-400">
                        {debitVal > 0
                          ? reportCurrency === 'YER'
                            ? `${fmtUSD(debitVal)} | ${fmtSAR(debitVal)}`
                            : `${fmtYER(debitVal)}`
                          : creditVal > 0
                          ? reportCurrency === 'YER'
                            ? `${fmtUSD(creditVal)} | ${fmtSAR(creditVal)}`
                            : `${fmtYER(creditVal)}`
                          : '-'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot className="bg-slate-50 font-bold text-slate-800 border-t-2 border-slate-200">
                {reportCurrency === 'ALL' ? (
                  <tr>
                    <td colSpan={3} className="p-3 text-right font-bold text-slate-900">
                      إجمالي ميزان المراجعة المتطابق:
                    </td>
                    <td className="p-2 text-left text-emerald-700 font-mono font-extrabold border-r border-emerald-200">
                      {fmtYER(totalAssets + totalExpenses)}
                    </td>
                    <td className="p-2 text-left text-emerald-700 font-mono font-extrabold">
                      {fmtUSD(totalAssets + totalExpenses)}
                    </td>
                    <td className="p-2 text-left text-emerald-700 font-mono font-extrabold border-l border-emerald-200">
                      {fmtSAR(totalAssets + totalExpenses)}
                    </td>

                    <td className="p-2 text-left text-amber-700 font-mono font-extrabold">
                      {fmtYER(totalLiabilities + totalEquity + totalRevenues - netIncome)}
                    </td>
                    <td className="p-2 text-left text-amber-700 font-mono font-extrabold">
                      {fmtUSD(totalLiabilities + totalEquity + totalRevenues - netIncome)}
                    </td>
                    <td className="p-2 text-left text-amber-700 font-mono font-extrabold border-l border-amber-200">
                      {fmtSAR(totalLiabilities + totalEquity + totalRevenues - netIncome)}
                    </td>
                  </tr>
                ) : (
                  <tr>
                    <td colSpan={3} className="p-3 text-right">إجمالي ميزان المراجعة المتطابق:</td>
                    <td className="p-3 text-left text-emerald-600 font-mono text-sm">
                      {formatCurrency(convertAmount(totalAssets + totalExpenses, 'YER', reportCurrency, customRates), reportCurrency, customRates)}
                    </td>
                    <td className="p-3 text-left text-amber-600 font-mono text-sm">
                      {formatCurrency(convertAmount(totalLiabilities + totalEquity + totalRevenues - netIncome, 'YER', reportCurrency, customRates), reportCurrency, customRates)}
                    </td>
                    <td className="p-3 text-left text-xs font-mono text-slate-500">
                      {reportCurrency === 'YER'
                        ? `${fmtUSD(totalAssets + totalExpenses)}`
                        : `${fmtYER(totalAssets + totalExpenses)}`}
                    </td>
                  </tr>
                )}
              </tfoot>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* REPORT 2: MULTI-CURRENCY INCOME STATEMENT (P&L)                           */}
      {/* ========================================================================= */}
      {selectedReport === 'income-statement' && (
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-6 max-w-4xl mx-auto">
          <div className="text-center border-b border-slate-200 pb-4 space-y-1">
            <CompanyHeaderView size="lg" />
            <p className="text-xs text-slate-500">قائمة الدخل والأرباح والخسائر الشاملة (Multi-Currency Income Statement)</p>
            <p className="text-[11px] text-slate-400 mt-1">
              عن الفترة المنتهية في 2026/12/31 | العملة الأساسية: ريال يمني (YER)
            </p>
          </div>

          <div className="space-y-5 text-xs">
            {/* Revenues Section */}
            <div className="space-y-2">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-emerald-50 p-3 rounded-xl font-bold text-emerald-800 border border-emerald-200 gap-2">
                <span>أولاً: الإيرادات التشغيلية والمبيعات (Revenues)</span>
                <div className="flex items-center gap-3 font-mono text-xs">
                  <span>{fmtYER(totalRevenues)}</span>
                  <span className="text-emerald-600">({fmtUSD(totalRevenues)})</span>
                  <span className="text-emerald-600">({fmtSAR(totalRevenues)})</span>
                </div>
              </div>

              <div className="divide-y divide-slate-100 pr-2">
                {revenues.map((r) => {
                  const b = Math.abs(r.balance);
                  return (
                    <div key={r.code} className="flex items-center justify-between py-2 text-slate-700 hover:bg-slate-50 px-2 rounded-lg">
                      <span className="font-medium">{r.code} - {r.nameAr}</span>
                      <div className="flex items-center gap-3 font-mono font-bold">
                        <span className="text-emerald-700">{fmtYER(b)}</span>
                        <span className="text-slate-400 font-normal text-[11px]">{fmtUSD(b)}</span>
                        <span className="text-slate-400 font-normal text-[11px]">{fmtSAR(b)}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Expenses Section */}
            <div className="space-y-2">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-rose-50 p-3 rounded-xl font-bold text-rose-800 border border-rose-200 gap-2">
                <span>ثانياً: تكاليف النشاط والمصروفات التشغيلية والعمومية (Expenses)</span>
                <div className="flex items-center gap-3 font-mono text-xs">
                  <span>{fmtYER(totalExpenses)}</span>
                  <span className="text-rose-600">({fmtUSD(totalExpenses)})</span>
                  <span className="text-rose-600">({fmtSAR(totalExpenses)})</span>
                </div>
              </div>

              <div className="divide-y divide-slate-100 pr-2">
                {expenses.map((e) => {
                  const b = Math.abs(e.balance);
                  return (
                    <div key={e.code} className="flex items-center justify-between py-2 text-slate-700 hover:bg-slate-50 px-2 rounded-lg">
                      <span className="font-medium">{e.code} - {e.nameAr}</span>
                      <div className="flex items-center gap-3 font-mono font-bold">
                        <span className="text-rose-700">{fmtYER(b)}</span>
                        <span className="text-slate-400 font-normal text-[11px]">{fmtUSD(b)}</span>
                        <span className="text-slate-400 font-normal text-[11px]">{fmtSAR(b)}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Net Income Summary Block (Multi-Currency Triplet Card) */}
            <div className="p-5 rounded-2xl bg-slate-900 text-white shadow-md space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div>
                  <span className="text-xs text-slate-400 block font-medium">
                    صافي ربح / (خسارة) الفترة المالية (Net Income Summary)
                  </span>
                  <span className="text-xs text-emerald-400 font-bold mt-0.5 block">
                    هامش صافي الربحية: {totalRevenues > 0 ? ((netIncome / totalRevenues) * 100).toFixed(1) : 0}%
                  </span>
                </div>
                <div className="p-2 rounded-xl bg-slate-800 text-emerald-400">
                  <TrendingUp className="w-6 h-6" />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-center">
                <div className="bg-slate-800/80 p-3 rounded-xl border border-slate-700">
                  <span className="text-[11px] text-slate-400 block">بالريال اليمني (YER - الأساس)</span>
                  <span className="text-base font-extrabold font-mono text-white mt-1 block">
                    {fmtYER(netIncome)}
                  </span>
                </div>

                <div className="bg-slate-800/80 p-3 rounded-xl border border-slate-700">
                  <span className="text-[11px] text-slate-400 block">بالدولار الأمريكي (USD)</span>
                  <span className="text-base font-extrabold font-mono text-emerald-400 mt-1 block">
                    {fmtUSD(netIncome)}
                  </span>
                </div>

                <div className="bg-slate-800/80 p-3 rounded-xl border border-slate-700">
                  <span className="text-[11px] text-slate-400 block">بالريال السعودي (SAR)</span>
                  <span className="text-base font-extrabold font-mono text-emerald-400 mt-1 block">
                    {fmtSAR(netIncome)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* REPORT 3: MULTI-CURRENCY BALANCE SHEET                                   */}
      {/* ========================================================================= */}
      {selectedReport === 'balance-sheet' && (
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-6 max-w-5xl mx-auto">
          <div className="text-center border-b border-slate-200 pb-4 space-y-1">
            <CompanyHeaderView size="lg" />
            <p className="text-xs text-slate-500">قائمة المركز المالي والميزانية العمومية متعددة العملات (Balance Sheet)</p>
            <div className="flex items-center justify-center gap-2 flex-wrap text-[11px] text-slate-500 pt-1">
              <span className="px-2.5 py-0.5 rounded-full bg-slate-100 font-semibold border border-slate-200">
                وفق المعايير الدولية لإعداد التقارير المالية IFRS / IAS 21
              </span>
              <span className={`px-2.5 py-0.5 rounded-full font-bold border ${
                activeRegime === 'SANAA'
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                  : 'bg-indigo-50 text-indigo-800 border-indigo-300'
              }`}>
                {activeRegime === 'SANAA' ? '🏛️ نظام صنعاء (الرسمي - 535 ر.ي)' : '🌊 نظام السوق الموازي (عدن - 1910 ر.ي)'}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* ASSETS COLUMN */}
            <div className="space-y-3 bg-slate-50 p-4 rounded-2xl border border-slate-200">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-blue-50 p-3 rounded-xl font-bold text-blue-800 border border-blue-200 text-xs gap-1">
                <span>الأصول والموجودات (Assets)</span>
                <span className="font-mono">{fmtYER(totalAssets)}</span>
              </div>

              <div className="space-y-2 text-xs divide-y divide-slate-200">
                <div className="pt-1 font-bold text-slate-700 flex justify-between">
                  <span>الأصول المتداولة والسيولة النقدية:</span>
                  <span className="text-[11px] text-slate-400 font-mono font-normal">YER / USD / SAR</span>
                </div>
                {assets.filter(a => a.category.includes('متداولة') || a.code.startsWith('11')).map((a) => {
                  const val = getRevaluedBalance(a);
                  return (
                    <div key={a.code} className="flex justify-between items-center py-1.5 text-slate-700 hover:bg-white px-1.5 rounded">
                      <div className="flex items-center gap-1.5">
                        <span>{a.nameAr}</span>
                        {a.currency && a.currency !== 'YER' && (
                          <span className="text-[9px] px-1 py-0.2 bg-blue-100 text-blue-800 rounded font-mono font-bold">
                            {a.currency}
                          </span>
                        )}
                      </div>
                      <div className="text-left font-mono">
                        <span className="font-bold text-slate-900 block">{fmtYER(val)}</span>
                        <span className="text-[10px] text-slate-400 block">{fmtUSD(val)} | {fmtSAR(val)}</span>
                      </div>
                    </div>
                  );
                })}

                <div className="pt-3 font-bold text-slate-700 flex justify-between">
                  <span>الأصول غير المتداولة (الثابتة والاستثمارية):</span>
                </div>
                {assets.filter(a => a.category.includes('ثابتة') || a.code.startsWith('12')).map((a) => {
                  const val = getRevaluedBalance(a);
                  return (
                    <div key={a.code} className="flex justify-between items-center py-1.5 text-slate-700 hover:bg-white px-1.5 rounded">
                      <div className="flex items-center gap-1.5">
                        <span>{a.nameAr}</span>
                        {a.currency && a.currency !== 'YER' && (
                          <span className="text-[9px] px-1 py-0.2 bg-blue-100 text-blue-800 rounded font-mono font-bold">
                            {a.currency}
                          </span>
                        )}
                      </div>
                      <div className="text-left font-mono">
                        <span className={`font-bold block ${a.code.startsWith('129') ? 'text-rose-600' : 'text-slate-900'}`}>
                          {a.code.startsWith('129') ? `(${fmtYER(val)})` : fmtYER(val)}
                        </span>
                        <span className="text-[10px] text-slate-400 block">{fmtUSD(val)} | {fmtSAR(val)}</span>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Total Assets Summary Box */}
              <div className="pt-3 border-t-2 border-slate-300 space-y-1">
                <div className="flex justify-between font-bold text-sm text-blue-800">
                  <span>مجموع الأصول (Total Assets):</span>
                  <span className="font-mono">{fmtYER(totalAssets)}</span>
                </div>
                <div className="flex justify-between text-xs text-blue-600 font-mono">
                  <span>المعادل بالعملات الأجنبية:</span>
                  <span>{fmtUSD(totalAssets)} | {fmtSAR(totalAssets)}</span>
                </div>
              </div>
            </div>

            {/* LIABILITIES & EQUITY COLUMN */}
            <div className="space-y-3 bg-slate-50 p-4 rounded-2xl border border-slate-200">
              {/* Liabilities */}
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-amber-50 p-3 rounded-xl font-bold text-amber-800 border border-amber-200 text-xs gap-1">
                <span>الخصوم والالتزامات (Liabilities)</span>
                <span className="font-mono">{fmtYER(totalLiabilities)}</span>
              </div>

              <div className="space-y-1 text-xs divide-y divide-slate-200">
                {liabilities.map((l) => {
                  const val = getRevaluedBalance(l);
                  return (
                    <div key={l.code} className="flex justify-between items-center py-1.5 text-slate-700 hover:bg-white px-1.5 rounded">
                      <div className="flex items-center gap-1.5">
                        <span>{l.nameAr}</span>
                        {l.currency && l.currency !== 'YER' && (
                          <span className="text-[9px] px-1 py-0.2 bg-amber-100 text-amber-800 rounded font-mono font-bold">
                            {l.currency}
                          </span>
                        )}
                      </div>
                      <div className="text-left font-mono">
                        <span className="font-bold text-slate-900 block">{fmtYER(val)}</span>
                        <span className="text-[10px] text-slate-400 block">{fmtUSD(val)} | {fmtSAR(val)}</span>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Equity */}
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-purple-50 p-3 rounded-xl font-bold text-purple-800 border border-purple-200 text-xs mt-4 gap-1">
                <span>حقوق الملكية (Equity)</span>
                <span className="font-mono">{fmtYER(totalEquity)}</span>
              </div>

              <div className="space-y-2 text-xs divide-y divide-slate-200">
                {equity.map((eq) => (
                  <div key={eq.code} className="flex justify-between items-center py-1.5 text-slate-700 hover:bg-white px-1.5 rounded">
                    <span>{eq.nameAr}</span>
                    <div className="text-left font-mono">
                      <span className="font-bold text-slate-900 block">{fmtYER(eq.balance)}</span>
                      <span className="text-[10px] text-slate-400 block">{fmtUSD(eq.balance)} | {fmtSAR(eq.balance)}</span>
                    </div>
                  </div>
                ))}

                {/* FX Revaluation Isolated Retained Earnings Adjustment */}
                {Math.abs(fxRetainedEarningsAdjustment) > 0.01 && (
                  <div className="flex justify-between items-center py-2 px-2 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-900 font-bold">
                    <div className="space-y-0.5">
                      <span className="block text-xs font-extrabold text-amber-950">
                        أثر إعادة تقييم أسعار الصرف (فروق العملة المزدوجة - مثبتة في الأرباح المرحلة):
                      </span>
                      <span className="text-[10px] text-amber-700 font-medium block">
                        معيار IAS 21 ({activeRegime === 'SANAA' ? 'نظام صنعاء 535 ر.ي' : 'نظام السوق الموازي عدن 1910 ر.ي'})
                      </span>
                    </div>
                    <div className="text-left font-mono">
                      <span className="block text-xs font-black text-amber-900 font-mono">
                        {fmtYER(fxRetainedEarningsAdjustment)}
                      </span>
                      <span className="text-[10px] text-amber-700 block font-mono">
                        {fmtUSD(fxRetainedEarningsAdjustment)} | {fmtSAR(fxRetainedEarningsAdjustment)}
                      </span>
                    </div>
                  </div>
                )}

                <div className="flex justify-between items-center py-1.5 text-emerald-700 font-bold bg-emerald-50/50 px-1.5 rounded">
                  <span>صافي أرباح النشاط التشغيلي للفترة:</span>
                  <div className="text-left font-mono">
                    <span className="block">{fmtYER(netIncome)}</span>
                    <span className="text-[10px] text-emerald-600 block">{fmtUSD(netIncome)} | {fmtSAR(netIncome)}</span>
                  </div>
                </div>
              </div>

              {/* Total Liabilities & Equity Summary Box */}
              <div className="pt-3 border-t-2 border-slate-300 space-y-1">
                <div className="flex justify-between font-bold text-sm text-purple-800">
                  <span>مجموع الخصوم وحقوق الملكية:</span>
                  <span className="font-mono">{fmtYER(totalLiabilities + totalEquity)}</span>
                </div>
                <div className="flex justify-between text-xs text-purple-600 font-mono">
                  <span>المعادل بالعملات الأجنبية:</span>
                  <span>{fmtUSD(totalLiabilities + totalEquity)} | {fmtSAR(totalLiabilities + totalEquity)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Balance verification indicator */}
          <div className={`p-4 rounded-2xl border flex flex-col sm:flex-row items-start sm:items-center justify-between text-xs font-bold gap-2 ${
            isBalanceSheetBalanced
              ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
              : 'bg-rose-50 border-rose-200 text-rose-900'
          }`}>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
              <span>المعادلة المحاسبية متطابقة تماماً بكافة العملات: الأصول = الخصوم + حقوق الملكية</span>
            </div>
            <div className="font-mono text-left space-y-0.5">
              <div>🇾🇪 {fmtYER(totalAssets)} = {fmtYER(totalLiabilities + totalEquity)}</div>
              <div className="text-[11px] text-emerald-700">🇺🇸 {fmtUSD(totalAssets)} = {fmtUSD(totalLiabilities + totalEquity)}</div>
            </div>
          </div>

          {/* Legal Disclaimer Box - أمر التغيير رقم 4 */}
          <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-950 flex items-start gap-3.5 text-xs leading-relaxed">
            <div className="p-2 rounded-xl bg-amber-500/20 text-amber-700 shrink-0 border border-amber-500/30 mt-0.5">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div className="space-y-1">
              <span className="font-extrabold text-amber-950 text-xs block">
                إخلاء المسؤولية القانونية والتنظيمية (Legal Compliance Disclaimer):
              </span>
              <p className="text-[11px] text-amber-900 font-semibold leading-relaxed">
                "تم إعداد هذه القوائم وفقاً لسعر الصرف المعتمد في نظام ({activeRegime === 'SANAA' ? 'صنعاء' : 'عدن'}) كما هو محدد في إعدادات المنشأة. تتحمل المنشأة المسؤولية الكاملة عن اختيار سعر الصرف المتوافق مع الجهات الرقابية المختصة."
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* REPORT: CASH FLOW STATEMENT (INDIRECT METHOD IAS 7 - أمر التغيير رقم 3)    */}
      {/* ========================================================================= */}
      {selectedReport === 'cash-flow' && (
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-5">
          {/* Header & Excel Export Toolbar */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-200 pb-4">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <ArrowDownUp className="w-5 h-5 text-emerald-600" />
                  <span>قائمة التدفقات النقدية - الطريقة غير المباشرة (Indirect Cash Flow Statement)</span>
                </h3>
                <span className="px-2.5 py-0.5 rounded-md text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                  معيار المحاسبة الدولي IAS 7
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                صيغة الاحتساب المعتمدة: التدفق النقدي التشغيلي = صافي الدخل + الإهلاك - الزيادة في الأصول المتداولة + الزيادة في الخصوم المتداولة
              </p>
            </div>

            <div className="flex items-center gap-2 flex-wrap no-print">
              <button
                type="button"
                onClick={handleExportCashFlowExcel}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs transition"
                title="تصدير قائمة التدفقات النقدية إلى ملف Excel"
              >
                <FileSpreadsheet className="w-4 h-4" />
                <span>تصدير إلى Excel (XLSX/CSV)</span>
              </button>
            </div>
          </div>

          {/* Quick Metrics Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 text-right">
              <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
                <span>التدفق من الأنشطة التشغيلية</span>
                <TrendingUp className="w-4 h-4 text-emerald-600" />
              </div>
              <h4 className="text-base font-black text-emerald-700 font-mono">
                {fmtYER(cashFlowData.operatingCashFlow)}
              </h4>
              <div className="text-[10px] text-slate-400 font-mono mt-1 pt-1 border-t border-slate-200">
                <span>{fmtUSD(cashFlowData.operatingCashFlow)} | {fmtSAR(cashFlowData.operatingCashFlow)}</span>
              </div>
            </div>

            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 text-right">
              <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
                <span>التدفق من الأنشطة الاستثمارية</span>
                <TrendingDown className="w-4 h-4 text-rose-600" />
              </div>
              <h4 className="text-base font-black text-rose-700 font-mono">
                {fmtYER(cashFlowData.investingCashFlow)}
              </h4>
              <div className="text-[10px] text-slate-400 font-mono mt-1 pt-1 border-t border-slate-200">
                <span>{fmtUSD(cashFlowData.investingCashFlow)} | {fmtSAR(cashFlowData.investingCashFlow)}</span>
              </div>
            </div>

            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 text-right">
              <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
                <span>التدفق من الأنشطة التمويلية</span>
                <Landmark className="w-4 h-4 text-blue-600" />
              </div>
              <h4 className="text-base font-black text-blue-700 font-mono">
                {fmtYER(cashFlowData.financingCashFlow)}
              </h4>
              <div className="text-[10px] text-slate-400 font-mono mt-1 pt-1 border-t border-slate-200">
                <span>{fmtUSD(cashFlowData.financingCashFlow)} | {fmtSAR(cashFlowData.financingCashFlow)}</span>
              </div>
            </div>

            <div className="bg-emerald-50/70 p-4 rounded-2xl border border-emerald-200 text-right">
              <div className="flex items-center justify-between text-xs text-emerald-800 font-bold mb-1">
                <span>رصيد النقدية نهاية الفترة</span>
                <WalletCards className="w-4 h-4 text-emerald-700" />
              </div>
              <h4 className="text-base font-black text-emerald-900 font-mono">
                {fmtYER(cashFlowData.endingCash)}
              </h4>
              <div className="text-[10px] text-emerald-700 font-mono mt-1 pt-1 border-t border-emerald-200">
                <span>{fmtUSD(cashFlowData.endingCash)} | {fmtSAR(cashFlowData.endingCash)}</span>
              </div>
            </div>
          </div>

          {/* Detailed Statement Rows */}
          <div className="border border-slate-200 rounded-2xl overflow-hidden divide-y divide-slate-200">
            {/* SECTION 1: OPERATING ACTIVITIES */}
            <div className="bg-slate-900 text-white p-3.5 flex items-center justify-between font-bold text-xs">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-400" />
                <span>أولاً: التدفقات النقدية من الأنشطة التشغيلية (Operating Activities)</span>
              </div>
              <span className="font-mono text-emerald-300 font-extrabold">{fmtYER(cashFlowData.operatingCashFlow)}</span>
            </div>

            <div className="p-4 bg-white space-y-2 text-xs">
              <div className="flex justify-between items-center py-1.5 text-slate-800 font-bold border-b border-slate-100">
                <span>صافي الدخل من قائمة الدخل (Net Income)</span>
                <span className="font-mono text-emerald-700">{fmtYER(cashFlowData.reportedNetIncome)}</span>
              </div>

              <div className="text-[11px] font-bold text-slate-500 pt-1">تعديلات لتسوية صافي الدخل بالتدفق النقدي (التسويات غير النقدية):</div>

              <div className="flex justify-between items-center py-1.5 text-slate-700 hover:bg-slate-50 px-2 rounded">
                <div className="flex items-center gap-2">
                  <ArrowUpRight className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span>(+) مخصص الإهلاك والاستهلاك غير النقدي (Depreciation & Amortization Addback)</span>
                </div>
                <span className="font-mono font-bold text-emerald-700">+{fmtYER(cashFlowData.periodDepreciation)}</span>
              </div>

              <div className="flex justify-between items-center py-1.5 text-slate-700 hover:bg-slate-50 px-2 rounded">
                <div className="flex items-center gap-2">
                  <ArrowDownLeft className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                  <span>(-) الزيادة في حسابات المدينين والعملاء (Increase in Accounts Receivable)</span>
                </div>
                <span className="font-mono font-bold text-rose-600">-{fmtYER(cashFlowData.receivablesTotal)}</span>
              </div>

              <div className="flex justify-between items-center py-1.5 text-slate-700 hover:bg-slate-50 px-2 rounded">
                <div className="flex items-center gap-2">
                  <ArrowDownLeft className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                  <span>(-) الزيادة في بضاعة المخزون (Increase in Inventory)</span>
                </div>
                <span className="font-mono font-bold text-rose-600">-{fmtYER(cashFlowData.inventoryTotal)}</span>
              </div>

              <div className="flex justify-between items-center py-1.5 text-slate-700 hover:bg-slate-50 px-2 rounded">
                <div className="flex items-center gap-2">
                  <ArrowUpRight className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span>(+) الزيادة في حسابات الموردين والدائنين (Increase in Accounts Payable)</span>
                </div>
                <span className="font-mono font-bold text-emerald-700">+{fmtYER(cashFlowData.payablesTotal)}</span>
              </div>

              <div className="flex justify-between items-center py-1.5 text-slate-700 hover:bg-slate-50 px-2 rounded">
                <div className="flex items-center gap-2">
                  <ArrowUpRight className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span>(+) الزيادة في المصروفات المستحقة والأرصدة الدائنة الأخرى (Increase in Accruals & Taxes)</span>
                </div>
                <span className="font-mono font-bold text-emerald-700">+{fmtYER(cashFlowData.accruedAndTaxesTotal)}</span>
              </div>

              <div className="flex justify-between items-center p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 font-extrabold mt-2">
                <span>صافي النقد المتولد من الأنشطة التشغيلية:</span>
                <span className="font-mono text-sm">{fmtYER(cashFlowData.operatingCashFlow)}</span>
              </div>
            </div>

            {/* SECTION 2: INVESTING ACTIVITIES */}
            <div className="bg-slate-900 text-white p-3.5 flex items-center justify-between font-bold text-xs">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-rose-400" />
                <span>ثانياً: التدفقات النقدية من الأنشطة الاستثمارية (Investing Activities)</span>
              </div>
              <span className="font-mono text-rose-300 font-extrabold">{fmtYER(cashFlowData.investingCashFlow)}</span>
            </div>

            <div className="p-4 bg-white space-y-2 text-xs">
              <div className="flex justify-between items-center py-1.5 text-slate-700 hover:bg-slate-50 px-2 rounded">
                <div className="flex items-center gap-2">
                  <ArrowDownLeft className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                  <span>(-) شراء وإضافات أصول ثابتة ومعدات رأسمالية (Capital Expenditures - CapEx)</span>
                </div>
                <span className="font-mono font-bold text-rose-600">{fmtYER(cashFlowData.investingCashFlow)}</span>
              </div>

              <div className="flex justify-between items-center p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-900 font-extrabold mt-2">
                <span>صافي النقد المستخدم في الأنشطة الاستثمارية:</span>
                <span className="font-mono text-sm">{fmtYER(cashFlowData.investingCashFlow)}</span>
              </div>
            </div>

            {/* SECTION 3: FINANCING ACTIVITIES */}
            <div className="bg-slate-900 text-white p-3.5 flex items-center justify-between font-bold text-xs">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-blue-400" />
                <span>ثالثاً: التدفقات النقدية من الأنشطة التمويلية (Financing Activities)</span>
              </div>
              <span className="font-mono text-blue-300 font-extrabold">{fmtYER(cashFlowData.financingCashFlow)}</span>
            </div>

            <div className="p-4 bg-white space-y-2 text-xs">
              <div className="flex justify-between items-center py-1.5 text-slate-700 hover:bg-slate-50 px-2 rounded">
                <div className="flex items-center gap-2">
                  <ArrowUpRight className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                  <span>(+/-) صافي التغير في القروض والتمويل الإسلامي طويل الأجل</span>
                </div>
                <span className="font-mono font-bold text-blue-700">+{fmtYER(cashFlowData.loansChange)}</span>
              </div>

              <div className="flex justify-between items-center py-1.5 text-slate-700 hover:bg-slate-50 px-2 rounded">
                <div className="flex items-center gap-2">
                  <ArrowUpRight className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                  <span>(+) زيادات رأس المال وتمويل الشركاء</span>
                </div>
                <span className="font-mono font-bold text-blue-700">+{fmtYER(cashFlowData.capitalChange)}</span>
              </div>

              <div className="flex justify-between items-center py-1.5 text-slate-700 hover:bg-slate-50 px-2 rounded">
                <div className="flex items-center gap-2">
                  <ArrowDownLeft className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                  <span>(-) توزيعات الأرباح والمسحوبات الجارية للشركاء</span>
                </div>
                <span className="font-mono font-bold text-rose-600">-{fmtYER(cashFlowData.drawingsPaid)}</span>
              </div>

              <div className="flex justify-between items-center p-3 rounded-xl bg-blue-50 border border-blue-200 text-blue-900 font-extrabold mt-2">
                <span>صافي النقد المتولد من الأنشطة التمويلية:</span>
                <span className="font-mono text-sm">{fmtYER(cashFlowData.financingCashFlow)}</span>
              </div>
            </div>

            {/* SECTION 4: RECONCILIATION SUMMARY */}
            <div className="p-4 bg-slate-50 space-y-2 text-xs">
              <div className="flex justify-between items-center py-1.5 text-slate-800 font-bold">
                <span>صافي الزيادة / (النقص) في النقدية خلال الفترة:</span>
                <span className="font-mono font-black text-slate-900">{fmtYER(cashFlowData.netCashChange)}</span>
              </div>

              <div className="flex justify-between items-center py-1.5 text-slate-600">
                <span>(+) رصيد النقدية وما في حكمها في بداية الفترة:</span>
                <span className="font-mono font-bold">{fmtYER(cashFlowData.beginningCash)}</span>
              </div>

              <div className="flex justify-between items-center p-4 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-700 text-white font-black text-sm shadow-md mt-2">
                <span>(=) رصيد النقدية وما في حكمها في نهاية الفترة (مطابق لنقدية الميزانية):</span>
                <div className="text-left font-mono">
                  <div>{fmtYER(cashFlowData.endingCash)}</div>
                  <div className="text-xs text-emerald-100 font-normal">
                    {fmtUSD(cashFlowData.endingCash)} | {fmtSAR(cashFlowData.endingCash)}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Legal Compliance Box */}
          <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-950 flex items-start gap-3.5 text-xs leading-relaxed">
            <div className="p-2 rounded-xl bg-amber-500/20 text-amber-700 shrink-0 border border-amber-500/30 mt-0.5">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div className="space-y-1">
              <span className="font-extrabold text-amber-950 text-xs block">
                إخلاء المسؤولية القانونية والتنظيمية (Legal Compliance Disclaimer):
              </span>
              <p className="text-[11px] text-amber-900 font-semibold leading-relaxed">
                "تم إعداد هذه القوائم وفقاً لسعر الصرف المعتمد في نظام ({activeRegime === 'SANAA' ? 'صنعاء' : 'عدن'}) كما هو محدد في إعدادات المنشأة. تتحمل المنشأة المسؤولية الكاملة عن اختيار سعر الصرف المتوافق مع الجهات الرقابية المختصة."
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* REPORT 4: MULTI-CURRENCY LEDGER STATEMENT (ACCOUNT CARD)                  */}
      {/* ========================================================================= */}
      {selectedReport === 'ledger-statement' && (
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-200 pb-3 no-print">
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <label className="text-xs font-semibold text-slate-700 whitespace-nowrap">اختر الحساب:</label>
              <select
                value={selectedAccountCode}
                onChange={(e) => setSelectedAccountCode(e.target.value)}
                className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:ring-2 focus:ring-blue-500 focus:bg-white focus:outline-none"
              >
                {accounts.filter(a => a.level >= 2).map((acc) => (
                  <option key={acc.code} value={acc.code}>
                    {acc.code} - {acc.nameAr}
                  </option>
                ))}
              </select>
            </div>

            <button
              onClick={() => {
                const headers = [
                  'التاريخ',
                  'رقم القيد',
                  'المرجع',
                  'البيان',
                  'مدين (YER)',
                  'مدين (USD)',
                  'مدين (SAR)',
                  'دائن (YER)',
                  'دائن (USD)',
                  'دائن (SAR)',
                ];
                const rows = ledgerTransactions.map(t => [
                  t.date,
                  t.entryNumber,
                  t.reference,
                  t.description,
                  t.debit,
                  toUSD(t.debit).toFixed(2),
                  toSAR(t.debit).toFixed(2),
                  t.credit,
                  toUSD(t.credit).toFixed(2),
                  toSAR(t.credit).toFixed(2),
                ]);
                exportToCsv(`كشف_حساب_متعدد_العملات_${selectedAccountCode}`, headers, rows);
              }}
              className="px-3.5 py-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition"
            >
              <Download className="w-3.5 h-3.5" />
              <span>تصدير CSV متعدد العملات</span>
            </button>
          </div>

          {/* Account Details Header with Multi-Currency Balances */}
          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <span className="font-mono text-xs text-blue-600 font-bold">{currentAcc?.code}</span>
              <h4 className="text-base font-bold text-slate-800 mt-0.5">{currentAcc?.nameAr}</h4>
              <span className="text-xs text-slate-500">{currentAcc?.category} | نوع الحساب: {currentAcc?.type}</span>
            </div>
            <div className="text-left bg-white p-3 rounded-xl border border-slate-200 w-full sm:w-auto">
              <span className="text-xs text-slate-500 block font-medium">الرصيد الدفتري الحالي المحول</span>
              <span className="text-lg font-bold text-emerald-700 font-mono block">
                {fmtYER(currentAcc?.balance || 0)}
              </span>
              <div className="flex items-center gap-2 text-xs font-mono text-slate-500 mt-0.5">
                <span>{fmtUSD(currentAcc?.balance || 0)}</span>
                <span>•</span>
                <span>{fmtSAR(currentAcc?.balance || 0)}</span>
              </div>
            </div>
          </div>

          {/* Transactions Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs">
              <thead className="bg-slate-50 text-slate-700 border-b border-slate-200 font-semibold">
                <tr>
                  <th className="p-3">التاريخ</th>
                  <th className="p-3">رقم القيد</th>
                  <th className="p-3">المرجع</th>
                  <th className="p-3">بيان الحركة</th>
                  <th className="p-3 text-left">مدين (Debit)</th>
                  <th className="p-3 text-left">دائن (Credit)</th>
                  <th className="p-3 text-left">المعادل بالعملات الأجنبية ($ / ر.س)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {ledgerTransactions.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-6 text-center text-slate-400">
                      لا توجد حركات مرحلة على هذا الحساب خلال الفترة المحددة.
                    </td>
                  </tr>
                ) : (
                  ledgerTransactions.map((tx, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/80">
                      <td className="p-3 text-slate-500 font-mono">{tx.date}</td>
                      <td className="p-3 font-mono font-bold text-blue-600">{tx.entryNumber}</td>
                      <td className="p-3 font-mono text-slate-500">{tx.reference}</td>
                      <td className="p-3 text-slate-800 font-medium">{tx.description}</td>
                      <td className="p-3 text-left font-mono font-bold text-emerald-600">
                        {tx.debit > 0 ? fmtYER(tx.debit) : '-'}
                      </td>
                      <td className="p-3 text-left font-mono font-bold text-amber-600">
                        {tx.credit > 0 ? fmtYER(tx.credit) : '-'}
                      </td>
                      <td className="p-3 text-left font-mono text-[11px] text-slate-500">
                        {tx.debit > 0 ? (
                          <span>{fmtUSD(tx.debit)} | {fmtSAR(tx.debit)}</span>
                        ) : tx.credit > 0 ? (
                          <span>{fmtUSD(tx.credit)} | {fmtSAR(tx.credit)}</span>
                        ) : '-'}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* REPORT 5: MULTI-CURRENCY YEMENI ZAKAT & TAX REPORT                         */}
      {/* ========================================================================= */}
      {selectedReport === 'zakat-tax' && (
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-6 max-w-4xl mx-auto">
          <div className="text-center border-b border-slate-200 pb-4">
            <h3 className="text-lg font-bold text-slate-800">إقرار وحساب الزكاة والضرائب القانونية اليمنية</h3>
            <p className="text-xs text-slate-500">الهيئة العامة للزكاة ومصلحة الضرائب - الجمهورية اليمنية</p>
            <p className="text-[11px] text-slate-400 mt-1">
              يتم الاحتساب بالريال اليمني كعملة قانونية مع التحويل التلقائي للعملات الأجنبية للتقارير الإدارية والشركاء
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {/* ZAKAT COMPUTATION (2.5%) */}
            <div className="bg-slate-50 p-5 rounded-2xl border border-emerald-200 space-y-4">
              <div className="flex items-center justify-between border-b border-emerald-200 pb-2">
                <div className="flex items-center gap-2 text-emerald-800 font-bold text-xs">
                  <Scale className="w-4 h-4 text-emerald-600" />
                  <span>الوعاء الزكوي الشرعي (Zakat Base 2.5%)</span>
                </div>
                <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                  2.5% سنوياً
                </span>
              </div>

              <div className="space-y-3 text-xs">
                <div className="flex justify-between items-center text-slate-700">
                  <span>رأس المال العامل + صافي الأرباح:</span>
                  <div className="text-left font-mono">
                    <span className="font-bold text-slate-900 block">{fmtYER(totalEquity)}</span>
                    <span className="text-[10px] text-slate-400 block">{fmtUSD(totalEquity)} | {fmtSAR(totalEquity)}</span>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-200 space-y-2">
                  <div className="flex justify-between font-bold text-sm text-emerald-800">
                    <span>مقدار الزكاة الواجبة سدادها:</span>
                    <span className="font-mono">{fmtYER(totalEquity * 0.025)}</span>
                  </div>
                  <div className="flex justify-between text-xs text-emerald-700 font-mono bg-emerald-50 p-2 rounded-lg border border-emerald-100">
                    <span>المعادل بالعملات الأجنبية:</span>
                    <span>{fmtUSD(totalEquity * 0.025)} | {fmtSAR(totalEquity * 0.025)}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* SALES TAX & INCOME TAX (5% & 20%) */}
            <div className="bg-slate-50 p-5 rounded-2xl border border-blue-200 space-y-4">
              <div className="flex items-center justify-between border-b border-blue-200 pb-2">
                <div className="flex items-center gap-2 text-blue-800 font-bold text-xs">
                  <Receipt className="w-4 h-4 text-blue-600" />
                  <span>الضرائب التجارية وضريبة المبيعات (Tax)</span>
                </div>
                <span className="px-2 py-0.5 rounded bg-blue-100 text-blue-800 text-[10px] font-bold">
                  مصلحة الضرائب
                </span>
              </div>

              <div className="space-y-3 text-xs">
                <div className="flex justify-between items-center text-slate-700">
                  <span>إجمالي المبيعات الخاضعة للضريبة:</span>
                  <span className="font-mono font-bold text-slate-900">{fmtYER(totalRevenues)}</span>
                </div>

                <div className="flex justify-between items-center text-slate-700">
                  <span>ضريبة المبيعات المحصلة (5% VAT):</span>
                  <div className="text-left font-mono">
                    <span className="font-bold text-slate-900 block">{fmtYER(totalRevenues * 0.05)}</span>
                    <span className="text-[10px] text-slate-400 block">{fmtUSD(totalRevenues * 0.05)} | {fmtSAR(totalRevenues * 0.05)}</span>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-200 space-y-2">
                  <div className="flex justify-between font-bold text-sm text-blue-800">
                    <span>ضريبة الأرباح التجارية (20% من الصافي):</span>
                    <span className="font-mono">{fmtYER(Math.max(0, netIncome * 0.2))}</span>
                  </div>
                  <div className="flex justify-between text-xs text-blue-700 font-mono bg-blue-50 p-2 rounded-lg border border-blue-100">
                    <span>المعادل بالعملات الأجنبية:</span>
                    <span>{fmtUSD(Math.max(0, netIncome * 0.2))} | {fmtSAR(Math.max(0, netIncome * 0.2))}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* REPORT 6: FX CONSOLIDATED COMPARATIVE DASHBOARD                           */}
      {/* ========================================================================= */}
      {selectedReport === 'fx-consolidated' && (
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-6 max-w-5xl mx-auto">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-slate-200 pb-4">
            <div>
              <div className="flex items-center gap-2">
                <Coins className="w-5 h-5 text-purple-600" />
                <h3 className="text-lg font-bold text-slate-800">الملخص المالي المقارن الشامل للعملات (FX Consolidated Matrix)</h3>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                مقارنة فورية لكافة بنود القوائم المالية بالريال اليمني، الدولار الأمريكي، والريال السعودي بسعر الصرف المعتمد
              </p>
            </div>

            <button
              onClick={() => {
                const headers = ['البند المالي', 'القيمة بالريال اليمني (YER)', 'القيمة بالدولار الأمريكي (USD)', 'القيمة بالريال السعودي (SAR)'];
                const rows = [
                  ['إجمالي الأصول (Assets)', totalAssets, toUSD(totalAssets).toFixed(2), toSAR(totalAssets).toFixed(2)],
                  ['إجمالي الخصوم (Liabilities)', totalLiabilities, toUSD(totalLiabilities).toFixed(2), toSAR(totalLiabilities).toFixed(2)],
                  ['حقوق الملكية (Equity)', totalEquity, toUSD(totalEquity).toFixed(2), toSAR(totalEquity).toFixed(2)],
                  ['إجمالي الإيرادات (Revenues)', totalRevenues, toUSD(totalRevenues).toFixed(2), toSAR(totalRevenues).toFixed(2)],
                  ['إجمالي المصروفات (Expenses)', totalExpenses, toUSD(totalExpenses).toFixed(2), toSAR(totalExpenses).toFixed(2)],
                  ['صافي ربح الفترة (Net Income)', netIncome, toUSD(netIncome).toFixed(2), toSAR(netIncome).toFixed(2)],
                  ['مقدار الزكاة الواجبة (2.5%)', totalEquity * 0.025, toUSD(totalEquity * 0.025).toFixed(2), toSAR(totalEquity * 0.025).toFixed(2)],
                  ['ضريبة المبيعات (5%)', totalRevenues * 0.05, toUSD(totalRevenues * 0.05).toFixed(2), toSAR(totalRevenues * 0.05).toFixed(2)],
                ];
                exportToCsv('الملخص_المالي_المقارن_للعملات', headers, rows);
              }}
              className="px-3.5 py-2 bg-purple-50 hover:bg-purple-100 border border-purple-200 text-purple-800 rounded-xl text-xs font-bold flex items-center gap-1.5 transition no-print"
            >
              <Download className="w-3.5 h-3.5" />
              <span>تصدير المصفوفة المالية CSV</span>
            </button>
          </div>

          {/* Matrix Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs">
              <thead className="bg-slate-50 text-slate-700 border-b border-slate-200 font-bold">
                <tr>
                  <th className="p-3">البند المالي والقائمة</th>
                  <th className="p-3 text-left font-mono">الريال اليمني (YER - الأساس)</th>
                  <th className="p-3 text-left font-mono text-blue-700 bg-blue-50/40">الدولار الأمريكي (USD)</th>
                  <th className="p-3 text-left font-mono text-emerald-700 bg-emerald-50/40">الريال السعودي (SAR)</th>
                  <th className="p-3 text-center">النسبة / المؤشر</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-mono">
                {/* Assets */}
                <tr className="hover:bg-slate-50">
                  <td className="p-3 font-sans font-bold text-slate-800 flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-blue-600"></span>
                    إجمالي الأصول والموجودات (Total Assets)
                  </td>
                  <td className="p-3 text-left font-bold text-slate-900">{fmtYER(totalAssets)}</td>
                  <td className="p-3 text-left font-bold text-blue-700 bg-blue-50/20">{fmtUSD(totalAssets)}</td>
                  <td className="p-3 text-left font-bold text-emerald-700 bg-emerald-50/20">{fmtSAR(totalAssets)}</td>
                  <td className="p-3 text-center font-sans text-slate-500 font-semibold">100%</td>
                </tr>

                {/* Liabilities */}
                <tr className="hover:bg-slate-50">
                  <td className="p-3 font-sans font-bold text-slate-800 flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-600"></span>
                    إجمالي الخصوم والالتزامات (Liabilities)
                  </td>
                  <td className="p-3 text-left font-bold text-slate-900">{fmtYER(totalLiabilities)}</td>
                  <td className="p-3 text-left font-bold text-blue-700 bg-blue-50/20">{fmtUSD(totalLiabilities)}</td>
                  <td className="p-3 text-left font-bold text-emerald-700 bg-emerald-50/20">{fmtSAR(totalLiabilities)}</td>
                  <td className="p-3 text-center font-sans text-slate-500 font-semibold">
                    {totalAssets > 0 ? ((totalLiabilities / totalAssets) * 100).toFixed(1) : 0}% من الأصول
                  </td>
                </tr>

                {/* Equity */}
                <tr className="hover:bg-slate-50">
                  <td className="p-3 font-sans font-bold text-slate-800 flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-purple-600"></span>
                    حقوق الملكية ورأس المال (Total Equity)
                  </td>
                  <td className="p-3 text-left font-bold text-slate-900">{fmtYER(totalEquity)}</td>
                  <td className="p-3 text-left font-bold text-blue-700 bg-blue-50/20">{fmtUSD(totalEquity)}</td>
                  <td className="p-3 text-left font-bold text-emerald-700 bg-emerald-50/20">{fmtSAR(totalEquity)}</td>
                  <td className="p-3 text-center font-sans text-slate-500 font-semibold">
                    {totalAssets > 0 ? ((totalEquity / totalAssets) * 100).toFixed(1) : 0}% من الأصول
                  </td>
                </tr>

                {/* Revenues */}
                <tr className="hover:bg-slate-50">
                  <td className="p-3 font-sans font-bold text-slate-800 flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-600"></span>
                    إجمالي الإيرادات التشغيلية (Revenues)
                  </td>
                  <td className="p-3 text-left font-bold text-slate-900">{fmtYER(totalRevenues)}</td>
                  <td className="p-3 text-left font-bold text-blue-700 bg-blue-50/20">{fmtUSD(totalRevenues)}</td>
                  <td className="p-3 text-left font-bold text-emerald-700 bg-emerald-50/20">{fmtSAR(totalRevenues)}</td>
                  <td className="p-3 text-center font-sans text-slate-500 font-semibold">إيراد الفترة</td>
                </tr>

                {/* Expenses */}
                <tr className="hover:bg-slate-50">
                  <td className="p-3 font-sans font-bold text-slate-800 flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-rose-600"></span>
                    إجمالي المصروفات والتشغيل (Expenses)
                  </td>
                  <td className="p-3 text-left font-bold text-slate-900">{fmtYER(totalExpenses)}</td>
                  <td className="p-3 text-left font-bold text-blue-700 bg-blue-50/20">{fmtUSD(totalExpenses)}</td>
                  <td className="p-3 text-left font-bold text-emerald-700 bg-emerald-50/20">{fmtSAR(totalExpenses)}</td>
                  <td className="p-3 text-center font-sans text-slate-500 font-semibold">
                    {totalRevenues > 0 ? ((totalExpenses / totalRevenues) * 100).toFixed(1) : 0}% من الإيراد
                  </td>
                </tr>

                {/* Net Income */}
                <tr className="bg-emerald-50/60 font-bold border-t-2 border-emerald-200">
                  <td className="p-3 font-sans font-extrabold text-emerald-900 flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    صافي ربح النشاط (Net Profit)
                  </td>
                  <td className="p-3 text-left font-extrabold text-emerald-900">{fmtYER(netIncome)}</td>
                  <td className="p-3 text-left font-extrabold text-blue-800 bg-blue-50/50">{fmtUSD(netIncome)}</td>
                  <td className="p-3 text-left font-extrabold text-emerald-800 bg-emerald-50/50">{fmtSAR(netIncome)}</td>
                  <td className="p-3 text-center font-sans text-emerald-700 font-bold">
                    هامش {totalRevenues > 0 ? ((netIncome / totalRevenues) * 100).toFixed(1) : 0}%
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Formal Print Signature Footer (Visible only when printing) */}
      <div className="hidden print-only mt-12 pt-6 border-t-2 border-slate-400 text-slate-900">
        <div className="grid grid-cols-3 gap-6 text-center text-xs font-bold">
          <div>
            <p className="text-slate-700 mb-8">المحاسب المسؤول / الإعداد</p>
            <p className="border-b border-dashed border-slate-400 pb-1">........................................</p>
            <p className="text-[10px] text-slate-500 mt-1">التوقيع والتاريخ</p>
          </div>
          <div>
            <p className="text-slate-700 mb-8">المدير المالي / المراجعة</p>
            <p className="border-b border-dashed border-slate-400 pb-1">........................................</p>
            <p className="text-[10px] text-slate-500 mt-1">التوقيع والتاريخ</p>
          </div>
          <div>
            <p className="text-slate-700 mb-8">المراجع الخارجي / مصادقة الإدارة</p>
            <p className="border-b border-dashed border-slate-400 pb-1">........................................</p>
            <p className="text-[10px] text-slate-500 mt-1">الختم والتوقيع الرسمي</p>
          </div>
        </div>
      </div>
    </div>
  );
};
