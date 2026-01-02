
import { useState, useEffect } from 'react';
import { Platform, AnalysisResult, Language } from './types';
import { PLATFORMS, TRANSLATIONS } from './constants';
import { analyzeVideo, generateIdea } from './services/geminiService';
import { PlatformCard } from './components/PlatformCard';
import { PricingModal } from './components/PricingModal';
import { AnalysisView } from './components/AnalysisView';

const MAX_FILE_SIZE_MB = 15;
const INITIAL_FREE_CREDITS = 3;
const LANGUAGES: Language[] = ['IT', 'EN', 'DE', 'FR'];

export default function App() {
  const [lang, setLang] = useState<Language>(() => {
    const saved = localStorage.getItem('sg_lang');
    return (saved as Language) || 'IT';
  });
  const [mode, setMode] = useState<'VIDEO' | 'IDEA'>('VIDEO');
  const [platform, setPlatform] = useState<Platform | null>(null);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState("");
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [lastFile, setLastFile] = useState<File | null>(null);
  const [ideaText, setIdeaText] = useState("");
  const [ideaFile, setIdeaFile] = useState<File | null>(null);
  const [showPricing, setShowPricing] = useState(false);
  
  const [credits, setCredits] = useState<number>(() => {
    const saved = localStorage.getItem('sg_credits');
    return saved !== null ? parseInt(saved) : INITIAL_FREE_CREDITS;
  });
  const [isMaster, setIsMaster] = useState(() => localStorage.getItem('sg_master') === 'true');
  const [clickCount, setClickCount] = useState(0);

  const t = TRANSLATIONS[lang];

  useEffect(() => {
    localStorage.setItem('sg_credits', credits.toString());
  }, [credits]);

  useEffect(() => {
    localStorage.setItem('sg_master', isMaster.toString());
  }, [isMaster]);

  useEffect(() => {
    localStorage.setItem('sg_lang', lang);
  }, [lang]);

  const handleLogoClick = () => {
    const newCount = clickCount + 1;
    setClickCount(newCount);
    if (newCount === 5) {
      setIsMaster(!isMaster);
      setClickCount(0);
      alert(isMaster ? "MASTER MODE DISATTIVATA" : "MASTER MODE ATTIVATA: CREDITI ILLIMITATI");
    }
    setTimeout(() => setClickCount(0), 2000);
  };

  const handleError = (e: any) => {
    console.error("Master Debug:", e);
    const msg = e.message || "";
    if (msg.includes("RESOURCE_EXHAUSTED") || msg.includes("429") || msg.includes("quota")) {
      alert(t.errorQuota);
    } else if (msg.includes("500") || msg.includes("Internal")) {
      alert(t.errorServer);
    } else {
      alert(`${t.errorGeneric} (${msg})`);
    }
  };

  const handleAnalyzeVideo = async (file: File) => {
    if (!platform) return alert(lang === 'IT' ? "Seleziona una piattaforma." : "Select a platform.");
    if (!isMaster && credits <= 0) return setShowPricing(true);
    if (file.size > MAX_FILE_SIZE_MB * 1024 * 1024) return alert(`Max ${MAX_FILE_SIZE_MB}MB.`);
    
    setLoading(true);
    setStatus(t.encoding);
    setLastFile(file);
    try {
      const res = await analyzeVideo(file, platform, lang, (step) => {
        setStatus(t.processing);
      });
      setResult(res);
      if (!isMaster) setCredits(prev => Math.max(0, prev - 1));
    } catch (e: any) {
      handleError(e);
    } finally {
      setLoading(false);
      setStatus("");
    }
  };

  const handleGenerateIdea = async () => {
    if (!platform) return alert(lang === 'IT' ? "Seleziona una piattaforma." : "Select a platform.");
    if (!isMaster && credits <= 0) return setShowPricing(true);
    if (!ideaText.trim() && !ideaFile) return alert(lang === 'IT' ? "Scrivi un'idea o carica un'immagine!" : "Write an idea or upload an image!");
    
    setLoading(true);
    setStatus(t.processing);
    try {
      const res = await generateIdea(ideaText, platform, lang, ideaFile || undefined);
      setResult(res);
      if (!isMaster) setCredits(prev => Math.max(0, prev - 1));
    } catch (e: any) {
      handleError(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen p-4 md:p-8 flex flex-col items-center bg-[#000] text-white">
      <nav className="w-full max-w-7xl glass px-8 py-5 rounded-[30px] flex justify-between items-center mb-12 shadow-2xl premium-border">
        <div className="flex items-center gap-4 cursor-pointer select-none" onClick={handleLogoClick}>
          <div className={`w-10 h-10 rounded-lg flex items-center justify-center font-black transition-all ${isMaster ? 'bg-yellow-500 shadow-[0_0_20px_#eab308]' : 'bg-[#a02a11] shadow-[0_0_15px_#a02a11]'}`}>SG</div>
          <div className="flex flex-col">
            <span className="font-black text-[10px] uppercase tracking-[0.3em] hidden sm:block italic">{t.tagline}</span>
            {isMaster && <span className="text-[8px] font-black text-yellow-500 tracking-widest uppercase">MASTER UNLIMITED</span>}
          </div>
        </div>

        <div className="flex items-center gap-8">
          <div className="hidden md:flex gap-3 bg-white/5 p-1 rounded-full border border-white/10">
            {LANGUAGES.map(l => (
              <button 
                key={l} 
                onClick={() => setLang(l)}
                className={`w-8 h-8 rounded-full text-[9px] font-black transition-all ${lang === l ? 'bg-[#a02a11] text-white' : 'text-gray-500 hover:text-white'}`}
              >
                {l}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-6">
            <div className="flex flex-col items-end">
              <span className={`text-[10px] font-black uppercase tracking-widest ${credits === 0 && !isMaster ? 'text-red-500' : 'text-gray-400'}`}>
                {t.creditsLabel}: {isMaster ? '∞' : credits}
              </span>
            </div>
            <button onClick={() => setShowPricing(true)} className="bg-white text-black px-6 py-2 rounded-full font-black text-[9px] uppercase hover:bg-[#a02a11] hover:text-white transition-all">{t.upgradeBtn}</button>
          </div>
        </div>
      </nav>

      <main className="w-full max-w-5xl flex flex-col items-center">
        {!result && !loading && (
          <div className="w-full text-center space-y-12 animate-fadeIn">
            <h1 className="text-6xl md:text-8xl font-black italic uppercase tracking-tighter">
              {t.mainTitle}<span className="text-[#a02a11]">{t.mainTitleRed}</span>
            </h1>

            <div className="flex bg-white/5 p-1 rounded-2xl w-fit mx-auto border border-white/10">
              <button onClick={() => setMode('VIDEO')} className={`px-8 py-3 rounded-xl text-[10px] font-black uppercase transition-all ${mode === 'VIDEO' ? 'bg-[#a02a11] text-white' : 'text-gray-500'}`}>{t.modeVideo}</button>
              <button onClick={() => setMode('IDEA')} className={`px-8 py-3 rounded-xl text-[10px] font-black uppercase transition-all ${mode === 'IDEA' ? 'bg-[#a02a11] text-white' : 'text-gray-500'}`}>{t.modeIdea}</button>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 w-full max-w-3xl mx-auto">
              {PLATFORMS.map(p => (
                <PlatformCard key={p.id} id={p.id as Platform} label={p.label} icon={p.icon} isSelected={platform === p.id} onClick={() => setPlatform(p.id as Platform)} />
              ))}
            </div>

            <div className="w-full max-w-3xl mx-auto">
              {mode === 'VIDEO' ? (
                <label className="cursor-pointer block">
                  <div className="glass p-16 rounded-[40px] border-dashed border-2 border-white/10 flex flex-col items-center gap-6 hover:border-[#a02a11] transition-all group">
                    <div className="text-6xl group-hover:scale-125 transition-transform">🎞️</div>
                    <span className="text-xl font-black uppercase italic">{t.uploadLabel}</span>
                  </div>
                  <input type="file" className="hidden" accept="video/*" disabled={!platform || loading} onChange={e => e.target.files?.[0] && handleAnalyzeVideo(e.target.files[0])} />
                </label>
              ) : (
                <div className="glass p-10 rounded-[40px] space-y-6 border border-white/10 shadow-2xl bg-gradient-to-br from-white/[0.02] to-transparent">
                  <textarea 
                    value={ideaText}
                    onChange={(e) => setIdeaText(e.target.value)}
                    placeholder={t.ideaPlaceholder}
                    className="w-full bg-black/60 border border-white/10 rounded-2xl p-6 text-sm outline-none min-h-[120px] focus:border-[#a02a11] transition-all text-white font-medium"
                  />
                  
                  <div className="flex flex-col md:flex-row gap-4">
                    <label className="flex-1 cursor-pointer">
                      <div className={`h-full min-h-[80px] border-2 border-dashed rounded-2xl flex items-center justify-center gap-4 transition-all ${ideaFile ? 'border-green-500/50 bg-green-500/5' : 'border-white/10 hover:border-[#1087a0]'}`}>
                        {ideaFile ? (
                          <div className="flex items-center gap-4 p-4 w-full">
                            <img src={URL.createObjectURL(ideaFile)} alt="preview" className="w-12 h-12 rounded object-cover" />
                            <span className="text-[10px] font-black uppercase truncate flex-1">{ideaFile.name}</span>
                            <button onClick={(e) => { e.preventDefault(); setIdeaFile(null); }} className="text-red-500 font-black text-[10px] uppercase">{t.removeImage}</button>
                          </div>
                        ) : (
                          <div className="flex items-center gap-3">
                            <span className="text-2xl">🖼️</span>
                            <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">{t.imageUploadLabel}</span>
                          </div>
                        )}
                      </div>
                      <input type="file" className="hidden" accept="image/*" onChange={(e) => e.target.files?.[0] && setIdeaFile(e.target.files[0])} />
                    </label>

                    <button 
                      onClick={handleGenerateIdea} 
                      disabled={loading}
                      className="md:w-1/3 py-5 rounded-2xl font-black uppercase text-xs bg-white text-black hover:bg-[#a02a11] hover:text-white transition-all shadow-xl"
                    >
                      {t.ideaLabel}
                    </button>
                  </div>
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
      {showPricing && <PricingModal onClose={() => setShowPricing(false)} language={lang} />}
    </div>
  );
}
