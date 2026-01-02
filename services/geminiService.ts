
import { GoogleGenAI, Type } from "@google/genai";
import { Platform, AnalysisResult, Language, Scene } from "../types";

// Utilizziamo il modello più recente e stabile per task di testo complessi
const MODEL_NAME = 'gemini-3-flash-preview';

const getAI = () => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) throw new Error("API_KEY_MANCANTE");
  return new GoogleGenAI({ apiKey });
};

function extractJSON(text: string): any {
  if (!text) return null;
  try {
    // Rimuoviamo eventuali markdown o testo extra che il modello potrebbe aggiungere
    const cleaned = text.replace(/```json/g, '').replace(/```/g, '').trim();
    return JSON.parse(cleaned);
  } catch (e) {
    // Tentativo di recupero tramite regex se il JSON è immerso in altro testo
    const match = text.match(/(\{[\s\S]*\}|\[[\s\S]*\])/);
    if (match) {
      try { return JSON.parse(match[0]); } catch { }
    }
    console.error("Errore critico parsing JSON. Output originale:", text);
    throw new Error("Il Master ha inviato un formato dati non valido.");
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
  const response = await ai.models.generateContent({
    model: MODEL_NAME,
    contents: [{
      parts: [
        { inlineData: { data: base64, mimeType: file.type || "video/mp4" } },
        { text: `AGISCI COME UN PRODUTTORE YOUTUBE SENIOR CON 20 ANNI DI ESPERIENZA. Analizza questo video per ${platform} in lingua ${lang}. Sii spietato. Restituisci un JSON con score XX/100, titolo virale, analisi critica, caption pronta all'uso, hashtags, e 'visualData' che riassuma lo stile visivo per uno storyboard successivo.` }
      ]
    }],
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

  parts.push({ text: `PRODUTTORE SENIOR: Crea una strategia virale per ${platform} in ${lang}. 
    Input utente: "${prompt}". 
    ${imageFile ? "Analizza anche l'immagine fornita come riferimento visivo." : ""}
    Rispondi in JSON.` 
  });

  const response = await ai.models.generateContent({
    model: MODEL_NAME,
    contents: [{ parts }],
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
    contents: `PRODUTTORE SENIOR: Genera uno storyboard tecnico schematico basato su questi dati: "${visualData}". 
    Lingua: ${lang}. Sii conciso ma professionale. Restituisci SOLO un array JSON di scene.`,
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
  return extractJSON(response.text);
}
