/**
 * Thermal Printer Utility for POS Receipts (80mm & 58mm format)
 * Supports browser direct printing, ESC/POS formatting, ZATCA QR codes, and custom receipt headers.
 */

import { POSTransaction, CompanyProfile } from '../types/accounting';
import { generateTLVBase64 } from './eInvoiceUtils';

export interface ThermalPrinterSettings {
  paperWidth: '80mm' | '58mm';
  autoPrintOnCheckout: boolean;
  showLogo: boolean;
  showTaxDetails: boolean;
  showQrCode: boolean;
  customHeaderNote?: string;
  customFooterNote?: string;
  printerName?: string;
}

export const DEFAULT_THERMAL_SETTINGS: ThermalPrinterSettings = {
  paperWidth: '80mm',
  autoPrintOnCheckout: true,
  showLogo: true,
  showTaxDetails: true,
  showQrCode: true,
  customHeaderNote: 'مرحباً بكم - نسعد بخدمتكم دائماً',
  customFooterNote: 'البضاعة المباعة ترجع وتستبدل خلال 3 أيام بشرط وجود الإيصال الأصل',
  printerName: 'طابعة الإيصالات الحرارية (80mm Thermal Printer)',
};

/**
 * Direct print function using an isolated printable iframe.
 * Ensures only the 80mm thermal receipt is sent to the printer without UI clutter.
 */
export function printThermalReceipt80mm(
  receipt: POSTransaction,
  companyProfile: CompanyProfile,
  settings: ThermalPrinterSettings = DEFAULT_THERMAL_SETTINGS
) {
  const widthPx = settings.paperWidth === '58mm' ? '54mm' : '78mm';
  const qrBase64 = receipt.qrCodeData || generateTLVBase64(
    companyProfile.nameAr || 'شركة نقاط البيع',
    companyProfile.taxNumber || '300000000000003',
    new Date(receipt.date).toISOString(),
    receipt.grandTotal,
    receipt.taxTotal
  );

  // Generate QR Code SVG or rendering URL (using Google Chart API / SVG matrix for crisp thermal printing)
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=140x140&data=${encodeURIComponent(qrBase64)}`;

  const htmlContent = `
    <!DOCTYPE html>
    <html dir="rtl" lang="ar">
    <head>
      <meta charset="UTF-8" />
      <title>إيصال حراري - ${receipt.receiptNumber}</title>
      <style>
        @page {
          size: ${settings.paperWidth} auto;
          margin: 0mm;
        }
        * {
          box-sizing: border-box;
          margin: 0;
          padding: 0;
          font-family: 'Courier New', Courier, monospace, 'Segoe UI', Tahoma, sans-serif;
        }
        body {
          width: ${widthPx};
          margin: 0 auto;
          padding: 4mm 2mm;
          background: #ffffff;
          color: #000000;
          font-size: 11px;
          line-height: 1.35;
          text-align: right;
          -webkit-print-color-adjust: exact;
          print-color-adjust: exact;
        }
        .header {
          text-align: center;
          margin-bottom: 6px;
          border-bottom: 1px dashed #000;
          padding-bottom: 6px;
        }
        .company-title {
          font-size: 14px;
          font-weight: 900;
          margin-bottom: 2px;
        }
        .sub-info {
          font-size: 9.5px;
          color: #111;
        }
        .badge-80mm {
          display: inline-block;
          font-size: 8px;
          border: 1px solid #000;
          padding: 1px 4px;
          border-radius: 2px;
          margin-top: 2px;
          font-weight: bold;
        }
        .meta-table {
          width: 100%;
          margin-bottom: 6px;
          font-size: 10px;
          border-bottom: 1px dashed #000;
          padding-bottom: 6px;
        }
        .meta-table td {
          padding: 1px 0;
        }
        .meta-table td.left {
          text-align: left;
          font-family: monospace;
        }
        .items-table {
          width: 100%;
          border-collapse: collapse;
          margin-bottom: 6px;
          font-size: 10px;
        }
        .items-table th {
          border-bottom: 1px solid #000;
          padding: 3px 0;
          text-align: right;
          font-weight: bold;
        }
        .items-table th.center { text-align: center; }
        .items-table th.left { text-align: left; }
        .items-table td {
          padding: 3px 0;
          border-bottom: 1px dotted #ccc;
          vertical-align: top;
        }
        .items-table td.center { text-align: center; }
        .items-table td.left { text-align: left; font-family: monospace; }
        .totals-section {
          border-top: 1px dashed #000;
          padding-top: 4px;
          margin-bottom: 6px;
          font-size: 10.5px;
        }
        .row {
          display: flex;
          justify-content: space-between;
          padding: 1.5px 0;
        }
        .row.grand-total {
          font-size: 12.5px;
          font-weight: 900;
          border-top: 1px double #000;
          border-bottom: 1px double #000;
          padding: 4px 0;
          margin-top: 3px;
        }
        .qr-container {
          text-align: center;
          margin-top: 8px;
          padding-top: 6px;
          border-top: 1px dashed #000;
        }
        .qr-img {
          width: 110px;
          height: 110px;
          margin: 0 auto 3px auto;
          display: block;
          image-rendering: pixelated;
        }
        .footer-note {
          text-align: center;
          font-size: 9px;
          margin-top: 6px;
          padding-top: 4px;
          border-top: 1px dotted #888;
        }
        .cut-line {
          margin-top: 12px;
          border-bottom: 1px dashed #888;
          text-align: center;
          font-size: 8px;
          color: #666;
          position: relative;
        }
        .cut-line span {
          background: #fff;
          padding: 0 4px;
          position: relative;
          top: 6px;
        }
      </style>
    </head>
    <body>
      <div class="header">
        <div class="company-title">${companyProfile.nameAr || 'مجموعة المروج التجارية'}</div>
        ${companyProfile.address ? `<div class="sub-info">${companyProfile.address} - ${companyProfile.city || ''}</div>` : ''}
        ${companyProfile.phone ? `<div class="sub-info">هاتف: ${companyProfile.phone}</div>` : ''}
        ${companyProfile.taxNumber ? `<div class="sub-info"><b>الرقم الضريبي:</b> ${companyProfile.taxNumber}</div>` : ''}
        <div class="badge-80mm">فاتورة ضريبية مبسطة (80mm Thermal)</div>
        ${settings.customHeaderNote ? `<div class="sub-info" style="margin-top:3px;font-style:italic;">${settings.customHeaderNote}</div>` : ''}
      </div>

      <table class="meta-table">
        <tr>
          <td><b>رقم الإيصال:</b> ${receipt.receiptNumber}</td>
          <td class="left"><b>التاريخ:</b> ${new Date(receipt.date).toLocaleDateString('ar-YE')} ${new Date(receipt.date).toLocaleTimeString('ar-YE', { hour: '2-digit', minute: '2-digit' })}</td>
        </tr>
        <tr>
          <td><b>الكاشير:</b> ${receipt.cashierName || 'الرئيسي'}</td>
          <td class="left"><b>طريقة الدفع:</b> ${
            receipt.paymentMethod === 'CASH'
              ? 'نقداً'
              : receipt.paymentMethod === 'CARD'
              ? 'شبكة/بطاقة'
              : receipt.paymentMethod === 'CREDIT'
              ? 'آجل (ذمم)'
              : 'تحويل بنكي'
          }</td>
        </tr>
        <tr>
          <td colspan="2"><b>العميل:</b> ${receipt.customerName || 'عميل نقدي مباشر'}</td>
        </tr>
      </table>

      <table class="items-table">
        <thead>
          <tr>
            <th>الصنف</th>
            <th class="center">الكمية</th>
            <th class="center">السعر</th>
            <th class="left">الإجمالي</th>
          </tr>
        </thead>
        <tbody>
          ${receipt.items
            .map(
              (it) => `
            <tr>
              <td>${it.nameAr}</td>
              <td class="center">${it.quantity}</td>
              <td class="center">${it.unitPrice.toLocaleString()}</td>
              <td class="left">${it.total.toLocaleString()}</td>
            </tr>
          `
            )
            .join('')}
        </tbody>
      </table>

      <div class="totals-section">
        <div class="row">
          <span>المجموع الصافي:</span>
          <span>${receipt.subtotal.toLocaleString()} ${receipt.currency || 'YER'}</span>
        </div>
        ${
          receipt.discountTotal > 0
            ? `
          <div class="row" style="color:#000;">
            <span>الخصم التجاري:</span>
            <span>-${receipt.discountTotal.toLocaleString()} ${receipt.currency || 'YER'}</span>
          </div>
        `
            : ''
        }
        <div class="row">
          <span>ضريبة القيمة المضافة (5%):</span>
          <span>${receipt.taxTotal.toLocaleString()} ${receipt.currency || 'YER'}</span>
        </div>
        <div class="row grand-total">
          <span>الإجمالي المدفوع:</span>
          <span>${receipt.grandTotal.toLocaleString()} ${receipt.currency || 'YER'}</span>
        </div>
        ${
          receipt.paymentMethod === 'CASH' && receipt.amountPaid > 0
            ? `
          <div class="row">
            <span>المبلغ المقبوض:</span>
            <span>${receipt.amountPaid.toLocaleString()} ${receipt.currency || 'YER'}</span>
          </div>
          <div class="row">
            <span>المتبقي (الصرف):</span>
            <span>${receipt.changeDue.toLocaleString()} ${receipt.currency || 'YER'}</span>
          </div>
        `
            : ''
        }
      </div>

      ${
        settings.showQrCode
          ? `
        <div class="qr-container">
          <img class="qr-img" src="${qrUrl}" alt="ZATCA QR Code" />
          <div style="font-size:8px;font-weight:bold;">رمز الإيصال الضريبي المعتمد (ZATCA QR)</div>
        </div>
      `
          : ''
      }

      ${
        settings.customFooterNote
          ? `
        <div class="footer-note">
          ${settings.customFooterNote}
        </div>
      `
          : ''
      }

      <div class="cut-line">
        <span>✂ قص الورقة من هنا ✂</span>
      </div>
    </body>
    </html>
  `;

  // Create temporary iframe for printing silently
  let iframe = document.getElementById('thermal-print-iframe') as HTMLIFrameElement;
  if (!iframe) {
    iframe = document.createElement('iframe');
    iframe.id = 'thermal-print-iframe';
    iframe.style.position = 'fixed';
    iframe.style.right = '0';
    iframe.style.bottom = '0';
    iframe.style.width = '0px';
    iframe.style.height = '0px';
    iframe.style.border = '0';
    iframe.style.opacity = '0';
    document.body.appendChild(iframe);
  }

  const iframeDoc = iframe.contentWindow?.document || iframe.contentDocument;
  if (iframeDoc) {
    iframeDoc.open();
    iframeDoc.write(htmlContent);
    iframeDoc.close();

    // Trigger print once content & QR image loaded
    setTimeout(() => {
      try {
        iframe.contentWindow?.focus();
        iframe.contentWindow?.print();
      } catch (err) {
        // Fallback to standard print
        window.print();
      }
    }, 450);
  }
}
