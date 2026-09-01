import React, { useState, useRef } from 'react';
import { 
  Camera, 
  Upload, 
  Sparkles, 
  FileText, 
  CheckCircle2, 
  X, 
  Scan, 
  Check, 
  AlertCircle, 
  RefreshCw,
  Barcode
} from 'lucide-react';

export interface ExtractedOcrData {
  documentType: 'INVOICE' | 'RECEIPT' | 'BARCODE' | 'JOURNAL';
  referenceNumber: string;
  vendorName: string;
  date: string;
  totalAmount: number;
  taxAmount: number;
  barcodeValue?: string;
  items: Array<{
    description: string;
    quantity: number;
    unitPrice: number;
    total: number;
  }>;
}

interface DocumentOcrScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onScanComplete: (data: ExtractedOcrData) => void;
  title?: string;
}

export const DocumentOcrScannerModal: React.FC<DocumentOcrScannerModalProps> = ({
  isOpen,
  onClose,
  onScanComplete,
  title = 'المسح الضوئي الذكي للمستندات والباركود (Smart OCR Scanner)',
}) => {
  const [isScanning, setIsScanning] = useState(false);
  const [scannedImage, setScannedImage] = useState<string | null>(null);
  const [extractedData, setExtractedData] = useState<ExtractedOcrData | null>(null);
  const [activeTab, setActiveTab] = useState<'upload' | 'camera'>('upload');
  const [barcodeInput, setBarcodeInput] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const simulateOcrExtraction = (imageSrc: string) => {
    setIsScanning(true);
    setScannedImage(imageSrc);

    setTimeout(() => {
      // Mock OCR extraction results
      const mockResult: ExtractedOcrData = {
        documentType: 'INVOICE',
        referenceNumber: `INV-OCR-${Math.floor(100000 + Math.random() * 900000)}`,
        vendorName: 'شركة التقنية الوطنية للتوريدات',
        date: new Date().toISOString().split('T')[0],
        totalAmount: 185000,
        taxAmount: 9250,
        barcodeValue: '6291048201948',
        items: [
          { description: 'سيرفر شبكات HP ProLiant DL380', quantity: 1, unitPrice: 120000, total: 120000 },
          { description: 'شاشة سامسونج LED 27 بوصة', quantity: 2, unitPrice: 25000, total: 50000 },
          { description: 'كابل ألياف ضوئية 10 متر', quantity: 3, unitPrice: 5000, total: 15000 },
        ],
      };
      setExtractedData(mockResult);
      setIsScanning(false);
    }, 1800);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target?.result) {
        simulateOcrExtraction(event.target.result as string);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleBarcodeQuickScan = (e: React.FormEvent) => {
    e.preventDefault();
    if (!barcodeInput.trim()) return;

    setIsScanning(true);
    setTimeout(() => {
      const mockResult: ExtractedOcrData = {
        documentType: 'BARCODE',
        referenceNumber: `BAR-${barcodeInput.trim()}`,
        vendorName: 'صنف ممسوح عبر قارئ الباركود',
        date: new Date().toISOString().split('T')[0],
        totalAmount: 3500,
        taxAmount: 175,
        barcodeValue: barcodeInput.trim(),
        items: [
          { description: `صنف بموجب الباركود (${barcodeInput.trim()})`, quantity: 1, unitPrice: 3500, total: 3500 }
        ],
      };
      setExtractedData(mockResult);
      setIsScanning(false);
    }, 800);
  };

  const handleApplyData = () => {
    if (extractedData) {
      onScanComplete(extractedData);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/65 flex items-center justify-center p-4 backdrop-blur-xs animate-in fade-in">
      <div className="bg-white border border-slate-200 rounded-3xl max-w-2xl w-full p-6 space-y-5 shadow-2xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-700 text-white flex items-center justify-center shadow-md">
              <Scan className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">{title}</h3>
              <p className="text-xs text-slate-500">مسح الفواتير والإيصالات والباركود ضوئياً واستخراج البيانات تلقائياً</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-100 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Mode Selector */}
        <div className="flex items-center justify-between gap-2 bg-slate-100 p-1.5 rounded-2xl text-xs font-bold">
          <button
            onClick={() => setActiveTab('upload')}
            className={`flex-1 py-2 px-3 rounded-xl transition flex items-center justify-center gap-2 ${
              activeTab === 'upload' ? 'bg-white text-blue-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Upload className="w-4 h-4" />
            <span>رفع صورة المستند / الفاتورة</span>
          </button>
          <button
            onClick={() => setActiveTab('camera')}
            className={`flex-1 py-2 px-3 rounded-xl transition flex items-center justify-center gap-2 ${
              activeTab === 'camera' ? 'bg-white text-blue-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Barcode className="w-4 h-4" />
            <span>مسح الباركود الضوئي MSR</span>
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto space-y-4">
          {activeTab === 'upload' && (
            <div className="space-y-4">
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileUpload}
                accept="image/*,.pdf"
                className="hidden"
              />

              {!scannedImage ? (
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-blue-300 hover:border-blue-500 rounded-2xl p-8 text-center cursor-pointer bg-blue-50/40 hover:bg-blue-50 transition space-y-3"
                >
                  <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center mx-auto text-blue-600 shadow-sm border border-blue-100">
                    <Camera className="w-7 h-7" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-800">اضغط هنا لالتقاط أو اختيار صورة الفاتورة</h4>
                    <p className="text-xs text-slate-500 mt-1">يدعم صيغ JPG, PNG, WEBP, PDF للمسح الضوئي الذكي (OCR)</p>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-start">
                  <div className="border border-slate-200 rounded-2xl overflow-hidden bg-slate-900 relative">
                    <img src={scannedImage} alt="Scanned Document" className="w-full h-48 object-cover opacity-90" />
                    {isScanning && (
                      <div className="absolute inset-0 bg-blue-900/60 backdrop-blur-2xs flex flex-col items-center justify-center text-white p-4 space-y-2">
                        <RefreshCw className="w-8 h-8 animate-spin text-amber-400" />
                        <span className="text-xs font-bold">جاري التعرف والتحليل الضوئي الذكي (OCR)...</span>
                      </div>
                    )}
                  </div>

                  {extractedData && (
                    <div className="bg-emerald-50/80 border border-emerald-200 rounded-2xl p-4 space-y-2 text-xs">
                      <div className="flex items-center gap-1.5 text-emerald-800 font-bold text-xs border-b border-emerald-200 pb-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                        <span>تم التعرف بنجاح واستخراج البيانات:</span>
                      </div>
                      <div className="space-y-1 text-slate-700">
                        <div><strong>المورد/الجهة:</strong> {extractedData.vendorName}</div>
                        <div><strong>رقم الفاتورة:</strong> {extractedData.referenceNumber}</div>
                        <div><strong>التاريخ:</strong> {extractedData.date}</div>
                        <div><strong>الإجمالي:</strong> <span className="font-mono font-bold text-emerald-700">{extractedData.totalAmount.toLocaleString()} YER</span></div>
                        <div><strong>عدد البنود:</strong> {extractedData.items.length} بنود</div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {activeTab === 'camera' && (
            <div className="space-y-4">
              <form onSubmit={handleBarcodeQuickScan} className="space-y-3">
                <label className="block text-xs font-bold text-slate-700">أدخل رقم الباركود أو امسحه بواسطة قارئ الباركود الضوئي:</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={barcodeInput}
                    onChange={(e) => setBarcodeInput(e.target.value)}
                    placeholder="امسح الباركود هنا (مثال: 6291048201948)..."
                    className="flex-1 bg-slate-50 border-2 border-slate-200 focus:border-blue-500 rounded-xl px-3 py-2 text-xs font-mono font-bold focus:outline-none focus:bg-white"
                    autoFocus
                  />
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs transition"
                  >
                    بحث ومسح
                  </button>
                </div>
              </form>

              {extractedData && activeTab === 'camera' && (
                <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 space-y-2 text-xs">
                  <div className="font-bold text-blue-900 border-b border-blue-200 pb-1">نتائج مسح الباركود:</div>
                  <div><strong>كود الباركود:</strong> <span className="font-mono font-bold">{extractedData.barcodeValue}</span></div>
                  <div><strong>اسم البند:</strong> {extractedData.items[0]?.description}</div>
                  <div><strong>السعر المقترح:</strong> <span className="font-mono font-bold text-emerald-700">{extractedData.items[0]?.unitPrice} YER</span></div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between pt-3 border-t border-slate-200">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition"
          >
            إلغاء
          </button>
          {extractedData && (
            <button
              type="button"
              onClick={handleApplyData}
              className="px-6 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-md"
            >
              <Check className="w-4 h-4" />
              <span>اعتماد وتعبئة البيانات تلقائياً</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
