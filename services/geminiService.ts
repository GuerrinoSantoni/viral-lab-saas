import { GoogleGenAI } from "@google/genai";
import { Platform, AnalysisResult, Language, Scene } from "../types";

const getAI = () => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    throw new Error("API_KEY non trovata. Configurala su Vercel.");
  }
  return new GoogleGenAI({ apiKey });
};

export async function analyzeVideo(file: File, platform: Platform, lang: Language): Promise<AnalysisResult> {
  const ai = getAI();
  
  const base64 = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      const result = reader.result as string;
      resolve(result.split(',')[1]);
    };
    reader.onerror = error => reject(error);
  });
  
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: {
      parts: [
        { 
          text: `Sei uno YouTuber Senior con 20 anni di esperienza. 
                 Analizza questo video per ${platform}. Lingua: ${lang}.
                 Sii tecnico e orientato alla viralità.
                 Restituisci ESCLUSIVAMENTE un JSON:
                 {
                   "score": "0-100",
                   "title": "titolo",
                   "analysis": "analisi",
                   "caption": "copy",
                   "hashtags": ["tag1"],
                   "visualData": "descrizione per script",
                   "platformSuggestion": "perché questo formato",
                   "ideaDuration": "durata"
                 }` 
        },
        { 
          inlineData: { 
            data: base64, 
            mimeType: file.type 
          } 
        }
      ]
    },
    config: { 
      responseMimeType: "application/json"
    }
  });
  
  return JSON.parse(response.text || "{}");
}

export async function generateScriptOnly(visualData: string, lang: Language): Promise<Scene[]> {
  const ai = getAI();
  const response = await ai.models.generateContent({
    model: 'gemini-3-pro-preview',
    contents: { 
      parts: [
        { 
          text: `Crea uno script cinematografico basato su: "${visualData}". Lingua: ${lang}. 
                 Restituisci un array JSON di oggetti con: scene (number), description, audioSFX, duration.` 
        }
      ] 
    },
    config: { 
      responseMimeType: "application/json" 
    }
  });
  
  return JSON.parse(response.text || "[]");
}