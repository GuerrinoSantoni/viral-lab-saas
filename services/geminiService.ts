
import { GoogleGenAI, Type } from "@google/genai";
import { Platform, AnalysisResult, Language, Scene } from "../types";

// Modello PRO per analisi profonde e stabili, FLASH per lo storyboard rapido
const PRO_MODEL = 'gemini-3-pro-preview'; 
const FLASH_MODEL = 'gemini-3-flash-preview'; 

const getAI = () => {
  if (!process.env.API_KEY) throw new Error("API_KEY_MANCANTE");
  return new GoogleGenAI({ apiKey: process.env.API_KEY });
};

const ANALYSIS_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    score: { type: Type.STRING, description: "Punteggio virale (es. 85/100)" },
    title: { type: Type.STRING, description: "Titolo accattivante" },
    analysis: { type: Type.STRING, description: "Critica costruttiva senior dettagliata (minimo 150 parole)" },
    caption: { type: Type.STRING, description: "Testo del post strategico (minimo 150 parole)" },
    hashtags: { type: Type.ARRAY, items: { type: Type.STRING } },
    visualData: { type: Type.STRING, description: "Descrizione della struttura visiva e ritmica (minimo 150 parole)" },
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
    throw new Error("L'IA ha generato un formato non valido. Riprova tra un istante.");
  }
}

const SENIOR_SYSTEM_INSTRUCTION = `Sei un Producer e Strategist Senior di YouTube/Social Media con 20 anni di esperienza internazionale. 
Hai gestito canali da milioni di iscritti. Il tuo stile è brutale, tecnico, analitico e orientato al business. 
Non fai complimenti gratuiti. Ogni tua parola deve trasudare competenza cinematografica e di marketing. 
Usi termini come 'retention hook', 'pacing', 'color science', 'CTR optimization', 'A/B testing visuale'. 
Ogni sezione della tua analisi DEVE essere lunga, dettagliata e superare le 150 parole.`;

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
    reader.onerror = () => reject(new Error("Errore lettura file video."));
  });

  onProgress?.("Audit Senior con Gemini 3 Pro...");
  
  try {
    const response = await ai.models.generateContent({
      model: PRO_MODEL,
      contents: {
        parts: [
          { inlineData: { data: base64, mimeType: file.type || "video/mp4" } },
          { text: `Esegui un Master Audit completo del video per la piattaforma ${platform} in lingua ${lang}. 
          Analizza frame per frame. 
          Sii prolisso: scrivi almeno 150-200 parole per l'analisi strategica, per la struttura visiva e per il copy.` }
        ]
      },
      config: { 
        systemInstruction: SENIOR_SYSTEM_INSTRUCTION,
        responseMimeType: "application/json",
        responseSchema: ANALYSIS_SCHEMA,
        temperature: 0.7,
      }
    });

    if (!response.text) throw new Error("Risposta vuota dai server Google.");
    return cleanAndParse(response.text);
  } catch (error: any) {
    if (error.message?.includes('500') || error.message?.includes('INTERNAL')) {
      throw new Error("I server Google sono sovraccarichi. Riprova con un video più breve o attendi 10 secondi.");
    }
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

  parts.push({ text: `Genera una strategia virale rivoluzionaria per ${platform} in lingua ${lang} basata su: "${prompt}". 
  Voglio un'analisi senior di almeno 150 parole per sezione.` });

  const response = await ai.models.generateContent({
    model: PRO_MODEL,
    contents: { parts },
    config: { 
      systemInstruction: SENIOR_SYSTEM_INSTRUCTION,
      responseMimeType: "application/json",
      responseSchema: ANALYSIS_SCHEMA,
      temperature: 0.8,
    }
  });
  return cleanAndParse(response.text);
}

export async function generateSceneAnalysis(visualData: string, lang: Language): Promise<Scene[]> {
  const ai = getAI();
  const response = await ai.models.generateContent({
    model: FLASH_MODEL,
    contents: {
        parts: [{ text: `AGISCI COME UN REGISTA E DIRETTORE DELLA FOTOGRAFIA SENIOR. 
        Crea uno storyboard tecnico cinematografico di 6 scene basato su questo input: "${visualData}".
        
        REGOLE MANDATORIE PER OGNI SCENA:
        1. DESCRIZIONE VISIVA: Minimo 120 parole di puro dettaglio tecnico.
        2. AUDIO STRATEGY: Minimo 80 parole di sound design stratificato.
        3. Lingua: ${lang}.` }]
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
