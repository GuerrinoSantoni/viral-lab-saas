
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
    scriptBtn: "SBLOCCA BLUEPRINT 8K",
    upgrade: "PIANI E PREZZI",
    credits: "CREDITI",
    viralScore: "VIRAL SCORE",
    seniorInsight: "SENIOR INSIGHT",
    strategicCopy: "STRATEGIC COPY",
    scriptTitle: "BLUEPRINT SCENE 8K"
  },
  EN: {
    tagline: "SG Strategic Company • Master Authority",
    mainTitle: "STRATEGIC.AUDIT",
    processing: "Senior Analysis in progress...",
    newAudit: "NEW AUDIT",
    copyBtn: "COPY CAPTION",
    scriptBtn: "UNLOCK 8K BLUEPRINT",
    upgrade: "PLANS & PRICING",
    credits: "CREDITS",
    viralScore: "VIRAL SCORE",
    seniorInsight: "SENIOR INSIGHT",
    strategicCopy: "STRATEGIC COPY",
    scriptTitle: "8K SCENE BLUEPRINT"
  }
};

export const PRICING_TIERS = [
  { id: 'starter', name: 'Starter Executive', price: '€0', credits: 3, features: ['Audit Video AI', 'Analisi Senior'], popular: false },
  { id: 'pro', name: 'Pro Authority', price: '€49', credits: 50, features: ['Priorità Elaborazione', 'Script 8K'], popular: true },
  { id: 'master', name: 'Master Strategic', price: '€99', credits: 150, features: ['White Label', 'Analisi Competitor'], popular: false }
];
