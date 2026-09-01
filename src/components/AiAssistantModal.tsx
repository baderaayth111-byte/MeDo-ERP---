import React, { useState } from 'react';
import { 
  Sparkles, 
  Send, 
  Bot, 
  User, 
  ShieldCheck, 
  X, 
  Lightbulb 
} from 'lucide-react';
import { Account, JournalEntry, Currency, CompanyProfile } from '../types/accounting';

interface AiAssistantModalProps {
  isOpen: boolean;
  onClose: () => void;
  accounts: Account[];
  journalEntries: JournalEntry[];
  companyProfile: CompanyProfile;
  currency: Currency;
}

interface Message {
  id: string;
  sender: 'ai' | 'user';
  text: string;
  timestamp: string;
}

export const AiAssistantModal: React.FC<AiAssistantModalProps> = ({
  isOpen,
  onClose,
  accounts,
  journalEntries,
  companyProfile,
  currency,
}) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      sender: 'ai',
      text: `أهلاً بك! أنا مستشارك المالي والمحاسبي الذكي المدعوم بالذكاء الاصطناعي لنظام SAP S/4HANA ERP.\n\nيمكنني مساعدتك في:\n1. تحليل القوائم المالية واكتشاف الانحرافات.\n2. الاستشارات المحاسبية وفق المعايير الدولية IFRS وقوانين الضرائب والزكاة في اليمن.\n3. صياغة وتوجيه قيود اليومية المعقدة.\n\nكيف يمكنني خدمتك اليوم؟`,
      timestamp: new Date().toLocaleTimeString('ar-YE', { hour: '2-digit', minute: '2-digit' }),
    },
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isAuditing, setIsAuditing] = useState(false);
  const [auditResult, setAuditResult] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSendMessage = async (customPrompt?: string) => {
    const textToSend = customPrompt || inputMessage;
    if (!textToSend.trim() || isLoading) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      sender: 'user',
      text: textToSend,
      timestamp: new Date().toLocaleTimeString('ar-YE', { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputMessage('');
    setIsLoading(true);

    try {
      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: textToSend }),
      });
      const data = await res.json();

      const aiReply: Message = {
        id: (Date.now() + 1).toString(),
        sender: 'ai',
        text: data.reply || 'عذراً، حدث خطأ أثناء معالجة الطلب.',
        timestamp: new Date().toLocaleTimeString('ar-YE', { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, aiReply]);
    } catch (err) {
      console.error(err);
      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          sender: 'ai',
          text: 'عذراً، حدث خطأ في الاتصال بالخادم الذكي.',
          timestamp: new Date().toLocaleTimeString('ar-YE', { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRunAudit = async () => {
    setIsAuditing(true);
    setAuditResult(null);

    const totalAssets = accounts.filter(a => a.type === 'ASSET').reduce((s, a) => s + a.balance, 0);
    const totalLiabilities = accounts.filter(a => a.type === 'LIABILITY').reduce((s, a) => s + a.balance, 0);
    const totalRevenues = accounts.filter(a => a.type === 'REVENUE').reduce((s, a) => s + Math.abs(a.balance), 0);
    const totalExpenses = accounts.filter(a => a.type === 'EXPENSE').reduce((s, a) => s + Math.abs(a.balance), 0);

    try {
      const res = await fetch('/api/ai/audit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          financialData: {
            totalAssets,
            totalLiabilities,
            totalRevenues,
            totalExpenses,
            netIncome: totalRevenues - totalExpenses,
            journalEntriesCount: journalEntries.length,
            company: companyProfile.nameAr,
          },
        }),
      });
      const data = await res.json();
      if (data.auditReport) {
        setAuditResult(data.auditReport);
      } else if (data.auditSummary) {
        const fullReport = `📊 **ملخص الفحص:** ${data.auditSummary}\n\n🔍 **الملاحظات الرقابية:**\n${(data.anomalies || []).map((a: string, i: number) => `${i + 1}. ${a}`).join('\n')}\n\n💡 **التوصيات:**\n${(data.recommendations || []).map((r: string) => `• ${r}`).join('\n')}`;
        setAuditResult(fullReport);
      } else {
        setAuditResult('اكتمل التدقيق المالي بنجاح.');
      }
    } catch (err) {
      console.error(err);
      setAuditResult('تعذر إكمال التدقيق الآلي حالياً.');
    } finally {
      setIsAuditing(false);
    }
  };

  const quickPrompts = [
    'كيف أسجل قيد معالجة فروق أسعار صرف العملات الأجنبية في اليمن؟',
    'ما هي النسبة القانونية لضريبة الأرباح التجارية وضريبة المبيعات في اليمن؟',
    'كيف يتم احتساب قسط إهلاك الأصول الثابتة وفق طريقة القسط الثابت؟',
    'ما هي شروط توازن ميزان المراجعة والمعادلة المحاسبية الأساسية؟',
  ];

  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-3 sm:p-6 backdrop-blur-xs">
      <div className="bg-white border border-slate-300 rounded-2xl max-w-4xl w-full h-[85vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 bg-slate-50 border-b border-slate-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-50 border border-purple-200 flex items-center justify-center text-purple-700 shadow-xs">
              <Sparkles className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-bold text-slate-800 flex items-center gap-2">
                <span>المستشار المالي الذكي (SAP AI Financial Copilot)</span>
                <span className="text-[10px] bg-purple-50 text-purple-700 border border-purple-200 px-2 py-0.5 rounded-full font-mono font-bold">
                  Gemini 2.5 Pro
                </span>
              </h3>
              <p className="text-xs text-slate-500">
                مساعد الذكاء الاصطناعي المحاسبي والتدقيق المالي الفوري وفق المعايير المحاسبية والبيئة اليمنية
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleRunAudit}
              disabled={isAuditing}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white text-xs font-bold shadow-xs transition"
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>{isAuditing ? 'جارِ التدقيق...' : 'تدقيق مالي شامل'}</span>
            </button>

            <button
              onClick={onClose}
              className="w-8 h-8 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-700 flex items-center justify-center transition"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Audit Report Banner if generated */}
        {auditResult && (
          <div className="p-4 bg-purple-50 border-b border-purple-200 text-xs text-purple-900 max-h-48 overflow-y-auto">
            <div className="flex items-center justify-between font-bold text-purple-800 mb-2">
              <span className="flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-purple-600" />
                تقرير التدقيق والفحص المالي الذكي الفوري:
              </span>
              <button
                onClick={() => setAuditResult(null)}
                className="text-slate-500 hover:text-slate-800 text-xs font-semibold"
              >
                إخفاء التقرير ✕
              </button>
            </div>
            <div className="whitespace-pre-line leading-relaxed">{auditResult}</div>
          </div>
        )}

        {/* Chat History Area */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50/50">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex gap-3 ${msg.sender === 'user' ? 'flex-row-reverse' : 'flex-row'}`}
            >
              <div
                className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 text-xs font-bold shadow-xs ${
                  msg.sender === 'user'
                    ? 'bg-blue-600 text-white'
                    : 'bg-purple-50 border border-purple-200 text-purple-700'
                }`}
              >
                {msg.sender === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4 text-purple-600" />}
              </div>

              <div
                className={`max-w-[80%] rounded-2xl p-3.5 text-xs leading-relaxed shadow-xs ${
                  msg.sender === 'user'
                    ? 'bg-blue-600 text-white rounded-tr-none'
                    : 'bg-white text-slate-800 border border-slate-200 rounded-tl-none whitespace-pre-line'
                }`}
              >
                <div>{msg.text}</div>
                <div className={`text-[10px] mt-1.5 ${msg.sender === 'user' ? 'text-blue-100' : 'text-slate-400'}`}>
                  {msg.timestamp}
                </div>
              </div>
            </div>
          ))}

          {isLoading && (
            <div className="flex gap-3">
              <div className="w-8 h-8 rounded-xl bg-purple-50 border border-purple-200 flex items-center justify-center text-purple-700 shrink-0">
                <Bot className="w-4 h-4 text-purple-600" />
              </div>
              <div className="bg-white border border-slate-200 rounded-2xl p-3.5 text-xs text-slate-500 flex items-center gap-2 shadow-xs">
                <span className="w-2 h-2 rounded-full bg-purple-600 animate-pulse"></span>
                <span>المستشار الذكي يقوم بتحليل البيانات وإعداد الإجابة...</span>
              </div>
            </div>
          )}
        </div>

        {/* Quick prompt suggestions */}
        <div className="p-2 bg-white border-t border-slate-200 flex items-center gap-1.5 overflow-x-auto">
          <Lightbulb className="w-3.5 h-3.5 text-amber-500 shrink-0 mr-1" />
          {quickPrompts.map((qp, idx) => (
            <button
              key={idx}
              onClick={() => handleSendMessage(qp)}
              className="text-xs bg-slate-50 hover:bg-slate-100 text-slate-700 px-2.5 py-1 rounded-lg border border-slate-200 whitespace-nowrap transition font-medium"
            >
              {qp}
            </button>
          ))}
        </div>

        {/* Input Bar */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSendMessage();
          }}
          className="p-3 bg-white border-t border-slate-200 flex items-center gap-2"
        >
          <input
            type="text"
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            placeholder="اسأل المستشار المالي أي استفسار محاسبي أو قانوني أو اطلب تحليل بيانات الشركة..."
            className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs sm:text-sm text-slate-800 placeholder:text-slate-400 focus:ring-2 focus:ring-purple-500 focus:bg-white focus:outline-none"
          />
          <button
            type="submit"
            disabled={!inputMessage.trim() || isLoading}
            className="w-10 h-10 rounded-xl bg-purple-600 hover:bg-purple-700 disabled:opacity-40 text-white flex items-center justify-center shadow-xs transition shrink-0"
          >
            <Send className="w-4 h-4 rotate-180" />
          </button>
        </form>
      </div>
    </div>
  );
};
