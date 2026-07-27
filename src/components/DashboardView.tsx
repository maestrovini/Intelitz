import React from 'react';
import { motion } from 'motion/react';
import { Building, Car, Globe, ArrowRight, Sparkles, LayoutGrid } from 'lucide-react';
import { AppUser } from '../types';

interface DashboardViewProps {
  currentUser: AppUser | null;
  propertiesCount: number;
  vehiclesCount: number;
  portalsCount: number;
  onNavigate: (tabId: string) => void;
}

export default function DashboardView({
  currentUser,
  propertiesCount,
  vehiclesCount,
  portalsCount,
  onNavigate
}: DashboardViewProps) {
  // Extract first name or display name cleanly
  const userName = currentUser?.name ? currentUser.name.split(' ')[0] : 'Usuário';

  return (
    <div className="space-y-8 w-full max-w-none px-0 py-2">
      {/* Welcome Hero Greeting (Directly on the background, no card wrapper, less indentation) */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="space-y-2.5 py-1"
      >
        <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-zinc-900 dark:text-white">
          Bem-vindo, <span className="text-emerald-600 dark:text-emerald-400">{userName}</span>!
        </h1>
        
        <p className="text-lg md:text-xl font-medium text-zinc-650 dark:text-zinc-300">
          Intelitz, Inteligência em Leilões!
        </p>
        
        <p className="text-sm text-zinc-550 dark:text-zinc-400 max-w-3xl leading-relaxed">
          Consulte imóveis e veículos de forma rápida, simule cenários de retorno financeiro, analise riscos de viabilidade jurídica com inteligência artificial e centralize suas metas em um único ecossistema.
        </p>
      </motion.div>

      {/* Main Grid: Statistics summaries */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Properties Stats Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          onClick={() => onNavigate('imoveis')}
          className="bg-[#0E0E0E] border border-[#2C2C2E] rounded-3xl p-4.5 shadow-sm hover:shadow-md hover:border-emerald-500/30 transition-all duration-300 cursor-pointer group relative overflow-hidden"
        >
          <div className="absolute right-0 top-0 -mt-6 -mr-6 w-24 h-24 rounded-full bg-emerald-500/5 group-hover:bg-emerald-500/10 transition-colors duration-300 pointer-events-none" />
          
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-1 flex-1">
              <h3 className="text-base font-extrabold text-blue-600 dark:text-blue-400 tracking-tight leading-snug">
                Imóveis
              </h3>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">
                Consulte a viabilidade, analise ROI, simule revenda e desocupação com filtros inteligentes.
              </p>
            </div>
            <div className="p-2.5 bg-blue-500/10 text-blue-600 dark:text-blue-400 rounded-xl group-hover:bg-blue-500/15 transition-all inline-flex items-center justify-center shrink-0">
              <Building className="h-5 w-5" />
            </div>
          </div>
        </motion.div>

        {/* Vehicles Stats Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.2 }}
          onClick={() => onNavigate('lotes')}
          className="bg-[#0E0E0E] border border-[#2C2C2E] rounded-3xl p-4.5 shadow-sm hover:shadow-md hover:border-emerald-500/30 transition-all duration-300 cursor-pointer group relative overflow-hidden"
        >
          <div className="absolute right-0 top-0 -mt-6 -mr-6 w-24 h-24 rounded-full bg-emerald-500/5 group-hover:bg-emerald-500/10 transition-colors duration-300 pointer-events-none" />
          
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-1 flex-1">
              <h3 className="text-base font-extrabold text-amber-600 dark:text-amber-400 tracking-tight leading-snug">
                Veículos
              </h3>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">
                Avalie automóveis e motocicletas com estimativas reais baseadas em valores FIPE e mercado.
              </p>
            </div>
            <div className="p-2.5 bg-amber-500/10 text-amber-600 dark:text-amber-400 rounded-xl group-hover:bg-amber-500/15 transition-all inline-flex items-center justify-center shrink-0">
              <Car className="h-5 w-5" />
            </div>
          </div>
        </motion.div>

        {/* Portals Stats Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.3 }}
          onClick={() => onNavigate('portals')}
          className="bg-[#0E0E0E] border border-[#2C2C2E] rounded-3xl p-4.5 shadow-sm hover:shadow-md hover:border-emerald-500/30 transition-all duration-300 cursor-pointer group relative overflow-hidden"
        >
          <div className="absolute right-0 top-0 -mt-6 -mr-6 w-24 h-24 rounded-full bg-emerald-500/5 group-hover:bg-emerald-500/10 transition-colors duration-300 pointer-events-none" />
          
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-1 flex-1">
              <h3 className="text-base font-extrabold text-emerald-600 dark:text-emerald-400 tracking-tight leading-snug">
                Portais/Leiloeiros
              </h3>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">
                Monitore portais integrados e leiloeiros mapeados no ecossistema ativo de sincronização.
              </p>
            </div>
            <div className="p-2.5 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-xl group-hover:bg-emerald-500/15 transition-all inline-flex items-center justify-center shrink-0">
              <Globe className="h-5 w-5" />
            </div>
          </div>
        </motion.div>
      </div>

      {/* Footer Text directly on background */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4, duration: 0.3 }}
        className="flex justify-center sm:justify-start pt-4"
      >
        <span className="text-zinc-400 dark:text-zinc-500 font-mono text-[11px]">
          Intelitz @ 2026 - Todos os direitos reservados.
        </span>
      </motion.div>
    </div>
  );
}
