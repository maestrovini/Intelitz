import React, { useState, useEffect } from 'react';
import { formatPercentBR } from '../utils/formatters';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell
} from 'recharts';
import { TrendingUp, DollarSign, Edit2, ChevronDown, ChevronUp, Calendar, Percent, PieChart } from 'lucide-react';

interface RoiPotentialChartProps {
  marketValue: number;
  suggestedBid: number;
  commission: number; // e.g. 5
  iptu: number;
  condominium: number;
  registro?: number;
  itbi?: number;
  tabelionato?: number;
  corretagem?: number;
  reforma?: number;
  desocupacao?: number;
  parcela_emprestimo?: number;
  quitacao_emprestimo?: number;
  emprestimo?: number;
  customExpenses?: { id: string; name: string; value: number; paymentDate?: string }[];
  initialSaleValue?: number;
  onSaleValueChange?: (val: number) => void;
  initialSaleDate?: string;
  onSaleDateChange?: (date: string) => void;
  initialBidDate?: string;
  isExpanded?: boolean;
  onToggle?: () => void;
  participationPercent?: number;
}

export default function RoiPotentialChart({
  marketValue,
  suggestedBid,
  commission,
  iptu,
  condominium,
  registro = 0,
  itbi = 0,
  tabelionato = 0,
  corretagem = 0,
  reforma = 0,
  desocupacao = 0,
  parcela_emprestimo = 0,
  quitacao_emprestimo = 0,
  emprestimo = 0,
  customExpenses = [],
  initialSaleValue,
  onSaleValueChange,
  initialSaleDate,
  onSaleDateChange,
  initialBidDate,
  isExpanded,
  onToggle,
  participationPercent = 100
}: RoiPotentialChartProps) {
  // Local state for Sale Value (Valor de Venda)
  const [saleValue, setSaleValue] = useState<number>(initialSaleValue !== undefined ? initialSaleValue : marketValue);
  const [saleDate, setSaleDate] = useState<string>(initialSaleDate || '');
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [editValStr, setEditValStr] = useState<string>('');

  // Update sale value whenever initialSaleValue or marketValue changes
  useEffect(() => {
    setSaleValue(initialSaleValue !== undefined ? initialSaleValue : marketValue);
  }, [initialSaleValue, marketValue]);

  // Update sale date whenever initialSaleDate changes
  useEffect(() => {
    setSaleDate(initialSaleDate || '');
  }, [initialSaleDate]);

  // Helpers for Brazilian currency formatting and parsing
  const formatValueToBrazilian = (val: number): string => {
    return new Intl.NumberFormat('pt-BR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(val);
  };

  const formatTypingToBrazilian = (valueStr: string): string => {
    const clean = valueStr.replace(/\D/g, '');
    if (!clean) return '';
    const num = parseInt(clean, 10);
    return new Intl.NumberFormat('pt-BR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(num / 100);
  };

  const parseBrazilianDecimalToNumber = (valueStr: string): number => {
    const trimmed = valueStr.trim();
    if (!trimmed) return 0;
    const clean = trimmed.replace(/\./g, '').replace(',', '.');
    const num = parseFloat(clean);
    return isNaN(num) ? 0 : num;
  };

  const handleStartEdit = () => {
    setEditValStr(formatValueToBrazilian(saleValue));
    setIsEditing(true);
  };

  const handleSaveEdit = () => {
    const num = parseBrazilianDecimalToNumber(editValStr);
    setSaleValue(num);
    setIsEditing(false);
    if (onSaleValueChange) {
      onSaleValueChange(num);
    }
  };

  const commissionVal = suggestedBid * (commission / 100);
  const corretagemVal = saleValue * (corretagem / 100);
  const customExpensesSum = (customExpenses || []).reduce((acc, curr) => acc + (curr.value || 0), 0);
  
  // Despesas que ocorrem no início ou durante o período de carregamento (holding)
  const upfrontCosts = suggestedBid + commissionVal + iptu + condominium + registro + itbi + tabelionato + reforma + desocupacao + parcela_emprestimo + customExpensesSum;
  
  // Capital próprio aportado inicial/durante holding
  const capitalProprio = Math.max(0, upfrontCosts - emprestimo);
  
  // Sobra de Empréstimo no D+0 (quando o valor financiado supera os custos de aquisição/iniciais)
  const loanSurplus = emprestimo > upfrontCosts ? emprestimo - upfrontCosts : 0;
  const totalInflows = saleValue + emprestimo;
  const totalOutflows = upfrontCosts + quitacao_emprestimo + corretagemVal;

  // Custo Total de Desembolso de Caixa (Investimento de bolso total ao longo do projeto)
  const totalInvestment = upfrontCosts - emprestimo + quitacao_emprestimo + corretagemVal;
  
  // Resultado da Venda (Venda - Corretagem - Quitação do Empréstimo)
  const netSaleResult = saleValue - corretagemVal - quitacao_emprestimo;

  // Lucro Líquido Real = Resultado na Venda - Capital Próprio Desembolsado + Sobra de Caixa Inicial
  const netProfit = netSaleResult - capitalProprio + loanSurplus;
  // Calculate months duration based on exact days count divided by 30
  const getMonthsCount = (): number => {
    const parseDateStr = (dateStr?: string): Date | null => {
      if (!dateStr) return null;
      const matchYMD = dateStr.match(/^(\d{4})-(\d{2})-(\d{2})/);
      if (matchYMD) {
        return new Date(parseInt(matchYMD[1], 10), parseInt(matchYMD[2], 10) - 1, parseInt(matchYMD[3], 10));
      }
      const matchDMY = dateStr.match(/^(\d{2})\/(\d{2})\/(\d{4})/);
      if (matchDMY) {
        return new Date(parseInt(matchDMY[3], 10), parseInt(matchDMY[2], 10) - 1, parseInt(matchDMY[1], 10));
      }
      const d = new Date(dateStr);
      return isNaN(d.getTime()) ? null : d;
    };

    const startDate = parseDateStr(initialBidDate) || new Date();
    const endDate = parseDateStr(saleDate);

    if (endDate && startDate) {
      const diffMs = endDate.getTime() - startDate.getTime();
      const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));
      if (diffDays > 0) {
        return diffDays / 30;
      }
    }
    return 6; // Padrão: 180 dias / 30 = 6 meses
  };

  const monthsCount = Math.max(0.0333, getMonthsCount());

  // ROI Total e Mensal Composto sobre Capital Próprio + Recursos de Terceiros Investidos (upfrontCosts)
  const roiPercent = upfrontCosts > 0 ? (netProfit / upfrontCosts) * 100 : 0;
  let roiMonthly = 0;
  if (roiPercent > -100 && monthsCount > 0) {
    const ratio = 1 + roiPercent / 100;
    if (ratio > 0) {
      roiMonthly = (Math.pow(ratio, 1 / monthsCount) - 1) * 100;
    } else {
      roiMonthly = roiPercent / monthsCount;
    }
  } else {
    roiMonthly = roiPercent / monthsCount;
  }

  // ROI sobre Capital Próprio Total e Mensal Composto
  const roiCapitalProprio = capitalProprio > 0 ? (netProfit / capitalProprio) * 100 : Infinity;
  let roiCapitalProprioMonthly = Infinity;
  if (isFinite(roiCapitalProprio)) {
    if (roiCapitalProprio > -100 && monthsCount > 0) {
      const ratio = 1 + roiCapitalProprio / 100;
      if (ratio > 0) {
        roiCapitalProprioMonthly = (Math.pow(ratio, 1 / monthsCount) - 1) * 100;
      } else {
        roiCapitalProprioMonthly = roiCapitalProprio / monthsCount;
      }
    } else {
      roiCapitalProprioMonthly = roiCapitalProprio / monthsCount;
    }
  }

  // Margem de Lucro Total e Mensal Composta
  const profitMarginTotal = saleValue > 0 ? (netProfit / saleValue) * 100 : 0;
  let profitMarginMonthly = 0;
  if (profitMarginTotal > -100 && monthsCount > 0) {
    const ratio = 1 + profitMarginTotal / 100;
    if (ratio > 0) {
      profitMarginMonthly = (Math.pow(ratio, 1 / monthsCount) - 1) * 100;
    } else {
      profitMarginMonthly = profitMarginTotal / monthsCount;
    }
  } else {
    profitMarginMonthly = profitMarginTotal / monthsCount;
  }

  // TIR (Taxa Interna de Retorno Composta) Mensal, Anual e Total da Operação
  // Considera o ROI do Capital Próprio quando houver empréstimo, ou ROI sobre Investimento Total
  const effectiveRoi = (emprestimo > 0 && isFinite(roiCapitalProprio)) ? roiCapitalProprio : roiPercent;
  let tirMonthly = 0;
  if (effectiveRoi > -100 && monthsCount > 0) {
    const ratio = 1 + effectiveRoi / 100;
    if (ratio > 0) {
      tirMonthly = (Math.pow(ratio, 1 / monthsCount) - 1) * 100;
    }
  }
  const tirAnnual = (Math.pow(1 + tirMonthly / 100, 12) - 1) * 100;
  const tirTotal = (Math.pow(1 + tirMonthly / 100, monthsCount) - 1) * 100;

  const formatBRL = (val: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      maximumFractionDigits: 0
    }).format(val);
  };

  // Prepare data for Recharts stacked vs side bars
  const totalCosts = Math.max(0, totalInvestment - suggestedBid);
  const chartData = [
    {
      name: 'Valor de Mercado',
      value: marketValue,
      fill: '#3B82F6', // Blue
    },
    {
      name: 'Valor de Venda',
      value: saleValue,
      fill: '#10B981', // Emerald
    },
    {
      name: 'Custo Total',
      value: totalInvestment,
      fill: '#EF4444', // Red/Rose
    },
    {
      name: 'Lance',
      value: suggestedBid,
      fill: '#F59E0B', // Amber/Yellow
    },
    {
      name: 'Custo Adicional',
      value: totalCosts,
      fill: '#6366F1', // Indigo/Violet
    }
  ];

  // Tooltip content component
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const { name, value, fill } = payload[0].payload;
      return (
        <div className="bg-[#1C1C1E] border border-[#2C2C2E] rounded-xl p-3 shadow-2xl space-y-1 text-xs text-[#F8FAFC]">
          <p className="font-extrabold mb-1 font-mono text-[10px] uppercase tracking-wider" style={{ color: fill }}>
            {name}
          </p>
          <p className="font-semibold text-sm text-[#F8FAFC]">
            Valor: <strong className="font-mono text-emerald-400">{formatBRL(value)}</strong>
          </p>
        </div>
      );
    }
    return null;
  };

  // Determine indicator tag
  const getRoiRating = (roi: number) => {
    if (roi >= 50) return { label: 'ROI Excelente (Premium)', color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/25' };
    if (roi >= 30) return { label: 'ROI Muito Alto', color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/25' };
    if (roi >= 15) return { label: 'ROI Moderado', color: 'text-blue-400 bg-blue-500/10 border-blue-500/25' };
    if (roi > 0) return { label: 'ROI Baixo', color: 'text-amber-400 bg-amber-500/10 border-amber-500/25' };
    return { label: 'ROI Negativo / Alto Risco', color: 'text-rose-400 bg-rose-500/10 border-rose-500/25' };
  };

  const rating = getRoiRating(roiPercent);

  const hasExternalToggle = isExpanded !== undefined && onToggle !== undefined;
  const [localExpanded, setLocalExpanded] = useState(false);
  const activeExpanded = hasExternalToggle ? isExpanded : localExpanded;
  const activeToggle = hasExternalToggle ? onToggle : () => setLocalExpanded(prev => !prev);

  return (
    <div className="bg-[#1C1C1E]/60 rounded-xl p-4 border border-[#2C2C2E] transition-all shadow-3xs">
      <div 
        onClick={activeToggle}
        className="flex justify-between items-center gap-2 cursor-pointer select-none"
      >
        <div className="flex items-center gap-1.5">
          <TrendingUp className="h-4 w-4 text-[#10B981]" />
          <h3 className="text-[10px] font-black font-mono uppercase tracking-wider text-[#10B981]">
            Análise de ROI & Viabilidade
          </h3>
        </div>
        <div className="flex items-center gap-2">
          <span className={`inline-flex items-center text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-full border leading-none shrink-0 ${rating.color}`}>
            {rating.label}
          </span>
          {activeExpanded ? (
            <ChevronUp className="h-3.5 w-3.5 text-slate-400" />
          ) : (
            <ChevronDown className="h-3.5 w-3.5 text-slate-400" />
          )}
        </div>
      </div>

      {activeExpanded && (
        <div className="space-y-4 pt-4 animate-fadeIn">
          {/* Valor de Venda (Editable Card with Slider below) */}
          <div 
            className="bg-[#1C1C1E]/60 p-3.5 rounded-xl border border-[#2C2C2E] hover:border-[#10B981]/50 transition-colors group cursor-pointer"
            onClick={() => !isEditing && handleStartEdit()}
          >
            <div className="flex items-center justify-between text-[9px] text-slate-400 font-bold font-mono tracking-wider uppercase mb-2">
              <div className="flex items-center gap-1">
                <DollarSign className="h-3 w-3 text-emerald-400" />
                <span>VALOR DE VENDA</span>
              </div>
              {!isEditing && (
                <Edit2 className="h-3 w-3 text-[#10B981] opacity-70 group-hover:opacity-100 transition-opacity" />
              )}
            </div>

            <div className="flex justify-center items-center py-1">
              {isEditing ? (
                <div className="flex items-center gap-2 w-full max-w-xs" onClick={(e) => e.stopPropagation()}>
                  <div className="relative flex-1">
                    <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[11px] font-bold text-slate-550">R$</span>
                    <input
                      type="text"
                      value={editValStr}
                      onChange={(e) => setEditValStr(formatTypingToBrazilian(e.target.value))}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleSaveEdit();
                        if (e.key === 'Escape') setIsEditing(false);
                      }}
                      className="w-full bg-[#2C2C2E] text-xs font-semibold border border-[#10B981] rounded-lg pl-8 pr-2.5 py-1.5 text-[#F8FAFC] text-center focus:outline-none transition-all font-mono"
                      autoFocus
                    />
                  </div>
                  <button
                    onClick={handleSaveEdit}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg px-2.5 py-1.5 text-xs font-bold transition-all cursor-pointer shadow-sm"
                  >
                    OK
                  </button>
                  <button
                    onClick={() => setIsEditing(false)}
                    className="bg-[#2C2C2E] hover:bg-zinc-800 text-slate-400 rounded-lg px-2 py-1.5 text-xs font-bold transition-all cursor-pointer border border-[#2D2D30]"
                  >
                    Cancelar
                  </button>
                </div>
              ) : (
                <span className="text-xl font-black text-[#10B981] font-mono block text-center mt-0.5 group-hover:text-emerald-400 transition-colors">
                  {formatBRL(saleValue)}
                </span>
              )}
            </div>

            {/* Slider selector for Valor de Venda directly inside the card under the value */}
            {(() => {
              const minSliderValue = Math.max(0, Math.min(Math.round(suggestedBid * 0.5), saleValue));
              const maxSliderValue = Math.max(Math.round(marketValue * 1.5), saleValue);
              const stepValue = 1000;
              
              return (
                <div className="space-y-1 mt-1" onClick={(e) => e.stopPropagation()}>
                  <input
                    type="range"
                    min={minSliderValue}
                    max={maxSliderValue}
                    step={stepValue}
                    value={saleValue}
                    onChange={(e) => {
                      const val = Number(e.target.value);
                      setSaleValue(val);
                      if (onSaleValueChange) {
                        onSaleValueChange(val);
                      }
                    }}
                    className="w-full h-1.5 bg-[#2C2C2E] rounded-lg appearance-none cursor-pointer accent-[#10B981] hover:accent-emerald-400 focus:outline-none transition-colors"
                  />
                  <div className="flex justify-between text-[8px] text-slate-500 font-bold font-mono">
                    <span>Min: {formatBRL(minSliderValue)}</span>
                    <span>Max: {formatBRL(maxSliderValue)}</span>
                  </div>
                </div>
              );
            })()}

            {/* Divider */}
            <div className="my-2.5 border-t border-[#2C2C2E]/60" />

            {/* Date of Sale selector */}
            <div className="flex items-center justify-between pt-0.5" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center gap-1.5 text-slate-400 font-bold text-[9px] uppercase tracking-wider">
                <Calendar className="h-3 w-3 text-emerald-400" />
                <span>Data Estimada da Venda</span>
              </div>
              <input
                type="date"
                value={saleDate}
                onChange={(e) => {
                  const newDate = e.target.value;
                  setSaleDate(newDate);
                  if (onSaleDateChange) {
                    onSaleDateChange(newDate);
                  }
                }}
                className="bg-[#2C2C2E] border border-[#2C2C2E] focus:border-[#10B981] text-[#F8FAFC] font-mono text-[10px] rounded px-1.5 py-1 focus:outline-none w-32 text-center transition-colors cursor-pointer"
              />
            </div>
          </div>

          {/* Financial Indicators Grid: ROI, TIR, Margem de Lucro & Lucro Líquido */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
            {/* Card 1: Retorno (ROI) */}
            <div className="bg-[#1C1C1E]/60 p-3 rounded-xl border border-[#2C2C2E] flex flex-col justify-between space-y-1.5">
              <div>
                <div className="flex items-center justify-between text-[9px] text-slate-400 font-bold font-mono tracking-wider uppercase mb-1">
                  <div className="flex items-center gap-1">
                    <TrendingUp className="h-3.5 w-3.5 text-[#10B981]" />
                    <span>Retorno (ROI)</span>
                  </div>
                </div>
                <div className="flex items-baseline justify-between gap-1">
                  <span className="text-base font-black text-[#10B981] font-mono">
                    {formatPercentBR(roiPercent)}% <span className="text-[9px] text-slate-500 font-normal">total</span>
                  </span>
                  <span className="text-xs font-bold text-emerald-400 font-mono">
                    {formatPercentBR(roiMonthly)}% <span className="text-[8px] text-slate-500">a.m.</span>
                  </span>
                </div>
              </div>
              {emprestimo > 0 && (
                <div className="pt-1.5 border-t border-[#2C2C2E]/60 flex flex-col">
                  <span className="text-[8px] text-[#10B981] font-bold font-mono tracking-wider uppercase">ROI s/ Capital Próprio</span>
                  <div className="flex justify-between items-baseline text-xs font-black text-emerald-400 font-mono">
                    <span>{roiCapitalProprio === Infinity ? '∞' : `${formatPercentBR(roiCapitalProprio)}%`}</span>
                    {isFinite(roiCapitalProprioMonthly) && (
                      <span className="text-[9px] font-bold text-emerald-300">{formatPercentBR(roiCapitalProprioMonthly)}% a.m.</span>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Card 2: TIR (Taxa Interna de Retorno) */}
            <div className="bg-[#1C1C1E]/60 p-3 rounded-xl border border-[#2C2C2E] flex flex-col justify-between space-y-1.5">
              <div>
                <div className="flex items-center justify-between text-[9px] text-slate-400 font-bold font-mono tracking-wider uppercase mb-1">
                  <div className="flex items-center gap-1">
                    <Percent className="h-3.5 w-3.5 text-blue-400" />
                    <span>TIR (Taxa Int. Retorno)</span>
                  </div>
                </div>
                <div className="flex items-baseline justify-between gap-1">
                  <span className="text-base font-black text-blue-400 font-mono">
                    {formatPercentBR(tirMonthly)}% <span className="text-[9px] text-slate-500 font-normal">a.m.</span>
                  </span>
                  <span className="text-xs font-bold text-blue-300 font-mono">
                    {formatPercentBR(tirAnnual)}% <span className="text-[8px] text-slate-500">a.a.</span>
                  </span>
                </div>
              </div>
              <div className="pt-1.5 border-t border-[#2C2C2E]/60 flex justify-between items-center text-[8px] font-mono text-slate-400">
                <span>TIR Operação Total:</span>
                <span className="font-bold text-slate-200">{formatPercentBR(tirTotal)}%</span>
              </div>
            </div>

            {/* Card 3: Margem de Lucro */}
            <div className="bg-[#1C1C1E]/60 p-3 rounded-xl border border-[#2C2C2E] flex flex-col justify-between space-y-1.5">
              <div>
                <div className="flex items-center justify-between text-[9px] text-slate-400 font-bold font-mono tracking-wider uppercase mb-1">
                  <div className="flex items-center gap-1">
                    <PieChart className="h-3.5 w-3.5 text-indigo-400" />
                    <span>Margem de Lucro</span>
                  </div>
                </div>
                <div className="flex items-baseline justify-between gap-1">
                  <span className="text-base font-black text-indigo-400 font-mono">
                    {formatPercentBR(profitMarginTotal)}% <span className="text-[9px] text-slate-500 font-normal">total</span>
                  </span>
                  <span className="text-xs font-bold text-indigo-300 font-mono">
                    {formatPercentBR(profitMarginMonthly)}% <span className="text-[8px] text-slate-500">a.m.</span>
                  </span>
                </div>
              </div>
              <div className="pt-1.5 border-t border-[#2C2C2E]/60 flex justify-between items-center text-[8px] font-mono text-slate-400">
                <span>Prazo Estimado:</span>
                <span className="font-bold text-slate-200">{formatPercentBR(monthsCount, monthsCount % 1 === 0 ? 0 : 2)} Meses</span>
              </div>
            </div>

            {/* Card 4: Lucro Líquido Real & Participação */}
            <div className="bg-[#1C1C1E]/60 p-3 rounded-xl border border-[#2C2C2E] flex flex-col justify-between space-y-1.5">
              <div>
                <div className="flex items-center justify-between text-[9px] text-slate-400 font-bold font-mono tracking-wider uppercase mb-1">
                  <div className="flex items-center gap-1">
                    <DollarSign className="h-3.5 w-3.5 text-emerald-400" />
                    <span>Lucro Líquido Real</span>
                  </div>
                </div>
                <div className="flex items-baseline justify-between gap-1">
                  <span className="text-base font-black text-[#F8FAFC] font-mono block">
                    {formatBRL(netProfit)}
                  </span>
                </div>
              </div>
              <div className="pt-1.5 border-t border-[#2C2C2E]/60 flex justify-between items-center text-[8px] font-mono">
                <span className="text-slate-400 uppercase">Part. ({participationPercent}%):</span>
                <span className="font-bold text-emerald-400">{formatBRL(netProfit * (participationPercent / 100))}</span>
              </div>
            </div>
          </div>

          {/* Chart container */}
          <div className="h-[210px] w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                layout="vertical"
                data={chartData}
                margin={{ top: 5, right: 15, left: -10, bottom: 5 }}
                barSize={16}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#27272A" horizontal={false} />
                <XAxis
                  type="number"
                  stroke="#71717A"
                  fontSize={9}
                  fontWeight="semibold"
                  tickFormatter={(value) => `R$ ${(value / 1000).toFixed(0)}k`}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  type="category"
                  dataKey="name"
                  stroke="#71717A"
                  fontSize={10}
                  fontWeight="bold"
                  tickLine={false}
                  axisLine={false}
                  width={105}
                />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(39, 39, 42, 0.2)' }} />
                <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-y-2 gap-x-2 text-[8px] sm:text-[9px] text-slate-400 font-bold font-mono px-1 border-t border-[#2C2C2E] pt-2.5">
            <div className="flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-[#3B82F6]" />
              <span>VALOR DE MERCADO</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-[#10B981]" />
              <span>VALOR DE VENDA</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-[#EF4444]" />
              <span>CUSTO TOTAL</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-[#F59E0B]" />
              <span>LANCE</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-[#6366F1]" />
              <span>CUSTO ADICIONAL</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
