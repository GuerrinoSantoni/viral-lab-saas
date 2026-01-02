
import { GoogleGenAI } from "@google/genai";
import { Platform, AnalysisResult, Language, Scene } from "../types";

// Utilizziamo Gemini 1.5 Flash: il cavallo di battaglia stabile di Google con quote generose
const MODEL_NAME = 'gemini-flash-latest';

const getAI = () => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) throw new Error("API_KEY_MANCANTE");
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
  
  onProgress?.("Preparazione file...");
  const base64 = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve((reader.result as string).split(',')[1]);
    reader.onerror = () => reject(new Error("Errore lettura video."));
  });

  onProgress?.("Audit Master in corso...");
  
  try {
    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: [{
        parts: [
          { inlineData: { data: base64, mimeType: file.type || "video/mp4" } },
          { text: `AGISCI COME UN PRODUTTORE YOUTUBE SENIOR CON 20 ANNI DI ESPERIENZA.
            Analizza questo video per ${platform} in lingua ${lang}.
            
            AUDIT RICHIESTO (RISPONDI SOLO IN JSON):
            {
              "score": "voto 0-100",
              "title": "3 Titoli Magnetici | divisi da pipe",
              "analysis": "Audit tecnico spietato di almeno 300 parole su montaggio, ritmo e retention",
              "caption": "Copy persuasivo pronto all'uso",
              "hashtags": ["tag1", "tag2"],
              "visualData": "Dettagli visivi per lo storyboard",
              "platformSuggestion": "Trucco algoritmo specifico",
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
    if (!text) throw new Error("Risposta vuota dal Master.");
    
    return JSON.parse(cleanJSON(text));
  } catch (error: any) {
    console.error("API ERROR:", error);
    throw error;
  }
}

export async function generateIdea(prompt: string, platform: Platform, lang: Language): Promise<AnalysisResult> {
  const ai = getAI();
  try {
    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: `AGISCI COME PRODUTTORE SENIOR (20Y EXP). Crea strategia per ${platform} in ${lang} su: "${prompt}". Rispondi in JSON:
      {
        "score": "0-100",
        "title": "Titoli | pipe",
        "analysis": "Strategia completa",
        "caption": "Copy",
        "hashtags": ["tag"],
        "visualData": "Briefing montaggio",
        "platformSuggestion": "Algoritmo",
        "ideaDuration": "Durata"
      }`,
      config: { responseMimeType: "application/json" }
    });
    return JSON.parse(cleanJSON(response.text || "{}"));
  } catch (error: any) {
    throw error;
  }
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
