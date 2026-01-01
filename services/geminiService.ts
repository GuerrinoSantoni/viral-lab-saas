import { GoogleGenAI } from "@google/genai";
import { Platform, AnalysisResult, Language, Scene } from "../types";

// Inizializzazione sicura per Vercel
const getAI = () => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    throw new Error("Mancanza API_KEY. Assicurati di averla impostata nelle Environment Variables di Vercel come API_KEY.");
  }
  return new GoogleGenAI({ apiKey });
};

export async function analyzeVideo(file: File, platform: Platform, lang: Language): Promise<AnalysisResult> {
  const ai = getAI();
  
  // Conversione file in base64
  const base64 = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      const result = reader.result as string;
      resolve(result.split(',')[1]);
    };
    reader.onerror = error => reject(error);
  });
  
  const systemInstruction = `
    Sei uno YouTuber leggendario con 20 anni di esperienza e 10 milioni di iscritti. 
    Hai analizzato migliaia di video e sai esattamente perché un video fallisce o diventa virale nei primi 3 secondi.
    
    Analizza il video caricato per la piattaforma ${platform} in lingua ${lang}.
    Sii estremamente critico, onesto e strategico (persona: "Brutal Mentor").
    
    Focus dell'analisi:
    1. Hook (Gancio): I primi 3 secondi sono magnetici o mediocri?
    2. Pacing: Il montaggio mantiene alta l'attenzione o annoia?
    3. Visuals: La qualità visiva e le inquadrature sono professionali?
    4. Call to Action: È naturale o forzata?

    DEVI rispondere esclusivamente con un oggetto JSON valido.
    Struttura richiesta:
    {
      "score": "valore da 0 a 100",
      "title": "Un titolo provocatorio e virale",
      "analysis": "Parere brutale del mentor (max 300 caratteri)",
      "caption": "Copy strategico pronto all'uso con trigger psicologici",
      "hashtags": ["tag1", "tag2", "tag3"],
      "visualData": "Istruzioni tecniche per il montatore per migliorare il video",
      "platformSuggestion": "Perché questo video funzionerebbe (o no) su questa piattaforma",
      "ideaDuration": "Durata esatta consigliata per massimizzare la ritenzione"
    }
  `;

  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: {
      parts: [
        { text: systemInstruction },
        { 
          inlineData: { 
            data: base64, 
            mimeType: file.type 
          } 
        }
      ]
    },
    config: { 
      responseMimeType: "application/json",
      temperature: 0.8,
    }
  });
  
  const text = response.text || "{}";
  try {
    return JSON.parse(text);
  } catch (e) {
    console.error("Errore parsing JSON Gemini:", text);
    throw new Error("L'AI ha risposto con un formato non valido.");
  }
}

export async function generateScriptOnly(visualData: string, lang: Language): Promise<Scene[]> {
  const ai = getAI();
  const prompt = `
    Basandoti su queste indicazioni tecniche: "${visualData}", crea uno script cinematografico 8K.
    Lingua: ${lang}.
    Dividi in scene precise. Per ogni scena indica durata, descrizione visiva e sound design (SFX).
    Rispondi SOLO con un array JSON.
    Esempio: [{"scene": 1, "description": "...", "audioSFX": "...", "duration": "0:03"}]
  `;

  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: { 
      parts: [{ text: prompt }] 
    },
    config: { 
      responseMimeType: "application/json" 
    }
  });
  
  const text = response.text || "[]";
  return JSON.parse(text);
}
