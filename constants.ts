
export const PLATFORMS = [
  { id: 'YOUTUBE', label: 'YouTube Shorts', icon: '🎬' },
  { id: 'TIKTOK', label: 'TikTok Viral', icon: '🎵' },
  { id: 'IG', label: 'IG Reels', icon: '📸' },
  { id: 'LINKEDIN', label: 'LinkedIn Authority', icon: '💼' }
] as const;

export const TRANSLATIONS = {
  IT: {
    tagline: "SG Strategic Company • Master Authority",
    mainTitle: "STRATEGIC.AUDIT",
    processing: "Analisi Senior in corso...",
    newAudit: "NUOVO AUDIT",
    copyBtn: "COPIA CAPTION",
    scriptBtn: "SBLOCCA ANALISI DELLE SCENE",
    upgrade: "PIANI E PREZZI",
    credits: "CREDITI",
    viralScore: "VIRAL SCORE",
    seniorInsight: "SENIOR INSIGHT",
    strategicCopy: "STRATEGIC COPY",
    scriptTitle: "ANALISI TECNICA DELLE SCENE",
    ideaPlaceholder: "Descrivi brevemente di cosa vuoi parlare (es: 'Come vendere consulenze' oppure 'Un giorno in ufficio')...",
    ideaBtn: "DAMMI UN'IDEA",
    orText: "OPPURE CARICA UN VIDEO PER L'AUDIT"
  },
  EN: {
    tagline: "SG Strategic Company • Master Authority",
    mainTitle: "STRATEGIC.AUDIT",
    processing: "Senior Analysis in progress...",
    newAudit: "NEW AUDIT",
    copyBtn: "COPY CAPTION",
    scriptBtn: "UNLOCK SCENE ANALYSIS",
    upgrade: "PLANS & PRICING",
    credits: "CREDITS",
    viralScore: "VIRAL SCORE",
    seniorInsight: "SENIOR INSIGHT",
    strategicCopy: "STRATEGIC COPY",
    scriptTitle: "TECHNICAL SCENE ANALYSIS",
    ideaPlaceholder: "Briefly describe what you want to talk about...",
    ideaBtn: "GIVE ME AN IDEA",
    orText: "OR UPLOAD A VIDEO FOR AUDIT"
  }
};

export const PRICING_TIERS = [
  { id: 'free', name: 'Starter Executive', price: '€0', credits: 3, features: ['Audit Video AI', 'Analisi Senior'], popular: false },
  { id: 'entry', name: 'Entry Growth', price: '€19', credits: 12, features: ['Audit Video AI', 'Analisi Senior'], popular: false },
  { id: 'medium', name: 'Pro Authority', price: '€49', credits: 40, features: ['Audit Video AI', 'Analisi Senior'], popular: true },
  { id: 'premium', name: 'Master Strategic', price: '€99', credits: 120, features: ['Audit Video AI', 'Analisi Senior'], popular: false }
];
