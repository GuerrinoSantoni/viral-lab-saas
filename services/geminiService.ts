
import { GoogleGenAI, Type } from "@google/genai";
import { Platform, AnalysisResult, Language, Scene } from "../types";

const MAIN_MODEL = 'gemini-3-flash-preview'; 

const getAI = () => {
  if (!process.env.API_KEY) throw new Error("API_KEY_MANCANTE");
  return new GoogleGenAI({ apiKey: process.env.API_KEY });
};

const ANALYSIS_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    score: { type: Type.STRING, description: "Punteggio virale (es. 85/100)" },
    title: { type: Type.STRING, description: "Titolo accattivante" },
    analysis: { type: Type.STRING, description: "Critica costruttiva senior dettagliata (min 150 parole)" },
    caption: { type: Type.STRING, description: "Testo del post strategico e profondo (min 150 parole)" },
    hashtags: { type: Type.ARRAY, items: { type: Type.STRING } },
    visualData: { type: Type.STRING, description: "Descrizione della struttura visiva e ritmica (min 150 parole)" },
    platformSuggestion: { type: Type.STRING, description: "Consiglio specifico piattaforma" },
    ideaDuration: { type: Type.STRING, description: "Durata stimata (es. 45s)" },
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
    throw new Error("Formato AI non valido.");
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
    model: MAIN_MODEL,
    contents: {
      parts: [
        { inlineData: { data: base64, mimeType: file.type || "video/mp4" } },
        { text: `AGISCI COME UN PRODUTTORE YOUTUBE CON 20 ANNI DI ESPERIENZA. Analizza questo video per ${platform} in lingua ${lang}. 
        
        REGOLE DI SCRITTURA MANDATORIE:
        1. SENIOR INSIGHT (Campo 'analysis'): Almeno 150 parole. Analizza ritmo, ritenzione, psicologia dello spettatore e difetti tecnici.
        2. CONTENT STRUCTURE (Campo 'visualData'): Almeno 150 parole. Descrivi minuziosamente la sequenza visiva, i tagli necessari, la color correction e l'uso dei B-roll.
        3. STRATEGIC COPY (Campo 'caption'): Almeno 150 parole. Scrivi un testo che non sia solo una descrizione, ma un pezzo di copywriting ipnotico basato su framework come AIDA o PAS.
        
        Sii brutale, estremamente tecnico e prolisso nei dettagli strategici.` }
      ]
    },
    config: { 
      responseMimeType: "application/json",
      responseSchema: ANALYSIS_SCHEMA
    }
  });

  return cleanAndParse(response.text);
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

  parts.push({ text: `PRODUTTORE SENIOR: Crea una strategia virale per ${platform} in lingua ${lang} basata su: "${prompt}".
  
  REGOLE DI SCRITTURA MANDATORIE:
  - Ogni sezione testuale (analysis, visualData, caption) DEVE superare le 150 parole.
  - Sviscera ogni aspetto della strategia: angoli psicologici, ganci (hooks), transizioni visive e call to action complesse.
  - Usa terminologia tecnica da industria cinematografica e marketing avanzato.` });

  const response = await ai.models.generateContent({
    model: MAIN_MODEL,
    contents: { parts },
    config: { 
      responseMimeType: "application/json",
      responseSchema: ANALYSIS_SCHEMA
    }
  });
  return cleanAndParse(response.text);
}

export async function generateSceneAnalysis(visualData: string, lang: Language): Promise<Scene[]> {
  const ai = getAI();
  const response = await ai.models.generateContent({
    model: MAIN_MODEL,
    contents: `AGISCI COME UN REGISTA E DIRETTORE DELLA FOTOGRAFIA SENIOR. 
        Crea uno storyboard tecnico cinematografico di 6 scene basato su questo input: "${visualData}".
        
        REGOLE MANDATORIE PER OGNI SCENA:
        1. DESCRIZIONE VISIVA: Minimo 120 parole di puro dettaglio tecnico (lenti, luci, movimenti, espressioni).
        2. AUDIO STRATEGY: Minimo 80 parole di sound design stratificato.
        3. Lingua: ${lang}.
        
        Sii prolisso e professionale.`,
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
