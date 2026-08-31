import React, { useState, useEffect } from 'react';
import { jsPDF } from 'jspdf';
import { 
  Sparkles, AlertTriangle, CheckSquare, RefreshCw, FileText, 
  Trash2, ArrowRight, BookOpen, ShieldCheck, HelpCircle, 
  ShieldAlert, Info, TrendingUp, DollarSign, SlidersHorizontal, Search, Pencil, FileDown,
  X, Plus, Filter, Car
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

import { VehicleLot, AppUser } from '../types';
import { safeStorage } from '../utils/safeStorage';

// Initial pre-loaded historical vehicle lots as requested
export const INITIAL_VEHICLES: VehicleLot[] = [];

export interface VehicleLiquidityInfo {
  score: number;
  level: 'Altíssima' | 'Alta' | 'Média' | 'Baixa';
  color: string;
  bgColor: string;
  barColor: string;
  kmText: string;
  prazoEstimado: string;
}

export const calculateVehicleLiquidity = (item: VehicleLot): VehicleLiquidityInfo => {
  let score = 65; // Score base

  const modelLower = (item.model || '').toLowerCase();

  // 1. Marca & Modelo Factor (Alta procura de liquidez no mercado BR)
  const highDemandKeywords = [
    'toyota', 'corolla', 'hilux', 'honda', 'civic', 'fit', 'hrv', 'hr-v',
    'volkswagen', 'vw', 'gol', 'polo', 'fox', 'saveiro', 'nivus', 't-cross', 'tcross',
    'fiat', 'uno', 'strada', 'toro', 'mobi', 'argo', 'chevrolet', 'gm', 'onix', 'tracker', 's10', 'spin',
    'hyundai', 'hb20', 'creta', 'nissan', 'kicks'
  ];
  
  const lowDemandKeywords = [
    'dualogic', 'powershift', 'marea', 'citroen', 'c3', 'c4', 'peugeot 206', 'peugeot 207', 'peugeot 307',
    'jac', 'lifan', 'ssangyong', 'chery qq', 'bmw', 'audi', 'mercedes', 'land rover', 'jaguar', 'porsche'
  ];

  const isHighDemand = highDemandKeywords.some(kw => modelLower.includes(kw));
  const isLowDemand = lowDemandKeywords.some(kw => modelLower.includes(kw));

  if (isHighDemand) score += 15;
  else if (isLowDemand) score -= 20;

  // 2. Fator Quilometragem (KM)
  let kmNum = 0;
  let kmText = 'KM Moderada';
  if (typeof item.km === 'number') {
    kmNum = item.km;
  } else if (typeof item.km === 'string') {
    const rawKm = item.km.toLowerCase();
    if (rawKm.includes('k') && !rawKm.includes('km')) {
      const match = rawKm.match(/(\d+[\.,]?\d*)\s*k/);
      if (match) kmNum = parseFloat(match[1].replace(',', '.')) * 1000;
    } else {
      const clean = rawKm.replace(/[^\d]/g, '');
      if (clean) kmNum = parseInt(clean, 10);
    }
  }

  if (kmNum > 0) {
    if (kmNum < 40000) {
      score += 20;
      kmText = 'Baixa KM';
    } else if (kmNum < 80000) {
      score += 8;
      kmText = 'KM Adequada';
    } else if (kmNum < 120000) {
      score -= 5;
      kmText = 'KM Moderada';
    } else if (kmNum < 160000) {
      score -= 15;
      kmText = 'KM Elevada';
    } else {
      score -= 25;
      kmText = 'Alta KM';
    }
  }

  // 3. Respeitar campo explicito item.liquidity se fornecido
  if (item.liquidity) {
    const liqLower = item.liquidity.toLowerCase();
    if (liqLower.includes('altíssima') || liqLower.includes('altissima')) {
      score = Math.max(score, 88);
    } else if (liqLower.includes('alta')) {
      score = Math.max(score, 75);
    } else if (liqLower.includes('média') || liqLower.includes('media')) {
      // Score mantido balanceado
    } else if (liqLower.includes('baixa')) {
      score = Math.min(score, 45);
    }
  }

  // Clampar score entre 15 e 98
  score = Math.max(15, Math.min(98, Math.round(score)));

  if (score >= 75) {
    return {
      score,
      level: score >= 88 ? 'Altíssima' : 'Alta',
      color: 'text-emerald-700 dark:text-emerald-600',
      bgColor: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      barColor: 'bg-emerald-500',
      kmText,
      prazoEstimado: '~15 a 30 dias'
    };
  } else if (score >= 50) {
    return {
      score,
      level: 'Média',
      color: 'text-amber-700 dark:text-amber-600',
      bgColor: 'bg-amber-50 text-amber-700 border-amber-200',
      barColor: 'bg-amber-500',
      kmText,
      prazoEstimado: '~30 a 60 dias'
    };
  } else {
    return {
      score,
      level: 'Baixa',
      color: 'text-rose-700 dark:text-rose-600',
      bgColor: 'bg-rose-50 text-rose-700 border-rose-200',
      barColor: 'bg-rose-500',
      kmText,
      prazoEstimado: '> 60 dias'
    };
  }
};

export const calculateVehicleRisk = (item: VehicleLot) => {
  let score = item.category === 'Prioritário' ? 25 : 75;
  if (item.liquidity === 'Altíssima' || item.liquidity === 'Alta') score -= 10;
  if (item.liquidity === 'Baixa') score += 15;
  
  let label: 'Baixo' | 'Médio' | 'Alto' = 'Baixo';
  let color = 'text-emerald-600';
  let bgColor = 'bg-emerald-50 text-emerald-700 border-emerald-200';
  let barColor = 'bg-emerald-500';

  if (score > 60) {
    label = 'Alto';
    color = 'text-rose-600';
    bgColor = 'bg-rose-50 text-rose-700 border-rose-200';
    barColor = 'bg-rose-500';
  } else if (score > 35) {
    label = 'Médio';
    color = 'text-amber-600';
    bgColor = 'bg-amber-50 text-amber-700 border-amber-200';
    barColor = 'bg-amber-500';
  }

  return { score, label, color, bgColor, barColor };
};

export const handleExportPDFVehicle = (item: VehicleLot) => {
  if (!item) {
    alert('Nenhum veículo selecionado para emissão do relatório.');
    return;
  }
  try {
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
    });

    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();

    const formatPDFBRL = (val: number | undefined | null) => {
      const num = Number(val) || 0;
      return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(num);
    };

    doc.setFillColor(255, 255, 255);
    doc.rect(0, 0, pageWidth, pageHeight, 'F');

    // Header Card
    doc.setFillColor(248, 250, 252);
    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.4);
    doc.roundedRect(12, 12, pageWidth - 24, 34, 4, 4, 'FD');

    doc.setFillColor(16, 185, 129);
    doc.rect(12, 12, 2.2, 34, 'F');

    doc.setTextColor(5, 150, 105);
    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.text('FICHA TÉCNICA DO VEÍCULO — LEILÃO EXECUTIVO', pageWidth - 16, 19, { align: 'right' });

    doc.setTextColor(15, 23, 42);
    doc.setFontSize(12);
    doc.text(item.model || 'Veículo sem modelo', 18, 24);

    doc.setFontSize(8.5);
    doc.setFont('Helvetica', 'normal');
    doc.setTextColor(71, 85, 105);
    doc.text(`Ano: ${item.year || 'N/A'}  |  Quilometragem: ${item.km || 'N/A'}  |  Classificação: ${item.category || 'N/A'}`, 18, 38);

    let y = 52;

    const drawHeader = (title: string, h: number) => {
      if (y + h > pageHeight - 16) {
        doc.addPage();
        y = 12;
      }
      const startY = y;
      doc.setFillColor(255, 255, 255);
      doc.setDrawColor(226, 232, 240);
      doc.setLineWidth(0.4);
      doc.roundedRect(12, startY, pageWidth - 24, h, 4, 4, 'FD');
      doc.setFillColor(16, 185, 129);
      doc.rect(12, startY, 2, h, 'F');
      doc.setTextColor(16, 185, 129);
      doc.setFont('Helvetica', 'bold');
      doc.setFontSize(8.5);
      doc.text(title.toUpperCase(), 17, startY + 7);
      doc.setDrawColor(241, 245, 249);
      doc.setLineWidth(0.35);
      doc.line(12, startY + 11, pageWidth - 12, startY + 11);
      return startY;
    };

    // Financial Overview
    const s1Y = drawHeader('Valores e Viabilidade Financeira', 42);
    const boxW = (pageWidth - 36) / 3;

    // FIPE Box
    doc.setFillColor(248, 250, 252);
    doc.setDrawColor(226, 232, 240);
    doc.roundedRect(16, s1Y + 15, boxW, 20, 2, 2, 'FD');
    doc.setTextColor(100, 116, 139);
    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(7);
    doc.text('VALOR TABELA FIPE', 20, s1Y + 21);
    doc.setTextColor(15, 23, 42);
    doc.setFontSize(10);
    doc.text(formatPDFBRL(item.fipe), 20, s1Y + 29);

    // Mercado Box
    const mkt = item.marketValue || Math.round((item.fipe || 0) * 1.05);
    doc.setFillColor(248, 250, 252);
    doc.setDrawColor(226, 232, 240);
    doc.roundedRect(16 + boxW + 2, s1Y + 15, boxW, 20, 2, 2, 'FD');
    doc.setTextColor(100, 116, 139);
    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(7);
    doc.text('ESTIMATIVA DE MERCADO', 16 + boxW + 6, s1Y + 21);
    doc.setTextColor(15, 23, 42);
    doc.setFontSize(10);
    doc.text(formatPDFBRL(mkt), 16 + boxW + 6, s1Y + 29);

    // Lance Max Box
    doc.setFillColor(240, 253, 250);
    doc.setDrawColor(16, 185, 129);
    doc.roundedRect(16 + (boxW + 2) * 2, s1Y + 15, boxW, 20, 2, 2, 'FD');
    doc.setTextColor(5, 150, 105);
    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(7);
    doc.text('LANCE MÁXIMO SUGERIDO', 16 + (boxW + 2) * 2 + 4, s1Y + 21);
    doc.setTextColor(5, 150, 105);
    doc.setFontSize(10);
    doc.text(formatPDFBRL(item.suggestedBid), 16 + (boxW + 2) * 2 + 4, s1Y + 29);

    y += 42 + 5;

    // Technical Risk & Liquidity
    const liq = calculateVehicleLiquidity(item);
    const cardRiskHeight = 45;
    const s2Y = drawHeader('Análise de Risco & Liquidez', cardRiskHeight);

    doc.setTextColor(100, 116, 139);
    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(8);
    doc.text('LIQUIDEZ DE MERCADO:', 18, s2Y + 18);
    doc.setTextColor(15, 23, 42);
    doc.text(`${item.liquidity || 'Média'} (${liq.prazoEstimado})`, 60, s2Y + 18);

    doc.setTextColor(100, 116, 139);
    doc.setFont('Helvetica', 'bold');
    doc.text('AVALIAÇÃO DE RISCO:', 18, s2Y + 26);
    doc.setTextColor(item.category === 'Prioritário' ? 5 : 220, item.category === 'Prioritário' ? 150 : 38, item.category === 'Prioritário' ? 105 : 38);
    doc.text(item.category === 'Prioritário' ? 'Risco Controlado / Recomendado' : 'Atenção / Alto Risco', 60, s2Y + 26);

    doc.setTextColor(100, 116, 139);
    doc.setFont('Helvetica', 'bold');
    doc.text('DETALHES DE SEGURANÇA:', 18, s2Y + 34);
    doc.setFont('Helvetica', 'normal');
    doc.setTextColor(71, 85, 105);
    const riskLines = doc.splitTextToSize(item.riskAnalysis || 'Sem observações adicionais.', pageWidth - 80);
    doc.text(riskLines, 60, s2Y + 34);

    y += cardRiskHeight + 5;

    // Executive Summary
    if (item.executiveSummary) {
      const summaryLines = doc.splitTextToSize(item.executiveSummary, pageWidth - 36);
      const cardSumHeight = 16 + (summaryLines.length * 4.5);
      const s3Y = drawHeader('Resumo Executivo da Operação', cardSumHeight);
      doc.setFont('Helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(51, 65, 85);
      doc.text(summaryLines, 18, s3Y + 17);
      y += cardSumHeight + 5;
    }

    // Footer
    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.35);
    doc.line(12, pageHeight - 14, pageWidth - 12, pageHeight - 14);

    doc.setTextColor(100, 116, 139);
    doc.setFont('Helvetica', 'normal');
    doc.setFontSize(7.5);
    const timestamp = `${new Date().toLocaleDateString('pt-BR')} ${new Date().toLocaleTimeString('pt-BR', {hour: '2-digit', minute:'2-digit'})}`;
    doc.text(`Relatório Gerado Eletronicamente em ${timestamp}  |  Análise de Veículos`, 15, pageHeight - 9);

    const sanitized = (item.model || 'veiculo')
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]/g, '_')
      .substring(0, 30);

    doc.save(`Ficha_Veiculo_${sanitized || 'relatorio'}.pdf`);
  } catch (err) {
    console.error('Erro ao emitir relatório do veículo:', err);
    alert('Ocorreu um erro ao emitir o relatório PDF do veículo.');
  }
};

interface LotesConsultorProps {
  vehicles: VehicleLot[];
  setVehicles: React.Dispatch<React.SetStateAction<VehicleLot[]>>;
  currentUser?: AppUser | null;
}

export default function LotesConsultor({ vehicles, setVehicles, currentUser }: LotesConsultorProps) {
  const isAdmin = currentUser?.role === 'admin';
  const canEdit = currentUser?.role === 'admin' || currentUser?.role === 'operator';

  // Selected vehicle for active consultation
  const [selectedId, setSelectedId] = useState<string>('v-1');
  const [analyzedLot, setAnalyzedLot] = useState<VehicleLot | null>(null);

  const selectedVehicle = 
    (analyzedLot && selectedId === analyzedLot.id)
      ? analyzedLot
      : (vehicles.find(v => v.id === selectedId) || vehicles[0] || {
          id: '',
          model: 'Nenhum Lote',
          year: '-',
          km: '-',
          fipe: 0,
          marketValue: 0,
          suggestedBid: 0,
          liquidity: '-',
          category: 'Não Indicado',
          riskAnalysis: 'Sem lote selecionado.',
          executiveSummary: 'Sem lote selecionado.'
        } as VehicleLot);

  // Search and filter states
  const [search, setSearch] = useState<string>('');
  const [filterCategory, setFilterCategory] = useState<'Todos' | 'Prioritários' | 'Não Indicados'>('Todos');

  // States for Quick Edit in table
  const [editingField, setEditingField] = useState<{ id: string; field: 'model' | 'year' | 'km' | 'fipe' | 'suggestedBid' } | null>(null);
  const [editValue, setEditValue] = useState<string>('');

  const handleQuickEditSave = (id: string, field: 'model' | 'year' | 'km' | 'fipe' | 'suggestedBid', valueStr: string) => {
    setVehicles(prev => {
      const updated = prev.map(item => {
        if (item.id === id) {
          let updatedValue: any = valueStr.trim();
          if (field === 'fipe' || field === 'suggestedBid') {
            const clean = valueStr.trim().replace(/\./g, '').replace(',', '.').replace(/[^\d.]/g, '');
            const parsed = parseFloat(clean);
            updatedValue = isNaN(parsed) ? 0 : parsed;
          }
          
          const updatedItem = { ...item, [field]: updatedValue };

          // Recalculate category or bid constraints if FIPE or suggestedBid changed
          if (field === 'fipe' || field === 'suggestedBid') {
            // Rule: Bid + 5% + 1000 <= 70% FIPE
            const finalBid = updatedItem.suggestedBid;
            const finalFipe = updatedItem.fipe;
            const totalCost = finalBid * 1.05 + 1000;
            const ceiling = finalFipe * 0.70;
            updatedItem.category = totalCost <= ceiling ? 'Prioritário' : 'Não Indicado';
            updatedItem.executiveSummary = `Calculado sob a Regra de 70% da Tabela FIPE de R$ ${finalFipe.toLocaleString('pt-BR')}: Lance sugerido de modo que custo total não passe de R$ ${Math.round(ceiling).toLocaleString('pt-BR')}.`;
          }

          return updatedItem;
        }
        return item;
      });
      safeStorage.setItem('leilao_consultor_lotes', JSON.stringify(updated.filter(v => !['v-1', 'v-2', 'v-3', 'v-4', 'v-5', 'v-6', 'v-7', 'v-8', 'v-9'].includes(v.id))));
      return updated;
    });

    setEditingField(null);
  };
  // Input states for registering a new lot
  const [newModel, setNewModel] = useState('');
  const [newYear, setNewYear] = useState('');
  const [newKm, setNewKm] = useState('');
  const [newFipe, setNewFipe] = useState('');
  const [newMarketValue, setNewMarketValue] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Modal & Toolbar toggle states
  const [isAnalyzeModalOpen, setIsAnalyzeModalOpen] = useState(false);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState<VehicleLot | null>(null);
  const [editModel, setEditModel] = useState('');
  const [editYear, setEditYear] = useState('');
  const [editKm, setEditKm] = useState('');
  const [editFipe, setEditFipe] = useState('');
  const [editMarketValue, setEditMarketValue] = useState('');
  const [editSuggestedBid, setEditSuggestedBid] = useState('');
  const [editCategory, setEditCategory] = useState<'Prioritário' | 'Não Indicado'>('Prioritário');
  const [editRiskAnalysis, setEditRiskAnalysis] = useState('');
  const [editExecutiveSummary, setEditExecutiveSummary] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const [showFilters, setShowFilters] = useState(false);

  const handleOpenEditVehicleModal = (v: VehicleLot) => {
    setEditingVehicle(v);
    setEditModel(v.model || '');
    setEditYear(v.year || '');
    setEditKm(typeof v.km === 'string' ? v.km : String(v.km || ''));
    setEditFipe(v.fipe ? String(v.fipe) : '');
    setEditMarketValue(v.marketValue ? String(v.marketValue) : '');
    setEditSuggestedBid(v.suggestedBid ? String(v.suggestedBid) : '');
    setEditCategory(v.category || 'Prioritário');
    setEditRiskAnalysis(v.riskAnalysis || '');
    setEditExecutiveSummary(v.executiveSummary || '');
    setIsEditModalOpen(true);
  };

  const handleSaveEditVehicle = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingVehicle || !editModel.trim()) {
      setToast({ message: 'O modelo do veículo é obrigatório.', type: 'error' });
      return;
    }

    const fipeNum = Number(editFipe) || 0;
    const marketNum = Number(editMarketValue) || (fipeNum ? Math.round(fipeNum * 1.05) : 0);
    const suggestedBidNum = Number(editSuggestedBid) || (fipeNum ? Math.floor((0.70 * fipeNum - 1000) / 1.05) : 0);

    const updatedLot: VehicleLot = {
      ...editingVehicle,
      model: editModel.trim(),
      year: editYear.trim() || 'N/A',
      km: editKm.trim() || 'N/A',
      fipe: fipeNum,
      marketValue: marketNum,
      suggestedBid: suggestedBidNum,
      category: editCategory,
      riskAnalysis: editRiskAnalysis.trim() || editingVehicle.riskAnalysis,
      executiveSummary: editExecutiveSummary.trim() || editingVehicle.executiveSummary
    };

    setVehicles(prev => {
      const updated = prev.map(v => v.id === editingVehicle.id ? updatedLot : v);
      safeStorage.setItem('leilao_consultor_lotes', JSON.stringify(updated.filter(v => !['v-1', 'v-2', 'v-3', 'v-4', 'v-5', 'v-6', 'v-7', 'v-8', 'v-9'].includes(v.id))));
      return updated;
    });

    if (analyzedLot && analyzedLot.id === editingVehicle.id) {
      setAnalyzedLot(updatedLot);
    }

    setIsEditModalOpen(false);
    setEditingVehicle(null);
    setToast({
      message: `Lote "${updatedLot.model}" atualizado com sucesso!`,
      type: 'success'
    });
  };

  // Listen to custom events from Header and desktop topbar
  useEffect(() => {
    const handleOpenModal = () => {
      if (canEdit) {
        setIsAnalyzeModalOpen(true);
      }
    };
    const handleToggleSearch = () => {
      setShowSearch(prev => !prev);
    };
    const handleToggleFilters = () => {
      setShowFilters(prev => !prev);
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsAnalyzeModalOpen(false);
        setIsDetailsModalOpen(false);
        setIsEditModalOpen(false);
      }
    };

    window.addEventListener('open-analyze-vehicle-modal', handleOpenModal);
    window.addEventListener('toggle-vehicle-search', handleToggleSearch);
    window.addEventListener('toggle-vehicle-filters', handleToggleFilters);
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('open-analyze-vehicle-modal', handleOpenModal);
      window.removeEventListener('toggle-vehicle-search', handleToggleSearch);
      window.removeEventListener('toggle-vehicle-filters', handleToggleFilters);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [canEdit]);

  // Custom non-blocking modal confirmation & toast states (essential for sandbox iframe compatibility)
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [clearAllConfirm, setClearAllConfirm] = useState<boolean>(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'info' | 'error' } | null>(null);

  // Auto-dismiss toast
  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 4500);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  const formatBRL = (val: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(val);
  };

  // Run calculation preview on-the-fly (useful for UX input feedback)
  const getSuggestedBidOnFly = (fipeValue: string) => {
    const num = Number(fipeValue);
    if (!num || isNaN(num)) return 0;
    return Math.max(0, Math.floor((0.70 * num - 1000) / 1.05));
  };

  // Submit and analyze new lot via Gemini
  const handleAnalyzeNewLot = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newModel) {
      setToast({ message: 'Por favor, preencha o campo de Modelo/Versão.', type: 'error' });
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch('/api/consultar-veiculo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: newModel,
          year: newYear || 'Não informado',
          km: newKm || 'Não informado',
          fipe: newFipe ? Number(newFipe) : undefined,
          marketValue: newMarketValue ? Number(newMarketValue) : undefined
        })
      });

      const data = await response.json();
      if (!response.ok || data.error) {
        throw new Error(data.error || 'Erro inesperado do servidor.');
      }

      const finalFipe = data.fipe || (newFipe ? Number(newFipe) : 40000);

      const newLot: VehicleLot = {
        id: `v-custom-${Date.now()}`,
        model: newModel,
        year: newYear || 'Não informado',
        km: newKm || 'Não informado',
        fipe: finalFipe,
        marketValue: data.marketValue || (newMarketValue ? Number(newMarketValue) : Math.round(finalFipe * 1.05)),
        suggestedBid: data.suggestedBid || Math.floor((0.70 * finalFipe - 1000) / 1.05),
        liquidity: data.liquidity || 'Média',
        category: data.category === 'Prioritário' ? 'Prioritário' : 'Não Indicado',
        riskAnalysis: data.riskAnalysis || 'Análise indisponível no momento.',
        executiveSummary: data.executiveSummary || 'Sem resumo adicional.',
        isCustom: true
      };

      setAnalyzedLot(newLot);
      setSelectedId(newLot.id);
      setIsDetailsModalOpen(true);

      // Reset fields
      setNewModel('');
      setNewYear('');
      setNewKm('');
      setNewFipe('');
      setNewMarketValue('');

      setToast({
        message: `Lote "${newLot.model}" analisado com sucesso!`,
        type: 'success'
      });
    } catch (err: any) {
      console.error("Erro na busca remota da FIPE / IA:", err);
      
      // Fallback local calculations if API fails or lacks key
      const fallbackFipe = newFipe && !isNaN(Number(newFipe)) ? Number(newFipe) : 40000;
      const fallbackMarket = newMarketValue && !isNaN(Number(newMarketValue)) ? Number(newMarketValue) : Math.round(fallbackFipe * 1.05);
      const fallbackSuggested = Math.floor((0.70 * fallbackFipe - 1000) / 1.05);
      const isHighRisk = (newKm.toLowerCase().includes('k') && parseFloat(newKm) > 130) || newModel.toLowerCase().includes('c3') || newModel.toLowerCase().includes('peugeot') || newModel.toLowerCase().includes('dualogic');

      const fallbackLot: VehicleLot = {
        id: `v-custom-${Date.now()}`,
        model: newModel,
        year: newYear || 'N/A',
        km: newKm || 'N/A',
        fipe: fallbackFipe,
        marketValue: fallbackMarket,
        suggestedBid: fallbackSuggested,
        liquidity: 'Média',
        category: isHighRisk ? 'Não Indicado' : 'Prioritário',
        riskAnalysis: `Análise preliminar local (A busca por IA falhou temporariamente: ${err.message}). Km: ${newKm}. Modelo sob suspeita de alta manutenção se ultrapassar os limites normais.`,
        executiveSummary: `Calculado sob a Regra de 70% FIPE estimada localmente em R$ ${fallbackFipe.toLocaleString('pt-BR')}: Sugerido dar lance máximo de ${formatBRL(fallbackSuggested)} para obter margem financeira.`,
        isCustom: true
      };

      setAnalyzedLot(fallbackLot);
      setSelectedId(fallbackLot.id);
      setIsDetailsModalOpen(true);

      // Reset fields
      setNewModel('');
      setNewYear('');
      setNewKm('');
      setNewFipe('');
      setNewMarketValue('');
      
      setToast({
        message: `Lote "${fallbackLot.model}" analisado localmente!`,
        type: 'info'
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
      const updated = vehicles.filter(v => v.id !== deleteConfirmId);
      setVehicles(updated);
      if (selectedId === deleteConfirmId || selectedVehicle?.id === deleteConfirmId) {
        setSelectedId(updated[0]?.id || '');
        setIsDetailsModalOpen(false);
      }
      setToast({
        message: 'Lote removido com sucesso!',
        type: 'success'
      });
      setDeleteConfirmId(null);
    }
  };

  // Filter lists based on states
  const filteredVehicles = vehicles.filter(v => {
    const matchesSearch = v.model.toLowerCase().includes(search.toLowerCase()) || v.year.includes(search);
    const matchesCat = filterCategory === 'Todos' ||
                       (filterCategory === 'Prioritários' && v.category === 'Prioritário') ||
                       (filterCategory === 'Não Indicados' && v.category === 'Não Indicado');
    return matchesSearch && matchesCat;
  });

  return (
    <div id="lotes-consultor-tab" className="space-y-3 font-sans min-h-screen">
      
      {/* Optional Toggled Search and Filter Controls */}
      <AnimatePresence>
        {showSearch && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="relative">
              <Search className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
              <input
                type="text"
                placeholder="Pesquisar por modelo ou ano do veículo..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full bg-white dark:bg-[#1C1C1E] text-xs pl-10 pr-4 py-2.5 border border-slate-200 dark:border-[#2C2C2E] rounded-xl focus:outline-none focus:ring-1 focus:ring-emerald-500 text-slate-900 dark:text-white placeholder:text-slate-400"
              />
            </div>
          </motion.div>
        )}

        {showFilters && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="flex flex-wrap items-center gap-2 p-3 bg-white dark:bg-[#1C1C1E] border border-slate-200 dark:border-[#2C2C2E] rounded-2xl">
              <span className="text-[10px] font-bold uppercase font-mono text-slate-500 dark:text-slate-400 mr-1">Filtrar:</span>
              {['Todos', 'Prioritários', 'Não Indicados'].map((cat) => (
                <button
                  key={cat}
                  onClick={() => setFilterCategory(cat as any)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    filterCategory === cat
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'bg-slate-100 dark:bg-[#2C2C2E] text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-[#3A3A3C]'
                  }`}
                >
                  {cat}
                </button>
              ))}
              {isAdmin && vehicles.length > 0 && (
                <button
                  onClick={() => setClearAllConfirm(true)}
                  className="ml-auto px-3 py-1.5 rounded-xl text-xs font-bold bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 hover:bg-rose-100 dark:hover:bg-rose-500/20 border border-rose-200 dark:border-rose-500/20 transition-all cursor-pointer flex items-center gap-1.5"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  <span>Limpar Planilha</span>
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Cards de Veículos diretamente no fundo */}
      <div className="flex flex-col gap-3">
        {filteredVehicles.length > 0 ? (
          filteredVehicles.map((item) => {
            const isSelected = item.id === selectedId;
            const liq = calculateVehicleLiquidity(item);
            const risk = calculateVehicleRisk(item);
            const RiskIcon = risk.label === 'Baixo' ? ShieldCheck : ShieldAlert;
            const mktValue = item.marketValue || Math.round((item.fipe || 0) * 1.05);
            const discountPercent = item.fipe > 0 ? Math.round(((item.fipe - item.suggestedBid) / item.fipe) * 100) : 0;

            return (
              <div
                key={item.id}
                id={`vehicle-card-${item.id}`}
                onClick={() => {
                  setSelectedId(item.id);
                  setIsDetailsModalOpen(true);
                }}
                className={`group vehicle-lot-card rounded-2xl p-3 sm:p-3.5 transition-all duration-300 cursor-pointer relative overflow-hidden flex flex-col w-full bg-[#0E0E0E] border border-[#2C2C2E] hover:border-emerald-500/30 shadow-sm hover:shadow-md ${
                  isSelected ? 'ring-1 ring-emerald-500/30' : ''
                }`}
              >
                <div className="flex flex-col gap-2 sm:gap-2.5">
                  {/* Top: Ícone de Veículo + Modelo / Ano / KM */}
                  <div className="flex items-center gap-2.5 sm:gap-3 w-full">
                    {/* Ícone de Veículo */}
                    <div className="w-11 h-11 sm:w-13 sm:h-13 rounded-xl sm:rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-500/30 text-emerald-600 dark:text-emerald-400 shrink-0 flex items-center justify-center shadow-2xs group-hover:scale-105 transition-transform">
                      <Car className="h-5 w-5 sm:h-6 sm:w-6 text-emerald-600 dark:text-emerald-400 shrink-0" />
                    </div>

                    {/* Hierarquia visual */}
                    <div className="flex flex-col flex-1 min-w-0 justify-center gap-0.5">
                      <div className="text-sm sm:text-base md:text-lg font-black font-inter text-slate-900 dark:text-[#F8FAFC] tracking-tight leading-snug truncate" title={item.model}>
                        {item.model}
                      </div>
                      <div className="text-[11.5px] sm:text-sm md:text-[14.5px] text-slate-500 dark:text-slate-300 font-normal sm:font-medium leading-relaxed tracking-normal truncate">
                        <span>Ano: <strong className="text-slate-800 dark:text-slate-100 font-mono font-bold">{item.year}</strong></span>
                        <span className="mx-1.5 text-slate-400 dark:text-slate-600">•</span>
                        <span>KM: <strong className="text-slate-800 dark:text-slate-100 font-mono font-bold">{item.km}</strong></span>
                      </div>
                    </div>
                  </div>

                  {/* Linha divisória idêntica */}
                  <div className="border-t border-slate-200/80 dark:border-white/10 w-full" />

                  {/* Quadro de Valores no fundo do card com barras divisórias */}
                  <div className="py-0.5 sm:py-1 w-full flex flex-col gap-1 sm:gap-1.5">
                    {/* Linha 1: Tabela FIPE | Est. Mercado | Lance Máx Sugerido */}
                    <div className="grid grid-cols-3 divide-x divide-slate-200/80 dark:divide-white/10 text-center w-full">
                      <div className="flex flex-col items-center justify-center px-1 sm:px-1.5 py-0.5">
                        <span className="text-[8px] sm:text-[9px] uppercase tracking-wider font-mono font-semibold text-slate-500 dark:text-slate-400 truncate w-full">
                          Tabela FIPE
                        </span>
                        <span className="font-black font-mono text-[11px] sm:text-[12.5px] truncate w-full mt-0.5 text-slate-900 dark:text-white">
                          {formatBRL(item.fipe)}
                        </span>
                      </div>
                      <div className="flex flex-col items-center justify-center px-1 sm:px-1.5 py-0.5">
                        <span className="text-[8px] sm:text-[9px] uppercase tracking-wider font-mono font-semibold text-slate-500 dark:text-slate-400 truncate w-full">
                          Est. Mercado
                        </span>
                        <span className="font-black font-mono text-[11px] sm:text-[12.5px] truncate w-full mt-0.5 text-slate-900 dark:text-white">
                          {formatBRL(mktValue)}
                        </span>
                      </div>
                      <div className="flex flex-col items-center justify-center px-1 sm:px-1.5 py-0.5">
                        <span className="text-[8px] sm:text-[9px] uppercase tracking-wider font-mono font-semibold text-emerald-600 dark:text-emerald-400 truncate w-full">
                          Lance Máx
                        </span>
                        <span className="font-black font-mono text-[11px] sm:text-[12.5px] truncate w-full mt-0.5 text-emerald-700 dark:text-emerald-400">
                          {formatBRL(item.suggestedBid)}
                        </span>
                      </div>
                    </div>

                    {/* Linha 2: Desconto FIPE | Prazo Giro | Risco Operacional */}
                    <div className="grid grid-cols-3 divide-x divide-slate-200/80 dark:divide-white/10 text-center w-full border-t border-slate-200/50 dark:border-white/5 pt-1 sm:pt-1.5">
                      <div className="flex flex-col items-center justify-center px-1 sm:px-1.5 py-0.5">
                        <span className="text-[8px] sm:text-[9px] uppercase tracking-wider font-mono font-semibold text-slate-500 dark:text-slate-400 truncate w-full">
                          Desconto FIPE
                        </span>
                        <span className="font-black font-mono text-[11px] sm:text-[12.5px] truncate w-full mt-0.5 text-slate-900 dark:text-white">
                          {discountPercent}% OFF
                        </span>
                      </div>
                      <div className="flex flex-col items-center justify-center px-1 sm:px-1.5 py-0.5">
                        <span className="text-[8px] sm:text-[9px] uppercase tracking-wider font-mono font-semibold text-slate-500 dark:text-slate-400 truncate w-full">
                          Prazo de Giro
                        </span>
                        <span className={`font-black font-mono text-[11px] sm:text-[12.5px] truncate w-full mt-0.5 ${liq.color}`}>
                          {liq.prazoEstimado}
                        </span>
                      </div>
                      <div className="flex flex-col items-center justify-center px-1 sm:px-1.5 py-0.5">
                        <span className="text-[8px] sm:text-[9px] uppercase tracking-wider font-mono font-semibold text-slate-500 dark:text-slate-400 truncate w-full">
                          Risco Operacional
                        </span>
                        <span className={`font-black font-mono text-[11px] sm:text-[12.5px] truncate w-full mt-0.5 ${risk.color}`}>
                          {risk.label}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        ) : (
          <div className="py-12 text-center text-slate-450 font-medium border border-[#2C2C2E] rounded-3xl bg-[#000000] shadow-3xs flex flex-col items-center justify-center gap-2">
            <Car className="h-8 w-8 text-slate-500" />
            <span>Nenhum veículo cadastrado na planilha. Use o botão "Analisar Lote" na parte superior para cadastrar o primeiro!</span>
          </div>
        )}
      </div>

        {/* MODAL ANALISAR LOTE (VEÍCULOS) */}
      <AnimatePresence>
        {isAnalyzeModalOpen && (
          <div 
            className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs overflow-y-auto"
            onClick={() => setIsAnalyzeModalOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 15 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 15 }}
              transition={{ duration: 0.2 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white dark:bg-[#1C1C1E] border border-zinc-200 dark:border-[#2C2C2E] rounded-3xl shadow-2xl max-w-lg w-full overflow-hidden my-auto"
              id="modal-analisar-lote-veiculo"
            >
              {/* Header */}
              <div className="p-5 border-b border-zinc-200 dark:border-[#2C2C2E] bg-zinc-50 dark:bg-[#2C2C2E]/30 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 p-2.5 rounded-2xl">
                    <Sparkles className="h-5 w-5 text-emerald-600 dark:text-emerald-400 animate-pulse" />
                  </div>
                  <div>
                    <h3 className="text-base font-black text-zinc-900 dark:text-white font-sans tracking-tight">Analisar Novo Lote</h3>
                    <p className="text-[11px] text-zinc-500 dark:text-zinc-400 font-medium">Informe os dados do veículo para análise instantânea</p>
                  </div>
                </div>
                <button
                  onClick={() => setIsAnalyzeModalOpen(false)}
                  className="p-2 rounded-xl text-zinc-400 hover:text-zinc-700 dark:hover:text-white hover:bg-zinc-200 dark:hover:bg-[#2C2C2E] cursor-pointer transition-colors"
                  title="Fechar (Esc)"
                  id="btn-close-modal-analisar-lote"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Form */}
              <form 
                onSubmit={async (e) => {
                  await handleAnalyzeNewLot(e);
                  setIsAnalyzeModalOpen(false);
                }} 
                className="p-6 space-y-4"
              >
                <div>
                  <label className="text-[10px] font-bold text-zinc-600 dark:text-zinc-300 block mb-1 uppercase font-mono">
                    MODELO / VERSÃO *
                  </label>
                  <input
                    type="text"
                    value={newModel}
                    onChange={(e) => setNewModel(e.target.value)}
                    className="w-full bg-zinc-50 dark:bg-[#2C2C2E]/50 text-xs font-semibold border border-zinc-200 dark:border-[#2C2C2E] rounded-xl p-3 text-zinc-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all placeholder:text-zinc-400"
                    placeholder="Ex: Fiat Uno Attractive 1.0 ou Ford Ka SE 1.0"
                    required
                    autoFocus
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] font-bold text-zinc-600 dark:text-zinc-300 block mb-1 uppercase font-mono">
                      ANO (EX: 17/17)
                    </label>
                    <input
                      type="text"
                      value={newYear}
                      onChange={(e) => setNewYear(e.target.value)}
                      className="w-full bg-zinc-50 dark:bg-[#2C2C2E]/50 text-xs font-semibold border border-zinc-200 dark:border-[#2C2C2E] rounded-xl p-3 text-zinc-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all"
                      placeholder="Ex: 2018 ou 17/18"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-zinc-600 dark:text-zinc-300 block mb-1 uppercase font-mono">
                      KM (EX: 80K)
                    </label>
                    <input
                      type="text"
                      value={newKm}
                      onChange={(e) => setNewKm(e.target.value)}
                      className="w-full bg-zinc-50 dark:bg-[#2C2C2E]/50 text-xs font-semibold border border-zinc-200 dark:border-[#2C2C2E] rounded-xl p-3 text-zinc-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all"
                      placeholder="Ex: 75.000 ou 80k"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] font-bold text-zinc-600 dark:text-zinc-300 block mb-1 uppercase font-mono">
                      FIPE ESTIMADA (OPCIONAL)
                    </label>
                    <input
                      type="number"
                      value={newFipe}
                      onChange={(e) => setNewFipe(e.target.value)}
                      className="w-full bg-zinc-50 dark:bg-[#2C2C2E]/50 text-xs font-semibold border border-zinc-200 dark:border-[#2C2C2E] rounded-xl p-3 text-zinc-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all"
                      placeholder="Ex: 45000"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-zinc-600 dark:text-zinc-300 block mb-1 uppercase font-mono">
                      VALOR MERCADO (OPCIONAL)
                    </label>
                    <input
                      type="number"
                      value={newMarketValue}
                      onChange={(e) => setNewMarketValue(e.target.value)}
                      className="w-full bg-zinc-50 dark:bg-[#2C2C2E]/50 text-xs font-semibold border border-zinc-200 dark:border-[#2C2C2E] rounded-xl p-3 text-zinc-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all"
                      placeholder="Ex: 48000"
                    />
                  </div>
                </div>

                <div className="pt-3 flex items-center justify-end gap-3 border-t border-zinc-150 dark:border-[#2C2C2E] mt-4">
                  <button
                    type="button"
                    onClick={() => setIsAnalyzeModalOpen(false)}
                    className="px-4 py-2.5 rounded-xl text-xs font-bold text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-[#2C2C2E] border border-zinc-200 dark:border-[#2C2C2E] cursor-pointer transition"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="py-2.5 px-5 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white rounded-xl text-xs font-extrabold shadow-sm transition-all cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {isSubmitting ? (
                      <>
                        <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                        <span>Analisando...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="h-3.5 w-3.5 text-emerald-100 animate-pulse" />
                        <span>Executar Análise</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL DETALHES DO LOTE SELECIONADO */}
      <AnimatePresence>
        {isDetailsModalOpen && selectedVehicle && (
          <div 
            className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs overflow-y-auto"
            onClick={() => setIsDetailsModalOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 15 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 15 }}
              transition={{ duration: 0.2 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white dark:bg-[#1C1C1E] border border-zinc-200 dark:border-[#2C2C2E] rounded-3xl shadow-2xl max-w-lg w-full overflow-hidden my-auto"
              id="modal-detalhes-lote-veiculo"
            >
              {/* Modal Header */}
              <div className="p-4 sm:p-5 border-b border-zinc-200 dark:border-[#2C2C2E] bg-zinc-50 dark:bg-[#2C2C2E]/30 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 p-2.5 rounded-2xl shrink-0">
                    <Car className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-base font-black text-zinc-900 dark:text-white font-sans tracking-tight truncate">
                      {selectedVehicle.model}
                    </h3>
                    <p className="text-[11px] text-zinc-500 dark:text-zinc-400 font-medium truncate">
                      Ano: {selectedVehicle.year} • KM: {selectedVehicle.km}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  {canEdit && (
                    <>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleOpenEditVehicleModal(selectedVehicle);
                        }}
                        className="p-2 rounded-xl text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 border border-transparent hover:border-emerald-200 dark:hover:border-emerald-800/40 cursor-pointer transition-all"
                        title="Editar Lote"
                        id="btn-edit-modal-detalhes-lote"
                      >
                        <Pencil className="h-5 w-5" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setDeleteConfirmId(selectedVehicle.id);
                        }}
                        className="p-2 rounded-xl text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 border border-transparent hover:border-rose-200 dark:hover:border-rose-800/40 cursor-pointer transition-all"
                        title="Excluir Lote"
                        id="btn-delete-modal-detalhes-lote"
                      >
                        <Trash2 className="h-5 w-5" />
                      </button>
                    </>
                  )}
                  <button
                    onClick={() => setIsDetailsModalOpen(false)}
                    className="p-2 rounded-xl text-zinc-400 hover:text-zinc-700 dark:hover:text-white hover:bg-zinc-200 dark:hover:bg-[#2C2C2E] cursor-pointer transition-colors"
                    title="Fechar (Esc)"
                    id="btn-close-modal-detalhes-lote"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>
              </div>

              {/* Modal Body */}
              <div className="p-6 space-y-4">
                <div className="space-y-1">
                  <span className="text-[10px] text-zinc-500 dark:text-zinc-400 font-bold block uppercase tracking-wider font-mono">Veículo</span>
                  <h4 className="text-lg font-black text-zinc-900 dark:text-white">{selectedVehicle.model}</h4>
                  <p className="text-xs text-zinc-600 dark:text-zinc-400 font-medium">Ano: {selectedVehicle.year} • Quilometragem: {selectedVehicle.km}</p>
                </div>

                <div className="grid grid-cols-3 gap-2 pt-2">
                  <div className="bg-zinc-100 dark:bg-[#2C2C2E]/40 p-2.5 rounded-xl border border-zinc-150 dark:border-[#2C2C2E] text-center">
                    <span className="text-[8px] text-zinc-500 dark:text-zinc-400 block font-bold font-mono tracking-tight uppercase">FIPE</span>
                    <span className="text-[11px] font-black text-zinc-800 dark:text-white font-mono block mt-0.5">{formatBRL(selectedVehicle.fipe)}</span>
                  </div>
                  <div className="bg-zinc-100 dark:bg-[#2C2C2E]/40 p-2.5 rounded-xl border border-zinc-150 dark:border-[#2C2C2E] text-center">
                    <span className="text-[8px] text-zinc-500 dark:text-zinc-400 block font-bold font-mono tracking-tight uppercase">MERCADO</span>
                    <span className="text-[11px] font-black text-zinc-700 dark:text-zinc-200 font-mono block mt-0.5">
                      {formatBRL(selectedVehicle.marketValue || Math.round(selectedVehicle.fipe * 1.05))}
                    </span>
                  </div>
                  <div className="bg-emerald-50 dark:bg-emerald-500/10 p-2.5 rounded-xl border border-emerald-150 dark:border-emerald-500/20 text-center">
                    <span className="text-[8px] text-emerald-600 dark:text-emerald-400 block font-bold font-mono tracking-tight uppercase">LANCE MÁX</span>
                    <span className="text-[11px] font-black text-emerald-700 dark:text-emerald-400 font-mono block mt-0.5">{formatBRL(selectedVehicle.suggestedBid)}</span>
                  </div>
                </div>

                {/* Liquidez & Risco */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  {(() => {
                    const liq = calculateVehicleLiquidity(selectedVehicle);
                    return (
                      <div className="bg-zinc-50 dark:bg-[#2C2C2E]/30 p-3 rounded-xl border border-zinc-200 dark:border-[#2C2C2E] space-y-1.5">
                        <div className="flex items-center justify-between">
                          <span className="text-[9px] font-bold text-zinc-500 dark:text-zinc-400 font-mono uppercase">Liquidez (Giro {liq.level})</span>
                          <span className={`text-[10px] font-bold font-mono ${liq.color}`}>{liq.prazoEstimado}</span>
                        </div>
                        <div className="w-full bg-zinc-200 dark:bg-zinc-700 h-1.5 rounded-full overflow-hidden">
                          <div className={`h-full rounded-full ${liq.barColor}`} style={{ width: `${liq.score}%` }} />
                        </div>
                      </div>
                    );
                  })()}

                  {(() => {
                    const risk = calculateVehicleRisk(selectedVehicle);
                    return (
                      <div className="bg-zinc-50 dark:bg-[#2C2C2E]/30 p-3 rounded-xl border border-zinc-200 dark:border-[#2C2C2E] space-y-1.5">
                        <div className="flex items-center justify-between">
                          <span className="text-[9px] font-bold text-zinc-500 dark:text-zinc-400 font-mono uppercase">Grau de Risco</span>
                          <span className={`text-[10px] font-bold ${risk.color}`}>Risco {risk.label}</span>
                        </div>
                        <div className="w-full bg-zinc-200 dark:bg-zinc-700 h-1.5 rounded-full overflow-hidden">
                          <div className={`h-full rounded-full ${risk.label === 'Baixo' ? 'bg-emerald-500' : 'bg-rose-500'}`} style={{ width: `${risk.score}%` }} />
                        </div>
                      </div>
                    );
                  })()}
                </div>

                {/* Risk Analysis Note */}
                <div className="space-y-2 pt-1 text-xs">
                  <div className="flex gap-2 items-start bg-zinc-50 dark:bg-[#2C2C2E]/30 p-3 rounded-xl border border-zinc-200 dark:border-[#2C2C2E]">
                    <AlertTriangle className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
                    <div>
                      <span className="text-[9px] font-bold text-zinc-500 dark:text-zinc-400 block font-mono">RISCO MECÂNICO E DE KM</span>
                      <p className="text-[11px] text-zinc-600 dark:text-zinc-300 leading-normal mt-0.5">{selectedVehicle.riskAnalysis || 'Análise técnica não efetuada.'}</p>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="pt-3 space-y-2.5">
                  {canEdit && selectedVehicle.id && !vehicles.some(v => v.id === selectedVehicle.id) && (
                    <button
                      onClick={() => {
                        setVehicles(prev => [selectedVehicle, ...prev]);
                        setToast({
                          message: `Lote "${selectedVehicle.model}" adicionado à planilha com sucesso!`,
                          type: 'success'
                        });
                        setIsDetailsModalOpen(false);
                      }}
                      className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white rounded-xl text-xs font-extrabold shadow-sm hover:shadow-md transition-all cursor-pointer flex items-center justify-center gap-2"
                    >
                      <CheckSquare className="h-4 w-4" />
                      <span>Adicionar à Planilha</span>
                    </button>
                  )}

                  <button
                    onClick={() => handleExportPDFVehicle(selectedVehicle)}
                    className="w-full py-2.5 px-4 bg-zinc-900 hover:bg-black dark:bg-[#2C2C2E] dark:hover:bg-[#3A3A3C] text-white rounded-xl text-xs font-extrabold shadow-sm hover:shadow-md transition-all cursor-pointer flex items-center justify-center gap-2"
                  >
                    <FileDown className="h-4 w-4 text-emerald-400" />
                    <span>Exportar Relatório PDF</span>
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL EDIÇÃO DO LOTE DE VEÍCULO */}
      <AnimatePresence>
        {isEditModalOpen && editingVehicle && (
          <div
            className="fixed inset-0 z-[60] flex items-center justify-center p-3 sm:p-4 bg-black/70 backdrop-blur-xs overflow-y-auto"
            onClick={() => setIsEditModalOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 15 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 15 }}
              transition={{ duration: 0.2 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white dark:bg-[#1C1C1E] border border-zinc-200 dark:border-[#2C2C2E] rounded-3xl shadow-2xl max-w-lg w-full overflow-hidden my-auto"
              id="modal-editar-lote-veiculo"
            >
              {/* Header */}
              <div className="p-4 sm:p-5 border-b border-zinc-200 dark:border-[#2C2C2E] bg-zinc-50 dark:bg-[#2C2C2E]/30 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 p-2.5 rounded-2xl shrink-0">
                    <Pencil className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                  </div>
                  <div>
                    <h3 className="text-base font-black text-zinc-900 dark:text-white font-sans tracking-tight">
                      Editar Lote do Veículo
                    </h3>
                    <p className="text-[11px] text-zinc-500 dark:text-zinc-400 font-medium">
                      Atualize as especificações e métricas financeiras
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="p-2 rounded-xl text-zinc-400 hover:text-zinc-700 dark:hover:text-white hover:bg-zinc-200 dark:hover:bg-[#2C2C2E] cursor-pointer transition-colors"
                  title="Fechar"
                  id="btn-close-modal-editar-lote"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Form */}
              <form onSubmit={handleSaveEditVehicle} className="p-5 sm:p-6 space-y-4 max-h-[75vh] overflow-y-auto">
                <div>
                  <label className="text-[10px] font-bold text-zinc-600 dark:text-zinc-300 block mb-1 uppercase font-mono">
                    Modelo / Versão *
                  </label>
                  <input
                    type="text"
                    required
                    value={editModel}
                    onChange={(e) => setEditModel(e.target.value)}
                    className="w-full bg-zinc-50 dark:bg-[#2C2C2E]/50 text-xs font-semibold border border-zinc-200 dark:border-[#2C2C2E] rounded-xl p-3 text-zinc-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all"
                    placeholder="Ex: Toyota Corolla XEi 2.0 Flex Aut."
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] font-bold text-zinc-600 dark:text-zinc-300 block mb-1 uppercase font-mono">
                      Ano / Modelo
                    </label>
                    <input
                      type="text"
                      value={editYear}
                      onChange={(e) => setEditYear(e.target.value)}
                      className="w-full bg-zinc-50 dark:bg-[#2C2C2E]/50 text-xs font-semibold border border-zinc-200 dark:border-[#2C2C2E] rounded-xl p-3 text-zinc-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all"
                      placeholder="Ex: 2021/2022"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-zinc-600 dark:text-zinc-300 block mb-1 uppercase font-mono">
                      Quilometragem (KM)
                    </label>
                    <input
                      type="text"
                      value={editKm}
                      onChange={(e) => setEditKm(e.target.value)}
                      className="w-full bg-zinc-50 dark:bg-[#2C2C2E]/50 text-xs font-semibold border border-zinc-200 dark:border-[#2C2C2E] rounded-xl p-3 text-zinc-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all"
                      placeholder="Ex: 48.000 km"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2.5">
                  <div>
                    <label className="text-[10px] font-bold text-zinc-600 dark:text-zinc-300 block mb-1 uppercase font-mono">
                      Tabela FIPE (R$)
                    </label>
                    <input
                      type="number"
                      value={editFipe}
                      onChange={(e) => setEditFipe(e.target.value)}
                      className="w-full bg-zinc-50 dark:bg-[#2C2C2E]/50 text-xs font-semibold border border-zinc-200 dark:border-[#2C2C2E] rounded-xl p-2.5 text-zinc-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all"
                      placeholder="Ex: 85000"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-zinc-600 dark:text-zinc-300 block mb-1 uppercase font-mono">
                      Valor Mercado (R$)
                    </label>
                    <input
                      type="number"
                      value={editMarketValue}
                      onChange={(e) => setEditMarketValue(e.target.value)}
                      className="w-full bg-zinc-50 dark:bg-[#2C2C2E]/50 text-xs font-semibold border border-zinc-200 dark:border-[#2C2C2E] rounded-xl p-2.5 text-zinc-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all"
                      placeholder="Ex: 89000"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-zinc-600 dark:text-zinc-300 block mb-1 uppercase font-mono">
                      Lance Sugerido (R$)
                    </label>
                    <input
                      type="number"
                      value={editSuggestedBid}
                      onChange={(e) => setEditSuggestedBid(e.target.value)}
                      className="w-full bg-zinc-50 dark:bg-[#2C2C2E]/50 text-xs font-semibold border border-zinc-200 dark:border-[#2C2C2E] rounded-xl p-2.5 text-zinc-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all"
                      placeholder="Ex: 55000"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[10px] font-bold text-zinc-600 dark:text-zinc-300 block mb-1 uppercase font-mono">
                    Classificação / Parecer
                  </label>
                  <select
                    value={editCategory}
                    onChange={(e) => setEditCategory(e.target.value as 'Prioritário' | 'Não Indicado')}
                    className="w-full bg-zinc-50 dark:bg-[#2C2C2E]/50 text-xs font-semibold border border-zinc-200 dark:border-[#2C2C2E] rounded-xl p-3 text-zinc-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all"
                  >
                    <option value="Prioritário">Prioritário (Recomendado)</option>
                    <option value="Não Indicado">Não Indicado (Alto Risco)</option>
                  </select>
                </div>

                <div>
                  <label className="text-[10px] font-bold text-zinc-600 dark:text-zinc-300 block mb-1 uppercase font-mono">
                    Análise de Risco Operacional
                  </label>
                  <textarea
                    rows={2}
                    value={editRiskAnalysis}
                    onChange={(e) => setEditRiskAnalysis(e.target.value)}
                    className="w-full bg-zinc-50 dark:bg-[#2C2C2E]/50 text-xs font-semibold border border-zinc-200 dark:border-[#2C2C2E] rounded-xl p-3 text-zinc-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all resize-none"
                    placeholder="Observações sobre mecânica, histórico de leilão, funilaria..."
                  />
                </div>

                <div>
                  <label className="text-[10px] font-bold text-zinc-600 dark:text-zinc-300 block mb-1 uppercase font-mono">
                    Resumo Executivo / Justificativa
                  </label>
                  <textarea
                    rows={2}
                    value={editExecutiveSummary}
                    onChange={(e) => setEditExecutiveSummary(e.target.value)}
                    className="w-full bg-zinc-50 dark:bg-[#2C2C2E]/50 text-xs font-semibold border border-zinc-200 dark:border-[#2C2C2E] rounded-xl p-3 text-zinc-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all resize-none"
                    placeholder="Resumo estratégico para o investidor..."
                  />
                </div>

                <div className="pt-3 flex items-center justify-end gap-3 border-t border-zinc-150 dark:border-[#2C2C2E] mt-4">
                  <button
                    type="button"
                    onClick={() => setIsEditModalOpen(false)}
                    className="px-4 py-2.5 rounded-xl text-xs font-bold text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-[#2C2C2E] border border-zinc-200 dark:border-[#2C2C2E] cursor-pointer transition"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="py-2.5 px-5 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white rounded-xl text-xs font-extrabold shadow-sm transition-all cursor-pointer flex items-center justify-center gap-2"
                  >
                    <CheckSquare className="h-3.5 w-3.5" />
                    <span>Salvar Alterações</span>
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* GORGEOUS CUSTOM REACT MODAL FOR CONFIRMATIONS (Avoids iframe sandbox blocking confirm()) */}
      <AnimatePresence>
        {(deleteConfirmId !== null || clearAllConfirm) && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-zinc-950/60 backdrop-blur-xs">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white dark:bg-[#1C1C1E] border border-zinc-200 dark:border-[#2C2C2E] rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-6"
            >
              <div className="flex items-start gap-4">
                <div className="p-3 bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 rounded-2xl border border-rose-100 dark:border-rose-900/40 shrink-0">
                  <AlertTriangle className="h-6 w-6 animate-pulse" />
                </div>
                <div className="space-y-1.5">
                  <h4 className="text-base font-black text-zinc-900 dark:text-white font-sans tracking-tight">
                    {clearAllConfirm ? 'Limpar Planilha Completa?' : 'Remover Lote da Planilha?'}
                  </h4>
                  <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
                    {clearAllConfirm 
                      ? 'Esta ação apagará todos os veículos da sua planilha atual. Os lotes históricos originais poderão ser restaurados a qualquer momento.'
                      : `Você tem certeza de que deseja remover o lote "${vehicles.find(v => v.id === deleteConfirmId)?.model || 'selecionado'}" da sua planilha de viabilidade?`
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
                  className="px-4 py-2.5 rounded-xl text-xs font-bold bg-zinc-100 dark:bg-[#2C2C2E] hover:bg-zinc-200 dark:hover:bg-[#3A3A3C] text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-[#3A3A3C] cursor-pointer transition active:scale-95"
                >
                  Cancelar
                </button>
                <button
                  onClick={() => {
                    if (clearAllConfirm) {
                      setVehicles([]);
                      setSelectedId('');
                      setIsDetailsModalOpen(false);
                      setClearAllConfirm(false);
                      setToast({ message: 'Planilha limpa com sucesso!', type: 'success' });
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

      {/* ELEGANT REACT TOAST NOTIFICATION */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="fixed bottom-6 right-6 z-50 flex items-center gap-3 px-5 py-3.5 bg-white border border-zinc-200 rounded-2xl shadow-xl"
          >
            <div className={`h-2 w-2 rounded-full ${
              toast.type === 'success' ? 'bg-emerald-500' : toast.type === 'error' ? 'bg-rose-500' : 'bg-indigo-500'
            }`} />
            <span className="text-xs font-bold text-zinc-800">{toast.message}</span>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
