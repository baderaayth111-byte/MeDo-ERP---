import { FxDeal, RemittanceTransaction, FxVaultBalance } from '../types/foreignExchange';

export const initialFxVaults: FxVaultBalance[] = [
  {
    currency: 'USD',
    currencyNameAr: 'دولار أمريكي',
    symbol: '$',
    currentBalance: 125000,
    buyRate: 533.5,
    sellRate: 536.0,
    officialRate: 535.0,
    baseEquivalent: 66875000,
    lastUpdated: '2026-08-23 10:30',
  },
  {
    currency: 'SAR',
    currencyNameAr: 'ريال سعودي',
    symbol: 'ر.س',
    currentBalance: 480000,
    buyRate: 141.8,
    sellRate: 142.8,
    officialRate: 142.5,
    baseEquivalent: 68400000,
    lastUpdated: '2026-08-23 10:30',
  },
  {
    currency: 'EUR',
    currencyNameAr: 'يورو أوروبي',
    symbol: '€',
    currentBalance: 35000,
    buyRate: 580.0,
    sellRate: 585.5,
    officialRate: 582.5,
    baseEquivalent: 20387500,
    lastUpdated: '2026-08-23 09:15',
  },
  {
    currency: 'GBP',
    currencyNameAr: 'جنيه إسترليني',
    symbol: '£',
    currentBalance: 18000,
    buyRate: 678.0,
    sellRate: 684.0,
    officialRate: 681.0,
    baseEquivalent: 12258000,
    lastUpdated: '2026-08-23 09:15',
  },
  {
    currency: 'AED',
    currencyNameAr: 'درهم إماراتي',
    symbol: 'د.إ',
    currentBalance: 95000,
    buyRate: 144.5,
    sellRate: 145.8,
    officialRate: 145.2,
    baseEquivalent: 13794000,
    lastUpdated: '2026-08-23 10:00',
  },
  {
    currency: 'YER',
    currencyNameAr: 'ريال يمني (الخزينة الرئيسية)',
    symbol: 'ر.ي',
    currentBalance: 850000000,
    buyRate: 1.0,
    sellRate: 1.0,
    officialRate: 1.0,
    baseEquivalent: 850000000,
    lastUpdated: '2026-08-23 11:00',
  },
];

export const initialFxDeals: FxDeal[] = [
  {
    id: 'FX-DEAL-001',
    dealNumber: 'FX-2026-00891',
    date: '2026-08-23T09:15:00',
    dealType: 'BUY',
    fromCurrency: 'USD',
    toCurrency: 'YER',
    fromAmount: 2500,
    toAmount: 1333750, // 2500 * 533.5
    exchangeRate: 533.5,
    marginPercent: 0.28,
    feeAmount: 500,
    realizedProfit: 3750,
    customerName: 'صالح بن أحمد العتيبي',
    customerPhone: '+967 771 234 567',
    customerIdType: 'NATIONAL_ID',
    customerIdNumber: '1029384756',
    nationality: 'يمني',
    purpose: 'شراء بضائع ومصاريف تجارية',
    notes: 'عملية نقدية عبر الكاونتر الرئيسي',
    cashierName: 'أحمد المحاسب',
    branchId: 'BR-01',
    status: 'COMPLETED',
    journalEntryId: 'JE-FX-00891',
  },
  {
    id: 'FX-DEAL-002',
    dealNumber: 'FX-2026-00892',
    date: '2026-08-23T10:05:00',
    dealType: 'SELL',
    fromCurrency: 'YER',
    toCurrency: 'SAR',
    fromAmount: 1428000, // 10000 SAR * 142.8
    toAmount: 10000,
    exchangeRate: 142.8,
    marginPercent: 0.21,
    feeAmount: 1000,
    realizedProfit: 3000,
    customerName: 'مؤسسة أفق التقنية للتجارة',
    customerPhone: '+967 773 889 900',
    customerIdType: 'COMMERCIAL_REG',
    customerIdNumber: 'CR-90412/SANAA',
    nationality: 'يمني',
    purpose: 'تغطية مشتريات استيراد',
    notes: 'تحويل للمورد السعودي',
    cashierName: 'أحمد المحاسب',
    branchId: 'BR-01',
    status: 'COMPLETED',
    journalEntryId: 'JE-FX-00892',
  },
  {
    id: 'FX-DEAL-003',
    dealNumber: 'FX-2026-00893',
    date: '2026-08-23T10:45:00',
    dealType: 'BUY',
    fromCurrency: 'EUR',
    toCurrency: 'YER',
    fromAmount: 1200,
    toAmount: 696000, // 1200 * 580.0
    exchangeRate: 580.0,
    marginPercent: 0.43,
    feeAmount: 0,
    realizedProfit: 3000,
    customerName: 'د. طارق عبدالحميد السقاف',
    customerPhone: '+967 733 112 233',
    customerIdType: 'PASSPORT',
    customerIdNumber: 'P-8839201',
    nationality: 'يمني',
    purpose: 'مصاريف علاج وسفر',
    cashierName: 'أحمد المحاسب',
    branchId: 'BR-01',
    status: 'COMPLETED',
    journalEntryId: 'JE-FX-00893',
  },
];

export const initialRemittances: RemittanceTransaction[] = [
  {
    id: 'REM-001',
    mtcn: '849-204-9182',
    date: '2026-08-23T08:30:00',
    type: 'OUTWARD',
    senderName: 'محمد بن عبدالكريم باوزير',
    senderPhone: '+967 777 990 011',
    senderIdType: 'NATIONAL_ID',
    senderIdNumber: '0102938475',
    senderCountry: 'الجمهورية اليمنية',
    receiverName: 'عمر محمد عبدالكريم باوزير',
    receiverPhone: '+966 50 123 4567',
    receiverCountry: 'المملكة العربية السعودية',
    receiverCity: 'الرياض',
    payoutAgentOrBank: 'مصرف الراجحي - فرع الملز',
    payoutAccountOrIban: 'SA448000020160801012345',
    sendCurrency: 'USD',
    sendAmount: 1500,
    receiveCurrency: 'SAR',
    receiveAmount: 5625, // 1500 USD * 3.75 SAR/USD
    exchangeRate: 3.75,
    commissionFee: 25,
    agentFee: 10,
    totalPaidBySender: 1525,
    verificationPin: '4829',
    purpose: 'مصاريف عائلية ومساعدات شخصية',
    kycVerified: true,
    status: 'READY_FOR_PAYOUT',
    notes: 'حوالة مصرفية فورية عبر وكيل الراجحي',
    createdBranch: 'الفرع الرئيسي - صنعاء',
    createdUser: 'أحمد المحاسب',
  },
  {
    id: 'REM-002',
    mtcn: '912-401-7733',
    date: '2026-08-23T09:40:00',
    type: 'INWARD',
    senderName: 'شركة الخليج للتوريدات المحدودة',
    senderPhone: '+971 4 332 1100',
    senderIdType: 'COMMERCIAL_REG',
    senderIdNumber: 'UAE-CR-88201',
    senderCountry: 'الإمارات العربية المتحدة',
    receiverName: 'مجموعة المروج الدولية للاستثمار',
    receiverPhone: '+967 777 123456',
    receiverCountry: 'الجمهورية اليمنية',
    receiverCity: 'صنعاء',
    payoutAgentOrBank: 'خزينة مجموعة المروج - المركز الرئيسي',
    sendCurrency: 'USD',
    sendAmount: 12000,
    receiveCurrency: 'USD',
    receiveAmount: 12000,
    exchangeRate: 1.0,
    commissionFee: 50,
    agentFee: 20,
    totalPaidBySender: 12050,
    verificationPin: '9102',
    purpose: 'دفعة حساب فاتورة استيراد رقم 904',
    kycVerified: true,
    status: 'PAID',
    notes: 'تم الاستلام والصرف النقدي في الخزينة الرئيسية',
    createdBranch: 'فرع دبي الدولي',
    createdUser: 'سارة العامري',
    payoutDate: '2026-08-23T10:15:00',
    payoutBranch: 'الفرع الرئيسي - صنعاء',
    payoutUser: 'أحمد المحاسب',
    journalEntryId: 'JE-REM-002',
  },
  {
    id: 'REM-003',
    mtcn: '304-981-2290',
    date: '2026-08-22T16:20:00',
    type: 'OUTWARD',
    senderName: 'المهندس / هشام مرشد الشميري',
    senderPhone: '+967 733 445 566',
    senderIdType: 'PASSPORT',
    senderIdNumber: 'P-992018',
    senderCountry: 'الجمهورية اليمنية',
    receiverName: 'سليمان هشام مرشد الشميري',
    receiverPhone: '+90 532 998 7654',
    receiverCountry: 'تركيا',
    receiverCity: 'إسطنبول',
    payoutAgentOrBank: 'Kuveyt Türk Bank - الفاتح',
    sendCurrency: 'USD',
    sendAmount: 3500,
    receiveCurrency: 'USD',
    receiveAmount: 3500,
    exchangeRate: 1.0,
    commissionFee: 35,
    agentFee: 15,
    totalPaidBySender: 3535,
    verificationPin: '3391',
    purpose: 'رسوم جامعية ومصاريف دراسية',
    kycVerified: true,
    status: 'PAID',
    notes: 'تم الصرف بنجاح في فرع الفاتح إسطنبول',
    createdBranch: 'الفرع الرئيسي - صنعاء',
    createdUser: 'أحمد المحاسب',
    payoutDate: '2026-08-22T18:00:00',
    payoutBranch: 'فرع إسطنبول الفاتح',
    payoutUser: 'مراد أوزكان',
  },
];

const FX_VAULTS_KEY = 'medo_erp_fx_vaults_v1';
const FX_DEALS_KEY = 'medo_erp_fx_deals_v1';
const REMITTANCES_KEY = 'medo_erp_remittances_v1';

export function getLoadedFxVaults(): FxVaultBalance[] {
  try {
    const raw = localStorage.getItem(FX_VAULTS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch (e) {
    console.error('Failed to load FX Vaults', e);
  }
  return initialFxVaults;
}

export function saveFxVaultsToStorage(vaults: FxVaultBalance[]): void {
  try {
    localStorage.setItem(FX_VAULTS_KEY, JSON.stringify(vaults));
  } catch (e) {
    console.error('Failed to save FX Vaults', e);
  }
}

export function getLoadedFxDeals(): FxDeal[] {
  try {
    const raw = localStorage.getItem(FX_DEALS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch (e) {
    console.error('Failed to load FX Deals', e);
  }
  return initialFxDeals;
}

export function saveFxDealsToStorage(deals: FxDeal[]): void {
  try {
    localStorage.setItem(FX_DEALS_KEY, JSON.stringify(deals));
  } catch (e) {
    console.error('Failed to save FX Deals', e);
  }
}

export function getLoadedRemittances(): RemittanceTransaction[] {
  try {
    const raw = localStorage.getItem(REMITTANCES_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch (e) {
    console.error('Failed to load Remittances', e);
  }
  return initialRemittances;
}

export function saveRemittancesToStorage(remittances: RemittanceTransaction[]): void {
  try {
    localStorage.setItem(REMITTANCES_KEY, JSON.stringify(remittances));
  } catch (e) {
    console.error('Failed to save Remittances', e);
  }
}
