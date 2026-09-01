import React, { useState, useMemo } from 'react';
import {
  ShoppingBag,
  FileText,
  Truck,
  Plus,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  AlertCircle,
  Share2,
  Printer,
  ChevronRight,
  Eye,
  Trash2,
  Edit,
  ArrowRight,
  Sparkles,
  Package,
  Layers,
  Building,
  DollarSign,
  TrendingUp,
  Percent,
  Paperclip,
  Check,
  X,
  Send,
  MessageCircle,
  Smartphone
} from 'lucide-react';
import {
  PurchaseOrder,
  PurchaseRequisition,
  GoodsReceiptNote,
  Vendor,
  InventoryItem,
  Warehouse,
  CostCenter,
  Branch,
  Currency,
  CompanyProfile,
  POLineItem,
  PRLineItem
} from '../types/accounting';
import { formatCurrency, convertAmount } from '../utils/formatters';
import { DocumentShareModal, DocumentShareData } from './DocumentShareModal';
import { DocumentArchiver } from './DocumentArchiver';

interface ProcurementViewProps {
  purchaseOrders: PurchaseOrder[];
  onAddPurchaseOrder: (po: PurchaseOrder) => void;
  onUpdatePurchaseOrder?: (po: PurchaseOrder) => void;
  purchaseRequisitions: PurchaseRequisition[];
  onAddPurchaseRequisition?: (pr: PurchaseRequisition) => void;
  onAddRequisition?: (pr: PurchaseRequisition) => void;
  onUpdatePurchaseRequisition?: (pr: PurchaseRequisition) => void;
  goodsReceiptNotes: GoodsReceiptNote[];
  onAddGoodsReceiptNote?: (grn: GoodsReceiptNote) => void;
  onAddGoodsReceipt?: (grn: GoodsReceiptNote) => void;
  vendors: Vendor[];
  inventoryItems: InventoryItem[];
  warehouses: Warehouse[];
  costCenters?: CostCenter[];
  branches?: Branch[];
  currency: Currency;
  rates: Record<Currency, number>;
  companyProfile: CompanyProfile;
  onNavigateToBills?: () => void;
  onAddJournalEntry?: (je: any) => void;
}

type ProcurementTab = 'PURCHASE_ORDERS' | 'REQUISITIONS' | 'GOODS_RECEIPTS' | 'RFQ_COMPARISON';

export const ProcurementView: React.FC<ProcurementViewProps> = ({
  purchaseOrders,
  onAddPurchaseOrder,
  onUpdatePurchaseOrder,
  purchaseRequisitions,
  onAddPurchaseRequisition,
  onAddRequisition,
  onUpdatePurchaseRequisition,
  goodsReceiptNotes,
  onAddGoodsReceiptNote,
  onAddGoodsReceipt,
  vendors,
  inventoryItems,
  warehouses,
  costCenters = [],
  branches = [],
  currency,
  rates,
  companyProfile,
}) => {
  const handleAddPRCallback = onAddPurchaseRequisition || onAddRequisition || (() => {});
  const handleAddGRNCallback = onAddGoodsReceiptNote || onAddGoodsReceipt || (() => {});
  const handleUpdatePRCallback = onUpdatePurchaseRequisition || (() => {});
  const handleUpdatePOCallback = onUpdatePurchaseOrder || (() => {});
  const [activeTab, setActiveTab] = useState<ProcurementTab>('PURCHASE_ORDERS');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  // Modals
  const [isNewPOModalOpen, setIsNewPOModalOpen] = useState(false);
  const [isNewPRModalOpen, setIsNewPRModalOpen] = useState(false);
  const [isNewGRNModalOpen, setIsNewGRNModalOpen] = useState(false);
  const [selectedPOForGRN, setSelectedPOForGRN] = useState<PurchaseOrder | null>(null);
  const [viewingPO, setViewingPO] = useState<PurchaseOrder | null>(null);

  // Document Share Modal
  const [shareModalDoc, setShareModalDoc] = useState<DocumentShareData | null>(null);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);

  // --- Summary Metrics ---
  const metrics = useMemo(() => {
    const totalOpenPOs = purchaseOrders.filter(p => p.status === 'ISSUED' || p.status === 'PARTIALLY_RECEIVED').length;
    const totalPendingPRs = purchaseRequisitions.filter(r => r.status === 'SUBMITTED').length;
    const totalPurchasesAmount = purchaseOrders
      .filter(p => p.status !== 'CANCELLED')
      .reduce((sum, p) => sum + p.grandTotal, 0);
    const completedPOs = purchaseOrders.filter(p => p.status === 'COMPLETED').length;
    const fulfillmentRate = purchaseOrders.length > 0 ? Math.round((completedPOs / purchaseOrders.length) * 100) : 100;

    return {
      totalOpenPOs,
      totalPendingPRs,
      totalPurchasesAmount,
      fulfillmentRate,
    };
  }, [purchaseOrders, purchaseRequisitions]);

  // Open Document Share Modal for a PO
  const handleSharePO = (po: PurchaseOrder) => {
    const vendor = vendors.find(v => v.id === po.vendorId);
    const shareData: DocumentShareData = {
      type: 'PURCHASE_ORDER',
      documentNumber: po.poNumber,
      date: po.date,
      dueDate: po.expectedDeliveryDate,
      recipientName: po.vendorName,
      recipientPhone: po.vendorPhone || vendor?.phone || '',
      amount: po.grandTotal,
      taxAmount: po.taxTotal,
      subtotal: po.subtotal,
      currency: po.currency,
      items: po.items.map(it => ({
        name: it.description,
        quantity: it.quantity,
        unitPrice: it.unitPrice,
        total: it.total,
      })),
      notes: po.notes,
    };

    setShareModalDoc(shareData);
    setIsShareModalOpen(true);
  };

  // --- 1. New Purchase Requisition State ---
  const [newPR, setNewPR] = useState<Partial<PurchaseRequisition>>({
    department: 'المستودعات واللوجستيات',
    costCenterId: costCenters[0]?.id || '',
    requesterName: 'سامي المعمري',
    requestDate: new Date().toISOString().split('T')[0],
    requiredDate: new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0],
    priority: 'MEDIUM',
    purpose: '',
    items: [],
    currency: 'YER',
  });

  const [prLineDraft, setPrLineDraft] = useState({
    itemId: '',
    description: '',
    quantity: 1,
    unit: 'قطعة',
    estimatedUnitPrice: 0,
  });

  const handleAddPRLine = () => {
    if (!prLineDraft.description && !prLineDraft.itemId) return;
    const selectedItem = inventoryItems.find(i => i.id === prLineDraft.itemId);
    const desc = prLineDraft.description || selectedItem?.nameAr || 'صنف جديد';
    const unit = prLineDraft.unit || selectedItem?.unit || 'قطعة';
    const unitPrice = prLineDraft.estimatedUnitPrice || selectedItem?.costPrice || 0;
    const total = unitPrice * prLineDraft.quantity;

    const newLine: PRLineItem = {
      id: `PRL-${Date.now().toString().slice(-4)}`,
      itemId: prLineDraft.itemId || undefined,
      itemCode: selectedItem?.code || 'GEN-01',
      description: desc,
      quantity: Number(prLineDraft.quantity),
      unit: unit,
      estimatedUnitPrice: unitPrice,
      estimatedTotal: total,
      requiredDate: newPR.requiredDate || new Date().toISOString().split('T')[0],
    };

    setNewPR(prev => ({
      ...prev,
      items: [...(prev.items || []), newLine],
    }));

    setPrLineDraft({
      itemId: '',
      description: '',
      quantity: 1,
      unit: 'قطعة',
      estimatedUnitPrice: 0,
    });
  };

  const handleSavePR = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPR.items || newPR.items.length === 0) {
      alert('يرجى إضافة بند واحد على الأقل في طلب الشراء.');
      return;
    }

    const totalEst = newPR.items.reduce((s, it) => s + it.estimatedTotal, 0);
    const createdPR: PurchaseRequisition = {
      id: `PR-${Date.now().toString().slice(-4)}`,
      prNumber: `PR-2026-0${purchaseRequisitions.length + 1}`,
      department: newPR.department || 'إدارة المشتريات',
      costCenterId: newPR.costCenterId || costCenters[0]?.id || 'CC-01',
      requesterName: newPR.requesterName || 'الموظف المسؤول',
      requestDate: newPR.requestDate || new Date().toISOString().split('T')[0],
      requiredDate: newPR.requiredDate || new Date().toISOString().split('T')[0],
      priority: (newPR.priority as any) || 'MEDIUM',
      purpose: newPR.purpose || 'طلب توريد وتوفير احتياجات',
      items: newPR.items,
      totalEstimatedAmount: totalEst,
      currency: newPR.currency || 'YER',
      status: 'SUBMITTED',
      notes: newPR.notes,
    };

    handleAddPRCallback(createdPR);
    setIsNewPRModalOpen(false);
  };

  // Convert PR to PO
  const handleConvertPRToPO = (pr: PurchaseRequisition) => {
    const matchedVendor = vendors[0];
    const poItems: POLineItem[] = pr.items.map((it, idx) => {
      const subtotal = it.estimatedUnitPrice * it.quantity;
      const taxAmount = subtotal * 0.05;
      return {
        id: `POL-${idx + 1}`,
        itemId: it.itemId,
        itemCode: it.itemCode || 'ITM-00',
        description: it.description,
        quantity: it.quantity,
        receivedQuantity: 0,
        unit: it.unit,
        unitPrice: it.estimatedUnitPrice,
        discountPercent: 0,
        taxRate: 5,
        taxAmount: taxAmount,
        subtotal: subtotal,
        total: subtotal + taxAmount,
      };
    });

    const subtotal = poItems.reduce((s, it) => s + it.subtotal, 0);
    const taxTotal = poItems.reduce((s, it) => s + it.taxAmount, 0);

    const generatedPO: PurchaseOrder = {
      id: `PO-${Date.now().toString().slice(-4)}`,
      poNumber: `PO-2026-0${purchaseOrders.length + 1}`,
      vendorId: matchedVendor?.id || 'VEND-001',
      vendorName: matchedVendor?.nameAr || 'المورد المعتمد',
      vendorTaxNumber: matchedVendor?.taxNumber,
      vendorPhone: matchedVendor?.phone,
      date: new Date().toISOString().split('T')[0],
      expectedDeliveryDate: pr.requiredDate,
      paymentTerms: 'آجل 30 يوماً من الاستلام',
      warehouseId: warehouses[0]?.id || 'WH-01',
      branchId: branches[0]?.id || 'BR-01',
      costCenterId: pr.costCenterId,
      prReference: pr.prNumber,
      items: poItems,
      subtotal: subtotal,
      discountTotal: 0,
      taxTotal: taxTotal,
      grandTotal: subtotal + taxTotal,
      currency: pr.currency,
      status: 'ISSUED',
      shippingAddress: warehouses[0]?.location || 'المستودع الرئيسي',
      notes: `تم إنشاء أمر الشراء استناداً لطلب الشراء رقم (${pr.prNumber}) - الغرض: ${pr.purpose}`,
      createdBy: 'مسؤول المشتريات والتوريدات',
    };

    onAddPurchaseOrder(generatedPO);
    handleUpdatePRCallback({ ...pr, status: 'ORDERED' });
    alert(`تم تحويل طلب الشراء (${pr.prNumber}) بنجاح إلى أمر شراء رسمي (${generatedPO.poNumber})!`);
    setActiveTab('PURCHASE_ORDERS');
  };

  // --- 2. New Purchase Order State ---
  const [poAttachments, setPoAttachments] = useState<string[]>([]);
  const [newPO, setNewPO] = useState<Partial<PurchaseOrder>>({
    vendorId: vendors[0]?.id || '',
    date: new Date().toISOString().split('T')[0],
    expectedDeliveryDate: new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0],
    paymentTerms: 'آجل 30 يوماً (Net 30)',
    warehouseId: warehouses[0]?.id || '',
    branchId: branches[0]?.id || '',
    items: [],
    currency: 'YER',
    shippingAddress: 'صنعاء - المستودع الرئيسي #1',
  });

  const [poLineDraft, setPoLineDraft] = useState({
    itemId: '',
    description: '',
    quantity: 1,
    unit: 'قطعة',
    unitPrice: 0,
    discountPercent: 0,
    taxRate: 5,
  });

  const handleAddPOLine = () => {
    if (!poLineDraft.description && !poLineDraft.itemId) return;
    const selectedItem = inventoryItems.find(i => i.id === poLineDraft.itemId);
    const desc = poLineDraft.description || selectedItem?.nameAr || 'صنف مورد';
    const unit = poLineDraft.unit || selectedItem?.unit || 'قطعة';
    const unitPrice = Number(poLineDraft.unitPrice) || selectedItem?.costPrice || 0;
    const quantity = Number(poLineDraft.quantity);
    const discount = (unitPrice * quantity * Number(poLineDraft.discountPercent)) / 100;
    const subtotal = (unitPrice * quantity) - discount;
    const taxAmount = (subtotal * Number(poLineDraft.taxRate)) / 100;
    const total = subtotal + taxAmount;

    const newLine: POLineItem = {
      id: `POL-${Date.now().toString().slice(-4)}`,
      itemId: poLineDraft.itemId || undefined,
      itemCode: selectedItem?.code || 'ITM-NEW',
      description: desc,
      quantity: quantity,
      receivedQuantity: 0,
      unit: unit,
      unitPrice: unitPrice,
      discountPercent: Number(poLineDraft.discountPercent),
      taxRate: Number(poLineDraft.taxRate),
      taxAmount: taxAmount,
      subtotal: subtotal,
      total: total,
    };

    setNewPO(prev => ({
      ...prev,
      items: [...(prev.items || []), newLine],
    }));

    setPoLineDraft({
      itemId: '',
      description: '',
      quantity: 1,
      unit: 'قطعة',
      unitPrice: 0,
      discountPercent: 0,
      taxRate: 5,
    });
  };

  const handleSavePO = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPO.items || newPO.items.length === 0) {
      alert('يرجى إضافة بند واحد على الأقل في أمر الشراء.');
      return;
    }

    const selectedVendor = vendors.find(v => v.id === newPO.vendorId) || vendors[0];
    const subtotal = newPO.items.reduce((s, it) => s + it.subtotal, 0);
    const taxTotal = newPO.items.reduce((s, it) => s + it.taxAmount, 0);
    const discountTotal = newPO.items.reduce((s, it) => s + (it.unitPrice * it.quantity * it.discountPercent / 100), 0);

    const createdPO: PurchaseOrder = {
      id: `PO-${Date.now().toString().slice(-4)}`,
      poNumber: `PO-2026-0${purchaseOrders.length + 1}`,
      vendorId: selectedVendor.id,
      vendorName: selectedVendor.nameAr,
      vendorTaxNumber: selectedVendor.taxNumber,
      vendorPhone: selectedVendor.phone,
      date: newPO.date || new Date().toISOString().split('T')[0],
      expectedDeliveryDate: newPO.expectedDeliveryDate || new Date().toISOString().split('T')[0],
      paymentTerms: newPO.paymentTerms || 'آجل',
      warehouseId: newPO.warehouseId || warehouses[0]?.id || 'WH-01',
      branchId: newPO.branchId || branches[0]?.id || 'BR-01',
      costCenterId: costCenters[0]?.id,
      items: newPO.items,
      subtotal: subtotal,
      discountTotal: discountTotal,
      taxTotal: taxTotal,
      grandTotal: subtotal + taxTotal,
      currency: newPO.currency || 'YER',
      status: 'ISSUED',
      shippingAddress: newPO.shippingAddress || warehouses[0]?.location || 'المستودع الرئيسي',
      notes: newPO.notes,
      attachments: poAttachments,
      createdBy: 'مسؤول المشتريات والتوريدات',
    };

    onAddPurchaseOrder(createdPO);
    setPoAttachments([]);
    setIsNewPOModalOpen(false);
  };

  // --- 3. Receive Goods (Create GRN from PO) ---
  const handleOpenGRNModal = (po: PurchaseOrder) => {
    setSelectedPOForGRN(po);
    setIsNewGRNModalOpen(true);
  };

  const handleSaveGRN = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPOForGRN) return;

    const grnItems = selectedPOForGRN.items.map(it => ({
      itemId: it.itemId || 'GEN-01',
      itemCode: it.itemCode,
      itemName: it.description,
      orderedQty: it.quantity,
      receivedQty: it.quantity, // Full receipt
      unit: it.unit,
      unitCost: it.unitPrice,
      totalCost: it.subtotal,
    }));

    const createdGRN: GoodsReceiptNote = {
      id: `GRN-${Date.now().toString().slice(-4)}`,
      grnNumber: `GRN-2026-0${goodsReceiptNotes.length + 1}`,
      poId: selectedPOForGRN.id,
      poNumber: selectedPOForGRN.poNumber,
      vendorId: selectedPOForGRN.vendorId,
      vendorName: selectedPOForGRN.vendorName,
      warehouseId: selectedPOForGRN.warehouseId,
      deliveryNoteNumber: `DN-${Math.floor(10000 + Math.random() * 90000)}`,
      date: new Date().toISOString().split('T')[0],
      receivedBy: 'أمين المستودع الرئيسي',
      items: grnItems,
      totalAmount: selectedPOForGRN.subtotal,
      status: 'ACCEPTED',
      stockMovementId: `MIGO-GR-${Date.now().toString().slice(-4)}`,
      notes: `تم استلام الشحنة كاملة ومطابقتها لأمر الشراء ${selectedPOForGRN.poNumber}`,
    };

    handleAddGRNCallback(createdGRN);

    // Update PO status to COMPLETED
    const updatedPO: PurchaseOrder = {
      ...selectedPOForGRN,
      status: 'COMPLETED',
      items: selectedPOForGRN.items.map(it => ({ ...it, receivedQuantity: it.quantity })),
      goodsReceiptIds: [...(selectedPOForGRN.goodsReceiptIds || []), createdGRN.grnNumber],
    };
    handleUpdatePOCallback(updatedPO);

    setIsNewGRNModalOpen(false);
    setSelectedPOForGRN(null);
    alert(`تم إصدار سند استلام البضائع (${createdGRN.grnNumber}) وإدخال الكميات للمستودع وتحديث أمر الشراء بنجاح!`);
    setActiveTab('GOODS_RECEIPTS');
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300" dir="rtl">
      {/* Top Header Card */}
      <div className="bg-white p-6 rounded-2xl shadow-xs border border-slate-200">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600">
              <ShoppingBag className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold text-slate-900">إدارة المشتريات وطلبات الشراء</h1>
                <span className="text-xs bg-blue-100 text-blue-800 px-2.5 py-0.5 rounded-full font-mono font-bold">
                  MM-PUR / S/4
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                دورة المشتريات الشاملة: طلبات الشراء، أوامر الشراء، فحص واستلام البضائع، ومقارنة عروض الأسعار
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={() => setIsNewPRModalOpen(true)}
              className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold rounded-xl flex items-center gap-2 border border-slate-300 transition-colors"
            >
              <Plus className="w-4 h-4 text-blue-600" />
              <span>طلب شراء جديد (PR)</span>
            </button>

            <button
              onClick={() => setIsNewPOModalOpen(true)}
              className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl flex items-center gap-2 shadow-sm shadow-blue-600/20 transition-all hover:scale-[1.02]"
            >
              <Plus className="w-4 h-4" />
              <span>إنشاء أمر شراء (PO)</span>
            </button>
          </div>
        </div>

        {/* 4 KPI Summary Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6 pt-6 border-t border-slate-100">
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
            <div className="flex items-center justify-between text-slate-500 mb-1">
              <span className="text-xs font-medium">أوامر الشراء المفتوحة</span>
              <Truck className="w-4 h-4 text-blue-600" />
            </div>
            <div className="text-2xl font-bold text-slate-900 font-mono">{metrics.totalOpenPOs}</div>
            <p className="text-[10px] text-blue-600 mt-1 font-medium">قيد التوريد والشحن</p>
          </div>

          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
            <div className="flex items-center justify-between text-slate-500 mb-1">
              <span className="text-xs font-medium">طلبات شراء معلقة</span>
              <Clock className="w-4 h-4 text-amber-600" />
            </div>
            <div className="text-2xl font-bold text-slate-900 font-mono">{metrics.totalPendingPRs}</div>
            <p className="text-[10px] text-amber-600 mt-1 font-medium">بانتظار الاعتماد والموافقة</p>
          </div>

          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
            <div className="flex items-center justify-between text-slate-500 mb-1">
              <span className="text-xs font-medium">إجمالي قيمة المشتريات</span>
              <DollarSign className="w-4 h-4 text-emerald-600" />
            </div>
            <div className="text-xl font-bold text-slate-900 font-mono">
              {formatCurrency(convertAmount(metrics.totalPurchasesAmount, 'YER', currency, rates), currency)}
            </div>
            <p className="text-[10px] text-emerald-600 mt-1 font-medium">إجمالي العقود والأوامر الصادرة</p>
          </div>

          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
            <div className="flex items-center justify-between text-slate-500 mb-1">
              <span className="text-xs font-medium">نسبة اكتمال التوريد</span>
              <CheckCircle2 className="w-4 h-4 text-purple-600" />
            </div>
            <div className="text-2xl font-bold text-slate-900 font-mono">{metrics.fulfillmentRate}%</div>
            <p className="text-[10px] text-purple-600 mt-1 font-medium">معدل كفاءة الموردين</p>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2 overflow-x-auto">
        <button
          onClick={() => setActiveTab('PURCHASE_ORDERS')}
          className={`px-4 py-2.5 text-xs font-bold rounded-xl transition-all flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'PURCHASE_ORDERS'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Truck className="w-4 h-4" />
          <span>أوامر الشراء (PO) ({purchaseOrders.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('REQUISITIONS')}
          className={`px-4 py-2.5 text-xs font-bold rounded-xl transition-all flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'REQUISITIONS'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>طلبات الشراء والاحتياج (PR) ({purchaseRequisitions.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('GOODS_RECEIPTS')}
          className={`px-4 py-2.5 text-xs font-bold rounded-xl transition-all flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'GOODS_RECEIPTS'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Package className="w-4 h-4" />
          <span>سندات استلام البضائع (GRN) ({goodsReceiptNotes.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('RFQ_COMPARISON')}
          className={`px-4 py-2.5 text-xs font-bold rounded-xl transition-all flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'RFQ_COMPARISON'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>مقارنة عروض أسعار الموردين (RFQ)</span>
        </button>
      </div>

      {/* TAB 1: PURCHASE ORDERS */}
      {activeTab === 'PURCHASE_ORDERS' && (
        <div className="bg-white rounded-2xl shadow-xs border border-slate-200 overflow-hidden">
          <div className="p-4 bg-slate-50 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 text-slate-400 absolute right-3 top-2.5" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="بحث برقم أمر الشراء، المورد، أو الملاحظات..."
                className="w-full text-xs pr-9 pl-4 py-2 rounded-xl border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="flex items-center gap-2">
              <select
                value={statusFilter}
                onChange={e => setStatusFilter(e.target.value)}
                className="text-xs px-3 py-2 rounded-xl border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="ALL">جميع الحالات</option>
                <option value="ISSUED">صادر (قيد التوريد)</option>
                <option value="COMPLETED">مكتمل الاستلام</option>
                <option value="DRAFT">مسودة</option>
              </select>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs">
              <thead className="bg-slate-100/80 text-slate-700 font-bold border-b border-slate-200">
                <tr>
                  <th className="py-3.5 px-4">رقم أمر الشراء</th>
                  <th className="py-3.5 px-4">المورد المعتمد</th>
                  <th className="py-3.5 px-4">تاريخ الطلب</th>
                  <th className="py-3.5 px-4">تاريخ التوريد المتوقع</th>
                  <th className="py-3.5 px-4">شروط السداد</th>
                  <th className="py-3.5 px-4">إجمالي المبلغ</th>
                  <th className="py-3.5 px-4">حالة التوريد</th>
                  <th className="py-3.5 px-4 text-center">إجراءات ومشاركة</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 text-slate-800">
                {purchaseOrders
                  .filter(p => {
                    const matchQuery =
                      p.poNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
                      p.vendorName.toLowerCase().includes(searchQuery.toLowerCase());
                    const matchStatus = statusFilter === 'ALL' || p.status === statusFilter;
                    return matchQuery && matchStatus;
                  })
                  .map(po => (
                    <tr key={po.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-4 font-mono font-bold text-blue-600 flex items-center gap-1.5">
                        <Truck className="w-3.5 h-3.5 text-slate-400" />
                        <span>{po.poNumber}</span>
                      </td>
                      <td className="py-3 px-4 font-medium">{po.vendorName}</td>
                      <td className="py-3 px-4 font-mono text-slate-600">{po.date}</td>
                      <td className="py-3 px-4 font-mono text-slate-600">{po.expectedDeliveryDate}</td>
                      <td className="py-3 px-4 text-slate-600">{po.paymentTerms}</td>
                      <td className="py-3 px-4 font-mono font-bold text-slate-900">
                        {formatCurrency(convertAmount(po.grandTotal, po.currency, currency, rates), currency)}
                      </td>
                      <td className="py-3 px-4">
                        {po.status === 'COMPLETED' ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                            <Check className="w-3 h-3" />
                            <span>مكتمل الاستلام</span>
                          </span>
                        ) : po.status === 'ISSUED' ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-blue-100 text-blue-800 border border-blue-200">
                            <Clock className="w-3 h-3" />
                            <span>صادر للمورد</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-slate-100 text-slate-700">
                            {po.status}
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          {/* Share via WhatsApp & SMS */}
                          <button
                            type="button"
                            onClick={() => handleSharePO(po)}
                            title="مشاركة أمر الشراء عبر الواتساب والرسائل النصية"
                            className="p-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-lg transition-colors"
                          >
                            <Share2 className="w-3.5 h-3.5" />
                          </button>

                          {/* Create GRN if not completed */}
                          {po.status !== 'COMPLETED' && (
                            <button
                              type="button"
                              onClick={() => handleOpenGRNModal(po)}
                              title="استلام البضاعة بالمستودع (GRN)"
                              className="p-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded-lg transition-colors flex items-center gap-1 text-[10px] font-bold"
                            >
                              <Package className="w-3.5 h-3.5" />
                              <span>استلام</span>
                            </button>
                          )}

                          {/* View PO Details */}
                          <button
                            type="button"
                            onClick={() => setViewingPO(po)}
                            title="معاينة أمر الشراء"
                            className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-colors"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 2: REQUISITIONS (PR) */}
      {activeTab === 'REQUISITIONS' && (
        <div className="bg-white rounded-2xl shadow-xs border border-slate-200 overflow-hidden">
          <div className="p-4 bg-slate-50 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 text-slate-400 absolute right-3 top-2.5" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="بحث برقم طلب الشراء، القسم، أو مقدم الطلب..."
                className="w-full text-xs pr-9 pl-4 py-2 rounded-xl border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <button
              onClick={() => setIsNewPRModalOpen(true)}
              className="px-3 py-1.5 bg-blue-600 text-white rounded-lg text-xs font-bold hover:bg-blue-700 flex items-center gap-1.5 self-end sm:self-auto"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>طلب شراء جديد</span>
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs">
              <thead className="bg-slate-100/80 text-slate-700 font-bold border-b border-slate-200">
                <tr>
                  <th className="py-3.5 px-4">رقم الطلب</th>
                  <th className="py-3.5 px-4">القسم / الإدارة</th>
                  <th className="py-3.5 px-4">مقدم الطلب</th>
                  <th className="py-3.5 px-4">تاريخ الطلب</th>
                  <th className="py-3.5 px-4">التاريخ المطلوب</th>
                  <th className="py-3.5 px-4">الأولوية</th>
                  <th className="py-3.5 px-4">المبلغ التقديري</th>
                  <th className="py-3.5 px-4">الحالة</th>
                  <th className="py-3.5 px-4 text-center">الإجراء</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 text-slate-800">
                {purchaseRequisitions
                  .filter(pr => {
                    const q = searchQuery.toLowerCase();
                    return (
                      pr.prNumber.toLowerCase().includes(q) ||
                      pr.department.toLowerCase().includes(q) ||
                      pr.requesterName.toLowerCase().includes(q) ||
                      (pr.purpose && pr.purpose.toLowerCase().includes(q))
                    );
                  })
                  .map(pr => (
                  <tr key={pr.id} className="hover:bg-slate-50/80">
                    <td className="py-3 px-4 font-mono font-bold text-blue-600">{pr.prNumber}</td>
                    <td className="py-3 px-4 font-medium">{pr.department}</td>
                    <td className="py-3 px-4 text-slate-600">{pr.requesterName}</td>
                    <td className="py-3 px-4 font-mono text-slate-600">{pr.requestDate}</td>
                    <td className="py-3 px-4 font-mono text-slate-600">{pr.requiredDate}</td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        pr.priority === 'URGENT' || pr.priority === 'HIGH'
                          ? 'bg-rose-100 text-rose-800 border border-rose-200'
                          : 'bg-slate-100 text-slate-700'
                      }`}>
                        {pr.priority === 'HIGH' ? 'عالية' : pr.priority === 'URGENT' ? 'طارئة' : 'عادية'}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-mono font-bold">
                      {formatCurrency(convertAmount(pr.totalEstimatedAmount, pr.currency, currency, rates), currency)}
                    </td>
                    <td className="py-3 px-4">
                      {pr.status === 'ORDERED' ? (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                          تم إصدار أمر الشراء
                        </span>
                      ) : pr.status === 'APPROVED' ? (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800">
                          معتمد
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800">
                          قيد المراجعة
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-center">
                      {pr.status !== 'ORDERED' && (
                        <button
                          type="button"
                          onClick={() => handleConvertPRToPO(pr)}
                          className="px-2.5 py-1 bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 rounded-lg text-[10px] font-bold transition-colors"
                        >
                          تحويل لأمر شراء
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: GOODS RECEIPTS (GRN) */}
      {activeTab === 'GOODS_RECEIPTS' && (
        <div className="bg-white rounded-2xl shadow-xs border border-slate-200 overflow-hidden">
          <div className="p-4 bg-slate-50 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 text-slate-400 absolute right-3 top-2.5" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="بحث برقم سند الاستلام، رقم أمر الشراء، المورد، أو المستلم..."
                className="w-full text-xs pr-9 pl-4 py-2 rounded-xl border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <span className="text-xs text-slate-500 font-bold">
              إجمالي سندات الاستلام: {goodsReceiptNotes.length}
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs">
              <thead className="bg-slate-100/80 text-slate-700 font-bold border-b border-slate-200">
                <tr>
                  <th className="py-3.5 px-4">رقم سند الاستلام</th>
                  <th className="py-3.5 px-4">رقم أمر الشراء</th>
                  <th className="py-3.5 px-4">المورد</th>
                  <th className="py-3.5 px-4">المستودع المستلم</th>
                  <th className="py-3.5 px-4">رقم إشعار التوصيل</th>
                  <th className="py-3.5 px-4">تاريخ الاستلام</th>
                  <th className="py-3.5 px-4">المستلم</th>
                  <th className="py-3.5 px-4">إجمالي القيمة</th>
                  <th className="py-3.5 px-4">الحالة</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 text-slate-800">
                {goodsReceiptNotes
                  .filter(grn => {
                    const q = searchQuery.toLowerCase();
                    return (
                      grn.grnNumber.toLowerCase().includes(q) ||
                      grn.poNumber.toLowerCase().includes(q) ||
                      grn.vendorName.toLowerCase().includes(q) ||
                      (grn.receivedBy && grn.receivedBy.toLowerCase().includes(q)) ||
                      (grn.deliveryNoteNumber && grn.deliveryNoteNumber.toLowerCase().includes(q))
                    );
                  })
                  .map(grn => (
                  <tr key={grn.id} className="hover:bg-slate-50/80">
                    <td className="py-3 px-4 font-mono font-bold text-blue-600">{grn.grnNumber}</td>
                    <td className="py-3 px-4 font-mono text-slate-600">{grn.poNumber}</td>
                    <td className="py-3 px-4 font-medium">{grn.vendorName}</td>
                    <td className="py-3 px-4">{warehouses.find(w => w.id === grn.warehouseId)?.nameAr || 'المستودع الرئيسي'}</td>
                    <td className="py-3 px-4 font-mono text-slate-600">{grn.deliveryNoteNumber}</td>
                    <td className="py-3 px-4 font-mono text-slate-600">{grn.date}</td>
                    <td className="py-3 px-4 text-slate-600">{grn.receivedBy}</td>
                    <td className="py-3 px-4 font-mono font-bold">
                      {formatCurrency(convertAmount(grn.totalAmount, 'YER', currency, rates), currency)}
                    </td>
                    <td className="py-3 px-4">
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                        تم الفحص والإدخال للمخزون
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 4: RFQ VENDOR COMPARISON */}
      {activeTab === 'RFQ_COMPARISON' && (
        <div className="bg-white p-6 rounded-2xl shadow-xs border border-slate-200 space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-900">مقارنة عروض أسعار الموردين (Vendor Quotation Analysis)</h3>
              <p className="text-xs text-slate-500">تحليل العروض المالية والفنية واختيار المورد الأنسب للمنشأة</p>
            </div>
            <span className="text-xs bg-purple-100 text-purple-800 font-bold px-3 py-1 rounded-full">
              RFQ-2026-COMP-01
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Supplier 1 */}
            <div className="p-4 rounded-xl border-2 border-emerald-500 bg-emerald-50/40 relative">
              <span className="absolute top-3 left-3 text-[10px] font-bold bg-emerald-600 text-white px-2 py-0.5 rounded-full">
                العرض الفائز الأفضل
              </span>
              <h4 className="text-xs font-bold text-slate-900">مؤسسة النور للإلكترونيات والتوريدات</h4>
              <p className="text-[10px] text-slate-500 mt-0.5">صنعاء - موزع معتمد مع ضمان سنتين</p>
              
              <div className="mt-4 space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-500">السعر الإجمالي:</span>
                  <span className="font-bold text-slate-900 font-mono">6,400,000 ريال</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">مدة التوريد:</span>
                  <span className="font-medium text-emerald-700">خلال 3 أيام عمل</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">شروط السداد:</span>
                  <span className="font-medium text-slate-700">آجل 30 يوماً</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">تقييم الجودة:</span>
                  <span className="font-bold text-emerald-600">9.8 / 10</span>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-emerald-200 flex items-center justify-between">
                <span className="text-[10px] font-bold text-emerald-800">الحالة: تم الترسية والاعتماد</span>
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              </div>
            </div>

            {/* Supplier 2 */}
            <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/60">
              <h4 className="text-xs font-bold text-slate-900">شركة التقنية الحديثة للتجهيزات</h4>
              <p className="text-[10px] text-slate-500 mt-0.5">عدن - توريدات مكتبية وتقنية</p>
              
              <div className="mt-4 space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-500">السعر الإجمالي:</span>
                  <span className="font-bold text-slate-900 font-mono">6,850,000 ريال</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">مدة التوريد:</span>
                  <span className="font-medium text-slate-700">خلال 7 أيام</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">شروط السداد:</span>
                  <span className="font-medium text-slate-700">دفعة 50% مقدماً</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">تقييم الجودة:</span>
                  <span className="font-bold text-slate-700">9.0 / 10</span>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-200 text-[10px] text-slate-500">
                عرض احتياطي مؤهل
              </div>
            </div>

            {/* Supplier 3 */}
            <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/60">
              <h4 className="text-xs font-bold text-slate-900">مؤسسة الشرق الأوسط للتجارة الدولية</h4>
              <p className="text-[10px] text-slate-500 mt-0.5">الحديدة - استيراد مباشر</p>
              
              <div className="mt-4 space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-500">السعر الإجمالي:</span>
                  <span className="font-bold text-slate-900 font-mono">7,100,000 ريال</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">مدة التوريد:</span>
                  <span className="font-medium text-slate-700">خلال 14 يوماً</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">شروط السداد:</span>
                  <span className="font-medium text-slate-700">نقداً عند التسليم</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">تقييم الجودة:</span>
                  <span className="font-bold text-slate-700">8.5 / 10</span>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-200 text-[10px] text-slate-500">
                السعر أعلى وفترة التوريد أطول
              </div>
            </div>
          </div>
        </div>
      )}

      {/* --- MODAL 1: NEW PURCHASE ORDER --- */}
      {isNewPOModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs" dir="rtl">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in">
            <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2 font-bold text-base">
                <Truck className="w-5 h-5 text-blue-400" />
                <span>إنشاء أمر شراء وتوريد رسمي جديد (Purchase Order)</span>
              </div>
              <button onClick={() => setIsNewPOModalOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSavePO} className="flex-1 overflow-y-auto p-6 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">المورد المعتمد:</label>
                  <select
                    value={newPO.vendorId}
                    onChange={e => setNewPO({ ...newPO, vendorId: e.target.value })}
                    className="w-full text-xs px-3 py-2 rounded-lg border border-slate-300 bg-white"
                  >
                    {vendors.map(v => (
                      <option key={v.id} value={v.id}>{v.nameAr} - {v.code}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">تاريخ أمر الشراء:</label>
                  <input
                    type="date"
                    value={newPO.date}
                    onChange={e => setNewPO({ ...newPO, date: e.target.value })}
                    className="w-full text-xs px-3 py-2 rounded-lg border border-slate-300 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">تاريخ التوريد المتوقع:</label>
                  <input
                    type="date"
                    value={newPO.expectedDeliveryDate}
                    onChange={e => setNewPO({ ...newPO, expectedDeliveryDate: e.target.value })}
                    className="w-full text-xs px-3 py-2 rounded-lg border border-slate-300 font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">مستودع الاستلام:</label>
                  <select
                    value={newPO.warehouseId}
                    onChange={e => setNewPO({ ...newPO, warehouseId: e.target.value })}
                    className="w-full text-xs px-3 py-2 rounded-lg border border-slate-300 bg-white"
                  >
                    {warehouses.map(w => (
                      <option key={w.id} value={w.id}>{w.nameAr} ({w.location})</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">شروط السداد:</label>
                  <input
                    type="text"
                    value={newPO.paymentTerms}
                    onChange={e => setNewPO({ ...newPO, paymentTerms: e.target.value })}
                    placeholder="مثال: آجل 30 يوماً / دفعة 50%..."
                    className="w-full text-xs px-3 py-2 rounded-lg border border-slate-300"
                  />
                </div>
              </div>

              {/* Add Line Items Section */}
              <div className="pt-3 border-t border-slate-200">
                <h4 className="text-xs font-bold text-slate-800 mb-2">أصناف وبنود أمر الشراء:</h4>
                <div className="grid grid-cols-1 sm:grid-cols-12 gap-2 bg-slate-50 p-3 rounded-xl border border-slate-200 mb-3">
                  <div className="sm:col-span-5">
                    <label className="block text-[10px] text-slate-500 mb-1">الصنف من المخزون:</label>
                    <select
                      value={poLineDraft.itemId}
                      onChange={e => {
                        const itm = inventoryItems.find(i => i.id === e.target.value);
                        setPoLineDraft({
                          ...poLineDraft,
                          itemId: e.target.value,
                          description: itm?.nameAr || '',
                          unit: itm?.unit || 'قطعة',
                          unitPrice: itm?.costPrice || 0,
                        });
                      }}
                      className="w-full text-xs px-2 py-1.5 rounded-lg border border-slate-300 bg-white"
                    >
                      <option value="">-- اختر صنفاً أو اكتب الوصف --</option>
                      {inventoryItems.map(i => (
                        <option key={i.id} value={i.id}>{i.nameAr} ({i.code})</option>
                      ))}
                    </select>
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-[10px] text-slate-500 mb-1">الكمية:</label>
                    <input
                      type="number"
                      min="1"
                      value={poLineDraft.quantity}
                      onChange={e => setPoLineDraft({ ...poLineDraft, quantity: Number(e.target.value) })}
                      className="w-full text-xs px-2 py-1.5 rounded-lg border border-slate-300 font-mono"
                    />
                  </div>

                  <div className="sm:col-span-3">
                    <label className="block text-[10px] text-slate-500 mb-1">سعر الشراء:</label>
                    <input
                      type="number"
                      value={poLineDraft.unitPrice}
                      onChange={e => setPoLineDraft({ ...poLineDraft, unitPrice: Number(e.target.value) })}
                      className="w-full text-xs px-2 py-1.5 rounded-lg border border-slate-300 font-mono"
                    />
                  </div>

                  <div className="sm:col-span-2 flex items-end">
                    <button
                      type="button"
                      onClick={handleAddPOLine}
                      className="w-full py-1.5 bg-blue-600 text-white rounded-lg text-xs font-bold hover:bg-blue-700"
                    >
                      + إضافة
                    </button>
                  </div>
                </div>

                {/* Table of added PO items */}
                {newPO.items && newPO.items.length > 0 && (
                  <div className="overflow-x-auto border border-slate-200 rounded-xl">
                    <table className="w-full text-right text-xs">
                      <thead className="bg-slate-100 text-slate-700 font-bold">
                        <tr>
                          <th className="p-2">الصنف</th>
                          <th className="p-2">الكمية</th>
                          <th className="p-2">السعر</th>
                          <th className="p-2">الضريبة 5%</th>
                          <th className="p-2">الإجمالي</th>
                          <th className="p-2 text-center">حذف</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200">
                        {newPO.items.map((it, idx) => (
                          <tr key={idx}>
                            <td className="p-2 font-medium">{it.description}</td>
                            <td className="p-2 font-mono">{it.quantity} {it.unit}</td>
                            <td className="p-2 font-mono">{formatCurrency(it.unitPrice, 'YER')}</td>
                            <td className="p-2 font-mono">{formatCurrency(it.taxAmount, 'YER')}</td>
                            <td className="p-2 font-mono font-bold">{formatCurrency(it.total, 'YER')}</td>
                            <td className="p-2 text-center">
                              <button
                                type="button"
                                onClick={() => setNewPO(p => ({ ...p, items: p.items?.filter((_, i) => i !== idx) }))}
                                className="text-rose-600 hover:text-rose-800"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">ملاحظات وشروط خاصة:</label>
                <textarea
                  value={newPO.notes || ''}
                  onChange={e => setNewPO({ ...newPO, notes: e.target.value })}
                  placeholder="ملاحظات الشحن أو مكان التسليم..."
                  rows={2}
                  className="w-full text-xs p-3 rounded-lg border border-slate-300"
                />
              </div>

              {/* Document Archiver / Camera Capture */}
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                <DocumentArchiver
                  attachments={poAttachments}
                  onChange={setPoAttachments}
                  title="أرشفة المستندات الورقية والعقود لأمر الشراء"
                />
              </div>

              <div className="pt-4 border-t border-slate-200 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsNewPOModalOpen(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-xs"
                >
                  حفظ وإصدار أمر الشراء
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- MODAL 2: NEW REQUISITION (PR) --- */}
      {isNewPRModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs" dir="rtl">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in">
            <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2 font-bold text-base">
                <FileText className="w-5 h-5 text-blue-400" />
                <span>طلب شراء واحتياج داخلي جديد (Purchase Requisition)</span>
              </div>
              <button onClick={() => setIsNewPRModalOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSavePR} className="flex-1 overflow-y-auto p-6 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">القسم الطالب:</label>
                  <input
                    type="text"
                    value={newPR.department}
                    onChange={e => setNewPR({ ...newPR, department: e.target.value })}
                    className="w-full text-xs px-3 py-2 rounded-lg border border-slate-300"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">اسم مقدم الطلب:</label>
                  <input
                    type="text"
                    value={newPR.requesterName}
                    onChange={e => setNewPR({ ...newPR, requesterName: e.target.value })}
                    className="w-full text-xs px-3 py-2 rounded-lg border border-slate-300"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">الأولوية:</label>
                  <select
                    value={newPR.priority}
                    onChange={e => setNewPR({ ...newPR, priority: e.target.value as any })}
                    className="w-full text-xs px-3 py-2 rounded-lg border border-slate-300 bg-white"
                  >
                    <option value="LOW">منخفضة</option>
                    <option value="MEDIUM">متوسطة</option>
                    <option value="HIGH">عالية</option>
                    <option value="URGENT">طارئة وعاجلة</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">الغرض ومبررات الطلب:</label>
                <input
                  type="text"
                  value={newPR.purpose || ''}
                  onChange={e => setNewPR({ ...newPR, purpose: e.target.value })}
                  placeholder="مثال: إعادة تموين المستودع / مستلزمات فرع جديد..."
                  className="w-full text-xs px-3 py-2 rounded-lg border border-slate-300"
                />
              </div>

              {/* Items Section */}
              <div className="pt-3 border-t border-slate-200">
                <h4 className="text-xs font-bold text-slate-800 mb-2">الأصناف والكميات المطلوبة:</h4>
                <div className="grid grid-cols-1 sm:grid-cols-12 gap-2 bg-slate-50 p-3 rounded-xl border border-slate-200 mb-3">
                  <div className="sm:col-span-5">
                    <input
                      type="text"
                      placeholder="وصف الصنف / المادة..."
                      value={prLineDraft.description}
                      onChange={e => setPrLineDraft({ ...prLineDraft, description: e.target.value })}
                      className="w-full text-xs px-2 py-1.5 rounded-lg border border-slate-300"
                    />
                  </div>
                  <div className="sm:col-span-3">
                    <input
                      type="number"
                      min="1"
                      placeholder="الكمية"
                      value={prLineDraft.quantity}
                      onChange={e => setPrLineDraft({ ...prLineDraft, quantity: Number(e.target.value) })}
                      className="w-full text-xs px-2 py-1.5 rounded-lg border border-slate-300 font-mono"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <input
                      type="number"
                      placeholder="السعر التقديري"
                      value={prLineDraft.estimatedUnitPrice || ''}
                      onChange={e => setPrLineDraft({ ...prLineDraft, estimatedUnitPrice: Number(e.target.value) })}
                      className="w-full text-xs px-2 py-1.5 rounded-lg border border-slate-300 font-mono"
                    />
                  </div>
                  <div className="sm:col-span-2 flex items-end">
                    <button
                      type="button"
                      onClick={handleAddPRLine}
                      className="w-full py-1.5 bg-blue-600 text-white rounded-lg text-xs font-bold"
                    >
                      + إضافة
                    </button>
                  </div>
                </div>

                {newPR.items && newPR.items.length > 0 && (
                  <div className="border border-slate-200 rounded-xl overflow-hidden">
                    <table className="w-full text-right text-xs">
                      <thead className="bg-slate-100 text-slate-700 font-bold">
                        <tr>
                          <th className="p-2">الصنف</th>
                          <th className="p-2">الكمية</th>
                          <th className="p-2">السعر التقديري</th>
                          <th className="p-2">الإجمالي</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200">
                        {newPR.items.map((it, idx) => (
                          <tr key={idx}>
                            <td className="p-2">{it.description}</td>
                            <td className="p-2 font-mono">{it.quantity} {it.unit}</td>
                            <td className="p-2 font-mono">{formatCurrency(it.estimatedUnitPrice, 'YER')}</td>
                            <td className="p-2 font-mono font-bold">{formatCurrency(it.estimatedTotal, 'YER')}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              <div className="pt-4 border-t border-slate-200 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsNewPRModalOpen(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-xs"
                >
                  رفع طلب الشراء للاعتماد
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- MODAL 3: RECEIVE GOODS (GRN) --- */}
      {isNewGRNModalOpen && selectedPOForGRN && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs" dir="rtl">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-xl overflow-hidden animate-in fade-in">
            <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2 font-bold text-base">
                <Package className="w-5 h-5 text-emerald-400" />
                <span>إثبات استلام بضاعة بالمستودع (Goods Receipt Note)</span>
              </div>
              <button onClick={() => setIsNewGRNModalOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveGRN} className="p-6 space-y-4 text-xs">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1.5">
                <div className="flex justify-between">
                  <span className="text-slate-500">رقم أمر الشراء:</span>
                  <span className="font-bold text-blue-600 font-mono">{selectedPOForGRN.poNumber}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">المورد:</span>
                  <span className="font-bold text-slate-900">{selectedPOForGRN.vendorName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">المستودع المستلم:</span>
                  <span className="font-bold text-slate-900">
                    {warehouses.find(w => w.id === selectedPOForGRN.warehouseId)?.nameAr || 'المستودع الرئيسي'}
                  </span>
                </div>
              </div>

              <div>
                <h4 className="font-bold text-slate-800 mb-2">الأصناف المستلمة والمفحوصة:</h4>
                <div className="border border-slate-200 rounded-xl overflow-hidden">
                  <table className="w-full text-right">
                    <thead className="bg-slate-100 text-slate-700 font-bold">
                      <tr>
                        <th className="p-2">الصنف</th>
                        <th className="p-2">الكمية المطلوبة</th>
                        <th className="p-2">الكمية المستلمة</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {selectedPOForGRN.items.map((it, idx) => (
                        <tr key={idx}>
                          <td className="p-2 font-medium">{it.description}</td>
                          <td className="p-2 font-mono">{it.quantity} {it.unit}</td>
                          <td className="p-2 font-mono text-emerald-700 font-bold">
                            {it.quantity} {it.unit} (مطابق بالكامل)
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 flex items-center gap-2 text-xs">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>سيتم تحديث أرصدة المستودع تلقائياً وتوليد حركة مخزنية رسمية (MIGO).</span>
              </div>

              <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsNewGRNModalOpen(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-xs"
                >
                  تأكيد استلام البضاعة وإدخال المخزون
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- MODAL 4: VIEW PO DETAILS --- */}
      {viewingPO && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs" dir="rtl">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-2xl overflow-hidden animate-in fade-in">
            <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2 font-bold text-base">
                <Truck className="w-5 h-5 text-blue-400" />
                <span>تفاصيل أمر الشراء ({viewingPO.poNumber})</span>
              </div>
              <button onClick={() => setViewingPO(null)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3 p-4 bg-slate-50 rounded-xl border border-slate-200">
                <div>
                  <span className="text-slate-500 block">المورد:</span>
                  <span className="font-bold text-slate-900">{viewingPO.vendorName}</span>
                </div>
                <div>
                  <span className="text-slate-500 block">هاتف المورد:</span>
                  <span className="font-mono text-slate-800">{viewingPO.vendorPhone || 'غير مسجل'}</span>
                </div>
                <div>
                  <span className="text-slate-500 block">تاريخ الإصدار:</span>
                  <span className="font-mono text-slate-800">{viewingPO.date}</span>
                </div>
                <div>
                  <span className="text-slate-500 block">تاريخ التوريد المتوقع:</span>
                  <span className="font-mono text-slate-800">{viewingPO.expectedDeliveryDate}</span>
                </div>
              </div>

              <div>
                <h4 className="font-bold text-slate-800 mb-2">الأصناف:</h4>
                <div className="border border-slate-200 rounded-xl overflow-hidden">
                  <table className="w-full text-right text-xs">
                    <thead className="bg-slate-100 text-slate-700 font-bold">
                      <tr>
                        <th className="p-2">الصنف</th>
                        <th className="p-2">الكمية</th>
                        <th className="p-2">السعر</th>
                        <th className="p-2">الإجمالي</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {viewingPO.items.map((it, idx) => (
                        <tr key={idx}>
                          <td className="p-2 font-medium">{it.description}</td>
                          <td className="p-2 font-mono">{it.quantity} {it.unit}</td>
                          <td className="p-2 font-mono">{formatCurrency(it.unitPrice, viewingPO.currency)}</td>
                          <td className="p-2 font-mono font-bold">{formatCurrency(it.total, viewingPO.currency)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="flex justify-end p-3 bg-slate-50 rounded-xl border border-slate-200 font-mono">
                <div className="space-y-1 text-left">
                  <div className="flex justify-between gap-8 text-slate-600">
                    <span>المبلغ قبل الضريبة:</span>
                    <span>{formatCurrency(viewingPO.subtotal, viewingPO.currency)}</span>
                  </div>
                  <div className="flex justify-between gap-8 text-slate-600">
                    <span>ضريبة القيمة المضافة:</span>
                    <span>{formatCurrency(viewingPO.taxTotal, viewingPO.currency)}</span>
                  </div>
                  <div className="flex justify-between gap-8 font-bold text-slate-900 text-sm pt-1 border-t border-slate-300">
                    <span>المبلغ النهائي:</span>
                    <span>{formatCurrency(viewingPO.grandTotal, viewingPO.currency)}</span>
                  </div>
                </div>
              </div>

              {/* View Attached Documents */}
              {viewingPO.attachments && viewingPO.attachments.length > 0 && (
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                  <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                    <Paperclip className="w-3.5 h-3.5 text-blue-600" />
                    المستندات والمرفقات المؤرشفة ({viewingPO.attachments.length}):
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {viewingPO.attachments.map((att, i) => (
                      <a
                        key={i}
                        href={att}
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center gap-1.5 bg-white border border-slate-200 rounded-lg px-2.5 py-1 text-xs text-blue-600 hover:text-blue-800 hover:border-blue-300 shadow-2xs"
                      >
                        <FileText className="w-3.5 h-3.5" />
                        <span>مرفق #{i + 1}</span>
                      </a>
                    ))}
                  </div>
                </div>
              )}

              <div className="pt-3 border-t border-slate-200 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => {
                    handleSharePO(viewingPO);
                    setViewingPO(null);
                  }}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold flex items-center gap-2 shadow-xs"
                >
                  <Share2 className="w-4 h-4" />
                  <span>مشاركة عبر الواتساب والرسائل</span>
                </button>

                <button
                  type="button"
                  onClick={() => setViewingPO(null)}
                  className="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl font-bold hover:bg-slate-200"
                >
                  إغلاق
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* --- DOCUMENT SHARE MODAL (WHATSAPP / SMS) --- */}
      <DocumentShareModal
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
        document={shareModalDoc}
        companyProfile={companyProfile}
      />
    </div>
  );
};
