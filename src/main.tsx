import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { AuthProvider } from './contexts/AuthContext.tsx';
import { TransactionLimitProvider } from './contexts/TransactionLimitContext.tsx';
import { LanguageProvider } from './contexts/LanguageContext.tsx';
import { AccessibilityProvider } from './contexts/AccessibilityContext.tsx';
import { ThemeProvider } from './contexts/ThemeContext.tsx';
import { OfflineProvider } from './contexts/OfflineContext.tsx';
import { registerServiceWorker } from './serviceWorkerRegistration.ts';

// Register Service Worker for 100% Offline PWA functionality
registerServiceWorker();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AuthProvider>
      <TransactionLimitProvider>
        <LanguageProvider>
          <AccessibilityProvider>
            <ThemeProvider>
              <OfflineProvider>
                <App />
              </OfflineProvider>
            </ThemeProvider>
          </AccessibilityProvider>
        </LanguageProvider>
      </TransactionLimitProvider>
    </AuthProvider>
  </StrictMode>,
);

