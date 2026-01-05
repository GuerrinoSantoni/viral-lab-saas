
import React, { useState, useEffect } from 'react';
import { AnalysisResult, Language, Scene } from '../types';
import { TRANSLATIONS } from '../constants';
import { generateSceneAnalysis, translateAnalysis, translateScenes } from '../services/geminiService';

interface Props {
  result: AnalysisResult;
  videoFile?: File;
  language: Language;
  onReset: () => void;
}

export const AnalysisView: React.FC<Props> = ({ result: initialResult, videoFile, language, onReset }) => {
  const [result, setResult] = useState<AnalysisResult>(initialResult);
  const [loadingScript, setLoadingScript] = useState(false);
  const [translating, setTranslating] = useState(false);
  const [script, setScript] = useState<Scene[] | null>(null);
  const [copied, setCopied] = useState(false);
  const t = (TRANSLATIONS[language] || TRANSLATIONS.IT);

  const needsTranslation = result.lang !== language;

  const loadScript = async () => {
    setLoadingScript(true);
    try {
      const data = await generateSceneAnalysis(result.visualData, language);
      setScript(data);
    } catch (e) { 
      alert(t.errorQuota); 
    } finally { 
      setLoadingScript(false); 
    }
  };

  const handleTranslateAll = async () => {
    setTranslating(true);
    try {
      const translatedResult = await translateAnalysis(result, language);
      setResult(translatedResult);
      if (script) {
        const translatedScenes = await translateScenes(script, language);
        setScript(translatedScenes);
      }
    } catch (e) {
      alert(t.genError);
    } finally {
      setTranslating(false);
    }
  };

  if (!result || (!result.score && !result.analysis)) {
    return (
      <div className="glass p-12 rounded-[40px] text-center space-y-4 max-w-md">
        <div className="text-6xl mb-4">⚠️</div>
        <p className="text-[#a02a11] font-black uppercase tracking-widest">{t.genError}</p>
        <button onClick={onReset} className="w-full mt-4 bg-white text-black px-8 py-3 rounded-xl font-bold uppercase text-[10px] hover:bg-[#a02a11] hover:text-white transition-all">{t.back}</button>
      </div>
    );
  }

  return (
    <div className="w-full space-y-12 animate-fadeIn pb-24">
      <div className="flex justify-between items-center glass p-5 rounded-3xl">
        <button onClick={onReset} className="text-[10px] font-black uppercase tracking-widest text-gray-400 hover:text-white transition-all">{t.newAudit}</button>
        <div className="flex items-center gap-4">
          {needsTranslation && (
            <button 
              onClick={handleTranslateAll} 
              disabled={translating}
              className={`text-[10px] font-black uppercase tracking-widest px-6 py-2 rounded-full transition-all animate-pulse shadow-[0_0_15px_rgba(16,135,160,0.5)] ${translating ? 'bg-white/10 text-gray-500' : 'bg-[#1087a0] text-white hover:bg-[#0d6e82]'}`}
            >
              {translating ? t.translating : `${t.translateBtn} ${language}`}
            </button>
          )}
        </div>
      </div>

      <div className="glass p-12 rounded-[50px] flex flex-col md:flex-row items-center gap-12 shadow-2xl relative overflow-hidden border border-white/5">
        <div className="w-48 h-48 bg-gradient-to-br from-[#a02a11] to-[#1087a0] rounded-full flex flex-col items-center justify-center border-4 border-white/10 shadow-[0_0_50px_rgba(160,42,17,0.3)] shrink-0">
          <span className="text-[10px] font-black text-white/50 uppercase tracking-tighter mb-1">{t.viralScore}</span>
          <span className="text-5xl font-black text-white leading-none tracking-tighter">
            {result.score.includes('/100') ? result.score : `${result.score}/100`}
          </span>
        </div>
        <div className="flex-1 text-center md:text-left space-y-4">
          <h2 className="text-4xl md:text-6xl font-black uppercase tracking-tighter italic leading-[0.9] text-gradient">
            {result.title}
          </h2>
          <div className="flex flex-wrap gap-3 justify-center md:justify-start pt-4">
            <span className="bg-[#1087a0]/20 text-[#1087a0] px-6 py-2 rounded-full text-[10px] font-black uppercase border border-[#1087a0]/30">
              {result.platformSuggestion}
            </span>
            <span className="bg-white/5 text-gray-300 px-6 py-2 rounded-full text-[10px] font-black uppercase border border-white/5 tracking-widest">
              {result.ideaDuration}
            </span>
          </div>
        </div>
      </div>

      <div className="glass p-12 rounded-[40px] border-l-8 border-[#a02a11]">
        <h3 className="text-[12px] font-black uppercase text-[#a02a11] mb-8 tracking-[0.4em]">SENIOR EXECUTIVE ANALYSIS</h3>
        <p className="text-gray-200 italic text-xl leading-[1.8] font-medium whitespace-pre-wrap">
          {result.analysis}
        </p>
      </div>

      <div className="grid lg:grid-cols-2 gap-8">
        <div className="glass p-10 rounded-[40px] border-t-4 border-[#ffe399] flex flex-col min-h-[500px]">
          <h3 className="text-[10px] font-black uppercase text-[#ffe399] mb-8 tracking-widest">{t.contentStructure}</h3>
          <div className="flex-1 overflow-y-auto custom-scrollbar pr-4">
            <p className="text-gray-100 text-[16px] leading-[2] font-bold uppercase tracking-tight opacity-90 whitespace-pre-wrap">
              {result.visualData}
            </p>
          </div>
        </div>

        <div className="glass p-10 rounded-[40px] border-t-4 border-[#1087a0] flex flex-col min-h-[500px]">
          <div className="flex justify-between items-center mb-8">
            <h3 className="text-[10px] font-black uppercase text-[#1087a0] tracking-widest">{t.copywritingTitle}</h3>
            <button 
              onClick={() => { navigator.clipboard.writeText(result.caption || ""); setCopied(true); setTimeout(() => setCopied(false), 2000); }}
              className={`text-[9px] font-black uppercase px-6 py-2 rounded-full transition-all ${copied ? 'bg-green-500 text-white' : 'bg-white text-black hover:bg-[#a02a11] hover:text-white'}`}
            >
              {copied ? t.copied : t.copyBtn}
            </button>
          </div>
          <div className="flex-1 overflow-y-auto custom-scrollbar pr-4">
            <p className="text-gray-200 text-lg leading-[1.9] whitespace-pre-wrap italic font-serif">
              {result.caption}
            </p>
            <div className="mt-12 pt-8 border-t border-white/5 flex flex-wrap gap-3">
              {Array.isArray(result.hashtags) && result.hashtags.map((tag, i) => (
                <span key={i} className="text-[#1087a0] text-[11px] font-black uppercase tracking-tighter bg-[#1087a0]/5 px-3 py-1 rounded-md">#{tag.replace('#', '')}</span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {!script ? (
        <div className="glass p-20 rounded-[60px] text-center space-y-8 border border-white/5 shadow-inner bg-gradient-to-b from-white/[0.02] to-transparent">
          <div className="text-7xl animate-pulse">🎬</div>
          <h3 className="text-5xl font-black uppercase tracking-tighter italic">{t.techStoryboard}</h3>
          <p className="text-gray-400 text-sm max-w-md mx-auto uppercase font-bold tracking-widest leading-loose">Sblocca il piano di produzione cinematografico completo con indicazioni per camera, luci e audio SFX.</p>
          <button 
            onClick={loadScript} 
            disabled={loadingScript} 
            className="bg-[#a02a11] text-white px-16 py-6 rounded-2xl font-black uppercase text-sm tracking-widest hover:scale-105 transition-all shadow-[0_0_40px_rgba(160,42,17,0.5)] disabled:opacity-50"
          >
            {loadingScript ? t.loadingStoryboard : t.unlockStoryboard}
          </button>
        </div>
      ) : (
        <div className="space-y-24">
          <div className="text-center space-y-4">
            <h3 className="text-6xl font-black uppercase tracking-tighter italic leading-none">{t.techStoryboard}</h3>
            <p className="text-[#1087a0] font-black text-[12px] uppercase tracking-[0.5em]">Senior Master Storyboard • Cinematic Standard</p>
          </div>
          {script.map((s, i) => (
            <div key={i} className="glass p-12 md:p-16 rounded-[60px] border border-white/5 hover:border-[#a02a11]/30 transition-all group relative overflow-hidden bg-gradient-to-br from-white/[0.01] to-transparent">
              <div className="absolute top-0 right-0 p-12 opacity-[0.03] text-[15rem] font-black italic select-none pointer-events-none">0{s.scene}</div>
              <div className="flex items-center gap-6 mb-16 relative z-10">
                <div className="bg-[#a02a11] text-white px-10 py-4 rounded-2xl font-black text-2xl shadow-2xl tracking-tighter">{t.scene} {s.scene}</div>
                <div className="h-px flex-1 bg-gradient-to-r from-[#a02a11] to-transparent opacity-30"></div>
                <div className="bg-white/5 px-8 py-3 rounded-full border border-white/10 flex items-center gap-3">
                  <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>
                  <span className="text-[12px] font-black text-gray-300 uppercase tracking-widest">{s.duration}</span>
                </div>
              </div>

              <div className="grid lg:grid-cols-5 gap-16 relative z-10">
                <div className="lg:col-span-3 space-y-8">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-xl">📽️</div>
                    <span className="text-[12px] font-black text-[#ffe399] uppercase tracking-[0.3em]">{t.visionaryTitle}</span>
                  </div>
                  <div className="bg-black/40 p-10 rounded-[40px] border border-white/10 shadow-inner">
                    <p className="text-gray-100 text-[17px] leading-[2.1] font-medium whitespace-pre-wrap first-letter:text-5xl first-letter:font-black first-letter:text-[#a02a11] first-letter:mr-3 first-letter:float-left">
                      {s.description}
                    </p>
                  </div>
                </div>

                <div className="lg:col-span-2 space-y-8">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-[#1087a0]/10 flex items-center justify-center text-xl">🔊</div>
                    <span className="text-[12px] font-black text-[#1087a0] uppercase tracking-[0.3em]">{t.audioStrategy}</span>
                  </div>
                  <div className="bg-[#1087a0]/5 p-10 rounded-[40px] border border-[#1087a0]/10 h-full shadow-inner">
                    <p className="text-gray-300 text-[15px] leading-[2] font-medium italic border-l-4 border-[#1087a0] pl-8">
                      {s.audioSFX}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          ))}
          <div className="flex justify-center pt-12">
             <button onClick={() => setScript(null)} className="bg-white/5 text-gray-500 px-12 py-5 rounded-full text-[11px] font-black uppercase tracking-[0.3em] hover:text-white transition-all border border-white/5 hover:border-white/20">{t.closeStoryboard}</button>
          </div>
        </div>
      )}
    </div>
  );
};
