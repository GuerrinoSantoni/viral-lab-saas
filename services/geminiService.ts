
import { GoogleGenAI, Type } from "@google/genai";
import { Platform, AnalysisResult, Language, Scene } from "../types";

const MODEL_NAME = 'gemini-3-flash-preview';

const getAI = () => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) throw new Error("API_KEY_MISSING");
  return new GoogleGenAI({ apiKey });
};

// Helper per pulire l'output JSON del modello
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

// Funzione di utilità per gestire i ritardi (retry)
const wait = (ms: number) => new Promise(res => setTimeout(res, ms));

export async function analyzeVideo(
  file: File, 
  platform: Platform, 
  lang: Language, 
  onProgress?: (step: string) => void
): Promise<AnalysisResult> {
  const ai = getAI();
  
  onProgress?.("Preparazione pacchetto dati...");
  const base64 = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve((reader.result as string).split(',')[1]);
    reader.onerror = reject;
  });

  onProgress?.("Audit Master in corso (Flash Mode)...");
  
  try {
    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: [{
        parts: [
          { inlineData: { data: base64, mimeType: file.type || "video/mp4" } },
          { text: `AGISCI COME UN PRODUTTORE SENIOR CON 20 ANNI DI ESPERIENZA.
            Analizza questo video per la piattaforma ${platform} in lingua ${lang}.
            
            ESEGUI UN AUDIT PROFESSIONALE COMPLETO:
            1. Viral Score (0-100).
            2. 3 Titoli Magnetici.
            3. Analisi tecnica spietata (min 300 parole).
            4. Copy persuasivo con hashtag.
            5. Briefing visivo per storyboard.

            RISPONDI ESCLUSIVAMENTE CON QUESTO JSON:
            {
              "score": "voto",
              "title": "Titoli | separati | da pipe",
              "analysis": "audit senior testuale dettagliato",
              "caption": "copy caption",
              "hashtags": ["tag1", "tag2"],
              "visualData": "briefing visivo per storyboard",
              "platformSuggestion": "consigli algoritmo",
              "ideaDuration": "durata ideale"
            }` 
          }
        ]
      }],
      config: { 
        responseMimeType: "application/json"
      }
    });

    return JSON.parse(cleanJSON(response.text || "{}"));
  } catch (error: any) {
    if (error.message?.includes("429")) {
      throw new Error("QUOTA_EXCEEDED");
    }
    throw error;
  }
}

export async function generateIdea(prompt: string, platform: Platform, lang: Language): Promise<AnalysisResult> {
  const ai = getAI();
  
  try {
    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: `AGISCI COME UN PRODUTTORE SENIOR CON 20 ANNI DI ESPERIENZA.
        Crea una strategia virale completa per ${platform} in lingua ${lang} basata su questa idea: "${prompt}".
        
        RISPONDI ESCLUSIVAMENTE CON QUESTO OGGETTO JSON:
        {
          "score": "potenziale virale 0-100",
          "title": "3 Titoli Magnetici | separati da pipe",
          "analysis": "Strategia dettagliata di almeno 300 parole su come realizzare il contenuto",
          "caption": "Copy pronto per il post",
          "hashtags": ["tag1", "tag2"],
          "visualData": "Descrizione visiva per il montaggio",
          "platformSuggestion": "Suggerimento per l'algoritmo",
          "ideaDuration": "Durata video consigliata"
        }`,
      config: { 
        responseMimeType: "application/json"
      }
    });
    
    return JSON.parse(cleanJSON(response.text || "{}"));
  } catch (error: any) {
    if (error.message?.includes("429")) {
      throw new Error("QUOTA_EXCEEDED");
    }
    throw error;
  }
}

export async function generateSceneAnalysis(visualData: string, lang: Language): Promise<Scene[]> {
  const ai = getAI();
  const response = await ai.models.generateContent({
    model: MODEL_NAME,
    contents: `Basandoti su questo briefing: ${visualData}, crea uno storyboard tecnico in ${lang}. Restituisci un array JSON di oggetti con scene, description, audioSFX, duration.`,
    config: { responseMimeType: "application/json" }
  });
  return JSON.parse(cleanJSON(response.text || "[]"));
}
