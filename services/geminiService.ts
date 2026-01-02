
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
    throw new Error("Errore di formattazione della risposta. Riprova.");
  }
}

export async function analyzeVideo(
  file: File, 
  platform: Platform, 
  lang: Language, 
  onProgress?: (step: string) => void
): Promise<AnalysisResult> {
  const ai = getAI();
  
  onProgress?.("Ottimizzazione stream video...");
  const base64 = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve((reader.result as string).split(',')[1]);
    reader.onerror = () => reject(new Error("Errore durante la lettura del file."));
  });

  onProgress?.("Analisi Senior Master in corso (20y experience)...");
  
  const response = await ai.models.generateContent({
    model: MODEL_NAME,
    contents: [{
      parts: [
        { inlineData: { data: base64, mimeType: file.type || "video/mp4" } },
        { text: `AGISCI COME UN PRODUTTORE YOUTUBE SENIOR CON 20 ANNI DI ESPERIENZA NEI MEDIA DIGITALI.
          Analizza questo video per la piattaforma ${platform} in lingua ${lang}. 
          Sii estremamente tecnico e professionale.
          
          DEVI RESTITUIRE RIGOROSAMENTE UN OGGETTO JSON CON QUESTE CHIAVI:
          {
            "score": "voto numerico 0-100 basato sulla qualità produttiva",
            "title": "3 Titoli Magnetici con alto CTR separati da |",
            "analysis": "Un'analisi tecnica profonda di almeno 400 parole. Commenta il pacing, la color science, la qualità dell'audio e la struttura narrativa (Hook, Body, CTA).",
            "caption": "Copy persuasivo con tecniche di copywriting avanzato",
            "hashtags": ["tag1", "tag2", "tag3"],
            "visualData": "Una cronologia dettagliata di ciò che accade nel video, fondamentale per creare lo storyboard successivo.",
            "platformSuggestion": "Consiglio specifico per scalare l'algoritmo di ${platform}",
            "ideaDuration": "Durata consigliata per massimizzare la retention"
          }` 
        }
      ]
    }],
    config: {
      responseMimeType: "application/json"
    }
  });

  const result = extractJSON(response.text);
  if (!result) throw new Error("Risposta del server non valida.");
  return result;
}

export async function generateIdea(prompt: string, platform: Platform, lang: Language): Promise<AnalysisResult> {
  const ai = getAI();
  const response = await ai.models.generateContent({
    model: MODEL_NAME,
    contents: `PRODUTTORE SENIOR: Crea una strategia virale completa per ${platform} in ${lang} basandoti su: "${prompt}". Rispondi esclusivamente in formato JSON.`,
    config: { responseMimeType: "application/json" }
  });
  return extractJSON(response.text);
}

export async function generateSceneAnalysis(visualData: string, lang: Language): Promise<Scene[]> {
  const ai = getAI();
  const response = await ai.models.generateContent({
    model: MODEL_NAME,
    contents: `Basandoti su questo log visivo: "${visualData}", crea uno storyboard tecnico d'elite in lingua ${lang}.
    Dividi il contenuto in 6-8 scene chiave. Per ogni scena descrivi l'inquadratura, il movimento di camera, l'audio e la funzione psicologica della scena.`,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            scene: { type: Type.INTEGER },
            description: { type: Type.STRING, description: "Descrizione visiva tecnica e cinematografica" },
            audioSFX: { type: Type.STRING, description: "Dettagli audio e script vocale" },
            duration: { type: Type.STRING, description: "Timecode o durata" }
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
