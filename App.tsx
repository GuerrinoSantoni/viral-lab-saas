
import React, { useState, useEffect } from 'react';
import { Platform, AnalysisResult, Language } from './types';
import { PLATFORMS, TRANSLATIONS } from './constants';
import { analyzeVideo, generateIdea } from './services/geminiService';
import { PlatformCard } from './components/PlatformCard';
import { PricingModal } from './components/PricingModal';
import { AnalysisView } from './components/AnalysisView';

const MAX_FILE_SIZE_MB = 15;
const MAX_IMAGE_SIZE_MB = 5;
const INITIAL_FREE_CREDITS = 3;

export default function App() {
  const [lang] = useState<Language>('IT');
  const [mode, setMode] = useState<'VIDEO' | 'IDEA'>('VIDEO');
  const [platform, setPlatform] = useState<Platform | null>(null);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState("");
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [lastFile, setLastFile] = useState<File | null>(null);
  const [ideaText, setIdeaText] = useState("");
  const [ideaFile, setIdeaFile] = useState<File | null>(null);
  const [showPricing, setShowPricing] = useState(false);
  
  // Persistenza Crediti
  const [credits, setCredits] = useState<number>(() => {
    const saved = localStorage.getItem('sg_credits');
    return saved !== null ? parseInt(saved) : INITIAL_FREE_CREDITS;
  });
  const [isMaster, setIsMaster] = useState(() => localStorage.getItem('sg_master') === 'true');
  const [clickCount, setClickCount] = useState(0);

  useEffect(() => {
    localStorage.setItem('sg_credits', credits.toString());
  }, [credits]);

  useEffect(() => {
    localStorage.setItem('sg_master', isMaster.toString());
  }, [isMaster]);

  const handleLogoClick = () => {
    const newCount = clickCount + 1;
    setClickCount(newCount);
    if (newCount === 5) {
      setIsMaster(!isMaster);
      setClickCount(0);
      alert(isMaster ? "MASTER MODE DISATTIVATA" : "MASTER MODE ATTIVATA: CREDITI ILLIMITATI");
    }
    setTimeout(() => setClickCount(0), 2000); // Reset contatore dopo 2 sec
  };

  const checkCredits = () => {
    if (isMaster) return true;
    if (credits <= 0) {
      setShowPricing(true);
      return false;
    }
    return true;
  };

  const consumeCredit = () => {
    if (!isMaster) setCredits(prev => Math.max(0, prev - 1));
  };

  const handleError = (e: any) => {
    console.error("Master Debug:", e);
    const msg = e.message || "";
    if (msg.includes("500") || msg.includes("Internal")) {
      alert("⚠️ SERVER GOOGLE SATURO: Riprova tra 10 secondi.");
    } else {
      alert(`❌ MASTER ERROR: ${msg || "Errore tecnico."}`);
    }
  };

  const handleAnalyzeVideo = async (file: File) => {
    if (!platform) return alert("Seleziona una piattaforma.");
    if (!checkCredits()) return;
    if (file.size > MAX_FILE_SIZE_MB * 1024 * 1024) {
      return alert(`File troppo pesante (Max ${MAX_FILE_SIZE_MB}MB).`);
    }
    setLoading(true);
    setStatus("Codifica Stream...");
    setLastFile(file);
    try {
      const res = await analyzeVideo(file, platform, lang, (step) => setStatus(step));
      setResult(res);
      consumeCredit();
    } catch (e: any) {
      handleError(e);
    } finally {
      setLoading(false);
      setStatus("");
    }
  };

  const handleGenerateIdea = async () => {
    if (!platform) return alert("Scegli piattaforma!");
    if (!checkCredits()) return;
    if (!ideaText.trim() && !ideaFile) return alert("Scrivi un'idea o carica un'immagine!");
    setLoading(true);
    setStatus("Analisi Strategica Multimodale...");
    try {
      const res = await generateIdea(ideaText, platform, lang, ideaFile || undefined);
      setResult(res);
      consumeCredit();
    } catch (e: any) {
      handleError(e);
    } finally {
      setLoading(false);
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > MAX_IMAGE_SIZE_MB * 1024 * 1024) {
        alert(`L'immagine è troppo grande (Max ${MAX_IMAGE_SIZE_MB}MB)`);
        return;
      }
      setIdeaFile(file);
    }
  };

  return (
    <div className="min-h-screen p-4 md:p-8 flex flex-col items-center bg-[#000] text-white">
      <nav className="w-full max-w-7xl glass px-8 py-5 rounded-[30px] flex justify-between items-center mb-12 shadow-2xl premium-border">
        <div className="flex items-center gap-4 cursor-pointer select-none" onClick={handleLogoClick}>
          <div className={`w-10 h-10 rounded-lg flex items-center justify-center font-black transition-all ${isMaster ? 'bg-yellow-500 shadow-[0_0_20px_#eab308]' : 'bg-[#a02a11] shadow-[0_0_15px_#a02a11]'}`}>SG</div>
          <div className="flex flex-col">
            <span className="font-black text-[10px] uppercase tracking-[0.3em] hidden sm:block italic">Senior Master Audit</span>
            {isMaster && <span className="text-[8px] font-black text-yellow-500 tracking-widest">MASTER UNLIMITED</span>}
          </div>
        </div>
        <div className="flex items-center gap-6">
          <div className="flex flex-col items-end">
            <span className={`text-[10px] font-black uppercase tracking-widest ${credits === 0 && !isMaster ? 'text-red-500' : 'text-gray-400'}`}>
              CREDITI: {isMaster ? '∞' : credits}
            </span>
            {!isMaster && credits <= 1 && credits > 0 && <span className="text-[7px] font-bold text-[#a02a11] animate-pulse">ULTIMO DISPONIBILE</span>}
          </div>
          <button onClick={() => setShowPricing(true)} className="bg-white text-black px-6 py-2 rounded-full font-black text-[9px] uppercase hover:bg-[#a02a11] hover:text-white transition-all">UPGRADE</button>
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

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 w-full max-w-3xl mx-auto">
              {PLATFORMS.map(p => (
                <PlatformCard key={p.id} id={p.id as Platform} label={p.label} icon={p.icon} isSelected={platform === p.id} onClick={() => setPlatform(p.id as Platform)} />
              ))}
            </div>

            <div className="w-full max-w-3xl mx-auto">
              {mode === 'VIDEO' ? (
                <label className={`cursor-pointer block ${credits <= 0 && !isMaster ? 'opacity-50 grayscale pointer-events-none' : ''}`}>
                  <div className="glass p-16 rounded-[40px] border-dashed border-2 border-white/10 flex flex-col items-center gap-6 hover:border-[#a02a11] transition-all group">
                    <div className="text-6xl group-hover:scale-125 transition-transform">🎞️</div>
                    <span className="text-xl font-black uppercase italic">Audit Video Master (Max {MAX_FILE_SIZE_MB}MB)</span>
                    {credits <= 0 && !isMaster && <span className="text-red-500 font-black text-[10px] tracking-widest uppercase">Crediti Esauriti</span>}
                  </div>
                  <input type="file" className="hidden" accept="video/*" disabled={!platform || (credits <= 0 && !isMaster)} onChange={e => e.target.files?.[0] && handleAnalyzeVideo(e.target.files[0])} />
                </label>
              ) : (
                <div className={`glass p-10 rounded-[40px] space-y-6 border border-white/10 shadow-2xl ${credits <= 0 && !isMaster ? 'opacity-50 grayscale' : ''}`}>
                  <div className="flex flex-col md:flex-row gap-6">
                    <div className="flex-1">
                      <textarea 
                        value={ideaText}
                        onChange={(e) => setIdeaText(e.target.value)}
                        placeholder="Descrivi la tua idea o lo script..."
                        disabled={credits <= 0 && !isMaster}
                        className="w-full bg-black/60 border border-white/10 rounded-2xl p-6 text-sm outline-none min-h-[150px] focus:border-[#a02a11] transition-all text-white font-medium disabled:cursor-not-allowed"
                      />
                    </div>
                    <div className="w-full md:w-48">
                      <label className={`cursor-pointer block h-full ${credits <= 0 && !isMaster ? 'pointer-events-none' : ''}`}>
                        <div className={`h-full min-h-[150px] rounded-2xl border-2 border-dashed flex flex-col items-center justify-center p-4 transition-all ${ideaFile ? 'border-[#1087a0] bg-[#1087a0]/10' : 'border-white/10 hover:border-white/20 bg-white/5'}`}>
                          {ideaFile ? (
                            <div className="text-center">
                              <span className="text-2xl">🖼️</span>
                              <p className="text-[8px] font-black uppercase mt-2 text-[#1087a0] truncate max-w-[120px]">{ideaFile.name}</p>
                              <button onClick={(e) => {e.preventDefault(); setIdeaFile(null);}} className="text-[8px] font-black text-red-500 uppercase mt-2">Rimuovi</button>
                            </div>
                          ) : (
                            <div className="text-center">
                              <span className="text-2xl opacity-50">📁</span>
                              <p className="text-[8px] font-black uppercase mt-2 text-gray-500 tracking-tighter leading-tight">Carica Immagine<br/>(Riferimento)</p>
                            </div>
                          )}
                        </div>
                        <input type="file" className="hidden" accept="image/*" disabled={credits <= 0 && !isMaster} onChange={handleImageChange} />
                      </label>
                    </div>
                  </div>
                  <button 
                    onClick={handleGenerateIdea} 
                    disabled={credits <= 0 && !isMaster}
                    className="w-full py-5 rounded-2xl font-black uppercase text-xs bg-white text-black hover:bg-[#a02a11] hover:text-white transition-all shadow-xl disabled:bg-gray-800 disabled:text-gray-500"
                  >
                    {credits <= 0 && !isMaster ? "CREDITI ESAURITI" : "Genera Strategia Virale"}
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {loading && (
          <div className="py-24 flex flex-col items-center gap-10 text-center w-full">
            <div className="w-24 h-24 border-[2px] border-[#a02a11] border-t-transparent rounded-full animate-spin"></div>
            <p className="text-4xl font-black uppercase italic tracking-tighter">{status}</p>
          </div>
        )}

        {result && !loading && (
          <AnalysisView result={result} videoFile={lastFile || undefined} language={lang} onReset={() => {setResult(null); setPlatform(null); setIdeaText(""); setIdeaFile(null);}} />
        )}
      </main>
      {showPricing && <PricingModal onClose={() => setShowPricing(false)} />}
    </div>
  );
}
