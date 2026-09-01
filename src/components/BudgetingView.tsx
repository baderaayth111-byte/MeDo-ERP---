import React, { useState, useMemo } from 'react';
import { 
  Scale, 
  BarChart3, 
  Settings, 
  Bell, 
  FileSpreadsheet, 
  SlidersHorizontal, 
  Layers, 
  Sparkles, 
  Building2, 
  Calendar,
  DollarSign,
  PieChart,
  ShieldCheck,
  RotateCcw
} from 'lucide-react';
import { 
  BudgetScenario, 
  BudgetAlertConfig, 
  BudgetItem, 
  BudgetAuditLog, 
  BudgetAlertItem 
} from '../types/budgeting';
import { Account, JournalEntry, Currency, CompanyProfile } from '../types/accounting';
import { BudgetSetupTab } from './BudgetSetupTab';
import { BudgetVarianceTab } from './BudgetVarianceTab';
import { BudgetAlertsTab } from './BudgetAlertsTab';
import { 
  getLoadedBudgetScenarios, 
  saveBudgetScenarios, 
  getLoadedBudgetAlertConfig, 
  saveBudgetAlertConfig, 
  computeBudgetVariances,
  generateDefaultBudgetItems
} from '../data/budgetingData';
import { useAuth } from '../contexts/AuthContext';

interface BudgetingViewProps {
  accounts: Account[];
  journalEntries: JournalEntry[];
  companyProfile: CompanyProfile;
  currency: Currency;
  rates: Record<Currency, number>;
  onNavigateToGeneralLedger?: () => void;
  onDispatchNotification?: (title: string, message: string, type: 'WARNING' | 'ALERT' | 'INFO') => void;
}

export const BudgetingView: React.FC<BudgetingViewProps> = ({
  accounts,
  journalEntries,
  companyProfile,
  currency,
  rates,
  onNavigateToGeneralLedger,
  onDispatchNotification,
}) => {
  const { user, profile } = useAuth();
  const [activeTab, setActiveTab] = useState<'SETUP' | 'VARIANCE' | 'ALERTS'>('VARIANCE');

  // Scenarios State
  const [scenarios, setScenarios] = useState<BudgetScenario[]>(() => getLoadedBudgetScenarios());
  const [activeScenarioId, setActiveScenarioId] = useState<string>(() => {
    const loaded = getLoadedBudgetScenarios();
    const active = loaded.find(s => s.status === 'ACTIVE') || loaded[0];
    return active ? active.id : 'BUD-SCEN-2026-01';
  });

  // Alert Config State
  const [alertConfig, setAlertConfig] = useState<BudgetAlertConfig>(() => getLoadedBudgetAlertConfig());

  // Active Scenario Object
  const activeScenario = useMemo(() => {
    return scenarios.find(s => s.id === activeScenarioId) || scenarios[0];
  }, [scenarios, activeScenarioId]);

  // Compute Active Variances for Alerts Tab and Top Badges
  const activeVariances = useMemo(() => {
    if (!activeScenario) return [];
    return computeBudgetVariances(
      activeScenario,
      accounts,
      journalEntries,
      'FULL_YEAR',
      'ALL',
      alertConfig
    );
  }, [activeScenario, accounts, journalEntries, alertConfig]);

  // Count active warnings
  const warningCount = useMemo(() => {
    return activeVariances.filter(v => v.isWarning).length;
  }, [activeVariances]);

  // Handle Save Scenario
  const handleSaveScenario = (updatedScenario: BudgetScenario, logDesc: string) => {
    const newAuditLog: BudgetAuditLog = {
      id: `aud-${Date.now()}`,
      timestamp: new Date().toISOString(),
      user: profile?.fullName || user?.email || 'مدير النظام',
      userRole: profile?.role || 'ADMIN',
      action: 'UPDATE',
      description: logDesc,
      affectedAccountsCount: updatedScenario.items.length,
    };

    const scenarioWithAudit: BudgetScenario = {
      ...updatedScenario,
      auditHistory: [newAuditLog, ...(updatedScenario.auditHistory || [])],
      updatedAt: new Date().toISOString(),
    };

    const updatedList = scenarios.map(s => s.id === scenarioWithAudit.id ? scenarioWithAudit : s);
    setScenarios(updatedList);
    saveBudgetScenarios(updatedList);

    if (onDispatchNotification) {
      onDispatchNotification(
        'تم حفظ الموازنة التقديرية',
        `تم تحديث بنود ${scenarioWithAudit.nameAr} بنجاح وسجل التدقيق موثق.`,
        'INFO'
      );
    }
  };

  // Handle Approve Scenario
  const handleApproveScenario = (scenarioId: string) => {
    const updatedList = scenarios.map(s => {
      if (s.id === scenarioId) {
        const approveLog: BudgetAuditLog = {
          id: `aud-${Date.now()}`,
          timestamp: new Date().toISOString(),
          user: profile?.fullName || user?.email || 'المدير المالي',
          userRole: profile?.role || 'ADMIN',
          action: 'APPROVE',
          description: 'اعتماد الموازنة التقديرية رسمياً وتفعيلها في النظام',
        };
        return {
          ...s,
          status: 'ACTIVE' as const,
          approvedBy: profile?.fullName || 'المدير المالي',
          approvedAt: new Date().toISOString(),
          auditHistory: [approveLog, ...(s.auditHistory || [])],
          updatedAt: new Date().toISOString(),
        };
      }
      return s;
    });

    setScenarios(updatedList);
    saveBudgetScenarios(updatedList);

    if (onDispatchNotification) {
      onDispatchNotification(
        'اعتماد الموازنة التقديرية',
        `تم اعتماد الموازنة التقديرية وتفعيل حدود الرقابة المالية بنجاح.`,
        'INFO'
      );
    }
  };

  // Handle Create New Scenario
  const handleCreateNewScenario = (
    fiscalYear: number, 
    nameAr: string, 
    baseOnScenarioId?: string, 
    growthMultiplier: number = 1.0
  ) => {
    let items: BudgetItem[] = [];
    if (baseOnScenarioId) {
      const base = scenarios.find(s => s.id === baseOnScenarioId);
      if (base) {
        items = base.items.map(item => {
          const annual = Math.round(item.annualBudget * growthMultiplier);
          const q1 = Math.round(annual * 0.25);
          const q2 = Math.round(annual * 0.25);
          const q3 = Math.round(annual * 0.25);
          const q4 = annual - (q1 + q2 + q3);
          return {
            ...item,
            id: `bud-item-${item.accountCode}-${fiscalYear}`,
            annualBudget: annual,
            quarterly: { q1, q2, q3, q4 },
            updatedAt: new Date().toISOString(),
            updatedBy: profile?.fullName || 'مدير النظام',
          };
        });
      }
    }

    if (items.length === 0) {
      items = generateDefaultBudgetItems(accounts, growthMultiplier);
    }

    const totalRev = items.filter(i => i.accountType === 'REVENUE').reduce((sum, i) => sum + i.annualBudget, 0);
    const totalExp = items.filter(i => i.accountType === 'EXPENSE').reduce((sum, i) => sum + i.annualBudget, 0);

    const newScen: BudgetScenario = {
      id: `BUD-SCEN-${fiscalYear}-${Date.now()}`,
      fiscalYear,
      code: `BUD-${fiscalYear}-V1`,
      nameAr,
      nameEn: `Budget Plan ${fiscalYear}`,
      version: 1,
      status: 'DRAFT',
      baseCurrency: 'YER',
      totalRevenueBudget: totalRev,
      totalExpenseBudget: totalExp,
      netBudgetedProfit: totalRev - totalExp,
      totalCapexBudget: 50000000,
      items,
      auditHistory: [{
        id: `aud-${Date.now()}`,
        timestamp: new Date().toISOString(),
        user: profile?.fullName || user?.email || 'مدير النظام',
        userRole: profile?.role || 'ADMIN',
        action: 'CREATE',
        description: `إنشاء موازنة جديدة لسنة ${fiscalYear}`,
        affectedAccountsCount: items.length,
      }],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const updatedList = [...scenarios, newScen];
    setScenarios(updatedList);
    setActiveScenarioId(newScen.id);
    saveBudgetScenarios(updatedList);
  };

  // Handle Save Alert Config
  const handleSaveAlertConfig = (newConfig: BudgetAlertConfig) => {
    setAlertConfig(newConfig);
    saveBudgetAlertConfig(newConfig);
  };

  return (
    <div className="space-y-5 animate-fade-in">
      {/* Top Banner & Title */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-6 rounded-3xl border border-indigo-900/60 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20"></div>
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-amber-500/10 rounded-full blur-2xl pointer-events-none -ml-20 -mb-20"></div>

        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-amber-400 text-xs font-mono mb-1">
              <Scale className="w-4 h-4" />
              <span>نظام التخطيط والرقابة المالية • SAP FMBB / S_ALR_87013611</span>
            </div>
            <h1 className="text-xl md:text-2xl font-black text-white tracking-tight">
              نظام الموازنات التقديرية والفعلية (Budgeting & Variance Analysis)
            </h1>
            <p className="text-xs text-slate-300 mt-1 max-w-2xl leading-relaxed">
              التخطيط الاستراتيجي المالي للسنة المالية، الربط الآلي الفوري مع الحركات الفعلية، وتحليل الفروقات الرقابية (Actual vs. Budget) مع التنبيهات الذكية.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <div className="bg-slate-800/80 border border-slate-700/80 px-3.5 py-2 rounded-2xl text-left font-mono text-xs">
              <span className="text-slate-400 text-[10px] block">السنة المالية النشطة</span>
              <span className="font-black text-amber-400 text-sm">{activeScenario.fiscalYear}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Tabs Navigation */}
      <div className="flex items-center gap-2 border-b border-slate-200 overflow-x-auto pb-1">
        <button
          onClick={() => setActiveTab('VARIANCE')}
          className={`px-4 py-2.5 rounded-xl font-bold text-xs shrink-0 transition flex items-center gap-2 cursor-pointer ${
            activeTab === 'VARIANCE'
              ? 'bg-indigo-900 text-white shadow-md font-black ring-2 ring-indigo-500/20'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <BarChart3 className="w-4 h-4 text-indigo-400" />
          <span>تحليل الأداء (Actual vs. Budget)</span>
          <span className="bg-indigo-500/30 text-indigo-200 text-[10px] px-1.5 py-0.2 rounded-full font-bold">
            مقارنة حية
          </span>
        </button>

        <button
          onClick={() => setActiveTab('SETUP')}
          className={`px-4 py-2.5 rounded-xl font-bold text-xs shrink-0 transition flex items-center gap-2 cursor-pointer ${
            activeTab === 'SETUP'
              ? 'bg-indigo-900 text-white shadow-md font-black ring-2 ring-indigo-500/20'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <Layers className="w-4 h-4 text-amber-400" />
          <span>إعداد الموازنة التقديرية (Budget Setup)</span>
          <span className="bg-slate-200 text-slate-700 text-[10px] px-1.5 py-0.2 rounded-full font-mono font-bold">
            SAP Grid
          </span>
        </button>

        <button
          onClick={() => setActiveTab('ALERTS')}
          className={`px-4 py-2.5 rounded-xl font-bold text-xs shrink-0 transition flex items-center gap-2 cursor-pointer ${
            activeTab === 'ALERTS'
              ? 'bg-indigo-900 text-white shadow-md font-black ring-2 ring-indigo-500/20'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <Bell className="w-4 h-4 text-rose-400" />
          <span>التنبيهات الذكية وإعدادات الرقابة (Budget Alerts)</span>
          {warningCount > 0 && (
            <span className="bg-rose-500 text-white text-[10px] px-1.5 py-0.2 rounded-full font-bold animate-pulse">
              {warningCount}
            </span>
          )}
        </button>
      </div>

      {/* TAB 1: VARIANCE ANALYSIS */}
      {activeTab === 'VARIANCE' && (
        <BudgetVarianceTab
          scenarios={scenarios}
          activeScenario={activeScenario}
          onSelectScenario={setActiveScenarioId}
          accounts={accounts}
          journalEntries={journalEntries}
          companyProfile={companyProfile}
          currency={currency}
          rates={rates}
          alertConfig={alertConfig}
          onNavigateToGeneralLedger={onNavigateToGeneralLedger}
        />
      )}

      {/* TAB 2: BUDGET SETUP (SAP GRID) */}
      {activeTab === 'SETUP' && (
        <BudgetSetupTab
          scenarios={scenarios}
          activeScenario={activeScenario}
          onSelectScenario={setActiveScenarioId}
          onSaveScenario={handleSaveScenario}
          onApproveScenario={handleApproveScenario}
          onCreateNewScenario={handleCreateNewScenario}
          accounts={accounts}
          currency={currency}
          rates={rates}
        />
      )}

      {/* TAB 3: SMART ALERTS & CONTROLS */}
      {activeTab === 'ALERTS' && (
        <BudgetAlertsTab
          alertConfig={alertConfig}
          onSaveAlertConfig={handleSaveAlertConfig}
          variances={activeVariances}
          activeScenario={activeScenario}
          currency={currency}
          rates={rates}
        />
      )}
    </div>
  );
};
