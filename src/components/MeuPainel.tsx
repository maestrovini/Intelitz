import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Building, Car, Globe, TrendingUp, DollarSign, Percent, 
  ArrowRight, Sparkles, CheckCircle2, MapPin, ExternalLink,
  Wallet, Landmark, Users, ChevronUp, ChevronDown, X,
  FileText, Info, Bed, FileDown, ShieldCheck, UserCheck
} from 'lucide-react';
import { AppUser, ImovelLot, VehicleLot, AuctionPortal } from '../types';
import { calculateEstimatedProfit } from './LotesImovel';

interface MeuPainelProps {
  currentUser: AppUser | null;
  properties: ImovelLot[];
  setProperties?: React.Dispatch<React.SetStateAction<ImovelLot[]>>;
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

const getSplitLocation = (locStr: string = '') => {
  if (!locStr) return { mainAddress: 'Endereço não informado', cityState: '' };
  const parts = locStr.split('-');
  if (parts.length >= 2) {
    const cityState = parts[parts.length - 1].trim();
    const mainAddress = parts.slice(0, parts.length - 1).join('-').trim();
    return { mainAddress, cityState };
  }
  return { mainAddress: locStr, cityState: '' };
};

export default function MeuPainel({
  currentUser,
  properties,
  setProperties,
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

  const [selectedProperty, setSelectedProperty] = useState<ImovelLot | null>(null);
  const [showDetails, setShowDetails] = useState(false);
  const [isSpecsExpanded, setIsSpecsExpanded] = useState(true);
  const [isPortalExpanded, setIsPortalExpanded] = useState(true);
  const [isNotesExpanded, setIsNotesExpanded] = useState(true);
  const [isPricingExpanded, setIsPricingExpanded] = useState(true);
  const [participationPercent, setParticipationPercent] = useState<number>(100);
  const [isParticipationDropdownOpen, setIsParticipationDropdownOpen] = useState(false);
  const [isUserDropdownOpen, setIsUserDropdownOpen] = useState(false);

  const isUserAssignedToLot = (lot: ImovelLot, user: AppUser) => {
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

  // Filter arrematados properties for target user
  const userArrematadosProperties = targetUser
    ? properties.filter(p => p.arrematado === 'Sim' && isUserAssignedToLot(p, targetUser))
    : properties.filter(p => p.arrematado === 'Sim');

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

  // Imóveis Arrematados Specific Totals
  const arrematadosMetrics = propertiesMetrics.filter(p => p.arrematado);
  const countPropArrematados = userArrematadosProperties.length;
  const totalArrematadosNetProfit = userArrematadosProperties.reduce((acc, p) => acc + calculateEstimatedProfit(p).netProfit, 0);
  const totalArrematadosCapitalProprio = userArrematadosProperties.reduce((acc, p) => acc + calculateEstimatedProfit(p).capitalProprio, 0);
  const totalArrematadosRecursosTerceiros = userArrematadosProperties.reduce((acc, p) => acc + calculateEstimatedProfit(p).recursosTerceiros, 0);
  const totalArrematadosUpfront = totalArrematadosCapitalProprio + totalArrematadosRecursosTerceiros;

  const avgPropRoi = userArrematadosProperties.length > 0 
    ? userArrematadosProperties.reduce((acc, p) => acc + calculateEstimatedProfit(p).roiPercent, 0) / userArrematadosProperties.length 
    : 0;

  const assignableUsers = users.filter(u => u.id !== 'usr-admin' && u.username !== 'admin');

  const updatePropertyNotes = (lotId: string, newNotes: string) => {
    if (!setProperties) return;
    setProperties(prev => prev.map(p => p.id === lotId ? { ...p, notes: newNotes } : p));
  };

  return (
    <div className="space-y-8 w-full max-w-none px-0 py-2">
      {/* Top Greeting */}
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
          Acompanhe em tempo real as métricas financeiras, aportes, lucro líquido e imóveis arrematados do seu portfólio.
        </p>
      </motion.div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 items-start">
        {/* Col 1: Aporte Próprio */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.1 }}
          className="bg-[#0E0E0E] border border-[#2C2C2E] rounded-2xl p-4 shadow-sm flex items-center justify-between gap-3 h-full"
        >
          <div className="flex-1 min-w-0 space-y-0.5">
            <span className="text-[10.5px] font-bold text-slate-400 uppercase tracking-wider block leading-tight">Aporte Próprio</span>
            <div className="text-lg md:text-xl font-black font-mono text-emerald-400 leading-tight">
              {formatBRL(totalArrematadosCapitalProprio)}
            </div>
            <p className="text-[10px] text-slate-400 mt-0.5">
              Capital próprio nos imóveis arrematados ({countPropArrematados})
            </p>
          </div>
          <div className="p-2.5 bg-emerald-500/10 text-emerald-400 rounded-xl shrink-0 flex items-center justify-center">
            <Wallet className="h-6 w-6 sm:h-7 sm:w-7" />
          </div>
        </motion.div>

        {/* Col 2: Aporte de Terceiros e Aporte Total (Um abaixo do outro) */}
        <div className="flex flex-col gap-3">
          {/* Aporte de Terceiros */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.15 }}
            className="bg-[#0E0E0E] border border-[#2C2C2E] rounded-2xl p-4 shadow-sm flex items-center justify-between gap-3"
          >
            <div className="flex-1 min-w-0 space-y-0.5">
              <span className="text-[10.5px] font-bold text-slate-400 uppercase tracking-wider block leading-tight">Aporte de Terceiros</span>
              <div className="text-lg md:text-xl font-black font-mono text-blue-400 leading-tight">
                {formatBRL(totalArrematadosRecursosTerceiros)}
              </div>
              <p className="text-[10px] text-slate-400 mt-0.5">
                Recursos de terceiros nos imóveis arrematados ({countPropArrematados})
              </p>
            </div>
            <div className="p-2.5 bg-blue-500/10 text-blue-400 rounded-xl shrink-0 flex items-center justify-center">
              <Landmark className="h-6 w-6 sm:h-7 sm:w-7" />
            </div>
          </motion.div>

          {/* Card Aporte Total (Abaixo do Aporte de Terceiros) */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.18 }}
            className="bg-[#0E0E0E] border border-[#2C2C2E] rounded-2xl p-4 shadow-sm flex items-center justify-between gap-3"
          >
            <div className="flex-1 min-w-0 space-y-0.5">
              <span className="text-[10.5px] font-bold text-slate-400 uppercase tracking-wider block leading-tight">Aporte Total</span>
              <div className="text-lg md:text-xl font-black font-mono text-amber-400 leading-tight">
                {formatBRL(totalArrematadosUpfront)}
              </div>
              <p className="text-[10px] text-slate-400 mt-0.5">
                Investimento total nos imóveis arrematados ({countPropArrematados})
              </p>
            </div>
            <div className="p-2.5 bg-amber-500/10 text-amber-400 rounded-xl shrink-0 flex items-center justify-center">
              <TrendingUp className="h-6 w-6 sm:h-7 sm:w-7" />
            </div>
          </motion.div>
        </div>

        {/* Col 3: Lucro Líquido */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.2 }}
          className="bg-[#0E0E0E] border border-[#2C2C2E] rounded-2xl p-4 shadow-sm flex items-center justify-between gap-3 h-full"
        >
          <div className="flex-1 min-w-0 space-y-0.5">
            <span className="text-[10.5px] font-bold text-slate-400 uppercase tracking-wider block leading-tight">Lucro Líquido</span>
            <div className="text-lg md:text-xl font-black font-mono text-teal-400 leading-tight">
              {formatBRL(totalArrematadosNetProfit)}
            </div>
            <p className="text-[10px] text-slate-400 mt-0.5">
              Lucro dos imóveis arrematados ({countPropArrematados})
            </p>
          </div>
          <div className="p-2.5 bg-teal-500/10 text-teal-400 rounded-xl shrink-0 flex items-center justify-center">
            <CheckCircle2 className="h-6 w-6 sm:h-7 sm:w-7" />
          </div>
        </motion.div>

        {/* Col 4: ROI Médio (Imóveis) */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.25 }}
          className="bg-[#0E0E0E] border border-[#2C2C2E] rounded-2xl p-4 shadow-sm flex items-center justify-between gap-3 h-full"
        >
          <div className="flex-1 min-w-0 space-y-0.5">
            <span className="text-[10.5px] font-bold text-slate-400 uppercase tracking-wider block leading-tight">ROI Médio (Imóveis)</span>
            <div className="text-lg md:text-xl font-black font-mono text-purple-400 leading-tight">
              {formatPercentBR(avgPropRoi)}%
            </div>
            <p className="text-[10px] text-slate-400 mt-0.5">
              {countPropArrematados} imóvel(is) arrematado(s)
            </p>
          </div>
          <div className="p-2.5 bg-purple-500/10 text-purple-400 rounded-xl shrink-0 flex items-center justify-center">
            <Percent className="h-6 w-6 sm:h-7 sm:w-7" />
          </div>
        </motion.div>
      </div>

      {/* Section: Os Imóveis Arrematados */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.3 }}
        className="space-y-4 pt-4"
      >
        <div className="flex items-center justify-between border-b border-[#2C2C2E] pb-3">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-emerald-500/10 text-emerald-400 rounded-2xl border border-emerald-500/20">
              <Building className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-xl font-extrabold text-white tracking-tight">Os imóveis arrematados</h2>
              <p className="text-xs text-slate-400">Clique em qualquer imóvel abaixo para visualizar a ficha estendida completa</p>
            </div>
          </div>
          <span className="px-3 py-1.5 text-xs font-black rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-mono">
            {userArrematadosProperties.length} {userArrematadosProperties.length === 1 ? 'imóvel arrematado' : 'imóveis arrematados'}
          </span>
        </div>

        {userArrematadosProperties.length === 0 ? (
          <div className="p-10 text-center bg-[#0E0E0E] border border-[#2C2C2E] rounded-3xl space-y-2">
            <Building className="h-10 w-10 text-slate-600 mx-auto" />
            <p className="text-sm font-bold text-slate-300">Nenhum imóvel arrematado encontrado</p>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              Quando houver imóveis com o status "Arrematado = Sim" atribuídos ao seu usuário, eles aparecerão detalhadamente nesta lista.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {userArrematadosProperties.map((item) => {
              const profitData = calculateEstimatedProfit(item);
              const { mainAddress, cityState } = getSplitLocation(item.location);

              return (
                <motion.div
                  key={item.id}
                  whileHover={{ y: -4, scale: 1.01 }}
                  transition={{ duration: 0.2 }}
                  onClick={() => {
                    setSelectedProperty(item);
                    setShowDetails(true);
                  }}
                  className="group bg-[#0E0E0E] border border-emerald-500/30 hover:border-emerald-400 rounded-2xl p-4 cursor-pointer transition-all shadow-md flex flex-col justify-between space-y-3.5 relative overflow-hidden"
                >
                  {/* Top Bar Badge */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="space-y-1 min-w-0 pr-2">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {cityState && (
                          <span className="text-[#10B981] font-black text-xs font-inter">{cityState}</span>
                        )}
                        <span className="text-[10px] font-extrabold uppercase bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded font-mono">
                          {item.typeText}
                        </span>
                      </div>
                      <h3 className="text-xs sm:text-sm font-bold text-white leading-snug line-clamp-2">
                        {mainAddress} {item.condoName ? `(${item.condoName})` : ''}
                      </h3>
                    </div>
                    <span className="bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 text-[10px] font-black px-2 py-0.5 rounded-lg shrink-0 uppercase tracking-wider font-mono">
                      Arrematado
                    </span>
                  </div>

                  {/* Financial Grid */}
                  <div className="grid grid-cols-3 gap-2 bg-black/60 border border-[#2C2C2E] p-2.5 rounded-xl text-center font-mono">
                    <div>
                      <span className="text-[9px] font-bold text-slate-400 uppercase block">Aporte Est.</span>
                      <span className="text-xs font-bold text-amber-400">{formatBRL(profitData.upfrontCosts)}</span>
                    </div>
                    <div>
                      <span className="text-[9px] font-bold text-slate-400 uppercase block">Lucro Líq.</span>
                      <span className="text-xs font-bold text-teal-400">{formatBRL(profitData.netProfit)}</span>
                    </div>
                    <div>
                      <span className="text-[9px] font-bold text-slate-400 uppercase block">ROI %</span>
                      <span className="text-xs font-bold text-purple-400">+{formatPercentBR(profitData.roiPercent)}%</span>
                    </div>
                  </div>

                  {/* Card Footer Call to Action */}
                  <div className="flex items-center justify-between pt-1 border-t border-[#2C2C2E]/60 text-xs">
                    <span className="text-[11px] text-slate-400 font-medium group-hover:text-emerald-400 transition-colors">
                      Abrir ficha estendida
                    </span>
                    <ArrowRight className="h-3.5 w-3.5 text-emerald-400 group-hover:translate-x-1 transition-transform" />
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </motion.div>

      {/* FLOATING FULL EXTENDED CARD MODAL FOR ARREMATADO PROPERTY DETAILS */}
      <AnimatePresence>
        {showDetails && selectedProperty && (() => {
          const profitData = calculateEstimatedProfit(selectedProperty);
          const commissionVal = selectedProperty.suggestedBid * ((selectedProperty.commission ?? 5) / 100);
          const saleVal = selectedProperty.saleValue ?? selectedProperty.marketValue;
          const corretagemVal = saleVal * ((selectedProperty.corretagem ?? 0) / 100);
          const customExpVal = (selectedProperty.customExpenses || []).reduce((acc, c) => acc + (c.value || 0), 0);

          return (
            <div className="fixed inset-0 z-50 bg-black flex flex-col h-screen w-screen overflow-y-auto font-sans text-[#F8FAFC]">
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 30 }}
                transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                className="bg-black min-h-screen flex flex-col w-full shadow-2xl relative text-[#F8FAFC]"
              >
                {/* Modal Header Bar */}
                <div className="sticky top-0 bg-[#1C1C1E] border-b border-[#2C2C2E] px-4 py-3 flex items-center justify-between z-20 shadow-xs">
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4 text-[#10B981]" />
                    <span className="text-xs font-black uppercase font-mono text-slate-300 tracking-wider">
                      Ficha Estendida do Imóvel
                    </span>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 text-xs font-black px-2.5 py-1 rounded-xl uppercase tracking-wider font-mono">
                      Arrematado = Sim
                    </span>

                    <button
                      onClick={() => {
                        setShowDetails(false);
                        setSelectedProperty(null);
                      }}
                      className="p-1.5 text-zinc-400 hover:text-white hover:bg-[#2C2C2E] rounded-full transition cursor-pointer"
                      title="Fechar"
                    >
                      <X className="h-5 w-5" />
                    </button>
                  </div>
                </div>

                {/* Modal Body Container */}
                <div className="max-w-4xl mx-auto w-full px-4 py-6 flex-1 space-y-6">
                  {/* Property Header Title */}
                  <div className="space-y-1 border-b border-[#2C2C2E] pb-4">
                    {(() => {
                      const { mainAddress, cityState } = getSplitLocation(selectedProperty.location);
                      return (
                        <>
                          <div className="flex items-center gap-2 flex-wrap mb-1">
                            {cityState && (
                              <span className="text-[#10B981] font-black font-inter text-sm md:text-base">{cityState}</span>
                            )}
                            <span className="bg-[#1C1C1E] text-slate-300 text-[10px] font-extrabold uppercase px-2 py-0.5 rounded font-mono tracking-wider border border-[#2C2C2E]">
                              {selectedProperty.typeText}
                            </span>
                          </div>
                          <h1 className="text-lg md:text-xl font-black font-inter text-white leading-snug">
                            {mainAddress} {selectedProperty.condoName ? `(${selectedProperty.condoName})` : ''}
                          </h1>
                        </>
                      );
                    })()}
                  </div>

                  {/* Extended Financial KPI Grid */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 font-mono">
                    <div className="bg-[#0E0E0E] border border-[#2C2C2E] p-3.5 rounded-2xl space-y-1">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Valor Mercado</span>
                      <p className="text-sm font-black text-white">{formatBRL(selectedProperty.marketValue)}</p>
                    </div>

                    <div className="bg-[#0E0E0E] border border-[#2C2C2E] p-3.5 rounded-2xl space-y-1">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Lance Sugerido</span>
                      <p className="text-sm font-black text-amber-400">{formatBRL(selectedProperty.suggestedBid)}</p>
                    </div>

                    <div className="bg-[#0E0E0E] border border-[#2C2C2E] p-3.5 rounded-2xl space-y-1">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Aporte Próprio</span>
                      <p className="text-sm font-black text-emerald-400">{formatBRL(profitData.capitalProprio)}</p>
                    </div>

                    <div className="bg-[#0E0E0E] border border-[#2C2C2E] p-3.5 rounded-2xl space-y-1">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Aporte Terceiros</span>
                      <p className="text-sm font-black text-blue-400">{formatBRL(profitData.recursosTerceiros)}</p>
                    </div>

                    <div className="bg-[#0E0E0E] border border-[#2C2C2E] p-3.5 rounded-2xl space-y-1">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Lucro Líquido</span>
                      <p className="text-sm font-black text-teal-400">{formatBRL(profitData.netProfit)}</p>
                    </div>

                    <div className="bg-[#0E0E0E] border border-[#2C2C2E] p-3.5 rounded-2xl space-y-1">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">ROI Estimado</span>
                      <p className="text-sm font-black text-purple-400">{formatPercentBR(profitData.roiPercent)}%</p>
                    </div>
                  </div>

                  {/* Specifications & Financial Breakdown */}
                  <div className="space-y-4">
                    {/* Specs Section */}
                    <div className="bg-[#0E0E0E] rounded-2xl p-4 border border-[#2C2C2E]">
                      <div 
                        onClick={() => setIsSpecsExpanded(!isSpecsExpanded)}
                        className="flex items-center justify-between cursor-pointer"
                      >
                        <div className="flex items-center gap-2">
                          <Building className="h-4 w-4 text-[#10B981]" />
                          <span className="text-xs font-black font-mono uppercase tracking-wider text-[#10B981]">
                            Características do Imóvel
                          </span>
                        </div>
                        {isSpecsExpanded ? <ChevronUp className="h-4 w-4 text-slate-400" /> : <ChevronDown className="h-4 w-4 text-slate-400" />}
                      </div>

                      {isSpecsExpanded && (
                        <div className="mt-3 grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs text-slate-300 pt-2 border-t border-[#2C2C2E]/60">
                          <div>Área: <strong className="text-white font-mono">{selectedProperty.area || 'N/A'}</strong></div>
                          <div>Ocupação: <strong className="text-white">{selectedProperty.occupancyStatus || 'N/A'}</strong></div>
                          <div>Dormitórios: <strong className="text-white font-mono">{selectedProperty.bedrooms ?? 'N/A'}</strong></div>
                          <div>Garagem: <strong className="text-white">{selectedProperty.garage || 'N/A'}</strong></div>
                          <div>Matrícula: <strong className="text-white font-mono">{selectedProperty.registration || 'N/A'}</strong></div>
                          <div>Zona: <strong className="text-white">{selectedProperty.zone || 'N/A'}</strong></div>
                        </div>
                      )}
                    </div>

                    {/* Cost Breakdown Section */}
                    <div className="bg-[#0E0E0E] rounded-2xl p-4 border border-[#2C2C2E]">
                      <div 
                        onClick={() => setIsPricingExpanded(!isPricingExpanded)}
                        className="flex items-center justify-between cursor-pointer"
                      >
                        <div className="flex items-center gap-2">
                          <DollarSign className="h-4 w-4 text-[#10B981]" />
                          <span className="text-xs font-black font-mono uppercase tracking-wider text-[#10B981]">
                            Detalhamento de Custos & Aportes
                          </span>
                        </div>
                        {isPricingExpanded ? <ChevronUp className="h-4 w-4 text-slate-400" /> : <ChevronDown className="h-4 w-4 text-slate-400" />}
                      </div>

                      {isPricingExpanded && (
                        <div className="mt-3 space-y-2 pt-2 border-t border-[#2C2C2E]/60 font-mono text-xs">
                          <div className="flex justify-between py-1 border-b border-[#2C2C2E]/40">
                            <span className="text-slate-400">Lance Recomendado:</span>
                            <span className="text-white font-bold">{formatBRL(selectedProperty.suggestedBid)}</span>
                          </div>
                          <div className="flex justify-between py-1 border-b border-[#2C2C2E]/40">
                            <span className="text-slate-400">Comissão Leiloeiro ({selectedProperty.commission ?? 5}%):</span>
                            <span className="text-white">{formatBRL(commissionVal)}</span>
                          </div>
                          <div className="flex justify-between py-1 border-b border-[#2C2C2E]/40">
                            <span className="text-slate-400">ITBI / Escritura / Registro:</span>
                            <span className="text-white">{formatBRL((selectedProperty.itbi || 0) + (selectedProperty.registro || 0) + (selectedProperty.tabelionato || 0))}</span>
                          </div>
                          <div className="flex justify-between py-1 border-b border-[#2C2C2E]/40">
                            <span className="text-slate-400">Condomínio & IPTU Pendentes:</span>
                            <span className="text-white">{formatBRL((selectedProperty.condominium || 0) + (selectedProperty.iptu || 0))}</span>
                          </div>
                          <div className="flex justify-between py-1 border-b border-[#2C2C2E]/40">
                            <span className="text-slate-400">Reforma & Desocupação:</span>
                            <span className="text-white">{formatBRL((selectedProperty.reforma || 0) + (selectedProperty.desocupacao || 0))}</span>
                          </div>
                          {selectedProperty.emprestimo && selectedProperty.emprestimo > 0 ? (
                            <div className="flex justify-between py-1 border-b border-[#2C2C2E]/40">
                              <span className="text-blue-400">Recursos de Terceiros (Empréstimo):</span>
                              <span className="text-blue-400 font-bold">{formatBRL(selectedProperty.emprestimo)}</span>
                            </div>
                          ) : null}
                          <div className="flex justify-between py-1.5 pt-2 text-sm font-bold border-t border-[#2C2C2E]">
                            <span className="text-amber-400">Aporte Estimado Total:</span>
                            <span className="text-amber-400">{formatBRL(profitData.upfrontCosts)}</span>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Portal / Leiloeiro & Links */}
                    {selectedProperty.portalName && (
                      <div className="bg-[#0E0E0E] rounded-2xl p-4 border border-[#2C2C2E]">
                        <div 
                          onClick={() => setIsPortalExpanded(!isPortalExpanded)}
                          className="flex items-center justify-between cursor-pointer"
                        >
                          <div className="flex items-center gap-2">
                            <Globe className="h-4 w-4 text-[#10B981]" />
                            <span className="text-xs font-black font-mono uppercase tracking-wider text-[#10B981]">
                              Informações do Leiloeiro / Portal
                            </span>
                          </div>
                          {isPortalExpanded ? <ChevronUp className="h-4 w-4 text-slate-400" /> : <ChevronDown className="h-4 w-4 text-slate-400" />}
                        </div>

                        {isPortalExpanded && (
                          <div className="mt-3 flex items-center justify-between pt-2 border-t border-[#2C2C2E]/60 text-xs">
                            <div className="space-y-1">
                              <p className="text-slate-300 font-bold">{selectedProperty.portalName}</p>
                              {selectedProperty.auctionDate && (
                                <p className="text-slate-400 text-[11px]">Data Leilão: {selectedProperty.auctionDate}</p>
                              )}
                            </div>

                            {selectedProperty.portalUrl && (
                              <a 
                                href={selectedProperty.portalUrl} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-xl font-bold transition"
                              >
                                <span>Ver no Leiloeiro</span>
                                <ExternalLink className="h-3.5 w-3.5" />
                              </a>
                            )}
                          </div>
                        )}
                      </div>
                    )}

                    {/* Notes Section */}
                    <div className="bg-[#0E0E0E] rounded-2xl p-4 border border-[#2C2C2E]">
                      <div 
                        onClick={() => setIsNotesExpanded(!isNotesExpanded)}
                        className="flex items-center justify-between cursor-pointer"
                      >
                        <div className="flex items-center gap-2">
                          <FileText className="h-4 w-4 text-[#10B981]" />
                          <span className="text-xs font-black font-mono uppercase tracking-wider text-[#10B981]">
                            Anotações do Imóvel
                          </span>
                        </div>
                        {isNotesExpanded ? <ChevronUp className="h-4 w-4 text-slate-400" /> : <ChevronDown className="h-4 w-4 text-slate-400" />}
                      </div>

                      {isNotesExpanded && (
                        <div className="mt-3 pt-2 border-t border-[#2C2C2E]/60">
                          <textarea
                            value={selectedProperty.notes || ''}
                            onChange={(e) => updatePropertyNotes(selectedProperty.id, e.target.value)}
                            placeholder="Adicione anotações estratégicas sobre este imóvel arrematado..."
                            className="w-full h-24 p-3 bg-black/60 border border-[#2C2C2E] rounded-xl text-xs text-slate-200 focus:outline-none focus:border-emerald-500/60 resize-none font-sans"
                          />
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </motion.div>
            </div>
          );
        })()}
      </AnimatePresence>
    </div>
  );
}
