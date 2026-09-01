import React, { useState } from 'react';
import { X, Save, Building2 } from 'lucide-react';
import { Warehouse } from '../../types/accounting';

interface WarehouseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (warehouse: Warehouse) => void;
  editWarehouse: Warehouse | null;
}

export const WarehouseModal: React.FC<WarehouseModalProps> = ({
  isOpen,
  onClose,
  onSave,
  editWarehouse,
}) => {
  const [code, setCode] = useState(editWarehouse?.code || '');
  const [nameAr, setNameAr] = useState(editWarehouse?.nameAr || '');
  const [nameEn, setNameEn] = useState(editWarehouse?.nameEn || '');
  const [location, setLocation] = useState(editWarehouse?.location || '');
  const [manager, setManager] = useState(editWarehouse?.manager || '');
  const [phone, setPhone] = useState(editWarehouse?.phone || '');
  const [capacityPercent, setCapacityPercent] = useState(editWarehouse?.capacityPercent?.toString() || '50');
  const [accountCode, setAccountCode] = useState(editWarehouse?.accountCode || '1130');
  const [isActive, setIsActive] = useState(editWarehouse ? editWarehouse.isActive : true);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim() || !nameAr.trim()) {
      alert('يرجى ملء كود واسم المستودع');
      return;
    }

    const warehouseData: Warehouse = {
      id: editWarehouse?.id || `WH-${Date.now().toString().slice(-4)}`,
      code: code.trim().toUpperCase(),
      nameAr: nameAr.trim(),
      nameEn: nameEn.trim(),
      location: location.trim(),
      manager: manager.trim(),
      phone: phone.trim(),
      capacityPercent: Math.min(100, Math.max(0, parseInt(capacityPercent) || 0)),
      isActive,
      accountCode,
    };

    onSave(warehouseData);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/50">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-blue-600/10 text-blue-600 flex items-center justify-center">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                {editWarehouse ? 'تعديل بيانات المستودع' : 'تعريف مستودع / فرع جديد (OX09)'}
              </h3>
              <p className="text-xs text-slate-500">إدارة مواقع التخزين والمراكز اللوجستية</p>
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
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                رمز المستودع (Warehouse Code) *
              </label>
              <input
                type="text"
                required
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="مثال: WH-MUKALLA-01"
                className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 focus:outline-hidden focus:border-blue-500 font-mono uppercase"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                اسم المستودع (بالعربية) *
              </label>
              <input
                type="text"
                required
                value={nameAr}
                onChange={(e) => setNameAr(e.target.value)}
                placeholder="مثال: مستودع فرع المكلا المركزي"
                className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 focus:outline-hidden focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                الموقع الجغرافي / العنوان
              </label>
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="مثال: حضرموت - المكلا / فوه"
                className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 focus:outline-hidden focus:border-blue-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  أمين / مدير المستودع
                </label>
                <input
                  type="text"
                  value={manager}
                  onChange={(e) => setManager(e.target.value)}
                  placeholder="اسم المسؤول"
                  className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 focus:outline-hidden focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  رقم الهاتف
                </label>
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+967 ..."
                  className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 focus:outline-hidden focus:border-blue-500 text-left"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  نسبة الإشغال الحالية (%)
                </label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={capacityPercent}
                  onChange={(e) => setCapacityPercent(e.target.value)}
                  className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 focus:outline-hidden focus:border-blue-500 font-bold"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  حساب الأستاذ العام المرتبط
                </label>
                <input
                  type="text"
                  value={accountCode}
                  onChange={(e) => setAccountCode(e.target.value)}
                  className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 focus:outline-hidden focus:border-blue-500 font-mono"
                  placeholder="1130"
                />
              </div>
            </div>

            <div className="flex items-center gap-2 pt-2">
              <input
                type="checkbox"
                id="whActive"
                checked={isActive}
                onChange={(e) => setIsActive(e.target.checked)}
                className="w-4 h-4 text-blue-600 rounded-sm border-slate-300 focus:ring-blue-500"
              />
              <label htmlFor="whActive" className="text-xs font-semibold text-slate-700 cursor-pointer">
                المستودع نشط وجاهز للعمليات اليومية
              </label>
            </div>
          </div>

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
              حفظ المستودع
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
