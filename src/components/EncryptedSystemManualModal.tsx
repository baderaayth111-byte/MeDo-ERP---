import React, { useState, useEffect } from 'react';
import {
  Lock,
  Unlock,
  BookOpen,
  Languages,
  Download,
  Upload,
  ShieldCheck,
  KeyRound,
  FileText,
  Printer,
  Plus,
  Trash2,
  Edit3,
  Check,
  X,
  Eye,
  EyeOff,
  Sparkles,
  HelpCircle,
  FileCode
} from 'lucide-react';

interface EncryptedSystemManualModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface ManualSection {
  id: string;
  titleAr: string;
  titleEn: string;
  category: 'pos' | 'accounting' | 'inventory' | 'hr' | 'designer';
  contentAr: string;
  contentEn: string;
  contentFr?: string;
}

const DEFAULT_PIN = '1995'; // Master Designer Passcode

const INITIAL_MANUAL_SECTIONS: ManualSection[] = [
  {
    id: 'sec-1',
    titleAr: '1. دليل تشغيل نقاط البيع (POS System Guide)',
    titleEn: '1. POS Operations & Cashier Guide',
    category: 'pos',
    contentAr: `
- **بدء الوردية والافتتاح:**
  تأكد من إدخال المبلغ الافتتاحي للصندوق عند فتح الوردية.
- **إضافة المنتجات والبحث السريع:**
  يمكن البحث عن أي صنف بالاسم، كود الصنف، أو الباركود. عند الضغط على Enter أو زر (بحث/إضافة) يتم إضافة أول صنف مطابق لسلة المبيعات تلقائياً.
- **الطباعة السريعة للإيصالات (Thermal Printing):**
  زر "طباعة سريعة ⚡" يُنفذ عملية البيع مباشرة ويفتح نافذة الطباعة المتوافقة مع طابعات الإيصالات 80mm المزودة بكود ZATCA QR للفوترة الإلكترونية.
- **المسح الضوئي الذكي (OCR Scanner):**
  يمكن استخدام كاميرا الجهاز لمسح الباركود أو قراءة الفواتير الضوئية وتفريغ البنود في السلة فوراً.
`,
    contentEn: `
- **Shift Opening:** Ensure entering the initial cash drawer floating amount.
- **Product Search & Quick Add:** Search by product name, code, or barcode. Pressing Enter or (Search/Add) automatically adds the first matching item to the cart.
- **Thermal Quick Print:** The "Quick Print ⚡" button completes transactions instantly and opens 80mm thermal receipt printing formatted with ZATCA QR codes.
- **Smart OCR Scanner:** Use the device camera to scan barcodes or optical invoices to populate cart items immediately.
`
  },
  {
    id: 'sec-2',
    titleAr: '2. دليل القيود ودليل الحسابات (GL & Accounting Manual)',
    titleEn: '2. General Ledger & Chart of Accounts Guide',
    category: 'accounting',
    contentAr: `
- **شجرة الحسابات (Chart of Accounts):**
  تضم الحسابات المقسمة على 4 مستويات أصول، خصوم، ملكية، إيرادات، ومصروفات. يمكن فلترة وتصفية الحسابات حسب المستوى ورصيد الحساب.
- **ضوابط توازن القيود:**
  النظام يمنع رحيل أي قيد محاسبي غير متوازن (إجمالي ائتمان ≠ إجمالي مدين)، مع توفير التحقق المباشر قبل الاعتماد.
- **القوائم المالية وتصدير PDF:**
  يمكن تصدير الميزانية العمومية، قائمة الدخل، وميزان المراجعة بصيغة PDF منسقة مدعومة بالرسوم البيانية وتأثير التخصيص.
`,
    contentEn: `
- **Chart of Accounts:** Hierarchical 4-level structure covering Assets, Liabilities, Equity, Revenues, and Expenses. Filter by level and balance status.
- **Journal Entry Constraints:** Prevents posting unbalanced entries (Debit ≠ Credit) with live validation warnings.
- **Financial Statements Export:** Export Balance Sheet, P&L, and Trial Balance to styled PDF format with visual charts.
`
  },
  {
    id: 'sec-3',
    titleAr: '3. إدارة المخزون والمشتريات والذكاء التنبئي (Inventory & AI Intelligence)',
    titleEn: '3. Inventory & Smart Replenishment Guide',
    category: 'inventory',
    contentAr: `
- **التنبؤ التلقائي وإعادة الطلب (ROP):**
  يقوم النظام بحساب نقطة إعادة الطلب وأيام التغطية (DOI) تلقائياً لتنبيه إدارة المشتريات بمقترحات الشراء الآلية.
- **تصنيف المخزون ABC Analysis:**
  تقسيم المخزون إلى أصناف A (عالية الإيراد)، B (متوسطة)، C (منخفضة) لتخصيص الرقابة والاحتياطي.
`,
    contentEn: `
- **Smart Replenishment (ROP):** Automatic calculation of Reorder Points and Days of Inventory (DOI) to trigger purchasing suggestions.
- **ABC Inventory Analysis:** Categorizes inventory into A (High Value), B (Moderate), and C (Low Value) for optimized control.
`
  },
  {
    id: 'sec-4',
    titleAr: '4. دليل المصمم والإدارة العليا (Master Designer & Security Vault)',
    titleEn: '4. Master Designer & Admin Confidential Guide',
    category: 'designer',
    contentAr: `
- **هذا القسم مشفر ومخصص حنصرياً للمصمم (ميدو تك للحلول البرمجية):**
  - مفتاح التشفير الرئيسي وتخصيص صلاحيات الوصول المتقدمة.
  - طريقة تصدير الدليل بصيغة مشفرة (.encmanual) لحفظه بامان على وسائط خارجية.
  - استرجاع وفك تشفير الملفات باستخدام كلمة السر السرية الخاصة بالمصمم.
`,
    contentEn: `
- **Confidential Master Section for Designer (Mido Tech Software Solutions):**
  - Master encryption keys and high-level role controls.
  - Exporting encrypted manual files (.encmanual) for off-site secure storage.
  - Importing and decrypting files using the designer's master key.
`
  }
];

export const EncryptedSystemManualModal: React.FC<EncryptedSystemManualModalProps> = ({
  isOpen,
  onClose
}) => {
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [pinInput, setPinInput] = useState('');
  const [pinError, setPinError] = useState(false);
  const [masterPin, setMasterPin] = useState(DEFAULT_PIN);
  
  const [showChangePin, setShowChangePin] = useState(false);
  const [newPin, setNewPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');

  const [activeLang, setActiveLang] = useState<'ar' | 'en' | 'fr'>('ar');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [sections, setSections] = useState<ManualSection[]>(INITIAL_MANUAL_SECTIONS);
  const [activeSectionId, setActiveSectionId] = useState<string>('sec-1');
  
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState('');
  const [editContent, setEditContent] = useState('');
  const [showPasswordText, setShowPasswordText] = useState(false);

  // Persistence for Master PIN & Custom Sections
  useEffect(() => {
    const savedPin = localStorage.getItem('DESIGNER_MASTER_PIN');
    if (savedPin) setMasterPin(savedPin);

    const savedSections = localStorage.getItem('DESIGNER_MANUAL_SECTIONS');
    if (savedSections) {
      try {
        setSections(JSON.parse(savedSections));
      } catch (e) {
        console.error('Failed to parse saved sections', e);
      }
    }
  }, []);

  if (!isOpen) return null;

  const handleUnlock = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (pinInput === masterPin) {
      setIsUnlocked(true);
      setPinError(false);
      setPinInput('');
    } else {
      setPinError(true);
    }
  };

  const handleChangePin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPin || newPin.length < 4) {
      alert('كلمة المرور / PIN يجب أن تكون 4 أرقام/رموز على الأقل');
      return;
    }
    if (newPin !== confirmPin) {
      alert('كلمات المرور غير متطابقة!');
      return;
    }
    setMasterPin(newPin);
    localStorage.setItem('DESIGNER_MASTER_PIN', newPin);
    setShowChangePin(false);
    setNewPin('');
    setConfirmPin('');
    alert('تم تغيير كلمة مرور المصمم بنجاح!');
  };

  const handleSaveSectionEdit = () => {
    const updated = sections.map(sec => {
      if (sec.id === activeSectionId) {
        return {
          ...sec,
          titleAr: activeLang === 'ar' ? editTitle : sec.titleAr,
          titleEn: activeLang === 'en' ? editTitle : sec.titleEn,
          contentAr: activeLang === 'ar' ? editContent : sec.contentAr,
          contentEn: activeLang === 'en' ? editContent : sec.contentEn,
        };
      }
      return sec;
    });
    setSections(updated);
    localStorage.setItem('DESIGNER_MANUAL_SECTIONS', JSON.stringify(updated));
    setIsEditing(false);
  };

  const handleAddNewSection = () => {
    const newSec: ManualSection = {
      id: `sec-${Date.now()}`,
      titleAr: 'قسم جديد في الدليل',
      titleEn: 'New Manual Section',
      category: 'designer',
      contentAr: 'أدخل تفاصيل الدليل هنا...',
      contentEn: 'Enter manual documentation details here...'
    };
    const updated = [...sections, newSec];
    setSections(updated);
    setActiveSectionId(newSec.id);
    localStorage.setItem('DESIGNER_MANUAL_SECTIONS', JSON.stringify(updated));
  };

  const handleDeleteSection = (id: string) => {
    if (confirm('هل أنت تأكد من حذف هذا القسم من الدليل؟')) {
      const updated = sections.filter(s => s.id !== id);
      setSections(updated);
      if (updated.length > 0) setActiveSectionId(updated[0].id);
      localStorage.setItem('DESIGNER_MANUAL_SECTIONS', JSON.stringify(updated));
    }
  };

  // Simple Base64 + XOR Cipher Encryption for Export File
  const exportEncryptedFile = () => {
    const dataString = JSON.stringify({
      version: '2.0',
      designer: 'ميدو تك للحلول البرمجية',
      timestamp: new Date().toISOString(),
      sections: sections
    });

    // Encrypt using XOR with master pin
    let cipherText = '';
    for (let i = 0; i < dataString.length; i++) {
      const charCode = dataString.charCodeAt(i) ^ masterPin.charCodeAt(i % masterPin.length);
      cipherText += String.fromCharCode(charCode);
    }
    const b64 = btoa(unescape(encodeURIComponent(cipherText)));

    const blob = new Blob([b64], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `System_User_Manual_Encrypted_${new Date().toISOString().slice(0, 10)}.encmanual`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Import Encrypted File
  const handleImportEncryptedFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const b64 = event.target?.result as string;
        const decodedString = decodeURIComponent(escape(atob(b64.trim())));
        
        let plainText = '';
        for (let i = 0; i < decodedString.length; i++) {
          const charCode = decodedString.charCodeAt(i) ^ masterPin.charCodeAt(i % masterPin.length);
          plainText += String.fromCharCode(charCode);
        }

        const parsed = JSON.parse(plainText);
        if (parsed.sections && Array.isArray(parsed.sections)) {
          setSections(parsed.sections);
          localStorage.setItem('DESIGNER_MANUAL_SECTIONS', JSON.stringify(parsed.sections));
          alert('تم فك تشفير واستيراد دليل الاستخدام بنجاح!');
        } else {
          alert('ملف الدليل غير صالح أو كلمة المرور غير صحيحة!');
        }
      } catch (err) {
        alert('حدث خطأ أثناء فك تشفير الملف! تيقن من أن كلمة مرور المصمم صحيحة.');
      }
    };
    reader.readAsText(file);
  };

  const handlePrintManual = () => {
    window.print();
  };

  const activeSection = sections.find(s => s.id === activeSectionId) || sections[0];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/80 backdrop-blur-xs p-4 overflow-y-auto font-sans" dir="rtl">
      <div className="bg-white w-full max-w-5xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95 duration-200">
        
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-4 px-6 flex items-center justify-between border-b border-indigo-900/50 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-amber-500/20 border border-amber-400/30 rounded-xl text-amber-300">
              {isUnlocked ? <Unlock className="w-5 h-5" /> : <Lock className="w-5 h-5" />}
            </div>
            <div>
              <h3 className="font-extrabold text-base sm:text-lg flex items-center gap-2 text-white">
                دليل الاستخدام المشفر للمصمم (Multilingual Designer Vault)
                <span className="text-[10px] bg-amber-400 text-slate-950 px-2 py-0.5 rounded-full font-bold">
                  ميدو تك للحلول البرمجية
                </span>
              </h3>
              <p className="text-xs text-indigo-200/80">
                توثيق كامل للنظام باللغات المتعددة مع التشفير والحفظ بصيغة سرية (.encmanual)
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-300 hover:text-white hover:bg-white/10 rounded-lg transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* LOCKED SCREEN STATE */}
        {!isUnlocked ? (
          <div className="p-8 sm:p-12 text-center space-y-6 flex-1 flex flex-col items-center justify-center bg-slate-50">
            <div className="w-20 h-20 bg-indigo-100 text-indigo-900 rounded-full flex items-center justify-center border-4 border-indigo-200 shadow-inner animate-pulse">
              <ShieldCheck className="w-10 h-10 text-indigo-700" />
            </div>

            <div className="max-w-md space-y-2">
              <h4 className="text-lg font-bold text-slate-900">هذا الملف مشفر ومحمي برمز مصمم النظام</h4>
              <p className="text-xs text-slate-500 leading-relaxed">
                لا يمكن الاطلاع على هذا الدليل سوى من قِبل مصمم النظام (ميدو تك للحلول البرمجية) من خلال رمز الأمان PIN المشفر.
              </p>
            </div>

            <form onSubmit={handleUnlock} className="w-full max-w-sm space-y-4">
              <div className="relative">
                <KeyRound className="w-4 h-4 text-slate-400 absolute right-3 top-3.5" />
                <input
                  type={showPasswordText ? "text" : "password"}
                  value={pinInput}
                  onChange={(e) => {
                    setPinInput(e.target.value);
                    setPinError(false);
                  }}
                  placeholder="أدخل كلمة المرور / رمز PIN الخاص بالمصمم..."
                  className={`w-full pr-10 pl-10 py-3 text-sm font-mono text-center rounded-xl border bg-white focus:outline-none focus:ring-2 transition ${
                    pinError
                      ? 'border-red-500 focus:ring-red-400 bg-red-50'
                      : 'border-slate-300 focus:ring-indigo-500'
                  }`}
                  autoFocus
                />
                <button
                  type="button"
                  onClick={() => setShowPasswordText(!showPasswordText)}
                  className="absolute left-3 top-3.5 text-slate-400 hover:text-slate-600"
                >
                  {showPasswordText ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>

              {pinError && (
                <p className="text-xs text-red-600 font-bold animate-shake">
                  ❌ رمز PIN غير صحيح! تيقن من رمز المصمم الخاص بك.
                </p>
              )}

              <button
                type="submit"
                className="w-full py-3 bg-indigo-900 hover:bg-indigo-950 text-white rounded-xl text-sm font-bold shadow-md hover:shadow-lg transition flex items-center justify-center gap-2"
              >
                <Unlock className="w-4 h-4" />
                فك التشفير وفتح الدليل
              </button>
            </form>

            <div className="text-[11px] text-slate-400 font-medium pt-4">
              الرمز الافتراضي للمصمم: <code className="bg-slate-200 px-1.5 py-0.5 rounded text-slate-700 font-mono">1995</code>
            </div>
          </div>
        ) : (
          /* UNLOCKED SYSTEM MANUAL CONTENT */
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* Control Bar: Languages, Actions & Security */}
            <div className="bg-slate-100 p-3 px-6 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3 shrink-0">
              
              {/* Language Switcher */}
              <div className="flex items-center gap-1.5 bg-white p-1 rounded-xl border border-slate-300 text-xs font-bold shadow-2xs">
                <Languages className="w-4 h-4 text-slate-500 mr-1" />
                <button
                  onClick={() => setActiveLang('ar')}
                  className={`px-3 py-1 rounded-lg transition ${
                    activeLang === 'ar' ? 'bg-indigo-900 text-white shadow-2xs' : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  العربية (Arabic)
                </button>
                <button
                  onClick={() => setActiveLang('en')}
                  className={`px-3 py-1 rounded-lg transition ${
                    activeLang === 'en' ? 'bg-indigo-900 text-white shadow-2xs' : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  English
                </button>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2 flex-wrap">
                <button
                  onClick={exportEncryptedFile}
                  className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 transition shadow-2xs"
                  title="حفظ وتصدير الدليل في ملف مشفر بكلمة سر"
                >
                  <Download className="w-3.5 h-3.5" />
                  حفظ في ملف مشفر (.encmanual)
                </button>

                <label className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 cursor-pointer transition shadow-2xs">
                  <Upload className="w-3.5 h-3.5" />
                  استيراد ملف مشفر
                  <input
                    type="file"
                    accept=".encmanual,.json"
                    onChange={handleImportEncryptedFile}
                    className="hidden"
                  />
                </label>

                <button
                  onClick={handlePrintManual}
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-900 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 transition shadow-2xs"
                >
                  <Printer className="w-3.5 h-3.5" />
                  طباعة / PDF
                </button>

                <button
                  onClick={() => setShowChangePin(!showChangePin)}
                  className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 transition shadow-2xs"
                >
                  <KeyRound className="w-3.5 h-3.5" />
                  تغيير كلمة مرور المصمم
                </button>

                <button
                  onClick={() => setIsUnlocked(false)}
                  className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 transition shadow-2xs"
                >
                  <Lock className="w-3.5 h-3.5" />
                  قفل الدليل
                </button>
              </div>
            </div>

            {/* Change PIN Form Drawer */}
            {showChangePin && (
              <form onSubmit={handleChangePin} className="bg-amber-50 p-4 border-b border-amber-200 flex flex-wrap items-center gap-3 animate-in slide-in-from-top duration-200 shrink-0">
                <span className="text-xs font-bold text-amber-900 flex items-center gap-1">
                  <ShieldCheck className="w-4 h-4 text-amber-600" />
                  تعيين كلمة مرور جديدة للمصمم:
                </span>
                <input
                  type="password"
                  value={newPin}
                  onChange={(e) => setNewPin(e.target.value)}
                  placeholder="كلمة المرور الجديدة..."
                  className="px-3 py-1.5 text-xs rounded-lg border border-amber-300 bg-white font-mono focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
                <input
                  type="password"
                  value={confirmPin}
                  onChange={(e) => setConfirmPin(e.target.value)}
                  placeholder="تأكيد كلمة المرور..."
                  className="px-3 py-1.5 text-xs rounded-lg border border-amber-300 bg-white font-mono focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
                <button
                  type="submit"
                  className="px-3 py-1.5 bg-amber-700 text-white rounded-lg text-xs font-bold hover:bg-amber-800"
                >
                  حفظ كلمة المرور
                </button>
              </form>
            )}

            {/* Main Content Body */}
            <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
              
              {/* Sidebar: Navigation of Sections */}
              <div className="w-full md:w-64 bg-slate-50 border-b md:border-b-0 md:border-l border-slate-200 p-4 overflow-y-auto shrink-0 space-y-2">
                <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                  <span className="text-xs font-bold text-slate-700">أقسام ومواضيع الدليل</span>
                  <button
                    onClick={handleAddNewSection}
                    className="p-1 text-indigo-700 hover:bg-indigo-50 rounded-lg transition"
                    title="إضافة قسم جديد للدليل"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>

                <div className="space-y-1">
                  {sections.map((sec) => (
                    <button
                      key={sec.id}
                      onClick={() => {
                        setActiveSectionId(sec.id);
                        setIsEditing(false);
                      }}
                      className={`w-full text-right px-3 py-2.5 rounded-xl text-xs font-bold transition flex items-center justify-between ${
                        activeSectionId === sec.id
                          ? 'bg-indigo-900 text-white shadow-xs'
                          : 'text-slate-700 hover:bg-slate-200/60'
                      }`}
                    >
                      <span className="truncate">
                        {activeLang === 'ar' ? sec.titleAr : sec.titleEn}
                      </span>
                      {sec.category === 'designer' && (
                        <span className="text-[9px] bg-amber-400 text-slate-900 px-1.5 py-0.5 rounded font-extrabold shrink-0">
                          سرّي
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {/* Main Section Content Area */}
              <div className="flex-1 p-6 overflow-y-auto bg-white space-y-6">
                
                {/* Section Title & Header Controls */}
                <div className="flex items-center justify-between border-b border-slate-200 pb-4">
                  <div>
                    <h3 className="text-lg font-bold text-slate-900">
                      {activeLang === 'ar' ? activeSection.titleAr : activeSection.titleEn}
                    </h3>
                    <p className="text-xs text-slate-500 font-medium">
                      التصنيف: <span className="font-bold text-indigo-700">{activeSection.category.toUpperCase()}</span>
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    {!isEditing ? (
                      <button
                        onClick={() => {
                          setIsEditing(true);
                          setEditTitle(activeLang === 'ar' ? activeSection.titleAr : activeSection.titleEn);
                          setEditContent(activeLang === 'ar' ? activeSection.contentAr : activeSection.contentEn);
                        }}
                        className="px-3 py-1.5 text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-bold flex items-center gap-1 transition"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                        تعديل هذا القسم
                      </button>
                    ) : (
                      <button
                        onClick={handleSaveSectionEdit}
                        className="px-3 py-1.5 text-xs bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold flex items-center gap-1 transition"
                      >
                        <Check className="w-3.5 h-3.5" />
                        حفظ التعديلات
                      </button>
                    )}

                    {sections.length > 1 && (
                      <button
                        onClick={() => handleDeleteSection(activeSection.id)}
                        className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition"
                        title="حذف هذا القسم"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Content Render or Editor */}
                {isEditing ? (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">عنوان القسم:</label>
                      <input
                        type="text"
                        value={editTitle}
                        onChange={(e) => setEditTitle(e.target.value)}
                        className="w-full text-sm p-2.5 border border-slate-300 rounded-xl font-bold focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">تفاصيل ومحتوى الدليل:</label>
                      <textarea
                        rows={12}
                        value={editContent}
                        onChange={(e) => setEditContent(e.target.value)}
                        className="w-full text-xs p-3 border border-slate-300 rounded-xl font-mono focus:ring-2 focus:ring-indigo-500"
                      ></textarea>
                    </div>
                  </div>
                ) : (
                  <div className="prose prose-slate max-w-none text-xs sm:text-sm text-slate-800 leading-relaxed space-y-3 font-sans whitespace-pre-line bg-slate-50/50 p-6 rounded-2xl border border-slate-100 shadow-2xs">
                    {activeLang === 'ar' ? activeSection.contentAr : activeSection.contentEn}
                  </div>
                )}
              </div>
            </div>

          </div>
        )}

      </div>
    </div>
  );
};
