
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
    analysis: { type: Type.STRING, description: "Audit tecnico spietato, profondo e descrittivo di COSA SUCCEDE nel video (minimo 500 parole)" },
    caption: { type: Type.STRING, description: "Copy persuasivo strategico" },
    hashtags: { type: Type.ARRAY, items: { type: Type.STRING } },
    visualData: { type: Type.STRING, description: "Analisi visiva dettagliata per lo storyboard" },
    platformSuggestion: { type: Type.STRING, description: "Consigli specifici per l'algoritmo" },
    ideaDuration: { type: Type.STRING, description: "Minutaggio esatto" }
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
  
  // Utilizziamo GEMINI 3 PRO per la massima precisione nell'analisi video
  const response = await ai.models.generateContent({
    model: 'gemini-3-pro-preview',
    contents: {
      parts: [
        { text: `AGISCI COME UN PRODUTTORE SENIOR CON 20 ANNI DI ESPERIENZA. 
        Analizza questo video per ${platform} in ${lang}. 
        NON ESSERE BREVE. Voglio un report dettagliatissimo che spieghi ESATTAMENTE di cosa parla il video, i punti di forza, gli errori tecnici, il carisma del protagonista e come ottimizzare ogni singolo frame per la viralità.` },
        { inlineData: { data: base64, mimeType: file.type } }
      ]
    },
    config: { 
      responseMimeType: "application/json", 
      temperature: 0.1, // Bassa temperatura per massima stabilità e precisione
      thinkingConfig: { thinkingBudget: 16000 },
      responseSchema: RESPONSE_SCHEMA 
    }
  });
  
  return JSON.parse(response.text || "{}");
}

export async function generateIdea(prompt: string, platform: Platform, lang: Language): Promise<AnalysisResult> {
  const ai = getAI();
  // La generazione idea rimane veloce con Gemini 3 Flash come richiesto
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
    text: `CREA UNO STORYBOARD TECNICO SENIOR (20 ANNI DI ESPERIENZA). 
    REGOLE MANDATORIE E INVIOLABILI:
    1. Genera ESATTAMENTE tra 5 e 10 scene.
    2. Per OGNI scena, il campo "description" DEVE superare le 100 PAROLE. Descrivi inquadratura (es: Wide Shot, Close Up), lenti usate (es: 35mm f1.8), movimenti (es: Slow Pan Right), color grading, oggetti di scena e la recitazione millimetrica.
    3. Per OGNI scena, il campo "audioSFX" DEVE superare le 100 PAROLE. Descrivi lo script parlato parola per parola, le pause drammatiche, il sound design (es: rumore di passi su ghiaia con riverbero), la musica (es: Lo-Fi beats che salgono di volume al sec 5) e gli effetti sonori.
    4. Linguaggio: ${lang}. Sii prolisso, tecnico e maniacale. Se scrivi poco, il lavoro è inutile.` 
  }];
  
  if (file) {
    const base64 = await new Promise<string>((resolve) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve((reader.result as string).split(',')[1]);
    });
    parts.push({ inlineData: { data: base64, mimeType: file.type } });
  }

  // Utilizziamo il massimo del Thinking Budget per gestire la mole massiccia di testo
  const response = await ai.models.generateContent({
    model: 'gemini-3-pro-preview',
    contents: { parts },
    config: { 
      responseMimeType: "application/json",
      temperature: 0.2,
      thinkingConfig: { thinkingBudget: 32768 }, // Massimo budget per Gemini 3 Pro
      responseSchema: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            scene: { type: Type.INTEGER },
            description: { type: Type.STRING, description: "Descrizione visiva tecnica ULTRA DETTAGLIATA (MINIMO 100 PAROLE)" },
            audioSFX: { type: Type.STRING, description: "Sound design e script completo ULTRA DETTAGLIATO (MINIMO 100 PAROLE)" },
            duration: { type: Type.STRING }
          },
          required: ["scene", "description", "audioSFX", "duration"]
        }
      }
    }
  });

  return JSON.parse(response.text || "[]");
}
