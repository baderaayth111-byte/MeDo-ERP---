import React, { useState } from 'react';
import { 
  Layers, 
  Plus, 
  Search, 
  Folder, 
  FolderOpen, 
  Download,
  CheckCircle2,
  X
} from 'lucide-react';
import { Account, AccountType, Currency } from '../types/accounting';
import { formatCurrency, convertAmount, exportToCsv } from '../utils/formatters';

interface ChartOfAccountsViewProps {
  accounts: Account[];
  onAddAccount: (account: Account) => void;
  currency: Currency;
  rates: Record<Currency, number>;
}

export const ChartOfAccountsView: React.FC<ChartOfAccountsViewProps> = ({
  accounts,
  onAddAccount,
  currency,
  rates,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState<AccountType | 'ALL'>('ALL');
  const [selectedLevel, setSelectedLevel] = useState<number | 'ALL'>('ALL');
  const [balanceFilter, setBalanceFilter] = useState<'ALL' | 'NON_ZERO' | 'ZERO' | 'DEBIT' | 'CREDIT'>('ALL');
  const [activeFilter, setActiveFilter] = useState<'ALL' | 'ACTIVE' | 'INACTIVE'>('ALL');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // Add Account form state
  const [newCode, setNewCode] = useState('');
  const [newNameAr, setNewNameAr] = useState('');
  const [newNameEn, setNewNameEn] = useState('');
  const [newType, setNewType] = useState<AccountType>('ASSET');
  const [newCategory, setNewCategory] = useState('أصول متداولة');
  const [newParentCode, setNewParentCode] = useState('1100');
  const [newOpeningBalance, setNewOpeningBalance] = useState(0);

  const handleCreateAccount = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCode || !newNameAr) {
      alert('يرجى ملء رمز الحساب واسمه بالعربية.');
      return;
    }
    if (accounts.some(a => a.code === newCode)) {
      alert('رمز الحساب موجود مسبقاً في الدليل!');
      return;
    }

    const parent = accounts.find(a => a.code === newParentCode);
    const newAccount: Account = {
      code: newCode,
      nameAr: newNameAr,
      nameEn: newNameEn || newNameAr,
      type: newType,
      category: newCategory,
      parentCode: newParentCode,
      level: parent ? parent.level + 1 : 3,
      balance: newOpeningBalance,
      currency: 'YER',
      isActive: true,
    };

    onAddAccount(newAccount);
    setIsAddModalOpen(false);
    // Reset
    setNewCode('');
    setNewNameAr('');
    setNewNameEn('');
    setNewOpeningBalance(0);
    alert(`تمت إضافة الحساب (${newAccount.code} - ${newAccount.nameAr}) بنجاح!`);
  };

  const filteredAccounts = accounts.filter(acc => {
    const matchesType = selectedType === 'ALL' || acc.type === selectedType;
    const matchesLevel = selectedLevel === 'ALL' || acc.level === selectedLevel;
    const matchesActive =
      activeFilter === 'ALL' ||
      (activeFilter === 'ACTIVE' && acc.isActive) ||
      (activeFilter === 'INACTIVE' && !acc.isActive);

    let matchesBalance = true;
    if (balanceFilter === 'NON_ZERO') matchesBalance = acc.balance !== 0;
    else if (balanceFilter === 'ZERO') matchesBalance = acc.balance === 0;
    else if (balanceFilter === 'DEBIT') matchesBalance = acc.balance > 0;
    else if (balanceFilter === 'CREDIT') matchesBalance = acc.balance < 0;

    const matchesSearch =
      acc.code.includes(searchQuery) ||
      acc.nameAr.toLowerCase().includes(searchQuery.toLowerCase()) ||
      acc.nameEn.toLowerCase().includes(searchQuery.toLowerCase()) ||
      acc.category.toLowerCase().includes(searchQuery.toLowerCase());

    return matchesType && matchesLevel && matchesActive && matchesBalance && matchesSearch;
  });

  const getTypeLabel = (type: AccountType) => {
    switch (type) {
      case 'ASSET': return 'الأصول (1)';
      case 'LIABILITY': return 'الخصوم (2)';
      case 'EQUITY': return 'حقوق الملكية (3)';
      case 'REVENUE': return 'الإيرادات (4)';
      case 'EXPENSE': return 'المصروفات (5)';
    }
  };

  const getTypeBadgeClass = (type: AccountType) => {
    switch (type) {
      case 'ASSET': return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'LIABILITY': return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'EQUITY': return 'bg-purple-50 text-purple-700 border-purple-200';
      case 'REVENUE': return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'EXPENSE': return 'bg-rose-50 text-rose-700 border-rose-200';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white border border-slate-200 p-5 rounded-xl shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <span className="bg-blue-50 text-blue-700 text-xs px-2.5 py-0.5 rounded-md font-mono font-bold border border-blue-200">
              SAP T-Code: FS00
            </span>
            <h2 className="text-lg sm:text-xl font-bold text-slate-800">دليل الحسابات الموحد (Chart of Accounts)</h2>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            شجرة الحسابات الهيكلية المتوافقة مع النظام المحاسبي اليمني الموحد والمعايير الدولية IFRS.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              const headers = ['رمز الحساب', 'اسم الحساب بالعربية', 'English Name', 'النوع', 'المستوى', 'التصنيف', 'الرصيد'];
              const rows = accounts.map(a => [a.code, a.nameAr, a.nameEn, a.type, a.level, a.category, a.balance]);
              exportToCsv('دليل_الحسابات_SAP_ERP', headers, rows);
            }}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold border border-slate-200 transition"
          >
            <Download className="w-3.5 h-3.5" />
            <span>تصدير Excel/CSV</span>
          </button>

          <button
            onClick={() => setIsAddModalOpen(true)}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-xs transition"
          >
            <Plus className="w-4 h-4" />
            <span>إضافة حساب جديد</span>
          </button>
        </div>
      </div>

      {/* Advanced Filters Bar */}
      <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3 bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
        <div className="flex flex-wrap items-center gap-2 flex-1">
          {/* Search */}
          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 text-slate-400 absolute right-3 top-2.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="ابحث برمز الحساب، الاسم، أو التصنيف..."
              className="w-full bg-slate-50 border border-slate-200 rounded-lg pr-9 pl-3 py-1.5 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
            />
          </div>

          {/* Level Filter */}
          <select
            value={selectedLevel}
            onChange={(e) => setSelectedLevel(e.target.value === 'ALL' ? 'ALL' : Number(e.target.value))}
            className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="ALL">جميع المستويات</option>
            <option value="1">المستوى 1 (رئيسي)</option>
            <option value="2">المستوى 2 (تجميعي)</option>
            <option value="3">المستوى 3 (فرعي)</option>
            <option value="4">المستوى 4 (تفصيلي)</option>
          </select>

          {/* Balance Filter */}
          <select
            value={balanceFilter}
            onChange={(e) => setBalanceFilter(e.target.value as any)}
            className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="ALL">جميع الأرصدة</option>
            <option value="NON_ZERO">ذات رصيد حقيقي (غير صفرية)</option>
            <option value="ZERO">أرصدة صفرية</option>
            <option value="DEBIT">أرصدة مدينة (موجبة)</option>
            <option value="CREDIT">أرصدة دائنة (سالبة)</option>
          </select>

          {(searchQuery || selectedType !== 'ALL' || selectedLevel !== 'ALL' || balanceFilter !== 'ALL') && (
            <button
              onClick={() => {
                setSearchQuery('');
                setSelectedType('ALL');
                setSelectedLevel('ALL');
                setBalanceFilter('ALL');
              }}
              className="text-xs text-rose-600 hover:text-rose-700 font-bold px-2 py-1"
            >
              إلغاء الفلاتر
            </button>
          )}
        </div>

        {/* Account Types Filter */}
        <div className="flex items-center gap-1 overflow-x-auto pb-1 lg:pb-0">
          {(['ALL', 'ASSET', 'LIABILITY', 'EQUITY', 'REVENUE', 'EXPENSE'] as const).map((t) => (
            <button
              key={t}
              onClick={() => setSelectedType(t)}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold transition whitespace-nowrap ${
                selectedType === t
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:text-slate-900 hover:bg-slate-200'
              }`}
            >
              {t === 'ALL' ? 'الكل' : getTypeLabel(t)}
            </button>
          ))}
        </div>
      </div>

      {/* Chart of Accounts Hierarchical Table */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-right text-xs">
            <thead className="bg-slate-50 text-slate-700 border-b border-slate-200 font-semibold">
              <tr>
                <th className="p-3 w-32">رمز الحساب</th>
                <th className="p-3">اسم الحساب في الدليل (عربي / English)</th>
                <th className="p-3 w-28">النوع</th>
                <th className="p-3 w-36">التصنيف المحاسبي</th>
                <th className="p-3 w-24 text-center">المستوى</th>
                <th className="p-3 text-left w-44">الرصيد الدفتري</th>
                <th className="p-3 w-24 text-center">الحالة</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredAccounts.map((acc) => {
                const isLevel1 = acc.level === 1;
                const isLevel2 = acc.level === 2;
                const convertedBal = convertAmount(acc.balance, 'YER', currency, rates);
                const indentPadding = acc.level === 1 ? 'pr-2' : acc.level === 2 ? 'pr-6' : acc.level === 3 ? 'pr-10' : 'pr-14';

                return (
                  <tr
                    key={acc.code}
                    className={`transition hover:bg-slate-50/80 ${
                      isLevel1
                        ? 'bg-slate-50/60 font-bold text-slate-900'
                        : isLevel2
                        ? 'bg-white font-semibold text-slate-800'
                        : 'text-slate-700'
                    }`}
                  >
                    {/* Account Code */}
                    <td className="p-3 font-mono font-bold text-blue-600">
                      {acc.code}
                    </td>

                    {/* Account Name with Hierarchy Indentation */}
                    <td className={`p-3 ${indentPadding} flex items-center gap-2`}>
                      {isLevel1 ? (
                        <FolderOpen className="w-4 h-4 text-amber-500 shrink-0" />
                      ) : isLevel2 ? (
                        <Folder className="w-4 h-4 text-blue-500 shrink-0" />
                      ) : (
                        <span className="w-1.5 h-1.5 rounded-full bg-slate-400 shrink-0"></span>
                      )}
                      <div>
                        <div className="text-slate-800 font-medium">{acc.nameAr}</div>
                        <div className="text-[10px] text-slate-400 font-sans">{acc.nameEn}</div>
                      </div>
                    </td>

                    {/* Type Badge */}
                    <td className="p-3">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${getTypeBadgeClass(acc.type)}`}>
                        {acc.type}
                      </span>
                    </td>

                    {/* Category */}
                    <td className="p-3 text-slate-600">
                      {acc.category}
                    </td>

                    {/* Level */}
                    <td className="p-3 text-center">
                      <span className="bg-slate-100 text-slate-600 font-mono text-[10px] px-2 py-0.5 rounded">
                        مستوى {acc.level}
                      </span>
                    </td>

                    {/* Balance */}
                    <td className="p-3 text-left font-mono font-bold">
                      <span className={acc.balance < 0 ? 'text-rose-600' : 'text-emerald-600'}>
                        {formatCurrency(convertedBal, currency)}
                      </span>
                    </td>

                    {/* Status */}
                    <td className="p-3 text-center">
                      <span className="inline-flex items-center gap-1 text-[11px] text-emerald-600 font-semibold">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        نشط
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* ADD ACCOUNT MODAL */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-white border border-slate-300 rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
                <Layers className="w-5 h-5 text-blue-600" />
                <span>إضافة حساب جديد إلى دليل الحسابات</span>
              </h3>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateAccount} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    رمز الحساب (Account Code)
                  </label>
                  <input
                    type="text"
                    required
                    value={newCode}
                    onChange={(e) => setNewCode(e.target.value)}
                    placeholder="مثال: 1115"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 font-mono focus:ring-2 focus:ring-blue-500 focus:bg-white focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    النوع الرئيسي (Type)
                  </label>
                  <select
                    value={newType}
                    onChange={(e) => setNewType(e.target.value as AccountType)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:ring-2 focus:ring-blue-500 focus:bg-white focus:outline-none"
                  >
                    <option value="ASSET">أصول (Assets)</option>
                    <option value="LIABILITY">خصوم (Liabilities)</option>
                    <option value="EQUITY">حقوق ملكية (Equity)</option>
                    <option value="REVENUE">إيرادات (Revenues)</option>
                    <option value="EXPENSE">مصروفات (Expenses)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  اسم الحساب باللغة العربية
                </label>
                <input
                  type="text"
                  required
                  value={newNameAr}
                  onChange={(e) => setNewNameAr(e.target.value)}
                  placeholder="مثال: بنك الشمول للتمويل الأصغر"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:ring-2 focus:ring-blue-500 focus:bg-white focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  اسم الحساب بالإنجليزية (English Name)
                </label>
                <input
                  type="text"
                  value={newNameEn}
                  onChange={(e) => setNewNameEn(e.target.value)}
                  placeholder="e.g. Shomool Islamic Bank"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:ring-2 focus:ring-blue-500 focus:bg-white focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    الحساب الأب (Parent)
                  </label>
                  <select
                    value={newParentCode}
                    onChange={(e) => setNewParentCode(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:ring-2 focus:ring-blue-500 focus:bg-white focus:outline-none"
                  >
                    {accounts.filter(a => a.level <= 2).map((acc) => (
                      <option key={acc.code} value={acc.code}>
                        {acc.code} - {acc.nameAr}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    التصنيف (Category)
                  </label>
                  <input
                    type="text"
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value)}
                    placeholder="مثال: أصول متداولة"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:ring-2 focus:ring-blue-500 focus:bg-white focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  الرصيد الافتتاحي (بالريال اليمني YER)
                </label>
                <input
                  type="number"
                  value={newOpeningBalance}
                  onChange={(e) => setNewOpeningBalance(parseFloat(e.target.value) || 0)}
                  placeholder="0.00"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 font-mono focus:ring-2 focus:ring-blue-500 focus:bg-white focus:outline-none text-left"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-xs"
                >
                  حفظ الحساب في الدليل
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
