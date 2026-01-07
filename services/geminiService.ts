
import { GoogleGenAI, Type } from "@google/genai";
import { Platform, AnalysisResult, Language, Scene } from "../types";

// Utilizziamo Gemini 3 Flash per tutto: è estremamente veloce e ha limiti di quota molto più alti del Pro.
const PRIMARY_MODEL = 'gemini-3-flash-preview'; 

const getAI = () => {
  if (!process.env.API_KEY) throw new Error("API_KEY_MANCANTE");
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
    visualData: { type: Type.STRING },
    platformSuggestion: { type: Type.STRING },
    ideaDuration: { type: Type.STRING },
  },
  required: ["score", "title", "analysis", "caption", "hashtags", "visualData", "platformSuggestion", "ideaDuration"],
};

function cleanAndParse(text: string): any {
  if (!text) return null;
  try {
    const jsonStr = text.replace(/```json/g, '').replace(/```/g, '').trim();
    return JSON.parse(jsonStr);
  } catch (e) {
    console.error("Errore Parsing JSON:", text);
    throw new Error("L'IA ha generato un formato non valido.");
  }
}

const SENIOR_SYSTEM_INSTRUCTION = `Sei il 'Gran Maestro dei Social Media', un Executive Producer con 20 anni di successi mondiali e miliardi di views accumulate. 

IL TUO MANIFESTO:
1. ODIA IL BANALE: Se un'idea sembra "già vista" o "da stock", scartala. Punta sul 'Pattern Interrupt'.
2. PSICOLOGIA VIRALE: Ogni contenuto deve colpire un trigger emotivo (Rabbia positiva, Stupore, Utilità estrema, FOMO).
3. ESPANSIONE RADICALE: Se ricevi un input scarno, costruisci una strategia complessa e scioccante.
4. METRICHE AL PRIMO POSTO: Progetta per il click (CTR) e per la ritenzione (Watch Time).
5. STILE SENIOR: Sii incisivo, brutale, tecnico. Le tue analisi trasudano autorità.`;

export async function translateAnalysis(data: AnalysisResult, targetLang: Language): Promise<AnalysisResult> {
  const ai = getAI();
  const response = await ai.models.generateContent({
    model: PRIMARY_MODEL,
    contents: [{ text: `Traduci integralmente questo report in ${targetLang}. 
    MANTENERE LO STILE TECNICO SENIOR E AUTOREVOLE.
    JSON: ${JSON.stringify(data)}` }],
    config: { 
      responseMimeType: "application/json",
      responseSchema: ANALYSIS_SCHEMA
    }
  });
  const translated = cleanAndParse(response.text);
  return { ...translated, lang: targetLang };
}

export async function translateScenes(scenes: Scene[], targetLang: Language): Promise<Scene[]> {
  const ai = getAI();
  const response = await ai.models.generateContent({
    model: PRIMARY_MODEL,
    contents: [{ text: `Traduci queste scene di storyboard in ${targetLang}. 
    MANTENI IL LIVELLO DI DETTAGLIO ESTREMO. 
    JSON: ${JSON.stringify(scenes)}` }],
    config: { 
      responseMimeType: "application/json",
      responseSchema: {
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
      }
    }
  });
  return cleanAndParse(response.text);
}

export async function analyzeVideo(
  file: File, 
  platform: Platform, 
  lang: Language, 
  onProgress?: (step: string) => void
): Promise<AnalysisResult> {
  const ai = getAI();
  onProgress?.("Inizializzazione Scan Senior...");
  
  const base64 = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve((reader.result as string).split(',')[1]);
    reader.onerror = (error) => reject(error);
  });

  const response = await ai.models.generateContent({
    model: PRIMARY_MODEL,
    contents: [{
      parts: [
        { inlineData: { data: base64, mimeType: file.type || "video/mp4" } },
        { text: `Esegui un Master Audit Senior per ${platform} in ${lang}. 
        Analisi tecnica 100 parole, Copywriting ipnotico 80 parole.` }
      ]
    }],
    config: { 
      systemInstruction: SENIOR_SYSTEM_INSTRUCTION,
      responseMimeType: "application/json",
      responseSchema: ANALYSIS_SCHEMA,
    }
  });
  
  return { ...cleanAndParse(response.text), lang };
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
  
  parts.push({ text: `GENERA UN'IDEA DIROMPENTE per ${platform} in ${lang} basandoti su: "${prompt || 'Qualcosa di mai visto'}".
  MANDATORIO: Campo caption 80+ parole di puro copywriting persuasivo.` });

  const response = await ai.models.generateContent({
    model: PRIMARY_MODEL,
    contents: { parts },
    config: { 
      systemInstruction: SENIOR_SYSTEM_INSTRUCTION,
      responseMimeType: "application/json",
      responseSchema: ANALYSIS_SCHEMA,
    }
  });
  return { ...cleanAndParse(response.text), lang };
}

export async function generateSceneAnalysis(analysis: AnalysisResult, lang: Language): Promise<Scene[]> {
  const ai = getAI();
  const response = await ai.models.generateContent({
    model: PRIMARY_MODEL,
    contents: [{ text: `Agisci come un Regista e Executive Producer Senior. 
    PROGETTA lo storyboard tecnico basandoti sulla complessità della storia:
    
    TITOLO: "${analysis.title}"
    CONCETTO E STRATEGIA: "${analysis.analysis}"
    VISION: "${analysis.visualData}"
    
    REGOLE DI PRODUZIONE SENIOR:
    1. NUMERO DI SCENE VARIABILE: Non usare un numero fisso. Determina quante scene servono (minimo 6, massimo 15) in base alla "Strategia d'Urto". Se l'idea è un gancio rapido, 6 scene bastano. Se è una narrazione complessa, espanditi fino a 15 per garantire che il messaggio arrivi con forza.
    2. RITMO (PACING): Definisci un ritmo che serva la ritenzione. Scene veloci per l'inizio, respiri narrativi nel mezzo, climax visivo alla fine.
    3. COERENZA TOTALE: Le scene devono essere l'incarnazione visiva esatta del titolo "${analysis.title}".
    
    REGOLE PER OGNI SCENA (Lingua: ${lang}):
    - DESCRIZIONE VISIVA: Minimo 120 parole. Sii ossessivo sui dettagli: tipo di lente (es. 24mm wide), illuminazione (es. rim light ciano), movimenti (es. slider in), espressioni e dettagli scenici.
    - AUDIO/SFX: Minimo 80 parole. Descrivi il sound design come un'arma psicologica (es. riser che si ferma bruscamente, foley iperealistico, bass drop).
    - DURATA: Indica la durata ottimale per il montaggio.` }],
    config: { 
      responseMimeType: "application/json",
      responseSchema: {
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
      }
    }
  });
  return cleanAndParse(response.text);
}
