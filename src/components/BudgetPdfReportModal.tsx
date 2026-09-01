import React, { useState } from 'react';
import { 
  X, 
  Printer, 
  Download, 
  FileSpreadsheet, 
  FileText, 
  CheckCircle2, 
  AlertTriangle, 
  TrendingUp, 
  TrendingDown, 
  Scale, 
  Building, 
  Calendar, 
  UserCheck, 
  ShieldCheck, 
  Sparkles,
  Edit3,
  Sliders,
  Filter
} from 'lucide-react';
import { BudgetScenario, BudgetVarianceRecord, BudgetPeriod } from '../types/budgeting';
import { CompanyProfile, Currency } from '../types/accounting';
import { formatCurrency } from '../utils/formatters';
import { CompanyHeaderView } from './CompanyHeaderView';
import { getPeriodLabelAr, exportDetailedBudgetVarianceExcel, exportCategorySummaryBudgetExcel } from '../utils/budgetExportUtils';

interface BudgetPdfReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  scenario: BudgetScenario;
  variances: BudgetVarianceRecord[];
  companyProfile: CompanyProfile;
  period: BudgetPeriod;
  currency: Currency;
  rates: Record<Currency, number>;
}

export type ReportTemplateType = 'COMPREHENSIVE' | 'EXCEPTIONS' | 'REVENUES' | 'EXPENSES';

export const BudgetPdfReportModal: React.FC<BudgetPdfReportModalProps> = ({
  isOpen,
  onClose,
  scenario,
  variances,
  companyProfile,
  period,
  currency,
  rates,
}) => {
  const [templateType, setTemplateType] = useState<ReportTemplateType>('COMPREHENSIVE');
  const [auditorNotes, setAuditorNotes] = useState<string>(
    'بناءً على نتائج المراجعة والتدقيق المالي لفترة التقرير، يوصى بالالتزام الصارم بسقوف الإنفاق المعتمدة في بنود المصروفات الإدارية والتشغيلية، مع تعزيز قنوات المبيعات والتسويق لرفع نسبة تحقيق الإيرادات المستهدفة وتجنب أي تجاوزات غير مرخصة.'
  );
  const [isEditingNotes, setIsEditingNotes] = useState(false);
  const [includeSignatures, setIncludeSignatures] = useState(true);
  const [includeKpis, setIncludeKpis] = useState(true);

  if (!isOpen) return null;

  // Filter variances based on selected template
  const displayedVariances = variances.filter(v => {
    if (templateType === 'EXCEPTIONS') return v.isOverBudget || v.isWarning;
    if (templateType === 'REVENUES') return v.accountType === 'REVENUE';
    if (templateType === 'EXPENSES') return v.accountType === 'EXPENSE';
    return true; // COMPREHENSIVE
  });

  // Calculate totals
  const revRecords = displayedVariances.filter(v => v.accountType === 'REVENUE');
  const expRecords = displayedVariances.filter(v => v.accountType === 'EXPENSE');

  const totalBudgetRev = revRecords.reduce((sum, v) => sum + v.budgetAmount, 0);
  const totalActualRev = revRecords.reduce((sum, v) => sum + v.actualAmount, 0);
  const revVariance = totalActualRev - totalBudgetRev;
  const revRate = totalBudgetRev > 0 ? (totalActualRev / totalBudgetRev) * 100 : 0;

  const totalBudgetExp = expRecords.reduce((sum, v) => sum + v.budgetAmount, 0);
  const totalActualExp = expRecords.reduce((sum, v) => sum + v.actualAmount, 0);
  const expVariance = totalBudgetExp - totalActualExp;
  const expRate = totalBudgetExp > 0 ? (totalActualExp / totalBudgetExp) * 100 : 0;

  const netBudgetProfit = totalBudgetRev - totalBudgetExp;
  const netActualProfit = totalActualRev - totalActualExp;
  const netProfitVariance = netActualProfit - netBudgetProfit;

  const overBudgetCount = variances.filter(v => v.isOverBudget).length;
  const warningCount = variances.filter(v => v.isWarning).length;

  const handlePrint = () => {
    window.print();
  };

  const handleExcelExport = () => {
    exportDetailedBudgetVarianceExcel(scenario, displayedVariances, companyProfile, period, currency, rates);
  };

  const handleCategoryExcelExport = () => {
    exportCategorySummaryBudgetExcel(scenario, variances, companyProfile, period, currency);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 print:p-0 print:bg-white print:static">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-5xl overflow-hidden flex flex-col max-h-[92vh] print:max-h-none print:shadow-none print:border-none print:w-full">
        
        {/* Modal Toolbar (Hidden during browser printing) */}
        <div className="bg-slate-900 text-white px-6 py-4 flex flex-wrap items-center justify-between gap-4 print:hidden border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center text-white shadow-md">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-black text-white flex items-center gap-2">
                تصدير وطباعة تقرير الموازنة التقديرية والفعلية (PDF & Excel)
                <span className="text-xs bg-indigo-500/30 text-indigo-300 px-2 py-0.5 rounded-full border border-indigo-400/30">
                  SAP FMBB / S_ALR
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                تقرير رسمي مهيأ للاعتماد الإداري والتدقيق والمراجعة المحاسبية
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {/* Quick Excel Export */}
            <button
              onClick={handleExcelExport}
              className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black flex items-center gap-1.5 transition-all shadow-sm active:scale-95"
              title="تصدير جدول الفروقات إلى إكسيل"
            >
              <FileSpreadsheet className="w-4 h-4" />
              تصدير Excel تفصيلي
            </button>

            <button
              onClick={handleCategoryExcelExport}
              className="px-3.5 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-black flex items-center gap-1.5 transition-all shadow-sm active:scale-95"
              title="تصدير ملخص التصنيفات إلى إكسيل"
            >
              <FileSpreadsheet className="w-4 h-4" />
              ملخص القطاعات Excel
            </button>

            {/* Print to PDF Trigger */}
            <button
              onClick={handlePrint}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-black flex items-center gap-1.5 transition-all shadow-md active:scale-95"
            >
              <Printer className="w-4 h-4" />
              طباعة / حفظ كـ PDF
            </button>

            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-all"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Controls Bar (Hidden in Print) */}
        <div className="bg-slate-50 border-b border-slate-200 px-6 py-3 flex flex-wrap items-center justify-between gap-4 print:hidden text-xs">
          {/* Template Selector */}
          <div className="flex items-center gap-2">
            <span className="font-black text-slate-700">نموذج التقرير:</span>
            <div className="flex bg-slate-200/80 p-0.5 rounded-xl">
              <button
                onClick={() => setTemplateType('COMPREHENSIVE')}
                className={`px-3 py-1.5 rounded-lg font-black transition-all ${
                  templateType === 'COMPREHENSIVE' ? 'bg-white text-indigo-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                التقرير الشامل
              </button>
              <button
                onClick={() => setTemplateType('EXCEPTIONS')}
                className={`px-3 py-1.5 rounded-lg font-black transition-all ${
                  templateType === 'EXCEPTIONS' ? 'bg-white text-rose-800 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                التجاوزات والتحذيرات ({overBudgetCount + warningCount})
              </button>
              <button
                onClick={() => setTemplateType('REVENUES')}
                className={`px-3 py-1.5 rounded-lg font-black transition-all ${
                  templateType === 'REVENUES' ? 'bg-white text-emerald-800 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                الإيرادات فقط
              </button>
              <button
                onClick={() => setTemplateType('EXPENSES')}
                className={`px-3 py-1.5 rounded-lg font-black transition-all ${
                  templateType === 'EXPENSES' ? 'bg-white text-blue-800 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                المصروفات فقط
              </button>
            </div>
          </div>

          {/* Toggle Switches */}
          <div className="flex items-center gap-4">
            <label className="flex items-center gap-1.5 cursor-pointer font-bold text-slate-700">
              <input
                type="checkbox"
                checked={includeKpis}
                onChange={(e) => setIncludeKpis(e.target.checked)}
                className="rounded text-indigo-600 focus:ring-indigo-500 w-4 h-4"
              />
              تضمين بطاقات المؤشرات (KPIs)
            </label>

            <label className="flex items-center gap-1.5 cursor-pointer font-bold text-slate-700">
              <input
                type="checkbox"
                checked={includeSignatures}
                onChange={(e) => setIncludeSignatures(e.target.checked)}
                className="rounded text-indigo-600 focus:ring-indigo-500 w-4 h-4"
              />
              مصفوفة التوقيعات والاعتمادات
            </label>

            <button
              onClick={() => setIsEditingNotes(!isEditingNotes)}
              className="text-indigo-600 hover:text-indigo-800 font-black flex items-center gap-1 bg-indigo-50 px-2.5 py-1 rounded-lg border border-indigo-200"
            >
              <Edit3 className="w-3.5 h-3.5" />
              {isEditingNotes ? 'إنهاء تعديل التوصيات' : 'تعديل توصيات التدقيق'}
            </button>
          </div>
        </div>

        {/* Printable Document Paper Area */}
        <div className="p-6 sm:p-10 overflow-y-auto flex-1 bg-white text-slate-900 font-sans print:p-0 print:overflow-visible">
          
          {/* Official Letterhead Header */}
          <div className="border-b-2 border-slate-900 pb-5 mb-6">
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-indigo-950 text-white font-black flex items-center justify-center text-sm shadow-xs">
                    MD
                  </div>
                  <div className="space-y-0.5">
                    <CompanyHeaderView align="right" size="lg" />
                    <p className="text-xs font-semibold text-slate-600">
                      {companyProfile.nameEn}
                    </p>
                  </div>
                </div>
                <div className="mt-2 text-xs text-slate-600 space-y-0.5">
                  <p><span className="font-bold text-slate-800">النشاط:</span> {companyProfile.activityDescription || 'التجارة العامة والاستيراد والتوزيع والمقاولات'}</p>
                  <p><span className="font-bold text-slate-800">الرقم الضريبي:</span> <span className="font-mono">{companyProfile.taxNumber || '100482910'}</span> | <span className="font-bold text-slate-800">السجل التجاري:</span> <span className="font-mono">{companyProfile.commercialRegister || 'CR-849204'}</span></p>
                </div>
              </div>

              <div className="text-left">
                <div className="inline-block bg-slate-100 border border-slate-300 rounded-xl p-3 text-left">
                  <span className="text-[10px] font-black uppercase text-indigo-900 bg-indigo-100 px-2 py-0.5 rounded-md inline-block mb-1">
                    FINANCIAL AUDIT & VARIANCE REPORT
                  </span>
                  <h2 className="text-sm font-black text-slate-900">
                    تقرير التدقيق ومقارنة الموازنة التقديرية
                  </h2>
                  <p className="text-xs text-slate-700 font-bold mt-0.5">
                    السنة المالية: <span className="font-mono text-indigo-900">{scenario.fiscalYear}</span>
                  </p>
                  <p className="text-xs text-slate-600">
                    الفترة: <span className="font-bold text-slate-800">{getPeriodLabelAr(period)}</span>
                  </p>
                  <p className="text-[11px] text-slate-500 font-mono mt-1">
                    تاريخ الاستخراج: {new Date().toLocaleDateString('ar-YE')} - {new Date().toLocaleTimeString('ar-YE')}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Executive KPI Summary Grid (Optional) */}
          {includeKpis && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
              {/* Total Revenue KPI */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5">
                <div className="flex items-center justify-between text-xs text-slate-600 font-bold mb-1">
                  <span>الإيرادات والمبيعات</span>
                  <TrendingUp className="w-4 h-4 text-emerald-600" />
                </div>
                <div className="text-base font-black text-slate-900 font-mono">
                  {formatCurrency(totalActualRev, currency, rates)}
                </div>
                <div className="flex items-center justify-between text-[11px] mt-1 pt-1 border-t border-slate-200">
                  <span className="text-slate-500">الموازنة: {formatCurrency(totalBudgetRev, currency, rates)}</span>
                  <span className={`font-black font-mono ${revVariance >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>
                    {revVariance >= 0 ? '+' : ''}{revRate.toFixed(1)}%
                  </span>
                </div>
              </div>

              {/* Total Expenses KPI */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5">
                <div className="flex items-center justify-between text-xs text-slate-600 font-bold mb-1">
                  <span>المصروفات التشغيلية</span>
                  <TrendingDown className="w-4 h-4 text-rose-600" />
                </div>
                <div className="text-base font-black text-slate-900 font-mono">
                  {formatCurrency(totalActualExp, currency, rates)}
                </div>
                <div className="flex items-center justify-between text-[11px] mt-1 pt-1 border-t border-slate-200">
                  <span className="text-slate-500">الموازنة: {formatCurrency(totalBudgetExp, currency, rates)}</span>
                  <span className={`font-black font-mono ${expVariance >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>
                    صرف {expRate.toFixed(1)}%
                  </span>
                </div>
              </div>

              {/* Net Profit KPI */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5">
                <div className="flex items-center justify-between text-xs text-slate-600 font-bold mb-1">
                  <span>صافي الربح التشغيلي</span>
                  <Scale className="w-4 h-4 text-indigo-600" />
                </div>
                <div className={`text-base font-black font-mono ${netActualProfit >= 0 ? 'text-indigo-950' : 'text-rose-700'}`}>
                  {formatCurrency(netActualProfit, currency, rates)}
                </div>
                <div className="flex items-center justify-between text-[11px] mt-1 pt-1 border-t border-slate-200">
                  <span className="text-slate-500">المخطط: {formatCurrency(netBudgetProfit, currency, rates)}</span>
                  <span className={`font-black font-mono ${netProfitVariance >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>
                    {netProfitVariance >= 0 ? 'فائض +' : 'فجوة -'}
                  </span>
                </div>
              </div>

              {/* Audit Status KPI */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5">
                <div className="flex items-center justify-between text-xs text-slate-600 font-bold mb-1">
                  <span>مؤشر الالتزام الرقابي</span>
                  <ShieldCheck className="w-4 h-4 text-indigo-700" />
                </div>
                <div className="text-base font-black text-slate-900">
                  {overBudgetCount === 0 ? (
                    <span className="text-emerald-700 text-sm flex items-center gap-1">
                      <CheckCircle2 className="w-4 h-4" /> التزام تام 100%
                    </span>
                  ) : (
                    <span className="text-rose-700 text-sm flex items-center gap-1">
                      <AlertTriangle className="w-4 h-4" /> {overBudgetCount} بنود متجاوزة
                    </span>
                  )}
                </div>
                <div className="text-[11px] text-slate-500 mt-1 pt-1 border-t border-slate-200">
                  تحذيرات الاقتراب: {warningCount} حساب
                </div>
              </div>
            </div>
          )}

          {/* Audit Notes & Management Recommendations */}
          <div className="mb-6 bg-slate-50 border border-slate-300 rounded-xl p-4">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-xs font-black text-slate-900 flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-indigo-700" />
                ملاحظات وتوصيات التدقيق المالي والإدارة التنفيذية:
              </h3>
              {isEditingNotes && (
                <span className="text-[10px] text-indigo-600 font-bold">وضع التحرير المباشر</span>
              )}
            </div>
            {isEditingNotes ? (
              <textarea
                value={auditorNotes}
                onChange={(e) => setAuditorNotes(e.target.value)}
                rows={3}
                className="w-full bg-white border border-indigo-300 rounded-lg p-2.5 text-xs text-slate-900 focus:ring-2 focus:ring-indigo-500"
                placeholder="اكتب ملاحظات وتوصيات الإدارة والتدقيق هنا..."
              />
            ) : (
              <p className="text-xs text-slate-800 leading-relaxed font-medium">
                {auditorNotes || 'لا توجد ملاحظات استثنائية مسجلة.'}
              </p>
            )}
          </div>

          {/* Line-Item Variance Audit Table */}
          <div className="border border-slate-300 rounded-xl overflow-hidden mb-8">
            <table className="w-full text-right text-xs border-collapse">
              <thead>
                <tr className="bg-slate-900 text-white text-[11px] font-black border-b border-slate-800">
                  <th className="py-2.5 px-3">رمز الحساب</th>
                  <th className="py-2.5 px-3">اسم الحساب المحاسبي</th>
                  <th className="py-2.5 px-2">النوع / التصنيف</th>
                  <th className="py-2.5 px-3 text-left">الموازنة التقديرية</th>
                  <th className="py-2.5 px-3 text-left">الرصيد الفعلي</th>
                  <th className="py-2.5 px-3 text-left">فارق الانحراف</th>
                  <th className="py-2.5 px-2 text-center">نسبة الفارق</th>
                  <th className="py-2.5 px-2 text-center">نسبة الإنجاز</th>
                  <th className="py-2.5 px-3 text-center">التقييم الرقابي</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {displayedVariances.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="py-8 text-center text-slate-500 font-bold">
                      لا توجد سجلات تطابق معايير التقرير المحددة
                    </td>
                  </tr>
                ) : (
                  displayedVariances.map((v, idx) => {
                    const isRev = v.accountType === 'REVENUE';
                    const isExp = v.accountType === 'EXPENSE';

                    return (
                      <tr 
                        key={v.accountCode}
                        className={`hover:bg-slate-50 transition-colors ${
                          idx % 2 === 1 ? 'bg-slate-50/50' : 'bg-white'
                        } ${v.isOverBudget ? 'bg-rose-50/40' : ''}`}
                      >
                        <td className="py-2 px-3 font-mono font-black text-slate-800 text-[11px]">
                          {v.accountCode}
                        </td>
                        <td className="py-2 px-3 font-bold text-slate-900">
                          {v.accountNameAr}
                        </td>
                        <td className="py-2 px-2 text-[10px] text-slate-600">
                          {isRev ? 'إيراد' : isExp ? 'مصروف' : 'أصل'} - {v.category}
                        </td>
                        <td className="py-2 px-3 text-left font-mono font-bold text-slate-700">
                          {formatCurrency(v.budgetAmount, currency, rates)}
                        </td>
                        <td className="py-2 px-3 text-left font-mono font-black text-slate-900">
                          {formatCurrency(v.actualAmount, currency, rates)}
                        </td>
                        <td className={`py-2 px-3 text-left font-mono font-black ${
                          v.isFavorable ? 'text-emerald-700' : 'text-rose-700'
                        }`}>
                          {v.isFavorable ? '+' : ''}{formatCurrency(v.varianceAmount, currency, rates)}
                        </td>
                        <td className={`py-2 px-2 text-center font-mono font-bold ${
                          v.isFavorable ? 'text-emerald-700' : 'text-rose-700'
                        }`}>
                          {v.variancePercentage > 0 ? `+${v.variancePercentage.toFixed(1)}%` : `${v.variancePercentage.toFixed(1)}%`}
                        </td>
                        <td className="py-2 px-2 text-center font-mono font-black text-slate-800">
                          {v.completionRate.toFixed(1)}%
                        </td>
                        <td className="py-2 px-3 text-center">
                          <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-black border ${v.statusColor}`}>
                            {v.statusLabelAr}
                          </span>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
              {/* Summary Totals Footer */}
              <tfoot>
                <tr className="bg-slate-100 font-black text-slate-900 border-t-2 border-slate-900 text-xs">
                  <td colSpan={3} className="py-3 px-3 text-right">
                    إجمالي بنود التقرير المفحوصة ({displayedVariances.length} حساب)
                  </td>
                  <td className="py-3 px-3 text-left font-mono text-slate-800">
                    {formatCurrency(
                      displayedVariances.reduce((s, v) => s + v.budgetAmount, 0),
                      currency,
                      rates
                    )}
                  </td>
                  <td className="py-3 px-3 text-left font-mono text-slate-950">
                    {formatCurrency(
                      displayedVariances.reduce((s, v) => s + v.actualAmount, 0),
                      currency,
                      rates
                    )}
                  </td>
                  <td className="py-3 px-3 text-left font-mono text-indigo-950">
                    {formatCurrency(
                      displayedVariances.reduce((s, v) => s + (v.accountType === 'REVENUE' ? v.actualAmount - v.budgetAmount : v.budgetAmount - v.actualAmount), 0),
                      currency,
                      rates
                    )}
                  </td>
                  <td colSpan={3} className="py-3 px-3 text-center text-[11px] text-slate-600">
                    تم التدقيق والمطابقة إلكترونياً
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>

          {/* Official Signatures Section */}
          {includeSignatures && (
            <div className="grid grid-cols-3 gap-6 pt-6 border-t-2 border-slate-300 text-center text-xs text-slate-800 break-inside-avoid">
              <div>
                <p className="font-black text-slate-900">إعداد وتدقيق محاسب الموازنة:</p>
                <p className="text-[10px] text-slate-500 mt-0.5">Budget & Cost Accountant</p>
                <div className="h-16 flex items-center justify-center text-slate-400 italic text-[11px]">
                  [التوقيع والختم]
                </div>
                <p className="border-t border-slate-400 pt-1 font-bold">أ / محمد رضوان الأهدل</p>
              </div>

              <div>
                <p className="font-black text-slate-900">مراجعة واعتماد المدير المالي:</p>
                <p className="text-[10px] text-slate-500 mt-0.5">Chief Financial Officer (CFO)</p>
                <div className="h-16 flex items-center justify-center text-slate-400 italic text-[11px]">
                  [التوقيع والختم]
                </div>
                <p className="border-t border-slate-400 pt-1 font-bold">د / خالد العمري</p>
              </div>

              <div>
                <p className="font-black text-slate-900">مصادقة المدير العام والرئيس التنفيذي:</p>
                <p className="text-[10px] text-slate-500 mt-0.5">Chief Executive Officer (CEO)</p>
                <div className="h-16 flex items-center justify-center text-slate-400 italic text-[11px]">
                  [الاعتماد النهائي]
                </div>
                <p className="border-t border-slate-400 pt-1 font-bold">ميدو تك للحلول البرمجية</p>
              </div>
            </div>
          )}

          {/* Legal / Audit Footer */}
          <div className="mt-8 pt-4 border-t border-slate-200 flex items-center justify-between text-[10px] text-slate-500">
            <span>نظام MeDo ERP المحاسبي - وحدة الموازنات التقديرية والرقابة المالية (FMBB)</span>
            <span>وثيقة رسمية صادرة آلياً - سرية للغاية ومخصصة لأغراض الإدارة والتدقيق الداخلي</span>
          </div>

        </div>
      </div>
    </div>
  );
};
