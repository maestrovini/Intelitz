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
        <div className="relative overflow-hidden flex flex-col items-center justify-center p-1.5 sm:p-2 rounded-xl bg-[#13131A] border border-amber-500/20">
          <div className="absolute top-0 left-0 right-0 h-[2px] bg-amber-400/80" />
          <span className="text-[7.5px] sm:text-[8.5px] uppercase tracking-wider font-mono font-bold text-white flex items-center justify-center gap-1 truncate w-full">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400 shrink-0" />
            Aporte Inicial
          </span>
          <span className="font-black font-mono text-[10.5px] sm:text-xs truncate w-full mt-0.5 text-white">
            {formatBRL(aporteInicial)}
          </span>
        </div>

        {/* ROI Total */}
        <div className="relative overflow-hidden flex flex-col items-center justify-center p-1.5 sm:p-2 rounded-xl bg-[#13131A] border border-cyan-500/20">
          <div className="absolute top-0 left-0 right-0 h-[2px] bg-cyan-400/80" />
          <span className="text-[7.5px] sm:text-[8.5px] uppercase tracking-wider font-mono font-bold text-white flex items-center justify-center gap-1 truncate w-full">
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 shrink-0" />
            ROI Total
          </span>
          <span className="font-black font-mono text-[10.5px] sm:text-xs truncate w-full mt-0.5 text-white">
            {formatPercentBR(roiTotal)}%
          </span>
        </div>

        {/* ROI Mensal */}
        <div className="relative overflow-hidden flex flex-col items-center justify-center p-1.5 sm:p-2 rounded-xl bg-[#13131A] border border-cyan-500/20">
          <div className="absolute top-0 left-0 right-0 h-[2px] bg-cyan-400/80" />
          <span className="text-[7.5px] sm:text-[8.5px] uppercase tracking-wider font-mono font-bold text-white flex items-center justify-center gap-1 truncate w-full">
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 shrink-0" />
            ROI Mensal
          </span>
          <span className="font-black font-mono text-[10.5px] sm:text-xs truncate w-full mt-0.5 text-white">
            {formatPercentBR(roiMonthly)}%
          </span>
        </div>

        {/* TIR Total */}
        <div className="relative overflow-hidden flex flex-col items-center justify-center p-1.5 sm:p-2 rounded-xl bg-[#13131A] border border-cyan-500/20">
          <div className="absolute top-0 left-0 right-0 h-[2px] bg-cyan-400/80" />
          <span className="text-[7.5px] sm:text-[8.5px] uppercase tracking-wider font-mono font-bold text-white flex items-center justify-center gap-1 truncate w-full">
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 shrink-0" />
            TIR Total
          </span>
          <span className="font-black font-mono text-[10.5px] sm:text-xs truncate w-full mt-0.5 text-white">
            {formatPercentBR(tirTotal)}%
          </span>
        </div>

        {/* Margem Lucro */}
        <div className="relative overflow-hidden flex flex-col items-center justify-center p-1.5 sm:p-2 rounded-xl bg-[#13131A] border border-cyan-500/20">
          <div className="absolute top-0 left-0 right-0 h-[2px] bg-cyan-400/80" />
          <span className="text-[7.5px] sm:text-[8.5px] uppercase tracking-wider font-mono font-bold text-white flex items-center justify-center gap-1 truncate w-full">
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 shrink-0" />
            Margem Lucro
          </span>
          <span className="font-black font-mono text-[10.5px] sm:text-xs truncate w-full mt-0.5 text-white">
            {formatPercentBR(profitMarginTotal)}%
          </span>
        </div>

        {/* Lucro Est. */}
        <div className={`relative overflow-hidden flex flex-col items-center justify-center p-1.5 sm:p-2 rounded-xl bg-[#13131A] border ${lucroTotal >= 0 ? 'border-amber-500/20' : 'border-rose-500/20'}`}>
          <div className={`absolute top-0 left-0 right-0 h-[2px] ${lucroTotal >= 0 ? 'bg-amber-400/80' : 'bg-rose-400/80'}`} />
          <span className="text-[7.5px] sm:text-[8.5px] uppercase tracking-wider font-mono font-bold text-white flex items-center justify-center gap-1 truncate w-full">
            <span className={`w-1.5 h-1.5 rounded-full ${lucroTotal >= 0 ? 'bg-amber-400' : 'bg-rose-400'} shrink-0`} />
            Lucro Est.
          </span>
          <span className="font-black font-mono text-[10.5px] sm:text-xs truncate w-full mt-0.5 text-white">
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
    'bg-[#00FF00]', // 1º: Usuário ativo
    'bg-gradient-to-r from-blue-500 via-cyan-400 to-sky-300',    // 2º: Azul
    'bg-gradient-to-r from-purple-500 via-fuchsia-400 to-pink-300',  // 3º: Roxo
    'bg-gradient-to-r from-amber-500 via-yellow-400 to-orange-300',   // 4º: Laranja
    'bg-gradient-to-r from-cyan-500 via-teal-400 to-emerald-300',    // Outros
    'bg-gradient-to-r from-rose-500 via-pink-400 to-red-300',
    'bg-gradient-to-r from-indigo-500 via-purple-400 to-indigo-300'
  ];

  return (
    <div
      onClick={onClick}
      className={`group rounded-2xl p-3.5 sm:p-4 transition-all duration-200 cursor-pointer relative overflow-hidden flex flex-col w-full border bg-gradient-to-b from-[#0A0A0C] via-[#050507] to-[#000000] border-white/12 md:hover:border-white/30 ${
        isSelected ? 'border-white/30 bg-[#141419]' : ''
      } ${className}`}
    >
      <div className="flex flex-col gap-3">
        {/* Top: Cidade e Estado no lado esquerdo, User & Tempo Faltante / Portal no lado direito */}
        <div className="flex items-center justify-between gap-2 w-full">
          <div className="text-base md:text-lg lg:text-xl font-black font-inter text-[#F8FAFC] transition-colors leading-snug">
            {cityState || mainAddress}
          </div>

          <div className="flex items-center gap-2 md:gap-2.5 shrink-0">
            {/* Tempo Faltante no topo no formato de Calendário */}
            {!(isArrematado && isEncerrado) && (
              <div 
                className="relative w-10 h-10 md:w-11 md:h-11 rounded-2xl bg-[#121215] border border-white/20 flex flex-col items-center justify-between shrink-0 overflow-hidden transition-all p-0.5" 
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
                  <span className="w-0.5 h-0.5 md:w-1 md:h-1 rounded-full bg-white/90" />
                  <span className="w-0.5 h-0.5 md:w-1 md:h-1 rounded-full bg-white/90" />
                </div>

                {/* Número de Dias */}
                <div className="flex-1 flex items-center justify-center w-full">
                  <span className={`font-black font-mono leading-none tracking-tight ${
                    countdown?.isToday 
                      ? 'text-amber-400 text-xs md:text-sm' 
                      : (countdown && countdown.diffDays > 0 
                          ? 'text-white text-xs md:text-sm' 
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
                      className="relative w-10 h-10 md:w-11 md:h-11 rounded-2xl bg-[#121215] border border-white/20 flex items-center justify-center shrink-0 overflow-hidden transition-all" 
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
                    <span className={`w-10 h-10 md:w-11 md:h-11 rounded-2xl flex items-center justify-center shrink-0 border ${
                      isFlipping
                        ? 'bg-[#181205] border-amber-500/40'
                        : 'bg-[#051810] border-emerald-500/40'
                    }`}>
                      {isFlipping ? (
                        <Hammer className="h-5 w-5 text-amber-400 shrink-0" title="House Flipping" />
                      ) : (
                        <Gavel className="h-5 w-5 text-emerald-400 shrink-0" title="Leilão" />
                      )}
                    </span>
                  </span>
                );
              }
              return (
                <span 
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-2xl text-xs sm:text-sm font-extrabold bg-[#121214] text-slate-100 border border-white/15 shrink-0" 
                  title={`Portal: ${item.portalName} • ${isFlipping ? 'House Flipping' : 'Leilão'}`}
                >
                  {isFlipping ? (
                    <Hammer className="h-4 w-4 text-amber-400 shrink-0" />
                  ) : (
                    <Gavel className="h-4 w-4 text-emerald-400 shrink-0" />
                  )}
                  <span className="truncate max-w-[100px] sm:max-w-[150px]">{item.portalName}</span>
                </span>
              );
            })()}
          </div>
        </div>

        {/* Condomínio e Endereço */}
        <div className="flex items-start gap-2.5 w-full" title={cityState ? mainAddress : item.location}>
          <div className="p-1.5 rounded-xl bg-emerald-950/40 border border-emerald-500/30 shrink-0 mt-0.5">
            <MapPin className="h-4 w-4 md:h-5 md:w-5 text-emerald-400" />
          </div>
          <div className="flex flex-col flex-1 min-w-0 gap-1">
            {item.condoName ? (
              <span className="text-base md:text-lg font-black text-white leading-tight truncate block" title={item.condoName}>
                {item.condoName}
              </span>
            ) : null}
            <span className="text-sm md:text-base text-slate-200 font-semibold leading-snug break-words block">
              {cityState ? mainAddress : item.location}
            </span>
          </div>
          {item.link && (
            <a
              href={item.link}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="px-2.5 py-1.5 rounded-xl bg-emerald-950/40 border border-emerald-500/40 text-emerald-300 hover:text-emerald-200 hover:border-emerald-400 transition-all shrink-0 inline-flex items-center gap-1.5 text-xs font-bold self-start mt-0.5"
              title="Abrir Link do Leilão"
            >
              <ExternalLink className="h-3.5 w-3.5 text-emerald-400" />
              <span className="hidden sm:inline">Link</span>
            </a>
          )}
        </div>

        {/* Barras de Liquidez, Risco e Participação */}
        <div className="flex flex-col gap-1.5 w-full bg-[#050507] p-2.5 md:p-3 rounded-2xl border border-white/10">
          {/* Liquidez / Prazo da Operação */}
          <div className="flex flex-col gap-1 w-full">
            <div className="flex items-center justify-between text-[10.5px] font-bold">
              <div className="flex items-center gap-1.5 text-white">
                <TrendingUp className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
                <span className="uppercase font-mono tracking-wider text-[10px] text-white">
                  {isArrematado ? 'Prazo da Operação' : `Liquidez: Giro ${liquidity.level}`}
                </span>
              </div>
              <span className="font-mono font-bold text-[10px] text-white">
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
            <div className="w-full bg-[#050508] h-1.5 rounded-full overflow-hidden border border-white/10 p-[1px]">
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
            <div className="flex items-center justify-between text-[10.5px] font-bold">
              <div className="flex items-center gap-1.5 text-white">
                <RiskIcon className="h-3.5 w-3.5 shrink-0 text-white" />
                <span className="uppercase font-mono tracking-wider text-[10px] text-white">Análise de Risco: {risk.label}</span>
              </div>
              <span className="font-mono text-[10px] font-bold text-white">
                {risk.label === 'Baixo' ? 'Baixo Risco' : risk.label === 'Médio' ? 'Risco Moderado' : 'Alto Risco'}
              </span>
            </div>
            <div className="w-full bg-[#050508] h-1.5 rounded-full overflow-hidden border border-white/10 p-[1px]">
              <div
                className={`h-full transition-all duration-300 rounded-full ${risk.barColor}`}
                style={{ width: `${risk.score}%` }}
              />
            </div>
          </div>

          {/* Barra de Participação */}
          <div className="flex flex-col gap-1 w-full">
            <div className="flex items-center justify-between text-[10.5px] font-bold">
              <div className="flex items-center gap-1.5 text-white">
                <PieChart className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
                <span className="uppercase font-mono tracking-wider text-[10px] text-white">
                  Participação ({assignedIds.length} {assignedIds.length === 1 ? 'operador' : 'operadores'})
                </span>
              </div>
              <span className="font-mono text-[10px] font-bold text-white">
                Meu: {formattedMyShare}% Cotas
              </span>
            </div>
            <div className="w-full bg-[#050508] h-1.5 rounded-full flex relative border border-white/10 p-[1px] overflow-hidden">
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
                      className={`relative group/segment ${colorBg} h-full transition-all duration-200 cursor-pointer ${
                        isCurrentUser
                          ? 'brightness-125 z-20'
                          : 'brightness-110 z-10'
                      } ${idx === 0 ? 'rounded-l-full' : ''} ${idx === orderedUsers.length - 1 ? 'rounded-r-full' : ''}`}
                    >
                      {/* Tooltip Flutuante */}
                      <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 opacity-0 group-hover/segment:opacity-100 transition-all duration-200 pointer-events-none z-30 flex flex-col items-center whitespace-nowrap">
                        <div className="bg-zinc-950 text-white text-[10.5px] font-sans px-2.5 py-1.5 rounded-lg border border-zinc-700 flex flex-col items-center gap-0.5">
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
                        <div className="w-0 h-0 border-x-4 border-x-transparent border-t-4 border-t-zinc-950" />
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
