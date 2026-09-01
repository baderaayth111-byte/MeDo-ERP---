import { 
  RecurringJournalEntryTemplate, 
  RecurringFrequency, 
  RecurringCategory,
  JournalEntry,
  Currency,
  Account,
  CostCenter
} from '../types/accounting';

export const RECURRING_STORAGE_KEY = 'medo_erp_recurring_journal_entries_v1';

export const RECURRING_CATEGORIES_CONFIG: Record<RecurringCategory, { labelAr: string; color: string; icon: string }> = {
  RENT: { labelAr: 'إيجارات وعقارات', color: 'bg-amber-100 text-amber-800 border-amber-200', icon: 'Building2' },
  SALARY: { labelAr: 'رواتب وأجور مستحقة', color: 'bg-blue-100 text-blue-800 border-blue-200', icon: 'Users' },
  DEPRECIATION: { labelAr: 'إهلاك أصول دوري', color: 'bg-purple-100 text-purple-800 border-purple-200', icon: 'TrendingDown' },
  SUBSCRIPTION: { labelAr: 'اشتراكات وخدمات سحابية', color: 'bg-emerald-100 text-emerald-800 border-emerald-200', icon: 'Cloud' },
  INSURANCE: { labelAr: 'أقساط وتأمين مؤجل', color: 'bg-indigo-100 text-indigo-800 border-indigo-200', icon: 'ShieldCheck' },
  UTILITIES: { labelAr: 'منافع وخدمات عامة (كهرباء/مياه)', color: 'bg-yellow-100 text-yellow-800 border-yellow-200', icon: 'Zap' },
  LOAN_INTEREST: { labelAr: 'فوائد وأقساط بنكية', color: 'bg-rose-100 text-rose-800 border-rose-200', icon: 'Landmark' },
  OTHER: { labelAr: 'مصاريف ثابتة أخرى', color: 'bg-slate-100 text-slate-800 border-slate-200', icon: 'FileText' },
};

export const RECURRING_FREQUENCIES_CONFIG: Record<RecurringFrequency, { labelAr: string; intervalMonths: number }> = {
  DAILY: { labelAr: 'يومياً (Daily)', intervalMonths: 0 },
  WEEKLY: { labelAr: 'أسبوعياً (Weekly)', intervalMonths: 0 },
  MONTHLY: { labelAr: 'شهرياً (Monthly)', intervalMonths: 1 },
  QUARTERLY: { labelAr: 'ربع سنوي (كل 3 أشهر)', intervalMonths: 3 },
  SEMI_ANNUAL: { labelAr: 'نصف سنوي (كل 6 أشهر)', intervalMonths: 6 },
  ANNUAL: { labelAr: 'سنوياً (Annual)', intervalMonths: 12 },
};

export const initialRecurringTemplates: RecurringJournalEntryTemplate[] = [
  {
    id: 'rec-001',
    templateCode: 'REC-RENT-HQ',
    templateName: 'إيجار المقر الرئيسي - برج المروج صنعاء',
    category: 'RENT',
    description: 'قيد استحقاق إيجار المقر الرئيسي الشهري - الإدارة العامة',
    frequency: 'MONTHLY',
    executionDayOfMonth: 1,
    startDate: '2026-01-01',
    endDate: '2026-12-31',
    nextRunDate: '2026-09-01',
    lastRunDate: '2026-08-01',
    totalOccurrences: 12,
    executedOccurrences: 8,
    status: 'ACTIVE',
    autoPost: true,
    currency: 'YER',
    exchangeRate: 1,
    totalDebit: 1500000,
    totalCredit: 1500000,
    notes: 'عقد إيجار رقم 2026/08 - الدفع عبر التحويل البنكي لحساب المالك في الأول من كل شهر ميلادي',
    createdAt: '2026-01-01T08:00:00Z',
    lines: [
      {
        id: 'rec-l-1',
        accountCode: '5200',
        accountName: 'المصروفات العمومية والإدارية (إيجار المقر)',
        debit: 1500000,
        credit: 0,
        currency: 'YER',
        exchangeRate: 1,
        amountInBase: 1500000,
        costCenterId: 'cc-1',
        description: 'استحقاق مصروف إيجار المقر الرئيسي لشهر سبتمبر 2026',
      },
      {
        id: 'rec-l-2',
        accountCode: '1112',
        accountName: 'البنك المركزي اليمني / بنك التضامن الإسلامي',
        debit: 0,
        credit: 1500000,
        currency: 'YER',
        exchangeRate: 1,
        amountInBase: 1500000,
        description: 'حوالة بنكية سداد إيجار شهر سبتمبر 2026',
      },
    ],
  },
  {
    id: 'rec-002',
    templateCode: 'REC-PAYROLL-ACC',
    templateName: 'استحقاق مخصص الرواتب والأجور الشهرية',
    category: 'SALARY',
    description: 'قيد إثبات استحقاق مسير رواتب موظفي الشركة وفروعها',
    frequency: 'MONTHLY',
    executionDayOfMonth: 28,
    startDate: '2026-01-01',
    nextRunDate: '2026-08-28',
    lastRunDate: '2026-07-28',
    totalOccurrences: 12,
    executedOccurrences: 7,
    status: 'ACTIVE',
    autoPost: true,
    currency: 'YER',
    exchangeRate: 1,
    totalDebit: 6450000,
    totalCredit: 6450000,
    notes: 'يتم قيد الاستحقاق في 28 من كل شهر وصرف المرتبات عبر الصرافة في 30 من الشهر',
    createdAt: '2026-01-01T08:00:00Z',
    lines: [
      {
        id: 'rec-l-3',
        accountCode: '5200',
        accountName: 'المصروفات العمومية والإدارية - بند الرواتب والأجور',
        debit: 6450000,
        credit: 0,
        currency: 'YER',
        exchangeRate: 1,
        amountInBase: 6450000,
        costCenterId: 'cc-1',
        description: 'إثبات مصروفات الرواتب والأجور والبدلات للموظفين',
      },
      {
        id: 'rec-l-4',
        accountCode: '2111',
        accountName: 'أمانات ومستحقات الموظفين والرواتب المعلقة',
        debit: 0,
        credit: 6450000,
        currency: 'YER',
        exchangeRate: 1,
        amountInBase: 6450000,
        description: 'مستحقات الرواتب والأجور الشهرية للموظفين لغرض الصرف',
      },
    ],
  },
  {
    id: 'rec-003',
    templateCode: 'REC-DEP-MONTHLY',
    templateName: 'قسط إهلاك الأصول الثابتة الشهري (Straight-Line)',
    category: 'DEPRECIATION',
    description: 'قيد إهلاك أصول أسطول النقل والمعدات وأجهزة الحاسوب',
    frequency: 'MONTHLY',
    executionDayOfMonth: 30,
    startDate: '2026-01-01',
    nextRunDate: '2026-08-30',
    lastRunDate: '2026-07-30',
    totalOccurrences: 12,
    executedOccurrences: 7,
    status: 'ACTIVE',
    autoPost: true,
    currency: 'YER',
    exchangeRate: 1,
    totalDebit: 480000,
    totalCredit: 480000,
    notes: 'إهلاك دفتري منتظم بموجب جدول الأصول الثابتة السنوي 2026',
    createdAt: '2026-01-01T08:00:00Z',
    lines: [
      {
        id: 'rec-l-5',
        accountCode: '5200',
        accountName: 'المصروفات العمومية والإدارية - مخصص الإهلاك',
        debit: 480000,
        credit: 0,
        currency: 'YER',
        exchangeRate: 1,
        amountInBase: 480000,
        costCenterId: 'cc-2',
        description: 'مصروف إهلاك الأصول الثابتة والمعدات لشهر أغسطس 2026',
      },
      {
        id: 'rec-l-6',
        accountCode: '1211',
        accountName: 'الأصول الثابتة - مجمع إهلاك الأصول ومعدات التشغيل',
        debit: 0,
        credit: 480000,
        currency: 'YER',
        exchangeRate: 1,
        amountInBase: 480000,
        description: 'مجمع إهلاك الأصول الثابتة المحسوب شهرياً',
      },
    ],
  },
  {
    id: 'rec-004',
    templateCode: 'REC-CLOUD-AWS',
    templateName: 'اشتراك الخوادم السحابية والأنظمة (Cloud ERP Hosting)',
    category: 'SUBSCRIPTION',
    description: 'قيد سداد اشتراك استضافة السحابة والنسخ الاحتياطي السحابي',
    frequency: 'MONTHLY',
    executionDayOfMonth: 5,
    startDate: '2026-01-01',
    nextRunDate: '2026-09-05',
    lastRunDate: '2026-08-05',
    totalOccurrences: 12,
    executedOccurrences: 8,
    status: 'ACTIVE',
    autoPost: true,
    currency: 'USD',
    exchangeRate: 535,
    totalDebit: 350,
    totalCredit: 350,
    notes: 'استضافة سحابية معززة وخوادم النسخ المتطابق ERP Cloud Server',
    createdAt: '2026-01-01T08:00:00Z',
    lines: [
      {
        id: 'rec-l-7',
        accountCode: '5200',
        accountName: 'المصروفات العمومية والإدارية - تقنية المعلومات والسحابة',
        debit: 350,
        credit: 0,
        currency: 'USD',
        exchangeRate: 535,
        amountInBase: 187250,
        costCenterId: 'cc-1',
        description: 'اشتراك الخوادم السحابية والدعم الفني لشهر سبتمبر 2026',
      },
      {
        id: 'rec-l-8',
        accountCode: '1112',
        accountName: 'البنك - حساب العملات الأجنبية (USD Account)',
        debit: 0,
        credit: 350,
        currency: 'USD',
        exchangeRate: 535,
        amountInBase: 187250,
        description: 'سداد بطاقة ائتمان بنكية لحساب مزود الخدمة السحابية',
      },
    ],
  },
  {
    id: 'rec-005',
    templateCode: 'REC-INSUR-FLEET',
    templateName: 'إطفاء التأمين الشامل لمركبات وأسطول التوزيع',
    category: 'INSURANCE',
    description: 'قيد إطفاء ربع سنوي لأقساط التأمين المدفوع مقدماً للأسطول',
    frequency: 'QUARTERLY',
    executionDayOfMonth: 1,
    startDate: '2026-01-01',
    endDate: '2026-12-31',
    nextRunDate: '2026-10-01',
    lastRunDate: '2026-07-01',
    totalOccurrences: 4,
    executedOccurrences: 2,
    status: 'ACTIVE',
    autoPost: false,
    currency: 'YER',
    exchangeRate: 1,
    totalDebit: 600000,
    totalCredit: 600000,
    notes: 'إطفاء رصيد المصروفات المدفوعة مقدماً لدى شركة التأمين الوطنية',
    createdAt: '2026-01-01T08:00:00Z',
    lines: [
      {
        id: 'rec-l-9',
        accountCode: '5200',
        accountName: 'المصروفات العمومية والإدارية - تأمين المركبات',
        debit: 600000,
        credit: 0,
        currency: 'YER',
        exchangeRate: 1,
        amountInBase: 600000,
        costCenterId: 'cc-3',
        description: 'قسط إطفاء تأمين أسطول النقل للربع الرابع 2026',
      },
      {
        id: 'rec-l-10',
        accountCode: '1121',
        accountName: 'أرصدة مدينة أخرى - مصروفات تأمين مدفوعة مقدماً',
        debit: 0,
        credit: 600000,
        currency: 'YER',
        exchangeRate: 1,
        amountInBase: 600000,
        description: 'إطفاء من حساب التأمين المقدم',
      },
    ],
  },
];

export function getLoadedRecurringTemplates(): RecurringJournalEntryTemplate[] {
  try {
    const raw = localStorage.getItem(RECURRING_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (e) {
    console.error('Failed to load recurring templates from localStorage', e);
  }
  return initialRecurringTemplates;
}

export function saveRecurringTemplates(templates: RecurringJournalEntryTemplate[]): void {
  try {
    localStorage.setItem(RECURRING_STORAGE_KEY, JSON.stringify(templates));
  } catch (e) {
    console.error('Failed to save recurring templates to localStorage', e);
  }
}

export function calculateNextRunDate(
  currentDateStr: string,
  frequency: RecurringFrequency,
  executionDayOfMonth?: number
): string {
  const base = new Date(currentDateStr);
  if (isNaN(base.getTime())) {
    const today = new Date();
    return today.toISOString().split('T')[0];
  }

  const next = new Date(base.getTime());

  if (frequency === 'DAILY') {
    next.setDate(next.getDate() + 1);
  } else if (frequency === 'WEEKLY') {
    next.setDate(next.getDate() + 7);
  } else if (frequency === 'MONTHLY') {
    next.setMonth(next.getMonth() + 1);
    if (executionDayOfMonth) {
      const maxDaysInMonth = new Date(next.getFullYear(), next.getMonth() + 1, 0).getDate();
      next.setDate(Math.min(executionDayOfMonth, maxDaysInMonth));
    }
  } else if (frequency === 'QUARTERLY') {
    next.setMonth(next.getMonth() + 3);
    if (executionDayOfMonth) {
      const maxDaysInMonth = new Date(next.getFullYear(), next.getMonth() + 1, 0).getDate();
      next.setDate(Math.min(executionDayOfMonth, maxDaysInMonth));
    }
  } else if (frequency === 'SEMI_ANNUAL') {
    next.setMonth(next.getMonth() + 6);
  } else if (frequency === 'ANNUAL') {
    next.setFullYear(next.getFullYear() + 1);
  }

  return next.toISOString().split('T')[0];
}

export function generateJournalEntryFromRecurringTemplate(
  template: RecurringJournalEntryTemplate,
  executionDate: string,
  existingEntriesCount: number
): {
  newEntry: JournalEntry;
  updatedTemplate: RecurringJournalEntryTemplate;
} {
  const newRunCount = (template.executedOccurrences || 0) + 1;
  const isCompleted = template.totalOccurrences && newRunCount >= template.totalOccurrences;

  const nextRun = calculateNextRunDate(
    executionDate,
    template.frequency,
    template.executionDayOfMonth
  );

  const entryNumber = `JV-2026-REC${String(existingEntriesCount + 101).padStart(4, '0')}`;
  const reference = `${template.templateCode}/RUN-${newRunCount}`;

  const generatedLines = template.lines.map((line, idx) => ({
    ...line,
    id: `rec-gen-${Date.now()}-${idx + 1}`,
    description: line.description || `${template.description} - دورة (${newRunCount})`,
    debit: Number(line.debit) || 0,
    credit: Number(line.credit) || 0,
    amountInBase: Number(line.amountInBase) || (Number(line.debit) || Number(line.credit) || 0) * (template.exchangeRate || 1),
  }));

  const newEntry: JournalEntry = {
    id: `JE-REC-${template.id}-${Date.now().toString().slice(-4)}`,
    entryNumber,
    date: executionDate,
    reference,
    description: `${template.description} (القيد المتكرر رقم ${newRunCount}${template.totalOccurrences ? ` من ${template.totalOccurrences}` : ''})`,
    lines: generatedLines,
    totalDebit: template.totalDebit,
    totalCredit: template.totalCredit,
    status: 'POSTED',
    createdBy: `المعالج الآلي للقيود المتكررة (SAP F.14 Engine - ${template.templateCode})`,
    postedAt: new Date().toLocaleString('ar-YE'),
    recurringTemplateId: template.id,
    notes: `قيد مرحل آلياً من قالب القيد المتكرر [${template.templateName}] - التردد: ${RECURRING_FREQUENCIES_CONFIG[template.frequency]?.labelAr || template.frequency}`,
  };

  const updatedTemplate: RecurringJournalEntryTemplate = {
    ...template,
    executedOccurrences: newRunCount,
    lastRunDate: executionDate,
    nextRunDate: nextRun,
    status: isCompleted ? 'COMPLETED' : template.status,
    updatedAt: new Date().toISOString(),
  };

  return { newEntry, updatedTemplate };
}

// Preset Quick Templates that user can click to quickly add
export const PRESET_EXPENSE_TEMPLATES: Partial<RecurringJournalEntryTemplate>[] = [
  {
    templateCode: 'REC-RENT-NEW',
    templateName: 'إيجار فرع أو مستودع جديد',
    category: 'RENT',
    description: 'قيد استحقاق إيجار فرع تجاري / مستودع تخزين شهري',
    frequency: 'MONTHLY',
    executionDayOfMonth: 1,
    totalDebit: 800000,
    totalCredit: 800000,
    currency: 'YER',
    autoPost: true,
  },
  {
    templateCode: 'REC-SALARY-NEW',
    templateName: 'مسير رواتب العمالة والمبيعات',
    category: 'SALARY',
    description: 'استحقاق رواتب وبدلات المبيعات ونقاط البيع الشهرية',
    frequency: 'MONTHLY',
    executionDayOfMonth: 28,
    totalDebit: 3200000,
    totalCredit: 3200000,
    currency: 'YER',
    autoPost: true,
  },
  {
    templateCode: 'REC-UTIL-POWER',
    templateName: 'فاتورة الكهرباء والإنترنت للمقر',
    category: 'UTILITIES',
    description: 'سداد فواتير الطاقة والإنترنت وخدمات الاتصالات الثابتة',
    frequency: 'MONTHLY',
    executionDayOfMonth: 10,
    totalDebit: 350000,
    totalCredit: 350000,
    currency: 'YER',
    autoPost: true,
  },
  {
    templateCode: 'REC-DEP-ASSETS',
    templateName: 'إهلاك تجهيزات وديكورات الفروع',
    category: 'DEPRECIATION',
    description: 'قسط إهلاك الديكورات والتجهيزات التجارية شهرياً',
    frequency: 'MONTHLY',
    executionDayOfMonth: 30,
    totalDebit: 150000,
    totalCredit: 150000,
    currency: 'YER',
    autoPost: true,
  },
];
