
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
      description: "Una roadmap numerata di 5-10 punti (es. 1. Hook Visivo...) che definisce l'ossatura del video." 
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

const SYSTEM_PROMPT = `Sei un Senior Executive Producer Global. 
Il tuo compito è la COERENZA CHIRURGICA. Se il video parla di 'Cucinare una Torta', lo storyboard NON può parlare di 'Riparare Auto'.
Il titolo e la roadmap sono la tua UNICA fonte di verità.
Sii brutale, tecnico e incredibilmente verboso (120+ parole per descrizione).`;

export async function analyzeVideo(file: File, platform: Platform, lang: Language, onProgress?: (s: string) => void): Promise<AnalysisResult> {
  const ai = getAI();
  onProgress?.("Analisi Senior...");
  
  const base64 = await new Promise<string>((resolve) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve((reader.result as string).split(',')[1]);
  });

  const response = await ai.models.generateContent({
    model: PRIMARY_MODEL,
    contents: [{
      parts: [
        { inlineData: { data: base64, mimeType: file.type || "video/mp4" } },
        { text: `Esegui un Master Audit per ${platform} in ${lang}. 
        Crea un titolo potente e una ROADMAP NUMERATA (visualData) di 5-10 punti che descriva l'andamento del video.` }
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
  const parts: any[] = [{ text: `Genera una strategia virale per ${platform} in ${lang} basata su: ${prompt}. 
  Crea un Titolo e una Roadmap Numerata (visualData) di 5-10 punti precisi.` }];
  
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
    contents: [{ text: `ORDINE DI PRODUZIONE TASSATIVO: Trasforma la Roadmap Strategica nello Storyboard Esecutivo.

TITOLO DEL VIDEO (NON CAMBIARE SOGGETTO): "${analysis.title}"
LOGICA NARRATIVA: "${analysis.analysis}"
ROADMAP DA ESPANDERE:
${analysis.visualData}

REGOLE PER LO STORYBOARD (JSON):
1. Crea esattamente una scena per ogni punto della roadmap sopra elencata.
2. La Scena 1 DEVE corrispondere al punto 1 della roadmap, la Scena 2 al punto 2, e così via.
3. NON inventare una storia nuova. Devi solo descrivere TECNICAMENTE come filmare e sonorizzare i punti della roadmap per il video intitolato "${analysis.title}".
4. VIDEO (120+ parole): Dettagli su lenti, angolazioni, luci (Kelvin), color correction, movimenti.
5. AUDIO (120+ parole): Sound design, frequenze, layering, Foley, musica e psicologia acustica.` }],
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
    contents: [{ text: `Traduci in ${lang}: ${JSON.stringify(analysis)}` }],
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
    contents: [{ text: `Traduci lo storyboard in ${lang}: ${JSON.stringify(scenes)}` }],
    config: { 
      responseMimeType: "application/json",
      responseSchema: SCENE_SCHEMA
    }
  });
  return cleanAndParse(response.text);
}
