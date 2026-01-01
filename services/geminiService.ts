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
    
    contentParts.push({
      inlineData: { data: base64, mimeType: file.type }
    });
    
    contentParts.push({
      text: `AUDIT REALE DELLE SCENE. Analizza i fotogrammi di QUESTO VIDEO specifico.
      Basandoti su questa strategia: "${visualData}", scrivi un'analisi tecnica scena per scena del video che vedi. 
      Sii estremamente critico: descrivi cosa succede realmente e come deve cambiare tecnicamente.
      
      REQUISITO DI LUNGHEZZA: Ogni singola "description" DEVE avere ALMENO 100 PAROLE. 
      Descrivi inquadrature, espressioni, testi a video e movimenti di camera reali.
      Lingua: ${lang}. Rispondi in formato JSON.`
    });
  } else {
    contentParts.push({
      text: `Crea un'analisi tecnica delle scene basata su questa idea: "${visualData}". 
      Ogni singola "description" DEVE avere ALMENO 100 PAROLE. 
      Lingua: ${lang}. Rispondi in formato JSON.`
    });
  }
  
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
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

  const text = response.text;
  if (!text) throw new Error("Empty response from AI");
  
  try {
    return JSON.parse(text);
  } catch (e) {
    console.error("Failed to parse JSON:", text);
    throw new Error("JSON parsing failed");
  }
}
