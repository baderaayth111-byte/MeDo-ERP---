import React, { useState } from 'react';
import { 
  ArrowLeftRight, 
  Banknote, 
  Send, 
  Download, 
  TrendingUp, 
  TrendingDown, 
  ShieldCheck, 
  Printer, 
  Search, 
  Plus, 
  Check, 
  X, 
  CheckCircle2, 
  AlertTriangle, 
  QrCode, 
  Building2, 
  Coins, 
  User, 
  Phone, 
  Globe, 
  Lock, 
  KeyRound, 
  Sparkles, 
  FileSpreadsheet, 
  Zap, 
  DollarSign, 
  Layers, 
  RefreshCw, 
  Sliders, 
  Info,
  BadgeAlert,
  Landmark
} from 'lucide-react';
import { FxDeal, RemittanceTransaction, FxVaultBalance, FxDealType, RemittanceStatus } from '../types/foreignExchange';
import { CompanyProfile, JournalEntry, Currency } from '../types/accounting';
import { CompanyHeaderView } from './CompanyHeaderView';

interface ForeignExchangeViewProps {
  companyProfile: CompanyProfile;
  fxVaults: FxVaultBalance[];
  onUpdateVaults: (updatedVaults: FxVaultBalance[]) => void;
  fxDeals: FxDeal[];
  onAddFxDeal: (deal: FxDeal) => void;
  remittances: RemittanceTransaction[];
  onAddRemittance: (remittance: RemittanceTransaction) => void;
  onUpdateRemittanceStatus: (id: string, status: RemittanceStatus, payoutInfo?: { payoutDate: string; payoutBranch: string; payoutUser: string }) => void;
  onAddJournalEntry: (entry: JournalEntry) => void;
}

export const ForeignExchangeView: React.FC<ForeignExchangeViewProps> = ({
  companyProfile,
  fxVaults,
  onUpdateVaults,
  fxDeals,
  onAddFxDeal,
  remittances,
  onAddRemittance,
  onUpdateRemittanceStatus,
  onAddJournalEntry,
}) => {
  const [activeTab, setActiveTab] = useState<'OTC_EXCHANGE' | 'REMITTANCES' | 'RATE_BOARD' | 'VAULTS' | 'COMPLIANCE'>('OTC_EXCHANGE');

  // --- OTC FX Exchange Calculator State ---
  const [dealType, setDealType] = useState<FxDealType>('BUY'); // BUY = we buy foreign currency, SELL = we sell foreign currency
  const [foreignCurrency, setForeignCurrency] = useState<string>('USD');
  const [foreignAmount, setForeignAmount] = useState<number | ''>(1000);
  const [customMargin, setCustomMargin] = useState<number>(0.2); // 0.2% margin
  const [serviceFee, setServiceFee] = useState<number>(0);
  
  // Customer Info (KYC)
  const [customerName, setCustomerName] = useState<string>('');
  const [customerPhone, setCustomerPhone] = useState<string>('');
  const [customerIdType, setCustomerIdType] = useState<string>('NATIONAL_ID');
  const [customerIdNumber, setCustomerIdNumber] = useState<string>('');
  const [nationality, setNationality] = useState<string>('يمني');
  const [purpose, setPurpose] = useState<string>('مصاريف شخصية وتجارية');
  const [notes, setNotes] = useState<string>('');

  // Receipt Modal State
  const [selectedDealReceipt, setSelectedDealReceipt] = useState<FxDeal | null>(null);
  const [selectedRemittanceSlip, setSelectedRemittanceSlip] = useState<RemittanceTransaction | null>(null);

  // --- Remittance Outward Form State ---
  const [remittanceMode, setRemittanceMode] = useState<'SEND' | 'PAYOUT' | 'LEDGER'>('SEND');
  
  // Send Remittance Fields
  const [senderName, setSenderName] = useState<string>('');
  const [senderPhone, setSenderPhone] = useState<string>('');
  const [senderIdNumber, setSenderIdNumber] = useState<string>('');
  const [receiverName, setReceiverName] = useState<string>('');
  const [receiverPhone, setReceiverPhone] = useState<string>('');
  const [receiverCountry, setReceiverCountry] = useState<string>('المملكة العربية السعودية');
  const [receiverCity, setReceiverCity] = useState<string>('الرياض');
  const [payoutAgentOrBank, setPayoutAgentOrBank] = useState<string>('مصرف الراجحي');
  const [payoutAccountOrIban, setPayoutAccountOrIban] = useState<string>('');
  const [sendCurrency, setSendCurrency] = useState<string>('USD');
  const [sendAmount, setSendAmount] = useState<number | ''>(500);
  const [remittanceCommission, setRemittanceCommission] = useState<number>(15);
  const [remittancePurpose, setRemittancePurpose] = useState<string>('دعم عائلي ومساعدات');

  // Payout Remittance Search State
  const [searchMtcn, setSearchMtcn] = useState<string>('');
  const [payoutFoundRemittance, setPayoutFoundRemittance] = useState<RemittanceTransaction | null>(null);
  const [inputPin, setInputPin] = useState<string>('');
  const [payoutError, setPayoutError] = useState<string>('');

  // Selected Vault for Rate Management
  const selectedVaultObj = fxVaults.find(v => v.currency === foreignCurrency) || fxVaults[0];

  // Calculated OTC Values
  const numForeignAmt = typeof foreignAmount === 'number' ? foreignAmount : 0;
  const currentBuyRate = selectedVaultObj.buyRate;
  const currentSellRate = selectedVaultObj.sellRate;

  // Calculate actual applied rate based on BUY/SELL and margin
  const appliedRate = dealType === 'BUY' 
    ? Math.round((currentBuyRate * (1 - customMargin / 100)) * 100) / 100
    : Math.round((currentSellRate * (1 + customMargin / 100)) * 100) / 100;

  const baseCurrencyAmount = Math.round(numForeignAmt * appliedRate);
  const spreadMarginProfit = dealType === 'BUY'
    ? Math.round(numForeignAmt * (selectedVaultObj.officialRate - appliedRate))
    : Math.round(numForeignAmt * (appliedRate - selectedVaultObj.officialRate));

  const totalRealizedProfit = Math.max(0, spreadMarginProfit) + Number(serviceFee);

  // --- Handlers ---
  const handleExecuteFxDeal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerName.trim() || !customerPhone.trim() || !numForeignAmt || numForeignAmt <= 0) {
      alert('يرجى تعبئة كافة بيانات العميل والمبلغ بشكل صحيح.');
      return;
    }

    const dealNo = `FX-2026-${Math.floor(10000 + Math.random() * 90000)}`;
    const newDeal: FxDeal = {
      id: `FX-DEAL-${Date.now()}`,
      dealNumber: dealNo,
      date: new Date().toISOString(),
      dealType,
      fromCurrency: dealType === 'BUY' ? foreignCurrency : 'YER',
      toCurrency: dealType === 'BUY' ? 'YER' : foreignCurrency,
      fromAmount: dealType === 'BUY' ? numForeignAmt : baseCurrencyAmount,
      toAmount: dealType === 'BUY' ? baseCurrencyAmount : numForeignAmt,
      exchangeRate: appliedRate,
      marginPercent: customMargin,
      feeAmount: Number(serviceFee),
      realizedProfit: totalRealizedProfit,
      customerName,
      customerPhone,
      customerIdType,
      customerIdNumber: customerIdNumber || '10000000',
      nationality,
      purpose,
      notes,
      cashierName: 'أحمد المحاسب - الصراف الرئيسي',
      branchId: 'BR-01',
      status: 'COMPLETED',
      journalEntryId: `JE-${dealNo}`,
    };

    // Update FX Vault balances
    const updatedVaults = fxVaults.map(vault => {
      if (vault.currency === foreignCurrency) {
        const change = dealType === 'BUY' ? numForeignAmt : -numForeignAmt;
        return {
          ...vault,
          currentBalance: vault.currentBalance + change,
          baseEquivalent: Math.round((vault.currentBalance + change) * vault.officialRate),
        };
      }
      if (vault.currency === 'YER') {
        const change = dealType === 'BUY' ? -baseCurrencyAmount : baseCurrencyAmount;
        return {
          ...vault,
          currentBalance: vault.currentBalance + change,
          baseEquivalent: vault.currentBalance + change,
        };
      }
      return vault;
    });

    onUpdateVaults(updatedVaults);
    onAddFxDeal(newDeal);

    // Auto-generate General Ledger Journal Entry
    const je: JournalEntry = {
      id: `JE-${dealNo}`,
      entryNumber: `JE-${dealNo}`,
      date: new Date().toISOString().split('T')[0],
      reference: dealNo,
      description: `قيد صرافة عملات (${dealType === 'BUY' ? 'شراء' : 'بيع'} ${foreignCurrency} بمبلغ ${numForeignAmt}) للعميل ${customerName}`,
      lines: [
        {
          id: `line-1-${Date.now()}`,
          accountCode: dealType === 'BUY' ? '1010-02' : '1010-01', // Foreign Vault vs Local Vault
          accountName: dealType === 'BUY' ? `صندوق العملات الأجنبية (${foreignCurrency})` : 'صندوق الريال اليمني الرئيسي',
          debit: dealType === 'BUY' ? baseCurrencyAmount : baseCurrencyAmount,
          credit: 0,
          currency: 'YER',
          exchangeRate: 1,
          amountInBase: baseCurrencyAmount,
          description: `استلام مبلغ الصرافة - ${dealNo}`,
        },
        {
          id: `line-2-${Date.now()}`,
          accountCode: dealType === 'BUY' ? '1010-01' : '1010-02',
          accountName: dealType === 'BUY' ? 'صندوق الريال اليمني الرئيسي' : `صندوق العملات الأجنبية (${foreignCurrency})`,
          debit: 0,
          credit: baseCurrencyAmount,
          currency: 'YER',
          exchangeRate: 1,
          amountInBase: baseCurrencyAmount,
          description: `تسليم المقابل - ${dealNo}`,
        },
      ],
      totalDebit: baseCurrencyAmount,
      totalCredit: baseCurrencyAmount,
      status: 'POSTED',
      createdBy: 'نظام الصرافة والبنك الآلي',
      postedAt: new Date().toISOString(),
    };

    onAddJournalEntry(je);

    // Show Receipt
    setSelectedDealReceipt(newDeal);

    // Reset Form
    setCustomerName('');
    setCustomerPhone('');
    setCustomerIdNumber('');
    setNotes('');
  };

  // Handler for Sending Remittance
  const handleSendRemittance = (e: React.FormEvent) => {
    e.preventDefault();
    if (!senderName.trim() || !receiverName.trim() || !sendAmount || Number(sendAmount) <= 0) {
      alert('يرجى إدخال كافة بيانات المرسل والمستفيد والمبلغ بشكل صحيح.');
      return;
    }

    const mtcnCode = `${Math.floor(100 + Math.random() * 900)}-${Math.floor(100 + Math.random() * 900)}-${Math.floor(1000 + Math.random() * 9000)}`;
    const pin = `${Math.floor(1000 + Math.random() * 9000)}`;

    const numSendAmt = Number(sendAmount);
    const comm = Number(remittanceCommission);

    const newRemittance: RemittanceTransaction = {
      id: `REM-${Date.now()}`,
      mtcn: mtcnCode,
      date: new Date().toISOString(),
      type: 'OUTWARD',
      senderName,
      senderPhone: senderPhone || '+967 770 000 000',
      senderIdType: 'NATIONAL_ID',
      senderIdNumber: senderIdNumber || '1000293847',
      senderCountry: 'الجمهورية اليمنية',
      receiverName,
      receiverPhone: receiverPhone || '+966 50 000 0000',
      receiverCountry,
      receiverCity,
      payoutAgentOrBank,
      payoutAccountOrIban,
      sendCurrency,
      sendAmount: numSendAmt,
      receiveCurrency: sendCurrency === 'USD' ? 'SAR' : sendCurrency,
      receiveAmount: sendCurrency === 'USD' ? Math.round(numSendAmt * 3.75) : numSendAmt,
      exchangeRate: sendCurrency === 'USD' ? 3.75 : 1.0,
      commissionFee: comm,
      agentFee: 5,
      totalPaidBySender: numSendAmt + comm,
      verificationPin: pin,
      purpose: remittancePurpose,
      kycVerified: true,
      status: 'READY_FOR_PAYOUT',
      createdBranch: 'الفرع الرئيسي - صنعاء',
      createdUser: 'أحمد المحاسب',
    };

    onAddRemittance(newRemittance);
    setSelectedRemittanceSlip(newRemittance);

    // Reset form
    setSenderName('');
    setSenderPhone('');
    setReceiverName('');
    setReceiverPhone('');
    setPayoutAccountOrIban('');
  };

  // Search MTCN
  const handleSearchMtcn = () => {
    setPayoutError('');
    if (!searchMtcn.trim()) return;

    const found = remittances.find(r => 
      r.mtcn.replace(/-/g, '') === searchMtcn.replace(/-/g, '').trim() ||
      r.receiverPhone.includes(searchMtcn)
    );

    if (!found) {
      setPayoutError('لم يتم العثور على حوالة بهذا الرقم المرجعي MTCN أو رقم الهاتف.');
      setPayoutFoundRemittance(null);
    } else {
      setPayoutFoundRemittance(found);
    }
  };

  // Payout Execution
  const handleExecutePayout = () => {
    if (!payoutFoundRemittance) return;
    if (payoutFoundRemittance.status === 'PAID') {
      alert('هذه الحوالة مدفوعة ومصروفة سابقاً!');
      return;
    }
    if (inputPin !== payoutFoundRemittance.verificationPin) {
      setPayoutError('رمز السر للتحقق (PIN) غير صحيح!');
      return;
    }

    onUpdateRemittanceStatus(payoutFoundRemittance.id, 'PAID', {
      payoutDate: new Date().toISOString(),
      payoutBranch: 'الفرع الرئيسي - صنعاء',
      payoutUser: 'أحمد المحاسب',
    });

    setPayoutFoundRemittance({ ...payoutFoundRemittance, status: 'PAID' });
    alert('تم صرف وتسليم الحوالة بنجاح وتحديث حساب الخزينة.');
  };

  return (
    <div className="space-y-6">
      {/* Top Header & T-Code Banner */}
      <div className="bg-slate-900 text-white p-6 rounded-3xl border border-slate-800 shadow-xl relative overflow-hidden">
        <div className="absolute left-0 top-0 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 relative z-10">
          <div className="flex items-center gap-3.5">
            <div className="p-3 bg-blue-600 text-white rounded-2xl shadow-lg shadow-blue-500/30">
              <Landmark className="w-8 h-8" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-black tracking-tight">نظام الصرافة والتحويلات المصرفية للمجموعة</h1>
                <span className="text-xs font-mono bg-blue-900/80 text-blue-300 border border-blue-700/60 px-2.5 py-0.5 rounded-full font-bold">
                  SAP T-Code: FX-DEAL / REMITTANCE
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-1">
                بيع وشراء العملات الأجنبية، إدارة الحوالات المالية السريعة، أسعار الصرف الحية، والامتثال المصرفي (KYC / AML)
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 bg-slate-800/80 p-2 rounded-2xl border border-slate-700/80">
            <div className="text-right px-3 border-l border-slate-700">
              <div className="text-[10px] text-slate-400 font-bold">سعر صرف الدولار (USD)</div>
              <div className="text-sm font-black text-emerald-400 font-mono">
                {fxVaults.find(v => v.currency === 'USD')?.buyRate} / {fxVaults.find(v => v.currency === 'USD')?.sellRate}
              </div>
            </div>
            <div className="text-right px-3">
              <div className="text-[10px] text-slate-400 font-bold">سعر صرف السعودي (SAR)</div>
              <div className="text-sm font-black text-amber-400 font-mono">
                {fxVaults.find(v => v.currency === 'SAR')?.buyRate} / {fxVaults.find(v => v.currency === 'SAR')?.sellRate}
              </div>
            </div>
          </div>
        </div>

        {/* Tab Navigation Menu */}
        <div className="flex items-center gap-2 mt-6 pt-4 border-t border-slate-800 overflow-x-auto">
          <button
            onClick={() => setActiveTab('OTC_EXCHANGE')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs transition shrink-0 ${
              activeTab === 'OTC_EXCHANGE'
                ? 'bg-blue-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Banknote className="w-4 h-4" />
            نافذة بيع وشراء العملات (OTC Desk)
          </button>

          <button
            onClick={() => setActiveTab('REMITTANCES')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs transition shrink-0 ${
              activeTab === 'REMITTANCES'
                ? 'bg-blue-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Send className="w-4 h-4" />
            نظام الحوالات والتحويلات المصرفية
          </button>

          <button
            onClick={() => setActiveTab('RATE_BOARD')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs transition shrink-0 ${
              activeTab === 'RATE_BOARD'
                ? 'bg-blue-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <TrendingUp className="w-4 h-4" />
            لوحة أسعار الصرف الحية
          </button>

          <button
            onClick={() => setActiveTab('VAULTS')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs transition shrink-0 ${
              activeTab === 'VAULTS'
                ? 'bg-blue-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Coins className="w-4 h-4" />
            خزائن العملات والجرد (Teller Vaults)
          </button>

          <button
            onClick={() => setActiveTab('COMPLIANCE')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs transition shrink-0 ${
              activeTab === 'COMPLIANCE'
                ? 'bg-blue-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <ShieldCheck className="w-4 h-4" />
            الامتثال ومكافحة غسل الأموال (AML/KYC)
          </button>
        </div>
      </div>

      {/* TAB 1: OTC CURRENCY EXCHANGE COUNTER */}
      {activeTab === 'OTC_EXCHANGE' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Exchange Form & Calculator (7 Cols) */}
          <div className="lg:col-span-7 space-y-6">
            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-6">
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl">
                    <ArrowLeftRight className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-slate-900">نافذة الصرافة المباشرة وتصريف العملات</h2>
                    <p className="text-xs text-slate-500">حاسبة الأسعار والهامش الربحي وإصدار الفاتورة</p>
                  </div>
                </div>

                {/* Deal Type Switcher */}
                <div className="flex bg-slate-100 p-1 rounded-2xl border border-slate-200">
                  <button
                    type="button"
                    onClick={() => setDealType('BUY')}
                    className={`px-4 py-2 rounded-xl text-xs font-bold transition ${
                      dealType === 'BUY'
                        ? 'bg-emerald-600 text-white shadow-sm'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    شراء عملة من العميل (Buy FX)
                  </button>
                  <button
                    type="button"
                    onClick={() => setDealType('SELL')}
                    className={`px-4 py-2 rounded-xl text-xs font-bold transition ${
                      dealType === 'SELL'
                        ? 'bg-rose-600 text-white shadow-sm'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    بيع عملة للعميل (Sell FX)
                  </button>
                </div>
              </div>

              <form onSubmit={handleExecuteFxDeal} className="space-y-5">
                {/* Currency Selection & Amount Inputs */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">العملة الأجنبية المستهدفة</label>
                    <select
                      value={foreignCurrency}
                      onChange={(e) => setForeignCurrency(e.target.value)}
                      className="w-full p-3 bg-slate-50 border border-slate-300 rounded-xl font-bold text-xs outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      {fxVaults.filter(v => v.currency !== 'YER').map(v => (
                        <option key={v.currency} value={v.currency}>
                          {v.currency} - {v.currencyNameAr} (المتوفر: {v.currentBalance.toLocaleString()} {v.symbol})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      المبلغ بالعملة الأجنبية ({selectedVaultObj.symbol})
                    </label>
                    <input
                      type="number"
                      value={foreignAmount}
                      onChange={(e) => setForeignAmount(e.target.value === '' ? '' : Number(e.target.value))}
                      placeholder="أدخل المبلغ..."
                      className="w-full p-3 bg-slate-50 border border-slate-300 rounded-xl font-bold text-sm outline-none focus:ring-2 focus:ring-blue-500 font-mono"
                      required
                      min={1}
                    />
                  </div>
                </div>

                {/* Live Rates & Applied Rate Display Box */}
                <div className="bg-slate-900 text-white p-5 rounded-2xl border border-slate-800 space-y-3">
                  <div className="flex items-center justify-between text-xs border-b border-slate-800 pb-2">
                    <span className="text-slate-400 font-bold">سعر الشراء السائد: <strong className="text-emerald-400 font-mono">{currentBuyRate}</strong></span>
                    <span className="text-slate-400 font-bold">سعر البيع السائد: <strong className="text-rose-400 font-mono">{currentSellRate}</strong></span>
                    <span className="text-slate-400 font-bold">سعر البنك المركزي: <strong className="text-blue-400 font-mono">{selectedVaultObj.officialRate}</strong></span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-1 text-center">
                    <div className="bg-slate-800/80 p-3 rounded-xl border border-slate-700/80">
                      <div className="text-[10px] text-slate-400 font-bold">سعر التبادل المطبق</div>
                      <div className="text-lg font-black text-amber-400 font-mono mt-0.5">
                        {appliedRate} <span className="text-[10px] text-slate-400">ريال/{foreignCurrency}</span>
                      </div>
                    </div>

                    <div className="bg-slate-800/80 p-3 rounded-xl border border-slate-700/80">
                      <div className="text-[10px] text-slate-400 font-bold">المقابل بالريال اليمني (YER)</div>
                      <div className="text-lg font-black text-emerald-400 font-mono mt-0.5">
                        {baseCurrencyAmount.toLocaleString()} <span className="text-[10px] text-slate-400">ر.ي</span>
                      </div>
                    </div>

                    <div className="bg-slate-800/80 p-3 rounded-xl border border-slate-700/80 col-span-2 sm:col-span-1">
                      <div className="text-[10px] text-slate-400 font-bold">صافي ربح الصرافة المحقق</div>
                      <div className="text-lg font-black text-blue-400 font-mono mt-0.5">
                        +{totalRealizedProfit.toLocaleString()} <span className="text-[10px] text-slate-400">ر.ي</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Customer KYC Form */}
                <div className="border-t border-slate-200 pt-4 space-y-4">
                  <div className="flex items-center gap-2 font-bold text-xs text-slate-900">
                    <User className="w-4 h-4 text-blue-600" />
                    بيانات العميل المعتمدة (KYC Compliance):
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    <div>
                      <label className="block text-slate-600 font-bold mb-1">اسم العميل الرباعي</label>
                      <input
                        type="text"
                        value={customerName}
                        onChange={(e) => setCustomerName(e.target.value)}
                        placeholder="مثال: عبدالرحمن محمد سعيد الشامي"
                        className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 font-bold"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-slate-600 font-bold mb-1">رقم الهاتف والجوال</label>
                      <input
                        type="text"
                        value={customerPhone}
                        onChange={(e) => setCustomerPhone(e.target.value)}
                        placeholder="+967 770 000 000"
                        className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 font-mono text-left"
                        dir="ltr"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-slate-600 font-bold mb-1">نوع إثبات الهوية</label>
                      <select
                        value={customerIdType}
                        onChange={(e) => setCustomerIdType(e.target.value)}
                        className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 font-bold"
                      >
                        <option value="NATIONAL_ID">بطاقة شخصية آلي</option>
                        <option value="PASSPORT">جواز سفر رسمي</option>
                        <option value="COMMERCIAL_REG">سجل تجاري شركة</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-slate-600 font-bold mb-1">رقم الهوية / الجواز</label>
                      <input
                        type="text"
                        value={customerIdNumber}
                        onChange={(e) => setCustomerIdNumber(e.target.value)}
                        placeholder="أدخل الرقم..."
                        className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 font-mono"
                      />
                    </div>
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full py-3.5 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-bold text-sm shadow-lg transition flex items-center justify-center gap-2"
                >
                  <CheckCircle2 className="w-5 h-5" />
                  تنفيذ عملية الصرافة وطباعة الفاتورة والترحيل الآلي
                </button>
              </form>
            </div>
          </div>

          {/* Recent FX Deals History (5 Cols) */}
          <div className="lg:col-span-5 space-y-4">
            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                  <Banknote className="w-4 h-4 text-blue-600" />
                  سجل عمليات الصرافة الأخيرة
                </h3>
                <span className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded font-mono font-bold">
                  {fxDeals.length} عملية
                </span>
              </div>

              <div className="space-y-3 max-h-[520px] overflow-y-auto pr-1">
                {fxDeals.map((deal) => (
                  <div key={deal.id} className="p-4 bg-slate-50 hover:bg-slate-100/80 rounded-2xl border border-slate-200 transition space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-xs font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                        {deal.dealNumber}
                      </span>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                        deal.dealType === 'BUY' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                      }`}>
                        {deal.dealType === 'BUY' ? 'شراء عملة' : 'بيع عملة'}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-xs">
                      <div>
                        <p className="font-bold text-slate-900">{deal.customerName}</p>
                        <p className="text-[10px] text-slate-500 font-mono">{deal.fromAmount.toLocaleString()} {deal.fromCurrency} ➔ {deal.toAmount.toLocaleString()} {deal.toCurrency}</p>
                      </div>
                      <div className="text-left font-mono">
                        <p className="text-slate-800 font-bold">{deal.exchangeRate} ر.ي</p>
                        <p className="text-[10px] text-emerald-600 font-bold">ربح: +{deal.realizedProfit.toLocaleString()} ر.ي</p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-slate-200/60 text-[10px] text-slate-500">
                      <span>{new Date(deal.date).toLocaleTimeString('ar-YE', { hour: '2-digit', minute: '2-digit' })}</span>
                      <button
                        onClick={() => setSelectedDealReceipt(deal)}
                        className="text-blue-600 hover:text-blue-800 font-bold flex items-center gap-1"
                      >
                        <Printer className="w-3 h-3" />
                        عرض الطباعة
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: REMITTANCES MODULE */}
      {activeTab === 'REMITTANCES' && (
        <div className="space-y-6">
          {/* Sub-tab Navigation */}
          <div className="flex items-center justify-between bg-white p-3 rounded-2xl border border-slate-200 shadow-xs">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setRemittanceMode('SEND')}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
                  remittanceMode === 'SEND' ? 'bg-blue-600 text-white' : 'hover:bg-slate-100 text-slate-700'
                }`}
              >
                <Send className="w-4 h-4" />
                إرسال حوالة جديدة (Outward)
              </button>

              <button
                onClick={() => setRemittanceMode('PAYOUT')}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
                  remittanceMode === 'PAYOUT' ? 'bg-blue-600 text-white' : 'hover:bg-slate-100 text-slate-700'
                }`}
              >
                <Download className="w-4 h-4" />
                استلام وصرف حوالة (Payout)
              </button>

              <button
                onClick={() => setRemittanceMode('LEDGER')}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
                  remittanceMode === 'LEDGER' ? 'bg-blue-600 text-white' : 'hover:bg-slate-100 text-slate-700'
                }`}
              >
                <FileSpreadsheet className="w-4 h-4" />
                سجل وكشف الحوالات
              </button>
            </div>

            <span className="text-xs font-bold text-slate-500 font-mono">
              إجمالي الحوالات: {remittances.length}
            </span>
          </div>

          {/* SUB-MODE: SEND REMITTANCE */}
          {remittanceMode === 'SEND' && (
            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-6 max-w-4xl mx-auto">
              <div className="border-b border-slate-100 pb-4">
                <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                  <Send className="w-5 h-5 text-blue-600" />
                  إرسال حوالة مالية صادرة سريعة (Express Remittance)
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  إرسال المبالغ النقدية فورياً للبنوك والوكلاء في السعودية، الإمارات، تركيا، مصر وباقي الدول
                </p>
              </div>

              <form onSubmit={handleSendRemittance} className="space-y-6">
                {/* Sender Info */}
                <div className="space-y-3">
                  <h3 className="text-xs font-bold text-blue-700 flex items-center gap-1.5">
                    <User className="w-4 h-4" />
                    1. بيانات المرسل:
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                    <div>
                      <label className="block text-slate-600 font-bold mb-1">اسم المرسل الرباعي</label>
                      <input
                        type="text"
                        value={senderName}
                        onChange={(e) => setSenderName(e.target.value)}
                        placeholder="الاسم الكامل..."
                        className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl font-bold outline-none focus:ring-2 focus:ring-blue-500"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-slate-600 font-bold mb-1">رقم الجوال</label>
                      <input
                        type="text"
                        value={senderPhone}
                        onChange={(e) => setSenderPhone(e.target.value)}
                        placeholder="+967 777 000 000"
                        className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl font-mono text-left outline-none focus:ring-2 focus:ring-blue-500"
                        dir="ltr"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-600 font-bold mb-1">رقم الهوية</label>
                      <input
                        type="text"
                        value={senderIdNumber}
                        onChange={(e) => setSenderIdNumber(e.target.value)}
                        placeholder="أدخل رقم الهوية..."
                        className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl font-mono outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                </div>

                {/* Receiver Info */}
                <div className="space-y-3 border-t border-slate-100 pt-4">
                  <h3 className="text-xs font-bold text-blue-700 flex items-center gap-1.5">
                    <Globe className="w-4 h-4" />
                    2. بيانات المستفيد ووجهة الاستلام:
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                    <div>
                      <label className="block text-slate-600 font-bold mb-1">اسم المستفيد الرباعي المعتمد</label>
                      <input
                        type="text"
                        value={receiverName}
                        onChange={(e) => setReceiverName(e.target.value)}
                        placeholder="اسم المستفيد الكامل..."
                        className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl font-bold outline-none focus:ring-2 focus:ring-blue-500"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-slate-600 font-bold mb-1">رقم جوال المستفيد</label>
                      <input
                        type="text"
                        value={receiverPhone}
                        onChange={(e) => setReceiverPhone(e.target.value)}
                        placeholder="+966 50 000 0000"
                        className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl font-mono text-left outline-none focus:ring-2 focus:ring-blue-500"
                        dir="ltr"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-600 font-bold mb-1">دولة الاستلام</label>
                      <input
                        type="text"
                        value={receiverCountry}
                        onChange={(e) => setReceiverCountry(e.target.value)}
                        placeholder="مثال: المملكة العربية السعودية"
                        className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl font-bold outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-600 font-bold mb-1">المدينة / الفرع</label>
                      <input
                        type="text"
                        value={receiverCity}
                        onChange={(e) => setReceiverCity(e.target.value)}
                        placeholder="الرياض / جدة / إسطنبول"
                        className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl font-bold outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-600 font-bold mb-1">البنك أو الوكيل المستلم</label>
                      <input
                        type="text"
                        value={payoutAgentOrBank}
                        onChange={(e) => setPayoutAgentOrBank(e.target.value)}
                        placeholder="مصرف الراجحي / Kuveyt Turk"
                        className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl font-bold outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-600 font-bold mb-1">رقم الحساب / الأيبان IBAN (اختياري)</label>
                      <input
                        type="text"
                        value={payoutAccountOrIban}
                        onChange={(e) => setPayoutAccountOrIban(e.target.value)}
                        placeholder="SA448000..."
                        className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl font-mono outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                </div>

                {/* Financial Breakdown */}
                <div className="space-y-3 border-t border-slate-100 pt-4">
                  <h3 className="text-xs font-bold text-blue-700 flex items-center gap-1.5">
                    <DollarSign className="w-4 h-4" />
                    3. المبالغ والعمولات:
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                    <div>
                      <label className="block text-slate-600 font-bold mb-1">عملة التحويل</label>
                      <select
                        value={sendCurrency}
                        onChange={(e) => setSendCurrency(e.target.value)}
                        className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl font-bold outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="USD">USD - دولار أمريكي</option>
                        <option value="SAR">SAR - ريال سعودي</option>
                        <option value="EUR">EUR - يورو</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-slate-600 font-bold mb-1">المبلغ المحول</label>
                      <input
                        type="number"
                        value={sendAmount}
                        onChange={(e) => setSendAmount(e.target.value === '' ? '' : Number(e.target.value))}
                        className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl font-mono font-bold text-sm outline-none focus:ring-2 focus:ring-blue-500"
                        required
                        min={1}
                      />
                    </div>

                    <div>
                      <label className="block text-slate-600 font-bold mb-1">رسوم عمولة الحوالة</label>
                      <input
                        type="number"
                        value={remittanceCommission}
                        onChange={(e) => setRemittanceCommission(Number(e.target.value))}
                        className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl font-mono font-bold outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full py-3.5 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-bold text-sm shadow-lg transition flex items-center justify-center gap-2"
                >
                  <Send className="w-5 h-5" />
                  إصدار الحوالة وتوليد كود MTCN وإيصال الاستلام
                </button>
              </form>
            </div>
          )}

          {/* SUB-MODE: PAYOUT REMITTANCE */}
          {remittanceMode === 'PAYOUT' && (
            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-6 max-w-2xl mx-auto">
              <div className="border-b border-slate-100 pb-4 text-center">
                <Download className="w-8 h-8 text-blue-600 mx-auto mb-2" />
                <h2 className="text-lg font-bold text-slate-900">استلام وصرف الحوالات المالية</h2>
                <p className="text-xs text-slate-500">البحث برقم الحوالة المرجعي (MTCN) ومطابقة بيانات المستفيد</p>
              </div>

              <div className="space-y-4">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={searchMtcn}
                    onChange={(e) => setSearchMtcn(e.target.value)}
                    placeholder="أدخل رقم MTCN المكون من 10 أرقام (مثال: 849-204-9182)..."
                    className="flex-1 p-3 bg-slate-50 border border-slate-300 rounded-2xl text-xs font-mono font-bold outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <button
                    type="button"
                    onClick={handleSearchMtcn}
                    className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-2xl shadow-sm transition"
                  >
                    بحث الحوالة
                  </button>
                </div>

                {payoutError && (
                  <div className="p-4 bg-rose-50 border border-rose-200 text-rose-800 text-xs font-bold rounded-2xl flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 shrink-0" />
                    {payoutError}
                  </div>
                )}

                {payoutFoundRemittance && (
                  <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 space-y-4 animate-in fade-in">
                    <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                      <div>
                        <span className="text-[10px] text-slate-400 font-mono">MTCN:</span>
                        <h4 className="text-base font-black text-blue-700 font-mono">{payoutFoundRemittance.mtcn}</h4>
                      </div>
                      <span className={`text-xs font-bold px-3 py-1 rounded-full ${
                        payoutFoundRemittance.status === 'PAID' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                      }`}>
                        {payoutFoundRemittance.status === 'PAID' ? 'مدفوعة ومصروفة' : 'جاهزة للصرف'}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-3 text-xs">
                      <div>
                        <p className="text-slate-400">المرسل:</p>
                        <p className="font-bold text-slate-800">{payoutFoundRemittance.senderName}</p>
                        <p className="text-[10px] text-slate-500 font-mono">{payoutFoundRemittance.senderCountry}</p>
                      </div>
                      <div>
                        <p className="text-slate-400">المستفيد:</p>
                        <p className="font-bold text-slate-800">{payoutFoundRemittance.receiverName}</p>
                        <p className="text-[10px] text-slate-500 font-mono">{payoutFoundRemittance.receiverPhone}</p>
                      </div>
                      <div>
                        <p className="text-slate-400">المبلغ المستحق للصرف:</p>
                        <p className="text-sm font-black text-emerald-700 font-mono">
                          {payoutFoundRemittance.receiveAmount.toLocaleString()} {payoutFoundRemittance.receiveCurrency}
                        </p>
                      </div>
                      <div>
                        <p className="text-slate-400">تاريخ الإصدار:</p>
                        <p className="font-bold text-slate-800 font-mono">{new Date(payoutFoundRemittance.date).toLocaleDateString()}</p>
                      </div>
                    </div>

                    {payoutFoundRemittance.status !== 'PAID' && (
                      <div className="pt-3 border-t border-slate-200 space-y-3">
                        <div>
                          <label className="block text-xs font-bold text-slate-700 mb-1">
                            إدخال رمز التحقق السر (SMS PIN Code)
                          </label>
                          <input
                            type="password"
                            value={inputPin}
                            onChange={(e) => setInputPin(e.target.value)}
                            placeholder="أدخل الكود السري المكون من 4 أرقام..."
                            className="w-full p-2.5 bg-white border border-slate-300 rounded-xl text-center font-mono text-sm tracking-widest outline-none focus:ring-2 focus:ring-blue-500"
                            maxLength={4}
                          />
                        </div>

                        <button
                          type="button"
                          onClick={handleExecutePayout}
                          className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-md transition flex items-center justify-center gap-2"
                        >
                          <CheckCircle2 className="w-4 h-4" />
                          تأكيد الصرف وتسليم المبلغ للمستفيد
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* SUB-MODE: REMITTANCE LEDGER */}
          {remittanceMode === 'LEDGER' && (
            <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="p-4 bg-slate-50 border-b border-slate-200 font-bold text-xs text-slate-800">
                جدول كشف وتتبع الحوالات المصرفية (Remittance Audit Ledger)
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-right text-xs">
                  <thead className="bg-slate-100/70 border-b border-slate-200 font-bold text-slate-700">
                    <tr>
                      <th className="p-3">رقم الحوالة MTCN</th>
                      <th className="p-3">المرسل</th>
                      <th className="p-3">المستفيد</th>
                      <th className="p-3">الوجهة</th>
                      <th className="p-3">المبلغ والعملة</th>
                      <th className="p-3 text-center">الحالة</th>
                      <th className="p-3 text-center font-mono">التاريخ</th>
                      <th className="p-3 text-center">إجراءات</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {remittances.map((rem) => (
                      <tr key={rem.id} className="hover:bg-slate-50/80 transition">
                        <td className="p-3 font-mono font-black text-blue-700">{rem.mtcn}</td>
                        <td className="p-3 font-bold text-slate-800">{rem.senderName}</td>
                        <td className="p-3 font-bold text-slate-800">{rem.receiverName}</td>
                        <td className="p-3 font-mono text-slate-600">{rem.receiverCountry}</td>
                        <td className="p-3 font-mono font-bold text-slate-900">
                          {rem.sendAmount.toLocaleString()} {rem.sendCurrency}
                        </td>
                        <td className="p-3 text-center">
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            rem.status === 'PAID' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                          }`}>
                            {rem.status === 'PAID' ? 'تم الصرف' : 'جاهزة للصرف'}
                          </span>
                        </td>
                        <td className="p-3 text-center font-mono text-slate-500">
                          {new Date(rem.date).toLocaleDateString()}
                        </td>
                        <td className="p-3 text-center">
                          <button
                            onClick={() => setSelectedRemittanceSlip(rem)}
                            className="p-1 text-blue-600 hover:bg-blue-50 rounded"
                            title="طباعة إيصال الحوالة"
                          >
                            <Printer className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 3: LIVE FX RATE BOARD */}
      {activeTab === 'RATE_BOARD' && (
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-6">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div>
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-blue-600" />
                لوحة أسعار الصرف الحية ومؤشرات السوق
              </h2>
              <p className="text-xs text-slate-500">تحديث الأسعار السائدة، الهوامش، وسعر البنك المركزي</p>
            </div>
            <button
              onClick={() => alert('تم تحديث أسعار الصرف فورياً بناء على مؤشر السوق!')}
              className="flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs rounded-xl transition"
            >
              <RefreshCw className="w-4 h-4" />
              تحديث الأسعار من السوق
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {fxVaults.map((vault) => (
              <div key={vault.currency} className="bg-slate-50 p-5 rounded-2xl border border-slate-200 hover:border-blue-300 transition space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-9 h-9 rounded-xl bg-slate-900 text-white font-bold flex items-center justify-center font-mono text-xs">
                      {vault.symbol}
                    </div>
                    <div>
                      <h4 className="font-bold text-xs text-slate-900">{vault.currencyNameAr}</h4>
                      <p className="text-[10px] text-slate-400 font-mono">{vault.currency}</p>
                    </div>
                  </div>
                  <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                    <TrendingUp className="w-3 h-3" /> +0.2%
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-center pt-2 border-t border-slate-200/60 font-mono text-xs">
                  <div className="bg-emerald-50 p-2 rounded-xl border border-emerald-100">
                    <div className="text-[9px] text-emerald-800 font-bold">سعر الشراء (Buy)</div>
                    <div className="font-black text-emerald-700 mt-0.5">{vault.buyRate}</div>
                  </div>

                  <div className="bg-rose-50 p-2 rounded-xl border border-rose-100">
                    <div className="text-[9px] text-rose-800 font-bold">سعر البيع (Sell)</div>
                    <div className="font-black text-rose-700 mt-0.5">{vault.sellRate}</div>
                  </div>
                </div>

                <div className="text-[10px] text-slate-500 text-center pt-1 font-mono">
                  سعر البنك المركزي: <strong>{vault.officialRate}</strong> | رصيد الخزينة: <strong>{vault.currentBalance.toLocaleString()} {vault.symbol}</strong>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 4: VAULTS & TELLER TILLS */}
      {activeTab === 'VAULTS' && (
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-6">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div>
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Coins className="w-5 h-5 text-blue-600" />
                خزائن العملات الأجنبية وجرد صندوق الكاشير (Teller Tills)
              </h2>
              <p className="text-xs text-slate-500">مطابقة رصيد الخزينة وتحديد أرباح إعادة التقييم غير المحققة</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {fxVaults.map((v) => (
              <div key={v.currency} className="bg-slate-900 text-white p-5 rounded-2xl border border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-300">{v.currencyNameAr}</span>
                  <span className="font-mono text-xs font-bold bg-blue-900/80 text-blue-300 px-2 py-0.5 rounded">
                    {v.currency}
                  </span>
                </div>

                <div>
                  <div className="text-[10px] text-slate-400">الرصيد الفعلي المتوفر الخزينة:</div>
                  <div className="text-xl font-black text-amber-400 font-mono mt-0.5">
                    {v.currentBalance.toLocaleString()} <span className="text-xs text-slate-400">{v.symbol}</span>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-[11px]">
                  <span className="text-slate-400">المعادل بالريال اليمني:</span>
                  <span className="font-mono font-bold text-emerald-400">{v.baseEquivalent.toLocaleString()} ر.ي</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 5: AML & KYC COMPLIANCE RADAR */}
      {activeTab === 'COMPLIANCE' && (
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-6">
          <div className="border-b border-slate-100 pb-4">
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-blue-600" />
              رادار الامتثال ومكافحة غسل الأموال (KYC / AML Compliance)
            </h2>
            <p className="text-xs text-slate-500">مراقبة حدود التحويل اليومية والعمليات عالية الفئة</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-emerald-50 p-4 rounded-2xl border border-emerald-200">
              <p className="text-xs font-bold text-emerald-800">حالة نظام الامتثال</p>
              <p className="text-lg font-black text-emerald-900 mt-1">مطابق للتعليمات 100%</p>
              <p className="text-[10px] text-emerald-700 mt-1">مفحوص تلقائياً ضد القوائم المحظورة</p>
            </div>

            <div className="bg-blue-50 p-4 rounded-2xl border border-blue-200">
              <p className="text-xs font-bold text-blue-800">سقف التحويل اليومي للعملاء</p>
              <p className="text-lg font-black text-blue-900 mt-1">$10,000 USD</p>
              <p className="text-[10px] text-blue-700 mt-1">يتطلب إثبات المصدر للمبالغ الأكبر</p>
            </div>

            <div className="bg-purple-50 p-4 rounded-2xl border border-purple-200">
              <p className="text-xs font-bold text-purple-800">التحقق من الهويات (KYC)</p>
              <p className="text-lg font-black text-purple-900 mt-1">إلزامي لجميع العمليات</p>
              <p className="text-[10px] text-purple-700 mt-1">مطابقة الهويات الشخصية والجوازات</p>
            </div>
          </div>
        </div>
      )}

      {/* RECEIPT MODAL: FX DEAL RECEIPT */}
      {selectedDealReceipt && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in">
          <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden border border-slate-200">
            <div className="bg-slate-900 p-6 text-white flex items-center justify-between no-print">
              <div className="flex items-center gap-2">
                <Printer className="w-5 h-5 text-blue-400" />
                <h3 className="font-bold text-sm">فاتورة صرافة عملات رسمية معتمدة</h3>
              </div>
              <button onClick={() => setSelectedDealReceipt(null)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-8 space-y-6 print:p-0">
              {/* Receipt Header */}
              <div className="text-center space-y-1 border-b border-slate-200 pb-4">
                <CompanyHeaderView />
                <p className="text-xs font-bold text-slate-600">قطاع الصرافة والخدمات المصرفية</p>
                <p className="text-[10px] text-slate-400 font-mono">الرقم الضريبي: {companyProfile.taxNumber}</p>
                <div className="pt-2">
                  <span className="bg-slate-100 text-slate-800 text-xs font-bold px-3 py-1 rounded-full border border-slate-200 font-mono">
                    سند صرافة: {selectedDealReceipt.dealNumber}
                  </span>
                </div>
              </div>

              {/* Deal Details Table */}
              <div className="space-y-3 text-xs">
                <div className="flex justify-between border-b border-slate-100 pb-1.5">
                  <span className="text-slate-500 font-bold">اسم العميل:</span>
                  <span className="font-bold text-slate-900">{selectedDealReceipt.customerName}</span>
                </div>
                <div className="flex justify-between border-b border-slate-100 pb-1.5">
                  <span className="text-slate-500 font-bold">رقم الهاتف:</span>
                  <span className="font-mono text-slate-900">{selectedDealReceipt.customerPhone}</span>
                </div>
                <div className="flex justify-between border-b border-slate-100 pb-1.5">
                  <span className="text-slate-500 font-bold">نوع العملية:</span>
                  <span className="font-bold text-blue-700">
                    {selectedDealReceipt.dealType === 'BUY' ? 'شراء عملة أجنبية' : 'بيع عملة أجنبية'}
                  </span>
                </div>
                <div className="flex justify-between border-b border-slate-100 pb-1.5">
                  <span className="text-slate-500 font-bold">المبلغ المسلم:</span>
                  <span className="font-mono font-bold text-slate-900">
                    {selectedDealReceipt.fromAmount.toLocaleString()} {selectedDealReceipt.fromCurrency}
                  </span>
                </div>
                <div className="flex justify-between border-b border-slate-100 pb-1.5">
                  <span className="text-slate-500 font-bold">سعر الصرف المطبق:</span>
                  <span className="font-mono font-bold text-slate-900">{selectedDealReceipt.exchangeRate} ر.ي</span>
                </div>
                <div className="flex justify-between bg-slate-100 p-2 rounded-xl text-sm font-black">
                  <span>المبلغ المستلم الصافي:</span>
                  <span className="font-mono text-emerald-700">
                    {selectedDealReceipt.toAmount.toLocaleString()} {selectedDealReceipt.toCurrency}
                  </span>
                </div>
              </div>

              {/* Signature Block */}
              <div className="grid grid-cols-2 gap-4 text-center text-[10px] pt-6 border-t border-slate-200">
                <div>
                  <p className="font-bold text-slate-700 mb-6">توقيع العميل</p>
                  <p className="border-b border-dashed border-slate-400 pb-1">..............................</p>
                </div>
                <div>
                  <p className="font-bold text-slate-700 mb-6">توقيع وختم الصراف المعتمد</p>
                  <p className="border-b border-dashed border-slate-400 pb-1">..............................</p>
                </div>
              </div>

              {/* Modal Action Buttons */}
              <div className="pt-4 flex gap-2 no-print">
                <button
                  onClick={() => window.print()}
                  className="w-full py-3 bg-blue-600 text-white font-bold text-xs rounded-xl shadow-md transition flex items-center justify-center gap-2"
                >
                  <Printer className="w-4 h-4" />
                  طباعة الإيصال
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* RECEIPT MODAL: REMITTANCE SLIP */}
      {selectedRemittanceSlip && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in">
          <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden border border-slate-200">
            <div className="bg-slate-900 p-5 text-white flex items-center justify-between no-print">
              <div className="flex items-center gap-2">
                <Send className="w-4 h-4 text-blue-400" />
                <h3 className="font-bold text-xs">إيصال حوالة مالية رسمية (Remittance Slip)</h3>
              </div>
              <button onClick={() => setSelectedRemittanceSlip(null)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-5 text-xs">
              <div className="text-center space-y-1 border-b border-slate-200 pb-3">
                <CompanyHeaderView />
                <p className="text-[10px] font-bold text-blue-700">إيصال تحويل مالي فوري (Express Remittance)</p>
                <div className="bg-blue-50 text-blue-900 p-2 rounded-xl mt-2 font-mono font-black text-sm border border-blue-200">
                  MTCN: {selectedRemittanceSlip.mtcn}
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-slate-500 font-bold">المرسل:</span>
                  <span className="font-bold text-slate-900">{selectedRemittanceSlip.senderName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 font-bold">المستفيد:</span>
                  <span className="font-bold text-slate-900">{selectedRemittanceSlip.receiverName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 font-bold">الجهة والمدينة:</span>
                  <span className="font-bold text-slate-900">{selectedRemittanceSlip.receiverCountry} - {selectedRemittanceSlip.receiverCity}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 font-bold">المبلغ المحول:</span>
                  <span className="font-mono font-bold text-emerald-700">{selectedRemittanceSlip.sendAmount} {selectedRemittanceSlip.sendCurrency}</span>
                </div>
                <div className="flex justify-between bg-amber-50 p-2 rounded-xl font-bold">
                  <span className="text-amber-900">رمز التحقق السر (SMS PIN):</span>
                  <span className="font-mono text-amber-900 text-sm tracking-wider">{selectedRemittanceSlip.verificationPin}</span>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-200 no-print">
                <button
                  onClick={() => window.print()}
                  className="w-full py-2.5 bg-blue-600 text-white font-bold text-xs rounded-xl shadow-sm transition flex items-center justify-center gap-2"
                >
                  <Printer className="w-4 h-4" />
                  طباعة الإيصال
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
