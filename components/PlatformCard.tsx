
import React from 'react';
import { Platform } from '../types';

interface PlatformCardProps {
  id: Platform;
  label: string;
  icon: string;
  isSelected: boolean;
  onClick: () => void;
}

export const PlatformCard: React.FC<PlatformCardProps> = ({ id, label, icon, isSelected, onClick }) => {
  return (
    <button
      onClick={onClick}
      className={`
        flex flex-col items-center justify-center p-6 rounded-3xl transition-all duration-300 border-2
        ${isSelected 
          ? `bg-[#a02a11] scale-105 shadow-[0_0_30px_rgba(160,42,17,0.3)] border-[#ffe399]` 
          : 'bg-white/[0.03] hover:bg-white/[0.08] border-white/5'}
      `}
    >
      <span className="text-4xl mb-3">{icon}</span>
      <span className={`font-black text-[9px] uppercase tracking-widest ${isSelected ? 'text-white' : 'text-gray-500'}`}>
        {label}
      </span>
    </button>
  );
};
