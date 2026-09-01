import React, { useState } from 'react';
import { 
  Landmark, 
  Plus, 
  ArrowLeftRight, 
  CheckCircle2, 
  AlertCircle, 
  RefreshCw, 
  DollarSign, 
  FileText, 
  CheckSquare, 
  Square 
} from 'lucide-react';
import { BankAccount, JournalEntry, Currency } from '../types/accounting';
import { formatCurrency, convertAmount } from '../utils/formatters';

interface BankReconciliationViewProps {
  bankAccounts: BankAccount[];
  onAddJournalEntry: (entry: JournalEntry) => void;
  currency: Currency;
  rates: Record<Currency, number>;
}

export const BankReconciliationView: React.FC<BankReconciliationViewProps> = ({
  bankAccounts,
  onAddJournalEntry,
  currency,
  rates,
}) => {
  const [selectedBankId, setSelectedBankId] = useState(bankAccounts[0]?.id || '');
  const [activeTab, setActiveTab] = useState<'reconciliation' | 'transfer'>('reconciliation');

  // Bank reconciliation mock statement lines
  const [statementLines, setStatementLines] = useState([
    { id: '1', date: '2026-08-15', description: 'إيداع نقدي فرع حدة', amount: 3500000, type: 'DEPOSIT', matched: true },
    { id: '2', date: '2026-08-18', description: 'حوالة واردة من شركة النجم', amount: 7800000, type: 'DEPOSIT', matched: true },
    { id: '3', date: '2026-08-20', description: 'عمولة تحويل بنكي ورسوم كشف', amount: -25000, type: 'WITHDRAWAL', matched: false },
    { id: '4', date: '2026-08-21', description: 'صرف شيك رقم 99018 للموردين', amount: -4200000, type: 'WITHDRAWAL', matched: true },
    { id: '5', date: '2026-08-22', description: 'أرباح ودائع إسلامية فصلية', amount: 450000, type: 'DEPOSIT', matched: false },
  ]);

  // Fund transfer state
  const [fromBankId, setFromBankId] = useState(bankAccounts[0]?.id || '');
  const [toBankId, setToBankId] = useState(bankAccounts[1]?.id || '');
  const [transferAmount, setTransferAmount] = useState<number>(0);
  const [transferRef, setTransferRef] = useState(`TRF-${Date.now().toString().slice(-6)}`);
  const [transferNotes, setTransferNotes] = useState('تحويل وتغذية سيولة بين الحسابات المصرفية');

  const selectedBank = bankAccounts.find(b => b.id === selectedBankId);

  const toggleMatch = (id: string) => {
    setStatementLines(prev =>
      prev.map(item => (item.id === id ? { ...item, matched: !item.matched } : item))
    );
  };

  const handleExecuteTransfer = (e: React.FormEvent) => {
    e.preventDefault();
    if (fromBankId === toBankId) {
      alert('لا يمكن التحويل لنفس الحساب المصرفي!');
      return;
    }
    if (transferAmount <= 0) {
      alert('يرجى تحديد مبلغ التحويل.');
      return;
    }

    const fromAcc = bankAccounts.find(b => b.id === fromBankId);
    const toAcc = bankAccounts.find(b => b.id === toBankId);

    const je: JournalEntry = {
      id: `JE-TRF-${Date.now().toString().slice(-4)}`,
      entryNumber: `JV-TRF-2026-0${Date.now().toString().slice(-3)}`,
      date: new Date().toISOString().split('T')[0],
      reference: transferRef,
      description: `تحويل بنكي داخلي من (${fromAcc?.bankNameAr}) إلى (${toAcc?.bankNameAr})`,
      status: 'POSTED',
      createdBy: 'مدير الخزينة والمصارف',
      postedAt: new Date().toLocaleString('ar-YE'),
      totalDebit: transferAmount,
      totalCredit: transferAmount,
      lines: [
        {
          id: 'T1',
          accountCode: toAcc?.accountCode || '1112',
          accountName: toAcc?.bankNameAr || 'الحساب المستلم',
          debit: transferAmount,
          credit: 0,
          currency: 'YER',
          exchangeRate: 1,
          amountInBase: transferAmount,
          description: transferNotes,
        },
        {
          id: 'T2',
          accountCode: fromAcc?.accountCode || '1111',
          accountName: fromAcc?.bankNameAr || 'الحساب المحول منه',
          debit: 0,
          credit: transferAmount,
          currency: 'YER',
          exchangeRate: 1,
          amountInBase: transferAmount,
          description: transferNotes,
        },
      ],
    };

    onAddJournalEntry(je);
    alert(`تم تنفيذ التحويل المصرفي بنجاح بمبلغ ${formatCurrency(transferAmount, 'YER')} وترحيل القيد رقم ${je.entryNumber}!`);
    setTransferAmount(0);
    setActiveTab('reconciliation');
  };

  const unmatchedCount = statementLines.filter(s => !s.matched).length;

  return (
    <div className="space-y-6">
      {/* Top Header & Tab Controls */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white border border-slate-200 p-5 rounded-xl shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <span className="bg-teal-50 text-teal-700 text-xs px-2.5 py-0.5 rounded-md font-mono font-bold border border-teal-200">
              SAP T-Code: FF67 / FF_5
            </span>
            <h2 className="text-lg sm:text-xl font-bold text-slate-800">إدارة الخزينة والتسويات البنكية (Bank & Cash Management)</h2>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            تسوية ومطابقة كشوفات الحساب المصرفية الآلية والتحويلات النقدية الداخلية بين البنوك.
          </p>
        </div>

        <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl border border-slate-200">
          <button
            onClick={() => setActiveTab('reconciliation')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition ${
              activeTab === 'reconciliation' ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            التسوية البنكية والمطابقة
          </button>
          <button
            onClick={() => setActiveTab('transfer')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition ${
              activeTab === 'transfer' ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            تحويل مصرفي داخلي
          </button>
        </div>
      </div>

      {/* Bank Accounts Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {bankAccounts.map((b) => (
          <div
            key={b.id}
            onClick={() => setSelectedBankId(b.id)}
            className={`p-4 rounded-xl border cursor-pointer transition ${
              selectedBankId === b.id
                ? 'bg-teal-50/40 border-teal-500 shadow-xs ring-1 ring-teal-500'
                : 'bg-white border-slate-200 hover:border-slate-300 shadow-xs'
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="w-8 h-8 rounded-lg bg-teal-100/60 flex items-center justify-center">
                <Landmark className="w-4 h-4 text-teal-700" />
              </div>
              <span className="text-[10px] font-bold font-mono px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200">
                {b.currency}
              </span>
            </div>
            <h4 className="text-sm font-bold text-slate-800 mt-2.5">{b.bankNameAr}</h4>
            <p className="text-xs text-slate-400 font-mono mt-0.5">{b.accountNumber}</p>
            <div className="mt-3 pt-2 border-t border-slate-100 flex justify-between items-baseline">
              <span className="text-xs text-slate-500">الرصيد:</span>
              <span className="font-mono font-bold text-emerald-600 text-sm">
                {formatCurrency(b.currentBalance, b.currency)}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* TAB 1: BANK RECONCILIATION */}
      {activeTab === 'reconciliation' && (
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-200 pb-3">
            <div>
              <h3 className="text-base font-bold text-slate-800">
                مطابقة وتسوية كشف حساب: {selectedBank?.bankNameAr}
              </h3>
              <p className="text-xs text-slate-500">
                الحساب الدفتري: {selectedBank?.accountCode} | العملة: {selectedBank?.currency}
              </p>
            </div>

            <div className="flex items-center gap-2">
              <div className="text-xs bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200">
                <span className="text-slate-600">حركات غير مطابقة: </span>
                <span className={`font-bold ${unmatchedCount > 0 ? 'text-amber-600' : 'text-emerald-600'}`}>
                  {unmatchedCount} حركات
                </span>
              </div>
            </div>
          </div>

          {/* Statement Lines Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs">
              <thead className="bg-slate-50 text-slate-700 border-b border-slate-200 font-semibold">
                <tr>
                  <th className="p-3 w-12 text-center">مطابقة</th>
                  <th className="p-3">التاريخ</th>
                  <th className="p-3">بيان الحركة في كشف البنك</th>
                  <th className="p-3">نوع الحركة</th>
                  <th className="p-3 text-left">المبلغ</th>
                  <th className="p-3 text-center">الحالة</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {statementLines.map((line) => (
                  <tr
                    key={line.id}
                    onClick={() => toggleMatch(line.id)}
                    className="hover:bg-slate-50/80 cursor-pointer transition"
                  >
                    <td className="p-3 text-center">
                      {line.matched ? (
                        <CheckSquare className="w-4 h-4 text-emerald-600 mx-auto" />
                      ) : (
                        <Square className="w-4 h-4 text-slate-400 mx-auto" />
                      )}
                    </td>
                    <td className="p-3 font-mono text-slate-500">{line.date}</td>
                    <td className="p-3 font-semibold text-slate-800">{line.description}</td>
                    <td className="p-3">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                        line.type === 'DEPOSIT' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-rose-50 text-rose-700 border border-rose-200'
                      }`}>
                        {line.type === 'DEPOSIT' ? 'إيداع بنكي (+)' : 'سحب / صرف (-)'}
                      </span>
                    </td>
                    <td className="p-3 text-left font-mono font-bold">
                      <span className={line.amount > 0 ? 'text-emerald-600' : 'text-rose-600'}>
                        {formatCurrency(Math.abs(line.amount), selectedBank?.currency || 'YER')}
                      </span>
                    </td>
                    <td className="p-3 text-center">
                      {line.matched ? (
                        <span className="text-[10px] text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                          تمت المطابقة مع الدفاتر
                        </span>
                      ) : (
                        <span className="text-[10px] text-amber-700 font-bold bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                          معلق / فارق تسوية
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 2: INTERNAL FUND TRANSFER */}
      {activeTab === 'transfer' && (
        <form onSubmit={handleExecuteTransfer} className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs space-y-4 max-w-xl mx-auto">
          <h3 className="text-base font-bold text-slate-800 border-b border-slate-200 pb-3 flex items-center gap-2">
            <ArrowLeftRight className="w-5 h-5 text-teal-600" />
            <span>تحويل وتغذية نقدية بين الحسابات والخزن (Fund Transfer)</span>
          </h3>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">من حساب (المرسل)</label>
              <select
                value={fromBankId}
                onChange={(e) => setFromBankId(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:ring-2 focus:ring-teal-500 focus:bg-white focus:outline-none"
              >
                {bankAccounts.map((b) => (
                  <option key={b.id} value={b.id}>{b.bankNameAr} ({b.accountNumber})</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">إلى حساب (المستلم)</label>
              <select
                value={toBankId}
                onChange={(e) => setToBankId(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:ring-2 focus:ring-teal-500 focus:bg-white focus:outline-none"
              >
                {bankAccounts.map((b) => (
                  <option key={b.id} value={b.id}>{b.bankNameAr} ({b.accountNumber})</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">مبلغ التحويل (YER)</label>
              <input
                type="number"
                required
                min="1"
                value={transferAmount === 0 ? '' : transferAmount}
                onChange={(e) => setTransferAmount(parseFloat(e.target.value) || 0)}
                placeholder="0.00"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-teal-700 font-mono font-bold text-left focus:ring-2 focus:ring-teal-500 focus:bg-white focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">رقم مرجع التحويل</label>
              <input
                type="text"
                value={transferRef}
                onChange={(e) => setTransferRef(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 font-mono focus:ring-2 focus:ring-teal-500 focus:bg-white focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">شرح وبيان التحويل</label>
            <input
              type="text"
              value={transferNotes}
              onChange={(e) => setTransferNotes(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:ring-2 focus:ring-teal-500 focus:bg-white focus:outline-none"
            />
          </div>

          <div className="pt-3 border-t border-slate-200 flex justify-end">
            <button
              type="submit"
              className="px-6 py-2.5 bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold rounded-xl shadow-xs transition"
            >
              تأكيد وتنفيذ التحويل الداخلي
            </button>
          </div>
        </form>
      )}
    </div>
  );
};
