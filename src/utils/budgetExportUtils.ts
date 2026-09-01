import { BudgetScenario, BudgetVarianceRecord, BudgetPeriod } from '../types/budgeting';
import { CompanyProfile, Currency } from '../types/accounting';
import { formatCurrency } from './formatters';

export function getPeriodLabelAr(period: BudgetPeriod): string {
  switch (period) {
    case 'FULL_YEAR':
      return 'كامل السنة المالية (YTD)';
    case 'Q1':
      return 'الربع الأول (Q1: يناير - مارس)';
    case 'Q2':
      return 'الربع الثاني (Q2: أبريل - يونيو)';
    case 'Q3':
      return 'الربع الثالث (Q3: يوليو - سبتمبر)';
    case 'Q4':
      return 'الربع الرابع (Q4: أكتوبر - ديسمبر)';
    case 'M01': return 'شهر يناير (M01)';
    case 'M02': return 'شهر فبراير (M02)';
    case 'M03': return 'شهر مارس (M03)';
    case 'M04': return 'شهر أبريل (M04)';
    case 'M05': return 'شهر مايو (M05)';
    case 'M06': return 'شهر يونيو (M06)';
    case 'M07': return 'شهر يوليو (M07)';
    case 'M08': return 'شهر أغسطس (M08)';
    case 'M09': return 'شهر سبتمبر (M09)';
    case 'M10': return 'شهر أكتوبر (M10)';
    case 'M11': return 'شهر نوفمبر (M11)';
    case 'M12': return 'شهر ديسمبر (M12)';
    default:
      return period;
  }
}

/**
 * Generates and downloads a rich, multi-section CSV/Excel spreadsheet for detailed variance auditing.
 */
export function exportDetailedBudgetVarianceExcel(
  scenario: BudgetScenario,
  variances: BudgetVarianceRecord[],
  companyProfile: CompanyProfile,
  period: BudgetPeriod,
  currency: Currency,
  rates: Record<Currency, number>
) {
  const periodLabel = getPeriodLabelAr(period);
  const now = new Date();
  const printDate = now.toLocaleDateString('ar-YE') + ' ' + now.toLocaleTimeString('ar-YE');

  // Calculate Summary Totals
  const revRecords = variances.filter(v => v.accountType === 'REVENUE');
  const expRecords = variances.filter(v => v.accountType === 'EXPENSE');
  const assetRecords = variances.filter(v => v.accountType === 'ASSET');

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

  // Build CSV Rows with Metadata Header
  const lines: string[] = [
    `"تقرير مقارنة الموازنة التقديرية بالأداء الفعلي (Actual vs. Budget Variance Report)"`,
    `"اسم المنشأة:","${companyProfile.nameAr}","الرقم الضريبي:","${companyProfile.taxNumber || 'N/A'}"`,
    `"السنة المالية:","${scenario.fiscalYear}","خطة الموازنة:","${scenario.nameAr} (${scenario.code})"`,
    `"فترة التقرير:","${periodLabel}","تاريخ ووقت الاستخراج:","${printDate}"`,
    `"العملة الأساسية:","${currency}","عدد الحسابات المفحوصة:","${variances.length}"`,
    `""`,
    `"=== الملخص التنفيذي للموازنة والأداء المالي ==="`,
    `"البيان","الموازنة التقديرية (${currency})","الرصيد الفعلي (${currency})","فارق الانحراف (${currency})","نسبة التحقيق / الاستهلاك %","تقييم الأداء"`,
    `"إجمالي الإيرادات والمبيعات",${totalBudgetRev},${totalActualRev},${revVariance},"${revRate.toFixed(2)}%","${revVariance >= 0 ? 'فائض إيجابي' : 'عجز في المستهدف'}"`,
    `"إجمالي المصروفات التشغيلية",${totalBudgetExp},${totalActualExp},${expVariance},"${expRate.toFixed(2)}%","${expVariance >= 0 ? 'وفر في التكاليف' : 'تجاوز في المصروفات'}"`,
    `"صافي الأرباح التشغيلية",${netBudgetProfit},${netActualProfit},${netProfitVariance},"${totalBudgetRev > 0 ? ((netActualProfit / netBudgetProfit) * 100).toFixed(2) : 0}%","${netProfitVariance >= 0 ? 'أداء ممتاز يتجاوز الخطة' : 'فجوة في الربح المستهدف'}"`,
    `""`,
    `"=== تفاصيل الحسابات المحاسبية ومؤشرات الانحراف ==="`,
    [
      `"رمز الحساب"`,
      `"اسم الحساب (عربي)"`,
      `"اسم الحساب (إنجليزي)"`,
      `"النوع المحاسبي"`,
      `"التصنيف الرئيسي"`,
      `"الموازنة التقديرية"`,
      `"الرصيد الفعلي"`,
      `"قيمة الفارق (Variance)"`,
      `"نسبة الفارق %"`,
      `"نسبة الإنجاز / الاستهلاك %"`,
      `"الأثر المالي"`,
      `"حالة الرقابة والالتزام"`,
      `"ملاحظات التدقيق المالي"`
    ].join(',')
  ];

  variances.forEach(v => {
    const isRev = v.accountType === 'REVENUE';
    const isExp = v.accountType === 'EXPENSE';
    const typeLabel = isRev ? 'إيراد' : isExp ? 'مصروف' : 'أصل / أخرى';
    const impactLabel = v.isFavorable ? 'إيجابي (مفضل)' : 'سلبي (غير مفضل)';
    const auditNote = v.isOverBudget
      ? 'تجاوز سقف الموازنة المعتمد - يتطلب توضيح وموافقة استثنائية'
      : v.isWarning
      ? 'اقتراب من سقف الإنفاق - يوصى بالترشيد'
      : 'ضمن الحدود التقديرية المعتمدة';

    lines.push([
      `"${v.accountCode}"`,
      `"${v.accountNameAr.replace(/"/g, '""')}"`,
      `"${(v.accountNameEn || '').replace(/"/g, '""')}"`,
      `"${typeLabel}"`,
      `"${v.category.replace(/"/g, '""')}"`,
      v.budgetAmount,
      v.actualAmount,
      v.varianceAmount,
      `"${v.variancePercentage.toFixed(2)}%"`,
      `"${v.completionRate.toFixed(2)}%"`,
      `"${impactLabel}"`,
      `"${v.statusLabelAr}"`,
      `"${auditNote}"`
    ].join(','));
  });

  // End of file signatures block in CSV
  lines.push(`""`);
  lines.push(`"=== اعتمادات التدقيق والرقابة المالية ==="`);
  lines.push(`"إعداد وتدقيق المحاسب:","أ / محمد رضوان الأهدل","مراجعة المدير المالي (CFO):","د / خالد العمري","مصادقة المدير العام / الرئيس التنفيذي:","ميدو تك للحلول البرمجية"`);

  const csvContent = '\uFEFF' + lines.join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `Budget_Variance_Detailed_${scenario.fiscalYear}_${period}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

/**
 * Generates and downloads an Executive Category Summary Excel report.
 */
export function exportCategorySummaryBudgetExcel(
  scenario: BudgetScenario,
  variances: BudgetVarianceRecord[],
  companyProfile: CompanyProfile,
  period: BudgetPeriod,
  currency: Currency
) {
  const periodLabel = getPeriodLabelAr(period);
  const now = new Date();
  const printDate = now.toLocaleDateString('ar-YE');

  // Group by category
  const categoriesMap = new Map<string, {
    category: string;
    type: string;
    count: number;
    budgetTotal: number;
    actualTotal: number;
  }>();

  variances.forEach(v => {
    const key = `${v.accountType}_${v.category}`;
    if (!categoriesMap.has(key)) {
      categoriesMap.set(key, {
        category: v.category,
        type: v.accountType === 'REVENUE' ? 'إيرادات' : v.accountType === 'EXPENSE' ? 'مصروفات' : 'أصول ورأسمالية',
        count: 0,
        budgetTotal: 0,
        actualTotal: 0,
      });
    }
    const cat = categoriesMap.get(key)!;
    cat.count += 1;
    cat.budgetTotal += v.budgetAmount;
    cat.actualTotal += v.actualAmount;
  });

  const lines: string[] = [
    `"ملخص انحرافات الموازنة التقديرية حسب التصنيفات والقطاعات (Executive Category Variance)"`,
    `"اسم المنشأة:","${companyProfile.nameAr}","السنة المالية:","${scenario.fiscalYear}"`,
    `"فترة التقرير:","${periodLabel}","تاريخ التقرير:","${printDate}"`,
    `""`,
    [
      `"التصنيف المحاسبي"`,
      `"النوع"`,
      `"عدد الحسابات"`,
      `"إجمالي الموازنة (${currency})"`,
      `"إجمالي الفعلي (${currency})"`,
      `"الفارق المحاسبي (${currency})"`,
      `"نسبة الإنجاز / الصرف %"`,
      `"التقييم الرقابي"`
    ].join(',')
  ];

  Array.from(categoriesMap.values()).forEach(cat => {
    const variance = cat.type === 'إيرادات'
      ? cat.actualTotal - cat.budgetTotal
      : cat.budgetTotal - cat.actualTotal;
    const rate = cat.budgetTotal > 0 ? (cat.actualTotal / cat.budgetTotal) * 100 : 0;
    const evalStatus = cat.type === 'إيرادات'
      ? rate >= 90 ? 'مستهدف محقق بنجاح' : 'دون المستهدف المخطط'
      : rate > 100 ? 'تجاوز سقف النفقات' : rate >= 80 ? 'اقتراب من الحد الأقصى' : 'وفر متحقق';

    lines.push([
      `"${cat.category.replace(/"/g, '""')}"`,
      `"${cat.type}"`,
      cat.count,
      cat.budgetTotal,
      cat.actualTotal,
      variance,
      `"${rate.toFixed(2)}%"`,
      `"${evalStatus}"`
    ].join(','));
  });

  const csvContent = '\uFEFF' + lines.join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `Budget_Category_Summary_${scenario.fiscalYear}_${period}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
