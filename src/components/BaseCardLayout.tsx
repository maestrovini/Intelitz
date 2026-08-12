import React from 'react';
import { 
  MapPin, 
  ExternalLink, 
  TrendingUp, 
  ShieldCheck, 
  ShieldAlert, 
  PieChart, 
  Hammer, 
  Gavel 
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
    <div className="pt-2 mt-1 border-t border-white/10 w-full">
      <div className="grid grid-cols-3 gap-1 sm:gap-1.5 text-center w-full">
        {/* Aporte Inicial */}
        <div className="relative overflow-hidden flex flex-col items-center justify-center p-1.5 sm:p-2 rounded-xl bg-gradient-to-b from-[#13131A] via-[#0D0D12] to-[#08080B] border border-amber-500/20 shadow-md">
          <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-amber-400 to-transparent opacity-80" />
          <span className="text-[7.5px] sm:text-[8.5px] uppercase tracking-wider font-mono font-bold text-amber-200/70 flex items-center justify-center gap-1 drop-shadow-xs truncate w-full">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse shrink-0" />
            Aporte Inicial
          </span>
          <span className="font-black font-mono text-[10.5px] sm:text-xs truncate w-full mt-0.5 text-amber-400 drop-shadow-[0_0_8px_rgba(245,158,11,0.5)]">
            {formatBRL(aporteInicial)}
          </span>
        </div>

        {/* ROI Total */}
        <div className="relative overflow-hidden flex flex-col items-center justify-center p-1.5 sm:p-2 rounded-xl bg-gradient-to-b from-[#13131A] via-[#0D0D12] to-[#08080B] border border-cyan-500/20 shadow-md">
          <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-cyan-400 to-transparent opacity-80" />
          <span className="text-[7.5px] sm:text-[8.5px] uppercase tracking-wider font-mono font-bold text-cyan-200/70 flex items-center justify-center gap-1 drop-shadow-xs truncate w-full">
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse shrink-0" />
            ROI Total
          </span>
          <span className="font-black font-mono text-[10.5px] sm:text-xs truncate w-full mt-0.5 text-cyan-400 drop-shadow-[0_0_8px_rgba(34,211,238,0.5)]">
            {formatPercentBR(roiTotal)}%
          </span>
        </div>

        {/* ROI Mensal */}
        <div className="relative overflow-hidden flex flex-col items-center justify-center p-1.5 sm:p-2 rounded-xl bg-gradient-to-b from-[#13131A] via-[#0D0D12] to-[#08080B] border border-cyan-500/20 shadow-md">
          <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-cyan-400 to-transparent opacity-80" />
          <span className="text-[7.5px] sm:text-[8.5px] uppercase tracking-wider font-mono font-bold text-cyan-200/70 flex items-center justify-center gap-1 drop-shadow-xs truncate w-full">
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse shrink-0" />
            ROI Mensal
          </span>
          <span className="font-black font-mono text-[10.5px] sm:text-xs truncate w-full mt-0.5 text-cyan-400 drop-shadow-[0_0_8px_rgba(34,211,238,0.5)]">
            {formatPercentBR(roiMonthly)}%
          </span>
        </div>

        {/* TIR Total */}
        <div className="relative overflow-hidden flex flex-col items-center justify-center p-1.5 sm:p-2 rounded-xl bg-gradient-to-b from-[#13131A] via-[#0D0D12] to-[#08080B] border border-cyan-500/20 shadow-md">
          <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-cyan-400 to-transparent opacity-80" />
          <span className="text-[7.5px] sm:text-[8.5px] uppercase tracking-wider font-mono font-bold text-cyan-200/70 flex items-center justify-center gap-1 drop-shadow-xs truncate w-full">
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse shrink-0" />
            TIR Total
          </span>
          <span className="font-black font-mono text-[10.5px] sm:text-xs truncate w-full mt-0.5 text-cyan-400 drop-shadow-[0_0_8px_rgba(34,211,238,0.5)]">
            {formatPercentBR(tirTotal)}%
          </span>
        </div>

        {/* Margem Lucro */}
        <div className="relative overflow-hidden flex flex-col items-center justify-center p-1.5 sm:p-2 rounded-xl bg-gradient-to-b from-[#13131A] via-[#0D0D12] to-[#08080B] border border-cyan-500/20 shadow-md">
          <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-cyan-400 to-transparent opacity-80" />
          <span className="text-[7.5px] sm:text-[8.5px] uppercase tracking-wider font-mono font-bold text-cyan-200/70 flex items-center justify-center gap-1 drop-shadow-xs truncate w-full">
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse shrink-0" />
            Margem Lucro
          </span>
          <span className="font-black font-mono text-[10.5px] sm:text-xs truncate w-full mt-0.5 text-cyan-400 drop-shadow-[0_0_8px_rgba(34,211,238,0.5)]">
            {formatPercentBR(profitMarginTotal)}%
          </span>
        </div>

        {/* Lucro Est. */}
        <div className={`relative overflow-hidden flex flex-col items-center justify-center p-1.5 sm:p-2 rounded-xl bg-gradient-to-b from-[#13131A] via-[#0D0D12] to-[#08080B] border ${lucroTotal >= 0 ? 'border-amber-500/20' : 'border-rose-500/20'} shadow-md`}>
          <div className={`absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent ${lucroTotal >= 0 ? 'via-amber-400' : 'via-rose-400'} to-transparent opacity-80`} />
          <span className={`text-[7.5px] sm:text-[8.5px] uppercase tracking-wider font-mono font-bold ${lucroTotal >= 0 ? 'text-amber-200/70' : 'text-rose-200/70'} flex items-center justify-center gap-1 drop-shadow-xs truncate w-full`}>
            <span className={`w-1.5 h-1.5 rounded-full ${lucroTotal >= 0 ? 'bg-amber-400' : 'bg-rose-400'} animate-pulse shrink-0`} />
            Lucro Est.
          </span>
          <span className={`font-black font-mono text-[10.5px] sm:text-xs truncate w-full mt-0.5 ${lucroTotal >= 0 ? 'text-amber-400 drop-shadow-[0_0_8px_rgba(245,158,11,0.5)]' : 'text-rose-400 drop-shadow-[0_0_8px_rgba(244,63,94,0.5)]'}`}>
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
    'bg-emerald-500', // 1º: Usuário ativo
    'bg-blue-500',    // 2º: Azul
    'bg-purple-500',  // 3º: Roxo
    'bg-amber-500',   // 4º: Laranja
    'bg-cyan-500',    // Outros
    'bg-rose-500',
    'bg-indigo-500'
  ];

  return (
    <div
      onClick={onClick}
      className={`group rounded-2xl p-3.5 sm:p-4 transition-all duration-300 transform hover:-translate-y-1 hover:scale-[1.015] cursor-pointer relative overflow-hidden flex flex-col w-full border bg-gradient-to-b from-[#0A0A0C] via-[#050507] to-[#000000] border-white/12 shadow-[0_10px_30px_rgba(0,0,0,0.95),inset_0_1px_0_rgba(255,255,255,0.15)] md:hover:border-emerald-500/60 md:hover:shadow-[0_20px_40px_rgba(0,0,0,0.95),0_0_20px_rgba(16,185,129,0.15)] ${
        isSelected ? 'border-emerald-500/80 ring-2 ring-emerald-500/40 shadow-[0_0_20px_rgba(16,185,129,0.3)]' : ''
      } ${className}`}
    >
      <div className="flex flex-col gap-3">
        {/* Top: Cidade e Estado no lado esquerdo, User & Tempo Faltante / Portal no lado direito */}
        <div className="flex items-center justify-between gap-2 w-full">
          <div className="text-base md:text-lg lg:text-xl font-black font-inter text-[#F8FAFC] md:group-hover:text-emerald-400 md:hover:text-emerald-400 transition-colors leading-snug drop-shadow-xs">
            {cityState || mainAddress}
          </div>

          <div className="flex items-center gap-2 md:gap-2.5 shrink-0">
            {/* Tempo Faltante no topo no formato de Calendário */}
            {!(isArrematado && isEncerrado) && (
              <div 
                className="relative w-10 h-10 md:w-11 md:h-11 rounded-2xl bg-[#121215] border border-white/20 flex flex-col items-center justify-between shrink-0 overflow-hidden shadow-[0_6px_16px_rgba(0,0,0,0.8),inset_0_1.5px_1px_rgba(255,255,255,0.35)] group-hover:scale-105 transition-all p-0.5" 
                title={countdown ? `Tempo Faltante: ${countdown.diffDays > 0 ? `${countdown.diffDays} dias` : countdown.diffDays === 0 ? 'Hoje' : 'Encerrado'}` : 'Tempo Faltante'}
              >
                {/* Faixa Superior do Calendário */}
                <div className={`w-full h-3 md:h-3.5 rounded-t-xl flex items-center justify-center gap-1 ${
                  countdown?.isToday 
                    ? 'bg-gradient-to-r from-amber-600 via-amber-500 to-amber-600' 
                    : (countdown && countdown.diffDays > 0 
                        ? 'bg-gradient-to-r from-emerald-600 via-emerald-500 to-emerald-600' 
                        : 'bg-gradient-to-r from-slate-700 via-slate-600 to-slate-700')
                }`}>
                  <span className="w-0.5 h-0.5 md:w-1 md:h-1 rounded-full bg-white/90 shadow-xs" />
                  <span className="w-0.5 h-0.5 md:w-1 md:h-1 rounded-full bg-white/90 shadow-xs" />
                </div>

                {/* Número de Dias */}
                <div className="flex-1 flex items-center justify-center w-full">
                  <span className={`font-black font-mono leading-none tracking-tight ${
                    countdown?.isToday 
                      ? 'text-amber-400 animate-pulse text-xs md:text-sm drop-shadow-[0_0_8px_rgba(245,158,11,0.8)]' 
                      : (countdown && countdown.diffDays > 0 
                          ? 'text-white text-xs md:text-sm drop-shadow-xs' 
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
                      className="relative w-10 h-10 md:w-11 md:h-11 rounded-2xl bg-[#121215] border border-white/20 flex items-center justify-center shrink-0 overflow-hidden shadow-[0_6px_16px_rgba(0,0,0,0.8),inset_0_1.5px_1px_rgba(255,255,255,0.35)] group-hover:scale-105 transition-all" 
                    >
                      <img 
                        src={pLogo} 
                        alt={item.portalName} 
                        className="w-full h-full object-cover scale-105"
                        onError={(e) => {
                          const parent = e.currentTarget.parentElement as HTMLElement;
                          if (parent) parent.style.display = 'none';
                        }}
                        referrerPolicy="no-referrer"
                      />
                      <span className="absolute inset-0 rounded-2xl pointer-events-none border border-white/20 shadow-[inset_0_2px_4px_rgba(255,255,255,0.35),inset_0_-4px_8px_rgba(0,0,0,0.7)] bg-gradient-to-b from-white/10 via-transparent to-black/35" />
                    </span>
                    <span className={`w-10 h-10 md:w-11 md:h-11 rounded-2xl flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform border ${
                      isFlipping
                        ? 'bg-gradient-to-b from-amber-500/25 via-amber-900/30 to-[#181205] border-amber-500/40 shadow-[0_4px_12px_rgba(245,158,11,0.3),inset_0_1px_0_rgba(255,255,255,0.25)]'
                        : 'bg-gradient-to-b from-emerald-500/25 via-emerald-900/30 to-[#051810] border-emerald-500/40 shadow-[0_4px_12px_rgba(16,185,129,0.3),inset_0_1px_0_rgba(255,255,255,0.25)]'
                    }`}>
                      {isFlipping ? (
                        <Hammer className="h-5 w-5 text-amber-400 shrink-0 drop-shadow-[0_2px_5px_rgba(245,158,11,0.7)]" title="House Flipping" />
                      ) : (
                        <Gavel className="h-5 w-5 text-emerald-400 shrink-0 drop-shadow-[0_2px_5px_rgba(16,185,129,0.7)]" title="Leilão" />
                      )}
                    </span>
                  </span>
                );
              }
              return (
                <span 
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-2xl text-xs sm:text-sm font-extrabold bg-gradient-to-b from-[#242428] to-[#121214] text-slate-100 border border-white/15 shadow-[0_4px_10px_rgba(0,0,0,0.6),inset_0_1px_0_rgba(255,255,255,0.15)] shrink-0" 
                  title={`Portal: ${item.portalName} • ${isFlipping ? 'House Flipping' : 'Leilão'}`}
                >
                  {isFlipping ? (
                    <Hammer className="h-4 w-4 text-amber-400 shrink-0 drop-shadow-[0_2px_4px_rgba(245,158,11,0.6)]" />
                  ) : (
                    <Gavel className="h-4 w-4 text-emerald-400 shrink-0 drop-shadow-[0_2px_4px_rgba(16,185,129,0.6)]" />
                  )}
                  <span className="truncate max-w-[100px] sm:max-w-[150px]">{item.portalName}</span>
                </span>
              );
            })()}
          </div>
        </div>

        {/* Condomínio e Endereço */}
        <div className="flex items-start gap-2 text-xs md:text-sm font-medium text-slate-300 w-full" title={cityState ? mainAddress : item.location}>
          <div className="p-1.5 rounded-xl bg-gradient-to-b from-emerald-500/20 to-emerald-950/40 border border-emerald-500/30 shadow-[0_2px_6px_rgba(16,185,129,0.25),inset_0_1px_0_rgba(255,255,255,0.2)] shrink-0 mt-0.5">
            <MapPin className="h-3.5 w-3.5 md:h-4 md:w-4 text-emerald-400 drop-shadow-[0_0_6px_rgba(16,185,129,0.6)]" />
          </div>
          <span className="break-words whitespace-normal leading-normal flex-1 self-center">
            {item.condoName ? <strong className="text-white font-semibold mr-1">{item.condoName} -</strong> : null}
            {cityState ? mainAddress : item.location}
          </span>
          {item.link && (
            <a
              href={item.link}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="px-2.5 py-1 rounded-xl bg-gradient-to-b from-emerald-500/20 to-emerald-950/40 border border-emerald-500/40 shadow-[0_2px_6px_rgba(16,185,129,0.25),inset_0_1px_0_rgba(255,255,255,0.15)] text-emerald-300 hover:text-emerald-200 hover:border-emerald-400 hover:scale-105 active:scale-95 transition-all shrink-0 inline-flex items-center gap-1.5 text-[11px] font-bold"
              title="Abrir Link do Leilão"
            >
              <ExternalLink className="h-3.5 w-3.5 text-emerald-400" />
              <span className="hidden sm:inline">Link</span>
            </a>
          )}
        </div>

        {/* Barras de Liquidez, Risco e Participação */}
        <div className="flex flex-col gap-1.5 w-full bg-gradient-to-b from-[#0B0B0D] via-[#050506] to-[#000000] p-2.5 md:p-3 rounded-2xl border border-white/10 shadow-[0_6px_16px_rgba(0,0,0,0.8),inset_0_1px_0_rgba(255,255,255,0.08)]">
          {/* Liquidez / Prazo da Operação */}
          <div className="flex flex-col gap-1 w-full">
            <div className="flex items-center justify-between text-[10.5px] font-bold">
              <div className="flex items-center gap-1.5 text-emerald-400">
                <TrendingUp className="h-3.5 w-3.5 shrink-0 drop-shadow-[0_0_4px_rgba(16,185,129,0.5)]" />
                <span className="uppercase font-mono tracking-wider text-[10px] drop-shadow-xs">
                  {isArrematado ? 'Prazo da Operação' : `Liquidez: Giro ${liquidity.level}`}
                </span>
              </div>
              <span className={`font-mono font-bold text-[10px] ${liquidity.color}`}>
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
            <div className="w-full bg-[#08080A] h-2 rounded-full overflow-hidden border border-white/5 shadow-[inset_0_2px_4px_rgba(0,0,0,0.9)] p-[1px]">
              <div
                className={`h-full transition-all duration-500 rounded-full ${liquidity.barColor} shadow-[0_0_8px_rgba(16,185,129,0.5)]`}
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
            <div className="flex items-center justify-between text-[10.5px] font-bold">
              <div className={`flex items-center gap-1.5 ${risk.scoreColor}`}>
                <RiskIcon className="h-3.5 w-3.5 shrink-0" />
                <span className="uppercase font-mono tracking-wider text-[10px] drop-shadow-xs">Análise de Risco: {risk.label}</span>
              </div>
              <span className={`font-mono text-[10px] font-bold ${risk.scoreColor}`}>
                {risk.label === 'Baixo' ? 'Baixo Risco' : risk.label === 'Médio' ? 'Risco Moderado' : 'Alto Risco'}
              </span>
            </div>
            <div className="w-full bg-[#08080A] h-2 rounded-full overflow-hidden border border-white/5 shadow-[inset_0_2px_4px_rgba(0,0,0,0.9)] p-[1px]">
              <div
                className={`h-full transition-all duration-500 rounded-full ${risk.barColor} shadow-[0_0_8px_rgba(244,63,94,0.4)]`}
                style={{ width: `${risk.score}%` }}
              />
            </div>
          </div>

          {/* Barra de Participação */}
          <div className="flex flex-col gap-1 w-full">
            <div className="flex items-center justify-between text-[10.5px] font-bold">
              <div className="flex items-center gap-1.5 text-emerald-400">
                <PieChart className="h-3.5 w-3.5 shrink-0 drop-shadow-[0_0_4px_rgba(16,185,129,0.5)]" />
                <span className="uppercase font-mono tracking-wider text-[10px] drop-shadow-xs">
                  Participação ({assignedIds.length} {assignedIds.length === 1 ? 'operador' : 'operadores'})
                </span>
              </div>
              <span className="font-mono text-[10px] font-bold text-emerald-400 drop-shadow-[0_0_4px_rgba(16,185,129,0.5)]">
                Meu: {formattedMyShare}% Cotas
              </span>
            </div>
            <div className="w-full bg-[#08080A] h-2 rounded-full flex relative border border-white/5 shadow-[inset_0_2px_4px_rgba(0,0,0,0.9)] p-[1px]">
              {orderedUsers.length === 0 ? (
                <div className="w-full h-full bg-zinc-800/60 rounded-full" />
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
                      className={`relative group/segment ${colorBg} h-full transition-all duration-300 cursor-pointer shadow-[0_2px_4px_rgba(0,0,0,0.4),inset_0_1px_0_rgba(255,255,255,0.3)] ${
                        isCurrentUser
                          ? 'hover:scale-y-[1.8] hover:brightness-125 hover:ring-2 hover:ring-emerald-300 hover:shadow-[0_0_12px_rgba(16,185,129,0.9)] z-20 hover:animate-pulse'
                          : 'hover:scale-y-[1.5] hover:brightness-110 hover:ring-1 hover:ring-white/60 z-10'
                      } ${idx === 0 ? 'rounded-l-full' : ''} ${idx === orderedUsers.length - 1 ? 'rounded-r-full' : ''}`}
                    >
                      {/* Tooltip Flutuante */}
                      <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 opacity-0 group-hover/segment:opacity-100 transition-all duration-200 pointer-events-none z-30 flex flex-col items-center whitespace-nowrap">
                        <div className="bg-zinc-950/95 text-white text-[10.5px] font-sans px-2.5 py-1.5 rounded-lg border border-zinc-700/80 shadow-2xl backdrop-blur-md flex flex-col items-center gap-0.5">
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
                        <div className="w-0 h-0 border-x-4 border-x-transparent border-t-4 border-t-zinc-950/95" />
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
