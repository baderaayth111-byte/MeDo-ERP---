import React, { useState } from 'react';
import { X, ArrowDownLeft, ArrowUpRight, Repeat, Plus, Trash2, CheckCircle2 } from 'lucide-react';
import { StockMovement, StockMovementType, StockMovementLine, InventoryItem, Warehouse, JournalEntry } from '../../types/accounting';

interface StockMovementModalProps {
  isOpen: boolean;
  onClose: () => void;
  items: InventoryItem[];
  warehouses: Warehouse[];
  onSaveMovement: (movement: StockMovement, autoEntry?: JournalEntry) => void;
}

export const StockMovementModal: React.FC<StockMovementModalProps> = ({
  isOpen,
  onClose,
  items,
  warehouses,
  onSaveMovement,
}) => {
  const [movementType, setMovementType] = useState<StockMovementType>('GOODS_RECEIPT');
  const [warehouseId, setWarehouseId] = useState<string>(warehouses[0]?.id || 'WH-01');
  const [toWarehouseId, setToWarehouseId] = useState<string>(warehouses[1]?.id || 'WH-02');
  const [date, setDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [reference, setReference] = useState<string>('');
  const [description, setDescription] = useState<string>('');

  const [lines, setLines] = useState<StockMovementLine[]>([
    {
      id: 'L1',
      itemId: items[0]?.id || '',
      itemCode: items[0]?.code || '',
      itemName: items[0]?.nameAr || '',
      quantity: 10,
      unit: items[0]?.unit || 'حبه',
      unitCost: items[0]?.costPrice || 1000,
      totalCost: (items[0]?.costPrice || 1000) * 10,
    },
  ]);

  if (!isOpen) return null;

  const handleItemChange = (index: number, itemId: string) => {
    const selectedItem = items.find((it) => it.id === itemId);
    if (!selectedItem) return;

    const newLines = [...lines];
    newLines[index] = {
      ...newLines[index],
      itemId: selectedItem.id,
      itemCode: selectedItem.code,
      itemName: selectedItem.nameAr,
      unit: selectedItem.unit,
      unitCost: selectedItem.costPrice || selectedItem.salePrice * 0.8,
      totalCost: (selectedItem.costPrice || selectedItem.salePrice * 0.8) * newLines[index].quantity,
    };
    setLines(newLines);
  };

  const handleQtyChange = (index: number, qty: number) => {
    const newLines = [...lines];
    const validQty = Math.max(0.01, qty);
    newLines[index] = {
      ...newLines[index],
      quantity: validQty,
      totalCost: validQty * newLines[index].unitCost,
    };
    setLines(newLines);
  };

  const handleUnitCostChange = (index: number, cost: number) => {
    const newLines = [...lines];
    const validCost = Math.max(0, cost);
    newLines[index] = {
      ...newLines[index],
      unitCost: validCost,
      totalCost: newLines[index].quantity * validCost,
    };
    setLines(newLines);
  };

  const addLine = () => {
    const firstItem = items[0];
    const newLine: StockMovementLine = {
      id: `L-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      itemId: firstItem ? firstItem.id : '',
      itemCode: firstItem ? firstItem.code : '',
      itemName: firstItem ? firstItem.nameAr : '',
      quantity: 1,
      unit: firstItem ? firstItem.unit : 'حبه',
      unitCost: firstItem ? firstItem.costPrice || 1000 : 1000,
      totalCost: firstItem ? firstItem.costPrice || 1000 : 1000,
    };
    setLines([...lines, newLine]);
  };

  const removeLine = (index: number) => {
    if (lines.length === 1) return;
    setLines(lines.filter((_, i) => i !== index));
  };

  const totalAmount = lines.reduce((acc, l) => acc + l.totalCost, 0);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (lines.length === 0) {
      alert('يرجى إضافة بند واحد على الأقل للحركة المخزنية');
      return;
    }

    const docId = `MIGO-${Date.now().toString().slice(-6)}`;
    const movementNumber =
      movementType === 'GOODS_RECEIPT'
        ? `MIGO-GR-${Date.now().toString().slice(-4)}`
        : movementType === 'GOODS_ISSUE'
        ? `MIGO-GI-${Date.now().toString().slice(-4)}`
        : `MIGO-TR-${Date.now().toString().slice(-4)}`;

    const movement: StockMovement = {
      id: docId,
      movementNumber,
      type: movementType,
      date,
      warehouseId,
      toWarehouseId: movementType === 'TRANSFER' ? toWarehouseId : undefined,
      reference: reference.trim() || `Ref-${movementNumber}`,
      description:
        description.trim() ||
        (movementType === 'GOODS_RECEIPT'
          ? 'استلام وتوريد بضاعة للمستودع'
          : movementType === 'GOODS_ISSUE'
          ? 'صرف بضاعة ومواد من المستودع'
          : 'مناقلة مخزنية بين المستودعات'),
      lines,
      totalAmount,
      status: 'POSTED',
      createdBy: 'أمين المستودع (ERP User)',
      postedAt: `${date} ${new Date().toLocaleTimeString('ar-SA')}`,
      journalEntryId: `JE-AUTO-${docId}`,
    };

    // Auto-generate linked General Ledger Journal Entry
    let autoEntry: JournalEntry | undefined;

    if (movementType === 'GOODS_RECEIPT') {
      // Dr. Inventory (1130) / Cr. Accounts Payable (2110)
      autoEntry = {
        id: `JE-AUTO-${docId}`,
        entryNumber: `JE-GR-${Date.now().toString().slice(-4)}`,
        date,
        reference: movementNumber,
        description: `قيد توريد مخزني آلي (${movementNumber}) - ${reference || 'أمر شراء وارد'}`,
        status: 'POSTED',
        createdBy: 'نظام المخازن الآلي (MIGO Engine)',
        postedAt: `${date} ${new Date().toLocaleTimeString('ar-SA')}`,
        totalDebit: totalAmount,
        totalCredit: totalAmount,
        lines: [
          {
            id: 'L1',
            accountCode: '1130',
            accountName: 'المخزون السلعي (بضاعة آخر المدة)',
            debit: totalAmount,
            credit: 0,
            currency: 'YER',
            exchangeRate: 1,
            amountInBase: totalAmount,
            description: `توريد أصناف مخزنية - سند ${movementNumber}`,
          },
          {
            id: 'L2',
            accountCode: '2110',
            accountName: 'الموردون والذمم الدائنة التجارية',
            debit: 0,
            credit: totalAmount,
            currency: 'YER',
            exchangeRate: 1,
            amountInBase: totalAmount,
            description: `استحقاق مورد عن التوريد المخزني - سند ${movementNumber}`,
          },
        ],
      };
    } else if (movementType === 'GOODS_ISSUE') {
      // Dr. Cost of Goods Sold (5100) / Cr. Inventory (1130)
      autoEntry = {
        id: `JE-AUTO-${docId}`,
        entryNumber: `JE-GI-${Date.now().toString().slice(-4)}`,
        date,
        reference: movementNumber,
        description: `قيد صرف مخزني آلي (${movementNumber}) - ${reference || 'صرف مبيعات / مشاريع'}`,
        status: 'POSTED',
        createdBy: 'نظام المخازن الآلي (MIGO Engine)',
        postedAt: `${date} ${new Date().toLocaleTimeString('ar-SA')}`,
        totalDebit: totalAmount,
        totalCredit: totalAmount,
        lines: [
          {
            id: 'L1',
            accountCode: '5100',
            accountName: 'تكلفة البضاعة المباعة (COGS)',
            debit: totalAmount,
            credit: 0,
            currency: 'YER',
            exchangeRate: 1,
            amountInBase: totalAmount,
            description: `إثبات تكلفة البضاعة المنصرفة - سند ${movementNumber}`,
          },
          {
            id: 'L2',
            accountCode: '1130',
            accountName: 'المخزون السلعي (بضاعة آخر المدة)',
            debit: 0,
            credit: totalAmount,
            currency: 'YER',
            exchangeRate: 1,
            amountInBase: totalAmount,
            description: `تخفيض رصيد المخزون المنصرف - سند ${movementNumber}`,
          },
        ],
      };
    }

    onSaveMovement(movement, autoEntry);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/50">
          <div className="flex items-center gap-2.5">
            <div
              className={`w-9 h-9 rounded-xl flex items-center justify-center ${
                movementType === 'GOODS_RECEIPT'
                  ? 'bg-emerald-50 text-emerald-600'
                  : movementType === 'GOODS_ISSUE'
                  ? 'bg-amber-50 text-amber-600'
                  : 'bg-blue-50 text-blue-600'
              }`}
            >
              {movementType === 'GOODS_RECEIPT' && <ArrowDownLeft className="w-5 h-5" />}
              {movementType === 'GOODS_ISSUE' && <ArrowUpRight className="w-5 h-5" />}
              {movementType === 'TRANSFER' && <Repeat className="w-5 h-5" />}
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                تسجيل حركة بضاعة ومناقلة مخزنية (SAP MIGO)
              </h3>
              <p className="text-xs text-slate-500">
                توليد القيود المحاسبية وتحديث أرصدة المستودعات تلقائياً
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

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-5">
          {/* Movement Type Selector */}
          <div className="grid grid-cols-3 gap-3">
            <button
              type="button"
              onClick={() => setMovementType('GOODS_RECEIPT')}
              className={`p-3 rounded-xl border text-right transition flex items-center justify-between ${
                movementType === 'GOODS_RECEIPT'
                  ? 'border-emerald-500 bg-emerald-50/60 text-emerald-900 shadow-xs ring-1 ring-emerald-500'
                  : 'border-slate-200 hover:bg-slate-50 text-slate-700'
              }`}
            >
              <div>
                <p className="text-xs font-bold">وارد - استلام بضاعة (GR 101)</p>
                <p className="text-[10px] text-slate-500">توريد من مورد / مشتريات (Dr. مخزون)</p>
              </div>
              <ArrowDownLeft className="w-5 h-5 text-emerald-600" />
            </button>

            <button
              type="button"
              onClick={() => setMovementType('GOODS_ISSUE')}
              className={`p-3 rounded-xl border text-right transition flex items-center justify-between ${
                movementType === 'GOODS_ISSUE'
                  ? 'border-amber-500 bg-amber-50/60 text-amber-900 shadow-xs ring-1 ring-amber-500'
                  : 'border-slate-200 hover:bg-slate-50 text-slate-700'
              }`}
            >
              <div>
                <p className="text-xs font-bold">صادر - صرف بضاعة (GI 201)</p>
                <p className="text-[10px] text-slate-500">صرف مبيعات / مشاريع (Cr. مخزون)</p>
              </div>
              <ArrowUpRight className="w-5 h-5 text-amber-600" />
            </button>

            <button
              type="button"
              onClick={() => setMovementType('TRANSFER')}
              className={`p-3 rounded-xl border text-right transition flex items-center justify-between ${
                movementType === 'TRANSFER'
                  ? 'border-blue-500 bg-blue-50/60 text-blue-900 shadow-xs ring-1 ring-blue-500'
                  : 'border-slate-200 hover:bg-slate-50 text-slate-700'
              }`}
            >
              <div>
                <p className="text-xs font-bold">مناقلة بين المستودعات (TR 301)</p>
                <p className="text-[10px] text-slate-500">تحويل رصيد من فرع إلى فرع آخر</p>
              </div>
              <Repeat className="w-5 h-5 text-blue-600" />
            </button>
          </div>

          {/* Header Details */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200/80">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                {movementType === 'TRANSFER' ? 'من مستودع (المصدر) *' : 'المستودع المعني *'}
              </label>
              <select
                value={warehouseId}
                onChange={(e) => setWarehouseId(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 focus:outline-hidden focus:border-blue-500 bg-white"
              >
                {warehouses.map((w) => (
                  <option key={w.id} value={w.id}>
                    {w.nameAr} ({w.code})
                  </option>
                ))}
              </select>
            </div>

            {movementType === 'TRANSFER' && (
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  إلى مستودع (الوجهة) *
                </label>
                <select
                  value={toWarehouseId}
                  onChange={(e) => setToWarehouseId(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 focus:outline-hidden focus:border-blue-500 bg-white"
                >
                  {warehouses
                    .filter((w) => w.id !== warehouseId)
                    .map((w) => (
                      <option key={w.id} value={w.id}>
                        {w.nameAr} ({w.code})
                      </option>
                    ))}
                </select>
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">تاريخ الحركة *</label>
              <input
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 focus:outline-hidden focus:border-blue-500 bg-white"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                المرجع / رقم الفاتورة أو الإذن
              </label>
              <input
                type="text"
                value={reference}
                onChange={(e) => setReference(e.target.value)}
                placeholder="مثال: PO-9921 أو INV-4401"
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 focus:outline-hidden focus:border-blue-500 bg-white font-mono"
              />
            </div>

            <div className={movementType === 'TRANSFER' ? 'md:col-span-3' : 'md:col-span-2'}>
              <label className="block text-xs font-bold text-slate-700 mb-1">بيان وشرح الحركة</label>
              <input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="بيان تفصيلي لسبب الصرف أو التوريد..."
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 focus:outline-hidden focus:border-blue-500 bg-white"
              />
            </div>
          </div>

          {/* Line Items Table */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold text-slate-800">بنود الأصناف والكميات المراد ترحيلها</h4>
              <button
                type="button"
                onClick={addLine}
                className="flex items-center gap-1 px-3 py-1.5 text-xs font-bold text-blue-600 hover:bg-blue-50 rounded-lg transition"
              >
                <Plus className="w-3.5 h-3.5" />
                إضافة صنف آخر
              </button>
            </div>

            <div className="border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
              <table className="w-full text-right text-xs">
                <thead className="bg-slate-100 text-slate-600 font-bold border-b border-slate-200">
                  <tr>
                    <th className="p-3 w-8 text-center">#</th>
                    <th className="p-3">الصنف المخزني</th>
                    <th className="p-3 w-28 text-center">الكمية</th>
                    <th className="p-3 w-20 text-center">الوحدة</th>
                    <th className="p-3 w-32 text-center">تكلفة الوحدة (YER)</th>
                    <th className="p-3 w-32 text-left">الإجمالي (YER)</th>
                    <th className="p-3 w-10 text-center"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {lines.map((line, idx) => (
                    <tr key={line.id} className="hover:bg-slate-50/70">
                      <td className="p-3 text-center text-slate-400 font-mono">{idx + 1}</td>
                      <td className="p-3">
                        <select
                          value={line.itemId}
                          onChange={(e) => handleItemChange(idx, e.target.value)}
                          className="w-full p-2 text-xs rounded-lg border border-slate-200 focus:outline-hidden focus:border-blue-500 font-medium"
                        >
                          {items.slice(0, 300).map((it) => (
                            <option key={it.id} value={it.id}>
                              {it.code} - {it.nameAr} (متوفر: {it.quantity} {it.unit})
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="p-3 text-center">
                        <input
                          type="number"
                          step="0.01"
                          min="0.01"
                          value={line.quantity}
                          onChange={(e) => handleQtyChange(idx, parseFloat(e.target.value) || 0)}
                          className="w-full p-2 text-center text-xs rounded-lg border border-slate-200 focus:outline-hidden focus:border-blue-500 font-bold"
                        />
                      </td>
                      <td className="p-3 text-center text-slate-600">{line.unit}</td>
                      <td className="p-3 text-center">
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          value={line.unitCost}
                          onChange={(e) => handleUnitCostChange(idx, parseFloat(e.target.value) || 0)}
                          className="w-full p-2 text-center text-xs rounded-lg border border-slate-200 focus:outline-hidden focus:border-blue-500 font-mono"
                        />
                      </td>
                      <td className="p-3 text-left font-mono font-bold text-slate-900">
                        {line.totalCost.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="p-3 text-center">
                        <button
                          type="button"
                          onClick={() => removeLine(idx)}
                          disabled={lines.length === 1}
                          className="p-1 text-slate-400 hover:text-rose-600 disabled:opacity-30 rounded-md transition"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-slate-50 border-t border-slate-200 font-bold text-xs">
                  <tr>
                    <td colSpan={5} className="p-3 text-right text-slate-700">
                      إجمالي قيمة الحركة المخزنية:
                    </td>
                    <td className="p-3 text-left font-mono text-sm text-blue-700">
                      {totalAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })} YER
                    </td>
                    <td></td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

          {/* Auto GL Posting Notification */}
          <div className="bg-blue-50/70 border border-blue-200 p-3.5 rounded-xl flex items-start gap-3">
            <CheckCircle2 className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
            <div className="text-xs text-blue-900">
              <p className="font-bold">التكامل الآلي مع الأستاذ العام (Real-Time FI/CO Integration):</p>
              <p className="text-blue-700 mt-0.5">
                {movementType === 'GOODS_RECEIPT'
                  ? 'سيتم ترحيل قيد يومية تلقائي: مدين (ح/ 1130 المخزون السلعي) / دائن (ح/ 2110 الموردون).'
                  : movementType === 'GOODS_ISSUE'
                  ? 'سيتم ترحيل قيد يومية تلقائي: مدين (ح/ 5100 تكلفة البضاعة المباعة) / دائن (ح/ 1130 المخزون السلعي).'
                  : 'سيتم تحديث أرصدة المستودعين فورياً مع الحفاظ على القيمة المالية الإجمالية للمخزون.'}
              </p>
            </div>
          </div>

          {/* Actions */}
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
              <CheckCircle2 className="w-4 h-4" />
              ترحيل وتثبيت الحركة المخزنية
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
