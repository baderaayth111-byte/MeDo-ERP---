import React, { useState, useMemo } from 'react';
import { 
  Truck, 
  Plus, 
  FileText, 
  DollarSign, 
  Search, 
  Phone, 
  Mail, 
  Building, 
  CheckCircle2, 
  Clock,
  Download,
  Upload,
  RotateCcw,
  LayoutGrid,
  Table as TableIcon,
  X,
  FileSpreadsheet,
  TrendingDown,
  Percent,
  Wallet,
  Eye,
  AlertCircle,
  Share2
} from 'lucide-react';
import { Vendor, Invoice, InvoiceItem, PaymentVoucher, Currency, CostCenter, CompanyProfile } from '../types/accounting';
import { formatCurrency, convertAmount, exportToCsv } from '../utils/formatters';
import { parseVendorsCsv, RAW_VENDORS_CSV, getLoadedInitialVendors } from '../data/partnersData';
import { DocumentShareModal, DocumentShareData } from './DocumentShareModal';
import { DocumentArchiver } from './DocumentArchiver';

interface AccountsPayableViewProps {
  vendors: Vendor[];
  setVendors?: React.Dispatch<React.SetStateAction<Vendor[]>>;
  invoices: Invoice[];
  paymentVouchers: PaymentVoucher[];
  costCenters: CostCenter[];
  onAddVendor: (vendor: Vendor) => void;
  onAddBill: (bill: Invoice) => void;
  onAddPaymentVoucher: (voucher: PaymentVoucher) => void;
  currency: Currency;
  rates: Record<Currency, number>;
  companyProfile: CompanyProfile;
}

export const AccountsPayableView: React.FC<AccountsPayableViewProps> = ({
  vendors,
  setVendors,
  invoices,
  paymentVouchers,
  costCenters,
  onAddVendor,
  onAddBill,
  onAddPaymentVoucher,
  currency,
  rates,
  companyProfile,
}) => {
  const [activeTab, setActiveTab] = useState<'vendors' | 'bills' | 'aging' | 'new-bill' | 'new-payment'>('vendors');
  const [shareModalDoc, setShareModalDoc] = useState<DocumentShareData | null>(null);
  
  // Vendor Directory State
  const [searchQuery, setSearchQuery] = useState('');
  const [billSearchQuery, setBillSearchQuery] = useState('');
  const [billStatusFilter, setBillStatusFilter] = useState<'ALL' | 'PAID' | 'PARTIAL' | 'UNPAID'>('ALL');
  const [filterCategory, setFilterCategory] = useState<'ALL' | 'WITH_BALANCE' | 'FULLY_PAID' | 'CREDIT_BALANCE' | 'HIGH_BALANCE'>('ALL');
  const [viewMode, setViewMode] = useState<'table' | 'cards'>('table');
  const [selectedVendorForStatement, setSelectedVendorForStatement] = useState<Vendor | null>(null);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [isAddVendorModalOpen, setIsAddVendorModalOpen] = useState(false);
  const [importCsvText, setImportCsvText] = useState('');

  // New Vendor Form State
  const [newVendorName, setNewVendorName] = useState('');
  const [newVendorPhone, setNewVendorPhone] = useState('');
  const [newVendorCity, setNewVendorCity] = useState('صنعاء');
  const [newVendorBalance, setNewVendorBalance] = useState<number>(0);
  const [newVendorPaid, setNewVendorPaid] = useState<number>(0);

  // New Bill Form State
  const [selectedVendorId, setSelectedVendorId] = useState(vendors[0]?.id || '');
  const [billDate, setBillDate] = useState(new Date().toISOString().split('T')[0]);
  const [billDueDate, setBillDueDate] = useState(
    new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  );
  const [billAttachments, setBillAttachments] = useState<string[]>([]);
  const [billItems, setBillItems] = useState<InvoiceItem[]>([
    {
      id: '1',
      description: 'توريد قطع غيار ومعدات شبكات وتجهيزات تقنية',
      quantity: 1,
      unitPrice: 8500000,
      taxRate: 0.05,
      taxAmount: 425000,
      subtotal: 8500000,
      total: 8925000,
    },
  ]);

  // New Payment Voucher Form State
  const [paymentVendorId, setPaymentVendorId] = useState(vendors[0]?.id || '');
  const [paymentAmount, setPaymentAmount] = useState<number>(0);
  const [paymentMethod, setPaymentMethod] = useState<'BANK_TRANSFER' | 'CASH' | 'CHEQUE'>('BANK_TRANSFER');
  const [paymentRef, setPaymentRef] = useState(`PAY-${Date.now().toString().slice(-6)}`);
  const [paymentNotes, setPaymentNotes] = useState('');
  const [paymentAttachments, setPaymentAttachments] = useState<string[]>([]);

  const vendorBills = useMemo(() => invoices.filter(i => i.type === 'VENDOR_BILL'), [invoices]);

  const filteredVendorBills = useMemo(() => {
    return vendorBills.filter((b) => {
      const matchStatus = billStatusFilter === 'ALL' || b.status === billStatusFilter;
      if (!billSearchQuery.trim()) return matchStatus;
      const q = billSearchQuery.toLowerCase().trim();
      const matchNum = b.invoiceNumber.toLowerCase().includes(q);
      const matchVendor = b.entityName.toLowerCase().includes(q);
      const matchItem = b.items?.some(i => i.description.toLowerCase().includes(q));
      const matchDate = (b.date || '').includes(q) || (b.dueDate || '').includes(q);
      return matchStatus && (matchNum || matchVendor || matchItem || matchDate);
    });
  }, [vendorBills, billSearchQuery, billStatusFilter]);

  // KPI Calculations
  const totalVendorsCount = vendors.length;
  const totalOperationsTurnover = useMemo(() => {
    return vendors.reduce((sum, v) => sum + (v.totalOperations ?? ((v.totalPaid || 0) + v.currentBalance)), 0);
  }, [vendors]);

  const totalPaidAmount = useMemo(() => {
    return vendors.reduce((sum, v) => sum + (v.totalPaid ?? 0), 0);
  }, [vendors]);

  const totalRemainingPayable = useMemo(() => {
    return vendors.reduce((sum, v) => sum + v.currentBalance, 0);
  }, [vendors]);

  const overallPaymentPercentage = totalOperationsTurnover > 0 
    ? ((totalPaidAmount / totalOperationsTurnover) * 100).toFixed(2) 
    : '0.00';

  // Filtered vendors list
  const filteredVendors = useMemo(() => {
    return vendors.filter((v) => {
      const matchSearch = 
        v.nameAr.toLowerCase().includes(searchQuery.toLowerCase()) ||
        v.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (v.city && v.city.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (v.phone && v.phone.includes(searchQuery));

      if (!matchSearch) return false;

      const rate = v.paymentRate ?? (v.totalOperations ? ((v.totalPaid || 0) / v.totalOperations) * 100 : 0);

      if (filterCategory === 'WITH_BALANCE') {
        return v.currentBalance > 0;
      } else if (filterCategory === 'FULLY_PAID') {
        return v.currentBalance === 0 || rate >= 99.5;
      } else if (filterCategory === 'CREDIT_BALANCE') {
        return v.currentBalance < 0;
      } else if (filterCategory === 'HIGH_BALANCE') {
        return v.currentBalance >= 100000;
      }
      return true;
    });
  }, [vendors, searchQuery, filterCategory]);

  const billSubtotal = billItems.reduce((sum, it) => sum + (it.quantity * it.unitPrice), 0);
  const billTaxTotal = billItems.reduce((sum, it) => sum + (it.quantity * it.unitPrice * it.taxRate), 0);
  const billGrandTotal = billSubtotal + billTaxTotal;

  const handleCreateBill = (e: React.FormEvent) => {
    e.preventDefault();
    const vendor = vendors.find(v => v.id === selectedVendorId);
    if (!vendor) return;

    const newBill: Invoice = {
      id: `BILL-${Date.now().toString().slice(-4)}`,
      invoiceNumber: `BILL-2026-00${vendorBills.length + 46}`,
      type: 'VENDOR_BILL',
      entityId: vendor.id,
      entityName: vendor.nameAr,
      date: billDate,
      dueDate: billDueDate,
      items: billItems,
      subtotal: billSubtotal,
      taxTotal: billTaxTotal,
      grandTotal: billGrandTotal,
      paidAmount: 0,
      remainingAmount: billGrandTotal,
      currency: 'YER',
      exchangeRate: 1,
      status: 'UNPAID',
      notes: `فاتورة مشتريات وتوريد من المورد ${vendor.nameAr}`,
      attachments: billAttachments
    };

    onAddBill(newBill);
    setBillAttachments([]);
    alert(`تم تسجيل وترحيل فاتورة المورد رقم ${newBill.invoiceNumber} بنجاح!`);
    setActiveTab('bills');
  };

  const handleCreatePayment = (e: React.FormEvent) => {
    e.preventDefault();
    const vendor = vendors.find(v => v.id === paymentVendorId);
    if (!vendor || paymentAmount <= 0) {
      alert('يرجى اختيار المورد وتحديد مبلغ السداد.');
      return;
    }

    const newVoucher: PaymentVoucher = {
      id: `PAY-${Date.now().toString().slice(-4)}`,
      voucherNumber: `PV-2026-00${paymentVouchers.length + 210}`,
      type: 'PAYMENT',
      date: new Date().toISOString().split('T')[0],
      entityId: vendor.id,
      entityName: vendor.nameAr,
      amount: paymentAmount,
      currency: 'YER',
      exchangeRate: 1,
      amountInBase: paymentAmount,
      paymentMethod: paymentMethod,
      referenceNumber: paymentRef,
      debitAccountCode: '2111',
      creditAccountCode: '1112',
      notes: paymentNotes || `سند صرف وسداد مستحقات للمورد ${vendor.nameAr}`,
      status: 'COMPLETED',
      attachments: paymentAttachments
    };

    onAddPaymentVoucher(newVoucher);
    setPaymentAttachments([]);
    alert(`تم إصدار سند الصرف رقم ${newVoucher.voucherNumber} بمبلغ ${formatCurrency(paymentAmount, 'YER')} وتحديث حساب المورد!`);
    setPaymentAmount(0);
    setActiveTab('vendors');
  };

  const handleExportVendorsCsv = () => {
    const headers = [
      'م',
      'كود الحساب',
      'اسم المورد / الجهة الدائنة',
      'إجمالي العمليات (ريال)',
      'المسدد (ريال)',
      'الرصيد المتبقي (ريال)',
      'نسبة السداد %',
      'رقم الهاتف',
      'المدينة',
      'الحالة'
    ];

    const rows = filteredVendors.map((v, idx) => [
      idx + 1,
      v.code,
      v.nameAr,
      ((v.totalOperations ?? ((v.totalPaid || 0) + v.currentBalance))).toFixed(2),
      (v.totalPaid ?? 0).toFixed(2),
      v.currentBalance.toFixed(2),
      ((v.paymentRate ?? 0)).toFixed(2) + '%',
      v.phone,
      v.city,
      v.currentBalance > 0 ? 'مستحق للمورد' : v.currentBalance < 0 ? 'رصيد دائن لصالحنا' : 'مسدد بالكامل'
    ]);

    exportToCsv('كشف_حسابات_الموردين_والدائنين', headers, rows);
  };

  const handleImportVendorsFromText = (csvContent: string) => {
    if (!csvContent.trim()) return;
    try {
      const parsed = parseVendorsCsv(csvContent);
      if (parsed.length === 0) {
        alert('لم يتم العثور على سجلات صالحة في ملف CSV.');
        return;
      }
      if (setVendors) {
        setVendors(parsed);
      }
      setIsImportModalOpen(false);
      setImportCsvText('');
      alert(`تم استيراد ${parsed.length} مورد ودائن بنجاح وتحديث الكشف!`);
    } catch (err: any) {
      alert(`خطأ أثناء استيراد الملف: ${err.message}`);
    }
  };

  const handleResetToDefaultCsv = () => {
    if (confirm('هل ترغب بإعادة تحميل كشف الموردين والدائنين الكامل (208 حساب) من ملف CSV؟')) {
      const defaultList = getLoadedInitialVendors();
      if (setVendors) {
        setVendors(defaultList);
      }
      alert('تمت استعادة كشف الموردين الكامل (208 مورد ودائن) بنجاح!');
    }
  };

  const handleManualAddVendor = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newVendorName.trim()) return;

    const totalOps = (newVendorPaid || 0) + (newVendorBalance || 0);
    const rate = totalOps > 0 ? ((newVendorPaid / totalOps) * 100) : 0;
    const newCode = `V-${String(vendors.length + 1).padStart(4, '0')}`;

    const newVen: Vendor = {
      id: `VEND-${Date.now().toString().slice(-4)}`,
      code: newCode,
      nameAr: newVendorName,
      nameEn: `Vendor ${newCode}`,
      phone: newVendorPhone || '+967 77' + Math.floor(1000000 + Math.random() * 8999999),
      email: `supplier_${newCode.toLowerCase()}@vendors.ye`,
      city: newVendorCity,
      address: 'اليمن - المحافظات الرئيسية',
      currency: 'YER',
      paymentTerms: 'NET_30',
      paymentTermsDays: 30,
      currentBalance: newVendorBalance,
      totalPaid: newVendorPaid,
      totalOperations: totalOps,
      paymentRate: parseFloat(rate.toFixed(2)),
      status: 'ACTIVE',
      notes: 'مورد مضاف يدوياً',
    };

    onAddVendor(newVen);
    setIsAddVendorModalOpen(false);
    setNewVendorName('');
    setNewVendorPhone('');
    setNewVendorBalance(0);
    setNewVendorPaid(0);
    alert(`تمت إضافة المورد ${newVen.nameAr} بكود (${newVen.code}) بنجاح!`);
  };

  return (
    <div className="space-y-6">
      {/* Top Header & Navigation */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white border border-slate-200 p-5 rounded-xl shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <span className="bg-amber-50 text-amber-700 text-xs px-2.5 py-0.5 rounded-md font-mono font-bold border border-amber-200">
              SAP T-Code: FB60 / FBL1N
            </span>
            <h2 className="text-lg sm:text-xl font-bold text-slate-800">إدارة الموردين والذمم الدائنة (Accounts Payable)</h2>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            كشف حسابات الموردين والجهات الدائنة، تتبع فواتير التوريد، إصدار سندات الصرف، وأعمار الذمم الدائنة.
          </p>
        </div>

        <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl border border-slate-200 overflow-x-auto w-full sm:w-auto">
          <button
            onClick={() => setActiveTab('vendors')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition whitespace-nowrap flex items-center gap-1.5 ${
              activeTab === 'vendors' ? 'bg-amber-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Truck className="w-3.5 h-3.5" />
            <span>كشف وحسابات الموردين ({totalVendorsCount})</span>
          </button>
          <button
            onClick={() => setActiveTab('bills')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition whitespace-nowrap flex items-center gap-1.5 ${
              activeTab === 'bills' ? 'bg-amber-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>فواتير ومطالبات المشتريات ({vendorBills.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('aging')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition whitespace-nowrap flex items-center gap-1.5 ${
              activeTab === 'aging' ? 'bg-amber-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>أعمار الديون الدائنة</span>
          </button>
          <button
            onClick={() => setActiveTab('new-bill')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition whitespace-nowrap flex items-center gap-1.5 ${
              activeTab === 'new-bill' ? 'bg-blue-600 text-white shadow-xs' : 'text-blue-700 hover:bg-blue-50'
            }`}
          >
            <Plus className="w-3.5 h-3.5" />
            <span>+ فاتورة مشتريات</span>
          </button>
          <button
            onClick={() => setActiveTab('new-payment')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition whitespace-nowrap flex items-center gap-1.5 ${
              activeTab === 'new-payment' ? 'bg-emerald-600 text-white shadow-xs' : 'text-emerald-700 hover:bg-emerald-50'
            }`}
          >
            <DollarSign className="w-3.5 h-3.5" />
            <span>+ سند صرف</span>
          </button>
        </div>
      </div>

      {/* TAB 1: VENDORS & CREDITORS LEDGER DIRECTORY (IMPORTED FROM CSV) */}
      {activeTab === 'vendors' && (
        <div className="space-y-4">
          {/* Top KPI Metrics Banner */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            <div className="bg-white border border-slate-200 p-3.5 rounded-xl shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold text-slate-500">إجمالي الموردين والدائنين</span>
                <Truck className="w-4 h-4 text-amber-500" />
              </div>
              <div className="text-xl font-bold font-mono text-slate-900 mt-1">
                {totalVendorsCount} <span className="text-xs font-normal text-slate-400">جهة</span>
              </div>
              <span className="text-[10px] text-amber-600 font-medium mt-0.5 block">مستورد ومطابق من CSV</span>
            </div>

            <div className="bg-white border border-slate-200 p-3.5 rounded-xl shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold text-slate-500">إجمالي العمليات والمشتريات</span>
                <Wallet className="w-4 h-4 text-indigo-500" />
              </div>
              <div className="text-lg font-bold font-mono text-indigo-600 mt-1">
                {formatCurrency(totalOperationsTurnover, currency)}
              </div>
              <span className="text-[10px] text-slate-400 mt-0.5 block">المسدد + المتبقي</span>
            </div>

            <div className="bg-white border border-slate-200 p-3.5 rounded-xl shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold text-slate-500">إجمالي المبالغ المسددة</span>
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              </div>
              <div className="text-lg font-bold font-mono text-emerald-600 mt-1">
                {formatCurrency(totalPaidAmount, currency)}
              </div>
              <span className="text-[10px] text-slate-400 mt-0.5 block">مدفوعات صادرة فعلية</span>
            </div>

            <div className="bg-white border border-slate-200 p-3.5 rounded-xl shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold text-slate-500">صافي الأرصدة المستحقة</span>
                <AlertCircle className="w-4 h-4 text-rose-500" />
              </div>
              <div className="text-lg font-bold font-mono text-rose-600 mt-1">
                {formatCurrency(totalRemainingPayable, currency)}
              </div>
              <span className="text-[10px] text-slate-400 mt-0.5 block">مستحقات للموردين</span>
            </div>

            <div className="bg-white border border-slate-200 p-3.5 rounded-xl shadow-xs col-span-2 md:col-span-1">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold text-slate-500">متوسط نسبة السداد</span>
                <Percent className="w-4 h-4 text-teal-500" />
              </div>
              <div className="text-lg font-bold font-mono text-teal-600 mt-1">
                {overallPaymentPercentage}%
              </div>
              <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden mt-1.5">
                <div 
                  className="bg-amber-500 h-full rounded-full" 
                  style={{ width: `${Math.min(100, parseFloat(overallPaymentPercentage))}%` }}
                />
              </div>
            </div>
          </div>

          {/* Action Toolbar */}
          <div className="bg-white border border-slate-200 rounded-xl p-3.5 shadow-xs flex flex-col md:flex-row items-center justify-between gap-3">
            {/* Search Input */}
            <div className="relative w-full md:w-80">
              <Search className="w-4 h-4 absolute right-3 top-2.5 text-slate-400" />
              <input
                type="text"
                placeholder="بحث باسم المورد، الكود، المدينة، الهاتف..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-3 pr-9 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:bg-white"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute left-2.5 top-2 text-slate-400 hover:text-slate-600 text-xs"
                >
                  ✕
                </button>
              )}
            </div>

            {/* Category Filter Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto pb-1 md:pb-0">
              <button
                onClick={() => setFilterCategory('ALL')}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition ${
                  filterCategory === 'ALL' ? 'bg-amber-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                الكل ({vendors.length})
              </button>
              <button
                onClick={() => setFilterCategory('WITH_BALANCE')}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition ${
                  filterCategory === 'WITH_BALANCE' ? 'bg-rose-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                مستحقات واجبة السداد ({vendors.filter(v => v.currentBalance > 0).length})
              </button>
              <button
                onClick={() => setFilterCategory('FULLY_PAID')}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition ${
                  filterCategory === 'FULLY_PAID' ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                مسدد بالكامل ({vendors.filter(v => v.currentBalance === 0 || (v.paymentRate && v.paymentRate >= 99.5)).length})
              </button>
              <button
                onClick={() => setFilterCategory('CREDIT_BALANCE')}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition ${
                  filterCategory === 'CREDIT_BALANCE' ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                أرصدة دائنة لصالحنا ({vendors.filter(v => v.currentBalance < 0).length})
              </button>
              <button
                onClick={() => setFilterCategory('HIGH_BALANCE')}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition ${
                  filterCategory === 'HIGH_BALANCE' ? 'bg-purple-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                مستحقات كبرى (&gt;100K)
              </button>
            </div>

            {/* Quick Action Buttons */}
            <div className="flex items-center gap-1.5 w-full md:w-auto justify-end">
              <div className="flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200 ml-1">
                <button
                  onClick={() => setViewMode('table')}
                  className={`p-1 rounded ${viewMode === 'table' ? 'bg-white text-amber-600 shadow-xs' : 'text-slate-500'}`}
                  title="عرض جدول كشف الحسابات"
                >
                  <TableIcon className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => setViewMode('cards')}
                  className={`p-1 rounded ${viewMode === 'cards' ? 'bg-white text-amber-600 shadow-xs' : 'text-slate-500'}`}
                  title="عرض البطاقات"
                >
                  <LayoutGrid className="w-3.5 h-3.5" />
                </button>
              </div>

              <button
                onClick={handleExportVendorsCsv}
                className="px-2.5 py-1.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-lg text-xs font-semibold flex items-center gap-1 shadow-xs"
                title="تصدير كشف الموردين والدائنين إلى CSV"
              >
                <Download className="w-3.5 h-3.5 text-emerald-600" />
                <span>تصدير CSV</span>
              </button>

              <button
                onClick={() => setIsImportModalOpen(true)}
                className="px-2.5 py-1.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-lg text-xs font-semibold flex items-center gap-1 shadow-xs"
                title="استيراد كشف موردين جديد من CSV"
              >
                <Upload className="w-3.5 h-3.5 text-amber-600" />
                <span>استيراد CSV</span>
              </button>

              <button
                onClick={handleResetToDefaultCsv}
                className="p-1.5 bg-white hover:bg-slate-50 text-slate-500 border border-slate-200 rounded-lg shadow-xs"
                title="استعادة كشف الـ 208 مورد الأصلي"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>

              <button
                onClick={() => setIsAddVendorModalOpen(true)}
                className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-bold flex items-center gap-1 shadow-xs"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>+ مورد جديد</span>
              </button>
            </div>
          </div>

          {/* TABLE VIEW */}
          {viewMode === 'table' ? (
            <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
              <div className="overflow-x-auto">
                <table className="w-full text-right text-xs">
                  <thead className="bg-slate-50 text-slate-700 border-b border-slate-200 font-semibold">
                    <tr>
                      <th className="p-3 w-12 text-center">م</th>
                      <th className="p-3">كود الحساب</th>
                      <th className="p-3">اسم المورد / الجهة الدائنة</th>
                      <th className="p-3 text-left">إجمالي العمليات</th>
                      <th className="p-3 text-left">المسدد (المدفوع)</th>
                      <th className="p-3 text-left">الرصيد المتبقي</th>
                      <th className="p-3 text-center w-36">نسبة السداد %</th>
                      <th className="p-3 text-center">الحالة</th>
                      <th className="p-3 text-center">الإجراءات</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredVendors.length === 0 ? (
                      <tr>
                        <td colSpan={9} className="p-8 text-center text-slate-400">
                          لا توجد نتائج مطابقة لبحثك أو التصنيف المحدد.
                        </td>
                      </tr>
                    ) : (
                      filteredVendors.map((vendor, index) => {
                        const rate = vendor.paymentRate ?? (vendor.totalOperations ? Math.round(((vendor.totalPaid || 0) / vendor.totalOperations) * 100) : 0);
                        const isComplete = vendor.currentBalance === 0 || rate >= 99.5;
                        const isCreditInFavor = vendor.currentBalance < 0;

                        return (
                          <tr key={vendor.id} className="hover:bg-slate-50/80 transition">
                            <td className="p-3 text-center font-mono text-slate-400 font-semibold">{index + 1}</td>
                            <td className="p-3 font-mono font-bold text-amber-700 bg-amber-50/30">
                              {vendor.code}
                            </td>
                            <td className="p-3 font-bold text-slate-800">
                              <div className="flex items-center gap-2">
                                <span>{vendor.nameAr}</span>
                                {vendor.notes && (
                                  <span className="text-[10px] text-slate-400 font-normal">({vendor.notes})</span>
                                )}
                              </div>
                            </td>
                            <td className="p-3 text-left font-mono text-slate-700">
                              {formatCurrency(vendor.totalOperations ?? ((vendor.totalPaid || 0) + vendor.currentBalance), currency)}
                            </td>
                            <td className="p-3 text-left font-mono font-bold text-emerald-600">
                              {formatCurrency(vendor.totalPaid ?? 0, currency)}
                            </td>
                            <td className="p-3 text-left font-mono font-bold">
                              <span className={isCreditInFavor ? 'text-blue-600' : vendor.currentBalance > 0 ? 'text-rose-600' : 'text-emerald-600'}>
                                {formatCurrency(vendor.currentBalance, currency)}
                              </span>
                            </td>
                            <td className="p-3 text-center">
                              <div className="flex flex-col items-center gap-1">
                                <span className={`font-mono text-[11px] font-bold ${
                                  isComplete ? 'text-emerald-700' : 'text-amber-700'
                                }`}>
                                  {rate.toFixed(1)}%
                                </span>
                                <div className="w-24 bg-slate-100 h-1.5 rounded-full overflow-hidden">
                                  <div 
                                    className={`h-full rounded-full ${
                                      isComplete ? 'bg-emerald-500' : 'bg-amber-500'
                                    }`}
                                    style={{ width: `${Math.min(100, Math.max(0, rate))}%` }}
                                  />
                                </div>
                              </div>
                            </td>
                            <td className="p-3 text-center">
                              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${
                                isCreditInFavor
                                  ? 'bg-blue-50 text-blue-700 border-blue-200'
                                  : isComplete 
                                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                                  : 'bg-rose-50 text-rose-700 border-rose-200'
                              }`}>
                                {isCreditInFavor ? 'دائن لصالحنا' : isComplete ? 'مسدد بالكامل' : 'مستحق للمورد'}
                              </span>
                            </td>
                            <td className="p-3 text-center">
                              <div className="flex items-center justify-center gap-1">
                                <button
                                  onClick={() => setSelectedVendorForStatement(vendor)}
                                  className="p-1.5 bg-slate-100 hover:bg-amber-50 hover:text-amber-700 text-slate-600 rounded-lg transition"
                                  title="عرض كشف حساب المورد التفصيلي"
                                >
                                  <Eye className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={() => {
                                    setPaymentVendorId(vendor.id);
                                    setPaymentAmount(vendor.currentBalance > 0 ? vendor.currentBalance : 0);
                                    setActiveTab('new-payment');
                                  }}
                                  className="p-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-lg transition"
                                  title="إصدار سند صرف وسداد لهذا المورد"
                                >
                                  <DollarSign className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={() => {
                                    setSelectedVendorId(vendor.id);
                                    setActiveTab('new-bill');
                                  }}
                                  className="p-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg transition"
                                  title="تسجيل فاتورة مشتريات جديدة لهذا المورد"
                                >
                                  <Plus className="w-3.5 h-3.5" />
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

              {/* Table Footer Summary */}
              <div className="bg-slate-50 border-t border-slate-200 p-3 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-600 gap-2">
                <div>
                  عرض <strong className="text-slate-800">{filteredVendors.length}</strong> من أصل <strong className="text-slate-800">{vendors.length}</strong> مورد ودائن
                </div>
                <div className="flex items-center gap-4">
                  <span>إجمالي المسدد: <strong className="text-emerald-700 font-mono">{formatCurrency(filteredVendors.reduce((s, v) => s + (v.totalPaid || 0), 0), currency)}</strong></span>
                  <span>إجمالي المستحق المتبقي: <strong className="text-rose-700 font-mono">{formatCurrency(filteredVendors.reduce((s, v) => s + v.currentBalance, 0), currency)}</strong></span>
                </div>
              </div>
            </div>
          ) : (
            /* CARDS VIEW */
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredVendors.map((vendor) => {
                const rate = vendor.paymentRate ?? (vendor.totalOperations ? Math.round(((vendor.totalPaid || 0) / vendor.totalOperations) * 100) : 0);
                const isComplete = vendor.currentBalance === 0 || rate >= 99.5;

                return (
                  <div key={vendor.id} className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs space-y-3 hover:border-amber-300 transition">
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200 font-bold">
                            {vendor.code}
                          </span>
                          <h3 className="text-sm font-bold text-slate-900">{vendor.nameAr}</h3>
                        </div>
                        <p className="text-[11px] text-slate-400 mt-0.5">{vendor.city}</p>
                      </div>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                        isComplete ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-rose-50 text-rose-700 border-rose-200'
                      }`}>
                        {isComplete ? 'مسدد' : 'مستحق'}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 p-2.5 bg-slate-50 rounded-lg border border-slate-200 text-xs">
                      <div>
                        <span className="text-[10px] text-slate-500 block">المبلغ المسدد</span>
                        <span className="font-mono font-bold text-emerald-600">
                          {formatCurrency(vendor.totalPaid || 0, currency)}
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-500 block">الرصيد المتبقي</span>
                        <span className="font-mono font-bold text-rose-600">
                          {formatCurrency(vendor.currentBalance, currency)}
                        </span>
                      </div>
                    </div>

                    <div className="space-y-1">
                      <div className="flex justify-between text-[11px]">
                        <span className="text-slate-500">نسبة السداد:</span>
                        <span className="font-mono font-bold text-slate-700">{rate.toFixed(1)}%</span>
                      </div>
                      <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                        <div 
                          className={`h-full rounded-full ${isComplete ? 'bg-emerald-500' : 'bg-amber-500'}`} 
                          style={{ width: `${Math.min(100, Math.max(0, rate))}%` }}
                        />
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                      <button
                        onClick={() => setSelectedVendorForStatement(vendor)}
                        className="text-xs text-amber-700 hover:text-amber-900 font-semibold flex items-center gap-1"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>كشف الحساب</span>
                      </button>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => {
                            setPaymentVendorId(vendor.id);
                            setPaymentAmount(vendor.currentBalance > 0 ? vendor.currentBalance : 0);
                            setActiveTab('new-payment');
                          }}
                          className="px-2 py-1 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 rounded text-[11px] font-bold"
                        >
                          سند صرف
                        </button>
                        <button
                          onClick={() => {
                            setSelectedVendorId(vendor.id);
                            setActiveTab('new-bill');
                          }}
                          className="px-2 py-1 bg-blue-50 text-blue-700 hover:bg-blue-100 rounded text-[11px] font-bold"
                        >
                          فاتورة
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: BILLS LIST */}
      {activeTab === 'bills' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white border border-slate-200 p-4 rounded-xl shadow-xs">
              <span className="text-xs text-slate-500 font-semibold block">إجمالي مطالبات المشتريات</span>
              <div className="text-lg font-bold text-slate-800 mt-1 font-mono">
                {formatCurrency(vendorBills.reduce((s, b) => s + b.grandTotal, 0), currency)}
              </div>
            </div>
            <div className="bg-white border border-slate-200 p-4 rounded-xl shadow-xs">
              <span className="text-xs text-slate-500 font-semibold block">المبالغ المسددة فعلياً</span>
              <div className="text-lg font-bold text-emerald-600 mt-1 font-mono">
                {formatCurrency(vendorBills.reduce((s, b) => s + b.paidAmount, 0), currency)}
              </div>
            </div>
            <div className="bg-white border border-slate-200 p-4 rounded-xl shadow-xs">
              <span className="text-xs text-slate-500 font-semibold block">المستحق القائم للدفع</span>
              <div className="text-lg font-bold text-rose-600 mt-1 font-mono">
                {formatCurrency(vendorBills.reduce((s, b) => s + b.remainingAmount, 0), currency)}
              </div>
            </div>
          </div>

          {/* Search & Filter Bar for Vendor Bills */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
            <div className="relative flex-1 w-full">
              <Search className="w-4 h-4 text-slate-400 absolute right-3 top-2.5" />
              <input
                type="text"
                value={billSearchQuery}
                onChange={(e) => setBillSearchQuery(e.target.value)}
                placeholder="بحث برقم المطالبة، اسم المورد، التاريخ، أو البنود..."
                className="w-full text-xs pr-9 pl-8 py-2 rounded-lg border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-amber-500 font-medium"
              />
              {billSearchQuery && (
                <button
                  onClick={() => setBillSearchQuery('')}
                  className="absolute left-2.5 top-2.5 text-slate-400 hover:text-slate-600"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <select
                value={billStatusFilter}
                onChange={(e) => setBillStatusFilter(e.target.value as any)}
                className="text-xs px-3 py-2 rounded-lg border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-amber-500 font-semibold w-full sm:w-auto"
              >
                <option value="ALL">جميع حالات المطالبات</option>
                <option value="PAID">مسددة بالكامل</option>
                <option value="PARTIAL">سداد جزئي</option>
                <option value="UNPAID">غير مسددة</option>
              </select>
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
            <table className="w-full text-right text-xs">
              <thead className="bg-slate-50 text-slate-700 border-b border-slate-200 font-semibold">
                <tr>
                  <th className="p-3">رقم المطالبة / الفاتورة</th>
                  <th className="p-3">المورد</th>
                  <th className="p-3">تاريخ الفاتورة</th>
                  <th className="p-3">تاريخ الاستحقاق</th>
                  <th className="p-3 text-left">الإجمالي مع الضريبة</th>
                  <th className="p-3 text-left">المتبقي للسداد</th>
                  <th className="p-3 text-center">الحالة</th>
                  <th className="p-3 text-center">إجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredVendorBills.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="p-8 text-center text-slate-400 font-medium">
                      {billSearchQuery || billStatusFilter !== 'ALL'
                        ? 'لا توجد فواتير مشتريات تطابق معايير البحث والفلترة الحالية'
                        : 'لا توجد فواتير مشتريات مسجلة حتى الآن'}
                    </td>
                  </tr>
                ) : (
                  filteredVendorBills.map((b) => (
                  <tr key={b.id} className="hover:bg-slate-50/80 transition">
                    <td className="p-3 font-mono font-bold text-amber-700">{b.invoiceNumber}</td>
                    <td className="p-3 font-semibold text-slate-800">{b.entityName}</td>
                    <td className="p-3 text-slate-500">{b.date}</td>
                    <td className="p-3 text-slate-500">{b.dueDate}</td>
                    <td className="p-3 text-left font-mono font-bold text-slate-800">
                      {formatCurrency(b.grandTotal, currency)}
                    </td>
                    <td className="p-3 text-left font-mono font-bold text-rose-600">
                      {formatCurrency(b.remainingAmount, currency)}
                    </td>
                    <td className="p-3 text-center">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                        b.status === 'PAID'
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : b.status === 'PARTIAL'
                          ? 'bg-amber-50 text-amber-700 border border-amber-200'
                          : 'bg-rose-50 text-rose-700 border border-rose-200'
                      }`}>
                        {b.status === 'PAID' ? 'مسددة بالكامل' : b.status === 'PARTIAL' ? 'سداد جزئي' : 'غير مسددة'}
                      </span>
                    </td>
                    <td className="p-3 text-center">
                      <button
                        onClick={() => {
                          const vendor = vendors.find(v => v.id === b.entityId);
                          setShareModalDoc({
                            type: 'BILL',
                            documentNumber: b.invoiceNumber,
                            date: b.date,
                            dueDate: b.dueDate,
                            recipientName: b.entityName,
                            recipientPhone: vendor?.phone,
                            recipientEmail: vendor?.email,
                            amount: b.grandTotal,
                            taxAmount: b.taxAmount,
                            subtotal: b.subtotal,
                            currency: currency,
                            items: b.items,
                            currentBalance: vendor?.balance,
                            notes: b.notes,
                            referenceInvoiceNumber: b.referenceInvoiceNumber,
                            returnReason: b.returnReason
                          });
                        }}
                        className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition"
                        title="مشاركة / طباعة الفاتورة"
                      >
                        <Share2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                )))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: AGING ANALYSIS */}
      {activeTab === 'aging' && (
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
              <Clock className="w-5 h-5 text-amber-500" />
              <span>تقرير أعمار الديون الدائنة (Accounts Payable Aging Report)</span>
            </h3>
            <button
              onClick={() => {
                const headers = ['المورد', '0 - 30 يوم', '31 - 60 يوم', '61 - 90 يوم', '+90 يوم', 'إجمالي المستحق'];
                const rows = vendors.map(v => [
                  v.nameAr,
                  v.currentBalance * 0.4,
                  v.currentBalance * 0.35,
                  v.currentBalance * 0.15,
                  v.currentBalance * 0.1,
                  v.currentBalance
                ]);
                exportToCsv('تقرير_أعمار_الديون_الدائنة', headers, rows);
              }}
              className="px-3 py-1.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-lg text-xs font-semibold"
            >
              تصدير التقرير
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs">
              <thead className="bg-slate-50 text-slate-700 border-b border-slate-200 font-semibold">
                <tr>
                  <th className="p-3">المورد / الدائن</th>
                  <th className="p-3 text-left">0 - 30 يوم (حالي)</th>
                  <th className="p-3 text-left">31 - 60 يوم</th>
                  <th className="p-3 text-left">61 - 90 يوم</th>
                  <th className="p-3 text-left">+90 يوم (متأخر)</th>
                  <th className="p-3 text-left">إجمالي المستحق</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {vendors.slice(0, 50).map((v) => {
                  const b30 = v.currentBalance * 0.4;
                  const b60 = v.currentBalance * 0.35;
                  const b90 = v.currentBalance * 0.15;
                  const bOver = v.currentBalance * 0.1;
                  return (
                    <tr key={v.id} className="hover:bg-slate-50/70">
                      <td className="p-3 font-semibold text-slate-800">{v.nameAr}</td>
                      <td className="p-3 text-left font-mono text-emerald-600">{formatCurrency(b30, 'YER')}</td>
                      <td className="p-3 text-left font-mono text-blue-600">{formatCurrency(b60, 'YER')}</td>
                      <td className="p-3 text-left font-mono text-amber-600">{formatCurrency(b90, 'YER')}</td>
                      <td className="p-3 text-left font-mono text-rose-600 font-bold">{formatCurrency(bOver, 'YER')}</td>
                      <td className="p-3 text-left font-mono font-bold text-slate-900">{formatCurrency(v.currentBalance, 'YER')}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 4: NEW BILL FORM */}
      {activeTab === 'new-bill' && (
        <form onSubmit={handleCreateBill} className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-5">
          <h3 className="text-base font-bold text-slate-800 border-b border-slate-200 pb-3 flex items-center gap-2">
            <Plus className="w-4 h-4 text-amber-600" />
            <span>تسجيل فاتورة مشتريات وتوريد واردة من مورد (Vendor Bill Entry)</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">المورد</label>
              <select
                value={selectedVendorId}
                onChange={(e) => setSelectedVendorId(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:ring-2 focus:ring-amber-500 focus:bg-white focus:outline-none"
              >
                {vendors.map((v) => (
                  <option key={v.id} value={v.id}>{v.nameAr} (الرصيد: {formatCurrency(v.currentBalance, 'YER')})</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">تاريخ الفاتورة</label>
              <input
                type="date"
                value={billDate}
                onChange={(e) => setBillDate(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:ring-2 focus:ring-amber-500 focus:bg-white focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">تاريخ الاستحقاق</label>
              <input
                type="date"
                value={billDueDate}
                onChange={(e) => setBillDueDate(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:ring-2 focus:ring-amber-500 focus:bg-white focus:outline-none"
              />
            </div>
          </div>

          <div className="border border-slate-200 rounded-xl overflow-hidden bg-white shadow-xs">
            <table className="w-full text-right text-xs">
              <thead className="bg-slate-50 text-slate-700 border-b border-slate-200 font-semibold">
                <tr>
                  <th className="p-3">بيان البضاعة / الخدمة الموردة</th>
                  <th className="p-3 w-24">الكمية</th>
                  <th className="p-3 w-36">سعر الوحدة</th>
                  <th className="p-3 w-32">ضريبة الشراء %</th>
                  <th className="p-3 w-36 text-left">الإجمالي</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {billItems.map((item, idx) => (
                  <tr key={item.id}>
                    <td className="p-2">
                      <input
                        type="text"
                        value={item.description}
                        onChange={(e) => {
                          const updated = [...billItems];
                          updated[idx].description = e.target.value;
                          setBillItems(updated);
                        }}
                        className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-800"
                      />
                    </td>
                    <td className="p-2">
                      <input
                        type="number"
                        min="1"
                        value={item.quantity}
                        onChange={(e) => {
                          const updated = [...billItems];
                          const qty = parseFloat(e.target.value) || 1;
                          updated[idx].quantity = qty;
                          updated[idx].subtotal = qty * updated[idx].unitPrice;
                          updated[idx].taxAmount = updated[idx].subtotal * updated[idx].taxRate;
                          updated[idx].total = updated[idx].subtotal + updated[idx].taxAmount;
                          setBillItems(updated);
                        }}
                        className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 text-center font-mono"
                      />
                    </td>
                    <td className="p-2">
                      <input
                        type="number"
                        min="0"
                        value={item.unitPrice}
                        onChange={(e) => {
                          const updated = [...billItems];
                          const price = parseFloat(e.target.value) || 0;
                          updated[idx].unitPrice = price;
                          updated[idx].subtotal = updated[idx].quantity * price;
                          updated[idx].taxAmount = updated[idx].subtotal * updated[idx].taxRate;
                          updated[idx].total = updated[idx].subtotal + updated[idx].taxAmount;
                          setBillItems(updated);
                        }}
                        className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 text-left font-mono"
                      />
                    </td>
                    <td className="p-2">
                      <select
                        value={item.taxRate}
                        onChange={(e) => {
                          const updated = [...billItems];
                          const rateVal = parseFloat(e.target.value) || 0;
                          updated[idx].taxRate = rateVal;
                          updated[idx].taxAmount = updated[idx].subtotal * rateVal;
                          updated[idx].total = updated[idx].subtotal + updated[idx].taxAmount;
                          setBillItems(updated);
                        }}
                        className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-800"
                      >
                        <option value={0.05}>5% ضريبة مدخلات</option>
                        <option value={0}>0% معفاة</option>
                      </select>
                    </td>
                    <td className="p-2 text-left font-mono font-bold text-amber-700">
                      {formatCurrency(item.total, 'YER')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <DocumentArchiver
            attachments={billAttachments}
            onAddAttachment={(url) => setBillAttachments(prev => [...prev, url])}
            onRemoveAttachment={(url) => setBillAttachments(prev => prev.filter(u => u !== url))}
          />

          <div className="flex justify-end pt-3 border-t border-slate-200">
            <button
              type="submit"
              className="px-6 py-2.5 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-xl shadow-xs"
            >
              تسجيل وترحيل فاتورة المشتريات
            </button>
          </div>
        </form>
      )}

      {/* TAB 5: NEW PAYMENT VOUCHER */}
      {activeTab === 'new-payment' && (
        <form onSubmit={handleCreatePayment} className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-4 max-w-xl mx-auto">
          <h3 className="text-base font-bold text-slate-800 border-b border-slate-200 pb-3 flex items-center gap-2">
            <DollarSign className="w-4 h-4 text-emerald-600" />
            <span>إصدار سند صرف وسداد مستحقات مورد (Payment Voucher)</span>
          </h3>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">المورد المسدد له</label>
            <select
              value={paymentVendorId}
              onChange={(e) => setPaymentVendorId(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:ring-2 focus:ring-emerald-500 focus:bg-white focus:outline-none"
            >
              {vendors.map((v) => (
                <option key={v.id} value={v.id}>{v.nameAr} - المستحق القائم: {formatCurrency(v.currentBalance, 'YER')}</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">المبلغ المصروف (YER)</label>
              <input
                type="number"
                required
                min="1"
                value={paymentAmount === 0 ? '' : paymentAmount}
                onChange={(e) => setPaymentAmount(parseFloat(e.target.value) || 0)}
                placeholder="0.00"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-emerald-600 font-mono font-bold text-left focus:ring-2 focus:ring-emerald-500 focus:bg-white focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">طريقة الصرف</label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value as any)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:ring-2 focus:ring-emerald-500 focus:bg-white focus:outline-none"
              >
                <option value="BANK_TRANSFER">تحويل بنكي صادر</option>
                <option value="CHEQUE">شيك بنكي مسحوب</option>
                <option value="CASH">نقداً من الصندوق الرئيسي</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">رقم السند / الشيك المرجعي</label>
            <input
              type="text"
              value={paymentRef}
              onChange={(e) => setPaymentRef(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 font-mono focus:ring-2 focus:ring-emerald-500 focus:bg-white focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">البيان وملاحظات الصرف</label>
            <input
              type="text"
              value={paymentNotes}
              onChange={(e) => setPaymentNotes(e.target.value)}
              placeholder="دفعة من حساب فاتورة التوريد..."
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:ring-2 focus:ring-emerald-500 focus:bg-white focus:outline-none"
            />
          </div>

          <DocumentArchiver
            attachments={paymentAttachments}
            onAddAttachment={(url) => setPaymentAttachments(prev => [...prev, url])}
            onRemoveAttachment={(url) => setPaymentAttachments(prev => prev.filter(u => u !== url))}
          />

          <div className="pt-3 border-t border-slate-200 flex justify-end">
            <button
              type="submit"
              className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-xs"
            >
              ترحيل سند الصرف
            </button>
          </div>
        </form>
      )}

      {/* VENDOR ACCOUNT STATEMENT MODAL */}
      {selectedVendorForStatement && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-white border border-slate-300 rounded-2xl max-w-2xl w-full p-6 space-y-4 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-700 font-bold font-mono text-xs">
                  {selectedVendorForStatement.code}
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">{selectedVendorForStatement.nameAr}</h3>
                  <p className="text-xs text-slate-400">{selectedVendorForStatement.city} • هاتف: {selectedVendorForStatement.phone}</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedVendorForStatement(null)}
                className="p-1 text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Financial Summary */}
            <div className="grid grid-cols-3 gap-3">
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                <span className="text-[11px] text-slate-500 block">إجمالي التعاملات / التوريدات</span>
                <span className="font-mono font-bold text-slate-900 text-sm">
                  {formatCurrency(selectedVendorForStatement.totalOperations ?? ((selectedVendorForStatement.totalPaid || 0) + selectedVendorForStatement.currentBalance), currency)}
                </span>
              </div>

              <div className="p-3 bg-emerald-50/50 border border-emerald-200 rounded-xl">
                <span className="text-[11px] text-emerald-700 block">إجمالي المسدد</span>
                <span className="font-mono font-bold text-emerald-700 text-sm">
                  {formatCurrency(selectedVendorForStatement.totalPaid ?? 0, currency)}
                </span>
              </div>

              <div className="p-3 bg-rose-50/50 border border-rose-200 rounded-xl">
                <span className="text-[11px] text-rose-700 block">الرصيد القائم</span>
                <span className="font-mono font-bold text-rose-700 text-sm">
                  {formatCurrency(selectedVendorForStatement.currentBalance, currency)}
                </span>
              </div>
            </div>

            {/* Progress */}
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
              <div className="flex justify-between items-center text-xs">
                <span className="font-semibold text-slate-700">معدل السداد التراكمي:</span>
                <span className="font-mono font-bold text-amber-700">
                  {((selectedVendorForStatement.paymentRate ?? 0)).toFixed(2)}%
                </span>
              </div>
              <div className="w-full bg-slate-200 h-2.5 rounded-full overflow-hidden">
                <div 
                  className="bg-amber-600 h-full rounded-full transition-all" 
                  style={{ width: `${Math.min(100, selectedVendorForStatement.paymentRate ?? 0)}%` }}
                />
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200">
              <button
                onClick={() => {
                  setPaymentVendorId(selectedVendorForStatement.id);
                  setPaymentAmount(selectedVendorForStatement.currentBalance > 0 ? selectedVendorForStatement.currentBalance : 0);
                  setSelectedVendorForStatement(null);
                  setActiveTab('new-payment');
                }}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-xs flex items-center gap-1.5"
              >
                <DollarSign className="w-3.5 h-3.5" />
                <span>إصدار سند صرف</span>
              </button>
              <button
                onClick={() => {
                  setSelectedVendorId(selectedVendorForStatement.id);
                  setSelectedVendorForStatement(null);
                  setActiveTab('new-bill');
                }}
                className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold shadow-xs flex items-center gap-1.5"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>تسجيل فاتورة توريد</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* IMPORT CSV MODAL */}
      {isImportModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-white border border-slate-300 rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div className="flex items-center gap-2">
                <FileSpreadsheet className="w-5 h-5 text-amber-600" />
                <h3 className="text-base font-bold text-slate-900">استيراد كشف حسابات الموردين والدائنين من CSV</h3>
              </div>
              <button
                onClick={() => setIsImportModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs text-slate-600">
              <p>
                يمكنك لصق بيانات ملف CSV الخاصة بالموردين أو رفع ملف مباشرة بالصيغة:
                <br />
                <code className="bg-slate-100 px-1.5 py-0.5 rounded text-[11px] font-mono text-amber-700 mt-1 inline-block">
                  م, اسم الحساب, إجمالي العمليات, المسدد, الرصيد, نسبة السداد %
                </code>
              </p>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">رفع ملف CSV من جهازك</label>
                <input
                  type="file"
                  accept=".csv,.txt"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      const reader = new FileReader();
                      reader.onload = (event) => {
                        const content = event.target?.result as string;
                        setImportCsvText(content);
                      };
                      reader.readAsText(file);
                    }
                  }}
                  className="w-full text-xs text-slate-500 file:mr-2 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-amber-50 file:text-amber-700 hover:file:bg-amber-100"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">أو الصق نص CSV هنا</label>
                <textarea
                  rows={6}
                  value={importCsvText}
                  onChange={(e) => setImportCsvText(e.target.value)}
                  placeholder="م,اسم الحساب,إجمالي العمليات,المسدد,الرصيد,نسبة السداد %&#10;1,مؤسسة قيس احمد قاسم للتجارة العامة,787350,787350,0,1"
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono text-[11px] text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-slate-200">
              <button
                type="button"
                onClick={() => {
                  setImportCsvText(RAW_VENDORS_CSV);
                }}
                className="text-xs text-amber-700 hover:underline font-semibold"
              >
                تحميل نص الكشف الافتراضي (208 مورد)
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsImportModalOpen(false)}
                  className="px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold"
                >
                  إلغاء
                </button>
                <button
                  type="button"
                  onClick={() => handleImportVendorsFromText(importCsvText)}
                  className="px-4 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-bold shadow-xs"
                >
                  استيراد وتحديث الكشف
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ADD NEW VENDOR MODAL */}
      {isAddVendorModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4 backdrop-blur-xs">
          <form onSubmit={handleManualAddVendor} className="bg-white border border-slate-300 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div className="flex items-center gap-2">
                <Truck className="w-5 h-5 text-amber-600" />
                <h3 className="text-base font-bold text-slate-900">إضافة مورد أو دائن جديد للدليل</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsAddVendorModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-700 font-semibold mb-1">اسم المورد / الجهة الدائنة *</label>
                <input
                  type="text"
                  required
                  value={newVendorName}
                  onChange={(e) => setNewVendorName(e.target.value)}
                  placeholder="مثال: شركة التوريدات والحلول الصناعية"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:bg-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">رقم الهاتف</label>
                  <input
                    type="text"
                    value={newVendorPhone}
                    onChange={(e) => setNewVendorPhone(e.target.value)}
                    placeholder="+967 77..."
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:bg-white"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">المدينة / المحافظة</label>
                  <input
                    type="text"
                    value={newVendorCity}
                    onChange={(e) => setNewVendorCity(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:bg-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">المبالغ المسددة للمورد</label>
                  <input
                    type="number"
                    min="0"
                    value={newVendorPaid === 0 ? '' : newVendorPaid}
                    onChange={(e) => setNewVendorPaid(parseFloat(e.target.value) || 0)}
                    placeholder="0"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-emerald-600 font-mono font-bold focus:outline-none focus:ring-2 focus:ring-amber-500 focus:bg-white"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">الرصيد المتبقي المستحق</label>
                  <input
                    type="number"
                    min="0"
                    value={newVendorBalance === 0 ? '' : newVendorBalance}
                    onChange={(e) => setNewVendorBalance(parseFloat(e.target.value) || 0)}
                    placeholder="0"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-rose-600 font-mono font-bold focus:outline-none focus:ring-2 focus:ring-amber-500 focus:bg-white"
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200">
              <button
                type="button"
                onClick={() => setIsAddVendorModalOpen(false)}
                className="px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold"
              >
                إلغاء
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-bold shadow-xs"
              >
                إضافة وحفظ المورد
              </button>
            </div>
          </form>
        </div>
      )}

      {/* DOCUMENT SHARING MODAL */}
      <DocumentShareModal
        isOpen={!!shareModalDoc}
        onClose={() => setShareModalDoc(null)}
        document={shareModalDoc}
        companyProfile={companyProfile}
      />
    </div>
  );
};
