
import { GoogleGenAI, Type } from "@google/genai";
import { Platform, AnalysisResult, Language, Scene } from "../types";

const MODEL_NAME = 'gemini-3-flash-preview';

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
  
  onProgress?.("Codifica video in corso...");
  const base64 = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve((reader.result as string).split(',')[1]);
    reader.onerror = reject;
  });

  // FASE 1: SCANSIONE TECNICA (Evita timeout perché la risposta è veloce)
  onProgress?.("Fase 1: Scansione visiva rapida...");
  const scanResponse = await ai.models.generateContent({
    model: MODEL_NAME,
    contents: [{
      parts: [
        { inlineData: { data: base64, mimeType: file.type || "video/mp4" } },
        { text: "Descrivi questo video in modo estremamente dettagliato dal punto di vista tecnico: scene, movimenti di camera, audio, espressioni del volto e qualità visiva. Sii molto analitico." }
      ]
    }]
  });

  const technicalDescription = scanResponse.text;
  if (!technicalDescription) throw new Error("Impossibile analizzare il video. Prova un file più leggero.");

  // FASE 2: AUDIT STRATEGICO (Usa la descrizione testuale, è istantaneo e sicuro)
  onProgress?.("Fase 2: Elaborazione strategia Master...");
  const finalResponse = await ai.models.generateContent({
    model: MODEL_NAME,
    contents: `AGISCI COME UN PRODUTTORE SENIOR CON 20 ANNI DI ESPERIENZA.
      Analizza questa descrizione tecnica di un video e crea una strategia per ${platform} in ${lang}.
      
      DESCRIZIONE VIDEO:
      ${technicalDescription}

      RESTITUISCI ESCLUSIVAMENTE UN OGGETTO JSON:
      {
        "score": "voto virale 0-100",
        "title": "3 Titoli Magnetici | divisi da pipe",
        "analysis": "Audit senior di almeno 400 parole con consigli spietati sul montaggio e la comunicazione",
        "caption": "Copy persuasivo con ganci psicologici",
        "hashtags": ["tag1", "tag2"],
        "visualData": "briefing visivo per il montatore",
        "platformSuggestion": "trucco per l'algoritmo attuale",
        "ideaDuration": "durata ideale suggerita"
      }`,
    config: { 
      responseMimeType: "application/json"
    }
  });

  return JSON.parse(cleanJSON(finalResponse.text || "{}"));
}

export async function generateIdea(prompt: string, platform: Platform, lang: Language): Promise<AnalysisResult> {
  const ai = getAI();
  const response = await ai.models.generateContent({
    model: MODEL_NAME,
    contents: `Genera una strategia senior (20y exp) per ${platform} in ${lang}. Idea: "${prompt}". Rispondi in JSON.`,
    config: { responseMimeType: "application/json" }
  });
  return JSON.parse(cleanJSON(response.text || "{}"));
}

export async function generateSceneAnalysis(visualData: string, lang: Language): Promise<Scene[]> {
  const ai = getAI();
  const response = await ai.models.generateContent({
    model: MODEL_NAME,
    contents: `Crea uno storyboard tecnico in ${lang} basato su: ${visualData}. Genera un array JSON di 8 scene.`,
    config: { responseMimeType: "application/json" }
  });
  return JSON.parse(cleanJSON(response.text || "[]"));
}
