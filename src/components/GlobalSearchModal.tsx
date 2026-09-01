import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  Search,
  X,
  LayoutDashboard,
  BookOpen,
  FolderTree,
  Boxes,
  Users,
  Building,
  ShoppingBag,
  Store,
  UserCheck,
  Landmark,
  Layers,
  Coins,
  Receipt,
  FileSpreadsheet,
  Sliders,
  ShieldCheck,
  Package,
  FileText,
  User,
  ArrowRight,
  Sparkles,
  Command,
  ChevronLeft
} from 'lucide-react';
import {
  Account,
  Customer,
  Vendor,
  InventoryItem,
  PurchaseOrder,
  PurchaseRequisition,
  Invoice,
  Employee,
  Currency
} from '../types/accounting';

const formatCurrency = (amount: number, cur: string = 'YER'): string => {
  const formatted = new Intl.NumberFormat('ar-YE', { maximumFractionDigits: 2 }).format(amount || 0);
  const symbol = cur === 'YER' ? 'ر.ي' : cur === 'USD' ? '$' : cur === 'SAR' ? 'ر.س' : cur;
  return `${formatted} ${symbol}`;
};

interface GlobalSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (module: string) => void;
  accounts: Account[];
  customers: Customer[];
  vendors: Vendor[];
  inventoryItems: InventoryItem[];
  purchaseOrders: PurchaseOrder[];
  purchaseRequisitions: PurchaseRequisition[];
  invoices: Invoice[];
  employees: Employee[];
  currency: Currency;
}

interface SearchResultItem {
  id: string;
  category: 'APP' | 'ACCOUNT' | 'INVENTORY' | 'CUSTOMER' | 'VENDOR' | 'PROCUREMENT' | 'INVOICE' | 'EMPLOYEE';
  categoryLabel: string;
  title: string;
  subtitle?: string;
  code?: string;
  detail?: string;
  targetModule: string;
  icon: React.ReactNode;
}

const SYSTEM_APPS = [
  { id: 'launchpad', name: 'لوحة التحكم الرئيسية (Fiori Launchpad)', tcode: 'HOME', desc: 'نظرة عامة ومؤشرات الأداء', icon: LayoutDashboard },
  { id: 'general-ledger', name: 'الأستاذ العام وقيود اليومية', tcode: 'FB01 / F-02', desc: 'تسجيل القيود وتدقيق اليومية', icon: BookOpen },
  { id: 'chart-of-accounts', name: 'دليل الحسابات الشجري', tcode: 'FS00', desc: 'شجرة الحسابات والترميز المحاسبي', icon: FolderTree },
  { id: 'inventory', name: 'إدارة المخزون والمستودعات', tcode: 'MMBE / MIGO', desc: 'الأصناف والمستودعات وحركات البضائع', icon: Boxes },
  { id: 'procurement', name: 'المشتريات وأوامر الشراء والتوريد', tcode: 'ME21N / ME51N', desc: 'طلبات الشراء، أوامر الشراء، واستلام البضائع', icon: ShoppingBag },
  { id: 'pos', name: 'نقاط البيع والكاشير المباشر', tcode: 'POS / SD', desc: 'فواتير البيع الفوري وجلسات الكاشير', icon: Store },
  { id: 'accounts-receivable', name: 'العملاء والذمم المدينة', tcode: 'F-28 / FD03', desc: 'فواتير المبيعات وسندات القبض', icon: Users },
  { id: 'accounts-payable', name: 'الموردين والذمم الدائنة', tcode: 'FB60 / FK03', desc: 'فواتير المشتريات وسندات الصرف', icon: Building },
  { id: 'hr-payroll', name: 'الموارد البشرية ومسير الرواتب', tcode: 'PA30 / PY', desc: 'الموظفين، مسير الأجور، الإجازات والحضور', icon: UserCheck },
  { id: 'bank-reconciliation', name: 'الخزينة والتسويات البنكية', tcode: 'FF67 / CASH', desc: 'حسابات البنوك ومطابقة كشوف الحساب', icon: Landmark },
  { id: 'fixed-assets', name: 'الأصول الثابتة وحساب الإهلاك', tcode: 'AS01 / AFAB', desc: 'سجل الأصول والإهلاك التلقائي', icon: Layers },
  { id: 'controlling', name: 'مراكز التكلفة والربحية', tcode: 'KS01 / CO', desc: 'محاسبة التكاليف ومراكز المسؤولية', icon: Sliders },
  { id: 'foreign-exchange', name: 'الصرافة والتحويلات المالية', tcode: 'FX / REMIT', desc: 'خزائن العملات والحوالات الصادرة والواردة', icon: Coins },
  { id: 'e-invoicing', name: 'الفوترة الإلكترونية ورمز الاستجابة', tcode: 'ZATCA / QR', desc: 'الفواتير الضريبية المبسطة ومتطلبات الزكاة', icon: Receipt },
  { id: 'financial-reports', name: 'التقارير والقوائم المالية الختامية', tcode: 'F.01 / FS10N', desc: 'ميزان المراجعة، قائمة الدخل، والمركز المالي', icon: FileSpreadsheet },
  { id: 'settings', name: 'تهيئة وإعدادات النظام الشاملة', tcode: 'SPRO', desc: 'بيانات المنشأة، الفروع، العملات والفترات', icon: Sliders },
  { id: 'role-management', name: 'إدارة المستخدمين والصلاحيات وكلمات المرور', tcode: 'SU01', desc: 'مصفوفة الصلاحيات، تغيير كلمات المرور', icon: ShieldCheck },
];

export const GlobalSearchModal: React.FC<GlobalSearchModalProps> = ({
  isOpen,
  onClose,
  onNavigate,
  accounts,
  customers,
  vendors,
  inventoryItems,
  purchaseOrders,
  purchaseRequisitions,
  invoices,
  employees,
  currency,
}) => {
  const [query, setQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
    } else {
      setQuery('');
      setSelectedCategory('ALL');
    }
  }, [isOpen]);

  // Keyboard shortcut listener (Escape to close)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const searchResults = useMemo<SearchResultItem[]>(() => {
    const q = query.trim().toLowerCase();
    if (!q) {
      // Show default top apps and quick actions when empty
      return SYSTEM_APPS.map(app => ({
        id: `app-${app.id}`,
        category: 'APP',
        categoryLabel: 'تطبيق / شاشة نظام',
        title: app.name,
        subtitle: app.desc,
        code: app.tcode,
        targetModule: app.id,
        icon: <app.icon className="w-5 h-5 text-blue-600" />,
      }));
    }

    const results: SearchResultItem[] = [];

    // 1. Search Apps
    SYSTEM_APPS.forEach(app => {
      if (
        app.name.toLowerCase().includes(q) ||
        app.desc.toLowerCase().includes(q) ||
        app.tcode.toLowerCase().includes(q) ||
        app.id.toLowerCase().includes(q)
      ) {
        results.push({
          id: `app-${app.id}`,
          category: 'APP',
          categoryLabel: 'تطبيق / موديول',
          title: app.name,
          subtitle: app.desc,
          code: app.tcode,
          targetModule: app.id,
          icon: <app.icon className="w-4 h-4 text-blue-600" />,
        });
      }
    });

    // 2. Search Accounts
    accounts.forEach(acc => {
      if (
        acc.code.toLowerCase().includes(q) ||
        acc.nameAr.toLowerCase().includes(q) ||
        (acc.nameEn && acc.nameEn.toLowerCase().includes(q))
      ) {
        results.push({
          id: `acc-${acc.id}`,
          category: 'ACCOUNT',
          categoryLabel: 'شجرة الحسابات',
          title: acc.nameAr,
          subtitle: `${acc.category} | الرصيد: ${formatCurrency(acc.balance, currency)}`,
          code: acc.code,
          targetModule: 'chart-of-accounts',
          icon: <FolderTree className="w-4 h-4 text-emerald-600" />,
        });
      }
    });

    // 3. Search Inventory Items
    inventoryItems.forEach(item => {
      if (
        item.code.toLowerCase().includes(q) ||
        item.nameAr.toLowerCase().includes(q) ||
        (item.nameEn && item.nameEn.toLowerCase().includes(q)) ||
        (item.barcode && item.barcode.toLowerCase().includes(q)) ||
        (item.category && item.category.toLowerCase().includes(q))
      ) {
        results.push({
          id: `item-${item.id}`,
          category: 'INVENTORY',
          categoryLabel: 'المخزون والمستودعات',
          title: item.nameAr,
          subtitle: `الكمية: ${item.quantity} ${item.unit} | السعر: ${formatCurrency(item.salePrice, currency)}`,
          code: item.code,
          targetModule: 'inventory',
          icon: <Package className="w-4 h-4 text-amber-600" />,
        });
      }
    });

    // 4. Search Procurement (POs & PRs)
    purchaseOrders.forEach(po => {
      if (
        po.poNumber.toLowerCase().includes(q) ||
        po.vendorName.toLowerCase().includes(q) ||
        (po.notes && po.notes.toLowerCase().includes(q)) ||
        po.items.some(i => i.description.toLowerCase().includes(q))
      ) {
        results.push({
          id: `po-${po.id}`,
          category: 'PROCUREMENT',
          categoryLabel: 'أمر شراء (PO)',
          title: `أمر شراء: ${po.poNumber} (${po.vendorName})`,
          subtitle: `التاريخ: ${po.date} | الإجمالي: ${formatCurrency(po.grandTotal, po.currency)} | الحالة: ${po.status}`,
          code: po.poNumber,
          targetModule: 'procurement',
          icon: <ShoppingBag className="w-4 h-4 text-purple-600" />,
        });
      }
    });

    purchaseRequisitions.forEach(pr => {
      if (
        pr.prNumber.toLowerCase().includes(q) ||
        pr.requesterName.toLowerCase().includes(q) ||
        pr.department.toLowerCase().includes(q) ||
        (pr.purpose && pr.purpose.toLowerCase().includes(q))
      ) {
        results.push({
          id: `pr-${pr.id}`,
          category: 'PROCUREMENT',
          categoryLabel: 'طلب شراء (PR)',
          title: `طلب شراء: ${pr.prNumber} (${pr.requesterName})`,
          subtitle: `القسم: ${pr.department} | المبلغ التقديري: ${formatCurrency(pr.totalEstimatedAmount, pr.currency)}`,
          code: pr.prNumber,
          targetModule: 'procurement',
          icon: <FileText className="w-4 h-4 text-purple-600" />,
        });
      }
    });

    // 5. Search Customers
    customers.forEach(cust => {
      if (
        cust.code.toLowerCase().includes(q) ||
        cust.nameAr.toLowerCase().includes(q) ||
        (cust.phone && cust.phone.toLowerCase().includes(q)) ||
        (cust.taxNumber && cust.taxNumber.toLowerCase().includes(q))
      ) {
        results.push({
          id: `cust-${cust.id}`,
          category: 'CUSTOMER',
          categoryLabel: 'العملاء (AR)',
          title: cust.nameAr,
          subtitle: `هاتف: ${cust.phone || 'غير مسجل'} | الرصيد: ${formatCurrency(cust.currentBalance, currency)}`,
          code: cust.code,
          targetModule: 'accounts-receivable',
          icon: <Users className="w-4 h-4 text-blue-600" />,
        });
      }
    });

    // 6. Search Vendors
    vendors.forEach(vend => {
      if (
        vend.code.toLowerCase().includes(q) ||
        vend.nameAr.toLowerCase().includes(q) ||
        (vend.phone && vend.phone.toLowerCase().includes(q))
      ) {
        results.push({
          id: `vend-${vend.id}`,
          category: 'VENDOR',
          categoryLabel: 'الموردين (AP)',
          title: vend.nameAr,
          subtitle: `هاتف: ${vend.phone || 'غير مسجل'} | الرصيد: ${formatCurrency(vend.currentBalance, currency)}`,
          code: vend.code,
          targetModule: 'accounts-payable',
          icon: <Building className="w-4 h-4 text-rose-600" />,
        });
      }
    });

    // 7. Search Invoices
    invoices.forEach(inv => {
      if (
        inv.invoiceNumber.toLowerCase().includes(q) ||
        inv.customerName.toLowerCase().includes(q)
      ) {
        results.push({
          id: `inv-${inv.id}`,
          category: 'INVOICE',
          categoryLabel: 'فاتورة مبيعات',
          title: `فاتورة: ${inv.invoiceNumber} (${inv.customerName})`,
          subtitle: `التاريخ: ${inv.date} | الإجمالي: ${formatCurrency(inv.grandTotal, inv.currency)}`,
          code: inv.invoiceNumber,
          targetModule: 'accounts-receivable',
          icon: <Receipt className="w-4 h-4 text-emerald-600" />,
        });
      }
    });

    // 8. Search Employees
    employees.forEach(emp => {
      if (
        emp.employeeCode.toLowerCase().includes(q) ||
        emp.nameAr.toLowerCase().includes(q) ||
        (emp.department && emp.department.toLowerCase().includes(q)) ||
        (emp.jobTitle && emp.jobTitle.toLowerCase().includes(q))
      ) {
        results.push({
          id: `emp-${emp.id}`,
          category: 'EMPLOYEE',
          categoryLabel: 'الموظفين (HR)',
          title: emp.nameAr,
          subtitle: `الوظيفة: ${emp.jobTitle} | القسم: ${emp.department}`,
          code: emp.employeeCode,
          targetModule: 'hr-payroll',
          icon: <User className="w-4 h-4 text-indigo-600" />,
        });
      }
    });

    return results;
  }, [query, accounts, customers, vendors, inventoryItems, purchaseOrders, purchaseRequisitions, invoices, employees, currency]);

  const filteredResults = useMemo(() => {
    if (selectedCategory === 'ALL') return searchResults;
    return searchResults.filter(r => r.category === selectedCategory);
  }, [searchResults, selectedCategory]);

  const handleSelectResult = (targetModule: string) => {
    onNavigate(targetModule);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-16 sm:pt-24 p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-150" dir="rtl">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-3xl overflow-hidden flex flex-col max-h-[80vh]">
        
        {/* Search Input Header */}
        <div className="p-4 sm:p-5 bg-slate-900 text-white flex items-center gap-3 border-b border-slate-800">
          <Search className="w-5 h-5 text-blue-400 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="ابحث في كامل النظام (تطبيق، حساب شجري، صنف، أمر شراء، عميل، موظف، رمز T-Code)..."
            className="flex-1 bg-transparent text-sm sm:text-base text-white placeholder:text-slate-400 outline-none font-medium"
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
            >
              <X className="w-4 h-4" />
            </button>
          )}
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition text-xs font-mono flex items-center gap-1 border border-slate-700"
          >
            <span>ESC</span>
          </button>
        </div>

        {/* Filter Pills */}
        <div className="p-2 sm:px-4 bg-slate-50 border-b border-slate-200 flex items-center gap-1.5 overflow-x-auto text-xs font-semibold">
          {[
            { key: 'ALL', label: 'الكل' },
            { key: 'APP', label: 'التطبيقات والموديولات' },
            { key: 'ACCOUNT', label: 'شجرة الحسابات' },
            { key: 'INVENTORY', label: 'المخزون والأصناف' },
            { key: 'PROCUREMENT', label: 'المشتريات وأوامر الشراء' },
            { key: 'CUSTOMER', label: 'العملاء' },
            { key: 'VENDOR', label: 'الموردين' },
            { key: 'EMPLOYEE', label: 'الموظفين' },
          ].map(tab => (
            <button
              key={tab.key}
              onClick={() => setSelectedCategory(tab.key)}
              className={`px-3 py-1.5 rounded-xl whitespace-nowrap transition-all ${
                selectedCategory === tab.key
                  ? 'bg-blue-600 text-white shadow-2xs font-bold'
                  : 'text-slate-600 hover:bg-slate-200/80'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Results List */}
        <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-1.5 divide-y divide-slate-100">
          {filteredResults.length > 0 ? (
            filteredResults.map((item) => (
              <button
                key={item.id}
                onClick={() => handleSelectResult(item.targetModule)}
                className="w-full text-right p-3 rounded-2xl hover:bg-blue-50/70 border border-transparent hover:border-blue-200 transition-all flex items-center justify-between group"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-xl bg-slate-100 group-hover:bg-white flex items-center justify-center shrink-0 border border-slate-200 shadow-2xs transition-colors">
                    {item.icon}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-xs sm:text-sm text-slate-900 group-hover:text-blue-700 truncate">
                        {item.title}
                      </span>
                      {item.code && (
                        <span className="text-[10px] font-mono font-bold bg-slate-100 group-hover:bg-blue-100 text-slate-700 group-hover:text-blue-800 px-2 py-0.5 rounded-md border border-slate-200/70 shrink-0">
                          {item.code}
                        </span>
                      )}
                    </div>
                    {item.subtitle && (
                      <p className="text-[11px] text-slate-500 truncate mt-0.5">
                        {item.subtitle}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0 pr-2">
                  <span className="text-[10px] text-slate-400 font-medium hidden sm:inline">
                    {item.categoryLabel}
                  </span>
                  <div className="w-7 h-7 rounded-lg bg-slate-100 group-hover:bg-blue-600 group-hover:text-white flex items-center justify-center text-slate-400 transition-colors">
                    <ChevronLeft className="w-4 h-4" />
                  </div>
                </div>
              </button>
            ))
          ) : (
            <div className="p-12 text-center text-slate-400 space-y-2">
              <Search className="w-8 h-8 mx-auto text-slate-300" />
              <p className="font-bold text-xs sm:text-sm text-slate-600">
                لم يتم العثور على أي نتائج مطابقة لكلمة البحث "{query}"
              </p>
              <p className="text-xs text-slate-400">
                جرب البحث برقم الحساب، اسم الصنف، كود المورد، أو اسم الشاشة.
              </p>
            </div>
          )}
        </div>

        {/* Footer Hint */}
        <div className="p-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-[11px] text-slate-500">
          <div className="flex items-center gap-2">
            <span className="font-mono bg-white px-1.5 py-0.5 rounded border border-slate-200 font-bold">↵ Enter</span>
            <span>للانتقال الفوري للشاشة</span>
          </div>
          <div className="flex items-center gap-1 text-slate-400">
            <span>البحث الذكي الشامل</span>
            <span>•</span>
            <span>MeDo ERP Enterprise</span>
          </div>
        </div>
      </div>
    </div>
  );
};
