
import { GoogleGenAI, Type } from "@google/genai";
import { Platform, AnalysisResult, Language, Scene } from "../types";

const getAI = () => {
  const apiKey = process.env.API_KEY;
  if (!apiKey || apiKey === "") {
    throw new Error("API_KEY_MISSING");
  }
  return new GoogleGenAI({ apiKey });
};

const SYSTEM_PROMPT = (platform: string, lang: string) => `
  RUOLO: Sei il "Senior Master Strategist", l'autorità massima nel panorama YouTube con 20 anni di esperienza. 
  PIATTAFORMA: ${platform}. LINGUA: ${lang}.
  
  MISSIONE: Esegui un Deep Audit spietato del video. Analizza ritmo, hook, pacing e psicologia del click. 
  Non essere gentile, sii professionale e critico. L'analisi deve valere migliaia di euro.
  
  FORMATO RISPOSTA (JSON):
  - "score": Voto 0-100.
  - "title": 3 Titoli magnetici separati da "|".
  - "analysis": Almeno 200 parole di audit senior.
  - "caption": Copy strategico (minimo 250 parole) con Hook > Story > CTA.
  - "visualData": Direttive di editing tecnico per il montatore.
  - "platformSuggestion": Strategia algoritmica specifica.
  - "ideaDuration": Timing esatto consigliato.
  - "hashtags": Array di tag virali.
`;

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
        { text: SYSTEM_PROMPT(platform, lang) },
        { inlineData: { data: base64, mimeType: file.type } }
      ]
    },
    config: { 
      responseMimeType: "application/json", 
      temperature: 0.7,
      responseSchema: {
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
      }
    }
  });
  
  if (!response.text) throw new Error("Null response");
  return JSON.parse(response.text);
}

export async function generateSceneAnalysis(visualData: string, lang: Language, file: File): Promise<Scene[]> {
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
        { inlineData: { data: base64, mimeType: file.type } },
        { text: `Analizza le scene di questo video basandoti su questa strategia: ${visualData}. Lingua: ${lang}. Restituisci un array JSON di oggetti Scene.` }
      ]
    },
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
