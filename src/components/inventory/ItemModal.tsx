import React, { useState } from 'react';
import { X, Save, Package, Tag, QrCode } from 'lucide-react';
import { InventoryItem, Warehouse } from '../../types/accounting';
import { Barcode } from './BarcodeGenerator';

interface ItemModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (item: InventoryItem) => void;
  editItem: InventoryItem | null;
  warehouses: Warehouse[];
}

export const ItemModal: React.FC<ItemModalProps> = ({
  isOpen,
  onClose,
  onSave,
  editItem,
  warehouses,
}) => {
  const [code, setCode] = useState(editItem?.code || '');
  const [nameAr, setNameAr] = useState(editItem?.nameAr || '');
  const [category, setCategory] = useState(editItem?.category || 'أدوات ومواد عامة');
  const [subCategory, setSubCategory] = useState(editItem?.subCategory || '');
  const [warehouseId, setWarehouseId] = useState(editItem?.warehouseId || warehouses[0]?.id || 'WH-01');
  const [salePrice, setSalePrice] = useState(editItem?.salePrice?.toString() || '0');
  const [costPrice, setCostPrice] = useState(editItem?.costPrice?.toString() || '0');
  const [quantity, setQuantity] = useState(editItem?.quantity?.toString() || '0');
  const [unit, setUnit] = useState(editItem?.unit || 'حبه');
  const [minStockLevel, setMinStockLevel] = useState(editItem?.minStockLevel?.toString() || '5');
  const [status, setStatus] = useState<string>(editItem?.status || 'متوفر');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim() || !nameAr.trim()) {
      alert('يرجى إدخال رمز واسم الصنف');
      return;
    }

    const q = parseFloat(quantity) || 0;
    let autoStatus = status;
    if (q <= 0) autoStatus = 'نفذت الكمية';
    else if (q < (parseFloat(minStockLevel) || 5)) autoStatus = 'منخفض';

    const itemData: InventoryItem = {
      id: editItem?.id || code.trim(),
      code: code.trim(),
      nameAr: nameAr.trim(),
      category,
      subCategory: subCategory.trim(),
      warehouseId,
      salePrice: parseFloat(salePrice) || 0,
      costPrice: parseFloat(costPrice) || 0,
      quantity: q,
      unit,
      minStockLevel: parseFloat(minStockLevel) || 5,
      status: autoStatus,
      lastUpdated: new Date().toISOString().split('T')[0],
    };

    onSave(itemData);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/50">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-blue-600/10 text-blue-600 flex items-center justify-center">
              <Package className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                {editItem ? 'تعديل بيانات الصنف المخزني' : 'إضافة صنف مخزني جديد (MM01)'}
              </h3>
              <p className="text-xs text-slate-500">بطاقة المادة وتعريف الأسعار والكميات والمستودع</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                رمز الصنف (Item Code / SKU) *
              </label>
              <input
                type="text"
                required
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="مثال: E1102"
                className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 focus:outline-hidden focus:border-blue-500 focus:ring-1 focus:ring-blue-500 font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                التصنيف المخزني (Category)
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 focus:outline-hidden focus:border-blue-500"
              >
                <option value="أدوات ومواد عامة">أدوات ومواد عامة</option>
                <option value="دهانات ومواد طلاء">دهانات ومواد طلاء</option>
                <option value="أدوات وكهربائيات">أدوات وكهربائيات</option>
                <option value="سباكة ومواسير مياه">سباكة ومواسير مياه</option>
                <option value="عدد وآلات صناعية">عدد وآلات صناعية</option>
                <option value="مستلزمات ومبيدات زراعية">مستلزمات ومبيدات زراعية</option>
                <option value="أقفال وخردوات معدنية">أقفال وخردوات معدنية</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                التصنيف الفرعي (Sub-Category)
              </label>
              <input
                type="text"
                value={subCategory}
                onChange={(e) => setSubCategory(e.target.value)}
                placeholder="مثال: أسلاك، مسامير، الخ..."
                className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 focus:outline-hidden focus:border-blue-500"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-xs font-bold text-slate-700 mb-1">
                اسم الصنف والمواصفات (Arabic Name) *
              </label>
              <input
                type="text"
                required
                value={nameAr}
                onChange={(e) => setNameAr(e.target.value)}
                placeholder="مثال: كابلات نحاس معزولة 4 ملم"
                className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 focus:outline-hidden focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                المستودع الرئيسي الافتراضي
              </label>
              <select
                value={warehouseId}
                onChange={(e) => setWarehouseId(e.target.value)}
                className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 focus:outline-hidden focus:border-blue-500"
              >
                {warehouses.map((w) => (
                  <option key={w.id} value={w.id}>
                    {w.nameAr} ({w.code})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                وحدة القياس (Unit)
              </label>
              <select
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
                className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 focus:outline-hidden focus:border-blue-500"
              >
                <option value="حبه">حبه (Piece)</option>
                <option value="علبة">علبة (Box)</option>
                <option value="عليه">عليه (Pack)</option>
                <option value="طقم">طقم (Set)</option>
                <option value="متر">متر (Meter)</option>
                <option value="لفة">لفة (Roll)</option>
                <option value="كيس">كيس (Bag)</option>
                <option value="كرتون">كرتون (Carton)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                سعر البيع (Sale Price YER)
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={salePrice}
                onChange={(e) => setSalePrice(e.target.value)}
                className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 focus:outline-hidden focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                تكلفة الشراء التقديرية (Cost Price YER)
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={costPrice}
                onChange={(e) => setCostPrice(e.target.value)}
                className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 focus:outline-hidden focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                الرصيد الافتتاحي / الكمية الحالية
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 focus:outline-hidden focus:border-blue-500 font-bold"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                حد إعادة الطلب (Min Stock Level)
              </label>
              <input
                type="number"
                min="0"
                value={minStockLevel}
                onChange={(e) => setMinStockLevel(e.target.value)}
                className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 focus:outline-hidden focus:border-blue-500"
              />
            </div>
          </div>

          {/* Barcode Live Preview Card */}
          {code.trim() && (
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center">
                  <Tag className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-xs font-bold text-slate-800">معاينة باركود الصنف (Code 128)</span>
                  <p className="text-[10px] text-slate-500">جاهز للقراءة المباشرة بالماسحات الضوئية والطباعة</p>
                </div>
              </div>
              <div className="bg-white px-3 py-1.5 rounded-lg border border-slate-200 shadow-2xs">
                <Barcode value={code.trim()} displayValue={code.trim()} height={30} moduleWidth={1.2} />
              </div>
            </div>
          )}

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition"
            >
              إلغاء
            </button>
            <button
              type="submit"
              className="flex items-center gap-2 px-5 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-xs transition"
            >
              <Save className="w-4 h-4" />
              حفظ بيانات الصنف
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
