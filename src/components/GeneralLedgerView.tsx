import React, { useState } from 'react';
import { 
  Plus, 
  Trash2, 
  Check, 
  AlertCircle, 
  Sparkles, 
  Printer, 
  RotateCcw, 
  Search, 
  FileText,
  Calendar,
  Layers,
  ArrowRight,
  Repeat,
  BookmarkPlus,
  Play,
  Zap,
  Scan,
  Filter
} from 'lucide-react';
import { Account, JournalEntry, JournalEntryLine, Currency, CostCenter, ProfitCenter, RecurringJournalEntryTemplate } from '../types/accounting';
import { formatCurrency, tafqeetArabic, exportToCsv } from '../utils/formatters';
import { DocumentArchiver } from './DocumentArchiver';
import { RecurringEntriesManager } from './gl/RecurringEntriesManager';
import { getLoadedRecurringTemplates, saveRecurringTemplates } from '../data/recurringEntriesData';
import { DocumentOcrScannerModal, ExtractedOcrData } from './DocumentOcrScannerModal';
import { CompanyHeaderView } from './CompanyHeaderView';

interface GeneralLedgerViewProps {
  accounts: Account[];
  journalEntries: JournalEntry[];
  costCenters: CostCenter[];
  profitCenters: ProfitCenter[];
  onAddJournalEntry: (entry: JournalEntry) => void;
  onReverseEntry: (entryId: string) => void;
  currency: Currency;
  rates: Record<Currency, number>;
}

export const GeneralLedgerView: React.FC<GeneralLedgerViewProps> = ({
  accounts,
  journalEntries,
  costCenters,
  profitCenters,
  onAddJournalEntry,
  onReverseEntry,
  currency,
  rates,
}) => {
  const [activeTab, setActiveTab] = useState<'create' | 'recurring' | 'list'>('create');
  const [selectedEntryForPrint, setSelectedEntryForPrint] = useState<JournalEntry | null>(null);
  const [aiPrompt, setAiPrompt] = useState('');
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [isOcrOpen, setIsOcrOpen] = useState(false);

  // Advanced List Filters State
  const [filterQuery, setFilterQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'POSTED' | 'REVERSED'>('ALL');
  const [dateFilter, setDateFilter] = useState('');
  const [minAmountFilter, setMinAmountFilter] = useState('');

  // Recurring templates state with persistence
  const [recurringTemplates, setRecurringTemplates] = useState<RecurringJournalEntryTemplate[]>(() =>
    getLoadedRecurringTemplates()
  );

  const todayStr = new Date().toISOString().split('T')[0];
  const dueRecurringCount = recurringTemplates.filter(
    (t) => t.status === 'ACTIVE' && t.nextRunDate <= todayStr
  ).length;

  const handleUpdateRecurringTemplates = (updated: RecurringJournalEntryTemplate[]) => {
    setRecurringTemplates(updated);
    saveRecurringTemplates(updated);
  };

  // Form State for creating a new Journal Entry
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [reference, setReference] = useState(`REF-${Date.now().toString().slice(-6)}`);
  const [description, setDescription] = useState('');
  const [attachments, setAttachments] = useState<string[]>([]);
  const [lines, setLines] = useState<JournalEntryLine[]>([
    {
      id: '1',
      accountCode: '1121',
      accountName: 'عملاء القطاع التجاري والحكومي',
      debit: 0,
      credit: 0,
      currency: 'YER',
      exchangeRate: 1,
      amountInBase: 0,
      description: '',
    },
    {
      id: '2',
      accountCode: '4100',
      accountName: 'إيرادات المبيعات الرئيسية',
      debit: 0,
      credit: 0,
      currency: 'YER',
      exchangeRate: 1,
      amountInBase: 0,
      description: '',
    },
  ]);

  const totalDebit = lines.reduce((sum, l) => sum + (Number(l.debit) || 0), 0);
  const totalCredit = lines.reduce((sum, l) => sum + (Number(l.credit) || 0), 0);
  const isBalanced = Math.abs(totalDebit - totalCredit) < 0.001 && totalDebit > 0;
  const imbalanceAmount = Math.abs(totalDebit - totalCredit);

  const handleAddLine = () => {
    setLines([
      ...lines,
      {
        id: Math.random().toString(),
        accountCode: accounts[0]?.code || '1111',
        accountName: accounts[0]?.nameAr || 'النقدية',
        debit: 0,
        credit: 0,
        currency: 'YER',
        exchangeRate: 1,
        amountInBase: 0,
        description: '',
      },
    ]);
  };

  const handleRemoveLine = (index: number) => {
    if (lines.length <= 2) {
      alert('يجب أن يحتوي القيد المحاسبي على سطرين على الأقل (طرف مدين وطرف دائن).');
      return;
    }
    setLines(lines.filter((_, i) => i !== index));
  };

  const handleLineChange = (index: number, field: keyof JournalEntryLine, value: any) => {
    const updated = [...lines];
    if (field === 'accountCode') {
      const acc = accounts.find(a => a.code === value);
      updated[index].accountCode = value;
      updated[index].accountName = acc ? acc.nameAr : '';
    } else {
      (updated[index] as any)[field] = value;
    }
    setLines(updated);
  };

  const handleSubmitEntry = (e: React.FormEvent) => {
    e.preventDefault();
    if (!description.trim()) {
      alert('يرجى كتابة بيان القيد المحاسبي.');
      return;
    }
    if (!isBalanced) {
      alert('لا يمكن ترحيل القيد: مجموع الطرف المدين يجب أن يساوي مجموع الطرف الدائن!');
      return;
    }

    const newEntry: JournalEntry = {
      id: `JE-2026-${Date.now().toString().slice(-4)}`,
      entryNumber: `JV-2026-00${journalEntries.length + 87}`,
      date,
      reference,
      description,
      lines: lines.map(l => ({
        ...l,
        debit: Number(l.debit) || 0,
        credit: Number(l.credit) || 0,
      })),
      totalDebit,
      totalCredit,
      status: 'POSTED',
      attachments,
      createdBy: 'المحاسب المالي - النظام الرئيسي',
      postedAt: new Date().toLocaleString('ar-YE'),
    };

    onAddJournalEntry(newEntry);
    alert(`تم ترحيل قيد اليومية رقم ${newEntry.entryNumber} بنجاح للأستاذ العام!`);
    
    // Reset form
    setDescription('');
    setAttachments([]);
    setReference(`REF-${Date.now().toString().slice(-6)}`);
    setLines([
      { id: '1', accountCode: '1111', accountName: 'الصندوق الرئيسي - الإدارة', debit: 0, credit: 0, currency: 'YER', exchangeRate: 1, amountInBase: 0, description: '' },
      { id: '2', accountCode: '5200', accountName: 'المصروفات العمومية والإدارية', debit: 0, credit: 0, currency: 'YER', exchangeRate: 1, amountInBase: 0, description: '' },
    ]);
    setActiveTab('list');
  };

  const handleSaveAsRecurringTemplate = () => {
    if (!isBalanced) {
      alert('يجب أن يكون القيد متوازناً لحفظه كقالب متكرر.');
      return;
    }
    const day = parseInt(date.split('-')[2], 10) || 1;
    const cleanRef = reference.replace(/[^a-zA-Z0-9]/g, '').slice(0, 8).toUpperCase() || 'EXP';
    const newTmpl: RecurringJournalEntryTemplate = {
      id: `rec-${Date.now().toString().slice(-6)}`,
      templateCode: `REC-${cleanRef}`,
      templateName: description.trim() || 'قيد مصاريف دورية متكررة',
      category: 'OTHER',
      description: description.trim() || 'قالب قيد متكرر من شاشة قيود اليومية',
      frequency: 'MONTHLY',
      executionDayOfMonth: day,
      startDate: date,
      nextRunDate: date,
      executedOccurrences: 0,
      status: 'ACTIVE',
      autoPost: true,
      currency: currency,
      lines: lines.map((l) => ({ ...l, debit: Number(l.debit) || 0, credit: Number(l.credit) || 0 })),
      totalDebit: totalDebit,
      totalCredit: totalCredit,
      createdAt: new Date().toISOString(),
    };

    const updated = [newTmpl, ...recurringTemplates];
    handleUpdateRecurringTemplates(updated);
    alert(`تم حفظ وتثبيت القيد كقالب قيد متكرر بنجاح [${newTmpl.templateCode}]! تم تحويلك لتبويب القيود المتكررة.`);
    setActiveTab('recurring');
  };

  const handleGenerateWithAI = async () => {
    if (!aiPrompt.trim()) return;
    setIsAiLoading(true);
    try {
      const res = await fetch('/api/ai/generate-entry', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ description: aiPrompt }),
      });
      const data = await res.json();
      if (data.entry) {
        if (data.entry.description) setDescription(data.entry.description);
        if (data.entry.reference) setReference(data.entry.reference);
        if (data.entry.lines && data.entry.lines.length > 0) {
          setLines(
            data.entry.lines.map((l: any, idx: number) => {
              const matchedAcc = accounts.find(a => a.code === l.accountCode);
              return {
                id: String(idx + 1),
                accountCode: l.accountCode || '1111',
                accountName: matchedAcc ? matchedAcc.nameAr : l.accountName || 'حساب',
                debit: Number(l.debit) || 0,
                credit: Number(l.credit) || 0,
                currency: 'YER',
                exchangeRate: 1,
                amountInBase: Number(l.debit) || Number(l.credit) || 0,
                description: l.description || data.entry.description,
              };
            })
          );
        }
      }
    } catch (err) {
      console.error(err);
      alert('تعذر توليد القيد عبر الذكاء الاصطناعي حالياً.');
    } finally {
      setIsAiLoading(false);
    }
  };

  const handleScanOcrComplete = (ocrData: ExtractedOcrData) => {
    setDescription(`قيد مستند ممسوح ضوئياً: ${ocrData.vendorName} (${ocrData.referenceNumber})`);
    if (ocrData.referenceNumber) setReference(ocrData.referenceNumber);
    if (ocrData.date) setDate(ocrData.date);

    // Auto populate debit and credit lines from OCR total
    const amount = ocrData.totalAmount || 0;
    setLines([
      {
        id: '1',
        accountCode: '2110',
        accountName: 'موردو البضائع والخدمات المحلية',
        debit: amount,
        credit: 0,
        currency: 'YER',
        exchangeRate: 1,
        amountInBase: amount,
        description: `فاتورة مورد OCR - ${ocrData.vendorName}`,
      },
      {
        id: '2',
        accountCode: '1111',
        accountName: 'الصندوق والنقدية في الخزينة',
        debit: 0,
        credit: amount,
        currency: 'YER',
        exchangeRate: 1,
        amountInBase: amount,
        description: `سداد فاتورة OCR - ${ocrData.vendorName}`,
      },
    ]);
    alert('تمت قراءة بيانات الفاتورة ضوئياً واستخراج أطراف القيد بنجاح!');
  };

  const handleQuickPrintEntry = (entry: JournalEntry) => {
    setSelectedEntryForPrint(entry);
    setTimeout(() => {
      window.print();
    }, 350);
  };

  const filteredEntries = journalEntries.filter((entry) => {
    const matchesSearch =
      entry.entryNumber.toLowerCase().includes(filterQuery.toLowerCase()) ||
      entry.description.toLowerCase().includes(filterQuery.toLowerCase()) ||
      entry.reference.toLowerCase().includes(filterQuery.toLowerCase());

    const matchesStatus =
      statusFilter === 'ALL' ||
      (statusFilter === 'POSTED' && entry.status === 'POSTED') ||
      (statusFilter === 'REVERSED' && entry.status !== 'POSTED');

    const matchesDate = !dateFilter || entry.date === dateFilter;

    const matchesMinAmount =
      !minAmountFilter || entry.totalDebit >= parseFloat(minAmountFilter);

    return matchesSearch && matchesStatus && matchesDate && matchesMinAmount;
  });

  return (
    <div className="space-y-6">
      {/* Top Header & Tab Controls in Geometric Balance style */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white border border-slate-200 p-5 rounded-xl shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <span className="bg-blue-50 text-blue-700 text-xs px-2.5 py-0.5 rounded-md font-mono font-bold border border-blue-200">
              SAP T-Code: FB50 / FBL3N
            </span>
            <h2 className="text-lg sm:text-xl font-bold text-slate-800">الأستاذ العام وقيود اليومية (General Ledger)</h2>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            ترحيل ومراجعة القيود المحاسبية المزدوجة مع موازنة آلية فورية للمدين والدائن.
          </p>
        </div>

        <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl border border-slate-200">
          <button
            onClick={() => setActiveTab('create')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold transition ${
              activeTab === 'create'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Plus className="w-3.5 h-3.5" />
            إنشاء قيد جديد
          </button>

          <button
            onClick={() => setActiveTab('recurring')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold transition relative ${
              activeTab === 'recurring'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Repeat className="w-3.5 h-3.5" />
            <span>القيود المتكررة والجدولة</span>
            <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono font-bold ${
              dueRecurringCount > 0
                ? 'bg-amber-500 text-white animate-pulse'
                : activeTab === 'recurring'
                ? 'bg-blue-800 text-white'
                : 'bg-slate-200 text-slate-700'
            }`}>
              {dueRecurringCount > 0 ? `! ${dueRecurringCount}` : recurringTemplates.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('list')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold transition ${
              activeTab === 'list'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            سجل القيود ({journalEntries.length})
          </button>
        </div>
      </div>

      {/* VIEW 1: CREATE NEW JOURNAL ENTRY */}
      {activeTab === 'create' && (
        <div className="space-y-6">
          {/* AI Fast Entry Assistant Bar - Dark Geometric Accent */}
          <div className="bg-slate-900 border border-slate-800 p-5 rounded-xl text-white shadow-sm relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full -mr-16 -mt-16"></div>
            <div className="flex items-center gap-2 mb-2 relative z-10">
              <Sparkles className="w-4 h-4 text-amber-300 animate-pulse" />
              <h3 className="text-xs font-bold text-blue-300 uppercase tracking-wide">
                التوليد الذكي للقيود المحاسبية عبر الذكاء الاصطناعي (AI Prompt-to-Entry)
              </h3>
            </div>
            <div className="flex flex-col sm:flex-row gap-2 relative z-10">
              <input
                type="text"
                value={aiPrompt}
                onChange={(e) => setAiPrompt(e.target.value)}
                placeholder="اكتب المعاملة باللغة الطبيعية (مثال: سداد إيجار فرع صنعاء بمبلغ 1,500,000 ريال نقداً من الصندوق الرئيسي)..."
                className="flex-1 bg-slate-950 border border-slate-700 rounded-xl px-4 py-2 text-xs sm:text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-blue-400"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleGenerateWithAI();
                }}
              />
              <button
                type="button"
                onClick={handleGenerateWithAI}
                disabled={isAiLoading || !aiPrompt.trim()}
                className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-xs transition whitespace-nowrap"
              >
                {isAiLoading ? (
                  <>
                    <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                    <span>جارِ المعالجة...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                    <span>توليد وتعبئة القيد</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={() => setIsOcrOpen(true)}
                className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-xs transition whitespace-nowrap"
                title="مسح الفواتير والإيصالات المستندية ضوئياً"
              >
                <Scan className="w-4 h-4 text-amber-300" />
                <span>مسح ضوئي OCR 📷</span>
              </button>
            </div>
          </div>

          {/* Main Journal Entry Form - Crisp White Geometric Card */}
          <form onSubmit={handleSubmitEntry} className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-5">
            {/* Header fields */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  تاريخ القيد
                </label>
                <div className="relative">
                  <Calendar className="w-4 h-4 text-slate-400 absolute right-3 top-2.5" />
                  <input
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    required
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl pr-9 pl-3 py-2 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  رقم المرجع / المستند المرفق
                </label>
                <input
                  type="text"
                  value={reference}
                  onChange={(e) => setReference(e.target.value)}
                  placeholder="مثال: INV-2026-091"
                  required
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  بيان وشرح القيد المحاسبي العام
                </label>
                <input
                  type="text"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="مثال: إثبات مبيعات بضاعة بالأجل..."
                  required
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
                />
              </div>
            </div>

            <DocumentArchiver
              attachments={attachments}
              onAddAttachment={(url) => setAttachments(prev => [...prev, url])}
              onRemoveAttachment={(url) => setAttachments(prev => prev.filter(u => u !== url))}
            />

            {/* Table of Debit/Credit Lines */}
            <div className="border border-slate-200 rounded-xl overflow-hidden bg-white shadow-xs">
              <div className="overflow-x-auto">
                <table className="w-full text-right text-xs">
                  <thead className="bg-slate-50 text-slate-700 border-b border-slate-200 font-semibold">
                    <tr>
                      <th className="p-3 w-12 text-center">#</th>
                      <th className="p-3 min-w-[220px]">الحساب (رقم واسم الحساب)</th>
                      <th className="p-3 min-w-[130px]">المدين (Debit)</th>
                      <th className="p-3 min-w-[130px]">الدائن (Credit)</th>
                      <th className="p-3 min-w-[160px]">مركز التكلفة (CO)</th>
                      <th className="p-3 min-w-[200px]">شرح السطر</th>
                      <th className="p-3 w-12 text-center">حذف</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {lines.map((line, idx) => (
                      <tr key={line.id} className="hover:bg-slate-50/70 transition">
                        <td className="p-3 text-center text-slate-400 font-mono">{idx + 1}</td>
                        
                        {/* Account Selector */}
                        <td className="p-2">
                          <select
                            value={line.accountCode}
                            onChange={(e) => handleLineChange(idx, 'accountCode', e.target.value)}
                            className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                          >
                            {accounts.filter(a => a.level >= 2).map((acc) => (
                              <option key={acc.code} value={acc.code}>
                                {acc.code} - {acc.nameAr} ({acc.category})
                              </option>
                            ))}
                          </select>
                        </td>

                        {/* Debit */}
                        <td className="p-2">
                          <input
                            type="number"
                            min="0"
                            step="any"
                            value={line.debit === 0 ? '' : line.debit}
                            onChange={(e) => {
                              const val = parseFloat(e.target.value) || 0;
                              handleLineChange(idx, 'debit', val);
                              if (val > 0) handleLineChange(idx, 'credit', 0);
                            }}
                            placeholder="0.00"
                            className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-emerald-600 font-mono font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500 text-left"
                          />
                        </td>

                        {/* Credit */}
                        <td className="p-2">
                          <input
                            type="number"
                            min="0"
                            step="any"
                            value={line.credit === 0 ? '' : line.credit}
                            onChange={(e) => {
                              const val = parseFloat(e.target.value) || 0;
                              handleLineChange(idx, 'credit', val);
                              if (val > 0) handleLineChange(idx, 'debit', 0);
                            }}
                            placeholder="0.00"
                            className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-rose-600 font-mono font-bold focus:outline-none focus:ring-2 focus:ring-rose-500 text-left"
                          />
                        </td>

                        {/* Cost Center */}
                        <td className="p-2">
                          <select
                            value={line.costCenterId || ''}
                            onChange={(e) => handleLineChange(idx, 'costCenterId', e.target.value)}
                            className="w-full bg-white border border-slate-200 rounded-lg px-2 py-1.5 text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                          >
                            <option value="">بدون مركز تكلفة</option>
                            {costCenters.map((cc) => (
                              <option key={cc.id} value={cc.id}>
                                {cc.nameAr}
                              </option>
                            ))}
                          </select>
                        </td>

                        {/* Line Description */}
                        <td className="p-2">
                          <input
                            type="text"
                            value={line.description}
                            onChange={(e) => handleLineChange(idx, 'description', e.target.value)}
                            placeholder="تفصيل السطر..."
                            className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </td>

                        {/* Delete Action */}
                        <td className="p-2 text-center">
                          <button
                            type="button"
                            onClick={() => handleRemoveLine(idx)}
                            className="text-slate-400 hover:text-rose-600 p-1 transition"
                            title="حذف السطر"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Add line button */}
              <div className="p-3 bg-slate-50 border-t border-slate-200">
                <button
                  type="button"
                  onClick={handleAddLine}
                  className="flex items-center gap-1.5 text-xs font-bold text-blue-600 hover:text-blue-700 px-3 py-1.5 rounded-lg hover:bg-blue-50 transition"
                >
                  <Plus className="w-3.5 h-3.5" />
                  إضافة سطر قيد جديد
                </button>
              </div>
            </div>

            {/* Live Debit/Credit Balance Bar */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 rounded-xl bg-slate-50 border border-slate-200 items-center">
              <div className="text-right">
                <span className="text-xs text-slate-500 font-semibold block">إجمالي المدين (Debit Total)</span>
                <span className="text-lg font-bold text-emerald-600 font-mono">
                  {formatCurrency(totalDebit, currency)}
                </span>
              </div>

              <div className="text-right">
                <span className="text-xs text-slate-500 font-semibold block">إجمالي الدائن (Credit Total)</span>
                <span className="text-lg font-bold text-rose-600 font-mono">
                  {formatCurrency(totalCredit, currency)}
                </span>
              </div>

              <div className="flex flex-wrap items-center justify-between md:justify-end gap-3 border-t md:border-t-0 pt-3 md:pt-0 border-slate-200">
                {isBalanced ? (
                  <div className="flex items-center gap-1.5 text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-200 text-xs font-bold">
                    <Check className="w-4 h-4" />
                    <span>القيد متوازن وجاهز للترحيل</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-1.5 text-rose-700 bg-rose-50 px-3 py-1.5 rounded-lg border border-rose-200 text-xs font-bold">
                    <AlertCircle className="w-4 h-4" />
                    <span>فارق عدم التوازن: {formatCurrency(imbalanceAmount, currency)}</span>
                  </div>
                )}

                <button
                  type="button"
                  onClick={handleSaveAsRecurringTemplate}
                  disabled={!isBalanced}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-purple-50 text-purple-700 hover:text-purple-800 border border-purple-200 disabled:opacity-40 text-xs font-bold shadow-2xs transition whitespace-nowrap flex items-center gap-1.5"
                  title="حفظ هذا القيد كقالب متكرر دورياً"
                >
                  <BookmarkPlus className="w-4 h-4 text-purple-600" />
                  <span>حفظ كقالب متكرر (FBD1)</span>
                </button>

                <button
                  type="submit"
                  disabled={!isBalanced}
                  className="px-6 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white text-xs font-bold shadow-xs transition whitespace-nowrap"
                >
                  ترحيل القيد (Post JV)
                </button>
              </div>
            </div>
          </form>
        </div>
      )}

      {/* VIEW 2: RECURRING JOURNAL ENTRIES & SCHEDULING (SAP FBD1 / F.14) */}
      {activeTab === 'recurring' && (
        <RecurringEntriesManager
          accounts={accounts}
          costCenters={costCenters}
          recurringTemplates={recurringTemplates}
          onUpdateRecurringTemplates={handleUpdateRecurringTemplates}
          onAddJournalEntry={onAddJournalEntry}
          journalEntriesCount={journalEntries.length}
          currency={currency}
          rates={rates}
          onSwitchToCreateTab={() => setActiveTab('create')}
        />
      )}

      {/* VIEW 3: POSTED JOURNAL ENTRIES LIST */}
      {activeTab === 'list' && (
        <div className="space-y-4">
          <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3 bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
            <div className="flex flex-wrap items-center gap-2 flex-1">
              <div className="relative w-full sm:w-64">
                <Search className="w-4 h-4 text-slate-400 absolute right-3 top-2.5" />
                <input
                  type="text"
                  value={filterQuery}
                  onChange={(e) => setFilterQuery(e.target.value)}
                  placeholder="ابحث برقم القيد أو المرجع أو البيان..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg pr-9 pl-3 py-1.5 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
                />
              </div>

              {/* Status Filter */}
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as any)}
                className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="ALL">جميع الحالات</option>
                <option value="POSTED">مرحّل معتمد</option>
                <option value="REVERSED">معكوس / ملغي</option>
              </select>

              {/* Date Filter */}
              <input
                type="date"
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                title="فلترة بحسب التاريخ"
              />

              {/* Min Amount Filter */}
              <input
                type="number"
                value={minAmountFilter}
                onChange={(e) => setMinAmountFilter(e.target.value)}
                placeholder="الحد الأدنى للمبلغ..."
                className="w-32 bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />

              {(filterQuery || statusFilter !== 'ALL' || dateFilter || minAmountFilter) && (
                <button
                  onClick={() => {
                    setFilterQuery('');
                    setStatusFilter('ALL');
                    setDateFilter('');
                    setMinAmountFilter('');
                  }}
                  className="text-xs text-rose-600 hover:text-rose-700 font-bold px-2 py-1"
                >
                  إلغاء الفلاتر
                </button>
              )}
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  const headers = ['رقم القيد', 'التاريخ', 'المرجع', 'البيان', 'إجمالي المبلغ', 'الحالة'];
                  const rows = journalEntries.map(j => [
                    j.entryNumber,
                    j.date,
                    j.reference,
                    j.description,
                    j.totalDebit,
                    j.status
                  ]);
                  exportToCsv('سجل_قيود_اليومية_SAP', headers, rows);
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold border border-slate-200 transition whitespace-nowrap"
              >
                تصدير CSV
              </button>
            </div>
          </div>

          {/* Entries Cards / Table in Geometric style */}
          <div className="space-y-3">
            {filteredEntries.map((entry) => {
              const isRecurring =
                Boolean(entry.recurringTemplateId) ||
                entry.reference?.startsWith('REC') ||
                entry.createdBy?.includes('القيود المتكررة') ||
                entry.createdBy?.includes('F.14');

              return (
              <div
                key={entry.id}
                className="bg-white border border-slate-200 hover:border-slate-300 rounded-xl p-4 transition shadow-xs"
              >
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 pb-3 border-b border-slate-100">
                  <div className="flex items-center gap-2.5 flex-wrap">
                    <span className="font-mono text-xs font-bold text-blue-700 bg-blue-50 px-2.5 py-1 rounded-lg border border-blue-200">
                      {entry.entryNumber}
                    </span>

                    {isRecurring && (
                      <span className="bg-purple-50 text-purple-700 border border-purple-200 text-[10px] font-bold px-2 py-0.5 rounded-md flex items-center gap-1">
                        <Repeat className="w-3 h-3 text-purple-600" />
                        <span>قيد متكرر دوري (F.14 Auto)</span>
                      </span>
                    )}

                    <span className="text-xs text-slate-500 flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5 text-slate-400" />
                      {entry.date} {entry.hijriDate && `(${entry.hijriDate})`}
                    </span>
                    <span className="text-xs font-mono text-slate-600 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                      مرجع: {entry.reference}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full ${
                      entry.status === 'POSTED'
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        : 'bg-rose-50 text-rose-700 border border-rose-200'
                    }`}>
                      {entry.status === 'POSTED' ? 'مرحّل معتمد' : 'معكوس / ملغي'}
                    </span>

                    <button
                      onClick={() => handleQuickPrintEntry(entry)}
                      className="flex items-center gap-1 text-xs bg-amber-500 hover:bg-amber-600 text-slate-950 font-black px-2.5 py-1 rounded-lg transition shadow-xs active:scale-95"
                      title="طباعة سريعة فورية لسند القيد"
                    >
                      <Zap className="w-3.5 h-3.5 fill-current" />
                      <span>طباعة سريعة ⚡</span>
                    </button>

                    <button
                      onClick={() => setSelectedEntryForPrint(entry)}
                      className="flex items-center gap-1 text-xs text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 px-2.5 py-1 rounded-lg transition"
                      title="عرض وسند طباعة القيد"
                    >
                      <Printer className="w-3.5 h-3.5" />
                      <span>سند قيد</span>
                    </button>

                    {entry.status === 'POSTED' && (
                      <button
                        onClick={() => onReverseEntry(entry.id)}
                        className="flex items-center gap-1 text-xs text-rose-600 hover:text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 px-2.5 py-1 rounded-lg transition"
                        title="عكس القيد (Reversal)"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                        <span>عكس</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* Entry Description */}
                <p className="text-xs sm:text-sm font-semibold text-slate-800 mt-2.5 mb-3">
                  {entry.description}
                </p>

                {/* Lines breakdown */}
                <div className="bg-slate-50 rounded-xl overflow-hidden border border-slate-200">
                  <table className="w-full text-right text-xs">
                    <thead className="bg-slate-100 text-slate-600 border-b border-slate-200 font-semibold">
                      <tr>
                        <th className="p-2 w-28">رمز الحساب</th>
                        <th className="p-2">اسم الحساب</th>
                        <th className="p-2 text-left">مدين (Debit)</th>
                        <th className="p-2 text-left">دائن (Credit)</th>
                        <th className="p-2">الشرح</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {entry.lines.map((l) => (
                        <tr key={l.id} className="hover:bg-white/80">
                          <td className="p-2 font-mono text-slate-600">{l.accountCode}</td>
                          <td className="p-2 text-slate-800 font-medium">{l.accountName}</td>
                          <td className="p-2 font-mono font-bold text-emerald-600 text-left">
                            {l.debit > 0 ? formatCurrency(l.debit, currency) : '-'}
                          </td>
                          <td className="p-2 font-mono font-bold text-rose-600 text-left">
                            {l.credit > 0 ? formatCurrency(l.credit, currency) : '-'}
                          </td>
                          <td className="p-2 text-slate-500">{l.description || '-'}</td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot className="bg-slate-100 font-bold text-slate-800 border-t border-slate-200">
                      <tr>
                        <td colSpan={2} className="p-2">الإجمالي المتوازن</td>
                        <td className="p-2 text-emerald-600 font-mono text-left">
                          {formatCurrency(entry.totalDebit, currency)}
                        </td>
                        <td className="p-2 text-rose-600 font-mono text-left">
                          {formatCurrency(entry.totalCredit, currency)}
                        </td>
                        <td className="p-2 text-[10px] text-slate-500 font-normal">تم القيد بواسطة: {entry.createdBy}</td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>
            );
          })}
          </div>
        </div>
      )}

      {/* PRINTABLE JOURNAL VOUCHER MODAL */}
      {selectedEntryForPrint && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-white border border-slate-300 rounded-2xl max-w-2xl w-full p-6 space-y-6 shadow-2xl max-h-[90vh] overflow-y-auto">
            {/* Action Bar */}
            <div className="flex items-center justify-between border-b border-slate-200 pb-3 no-print">
              <div className="flex items-center gap-2">
                <Printer className="w-5 h-5 text-blue-600" />
                <h3 className="text-base font-bold text-slate-800">معاينة سند قيد اليومية الرسمي</h3>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => window.print()}
                  className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold shadow-xs"
                >
                  طباعة السند
                </button>
                <button
                  onClick={() => setSelectedEntryForPrint(null)}
                  className="px-4 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold"
                >
                  إغلاق
                </button>
              </div>
            </div>

            {/* Printable Voucher Paper */}
            <div className="bg-white text-slate-900 p-6 rounded-xl border border-slate-300 space-y-4 font-sans text-xs">
              <div className="text-center border-b-2 border-slate-900 pb-3">
                <CompanyHeaderView />
                <p className="text-[11px] text-slate-600">نظام إدارة الموارد المالية SAP S/4HANA ERP - الإدارة المالية</p>
                <div className="inline-block mt-2 px-4 py-1 bg-slate-100 border border-slate-400 font-bold text-sm">
                  سند قيد يومية (Journal Voucher)
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 text-[11px]">
                <div><strong>رقم القيد:</strong> {selectedEntryForPrint.entryNumber}</div>
                <div><strong>التاريخ:</strong> {selectedEntryForPrint.date}</div>
                <div><strong>رقم المرجع:</strong> {selectedEntryForPrint.reference}</div>
                <div><strong>الحالة:</strong> {selectedEntryForPrint.status === 'POSTED' ? 'مرحّل معتمد' : 'ملغي'}</div>
              </div>

              <div className="bg-slate-50 p-2 border border-slate-200">
                <strong>البيان:</strong> {selectedEntryForPrint.description}
              </div>

              <table className="w-full border-collapse border border-slate-400 text-right text-[11px]">
                <thead className="bg-slate-100">
                  <tr>
                    <th className="border border-slate-400 p-1.5">رقم الحساب</th>
                    <th className="border border-slate-400 p-1.5">اسم الحساب</th>
                    <th className="border border-slate-400 p-1.5 text-left">مدين</th>
                    <th className="border border-slate-400 p-1.5 text-left">دائن</th>
                    <th className="border border-slate-400 p-1.5">البيان الجزئي</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedEntryForPrint.lines.map((l) => (
                    <tr key={l.id}>
                      <td className="border border-slate-400 p-1.5 font-mono">{l.accountCode}</td>
                      <td className="border border-slate-400 p-1.5 font-semibold">{l.accountName}</td>
                      <td className="border border-slate-400 p-1.5 text-left font-mono">{l.debit > 0 ? l.debit.toLocaleString() : '-'}</td>
                      <td className="border border-slate-400 p-1.5 text-left font-mono">{l.credit > 0 ? l.credit.toLocaleString() : '-'}</td>
                      <td className="border border-slate-400 p-1.5">{l.description || '-'}</td>
                    </tr>
                  ))}
                  <tr className="bg-slate-100 font-bold">
                    <td colSpan={2} className="border border-slate-400 p-1.5 text-center">المجموع الإجمالي</td>
                    <td className="border border-slate-400 p-1.5 text-left font-mono">{selectedEntryForPrint.totalDebit.toLocaleString()}</td>
                    <td className="border border-slate-400 p-1.5 text-left font-mono">{selectedEntryForPrint.totalCredit.toLocaleString()}</td>
                    <td className="border border-slate-400 p-1.5"></td>
                  </tr>
                </tbody>
              </table>

              <div className="p-2 bg-slate-50 border border-slate-200 text-[11px]">
                <strong>المبلغ كتابة (تفقيط):</strong> {tafqeetArabic(selectedEntryForPrint.totalDebit, 'YER')}
              </div>

              {/* Signature Blocks */}
              <div className="grid grid-cols-3 gap-4 pt-6 text-center text-[11px]">
                <div>
                  <p className="font-bold">المحاسب المعد</p>
                  <p className="mt-8 text-slate-500">____________________</p>
                </div>
                <div>
                  <p className="font-bold">المراجع المالي</p>
                  <p className="mt-8 text-slate-500">____________________</p>
                </div>
                <div>
                  <p className="font-bold">المدير المالي / الاعتماد</p>
                  <p className="mt-8 text-slate-500">____________________</p>
                </div>
              </div>

              {selectedEntryForPrint.attachments && selectedEntryForPrint.attachments.length > 0 && (
                <div className="mt-6 print:hidden">
                  <DocumentArchiver
                    attachments={selectedEntryForPrint.attachments}
                    onAddAttachment={() => {}}
                    disabled={true}
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      )}
      {/* DOCUMENT OCR SCANNER MODAL */}
      <DocumentOcrScannerModal
        isOpen={isOcrOpen}
        onClose={() => setIsOcrOpen(false)}
        onScanComplete={handleScanOcrComplete}
        title="المسح الضوئي الذكي لسندات القيود والفواتير"
      />
    </div>
  );
};
