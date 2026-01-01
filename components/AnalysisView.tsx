
import React, { useState } from 'react';
import { AnalysisResult, Language, Scene } from '../types';
import { TRANSLATIONS } from '../constants';
import { generateSceneAnalysis } from '../services/geminiService';

interface Props {
  result: AnalysisResult;
  videoFile?: File;
  language: Language;
  onReset: () => void;
}

export const AnalysisView: React.FC<Props> = ({ result, videoFile, language, onReset }) => {
  const [loadingScript, setLoadingScript] = useState(false);
  const [script, setScript] = useState<Scene[] | null>(null);
  const [copied, setCopied] = useState(false);
  const t = (TRANSLATIONS[language] || TRANSLATIONS.IT) as any;

  const loadScript = async () => {
    setLoadingScript(true);
    try {
      const data = await generateSceneAnalysis(result.visualData, language, videoFile);
      setScript(data);
    } catch (e) { 
      alert("Il Master ha generato un'analisi così massiccia che il parser ha avuto un singhiozzo. Riprova."); 
    } finally { 
      setLoadingScript(false); 
    }
  };

  return (
    <div className="w-full space-y-12 animate-fadeIn pb-24">
      <div className="flex justify-between items-center glass p-5 rounded-3xl">
        <button onClick={onReset} className="text-[10px] font-black uppercase tracking-widest text-gray-400 hover:text-white transition-all">← {t.newAudit}</button>
        <div className="text-[10px] font-black text-[#1087a0] uppercase tracking-widest">MASTER REPORT • SENIOR AUTHORITY</div>
      </div>

      <div className="glass p-12 rounded-[50px] flex flex-col md:flex-row items-center gap-12 shadow-2xl relative overflow-hidden border border-white/5">
        <div className="w-44 h-44 bg-gradient-to-br from-[#a02a11] to-[#1087a0] rounded-full flex flex-col items-center justify-center border-4 border-white/10 shadow-2xl shrink-0">
          <span className="text-[10px] font-black text-white/50 uppercase tracking-tighter">{t.viralScore}</span>
          <span className="text-7xl font-black text-white leading-none">{result.score}</span>
        </div>
        <div className="flex-1 text-center md:text-left space-y-4">
          <h2 className="text-4xl md:text-6xl font-black uppercase tracking-tighter italic leading-none">{result.title}</h2>
          <div className="flex flex-wrap gap-3 justify-center md:justify-start pt-2">
            <span className="bg-[#1087a0]/20 text-[#1087a0] px-6 py-2 rounded-full text-[10px] font-black uppercase border border-[#1087a0]/30">{result.platformSuggestion}</span>
            <span className="bg-white/5 text-gray-400 px-6 py-2 rounded-full text-[10px] font-black uppercase border border-white/5">{result.ideaDuration}</span>
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-1 gap-8">
        <div className="glass p-10 rounded-[40px] border-l-8 border-[#a02a11]">
          <h3 className="text-[12px] font-black uppercase text-[#a02a11] mb-6 tracking-widest">{t.seniorInsight}</h3>
          <p className="text-gray-200 italic text-lg leading-relaxed font-medium whitespace-pre-wrap">{result.analysis}</p>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-8">
        <div className="glass p-8 rounded-[40px] border-t-4 border-[#ffe399]">
          <h3 className="text-[10px] font-black uppercase text-[#ffe399] mb-6 tracking-widest">CORE STRATEGY</h3>
          <p className="text-gray-200 text-sm leading-relaxed font-bold uppercase tracking-tight">{result.visualData}</p>
        </div>

        <div className="glass p-8 rounded-[40px] border-t-4 border-[#1087a0]">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-[10px] font-black uppercase text-[#1087a0] tracking-widest">{t.strategicCopy}</h3>
            <button 
              onClick={() => { navigator.clipboard.writeText(result.caption); setCopied(true); setTimeout(() => setCopied(false), 2000); }}
              className={`text-[8px] font-black uppercase px-3 py-1 rounded transition-all ${copied ? 'bg-green-500 text-white' : 'bg-white text-black'}`}
            >
              {copied ? 'COPIATO' : 'COPIA'}
            </button>
          </div>
          <div className="max-h-96 overflow-y-auto pr-2 custom-scrollbar">
            <p className="text-gray-200 text-xs leading-relaxed whitespace-pre-wrap">{result.caption}</p>
            <div className="mt-6 flex flex-wrap gap-2">
              {result.hashtags.map((tag, i) => (
                <span key={i} className="text-[#1087a0] text-[10px] font-black uppercase">{tag}</span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {!script ? (
        <div className="glass p-20 rounded-[60px] text-center space-y-8 border border-white/5 shadow-inner bg-gradient-to-b from-white/[0.02] to-transparent">
          <div className="text-7xl animate-pulse">🎥</div>
          <h3 className="text-5xl font-black uppercase tracking-tighter italic">{t.scriptTitle}</h3>
          <p className="text-gray-500 text-xs uppercase tracking-[0.3em]">Genera 5-10 scene con descrizioni da 100+ parole ciascuna</p>
          <button 
            onClick={loadScript} 
            disabled={loadingScript} 
            className="bg-[#a02a11] text-white px-16 py-6 rounded-2xl font-black uppercase text-sm tracking-widest hover:scale-105 transition-all shadow-[0_0_30px_rgba(160,42,17,0.4)] disabled:opacity-50"
          >
            {loadingScript ? "PROCESSO CREATIVO SENIOR IN CORSO..." : "SBLOCCA STORYBOARD TECNICO"}
          </button>
        </div>
      ) : (
        <div className="space-y-16">
          <div className="text-center space-y-4">
            <h3 className="text-5xl font-black uppercase tracking-tighter italic leading-none">{t.scriptTitle}</h3>
            <p className="text-[#1087a0] font-black text-[10px] uppercase tracking-[0.5em]">Deep Audit Storyboard • {script.length} Scene</p>
          </div>
          {script.map((s, i) => (
            <div key={i} className="glass p-12 rounded-[50px] border border-white/5 hover:border-[#a02a11]/30 transition-all group relative overflow-hidden">
              <div className="absolute top-0 right-0 p-8 opacity-10 text-8xl font-black italic select-none group-hover:opacity-20 transition-opacity">0{s.scene}</div>
              <div className="flex items-center gap-6 mb-12 relative z-10">
                <div className="w-16 h-16 bg-[#a02a11] rounded-2xl flex items-center justify-center font-black text-2xl shadow-xl">SCENA {s.scene}</div>
                <div className="h-px flex-1 bg-gradient-to-r from-[#a02a11] to-transparent"></div>
                <div className="bg-white/5 px-6 py-2 rounded-full border border-white/10">
                  <span className="text-[10px] font-black text-[#1087a0] uppercase tracking-widest">{s.duration}</span>
                </div>
              </div>
              <div className="grid lg:grid-cols-2 gap-12 relative z-10">
                <div className="space-y-6 bg-white/[0.02] p-8 rounded-3xl border border-white/5">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">📽️</span>
                    <span className="text-[10px] font-black text-white uppercase tracking-[0.3em]">Descrizione Visiva (Senior Deep Analysis)</span>
                  </div>
                  <p className="text-gray-300 text-[15px] leading-[1.8] font-medium whitespace-pre-wrap border-l-2 border-[#a02a11] pl-6 italic">
                    {s.description}
                  </p>
                </div>
                <div className="space-y-6 bg-[#1087a0]/5 p-8 rounded-3xl border border-[#1087a0]/10">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">🎙️</span>
                    <span className="text-[10px] font-black text-[#1087a0] uppercase tracking-[0.3em]">Sound Design & Audio Script</span>
                  </div>
                  <p className="text-gray-300 text-[15px] leading-[1.8] font-medium whitespace-pre-wrap border-l-2 border-[#1087a0] pl-6">
                    {s.audioSFX}
                  </p>
                </div>
              </div>
            </div>
          ))}
          <div className="flex justify-center pt-12">
             <button onClick={() => setScript(null)} className="bg-white/5 text-gray-500 px-10 py-4 rounded-full text-[10px] font-black uppercase tracking-widest hover:text-white transition-all border border-white/5">Chiudi Storyboard</button>
          </div>
        </div>
      )}
    </div>
  );
};
