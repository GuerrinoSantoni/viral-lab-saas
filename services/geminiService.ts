
import { GoogleGenAI } from "@google/genai";
import { Platform, AnalysisResult, Language, Scene } from "../types";

// Utilizziamo Gemini Flash Lite: molto più stabile contro i crash 'Internal Error' dei server Google
const MODEL_NAME = 'gemini-flash-lite-latest';

const getAI = () => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) throw new Error("Manca la API_KEY. Configurala nelle variabili d'ambiente.");
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

async function fetchWithRetry(fn: () => Promise<any>, retries = 1): Promise<any> {
  try {
    return await fn();
  } catch (error: any) {
    if (retries > 0 && (error.message?.includes("500") || error.message?.includes("Internal"))) {
      console.warn("Tentativo di recupero dopo errore 500...");
      return await fn();
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
  
  onProgress?.("Lettura video...");
  const base64 = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve((reader.result as string).split(',')[1]);
    reader.onerror = () => reject(new Error("Impossibile leggere il file video."));
  });

  onProgress?.("Audit Master (richiede 10-20 sec)...");
  
  return fetchWithRetry(async () => {
    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: [{
        parts: [
          { inlineData: { data: base64, mimeType: file.type || "video/mp4" } },
          { text: `AGISCI COME UN PRODUTTORE YOUTUBE SENIOR CON 20 ANNI DI ESPERIENZA.
            Analizza questo video per ${platform} in lingua ${lang}.
            
            RISPONDI ESCLUSIVAMENTE IN JSON:
            {
              "score": "voto 0-100",
              "title": "3 Titoli Magnetici | separati da pipe",
              "analysis": "Audit tecnico spietato (min 300 parole) su montaggio e retention",
              "caption": "Copy persuasivo",
              "hashtags": ["tag1", "tag2"],
              "visualData": "Dettagli per storyboard",
              "platformSuggestion": "Consiglio algoritmo",
              "ideaDuration": "Durata consigliata"
            }` 
          }
        ]
      }],
      config: { 
        responseMimeType: "application/json"
      }
    });

    const text = response.text;
    if (!text) throw new Error("Il server non ha restituito testo.");
    return JSON.parse(cleanJSON(text));
  });
}

export async function generateIdea(prompt: string, platform: Platform, lang: Language): Promise<AnalysisResult> {
  const ai = getAI();
  return fetchWithRetry(async () => {
    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: `AGISCI COME PRODUTTORE SENIOR. Strategia per ${platform} in ${lang} su: "${prompt}". Rispondi in JSON.`,
      config: { responseMimeType: "application/json" }
    });
    return JSON.parse(cleanJSON(response.text || "{}"));
  });
}

export async function generateSceneAnalysis(visualData: string, lang: Language): Promise<Scene[]> {
  const ai = getAI();
  const response = await ai.models.generateContent({
    model: MODEL_NAME,
    contents: `Crea storyboard tecnico in ${lang} per: ${visualData}. Array JSON di 6 scene.`,
    config: { responseMimeType: "application/json" }
  });
  return JSON.parse(cleanJSON(response.text || "[]"));
}
