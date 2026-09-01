import {
  Customer,
  Invoice,
  CompanyProfile,
  WhatsAppReminderRule,
  WhatsAppScheduledReminder,
  ReminderTriggerType,
  Currency
} from '../types/accounting';
import { formatCurrency } from './formatters';

export const DEFAULT_WHATSAPP_REMINDER_RULES: WhatsAppReminderRule[] = [
  {
    id: 'RULE-01-BEFORE-7',
    nameAr: 'تذكير استباقي مبكر (قبل 7 أيام من الاستحقاق)',
    triggerType: 'BEFORE_DUE_7_DAYS',
    daysOffset: -7,
    templateId: 'TPL-EARLY-7',
    templateTitle: 'إشعار تذكير ودي استباقي',
    defaultMessage: `*🏢 [اسم_الشركة]*
*📅 إشعار تذكير بقرب موعد استحقاق الفاتورة*
--------------------------------------------
الأخوة الأعزاء / *[اسم_العميل]* المحترمين،
تحية طيبة وبعد،،

نود إحاطتكم بلطف بأن فاتورة المبيعات رقم *[رقم_الفاتورة]* الصادرة بتاريخ [تاريخ_الفاتورة] بمبلغ متبقي *[المبلغ_المتبقي]*، يحل موعد استحقاق سدادها بتاريخ *[تاريخ_الاستحقاق]* (متبقي [الأيام_المتبقية] أيام).

📄 *رابط معاينة الفاتورة الإلكترونية:*
[رابط_الفاتورة]

💳 *بيانات السداد والتحويل البنكي:*
[بيانات_البنك]

شاكرين ومقدرين حسن تعاونكم الدائم وثقتكم بنا.
*الإدارة المالية - [اسم_الشركة]*
📞 هاتف: [هاتف_الشركة]`,
    isEnabled: true,
    scheduledSendTime: '09:00',
    includePaymentLink: true,
    includePdfStatement: false,
    autoSend: true,
  },
  {
    id: 'RULE-02-BEFORE-3',
    nameAr: 'تذكير اقتراب موعد السداد (قبل 3 أيام)',
    triggerType: 'BEFORE_DUE_3_DAYS',
    daysOffset: -3,
    templateId: 'TPL-URGENT-3',
    templateTitle: 'إشعار اقتراب موعد الاستحقاق',
    defaultMessage: `*🔔 تذكير هام بموعد سداد الفاتورة - [اسم_الشركة]*
--------------------------------------------
السادة / *[اسم_العميل]*،
السلام عليكم ورحمة الله وبركاته،

نلفت عنايتكم الكريمة إلى أن موعد استحقاق الفاتورة رقم *[رقم_الفاتورة]* يقترب خلال *3 أيام فقط* (تاريخ الاستحقاق: *[تاريخ_الاستحقاق]*).

💰 *المبلغ المستحق للسداد:* *[المبلغ_المتبقي]*

يرجى التكرم بجدولة أمر التحويل لحسابنا البنكي المعتمد:
[بيانات_البنك]

📄 للمعاينة: [رابط_الفاتورة]

في حال تم التحويل مسبقاً، نرجو التكرم بتزويدنا بصورة الإشعار لتأكيد التسوية.
مع خالص التحية والتقدير.`,
    isEnabled: true,
    scheduledSendTime: '09:30',
    includePaymentLink: true,
    includePdfStatement: true,
    autoSend: true,
  },
  {
    id: 'RULE-03-ON-DUE',
    nameAr: 'تذكير يوم الاستحقاق (اليوم المحدد)',
    triggerType: 'ON_DUE_DATE',
    daysOffset: 0,
    templateId: 'TPL-DUE-TODAY',
    templateTitle: 'إشعار حلول موعد الاستحقاق اليوم',
    defaultMessage: `*⚠️ إشعار حلول تاريخ استحقاق الفاتورة اليوم*
--------------------------------------------
عناية السادة / *[اسم_العميل]* المحترمين،

نود إشعاركم بأن اليوم *[تاريخ_الاستحقاق]* هو الموعد المحدد لسداد الفاتورة رقم *[رقم_الفاتورة]*.

💵 *إجمالي المبلغ الواجب سداده اليوم:* *[المبلغ_المتبقي]*
🏦 *الحساب البنكي المعتمد:* [بيانات_البنك]
📄 *رابط الفاتورة المعتمدة:* [رابط_الفاتورة]

نرجو التكرم بإجراء الحوالة وموافاتنا بنسخة من السند لتحديث كشف الحساب وتثبيت قيد السداد.
شاكرين اهتمامكم وسرعة تجاوبكم.
*[اسم_الشركة] - قسم التحصيل والائتمان*`,
    isEnabled: true,
    scheduledSendTime: '10:00',
    includePaymentLink: true,
    includePdfStatement: true,
    autoSend: true,
  },
  {
    id: 'RULE-04-OVERDUE-7',
    nameAr: 'تذكير تأخر السداد الأسبوع الأول (+7 أيام)',
    triggerType: 'OVERDUE_7_DAYS',
    daysOffset: 7,
    templateId: 'TPL-OVERDUE-7',
    templateTitle: 'إشعار تأخر السداد الأسبوع الأول',
    defaultMessage: `*🚨 إشعار تأخر سداد فاتورة مستحقة*
--------------------------------------------
السادة / *[اسم_العميل]*،

نحيطكم علماً بأن الفاتورة رقم *[رقم_الفاتورة]* قد تجاوزت موعد استحقاقها المحدد بتاريخ [تاريخ_الاستحقاق] بفارق *[الأيام_المتأخرة] أيام*.

💰 *الرصيد المتأخر:* *[المبلغ_المتبقي]*

نرجو سرعة المبادرة بالتحويل لتجنب أي تعليق تلقائي للطلبيات أو التسهيلات الائتمانية.
💳 [بيانات_البنك]
📄 [رابط_الفاتورة]

نرجو الإفادة في حال وجود أي استفسار أو ترتيبات دفع.
*الشؤون المالية والتحصيل - [اسم_الشركة]*`,
    isEnabled: true,
    scheduledSendTime: '11:00',
    includePaymentLink: true,
    includePdfStatement: true,
    autoSend: false,
  },
  {
    id: 'RULE-05-OVERDUE-15',
    nameAr: 'إشعار المطالبة المالية العاجلة (+15 يوم فأكثر)',
    triggerType: 'OVERDUE_15_DAYS',
    daysOffset: 15,
    templateId: 'TPL-OVERDUE-15',
    templateTitle: 'مطالبة مالية رسمية وحازمة',
    defaultMessage: `*⚠️ إشعار مطالبة مالية عاجلة ورسمية*
--------------------------------------------
عناية الإدارة المالية / *[اسم_العميل]*،

بمراجعة كشف حسابكم طرفنا، تبين استمرار تأخر سداد الفاتورة رقم *[رقم_الفاتورة]* لمدة *[الأيام_المتأخرة] يوماً* عن موعد استحقاقها ([تاريخ_الاستحقاق]).

🔴 *المبلغ المستحق فوراً:* *[المبلغ_المتبقي]*
🏦 *بيانات الحساب للتحويل المباشر:* [بيانات_البنك]

يرجى التواصل الفوري مع قسم الائتمان والتحصيل على هاتف [هاتف_الشركة] أو الرد مباشرة على هذه الرسالة لتسوية الحساب خلال 24 ساعة.
*الإدارة القانونية والمالية - [اسم_الشركة]*`,
    isEnabled: true,
    scheduledSendTime: '11:30',
    includePaymentLink: true,
    includePdfStatement: true,
    autoSend: false,
  },
];

/**
 * Calculates days difference between current date and target date (target - now)
 * Positive = remaining in future, 0 = today, Negative = overdue
 */
export function calculateDaysUntilDue(dueDateStr: string, referenceDateStr?: string): number {
  const refDate = referenceDateStr ? new Date(referenceDateStr) : new Date();
  refDate.setHours(0, 0, 0, 0);

  const dueDate = new Date(dueDateStr);
  dueDate.setHours(0, 0, 0, 0);

  const diffMs = dueDate.getTime() - refDate.getTime();
  return Math.round(diffMs / (1000 * 60 * 60 * 24));
}

/**
 * Interpolates dynamic placeholders inside message templates
 */
export function interpolateReminderMessage(
  template: string,
  params: {
    customerName: string;
    customerCode?: string;
    invoiceNumber: string;
    invoiceDate: string;
    dueDate: string;
    remainingAmount: number;
    currency: Currency;
    daysUntilDue: number;
    companyProfile: CompanyProfile;
  }
): string {
  const {
    customerName,
    customerCode = '',
    invoiceNumber,
    invoiceDate,
    dueDate,
    remainingAmount,
    currency,
    daysUntilDue,
    companyProfile,
  } = params;

  const formattedAmount = formatCurrency(remainingAmount, currency);
  const companyName = companyProfile.nameAr || 'مجموعة المروج الدولية';
  const companyPhone = companyProfile.phone || companyProfile.whatsapp || '+967 1 445566';
  const bankDetails = `بنك التضامن: YE55TAD00012345678901\nبنك الكريمي: YE22KRM00054321678901 (باسم: ${companyName})`;
  const invoiceLink = `https://medo-erp.cloud/v/inv?doc=${encodeURIComponent(invoiceNumber)}&verify=1`;

  const absDays = Math.abs(daysUntilDue);
  const daysRemainingText = daysUntilDue > 0 ? `${daysUntilDue}` : '0';
  const daysOverdueText = daysUntilDue < 0 ? `${absDays}` : '0';

  let msg = template;
  msg = msg.replace(/\[اسم_الشركة\]/g, companyName);
  msg = msg.replace(/\[اسم_العميل\]/g, customerName);
  msg = msg.replace(/\[كود_العميل\]/g, customerCode);
  msg = msg.replace(/\[رقم_الفاتورة\]/g, invoiceNumber);
  msg = msg.replace(/\[تاريخ_الفاتورة\]/g, invoiceDate);
  msg = msg.replace(/\[تاريخ_الاستحقاق\]/g, dueDate);
  msg = msg.replace(/\[المبلغ_المتبقي\]/g, formattedAmount);
  msg = msg.replace(/\[الأيام_المتبقية\]/g, daysRemainingText);
  msg = msg.replace(/\[الأيام_المتأخرة\]/g, daysOverdueText);
  msg = msg.replace(/\[هاتف_الشركة\]/g, companyPhone);
  msg = msg.replace(/\[بيانات_البنك\]/g, bankDetails);
  msg = msg.replace(/\[رابط_الفاتورة\]/g, invoiceLink);

  return msg;
}

/**
 * Builds direct WhatsApp URL with encoded message
 */
export function buildWhatsAppDirectLink(phone: string, message: string): string {
  let cleanDigits = phone.replace(/\D/g, '');
  if (!cleanDigits) return `https://wa.me/?text=${encodeURIComponent(message)}`;

  // Default Yemen country code prefix 967 if local format (e.g. 77..., 73..., 71..., 70...)
  if (cleanDigits.startsWith('0')) {
    cleanDigits = '967' + cleanDigits.slice(1);
  } else if (!cleanDigits.startsWith('967') && !cleanDigits.startsWith('966') && !cleanDigits.startsWith('971') && cleanDigits.length === 9) {
    cleanDigits = '967' + cleanDigits;
  }

  return `https://wa.me/${cleanDigits}?text=${encodeURIComponent(message)}`;
}

/**
 * Generates initial scheduled reminders by inspecting customer invoices and active rules
 */
export function generateRemindersFromInvoices(
  invoices: Invoice[],
  customers: Customer[],
  rules: WhatsAppReminderRule[],
  companyProfile: CompanyProfile
): WhatsAppScheduledReminder[] {
  const customerInvoices = invoices.filter(
    (inv) => inv.type === 'CUSTOMER_INVOICE' && (inv.status === 'UNPAID' || inv.status === 'PARTIAL') && inv.remainingAmount > 0
  );

  const reminders: WhatsAppScheduledReminder[] = [];
  const todayStr = new Date().toISOString().split('T')[0];

  customerInvoices.forEach((inv) => {
    const cust = customers.find((c) => c.id === inv.entityId || c.nameAr === inv.entityName);
    const phone = cust?.phone || '771234567';
    const custCode = cust?.code || 'CUST-001';
    const custName = cust?.nameAr || inv.entityName;

    const daysUntilDue = calculateDaysUntilDue(inv.dueDate);

    // Match appropriate rule or create scheduled triggers
    rules.filter((r) => r.isEnabled).forEach((rule) => {
      let isApplicable = false;
      let scheduledDate = todayStr;
      let triggerLabel = rule.nameAr;
      let reminderStatus: 'SCHEDULED' | 'SENT' = 'SCHEDULED';

      // Due date calculation
      const invDueDate = new Date(inv.dueDate);
      const targetDate = new Date(invDueDate.getTime() + rule.daysOffset * 24 * 60 * 60 * 1000);
      const targetDateStr = targetDate.toISOString().split('T')[0];

      if (rule.triggerType === 'BEFORE_DUE_7_DAYS' && daysUntilDue >= 5 && daysUntilDue <= 10) {
        isApplicable = true;
        scheduledDate = targetDateStr;
      } else if (rule.triggerType === 'BEFORE_DUE_3_DAYS' && daysUntilDue >= 1 && daysUntilDue <= 4) {
        isApplicable = true;
        scheduledDate = targetDateStr;
      } else if (rule.triggerType === 'ON_DUE_DATE' && daysUntilDue === 0) {
        isApplicable = true;
        scheduledDate = inv.dueDate;
      } else if (rule.triggerType === 'OVERDUE_7_DAYS' && daysUntilDue <= -1 && daysUntilDue >= -14) {
        isApplicable = true;
        scheduledDate = todayStr;
      } else if (rule.triggerType === 'OVERDUE_15_DAYS' && daysUntilDue <= -15) {
        isApplicable = true;
        scheduledDate = todayStr;
      }

      if (isApplicable) {
        const messageText = interpolateReminderMessage(rule.defaultMessage, {
          customerName: custName,
          customerCode: custCode,
          invoiceNumber: inv.invoiceNumber,
          invoiceDate: inv.date,
          dueDate: inv.dueDate,
          remainingAmount: inv.remainingAmount,
          currency: inv.currency,
          daysUntilDue,
          companyProfile,
        });

        reminders.push({
          id: `REM-${inv.id}-${rule.id}`,
          invoiceId: inv.id,
          invoiceNumber: inv.invoiceNumber,
          customerId: cust?.id || inv.entityId,
          customerCode: custCode,
          customerName: custName,
          customerPhone: phone,
          countryCode: '+967',
          invoiceDate: inv.date,
          dueDate: inv.dueDate,
          daysUntilDue,
          totalAmount: inv.grandTotal,
          paidAmount: inv.paidAmount,
          remainingAmount: inv.remainingAmount,
          currency: inv.currency,
          ruleId: rule.id,
          triggerType: rule.triggerType,
          triggerLabel,
          scheduledDate,
          scheduledTime: rule.scheduledSendTime,
          status: reminderStatus,
          messageText,
          deliveryChannel: 'WHATSAPP_BUSINESS_API',
          responseStatus: 'PENDING',
          lastLog: `تمت الجدولة التلقائية وفق قاعدة "${rule.nameAr}"`,
        });
      }
    });
  });

  return reminders;
}
