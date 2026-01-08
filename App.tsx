
import React, { useState, useEffect } from 'react';
import { Platform, AnalysisResult, Language, User } from './types.ts';
import { PLATFORMS, TRANSLATIONS } from './constants.ts';
import { analyzeVideo, generateIdea } from './services/geminiService.ts';
import { PlatformCard } from './components/PlatformCard.tsx';
import { PricingModal } from './components/PricingModal.tsx';
import { AnalysisView } from './components/AnalysisView.tsx';
import { AuthModal } from './components/AuthModal.tsx';

export default function App() {
  const [lang, setLang] = useState<Language>('IT');
  const [user, setUser] = useState<User | null>(null);
  const [mode, setMode] = useState<'VIDEO' | 'IDEA'>('VIDEO');
  const [platform, setPlatform] = useState<Platform | null>(null);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState("");
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [ideaText, setIdeaText] = useState("");
  const [ideaFile, setIdeaFile] = useState<File | null>(null);
  const [showPricing, setShowPricing] = useState(false);
  const [showAuth, setShowAuth] = useState(false);
  
  const t = TRANSLATIONS[lang] || TRANSLATIONS.IT;

  const handleAnalyzeVideo = async (file: File) => {
    if (!platform) return alert(t.errorSelectPlatform);
    setLoading(true);
    try {
      const res = await analyzeVideo(file, platform, lang, setStatus);
      setResult(res);
    } catch (e: any) {
      alert(e.message || t.genError);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateIdea = async () => {
    if (!platform) return alert(t.errorSelectPlatform);
    setLoading(true);
    setStatus(t.processing);
    try {
      const res = await generateIdea(ideaText, platform, lang, ideaFile || undefined);
      setResult(res);
    } catch (e: any) {
      alert(e.message || t.genError);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen p-4 md:p-8 flex flex-col items-center bg-[#000] text-white">
      <nav className="w-full max-w-7xl glass px-6 py-4 rounded-[20px] flex justify-between items-center mb-12 shadow-2xl border border-white/5">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center font-black bg-[#a02a11] text-white shadow-[0_0_15px_rgba(160,42,17,0.3)] text-sm">SG</div>
          <span className="font-bold text-[8px] uppercase tracking-[0.4em] hidden sm:block italic text-white/40">{t.tagline}</span>
        </div>

        <div className="flex items-center gap-6">
          <select value={lang} onChange={(e) => setLang(e.target.value as Language)} className="bg-white/5 text-[9px] font-black uppercase p-1.5 rounded-lg outline-none border border-white/10">
            <option value="IT">IT</option>
            <option value="EN">EN</option>
            <option value="FR">FR</option>
            <option value="DE">DE</option>
          </select>
          <button onClick={() => setShowPricing(true)} className="bg-white text-black px-4 py-1.5 rounded-full font-black text-[8px] uppercase hover:bg-[#a02a11] hover:text-white transition-all tracking-widest">
            {t.upgradeBtn}
          </button>
        </div>
      </nav>

      <main className="w-full max-w-5xl flex flex-col items-center">
        {!result && !loading && (
          <div className="w-full text-center space-y-12 animate-fadeIn">
            <h1 className="text-5xl md:text-7xl font-black italic uppercase tracking-tighter">
              {t.mainTitle}<span className="text-[#a02a11]">{t.mainTitleRed}</span>
            </h1>

            <div className="flex bg-white/5 p-1 rounded-2xl w-fit mx-auto border border-white/10">
              <button onClick={() => setMode('VIDEO')} className={`px-6 py-2.5 rounded-xl text-[9px] font-black uppercase transition-all ${mode === 'VIDEO' ? 'bg-[#a02a11] text-white' : 'text-gray-500'}`}>{t.modeVideo}</button>
              <button onClick={() => setMode('IDEA')} className={`px-6 py-2.5 rounded-xl text-[9px] font-black uppercase transition-all ${mode === 'IDEA' ? 'bg-[#a02a11] text-white' : 'text-gray-500'}`}>{t.modeIdea}</button>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 w-full max-w-2xl mx-auto">
              {PLATFORMS.map(p => (
                <PlatformCard key={p.id} id={p.id as Platform} label={p.label} icon={p.icon} isSelected={platform === p.id} onClick={() => setPlatform(p.id as Platform)} />
              ))}
            </div>

            <div className="w-full max-w-3xl mx-auto">
              {mode === 'VIDEO' ? (
                <label className="cursor-pointer block">
                  <div className="glass p-16 rounded-[40px] border-dashed border-2 border-white/10 flex flex-col items-center gap-6 hover:border-[#a02a11] transition-all group">
                    <div className="text-5xl group-hover:scale-110 transition-transform">🎞️</div>
                    <span className="text-lg font-black uppercase italic tracking-widest">{t.uploadLabel}</span>
                    <p className="text-[8px] text-gray-500 uppercase font-black tracking-[0.3em]">Max 15MB</p>
                  </div>
                  <input type="file" className="hidden" accept="video/*" disabled={loading} onChange={e => e.target.files?.[0] && handleAnalyzeVideo(e.target.files[0])} />
                </label>
              ) : (
                <div className="glass p-10 rounded-[40px] space-y-6 border border-white/10">
                  <textarea value={ideaText} onChange={(e) => setIdeaText(e.target.value)} placeholder={t.ideaPlaceholder} className="w-full bg-black/60 border border-white/10 rounded-2xl p-6 text-sm outline-none min-h-[120px] focus:border-[#a02a11]" />
                  <div className="flex flex-col md:flex-row gap-4">
                    <label className="flex-1 cursor-pointer">
                      <div className="h-full min-h-[80px] border border-dashed border-white/10 rounded-2xl flex items-center justify-center text-[9px] font-black uppercase text-gray-500 hover:border-[#1087a0] transition-all tracking-widest">
                        {ideaFile ? ideaFile.name : t.imageUploadLabel}
                      </div>
                      <input type="file" className="hidden" accept="image/*" onChange={(e) => e.target.files?.[0] && setIdeaFile(e.target.files[0])} />
                    </label>
                    <button onClick={handleGenerateIdea} className="md:w-1/3 py-5 rounded-2xl font-black uppercase text-xs bg-white text-black hover:bg-[#a02a11] hover:text-white transition-all shadow-xl tracking-widest">{t.ideaLabel}</button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {loading && (
          <div className="py-24 flex flex-col items-center gap-10 text-center animate-fadeIn">
            <div className="relative">
              <div className="w-20 h-20 border-2 border-[#a02a11]/20 rounded-full"></div>
              <div className="absolute top-0 w-20 h-20 border-2 border-[#a02a11] border-t-transparent rounded-full animate-spin"></div>
            </div>
            <p className="text-3xl font-black uppercase italic tracking-tighter text-gradient">{status}</p>
          </div>
        )}

        {result && !loading && (
          <AnalysisView result={result} language={lang} onReset={() => setResult(null)} />
        )}
      </main>

      {showPricing && <PricingModal onClose={() => setShowPricing(false)} language={lang} onPurchaseSuccess={() => setShowPricing(false)} />}
      {showAuth && <AuthModal language={lang} onLogin={(u) => { setUser(u); setShowAuth(false); }} onClose={() => setShowAuth(false)} />}
    </div>
  );
}
