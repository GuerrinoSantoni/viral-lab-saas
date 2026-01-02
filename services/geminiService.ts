
import { GoogleGenAI, Type } from "@google/genai";
import { Platform, AnalysisResult, Language, Scene } from "../types";

// Utilizziamo il modello STABILE che ha quote molto più alte rispetto ai preview
const MODEL_NAME = 'gemini-flash-latest';

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

/**
 * Esegue l'analisi con un sistema di retry automatico in caso di errore 429
 */
async function callWithRetry(fn: () => Promise<any>, retries = 2, delay = 2000): Promise<any> {
  try {
    return await fn();
  } catch (error: any) {
    if (retries > 0 && (error.message?.includes("429") || error.message?.includes("RESOURCE_EXHAUSTED"))) {
      await new Promise(res => setTimeout(res, delay));
      return callWithRetry(fn, retries - 1, delay * 2);
    }
    throw error;
  }
}

export async function analyzeVideo(
  file: File, 
  platform: Platform, 
  lang: Language, 
  onProgress?: (step: string) => void
): Promise<AnalysisResult> {
  const ai = getAI();
  
  onProgress?.("Codifica video...");
  const base64 = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve((reader.result as string).split(',')[1]);
    reader.onerror = reject;
  });

  onProgress?.("Audit Master in corso...");
  
  return await callWithRetry(async () => {
    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: [{
        parts: [
          { inlineData: { data: base64, mimeType: file.type || "video/mp4" } },
          { text: `AGISCI COME UN PRODUTTORE SENIOR CON 20 ANNI DI ESPERIENZA.
            Analizza questo video per ${platform} in ${lang}.
            
            AUDIT RICHIESTO (RISPONDI SOLO IN JSON):
            {
              "score": "voto 0-100",
              "title": "3 Titoli Magnetici | divisi da pipe",
              "analysis": "Audit tecnico spietato di 300 parole su montaggio, ritmo e retention",
              "caption": "Copy persuasivo pronto all'uso",
              "hashtags": ["tag1", "tag2"],
              "visualData": "Dettagli visivi per lo storyboard",
              "platformSuggestion": "Trucco algoritmo",
              "ideaDuration": "Durata consigliata"
            }` 
          }
        ]
      }],
      config: { responseMimeType: "application/json" }
    });

    return JSON.parse(cleanJSON(response.text || "{}"));
  });
}

export async function generateIdea(prompt: string, platform: Platform, lang: Language): Promise<AnalysisResult> {
  const ai = getAI();
  
  return await callWithRetry(async () => {
    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: `AGISCI COME PRODUTTORE SENIOR (20Y EXP). Crea strategia per ${platform} in ${lang} su: "${prompt}". Rispondi in JSON:
      {
        "score": "0-100",
        "title": "Titoli | pipe",
        "analysis": "Strategia completa (300 parole)",
        "caption": "Copy",
        "hashtags": ["tag"],
        "visualData": "Briefing montaggio",
        "platformSuggestion": "Algoritmo",
        "ideaDuration": "Durata"
      }`,
      config: { responseMimeType: "application/json" }
    });
    
    return JSON.parse(cleanJSON(response.text || "{}"));
  });
}

export async function generateSceneAnalysis(visualData: string, lang: Language): Promise<Scene[]> {
  const ai = getAI();
  const response = await ai.models.generateContent({
    model: MODEL_NAME,
    contents: `Crea storyboard tecnico in ${lang} basato su: ${visualData}. Restituisci array JSON di 6 scene.`,
    config: { responseMimeType: "application/json" }
  });
  return JSON.parse(cleanJSON(response.text || "[]"));
}
