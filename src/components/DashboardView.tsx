import React from 'react';
import { motion } from 'motion/react';
import { Home, Car, Globe, UserCircle } from 'lucide-react';
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
    <div className="space-y-4 sm:space-y-6 md:space-y-8 w-full max-w-none px-0 py-1 sm:py-2">
      {/* Welcome Hero Greeting */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="space-y-1 sm:space-y-2.5 py-0.5 sm:py-1"
      >
        <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold tracking-tight text-emerald-600 dark:text-emerald-400">
          Bem-vindo, <span className="text-emerald-600 dark:text-emerald-400">{userName}</span>!
        </h1>
        
        <p className="text-xs sm:text-sm text-zinc-550 dark:text-zinc-400 max-w-3xl leading-relaxed">
          Consulte imóveis e veículos de forma rápida, simule cenários de retorno financeiro, analise riscos de viabilidade jurídica com inteligência artificial e centralize suas metas em um único ecossistema.
        </p>
      </motion.div>

      {/* Main Grid: Statistics summaries */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-2.5 sm:gap-4 md:gap-5 lg:gap-6" id="dashboard-top-cards-grid">
        {/* Meu Painel Stats Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.05 }}
          onClick={() => onNavigate('meu-painel')}
          className="dashboard-top-card bg-[#0E0E0E] border border-emerald-200 dark:border-[#2C2C2E] rounded-2xl sm:rounded-3xl p-3.5 sm:p-4.5 shadow-sm hover:shadow-md hover:border-emerald-500 transition-all duration-300 cursor-pointer group relative overflow-hidden"
        >
          <div className="absolute right-0 top-0 -mt-6 -mr-6 w-24 h-24 rounded-full bg-emerald-500/5 group-hover:bg-emerald-500/10 transition-colors duration-300 pointer-events-none" />
          
          <div className="flex items-start justify-between gap-3 sm:gap-4">
            <div className="space-y-0.5 sm:space-y-1 flex-1">
              <h3 className="text-sm sm:text-base font-extrabold text-emerald-600 dark:text-emerald-400 tracking-tight leading-snug">
                Meu Painel
              </h3>
              <p className="text-[11px] sm:text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">
                Acompanhe o resumo executivo, métricas consolidadas, estimativas de retorno e imóveis arrematados.
              </p>
            </div>
            <div className="p-2 sm:p-2.5 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-xl group-hover:bg-emerald-500/15 transition-all inline-flex items-center justify-center shrink-0">
              <UserCircle className="h-4.5 w-4.5 sm:h-5 sm:w-5 text-emerald-600 dark:text-emerald-400" />
            </div>
          </div>
        </motion.div>

        {/* Properties Stats Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          onClick={() => onNavigate('imoveis')}
          className="dashboard-top-card bg-[#0E0E0E] border border-emerald-200 dark:border-[#2C2C2E] rounded-2xl sm:rounded-3xl p-3.5 sm:p-4.5 shadow-sm hover:shadow-md hover:border-emerald-500 transition-all duration-300 cursor-pointer group relative overflow-hidden"
        >
          <div className="absolute right-0 top-0 -mt-6 -mr-6 w-24 h-24 rounded-full bg-emerald-500/5 group-hover:bg-emerald-500/10 transition-colors duration-300 pointer-events-none" />
          
          <div className="flex items-start justify-between gap-3 sm:gap-4">
            <div className="space-y-0.5 sm:space-y-1 flex-1">
              <h3 className="text-sm sm:text-base font-extrabold text-emerald-600 dark:text-emerald-400 tracking-tight leading-snug">
                Imóveis
              </h3>
              <p className="text-[11px] sm:text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">
                Consulte a viabilidade, analise ROI, simule revenda e desocupação com filtros inteligentes.
              </p>
            </div>
            <div className="p-2 sm:p-2.5 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-xl group-hover:bg-emerald-500/15 transition-all inline-flex items-center justify-center shrink-0">
              <Home className="h-4.5 w-4.5 sm:h-5 sm:w-5 text-emerald-600 dark:text-emerald-400" />
            </div>
          </div>
        </motion.div>

        {/* Vehicles Stats Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.2 }}
          onClick={() => onNavigate('lotes')}
          className="dashboard-top-card bg-[#0E0E0E] border border-emerald-200 dark:border-[#2C2C2E] rounded-2xl sm:rounded-3xl p-3.5 sm:p-4.5 shadow-sm hover:shadow-md hover:border-emerald-500 transition-all duration-300 cursor-pointer group relative overflow-hidden"
        >
          <div className="absolute right-0 top-0 -mt-6 -mr-6 w-24 h-24 rounded-full bg-emerald-500/5 group-hover:bg-emerald-500/10 transition-colors duration-300 pointer-events-none" />
          
          <div className="flex items-start justify-between gap-3 sm:gap-4">
            <div className="space-y-0.5 sm:space-y-1 flex-1">
              <h3 className="text-sm sm:text-base font-extrabold text-emerald-600 dark:text-emerald-400 tracking-tight leading-snug">
                Veículos
              </h3>
              <p className="text-[11px] sm:text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">
                Avalie automóveis e motocicletas com estimativas reais baseadas em valores FIPE e mercado.
              </p>
            </div>
            <div className="p-2 sm:p-2.5 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-xl group-hover:bg-emerald-500/15 transition-all inline-flex items-center justify-center shrink-0">
              <Car className="h-4.5 w-4.5 sm:h-5 sm:w-5 text-emerald-600 dark:text-emerald-400" />
            </div>
          </div>
        </motion.div>

        {/* Portals Stats Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.3 }}
          onClick={() => onNavigate('portals')}
          className="dashboard-top-card bg-[#0E0E0E] border border-emerald-200 dark:border-[#2C2C2E] rounded-2xl sm:rounded-3xl p-3.5 sm:p-4.5 shadow-sm hover:shadow-md hover:border-emerald-500 transition-all duration-300 cursor-pointer group relative overflow-hidden"
        >
          <div className="absolute right-0 top-0 -mt-6 -mr-6 w-24 h-24 rounded-full bg-emerald-500/5 group-hover:bg-emerald-500/10 transition-colors duration-300 pointer-events-none" />
          
          <div className="flex items-start justify-between gap-3 sm:gap-4">
            <div className="space-y-0.5 sm:space-y-1 flex-1">
              <h3 className="text-sm sm:text-base font-extrabold text-emerald-600 dark:text-emerald-400 tracking-tight leading-snug">
                Portais/Leiloeiros
              </h3>
              <p className="text-[11px] sm:text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">
                Monitore portais integrados e leiloeiros mapeados no ecossistema ativo de sincronização.
              </p>
            </div>
            <div className="p-2.5 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-xl group-hover:bg-emerald-500/15 transition-all inline-flex items-center justify-center shrink-0">
              <Globe className="h-4.5 w-4.5 sm:h-5 sm:w-5 text-emerald-600 dark:text-emerald-400" />
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
