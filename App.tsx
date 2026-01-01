import React, { useState, useEffect } from 'react';
import { Platform, AnalysisResult, Language } from './types';
import { PLATFORMS, TRANSLATIONS } from './constants';
import { analyzeVideo } from './services/geminiService';
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

  useEffect(() => {
    if (window.location.hash === '#master-admin') {
      setOwnerMode(true);
    }
  }, []);

  const handleAnalyze = async (file: File) => {
    if (!platform) {
      alert("Seleziona prima una piattaforma.");
      return;
    }
    if (!ownerMode && credits <= 0) {
      setShowPricing(true);
      return;
    }
    
    setLoading(true);
    try {
      const res = await analyzeVideo(file, platform, lang);
      setResult(res);
      if (!ownerMode) {
        setCredits(prev => Math.max(0, prev - 1));
      }
    } catch (e: any) {
      console.error(e);
      alert("ERRORE DI SISTEMA: Controlla la tua API_KEY nelle impostazioni di Vercel. Il server non risponde.");
    } finally {
      setLoading(false);
    }
  };

  const t = (TRANSLATIONS[lang] || TRANSLATIONS.IT) as any;

  return (
    <div className="min-h-screen p-4 md:p-8 flex flex-col items-center bg-[#000]">
      {/* Header / Nav */}
      <nav className="w-full max-w-7xl glass px-8 py-4 rounded-full flex justify-between items-center mb-16 sticky top-6 z-50 premium-border">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-[#a02a11] rounded-xl flex items-center justify-center font-black text-xl shadow-[0_0_20px_rgba(160,42,17,0.4)]">SG</div>
          <div className="hidden sm:flex flex-col">
            <span className="font-black text-xs uppercase tracking-tighter">Strategic Master Audit</span>
            <span className="text-[9px] text-[#1087a0] font-black uppercase tracking-[0.3em]">Verified Master v2.1</span>
          </div>
        </div>
        
        <div className="flex items-center gap-6">
          <div className="flex flex-col items-end">
            <span className="text-[8px] font-black text-gray-500 uppercase">Status: Online</span>
            <div className="text-[10px] font-black uppercase tracking-widest">
              {t.credits}: <span className="text-[#a02a11]">{ownerMode ? 'UNLIMITED' : credits}</span>
            </div>
          </div>
          <button 
            onClick={() => setShowPricing(true)} 
            className="bg-white text-black px-6 py-2.5 rounded-full font-black text-[9px] uppercase tracking-widest hover:bg-[#a02a11] hover:text-white transition-all shadow-xl"
          >
            {t.upgrade}
          </button>
        </div>
      </nav>

      {/* Main Content */}
      <main className="w-full max-w-6xl flex flex-col items-center">
        {!result && !loading && (
          <div className="w-full text-center space-y-16 animate-fadeIn">
            <div className="space-y-6">
              <h2 className="text-[#a02a11] text-xs font-black uppercase tracking-[0.6em]">{t.tagline}</h2>
              <h1 className="text-7xl md:text-[120px] font-black italic uppercase tracking-tighter leading-[0.85] text-white">
                THE.<span className="text-gradient">AUDIT</span>
              </h1>
              <p className="max-w-xl mx-auto text-gray-400 text-sm font-bold uppercase tracking-widest leading-relaxed">
                Ottieni l'analisi brutale di uno YouTuber con 20 anni di esperienza. 
                Niente filtri, solo strategie che convertono.
              </p>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 w-full">
              {PLATFORMS.map(p => (
                <PlatformCard 
                  key={p.id}
                  id={p.id as Platform}
                  label={p.label}
                  icon={p.icon}
                  isSelected={platform === p.id}
                  onClick={() => setPlatform(p.id as Platform)}
                />
              ))}
            </div>

            <div className={`transition-all duration-700 ${platform ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10 pointer-events-none'}`}>
              <label className="relative inline-block group cursor-pointer">
                <div className="absolute -inset-1 bg-gradient-to-r from-[#a02a11] to-[#1087a0] rounded-[40px] blur opacity-25 group-hover:opacity-75 transition duration-1000"></div>
                <div className="relative glass px-20 py-16 rounded-[40px] border border-white/10 flex flex-col items-center gap-6 group-hover:bg-white/5 transition-all">
                  <div className="text-5xl group-hover:scale-110 transition-transform duration-500">📥</div>
                  <div className="flex flex-col gap-1">
                    <span className="text-xs font-black uppercase tracking-[0.3em] text-white">Upload Video</span>
                    <span className="text-[9px] font-black uppercase tracking-widest text-gray-500">Max 50MB per l'analisi AI</span>
                  </div>
                </div>
                <input 
                  type="file" 
                  className="hidden" 
                  accept="video/*" 
                  onChange={e => e.target.files?.[0] && handleAnalyze(e.target.files[0])} 
                />
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
            <div className="space-y-4">
              <p className="text-4xl font-black uppercase italic tracking-tighter animate-pulse">{t.processing}</p>
              <p className="text-[10px] text-gray-500 font-black uppercase tracking-[0.4em]">Analisi gancio e ritenzione psicologica in corso...</p>
            </div>
          </div>
        )}

        {result && !loading && (
          <AnalysisView 
            result={result} 
            language={lang} 
            onReset={() => {setResult(null); setPlatform(null);}} 
          />
        )}
      </main>

      {showPricing && <PricingModal onClose={() => setShowPricing(false)} />}
      
      {/* Footer Decò */}
      <footer className="mt-auto py-12 text-[8px] text-gray-700 font-black uppercase tracking-[0.5em]">
        © SG STRATEGIC COMPANY • NO BULLSHIT POLICY • 2024-2025
      </footer>
    </div>
  );
}
