
import React, { useState } from 'react';
import { PRICING_TIERS, TRANSLATIONS } from '../constants';
import { Language } from '../types';

interface PricingModalProps {
  onClose: () => void;
  language: Language;
  onPurchaseSuccess: (credits: number) => void;
}

export const PricingModal: React.FC<PricingModalProps> = ({ onClose, language, onPurchaseSuccess }) => {
  const [processingId, setProcessingId] = useState<string | null>(null);
  const t = TRANSLATIONS[language] || TRANSLATIONS.IT;
  
  const handlePurchase = (tierId: string, credits: number) => {
    setProcessingId(tierId);
    // Simula redirect e ritorno da Stripe
    setTimeout(() => {
      onPurchaseSuccess(credits);
      setProcessingId(null);
      alert(t.paymentSuccess);
      onClose();
    }, 2500);
  };

  return (
    <div className="fixed inset-0 z-[1000] bg-black/95 backdrop-blur-2xl flex items-center justify-center p-4 overflow-y-auto">
      <div className="glass rounded-[50px] w-full max-w-7xl p-8 md:p-12 shadow-2xl relative my-8 border border-white/5">
        <button onClick={onClose} className="absolute top-8 right-10 text-gray-500 hover:text-white font-black text-2xl transition-colors">X</button>
        
        <div className="text-center mb-12 space-y-4">
          <h2 className="text-4xl md:text-6xl font-black uppercase italic tracking-tighter text-white">{t.pricingTitle}</h2>
          <p className="text-[10px] text-[#1087a0] font-black uppercase tracking-[0.4em]">{t.pricingSub}</p>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {PRICING_TIERS.map((tier) => (
            <div key={tier.id} className={`p-10 rounded-[40px] flex flex-col border transition-all duration-500 ${tier.popular ? 'border-[#a02a11] bg-white/5 ring-1 ring-[#a02a11]/50 scale-105' : 'border-white/5 bg-white/[0.01]'}`}>
              <h3 className="text-[10px] font-black uppercase mb-2 text-gray-400 tracking-widest">{tier.name}</h3>
              <div className="text-5xl font-black text-white mb-6 tracking-tighter">{tier.price}</div>
              
              <div className="flex-1 space-y-4 mb-8">
                <div className="bg-[#a02a11]/20 py-2 px-4 rounded-full inline-block border border-[#a02a11]/30">
                  <p className="text-[10px] font-black text-[#a02a11] uppercase tracking-widest">⚡ {tier.credits} CREDITI</p>
                </div>
                {tier.features.map((f, idx) => (
                  <div key={idx} className="flex items-start gap-2 text-[11px] font-bold text-gray-500 uppercase">
                    <span className="text-[#a02a11]">✓</span> {f}
                  </div>
                ))}
              </div>

              <button 
                onClick={() => handlePurchase(tier.id, tier.credits)}
                disabled={!!processingId}
                className="w-full bg-white text-black py-4 rounded-2xl font-black uppercase text-xs hover:bg-[#a02a11] hover:text-white transition-all shadow-xl disabled:opacity-50"
              >
                {processingId === tier.id ? t.paymentProcessing : t.activate}
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
