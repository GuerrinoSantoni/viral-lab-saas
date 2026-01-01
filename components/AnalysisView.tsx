
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
      alert("Errore tecnico nell'elaborazione delle scene."); 
    } finally { 
      setLoadingScript(false); 
    }
  };

  return (
    <div className="w-full space-y-12 animate-fadeIn pb-24">
      <div className="flex justify-between items-center glass p-5 rounded-3xl">
        <button onClick={onReset} className="text-[10px] font-black uppercase tracking-widest text-gray-400 hover:text-white transition-all">← {t.newAudit}</button>
        <div className="text-[10px] font-black text-[#1087a0] uppercase tracking-widest">MASTER REPORT • SENIOR AUDIT</div>
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

      <div className="grid lg:grid-cols-3 gap-8">
        <div className="glass p-8 rounded-[40px] border-t-4 border-[#a02a11]">
          <h3 className="text-[10px] font-black uppercase text-[#a02a11] mb-6 tracking-widest">{t.seniorInsight}</h3>
          <p className="text-gray-300 italic text-sm leading-relaxed font-medium">"{result.analysis}"</p>
        </div>
        
        <div className="glass p-8 rounded-[40px] border-t-4 border-[#ffe399]">
          <h3 className="text-[10px] font-black uppercase text-[#ffe399] mb-6 tracking-widest">STRATEGIA VISIVA</h3>
          <p className="text-gray-200 text-sm leading-relaxed font-bold uppercase tracking-tight">{result.visualData}</p>
        </div>

        <div className="glass p-8 rounded-[40px] border-t-4 border-[#1087a0]">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-[10px] font-black uppercase text-[#1087a0] tracking-widest">{t.strategicCopy}</h3>
            <button 
              onClick={() => { navigator.clipboard.writeText(result.caption); setCopied(true); setTimeout(() => setCopied(false), 2000); }}
              className={`text-[8px] font-black uppercase px-3 py-1 rounded transition-all ${copied ? 'bg-green-500 text-white' : 'bg-white text-black'}`}
            >
              {copied ? 'OK' : 'COPY'}
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
        <div className="glass p-16 rounded-[60px] text-center space-y-8 border border-white/5 shadow-inner">
          <div className="text-6xl opacity-50">🎬</div>
          <h3 className="text-4xl font-black uppercase tracking-tighter italic">{t.scriptTitle}</h3>
          <p className="text-gray-500 text-[10px] uppercase tracking-widest">Genera uno storyboard tecnico basato sulla strategia senior</p>
          <button 
            onClick={loadScript} 
            disabled={loadingScript} 
            className="bg-white text-black px-12 py-5 rounded-2xl font-black uppercase text-xs tracking-widest hover:bg-[#a02a11] hover:text-white transition-all shadow-2xl disabled:opacity-50"
          >
            {loadingScript ? "ANALISI TECNICA IN CORSO..." : t.scriptBtn}
          </button>
        </div>
      ) : (
        <div className="space-y-10">
          <h3 className="text-3xl font-black text-center uppercase tracking-tighter italic mb-12">{t.scriptTitle}</h3>
          {script.map((s, i) => (
            <div key={i} className="glass p-10 rounded-[40px] border border-white/5 hover:bg-white/[0.02] transition-all">
              <div className="flex items-center gap-6 mb-8">
                <div className="w-12 h-12 bg-[#a02a11] rounded-xl flex items-center justify-center font-black text-xl shadow-lg">{s.scene}</div>
                <div className="h-px flex-1 bg-white/10"></div>
                <span className="text-[10px] font-black text-[#1087a0] uppercase tracking-widest">{s.duration}</span>
              </div>
              <div className="grid md:grid-cols-3 gap-10">
                <div className="md:col-span-2 space-y-4">
                  <span className="text-[8px] font-black text-gray-500 uppercase tracking-widest">Descrizione Visiva</span>
                  <p className="text-gray-200 text-sm font-medium leading-relaxed">{s.description}</p>
                </div>
                <div className="space-y-4">
                  <span className="text-[8px] font-black text-[#ffe399] uppercase tracking-widest">Audio & SFX</span>
                  <p className="text-[#ffe399] italic text-xs font-bold leading-relaxed uppercase">{s.audioSFX}</p>
                </div>
              </div>
            </div>
          ))}
          <div className="flex justify-center pt-8">
             <button onClick={() => setScript(null)} className="text-[10px] font-black uppercase text-gray-500 hover:text-white transition-all">Chiudi Storyboard</button>
          </div>
        </div>
      )}
    </div>
  );
};
