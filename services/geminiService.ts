
import { GoogleGenAI, Type } from "@google/genai";
import { Platform, AnalysisResult, Language, Scene } from "../types";

const getAI = () => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) throw new Error("API_KEY_MISSING");
  return new GoogleGenAI({ apiKey });
};

function cleanJSON(text: string): string {
  if (!text) return "{}";
  let cleaned = text.replace(/```json/g, '').replace(/```/g, '').trim();
  const start = cleaned.indexOf('{');
  const end = cleaned.lastIndexOf('}');
  if (start !== -1 && end !== -1) {
    cleaned = cleaned.substring(start, end + 1);
  }
  return cleaned;
}

export async function analyzeVideo(
  file: File, 
  platform: Platform, 
  lang: Language, 
  onProgress?: (step: string) => void
): Promise<AnalysisResult> {
  const ai = getAI();
  
  onProgress?.("Conversione video in bitstream...");
  const base64 = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve((reader.result as string).split(',')[1]);
    reader.onerror = reject;
  });

  // FASE 1: SCANSIONE VISIVA (GEMINI 3 FLASH)
  // Flash è più veloce e ha timeout meno aggressivi per upload diretti
  onProgress?.("Fase 1: Il Master sta guardando il video...");
  const scanResponse = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: {
      parts: [
        { inlineData: { data: base64, mimeType: file.type || "video/mp4" } },
        { text: "Analizza questo video come un produttore senior. Descrivi ogni dettaglio: contenuto, tecnica di montaggio, qualità audio, carisma del creator, ganci (hook) iniziali e possibili punti di drop-off. Sii estremamente prolisso." }
      ]
    }
  });

  const technicalReport = scanResponse.text;
  if (!technicalReport) throw new Error("Il server ha ignorato il video.");

  // FASE 2: ELABORAZIONE STRATEGICA SENIOR (GEMINI 3 PRO + THINKING)
  // Qui usiamo il modello Pro con Thinking per dare quella profondità di "20 anni di esperienza"
  onProgress?.("Fase 2: Elaborazione strategia senior...");
  const finalResponse = await ai.models.generateContent({
    model: 'gemini-3-pro-preview',
    contents: `AGISCI COME UN PRODUTTORE SENIOR CON 20 ANNI DI ESPERIENZA NELL'INDUSTRIA VIDEO. 
    Basandoti su questo report tecnico di un video, crea una strategia spietata e vincente per ${platform} in lingua ${lang}:
    
    REPORT TECNICO DEL VIDEO:
    ${technicalReport}
    
    REQUISITI:
    1. Analisi deve essere brutale, onesta e di altissimo livello (audit tecnico).
    2. Titoli devono essere 'magnetici' e basati sulla psicologia del click.
    3. Il copy deve essere ottimizzato per l'algoritmo di ${platform}.
    
    RESTITUISCI SOLO UN OGGETTO JSON VALIDO:
    {
      "score": "voto 0-100 basato sul potenziale virale",
      "title": "3 titoli magnetici | separati da pipe",
      "analysis": "audit senior di almeno 400 parole con consigli pratici",
      "caption": "copy persuasivo completo di gancio e call to action",
      "hashtags": ["tag1", "tag2", "tag3"],
      "visualData": "briefing visivo per migliorare il video o rifarlo",
      "platformSuggestion": "trucchi specifici per l'algoritmo attuale",
      "ideaDuration": "minutaggio ideale per la viralità"
    }`,
    config: { 
      responseMimeType: "application/json",
      thinkingConfig: { thinkingBudget: 4000 } // Usiamo thinking per la qualità senior
    }
  });

  return JSON.parse(cleanJSON(finalResponse.text || "{}"));
}

export async function generateIdea(prompt: string, platform: Platform, lang: Language): Promise<AnalysisResult> {
  const ai = getAI();
  const response = await ai.models.generateContent({
    model: 'gemini-3-pro-preview',
    contents: `Genera una strategia virale senior (20 anni exp) per ${platform} in ${lang}. Idea di base: "${prompt}". 
    Usa la tua esperienza per trasformare questa idea in un format di successo.`,
    config: { 
      responseMimeType: "application/json", 
      thinkingConfig: { thinkingBudget: 4000 }
    }
  });
  
  return JSON.parse(cleanJSON(response.text || "{}"));
}

export async function generateSceneAnalysis(visualData: string, lang: Language): Promise<Scene[]> {
  const ai = getAI();
  const response = await ai.models.generateContent({
    model: 'gemini-3-pro-preview',
    contents: `CREA STORYBOARD SENIOR DETTAGLIATO IN ${lang}. Basati su questa visione: ${visualData}. 
    Genera almeno 8 scene con tempi, inquadrature e sound design specifici.`,
    config: { 
      responseMimeType: "application/json",
      thinkingConfig: { thinkingBudget: 2000 }
    }
  });

  return JSON.parse(cleanJSON(response.text || "[]"));
}
