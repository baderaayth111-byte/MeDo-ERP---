import { AppNotification, NotificationType, NotificationPriority } from '../types/workflow';
import { loadFromStorage, saveToStorage } from './persistence';
import { ADMIN_WHATSAPP_NUMBER } from './userCredentials';

export const STORAGE_KEYS_NOTIFICATIONS = {
  NOTIFICATIONS: 'medo_erp_internal_notifications_v1',
};

export const INITIAL_NOTIFICATIONS: AppNotification[] = [
  {
    id: 'NOTIF-001',
    title: 'طلب اعتماد سند صرف جديد (PV-2026-00102)',
    message: 'قام المحاسب ميدو تك للحلول البرمجية بإنشاء سند صرف بمبلغ 1,250,000 ر.ي لصالح شركة سبأ تك للاتصالات (صيانة ونظم معلومات). بانتظار اعتماد المدير المالي.',
    type: 'FINANCIAL',
    priority: 'HIGH',
    timestamp: '2026-08-29T07:40:00Z',
    isRead: false,
    isArchived: false,
    targetModule: 'expenses-revenues',
    targetId: 'VOUCHER-002',
    actionLabel: 'مراجعة واعتماد السند',
    sender: {
      name: 'ميدو تك للحلول البرمجية',
      role: 'محاسب الخزينة والصرف',
    },
    channels: ['IN_APP', 'EMAIL', 'WHATSAPP', 'TELEGRAM'],
    whatsappUrl: `https://wa.me/${ADMIN_WHATSAPP_NUMBER}?text=${encodeURIComponent('🔴 *تنبيه MeDo ERP - طلب اعتماد سند صرف*\nرقم السند: PV-2026-00102\nالمستفيد: شركة سبأ تك\nالمبلغ: 1,250,000 ريال يمني\nالمنشئ: ميدو تك للحلول البرمجية\nالحالة: بانتظار موافقة المدير المالي.')}`,
  },
  {
    id: 'NOTIF-002',
    title: 'فاتورة مبيعات بانتظار الموافقة التشغيلية (INV-2026-0089)',
    message: 'تم إصدار مسودة فاتورة مبيعات لصالح شركة موانئ خليج عدن بمبلغ 15,225,000 ر.ي. يرجى مراجعة الكميات والأسعار من قبل مدير المبيعات.',
    type: 'SALES',
    priority: 'HIGH',
    timestamp: '2026-08-29T07:15:00Z',
    isRead: false,
    isArchived: false,
    targetModule: 'accounts-receivable',
    targetId: 'INV-2026-0089',
    actionLabel: 'الموافقة التشغيلية',
    sender: {
      name: 'سامي الشرجبي',
      role: 'مندوب ومسؤول مبيعات',
    },
    channels: ['IN_APP', 'EMAIL', 'WHATSAPP'],
    whatsappUrl: `https://wa.me/${ADMIN_WHATSAPP_NUMBER}?text=${encodeURIComponent('📑 *تنبيه MeDo ERP - اعتماد فاتورة مبيعات*\nرقم الفاتورة: INV-2026-0089\nالعميل: شركة موانئ خليج عدن\nالمبلغ: 15,225,000 ريال يمني\nالمطلوب: الموافقة التشغيلية لمدير القسم.')}`,
  },
  {
    id: 'NOTIF-003',
    title: 'طلب اعتماد سند صرف نقدي (PV-2026-00103)',
    message: 'طلب صرف نقدي عاجل بمبلغ 850,000 ر.ي لوكالة يمن ميديا للدعاية والإعلان (طباعة بروشورات وبانرات).',
    type: 'FINANCIAL',
    priority: 'MEDIUM',
    timestamp: '2026-08-28T16:05:00Z',
    isRead: false,
    isArchived: false,
    targetModule: 'expenses-revenues',
    targetId: 'VOUCHER-004',
    actionLabel: 'اعتماد الصرف النقدي',
    sender: {
      name: 'ميدو تك للحلول البرمجية',
      role: 'محاسب الخزينة',
    },
    channels: ['IN_APP', 'WHATSAPP'],
    whatsappUrl: `https://wa.me/${ADMIN_WHATSAPP_NUMBER}?text=${encodeURIComponent('💵 *تنبيه MeDo ERP - طلب صرف نقدي*\nرقم السند: PV-2026-00103\nالمستفيد: وكالة يمن ميديا\nالمبلغ: 850,000 ريال يمني\nالخزينة: الصندوق الرئيسي')}`,
  },
  {
    id: 'NOTIF-004',
    title: 'فاتورة توريد بانتظار التدقيق المالي (BILL-2026-0045)',
    message: 'تمت الموافقة التشغيلية على فاتورة المورد شركة الأفق الدولية (8,925,000 ر.ي)، بانتظار الاعتماد المالي النهائي والترحيل المحاسبي.',
    type: 'PROCUREMENT',
    priority: 'HIGH',
    timestamp: '2026-08-28T11:30:00Z',
    isRead: true,
    isArchived: false,
    targetModule: 'accounts-payable',
    targetId: 'BILL-2026-0045',
    actionLabel: 'التدقيق المالي',
    sender: {
      name: 'م / وليد الصنعاني',
      role: 'مدير المشتريات والمخازن',
    },
    channels: ['IN_APP', 'EMAIL'],
  },
  {
    id: 'NOTIF-005',
    title: 'تم اعتماد وترحيل سند الصرف رقم PV-2026-00101',
    message: 'قام المدير المالي أحمد الماوري باعتماد سند صرف إيجار برج الأعمال (3,500,000 ر.ي) وترحيله تلقائياً للأستاذ العام برقم القيد JV-EXP-001.',
    type: 'FINANCIAL',
    priority: 'LOW',
    timestamp: '2026-08-25T11:16:00Z',
    isRead: true,
    isArchived: false,
    targetModule: 'expenses-revenues',
    targetId: 'VOUCHER-001',
    actionLabel: 'عرض القيد المحاسبي',
    sender: {
      name: 'أحمد الماوري',
      role: 'المدير المالي (CFO)',
    },
    channels: ['IN_APP', 'EMAIL'],
  },
  {
    id: 'NOTIF-006',
    title: 'ملاحظة وتوجيه داخلي على سند الصرف رقم PV-2026-00102',
    message: 'ترك المدير المالي تعليقاً: "يرجى إرفاق الفاتورة الضريبية الأصلية المعتمدة من شركة سبأ تك قبل توقيع الشيك النهائي".',
    type: 'GENERAL',
    priority: 'MEDIUM',
    timestamp: '2026-08-27T14:30:00Z',
    isRead: true,
    isArchived: false,
    targetModule: 'expenses-revenues',
    targetId: 'VOUCHER-002',
    actionLabel: 'عرض الملاحظات',
    sender: {
      name: 'أحمد الماوري',
      role: 'المدير المالي',
    },
    channels: ['IN_APP'],
  },
  {
    id: 'NOTIF-007',
    title: 'تنبيه أمان: تسجيل دخول جديد لحساب مدير النظام',
    message: 'تم تسجيل دخول ناجح لحساب مدير النظام من المتصفح Chrome بنظام Windows من العنوان الداخلي 192.168.1.10.',
    type: 'SYSTEM',
    priority: 'LOW',
    timestamp: '2026-08-29T07:00:00Z',
    isRead: true,
    isArchived: false,
    targetModule: 'role-management',
    actionLabel: 'سجل الأمان والتدقيق',
    sender: {
      name: 'نظام الحماية والأمان MeDo Shield',
      role: 'Security Engine',
    },
    channels: ['IN_APP', 'WHATSAPP'],
  }
];

export const getLoadedNotifications = (): AppNotification[] => 
  loadFromStorage(STORAGE_KEYS_NOTIFICATIONS.NOTIFICATIONS, INITIAL_NOTIFICATIONS);

export const saveNotifications = (data: AppNotification[]) => 
  saveToStorage(STORAGE_KEYS_NOTIFICATIONS.NOTIFICATIONS, data);

export const createNotificationUrl = (messageText: string): string => {
  return `https://wa.me/${ADMIN_WHATSAPP_NUMBER}?text=${encodeURIComponent(messageText)}`;
};
