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
  Sei un Senior YouTuber Master Strategist con 20 anni di esperienza e 500M di views totali.
  Piattaforma: ${platform}. Lingua: ${lang}. Sii spietato, tecnico e focalizzato sul business.

  REQUISITI MANDATORI PER IL RISULTATO:
  1. "caption": Deve essere un testo strategico di ALMENO 150 PAROLE. Struttura: Hook shock, Body con storytelling profondo, curiosity gap e CTA multipla potente. Non essere sintetico.
  2. "visualData": IDEA CREATIVA DETTAGLIATA (Visione artistica, ritmo, montaggio). Spiega il PERCHÉ tecnico di ogni scelta.
  3. "analysis": Insight tecnico senior (max 250 caratteri).
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
    model: 'gemini-3-flash-preview',
    contents: {
      parts: [
        { text: SYSTEM_PROMPT_BASE(platform, lang) + " Analizza questo video esistente e dimmi come migliorarlo per renderlo virale. Sii estremamente prolisso nella caption." },
        { inlineData: { data: base64, mimeType: file.type } }
      ]
    },
    config: { responseMimeType: "application/json", temperature: 0.9, responseSchema: RESPONSE_SCHEMA }
  });
  return JSON.parse(response.text || "{}");
}

export async function analyzePrompt(prompt: string, platform: Platform, lang: Language): Promise<AnalysisResult> {
  const ai = getAI();
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: {
      parts: [
        { text: SYSTEM_PROMPT_BASE(platform, lang) + ` Crea da zero una strategia virale basandoti su questo input: "${prompt}". La caption deve superare le 150 parole.` }
      ]
    },
    config: { responseMimeType: "application/json", temperature: 1.0, responseSchema: RESPONSE_SCHEMA }
  });
  return JSON.parse(response.text || "{}");
}

export async function generateScriptOnly(visualData: string, lang: Language): Promise<Scene[]> {
  const ai = getAI();
  const prompt = `Trasforma questa IDEA VISUALE in un'analisi tecnica delle scene (Analisi delle scene) estrema.
  Idea: ${visualData}. Lingua: ${lang}.
  
  REQUISITO DI LUNGHEZZA CRITICO: 
  Ogni singola "description" di ogni scena DEVE contenere ALMENO 100 PAROLE. 
  Descrivi ogni dettaglio: inquadratura, movimenti di camera, espressioni, colori, scritte a video, ritmi di taglio.
  Ogni "audioSFX" deve descrivere dettagliatamente il sound design (musica, effetti, toni di voce).
  
  Genera 5-7 scene. Non accettare risposte brevi. Sii logorroico e ultra-tecnico.`;
  
  const response = await ai.models.generateContent({
    model: 'gemini-3-pro-preview', // Passiamo al modello Pro per gestire meglio il requisito di lunghezza estrema
    contents: { parts: [{ text: prompt }] },
    config: { 
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            scene: { type: Type.INTEGER },
            description: { type: Type.STRING, description: "Descrizione visiva tecnica di oltre 100 parole" },
            audioSFX: { type: Type.STRING, description: "Sound design dettagliato" },
            duration: { type: Type.STRING }
          },
          required: ["scene", "description", "audioSFX", "duration"]
        }
      }
    }
  });
  return JSON.parse(response.text || "[]");
}
