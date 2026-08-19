import React from 'react';
import { 
  MapPin, 
  ExternalLink, 
  Hammer, 
  Gavel
} from 'lucide-react';
import { ImovelLot, AppUser, AuctionPortal } from '../types';
import { 
  calculateEstimatedProfit, 
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
  const row1 = [
    {
      label: 'Aporte Inicial',
      value: formatBRL(aporteInicial),
    },
    {
      label: 'ROI Total',
      value: `${formatPercentBR(roiTotal)}%`,
    },
    {
      label: 'ROI Mensal',
      value: `${formatPercentBR(roiMonthly)}%`,
    },
  ];

  const row2 = [
    {
      label: 'TIR Total',
      value: `${formatPercentBR(tirTotal)}%`,
    },
    {
      label: 'Margem',
      value: `${formatPercentBR(profitMarginTotal)}%`,
    },
    {
      label: 'Lucro Est.',
      value: formatBRL(lucroTotal),
    },
  ];

  return (
    <div className="pt-2.5 pb-0.5 w-full flex flex-col gap-2">
      {/* Linha 1: Aporte Inicial | ROI Total | ROI Mensal (sem linha à direita de ROI Mensal) */}
      <div className="grid grid-cols-3 divide-x divide-slate-200/80 dark:divide-white/10 text-center w-full">
        {row1.map((metric, idx) => (
          <div key={idx} className="flex flex-col items-center justify-center px-1 sm:px-1.5 py-0.5">
            <span className="text-[8px] sm:text-[9px] uppercase tracking-wider font-mono font-semibold text-slate-500 dark:text-slate-400 truncate w-full">
              {metric.label}
            </span>
            <span className="font-black font-mono text-[11px] sm:text-[12.5px] truncate w-full mt-0.5 text-slate-900 dark:text-white">
              {metric.value}
            </span>
          </div>
        ))}
      </div>

      {/* Linha 2: TIR Total | Margem | Lucro Est. */}
      <div className="grid grid-cols-3 divide-x divide-slate-200/80 dark:divide-white/10 text-center w-full border-t border-slate-200/50 dark:border-white/5 pt-1.5">
        {row2.map((metric, idx) => (
          <div key={idx} className="flex flex-col items-center justify-center px-1 sm:px-1.5 py-0.5">
            <span className="text-[8px] sm:text-[9px] uppercase tracking-wider font-mono font-semibold text-slate-500 dark:text-slate-400 truncate w-full">
              {metric.label}
            </span>
            <span className="font-black font-mono text-[11px] sm:text-[12.5px] truncate w-full mt-0.5 text-slate-900 dark:text-white">
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
  className = '',
  children
}: BaseCardLayoutProps) {
  const isArrematado = item.arrematado === 'Sim' || item.vendido === 'Sim';
  const { mainAddress, cityState } = getSplitLocation(item.location);
  const countdown = getAuctionCountdown(item.auctionDate);
  const profitData = calculateEstimatedProfit(item);
  const isEncerrado = countdown && (countdown.diffDays < 0 || countdown.text?.includes('Encerrado'));

  const propertyType = item.typeText || 'Imóvel';
  const formattedCityUF = formatPropertyCityState(cityState, item.location);
  const displayAddress = mainAddress || item.location || 'Endereço não informado';
  const condoName = item.condoName || (() => {
    const rawText = (item as any).title || item.location || '';
    if (!rawText) return '';
    const match = rawText.match(/(?:Condom[ií]nio|Edif[ií]cio|Residencial|Cond\.)\s+([A-Za-z0-9À-ÿ\s\-\.]+?)(?=\s*[,-]|\s*Apto|\s*Casa|\s*Bloco|\s*$)/i);
    return match ? match[0].trim() : '';
  })();

  return (
    <div
      id={`imovel-card-${item.id}`}
      onClick={onClick}
      className={`group property-lot-card rounded-2xl p-4 transition-all duration-300 cursor-pointer relative overflow-hidden flex flex-col w-full bg-[#0E0E0E] border border-[#2C2C2E] hover:border-emerald-500/30 shadow-sm hover:shadow-md ${className}`}
    >
      <div className="flex flex-col gap-3.5">
        {/* Top: Logo de GPS maior cobrindo as 3 linhas + Linha 1 (Tipo - Cidade/UF), Linha 2 (Condomínio), Linha 3 (Endereço) */}
        <div className="flex items-center gap-3 w-full" title={cityState ? `${propertyType} - ${formattedCityUF}` : item.location}>
          {/* Logo de GPS maior cobrindo as 3 linhas */}
          <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-500/30 text-emerald-600 dark:text-emerald-400 shrink-0 flex items-center justify-center shadow-2xs group-hover:scale-105 transition-transform">
            <MapPin className="h-6 w-6 sm:h-7 sm:w-7 text-emerald-600 dark:text-emerald-400 shrink-0" />
          </div>

          {/* 3 Linhas com hierarquia visual clara (Estilo Relatório de Investimento) */}
          <div className="flex flex-col flex-1 min-w-0 justify-center gap-0.5">
            {/* Linha 1: Cabeçalho Principal “Tipo do Imóvel - Cidade/UF” */}
            <div className="text-sm sm:text-base md:text-lg font-black font-inter text-slate-900 dark:text-[#F8FAFC] tracking-tight leading-snug truncate" title={`${propertyType}${formattedCityUF ? ` - ${formattedCityUF}` : ''}`}>
              <span>{propertyType}</span>
              {formattedCityUF && (
                <>
                  <span className="text-slate-400 dark:text-slate-500 mx-1.5 font-normal">-</span>
                  <span>{formattedCityUF}</span>
                </>
              )}
            </div>

            {/* Linha 2: Nome do 'Condomínio' em sua própria linha com destaque */}
            {condoName ? (
              <div className="text-xs sm:text-[13px] font-bold text-slate-800 dark:text-slate-100 tracking-tight leading-snug truncate" title={condoName}>
                {condoName}
              </div>
            ) : null}

            {/* Linha 3: Endereço completo na linha imediatamente abaixo com fonte limpa e espaçamento confortável */}
            <div className="text-[11.5px] sm:text-xs text-slate-500 dark:text-slate-400 font-normal leading-relaxed tracking-normal truncate" title={displayAddress}>
              {displayAddress}
            </div>
          </div>
        </div>

        {/* Quadro de Valores no fundo do card com barras divisórias */}
        <MiniCardMetricsTags
          aporteInicial={profitData.upfrontCosts}
          roiTotal={profitData.roiPercent}
          roiMonthly={profitData.roiMonthly}
          tirTotal={profitData.tirTotal}
          profitMarginTotal={profitData.profitMarginTotal}
          lucroTotal={profitData.netProfit}
          isArrematado={isArrematado}
        />

        {/* Rodapé do Card: Ícones (Tempo Faltante, Portal/Leilão) e Link do Leilão */}
        <div className="flex items-center justify-between gap-2 pt-2.5 mt-1 border-t border-slate-200/80 dark:border-white/10 w-full flex-wrap">
          <div className="flex items-center gap-2 flex-wrap">
            {/* Tempo Faltante no formato de Micro Card Calendário Financeiro */}
            {!(isArrematado && isEncerrado) && (
              <div 
                className="relative w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-slate-50 dark:bg-[#16171B] border border-slate-200 dark:border-white/10 flex flex-col items-center justify-between shrink-0 overflow-hidden transition-all shadow-2xs" 
                title={countdown ? `Tempo Faltante: ${countdown.diffDays > 0 ? `${countdown.diffDays} dias` : countdown.diffDays === 0 ? 'Hoje' : 'Encerrado'}` : 'Tempo Faltante'}
              >
                {/* Faixa Superior do Calendário */}
                <div className={`w-full h-2.5 sm:h-3 flex items-center justify-center gap-1 ${
                  countdown?.isToday 
                    ? 'bg-amber-500' 
                    : (countdown && countdown.diffDays > 0 
                        ? 'bg-emerald-600 dark:bg-emerald-500' 
                        : 'bg-slate-400 dark:bg-slate-600')
                }`}>
                  <span className="w-0.5 h-0.5 rounded-full bg-white/90" />
                  <span className="w-0.5 h-0.5 rounded-full bg-white/90" />
                </div>

                {/* Número de Dias */}
                <div className="flex-1 flex items-center justify-center w-full">
                  <span className={`font-black font-mono leading-none tracking-tight ${
                    countdown?.isToday 
                      ? 'text-amber-600 dark:text-amber-400 text-[11px] sm:text-xs' 
                      : (countdown && countdown.diffDays > 0 
                          ? 'text-slate-900 dark:text-white text-[11px] sm:text-xs' 
                          : 'text-slate-400 text-[9px] sm:text-[10px]')
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
                      className="relative w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-white dark:bg-[#16171B] border border-slate-200 dark:border-white/10 flex items-center justify-center shrink-0 overflow-hidden transition-all shadow-2xs" 
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
                    <span className={`w-9 h-9 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center shrink-0 border shadow-2xs ${
                      isFlipping
                        ? 'bg-amber-50 dark:bg-amber-950/30 border-amber-300 dark:border-amber-500/30'
                        : 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-300 dark:border-emerald-500/30'
                    }`}>
                      {isFlipping ? (
                        <Hammer className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-amber-600 dark:text-amber-400 shrink-0" title="House Flipping" />
                      ) : (
                        <Gavel className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-emerald-600 dark:text-emerald-400 shrink-0" title="Leilão" />
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

          {/* Botão Link do Leilão */}
          {item.link && (
            <a
              href={item.link}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="px-2.5 py-1.5 rounded-xl bg-slate-100 hover:bg-emerald-50 dark:bg-[#1A1C20] dark:hover:bg-emerald-950/40 border border-slate-200 dark:border-white/10 text-slate-700 hover:text-emerald-700 dark:text-slate-300 dark:hover:text-emerald-400 transition-all shrink-0 inline-flex items-center gap-1.5 text-xs font-semibold"
              title="Abrir Link do Leilão"
            >
              <ExternalLink className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
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
