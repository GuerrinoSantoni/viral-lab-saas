import React, { useState, useEffect } from 'react';
import { Platform, AnalysisResult, Language } from './types';
import { PLATFORMS, TRANSLATIONS } from './constants';
import { analyzeVideo, analyzePrompt } from './services/geminiService';
import { PlatformCard } from './components/PlatformCard';
import { PricingModal } from './components/PricingModal';
import { AnalysisView } from './components/AnalysisView';

export default function App() {
  const [lang] = useState<Language>('IT');
  const [platform, setPlatform] = useState<Platform | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [showPricing, setShowPricing] = useState(false);
  const [credits, setCredits] = useState(3);
  const [ownerMode, setOwnerMode] = useState(false);
  const [textInput, setTextInput] = useState("");

  useEffect(() => {
    if (window.location.hash === '#master-admin') {
      setOwnerMode(true);
    }
  }, []);

  const checkCredits = () => {
    if (!ownerMode && credits <= 0) {
      setShowPricing(true);
      return false;
    }
    return true;
  };

  const handleAnalyzeVideo = async (file: File) => {
    if (!platform) return alert("Seleziona prima una piattaforma.");
    if (!checkCredits()) return;
    
    setLoading(true);
    try {
      const res = await analyzeVideo(file, platform, lang);
      setResult(res);
      if (!ownerMode) setCredits(prev => Math.max(0, prev - 1));
    } catch (e: any) {
      alert("ERRORE DI SISTEMA: Controlla la tua API_KEY.");
    } finally {
      setLoading(false);
    }
  };

  const handleAnalyzePrompt = async () => {
    if (!platform) return alert("Seleziona prima una piattaforma.");
    if (!textInput.trim()) return alert("Inserisci un'idea o un argomento.");
    if (!checkCredits()) return;

    setLoading(true);
    try {
      const res = await analyzePrompt(textInput, platform, lang);
      setResult(res);
      if (!ownerMode) setCredits(prev => Math.max(0, prev - 1));
    } catch (e) {
      alert("Errore durante la generazione dell'idea.");
    } finally {
      setLoading(false);
    }
  };

  const t = (TRANSLATIONS[lang] || TRANSLATIONS.IT) as any;

  return (
    <div className="min-h-screen p-4 md:p-8 flex flex-col items-center bg-[#000]">
      <nav className="w-full max-w-7xl glass px-8 py-4 rounded-full flex justify-between items-center mb-16 sticky top-6 z-50 premium-border">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-[#a02a11] rounded-xl flex items-center justify-center font-black text-xl shadow-[0_0_20px_rgba(160,42,17,0.4)]">SG</div>
          <div className="hidden sm:flex flex-col">
            <span className="font-black text-xs uppercase tracking-tighter text-white">Strategic Master Audit</span>
            <span className="text-[9px] text-[#1087a0] font-black uppercase tracking-[0.3em]">Verified Master v2.1</span>
          </div>
        </div>
        <div className="flex items-center gap-6">
          <div className="flex flex-col items-end">
            <span className="text-[8px] font-black text-gray-500 uppercase">Status: Online</span>
            <div className="text-[10px] font-black uppercase tracking-widest text-white">
              {t.credits}: <span className="text-[#a02a11]">{ownerMode ? 'UNLIMITED' : credits}</span>
            </div>
          </div>
          <button onClick={() => setShowPricing(true)} className="bg-white text-black px-6 py-2.5 rounded-full font-black text-[9px] uppercase tracking-widest hover:bg-[#a02a11] hover:text-white transition-all shadow-xl">
            {t.upgrade}
          </button>
        </div>
      </nav>

      <main className="w-full max-w-6xl flex flex-col items-center">
        {!result && !loading && (
          <div className="w-full text-center space-y-12 animate-fadeIn">
            <div className="space-y-6">
              <h2 className="text-[#a02a11] text-xs font-black uppercase tracking-[0.6em]">{t.tagline}</h2>
              <h1 className="text-7xl md:text-[120px] font-black italic uppercase tracking-tighter leading-[0.85] text-white">
                THE.<span className="text-gradient">AUDIT</span>
              </h1>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 w-full max-w-4xl mx-auto">
              {PLATFORMS.map(p => (
                <PlatformCard key={p.id} id={p.id as Platform} label={p.label} icon={p.icon} isSelected={platform === p.id} onClick={() => setPlatform(p.id as Platform)} />
              ))}
            </div>

            <div className={`w-full max-w-2xl mx-auto space-y-8 transition-all duration-700 ${platform ? 'opacity-100 translate-y-0' : 'opacity-20 blur-sm pointer-events-none'}`}>
              
              {/* Text Input Section */}
              <div className="glass p-8 rounded-[40px] border border-white/10 space-y-6">
                <textarea 
                  value={textInput}
                  onChange={(e) => setTextInput(e.target.value)}
                  placeholder={t.ideaPlaceholder}
                  className="w-full bg-transparent border-none text-white text-lg font-bold placeholder:text-gray-700 focus:ring-0 resize-none h-32"
                />
                <button 
                  onClick={handleAnalyzePrompt}
                  className="w-full bg-[#a02a11] text-white py-4 rounded-2xl font-black uppercase tracking-widest text-xs hover:scale-[1.02] transition-transform shadow-2xl"
                >
                  {t.ideaBtn}
                </button>
              </div>

              <div className="flex items-center gap-4">
                <div className="h-px flex-1 bg-white/10"></div>
                <span className="text-[10px] font-black text-gray-600 uppercase tracking-widest">{t.orText}</span>
                <div className="h-px flex-1 bg-white/10"></div>
              </div>

              {/* Video Upload Section */}
              <label className="relative inline-block group cursor-pointer w-full">
                <div className="absolute -inset-1 bg-gradient-to-r from-[#a02a11] to-[#1087a0] rounded-[40px] blur opacity-10 group-hover:opacity-40 transition duration-1000"></div>
                <div className="relative glass p-10 rounded-[40px] border border-white/10 flex items-center justify-center gap-8 group-hover:bg-white/5 transition-all">
                  <div className="text-4xl group-hover:scale-110 transition-transform duration-500">📥</div>
                  <div className="text-left">
                    <span className="block text-xs font-black uppercase tracking-[0.3em] text-white">Upload Video Audit</span>
                    <span className="block text-[9px] font-black uppercase tracking-widest text-gray-500">Frame Analysis & Retention Strategy</span>
                  </div>
                </div>
                <input type="file" className="hidden" accept="video/*" onChange={e => e.target.files?.[0] && handleAnalyzeVideo(e.target.files[0])} />
              </label>
            </div>
          </div>
        )}

        {loading && (
          <div className="py-40 flex flex-col items-center gap-12 text-center">
            <div className="relative w-32 h-32">
              <div className="absolute inset-0 border-2 border-[#a02a11]/20 rounded-full"></div>
              <div className="absolute inset-0 border-t-2 border-[#a02a11] rounded-full animate-spin"></div>
              <div className="absolute inset-4 glass rounded-full flex items-center justify-center text-xs font-black text-[#a02a11]">AI</div>
            </div>
            <p className="text-4xl font-black uppercase italic tracking-tighter animate-pulse text-white">{t.processing}</p>
          </div>
        )}

        {result && !loading && (
          <AnalysisView result={result} language={lang} onReset={() => {setResult(null); setPlatform(null); setTextInput("");}} />
        )}
      </main>

      {showPricing && <PricingModal onClose={() => setShowPricing(false)} />}
      <footer className="mt-auto py-12 text-[8px] text-gray-700 font-black uppercase tracking-[0.5em]">
        © SG STRATEGIC COMPANY • NO BULLSHIT POLICY • 2024-2025
      </footer>
    </div>
  );
}
