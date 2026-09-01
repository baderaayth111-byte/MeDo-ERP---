import React, { useState, useMemo, useRef } from 'react';
import {
  Store,
  Plus,
  RotateCcw,
  Search,
  Filter,
  FileText,
  Printer,
  Share2,
  Calendar,
  DollarSign,
  Users,
  Package,
  CheckCircle2,
  AlertCircle,
  Clock,
  Eye,
  Trash2,
  Edit,
  ArrowRight,
  TrendingUp,
  TrendingDown,
  Percent,
  Wallet,
  Building,
  Smartphone,
  Check,
  X,
  CreditCard,
  Building2,
  Receipt,
  Download,
  Barcode,
  Layers,
  Sparkles,
  ArrowDownLeft,
  ArrowUpRight
} from 'lucide-react';
import {
  Invoice,
  InvoiceItem,
  InvoiceType,
  Customer,
  InventoryItem,
  Currency,
  CompanyProfile,
  JournalEntry
} from '../types/accounting';
import { formatCurrency, tafqeetArabic } from '../utils/formatters';
import { DocumentShareModal, DocumentShareData } from './DocumentShareModal';
import { generateTLVBase64 } from '../utils/eInvoiceUtils';
import { generateQRCodeDataURL } from '../utils/qrGenerator';

interface SalesManagementViewProps {
  invoices: Invoice[];
  customers: Customer[];
  inventoryItems: InventoryItem[];
  companyProfile: CompanyProfile;
  currency: Currency;
  rates: Record<Currency, number>;
  onAddInvoice: (invoice: Invoice) => void;
  onUpdateInventoryQuantity?: (itemId: string, newQty: number) => void;
  onAddJournalEntry?: (je: JournalEntry) => void;
  onNavigateToCustomers?: () => void;
}

export const WALLET_PROVIDERS = [
  { id: 'JAWWALI', nameAr: 'محفظة جوالي (Jawwali - CAC Bank)', color: 'bg-teal-600' },
  { id: 'JAIB', nameAr: 'محفظة جيب (Jaib - Tadhamon Bank)', color: 'bg-blue-600' },
  { id: 'FLOUSAK', nameAr: 'محفظة فلوسك (Flousak - YKB Bank)', color: 'bg-purple-600' },
  { id: 'ONECASH', nameAr: 'محفظة ون كاش (OneCash - Kuraimi/Kuraimi Group)', color: 'bg-emerald-600' },
  { id: 'MOBILE_MONEY', nameAr: 'محفظة موبايل موني (Mobile Money - CAC)', color: 'bg-indigo-600' },
  { id: 'KASH', nameAr: 'محفظة كاش (Kash - Saba Bank)', color: 'bg-amber-600' },
  { id: 'OTHER_WALLET', nameAr: 'محفظة إلكترونية أخرى', color: 'bg-slate-600' },
];

export const DEFAULT_EXCHANGE_NETWORKS = [
  'شركة النجم للصرافة والتحويلات',
  'بنك الكريمي للتمويل الأصغر الإسلامي',
  'شبكة الامتياز للتحويلات المالية',
  'بنك التضامن الإسلامي الدولي',
  'بنك القطيبي الإسلامي للتمويل الأصغر',
  'شركة الحزمي للصرافة والتحويلات',
  'شركة الرائد للصرافة',
  'شركة دادية للصرافة والتحويلات',
  'شركة المريسي للصرافة',
  'بنك اليمن والكويت (YKB)',
  'البنك الأهلي اليمني',
];

export const SalesManagementView: React.FC<SalesManagementViewProps> = ({
  invoices,
  customers,
  inventoryItems,
  companyProfile,
  currency,
  rates,
  onAddInvoice,
  onUpdateInventoryQuantity,
  onAddJournalEntry,
  onNavigateToCustomers,
}) => {
  const [activeTab, setActiveTab] = useState<'ALL' | 'SALES' | 'RETURNS' | 'PAID' | 'UNPAID'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [dateFilter, setDateFilter] = useState('');

  // Modals
  const [isNewModalOpen, setIsNewModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<InvoiceType>('CUSTOMER_INVOICE');
  const [viewingInvoice, setViewingInvoice] = useState<Invoice | null>(null);
  const [shareModalDoc, setShareModalDoc] = useState<DocumentShareData | null>(null);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);

  // Exchange Networks State
  const [exchangeNetworks, setExchangeNetworks] = useState<string[]>(DEFAULT_EXCHANGE_NETWORKS);
  const [isAddingNewExchange, setIsAddingNewExchange] = useState(false);
  const [newExchangeInput, setNewExchangeInput] = useState('');

  // --- Form State for New Invoice / Return ---
  const [selectedCustomerId, setSelectedCustomerId] = useState(customers[0]?.id || '');
  const [customerSearchQuery, setCustomerSearchQuery] = useState('');
  const [isCustomerDropdownOpen, setIsCustomerDropdownOpen] = useState(false);
  const [invoiceDate, setInvoiceDate] = useState(new Date().toISOString().split('T')[0]);
  const [invoiceDueDate, setInvoiceDueDate] = useState(
    new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  );
  const [referenceInvoiceNum, setReferenceInvoiceNum] = useState('');
  const [returnReason, setReturnReason] = useState('');
  const [invoiceNotes, setInvoiceNotes] = useState('');

  // Items State in Form
  const [formItems, setFormItems] = useState<InvoiceItem[]>([]);
  const [selectedItemToAdd, setSelectedItemToAdd] = useState<InventoryItem | null>(null);
  const [itemSearchQuery, setItemSearchQuery] = useState('');
  const [isItemDropdownOpen, setIsItemDropdownOpen] = useState(false);
  const [itemQty, setItemQty] = useState<number>(1);
  const [itemPrice, setItemPrice] = useState<number>(0);
  const [itemTaxRate, setItemTaxRate] = useState<number>(0);

  // Financial & Expense Fields
  const [salesExpenses, setSalesExpenses] = useState<number>(0);
  const [expensesDescription, setExpensesDescription] = useState('مصروفات نقل وشحن وتوصيل');
  const [discountAmount, setDiscountAmount] = useState<number>(0);
  const [paidAmount, setPaidAmount] = useState<number>(0);
  const [paymentMethod, setPaymentMethod] = useState<'CASH' | 'WALLET' | 'BANK_TRANSFER' | 'CREDIT' | 'CHEQUE'>('CASH');
  const [selectedWallet, setSelectedWallet] = useState(WALLET_PROVIDERS[0].nameAr);
  const [walletRef, setWalletRef] = useState('');
  const [selectedExchange, setSelectedExchange] = useState(DEFAULT_EXCHANGE_NETWORKS[0]);
  const [exchangeRef, setExchangeRef] = useState('');
  const [cashierName, setCashierName] = useState('محمود صالح');

  // Filter Invoices: Only Sales & Sales Returns
  const salesInvoices = useMemo(() => {
    return invoices.filter(
      (inv) => inv.type === 'CUSTOMER_INVOICE' || inv.type === 'SALES_RETURN'
    );
  }, [invoices]);

  const filteredInvoices = useMemo(() => {
    return salesInvoices.filter((inv) => {
      // Tab filter
      if (activeTab === 'SALES' && inv.type !== 'CUSTOMER_INVOICE') return false;
      if (activeTab === 'RETURNS' && inv.type !== 'SALES_RETURN') return false;
      if (activeTab === 'PAID' && inv.status !== 'PAID') return false;
      if (activeTab === 'UNPAID' && inv.status === 'PAID') return false;

      // Date filter
      if (dateFilter && inv.date !== dateFilter) return false;

      // Search Query
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase().trim();
      const matchNum = inv.invoiceNumber.toLowerCase().includes(q);
      const matchCustomer = (inv.entityName || '').toLowerCase().includes(q);
      const matchNotes = (inv.notes || '').toLowerCase().includes(q);
      const matchMethod = (inv.paymentMethod || '').toLowerCase().includes(q);
      const matchExchange = (inv.exchangeNetworkName || '').toLowerCase().includes(q);
      const matchWallet = (inv.walletName || '').toLowerCase().includes(q);
      const matchItem = inv.items?.some((i) => i.description.toLowerCase().includes(q));

      return (
        matchNum ||
        matchCustomer ||
        matchNotes ||
        matchMethod ||
        matchExchange ||
        matchWallet ||
        matchItem
      );
    });
  }, [salesInvoices, activeTab, dateFilter, searchQuery]);

  // Summary Metrics
  const metrics = useMemo(() => {
    const totalSalesList = salesInvoices.filter((i) => i.type === 'CUSTOMER_INVOICE');
    const totalReturnsList = salesInvoices.filter((i) => i.type === 'SALES_RETURN');

    const totalSalesAmount = totalSalesList.reduce((sum, i) => sum + i.grandTotal, 0);
    const totalReturnsAmount = totalReturnsList.reduce((sum, i) => sum + i.grandTotal, 0);
    const totalPaidAmount = salesInvoices.reduce((sum, i) => sum + (i.paidAmount || 0), 0);
    const totalRemainingAmount = salesInvoices.reduce((sum, i) => sum + (i.remainingAmount || 0), 0);
    const totalExpensesAmount = salesInvoices.reduce((sum, i) => sum + (i.expensesAmount || 0), 0);

    const netSales = totalSalesAmount - totalReturnsAmount;

    return {
      salesCount: totalSalesList.length,
      returnsCount: totalReturnsList.length,
      totalSalesAmount,
      totalReturnsAmount,
      netSales,
      totalPaidAmount,
      totalRemainingAmount,
      totalExpensesAmount,
    };
  }, [salesInvoices]);

  // Calculations for Draft Form
  const formSubtotal = useMemo(() => {
    return formItems.reduce((sum, it) => sum + it.subtotal, 0);
  }, [formItems]);

  const formTaxTotal = useMemo(() => {
    return formItems.reduce((sum, it) => sum + it.taxAmount, 0);
  }, [formItems]);

  const formGrandTotal = useMemo(() => {
    const raw = formSubtotal + formTaxTotal + Number(salesExpenses || 0) - Number(discountAmount || 0);
    return Math.max(0, raw);
  }, [formSubtotal, formTaxTotal, salesExpenses, discountAmount]);

  const formRemaining = useMemo(() => {
    const rem = formGrandTotal - Number(paidAmount || 0);
    return rem > 0 ? rem : 0;
  }, [formGrandTotal, paidAmount]);

  // Open Create Modal
  const handleOpenCreateModal = (type: InvoiceType) => {
    setModalMode(type);
    setSelectedCustomerId(customers[0]?.id || '');
    setCustomerSearchQuery('');
    setInvoiceDate(new Date().toISOString().split('T')[0]);
    setInvoiceDueDate(
      new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
    );
    setReferenceInvoiceNum('');
    setReturnReason('');
    setInvoiceNotes(type === 'CUSTOMER_INVOICE' ? 'فاتورة مبيعات نقدية / آجلة' : 'مردودات مبيعات - إشعار دائن');
    setFormItems([]);
    setSalesExpenses(0);
    setExpensesDescription('مصروفات نقل وشحن وتوصيل');
    setDiscountAmount(0);
    setPaidAmount(0);
    setPaymentMethod('CASH');
    setIsNewModalOpen(true);
  };

  // Add Item to Form
  const handleAddItemToForm = () => {
    if (!selectedItemToAdd && !itemSearchQuery.trim()) return;

    const desc = selectedItemToAdd ? selectedItemToAdd.nameAr : itemSearchQuery.trim();
    const qty = Number(itemQty) || 1;
    const price = Number(itemPrice) || (selectedItemToAdd ? selectedItemToAdd.salePrice : 0);
    const subtotal = qty * price;
    const taxAmt = subtotal * (Number(itemTaxRate) || 0);
    const total = subtotal + taxAmt;

    const newItem: InvoiceItem = {
      id: `item-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`,
      itemId: selectedItemToAdd?.id,
      itemCode: selectedItemToAdd?.code || 'GEN-01',
      barcode: selectedItemToAdd?.barcode,
      description: desc,
      quantity: qty,
      unit: selectedItemToAdd?.unit || 'حبه',
      unitPrice: price,
      taxRate: Number(itemTaxRate) || 0,
      taxAmount: taxAmt,
      subtotal,
      total,
      accountCode: modalMode === 'CUSTOMER_INVOICE' ? '4111' : '4112',
      accountName: modalMode === 'CUSTOMER_INVOICE' ? 'إيرادات المبيعات' : 'مردودات ومسموحات المبيعات',
      currentStock: selectedItemToAdd?.quantity ?? selectedItemToAdd?.currentStock,
    };

    setFormItems((prev) => [...prev, newItem]);

    // Reset draft fields
    setSelectedItemToAdd(null);
    setItemSearchQuery('');
    setItemQty(1);
    setItemPrice(0);
    setItemTaxRate(0);
    setIsItemDropdownOpen(false);
  };

  const handleRemoveFormItem = (id: string) => {
    setFormItems((prev) => prev.filter((i) => i.id !== id));
  };

  // Handle Adding New Custom Exchange Network
  const handleAddNewExchange = () => {
    if (!newExchangeInput.trim()) return;
    const cleanName = newExchangeInput.trim();
    if (!exchangeNetworks.includes(cleanName)) {
      setExchangeNetworks((prev) => [cleanName, ...prev]);
    }
    setSelectedExchange(cleanName);
    setNewExchangeInput('');
    setIsAddingNewExchange(false);
  };

  // Submit Invoice / Return
  const handleSubmitInvoice = (e: React.FormEvent) => {
    e.preventDefault();

    if (formItems.length === 0) {
      alert('يرجى إضافة صنف واحد على الأقل إلى الفاتورة');
      return;
    }

    const customer = customers.find((c) => c.id === selectedCustomerId) || {
      id: 'WALK_IN',
      nameAr: customerSearchQuery.trim() || 'عميل نقدي / متفرقات',
      code: 'CUST-WALK',
    };

    const isSales = modalMode === 'CUSTOMER_INVOICE';
    const prefix = isSales ? 'INV-SAL' : 'RET-SAL';
    const invNumber = `${prefix}-${Date.now().toString().slice(-6)}`;

    const effectivePaid = paymentMethod === 'CREDIT' ? 0 : Number(paidAmount || formGrandTotal);
    const effectiveRemaining = Math.max(0, formGrandTotal - effectivePaid);

    let calculatedStatus: Invoice['status'] = 'UNPAID';
    if (effectiveRemaining <= 0) {
      calculatedStatus = 'PAID';
    } else if (effectivePaid > 0 && effectiveRemaining > 0) {
      calculatedStatus = 'PARTIAL';
    }

    const newInvoice: Invoice = {
      id: `inv-${Date.now()}`,
      invoiceNumber: invNumber,
      type: modalMode,
      entityId: customer.id,
      entityName: customer.nameAr,
      date: invoiceDate,
      dueDate: invoiceDueDate,
      items: formItems,
      subtotal: formSubtotal,
      taxTotal: formTaxTotal,
      expensesAmount: Number(salesExpenses || 0),
      expensesDescription: salesExpenses > 0 ? expensesDescription : undefined,
      discountAmount: Number(discountAmount || 0),
      grandTotal: formGrandTotal,
      paidAmount: effectivePaid,
      remainingAmount: effectiveRemaining,
      paymentMethod,
      walletName: paymentMethod === 'WALLET' ? selectedWallet : undefined,
      walletTransferRef: paymentMethod === 'WALLET' ? walletRef : undefined,
      exchangeNetworkName: paymentMethod === 'BANK_TRANSFER' ? selectedExchange : undefined,
      exchangeTransferRef: paymentMethod === 'BANK_TRANSFER' ? exchangeRef : undefined,
      cashierName,
      currency,
      exchangeRate: rates[currency] || 1,
      status: calculatedStatus,
      notes: invoiceNotes,
      referenceInvoiceNumber: referenceInvoiceNum.trim() || undefined,
      returnReason: returnReason.trim() || undefined,
      sync_timestamp: new Date().toISOString(),
    };

    // 1. Add invoice to state
    onAddInvoice(newInvoice);

    // 2. Update stock in inventory
    if (onUpdateInventoryQuantity) {
      formItems.forEach((it) => {
        if (it.itemId) {
          const invItem = inventoryItems.find((inv) => inv.id === it.itemId);
          if (invItem) {
            const current = Number(invItem.quantity ?? invItem.currentStock ?? 0);
            const delta = isSales ? -Number(it.quantity) : Number(it.quantity);
            const newQty = Math.max(0, current + delta);
            onUpdateInventoryQuantity(it.itemId, newQty);
          }
        }
      });
    }

    // 3. Post Automatic Journal Entry to GL
    if (onAddJournalEntry) {
      const jeNumber = `JV-${isSales ? 'SAL' : 'RET'}-${Date.now().toString().slice(-4)}`;
      const amountInBase = formGrandTotal * (rates[currency] || 1);

      // Debit account determination
      let settlementAccountCode = '1111'; // الصندوق نقد
      let settlementAccountName = 'الخزينة النقدية الرئيسية';

      if (paymentMethod === 'WALLET') {
        settlementAccountCode = '1113';
        settlementAccountName = `حساب المحافظ الإلكترونية (${selectedWallet})`;
      } else if (paymentMethod === 'BANK_TRANSFER') {
        settlementAccountCode = '1112';
        settlementAccountName = `حساب بنكي / شبكات الصرافة (${selectedExchange})`;
      } else if (paymentMethod === 'CREDIT') {
        settlementAccountCode = '1121';
        settlementAccountName = `العملاء والذمم المدينة (${customer.nameAr})`;
      }

      const je: JournalEntry = {
        id: `je-${Date.now()}`,
        entryNumber: jeNumber,
        date: invoiceDate,
        reference: invNumber,
        description: isSales
          ? `فاتورة مبيعات (${invNumber}) للعميل ${customer.nameAr} - وسيلة الدفع: ${paymentMethod}`
          : `مردودات مبيعات (${invNumber}) للعميل ${customer.nameAr} - السبب: ${returnReason || 'إرجاع بضاعة'}`,
        status: 'POSTED',
        createdBy: cashierName || 'محمود صالح (الكاشير)',
        postedAt: new Date().toISOString(),
        totalDebit: formGrandTotal,
        totalCredit: formGrandTotal,
        lines: isSales
          ? [
              {
                id: `jel-${Date.now()}-1`,
                accountCode: settlementAccountCode,
                accountName: settlementAccountName,
                description: `تحصيل/استحقاق مبيعات: ${customer.nameAr}`,
                debit: formGrandTotal,
                credit: 0,
                currency,
                exchangeRate: rates[currency] || 1,
                amountInBase,
              },
              {
                id: `jel-${Date.now()}-2`,
                accountCode: '4111',
                accountName: 'إيرادات المبيعات',
                description: `إيراد مبيعات فاتورة ${invNumber}`,
                debit: 0,
                credit: formSubtotal - Number(discountAmount || 0),
                currency,
                exchangeRate: rates[currency] || 1,
                amountInBase: (formSubtotal - Number(discountAmount || 0)) * (rates[currency] || 1),
              },
              ...(formTaxTotal > 0
                ? [
                    {
                      id: `jel-${Date.now()}-3`,
                      accountCode: '2131',
                      accountName: 'أمانات ضريبة المبيعات والقيمة المضافة',
                      description: `ضريبة مبيعات فاتورة ${invNumber}`,
                      debit: 0,
                      credit: formTaxTotal,
                      currency,
                      exchangeRate: rates[currency] || 1,
                      amountInBase: formTaxTotal * (rates[currency] || 1),
                    },
                  ]
                : []),
              ...(salesExpenses > 0
                ? [
                    {
                      id: `jel-${Date.now()}-4`,
                      accountCode: '4115',
                      accountName: 'إيرادات خدمات الشحن والتوصيل والمصروفات',
                      description: `مصروفات شحن وتوصيل فاتورة ${invNumber}`,
                      debit: 0,
                      credit: salesExpenses,
                      currency,
                      exchangeRate: rates[currency] || 1,
                      amountInBase: salesExpenses * (rates[currency] || 1),
                    },
                  ]
                : []),
            ]
          : [
              {
                id: `jel-${Date.now()}-1`,
                accountCode: '4112',
                accountName: 'مردودات ومسموحات المبيعات',
                description: `مردودات مبيعات إشعار ${invNumber}`,
                debit: formSubtotal,
                credit: 0,
                currency,
                exchangeRate: rates[currency] || 1,
                amountInBase: formSubtotal * (rates[currency] || 1),
              },
              {
                id: `jel-${Date.now()}-2`,
                accountCode: settlementAccountCode,
                accountName: settlementAccountName,
                description: `رد القيمة / تسوية رصيد العميل: ${customer.nameAr}`,
                debit: 0,
                credit: formGrandTotal,
                currency,
                exchangeRate: rates[currency] || 1,
                amountInBase,
              },
            ],
      };

      onAddJournalEntry(je);
    }

    setIsNewModalOpen(false);
    setViewingInvoice(newInvoice);
  };

  // Open Document Share Modal
  const handleShareDoc = (inv: Invoice) => {
    const shareData: DocumentShareData = {
      type: inv.type === 'SALES_RETURN' ? 'E_INVOICE' : 'E_INVOICE',
      documentNumber: inv.invoiceNumber,
      date: inv.date,
      dueDate: inv.dueDate,
      recipientName: inv.entityName,
      amount: inv.grandTotal,
      subtotal: inv.subtotal,
      taxAmount: inv.taxTotal,
      currency: inv.currency,
      items: inv.items.map((it) => ({
        name: it.description,
        quantity: it.quantity,
        unitPrice: it.unitPrice,
        total: it.total,
      })),
      verificationUrl: `https://medo-erp.cloud/v/sales?inv=${inv.invoiceNumber}`,
    };
    setShareModalDoc(shareData);
    setIsShareModalOpen(true);
  };

  // Filtered Inventory for Autocomplete
  const filteredCatalogItems = useMemo(() => {
    if (!itemSearchQuery.trim()) return inventoryItems.slice(0, 15);
    const q = itemSearchQuery.toLowerCase().trim();
    return inventoryItems
      .filter(
        (it) =>
          it.nameAr.toLowerCase().includes(q) ||
          it.code.toLowerCase().includes(q) ||
          (it.barcode && it.barcode.includes(q))
      )
      .slice(0, 20);
  }, [inventoryItems, itemSearchQuery]);

  // Filtered Customers for Autocomplete
  const filteredCustomerList = useMemo(() => {
    if (!customerSearchQuery.trim()) return customers.slice(0, 15);
    const q = customerSearchQuery.toLowerCase().trim();
    return customers
      .filter(
        (c) =>
          c.nameAr.toLowerCase().includes(q) ||
          c.code.toLowerCase().includes(q) ||
          c.phone.includes(q)
      )
      .slice(0, 15);
  }, [customers, customerSearchQuery]);

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      {/* Header Bar */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-gradient-to-br from-emerald-600 to-teal-700 text-white rounded-2xl flex items-center justify-center shadow-md">
              <Store className="w-7 h-7" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-black text-slate-900">
                  إدارة المبيعات ومردودات المبيعات
                </h1>
                <span className="bg-emerald-50 text-emerald-700 text-xs font-black px-2.5 py-1 rounded-lg border border-emerald-200">
                  SD-INV / SD-RET
                </span>
                <span className="bg-slate-100 text-slate-700 text-xs font-bold px-2 py-0.5 rounded-md">
                  الكاشير النشط: محمود صالح
                </span>
              </div>
              <p className="text-sm text-slate-500 mt-1">
                إصدار ومتابعة فواتير المبيعات، مردودات المبيعات، مصروفات الشحن، وتنوع وسائل الدفع والمحافظ وشبكات الصرافة
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => handleOpenCreateModal('CUSTOMER_INVOICE')}
              className="bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2.5 rounded-xl font-black text-sm flex items-center gap-2 shadow-sm shadow-emerald-200 transition-all cursor-pointer"
            >
              <Plus className="w-5 h-5" />
              + إنشاء فاتورة مبيعات
            </button>

            <button
              onClick={() => handleOpenCreateModal('SALES_RETURN')}
              className="bg-rose-600 hover:bg-rose-700 text-white px-4 py-2.5 rounded-xl font-black text-sm flex items-center gap-2 shadow-sm shadow-rose-200 transition-all cursor-pointer"
            >
              <RotateCcw className="w-4 h-4" />
              + إنشاء فاتورة مرتجع مبيعات
            </button>

            {onNavigateToCustomers && (
              <button
                onClick={onNavigateToCustomers}
                className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-4 py-2.5 rounded-xl font-bold text-sm flex items-center gap-2 transition-all cursor-pointer"
              >
                <Users className="w-4 h-4" />
                دليل العملاء
              </button>
            )}
          </div>
        </div>

        {/* Quick KPI Dashboard */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mt-6 pt-6 border-t border-slate-100">
          <div className="bg-emerald-50/70 border border-emerald-100 p-4 rounded-xl">
            <div className="flex items-center justify-between text-emerald-700 mb-1">
              <span className="text-xs font-bold">إجمالي المبيعات</span>
              <TrendingUp className="w-4 h-4" />
            </div>
            <div className="text-lg font-black text-emerald-900">
              {formatCurrency(metrics.totalSalesAmount, currency)}
            </div>
            <span className="text-[11px] text-emerald-600 font-bold">
              {metrics.salesCount} فاتورة مبيعات
            </span>
          </div>

          <div className="bg-rose-50/70 border border-rose-100 p-4 rounded-xl">
            <div className="flex items-center justify-between text-rose-700 mb-1">
              <span className="text-xs font-bold">مردودات المبيعات</span>
              <RotateCcw className="w-4 h-4" />
            </div>
            <div className="text-lg font-black text-rose-900">
              {formatCurrency(metrics.totalReturnsAmount, currency)}
            </div>
            <span className="text-[11px] text-rose-600 font-bold">
              {metrics.returnsCount} إشعار مرتجع
            </span>
          </div>

          <div className="bg-blue-50/70 border border-blue-100 p-4 rounded-xl">
            <div className="flex items-center justify-between text-blue-700 mb-1">
              <span className="text-xs font-bold">صافي المبيعات</span>
              <DollarSign className="w-4 h-4" />
            </div>
            <div className="text-lg font-black text-blue-900">
              {formatCurrency(metrics.netSales, currency)}
            </div>
            <span className="text-[11px] text-blue-600 font-bold">
              بعد خصم المرتجعات
            </span>
          </div>

          <div className="bg-teal-50/70 border border-teal-100 p-4 rounded-xl">
            <div className="flex items-center justify-between text-teal-700 mb-1">
              <span className="text-xs font-bold">المبالغ المحصلة (نقد/محافظ/بنوك)</span>
              <CheckCircle2 className="w-4 h-4" />
            </div>
            <div className="text-lg font-black text-teal-900">
              {formatCurrency(metrics.totalPaidAmount, currency)}
            </div>
            <span className="text-[11px] text-teal-600 font-bold">
              مدفوع ومحصل
            </span>
          </div>

          <div className="bg-amber-50/70 border border-amber-100 p-4 rounded-xl col-span-2 md:col-span-1">
            <div className="flex items-center justify-between text-amber-700 mb-1">
              <span className="text-xs font-bold">الآجل والمتبقي (الذمم)</span>
              <Clock className="w-4 h-4" />
            </div>
            <div className="text-lg font-black text-amber-900">
              {formatCurrency(metrics.totalRemainingAmount, currency)}
            </div>
            <span className="text-[11px] text-amber-600 font-bold">
              ذمم مدينة معلقة
            </span>
          </div>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row items-center justify-between gap-3">
          {/* Tabs */}
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl w-full md:w-auto overflow-x-auto">
            <button
              onClick={() => setActiveTab('ALL')}
              className={`px-4 py-2 rounded-lg text-xs font-black transition-all cursor-pointer whitespace-nowrap ${
                activeTab === 'ALL'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              جميع العمليات ({salesInvoices.length})
            </button>
            <button
              onClick={() => setActiveTab('SALES')}
              className={`px-4 py-2 rounded-lg text-xs font-black transition-all cursor-pointer whitespace-nowrap ${
                activeTab === 'SALES'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              فواتير المبيعات ({metrics.salesCount})
            </button>
            <button
              onClick={() => setActiveTab('RETURNS')}
              className={`px-4 py-2 rounded-lg text-xs font-black transition-all cursor-pointer whitespace-nowrap ${
                activeTab === 'RETURNS'
                  ? 'bg-rose-600 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              مردودات المبيعات ({metrics.returnsCount})
            </button>
            <button
              onClick={() => setActiveTab('PAID')}
              className={`px-4 py-2 rounded-lg text-xs font-black transition-all cursor-pointer whitespace-nowrap ${
                activeTab === 'PAID'
                  ? 'bg-teal-600 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              المسددة بالكامل
            </button>
            <button
              onClick={() => setActiveTab('UNPAID')}
              className={`px-4 py-2 rounded-lg text-xs font-black transition-all cursor-pointer whitespace-nowrap ${
                activeTab === 'UNPAID'
                  ? 'bg-amber-600 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              الآجلة وغير المسددة
            </button>
          </div>

          {/* Search Inputs */}
          <div className="flex items-center gap-2 w-full md:w-auto">
            <div className="relative flex-1 md:w-72">
              <Search className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="بحث برقم الفاتورة، العميل، الصنف، وسيلة الدفع..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-3 pr-9 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-slate-50 focus:bg-white"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs"
                >
                  ✕
                </button>
              )}
            </div>

            <input
              type="date"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="py-2 px-3 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-slate-50 text-slate-700"
            />
            {dateFilter && (
              <button
                onClick={() => setDateFilter('')}
                className="text-xs text-rose-600 hover:underline font-bold"
              >
                إلغاء التاريخ
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Main Invoices Table */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-right border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 text-xs font-black">
                <th className="py-3.5 px-4">رقم الفاتورة والنوع</th>
                <th className="py-3.5 px-4">العميل</th>
                <th className="py-3.5 px-4">التاريخ</th>
                <th className="py-3.5 px-4">الأصناف</th>
                <th className="py-3.5 px-4">وسيلة الدفع والصرافة</th>
                <th className="py-3.5 px-4">المصروفات</th>
                <th className="py-3.5 px-4">الإجمالي النهائي</th>
                <th className="py-3.5 px-4">المدفوع والمتبقي</th>
                <th className="py-3.5 px-4">الحالة</th>
                <th className="py-3.5 px-4 text-center">الإجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {filteredInvoices.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-12 text-center text-slate-400">
                    <Store className="w-12 h-12 mx-auto mb-2 text-slate-300" />
                    <p className="font-bold text-sm text-slate-600">لا توجد فواتير مبيعات أو مردودات مطابقة للبحث</p>
                    <p className="text-xs text-slate-400 mt-1">اضغط على زر "+ إنشاء فاتورة مبيعات" للبدء في إصدار أول فاتورة</p>
                  </td>
                </tr>
              ) : (
                filteredInvoices.map((inv) => {
                  const isReturn = inv.type === 'SALES_RETURN';
                  return (
                    <tr
                      key={inv.id}
                      className="hover:bg-slate-50/80 transition-colors group"
                    >
                      {/* Number & Type */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2">
                          <div
                            className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                              isReturn
                                ? 'bg-rose-100 text-rose-700'
                                : 'bg-emerald-100 text-emerald-700'
                            }`}
                          >
                            {isReturn ? (
                              <RotateCcw className="w-4 h-4" />
                            ) : (
                              <Store className="w-4 h-4" />
                            )}
                          </div>
                          <div>
                            <div className="font-black text-slate-900">
                              {inv.invoiceNumber}
                            </div>
                            <span
                              className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                                isReturn
                                  ? 'bg-rose-50 text-rose-700 border border-rose-200'
                                  : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              }`}
                            >
                              {isReturn ? 'مردودات مبيعات' : 'فاتورة مبيعات'}
                            </span>
                            {inv.referenceInvoiceNumber && (
                              <div className="text-[10px] text-slate-400 mt-0.5">
                                مرجع: {inv.referenceInvoiceNumber}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Customer */}
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-slate-900">{inv.entityName}</div>
                        {inv.cashierName && (
                          <div className="text-[10px] text-slate-400">
                            الكاشير: {inv.cashierName}
                          </div>
                        )}
                      </td>

                      {/* Date */}
                      <td className="py-3.5 px-4">
                        <div className="text-slate-700 font-bold">{inv.date}</div>
                        {inv.dueDate && (
                          <div className="text-[10px] text-slate-400">
                            استحقاق: {inv.dueDate}
                          </div>
                        )}
                      </td>

                      {/* Items */}
                      <td className="py-3.5 px-4">
                        <span className="bg-slate-100 text-slate-700 font-bold px-2 py-1 rounded-md">
                          {inv.items?.length || 0} أصناف
                        </span>
                      </td>

                      {/* Payment Method & Exchange */}
                      <td className="py-3.5 px-4">
                        <div className="space-y-1">
                          {inv.paymentMethod === 'CASH' && (
                            <span className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-700 font-black px-2 py-0.5 rounded text-[11px] border border-emerald-200">
                              <DollarSign className="w-3 h-3" />
                              نقداً (كاش)
                            </span>
                          )}

                          {inv.paymentMethod === 'WALLET' && (
                            <span className="inline-flex items-center gap-1 bg-purple-50 text-purple-700 font-black px-2 py-0.5 rounded text-[11px] border border-purple-200">
                              <Smartphone className="w-3 h-3" />
                              {inv.walletName || 'محفظة إلكترونية'}
                            </span>
                          )}

                          {inv.paymentMethod === 'BANK_TRANSFER' && (
                            <span className="inline-flex items-center gap-1 bg-blue-50 text-blue-700 font-black px-2 py-0.5 rounded text-[11px] border border-blue-200">
                              <Building className="w-3 h-3" />
                              {inv.exchangeNetworkName || 'حوالة مصرفية/صرافة'}
                            </span>
                          )}

                          {inv.paymentMethod === 'CREDIT' && (
                            <span className="inline-flex items-center gap-1 bg-amber-50 text-amber-700 font-black px-2 py-0.5 rounded text-[11px] border border-amber-200">
                              <Clock className="w-3 h-3" />
                              آجل / على الحساب
                            </span>
                          )}

                          {inv.exchangeTransferRef && (
                            <div className="text-[10px] text-slate-400">
                              سند/حوالة: {inv.exchangeTransferRef}
                            </div>
                          )}
                          {inv.walletTransferRef && (
                            <div className="text-[10px] text-slate-400">
                              عملية المحفظة: {inv.walletTransferRef}
                            </div>
                          )}
                        </div>
                      </td>

                      {/* Sales Expenses */}
                      <td className="py-3.5 px-4">
                        {inv.expensesAmount && inv.expensesAmount > 0 ? (
                          <div>
                            <span className="font-bold text-amber-700">
                              {formatCurrency(inv.expensesAmount, currency)}
                            </span>
                            <div className="text-[10px] text-slate-400 truncate max-w-[120px]">
                              {inv.expensesDescription || 'شحن ونقل'}
                            </div>
                          </div>
                        ) : (
                          <span className="text-slate-400">-</span>
                        )}
                      </td>

                      {/* Grand Total */}
                      <td className="py-3.5 px-4">
                        <div
                          className={`font-black text-sm ${
                            isReturn ? 'text-rose-700' : 'text-slate-900'
                          }`}
                        >
                          {isReturn ? '-' : ''}
                          {formatCurrency(inv.grandTotal, currency)}
                        </div>
                        {inv.taxTotal > 0 && (
                          <div className="text-[10px] text-slate-400">
                            ضريبة: {formatCurrency(inv.taxTotal, currency)}
                          </div>
                        )}
                      </td>

                      {/* Paid & Remaining */}
                      <td className="py-3.5 px-4">
                        <div className="text-emerald-700 font-bold">
                          مدفوع: {formatCurrency(inv.paidAmount || 0, currency)}
                        </div>
                        {inv.remainingAmount > 0 && (
                          <div className="text-rose-600 font-bold text-[11px]">
                            متبقي: {formatCurrency(inv.remainingAmount, currency)}
                          </div>
                        )}
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4">
                        {inv.status === 'PAID' && (
                          <span className="bg-emerald-100 text-emerald-800 font-black px-2.5 py-1 rounded-full text-[10px] inline-flex items-center gap-1">
                            <Check className="w-3 h-3" />
                            مسددة بالكامل
                          </span>
                        )}
                        {inv.status === 'PARTIAL' && (
                          <span className="bg-amber-100 text-amber-800 font-black px-2.5 py-1 rounded-full text-[10px] inline-flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            مسددة جزئياً
                          </span>
                        )}
                        {inv.status === 'UNPAID' && (
                          <span className="bg-rose-100 text-rose-800 font-black px-2.5 py-1 rounded-full text-[10px] inline-flex items-center gap-1">
                            <AlertCircle className="w-3 h-3" />
                            آجلة / غير مسددة
                          </span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => setViewingInvoice(inv)}
                            className="p-1.5 hover:bg-slate-200 text-slate-700 rounded-lg transition-colors cursor-pointer"
                            title="عرض وطباعة الفاتورة"
                          >
                            <Printer className="w-4 h-4 text-slate-600" />
                          </button>
                          <button
                            onClick={() => handleShareDoc(inv)}
                            className="p-1.5 hover:bg-emerald-100 text-emerald-700 rounded-lg transition-colors cursor-pointer"
                            title="مشاركة عبر واتساب / تحميل"
                          >
                            <Share2 className="w-4 h-4" />
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

      {/* ========================================================================= */}
      {/* Modal: Create Sales Invoice or Sales Return */}
      {/* ========================================================================= */}
      {isNewModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden">
            {/* Modal Header */}
            <div
              className={`p-5 text-white flex items-center justify-between ${
                modalMode === 'CUSTOMER_INVOICE'
                  ? 'bg-gradient-to-r from-emerald-700 to-teal-800'
                  : 'bg-gradient-to-r from-rose-700 to-red-800'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center">
                  {modalMode === 'CUSTOMER_INVOICE' ? (
                    <Store className="w-6 h-6" />
                  ) : (
                    <RotateCcw className="w-6 h-6" />
                  )}
                </div>
                <div>
                  <h2 className="text-lg font-black">
                    {modalMode === 'CUSTOMER_INVOICE'
                      ? 'إنشاء فاتورة مبيعات جديدة'
                      : 'إنشاء فاتورة مردودات مبيعات (إشعار دائن)'}
                  </h2>
                  <p className="text-xs text-white/80">
                    {modalMode === 'CUSTOMER_INVOICE'
                      ? 'إدراج أصناف المبيعات وتحديد مصروفات الشحن والتسوية وطرق الدفع'
                      : 'إرجاع أصناف مبيعات ورد المبالغ أو تسوية حساب العميل'}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsNewModalOpen(false)}
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleSubmitInvoice} className="flex-1 overflow-y-auto p-6 space-y-6">
              {/* Type Switcher & Basic Info */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-200">
                {/* Mode Selector */}
                <div>
                  <label className="block text-xs font-black text-slate-700 mb-1">
                    نوع المستند
                  </label>
                  <div className="flex rounded-xl bg-white border border-slate-200 p-1">
                    <button
                      type="button"
                      onClick={() => setModalMode('CUSTOMER_INVOICE')}
                      className={`flex-1 py-1.5 text-xs font-black rounded-lg transition-all ${
                        modalMode === 'CUSTOMER_INVOICE'
                          ? 'bg-emerald-600 text-white shadow-sm'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      فاتورة مبيعات
                    </button>
                    <button
                      type="button"
                      onClick={() => setModalMode('SALES_RETURN')}
                      className={`flex-1 py-1.5 text-xs font-black rounded-lg transition-all ${
                        modalMode === 'SALES_RETURN'
                          ? 'bg-rose-600 text-white shadow-sm'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      مرتجع مبيعات
                    </button>
                  </div>
                </div>

                {/* Customer Autocomplete Selector */}
                <div className="relative">
                  <label className="block text-xs font-black text-slate-700 mb-1">
                    العميل المستفيد *
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="ابحث عن اسم أو كود العميل..."
                      value={customerSearchQuery}
                      onFocus={() => setIsCustomerDropdownOpen(true)}
                      onChange={(e) => {
                        setCustomerSearchQuery(e.target.value);
                        setIsCustomerDropdownOpen(true);
                      }}
                      className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
                    />
                    <Users className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  </div>

                  {isCustomerDropdownOpen && (
                    <div className="absolute z-20 top-full right-0 left-0 mt-1 bg-white border border-slate-200 rounded-xl shadow-xl max-h-48 overflow-y-auto divide-y divide-slate-100">
                      <div
                        onClick={() => {
                          setSelectedCustomerId('WALK_IN');
                          setCustomerSearchQuery('عميل نقدي / متفرقات');
                          setIsCustomerDropdownOpen(false);
                        }}
                        className="p-2.5 hover:bg-emerald-50 cursor-pointer text-xs font-black text-emerald-800 flex items-center justify-between"
                      >
                        <span>عميل نقدي / مبيعات متفرقة (Walk-in)</span>
                        <span className="text-[10px] bg-emerald-100 px-1.5 py-0.5 rounded">افتراضي</span>
                      </div>
                      {filteredCustomerList.map((c) => (
                        <div
                          key={c.id}
                          onClick={() => {
                            setSelectedCustomerId(c.id);
                            setCustomerSearchQuery(c.nameAr);
                            setIsCustomerDropdownOpen(false);
                          }}
                          className="p-2.5 hover:bg-slate-50 cursor-pointer text-xs flex items-center justify-between"
                        >
                          <div>
                            <span className="font-bold text-slate-900">{c.nameAr}</span>
                            <span className="text-[10px] text-slate-400 mr-2 font-mono">({c.code})</span>
                          </div>
                          <span className="text-[10px] text-slate-500">{c.city}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Cashier Name */}
                <div>
                  <label className="block text-xs font-black text-slate-700 mb-1">
                    اسم الكاشير / المسؤول
                  </label>
                  <input
                    type="text"
                    value={cashierName}
                    onChange={(e) => setCashierName(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
                  />
                </div>
              </div>

              {/* Dates & Return specific reference */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-black text-slate-700 mb-1">
                    تاريخ الفاتورة
                  </label>
                  <input
                    type="date"
                    value={invoiceDate}
                    onChange={(e) => setInvoiceDate(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-black text-slate-700 mb-1">
                    تاريخ استحقاق السداد
                  </label>
                  <input
                    type="date"
                    value={invoiceDueDate}
                    onChange={(e) => setInvoiceDueDate(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                {modalMode === 'SALES_RETURN' ? (
                  <div>
                    <label className="block text-xs font-black text-rose-700 mb-1">
                      رقم فاتورة المبيعات الأصلية المرجعية
                    </label>
                    <input
                      type="text"
                      placeholder="مثال: INV-SAL-1002"
                      value={referenceInvoiceNum}
                      onChange={(e) => setReferenceInvoiceNum(e.target.value)}
                      className="w-full px-3 py-2 text-xs border border-rose-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-500 bg-rose-50/50"
                    />
                  </div>
                ) : (
                  <div>
                    <label className="block text-xs font-black text-slate-700 mb-1">
                      العملة الحالية
                    </label>
                    <div className="px-3 py-2 text-xs bg-slate-100 rounded-xl font-black text-slate-700 flex items-center justify-between">
                      <span>{currency === 'YER' ? 'ريال يمني (YER)' : currency === 'SAR' ? 'ريال سعودي (SAR)' : 'دولار أمريكي (USD)'}</span>
                      <span className="text-[10px] text-slate-500">سعر الصرف: 1</span>
                    </div>
                  </div>
                )}
              </div>

              {modalMode === 'SALES_RETURN' && (
                <div className="bg-rose-50 border border-rose-200 p-3 rounded-2xl">
                  <label className="block text-xs font-black text-rose-900 mb-1">
                    سبب المردودات / ملاحظة الإرجاع *
                  </label>
                  <input
                    type="text"
                    placeholder="مثال: عيب مصنعي، صنف غير مطابق للطلب، فائض كمية..."
                    value={returnReason}
                    onChange={(e) => setReturnReason(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-rose-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-rose-500"
                  />
                </div>
              )}

              {/* ================================================================= */}
              {/* Item Fast Adder Section */}
              {/* ================================================================= */}
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-black text-slate-900 flex items-center gap-2">
                    <Package className="w-4 h-4 text-emerald-600" />
                    إضافة أصناف الفاتورة من المخزن
                  </h3>
                  <span className="text-[11px] text-slate-500">
                    البحث التلقائي بالاسم، الباركود، أو الكود
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-end">
                  {/* Item Search Autocomplete */}
                  <div className="md:col-span-5 relative">
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">
                      اسم الصنف أو الباركود
                    </label>
                    <input
                      type="text"
                      placeholder="ابحث بالاسم أو امسح الباركود..."
                      value={itemSearchQuery}
                      onFocus={() => setIsItemDropdownOpen(true)}
                      onChange={(e) => {
                        setItemSearchQuery(e.target.value);
                        setIsItemDropdownOpen(true);
                      }}
                      className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />

                    {isItemDropdownOpen && (
                      <div className="absolute z-30 top-full right-0 left-0 mt-1 bg-white border border-slate-200 rounded-xl shadow-xl max-h-48 overflow-y-auto divide-y divide-slate-100">
                        {filteredCatalogItems.map((it) => (
                          <div
                            key={it.id}
                            onClick={() => {
                              setSelectedItemToAdd(it);
                              setItemSearchQuery(it.nameAr);
                              setItemPrice(it.salePrice || 0);
                              setIsItemDropdownOpen(false);
                            }}
                            className="p-2.5 hover:bg-emerald-50 cursor-pointer text-xs flex items-center justify-between"
                          >
                            <div>
                              <div className="font-bold text-slate-900">{it.nameAr}</div>
                              <div className="text-[10px] text-slate-400">
                                كود: {it.code} | باركود: {it.barcode || 'لا يوجد'}
                              </div>
                            </div>
                            <div className="text-left">
                              <div className="font-black text-emerald-700">
                                {formatCurrency(it.salePrice || 0, currency)}
                              </div>
                              <div className="text-[10px] text-slate-500">
                                متوفر: {it.quantity ?? it.currentStock ?? 0} {it.unit || 'حبه'}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Qty */}
                  <div className="md:col-span-2">
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">
                      الكمية
                    </label>
                    <input
                      type="number"
                      min="0.01"
                      step="any"
                      value={itemQty}
                      onChange={(e) => setItemQty(parseFloat(e.target.value) || 0)}
                      className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>

                  {/* Price */}
                  <div className="md:col-span-2">
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">
                      سعر الوحدة
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="any"
                      value={itemPrice}
                      onChange={(e) => setItemPrice(parseFloat(e.target.value) || 0)}
                      className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>

                  {/* Tax Rate */}
                  <div className="md:col-span-1">
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">
                      ضريبة %
                    </label>
                    <select
                      value={itemTaxRate}
                      onChange={(e) => setItemTaxRate(parseFloat(e.target.value) || 0)}
                      className="w-full px-2 py-2 text-xs border border-slate-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    >
                      <option value="0">0%</option>
                      <option value="0.05">5%</option>
                      <option value="0.15">15%</option>
                    </select>
                  </div>

                  {/* Add Button */}
                  <div className="md:col-span-2">
                    <button
                      type="button"
                      onClick={handleAddItemToForm}
                      className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-2 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-1 cursor-pointer"
                    >
                      <Plus className="w-4 h-4" />
                      إدراج الصنف
                    </button>
                  </div>
                </div>

                {/* Table of Added Items */}
                {formItems.length > 0 && (
                  <div className="border border-slate-200 rounded-xl overflow-hidden mt-3">
                    <table className="w-full text-right text-xs bg-white">
                      <thead className="bg-slate-100 text-slate-600 font-bold border-b border-slate-200">
                        <tr>
                          <th className="p-2.5">الصنف والبيان</th>
                          <th className="p-2.5">الكمية</th>
                          <th className="p-2.5">السعر</th>
                          <th className="p-2.5">الإجمالي</th>
                          <th className="p-2.5 text-center">حذف</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {formItems.map((it) => (
                          <tr key={it.id} className="hover:bg-slate-50">
                            <td className="p-2.5 font-bold text-slate-800">
                              {it.description}
                              {it.itemCode && (
                                <span className="text-[10px] text-slate-400 mr-2 font-mono">
                                  [{it.itemCode}]
                                </span>
                              )}
                            </td>
                            <td className="p-2.5 text-slate-700">
                              {it.quantity} {it.unit || 'حبه'}
                            </td>
                            <td className="p-2.5 text-slate-700">
                              {formatCurrency(it.unitPrice, currency)}
                            </td>
                            <td className="p-2.5 font-black text-emerald-800">
                              {formatCurrency(it.total, currency)}
                            </td>
                            <td className="p-2.5 text-center">
                              <button
                                type="button"
                                onClick={() => handleRemoveFormItem(it.id)}
                                className="text-rose-500 hover:text-rose-700 p-1"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* ================================================================= */}
              {/* Sales Expenses & Discounts Section (طلب المستخدم لفتح خانات مصروفات) */}
              {/* ================================================================= */}
              <div className="bg-amber-50/60 border border-amber-200 rounded-2xl p-4 space-y-3">
                <div className="flex items-center gap-2">
                  <Receipt className="w-4 h-4 text-amber-700" />
                  <h3 className="text-xs font-black text-amber-900">
                    مصروفات المبيعات والشحن والخصم التجاري
                  </h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      مبلغ مصروفات المبيعات / التوصيل
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="any"
                      placeholder="0"
                      value={salesExpenses || ''}
                      onChange={(e) => setSalesExpenses(parseFloat(e.target.value) || 0)}
                      className="w-full px-3 py-2 text-xs border border-amber-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      بيان وتفاصيل المصروفات
                    </label>
                    <input
                      type="text"
                      placeholder="أجور نقل، شحن، عمالة..."
                      value={expensesDescription}
                      onChange={(e) => setExpensesDescription(e.target.value)}
                      className="w-full px-3 py-2 text-xs border border-amber-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      الخصم التجاري الممنوح
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="any"
                      placeholder="0"
                      value={discountAmount || ''}
                      onChange={(e) => setDiscountAmount(parseFloat(e.target.value) || 0)}
                      className="w-full px-3 py-2 text-xs border border-amber-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                    />
                  </div>
                </div>
              </div>

              {/* ================================================================= */}
              {/* Payment Methods Section (نقد، محافظ، صرافة وبنوك، آجل) */}
              {/* ================================================================= */}
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-black text-slate-900 flex items-center gap-2">
                    <Wallet className="w-4 h-4 text-teal-600" />
                    تنوع وسائل الدفع والتسوية المالية
                  </h3>
                  <span className="text-[11px] font-bold text-slate-500">
                    نقد / محافظ إلكترونية (جوالي، جيب، فلوسك) / شبكات الصرافة
                  </span>
                </div>

                {/* Method Radio Buttons */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setPaymentMethod('CASH');
                      setPaidAmount(formGrandTotal);
                    }}
                    className={`p-3 rounded-xl border text-center transition-all cursor-pointer ${
                      paymentMethod === 'CASH'
                        ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                        : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <DollarSign className="w-5 h-5 mx-auto mb-1" />
                    <span className="text-xs font-black block">نقداً (كاش)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setPaymentMethod('WALLET');
                      setPaidAmount(formGrandTotal);
                    }}
                    className={`p-3 rounded-xl border text-center transition-all cursor-pointer ${
                      paymentMethod === 'WALLET'
                        ? 'bg-purple-600 text-white border-purple-600 shadow-sm'
                        : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <Smartphone className="w-5 h-5 mx-auto mb-1" />
                    <span className="text-xs font-black block">محافظ محلية</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setPaymentMethod('BANK_TRANSFER');
                      setPaidAmount(formGrandTotal);
                    }}
                    className={`p-3 rounded-xl border text-center transition-all cursor-pointer ${
                      paymentMethod === 'BANK_TRANSFER'
                        ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                        : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <Building className="w-5 h-5 mx-auto mb-1" />
                    <span className="text-xs font-black block">حوالة / صرافة</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setPaymentMethod('CREDIT');
                      setPaidAmount(0);
                    }}
                    className={`p-3 rounded-xl border text-center transition-all cursor-pointer ${
                      paymentMethod === 'CREDIT'
                        ? 'bg-amber-600 text-white border-amber-600 shadow-sm'
                        : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <Clock className="w-5 h-5 mx-auto mb-1" />
                    <span className="text-xs font-black block">آجل / على الحساب</span>
                  </button>
                </div>

                {/* Sub-form when WALLET is selected */}
                {paymentMethod === 'WALLET' && (
                  <div className="bg-purple-50 border border-purple-200 p-4 rounded-xl space-y-3 animate-fadeIn">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-black text-purple-900">
                        تحديد المحفظة الإلكترونية المحلية ورقم العملية
                      </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[11px] font-bold text-purple-800 mb-1">
                          اسم المحفظة (جوالي، جيب، فلوسك، ون كاش...)
                        </label>
                        <select
                          value={selectedWallet}
                          onChange={(e) => setSelectedWallet(e.target.value)}
                          className="w-full px-3 py-2 text-xs border border-purple-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-purple-500 font-bold"
                        >
                          {WALLET_PROVIDERS.map((w) => (
                            <option key={w.id} value={w.nameAr}>
                              {w.nameAr}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-purple-800 mb-1">
                          رقم الإشعار / الحوالة / رقم الهاتف
                        </label>
                        <input
                          type="text"
                          placeholder="مثال: TRX-884920 أو 771514463"
                          value={walletRef}
                          onChange={(e) => setWalletRef(e.target.value)}
                          className="w-full px-3 py-2 text-xs border border-purple-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* Sub-form when BANK / EXCHANGE is selected */}
                {paymentMethod === 'BANK_TRANSFER' && (
                  <div className="bg-blue-50 border border-blue-200 p-4 rounded-xl space-y-3 animate-fadeIn">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-black text-blue-900">
                        تحديد شبكة الصرافة أو البنك مع إمكانية إضافة صرافة جديدة
                      </span>
                      <button
                        type="button"
                        onClick={() => setIsAddingNewExchange(!isAddingNewExchange)}
                        className="text-xs text-blue-700 hover:text-blue-900 font-black flex items-center gap-1 bg-white px-2 py-1 rounded-lg border border-blue-200 cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        {isAddingNewExchange ? 'إلغاء' : '+ إضافة صرافة جديدة'}
                      </button>
                    </div>

                    {isAddingNewExchange && (
                      <div className="flex items-center gap-2 bg-white p-2.5 rounded-xl border border-blue-300">
                        <input
                          type="text"
                          placeholder="اكتب اسم شركة أو شبكة الصرافة الجديدة..."
                          value={newExchangeInput}
                          onChange={(e) => setNewExchangeInput(e.target.value)}
                          className="flex-1 px-3 py-1.5 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        <button
                          type="button"
                          onClick={handleAddNewExchange}
                          className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-lg text-xs font-black cursor-pointer"
                        >
                          حفظ الصرافة
                        </button>
                      </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[11px] font-bold text-blue-800 mb-1">
                          شركة / شبكة الصرافة المعتمدة
                        </label>
                        <select
                          value={selectedExchange}
                          onChange={(e) => setSelectedExchange(e.target.value)}
                          className="w-full px-3 py-2 text-xs border border-blue-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-bold"
                        >
                          {exchangeNetworks.map((ex, idx) => (
                            <option key={idx} value={ex}>
                              {ex}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-blue-800 mb-1">
                          رقم السند / الحوالة / إشعار الإيداع
                        </label>
                        <input
                          type="text"
                          placeholder="مثال: سند قيد رقم 99401"
                          value={exchangeRef}
                          onChange={(e) => setExchangeRef(e.target.value)}
                          className="w-full px-3 py-2 text-xs border border-blue-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* Paid & Remaining Amounts */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
                  <div>
                    <label className="block text-xs font-black text-emerald-800 mb-1">
                      المبلغ المدفوع / المستلم فعلياً *
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="any"
                      value={paidAmount || ''}
                      onChange={(e) => setPaidAmount(parseFloat(e.target.value) || 0)}
                      className="w-full px-3 py-2.5 text-sm font-black text-emerald-900 border border-emerald-300 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-black text-rose-800 mb-1">
                      المبلغ المتبقي (آجل على ذمة العميل)
                    </label>
                    <div className="px-3 py-2.5 text-sm font-black text-rose-700 bg-rose-50 border border-rose-200 rounded-xl">
                      {formatCurrency(formRemaining, currency)}
                    </div>
                  </div>
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-xs font-black text-slate-700 mb-1">
                  ملاحظات أو شروط الفاتورة
                </label>
                <textarea
                  rows={2}
                  value={invoiceNotes}
                  onChange={(e) => setInvoiceNotes(e.target.value)}
                  placeholder="ملاحظات إضافية، تعليمات التسليم..."
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              {/* Grand Total Summary Box */}
              <div className="bg-slate-900 text-white p-5 rounded-2xl space-y-2">
                <div className="flex justify-between items-center text-xs text-slate-300">
                  <span>إجمالي الأصناف الخاضعة:</span>
                  <span>{formatCurrency(formSubtotal, currency)}</span>
                </div>
                {formTaxTotal > 0 && (
                  <div className="flex justify-between items-center text-xs text-slate-300">
                    <span>إجمالي الضريبة:</span>
                    <span>{formatCurrency(formTaxTotal, currency)}</span>
                  </div>
                )}
                {salesExpenses > 0 && (
                  <div className="flex justify-between items-center text-xs text-amber-300">
                    <span>مصروفات الشحن والتوصيل (+):</span>
                    <span>{formatCurrency(salesExpenses, currency)}</span>
                  </div>
                )}
                {discountAmount > 0 && (
                  <div className="flex justify-between items-center text-xs text-rose-300">
                    <span>الخصم التجاري (-):</span>
                    <span>{formatCurrency(discountAmount, currency)}</span>
                  </div>
                )}
                <div className="border-t border-slate-800 pt-2 flex justify-between items-center">
                  <span className="text-sm font-black">الصافي الإجمالي النهائي:</span>
                  <span className="text-xl font-black text-emerald-400">
                    {formatCurrency(formGrandTotal, currency)}
                  </span>
                </div>
                <div className="text-[11px] text-slate-400 text-left font-bold pt-1">
                  فقط {tafqeetArabic(formGrandTotal, currency)} لا غير
                </div>
              </div>

              {/* Modal Actions */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsNewModalOpen(false)}
                  className="px-5 py-2.5 rounded-xl border border-slate-200 text-slate-700 text-xs font-bold hover:bg-slate-100 transition-all cursor-pointer"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className={`px-6 py-2.5 rounded-xl text-white text-xs font-black shadow-md transition-all cursor-pointer ${
                    modalMode === 'CUSTOMER_INVOICE'
                      ? 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-200'
                      : 'bg-rose-600 hover:bg-rose-700 shadow-rose-200'
                  }`}
                >
                  {modalMode === 'CUSTOMER_INVOICE'
                    ? 'حفظ وترحيل فاتورة المبيعات'
                    : 'حفظ وترحيل مرتجع المبيعات'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* Modal: View & Print Invoice */}
      {/* ========================================================================= */}
      {viewingInvoice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-3xl max-h-[92vh] flex flex-col overflow-hidden">
            <div className="p-4 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Printer className="w-5 h-5 text-emerald-400" />
                <span className="font-black text-sm">
                  عرض وطباعة المستند: {viewingInvoice.invoiceNumber}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => window.print()}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1.5 rounded-lg text-xs font-black flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5" />
                  طباعة A4
                </button>
                <button
                  onClick={() => handleShareDoc(viewingInvoice)}
                  className="bg-teal-600 hover:bg-teal-700 text-white px-3 py-1.5 rounded-lg text-xs font-black flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Share2 className="w-3.5 h-3.5" />
                  مشاركة واتساب
                </button>
                <button
                  onClick={() => setViewingInvoice(null)}
                  className="w-7 h-7 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Invoice Printable View */}
            <div className="p-8 overflow-y-auto space-y-6 bg-white print:p-0">
              {/* Company Header */}
              <div className="flex justify-between items-start border-b-2 border-slate-900 pb-6">
                <div>
                  <h2 className="text-xl font-black text-slate-900">
                    {companyProfile.nameAr || 'مؤسسة ميم للأعمال التجارية'}
                  </h2>
                  <p className="text-xs text-slate-500 font-bold mt-1">
                    {companyProfile.activityAr || 'تجارة عامة واستيراد وتوزيع'}
                  </p>
                  <p className="text-xs text-slate-500">
                    {companyProfile.addressAr || 'الجمهورية اليمنية - صنعاء'} | هاتف: {companyProfile.phone || '01-200300'}
                  </p>
                  <p className="text-xs text-slate-500 font-mono">
                    الرقم الضريبي: {companyProfile.taxNumber || '300045678900003'}
                  </p>
                </div>
                <div className="text-left">
                  <div
                    className={`inline-block px-3 py-1 rounded-lg text-xs font-black mb-2 ${
                      viewingInvoice.type === 'SALES_RETURN'
                        ? 'bg-rose-100 text-rose-800'
                        : 'bg-emerald-100 text-emerald-800'
                    }`}
                  >
                    {viewingInvoice.type === 'SALES_RETURN' ? 'إشعار دائن - مردودات مبيعات' : 'فاتورة ضريبية - مبيعات'}
                  </div>
                  <div className="font-mono text-sm font-black text-slate-900">
                    #{viewingInvoice.invoiceNumber}
                  </div>
                  <div className="text-xs text-slate-500">التاريخ: {viewingInvoice.date}</div>
                  {viewingInvoice.dueDate && (
                    <div className="text-xs text-slate-500">الاستحقاق: {viewingInvoice.dueDate}</div>
                  )}
                </div>
              </div>

              {/* Customer & Payment Meta */}
              <div className="grid grid-cols-2 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs">
                <div>
                  <span className="font-bold text-slate-500 block mb-1">بيانات العميل:</span>
                  <div className="font-black text-slate-900 text-sm">{viewingInvoice.entityName}</div>
                  <div className="text-slate-500 mt-1">الكاشير: {viewingInvoice.cashierName || 'محمود صالح'}</div>
                </div>

                <div>
                  <span className="font-bold text-slate-500 block mb-1">وسيلة الدفع والتسوية:</span>
                  <div className="font-black text-slate-900">
                    {viewingInvoice.paymentMethod === 'CASH' && 'نقداً (كاش)'}
                    {viewingInvoice.paymentMethod === 'WALLET' && `محفظة: ${viewingInvoice.walletName}`}
                    {viewingInvoice.paymentMethod === 'BANK_TRANSFER' && `صرافة/بنك: ${viewingInvoice.exchangeNetworkName}`}
                    {viewingInvoice.paymentMethod === 'CREDIT' && 'آجل / على الحساب'}
                  </div>
                  {(viewingInvoice.walletTransferRef || viewingInvoice.exchangeTransferRef) && (
                    <div className="text-slate-500 mt-1 font-mono">
                      رقم العملية: {viewingInvoice.walletTransferRef || viewingInvoice.exchangeTransferRef}
                    </div>
                  )}
                </div>
              </div>

              {/* Items Table */}
              <table className="w-full text-right text-xs border-collapse border border-slate-200">
                <thead>
                  <tr className="bg-slate-100 text-slate-700 font-black border-b border-slate-200">
                    <th className="p-2.5 border-r border-slate-200">#</th>
                    <th className="p-2.5 border-r border-slate-200">بيان الصنف</th>
                    <th className="p-2.5 border-r border-slate-200">الكمية</th>
                    <th className="p-2.5 border-r border-slate-200">سعر الوحدة</th>
                    <th className="p-2.5 border-r border-slate-200">الضريبة</th>
                    <th className="p-2.5">الإجمالي</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {viewingInvoice.items.map((it, idx) => (
                    <tr key={it.id}>
                      <td className="p-2.5 border-r border-slate-200 font-mono text-center">{idx + 1}</td>
                      <td className="p-2.5 border-r border-slate-200 font-bold">{it.description}</td>
                      <td className="p-2.5 border-r border-slate-200 text-center font-bold">
                        {it.quantity} {it.unit || 'حبه'}
                      </td>
                      <td className="p-2.5 border-r border-slate-200">{formatCurrency(it.unitPrice, currency)}</td>
                      <td className="p-2.5 border-r border-slate-200">{formatCurrency(it.taxAmount || 0, currency)}</td>
                      <td className="p-2.5 font-black text-slate-900">{formatCurrency(it.total, currency)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Summary Totals */}
              <div className="flex justify-between items-start pt-2">
                <div className="w-1/2 space-y-2 text-xs">
                  {viewingInvoice.notes && (
                    <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
                      <span className="font-bold text-slate-600 block mb-0.5">ملاحظات:</span>
                      <p className="text-slate-700">{viewingInvoice.notes}</p>
                    </div>
                  )}
                  {viewingInvoice.returnReason && (
                    <div className="bg-rose-50 p-3 rounded-lg border border-rose-200">
                      <span className="font-bold text-rose-800 block mb-0.5">سبب المردودات:</span>
                      <p className="text-rose-700">{viewingInvoice.returnReason}</p>
                    </div>
                  )}
                </div>

                <div className="w-5/12 bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-1.5 text-xs">
                  <div className="flex justify-between text-slate-600">
                    <span>المجموع الفرعي:</span>
                    <span>{formatCurrency(viewingInvoice.subtotal, currency)}</span>
                  </div>
                  {viewingInvoice.taxTotal > 0 && (
                    <div className="flex justify-between text-slate-600">
                      <span>ضريبة القيمة المضافة:</span>
                      <span>{formatCurrency(viewingInvoice.taxTotal, currency)}</span>
                    </div>
                  )}
                  {viewingInvoice.expensesAmount && viewingInvoice.expensesAmount > 0 ? (
                    <div className="flex justify-between text-amber-700 font-bold">
                      <span>مصروفات الشحن/التوصيل:</span>
                      <span>{formatCurrency(viewingInvoice.expensesAmount, currency)}</span>
                    </div>
                  ) : null}
                  {viewingInvoice.discountAmount && viewingInvoice.discountAmount > 0 ? (
                    <div className="flex justify-between text-rose-700 font-bold">
                      <span>الخصم الممنوح:</span>
                      <span>{formatCurrency(viewingInvoice.discountAmount, currency)}</span>
                    </div>
                  ) : null}
                  <div className="border-t border-slate-300 pt-2 flex justify-between font-black text-sm text-slate-900">
                    <span>الإجمالي النهائي:</span>
                    <span>{formatCurrency(viewingInvoice.grandTotal, currency)}</span>
                  </div>
                  <div className="flex justify-between text-emerald-700 font-bold pt-1">
                    <span>المدفوع:</span>
                    <span>{formatCurrency(viewingInvoice.paidAmount || 0, currency)}</span>
                  </div>
                  {viewingInvoice.remainingAmount > 0 && (
                    <div className="flex justify-between text-rose-600 font-bold">
                      <span>المتبقي (الذمة):</span>
                      <span>{formatCurrency(viewingInvoice.remainingAmount, currency)}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Signatures */}
              <div className="grid grid-cols-3 gap-4 pt-12 border-t border-slate-200 text-center text-xs text-slate-600">
                <div>
                  <div className="font-bold mb-8">المستلم / العميل</div>
                  <div className="border-b border-dashed border-slate-400 w-32 mx-auto"></div>
                </div>
                <div>
                  <div className="font-bold mb-8">الكاشير / المحاسب</div>
                  <div className="border-b border-dashed border-slate-400 w-32 mx-auto"></div>
                  <div className="text-[10px] text-slate-400 mt-1">{viewingInvoice.cashierName || 'محمود صالح'}</div>
                </div>
                <div>
                  <div className="font-bold mb-8">المدير العام والختم</div>
                  <div className="border-b border-dashed border-slate-400 w-32 mx-auto"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Share Modal */}
      {isShareModalOpen && shareModalDoc && (
        <DocumentShareModal
          isOpen={isShareModalOpen}
          onClose={() => setIsShareModalOpen(false)}
          data={shareModalDoc}
          companyProfile={companyProfile}
        />
      )}
    </div>
  );
};
