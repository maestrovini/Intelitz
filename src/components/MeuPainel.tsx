import React from 'react';
import { motion } from 'motion/react';
import { 
  Building, Car, Globe, TrendingUp, DollarSign, Percent, 
  ArrowRight, Sparkles, Plus, CheckCircle2, AlertTriangle, 
  MapPin, Clock, ExternalLink, ShieldCheck, PieChart, LayoutDashboard
} from 'lucide-react';
import { AppUser, ImovelLot, VehicleLot, AuctionPortal } from '../types';
import { calculateEstimatedProfit } from './LotesImovel';

interface MeuPainelProps {
  currentUser: AppUser | null;
  properties: ImovelLot[];
  vehicles: VehicleLot[];
  portals: AuctionPortal[];
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
  onNavigate
}: MeuPainelProps) {
  const userName = currentUser?.name ? currentUser.name : 'Usuário';
  const userFirstName = userName.split(' ')[0];

  // Calculate Imóveis Totals
  const propertiesMetrics = properties.map(p => {
    const profitData = calculateEstimatedProfit(p);
    return {
      marketValue: p.marketValue || 0,
      upfrontCosts: profitData.upfrontCosts || 0,
      netProfit: profitData.netProfit || 0,
      roiPercent: profitData.roiPercent || 0,
      arrematado: p.arrematado === 'Sim'
    };
  });

  const totalPropMarketValue = propertiesMetrics.reduce((acc, curr) => acc + curr.marketValue, 0);
  const totalPropUpfrontCosts = propertiesMetrics.reduce((acc, curr) => acc + curr.upfrontCosts, 0);
  const totalPropNetProfit = propertiesMetrics.reduce((acc, curr) => acc + curr.netProfit, 0);
  const avgPropRoi = propertiesMetrics.length > 0 
    ? propertiesMetrics.reduce((acc, curr) => acc + curr.roiPercent, 0) / propertiesMetrics.length 
    : 0;
  const countPropArrematados = propertiesMetrics.filter(p => p.arrematado).length;

  // Calculate Vehicles Totals
  const totalVehiclesMarketValue = vehicles.reduce((acc, curr) => acc + (curr.marketValue || curr.fipeValue || 0), 0);
  const totalVehiclesSuggestedBid = vehicles.reduce((acc, curr) => acc + (curr.suggestedBid || curr.bidValue1 || 0), 0);
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
      {/* Top Banner Greeting */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="bg-gradient-to-r from-[#121215] via-[#1A1A1E] to-[#121215] border border-[#2C2C2E] rounded-3xl p-6 md:p-8 shadow-xl relative overflow-hidden"
      >
        <div className="absolute right-0 top-0 -mt-12 -mr-12 w-64 h-64 rounded-full bg-emerald-500/10 blur-3xl pointer-events-none" />
        
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-full text-xs font-bold uppercase tracking-wider">
                <LayoutDashboard className="h-3.5 w-3.5" />
                Meu Painel Executivo
              </span>
              {currentUser?.role === 'admin' && (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-amber-500/10 border border-amber-500/20 text-amber-400 rounded-full text-[11px] font-bold">
                  Administrador
                </span>
              )}
            </div>

            <h1 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight">
              Olá, <span className="text-emerald-400">{userFirstName}</span>! Visão geral do seu portfólio
            </h1>

            <p className="text-xs md:text-sm text-slate-400 max-w-2xl leading-relaxed">
              Acompanhe em tempo real as métricas financeiras, o valor total do portfólio, estimativa de lucro e retornos sobre investimentos em leilões.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <button
              onClick={() => onNavigate('imoveis')}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition shadow-lg shadow-emerald-600/20 cursor-pointer active:scale-95"
            >
              <Building className="h-4 w-4" />
              <span>Ver Imóveis ({properties.length})</span>
            </button>
            <button
              onClick={() => onNavigate('lotes')}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#2C2C2E] hover:bg-[#3A3A3D] text-white rounded-xl text-xs font-bold transition cursor-pointer active:scale-95 border border-[#3A3A3D]"
            >
              <Car className="h-4 w-4 text-amber-400" />
              <span>Ver Veículos ({vehicles.length})</span>
            </button>
          </div>
        </div>
      </motion.div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Patrimônio Mapeado */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.1 }}
          className="bg-[#0E0E0E] border border-[#2C2C2E] rounded-2xl p-5 shadow-sm space-y-3"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Patrimônio Mapeado</span>
            <div className="p-2 bg-blue-500/10 text-blue-400 rounded-xl">
              <DollarSign className="h-4 w-4" />
            </div>
          </div>
          <div>
            <div className="text-xl md:text-2xl font-black font-mono text-white">
              {formatBRL(globalMarketValue)}
            </div>
            <p className="text-[11px] text-slate-400 mt-1">
              Avaliação de mercado combinada
            </p>
          </div>
        </motion.div>

        {/* Card 2: Aporte Necessário / Estimado */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.15 }}
          className="bg-[#0E0E0E] border border-[#2C2C2E] rounded-2xl p-5 shadow-sm space-y-3"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Aporte Estimado</span>
            <div className="p-2 bg-amber-500/10 text-amber-400 rounded-xl">
              <TrendingUp className="h-4 w-4" />
            </div>
          </div>
          <div>
            <div className="text-xl md:text-2xl font-black font-mono text-amber-400">
              {formatBRL(globalInvested)}
            </div>
            <p className="text-[11px] text-slate-400 mt-1">
              Capital total estimado para arrematação
            </p>
          </div>
        </motion.div>

        {/* Card 3: Lucro Estimado Total */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.2 }}
          className="bg-[#0E0E0E] border border-[#2C2C2E] rounded-2xl p-5 shadow-sm space-y-3"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Lucro Líquido Projetado</span>
            <div className="p-2 bg-emerald-500/10 text-emerald-400 rounded-xl">
              <Sparkles className="h-4 w-4" />
            </div>
          </div>
          <div>
            <div className="text-xl md:text-2xl font-black font-mono text-emerald-400">
              {formatBRL(globalEstimatedProfit)}
            </div>
            <p className="text-[11px] text-slate-400 mt-1">
              Retorno líquido total projetado
            </p>
          </div>
        </motion.div>

        {/* Card 4: ROI Médio Imóveis */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.25 }}
          className="bg-[#0E0E0E] border border-[#2C2C2E] rounded-2xl p-5 shadow-sm space-y-3"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">ROI Médio (Imóveis)</span>
            <div className="p-2 bg-purple-500/10 text-purple-400 rounded-xl">
              <Percent className="h-4 w-4" />
            </div>
          </div>
          <div>
            <div className="text-xl md:text-2xl font-black font-mono text-purple-400">
              {formatPercentBR(avgPropRoi)}%
            </div>
            <p className="text-[11px] text-slate-400 mt-1">
              {countPropArrematados} imóvel(is) arrematado(s)
            </p>
          </div>
        </motion.div>
      </div>

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

            <button
              onClick={() => onNavigate('imoveis')}
              className="text-xs font-bold text-emerald-400 hover:text-emerald-300 flex items-center gap-1 transition cursor-pointer"
            >
              <span>Abrir Consultor</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
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
                      <span className="text-xs font-extrabold text-white block truncate">{v.title}</span>
                      <p className="text-[11px] text-slate-400 truncate">
                        {v.typeText || 'Veículo'} • {v.location}
                      </p>
                    </div>

                    <div className="text-right shrink-0">
                      <span className="text-xs font-black font-mono text-amber-400 block">
                        {formatBRL(v.suggestedBid || v.bidValue1 || 0)}
                      </span>
                      <span className="text-[10px] font-mono text-slate-400">
                        {formatBRL(v.marketValue || v.fipeValue || 0)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Quick Action Navigation Buttons Banner */}
      <div className="bg-[#0E0E0E] border border-[#2C2C2E] rounded-3xl p-6 space-y-4">
        <h3 className="text-sm font-extrabold text-white uppercase tracking-wider">Ações Rápidas no Sistema</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <button
            onClick={() => onNavigate('imoveis')}
            className="flex items-center justify-between p-4 bg-black/60 hover:bg-black border border-[#2C2C2E] hover:border-emerald-500/40 rounded-2xl transition cursor-pointer group"
          >
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-500/10 text-blue-400 rounded-xl">
                <Building className="h-4 w-4" />
              </div>
              <div className="text-left">
                <span className="text-xs font-bold text-white block">Consultor de Imóveis</span>
                <span className="text-[10px] text-slate-400">Cadastrar e analisar imóveis</span>
              </div>
            </div>
            <ArrowRight className="h-4 w-4 text-slate-500 group-hover:text-emerald-400 group-hover:translate-x-1 transition-all" />
          </button>

          <button
            onClick={() => onNavigate('lotes')}
            className="flex items-center justify-between p-4 bg-black/60 hover:bg-black border border-[#2C2C2E] hover:border-emerald-500/40 rounded-2xl transition cursor-pointer group"
          >
            <div className="flex items-center gap-3">
              <div className="p-2 bg-amber-500/10 text-amber-400 rounded-xl">
                <Car className="h-4 w-4" />
              </div>
              <div className="text-left">
                <span className="text-xs font-bold text-white block">Consultor de Veículos</span>
                <span className="text-[10px] text-slate-400">Avaliar carros e motos FIPE</span>
              </div>
            </div>
            <ArrowRight className="h-4 w-4 text-slate-500 group-hover:text-amber-400 group-hover:translate-x-1 transition-all" />
          </button>

          <button
            onClick={() => onNavigate('portals')}
            className="flex items-center justify-between p-4 bg-black/60 hover:bg-black border border-[#2C2C2E] hover:border-emerald-500/40 rounded-2xl transition cursor-pointer group"
          >
            <div className="flex items-center gap-3">
              <div className="p-2 bg-emerald-500/10 text-emerald-400 rounded-xl">
                <Globe className="h-4 w-4" />
              </div>
              <div className="text-left">
                <span className="text-xs font-bold text-white block">Portais & Leiloeiros</span>
                <span className="text-[10px] text-slate-400">{portals.length} portais integrados</span>
              </div>
            </div>
            <ArrowRight className="h-4 w-4 text-slate-500 group-hover:text-emerald-400 group-hover:translate-x-1 transition-all" />
          </button>
        </div>
      </div>
    </div>
  );
}
