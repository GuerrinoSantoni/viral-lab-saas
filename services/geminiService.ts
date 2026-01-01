
import { GoogleGenAI, Type } from "@google/genai";
import { Platform, AnalysisResult, Language, Scene } from "../types";

const getAI = () => {
  const apiKey = process.env.API_KEY;
  if (!apiKey || apiKey === "") {
    throw new Error("API_KEY_MISSING");
  }
  return new GoogleGenAI({ apiKey });
};

const SYSTEM_PROMPT = (platform: string, lang: string) => `
  RUOLO: Sei un Senior Master Strategist con 20 anni di esperienza nel settore video e miliardi di views generate su tutte le piattaforme.
  PIATTAFORMA TARGET: ${platform}. LINGUA: ${lang}.
  
  MISSIONE: Analizza il video allegato come se fossi il consulente più costoso al mondo. Non essere gentile. Sii brutale, tecnico, analitico e focalizzato sul risultato economico e sulla viralità.
  
  PARAMETRI DI VALUTAZIONE OBBLIGATORI:
  1. HOOK (Gancio): I primi 3 secondi sono efficaci? Come distruggerebbero lo scrolling?
  2. RITENZIONE: Il montaggio mantiene alta l'attenzione o è troppo lento?
  3. COPY & CALL TO ACTION: Il testo è persuasivo o banale?
  4. ANALISI TECNICA: Qualità video, audio, sottotitoli e color correction.
  
  OUTPUT RICHIESTO (FORMATO JSON):
  - "score": Voto da 0 a 100 (solo l'eccellenza supera 80).
  - "title": 3 Opzioni di titoli magnetici divisi da "|".
  - "analysis": Almeno 150 parole di analisi critica senior.
  - "caption": Un copy completo, pronto all'uso, ottimizzato per l'algoritmo (almeno 200 parole).
  - "visualData": Suggerimenti tecnici di editing per migliorare il video.
  - "platformSuggestion": Perché questo video funzionerà (o fallirà) sulla piattaforma selezionata.
  - "ideaDuration": La durata ideale che questo video dovrebbe avere per massimizzare la retention.
`;

const RESPONSE_SCHEMA = {
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
};

export async function analyzeVideo(file: File, platform: Platform, lang: Language): Promise<AnalysisResult> {
  const ai = getAI();
  const base64 = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve((reader.result as string).split(',')[1]);
    reader.onerror = reject;
  });
  
  const response = await ai.models.generateContent({
    model: 'gemini-3-pro-preview',
    contents: {
      parts: [
        { text: SYSTEM_PROMPT(platform, lang) },
        { inlineData: { data: base64, mimeType: file.type } }
      ]
    },
    config: { 
      responseMimeType: "application/json", 
      temperature: 0.5,
      responseSchema: RESPONSE_SCHEMA 
    }
  });
  
  if (!response.text) throw new Error("Null response from AI");
  return JSON.parse(response.text);
}

export async function generateSceneAnalysis(visualData: string, lang: Language, file: File): Promise<Scene[]> {
  const ai = getAI();
  const base64 = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve((reader.result as string).split(',')[1]);
    reader.onerror = reject;
  });

  const response = await ai.models.generateContent({
    model: 'gemini-3-pro-preview',
    contents: {
      parts: [
        { inlineData: { data: base64, mimeType: file.type } },
        { text: `Analizza tecnicamente le scene di questo video basandoti su questa strategia: ${visualData}. Lingua: ${lang}. Genera un array JSON di oggetti Scene.` }
      ]
    },
    config: { 
      responseMimeType: "application/json",
      temperature: 0.3,
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

  if (!response.text) return [];
  return JSON.parse(response.text);
}
