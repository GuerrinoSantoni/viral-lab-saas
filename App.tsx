
import React, { useState, useEffect } from 'react';
import { Platform, AnalysisResult, Language } from './types';
import { PLATFORMS, TRANSLATIONS } from './constants';
import { analyzeVideo, generateIdea } from './services/geminiService';
import { PlatformCard } from './components/PlatformCard';
import { PricingModal } from './components/PricingModal';
import { AnalysisView } from './components/AnalysisView';

const MAX_FILE_SIZE_MB = 50; 

export default function App() {
  const [lang] = useState<Language>('IT');
  const [mode, setMode] = useState<'VIDEO' | 'IDEA'>('VIDEO');
  const [platform, setPlatform] = useState<Platform | null>(null);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState("");
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [lastFile, setLastFile] = useState<File | null>(null);
  const [ideaText, setIdeaText] = useState("");
  const [showPricing, setShowPricing] = useState(false);
  const [credits, setCredits] = useState(10);

  const handleAnalyzeVideo = async (file: File) => {
    if (!platform) return alert("Seleziona una piattaforma!");
    
    setLoading(true);
    setStatus("Inizializzazione Master Audit...");
    setLastFile(file);
    try {
      const res = await analyzeVideo(file, platform, lang, (step) => setStatus(step));
      setResult(res);
      setCredits(prev => prev - 1);
    } catch (e: any) {
      console.error("CRITICAL_ERROR:", e);
      alert(`ERRORE: Il server Google ha riscontrato un problema interno. Prova a comprimere il video o riprova tra qualche minuto. L'API di analisi video è attualmente sotto carico pesante.`);
    } finally {
      setLoading(false);
      setStatus("");
    }
  };

  const handleGenerateIdea = async () => {
    if (!platform) return alert("Seleziona una piattaforma!");
    if (!ideaText.trim()) return alert("Scrivi la tua idea!");
    
    setLoading(true);
    setStatus("Generazione strategia creativa...");
    try {
      const res = await generateIdea(ideaText, platform, lang);
      setResult(res);
      setCredits(prev => prev - 1);
    } catch (e: any) {
      alert(`Errore: ${e.message}`);
    } finally {
      setLoading(false);
      setStatus("");
    }
  };

  const t = (TRANSLATIONS[lang] || TRANSLATIONS.IT) as any;

  return (
    <div className="min-h-screen p-4 md:p-8 flex flex-col items-center bg-[#000] text-white">
      <nav className="w-full max-w-7xl glass px-8 py-5 rounded-[30px] flex justify-between items-center mb-12 shadow-2xl premium-border">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 bg-[#a02a11] rounded-lg flex items-center justify-center font-black">SG</div>
          <span className="font-black text-[10px] uppercase tracking-[0.3em] hidden sm:block italic">Senior Audit • 20Y Experience</span>
        </div>
        <div className="flex items-center gap-6">
          <span className="text-[10px] font-black uppercase text-gray-400">{t.credits}: {credits}</span>
          <button onClick={() => setShowPricing(true)} className="bg-white text-black px-6 py-2 rounded-full font-black text-[9px] uppercase tracking-widest hover:bg-[#a02a11] hover:text-white transition-all">UPGRADE</button>
        </div>
      </nav>

      <main className="w-full max-w-5xl flex flex-col items-center">
        {!result && !loading && (
          <div className="w-full text-center space-y-12 animate-fadeIn">
            <h1 className="text-6xl md:text-8xl font-black italic uppercase tracking-tighter">
              MASTER.<span className="text-[#a02a11]">AUDIT</span>
            </h1>

            <div className="flex bg-white/5 p-1 rounded-2xl w-fit mx-auto border border-white/10">
              <button onClick={() => setMode('VIDEO')} className={`px-8 py-3 rounded-xl text-[10px] font-black uppercase transition-all ${mode === 'VIDEO' ? 'bg-[#a02a11] text-white' : 'text-gray-500'}`}>Analisi Video</button>
              <button onClick={() => setMode('IDEA')} className={`px-8 py-3 rounded-xl text-[10px] font-black uppercase transition-all ${mode === 'IDEA' ? 'bg-[#a02a11] text-white' : 'text-gray-500'}`}>Generatore Idee</button>
            </div>

            <div className="space-y-4">
              <p className="text-[9px] font-black uppercase tracking-[0.3em] text-[#a02a11]">1. Piattaforma Target</p>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 w-full max-w-3xl mx-auto">
                {PLATFORMS.map(p => (
                  <PlatformCard key={p.id} id={p.id as Platform} label={p.label} icon={p.icon} isSelected={platform === p.id} onClick={() => setPlatform(p.id as Platform)} />
                ))}
              </div>
            </div>

            <div className={`w-full max-w-3xl mx-auto transition-all ${platform ? 'opacity-100' : 'opacity-50'}`}>
              {mode === 'VIDEO' ? (
                <label className="cursor-pointer block">
                  <div className="glass p-16 rounded-[40px] border-dashed border-2 border-white/10 flex flex-col items-center gap-6 hover:border-[#a02a11] transition-all">
                    <div className="text-6xl">📽️</div>
                    <span className="text-xl font-black uppercase tracking-tighter italic">Carica per l'Audit a due fasi</span>
                    <span className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">Procedura Senior Garantita • Max {MAX_FILE_SIZE_MB}MB</span>
                  </div>
                  <input type="file" className="hidden" accept="video/*" disabled={!platform} onChange={e => e.target.files?.[0] && handleAnalyzeVideo(e.target.files[0])} />
                </label>
              ) : (
                <div className="glass p-12 rounded-[40px] space-y-8 border border-white/10">
                  <textarea 
                    value={ideaText}
                    onChange={(e) => setIdeaText(e.target.value)}
                    placeholder="Descrivi la tua idea strategica..."
                    className="w-full bg-black/60 border border-white/10 rounded-2xl p-6 text-sm outline-none min-h-[150px] focus:border-[#a02a11] transition-all text-white font-medium"
                  />
                  <button onClick={handleGenerateIdea} className="w-full py-5 rounded-2xl font-black uppercase text-xs bg-white text-black hover:bg-[#a02a11] hover:text-white transition-all">Genera Piano d'Attacco</button>
                </div>
              )}
            </div>
          </div>
        )}

        {loading && (
          <div className="py-24 flex flex-col items-center gap-10 text-center w-full animate-fadeIn max-w-xl">
            <div className="relative">
               <div className="w-32 h-32 border-[2px] border-[#a02a11]/20 border-t-[#a02a11] rounded-full animate-spin"></div>
               <div className="absolute inset-0 flex items-center justify-center text-xs font-black uppercase italic text-[#a02a11] animate-pulse">Master</div>
            </div>
            <div className="space-y-4">
              <p className="text-3xl font-black uppercase italic tracking-tighter text-white">
                {status}
              </p>
              <p className="text-[10px] text-gray-500 uppercase tracking-[0.4em] font-black animate-pulse">
                Analisi Senior in corso • Non chiudere la scheda
              </p>
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
