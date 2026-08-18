import React from 'react';
import { 
  MapPin, 
  ExternalLink, 
  TrendingUp, 
  ShieldCheck, 
  ShieldAlert, 
  PieChart, 
  Hammer, 
  Gavel,
  Calendar
} from 'lucide-react';
import { ImovelLot, AppUser, AuctionPortal } from '../types';
import { 
  calculateEstimatedProfit, 
  calculateMarketLiquidity, 
  calculateRiskLevel, 
  getAuctionCountdown, 
  getSplitLocation
} from './LotesImovel';
import { formatBRL, formatPercentBR } from '../utils/formatters';

export interface MiniCardMetricsTagsProps {
  aporteInicial: number;
  lucroTotal: number;
  roiTotal: number;
  roiMonthly?: number;
  tirTotal?: number;
  profitMarginTotal?: number;
  isArrematado?: boolean;
}

export const MiniCardMetricsTags: React.FC<MiniCardMetricsTagsProps> = ({
  aporteInicial,
  lucroTotal,
  roiTotal,
  roiMonthly = 0,
  tirTotal = 0,
  profitMarginTotal = 0,
  isArrematado = false
}) => {
  return (
    <div className="pt-2.5 mt-1 border-t border-slate-200/80 dark:border-white/10 w-full">
      <div className="grid grid-cols-3 sm:grid-cols-6 gap-1.5 text-center w-full">
        {/* Aporte Inicial */}
        <div className="relative overflow-hidden flex flex-col items-center justify-center p-2 rounded-xl bg-white dark:bg-[#141416] border border-slate-200/80 dark:border-[#2C2C2E] shadow-2xs hover:border-amber-500/30 transition-all">
          <div className="absolute top-0 left-0 right-0 h-[2px] bg-amber-500" />
          <span className="text-[8px] sm:text-[8.5px] uppercase tracking-wider font-mono font-bold text-slate-500 dark:text-slate-400 flex items-center justify-center gap-1 truncate w-full">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0" />
            Aporte Inicial
          </span>
          <span className="font-black font-mono text-[11px] sm:text-xs truncate w-full mt-0.5 text-slate-900 dark:text-slate-100">
            {formatBRL(aporteInicial)}
          </span>
        </div>

        {/* ROI Total */}
        <div className="relative overflow-hidden flex flex-col items-center justify-center p-2 rounded-xl bg-white dark:bg-[#141416] border border-slate-200/80 dark:border-[#2C2C2E] shadow-2xs hover:border-emerald-500/30 transition-all">
          <div className="absolute top-0 left-0 right-0 h-[2px] bg-emerald-500" />
          <span className="text-[8px] sm:text-[8.5px] uppercase tracking-wider font-mono font-bold text-slate-500 dark:text-slate-400 flex items-center justify-center gap-1 truncate w-full">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
            ROI Total
          </span>
          <span className="font-black font-mono text-[11px] sm:text-xs truncate w-full mt-0.5 text-emerald-600 dark:text-emerald-400">
            {formatPercentBR(roiTotal)}%
          </span>
        </div>

        {/* ROI Mensal */}
        <div className="relative overflow-hidden flex flex-col items-center justify-center p-2 rounded-xl bg-white dark:bg-[#141416] border border-slate-200/80 dark:border-[#2C2C2E] shadow-2xs hover:border-teal-500/30 transition-all">
          <div className="absolute top-0 left-0 right-0 h-[2px] bg-teal-500" />
          <span className="text-[8px] sm:text-[8.5px] uppercase tracking-wider font-mono font-bold text-slate-500 dark:text-slate-400 flex items-center justify-center gap-1 truncate w-full">
            <span className="w-1.5 h-1.5 rounded-full bg-teal-500 shrink-0" />
            ROI Mensal
          </span>
          <span className="font-black font-mono text-[11px] sm:text-xs truncate w-full mt-0.5 text-teal-600 dark:text-teal-400">
            {formatPercentBR(roiMonthly)}%
          </span>
        </div>

        {/* TIR Total */}
        <div className="relative overflow-hidden flex flex-col items-center justify-center p-2 rounded-xl bg-white dark:bg-[#141416] border border-slate-200/80 dark:border-[#2C2C2E] shadow-2xs hover:border-indigo-500/30 transition-all">
          <div className="absolute top-0 left-0 right-0 h-[2px] bg-indigo-500" />
          <span className="text-[8px] sm:text-[8.5px] uppercase tracking-wider font-mono font-bold text-slate-500 dark:text-slate-400 flex items-center justify-center gap-1 truncate w-full">
            <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 shrink-0" />
            TIR Total
          </span>
          <span className="font-black font-mono text-[11px] sm:text-xs truncate w-full mt-0.5 text-indigo-600 dark:text-indigo-400">
            {formatPercentBR(tirTotal)}%
          </span>
        </div>

        {/* Margem Lucro */}
        <div className="relative overflow-hidden flex flex-col items-center justify-center p-2 rounded-xl bg-white dark:bg-[#141416] border border-slate-200/80 dark:border-[#2C2C2E] shadow-2xs hover:border-cyan-500/30 transition-all">
          <div className="absolute top-0 left-0 right-0 h-[2px] bg-cyan-500" />
          <span className="text-[8px] sm:text-[8.5px] uppercase tracking-wider font-mono font-bold text-slate-500 dark:text-slate-400 flex items-center justify-center gap-1 truncate w-full">
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-500 shrink-0" />
            Margem
          </span>
          <span className="font-black font-mono text-[11px] sm:text-xs truncate w-full mt-0.5 text-cyan-600 dark:text-cyan-400">
            {formatPercentBR(profitMarginTotal)}%
          </span>
        </div>

        {/* Lucro Est. */}
        <div className={`relative overflow-hidden flex flex-col items-center justify-center p-2 rounded-xl bg-white dark:bg-[#141416] border ${lucroTotal >= 0 ? 'border-slate-200/80 dark:border-[#2C2C2E] hover:border-emerald-500/30' : 'border-rose-500/30'} shadow-2xs transition-all`}>
          <div className={`absolute top-0 left-0 right-0 h-[2px] ${lucroTotal >= 0 ? 'bg-emerald-500' : 'bg-rose-500'}`} />
          <span className="text-[8px] sm:text-[8.5px] uppercase tracking-wider font-mono font-bold text-slate-500 dark:text-slate-400 flex items-center justify-center gap-1 truncate w-full">
            <span className={`w-1.5 h-1.5 rounded-full ${lucroTotal >= 0 ? 'bg-emerald-500' : 'bg-rose-500'} shrink-0`} />
            Lucro Est.
          </span>
          <span className={`font-black font-mono text-[11px] sm:text-xs truncate w-full mt-0.5 ${lucroTotal >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
            {formatBRL(lucroTotal)}
          </span>
        </div>
      </div>
    </div>
  );
};

export interface BaseCardLayoutProps {
  item: ImovelLot;
  isSelected?: boolean;
  onClick?: () => void;
  portals?: AuctionPortal[];
  assignableUsers?: AppUser[];
  activeUserObj?: AppUser | null;
  currentUser?: AppUser | null;
  className?: string;
  children?: React.ReactNode;
}

export default function BaseCardLayout({
  item,
  isSelected = false,
  onClick,
  portals = [],
  assignableUsers = [],
  activeUserObj,
  currentUser,
  className = '',
  children
}: BaseCardLayoutProps) {
  const isArrematado = item.arrematado === 'Sim' || item.vendido === 'Sim';
  const { mainAddress, cityState } = getSplitLocation(item.location);
  const countdown = getAuctionCountdown(item.auctionDate);
  const profitData = calculateEstimatedProfit(item);
  const isEncerrado = countdown && (countdown.diffDays < 0 || countdown.text?.includes('Encerrado'));

  const liquidity = calculateMarketLiquidity(item);
  const risk = calculateRiskLevel(item);
  const RiskIcon = risk.label === 'Baixo' ? ShieldCheck : ShieldAlert;

  const assignedIds = (!item.assignedUserIds || item.assignedUserIds.includes('all'))
    ? assignableUsers.map(u => u.id)
    : item.assignedUserIds.includes('none')
    ? []
    : item.assignedUserIds;

  const getShares = () => {
    if (item.userShares && Object.keys(item.userShares).length > 0) {
      const baseShares = { ...item.userShares };
      const missingIds = assignedIds.filter(id => baseShares[id] === undefined);
      if (missingIds.length > 0) {
        const existingSum = assignedIds.reduce((sum, id) => sum + (baseShares[id] || 0), 0);
        const remainingPct = Math.max(0, 100 - existingSum);
        const fillPct = Math.round((remainingPct / missingIds.length) * 100) / 100;
        missingIds.forEach(id => {
          baseShares[id] = fillPct;
        });
      }
      return baseShares;
    }
    if (assignedIds.length === 0) return {};
    const equalShare = Math.round((100 / assignedIds.length) * 100) / 100;
    const initialShares: Record<string, number> = {};
    assignedIds.forEach(id => {
      initialShares[id] = equalShare;
    });
    return initialShares;
  };

  const shares = getShares();
  const targetUserObj = activeUserObj || currentUser;

  let myShare = 0;
  if (targetUserObj) {
    if (shares[targetUserObj.id] !== undefined) {
      myShare = shares[targetUserObj.id];
    } else if (targetUserObj.username && shares[targetUserObj.username] !== undefined) {
      myShare = shares[targetUserObj.username];
    } else if (currentUser && shares[currentUser.id] !== undefined) {
      myShare = shares[currentUser.id];
    } else if (currentUser?.username && shares[currentUser.username] !== undefined) {
      myShare = shares[currentUser.username];
    }
  }

  if (myShare === 0 && targetUserObj) {
    const isAssigned = assignedIds.includes(targetUserObj.id) ||
                       (targetUserObj.username && assignedIds.includes(targetUserObj.username)) ||
                       (assignedIds.includes('all'));
    if (isAssigned && assignedIds.length > 0) {
      myShare = Math.round((100 / assignedIds.length) * 100) / 100;
    }
  }

  const formattedMyShare = Math.round(myShare * 100) / 100;

  const assignedUsers = assignableUsers.filter(u => assignedIds.includes(u.id));
  const activeUserId = targetUserObj?.id;
  const myUser = activeUserId ? assignedUsers.find(u => u.id === activeUserId || u.username === targetUserObj?.username) : null;
  const otherUsers = activeUserId ? assignedUsers.filter(u => u.id !== activeUserId && u.username !== targetUserObj?.username) : assignedUsers;
  const orderedUsers = myUser ? [myUser, ...otherUsers] : otherUsers;

  const userColors = [
    'bg-[#10B981]', // 1º: Usuário ativo (Emerald)
    'bg-blue-500',   // 2º: Azul Real
    'bg-purple-500', // 3º: Roxo
    'bg-amber-500',  // 4º: Âmbar
    'bg-cyan-500',   // Outros
    'bg-rose-500',
    'bg-indigo-500'
  ];

  return (
    <div
      id={`imovel-card-${item.id}`}
      onClick={onClick}
      className={`group property-lot-card rounded-2xl p-4 sm:p-5 transition-all duration-300 cursor-pointer relative overflow-hidden flex flex-col w-full bg-[#0E0E0E] border border-[#2C2C2E] hover:border-emerald-500/30 shadow-sm hover:shadow-md ${className}`}
    >
      <div className="flex flex-col gap-3">
        {/* Top: Cidade e Estado no lado esquerdo, User & Tempo Faltante / Portal no lado direito */}
        <div className="flex items-center justify-between gap-3 w-full">
          <div className="flex items-center gap-2 flex-wrap">
            <div className="text-base md:text-lg font-black font-inter text-slate-900 dark:text-[#F8FAFC] tracking-tight leading-snug">
              {cityState || mainAddress}
            </div>
            {item.typeText && (
              <span className="text-[9.5px] font-bold font-mono uppercase tracking-wider px-2 py-0.5 rounded-md bg-slate-100 dark:bg-[#1A1C20] text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-white/5">
                {item.typeText}
              </span>
            )}
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {/* Tempo Faltante no formato de Micro Card Calendário Financeiro */}
            {!(isArrematado && isEncerrado) && (
              <div 
                className="relative w-10 h-10 md:w-11 md:h-11 rounded-xl bg-slate-50 dark:bg-[#16171B] border border-slate-200 dark:border-white/10 flex flex-col items-center justify-between shrink-0 overflow-hidden transition-all shadow-2xs" 
                title={countdown ? `Tempo Faltante: ${countdown.diffDays > 0 ? `${countdown.diffDays} dias` : countdown.diffDays === 0 ? 'Hoje' : 'Encerrado'}` : 'Tempo Faltante'}
              >
                {/* Faixa Superior do Calendário */}
                <div className={`w-full h-3 md:h-3.5 flex items-center justify-center gap-1 ${
                  countdown?.isToday 
                    ? 'bg-amber-500' 
                    : (countdown && countdown.diffDays > 0 
                        ? 'bg-emerald-600 dark:bg-emerald-500' 
                        : 'bg-slate-400 dark:bg-slate-600')
                }`}>
                  <span className="w-1 h-1 rounded-full bg-white/90" />
                  <span className="w-1 h-1 rounded-full bg-white/90" />
                </div>

                {/* Número de Dias */}
                <div className="flex-1 flex items-center justify-center w-full">
                  <span className={`font-black font-mono leading-none tracking-tight ${
                    countdown?.isToday 
                      ? 'text-amber-600 dark:text-amber-400 text-xs md:text-sm' 
                      : (countdown && countdown.diffDays > 0 
                          ? 'text-slate-900 dark:text-white text-xs md:text-sm' 
                          : 'text-slate-400 text-[10px] md:text-xs')
                  }`}>
                    {countdown ? (countdown.diffDays > 0 ? countdown.diffDays : 0) : '—'}
                  </span>
                </div>
              </div>
            )}

            {/* Logo ou Tag do portal */}
            {item.portalName && (() => {
              const pObj = portals?.find(p => p.name.trim().toLowerCase() === (item.portalName || '').trim().toLowerCase());
              const pLogo = pObj?.logoUrl;
              const isFlipping = item.businessType === 'House Flipping';
              if (pLogo) {
                return (
                  <span className="inline-flex items-center gap-1.5" title={`Portal: ${item.portalName} • ${isFlipping ? 'House Flipping' : 'Leilão'}`}>
                    <span 
                      className="relative w-10 h-10 md:w-11 md:h-11 rounded-xl bg-white dark:bg-[#16171B] border border-slate-200 dark:border-white/10 flex items-center justify-center shrink-0 overflow-hidden transition-all shadow-2xs" 
                    >
                      <img 
                        src={pLogo} 
                        alt={item.portalName} 
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          const parent = e.currentTarget.parentElement as HTMLElement;
                          if (parent) parent.style.display = 'none';
                        }}
                        referrerPolicy="no-referrer"
                      />
                    </span>
                    <span className={`w-10 h-10 md:w-11 md:h-11 rounded-xl flex items-center justify-center shrink-0 border shadow-2xs ${
                      isFlipping
                        ? 'bg-amber-50 dark:bg-amber-950/30 border-amber-300 dark:border-amber-500/30'
                        : 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-300 dark:border-emerald-500/30'
                    }`}>
                      {isFlipping ? (
                        <Hammer className="h-4 w-4 md:h-5 md:w-5 text-amber-600 dark:text-amber-400 shrink-0" title="House Flipping" />
                      ) : (
                        <Gavel className="h-4 w-4 md:h-5 md:w-5 text-emerald-600 dark:text-emerald-400 shrink-0" title="Leilão" />
                      )}
                    </span>
                  </span>
                );
              }
              return (
                <span 
                  className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-bold border shadow-2xs shrink-0 ${
                    isFlipping
                      ? 'bg-amber-50 dark:bg-amber-950/30 text-amber-800 dark:text-amber-300 border-amber-300 dark:border-amber-500/30'
                      : 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-800 dark:text-emerald-300 border-emerald-300 dark:border-emerald-500/30'
                  }`} 
                  title={`Portal: ${item.portalName} • ${isFlipping ? 'House Flipping' : 'Leilão'}`}
                >
                  {isFlipping ? (
                    <Hammer className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400 shrink-0" />
                  ) : (
                    <Gavel className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                  )}
                  <span className="truncate max-w-[100px] sm:max-w-[140px] font-inter">{item.portalName}</span>
                </span>
              );
            })()}
          </div>
        </div>

        {/* Condomínio e Endereço */}
        <div className="flex items-start gap-2.5 w-full" title={cityState ? mainAddress : item.location}>
          <div className="p-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-500/30 shrink-0 mt-0.5">
            <MapPin className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
          </div>
          <div className="flex flex-col flex-1 min-w-0 gap-0.5">
            {item.condoName ? (
              <span className="text-sm md:text-base font-extrabold text-slate-900 dark:text-white leading-tight truncate block" title={item.condoName}>
                {item.condoName}
              </span>
            ) : null}
            <span className="text-xs md:text-sm text-slate-600 dark:text-slate-300 font-medium leading-snug break-words block">
              {cityState ? mainAddress : item.location}
            </span>
          </div>
          {item.link && (
            <a
              href={item.link}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-emerald-50 dark:bg-[#1A1C20] dark:hover:bg-emerald-950/40 border border-slate-200 dark:border-white/10 text-slate-700 hover:text-emerald-700 dark:text-slate-300 dark:hover:text-emerald-400 transition-all shrink-0 inline-flex items-center gap-1.5 text-xs font-semibold self-start mt-0.5"
              title="Abrir Link do Leilão"
            >
              <ExternalLink className="h-3 w-3 text-emerald-600 dark:text-emerald-400" />
              <span className="hidden sm:inline">Link</span>
            </a>
          )}
        </div>

        {/* Painel Analítico: Liquidez, Risco e Participação */}
        <div className="flex flex-col gap-2.5 w-full bg-slate-50/80 dark:bg-[#000000]/40 p-3 rounded-xl border border-slate-200/80 dark:border-[#2C2C2E]/60">
          {/* Liquidez / Prazo da Operação */}
          <div className="flex flex-col gap-1 w-full">
            <div className="flex items-center justify-between text-[10.5px]">
              <div className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300">
                <TrendingUp className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                <span className="uppercase font-mono tracking-wider text-[10px] font-bold">
                  {isArrematado ? 'Prazo da Operação' : `Liquidez: Giro ${liquidity.level}`}
                </span>
              </div>
              <span className="font-mono font-bold text-[10.5px] text-slate-900 dark:text-slate-100">
                {isArrematado
                  ? (() => {
                      const m = profitData.monthsCount;
                      const days = Math.round(m * 30);
                      const formattedM = (m).toFixed(1).replace('.0', '');
                      return `${days} dias (${formattedM} ${m === 1 ? 'mês' : 'meses'})`;
                    })()
                  : liquidity.prazoTexto}
              </span>
            </div>
            <div className="w-full bg-slate-200/80 dark:bg-[#1A1C20] h-1.5 rounded-full overflow-hidden">
              <div
                className={`h-full transition-all duration-300 rounded-full ${liquidity.barColor}`}
                style={{
                  width: isArrematado
                    ? `${Math.min(100, Math.max(15, Math.round((profitData.monthsCount / 12) * 100)))}%`
                    : `${liquidity.score}%`
                }}
              />
            </div>
          </div>

          {/* Análise de Risco */}
          <div className="flex flex-col gap-1 w-full">
            <div className="flex items-center justify-between text-[10.5px]">
              <div className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300">
                <RiskIcon className={`h-3.5 w-3.5 shrink-0 ${risk.label === 'Alto' ? 'text-rose-500' : risk.label === 'Médio' ? 'text-amber-500' : 'text-emerald-600 dark:text-emerald-400'}`} />
                <span className="uppercase font-mono tracking-wider text-[10px] font-bold">Análise de Risco: {risk.label}</span>
              </div>
              <span className={`font-mono text-[10.5px] font-bold ${risk.label === 'Alto' ? 'text-rose-600 dark:text-rose-400' : risk.label === 'Médio' ? 'text-amber-600 dark:text-amber-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
                {risk.label === 'Baixo' ? 'Baixo Risco' : risk.label === 'Médio' ? 'Risco Moderado' : 'Alto Risco'}
              </span>
            </div>
            <div className="w-full bg-slate-200/80 dark:bg-[#1A1C20] h-1.5 rounded-full overflow-hidden">
              <div
                className={`h-full transition-all duration-300 rounded-full ${risk.barColor}`}
                style={{ width: `${risk.score}%` }}
              />
            </div>
          </div>

          {/* Barra de Participação */}
          <div className="flex flex-col gap-1 w-full">
            <div className="flex items-center justify-between text-[10.5px]">
              <div className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300">
                <PieChart className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                <span className="uppercase font-mono tracking-wider text-[10px] font-bold">
                  Participação ({assignedIds.length} {assignedIds.length === 1 ? 'operador' : 'operadores'})
                </span>
              </div>
              <span className="font-mono text-[10.5px] font-bold text-slate-900 dark:text-slate-100">
                Meu: {formattedMyShare}% Cotas
              </span>
            </div>
            <div className="w-full bg-slate-200/80 dark:bg-[#1A1C20] h-1.5 rounded-full flex relative overflow-hidden">
              {orderedUsers.length === 0 ? (
                <div className="w-full h-full bg-slate-300 dark:bg-zinc-800 rounded-full" />
              ) : (
                orderedUsers.map((u, idx) => {
                  const share = shares[u.id] || 0;
                  if (share <= 0) return null;
                  const colorBg = userColors[idx % userColors.length];
                  const isCurrentUser = u.id === targetUserObj?.id || u.username === targetUserObj?.username;
                  const totalUpfront = profitData?.upfrontCosts || item.suggestedBid || (item as any).secondBid || (item as any).secondBidValue || item.marketValue || 0;
                  const shareValueInReais = (totalUpfront * share) / 100;
                  const formattedValue = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(shareValueInReais);

                  return (
                    <div
                      key={u.id}
                      style={{ width: `${Math.min(100, share)}%` }}
                      className={`relative group/segment ${colorBg} h-full transition-all duration-200 cursor-pointer ${
                        isCurrentUser
                          ? 'brightness-110 z-20'
                          : 'opacity-90 z-10'
                      }`}
                    >
                      {/* Tooltip Flutuante */}
                      <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 opacity-0 group-hover/segment:opacity-100 transition-all duration-200 pointer-events-none z-30 flex flex-col items-center whitespace-nowrap">
                        <div className="bg-slate-900 dark:bg-zinc-950 text-white text-[10.5px] font-sans px-2.5 py-1.5 rounded-lg border border-slate-700 dark:border-zinc-700 flex flex-col items-center gap-0.5 shadow-lg">
                          <span className="font-bold text-slate-100 flex items-center gap-1">
                            {u.name || u.username} {isCurrentUser ? <span className="text-emerald-400 text-[9px] font-mono font-extrabold">(Você)</span> : ''}
                          </span>
                          <span className="text-slate-300 font-mono text-[9.5px]">
                            <strong className={isCurrentUser ? 'text-emerald-400' : 'text-cyan-400'}>{share}% Cotas</strong>
                            {shareValueInReais > 0 && (
                              <span className="text-emerald-400 font-bold ml-1">
                                • {formattedValue}
                              </span>
                            )}
                          </span>
                        </div>
                        {/* Seta do tooltip */}
                        <div className="w-0 h-0 border-x-4 border-x-transparent border-t-4 border-t-slate-900 dark:border-t-zinc-950" />
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* MiniCardMetricsTags */}
          <MiniCardMetricsTags
            aporteInicial={profitData.upfrontCosts}
            roiTotal={profitData.roiPercent}
            roiMonthly={profitData.roiMonthly}
            tirTotal={profitData.tirTotal}
            profitMarginTotal={profitData.profitMarginTotal}
            lucroTotal={profitData.netProfit}
            isArrematado={isArrematado}
          />
        </div>

        {/* Optional Slot for children */}
        {children}
      </div>
    </div>
  );
}
