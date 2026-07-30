import React from 'react';
import { motion } from 'motion/react';
import { 
  Building, Car, Globe, TrendingUp, DollarSign, Percent, 
  ArrowRight, Sparkles, Plus, CheckCircle2, AlertTriangle, 
  MapPin, Clock, ExternalLink, ShieldCheck, PieChart, LayoutDashboard,
  Wallet, Landmark, Users
} from 'lucide-react';
import { AppUser, ImovelLot, VehicleLot, AuctionPortal } from '../types';
import { calculateEstimatedProfit } from './LotesImovel';

interface MeuPainelProps {
  currentUser: AppUser | null;
  properties: ImovelLot[];
  vehicles: VehicleLot[];
  portals: AuctionPortal[];
  users?: AppUser[];
  onNavigate: (tabId: string) => void;
}

const formatBRL = (val: number) => {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val || 0);
};

const formatPercentBR = (val: number) => {
  if (!isFinite(val) || isNaN(val)) return '0,00';
  return val.toFixed(2).replace('.', ',');
};

export default function MeuPainel({
  currentUser,
  properties,
  vehicles,
  portals,
  users = [],
  onNavigate
}: MeuPainelProps) {
  const userName = currentUser?.name ? currentUser.name : 'Usuário';
  const userFirstName = userName.split(' ')[0];

  const targetUser = currentUser 
    ? (users.find(u => u.id === currentUser.id || u.username === currentUser.username) || currentUser)
    : (users.length > 0 ? users[0] : null);

  const displayUsers = targetUser ? [targetUser] : [];

  const isUserAssignedToLot = (lot: ImovelLot, user: AppUser) => {
    // Administrador / Intelitz possui gestão e visão completa de todas as arrematações do sistema
    if (user.role === 'admin' || user.username === 'admin' || user.username === 'intelitz' || user.id === 'usr-admin') {
      return true;
    }
    if (!lot.assignedUserIds || lot.assignedUserIds.length === 0 || lot.assignedUserIds.includes('all')) {
      return true;
    }
    if (lot.assignedUserIds.includes('none')) {
      return false;
    }
    return lot.assignedUserIds.includes(user.id) || (user.username && lot.assignedUserIds.includes(user.username));
  };

  // Calculate Imóveis Totals
  const propertiesMetrics = properties.map(p => {
    const profitData = calculateEstimatedProfit(p);
    return {
      marketValue: p.marketValue || 0,
      upfrontCosts: profitData.upfrontCosts || 0,
      capitalProprio: profitData.capitalProprio || 0,
      recursosTerceiros: profitData.recursosTerceiros || 0,
      netProfit: profitData.netProfit || 0,
      roiPercent: profitData.roiPercent || 0,
      arrematado: p.arrematado === 'Sim'
    };
  });

  const totalPropMarketValue = propertiesMetrics.reduce((acc, curr) => acc + curr.marketValue, 0);
  const totalPropUpfrontCosts = propertiesMetrics.reduce((acc, curr) => acc + curr.upfrontCosts, 0);
  const totalPropNetProfit = propertiesMetrics.reduce((acc, curr) => acc + curr.netProfit, 0);
  // Imóveis Arrematados Specific Totals
  const arrematadosMetrics = propertiesMetrics.filter(p => p.arrematado);
  const countPropArrematados = arrematadosMetrics.length;
  const totalArrematadosNetProfit = arrematadosMetrics.reduce((acc, curr) => acc + curr.netProfit, 0);
  const totalArrematadosCapitalProprio = arrematadosMetrics.reduce((acc, curr) => acc + curr.capitalProprio, 0);
  const totalArrematadosRecursosTerceiros = arrematadosMetrics.reduce((acc, curr) => acc + curr.recursosTerceiros, 0);
  const avgPropRoi = arrematadosMetrics.length > 0 
    ? arrematadosMetrics.reduce((acc, curr) => acc + curr.roiPercent, 0) / arrematadosMetrics.length 
    : 0;

  // Calculate Vehicles Totals
  const totalVehiclesMarketValue = vehicles.reduce((acc, curr) => acc + (curr.marketValue || curr.fipe || 0), 0);
  const totalVehiclesSuggestedBid = vehicles.reduce((acc, curr) => acc + (curr.suggestedBid || 0), 0);
  const totalVehiclesEstimatedProfit = Math.max(0, totalVehiclesMarketValue - totalVehiclesSuggestedBid);

  // Global Combined Totals
  const globalMarketValue = totalPropMarketValue + totalVehiclesMarketValue;
  const globalInvested = totalPropUpfrontCosts + totalVehiclesSuggestedBid;
  const globalEstimatedProfit = totalPropNetProfit + totalVehiclesEstimatedProfit;

  // Recent items
  const recentProperties = properties.slice(0, 4);
  const recentVehicles = vehicles.slice(0, 4);

  return (
    <div className="space-y-8 w-full max-w-none px-0 py-2">
      {/* Top Greeting (Directly on background like Dashboard) */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="space-y-2.5 py-1"
      >
        <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-zinc-900 dark:text-white">
          Olá, <span className="text-emerald-600 dark:text-emerald-400">{userFirstName}</span>!
        </h1>
        
        <p className="text-lg md:text-xl font-medium text-zinc-650 dark:text-zinc-300">
          Visão geral do seu portfólio
        </p>

        <p className="text-sm text-zinc-550 dark:text-zinc-400 max-w-3xl leading-relaxed">
          Acompanhe em tempo real as métricas financeiras, o valor total do portfólio, estimativa de lucro e retornos sobre investimentos em leilões.
        </p>
      </motion.div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-3.5 items-start">
        {/* Col 1: Patrimônio Mapeado */}
        <div className="flex flex-col gap-3">
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.1 }}
            className="bg-[#0E0E0E] border border-[#2C2C2E] rounded-2xl p-3.5 sm:p-4 shadow-sm space-y-0.5"
          >
            <div className="flex items-center justify-between">
              <span className="text-[10.5px] font-bold text-slate-400 uppercase tracking-wider">Patrimônio Mapeado</span>
              <div className="p-2 bg-blue-500/10 text-blue-400 rounded-xl">
                <DollarSign className="h-4.5 w-4.5" />
              </div>
            </div>
            <div>
              <div className="text-lg md:text-xl font-black font-mono text-white">
                {formatBRL(globalMarketValue)}
              </div>
              <p className="text-[10px] text-slate-400 mt-0.5">
                Avaliação de mercado combinada
              </p>
            </div>
          </motion.div>
        </div>

        {/* Col 2: Aporte Estimado e seus desdobramentos (Aporte Próprio & Aporte de Terceiros) */}
        <div className="flex flex-col gap-3">
          {/* Aporte Estimado */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.15 }}
            className="bg-[#0E0E0E] border border-[#2C2C2E] rounded-2xl p-3.5 sm:p-4 shadow-sm space-y-0.5"
          >
            <div className="flex items-center justify-between">
              <span className="text-[10.5px] font-bold text-slate-400 uppercase tracking-wider">Aporte Estimado</span>
              <div className="p-2 bg-amber-500/10 text-amber-400 rounded-xl">
                <TrendingUp className="h-4.5 w-4.5" />
              </div>
            </div>
            <div>
              <div className="text-lg md:text-xl font-black font-mono text-amber-400">
                {formatBRL(globalInvested)}
              </div>
              <p className="text-[10px] text-slate-400 mt-0.5">
                Capital total estimado para arrematação
              </p>
            </div>
          </motion.div>

          {/* Aporte Próprio (Imóveis Arrematados) */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.18 }}
            className="bg-[#0E0E0E] border border-[#2C2C2E] rounded-2xl p-3.5 sm:p-4 shadow-sm space-y-0.5"
          >
            <div className="flex items-center justify-between">
              <span className="text-[10.5px] font-bold text-slate-400 uppercase tracking-wider">Aporte Próprio</span>
              <div className="p-2 bg-emerald-500/10 text-emerald-400 rounded-xl">
                <Wallet className="h-4.5 w-4.5" />
              </div>
            </div>
            <div>
              <div className="text-lg md:text-xl font-black font-mono text-emerald-400">
                {formatBRL(totalArrematadosCapitalProprio)}
              </div>
              <p className="text-[10px] text-slate-400 mt-0.5">
                Capital próprio nos imóveis arrematados ({countPropArrematados})
              </p>
            </div>
          </motion.div>

          {/* Aporte de Terceiros (Imóveis Arrematados) */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.21 }}
            className="bg-[#0E0E0E] border border-[#2C2C2E] rounded-2xl p-3.5 sm:p-4 shadow-sm space-y-0.5"
          >
            <div className="flex items-center justify-between">
              <span className="text-[10.5px] font-bold text-slate-400 uppercase tracking-wider">Aporte de Terceiros</span>
              <div className="p-2 bg-blue-500/10 text-blue-400 rounded-xl">
                <Landmark className="h-4.5 w-4.5" />
              </div>
            </div>
            <div>
              <div className="text-lg md:text-xl font-black font-mono text-blue-400">
                {formatBRL(totalArrematadosRecursosTerceiros)}
              </div>
              <p className="text-[10px] text-slate-400 mt-0.5">
                Recursos de terceiros nos imóveis arrematados ({countPropArrematados})
              </p>
            </div>
          </motion.div>
        </div>

        {/* Col 3: Lucro Líquido Projetado e Lucro Líquido Arrematados */}
        <div className="flex flex-col gap-3">
          {/* Lucro Líquido Projetado */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.2 }}
            className="bg-[#0E0E0E] border border-[#2C2C2E] rounded-2xl p-3.5 sm:p-4 shadow-sm space-y-0.5"
          >
            <div className="flex items-center justify-between">
              <span className="text-[10.5px] font-bold text-slate-400 uppercase tracking-wider">Lucro Líquido Projetado</span>
              <div className="p-2 bg-emerald-500/10 text-emerald-400 rounded-xl">
                <Sparkles className="h-4.5 w-4.5" />
              </div>
            </div>
            <div>
              <div className="text-lg md:text-xl font-black font-mono text-emerald-400">
                {formatBRL(globalEstimatedProfit)}
              </div>
              <p className="text-[10px] text-slate-400 mt-0.5">
                Retorno líquido total projetado
              </p>
            </div>
          </motion.div>

          {/* Lucro Líquido (Imóveis Arrematados) */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.23 }}
            className="bg-[#0E0E0E] border border-[#2C2C2E] rounded-2xl p-3.5 sm:p-4 shadow-sm space-y-0.5"
          >
            <div className="flex items-center justify-between">
              <span className="text-[10.5px] font-bold text-slate-400 uppercase tracking-wider">Lucro Líquido</span>
              <div className="p-2 bg-teal-500/10 text-teal-400 rounded-xl">
                <CheckCircle2 className="h-4.5 w-4.5" />
              </div>
            </div>
            <div>
              <div className="text-lg md:text-xl font-black font-mono text-teal-400">
                {formatBRL(totalArrematadosNetProfit)}
              </div>
              <p className="text-[10px] text-slate-400 mt-0.5">
                Lucro dos imóveis arrematados ({countPropArrematados})
              </p>
            </div>
          </motion.div>
        </div>

        {/* Col 4: ROI Médio Imóveis */}
        <div className="flex flex-col gap-3">
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.25 }}
            className="bg-[#0E0E0E] border border-[#2C2C2E] rounded-2xl p-3.5 sm:p-4 shadow-sm space-y-0.5"
          >
            <div className="flex items-center justify-between">
              <span className="text-[10.5px] font-bold text-slate-400 uppercase tracking-wider">ROI Médio (Imóveis)</span>
              <div className="p-2 bg-purple-500/10 text-purple-400 rounded-xl">
                <Percent className="h-4.5 w-4.5" />
              </div>
            </div>
            <div>
              <div className="text-lg md:text-xl font-black font-mono text-purple-400">
                {formatPercentBR(avgPropRoi)}%
              </div>
              <p className="text-[10px] text-slate-400 mt-0.5">
                {countPropArrematados} imóvel(is) arrematado(s)
              </p>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Section: Arrematações */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.3 }}
        className="space-y-4"
      >
        <div className="space-y-4">
          {displayUsers.map(u => {
            const userArrematados = properties.filter(p => p.arrematado === 'Sim' && isUserAssignedToLot(p, u));
            const userArrematadosMetrics = userArrematados.map(p => {
              const profit = calculateEstimatedProfit(p);
              return {
                p,
                marketValue: p.marketValue || 0,
                upfrontCosts: profit.upfrontCosts || 0,
                capitalProprio: profit.capitalProprio || 0,
                recursosTerceiros: profit.recursosTerceiros || 0,
                netProfit: profit.netProfit || 0,
                roiPercent: profit.roiPercent || 0,
              };
            });

            const count = userArrematadosMetrics.length;
            const marketVal = userArrematadosMetrics.reduce((acc, c) => acc + c.marketValue, 0);
            const upfront = userArrematadosMetrics.reduce((acc, c) => acc + c.upfrontCosts, 0);
            const capProprio = userArrematadosMetrics.reduce((acc, c) => acc + c.capitalProprio, 0);
            const recTerceiros = userArrematadosMetrics.reduce((acc, c) => acc + c.recursosTerceiros, 0);
            const netProfit = userArrematadosMetrics.reduce((acc, c) => acc + c.netProfit, 0);
            const avgRoi = count > 0 ? userArrematadosMetrics.reduce((acc, c) => acc + c.roiPercent, 0) / count : 0;

            return (
              <div key={u.id} className="space-y-4">
                {/* Header com badge de imóveis arrematados */}
                <div className="flex items-center justify-between pb-2 border-b border-[#2C2C2E]/60">
                  <h3 className="text-base font-extrabold text-white">Arrematações</h3>
                  <span className={`px-3 py-1 text-xs font-extrabold rounded-xl ${count > 0 ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-slate-800/80 text-slate-400 border border-slate-700'}`}>
                    {count} {count === 1 ? 'imóvel arrematado' : 'imóveis arrematados'}
                  </span>
                </div>

                {/* User Financial Grid - Cards Individuais de Métricas */}
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5">
                  <div className="bg-[#0E0E0E] border border-[#2C2C2E] p-3.5 sm:p-4 rounded-2xl space-y-1 hover:border-blue-500/30 transition shadow-sm">
                    <span className="text-[11px] font-extrabold text-slate-400 uppercase tracking-wider block">Patrimônio</span>
                    <p className="text-sm sm:text-base font-black font-mono text-white">{formatBRL(marketVal)}</p>
                  </div>

                  <div className="bg-[#0E0E0E] border border-[#2C2C2E] p-3.5 sm:p-4 rounded-2xl space-y-1 hover:border-amber-500/30 transition shadow-sm">
                    <span className="text-[11px] font-extrabold text-slate-400 uppercase tracking-wider block">Aporte Estimado</span>
                    <p className="text-sm sm:text-base font-black font-mono text-amber-400">{formatBRL(upfront)}</p>
                  </div>

                  <div className="bg-[#0E0E0E] border border-[#2C2C2E] p-3.5 sm:p-4 rounded-2xl space-y-1 hover:border-emerald-500/30 transition shadow-sm">
                    <span className="text-[11px] font-extrabold text-slate-400 uppercase tracking-wider block">Aporte Próprio</span>
                    <p className="text-sm sm:text-base font-black font-mono text-emerald-400">{formatBRL(capProprio)}</p>
                  </div>

                  <div className="bg-[#0E0E0E] border border-[#2C2C2E] p-3.5 sm:p-4 rounded-2xl space-y-1 hover:border-blue-500/30 transition shadow-sm">
                    <span className="text-[11px] font-extrabold text-slate-400 uppercase tracking-wider block">Aporte Terceiros</span>
                    <p className="text-sm sm:text-base font-black font-mono text-blue-400">{formatBRL(recTerceiros)}</p>
                  </div>

                  <div className="bg-[#0E0E0E] border border-[#2C2C2E] p-3.5 sm:p-4 rounded-2xl space-y-1 hover:border-teal-500/30 transition shadow-sm">
                    <span className="text-[11px] font-extrabold text-slate-400 uppercase tracking-wider block">Lucro Líquido</span>
                    <p className="text-sm sm:text-base font-black font-mono text-teal-400">{formatBRL(netProfit)}</p>
                  </div>

                  <div className="bg-[#0E0E0E] border border-[#2C2C2E] p-3.5 sm:p-4 rounded-2xl space-y-1 hover:border-purple-500/30 transition shadow-sm">
                    <span className="text-[11px] font-extrabold text-slate-400 uppercase tracking-wider block">ROI Médio</span>
                    <p className="text-sm sm:text-base font-black font-mono text-purple-400">{formatPercentBR(avgRoi)}%</p>
                  </div>
                </div>

                {/* Lista de Imóveis Arrematados (Fora do card container) */}
                {count > 0 ? (
                  <div className="space-y-2 pt-1">
                    <span className="text-xs font-extrabold text-slate-400 uppercase tracking-wider block">Imóveis Arrematados</span>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {userArrematadosMetrics.map(({ p, netProfit, roiPercent }) => (
                        <div key={p.id} className="flex items-center justify-between p-3.5 bg-[#0E0E0E] border border-[#2C2C2E] rounded-2xl text-xs sm:text-sm hover:border-emerald-500/30 transition shadow-sm">
                          <div className="truncate pr-2 min-w-0">
                            <span className="font-bold text-white block truncate">{p.typeText} {p.condoName ? `(${p.condoName})` : ''}</span>
                            <span className="text-xs text-slate-400 truncate block">{p.location}</span>
                          </div>
                          <div className="text-right shrink-0">
                            <span className="font-mono font-bold text-teal-400 block">{formatBRL(netProfit)}</span>
                            <span className="font-mono text-xs text-purple-400">+{formatPercentBR(roiPercent)}% ROI</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <p className="text-xs text-slate-500 italic py-1">
                    Nenhum imóvel arrematado atribuído a este usuário.
                  </p>
                )}
              </div>
            );
          })}
        </div>
      </motion.div>

      {/* Main Portfólio Detailed Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Section: Imóveis Summary Panel */}
        <div className="bg-[#0E0E0E] border border-[#2C2C2E] rounded-3xl p-6 space-y-5">
          <div className="flex items-center justify-between border-b border-[#2C2C2E] pb-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-blue-500/10 text-blue-400 rounded-xl border border-blue-500/20">
                <Building className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-lg font-extrabold text-white">Resumo de Imóveis</h3>
                <p className="text-xs text-slate-400">{properties.length} cadastrado(s) no portfólio</p>
              </div>
            </div>
          </div>

          {/* Metrics List for Imóveis */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-black/60 border border-[#2C2C2E] p-3.5 rounded-xl space-y-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase">Aporte Total</span>
              <p className="text-sm font-black font-mono text-amber-400">{formatBRL(totalPropUpfrontCosts)}</p>
            </div>
            <div className="bg-black/60 border border-[#2C2C2E] p-3.5 rounded-xl space-y-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase">Lucro Projetado</span>
              <p className="text-sm font-black font-mono text-emerald-400">{formatBRL(totalPropNetProfit)}</p>
            </div>
          </div>

          {/* Recent Imóveis Preview List */}
          <div className="space-y-3">
            <h4 className="text-xs font-extrabold text-slate-300 uppercase tracking-wider">Últimos Imóveis</h4>
            {recentProperties.length === 0 ? (
              <p className="text-xs text-slate-500 italic py-2">Nenhum imóvel cadastrado no momento.</p>
            ) : (
              <div className="space-y-2">
                {recentProperties.map(p => {
                  const profitData = calculateEstimatedProfit(p);
                  return (
                    <div 
                      key={p.id}
                      onClick={() => onNavigate('imoveis')}
                      className="flex items-center justify-between p-3 bg-black/40 hover:bg-black/80 border border-[#2C2C2E] rounded-xl transition cursor-pointer group"
                    >
                      <div className="space-y-0.5 min-w-0 pr-3">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-extrabold text-white truncate">{p.typeText}</span>
                          {p.condoName && (
                            <span className="text-[10px] text-emerald-400 font-semibold truncate">({p.condoName})</span>
                          )}
                        </div>
                        <p className="text-[11px] text-slate-400 truncate flex items-center gap-1">
                          <MapPin className="h-3 w-3 shrink-0 text-slate-500" />
                          <span>{p.location}</span>
                        </p>
                      </div>

                      <div className="text-right shrink-0">
                        <span className="text-xs font-black font-mono text-emerald-400 block">
                          +{formatPercentBR(profitData.roiPercent)}% ROI
                        </span>
                        <span className="text-[10px] font-mono text-slate-400">
                          {formatBRL(profitData.upfrontCosts)}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Section: Veículos Summary Panel */}
        <div className="bg-[#0E0E0E] border border-[#2C2C2E] rounded-3xl p-6 space-y-5">
          <div className="flex items-center justify-between border-b border-[#2C2C2E] pb-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-amber-500/10 text-amber-400 rounded-xl border border-amber-500/20">
                <Car className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-lg font-extrabold text-white">Resumo de Veículos</h3>
                <p className="text-xs text-slate-400">{vehicles.length} cadastrado(s) no portfólio</p>
              </div>
            </div>

            <button
              onClick={() => onNavigate('lotes')}
              className="text-xs font-bold text-amber-400 hover:text-amber-300 flex items-center gap-1 transition cursor-pointer"
            >
              <span>Abrir Consultor</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </div>

          {/* Metrics List for Veículos */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-black/60 border border-[#2C2C2E] p-3.5 rounded-xl space-y-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase">Avaliação FIPE/Mercado</span>
              <p className="text-sm font-black font-mono text-white">{formatBRL(totalVehiclesMarketValue)}</p>
            </div>
            <div className="bg-black/60 border border-[#2C2C2E] p-3.5 rounded-xl space-y-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase">Lance Recomendado</span>
              <p className="text-sm font-black font-mono text-amber-400">{formatBRL(totalVehiclesSuggestedBid)}</p>
            </div>
          </div>

          {/* Recent Vehicles Preview List */}
          <div className="space-y-3">
            <h4 className="text-xs font-extrabold text-slate-300 uppercase tracking-wider">Últimos Veículos</h4>
            {recentVehicles.length === 0 ? (
              <p className="text-xs text-slate-500 italic py-2">Nenhum veículo cadastrado no momento.</p>
            ) : (
              <div className="space-y-2">
                {recentVehicles.map(v => (
                  <div 
                    key={v.id}
                    onClick={() => onNavigate('lotes')}
                    className="flex items-center justify-between p-3 bg-black/40 hover:bg-black/80 border border-[#2C2C2E] rounded-xl transition cursor-pointer group"
                  >
                    <div className="space-y-0.5 min-w-0 pr-3">
                      <span className="text-xs font-extrabold text-white block truncate">{v.model} ({v.year})</span>
                      <p className="text-[11px] text-slate-400 truncate">
                        KM: {v.km || 'N/A'} • {v.category}
                      </p>
                    </div>

                    <div className="text-right shrink-0">
                      <span className="text-xs font-black font-mono text-amber-400 block">
                        {formatBRL(v.suggestedBid || 0)}
                      </span>
                      <span className="text-[10px] font-mono text-slate-400">
                        {formatBRL(v.marketValue || v.fipe || 0)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>


    </div>
  );
}
