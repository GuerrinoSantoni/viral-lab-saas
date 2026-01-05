
import { GoogleGenAI, Type } from "@google/genai";
import { Platform, AnalysisResult, Language, Scene } from "../types";

const PRIMARY_MODEL = 'gemini-3-flash-preview'; 

const getAI = () => {
  if (!process.env.API_KEY) throw new Error("API_KEY_MANCANTE");
  return new GoogleGenAI({ apiKey: process.env.API_KEY });
};

const ANALYSIS_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    score: { type: Type.STRING, description: "Solo il numero da 0 a 100, senza simboli o slash." },
    title: { type: Type.STRING },
    analysis: { type: Type.STRING },
    caption: { type: Type.STRING, description: "Testo di copywriting persuasivo di almeno 50-80 parole." },
    hashtags: { type: Type.ARRAY, items: { type: Type.STRING } },
    visualData: { type: Type.STRING },
    platformSuggestion: { type: Type.STRING },
    ideaDuration: { type: Type.STRING },
  },
  required: ["score", "title", "analysis", "caption", "hashtags", "visualData", "platformSuggestion", "ideaDuration"],
};

function cleanAndParse(text: string): any {
  if (!text) return null;
  try {
    const jsonStr = text.replace(/```json/g, '').replace(/```/g, '').trim();
    return JSON.parse(jsonStr);
  } catch (e) {
    console.error("Errore Parsing JSON:", text);
    throw new Error("L'IA ha generato un formato non valido.");
  }
}

const SENIOR_SYSTEM_INSTRUCTION = `Sei il 'Gran Maestro dei Social Media', un Executive Producer con 20 anni di successi mondiali. 
REGOLE DI RISPOSTA:
1. Sii incisivo ma tecnico. Le sezioni di analisi devono essere di circa 100 parole.
2. Il campo 'caption' deve essere un capolavoro di copywriting di ALMENO 50-80 parole.
3. Il campo 'score' deve essere ESCLUSIVAMENTE un numero tra 0 e 100.
4. Usa gergo da industria cinematografica e marketing avanzato.`;

export async function translateAnalysis(data: AnalysisResult, targetLang: Language): Promise<AnalysisResult> {
  const ai = getAI();
  const response = await ai.models.generateContent({
    model: PRIMARY_MODEL,
    contents: [{ text: `Traduci integralmente questo report in ${targetLang}. 
    MANTENERE LO STILE TECNICO SENIOR E AUTOREVOLE. Mantieni la lunghezza e il dettaglio, specialmente nel copywriting.
    JSON: ${JSON.stringify(data)}` }],
    config: { 
      responseMimeType: "application/json",
      responseSchema: ANALYSIS_SCHEMA
    }
  });
  const translated = cleanAndParse(response.text);
  return { ...translated, lang: targetLang };
}

export async function translateScenes(scenes: Scene[], targetLang: Language): Promise<Scene[]> {
  const ai = getAI();
  const response = await ai.models.generateContent({
    model: PRIMARY_MODEL,
    contents: [{ text: `Traduci queste scene di storyboard in ${targetLang}. 
    MANTENI IL LIVELLO DI DETTAGLIO ESTREMO (100+ parole per scena). 
    Mantieni i dettagli tecnici per regia e audio.
    JSON: ${JSON.stringify(scenes)}` }],
    config: { 
      responseMimeType: "application/json",
      responseSchema: {
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
      }
    }
  });
  return cleanAndParse(response.text);
}

export async function analyzeVideo(
  file: File, 
  platform: Platform, 
  lang: Language, 
  onProgress?: (step: string) => void
): Promise<AnalysisResult> {
  const ai = getAI();
  onProgress?.("Inizializzazione Scan Senior...");
  
  const base64 = await new Promise<string>((resolve) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve((reader.result as string).split(',')[1]);
  });

  const response = await ai.models.generateContent({
    model: PRIMARY_MODEL,
    contents: {
      parts: [
        { inlineData: { data: base64, mimeType: file.type || "video/mp4" } },
        { text: `Esegui un Master Audit Senior per ${platform} in ${lang}. 
        REQUISITI MANDATORI: 
        - Score: un numero da 0 a 100.
        - Analisi Strategica: 100 parole.
        - Copywriting (caption): ALMENO 60 parole ad alta conversione.
        Sii tecnico e brutale.` }
      ]
    },
    config: { 
      systemInstruction: SENIOR_SYSTEM_INSTRUCTION,
      responseMimeType: "application/json",
      responseSchema: ANALYSIS_SCHEMA,
    }
  });
  return { ...cleanAndParse(response.text), lang };
}

export async function generateIdea(
  prompt: string, 
  platform: Platform, 
  lang: Language, 
  imageFile?: File
): Promise<AnalysisResult> {
  const ai = getAI();
  const parts: any[] = [];
  if (imageFile) {
    const base64 = await new Promise<string>((resolve) => {
      const reader = new FileReader();
      reader.readAsDataURL(imageFile);
      reader.onload = () => resolve((reader.result as string).split(',')[1]);
    });
    parts.push({ inlineData: { data: base64, mimeType: imageFile.type } });
  }
  parts.push({ text: `Crea strategia virale per ${platform} in ${lang}: "${prompt}". 
  MANDATORIO: Il campo caption deve essere lungo almeno 60 parole. Lo score deve essere un numero puro tra 0 e 100.` });

  const response = await ai.models.generateContent({
    model: PRIMARY_MODEL,
    contents: { parts },
    config: { 
      systemInstruction: SENIOR_SYSTEM_INSTRUCTION,
      responseMimeType: "application/json",
      responseSchema: ANALYSIS_SCHEMA,
    }
  });
  return { ...cleanAndParse(response.text), lang };
}

export async function generateSceneAnalysis(visualData: string, lang: Language): Promise<Scene[]> {
  const ai = getAI();
  const response = await ai.models.generateContent({
    model: PRIMARY_MODEL,
    contents: [{ text: `Agisci come un Regista e Sound Designer Senior. 
    Crea uno storyboard tecnico di 5-10 scene in ${lang} basato su: "${visualData}". 
    REGOLE PER OGNI SCENA:
    - DESCRIZIONE VISIVA: Minimo 120 parole di dettagli tecnici su lenti, movimenti camera, luci e recitazione.
    - AUDIO/SFX: Minimo 80 parole sulla strategia sonora, livelli decibel, sound layers e musica. 
    Sii estremamente tecnico e prolisso.` }],
    config: { 
      responseMimeType: "application/json",
      responseSchema: {
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
      }
    }
  });
  return cleanAndParse(response.text);
}
