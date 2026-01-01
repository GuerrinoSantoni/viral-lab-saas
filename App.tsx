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
    if (window.location.hash === '#guerrino-admin') {
      setOwnerMode(true);
    }
  }, []);

  const handleAnalyze = async (file: File) => {
    if (!platform) return;
    if (!ownerMode && credits <= 0) {
      setShowPricing(true);
      return;
    }
    
    setLoading(true);
    try {
      const res = await analyzeVideo(file, platform, lang);
      setResult(res);
      if (!ownerMode) {
        setCredits(prev => prev - 1);
      }
    } catch (e: any) {
      console.error(e);
      alert("AZIONE NON RIUSCITA: Errore di comunicazione con l'AI. Verifica la tua API KEY.");
    } finally {
      setLoading(false);
    }
  };

  const t = (TRANSLATIONS[lang] || TRANSLATIONS.IT) as any;

  return (
    <div className="min-h-screen p-6 md:p-12 flex flex-col items-center max-w-6xl mx-auto">
      <nav className="w-full glass p-6 rounded-[30px] flex justify-between items-center mb-12 sticky top-4 z-50">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-[#a02a11] rounded-lg flex items-center justify-center font-black">SG</div>
          <span className="font-black text-xs uppercase hidden sm:block">Master Authority</span>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-[10px] font-black uppercase tracking-widest text-white/70">
            {t.credits}: <span className="text-[#a02a11] font-bold">{ownerMode ? '∞' : credits}</span>
          </div>
          <button 
            onClick={() => setShowPricing(true)} 
            className="bg-[#a02a11] px-5 py-2.5 rounded-xl font-black text-[9px] uppercase tracking-widest hover:brightness-125 transition-all shadow-lg text-white"
          >
            {t.upgrade}
          </button>
        </div>
      </nav>

      {!result && !loading && (
        <div className="w-full text-center space-y-16 animate-fadeIn">
          <div className="space-y-4">
             <p className="text-[#1087a0] text-[10px] font-black uppercase tracking-[0.5em]">{t.tagline}</p>
             <h1 className="text-6xl md:text-8xl font-black italic uppercase tracking-tighter leading-none text-white">
               STRATEGIC.<span className="text-[#a02a11]">AUDIT</span>
             </h1>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-4xl mx-auto">
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

          {platform && (
            <div className="animate-fadeIn">
              <label className="inline-block glass p-16 rounded-[60px] border-2 border-dashed border-[#a02a11]/40 cursor-pointer hover:bg-white/5 hover:border-[#a02a11] transition-all group">
                <div className="flex flex-col items-center gap-4">
                  <div className="text-4xl group-hover:scale-110 transition-transform">📤</div>
                  <span className="text-xs font-black uppercase tracking-widest text-white">{t.newAudit} - CARICA VIDEO</span>
                </div>
                <input 
                  type="file" 
                  className="hidden" 
                  accept="video/*" 
                  onChange={e => e.target.files?.[0] && handleAnalyze(e.target.files[0])} 
                />
              </label>
              <p className="mt-6 text-[9px] text-gray-500 font-black uppercase tracking-widest">Formati supportati: MP4, MOV, WebM</p>
            </div>
          )}
        </div>
      )}

      {loading && (
        <div className="py-32 text-center animate-pulse space-y-8">
           <div className="w-20 h-20 border-4 border-[#a02a11] border-t-transparent rounded-full animate-spin mx-auto"></div>
           <p className="font-black text-2xl uppercase italic tracking-tighter text-white/80">{t.processing}</p>
        </div>
      )}

      {result && !loading && (
        <AnalysisView 
          result={result} 
          language={lang} 
          onReset={() => {setResult(null); setPlatform(null);}} 
        />
      )}

      {showPricing && <PricingModal onClose={() => setShowPricing(false)} />}
    </div>
  );
}