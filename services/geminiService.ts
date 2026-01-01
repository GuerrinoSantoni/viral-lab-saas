
import { GoogleGenAI, Type } from "@google/genai";
import { Platform, AnalysisResult, Language, Scene } from "../types";

const getAI = () => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) throw new Error("API_KEY_MISSING");
  return new GoogleGenAI({ apiKey });
};

// Funzione di utilità per pulire il JSON restituito dall'AI
function cleanJSON(text: string): string {
  return text.replace(/```json/g, '').replace(/```/g, '').trim();
}

export async function analyzeVideo(file: File, platform: Platform, lang: Language): Promise<AnalysisResult> {
  const ai = getAI();
  const base64 = await new Promise<string>((resolve) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve((reader.result as string).split(',')[1]);
  });
  
  // Usiamo Flash per la stabilità di upload. Rimuoviamo il responseSchema per evitare Error 500.
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: {
      parts: [
        { text: `AGISCI COME UN PRODUTTORE SENIOR CON 20 ANNI DI ESPERIENZA. 
        Analizza questo video per ${platform} in ${lang}. 
        Voglio un report tecnico e spietato.
        
        RESTITUISCI ESCLUSIVAMENTE UN OGGETTO JSON con questa struttura:
        {
          "score": "voto da 0 a 100",
          "title": "3 titoli magnetici separati da |",
          "analysis": "audit tecnico spietato di almeno 500 parole sui contenuti, luci, audio e ritmo",
          "caption": "copy persuasivo strategico",
          "hashtags": ["tag1", "tag2"],
          "visualData": "analisi visiva tecnica per lo storyboard",
          "platformSuggestion": "consigli per l'algoritmo",
          "ideaDuration": "minutaggio esatto"
        }` },
        { inlineData: { data: base64, mimeType: file.type } }
      ]
    },
    config: { 
      temperature: 0.1,
      // NESSUN responseSchema qui per evitare il crash 500 del backend Google con multimodal
    }
  });
  
  const rawText = response.text || "{}";
  return JSON.parse(cleanJSON(rawText));
}

export async function generateIdea(prompt: string, platform: Platform, lang: Language): Promise<AnalysisResult> {
  const ai = getAI();
  // Per il testo puro possiamo usare lo schema senza problemi
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
  
  return JSON.parse(response.text || "{}");
}

export async function generateSceneAnalysis(visualData: string, lang: Language, file?: File): Promise<Scene[]> {
  const ai = getAI();
  const parts: any[] = [{ 
    text: `CREA UNO STORYBOARD TECNICO SENIOR (20 ANNI DI ESPERIENZA). 
    REGOLE MANDATORIE:
    1. Genera ESATTAMENTE tra 5 e 10 scene.
    2. Per OGNI scena, il campo "description" DEVE superare le 100 PAROLE.
    3. Per OGNI scena, il campo "audioSFX" DEVE superare le 100 PAROLE.
    4. Linguaggio: ${lang}.
    5. Formato: Restituisci un ARRAY JSON di oggetti con chiavi: scene (int), description (string), audioSFX (string), duration (string).` 
  }];
  
  if (file) {
    const base64 = await new Promise<string>((resolve) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve((reader.result as string).split(',')[1]);
    });
    parts.push({ inlineData: { data: base64, mimeType: file.type } });
  }

  // Usiamo Pro per la qualità del testo dello storyboard
  const response = await ai.models.generateContent({
    model: 'gemini-3-pro-preview',
    contents: { parts },
    config: { 
      temperature: 0.2,
      thinkingConfig: { thinkingBudget: 16000 }
    }
  });

  return JSON.parse(cleanJSON(response.text || "[]"));
}
