
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
    title: { type: Type.STRING, description: "3 Titoli magnetici separati da |" },
    analysis: { type: Type.STRING, description: "Audit tecnico spietato e profondo (minimo 300 parole)" },
    caption: { type: Type.STRING, description: "Copy persuasivo con tecniche di copywriting avanzato" },
    hashtags: { type: Type.ARRAY, items: { type: Type.STRING } },
    visualData: { type: Type.STRING, description: "Sintesi della strategia visiva per lo storyboard" },
    platformSuggestion: { type: Type.STRING, description: "Consigli specifici per l'algoritmo attuale" },
    ideaDuration: { type: Type.STRING, description: "Minutaggio esatto al secondo" }
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
        { text: `Sei un Master Strategist con 20 anni di esperienza in produzione video e viral marketing. Analizza questo video per ${platform} in ${lang}. Sii brutale, analitico e PROLISSO. Non risparmiare dettagli tecnici.` },
        { inlineData: { data: base64, mimeType: file.type } }
      ]
    },
    config: { 
      responseMimeType: "application/json", 
      temperature: 0.15,
      thinkingConfig: { thinkingBudget: 8000 },
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
        { text: `Genera una strategia VIRALE Senior (20 anni exp) per ${platform} in ${lang}. Idea base: "${prompt}". Crea un piano d'attacco tecnico dettagliato.` }
      ]
    },
    config: { 
      responseMimeType: "application/json", 
      temperature: 0.7,
      thinkingConfig: { thinkingBudget: 4000 },
      responseSchema: RESPONSE_SCHEMA 
    }
  });
  
  return JSON.parse(response.text || "{}");
}

export async function generateSceneAnalysis(visualData: string, lang: Language, file?: File): Promise<Scene[]> {
  const ai = getAI();
  const parts: any[] = [{ 
    text: `CREA UNO STORYBOARD TECNICO SENIOR (20 anni exp). 
    REGOLE MANDATORIE:
    1. Genera tra le 5 e le 10 scene.
    2. Per OGNI scena, il campo "description" deve avere ALMENO 100 PAROLE (descrivi inquadratura, movimenti camera, luci, props, espressioni).
    3. Per OGNI scena, il campo "audioSFX" deve avere ALMENO 100 PAROLE (descrivi script parlato, toni, pause, sound design, musica di sottofondo, effetti ambientali).
    4. Sii estremamente tecnico e prolisso. Usa un linguaggio da regista professionista.
    Basati su: ${visualData}. Lingua: ${lang}.` 
  }];
  
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
      thinkingConfig: { thinkingBudget: 12000 },
      responseSchema: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            scene: { type: Type.INTEGER },
            description: { type: Type.STRING, description: "Descrizione visiva tecnica (min 100 parole)" },
            audioSFX: { type: Type.STRING, description: "Sound design e script (min 100 parole)" },
            duration: { type: Type.STRING }
          },
          required: ["scene", "description", "audioSFX", "duration"]
        }
      }
    }
  });

  const res = JSON.parse(response.text || "[]");
  return res;
}
