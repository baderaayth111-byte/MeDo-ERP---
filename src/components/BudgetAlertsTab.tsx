import React, { useState } from 'react';
import { 
  Bell, 
  AlertTriangle, 
  ShieldAlert, 
  CheckCircle2, 
  Sliders, 
  Send, 
  Save, 
  MessageSquare, 
  Smartphone, 
  Mail, 
  UserCheck, 
  SlidersHorizontal,
  Flame,
  Info,
  Clock
} from 'lucide-react';
import { 
  BudgetAlertConfig, 
  BudgetAlertItem, 
  BudgetVarianceRecord, 
  BudgetScenario 
} from '../types/budgeting';
import { Currency } from '../types/accounting';
import { formatCurrency } from '../utils/formatters';
import { ADMIN_WHATSAPP_NUMBER } from '../data/userCredentials';

interface BudgetAlertsTabProps {
  alertConfig: BudgetAlertConfig;
  onSaveAlertConfig: (config: BudgetAlertConfig) => void;
  variances: BudgetVarianceRecord[];
  activeScenario: BudgetScenario;
  currency: Currency;
  rates: Record<Currency, number>;
  onTriggerNotification?: (alert: BudgetAlertItem) => void;
}

export const BudgetAlertsTab: React.FC<BudgetAlertsTabProps> = ({
  alertConfig,
  onSaveAlertConfig,
  variances,
  activeScenario,
  currency,
  rates,
  onTriggerNotification,
}) => {
  const [config, setConfig] = useState<BudgetAlertConfig>(alertConfig);
  const [isSaved, setIsSaved] = useState(false);
  const [dismissedAlerts, setDismissedAlerts] = useState<string[]>([]);
  const [sentWhatsAppAlertId, setSentWhatsAppAlertId] = useState<string | null>(null);

  // Derive active alert items from current variances
  const activeAlerts = React.useMemo(() => {
    const list: BudgetAlertItem[] = [];

    variances.forEach(v => {
      if (v.accountType === 'EXPENSE') {
        if (v.completionRate >= config.criticalThresholdPercent && config.alertOnExpenseOverrun) {
          list.push({
            id: `alt-crit-${v.accountCode}`,
            accountCode: v.accountCode,
            accountNameAr: v.accountNameAr,
            accountType: v.accountType,
            budgetAmount: v.budgetAmount,
            actualAmount: v.actualAmount,
            usagePercentage: Math.round(v.completionRate),
            severity: 'OVER_BUDGET',
            messageAr: `تم تجاوز الموازنة المعتمدة لحساب (${v.accountNameAr} - ${v.accountCode}) حيث بلغت نسبة الصرف الفعلي ${v.completionRate.toFixed(1)}% بقيمة منصرفة ${v.actualAmount.toLocaleString()} ريال مقارنة بموازنة ${v.budgetAmount.toLocaleString()} ريال.`,
            timestamp: new Date().toISOString(),
            acknowledged: dismissedAlerts.includes(`alt-crit-${v.accountCode}`),
          });
        } else if (v.completionRate >= config.warningThresholdPercent && config.alertOnExpenseOverrun) {
          list.push({
            id: `alt-warn-${v.accountCode}`,
            accountCode: v.accountCode,
            accountNameAr: v.accountNameAr,
            accountType: v.accountType,
            budgetAmount: v.budgetAmount,
            actualAmount: v.actualAmount,
            usagePercentage: Math.round(v.completionRate),
            severity: 'WARNING',
            messageAr: `اقتراب استنفاد موازنة حساب (${v.accountNameAr} - ${v.accountCode})؛ بلغت نسبة الصرف ${v.completionRate.toFixed(1)}% (تجاوزت حد التنبيه ${config.warningThresholdPercent}%).`,
            timestamp: new Date().toISOString(),
            acknowledged: dismissedAlerts.includes(`alt-warn-${v.accountCode}`),
          });
        }
      } else if (v.accountType === 'REVENUE' && config.alertOnRevenueShortfall) {
        if (v.completionRate < 60) {
          list.push({
            id: `alt-rev-${v.accountCode}`,
            accountCode: v.accountCode,
            accountNameAr: v.accountNameAr,
            accountType: v.accountType,
            budgetAmount: v.budgetAmount,
            actualAmount: v.actualAmount,
            usagePercentage: Math.round(v.completionRate),
            severity: 'WARNING',
            messageAr: `عجز في تحقيق إيرادات حساب (${v.accountNameAr} - ${v.accountCode})؛ لم يتحقق سوى ${v.completionRate.toFixed(1)}% من المستهدف التقديري حتى تاريخه.`,
            timestamp: new Date().toISOString(),
            acknowledged: dismissedAlerts.includes(`alt-rev-${v.accountCode}`),
          });
        }
      }
    });

    return list;
  }, [variances, config, dismissedAlerts]);

  const handleSave = () => {
    onSaveAlertConfig(config);
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 3000);
  };

  const handleAcknowledge = (id: string) => {
    setDismissedAlerts(prev => [...prev, id]);
  };

  // Send WhatsApp Alert Directly
  const handleSendWhatsApp = (alert: BudgetAlertItem) => {
    const text = encodeURIComponent(
      `🚨 *تنبيه رقابي عاجل للموازنة - MeDo ERP*\n` +
      `🏢 المنشأة: مجموعة المروج الدولية\n` +
      `📌 السنة المالية: ${activeScenario.fiscalYear}\n` +
      `⚠️ نوع التنبيه: ${alert.severity === 'OVER_BUDGET' ? 'تجاوز الموازنة المعتمدة' : 'اقتراب سقف الإنفاق'}\n` +
      `📊 الحساب: ${alert.accountNameAr} (${alert.accountCode})\n` +
      `💰 الموازنة المعتمدة: ${alert.budgetAmount.toLocaleString()} ريال\n` +
      `💸 المنصرف الفعلي: ${alert.actualAmount.toLocaleString()} ريال\n` +
      `📈 نسبة الاستهلاك: ${alert.usagePercentage}%\n` +
      `📝 البيان: ${alert.messageAr}\n\n` +
      `يرجى التوجيه واتخاذ الإجراءات المالية اللازمة.`
    );
    const targetPhone = config.whatsappRecipientNumber.replace(/[^0-9]/g, '') || ADMIN_WHATSAPP_NUMBER.replace(/[^0-9]/g, '');
    window.open(`https://wa.me/${targetPhone}?text=${text}`, '_blank');
    setSentWhatsAppAlertId(alert.id);
  };

  return (
    <div className="space-y-6">
      {/* Settings Panel & Controls Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Threshold Configuration Card */}
        <div className="lg:col-span-2 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <Sliders className="w-5 h-5 text-indigo-900" />
              <h3 className="text-sm font-black text-slate-900">إعدادات عتبات التنبيه الذكي للموازنة</h3>
            </div>
            <button
              onClick={handleSave}
              className="bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-black px-4 py-2 rounded-xl transition shadow flex items-center gap-1.5 cursor-pointer"
            >
              <Save className="w-4 h-4" />
              <span>{isSaved ? 'تم الحفظ بنجاح ✓' : 'حفظ الإعدادات'}</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            {/* Warning Threshold Slider */}
            <div className="p-4 bg-amber-50/60 border border-amber-200/80 rounded-2xl space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-black text-amber-950">نسبة التحذير المبكر (Warning):</span>
                <span className="font-mono font-black text-base text-amber-800 bg-white px-2.5 py-0.5 rounded-lg border border-amber-200">
                  {config.warningThresholdPercent}%
                </span>
              </div>
              <input
                type="range"
                min="50"
                max="95"
                step="5"
                value={config.warningThresholdPercent}
                onChange={(e) => setConfig({ ...config, warningThresholdPercent: parseInt(e.target.value) })}
                className="w-full accent-amber-500 cursor-pointer"
              />
              <p className="text-[11px] text-amber-800/80">
                عند وصول المصروف الفعلي إلى هذه النسبة (مثلاً 80%)، يرسل النظام إشعاراً بأن الموازنة على وشك النفاد.
              </p>
            </div>

            {/* Critical Threshold Slider */}
            <div className="p-4 bg-rose-50/60 border border-rose-200/80 rounded-2xl space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-black text-rose-950">سقف التجاوز الحرج (Critical):</span>
                <span className="font-mono font-black text-base text-rose-800 bg-white px-2.5 py-0.5 rounded-lg border border-rose-200">
                  {config.criticalThresholdPercent}%
                </span>
              </div>
              <input
                type="range"
                min="95"
                max="120"
                step="1"
                value={config.criticalThresholdPercent}
                onChange={(e) => setConfig({ ...config, criticalThresholdPercent: parseInt(e.target.value) })}
                className="w-full accent-rose-600 cursor-pointer"
              />
              <p className="text-[11px] text-rose-800/80">
                عند تجاوز المصروف الفعلي 100% من الموازنة المعتمدة، يتم تصعيد التنبيه كإنذار حرج للإدارة العليا.
              </p>
            </div>
          </div>

          {/* Trigger Triggers Checks */}
          <div className="pt-2 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <label className="flex items-center gap-2.5 p-3 bg-slate-50 border border-slate-200 rounded-xl cursor-pointer hover:bg-indigo-50/30 transition">
              <input
                type="checkbox"
                checked={config.alertOnExpenseOverrun}
                onChange={(e) => setConfig({ ...config, alertOnExpenseOverrun: e.target.checked })}
                className="w-4 h-4 accent-indigo-900 rounded"
              />
              <span className="font-bold text-slate-800">تفعيل الرقابة على تجاوز المصروفات والنثريات</span>
            </label>

            <label className="flex items-center gap-2.5 p-3 bg-slate-50 border border-slate-200 rounded-xl cursor-pointer hover:bg-indigo-50/30 transition">
              <input
                type="checkbox"
                checked={config.alertOnRevenueShortfall}
                onChange={(e) => setConfig({ ...config, alertOnRevenueShortfall: e.target.checked })}
                className="w-4 h-4 accent-indigo-900 rounded"
              />
              <span className="font-bold text-slate-800">تنبيه عجز تحقيق المبيعات والإيرادات المستهدفة</span>
            </label>
          </div>
        </div>

        {/* Notification Recipients & Channels */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
              <Bell className="w-5 h-5 text-amber-500" />
              <h3 className="text-sm font-black text-slate-900">قنوات الإشعار والمستلمون</h3>
            </div>

            <div className="space-y-3 mt-3 text-xs">
              <label className="flex items-center gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={config.notifyFinanceManager}
                  onChange={(e) => setConfig({ ...config, notifyFinanceManager: e.target.checked })}
                  className="w-4 h-4 accent-indigo-900 rounded"
                />
                <span className="font-bold text-slate-700">إشعار المدير المالي (CFO)</span>
              </label>

              <label className="flex items-center gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={config.notifyGeneralManager}
                  onChange={(e) => setConfig({ ...config, notifyGeneralManager: e.target.checked })}
                  className="w-4 h-4 accent-indigo-900 rounded"
                />
                <span className="font-bold text-slate-700">إشعار المدير العام والرئيس التنفيذي</span>
              </label>

              <label className="flex items-center gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={config.notifyViaWhatsApp}
                  onChange={(e) => setConfig({ ...config, notifyViaWhatsApp: e.target.checked })}
                  className="w-4 h-4 accent-emerald-600 rounded"
                />
                <span className="font-bold text-slate-700">إرسال تنبيه فوري عبر واتساب (WhatsApp)</span>
              </label>

              <div className="pt-2">
                <label className="block text-[11px] font-black text-slate-600 mb-1">
                  رقم هاتف استلام تنبيهات الواتساب:
                </label>
                <input
                  type="text"
                  value={config.whatsappRecipientNumber}
                  onChange={(e) => setConfig({ ...config, whatsappRecipientNumber: e.target.value })}
                  placeholder="+967 777 123456"
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-mono font-bold text-slate-900 focus:bg-white"
                />
              </div>
            </div>
          </div>

          <div className="p-3 bg-indigo-50/60 border border-indigo-200 rounded-xl text-[11px] text-indigo-900 flex items-center gap-2">
            <Info className="w-4 h-4 text-indigo-600 shrink-0" />
            <span>يتم توليد التنبيهات تلقائياً في الخلفية عند ترحيل أي قيد أو فاتورة.</span>
          </div>
        </div>
      </div>

      {/* ACTIVE REAL-TIME ALERTS CENTER */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="px-5 py-4 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-rose-400" />
            <h3 className="font-black text-sm">مركز التنبيهات الرقابية الحية للموازنة ({activeAlerts.length})</h3>
          </div>
          <span className="text-xs text-slate-300">
            تحديث حي وتلقائي مرتبط بسندات الصرف والقيود المحاسبية
          </span>
        </div>

        <div className="p-5 space-y-3">
          {activeAlerts.length === 0 ? (
            <div className="text-center py-12 space-y-2">
              <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto" />
              <div className="text-sm font-black text-slate-800">جميع الحسابات ضمن حدود الموازنة المعتمدة تماماً</div>
              <p className="text-xs text-slate-500">لم يتم رصد أي تجاوزات أو اقتراب من سقف الإنفاق حتى اللحظة.</p>
            </div>
          ) : (
            activeAlerts.map((alert) => {
              const isOver = alert.severity === 'OVER_BUDGET';
              return (
                <div
                  key={alert.id}
                  className={`p-4 rounded-2xl border transition-all flex flex-col md:flex-row items-start md:items-center justify-between gap-4 ${
                    alert.acknowledged
                      ? 'bg-slate-50 border-slate-200 opacity-60'
                      : isOver
                      ? 'bg-rose-50/70 border-rose-200 shadow-xs'
                      : 'bg-amber-50/70 border-amber-200 shadow-xs'
                  }`}
                >
                  <div className="space-y-1.5 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black ${
                        isOver ? 'bg-rose-600 text-white' : 'bg-amber-500 text-slate-950'
                      }`}>
                        {isOver ? '🚨 تجاوز سقف الموازنة' : '⚠️ اقتراب سقف الموازنة'}
                      </span>
                      <span className="font-bold text-slate-900 text-xs">
                        {alert.accountNameAr} ({alert.accountCode})
                      </span>
                      <span className="text-[11px] font-mono text-slate-500">
                        نسبة الصرف: <strong className="text-slate-900">{alert.usagePercentage}%</strong>
                      </span>
                    </div>

                    <p className="text-xs text-slate-700 leading-relaxed font-medium">
                      {alert.messageAr}
                    </p>

                    <div className="flex items-center gap-4 text-[11px] text-slate-500 font-mono pt-1">
                      <span>الموازنة: {formatCurrency(alert.budgetAmount, currency, rates)}</span>
                      <span>الفعلي: {formatCurrency(alert.actualAmount, currency, rates)}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0 self-end md:self-center">
                    <button
                      onClick={() => handleSendWhatsApp(alert)}
                      className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black px-3.5 py-2 rounded-xl transition shadow flex items-center gap-1.5 cursor-pointer"
                      title="إرسال تنبيه فوري عبر واتساب"
                    >
                      <MessageSquare className="w-4 h-4" />
                      <span>{sentWhatsAppAlertId === alert.id ? 'تم الإرسال ✓' : 'إرسال واتساب'}</span>
                    </button>

                    {!alert.acknowledged ? (
                      <button
                        onClick={() => handleAcknowledge(alert.id)}
                        className="bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 text-xs font-bold px-3 py-2 rounded-xl transition cursor-pointer"
                      >
                        إقرار واطلاع
                      </button>
                    ) : (
                      <span className="text-[11px] text-slate-400 font-bold px-2 py-1 bg-slate-200/60 rounded-lg">
                        تم الإقرار ✓
                      </span>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
