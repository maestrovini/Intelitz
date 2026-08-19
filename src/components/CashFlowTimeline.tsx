import React, { useState } from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from 'recharts';
import { 
  Clock, 
  ChevronDown, 
  ChevronUp, 
  TrendingUp, 
  ArrowUpRight, 
  ArrowDownRight, 
  DollarSign 
} from 'lucide-react';
import { ImovelLot } from '../types';
import { formatPercentBR } from '../utils/formatters';

interface CashFlowTimelineProps {
  property: ImovelLot;
  participationPercent?: number;
  isExpanded?: boolean;
  onToggle?: () => void;
}

interface MonthlyData {
  monthKey: string; // YYYY-MM
  monthLabel: string; // e.g. "Jul/26"
  inflows: number;
  outflows: number;
  net: number;
  cumulative: number;
}

export default function CashFlowTimeline({
  property,
  participationPercent = 100,
  isExpanded,
  onToggle
}: CashFlowTimelineProps) {
  const [localIsOpen, setLocalIsOpen] = useState(false);
  const isControlled = isExpanded !== undefined && onToggle !== undefined;
  const isOpen = isControlled ? isExpanded : localIsOpen;
  const handleToggle = isControlled ? onToggle : () => setLocalIsOpen(!localIsOpen);

  // Helper to parse date string robustly
  const parseDateString = (dateStr?: string): Date => {
    if (!dateStr) return new Date();
    // YYYY-MM-DD
    const matchYMD = dateStr.match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (matchYMD) {
      return new Date(parseInt(matchYMD[1], 10), parseInt(matchYMD[2], 10) - 1, parseInt(matchYMD[3], 10));
    }
    // DD/MM/YYYY
    const matchDMY = dateStr.match(/^(\d{2})\/(\d{2})\/(\d{4})/);
    if (matchDMY) {
      return new Date(parseInt(matchDMY[3], 10), parseInt(matchDMY[2], 10) - 1, parseInt(matchDMY[1], 10));
    }
    const d = new Date(dateStr);
    return isNaN(d.getTime()) ? new Date() : d;
  };

  // Helper to get transaction date or fallback offset
  const getTransactionDate = (field: string, daysOffset: number): Date => {
    let customDateStr: string | undefined;
    if (field.startsWith('custom_expense_date_')) {
      const expenseId = field.replace('custom_expense_date_', '');
      const exp = (property.customExpenses || []).find(e => e.id === expenseId);
      customDateStr = exp?.paymentDate;
    } else {
      customDateStr = property[field as keyof ImovelLot] as string | undefined;
    }
    if (customDateStr) {
      return parseDateString(customDateStr);
    }
    // Base date is auctionDate or today
    let baseDate = new Date();
    if (property.auctionDate) {
      baseDate = parseDateString(property.auctionDate);
    }
    const result = new Date(baseDate);
    result.setDate(result.getDate() + daysOffset);
    return result;
  };

  // Helpers for financial values
  const commissionPercent = property.commission !== undefined ? property.commission : 5;
  const commissionVal = property.suggestedBid * (commissionPercent / 100);
  const saleValue = property.saleValue !== undefined ? property.saleValue : property.marketValue;
  const corretagemPercent = property.corretagem !== undefined ? property.corretagem : 0;
  const corretagemVal = saleValue * (corretagemPercent / 100);

  const irPercent = property.ir !== undefined ? property.ir : 15;
  const upfrontCostsWithoutBid = commissionVal + (property.iptu || 0) + (property.condominium || 0) + (property.registro || 0) + (property.itbi || 0) + (property.tabelionato || 0) + (property.reforma || 0) + (property.desocupacao || 0) + (property.parcela_emprestimo || 0) + (property.customExpenses || []).reduce((acc, curr) => acc + (curr.value || 0), 0);
  const upfrontCosts = property.suggestedBid + upfrontCostsWithoutBid;
  const emprestimoVal = property.emprestimo || 0;
  const capitalProprio = Math.max(0, upfrontCosts - emprestimoVal);
  const loanSurplus = emprestimoVal > upfrontCosts ? emprestimoVal - upfrontCosts : 0;
  const netSaleResultBeforeIR = saleValue - corretagemVal - (property.quitacao_emprestimo || 0);
  const profitBeforeIR = netSaleResultBeforeIR - capitalProprio + loanSurplus;
  const irVal = profitBeforeIR > 0 ? profitBeforeIR * (irPercent / 100) : 0;

  // Define transactions list
  const baseTransactions: { name: string; amount: number; date: Date }[] = [
    {
      name: 'Lance (Aquisição)',
      amount: -property.suggestedBid,
      date: getTransactionDate('paymentDate_bid', 0)
    },
    {
      name: 'Comissão Leiloeiro',
      amount: -commissionVal,
      date: getTransactionDate('paymentDate_commission', 0)
    },
    {
      name: 'IPTU',
      amount: -(property.iptu || 0),
      date: getTransactionDate('paymentDate_iptu', 15)
    },
    {
      name: 'Condomínio',
      amount: -(property.condominium || 0),
      date: getTransactionDate('paymentDate_condominium', 30)
    },
    {
      name: 'Registro de Imóvel / Cartório',
      amount: -(property.registro || 0),
      date: getTransactionDate('paymentDate_registro', 45)
    },
    {
      name: 'ITBI',
      amount: -(property.itbi || 0),
      date: getTransactionDate('paymentDate_itbi', 30)
    },
    {
      name: 'Tabelionato / Escritura',
      amount: -(property.tabelionato || 0),
      date: getTransactionDate('paymentDate_tabelionato', 30)
    },
    {
      name: 'Corretagem',
      amount: -corretagemVal,
      date: getTransactionDate('paymentDate_corretagem', 180)
    },
    {
      name: 'Imposto de Renda (IR)',
      amount: -irVal,
      date: getTransactionDate('paymentDate_ir', 180)
    },
    {
      name: 'Estimativa de Reforma',
      amount: -(property.reforma || 0),
      date: getTransactionDate('paymentDate_reforma', 60)
    },
    {
      name: 'Desocupação / Advogado',
      amount: -(property.desocupacao || 0),
      date: getTransactionDate('paymentDate_desocupacao', 60)
    },
    {
      name: 'Parcela Empréstimo',
      amount: -(property.parcela_emprestimo || 0),
      date: getTransactionDate('paymentDate_parcela_emprestimo', 30)
    },
    {
      name: 'Empréstimo',
      amount: property.emprestimo || 0,
      date: getTransactionDate('paymentDate_emprestimo', 0)
    },
    {
      name: 'Quitação Empréstimo',
      amount: -(property.quitacao_emprestimo || 0),
      date: getTransactionDate('paymentDate_quitacao_emprestimo', 180)
    },
    {
      name: 'Valor de Venda (Entrada)',
      amount: saleValue,
      date: getTransactionDate('paymentDate_sale', 180)
    }
  ];

  const customTransactions = (property.customExpenses || []).map(exp => {
    const predefinedOffsets: Record<string, number> = {
      'Comissão Leiloeiro': 0,
      'IPTU': 15,
      'Condomínio': 30,
      'Tabelionato / Escritura': 30,
      'Registro de Imóvel / Cartório': 45,
      'ITBI': 30,
      'Corretagem': 180,
      'Imposto de Renda (IR)': 180,
      'IR - Imposto de Renda': 180,
      'Reforma': 60,
      'Desocupação / Advogado': 90,
      'Parcela Empréstimo': 30,
    };
    const offset = predefinedOffsets[exp.name] !== undefined ? predefinedOffsets[exp.name] : 30;
    return {
      name: exp.name,
      amount: -(exp.value || 0),
      date: getTransactionDate(`custom_expense_date_${exp.id}`, offset)
    };
  });

  const saleDate = getTransactionDate('paymentDate_sale', 180);

  const transactions = [...baseTransactions, ...customTransactions]
    .filter(t => Math.abs(t.amount) > 0)
    .map(t => {
      if (t.date > saleDate) {
        return { ...t, date: new Date(saleDate) };
      }
      return t;
    });

  // Find min and max transaction months
  if (transactions.length === 0) return null;

  let minDate = new Date(transactions[0].date);
  let maxDate = new Date(saleDate);

  transactions.forEach(t => {
    if (t.date < minDate) minDate = new Date(t.date);
  });

  const totalDays = Math.max(0, Math.round((maxDate.getTime() - minDate.getTime()) / (1000 * 60 * 60 * 24)));

  // Normalize min and max dates to start of months
  const startMonth = new Date(minDate.getFullYear(), minDate.getMonth(), 1);
  const endMonth = new Date(maxDate.getFullYear(), maxDate.getMonth(), 1);

  // Generate list of all months in range (including gaps for " dinheiro no tempo ")
  const monthsList: { key: string; label: string; date: Date }[] = [];
  const currentMonthIter = new Date(startMonth);

  const monthNames = [
    'Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun',
    'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'
  ];

  // Maximum safe guard of 60 months (5 years) to prevent infinite loops
  let loopGuard = 0;
  while (currentMonthIter <= endMonth && loopGuard < 60) {
    const year = currentMonthIter.getFullYear();
    const month = currentMonthIter.getMonth();
    const key = `${year}-${String(month + 1).padStart(2, '0')}`;
    const label = `${monthNames[month]}/${String(year).substring(2)}`;
    
    monthsList.push({
      key,
      label,
      date: new Date(currentMonthIter)
    });
    
    currentMonthIter.setMonth(currentMonthIter.getMonth() + 1);
    loopGuard++;
  }

  // Group transactions into months
  const monthlyDataMap: Record<string, { inflows: number; outflows: number }> = {};
  monthsList.forEach(m => {
    monthlyDataMap[m.key] = { inflows: 0, outflows: 0 };
  });

  transactions.forEach(t => {
    const year = t.date.getFullYear();
    const month = t.date.getMonth();
    const key = `${year}-${String(month + 1).padStart(2, '0')}`;
    
    // Fallback: if transaction falls outside generated months, group in closest boundary
    let targetKey = key;
    if (!monthlyDataMap[targetKey]) {
      if (t.date < minDate) targetKey = monthsList[0]?.key;
      else targetKey = monthsList[monthsList.length - 1]?.key;
    }

    if (monthlyDataMap[targetKey]) {
      if (t.amount > 0) {
        monthlyDataMap[targetKey].inflows += t.amount;
      } else {
        monthlyDataMap[targetKey].outflows += Math.abs(t.amount);
      }
    }
  });

  // Calculate net and cumulative flows
  let cumulativeSum = 0;
  const chartData: MonthlyData[] = monthsList.map(m => {
    const { inflows, outflows } = monthlyDataMap[m.key];
    const net = inflows - outflows;
    cumulativeSum += net;
    return {
      monthKey: m.key,
      monthLabel: m.label,
      inflows,
      outflows,
      net,
      cumulative: cumulativeSum
    };
  });

  // Format currency helper
  const formatBRL = (val: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      maximumFractionDigits: 0
    }).format(val);
  };

  const factor = participationPercent / 100;

  // Custom Tooltip for Timeline Chart
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data: MonthlyData = payload[0].payload;
      return (
        <div className="bg-[#1C1C1E] border border-[#2C2C2E] rounded-xl p-3 shadow-2xl space-y-2 text-xs text-[#F8FAFC]">
          <p className="font-extrabold text-slate-400 border-b border-[#2C2C2E] pb-1 font-mono uppercase tracking-wider">
            {data.monthLabel}
          </p>
          <div className="space-y-1">
            <p className="font-semibold text-rose-400">
              Investimentos: <span className="font-mono">{formatBRL(data.outflows * factor)}</span>
            </p>
            {data.inflows > 0 && (
              <p className="font-semibold text-emerald-400">
                Retorno de Venda: <span className="font-mono">{formatBRL(data.inflows * factor)}</span>
              </p>
            )}
            <p className={`font-semibold ${data.net >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
              Fluxo Líquido: <span className="font-mono">{data.net >= 0 ? '+' : ''}{formatBRL(data.net * factor)}</span>
            </p>
            <p className={`font-extrabold pt-1 border-t border-[#2C2C2E] ${data.cumulative >= 0 ? 'text-emerald-400' : 'text-amber-400'}`}>
              Exposição Acumulada: <span className="font-mono">{formatBRL(data.cumulative * factor)}</span>
            </p>
          </div>
        </div>
      );
    }
    return null;
  };

  // Peak capital exposure (most negative cumulative point)
  let peakExposure = 0;
  chartData.forEach(d => {
    if (d.cumulative < peakExposure) peakExposure = d.cumulative;
  });

  const exactMonths = totalDays > 0 ? totalDays / 30 : chartData.length;

  return (
    <div className="bg-white dark:bg-[#0E0E0E] rounded-xl p-3.5 border border-slate-300 dark:border-[#38383A] transition-all shadow-3xs">
      {/* Header Toggle */}
      <div 
        onClick={handleToggle}
        className="flex justify-between items-center gap-2 cursor-pointer select-none"
      >
        <div className="flex items-center gap-1.5">
          <Clock className="h-4 w-4 text-black dark:text-[#10B981]" />
          <h3 className="text-[10px] font-black font-mono uppercase tracking-wider text-black dark:text-[#10B981]">
            Cronograma e Dinheiro no Tempo
          </h3>
        </div>
        <div className="flex items-center gap-2">
          {isOpen ? (
            <ChevronUp className="h-3.5 w-3.5 text-slate-600 dark:text-slate-400" />
          ) : (
            <ChevronDown className="h-3.5 w-3.5 text-slate-600 dark:text-slate-400" />
          )}
        </div>
      </div>

      {isOpen && (
        <div className="space-y-4 pt-4 animate-fadeIn">
          {/* Quick Metrics */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-slate-50 dark:bg-[#1C1C1E]/60 p-3 rounded-xl border border-slate-200 dark:border-[#2C2C2E]">
              <span className="text-[8px] text-black dark:text-slate-500 font-extrabold font-mono tracking-wider uppercase block mb-1">
                EXPOSIÇÃO MÁXIMA DE CAPITAL
              </span>
              <span className="text-sm font-black text-rose-600 dark:text-rose-400 font-mono block">
                {formatBRL(Math.abs(peakExposure) * factor)}
              </span>
              <span className="text-[8px] text-slate-600 dark:text-slate-500 font-mono block mt-0.5 font-medium">
                Maior aporte líquido acumulado
              </span>
            </div>

            <div className="bg-slate-50 dark:bg-[#1C1C1E]/60 p-3 rounded-xl border border-slate-200 dark:border-[#2C2C2E]">
              <span className="text-[8px] text-black dark:text-slate-500 font-extrabold font-mono tracking-wider uppercase block mb-1">
                LUCRO LÍQUIDO NO TEMPO
              </span>
              <span className="text-sm font-black text-emerald-600 dark:text-emerald-400 font-mono block">
                {formatBRL(cumulativeSum * factor)}
              </span>
              <span className="text-[8px] text-slate-600 dark:text-slate-500 font-mono block mt-0.5 font-medium">
                Saldo final da operação ({participationPercent}%)
              </span>
            </div>
          </div>

          {/* J-Curve Capital Exposure Chart */}
          <div className="space-y-1 bg-slate-50 dark:bg-[#1C1C1E]/40 p-3 rounded-xl border border-slate-200 dark:border-[#2C2C2E]/60">
            <div className="flex items-center justify-between text-[9px] text-black dark:text-slate-400 font-extrabold font-mono tracking-wider uppercase mb-2">
              <div className="flex items-center gap-1">
                <TrendingUp className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                <span>CURVA J DE CAIXA ACUMULADO</span>
              </div>
              <span className="text-slate-600 dark:text-slate-500 font-medium">Saldo Financeiro Corrente</span>
            </div>

            <div className="h-[160px] w-full pt-1">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={chartData}
                  margin={{ top: 5, right: 5, left: -10, bottom: 0 }}
                >
                  <defs>
                    <linearGradient id="colorCumulative" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10B981" stopOpacity={0.2}/>
                      <stop offset="95%" stopColor="#10B981" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#CBD5E1" className="dark:stroke-[#27272A]" vertical={false} />
                  <XAxis 
                    dataKey="monthLabel" 
                    stroke="#475569" 
                    fontSize={8} 
                    fontWeight="bold"
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis 
                    stroke="#475569" 
                    fontSize={8} 
                    fontWeight="semibold"
                    tickFormatter={(value) => `R$ ${(value * factor / 1000).toFixed(0)}k`}
                    tickLine={false}
                    axisLine={false}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Area 
                    type="monotone" 
                    dataKey="cumulative" 
                    stroke="#10B981" 
                    strokeWidth={2}
                    fillOpacity={1} 
                    fill="url(#colorCumulative)" 
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Month-by-month Table Breakdown */}
          <div className="bg-white dark:bg-[#1C1C1E]/60 border border-slate-200 dark:border-[#2C2C2E] rounded-xl overflow-hidden">
            <div className="p-2.5 bg-slate-100 dark:bg-[#1C1C1E] border-b border-slate-200 dark:border-[#2C2C2E] flex justify-between items-center">
              <span className="text-[9px] text-black dark:text-slate-400 font-extrabold font-mono uppercase tracking-wider">
                FLUXO DE CAIXA MENSAL PROJETADO
              </span>
              <span className="text-[8px] text-emerald-700 dark:text-[#10B981] bg-emerald-100 dark:bg-[#10B981]/10 border border-emerald-300 dark:border-[#10B981]/30 px-1.5 py-0.5 rounded font-black uppercase">
                {participationPercent}% Participação
              </span>
            </div>
            
            <div className="divide-y divide-slate-200 dark:divide-[#2C2C2E]/60 max-h-[220px] overflow-y-auto font-mono text-[10px]">
              {chartData.map((d, index) => {
                const isPositive = d.net >= 0;
                const netColor = isPositive ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400';
                const cumColor = d.cumulative >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-800 dark:text-slate-300';
                return (
                  <div key={d.monthKey} className="p-2.5 hover:bg-slate-50 dark:hover:bg-[#2C2C2E]/20 transition-all flex items-center justify-between gap-3">
                    <div className="flex flex-col gap-0.5">
                      <span className="text-black dark:text-[#F8FAFC] font-extrabold">{d.monthLabel}</span>
                      <div className="flex items-center gap-1.5 text-[9px] text-slate-600 dark:text-slate-500 font-bold">
                        {d.inflows > 0 && (
                          <span className="flex items-center text-emerald-600 dark:text-emerald-500">
                            <ArrowUpRight className="h-2.5 w-2.5 mr-0.5" />
                            {formatBRL(d.inflows * factor)}
                          </span>
                        )}
                        {d.outflows > 0 && (
                          <span className="flex items-center text-rose-600 dark:text-rose-500">
                            <ArrowDownRight className="h-2.5 w-2.5 mr-0.5" />
                            {formatBRL(d.outflows * factor)}
                          </span>
                        )}
                        {d.inflows === 0 && d.outflows === 0 && <span>Sem mov.</span>}
                      </div>
                    </div>

                    <div className="flex flex-col items-end gap-0.5">
                      <div className="flex items-center gap-1">
                        <span className={`font-black ${netColor}`}>
                          {isPositive ? '+' : ''}{formatBRL(d.net * factor)}
                        </span>
                      </div>
                      <span className={`text-[9px] font-bold ${cumColor}`}>
                        Acum: {formatBRL(d.cumulative * factor)}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
