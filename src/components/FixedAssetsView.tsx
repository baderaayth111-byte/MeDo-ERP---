import React, { useState } from 'react';
import { 
  Building, 
  Plus, 
  RotateCw, 
  Calendar, 
  Layers, 
  CheckCircle2, 
  X,
  FileText,
  Paperclip
} from 'lucide-react';
import { FixedAsset, AssetCategory, DepreciationMethod, Currency, CostCenter, JournalEntry } from '../types/accounting';
import { formatCurrency, convertAmount, exportToCsv } from '../utils/formatters';
import { DocumentArchiver } from './DocumentArchiver';

interface FixedAssetsViewProps {
  fixedAssets: FixedAsset[];
  costCenters: CostCenter[];
  onAddFixedAsset: (asset: FixedAsset) => void;
  onRunDepreciation: (journalEntry: JournalEntry, updatedAssets: FixedAsset[]) => void;
  currency: Currency;
  rates: Record<Currency, number>;
}

export const FixedAssetsView: React.FC<FixedAssetsViewProps> = ({
  fixedAssets,
  costCenters,
  onAddFixedAsset,
  onRunDepreciation,
  currency,
  rates,
}) => {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<AssetCategory | 'ALL'>('ALL');
  const [isDepreciationRunning, setIsDepreciationRunning] = useState(false);

  // New Asset form
  const [nameAr, setNameAr] = useState('');
  const [nameEn, setNameEn] = useState('');
  const [category, setCategory] = useState<AssetCategory>('MACHINERY');
  const [purchaseDate, setPurchaseDate] = useState(new Date().toISOString().split('T')[0]);
  const [purchaseCost, setPurchaseCost] = useState<number>(0);
  const [salvageValue, setSalvageValue] = useState<number>(0);
  const [usefulLifeMonths, setUsefulLifeMonths] = useState<number>(60);
  const [depreciationMethod, setDepreciationMethod] = useState<DepreciationMethod>('STRAIGHT_LINE');
  const [costCenterId, setCostCenterId] = useState(costCenters[0]?.id || 'CC-100');
  const [attachments, setAttachments] = useState<string[]>([]);
  const [viewingAsset, setViewingAsset] = useState<FixedAsset | null>(null);

  const totalCostYER = fixedAssets.reduce((sum, a) => sum + a.purchaseCost, 0);
  const totalAccumulatedDepreciationYER = fixedAssets.reduce((sum, a) => sum + a.accumulatedDepreciation, 0);
  const totalNetBookValueYER = totalCostYER - totalAccumulatedDepreciationYER;

  const handleAddAsset = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nameAr || purchaseCost <= 0) {
      alert('يرجى كتابة اسم الأصل وتكلفة الشراء.');
      return;
    }

    const newAsset: FixedAsset = {
      id: `FA-${Date.now().toString().slice(-4)}`,
      assetCode: `AST-${category.slice(0, 3)}-0${fixedAssets.length + 1}`,
      nameAr,
      nameEn: nameEn || nameAr,
      category,
      purchaseDate,
      purchaseCost,
      salvageValue,
      usefulLifeMonths,
      depreciationMethod,
      accumulatedDepreciation: 0,
      bookValue: purchaseCost,
      costCenterId,
      assetAccountCode: category === 'BUILDINGS' ? '1210' : category === 'VEHICLES' ? '1230' : '1220',
      depreciationExpenseAccountCode: '5400',
      accumulatedDepreciationAccountCode: '1290',
      status: 'ACTIVE',
      lastDepreciationDate: purchaseDate,
      attachments: attachments
    };

    onAddFixedAsset(newAsset);
    setIsAddModalOpen(false);
    // Reset
    setNameAr('');
    setNameEn('');
    setPurchaseCost(0);
    setSalvageValue(0);
    setAttachments([]);
    alert(`تم إضافة الأصل الثابت (${newAsset.nameAr}) إلى سجل الأصول بنجاح!`);
  };


  // Run Monthly Depreciation (SAP AFAB)
  const handleExecuteDepreciationRun = () => {
    setIsDepreciationRunning(true);
    let totalMonthlyDepreciation = 0;

    const updatedAssets = fixedAssets.map((asset) => {
      if (asset.status !== 'ACTIVE') return asset;
      const depreciableBase = Math.max(0, asset.purchaseCost - asset.salvageValue);
      const monthlyAmount = depreciableBase / (asset.usefulLifeMonths || 60);

      const newAccumulated = Math.min(asset.purchaseCost - asset.salvageValue, asset.accumulatedDepreciation + monthlyAmount);
      const newBookValue = Math.max(asset.salvageValue, asset.purchaseCost - newAccumulated);
      totalMonthlyDepreciation += monthlyAmount;

      return {
        ...asset,
        accumulatedDepreciation: newAccumulated,
        bookValue: newBookValue,
        lastDepreciationDate: new Date().toISOString().split('T')[0],
      };
    });

    // Create automatic Journal Entry for depreciation
    const depJournalEntry: JournalEntry = {
      id: `JE-DEP-${Date.now().toString().slice(-4)}`,
      entryNumber: `JV-DEP-2026-0${Date.now().toString().slice(-3)}`,
      date: new Date().toISOString().split('T')[0],
      reference: 'AFAB-DEP-RUN-2026-08',
      description: 'قيد إثبات قسط استهلاك الأصول الثابتة الشهري الدوري (Depreciation Run AFAB)',
      status: 'POSTED',
      createdBy: 'نظام إدارة الأصول الآلي SAP AFAB',
      postedAt: new Date().toLocaleString('ar-YE'),
      totalDebit: totalMonthlyDepreciation,
      totalCredit: totalMonthlyDepreciation,
      lines: [
        {
          id: 'D-1',
          accountCode: '5400',
          accountName: 'مصروفات استهلاك الأصول الثابتة',
          debit: totalMonthlyDepreciation,
          credit: 0,
          currency: 'YER',
          exchangeRate: 1,
          amountInBase: totalMonthlyDepreciation,
          description: 'قسط الاستهلاك الشهري للأصول الثابتة',
        },
        {
          id: 'D-2',
          accountCode: '1290',
          accountName: 'مجمع الإهلاك المتراكم للأصول',
          debit: 0,
          credit: totalMonthlyDepreciation,
          currency: 'YER',
          exchangeRate: 1,
          amountInBase: totalMonthlyDepreciation,
          description: 'إضافة لمجمع إهلاك الأصول',
        },
      ],
    };

    setTimeout(() => {
      onRunDepreciation(depJournalEntry, updatedAssets);
      setIsDepreciationRunning(false);
      alert(`تم تنفيذ دورة الإهلاك الشهرية بنجاح! تم احتساب إهلاك بمبلغ ${formatCurrency(totalMonthlyDepreciation, 'YER')} وترحيل القيد رقم ${depJournalEntry.entryNumber} للأستاذ العام.`);
    }, 600);
  };

  const getCategoryLabel = (cat: AssetCategory) => {
    switch (cat) {
      case 'BUILDINGS': return 'مباني وعقارات';
      case 'MACHINERY': return 'آلات ومعدات';
      case 'VEHICLES': return 'سيارات ووسائل نقل';
      case 'IT_EQUIPMENT': return 'خوادم وأجهزة حاسوب';
      case 'FURNITURE': return 'أثاث وتجهيزات مكتبية';
    }
  };

  const filteredAssets = selectedCategory === 'ALL'
    ? fixedAssets
    : fixedAssets.filter(a => a.category === selectedCategory);

  return (
    <div className="space-y-6">
      {/* Top Header & Actions */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white border border-slate-200 p-5 rounded-xl shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <span className="bg-purple-50 text-purple-700 text-xs px-2.5 py-0.5 rounded-md font-mono font-bold border border-purple-200">
              SAP T-Code: AS01 / AFAB
            </span>
            <h2 className="text-lg sm:text-xl font-bold text-slate-800">محاسبة الأصول الثابتة والإهلاك (Fixed Assets - AA)</h2>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            سجل دورة حياة الأصول، حساب الإهلاك، والترحيل الآلي لقيود الاستهلاك الشهري للأستاذ العام.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* 1-Click Depreciation Run Button */}
          <button
            onClick={handleExecuteDepreciationRun}
            disabled={isDepreciationRunning}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white text-xs font-bold shadow-xs transition"
          >
            <RotateCw className={`w-3.5 h-3.5 ${isDepreciationRunning ? 'animate-spin' : ''}`} />
            <span>تشغيل دورة الإهلاك الشهرية (AFAB)</span>
          </button>

          <button
            onClick={() => setIsAddModalOpen(true)}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-xs transition"
          >
            <Plus className="w-4 h-4" />
            <span>إضافة أصل جديد</span>
          </button>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white border border-slate-200 p-4 rounded-xl shadow-xs">
          <span className="text-xs text-slate-500 font-semibold block">إجمالي التكلفة التاريخية للأصول</span>
          <div className="text-lg font-bold text-slate-800 mt-1 font-mono">
            {formatCurrency(totalCostYER, currency)}
          </div>
        </div>
        <div className="bg-white border border-slate-200 p-4 rounded-xl shadow-xs">
          <span className="text-xs text-slate-500 font-semibold block">مجمع الإهلاك المتراكم</span>
          <div className="text-lg font-bold text-rose-600 mt-1 font-mono">
            {formatCurrency(totalAccumulatedDepreciationYER, currency)}
          </div>
        </div>
        <div className="bg-white border border-slate-200 p-4 rounded-xl shadow-xs">
          <span className="text-xs text-slate-500 font-semibold block">صافي القيمة الدفترية الحالية (Net Book Value)</span>
          <div className="text-lg font-bold text-emerald-600 mt-1 font-mono">
            {formatCurrency(totalNetBookValueYER, currency)}
          </div>
        </div>
      </div>

      {/* Categories Filter */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
        {(['ALL', 'BUILDINGS', 'MACHINERY', 'VEHICLES', 'IT_EQUIPMENT', 'FURNITURE'] as const).map((cat) => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition whitespace-nowrap ${
              selectedCategory === cat
                ? 'bg-blue-600 text-white shadow-xs'
                : 'bg-white border border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            {cat === 'ALL' ? 'جميع الأصول' : getCategoryLabel(cat)}
          </button>
        ))}
      </div>

      {/* Assets Register Table */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-right text-xs">
            <thead className="bg-slate-50 text-slate-700 border-b border-slate-200 font-semibold">
              <tr>
                <th className="p-3">رمز الأصل</th>
                <th className="p-3">اسم وتوصيف الأصل</th>
                <th className="p-3">التصنيف</th>
                <th className="p-3">تاريخ الشراء</th>
                <th className="p-3 text-left">تكلفة الشراء</th>
                <th className="p-3 text-left">مجمع الإهلاك</th>
                <th className="p-3 text-left">القيمة الدفترية</th>
                <th className="p-3 text-center">طريقة الإهلاك</th>
                <th className="p-3 text-center">آخر إهلاك</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredAssets.map((asset) => (
                <tr key={asset.id} className="hover:bg-slate-50/80 transition">
                  <td className="p-3 font-mono font-bold text-purple-700">{asset.assetCode}</td>
                  <td className="p-3">
                    <div className="font-semibold text-slate-800">{asset.nameAr}</div>
                    <div className="text-[10px] text-slate-400 font-sans">{asset.nameEn}</div>
                  </td>
                  <td className="p-3 text-slate-600">{getCategoryLabel(asset.category)}</td>
                  <td className="p-3 text-slate-500">{asset.purchaseDate}</td>
                  <td className="p-3 text-left font-mono font-bold text-slate-800">
                    {formatCurrency(asset.purchaseCost, currency)}
                  </td>
                  <td className="p-3 text-left font-mono font-bold text-rose-600">
                    {formatCurrency(asset.accumulatedDepreciation, currency)}
                  </td>
                  <td className="p-3 text-left font-mono font-bold text-emerald-600">
                    {formatCurrency(asset.bookValue, currency)}
                  </td>
                  <td className="p-3 text-center">
                    <span className="bg-slate-100 text-slate-700 border border-slate-200 px-2 py-0.5 rounded text-[10px] font-semibold">
                      {asset.depreciationMethod === 'STRAIGHT_LINE' ? 'قسط ثابت' : 'قسط متناقص'} ({asset.usefulLifeMonths / 12} سنوات)
                    </span>
                  </td>
                  <td className="p-3 text-center text-slate-500 font-mono text-[10px]">
                    {asset.lastDepreciationDate || '-'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ADD ASSET MODAL */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-white border border-slate-300 rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
                <Building className="w-5 h-5 text-purple-600" />
                <span>إضافة أصل رأسمالي جديد إلى السجل</span>
              </h3>
              <button onClick={() => setIsAddModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddAsset} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">اسم الأصل بالعربية</label>
                <input
                  type="text"
                  required
                  value={nameAr}
                  onChange={(e) => setNameAr(e.target.value)}
                  placeholder="مثال: رافعة شوكية كوماتسو 5 طن"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:ring-2 focus:ring-purple-500 focus:bg-white focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">تصنيف الأصل</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as AssetCategory)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:ring-2 focus:ring-purple-500 focus:bg-white focus:outline-none"
                  >
                    <option value="BUILDINGS">مباني وعقارات</option>
                    <option value="MACHINERY">آلات ومعدات</option>
                    <option value="VEHICLES">سيارات ووسائل نقل</option>
                    <option value="IT_EQUIPMENT">خوادم وأجهزة حاسوب</option>
                    <option value="FURNITURE">أثاث وتجهيزات مكتبية</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">تاريخ الشراء والتشغيل</label>
                  <input
                    type="date"
                    value={purchaseDate}
                    onChange={(e) => setPurchaseDate(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:ring-2 focus:ring-purple-500 focus:bg-white focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">تكلفة الشراء (YER)</label>
                  <input
                    type="number"
                    required
                    min="1"
                    value={purchaseCost === 0 ? '' : purchaseCost}
                    onChange={(e) => setPurchaseCost(parseFloat(e.target.value) || 0)}
                    placeholder="0.00"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-emerald-600 font-mono text-left focus:ring-2 focus:ring-purple-500 focus:bg-white focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">القيمة التخريدية (الخردة)</label>
                  <input
                    type="number"
                    value={salvageValue === 0 ? '' : salvageValue}
                    onChange={(e) => setSalvageValue(parseFloat(e.target.value) || 0)}
                    placeholder="0.00"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 font-mono text-left focus:ring-2 focus:ring-purple-500 focus:bg-white focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">العمر الإنتاجي (بالأشهر)</label>
                  <input
                    type="number"
                    value={usefulLifeMonths}
                    onChange={(e) => setUsefulLifeMonths(parseInt(e.target.value) || 60)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 text-center font-mono focus:ring-2 focus:ring-purple-500 focus:bg-white focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">مركز التكلفة التابع</label>
                  <select
                    value={costCenterId}
                    onChange={(e) => setCostCenterId(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:ring-2 focus:ring-purple-500 focus:bg-white focus:outline-none"
                  >
                    {costCenters.map((cc) => (
                      <option key={cc.id} value={cc.id}>{cc.nameAr}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Document Archiver for Fixed Asset Documents */}
              <div className="pt-2 border-t border-slate-200">
                <label className="block text-xs font-bold text-slate-800 mb-1.5">مستندات وأرشيف الأصل (فاتورة الشراء / عقد الملكية / شهادة الضمان):</label>
                <DocumentArchiver
                  attachments={attachments}
                  onChange={setAttachments}
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold shadow-xs"
                >
                  حفظ الأصل في السجل
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
