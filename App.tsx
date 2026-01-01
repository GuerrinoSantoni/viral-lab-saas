
import React, { useState, useEffect } from 'react';
import { Platform, AnalysisResult, Language } from './types';
import { PLATFORMS, TRANSLATIONS } from './constants';
import { analyzeVideo, generateIdea } from './services/geminiService';
import { PlatformCard } from './components/PlatformCard';
import { PricingModal } from './components/PricingModal';
import { AnalysisView } from './components/AnalysisView';

// 30MB è il limite "safe" per la memoria del browser durante la conversione base64
const MAX_FILE_SIZE_MB = 30;
const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;

export default function App() {
  const [lang] = useState<Language>('IT');
  const [mode, setMode] = useState<'VIDEO' | 'IDEA'>('VIDEO');
  const [platform, setPlatform] = useState<Platform | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState(0);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [lastFile, setLastFile] = useState<File | null>(null);
  const [ideaText, setIdeaText] = useState("");
  const [showPricing, setShowPricing] = useState(false);
  const [credits, setCredits] = useState(10);

  const loadingMessages = [
    "Sincronizzazione Master Engine (20 anni di esperienza)...",
    "Estrazione fotogrammi chiave per l'analisi visiva...",
    "Analisi psicologica dell'Hook (primi 3 secondi)...",
    "Valutazione del Pacing e della curva di ritenzione...",
    "Il Master sta valutando la qualità dell'audio...",
    "Scansione pattern algoritmici per la viralità...",
    "Generazione strategia di crescita tecnica...",
    "Sintetizzazione verdetto finale (quasi pronto)...",
    "Ottimizzazione copy e hashtag strategici..."
  ];

  useEffect(() => {
    let interval: any;
    if (loading) {
      // Cambio messaggio ogni 12 secondi per coprire un'analisi lunga fino a 2-3 minuti
      interval = setInterval(() => {
        setLoadingStep(prev => (prev + 1) % loadingMessages.length);
      }, 12000);
    }
    return () => clearInterval(interval);
  }, [loading]);

  const handleAnalyzeVideo = async (file: File) => {
    if (!platform) return alert("Per favore, seleziona una piattaforma target.");
    if (file.size > MAX_FILE_SIZE_BYTES) {
      return alert(`File troppo grande. Per garantire un'analisi senza timeout, carica video inferiori a ${MAX_FILE_SIZE_MB}MB.`);
    }
    if (credits <= 0) return setShowPricing(true);

    setLoading(true);
    setLoadingStep(0);
    setLastFile(file);
    try {
      // Il timeout naturale del browser è circa 300s, Gemini Pro risponde solitamente in 60-120s
      const res = await analyzeVideo(file, platform, lang);
      setResult(res);
      setCredits(prev => Math.max(0, prev - 1));
    } catch (e: any) {
      console.error("Audit Error:", e);
      alert("Il Master ha impiegato troppo tempo o la connessione è instabile. Consiglio: se il video è lungo, prova a caricarne solo i primi 60 secondi (i più importanti per la viralità).");
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateIdea = async () => {
    if (!platform) return alert("Seleziona prima la piattaforma.");
    if (!ideaText.trim()) return alert("Scrivi un'idea o un argomento.");
    if (credits <= 0) return setShowPricing(true);

    setLoading(true);
    setLoadingStep(0);
    try {
      const res = await generateIdea(ideaText, platform, lang);
      setResult(res);
      setCredits(prev => Math.max(0, prev - 1));
    } catch (e: any) {
      alert("Errore nella generazione dell'idea. Riprova.");
    } finally {
      setLoading(false);
    }
  };

  const t = (TRANSLATIONS[lang] || TRANSLATIONS.IT) as any;

  return (
    <div className="min-h-screen p-4 md:p-8 flex flex-col items-center bg-[#000] text-white">
      <nav className="w-full max-w-7xl glass px-8 py-5 rounded-[30px] flex justify-between items-center mb-12 shadow-2xl premium-border">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 bg-[#a02a11] rounded-lg flex items-center justify-center font-black shadow-[0_0_15px_rgba(160,42,17,0.4)]">SG</div>
          <span className="font-black text-[10px] uppercase tracking-[0.3em] hidden sm:block">Senior Authority v5.2</span>
        </div>
        <div className="flex items-center gap-6">
          <span className="text-[10px] font-black uppercase text-gray-400">{t.credits}: <span className="text-white">{credits}</span></span>
          <button onClick={() => setShowPricing(true)} className="bg-white text-black px-6 py-2 rounded-full font-black text-[9px] uppercase tracking-widest hover:bg-[#a02a11] hover:text-white transition-all shadow-xl">UPGRADE</button>
        </div>
      </nav>

      <main className="w-full max-w-5xl flex flex-col items-center">
        {!result && !loading && (
          <div className="w-full text-center space-y-12 animate-fadeIn">
            <div className="space-y-4">
              <h1 className="text-6xl md:text-8xl font-black italic uppercase tracking-tighter leading-none">
                MASTER.<span className="text-[#a02a11]">STRATEGIST</span>
              </h1>
              <p className="text-gray-500 font-bold text-[10px] uppercase tracking-[0.5em]">{t.tagline}</p>
            </div>

            <div className="flex bg-white/5 p-1 rounded-2xl w-fit mx-auto border border-white/10">
              <button 
                onClick={() => setMode('VIDEO')}
                className={`px-8 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${mode === 'VIDEO' ? 'bg-[#a02a11] text-white shadow-lg' : 'text-gray-500 hover:text-white'}`}
              >
                Analisi Video
              </button>
              <button 
                onClick={() => setMode('IDEA')}
                className={`px-8 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${mode === 'IDEA' ? 'bg-[#a02a11] text-white shadow-lg' : 'text-gray-500 hover:text-white'}`}
              >
                Generatore Idee
              </button>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 w-full max-w-3xl mx-auto">
              {PLATFORMS.map(p => (
                <PlatformCard key={p.id} id={p.id as Platform} label={p.label} icon={p.icon} isSelected={platform === p.id} onClick={() => setPlatform(p.id as Platform)} />
              ))}
            </div>

            <div className={`w-full max-w-3xl mx-auto transition-all duration-500 ${platform ? 'opacity-100' : 'opacity-20 blur-sm pointer-events-none'}`}>
              {mode === 'VIDEO' ? (
                <label className="cursor-pointer block group">
                  <div className="glass p-16 rounded-[40px] border-dashed border-2 border-white/10 flex flex-col items-center gap-6 group-hover:border-[#a02a11] transition-all relative overflow-hidden">
                    <div className="text-6xl drop-shadow-[0_0_20px_rgba(160,42,17,0.4)]">🎞️</div>
                    <div className="space-y-2">
                      <span className="block text-xl font-black uppercase tracking-tighter">Carica Video per l'Audit Profondo</span>
                      <span className="block text-[9px] text-gray-500 font-bold uppercase tracking-widest">Limite di Sicurezza {MAX_FILE_SIZE_MB}MB • Risultati in 2-3 min</span>
                    </div>
                  </div>
                  <input type="file" className="hidden" accept="video/*" onChange={e => e.target.files?.[0] && handleAnalyzeVideo(e.target.files[0])} />
                </label>
              ) : (
                <div className="glass p-12 rounded-[40px] border border-white/5 space-y-8">
                  <textarea 
                    value={ideaText}
                    onChange={(e) => setIdeaText(e.target.value)}
                    placeholder={t.ideaPlaceholder}
                    className="w-full bg-black/40 border border-white/10 rounded-2xl p-6 text-sm font-medium focus:border-[#a02a11] outline-none min-h-[150px] resize-none transition-all"
                  />
                  <button 
                    onClick={handleGenerateIdea}
                    className="w-full bg-white text-black py-5 rounded-2xl font-black uppercase text-xs tracking-widest hover:bg-[#a02a11] hover:text-white transition-all shadow-2xl"
                  >
                    {t.ideaBtn}
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {loading && (
          <div className="py-24 flex flex-col items-center gap-12 text-center w-full max-w-xl animate-fadeIn">
            <div className="relative w-40 h-40">
              <div className="absolute inset-0 border-[6px] border-[#a02a11]/10 rounded-full"></div>
              <div className="absolute inset-0 border-t-[6px] border-[#a02a11] rounded-full animate-spin"></div>
              <div className="absolute inset-6 glass rounded-full flex items-center justify-center">
                <span className="font-black text-[12px] tracking-[0.2em] animate-pulse">SENIOR AUDIT</span>
              </div>
            </div>
            <div className="space-y-8 w-full px-6">
              <div className="space-y-2">
                <p className="text-2xl md:text-3xl font-black uppercase italic tracking-tighter text-white h-16 flex items-center justify-center">
                  {loadingMessages[loadingStep]}
                </p>
                <p className="text-[10px] text-[#a02a11] font-black uppercase tracking-[0.3em]">Non chiudere questa scheda</p>
              </div>
              
              <div className="space-y-4">
                <div className="w-full bg-white/5 h-2 rounded-full overflow-hidden border border-white/10">
                  <div className="bg-[#a02a11] h-full shadow-[0_0_15px_#a02a11] transition-all duration-[12000ms] ease-linear" style={{width: `${((loadingStep + 1) / loadingMessages.length) * 100}%`}}></div>
                </div>
                <div className="flex justify-between text-[8px] font-black text-gray-500 uppercase tracking-widest">
                  <span>Inizio Audit</span>
                  <span>Il Master sta scrivendo...</span>
                  <span>Verdetto Finale</span>
                </div>
              </div>

              <div className="glass p-6 rounded-2xl border border-white/5">
                <p className="text-gray-400 text-[10px] leading-relaxed italic">
                  "Un audit senior richiede tempo perché ogni fotogramma viene analizzato per massimizzare la tua ritenzione. La qualità non è mai istantanea."
                </p>
              </div>
            </div>
          </div>
        )}

        {result && !loading && (
          <AnalysisView 
            result={result} 
            videoFile={lastFile || undefined} 
            language={lang} 
            onReset={() => {setResult(null); setPlatform(null); setLastFile(null); setIdeaText("");}} 
          />
        )}
      </main>

      {showPricing && <PricingModal onClose={() => setShowPricing(false)} />}
      <style>{`
        @keyframes fadeIn { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
        .animate-fadeIn { animation: fadeIn 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
        .premium-border { border: 1px solid rgba(160, 42, 17, 0.2); }
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #a02a11; border-radius: 10px; }
      `}</style>
    </div>
  );
}
