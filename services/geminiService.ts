
import { GoogleGenAI, Type } from "@google/genai";
import { Platform, AnalysisResult, Language, Scene } from "../types";

// Modello richiesto: Gemini 3 Flash
const MODEL_NAME = 'gemini-3-flash-preview';

const getAI = () => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) throw new Error("API_KEY_MISSING");
  return new GoogleGenAI({ apiKey });
};

function cleanJSON(text: string): string {
  if (!text) return "{}";
  // Rimuove markdown e pulisce il testo per il parsing JSON
  let cleaned = text.replace(/```json/g, '').replace(/```/g, '').trim();
  const start = cleaned.indexOf('{');
  const end = cleaned.lastIndexOf('}');
  if (start !== -1 && end !== -1) {
    cleaned = cleaned.substring(start, end + 1);
  }
  return cleaned;
}

export async function analyzeVideo(
  file: File, 
  platform: Platform, 
  lang: Language, 
  onProgress?: (step: string) => void
): Promise<AnalysisResult> {
  const ai = getAI();
  
  onProgress?.("Preparazione stream video...");
  const base64 = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve((reader.result as string).split(',')[1]);
    reader.onerror = (e) => reject(new Error("Errore lettura file: " + e));
  });

  // Determiniamo il MIME type corretto (Gemini preferisce video/mp4)
  const mimeType = file.type || "video/mp4";

  onProgress?.("Audit Senior in corso (Fase Unica)...");
  
  // Eseguiamo tutto in una sola chiamata per evitare doppi upload pesanti
  const response = await ai.models.generateContent({
    model: MODEL_NAME,
    contents: [{
      parts: [
        { inlineData: { data: base64, mimeType } },
        { text: `AGISCI COME UN PRODUTTORE SENIOR CON 20 ANNI DI ESPERIENZA.
          Analizza questo video per la piattaforma ${platform} in lingua ${lang}.
          
          ESEGUI UN AUDIT SPIETATO E PROFESSIONALE:
          1. Valuta il potenziale virale (0-100).
          2. Crea 3 titoli magnetici.
          3. Scrivi un'analisi tecnica di almeno 300 parole (montaggio, gancio, carisma).
          4. Scrivi un copy persuasivo con hashtag.
          5. Fornisci un briefing visivo per lo storyboard.

          RISPONDI ESCLUSIVAMENTE CON QUESTO JSON:
          {
            "score": "numero",
            "title": "Titoli | separati | da pipe",
            "analysis": "audit senior testuale",
            "caption": "copy caption",
            "hashtags": ["tag1", "tag2"],
            "visualData": "briefing visivo per storyboard",
            "platformSuggestion": "consigli algoritmo",
            "ideaDuration": "durata ideale"
          }` 
        }
      ]
    }],
    config: { 
      responseMimeType: "application/json"
    }
  });

  const text = response.text;
  if (!text) throw new Error("Il modello non ha generato una risposta valida.");

  return JSON.parse(cleanJSON(text));
}

export async function generateIdea(prompt: string, platform: Platform, lang: Language): Promise<AnalysisResult> {
  const ai = getAI();
  const response = await ai.models.generateContent({
    model: MODEL_NAME,
    contents: `Genera una strategia virale senior (20y exp) per ${platform} in ${lang}. Idea: "${prompt}". Rispondi in JSON.`,
    config: { responseMimeType: "application/json" }
  });
  return JSON.parse(cleanJSON(response.text || "{}"));
}

export async function generateSceneAnalysis(visualData: string, lang: Language): Promise<Scene[]> {
  const ai = getAI();
  const response = await ai.models.generateContent({
    model: MODEL_NAME,
    contents: `Crea uno storyboard in ${lang} basato su: ${visualData}. Restituisci un array JSON di scene.`,
    config: { responseMimeType: "application/json" }
  });
  return JSON.parse(cleanJSON(response.text || "[]"));
}
