import React, { useState } from 'react';
import { X, Save, MapPin, Building, Phone, Mail, User, ShieldCheck } from 'lucide-react';
import { Branch, Warehouse, CostCenter } from '../../types/accounting';

interface BranchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (branch: Branch) => void;
  branchToEdit?: Branch | null;
  warehouses: Warehouse[];
  costCenters: CostCenter[];
}

export const BranchModal: React.FC<BranchModalProps> = ({
  isOpen,
  onClose,
  onSave,
  branchToEdit,
  warehouses,
  costCenters,
}) => {
  const [code, setCode] = useState(branchToEdit?.code || `BR-${Math.floor(100 + Math.random() * 900)}`);
  const [nameAr, setNameAr] = useState(branchToEdit?.nameAr || '');
  const [nameEn, setNameEn] = useState(branchToEdit?.nameEn || '');
  const [manager, setManager] = useState(branchToEdit?.manager || '');
  const [phone, setPhone] = useState(branchToEdit?.phone || '');
  const [secondaryPhone, setSecondaryPhone] = useState(branchToEdit?.secondaryPhone || '');
  const [email, setEmail] = useState(branchToEdit?.email || '');
  const [city, setCity] = useState(branchToEdit?.city || 'صنعاء');
  const [address, setAddress] = useState(branchToEdit?.address || '');
  const [isMain, setIsMain] = useState(branchToEdit?.isMain || false);
  const [isActive, setIsActive] = useState(branchToEdit?.isActive ?? true);
  const [warehouseId, setWarehouseId] = useState(branchToEdit?.warehouseId || warehouses[0]?.id || '');
  const [costCenterId, setCostCenterId] = useState(branchToEdit?.costCenterId || costCenters[0]?.id || '');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nameAr.trim() || !code.trim()) {
      alert('يرجى إدخال رمز واسم الفرع بالعربية');
      return;
    }

    const newBranch: Branch = {
      id: branchToEdit?.id || `BR-${Date.now().toString().slice(-4)}`,
      code: code.trim().toUpperCase(),
      nameAr: nameAr.trim(),
      nameEn: nameEn.trim() || nameAr.trim(),
      manager: manager.trim() || 'غير محدد',
      phone: phone.trim() || '+967 1 000000',
      secondaryPhone: secondaryPhone.trim(),
      email: email.trim() || 'branch@almurooj-group.ye',
      city: city.trim(),
      address: address.trim(),
      isMain,
      isActive,
      warehouseId,
      costCenterId,
    };

    onSave(newBranch);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4" dir="rtl">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Modal Header */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-500/20 border border-blue-400/30 flex items-center justify-center text-blue-400">
              <Building className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">
                {branchToEdit ? 'تعديل بيانات الفرع وموقع العمل' : 'إضافة فرع / موقع عمل جديد'}
              </h3>
              <p className="text-xs text-slate-300">
                تعريف الهيكل الجغرافي للمؤسسة وتفاصيل التواصل والمسؤولين
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Code */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                رمز الفرع (Code) *
              </label>
              <input
                type="text"
                required
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="مثلاً: BR-ADEN"
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 font-mono focus:bg-white focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* City */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                المدينة / المحافظة *
              </label>
              <input
                type="text"
                required
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder="مثلاً: صنعاء، عدن، المكلا، تعز"
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Arabic Name */}
            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-slate-700 mb-1">
                اسم الفرع بالعربية *
              </label>
              <input
                type="text"
                required
                value={nameAr}
                onChange={(e) => setNameAr(e.target.value)}
                placeholder="مثلاً: فرع المنطقة الجنوبية واللوجستيات (عدن)"
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* English Name */}
            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-slate-700 mb-1">
                اسم الفرع بالإنجليزية (English Name)
              </label>
              <input
                type="text"
                value={nameEn}
                onChange={(e) => setNameEn(e.target.value)}
                placeholder="e.g. Aden Regional Branch"
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500 text-left"
                dir="ltr"
              />
            </div>

            {/* Manager */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                مدير الفرع / المسؤول *
              </label>
              <div className="relative">
                <User className="w-3.5 h-3.5 text-slate-400 absolute right-3 top-3" />
                <input
                  type="text"
                  required
                  value={manager}
                  onChange={(e) => setManager(e.target.value)}
                  placeholder="اسم مدير الفرع"
                  className="w-full pr-8 pl-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            {/* Email */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                البريد الإلكتروني للفرع
              </label>
              <div className="relative">
                <Mail className="w-3.5 h-3.5 text-slate-400 absolute right-3 top-3" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="branch@almurooj-group.ye"
                  className="w-full pr-8 pl-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500 text-left"
                  dir="ltr"
                />
              </div>
            </div>

            {/* Primary Phone */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                رقم هاتف الفرع (الرئيسي) *
              </label>
              <div className="relative">
                <Phone className="w-3.5 h-3.5 text-slate-400 absolute right-3 top-3" />
                <input
                  type="text"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+967 1 445566"
                  className="w-full pr-8 pl-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500 text-left font-mono"
                  dir="ltr"
                />
              </div>
            </div>

            {/* Secondary Phone / Mobile */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                هاتف إضافي / جوال التواصل
              </label>
              <div className="relative">
                <Phone className="w-3.5 h-3.5 text-slate-400 absolute right-3 top-3" />
                <input
                  type="text"
                  value={secondaryPhone}
                  onChange={(e) => setSecondaryPhone(e.target.value)}
                  placeholder="+967 777 000000"
                  className="w-full pr-8 pl-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500 text-left font-mono"
                  dir="ltr"
                />
              </div>
            </div>

            {/* Address */}
            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-slate-700 mb-1">
                العنوان التفصيلي وموقع الفرع
              </label>
              <div className="relative">
                <MapPin className="w-3.5 h-3.5 text-slate-400 absolute right-3 top-3" />
                <input
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="الشارع، المبنى، رقم الدور أو المعلم المجاور"
                  className="w-full pr-8 pl-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            {/* Linked Warehouse & Cost Center */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                المستودع الرئيسي المرتبط
              </label>
              <select
                value={warehouseId}
                onChange={(e) => setWarehouseId(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500"
              >
                <option value="">-- بدون ربط مستودع --</option>
                {warehouses.map((w) => (
                  <option key={w.id} value={w.id}>
                    {w.nameAr} ({w.code})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                مركز التكلفة المرتبط (CO)
              </label>
              <select
                value={costCenterId}
                onChange={(e) => setCostCenterId(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500"
              >
                <option value="">-- بدون ربط مركز تكلفة --</option>
                {costCenters.map((cc) => (
                  <option key={cc.id} value={cc.id}>
                    {cc.nameAr} ({cc.code})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Toggles */}
          <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center gap-6">
            <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-slate-700">
              <input
                type="checkbox"
                checked={isMain}
                onChange={(e) => setIsMain(e.target.checked)}
                className="rounded text-blue-600 focus:ring-blue-500"
              />
              <span>تعيين كـ (الفرع الرئيسي للمؤسسة)</span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-slate-700">
              <input
                type="checkbox"
                checked={isActive}
                onChange={(e) => setIsActive(e.target.checked)}
                className="rounded text-blue-600 focus:ring-blue-500"
              />
              <span>حالة الفرع: نشط ويعمل</span>
            </label>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition"
            >
              إلغاء
            </button>
            <button
              type="submit"
              className="flex items-center gap-2 px-5 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-xs transition"
            >
              <Save className="w-4 h-4" />
              <span>{branchToEdit ? 'حفظ التعديلات' : 'إضافة الفرع'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
