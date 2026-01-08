
import React, { useState } from 'react';
import { AnalysisResult, Language, Scene } from '../types.ts';
import { TRANSLATIONS } from '../constants.ts';
import { generateSceneAnalysis, translateAnalysis, translateScenes } from '../services/geminiService.ts';

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

  const getCleanScore = (rawScore: string) => {
    const match = rawScore.match(/(\d+(\.\d+)?)/);
    return match ? match[0] : "85";
  };

  const loadScript = async () => {
    setLoadingScript(true);
    try {
      const data = await generateSceneAnalysis(result, language);
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

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
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
      {/* Header Navigation */}
      <div className="flex justify-between items-center glass p-5 rounded-3xl">
        <button onClick={onReset} className="text-[10px] font-black uppercase tracking-widest text-gray-400 hover:text-white transition-all">
          {t.newAudit}
        </button>
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

      {/* Hero Section: Score & Title */}
      <div className="glass p-12 rounded-[50px] flex flex-col md:flex-row items-center gap-12 shadow-2xl relative overflow-hidden border border-white/5">
        <div className="w-48 h-48 bg-gradient-to-br from-[#a02a11] to-[#1087a0] rounded-full flex flex-col items-center justify-center border-4 border-white/10 shadow-[0_0_50px_rgba(160,42,17,0.3)] shrink-0">
          <span className="text-[10px] font-black text-white/50 uppercase tracking-tighter mb-1">{t.viralScore}</span>
          <span className="text-5xl font-black text-white leading-none tracking-tighter">
            {getCleanScore(result.score)}/100
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

      {/* Executive Analysis */}
      <div className="glass p-12 rounded-[40px] border-l-8 border-[#a02a11]">
        <h3 className="text-[12px] font-black uppercase text-[#a02a11] mb-8 tracking-[0.4em]">SENIOR EXECUTIVE ANALYSIS</h3>
        <p className="text-gray-200 italic text-xl leading-[1.8] font-medium whitespace-pre-wrap">
          {result.analysis}
        </p>
      </div>

      {/* Copywriting & Visual Data Grid */}
      <div className="grid lg:grid-cols-2 gap-8">
        {/* Caption/Copywriting */}
        <div className="glass p-10 rounded-[40px] border-t-4 border-[#ffe399]/20 flex flex-col">
          <div className="flex justify-between items-center mb-8">
            <h3 className="text-[10px] font-black uppercase text-[#ffe399] tracking-widest">{t.copywritingTitle}</h3>
            <button 
              onClick={() => copyToClipboard(result.caption)} 
              className="text-[9px] font-black uppercase px-4 py-2 bg-white/5 rounded-lg hover:bg-white hover:text-black transition-all"
            >
              {copied ? t.copied : t.copyBtn}
            </button>
          </div>
          <div className="bg-black/40 p-8 rounded-3xl border border-white/5 flex-1">
            <p className="text-sm leading-relaxed text-gray-300 italic mb-6">"{result.caption}"</p>
            <div className="flex flex-wrap gap-2">
              {result.hashtags.map((h, i) => (
                <span key={i} className="text-[#ffe399] font-black text-[10px]">{h}</span>
              ))}
            </div>
          </div>
        </div>

        {/* Visual Strategy */}
        <div className="glass p-10 rounded-[40px] border-t-4 border-[#1087a0]/20">
          <h3 className="text-[10px] font-black uppercase text-[#1087a0] mb-8 tracking-widest">{t.contentStructure}</h3>
          <div className="space-y-6">
            <div className="flex gap-4">
              <div className="text-2xl">👁️</div>
              <div>
                <p className="text-[10px] font-black text-white/40 uppercase mb-1">{t.visionaryTitle}</p>
                <p className="text-sm text-gray-300 leading-relaxed">{result.visualData}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Storyboard Section */}
      <div className="w-full flex flex-col items-center pt-8">
        {!script ? (
          <button 
            onClick={loadScript}
            disabled={loadingScript}
            className={`
              px-12 py-6 rounded-[30px] font-black uppercase text-sm tracking-[0.3em] transition-all shadow-2xl
              ${loadingScript 
                ? 'bg-white/10 text-gray-500 cursor-not-allowed' 
                : 'bg-[#a02a11] text-white hover:scale-105 hover:shadow-[0_0_50px_rgba(160,42,17,0.4)]'}
            `}
          >
            {loadingScript ? t.loadingStoryboard : t.unlockStoryboard}
          </button>
        ) : (
          <div className="w-full space-y-12 animate-fadeIn">
            <div className="flex justify-between items-center border-b border-white/10 pb-6">
              <h3 className="text-3xl font-black uppercase italic tracking-tighter text-gradient">{t.techStoryboard}</h3>
              <button onClick={() => setScript(null)} className="text-[10px] font-black uppercase text-red-500 hover:underline">{t.closeStoryboard}</button>
            </div>
            
            <div className="grid gap-12">
              {script.map((s, idx) => (
                <div key={idx} className="glass p-10 rounded-[40px] border border-white/5 relative overflow-hidden group">
                  <div className="absolute top-0 left-0 w-1 h-full bg-[#a02a11] group-hover:w-2 transition-all"></div>
                  <div className="flex flex-col gap-10">
                    <div className="flex justify-between items-center border-b border-white/5 pb-4">
                      <span className="text-[12px] font-black text-[#a02a11] uppercase tracking-[0.3em]">{t.scene} {s.scene}</span>
                      <span className="text-3xl font-black italic text-white/80">{s.duration}</span>
                    </div>
                    
                    <div className="grid lg:grid-cols-2 gap-10">
                      <div className="space-y-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-sm">🎥</div>
                          <h4 className="text-[10px] font-black text-[#ffe399] uppercase tracking-[0.2em]">{t.visionaryTitle}</h4>
                        </div>
                        <div className="bg-white/[0.02] p-8 rounded-3xl border border-white/5">
                          <p className="text-gray-200 text-lg leading-relaxed whitespace-pre-wrap font-medium">
                            {s.description}
                          </p>
                        </div>
                      </div>

                      <div className="space-y-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-sm">🔊</div>
                          <h4 className="text-[10px] font-black text-[#1087a0] uppercase tracking-[0.2em]">{t.audioStrategy}</h4>
                        </div>
                        <div className="bg-white/[0.02] p-8 rounded-3xl border border-white/5">
                          <p className="text-gray-300 text-lg leading-relaxed whitespace-pre-wrap italic">
                            {s.audioSFX}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
