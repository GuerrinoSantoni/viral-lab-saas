
import { GoogleGenAI } from "@google/genai";
import { Platform, AnalysisResult, Language, Scene } from "../types";

// Utilizziamo Gemini 2.5 Flash: il modello più avanzato e stabile per l'analisi video
const MODEL_NAME = 'gemini-2.5-flash';

const getAI = () => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) throw new Error("API_KEY_MANCANTE");
  return new GoogleGenAI({ apiKey });
};

function extractJSON(text: string): any {
  try {
    // Prova il parsing diretto
    return JSON.parse(text);
  } catch {
    // Se fallisce, cerca i blocchi di codice JSON
    try {
      const regex = /\{[\s\S]*\}/;
      const match = text.match(regex);
      if (match) {
        return JSON.parse(match[0]);
      }
    } catch (e) {
      console.error("Errore nel parsing finale:", e);
    }
  }
  throw new Error("Il Master ha risposto in modo non strutturato. Riprova tra un istante.");
}

export async function analyzeVideo(
  file: File, 
  platform: Platform, 
  lang: Language, 
  onProgress?: (step: string) => void
): Promise<AnalysisResult> {
  const ai = getAI();
  
  onProgress?.("Codifica frame...");
  const base64 = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      const res = reader.result as string;
      resolve(res.split(',')[1]);
    };
    reader.onerror = () => reject(new Error("Errore lettura video locale."));
  });

  onProgress?.("Audit in corso (Gemini 2.5)...");
  
  try {
    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: [{
        parts: [
          { inlineData: { data: base64, mimeType: file.type || "video/mp4" } },
          { text: `AGISCI COME UN PRODUTTORE YOUTUBE SENIOR (20 ANNI DI CARRIERA).
            Analizza questo video per ${platform} in ${lang}.
            Sii spietato e tecnico. Analizza ritmo, montaggio e potenziale virale.
            
            RESTITUISCI SOLO UN OGGETTO JSON VALIDO CON QUESTE CHIAVI:
            {
              "score": "voto 0-100",
              "title": "3 Titoli Magnetici separati da |",
              "analysis": "Audit tecnico dettagliato di almeno 300 parole",
              "caption": "Copy pronto da pubblicare",
              "hashtags": ["tag1", "tag2"],
              "visualData": "Istruzioni per il montaggio/storyboard",
              "platformSuggestion": "Trucco specifico per l'algoritmo",
              "ideaDuration": "Durata ottimale"
            }` 
          }
        ]
      }]
    });

    const text = response.text;
    if (!text) throw new Error("Risposta vuota dai server Google.");
    
    return extractJSON(text);
  } catch (error: any) {
    console.error("DEBUG API:", error);
    throw error;
  }
}

export async function generateIdea(prompt: string, platform: Platform, lang: Language): Promise<AnalysisResult> {
  const ai = getAI();
  const response = await ai.models.generateContent({
    model: MODEL_NAME,
    contents: `PRODUTTORE SENIOR: Crea strategia per ${platform} in ${lang} su: "${prompt}". Rispondi in JSON.`
  });
  return extractJSON(response.text || "{}");
}

export async function generateSceneAnalysis(visualData: string, lang: Language): Promise<Scene[]> {
  const ai = getAI();
  const response = await ai.models.generateContent({
    model: MODEL_NAME,
    contents: `Crea storyboard tecnico in ${lang} per: ${visualData}. Restituisci un array JSON di 6 scene.`
  });
  return extractJSON(response.text || "[]");
}
