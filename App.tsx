
import React, { useState, useEffect } from 'react';
import { Platform, AnalysisResult, Language } from './types';
import { PLATFORMS, TRANSLATIONS } from './constants';
import { analyzeVideo } from './services/geminiService';
import { PlatformCard } from './components/PlatformCard';
import { PricingModal } from './components/PricingModal';
import { AnalysisView } from './components/AnalysisView';

const MAX_FILE_SIZE_MB = 40;
const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;

export default function App() {
  const [lang] = useState<Language>('IT');
  const [platform, setPlatform] = useState<Platform | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState(0);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [lastFile, setLastFile] = useState<File | null>(null);
  const [showPricing, setShowPricing] = useState(false);
  const [credits, setCredits] = useState(10);

  const loadingMessages = [
    "Caricamento Master Engine (Gemini 3 Pro)...",
    "Analisi fotogrammi ad alta densità...",
    "Scansione audio e frequenze di ritenzione...",
    "Analisi psicologica degli hook (3s rule)...",
    "Il Master sta valutando il montaggio...",
    "Sintetizzazione verdetto professionale...",
    "Generazione report strategico spietato...",
    "Fase finale: algoritmi di viralità..."
  ];

  useEffect(() => {
    let interval: any;
    if (loading) {
      interval = setInterval(() => {
        setLoadingStep(prev => (prev + 1) % loadingMessages.length);
      }, 15000); // 15 secondi per messaggio per coprire i 5 minuti
    }
    return () => clearInterval(interval);
  }, [loading]);

  const handleAnalyzeVideo = async (file: File) => {
    if (!platform) return alert("Seleziona prima la piattaforma.");
    if (file.size > MAX_FILE_SIZE_BYTES) return alert("File troppo grande (Max 40MB).");
    if (credits <= 0) return setShowPricing(true);

    setLoading(true);
    setLoadingStep(0);
    setLastFile(file);
    try {
      const res = await analyzeVideo(file, platform, lang);
      setResult(res);
      setCredits(prev => Math.max(0, prev - 1));
    } catch (e: any) {
      console.error(e);
      alert("Timeout o errore di connessione. Se il video è vicino ai 40MB, assicurati di avere una connessione stabile. Riprova.");
    } finally {
      setLoading(false);
    }
  };

  const t = (TRANSLATIONS[lang] || TRANSLATIONS.IT) as any;

  return (
    <div className="min-h-screen p-4 md:p-8 flex flex-col items-center bg-[#000] text-white">
      <nav className="w-full max-w-7xl glass px-8 py-5 rounded-[30px] flex justify-between items-center mb-16 shadow-2xl">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 bg-[#a02a11] rounded-lg flex items-center justify-center font-black">SG</div>
          <span className="font-black text-[10px] uppercase tracking-widest hidden sm:block">Master Strategic Audit v5.0</span>
        </div>
        <div className="flex items-center gap-6">
          <span className="text-[10px] font-black uppercase text-gray-500">{t.credits}: {credits}</span>
          <button onClick={() => setShowPricing(true)} className="bg-white text-black px-5 py-2 rounded-full font-black text-[9px] uppercase tracking-widest hover:bg-[#a02a11] hover:text-white transition-all">UPGRADE</button>
        </div>
      </nav>

      <main className="w-full max-w-5xl flex flex-col items-center">
        {!result && !loading && (
          <div className="w-full text-center space-y-16 animate-fadeIn">
            <div className="space-y-4">
              <h1 className="text-6xl md:text-8xl font-black italic uppercase tracking-tighter text-white">
                VIDEO.<span className="text-[#a02a11]">AUDIT</span>
              </h1>
              <p className="text-gray-500 font-bold text-xs uppercase tracking-widest">Analisi tecnica professionale con 20 anni di esperienza</p>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 w-full max-w-3xl mx-auto">
              {PLATFORMS.map(p => (
                <PlatformCard key={p.id} id={p.id as Platform} label={p.label} icon={p.icon} isSelected={platform === p.id} onClick={() => setPlatform(p.id as Platform)} />
              ))}
            </div>

            <div className={`w-full transition-all ${platform ? 'opacity-100' : 'opacity-20 pointer-events-none'}`}>
              <label className="cursor-pointer block">
                <div className="glass p-20 rounded-[40px] border border-white/10 flex flex-col items-center gap-6 hover:bg-white/5 transition-all">
                  <div className="text-6xl drop-shadow-[0_0_20px_rgba(160,42,17,0.5)]">📤</div>
                  <span className="text-xl font-black uppercase tracking-tighter">Upload per Audit Senior</span>
                  <span className="text-[10px] text-gray-600 font-bold uppercase tracking-widest">Supporto file fino a 40MB</span>
                </div>
                <input type="file" className="hidden" accept="video/*" onChange={e => e.target.files?.[0] && handleAnalyzeVideo(e.target.files[0])} />
              </label>
            </div>
          </div>
        )}

        {loading && (
          <div className="py-24 flex flex-col items-center gap-12 text-center w-full max-w-xl animate-fadeIn">
            <div className="w-32 h-32 border-4 border-[#a02a11]/20 border-t-[#a02a11] rounded-full animate-spin"></div>
            <div className="space-y-6">
              <p className="text-3xl font-black uppercase italic tracking-tighter text-white animate-pulse">{loadingMessages[loadingStep]}</p>
              <div className="w-full bg-white/5 h-1.5 rounded-full overflow-hidden">
                <div className="bg-[#a02a11] h-full animate-[loading_300s_linear_infinite]" style={{width: '100%'}}></div>
              </div>
              <p className="text-[10px] text-gray-500 font-bold uppercase tracking-[0.3em]">Non chiudere la finestra. Qualità senior in corso.</p>
            </div>
          </div>
        )}

        {result && !loading && (
          <AnalysisView result={result} videoFile={lastFile || undefined} language={lang} onReset={() => {setResult(null); setPlatform(null);}} />
        )}
      </main>

      {showPricing && <PricingModal onClose={() => setShowPricing(false)} />}
      <style>{`
        @keyframes loading { 0% { transform: translateX(-100%); } 100% { transform: translateX(0%); } }
      `}</style>
    </div>
  );
}
