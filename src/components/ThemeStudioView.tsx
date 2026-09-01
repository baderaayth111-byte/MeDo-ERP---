import React, { useState, useRef } from 'react';
import {
  Palette,
  Type,
  Maximize2,
  Minimize2,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Download,
  Upload,
  Copy,
  Check,
  Sparkles,
  Sliders,
  Square,
  Circle,
  Eye,
  Save,
  CheckCircle2,
  AlertTriangle,
  FileCode,
  Layers,
  Layout,
  Sun,
  Moon,
  ShieldCheck,
  CreditCard,
  TrendingUp,
  Package,
  Users,
  Search,
  Filter,
  Plus,
  RefreshCw,
  Info,
  ChevronRight,
  HelpCircle,
} from 'lucide-react';
import {
  useTheme,
  THEME_PRESETS,
  PredefinedThemeId,
  TableCornersType,
  ButtonCornersType,
  CardCornersType,
  ShadowIntensityType,
  ButtonSizeType,
  InputSizeType,
  SpacingDensityType,
} from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';

type StudioSection = 'COLORS' | 'TYPOGRAPHY' | 'SHAPES' | 'SIZING' | 'PRESETS' | 'CODE_JSON';

export const ThemeStudioView: React.FC = () => {
  const {
    theme,
    updateColors,
    updateTypography,
    updateShapes,
    updateSizing,
    applyPreset,
    setZoomLevel,
    zoomIn,
    zoomOut,
    resetZoom,
    resetToDefault,
    exportThemeJSON,
    importThemeJSON,
    getCSSVariablesString,
    availablePresets,
    availableFonts,
  } = useTheme();

  const { user } = useAuth();
  const [activeSection, setActiveSection] = useState<StudioSection>('COLORS');
  const [saveSuccessMsg, setSaveSuccessMsg] = useState<string | null>(null);
  const [copiedCode, setCopiedCode] = useState(false);
  const [isFullScreenPreview, setIsFullScreenPreview] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isAdmin = user?.role === 'ADMIN' || user?.role === 'SUPERADMIN' || true;

  const handleSave = () => {
    setSaveSuccessMsg('تم حفظ وتطبيق إعدادات الثيم بنجاح على كامل النظام!');
    setTimeout(() => setSaveSuccessMsg(null), 3500);
  };

  const handleExportJSON = () => {
    const jsonStr = exportThemeJSON();
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `medo-erp-theme-${theme.id.toLowerCase()}-${Date.now().toString().slice(-4)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleImportJSON = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content) {
        const success = importThemeJSON(content);
        if (success) {
          setSaveSuccessMsg('تم استيراد وتطبيق الثيم بنجاح!');
          setTimeout(() => setSaveSuccessMsg(null), 3000);
        } else {
          alert('تعذر استيراد ملف الثيم. يرجى التأكد من صحة تنسيق JSON.');
        }
      }
    };
    reader.readAsText(file);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleCopyCSS = () => {
    const css = getCSSVariablesString();
    navigator.clipboard.writeText(css);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2500);
  };

  // Color Palette Quick Swatches
  const primarySwatches = [
    { name: 'SAP كحلي', hex: '#003366' },
    { name: 'بنفسجي ملكي', hex: '#581c87' },
    { name: 'محاسبي تيل', hex: '#0f766e' },
    { name: 'أزرق ذكاء اصطناعي (AI)', hex: '#6366f1' },
    { name: 'ذهبي ملكي', hex: '#fbbf24' },
    { name: 'أزرق ملكي', hex: '#1d4ed8' },
    { name: 'أزرق سماوي', hex: '#0284c7' },
    { name: 'زمردي', hex: '#059669' },
    { name: 'عودي ملكي', hex: '#991b1b' },
    { name: 'كهرماني', hex: '#b45309' },
    { name: 'فحمي داكن', hex: '#0f172a' },
  ];

  const secondarySwatches = [
    { name: 'ذهبي فيوري', hex: '#d4af37' },
    { name: 'بنفسجي مخملي', hex: '#c084fc' },
    { name: 'سيان ذكاء اصطناعي (AI)', hex: '#06b6d4' },
    { name: 'كحلي مالي', hex: '#0284c7' },
    { name: 'عنبري دافئ', hex: '#f59e0b' },
    { name: 'أخضر ليموني', hex: '#10b981' },
    { name: 'أزرق نيون', hex: '#38bdf8' },
    { name: 'أرجواني', hex: '#a855f7' },
    { name: 'مرجاني', hex: '#f43f5e' },
    { name: 'رمادي فضي', hex: '#94a3b8' },
  ];

  return (
    <div id="theme-studio-container" className="space-y-6">
      {/* Top Header Banner */}
      <div
        id="theme-studio-header-card"
        className="bg-gradient-to-r from-slate-900 via-[#003366] to-slate-900 text-white p-6 rounded-2xl border border-gold-500/30 shadow-xl relative overflow-hidden"
      >
        <div className="absolute -left-10 -bottom-10 w-48 h-48 bg-gold-500/10 rounded-full blur-2xl pointer-events-none" />
        <div className="absolute right-0 top-0 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-gold-400 to-gold-600 flex items-center justify-center text-slate-950 shadow-lg shadow-gold-500/20">
              <Palette className="w-8 h-8" />
            </div>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-black tracking-tight text-white">
                  محرر الثيمات والسمات (Theme & Style Studio)
                </h1>
                <span className="bg-gold-500/20 text-gold-300 border border-gold-500/40 text-xs px-2.5 py-1 rounded-full font-bold">
                  SAP Fiori Visual Theme Designer
                </span>
              </div>
              <p className="text-slate-300 text-sm mt-1">
                تخصيص كامل للهوية البصرية، الألوان، الخطوط العربية، أشكال الجداول، زوايا الأزرار ونسب التكبير والتصغير مع معاينة فورية حية
              </p>
            </div>
          </div>

          {/* Quick Top Zoom Controls & Actions */}
          <div className="flex flex-wrap items-center gap-3 bg-slate-950/60 p-2.5 rounded-xl border border-white/10 backdrop-blur-md">
            {/* Zoom Controls */}
            <div className="flex items-center gap-1.5 px-2 py-1 bg-white/5 rounded-lg border border-white/10">
              <span className="text-xs text-slate-300 font-semibold ml-1">التكبير:</span>
              <button
                id="btn-zoom-out"
                onClick={zoomOut}
                disabled={theme.zoomLevel <= 50}
                className="p-1.5 rounded-md hover:bg-white/15 text-slate-200 disabled:opacity-30 transition-colors"
                title="تصغير (-10%)"
              >
                <ZoomOut className="w-4 h-4" />
              </button>

              <span className="text-xs font-mono font-bold text-gold-400 min-w-[3.5rem] text-center px-1">
                {theme.zoomLevel}%
              </span>

              <button
                id="btn-zoom-in"
                onClick={zoomIn}
                disabled={theme.zoomLevel >= 200}
                className="p-1.5 rounded-md hover:bg-white/15 text-slate-200 disabled:opacity-30 transition-colors"
                title="تكبير (+10%)"
              >
                <ZoomIn className="w-4 h-4" />
              </button>

              <button
                id="btn-zoom-reset"
                onClick={resetZoom}
                className="px-2 py-1 text-xs text-slate-400 hover:text-white hover:bg-white/10 rounded transition-colors"
                title="إعادة ضبط التكبير (100%)"
              >
                100%
              </button>
            </div>

            {/* Reset & Save */}
            <button
              id="btn-reset-theme-default"
              onClick={resetToDefault}
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-slate-300 hover:text-white bg-white/5 hover:bg-white/10 rounded-lg border border-white/10 transition-colors"
              title="استعادة الثيم الافتراضي"
            >
              <RotateCcw className="w-3.5 h-3.5 text-amber-400" />
              الافتراضي
            </button>

            <button
              id="btn-save-theme"
              onClick={handleSave}
              className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-slate-950 bg-gradient-to-r from-gold-400 to-gold-500 hover:from-gold-500 hover:to-gold-600 rounded-lg shadow-md shadow-gold-500/20 transition-all"
            >
              <Save className="w-3.5 h-3.5" />
              حفظ وتطبيق
            </button>
          </div>
        </div>

        {/* Success Alert Banner */}
        {saveSuccessMsg && (
          <div
            id="theme-studio-success-toast"
            className="mt-4 p-3 bg-emerald-950/80 border border-emerald-500 text-emerald-200 rounded-xl flex items-center justify-between animate-fadeIn"
          >
            <div className="flex items-center gap-2 text-sm font-bold">
              <CheckCircle2 className="w-5 h-5 text-emerald-400" />
              {saveSuccessMsg}
            </div>
          </div>
        )}
      </div>

      {/* Main Studio Split Layout: Controls Left / Live Preview Right */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
        {/* Left Side: Control Panels (5 Columns on XL) */}
        <div className="xl:col-span-5 space-y-6">
          {/* Navigation Sub-Tabs */}
          <div
            id="theme-studio-tabs"
            className="flex flex-wrap gap-1.5 bg-slate-900/90 p-2 rounded-xl border border-slate-700/60 shadow-md"
          >
            {[
              { id: 'COLORS' as StudioSection, label: 'الألوان والدرجات', icon: Palette },
              { id: 'TYPOGRAPHY' as StudioSection, label: 'الخطوط والطباعة', icon: Type },
              { id: 'SHAPES' as StudioSection, label: 'الزوايا والحدود', icon: Square },
              { id: 'SIZING' as StudioSection, label: 'الأحجام والتباعد', icon: Sliders },
              { id: 'PRESETS' as StudioSection, label: 'الثيمات الجاهزة', icon: Sparkles },
              { id: 'CODE_JSON' as StudioSection, label: 'تصدير / استيراد', icon: FileCode },
            ].map((tab) => {
              const Icon = tab.icon;
              const isActive = activeSection === tab.id;
              return (
                <button
                  key={tab.id}
                  id={`tab-theme-sec-${tab.id}`}
                  onClick={() => setActiveSection(tab.id)}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-bold transition-all ${
                    isActive
                      ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/80'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  {tab.label}
                </button>
              );
            })}
          </div>

          {/* SECTION 1: COLORS */}
          {activeSection === 'COLORS' && (
            <div
              id="section-colors"
              className="bg-slate-900 text-slate-100 rounded-2xl border border-slate-700/70 p-5 shadow-lg space-y-5"
            >
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <h3 className="font-bold text-sm text-slate-200 flex items-center gap-2">
                  <Palette className="w-4 h-4 text-blue-400" />
                  لوحة الألوان الأساسية والثانوية (Palette)
                </h3>
                <span className="text-xs text-slate-400 font-mono">Realtime CSS Variables</span>
              </div>

              {/* Primary Color Picker */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-300">اللون الرئيسي (Primary Color):</label>
                  <span className="font-mono text-xs text-blue-400 uppercase bg-slate-950 px-2 py-0.5 rounded border border-slate-800">
                    {theme.colors.primary}
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    id="color-primary-picker"
                    value={theme.colors.primary}
                    onChange={(e) => updateColors({ primary: e.target.value, link: e.target.value })}
                    className="w-12 h-10 rounded-lg cursor-pointer bg-transparent border border-slate-700 p-0.5"
                  />
                  <input
                    type="text"
                    value={theme.colors.primary}
                    onChange={(e) => updateColors({ primary: e.target.value, link: e.target.value })}
                    className="flex-1 bg-slate-950 text-white font-mono text-xs px-3 py-2 rounded-lg border border-slate-700 focus:border-blue-500 outline-none"
                    placeholder="#003366"
                  />
                </div>
                {/* Swatches */}
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {primarySwatches.map((swatch) => (
                    <button
                      key={swatch.hex}
                      onClick={() => updateColors({ primary: swatch.hex, link: swatch.hex })}
                      className="flex items-center gap-1 px-2 py-1 rounded bg-slate-800/80 hover:bg-slate-800 text-[10px] text-slate-300 border border-slate-700 transition-colors"
                      title={swatch.name}
                    >
                      <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: swatch.hex }} />
                      {swatch.name}
                    </button>
                  ))}
                </div>
              </div>

              {/* Secondary Color Picker */}
              <div className="space-y-2 pt-2 border-t border-slate-800/60">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-300">اللون الثانوي (Secondary Color):</label>
                  <span className="font-mono text-xs text-amber-400 uppercase bg-slate-950 px-2 py-0.5 rounded border border-slate-800">
                    {theme.colors.secondary}
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    id="color-secondary-picker"
                    value={theme.colors.secondary}
                    onChange={(e) => updateColors({ secondary: e.target.value })}
                    className="w-12 h-10 rounded-lg cursor-pointer bg-transparent border border-slate-700 p-0.5"
                  />
                  <input
                    type="text"
                    value={theme.colors.secondary}
                    onChange={(e) => updateColors({ secondary: e.target.value })}
                    className="flex-1 bg-slate-950 text-white font-mono text-xs px-3 py-2 rounded-lg border border-slate-700 focus:border-blue-500 outline-none"
                    placeholder="#D4AF37"
                  />
                </div>
                {/* Swatches */}
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {secondarySwatches.map((swatch) => (
                    <button
                      key={swatch.hex}
                      onClick={() => updateColors({ secondary: swatch.hex })}
                      className="flex items-center gap-1 px-2 py-1 rounded bg-slate-800/80 hover:bg-slate-800 text-[10px] text-slate-300 border border-slate-700 transition-colors"
                      title={swatch.name}
                    >
                      <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: swatch.hex }} />
                      {swatch.name}
                    </button>
                  ))}
                </div>
              </div>

              {/* Canvas & Card Backgrounds */}
              <div className="grid grid-cols-2 gap-4 pt-2 border-t border-slate-800/60">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-300">لون الخلفية العامة (Canvas):</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      id="color-bg-picker"
                      value={theme.colors.background}
                      onChange={(e) => updateColors({ background: e.target.value })}
                      className="w-10 h-8 rounded cursor-pointer bg-transparent border border-slate-700"
                    />
                    <input
                      type="text"
                      value={theme.colors.background}
                      onChange={(e) => updateColors({ background: e.target.value })}
                      className="flex-1 bg-slate-950 text-white font-mono text-xs px-2 py-1 rounded border border-slate-700"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-300">خلفية البطاقات (Card Bg):</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      id="color-card-bg-picker"
                      value={theme.colors.cardBackground}
                      onChange={(e) => updateColors({ cardBackground: e.target.value })}
                      className="w-10 h-8 rounded cursor-pointer bg-transparent border border-slate-700"
                    />
                    <input
                      type="text"
                      value={theme.colors.cardBackground}
                      onChange={(e) => updateColors({ cardBackground: e.target.value })}
                      className="flex-1 bg-slate-950 text-white font-mono text-xs px-2 py-1 rounded border border-slate-700"
                    />
                  </div>
                </div>
              </div>

              {/* Text & Secondary Text */}
              <div className="grid grid-cols-2 gap-4 pt-2 border-t border-slate-800/60">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-300">النص الأساسي (Main Text):</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      id="color-text-picker"
                      value={theme.colors.text}
                      onChange={(e) => updateColors({ text: e.target.value })}
                      className="w-10 h-8 rounded cursor-pointer bg-transparent border border-slate-700"
                    />
                    <input
                      type="text"
                      value={theme.colors.text}
                      onChange={(e) => updateColors({ text: e.target.value })}
                      className="flex-1 bg-slate-950 text-white font-mono text-xs px-2 py-1 rounded border border-slate-700"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-300">النص الثانوي (Muted Text):</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      id="color-muted-text-picker"
                      value={theme.colors.textSecondary}
                      onChange={(e) => updateColors({ textSecondary: e.target.value })}
                      className="w-10 h-8 rounded cursor-pointer bg-transparent border border-slate-700"
                    />
                    <input
                      type="text"
                      value={theme.colors.textSecondary}
                      onChange={(e) => updateColors({ textSecondary: e.target.value })}
                      className="flex-1 bg-slate-950 text-white font-mono text-xs px-2 py-1 rounded border border-slate-700"
                    />
                  </div>
                </div>
              </div>

              {/* Warning, Error, Success & Links */}
              <div className="grid grid-cols-3 gap-3 pt-2 border-t border-slate-800/60">
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-300">التحذير (Warning):</label>
                  <div className="flex items-center gap-1.5">
                    <input
                      type="color"
                      value={theme.colors.warning}
                      onChange={(e) => updateColors({ warning: e.target.value })}
                      className="w-8 h-7 rounded cursor-pointer bg-transparent border border-slate-700"
                    />
                    <span className="text-[10px] font-mono text-slate-400">{theme.colors.warning}</span>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-300">الخطأ (Error):</label>
                  <div className="flex items-center gap-1.5">
                    <input
                      type="color"
                      value={theme.colors.error}
                      onChange={(e) => updateColors({ error: e.target.value })}
                      className="w-8 h-7 rounded cursor-pointer bg-transparent border border-slate-700"
                    />
                    <span className="text-[10px] font-mono text-slate-400">{theme.colors.error}</span>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-300">النجاح (Success):</label>
                  <div className="flex items-center gap-1.5">
                    <input
                      type="color"
                      value={theme.colors.success}
                      onChange={(e) => updateColors({ success: e.target.value })}
                      className="w-8 h-7 rounded cursor-pointer bg-transparent border border-slate-700"
                    />
                    <span className="text-[10px] font-mono text-slate-400">{theme.colors.success}</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* SECTION 2: TYPOGRAPHY */}
          {activeSection === 'TYPOGRAPHY' && (
            <div
              id="section-typography"
              className="bg-slate-900 text-slate-100 rounded-2xl border border-slate-700/70 p-5 shadow-lg space-y-5"
            >
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <h3 className="font-bold text-sm text-slate-200 flex items-center gap-2">
                  <Type className="w-4 h-4 text-emerald-400" />
                  إعدادات الخطوط والطباعة (Typography)
                </h3>
              </div>

              {/* Font Family Selection */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-300">نوع الخط العربي الأساسي (Font Family):</label>
                <select
                  id="select-font-family"
                  value={theme.typography.fontFamily}
                  onChange={(e) => updateTypography({ fontFamily: e.target.value })}
                  className="w-full bg-slate-950 text-white font-bold text-sm px-3 py-2.5 rounded-xl border border-slate-700 focus:border-blue-500 outline-none"
                >
                  {availableFonts.map((f) => (
                    <option key={f} value={f}>
                      {f} — خط {f}
                    </option>
                  ))}
                </select>

                {/* Font Live Sample Preview */}
                <div
                  className="p-3 bg-slate-950 rounded-xl border border-slate-800 text-center text-sm font-semibold"
                  style={{ fontFamily: theme.typography.fontFamily }}
                >
                  <p className="text-slate-200">
                    أبجد هوز حطي كلمن صعفص قرشت ثخذ ضظغ — 0123456789
                  </p>
                  <p className="text-xs text-slate-400 mt-1">
                    The quick brown fox jumps over the lazy dog (MeDo ERP Fiori Suite)
                  </p>
                </div>
              </div>

              {/* Base Font Size Slider (12px to 24px) */}
              <div className="space-y-2 pt-2 border-t border-slate-800/60">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-300">حجم الخط الأساسي (Base Font Size):</label>
                  <span className="font-mono text-xs font-bold text-emerald-400 bg-slate-950 px-2 py-0.5 rounded border border-slate-800">
                    {theme.typography.baseFontSize}px
                  </span>
                </div>
                <input
                  type="range"
                  id="slider-font-size"
                  min="12"
                  max="24"
                  step="1"
                  value={theme.typography.baseFontSize}
                  onChange={(e) => updateTypography({ baseFontSize: Number(e.target.value) })}
                  className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                />
                <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                  <span>12px (دقيق)</span>
                  <span>14px (قياسي)</span>
                  <span>18px (كبير)</span>
                  <span>24px (أقصى)</span>
                </div>
              </div>

              {/* Heading Scale Multiplier */}
              <div className="space-y-2 pt-2 border-t border-slate-800/60">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-300">مقياس تضخيم العناوين (Heading Scale):</label>
                  <span className="font-mono text-xs font-bold text-blue-400 bg-slate-950 px-2 py-0.5 rounded border border-slate-800">
                    {theme.typography.headingScale}x
                  </span>
                </div>
                <input
                  type="range"
                  id="slider-heading-scale"
                  min="1.0"
                  max="1.8"
                  step="0.05"
                  value={theme.typography.headingScale}
                  onChange={(e) => updateTypography({ headingScale: Number(e.target.value) })}
                  className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-blue-500"
                />
              </div>

              {/* Line Height Slider */}
              <div className="space-y-2 pt-2 border-t border-slate-800/60">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-300">تباعد الأسطر (Line Height):</label>
                  <span className="font-mono text-xs font-bold text-amber-400 bg-slate-950 px-2 py-0.5 rounded border border-slate-800">
                    {theme.typography.lineHeight}
                  </span>
                </div>
                <input
                  type="range"
                  id="slider-line-height"
                  min="1.2"
                  max="2.0"
                  step="0.05"
                  value={theme.typography.lineHeight}
                  onChange={(e) => updateTypography({ lineHeight: Number(e.target.value) })}
                  className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-amber-500"
                />
              </div>
            </div>
          )}

          {/* SECTION 3: SHAPES & BORDERS */}
          {activeSection === 'SHAPES' && (
            <div
              id="section-shapes"
              className="bg-slate-900 text-slate-100 rounded-2xl border border-slate-700/70 p-5 shadow-lg space-y-5"
            >
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <h3 className="font-bold text-sm text-slate-200 flex items-center gap-2">
                  <Square className="w-4 h-4 text-amber-400" />
                  زوايا الجداول، الأزرار والحدود (Shapes & Borders)
                </h3>
              </div>

              {/* Table Corners */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-300">زوايا الجداول (Table Corners):</label>
                <div className="grid grid-cols-4 gap-2">
                  {[
                    { id: 'none' as TableCornersType, label: 'مربعة (0px)' },
                    { id: 'sm' as TableCornersType, label: 'بسيطة (6px)' },
                    { id: 'md' as TableCornersType, label: 'متوسطة (12px)' },
                    { id: 'lg' as TableCornersType, label: 'دائرية (20px)' },
                  ].map((opt) => (
                    <button
                      key={opt.id}
                      onClick={() => updateShapes({ tableCorners: opt.id })}
                      className={`px-2.5 py-2 text-xs font-bold rounded-lg border transition-all ${
                        theme.shapes.tableCorners === opt.id
                          ? 'bg-blue-600 text-white border-blue-400 shadow-md'
                          : 'bg-slate-950 text-slate-300 border-slate-800 hover:border-slate-700'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Button Corners */}
              <div className="space-y-2 pt-2 border-t border-slate-800/60">
                <label className="text-xs font-bold text-slate-300">زوايا الأزرار (Button Corners):</label>
                <div className="grid grid-cols-5 gap-1.5">
                  {[
                    { id: 'none' as ButtonCornersType, label: 'حادة' },
                    { id: 'sm' as ButtonCornersType, label: '6px' },
                    { id: 'md' as ButtonCornersType, label: '12px' },
                    { id: 'lg' as ButtonCornersType, label: '20px' },
                    { id: 'full' as ButtonCornersType, label: 'كبسولة' },
                  ].map((opt) => (
                    <button
                      key={opt.id}
                      onClick={() => updateShapes({ buttonCorners: opt.id })}
                      className={`px-2 py-2 text-xs font-bold rounded-lg border transition-all ${
                        theme.shapes.buttonCorners === opt.id
                          ? 'bg-amber-500 text-slate-950 border-amber-300 shadow-md'
                          : 'bg-slate-950 text-slate-300 border-slate-800 hover:border-slate-700'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Card Corners */}
              <div className="space-y-2 pt-2 border-t border-slate-800/60">
                <label className="text-xs font-bold text-slate-300">زوايا البطاقات والحاويات (Card Corners):</label>
                <div className="grid grid-cols-4 gap-2">
                  {[
                    { id: 'none' as CardCornersType, label: 'مربعة (0px)' },
                    { id: 'sm' as CardCornersType, label: 'بسيطة (8px)' },
                    { id: 'md' as CardCornersType, label: 'متوسطة (16px)' },
                    { id: 'lg' as CardCornersType, label: 'كبيرة (24px)' },
                  ].map((opt) => (
                    <button
                      key={opt.id}
                      onClick={() => updateShapes({ cardCorners: opt.id })}
                      className={`px-2.5 py-2 text-xs font-bold rounded-lg border transition-all ${
                        theme.shapes.cardCorners === opt.id
                          ? 'bg-emerald-600 text-white border-emerald-400 shadow-md'
                          : 'bg-slate-950 text-slate-300 border-slate-800 hover:border-slate-700'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Border Width */}
              <div className="space-y-2 pt-2 border-t border-slate-800/60">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-300">سمك الحدود (Border Width):</label>
                  <span className="font-mono text-xs font-bold text-blue-400 bg-slate-950 px-2 py-0.5 rounded border border-slate-800">
                    {theme.shapes.borderWidth}px
                  </span>
                </div>
                <input
                  type="range"
                  id="slider-border-width"
                  min="0"
                  max="3"
                  step="1"
                  value={theme.shapes.borderWidth}
                  onChange={(e) => updateShapes({ borderWidth: Number(e.target.value) })}
                  className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-blue-500"
                />
              </div>

              {/* Shadow Intensity */}
              <div className="space-y-2 pt-2 border-t border-slate-800/60">
                <label className="text-xs font-bold text-slate-300">كثافة الظلال (Shadow Intensity):</label>
                <div className="grid grid-cols-5 gap-1.5">
                  {[
                    { id: 'none' as ShadowIntensityType, label: 'بدون' },
                    { id: 'sm' as ShadowIntensityType, label: 'خفيف' },
                    { id: 'md' as ShadowIntensityType, label: 'متوسط' },
                    { id: 'lg' as ShadowIntensityType, label: 'قوي' },
                    { id: 'xl' as ShadowIntensityType, label: 'كثيف' },
                  ].map((opt) => (
                    <button
                      key={opt.id}
                      onClick={() => updateShapes({ shadowIntensity: opt.id })}
                      className={`px-2 py-2 text-xs font-bold rounded-lg border transition-all ${
                        theme.shapes.shadowIntensity === opt.id
                          ? 'bg-purple-600 text-white border-purple-400 shadow-md'
                          : 'bg-slate-950 text-slate-300 border-slate-800 hover:border-slate-700'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* SECTION 4: SIZING & SPACING */}
          {activeSection === 'SIZING' && (
            <div
              id="section-sizing"
              className="bg-slate-900 text-slate-100 rounded-2xl border border-slate-700/70 p-5 shadow-lg space-y-5"
            >
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <h3 className="font-bold text-sm text-slate-200 flex items-center gap-2">
                  <Sliders className="w-4 h-4 text-purple-400" />
                  أحجام الأزرار والمدخلات والتباعد (Size & Spacing)
                </h3>
              </div>

              {/* Button Size */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-300">حجم الأزرار الافتراضي (Button Size):</label>
                <div className="grid grid-cols-4 gap-2">
                  {[
                    { id: 'sm' as ButtonSizeType, label: 'صغير (SM)' },
                    { id: 'md' as ButtonSizeType, label: 'متوسط (MD)' },
                    { id: 'lg' as ButtonSizeType, label: 'كبير (LG)' },
                    { id: 'xl' as ButtonSizeType, label: 'ضخم (XL)' },
                  ].map((opt) => (
                    <button
                      key={opt.id}
                      onClick={() => updateSizing({ buttonSize: opt.id })}
                      className={`px-2 py-2 text-xs font-bold rounded-lg border transition-all ${
                        theme.sizing.buttonSize === opt.id
                          ? 'bg-blue-600 text-white border-blue-400'
                          : 'bg-slate-950 text-slate-300 border-slate-800'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Input Size */}
              <div className="space-y-2 pt-2 border-t border-slate-800/60">
                <label className="text-xs font-bold text-slate-300">حجم حقول الإدخال (Input Size):</label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'sm' as InputSizeType, label: 'صغير' },
                    { id: 'md' as InputSizeType, label: 'متوسط قياسي' },
                    { id: 'lg' as InputSizeType, label: 'كبير ومريح' },
                  ].map((opt) => (
                    <button
                      key={opt.id}
                      onClick={() => updateSizing({ inputSize: opt.id })}
                      className={`px-2.5 py-2 text-xs font-bold rounded-lg border transition-all ${
                        theme.sizing.inputSize === opt.id
                          ? 'bg-emerald-600 text-white border-emerald-400'
                          : 'bg-slate-950 text-slate-300 border-slate-800'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Spacing Density */}
              <div className="space-y-2 pt-2 border-t border-slate-800/60">
                <label className="text-xs font-bold text-slate-300">كثافة وتباعد العناصر (Layout Spacing):</label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'compact' as SpacingDensityType, label: 'مضغوط (لشاشات المحاسبة)' },
                    { id: 'normal' as SpacingDensityType, label: 'متوازن قياسي' },
                    { id: 'relaxed' as SpacingDensityType, label: 'واسع ومريح' },
                  ].map((opt) => (
                    <button
                      key={opt.id}
                      onClick={() => updateSizing({ spacingDensity: opt.id })}
                      className={`px-2 py-2 text-xs font-bold rounded-lg border transition-all ${
                        theme.sizing.spacingDensity === opt.id
                          ? 'bg-purple-600 text-white border-purple-400'
                          : 'bg-slate-950 text-slate-300 border-slate-800'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Zoom Slider Details */}
              <div className="space-y-2 pt-2 border-t border-slate-800/60">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-300">شريط التحكم في تكبير/تصغير الواجهة (Zoom %):</label>
                  <span className="font-mono text-xs font-bold text-gold-400 bg-slate-950 px-2.5 py-0.5 rounded border border-slate-800">
                    {theme.zoomLevel}%
                  </span>
                </div>
                <input
                  type="range"
                  id="slider-zoom-level"
                  min="50"
                  max="200"
                  step="5"
                  value={theme.zoomLevel}
                  onChange={(e) => setZoomLevel(Number(e.target.value))}
                  className="w-full h-2.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-gold-500"
                />
                <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                  <span>50%</span>
                  <span>75%</span>
                  <span>100% (طبيعي)</span>
                  <span>150%</span>
                  <span>200%</span>
                </div>
              </div>
            </div>
          )}

          {/* SECTION 5: PREDEFINED THEMES */}
          {activeSection === 'PRESETS' && (
            <div
              id="section-presets"
              className="bg-slate-900 text-slate-100 rounded-2xl border border-slate-700/70 p-5 shadow-lg space-y-4"
            >
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <h3 className="font-bold text-sm text-slate-200 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-gold-400" />
                  مكتبة الثيمات الجاهزة (Predefined Themes Library)
                </h3>
                <span className="text-xs text-slate-400">{availablePresets.length} ثيمات معتمدة</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {availablePresets.map((preset) => {
                  const isSelected = theme.id === preset.id;
                  return (
                    <div
                      key={preset.id}
                      onClick={() => applyPreset(preset.id)}
                      className={`p-3.5 rounded-xl border cursor-pointer transition-all hover:scale-[1.02] flex flex-col justify-between ${
                        isSelected
                          ? 'bg-gradient-to-br from-slate-800 to-slate-900 border-gold-400 ring-2 ring-gold-500/40 shadow-lg'
                          : 'bg-slate-950 border-slate-800 hover:border-slate-700'
                      }`}
                    >
                      <div>
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-xs text-white">{preset.nameAr}</span>
                          {isSelected && (
                            <span className="bg-gold-500 text-slate-950 text-[10px] font-black px-2 py-0.5 rounded-full">
                              نشط
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-slate-400 mt-1 leading-snug">{preset.descriptionAr}</p>
                      </div>

                      {/* Color Palette Indicators */}
                      <div className="flex items-center gap-1.5 mt-3 pt-2 border-t border-slate-800">
                        <span
                          className="w-5 h-5 rounded-md border border-white/20 shadow-sm"
                          style={{ backgroundColor: preset.primaryPreview }}
                          title="Primary"
                        />
                        <span
                          className="w-5 h-5 rounded-md border border-white/20 shadow-sm"
                          style={{ backgroundColor: preset.secondaryPreview }}
                          title="Secondary"
                        />
                        <span
                          className="w-5 h-5 rounded-md border border-white/20 shadow-sm"
                          style={{ backgroundColor: preset.bgPreview }}
                          title="Background"
                        />
                        <span className="text-[10px] font-mono text-slate-400 mr-auto">
                          {preset.isDark ? '🌙 داكن' : '☀️ فاتح'}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* SECTION 6: CODE & JSON HUB */}
          {activeSection === 'CODE_JSON' && (
            <div
              id="section-code-json"
              className="bg-slate-900 text-slate-100 rounded-2xl border border-slate-700/70 p-5 shadow-lg space-y-4"
            >
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <h3 className="font-bold text-sm text-slate-200 flex items-center gap-2">
                  <FileCode className="w-4 h-4 text-blue-400" />
                  تصدير، استيراد وكود CSS Variables
                </h3>
              </div>

              {/* Action Buttons */}
              <div className="grid grid-cols-2 gap-3">
                <button
                  id="btn-export-theme-json"
                  onClick={handleExportJSON}
                  className="flex items-center justify-center gap-2 px-3 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow transition-all"
                >
                  <Download className="w-4 h-4" />
                  تصدير الثيم (JSON)
                </button>

                <label
                  id="btn-import-theme-json"
                  className="flex items-center justify-center gap-2 px-3 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs rounded-xl border border-slate-700 cursor-pointer shadow transition-all"
                >
                  <Upload className="w-4 h-4" />
                  استيراد ثيم (JSON)
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".json"
                    onChange={handleImportJSON}
                    className="hidden"
                  />
                </label>
              </div>

              {/* Copy CSS Variables Snippet */}
              <div className="space-y-2 pt-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-300">كود متغيرات CSS للمطورين:</span>
                  <button
                    onClick={handleCopyCSS}
                    className="flex items-center gap-1 text-xs text-gold-400 hover:text-gold-300 transition-colors"
                  >
                    {copiedCode ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-400" /> تم النسخ!
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" /> نسخ CSS
                      </>
                    )}
                  </button>
                </div>
                <pre className="p-3 bg-slate-950 rounded-xl border border-slate-800 text-[11px] font-mono text-emerald-400 max-h-48 overflow-y-auto leading-relaxed dir-ltr">
                  {getCSSVariablesString()}
                </pre>
              </div>
            </div>
          )}

          {/* Admin Role Permission Notice */}
          <div className="p-3.5 bg-slate-950/80 rounded-xl border border-slate-800 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2 text-slate-300">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>الصلاحية: <strong>مدير النظام (Admin)</strong> - التحكم العام بالمظهر</span>
            </div>
            <span className="text-slate-500 font-mono text-[10px]">
              v2.5 Live
            </span>
          </div>
        </div>

        {/* Right Side: LIVE INTERACTIVE PREVIEW STUDIO (7 Columns on XL) */}
        <div className="xl:col-span-7 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Eye className="w-4 h-4 text-blue-500" />
              <h2 className="text-sm font-bold text-slate-800 dark:text-slate-200">
                المعاينة الحية الفورية (Live Studio Preview)
              </h2>
            </div>
            <span className="text-xs text-slate-500 font-semibold">
              تنعكس التعديلات في الوقت الحقيقي بدون إعادة تحميل
            </span>
          </div>

          {/* PREVIEW CONTAINER STYLED DYNAMICALLY */}
          <div
            id="live-theme-preview-box"
            className="p-6 transition-all duration-200 border relative overflow-hidden"
            style={{
              backgroundColor: theme.colors.background,
              color: theme.colors.text,
              fontFamily: `'${theme.typography.fontFamily}', system-ui, sans-serif`,
              fontSize: `${theme.typography.baseFontSize}px`,
              lineHeight: theme.typography.lineHeight,
              borderRadius: theme.shapes.cardCorners === 'none' ? '0px' : theme.shapes.cardCorners === 'sm' ? '8px' : theme.shapes.cardCorners === 'md' ? '16px' : '24px',
              borderWidth: `${theme.shapes.borderWidth}px`,
              borderColor: theme.colors.borderColor,
            }}
          >
            {/* 1. Sample Header Inside Preview */}
            <div
              className="p-4 rounded-xl mb-5 flex items-center justify-between text-white shadow-md transition-all"
              style={{
                backgroundColor: theme.colors.primary,
                borderRadius: theme.shapes.cardCorners === 'none' ? '0px' : theme.shapes.cardCorners === 'sm' ? '6px' : theme.shapes.cardCorners === 'md' ? '12px' : '16px',
              }}
            >
              <div className="flex items-center gap-3">
                <div
                  className="w-9 h-9 flex items-center justify-center font-black rounded-lg shadow-sm"
                  style={{
                    backgroundColor: theme.colors.secondary,
                    color: '#0f172a',
                    borderRadius: theme.shapes.buttonCorners === 'full' ? '9999px' : '8px',
                  }}
                >
                  M
                </div>
                <div>
                  <h3 className="font-bold text-sm leading-none">مجموعة بن زياد التجارية المحدودة</h3>
                  <span className="text-[11px] opacity-80">نظام MeDo ERP المحاسبي الشامل</span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span
                  className="text-xs px-2.5 py-1 font-bold rounded shadow-sm"
                  style={{
                    backgroundColor: theme.colors.secondary,
                    color: '#0f172a',
                    borderRadius: theme.shapes.buttonCorners === 'full' ? '9999px' : '6px',
                  }}
                >
                  الفرع الرئيسي - صنعاء
                </span>
              </div>
            </div>

            {/* 2. Sample Metric KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-5">
              {[
                { label: 'إجمالي المبيعات اليومية', val: '4,850,000 ريال', icon: TrendingUp, delta: '+12.5%' },
                { label: 'المخزون المتوفر', val: '1,420 صنف', icon: Package, delta: '98% جاهزية' },
                { label: 'العملاء النشطون', val: '385 عميل', icon: Users, delta: '+8 هذا الأسبوع' },
              ].map((kpi, idx) => (
                <div
                  key={idx}
                  className="p-3.5 transition-all"
                  style={{
                    backgroundColor: theme.colors.cardBackground,
                    color: theme.colors.text,
                    borderRadius: theme.shapes.cardCorners === 'none' ? '0px' : theme.shapes.cardCorners === 'sm' ? '6px' : theme.shapes.cardCorners === 'md' ? '12px' : '16px',
                    borderWidth: `${theme.shapes.borderWidth}px`,
                    borderColor: theme.colors.borderColor,
                    boxShadow:
                      theme.shapes.shadowIntensity === 'none'
                        ? 'none'
                        : theme.shapes.shadowIntensity === 'sm'
                        ? '0 1px 2px rgba(0,0,0,0.05)'
                        : '0 4px 6px -1px rgba(0,0,0,0.1)',
                  }}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-semibold" style={{ color: theme.colors.textSecondary }}>
                      {kpi.label}
                    </span>
                    <kpi.icon className="w-4 h-4" style={{ color: theme.colors.primary }} />
                  </div>
                  <div className="text-base font-black tracking-tight" style={{ color: theme.colors.text }}>
                    {kpi.val}
                  </div>
                  <div className="text-[10px] font-bold mt-1" style={{ color: theme.colors.success }}>
                    {kpi.delta}
                  </div>
                </div>
              ))}
            </div>

            {/* 3. Sample Interactive Buttons & Form Controls */}
            <div
              className="p-4 mb-5 transition-all"
              style={{
                backgroundColor: theme.colors.cardBackground,
                borderRadius: theme.shapes.cardCorners === 'none' ? '0px' : theme.shapes.cardCorners === 'sm' ? '6px' : theme.shapes.cardCorners === 'md' ? '12px' : '16px',
                borderWidth: `${theme.shapes.borderWidth}px`,
                borderColor: theme.colors.borderColor,
              }}
            >
              <h4 className="text-xs font-bold mb-3" style={{ color: theme.colors.text }}>
                أزرار العمليات وحقول الإدخال (Action Buttons & Inputs):
              </h4>

              <div className="flex flex-wrap items-center gap-2.5 mb-4">
                {/* Primary Button */}
                <button
                  className="px-4 py-2 font-bold text-white shadow-sm transition-all"
                  style={{
                    backgroundColor: theme.colors.primary,
                    borderRadius:
                      theme.shapes.buttonCorners === 'none'
                        ? '0px'
                        : theme.shapes.buttonCorners === 'sm'
                        ? '6px'
                        : theme.shapes.buttonCorners === 'md'
                        ? '12px'
                        : theme.shapes.buttonCorners === 'lg'
                        ? '20px'
                        : '9999px',
                  }}
                >
                  زر رئيسي (Primary)
                </button>

                {/* Secondary Button */}
                <button
                  className="px-4 py-2 font-bold shadow-sm transition-all"
                  style={{
                    backgroundColor: theme.colors.secondary,
                    color: '#0f172a',
                    borderRadius:
                      theme.shapes.buttonCorners === 'none'
                        ? '0px'
                        : theme.shapes.buttonCorners === 'sm'
                        ? '6px'
                        : theme.shapes.buttonCorners === 'md'
                        ? '12px'
                        : theme.shapes.buttonCorners === 'lg'
                        ? '20px'
                        : '9999px',
                  }}
                >
                  زر ثانوي (Secondary)
                </button>

                {/* Outline Button */}
                <button
                  className="px-4 py-2 font-bold border transition-all"
                  style={{
                    color: theme.colors.primary,
                    borderColor: theme.colors.primary,
                    backgroundColor: 'transparent',
                    borderRadius:
                      theme.shapes.buttonCorners === 'none'
                        ? '0px'
                        : theme.shapes.buttonCorners === 'sm'
                        ? '6px'
                        : theme.shapes.buttonCorners === 'md'
                        ? '12px'
                        : theme.shapes.buttonCorners === 'lg'
                        ? '20px'
                        : '9999px',
                  }}
                >
                  زر بإطار (Outline)
                </button>

                {/* Danger Button */}
                <button
                  className="px-4 py-2 font-bold text-white transition-all"
                  style={{
                    backgroundColor: theme.colors.error,
                    borderRadius:
                      theme.shapes.buttonCorners === 'none'
                        ? '0px'
                        : theme.shapes.buttonCorners === 'sm'
                        ? '6px'
                        : theme.shapes.buttonCorners === 'md'
                        ? '12px'
                        : theme.shapes.buttonCorners === 'lg'
                        ? '20px'
                        : '9999px',
                  }}
                >
                  حذف / إلغاء
                </button>
              </div>

              {/* Sample Inputs */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-semibold block mb-1" style={{ color: theme.colors.textSecondary }}>
                    رقم الفاتورة أو القيد:
                  </label>
                  <input
                    type="text"
                    defaultValue="INV-2026-089"
                    readOnly
                    className="w-full px-3 py-2 text-xs font-mono font-bold outline-none"
                    style={{
                      backgroundColor: theme.colors.background,
                      color: theme.colors.text,
                      borderColor: theme.colors.borderColor,
                      borderWidth: `${theme.shapes.borderWidth}px`,
                      borderRadius:
                        theme.shapes.buttonCorners === 'none'
                          ? '0px'
                          : theme.shapes.buttonCorners === 'sm'
                          ? '6px'
                          : theme.shapes.buttonCorners === 'md'
                          ? '10px'
                          : '16px',
                    }}
                  />
                </div>

                <div>
                  <label className="text-[11px] font-semibold block mb-1" style={{ color: theme.colors.textSecondary }}>
                    العملة المعتمدة:
                  </label>
                  <select
                    defaultValue="YER"
                    className="w-full px-3 py-2 text-xs font-bold outline-none"
                    style={{
                      backgroundColor: theme.colors.background,
                      color: theme.colors.text,
                      borderColor: theme.colors.borderColor,
                      borderWidth: `${theme.shapes.borderWidth}px`,
                      borderRadius:
                        theme.shapes.buttonCorners === 'none'
                          ? '0px'
                          : theme.shapes.buttonCorners === 'sm'
                          ? '6px'
                          : theme.shapes.buttonCorners === 'md'
                          ? '10px'
                          : '16px',
                    }}
                  >
                    <option value="YER">ريال يمني (YER)</option>
                    <option value="SAR">ريال سعودي (SAR)</option>
                    <option value="USD">دولار أمريكي (USD)</option>
                  </select>
                </div>
              </div>
            </div>

            {/* 4. Sample SAP Fiori Data Table */}
            <div
              className="overflow-hidden mb-5 transition-all"
              style={{
                borderRadius:
                  theme.shapes.tableCorners === 'none'
                    ? '0px'
                    : theme.shapes.tableCorners === 'sm'
                    ? '6px'
                    : theme.shapes.tableCorners === 'md'
                    ? '12px'
                    : '20px',
                borderWidth: `${theme.shapes.borderWidth}px`,
                borderColor: theme.colors.borderColor,
                boxShadow:
                  theme.shapes.shadowIntensity === 'none'
                    ? 'none'
                    : '0 2px 4px rgba(0,0,0,0.06)',
              }}
            >
              <table className="w-full text-right text-xs">
                <thead
                  style={{
                    backgroundColor: theme.colors.primary,
                    color: '#ffffff',
                  }}
                >
                  <tr>
                    <th className="p-2.5 font-bold">رقم المستند</th>
                    <th className="p-2.5 font-bold">البيان / الحساب</th>
                    <th className="p-2.5 font-bold">المبلغ الصافي</th>
                    <th className="p-2.5 font-bold">الحالة</th>
                  </tr>
                </thead>
                <tbody
                  style={{
                    backgroundColor: theme.colors.cardBackground,
                    color: theme.colors.text,
                  }}
                >
                  <tr className="border-b" style={{ borderColor: theme.colors.borderColor }}>
                    <td className="p-2.5 font-mono font-bold">JV-2026-104</td>
                    <td className="p-2.5">فاتورة مبيعات نقدية - فرع التحرير</td>
                    <td className="p-2.5 font-mono font-bold" style={{ color: theme.colors.primary }}>
                      850,000 YER
                    </td>
                    <td className="p-2.5">
                      <span
                        className="text-[10px] font-bold px-2 py-0.5 rounded text-white"
                        style={{ backgroundColor: theme.colors.success }}
                      >
                        مرحل
                      </span>
                    </td>
                  </tr>
                  <tr className="border-b" style={{ borderColor: theme.colors.borderColor }}>
                    <td className="p-2.5 font-mono font-bold">PO-2026-042</td>
                    <td className="p-2.5">أمر توريد بضاعة - مورد مواد غذائية</td>
                    <td className="p-2.5 font-mono font-bold" style={{ color: theme.colors.primary }}>
                      1,200,000 YER
                    </td>
                    <td className="p-2.5">
                      <span
                        className="text-[10px] font-bold px-2 py-0.5 rounded text-white"
                        style={{ backgroundColor: theme.colors.warning }}
                      >
                        قيد الاعتماد
                      </span>
                    </td>
                  </tr>
                  <tr>
                    <td className="p-2.5 font-mono font-bold">PAY-2026-019</td>
                    <td className="p-2.5">سند صرف رواتب وأجور الموظفين</td>
                    <td className="p-2.5 font-mono font-bold" style={{ color: theme.colors.primary }}>
                      450,000 YER
                    </td>
                    <td className="p-2.5">
                      <span
                        className="text-[10px] font-bold px-2 py-0.5 rounded text-white"
                        style={{ backgroundColor: theme.colors.error }}
                      >
                        معلق
                      </span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* 5. Sample Alert Banners */}
            <div className="space-y-2">
              <div
                className="p-3 rounded-lg flex items-center justify-between text-xs font-bold"
                style={{
                  backgroundColor: `${theme.colors.success}18`,
                  color: theme.colors.success,
                  border: `1px solid ${theme.colors.success}40`,
                  borderRadius:
                    theme.shapes.cardCorners === 'none'
                      ? '0px'
                      : theme.shapes.cardCorners === 'sm'
                      ? '6px'
                      : '10px',
                }}
              >
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4" />
                  تمت مطابقة قيود اليومية بنجاح بنسبة 100%
                </div>
                <span className="text-[10px] underline cursor-pointer" style={{ color: theme.colors.link }}>
                  عرض التقرير
                </span>
              </div>

              <div
                className="p-3 rounded-lg flex items-center justify-between text-xs font-bold"
                style={{
                  backgroundColor: `${theme.colors.warning}18`,
                  color: theme.colors.warning,
                  border: `1px solid ${theme.colors.warning}40`,
                  borderRadius:
                    theme.shapes.cardCorners === 'none'
                      ? '0px'
                      : theme.shapes.cardCorners === 'sm'
                      ? '6px'
                      : '10px',
                }}
              >
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4" />
                  تنبيه: اقتراب 3 أصناف من حد إعادة الطلب بالمستودع
                </div>
                <span className="text-[10px] underline cursor-pointer" style={{ color: theme.colors.link }}>
                  توليد أمر شراء
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
