
import React from 'react';
import { PRICING_TIERS } from '../constants';

interface PricingModalProps {
  onClose: () => void;
}

export const PricingModal: React.FC<PricingModalProps> = ({ onClose }) => {
  return (
    <div className="fixed inset-0 z-[1000] bg-black/95 backdrop-blur-2xl flex items-center justify-center p-4 overflow-y-auto">
      <div className="glass rounded-[50px] w-full max-w-7xl p-8 md:p-12 shadow-2xl relative my-8 border border-white/5">
        <button onClick={onClose} className="absolute top-8 right-10 text-gray-500 hover:text-white font-black text-2xl transition-colors">X</button>
        
        <div className="text-center mb-12 space-y-4">
          <h2 className="text-4xl md:text-6xl font-black uppercase italic tracking-tighter text-white">UPGRADE ASSETS</h2>
          <p className="text-[10px] text-[#1087a0] font-black uppercase tracking-[0.4em]">Scegli il tuo piano strategico</p>
          <div className="h-1.5 w-24 bg-[#a02a11] mx-auto mt-4"></div>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {PRICING_TIERS.map((tier) => (
            <div key={tier.id} className={`p-8 rounded-[40px] flex flex-col border transition-all duration-500 ${tier.popular ? 'border-[#a02a11] bg-white/5 ring-1 ring-[#a02a11]/50 scale-105 shadow-[0_0_50px_rgba(160,42,17,0.15)] z-10' : 'border-white/5 bg-white/[0.01]'}`}>
              <h3 className="text-[10px] font-black uppercase mb-2 text-gray-400 tracking-widest">{tier.name}</h3>
              <div className="text-4xl font-black text-white mb-6 tracking-tighter">{tier.price}</div>
              <div className="flex-1 space-y-5 mb-8">
                <div className="bg-[#ffe399]/10 py-1.5 px-4 rounded-full inline-block">
                  <p className="text-[9px] font-black text-[#ffe399] uppercase tracking-widest">⚡ {tier.credits} CREDITI</p>
                </div>
                <div className="space-y-3">
                  {tier.features.map((f, idx) => (
                    <div key={idx} className="flex items-start gap-2 text-[9px] font-bold text-gray-500 uppercase tracking-tight leading-tight">
                      <span className="text-[#1087a0] shrink-0">/</span> {f}
                    </div>
                  ))}
                </div>
              </div>
              <button className="w-full bg-white text-black py-4 rounded-xl font-black uppercase text-[9px] tracking-[0.2em] hover:bg-[#a02a11] hover:text-white transition-all shadow-xl">ATTIVA ORA</button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
