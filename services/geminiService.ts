
import { GoogleGenAI, Type } from "@google/genai";
import { Platform, AnalysisResult, Language, Scene } from "../types";

const getAI = () => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) throw new Error("API_KEY_MISSING");
  return new GoogleGenAI({ apiKey });
};

function cleanJSON(text: string): string {
  return text.replace(/```json/g, '').replace(/```/g, '').trim();
}

export async function analyzeVideo(
  file: File, 
  platform: Platform, 
  lang: Language, 
  onProgress?: (step: string) => void
): Promise<AnalysisResult> {
  const ai = getAI();
  
  // 0. Conversione in base64
  onProgress?.("Conversione video in corso...");
  const base64 = await new Promise<string>((resolve) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve((reader.result as string).split(',')[1]);
  });

  // FASE 1: SCANSIONE TECNICA (Leggera per evitare Error 500)
  onProgress?.("Fase 1: Scansione visiva del Master...");
  const scanResponse = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: {
      parts: [
        { text: "Analizza tecnicamente questo video. Descrivi nel dettaglio: cosa succede, la qualità delle luci, l'audio, il ritmo del montaggio, il carisma della persona (se presente) e il contenuto espresso. Sii estremamente prolisso." },
        { inlineData: { data: base64, mimeType: file.type } }
      ]
    },
    config: { temperature: 0.1 }
  });

  const technicalReport = scanResponse.text;
  if (!technicalReport) throw new Error("Il Master non ha fornito dati sulla scansione.");

  // FASE 2: ELABORAZIONE SENIOR (Testo -> Strategia)
  onProgress?.("Fase 2: Elaborazione della strategia spietata...");
  const finalResponse = await ai.models.generateContent({
    model: 'gemini-3-flash-preview', // Flash è più veloce per il parsing finale
    contents: {
      parts: [
        { text: `AGISCI COME UN PRODUTTORE SENIOR (20 ANNI EXP). 
        Usa questo report tecnico di un video per creare una strategia per ${platform} in ${lang}:
        
        REPORT TECNICO:
        ${technicalReport}
        
        RESTITUISCI UN OGGETTO JSON:
        {
          "score": "voto 0-100",
          "title": "3 titoli magnetici | separati",
          "analysis": "audit tecnico spietato di 500+ parole",
          "caption": "copy persuasivo",
          "hashtags": ["tag1", "tag2"],
          "visualData": "dati per storyboard",
          "platformSuggestion": "consigli algoritmo",
          "ideaDuration": "minutaggio"
        }` }
      ]
    },
    config: { 
      responseMimeType: "application/json",
      temperature: 0.7 
    }
  });

  return JSON.parse(cleanJSON(finalResponse.text || "{}"));
}

export async function generateIdea(prompt: string, platform: Platform, lang: Language): Promise<AnalysisResult> {
  const ai = getAI();
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: {
      parts: [
        { text: `Genera una strategia VIRALE Senior (20 anni exp) per ${platform} in ${lang}. Idea: "${prompt}".` }
      ]
    },
    config: { 
      responseMimeType: "application/json", 
      temperature: 0.7,
      thinkingConfig: { thinkingBudget: 4000 }
    }
  });
  
  return JSON.parse(cleanJSON(response.text || "{}"));
}

export async function generateSceneAnalysis(visualData: string, lang: Language, file?: File): Promise<Scene[]> {
  const ai = getAI();
  const parts: any[] = [{ 
    text: `CREA STORYBOARD SENIOR (20 ANNI EXP). 
    REGOLE: 5-10 scene. Descrizione e AudioSFX > 100 parole per scena. Lingua: ${lang}. 
    DATI VIDEO: ${visualData}` 
  }];
  
  const response = await ai.models.generateContent({
    model: 'gemini-3-pro-preview',
    contents: { parts },
    config: { 
      responseMimeType: "application/json",
      temperature: 0.2,
      thinkingConfig: { thinkingBudget: 16000 }
    }
  });

  return JSON.parse(cleanJSON(response.text || "[]"));
}
