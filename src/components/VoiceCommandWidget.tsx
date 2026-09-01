import React, { useState, useRef } from 'react';
import { 
  Mic, 
  MicOff, 
  Sparkles, 
  Navigation, 
  X, 
  Send, 
  Zap, 
  Volume2, 
  CheckCircle2, 
  AlertCircle,
  Radio
} from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';

interface VoiceCommandWidgetProps {
  onSelectModule: (module: string) => void;
  onOpenAiAssistant?: () => void;
}

export const VoiceCommandWidget: React.FC<VoiceCommandWidgetProps> = ({
  onSelectModule,
  onOpenAiAssistant
}) => {
  const { language, t } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [responseMessage, setResponseMessage] = useState<string | null>(null);
  const [executionResult, setExecutionResult] = useState<any>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  // Toggle Voice Widget
  const handleToggleWidget = () => {
    setIsOpen(!isOpen);
    setResponseMessage(null);
    setExecutionResult(null);
    setTranscript('');
  };

  // Start Voice Recording via Web Audio API / MediaRecorder
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorderRef.current = new MediaRecorder(stream);
      audioChunksRef.current = [];

      mediaRecorderRef.current.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorderRef.current.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        await processAudioCommand(audioBlob);
        // Stop audio tracks
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorderRef.current.start();
      setIsRecording(true);
      setResponseMessage('جارِ الاستماع إلى أمرك الصوتي... تكلّم الآن');
    } catch (err) {
      console.error('Error accessing microphone:', err);
      setResponseMessage('تعذر الوصول إلى المايكروفون. يرجى التأكد من السماح بالصوت في المتصفح.');
    }
  };

  // Stop Recording
  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      setIsProcessing(true);
    }
  };

  // Convert audio blob to base64 and send to /api/ai/transcribe & /api/ai/voice-command
  const processAudioCommand = async (audioBlob: Blob) => {
    try {
      const reader = new FileReader();
      reader.readAsDataURL(audioBlob);
      reader.onloadend = async () => {
        const base64Audio = (reader.result as string).split(',')[1];
        
        // 1. Transcribe Audio
        const transcribeRes = await fetch('/api/ai/transcribe', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            audioBase64: base64Audio,
            mimeType: 'audio/webm'
          })
        });
        const transcribeData = await transcribeRes.json();
        const text = transcribeData.transcript || '';
        setTranscript(text);

        if (text) {
          // 2. Parse & Execute Command
          await executeTextCommand(text);
        } else {
          setResponseMessage('لم نتمكن من التقاط صوّتك بدقة. أعد المحاولة أو اكتب الأمر نصياً.');
          setIsProcessing(false);
        }
      };
    } catch (err) {
      console.error('Audio processing error:', err);
      setResponseMessage('حدث خطأ أثناء معالجة التسجيل الصوتي.');
      setIsProcessing(false);
    }
  };

  // Execute Text Command
  const executeTextCommand = async (commandText: string) => {
    setIsProcessing(true);
    try {
      const res = await fetch('/api/ai/voice-command', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ commandText })
      });
      const data = await res.json();
      setExecutionResult(data);
      setResponseMessage(data.message || 'تم تحليل الأمر الصوتي بنجاح.');

      // Perform Auto-Navigation if action is NAVIGATE
      if (data.action === 'NAVIGATE' && data.targetModule) {
        setTimeout(() => {
          onSelectModule(data.targetModule);
          setIsOpen(false);
        }, 1200);
      }
    } catch (err) {
      console.error('Command execution error:', err);
      setResponseMessage('تعذر تحليل الأمر النصي.');
    } finally {
      setIsProcessing(false);
    }
  };

  const sampleVoiceCommands = [
    'افتح شاشة الكاشير ونقاط البيع',
    'انقلني إلى الموارد البشرية والرواتب',
    'افتح موديول إدارة المشتريات',
    'افتح الفاتورة الإلكترونية وقارئ الباركود',
    'انتقل إلى الأستاذ العام وقيود اليومية',
    'عرض التقارير والقوائم المالية'
  ];

  return (
    <div className="fixed bottom-6 left-6 z-50 font-sans" dir={language === 'ar' ? 'rtl' : 'ltr'}>
      
      {/* Floating Trigger Button */}
      {!isOpen && (
        <button
          onClick={handleToggleWidget}
          className="relative group bg-gradient-to-r from-amber-500 via-indigo-600 to-purple-600 hover:from-amber-600 hover:to-purple-700 text-white p-3.5 rounded-full shadow-2xl transition-all duration-300 hover:scale-110 flex items-center gap-2 border-2 border-amber-300/80 cursor-pointer"
          title="المساعد الصوتي الذكي - للأوامر السريعة بالصوت (Voice Assistant)"
        >
          <div className="relative">
            <Mic className="w-6 h-6 animate-pulse" />
            <span className="absolute -top-1 -right-1 w-3 h-3 bg-emerald-400 rounded-full border-2 border-indigo-900 animate-ping"></span>
          </div>
          <span className="hidden sm:inline font-extrabold text-xs ml-1 tracking-wide">
            المساعد الصوتي AI
          </span>
          <Sparkles className="w-4 h-4 text-amber-300 animate-spin" />
        </button>
      )}

      {/* Expanded Voice Command Modal / Card */}
      {isOpen && (
        <div className="bg-slate-900 border-2 border-indigo-500/80 text-white rounded-3xl p-5 shadow-2xl w-80 sm:w-96 flex flex-col gap-4 animate-in fade-in zoom-in duration-200">
          
          {/* Header */}
          <div className="flex items-center justify-between border-b border-indigo-900/80 pb-3">
            <div className="flex items-center gap-2.5">
              <div className="p-2 bg-indigo-900/60 border border-indigo-500/40 rounded-xl text-indigo-300">
                <Sparkles className="w-5 h-5 text-amber-400" />
              </div>
              <div>
                <h4 className="font-extrabold text-sm flex items-center gap-1.5">
                  <span>الأوامر الصوتية الذكية (Voice ERP)</span>
                  <span className="text-[9px] bg-amber-400 text-slate-950 px-1.5 py-0.2 rounded font-extrabold">
                    Gemini Live
                  </span>
                </h4>
                <p className="text-[11px] text-indigo-200/70">
                  تحدّث للتحكم السريع بالتنفيذ والتنقل في النظام
                </p>
              </div>
            </div>

            <button
              onClick={handleToggleWidget}
              className="p-1.5 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Recording / Processing Status Display */}
          <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 text-center space-y-3">
            {isRecording ? (
              <div className="space-y-2">
                <div className="relative inline-flex items-center justify-center">
                  <span className="w-16 h-16 bg-rose-500/20 rounded-full animate-ping absolute"></span>
                  <button
                    onClick={stopRecording}
                    className="w-16 h-16 bg-rose-600 hover:bg-rose-700 text-white rounded-full flex items-center justify-center shadow-lg relative z-10 transition animate-bounce cursor-pointer"
                  >
                    <Mic className="w-8 h-8" />
                  </button>
                </div>
                <p className="text-xs font-bold text-rose-400 animate-pulse flex items-center justify-center gap-1">
                  <Radio className="w-4 h-4 animate-spin" />
                  <span>جارِ الاستماع... انقر فوق المايك للإيقاف والمعالجة</span>
                </p>
              </div>
            ) : isProcessing ? (
              <div className="space-y-2 py-2">
                <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
                <p className="text-xs font-bold text-indigo-300">
                  جاري تحليل التسجيل الصوتي وتفريغه بالذكاء الاصطناعي...
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                <button
                  onClick={startRecording}
                  className="w-16 h-16 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white rounded-full flex items-center justify-center shadow-xl mx-auto transition-transform hover:scale-105 cursor-pointer border border-indigo-400/40"
                >
                  <Mic className="w-8 h-8 text-amber-300" />
                </button>
                <p className="text-xs font-bold text-slate-300">
                  انقر المايك للتحدث بأمر صوتي مباشر
                </p>
              </div>
            )}

            {/* Transcript & Response Area */}
            {transcript && (
              <div className="p-2.5 bg-slate-900 rounded-xl border border-slate-800 text-xs text-amber-300 font-mono text-right">
                <span className="text-slate-400 text-[10px] block font-sans">النص المنطوق:</span>
                "{transcript}"
              </div>
            )}

            {responseMessage && (
              <div className="p-2.5 bg-indigo-950/60 border border-indigo-800/80 rounded-xl text-xs text-indigo-100 text-right font-bold leading-relaxed flex items-start gap-2">
                <Zap className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <span>{responseMessage}</span>
              </div>
            )}
          </div>

          {/* Quick Manual Text Input Command */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (transcript.trim()) {
                executeTextCommand(transcript);
              }
            }}
            className="flex items-center gap-2"
          >
            <input
              type="text"
              value={transcript}
              onChange={(e) => setTranscript(e.target.value)}
              placeholder="أو اكتب الأمر نصياً (مثلاً: افتح الكاشير)..."
              className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-indigo-500"
            />
            <button
              type="submit"
              disabled={!transcript.trim() || isProcessing}
              className="p-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-xl transition"
            >
              <Send className="w-4 h-4 rotate-180" />
            </button>
          </form>

          {/* Sample Voice Commands Shortcuts */}
          <div className="space-y-1.5 border-t border-slate-800 pt-3">
            <span className="text-[10px] text-slate-400 font-bold block">
              💡 أمثلة لأوامر صوتية يمكنك تجربتها:
            </span>
            <div className="flex flex-wrap gap-1.5">
              {sampleVoiceCommands.map((cmd, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    setTranscript(cmd);
                    executeTextCommand(cmd);
                  }}
                  className="text-[10px] bg-slate-800 hover:bg-indigo-900/60 text-slate-300 hover:text-amber-300 px-2.5 py-1 rounded-lg border border-slate-700 transition"
                >
                  {cmd}
                </button>
              ))}
            </div>
          </div>

        </div>
      )}

    </div>
  );
};
