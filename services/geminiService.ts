
import { GoogleGenAI, Type } from "@google/genai";
import { Platform, AnalysisResult, Language, Scene } from "../types";

// Gemini 2.5 Flash è ottimizzato per processare frame video pesanti con bassa latenza
const MODEL_NAME = 'gemini-2.5-flash';

const getAI = () => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) throw new Error("API_KEY_MANCANTE");
  return new GoogleGenAI({ apiKey });
};

function extractJSON(text: string): any {
  if (!text) return null;
  try {
    const cleaned = text.replace(/```json/g, '').replace(/```/g, '').trim();
    return JSON.parse(cleaned);
  } catch (e) {
    const match = text.match(/\{[\s\S]*\}/);
    if (match) {
      try { return JSON.parse(match[0]); } catch { }
    }
    const arrayMatch = text.match(/\[[\s\S]*\]/);
    if (arrayMatch) {
      try { return JSON.parse(arrayMatch[0]); } catch { }
    }
    console.error("Errore critico parsing JSON:", text);
    throw new Error("Il Master ha generato un output non leggibile. Riprova con un video più breve.");
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
    reader.onerror = () => reject(new Error("Errore durante la lettura del file."));
  });

  onProgress?.("Audit Senior in corso (20y experience)...");
  
  const response = await ai.models.generateContent({
    model: MODEL_NAME,
    contents: [{
      parts: [
        { inlineData: { data: base64, mimeType: file.type || "video/mp4" } },
        { text: `AGISCI COME UN PRODUTTORE YOUTUBE SENIOR CON 20 ANNI DI ESPERIENZA.
          Analizza questo video per ${platform} in lingua ${lang}. Sii spietato e tecnico.
          
          IL PUNTEGGIO (score) DEVE ESSERE NEL FORMATO "XX/100" (es: "85/100").
          L'ANALISI (analysis) DEVE ESSERE DI ALMENO 400 PAROLE DETTAGLIATE.` 
        }
      ]
    }],
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          score: { type: Type.STRING, description: "Punteggio nel formato XX/100" },
          title: { type: Type.STRING, description: "Titolo magnetico ad alto CTR" },
          analysis: { type: Type.STRING, description: "Analisi tecnica profonda di 400+ parole" },
          caption: { type: Type.STRING, description: "Copy persuasivo per il post" },
          hashtags: { 
            type: Type.ARRAY, 
            items: { type: Type.STRING } 
          },
          visualData: { type: Type.STRING, description: "Log dettagliato dei frame per lo storyboard" },
          platformSuggestion: { type: Type.STRING, description: "Consiglio per l'algoritmo" },
          ideaDuration: { type: Type.STRING, description: "Durata ideale suggerita" }
        },
        required: ["score", "title", "analysis", "caption", "hashtags", "visualData", "platformSuggestion", "ideaDuration"]
      }
    }
  });

  const result = extractJSON(response.text);
  if (!result) throw new Error("Risposta del server vuota o non valida.");
  return result;
}

export async function generateIdea(prompt: string, platform: Platform, lang: Language): Promise<AnalysisResult> {
  const ai = getAI();
  const response = await ai.models.generateContent({
    model: MODEL_NAME,
    contents: `PRODUTTORE SENIOR: Crea una strategia virale completa per ${platform} in ${lang} basandoti su: "${prompt}". Rispondi esclusivamente in formato JSON. Il punteggio deve essere XX/100.`,
    config: { 
      responseMimeType: "application/json",
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
  return extractJSON(response.text);
}

export async function generateSceneAnalysis(visualData: string, lang: Language): Promise<Scene[]> {
  const ai = getAI();
  const response = await ai.models.generateContent({
    model: MODEL_NAME,
    contents: `PRODUTTORE SENIOR STORYBOARD: Basandoti su: "${visualData}", crea uno storyboard tecnico d'elite in lingua ${lang}.
    Dividi in 6 scene. Dettaglia inquadratura, audio e SFX.`,
    config: {
      responseMimeType: "application/json",
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
  
  const result = extractJSON(response.text);
  if (!Array.isArray(result)) throw new Error("Formato storyboard non valido.");
  return result;
}
