import React, { useState, useEffect } from 'react';
import { 
  Sparkles, AlertTriangle, CheckSquare, RefreshCw, FileText, Send, 
  Trash2, Building, ArrowRight, ArrowLeft, BookOpen, ShieldCheck, HelpCircle, 
  ShieldAlert, Info, TrendingUp, DollarSign, SlidersHorizontal, Search, X, Filter, Pencil, StickyNote,
  Bed, Car, Globe, Calendar, Plus, Clock, ChevronDown, ChevronUp, MapPin, Home, ChevronsUpDown, FileDown, Percent, Users, UserCheck
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { jsPDF } from 'jspdf';

import { ImovelLot, AuctionPortal, AppUser } from '../types';
import { BRAZIL_STATES, BRAZIL_CITIES } from '../utils/brazilData';
import { formatPercentBR } from '../utils/formatters';
import RoiPotentialChart from './RoiPotentialChart';
import CashFlowTimeline from './CashFlowTimeline';

const getAuctionCountdown = (dateStr?: string) => {
  if (!dateStr) return null;
  
  let targetDate: Date;
  if (dateStr.includes('-')) {
    const [year, month, day] = dateStr.split('-').map(Number);
    targetDate = new Date(year, month - 1, day);
  } else if (dateStr.includes('/')) {
    const [day, month, year] = dateStr.split('/').map(Number);
    targetDate = new Date(year, month - 1, day);
  } else {
    targetDate = new Date(dateStr);
  }

  if (isNaN(targetDate.getTime())) {
    return null;
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  targetDate.setHours(0, 0, 0, 0);

  const diffTime = targetDate.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays === 0) {
    return { text: 'Hoje', isToday: true, diffDays, color: 'text-emerald-400 bg-emerald-950/40 border border-emerald-500/20 px-2 py-0.5 rounded-md font-black animate-pulse' };
  } else if (diffDays > 0) {
    return { text: `Faltam ${diffDays} ${diffDays === 1 ? 'dia' : 'dias'}`, isToday: false, diffDays, color: 'text-amber-400 font-extrabold' };
  } else {
    return { text: `Encerrado há ${Math.abs(diffDays)} ${Math.abs(diffDays) === 1 ? 'dia' : 'dias'}`, isToday: false, diffDays, color: 'text-zinc-500 font-medium' };
  }
};

const getPropertyTypeIcon = (typeText: string) => {
  const normalized = (typeText || '').toLowerCase().trim();
  if (normalized.includes('apartamento') || normalized.includes('apto') || normalized.includes('sala') || normalized.includes('comercial')) {
    return <Building className="h-3 w-3 text-[#10B981] shrink-0" />;
  }
  if (normalized.includes('terreno') || normalized.includes('lote') || normalized.includes('área') || normalized.includes('area')) {
    return <Globe className="h-3 w-3 text-[#10B981] shrink-0" />;
  }
  return <Home className="h-3 w-3 text-[#10B981] shrink-0" />;
};

const calculateRiskLevel = (item: ImovelLot) => {
  let score = 0;
  const factors: { text: string; points: number; isGood: boolean }[] = [];

  // 1. Ocupação (Occupancy)
  const occupancy = item.occupancyStatus?.toLowerCase() || '';
  if (occupancy === 'ocupado') {
    score += 35;
    factors.push({ text: 'Imóvel Ocupado (demanda imissão judicial de posse)', points: 35, isGood: false });
  } else if (occupancy === 'verificar' || !occupancy) {
    score += 20;
    factors.push({ text: 'Status de Ocupação a verificar (incerteza operacional)', points: 20, isGood: false });
  } else {
    factors.push({ text: 'Imóvel Desocupado (posse rápida garantida)', points: 0, isGood: true });
  }

  // 2. Dívidas & Custos extras (Debts & Costs)
  const debts = (item.iptu || 0) + (item.condominium || 0);
  const extraCosts = debts + (item.reforma || 0) + (item.desocupacao || 0);
  const ratio = item.marketValue > 0 ? (extraCosts / item.marketValue) : 0;

  if (ratio > 0.20) {
    score += 40;
    factors.push({ text: `Custos adicionais elevados (${formatPercentBR(ratio * 100)}% do valor de mercado)`, points: 40, isGood: false });
  } else if (ratio > 0.05) {
    score += 20;
    factors.push({ text: `Custos adicionais moderados (${formatPercentBR(ratio * 100)}% do valor de mercado)`, points: 20, isGood: false });
  } else if (extraCosts > 0) {
    score += 10;
    factors.push({ text: `Custos adicionais sob controle (${formatPercentBR(ratio * 100)}% do valor de mercado)`, points: 10, isGood: false });
  } else {
    factors.push({ text: 'Sem pendências financeiras ou custos de reforma informados', points: 0, isGood: true });
  }

  // 3. Matrícula e Registro (Registration check)
  if (!item.registration || !item.registration.trim()) {
    score += 15;
    factors.push({ text: 'Matrícula ausente (risco de entraves no cartório de registro)', points: 15, isGood: false });
  } else {
    factors.push({ text: `Matrícula informada nº ${item.registration} (documentação estruturada)`, points: 0, isGood: true });
  }

  // 4. Tipo de Leilão e Categoria de Risco (Type / Category / Location)
  const isHighRiskType = 
    item.typeText?.toLowerCase().includes('rural') || 
    item.typeText?.toLowerCase().includes('chácara') || 
    item.typeText?.toLowerCase().includes('terreno') ||
    item.location?.toLowerCase().includes('rural') || 
    item.location?.toLowerCase().includes('invadido');
  
  if (isHighRiskType) {
    score += 20;
    factors.push({ text: 'Localização/Tipo complexo (rural, terreno ou invadido)', points: 20, isGood: false });
  }

  if (item.category === 'Não Indicado') {
    score += 15;
    factors.push({ text: 'Viabilidade fora da recomendação ideal (Regra de 60%)', points: 15, isGood: false });
  } else {
    factors.push({ text: 'Lance seguro dentro da recomendação ideal (Regra de 60%)', points: 0, isGood: true });
  }

  // Constrain
  const finalScore = Math.min(100, score);
  
  let label = 'Baixo';
  let color = 'text-[#10B981]';
  let bgColor = 'bg-emerald-500/10 border-emerald-500/25 text-[#10B981]';
  let barColor = 'bg-[#10B981]';
  let scoreColor = 'text-emerald-400';
  
  if (finalScore > 60) {
    label = 'Alto';
    color = 'text-rose-400';
    bgColor = 'bg-rose-500/10 border-rose-500/25 text-rose-400';
    barColor = 'bg-rose-500';
    scoreColor = 'text-rose-400';
  } else if (finalScore > 30) {
    label = 'Médio';
    color = 'text-amber-400';
    bgColor = 'bg-amber-500/10 border-amber-500/25 text-amber-400';
    barColor = 'bg-amber-500';
    scoreColor = 'text-amber-400';
  }

  return {
    score: finalScore,
    label,
    color,
    bgColor,
    barColor,
    scoreColor,
    factors
  };
};

const calculateMarketLiquidity = (item: ImovelLot) => {
  const type = (item.typeText || '').toLowerCase();
  const location = (item.location || '').toLowerCase();

  let score = 50; // default base score
  let baseDaysMin = 90;
  let baseDaysMax = 180;
  let level = 'Média';
  let color = 'text-amber-400';
  let bgColor = 'bg-amber-500/10 border-amber-500/25 text-amber-400';
  let barColor = 'bg-amber-500';

  const analysis: string[] = [];

  // 1. Analyze Property Type
  if (type.includes('apartamento') || type.includes('apto') || type.includes('flat') || type.includes('studio')) {
    score += 25;
    baseDaysMin = 60;
    baseDaysMax = 120;
    analysis.push('Apartamento: Tipo de imóvel com maior giro de mercado e facilidade de financiamento bancário pós-venda.');
  } else if (type.includes('casa') || type.includes('sobrado') || type.includes('residência')) {
    score += 10;
    baseDaysMin = 90;
    baseDaysMax = 180;
    analysis.push('Casa: Demanda constante de famílias, embora o tempo de maturação de venda seja ligeiramente superior a apartamentos.');
  } else if (type.includes('terreno') || type.includes('lote')) {
    score -= 15;
    baseDaysMin = 240;
    baseDaysMax = 450;
    analysis.push('Terreno/Lote: Ativo de menor liquidez imediata. Exige compradores específicos ou incorporadores.');
  } else if (type.includes('comercial') || type.includes('sala') || type.includes('loja') || type.includes('galpão') || type.includes('pavilhão')) {
    score -= 5;
    baseDaysMin = 180;
    baseDaysMax = 360;
    analysis.push('Comercial: Liquidez vinculada ao cenário econômico local e atratividade para locação.');
  } else if (type.includes('chácara') || type.includes('sítio') || type.includes('rural') || type.includes('fazenda')) {
    score -= 25;
    baseDaysMin = 360;
    baseDaysMax = 720;
    analysis.push('Área Rural/Chácara: Segmento de nicho com baixa liquidez comparativa e prazo de venda estendido.');
  } else {
    analysis.push('Tipo de Imóvel Geral: Liquidez moderada com base nos padrões do mercado de leilões.');
  }

  // 2. Analyze Location (e.g. Major Hubs in RS)
  const isMetropolitan = 
    location.includes('porto alegre') || 
    location.includes('caxias do sul') || 
    location.includes('canoas') || 
    location.includes('pelotas') || 
    location.includes('santa maria') || 
    location.includes('novo hamburgo') || 
    location.includes('gravataí') || 
    location.includes('viamão') || 
    location.includes('são leopoldo') || 
    location.includes('passo fundo') || 
    location.includes('rio grande') || 
    location.includes('bento gonçalves') ||
    location.includes('capital') ||
    location.includes('centro');

  if (isMetropolitan) {
    score += 15;
    // Boost days by ~25% quicker
    baseDaysMin = Math.round(baseDaysMin * 0.75);
    baseDaysMax = Math.round(baseDaysMax * 0.75);
    analysis.push('Zonas Metropolitanas/Grandes Polos: Alta densidade demográfica acelera o tempo de exposição e venda.');
  } else {
    score -= 10;
    // Slower by ~30%
    baseDaysMin = Math.round(baseDaysMin * 1.3);
    baseDaysMax = Math.round(baseDaysMax * 1.3);
    analysis.push('Cidades do Interior / Zonas Menos Densas: Menor volume diário de compradores ativos alonga o prazo de revenda.');
  }

  // 3. Area check
  const areaValue = parseFloat((item.area || '').replace(/[^\d]/g, ''));
  if (!isNaN(areaValue)) {
    if (areaValue > 250) {
      score -= 5;
      baseDaysMin = Math.round(baseDaysMin * 1.15);
      baseDaysMax = Math.round(baseDaysMax * 1.15);
      analysis.push('Metragem Ampla: Imóveis muito grandes possuem tíquete de venda mais alto, o que restringe o público.');
    } else if (areaValue >= 45 && areaValue <= 120) {
      score += 10;
      baseDaysMin = Math.round(baseDaysMin * 0.9);
      baseDaysMax = Math.round(baseDaysMax * 0.9);
      analysis.push('Planta Compacta/Média (45m² a 120m²): Metragem preferida para moradia rápida e alta velocidade de venda.');
    }
  }

  // Final score constraints
  const finalScore = Math.max(10, Math.min(98, score));

  if (finalScore >= 75) {
    level = 'Altíssima';
    color = 'text-emerald-400';
    bgColor = 'bg-emerald-500/10 border-emerald-500/25 text-emerald-400';
    barColor = 'bg-emerald-500';
  } else if (finalScore >= 55) {
    level = 'Alta';
    color = 'text-teal-400';
    bgColor = 'bg-teal-500/10 border-teal-500/25 text-teal-400';
    barColor = 'bg-teal-500';
  } else if (finalScore >= 35) {
    level = 'Média';
    color = 'text-amber-400';
    bgColor = 'bg-amber-500/10 border-amber-500/25 text-amber-400';
    barColor = 'bg-amber-500';
  } else {
    level = 'Baixa';
    color = 'text-rose-400';
    bgColor = 'bg-rose-500/10 border-rose-500/25 text-rose-400';
    barColor = 'bg-rose-500';
  }

  // Convert days to months representation for human display
  const monthsMin = Math.max(1, Math.round(baseDaysMin / 30));
  const monthsMax = Math.max(2, Math.round(baseDaysMax / 30));
  
  let prazoTexto = `${monthsMin} a ${monthsMax} meses`;
  if (monthsMin === monthsMax) {
    prazoTexto = `${monthsMin} meses`;
  } else if (monthsMin > 12) {
    const yearsMin = (monthsMin / 12).toFixed(1).replace('.0', '');
    const yearsMax = (monthsMax / 12).toFixed(1).replace('.0', '');
    prazoTexto = `${yearsMin} a ${yearsMax} anos`;
  }

  return {
    score: finalScore,
    level,
    color,
    bgColor,
    barColor,
    prazoTexto,
    analysis
  };
};

const calculateEstimatedProfit = (item: ImovelLot) => {
  const commission = item.commission !== undefined ? item.commission : 5;
  const commissionVal = item.suggestedBid * (commission / 100);
  const iptuVal = item.iptu || 0;
  const condominiumVal = item.condominium || 0;
  const registroVal = item.registro || 0;
  const itbiVal = item.itbi || 0;
  const tabelionatoVal = item.tabelionato || 0;
  const corretagemPercent = item.corretagem !== undefined ? item.corretagem : 0;
  const saleValue = item.saleValue !== undefined ? item.saleValue : item.marketValue;
  const corretagemVal = saleValue * (corretagemPercent / 100);
  const reformaVal = item.reforma || 0;
  const desocupacaoVal = item.desocupacao || 0;
  const parcelaEmprestimoVal = item.parcela_emprestimo || 0;
  const quitacaoEmprestimoVal = item.quitacao_emprestimo || 0;
  const customExpensesSum = (item.customExpenses || []).reduce((acc, curr) => acc + (curr.value || 0), 0);

  // Despesas que ocorrem no início ou durante o período de carregamento (holding)
  const upfrontCosts = item.suggestedBid + commissionVal + iptuVal + condominiumVal + registroVal + itbiVal + tabelionatoVal + reformaVal + desocupacaoVal + parcelaEmprestimoVal + customExpensesSum;
  const emprestimoVal = item.emprestimo || 0;

  // Capital próprio aportado inicial/durante holding
  const capitalProprio = Math.max(0, upfrontCosts - emprestimoVal);

  // Recursos de terceiros efetivamente usados para despesas iniciais
  const recursosTerceiros = Math.min(upfrontCosts, emprestimoVal);

  // Sobra de Empréstimo no D+0 (quando o valor financiado supera os custos de aquisição/iniciais)
  const loanSurplus = emprestimoVal > upfrontCosts ? emprestimoVal - upfrontCosts : 0;
  const totalInflows = saleValue + emprestimoVal;
  const totalOutflows = upfrontCosts + quitacaoEmprestimoVal + corretagemVal;

  // Custo Total de Desembolso de Caixa (Investimento de bolso total ao longo do projeto)
  const totalInvestment = upfrontCosts - emprestimoVal + quitacaoEmprestimoVal + corretagemVal;

  // Resultado da Venda (Venda - Corretagem - Quitação do Empréstimo)
  const netSaleResult = saleValue - corretagemVal - quitacaoEmprestimoVal;

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

    const startDate = parseDateStr(item.paymentDate_bid) || parseDateStr(item.auctionDate) || new Date();
    const endDate = parseDateStr(item.paymentDate_sale);

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

  // ROI Total e Mensal Composto sobre Capital Próprio + Recursos de Terceiros Investidos na Aquisição e Custos (upfrontCosts)
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

  // ROI s/ Capital Próprio aportado Total e Mensal Composto
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
  const effectiveRoi = (emprestimoVal > 0 && isFinite(roiCapitalProprio)) ? roiCapitalProprio : roiPercent;
  let tirMonthly = 0;
  if (effectiveRoi > -100 && monthsCount > 0) {
    const ratio = 1 + effectiveRoi / 100;
    if (ratio > 0) {
      tirMonthly = (Math.pow(ratio, 1 / monthsCount) - 1) * 100;
    }
  }
  const tirAnnual = (Math.pow(1 + tirMonthly / 100, 12) - 1) * 100;
  const tirTotal = (Math.pow(1 + tirMonthly / 100, monthsCount) - 1) * 100;

  return {
    netProfit,
    roiPercent,
    roiMonthly,
    roiCapitalProprio,
    roiCapitalProprioMonthly,
    profitMarginTotal,
    profitMarginMonthly,
    tirMonthly,
    tirAnnual,
    tirTotal,
    totalInvestment,
    capitalProprio,
    totalOutflows,
    totalInflows,
    loanSurplus,
    recursosTerceiros,
    saleValue,
    monthsCount
  };
};

interface LotesImovelProps {
  properties: ImovelLot[];
  setProperties: React.Dispatch<React.SetStateAction<ImovelLot[]>>;
  portals?: AuctionPortal[];
  availablePortals?: string[];
  currentUser?: AppUser | null;
  users?: AppUser[];
}

export default function LotesImovel({ properties, setProperties, portals = [], availablePortals = [], currentUser, users = [] }: LotesImovelProps) {
  const isAdmin = currentUser?.role === 'admin';
  const isIntelitzAdmin = currentUser?.role === 'admin' || currentUser?.username === 'admin' || currentUser?.id === 'usr-admin';

  // Selected property for active consultation
  const [selectedId, setSelectedId] = useState<string>('');
  const [participationPercent, setParticipationPercent] = useState<number>(100);
  const [isParticipationDropdownOpen, setIsParticipationDropdownOpen] = useState(false);
  const [isUserDropdownOpen, setIsUserDropdownOpen] = useState(false);
  const [isMainUserFilterOpen, setIsMainUserFilterOpen] = useState(false);
  const [filterUserId, setFilterUserId] = useState<string>('all');
  const [isRiskExpanded, setIsRiskExpanded] = useState(false);
  const [isLiquidityExpanded, setIsLiquidityExpanded] = useState(false);
  const [isSpecsExpanded, setIsSpecsExpanded] = useState(false);
  const [isPortalExpanded, setIsPortalExpanded] = useState(true);
  const [isNotesExpanded, setIsNotesExpanded] = useState(false);
  const [isPricingExpanded, setIsPricingExpanded] = useState(false);
  const [isChartExpanded, setIsChartExpanded] = useState(false);
  const [isTimelineExpanded, setIsTimelineExpanded] = useState(false);
  const [showAddCostSelector, setShowAddCostSelector] = useState<boolean>(false);
  const [customCostName, setCustomCostName] = useState<string>('');
  const [isCustomCostSelected, setIsCustomCostSelected] = useState<boolean>(false);
  const [isEditingNotes, setIsEditingNotes] = useState(false);
  const [analyzedLot, setAnalyzedLot] = useState<ImovelLot | null>(null);
  const [showDetails, setShowDetails] = useState(false);
  const [isNotesOpen, setIsNotesOpen] = useState(false);
  const [tempNotes, setTempNotes] = useState('');

  // Filter out Intelitz Admin from assignable user lists (Intelitz admin always has access to all lots)
  const assignableUsers = users.filter(u => u.id !== 'usr-admin' && u.username !== 'admin');

  // Helpers for user assignment to lots
  const isAllUsersAssigned = (assignedUserIds?: string[], usersList: AppUser[] = assignableUsers) => {
    if (!assignedUserIds || assignedUserIds.includes('all')) {
      return true;
    }
    if (assignedUserIds.includes('none')) {
      return false;
    }
    if (usersList.length > 0 && usersList.every(u => assignedUserIds.includes(u.id))) {
      return true;
    }
    return false;
  };

  const isUserAssigned = (assignedUserIds: string[] | undefined, userId: string, usersList: AppUser[] = assignableUsers) => {
    if (!assignedUserIds || assignedUserIds.includes('all')) {
      return true;
    }
    if (assignedUserIds.includes('none')) {
      return false;
    }
    return assignedUserIds.includes(userId);
  };

  const getAssignedUsersLabel = (assignedUserIds: string[] | undefined, usersList: AppUser[] = assignableUsers) => {
    if (isAllUsersAssigned(assignedUserIds, usersList)) {
      return 'Todos';
    }
    const assigned = (assignedUserIds || []).filter(id => id !== 'none' && id !== 'all');
    if (assigned.length === 0) {
      return 'Intelitz';
    }
    if (assigned.length === 1) {
      const foundUser = usersList.find(u => u.id === assigned[0]);
      return foundUser ? (foundUser.name ? foundUser.name.split(' ')[0] : foundUser.username) : '1 Usuário';
    }
    return `${assigned.length} Usuários`;
  };

  const updatePropertyAssignedUsers = (propertyId: string, newAssignedUserIds: string[]) => {
    setProperties(prev => prev.map(p => {
      if (p.id === propertyId) {
        return { ...p, assignedUserIds: newAssignedUserIds };
      }
      return p;
    }));
  };

  const toggleUserAssignment = (propertyId: string, userId: string, currentAssignedIds: string[] | undefined, usersList: AppUser[] = assignableUsers) => {
    const allIds = usersList.map(u => u.id);
    let updated: string[] = [];

    if (isAllUsersAssigned(currentAssignedIds, usersList)) {
      updated = allIds.filter(id => id !== userId);
    } else {
      const current = (currentAssignedIds || []).filter(id => id !== 'none' && id !== 'all');
      if (current.includes(userId)) {
        updated = current.filter(id => id !== userId);
      } else {
        updated = [...current, userId];
      }
      if (usersList.length > 0 && usersList.every(u => updated.includes(u.id))) {
        updated = ['all'];
      }
    }

    if (updated.length === 0) {
      updated = ['none'];
    }

    updatePropertyAssignedUsers(propertyId, updated);
  };

  // States for Quick Edit inside cards
  const [editingCardField, setEditingCardField] = useState<{ id: string; field: string } | null>(null);
  const [editCardValue, setEditCardValue] = useState<string>('');

  const handleQuickEditCardSave = (id: string, field: string, valueStr: string) => {
    // Custom expense date field
    if (field.startsWith('custom_expense_date_')) {
      const expenseId = field.replace('custom_expense_date_', '');
      const dateVal = valueStr.trim();
      const updater = (prev: ImovelLot | null) => {
        if (!prev) return null;
        const customExpenses = (prev.customExpenses || []).map(exp => 
          exp.id === expenseId ? { ...exp, paymentDate: dateVal } : exp
        );
        return { ...prev, customExpenses };
      };
      if (analyzedLot && id === analyzedLot.id) {
        setAnalyzedLot(updater);
      }
      setProperties(prev => prev.map(item => item.id === id ? updater(item)! : item));
      setEditingCardField(null);
      return;
    }

    // Custom expense value field
    if (field.startsWith('custom_expense_value_')) {
      const expenseId = field.replace('custom_expense_value_', '');
      const clean = valueStr.trim().replace(/\./g, '').replace(',', '.').replace(/[^\d.]/g, '');
      const numValue = parseFloat(clean);
      if (isNaN(numValue) || numValue < 0) {
        setEditingCardField(null);
        return;
      }
      const updater = (prev: ImovelLot | null) => {
        if (!prev) return null;
        const customExpenses = (prev.customExpenses || []).map(exp => 
          exp.id === expenseId ? { ...exp, value: numValue } : exp
        );
        return { ...prev, customExpenses };
      };
      if (analyzedLot && id === analyzedLot.id) {
        setAnalyzedLot(updater);
      }
      setProperties(prev => prev.map(item => item.id === id ? updater(item)! : item));
      setEditingCardField(null);
      return;
    }

    // If it is a string-based payment date field
    if (field.startsWith('paymentDate_')) {
      const dateVal = valueStr.trim();
      if (analyzedLot && id === analyzedLot.id) {
        setAnalyzedLot(prev => prev ? { ...prev, [field]: dateVal } : null);
      }
      setProperties(prev => prev.map(item => item.id === id ? { ...item, [field]: dateVal } : item));
      setEditingCardField(null);
      return;
    }

    // Basic cleaning of BRL notation
    const clean = valueStr.trim().replace(/\./g, '').replace(',', '.').replace(/[^\d.]/g, '');
    const numValue = parseFloat(clean);
    if (isNaN(numValue) || numValue < 0) {
      setEditingCardField(null);
      return;
    }

    if (analyzedLot && id === analyzedLot.id) {
      setAnalyzedLot(prev => {
        if (!prev) return null;
        const updatedItem = { ...prev, [field]: numValue };
        if (field === 'marketValue') {
          const commission = prev.commission !== undefined ? prev.commission : 5;
          const divisor = 1 + (commission / 100) + 0.03;
          updatedItem.suggestedBid = Math.max(0, Math.floor((0.60 * numValue - 5000) / divisor));
        }
        const finalMarket = updatedItem.marketValue;
        const finalBid = updatedItem.suggestedBid;
        updatedItem.executiveSummary = `Calculado sob a Regra de 60% do valor de mercado estimado em R$ ${finalMarket.toLocaleString('pt-BR')}: Sugerido lance máximo de R$ ${finalBid.toLocaleString('pt-BR')} para obter margem financeira robusta.`;
        return updatedItem;
      });
    }

    setProperties(prev => {
      const updated = prev.map(item => {
        if (item.id === id) {
          const updatedItem = { ...item, [field]: numValue };

          // Recalculate suggested bid if marketValue changed
          if (field === 'marketValue') {
            const commission = item.commission !== undefined ? item.commission : 5;
            const divisor = 1 + (commission / 100) + 0.03;
            updatedItem.suggestedBid = Math.max(0, Math.floor((0.60 * numValue - 5000) / divisor));
          }

          // Update its executive summary
          const finalMarket = updatedItem.marketValue;
          const finalBid = updatedItem.suggestedBid;
          updatedItem.executiveSummary = `Calculado sob a Regra de 60% do valor de mercado estimado em R$ ${finalMarket.toLocaleString('pt-BR')}: Sugerido lance máximo de R$ ${finalBid.toLocaleString('pt-BR')} para obter margem financeira robusta.`;

          return updatedItem;
        }
        return item;
      });
      return updated;
    });

    setEditingCardField(null);
  };

  const handleRemoveCostItem = (field: string) => {
    if (field.startsWith('custom_expense_value_')) {
      const expenseId = field.replace('custom_expense_value_', '');
      const updater = (prev: ImovelLot | null) => {
        if (!prev) return null;
        return {
          ...prev,
          customExpenses: (prev.customExpenses || []).filter(exp => exp.id !== expenseId)
        };
      };
      if (analyzedLot && selectedId === analyzedLot.id) {
        setAnalyzedLot(updater);
      }
      setProperties(prev => prev.map(item => item.id === selectedId ? updater(item)! : item));
    } else {
      const dateField = `paymentDate_${field}`;
      if (analyzedLot && selectedId === analyzedLot.id) {
        setAnalyzedLot(prev => prev ? { ...prev, [field]: 0, [dateField]: '' } : null);
      }
      setProperties(prev => prev.map(item => item.id === selectedId ? { ...item, [field]: 0, [dateField]: '' } : item));
    }
  };

  const handleSaveNotes = (newNotes: string) => {
    if (analyzedLot && selectedId === analyzedLot.id) {
      setAnalyzedLot(prev => prev ? { ...prev, notes: newNotes } : null);
    } else {
      setProperties(prev => prev.map(p => p.id === selectedProperty.id ? { ...p, notes: newNotes } : p));
    }
    setIsEditingNotes(false);
  };

  const handleToggleArrematado = (value: 'Sim' | 'Não') => {
    if (analyzedLot && selectedId === analyzedLot.id) {
      setAnalyzedLot(prev => prev ? { ...prev, arrematado: value } : null);
    } else {
      setProperties(prev => prev.map(p => p.id === selectedProperty.id ? { ...p, arrematado: value } : p));
    }
  };

  const selectedProperty = 
    (analyzedLot && selectedId === analyzedLot.id)
      ? analyzedLot
      : (properties.find(p => p.id === selectedId) || properties[0] || {
          id: '',
          typeText: 'Nenhum Lote',
          location: '-',
          area: '-',
          marketValue: 0,
          suggestedBid: 0,
          liquidity: '-',
          category: 'Não Indicado',
          occupancyStatus: 'Ocupado',
          riskAnalysis: 'Sem lote selecionado.',
          executiveSummary: 'Sem lote selecionado.'
        } as ImovelLot);

  // Set initial selectedId if list is populated and no selectedId set
  useEffect(() => {
    if (properties.length > 0 && !selectedId) {
      setSelectedId(properties[0].id);
    }
  }, [properties]);

  // Synchronize tempNotes when selectedProperty changes
  useEffect(() => {
    if (selectedProperty) {
      setTempNotes(selectedProperty.notes || '');
      setIsRiskExpanded(false);
      setIsLiquidityExpanded(false);
      setIsSpecsExpanded(false);
      setIsPortalExpanded(false);
      setIsNotesExpanded(false);
      setIsPricingExpanded(false);
      setIsChartExpanded(false);
      setIsEditingNotes(false);
    }
  }, [selectedId, selectedProperty.notes]);

  // Search and filter states
  const [search, setSearch] = useState<string>('');
  const [filterCategory, setFilterCategory] = useState<'Todos' | 'Prioritários' | 'Não Indicados'>('Todos');
  const [showFilters, setShowFilters] = useState<boolean>(false);
  const [showSearch, setShowSearch] = useState<boolean>(false);
  
  // Input states for registering a new lot
  const [newTypeText, setNewTypeText] = useState('Apartamento');
  const [newStreet, setNewStreet] = useState('');
  const [newNumber, setNewNumber] = useState('');
  const [newComplement, setNewComplement] = useState('');
  const [newNeighborhood, setNewNeighborhood] = useState('');
  const [newState, setNewState] = useState('RS');
  const [newCity, setNewCity] = useState('Porto Alegre');

  // Dynamic list of RS cities from IBGE (Portuguese locale alphabetical order)
  const [citiesList, setCitiesList] = useState<string[]>(() => {
    const fallback = [...(BRAZIL_CITIES['RS'] || [])];
    fallback.sort((a, b) => a.localeCompare(b, 'pt-BR'));
    return fallback;
  });

  useEffect(() => {
    let active = true;
    fetch('https://servicodados.ibge.gov.br/api/v1/localidades/estados/RS/municipios')
      .then(res => res.json())
      .then((data: any[]) => {
        if (!active) return;
        if (data && Array.isArray(data) && data.length > 0) {
          const names = data.map(m => m.nome);
          names.sort((a, b) => a.localeCompare(b, 'pt-BR'));
          setCitiesList(names);
        }
      })
      .catch(err => {
        console.error('Erro ao buscar cidades do IBGE, usando fallback local:', err);
      });
    return () => {
      active = false;
    };
  }, []);

  const portalsList = Array.from(new Set(portals.map(p => p.name)));

  const [newPortalName, setNewPortalName] = useState(portalsList[0] || '');
  const [newAuctionDate, setNewAuctionDate] = useState('');
  const [newBedrooms, setNewBedrooms] = useState<number>(2);
  const [newGarage, setNewGarage] = useState<'Não possui' | 'Box' | 'Rotativo'>('Box');
  const [newRegistration, setNewRegistration] = useState('');
  const [newZone, setNewZone] = useState('');
  const [newCommission, setNewCommission] = useState<number>(5);
  const [newIptu, setNewIptu] = useState('');
  const [newCondominium, setNewCondominium] = useState('');
  const [newRegistro, setNewRegistro] = useState('');
  const [newItbi, setNewItbi] = useState('');
  const [newTabelionato, setNewTabelionato] = useState('');
  const [newCorretagem, setNewCorretagem] = useState<number>(0);
  const [newReforma, setNewReforma] = useState('');
  const [newDesocupacao, setNewDesocupacao] = useState('');

  // Sync portal names when portalsList changes
  useEffect(() => {
    if (portalsList.length > 0 && !portalsList.includes(newPortalName)) {
      setNewPortalName(portalsList[0]);
    }
  }, [portals, portalsList, newPortalName]);

  const [newArea, setNewArea] = useState('');
  const [newMarketValue, setNewMarketValue] = useState('');
  const [newCurrentBid, setNewCurrentBid] = useState('');
  const [newLiquidity, setNewLiquidity] = useState('Média');
  const [newSuggestedBid, setNewSuggestedBid] = useState('');
  const [newOccupancyStatus, setNewOccupancyStatus] = useState('Verificar');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isAnalyzeModalOpen, setIsAnalyzeModalOpen] = useState(false);

  // Listen to custom events to trigger modal, search, and filters
  useEffect(() => {
    const handleOpenModal = () => {
      if (isAdmin) {
        setIsAnalyzeModalOpen(true);
      }
    };
    const handleToggleSearch = () => {
      setShowSearch(prev => !prev);
    };
    const handleToggleFilters = () => {
      setShowFilters(prev => !prev);
    };
    window.addEventListener('open-analyze-imovel-modal', handleOpenModal);
    window.addEventListener('toggle-imovel-search', handleToggleSearch);
    window.addEventListener('toggle-imovel-filters', handleToggleFilters);
    return () => {
      window.removeEventListener('open-analyze-imovel-modal', handleOpenModal);
      window.removeEventListener('toggle-imovel-search', handleToggleSearch);
      window.removeEventListener('toggle-imovel-filters', handleToggleFilters);
    };
  }, []);

  // Custom non-blocking modal confirmation & toast states
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [clearAllConfirm, setClearAllConfirm] = useState<boolean>(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'info' | 'error' } | null>(null);

  // States for Editing a Lot
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingLot, setEditingLot] = useState<ImovelLot | null>(null);
  const [editTypeText, setEditTypeText] = useState('Apartamento');
  const [editStreet, setEditStreet] = useState('');
  const [editNumber, setEditNumber] = useState('');
  const [editComplement, setEditComplement] = useState('');
  const [editNeighborhood, setEditNeighborhood] = useState('');
  const [editState, setEditState] = useState('RS');
  const [editCity, setEditCity] = useState('Porto Alegre');
  const [editArea, setEditArea] = useState('');
  const [editMarketValue, setEditMarketValue] = useState('');
  const [editSuggestedBid, setEditSuggestedBid] = useState('');
  const [editLiquidity, setEditLiquidity] = useState<string>('Média');
  const [editPortalName, setEditPortalName] = useState('Pestana Leilões');
  const [editAuctionDate, setEditAuctionDate] = useState('');
  const [editBedrooms, setEditBedrooms] = useState<number>(2);
  const [editGarage, setEditGarage] = useState<'Não possui' | 'Box' | 'Rotativo'>('Box');
  const [editRegistration, setEditRegistration] = useState('');
  const [editZone, setEditZone] = useState('');
  const [editCategory, setEditCategory] = useState<'Prioritário' | 'Não Indicado'>('Prioritário');
  const [editOccupancyStatus, setEditOccupancyStatus] = useState<string>('Ocupado');
  const [editCommission, setEditCommission] = useState<number>(5);
  const [editIptu, setEditIptu] = useState('');
  const [editCondominium, setEditCondominium] = useState('');
  const [editRegistro, setEditRegistro] = useState('');
  const [editItbi, setEditItbi] = useState('');
  const [editTabelionato, setEditTabelionato] = useState('');
  const [editCorretagem, setEditCorretagem] = useState<number>(0);
  const [editReforma, setEditReforma] = useState('');
  const [editDesocupacao, setEditDesocupacao] = useState('');
  const [editCitiesList, setEditCitiesList] = useState<string[]>([]);

  useEffect(() => {
    if (editState === 'RS') {
      setEditCitiesList(citiesList);
    } else {
      const list = [...(BRAZIL_CITIES[editState as keyof typeof BRAZIL_CITIES] || [])];
      list.sort((a, b) => a.localeCompare(b, 'pt-BR'));
      setEditCitiesList(list);
    }
  }, [editState, citiesList]);

  // Auto-dismiss toast
  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 4500);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  // Chat/QA Console state
  const [chatInput, setChatInput] = useState('');
  const [chatMessages, setChatMessages] = useState<{ id: string; role: 'user' | 'assistant'; content: string; timestamp: string }[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content: 'Olá! Sou seu Consultor Especialista em Leilões de Imóveis. Selecione um dos lotes ao lado ou envie um novo imóvel para realizarmos a análise completa de viabilidade, desocupação, liquidez de revenda e riscos jurídicos.',
      timestamp: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
    }
  ]);
  const [isChatLoading, setIsChatLoading] = useState(false);

  // Handle selected property changes (updates assistant welcoming message context)
  useEffect(() => {
    if (selectedProperty && selectedProperty.id) {
      setChatMessages([
        {
          id: `welcome-${selectedProperty.id}`,
          role: 'assistant',
          content: `Análise ativa para o lote: **${selectedProperty.typeText} em ${selectedProperty.location}**
          
**1. Regra do Teto (60% da Avaliação):**
- Valor Estimado de Mercado: ${formatBRL(selectedProperty.marketValue)}
- Lance Máximo Sugerido: **${formatBRL(selectedProperty.suggestedBid)}**
- *Cálculo:* Lance sugerido de modo que (Lance + 5% Comissão + 3% ITBI + R$ 5.000 despesas de posse/dívidas) não passe de 60% do valor de mercado para assegurar margem de revenda expressiva.
 
**2. Informações Gerais:**
- Portal / Leiloeiro: **${selectedProperty.portalName || 'Não Informado'}**
- Dormitórios: **${selectedProperty.bedrooms ? `${selectedProperty.bedrooms} ${selectedProperty.bedrooms === 1 ? 'Dormitório' : 'Dormitórios'}` : 'Não Informado'}**
- Garagem: **${selectedProperty.garage || 'Não Informado'}**
- Classificação de Risco: **${selectedProperty.category === 'Prioritário' ? '🟢 Prioritário (Recomendado)' : '🔴 Não Indicado (Alto Risco)'}**
- Probabilidade de Ocupação: **${selectedProperty.occupancyStatus}**
  
**3. Parecer Jurídico & Desocupação:**
- Área: ${selectedProperty.area}
- ${selectedProperty.riskAnalysis || 'Sem observações adicionais.'}
  
*Deseja saber como funciona o mandado de imissão na posse, prazos judiciais comuns ou negociação de desocupação amigável? Pode perguntar!*`,
          timestamp: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
        }
      ]);
    }
  }, [selectedId, selectedProperty.id]);

  const formatBRL = (val: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(val);
  };

  const formatDateBR = (dateStr?: string) => {
    if (!dateStr) return 'Definir data';
    const parts = dateStr.split('-');
    if (parts.length === 3) {
      return `${parts[2]}/${parts[1]}/${parts[0]}`;
    }
    return dateStr;
  };

  const parseDateString = (dateStr?: string): Date => {
    if (!dateStr) return new Date();
    const matchYMD = dateStr.match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (matchYMD) {
      return new Date(parseInt(matchYMD[1], 10), parseInt(matchYMD[2], 10) - 1, parseInt(matchYMD[3], 10));
    }
    const matchDMY = dateStr.match(/^(\d{2})\/(\d{2})\/(\d{4})/);
    if (matchDMY) {
      return new Date(parseInt(matchDMY[3], 10), parseInt(matchDMY[2], 10) - 1, parseInt(matchDMY[1], 10));
    }
    const d = new Date(dateStr);
    return isNaN(d.getTime()) ? new Date() : d;
  };

  const getTransactionDate = (field: string, daysOffset: number, prop: ImovelLot): Date => {
    let customDateStr: string | undefined;
    if (field.startsWith('custom_expense_date_')) {
      const expenseId = field.replace('custom_expense_date_', '');
      const exp = (prop.customExpenses || []).find(e => e.id === expenseId);
      customDateStr = exp?.paymentDate;
    } else {
      customDateStr = prop[field as keyof ImovelLot] as string | undefined;
    }
    if (customDateStr) {
      return parseDateString(customDateStr);
    }
    let baseDate = new Date();
    if (prop.auctionDate) {
      baseDate = parseDateString(prop.auctionDate);
    }
    const result = new Date(baseDate);
    result.setDate(result.getDate() + daysOffset);
    return result;
  };

  const calculateDefaultDateStr = (daysOffset: number, prop: ImovelLot): string => {
    let baseDate = new Date();
    if (prop.auctionDate) {
      baseDate = parseDateString(prop.auctionDate);
    }
    const result = new Date(baseDate);
    result.setDate(result.getDate() + daysOffset);
    const yyyy = result.getFullYear();
    const mm = String(result.getMonth() + 1).padStart(2, '0');
    const dd = String(result.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  };

  const getSplitLocation = (loc: string) => {
    // Automatically clean up any existing " - Bairro " to just " - " as requested
    let cleanLoc = loc.replace(' - Bairro ', ' - ');
    const lastCommaIndex = cleanLoc.lastIndexOf(',');
    if (lastCommaIndex !== -1) {
      const mainAddress = cleanLoc.substring(0, lastCommaIndex).trim();
      const cityState = cleanLoc.substring(lastCommaIndex + 1).trim();
      return { mainAddress, cityState };
    }
    return { mainAddress: cleanLoc, cityState: '' };
  };

  // Helper to format any number or numeric string to the standard 0.000,00 format
  const formatValueToBrazilian = (val: number | string | undefined | null): string => {
    if (val === undefined || val === null || val === '-') return '';
    if (typeof val === 'number') {
      return new Intl.NumberFormat('pt-BR', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      }).format(val);
    }
    // Remove "m²" or other non-numeric text, keeping digits, dots, and commas
    const cleaned = val.replace(/[^\d.,]/g, '');
    if (!cleaned) return '';
    
    if (cleaned.includes(',')) {
      const parts = cleaned.split(',');
      const integerPart = parts[0].replace(/\D/g, '');
      const decimalPart = (parts[1] || '').replace(/\D/g, '').padEnd(2, '0').slice(0, 2);
      const parsed = parseFloat(`${integerPart}.${decimalPart}`);
      return isNaN(parsed) ? '' : new Intl.NumberFormat('pt-BR', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      }).format(parsed);
    } else {
      const parsed = parseFloat(cleaned.replace(/\./g, ''));
      return isNaN(parsed) ? '' : new Intl.NumberFormat('pt-BR', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      }).format(parsed);
    }
  };

  // Format input value to 0.000,00 format on-the-fly while typing
  const formatTypingToBrazilian = (valueStr: string): string => {
    const clean = valueStr.replace(/\D/g, '');
    if (!clean) return '';
    const num = parseInt(clean, 10);
    return new Intl.NumberFormat('pt-BR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(num / 100);
  };

  // Parse 0.000,00 format back to standard float number for calculations/saving
  const parseBrazilianDecimalToNumber = (valueStr: string | number | undefined | null): number => {
    if (valueStr === undefined || valueStr === null) return 0;
    if (typeof valueStr === 'number') return valueStr;
    const trimmed = String(valueStr).trim();
    if (!trimmed) return 0;
    // Strip all dots, then replace comma with dot
    const clean = trimmed.replace(/\./g, '').replace(',', '.');
    const num = parseFloat(clean);
    return isNaN(num) ? 0 : num;
  };

  // Run calculation preview on-the-fly (useful for UX input feedback)
  const getSuggestedBidOnFly = (marketValue: string, commissionPercent: number = 5) => {
    const num = parseBrazilianDecimalToNumber(marketValue);
    if (!num) return 0;
    const divisor = 1 + (commissionPercent / 100) + 0.03;
    return Math.max(0, Math.floor((0.60 * num - 5000) / divisor));
  };

  // Submit and include new lot directly (no AI API call)
  const handleAddNewLot = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStreet.trim()) {
      setToast({ message: 'Por favor, preencha o campo de Endereço.', type: 'error' });
      return;
    }
    if (!newNeighborhood.trim()) {
      setToast({ message: 'Por favor, preencha o campo de Bairro.', type: 'error' });
      return;
    }
    if (!newCity) {
      setToast({ message: 'Por favor, selecione uma Cidade.', type: 'error' });
      return;
    }
    if (!newState) {
      setToast({ message: 'Por favor, selecione um Estado.', type: 'error' });
      return;
    }

    const streetStr = newStreet.trim();
    const numberStr = newNumber.trim() ? `, nº ${newNumber.trim()}` : '';
    const complementStr = newComplement.trim() ? `, ${newComplement.trim()}` : '';
    const neighborhoodStr = ` - ${newNeighborhood.trim()}`;
    const cityStateStr = `, ${newCity} - ${newState}`;
    const newLocation = `${streetStr}${numberStr}${complementStr}${neighborhoodStr}${cityStateStr}`;

    const finalMarketValueInput = parseBrazilianDecimalToNumber(newMarketValue);
    const finalAreaInput = newArea ? (newArea.includes('m²') ? newArea : `${newArea} m²`) : 'Não informado';

    setIsSubmitting(true);

    try {
      const finalMarketValue = finalMarketValueInput || 250000;
      const finalSuggestedBid = newSuggestedBid 
        ? parseBrazilianDecimalToNumber(newSuggestedBid) 
        : Math.max(0, Math.floor((0.60 * finalMarketValue - 5000) / (1 + (newCommission / 100) + 0.03)));

      const isHighRisk = newLocation.toLowerCase().includes('área rural') || newLocation.toLowerCase().includes('invadido') || newTypeText.toLowerCase().includes('chácara');

      const newLot: ImovelLot = {
        id: `prop-custom-${Date.now()}`,
        typeText: newTypeText,
        location: newLocation,
        area: finalAreaInput,
        marketValue: finalMarketValue,
        suggestedBid: finalSuggestedBid,
        portalName: newPortalName,
        auctionDate: newAuctionDate,
        bedrooms: newBedrooms,
        garage: newGarage,
        registration: newRegistration.trim() || undefined,
        zone: newZone.trim() || undefined,
        commission: newCommission,
        iptu: newIptu ? parseBrazilianDecimalToNumber(newIptu) : undefined,
        condominium: newCondominium ? parseBrazilianDecimalToNumber(newCondominium) : undefined,
        registro: newRegistro ? parseBrazilianDecimalToNumber(newRegistro) : undefined,
        itbi: newItbi ? parseBrazilianDecimalToNumber(newItbi) : undefined,
        tabelionato: newTabelionato ? parseBrazilianDecimalToNumber(newTabelionato) : undefined,
        corretagem: newCorretagem,
        reforma: newReforma ? parseBrazilianDecimalToNumber(newReforma) : undefined,
        desocupacao: newDesocupacao ? parseBrazilianDecimalToNumber(newDesocupacao) : undefined,
        category: isHighRisk ? 'Não Indicado' : 'Prioritário',
        occupancyStatus: newOccupancyStatus || 'Verificar',
        riskAnalysis: `Imóvel cadastrado manualmente. Recomenda-se verificar a existência de ações judiciais de desocupação ou débitos de IPTU na prefeitura antes do leilão.${newRegistration ? ` Matrícula nº ${newRegistration}.` : ''}${newZone ? ` Zona: ${newZone}.` : ''}`,
        executiveSummary: `Calculado sob a Regra de 60% do valor de mercado estimado em R$ ${finalMarketValue.toLocaleString('pt-BR')}: Sugerido lance máximo de ${formatBRL(finalSuggestedBid)} para obter margem financeira robusta.`,
        isCustom: true
      };

      // Directly add to properties list
      setProperties(prev => [newLot, ...prev]);
      setSelectedId(newLot.id);
      setShowDetails(false);

      // Reset fields
      setNewStreet('');
      setNewNumber('');
      setNewComplement('');
      setNewNeighborhood('');
      setNewState('RS');
      setNewCity('Porto Alegre');
      setNewArea('');
      setNewMarketValue('');
      setNewCurrentBid('');
      setNewPortalName(portalsList[0] || 'Pestana Leilões');
      setNewAuctionDate('');
      setNewBedrooms(2);
      setNewGarage('Box');
      setNewRegistration('');
      setNewZone('');
      setNewCommission(5);
      setNewIptu('');
      setNewCondominium('');
      setNewRegistro('');
      setNewItbi('');
      setNewTabelionato('');
      setNewCorretagem(0);
      setNewReforma('');
      setNewDesocupacao('');
      setNewSuggestedBid('');
      setNewOccupancyStatus('Verificar');

      setToast({
        message: `Lote "${newLot.typeText} em ${newLot.location}" incluído com sucesso!`,
        type: 'success'
      });
    } catch (err: any) {
      console.error("Erro ao incluir imóvel:", err);
      setToast({
        message: `Erro ao incluir o lote: ${err.message}`,
        type: 'error'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Remove custom registered lot
  const handleRemoveLot = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setDeleteConfirmId(id);
  };

  const confirmRemoveLot = () => {
    if (deleteConfirmId) {
      const updated = properties.filter(p => p.id !== deleteConfirmId);
      setProperties(updated);
      if (selectedId === deleteConfirmId) {
        setSelectedId(updated[0]?.id || '');
      }
      setToast({
        message: 'Lote removido com sucesso!',
        type: 'success'
      });
      setDeleteConfirmId(null);
    }
  };

  // Simple helper to parse standard combined location strings back into form components
  const parseLocation = (locStr: string) => {
    let street = '';
    let number = '';
    let complement = '';
    let neighborhood = '';
    let city = 'Porto Alegre';
    let state = 'RS';

    try {
      let firstPart = '';
      let secondPart = '';
      
      if (locStr.includes(' - Bairro ')) {
        const partsBairro = locStr.split(' - Bairro ');
        firstPart = partsBairro[0];
        secondPart = partsBairro[1];
      } else {
        const partsDash = locStr.split(' - ');
        if (partsDash.length >= 2) {
          const firstDashIdx = locStr.indexOf(' - ');
          firstPart = locStr.substring(0, firstDashIdx);
          secondPart = locStr.substring(firstDashIdx + 3);
        } else {
          firstPart = locStr;
        }
      }

      if (firstPart && secondPart) {
        // Parse firstPart for street, number, complement
        const firstSubparts = firstPart.split(',');
        street = firstSubparts[0]?.trim() || '';
        
        for (let i = 1; i < firstSubparts.length; i++) {
          const p = firstSubparts[i].trim();
          if (p.toLowerCase().startsWith('nº')) {
            number = p.replace(/nº\s*/i, '').trim();
          } else {
            complement = p;
          }
        }

        // Parse secondPart for neighborhood, city, state
        const secondSubparts = secondPart.split(',');
        neighborhood = secondSubparts[0]?.trim() || '';
        
        if (secondSubparts.length > 1) {
          const cityStatePart = secondSubparts[1].trim(); // "Porto Alegre - RS"
          const lastHyphen = cityStatePart.lastIndexOf('-');
          if (lastHyphen !== -1) {
            city = cityStatePart.substring(0, lastHyphen).trim();
            state = cityStatePart.substring(lastHyphen + 1).trim();
          } else {
            city = cityStatePart;
          }
        }
      } else {
        // Fallback simple parsing if format is different
        const partsComma = locStr.split(',');
        if (partsComma.length > 0) street = partsComma[0].trim();
        if (partsComma.length > 1) {
          const p1 = partsComma[1].trim();
          if (p1.toLowerCase().startsWith('nº')) {
            number = p1.replace(/nº\s*/i, '').trim();
          } else {
            neighborhood = p1;
          }
        }
        if (partsComma.length > 2) {
          const p2 = partsComma[2].trim();
          const lastHyphen = p2.lastIndexOf('-');
          if (lastHyphen !== -1) {
            city = p2.substring(0, lastHyphen).trim();
            state = p2.substring(lastHyphen + 1).trim();
          } else {
            city = p2;
          }
        }
      }
    } catch (err) {
      console.error('Error parsing location:', err);
      street = locStr;
    }

    return { street, number, complement, neighborhood, city, state };
  };

  // Open Edit Modal with selected lot's details loaded
  const handleEditLot = (item: ImovelLot, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingLot(item);
    setEditTypeText(item.typeText);
    
    const parsed = parseLocation(item.location);
    setEditStreet(parsed.street);
    setEditNumber(parsed.number);
    setEditComplement(parsed.complement);
    setEditNeighborhood(parsed.neighborhood);
    setEditState(parsed.state);
    setEditCity(parsed.city);

    setEditArea(formatValueToBrazilian(item.area));
    setEditMarketValue(formatValueToBrazilian(item.marketValue));
    setEditSuggestedBid(formatValueToBrazilian(item.suggestedBid));
    setEditPortalName(item.portalName || portalsList[0] || 'Pestana Leilões');
    setEditAuctionDate(item.auctionDate || '');
    setEditBedrooms(item.bedrooms || 2);
    setEditGarage((item.garage as any) || 'Box');
    setEditRegistration(item.registration || '');
    setEditZone(item.zone || '');
    setEditCategory(item.category || 'Prioritário');
    setEditOccupancyStatus(item.occupancyStatus || 'Ocupado');
    setEditCommission(item.commission !== undefined ? item.commission : 5);
    setEditIptu(item.iptu !== undefined ? formatValueToBrazilian(item.iptu) : '');
    setEditCondominium(item.condominium !== undefined ? formatValueToBrazilian(item.condominium) : '');
    setEditRegistro(item.registro !== undefined ? formatValueToBrazilian(item.registro) : '');
    setEditItbi(item.itbi !== undefined ? formatValueToBrazilian(item.itbi) : '');
    setEditTabelionato(item.tabelionato !== undefined ? formatValueToBrazilian(item.tabelionato) : '');
    setEditCorretagem(item.corretagem !== undefined ? item.corretagem : 0);
    setEditReforma(item.reforma !== undefined ? formatValueToBrazilian(item.reforma) : '');
    setEditDesocupacao(item.desocupacao !== undefined ? formatValueToBrazilian(item.desocupacao) : '');
    setIsEditModalOpen(true);
  };

  const handleExportPDF = (item: ImovelLot) => {
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
    });

    const pageWidth = doc.internal.pageSize.getWidth(); // 210mm
    const pageHeight = doc.internal.pageSize.getHeight(); // 297mm

    const formatPDFBRL = (val: number) => {
      return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);
    };

    const { mainAddress, cityState } = getSplitLocation(item.location);
    const profitData = calculateEstimatedProfit(item);

    const parseDateString = (dateStr?: string): Date => {
      if (!dateStr) return new Date();
      const matchYMD = dateStr.match(/^(\d{4})-(\d{2})-(\d{2})/);
      if (matchYMD) {
        return new Date(parseInt(matchYMD[1], 10), parseInt(matchYMD[2], 10) - 1, parseInt(matchYMD[3], 10));
      }
      const matchDMY = dateStr.match(/^(\d{2})\/(\d{2})\/(\d{4})/);
      if (matchDMY) {
        return new Date(parseInt(matchDMY[3], 10), parseInt(matchDMY[2], 10) - 1, parseInt(matchDMY[1], 10));
      }
      const d = new Date(dateStr);
      return isNaN(d.getTime()) ? new Date() : d;
    };

    const getTransactionDate = (field: string, daysOffset: number): Date => {
      let customDateStr: string | undefined;
      if (field.startsWith('custom_expense_date_')) {
        const expenseId = field.replace('custom_expense_date_', '');
        const exp = (item.customExpenses || []).find(e => e.id === expenseId);
        customDateStr = exp?.paymentDate;
      } else {
        customDateStr = item[field as keyof ImovelLot] as string | undefined;
      }
      if (customDateStr) {
        return parseDateString(customDateStr);
      }
      let baseDate = new Date();
      if (item.auctionDate) {
        baseDate = parseDateString(item.auctionDate);
      }
      const result = new Date(baseDate);
      result.setDate(result.getDate() + daysOffset);
      return result;
    };

    const getItemDateLabel = (field: string, daysOffset: number, fallback: string): string => {
      let customDateStr: string | undefined;
      if (field.startsWith('custom_expense_date_')) {
        const expenseId = field.replace('custom_expense_date_', '');
        const exp = (item.customExpenses || []).find(e => e.id === expenseId);
        customDateStr = exp?.paymentDate;
      } else {
        customDateStr = item[field as keyof ImovelLot] as string | undefined;
      }
      if (customDateStr) {
        if (customDateStr.includes('-')) {
          const parts = customDateStr.split('-');
          if (parts.length === 3) {
            return `${parts[2]}/${parts[1]}/${parts[0]}`;
          }
        }
        return customDateStr;
      }
      return fallback;
    };

    // Dynamic page-add helper that paints background color to match light theme (white)
    const addNewPage = () => {
      doc.addPage();
      doc.setFillColor(255, 255, 255); // Fundo branco
      doc.rect(0, 0, pageWidth, pageHeight, 'F');
    };

    // 1. Initial Page Background
    doc.setFillColor(255, 255, 255); // Fundo branco
    doc.rect(0, 0, pageWidth, pageHeight, 'F');

    // 2. Header Card Container (#F8FAFC background, #E2E8F0 border, left emerald bar)
    doc.setFillColor(248, 250, 252); // #F8FAFC
    doc.setDrawColor(226, 232, 240); // #E2E8F0
    doc.setLineWidth(0.4);
    doc.roundedRect(12, 12, pageWidth - 24, 34, 4, 4, 'FD');

    // Left Accent Bar (Emerald)
    doc.setFillColor(16, 185, 129); // #10B981
    doc.rect(12, 12, 2.2, 34, 'F');

    // Header Right Tag Label
    doc.setTextColor(5, 150, 105); // #059669
    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.text('FICHA DO IMÓVEL — EXECUTIVO', pageWidth - 16, 19, { align: 'right' });

    // Header Title (Address)
    doc.setTextColor(15, 23, 42); // #0F172A (Deep Slate)
    doc.setFontSize(11);
    const addressLines = doc.splitTextToSize(mainAddress, pageWidth - 36);
    doc.text(addressLines, 18, 23);

    // Header Subtitle (City, State, Type)
    doc.setFontSize(8.5);
    doc.setFont('Helvetica', 'normal');
    doc.setTextColor(71, 85, 105); // #475569
    doc.text(cityState ? `${cityState}  |  ${item.typeText || 'Imóvel'}` : (item.typeText || 'Imóvel'), 18, 38);

    let y = 52;

    // Helper to draw light-theme rounded cards for each section
    const drawSectionCardHeader = (title: string, cardHeight: number) => {
      if (y + cardHeight > pageHeight - 16) {
        addNewPage();
        y = 12;
      }

      const startY = y;
      
      // Draw main card background and border
      doc.setFillColor(255, 255, 255); // White #FFFFFF
      doc.setDrawColor(226, 232, 240); // #E2E8F0
      doc.setLineWidth(0.4);
      doc.roundedRect(12, startY, pageWidth - 24, cardHeight, 4, 4, 'FD');

      // Left Accent Indicator line (emerald)
      doc.setFillColor(16, 185, 129);
      doc.rect(12, startY, 2, cardHeight, 'F');

      // Card Header title (clean, no icons!)
      doc.setTextColor(16, 185, 129); // #10B981
      doc.setFont('Helvetica', 'bold');
      doc.setFontSize(8.5);
      doc.text(title.toUpperCase(), 17, startY + 7);

      // Section divider
      doc.setDrawColor(241, 245, 249); // #F1F5F9
      doc.setLineWidth(0.35);
      doc.line(12, startY + 11, pageWidth - 12, startY + 11);

      return startY;
    };

    // --- CARD 1: CARACTERÍSTICAS (2 Columns!) ---
    const specs = [
      { label: 'Área', val: item.area || 'Não informada' },
      { label: 'Ocupação', val: item.occupancyStatus || 'Não informada' },
      ...(item.bedrooms !== undefined ? [{ label: 'Dormitórios', val: String(item.bedrooms) }] : []),
      ...(item.garage ? [{ label: 'Garagem', val: item.garage }] : []),
      ...(item.registration ? [{ label: 'Matrícula', val: item.registration }] : []),
      ...(item.zone ? [{ label: 'Zona/Região', val: item.zone }] : []),
    ];

    const card1Height = 12 + (Math.ceil(specs.length / 2) * 5.5) + 3;
    const s1Y = drawSectionCardHeader('Características do Imóvel', card1Height);

    specs.forEach((spec, index) => {
      const isCol2 = index % 2 === 1;
      const itemX = isCol2 ? 110 : 18;
      const valX = isCol2 ? 145 : 52;
      const lineY = s1Y + 17 + Math.floor(index / 2) * 5.5;

      doc.setTextColor(100, 116, 139); // slate-500
      doc.setFont('Helvetica', 'normal');
      doc.setFontSize(8);
      doc.text(spec.label, itemX, lineY);

      doc.setTextColor(15, 23, 42); // slate-900
      doc.setFont('Helvetica', 'bold');
      doc.text(spec.val, valX, lineY);
    });

    y += card1Height + 5;

    // --- CARD 2: LEILÃO (Portal/Leiloeiro) ---
    if (item.portalName || item.auctionDate) {
      const auctionDetails = [
        ...(item.portalName ? [{ label: 'Leiloeiro / Portal', val: item.portalName, isHighlight: false }] : []),
        ...(item.auctionDate ? [{ label: 'Data do Leilão', val: (() => {
          if (item.auctionDate.includes('-')) {
            const [yr, mn, dy] = item.auctionDate.split('-');
            return `${dy}/${mn}/${yr}`;
          }
          return item.auctionDate;
        })(), isHighlight: false }] : []),
      ];

      const countdown = getAuctionCountdown(item.auctionDate);
      if (countdown) {
        auctionDetails.push({ label: 'Prazo Restante', val: countdown.text, isHighlight: true });
      }

      const card2Height = 12 + (auctionDetails.length * 5.5) + 3;
      const s2Y = drawSectionCardHeader('Portal / Leiloeiro', card2Height);

      let auctionY = s2Y + 17;
      auctionDetails.forEach((detail) => {
        doc.setTextColor(100, 116, 139); // slate-500
        doc.setFont('Helvetica', 'normal');
        doc.setFontSize(8);
        doc.text(detail.label, 18, auctionY);

        if (detail.isHighlight && countdown) {
          if (countdown.isToday) {
            doc.setTextColor(5, 150, 105); // emerald-600
          } else if (countdown.text.includes('Encerrado')) {
            doc.setTextColor(100, 116, 139); // grey
          } else {
            doc.setTextColor(217, 119, 6); // amber-600
          }
        } else {
          doc.setTextColor(15, 23, 42); // slate-900
        }

        doc.setFont('Helvetica', 'bold');
        doc.text(detail.val, 65, auctionY);

        auctionY += 5.5;
      });

      y += card2Height + 5;
    }

    // --- CARD 3: COMPOSIÇÃO DE CUSTOS (Valores de referência) ---
    const commission = item.commission !== undefined ? item.commission : 5;
    const commissionVal = item.suggestedBid * (commission / 100);
    const iptuVal = item.iptu || 0;
    const condominiumVal = item.condominium || 0;
    const registroVal = item.registro || 0;
    const itbiVal = item.itbi || 0;
    const tabelionatoVal = item.tabelionato || 0;
    const corretagemPercent = item.corretagem !== undefined ? item.corretagem : 0;
    const saleValue = item.saleValue !== undefined ? item.saleValue : item.marketValue;
    const corretagemVal = saleValue * (corretagemPercent / 100);
    const reformaVal = item.reforma || 0;
    const desocupacaoVal = item.desocupacao || 0;
    const parcelaEmprestimoVal = item.parcela_emprestimo || 0;
    const quitacaoEmprestimoVal = item.quitacao_emprestimo || 0;
    const emprestimoVal = item.emprestimo || 0;

    const itemsConfig = [
      {
        label: `Comissão Leiloeiro (${commission}%)`,
        paymentDateField: 'paymentDate_commission',
        fallbackOffset: 'D+0 (Imediato)',
        daysOffset: 0,
        val: commissionVal,
        hasValue: commissionVal > 0,
      },
      {
        label: 'IPTU',
        paymentDateField: 'paymentDate_iptu',
        fallbackOffset: 'D+15',
        daysOffset: 15,
        val: iptuVal,
        hasValue: iptuVal > 0,
      },
      {
        label: 'Condomínio',
        paymentDateField: 'paymentDate_condominium',
        fallbackOffset: 'D+30',
        daysOffset: 30,
        val: condominiumVal,
        hasValue: condominiumVal > 0,
      },
      {
        label: 'Registro de Imóvel / Cartório',
        paymentDateField: 'paymentDate_registro',
        fallbackOffset: 'D+45',
        daysOffset: 45,
        val: registroVal,
        hasValue: registroVal > 0,
      },
      {
        label: 'ITBI',
        paymentDateField: 'paymentDate_itbi',
        fallbackOffset: 'D+30',
        daysOffset: 30,
        val: itbiVal,
        hasValue: itbiVal > 0,
      },
      {
        label: 'Tabelionato / Escritura',
        paymentDateField: 'paymentDate_tabelionato',
        fallbackOffset: 'D+30',
        daysOffset: 30,
        val: tabelionatoVal,
        hasValue: tabelionatoVal > 0,
      },
      {
        label: `Corretagem (${corretagemPercent}%)`,
        paymentDateField: 'paymentDate_corretagem',
        fallbackOffset: 'No encerramento',
        daysOffset: 180,
        val: corretagemVal,
        hasValue: corretagemVal > 0,
      },
      {
        label: 'Estimativa de Reforma',
        paymentDateField: 'paymentDate_reforma',
        fallbackOffset: 'D+60',
        daysOffset: 60,
        val: reformaVal,
        hasValue: reformaVal > 0,
      },
      {
        label: 'Custo Desocupação / Advogado',
        paymentDateField: 'paymentDate_desocupacao',
        fallbackOffset: 'D+90',
        daysOffset: 90,
        val: desocupacaoVal,
        hasValue: desocupacaoVal > 0,
      },
      {
        label: 'Parcela Empréstimo',
        paymentDateField: 'paymentDate_parcela_emprestimo',
        fallbackOffset: 'D+30',
        daysOffset: 30,
        val: parcelaEmprestimoVal,
        hasValue: parcelaEmprestimoVal > 0,
      },
      {
        label: 'Quitação Empréstimo',
        paymentDateField: 'paymentDate_quitacao_emprestimo',
        fallbackOffset: 'D+180 (Venda)',
        daysOffset: 180,
        val: quitacaoEmprestimoVal,
        hasValue: quitacaoEmprestimoVal > 0,
      },
      {
        label: 'Empréstimo (Receita)',
        paymentDateField: 'paymentDate_emprestimo',
        fallbackOffset: 'D+0 (Arrematação)',
        daysOffset: 0,
        val: emprestimoVal,
        hasValue: emprestimoVal > 0,
        isCredit: true,
      }
    ];

    const customItems = (item.customExpenses || []).map(exp => {
      const predefinedOffsets: Record<string, { daysOffset: number; fallbackOffset: string }> = {
        'Comissão Leiloeiro': { daysOffset: 0, fallbackOffset: 'D+0 (Imediato)' },
        'IPTU': { daysOffset: 15, fallbackOffset: 'D+15' },
        'Condomínio': { daysOffset: 30, fallbackOffset: 'D+30' },
        'Tabelionato / Escritura': { daysOffset: 30, fallbackOffset: 'D+30' },
        'Registro de Imóvel / Cartório': { daysOffset: 45, fallbackOffset: 'D+45' },
        'ITBI': { daysOffset: 30, fallbackOffset: 'D+30' },
        'Corretagem': { daysOffset: 180, fallbackOffset: 'No encerramento' },
        'Reforma': { daysOffset: 60, fallbackOffset: 'D+60' },
        'Desocupação / Advogado': { daysOffset: 90, fallbackOffset: 'D+90' },
        'Parcela Empréstimo': { daysOffset: 30, fallbackOffset: 'D+30' },
        'Quitação Empréstimo': { daysOffset: 180, fallbackOffset: 'D+180 (Venda)' },
        'Empréstimo (Receita)': { daysOffset: 0, fallbackOffset: 'D+0 (Arrematação)' },
      };
      const matched = predefinedOffsets[exp.name || ''] || { daysOffset: 30, fallbackOffset: 'D+30' };
      return {
        label: exp.name || 'Despesa Customizada',
        paymentDateField: `custom_expense_date_${exp.id}`,
        fallbackOffset: matched.fallbackOffset,
        daysOffset: matched.daysOffset,
        val: exp.value || 0,
        hasValue: exp.value !== undefined && exp.value > 0,
        isCredit: false,
      };
    });

    const sortedActiveItems = [...itemsConfig, ...customItems]
      .filter(x => x.hasValue)
      .sort((a, b) => {
        const dateA = getTransactionDate(a.paymentDateField, a.daysOffset);
        const dateB = getTransactionDate(b.paymentDateField, b.daysOffset);
        return dateA.getTime() - dateB.getTime();
      });

    const customExpensesSum = (item.customExpenses || []).reduce((acc, curr) => acc + (curr.value || 0), 0);
    const upfrontCosts = item.suggestedBid + commissionVal + iptuVal + condominiumVal + registroVal + itbiVal + tabelionatoVal + reformaVal + desocupacaoVal + parcelaEmprestimoVal + customExpensesSum;
    const capProprioPct = upfrontCosts > 0 ? (profitData.capitalProprio / upfrontCosts) * 100 : 100;
    const recTerceirosPct = upfrontCosts > 0 ? (profitData.recursosTerceiros / upfrontCosts) * 100 : 0;

    const card3Height = 12 + 18 + 5 + (sortedActiveItems.length * 5) + 12 + 16;
    const s3Y = drawSectionCardHeader('Valores de Referência', card3Height);

    // Inner horizontal boxes for Market Reference and Suggested Bid
    const boxWidth = (pageWidth - 32) / 2;
    const leftBoxX = 16;
    const rightBoxX = 16 + boxWidth + 4;

    // Box 1: VALOR DE MERCADO
    doc.setFillColor(240, 253, 250); // Light green bg #F0FDF4
    doc.setDrawColor(16, 185, 129); // Emerald border
    doc.setLineWidth(0.3);
    doc.roundedRect(leftBoxX, s3Y + 14, boxWidth, 14, 2, 2, 'FD');

    doc.setTextColor(5, 150, 105); // emerald-600
    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(7);
    doc.text('VALOR DE MERCADO', leftBoxX + 4, s3Y + 19);

    doc.setTextColor(15, 23, 42); // slate-900
    doc.setFontSize(9.5);
    doc.text(formatPDFBRL(item.marketValue), leftBoxX + 4, s3Y + 24);

    // Box 2: SUGESTÃO DE LANCE
    doc.setFillColor(240, 253, 250);
    doc.setDrawColor(16, 185, 129);
    doc.roundedRect(rightBoxX, s3Y + 14, boxWidth, 14, 2, 2, 'FD');

    doc.setTextColor(5, 150, 105);
    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(7);
    doc.text('SUGESTÃO DE LANCE', rightBoxX + 4, s3Y + 19);

    doc.setTextColor(15, 23, 42);
    doc.setFontSize(9.5);
    doc.text(formatPDFBRL(item.suggestedBid), rightBoxX + 4, s3Y + 24);

    // Box 3: CAPITAL PRÓPRIO
    doc.setFillColor(239, 246, 255); // Light blue bg #EFF6FF
    doc.setDrawColor(59, 130, 246); // Blue border
    doc.roundedRect(leftBoxX, s3Y + 30, boxWidth, 14, 2, 2, 'FD');

    doc.setTextColor(37, 99, 235); // blue-600
    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(7);
    doc.text(`CAPITAL PRÓPRIO (${formatPercentBR(capProprioPct)}%)`, leftBoxX + 4, s3Y + 35);

    doc.setTextColor(15, 23, 42); // slate-900
    doc.setFontSize(9.5);
    doc.text(formatPDFBRL(profitData.capitalProprio), leftBoxX + 4, s3Y + 40);

    // Box 4: RECURSOS DE TERCEIROS (CAPITAL DE TERCEIROS)
    doc.setFillColor(248, 250, 252); // Light slate bg
    doc.setDrawColor(148, 163, 184); // Slate border
    doc.roundedRect(rightBoxX, s3Y + 30, boxWidth, 14, 2, 2, 'FD');

    doc.setTextColor(71, 85, 105); // slate-600
    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(7);
    doc.text(`CAPITAL DE TERCEIROS (${formatPercentBR(recTerceirosPct)}%)`, rightBoxX + 4, s3Y + 35);

    doc.setTextColor(15, 23, 42); // slate-900
    doc.setFontSize(9.5);
    doc.text(formatPDFBRL(profitData.recursosTerceiros), rightBoxX + 4, s3Y + 40);

    // Table header for rows
    let costY = s3Y + 50;
    if (sortedActiveItems.length > 0) {
      doc.setFont('Helvetica', 'bold');
      doc.setFontSize(7);
      doc.setTextColor(100, 116, 139); // slate-500
      doc.text('PRAZO / DATA', 18, costY);
      doc.text('DESCRIÇÃO / ITEM', 48, costY);
      doc.text('VALOR', pageWidth - 18, costY, { align: 'right' });
      costY += 5;
    }

    // Draw individual cost list rows
    sortedActiveItems.forEach((row) => {
      doc.setFont('Helvetica', 'normal');
      doc.setTextColor(100, 116, 139); // slate-500 for date
      doc.setFontSize(7.5);
      
      const dateStr = getItemDateLabel(row.paymentDateField, row.daysOffset, row.fallbackOffset);
      doc.text(dateStr, 18, costY);

      doc.setTextColor(15, 23, 42); // slate-900 for label
      doc.setFont('Helvetica', 'normal');
      doc.text(row.label, 48, costY);

      if (row.isCredit) {
        doc.setTextColor(16, 185, 129); // emerald-500
        doc.setFont('Helvetica', 'bold');
        doc.text(`+ ${formatPDFBRL(row.val)}`, pageWidth - 18, costY, { align: 'right' });
      } else {
        doc.setTextColor(15, 23, 42); // slate-900
        doc.setFont('Helvetica', 'normal');
        doc.text(formatPDFBRL(row.val), pageWidth - 18, costY, { align: 'right' });
      }
      costY += 5;
    });

    // Separator line
    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.35);
    doc.line(16, costY - 1, pageWidth - 16, costY - 1);
    costY += 4.5;

    // Total Projected Row
    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(15, 23, 42);
    doc.text('INVESTIMENTO TOTAL PROJETADO (A)', 18, costY);

    doc.setTextColor(217, 119, 6); // amber-600
    doc.text(formatPDFBRL(profitData.totalInvestment), pageWidth - 18, costY, { align: 'right' });

    y += card3Height + 5;

    // Force Page 2 transition
    addNewPage();
    y = 12;

    // --- CARD 4: RETORNO DE VIABILIDADE (ROI) (Análise de ROI e Viabilidade) ---
    const card4Height = 102; // Title + Metrics Rows + Visual Chart area + Padding
    const s4Y = drawSectionCardHeader('Análise de ROI e Viabilidade', card4Height);

    let roiY = s4Y + 13;
    const isPositive = profitData.netProfit >= 0;

    // ROW 1: Val de Revenda, Lucro Líquido Real, Lucro Participação
    doc.setTextColor(100, 116, 139); // slate-500
    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(6);
    doc.text('VALOR DE REVENDA ESTIMADO (B)', 18, roiY);
    doc.setTextColor(15, 23, 42); // slate-900
    doc.setFontSize(8.5);
    doc.text(formatPDFBRL(profitData.saleValue), 18, roiY + 4);

    doc.setTextColor(100, 116, 139);
    doc.setFontSize(6);
    doc.text('LUCRO LÍQUIDO REAL ESTIMADO (B - A)', 78, roiY);
    doc.setTextColor(isPositive ? 5 : 220, isPositive ? 150 : 38, isPositive ? 105 : 38);
    doc.setFontSize(8.5);
    doc.text(formatPDFBRL(profitData.netProfit), 78, roiY + 4);

    const netProfitParticipation = profitData.netProfit * (participationPercent / 100);
    doc.setTextColor(100, 116, 139);
    doc.setFontSize(6);
    doc.text(`LUCRO LÍQUIDO PARTICIPAÇÃO (${participationPercent}%)`, 138, roiY);
    doc.setTextColor(isPositive ? 5 : 220, isPositive ? 150 : 38, isPositive ? 105 : 38);
    doc.setFontSize(8.5);
    doc.text(formatPDFBRL(netProfitParticipation), 138, roiY + 4);

    // ROW 2: Indicators (ROI, TIR, Margem) - Total and Monthly
    let roiY2 = s4Y + 22;

    // Col 1: ROI OPERAÇÃO (Total / Mensal)
    doc.setTextColor(100, 116, 139);
    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(6);
    doc.text('RETORNO (ROI TOTAL / MENSAL)', 18, roiY2);
    doc.setTextColor(isPositive ? 5 : 220, isPositive ? 150 : 38, isPositive ? 105 : 38);
    doc.setFontSize(8.5);
    doc.text(`${formatPercentBR(profitData.roiPercent)}% (${formatPercentBR(profitData.roiMonthly)}% a.m.)`, 18, roiY2 + 4);

    // Col 2: TIR (TOTAL / MENSAL)
    doc.setTextColor(100, 116, 139);
    doc.setFontSize(6);
    doc.text('TIR (TAXA INT. RETORNO a.m. / a.a.)', 78, roiY2);
    doc.setTextColor(isPositive ? 5 : 220, isPositive ? 150 : 38, isPositive ? 105 : 38);
    doc.setFontSize(8.5);
    doc.text(`${formatPercentBR(profitData.tirMonthly)}% a.m. (${formatPercentBR(profitData.tirAnnual)}% a.a.)`, 78, roiY2 + 4);

    // Col 3: MARGEM DE LUCRO (TOTAL / MENSAL)
    doc.setTextColor(100, 116, 139);
    doc.setFontSize(6);
    doc.text('MARGEM DE LUCRO (TOTAL / MENSAL)', 138, roiY2);
    doc.setTextColor(isPositive ? 5 : 220, isPositive ? 150 : 38, isPositive ? 105 : 38);
    doc.setFontSize(8.5);
    doc.text(`${formatPercentBR(profitData.profitMarginTotal)}% (${formatPercentBR(profitData.profitMarginMonthly)}% a.m.)`, 138, roiY2 + 4);

    // ROW 3: Capital Próprio, ROI s/ Capital Próprio, Prazo Estimado
    let roiY3 = s4Y + 31;

    doc.setTextColor(100, 116, 139);
    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(6);
    doc.text('CAPITAL PRÓPRIO APORTADO', 18, roiY3);
    doc.setTextColor(15, 23, 42);
    doc.setFontSize(8.5);
    doc.text(formatPDFBRL(profitData.capitalProprio), 18, roiY3 + 4);

    const roiCapProprioStr = (profitData.roiCapitalProprio !== undefined && isFinite(profitData.roiCapitalProprio))
      ? `${formatPercentBR(profitData.roiCapitalProprio)}% (${formatPercentBR(profitData.roiCapitalProprioMonthly)}% a.m.)`
      : '—';
    doc.setTextColor(100, 116, 139);
    doc.setFontSize(6);
    doc.text('ROI S/ CAPITAL PRÓPRIO (TOTAL / MENSAL)', 78, roiY3);
    doc.setTextColor(isPositive ? 5 : 220, isPositive ? 150 : 38, isPositive ? 105 : 38);
    doc.setFontSize(8.5);
    doc.text(roiCapProprioStr, 78, roiY3 + 4);

    doc.setTextColor(100, 116, 139);
    doc.setFontSize(6);
    doc.text('PRAZO PROJETADO DA OPERAÇÃO', 138, roiY3);
    doc.setTextColor(15, 23, 42);
    doc.setFontSize(8.5);
    doc.text(`${formatPercentBR(profitData.monthsCount, profitData.monthsCount % 1 === 0 ? 0 : 2)} Meses`, 138, roiY3 + 4);

    // Divider for Chart area
    doc.setDrawColor(241, 245, 249);
    doc.setLineWidth(0.35);
    doc.line(16, roiY3 + 8, pageWidth - 16, roiY3 + 8);

    // Drawing the Vector Bar Chart natively in high quality!
    const totalCostsVal = Math.max(0, profitData.totalInvestment - item.suggestedBid);
    const chartItems = [
      { name: 'Valor de Mercado', value: item.marketValue, color: [59, 130, 246] }, // Blue #3B82F6
      { name: 'Valor de Venda (Entrada)', value: profitData.saleValue, color: [16, 185, 129] }, // Emerald #10B981
      { name: 'Custo Total Projetado', value: profitData.totalInvestment, color: [239, 68, 68] }, // Red #EF4444
      { name: 'Lance de Arrematação', value: item.suggestedBid, color: [245, 158, 11] }, // Amber #F59E0B
      { name: 'Custos Adicionais', value: totalCostsVal, color: [99, 102, 241] }, // Indigo #6366F1
    ];

    const maxVal = Math.max(...chartItems.map(i => i.value));

    let chartY = roiY3 + 12;
    chartItems.forEach((cItem) => {
      // Label
      doc.setTextColor(71, 85, 105); // slate-600
      doc.setFont('Helvetica', 'normal');
      doc.setFontSize(7.5);
      doc.text(cItem.name, 18, chartY + 3);

      // Bar background (light slate gray)
      doc.setFillColor(241, 245, 249);
      doc.rect(62, chartY, 90, 4, 'F');

      // Bar fill (scaled to maxVal)
      const barFillWidth = maxVal > 0 ? (cItem.value / maxVal) * 90 : 0;
      if (barFillWidth > 0) {
        doc.setFillColor(cItem.color[0], cItem.color[1], cItem.color[2]);
        doc.rect(62, chartY, barFillWidth, 4, 'F');
      }

      // Value formatted
      doc.setTextColor(15, 23, 42); // slate-900
      doc.setFont('Helvetica', 'bold');
      doc.setFontSize(8);
      doc.text(formatPDFBRL(cItem.value), 156, chartY + 3);

      chartY += 6.2;
    });

    y += card4Height + 5;

    // --- CARD 5: CRONOGRAMA E DINHEIRO NO TEMPO ---
    // Reprodution of the transactions logic in CashFlowTimeline.tsx
    const baseTransactions = [
      { name: 'Lance (Aquisição)', amount: -item.suggestedBid, date: getTransactionDate('paymentDate_bid', 0) },
      { name: 'Comissão Leiloeiro', amount: -commissionVal, date: getTransactionDate('paymentDate_commission', 0) },
      { name: 'IPTU', amount: -(item.iptu || 0), date: getTransactionDate('paymentDate_iptu', 15) },
      { name: 'Condomínio', amount: -(item.condominium || 0), date: getTransactionDate('paymentDate_condominium', 30) },
      { name: 'Registro de Imóvel / Cartório', amount: -(item.registro || 0), date: getTransactionDate('paymentDate_registro', 45) },
      { name: 'ITBI', amount: -(item.itbi || 0), date: getTransactionDate('paymentDate_itbi', 30) },
      { name: 'Tabelionato / Escritura', amount: -(item.tabelionato || 0), date: getTransactionDate('paymentDate_tabelionato', 30) },
      { name: 'Corretagem', amount: -corretagemVal, date: getTransactionDate('paymentDate_corretagem', 180) },
      { name: 'Estimativa de Reforma', amount: -(item.reforma || 0), date: getTransactionDate('paymentDate_reforma', 60) },
      { name: 'Desocupação / Advogado', amount: -(item.desocupacao || 0), date: getTransactionDate('paymentDate_desocupacao', 60) },
      { name: 'Parcela Empréstimo', amount: -(item.parcela_emprestimo || 0), date: getTransactionDate('paymentDate_parcela_emprestimo', 30) },
      { name: 'Empréstimo', amount: item.emprestimo || 0, date: getTransactionDate('paymentDate_emprestimo', 0) },
      { name: 'Quitação Empréstimo', amount: -(item.quitacao_emprestimo || 0), date: getTransactionDate('paymentDate_quitacao_emprestimo', 180) },
      { name: 'Valor de Venda (Entrada)', amount: saleValue, date: getTransactionDate('paymentDate_sale', 180) }
    ];

    const customTransactions = (item.customExpenses || []).map(exp => {
      const predefinedOffsets: Record<string, number> = {
        'Comissão Leiloeiro': 0,
        'IPTU': 15,
        'Condomínio': 30,
        'Tabelionato / Escritura': 30,
        'Registro de Imóvel / Cartório': 45,
        'ITBI': 30,
        'Corretagem': 180,
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

    if (transactions.length > 0) {
      let minDate = new Date(transactions[0].date);
      let maxDate = new Date(saleDate);
      transactions.forEach(t => {
        if (t.date < minDate) minDate = new Date(t.date);
      });

      const totalDays = Math.max(0, Math.round((maxDate.getTime() - minDate.getTime()) / (1000 * 60 * 60 * 24)));

      const startMonth = new Date(minDate.getFullYear(), minDate.getMonth(), 1);
      const endMonth = new Date(maxDate.getFullYear(), maxDate.getMonth(), 1);

      const monthsList: { key: string; label: string; date: Date }[] = [];
      const currentMonthIter = new Date(startMonth);
      const monthNames = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

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

      const monthlyDataMap: Record<string, { inflows: number; outflows: number }> = {};
      monthsList.forEach(m => {
        monthlyDataMap[m.key] = { inflows: 0, outflows: 0 };
      });

      transactions.forEach(t => {
        const year = t.date.getFullYear();
        const month = t.date.getMonth();
        const key = `${year}-${String(month + 1).padStart(2, '0')}`;
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

      let cumulativeSum = 0;
      const timelineChartData = monthsList.map(m => {
        const { inflows, outflows } = monthlyDataMap[m.key];
        const net = inflows - outflows;
        cumulativeSum += net;
        return {
          monthLabel: m.label,
          inflows,
          outflows,
          net,
          cumulative: cumulativeSum
        };
      });

      const rowHeight = 4.8;
      const headerHeight = 11;

      // Calculate J-Curve summary metrics
      let peakExposure = 0;
      timelineChartData.forEach(d => {
        if (d.cumulative < peakExposure) peakExposure = d.cumulative;
      });
      const finalCumulative = timelineChartData[timelineChartData.length - 1]?.cumulative || 0;
      const totalPrazo = timelineChartData.length;
      const exactMonths = totalDays > 0 ? totalDays / 30 : totalPrazo;

      // We add 48 units of height to cardTimelineHeight for metrics (12) + chart (28) + gaps (8)
      const cardTimelineHeight = 12 + headerHeight + 48 + (timelineChartData.length * rowHeight) + 4;
      
      const sTimelineY = drawSectionCardHeader('Cronograma e Dinheiro no Tempo', cardTimelineHeight);
      
      // Metrics drawing:
      const metricsY = sTimelineY + 14;
      const colWidth = (pageWidth - 32) / 3;
      
      // Metric 1: Prazo
      doc.setFillColor(248, 250, 252);
      doc.setDrawColor(226, 232, 240);
      doc.setLineWidth(0.3);
      doc.roundedRect(16, metricsY, colWidth - 2, 12, 1.5, 1.5, 'FD');
      
      doc.setTextColor(100, 116, 139); // slate-500
      doc.setFont('Helvetica', 'bold');
      doc.setFontSize(6.5);
      doc.text('PRAZO ESTIMADO', 20, metricsY + 4);
      
      doc.setTextColor(15, 23, 42); // slate-900
      doc.setFont('Helvetica', 'bold');
      doc.setFontSize(8.5);
      doc.text(`${formatPercentBR(exactMonths, exactMonths % 1 === 0 ? 0 : 2)} ${exactMonths === 1 ? 'Mês' : 'Meses'} (${totalDays}d)`, 20, metricsY + 9.5);
      
      // Metric 2: Exposição Máxima de Capital
      doc.setFillColor(255, 241, 242); // rose-50
      doc.setDrawColor(254, 205, 211); // rose-200
      doc.roundedRect(16 + colWidth, metricsY, colWidth - 2, 12, 1.5, 1.5, 'FD');
      
      doc.setTextColor(225, 29, 72); // rose-600
      doc.setFont('Helvetica', 'bold');
      doc.setFontSize(6.5);
      doc.text('EXPOSIÇÃO MÁXIMA DE CAPITAL', 16 + colWidth + 4, metricsY + 4);
      
      doc.setTextColor(15, 23, 42); // slate-900
      doc.setFont('Helvetica', 'bold');
      doc.setFontSize(8.5);
      doc.text(formatPDFBRL(Math.abs(peakExposure)), 16 + colWidth + 4, metricsY + 9.5);
      
      // Metric 3: Lucro Líquido no Tempo
      doc.setFillColor(240, 253, 250); // emerald-50
      doc.setDrawColor(167, 243, 208); // emerald-200
      doc.roundedRect(16 + colWidth * 2, metricsY, colWidth - 2, 12, 1.5, 1.5, 'FD');
      
      doc.setTextColor(5, 150, 105); // emerald-600
      doc.setFont('Helvetica', 'bold');
      doc.setFontSize(6.5);
      doc.text('LUCRO LÍQUIDO NO TEMPO', 16 + colWidth * 2 + 4, metricsY + 4);
      
      doc.setTextColor(15, 23, 42); // slate-900
      doc.setFont('Helvetica', 'bold');
      doc.setFontSize(8.5);
      doc.text(formatPDFBRL(finalCumulative), 16 + colWidth * 2 + 4, metricsY + 9.5);

      // J-Curve chart drawing:
      const chartX = 16;
      const chartY = sTimelineY + 29;
      const chartW = pageWidth - 32;
      const chartH = 24;

      doc.setFont('Helvetica', 'bold');
      doc.setFontSize(6.5);
      doc.setTextColor(71, 85, 105); // slate-600
      doc.text('CURVA J DE CAIXA ACUMULADO (SALDO FINANCEIRO CORRENTE)', chartX + 2, chartY - 2);

      let maxCumulative = Math.max(...timelineChartData.map(d => d.cumulative));
      let minCumulative = Math.min(...timelineChartData.map(d => d.cumulative));
      if (minCumulative > 0) minCumulative = 0;
      if (maxCumulative < 0) maxCumulative = 0;
      const range = (maxCumulative - minCumulative) || 1;

      const getChartY = (val: number) => chartY + chartH - ((val - minCumulative) / range) * chartH;
      const getChartX = (idx: number) => chartX + 10 + (idx / (timelineChartData.length - 1)) * (chartW - 20);

      // Draw zero axis line
      const zeroY = getChartY(0);
      doc.setDrawColor(203, 213, 225); // slate-300
      doc.setLineWidth(0.35);
      doc.line(chartX + 5, zeroY, chartX + chartW - 5, zeroY);

      // Draw line segments connecting cumulative points
      doc.setDrawColor(16, 185, 129); // emerald-500
      doc.setLineWidth(1.0);
      timelineChartData.forEach((d, idx) => {
        if (idx === 0) return;
        const prev = timelineChartData[idx - 1];
        const x1 = getChartX(idx - 1);
        const y1 = getChartY(prev.cumulative);
        const x2 = getChartX(idx);
        const y2 = getChartY(d.cumulative);
        doc.line(x1, y1, x2, y2);
      });

      // Draw data point circles and labels
      timelineChartData.forEach((d, idx) => {
        const x = getChartX(idx);
        const y = getChartY(d.cumulative);
        
        if (d.cumulative >= 0) {
          doc.setFillColor(16, 185, 129); // emerald-500
        } else {
          doc.setFillColor(239, 68, 68); // rose-500
        }
        doc.circle(x, y, 1.0, 'F');
        
        doc.setFont('Helvetica', 'normal');
        doc.setFontSize(5.5);
        doc.setTextColor(100, 116, 139); // slate-500
        doc.text(d.monthLabel, x, chartY + chartH + 3.5, { align: 'center' });
      });

      // Cabeçalho da tabela
      let tableY = sTimelineY + 62;
      doc.setFillColor(248, 250, 252); // light slate background for header
      doc.rect(14, tableY, pageWidth - 28, 5, 'F');
      
      doc.setFont('Helvetica', 'bold');
      doc.setFontSize(7.5);
      doc.setTextColor(71, 85, 105); // slate-600
      
      doc.text('Mês', 16, tableY + 3.8);
      doc.text('Entradas', 46, tableY + 3.8);
      doc.text('Saídas', 80, tableY + 3.8);
      doc.text('Fluxo Líquido', 115, tableY + 3.8);
      doc.text('Saldo Acumulado', pageWidth - 16, tableY + 3.8, { align: 'right' });
      
      tableY += 5;
      
      // Linha divisória fina abaixo do cabeçalho
      doc.setDrawColor(226, 232, 240);
      doc.setLineWidth(0.3);
      doc.line(14, tableY, pageWidth - 14, tableY);
      
      tableY += 1;
      
      timelineChartData.forEach((row, rIdx) => {
        doc.setFont('Helvetica', 'normal');
        doc.setFontSize(7.5);
        
        // Cores de zebra alternativas
        if (rIdx % 2 === 1) {
          doc.setFillColor(250, 250, 250);
          doc.rect(14, tableY - 0.5, pageWidth - 28, rowHeight, 'F');
        }
        
        doc.setTextColor(15, 23, 42); // slate-900
        doc.text(row.monthLabel, 16, tableY + 3.2);
        
        // Entradas
        if (row.inflows > 0) {
          doc.setTextColor(16, 185, 129); // emerald-500
          doc.text(formatPDFBRL(row.inflows), 46, tableY + 3.2);
        } else {
          doc.setTextColor(148, 163, 184); // grey
          doc.text('R$ 0', 46, tableY + 3.2);
        }
        
        // Saídas
        if (row.outflows > 0) {
          doc.setTextColor(239, 68, 68); // rose-500
          doc.text(`- ${formatPDFBRL(row.outflows)}`, 80, tableY + 3.2);
        } else {
          doc.setTextColor(148, 163, 184); // grey
          doc.text('R$ 0', 80, tableY + 3.2);
        }
        
        // Fluxo Líquido
        const netVal = row.inflows - row.outflows;
        if (netVal > 0) {
          doc.setTextColor(16, 185, 129); // green
          doc.text(`+ ${formatPDFBRL(netVal)}`, 115, tableY + 3.2);
        } else if (netVal < 0) {
          doc.setTextColor(239, 68, 68); // red
          doc.text(`- ${formatPDFBRL(Math.abs(netVal))}`, 115, tableY + 3.2);
        } else {
          doc.setTextColor(148, 163, 184); // grey
          doc.text('R$ 0', 115, tableY + 3.2);
        }
        
        // Saldo Acumulado
        if (row.cumulative > 0) {
          doc.setTextColor(16, 185, 129);
        } else if (row.cumulative < 0) {
          doc.setTextColor(239, 68, 68);
        } else {
          doc.setTextColor(15, 23, 42);
        }
        doc.setFont('Helvetica', 'bold');
        doc.text(formatPDFBRL(row.cumulative), pageWidth - 16, tableY + 3.2, { align: 'right' });
        
        tableY += rowHeight;
      });
      
      y += cardTimelineHeight + 5;
    }

    // --- CARD 6: ANÁLISE OPERACIONAL DE RISCO ---
    const risk = calculateRiskLevel(item);
    const cardRiskHeight = 12 + 16 + (risk.factors.length * 5) + 3;
    const sRiskY = drawSectionCardHeader('Análise Operacional de Risco', cardRiskHeight);

    let riskY = sRiskY + 17;

    // Score Label
    doc.setTextColor(71, 85, 105);
    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(8);
    doc.text('ÍNDICE GERAL DE RISCO OPERACIONAL', 18, riskY);

    // Score Value
    if (risk.label === 'Alto') {
      doc.setTextColor(239, 68, 68); // rose-500
    } else if (risk.label === 'Médio') {
      doc.setTextColor(217, 119, 6); // amber-600
    } else {
      doc.setTextColor(5, 150, 105); // emerald-600
    }
    doc.setFontSize(9.5);
    doc.text(`${risk.score}/100  (Risco ${risk.label})`, pageWidth - 18, riskY, { align: 'right' });

    // Progress Bar BG
    doc.setFillColor(241, 245, 249); // #F1F5F9
    doc.rect(18, riskY + 3, pageWidth - 36, 2, 'F');

    // Progress Bar Fill
    if (risk.label === 'Alto') {
      doc.setFillColor(239, 68, 68);
    } else if (risk.label === 'Médio') {
      doc.setFillColor(245, 158, 11);
    } else {
      doc.setFillColor(16, 185, 129);
    }
    const barFillWidthRisk = (pageWidth - 36) * (risk.score / 100);
    if (barFillWidthRisk > 0) {
      doc.rect(18, riskY + 3, barFillWidthRisk, 2, 'F');
    }

    // Factors list
    let factorY = riskY + 10;
    risk.factors.forEach((factor) => {
      doc.setFontSize(7.5);
      
      // Neutral bullet dash
      doc.setTextColor(148, 163, 184); // neutral gray
      doc.setFont('Helvetica', 'bold');
      doc.text('-', 18, factorY);
      
      // Text
      doc.setFont('Helvetica', 'normal');
      doc.setTextColor(71, 85, 105); // slate-600
      doc.text(factor.text, 22, factorY);
      
      factorY += 5;
    });

    y += cardRiskHeight + 5;

    // --- CARD 7: ANÁLISE DE MERCADO E LIQUIDEZ (Liquidez de Mercado) ---
    const liquidity = calculateMarketLiquidity(item);
    // Pre-wrap liquidity comments
    const wrappedCommentaries: string[] = [];
    liquidity.analysis.forEach((comment) => {
      const wrapped = doc.splitTextToSize(comment, pageWidth - 36);
      wrapped.forEach((wLine: string) => {
        wrappedCommentaries.push(wLine);
      });
    });

    const cardLiquidityHeight = 12 + 18 + (wrappedCommentaries.length * 4.8) + 4;
    const sLiquidityY = drawSectionCardHeader('Liquidez de Mercado', cardLiquidityHeight);

    let liqY = sLiquidityY + 16;

    // Col 1: Prazo Estimado de Revenda
    doc.setTextColor(100, 116, 139);
    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(7);
    doc.text('PRAZO ESTIMADO DE REVENDA', 18, liqY);
    doc.setTextColor(5, 150, 105); // emerald-600
    doc.setFontSize(9.5);
    doc.text(liquidity.prazoTexto, 18, liqY + 5);

    // Col 2: Índice de Liquidez
    doc.setTextColor(100, 116, 139);
    doc.setFontSize(7);
    doc.text('ÍNDICE DE LIQUIDEZ DE MERCADO', 110, liqY);
    doc.setTextColor(15, 23, 42); // slate-900
    doc.setFontSize(9.5);
    doc.text(`${liquidity.score}/100 (Giro ${liquidity.level})`, 110, liqY + 5);

    // Separator
    doc.setDrawColor(241, 245, 249);
    doc.setLineWidth(0.35);
    doc.line(16, liqY + 8, pageWidth - 16, liqY + 8);

    // Commentaries
    let commY = liqY + 13;
    wrappedCommentaries.forEach((line) => {
      doc.setFontSize(7.5);
      
      // Neutral dash bullet
      doc.setTextColor(148, 163, 184);
      doc.setFont('Helvetica', 'bold');
      doc.text('-', 18, commY);
      
      // Text
      doc.setFont('Helvetica', 'normal');
      doc.setTextColor(71, 85, 105); // slate-600
      doc.text(line, 22, commY);
      
      commY += 4.8;
    });

    y += cardLiquidityHeight + 5;

    // 3. Multi-page footer generation loop
    const pageCount = (doc as any).internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);

      // Separator line at bottom
      doc.setDrawColor(226, 232, 240); // #E2E8F0
      doc.setLineWidth(0.35);
      doc.line(12, pageHeight - 14, pageWidth - 12, pageHeight - 14);

      // Left metadata
      doc.setTextColor(100, 116, 139); // slate-500
      doc.setFont('Helvetica', 'normal');
      doc.setFontSize(7.5);
      const timestamp = `${new Date().toLocaleDateString('pt-BR')} ${new Date().toLocaleTimeString('pt-BR', {hour: '2-digit', minute:'2-digit'})}`;
      doc.text(`Ficha Gerada Eletronicamente em ${timestamp}  |  Simulador de ROI`, 15, pageHeight - 9);

      // Right pagination
      doc.text(`Página ${i} de ${pageCount}`, pageWidth - 15, pageHeight - 9, { align: 'right' });
    }

    // Save PDF
    doc.save(`Ficha_Imovel_${mainAddress.toLowerCase().replace(/[^a-z0-9]/g, '_').substring(0, 30)}.pdf`);
  };

  // Save the edited lot
  const handleSaveEditLot = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingLot) return;

    const streetStr = editStreet.trim();
    const numberStr = editNumber.trim() ? `, nº ${editNumber.trim()}` : '';
    const complementStr = editComplement.trim() ? `, ${editComplement.trim()}` : '';
    const neighborhoodStr = ` - ${editNeighborhood.trim()}`;
    const cityStateStr = `, ${editCity} - ${editState}`;
    const combinedLocation = `${streetStr}${numberStr}${complementStr}${neighborhoodStr}${cityStateStr}`;

    const marketValueNum = parseBrazilianDecimalToNumber(editMarketValue);
    const suggestedBidNum = editSuggestedBid 
      ? parseBrazilianDecimalToNumber(editSuggestedBid) 
      : Math.max(0, Math.floor((0.60 * marketValueNum - 5000) / (1 + (editCommission / 100) + 0.03)));
    const savedArea = editArea ? (editArea.includes('m²') ? editArea : `${editArea} m²`) : 'Não informado';

    const updatedLot: ImovelLot = {
      ...editingLot,
      typeText: editTypeText,
      location: combinedLocation,
      area: savedArea,
      marketValue: marketValueNum,
      suggestedBid: suggestedBidNum,
      portalName: editPortalName,
      auctionDate: editAuctionDate,
      bedrooms: editBedrooms,
      garage: editGarage,
      registration: editRegistration.trim() || undefined,
      zone: editZone.trim() || undefined,
      commission: editCommission,
      iptu: editIptu ? parseBrazilianDecimalToNumber(editIptu) : undefined,
      condominium: editCondominium ? parseBrazilianDecimalToNumber(editCondominium) : undefined,
      registro: editRegistro ? parseBrazilianDecimalToNumber(editRegistro) : undefined,
      itbi: editItbi ? parseBrazilianDecimalToNumber(editItbi) : undefined,
      tabelionato: editTabelionato ? parseBrazilianDecimalToNumber(editTabelionato) : undefined,
      corretagem: editCorretagem,
      reforma: editReforma ? parseBrazilianDecimalToNumber(editReforma) : undefined,
      desocupacao: editDesocupacao ? parseBrazilianDecimalToNumber(editDesocupacao) : undefined,
      category: editCategory,
      occupancyStatus: editOccupancyStatus
    };

    setProperties(prev => prev.map(p => p.id === editingLot.id ? updatedLot : p));

    setIsEditModalOpen(false);
    setEditingLot(null);
    setToast({
      message: 'Imóvel atualizado com sucesso!',
      type: 'success'
    });
  };

  // Custom interactive Chat with Expert Advisor
  const handleSendChatMessage = async () => {
    if (!chatInput.trim() || isChatLoading) return;

    const userMsg = {
      id: `chat-${Date.now()}`,
      role: 'user' as const,
      content: chatInput,
      timestamp: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
    };

    setChatMessages(prev => [...prev, userMsg]);
    setChatInput('');
    setIsChatLoading(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [...chatMessages, userMsg].map(m => ({ role: m.role, content: m.content })),
          auctionContext: {
            title: `${selectedProperty.typeText} em ${selectedProperty.location}`,
            category: 'real_estate',
            typeText: selectedProperty.typeText,
            location: selectedProperty.location,
            marketValue: selectedProperty.marketValue,
            currentBid: selectedProperty.suggestedBid,
            portalName: 'Consultoria de Imóveis em Leilão'
          }
        })
      });

      const data = await response.json();
      if (!response.ok || data.error) {
        throw new Error(data.error || 'Erro na formulação de resposta.');
      }

      setChatMessages(prev => [...prev, {
        id: `ai-${Date.now()}`,
        role: 'assistant',
        content: data.content,
        timestamp: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
      }]);
    } catch (err: any) {
      console.error(err);
      // Fallback response following the requested personality
      setChatMessages(prev => [...prev, {
        id: `ai-${Date.now()}`,
        role: 'assistant',
        content: `Como Consultor Especialista em Imóveis, friso a importância da Regra do Teto (60% do valor de avaliação) para o lote **${selectedProperty.typeText} em ${selectedProperty.location}**. Recomendo verificar na prefeitura se existem dívidas de IPTU ativas que não foram descritas no edital, ou se há ações de condomínio em curso. Você quer que eu explique como funciona o mandado de imissão de posse caso esteja ocupado?`,
        timestamp: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
      }]);
    } finally {
      setIsChatLoading(false);
    }
  };

  // Filter lists based on states
  const filteredProperties = properties.filter(p => {
    // 1. User Access Control:
    // Admin Intelitz tem acesso total sempre.
    // Demais usuários só veem os lotes liberados a todos ou vinculados especificamente ao seu ID.
    const isAccessible = isIntelitzAdmin ||
      !p.assignedUserIds ||
      p.assignedUserIds.length === 0 ||
      p.assignedUserIds.includes('all') ||
      (currentUser?.id && p.assignedUserIds.includes(currentUser.id));

    if (!isAccessible) return false;

    // 2. User Filter selection from toolbar
    if (filterUserId !== 'all') {
      const matchesUserFilter = !p.assignedUserIds ||
        p.assignedUserIds.length === 0 ||
        p.assignedUserIds.includes('all') ||
        p.assignedUserIds.includes(filterUserId);
      if (!matchesUserFilter) return false;
    }

    // 3. Search and Category match
    const matchesSearch = p.location.toLowerCase().includes(search.toLowerCase()) || p.typeText.toLowerCase().includes(search.toLowerCase());
    const matchesCat = filterCategory === 'Todos' ||
                       (filterCategory === 'Prioritários' && p.category === 'Prioritário') ||
                       (filterCategory === 'Não Indicados' && p.category === 'Não Indicado');
    return matchesSearch && matchesCat;
  });

  return (
    <div id="lotes-imovel-tab" className="space-y-4 font-sans">
      
      {/* MODAL: NOVO IMÓVEL */}
      <AnimatePresence>
        {isAnalyzeModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsAnalyzeModalOpen(false)}
              className="fixed inset-0 bg-zinc-950/45 backdrop-blur-xs cursor-pointer"
              id="novo-imovel-modal-backdrop"
            />

            {/* Modal Body */}
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 15 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 15 }}
              transition={{ type: 'spring', duration: 0.3 }}
              className="relative w-full max-w-md bg-[#1C1C1E] rounded-3xl border border-[#2C2C2E] shadow-2xl overflow-hidden z-10 flex flex-col font-sans"
              id="novo-imovel-modal"
            >
              {/* Header */}
              <div className="p-5 border-b border-[#2C2C2E] bg-[#1C1C1E]/65 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="bg-[#10B981]/15 text-[#10B981] p-2 rounded-xl">
                    <Building className="h-4.5 w-4.5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-[#F8FAFC]">Incluir Novo Imóvel</h3>
                    <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider font-mono mt-0.5">Inclusão direta na planilha</p>
                  </div>
                </div>
                <button
                  onClick={() => setIsAnalyzeModalOpen(false)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-[#2C2C2E] cursor-pointer transition-colors"
                  id="btn-close-novo-imovel-modal"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {/* Form Content */}
              <div className="p-5 overflow-y-auto max-h-[80vh]">
                <form onSubmit={async (e) => {
                  await handleAddNewLot(e);
                  setIsAnalyzeModalOpen(false);
                }} className="space-y-4">
                  <div>
                    <label className="text-[10px] font-bold text-slate-450 block mb-1">TIPO DE IMÓVEL *</label>
                    <select
                      value={newTypeText}
                      onChange={(e) => setNewTypeText(e.target.value)}
                      className="w-full bg-[#2C2C2E]/60 text-xs font-semibold border border-[#2C2C2E] rounded-xl p-2.5 text-[#F8FAFC] focus:outline-none focus:ring-1 focus:ring-emerald-500 transition-all cursor-pointer"
                    >
                      <option value="Apartamento">Apartamento</option>
                      <option value="Casa">Casa</option>
                      <option value="Sobrado">Sobrado</option>
                      <option value="Terreno">Terreno</option>
                      <option value="Chácara">Chácara</option>
                      <option value="Galpão / Comercial">Galpão / Comercial</option>
                    </select>
                  </div>

                  {/* Endereço */}
                  <div>
                    <label className="text-[10px] font-bold text-slate-450 block mb-1">ENDEREÇO *</label>
                    <input
                      type="text"
                      value={newStreet}
                      onChange={(e) => setNewStreet(e.target.value)}
                      className="w-full bg-[#2C2C2E]/60 text-xs font-semibold border border-[#2C2C2E] rounded-xl p-2.5 text-[#F8FAFC] focus:outline-none focus:ring-1 focus:ring-emerald-500 transition-all placeholder:text-zinc-550"
                      placeholder="Ex: Rua dos Andradas"
                      required
                    />
                  </div>

                  {/* Número e Complemento */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-[10px] font-bold text-slate-450 block mb-1">NÚMERO *</label>
                      <input
                        type="text"
                        value={newNumber}
                        onChange={(e) => setNewNumber(e.target.value)}
                        className="w-full bg-[#2C2C2E]/60 text-xs font-semibold border border-[#2C2C2E] rounded-xl p-2.5 text-[#F8FAFC] focus:outline-none focus:ring-1 focus:ring-emerald-500 transition-all placeholder:text-zinc-550"
                        placeholder="Ex: 1234 ou S/N"
                        required
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-slate-450 block mb-1">COMPLEMENTO</label>
                      <input
                        type="text"
                        value={newComplement}
                        onChange={(e) => setNewComplement(e.target.value)}
                        className="w-full bg-[#2C2C2E]/60 text-xs font-semibold border border-[#2C2C2E] rounded-xl p-2.5 text-[#F8FAFC] focus:outline-none focus:ring-1 focus:ring-emerald-500 transition-all placeholder:text-zinc-550"
                        placeholder="Ex: Apto 402"
                      />
                    </div>
                  </div>

                  {/* Bairro e Estado */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-[10px] font-bold text-slate-450 block mb-1">BAIRRO *</label>
                      <input
                        type="text"
                        value={newNeighborhood}
                        onChange={(e) => setNewNeighborhood(e.target.value)}
                        className="w-full bg-[#2C2C2E]/60 text-xs font-semibold border border-[#2C2C2E] rounded-xl p-2.5 text-[#F8FAFC] focus:outline-none focus:ring-1 focus:ring-emerald-500 transition-all placeholder:text-zinc-550"
                        placeholder="Ex: Centro"
                        required
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-slate-450 block mb-1">ESTADO *</label>
                      <select
                        value={newState}
                        onChange={(e) => {
                          setNewState(e.target.value);
                        }}
                        className="w-full bg-[#2C2C2E]/60 text-xs font-semibold border border-[#2C2C2E] rounded-xl p-2.5 text-[#F8FAFC] focus:outline-none focus:ring-1 focus:ring-emerald-500 transition-all cursor-pointer"
                        required
                      >
                        {BRAZIL_STATES.map((st) => (
                          <option key={st.id} value={st.id}>{st.name}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Cidade e Área Construída */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-[10px] font-bold text-slate-450 block mb-1">CIDADE *</label>
                      <select
                        value={newCity}
                        onChange={(e) => setNewCity(e.target.value)}
                        className="w-full bg-[#2C2C2E]/60 text-xs font-semibold border border-[#2C2C2E] rounded-xl p-2.5 text-[#F8FAFC] focus:outline-none focus:ring-1 focus:ring-emerald-500 transition-all cursor-pointer"
                        required
                      >
                        {citiesList.map((ct) => (
                          <option key={ct} value={ct}>{ct}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-slate-450 block mb-1">ÁREA CONSTRUÍDA (M²)</label>
                      <input
                        type="text"
                        value={newArea}
                        onChange={(e) => setNewArea(formatTypingToBrazilian(e.target.value))}
                        className="w-full bg-[#2C2C2E]/60 text-xs font-semibold border border-[#2C2C2E] rounded-xl p-2.5 text-[#F8FAFC] focus:outline-none focus:ring-1 focus:ring-emerald-500 transition-all placeholder:text-zinc-550"
                        placeholder="Ex: 85,00"
                      />
                    </div>
                  </div>

                  {/* Dormitórios e Garagem - right under City and Area */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-[10px] font-bold text-slate-450 block mb-1">DORMITÓRIOS</label>
                      <select
                        value={newBedrooms}
                        onChange={(e) => setNewBedrooms(Number(e.target.value))}
                        className="w-full bg-[#2C2C2E]/60 text-xs font-semibold border border-[#2C2C2E] rounded-xl p-2.5 text-[#F8FAFC] focus:outline-none focus:ring-1 focus:ring-emerald-500 transition-all cursor-pointer"
                      >
                        {[1, 2, 3, 4].map((num) => (
                          <option key={num} value={num}>{num} {num === 1 ? 'Dormitório' : 'Dormitórios'}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-slate-450 block mb-1">GARAGEM</label>
                      <select
                        value={newGarage}
                        onChange={(e) => setNewGarage(e.target.value as any)}
                        className="w-full bg-[#2C2C2E]/60 text-xs font-semibold border border-[#2C2C2E] rounded-xl p-2.5 text-[#F8FAFC] focus:outline-none focus:ring-1 focus:ring-emerald-500 transition-all cursor-pointer"
                      >
                        <option value="Não possui">Não possui</option>
                        <option value="Box">Box</option>
                        <option value="Rotativo">Rotativo</option>
                      </select>
                    </div>
                  </div>

                  {/* Matrícula e Zona */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-[10px] font-bold text-slate-450 block mb-1">MATRÍCULA</label>
                      <input
                        type="text"
                        value={newRegistration}
                        onChange={(e) => setNewRegistration(e.target.value)}
                        className="w-full bg-[#2C2C2E]/60 text-xs font-semibold border border-[#2C2C2E] rounded-xl p-2.5 text-[#F8FAFC] focus:outline-none focus:ring-1 focus:ring-emerald-500 transition-all placeholder:text-zinc-550"
                        placeholder="Ex: 123.456"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-slate-450 block mb-1">ZONA</label>
                      <input
                        type="text"
                        value={newZone}
                        onChange={(e) => setNewZone(e.target.value)}
                        className="w-full bg-[#2C2C2E]/60 text-xs font-semibold border border-[#2C2C2E] rounded-xl p-2.5 text-[#F8FAFC] focus:outline-none focus:ring-1 focus:ring-emerald-500 transition-all placeholder:text-zinc-550"
                        placeholder="Ex: 1ª Zona"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-[10px] font-bold text-slate-450 block mb-1">PORTAL / LEILOEIRO</label>
                      <select
                        value={newPortalName}
                        onChange={(e) => setNewPortalName(e.target.value)}
                        className="w-full bg-[#2C2C2E]/60 text-xs font-semibold border border-[#2C2C2E] rounded-xl p-2.5 text-[#F8FAFC] focus:outline-none focus:ring-1 focus:ring-emerald-500 transition-all cursor-pointer font-medium disabled:opacity-40"
                        disabled={portalsList.length === 0}
                      >
                        {portalsList.length === 0 ? (
                          <option value="">Nenhum cadastrado (Aba 'Portais')</option>
                        ) : (
                          portalsList.map((pt) => (
                            <option key={pt} value={pt}>{pt}</option>
                          ))
                        )}
                      </select>
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-slate-450 block mb-1">DATA DO LEILÃO</label>
                      <input
                        type="date"
                        value={newAuctionDate}
                        onChange={(e) => setNewAuctionDate(e.target.value)}
                        className="w-full bg-[#2C2C2E]/60 text-xs font-semibold border border-[#2C2C2E] rounded-xl p-2.5 text-[#F8FAFC] focus:outline-none focus:ring-1 focus:ring-emerald-500 transition-all cursor-pointer font-medium"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-slate-450 block mb-1">AVALIAÇÃO DE MERCADO (R$)</label>
                    <input
                      type="text"
                      value={newMarketValue}
                      onChange={(e) => setNewMarketValue(formatTypingToBrazilian(e.target.value))}
                      className="w-full bg-[#2C2C2E]/60 text-xs font-semibold border border-[#2C2C2E] rounded-xl p-2.5 text-[#F8FAFC] focus:outline-none focus:ring-1 focus:ring-emerald-500 transition-all placeholder:text-zinc-550"
                      placeholder="Ex: 350.000,00"
                    />
                  </div>

                  {newMarketValue && parseBrazilianDecimalToNumber(newMarketValue) > 0 && (
                    <div className="p-3 bg-[#10B981]/10 rounded-xl border border-emerald-500/20 text-xs space-y-1 text-slate-300">
                      <span className="text-[9px] font-bold text-emerald-500 uppercase tracking-wider font-mono">Simulador de Teto em Tempo Real</span>
                      <p className="leading-relaxed font-medium">Regra de 60%: Lance Máximo Sugerido de <strong className="text-[#10B981] font-mono">{formatBRL(getSuggestedBidOnFly(newMarketValue, newCommission))}</strong>.</p>
                    </div>
                  )}

                  <div>
                    <label className="text-[10px] font-bold text-slate-450 block mb-1">LANCE (R$)</label>
                    <input
                      type="text"
                      value={newSuggestedBid}
                      onChange={(e) => setNewSuggestedBid(formatTypingToBrazilian(e.target.value))}
                      className="w-full bg-[#2C2C2E]/60 text-xs font-semibold border border-[#2C2C2E] rounded-xl p-2.5 text-[#F8FAFC] focus:outline-none focus:ring-1 focus:ring-emerald-500 transition-all placeholder:text-zinc-550"
                      placeholder="Ex: 210.000,00"
                    />
                  </div>



                  <div>
                    <label className="text-[10px] font-bold text-slate-450 block mb-1.5">OCUPAÇÃO *</label>
                    <div className="grid grid-cols-3 gap-2">
                      {['Verificar', 'Ocupado', 'Desocupado'].map((status) => {
                        const isActive = newOccupancyStatus === status;
                        return (
                          <button
                            key={status}
                            type="button"
                            onClick={() => setNewOccupancyStatus(status)}
                            className={`py-2.5 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer text-center border ${
                              isActive
                                ? 'bg-emerald-600 border-emerald-600 text-white shadow-sm'
                                : 'bg-[#2C2C2E]/40 border-[#2C2C2E] text-slate-300 hover:bg-[#2C2C2E] hover:border-zinc-700'
                            }`}
                          >
                            {status}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div className="pt-2 flex gap-3">
                    <button
                      type="button"
                      onClick={() => setIsAnalyzeModalOpen(false)}
                      className="flex-1 py-2.5 px-4 bg-[#2C2C2E] hover:bg-zinc-800 text-slate-300 border border-[#2C2C2E] rounded-xl text-xs font-bold transition-all cursor-pointer text-center"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="flex-1 py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-extrabold shadow-sm hover:shadow-md transition-all cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-wait"
                    >
                      {isSubmitting ? (
                        <>
                          <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                          <span>Incluindo...</span>
                        </>
                      ) : (
                        <>
                          <Plus className="h-3.5 w-3.5 text-emerald-200" />
                          <span>Incluir Imóvel</span>
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL: EDITAR IMÓVEL */}
      <AnimatePresence>
        {isEditModalOpen && editingLot && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => {
                setIsEditModalOpen(false);
                setEditingLot(null);
              }}
              className="fixed inset-0 bg-zinc-950/45 backdrop-blur-xs cursor-pointer"
              id="edit-imovel-modal-backdrop"
            />

            {/* Modal Body */}
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 15 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 15 }}
              transition={{ type: 'spring', duration: 0.3 }}
              className="relative w-full max-w-md bg-[#1C1C1E] rounded-3xl border border-[#2C2C2E] shadow-2xl overflow-hidden z-10 flex flex-col font-sans"
              id="edit-imovel-modal"
            >
              {/* Header */}
              <div className="p-5 border-b border-[#2C2C2E] bg-[#1C1C1E]/65 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="bg-[#10B981]/15 text-[#10B981] p-2 rounded-xl">
                    <Pencil className="h-4.5 w-4.5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-[#F8FAFC]">Editar Imóvel</h3>
                    <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider font-mono mt-0.5">Atualização de Dados Cadastrais</p>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      setDeleteConfirmId(editingLot.id);
                      setIsEditModalOpen(false);
                      setEditingLot(null);
                    }}
                    className="p-1.5 rounded-lg text-rose-550 hover:text-rose-300 hover:bg-rose-500/10 cursor-pointer transition-colors"
                    title="Excluir Imóvel"
                    id="btn-delete-edit-imovel"
                  >
                    <Trash2 className="h-4.5 w-4.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setIsEditModalOpen(false);
                      setEditingLot(null);
                    }}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-[#2C2C2E] cursor-pointer transition-colors"
                    id="btn-close-edit-imovel-modal"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {/* Form Content */}
              <div className="p-5 overflow-y-auto max-h-[80vh]">
                <form onSubmit={handleSaveEditLot} className="space-y-4">
                  <div>
                    <label className="text-[10px] font-bold text-slate-450 block mb-1">TIPO DE IMÓVEL *</label>
                    <select
                      value={editTypeText}
                      onChange={(e) => setEditTypeText(e.target.value)}
                      className="w-full bg-[#2C2C2E]/60 text-xs font-semibold border border-[#2C2C2E] rounded-xl p-2.5 text-[#F8FAFC] focus:outline-none focus:ring-1 focus:ring-emerald-500 transition-all cursor-pointer"
                    >
                      <option value="Apartamento">Apartamento</option>
                      <option value="Casa">Casa</option>
                      <option value="Sobrado">Sobrado</option>
                      <option value="Terreno">Terreno</option>
                      <option value="Chácara">Chácara</option>
                      <option value="Galpão / Comercial">Galpão / Comercial</option>
                    </select>
                  </div>

                  {/* Endereço */}
                  <div>
                    <label className="text-[10px] font-bold text-slate-450 block mb-1">ENDEREÇO *</label>
                    <input
                      type="text"
                      value={editStreet}
                      onChange={(e) => setEditStreet(e.target.value)}
                      className="w-full bg-[#2C2C2E]/60 text-xs font-semibold border border-[#2C2C2E] rounded-xl p-2.5 text-[#F8FAFC] focus:outline-none focus:ring-1 focus:ring-emerald-500 transition-all placeholder:text-zinc-550"
                      placeholder="Ex: Rua dos Andradas"
                      required
                    />
                  </div>

                  {/* Número e Complemento */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-[10px] font-bold text-slate-450 block mb-1">NÚMERO *</label>
                      <input
                        type="text"
                        value={editNumber}
                        onChange={(e) => setEditNumber(e.target.value)}
                        className="w-full bg-[#2C2C2E]/60 text-xs font-semibold border border-[#2C2C2E] rounded-xl p-2.5 text-[#F8FAFC] focus:outline-none focus:ring-1 focus:ring-emerald-500 transition-all placeholder:text-zinc-550"
                        placeholder="Ex: 1234 ou S/N"
                        required
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-slate-450 block mb-1">COMPLEMENTO</label>
                      <input
                        type="text"
                        value={editComplement}
                        onChange={(e) => setEditComplement(e.target.value)}
                        className="w-full bg-[#2C2C2E]/60 text-xs font-semibold border border-[#2C2C2E] rounded-xl p-2.5 text-[#F8FAFC] focus:outline-none focus:ring-1 focus:ring-emerald-500 transition-all placeholder:text-zinc-550"
                        placeholder="Ex: Apto 402"
                      />
                    </div>
                  </div>

                  {/* Bairro e Estado */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-[10px] font-bold text-slate-450 block mb-1">BAIRRO *</label>
                      <input
                        type="text"
                        value={editNeighborhood}
                        onChange={(e) => setEditNeighborhood(e.target.value)}
                        className="w-full bg-[#2C2C2E]/60 text-xs font-semibold border border-[#2C2C2E] rounded-xl p-2.5 text-[#F8FAFC] focus:outline-none focus:ring-1 focus:ring-emerald-500 transition-all placeholder:text-zinc-550"
                        placeholder="Ex: Centro"
                        required
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-slate-450 block mb-1">ESTADO *</label>
                      <select
                        value={editState}
                        onChange={(e) => {
                          setEditState(e.target.value);
                        }}
                        className="w-full bg-[#2C2C2E]/60 text-xs font-semibold border border-[#2C2C2E] rounded-xl p-2.5 text-[#F8FAFC] focus:outline-none focus:ring-1 focus:ring-emerald-500 transition-all cursor-pointer"
                        required
                      >
                        {BRAZIL_STATES.map((st) => (
                          <option key={st.id} value={st.id}>{st.name}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Cidade e Área Construída */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-[10px] font-bold text-slate-450 block mb-1">CIDADE *</label>
                      <select
                        value={editCity}
                        onChange={(e) => setEditCity(e.target.value)}
                        className="w-full bg-[#2C2C2E]/60 text-xs font-semibold border border-[#2C2C2E] rounded-xl p-2.5 text-[#F8FAFC] focus:outline-none focus:ring-1 focus:ring-emerald-500 transition-all cursor-pointer"
                        required
                      >
                        {editCitiesList.map((ct) => (
                          <option key={ct} value={ct}>{ct}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-slate-450 block mb-1">ÁREA CONSTRUÍDA (M²)</label>
                      <input
                        type="text"
                        value={editArea}
                        onChange={(e) => setEditArea(formatTypingToBrazilian(e.target.value))}
                        className="w-full bg-[#2C2C2E]/60 text-xs font-semibold border border-[#2C2C2E] rounded-xl p-2.5 text-[#F8FAFC] focus:outline-none focus:ring-1 focus:ring-emerald-500 transition-all placeholder:text-zinc-550"
                        placeholder="Ex: 85,00"
                      />
                    </div>
                  </div>

                  {/* Dormitórios e Garagem - right under City and Area */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-[10px] font-bold text-slate-450 block mb-1">DORMITÓRIOS</label>
                      <select
                        value={editBedrooms}
                        onChange={(e) => setEditBedrooms(Number(e.target.value))}
                        className="w-full bg-[#2C2C2E]/60 text-xs font-semibold border border-[#2C2C2E] rounded-xl p-2.5 text-[#F8FAFC] focus:outline-none focus:ring-1 focus:ring-emerald-500 transition-all cursor-pointer"
                      >
                        {[1, 2, 3, 4].map((num) => (
                          <option key={num} value={num}>{num} {num === 1 ? 'Dormitório' : 'Dormitórios'}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-slate-450 block mb-1">GARAGEM</label>
                      <select
                        value={editGarage}
                        onChange={(e) => setEditGarage(e.target.value as any)}
                        className="w-full bg-[#2C2C2E]/60 text-xs font-semibold border border-[#2C2C2E] rounded-xl p-2.5 text-[#F8FAFC] focus:outline-none focus:ring-1 focus:ring-emerald-500 transition-all cursor-pointer"
                      >
                        <option value="Não possui">Não possui</option>
                        <option value="Box">Box</option>
                        <option value="Rotativo">Rotativo</option>
                      </select>
                    </div>
                  </div>

                  {/* Matrícula e Zona */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-[10px] font-bold text-slate-450 block mb-1">MATRÍCULA</label>
                      <input
                        type="text"
                        value={editRegistration}
                        onChange={(e) => setEditRegistration(e.target.value)}
                        className="w-full bg-[#2C2C2E]/60 text-xs font-semibold border border-[#2C2C2E] rounded-xl p-2.5 text-[#F8FAFC] focus:outline-none focus:ring-1 focus:ring-emerald-500 transition-all placeholder:text-zinc-550"
                        placeholder="Ex: 123.456"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-slate-450 block mb-1">ZONA</label>
                      <input
                        type="text"
                        value={editZone}
                        onChange={(e) => setEditZone(e.target.value)}
                        className="w-full bg-[#2C2C2E]/60 text-xs font-semibold border border-[#2C2C2E] rounded-xl p-2.5 text-[#F8FAFC] focus:outline-none focus:ring-1 focus:ring-emerald-500 transition-all placeholder:text-zinc-550"
                        placeholder="Ex: 1ª Zona"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-[10px] font-bold text-slate-450 block mb-1">PORTAL / LEILOEIRO</label>
                      <select
                        value={editPortalName}
                        onChange={(e) => setEditPortalName(e.target.value)}
                        className="w-full bg-[#2C2C2E]/60 text-xs font-semibold border border-[#2C2C2E] rounded-xl p-2.5 text-[#F8FAFC] focus:outline-none focus:ring-1 focus:ring-emerald-500 transition-all cursor-pointer font-medium disabled:opacity-40"
                        disabled={portalsList.length === 0}
                      >
                        {portalsList.length === 0 ? (
                          <option value="">Nenhum cadastrado (Aba 'Portais')</option>
                        ) : (
                          portalsList.map((pt) => (
                            <option key={pt} value={pt}>{pt}</option>
                          ))
                        )}
                      </select>
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-slate-450 block mb-1">DATA DO LEILÃO</label>
                      <input
                        type="date"
                        value={editAuctionDate}
                        onChange={(e) => setEditAuctionDate(e.target.value)}
                        className="w-full bg-[#2C2C2E]/60 text-xs font-semibold border border-[#2C2C2E] rounded-xl p-2.5 text-[#F8FAFC] focus:outline-none focus:ring-1 focus:ring-emerald-500 transition-all cursor-pointer font-medium"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-slate-450 block mb-1">AVALIAÇÃO DE MERCADO (R$)</label>
                    <input
                      type="text"
                      value={editMarketValue}
                      onChange={(e) => setEditMarketValue(formatTypingToBrazilian(e.target.value))}
                      className="w-full bg-[#2C2C2E]/60 text-xs font-semibold border border-[#2C2C2E] rounded-xl p-2.5 text-[#F8FAFC] focus:outline-none focus:ring-1 focus:ring-emerald-500 transition-all placeholder:text-zinc-550"
                      placeholder="Ex: 350.000,00"
                    />
                  </div>

                  {editMarketValue && parseBrazilianDecimalToNumber(editMarketValue) > 0 && (
                    <div className="p-3 bg-[#10B981]/10 rounded-xl border border-emerald-500/20 text-xs space-y-1 text-slate-300">
                      <span className="text-[9px] font-bold text-emerald-500 uppercase tracking-wider font-mono">Simulador de Teto em Tempo Real</span>
                      <p className="leading-relaxed font-medium">Regra de 60%: Lance Máximo Sugerido de <strong className="text-[#10B981] font-mono">{formatBRL(getSuggestedBidOnFly(editMarketValue, editCommission))}</strong>.</p>
                    </div>
                  )}

                  <div>
                    <label className="text-[10px] font-bold text-slate-450 block mb-1">LANCE (R$)</label>
                    <input
                      type="text"
                      value={editSuggestedBid}
                      onChange={(e) => setEditSuggestedBid(formatTypingToBrazilian(e.target.value))}
                      className="w-full bg-[#2C2C2E]/60 text-xs font-semibold border border-[#2C2C2E] rounded-xl p-2.5 text-[#F8FAFC] focus:outline-none focus:ring-1 focus:ring-emerald-500 transition-all placeholder:text-zinc-550"
                      placeholder="Ex: 210.000,00"
                    />
                  </div>



                  <div>
                    <label className="text-[10px] font-bold text-slate-450 block mb-1.5">OCUPAÇÃO *</label>
                    <div className="grid grid-cols-3 gap-2">
                      {['Verificar', 'Ocupado', 'Desocupado'].map((status) => {
                        const isActive = editOccupancyStatus === status;
                        return (
                          <button
                            key={status}
                            type="button"
                            onClick={() => setEditOccupancyStatus(status)}
                            className={`py-2.5 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer text-center border ${
                              isActive
                                ? 'bg-emerald-600 border-emerald-600 text-white shadow-sm'
                                : 'bg-[#2C2C2E]/40 border-[#2C2C2E] text-slate-300 hover:bg-[#2C2C2E] hover:border-zinc-700'
                            }`}
                          >
                            {status}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div className="pt-2 flex gap-3">
                    <button
                      type="button"
                      onClick={() => {
                        setIsEditModalOpen(false);
                        setEditingLot(null);
                      }}
                      className="flex-1 py-2.5 px-4 bg-[#2C2C2E] hover:bg-[#zinc-800] text-slate-300 border border-[#2C2C2E] rounded-xl text-xs font-bold transition-all cursor-pointer text-center"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      className="flex-1 py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-extrabold shadow-sm hover:shadow-md transition-all cursor-pointer flex items-center justify-center gap-2"
                    >
                      <CheckSquare className="h-3.5 w-3.5 text-emerald-200" />
                      <span>Salvar Alterações</span>
                    </button>
                  </div>
                </form>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <div className="space-y-4">
        {/* Quick Search */}
        <AnimatePresence>
          {showSearch && (
            <motion.div
              initial={{ opacity: 0, height: 0, y: -5 }}
              animate={{ opacity: 1, height: 'auto', y: 0 }}
              exit={{ opacity: 0, height: 0, y: -5 }}
              transition={{ duration: 0.15 }}
              className="overflow-hidden"
            >
              <div className="relative">
                <Search className="absolute left-3.5 top-3.5 h-4 w-4 text-zinc-400" />
                <input
                  type="text"
                  placeholder="Pesquisar por localização, tipo, bairro..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full bg-[#1C1C1E] text-xs pl-10 pr-4 py-3 border border-[#2C2C2E] rounded-2xl focus:outline-none focus:ring-1 focus:ring-emerald-500 text-[#F8FAFC] shadow-sm placeholder:text-zinc-555"
                  autoFocus
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Filtering Controls */}
        <AnimatePresence>
          {showFilters && (
            <motion.div
              initial={{ opacity: 0, height: 0, y: -5 }}
              animate={{ opacity: 1, height: 'auto', y: 0 }}
              exit={{ opacity: 0, height: 0, y: -5 }}
              transition={{ duration: 0.15 }}
              className="overflow-hidden"
            >
              <div className="flex flex-wrap items-center gap-2 p-3 bg-[#1C1C1E] border border-[#2C2C2E] rounded-2xl shadow-sm">
                <span className="text-[10px] font-black text-slate-450 uppercase tracking-wider font-mono mr-1">Filtros:</span>
                {['Todos', 'Prioritários', 'Não Indicados'].map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setFilterCategory(cat as any)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      filterCategory === cat
                        ? 'bg-emerald-600 text-white shadow-xs'
                        : 'bg-[#2C2C2E] text-slate-300 hover:text-white hover:bg-zinc-800'
                    }`}
                  >
                    {cat}
                  </button>
                ))}

                {/* Main User Filter Dropdown */}
                <div className="relative inline-block">
                  <button
                    onClick={() => setIsMainUserFilterOpen(!isMainUserFilterOpen)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                      filterUserId !== 'all'
                        ? 'bg-blue-600 text-white shadow-xs'
                        : 'bg-[#2C2C2E] text-slate-300 hover:text-white hover:bg-zinc-800'
                    }`}
                    title="Filtrar por Usuário Vinculado"
                  >
                    <Users className="h-3.5 w-3.5 text-blue-400" />
                    <span>
                      {filterUserId === 'all'
                        ? 'Usuários: Todos'
                        : `Usuário: ${users.find(u => u.id === filterUserId)?.name || users.find(u => u.id === filterUserId)?.username || 'Selecionado'}`}
                    </span>
                  </button>

                  {isMainUserFilterOpen && (
                    <div className="absolute left-0 mt-1.5 w-52 bg-[#1C1C1E] border border-[#2C2C2E] rounded-xl shadow-2xl z-30 py-1 scrollbar-thin">
                      <button
                        onClick={() => {
                          setFilterUserId('all');
                          setIsMainUserFilterOpen(false);
                        }}
                        className={`w-full text-left px-3 py-1.5 text-xs font-medium transition-colors hover:bg-[#2C2C2E] ${
                          filterUserId === 'all' ? 'text-blue-400 font-bold bg-blue-500/10' : 'text-slate-300'
                        }`}
                      >
                        Todos os Usuários
                      </button>
                      {assignableUsers.map(u => (
                        <button
                          key={u.id}
                          onClick={() => {
                            setFilterUserId(u.id);
                            setIsMainUserFilterOpen(false);
                          }}
                          className={`w-full text-left px-3 py-1.5 text-xs font-medium transition-colors hover:bg-[#2C2C2E] flex items-center justify-between ${
                            filterUserId === u.id ? 'text-blue-400 font-bold bg-blue-500/10' : 'text-slate-300'
                          }`}
                        >
                          <span className="truncate">{u.name || u.username}</span>
                          {u.role === 'admin' && (
                            <span className="text-[8px] font-black uppercase bg-purple-500/20 text-purple-300 px-1 py-0.5 rounded">
                              Admin
                            </span>
                          )}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                {isAdmin && properties.length > 0 && (
                  <button
                    onClick={() => {
                      setClearAllConfirm(true);
                    }}
                    className="ml-auto px-3 py-1.5 rounded-lg text-xs font-bold bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 border border-rose-555/20 transition-all cursor-pointer flex items-center gap-1.5"
                    title="Excluir todos os imóveis"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    <span>Limpar Planilha</span>
                  </button>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Registered Properties List (Vertical Cards) */}
        <div className="space-y-4">
          {filteredProperties.length > 0 ? (
            filteredProperties.map((item) => {
              const isSelected = item.id === selectedId;
              const profitDataForCard = calculateEstimatedProfit(item);
              const totalCost = profitDataForCard.totalInvestment;
              const realDiscount = item.marketValue > 0 
                ? Math.round(((item.marketValue - totalCost) / item.marketValue) * 100) 
                : 0;
              return (
                <div
                  key={item.id}
                  onClick={() => {
                    setSelectedId(item.id);
                    setShowDetails(true);
                  }}
                  className={`bg-[#1C1C1E] rounded-2xl border p-4 transition-all cursor-pointer relative overflow-hidden flex flex-col hover:shadow-md ${
                    isSelected
                      ? 'border-[#444446] shadow-sm bg-[#1C1C1E]'
                      : 'border-[#2C2C2E] hover:border-zinc-700'
                  }`}
                >
                  {/* Main Content Area */}
                  {(() => {
                    const { mainAddress, cityState } = getSplitLocation(item.location);
                    const countdown = getAuctionCountdown(item.auctionDate);
                    const profitData = calculateEstimatedProfit(item);
                    const isPositiveProfit = profitData.netProfit >= 0;

                    return (
                      <div className="flex flex-col gap-3">
                        {/* Address on top */}
                        <div className="text-sm font-bold font-sans text-[#F8FAFC] leading-snug">
                          {mainAddress}
                          {cityState && (
                            <span className="text-[#10B981]"> — {cityState}</span>
                          )}
                        </div>

                        {/* Tags Row */}
                        <div className="flex flex-wrap items-center gap-2">
                          {/* Tag 1: Tipo */}
                          <span className="inline-flex items-center gap-1 bg-[#2C2C2E]/45 border border-[#2C2C2E]/80 px-2 py-1 rounded-lg text-[10.5px] font-bold text-slate-300 font-sans" title={item.typeText}>
                            {getPropertyTypeIcon(item.typeText)}
                          </span>

                          {/* Tag 2: Tempo Faltante */}
                          <span className="inline-flex items-center gap-1 bg-[#2C2C2E]/45 border border-[#2C2C2E]/80 px-2 py-1 rounded-lg text-[10.5px] font-bold font-sans" title="Tempo Faltante">
                            <Calendar className="h-3 w-3 text-slate-450 shrink-0" />
                            {countdown ? (
                              <span className={countdown.isToday ? 'text-emerald-400 animate-pulse font-black' : countdown.color}>
                                {countdown.diffDays > 0 ? `${countdown.diffDays} ${countdown.diffDays === 1 ? 'dia' : 'dias'}` : countdown.diffDays === 0 ? '0 dias' : 'Encerrado'}
                              </span>
                            ) : (
                              <span className="text-slate-500">—</span>
                            )}
                          </span>

                          {/* Tag 3: Custo Total Estimado */}
                          <span className="inline-flex items-center gap-1 bg-[#2C2C2E]/45 border border-[#2C2C2E]/80 px-2 py-1 rounded-lg text-[10.5px] font-bold text-slate-300 font-sans" title="Custo Total Estimado">
                            <DollarSign className="h-3 w-3 text-amber-500 shrink-0" />
                            <span className="text-amber-400 font-black font-mono">{formatBRL(totalCost)}</span>
                          </span>

                          {/* Tag 4: Lucro Líquido */}
                          <span className="inline-flex items-center gap-1 bg-[#2C2C2E]/45 border border-[#2C2C2E]/80 px-2 py-1 rounded-lg text-[10.5px] font-bold text-slate-300 font-sans" title="Lucro Líquido">
                            <TrendingUp className={`h-3 w-3 shrink-0 ${isPositiveProfit ? 'text-emerald-400' : 'text-rose-400'}`} />
                            <span className={`font-black font-mono ${isPositiveProfit ? 'text-[#10B981]' : 'text-rose-400'}`}>
                              {formatBRL(profitData.netProfit)}
                            </span>
                          </span>

                          {/* Tag 5: Arrematado */}
                          {item.arrematado && (
                            <span className={`inline-flex items-center gap-1 border px-2 py-1 rounded-lg text-[10.5px] font-bold font-sans ${
                              item.arrematado === 'Sim'
                                ? 'bg-[#10B981]/10 border-[#10B981]/25 text-[#10B981]'
                                : 'bg-[#EF4444]/10 border-[#EF4444]/25 text-[#EF4444]'
                            }`} title="Status de Arrematação">
                              <CheckSquare className="h-3 w-3 shrink-0" />
                              <span>Arrematado: {item.arrematado}</span>
                            </span>
                          )}

                          {/* Tag 6: Usuários Vinculados */}
                          <span className="inline-flex items-center gap-1 bg-blue-500/10 border border-blue-500/20 px-2 py-1 rounded-lg text-[10.5px] font-bold font-sans text-blue-300" title="Usuários Vinculados ao Lote">
                            <Users className="h-3 w-3 text-blue-400 shrink-0" />
                            <span>{getAssignedUsersLabel(item.assignedUserIds, users)}</span>
                          </span>
                        </div>
                      </div>
                    );
                  })()}
                </div>
              );
            })
          ) : (
            <div className="py-12 text-center text-slate-450 font-medium border border-[#2C2C2E] rounded-3xl bg-[#1C1C1E] shadow-3xs flex flex-col items-center justify-center gap-2">
              <Building className="h-8 w-8 text-slate-500" />
              <span>Nenhum imóvel cadastrado. Use o botão "Novo Imóvel" na parte superior para cadastrar o primeiro!</span>
            </div>
          )}
        </div>
      </div>

      {/* FLOATING CARD MODAL FOR SELECTED PROPERTY DETAILS */}
      <AnimatePresence>
        {showDetails && selectedProperty.id && (() => {
          const selectedCommission = selectedProperty.commission !== undefined ? selectedProperty.commission : 5;
          const selectedCommissionValue = selectedProperty.suggestedBid * (selectedCommission / 100);
          const selectedIptuValue = selectedProperty.iptu || 0;
          const selectedCondominiumValue = selectedProperty.condominium || 0;
          const selectedRegistroValue = selectedProperty.registro || 0;
          const selectedItbiValue = selectedProperty.itbi || 0;
          const selectedTabelionatoValue = selectedProperty.tabelionato || 0;
          const selectedCorretagemPercent = selectedProperty.corretagem !== undefined ? selectedProperty.corretagem : 0;
          const selectedSaleValueForCalc = selectedProperty.saleValue !== undefined ? selectedProperty.saleValue : selectedProperty.marketValue;
          const selectedCorretagemValue = selectedSaleValueForCalc * (selectedCorretagemPercent / 100);
          const selectedReformaValue = selectedProperty.reforma || 0;
           const selectedDesocupacaoValue = selectedProperty.desocupacao || 0;
          const selectedParcelaEmprestimoValue = selectedProperty.parcela_emprestimo || 0;
          const selectedQuitacaoEmprestimoValue = selectedProperty.quitacao_emprestimo || 0;
          const selectedEmprestimoValue = selectedProperty.emprestimo || 0;
          const selectedCustomExpensesValue = (selectedProperty.customExpenses || []).reduce((acc, curr) => acc + (curr.value || 0), 0);
          const selectedUpfrontCosts = selectedProperty.suggestedBid + selectedCommissionValue + selectedIptuValue + selectedCondominiumValue + selectedRegistroValue + selectedItbiValue + selectedTabelionatoValue + selectedReformaValue + selectedDesocupacaoValue + selectedParcelaEmprestimoValue + selectedCustomExpensesValue;
          const selectedCapitalProprio = Math.max(0, selectedUpfrontCosts - selectedEmprestimoValue);
          const selectedRecursosTerceiros = Math.min(selectedUpfrontCosts, selectedEmprestimoValue);
          const selectedTotalCost = selectedUpfrontCosts - selectedEmprestimoValue + selectedQuitacaoEmprestimoValue + selectedCorretagemValue;
          const selectedTotalCostBase = selectedUpfrontCosts + selectedQuitacaoEmprestimoValue + selectedCorretagemValue;
          const selectedRealDiscount = selectedProperty.marketValue > 0 
            ? Math.round(((selectedProperty.marketValue - selectedTotalCost) / selectedProperty.marketValue) * 100) 
            : 0;
          return (
            <div className="fixed inset-0 z-50 bg-[#000000] flex flex-col h-screen w-screen overflow-y-auto font-sans text-[#F8FAFC]">
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 30 }}
                transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                className="bg-[#000000] min-h-screen flex flex-col w-full shadow-2xl relative text-[#F8FAFC]"
              >
                {/* Header Navbar */}
                <div className="sticky top-0 bg-[#1C1C1E] border-b border-[#2C2C2E] px-4 py-2.5 flex items-center justify-between z-20 shadow-xs">
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1.5">
                      <FileText className="h-4 w-4 text-[#10B981]" />
                      <span className="text-[10px] font-black uppercase font-mono text-slate-400 tracking-wider">Ficha do Imóvel</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 relative">
                    {/* Participation % Button & Dropdown */}
                    <div className="relative">
                      <button
                        onClick={() => setIsParticipationDropdownOpen(!isParticipationDropdownOpen)}
                        className="p-1.5 text-zinc-450 hover:text-[#F8FAFC] hover:bg-[#2C2C2E] rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1 border border-[#2C2C2E]"
                        title="Percentual de Participação"
                      >
                        <Percent className="h-3 w-3 text-emerald-400" />
                        <span className="text-[10px] font-black font-mono text-emerald-400">{participationPercent}%</span>
                      </button>
                      
                      {isParticipationDropdownOpen && (
                        <div className="absolute right-0 mt-1.5 w-24 max-h-48 overflow-y-auto bg-[#1C1C1E] border border-[#2C2C2E] rounded-xl shadow-2xl z-30 py-1 scrollbar-thin">
                          {Array.from({ length: 20 }, (_, i) => (20 - i) * 5).map((pct) => (
                            <button
                              key={pct}
                              onClick={() => {
                                setParticipationPercent(pct);
                                setIsParticipationDropdownOpen(false);
                              }}
                              className={`w-full text-left px-3 py-1.5 text-xs font-mono transition-colors hover:bg-[#2C2C2E] hover:text-[#F8FAFC] ${
                                participationPercent === pct ? 'text-emerald-400 font-bold bg-[#10B981]/10' : 'text-slate-300'
                              }`}
                            >
                              {pct}%
                            </button>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* User Assignment Button & Dropdown */}
                    <div className="relative">
                      <button
                        onClick={() => setIsUserDropdownOpen(!isUserDropdownOpen)}
                        className="p-1.5 text-zinc-450 hover:text-[#F8FAFC] hover:bg-[#2C2C2E] rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1 border border-[#2C2C2E]"
                        title="Usuários Vinculados ao Lote"
                      >
                        <Users className="h-3 w-3 text-blue-400" />
                        <span className="text-[10px] font-black font-mono text-blue-400">
                          {getAssignedUsersLabel(selectedProperty.assignedUserIds, users)}
                        </span>
                      </button>

                      {isUserDropdownOpen && (
                        <div className="absolute right-0 mt-1.5 w-60 max-h-72 overflow-y-auto bg-[#1C1C1E] border border-[#2C2C2E] rounded-xl shadow-2xl z-30 p-2 scrollbar-thin space-y-1">
                          <div className="text-[9px] font-bold text-slate-400 uppercase tracking-wider font-mono px-2 py-1 border-b border-[#2C2C2E]/60 flex items-center justify-between">
                            <span>Vincular Usuários</span>
                            <UserCheck className="h-3 w-3 text-blue-400" />
                          </div>

                          {/* Option: Todos os Usuários */}
                          <button
                            type="button"
                            onClick={() => {
                              const isAllSelected = isAllUsersAssigned(selectedProperty.assignedUserIds, assignableUsers);
                              const newAssigned = isAllSelected ? ['none'] : ['all'];
                              updatePropertyAssignedUsers(selectedProperty.id, newAssigned);
                            }}
                            className={`w-full flex items-center gap-2 px-2.5 py-1.5 text-xs rounded-lg transition-colors cursor-pointer text-left ${
                              isAllUsersAssigned(selectedProperty.assignedUserIds, assignableUsers)
                                ? 'bg-blue-500/15 text-blue-300 font-bold border border-blue-500/30'
                                : 'text-slate-300 hover:bg-[#2C2C2E]'
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={isAllUsersAssigned(selectedProperty.assignedUserIds, assignableUsers)}
                              onChange={() => {}}
                              className="rounded border-slate-600 bg-[#2C2C2E] text-blue-500 focus:ring-0 cursor-pointer h-3.5 w-3.5"
                            />
                            <span className="font-semibold">Todos os Usuários</span>
                          </button>

                          <div className="h-px bg-[#2C2C2E] my-1" />

                          {/* List of Registered Users */}
                          {assignableUsers.length === 0 ? (
                            <div className="text-[10px] text-slate-500 italic p-2 text-center">
                              Nenhum usuário cadastrado.
                            </div>
                          ) : (
                            assignableUsers.map((u) => {
                              const isAssigned = isUserAssigned(selectedProperty.assignedUserIds, u.id, assignableUsers);
                              return (
                                <button
                                  key={u.id}
                                  type="button"
                                  onClick={() => {
                                    toggleUserAssignment(selectedProperty.id, u.id, selectedProperty.assignedUserIds, assignableUsers);
                                  }}
                                  className={`w-full flex items-center justify-between px-2.5 py-1.5 text-xs rounded-lg transition-colors cursor-pointer text-left ${
                                    isAssigned
                                      ? 'bg-blue-500/10 text-blue-200 font-semibold border border-blue-500/20'
                                      : 'text-slate-300 hover:bg-[#2C2C2E]'
                                  }`}
                                >
                                  <div className="flex items-center gap-2 truncate">
                                    <input
                                      type="checkbox"
                                      checked={isAssigned}
                                      onChange={() => {}}
                                      className="rounded border-slate-600 bg-[#2C2C2E] text-blue-500 focus:ring-0 cursor-pointer h-3.5 w-3.5"
                                    />
                                    <span className="truncate">{u.name || u.username}</span>
                                  </div>
                                  {u.role === 'admin' && (
                                    <span className="text-[8px] font-black uppercase tracking-wider bg-purple-500/20 text-purple-300 border border-purple-500/30 px-1.5 py-0.5 rounded ml-1 shrink-0">
                                      Admin
                                    </span>
                                  )}
                                </button>
                              );
                            })
                          )}
                        </div>
                      )}
                    </div>

                    <button
                      onClick={() => {
                        const targetState = !(isSpecsExpanded && isPortalExpanded && isNotesExpanded && isPricingExpanded && isChartExpanded && isRiskExpanded && isLiquidityExpanded && isTimelineExpanded);
                        setIsSpecsExpanded(targetState);
                        setIsPortalExpanded(targetState);
                        setIsNotesExpanded(targetState);
                        setIsPricingExpanded(targetState);
                        setIsChartExpanded(targetState);
                        setIsRiskExpanded(targetState);
                        setIsLiquidityExpanded(targetState);
                        setIsTimelineExpanded(targetState);
                      }}
                      className="p-1.5 text-zinc-450 hover:text-[#F8FAFC] hover:bg-[#1C1C1E] rounded-full transition-all cursor-pointer flex items-center justify-center"
                      title={
                        isSpecsExpanded && isPortalExpanded && isNotesExpanded && isPricingExpanded && isChartExpanded && isRiskExpanded && isLiquidityExpanded && isTimelineExpanded
                          ? "Recolher todas as abas"
                          : "Estender todas as abas"
                      }
                    >
                      <ChevronsUpDown className="h-4 w-4 text-emerald-450" />
                    </button>
                    <button
                      onClick={() => handleExportPDF(selectedProperty)}
                      className="p-1.5 text-zinc-450 hover:text-[#F8FAFC] hover:bg-[#1C1C1E] rounded-full transition-all cursor-pointer flex items-center justify-center"
                      title="Exportar Relatório PDF"
                    >
                      <FileDown className="h-4 w-4 text-emerald-400" />
                    </button>
                    {isAdmin && (
                      <button
                        onClick={(e) => {
                          handleEditLot(selectedProperty, e);
                          setShowDetails(false);
                        }}
                        className="p-1.5 text-zinc-450 hover:text-[#F8FAFC] hover:bg-[#1C1C1E] rounded-full transition-all cursor-pointer flex items-center justify-center"
                        title="Editar Imóvel"
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
                    )}
                    {isAdmin && (
                      <button
                        onClick={(e) => {
                          handleRemoveLot(selectedProperty.id, e);
                        }}
                        className="p-1.5 text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 rounded-full transition-all cursor-pointer flex items-center justify-center"
                        title="Excluir Imóvel"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                    <button
                      onClick={() => {
                        setShowDetails(false);
                        setIsNotesOpen(false);
                        setIsParticipationDropdownOpen(false);
                      }}
                      className="p-1.5 text-zinc-450 hover:text-[#F8FAFC] hover:bg-[#1C1C1E] rounded-full transition-all cursor-pointer flex items-center justify-center"
                      title="Fechar"
                    >
                      <X className="h-4.5 w-4.5" />
                    </button>
                  </div>
                </div>

                {/* Content Container (Centered max-w-4xl) */}
                <div className="max-w-4xl mx-auto w-full px-4 py-5 flex-1 space-y-5">
                  {/* Title and main location info */}
                  <div className="space-y-1 pb-1">
                    {(() => {
                      const { mainAddress, cityState } = getSplitLocation(selectedProperty.location);
                      return (
                        <>
                          <div className="flex items-center gap-2 flex-wrap mb-1">
                            {cityState && (
                              <span className="text-[#10B981] font-black text-sm md:text-base">{cityState}</span>
                            )}
                            <span className="bg-[#1C1C1E] text-slate-300 text-[10px] font-extrabold uppercase px-2 py-0.5 rounded font-mono tracking-wider border border-[#2C2C2E]">
                              {selectedProperty.typeText}
                            </span>
                          </div>
                          <h1 className="text-sm md:text-base font-black text-[#F8FAFC] leading-snug">{mainAddress}</h1>
                        </>
                      );
                    })()}
                  </div>

                  {/* Grid Layout: Left Column = Details, Right Column = Financials */}
                  <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-start">
                    {/* Left Column (7 cols on md) */}
                    <div className="md:col-span-7 space-y-4">
                      {/* Specifications Section */}
                      <div className="bg-[#1C1C1E]/60 rounded-xl p-4 border border-[#2C2C2E] transition-all shadow-3xs">
                        <div 
                          onClick={() => setIsSpecsExpanded(!isSpecsExpanded)}
                          className="flex items-center justify-between cursor-pointer select-none"
                        >
                          <div className="flex items-center gap-1.5">
                            <Building className="h-4 w-4 text-[#10B981]" />
                            <span className="text-[10px] font-black font-mono uppercase tracking-wider text-[#10B981]">Características do Imóvel</span>
                          </div>
                          <div className="flex items-center gap-2">
                            {isSpecsExpanded ? (
                              <ChevronUp className="h-3.5 w-3.5 text-slate-400" />
                            ) : (
                              <ChevronDown className="h-3.5 w-3.5 text-slate-400" />
                            )}
                          </div>
                        </div>

                        {isSpecsExpanded && (
                          <div className="mt-3.5 grid grid-cols-2 gap-y-2.5 gap-x-4 text-xs text-slate-300 font-medium pl-0.5 animate-fadeIn">
                            <div className="flex items-center gap-2">
                              <Building className="h-3.5 w-3.5 text-[#10B981] shrink-0" />
                              <span>Área: <strong className="text-[#F8FAFC] font-mono">{selectedProperty.area}</strong></span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Info className="h-3.5 w-3.5 text-[#10B981] shrink-0" />
                              <span>Ocupação: <strong className="text-[#F8FAFC] font-semibold">{selectedProperty.occupancyStatus}</strong></span>
                            </div>
                            {selectedProperty.bedrooms !== undefined && (
                              <div className="flex items-center gap-2">
                                <Bed className="h-3.5 w-3.5 text-[#10B981] shrink-0" />
                                <span>Dormitórios: <strong className="text-[#F8FAFC] font-mono">{selectedProperty.bedrooms}</strong></span>
                              </div>
                            )}
                            {selectedProperty.garage && (
                              <div className="flex items-center gap-2">
                                <Car className="h-3.5 w-3.5 text-[#10B981] shrink-0" />
                                <span>Garagem: <strong className="text-[#F8FAFC]">{selectedProperty.garage}</strong></span>
                              </div>
                            )}
                            {selectedProperty.registration && (
                              <div className="flex items-center gap-2">
                                <FileText className="h-3.5 w-3.5 text-[#10B981] shrink-0" />
                                <span>Matrícula: <strong className="text-[#F8FAFC] font-mono">{selectedProperty.registration}</strong></span>
                              </div>
                            )}
                            {selectedProperty.zone && (
                              <div className="flex items-center gap-2">
                                <Building className="h-3.5 w-3.5 text-[#10B981] shrink-0" />
                                <span>Zona: <strong className="text-[#F8FAFC] font-semibold">{selectedProperty.zone}</strong></span>
                              </div>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Portal/Leiloeiro Section */}
                      {(selectedProperty.portalName || selectedProperty.auctionDate || selectedProperty.arrematado) && (
                        <div className="bg-[#1C1C1E]/60 rounded-xl p-4 border border-[#2C2C2E] transition-all shadow-3xs">
                          <div 
                            onClick={() => setIsPortalExpanded(!isPortalExpanded)}
                            className="flex items-center justify-between cursor-pointer select-none"
                          >
                            <div className="flex items-center gap-1.5">
                              <Globe className="h-4 w-4 text-[#10B981]" />
                              <span className="text-[10px] font-black font-mono uppercase tracking-wider text-[#10B981]">Portal/Leiloeiro</span>
                            </div>
                            <div className="flex items-center gap-2">
                              {(() => {
                                const countdown = getAuctionCountdown(selectedProperty.auctionDate);
                                if (!countdown) return null;
                                
                                // Determine the badge style based on countdown status
                                let badgeStyle = "bg-amber-500/10 border-amber-500/25 text-amber-400";
                                if (countdown.isToday) {
                                  badgeStyle = "bg-emerald-500/10 border-emerald-500/25 text-[#10B981] animate-pulse";
                                } else if (countdown.text.includes('Encerrado')) {
                                  badgeStyle = "bg-zinc-500/10 border-zinc-500/25 text-zinc-400";
                                }
                                
                                return (
                                  <span className={`inline-flex items-center text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-full border leading-none shrink-0 ${badgeStyle}`}>
                                    {countdown.text}
                                  </span>
                                );
                              })()}
                              {isPortalExpanded ? (
                                <ChevronUp className="h-3.5 w-3.5 text-slate-400" />
                              ) : (
                                <ChevronDown className="h-3.5 w-3.5 text-slate-400" />
                              )}
                            </div>
                          </div>

                          {isPortalExpanded && (
                            <div className="mt-3.5 space-y-3.5 pl-0.5 animate-fadeIn">
                              <div className="grid grid-cols-2 gap-y-2.5 gap-x-4 text-xs text-slate-300 font-medium">
                                {selectedProperty.portalName && (
                                  <div className="flex items-center gap-2">
                                    <Globe className="h-3.5 w-3.5 text-[#10B981] shrink-0" />
                                    <span>Leiloeiro: <strong className="text-[#F8FAFC] font-semibold">{selectedProperty.portalName}</strong></span>
                                  </div>
                                )}
                                {selectedProperty.auctionDate && (
                                  <div className="flex items-center gap-2">
                                    <Calendar className="h-3.5 w-3.5 text-[#10B981] shrink-0" />
                                    <span>Data do Leilão: <strong className="text-[#F8FAFC] font-mono">{(() => {
                                      if (selectedProperty.auctionDate.includes('-')) {
                                        const [year, month, day] = selectedProperty.auctionDate.split('-');
                                        return `${day}/${month}/${year}`;
                                      }
                                      return selectedProperty.auctionDate;
                                    })()}</strong></span>
                                  </div>
                                )}
                              </div>

                              {/* Selector Button Group for Arrematado Sim x Não */}
                              <div className="pt-3 border-t border-[#2C2C2E]/60 flex items-center justify-between">
                                <div className="flex items-center gap-1.5 text-xs font-bold text-slate-300">
                                  <CheckSquare className="h-3.5 w-3.5 text-[#10B981]" />
                                  <span>Arrematado?</span>
                                </div>
                                <div className="flex bg-[#000000]/40 p-0.5 rounded-lg border border-[#2C2C2E]">
                                  <button
                                    type="button"
                                    onClick={() => handleToggleArrematado('Sim')}
                                    className={`px-3 py-1.5 rounded-md text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer ${
                                      selectedProperty.arrematado === 'Sim'
                                        ? 'bg-[#10B981] text-black shadow-xs font-black'
                                        : 'text-slate-400 hover:text-[#F8FAFC]'
                                    }`}
                                  >
                                    Sim
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleToggleArrematado('Não')}
                                    className={`px-3 py-1.5 rounded-md text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer ${
                                      selectedProperty.arrematado === 'Não'
                                        ? 'bg-[#EF4444] text-white shadow-xs font-black'
                                        : 'text-slate-400 hover:text-[#F8FAFC]'
                                    }`}
                                  >
                                    Não
                                  </button>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Personal Notes / Observations Box */}
                      <div className="bg-[#1C1C1E]/60 rounded-xl p-4 border border-[#2C2C2E] transition-all shadow-3xs">
                        <div 
                          onClick={() => {
                            setIsNotesExpanded(!isNotesExpanded);
                            if (!isNotesExpanded) {
                              setTempNotes(selectedProperty.notes || '');
                            }
                          }}
                          className="flex items-center justify-between cursor-pointer select-none"
                        >
                          <div className="flex items-center gap-1.5 text-emerald-400">
                            <StickyNote className="h-4 w-4" />
                            <span className="text-[10px] font-black font-mono uppercase tracking-wider text-[#10B981]">Anotações/Informações</span>
                          </div>
                          <div className="flex items-center gap-2">
                            {isNotesExpanded ? (
                              <ChevronUp className="h-3.5 w-3.5 text-slate-400" />
                            ) : (
                              <ChevronDown className="h-3.5 w-3.5 text-slate-400" />
                            )}
                          </div>
                        </div>

                        {isNotesExpanded && (
                          <div className="mt-3.5 space-y-3 animate-fadeIn">
                            {isEditingNotes ? (
                              <div className="space-y-2">
                                <textarea
                                  value={tempNotes}
                                  onChange={(e) => setTempNotes(e.target.value)}
                                  placeholder="Digite observações sobre o imóvel, processos, contatos do condomínio, taxas extras, etc..."
                                  className="w-full h-32 bg-[#000000]/30 border border-[#2C2C2E] rounded-xl p-3 text-xs text-[#F8FAFC] placeholder:text-zinc-550 focus:outline-none focus:ring-1 focus:ring-[#10B981] resize-none transition-all font-sans leading-relaxed"
                                  autoFocus
                                />
                                <div className="flex items-center justify-end gap-2">
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setIsEditingNotes(false);
                                      setTempNotes(selectedProperty.notes || '');
                                    }}
                                    className="px-3 py-1.5 rounded-lg text-[10px] font-bold text-slate-400 hover:text-[#F8FAFC] hover:bg-[#2C2C2E] transition-all cursor-pointer"
                                  >
                                    Cancelar
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleSaveNotes(tempNotes)}
                                    className="px-3.5 py-1.5 rounded-lg bg-[#10B981] hover:bg-[#10B981]/90 text-black text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer shadow-sm"
                                  >
                                    Salvar
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <div 
                                onClick={() => {
                                  if (isAdmin) {
                                    setTempNotes(selectedProperty.notes || '');
                                    setIsEditingNotes(true);
                                  }
                                }}
                                className={`bg-[#000000]/30 rounded-xl p-3 border border-[#2C2C2E]/60 transition-colors ${isAdmin ? 'hover:border-[#10B981]/40 cursor-pointer group' : ''}`}
                              >
                                {selectedProperty.notes ? (
                                  <p className="text-xs text-slate-300 font-medium leading-relaxed whitespace-pre-wrap">
                                    {selectedProperty.notes}
                                  </p>
                                ) : (
                                  <p className="text-xs text-slate-500 font-medium italic">
                                    Nenhuma anotação registrada.
                                  </p>
                                )}
                                {isAdmin && (
                                  <div className="mt-2 text-[9px] text-slate-500 font-mono flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <Pencil className="h-2.5 w-2.5 text-slate-400" />
                                    <span>Clique em cima para editar</span>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Right Column (5 cols on md) */}
                    <div className="md:col-span-5 space-y-4">
                      {/* Pricing block */}
                      <div className="bg-[#1C1C1E]/60 border border-[#2C2C2E] rounded-xl p-4 transition-all shadow-3xs space-y-3">
                        <div 
                          onClick={() => setIsPricingExpanded(!isPricingExpanded)}
                          className="flex items-center justify-between cursor-pointer select-none"
                        >
                          <div className="flex items-center gap-1.5">
                            <DollarSign className="h-4 w-4 text-[#10B981]" />
                            <span className="text-[10px] font-black font-mono uppercase tracking-wider text-[#10B981]">Valores de Referência</span>
                          </div>
                          <div className="flex items-center gap-2">
                            {selectedProperty.marketValue > 0 && (
                              <span className="inline-flex items-center text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-full border leading-none bg-emerald-500/10 text-[#10B981] border-emerald-500/20 shrink-0">
                                {selectedRealDiscount}% real
                              </span>
                            )}
                            {isPricingExpanded ? (
                              <ChevronUp className="h-3.5 w-3.5 text-slate-400" />
                            ) : (
                              <ChevronDown className="h-3.5 w-3.5 text-slate-400" />
                            )}
                          </div>
                        </div>

                        {isPricingExpanded && (
                          <div className="space-y-3 pt-1 animate-fadeIn">
                            <div className="grid grid-cols-2 gap-2.5">
                              <div className="bg-[#10B981]/10 p-3 rounded-xl border border-[#10B981]/30 text-center flex flex-col justify-center items-center">
                                <span className="text-[9px] text-[#10B981] block font-bold font-mono tracking-wider uppercase">VALOR DE MERCADO</span>
                                {editingCardField?.id === selectedProperty.id && editingCardField?.field === 'marketValue' ? (
                                  <input
                                    type="text"
                                    autoFocus
                                    value={editCardValue}
                                    onChange={(e) => setEditCardValue(e.target.value)}
                                    onBlur={() => handleQuickEditCardSave(selectedProperty.id, 'marketValue', editCardValue)}
                                    onKeyDown={(e) => {
                                      if (e.key === 'Enter') handleQuickEditCardSave(selectedProperty.id, 'marketValue', editCardValue);
                                      if (e.key === 'Escape') setEditingCardField(null);
                                    }}
                                    className="w-full text-xs text-center bg-[#1C1C1E] text-[#F8FAFC] border border-[#10B981] rounded px-1.5 py-1 mt-1 focus:outline-none focus:ring-1 focus:ring-emerald-500 font-bold font-mono"
                                  />
                                ) : (
                                  <span 
                                    onClick={() => {
                                      if (isAdmin) {
                                        setEditingCardField({ id: selectedProperty.id, field: 'marketValue' });
                                        setEditCardValue(selectedProperty.marketValue.toString());
                                      }
                                    }}
                                    className={`text-sm md:text-base font-black text-[#10B981] font-mono block mt-0.5 ${isAdmin ? 'cursor-pointer hover:text-emerald-400 hover:underline decoration-dotted flex items-center justify-center gap-1 group/field' : ''}`}
                                    title={isAdmin ? "Clique para editação rápida" : undefined}
                                  >
                                    {formatBRL(selectedProperty.marketValue)}
                                    {isAdmin && <Pencil className="h-2.5 w-2.5 opacity-0 group-hover/field:opacity-100 text-slate-500 transition-opacity" />}
                                  </span>
                                )}
                              </div>
                              <div className="bg-[#10B981]/10 p-3 rounded-xl border border-[#10B981]/30 text-center flex flex-col justify-center items-center">
                                <span className="text-[9px] text-[#10B981] block font-bold font-mono tracking-wider uppercase">VALOR LANCE</span>
                                {editingCardField?.id === selectedProperty.id && editingCardField?.field === 'suggestedBid' ? (
                                  <input
                                    type="text"
                                    autoFocus
                                    value={editCardValue}
                                    onChange={(e) => setEditCardValue(e.target.value)}
                                    onBlur={() => handleQuickEditCardSave(selectedProperty.id, 'suggestedBid', editCardValue)}
                                    onKeyDown={(e) => {
                                      if (e.key === 'Enter') handleQuickEditCardSave(selectedProperty.id, 'suggestedBid', editCardValue);
                                      if (e.key === 'Escape') setEditingCardField(null);
                                    }}
                                    className="w-full text-xs text-center bg-[#1C1C1E] text-[#10B981] border border-[#10B981] rounded px-1.5 py-1 mt-1 focus:outline-none focus:ring-1 focus:ring-emerald-500 font-bold font-mono"
                                  />
                                ) : (
                                  <span 
                                    onClick={() => {
                                      if (isAdmin) {
                                        setEditingCardField({ id: selectedProperty.id, field: 'suggestedBid' });
                                        setEditCardValue(selectedProperty.suggestedBid.toString());
                                      }
                                    }}
                                    className={`text-sm md:text-base font-black text-[#10B981] font-mono block mt-0.5 ${isAdmin ? 'cursor-pointer hover:text-emerald-400 hover:underline decoration-dotted flex items-center justify-center gap-1 group/field' : ''}`}
                                    title={isAdmin ? "Clique para editação rápida" : undefined}
                                  >
                                    {formatBRL(selectedProperty.suggestedBid)}
                                    {isAdmin && <Pencil className="h-2.5 w-2.5 opacity-0 group-hover/field:opacity-100 text-[#10B981] transition-opacity" />}
                                  </span>
                                )}
                                {editingCardField?.id === selectedProperty.id && editingCardField?.field === 'paymentDate_bid' ? (
                                  <input
                                    type="date"
                                    autoFocus
                                    value={editCardValue}
                                    onChange={(e) => setEditCardValue(e.target.value)}
                                    onBlur={() => handleQuickEditCardSave(selectedProperty.id, 'paymentDate_bid', editCardValue)}
                                    onKeyDown={(e) => {
                                      if (e.key === 'Enter') handleQuickEditCardSave(selectedProperty.id, 'paymentDate_bid', editCardValue);
                                      if (e.key === 'Escape') setEditingCardField(null);
                                    }}
                                    className="bg-[#1C1C1E] border border-[#10B981] text-[#F8FAFC] font-mono text-[9px] rounded px-1 py-0.5 mt-1.5 focus:outline-none w-28 text-center"
                                  />
                                ) : (
                                  <span
                                    onClick={() => {
                                      if (isAdmin) {
                                        setEditingCardField({ id: selectedProperty.id, field: 'paymentDate_bid' });
                                        setEditCardValue(selectedProperty.paymentDate_bid || '');
                                      }
                                    }}
                                    className={`text-[9px] text-slate-400 hover:text-emerald-400 flex items-center gap-1 mt-1 font-mono ${isAdmin ? 'cursor-pointer' : ''}`}
                                    title={isAdmin ? "Definir data de pagamento do lance" : undefined}
                                  >
                                    <Calendar className="h-2.5 w-2.5 shrink-0" />
                                    {selectedProperty.paymentDate_bid ? formatDateBR(selectedProperty.paymentDate_bid) : 'D+0 (Arrematação)'}
                                  </span>
                                )}
                                {selectedProperty.marketValue > 0 && selectedProperty.suggestedBid > 0 && (
                                  <span className="mt-1 text-[9px] font-extrabold text-[#10B981] bg-[#10B981]/10 px-2 py-0.5 rounded border border-[#10B981]/30">
                                    {Math.max(0, Math.round(((selectedProperty.marketValue - selectedProperty.suggestedBid) / selectedProperty.marketValue) * 100))}% desc. sugerido
                                  </span>
                                )}
                              </div>
                            </div>

                             {/* Cost Breakdown */}
                             <div className="pt-3 border-t border-dashed border-[#2C2C2E] space-y-1.5 text-slate-300 bg-[#1C1C1E]/60 p-3 rounded-xl border border-[#2C2C2E]">
                               {(() => {
                                 const itemsConfig = [
                                   {
                                     id: 'commission',
                                     field: 'commission' as const,
                                     label: `Comissão Leiloeiro (${selectedCommission}%)`,
                                     paymentDateField: 'paymentDate_commission' as const,
                                     fallbackOffset: 'D+0 (Imediato)',
                                     daysOffset: 0,
                                     inputLabel: 'Comissão Leiloeiro (%)',
                                     isPercent: true,
                                     value: selectedCommission,
                                     displayValue: formatBRL(selectedCommissionValue),
                                     hasValue: selectedCommissionValue > 0,
                                     editValue: selectedCommission.toString()
                                   },
                                   {
                                     id: 'iptu',
                                     field: 'iptu' as const,
                                     label: 'IPTU',
                                     paymentDateField: 'paymentDate_iptu' as const,
                                     fallbackOffset: 'D+15',
                                     daysOffset: 15,
                                     inputLabel: 'IPTU (R$)',
                                     isPercent: false,
                                     value: selectedProperty.iptu || 0,
                                     displayValue: formatBRL(selectedProperty.iptu || 0),
                                     hasValue: selectedProperty.iptu !== undefined && selectedProperty.iptu > 0,
                                     editValue: (selectedProperty.iptu || 0).toString()
                                   },
                                   {
                                     id: 'condominium',
                                     field: 'condominium' as const,
                                     label: 'Condomínio',
                                     paymentDateField: 'paymentDate_condominium' as const,
                                     fallbackOffset: 'D+30',
                                     daysOffset: 30,
                                     inputLabel: 'Condomínio (R$)',
                                     isPercent: false,
                                     value: selectedProperty.condominium || 0,
                                     displayValue: formatBRL(selectedProperty.condominium || 0),
                                     hasValue: selectedProperty.condominium !== undefined && selectedProperty.condominium > 0,
                                     editValue: (selectedProperty.condominium || 0).toString()
                                   },
                                   {
                                     id: 'registro',
                                     field: 'registro' as const,
                                     label: 'Registro de Imóvel / Cartório',
                                     paymentDateField: 'paymentDate_registro' as const,
                                     fallbackOffset: 'D+45',
                                     daysOffset: 45,
                                     inputLabel: 'Registro de Imóvel (R$)',
                                     isPercent: false,
                                     value: selectedProperty.registro || 0,
                                     displayValue: formatBRL(selectedProperty.registro || 0),
                                     hasValue: selectedProperty.registro !== undefined && selectedProperty.registro > 0,
                                     editValue: (selectedProperty.registro || 0).toString()
                                   },
                                   {
                                     id: 'itbi',
                                     field: 'itbi' as const,
                                     label: 'ITBI',
                                     paymentDateField: 'paymentDate_itbi' as const,
                                     fallbackOffset: 'D+30',
                                     daysOffset: 30,
                                     inputLabel: 'ITBI (R$)',
                                     isPercent: false,
                                     value: selectedProperty.itbi || 0,
                                     displayValue: formatBRL(selectedProperty.itbi || 0),
                                     hasValue: selectedProperty.itbi !== undefined && selectedProperty.itbi > 0,
                                     editValue: (selectedProperty.itbi || 0).toString()
                                   },
                                   {
                                     id: 'tabelionato',
                                     field: 'tabelionato' as const,
                                     label: 'Tabelionato / Escritura',
                                     paymentDateField: 'paymentDate_tabelionato' as const,
                                     fallbackOffset: 'D+30',
                                     daysOffset: 30,
                                     inputLabel: 'Tabelionato (R$)',
                                     isPercent: false,
                                     value: selectedProperty.tabelionato || 0,
                                     displayValue: formatBRL(selectedProperty.tabelionato || 0),
                                     hasValue: selectedProperty.tabelionato !== undefined && selectedProperty.tabelionato > 0,
                                     editValue: (selectedProperty.tabelionato || 0).toString()
                                   },
                                   {
                                     id: 'corretagem',
                                     field: 'corretagem' as const,
                                     label: `Corretagem (${selectedCorretagemPercent}%)`,
                                     paymentDateField: 'paymentDate_corretagem' as const,
                                     fallbackOffset: 'No encerramento',
                                     daysOffset: 180,
                                     inputLabel: 'Corretagem (%)',
                                     isPercent: true,
                                     value: selectedCorretagemPercent,
                                     displayValue: formatBRL(selectedCorretagemValue),
                                     hasValue: selectedCorretagemPercent > 0,
                                     editValue: selectedCorretagemPercent.toString()
                                   },
                                   {
                                     id: 'reforma',
                                     field: 'reforma' as const,
                                     label: 'Estimativa de Reforma',
                                     paymentDateField: 'paymentDate_reforma' as const,
                                     fallbackOffset: 'D+60',
                                     daysOffset: 60,
                                     inputLabel: 'Reforma (R$)',
                                     isPercent: false,
                                     value: selectedProperty.reforma || 0,
                                     displayValue: formatBRL(selectedProperty.reforma || 0),
                                     hasValue: selectedProperty.reforma !== undefined && selectedProperty.reforma > 0,
                                     editValue: (selectedProperty.reforma || 0).toString()
                                   },
                                   {
                                     id: 'desocupacao',
                                     field: 'desocupacao' as const,
                                     label: 'Custo Desocupação / Advogado',
                                     paymentDateField: 'paymentDate_desocupacao' as const,
                                     fallbackOffset: 'D+90',
                                     daysOffset: 90,
                                     inputLabel: 'Desocupação (R$)',
                                     isPercent: false,
                                     value: selectedProperty.desocupacao || 0,
                                     displayValue: formatBRL(selectedProperty.desocupacao || 0),
                                     hasValue: selectedProperty.desocupacao !== undefined && selectedProperty.desocupacao > 0,
                                     editValue: (selectedProperty.desocupacao || 0).toString()
                                   },
                                   {
                                     id: 'parcela_emprestimo',
                                     field: 'parcela_emprestimo' as const,
                                     label: 'Parcela Empréstimo',
                                     paymentDateField: 'paymentDate_parcela_emprestimo' as const,
                                     fallbackOffset: 'D+30',
                                     daysOffset: 30,
                                     inputLabel: 'Parcela Empréstimo (R$)',
                                     isPercent: false,
                                     value: selectedProperty.parcela_emprestimo || 0,
                                     displayValue: formatBRL(selectedProperty.parcela_emprestimo || 0),
                                     hasValue: selectedProperty.parcela_emprestimo !== undefined && selectedProperty.parcela_emprestimo > 0,
                                     editValue: (selectedProperty.parcela_emprestimo || 0).toString()
                                   },
                                   {
                                     id: 'quitacao_emprestimo',
                                     field: 'quitacao_emprestimo' as const,
                                     label: 'Quitação Empréstimo',
                                     paymentDateField: 'paymentDate_quitacao_emprestimo' as const,
                                     fallbackOffset: 'D+180 (Venda)',
                                     daysOffset: 180,
                                     inputLabel: 'Quitação Empréstimo (R$)',
                                     isPercent: false,
                                     value: selectedProperty.quitacao_emprestimo || 0,
                                     displayValue: formatBRL(selectedProperty.quitacao_emprestimo || 0),
                                     hasValue: selectedProperty.quitacao_emprestimo !== undefined && selectedProperty.quitacao_emprestimo > 0,
                                     editValue: (selectedProperty.quitacao_emprestimo || 0).toString()
                                   },
                                   {
                                     id: 'emprestimo',
                                     field: 'emprestimo' as const,
                                     label: 'Empréstimo (Receita)',
                                     paymentDateField: 'paymentDate_emprestimo' as const,
                                     fallbackOffset: 'D+0 (Arrematação)',
                                     daysOffset: 0,
                                     inputLabel: 'Empréstimo (R$)',
                                     isPercent: false,
                                     isIncome: true,
                                     value: selectedProperty.emprestimo || 0,
                                     displayValue: `+ ${formatBRL(selectedProperty.emprestimo || 0)}`,
                                     hasValue: selectedProperty.emprestimo !== undefined && selectedProperty.emprestimo > 0,
                                     editValue: (selectedProperty.emprestimo || 0).toString()
                                   }
                                 ];

                                 const predefinedOffsets: Record<string, { daysOffset: number; fallbackOffset: string }> = {
                                   'Comissão Leiloeiro': { daysOffset: 0, fallbackOffset: 'D+0 (Imediato)' },
                                   'IPTU': { daysOffset: 15, fallbackOffset: 'D+15' },
                                   'Condomínio': { daysOffset: 30, fallbackOffset: 'D+30' },
                                   'Tabelionato / Escritura': { daysOffset: 30, fallbackOffset: 'D+30' },
                                   'Registro de Imóvel / Cartório': { daysOffset: 45, fallbackOffset: 'D+45' },
                                   'ITBI': { daysOffset: 30, fallbackOffset: 'D+30' },
                                   'Corretagem': { daysOffset: 180, fallbackOffset: 'No encerramento' },
                                   'Reforma': { daysOffset: 60, fallbackOffset: 'D+60' },
                                   'Desocupação / Advogado': { daysOffset: 90, fallbackOffset: 'D+90' },
                                   'Parcela Empréstimo': { daysOffset: 30, fallbackOffset: 'D+30' },
                                   'Quitação Empréstimo': { daysOffset: 180, fallbackOffset: 'D+180 (Venda)' },
                                   'Empréstimo (Receita)': { daysOffset: 0, fallbackOffset: 'D+0 (Arrematação)' },
                                 };

                                 const customItems = (selectedProperty.customExpenses || []).map(exp => {
                                   const matched = predefinedOffsets[exp.name] || { daysOffset: 30, fallbackOffset: 'D+30' };
                                   return {
                                     id: exp.id,
                                     field: `custom_expense_value_${exp.id}` as any,
                                     label: exp.name,
                                     paymentDateField: `custom_expense_date_${exp.id}` as any,
                                     fallbackOffset: matched.fallbackOffset,
                                     daysOffset: matched.daysOffset,
                                     inputLabel: `${exp.name} (R$)`,
                                     isPercent: false,
                                     value: exp.value || 0,
                                     displayValue: formatBRL(exp.value || 0),
                                     hasValue: exp.value !== undefined && exp.value > 0,
                                     editValue: (exp.value || 0).toString(),
                                     isCustom: true,
                                     paymentDate: exp.paymentDate || ''
                                   };
                                 });

                                 const allItems = [...itemsConfig, ...customItems];

                                 // Filter only items that have values OR are currently being edited (either value or date)
                                 const activeItems = allItems.filter(item => {
                                   const isEditingValue = editingCardField?.id === selectedProperty.id && editingCardField?.field === item.field;
                                   const isEditingDate = editingCardField?.id === selectedProperty.id && editingCardField?.field === item.paymentDateField;
                                   return item.hasValue || isEditingValue || isEditingDate;
                                 });

                                 const sortedItems = [...activeItems].sort((a, b) => {
                                   const dateA = getTransactionDate(a.paymentDateField, a.daysOffset, selectedProperty);
                                   const dateB = getTransactionDate(b.paymentDateField, b.daysOffset, selectedProperty);
                                   return dateA.getTime() - dateB.getTime();
                                 });

                                 if (sortedItems.length === 0) {
                                   return (
                                     <div className="text-center py-4 text-slate-500 text-xs italic">
                                       Nenhuma despesa adicionada. Clique no botão abaixo para incluir.
                                     </div>
                                   );
                                 }

                                 return sortedItems.map((item) => {
                                   const isEditingValue = editingCardField?.id === selectedProperty.id && editingCardField?.field === item.field;
                                   const isEditingDate = editingCardField?.id === selectedProperty.id && editingCardField?.field === item.paymentDateField;
                                   const dateValue = item.isCustom
                                     ? (item as any).paymentDate
                                     : (selectedProperty as any)[item.paymentDateField] || '';

                                   if (isEditingValue) {
                                     return (
                                       <div key={item.id} className="flex items-center justify-between text-[11px] bg-[#1C1C1E] border border-[#10B981] p-1.5 rounded-lg -mx-1.5 animate-fadeIn">
                                         <span className="text-[#10B981] font-bold">{item.inputLabel}</span>
                                         <input
                                           type="text"
                                           autoFocus
                                           value={editCardValue}
                                           onChange={(e) => setEditCardValue(e.target.value)}
                                           onBlur={() => handleQuickEditCardSave(selectedProperty.id, item.field, editCardValue)}
                                           onKeyDown={(e) => {
                                             if (e.key === 'Enter') handleQuickEditCardSave(selectedProperty.id, item.field, editCardValue);
                                             if (e.key === 'Escape') setEditingCardField(null);
                                           }}
                                           className="w-24 text-right bg-transparent text-[#F8FAFC] focus:outline-none font-mono text-xs font-bold"
                                         />
                                       </div>
                                     );
                                   }

                                   return (
                                     <div 
                                       key={item.id}
                                       className="flex items-center justify-between text-[11px] font-semibold text-slate-400 group/row hover:bg-[#2C2C2E]/40 px-1.5 py-1 -mx-1.5 rounded-lg transition-all"
                                     >
                                       <div className="flex flex-col gap-0.5">
                                         <span 
                                           onClick={() => {
                                             if (isAdmin) {
                                               setEditingCardField({ id: selectedProperty.id, field: item.field });
                                               setEditCardValue(item.editValue);
                                             }
                                           }}
                                           className={`flex items-center gap-1 ${isAdmin ? 'cursor-pointer hover:text-emerald-400' : ''}`}
                                           title={isAdmin ? `Clique para editar ${item.inputLabel}` : undefined}
                                         >
                                           {item.label}
                                           {isAdmin && <Pencil className="h-2.5 w-2.5 text-slate-500 opacity-0 group-hover/row:opacity-100 transition-opacity shrink-0" />}
                                         </span>
                                         {isEditingDate ? (
                                           <input
                                             type="date"
                                             autoFocus
                                             value={editCardValue}
                                             onChange={(e) => setEditCardValue(e.target.value)}
                                             onBlur={() => handleQuickEditCardSave(selectedProperty.id, item.paymentDateField, editCardValue)}
                                             onKeyDown={(e) => {
                                               if (e.key === 'Enter') handleQuickEditCardSave(selectedProperty.id, item.paymentDateField, editCardValue);
                                               if (e.key === 'Escape') setEditingCardField(null);
                                             }}
                                             className="bg-[#1C1C1E] border border-[#10B981] text-[#F8FAFC] font-mono text-[9px] rounded px-1 py-0.5 mt-0.5 focus:outline-none w-28"
                                           />
                                         ) : (
                                           <span
                                             onClick={() => {
                                               if (isAdmin) {
                                                 setEditingCardField({ id: selectedProperty.id, field: item.paymentDateField });
                                                 setEditCardValue(dateValue);
                                               }
                                             }}
                                             className={`text-[9px] text-slate-500 hover:text-[#10B981] flex items-center gap-1 mt-0.5 ${isAdmin ? 'cursor-pointer' : ''}`}
                                             title={isAdmin ? "Definir data de pagamento" : undefined}
                                           >
                                             <Calendar className="h-2.5 w-2.5 shrink-0" />
                                             {dateValue ? formatDateBR(dateValue) : item.fallbackOffset}
                                           </span>
                                         )}
                                       </div>
                                       <div className="flex items-center gap-1.5 self-start mt-0.5">
                                         {item.hasValue ? (
                                           <strong 
                                             onClick={() => {
                                               if (isAdmin) {
                                                 setEditingCardField({ id: selectedProperty.id, field: item.field });
                                                 setEditCardValue(item.editValue);
                                               }
                                             }}
                                             className={`text-[#F8FAFC] font-mono text-xs font-medium ${isAdmin ? 'cursor-pointer hover:text-[#10B981] hover:underline decoration-dotted' : ''}`}
                                             title={isAdmin ? `Clique para editar ${item.inputLabel}` : undefined}
                                           >
                                             {item.displayValue}
                                           </strong>
                                         ) : (
                                           <span 
                                             onClick={() => {
                                               if (isAdmin) {
                                                 setEditingCardField({ id: selectedProperty.id, field: item.field });
                                                 setEditCardValue(item.editValue);
                                               }
                                             }}
                                             className="text-slate-500 font-mono text-[10px] font-extrabold uppercase tracking-wider hover:text-[#10B981] transition-colors cursor-pointer"
                                           >
                                             {item.field === 'corretagem' ? '+ Definir %' : '+ Definir'}
                                           </span>
                                         )}

                                         {isAdmin && (
                                           <button
                                             onClick={(e) => {
                                               e.stopPropagation();
                                               handleRemoveCostItem(item.field);
                                             }}
                                             className="opacity-0 group-hover/row:opacity-100 p-0.5 hover:text-red-400 text-slate-500 rounded transition-all shrink-0 cursor-pointer"
                                             title="Excluir despesa"
                                           >
                                             <Trash2 className="h-3.5 w-3.5" />
                                           </button>
                                         )}
                                       </div>
                                     </div>
                                   );
                                 });
                               })()}

                               {/* Add Cost Item Button / Dropdown */}
                               {isAdmin && (
                                 <div className="pt-2 border-t border-[#2C2C2E]/60" onClick={(e) => e.stopPropagation()}>
                                   {!showAddCostSelector ? (
                                     <button
                                       onClick={() => {
                                         setShowAddCostSelector(true);
                                         setIsCustomCostSelected(false);
                                         setCustomCostName('');
                                       }}
                                       className="w-full py-1.5 border border-dashed border-[#2C2C2E] hover:border-[#10B981]/50 text-slate-400 hover:text-emerald-400 text-[10px] font-bold uppercase tracking-wider rounded-lg flex items-center justify-center gap-1.5 transition-all bg-[#1C1C1E]/40"
                                     >
                                       <Plus className="h-3.5 w-3.5 text-emerald-400" />
                                       Adicionar Despesa
                                     </button>
                                   ) : (
                                     <div className="bg-[#1C1C1E] border border-[#2C2C2E] p-2.5 rounded-lg space-y-2.5">
                                       <div className="flex items-center justify-between">
                                         <span className="text-[10px] font-extrabold uppercase text-slate-400 tracking-wider">Nova Despesa</span>
                                         <button
                                           onClick={() => setShowAddCostSelector(false)}
                                           className="text-slate-500 hover:text-slate-300 transition-colors cursor-pointer"
                                         >
                                           <X className="h-3.5 w-3.5" />
                                         </button>
                                       </div>

                                       {!isCustomCostSelected ? (
                                         <div className="space-y-1.5">
                                           <span className="text-[9px] text-slate-500 font-bold uppercase tracking-wider block">Selecione uma opção pré-definida:</span>
                                           <div className="grid grid-cols-1 gap-1 max-h-40 overflow-y-auto pr-1">
                                             {[
                                               { label: 'Comissão Leiloeiro', field: 'commission', daysOffset: 0 },
                                               { label: 'IPTU', field: 'iptu', daysOffset: 15 },
                                               { label: 'Condomínio', field: 'condominium', daysOffset: 30 },
                                               { label: 'Tabelionato / Escritura', field: 'tabelionato', daysOffset: 30 },
                                               { label: 'Registro de Imóvel / Cartório', field: 'registro', daysOffset: 45 },
                                               { label: 'ITBI', field: 'itbi', daysOffset: 30 },
                                               { label: 'Corretagem', field: 'corretagem', daysOffset: 180 },
                                               { label: 'Reforma', field: 'reforma', daysOffset: 60 },
                                               { label: 'Desocupação / Advogado', field: 'desocupacao', daysOffset: 90 },
                                               { label: 'Parcela Empréstimo', field: 'parcela_emprestimo', daysOffset: 30 },
                                               { label: 'Quitação Empréstimo', field: 'quitacao_emprestimo', daysOffset: 180 },
                                               { label: 'Empréstimo (Receita)', field: 'emprestimo', daysOffset: 0 },
                                             ].map((opt) => {
                                               const isAlreadyActive = opt.field === 'commission' 
                                                 ? selectedCommissionValue > 0 
                                                 : opt.field === 'corretagem' 
                                                   ? selectedCorretagemValue > 0 
                                                   : (selectedProperty as any)[opt.field] > 0;

                                               return (
                                                 <button
                                                   key={opt.field}
                                                   onClick={() => {
                                                     if (isAlreadyActive) {
                                                       const newExpId = Date.now().toString();
                                                       const defaultDate = calculateDefaultDateStr(opt.daysOffset, selectedProperty);
                                                       const newExp = { id: newExpId, name: opt.label, value: 0, paymentDate: defaultDate };
                                                       const updater = (prev: ImovelLot | null) => {
                                                         if (!prev) return null;
                                                         return { ...prev, customExpenses: [...(prev.customExpenses || []), newExp] };
                                                       };
                                                       if (analyzedLot && selectedProperty.id === analyzedLot.id) {
                                                         setAnalyzedLot(updater);
                                                       }
                                                       setProperties(prev => prev.map(item => item.id === selectedProperty.id ? updater(item)! : item));

                                                       setEditingCardField({ id: selectedProperty.id, field: `custom_expense_value_${newExpId}` });
                                                       setEditCardValue('');
                                                       setShowAddCostSelector(false);
                                                     } else {
                                                       setEditingCardField({ id: selectedProperty.id, field: opt.field });
                                                       if (opt.field === 'commission') {
                                                         setEditCardValue(selectedCommission.toString());
                                                       } else if (opt.field === 'corretagem') {
                                                         setEditCardValue(selectedCorretagemPercent.toString());
                                                       } else {
                                                         setEditCardValue(((selectedProperty as any)[opt.field] || 0).toString());
                                                       }
                                                       setShowAddCostSelector(false);
                                                     }
                                                   }}
                                                   className="text-left px-2 py-1.5 text-[11px] rounded transition-all flex items-center justify-between bg-[#2C2C2E]/40 hover:bg-[#2C2C2E] text-slate-300 cursor-pointer"
                                                 >
                                                   <span>{opt.label}</span>
                                                   {isAlreadyActive && (
                                                     <span className="text-[9px] uppercase font-extrabold text-amber-500 bg-amber-500/10 px-1.5 py-0.5 rounded border border-amber-500/20">
                                                       Incluir mais um
                                                     </span>
                                                   )}
                                                 </button>
                                               );
                                             })}

                                             <button
                                               onClick={() => {
                                                 setIsCustomCostSelected(true);
                                                 setCustomCostName('');
                                               }}
                                               className="text-left px-2 py-1.5 text-[11px] rounded bg-emerald-950/40 hover:bg-[#10B981]/20 text-emerald-400 font-bold border border-emerald-900/30 transition-all text-center flex items-center justify-center gap-1 cursor-pointer"
                                             >
                                               <Plus className="h-3 w-3" />
                                               <span>Outros (Personalizada)...</span>
                                             </button>
                                           </div>
                                         </div>
                                       ) : (
                                         <div className="space-y-2">
                                           <span className="text-[9px] text-slate-500 font-bold uppercase tracking-wider block">Nome do item personalizado:</span>
                                           <input
                                             type="text"
                                             autoFocus
                                             placeholder="Ex: Custas Judiciais"
                                             value={customCostName}
                                             onChange={(e) => setCustomCostName(e.target.value)}
                                             onKeyDown={(e) => {
                                               if (e.key === 'Enter' && customCostName.trim()) {
                                                 const newExpId = Date.now().toString();
                                                 const newExp = { id: newExpId, name: customCostName.trim(), value: 0 };
                                                 const updater = (prev: ImovelLot | null) => {
                                                   if (!prev) return null;
                                                   return { ...prev, customExpenses: [...(prev.customExpenses || []), newExp] };
                                                 };
                                                 if (analyzedLot && selectedProperty.id === analyzedLot.id) {
                                                   setAnalyzedLot(updater);
                                                 }
                                                 setProperties(prev => prev.map(item => item.id === selectedProperty.id ? updater(item)! : item));

                                                 setEditingCardField({ id: selectedProperty.id, field: `custom_expense_value_${newExpId}` });
                                                 setEditCardValue('');
                                                 setShowAddCostSelector(false);
                                               }
                                             }}
                                             className="w-full bg-[#2C2C2E] border border-[#2C2C2E] focus:border-[#10B981] text-[#F8FAFC] text-[11px] rounded px-2.5 py-1.5 focus:outline-none placeholder-slate-500 font-mono"
                                           />
                                           <div className="flex items-center gap-2 pt-1">
                                             <button
                                               onClick={() => {
                                                 if (customCostName.trim()) {
                                                   const newExpId = Date.now().toString();
                                                   const newExp = { id: newExpId, name: customCostName.trim(), value: 0 };
                                                   const updater = (prev: ImovelLot | null) => {
                                                     if (!prev) return null;
                                                     return { ...prev, customExpenses: [...(prev.customExpenses || []), newExp] };
                                                   };
                                                   if (analyzedLot && selectedProperty.id === analyzedLot.id) {
                                                     setAnalyzedLot(updater);
                                                   }
                                                   setProperties(prev => prev.map(item => item.id === selectedProperty.id ? updater(item)! : item));

                                                   setEditingCardField({ id: selectedProperty.id, field: `custom_expense_value_${newExpId}` });
                                                   setEditCardValue('');
                                                   setShowAddCostSelector(false);
                                                 }
                                               }}
                                               disabled={!customCostName.trim()}
                                               className="flex-1 py-1 bg-[#10B981] hover:bg-[#059669] disabled:bg-[#2C2C2E] disabled:text-slate-500 text-black font-extrabold text-[10px] uppercase tracking-wider rounded transition-colors cursor-pointer"
                                             >
                                               Adicionar
                                             </button>
                                             <button
                                               onClick={() => setIsCustomCostSelected(false)}
                                               className="flex-1 py-1 bg-transparent border border-[#2C2C2E] text-slate-400 font-extrabold text-[10px] uppercase tracking-wider rounded transition-colors cursor-pointer"
                                             >
                                               Voltar
                                             </button>
                                           </div>
                                         </div>
                                       )}
                                     </div>
                                   )}
                                 </div>
                               )}
                            {/* Total and Real Discount */}
                              <div className="pt-2 border-t border-[#2C2C2E] space-y-1.5">
                                <div className="flex items-center justify-between text-xs font-extrabold text-slate-300">
                                  <span>Custo Total Estimado</span>
                                  <strong className="text-[#F8FAFC] font-mono text-sm font-black">
                                    {formatBRL(selectedTotalCost)}
                                  </strong>
                                </div>
                                <div className="flex items-center justify-between text-[11px] font-bold text-slate-400">
                                  <span>Custo Estimado Total Participação ({participationPercent}%)</span>
                                  <strong className="text-emerald-400 font-mono text-xs font-black">
                                    {formatBRL(selectedTotalCost * (participationPercent / 100))}
                                  </strong>
                                </div>
                                {selectedProperty.marketValue > 0 && (
                                  <div className="flex items-center justify-between text-[11px] font-bold text-slate-400">
                                    <span>Desconto Real (Avaliação)</span>
                                    <span className={`px-1.5 py-0.5 rounded text-[10px] font-black leading-none ${selectedRealDiscount >= 0 ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-800/40' : 'bg-red-500/20 text-red-400 border border-red-500/30'}`}>
                                      {selectedRealDiscount}% real
                                    </span>
                                  </div>
                                )}
                                {selectedEmprestimoValue > 0 && (
                                  <div className="mt-2 pt-2 border-t border-[#2C2C2E]/60 space-y-1 bg-[#1C1C1E]/50 p-2 rounded-lg border border-[#2C2C2E]/40">
                                    <div className="text-[10px] uppercase font-extrabold text-slate-400 tracking-wider mb-1.5 flex items-center justify-between">
                                      <span>Fontes de Financiamento (Aquisição/Holding)</span>
                                      <span className="text-emerald-400 font-mono text-[9px] lowercase font-normal">ROI proporcional ao capital próprio</span>
                                    </div>
                                    <div className="flex items-center justify-between text-[11px] text-slate-300">
                                      <span className="flex items-center gap-1.5">
                                        <span className="h-2 w-2 rounded-full bg-emerald-500 inline-block"></span>
                                        <span>Capital Próprio ({selectedUpfrontCosts > 0 ? Math.round((selectedCapitalProprio / selectedUpfrontCosts) * 100) : 0}%)</span>
                                      </span>
                                      <strong className="text-slate-100 font-mono">{formatBRL(selectedCapitalProprio)}</strong>
                                    </div>
                                    <div className="flex items-center justify-between text-[11px] text-slate-300">
                                      <span className="flex items-center gap-1.5">
                                        <span className="h-2 w-2 rounded-full bg-blue-500 inline-block"></span>
                                        <span>Recursos de Terceiros ({selectedUpfrontCosts > 0 ? Math.round((selectedRecursosTerceiros / selectedUpfrontCosts) * 100) : 0}%)</span>
                                      </span>
                                      <strong className="text-slate-100 font-mono">{formatBRL(selectedRecursosTerceiros)}</strong>
                                    </div>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* ROI Potential Chart */}
                      <RoiPotentialChart
                        marketValue={selectedProperty.marketValue}
                        suggestedBid={selectedProperty.suggestedBid}
                        commission={selectedCommission}
                        iptu={selectedIptuValue}
                        condominium={selectedCondominiumValue}
                        registro={selectedRegistroValue}
                        itbi={selectedItbiValue}
                        tabelionato={selectedTabelionatoValue}
                        corretagem={selectedCorretagemPercent}
                        reforma={selectedReformaValue}
                        desocupacao={selectedDesocupacaoValue}
                        parcela_emprestimo={selectedParcelaEmprestimoValue}
                        quitacao_emprestimo={selectedQuitacaoEmprestimoValue}
                        emprestimo={selectedEmprestimoValue}
                        customExpenses={selectedProperty.customExpenses || []}
                        initialSaleValue={selectedProperty.saleValue}
                        onSaleValueChange={(val) => {
                          if (analyzedLot && selectedId === analyzedLot.id) {
                            setAnalyzedLot(prev => prev ? { ...prev, saleValue: val } : null);
                          } else {
                            setProperties(prev => prev.map(p => p.id === selectedProperty.id ? { ...p, saleValue: val } : p));
                          }
                        }}
                        initialSaleDate={selectedProperty.paymentDate_sale}
                        initialBidDate={selectedProperty.paymentDate_bid || selectedProperty.auctionDate}
                        onSaleDateChange={(date) => {
                          if (analyzedLot && selectedId === analyzedLot.id) {
                            setAnalyzedLot(prev => prev ? { ...prev, paymentDate_sale: date } : null);
                          } else {
                            setProperties(prev => prev.map(p => p.id === selectedProperty.id ? { ...p, paymentDate_sale: date } : p));
                          }
                        }}
                        isExpanded={isChartExpanded}
                        onToggle={() => setIsChartExpanded(!isChartExpanded)}
                        participationPercent={participationPercent}
                      />

                      {/* Cash Flow Timeline & Time Value of Money */}
                      <CashFlowTimeline
                        property={selectedProperty}
                        participationPercent={participationPercent}
                        isExpanded={isTimelineExpanded}
                        onToggle={() => setIsTimelineExpanded(!isTimelineExpanded)}
                      />

                      {/* Nível de Risco Section */}
                      {(() => {
                        const risk = calculateRiskLevel(selectedProperty);
                        const RiskIcon = risk.label === 'Baixo' ? ShieldCheck : ShieldAlert;
                        return (
                          <div className="bg-[#1C1C1E]/60 rounded-xl p-4 border border-[#2C2C2E] transition-all shadow-3xs">
                            <div 
                              onClick={() => setIsRiskExpanded(!isRiskExpanded)}
                              className="flex items-center justify-between cursor-pointer select-none"
                            >
                              <div className="flex items-center gap-1.5">
                                <RiskIcon className={`h-4 w-4 ${risk.label === 'Alto' ? 'text-rose-400' : risk.label === 'Médio' ? 'text-amber-400' : 'text-[#10B981]'}`} />
                                <span className="text-[10px] font-black font-mono uppercase tracking-wider text-[#10B981]">Análise Operacional de Risco</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <span className={`inline-flex items-center text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-full border leading-none shrink-0 ${risk.bgColor}`}>
                                  Risco {risk.label}
                                </span>
                                {isRiskExpanded ? (
                                  <ChevronUp className="h-3.5 w-3.5 text-slate-400" />
                                ) : (
                                  <ChevronDown className="h-3.5 w-3.5 text-slate-400" />
                                )}
                              </div>
                            </div>

                            {isRiskExpanded && (
                              <div className="space-y-3 mt-3 animate-fadeIn">
                                <div className="space-y-1.5 bg-[#000000]/30 rounded-xl p-3 border border-[#2C2C2E]/60">
                                  <div className="flex justify-between items-center">
                                    <span className="text-xs font-bold text-slate-300">Índice Geral de Risco</span>
                                    <span className={`text-sm font-mono font-black ${risk.scoreColor}`}>{risk.score}/100</span>
                                  </div>
                                  <div className="w-full bg-[#2C2C2E] rounded-full h-2 overflow-hidden">
                                    <div 
                                      className={`h-full transition-all duration-500 rounded-full ${risk.barColor}`}
                                      style={{ width: `${risk.score}%` }}
                                    />
                                  </div>
                                  <p className="text-[10px] text-slate-450 leading-relaxed font-medium pt-0.5">
                                    {risk.label === 'Baixo' 
                                      ? '✓ Este lote possui ótimos indicadores jurídicos e operacionais, minimizando riscos de liquidez ou atraso.' 
                                      : risk.label === 'Médio'
                                      ? '⚠ Recomenda-se cautela. Há fatores que requerem diligência moderada (como ocupação ou despesas pendentes).'
                                      : '🚨 Alerta de Alto Risco. Fatores cumulativos sugerem alto custo operacional ou judicial. Analise detalhadamente o edital.'}
                                  </p>
                                </div>

                                <div className="space-y-2">
                                  <span className="text-[9px] text-slate-400 block font-bold font-mono tracking-wider uppercase">Fatores Analisados:</span>
                                  <div className="space-y-1.5 pl-0.5">
                                    {risk.factors.map((factor, index) => (
                                      <div key={index} className="flex items-start gap-2 text-[11px] leading-tight">
                                        <span className={`mt-0.5 text-xs font-bold shrink-0 ${factor.isGood ? 'text-[#10B981]' : 'text-slate-500'}`}>
                                          {factor.isGood ? '✓' : '•'}
                                        </span>
                                        <div className="flex-1 flex justify-between gap-2">
                                          <span className={factor.isGood ? 'text-slate-400' : 'text-slate-300 font-medium'}>
                                            {factor.text}
                                          </span>
                                          {factor.points > 0 && (
                                            <span className="font-mono text-[10px] text-slate-500 shrink-0">
                                              +{factor.points} pts
                                            </span>
                                          )}
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })()}

                      {/* Liquidez de Mercado Section */}
                      {(() => {
                        const liquidity = calculateMarketLiquidity(selectedProperty);
                        return (
                          <div className="bg-[#1C1C1E]/60 rounded-xl p-4 border border-[#2C2C2E] transition-all shadow-3xs">
                            <div 
                              onClick={() => setIsLiquidityExpanded(!isLiquidityExpanded)}
                              className="flex items-center justify-between cursor-pointer select-none"
                            >
                              <div className="flex items-center gap-1.5">
                                <TrendingUp className={`h-4 w-4 ${liquidity.level === 'Altíssima' || liquidity.level === 'Alta' ? 'text-emerald-400' : liquidity.level === 'Média' ? 'text-amber-400' : 'text-rose-400'}`} />
                                <span className="text-[10px] font-black font-mono uppercase tracking-wider text-[#10B981]">Liquidez de Mercado</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <span className={`inline-flex items-center text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-full border leading-none shrink-0 ${liquidity.bgColor}`}>
                                  Giro {liquidity.level}
                                </span>
                                {isLiquidityExpanded ? (
                                  <ChevronUp className="h-3.5 w-3.5 text-slate-400" />
                                ) : (
                                  <ChevronDown className="h-3.5 w-3.5 text-slate-400" />
                                )}
                              </div>
                            </div>

                            {isLiquidityExpanded && (
                              <div className="space-y-3 mt-3 animate-fadeIn">
                                {/* Estimated Resale Time Highlight */}
                                <div className="bg-[#10B981]/5 rounded-xl p-3 border border-[#10B981]/15 text-center flex flex-col justify-center items-center">
                                  <span className="text-[9px] text-[#10B981] block font-bold font-mono tracking-wider uppercase">PRAZO ESTIMADO DE REVENDA</span>
                                  <span className="text-base font-black text-[#10B981] font-mono block mt-0.5">{liquidity.prazoTexto}</span>
                                </div>

                                <div className="space-y-1.5 bg-[#000000]/30 rounded-xl p-3 border border-[#2C2C2E]/60">
                                  <div className="flex justify-between items-center">
                                    <span className="text-xs font-bold text-slate-300">Índice Geral de Liquidez</span>
                                    <span className={`text-sm font-mono font-black ${liquidity.level === 'Altíssima' || liquidity.level === 'Alta' ? 'text-emerald-400' : liquidity.level === 'Média' ? 'text-amber-400' : 'text-rose-400'}`}>{liquidity.score}/100</span>
                                  </div>
                                  <div className="w-full bg-[#2C2C2E] rounded-full h-2 overflow-hidden">
                                    <div 
                                      className={`h-full transition-all duration-500 rounded-full ${liquidity.barColor}`}
                                      style={{ width: `${liquidity.score}%` }}
                                    />
                                  </div>
                                </div>

                                <div className="space-y-2">
                                  <span className="text-[9px] text-slate-400 block font-bold font-mono tracking-wider uppercase">Sinalizadores & Fatores de Demanda:</span>
                                  <div className="space-y-1.5 pl-0.5">
                                    {liquidity.analysis.map((line, index) => (
                                      <div key={index} className="flex items-start gap-2 text-[11px] leading-tight">
                                        <span className="mt-0.5 text-xs font-bold text-[#10B981] shrink-0">•</span>
                                        <span className="text-slate-300">
                                          {line}
                                        </span>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })()}

                      {/* CTA Buttons */}
                      <div className="flex flex-col gap-2 pt-1">
                        {isAdmin && selectedProperty.id && !properties.some(p => p.id === selectedProperty.id) && (
                          <button
                            onClick={() => {
                              setProperties(prev => [selectedProperty, ...prev]);
                              setToast({
                                message: `Lote de Imóvel adicionado à planilha com sucesso!`,
                                type: 'success'
                              });
                              setShowDetails(false);
                            }}
                            className="w-full py-2.5 px-3.5 bg-[#10B981] hover:bg-[#10B981]/90 text-black rounded-xl text-xs font-extrabold shadow hover:shadow-md transition-all cursor-pointer flex items-center justify-center gap-1.5"
                          >
                            <CheckSquare className="h-4 w-4" />
                            <span>Adicionar à Planilha</span>
                          </button>
                        )}
                        <button
                          onClick={() => setShowDetails(false)}
                          className="w-full py-2 px-3 bg-[#1C1C1E] hover:bg-[#1C1C1E]/80 text-[#F8FAFC] border border-[#2C2C2E] rounded-xl text-xs font-bold transition-all cursor-pointer text-center"
                        >
                          Fechar Ficha
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            </div>
          );
        })()}
      </AnimatePresence>

      {/* REACT MODAL FOR CONFIRMATIONS */}
      <AnimatePresence>
        {(deleteConfirmId !== null || clearAllConfirm) && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#000000]/60 backdrop-blur-xs">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-[#1C1C1E] border border-[#2C2C2E] rounded-3xl p-6 max-w-md w-full shadow-xl space-y-6"
            >
              <div className="flex items-start gap-4">
                <div className="p-3 bg-rose-500/10 text-rose-500 rounded-2xl border border-rose-500/25 shrink-0">
                  <AlertTriangle className="h-6 w-6 animate-pulse" />
                </div>
                <div className="space-y-1.5">
                  <h4 className="text-base font-black text-[#F8FAFC] font-sans tracking-tight">
                    {clearAllConfirm ? 'Limpar Planilha Completa?' : 'Remover Lote da Planilha?'}
                  </h4>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    {clearAllConfirm 
                      ? 'Esta ação apagará todos os imóveis da sua planilha atual de viabilidade.'
                      : `Você tem certeza de que deseja remover o lote de imóvel em "${properties.find(p => p.id === deleteConfirmId)?.location || 'selecionado'}" da sua planilha?`
                    }
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  onClick={() => {
                    setDeleteConfirmId(null);
                    setClearAllConfirm(false);
                  }}
                  className="px-4 py-2.5 rounded-xl text-xs font-bold bg-[#2C2C2E] hover:bg-zinc-800 text-slate-300 border border-[#2C2C2E] cursor-pointer transition active:scale-95"
                >
                  Cancelar
                </button>
                <button
                  onClick={() => {
                    if (clearAllConfirm) {
                      setProperties([]);
                      setSelectedId('');
                      setClearAllConfirm(false);
                      setToast({ message: 'Planilha de imóveis limpa!', type: 'success' });
                    } else {
                      confirmRemoveLot();
                    }
                  }}
                  className="px-4 py-2.5 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-500 text-white cursor-pointer transition active:scale-95 shadow-xs"
                >
                  Confirmar Exclusão
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* TOAST NOTIFICATION */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="fixed bottom-6 right-6 z-50 flex items-center gap-3 px-5 py-3.5 bg-[#1C1C1E] border border-[#2C2C2E] rounded-2xl shadow-xl"
          >
            <div className={`h-2 w-2 rounded-full ${
              toast.type === 'success' ? 'bg-emerald-500' : toast.type === 'error' ? 'bg-rose-500' : 'bg-indigo-500'
            }`} />
            <span className="text-xs font-bold text-[#F8FAFC]">{toast.message}</span>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
