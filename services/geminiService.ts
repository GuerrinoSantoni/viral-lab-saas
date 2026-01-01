
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
  
  onProgress?.("Conversione video...");
  const base64 = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve((reader.result as string).split(',')[1]);
    reader.onerror = reject;
  });

  // FASE 1: ANALISI VISIVA CON GEMINI 3 PRO (Più stabile per input binari)
  onProgress?.("Fase 1: Il Master sta guardando il video...");
  const scanResponse = await ai.models.generateContent({
    model: 'gemini-3-pro-preview', // MODELLO PRO PER STABILITÀ VIDEO
    contents: {
      parts: [
        { inlineData: { data: base64, mimeType: file.type || "video/mp4" } },
        { text: "Analizza questo video come un produttore senior. Descrivi ogni dettaglio: contenuto, tecnica, audio e carisma. Sii estremamente prolisso." }
      ]
    },
    config: { 
      temperature: 0.1,
      systemInstruction: "Sei un produttore video senior con 20 anni di esperienza, esperto in viralità."
    }
  });

  const technicalReport = scanResponse.text;
  if (!technicalReport) throw new Error("Scansione fallita.");

  // FASE 2: ELABORAZIONE STRATEGICA (Testo -> JSON)
  onProgress?.("Fase 2: Generazione strategia senior...");
  const finalResponse = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `AGISCI COME UN PRODUTTORE SENIOR. Crea una strategia spietata per ${platform} in ${lang} basandoti su questo report:
    
    ${technicalReport}
    
    RESTITUISCI SOLO UN JSON CON:
    "score" (0-100), "title" (3 titoli |), "analysis" (audit 500 parole), "caption" (copy), "hashtags" (array), "visualData" (descrizione per storyboard), "platformSuggestion" (algoritmo), "ideaDuration" (tempo).`,
    config: { 
      responseMimeType: "application/json",
      temperature: 0.7 
    }
  });

  return JSON.parse(cleanJSON(finalResponse.text || "{}"));
}

export async function generateIdea(prompt: string, platform: Platform, lang: Language): Promise<AnalysisResult> {
  const ai = getAI();
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `Strategia virale senior per ${platform} in ${lang}. Idea: "${prompt}".`,
    config: { 
      responseMimeType: "application/json", 
      temperature: 0.7
    }
  });
  return JSON.parse(cleanJSON(response.text || "{}"));
}

export async function generateSceneAnalysis(visualData: string, lang: Language, file?: File): Promise<Scene[]> {
  const ai = getAI();
  let parts: any[] = [{ text: `Crea storyboard senior in ${lang} basato su: ${visualData}` }];
  
  if (file) {
    const base64 = await new Promise<string>((resolve) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve((reader.result as string).split(',')[1]);
    });
    parts.unshift({ inlineData: { data: base64, mimeType: file.type || "video/mp4" } });
  }

  const response = await ai.models.generateContent({
    model: 'gemini-3-pro-preview',
    contents: { parts },
    config: { 
      responseMimeType: "application/json",
      temperature: 0.2
    }
  });

  return JSON.parse(cleanJSON(response.text || "[]"));
}
