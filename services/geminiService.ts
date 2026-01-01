
import { GoogleGenAI, Type } from "@google/genai";
import { Platform, AnalysisResult, Language, Scene } from "../types";

const getAI = () => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) throw new Error("API_KEY_MISSING");
  return new GoogleGenAI({ apiKey });
};

const RESPONSE_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    score: { type: Type.STRING, description: "Voto da 0 a 100" },
    title: { type: Type.STRING, description: "3 Titoli separati da |" },
    analysis: { type: Type.STRING, description: "Audit tecnico dettagliato" },
    caption: { type: Type.STRING, description: "Copy strategico completo" },
    hashtags: { type: Type.ARRAY, items: { type: Type.STRING } },
    visualData: { type: Type.STRING, description: "Direttive di editing" },
    platformSuggestion: { type: Type.STRING, description: "Consigli algoritmo" },
    ideaDuration: { type: Type.STRING, description: "Durata consigliata" }
  },
  required: ["score", "title", "analysis", "caption", "hashtags", "visualData", "platformSuggestion", "ideaDuration"]
};

export async function analyzeVideo(file: File, platform: Platform, lang: Language): Promise<AnalysisResult> {
  const ai = getAI();
  const base64 = await new Promise<string>((resolve) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve((reader.result as string).split(',')[1]);
  });
  
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: {
      parts: [
        { text: `RUOLO: Senior Master Strategist (20 anni exp). PIATTAFORMA: ${platform}. LINGUA: ${lang}. Esegui un audit spietato di questo VIDEO. Analizza hook, pacing e retention.` },
        { inlineData: { data: base64, mimeType: file.type } }
      ]
    },
    config: { 
      responseMimeType: "application/json", 
      temperature: 0.1,
      thinkingConfig: { thinkingBudget: 4000 },
      responseSchema: RESPONSE_SCHEMA 
    }
  });
  
  return JSON.parse(response.text || "{}");
}

export async function generateIdea(prompt: string, platform: Platform, lang: Language): Promise<AnalysisResult> {
  const ai = getAI();
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: {
      parts: [
        { text: `RUOLO: Senior Master Strategist (20 anni exp). PIATTAFORMA: ${platform}. LINGUA: ${lang}. Crea una strategia VIRALE partendo da questa idea testuale: "${prompt}". Non analizzare video, inventa tu il contenuto vincente.` }
      ]
    },
    config: { 
      responseMimeType: "application/json", 
      temperature: 0.7,
      thinkingConfig: { thinkingBudget: 2000 },
      responseSchema: RESPONSE_SCHEMA 
    }
  });
  
  return JSON.parse(response.text || "{}");
}

export async function generateSceneAnalysis(visualData: string, lang: Language, file?: File): Promise<Scene[]> {
  const ai = getAI();
  const parts: any[] = [{ text: `Genera uno storyboard tecnico basato su: ${visualData}. Lingua: ${lang}. Restituisci JSON array di Scene.` }];
  
  if (file) {
    const base64 = await new Promise<string>((resolve) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve((reader.result as string).split(',')[1]);
    });
    parts.push({ inlineData: { data: base64, mimeType: file.type } });
  }

  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: { parts },
    config: { 
      responseMimeType: "application/json",
      temperature: 0.2,
      thinkingConfig: { thinkingBudget: 2000 },
      responseSchema: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            scene: { type: Type.INTEGER },
            description: { type: Type.STRING },
            audioSFX: { type: Type.STRING },
            duration: { type: Type.STRING }
          },
          required: ["scene", "description", "audioSFX", "duration"]
        }
      }
    }
  });

  return JSON.parse(response.text || "[]");
}
