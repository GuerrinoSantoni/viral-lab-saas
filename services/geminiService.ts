
import { GoogleGenAI, Type } from "@google/genai";
import { Platform, AnalysisResult, Language, Scene } from "../types";

const getAI = () => {
  const apiKey = process.env.API_KEY;
  if (!apiKey || apiKey === "") {
    throw new Error("API_KEY_MISSING");
  }
  return new GoogleGenAI({ apiKey });
};

const SYSTEM_PROMPT_BASE = (platform: string, lang: string) => `
  RUOLO: Sei il "Senior Master Strategist", l'autorità massima nel panorama social con 20 anni di esperienza reale. 
  PIATTAFORMA TARGET: ${platform}. LINGUA: ${lang}.
  
  MISSIONE: Esegui un Deep Audit tecnico. Sii brutale e analitico. Focalizzati su Hook, Retention e Monetizzazione.
  
  REQUISITI RISPOSTA:
  - Analisi tecnica di alto valore (almeno 250 parole).
  - Copy persuasivo per la caption.
  - Suggerimenti di montaggio spietati.
`;

const RESPONSE_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    score: { type: Type.STRING },
    title: { type: Type.STRING },
    analysis: { type: Type.STRING },
    caption: { type: Type.STRING },
    hashtags: { type: Type.ARRAY, items: { type: Type.STRING } },
    visualData: { type: Type.STRING },
    platformSuggestion: { type: Type.STRING },
    ideaDuration: { type: Type.STRING }
  },
  required: ["score", "title", "analysis", "caption", "hashtags", "visualData", "platformSuggestion", "ideaDuration"]
};

export async function analyzeVideo(file: File, platform: Platform, lang: Language): Promise<AnalysisResult> {
  const ai = getAI();
  const base64 = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve((reader.result as string).split(',')[1]);
    reader.onerror = reject;
  });
  
  const response = await ai.models.generateContent({
    model: 'gemini-3-pro-preview',
    contents: {
      parts: [
        { text: SYSTEM_PROMPT_BASE(platform, lang) + "\nINPUT: Esegui audit completo sul VIDEO allegato. Fornisci strategie che valgono migliaia di euro." },
        { inlineData: { data: base64, mimeType: file.type } }
      ]
    },
    config: { 
      responseMimeType: "application/json", 
      temperature: 0.4, // Più basso per maggiore stabilità nella struttura JSON
      responseSchema: RESPONSE_SCHEMA 
    }
  });
  
  if (!response.text) throw new Error("Risposta nulla dal Master Strategist.");
  return JSON.parse(response.text);
}

export async function generateIdea(prompt: string, platform: Platform, lang: Language): Promise<AnalysisResult> {
  const ai = getAI();
  const response = await ai.models.generateContent({
    model: 'gemini-3-pro-preview',
    contents: {
      parts: [
        { text: SYSTEM_PROMPT_BASE(platform, lang) + `\nINPUT: Genera una strategia vincente da questa idea: "${prompt}"` }
      ]
    },
    config: { 
      responseMimeType: "application/json", 
      temperature: 0.7,
      responseSchema: RESPONSE_SCHEMA 
    }
  });
  
  if (!response.text) throw new Error("Risposta nulla.");
  return JSON.parse(response.text);
}

export async function generateSceneAnalysis(visualData: string, lang: Language, file?: File): Promise<Scene[]> {
  const ai = getAI();
  const parts: any[] = [{ text: `Storyboard tecnico. Basati su: ${visualData}. Lingua: ${lang}. Genera array JSON di oggetti Scene (scene, description, audioSFX, duration).` }];
  
  if (file) {
    const base64 = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve((reader.result as string).split(',')[1]);
      reader.onerror = reject;
    });
    parts.push({ inlineData: { data: base64, mimeType: file.type } });
  }

  const response = await ai.models.generateContent({
    model: 'gemini-3-pro-preview',
    contents: { parts },
    config: { 
      responseMimeType: "application/json",
      temperature: 0.3,
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

  if (!response.text) return [];
  return JSON.parse(response.text);
}
