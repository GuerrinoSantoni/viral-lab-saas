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
  Sei un Senior YouTuber Master Strategist con 20 anni di esperienza.
  Piattaforma: ${platform}. Lingua: ${lang}.
  REQUISITI:
  1. "caption": Almeno 150 parole, hook potente, storytelling e CTA.
  2. "visualData": Idea creativa e tecnica dettagliata.
  3. "analysis": Insight senior (max 250 caratteri).
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
  
  // Utilizziamo gemini-flash-latest per l'analisi video per maggiore stabilità con i file
  const response = await ai.models.generateContent({
    model: 'gemini-flash-latest',
    contents: {
      parts: [
        { text: SYSTEM_PROMPT_BASE(platform, lang) + " Analizza il video allegato. Sii critico e prolisso nella caption." },
        { inlineData: { data: base64, mimeType: file.type } }
      ]
    },
    config: { 
      responseMimeType: "application/json", 
      temperature: 0.7, 
      responseSchema: RESPONSE_SCHEMA 
    }
  });
  return JSON.parse(response.text || "{}");
}

export async function analyzePrompt(prompt: string, platform: Platform, lang: Language): Promise<AnalysisResult> {
  const ai = getAI();
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: {
      parts: [
        { text: SYSTEM_PROMPT_BASE(platform, lang) + ` Crea una strategia per: "${prompt}".` }
      ]
    },
    config: { responseMimeType: "application/json", temperature: 1.0, responseSchema: RESPONSE_SCHEMA }
  });
  return JSON.parse(response.text || "{}");
}

export async function generateScriptOnly(visualData: string, lang: Language, file?: File): Promise<Scene[]> {
  const ai = getAI();
  let contentParts: any[] = [];
  
  if (file) {
    const base64 = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve((reader.result as string).split(',')[1]);
      reader.onerror = reject;
    });
    contentParts.push({ inlineData: { data: base64, mimeType: file.type } });
  }

  contentParts.push({
    text: `Genera un'analisi tecnica scena per scena (JSON array). Strategia: ${visualData}. Lingua: ${lang}.`
  });
  
  const response = await ai.models.generateContent({
    model: 'gemini-flash-latest',
    contents: { parts: contentParts },
    config: { 
      responseMimeType: "application/json",
      temperature: 0.7,
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
