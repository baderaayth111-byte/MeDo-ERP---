export type InvoiceApprovalStatus = 
  | 'DRAFT'                  // مسودة أولية
  | 'PENDING_REVIEW'         // تحت المراجعة (بانتظار موافقة مدير القسم التشغيلية)
  | 'OPERATIONAL_APPROVED'   // تمت الموافقة التشغيلية من مدير القسم
  | 'FINANCIAL_APPROVED'     // تمت الموافقة المالية من المحاسب العام/المدير المالي
  | 'APPROVED'               // معتمدة نهائياً ومغلقة
  | 'REJECTED';              // مرفوضة

export interface InvoiceWorkflowLog {
  id: string;
  step: 'CREATION' | 'OPERATIONAL_REVIEW' | 'FINANCIAL_APPROVAL' | 'FINAL_APPROVAL' | 'REJECTION';
  actionNameAr: string;
  performedBy: string;
  performedRole: string;
  timestamp: string;
  status: 'SUCCESS' | 'REJECTED' | 'PENDING';
  notes?: string;
}

export interface InvoiceComment {
  id: string;
  authorId: string;
  authorName: string;
  authorRole: string;
  text: string;
  createdAt: string;
  isInternalOnly: boolean;
}

export type NotificationChannel = 'IN_APP' | 'EMAIL' | 'WHATSAPP' | 'TELEGRAM';

export type NotificationType = 
  | 'FINANCIAL'     // إشعارات مالية (سندات صرف/قبض، قيود، تسويات)
  | 'PROCUREMENT'   // مشتريات وتوريد (فواتير مشتريات، اعتمادات)
  | 'SALES'         // مبيعات وفواتير عملاء
  | 'SYSTEM'        // أمان، جلسات، نسخ احتياطي، صلاحيات
  | 'GENERAL';      // تعليقات وملاحظات عامة

export type NotificationPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';

export interface AppNotification {
  id: string;
  title: string;
  message: string;
  type: NotificationType;
  priority: NotificationPriority;
  timestamp: string;
  isRead: boolean;
  isArchived: boolean;
  targetModule?: string; // e.g. 'expenses-revenues' | 'accounts-receivable' | 'accounts-payable' | 'general-ledger'
  targetId?: string;     // Document ID
  actionLabel?: string;  // e.g. 'عرض الفاتورة' | 'اعتماد السند'
  sender: {
    name: string;
    role: string;
    avatar?: string;
  };
  channels: NotificationChannel[];
  whatsappUrl?: string;
  telegramUrl?: string;
  emailSent?: boolean;
  meta?: Record<string, any>;
}
