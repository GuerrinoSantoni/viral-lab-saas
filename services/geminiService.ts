import { GoogleGenAI } from "@google/genai";
import { Platform, AnalysisResult, Language, Scene } from "../types";

// Inizializzazione sicura per Vercel
const getAI = () => {
  const apiKey = process.env.API_KEY;
  if (!apiKey || apiKey === "") {
    throw new Error("API_KEY_MISSING");
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
  
  const systemInstruction = `
    Sei uno YouTuber leggendario con 20 anni di esperienza. Analizza questo video per ${platform} in lingua ${lang}.
    Rispondi esclusivamente con un oggetto JSON valido.
    {
      "score": "0-100",
      "title": "Titolo",
      "analysis": "Analisi",
      "caption": "Copy",
      "hashtags": ["tag1"],
      "visualData": "Dati",
      "platformSuggestion": "Suggerimento",
      "ideaDuration": "Durata"
    }
  `;

  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: {
      parts: [
        { text: systemInstruction },
        { inlineData: { data: base64, mimeType: file.type } }
      ]
    },
    config: { 
      responseMimeType: "application/json",
      temperature: 0.8,
    }
  });
  
  const text = response.text || "{}";
  try {
    return JSON.parse(text);
  } catch (e) {
    throw new Error("L'AI ha risposto con un formato non valido.");
  }
}

export async function generateScriptOnly(visualData: string, lang: Language): Promise<Scene[]> {
  const ai = getAI();
  const prompt = `Crea uno script basato su: ${visualData}. Lingua: ${lang}. Rispondi solo con array JSON.`;
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: { parts: [{ text: prompt }] },
    config: { responseMimeType: "application/json" }
  });
  return JSON.parse(response.text || "[]");
}
