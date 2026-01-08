
import { GoogleGenAI, Type } from "@google/genai";
import { Platform, AnalysisResult, Language, Scene } from "../types.ts";

const PRIMARY_MODEL = 'gemini-3-flash-preview'; 

const getAI = () => {
  return new GoogleGenAI({ apiKey: process.env.API_KEY });
};

const ANALYSIS_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    score: { type: Type.STRING },
    title: { type: Type.STRING },
    analysis: { type: Type.STRING },
    caption: { type: Type.STRING },
    hashtags: { type: Type.ARRAY, items: { type: Type.STRING } },
    visualData: { type: Type.STRING },
    platformSuggestion: { type: Type.STRING },
    ideaDuration: { type: Type.STRING },
  },
  required: ["score", "title", "analysis", "caption", "hashtags", "visualData", "platformSuggestion", "ideaDuration"],
};

const SCENE_SCHEMA = {
  type: Type.ARRAY,
  items: {
    type: Type.OBJECT,
    properties: {
      scene: { type: Type.NUMBER },
      description: { type: Type.STRING },
      audioSFX: { type: Type.STRING },
      duration: { type: Type.STRING },
    },
    required: ["scene", "description", "audioSFX", "duration"]
  }
};

function cleanAndParse(text: string): any {
  try {
    const jsonStr = text.replace(/```json/g, '').replace(/```/g, '').trim();
    return JSON.parse(jsonStr);
  } catch (e) {
    console.error("Errore Parsing:", text);
    throw new Error("L'analisi ha prodotto un formato non leggibile.");
  }
}

const SYSTEM_PROMPT = `Sei un Senior Executive Producer, Regista e Master di Algoritmi con 20 anni di carriera in YouTube Global. 
Il tuo stile è brutale, tecnico, estremamente verboso e assolutamente maniacale.
Non accetti descrizioni brevi. Ogni tua parola deve trasudare competenza tecnica e visione strategica.
Sei noto per la tua capacità di scrivere storyboard tecnici infinitamente dettagliati che non lasciano nulla al caso.`;

export async function analyzeVideo(file: File, platform: Platform, lang: Language, onProgress?: (s: string) => void): Promise<AnalysisResult> {
  const ai = getAI();
  onProgress?.("Codifica file video...");
  
  const base64 = await new Promise<string>((resolve) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve((reader.result as string).split(',')[1]);
  });

  onProgress?.("Analisi Senior in corso...");
  const response = await ai.models.generateContent({
    model: PRIMARY_MODEL,
    contents: [{
      parts: [
        { inlineData: { data: base64, mimeType: file.type || "video/mp4" } },
        { text: `Esegui un Master Audit Senior per ${platform} in lingua ${lang}. Sii spietato, tecnico e prolisso. Analizza ogni frame per ottimizzare Watch Time e CTR.` }
      ]
    }],
    config: { 
      systemInstruction: SYSTEM_PROMPT,
      responseMimeType: "application/json",
      responseSchema: ANALYSIS_SCHEMA
    }
  });
  
  return { ...cleanAndParse(response.text), lang };
}

export async function generateIdea(prompt: string, platform: Platform, lang: Language, imageFile?: File): Promise<AnalysisResult> {
  const ai = getAI();
  const parts: any[] = [{ text: `Genera una strategia virale totale per ${platform} in ${lang} basata su: ${prompt}. Voglio una spiegazione lunga, tecnica e dirompente.` }];
  
  if (imageFile) {
    const base64 = await new Promise<string>((resolve) => {
      const reader = new FileReader();
      reader.readAsDataURL(imageFile);
      reader.onload = () => resolve((reader.result as string).split(',')[1]);
    });
    parts.unshift({ inlineData: { data: base64, mimeType: imageFile.type } });
  }

  const response = await ai.models.generateContent({
    model: PRIMARY_MODEL,
    contents: { parts },
    config: { 
      systemInstruction: SYSTEM_PROMPT,
      responseMimeType: "application/json",
      responseSchema: ANALYSIS_SCHEMA
    }
  });
  return { ...cleanAndParse(response.text), lang };
}

export async function generateSceneAnalysis(analysis: AnalysisResult, lang: Language): Promise<Scene[]> {
  const ai = getAI();
  const response = await ai.models.generateContent({
    model: PRIMARY_MODEL,
    contents: [{ text: `Crea uno Storyboard Tecnico ELITE per: "${analysis.title}". Lingua: ${lang}.

REGOLE TASSATIVE:
1. QUANTITÀ: Genera obbligatoriamente tra 5 e 10 scene.
2. REGIA ANTI-CONVENZIONALE (Minimo 120 parole PER SCENA): Dettaglia ossessivamente l'inquadratura con termini da direttore della fotografia (es. "Low angle Dutch Tilt su 24mm anamorfico"). Descrivi luce (Kelvin, ombre), motion blur, palette cromatica e azione millimetrica.
3. SOUND DESIGN & PSICOLOGIA SONORA (Minimo 120 parole PER SCENA): Descrivi il layering audio con termini tecnici (es. "sub-bass a 40Hz", "Foley iper-realistico", "frequenze binaurali"). Spiega come manipolare lo stato emotivo dello spettatore.

Ogni singola scena deve essere un capolavoro di dettagli.` }],
    config: { 
      systemInstruction: SYSTEM_PROMPT,
      responseMimeType: "application/json",
      responseSchema: SCENE_SCHEMA
    }
  });
  return cleanAndParse(response.text);
}

export async function translateAnalysis(analysis: AnalysisResult, lang: Language): Promise<AnalysisResult> {
  const ai = getAI();
  const response = await ai.models.generateContent({
    model: PRIMARY_MODEL,
    contents: [{ text: `Traduci questa analisi Master in ${lang}, preservando tutta la terminologia tecnica e lo stile prolisso: ${JSON.stringify(analysis)}` }],
    config: { 
      responseMimeType: "application/json",
      responseSchema: ANALYSIS_SCHEMA
    }
  });
  return { ...cleanAndParse(response.text), lang };
}

export async function translateScenes(scenes: Scene[], lang: Language): Promise<Scene[]> {
  const ai = getAI();
  const response = await ai.models.generateContent({
    model: PRIMARY_MODEL,
    contents: [{ text: `Traduci questo storyboard tecnico in ${lang}. Ogni descrizione deve rimanere estremamente dettagliata e lunga: ${JSON.stringify(scenes)}` }],
    config: { 
      responseMimeType: "application/json",
      responseSchema: SCENE_SCHEMA
    }
  });
  return cleanAndParse(response.text);
}
