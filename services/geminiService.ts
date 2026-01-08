
import { GoogleGenAI, Type } from "@google/genai";
import { Platform, AnalysisResult, Language, Scene } from "../types.ts";

const PRIMARY_MODEL = 'gemini-3-flash-preview'; 

const getAI = () => {
  return new GoogleGenAI({ apiKey: process.env.API_KEY });
};

const ANALYSIS_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    score: { type: Type.STRING },
    title: { type: Type.STRING },
    analysis: { type: Type.STRING },
    caption: { type: Type.STRING },
    hashtags: { type: Type.ARRAY, items: { type: Type.STRING } },
    visualData: { 
      type: Type.STRING, 
      description: "Una roadmap numerata (es. 1. Hook, 2. Contrast...) di 5-10 punti che definisce l'ossatura del video." 
    },
    platformSuggestion: { type: Type.STRING },
    ideaDuration: { type: Type.STRING },
  },
  required: ["score", "title", "analysis", "caption", "hashtags", "visualData", "platformSuggestion", "ideaDuration"],
};

const SCENE_SCHEMA = {
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
};

function cleanAndParse(text: string): any {
  try {
    const jsonStr = text.replace(/```json/g, '').replace(/```/g, '').trim();
    return JSON.parse(jsonStr);
  } catch (e) {
    console.error("Errore Parsing:", text);
    throw new Error("L'analisi ha prodotto un formato non leggibile.");
  }
}

const SYSTEM_PROMPT = `Sei un Senior Executive Producer Global con 20 anni di esperienza. 
Il tuo marchio di fabbrica è la COERENZA MANIACALE tra strategia e produzione.
Se decidi un titolo e una roadmap, lo storyboard deve essere l'esecuzione chirurgica di quella visione.
Non divagare. Sii tecnico, brutale e prolisso (minimo 120 parole per ogni descrizione video e audio).`;

export async function analyzeVideo(file: File, platform: Platform, lang: Language, onProgress?: (s: string) => void): Promise<AnalysisResult> {
  const ai = getAI();
  onProgress?.("Scansione frame...");
  
  const base64 = await new Promise<string>((resolve) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve((reader.result as string).split(',')[1]);
  });

  onProgress?.("Master Audit...");
  const response = await ai.models.generateContent({
    model: PRIMARY_MODEL,
    contents: [{
      parts: [
        { inlineData: { data: base64, mimeType: file.type || "video/mp4" } },
        { text: `Analisi Senior per ${platform} in ${lang}. 
        Crea una strategia dirompente. 
        In 'visualData', scrivi una ROADMAP NUMERATA (da 5 a 10 punti) che descriva l'andamento narrativo del video. 
        Ogni punto deve essere un beat fondamentale.` }
      ]
    }],
    config: { 
      systemInstruction: SYSTEM_PROMPT,
      responseMimeType: "application/json",
      responseSchema: ANALYSIS_SCHEMA
    }
  });
  
  return { ...cleanAndParse(response.text), lang };
}

export async function generateIdea(prompt: string, platform: Platform, lang: Language, imageFile?: File): Promise<AnalysisResult> {
  const ai = getAI();
  const parts: any[] = [{ text: `Strategia Master per ${platform} in ${lang} su: ${prompt}. 
  Obbligatorio: definisci in 'visualData' una ROADMAP NUMERATA di 5-10 punti narrativi precisi che serviranno per lo storyboard.` }];
  
  if (imageFile) {
    const base64 = await new Promise<string>((resolve) => {
      const reader = new FileReader();
      reader.readAsDataURL(imageFile);
      reader.onload = () => resolve((reader.result as string).split(',')[1]);
    });
    parts.unshift({ inlineData: { data: base64, mimeType: imageFile.type } });
  }

  const response = await ai.models.generateContent({
    model: PRIMARY_MODEL,
    contents: { parts },
    config: { 
      systemInstruction: SYSTEM_PROMPT,
      responseMimeType: "application/json",
      responseSchema: ANALYSIS_SCHEMA
    }
  });
  return { ...cleanAndParse(response.text), lang };
}

export async function generateSceneAnalysis(analysis: AnalysisResult, lang: Language): Promise<Scene[]> {
  const ai = getAI();
  const response = await ai.models.generateContent({
    model: PRIMARY_MODEL,
    contents: [{ text: `ESEGUTIVO DI PRODUZIONE: Trasforma la seguente Roadmap nello Storyboard Tecnico per il video intitolato "${analysis.title}".

L'ANALISI DI RIFERIMENTO È:
${analysis.analysis}

LA ROADMAP DA ESPANDERE È (Rispettala punto per punto):
${analysis.visualData}

REGOLE TASSATIVE:
1. Crea esattamente una scena per ogni punto della roadmap (minimo 5, massimo 10).
2. Ogni scena deve chiamarsi come il punto corrispondente.
3. VIDEO (Minimo 120 parole): Descrizione tecnica iper-dettagliata (lenti, luci, movimenti di macchina, color grading).
4. AUDIO (Minimo 120 parole): Sound design, frequenze, foley e layering musicale.

Sii coerente al 100% con il titolo "${analysis.title}" e con la strategia sopra descritta.` }],
    config: { 
      systemInstruction: SYSTEM_PROMPT,
      responseMimeType: "application/json",
      responseSchema: SCENE_SCHEMA
    }
  });
  return cleanAndParse(response.text);
}

export async function translateAnalysis(analysis: AnalysisResult, lang: Language): Promise<AnalysisResult> {
  const ai = getAI();
  const response = await ai.models.generateContent({
    model: PRIMARY_MODEL,
    contents: [{ text: `Traduci in ${lang} mantenendo la roadmap numerata e lo stile senior: ${JSON.stringify(analysis)}` }],
    config: { 
      responseMimeType: "application/json",
      responseSchema: ANALYSIS_SCHEMA
    }
  });
  return { ...cleanAndParse(response.text), lang };
}

export async function translateScenes(scenes: Scene[], lang: Language): Promise<Scene[]> {
  const ai = getAI();
  const response = await ai.models.generateContent({
    model: PRIMARY_MODEL,
    contents: [{ text: `Traduci lo storyboard tecnico in ${lang}: ${JSON.stringify(scenes)}` }],
    config: { 
      responseMimeType: "application/json",
      responseSchema: SCENE_SCHEMA
    }
  });
  return cleanAndParse(response.text);
}
