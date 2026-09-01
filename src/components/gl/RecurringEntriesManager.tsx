import React, { useState } from 'react';
import {
  Calendar,
  Clock,
  Plus,
  Play,
  CheckCircle2,
  AlertTriangle,
  PauseCircle,
  RotateCcw,
  Sparkles,
  Search,
  Filter,
  Trash2,
  Edit3,
  Building2,
  Users,
  TrendingDown,
  Cloud,
  ShieldCheck,
  Zap,
  Landmark,
  FileText,
  X,
  Check,
  Layers,
  ArrowRight,
  Info,
  DollarSign
} from 'lucide-react';
import {
  Account,
  CostCenter,
  Currency,
  JournalEntry,
  JournalEntryLine,
  RecurringCategory,
  RecurringFrequency,
  RecurringJournalEntryTemplate,
  RecurringStatus,
} from '../../types/accounting';
import {
  RECURRING_CATEGORIES_CONFIG,
  RECURRING_FREQUENCIES_CONFIG,
  PRESET_EXPENSE_TEMPLATES,
  generateJournalEntryFromRecurringTemplate,
  saveRecurringTemplates,
  calculateNextRunDate,
} from '../../data/recurringEntriesData';
import { formatCurrency } from '../../utils/formatters';

interface RecurringEntriesManagerProps {
  accounts: Account[];
  costCenters: CostCenter[];
  recurringTemplates: RecurringJournalEntryTemplate[];
  onUpdateRecurringTemplates: (templates: RecurringJournalEntryTemplate[]) => void;
  onAddJournalEntry: (entry: JournalEntry) => void;
  journalEntriesCount: number;
  currency: Currency;
  rates: Record<Currency, number>;
  onSwitchToCreateTab?: () => void;
}

export const RecurringEntriesManager: React.FC<RecurringEntriesManagerProps> = ({
  accounts,
  costCenters,
  recurringTemplates,
  onUpdateRecurringTemplates,
  onAddJournalEntry,
  journalEntriesCount,
  currency,
  rates,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  // Modal State
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<RecurringJournalEntryTemplate | null>(null);

  // Execution Modal / Confirmation
  const [executingTemplate, setExecutingTemplate] = useState<RecurringJournalEntryTemplate | null>(null);
  const [executionDate, setExecutionDate] = useState(new Date().toISOString().split('T')[0]);
  const [batchExecutionMessage, setBatchExecutionMessage] = useState<string | null>(null);

  // Template Form state
  const [formCode, setFormCode] = useState('');
  const [formName, setFormName] = useState('');
  const [formCategory, setFormCategory] = useState<RecurringCategory>('RENT');
  const [formDescription, setFormDescription] = useState('');
  const [formFrequency, setFormFrequency] = useState<RecurringFrequency>('MONTHLY');
  const [formDayOfMonth, setFormDayOfMonth] = useState<number>(1);
  const [formStartDate, setFormStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [formEndDate, setFormEndDate] = useState('');
  const [formTotalOccurrences, setFormTotalOccurrences] = useState<string>('12');
  const [formCurrency, setFormCurrency] = useState<Currency>('YER');
  const [formAutoPost, setFormAutoPost] = useState(true);
  const [formNotes, setFormNotes] = useState('');

  const [formLines, setFormLines] = useState<JournalEntryLine[]>([
    {
      id: '1',
      accountCode: '5200',
      accountName: 'المصروفات العمومية والإدارية',
      debit: 0,
      credit: 0,
      currency: 'YER',
      exchangeRate: 1,
      amountInBase: 0,
      description: '',
    },
    {
      id: '2',
      accountCode: '1112',
      accountName: 'البنوك المحلية - حساب جاري',
      debit: 0,
      credit: 0,
      currency: 'YER',
      exchangeRate: 1,
      amountInBase: 0,
      description: '',
    },
  ]);

  const todayStr = new Date().toISOString().split('T')[0];

  // Calculate Metrics
  const activeCount = recurringTemplates.filter((t) => t.status === 'ACTIVE').length;
  const dueTemplates = recurringTemplates.filter(
    (t) => t.status === 'ACTIVE' && t.nextRunDate <= todayStr
  );
  const totalMonthlyVolume = recurringTemplates
    .filter((t) => t.status === 'ACTIVE')
    .reduce((sum, t) => {
      let multiplier = 1;
      if (t.frequency === 'QUARTERLY') multiplier = 1 / 3;
      else if (t.frequency === 'SEMI_ANNUAL') multiplier = 1 / 6;
      else if (t.frequency === 'ANNUAL') multiplier = 1 / 12;
      else if (t.frequency === 'WEEKLY') multiplier = 4;
      else if (t.frequency === 'DAILY') multiplier = 30;

      const rate = t.currency === 'USD' ? (rates['USD'] || 535) : t.currency === 'SAR' ? (rates['SAR'] || 140) : 1;
      return sum + t.totalDebit * multiplier * rate;
    }, 0);

  // Open Create Modal
  const handleOpenCreateModal = (preset?: Partial<RecurringJournalEntryTemplate>) => {
    setEditingTemplate(null);
    const code = preset?.templateCode || `REC-EXP-${Date.now().toString().slice(-4)}`;
    setFormCode(code);
    setFormName(preset?.templateName || '');
    setFormCategory(preset?.category || 'RENT');
    setFormDescription(preset?.description || '');
    setFormFrequency(preset?.frequency || 'MONTHLY');
    setFormDayOfMonth(preset?.executionDayOfMonth || 1);
    setFormStartDate(todayStr);
    setFormEndDate('');
    setFormTotalOccurrences('12');
    setFormCurrency(preset?.currency || 'YER');
    setFormAutoPost(preset?.autoPost ?? true);
    setFormNotes('');

    if (preset?.category === 'RENT') {
      setFormLines([
        {
          id: '1',
          accountCode: '5200',
          accountName: 'المصروفات العمومية والإدارية (إيجارات)',
          debit: preset.totalDebit || 500000,
          credit: 0,
          currency: preset.currency || 'YER',
          exchangeRate: 1,
          amountInBase: preset.totalDebit || 500000,
          description: 'استحقاق مصروف إيجار شهري',
        },
        {
          id: '2',
          accountCode: '1112',
          accountName: 'البنك - حساب التحويلات',
          debit: 0,
          credit: preset.totalCredit || 500000,
          currency: preset.currency || 'YER',
          exchangeRate: 1,
          amountInBase: preset.totalCredit || 500000,
          description: 'سداد الإيجار الشهري',
        },
      ]);
    } else if (preset?.category === 'SALARY') {
      setFormLines([
        {
          id: '1',
          accountCode: '5200',
          accountName: 'المصروفات العمومية والإدارية - رواتب وأجور',
          debit: preset.totalDebit || 2000000,
          credit: 0,
          currency: preset.currency || 'YER',
          exchangeRate: 1,
          amountInBase: preset.totalDebit || 2000000,
          description: 'استحقاق مسير الرواتب الشهرية',
        },
        {
          id: '2',
          accountCode: '2111',
          accountName: 'أمانات ومستحقات الموظفين والرواتب',
          debit: 0,
          credit: preset.totalCredit || 2000000,
          currency: preset.currency || 'YER',
          exchangeRate: 1,
          amountInBase: preset.totalCredit || 2000000,
          description: 'أجور ورواتب معلقة للصرف',
        },
      ]);
    } else {
      setFormLines([
        {
          id: '1',
          accountCode: accounts[0]?.code || '5200',
          accountName: accounts[0]?.nameAr || 'مصروفات',
          debit: 100000,
          credit: 0,
          currency: 'YER',
          exchangeRate: 1,
          amountInBase: 100000,
          description: '',
        },
        {
          id: '2',
          accountCode: accounts.find((a) => a.code.startsWith('11'))?.code || '1111',
          accountName: 'الصندوق / البنك',
          debit: 0,
          credit: 100000,
          currency: 'YER',
          exchangeRate: 1,
          amountInBase: 100000,
          description: '',
        },
      ]);
    }

    setIsFormModalOpen(true);
  };

  // Open Edit Modal
  const handleOpenEditModal = (template: RecurringJournalEntryTemplate) => {
    setEditingTemplate(template);
    setFormCode(template.templateCode);
    setFormName(template.templateName);
    setFormCategory(template.category);
    setFormDescription(template.description);
    setFormFrequency(template.frequency);
    setFormDayOfMonth(template.executionDayOfMonth || 1);
    setFormStartDate(template.startDate);
    setFormEndDate(template.endDate || '');
    setFormTotalOccurrences(template.totalOccurrences ? String(template.totalOccurrences) : '');
    setFormCurrency(template.currency);
    setFormAutoPost(template.autoPost);
    setFormNotes(template.notes || '');
    setFormLines(template.lines.map((l) => ({ ...l })));
    setIsFormModalOpen(true);
  };

  // Handle line changes in modal
  const handleFormLineChange = (index: number, field: keyof JournalEntryLine, val: any) => {
    const updated = [...formLines];
    if (field === 'accountCode') {
      const acc = accounts.find((a) => a.code === val);
      updated[index].accountCode = val;
      updated[index].accountName = acc ? acc.nameAr : '';
    } else {
      (updated[index] as any)[field] = val;
    }
    setFormLines(updated);
  };

  const handleAddFormLine = () => {
    setFormLines([
      ...formLines,
      {
        id: Math.random().toString(),
        accountCode: accounts[0]?.code || '5200',
        accountName: accounts[0]?.nameAr || 'حساب المصروف',
        debit: 0,
        credit: 0,
        currency: formCurrency,
        exchangeRate: 1,
        amountInBase: 0,
        description: '',
      },
    ]);
  };

  const handleRemoveFormLine = (index: number) => {
    if (formLines.length <= 2) {
      alert('يجب أن يحتوي القالب على سطرين على الأقل (طرف مدين وطرف دائن).');
      return;
    }
    setFormLines(formLines.filter((_, i) => i !== index));
  };

  const formTotalDebit = formLines.reduce((sum, l) => sum + (Number(l.debit) || 0), 0);
  const formTotalCredit = formLines.reduce((sum, l) => sum + (Number(l.credit) || 0), 0);
  const formIsBalanced = Math.abs(formTotalDebit - formTotalCredit) < 0.001 && formTotalDebit > 0;

  // Save Template
  const handleSaveTemplate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim() || !formCode.trim()) {
      alert('يرجى كتابة رمز واسم القالب.');
      return;
    }
    if (!formIsBalanced) {
      alert('لا يمكن حفظ القالب: مجموع المدين يجب أن يساوي مجموع الدائن!');
      return;
    }

    const calculatedNextRun = editingTemplate
      ? editingTemplate.nextRunDate
      : calculateNextRunDate(formStartDate, formFrequency, formDayOfMonth);

    if (editingTemplate) {
      const updatedList = recurringTemplates.map((t) => {
        if (t.id === editingTemplate.id) {
          return {
            ...t,
            templateCode: formCode.trim().toUpperCase(),
            templateName: formName.trim(),
            category: formCategory,
            description: formDescription.trim() || formName.trim(),
            frequency: formFrequency,
            executionDayOfMonth: Number(formDayOfMonth) || 1,
            startDate: formStartDate,
            endDate: formEndDate || undefined,
            totalOccurrences: formTotalOccurrences ? Number(formTotalOccurrences) : undefined,
            currency: formCurrency,
            autoPost: formAutoPost,
            notes: formNotes,
            lines: formLines.map((l) => ({
              ...l,
              debit: Number(l.debit) || 0,
              credit: Number(l.credit) || 0,
            })),
            totalDebit: formTotalDebit,
            totalCredit: formTotalCredit,
            updatedAt: new Date().toISOString(),
          };
        }
        return t;
      });
      onUpdateRecurringTemplates(updatedList);
      saveRecurringTemplates(updatedList);
    } else {
      const newTmpl: RecurringJournalEntryTemplate = {
        id: `rec-${Date.now().toString().slice(-6)}`,
        templateCode: formCode.trim().toUpperCase(),
        templateName: formName.trim(),
        category: formCategory,
        description: formDescription.trim() || formName.trim(),
        frequency: formFrequency,
        executionDayOfMonth: Number(formDayOfMonth) || 1,
        startDate: formStartDate,
        endDate: formEndDate || undefined,
        nextRunDate: calculatedNextRun,
        totalOccurrences: formTotalOccurrences ? Number(formTotalOccurrences) : undefined,
        executedOccurrences: 0,
        status: 'ACTIVE',
        autoPost: formAutoPost,
        currency: formCurrency,
        lines: formLines.map((l) => ({
          ...l,
          debit: Number(l.debit) || 0,
          credit: Number(l.credit) || 0,
        })),
        totalDebit: formTotalDebit,
        totalCredit: formTotalCredit,
        notes: formNotes,
        createdAt: new Date().toISOString(),
      };

      const updatedList = [newTmpl, ...recurringTemplates];
      onUpdateRecurringTemplates(updatedList);
      saveRecurringTemplates(updatedList);
    }

    setIsFormModalOpen(false);
    setEditingTemplate(null);
  };

  // Toggle status
  const handleToggleStatus = (template: RecurringJournalEntryTemplate) => {
    const nextStatus: RecurringStatus = template.status === 'ACTIVE' ? 'PAUSED' : 'ACTIVE';
    const updatedList = recurringTemplates.map((t) =>
      t.id === template.id ? { ...t, status: nextStatus, updatedAt: new Date().toISOString() } : t
    );
    onUpdateRecurringTemplates(updatedList);
    saveRecurringTemplates(updatedList);
  };

  // Delete template
  const handleDeleteTemplate = (id: string) => {
    if (window.confirm('هل أنت متأكد من حذف قالب القيد المتكرر هذا نهائياً؟')) {
      const updatedList = recurringTemplates.filter((t) => t.id !== id);
      onUpdateRecurringTemplates(updatedList);
      saveRecurringTemplates(updatedList);
    }
  };

  // Execute a single template now
  const handleExecuteSingleNow = (template: RecurringJournalEntryTemplate, targetDate: string) => {
    const { newEntry, updatedTemplate } = generateJournalEntryFromRecurringTemplate(
      template,
      targetDate,
      journalEntriesCount
    );

    // 1. Add JV to General Ledger
    onAddJournalEntry(newEntry);

    // 2. Update Template in state & storage
    const updatedList = recurringTemplates.map((t) =>
      t.id === template.id ? updatedTemplate : t
    );
    onUpdateRecurringTemplates(updatedList);
    saveRecurringTemplates(updatedList);

    setExecutingTemplate(null);
    setBatchExecutionMessage(
      `تم بنجاح ترحيل القيد رقم [${newEntry.entryNumber}] بمبلغ ${formatCurrency(
        newEntry.totalDebit,
        template.currency
      )} للأستاذ العام!`
    );
    setTimeout(() => setBatchExecutionMessage(null), 4500);
  };

  // Execute All Due templates (Batch run - SAP F.14)
  const handleExecuteAllDue = () => {
    if (dueTemplates.length === 0) return;

    if (
      !window.confirm(
        `هل تريد ترحيل جميع القيود المتكررة المستحقة الآن (${dueTemplates.length} قيود) تلقائياً للأستاذ العام؟`
      )
    ) {
      return;
    }

    let count = 0;
    let runningEntriesCount = journalEntriesCount;
    let currentTemplates = [...recurringTemplates];

    for (const tmpl of dueTemplates) {
      const { newEntry, updatedTemplate } = generateJournalEntryFromRecurringTemplate(
        tmpl,
        todayStr,
        runningEntriesCount
      );
      onAddJournalEntry(newEntry);
      runningEntriesCount++;
      count++;

      currentTemplates = currentTemplates.map((t) =>
        t.id === tmpl.id ? updatedTemplate : t
      );
    }

    onUpdateRecurringTemplates(currentTemplates);
    saveRecurringTemplates(currentTemplates);

    setBatchExecutionMessage(
      `تم بنجاح ترحيل دفعة القيود المستحقة بالكامل (${count} قيود يومية) إلى الأستاذ العام بموجب الجدولة الآلية (F.14 Batch Processing)!`
    );
    setTimeout(() => setBatchExecutionMessage(null), 5000);
  };

  const filteredTemplates = recurringTemplates.filter((tmpl) => {
    const matchesSearch =
      tmpl.templateCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
      tmpl.templateName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      tmpl.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = categoryFilter === 'ALL' || tmpl.category === categoryFilter;
    const matchesStatus = statusFilter === 'ALL' || tmpl.status === statusFilter;
    return matchesSearch && matchesCategory && matchesStatus;
  });

  return (
    <div className="space-y-6">
      {/* Top Banner & Quick Metrics */}
      <div className="bg-slate-900 text-white p-6 rounded-2xl border border-slate-800 shadow-md relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-blue-600/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="bg-blue-500/20 text-blue-300 border border-blue-400/30 text-[11px] font-mono font-bold px-2.5 py-0.5 rounded-md">
                SAP T-Code: FBD1 (قوالب) / F.14 (تشغيل الدفعات)
              </span>
              <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 text-[11px] font-bold px-2 py-0.5 rounded-md flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-emerald-400" />
                أتمتة المصاريف الثابتة
              </span>
            </div>
            <h2 className="text-xl font-bold tracking-tight">
              القيود اليومية المتكررة والجدولة التلقائية (Recurring Journal Entries)
            </h2>
            <p className="text-xs text-slate-400 mt-1 max-w-2xl leading-relaxed">
              إدارة وأتمتة استحقاقات المصاريف الدورية الثابتة مثل إيجارات المقرات والفروع، مسيرات الرواتب الشهرية، أقساط إهلاك الأصول الثابتة، والاشتراكات لتقليل الأخطاء والجهد اليدوي.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            {dueTemplates.length > 0 && (
              <button
                onClick={handleExecuteAllDue}
                className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold text-xs shadow-lg transition animate-pulse"
              >
                <Play className="w-4 h-4 fill-current" />
                <span>تشغيل المستحقات ({dueTemplates.length}) دفعة واحدة</span>
              </button>
            )}

            <button
              onClick={() => handleOpenCreateModal()}
              className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold text-xs shadow-md transition"
            >
              <Plus className="w-4 h-4" />
              <span>إنشاء قالب قيد متكرر</span>
            </button>
          </div>
        </div>

        {/* Quick KPI Stats Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-5 border-t border-slate-800 text-xs">
          <div className="bg-slate-800/60 p-3 rounded-xl border border-slate-700/60">
            <span className="text-slate-400 text-[11px] block">القوالب النشطة</span>
            <span className="text-lg font-bold text-white font-mono mt-0.5 block">{activeCount} قوالب</span>
          </div>

          <div className="bg-slate-800/60 p-3 rounded-xl border border-slate-700/60">
            <span className="text-slate-400 text-[11px] block">القيود المستحقة للترحيل</span>
            <span className={`text-lg font-bold font-mono mt-0.5 block ${dueTemplates.length > 0 ? 'text-amber-400' : 'text-emerald-400'}`}>
              {dueTemplates.length} قيد مستحق
            </span>
          </div>

          <div className="bg-slate-800/60 p-3 rounded-xl border border-slate-700/60">
            <span className="text-slate-400 text-[11px] block">الالتزام الشهري المقدر</span>
            <span className="text-lg font-bold text-blue-300 font-mono mt-0.5 block">
              {formatCurrency(totalMonthlyVolume, currency)}
            </span>
          </div>

          <div className="bg-slate-800/60 p-3 rounded-xl border border-slate-700/60">
            <span className="text-slate-400 text-[11px] block">إجمالي القيود المنفذة</span>
            <span className="text-lg font-bold text-purple-300 font-mono mt-0.5 block">
              {recurringTemplates.reduce((sum, t) => sum + (t.executedOccurrences || 0), 0)} دورة
            </span>
          </div>
        </div>
      </div>

      {/* Instant Notification Feedback Banner */}
      {batchExecutionMessage && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl flex items-center justify-between shadow-xs animate-in fade-in">
          <div className="flex items-center gap-2.5 text-xs font-bold">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <span>{batchExecutionMessage}</span>
          </div>
          <button
            onClick={() => setBatchExecutionMessage(null)}
            className="text-emerald-600 hover:text-emerald-900 p-1"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Preset Quick Start Templates */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-800">
            <Sparkles className="w-4 h-4 text-amber-500" />
            <span>نماذج جاهزة سريعة للمصاريف الثابتة الأكثر استخداماً:</span>
          </div>
          <span className="text-[11px] text-slate-400">انقر على أي نموذج لإنشاء قالبه بضغطة زر</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
          {PRESET_EXPENSE_TEMPLATES.map((preset, idx) => (
            <button
              key={idx}
              onClick={() => handleOpenCreateModal(preset)}
              className="text-right p-3 rounded-xl border border-slate-200 hover:border-blue-400 bg-slate-50 hover:bg-blue-50/50 transition group flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="font-mono text-[10px] font-bold text-blue-700 bg-white px-2 py-0.5 rounded border border-slate-200">
                    {preset.templateCode}
                  </span>
                  <span className="text-[10px] text-slate-500">{preset.frequency === 'MONTHLY' ? 'شهري' : preset.frequency}</span>
                </div>
                <h4 className="text-xs font-bold text-slate-800 group-hover:text-blue-700 transition">
                  {preset.templateName}
                </h4>
                <p className="text-[11px] text-slate-500 mt-1 line-clamp-1">{preset.description}</p>
              </div>
              <div className="mt-2.5 pt-2 border-t border-slate-200 flex items-center justify-between text-[11px]">
                <span className="font-bold font-mono text-slate-700">
                  {formatCurrency(preset.totalDebit || 0, preset.currency || 'YER')}
                </span>
                <span className="text-blue-600 font-bold group-hover:translate-x-[-2px] transition flex items-center gap-0.5 text-[10px]">
                  <span>تطبيق</span>
                  <ArrowRight className="w-3 h-3" />
                </span>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute right-3 top-2.5" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="ابحث برمز القالب أو الاسم أو الشرح..."
            className="w-full bg-slate-50 border border-slate-200 rounded-lg pr-9 pl-3 py-1.5 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
          {/* Category Filter */}
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-xs font-semibold text-slate-700 outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="ALL">كافة التصنيفات</option>
            {Object.keys(RECURRING_CATEGORIES_CONFIG).map((cat) => (
              <option key={cat} value={cat}>
                {RECURRING_CATEGORIES_CONFIG[cat as RecurringCategory].labelAr}
              </option>
            ))}
          </select>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-xs font-semibold text-slate-700 outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="ALL">كافة الحالات</option>
            <option value="ACTIVE">نشط (Active)</option>
            <option value="PAUSED">موقوف مؤقتاً (Paused)</option>
            <option value="COMPLETED">مكتمل (Completed)</option>
          </select>
        </div>
      </div>

      {/* Templates Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredTemplates.map((template) => {
          const isDue = template.status === 'ACTIVE' && template.nextRunDate <= todayStr;
          const catConfig =
            RECURRING_CATEGORIES_CONFIG[template.category] || RECURRING_CATEGORIES_CONFIG.OTHER;
          const freqLabel =
            RECURRING_FREQUENCIES_CONFIG[template.frequency]?.labelAr || template.frequency;

          const progressPercent = template.totalOccurrences
            ? Math.min(100, Math.round(((template.executedOccurrences || 0) / template.totalOccurrences) * 100))
            : null;

          return (
            <div
              key={template.id}
              className={`bg-white border rounded-2xl p-5 shadow-2xs hover:shadow-md transition relative flex flex-col justify-between ${
                isDue ? 'border-amber-300 ring-1 ring-amber-300' : 'border-slate-200'
              }`}
            >
              <div>
                {/* Header info */}
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div>
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span className="font-mono text-xs font-bold text-slate-900 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                        {template.templateCode}
                      </span>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${catConfig.color}`}
                      >
                        {catConfig.labelAr}
                      </span>
                      {isDue && (
                        <span className="bg-amber-100 text-amber-800 border border-amber-300 text-[10px] font-bold px-2 py-0.5 rounded-md animate-pulse">
                          مستحق اليوم للترحيل
                        </span>
                      )}
                    </div>
                    <h3 className="text-sm font-bold text-slate-900 mt-1">{template.templateName}</h3>
                  </div>

                  {/* Status Badge */}
                  <span
                    className={`text-[10px] font-bold px-2.5 py-1 rounded-full shrink-0 ${
                      template.status === 'ACTIVE'
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        : template.status === 'PAUSED'
                        ? 'bg-amber-50 text-amber-700 border border-amber-200'
                        : 'bg-slate-100 text-slate-600 border border-slate-200'
                    }`}
                  >
                    {template.status === 'ACTIVE'
                      ? 'نشط ومجدول'
                      : template.status === 'PAUSED'
                      ? 'موقوف مؤقتاً'
                      : 'مكتمل الدورات'}
                  </span>
                </div>

                <p className="text-xs text-slate-600 mb-3">{template.description}</p>

                {/* Timing & Scheduling Details */}
                <div className="bg-slate-50 rounded-xl p-3 border border-slate-100 space-y-2 text-xs mb-3">
                  <div className="flex items-center justify-between text-slate-600">
                    <span className="flex items-center gap-1 text-slate-500">
                      <Clock className="w-3.5 h-3.5 text-blue-500" />
                      <span>دورة التكرار:</span>
                    </span>
                    <span className="font-bold text-slate-800">{freqLabel}</span>
                  </div>

                  <div className="flex items-center justify-between text-slate-600">
                    <span className="flex items-center gap-1 text-slate-500">
                      <Calendar className="w-3.5 h-3.5 text-purple-500" />
                      <span>تاريخ الترحيل القادم:</span>
                    </span>
                    <span className="font-mono font-bold text-blue-700">{template.nextRunDate}</span>
                  </div>

                  {template.lastRunDate && (
                    <div className="flex items-center justify-between text-[11px] text-slate-500">
                      <span>آخر قيد مرحل:</span>
                      <span className="font-mono">{template.lastRunDate}</span>
                    </div>
                  )}

                  {/* Execution Progress */}
                  <div className="pt-2 border-t border-slate-200/60">
                    <div className="flex items-center justify-between text-[11px] mb-1">
                      <span className="text-slate-500">سجل الترحيل:</span>
                      <span className="font-bold text-slate-700">
                        {template.executedOccurrences || 0}
                        {template.totalOccurrences ? ` من إجمالي ${template.totalOccurrences} قيد` : ' قيد (تكرار مستمر)'}
                      </span>
                    </div>
                    {progressPercent !== null && (
                      <div className="w-full bg-slate-200 rounded-full h-1.5 overflow-hidden">
                        <div
                          className="bg-blue-600 h-1.5 rounded-full"
                          style={{ width: `${progressPercent}%` }}
                        ></div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Journal lines summary */}
                <div className="bg-white border border-slate-200 rounded-xl p-2.5 space-y-1 text-xs mb-4">
                  {template.lines.map((line, idx) => (
                    <div key={idx} className="flex items-center justify-between text-[11px]">
                      <div className="flex items-center gap-1 text-slate-700 truncate max-w-[65%]">
                        <span className="font-mono text-slate-400">[{line.accountCode}]</span>
                        <span className="truncate">{line.accountName}</span>
                      </div>
                      <span
                        className={`font-mono font-bold ${
                          line.debit > 0 ? 'text-emerald-600' : 'text-rose-600'
                        }`}
                      >
                        {line.debit > 0 ? `مدين: ${line.debit.toLocaleString()}` : `دائن: ${line.credit.toLocaleString()}`}
                      </span>
                    </div>
                  ))}
                  <div className="pt-1.5 mt-1 border-t border-slate-100 flex items-center justify-between font-bold text-xs">
                    <span className="text-slate-500">المبلغ المتوازن:</span>
                    <span className="font-mono text-blue-700">
                      {formatCurrency(template.totalDebit, template.currency)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => handleToggleStatus(template)}
                    className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg transition text-xs"
                    title={template.status === 'ACTIVE' ? 'إيقاف مؤقت' : 'تنشيط'}
                  >
                    {template.status === 'ACTIVE' ? (
                      <PauseCircle className="w-4 h-4 text-amber-600" />
                    ) : (
                      <Play className="w-4 h-4 text-emerald-600" />
                    )}
                  </button>

                  <button
                    onClick={() => handleOpenEditModal(template)}
                    className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg transition"
                    title="تعديل القالب"
                  >
                    <Edit3 className="w-4 h-4" />
                  </button>

                  <button
                    onClick={() => handleDeleteTemplate(template.id)}
                    className="p-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-lg transition"
                    title="حذف القالب"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                <button
                  onClick={() => {
                    setExecutingTemplate(template);
                    setExecutionDate(template.nextRunDate || todayStr);
                  }}
                  className="flex items-center gap-1.5 px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold text-xs shadow-xs transition"
                >
                  <Play className="w-3.5 h-3.5 fill-current" />
                  <span>توليد وترحيل القيد الآن</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Confirmation & Date Selection Modal for Executing Single Template */}
      {executingTemplate && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden border border-slate-200 text-right">
            <div className="bg-slate-900 p-5 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Play className="w-5 h-5 text-emerald-400 fill-current" />
                <h3 className="font-bold text-sm">تأكيد ترحيل القيد المتكرر للأستاذ العام</h3>
              </div>
              <button
                onClick={() => setExecutingTemplate(null)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-4 text-xs">
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl">
                <div className="font-bold text-blue-900 text-sm mb-1">
                  {executingTemplate.templateName}
                </div>
                <div className="text-slate-600 font-mono text-[11px]">
                  رمز القالب: {executingTemplate.templateCode} | الدورة رقم:{' '}
                  {(executingTemplate.executedOccurrences || 0) + 1}
                </div>
                <div className="text-xs text-slate-700 mt-2 font-bold">
                  المبلغ المتوازن:{' '}
                  <span className="font-mono text-emerald-700">
                    {formatCurrency(executingTemplate.totalDebit, executingTemplate.currency)}
                  </span>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1.5">
                  تاريخ ترحيل القيد المحاسبي (Posting Date):
                </label>
                <input
                  type="date"
                  value={executionDate}
                  onChange={(e) => setExecutionDate(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl font-mono text-xs outline-none focus:ring-2 focus:ring-blue-500 font-bold"
                  required
                />
              </div>

              <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-800 text-[11px] leading-relaxed">
                سيقوم النظام بإنشاء قيد يومية متوازن معتمد وترحيله فوراً في سجل الأستاذ العام وتحديث موعد القيد القادم تلقائياً.
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setExecutingTemplate(null)}
                  className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-xl font-semibold"
                >
                  إلغاء
                </button>
                <button
                  type="button"
                  onClick={() => handleExecuteSingleNow(executingTemplate, executionDate)}
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold shadow-xs flex items-center gap-1.5"
                >
                  <Check className="w-4 h-4" />
                  <span>تأكيد الترحيل الآن</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* CREATE / EDIT TEMPLATE MODAL */}
      {isFormModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-3xl rounded-2xl shadow-2xl overflow-hidden border border-slate-200 text-right max-h-[90vh] flex flex-col">
            <div className="bg-slate-900 p-5 text-white flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2">
                {editingTemplate ? <Edit3 className="w-5 h-5 text-blue-400" /> : <Plus className="w-5 h-5 text-blue-400" />}
                <h3 className="font-bold text-sm">
                  {editingTemplate
                    ? `تعديل قالب القيد المتكرر: ${editingTemplate.templateName}`
                    : 'إنشاء قالب قيد يومية متكرر جديد (SAP FBD1)'}
                </h3>
              </div>
              <button onClick={() => setIsFormModalOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveTemplate} className="p-6 space-y-4 overflow-y-auto text-xs">
              {/* Row 1: Code & Name */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">رمز القالب (Code) *</label>
                  <input
                    type="text"
                    value={formCode}
                    onChange={(e) => setFormCode(e.target.value)}
                    placeholder="REC-RENT-01"
                    className="w-full p-2 bg-slate-50 border border-slate-300 rounded-xl font-mono text-xs outline-none focus:ring-2 focus:ring-blue-500 font-bold"
                    required
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block font-bold text-slate-700 mb-1">اسم القالب والبيان الرئيسي *</label>
                  <input
                    type="text"
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    placeholder="مثال: إيجار المقر الرئيسي - صنعاء"
                    className="w-full p-2 bg-slate-50 border border-slate-300 rounded-xl text-xs outline-none focus:ring-2 focus:ring-blue-500 font-bold"
                    required
                  />
                </div>
              </div>

              {/* Row 2: Category & Frequency & Day */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">تصنيف المصروف</label>
                  <select
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value as RecurringCategory)}
                    className="w-full p-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {Object.keys(RECURRING_CATEGORIES_CONFIG).map((cat) => (
                      <option key={cat} value={cat}>
                        {RECURRING_CATEGORIES_CONFIG[cat as RecurringCategory].labelAr}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">دورة التكرار (Frequency)</label>
                  <select
                    value={formFrequency}
                    onChange={(e) => setFormFrequency(e.target.value as RecurringFrequency)}
                    className="w-full p-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {Object.keys(RECURRING_FREQUENCIES_CONFIG).map((freq) => (
                      <option key={freq} value={freq}>
                        {RECURRING_FREQUENCIES_CONFIG[freq as RecurringFrequency].labelAr}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">يوم الترحيل في الشهر</label>
                  <input
                    type="number"
                    min="1"
                    max="31"
                    value={formDayOfMonth}
                    onChange={(e) => setFormDayOfMonth(Number(e.target.value) || 1)}
                    placeholder="1"
                    className="w-full p-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-mono font-bold outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* Row 3: Dates & Max Occurrences */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">تاريخ البدء *</label>
                  <input
                    type="date"
                    value={formStartDate}
                    onChange={(e) => setFormStartDate(e.target.value)}
                    className="w-full p-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-mono outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">تاريخ الانتهاء (اختياري)</label>
                  <input
                    type="date"
                    value={formEndDate}
                    onChange={(e) => setFormEndDate(e.target.value)}
                    className="w-full p-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-mono outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">إجمالي عدد الأقساط (اختياري)</label>
                  <input
                    type="number"
                    min="1"
                    value={formTotalOccurrences}
                    onChange={(e) => setFormTotalOccurrences(e.target.value)}
                    placeholder="مثلاً 12 شهر أو فارغ لمستمر"
                    className="w-full p-2 bg-slate-50 border border-slate-300 rounded-xl text-xs outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* Lines Table */}
              <div className="border border-slate-200 rounded-xl overflow-hidden bg-white shadow-2xs">
                <div className="p-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
                  <span className="font-bold text-slate-800 text-xs">أطراف القيد المحاسبي (مدين / دائن):</span>
                  <button
                    type="button"
                    onClick={handleAddFormLine}
                    className="flex items-center gap-1 text-[11px] font-bold text-blue-600 hover:text-blue-700 bg-white border border-blue-200 px-2.5 py-1 rounded-lg shadow-2xs"
                  >
                    <Plus className="w-3 h-3" />
                    <span>إضافة سطر</span>
                  </button>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-right text-xs">
                    <thead className="bg-slate-100 text-slate-600 font-semibold border-b border-slate-200">
                      <tr>
                        <th className="p-2.5 min-w-[200px]">الحساب</th>
                        <th className="p-2.5 min-w-[120px]">مدين</th>
                        <th className="p-2.5 min-w-[120px]">دائن</th>
                        <th className="p-2.5 min-w-[140px]">مركز التكلفة</th>
                        <th className="p-2.5 min-w-[160px]">البيان الجزئي</th>
                        <th className="p-2.5 w-10 text-center">حذف</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {formLines.map((line, idx) => (
                        <tr key={line.id} className="hover:bg-slate-50/70">
                          <td className="p-2">
                            <select
                              value={line.accountCode}
                              onChange={(e) => handleFormLineChange(idx, 'accountCode', e.target.value)}
                              className="w-full bg-white border border-slate-200 rounded-lg px-2 py-1 text-xs text-slate-800 font-semibold"
                            >
                              {accounts
                                .filter((a) => a.level >= 2)
                                .map((acc) => (
                                  <option key={acc.code} value={acc.code}>
                                    {acc.code} - {acc.nameAr}
                                  </option>
                                ))}
                            </select>
                          </td>

                          <td className="p-2">
                            <input
                              type="number"
                              min="0"
                              step="any"
                              value={line.debit === 0 ? '' : line.debit}
                              onChange={(e) => {
                                const val = parseFloat(e.target.value) || 0;
                                handleFormLineChange(idx, 'debit', val);
                                if (val > 0) handleFormLineChange(idx, 'credit', 0);
                              }}
                              placeholder="0.00"
                              className="w-full bg-white border border-slate-200 rounded-lg px-2 py-1 text-xs text-emerald-600 font-mono font-bold text-left"
                            />
                          </td>

                          <td className="p-2">
                            <input
                              type="number"
                              min="0"
                              step="any"
                              value={line.credit === 0 ? '' : line.credit}
                              onChange={(e) => {
                                const val = parseFloat(e.target.value) || 0;
                                handleFormLineChange(idx, 'credit', val);
                                if (val > 0) handleFormLineChange(idx, 'debit', 0);
                              }}
                              placeholder="0.00"
                              className="w-full bg-white border border-slate-200 rounded-lg px-2 py-1 text-xs text-rose-600 font-mono font-bold text-left"
                            />
                          </td>

                          <td className="p-2">
                            <select
                              value={line.costCenterId || ''}
                              onChange={(e) => handleFormLineChange(idx, 'costCenterId', e.target.value)}
                              className="w-full bg-white border border-slate-200 rounded-lg px-2 py-1 text-xs text-slate-700"
                            >
                              <option value="">بدون مركز تكلفة</option>
                              {costCenters.map((cc) => (
                                <option key={cc.id} value={cc.id}>
                                  {cc.nameAr}
                                </option>
                              ))}
                            </select>
                          </td>

                          <td className="p-2">
                            <input
                              type="text"
                              value={line.description}
                              onChange={(e) => handleFormLineChange(idx, 'description', e.target.value)}
                              placeholder="شرح البند..."
                              className="w-full bg-white border border-slate-200 rounded-lg px-2 py-1 text-xs"
                            />
                          </td>

                          <td className="p-2 text-center">
                            <button
                              type="button"
                              onClick={() => handleRemoveFormLine(idx)}
                              className="text-slate-400 hover:text-rose-600 p-1"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Balance footer */}
                <div className="p-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-4">
                    <span className="text-emerald-700 font-bold">
                      إجمالي المدين: {formTotalDebit.toLocaleString()} {formCurrency}
                    </span>
                    <span className="text-rose-700 font-bold">
                      إجمالي الدائن: {formTotalCredit.toLocaleString()} {formCurrency}
                    </span>
                  </div>

                  <div>
                    {formIsBalanced ? (
                      <span className="text-emerald-700 font-bold bg-emerald-100 px-2.5 py-0.5 rounded-md">
                        متوازن ✓
                      </span>
                    ) : (
                      <span className="text-rose-700 font-bold bg-rose-100 px-2.5 py-0.5 rounded-md">
                        غير متوازن (الفارق: {Math.abs(formTotalDebit - formTotalCredit).toLocaleString()})
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">ملاحظات وشروط العقد</label>
                <textarea
                  value={formNotes}
                  onChange={(e) => setFormNotes(e.target.value)}
                  rows={2}
                  placeholder="مثال: رقم عقد الإيجار، الحساب البنكي للمستفيد، تفاصيل أخرى..."
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs outline-none focus:ring-2 focus:ring-blue-500"
                ></textarea>
              </div>

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsFormModalOpen(false)}
                  className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-xl font-semibold text-xs"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  disabled={!formIsBalanced}
                  className="px-6 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-xl font-bold text-xs shadow-md"
                >
                  {editingTemplate ? 'حفظ التعديلات' : 'اعتماد وحفظ القالب المتكرر'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
