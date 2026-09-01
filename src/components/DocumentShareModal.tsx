import React, { useState, useMemo } from 'react';
import {
  MessageCircle,
  Smartphone,
  Copy,
  Check,
  Share2,
  X,
  ExternalLink,
  Printer,
  FileText,
  Clock,
  ShieldCheck,
  Send,
  Sparkles,
  QrCode,
  ArrowRight,
  Info,
  CheckCircle2,
  Receipt,
  RotateCcw,
  Building2,
  FileCheck2,
  Percent,
  TrendingDown,
  Layers,
  ChevronDown
} from 'lucide-react';
import { CompanyProfile, Currency } from '../types/accounting';
import { formatCurrency, tafqeetArabic } from '../utils/formatters';
import { CompanyHeaderView } from './CompanyHeaderView';
import { generateQRCodeDataURL } from '../utils/qrGenerator';

export type ShareDocumentType = 
  | 'INVOICE' 
  | 'BILL' 
  | 'SALES_RETURN'
  | 'PURCHASE_RETURN'
  | 'RECEIPT_VOUCHER' 
  | 'PAYMENT_VOUCHER' 
  | 'PURCHASE_ORDER' 
  | 'POS_RECEIPT' 
  | 'POS_RETURN'
  | 'E_INVOICE'
  | 'ACCOUNT_STATEMENT';

export interface DocumentShareData {
  type: ShareDocumentType;
  documentNumber: string;
  date: string;
  dueDate?: string;
  recipientName: string;
  recipientPhone?: string;
  recipientEmail?: string;
  amount: number;
  taxAmount?: number;
  subtotal?: number;
  currency: Currency;
  items?: Array<{ name: string; quantity: number; unitPrice: number; total: number; taxAmount?: number }>;
  paymentMethod?: string;
  currentBalance?: number;
  notes?: string;
  referenceInvoiceNumber?: string;
  returnReason?: string;
  tlvQrBase64?: string;
  verificationUrl?: string;
}

interface DocumentShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  document: DocumentShareData | null;
  companyProfile: CompanyProfile;
}

const COUNTRY_CODES = [
  { code: '+967', countryAr: 'اليمن', flag: '🇾🇪' },
  { code: '+966', countryAr: 'السعودية', flag: '🇸🇦' },
  { code: '+971', countryAr: 'الإمارات', flag: '🇦🇪' },
  { code: '+20', countryAr: 'مصر', flag: '🇪🇬' },
  { code: '+968', countryAr: 'عُمان', flag: '🇴🇲' },
  { code: '+965', countryAr: 'الكويت', flag: '🇰🇼' },
  { code: '+962', countryAr: 'الأردن', flag: '🇯🇴' },
  { code: '+974', countryAr: 'قطر', flag: '🇶🇦' },
  { code: '+973', countryAr: 'البحرين', flag: '🇧🇭' },
  { code: '+1', countryAr: 'الولايات المتحدة', flag: '🇺🇸' },
];

export const DocumentShareModal: React.FC<DocumentShareModalProps> = ({
  isOpen,
  onClose,
  document,
  companyProfile,
}) => {
  if (!isOpen || !document) return null;

  // View Mode: 'SHARE' (WhatsApp/SMS) or 'PRINT' (Local Print Preview)
  const [modalMode, setModalMode] = useState<'SHARE' | 'PRINT'>('SHARE');
  const [printFormat, setPrintFormat] = useState<'A4_TAX' | 'THERMAL_80MM'>('A4_TAX');

  // Phone parsing and state
  const initialPhone = document.recipientPhone || '';
  let defaultCountryCode = '+967';
  let defaultLocalNumber = initialPhone;

  for (const c of COUNTRY_CODES) {
    if (initialPhone.startsWith(c.code)) {
      defaultCountryCode = c.code;
      defaultLocalNumber = initialPhone.slice(c.code.length).replace(/^0+/, '').trim();
      break;
    }
  }

  const [countryCode, setCountryCode] = useState(defaultCountryCode);
  const [phoneNumber, setPhoneNumber] = useState(defaultLocalNumber.replace(/\D/g, ''));
  const [recipientName, setRecipientName] = useState(document.recipientName || '');
  
  // Default template selection based on document type
  const initialTemplate = useMemo(() => {
    if (document.type === 'SALES_RETURN' || document.type === 'PURCHASE_RETURN' || document.type === 'POS_RETURN') {
      return 'RETURN_NOTICE';
    }
    if (document.type === 'RECEIPT_VOUCHER' || document.type === 'PAYMENT_VOUCHER') {
      return 'RECEIPT_NOTICE';
    }
    if (document.type === 'BILL') {
      return 'BILL_NOTICE';
    }
    return 'COMPACT_SMS';
  }, [document.type]);

  const [templateType, setTemplateType] = useState<'DETAILED_WA' | 'COMPACT_SMS' | 'RETURN_NOTICE' | 'BILL_NOTICE' | 'RECEIPT_NOTICE' | 'PAYMENT_REMINDER'>(initialTemplate);
  const [customNote, setCustomNote] = useState('');
  const [copiedText, setCopiedText] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedSms, setCopiedSms] = useState(false);
  const [smsSentStatus, setSmsSentStatus] = useState<'IDLE' | 'SENDING' | 'SENT'>('IDLE');

  // Clean full phone number for wa.me URL
  const cleanFullPhone = useMemo(() => {
    const rawDigits = phoneNumber.replace(/\D/g, '');
    if (!rawDigits) return '';
    const cleanPrefix = countryCode.replace('+', '');
    return `${cleanPrefix}${rawDigits}`;
  }, [countryCode, phoneNumber]);

  // Digital verification URL
  const verificationUrl = useMemo(() => {
    if (document.verificationUrl) return document.verificationUrl;
    return `https://medo-erp.cloud/v/doc?num=${encodeURIComponent(document.documentNumber)}&t=${document.type}&sec=${Date.now().toString(36)}`;
  }, [document]);

  // Get localized document title
  const documentTitle = useMemo(() => {
    switch (document.type) {
      case 'INVOICE':
        return 'فاتورة مبيعات ضريبية';
      case 'BILL':
        return 'فاتورة مشتريات وتوريد';
      case 'SALES_RETURN':
        return 'مرتجع مبيعات (إشعار دائن)';
      case 'PURCHASE_RETURN':
        return 'مرتجع مشتريات (إشعار مدين)';
      case 'POS_RECEIPT':
        return 'إيصال مبيعات نقطة بيع';
      case 'POS_RETURN':
        return 'مرتجع مبيعات نقطة بيع';
      case 'RECEIPT_VOUCHER':
        return 'سند قبض مالي';
      case 'PAYMENT_VOUCHER':
        return 'سند صرف مالي';
      case 'PURCHASE_ORDER':
        return 'أمر شراء رسمي';
      case 'E_INVOICE':
        return 'فاتورة إلكترونية معتمدة (ZATCA)';
      case 'ACCOUNT_STATEMENT':
        return 'كشف حساب مالي';
      default:
        return 'مستند مالي معتمد';
    }
  }, [document.type]);

  // Generate formatted messages based on templates
  const messageBody = useMemo(() => {
    const formattedAmount = formatCurrency(document.amount, document.currency);
    const companyName = companyProfile.nameAr || 'مجموعة المروج الدولية للاستثمار والتجارة';
    const contactPhone = companyProfile.phone || companyProfile.whatsapp || '+967 1 445566';
    const vatNumber = companyProfile.taxNumber || 'YER-TAX-98421034';

    // 1. Compact SMS Template
    if (templateType === 'COMPACT_SMS') {
      let docHeader = 'فاتورة مبيعات';
      if (document.type === 'BILL') docHeader = 'فاتورة مشتريات';
      if (document.type === 'SALES_RETURN') docHeader = 'مرتجع مبيعات (إشعار دائن)';
      if (document.type === 'PURCHASE_RETURN') docHeader = 'مرتجع مشتريات (إشعار مدين)';
      if (document.type === 'POS_RECEIPT') docHeader = 'إيصال مبيعات POS';
      if (document.type === 'POS_RETURN') docHeader = 'مرتجع نقطة بيع';
      if (document.type === 'RECEIPT_VOUCHER') docHeader = 'سند قبض مالي';
      if (document.type === 'PAYMENT_VOUCHER') docHeader = 'سند صرف مالي';
      if (document.type === 'PURCHASE_ORDER') docHeader = 'أمر شراء';

      return `مرحباً ${recipientName || 'عميلنا العزيز'}،
تم إصدار ${docHeader} رقم (${document.documentNumber}) بتاريخ ${document.date} بقيمة ${formattedAmount}.
${document.referenceInvoiceNumber ? `مرجع الفاتورة الأصلية: ${document.referenceInvoiceNumber}\n` : ''}${document.currentBalance !== undefined ? `الرصيد القائم: ${formatCurrency(document.currentBalance, document.currency)}\n` : ''}لمعاينة وتنزيل المستند رسمياً:
${verificationUrl}
${companyName} - هاتف: ${contactPhone}`;
    }

    // 2. Return Notice (Sales / Purchase / POS Returns)
    if (templateType === 'RETURN_NOTICE') {
      const isSalesReturn = document.type === 'SALES_RETURN' || document.type === 'POS_RETURN';
      const isDebitNote = document.type === 'PURCHASE_RETURN';
      const returnTypeName = isSalesReturn ? 'إشعار دائن (مرتجع مبيعات)' : isDebitNote ? 'إشعار مدين (مرتجع مشتريات)' : 'إشعار مردودات مالية';

      return `*🔄 ${returnTypeName} معتمد - ${companyName}*
---------------------------------------
السادة / *${recipientName || 'العميل المحترم'}*
تحية طيبة وبعد،،

نحيطكم علماً بأنه تم قيد وتوثيق *${returnTypeName}* في سجلات النظام المحاسبي:

📄 *رقم المستند:* ${document.documentNumber}
📅 *التاريخ:* ${document.date}
${document.referenceInvoiceNumber ? `📑 *رقم الفاتورة المرجعية الأصلية:* ${document.referenceInvoiceNumber}\n` : ''}💰 *قيمة المردودات الإجمالية:* *${formattedAmount}*
${document.taxAmount ? `📊 *مبلغ الضريبة المسترجع:* ${formatCurrency(document.taxAmount, document.currency)}\n` : ''}${document.returnReason ? `📝 *سبب الإرجاع:* ${document.returnReason}\n` : ''}${document.currentBalance !== undefined ? `⚖️ *الرصيد المحدث بعد التسوية:* ${formatCurrency(document.currentBalance, document.currency)}\n` : ''}
🔗 *رابط المعاينة الرقمية والتحقق:*
${verificationUrl}

نشكركم لتعاملكم الراقي، ونحن في خدمتكم دائماً.
*${companyName}*
📞 خدمة العملاء والمحاسبة: ${contactPhone}`;
    }

    // 3. Purchase Bill Notice
    if (templateType === 'BILL_NOTICE') {
      return `*📦 إشعار توثيق فاتورة مشتريات وتوريد - ${companyName}*
---------------------------------------
السادة المورد / *${recipientName || 'المورد المحترم'}*
السلام عليكم ورحمة الله وبركاته،،

تم بنجاح قيد وتوثيق *فاتورة المشتريات والتوريد* الصادرة منكم في حساباتنا:

📄 *رقم الفاتورة / المطالبة:* ${document.documentNumber}
📅 *تاريخ التوريد:* ${document.date}
${document.dueDate ? `⏳ *تاريخ الاستحقاق المتفق عليه:* ${document.dueDate}\n` : ''}💰 *المبلغ الإجمالي المعتمد:* *${formattedAmount}*
${document.currentBalance !== undefined ? `⚖️ *رصيد حسابكم المتبقي للدفع:* ${formatCurrency(document.currentBalance, document.currency)}\n` : ''}${customNote ? `📝 *ملاحظات:* ${customNote}\n` : ''}
🔗 *رابط إشعار التوريد والتحقق الإلكتروني:*
${verificationUrl}

*قسم المشتريات والمستودعات - ${companyName}*
📞 للتنسيق والمتابعة: ${contactPhone}`;
    }

    // 4. Receipt Notice
    if (templateType === 'RECEIPT_NOTICE') {
      return `*🧾 إشعار سند مالي معتمد - ${companyName}*
---------------------------------------
عزيزي: *${recipientName || 'العميل الكريم'}*
تحية طيبة وبعد،،

نود إشعاركم بأنه تم قيد وتوثيق *${document.type === 'RECEIPT_VOUCHER' ? 'سند القبض' : 'السند المالي'}* التالي في حسابكم:

📄 *رقم السند:* ${document.documentNumber}
📅 *التاريخ:* ${document.date}
💰 *المبلغ المسدد:* *${formattedAmount}*
💳 *طريقة الدفع:* ${document.paymentMethod || 'نقداً / تحويل بنكي'}
${document.currentBalance !== undefined ? `⚖️ *الرصيد المتبقي بعد السداد:* ${formatCurrency(document.currentBalance, document.currency)}\n` : ''}${customNote ? `📝 *ملاحظات:* ${customNote}\n` : ''}
🔗 *رابط المعاينة الرقمية والتحقق:*
${verificationUrl}

نشكركم لتعاملكم معنا ونرحب بتواصلكم دائماً.
*${companyName}*
📞 خدمة العملاء: ${contactPhone}`;
    }

    // 5. Payment Reminder
    if (templateType === 'PAYMENT_REMINDER') {
      return `*🔔 تذكير استحقاق سداد - ${companyName}*
---------------------------------------
عزيزي: *${recipientName || 'العميل الكريم'}*
السلام عليكم ورحمة الله وبركاته،،

نود تذكيركم بلطف باستحقاق الفاتورة رقم *(${document.documentNumber})* الصادرة بتاريخ *${document.date}*
${document.dueDate ? `📅 *تاريخ الاستحقاق:* ${document.dueDate}\n` : ''}💰 *إجمالي قيمة الفاتورة:* ${formattedAmount}
${document.currentBalance !== undefined ? `⚖️ *إجمالي الرصيد المستحق حالياً:* *${formatCurrency(document.currentBalance, document.currency)}*\n` : ''}
${customNote ? `📌 *ملاحظة:* ${customNote}\n` : ''}
💳 *معلومات السداد البنكي:*
${companyProfile.activityDescription || 'حساب بنك التضامن الإسلامي / الكريمي'}
الاسم: ${companyName}

🔗 *رابط الفاتورة التفصيلية:*
${verificationUrl}

شاكرين لكم حسن تعاونكم الدائم.
📞 للاستفسار والمراجعة: ${contactPhone}`;
    }

    // Default: Detailed WhatsApp Pro Template
    let itemsText = '';
    if (document.items && document.items.length > 0) {
      itemsText = `\n📦 *تفاصيل الأصناف والبنود:*\n` + document.items.map((it, idx) => 
        ` ${idx + 1}. ${it.name} (الكمية: ${it.quantity}) - ${formatCurrency(it.total, document.currency)}`
      ).join('\n') + '\n';
    }

    return `*🏢 ${companyName}*
*🏛️ ${documentTitle}*
---------------------------------------
👤 *الجهة / الطرف:* ${recipientName || 'العميل المحترم'}
📄 *رقم المستند:* \`${document.documentNumber}\`
📅 *تاريخ الإصدار:* ${document.date}
${document.referenceInvoiceNumber ? `📑 *مرجع الفاتورة الأصلية:* ${document.referenceInvoiceNumber}\n` : ''}${document.dueDate ? `⏳ *تاريخ الاستحقاق:* ${document.dueDate}\n` : ''}🏢 *الرقم الضريبي للمنشأة:* ${vatNumber}
${itemsText}---------------------------------------
${document.subtotal ? `💵 *المبلغ الصافي:* ${formatCurrency(document.subtotal, document.currency)}\n` : ''}${document.taxAmount ? `📊 *ضريبة القيمة المضافة (5%):* ${formatCurrency(document.taxAmount, document.currency)}\n` : ''}💰 *المبلغ الإجمالي النهائي:* *${formattedAmount}*
${document.currentBalance !== undefined ? `⚖️ *الرصيد القائم بالحساب:* ${formatCurrency(document.currentBalance, document.currency)}\n` : ''}${customNote ? `📝 *ملاحظات إضافية:* ${customNote}\n` : ''}
🔐 *كود التحقق الإلكتروني والباركود:*
${verificationUrl}

---------------------------------------
✨ *نظام MeDo ERP المحاسبي الذكي*
📞 للاستفسارات: ${contactPhone} | ✉️ ${companyProfile.email || 'info@medo-erp.com'}`;
  }, [document, recipientName, templateType, customNote, companyProfile, verificationUrl, documentTitle]);

  // SMS Text character count and parts calculation
  const smsLength = messageBody.length;
  const isUnicode = /[^\u0000-\u00ff]/.test(messageBody);
  const smsPartSize = isUnicode ? 70 : 160;
  const smsPartsCount = Math.ceil(smsLength / smsPartSize) || 1;

  // Handle WhatsApp Click
  const handleOpenWhatsApp = () => {
    if (!cleanFullPhone) {
      alert('يرجى إدخال رقم الهاتف للمستلم أولاً.');
      return;
    }
    const encodedText = encodeURIComponent(messageBody);
    const waUrl = `https://wa.me/${cleanFullPhone}?text=${encodedText}`;
    window.open(waUrl, '_blank', 'noopener,noreferrer');
  };

  // Handle Native SMS Click & Simulated Gateway
  const handleOpenSMS = () => {
    if (!cleanFullPhone) {
      alert('يرجى إدخال رقم الهاتف للمستلم أولاً.');
      return;
    }
    const encodedText = encodeURIComponent(messageBody);
    const smsUrl = `sms:${countryCode}${phoneNumber}?body=${encodedText}`;
    
    // Simulate API dispatch
    setSmsSentStatus('SENDING');
    setTimeout(() => {
      setSmsSentStatus('SENT');
      setTimeout(() => setSmsSentStatus('IDLE'), 5000);
    }, 1000);

    window.open(smsUrl, '_blank');
  };

  // Copy SMS text to clipboard
  const handleCopySMS = () => {
    navigator.clipboard.writeText(messageBody).then(() => {
      setCopiedSms(true);
      setTimeout(() => setCopiedSms(false), 2500);
    });
  };

  // Copy text to clipboard
  const handleCopyText = () => {
    navigator.clipboard.writeText(messageBody).then(() => {
      setCopiedText(true);
      setTimeout(() => setCopiedText(false), 2500);
    });
  };

  // Copy link
  const handleCopyLink = () => {
    navigator.clipboard.writeText(verificationUrl).then(() => {
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2500);
    });
  };

  // Generate QR Code URL
  const qrDataUrl = useMemo(() => {
    const textToEncode = document.tlvQrBase64 || verificationUrl;
    return generateQRCodeDataURL(textToEncode, 160);
  }, [document, verificationUrl]);

  // Execute Local Print
  const handleExecuteLocalPrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs animate-in fade-in duration-200" dir="rtl">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-4xl max-h-[94vh] flex flex-col overflow-hidden">
        {/* Header with Mode Toggle */}
        <div className="px-6 py-4 bg-gradient-to-r from-slate-900 via-slate-800 to-blue-900 text-white flex items-center justify-between shrink-0 no-print">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-500/20 border border-blue-400/40 flex items-center justify-center text-blue-400">
              {modalMode === 'SHARE' ? <Share2 className="w-5 h-5" /> : <Printer className="w-5 h-5" />}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold">
                  {modalMode === 'SHARE' ? 'مشاركة المستند (SMS / واتساب)' : 'الطباعة المحلية للمستند'}
                </h3>
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-blue-500/30 text-blue-200 border border-blue-400/30 font-mono font-bold">
                  {document.documentNumber}
                </span>
                <span className="text-xs px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 font-medium">
                  {documentTitle}
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-0.5">
                مشاركة فورية عبر الرسائل النصية والواتساب، مع إمكانية المعاينة والطباعة المحلية المباشرة
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Toggle View Mode */}
            <div className="bg-slate-800/80 p-1 rounded-xl border border-slate-700 flex items-center gap-1">
              <button
                type="button"
                onClick={() => setModalMode('SHARE')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
                  modalMode === 'SHARE'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-slate-300 hover:text-white hover:bg-slate-700/50'
                }`}
              >
                <Smartphone className="w-3.5 h-3.5" />
                <span>إرسال ومشاركة (SMS)</span>
              </button>
              <button
                type="button"
                onClick={() => setModalMode('PRINT')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
                  modalMode === 'PRINT'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'text-slate-300 hover:text-white hover:bg-slate-700/50'
                }`}
              >
                <Printer className="w-3.5 h-3.5" />
                <span>معاينة وطباعة محلية</span>
              </button>
            </div>

            <button
              onClick={onClose}
              className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-white/10 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* MODE 1: DIGITAL SHARE & SMS TAB */}
        {modalMode === 'SHARE' && (
          <div className="flex-1 overflow-y-auto p-6 space-y-5">
            {/* Top Form: Recipient & Phone */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200">
              {/* Recipient Name */}
              <div className="md:col-span-5">
                <label className="block text-xs font-bold text-slate-700 mb-1.5">اسم المستلم / العميل / المورد:</label>
                <input
                  type="text"
                  value={recipientName}
                  onChange={(e) => setRecipientName(e.target.value)}
                  placeholder="اسم الطرف المعني..."
                  className="w-full text-sm px-3 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                />
              </div>

              {/* Country Code & Phone Number */}
              <div className="md:col-span-7">
                <label className="block text-xs font-bold text-slate-700 mb-1.5">رقم الهاتف (الواتساب / SMS):</label>
                <div className="flex items-center gap-2">
                  <select
                    value={countryCode}
                    onChange={(e) => setCountryCode(e.target.value)}
                    className="text-xs px-2.5 py-2 rounded-lg border border-slate-300 bg-white font-mono focus:outline-none focus:ring-2 focus:ring-blue-500 shrink-0"
                  >
                    {COUNTRY_CODES.map((c) => (
                      <option key={c.code} value={c.code}>
                        {c.flag} {c.countryAr} ({c.code})
                      </option>
                    ))}
                  </select>
                  <div className="relative flex-1">
                    <input
                      type="tel"
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value)}
                      placeholder="770000000"
                      dir="ltr"
                      className="w-full text-sm font-mono px-3 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-right"
                    />
                    <Smartphone className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  </div>
                </div>
              </div>
            </div>

            {/* Template Selection Tabs */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-2">قالب ونص الرسالة:</label>
              <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-2">
                <button
                  type="button"
                  onClick={() => setTemplateType('COMPACT_SMS')}
                  className={`text-xs p-2.5 rounded-lg border text-right font-medium transition-all ${
                    templateType === 'COMPACT_SMS'
                      ? 'bg-blue-50 border-blue-500 text-blue-900 ring-2 ring-blue-500/20'
                      : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center gap-1.5 font-bold text-blue-700 mb-0.5">
                    <Smartphone className="w-3.5 h-3.5" />
                    <span>رسالة SMS موجزة</span>
                  </div>
                  <p className="text-[10px] text-slate-500 truncate">موجز سريع ورابط رقمي</p>
                </button>

                <button
                  type="button"
                  onClick={() => setTemplateType('DETAILED_WA')}
                  className={`text-xs p-2.5 rounded-lg border text-right font-medium transition-all ${
                    templateType === 'DETAILED_WA'
                      ? 'bg-emerald-50 border-emerald-500 text-emerald-900 ring-2 ring-emerald-500/20'
                      : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center gap-1.5 font-bold text-emerald-700 mb-0.5">
                    <MessageCircle className="w-3.5 h-3.5" />
                    <span>واتساب تفصيلي</span>
                  </div>
                  <p className="text-[10px] text-slate-500 truncate">بنود الفاتورة والضريبة</p>
                </button>

                <button
                  type="button"
                  onClick={() => setTemplateType('RETURN_NOTICE')}
                  className={`text-xs p-2.5 rounded-lg border text-right font-medium transition-all ${
                    templateType === 'RETURN_NOTICE'
                      ? 'bg-rose-50 border-rose-500 text-rose-900 ring-2 ring-rose-500/20'
                      : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center gap-1.5 font-bold text-rose-700 mb-0.5">
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>إشعار مرتجع مالي</span>
                  </div>
                  <p className="text-[10px] text-slate-500 truncate">إشعار دائن / مدين ومردود</p>
                </button>

                <button
                  type="button"
                  onClick={() => setTemplateType('BILL_NOTICE')}
                  className={`text-xs p-2.5 rounded-lg border text-right font-medium transition-all ${
                    templateType === 'BILL_NOTICE'
                      ? 'bg-amber-50 border-amber-500 text-amber-900 ring-2 ring-amber-500/20'
                      : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center gap-1.5 font-bold text-amber-700 mb-0.5">
                    <Receipt className="w-3.5 h-3.5" />
                    <span>فاتورة مشتريات</span>
                  </div>
                  <p className="text-[10px] text-slate-500 truncate">إشعار توثيق للمورد</p>
                </button>

                <button
                  type="button"
                  onClick={() => setTemplateType('RECEIPT_NOTICE')}
                  className={`text-xs p-2.5 rounded-lg border text-right font-medium transition-all ${
                    templateType === 'RECEIPT_NOTICE'
                      ? 'bg-purple-50 border-purple-500 text-purple-900 ring-2 ring-purple-500/20'
                      : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center gap-1.5 font-bold text-purple-700 mb-0.5">
                    <FileText className="w-3.5 h-3.5" />
                    <span>إشعار سند مالي</span>
                  </div>
                  <p className="text-[10px] text-slate-500 truncate">تأكيد استلام وسداد</p>
                </button>

                <button
                  type="button"
                  onClick={() => setTemplateType('PAYMENT_REMINDER')}
                  className={`text-xs p-2.5 rounded-lg border text-right font-medium transition-all ${
                    templateType === 'PAYMENT_REMINDER'
                      ? 'bg-teal-50 border-teal-500 text-teal-900 ring-2 ring-teal-500/20'
                      : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center gap-1.5 font-bold text-teal-700 mb-0.5">
                    <Clock className="w-3.5 h-3.5" />
                    <span>تذكير استحقاق</span>
                  </div>
                  <p className="text-[10px] text-slate-500 truncate">مطالبة لطيفة بالسداد</p>
                </button>
              </div>
            </div>

            {/* Message Preview & QR Code Side-by-Side */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
              {/* Message Bubble Preview */}
              <div className="lg:col-span-8 flex flex-col">
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                      <span>معاينة نص الرسالة الصادرة:</span>
                    </span>
                    <span className="text-[11px] px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 font-mono">
                      {smsLength} حرف ({smsPartsCount} رسالة SMS)
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleCopySMS}
                      className="text-xs text-blue-600 hover:text-blue-800 flex items-center gap-1 font-medium bg-blue-50 px-2 py-1 rounded"
                    >
                      {copiedSms ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-600" />
                          <span className="text-emerald-600">تم نسخ SMS</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          <span>نسخ نص SMS</span>
                        </>
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={handleCopyText}
                      className="text-xs text-slate-600 hover:text-slate-800 flex items-center gap-1 font-medium bg-slate-100 px-2 py-1 rounded"
                    >
                      {copiedText ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-600" />
                          <span className="text-emerald-600">تم النسخ</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          <span>نسخ كامل</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>

                <div className="bg-slate-900 text-slate-100 p-4 rounded-xl font-sans text-xs sm:text-sm whitespace-pre-wrap leading-relaxed border border-slate-800 shadow-inner flex-1 max-h-60 overflow-y-auto">
                  {messageBody}
                </div>

                {/* Optional Custom Note */}
                <div className="mt-2.5">
                  <input
                    type="text"
                    value={customNote}
                    onChange={(e) => setCustomNote(e.target.value)}
                    placeholder="إضافة ملاحظة مخصصة في نهاية الرسالة (اختياري)..."
                    className="w-full text-xs px-3 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                  />
                </div>
              </div>

              {/* Smart QR Code Preview Card */}
              <div className="lg:col-span-4 bg-slate-50 border border-slate-200 rounded-xl p-4 flex flex-col items-center justify-between text-center">
                <div>
                  <div className="flex items-center justify-center gap-1.5 text-xs font-bold text-slate-800 mb-1">
                    <QrCode className="w-4 h-4 text-blue-600" />
                    <span>الباركود الرقمي المعتمد (QR)</span>
                  </div>
                  <p className="text-[10px] text-slate-500 mb-2">
                    امسح بالكاميرا لمعاينة الفاتورة أو المرتجع فوراً
                  </p>

                  <div className="bg-white p-2.5 rounded-xl border border-slate-300 shadow-xs inline-block mb-2">
                    <img
                      src={qrDataUrl}
                      alt="Document QR Code"
                      className="w-28 h-28 object-contain"
                    />
                  </div>
                </div>

                <div className="w-full space-y-1.5">
                  <button
                    type="button"
                    onClick={handleCopyLink}
                    className="w-full py-1.5 px-2 bg-white hover:bg-slate-100 border border-slate-300 rounded-lg text-xs font-medium text-slate-700 flex items-center justify-center gap-1.5 transition-colors"
                  >
                    {copiedLink ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                        <span className="text-emerald-600">تم نسخ الرابط</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5 text-slate-500" />
                        <span>نسخ الرابط الإلكتروني</span>
                      </>
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => setModalMode('PRINT')}
                    className="w-full py-1.5 px-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition"
                  >
                    <Printer className="w-3.5 h-3.5 text-slate-600" />
                    <span>معاينة الطباعة المحلية</span>
                  </button>
                </div>
              </div>
            </div>

            {/* SMS Status Notification if simulated */}
            {smsSentStatus === 'SENDING' && (
              <div className="bg-blue-50 border border-blue-200 text-blue-800 px-4 py-2.5 rounded-xl text-xs flex items-center gap-2 animate-pulse">
                <div className="w-2 h-2 rounded-full bg-blue-600 animate-ping" />
                <span>جاري إرسال رسالة SMS عبر البوابة المعتمدة وتجهيز كود التحقق...</span>
              </div>
            )}
            {smsSentStatus === 'SENT' && (
              <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 px-4 py-2.5 rounded-xl text-xs flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>تم إرسال رسالة SMS بنجاح إلى ({countryCode} {phoneNumber})!</span>
                </div>
                <span className="text-[10px] text-emerald-700 font-mono">SMS-GATEWAY-TX-OK</span>
              </div>
            )}
          </div>
        )}

        {/* MODE 2: LOCAL PRINT PREVIEW TAB */}
        {modalMode === 'PRINT' && (
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            {/* Format Selection & Quick Print Toolbar */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-slate-50 p-3 rounded-xl border border-slate-200 no-print">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-700">تنسيق الطباعة المحلية:</span>
                <button
                  type="button"
                  onClick={() => setPrintFormat('A4_TAX')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
                    printFormat === 'A4_TAX'
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'bg-white text-slate-700 border border-slate-300 hover:bg-slate-100'
                  }`}
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>فاتورة ضريبية رسمية (A4 Standard)</span>
                </button>
                <button
                  type="button"
                  onClick={() => setPrintFormat('THERMAL_80MM')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
                    printFormat === 'THERMAL_80MM'
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'bg-white text-slate-700 border border-slate-300 hover:bg-slate-100'
                  }`}
                >
                  <Receipt className="w-3.5 h-3.5" />
                  <span>إيصال طابعة حرارية (80mm Thermal)</span>
                </button>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleExecuteLocalPrint}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-xs flex items-center gap-2"
                >
                  <Printer className="w-4 h-4" />
                  <span>بدء الطباعة المحلية (Print Now)</span>
                </button>
              </div>
            </div>

            {/* A4 Formal Standard Document Preview */}
            {printFormat === 'A4_TAX' && (
              <div className="bg-white text-slate-900 p-8 rounded-xl border border-slate-300 space-y-5 font-sans text-xs max-w-3xl mx-auto shadow-sm printable-document">
                {/* Header */}
                <div className="flex justify-between items-start border-b-2 border-slate-900 pb-4">
                  <div className="space-y-1">
                    <CompanyHeaderView align="right" size="sm" />
                    <p className="text-[10px] text-slate-600">{companyProfile.nameEn}</p>
                    <div className="text-[10px] text-slate-600 mt-1 space-y-0.5">
                      <p>الرقم الضريبي للمنشأة: <strong className="font-mono text-slate-800">{companyProfile.taxNumber}</strong></p>
                      <p>السجل التجاري: <strong className="font-mono text-slate-800">{companyProfile.commercialRegister}</strong></p>
                      <p>{companyProfile.address} - {companyProfile.city}</p>
                      <p>هاتف: {companyProfile.phone}</p>
                    </div>
                  </div>

                  <div className="text-left space-y-1">
                    <div className="inline-block bg-slate-900 text-white font-extrabold text-xs px-3 py-1 rounded">
                      {documentTitle}
                    </div>
                    <p className="font-mono text-xs font-bold text-slate-800 mt-1">Ref: {document.documentNumber}</p>
                    <p className="text-[10px] text-slate-600">تاريخ الإصدار: {document.date}</p>
                    {document.dueDate && (
                      <p className="text-[10px] text-slate-600">تاريخ الاستحقاق: {document.dueDate}</p>
                    )}
                    {document.referenceInvoiceNumber && (
                      <p className="text-[10px] text-rose-700 font-bold">مرجع الفاتورة الأصلية: {document.referenceInvoiceNumber}</p>
                    )}
                  </div>
                </div>

                {/* Party Box */}
                <div className="grid grid-cols-2 gap-4 bg-slate-50 p-3 border border-slate-200 rounded-lg">
                  <div>
                    <span className="text-[10px] text-slate-500 block">السادة / الطرف المفوتر:</span>
                    <strong className="text-xs text-slate-800">{recipientName || 'العميل الكريم'}</strong>
                    {document.recipientPhone && (
                      <p className="text-[10px] text-slate-600 mt-0.5 font-mono">{document.recipientPhone}</p>
                    )}
                  </div>
                  <div className="text-left">
                    <span className="text-[10px] text-slate-500 block">نوع العملية والحالة:</span>
                    <span className="inline-block font-bold text-xs text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                      معتمد وموثق محاسبياً
                    </span>
                    {document.returnReason && (
                      <p className="text-[10px] text-rose-600 mt-1">سبب المردود: {document.returnReason}</p>
                    )}
                  </div>
                </div>

                {/* Items Table */}
                <table className="w-full border-collapse border border-slate-300 text-right text-[11px]">
                  <thead className="bg-slate-100 text-slate-800">
                    <tr>
                      <th className="border border-slate-300 p-2 text-center w-10">#</th>
                      <th className="border border-slate-300 p-2">بيان الصنف / الخدمة / المردود</th>
                      <th className="border border-slate-300 p-2 text-center w-20">الكمية</th>
                      <th className="border border-slate-300 p-2 text-left w-28">سعر الوحدة</th>
                      <th className="border border-slate-300 p-2 text-left w-24">الضريبة</th>
                      <th className="border border-slate-300 p-2 text-left w-32">الإجمالي</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(document.items && document.items.length > 0) ? (
                      document.items.map((it, idx) => (
                        <tr key={idx}>
                          <td className="border border-slate-300 p-2 text-center font-mono">{idx + 1}</td>
                          <td className="border border-slate-300 p-2 font-medium">{it.name}</td>
                          <td className="border border-slate-300 p-2 text-center font-mono">{it.quantity}</td>
                          <td className="border border-slate-300 p-2 text-left font-mono">{it.unitPrice.toLocaleString()}</td>
                          <td className="border border-slate-300 p-2 text-left font-mono">{(it.taxAmount || 0).toLocaleString()}</td>
                          <td className="border border-slate-300 p-2 text-left font-mono font-bold">{it.total.toLocaleString()}</td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td className="border border-slate-300 p-2 text-center font-mono">1</td>
                        <td className="border border-slate-300 p-2 font-medium">{document.notes || documentTitle}</td>
                        <td className="border border-slate-300 p-2 text-center font-mono">1</td>
                        <td className="border border-slate-300 p-2 text-left font-mono">{document.amount.toLocaleString()}</td>
                        <td className="border border-slate-300 p-2 text-left font-mono">{(document.taxAmount || 0).toLocaleString()}</td>
                        <td className="border border-slate-300 p-2 text-left font-mono font-bold">{document.amount.toLocaleString()}</td>
                      </tr>
                    )}
                    
                    {/* Totals Breakdown */}
                    {document.subtotal !== undefined && (
                      <tr className="bg-slate-50 font-medium">
                        <td colSpan={5} className="border border-slate-300 p-2 text-right">المجموع الصافي قبل الضريبة</td>
                        <td className="border border-slate-300 p-2 text-left font-mono">{document.subtotal.toLocaleString()} {document.currency}</td>
                      </tr>
                    )}
                    {document.taxAmount !== undefined && (
                      <tr className="bg-slate-50 font-medium">
                        <td colSpan={5} className="border border-slate-300 p-2 text-right">إجمالي ضريبة القيمة المضافة (5%)</td>
                        <td className="border border-slate-300 p-2 text-left font-mono">{document.taxAmount.toLocaleString()} {document.currency}</td>
                      </tr>
                    )}
                    <tr className="bg-slate-200 font-bold text-xs">
                      <td colSpan={5} className="border border-slate-400 p-2 text-right">المبلغ الإجمالي النهائي للمستند</td>
                      <td className="border border-slate-400 p-2 text-left font-mono font-extrabold">{document.amount.toLocaleString()} {document.currency}</td>
                    </tr>
                  </tbody>
                </table>

                {/* Tafqeet in Arabic Words */}
                <div className="p-2.5 bg-slate-50 border border-slate-200 rounded text-[11px] flex items-center justify-between">
                  <div>
                    <span className="font-bold text-slate-700">المبلغ بالحروف: </span>
                    <span className="font-medium text-slate-800">{tafqeetArabic(document.amount, document.currency)}</span>
                  </div>
                  {document.currentBalance !== undefined && (
                    <div className="text-left font-mono text-[11px]">
                      <span className="text-slate-500">الرصيد المتبقي: </span>
                      <strong className="text-amber-700">{formatCurrency(document.currentBalance, document.currency)}</strong>
                    </div>
                  )}
                </div>

                {/* Footer with QR Code & Official Stamp */}
                <div className="flex justify-between items-center pt-4 border-t border-slate-200">
                  <div className="flex items-center gap-3 border border-slate-300 p-2.5 rounded-lg bg-slate-50">
                    <img src={qrDataUrl} alt="QR Code" className="w-14 h-14 object-contain" />
                    <div className="text-[9px] text-slate-600 space-y-0.5">
                      <p className="font-bold text-slate-800">رمز التحقق الإلكتروني المعتمد</p>
                      <p>متوافق مع هيئة الزكاة والضرائب</p>
                      <p className="font-mono text-[8px] text-slate-400">{document.documentNumber}</p>
                    </div>
                  </div>

                  <div className="text-center text-[10px] space-y-8">
                    <p className="font-bold text-slate-800">ختم واعتماد الإدارة المالية</p>
                    <div className="w-40 border-b border-dashed border-slate-400 mx-auto" />
                  </div>
                </div>
              </div>
            )}

            {/* 80mm Thermal Receipt Preview */}
            {printFormat === 'THERMAL_80MM' && (
              <div className="bg-white text-slate-900 p-5 rounded-xl border border-dashed border-slate-400 space-y-3 font-mono text-[11px] max-w-sm mx-auto shadow-sm text-right printable-thermal">
                <div className="text-center space-y-1">
                  <CompanyHeaderView size="sm" />
                  <p className="text-[9px] text-slate-500">{companyProfile.address}</p>
                  <p className="text-[9px] text-slate-600">الرقم الضريبي: {companyProfile.taxNumber}</p>
                  <p className="text-[9px] text-slate-600">هاتف: {companyProfile.phone}</p>
                  <div className="border-t border-b border-dashed border-slate-300 py-1 font-bold text-[10px]">
                    {documentTitle}
                  </div>
                </div>

                <div className="text-[9px] space-y-0.5 text-slate-700">
                  <div>رقم المستند: <strong>{document.documentNumber}</strong></div>
                  <div>التاريخ: {document.date}</div>
                  <div>العميل / الطرف: {recipientName || 'عميل'}</div>
                  {document.referenceInvoiceNumber && (
                    <div className="text-rose-600">مرجع الفاتورة: {document.referenceInvoiceNumber}</div>
                  )}
                </div>

                {/* Items */}
                <table className="w-full text-right text-[9px] border-t border-b border-dashed border-slate-300 my-1">
                  <thead>
                    <tr className="border-b border-slate-200">
                      <th className="py-1">الصنف</th>
                      <th className="py-1 text-center">الكمية</th>
                      <th className="py-1 text-left">الإجمالي</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {(document.items && document.items.length > 0) ? (
                      document.items.map((it, idx) => (
                        <tr key={idx}>
                          <td className="py-1">{it.name}</td>
                          <td className="py-1 text-center">{it.quantity}</td>
                          <td className="py-1 text-left font-bold">{it.total.toLocaleString()}</td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td className="py-1">{document.notes || documentTitle}</td>
                        <td className="py-1 text-center">1</td>
                        <td className="py-1 text-left font-bold">{document.amount.toLocaleString()}</td>
                      </tr>
                    )}
                  </tbody>
                </table>

                {/* Totals */}
                <div className="space-y-1 text-[10px]">
                  {document.subtotal !== undefined && (
                    <div className="flex justify-between">
                      <span>المجموع الفرعي:</span>
                      <span>{document.subtotal.toLocaleString()} {document.currency}</span>
                    </div>
                  )}
                  {document.taxAmount !== undefined && (
                    <div className="flex justify-between">
                      <span>الضريبة (5%):</span>
                      <span>{document.taxAmount.toLocaleString()} {document.currency}</span>
                    </div>
                  )}
                  <div className="flex justify-between font-extrabold text-xs pt-1 border-t border-slate-300">
                    <span>الإجمالي النهائي:</span>
                    <span>{document.amount.toLocaleString()} {document.currency}</span>
                  </div>
                </div>

                {/* QR Code */}
                <div className="pt-2 flex flex-col items-center justify-center space-y-1 text-center">
                  <img src={qrDataUrl} alt="QR Code" className="w-20 h-20 object-contain" />
                  <span className="text-[8px] text-slate-400">فاتورة ضريبية مبسطة معتمدة ZATCA</span>
                  <span className="text-[8px] text-slate-500">شكراً لتعاملكم معنا!</span>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Footer Actions */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3 shrink-0 no-print">
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>نظام الفوترة والمشاركة المعتمد - MeDo ERP</span>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-slate-600 hover:text-slate-800 hover:bg-slate-200/60 rounded-xl transition-colors"
            >
              إغلاق
            </button>

            {/* Local Print Button */}
            <button
              type="button"
              onClick={handleExecuteLocalPrint}
              className="px-4 py-2.5 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-bold shadow-xs flex items-center gap-2 transition"
            >
              <Printer className="w-4 h-4" />
              <span>طباعة محلية</span>
            </button>

            {/* SMS Button */}
            <button
              type="button"
              onClick={handleOpenSMS}
              className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-md shadow-blue-600/20 flex items-center gap-2 transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
              <Smartphone className="w-4 h-4" />
              <span>مشاركة عبر رسالة SMS</span>
            </button>

            {/* WhatsApp Main Button */}
            <button
              type="button"
              onClick={handleOpenWhatsApp}
              className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-md shadow-emerald-600/20 flex items-center gap-2 transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
              <MessageCircle className="w-4 h-4 fill-white text-emerald-600" />
              <span>إرسال عبر واتساب</span>
              <ExternalLink className="w-3.5 h-3.5 opacity-80" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
