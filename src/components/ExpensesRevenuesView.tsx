import React, { useState } from 'react';
import { 
  Receipt, 
  Wallet, 
  ArrowUpRight, 
  ArrowDownLeft, 
  PlusCircle, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  XCircle, 
  FileText, 
  Printer, 
  Search, 
  Filter, 
  Download, 
  Share2, 
  Sparkles, 
  Building, 
  PieChart, 
  Sliders, 
  ShieldCheck, 
  MessageSquare, 
  Send, 
  ExternalLink,
  ChevronDown,
  UserCheck,
  CreditCard,
  Building2,
  DollarSign,
  TrendingUp,
  Tag,
  Calendar,
  Layers,
  ArrowRight,
  FileCheck,
  Check,
  X,
  Coffee,
  Fuel,
  Wrench,
  Wifi,
  Package,
  Users,
  Briefcase,
  CalendarDays,
  Percent,
  Plus,
  BarChart3
} from 'lucide-react';
import { 
  ExpenseCategory, 
  RevenueCategory, 
  DualControlVoucher, 
  ExpenseDepartment, 
  DailyExpenseItem, 
  DailyExpenseType, 
  VoucherWorkflowStatus, 
  VoucherComment 
} from '../types/expensesRevenues';
import { Account, Currency, CostCenter, CompanyProfile } from '../types/accounting';
import { formatCurrency, convertAmount } from '../utils/formatters';
import { ADMIN_WHATSAPP_NUMBER } from '../data/userCredentials';
import { useAuth } from '../contexts/AuthContext';
import { CompanyHeaderView } from './CompanyHeaderView';
import { DailyExpensesAnalytics } from './DailyExpensesAnalytics';

interface ExpensesRevenuesViewProps {
  vouchers: DualControlVoucher[];
  expenseCategories: ExpenseCategory[];
  revenueCategories: RevenueCategory[];
  departments: ExpenseDepartment[];
  dailyExpenses: DailyExpenseItem[];
  accounts: Account[];
  costCenters: CostCenter[];
  companyProfile: CompanyProfile;
  currency: Currency;
  rates: Record<Currency, number>;
  onAddVoucher: (voucher: DualControlVoucher) => void;
  onUpdateVoucherStatus: (
    voucherId: string, 
    newStatus: VoucherWorkflowStatus, 
    notes?: string, 
    approver?: { id: string; name: string; email: string; role: string }
  ) => void;
  onAddVoucherComment: (voucherId: string, comment: VoucherComment) => void;
  onAddExpenseCategory: (cat: ExpenseCategory) => void;
  onAddRevenueCategory: (cat: RevenueCategory) => void;
  onAddDailyExpense: (item: DailyExpenseItem) => void;
  onAddDepartment: (dept: ExpenseDepartment) => void;
  onNavigateToGeneralLedger?: () => void;
}

export const ExpensesRevenuesView: React.FC<ExpensesRevenuesViewProps> = ({
  vouchers,
  expenseCategories,
  revenueCategories,
  departments,
  dailyExpenses,
  accounts,
  costCenters,
  companyProfile,
  currency,
  rates,
  onAddVoucher,
  onUpdateVoucherStatus,
  onAddVoucherComment,
  onAddExpenseCategory,
  onAddRevenueCategory,
  onAddDailyExpense,
  onAddDepartment,
}) => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'ANALYTICS' | 'DAILY_EXPENSES' | 'DEPARTMENTS' | 'PAYMENT' | 'RECEIPT' | 'DUAL_CONTROL' | 'CATEGORIES'>('ANALYTICS');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string>('ALL');
  const [selectedDeptFilter, setSelectedDeptFilter] = useState<string>('ALL');
  const [selectedDailyDate, setSelectedDailyDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [dailyTypeFilter, setDailyTypeFilter] = useState<string>('ALL');

  // Modals state
  const [isNewVoucherModalOpen, setIsNewVoucherModalOpen] = useState(false);
  const [newVoucherType, setNewVoucherType] = useState<'PAYMENT' | 'RECEIPT'>('PAYMENT');
  const [isNewDailyExpenseModalOpen, setIsNewDailyExpenseModalOpen] = useState(false);
  const [isNewDepartmentModalOpen, setIsNewDepartmentModalOpen] = useState(false);
  const [selectedVoucherForPrint, setSelectedVoucherForPrint] = useState<DualControlVoucher | null>(null);
  const [selectedDailyForPrint, setSelectedDailyForPrint] = useState<DailyExpenseItem | null>(null);
  const [selectedVoucherForApproval, setSelectedVoucherForApproval] = useState<DualControlVoucher | null>(null);
  const [approvalActionType, setApprovalActionType] = useState<'APPROVE' | 'REJECT'>('APPROVE');
  const [approvalNotes, setApprovalNotes] = useState('');
  const [selectedVoucherForComments, setSelectedVoucherForComments] = useState<DualControlVoucher | null>(null);
  const [newCommentText, setNewCommentText] = useState('');

  // Form states for new voucher
  const [formData, setFormData] = useState({
    beneficiaryOrPayer: '',
    beneficiaryPhone: '',
    categoryId: '',
    departmentId: '',
    accountCode: '',
    amount: '',
    paymentMethod: 'BANK_TRANSFER' as 'CASH' | 'BANK_TRANSFER' | 'CHEQUE',
    treasuryOrBankCode: '1112',
    referenceNumber: '',
    costCenterId: 'CC-100',
    description: '',
    date: new Date().toISOString().split('T')[0],
  });

  // Form states for new daily expense
  const [dailyFormData, setDailyFormData] = useState({
    title: '',
    type: 'HOSPITALITY' as DailyExpenseType,
    departmentId: departments[0]?.id || 'DEPT-FIN',
    categoryId: expenseCategories[0]?.id || 'EXP-CAT-01',
    amount: '',
    beneficiary: '',
    pettyCashAccountCode: '1111',
    expenseAccountCode: '5220',
    costCenterId: 'CC-100',
    receiptNumber: '',
    description: '',
    date: new Date().toISOString().split('T')[0],
    time: new Date().toTimeString().slice(0, 5),
    paidBy: user?.displayName || 'أمين صندوق النثريات'
  });

  // Form states for new department
  const [deptFormData, setDeptFormData] = useState({
    code: `DEPT-${departments.length + 101}`,
    nameAr: '',
    nameEn: '',
    managerName: '',
    managerPhone: '+967 ',
    allocatedMonthlyBudget: '',
    allocatedAnnualBudget: '',
    headCount: '5',
    color: 'emerald',
    description: ''
  });

  // Calculate High-level KPIs
  const approvedPaymentVouchers = vouchers.filter(v => v.type === 'PAYMENT' && (v.workflowStatus === 'APPROVED' || v.workflowStatus === 'POSTED'));
  const approvedReceiptVouchers = vouchers.filter(v => v.type === 'RECEIPT' && (v.workflowStatus === 'APPROVED' || v.workflowStatus === 'POSTED'));
  const pendingApprovalsList = vouchers.filter(v => v.workflowStatus === 'PENDING_APPROVAL');

  const totalExpensesInBase = approvedPaymentVouchers.reduce((sum, v) => sum + v.amountInBase, 0);
  const totalRevenuesInBase = approvedReceiptVouchers.reduce((sum, v) => sum + v.amountInBase, 0);
  const netCashFlowInBase = totalRevenuesInBase - totalExpensesInBase;

  const totalExpensesDisplay = convertAmount(totalExpensesInBase, 'YER', currency, rates);
  const totalRevenuesDisplay = convertAmount(totalRevenuesInBase, 'YER', currency, rates);
  const netCashFlowDisplay = convertAmount(netCashFlowInBase, 'YER', currency, rates);

  // Daily Expenses Calculation
  const todayDailyExpenses = dailyExpenses.filter(d => d.date === selectedDailyDate);
  const totalDailyExpensesInBase = todayDailyExpenses.reduce((sum, d) => sum + d.amountInBase, 0);
  const totalDailyExpensesDisplay = convertAmount(totalDailyExpensesInBase, 'YER', currency, rates);

  // Filtered vouchers list for the active view
  const currentTabVouchers = vouchers.filter(v => {
    if (activeTab === 'PAYMENT') return v.type === 'PAYMENT';
    if (activeTab === 'RECEIPT') return v.type === 'RECEIPT';
    if (activeTab === 'DUAL_CONTROL') return v.workflowStatus === 'PENDING_APPROVAL';
    return true;
  });

  const filteredVouchers = currentTabVouchers.filter(v => {
    if (statusFilter !== 'ALL' && v.workflowStatus !== statusFilter) return false;
    if (selectedCategoryFilter !== 'ALL' && v.categoryId !== selectedCategoryFilter) return false;
    if (selectedDeptFilter !== 'ALL' && v.departmentId !== selectedDeptFilter) return false;
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      v.voucherNumber.toLowerCase().includes(q) ||
      v.beneficiaryOrPayer.toLowerCase().includes(q) ||
      v.categoryName.toLowerCase().includes(q) ||
      v.description.toLowerCase().includes(q) ||
      (v.departmentName && v.departmentName.toLowerCase().includes(q))
    );
  });

  // Filtered Daily Expenses
  const filteredDailyExpenses = dailyExpenses.filter(d => {
    if (selectedDailyDate && d.date !== selectedDailyDate && selectedDailyDate !== 'ALL') return false;
    if (selectedDeptFilter !== 'ALL' && d.departmentId !== selectedDeptFilter) return false;
    if (dailyTypeFilter !== 'ALL' && d.type !== dailyTypeFilter) return false;
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      d.voucherNumber.toLowerCase().includes(q) ||
      d.title.toLowerCase().includes(q) ||
      d.beneficiary.toLowerCase().includes(q) ||
      d.departmentName.toLowerCase().includes(q) ||
      d.description.toLowerCase().includes(q)
    );
  });

  // Open Create Voucher Modal with defaults
  const handleOpenCreateModal = (type: 'PAYMENT' | 'RECEIPT') => {
    setNewVoucherType(type);
    const defaultCat = type === 'PAYMENT' ? expenseCategories[0] : revenueCategories[0];
    const defaultDept = departments[0];
    setFormData({
      beneficiaryOrPayer: '',
      beneficiaryPhone: '+967 ',
      categoryId: defaultCat?.id || '',
      departmentId: defaultDept?.id || '',
      accountCode: defaultCat?.defaultAccountCode || (type === 'PAYMENT' ? '5200' : '4100'),
      amount: '',
      paymentMethod: 'BANK_TRANSFER',
      treasuryOrBankCode: '1112',
      referenceNumber: `REF-${Date.now().toString().slice(-6)}`,
      costCenterId: 'CC-100',
      description: '',
      date: new Date().toISOString().split('T')[0],
    });
    setIsNewVoucherModalOpen(true);
  };

  const handleCreateVoucherSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const numAmount = parseFloat(formData.amount);
    if (isNaN(numAmount) || numAmount <= 0) return;

    const cat = newVoucherType === 'PAYMENT'
      ? expenseCategories.find(c => c.id === formData.categoryId)
      : revenueCategories.find(c => c.id === formData.categoryId);

    const dept = departments.find(d => d.id === formData.departmentId);
    const treasuryAccount = accounts.find(a => a.code === formData.treasuryOrBankCode);
    const targetAccount = accounts.find(a => a.code === formData.accountCode);
    const costCenter = costCenters.find(cc => cc.id === formData.costCenterId);

    const prefix = newVoucherType === 'PAYMENT' ? 'PV' : 'RV';
    const voucherNumber = `${prefix}-2026-00${vouchers.length + 101}`;

    const newVoucher: DualControlVoucher = {
      id: `VOUCHER-${Date.now().toString().slice(-4)}`,
      voucherNumber,
      type: newVoucherType,
      categoryType: newVoucherType === 'PAYMENT' ? 'EXPENSE' : 'REVENUE',
      categoryId: formData.categoryId,
      categoryName: cat?.nameAr || (newVoucherType === 'PAYMENT' ? 'مصروفات عامة' : 'إيرادات عامة'),
      departmentId: formData.departmentId,
      departmentName: dept?.nameAr,
      date: formData.date,
      beneficiaryOrPayer: formData.beneficiaryOrPayer,
      beneficiaryPhone: formData.beneficiaryPhone,
      accountCode: formData.accountCode,
      accountName: targetAccount?.nameAr || cat?.defaultAccountName || 'الحساب المحاسبي',
      amount: numAmount,
      currency: 'YER',
      exchangeRate: 1,
      amountInBase: numAmount,
      paymentMethod: formData.paymentMethod,
      treasuryOrBankCode: formData.treasuryOrBankCode,
      treasuryOrBankName: treasuryAccount?.nameAr || 'الصندوق / البنك',
      referenceNumber: formData.referenceNumber,
      costCenterId: formData.costCenterId,
      costCenterName: costCenter?.nameAr,
      description: formData.description,
      workflowStatus: 'PENDING_APPROVAL',
      createdBy: {
        id: user?.uid || 'user-1',
        name: user?.displayName || 'ميدو تك للحلول البرمجية (محاسب الصرف)',
        email: user?.email || 'accountant@medo-erp.com',
        role: user?.role || 'ACCOUNTANT',
      },
      createdAt: new Date().toISOString(),
      comments: [
        {
          id: `c-${Date.now()}`,
          authorId: user?.uid || 'user-1',
          authorName: user?.displayName || 'ميدو تك للحلول البرمجية',
          authorRole: 'منشئ السند',
          text: 'تم إنشاء السند وإحالته للاعتماد المزدوج.',
          createdAt: new Date().toISOString(),
        }
      ],
    };

    onAddVoucher(newVoucher);
    setIsNewVoucherModalOpen(false);
  };

  const handleCreateDailyExpenseSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const numAmount = parseFloat(dailyFormData.amount);
    if (isNaN(numAmount) || numAmount <= 0) return;

    const dept = departments.find(d => d.id === dailyFormData.departmentId);
    const cat = expenseCategories.find(c => c.id === dailyFormData.categoryId);
    const pettyAccount = accounts.find(a => a.code === dailyFormData.pettyCashAccountCode);
    const expAccount = accounts.find(a => a.code === dailyFormData.expenseAccountCode);

    const newDaily: DailyExpenseItem = {
      id: `DEXP-${Date.now()}`,
      date: dailyFormData.date,
      time: dailyFormData.time,
      voucherNumber: `PV-DAY-00${dailyExpenses.length + 1}`,
      type: dailyFormData.type,
      departmentId: dailyFormData.departmentId,
      departmentName: dept?.nameAr || 'قسم عام',
      categoryId: dailyFormData.categoryId,
      categoryName: cat?.nameAr || 'مصروفات ونثريات',
      title: dailyFormData.title,
      description: dailyFormData.description || dailyFormData.title,
      amount: numAmount,
      currency: 'YER',
      exchangeRate: 1,
      amountInBase: numAmount,
      beneficiary: dailyFormData.beneficiary || 'مستفيد مباشر',
      pettyCashAccountCode: dailyFormData.pettyCashAccountCode,
      pettyCashAccountName: pettyAccount?.nameAr || 'صندوق النثريات',
      expenseAccountCode: dailyFormData.expenseAccountCode,
      expenseAccountName: expAccount?.nameAr || cat?.defaultAccountName || 'المصروفات النثرية',
      costCenterId: dailyFormData.costCenterId,
      receiptNumber: dailyFormData.receiptNumber,
      paidBy: dailyFormData.paidBy,
      status: 'POSTED',
      createdAt: new Date().toISOString(),
    };

    onAddDailyExpense(newDaily);
    setIsNewDailyExpenseModalOpen(false);
    setDailyFormData({
      title: '',
      type: 'HOSPITALITY',
      departmentId: departments[0]?.id || 'DEPT-FIN',
      categoryId: expenseCategories[0]?.id || 'EXP-CAT-01',
      amount: '',
      beneficiary: '',
      pettyCashAccountCode: '1111',
      expenseAccountCode: '5220',
      costCenterId: 'CC-100',
      receiptNumber: '',
      description: '',
      date: new Date().toISOString().split('T')[0],
      time: new Date().toTimeString().slice(0, 5),
      paidBy: user?.displayName || 'أمين صندوق النثريات'
    });
  };

  const handleCreateDepartmentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const monthly = parseFloat(deptFormData.allocatedMonthlyBudget) || 0;
    const annual = parseFloat(deptFormData.allocatedAnnualBudget) || monthly * 12;
    const count = parseInt(deptFormData.headCount) || 1;

    const newDept: ExpenseDepartment = {
      id: `DEPT-${Date.now().toString().slice(-4)}`,
      code: deptFormData.code,
      nameAr: deptFormData.nameAr,
      nameEn: deptFormData.nameEn || deptFormData.nameAr,
      managerName: deptFormData.managerName,
      managerPhone: deptFormData.managerPhone,
      allocatedMonthlyBudget: monthly,
      allocatedAnnualBudget: annual,
      spentYTD: 0,
      spentThisMonth: 0,
      headCount: count,
      color: deptFormData.color,
      description: deptFormData.description,
      isActive: true,
    };

    onAddDepartment(newDept);
    setIsNewDepartmentModalOpen(false);
    setDeptFormData({
      code: `DEPT-${departments.length + 102}`,
      nameAr: '',
      nameEn: '',
      managerName: '',
      managerPhone: '+967 ',
      allocatedMonthlyBudget: '',
      allocatedAnnualBudget: '',
      headCount: '5',
      color: 'emerald',
      description: ''
    });
  };

  const handleApprovalSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedVoucherForApproval) return;

    const newStatus: VoucherWorkflowStatus = approvalActionType === 'APPROVE' ? 'APPROVED' : 'REJECTED';
    const approverInfo = {
      id: user?.uid || 'admin-1',
      name: user?.displayName || 'أحمد الماوري (المدير المالي)',
      email: user?.email || 'admin@medo-erp.com',
      role: user?.role || 'ADMIN',
    };

    onUpdateVoucherStatus(selectedVoucherForApproval.id, newStatus, approvalNotes, approverInfo);
    setSelectedVoucherForApproval(null);
    setApprovalNotes('');
  };

  const handleAddCommentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedVoucherForComments || !newCommentText.trim()) return;

    const comment: VoucherComment = {
      id: `c-${Date.now()}`,
      authorId: user?.uid || 'user-1',
      authorName: user?.displayName || 'مدير النظام',
      authorRole: user?.role || 'ADMIN',
      text: newCommentText.trim(),
      createdAt: new Date().toISOString(),
    };

    onAddVoucherComment(selectedVoucherForComments.id, comment);
    setSelectedVoucherForComments(prev => prev ? { ...prev, comments: [...prev.comments, comment] } : null);
    setNewCommentText('');
  };

  const getDailyTypeBadge = (type: DailyExpenseType) => {
    switch (type) {
      case 'HOSPITALITY':
        return <span className="bg-amber-100 text-amber-800 text-[11px] font-bold px-2 py-0.5 rounded-md flex items-center gap-1"><Coffee className="w-3 h-3" /> بوفيه وضيافة</span>;
      case 'TRANSPORT_FUEL':
        return <span className="bg-blue-100 text-blue-800 text-[11px] font-bold px-2 py-0.5 rounded-md flex items-center gap-1"><Fuel className="w-3 h-3" /> مواصلات وبترول</span>;
      case 'OFFICE_SUPPLIES':
        return <span className="bg-emerald-100 text-emerald-800 text-[11px] font-bold px-2 py-0.5 rounded-md flex items-center gap-1"><FileText className="w-3 h-3" /> قرطاسية ومطبوعات</span>;
      case 'EMERGENCY_MAINTENANCE':
        return <span className="bg-rose-100 text-rose-800 text-[11px] font-bold px-2 py-0.5 rounded-md flex items-center gap-1"><Wrench className="w-3 h-3" /> صيانة طارئة</span>;
      case 'COMMUNICATION':
        return <span className="bg-purple-100 text-purple-800 text-[11px] font-bold px-2 py-0.5 rounded-md flex items-center gap-1"><Wifi className="w-3 h-3" /> شحن واتصالات</span>;
      case 'CLEANING':
        return <span className="bg-teal-100 text-teal-800 text-[11px] font-bold px-2 py-0.5 rounded-md flex items-center gap-1"><Package className="w-3 h-3" /> نظافة ومستلزمات</span>;
      default:
        return <span className="bg-slate-100 text-slate-800 text-[11px] font-bold px-2 py-0.5 rounded-md">نثريات متنوعة</span>;
    }
  };

  const getStatusBadge = (status: VoucherWorkflowStatus) => {
    switch (status) {
      case 'POSTED':
        return (
          <span className="bg-emerald-100 text-emerald-800 border border-emerald-300 text-xs font-black px-2.5 py-0.5 rounded-full flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            <span>مرحل ومسدد (POSTED)</span>
          </span>
        );
      case 'APPROVED':
        return (
          <span className="bg-blue-100 text-blue-800 border border-blue-300 text-xs font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
            <span>معتمد للصرف (APPROVED)</span>
          </span>
        );
      case 'PENDING_APPROVAL':
        return (
          <span className="bg-amber-100 text-amber-900 border border-amber-300 text-xs font-black px-2.5 py-0.5 rounded-full flex items-center gap-1 animate-pulse">
            <Clock className="w-3.5 h-3.5 text-amber-600" />
            <span>بانتظار الاعتماد المزدوج</span>
          </span>
        );
      case 'REJECTED':
        return (
          <span className="bg-rose-100 text-rose-800 border border-rose-300 text-xs font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1">
            <XCircle className="w-3.5 h-3.5 text-rose-600" />
            <span>مرفوض (REJECTED)</span>
          </span>
        );
      default:
        return (
          <span className="bg-slate-100 text-slate-700 border border-slate-300 text-xs font-medium px-2.5 py-0.5 rounded-full">
            مسودة (DRAFT)
          </span>
        );
    }
  };

  return (
    <div className="space-y-6" dir="rtl">
      {/* Top Banner & Corporate Header */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white rounded-2xl p-6 shadow-xl border border-indigo-900">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-emerald-600/30 rounded-2xl border border-emerald-400/30">
              <Receipt className="w-8 h-8 text-emerald-300" />
            </div>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-xl sm:text-2xl font-black">إدارة المصروفات والإيرادات والمصروفات اليومية</h1>
                <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 text-xs font-bold px-2.5 py-0.5 rounded-full">
                  Dual Control & Departments
                </span>
              </div>
              <p className="text-sm text-slate-300 mt-1">
                منظومة المصروفات اليومية والنثريات، موازنات الأقسام، سندات الصرف والقبض، والرقابة المزدوجة
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => setIsNewDailyExpenseModalOpen(true)}
              className="bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-black px-4 py-2.5 rounded-xl shadow-lg transition flex items-center gap-2 cursor-pointer"
            >
              <Coffee className="w-4 h-4 text-slate-950" />
              <span>+ تسجيل مصروف يومي (نثرية)</span>
            </button>

            <button
              onClick={() => handleOpenCreateModal('PAYMENT')}
              className="bg-rose-600 hover:bg-rose-500 text-white text-xs font-black px-4 py-2.5 rounded-xl shadow-lg transition flex items-center gap-2 cursor-pointer"
            >
              <PlusCircle className="w-4 h-4" />
              <span>سند صرف معتمد (Payment)</span>
            </button>

            <button
              onClick={() => handleOpenCreateModal('RECEIPT')}
              className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black px-4 py-2.5 rounded-xl shadow-lg transition flex items-center gap-2 cursor-pointer"
            >
              <PlusCircle className="w-4 h-4" />
              <span>سند قبض (Receipt)</span>
            </button>
          </div>
        </div>

        {/* 4 Financial KPIs Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-6 pt-6 border-t border-indigo-900/60">
          <div className="bg-white/5 backdrop-blur-sm p-4 rounded-2xl border border-white/10">
            <div className="flex items-center justify-between text-xs text-slate-300">
              <span>إجمالي المصروفات المعتمدة</span>
              <ArrowUpRight className="w-4 h-4 text-rose-400" />
            </div>
            <div className="text-xl font-black text-rose-400 mt-2">{formatCurrency(totalExpensesDisplay, currency)}</div>
            <div className="text-[11px] text-slate-400 mt-1">{approvedPaymentVouchers.length} سند صرف معتمد</div>
          </div>

          <div className="bg-white/5 backdrop-blur-sm p-4 rounded-2xl border border-white/10">
            <div className="flex items-center justify-between text-xs text-slate-300">
              <span>مصروفات اليوم المباشرة ({selectedDailyDate})</span>
              <Coffee className="w-4 h-4 text-amber-400" />
            </div>
            <div className="text-xl font-black text-amber-400 mt-2">{formatCurrency(totalDailyExpensesDisplay, currency)}</div>
            <div className="text-[11px] text-slate-400 mt-1">{todayDailyExpenses.length} حركة نثريات ومصاريف</div>
          </div>

          <div className="bg-white/5 backdrop-blur-sm p-4 rounded-2xl border border-white/10">
            <div className="flex items-center justify-between text-xs text-slate-300">
              <span>إجمالي الإيرادات المقبوضة</span>
              <ArrowDownLeft className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="text-xl font-black text-emerald-400 mt-2">{formatCurrency(totalRevenuesDisplay, currency)}</div>
            <div className="text-[11px] text-slate-400 mt-1">{approvedReceiptVouchers.length} سند قبض مقيد</div>
          </div>

          <div className="bg-amber-500/10 backdrop-blur-sm p-4 rounded-2xl border border-amber-500/30">
            <div className="flex items-center justify-between text-xs text-amber-300">
              <span>سندات بانتظار الاعتماد</span>
              <ShieldCheck className="w-4 h-4 text-amber-400" />
            </div>
            <div className="text-xl font-black text-amber-400 mt-2">{pendingApprovalsList.length} سندات</div>
            <div className="text-[11px] text-amber-200 mt-1">تتطلب رقابة واعتماد المدير المالي</div>
          </div>
        </div>
      </div>

      {/* Main Tabs Navigation */}
      <div className="flex items-center gap-2 border-b border-slate-200 overflow-x-auto pb-1">
        <button
          onClick={() => setActiveTab('ANALYTICS')}
          className={`px-4 py-2.5 rounded-xl font-bold text-xs shrink-0 transition flex items-center gap-2 cursor-pointer ${
            activeTab === 'ANALYTICS'
              ? 'bg-indigo-900 text-white shadow-md font-black ring-2 ring-indigo-500/20'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <BarChart3 className="w-4 h-4 text-indigo-400" />
          <span>تحليلات ورسوم بيانية (Analytics & Charts)</span>
          <span className="bg-indigo-500/30 text-indigo-200 text-[10px] px-1.5 py-0.2 rounded-full font-bold">
            جديد
          </span>
        </button>

        <button
          onClick={() => setActiveTab('DAILY_EXPENSES')}
          className={`px-4 py-2.5 rounded-xl font-bold text-xs shrink-0 transition flex items-center gap-2 cursor-pointer ${
            activeTab === 'DAILY_EXPENSES'
              ? 'bg-amber-500 text-slate-950 shadow-md font-black'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <Coffee className="w-4 h-4" />
          <span>المصروفات اليومية والنثريات (Daily Expenses)</span>
          <span className="bg-slate-900 text-amber-300 text-[10px] px-1.5 py-0.2 rounded-full font-black">
            {dailyExpenses.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('DEPARTMENTS')}
          className={`px-4 py-2.5 rounded-xl font-bold text-xs shrink-0 transition flex items-center gap-2 cursor-pointer ${
            activeTab === 'DEPARTMENTS'
              ? 'bg-indigo-900 text-white shadow-md'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <Building2 className="w-4 h-4" />
          <span>أقسام المنشأة وموازناتها (Departments)</span>
          <span className="bg-indigo-700 text-white text-[10px] px-1.5 py-0.2 rounded-full">
            {departments.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('PAYMENT')}
          className={`px-4 py-2.5 rounded-xl font-bold text-xs shrink-0 transition flex items-center gap-2 cursor-pointer ${
            activeTab === 'PAYMENT'
              ? 'bg-rose-600 text-white shadow-md'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <ArrowUpRight className="w-4 h-4" />
          <span>سندات الصرف المعتمدة (Payment Vouchers)</span>
          <span className="bg-rose-700/60 text-white text-[10px] px-1.5 py-0.2 rounded-full">
            {vouchers.filter(v => v.type === 'PAYMENT').length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('RECEIPT')}
          className={`px-4 py-2.5 rounded-xl font-bold text-xs shrink-0 transition flex items-center gap-2 cursor-pointer ${
            activeTab === 'RECEIPT'
              ? 'bg-emerald-600 text-white shadow-md'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <ArrowDownLeft className="w-4 h-4" />
          <span>سندات القبض (Receipt Vouchers)</span>
          <span className="bg-emerald-700/60 text-white text-[10px] px-1.5 py-0.2 rounded-full">
            {vouchers.filter(v => v.type === 'RECEIPT').length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('DUAL_CONTROL')}
          className={`px-4 py-2.5 rounded-xl font-bold text-xs shrink-0 transition flex items-center gap-2 cursor-pointer ${
            activeTab === 'DUAL_CONTROL'
              ? 'bg-indigo-900 text-white shadow-md'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <ShieldCheck className="w-4 h-4 text-amber-400" />
          <span>مركز الرقابة المزدوجة والموافقات</span>
          {pendingApprovalsList.length > 0 && (
            <span className="bg-amber-500 text-slate-900 font-black text-[10px] px-2 py-0.2 rounded-full animate-bounce">
              {pendingApprovalsList.length}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('CATEGORIES')}
          className={`px-4 py-2.5 rounded-xl font-bold text-xs shrink-0 transition flex items-center gap-2 cursor-pointer ${
            activeTab === 'CATEGORIES'
              ? 'bg-slate-800 text-white shadow-md'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>دليل شجرة التصنيفات</span>
        </button>
      </div>

      {/* TAB 0: ANALYTICS & CHARTS VIEW */}
      {activeTab === 'ANALYTICS' && (
        <DailyExpensesAnalytics
          dailyExpenses={dailyExpenses}
          departments={departments}
          currency={currency}
          rates={rates}
          companyProfile={companyProfile}
          onFilterByDepartment={(deptId) => {
            setSelectedDeptFilter(deptId);
            setActiveTab('DAILY_EXPENSES');
          }}
          onNewExpenseClick={() => setIsNewDailyExpenseModalOpen(true)}
        />
      )}

      {/* TAB 1: DAILY EXPENSES VIEW */}
      {activeTab === 'DAILY_EXPENSES' && (
        <div className="space-y-4">
          {/* Daily Toolbar & Filters */}
          <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div className="flex items-center gap-2 flex-wrap flex-1">
              {/* Date Selector */}
              <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-xl">
                <Calendar className="w-4 h-4 text-slate-500" />
                <span className="text-xs font-bold text-slate-700">تاريخ اليوم:</span>
                <input
                  type="date"
                  value={selectedDailyDate === 'ALL' ? '' : selectedDailyDate}
                  onChange={e => setSelectedDailyDate(e.target.value || 'ALL')}
                  className="text-xs font-black text-slate-900 bg-transparent focus:outline-none cursor-pointer"
                />
                {selectedDailyDate !== 'ALL' && (
                  <button
                    onClick={() => setSelectedDailyDate('ALL')}
                    className="text-[10px] text-blue-600 font-bold hover:underline pr-1"
                  >
                    (عرض كل التواريخ)
                  </button>
                )}
              </div>

              {/* Department Filter */}
              <select
                value={selectedDeptFilter}
                onChange={e => setSelectedDeptFilter(e.target.value)}
                className="bg-white border border-slate-200 text-slate-700 text-xs font-bold rounded-xl px-3 py-2 focus:ring-2 focus:ring-amber-500 focus:outline-none"
              >
                <option value="ALL">كافة الأقسام</option>
                {departments.map(d => (
                  <option key={d.id} value={d.id}>{d.nameAr}</option>
                ))}
              </select>

              {/* Type Filter */}
              <select
                value={dailyTypeFilter}
                onChange={e => setDailyTypeFilter(e.target.value)}
                className="bg-white border border-slate-200 text-slate-700 text-xs font-bold rounded-xl px-3 py-2 focus:ring-2 focus:ring-amber-500 focus:outline-none"
              >
                <option value="ALL">كافة أنواع النثريات</option>
                <option value="HOSPITALITY">بوفيه وضيافة</option>
                <option value="TRANSPORT_FUEL">مواصلات وبترول</option>
                <option value="OFFICE_SUPPLIES">قرطاسية ومطبوعات</option>
                <option value="EMERGENCY_MAINTENANCE">صيانة طارئة</option>
                <option value="COMMUNICATION">شحن واتصالات</option>
                <option value="CLEANING">نظافة ومستلزمات</option>
              </select>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setActiveTab('ANALYTICS')}
                className="bg-indigo-50 hover:bg-indigo-100 text-indigo-900 border border-indigo-200 text-xs font-bold px-3 py-2 rounded-xl transition flex items-center gap-1.5 cursor-pointer shadow-2xs"
                title="عرض المخططات البيانية وتوزيع نفقات الأقسام"
              >
                <BarChart3 className="w-4 h-4 text-indigo-600" />
                <span className="hidden sm:inline">التحليلات والمخططات</span>
              </button>

              <button
                onClick={() => setIsNewDailyExpenseModalOpen(true)}
                className="bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-black px-4 py-2 rounded-xl transition shadow flex items-center gap-1.5 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>تسجيل حركة يومية</span>
              </button>

              <button
                onClick={() => window.print()}
                className="bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold px-3 py-2 rounded-xl transition flex items-center gap-1.5 cursor-pointer"
                title="طباعة كشف وتصفية اليوم"
              >
                <Printer className="w-4 h-4" />
                <span className="hidden sm:inline">طباعة الكشف اليومي</span>
              </button>
            </div>
          </div>

          {/* Daily Table */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-right text-xs">
                <thead className="bg-slate-100 text-slate-700 font-black border-b border-slate-200">
                  <tr>
                    <th className="p-3.5">رقم السند</th>
                    <th className="p-3.5">التاريخ والوقت</th>
                    <th className="p-3.5">القسم المستفيد</th>
                    <th className="p-3.5">نوع المصروف والبيان</th>
                    <th className="p-3.5">الجهة / المستفيد</th>
                    <th className="p-3.5">المسدد والخزينة</th>
                    <th className="p-3.5">المبلغ</th>
                    <th className="p-3.5 text-center">الإجراءات</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredDailyExpenses.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="p-8 text-center text-slate-400">
                        <div className="flex flex-col items-center justify-center gap-2">
                          <Coffee className="w-10 h-10 text-amber-300 stroke-[1.5]" />
                          <span className="font-bold text-slate-600">لا توجد حركات مصروفات يومية مسجلة لهذا اليوم / الفلتر</span>
                          <button
                            onClick={() => setIsNewDailyExpenseModalOpen(true)}
                            className="text-xs text-amber-600 font-black underline mt-1"
                          >
                            + اضغط هنا لتسجيل أول حركة نثرية لليوم
                          </button>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    filteredDailyExpenses.map(d => {
                      const displayAmt = convertAmount(d.amountInBase, 'YER', currency, rates);
                      return (
                        <tr key={d.id} className="hover:bg-amber-50/40 transition">
                          <td className="p-3.5 font-bold text-slate-900">
                            <span className="font-mono text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                              {d.voucherNumber}
                            </span>
                          </td>
                          <td className="p-3.5 text-slate-600">
                            <div>{d.date}</div>
                            {d.time && <div className="text-[10px] text-slate-400">{d.time}</div>}
                          </td>
                          <td className="p-3.5">
                            <div className="font-bold text-indigo-900">{d.departmentName}</div>
                            {d.costCenterId && <div className="text-[10px] text-slate-500">مركز تكلفة: {d.costCenterId}</div>}
                          </td>
                          <td className="p-3.5">
                            <div className="flex items-center gap-2 mb-1">
                              {getDailyTypeBadge(d.type)}
                              <span className="font-bold text-slate-800">{d.title}</span>
                            </div>
                            <div className="text-[11px] text-slate-500 leading-tight">{d.description}</div>
                          </td>
                          <td className="p-3.5 font-medium text-slate-800">
                            {d.beneficiary}
                            {d.receiptNumber && (
                              <div className="text-[10px] text-slate-500 font-mono">فاتورة/سند: {d.receiptNumber}</div>
                            )}
                          </td>
                          <td className="p-3.5">
                            <div className="font-medium text-slate-700">{d.pettyCashAccountName}</div>
                            <div className="text-[10px] text-slate-500 font-bold">بواسطة: {d.paidBy}</div>
                          </td>
                          <td className="p-3.5 font-black text-sm text-amber-600">
                            {formatCurrency(displayAmt, currency)}
                          </td>
                          <td className="p-3.5 text-center">
                            <div className="flex items-center justify-center gap-1.5">
                              <button
                                onClick={() => setSelectedDailyForPrint(d)}
                                className="p-1.5 text-slate-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition"
                                title="طباعة إيصال النثرية"
                              >
                                <Printer className="w-4 h-4" />
                              </button>
                              <a
                                href={`https://wa.me/${ADMIN_WHATSAPP_NUMBER}?text=${encodeURIComponent(`☕ *إشعار صرف نثرية يومية*\nرقم السند: ${d.voucherNumber}\nالقسم: ${d.departmentName}\nالبيان: ${d.title}\nالمبلغ: ${d.amount.toLocaleString()} ريال يمني\nالتاريخ: ${d.date} ${d.time || ''}`)}`}
                                target="_blank"
                                rel="noreferrer"
                                className="p-1.5 text-slate-600 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition"
                                title="مشاركة عبر واتساب"
                              >
                                <Share2 className="w-4 h-4" />
                              </a>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: DEPARTMENTS VIEW */}
      {activeTab === 'DEPARTMENTS' && (
        <div className="space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
            <div>
              <h2 className="text-base font-black text-slate-900">أقسام المنشأة وتوزيع الموازنات التشغيلية</h2>
              <p className="text-xs text-slate-500 mt-0.5">متابعة المصروفات الفعلية لكل قسم ومطابقتها مع الموازنة التقديرية المعتمدة</p>
            </div>
            <div className="flex items-center gap-2 self-start md:self-auto flex-wrap">
              <button
                onClick={() => setActiveTab('ANALYTICS')}
                className="bg-indigo-50 hover:bg-indigo-100 text-indigo-900 border border-indigo-200 text-xs font-bold px-3.5 py-2.5 rounded-xl transition flex items-center gap-1.5 cursor-pointer shadow-2xs"
              >
                <BarChart3 className="w-4 h-4 text-indigo-600" />
                <span>عرض لوحة الرسوم البيانية</span>
              </button>

              <button
                onClick={() => setIsNewDepartmentModalOpen(true)}
                className="bg-indigo-900 hover:bg-indigo-800 text-white text-xs font-black px-4 py-2.5 rounded-xl transition shadow flex items-center gap-1.5 cursor-pointer"
              >
                <Building2 className="w-4 h-4" />
                <span>+ إضافة قسم جديد</span>
              </button>
            </div>
          </div>

          {/* Department Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {departments.map(dept => {
              const deptMonthlySpent = dept.spentThisMonth || 0;
              const deptMonthlyBudget = dept.allocatedMonthlyBudget || 1;
              const monthlyPercent = Math.min(100, Math.round((deptMonthlySpent / deptMonthlyBudget) * 100));
              const isOverBudget = deptMonthlySpent > deptMonthlyBudget;

              return (
                <div key={dept.id} className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-4 hover:shadow-md transition">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-3 bg-indigo-50 text-indigo-700 rounded-2xl border border-indigo-100">
                        <Building2 className="w-6 h-6" />
                      </div>
                      <div>
                        <h3 className="font-black text-sm text-slate-900">{dept.nameAr}</h3>
                        <span className="text-[10px] font-mono text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                          {dept.code}
                        </span>
                      </div>
                    </div>
                  </div>

                  <p className="text-xs text-slate-600 line-clamp-2 min-h-[32px]">{dept.description || 'لا يوجد وصف مسجل'}</p>

                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-2 text-xs">
                    <div className="flex items-center justify-between text-slate-600">
                      <span>المدير المسؤول:</span>
                      <span className="font-bold text-slate-800">{dept.managerName}</span>
                    </div>
                    {dept.managerPhone && (
                      <div className="flex items-center justify-between text-slate-500 text-[11px]">
                        <span>رقم التواصل:</span>
                        <span className="font-mono text-indigo-600">{dept.managerPhone}</span>
                      </div>
                    )}
                    <div className="flex items-center justify-between text-slate-600">
                      <span>عدد الكادر:</span>
                      <span className="font-bold text-slate-800">{dept.headCount || 5} موظفين</span>
                    </div>
                  </div>

                  {/* Monthly Budget Progress */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs font-bold">
                      <span className="text-slate-600">المنصرف شهرياً:</span>
                      <span className={isOverBudget ? 'text-rose-600 font-black' : 'text-slate-900 font-black'}>
                        {deptMonthlySpent.toLocaleString()} / {deptMonthlyBudget.toLocaleString()} ر.ي
                      </span>
                    </div>
                    <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                      <div
                        className={`h-full transition-all duration-300 ${
                          isOverBudget ? 'bg-rose-500' : monthlyPercent > 80 ? 'bg-amber-500' : 'bg-emerald-500'
                        }`}
                        style={{ width: `${monthlyPercent}%` }}
                      ></div>
                    </div>
                    <div className="flex items-center justify-between text-[11px] text-slate-500">
                      <span>نسبة الاستهلاك: {monthlyPercent}%</span>
                      {isOverBudget && <span className="text-rose-600 font-bold flex items-center gap-0.5"><AlertCircle className="w-3 h-3" /> تجاوز الموازنة</span>}
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                    <span className="text-slate-500">الموازنة السنوية:</span>
                    <span className="font-black text-indigo-900">{dept.allocatedAnnualBudget?.toLocaleString()} ر.ي</span>
                  </div>

                  <button
                    onClick={() => {
                      setSelectedDeptFilter(dept.id);
                      setActiveTab('DAILY_EXPENSES');
                    }}
                    className="w-full py-2 bg-slate-50 hover:bg-indigo-50 hover:text-indigo-900 text-slate-700 text-xs font-bold rounded-xl transition border border-slate-200 flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <span>عرض كافة حركات هذا القسم</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 3 & 4: VOUCHERS LIST (PAYMENT, RECEIPT, DUAL CONTROL) */}
      {(activeTab === 'PAYMENT' || activeTab === 'RECEIPT' || activeTab === 'DUAL_CONTROL') && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          {/* Filters Bar */}
          <div className="p-4 border-b border-slate-200 bg-slate-50/70 flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 text-slate-400 absolute right-3 top-2.5" />
              <input
                type="text"
                placeholder="بحث برقم السند، المستفيد، القسم، أو البيان..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full pl-3 pr-9 py-1.5 bg-white border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              {/* Status Filter */}
              <select
                value={statusFilter}
                onChange={e => setStatusFilter(e.target.value)}
                className="bg-white border border-slate-200 text-slate-700 text-xs font-bold rounded-xl px-3 py-1.5 focus:ring-2 focus:ring-blue-500 focus:outline-none"
              >
                <option value="ALL">كافة الحالات</option>
                <option value="PENDING_APPROVAL">بانتظار الاعتماد</option>
                <option value="APPROVED">معتمد</option>
                <option value="POSTED">مرحل ومسدد</option>
                <option value="REJECTED">مرفوض</option>
              </select>

              {/* Department Filter */}
              <select
                value={selectedDeptFilter}
                onChange={e => setSelectedDeptFilter(e.target.value)}
                className="bg-white border border-slate-200 text-slate-700 text-xs font-bold rounded-xl px-3 py-1.5 focus:ring-2 focus:ring-blue-500 focus:outline-none"
              >
                <option value="ALL">كافة الأقسام</option>
                {departments.map(d => (
                  <option key={d.id} value={d.id}>{d.nameAr}</option>
                ))}
              </select>

              {/* Category Filter */}
              <select
                value={selectedCategoryFilter}
                onChange={e => setSelectedCategoryFilter(e.target.value)}
                className="bg-white border border-slate-200 text-slate-700 text-xs font-bold rounded-xl px-3 py-1.5 focus:ring-2 focus:ring-blue-500 focus:outline-none"
              >
                <option value="ALL">كافة التصنيفات</option>
                {(activeTab === 'PAYMENT' ? expenseCategories : revenueCategories).map(cat => (
                  <option key={cat.id} value={cat.id}>{cat.nameAr}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs">
              <thead className="bg-slate-100 text-slate-700 font-black border-b border-slate-200">
                <tr>
                  <th className="p-3.5">رقم السند</th>
                  <th className="p-3.5">التاريخ</th>
                  <th className="p-3.5">{activeTab === 'PAYMENT' ? 'المستفيد / الجهة' : 'المستلم منه / العميل'}</th>
                  <th className="p-3.5">القسم والتصنيف</th>
                  <th className="p-3.5">طريقة الدفع والخزينة</th>
                  <th className="p-3.5">المبلغ</th>
                  <th className="p-3.5">الحالة والرقابة</th>
                  <th className="p-3.5 text-center">الإجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredVouchers.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="p-8 text-center text-slate-400">
                      <div className="flex flex-col items-center justify-center gap-2">
                        <FileText className="w-10 h-10 text-slate-300 stroke-[1.5]" />
                        <span className="font-bold text-slate-500">لا توجد سندات مطابقة لخيارات البحث</span>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredVouchers.map(v => {
                    const displayAmt = convertAmount(v.amountInBase, 'YER', currency, rates);
                    return (
                      <tr key={v.id} className="hover:bg-slate-50/80 transition">
                        <td className="p-3.5 font-bold text-slate-900">
                          <span className={v.type === 'PAYMENT' ? 'text-rose-600 font-mono font-bold' : 'text-emerald-600 font-mono font-bold'}>
                            {v.voucherNumber}
                          </span>
                        </td>
                        <td className="p-3.5 text-slate-600">{v.date}</td>
                        <td className="p-3.5">
                          <div className="font-bold text-slate-800">{v.beneficiaryOrPayer}</div>
                          {v.departmentName && (
                            <div className="text-[10px] text-indigo-700 font-bold">القسم: {v.departmentName}</div>
                          )}
                        </td>
                        <td className="p-3.5">
                          <div className="font-medium text-slate-700">{v.categoryName}</div>
                          <div className="text-[10px] text-slate-600 font-bold">حـ/ {v.accountCode} - {v.accountName}</div>
                        </td>
                        <td className="p-3.5">
                          <div className="font-medium text-slate-700">
                            {v.paymentMethod === 'CASH' ? '💵 نقداً' : v.paymentMethod === 'BANK_TRANSFER' ? '🏦 تحويل بنكي' : '🧾 شيك بنكي'}
                          </div>
                          <div className="text-[10px] text-slate-600 font-bold">{v.treasuryOrBankName}</div>
                        </td>
                        <td className="p-3.5 font-black text-sm text-slate-900">
                          {formatCurrency(displayAmt, currency)}
                        </td>
                        <td className="p-3.5">
                          {getStatusBadge(v.workflowStatus)}
                          {v.approvedBy && (
                            <div className="text-[10px] text-slate-600 font-bold mt-1">
                              معتمد من: {v.approvedBy.name}
                            </div>
                          )}
                        </td>
                        <td className="p-3.5 text-center">
                          <div className="flex items-center justify-center gap-1.5">
                            {v.workflowStatus === 'PENDING_APPROVAL' && (
                              <button
                                onClick={() => {
                                  setSelectedVoucherForApproval(v);
                                  setApprovalActionType('APPROVE');
                                }}
                                className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] px-2.5 py-1 rounded-lg transition shadow-2xs flex items-center gap-1 cursor-pointer"
                                title="اعتماد السند"
                              >
                                <Check className="w-3.5 h-3.5" />
                                <span>اعتماد</span>
                              </button>
                            )}

                            <button
                              onClick={() => setSelectedVoucherForPrint(v)}
                              className="p-1.5 text-slate-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition"
                              title="طباعة سند رسمي A4"
                            >
                              <Printer className="w-4 h-4" />
                            </button>

                            <a
                              href={`https://wa.me/${ADMIN_WHATSAPP_NUMBER}?text=${encodeURIComponent(`📋 *سند ${v.type === 'PAYMENT' ? 'صرف' : 'قبض'} رقم ${v.voucherNumber}*\nالجهة: ${v.beneficiaryOrPayer}\nالمبلغ: ${v.amount.toLocaleString()} ر.ي\nالتاريخ: ${v.date}\nالحالة: ${v.workflowStatus}\nالبيان: ${v.description}`)}`}
                              target="_blank"
                              rel="noreferrer"
                              className="p-1.5 text-slate-600 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition"
                              title="مشاركة إشعار السند عبر واتساب"
                            >
                              <Share2 className="w-4 h-4" />
                            </a>

                            <button
                              onClick={() => setSelectedVoucherForComments(v)}
                              className="p-1.5 text-slate-600 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition relative"
                              title="الملاحظات والتوجيهات الداخلية"
                            >
                              <MessageSquare className="w-4 h-4" />
                              {v.comments.length > 0 && (
                                <span className="absolute -top-1 -right-1 bg-purple-600 text-white text-[9px] font-bold rounded-full w-3.5 h-3.5 flex items-center justify-center">
                                  {v.comments.length}
                                </span>
                              )}
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 5: CATEGORIES TREE */}
      {activeTab === 'CATEGORIES' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Expense Categories */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-rose-50 rounded-xl border border-rose-200">
                  <ArrowUpRight className="w-5 h-5 text-rose-600" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-slate-900">شجرة تصنيفات المصروفات والموازنات</h3>
                  <p className="text-xs text-slate-500">مراقبة الصرف الفعلي مقابل الموازنة التقديرية السنوية</p>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              {expenseCategories.map(cat => {
                const pct = Math.min(100, Math.round((cat.spentYTD / cat.budgetAnnual) * 100));
                return (
                  <div key={cat.id} className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="font-bold text-xs text-slate-800">{cat.nameAr}</div>
                      <span className="text-[10px] bg-white border border-slate-300 px-2 py-0.5 rounded font-mono font-bold text-slate-600">
                        {cat.code} - {cat.defaultAccountName}
                      </span>
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="text-slate-500">المنصرف التراكمي: {cat.spentYTD.toLocaleString()} ر.ي</span>
                        <span className="font-bold text-slate-700">الموازنة: {cat.budgetAnnual.toLocaleString()} ر.ي</span>
                      </div>
                      <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                        <div
                          className={`h-full ${pct > 90 ? 'bg-rose-500' : pct > 70 ? 'bg-amber-500' : 'bg-emerald-500'}`}
                          style={{ width: `${pct}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Revenue Categories */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-emerald-50 rounded-xl border border-emerald-200">
                  <ArrowDownLeft className="w-5 h-5 text-emerald-600" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-slate-900">شجرة تصنيفات الإيرادات والمستهدفات</h3>
                  <p className="text-xs text-slate-500">متابعة الإيراد المحصل مقابل المستهدف السنوي</p>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              {revenueCategories.map(cat => {
                const pct = Math.min(100, Math.round((cat.collectedYTD / cat.targetAnnual) * 100));
                return (
                  <div key={cat.id} className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="font-bold text-xs text-slate-800">{cat.nameAr}</div>
                      <span className="text-[10px] bg-white border border-slate-300 px-2 py-0.5 rounded font-mono font-bold text-slate-600">
                        {cat.code} - {cat.defaultAccountName}
                      </span>
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="text-slate-500">المحصل الفعلي: {cat.collectedYTD.toLocaleString()} ر.ي</span>
                        <span className="font-bold text-slate-700">المستهدف: {cat.targetAnnual.toLocaleString()} ر.ي</span>
                      </div>
                      <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-emerald-500"
                          style={{ width: `${pct}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Modal: New Daily Expense (Petty Cash) */}
      {isNewDailyExpenseModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl max-w-xl w-full shadow-2xl border border-slate-200 overflow-hidden" dir="rtl">
            <div className="bg-gradient-to-r from-amber-600 to-amber-700 text-slate-950 p-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Coffee className="w-5 h-5 text-slate-950" />
                <h3 className="font-black text-sm text-slate-950">تسجيل حركة مصروف يومي / نثريات فورية</h3>
              </div>
              <button
                onClick={() => setIsNewDailyExpenseModalOpen(false)}
                className="text-slate-900 hover:text-white font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateDailyExpenseSubmit} className="p-5 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">نوع النثرية والمصروف اليومي *</label>
                  <select
                    value={dailyFormData.type}
                    onChange={e => setDailyFormData({ ...dailyFormData, type: e.target.value as DailyExpenseType })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-bold text-slate-800 focus:ring-2 focus:ring-amber-500 focus:outline-none"
                  >
                    <option value="HOSPITALITY">☕ بوفيه وضيافة واستقبال</option>
                    <option value="TRANSPORT_FUEL">⛽ مواصلات وبترول وانتقالات</option>
                    <option value="OFFICE_SUPPLIES">📄 قرطاسية وأدوات مكتبية ومطبوعات</option>
                    <option value="EMERGENCY_MAINTENANCE">🔧 صيانة طارئة وقطع غيار سريعة</option>
                    <option value="COMMUNICATION">📶 رصيد شحن وباقات إنترنت</option>
                    <option value="CLEANING">🧼 نظافة ومعقمات ومستلزمات</option>
                    <option value="PETTY_CASH">📦 نثريات متنوعة</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">القسم المستفيد *</label>
                  <select
                    value={dailyFormData.departmentId}
                    onChange={e => setDailyFormData({ ...dailyFormData, departmentId: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-bold text-slate-800 focus:ring-2 focus:ring-amber-500 focus:outline-none"
                  >
                    {departments.map(dept => (
                      <option key={dept.id} value={dept.id}>{dept.nameAr}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">عنوان / بند المصروف اليومي *</label>
                <input
                  type="text"
                  required
                  placeholder="مثال: شراء بن وشاي ومياه لضيافة الإدارة، بنزين سيارة التوزيع، أحبار طابعة..."
                  value={dailyFormData.title}
                  onChange={e => setDailyFormData({ ...dailyFormData, title: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-bold text-slate-900 focus:ring-2 focus:ring-amber-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">المبلغ (ريال يمني) *</label>
                  <input
                    type="number"
                    min="1"
                    step="any"
                    required
                    placeholder="مثال: 15000"
                    value={dailyFormData.amount}
                    onChange={e => setDailyFormData({ ...dailyFormData, amount: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-black text-amber-700 focus:ring-2 focus:ring-amber-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">الجهة / المستفيد / المحل</label>
                  <input
                    type="text"
                    placeholder="مثال: بوفيه القصر، محطة السلام..."
                    value={dailyFormData.beneficiary}
                    onChange={e => setDailyFormData({ ...dailyFormData, beneficiary: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-amber-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">رقم الفاتورة أو السند الورقي</label>
                  <input
                    type="text"
                    placeholder="مثال: REC-9921"
                    value={dailyFormData.receiptNumber}
                    onChange={e => setDailyFormData({ ...dailyFormData, receiptNumber: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-amber-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">الصندوق المنفذ للصرف *</label>
                  <select
                    value={dailyFormData.pettyCashAccountCode}
                    onChange={e => setDailyFormData({ ...dailyFormData, pettyCashAccountCode: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-bold text-slate-800 focus:ring-2 focus:ring-amber-500 focus:outline-none"
                  >
                    <option value="1111">1111 - الصندوق الرئيسي - الإدارة العامة</option>
                    <option value="1112">1112 - بنك التضامن الإسلامي الدولي (ريال)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">المسدد / المحاسب المسؤول</label>
                  <input
                    type="text"
                    value={dailyFormData.paidBy}
                    onChange={e => setDailyFormData({ ...dailyFormData, paidBy: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-amber-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">تفاصيل وملاحظات إضافية</label>
                <textarea
                  rows={2}
                  placeholder="ملاحظات توضيحية إضافية..."
                  value={dailyFormData.description}
                  onChange={e => setDailyFormData({ ...dailyFormData, description: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-amber-500 focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsNewDailyExpenseModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition cursor-pointer"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs rounded-xl transition shadow flex items-center gap-1.5 cursor-pointer"
                >
                  <Check className="w-4 h-4 text-slate-950" />
                  <span>حفظ وقيد المصروف اليومي</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: New Department */}
      {isNewDepartmentModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-slate-200 overflow-hidden" dir="rtl">
            <div className="bg-indigo-950 text-white p-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Building2 className="w-5 h-5 text-indigo-400" />
                <h3 className="font-black text-sm">إضافة قسم جديد وتحديد الموازنة</h3>
              </div>
              <button
                onClick={() => setIsNewDepartmentModalOpen(false)}
                className="text-slate-400 hover:text-white font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateDepartmentSubmit} className="p-5 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">اسم القسم (بالعربية) *</label>
                  <input
                    type="text"
                    required
                    placeholder="مثال: قسم العلاقات العامة"
                    value={deptFormData.nameAr}
                    onChange={e => setDeptFormData({ ...deptFormData, nameAr: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-bold text-slate-900 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">رمز القسم (Code) *</label>
                  <input
                    type="text"
                    required
                    value={deptFormData.code}
                    onChange={e => setDeptFormData({ ...deptFormData, code: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-mono font-bold text-slate-900 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">المدير المسؤول عن القسم *</label>
                  <input
                    type="text"
                    required
                    placeholder="مثال: أ / فؤاد السقاف"
                    value={deptFormData.managerName}
                    onChange={e => setDeptFormData({ ...deptFormData, managerName: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">رقم الهاتف والتواصل</label>
                  <input
                    type="text"
                    value={deptFormData.managerPhone}
                    onChange={e => setDeptFormData({ ...deptFormData, managerPhone: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">الموازنة الشهرية المعتمدة (ريال) *</label>
                  <input
                    type="number"
                    min="0"
                    step="any"
                    required
                    placeholder="مثال: 2000000"
                    value={deptFormData.allocatedMonthlyBudget}
                    onChange={e => {
                      const val = e.target.value;
                      const num = parseFloat(val) || 0;
                      setDeptFormData({ 
                        ...deptFormData, 
                        allocatedMonthlyBudget: val,
                        allocatedAnnualBudget: (num * 12).toString()
                      });
                    }}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-bold text-indigo-900 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">الموازنة السنوية التقديرية (ريال)</label>
                  <input
                    type="number"
                    min="0"
                    step="any"
                    value={deptFormData.allocatedAnnualBudget}
                    onChange={e => setDeptFormData({ ...deptFormData, allocatedAnnualBudget: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-bold text-slate-700 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">وصف مهام ونطاق القسم</label>
                <textarea
                  rows={2}
                  placeholder="اكتب نبذة عن اختصاصات القسم ومصروفاته التشغيلية..."
                  value={deptFormData.description}
                  onChange={e => setDeptFormData({ ...deptFormData, description: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsNewDepartmentModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition cursor-pointer"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-indigo-900 hover:bg-indigo-800 text-white font-black text-xs rounded-xl transition shadow flex items-center gap-1.5 cursor-pointer"
                >
                  <Check className="w-4 h-4" />
                  <span>حفظ واعتماد القسم</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: New Voucher (Payment / Receipt) */}
      {isNewVoucherModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl border border-slate-200 overflow-hidden" dir="rtl">
            <div className={`p-4 flex items-center justify-between text-white ${
              newVoucherType === 'PAYMENT' ? 'bg-rose-700' : 'bg-emerald-700'
            }`}>
              <div className="flex items-center gap-2">
                <PlusCircle className="w-5 h-5" />
                <h3 className="font-bold text-sm">
                  {newVoucherType === 'PAYMENT' ? 'إصدار سند صرف معتمد (Payment Voucher)' : 'إصدار سند قبض (Receipt Voucher)'}
                </h3>
              </div>
              <button
                onClick={() => setIsNewVoucherModalOpen(false)}
                className="text-white/80 hover:text-white"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateVoucherSubmit} className="p-5 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    {newVoucherType === 'PAYMENT' ? 'يصرف للسيد / الجهة المستفيدة *' : 'استلمنا من السيد / العميل *'}
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="مثال: شركة البركة للتجارة، أ / محمد السقاف..."
                    value={formData.beneficiaryOrPayer}
                    onChange={e => setFormData({ ...formData, beneficiaryOrPayer: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-bold text-slate-900 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">القسم المستفيد *</label>
                  <select
                    value={formData.departmentId}
                    onChange={e => setFormData({ ...formData, departmentId: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-bold text-slate-800 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  >
                    {departments.map(d => (
                      <option key={d.id} value={d.id}>{d.nameAr}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">التصنيف المحاسبي الرئيسي *</label>
                  <select
                    value={formData.categoryId}
                    onChange={e => {
                      const catId = e.target.value;
                      const cat = (newVoucherType === 'PAYMENT' ? expenseCategories : revenueCategories).find(c => c.id === catId);
                      setFormData({ 
                        ...formData, 
                        categoryId: catId,
                        accountCode: cat?.defaultAccountCode || formData.accountCode 
                      });
                    }}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-bold text-slate-800 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  >
                    {(newVoucherType === 'PAYMENT' ? expenseCategories : revenueCategories).map(cat => (
                      <option key={cat.id} value={cat.id}>{cat.nameAr}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">حساب الأستاذ العام المقابل *</label>
                  <select
                    value={formData.accountCode}
                    onChange={e => setFormData({ ...formData, accountCode: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-bold text-slate-800 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  >
                    {accounts.filter(a => a.type === (newVoucherType === 'PAYMENT' ? 'EXPENSE' : 'REVENUE') || a.level >= 3).map(acc => (
                      <option key={acc.code} value={acc.code}>
                        {acc.code} - {acc.nameAr}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">المبلغ الإجمالي (ريال يمني) *</label>
                  <input
                    type="number"
                    min="1"
                    step="any"
                    required
                    placeholder="مثال: 500000"
                    value={formData.amount}
                    onChange={e => setFormData({ ...formData, amount: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-black text-slate-900 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">طريقة الصرف / القبض *</label>
                  <select
                    value={formData.paymentMethod}
                    onChange={e => setFormData({ ...formData, paymentMethod: e.target.value as any })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-bold text-slate-800 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  >
                    <option value="BANK_TRANSFER">تحويل بنكي / إيداع</option>
                    <option value="CASH">نقداً من الخزينة</option>
                    <option value="CHEQUE">شيك مسحوب</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">الخزينة أو البنك المنفذ *</label>
                  <select
                    value={formData.treasuryOrBankCode}
                    onChange={e => setFormData({ ...formData, treasuryOrBankCode: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-bold text-slate-800 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  >
                    <option value="1112">1112 - بنك التضامن الإسلامي الدولي (ريال)</option>
                    <option value="1111">1111 - الصندوق الرئيسي - الإدارة العامة</option>
                    <option value="1113">1113 - بنك اليمن والكويت (دولار)</option>
                    <option value="1114">1114 - بنك الكريمي للتمويل الأصغر</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">البيان / الشرح المحاسبي التفصيلي *</label>
                <textarea
                  rows={2}
                  required
                  placeholder="اكتب شرحاً وافياً لغرض الصرف أو القبض والمستندات المؤيدة..."
                  value={formData.description}
                  onChange={e => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsNewVoucherModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition cursor-pointer"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className={`px-5 py-2 text-white text-xs font-black rounded-xl transition shadow-md flex items-center gap-2 cursor-pointer ${
                    newVoucherType === 'PAYMENT' ? 'bg-rose-600 hover:bg-rose-500' : 'bg-emerald-600 hover:bg-emerald-500'
                  }`}
                >
                  <Check className="w-4 h-4" />
                  <span>إصدار السند وإحالته للاعتماد</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Dual Control Approval / Rejection */}
      {selectedVoucherForApproval && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-200 overflow-hidden" dir="rtl">
            <div className="bg-indigo-950 text-white p-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-amber-400" />
                <h3 className="font-bold text-sm">اعتماد / رفض السند (الرقابة المزدوجة)</h3>
              </div>
              <button
                onClick={() => setSelectedVoucherForApproval(null)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleApprovalSubmit} className="p-5 space-y-4">
              <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-1.5 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">رقم السند:</span>
                  <span className="font-bold text-slate-900">{selectedVoucherForApproval.voucherNumber}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">الجهة / المستفيد:</span>
                  <span className="font-bold text-slate-900">{selectedVoucherForApproval.beneficiaryOrPayer}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">المبلغ المطلوب:</span>
                  <span className="font-black text-rose-600 text-sm">{selectedVoucherForApproval.amount.toLocaleString()} ريال يمني</span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">قرار المدير المالي *</label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setApprovalActionType('APPROVE')}
                    className={`py-2 px-3 rounded-xl border text-xs font-black flex items-center justify-center gap-1.5 transition cursor-pointer ${
                      approvalActionType === 'APPROVE'
                        ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                        : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <Check className="w-4 h-4" />
                    <span>موافقة واعتماد</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setApprovalActionType('REJECT')}
                    className={`py-2 px-3 rounded-xl border text-xs font-black flex items-center justify-center gap-1.5 transition cursor-pointer ${
                      approvalActionType === 'REJECT'
                        ? 'bg-rose-600 text-white border-rose-600 shadow-sm'
                        : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <X className="w-4 h-4" />
                    <span>رفض السند</span>
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  {approvalActionType === 'APPROVE' ? 'ملاحظات وتوجيهات الاعتماد' : 'سبب الرفض والملاحظات *'}
                </label>
                <textarea
                  rows={3}
                  required={approvalActionType === 'REJECT'}
                  placeholder={approvalActionType === 'APPROVE' ? 'تمت المراجعة والتأكد من مطابقة المستندات...' : 'يرجى توضيح سبب الرفض لمنشئ السند...'}
                  value={approvalNotes}
                  onChange={e => setApprovalNotes(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setSelectedVoucherForApproval(null)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition cursor-pointer"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className={`px-5 py-2 text-white text-xs font-black rounded-xl transition shadow-md flex items-center gap-1.5 cursor-pointer ${
                    approvalActionType === 'APPROVE' ? 'bg-emerald-600 hover:bg-emerald-500' : 'bg-rose-600 hover:bg-rose-500'
                  }`}
                >
                  <span>تأكيد القرار وترحيل القيد</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Comments & Internal Notes Drawer */}
      {selectedVoucherForComments && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[85vh]" dir="rtl">
            <div className="bg-slate-900 text-white p-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-purple-400" />
                <h3 className="font-bold text-sm">الملاحظات والتوجيهات الداخلية ({selectedVoucherForComments.voucherNumber})</h3>
              </div>
              <button
                onClick={() => setSelectedVoucherForComments(null)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <div className="p-4 flex-1 overflow-y-auto space-y-3 divide-y divide-slate-100">
              {selectedVoucherForComments.comments.length === 0 ? (
                <div className="p-8 text-center text-slate-400 text-xs">
                  لا توجد ملاحظات داخلية مسجلة على هذا السند بعد.
                </div>
              ) : (
                selectedVoucherForComments.comments.map(c => (
                  <div key={c.id} className="pt-3 first:pt-0 space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-1.5 font-bold text-slate-800">
                        <span>{c.authorName}</span>
                        <span className="text-[10px] text-purple-600 bg-purple-50 px-1.5 py-0.2 rounded border border-purple-200">
                          {c.authorRole}
                        </span>
                      </div>
                      <span className="text-[10px] text-slate-400">
                        {new Date(c.createdAt).toLocaleTimeString('ar-YE', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 leading-relaxed bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                      {c.text}
                    </p>
                  </div>
                ))
              )}
            </div>

            <form onSubmit={handleAddCommentSubmit} className="p-3 border-t border-slate-200 bg-slate-50 flex items-center gap-2">
              <input
                type="text"
                required
                placeholder="اكتب ملاحظة أو توجيهاً داخلياً..."
                value={newCommentText}
                onChange={e => setNewCommentText(e.target.value)}
                className="flex-1 px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-purple-500 focus:outline-none"
              />
              <button
                type="submit"
                className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs rounded-xl transition flex items-center gap-1.5 shrink-0 cursor-pointer"
              >
                <Send className="w-3.5 h-3.5" />
                <span>إرسال</span>
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Official Printable Voucher */}
      {selectedVoucherForPrint && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]" dir="rtl">
            <div className="bg-slate-900 text-white p-3.5 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Printer className="w-4 h-4 text-emerald-400" />
                <span className="font-bold text-xs">معاينة وطباعة السند المالي الرسمي</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => window.print()}
                  className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black px-3 py-1 rounded-lg transition flex items-center gap-1 cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>طباعة (A4)</span>
                </button>
                <button
                  onClick={() => setSelectedVoucherForPrint(null)}
                  className="text-slate-400 hover:text-white"
                >
                  ✕
                </button>
              </div>
            </div>

            <div className="p-8 overflow-y-auto space-y-6 text-slate-800 bg-white" id="printable-voucher">
              <div className="flex items-start justify-between border-b-2 border-slate-900 pb-4">
                <div className="space-y-1">
                  <CompanyHeaderView align="right" size="sm" />
                  <p className="text-xs text-slate-600">{companyProfile.nameEn}</p>
                  <p className="text-[11px] text-slate-500 mt-1">الرقم الضريبي: {companyProfile.taxNumber} | السجل: {companyProfile.commercialRegister}</p>
                </div>
                <div className="text-left">
                  <div className="inline-block border-2 border-slate-900 px-3 py-1 rounded-lg text-center">
                    <span className="text-sm font-black block">
                      {selectedVoucherForPrint.type === 'PAYMENT' ? 'سند صرف مالي' : 'سند قبض مالي'}
                    </span>
                    <span className="text-xs font-mono font-bold">{selectedVoucherForPrint.voucherNumber}</span>
                  </div>
                  <div className="text-[10px] text-slate-500 mt-1">التاريخ: {selectedVoucherForPrint.date}</div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 text-xs">
                <div className="border border-slate-200 p-2.5 rounded-lg bg-slate-50">
                  <span className="text-slate-500 block text-[10px]">المبلغ بالأرقام:</span>
                  <span className="font-black text-sm text-slate-950">{selectedVoucherForPrint.amount.toLocaleString()} ريال يمني</span>
                </div>
                <div className="border border-slate-200 p-2.5 rounded-lg bg-slate-50">
                  <span className="text-slate-500 block text-[10px]">طريقة المعاملة:</span>
                  <span className="font-bold text-slate-900">
                    {selectedVoucherForPrint.paymentMethod === 'CASH' ? 'نقداً من الصندوق' : 'تحويل / شيك بنكي'} ({selectedVoucherForPrint.treasuryOrBankName})
                  </span>
                </div>
              </div>

              <div className="space-y-3 text-xs border border-slate-200 p-4 rounded-xl">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-slate-600 w-24">
                    {selectedVoucherForPrint.type === 'PAYMENT' ? 'يصرف للسيد/ة:' : 'استلمنا من السيد/ة:'}
                  </span>
                  <span className="font-black text-slate-900 border-b border-dotted border-slate-400 flex-1 pb-1">
                    {selectedVoucherForPrint.beneficiaryOrPayer}
                  </span>
                </div>

                {selectedVoucherForPrint.departmentName && (
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-600 w-24">القسم المستفيد:</span>
                    <span className="font-bold text-indigo-900 border-b border-dotted border-slate-400 flex-1 pb-1">
                      {selectedVoucherForPrint.departmentName}
                    </span>
                  </div>
                )}

                <div className="flex items-center gap-2">
                  <span className="font-bold text-slate-600 w-24">حساب الأستاذ:</span>
                  <span className="font-medium text-slate-800 border-b border-dotted border-slate-400 flex-1 pb-1">
                    {selectedVoucherForPrint.accountCode} - {selectedVoucherForPrint.accountName} (تصنيف: {selectedVoucherForPrint.categoryName})
                  </span>
                </div>

                <div className="flex items-start gap-2">
                  <span className="font-bold text-slate-600 w-24 shrink-0">وذلك عن بيان:</span>
                  <span className="font-medium text-slate-800 leading-relaxed border-b border-dotted border-slate-400 flex-1 pb-1">
                    {selectedVoucherForPrint.description}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4 pt-6 border-t border-slate-300 text-center text-xs">
                <div className="space-y-6">
                  <span className="font-bold text-slate-700 block">إعداد المنشئ / المحاسب</span>
                  <div className="text-[11px] font-medium text-slate-600">{selectedVoucherForPrint.createdBy.name}</div>
                  <div className="border-b border-slate-400 w-32 mx-auto"></div>
                </div>

                <div className="space-y-6">
                  <span className="font-bold text-slate-700 block">المراجعة والتدقيق المالي</span>
                  <div className="text-[11px] font-medium text-slate-600">الإدارة المالية</div>
                  <div className="border-b border-slate-400 w-32 mx-auto"></div>
                </div>

                <div className="space-y-6">
                  <span className="font-bold text-slate-700 block">اعتماد المدير المالي (CFO)</span>
                  <div className="text-[11px] font-bold text-emerald-700">
                    {selectedVoucherForPrint.approvedBy?.name || 'مطلوب الاعتماد'}
                  </div>
                  <div className="border-b border-slate-400 w-32 mx-auto"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Printable Daily Receipt */}
      {selectedDailyForPrint && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-200 overflow-hidden flex flex-col" dir="rtl">
            <div className="bg-amber-600 text-slate-950 p-3.5 flex items-center justify-between font-black text-xs">
              <div className="flex items-center gap-2">
                <Coffee className="w-4 h-4" />
                <span>إيصال صرف نثريات ومصروفات يومية</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => window.print()}
                  className="bg-slate-950 text-amber-300 text-xs font-black px-3 py-1 rounded-lg transition flex items-center gap-1 cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>طباعة</span>
                </button>
                <button
                  onClick={() => setSelectedDailyForPrint(null)}
                  className="text-slate-950 hover:text-white"
                >
                  ✕
                </button>
              </div>
            </div>

            <div className="p-6 space-y-4 text-slate-800 bg-white text-xs">
              <div className="text-center border-b border-slate-200 pb-3 space-y-1">
                <CompanyHeaderView size="sm" />
                <span className="text-[10px] text-slate-500">إيصال تسوية عهدة ونثريات نقدية</span>
                <div className="font-mono font-bold text-amber-800 mt-1">{selectedDailyForPrint.voucherNumber}</div>
              </div>

              <div className="space-y-2 border border-slate-200 p-3 rounded-xl bg-slate-50">
                <div className="flex justify-between">
                  <span className="text-slate-500">التاريخ والوقت:</span>
                  <span className="font-bold text-slate-800">{selectedDailyForPrint.date} {selectedDailyForPrint.time || ''}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">القسم:</span>
                  <span className="font-bold text-indigo-900">{selectedDailyForPrint.departmentName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">البند:</span>
                  <span className="font-bold text-slate-900">{selectedDailyForPrint.title}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">المستفيد:</span>
                  <span className="font-medium text-slate-800">{selectedDailyForPrint.beneficiary}</span>
                </div>
                <div className="flex justify-between border-t border-slate-200 pt-2">
                  <span className="font-bold text-slate-700">المبلغ المدفوع:</span>
                  <span className="font-black text-base text-amber-700">{selectedDailyForPrint.amount.toLocaleString()} ريال</span>
                </div>
              </div>

              <div className="text-[11px] text-slate-600 bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                <span className="font-bold block mb-1">البيان:</span>
                {selectedDailyForPrint.description}
              </div>

              <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-200 text-center">
                <div>
                  <span className="font-bold text-slate-700 block text-[11px]">المستلم / المستفيد</span>
                  <div className="border-b border-slate-300 w-24 mx-auto mt-6"></div>
                </div>
                <div>
                  <span className="font-bold text-slate-700 block text-[11px]">أمين صندوق النثريات</span>
                  <div className="border-b border-slate-300 w-24 mx-auto mt-6"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
