import React, { useState } from 'react';
import { ShieldAlert, Key, User, ArrowRight, Gavel, AlertCircle } from 'lucide-react';
import { AppUser } from '../types';

interface LoginScreenProps {
  users: AppUser[];
  onLoginSuccess: (user: AppUser) => void;
}

export default function LoginScreen({ users, onLoginSuccess }: LoginScreenProps) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    const cleanUsername = username.trim().toLowerCase().replace(/^@/, '');
    const cleanPassword = password.trim();

    if (!cleanUsername || !cleanPassword) {
      setErrorMsg('Por favor, digite o usuário e a senha.');
      return;
    }

    // Find the user matching credentials
    const foundUser = users.find(
      (u) => u.username === cleanUsername && u.password === cleanPassword
    );

    if (foundUser) {
      onLoginSuccess(foundUser);
    } else {
      setErrorMsg('Usuário ou senha incorretos. Tente novamente.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#000000] px-4 select-none font-sans">
      {/* Background radial overlay */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(16,185,129,0.06)_0%,transparent_70%)] pointer-events-none" />
      
      <div className="relative w-full max-w-md bg-zinc-900 border border-zinc-800/80 rounded-3xl p-8 shadow-2xl flex flex-col items-center">
        {/* App Logo Indicator */}
        <div className="flex items-center justify-center h-14 w-14 bg-emerald-600/10 border border-emerald-500/20 text-emerald-500 rounded-2xl mb-5 shadow-lg">
          <Gavel className="h-7 w-7 animate-pulse" />
        </div>

        {/* Title */}
        <h1 className="text-xl font-black text-white tracking-tight text-center uppercase">
          INTELITZ
        </h1>
        <p className="text-xs text-zinc-400 mt-1.5 text-center mb-8">
          Inteligência em Leilões
        </p>

        {/* Error message */}
        {errorMsg && (
          <div className="w-full p-3 mb-5 bg-rose-500/10 border border-rose-500/20 text-rose-400 rounded-xl text-xs font-semibold flex items-center gap-2.5 animate-shake">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleLogin} className="w-full space-y-4">
          <div className="space-y-1.5">
            <label className="text-[10px] font-black uppercase text-zinc-400 tracking-wider block">
              Nome de Usuário
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-zinc-500">
                <User className="h-4 w-4" />
              </span>
              <input
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Ex: intelitz"
                className="w-full bg-zinc-950 border border-zinc-800 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/30 rounded-xl pl-10 pr-4 py-3 text-sm text-white placeholder:text-zinc-550 outline-none transition-all font-semibold"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-black uppercase text-zinc-400 tracking-wider block">
              Senha de Acesso
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-zinc-500">
                <Key className="h-4 w-4" />
              </span>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-zinc-950 border border-zinc-800 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/30 rounded-xl pl-10 pr-4 py-3 text-sm text-white placeholder:text-zinc-550 outline-none transition-all font-semibold"
              />
            </div>
          </div>

          <button
            type="submit"
            className="w-full mt-2 flex items-center justify-center gap-2 py-3 px-4 bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white font-extrabold rounded-xl text-sm transition-all duration-150 cursor-pointer shadow-lg shadow-emerald-950/20 active:scale-98"
          >
            Entrar no Sistema
            <ArrowRight className="h-4 w-4" />
          </button>
        </form>


      </div>
    </div>
  );
}
