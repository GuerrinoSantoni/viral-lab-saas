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
  RUOLO: Sei un Senior YouTuber Master Strategist con 20 anni di esperienza nel settore dei media digitali.
  PIATTAFORMA: ${platform}. LINGUA: ${lang}.
  MISSIONE: Analizza il video fornito con occhio clinico e spietato. Non limitarti a una descrizione superficiale.
  REQUISITI REPORT:
  - "score": Un voto da 0 a 100 basato sul potenziale virale reale.
  - "title": Un titolo magnetico e ottimizzato per l'algoritmo.
  - "analysis": Un commento senior, tecnico e strategico (max 300 caratteri).
  - "caption": Una descrizione completa di almeno 200 parole, con storytelling, hook psicologici e CTA multiple.
  - "visualData": Spiegazione della strategia visiva e del montaggio necessario.
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
  
  // Utilizziamo gemini-3-pro-preview per la massima qualità di analisi "Senior"
  // Questo modello è più potente nel comprendere sfumature in video pesanti
  const response = await ai.models.generateContent({
    model: 'gemini-3-pro-preview',
    contents: {
      parts: [
        { text: SYSTEM_PROMPT_BASE(platform, lang) + " Esegui un audit integrale e profondo di questo video. Non tralasciare nulla." },
        { inlineData: { data: base64, mimeType: file.type } }
      ]
    },
    config: { 
      responseMimeType: "application/json", 
      temperature: 0.8,
      thinkingConfig: { thinkingBudget: 4000 }, // Riserviamo budget per il ragionamento strategico
      responseSchema: RESPONSE_SCHEMA 
    }
  });
  return JSON.parse(response.text || "{}");
}

export async function analyzePrompt(prompt: string, platform: Platform, lang: Language): Promise<AnalysisResult> {
  const ai = getAI();
  const response = await ai.models.generateContent({
    model: 'gemini-3-pro-preview',
    contents: {
      parts: [
        { text: SYSTEM_PROMPT_BASE(platform, lang) + ` Sviluppa una strategia master per questa idea: "${prompt}".` }
      ]
    },
    config: { 
      responseMimeType: "application/json", 
      temperature: 1.0, 
      responseSchema: RESPONSE_SCHEMA 
    }
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
    text: `Analisi tecnica fotogramma per fotogramma. Strategia: ${visualData}. Lingua: ${lang}. Genera JSON array.`
  });
  
  const response = await ai.models.generateContent({
    model: 'gemini-3-pro-preview',
    contents: { parts: contentParts },
    config: { 
      responseMimeType: "application/json",
      temperature: 0.5,
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
