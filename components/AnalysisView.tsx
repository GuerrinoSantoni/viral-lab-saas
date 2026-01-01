
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
    if (!videoFile) return alert("File video mancante.");
    setLoadingScript(true);
    try {
      const data = await generateSceneAnalysis(result.visualData, language, videoFile);
      setScript(data);
    } catch (e) { 
      alert("Errore nell'analisi delle scene."); 
    } finally { 
      setLoadingScript(false); 
    }
  };

  return (
    <div className="w-full space-y-12 animate-fadeIn pb-24">
      <div className="flex justify-between items-center glass p-4 rounded-2xl">
        <button onClick={onReset} className="text-[10px] font-black uppercase tracking-widest text-gray-400 hover:text-white">← {t.newAudit}</button>
        <div className="text-[10px] font-black text-[#1087a0] uppercase tracking-widest">EXECUTIVE REPORT</div>
      </div>

      <div className="glass p-12 rounded-[50px] flex flex-col md:flex-row items-center gap-12 shadow-2xl relative overflow-hidden">
        <div className="w-48 h-48 bg-gradient-to-br from-[#a02a11] to-[#1087a0] rounded-full flex flex-col items-center justify-center border-4 border-white/10 shadow-2xl shrink-0">
          <span className="text-[10px] font-black text-white/50 uppercase tracking-tighter">{t.viralScore}</span>
          <span className="text-7xl font-black text-white leading-none">{result.score}</span>
        </div>
        <div className="flex-1 text-center md:text-left space-y-4">
          <h2 className="text-5xl font-black uppercase tracking-tighter italic leading-none">{result.title}</h2>
          <div className="flex flex-wrap gap-3 justify-center md:justify-start">
            <span className="bg-[#1087a0]/20 text-[#1087a0] px-6 py-2 rounded-full text-[10px] font-black uppercase border border-[#1087a0]/30">{result.platformSuggestion}</span>
            <span className="bg-white/5 text-gray-400 px-6 py-2 rounded-full text-[10px] font-black uppercase border border-white/5">{result.ideaDuration}</span>
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        <div className="glass p-8 rounded-[40px] border-t-4 border-[#a02a11]">
          <h3 className="text-[10px] font-black uppercase text-[#a02a11] mb-4 tracking-widest">{t.seniorInsight}</h3>
          <p className="text-gray-300 italic text-sm leading-relaxed font-medium">"{result.analysis}"</p>
        </div>
        <div className="glass p-8 rounded-[40px] border-t-4 border-[#ffe399]">
          <h3 className="text-[10px] font-black uppercase text-[#ffe399] mb-4 tracking-widest">STRATEGIA EDITING</h3>
          <p className="text-gray-200 text-sm leading-relaxed font-bold uppercase tracking-tight">{result.visualData}</p>
        </div>
        <div className="glass p-8 rounded-[40px] border-t-4 border-[#1087a0]">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-[10px] font-black uppercase text-[#1087a0] tracking-widest">{t.strategicCopy}</h3>
            <button 
              onClick={() => { navigator.clipboard.writeText(result.caption); setCopied(true); setTimeout(() => setCopied(false), 2000); }}
              className="text-[8px] font-black uppercase px-3 py-1 bg-white text-black rounded"
            >
              {copied ? 'OK' : 'COPY'}
            </button>
          </div>
          <div className="max-h-96 overflow-y-auto pr-2 custom-scrollbar">
            <p className="text-gray-200 text-xs leading-relaxed whitespace-pre-wrap">{result.caption}</p>
          </div>
        </div>
      </div>

      {!script ? (
        <div className="glass p-12 rounded-[60px] text-center space-y-8 border border-white/5">
          <h3 className="text-4xl font-black uppercase tracking-tighter italic">{t.scriptTitle}</h3>
          <button onClick={loadScript} disabled={loadingScript} className="bg-white text-black px-12 py-4 rounded-2xl font-black uppercase text-xs hover:bg-[#a02a11] hover:text-white transition-all">
            {loadingScript ? "AUDITING SCENE..." : t.scriptBtn}
          </button>
        </div>
      ) : (
        <div className="space-y-8">
          {script.map((s, i) => (
            <div key={i} className="glass p-10 rounded-[40px] border border-white/5">
              <div className="flex items-center gap-6 mb-6">
                <span className="w-10 h-10 bg-[#a02a11] rounded-lg flex items-center justify-center font-black">{s.scene}</span>
                <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest">{s.duration}</span>
              </div>
              <p className="text-sm text-gray-200 leading-relaxed mb-4">{s.description}</p>
              <p className="text-[10px] text-[#1087a0] font-bold uppercase tracking-widest italic">{s.audioSFX}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
