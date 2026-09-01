import React, { createContext, useContext, useState, useEffect } from 'react';

export type PredefinedThemeId =
  | 'DEFAULT'
  | 'ROYAL_PURPLE_WHITE'
  | 'ACCOUNTANT'
  | 'ROYAL_DARK'
  | 'AI_INTELLIGENCE'
  | 'LIGHT'
  | 'DARK'
  | 'GREEN'
  | 'RED'
  | 'BLUE'
  | 'AMBER'
  | 'PURPLE'
  | 'CUSTOM';

export type TableCornersType = 'none' | 'sm' | 'md' | 'lg';
export type ButtonCornersType = 'none' | 'sm' | 'md' | 'lg' | 'full';
export type CardCornersType = 'none' | 'sm' | 'md' | 'lg';
export type ShadowIntensityType = 'none' | 'sm' | 'md' | 'lg' | 'xl';
export type ButtonSizeType = 'sm' | 'md' | 'lg' | 'xl';
export type InputSizeType = 'sm' | 'md' | 'lg';
export type SpacingDensityType = 'compact' | 'normal' | 'relaxed';

export interface ThemeColors {
  primary: string;
  primaryHover: string;
  secondary: string;
  background: string;
  cardBackground: string;
  text: string;
  textSecondary: string;
  link: string;
  warning: string;
  error: string;
  success: string;
  sidebarBackground: string;
  headerBackground: string;
  borderColor: string;
}

export interface ThemeTypography {
  fontFamily: string;
  baseFontSize: number; // 12 to 24 px
  headingScale: number; // 1.0 to 1.8
  lineHeight: number; // 1.2 to 2.0
}

export interface ThemeShapes {
  tableCorners: TableCornersType;
  buttonCorners: ButtonCornersType;
  cardCorners: CardCornersType;
  borderWidth: number; // 0, 1, 2, 3 px
  shadowIntensity: ShadowIntensityType;
}

export interface ThemeSizing {
  buttonSize: ButtonSizeType;
  inputSize: InputSizeType;
  spacingDensity: SpacingDensityType;
}

export interface ThemeSettings {
  id: PredefinedThemeId;
  nameAr: string;
  nameEn: string;
  isDark: boolean;
  colors: ThemeColors;
  typography: ThemeTypography;
  shapes: ThemeShapes;
  sizing: ThemeSizing;
  zoomLevel: number; // 50% to 200%
  lastModified: string;
}

export interface ThemePreset {
  id: PredefinedThemeId;
  nameAr: string;
  nameEn: string;
  descriptionAr: string;
  isDark: boolean;
  primaryPreview: string;
  secondaryPreview: string;
  bgPreview: string;
  theme: Omit<ThemeSettings, 'lastModified'>;
}

export const DEFAULT_THEME_BASE: Omit<ThemeSettings, 'lastModified'> = {
  id: 'DEFAULT',
  nameAr: 'الأزرق الداكن والذهبي (SAP Fiori الافتراضي)',
  nameEn: 'Fiori Navy & Gold',
  isDark: false,
  colors: {
    primary: '#003366',
    primaryHover: '#0a2540',
    secondary: '#d4af37',
    background: '#f8fafc',
    cardBackground: '#ffffff',
    text: '#0f172a',
    textSecondary: '#64748b',
    link: '#003366',
    warning: '#d97706',
    error: '#dc2626',
    success: '#059669',
    sidebarBackground: '#081d33',
    headerBackground: '#0a2540',
    borderColor: '#e2e8f0',
  },
  typography: {
    fontFamily: 'Cairo',
    baseFontSize: 14,
    headingScale: 1.25,
    lineHeight: 1.5,
  },
  shapes: {
    tableCorners: 'md',
    buttonCorners: 'md',
    cardCorners: 'md',
    borderWidth: 1,
    shadowIntensity: 'sm',
  },
  sizing: {
    buttonSize: 'md',
    inputSize: 'md',
    spacingDensity: 'normal',
  },
  zoomLevel: 100,
};

export const THEME_PRESETS: Record<PredefinedThemeId, ThemePreset> = {
  DEFAULT: {
    id: 'DEFAULT',
    nameAr: 'الأزرق الداكن والذهبي (SAP Fiori الافتراضي)',
    nameEn: 'Fiori Navy & Gold (Default)',
    descriptionAr: 'الثيم القياسي الكلاسيكي المعتمد لنظام MeDo ERP مستوحى من SAP Fiori 3',
    isDark: false,
    primaryPreview: '#003366',
    secondaryPreview: '#d4af37',
    bgPreview: '#f8fafc',
    theme: DEFAULT_THEME_BASE,
  },
  ROYAL_PURPLE_WHITE: {
    id: 'ROYAL_PURPLE_WHITE',
    nameAr: 'الملكي البنفسجي والأبيض الفاخر (Imperial Purple & White)',
    nameEn: 'Imperial Royal Purple & Porcelain White',
    descriptionAr: 'مزيج ملكي رسمي فخم يجمع بين البنفسجي المخملي الإمبراطوري والأبيض اللؤلؤي الناصع مع لمسات ذهبية للمدراء والمكاتب الرسمية',
    isDark: false,
    primaryPreview: '#581c87',
    secondaryPreview: '#c084fc',
    bgPreview: '#faf5ff',
    theme: {
      id: 'ROYAL_PURPLE_WHITE',
      nameAr: 'الملكي البنفسجي والأبيض الفاخر (Imperial Purple & White)',
      nameEn: 'Imperial Royal Purple & Porcelain White',
      isDark: false,
      colors: {
        primary: '#581c87',
        primaryHover: '#3b0764',
        secondary: '#c084fc',
        background: '#faf5ff',
        cardBackground: '#ffffff',
        text: '#2e1065',
        textSecondary: '#6b21a8',
        link: '#7e22ce',
        warning: '#d97706',
        error: '#dc2626',
        success: '#059669',
        sidebarBackground: '#2e1065',
        headerBackground: '#3b0764',
        borderColor: '#e9d5ff',
      },
      typography: {
        fontFamily: 'Cairo',
        baseFontSize: 14,
        headingScale: 1.28,
        lineHeight: 1.55,
      },
      shapes: {
        tableCorners: 'md',
        buttonCorners: 'lg',
        cardCorners: 'lg',
        borderWidth: 1,
        shadowIntensity: 'md',
      },
      sizing: {
        buttonSize: 'md',
        inputSize: 'md',
        spacingDensity: 'normal',
      },
      zoomLevel: 100,
    },
  },
  ACCOUNTANT: {
    id: 'ACCOUNTANT',
    nameAr: 'ثيم المحاسب المالي المعتمد (Chartered Accountant)',
    nameEn: 'Chartered Accountant & Financial Ledger',
    descriptionAr: 'ثيم رسمي وقور مصمم خصيصاً للمدققين والمحاسبين بدقة بصرية فائقة وألوان تيل مالية وهدوء للجداول والدفاتر',
    isDark: false,
    primaryPreview: '#0f766e',
    secondaryPreview: '#0284c7',
    bgPreview: '#f8fafc',
    theme: {
      id: 'ACCOUNTANT',
      nameAr: 'ثيم المحاسب المالي المعتمد (Chartered Accountant)',
      nameEn: 'Chartered Accountant & Financial Ledger',
      isDark: false,
      colors: {
        primary: '#0f766e',
        primaryHover: '#115e59',
        secondary: '#0284c7',
        background: '#f8fafc',
        cardBackground: '#ffffff',
        text: '#0f172a',
        textSecondary: '#475569',
        link: '#0d9488',
        warning: '#d97706',
        error: '#b91c1c',
        success: '#047857',
        sidebarBackground: '#134e4a',
        headerBackground: '#0f766e',
        borderColor: '#cbd5e1',
      },
      typography: {
        fontFamily: 'IBM Plex Sans Arabic',
        baseFontSize: 13,
        headingScale: 1.2,
        lineHeight: 1.45,
      },
      shapes: {
        tableCorners: 'sm',
        buttonCorners: 'sm',
        cardCorners: 'md',
        borderWidth: 1,
        shadowIntensity: 'sm',
      },
      sizing: {
        buttonSize: 'sm',
        inputSize: 'sm',
        spacingDensity: 'compact',
      },
      zoomLevel: 100,
    },
  },
  ROYAL_DARK: {
    id: 'ROYAL_DARK',
    nameAr: 'الداكن الملكي الفاحم (Royal Midnight Luxe)',
    nameEn: 'Royal Midnight Obsidian & Gold',
    descriptionAr: 'مظهر ليلي رسمي فائق الفخامة بسواد مخملي عميق مع لمسات تذهيب ملكية وتفاصيل بنفسجية هادئة مريحة للعين',
    isDark: true,
    primaryPreview: '#fbbf24',
    secondaryPreview: '#a78bfa',
    bgPreview: '#090d16',
    theme: {
      id: 'ROYAL_DARK',
      nameAr: 'الداكن الملكي الفاحم (Royal Midnight Luxe)',
      nameEn: 'Royal Midnight Obsidian & Gold',
      isDark: true,
      colors: {
        primary: '#fbbf24',
        primaryHover: '#f59e0b',
        secondary: '#a78bfa',
        background: '#090d16',
        cardBackground: '#0f172a',
        text: '#f8fafc',
        textSecondary: '#94a3b8',
        link: '#38bdf8',
        warning: '#f59e0b',
        error: '#f87171',
        success: '#34d399',
        sidebarBackground: '#030712',
        headerBackground: '#0b0f19',
        borderColor: '#1e293b',
      },
      typography: {
        fontFamily: 'Cairo',
        baseFontSize: 14,
        headingScale: 1.25,
        lineHeight: 1.5,
      },
      shapes: {
        tableCorners: 'md',
        buttonCorners: 'md',
        cardCorners: 'md',
        borderWidth: 1,
        shadowIntensity: 'lg',
      },
      sizing: {
        buttonSize: 'md',
        inputSize: 'md',
        spacingDensity: 'normal',
      },
      zoomLevel: 100,
    },
  },
  AI_INTELLIGENCE: {
    id: 'AI_INTELLIGENCE',
    nameAr: 'ثيم الذكاء الاصطناعي السيبراني (AI Gemini Intelligence)',
    nameEn: 'AI Gemini Cyber Intelligence',
    descriptionAr: 'طابع مستقبلي ذكي مستوحى من واجهات الذكاء الاصطناعي Gemini مع أطياف نيلي وسيان نيون متوهجة للتحليلات المتقدمة',
    isDark: true,
    primaryPreview: '#6366f1',
    secondaryPreview: '#06b6d4',
    bgPreview: '#0a0a18',
    theme: {
      id: 'AI_INTELLIGENCE',
      nameAr: 'ثيم الذكاء الاصطناعي السيبراني (AI Gemini Intelligence)',
      nameEn: 'AI Gemini Cyber Intelligence',
      isDark: true,
      colors: {
        primary: '#6366f1',
        primaryHover: '#4f46e5',
        secondary: '#06b6d4',
        background: '#0a0a18',
        cardBackground: '#12122b',
        text: '#f8fafc',
        textSecondary: '#a5b4fc',
        link: '#38bdf8',
        warning: '#fbbf24',
        error: '#f43f5e',
        success: '#10b981',
        sidebarBackground: '#070714',
        headerBackground: '#0f0f26',
        borderColor: '#312e81',
      },
      typography: {
        fontFamily: 'Readex Pro',
        baseFontSize: 14,
        headingScale: 1.3,
        lineHeight: 1.55,
      },
      shapes: {
        tableCorners: 'lg',
        buttonCorners: 'full',
        cardCorners: 'lg',
        borderWidth: 1,
        shadowIntensity: 'xl',
      },
      sizing: {
        buttonSize: 'md',
        inputSize: 'md',
        spacingDensity: 'normal',
      },
      zoomLevel: 100,
    },
  },
  LIGHT: {
    id: 'LIGHT',
    nameAr: 'الثيم الفاتح النقي (Modern Light)',
    nameEn: 'Pure Clean Light',
    descriptionAr: 'واجهة بيضاء ناصعة بألوان هادئة ووضوح بصري فائق للمكاتب المضيئة',
    isDark: false,
    primaryPreview: '#2563eb',
    secondaryPreview: '#0ea5e9',
    bgPreview: '#ffffff',
    theme: {
      id: 'LIGHT',
      nameAr: 'الثيم الفاتح النقي (Modern Light)',
      nameEn: 'Pure Clean Light',
      isDark: false,
      colors: {
        primary: '#2563eb',
        primaryHover: '#1d4ed8',
        secondary: '#0ea5e9',
        background: '#ffffff',
        cardBackground: '#f8fafc',
        text: '#0f172a',
        textSecondary: '#475569',
        link: '#2563eb',
        warning: '#f59e0b',
        error: '#ef4444',
        success: '#10b981',
        sidebarBackground: '#f1f5f9',
        headerBackground: '#ffffff',
        borderColor: '#cbd5e1',
      },
      typography: {
        fontFamily: 'Tajawal',
        baseFontSize: 14,
        headingScale: 1.25,
        lineHeight: 1.55,
      },
      shapes: {
        tableCorners: 'md',
        buttonCorners: 'md',
        cardCorners: 'lg',
        borderWidth: 1,
        shadowIntensity: 'md',
      },
      sizing: {
        buttonSize: 'md',
        inputSize: 'md',
        spacingDensity: 'normal',
      },
      zoomLevel: 100,
    },
  },
  DARK: {
    id: 'DARK',
    nameAr: 'الأسود الملكي والفحمي (Obsidian Dark)',
    nameEn: 'Obsidian Enterprise Dark',
    descriptionAr: 'مظهر ليلي فخم عالي التباين ومريح للعين أثناء العمل الليلي والمستودعات',
    isDark: true,
    primaryPreview: '#38bdf8',
    secondaryPreview: '#f59e0b',
    bgPreview: '#0b0f19',
    theme: {
      id: 'DARK',
      nameAr: 'الأسود الملكي والفحمي (Obsidian Dark)',
      nameEn: 'Obsidian Enterprise Dark',
      isDark: true,
      colors: {
        primary: '#38bdf8',
        primaryHover: '#0284c7',
        secondary: '#f59e0b',
        background: '#0b0f19',
        cardBackground: '#111827',
        text: '#f8fafc',
        textSecondary: '#94a3b8',
        link: '#38bdf8',
        warning: '#fbbf24',
        error: '#f87171',
        success: '#34d399',
        sidebarBackground: '#030712',
        headerBackground: '#0b0f19',
        borderColor: '#1f2937',
      },
      typography: {
        fontFamily: 'Cairo',
        baseFontSize: 14,
        headingScale: 1.25,
        lineHeight: 1.5,
      },
      shapes: {
        tableCorners: 'md',
        buttonCorners: 'md',
        cardCorners: 'md',
        borderWidth: 1,
        shadowIntensity: 'md',
      },
      sizing: {
        buttonSize: 'md',
        inputSize: 'md',
        spacingDensity: 'normal',
      },
      zoomLevel: 100,
    },
  },
  GREEN: {
    id: 'GREEN',
    nameAr: 'الأخضر الزمردي (Emerald Growth)',
    nameEn: 'Emerald Oasis Green',
    descriptionAr: 'طابع مستوحى من النمو المالي والاستقرار الاقتصادي بدرجات الزمرد المنعشة',
    isDark: false,
    primaryPreview: '#059669',
    secondaryPreview: '#10b981',
    bgPreview: '#f0fdf4',
    theme: {
      id: 'GREEN',
      nameAr: 'الأخضر الزمردي (Emerald Growth)',
      nameEn: 'Emerald Oasis Green',
      isDark: false,
      colors: {
        primary: '#059669',
        primaryHover: '#047857',
        secondary: '#10b981',
        background: '#f0fdf4',
        cardBackground: '#ffffff',
        text: '#064e3b',
        textSecondary: '#047857',
        link: '#059669',
        warning: '#d97706',
        error: '#dc2626',
        success: '#059669',
        sidebarBackground: '#064e3b',
        headerBackground: '#047857',
        borderColor: '#a7f3d0',
      },
      typography: {
        fontFamily: 'Almarai',
        baseFontSize: 14,
        headingScale: 1.25,
        lineHeight: 1.5,
      },
      shapes: {
        tableCorners: 'md',
        buttonCorners: 'lg',
        cardCorners: 'lg',
        borderWidth: 1,
        shadowIntensity: 'sm',
      },
      sizing: {
        buttonSize: 'md',
        inputSize: 'md',
        spacingDensity: 'normal',
      },
      zoomLevel: 100,
    },
  },
  RED: {
    id: 'RED',
    nameAr: 'الأحمر العودي الملكي (Imperial Ruby)',
    nameEn: 'Imperial Ruby Red',
    descriptionAr: 'درجات الأحمر القاني والعنابي الفخم للشركات الكبرى والمؤسسات القيادية',
    isDark: false,
    primaryPreview: '#991b1b',
    secondaryPreview: '#ef4444',
    bgPreview: '#fef2f2',
    theme: {
      id: 'RED',
      nameAr: 'الأحمر العودي الملكي (Imperial Ruby)',
      nameEn: 'Imperial Ruby Red',
      isDark: false,
      colors: {
        primary: '#991b1b',
        primaryHover: '#7f1d1d',
        secondary: '#ef4444',
        background: '#fef2f2',
        cardBackground: '#ffffff',
        text: '#450a0a',
        textSecondary: '#7f1d1d',
        link: '#991b1b',
        warning: '#d97706',
        error: '#dc2626',
        success: '#059669',
        sidebarBackground: '#450a0a',
        headerBackground: '#7f1d1d',
        borderColor: '#fecaca',
      },
      typography: {
        fontFamily: 'IBM Plex Sans Arabic',
        baseFontSize: 14,
        headingScale: 1.25,
        lineHeight: 1.5,
      },
      shapes: {
        tableCorners: 'md',
        buttonCorners: 'md',
        cardCorners: 'md',
        borderWidth: 1,
        shadowIntensity: 'sm',
      },
      sizing: {
        buttonSize: 'md',
        inputSize: 'md',
        spacingDensity: 'normal',
      },
      zoomLevel: 100,
    },
  },
  BLUE: {
    id: 'BLUE',
    nameAr: 'الأزرق السماوي والبحري (Sapphire Sky)',
    nameEn: 'Sapphire Sky Blue',
    descriptionAr: 'مظهر منعش حديث بألوان السماء والياقوت الأزرق لسهولة العمل المكتبي',
    isDark: false,
    primaryPreview: '#0284c7',
    secondaryPreview: '#38bdf8',
    bgPreview: '#f0f9ff',
    theme: {
      id: 'BLUE',
      nameAr: 'الأزرق السماوي والبحري (Sapphire Sky)',
      nameEn: 'Sapphire Sky Blue',
      isDark: false,
      colors: {
        primary: '#0284c7',
        primaryHover: '#0369a1',
        secondary: '#38bdf8',
        background: '#f0f9ff',
        cardBackground: '#ffffff',
        text: '#0c4a6e',
        textSecondary: '#0369a1',
        link: '#0284c7',
        warning: '#d97706',
        error: '#dc2626',
        success: '#059669',
        sidebarBackground: '#0c4a6e',
        headerBackground: '#0369a1',
        borderColor: '#bae6fd',
      },
      typography: {
        fontFamily: 'Readex Pro',
        baseFontSize: 14,
        headingScale: 1.25,
        lineHeight: 1.5,
      },
      shapes: {
        tableCorners: 'md',
        buttonCorners: 'md',
        cardCorners: 'lg',
        borderWidth: 1,
        shadowIntensity: 'sm',
      },
      sizing: {
        buttonSize: 'md',
        inputSize: 'md',
        spacingDensity: 'normal',
      },
      zoomLevel: 100,
    },
  },
  AMBER: {
    id: 'AMBER',
    nameAr: 'الصحراوي والكهرمان الذهبي (Desert Amber)',
    nameEn: 'Desert Gold & Amber',
    descriptionAr: 'طابع عربي أصيل بدرجات الرمل الذهبي والكهرمان الدافئ المريح',
    isDark: false,
    primaryPreview: '#b45309',
    secondaryPreview: '#f59e0b',
    bgPreview: '#fffbeb',
    theme: {
      id: 'AMBER',
      nameAr: 'الصحراوي والكهرمان الذهبي (Desert Amber)',
      nameEn: 'Desert Gold & Amber',
      isDark: false,
      colors: {
        primary: '#b45309',
        primaryHover: '#92400e',
        secondary: '#f59e0b',
        background: '#fffbeb',
        cardBackground: '#ffffff',
        text: '#451a03',
        textSecondary: '#78350f',
        link: '#b45309',
        warning: '#d97706',
        error: '#dc2626',
        success: '#059669',
        sidebarBackground: '#451a03',
        headerBackground: '#78350f',
        borderColor: '#fde68a',
      },
      typography: {
        fontFamily: 'Cairo',
        baseFontSize: 14,
        headingScale: 1.25,
        lineHeight: 1.5,
      },
      shapes: {
        tableCorners: 'md',
        buttonCorners: 'lg',
        cardCorners: 'lg',
        borderWidth: 1,
        shadowIntensity: 'md',
      },
      sizing: {
        buttonSize: 'md',
        inputSize: 'md',
        spacingDensity: 'normal',
      },
      zoomLevel: 100,
    },
  },
  PURPLE: {
    id: 'PURPLE',
    nameAr: 'البنفسجي الملكي (Royal Amethyst)',
    nameEn: 'Royal Amethyst Violet',
    descriptionAr: 'درجات الجمشت البنفسجي الفاخر لإعطاء طابع عصري تقني متطور',
    isDark: false,
    primaryPreview: '#7e22ce',
    secondaryPreview: '#a855f7',
    bgPreview: '#faf5ff',
    theme: {
      id: 'PURPLE',
      nameAr: 'البنفسجي الملكي (Royal Amethyst)',
      nameEn: 'Royal Amethyst Violet',
      isDark: false,
      colors: {
        primary: '#7e22ce',
        primaryHover: '#6b21a8',
        secondary: '#a855f7',
        background: '#faf5ff',
        cardBackground: '#ffffff',
        text: '#3b0764',
        textSecondary: '#6b21a8',
        link: '#7e22ce',
        warning: '#d97706',
        error: '#dc2626',
        success: '#059669',
        sidebarBackground: '#3b0764',
        headerBackground: '#581c87',
        borderColor: '#e9d5ff',
      },
      typography: {
        fontFamily: 'Noto Sans Arabic',
        baseFontSize: 14,
        headingScale: 1.25,
        lineHeight: 1.5,
      },
      shapes: {
        tableCorners: 'md',
        buttonCorners: 'md',
        cardCorners: 'lg',
        borderWidth: 1,
        shadowIntensity: 'md',
      },
      sizing: {
        buttonSize: 'md',
        inputSize: 'md',
        spacingDensity: 'normal',
      },
      zoomLevel: 100,
    },
  },
  CUSTOM: {
    id: 'CUSTOM',
    nameAr: 'ثيم مخصص (Custom Studio)',
    nameEn: 'Custom Configured Theme',
    descriptionAr: 'ثيم مخصص تم بناؤه وتعديله عبر محرر الثيمات والسمات',
    isDark: false,
    primaryPreview: '#003366',
    secondaryPreview: '#d4af37',
    bgPreview: '#f8fafc',
    theme: {
      ...DEFAULT_THEME_BASE,
      id: 'CUSTOM',
      nameAr: 'ثيم مخصص',
      nameEn: 'Custom Theme',
    },
  },
};

const STORAGE_KEY = 'medo_erp_theme_config_v2';

export interface ThemeContextType {
  theme: ThemeSettings;
  updateColors: (colors: Partial<ThemeColors>) => void;
  updateTypography: (typography: Partial<ThemeTypography>) => void;
  updateShapes: (shapes: Partial<ThemeShapes>) => void;
  updateSizing: (sizing: Partial<ThemeSizing>) => void;
  updateFullTheme: (theme: Partial<ThemeSettings>) => void;
  applyPreset: (presetId: PredefinedThemeId) => void;
  setZoomLevel: (zoom: number) => void;
  zoomIn: () => void;
  zoomOut: () => void;
  resetZoom: () => void;
  resetToDefault: () => void;
  exportThemeJSON: () => string;
  importThemeJSON: (jsonString: string) => boolean;
  getCSSVariablesString: () => string;
  availablePresets: ThemePreset[];
  availableFonts: string[];
}

export const AVAILABLE_FONTS = [
  'Cairo',
  'Tajawal',
  'IBM Plex Sans Arabic',
  'Almarai',
  'Readex Pro',
  'Noto Sans Arabic',
  'Amiri',
  'Arial',
  'Tahoma',
  'Times New Roman',
];

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setTheme] = useState<ThemeSettings>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        return {
          ...THEME_PRESETS.DEFAULT.theme,
          ...parsed,
          colors: { ...THEME_PRESETS.DEFAULT.theme.colors, ...parsed.colors },
          typography: { ...THEME_PRESETS.DEFAULT.theme.typography, ...parsed.typography },
          shapes: { ...THEME_PRESETS.DEFAULT.theme.shapes, ...parsed.shapes },
          sizing: { ...THEME_PRESETS.DEFAULT.theme.sizing, ...parsed.sizing },
          lastModified: parsed.lastModified || new Date().toISOString(),
        };
      }
    } catch (e) {
      console.warn('Failed to parse saved theme from localStorage', e);
    }
    return {
      ...THEME_PRESETS.DEFAULT.theme,
      lastModified: new Date().toISOString(),
    };
  });

  // Calculate Radius Values
  const getRadiusPx = (corner: TableCornersType | ButtonCornersType | CardCornersType): string => {
    switch (corner) {
      case 'none':
        return '0px';
      case 'sm':
        return '6px';
      case 'md':
        return '12px';
      case 'lg':
        return '20px';
      case 'full':
        return '9999px';
      default:
        return '12px';
    }
  };

  // Calculate Shadow CSS
  const getShadowCss = (intensity: ShadowIntensityType): string => {
    switch (intensity) {
      case 'none':
        return 'none';
      case 'sm':
        return '0 1px 2px 0 rgba(0, 0, 0, 0.05)';
      case 'md':
        return '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -2px rgba(0, 0, 0, 0.1)';
      case 'lg':
        return '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -4px rgba(0, 0, 0, 0.1)';
      case 'xl':
        return '0 20px 25px -5px rgba(0, 0, 0, 0.15), 0 8px 10px -6px rgba(0, 0, 0, 0.1)';
      default:
        return '0 1px 3px 0 rgba(0, 0, 0, 0.1)';
    }
  };

  // Apply CSS Variables in Real Time to :root / document.documentElement
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(theme));
    } catch (e) {}

    const root = document.documentElement;

    // Color CSS Variables
    root.style.setProperty('--theme-primary', theme.colors.primary);
    root.style.setProperty('--theme-primary-hover', theme.colors.primaryHover);
    root.style.setProperty('--theme-secondary', theme.colors.secondary);
    root.style.setProperty('--theme-bg', theme.colors.background);
    root.style.setProperty('--theme-card-bg', theme.colors.cardBackground);
    root.style.setProperty('--theme-text', theme.colors.text);
    root.style.setProperty('--theme-text-muted', theme.colors.textSecondary);
    root.style.setProperty('--theme-link', theme.colors.link);
    root.style.setProperty('--theme-warning', theme.colors.warning);
    root.style.setProperty('--theme-error', theme.colors.error);
    root.style.setProperty('--theme-success', theme.colors.success);
    root.style.setProperty('--theme-sidebar-bg', theme.colors.sidebarBackground);
    root.style.setProperty('--theme-header-bg', theme.colors.headerBackground);
    root.style.setProperty('--theme-border-color', theme.colors.borderColor);

    // Typography Variables
    root.style.setProperty('--theme-font-family', `'${theme.typography.fontFamily}', system-ui, sans-serif`);
    root.style.setProperty('--theme-font-size', `${theme.typography.baseFontSize}px`);
    root.style.setProperty('--theme-heading-scale', `${theme.typography.headingScale}`);
    root.style.setProperty('--theme-line-height', `${theme.typography.lineHeight}`);

    // Shapes & Radius Variables
    root.style.setProperty('--theme-table-radius', getRadiusPx(theme.shapes.tableCorners));
    root.style.setProperty('--theme-button-radius', getRadiusPx(theme.shapes.buttonCorners));
    root.style.setProperty('--theme-card-radius', getRadiusPx(theme.shapes.cardCorners));
    root.style.setProperty('--theme-border-width', `${theme.shapes.borderWidth}px`);
    root.style.setProperty('--theme-shadow', getShadowCss(theme.shapes.shadowIntensity));

    // Zoom Variable
    const zoomRatio = theme.zoomLevel / 100;
    root.style.setProperty('--theme-zoom', `${zoomRatio}`);
    
    // Set direct zoom on body/root if supported or via CSS
    if ('zoom' in root.style) {
      (root.style as any).zoom = `${theme.zoomLevel}%`;
    }

    // Set data attribute for dark mode styling
    if (theme.isDark) {
      root.setAttribute('data-theme-mode', 'dark');
      root.classList.add('dark-theme-active');
    } else {
      root.setAttribute('data-theme-mode', 'light');
      root.classList.remove('dark-theme-active');
    }

    // Apply font family directly to body for instant cascading
    document.body.style.fontFamily = `'${theme.typography.fontFamily}', system-ui, -apple-system, sans-serif`;
    document.body.style.fontSize = `${theme.typography.baseFontSize}px`;
    document.body.style.lineHeight = `${theme.typography.lineHeight}`;
  }, [theme]);

  // Update Methods
  const updateColors = (newColors: Partial<ThemeColors>) => {
    setTheme((prev) => ({
      ...prev,
      id: 'CUSTOM',
      colors: { ...prev.colors, ...newColors },
      lastModified: new Date().toISOString(),
    }));
  };

  const updateTypography = (newTypography: Partial<ThemeTypography>) => {
    setTheme((prev) => ({
      ...prev,
      id: 'CUSTOM',
      typography: { ...prev.typography, ...newTypography },
      lastModified: new Date().toISOString(),
    }));
  };

  const updateShapes = (newShapes: Partial<ThemeShapes>) => {
    setTheme((prev) => ({
      ...prev,
      id: 'CUSTOM',
      shapes: { ...prev.shapes, ...newShapes },
      lastModified: new Date().toISOString(),
    }));
  };

  const updateSizing = (newSizing: Partial<ThemeSizing>) => {
    setTheme((prev) => ({
      ...prev,
      id: 'CUSTOM',
      sizing: { ...prev.sizing, ...newSizing },
      lastModified: new Date().toISOString(),
    }));
  };

  const updateFullTheme = (partialTheme: Partial<ThemeSettings>) => {
    setTheme((prev) => ({
      ...prev,
      ...partialTheme,
      id: partialTheme.id || 'CUSTOM',
      lastModified: new Date().toISOString(),
    }));
  };

  const applyPreset = (presetId: PredefinedThemeId) => {
    const preset = THEME_PRESETS[presetId];
    if (preset) {
      setTheme({
        ...preset.theme,
        lastModified: new Date().toISOString(),
      });
    }
  };

  const setZoomLevel = (zoom: number) => {
    const clamped = Math.min(200, Math.max(50, Math.round(zoom)));
    setTheme((prev) => ({
      ...prev,
      zoomLevel: clamped,
      lastModified: new Date().toISOString(),
    }));
  };

  const zoomIn = () => {
    setTheme((prev) => ({
      ...prev,
      zoomLevel: Math.min(200, prev.zoomLevel + 10),
      lastModified: new Date().toISOString(),
    }));
  };

  const zoomOut = () => {
    setTheme((prev) => ({
      ...prev,
      zoomLevel: Math.max(50, prev.zoomLevel - 10),
      lastModified: new Date().toISOString(),
    }));
  };

  const resetZoom = () => {
    setTheme((prev) => ({
      ...prev,
      zoomLevel: 100,
      lastModified: new Date().toISOString(),
    }));
  };

  const resetToDefault = () => {
    applyPreset('DEFAULT');
  };

  const exportThemeJSON = (): string => {
    return JSON.stringify(theme, null, 2);
  };

  const importThemeJSON = (jsonString: string): boolean => {
    try {
      const parsed = JSON.parse(jsonString);
      if (parsed && parsed.colors && parsed.typography && parsed.shapes) {
        setTheme({
          ...THEME_PRESETS.DEFAULT.theme,
          ...parsed,
          id: 'CUSTOM',
          colors: { ...THEME_PRESETS.DEFAULT.theme.colors, ...parsed.colors },
          typography: { ...THEME_PRESETS.DEFAULT.theme.typography, ...parsed.typography },
          shapes: { ...THEME_PRESETS.DEFAULT.theme.shapes, ...parsed.shapes },
          sizing: { ...THEME_PRESETS.DEFAULT.theme.sizing, ...parsed.sizing },
          lastModified: new Date().toISOString(),
        });
        return true;
      }
    } catch (e) {
      console.error('Failed to import theme JSON', e);
    }
    return false;
  };

  const getCSSVariablesString = (): string => {
    return `:root {
  /* MeDo ERP Custom Theme CSS Variables */
  --theme-primary: ${theme.colors.primary};
  --theme-primary-hover: ${theme.colors.primaryHover};
  --theme-secondary: ${theme.colors.secondary};
  --theme-bg: ${theme.colors.background};
  --theme-card-bg: ${theme.colors.cardBackground};
  --theme-text: ${theme.colors.text};
  --theme-text-muted: ${theme.colors.textSecondary};
  --theme-link: ${theme.colors.link};
  --theme-warning: ${theme.colors.warning};
  --theme-error: ${theme.colors.error};
  --theme-success: ${theme.colors.success};
  --theme-sidebar-bg: ${theme.colors.sidebarBackground};
  --theme-header-bg: ${theme.colors.headerBackground};
  --theme-border-color: ${theme.colors.borderColor};

  /* Typography */
  --theme-font-family: '${theme.typography.fontFamily}', system-ui, sans-serif;
  --theme-font-size: ${theme.typography.baseFontSize}px;
  --theme-heading-scale: ${theme.typography.headingScale};
  --theme-line-height: ${theme.typography.lineHeight};

  /* Shapes & Borders */
  --theme-table-radius: ${getRadiusPx(theme.shapes.tableCorners)};
  --theme-button-radius: ${getRadiusPx(theme.shapes.buttonCorners)};
  --theme-card-radius: ${getRadiusPx(theme.shapes.cardCorners)};
  --theme-border-width: ${theme.shapes.borderWidth}px;
  --theme-shadow: ${getShadowCss(theme.shapes.shadowIntensity)};

  /* Zoom Scale */
  --theme-zoom: ${theme.zoomLevel / 100};
}`;
  };

  const availablePresets = Object.values(THEME_PRESETS).filter((p) => p.id !== 'CUSTOM');

  return (
    <ThemeContext.Provider
      value={{
        theme,
        updateColors,
        updateTypography,
        updateShapes,
        updateSizing,
        updateFullTheme,
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
        availableFonts: AVAILABLE_FONTS,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
