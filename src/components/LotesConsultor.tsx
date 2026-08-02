import React, { useState, useEffect } from 'react';
import { 
  Sparkles, AlertTriangle, CheckSquare, RefreshCw, FileText, Send, 
  Trash2, Gavel, ArrowRight, BookOpen, ShieldCheck, HelpCircle, 
  ShieldAlert, Info, TrendingUp, DollarSign, SlidersHorizontal, Search, Pencil
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

import { VehicleLot, AppUser } from '../types';
import { safeStorage } from '../utils/safeStorage';

// Initial pre-loaded historical vehicle lots as requested
export const INITIAL_VEHICLES: VehicleLot[] = [];

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

  // Chat/QA Console state
  const [chatInput, setChatInput] = useState('');
  const [chatMessages, setChatMessages] = useState<{ id: string; role: 'user' | 'assistant'; content: string; timestamp: string }[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content: 'Olá! Sou seu Consultor Especialista em Leilões de Veículos. Selecione um dos lotes ao lado ou envie um novo modelo para realizarmos a análise completa de viabilidade, liquidez e riscos.',
      timestamp: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
    }
  ]);
  const [isChatLoading, setIsChatLoading] = useState(false);

  // Handle selected vehicle changes (updates assistant welcoming message context)
  useEffect(() => {
    if (selectedVehicle) {
      setChatMessages([
        {
          id: `welcome-${selectedVehicle.id}`,
          role: 'assistant',
          content: `Análise ativa para: **${selectedVehicle.model} (${selectedVehicle.year})**
          
**1. Regra do Teto (70% FIPE):**
- Tabela FIPE: ${formatBRL(selectedVehicle.fipe)}
- Lance Máximo Sugerido: **${formatBRL(selectedVehicle.suggestedBid)}**
- *Cálculo:* Lance sugerido de modo que (Lance + 5% Comissão + R$ 1.000 taxas) não passe de 70% FIPE (${formatBRL(selectedVehicle.fipe * 0.70)}).
 
**2. Avaliação de Liquidez:**
- Liquidez de Mercado: **${selectedVehicle.liquidity}**
- Classificação: **${selectedVehicle.category === 'Prioritário' ? '🟢 Prioritário (Recomendado)' : '🔴 Não Indicado (Alto Risco)'}**
 
**3. Parecer Técnico & Mecânico:**
- KM Registrado: ${selectedVehicle.km}
- ${selectedVehicle.riskAnalysis || 'Sem observações adicionais.'}
 
*Deseja saber mais sobre as fragilidades crônicas deste motor ou custos tributários de transferência? Pode perguntar!*`,
          timestamp: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
        }
      ]);
    }
  }, [selectedId]);

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
      if (selectedId === deleteConfirmId) {
        setSelectedId(updated[0]?.id || 'v-1');
      }
      setToast({
        message: 'Lote removido com sucesso!',
        type: 'success'
      });
      setDeleteConfirmId(null);
    }
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
            title: selectedVehicle.model,
            category: 'vehicle',
            typeText: 'Automóvel',
            location: 'Rio Grande do Sul',
            marketValue: selectedVehicle.fipe,
            currentBid: selectedVehicle.suggestedBid,
            portalName: 'Consultoria Automotiva de Leilões'
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
        content: `Certo! Como Consultor Especialista, enfatizo a Regra do Teto (70% FIPE) para o lote **${selectedVehicle.model}**. Recomendo analisar o estado da correia dentada se for o motor de 3 cilindros Ford, ou checar o histórico do cabeçote no motor Sigma. Qual outra dúvida técnica você possui?`,
        timestamp: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
      }]);
    } finally {
      setIsChatLoading(false);
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
    <div id="lotes-consultor-tab" className="space-y-8 font-sans">
      
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* LEFT COLUMN: REGISTER & INPUT PANELS */}
        <div className="lg:col-span-4 space-y-6">
          
          {/* REGISTER NEW VEHICLE LOT */}
          <div className="bg-white p-6 rounded-3xl border border-zinc-200 shadow-xs space-y-5">
            <div className="flex items-center gap-2 pb-2 border-b border-zinc-200">
              <Sparkles className="h-4.5 w-4.5 text-indigo-500 animate-pulse" />
              <h3 className="font-sans font-extrabold text-zinc-800 text-sm">
                Analisar Lote
              </h3>
            </div>

            <form onSubmit={handleAnalyzeNewLot} className="space-y-4">
              <div>
                <label className="text-[10px] font-bold text-zinc-500 block mb-1">MODELO / VERSÃO *</label>
                <input
                  type="text"
                  value={newModel}
                  onChange={(e) => setNewModel(e.target.value)}
                  className="w-full bg-zinc-50 text-xs font-semibold border border-zinc-200 rounded-xl p-2.5 text-zinc-800 focus:outline-none focus:ring-1 focus:ring-emerald-500 transition-all placeholder:text-zinc-400"
                  placeholder="Ex: Fiat Uno Attractive 1.0"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-bold text-zinc-500 block mb-1">ANO (EX: 17/17)</label>
                  <input
                    type="text"
                    value={newYear}
                    onChange={(e) => setNewYear(e.target.value)}
                    className="w-full bg-zinc-50 text-xs font-semibold border border-zinc-200 rounded-xl p-2.5 text-zinc-800 focus:outline-none focus:ring-1 focus:ring-emerald-500 transition-all"
                    placeholder="Ex: 17/17"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-zinc-500 block mb-1">KM (EX: 80K)</label>
                  <input
                    type="text"
                    value={newKm}
                    onChange={(e) => setNewKm(e.target.value)}
                    className="w-full bg-zinc-50 text-xs font-semibold border border-zinc-200 rounded-xl p-2.5 text-zinc-800 focus:outline-none focus:ring-1 focus:ring-emerald-500 transition-all"
                    placeholder="Ex: 80k"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-extrabold shadow-sm hover:shadow-md transition-all cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-wait"
              >
                {isSubmitting ? (
                  <>
                    <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                    <span>Analisando Lote...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="h-3.5 w-3.5 text-emerald-200 animate-pulse" />
                    <span>Analisar</span>
                  </>
                )}
              </button>
            </form>
          </div>

          {/* ACTIVE LOT BRIEFING */}
          <div className="bg-white text-zinc-800 p-6 rounded-3xl border border-zinc-200 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-zinc-200 pb-2.5">
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-emerald-600" />
                <span className="text-[10px] font-black uppercase font-mono text-zinc-500 tracking-wider">Lote Ativo Selecionado</span>
              </div>
              <span className={`px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-wider font-mono ${
                selectedVehicle.category === 'Prioritário'
                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                  : 'bg-rose-50 text-rose-700 border border-rose-200'
              }`}>
                {selectedVehicle.category}
              </span>
            </div>

            <div className="space-y-1">
              <span className="text-[10px] text-zinc-500 font-bold block uppercase tracking-wider font-mono">Veículo</span>
              <h4 className="text-base font-black text-zinc-800">{selectedVehicle.model}</h4>
              <p className="text-xs text-zinc-600 font-medium">Ano: {selectedVehicle.year} • Quilometragem: {selectedVehicle.km}</p>
            </div>

            <div className="grid grid-cols-3 gap-2 pt-2">
              <div className="bg-zinc-100 p-2.5 rounded-xl border border-zinc-150 text-center">
                <span className="text-[8px] text-zinc-500 block font-bold font-mono tracking-tight uppercase">FIPE</span>
                <span className="text-[11px] font-black text-zinc-800 font-mono block mt-0.5">{formatBRL(selectedVehicle.fipe)}</span>
              </div>
              <div className="bg-zinc-100 p-2.5 rounded-xl border border-zinc-150 text-center">
                <span className="text-[8px] text-zinc-500 block font-bold font-mono tracking-tight uppercase">MERCADO</span>
                <span className="text-[11px] font-black text-zinc-700 font-mono block mt-0.5">
                  {formatBRL(selectedVehicle.marketValue || Math.round(selectedVehicle.fipe * 1.05))}
                </span>
              </div>
              <div className="bg-emerald-50 p-2.5 rounded-xl border border-emerald-150 text-center">
                <span className="text-[8px] text-emerald-600 block font-bold font-mono tracking-tight uppercase">LANCE MÁX</span>
                <span className="text-[11px] font-black text-emerald-700 font-mono block mt-0.5">{formatBRL(selectedVehicle.suggestedBid)}</span>
              </div>
            </div>

            <div className="space-y-2 pt-1 text-xs">
              <div className="flex gap-2 items-start bg-zinc-50 p-3 rounded-xl border border-zinc-200">
                <AlertTriangle className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
                <div>
                  <span className="text-[9px] font-bold text-zinc-500 block font-mono">RISCO MECÂNICO E DE KM</span>
                  <p className="text-[11px] text-zinc-600 leading-normal mt-0.5">{selectedVehicle.riskAnalysis || 'Análise técnica não efetuada.'}</p>
                </div>
              </div>
            </div>

            {canEdit && selectedVehicle.id && !vehicles.some(v => v.id === selectedVehicle.id) && (
              <button
                onClick={() => {
                  setVehicles(prev => [selectedVehicle, ...prev]);
                  setToast({
                    message: `Lote "${selectedVehicle.model}" adicionado à planilha com sucesso!`,
                    type: 'success'
                  });
                }}
                className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-extrabold shadow-sm hover:shadow-md transition-all cursor-pointer flex items-center justify-center gap-2"
              >
                <CheckSquare className="h-4 w-4" />
                <span>Adicionar</span>
              </button>
            )}
          </div>

        </div>

        {/* RIGHT COLUMN: INTERACTIVE WORKSHEET TABLE (Chat card removed) */}
        <div className="lg:col-span-8 space-y-6">
          
          {/* VEHICLE WORKSHEET CARD */}
          <div className="bg-white rounded-3xl border border-zinc-200 shadow-xs p-6 space-y-4">
            
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-zinc-200">
              <div className="space-y-1">
                <h3 className="text-base font-black text-zinc-800 font-sans tracking-tight">Planilha de Análise de Viabilidade</h3>
                <p className="text-[11px] text-zinc-550">Selecione uma linha para carregar no painel de consultoria por IA.</p>
              </div>

              {/* Filtering Controls */}
              <div className="flex flex-wrap items-center gap-2">
                {['Todos', 'Prioritários', 'Não Indicados'].map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setFilterCategory(cat as any)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      filterCategory === cat
                        ? 'bg-emerald-600 text-white shadow-xs'
                        : 'bg-zinc-100 text-zinc-600 hover:text-zinc-800 hover:bg-zinc-200'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
                {isAdmin && vehicles.length > 0 && (
                  <button
                    onClick={() => {
                      setClearAllConfirm(true);
                    }}
                    className="px-3 py-1.5 rounded-lg text-xs font-bold bg-rose-50 text-rose-600 hover:bg-rose-100 border border-rose-200 transition-all cursor-pointer"
                    title="Excluir todos os lotes"
                  >
                    Limpar Planilha
                  </button>
                )}
              </div>
            </div>

            {/* Quick Search */}
            <div className="relative">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-zinc-400" />
              <input
                type="text"
                placeholder="Pesquisar por modelo ou ano na planilha..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full bg-zinc-50 text-xs pl-9 pr-4 py-2.5 border border-zinc-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-emerald-500 text-zinc-800"
              />
            </div>

            {/* Responsive Table Container - Desktop/Tablet */}
            <div className="hidden md:block overflow-x-auto rounded-xl border border-zinc-200">
              <table className="w-full text-left border-collapse min-w-[700px]">
                <thead>
                  <tr className="bg-zinc-100 text-zinc-600 text-[10px] font-black tracking-wider font-mono border-b border-zinc-200">
                    <th className="py-3 px-4">STATUS</th>
                    <th className="py-3 px-4">MODELO/VERSÃO</th>
                    <th className="py-3 px-4">ANO</th>
                    <th className="py-3 px-4">KM</th>
                    <th className="py-3 px-4">FIPE</th>
                    <th className="py-3 px-4">LANCE MÁX SUGERIDO</th>
                    <th className="py-3 px-4">LIQUIDEZ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-200 text-xs">
                  {filteredVehicles.length > 0 ? (
                    filteredVehicles.map((item) => {
                      const isSelected = item.id === selectedId;
                      return (
                        <tr
                          key={item.id}
                          onClick={() => setSelectedId(item.id)}
                          className={`hover:bg-zinc-50/80 cursor-pointer transition duration-150 ${
                            isSelected ? 'bg-zinc-100 font-bold border-l-4 border-zinc-400' : ''
                          }`}
                        >
                          <td className="py-3.5 px-4 whitespace-nowrap">
                            <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[9px] font-black uppercase font-mono ${
                              item.category === 'Prioritário'
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                : 'bg-rose-50 text-rose-700 border border-rose-200'
                            }`}>
                              <span className={`h-1.5 w-1.5 rounded-full ${item.category === 'Prioritário' ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                              {item.category === 'Prioritário' ? 'Recomendado' : 'Alto Risco'}
                            </span>
                          </td>
                           <td className="py-3.5 px-4 font-sans font-semibold text-zinc-800" onClick={(e) => e.stopPropagation()}>
                            {editingField?.id === item.id && editingField?.field === 'model' ? (
                              <input
                                type="text"
                                autoFocus
                                value={editValue}
                                onChange={(e) => setEditValue(e.target.value)}
                                onBlur={() => handleQuickEditSave(item.id, 'model', editValue)}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') handleQuickEditSave(item.id, 'model', editValue);
                                  if (e.key === 'Escape') setEditingField(null);
                                }}
                                className="w-full text-xs bg-white text-zinc-800 border border-emerald-500 rounded px-1.5 py-0.5 focus:outline-none focus:ring-1 focus:ring-emerald-500 font-semibold"
                              />
                            ) : (
                              <span 
                                onClick={() => {
                                  if (canEdit) {
                                    setEditingField({ id: item.id, field: 'model' });
                                    setEditValue(item.model);
                                  }
                                }}
                                className={canEdit ? "cursor-pointer hover:text-emerald-600 hover:underline decoration-dotted flex items-center justify-between gap-1 group" : ""}
                                title={canEdit ? "Clique para editar" : undefined}
                              >
                                <span>{item.model}</span>
                                {canEdit && <Pencil className="h-2.5 w-2.5 opacity-0 group-hover:opacity-100 text-zinc-400 transition-opacity inline shrink-0" />}
                              </span>
                            )}
                          </td>
                          <td className="py-3.5 px-4 font-mono font-bold text-zinc-500" onClick={(e) => e.stopPropagation()}>
                            {editingField?.id === item.id && editingField?.field === 'year' ? (
                              <input
                                type="text"
                                autoFocus
                                value={editValue}
                                onChange={(e) => setEditValue(e.target.value)}
                                onBlur={() => handleQuickEditSave(item.id, 'year', editValue)}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') handleQuickEditSave(item.id, 'year', editValue);
                                  if (e.key === 'Escape') setEditingField(null);
                                }}
                                className="w-16 text-xs bg-white text-zinc-800 border border-emerald-500 rounded px-1.5 py-0.5 focus:outline-none focus:ring-1 focus:ring-emerald-500 font-bold font-mono"
                              />
                            ) : (
                              <span 
                                onClick={() => {
                                  if (canEdit) {
                                    setEditingField({ id: item.id, field: 'year' });
                                    setEditValue(item.year);
                                  }
                                }}
                                className={canEdit ? "cursor-pointer hover:text-emerald-600 hover:underline decoration-dotted flex items-center justify-between gap-1 group" : ""}
                                title={canEdit ? "Clique para editar" : undefined}
                              >
                                <span>{item.year}</span>
                                {canEdit && <Pencil className="h-2.5 w-2.5 opacity-0 group-hover:opacity-100 text-zinc-400 transition-opacity inline shrink-0" />}
                              </span>
                            )}
                          </td>
                          <td className="py-3.5 px-4 font-mono font-bold text-zinc-500" onClick={(e) => e.stopPropagation()}>
                            {editingField?.id === item.id && editingField?.field === 'km' ? (
                              <input
                                type="text"
                                autoFocus
                                value={editValue}
                                onChange={(e) => setEditValue(e.target.value)}
                                onBlur={() => handleQuickEditSave(item.id, 'km', editValue)}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') handleQuickEditSave(item.id, 'km', editValue);
                                  if (e.key === 'Escape') setEditingField(null);
                                }}
                                className="w-20 text-xs bg-white text-zinc-800 border border-emerald-500 rounded px-1.5 py-0.5 focus:outline-none focus:ring-1 focus:ring-emerald-500 font-bold font-mono"
                              />
                            ) : (
                              <span 
                                onClick={() => {
                                  if (canEdit) {
                                    setEditingField({ id: item.id, field: 'km' });
                                    setEditValue(item.km);
                                  }
                                }}
                                className={canEdit ? "cursor-pointer hover:text-emerald-600 hover:underline decoration-dotted flex items-center justify-between gap-1 group" : ""}
                                title={canEdit ? "Clique para editar" : undefined}
                              >
                                <span>{item.km}</span>
                                {canEdit && <Pencil className="h-2.5 w-2.5 opacity-0 group-hover:opacity-100 text-zinc-400 transition-opacity inline shrink-0" />}
                              </span>
                            )}
                          </td>
                          <td className="py-3.5 px-4 font-mono font-bold text-zinc-800" onClick={(e) => e.stopPropagation()}>
                            {editingField?.id === item.id && editingField?.field === 'fipe' ? (
                              <input
                                type="text"
                                autoFocus
                                value={editValue}
                                onChange={(e) => setEditValue(e.target.value)}
                                onBlur={() => handleQuickEditSave(item.id, 'fipe', editValue)}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') handleQuickEditSave(item.id, 'fipe', editValue);
                                  if (e.key === 'Escape') setEditingField(null);
                                }}
                                className="w-24 text-xs bg-white text-zinc-800 border border-emerald-500 rounded px-1.5 py-0.5 focus:outline-none focus:ring-1 focus:ring-emerald-500 font-bold font-mono"
                              />
                            ) : (
                              <span 
                                onClick={() => {
                                  if (canEdit) {
                                    setEditingField({ id: item.id, field: 'fipe' });
                                    setEditValue(item.fipe.toString());
                                  }
                                }}
                                className={canEdit ? "cursor-pointer hover:text-emerald-600 hover:underline decoration-dotted flex items-center justify-between gap-1 group" : ""}
                                title={canEdit ? "Clique para editar" : undefined}
                              >
                                <span>{formatBRL(item.fipe)}</span>
                                {canEdit && <Pencil className="h-2.5 w-2.5 opacity-0 group-hover:opacity-100 text-zinc-400 transition-opacity inline shrink-0" />}
                              </span>
                            )}
                          </td>
                          <td className="py-3.5 px-4 font-mono font-extrabold text-emerald-600" onClick={(e) => e.stopPropagation()}>
                            {editingField?.id === item.id && editingField?.field === 'suggestedBid' ? (
                              <input
                                type="text"
                                autoFocus
                                value={editValue}
                                onChange={(e) => setEditValue(e.target.value)}
                                onBlur={() => handleQuickEditSave(item.id, 'suggestedBid', editValue)}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') handleQuickEditSave(item.id, 'suggestedBid', editValue);
                                  if (e.key === 'Escape') setEditingField(null);
                                }}
                                className="w-24 text-xs bg-white text-zinc-800 border border-emerald-500 rounded px-1.5 py-0.5 focus:outline-none focus:ring-1 focus:ring-emerald-500 font-extrabold font-mono"
                              />
                            ) : (
                              <span 
                                onClick={() => {
                                  if (canEdit) {
                                    setEditingField({ id: item.id, field: 'suggestedBid' });
                                    setEditValue(item.suggestedBid.toString());
                                  }
                                }}
                                className={canEdit ? "cursor-pointer text-emerald-600 hover:text-emerald-750 hover:underline decoration-dotted flex items-center justify-between gap-1 group" : ""}
                                title={canEdit ? "Clique para editar" : undefined}
                              >
                                <span>{formatBRL(item.suggestedBid)}</span>
                                {canEdit && <Pencil className="h-2.5 w-2.5 opacity-0 group-hover:opacity-100 text-emerald-500 transition-opacity inline shrink-0" />}
                              </span>
                            )}
                          </td>
                          <td className="py-3.5 px-4">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold font-sans ${
                              item.liquidity === 'Altíssima'
                                ? 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                                : item.liquidity === 'Média'
                                ? 'bg-amber-50 text-amber-700 border border-amber-200'
                                : 'bg-zinc-100 text-zinc-500'
                            }`}>
                              {item.liquidity}
                            </span>
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-zinc-400 font-medium">
                        <div className="flex flex-col items-center gap-3">
                          <span>Nenhum veículo encontrado para os critérios inseridos.</span>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Mobile Cards View - For better visualization */}
            <div className="md:hidden space-y-3">
              {filteredVehicles.length > 0 ? (
                filteredVehicles.map((item) => {
                  const isSelected = item.id === selectedId;
                  return (
                    <div
                      key={item.id}
                      onClick={() => setSelectedId(item.id)}
                      className={`p-4 rounded-xl border transition-all duration-300 transform hover:scale-105 hover:shadow-xl hover:shadow-black/20 cursor-pointer ${
                        isSelected
                          ? 'bg-zinc-50 border-zinc-400 shadow-sm ring-1 ring-zinc-400/20 font-bold'
                          : 'bg-white border-zinc-200 hover:border-zinc-300'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2 mb-2.5">
                        <div className="space-y-1">
                          <div className="flex items-center gap-1.5">
                            <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[9px] font-black uppercase font-mono ${
                              item.category === 'Prioritário'
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                : 'bg-rose-50 text-rose-700 border border-rose-200'
                            }`}>
                              <span className={`h-1.5 w-1.5 rounded-full ${item.category === 'Prioritário' ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                              {item.category === 'Prioritário' ? 'Recomendado' : 'Alto Risco'}
                            </span>
                          </div>
                          <h4 className="text-sm font-bold text-zinc-800 font-sans leading-snug">
                            {item.model}
                          </h4>
                          <div className="flex flex-wrap gap-x-2.5 gap-y-1 text-[11px] text-zinc-550 font-medium">
                            <span>Ano: <strong className="text-zinc-700 font-mono">{item.year}</strong></span>
                            <span>•</span>
                            <span>KM: <strong className="text-zinc-700 font-mono">{item.km}</strong></span>
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-2 pt-2.5 border-t border-zinc-200">
                        <div className="bg-zinc-100 p-2 rounded-lg border border-zinc-150">
                          <span className="text-[9px] text-zinc-500 block font-bold font-mono tracking-wider uppercase">FIPE</span>
                          <span className="text-[12px] font-black text-zinc-800 font-mono block mt-0.5">{formatBRL(item.fipe)}</span>
                        </div>
                        <div className="bg-emerald-50 p-2 rounded-lg border border-emerald-100">
                          <span className="text-[9px] text-emerald-600 block font-bold font-mono tracking-wider uppercase">LANCE MÁX</span>
                          <span className="text-[12px] font-black text-emerald-700 font-mono block mt-0.5">{formatBRL(item.suggestedBid)}</span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between gap-2 mt-2.5 pt-2 border-t border-zinc-150">
                        <span className="text-[10px] text-zinc-500 font-bold font-mono uppercase">Liquidez de Mercado</span>
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold font-sans ${
                          item.liquidity === 'Altíssima'
                            ? 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                            : item.liquidity === 'Média'
                            ? 'bg-amber-50 text-amber-700 border border-amber-200'
                            : 'bg-zinc-100 text-zinc-500'
                        }`}>
                          {item.liquidity}
                        </span>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="py-8 text-center text-zinc-400 font-medium border border-zinc-200 rounded-xl bg-zinc-50">
                  <span>Nenhum veículo encontrado para os critérios inseridos.</span>
                </div>
              )}
            </div>

          </div>

          {/* CHAT / QA CONSULTING CONSOLE */}
          <div className="bg-white border border-zinc-200 rounded-3xl overflow-hidden shadow-3xs flex flex-col h-[500px]">
            <div className="bg-zinc-800 p-4 border-b border-zinc-700 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="h-9 w-9 bg-emerald-600 text-white rounded-xl flex items-center justify-center shadow-sm">
                  <Gavel className="h-5 w-5" />
                </div>
                <div>
                  <span className="text-xs font-black text-white block">Consultor Automotivo de Leilões (IA Expert)</span>
                  <span className="text-[10px] text-emerald-400 flex items-center gap-1 font-bold">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    Assessoria Técnica Ativa
                  </span>
                </div>
              </div>
              <button 
                onClick={() => setChatMessages([
                  {
                    id: 'welcome',
                    role: 'assistant',
                    content: `Olá! Sou seu Consultor Especialista em Leilões de Veículos. Selecione um dos lotes ao lado ou envie um novo modelo para realizarmos a análise completa de viabilidade, liquidez e riscos.`,
                    timestamp: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
                  }
                ])} 
                className="text-[10px] font-extrabold text-zinc-350 hover:text-white hover:bg-zinc-700 px-2.5 py-1.5 rounded bg-zinc-900 border border-zinc-750 cursor-pointer transition-all"
              >
                Limpar Histórico
              </button>
            </div>

            {/* Message Bubble Stream */}
            <div className="flex-1 p-4 overflow-y-auto space-y-4 font-sans text-xs bg-zinc-50">
              {chatMessages.map((msg) => {
                const isAi = msg.role === 'assistant';
                return (
                  <div
                    key={msg.id}
                    className={`flex ${isAi ? 'justify-start' : 'justify-end'}`}
                  >
                    <div className={`max-w-[85%] rounded-2xl p-4 leading-relaxed whitespace-pre-wrap ${
                      isAi 
                        ? 'bg-white border border-zinc-200 text-zinc-800 rounded-tl-none shadow-[0_1px_2px_rgba(0,0,0,0.02)]' 
                        : 'bg-zinc-800 text-white rounded-tr-none shadow-xs font-medium'
                    }`}>
                      <span className={`font-black text-[8.5px] block mb-1 font-mono uppercase tracking-wider ${isAi ? 'text-indigo-600' : 'text-zinc-355'}`}>
                        {isAi ? 'CONSELHO EXPERT' : 'SEU QUESTIONAMENTO'}
                      </span>
                      {msg.content}
                      <span className={`text-[8.5px] font-mono block text-right mt-1.5 ${isAi ? 'text-zinc-400' : 'text-zinc-300'}`}>{msg.timestamp}</span>
                    </div>
                  </div>
                );
              })}
              {isChatLoading && (
                <div className="flex justify-start">
                  <div className="bg-white border border-zinc-200 rounded-2xl rounded-tl-none p-4 max-w-sm flex items-center gap-2.5 text-zinc-500 text-xs shadow-3xs">
                    <RefreshCw className="h-3.5 w-3.5 animate-spin text-emerald-500" />
                    <span className="animate-pulse">Consultor analisando viabilidade e mecânica...</span>
                  </div>
                </div>
              )}
            </div>

            {/* Message input bar */}
            <div className="p-3 bg-zinc-100 border-t border-zinc-200 flex gap-2">
              <input
                type="text"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSendChatMessage()}
                className="flex-1 bg-white text-zinc-800 text-xs px-3.5 py-2.5 border border-zinc-200 rounded-xl focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 placeholder:text-zinc-400"
                placeholder={`Pergunte algo sobre o ${selectedVehicle.model} (crônicos, viabilidade etc)...`}
              />
              <button
                onClick={handleSendChatMessage}
                disabled={isChatLoading || !chatInput.trim()}
                className="px-4 bg-zinc-800 hover:bg-zinc-900 disabled:bg-zinc-200 disabled:text-zinc-400 text-white rounded-xl shadow-xs transition-all flex items-center justify-center cursor-pointer"
              >
                <Send className="h-4 w-4" />
              </button>
            </div>
          </div>

        </div>

      </div>

      {/* GORGEOUS CUSTOM REACT MODAL FOR CONFIRMATIONS (Avoids iframe sandbox blocking confirm()) */}
      <AnimatePresence>
        {(deleteConfirmId !== null || clearAllConfirm) && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/40 backdrop-blur-xs">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white border border-zinc-200 rounded-3xl p-6 max-w-md w-full shadow-xl space-y-6"
            >
              <div className="flex items-start gap-4">
                <div className="p-3 bg-rose-50 text-rose-600 rounded-2xl border border-rose-100 shrink-0">
                  <AlertTriangle className="h-6 w-6 animate-pulse" />
                </div>
                <div className="space-y-1.5">
                  <h4 className="text-base font-black text-zinc-900 font-sans tracking-tight">
                    {clearAllConfirm ? 'Limpar Planilha Completa?' : 'Remover Lote da Planilha?'}
                  </h4>
                  <p className="text-xs text-zinc-650 leading-relaxed">
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
                  className="px-4 py-2.5 rounded-xl text-xs font-bold bg-zinc-100 hover:bg-zinc-200 text-zinc-750 border border-zinc-300 cursor-pointer transition active:scale-95"
                >
                  Cancelar
                </button>
                <button
                  onClick={() => {
                    if (clearAllConfirm) {
                      setVehicles([]);
                      setSelectedId('');
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
