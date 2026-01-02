
import { GoogleGenAI, Type } from "@google/genai";
import { Platform, AnalysisResult, Language, Scene } from "../types";

// Modelli differenziati per velocità e potenza di calcolo
const FAST_MODEL = 'gemini-3-flash-preview';
const PRO_MODEL = 'gemini-3-pro-preview';

const getAI = () => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) throw new Error("API_KEY_MANCANTE");
  return new GoogleGenAI({ apiKey });
};

function extractJSON(text: string): any {
  if (!text) return null;
  // Pulizia aggressiva: cerchiamo il primo '[' e l'ultimo ']' (per array) o '{' e '}' (per oggetti)
  try {
    const firstBracket = text.indexOf('[');
    const lastBracket = text.lastIndexOf(']');
    const firstBrace = text.indexOf('{');
    const lastBrace = text.lastIndexOf('}');
    
    // Se sembra un array (storyboard)
    if (firstBracket !== -1 && lastBracket !== -1 && (firstBracket < firstBrace || firstBrace === -1)) {
      return JSON.parse(text.substring(firstBracket, lastBracket + 1));
    }
    // Se sembra un oggetto (analisi)
    if (firstBrace !== -1 && lastBrace !== -1) {
      return JSON.parse(text.substring(firstBrace, lastBrace + 1));
    }
    
    return JSON.parse(text);
  } catch (e) {
    console.error("Errore Parsing. Testo originale:", text);
    throw new Error("Formato dati non riconosciuto dal Master.");
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
    model: FAST_MODEL,
    contents: [{
      parts: [
        { inlineData: { data: base64, mimeType: file.type || "video/mp4" } },
        { text: `AGISCI COME UN PRODUTTORE YOUTUBE SENIOR CON 20 ANNI DI ESPERIENZA. Analizza questo video per ${platform} in lingua ${lang}. Sii spietato. Restituisci un JSON con score XX/100, titolo virale, analisi critica, caption pronta all'uso, hashtags, e 'visualData' che riassuma lo stile visivo.` }
      ]
    }],
    config: {
      responseMimeType: "application/json"
    }
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

  parts.push({ text: `PRODUTTORE SENIOR: Crea una strategia virale per ${platform} in ${lang}. Input: "${prompt}". Rispondi in JSON.` });

  const response = await ai.models.generateContent({
    model: FAST_MODEL,
    contents: [{ parts }],
    config: { responseMimeType: "application/json" }
  });
  return extractJSON(response.text);
}

export async function generateSceneAnalysis(visualData: string, lang: Language): Promise<Scene[]> {
  const ai = getAI();
  // Usiamo il modello PRO per evitare i blocchi sulla generazione lunga dello storyboard
  const response = await ai.models.generateContent({
    model: PRO_MODEL,
    contents: `PRODUTTORE SENIOR: Trasforma queste note visive in uno storyboard tecnico di 6-8 scene. 
    NOTE: "${visualData.substring(0, 1000)}"
    LINGUA: ${lang}.
    REQUISITO: Restituisci esclusivamente un array JSON di oggetti con chiavi: scene (numero), description, audioSFX, duration.`,
    config: {
      responseMimeType: "application/json",
      thinkingConfig: { thinkingBudget: 0 } // Disattiviamo il thinking per velocizzare la risposta testuale
    }
  });
  return extractJSON(response.text);
}
