
import { GoogleGenAI, Type } from "@google/genai";
import { Platform, AnalysisResult, Language, Scene } from "../types";

// Usiamo FLASH per tutto: è molto più disponibile nella quota gratuita e ora estremamente potente
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
    throw new Error("L'IA ha generato un formato non valido. Prova a ridurre leggermente la complessità del video.");
  }
}

const SENIOR_SYSTEM_INSTRUCTION = `Sei il 'Gran Maestro dei Social Media', un Producer con 20 anni di successi su YouTube, TikTok e IG. 
Il tuo compito è fornire audit tecnici che nessun altro può dare. 
REGOLE DI RISPOSTA:
1. NON ESSERE CONCISO. Ogni sezione (analysis, visualData, caption) DEVE essere un saggio tecnico di almeno 150-200 parole.
2. Usa un linguaggio da insider: 'hook optimization', 'high-retention editing', 'color grading psicologico', 'pattern interrupt'.
3. Analizza il video frame per frame nella tua mente prima di scrivere.
4. Sii critico, cinico e orientato ai risultati monetizzabili.`;

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

  onProgress?.("Audit Senior in corso (High-Speed Mode)...");
  
  try {
    const response = await ai.models.generateContent({
      model: PRIMARY_MODEL,
      contents: {
        parts: [
          { inlineData: { data: base64, mimeType: file.type || "video/mp4" } },
          { text: `Esegui un Audit Master per ${platform} in ${lang}. 
          Sii estremo nei dettagli. Scrivi trattati tecnici lunghi per ogni campo del JSON. 
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
    console.error("Gemini Error:", error);
    if (error.message?.includes('429')) {
      throw new Error("LIMITE QUOTA RAGGIUNTO: Attendi 60 secondi prima del prossimo audit.");
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

  parts.push({ text: `Crea una strategia virale per ${platform} in ${lang} su questa idea: "${prompt}". 
  REGOLE: Almeno 150 parole per sezione. Dettagli tecnici massimi.` });

  try {
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
  } catch (error: any) {
    if (error.message?.includes('429')) throw new Error("LIMITE QUOTA: Attendi 60 secondi.");
    throw error;
  }
}

export async function generateSceneAnalysis(visualData: string, lang: Language): Promise<Scene[]> {
  const ai = getAI();
  try {
    const response = await ai.models.generateContent({
      model: PRIMARY_MODEL,
      contents: {
          parts: [{ text: `REGISTA SENIOR: Crea uno storyboard tecnico per: "${visualData}". 
          REGOLE MANDATORIE:
          1. Genera un numero di scene compreso tra 5 e 10 (decidi tu in base alla complessità).
          2. Ogni Scena: minimo 120 parole descrittive di dettagli tecnici (lenti, luci, movimenti).
          3. Audio Strategy: 80 parole di sound design stratificato.
          4. Lingua: ${lang}.` }]
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
  } catch (error: any) {
    if (error.message?.includes('429')) throw new Error("LIMITE QUOTA: Attendi un minuto.");
    throw error;
  }
}
