import { GoogleGenAI } from "@google/genai";
import { Platform, AnalysisResult, Language, Scene } from "../types";

// Inizializzazione sicura: usiamo una funzione per creare l'istanza quando serve
const getAI = () => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    throw new Error("API_KEY non configurata. Aggiungila nelle Environment Variables di Vercel.");
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
          text: `Agisci come uno YouTuber Senior con 20 anni di esperienza e 10M+ di iscritti. 
                 Analizza tecnicamente questo video per la piattaforma ${platform}.
                 Lingua di output: ${lang}.
                 Sii brutale ma costruttivo.
                 Restituisci ESCLUSIVAMENTE un JSON con questa struttura:
                 {
                   "score": "numero da 0 a 100",
                   "title": "Titolo Strategico",
                   "analysis": "Analisi tecnica di ritenzione e gancio",
                   "caption": "Copy completo di spazi e formattazione",
                   "hashtags": ["tag1", "tag2"],
                   "visualData": "Descrizione dettagliata per generare uno script di rifacimento",
                   "platformSuggestion": "Suggerimento posizionamento",
                   "ideaDuration": "Durata ideale consigliata"
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
          text: `In base a questa analisi video: "${visualData}", crea uno script di produzione 8K professionale.
                 Lingua: ${lang}.
                 Restituisci un array JSON di oggetti con chiavi: scene (number), description (descrizione visuale), audioSFX (audio e sound design), duration (es: "0:02").` 
        }
      ] 
    },
    config: { 
      responseMimeType: "application/json" 
    }
  });
  
  return JSON.parse(response.text || "[]");
}
