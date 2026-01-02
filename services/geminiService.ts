
import { GoogleGenAI } from "@google/genai";
import { Platform, AnalysisResult, Language, Scene } from "../types";

// Utilizziamo Gemini 3 Flash: il motore più avanzato e veloce disponibile
const MODEL_NAME = 'gemini-3-flash-preview';

const getAI = () => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) throw new Error("API_KEY_MANCANTE: Verifica le impostazioni di Vercel.");
  return new GoogleGenAI({ apiKey });
};

function cleanJSON(text: string): string {
  if (!text) return "{}";
  // Rimuove markdown e spazi superflui
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
  
  onProgress?.("Lettura file...");
  const base64 = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve((reader.result as string).split(',')[1]);
    reader.onerror = () => reject(new Error("Errore durante la lettura del file video."));
  });

  onProgress?.("Audit Master in corso...");
  
  try {
    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: [{
        parts: [
          { inlineData: { data: base64, mimeType: file.type || "video/mp4" } },
          { text: `AGISCI COME UN PRODUTTORE YOUTUBE SENIOR (20 ANNI DI ESPERIENZA). 
            Analizza questo video per ${platform} in lingua ${lang}.
            REGOLE: Sii spietato, tecnico e strategico.
            
            RISPONDI ESCLUSIVAMENTE IN JSON:
            {
              "score": "voto 0-100",
              "title": "3 Titoli Magnetici | separati da pipe",
              "analysis": "Audit tecnico spietato di almeno 300 parole",
              "caption": "Copy persuasivo",
              "hashtags": ["tag1", "tag2"],
              "visualData": "Dettagli visivi per montaggio",
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
    if (!text) throw new Error("Il modello non ha restituito una risposta valida.");
    
    return JSON.parse(cleanJSON(text));
  } catch (error: any) {
    console.error("DEBUG API ERROR:", error);
    // Propaghiamo l'errore specifico per l'interfaccia
    throw error;
  }
}

export async function generateIdea(prompt: string, platform: Platform, lang: Language): Promise<AnalysisResult> {
  const ai = getAI();
  try {
    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: `AGISCI COME PRODUTTORE SENIOR. Crea strategia per ${platform} in ${lang} su: "${prompt}". Rispondi in JSON.`,
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
    contents: `Crea storyboard tecnico in ${lang} per: ${visualData}. Array JSON di 6 scene.`,
    config: { responseMimeType: "application/json" }
  });
  return JSON.parse(cleanJSON(response.text || "[]"));
}
