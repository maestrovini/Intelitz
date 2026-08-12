import { MapPin, Building, Car, Calendar, ExternalLink, Calculator, ShieldCheck, Heart, Bell, X, Sparkles, GitCompare, Trash2, Gavel, Hammer } from 'lucide-react';
import { AuctionItem, LotAlert } from '../types';
import { motion } from 'motion/react';
import { useState } from 'react';
import { getSplitLocation } from './LotesImovel';

interface ListingCardProps {
  key?: string;
  item: AuctionItem;
  onSelectCalculate: (item: AuctionItem) => void;
  onSelectAnalyze: (item: AuctionItem) => void;
  isFavorite: boolean;
  onToggleFavorite: (id: string) => void;
  alertConfig?: LotAlert;
  onSaveAlert: (auctionId: string, targetDiscount: number) => void;
  onRemoveAlert: (alertId: string) => void;
  onFetchFipeMarket?: (id: string) => void;
  isFetchingFipe?: boolean;
  isComparing?: boolean;
  onToggleCompare?: () => void;
  onDelete?: (id: string) => void;
}

export default function ListingCard({
  item,
  onSelectCalculate,
  onSelectAnalyze,
  isFavorite,
  onToggleFavorite,
  alertConfig,
  onSaveAlert,
  onRemoveAlert,
  onFetchFipeMarket,
  isFetchingFipe = false,
  isComparing = false,
  onToggleCompare,
  onDelete,
}: ListingCardProps) {
  const isRealEstate = item.category === 'real_estate';
  const [isSettingAlert, setIsSettingAlert] = useState(false);
  const [targetDiscount, setTargetDiscount] = useState(alertConfig?.targetDiscount ?? (item.discountPercent + 5));

  // Format Currency
  const formatBRL = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      maximumFractionDigits: 0
    }).format(value);
  };

  // Format Date
  const formatDate = (isoString: string) => {
    return new Date(isoString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <motion.div
      id={`auction-card-${item.id}`}
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      whileHover={{ y: -6, scale: 1.05, boxShadow: "0 25px 30px -5px rgba(0, 0, 0, 0.5), 0 15px 15px -5px rgba(0, 0, 0, 0.3)" }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      className={`group rounded-2xl border cursor-pointer transition-all duration-300 transform overflow-hidden flex flex-col h-full text-[#F8FAFC] ${
        item.arrematado === 'Sim' || item.vendido === 'Sim'
          ? 'bg-gradient-to-b from-[#120520] via-[#080210] to-[#000000] border-purple-500/50 shadow-[0_10px_30px_rgba(88,28,135,0.35),inset_0_1px_0_rgba(255,255,255,0.15)] md:hover:border-purple-400 md:hover:shadow-[0_20px_40px_rgba(168,85,247,0.3)]'
          : 'bg-gradient-to-b from-[#0A0A0C] via-[#050507] to-[#000000] border-white/12 shadow-[0_10px_30px_rgba(0,0,0,0.95),inset_0_1px_0_rgba(255,255,255,0.15)] md:hover:border-white/25'
      }`}
    >
      {/* Visual Header Image */}
      <div className="relative h-48 w-full bg-[#1C1C1E]/60 overflow-hidden">
        <img
          src={item.image}
          alt={item.title}
          referrerPolicy="no-referrer"
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
        
        {/* Category & Portal Badges */}
        <div className="absolute top-3 left-3 flex flex-wrap gap-1.5 font-sans">
          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-extrabold shadow-[0_3px_8px_rgba(0,0,0,0.5),inset_0_1px_0_rgba(255,255,255,0.2)] ${
            isRealEstate ? 'bg-gradient-to-b from-emerald-600 to-emerald-800 text-white border border-emerald-400/40' : 'bg-gradient-to-b from-amber-600 to-amber-800 text-white border border-amber-400/40'
          }`}>
            {isRealEstate ? <Building className="h-3 w-3" /> : <Car className="h-3 w-3" />}
            {item.typeText}
          </span>
          <span className="bg-gradient-to-b from-[#242428]/95 to-[#121215]/95 backdrop-blur-md text-slate-100 text-xs px-2.5 py-1 rounded-xl font-bold border border-white/15 shadow-[0_3px_8px_rgba(0,0,0,0.5),inset_0_1px_0_rgba(255,255,255,0.2)] font-inter flex items-center gap-1.5">
            {item.businessType === 'House Flipping' ? (
              <Hammer className="h-3.5 w-3.5 text-amber-400 shrink-0 drop-shadow-[0_2px_4px_rgba(245,158,11,0.6)]" title="House Flipping" />
            ) : (
              <Gavel className="h-3.5 w-3.5 text-emerald-400 shrink-0 drop-shadow-[0_2px_4px_rgba(16,185,129,0.6)]" title="Leilão" />
            )}
            {item.portalName}
          </span>
        </div>

        {/* Top-right Actions Panel (Favorite & Alerts) */}
        <div id={`card-actions-${item.id}`} className="absolute top-3 right-3 flex gap-1.5 z-10">
          {/* Bell Alert Button */}
          <button
            onClick={() => {
              setIsSettingAlert(!isSettingAlert);
              if (alertConfig) {
                setTargetDiscount(alertConfig.targetDiscount);
              } else {
                setTargetDiscount(item.discountPercent + 5);
              }
            }}
            className={`p-2 rounded-full shadow-xs transition-all duration-200 cursor-pointer ${
              alertConfig?.isActive 
                ? 'text-[#10B981] bg-[#10B981]/10 scale-110 border border-[#10B981]/30 flex items-center justify-center animate-pulse'
                : 'text-slate-400 hover:text-[#10B981] hover:scale-105 bg-[#1C1C1E]/90 backdrop-blur-xs hover:bg-[#2C2C2E] border border-[#2C2C2E]'
            }`}
            title={alertConfig?.isActive ? `Alerta ativo para desvalorização de ≥${alertConfig.targetDiscount}%` : 'Configurar alerta de lote / desconto'}
          >
            <Bell className="h-4 w-4 fill-current" />
          </button>

          {/* Favorite Heart Button */}
          <button
            onClick={() => onToggleFavorite(item.id)}
            className={`p-2 rounded-full shadow-xs transition-all duration-200 cursor-pointer ${
              isFavorite 
                ? 'text-rose-500 scale-110 bg-rose-500/15 border border-rose-500/25' 
                : 'text-slate-400 hover:text-rose-450 bg-[#1C1C1E]/90 backdrop-blur-xs hover:bg-[#2C2C2E] border border-[#2C2C2E]'
            }`}
            title={isFavorite ? 'Remover dos favoritos' : 'Adicionar aos favoritos'}
          >
            <Heart className="h-4 w-4 fill-current" />
          </button>

          {/* Delete Button */}
          {onDelete && (
            <button
              onClick={() => {
                onDelete(item.id);
              }}
              className="p-2 rounded-full shadow-xs transition-all duration-200 cursor-pointer text-slate-400 hover:text-rose-450 bg-[#1C1C1E]/90 backdrop-blur-xs hover:bg-[#2C2C2E] border border-[#2C2C2E] hover:scale-105"
              title="Excluir lote definitivamente"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Local Absolute Alert Configuration Overlay */}
        {isSettingAlert && (
          <div id={`alert-config-overlay-${item.id}`} className="absolute inset-0 bg-[#1C1C1E]/95 backdrop-blur-sm z-25 p-4 text-[#F8FAFC] flex flex-col justify-between select-none">
            <div className="flex items-center justify-between border-b border-[#2C2C2E] pb-2">
              <span className="text-xs font-bold font-sans flex items-center gap-1.5 text-[#10B981]">
                <Bell className="h-3.5 w-3.5 animate-bounce" />
                Alerta de Lote (Desconto)
              </span>
              <button 
                onClick={() => setIsSettingAlert(false)}
                className="text-slate-400 hover:text-[#F8FAFC] hover:bg-[#2C2C2E] p-1 rounded-lg transition"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>

            <div className="flex-1 flex flex-col justify-center py-2 text-center text-xs">
              <p className="text-[10px] text-slate-400 leading-relaxed mb-3">
                Avisas instantaneamente na tela quando o desconto de mercado chegar no limite:
              </p>
              
              <div className="bg-[#1C1C1E]/60 rounded-xl px-3 py-2.5 border border-[#2C2C2E] space-y-1.5">
                <div className="flex justify-between items-center text-[10.5px]">
                  <span className="text-slate-400">Desconto Atual do Lote:</span>
                  <span className="font-bold text-[#10B981] font-mono">{item.discountPercent}% OFF</span>
                </div>
                <div className="flex justify-between items-center text-[11px] pt-1 border-t border-[#2C2C2E]">
                  <span className="text-slate-300 font-bold">Desconto Alvo Configurado:</span>
                  <span className="font-black font-sans text-indigo-400 text-sm font-mono">{targetDiscount}% OFF</span>
                </div>
              </div>

              {/* Slider selector */}
              <div className="mt-4 px-1">
                <input
                  type="range"
                  min="5"
                  max="85"
                  step="5"
                  value={targetDiscount}
                  onChange={(e) => setTargetDiscount(Number(e.target.value))}
                  className="w-full accent-emerald-600 h-1 bg-[#2C2C2E] rounded-lg appearance-none cursor-pointer"
                />
                <div className="flex justify-between text-[8px] text-slate-500 font-mono mt-1">
                  <span>5% (Mínimo)</span>
                  <span>85% (Extremo)</span>
                </div>
              </div>
            </div>

            <div className="flex gap-2 pt-2 border-t border-[#2C2C2E] mt-auto">
              {alertConfig && (
                <button
                  onClick={() => {
                    onRemoveAlert(alertConfig.id);
                    setIsSettingAlert(false);
                  }}
                  className="flex-1 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 text-rose-400 py-2 rounded-xl text-[10px] font-bold transition cursor-pointer"
                >
                  Excluir Alerta
                </button>
              )}
              <button
                onClick={() => {
                  onSaveAlert(item.id, targetDiscount);
                  setIsSettingAlert(false);
                }}
                className="flex-1 bg-[#10B981] hover:bg-[#10B981]/90 text-black py-2 rounded-xl text-[10px] font-bold transition cursor-pointer shadow-xs"
              >
                {alertConfig ? 'Atualizar Alerta' : 'Ativar Alerta'}
              </button>
            </div>
          </div>
        )}

        {/* Select to Compare Button (Bottom-left of image overlay) */}
        {onToggleCompare && (
          <button
            type="button"
            id={`compare-toggle-${item.id}`}
            onClick={(e) => {
              e.stopPropagation();
              onToggleCompare();
            }}
            className={`absolute bottom-3 left-3 px-2.5 py-1 rounded-lg text-[11px] font-black shadow-md transition-all duration-205 cursor-pointer flex items-center gap-1.5 z-20 ${
              isComparing 
                ? 'bg-blue-600 hover:bg-blue-700 text-white border border-blue-500 scale-105' 
                : 'bg-[#1C1C1E]/95 hover:bg-[#2C2C2E] text-slate-300 hover:text-blue-400 border border-[#2C2C2E]'
            }`}
          >
            <GitCompare className={`h-3.5 w-3.5 ${isComparing ? 'text-white' : 'text-zinc-500'}`} />
            <span>{isComparing ? 'Comparando' : 'Comparar'}</span>
          </button>
        )}

        {/* Discount Badge */}
        <div className="absolute bottom-3 right-3 bg-[#10B981] text-black font-extrabold text-sm px-3 py-1 rounded-xl shadow-md flex flex-col items-center">
          <span>{item.discountPercent}%</span>
          <span className="text-[9px] uppercase font-bold tracking-widest -mt-0.5">OFF</span>
        </div>
      </div>

      {/* Card Content body */}
      <div className="p-5 flex-1 flex flex-col">
        {/* Location & Header text */}
        {(() => {
          const { mainAddress, cityState } = getSplitLocation(item.location);
          return (
            <div className="flex flex-col gap-1.5 mb-2 w-full">
              <div className="text-base md:text-lg font-black font-inter text-[#F8FAFC]">
                {cityState || mainAddress}
              </div>
              <div className="flex items-center w-full">
                <div className="flex items-start gap-2 bg-[#2C2C2E]/60 border border-[#2C2C2E] px-3 py-2 rounded-xl text-slate-200 w-full">
                  <MapPin className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
                  <div className="flex flex-col flex-1 min-w-0 gap-0.5">
                    {item.condoName ? (
                      <span className="text-sm md:text-base font-bold text-white leading-snug break-words">
                        {item.condoName}
                      </span>
                    ) : null}
                    <span className="text-xs md:text-sm text-slate-300 font-medium leading-normal break-words">
                      {cityState ? mainAddress : item.location}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          );
        })()}

        <h3 className="font-sans font-bold text-[#F8FAFC] text-base leading-tight md:group-hover:text-emerald-400 md:hover:text-emerald-400 transition-colors line-clamp-2 mb-3">
          {item.title}
        </h3>

        {/* Secondary Parameters (Occupancy / Quality) */}
        <div className={`grid ${(!isRealEstate && item.details?.mileage) ? 'grid-cols-3' : 'grid-cols-2'} gap-2 mb-4`}>
          <div className="bg-[#1C1C1E]/60 border border-[#2C2C2E] rounded-xl px-2.5 py-1.5 text-center">
            <span className="text-[10px] text-slate-400 block font-mono">ESTADO</span>
            <span className="text-xs font-semibold text-slate-300 block uppercase truncate">
              {isRealEstate 
                ? (item.occupancyStatus === 'ocupado' ? '🔴 Ocupado' : '🟢 Desocupado') 
                : (item.vehicleCondition === 'recuperado' ? '🟠 Recuperado' : item.vehicleCondition === 'sinistro' ? '🔴 Sinistrado' : '🟢 Frota')
              }
            </span>
          </div>

          {!isRealEstate && item.details?.mileage && (
            <div className="bg-[#1C1C1E]/60 border border-[#2C2C2E] rounded-xl px-2.5 py-1.5 text-center">
              <span className="text-[10px] text-slate-400 block font-mono">QUILOMETRAGEM</span>
              <span className="text-xs font-semibold text-slate-300 block uppercase truncate">
                {item.details.mileage}
              </span>
            </div>
          )}

          <div className="bg-[#1C1C1E]/60 border border-[#2C2C2E] rounded-xl px-2.5 py-1.5 text-center flex flex-col justify-center">
            <span className="text-[10px] text-slate-400 block font-mono">DÍVIDAS</span>
            <span className="text-[10.5px] font-semibold text-slate-300 block leading-tight truncate">
              {item.debtsPaidByBuyer ? '⚠️ Comprador' : '✅ Isento'}
            </span>
          </div>
        </div>

        {/* Financial Comparison bar */}
        <div className="bg-gradient-to-b from-[#0B0B0D] via-[#050506] to-[#000000] border border-white/10 p-3 rounded-2xl mb-4 flex-1 flex flex-col justify-between shadow-[0_6px_16px_rgba(0,0,0,0.8),inset_0_1px_0_rgba(255,255,255,0.08)]">
          <div className="flex justify-between items-end mb-2">
            <div>
              <span className="text-[10px] font-semibold text-slate-400 font-mono block">
                {item.category === 'vehicle' ? 'MERCADO / ESTIMADO' : 'MERCADO / FIPE'}
              </span>
              <span className="text-sm font-semibold text-slate-400 line-through">
                {formatBRL(item.marketValue)}
              </span>
              {item.category === 'vehicle' && item.fipeValue && (
                <div className="text-[10px] font-bold text-blue-400 font-mono bg-blue-950/40 border border-blue-800/40 rounded px-1.5 py-0.5 mt-0.5 inline-block">
                  FIPE: {formatBRL(item.fipeValue)}
                </div>
              )}
            </div>
            <div className="text-right">
              <span className="text-[10px] font-bold text-[#10B981] font-mono block">LANCE ESTIMADO MÍNIMO</span>
              <span className="text-base font-extrabold text-[#F8FAFC] block drop-shadow-xs">
                {formatBRL(item.currentBid)}
              </span>
            </div>
          </div>
          
          <div className="w-full bg-[#08080A] h-1.5 rounded-full overflow-hidden border border-white/5 shadow-[inset_0_2px_4px_rgba(0,0,0,0.9)] p-[1px]">
            <div 
              className="bg-[#00FF00] h-full rounded-full shadow-[0_0_8px_rgba(0,255,0,0.5)]" 
              style={{ width: `${Math.min(100, (item.currentBid / item.marketValue) * 100)}%` }}
            />
          </div>

          {onFetchFipeMarket && (
            <div className="mt-2.5 pt-2 border-t border-white/5 flex items-center justify-between">
              <span className="text-[9px] text-slate-400 font-mono font-bold">VALORES COM IA</span>
              <button
                type="button"
                onClick={() => onFetchFipeMarket(item.id)}
                disabled={isFetchingFipe}
                className="text-[10px] font-extrabold text-indigo-300 hover:text-indigo-200 bg-gradient-to-b from-indigo-900/60 to-indigo-950/80 border border-indigo-500/40 shadow-[0_2px_6px_rgba(99,102,241,0.25),inset_0_1px_0_rgba(255,255,255,0.15)] rounded-xl px-2.5 py-1 flex items-center gap-1 cursor-pointer disabled:opacity-60 disabled:cursor-wait hover:scale-105 active:scale-95 transition-all"
                title="Pesquisar Tabela FIPE e Valor de Avaliação real usando Inteligência Artificial"
              >
                <Sparkles className="h-3 w-3 text-indigo-400 animate-pulse" />
                {isFetchingFipe ? 'Buscando FIPE/Mercado...' : 'Buscar FIPE/Mercado'}
              </button>
            </div>
          )}
        </div>

        {/* Date / Auction info block */}
        <div className="flex items-center gap-1.5 text-xs text-slate-300 font-medium mb-4">
          <Calendar className="h-3.5 w-3.5 text-[#10B981] shrink-0 drop-shadow-[0_0_4px_rgba(16,185,129,0.5)]" />
          <span className="line-clamp-1 text-slate-300">
            <strong className="text-white">1º Leilão:</strong> {formatDate(item.auctionDate1)}
          </span>
        </div>

        {/* Interactive Action Buttons */}
        <div className="grid grid-cols-2 gap-2 pt-2 border-t border-white/10 mt-auto">
          <button
            onClick={() => onSelectCalculate(item)}
            className="flex items-center justify-center gap-1.5 py-2 px-3 bg-gradient-to-b from-[#222226] to-[#121215] hover:from-[#2A2A30] hover:to-[#18181C] border border-white/15 text-slate-200 hover:text-emerald-400 rounded-xl text-xs font-bold font-sans shadow-[0_3px_8px_rgba(0,0,0,0.5),inset_0_1px_0_rgba(255,255,255,0.15)] hover:scale-105 active:scale-95 transition-all cursor-pointer"
            title="Calcular potencial de lucro (ROI)"
          >
            <Calculator className="h-3.5 w-3.5 text-emerald-400" />
            Simular ROI
          </button>
          <button
            onClick={() => onSelectAnalyze(item)}
            className="flex items-center justify-center gap-1.5 py-2 px-3 bg-gradient-to-b from-emerald-500 to-emerald-700 hover:from-emerald-400 hover:to-emerald-600 text-black rounded-xl text-xs font-black font-sans shadow-[0_4px_12px_rgba(16,185,129,0.35),inset_0_1px_0_rgba(255,255,255,0.3)] hover:scale-105 active:scale-95 transition-all cursor-pointer"
            title="Análise profunda do edital usando IA"
          >
            <ShieldCheck className="h-3.5 w-3.5 text-black" />
            Analisar IA
          </button>
        </div>
      </div>
    </motion.div>
  );
}
