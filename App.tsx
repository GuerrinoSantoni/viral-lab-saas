
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
  const [credits, setCredits] = useState(5);

  const loadingMessages = [
    "Stabilizzazione connessione con Gemini 3 Pro...",
    "Caricamento stream video (40MB Audit Mode)...",
    "Analisi fotogramma per fotogramma (Deep Scanning)...",
    "Estrazione pattern audio e frequenze gancio...",
    "Analisi ritenzione e curva dell'attenzione...",
    "Il Senior Strategist sta scrivendo il report...",
    "Elaborazione della caption magnetica...",
    "Sintetizzazione insight per la viralità...",
    "Finalizzazione del verdetto professionale...",
    "Ci siamo quasi, la qualità richiede tempo..."
  ];

  useEffect(() => {
    let interval: any;
    if (loading) {
      interval = setInterval(() => {
        setLoadingStep(prev => (prev + 1) % loadingMessages.length);
      }, 10000); // Messaggi più lenti per giustificare l'attesa di 5 minuti
    }
    return () => clearInterval(interval);
  }, [loading]);

  const handleAnalyzeVideo = async (file: File) => {
    if (!platform) return alert("Seleziona prima la piattaforma di destinazione.");
    if (file.size > MAX_FILE_SIZE_BYTES) return alert(`Il file eccede il limite di ${MAX_FILE_SIZE_MB}MB.`);
    if (credits <= 0) return setShowPricing(true);

    setLoading(true);
    setLoadingStep(0);
    setLastFile(file);
    try {
      const res = await analyzeVideo(file, platform, lang);
      setResult(res);
      setCredits(prev => Math.max(0, prev - 1));
    } catch (e: any) {
      console.error("Critical Error during Video Audit:", e);
      alert("Il server ha interrotto l'analisi. Questo accade solitamente per timeout di rete o file troppo complessi per questa sessione. Riprova tra un istante.");
    } finally {
      setLoading(false);
    }
  };

  const t = (TRANSLATIONS[lang] || TRANSLATIONS.IT) as any;

  return (
    <div className="min-h-screen p-4 md:p-8 flex flex-col items-center bg-[#000] selection:bg-[#a02a11] selection:text-white">
      <nav className="w-full max-w-7xl glass px-8 py-5 rounded-[30px] flex justify-between items-center mb-16 premium-border shadow-2xl">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-[#a02a11] rounded-xl flex items-center justify-center font-black text-xl shadow-[0_0_20px_rgba(160,42,17,0.5)]">SG</div>
          <div className="hidden sm:block">
            <span className="font-black text-xs uppercase tracking-widest text-white">Master Strategic Audit</span>
            <p className="text-[8px] text-[#1087a0] font-black uppercase tracking-[0.4em]">PRO ENGINE V5.0</p>
          </div>
        </div>
        <div className="flex items-center gap-8">
          <div className="text-[10px] font-black uppercase tracking-widest text-white">
            {t.credits}: <span className="text-[#a02a11]">{credits}</span>
          </div>
          <button onClick={() => setShowPricing(true)} className="bg-white text-black px-6 py-2 rounded-full font-black text-[9px] uppercase tracking-widest hover:bg-[#a02a11] hover:text-white transition-all">
            {t.upgrade}
          </button>
        </div>
      </nav>

      <main className="w-full max-w-5xl flex flex-col items-center">
        {!result && !loading && (
          <div className="w-full text-center space-y-16 animate-fadeIn">
            <div className="space-y-4">
              <h2 className="text-[#a02a11] text-xs font-black uppercase tracking-[0.6em]">{t.tagline}</h2>
              <h1 className="text-6xl md:text-9xl font-black italic uppercase tracking-tighter leading-none text-white">
                VIDEO.<span className="text-gradient">MASTER</span>
              </h1>
              <p className="text-gray-500 font-bold text-xs uppercase tracking-widest">Analisi tecnica professionale con 20 anni di esperienza</p>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 w-full max-w-4xl mx-auto">
              {PLATFORMS.map(p => (
                <PlatformCard key={p.id} id={p.id as Platform} label={p.label} icon={p.icon} isSelected={platform === p.id} onClick={() => setPlatform(p.id as Platform)} />
              ))}
            </div>

            <div className={`w-full transition-all duration-700 ${platform ? 'opacity-100 scale-100' : 'opacity-20 blur-sm pointer-events-none scale-95'}`}>
              <label className="relative inline-block group cursor-pointer w-full max-w-3xl">
                <div className="absolute -inset-1 bg-gradient-to-r from-[#a02a11] to-[#1087a0] rounded-[40px] blur opacity-25 group-hover:opacity-100 transition duration-1000"></div>
                <div className="relative glass p-20 rounded-[40px] border border-white/10 flex flex-col items-center gap-8 group-hover:bg-black/40 transition-all border-dashed group-hover:border-solid">
                  <div className="text-8xl drop-shadow-[0_0_30px_rgba(160,42,17,0.6)]">📽️</div>
                  <div className="space-y-2">
                    <span className="block text-2xl font-black uppercase tracking-tighter text-white">Upload Video Audit</span>
                    <span className="block text-[10px] font-black uppercase tracking-widest text-gray-500">Max {MAX_FILE_SIZE_MB}MB • Deep Strategic Processing</span>
                  </div>
                </div>
                <input type="file" className="hidden" accept="video/*" onChange={e => e.target.files?.[0] && handleAnalyzeVideo(e.target.files[0])} />
              </label>
            </div>
          </div>
        )}

        {loading && (
          <div className="py-24 flex flex-col items-center gap-16 text-center w-full max-w-2xl animate-fadeIn">
            <div className="relative w-40 h-40">
              <div className="absolute inset-0 border-[6px] border-[#a02a11]/10 rounded-full"></div>
              <div className="absolute inset-0 border-t-[6px] border-[#a02a11] rounded-full animate-spin"></div>
              <div className="absolute inset-4 glass rounded-full flex items-center justify-center overflow-hidden">
                <div className="scanner absolute inset-0 opacity-40"></div>
                <span className="text-[10px] font-black text-white uppercase tracking-widest relative z-10">AUDITING</span>
              </div>
            </div>
            <div className="space-y-8 w-full">
              <p className="text-4xl font-black uppercase italic tracking-tighter text-white animate-pulse h-20 flex items-center justify-center">
                {loadingMessages[loadingStep]}
              </p>
              <div className="w-full bg-white/5 h-1.5 rounded-full overflow-hidden">
                <div className="bg-[#a02a11] h-full animate-[loading_300s_linear_infinite]" style={{width: '100%'}}></div>
              </div>
              <p className="text-[9px] text-[#1087a0] font-black uppercase tracking-[0.5em] leading-loose max-w-md mx-auto">
                Non chiudere la finestra. L'audit senior richiede fino a 5 minuti per analizzare frame, audio e dinamiche algoritmiche.
              </p>
            </div>
          </div>
        )}

        {result && !loading && (
          <AnalysisView 
            result={result} 
            videoFile={lastFile || undefined}
            language={lang} 
            onReset={() => {setResult(null); setPlatform(null); setLastFile(null);}} 
          />
        )}
      </main>

      {showPricing && <PricingModal onClose={() => setShowPricing(false)} />}
      
      <footer className="mt-auto py-12 text-[10px] text-gray-800 font-black uppercase tracking-[0.6em]">
        © SG STRATEGIC COMPANY • NO BULLSHIT POLICY • DEEP ENGINE V5.0
      </footer>
      
      <style>{`
        @keyframes loading {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(0%); }
        }
      `}</style>
    </div>
  );
}
