
import React, { useState } from 'react';
import { TRANSLATIONS } from '../constants';
import { Language, User } from '../types';

interface AuthModalProps {
  language: Language;
  onLogin: (user: User) => void;
  onClose: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ language, onLogin, onClose }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const t = TRANSLATIONS[language];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (email && password) {
      // Simulazione Login
      const mockUser: User = {
        id: '123',
        email,
        name: email.split('@')[0].toUpperCase(),
        isPro: false
      };
      onLogin(mockUser);
    }
  };

  return (
    <div className="fixed inset-0 z-[2000] bg-black/90 flex items-center justify-center p-4">
      <div className="glass p-12 rounded-[40px] w-full max-w-md border border-white/10 shadow-2xl relative">
        <button onClick={onClose} className="absolute top-8 right-8 text-gray-500 hover:text-white">X</button>
        <div className="text-center mb-10">
          <div className="w-16 h-16 bg-[#a02a11] rounded-2xl mx-auto mb-6 flex items-center justify-center font-black text-2xl">SG</div>
          <h2 className="text-3xl font-black uppercase italic tracking-tighter">{t.authTitle}</h2>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <input 
            type="email" 
            placeholder={t.emailPlaceholder}
            className="w-full bg-white/5 border border-white/10 p-4 rounded-xl outline-none focus:border-[#a02a11] transition-all"
            value={email}
            onChange={e => setEmail(e.target.value)}
          />
          <input 
            type="password" 
            placeholder={t.passwordPlaceholder}
            className="w-full bg-white/5 border border-white/10 p-4 rounded-xl outline-none focus:border-[#a02a11] transition-all"
            value={password}
            onChange={e => setPassword(e.target.value)}
          />
          <button className="w-full py-4 bg-white text-black rounded-xl font-black uppercase text-xs hover:bg-[#a02a11] hover:text-white transition-all shadow-xl">
            {isLogin ? t.login : t.register}
          </button>
        </form>

        <p className="mt-8 text-center text-[10px] text-gray-500 font-bold uppercase tracking-widest">
          {isLogin ? "Non hai un account?" : "Hai già un account?"}
          <button onClick={() => setIsLogin(!isLogin)} className="ml-2 text-[#a02a11] hover:underline">
            {isLogin ? t.register : t.login}
          </button>
        </p>
      </div>
    </div>
  );
};

