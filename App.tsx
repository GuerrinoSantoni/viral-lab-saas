
import React, { useState, useEffect } from 'react';
import { Platform, AnalysisResult, Language } from './types';
import { PLATFORMS, TRANSLATIONS } from './constants';
import { analyzeVideo, generateIdea } from './services/geminiService';
import { PlatformCard } from './components/PlatformCard';
import { PricingModal } from './components/PricingModal';
import { AnalysisView } from './components/AnalysisView';

const MAX_FILE_SIZE_MB = 25; // Ridotto leggermente per stabilità totale
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
    "Sincronizzazione Master Strategist...",
    "Analisi pattern di viralità...",
    "Scansione psicologica dell'audience...",
    "Elaborazione algoritmi di ritenzione...",
    "Generazione copy magnetico...",
    "Finalizzazione del report spietato..."
  ];

  useEffect(() => {
    let interval: any;
    if (loading) {
      interval = setInterval(() => {
        setLoadingStep(prev => (prev + 1) % loadingMessages.length);
      }, 10000);
    }
    return () => clearInterval(interval);
  }, [loading]);

  const handleAnalyzeVideo = async (file: File) => {
    if (!platform) return alert("Seleziona la piattaforma.");
    if (file.size > MAX_FILE_SIZE_BYTES) return alert(`File troppo grande. Massimo ${MAX_FILE_SIZE_MB}MB.`);
    
    setLoading(true);
    setLoadingStep(0);
    setLastFile(file);
    try {
      const res = await analyzeVideo(file, platform, lang);
      setResult(res);
      setCredits(prev => prev - 1);
    } catch (e) {
      console.error(e);
      alert("Il server è sovraccarico o il file è troppo complesso. Riprova tra un istante o usa un file più corto.");
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateIdea = async () => {
    if (!platform) return alert("Seleziona la piattaforma.");
    if (!ideaText.trim()) return alert("Inserisci un'idea o un tema.");
    
    setLoading(true);
    setLoadingStep(0);
    try {
      const res = await generateIdea(ideaText, platform, lang);
      setResult(res);
      setCredits(prev => prev - 1);
    } catch (e) {
      console.error(e);
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
          <div className="w-10 h-10 bg-[#a02a11] rounded-lg flex items-center justify-center font-black">SG</div>
          <span className="font-black text-[10px] uppercase tracking-[0.3em] hidden sm:block">Senior Authority v5.3</span>
        </div>
        <div className="flex items-center gap-6">
          <span className="text-[10px] font-black uppercase text-gray-400">{t.credits}: {credits}</span>
          <button onClick={() => setShowPricing(true)} className="bg-white text-black px-6 py-2 rounded-full font-black text-[9px] uppercase tracking-widest hover:bg-[#a02a11] hover:text-white transition-all shadow-xl">UPGRADE</button>
        </div>
      </nav>

      <main className="w-full max-w-5xl flex flex-col items-center">
        {!result && !loading && (
          <div className="w-full text-center space-y-12 animate-fadeIn">
            <h1 className="text-6xl md:text-8xl font-black italic uppercase tracking-tighter">
              MASTER.<span className="text-[#a02a11]">STRATEGIST</span>
            </h1>

            <div className="flex bg-white/5 p-1 rounded-2xl w-fit mx-auto border border-white/10">
              <button onClick={() => setMode('VIDEO')} className={`px-8 py-3 rounded-xl text-[10px] font-black uppercase transition-all ${mode === 'VIDEO' ? 'bg-[#a02a11] text-white' : 'text-gray-500'}`}>Analisi Video</button>
              <button onClick={() => setMode('IDEA')} className={`px-8 py-3 rounded-xl text-[10px] font-black uppercase transition-all ${mode === 'IDEA' ? 'bg-[#a02a11] text-white' : 'text-gray-500'}`}>Generatore Idee</button>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 w-full max-w-3xl mx-auto">
              {PLATFORMS.map(p => (
                <PlatformCard key={p.id} id={p.id as Platform} label={p.label} icon={p.icon} isSelected={platform === p.id} onClick={() => setPlatform(p.id as Platform)} />
              ))}
            </div>

            <div className={`w-full max-w-3xl mx-auto transition-all ${platform ? 'opacity-100' : 'opacity-20 pointer-events-none'}`}>
              {mode === 'VIDEO' ? (
                <label className="cursor-pointer block">
                  <div className="glass p-16 rounded-[40px] border-dashed border-2 border-white/10 flex flex-col items-center gap-6 hover:border-[#a02a11] transition-all">
                    <div className="text-6xl">🎞️</div>
                    <span className="text-xl font-black uppercase">Carica Video per l'Audit</span>
                    <span className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">Limite {MAX_FILE_SIZE_MB}MB • Risultati in ~2 min</span>
                  </div>
                  <input type="file" className="hidden" accept="video/*" onChange={e => e.target.files?.[0] && handleAnalyzeVideo(e.target.files[0])} />
                </label>
              ) : (
                <div className="glass p-12 rounded-[40px] space-y-8">
                  <textarea 
                    value={ideaText}
                    onChange={(e) => setIdeaText(e.target.value)}
                    placeholder="Di cosa vuoi parlare? (es: 'Come guadagnare con le crypto', 'Vlog a Milano'...)"
                    className="w-full bg-black/40 border border-white/10 rounded-2xl p-6 text-sm outline-none min-h-[150px] focus:border-[#a02a11]"
                  />
                  <button onClick={handleGenerateIdea} className="w-full bg-white text-black py-5 rounded-2xl font-black uppercase text-xs hover:bg-[#a02a11] hover:text-white transition-all">GENERA STRATEGIA</button>
                </div>
              )}
            </div>
          </div>
        )}

        {loading && (
          <div className="py-24 flex flex-col items-center gap-12 text-center w-full animate-fadeIn">
            <div className="w-32 h-32 border-4 border-[#a02a11]/20 border-t-[#a02a11] rounded-full animate-spin"></div>
            <div className="space-y-6">
              <p className="text-3xl font-black uppercase italic tracking-tighter text-white animate-pulse">{loadingMessages[loadingStep]}</p>
              <p className="text-[10px] text-gray-500 font-bold uppercase tracking-[0.4em]">Il Master sta lavorando. Non ricaricare la pagina.</p>
            </div>
          </div>
        )}

        {result && !loading && (
          <AnalysisView result={result} videoFile={lastFile || undefined} language={lang} onReset={() => {setResult(null); setPlatform(null); setIdeaText("");}} />
        )}
      </main>
      {showPricing && <PricingModal onClose={() => setShowPricing(false)} />}
    </div>
  );
}
