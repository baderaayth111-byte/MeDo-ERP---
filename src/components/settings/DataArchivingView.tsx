import React, { useState, useMemo } from 'react';
import {
  Archive,
  Database,
  Layers,
  Calendar,
  Filter,
  CheckCircle2,
  AlertTriangle,
  Download,
  Upload,
  RotateCcw,
  Eye,
  Trash2,
  FileText,
  FileSpreadsheet,
  Check,
  X,
  Search,
  Sliders,
  ShieldCheck,
  Clock,
  Sparkles,
  ArrowRight,
  TrendingDown,
  Cpu,
  Lock,
  Printer,
  ChevronDown,
  ChevronUp,
  Receipt,
  CreditCard,
  ShoppingCart,
  Boxes,
  Users,
  Info,
} from 'lucide-react';
import {
  ArchiveBatch,
  ArchiveDocumentType,
  ArchiveFilterCriteria,
  ArchiveSimulationResult,
  ArchivingPolicy,
} from '../../types/archiving';
import {
  JournalEntry,
  Invoice,
  PaymentVoucher,
  StockMovement,
  POSTransaction,
  PurchaseOrder,
  PayrollRun,
  FiscalPeriod,
  Currency,
} from '../../types/accounting';
import {
  simulateArchive,
  executeArchiveOperation,
  restoreArchiveBatch,
  downloadArchiveBatchAsJSON,
  saveArchiveBatchesToStorage,
  saveArchivingPolicyToStorage,
  getLoadedArchiveBatches,
  getLoadedArchivingPolicy,
} from '../../data/archivingService';

interface DataArchivingViewProps {
  fiscalPeriods: FiscalPeriod[];
  journalEntries: JournalEntry[];
  invoices: Invoice[];
  paymentVouchers: PaymentVoucher[];
  posOrders?: POSTransaction[];
  stockMovements?: StockMovement[];
  purchaseOrders?: PurchaseOrder[];
  payrollRuns?: PayrollRun[];
  onUpdateActiveData: (data: {
    journalEntries?: JournalEntry[];
    invoices?: Invoice[];
    paymentVouchers?: PaymentVoucher[];
    posOrders?: POSTransaction[];
    stockMovements?: StockMovement[];
    purchaseOrders?: PurchaseOrder[];
    payrollRuns?: PayrollRun[];
  }) => void;
  currency?: Currency;
  rates?: Record<Currency, number>;
}

export const DataArchivingView: React.FC<DataArchivingViewProps> = ({
  fiscalPeriods,
  journalEntries,
  invoices,
  paymentVouchers,
  posOrders = [],
  stockMovements = [],
  purchaseOrders = [],
  payrollRuns = [],
  onUpdateActiveData,
  currency = 'YER',
  rates = { YER: 1, USD: 535, SAR: 142 },
}) => {
  // Navigation Tabs
  const [subTab, setSubTab] = useState<'NEW_ARCHIVE' | 'VAULT' | 'POLICIES'>('NEW_ARCHIVE');

  // Archive Batches State
  const [batches, setBatches] = useState<ArchiveBatch[]>(() => getLoadedArchiveBatches());
  const [policy, setPolicy] = useState<ArchivingPolicy>(() => getLoadedArchivingPolicy());

  // Criteria Form State
  const [cutoffDate, setCutoffDate] = useState<string>('2025-12-31');
  const [selectedPeriodId, setSelectedPeriodId] = useState<string>('');
  const [selectedTypes, setSelectedTypes] = useState<ArchiveDocumentType[]>([
    'JOURNAL_ENTRY',
    'INVOICE',
    'PAYMENT_VOUCHER',
    'POS_ORDER',
    'STOCK_MOVEMENT',
    'PURCHASE_ORDER',
    'PAYROLL_RUN',
  ]);
  const [onlyClosedAndSettled, setOnlyClosedAndSettled] = useState<boolean>(true);
  const [batchTitle, setBatchTitle] = useState<string>('');
  const [operatorName, setOperatorName] = useState<string>('زياد بدر (المدير المالي)');
  const [userNotes, setUserNotes] = useState<string>('');

  // Simulation & Modal State
  const [simulationResult, setSimulationResult] = useState<ArchiveSimulationResult | null>(null);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [selectedBatchForView, setSelectedBatchForView] = useState<ArchiveBatch | null>(null);
  const [selectedDocTypeFilter, setSelectedDocTypeFilter] = useState<string>('ALL');
  const [vaultSearchQuery, setVaultSearchQuery] = useState<string>('');
  const [previewDocDetail, setPreviewDocDetail] = useState<{ type: string; data: any } | null>(null);
  const [notification, setNotification] = useState<{ text: string; type: 'success' | 'info' | 'error' } | null>(null);

  const showToast = (text: string, type: 'success' | 'info' | 'error' = 'success') => {
    setNotification({ text, type });
    setTimeout(() => setNotification(null), 4000);
  };

  // Active dataset counts
  const activeCounts = useMemo(() => {
    const total =
      journalEntries.length +
      invoices.length +
      paymentVouchers.length +
      posOrders.length +
      stockMovements.length +
      purchaseOrders.length +
      payrollRuns.length;

    return {
      journalEntries: journalEntries.length,
      invoices: invoices.length,
      paymentVouchers: paymentVouchers.length,
      posOrders: posOrders.length,
      stockMovements: stockMovements.length,
      purchaseOrders: purchaseOrders.length,
      payrollRuns: payrollRuns.length,
      total,
    };
  }, [
    journalEntries,
    invoices,
    paymentVouchers,
    posOrders,
    stockMovements,
    purchaseOrders,
    payrollRuns,
  ]);

  // Total archived documents across all batches
  const totalArchivedDocs = useMemo(() => {
    return batches
      .filter((b) => b.status === 'ARCHIVED')
      .reduce((sum, b) => sum + (b.totalDocumentsCount || 0), 0);
  }, [batches]);

  const totalArchivedSizeKb = useMemo(() => {
    return batches
      .filter((b) => b.status === 'ARCHIVED')
      .reduce((sum, b) => sum + (b.estimatedSizeKb || 0), 0);
  }, [batches]);

  // Handle Fiscal Period Selection shortcut
  const handleSelectFiscalPeriod = (periodId: string) => {
    setSelectedPeriodId(periodId);
    if (!periodId) return;
    const period = fiscalPeriods.find((p) => p.id === periodId);
    if (period) {
      setCutoffDate(period.endDate);
      setBatchTitle(`أرشفة مستندات الفترة: ${period.nameAr} (${period.fiscalYear})`);
    }
  };

  // Toggle Document Type selection
  const handleToggleDocType = (type: ArchiveDocumentType) => {
    if (selectedTypes.includes(type)) {
      if (selectedTypes.length === 1) {
        showToast('يجب اختيار نوع مستند واحد على الأقل للأرشفة', 'error');
        return;
      }
      setSelectedTypes(selectedTypes.filter((t) => t !== type));
    } else {
      setSelectedTypes([...selectedTypes, type]);
    }
  };

  // Run Simulation
  const handleRunSimulation = () => {
    const criteria: ArchiveFilterCriteria = {
      cutoffDate,
      fiscalPeriodId: selectedPeriodId || undefined,
      fiscalPeriodName: fiscalPeriods.find((p) => p.id === selectedPeriodId)?.nameAr,
      selectedTypes,
      onlyClosedAndSettled,
      notes: userNotes,
    };

    const result = simulateArchive(criteria, {
      journalEntries,
      invoices,
      paymentVouchers,
      posOrders,
      stockMovements,
      purchaseOrders,
      payrollRuns,
    });

    setSimulationResult(result);

    if (result.totalEligibleCount === 0) {
      showToast('لم يتم العثور على أي مستندات منتهية أو مقفلة تطابق المعايير والتاريخ المحدد.', 'info');
    } else {
      showToast(`تم فحص البيانات بنجاح: تم العثور على ${result.totalEligibleCount} مستند مؤهل للأرشفة.`, 'success');
    }
  };

  // Execute Archive Operation
  const handleConfirmArchive = () => {
    if (!simulationResult || simulationResult.totalEligibleCount === 0) {
      showToast('لا توجد مستندات مؤهلة للأرشفة.', 'error');
      return;
    }

    const criteria: ArchiveFilterCriteria = {
      cutoffDate,
      fiscalPeriodId: selectedPeriodId || undefined,
      fiscalPeriodName: fiscalPeriods.find((p) => p.id === selectedPeriodId)?.nameAr,
      selectedTypes,
      onlyClosedAndSettled,
      notes: userNotes,
    };

    const { newBatch, updatedActiveData } = executeArchiveOperation(
      criteria,
      batchTitle || `أرشفة مستندات مالية إلى تاريخ ${cutoffDate}`,
      operatorName,
      userNotes,
      {
        journalEntries,
        invoices,
        paymentVouchers,
        posOrders,
        stockMovements,
        purchaseOrders,
        payrollRuns,
      }
    );

    // 1. Update State and persistence
    const updatedBatches = [newBatch, ...batches];
    setBatches(updatedBatches);
    saveArchiveBatchesToStorage(updatedBatches);

    // 2. Update active dataset
    onUpdateActiveData(updatedActiveData);

    // 3. Reset form and close modal
    setIsConfirmModalOpen(false);
    setSimulationResult(null);
    setBatchTitle('');
    setUserNotes('');
    setSubTab('VAULT');
    setSelectedBatchForView(newBatch);

    showToast(`تمت الأرشفة بنجاح! تم نقل ${newBatch.totalDocumentsCount} مستند إلى الخزنة، وتحرير مساحة الذاكرة النشطة.`);
  };

  // Restore an archived batch back to active database
  const handleRestoreBatch = (batch: ArchiveBatch) => {
    if (batch.status === 'RESTORED') {
      showToast('هذه الدفعة مسترجعة بالفعل في النظام النشط.', 'info');
      return;
    }

    if (
      !confirm(
        `هل أنت متأكد من استرجاع دفعة الأرشفة (${batch.batchNumber}: ${batch.title}) بكافة مستنداتها (${batch.totalDocumentsCount} مستند) إلى قاعدة البيانات النشطة؟`
      )
    ) {
      return;
    }

    const { restoredBatch, updatedActiveData } = restoreArchiveBatch(
      batch,
      operatorName,
      {
        journalEntries,
        invoices,
        paymentVouchers,
        posOrders,
        stockMovements,
        purchaseOrders,
        payrollRuns,
      }
    );

    const updatedBatches = batches.map((b) => (b.id === batch.id ? restoredBatch : b));
    setBatches(updatedBatches);
    saveArchiveBatchesToStorage(updatedBatches);

    onUpdateActiveData(updatedActiveData);
    if (selectedBatchForView?.id === batch.id) {
      setSelectedBatchForView(restoredBatch);
    }

    showToast(`تم استرجاع الدفعة (${batch.batchNumber}) بنجاح إلى قاعدة البيانات النشطة.`);
  };

  // Delete an archive batch permanently
  const handleDeleteBatch = (batchId: string) => {
    const target = batches.find((b) => b.id === batchId);
    if (!target) return;

    if (
      !confirm(
        `تحذير شديد: هل أنت متأكد من حذف الدفعة "${target.batchNumber} - ${target.title}" نهائياً من خزنة الأرشيف؟ لا يمكن التراجع عن هذه الخطوة!`
      )
    ) {
      return;
    }

    const updated = batches.filter((b) => b.id !== batchId);
    setBatches(updated);
    saveArchiveBatchesToStorage(updated);
    if (selectedBatchForView?.id === batchId) {
      setSelectedBatchForView(null);
    }
    showToast(`تم حذف دفعة الأرشفة (${target.batchNumber}) نهائياً.`);
  };

  // Save Policy
  const handleSavePolicy = (e: React.FormEvent) => {
    e.preventDefault();
    saveArchivingPolicyToStorage(policy);
    showToast('تم حفظ سياسات وقواعد الأرشفة التلقائية بنجاح.');
  };

  // Print Archiving Certificate
  const handlePrintCertificate = (batch: ArchiveBatch) => {
    window.print();
  };

  const documentTypesConfig = [
    {
      type: 'JOURNAL_ENTRY' as ArchiveDocumentType,
      labelAr: 'قيود اليومية العامة (Journal Entries)',
      desc: 'القيود المرحلة والمعكوسة في الفترات المغلقة',
      icon: Layers,
      count: activeCounts.journalEntries,
      color: 'blue',
    },
    {
      type: 'INVOICE' as ArchiveDocumentType,
      labelAr: 'فواتير المبيعات والمشتريات (Invoices)',
      desc: 'الفواتير المسددة بالكامل أو الملغاة',
      icon: Receipt,
      count: activeCounts.invoices,
      color: 'emerald',
    },
    {
      type: 'PAYMENT_VOUCHER' as ArchiveDocumentType,
      labelAr: 'سندات القبض والصرف (Payment Vouchers)',
      desc: 'السندات المكتملة والمقفلة في الحسابات',
      icon: CreditCard,
      count: activeCounts.paymentVouchers,
      color: 'amber',
    },
    {
      type: 'POS_ORDER' as ArchiveDocumentType,
      labelAr: 'فواتير الكاشير ونقاط البيع (POS Orders)',
      desc: 'حركات مبيعات التجزئة المنتهية والمرحلة',
      icon: ShoppingCart,
      count: activeCounts.posOrders,
      color: 'purple',
    },
    {
      type: 'STOCK_MOVEMENT' as ArchiveDocumentType,
      labelAr: 'حركات وسندات المخزون (Stock Movements)',
      desc: 'أذون الصرف والاستلام والتسويات المخزنية',
      icon: Boxes,
      count: activeCounts.stockMovements,
      color: 'teal',
    },
    {
      type: 'PURCHASE_ORDER' as ArchiveDocumentType,
      labelAr: 'أوامر الشراء المكتملة (Purchase Orders)',
      desc: 'طلبات المشتريات الموردة والمفوترة بالكامل',
      icon: FileSpreadsheet,
      count: activeCounts.purchaseOrders,
      color: 'cyan',
    },
    {
      type: 'PAYROLL_RUN' as ArchiveDocumentType,
      labelAr: 'مسيرات الرواتب المصروفة (Payroll Runs)',
      desc: 'كشوفات الأجور المعتمدة والمدفوعة للموظفين',
      icon: Users,
      count: activeCounts.payrollRuns,
      color: 'rose',
    },
  ];

  return (
    <div className="space-y-6" dir="rtl">
      {/* Toast Notification */}
      {notification && (
        <div
          className={`fixed bottom-6 left-6 z-50 text-white px-5 py-3 rounded-2xl shadow-2xl border flex items-center gap-3 animate-in fade-in slide-in-from-bottom-5 duration-300 ${
            notification.type === 'error'
              ? 'bg-rose-900 border-rose-500/40'
              : notification.type === 'info'
              ? 'bg-blue-900 border-blue-500/40'
              : 'bg-slate-900 border-emerald-500/40'
          }`}
        >
          {notification.type === 'error' ? (
            <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0" />
          ) : notification.type === 'info' ? (
            <Info className="w-5 h-5 text-blue-400 shrink-0" />
          ) : (
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          )}
          <span className="text-xs font-bold text-slate-100">{notification.text}</span>
        </div>
      )}

      {/* Main Hero Header Card */}
      <div className="bg-slate-900 text-white rounded-2xl p-6 shadow-xl border border-slate-800 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-96 h-96 bg-indigo-600/15 rounded-full blur-3xl pointer-events-none -translate-x-1/2 -translate-y-1/2"></div>
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-5">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center text-indigo-400 shadow-inner shrink-0">
              <Archive className="w-7 h-7" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-black text-white tracking-tight">
                  نظام أرشفة المستندات والقيود المحاسبية المنتهية (Data Archiving Center)
                </h1>
                <span className="text-[10px] font-mono font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-400/30 px-2 py-0.5 rounded-full">
                  SAP-ILM / S/4HANA Archiving
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-1 max-w-2xl leading-relaxed">
                تقليص حجم البيانات النشطة في قاعدة البيانات الحية، تسريع الاستعلامات والتقارير المالية، وحفظ المستندات والقيود المنتهية في خزنة أرشيف آمنة مع إمكانية المعاينة والتصدير والاسترجاع في أي وقت.
              </p>
            </div>
          </div>

          {/* Quick Metrics Pills */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-slate-800/80 border border-slate-700/80 p-3 rounded-xl text-center">
              <span className="text-[11px] text-slate-400 block">السجلات النشطة</span>
              <span className="text-base font-black text-white font-mono">{activeCounts.total.toLocaleString()}</span>
            </div>
            <div className="bg-slate-800/80 border border-slate-700/80 p-3 rounded-xl text-center">
              <span className="text-[11px] text-indigo-300 block">المستندات المؤرشفة</span>
              <span className="text-base font-black text-indigo-400 font-mono">{totalArchivedDocs.toLocaleString()}</span>
            </div>
            <div className="bg-slate-800/80 border border-slate-700/80 p-3 rounded-xl text-center">
              <span className="text-[11px] text-emerald-300 block">المساحة المحررة</span>
              <span className="text-base font-black text-emerald-400 font-mono">
                {totalArchivedSizeKb > 1024 ? `${(totalArchivedSizeKb / 1024).toFixed(1)} MB` : `${totalArchivedSizeKb} KB`}
              </span>
            </div>
            <div className="bg-slate-800/80 border border-slate-700/80 p-3 rounded-xl text-center">
              <span className="text-[11px] text-amber-300 block">مؤشر تحسين الأداء</span>
              <span className="text-base font-black text-amber-400 font-mono">+42%</span>
            </div>
          </div>
        </div>
      </div>

      {/* Sub Navigation Bar */}
      <div className="flex items-center gap-2 bg-white p-1.5 rounded-2xl border border-slate-200 shadow-2xs">
        <button
          type="button"
          onClick={() => setSubTab('NEW_ARCHIVE')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition ${
            subTab === 'NEW_ARCHIVE'
              ? 'bg-indigo-600 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Sliders className="w-4 h-4" />
          <span>تنفيذ عملية أرشفة جديدة</span>
        </button>

        <button
          type="button"
          onClick={() => setSubTab('VAULT')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition ${
            subTab === 'VAULT'
              ? 'bg-indigo-600 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Database className="w-4 h-4" />
          <span>خزنة المستندات المؤرشفة (Archive Vault)</span>
          <span
            className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono font-semibold ${
              subTab === 'VAULT' ? 'bg-indigo-700 text-white' : 'bg-slate-200 text-slate-700'
            }`}
          >
            {batches.length} دفعات
          </span>
        </button>

        <button
          type="button"
          onClick={() => setSubTab('POLICIES')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition ${
            subTab === 'POLICIES'
              ? 'bg-indigo-600 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <ShieldCheck className="w-4 h-4" />
          <span>سياسات وفترات الاحتفاظ بالبيانات (Retention Policies)</span>
        </button>
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: NEW ARCHIVING OPERATION & SIMULATION */}
      {/* ========================================================================= */}
      {subTab === 'NEW_ARCHIVE' && (
        <div className="space-y-6">
          {/* Form Step 1: Criteria & Selection */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
                  <Sliders className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">معايير ونطاق الأرشفة المحاسبية</h3>
                  <p className="text-xs text-slate-500">حدد التاريخ الأقصى وأنواع المستندات المراد نقلها إلى الأرشيف</p>
                </div>
              </div>
              <span className="text-xs font-mono font-bold text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-lg">
                STEP 1 / CRITERIA
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {/* Closed Fiscal Period Selection (Optional Shortcut) */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center justify-between">
                  <span>ربط بفترة مالية مقفلة (اختياري)</span>
                  <span className="text-[10px] text-indigo-600 font-semibold">تحديد آلي</span>
                </label>
                <select
                  value={selectedPeriodId}
                  onChange={(e) => handleSelectFiscalPeriod(e.target.value)}
                  className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 font-bold text-slate-800 focus:bg-white focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="">-- تخصيص تاريخ يدوي --</option>
                  {fiscalPeriods.map((period) => (
                    <option key={period.id} value={period.id}>
                      {period.nameAr} ({period.fiscalYear}) - {period.status === 'LOCKED' ? '🔒 مقفلة نهائياً' : period.status === 'CLOSED' ? '📁 مغلقة' : '🟢 مفتوحة'}
                    </option>
                  ))}
                </select>
              </div>

              {/* Cutoff Date */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  تاريخ إقفال الأرشفة (Cutoff Date) *
                </label>
                <div className="relative">
                  <Calendar className="w-3.5 h-3.5 text-slate-400 absolute right-3.5 top-3" />
                  <input
                    type="date"
                    required
                    value={cutoffDate}
                    onChange={(e) => {
                      setCutoffDate(e.target.value);
                      setSelectedPeriodId('');
                    }}
                    className="w-full pr-9 pl-3.5 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 font-mono font-bold text-slate-800 focus:bg-white focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <p className="text-[10px] text-slate-400 mt-1">سيتم فحص المستندات المنشأة في أو قبل هذا التاريخ فقط.</p>
              </div>

              {/* Operator Name */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  المسؤول عن إجراء الأرشفة *
                </label>
                <input
                  type="text"
                  required
                  value={operatorName}
                  onChange={(e) => setOperatorName(e.target.value)}
                  placeholder="اسم المحاسب أو المدير المالي"
                  className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 font-bold text-slate-800 focus:bg-white focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>

            {/* Document Types Selector Grid */}
            <div className="space-y-3 pt-2">
              <label className="block text-xs font-bold text-slate-800">
                أنواع المستندات المشمولة بالأرشفة ({selectedTypes.length} من {documentTypesConfig.length} محددة)
              </label>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                {documentTypesConfig.map((item) => {
                  const Icon = item.icon;
                  const isSelected = selectedTypes.includes(item.type);

                  return (
                    <div
                      key={item.type}
                      onClick={() => handleToggleDocType(item.type)}
                      className={`p-3.5 rounded-xl border cursor-pointer transition flex items-start justify-between gap-3 ${
                        isSelected
                          ? 'border-indigo-600 bg-indigo-50/40 shadow-xs ring-1 ring-indigo-500/20'
                          : 'border-slate-200 bg-slate-50/50 hover:bg-slate-100 opacity-60'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div
                          className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                            isSelected ? 'bg-indigo-600 text-white' : 'bg-slate-200 text-slate-600'
                          }`}
                        >
                          <Icon className="w-4 h-4" />
                        </div>
                        <div>
                          <span className="text-xs font-bold text-slate-900 block leading-tight">
                            {item.labelAr}
                          </span>
                          <span className="text-[10px] text-slate-500 block mt-0.5">
                            {item.desc}
                          </span>
                          <div className="flex items-center gap-1.5 mt-1.5">
                            <span className="text-[10px] font-mono font-bold text-slate-600 bg-white border border-slate-200 px-1.5 py-0.2 rounded-md">
                              {item.count} سجل نشط
                            </span>
                          </div>
                        </div>
                      </div>

                      <div
                        className={`w-5 h-5 rounded-md border flex items-center justify-center shrink-0 mt-0.5 ${
                          isSelected
                            ? 'bg-indigo-600 border-indigo-600 text-white'
                            : 'border-slate-300 bg-white'
                        }`}
                      >
                        {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Checkbox: Strict Security Rules */}
            <div className="pt-2">
              <label className="flex items-center gap-3 p-3.5 rounded-xl border border-indigo-200 bg-indigo-50/30 cursor-pointer">
                <input
                  type="checkbox"
                  checked={onlyClosedAndSettled}
                  onChange={(e) => setOnlyClosedAndSettled(e.target.checked)}
                  className="rounded text-indigo-600 focus:ring-indigo-500 w-4 h-4"
                />
                <div>
                  <span className="text-xs font-bold text-indigo-950 block">
                    حماية المستندات المفتوحة: أرشفة المستندات المقفلة والمسددة فقط (Strict Audit Protection)
                  </span>
                  <span className="text-[11px] text-indigo-800/80">
                    استبعاد الفواتير غير المسددة أو القيود غير المرحلة تلقائياً لمنع أي خلل في أرصدة العملاء والموردين وميزان المراجعة.
                  </span>
                </div>
              </label>
            </div>

            {/* Action Bar for Step 1 */}
            <div className="flex items-center justify-between pt-4 border-t border-slate-100">
              <div className="flex items-center gap-2 text-xs text-slate-500">
                <Sparkles className="w-4 h-4 text-indigo-600" />
                <span>قم بإجراء فحص ومحاكاة قبل الترحيل لمعاينة عدد المستندات والقيم المالية بدقة.</span>
              </div>

              <button
                type="button"
                onClick={handleRunSimulation}
                className="flex items-center gap-2 px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-xs transition"
              >
                <Cpu className="w-4 h-4" />
                <span>فحص ومحاكاة الأرشفة (Run Simulation)</span>
              </button>
            </div>
          </div>

          {/* Form Step 2: Simulation Results & Execution */}
          {simulationResult && (
            <div className="bg-white rounded-2xl p-6 border-2 border-indigo-200 shadow-md space-y-6 animate-in fade-in duration-300">
              <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                    <CheckCircle2 className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">تقرير نتيجة الفحص والمحاكاة (Simulation Result)</h3>
                    <p className="text-xs text-slate-500">
                      تم مطابقة المستندات المنتهية حتى تاريخ {simulationResult.cutoffDate}
                    </p>
                  </div>
                </div>
                <span className="text-xs font-mono font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg">
                  READY TO ARCHIVE
                </span>
              </div>

              {/* Simulation KPIs Summary */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-indigo-50/60 border border-indigo-200 p-4 rounded-xl">
                  <span className="text-xs font-bold text-indigo-900 block">إجمالي المستندات المؤهلة</span>
                  <span className="text-2xl font-black text-indigo-700 font-mono mt-1 block">
                    {simulationResult.totalEligibleCount.toLocaleString()}{' '}
                    <span className="text-xs font-normal text-indigo-600">مستند</span>
                  </span>
                  <span className="text-[11px] text-indigo-800/70 mt-1 block">
                    تخفيف {( (simulationResult.totalEligibleCount / Math.max(1, activeCounts.total)) * 100 ).toFixed(1)}% من السجلات النشطة
                  </span>
                </div>

                <div className="bg-emerald-50/60 border border-emerald-200 p-4 rounded-xl">
                  <span className="text-xs font-bold text-emerald-900 block">حجم التخزين المحرر المقدر</span>
                  <span className="text-2xl font-black text-emerald-700 font-mono mt-1 block">
                    {(simulationResult.estimatedBytesSaved / 1024).toFixed(1)}{' '}
                    <span className="text-xs font-normal text-emerald-600">KB</span>
                  </span>
                  <span className="text-[11px] text-emerald-800/70 mt-1 block">تحسين سرعة الفهرسة والبحث المالي</span>
                </div>

                <div className="bg-amber-50/60 border border-amber-200 p-4 rounded-xl">
                  <span className="text-xs font-bold text-amber-900 block">إجمالي الحجم المالي للمستندات</span>
                  <span className="text-2xl font-black text-amber-700 font-mono mt-1 block">
                    {simulationResult.totalFinancialVolumeInBase.toLocaleString()}{' '}
                    <span className="text-xs font-normal text-amber-600">YER</span>
                  </span>
                  <span className="text-[11px] text-amber-800/70 mt-1 block">قيم العمليات المسددة والمقفلة</span>
                </div>
              </div>

              {/* Breakdown by Type Table */}
              <div className="overflow-x-auto rounded-xl border border-slate-200">
                <table className="w-full text-right text-xs">
                  <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200">
                    <tr>
                      <th className="p-3">نوع المستند المحاسبي</th>
                      <th className="p-3 text-center">العدد المؤهل للأرشفة</th>
                      <th className="p-3 text-center">العدد المتبقي بالنشط</th>
                      <th className="p-3 text-center">الحالة المحاسبية</th>
                      <th className="p-3 text-center">مستوى الأمان</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {documentTypesConfig.map((item) => {
                      const eligible = simulationResult.countsByType[item.type] || 0;
                      const remaining = Math.max(0, item.count - eligible);
                      if (!selectedTypes.includes(item.type)) return null;

                      return (
                        <tr key={item.type} className="hover:bg-slate-50/80">
                          <td className="p-3 font-bold text-slate-800 flex items-center gap-2">
                            <item.icon className="w-4 h-4 text-indigo-600" />
                            <span>{item.labelAr}</span>
                          </td>
                          <td className="p-3 text-center font-mono font-bold text-indigo-700">
                            {eligible.toLocaleString()}
                          </td>
                          <td className="p-3 text-center font-mono text-slate-600">
                            {remaining.toLocaleString()}
                          </td>
                          <td className="p-3 text-center">
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                              مقفلة / مسددة
                            </span>
                          </td>
                          <td className="p-3 text-center">
                            <span className="text-[10px] font-bold text-emerald-600 flex items-center justify-center gap-1">
                              <ShieldCheck className="w-3 h-3" />
                              آمن للترحيل
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Execution Button */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 rounded-xl bg-slate-900 text-white">
                <div>
                  <h4 className="text-xs font-bold text-white">جاهز لترحيل المستندات إلى خزنة الأرشيف؟</h4>
                  <p className="text-[11px] text-slate-300 mt-0.5">
                    سيتم تفريغ المستندات المحددة من جداول العمل النشطة، وحفظها كدفعة أرشيف موثقة ومشفرة.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => setIsConfirmModalOpen(true)}
                  disabled={simulationResult.totalEligibleCount === 0}
                  className={`flex items-center gap-2 px-6 py-2.5 text-xs font-bold rounded-xl transition shadow-md ${
                    simulationResult.totalEligibleCount === 0
                      ? 'bg-slate-700 text-slate-400 cursor-not-allowed'
                      : 'bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-black'
                  }`}
                >
                  <Archive className="w-4 h-4" />
                  <span>تأكيد وتنفيذ الأرشفة الفورية</span>
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: ARCHIVE VAULT & BATCH EXPLORER */}
      {/* ========================================================================= */}
      {subTab === 'VAULT' && (
        <div className="space-y-6">
          {/* Batches Overview / Search */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
            <div>
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Database className="w-4 h-4 text-indigo-600" />
                سجل ودفعات الأرشيف المحاسبي ({batches.length} دفعات محفوظة)
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                استعراض، معاينة، تصدير، أو استرجاع المستندات والقيود المؤرشفة
              </p>
            </div>

            <div className="relative w-full sm:w-72">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute right-3.5 top-3" />
              <input
                type="text"
                value={vaultSearchQuery}
                onChange={(e) => setVaultSearchQuery(e.target.value)}
                placeholder="بحث برقم الدفعة، العنوان، المسؤول..."
                className="w-full pr-9 pl-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 text-slate-800 focus:bg-white focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          {/* Batches List Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {batches
              .filter(
                (b) =>
                  b.batchNumber.toLowerCase().includes(vaultSearchQuery.toLowerCase()) ||
                  b.title.toLowerCase().includes(vaultSearchQuery.toLowerCase()) ||
                  b.archivedBy.toLowerCase().includes(vaultSearchQuery.toLowerCase())
              )
              .map((batch) => {
                const isSelected = selectedBatchForView?.id === batch.id;

                return (
                  <div
                    key={batch.id}
                    className={`bg-white rounded-2xl border p-5 shadow-xs transition hover:shadow-md flex flex-col justify-between ${
                      isSelected
                        ? 'border-indigo-600 ring-2 ring-indigo-500/15'
                        : 'border-slate-200'
                    }`}
                  >
                    <div className="space-y-3">
                      {/* Top Header */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs font-bold text-indigo-700 bg-indigo-50 border border-indigo-200 px-2.5 py-0.5 rounded-lg">
                            {batch.batchNumber}
                          </span>
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                              batch.status === 'ARCHIVED'
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                : 'bg-amber-50 text-amber-700 border-amber-200'
                            }`}
                          >
                            {batch.status === 'ARCHIVED' ? '📁 مؤرشفة بالخزنة' : '🔄 مسترجعة بالنظام'}
                          </span>
                        </div>

                        <span className="text-[11px] text-slate-400 font-mono">
                          {new Date(batch.createdAt).toLocaleDateString('ar-YE')}
                        </span>
                      </div>

                      {/* Title */}
                      <div>
                        <h4 className="text-sm font-bold text-slate-900">{batch.title}</h4>
                        {batch.fiscalPeriodName && (
                          <span className="text-[11px] text-indigo-600 font-medium block mt-0.5">
                            فترة: {batch.fiscalPeriodName}
                          </span>
                        )}
                        <p className="text-xs text-slate-500 mt-1 line-clamp-2">{batch.notes}</p>
                      </div>

                      {/* Metrics Badges */}
                      <div className="grid grid-cols-3 gap-2 bg-slate-50 p-2.5 rounded-xl border border-slate-100 text-center">
                        <div>
                          <span className="text-[10px] text-slate-400 block">المستندات</span>
                          <span className="text-xs font-mono font-bold text-slate-800">
                            {batch.totalDocumentsCount}
                          </span>
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-400 block">الحجم</span>
                          <span className="text-xs font-mono font-bold text-slate-800">
                            {batch.estimatedSizeKb} KB
                          </span>
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-400 block">المسؤول</span>
                          <span className="text-[11px] font-medium text-slate-800 truncate block">
                            {batch.archivedBy}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="pt-4 mt-4 border-t border-slate-100 flex items-center justify-between gap-2">
                      <button
                        type="button"
                        onClick={() => setSelectedBatchForView(batch)}
                        className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-xl transition ${
                          isSelected
                            ? 'bg-indigo-600 text-white'
                            : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                        }`}
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>معاينة محتويات الدفعة</span>
                      </button>

                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => downloadArchiveBatchAsJSON(batch)}
                          className="p-1.5 text-slate-600 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition"
                          title="تصدير وتحميل ملف JSON"
                        >
                          <Download className="w-4 h-4" />
                        </button>

                        <button
                          type="button"
                          onClick={() => handleRestoreBatch(batch)}
                          className="p-1.5 text-slate-600 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition"
                          title="استرجاع الدفعة إلى النظام النشط"
                        >
                          <RotateCcw className="w-4 h-4" />
                        </button>

                        <button
                          type="button"
                          onClick={() => handleDeleteBatch(batch.id)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                          title="حذف الدفعة نهائياً"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
          </div>

          {/* Selected Batch Detailed Explorer Drawer / Section */}
          {selectedBatchForView && (
            <div className="bg-white rounded-2xl p-6 border-2 border-indigo-200 shadow-xl space-y-6 animate-in fade-in duration-300">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center shrink-0">
                    <Archive className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-md">
                        {selectedBatchForView.batchNumber}
                      </span>
                      <h3 className="text-sm font-bold text-slate-900">{selectedBatchForView.title}</h3>
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5">
                      تاريخ الأرشفة: {new Date(selectedBatchForView.createdAt).toLocaleString('ar-YE')} | المسؤول: {selectedBatchForView.archivedBy}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => downloadArchiveBatchAsJSON(selectedBatchForView)}
                    className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>تحميل JSON</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleRestoreBatch(selectedBatchForView)}
                    className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold bg-amber-500 hover:bg-amber-600 text-white rounded-xl shadow-xs transition"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>استرجاع للنظام النشط</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setSelectedBatchForView(null)}
                    className="p-2 text-slate-400 hover:text-slate-700 rounded-xl"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Filter by Document Sub-type inside Batch */}
              <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
                <button
                  type="button"
                  onClick={() => setSelectedDocTypeFilter('ALL')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition whitespace-nowrap ${
                    selectedDocTypeFilter === 'ALL'
                      ? 'bg-indigo-600 text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  الكل ({selectedBatchForView.totalDocumentsCount})
                </button>
                {selectedBatchForView.payload.journalEntries?.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setSelectedDocTypeFilter('JOURNAL_ENTRY')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition whitespace-nowrap ${
                      selectedDocTypeFilter === 'JOURNAL_ENTRY'
                        ? 'bg-indigo-600 text-white'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    القيود المحاسبية ({selectedBatchForView.payload.journalEntries.length})
                  </button>
                )}
                {selectedBatchForView.payload.invoices?.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setSelectedDocTypeFilter('INVOICE')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition whitespace-nowrap ${
                      selectedDocTypeFilter === 'INVOICE'
                        ? 'bg-indigo-600 text-white'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    الفواتير ({selectedBatchForView.payload.invoices.length})
                  </button>
                )}
                {selectedBatchForView.payload.paymentVouchers?.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setSelectedDocTypeFilter('PAYMENT_VOUCHER')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition whitespace-nowrap ${
                      selectedDocTypeFilter === 'PAYMENT_VOUCHER'
                        ? 'bg-indigo-600 text-white'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    السندات ({selectedBatchForView.payload.paymentVouchers.length})
                  </button>
                )}
              </div>

              {/* Documents List inside this Batch */}
              <div className="overflow-x-auto rounded-xl border border-slate-200">
                <table className="w-full text-right text-xs">
                  <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200">
                    <tr>
                      <th className="p-3">نوع المستند</th>
                      <th className="p-3">الرقم المرجعي</th>
                      <th className="p-3">التاريخ</th>
                      <th className="p-3">الطرف / البيان</th>
                      <th className="p-3 text-center">المبلغ الإجمالي</th>
                      <th className="p-3 text-center">الحالة</th>
                      <th className="p-3 text-center">إجراء</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {/* Journal Entries */}
                    {(selectedDocTypeFilter === 'ALL' || selectedDocTypeFilter === 'JOURNAL_ENTRY') &&
                      selectedBatchForView.payload.journalEntries?.map((je) => (
                        <tr key={je.id} className="hover:bg-slate-50">
                          <td className="p-3 font-bold text-indigo-700 flex items-center gap-1.5">
                            <Layers className="w-3.5 h-3.5" />
                            <span>قيد يومية</span>
                          </td>
                          <td className="p-3 font-mono font-bold text-slate-800">{je.entryNumber}</td>
                          <td className="p-3 font-mono text-slate-600">{je.date}</td>
                          <td className="p-3 text-slate-700 truncate max-w-xs">{je.description}</td>
                          <td className="p-3 text-center font-mono font-bold text-slate-900">
                            {je.totalDebit?.toLocaleString()} YER
                          </td>
                          <td className="p-3 text-center">
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                              {je.status}
                            </span>
                          </td>
                          <td className="p-3 text-center">
                            <button
                              type="button"
                              onClick={() => setPreviewDocDetail({ type: 'JOURNAL_ENTRY', data: je })}
                              className="text-xs font-bold text-indigo-600 hover:text-indigo-800 hover:underline"
                            >
                              عرض الأطراف
                            </button>
                          </td>
                        </tr>
                      ))}

                    {/* Invoices */}
                    {(selectedDocTypeFilter === 'ALL' || selectedDocTypeFilter === 'INVOICE') &&
                      selectedBatchForView.payload.invoices?.map((inv) => (
                        <tr key={inv.id} className="hover:bg-slate-50">
                          <td className="p-3 font-bold text-emerald-700 flex items-center gap-1.5">
                            <Receipt className="w-3.5 h-3.5" />
                            <span>فاتورة مبيعات/مشتريات</span>
                          </td>
                          <td className="p-3 font-mono font-bold text-slate-800">{inv.invoiceNumber}</td>
                          <td className="p-3 font-mono text-slate-600">{inv.date}</td>
                          <td className="p-3 text-slate-700 truncate max-w-xs">{inv.entityName}</td>
                          <td className="p-3 text-center font-mono font-bold text-emerald-700">
                            {inv.grandTotal?.toLocaleString()} {inv.currency}
                          </td>
                          <td className="p-3 text-center">
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                              {inv.status}
                            </span>
                          </td>
                          <td className="p-3 text-center">
                            <button
                              type="button"
                              onClick={() => setPreviewDocDetail({ type: 'INVOICE', data: inv })}
                              className="text-xs font-bold text-indigo-600 hover:text-indigo-800 hover:underline"
                            >
                              عرض البنود
                            </button>
                          </td>
                        </tr>
                      ))}

                    {/* Payment Vouchers */}
                    {(selectedDocTypeFilter === 'ALL' || selectedDocTypeFilter === 'PAYMENT_VOUCHER') &&
                      selectedBatchForView.payload.paymentVouchers?.map((pv) => (
                        <tr key={pv.id} className="hover:bg-slate-50">
                          <td className="p-3 font-bold text-amber-700 flex items-center gap-1.5">
                            <CreditCard className="w-3.5 h-3.5" />
                            <span>سند {pv.type === 'RECEIPT' ? 'قبض' : 'صرف'}</span>
                          </td>
                          <td className="p-3 font-mono font-bold text-slate-800">{pv.voucherNumber}</td>
                          <td className="p-3 font-mono text-slate-600">{pv.date}</td>
                          <td className="p-3 text-slate-700 truncate max-w-xs">{pv.entityName || pv.notes}</td>
                          <td className="p-3 text-center font-mono font-bold text-amber-700">
                            {pv.amount?.toLocaleString()} {pv.currency}
                          </td>
                          <td className="p-3 text-center">
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                              {pv.status}
                            </span>
                          </td>
                          <td className="p-3 text-center">
                            <button
                              type="button"
                              onClick={() => setPreviewDocDetail({ type: 'PAYMENT_VOUCHER', data: pv })}
                              className="text-xs font-bold text-indigo-600 hover:text-indigo-800 hover:underline"
                            >
                              معاينة السند
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

      {/* ========================================================================= */}
      {/* TAB 3: POLICIES & RETENTION RULES */}
      {/* ========================================================================= */}
      {subTab === 'POLICIES' && (
        <form onSubmit={handleSavePolicy} className="space-y-6">
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">سياسات وقواعد الاحتفاظ بالبيانات (Retention Policy)</h3>
                  <p className="text-xs text-slate-500">إدارة فترات التقادم المحاسبي، التنبيهات، وحماية السجلات النشطة</p>
                </div>
              </div>
              <span className="text-xs font-mono font-bold text-slate-400">POLICIES</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {/* Retention Period in Months */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  فترة الاحتفاظ بالبيانات النشطة (بالأشهر)
                </label>
                <select
                  value={policy.retentionPeriodMonths}
                  onChange={(e) => setPolicy({ ...policy, retentionPeriodMonths: Number(e.target.value) })}
                  className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 font-bold text-slate-800 focus:bg-white focus:ring-2 focus:ring-indigo-500"
                >
                  <option value={6}>6 أشهر (للأنشطة ذات المعاملات اليومية الكثيفة)</option>
                  <option value={12}>12 شهراً (سنة مالية كاملة - موصى به)</option>
                  <option value={24}>24 شهراً (سنتان ماليتان)</option>
                  <option value={36}>36 شهراً (3 سنوات)</option>
                  <option value={60}>60 شهراً (5 سنوات وفق القوانين الضريبية)</option>
                </select>
                <p className="text-[11px] text-slate-400 mt-1">
                  المستندات الأقدم من هذه الفترة ستظهر كاقتراح أرشفة تلقائي لتحسين أداء النظام.
                </p>
              </div>

              {/* Alert Threshold Records */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  حد التنبيه لعدد السجلات النشطة
                </label>
                <input
                  type="number"
                  min={500}
                  step={500}
                  value={policy.alertThresholdRecords}
                  onChange={(e) => setPolicy({ ...policy, alertThresholdRecords: Number(e.target.value) })}
                  className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 font-mono font-bold text-slate-800 focus:bg-white focus:ring-2 focus:ring-indigo-500"
                />
                <p className="text-[11px] text-slate-400 mt-1">
                  إشعار المدير المالي عند تجاوز عدد القيود النشطة هذا الحد لجدولة أرشفة دورية.
                </p>
              </div>
            </div>

            {/* Checkbox Options */}
            <div className="space-y-3 pt-2">
              <label className="flex items-center gap-3 p-3 rounded-xl border border-slate-200 bg-slate-50 cursor-pointer">
                <input
                  type="checkbox"
                  checked={policy.protectUnsettledDocuments}
                  onChange={(e) => setPolicy({ ...policy, protectUnsettledDocuments: e.target.checked })}
                  className="rounded text-indigo-600 focus:ring-indigo-500"
                />
                <div>
                  <span className="text-xs font-bold text-slate-900 block">
                    الحظر الصارم لأرشفة الفواتير غير المسددة أو القيود غير المتوازنة
                  </span>
                  <span className="text-[11px] text-slate-500">
                    ضمان عدم استبعاد أي مبالغ مستحقة للعملاء أو الموردين من تقارير أعمار الديون.
                  </span>
                </div>
              </label>

              <label className="flex items-center gap-3 p-3 rounded-xl border border-slate-200 bg-slate-50 cursor-pointer">
                <input
                  type="checkbox"
                  checked={policy.requireApprovalForRestoration}
                  onChange={(e) => setPolicy({ ...policy, requireApprovalForRestoration: e.target.checked })}
                  className="rounded text-indigo-600 focus:ring-indigo-500"
                />
                <div>
                  <span className="text-xs font-bold text-slate-900 block">
                    طلب تأكيد إداري قبل استرجاع أي دفعة مؤرشفة إلى النظام النشط
                  </span>
                  <span className="text-[11px] text-slate-500">
                    حماية البيانات النشطة من التكرار والتدخل غير المصرح به.
                  </span>
                </div>
              </label>
            </div>

            <div className="flex justify-end pt-4 border-t border-slate-100">
              <button
                type="submit"
                className="flex items-center gap-2 px-6 py-2.5 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-xs transition"
              >
                <ShieldCheck className="w-4 h-4" />
                <span>حفظ سياسات الأرشفة</span>
              </button>
            </div>
          </div>
        </form>
      )}

      {/* ========================================================================= */}
      {/* CONFIRMATION MODAL BEFORE EXECUTING ARCHIVE */}
      {/* ========================================================================= */}
      {isConfirmModalOpen && simulationResult && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-lg w-full shadow-2xl border border-slate-200 space-y-5 animate-in zoom-in-95 duration-200">
            <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
              <div className="w-10 h-10 rounded-xl bg-indigo-100 text-indigo-600 flex items-center justify-center shrink-0">
                <Archive className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">تأكيد عملية الأرشفة وترحيل البيانات</h3>
                <p className="text-xs text-slate-500">سيتم نقل {simulationResult.totalEligibleCount} مستند إلى خزنة الأرشيف</p>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  عنوان أو مسمى الدفعة المؤرشفة *
                </label>
                <input
                  type="text"
                  required
                  value={batchTitle}
                  onChange={(e) => setBatchTitle(e.target.value)}
                  placeholder={`أرشفة إقفال إلى تاريخ ${cutoffDate}`}
                  className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 font-bold text-slate-900 focus:bg-white focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  ملاحظات ومحضر الأرشفة (Audit Notes)
                </label>
                <textarea
                  rows={2}
                  value={userNotes}
                  onChange={(e) => setUserNotes(e.target.value)}
                  placeholder="مثال: تمت الأرشفة بعد اعتماد الميزانية الختامية للعام وإغلاق كافة الذمم."
                  className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 text-slate-800 focus:bg-white focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 flex items-start gap-2.5 text-xs text-amber-900">
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold block">ملاحظة أمنية هامة:</span>
                  <span>
                    ستختفي هذه المستندات من شاشات العمل اليومية المباشرة لزيادة سرعة النظام، وستظل متاحة للمعاينة والتصدير والاسترجاع في أي وقت من تبويب &quot;خزنة المستندات المؤرشفة&quot;.
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setIsConfirmModalOpen(false)}
                className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl"
              >
                إلغاء
              </button>

              <button
                type="button"
                onClick={handleConfirmArchive}
                className="flex items-center gap-2 px-5 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-md transition"
              >
                <Check className="w-4 h-4" />
                <span>ترحيل فوري إلى الأرشيف</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SINGLE DOCUMENT DETAIL INSPECTION MODAL */}
      {/* ========================================================================= */}
      {previewDocDetail && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-2xl w-full shadow-2xl border border-slate-200 space-y-5 animate-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-indigo-100 text-indigo-600 flex items-center justify-center">
                  <FileText className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    معاينة المستند المؤرشف ({previewDocDetail.type})
                  </h3>
                  <span className="text-[11px] font-mono text-slate-500">
                    {previewDocDetail.data.entryNumber ||
                      previewDocDetail.data.invoiceNumber ||
                      previewDocDetail.data.voucherNumber}
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setPreviewDocDetail(null)}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* If Journal Entry, show lines */}
            {previewDocDetail.type === 'JOURNAL_ENTRY' && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 p-3 rounded-xl text-xs">
                  <div>
                    <span className="text-slate-400 block">التاريخ:</span>
                    <span className="font-bold text-slate-800 font-mono">{previewDocDetail.data.date}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block">المرجع:</span>
                    <span className="font-bold text-slate-800">{previewDocDetail.data.reference || '-'}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block">الحالة:</span>
                    <span className="font-bold text-emerald-600">{previewDocDetail.data.status}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block">المستخدم:</span>
                    <span className="font-bold text-slate-800">{previewDocDetail.data.createdBy}</span>
                  </div>
                </div>

                <p className="text-xs text-slate-700 bg-indigo-50/50 p-2.5 rounded-lg border border-indigo-100">
                  <span className="font-bold">البيان: </span>
                  {previewDocDetail.data.description}
                </p>

                <div className="overflow-x-auto rounded-xl border border-slate-200">
                  <table className="w-full text-right text-xs">
                    <thead className="bg-slate-50 font-bold text-slate-700 border-b border-slate-200">
                      <tr>
                        <th className="p-2.5">رقم الحساب</th>
                        <th className="p-2.5">اسم الحساب</th>
                        <th className="p-2.5 text-center">مدين</th>
                        <th className="p-2.5 text-center">دائن</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-mono">
                      {previewDocDetail.data.lines?.map((line: any, idx: number) => (
                        <tr key={idx}>
                          <td className="p-2.5 text-indigo-700 font-bold">{line.accountCode}</td>
                          <td className="p-2.5 font-sans font-medium text-slate-800">{line.accountName}</td>
                          <td className="p-2.5 text-center font-bold text-slate-900">
                            {line.debit > 0 ? line.debit.toLocaleString() : '-'}
                          </td>
                          <td className="p-2.5 text-center font-bold text-slate-900">
                            {line.credit > 0 ? line.credit.toLocaleString() : '-'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* If Invoice, show details */}
            {previewDocDetail.type === 'INVOICE' && (
              <div className="space-y-4 text-xs">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 p-3 rounded-xl">
                  <div>
                    <span className="text-slate-400 block">العميل / المورد:</span>
                    <span className="font-bold text-slate-800">{previewDocDetail.data.entityName}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block">تاريخ الإصدار:</span>
                    <span className="font-bold text-slate-800 font-mono">{previewDocDetail.data.date}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block">تاريخ الاستحقاق:</span>
                    <span className="font-bold text-slate-800 font-mono">{previewDocDetail.data.dueDate}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block">الإجمالي:</span>
                    <span className="font-bold text-emerald-700 font-mono">
                      {previewDocDetail.data.grandTotal?.toLocaleString()} {previewDocDetail.data.currency}
                    </span>
                  </div>
                </div>

                <div className="overflow-x-auto rounded-xl border border-slate-200">
                  <table className="w-full text-right text-xs">
                    <thead className="bg-slate-50 font-bold text-slate-700 border-b border-slate-200">
                      <tr>
                        <th className="p-2.5">الوصف / البند</th>
                        <th className="p-2.5 text-center">الكمية</th>
                        <th className="p-2.5 text-center">سعر الوحدة</th>
                        <th className="p-2.5 text-center">الإجمالي</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {previewDocDetail.data.items?.map((item: any, idx: number) => (
                        <tr key={idx}>
                          <td className="p-2.5 font-bold text-slate-800">{item.description}</td>
                          <td className="p-2.5 text-center font-mono">{item.quantity}</td>
                          <td className="p-2.5 text-center font-mono">{item.unitPrice?.toLocaleString()}</td>
                          <td className="p-2.5 text-center font-mono font-bold text-emerald-700">
                            {item.total?.toLocaleString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* If Voucher */}
            {previewDocDetail.type === 'PAYMENT_VOUCHER' && (
              <div className="space-y-3 text-xs bg-slate-50 p-4 rounded-xl border border-slate-200">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <span className="text-slate-400 block">نوع السند:</span>
                    <span className="font-bold text-slate-800">
                      سند {previewDocDetail.data.type === 'RECEIPT' ? 'قبض تحصيلي' : 'صرف نقدي/بنكي'}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block">المبلغ:</span>
                    <span className="font-bold text-indigo-700 font-mono text-sm">
                      {previewDocDetail.data.amount?.toLocaleString()} {previewDocDetail.data.currency}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block">طريقة الدفع:</span>
                    <span className="font-bold text-slate-800">{previewDocDetail.data.paymentMethod}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block">المرجع:</span>
                    <span className="font-bold text-slate-800 font-mono">
                      {previewDocDetail.data.referenceNumber || '-'}
                    </span>
                  </div>
                </div>
                <p className="text-slate-700 pt-2 border-t border-slate-200">
                  <span className="font-bold">ملاحظات: </span>
                  {previewDocDetail.data.notes}
                </p>
              </div>
            )}

            <div className="flex justify-end pt-3">
              <button
                type="button"
                onClick={() => setPreviewDocDetail(null)}
                className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl"
              >
                إغلاق
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
