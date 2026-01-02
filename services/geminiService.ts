
import { GoogleGenAI, Type } from "@google/genai";
import { Platform, AnalysisResult, Language, Scene } from "../types";

// Modelli differenziati per non saturare la quota di un singolo modello
const MAIN_MODEL = 'gemini-3-flash-preview'; // Visione + Analisi
const LITE_MODEL = 'gemini-2.5-flash-lite-latest'; // Storyboard e Testo veloce

const getAI = () => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) throw new Error("API_KEY_MANCANTE");
  return new GoogleGenAI({ apiKey });
};

function extractJSON(text: string): any {
  if (!text) return null;
  try {
    const firstBracket = text.indexOf('[');
    const lastBracket = text.lastIndexOf(']');
    const firstBrace = text.indexOf('{');
    const lastBrace = text.lastIndexOf('}');
    
    if (firstBracket !== -1 && lastBracket !== -1 && (firstBracket < firstBrace || firstBrace === -1)) {
      return JSON.parse(text.substring(firstBracket, lastBracket + 1));
    }
    if (firstBrace !== -1 && lastBrace !== -1) {
      return JSON.parse(text.substring(firstBrace, lastBrace + 1));
    }
    return JSON.parse(text);
  } catch (e) {
    console.error("Errore Parsing JSON:", text);
    throw new Error("Il Master ha inviato dati sporchi. Riprova.");
  }
}

export async function analyzeVideo(
  file: File, 
  platform: Platform, 
  lang: Language, 
  onProgress?: (step: string) => void
): Promise<AnalysisResult> {
  const ai = getAI();
  onProgress?.("Codifica Stream Master...");
  const base64 = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve((reader.result as string).split(',')[1]);
    reader.onerror = () => reject(new Error("Errore lettura file."));
  });

  onProgress?.("Audit Senior in corso...");
  const response = await ai.models.generateContent({
    model: MAIN_MODEL,
    contents: [{
      parts: [
        { inlineData: { data: base64, mimeType: file.type || "video/mp4" } },
        { text: `AGISCI COME UN PRODUTTORE YOUTUBE SENIOR. Analizza questo video per ${platform} in ${lang}. Restituisci un JSON con: score (XX/100), title (virale), analysis (critica), caption, hashtags (array), visualData (note visive per storyboard), platformSuggestion, ideaDuration.` }
      ]
    }],
    config: { responseMimeType: "application/json" }
  });

  return extractJSON(response.text);
}

export async function generateIdea(
  prompt: string, 
  platform: Platform, 
  lang: Language, 
  imageFile?: File
): Promise<AnalysisResult> {
  const ai = getAI();
  const parts: any[] = [];

  if (imageFile) {
    const base64 = await new Promise<string>((resolve) => {
      const reader = new FileReader();
      reader.readAsDataURL(imageFile);
      reader.onload = () => resolve((reader.result as string).split(',')[1]);
    });
    parts.push({ inlineData: { data: base64, mimeType: imageFile.type } });
  }

  parts.push({ text: `PRODUTTORE SENIOR: Strategia virale per ${platform} in ${lang}. Input: "${prompt}". Rispondi in JSON.` });

  const response = await ai.models.generateContent({
    model: MAIN_MODEL,
    contents: [{ parts }],
    config: { responseMimeType: "application/json" }
  });
  return extractJSON(response.text);
}

export async function generateSceneAnalysis(visualData: string, lang: Language): Promise<Scene[]> {
  const ai = getAI();
  // Usiamo il modello LITE che ha quote molto più alte per il solo testo
  const response = await ai.models.generateContent({
    model: LITE_MODEL,
    contents: `PRODUTTORE SENIOR: Crea uno storyboard tecnico (6 scene) da queste note: "${visualData}". 
    Lingua: ${lang}. Restituisci un array JSON con: scene, description, audioSFX, duration.`,
    config: { responseMimeType: "application/json" }
  });
  return extractJSON(response.text);
}
