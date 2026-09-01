import React, { createContext, useContext, useState, useEffect } from 'react';

export type HighContrastPreset = 'WAREHOUSE_GLARE' | 'LOW_LIGHT' | 'MAX_CONTRAST';

export interface AccessibilitySettings {
  highContrastMode: boolean;
  preset: HighContrastPreset;
  largeWarehouseFont: boolean;
  barcodeScannerOptimized: boolean;
  boldTableBorders: boolean;
}

export interface AccessibilityContextType {
  settings: AccessibilitySettings;
  highContrastMode: boolean;
  setHighContrastMode: (enabled: boolean) => void;
  toggleHighContrastMode: () => void;
  setPreset: (preset: HighContrastPreset) => void;
  setLargeWarehouseFont: (enabled: boolean) => void;
  setBarcodeScannerOptimized: (enabled: boolean) => void;
  setBoldTableBorders: (enabled: boolean) => void;
  resetAccessibilitySettings: () => void;
}

const STORAGE_KEY = 'medo_erp_high_contrast_settings_v1';

const defaultSettings: AccessibilitySettings = {
  highContrastMode: false,
  preset: 'WAREHOUSE_GLARE',
  largeWarehouseFont: false,
  barcodeScannerOptimized: true,
  boldTableBorders: true,
};

const AccessibilityContext = createContext<AccessibilityContextType | undefined>(undefined);

export const AccessibilityProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [settings, setSettings] = useState<AccessibilitySettings>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        return { ...defaultSettings, ...JSON.parse(saved) };
      }
    } catch (e) {
      console.warn('Failed to load accessibility settings from localStorage', e);
    }
    return defaultSettings;
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
    } catch (e) {}

    // Apply class and data attributes to html element
    const root = document.documentElement;
    if (settings.highContrastMode) {
      root.classList.add('high-contrast');
      root.setAttribute('data-contrast-preset', settings.preset);
      root.setAttribute('data-warehouse-font', settings.largeWarehouseFont ? 'true' : 'false');
      root.setAttribute('data-scanner-optimized', settings.barcodeScannerOptimized ? 'true' : 'false');
      root.setAttribute('data-bold-borders', settings.boldTableBorders ? 'true' : 'false');
    } else {
      root.classList.remove('high-contrast');
      root.removeAttribute('data-contrast-preset');
      root.removeAttribute('data-warehouse-font');
      root.removeAttribute('data-scanner-optimized');
      root.removeAttribute('data-bold-borders');
    }
  }, [settings]);

  const setHighContrastMode = (enabled: boolean) => {
    setSettings((prev) => ({ ...prev, highContrastMode: enabled }));
  };

  const toggleHighContrastMode = () => {
    setSettings((prev) => ({ ...prev, highContrastMode: !prev.highContrastMode }));
  };

  const setPreset = (preset: HighContrastPreset) => {
    setSettings((prev) => ({ ...prev, preset }));
  };

  const setLargeWarehouseFont = (enabled: boolean) => {
    setSettings((prev) => ({ ...prev, largeWarehouseFont: enabled }));
  };

  const setBarcodeScannerOptimized = (enabled: boolean) => {
    setSettings((prev) => ({ ...prev, barcodeScannerOptimized: enabled }));
  };

  const setBoldTableBorders = (enabled: boolean) => {
    setSettings((prev) => ({ ...prev, boldTableBorders: enabled }));
  };

  const resetAccessibilitySettings = () => {
    setSettings(defaultSettings);
  };

  return (
    <AccessibilityContext.Provider
      value={{
        settings,
        highContrastMode: settings.highContrastMode,
        setHighContrastMode,
        toggleHighContrastMode,
        setPreset,
        setLargeWarehouseFont,
        setBarcodeScannerOptimized,
        setBoldTableBorders,
        resetAccessibilitySettings,
      }}
    >
      {children}
    </AccessibilityContext.Provider>
  );
};

export const useAccessibility = (): AccessibilityContextType => {
  const context = useContext(AccessibilityContext);
  if (!context) {
    throw new Error('useAccessibility must be used within an AccessibilityProvider');
  }
  return context;
};
