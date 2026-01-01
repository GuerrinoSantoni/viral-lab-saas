
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
  
  onProgress?.("Ottimizzazione bitstream...");
  const base64 = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve((reader.result as string).split(',')[1]);
    reader.onerror = reject;
  });

  // FASE 1: SCANSIONE MULTIMODALE (FLASH)
  onProgress?.("Fase 1: Analisi Video (Modello Flash)...");
  const scanResponse = await ai.models.generateContent({
    model: MODEL_NAME,
    contents: {
      parts: [
        { inlineData: { data: base64, mimeType: file.type || "video/mp4" } },
        { text: "Analizza questo video come un esperto senior. Descrivi contenuto, tecnica, audio e carisma. Fornisci un report tecnico completo." }
      ]
    }
  });

  const technicalReport = scanResponse.text;
  if (!technicalReport) throw new Error("Errore durante la scansione multimodale.");

  // FASE 2: TRASFORMAZIONE STRATEGICA (FLASH)
  // Usiamo Flash anche qui per coerenza e velocità totale
  onProgress?.("Fase 2: Generazione Strategia Senior...");
  const finalResponse = await ai.models.generateContent({
    model: MODEL_NAME,
    contents: `AGISCI COME UN PRODUTTORE SENIOR CON 20 ANNI DI ESPERIENZA.
    Basandoti su questo report, crea una strategia per ${platform} in ${lang}:
    
    REPORT:
    ${technicalReport}
    
    RISPONDI ESCLUSIVAMENTE CON UN OGGETTO JSON:
    {
      "score": "voto 0-100",
      "title": "Titoli virali | separati da pipe",
      "analysis": "audit tecnico dettagliato (min 300 parole)",
      "caption": "copy pronto all'uso",
      "hashtags": ["tag1", "tag2"],
      "visualData": "descrizione per lo storyboard",
      "platformSuggestion": "consigli algoritmo",
      "ideaDuration": "durata ideale"
    }`,
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
    model: MODEL_NAME,
    contents: `Genera una strategia senior per ${platform} in ${lang}. Idea: "${prompt}". Rispondi in JSON.`,
    config: { 
      responseMimeType: "application/json",
      temperature: 0.8
    }
  });
  
  return JSON.parse(cleanJSON(response.text || "{}"));
}

export async function generateSceneAnalysis(visualData: string, lang: Language): Promise<Scene[]> {
  const ai = getAI();
  const response = await ai.models.generateContent({
    model: MODEL_NAME,
    contents: `Crea uno storyboard in ${lang} basato su: ${visualData}. Genera un array JSON di scene con scene (numero), description, audioSFX, duration.`,
    config: { 
      responseMimeType: "application/json"
    }
  });

  return JSON.parse(cleanJSON(response.text || "[]"));
}
