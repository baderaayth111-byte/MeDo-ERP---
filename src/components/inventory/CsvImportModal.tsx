import React, { useState, useRef } from 'react';
import { X, UploadCloud, FileText, CheckCircle, AlertCircle, RefreshCw, Layers } from 'lucide-react';
import { InventoryItem } from '../../types/accounting';
import { parseInventoryCsv } from '../../utils/csvParser';
import { defaultRawInventoryCsv } from '../../data/rawCsvData';
import { defaultRawInventoryCsvPart2 } from '../../data/rawCsvData2';
import { defaultRawInventoryCsvPart3 } from '../../data/rawCsvData3';

interface CsvImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImportItems: (newItems: InventoryItem[], mergeMode: 'REPLACE' | 'APPEND') => void;
  currentWarehouseId: string;
}

export const CsvImportModal: React.FC<CsvImportModalProps> = ({
  isOpen,
  onClose,
  onImportItems,
  currentWarehouseId,
}) => {
  const [file, setFile] = useState<File | null>(null);
  const [csvContent, setCsvContent] = useState<string>('');
  const [parsedPreview, setParsedPreview] = useState<InventoryItem[]>([]);
  const [mergeMode, setMergeMode] = useState<'REPLACE' | 'APPEND'>('APPEND');
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const uploadedFile = e.target.files?.[0];
    if (!uploadedFile) return;

    setFile(uploadedFile);
    setIsProcessing(true);
    setErrorMsg(null);

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const text = evt.target?.result as string;
        setCsvContent(text);
        const parsed = parseInventoryCsv(text, currentWarehouseId);
        if (parsed.length === 0) {
          setErrorMsg('لم يتم العثور على أسطر صالحة في ملف CSV');
        } else {
          setParsedPreview(parsed);
        }
      } catch (err: any) {
        setErrorMsg('حدث خطأ أثناء قراءة ملف CSV: ' + err.message);
      } finally {
        setIsProcessing(false);
      }
    };
    reader.readAsText(uploadedFile, 'UTF-8');
  };

  const handleLoadFullDefaultCatalog = () => {
    setIsProcessing(true);
    setErrorMsg(null);
    try {
      const fullCsv = `${defaultRawInventoryCsv}\n${defaultRawInventoryCsvPart2}\n${defaultRawInventoryCsvPart3}`;
      setCsvContent(fullCsv);
      const parsed = parseInventoryCsv(fullCsv, currentWarehouseId);
      setParsedPreview(parsed);
      setFile(new File([fullCsv], 'hardware_catalog_1100_items.csv', { type: 'text/csv' }));
    } catch (err: any) {
      setErrorMsg('حدث خطأ أثناء تحميل الكتالوج: ' + err.message);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleExecuteImport = () => {
    if (parsedPreview.length === 0) {
      alert('لا توجد أصناف لاستيرادها');
      return;
    }
    onImportItems(parsedPreview, mergeMode);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/50">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-blue-600/10 text-blue-600 flex items-center justify-center">
              <UploadCloud className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                استيراد كتالوج وأصناف المخزون من ملف CSV
              </h3>
              <p className="text-xs text-slate-500">
                استيراد جماعي للأصناف مع التصنيف والأسعار والكميات
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          {/* Upload Dropzone */}
          <div
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed border-slate-300 hover:border-blue-500 bg-slate-50/60 hover:bg-blue-50/30 rounded-2xl p-6 flex flex-col items-center justify-center cursor-pointer transition text-center group"
          >
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileUpload}
              accept=".csv,.txt"
              className="hidden"
            />
            <div className="w-12 h-12 rounded-2xl bg-blue-100/70 text-blue-600 flex items-center justify-center mb-3 group-hover:scale-110 transition">
              <UploadCloud className="w-6 h-6" />
            </div>
            <p className="text-xs font-bold text-slate-800 mb-1">
              اسحب وأفلت ملف CSV هنا أو انقر للاختيار من جهازك
            </p>
            <p className="text-[11px] text-slate-500 max-w-md">
              التنسيق المدعوم: <code className="bg-slate-200 px-1 rounded text-slate-700">item_code, item_name, sale_price, quantity, unit, status</code>
            </p>
          </div>

          {/* Preset Catalog Loader Button */}
          <div className="flex items-center justify-between p-4 rounded-xl bg-slate-100/80 border border-slate-200">
            <div className="flex items-center gap-3">
              <Layers className="w-5 h-5 text-indigo-600" />
              <div>
                <p className="text-xs font-bold text-slate-800">
                  تحميل الكتالوج المرفق الكامل (1100+ صنف أدوات ومواد وبناء)
                </p>
                <p className="text-[11px] text-slate-500">
                  تضمين كافة الأصناف المدرجة بالبيانات السابقة تلقائياً
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={handleLoadFullDefaultCatalog}
              disabled={isProcessing}
              className="px-3.5 py-1.5 text-xs font-bold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 rounded-lg transition flex items-center gap-1.5"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isProcessing ? 'animate-spin' : ''}`} />
              تحميل الكتالوج الآن
            </button>
          </div>

          {/* Error Message */}
          {errorMsg && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Preview Section */}
          {parsedPreview.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-emerald-600" />
                  <h4 className="text-xs font-bold text-slate-800">
                    معاينة الأصناف المستخرجة ({parsedPreview.length.toLocaleString()} صنف)
                  </h4>
                </div>
                <div className="flex items-center gap-2 text-xs">
                  <span className="text-slate-500">طريقة الاستيراد:</span>
                  <label className="flex items-center gap-1 cursor-pointer font-medium">
                    <input
                      type="radio"
                      name="mergeMode"
                      value="APPEND"
                      checked={mergeMode === 'APPEND'}
                      onChange={() => setMergeMode('APPEND')}
                    />
                    إضافة / دمج
                  </label>
                  <label className="flex items-center gap-1 cursor-pointer font-medium text-rose-700">
                    <input
                      type="radio"
                      name="mergeMode"
                      value="REPLACE"
                      checked={mergeMode === 'REPLACE'}
                      onChange={() => setMergeMode('REPLACE')}
                    />
                    استبدال الكل
                  </label>
                </div>
              </div>

              <div className="border border-slate-200 rounded-xl overflow-hidden max-h-56 overflow-y-auto">
                <table className="w-full text-right text-xs">
                  <thead className="bg-slate-100 text-slate-600 font-bold sticky top-0 border-b border-slate-200">
                    <tr>
                      <th className="p-2.5 w-16">الكود</th>
                      <th className="p-2.5">اسم الصنف</th>
                      <th className="p-2.5">التصنيف</th>
                      <th className="p-2.5 text-center">الكمية</th>
                      <th className="p-2.5 text-center">الوحدة</th>
                      <th className="p-2.5 text-left">سعر البيع</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 bg-white">
                    {parsedPreview.slice(0, 15).map((item) => (
                      <tr key={item.id} className="hover:bg-slate-50">
                        <td className="p-2 font-mono font-bold text-blue-700">{item.code}</td>
                        <td className="p-2 font-medium text-slate-800">{item.nameAr}</td>
                        <td className="p-2 text-slate-500">{item.category}</td>
                        <td className="p-2 text-center font-mono font-bold">{item.quantity}</td>
                        <td className="p-2 text-center text-slate-600">{item.unit}</td>
                        <td className="p-2 text-left font-mono font-bold">
                          {item.salePrice.toLocaleString('en-US')} YER
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {parsedPreview.length > 15 && (
                <p className="text-[11px] text-slate-400 text-center">
                  ... ويوجد {parsedPreview.length - 15} صنف آخر جاهز للاستيراد
                </p>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-4 border-t border-slate-100 bg-slate-50/50">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition"
          >
            إلغاء
          </button>
          <button
            type="button"
            onClick={handleExecuteImport}
            disabled={parsedPreview.length === 0}
            className="flex items-center gap-2 px-5 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-40 rounded-xl shadow-xs transition"
          >
            <CheckCircle className="w-4 h-4" />
            تأكيد واستيراد {parsedPreview.length > 0 ? `(${parsedPreview.length.toLocaleString()}) صنف` : ''}
          </button>
        </div>
      </div>
    </div>
  );
};
