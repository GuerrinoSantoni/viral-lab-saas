
import { GoogleGenAI, Type } from "@google/genai";
import { Platform, AnalysisResult, Language, Scene } from "../types";

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
  
  onProgress?.("Preparazione pacchetto dati...");
  const base64 = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve((reader.result as string).split(',')[1]);
    reader.onerror = reject;
  });

  // FASE 1: SCANSIONE NATIVA
  // Usiamo il modello specifico per video/audio per evitare Error 500
  onProgress?.("Fase 1: Il Master sta guardando il video...");
  const scanResponse = await ai.models.generateContent({
    model: 'gemini-2.5-flash-native-audio-preview-09-2025',
    contents: {
      parts: [
        { inlineData: { data: base64, mimeType: file.type || "video/mp4" } },
        { text: "Analizza questo video come un produttore senior. Descrivi ogni dettaglio: contenuto, tecnica, audio e carisma. Sii estremamente prolisso." }
      ]
    }
  });

  const technicalReport = scanResponse.text;
  if (!technicalReport) throw new Error("Il server non ha risposto correttamente alla scansione video.");

  // FASE 2: ELABORAZIONE STRATEGICA (Solo testo, sicura al 100%)
  onProgress?.("Fase 2: Elaborazione strategia senior...");
  const finalResponse = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `AGISCI COME UN PRODUTTORE SENIOR CON 20 ANNI DI ESPERIENZA. 
    Basandoti su questo report tecnico di un video, crea una strategia per ${platform} in ${lang}:
    
    REPORT:
    ${technicalReport}
    
    RESTITUISCI SOLO UN OGGETTO JSON:
    {
      "score": "voto 0-100",
      "title": "3 titoli magnetici | separati da pipe",
      "analysis": "audit tecnico di almeno 300 parole",
      "caption": "copy persuasivo",
      "hashtags": ["tag1", "tag2"],
      "visualData": "descrizione visiva per lo storyboard",
      "platformSuggestion": "consigli per l'algoritmo",
      "ideaDuration": "minutaggio suggerito"
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
    model: 'gemini-3-flash-preview',
    contents: `Genera una strategia virale senior (20 anni exp) per ${platform} in ${lang}. Idea di base: "${prompt}".`,
    config: { 
      responseMimeType: "application/json", 
      temperature: 0.7
    }
  });
  
  return JSON.parse(cleanJSON(response.text || "{}"));
}

export async function generateSceneAnalysis(visualData: string, lang: Language): Promise<Scene[]> {
  const ai = getAI();
  const response = await ai.models.generateContent({
    model: 'gemini-3-pro-preview',
    contents: `CREA STORYBOARD SENIOR IN ${lang}. Basati su: ${visualData}. Genera 5-10 scene dettagliate.`,
    config: { 
      responseMimeType: "application/json",
      temperature: 0.2
    }
  });

  // Fix: Changed finalResponse to response to correctly use the variable defined in this scope
  return JSON.parse(cleanJSON(response.text || "[]"));
}
