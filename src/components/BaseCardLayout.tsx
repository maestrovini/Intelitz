import React from 'react';
import { 
  MapPin, 
  ExternalLink, 
  TrendingUp,
  ShieldCheck,
  ShieldAlert
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
  aporteParticipacao?: number;
  lucroTotal: number;
  lucroParticipacao?: number;
  roiTotal: number;
  roiMonthly?: number;
  userSharePercent?: number;
  isArrematado?: boolean;
  isVendido?: boolean;
}

export const MiniCardMetricsTags: React.FC<MiniCardMetricsTagsProps> = ({
  aporteInicial,
  aporteParticipacao = aporteInicial,
  lucroTotal,
  lucroParticipacao = lucroTotal,
  roiTotal,
  roiMonthly = 0,
  userSharePercent = 100,
  isArrematado = false,
  isVendido = false
}) => {
  const row1 = [
    {
      label: 'Aporte Inicial',
      value: formatBRL(aporteInicial),
      title: 'Aporte Inicial Total',
    },
    {
      label: 'Lucro Est.',
      value: formatBRL(lucroTotal),
      title: 'Lucro Estimado Total',
    },
    {
      label: 'ROI Total',
      value: `${formatPercentBR(roiTotal)}%`,
      title: 'Retorno sobre Investimento Total',
    },
  ];

  const row2 = [
    {
      label: 'Aporte Part.',
      value: formatBRL(aporteParticipacao),
      title: `Aporte Participação (${formatPercentBR(userSharePercent)}%)`,
    },
    {
      label: 'Lucro Part.',
      value: formatBRL(lucroParticipacao),
      title: `Lucro Participação (${formatPercentBR(userSharePercent)}%)`,
    },
    {
      label: 'ROI Mensal',
      value: `${formatPercentBR(roiMonthly)}%`,
      title: 'Retorno sobre Investimento Mensal',
    },
  ];

  return (
    <div className="py-0.5 sm:py-1 w-full flex flex-col gap-1 sm:gap-1.5">
      {/* Linha 1: Aporte Inicial | Lucro Est. | ROI Total */}
      <div className={`grid grid-cols-3 ${isVendido ? 'divide-x divide-emerald-500/20' : 'divide-x divide-slate-200/80 dark:divide-white/10'} text-center w-full`}>
        {row1.map((metric, idx) => (
          <div key={idx} className="flex flex-col items-center justify-center px-1 sm:px-1.5 py-0.5" title={metric.title}>
            <span className={`text-[8px] sm:text-[9px] uppercase tracking-wider font-mono font-semibold truncate w-full ${isVendido ? 'text-emerald-300/80' : 'text-slate-500 dark:text-slate-400'}`}>
              {metric.label}
            </span>
            <span className={`font-black font-mono text-[11px] sm:text-[12.5px] truncate w-full mt-0.5 ${isVendido ? 'text-white' : 'text-slate-900 dark:text-white'}`}>
              {metric.value}
            </span>
          </div>
        ))}
      </div>

      {/* Linha 2: Aporte Part. | Lucro Part. | ROI Mensal */}
      <div className={`grid grid-cols-3 ${isVendido ? 'divide-x divide-emerald-500/20 border-t border-emerald-500/20' : 'divide-x divide-slate-200/80 dark:divide-white/10 border-t border-slate-200/50 dark:border-white/5'} text-center w-full pt-1 sm:pt-1.5`}>
        {row2.map((metric, idx) => (
          <div key={idx} className="flex flex-col items-center justify-center px-1 sm:px-1.5 py-0.5" title={metric.title}>
            <span className={`text-[8px] sm:text-[9px] uppercase tracking-wider font-mono font-semibold truncate w-full ${isVendido ? 'text-emerald-300/80' : 'text-slate-500 dark:text-slate-400'}`}>
              {metric.label}
            </span>
            <span className={`font-black font-mono text-[11px] sm:text-[12.5px] truncate w-full mt-0.5 ${isVendido ? 'text-white' : 'text-slate-900 dark:text-white'}`}>
              {metric.value}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

export function formatPropertyCityState(cityStateRaw: string, fullLocation: string): string {
  let text = (cityStateRaw || '').trim();
  if (!text && fullLocation) {
    const split = getSplitLocation(fullLocation);
    text = (split.cityState || '').trim();
  }
  if (!text) return '';

  // Pattern like "São Paulo - SP", "São Paulo / SP", "São Paulo, SP", "São Paulo - sp"
  const match = text.match(/^(.*?)\s*[-/,]\s*([a-zA-Z]{2})$/i);
  if (match) {
    const city = match[1].trim();
    const uf = match[2].toUpperCase().trim();
    return `${city}/${uf}`;
  }

  // Pattern like "São Paulo (SP)"
  const matchParen = text.match(/^(.*?)\s*\(([a-zA-Z]{2})\)$/i);
  if (matchParen) {
    const city = matchParen[1].trim();
    const uf = matchParen[2].toUpperCase().trim();
    return `${city}/${uf}`;
  }

  // Pattern like "São Paulo/SP"
  const matchSlash = text.match(/^(.*?)\/([a-zA-Z]{2})$/i);
  if (matchSlash) {
    return `${matchSlash[1].trim()}/${matchSlash[2].toUpperCase().trim()}`;
  }

  // Fallback: If it contains a 2-letter word at the end, uppercase it
  const matchEndUf = text.match(/^(.*?)\s+([a-zA-Z]{2})$/i);
  if (matchEndUf) {
    const city = matchEndUf[1].replace(/[-/,]/g, '').trim();
    const uf = matchEndUf[2].toUpperCase().trim();
    return `${city}/${uf}`;
  }

  return text;
}

export function getUserShareRatio(
  lot: ImovelLot,
  user: AppUser | null | undefined,
  usersList: AppUser[] = []
): number {
  if (!user || !user.id) return 1;

  // 1. Direct userShares mapping by ID
  if (lot.userShares) {
    if (lot.userShares[user.id] !== undefined && lot.userShares[user.id] !== null) {
      return Number(lot.userShares[user.id]) / 100;
    }
    if (user.username && lot.userShares[user.username] !== undefined && lot.userShares[user.username] !== null) {
      return Number(lot.userShares[user.username]) / 100;
    }
  }

  // 2. Based on assignedUserIds list
  const assignable = usersList.filter(u => u.id !== 'usr-admin' && u.username !== 'admin');
  let activeIds: string[] = [];
  if (!lot.assignedUserIds || lot.assignedUserIds.includes('all')) {
    activeIds = assignable.map(u => u.id);
  } else if (lot.assignedUserIds.includes('none')) {
    activeIds = [];
  } else {
    activeIds = lot.assignedUserIds;
  }

  if (activeIds.length === 0) return 1;

  const isAssigned = activeIds.includes(user.id) || (user.username ? activeIds.includes(user.username) : false);
  if (!isAssigned) {
    // If admin is viewing and not specifically assigned, default to 1 (100%)
    if (user.role === 'admin' || user.username === 'admin' || user.username === 'intelitz' || user.id === 'usr-admin') {
      return 1;
    }
    return 0;
  }

  return (100 / activeIds.length) / 100;
}

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
  const isVendido = item.vendido === 'Sim' || (item.vendido as unknown) === true || (item.vendido as unknown) === 'sim';
  const isArrematado = item.arrematado === 'Sim' || isVendido;
  const isFlipping = item.businessType === 'House Flipping';
  const { mainAddress, cityState } = getSplitLocation(item.location);
  const countdown = getAuctionCountdown(item.auctionDate);
  const profitData = calculateEstimatedProfit(item);
  const isEncerrado = countdown && (countdown.diffDays < 0 || countdown.text?.includes('Encerrado'));

  // Calculate user participation percentage and amounts
  const targetUser = activeUserObj || currentUser;
  const userShareRatio = getUserShareRatio(item, targetUser, assignableUsers);
  const userSharePercent = Math.round(userShareRatio * 10000) / 100;

  const aporteParticipacao = profitData.upfrontCosts * userShareRatio;
  const lucroParticipacao = profitData.netProfit * userShareRatio;

  const propertyType = item.typeText || 'Imóvel';
  const formattedCityUF = formatPropertyCityState(cityState, item.location);
  const displayAddress = mainAddress || item.location || 'Endereço não informado';
  const condoName = item.condoName || (() => {
    const rawText = (item as any).title || item.location || '';
    if (!rawText) return '';
    const match = rawText.match(/(?:Condom[ií]nio|Edif[ií]cio|Residencial|Cond\.)\s+([A-Za-z0-9À-ÿ\s\-\.]+?)(?=\s*[,-]|\s*Apto|\s*Casa|\s*Bloco|\s*$)/i);
    return match ? match[0].trim() : '';
  })();

  const liquidity = calculateMarketLiquidity(item);
  const risk = calculateRiskLevel(item);
  const RiskIcon = risk.label === 'Baixo' ? ShieldCheck : ShieldAlert;

  return (
    <div
      id={`imovel-card-${item.id}`}
      data-vendido={isVendido ? 'true' : 'false'}
      onClick={onClick}
      className={`group property-lot-card ${
        isVendido
          ? 'card-vendido bg-[#042013] border-emerald-600/70 hover:border-emerald-400 shadow-md'
          : 'bg-[#0E0E0E] border-[#2C2C2E] hover:border-emerald-500/30 shadow-sm hover:shadow-md'
      } rounded-2xl p-3 sm:p-3.5 transition-all duration-300 cursor-pointer relative overflow-hidden flex flex-col w-full border ${className}`}
    >
      <div className="flex flex-col gap-2 sm:gap-2.5">
        {/* Top: Logo de GPS + Linha 1 (Tipo - Cidade/UF • Condomínio no desktop), Linha 2 (Condomínio no mobile), Linha 3 (Endereço com fonte maior no desktop) */}
        <div className="flex items-center gap-2.5 sm:gap-3 w-full" title={cityState ? `${propertyType} - ${formattedCityUF}${condoName ? ` • ${condoName}` : ''}` : item.location}>
          {/* Logo de GPS */}
          <div className={`w-11 h-11 sm:w-13 sm:h-13 rounded-xl sm:rounded-2xl shrink-0 flex items-center justify-center shadow-2xs group-hover:scale-105 transition-transform ${
            isVendido
              ? 'bg-emerald-900/60 border border-emerald-500/40 text-emerald-300'
              : 'bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-500/30 text-emerald-600 dark:text-emerald-400'
          }`}>
            <MapPin className={`h-5 w-5 sm:h-6 sm:w-6 shrink-0 ${isVendido ? 'text-emerald-300' : 'text-emerald-600 dark:text-emerald-400'}`} />
          </div>

          {/* Hierarquia visual (Estilo Relatório de Investimento) */}
          <div className="flex flex-col flex-1 min-w-0 justify-center gap-0.5">
            {/* Linha 1: Cabeçalho Principal “Tipo do Imóvel - Cidade/UF” e no Desktop com “• Condomínio” ao lado */}
            <div className={`text-sm sm:text-base md:text-lg font-black font-inter tracking-tight leading-snug truncate ${isVendido ? 'text-white' : 'text-slate-900 dark:text-[#F8FAFC]'}`} title={`${propertyType}${formattedCityUF ? ` - ${formattedCityUF}` : ''}${condoName ? ` • ${condoName}` : ''}`}>
              <span>{propertyType}</span>
              {formattedCityUF && (
                <>
                  <span className={`${isVendido ? 'text-emerald-400/60' : 'text-slate-400 dark:text-slate-500'} mx-1.5 font-normal`}>-</span>
                  <span>{formattedCityUF}</span>
                </>
              )}
              {condoName && (
                <span className="hidden sm:inline">
                  <span className={`${isVendido ? 'text-emerald-400/60' : 'text-slate-400 dark:text-slate-500'} mx-1.5 font-normal`}>•</span>
                  <span className={`font-bold ${isVendido ? 'text-emerald-200' : 'text-slate-700 dark:text-slate-200'}`}>{condoName}</span>
                </span>
              )}
            </div>

            {/* Linha 2 (Apenas no Mobile): Nome do 'Condomínio' em sua própria linha */}
            {condoName ? (
              <div className={`sm:hidden text-xs font-bold tracking-tight leading-snug truncate ${isVendido ? 'text-emerald-200' : 'text-slate-800 dark:text-slate-100'}`} title={condoName}>
                {condoName}
              </div>
            ) : null}

            {/* Linha 3 (ou Linha 2 no Desktop): Endereço completo com fonte maior no Desktop */}
            <div className={`text-[11.5px] sm:text-sm md:text-[14.5px] font-normal sm:font-medium leading-relaxed tracking-normal truncate ${isVendido ? 'text-emerald-200/80' : 'text-slate-500 dark:text-slate-300'}`} title={displayAddress}>
              {displayAddress}
            </div>
          </div>
        </div>

        {/* Linha divisória idêntica entre o endereço e os números */}
        <div className={`w-full ${isVendido ? 'border-t border-emerald-500/20' : 'border-t border-slate-200/80 dark:border-white/10'}`} />

        {/* Quadro de Valores no fundo do card com barras divisórias */}
        <MiniCardMetricsTags
          aporteInicial={profitData.upfrontCosts}
          aporteParticipacao={aporteParticipacao}
          lucroTotal={profitData.netProfit}
          lucroParticipacao={lucroParticipacao}
          roiTotal={profitData.roiPercent}
          roiMonthly={profitData.roiMonthly}
          userSharePercent={userSharePercent}
          isArrematado={isArrematado}
          isVendido={isVendido}
        />

        {/* Rodapé do Card: Tags (Dias Faltantes, Portal, Tipo, Liquidez, Risco) e Link do Leilão */}
        <div className={`flex items-center justify-between gap-1.5 sm:gap-2 pt-2 w-full flex-wrap ${isVendido ? 'border-t border-emerald-500/20' : 'border-t border-slate-200/80 dark:border-white/10'}`}>
          <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
            {/* Tag Vendido em Destaque quando marcado */}
            {isVendido && (
              <span 
                className="inline-flex items-center px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-lg sm:rounded-xl text-[10px] sm:text-xs font-black border border-emerald-400/50 bg-emerald-500/30 text-emerald-200 shadow-2xs shrink-0 tracking-wider uppercase"
                title="Imóvel Marcado como Vendido"
              >
                <span className="font-inter">Vendido</span>
              </span>
            )}

            {/* Tag de Tempo Faltante (Número de Dias) */}
            {!(isArrematado && isEncerrado) && !isVendido && countdown && (
              <span 
                className={`inline-flex items-center px-1.5 py-0.5 sm:px-2.5 sm:py-1.5 rounded-lg sm:rounded-xl text-[10px] sm:text-xs font-bold border shadow-2xs shrink-0 transition-all ${
                  countdown.isToday 
                    ? 'bg-amber-50 dark:bg-amber-950/30 text-amber-800 dark:text-amber-300 border-amber-300 dark:border-amber-500/30 animate-pulse' 
                    : countdown.diffDays > 0 
                    ? 'bg-slate-100 dark:bg-[#16171B] text-slate-800 dark:text-slate-200 border-slate-200 dark:border-white/10' 
                    : 'bg-zinc-100 dark:bg-zinc-900 text-zinc-500 border-zinc-200 dark:border-white/5'
                }`}
                title={`Tempo Faltante: ${countdown.diffDays > 0 ? `${countdown.diffDays} dias` : countdown.diffDays === 0 ? 'Hoje' : 'Encerrado'}`}
              >
                <span className="font-inter font-bold">
                  {countdown.isToday 
                    ? 'Hoje' 
                    : countdown.diffDays > 0 
                    ? `${countdown.diffDays} ${countdown.diffDays === 1 ? 'dia' : 'dias'}` 
                    : 'Encerrado'}
                </span>
              </span>
            )}

            {/* Tag com o Nome do Leiloeiro / Portal */}
            {item.portalName && (
              <span 
                className="inline-flex items-center px-1.5 py-0.5 sm:px-2.5 sm:py-1.5 rounded-lg sm:rounded-xl text-[10px] sm:text-xs font-bold border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-[#16171B] text-slate-700 dark:text-slate-300 shadow-2xs shrink-0 transition-all" 
                title={`Leiloeiro/Portal: ${item.portalName}`}
              >
                <span className="truncate max-w-[100px] sm:max-w-[160px] font-inter">{item.portalName}</span>
              </span>
            )}

            {/* Tag do Tipo de Operação (Leilão ou House Flipping) */}
            <span
              className={`inline-flex items-center px-1.5 py-0.5 sm:px-2.5 sm:py-1.5 rounded-lg sm:rounded-xl text-[10px] sm:text-xs font-bold border shadow-2xs shrink-0 transition-all ${
                isFlipping
                  ? 'bg-amber-50 dark:bg-amber-950/30 text-amber-800 dark:text-amber-300 border-amber-300 dark:border-amber-500/30'
                  : 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-800 dark:text-emerald-300 border-emerald-300 dark:border-emerald-500/30'
              }`}
              title={`Tipo: ${isFlipping ? 'House Flipping' : 'Leilão'}`}
            >
              <span className="font-inter">{isFlipping ? 'House Flipping' : 'Leilão'}</span>
            </span>

            {/* Tag de Liquidez */}
            <span
              className={`inline-flex items-center gap-1 sm:gap-1.5 px-1.5 py-0.5 sm:px-2.5 sm:py-1.5 rounded-lg sm:rounded-xl text-[10px] sm:text-xs font-bold border shadow-2xs shrink-0 transition-all ${
                isArrematado
                  ? 'bg-blue-50 dark:bg-blue-950/40 text-blue-800 dark:text-blue-300 border-blue-200 dark:border-blue-500/30'
                  : (liquidity.level === 'Altíssima' || liquidity.level === 'Alta')
                  ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border-emerald-200 dark:border-emerald-500/30'
                  : liquidity.level === 'Média'
                  ? 'bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 border-amber-200 dark:border-amber-500/30'
                  : 'bg-rose-50 dark:bg-rose-950/40 text-rose-800 dark:text-rose-300 border-rose-200 dark:border-rose-500/30'
              }`}
              title={
                isArrematado
                  ? `Prazo da Operação: ${Math.round(profitData.monthsCount * 30)} dias (${profitData.monthsCount.toFixed(1)} meses)`
                  : `Liquidez: ${liquidity.level} (Prazo estimado: ${liquidity.prazoTexto})`
              }
            >
              <TrendingUp className={`h-3 w-3 sm:h-3.5 sm:w-3.5 shrink-0 ${
                isArrematado
                  ? 'text-blue-600 dark:text-blue-400'
                  : (liquidity.level === 'Altíssima' || liquidity.level === 'Alta')
                  ? 'text-emerald-600 dark:text-emerald-400'
                  : liquidity.level === 'Média'
                  ? 'text-amber-600 dark:text-amber-400'
                  : 'text-rose-600 dark:text-rose-400'
              }`} />
              <span className="font-inter">
                {isArrematado ? `Prazo: ${Math.round(profitData.monthsCount * 30)}d` : `Liquidez: ${liquidity.level}`}
              </span>
            </span>

            {/* Tag de Risco */}
            <span
              className={`inline-flex items-center gap-1 sm:gap-1.5 px-1.5 py-0.5 sm:px-2.5 sm:py-1.5 rounded-lg sm:rounded-xl text-[10px] sm:text-xs font-bold border shadow-2xs shrink-0 transition-all ${
                risk.label === 'Alto'
                  ? 'bg-rose-50 dark:bg-rose-950/40 text-rose-800 dark:text-rose-300 border-rose-200 dark:border-rose-500/30'
                  : risk.label === 'Médio'
                  ? 'bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 border-amber-200 dark:border-amber-500/30'
                  : 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border-emerald-200 dark:border-emerald-500/30'
              }`}
              title={`Análise Operacional de Risco: ${risk.label} (${risk.score}/100)`}
            >
              <RiskIcon className={`h-3 w-3 sm:h-3.5 sm:w-3.5 shrink-0 ${
                risk.label === 'Alto'
                  ? 'text-rose-600 dark:text-rose-400'
                  : risk.label === 'Médio'
                  ? 'text-amber-600 dark:text-amber-400'
                  : 'text-emerald-600 dark:text-emerald-400'
              }`} />
              <span className="font-inter">Risco: {risk.label}</span>
            </span>
          </div>

          {/* Botão Link do Leilão */}
          {item.link && (
            <a
              href={item.link}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="px-2 py-1 sm:px-2.5 sm:py-1.5 rounded-lg sm:rounded-xl bg-slate-100 hover:bg-emerald-50 dark:bg-[#1A1C20] dark:hover:bg-emerald-950/40 border border-slate-200 dark:border-white/10 text-slate-700 hover:text-emerald-700 dark:text-slate-300 dark:hover:text-emerald-400 transition-all shrink-0 inline-flex items-center gap-1 sm:gap-1.5 text-[10.5px] sm:text-xs font-semibold"
              title="Abrir Link do Leilão"
            >
              <ExternalLink className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-emerald-600 dark:text-emerald-400" />
              <span className="hidden sm:inline">Acessar Leilão</span>
            </a>
          )}
        </div>

        {/* Optional Slot for children */}
        {children}
      </div>
    </div>
  );
}
