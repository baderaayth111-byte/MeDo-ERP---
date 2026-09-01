export type FxDealType = 'BUY' | 'SELL';
export type FxDealStatus = 'COMPLETED' | 'CANCELLED';

export interface FxDeal {
  id: string;
  dealNumber: string; // e.g. FX-2026-00101
  date: string; // ISO date
  dealType: FxDealType; // BUY or SELL
  fromCurrency: string;
  toCurrency: string;
  fromAmount: number;
  toAmount: number;
  exchangeRate: number;
  marginPercent: number;
  feeAmount: number;
  realizedProfit: number; // in base currency YER
  customerName: string;
  customerPhone: string;
  customerIdType: string; // 'NATIONAL_ID' | 'PASSPORT' | 'COMMERCIAL_REG'
  customerIdNumber: string;
  nationality?: string;
  purpose: string;
  notes?: string;
  cashierName: string;
  branchId: string;
  status: FxDealStatus;
  journalEntryId?: string;
}

export type RemittanceType = 'OUTWARD' | 'INWARD';
export type RemittanceStatus = 'PENDING' | 'READY_FOR_PAYOUT' | 'PAID' | 'CANCELLED' | 'SUSPENDED';

export interface RemittanceTransaction {
  id: string;
  mtcn: string; // 10-digit MTCN e.g. 849-204-9182
  date: string;
  type: RemittanceType;
  
  // Sender info
  senderName: string;
  senderPhone: string;
  senderIdType: string;
  senderIdNumber: string;
  senderCountry: string;

  // Receiver info
  receiverName: string;
  receiverPhone: string;
  receiverCountry: string;
  receiverCity: string;
  payoutAgentOrBank: string;
  payoutAccountOrIban?: string;

  // Financials
  sendCurrency: string;
  sendAmount: number;
  receiveCurrency: string;
  receiveAmount: number;
  exchangeRate: number;
  commissionFee: number;
  agentFee: number;
  totalPaidBySender: number;

  // Security & Compliance
  verificationPin: string;
  purpose: string;
  kycVerified: boolean;
  status: RemittanceStatus;
  notes?: string;
  
  // Audit
  createdBranch: string;
  createdUser: string;
  payoutDate?: string;
  payoutBranch?: string;
  payoutUser?: string;
  journalEntryId?: string;
}

export interface FxVaultBalance {
  currency: string;
  currencyNameAr: string;
  symbol: string;
  currentBalance: number;
  buyRate: number;
  sellRate: number;
  officialRate: number;
  baseEquivalent: number;
  lastUpdated: string;
}
