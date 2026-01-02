
export type Platform = 'YOUTUBE' | 'TIKTOK' | 'IG' | 'LINKEDIN';
export type Language = 'IT' | 'EN' | 'DE' | 'FR';

export interface Scene {
  scene: number;
  description: string;
  audioSFX: string;
  duration: string;
}

export interface AnalysisResult {
  score: string;
  title: string;
  analysis: string;
  caption: string;
  hashtags: string[];
  visualData: string;
  platformSuggestion: string;
  ideaDuration: string;
}
