import { GoogleGenAI } from "@google/genai";
import { Platform, AnalysisResult, Language, Scene } from "../types";

const getAI = () => {
  // In Vercel, process.env.API_KEY è iniettato da vite.config.ts
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    throw new Error("API_KEY mancante. Aggiungila nelle Environment Variables di Vercel.");
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
          text: `Agisci come un Master YouTuber con 20 anni di esperienza. 
                 Analizza tecnicamente questo video per ${platform} in lingua ${lang}.
                 Sii brutale ma strategico. Analizza gancio, montaggio e potenziale virale.
                 Restituisci SOLO un oggetto JSON valido.
                 Struttura JSON:
                 {
                   "score": "0-100",
                   "title": "Titolo Master",
                   "analysis": "Analisi critica approfondita",
                   "caption": "Copy ottimizzato per algoritmi",
                   "hashtags": ["tag1", "tag2"],
                   "visualData": "Dettagli tecnici per rifacimento professionale",
                   "platformSuggestion": "Suggerimento posizionamento",
                   "ideaDuration": "Durata consigliata"
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
  
  const text = response.text || "{}";
  return JSON.parse(text);
}

export async function generateScriptOnly(visualData: string, lang: Language): Promise<Scene[]> {
  const ai = getAI();
  const response = await ai.models.generateContent({
    model: 'gemini-3-pro-preview',
    contents: { 
      parts: [
        { 
          text: `Basandoti su questa analisi: "${visualData}", crea uno script 8K cinematografico. 
                 Lingua: ${lang}. 
                 Restituisci un array JSON di scene con: scene (numero), description, audioSFX, duration.` 
        }
      ] 
    },
    config: { 
      responseMimeType: "application/json" 
    }
  });
  
  const text = response.text || "[]";
  return JSON.parse(text);
}
