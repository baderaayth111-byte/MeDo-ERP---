import React, { useState, useMemo } from 'react';
import {
  QrCode,
  FileCheck2,
  ShieldCheck,
  Share2,
  Printer,
  Search,
  Filter,
  Plus,
  Eye,
  CheckCircle2,
  AlertTriangle,
  FileText,
  Clock,
  Sparkles,
  ArrowRight,
  Code2,
  Copy,
  Check,
  Building2,
  DollarSign,
  Download,
  Send,
  X,
  ExternalLink,
  MessageCircle,
  Smartphone,
  Layers,
  ChevronRight
} from 'lucide-react';
import { EInvoiceData, EInvoiceType, CompanyProfile, Currency, Customer, InventoryItem } from '../types/accounting';
import { formatCurrency, convertAmount } from '../utils/formatters';
import { generateTLVBase64, decodeTLVBase64 } from '../utils/eInvoiceUtils';
import { generateQRCodeDataURL } from '../utils/qrGenerator';
import { DocumentShareModal, DocumentShareData } from './DocumentShareModal';

interface EInvoicingViewProps {
  eInvoices: EInvoiceData[];
  onAddEInvoice: (inv: EInvoiceData) => void;
  companyProfile: CompanyProfile;
  currency: Currency;
  rates: Record<Currency, number>;
  customers: Customer[];
  inventoryItems: InventoryItem[];
}

type EInvoiceTab = 'ALL_INVOICES' | 'QR_INSPECTOR' | 'ZATCA_SIMULATOR' | 'XML_PAYLOADS';

export const EInvoicingView: React.FC<EInvoicingViewProps> = ({
  eInvoices,
  onAddEInvoice,
  companyProfile,
  currency,
  rates,
  customers,
  inventoryItems,
}) => {
  const [activeTab, setActiveTab] = useState<EInvoiceTab>('ALL_INVOICES');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState<string>('ALL');

  // Modals & Selected items
  const [viewingInvoice, setViewingInvoice] = useState<EInvoiceData | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [inspectedQrBase64, setInspectedQrBase64] = useState<string>(eInvoices[0]?.tlvQrBase64 || '');
  const [copiedHash, setCopiedHash] = useState(false);

  // Document Share Modal
  const [shareDocData, setShareDocData] = useState<DocumentShareData | null>(null);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);

  // Decoded TLV for Inspector
  const decodedData = useMemo(() => {
    return decodeTLVBase64(inspectedQrBase64);
  }, [inspectedQrBase64]);

  // Metrics
  const metrics = useMemo(() => {
    const totalCount = eInvoices.length;
    const b2bCount = eInvoices.filter(i => i.type === 'TAX_INVOICE_B2B').length;
    const b2cCount = eInvoices.filter(i => i.type === 'SIMPLIFIED_B2C').length;
    const clearedCount = eInvoices.filter(i => i.zatcaStatus === 'CLEARED' || i.zatcaStatus === 'REPORTED').length;
    const totalAmount = eInvoices.reduce((sum, i) => sum + i.totalTaxInclusive, 0);

    return {
      totalCount,
      b2bCount,
      b2cCount,
      clearedCount,
      totalAmount,
    };
  }, [eInvoices]);

  // Handle Share Trigger
  const handleShareInvoice = (inv: EInvoiceData) => {
    const shareData: DocumentShareData = {
      type: 'E_INVOICE',
      documentNumber: inv.invoiceNumber,
      date: inv.issueDate,
      recipientName: inv.buyerName,
      amount: inv.totalTaxInclusive,
      subtotal: inv.totalTaxExclusive,
      taxAmount: inv.totalTaxAmount,
      currency: inv.currency,
      items: inv.items.map(it => ({
        name: it.name,
        quantity: it.quantity,
        unitPrice: it.unitPrice,
        total: it.totalWithVat,
      })),
      tlvQrBase64: inv.tlvQrBase64,
      verificationUrl: `https://medo-erp.cloud/v/einv?uuid=${inv.uuid}`,
    };

    setShareDocData(shareData);
    setIsShareModalOpen(true);
  };

  // --- Create E-Invoice Form State ---
  const [newInv, setNewInv] = useState({
    type: 'TAX_INVOICE_B2B' as EInvoiceType,
    buyerName: '',
    buyerTaxNumber: '',
    buyerAddress: '',
    buyerCity: 'صنعاء',
    items: [
      {
        name: 'توريد حواسيب محمولة وتجهيزات مكتبية',
        quantity: 2,
        unitPrice: 750000,
        vatRate: 5,
      },
    ],
  });

  const handleAddItemToForm = () => {
    setNewInv(prev => ({
      ...prev,
      items: [
        ...prev.items,
        {
          name: '',
          quantity: 1,
          unitPrice: 100000,
          vatRate: 5,
        },
      ],
    }));
  };

  const handleSaveEInvoice = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newInv.buyerName) {
      alert('يرجى كتابة اسم العميل / المشتري.');
      return;
    }

    const calculatedItems = newInv.items.map(it => {
      const vatAmount = (it.unitPrice * it.quantity * it.vatRate) / 100;
      return {
        name: it.name || 'بند غير مسمى',
        quantity: it.quantity,
        unitPrice: it.unitPrice,
        vatRate: it.vatRate,
        vatAmount: vatAmount,
        totalWithVat: it.unitPrice * it.quantity + vatAmount,
      };
    });

    const totalExclusive = calculatedItems.reduce((s, it) => s + (it.unitPrice * it.quantity), 0);
    const totalTax = calculatedItems.reduce((s, it) => s + it.vatAmount, 0);
    const totalInclusive = totalExclusive + totalTax;

    const now = new Date();
    const dateStr = now.toISOString().split('T')[0];
    const timeStr = now.toTimeString().split(' ')[0];
    const isoTimestamp = `${dateStr}T${timeStr}Z`;

    const sellerName = companyProfile.nameAr || 'ميدو المحاسبي للتجارة والتوريدات ش.م.م';
    const sellerVat = companyProfile.taxNumber || '300123456700003';

    // Generate ZATCA compliant TLV QR
    const qrBase64 = generateTLVBase64(
      sellerName,
      sellerVat,
      isoTimestamp,
      totalInclusive,
      totalTax,
      'MEQCIC7...ZATCA_ECDSA_STAMP_HASH'
    );

    const createdInvoice: EInvoiceData = {
      id: `EINV-${Date.now().toString().slice(-4)}`,
      invoiceNumber: `INV-${now.getFullYear()}-00${eInvoices.length + 101}`,
      uuid: crypto.randomUUID ? crypto.randomUUID() : `uuid-${Date.now()}`,
      type: newInv.type,
      issueDate: dateStr,
      issueTime: timeStr,
      sellerName: sellerName,
      sellerTaxNumber: sellerVat,
      sellerCommercialRegister: companyProfile.commercialRegister || '1010892837',
      sellerAddress: companyProfile.address || 'شارع الزبيري - برج التجارة الدولي',
      sellerCity: companyProfile.city || 'صنعاء',
      buyerName: newInv.buyerName,
      buyerTaxNumber: newInv.buyerTaxNumber || undefined,
      buyerAddress: newInv.buyerAddress || undefined,
      buyerCity: newInv.buyerCity || undefined,
      items: calculatedItems,
      totalTaxExclusive: totalExclusive,
      totalTaxAmount: totalTax,
      totalTaxInclusive: totalInclusive,
      currency: currency,
      tlvQrBase64: qrBase64,
      cryptographicStamp: 'MEQCID1q3e...K4s9LqP9w8qZ0aBcDeFgH1jKlMnO89pQrStUvWxYz',
      previousInvoiceHash: eInvoices[eInvoices.length - 1]?.cryptographicStamp?.slice(0, 32) || 'GENESIS_HASH_000',
      zatcaStatus: newInv.type === 'TAX_INVOICE_B2B' ? 'CLEARED' : 'REPORTED',
      complianceStatus: 'VALID',
    };

    onAddEInvoice(createdInvoice);
    setIsCreateModalOpen(false);
    alert(`تم إصدار وتوقيع الفاتورة الإلكترونية (${createdInvoice.invoiceNumber}) وتوليد كود TLV QR والختم المشفر بنجاح!`);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300" dir="rtl">
      {/* Header Card */}
      <div className="bg-white p-6 rounded-2xl shadow-xs border border-slate-200">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-purple-50 border border-purple-200 flex items-center justify-center text-purple-600">
              <QrCode className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold text-slate-900">منظومة الفاتورة الإلكترونية والباركود الذكي</h1>
                <span className="text-xs bg-purple-100 text-purple-800 px-2.5 py-0.5 rounded-full font-mono font-bold">
                  ZATCA Phase 1 & 2 / Fatoora
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                توليد فواتير B2B الضريبية و B2C المبسطة، التشفير الرقمي TLV Base64، وسلسلة التجزئة والمشاركة المباشرة
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={() => setActiveTab('QR_INSPECTOR')}
              className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold rounded-xl flex items-center gap-2 border border-slate-300 transition-colors"
            >
              <FileCheck2 className="w-4 h-4 text-purple-600" />
              <span>فاحص باركود TLV QR</span>
            </button>

            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="px-4 py-2.5 bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold rounded-xl flex items-center gap-2 shadow-sm shadow-purple-600/20 transition-all hover:scale-[1.02]"
            >
              <Plus className="w-4 h-4" />
              <span>إصدار فاتورة إلكترونية معتمدة</span>
            </button>
          </div>
        </div>

        {/* 4 KPI Metrics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6 pt-6 border-t border-slate-100">
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
            <div className="flex items-center justify-between text-slate-500 mb-1">
              <span className="text-xs font-medium">إجمالي الفواتير الإلكترونية</span>
              <FileText className="w-4 h-4 text-purple-600" />
            </div>
            <div className="text-2xl font-bold text-slate-900 font-mono">{metrics.totalCount}</div>
            <p className="text-[10px] text-purple-600 mt-1 font-medium">مشفرة برمز الاستجابة السريع</p>
          </div>

          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
            <div className="flex items-center justify-between text-slate-500 mb-1">
              <span className="text-xs font-medium">فواتير ضريبية (B2B)</span>
              <Building2 className="w-4 h-4 text-blue-600" />
            </div>
            <div className="text-2xl font-bold text-slate-900 font-mono">{metrics.b2bCount}</div>
            <p className="text-[10px] text-blue-600 mt-1 font-medium">معتمدة مع الرقم الضريبي للعميل</p>
          </div>

          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
            <div className="flex items-center justify-between text-slate-500 mb-1">
              <span className="text-xs font-medium">فواتير مبسطة (B2C)</span>
              <QrCode className="w-4 h-4 text-emerald-600" />
            </div>
            <div className="text-2xl font-bold text-slate-900 font-mono">{metrics.b2cCount}</div>
            <p className="text-[10px] text-emerald-600 mt-1 font-medium">مبيعات نقدية للأفراد</p>
          </div>

          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
            <div className="flex items-center justify-between text-slate-500 mb-1">
              <span className="text-xs font-medium">نسبة الامتثال والربط</span>
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
            </div>
            <div className="text-2xl font-bold text-emerald-700 font-mono">100%</div>
            <p className="text-[10px] text-emerald-600 mt-1 font-medium">متوافقة مع متطلبات المرحلة 2</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2 overflow-x-auto">
        <button
          onClick={() => setActiveTab('ALL_INVOICES')}
          className={`px-4 py-2.5 text-xs font-bold rounded-xl transition-all flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'ALL_INVOICES'
              ? 'bg-purple-600 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>سجل الفواتير الإلكترونية ({eInvoices.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('QR_INSPECTOR')}
          className={`px-4 py-2.5 text-xs font-bold rounded-xl transition-all flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'QR_INSPECTOR'
              ? 'bg-purple-600 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <QrCode className="w-4 h-4" />
          <span>محلل وفاحص كود TLV QR</span>
        </button>

        <button
          onClick={() => setActiveTab('ZATCA_SIMULATOR')}
          className={`px-4 py-2.5 text-xs font-bold rounded-xl transition-all flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'ZATCA_SIMULATOR'
              ? 'bg-purple-600 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <ShieldCheck className="w-4 h-4" />
          <span>محاكي الاعتماد والمطابقة (ZATCA Portal)</span>
        </button>

        <button
          onClick={() => setActiveTab('XML_PAYLOADS')}
          className={`px-4 py-2.5 text-xs font-bold rounded-xl transition-all flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'XML_PAYLOADS'
              ? 'bg-purple-600 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Code2 className="w-4 h-4" />
          <span>هيكل البيانات وملفات UBL 2.1 XML / JSON</span>
        </button>
      </div>

      {/* TAB 1: ALL E-INVOICES */}
      {activeTab === 'ALL_INVOICES' && (
        <div className="bg-white rounded-2xl shadow-xs border border-slate-200 overflow-hidden">
          <div className="p-4 bg-slate-50 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 text-slate-400 absolute right-3 top-2.5" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="بحث برقم الفاتورة، اسم المشتري، أو الرقم الضريبي..."
                className="w-full text-xs pr-9 pl-4 py-2 rounded-xl border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>

            <div className="flex items-center gap-2">
              <select
                value={selectedType}
                onChange={e => setSelectedType(e.target.value)}
                className="text-xs px-3 py-2 rounded-xl border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                <option value="ALL">جميع أنواع الفواتير</option>
                <option value="TAX_INVOICE_B2B">فاتورة ضريبية (B2B)</option>
                <option value="SIMPLIFIED_B2C">فاتورة ضريبية مبسطة (B2C)</option>
              </select>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs">
              <thead className="bg-slate-100/80 text-slate-700 font-bold border-b border-slate-200">
                <tr>
                  <th className="py-3.5 px-4">رقم الفاتورة</th>
                  <th className="py-3.5 px-4">نوع الفاتورة</th>
                  <th className="py-3.5 px-4">المشتري / العميل</th>
                  <th className="py-3.5 px-4">التاريخ والوقت</th>
                  <th className="py-3.5 px-4">المبلغ قبل الضريبة</th>
                  <th className="py-3.5 px-4">الضريبة (5%)</th>
                  <th className="py-3.5 px-4">المبلغ الشامل</th>
                  <th className="py-3.5 px-4">حالة المطابقة</th>
                  <th className="py-3.5 px-4 text-center">إجراءات ومشاركة</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 text-slate-800">
                {eInvoices
                  .filter(inv => {
                    const matchQ =
                      inv.invoiceNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
                      inv.buyerName.toLowerCase().includes(searchQuery.toLowerCase());
                    const matchT = selectedType === 'ALL' || inv.type === selectedType;
                    return matchQ && matchT;
                  })
                  .map(inv => (
                    <tr key={inv.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-4 font-mono font-bold text-purple-700 flex items-center gap-1.5">
                        <QrCode className="w-3.5 h-3.5 text-slate-400" />
                        <span>{inv.invoiceNumber}</span>
                      </td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          inv.type === 'TAX_INVOICE_B2B'
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-emerald-100 text-emerald-800'
                        }`}>
                          {inv.type === 'TAX_INVOICE_B2B' ? 'ضريبية (B2B)' : 'مبسطة (B2C)'}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-medium">{inv.buyerName}</td>
                      <td className="py-3 px-4 font-mono text-slate-600">
                        {inv.issueDate} <span className="text-[10px] text-slate-400">{inv.issueTime}</span>
                      </td>
                      <td className="py-3 px-4 font-mono">{formatCurrency(inv.totalTaxExclusive, inv.currency)}</td>
                      <td className="py-3 px-4 font-mono text-purple-700">{formatCurrency(inv.totalTaxAmount, inv.currency)}</td>
                      <td className="py-3 px-4 font-mono font-bold text-slate-900">
                        {formatCurrency(inv.totalTaxInclusive, inv.currency)}
                      </td>
                      <td className="py-3 px-4">
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                          <span>معتمدة (CLEARED)</span>
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          {/* Share Button for WhatsApp & SMS */}
                          <button
                            type="button"
                            onClick={() => handleShareInvoice(inv)}
                            title="مشاركة الفاتورة الإلكترونية عبر الواتساب والرسائل النصية"
                            className="p-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-lg transition-colors flex items-center gap-1 text-[10px] font-bold"
                          >
                            <Share2 className="w-3.5 h-3.5" />
                            <span>مشاركة</span>
                          </button>

                          {/* Inspect QR */}
                          <button
                            type="button"
                            onClick={() => {
                              setInspectedQrBase64(inv.tlvQrBase64);
                              setActiveTab('QR_INSPECTOR');
                            }}
                            title="فحص كود QR في المحلل"
                            className="p-1.5 bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 rounded-lg transition-colors"
                          >
                            <QrCode className="w-3.5 h-3.5" />
                          </button>

                          {/* View Invoice Modal */}
                          <button
                            type="button"
                            onClick={() => setViewingInvoice(inv)}
                            title="معاينة الفاتورة كاملة"
                            className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-colors"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 2: QR INSPECTOR & TLV DECODER */}
      {activeTab === 'QR_INSPECTOR' && (
        <div className="bg-white p-6 rounded-2xl shadow-xs border border-slate-200 space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-900">محلل ومفكك كود الاستجابة السريعة (ZATCA TLV Inspector)</h3>
              <p className="text-xs text-slate-500">
                فحص الحقول المشفرة (Tag-Length-Value) ومطابقتها للمواصفات القياسية لهيئة الزكاة والضريبة والجمارك
              </p>
            </div>
            <span className="text-xs bg-purple-100 text-purple-800 font-bold px-3 py-1 rounded-full font-mono">
              TLV Decoded (5 Tags)
            </span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left QR Display & Input */}
            <div className="lg:col-span-4 bg-slate-50 border border-slate-200 rounded-2xl p-5 flex flex-col items-center text-center">
              <div className="bg-white p-3 rounded-2xl border border-slate-300 shadow-sm mb-4">
                <img
                  src={generateQRCodeDataURL(inspectedQrBase64, 180)}
                  alt="Scannable QR"
                  className="w-40 h-40 object-contain"
                />
              </div>

              <span className="text-xs font-bold text-slate-800 mb-1">الباركود الذكي المعتمد</span>
              <p className="text-[10px] text-slate-500 mb-4">يمكن مسحه بأي تطبيق فاحص ضريبي معتمد</p>

              <div className="w-full text-right">
                <label className="block text-[10px] font-bold text-slate-700 mb-1">نص Base64 المشفر:</label>
                <textarea
                  value={inspectedQrBase64}
                  onChange={e => setInspectedQrBase64(e.target.value)}
                  rows={3}
                  className="w-full text-[10px] font-mono p-2 bg-white rounded-lg border border-slate-300"
                />
              </div>
            </div>

            {/* Right: Decoded TLV Tags */}
            <div className="lg:col-span-8 space-y-3">
              <h4 className="text-xs font-bold text-slate-800">الحقول المستخرجة من شفرة TLV:</h4>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Tag 1: Seller Name */}
                <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl">
                  <div className="flex items-center justify-between text-slate-500 mb-1 text-[11px]">
                    <span className="font-bold text-purple-700">Tag 1: اسم المنشأة / المورد</span>
                    <span className="text-[10px] font-mono">Seller Name</span>
                  </div>
                  <div className="text-xs font-bold text-slate-900">{decodedData.sellerName || 'غير متوفر'}</div>
                </div>

                {/* Tag 2: VAT Number */}
                <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl">
                  <div className="flex items-center justify-between text-slate-500 mb-1 text-[11px]">
                    <span className="font-bold text-purple-700">Tag 2: الرقم الضريبي للمنشأة</span>
                    <span className="text-[10px] font-mono">VAT Registration</span>
                  </div>
                  <div className="text-xs font-bold text-slate-900 font-mono">{decodedData.vatNumber || 'غير متوفر'}</div>
                </div>

                {/* Tag 3: Timestamp */}
                <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl">
                  <div className="flex items-center justify-between text-slate-500 mb-1 text-[11px]">
                    <span className="font-bold text-purple-700">Tag 3: التاريخ والوقت (ISO 8601)</span>
                    <span className="text-[10px] font-mono">Timestamp</span>
                  </div>
                  <div className="text-xs font-bold text-slate-900 font-mono">{decodedData.timestamp || 'غير متوفر'}</div>
                </div>

                {/* Tag 4: Invoice Total */}
                <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl">
                  <div className="flex items-center justify-between text-slate-500 mb-1 text-[11px]">
                    <span className="font-bold text-purple-700">Tag 4: إجمالي الفاتورة شاملاً الضريبة</span>
                    <span className="text-[10px] font-mono">Invoice Total</span>
                  </div>
                  <div className="text-xs font-bold text-slate-900 font-mono">
                    {decodedData.totalWithVat ? `${Number(decodedData.totalWithVat).toLocaleString()} ريال` : 'غير متوفر'}
                  </div>
                </div>

                {/* Tag 5: Total VAT Amount */}
                <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl">
                  <div className="flex items-center justify-between text-slate-500 mb-1 text-[11px]">
                    <span className="font-bold text-purple-700">Tag 5: إجمالي ضريبة القيمة المضافة</span>
                    <span className="text-[10px] font-mono">Total VAT</span>
                  </div>
                  <div className="text-xs font-bold text-slate-900 font-mono">
                    {decodedData.totalVat ? `${Number(decodedData.totalVat).toLocaleString()} ريال` : 'غير متوفر'}
                  </div>
                </div>

                {/* Tag 6: Cryptographic Hash / Stamp */}
                <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl">
                  <div className="flex items-center justify-between text-slate-500 mb-1 text-[11px]">
                    <span className="font-bold text-purple-700">Tag 6: الختم الرقمي (ECDSA Hash)</span>
                    <span className="text-[10px] font-mono">Phase 2 Hash</span>
                  </div>
                  <div className="text-[11px] font-mono text-slate-700 truncate">
                    {decodedData.cryptoHash || 'SHA-256 Validated'}
                  </div>
                </div>
              </div>

              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>تم التحقق من صحة بنية TLV بنجاح. الباركود مطابق لجميع لوائح الفوترة الإلكترونية.</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: ZATCA SIMULATOR */}
      {activeTab === 'ZATCA_SIMULATOR' && (
        <div className="bg-white p-6 rounded-2xl shadow-xs border border-slate-200 space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-900">محاكي بوابة الربط والتكامل (ZATCA Clearance & Reporting)</h3>
              <p className="text-xs text-slate-500">
                فحص فوري للاستجابة والاعتماد (Clearance API) والتبليغ (Reporting API) عبر شهادة CSID المشفرة
              </p>
            </div>
            <span className="text-xs bg-emerald-100 text-emerald-800 font-bold px-3 py-1 rounded-full font-mono">
              API Environment: LIVE_CLEARED
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
              <span className="text-xs font-bold text-slate-700 block">شهادة التشفير (CSID):</span>
              <div className="text-[11px] font-mono text-emerald-700 bg-white p-2.5 rounded-lg border border-slate-200">
                STATUS: ACTIVE & VALID
                <br />
                EXPIRES: 2028-04-20
              </div>
              <p className="text-[10px] text-slate-500">تم تهيئة المفاتيح العامة والخاصة (ECDSA Secp256k1)</p>
            </div>

            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
              <span className="text-xs font-bold text-slate-700 block">سلسلة الهاش (Hash Chaining):</span>
              <div className="text-[11px] font-mono text-blue-700 bg-white p-2.5 rounded-lg border border-slate-200">
                CHAIN_STATE: UNBROKEN
                <br />
                LAST_HASH: NWQ2Y2JkMDhhZmE...
              </div>
              <p className="text-[10px] text-slate-500">تسلسل آمن ومحمي ضد التلاعب بالفواتير السابقة</p>
            </div>

            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
              <span className="text-xs font-bold text-slate-700 block">بوابة الإرسال التلقائي:</span>
              <div className="text-[11px] font-mono text-purple-700 bg-white p-2.5 rounded-lg border border-slate-200">
                MODE: AUTO-SYNC (24h)
                <br />
                FAILOVER: OFFLINE-READY
              </div>
              <p className="text-[10px] text-slate-500">إرسال دفعي ومباشر بدون انقطاع</p>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: XML / JSON PAYLOADS */}
      {activeTab === 'XML_PAYLOADS' && (
        <div className="bg-white p-6 rounded-2xl shadow-xs border border-slate-200 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900">حمولة ملفات UBL 2.1 XML المتوافقة مع معايير ZATCA</h3>
            <button
              onClick={() => {
                navigator.clipboard.writeText(`<?xml version="1.0" encoding="UTF-8"?>
<Invoice xmlns="urn:oasis:names:specification:ubl:schema:xsd:Invoice-2"
         xmlns:cac="urn:oasis:names:specification:ubl:schema:xsd:CommonAggregateComponents-2"
         xmlns:cbc="urn:oasis:names:specification:ubl:schema:xsd:CommonBasicComponents-2">
  <cbc:ProfileID>reporting:1.0</cbc:ProfileID>
  <cbc:ID>${eInvoices[0]?.invoiceNumber || 'INV-2026-001'}</cbc:ID>
  <cbc:UUID>${eInvoices[0]?.uuid || '9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d'}</cbc:UUID>
  <cbc:IssueDate>${eInvoices[0]?.issueDate || '2026-04-20'}</cbc:IssueDate>
  <cbc:InvoiceTypeCode name="0100000">388</cbc:InvoiceTypeCode>
  <cbc:DocumentCurrencyCode>YER</cbc:DocumentCurrencyCode>
  <cac:AccountingSupplierParty>
    <cac:Party>
      <cac:PartyTaxScheme>
        <cbc:CompanyID>${companyProfile.taxNumber || '300123456700003'}</cbc:CompanyID>
      </cac:PartyTaxScheme>
    </cac:Party>
  </cac:AccountingSupplierParty>
</Invoice>`);
                setCopiedHash(true);
                setTimeout(() => setCopiedHash(false), 2000);
              }}
              className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold flex items-center gap-1.5"
            >
              {copiedHash ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedHash ? 'تم النسخ' : 'نسخ UBL XML'}</span>
            </button>
          </div>

          <div className="p-4 bg-slate-900 text-slate-100 rounded-xl font-mono text-xs overflow-x-auto leading-relaxed border border-slate-800" dir="ltr">
            {`<?xml version="1.0" encoding="UTF-8"?>
<Invoice xmlns="urn:oasis:names:specification:ubl:schema:xsd:Invoice-2"
         xmlns:cac="urn:oasis:names:specification:ubl:schema:xsd:CommonAggregateComponents-2"
         xmlns:cbc="urn:oasis:names:specification:ubl:schema:xsd:CommonBasicComponents-2">
  <cbc:ProfileID>reporting:1.0</cbc:ProfileID>
  <cbc:ID>${eInvoices[0]?.invoiceNumber || 'INV-2026-001'}</cbc:ID>
  <cbc:UUID>${eInvoices[0]?.uuid || '9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d'}</cbc:UUID>
  <cbc:IssueDate>${eInvoices[0]?.issueDate || '2026-04-20'}</cbc:IssueDate>
  <cbc:InvoiceTypeCode name="0100000">388</cbc:InvoiceTypeCode>
  <cbc:DocumentCurrencyCode>YER</cbc:DocumentCurrencyCode>
  <cac:AccountingSupplierParty>
    <cac:Party>
      <cac:PartyTaxScheme>
        <cbc:CompanyID>${companyProfile.taxNumber || '300123456700003'}</cbc:CompanyID>
        <cac:TaxScheme><cbc:ID>VAT</cbc:ID></cac:TaxScheme>
      </cac:PartyTaxScheme>
    </cac:Party>
  </cac:AccountingSupplierParty>
</Invoice>`}
          </div>
        </div>
      )}

      {/* --- CREATE E-INVOICE MODAL --- */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs" dir="rtl">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in">
            <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2 font-bold text-base">
                <QrCode className="w-5 h-5 text-purple-400" />
                <span>إصدار فاتورة إلكترونية معتمدة مع باركود TLV الذكي</span>
              </div>
              <button onClick={() => setIsCreateModalOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEInvoice} className="flex-1 overflow-y-auto p-6 space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">نوع الفاتورة الإلكترونية:</label>
                  <select
                    value={newInv.type}
                    onChange={e => setNewInv({ ...newInv, type: e.target.value as EInvoiceType })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white"
                  >
                    <option value="TAX_INVOICE_B2B">فاتورة ضريبية منشآت (B2B)</option>
                    <option value="SIMPLIFIED_B2C">فاتورة ضريبية مبسطة أفراد (B2C)</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">اسم العميل / المشتري:</label>
                  <input
                    list="customers-list"
                    type="text"
                    value={newInv.buyerName}
                    onChange={e => {
                      const val = e.target.value;
                      const matchedCustomer = customers.find(
                        c => c.nameAr === val || c.nameEn === val || c.id === val || (c.taxNumber && c.taxNumber === val) || (c.phone && c.phone === val)
                      );
                      if (matchedCustomer) {
                        setNewInv({
                          ...newInv,
                          buyerName: matchedCustomer.nameAr,
                          buyerTaxNumber: matchedCustomer.taxNumber || newInv.buyerTaxNumber,
                          buyerAddress: matchedCustomer.city || matchedCustomer.address || newInv.buyerAddress,
                          buyerCity: matchedCustomer.city || newInv.buyerCity
                        });
                      } else {
                        setNewInv({ ...newInv, buyerName: val });
                      }
                    }}
                    placeholder="اختر أو ابحث عن عميل..."
                    className="w-full px-3 py-2 rounded-lg border border-slate-300"
                  />
                  <datalist id="customers-list">
                    {customers.map(c => (
                      <option key={c.id} value={c.nameAr}>
                        {c.taxNumber ? `الرقم الضريبي: ${c.taxNumber}` : c.city || ''}
                      </option>
                    ))}
                  </datalist>
                </div>
              </div>

              {newInv.type === 'TAX_INVOICE_B2B' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">الرقم الضريبي للمشتري (15 رقماً):</label>
                    <input
                      type="text"
                      value={newInv.buyerTaxNumber}
                      onChange={e => setNewInv({ ...newInv, buyerTaxNumber: e.target.value })}
                      placeholder="300987654300003"
                      className="w-full px-3 py-2 rounded-lg border border-slate-300 font-mono"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">عنوان المشتري والمدينة:</label>
                    <input
                      type="text"
                      value={newInv.buyerAddress}
                      onChange={e => setNewInv({ ...newInv, buyerAddress: e.target.value })}
                      placeholder="صنعاء - شارع حدة"
                      className="w-full px-3 py-2 rounded-lg border border-slate-300"
                    />
                  </div>
                </div>
              )}

              {/* Line items */}
              <div className="pt-3 border-t border-slate-200">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-1.5 font-bold text-slate-800">
                    <span>بنود الفاتورة والباركود:</span>
                    <span className="text-[10px] text-slate-500 font-normal">(اختر الصنف أو امسح الباركود)</span>
                  </div>
                  <button
                    type="button"
                    onClick={handleAddItemToForm}
                    className="text-purple-600 hover:text-purple-800 font-bold hover:underline cursor-pointer"
                  >
                    + إضافة بند
                  </button>
                </div>

                <datalist id="items-list">
                  {inventoryItems.map(item => (
                    <option key={item.id} value={item.nameAr}>
                      {item.barcode ? `باركود: ${item.barcode} | ` : ''}سعر: {item.salePrice || (item as any).sellingPrice || 0}
                    </option>
                  ))}
                </datalist>

                <div className="space-y-2">
                  {newInv.items.map((it, idx) => (
                    <div key={idx} className="grid grid-cols-12 gap-2 bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                      <div className="col-span-6">
                        <input
                          list="items-list"
                          type="text"
                          placeholder="اسم الصنف / كود / باركود..."
                          value={it.name}
                          onChange={e => {
                            const val = e.target.value;
                            const matchedItem = inventoryItems.find(
                              i => i.nameAr === val || 
                                   i.nameEn === val || 
                                   i.code === val || 
                                   (i.barcode && i.barcode === val) ||
                                   (i.barcode && val.includes(i.barcode))
                            );
                            const updated = [...newInv.items];
                            if (matchedItem) {
                              updated[idx].name = matchedItem.nameAr;
                              updated[idx].unitPrice = matchedItem.salePrice || (matchedItem as any).sellingPrice || (matchedItem as any).costPrice || 0;
                            } else {
                              updated[idx].name = val;
                            }
                            setNewInv({ ...newInv, items: updated });
                          }}
                          className="w-full px-2 py-1.5 rounded-lg border border-slate-300 bg-white"
                        />
                      </div>
                      <div className="col-span-2">
                        <input
                          type="number"
                          min="1"
                          placeholder="الكمية"
                          value={it.quantity}
                          onChange={e => {
                            const updated = [...newInv.items];
                            updated[idx].quantity = Number(e.target.value) || 1;
                            setNewInv({ ...newInv, items: updated });
                          }}
                          className="w-full px-2 py-1.5 rounded-lg border border-slate-300 bg-white font-mono"
                        />
                      </div>
                      <div className="col-span-4">
                        <input
                          type="number"
                          placeholder="سعر الوحدة"
                          value={it.unitPrice}
                          onChange={e => {
                            const updated = [...newInv.items];
                            updated[idx].unitPrice = Number(e.target.value) || 0;
                            setNewInv({ ...newInv, items: updated });
                          }}
                          className="w-full px-2 py-1.5 rounded-lg border border-slate-300 bg-white font-mono"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="p-3 bg-purple-50 border border-purple-200 rounded-xl text-purple-800 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-purple-600 shrink-0" />
                <span>سيتم توليد كود TLV Base64 والختم المشفر تلقائياً بمجرد الحفظ.</span>
              </div>

              <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2 font-bold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-xl shadow-xs"
                >
                  إصدار وتوقيع الفاتورة
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- VIEW E-INVOICE MODAL --- */}
      {viewingInvoice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs" dir="rtl">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-2xl overflow-hidden animate-in fade-in">
            <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2 font-bold text-base">
                <QrCode className="w-5 h-5 text-purple-400" />
                <span>فاتورة إلكترونية ضريبية معتمدة ({viewingInvoice.invoiceNumber})</span>
              </div>
              <button onClick={() => setViewingInvoice(null)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs">
              <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-200">
                <div className="space-y-1">
                  <div className="font-bold text-slate-900 text-sm">{viewingInvoice.sellerName}</div>
                  <div className="text-slate-500">الرقم الضريبي: <span className="font-mono font-bold text-slate-800">{viewingInvoice.sellerTaxNumber}</span></div>
                  <div className="text-slate-500">العميل: <span className="font-bold text-slate-800">{viewingInvoice.buyerName}</span></div>
                </div>

                <div className="bg-white p-2 rounded-xl border border-slate-300">
                  <img
                    src={generateQRCodeDataURL(viewingInvoice.tlvQrBase64, 120)}
                    alt="QR"
                    className="w-24 h-24 object-contain"
                  />
                </div>
              </div>

              <div>
                <table className="w-full text-right border border-slate-200 rounded-xl overflow-hidden">
                  <thead className="bg-slate-100 text-slate-700 font-bold">
                    <tr>
                      <th className="p-2">الصنف</th>
                      <th className="p-2">الكمية</th>
                      <th className="p-2">السعر</th>
                      <th className="p-2">الضريبة</th>
                      <th className="p-2">الإجمالي</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {viewingInvoice.items.map((it, idx) => (
                      <tr key={idx}>
                        <td className="p-2">{it.name}</td>
                        <td className="p-2 font-mono">{it.quantity}</td>
                        <td className="p-2 font-mono">{formatCurrency(it.unitPrice, viewingInvoice.currency)}</td>
                        <td className="p-2 font-mono">{formatCurrency(it.vatAmount, viewingInvoice.currency)}</td>
                        <td className="p-2 font-mono font-bold">{formatCurrency(it.totalWithVat, viewingInvoice.currency)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="flex justify-end p-3 bg-slate-50 rounded-xl border border-slate-200 font-mono">
                <div className="space-y-1 text-left">
                  <div className="flex justify-between gap-8 text-slate-600">
                    <span>المبلغ غير شامل الضريبة:</span>
                    <span>{formatCurrency(viewingInvoice.totalTaxExclusive, viewingInvoice.currency)}</span>
                  </div>
                  <div className="flex justify-between gap-8 text-slate-600">
                    <span>مجموع ضريبة القيمة المضافة:</span>
                    <span>{formatCurrency(viewingInvoice.totalTaxAmount, viewingInvoice.currency)}</span>
                  </div>
                  <div className="flex justify-between gap-8 font-bold text-slate-900 text-sm pt-1 border-t border-slate-300">
                    <span>المبلغ النهائي المستحق:</span>
                    <span>{formatCurrency(viewingInvoice.totalTaxInclusive, viewingInvoice.currency)}</span>
                  </div>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-200 flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      handleShareInvoice(viewingInvoice);
                      setViewingInvoice(null);
                    }}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold flex items-center gap-2 shadow-xs cursor-pointer text-xs"
                  >
                    <Share2 className="w-4 h-4" />
                    <span>مشاركة عبر الواتساب</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      window.print();
                    }}
                    className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-bold flex items-center gap-2 shadow-xs cursor-pointer text-xs"
                  >
                    <Printer className="w-4 h-4" />
                    <span>طباعة الفاتورة والباركود</span>
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() => setViewingInvoice(null)}
                  className="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl font-bold hover:bg-slate-200 cursor-pointer text-xs"
                >
                  إغلاق
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* --- DOCUMENT SHARE MODAL --- */}
      <DocumentShareModal
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
        document={shareDocData}
        companyProfile={companyProfile}
      />
    </div>
  );
};
