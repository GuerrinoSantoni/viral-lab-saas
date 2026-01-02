
export const PLATFORMS = [
  { id: 'YOUTUBE', label: 'YouTube Shorts', icon: '🎬' },
  { id: 'TIKTOK', label: 'TikTok Viral', icon: '🎵' },
  { id: 'IG', label: 'IG Reels', icon: '📸' },
  { id: 'LINKEDIN', label: 'LinkedIn Authority', icon: '💼' }
] as const;

export const TRANSLATIONS: Record<string, any> = {
  IT: {
    tagline: "Senior Master Audit",
    mainTitle: "MASTER.",
    mainTitleRed: "AUDIT",
    login: "Accedi",
    logout: "Esci",
    register: "Registrati",
    emailPlaceholder: "La tua email master...",
    passwordPlaceholder: "Password segreta...",
    startNow: "Inizia Ora",
    authTitle: "Accesso Master",
    modeVideo: "Analisi Video",
    modeIdea: "Generatore Idee",
    uploadLabel: "Carica Video per l'Audit",
    ideaLabel: "Genera Strategia Virale",
    ideaPlaceholder: "Descrivi la tua idea virale...",
    imageUploadLabel: "Immagine di Riferimento (Opzionale)",
    removeImage: "Rimuovi",
    creditsLabel: "CREDITI",
    upgradeBtn: "Piani Master",
    processing: "Analisi Senior in corso...",
    encoding: "Codifica Stream...",
    paymentProcessing: "Contatto con Stripe Secure...",
    paymentSuccess: "Transazione Master Riuscita!",
    activate: "Acquista Crediti",
    pricingTitle: "UPGRADE ASSETS",
    pricingSub: "Scala la tua autorità con crediti premium",
    errorQuota: "⚠️ Limite raggiunto. Passa al Pro.",
    errorAuth: "❌ Email o Password non valide."
  },
  EN: {
    tagline: "Senior Master Audit",
    mainTitle: "MASTER.",
    mainTitleRed: "AUDIT",
    login: "Login",
    logout: "Logout",
    register: "Sign Up",
    emailPlaceholder: "Your master email...",
    passwordPlaceholder: "Secret password...",
    startNow: "Start Now",
    authTitle: "Master Access",
    modeVideo: "Video Analysis",
    modeIdea: "Idea Generator",
    uploadLabel: "Upload Video for Audit",
    ideaLabel: "Generate Viral Strategy",
    ideaPlaceholder: "Describe your viral idea...",
    imageUploadLabel: "Reference Image (Optional)",
    removeImage: "Remove",
    creditsLabel: "CREDITS",
    upgradeBtn: "Upgrade",
    processing: "Senior Analysis...",
    encoding: "Stream Encoding...",
    paymentProcessing: "Contacting Stripe Secure...",
    paymentSuccess: "Master Transaction Successful!",
    activate: "Buy Credits",
    pricingTitle: "UPGRADE ASSETS",
    pricingSub: "Scale your authority with premium credits",
    errorQuota: "⚠️ Limit reached. Go Pro.",
    errorAuth: "❌ Invalid Email or Password."
  }
};

export const PRICING_TIERS = [
  { id: 'starter', name: 'Starter Executive', price: '€19', credits: 15, features: ['Audit Video AI', 'Analisi Senior'], popular: false },
  { id: 'pro', name: 'Pro Authority', price: '€49', credits: 50, features: ['Audit Video AI', 'Analisi Senior', 'Storyboard Illimitati'], popular: true },
  { id: 'master', name: 'Master Strategic', price: '€99', credits: 150, features: ['Audit Video AI', 'Analisi Senior', 'Priority Support'], popular: false }
];
