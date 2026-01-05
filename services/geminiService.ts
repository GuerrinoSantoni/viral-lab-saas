
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
    score: { type: Type.STRING, description: "Punteggio virale (es. 85/100)" },
    title: { type: Type.STRING, description: "Titolo accattivante" },
    analysis: { type: Type.STRING, description: "Critica costruttiva senior dettagliata (MANDATORIO: minimo 150 parole)" },
    caption: { type: Type.STRING, description: "Testo del post strategico (MANDATORIO: minimo 150 parole)" },
    hashtags: { type: Type.ARRAY, items: { type: Type.STRING } },
    visualData: { type: Type.STRING, description: "Descrizione della struttura visiva e ritmica (MANDATORIO: minimo 150 parole)" },
    platformSuggestion: { type: Type.STRING, description: "Consiglio specifico piattaforma" },
    ideaDuration: { type: Type.STRING, description: "Durata stimata" },
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

const SENIOR_SYSTEM_INSTRUCTION = `Sei il 'Gran Maestro dei Social Media', un Producer con 20 anni di successi. 
REGOLE DI RISPOSTA:
1. NON ESSERE CONCISO. Almeno 150-200 parole per sezione.
2. Usa linguaggio tecnico: 'retention optimization', 'pacing', 'visual hook'.`;

export async function translateAnalysis(data: AnalysisResult, targetLang: Language): Promise<AnalysisResult> {
  const ai = getAI();
  const response = await ai.models.generateContent({
    model: PRIMARY_MODEL,
    contents: [{ text: `Traduci il seguente oggetto JSON di analisi strategica social media in lingua ${targetLang}. 
    MANTENERE LO STILE TECNICO, SENIOR E PROLISSO. 
    NON riassumere, traduci ogni parola mantenendo la lunghezza di circa 150-200 parole per sezione. 
    JSON: ${JSON.stringify(data)}` }],
    config: { 
      responseMimeType: "application/json",
      responseSchema: ANALYSIS_SCHEMA
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
  onProgress?.("Preparazione Master Stream...");
  
  const base64 = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve((reader.result as string).split(',')[1]);
    reader.onerror = () => reject(new Error("Errore lettura file video."));
  });

  onProgress?.("Audit Senior in corso...");
  
  try {
    const response = await ai.models.generateContent({
      model: PRIMARY_MODEL,
      contents: {
        parts: [
          { inlineData: { data: base64, mimeType: file.type || "video/mp4" } },
          { text: `Esegui un Audit Master per ${platform} in ${lang}. 
          Voglio almeno 150 parole per Analysis, 150 per VisualData e 150 per Caption.` }
        ]
      },
      config: { 
        systemInstruction: SENIOR_SYSTEM_INSTRUCTION,
        responseMimeType: "application/json",
        responseSchema: ANALYSIS_SCHEMA,
        temperature: 0.9,
      }
    });

    if (!response.text) throw new Error("Risposta vuota dai server.");
    return cleanAndParse(response.text);
  } catch (error: any) {
    if (error.message?.includes('429')) throw new Error("LIMITE QUOTA RAGGIUNTO: Attendi 60 secondi.");
    throw error;
  }
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
  parts.push({ text: `Crea strategia virale per ${platform} in ${lang}: "${prompt}". Almeno 150 parole per sezione.` });

  const response = await ai.models.generateContent({
    model: PRIMARY_MODEL,
    contents: { parts },
    config: { 
      systemInstruction: SENIOR_SYSTEM_INSTRUCTION,
      responseMimeType: "application/json",
      responseSchema: ANALYSIS_SCHEMA,
    }
  });
  return cleanAndParse(response.text);
}

export async function generateSceneAnalysis(visualData: string, lang: Language): Promise<Scene[]> {
  const ai = getAI();
  const response = await ai.models.generateContent({
    model: PRIMARY_MODEL,
    contents: {
        parts: [{ text: `REGISTA SENIOR: Crea storyboard tecnico per: "${visualData}". 
        5-10 scene. Ogni Scena: 120 parole dettagliate. Audio: 80 parole. Lingua: ${lang}.` }]
    },
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
