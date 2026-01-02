
import { GoogleGenAI, Type } from "@google/genai";
import { Platform, AnalysisResult, Language, Scene } from "../types";

// Utilizziamo i modelli corretti come da documentazione ufficiale
const MAIN_MODEL = 'gemini-3-flash-preview'; 
const LITE_MODEL = 'gemini-flash-lite-latest'; 

// Initialize AI following @google/genai guidelines: use process.env.API_KEY directly in the constructor
const getAI = () => {
  if (!process.env.API_KEY) throw new Error("API_KEY_MANCANTE");
  return new GoogleGenAI({ apiKey: process.env.API_KEY });
};

// Definizione dello schema per garantire che i campi siano SEMPRE presenti
const ANALYSIS_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    score: { type: Type.STRING, description: "Punteggio virale (es. 85/100)" },
    title: { type: Type.STRING, description: "Titolo accattivante" },
    analysis: { type: Type.STRING, description: "Critica costruttiva senior" },
    caption: { type: Type.STRING, description: "Testo del post" },
    hashtags: { type: Type.ARRAY, items: { type: Type.STRING } },
    visualData: { type: Type.STRING, description: "Descrizione visiva per storyboard" },
    platformSuggestion: { type: Type.STRING, description: "Consiglio specifico piattaforma" },
    ideaDuration: { type: Type.STRING, description: "Durata stimata (es. 45s)" },
  },
  required: ["score", "title", "analysis", "caption", "hashtags", "visualData", "platformSuggestion", "ideaDuration"],
};

// Extracted text from response is trimmed before parsing
function cleanAndParse(text: string): any {
  if (!text) return null;
  try {
    // When using responseMimeType: "application/json", backticks are usually absent, but trim is always good
    const jsonStr = text.replace(/```json/g, '').replace(/```/g, '').trim();
    return JSON.parse(jsonStr);
  } catch (e) {
    console.error("Errore Parsing JSON:", text);
    throw new Error("Formato AI non valido.");
  }
}

export async function analyzeVideo(
  file: File, 
  platform: Platform, 
  lang: Language, 
  onProgress?: (step: string) => void
): Promise<AnalysisResult> {
  const ai = getAI();
  onProgress?.("Codifica Stream Master...");
  const base64 = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve((reader.result as string).split(',')[1]);
    reader.onerror = () => reject(new Error("Errore lettura file."));
  });

  onProgress?.("Audit Senior in corso...");
  // Using simplified contents object for generateContent call
  const response = await ai.models.generateContent({
    model: MAIN_MODEL,
    contents: {
      parts: [
        { inlineData: { data: base64, mimeType: file.type || "video/mp4" } },
        { text: `AGISCI COME UN PRODUTTORE YOUTUBE CON 20 ANNI DI ESPERIENZA. Analizza questo video per ${platform} in lingua ${lang}. Sii brutale e tecnico.` }
      ]
    },
    config: { 
      responseMimeType: "application/json",
      responseSchema: ANALYSIS_SCHEMA
    }
  });

  return cleanAndParse(response.text);
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

  parts.push({ text: `PRODUTTORE SENIOR: Crea una strategia virale per ${platform} in lingua ${lang} basata su: "${prompt}".` });

  // Correct contents structure with parts array
  const response = await ai.models.generateContent({
    model: MAIN_MODEL,
    contents: { parts },
    config: { 
      responseMimeType: "application/json",
      responseSchema: ANALYSIS_SCHEMA
    }
  });
  return cleanAndParse(response.text);
}

export async function generateSceneAnalysis(visualData: string, lang: Language): Promise<Scene[]> {
  const ai = getAI();
  // Using direct text input for contents
  const response = await ai.models.generateContent({
    model: MAIN_MODEL,
    contents: `PRODUTTORE SENIOR: Crea uno storyboard tecnico di 6 scene dettagliate. 
        Input visivo: "${visualData}". 
        Lingua: ${lang}. 
        Sii specifico su inquadrature e audio.`,
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
