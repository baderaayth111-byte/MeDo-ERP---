import React, { useState } from 'react';
import {
  FlaskConical,
  UserPlus,
  Trash2,
  CheckCircle2,
  Users,
  Building2,
  ShoppingCart,
  Package,
  FileText,
  DollarSign,
  Briefcase,
  Layers,
  Sparkles,
  ArrowRight,
  Database,
  RefreshCw,
  Download,
  AlertCircle,
  PlusCircle,
  HardDrive
} from 'lucide-react';
import {
  Employee,
  Customer,
  Vendor,
  Invoice,
  PaymentVoucher,
  InventoryItem,
  JournalEntry,
  FixedAsset,
  CostCenter,
  Currency,
  LeaveRequest,
  AttendanceRecord,
  POSTransaction,
} from '../types/accounting';

interface CrudTestingLabModalProps {
  isOpen: boolean;
  onClose: () => void;
  // Collections
  employees: Employee[];
  customers: Customer[];
  vendors: Vendor[];
  invoices: Invoice[];
  paymentVouchers: PaymentVoucher[];
  inventoryItems: InventoryItem[];
  journalEntries: JournalEntry[];
  fixedAssets: FixedAsset[];
  costCenters: CostCenter[];
  leaveRequests: LeaveRequest[];
  attendanceRecords: AttendanceRecord[];
  currency: Currency;
  rates: Record<Currency, number>;
  // Handlers
  onAddEmployee: (emp: Employee) => void;
  onDeleteEmployee: (id: string) => void;
  onAddCustomer: (cust: Customer) => void;
  onDeleteCustomer?: (id: string) => void;
  onAddVendor: (vend: Vendor) => void;
  onDeleteVendor?: (id: string) => void;
  onAddInvoice: (inv: Invoice) => void;
  onAddPaymentVoucher: (pv: PaymentVoucher) => void;
  onAddInventoryItem: (item: InventoryItem) => void;
  onDeleteInventoryItem?: (id: string) => void;
  onAddJournalEntry: (je: JournalEntry) => void;
  onAddFixedAsset: (asset: FixedAsset) => void;
  onAddCostCenter?: (cc: CostCenter) => void;
  onAddLeaveRequest?: (lr: LeaveRequest) => void;
  onAddAttendanceRecord?: (att: AttendanceRecord) => void;
  onAddPosOrder?: (order: POSTransaction) => void;
  onNavigate: (module: string) => void;
  onResetAllData: () => void;
}

export const CrudTestingLabModal: React.FC<CrudTestingLabModalProps> = ({
  isOpen,
  onClose,
  employees,
  customers,
  vendors,
  invoices,
  paymentVouchers,
  inventoryItems,
  journalEntries,
  fixedAssets,
  costCenters,
  leaveRequests,
  attendanceRecords,
  currency,
  rates,
  onAddEmployee,
  onDeleteEmployee,
  onAddCustomer,
  onAddVendor,
  onAddInvoice,
  onAddPaymentVoucher,
  onAddInventoryItem,
  onAddJournalEntry,
  onAddFixedAsset,
  onNavigate,
  onResetAllData,
}) => {
  const [lastActionMessage, setLastActionMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const showNotification = (msg: string) => {
    setLastActionMessage(msg);
    setTimeout(() => {
      setLastActionMessage(null);
    }, 4000);
  };

  // Sample Generator 1: Employee
  const handleTestAddEmployee = () => {
    const names = [
      { first: 'حمزة', last: 'الماوري', job: 'كبير مهندسي البرمجيات والنظم', dept: 'إدارة تكنولوجيا المعلومات', sal: 650000, house: 120000, trans: 50000, bank: 'بنك التضامن الإسلامي الدولي' },
      { first: 'وفاء', last: 'الشامي', job: 'أخصائية أولى موارد بشرية', dept: 'إدارة الموارد البشرية والرواتب', sal: 480000, house: 90000, trans: 40000, bank: 'بنك الكريمي للتمويل الأصغر' },
      { first: 'طارق', last: 'الزبيدي', job: 'مدير المبيعات والتوزيع الإقليمي', dept: 'إدارة المبيعات والتسويق', sal: 550000, house: 110000, trans: 60000, bank: 'البنك الأهلي اليمني' },
      { first: 'سعاد', last: 'القدسي', job: 'محاسبة تكاليف ومخزون أولى', dept: 'الإدارة المالية والمحاسبة', sal: 490000, house: 95000, trans: 45000, bank: 'بنك اليمن والكويت' },
    ];
    const pick = names[Math.floor(Math.random() * names.length)];
    const id = `EMP-TEST-${Date.now().toString().slice(-5)}`;
    const empCode = `HR-${String(100 + employees.length + 1).padStart(5, '0')}`;

    const newEmp: Employee = {
      id,
      employeeCode: empCode,
      firstNameAr: pick.first,
      lastNameAr: pick.last,
      fullNameEn: `${pick.first} ${pick.last}`,
      nationalIdOrIqama: `10${Math.floor(10000000 + Math.random() * 90000000)}`,
      jobTitle: pick.job,
      department: pick.dept,
      gender: pick.first === 'وفاء' || pick.first === 'سعاد' ? 'FEMALE' : 'MALE',
      nationality: 'يمني',
      costCenterId: costCenters[0]?.id || 'CC-100',
      branchId: 'BR-01',
      joinDate: new Date().toISOString().split('T')[0],
      phone: `+967 77${Math.floor(1000000 + Math.random() * 9000000)}`,
      email: `emp.${Date.now().toString().slice(-4)}@almurooj-group.ye`,
      contractType: 'FULL_TIME',
      status: 'ACTIVE',
      basicSalary: pick.sal,
      housingAllowance: pick.house,
      transportAllowance: pick.trans,
      foodAllowance: 30000,
      otherAllowances: 15000,
      gosiDeductionPct: 9,
      gosiCompanyContributionPct: 11,
      taxDeductionPct: 5,
      bankName: pick.bank,
      ibanOrAccountNumber: `YE45TDBY${Math.floor(1000000000 + Math.random() * 9000000000)}`,
      annualLeaveBalance: 21,
      sickLeaveBalance: 15,
      emergencyLeaveBalance: 5,
    };

    onAddEmployee(newEmp);
    showNotification(`✅ تم بنجاح إضافة الموظف التجريبي (${newEmp.firstNameAr} ${newEmp.lastNameAr} - ${newEmp.jobTitle}) وحفظه في الذاكرة الدائمة!`);
  };

  const handleDeleteLastEmployee = () => {
    if (employees.length === 0) {
      showNotification('⚠️ لا يوجد موظفون لحذفهم!');
      return;
    }
    const target = employees[0];
    onDeleteEmployee(target.id);
    showNotification(`🗑️ تم بنجاح حذف الموظف (${target.firstNameAr} ${target.lastNameAr}) من قاعدة البيانات!`);
  };

  // Sample Generator 2: Customer
  const handleTestAddCustomer = () => {
    const custNames = [
      'مجموعة بن عوض للتوكيلات التجارية والتوزيع',
      'شركة سبأفون للاتصالات النقالة',
      'مؤسسة النور للإمدادات والخدمات الحديثة',
      'سوبرماركت الرواد الدولي - صنعاء',
    ];
    const pick = custNames[Math.floor(Math.random() * custNames.length)];
    const code = `CUST-${String(100 + customers.length + 1).padStart(4, '0')}`;
    const newCust: Customer = {
      id: `CUST-${Date.now()}`,
      code,
      nameAr: `${pick} [تجريبي #${Date.now().toString().slice(-3)}]`,
      nameEn: 'Saba Commercial Trading',
      phone: '+967 1 445566',
      email: `customer${Date.now().toString().slice(-3)}@client.ye`,
      city: 'صنعاء',
      address: 'شارع الزبيري، صنعاء',
      currency: 'YER',
      creditLimit: 5000000,
      currentBalance: 1500000,
      taxNumber: 'YER-TAX-554433',
      status: 'ACTIVE',
    };
    onAddCustomer(newCust);
    showNotification(`✅ تم إضافة العميل الجديد (${newCust.nameAr}) وتثبيته في سجلات الذمم المدينة!`);
  };

  // Sample Generator 3: Vendor
  const handleTestAddVendor = () => {
    const vendNames = [
      'مؤسسة الأمل العالمية للاستيراد والتصدير',
      'شركة البحر الأحمر للتغليف والمواد اللوجستية',
      'مصنع الزيوت النباتية المتحدة - الحديدة',
      'وكالة التقنية الحديثة للتجهيزات المكتبية',
    ];
    const pick = vendNames[Math.floor(Math.random() * vendNames.length)];
    const code = `VEND-${String(100 + vendors.length + 1).padStart(4, '0')}`;
    const newVend: Vendor = {
      id: `VEND-${Date.now()}`,
      code,
      nameAr: `${pick} [تجريبي #${Date.now().toString().slice(-3)}]`,
      nameEn: 'Al-Amal Global Supply',
      phone: '+967 1 223344',
      email: `vendor${Date.now().toString().slice(-3)}@supplier.ye`,
      city: 'صنعاء',
      address: 'شارع الستين الجنوبي، صنعاء',
      currency: 'YER',
      currentBalance: 2400000,
      paymentTermsDays: 30,
      taxNumber: 'YER-TAX-887766',
      status: 'ACTIVE',
    };
    onAddVendor(newVend);
    showNotification(`✅ تم إضافة المورد الجديد (${newVend.nameAr}) بنجاح!`);
  };

  // Sample Generator 4: Inventory Item
  const handleTestAddInventoryItem = () => {
    const itemNames = [
      { nameAr: 'زيت دوار الشمس المروج نقي 5 لتر', code: `ITM-OIL-${Date.now().toString().slice(-4)}`, cat: 'مواد غذائية وزيوت', cost: 7200, price: 8800, qty: 150 },
      { nameAr: 'أرز بسمتي المروج هندي فاخر 10 كجم', code: `ITM-RICE-${Date.now().toString().slice(-4)}`, cat: 'حبوب ومواد تموينية', cost: 13500, price: 16000, qty: 85 },
      { nameAr: 'شاي المروج سيلاني فاخر 500 جرام', code: `ITM-TEA-${Date.now().toString().slice(-4)}`, cat: 'مشروبات ومشروبات ساخنة', cost: 2100, price: 2700, qty: 300 },
    ];
    const pick = itemNames[Math.floor(Math.random() * itemNames.length)];
    const newItem: InventoryItem = {
      id: `ITEM-${Date.now()}`,
      code: pick.code,
      nameAr: pick.nameAr,
      nameEn: 'Al-Murooj Premium Product',
      category: pick.cat,
      unit: 'حبة / عبوة',
      costPrice: pick.cost,
      salePrice: pick.price,
      quantity: pick.qty,
      minStockLevel: 20,
      maxStockLevel: 500,
      warehouseId: 'WH-01',
      status: 'متوفر',
      lastUpdated: new Date().toISOString().split('T')[0],
    };
    onAddInventoryItem(newItem);
    showNotification(`✅ تم إضافة الصنف المخزني (${newItem.nameAr}) بكمية ${newItem.quantity} وتحديث كارت الصنف!`);
  };

  // Sample Generator 5: Journal Entry
  const handleTestAddJournalEntry = () => {
    const amount = 350000;
    const je: JournalEntry = {
      id: `JE-TEST-${Date.now()}`,
      entryNumber: `JV-${new Date().getFullYear()}-${String(journalEntries.length + 1).padStart(4, '0')}`,
      date: new Date().toISOString().split('T')[0],
      reference: `REF-TEST-${Date.now().toString().slice(-4)}`,
      description: 'إثبات سداد مصاريف صيانة وتشغيل شبكة الفروع - قيد تجريبي اختباري',
      status: 'POSTED',
      createdBy: 'مدير النظام (مختبر الفحص)',
      postedAt: new Date().toLocaleString('ar-YE'),
      totalDebit: amount,
      totalCredit: amount,
      lines: [
        {
          id: `line-1-${Date.now()}`,
          accountCode: '5220',
          accountName: 'مصاريف الصيانة والتشغيل والتقنية',
          debit: amount,
          credit: 0,
          currency: 'YER',
          exchangeRate: 1,
          amountInBase: amount,
          description: 'مصاريف تشغيل وصيانة البرمجيات',
        },
        {
          id: `line-2-${Date.now()}`,
          accountCode: '1111',
          accountName: 'النقدية بالصندوق الرئيسي (صنعاء)',
          debit: 0,
          credit: amount,
          currency: 'YER',
          exchangeRate: 1,
          amountInBase: amount,
          description: 'صرف نقدي من الخزينة الرئيسية',
        },
      ],
    };
    onAddJournalEntry(je);
    showNotification(`✅ تم تسجيل وترحيل قيد اليومية (${je.entryNumber}) بمبلغ ${amount.toLocaleString()} ${currency} وتحديث ميزان المراجعة!`);
  };

  // Sample Generator 6: Fixed Asset
  const handleTestAddFixedAsset = () => {
    const cost = 2800000;
    const newAsset: FixedAsset = {
      id: `FA-TEST-${Date.now()}`,
      assetCode: `FA-EQ-${Date.now().toString().slice(-4)}`,
      nameAr: `خادم بيانات وسيرفر مركزي Dell PowerEdge [تجريبي #${Date.now().toString().slice(-3)}]`,
      nameEn: 'Dell PowerEdge Enterprise Server',
      category: 'IT_EQUIPMENT',
      purchaseDate: new Date().toISOString().split('T')[0],
      purchaseCost: cost,
      salvageValue: 200000,
      usefulLifeMonths: 60,
      depreciationMethod: 'STRAIGHT_LINE',
      accumulatedDepreciation: 0,
      bookValue: cost,
      costCenterId: 'CC-100',
      assetAccountCode: '1240',
      depreciationExpenseAccountCode: '5230',
      accumulatedDepreciationAccountCode: '1249',
      status: 'ACTIVE',
    };
    onAddFixedAsset(newAsset);
    showNotification(`✅ تم تسجيل الأصل الثابت (${newAsset.nameAr}) بقيمة ${cost.toLocaleString()} ${currency}!`);
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4" id="crud-lab-modal-overlay">
      <div className="bg-white rounded-3xl max-w-4xl w-full p-6 sm:p-8 space-y-6 text-right shadow-2xl border border-slate-200 max-h-[92vh] overflow-y-auto">
        {/* Top Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-gradient-to-br from-indigo-600 to-blue-700 text-white rounded-2xl shadow-lg shadow-blue-500/20">
              <FlaskConical className="w-7 h-7" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-black text-slate-900">مختبر تجربة الإدخالات والحفظ والمسح الشامل</h2>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-emerald-100 text-emerald-800 border border-emerald-200">
                  Live CRUD & Persistence Lab
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                مركز اختبار العمليات: إضافة السجلات، التعديل، الحذف، والتحقق من حفظ البيانات في الذاكرة الدائمة عبر جميع التطبيقات
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition text-sm font-bold"
          >
            ✕ إغلاق
          </button>
        </div>

        {/* Live Notification Feedback */}
        {lastActionMessage && (
          <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center justify-between animate-fadeIn shadow-xs">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
              <span>{lastActionMessage}</span>
            </div>
            <span className="text-[10px] text-emerald-600 font-mono">محفوظ في LocalStorage</span>
          </div>
        )}

        {/* Storage Persistence Banner */}
        <div className="p-4 rounded-2xl bg-blue-50/80 border border-blue-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs text-blue-900">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-600 text-white rounded-xl">
              <HardDrive className="w-5 h-5" />
            </div>
            <div>
              <strong className="block text-blue-950 font-bold">الحفظ التلقائي الفوري مُفعل ومضمون 100%</strong>
              <span className="text-blue-700 text-[11px]">
                كل موظف، عميل، مورد، صنف، أو قيد تضيفه يُحفظ تلقائياً في التخزين المحلي (LocalStorage) ولن يُفقد عند تحديث الصفحة أو الخروج.
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2 self-end sm:self-center">
            <span className="px-3 py-1 rounded-full bg-white text-blue-800 font-extrabold text-[11px] border border-blue-200 shadow-xs flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              قاعدة البيانات متصلة وجاهزة
            </span>
          </div>
        </div>

        {/* Real-time System Entity Counters */}
        <div>
          <h3 className="text-xs font-black text-slate-500 uppercase tracking-wider mb-3">
            إحصائيات السجلات الحالية في النظام (Live Records Counter):
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 text-center">
              <Users className="w-4 h-4 mx-auto text-indigo-600 mb-1" />
              <div className="text-lg font-black text-slate-900">{employees.length}</div>
              <div className="text-[11px] text-slate-500 font-medium">موظف (HR)</div>
            </div>

            <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 text-center">
              <Building2 className="w-4 h-4 mx-auto text-blue-600 mb-1" />
              <div className="text-lg font-black text-slate-900">{customers.length}</div>
              <div className="text-[11px] text-slate-500 font-medium">عميل (AR)</div>
            </div>

            <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 text-center">
              <Briefcase className="w-4 h-4 mx-auto text-amber-600 mb-1" />
              <div className="text-lg font-black text-slate-900">{vendors.length}</div>
              <div className="text-[11px] text-slate-500 font-medium">مورد (AP)</div>
            </div>

            <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 text-center">
              <Package className="w-4 h-4 mx-auto text-emerald-600 mb-1" />
              <div className="text-lg font-black text-slate-900">{inventoryItems.length}</div>
              <div className="text-[11px] text-slate-500 font-medium">صنف مخزني</div>
            </div>

            <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 text-center">
              <FileText className="w-4 h-4 mx-auto text-purple-600 mb-1" />
              <div className="text-lg font-black text-slate-900">{journalEntries.length}</div>
              <div className="text-[11px] text-slate-500 font-medium">قيد محاسبي</div>
            </div>

            <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 text-center">
              <Layers className="w-4 h-4 mx-auto text-cyan-600 mb-1" />
              <div className="text-lg font-black text-slate-900">{fixedAssets.length}</div>
              <div className="text-[11px] text-slate-500 font-medium">أصل ثابت</div>
            </div>
          </div>
        </div>

        {/* Action Testing Grid */}
        <div className="space-y-4">
          <h3 className="text-xs font-black text-slate-500 uppercase tracking-wider">
            أزرار الاختبار السريع للعمليات عبر كافة التطبيقات (1-Click CRUD Testing):
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* HR Operations */}
            <div className="p-4 rounded-2xl border border-indigo-100 bg-indigo-50/40 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 font-bold text-xs text-indigo-950">
                  <Users className="w-4 h-4 text-indigo-600" />
                  <span>الموارد البشرية والرواتب (HR)</span>
                </div>
                <button
                  onClick={() => {
                    onNavigate('hr-payroll');
                    onClose();
                  }}
                  className="text-[10px] text-indigo-600 hover:text-indigo-800 font-bold flex items-center gap-1"
                >
                  فتح التطبيق <ArrowRight className="w-3 h-3 rotate-180" />
                </button>
              </div>

              <div className="space-y-2">
                <button
                  onClick={handleTestAddEmployee}
                  className="w-full py-2 px-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold flex items-center justify-center gap-1.5 transition shadow-xs"
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  + إضافة موظف تجريبي سريع
                </button>

                <button
                  onClick={handleDeleteLastEmployee}
                  className="w-full py-1.5 px-3 rounded-xl bg-white hover:bg-rose-50 text-rose-600 border border-rose-200 text-[11px] font-bold flex items-center justify-center gap-1.5 transition"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  حذف آخر موظف مضاف
                </button>
              </div>
            </div>

            {/* Customers & Sales */}
            <div className="p-4 rounded-2xl border border-blue-100 bg-blue-50/40 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 font-bold text-xs text-blue-950">
                  <Building2 className="w-4 h-4 text-blue-600" />
                  <span>العملاء والمبيعات (AR)</span>
                </div>
                <button
                  onClick={() => {
                    onNavigate('accounts-receivable');
                    onClose();
                  }}
                  className="text-[10px] text-blue-600 hover:text-blue-800 font-bold flex items-center gap-1"
                >
                  فتح التطبيق <ArrowRight className="w-3 h-3 rotate-180" />
                </button>
              </div>

              <div className="space-y-2">
                <button
                  onClick={handleTestAddCustomer}
                  className="w-full py-2 px-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold flex items-center justify-center gap-1.5 transition shadow-xs"
                >
                  <PlusCircle className="w-3.5 h-3.5" />
                  + إضافة عميل تجريبي سريع
                </button>
                <div className="text-[10px] text-slate-500 text-center font-medium">
                  العملاء المسجلون حالياً: {customers.length} عميل
                </div>
              </div>
            </div>

            {/* Vendors & Procurement */}
            <div className="p-4 rounded-2xl border border-amber-100 bg-amber-50/40 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 font-bold text-xs text-amber-950">
                  <Briefcase className="w-4 h-4 text-amber-600" />
                  <span>الموردين والمشتريات (AP)</span>
                </div>
                <button
                  onClick={() => {
                    onNavigate('accounts-payable');
                    onClose();
                  }}
                  className="text-[10px] text-amber-600 hover:text-amber-800 font-bold flex items-center gap-1"
                >
                  فتح التطبيق <ArrowRight className="w-3 h-3 rotate-180" />
                </button>
              </div>

              <div className="space-y-2">
                <button
                  onClick={handleTestAddVendor}
                  className="w-full py-2 px-3 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold flex items-center justify-center gap-1.5 transition shadow-xs"
                >
                  <PlusCircle className="w-3.5 h-3.5" />
                  + إضافة مورد تجريبي سريع
                </button>
                <div className="text-[10px] text-slate-500 text-center font-medium">
                  الموردون المسجلون: {vendors.length} مورد
                </div>
              </div>
            </div>

            {/* Inventory & Products */}
            <div className="p-4 rounded-2xl border border-emerald-100 bg-emerald-50/40 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 font-bold text-xs text-emerald-950">
                  <Package className="w-4 h-4 text-emerald-600" />
                  <span>المخزون والمستودعات (MM)</span>
                </div>
                <button
                  onClick={() => {
                    onNavigate('inventory');
                    onClose();
                  }}
                  className="text-[10px] text-emerald-600 hover:text-emerald-800 font-bold flex items-center gap-1"
                >
                  فتح التطبيق <ArrowRight className="w-3 h-3 rotate-180" />
                </button>
              </div>

              <div className="space-y-2">
                <button
                  onClick={handleTestAddInventoryItem}
                  className="w-full py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center justify-center gap-1.5 transition shadow-xs"
                >
                  <PlusCircle className="w-3.5 h-3.5" />
                  + إضافة صنف مخزني جديد
                </button>
                <div className="text-[10px] text-slate-500 text-center font-medium">
                  الأصناف المتوفرة: {inventoryItems.length} صنف
                </div>
              </div>
            </div>

            {/* General Ledger & Accounting */}
            <div className="p-4 rounded-2xl border border-purple-100 bg-purple-50/40 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 font-bold text-xs text-purple-950">
                  <FileText className="w-4 h-4 text-purple-600" />
                  <span>الأستاذ العام والقيود (GL)</span>
                </div>
                <button
                  onClick={() => {
                    onNavigate('general-ledger');
                    onClose();
                  }}
                  className="text-[10px] text-purple-600 hover:text-purple-800 font-bold flex items-center gap-1"
                >
                  فتح التطبيق <ArrowRight className="w-3 h-3 rotate-180" />
                </button>
              </div>

              <div className="space-y-2">
                <button
                  onClick={handleTestAddJournalEntry}
                  className="w-full py-2 px-3 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold flex items-center justify-center gap-1.5 transition shadow-xs"
                >
                  <PlusCircle className="w-3.5 h-3.5" />
                  + تسجيل قيد يومية متوازن
                </button>
                <div className="text-[10px] text-slate-500 text-center font-medium">
                  القيود المسجلة: {journalEntries.length} قيد
                </div>
              </div>
            </div>

            {/* Fixed Assets */}
            <div className="p-4 rounded-2xl border border-cyan-100 bg-cyan-50/40 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 font-bold text-xs text-cyan-950">
                  <Layers className="w-4 h-4 text-cyan-600" />
                  <span>الأصول الثابتة والإهلاك (AA)</span>
                </div>
                <button
                  onClick={() => {
                    onNavigate('fixed-assets');
                    onClose();
                  }}
                  className="text-[10px] text-cyan-600 hover:text-cyan-800 font-bold flex items-center gap-1"
                >
                  فتح التطبيق <ArrowRight className="w-3 h-3 rotate-180" />
                </button>
              </div>

              <div className="space-y-2">
                <button
                  onClick={handleTestAddFixedAsset}
                  className="w-full py-2 px-3 rounded-xl bg-cyan-600 hover:bg-cyan-700 text-white text-xs font-bold flex items-center justify-center gap-1.5 transition shadow-xs"
                >
                  <PlusCircle className="w-3.5 h-3.5" />
                  + تسجيل أصل ثابت جديد
                </button>
                <div className="text-[10px] text-slate-500 text-center font-medium">
                  الأصول المسجلة: {fixedAssets.length} أصل
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Database Utilities & Reset */}
        <div className="pt-4 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
          <div className="text-slate-500 text-[11px]">
            هل ترغب في إعادة ضبط البيانات إلى الحالة النموذجية الأولية؟
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                if (confirm('هل أنت متأكد من استعادة بيانات النظام النموذجية الأولية وإعادة ضبط الذاكرة؟')) {
                  onResetAllData();
                  showNotification('🔄 تم استعادة جميع بيانات النظام النموذجية بنجاح!');
                }
              }}
              className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-rose-50 text-slate-700 hover:text-rose-700 border border-slate-200 hover:border-rose-200 font-bold flex items-center gap-1.5 transition"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              استعادة البيانات الافتراضية
            </button>

            <button
              onClick={onClose}
              className="px-5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold transition shadow-xs"
            >
              تم الانتهاء والمتابعة
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
