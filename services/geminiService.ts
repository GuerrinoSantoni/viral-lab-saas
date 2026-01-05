
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
3. ESPANSIONE RADICALE: Se ricevi un input scarno (es. una sola parola), usa la tua esperienza per costruire una strategia complessa e scioccante intorno ad esso. Non limitarti a descrivere l'input, distorcilo per renderlo virale.
4. METRICHE AL PRIMO POSTO: Progetta per il click (CTR) e per la ritenzione (Watch Time).
5. STILE SENIOR: Sii incisivo, brutale, tecnico. Le tue analisi devono trasudare autorità.

CAMPI SPECIFICI:
- 'score': Solo numero 0-100 basato sulla 'Viralità Potenziale'.
- 'caption': Copywriting ipnotico (80+ parole) con ganci multipli.
- 'visualData': Istruzioni tecniche di regia per distinguersi dalla massa (luci, angolazioni non comuni, editing sincopato).`;

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
        Sii critico. Se il video è noioso o troppo "standard", dimmelo e proponi una distorsione virale.
        Analisi tecnica 100 parole, Copywriting ipnotico 80 parole.` }
      ]
    }],
    config: { 
      systemInstruction: SENIOR_SYSTEM_INSTRUCTION,
      responseMimeType: "application/json",
      responseSchema: ANALYSIS_SCHEMA,
    }
  });
  
  if (!response.text) {
    throw new Error("L'IA non ha risposto. Riprova.");
  }

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
  
  parts.push({ text: `GENERA UN'IDEA DIROMPENTE (Disruptive) per ${platform} in ${lang} basandoti su: "${prompt || 'Qualcosa di mai visto'}".
  
  SFIDA: L'utente potrebbe aver inserito un prompt scarno. Ignora la semplicità e crea un concept ELITARIO, fuori dagli schemi, anti-stock. 
  Punta a:
  1. Un titolo che obblighi al click (senza clickbait becero, ma con curiosità reale).
  2. Una struttura visiva che rompa il feed.
  3. Una strategia per trasformare le views in iscritti fedeli.
  
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

export async function generateSceneAnalysis(visualData: string, lang: Language): Promise<Scene[]> {
  const ai = getAI();
  const response = await ai.models.generateContent({
    model: PRIMARY_MODEL,
    contents: [{ text: `Agisci come un Regista e Sound Designer Senior. 
    Crea uno storyboard tecnico di 5-10 scene in ${lang} basato su questa visione dirompente: "${visualData}". 
    Evita inquadrature banali. Pensa a angolazioni 'POV', 'Low angle', 'Extreme Close Up' e transizioni basate sul movimento.
    REGOLE PER OGNI SCENA:
    - DESCRIZIONE VISIVA: Minimo 120 parole di dettagli tecnici.
    - AUDIO/SFX: Minimo 80 parole sulla strategia sonora (foley, sound design, sub-bass).` }],
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
