import React, { useState, useEffect } from 'react';
import { AuctionPortal, AuctionItem, AppUser } from '../types';
import { 
  Globe, Link, Plus, Trash2, RotateCw, ShieldCheck, Power, Search, 
  Clock, PlusCircle, AlertCircle, CheckCircle, ExternalLink, Activity, Pencil, Eye, Laptop, Sparkles, Check, X,
  Building, Car, ThumbsUp, Home
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface PortalManagerProps {
  portals: AuctionPortal[];
  onAddPortal: (portal: AuctionPortal) => void;
  onUpdatePortal: (portal: AuctionPortal) => void;
  onDeletePortal: (id: string) => void;
  onToggleStatus: (id: string) => void;
  onTriggerScan: (portal: AuctionPortal) => void;
  isScanning: boolean;
  activeScanPortalId: string | null;
  scanLogs: string[];
  onSwitchToTab?: (tabId: string) => void;
  currentUser?: AppUser | null;
}

export default function PortalManager({
  portals,
  onAddPortal,
  onUpdatePortal,
  onDeletePortal,
  onToggleStatus,
  onTriggerScan,
  isScanning,
  activeScanPortalId,
  scanLogs,
  onSwitchToTab,
  currentUser
}: PortalManagerProps) {
  const isAdmin = currentUser?.role === 'admin';

  // Form states for creating/editing portals
  const [isAdding, setIsAdding] = useState(false);
  const [editingPortal, setEditingPortal] = useState<AuctionPortal | null>(null);

  // Embedded Web Browser Portal simulation
  const [activeBrowserPortal, setActiveBrowserPortal] = useState<AuctionPortal | null>(null);
  const [browserImporting, setBrowserImporting] = useState(false);
  const [browserImportProgress, setBrowserImportProgress] = useState(0);
  const [showSuccessImport, setShowSuccessImport] = useState(false);

  // Form Fields
  const [name, setName] = useState('');
  const [url, setUrl] = useState('');
  const [state, setState] = useState('RS');
  const [statusState, setStatusState] = useState<'active' | 'inactive'>('active');
  const [scrapingFrequency, setScrapingFrequency] = useState<'real_time' | 'hourly' | 'daily' | 'weekly'>('daily');
  const [categoryFocus, setCategoryFocus] = useState<'all' | 'real_estate' | 'vehicle'>('all');
  const [notes, setNotes] = useState('');
  const [filterAssetType, setFilterAssetType] = useState('all');
  const [filterCity, setFilterCity] = useState('all');

  const [formError, setFormError] = useState('');

  const resetForm = () => {
    setName('');
    setUrl('');
    setState('RS');
    setStatusState('active');
    setScrapingFrequency('daily');
    setCategoryFocus('all');
    setNotes('');
    setFilterAssetType('all');
    setFilterCity('all');
    setFormError('');
    setIsAdding(false);
    setEditingPortal(null);
  };

  useEffect(() => {
    const handleOpenModal = () => {
      setIsAdding(true);
    };
    window.addEventListener('open-new-portal-modal', handleOpenModal);
    return () => {
      window.removeEventListener('open-new-portal-modal', handleOpenModal);
    };
  }, []);

  const handleEditClick = (portal: AuctionPortal) => {
    setEditingPortal(portal);
    setName(portal.name);
    setUrl(portal.url);
    setState(portal.state);
    setStatusState(portal.status || 'active');
    setScrapingFrequency(portal.scrapingFrequency);
    setCategoryFocus(portal.categoryFocus);
    setNotes(portal.notes || '');
    setFilterAssetType(portal.filterAssetType || 'all');
    setFilterCity(portal.filterCity || 'all');
    setIsAdding(true);

    // Smooth scroll to form container for absolute visibility, especially on mobile
    setTimeout(() => {
      const container = document.getElementById('portal-form-container');
      if (container) {
        container.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 100);
  };

  // Automated visual browser search-and-import loop
  React.useEffect(() => {
    let interval: any = null;
    if (browserImporting) {
      setShowSuccessImport(false);
      interval = setInterval(() => {
        setBrowserImportProgress(prev => {
          if (prev >= 100) {
            clearInterval(interval);
            // After progress completes, execute scan to add lots to main system
            if (activeBrowserPortal) {
              onTriggerScan(activeBrowserPortal);
            }
            setBrowserImporting(false);
            setShowSuccessImport(true);
            return 100;
          }
          return prev + 5;
        });
      }, 150);
    } else {
      setBrowserImportProgress(0);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [browserImporting, activeBrowserPortal]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      setFormError('O nome do portal é obrigatório.');
      return;
    }
    if (!url.trim()) {
      setFormError('A URL oficial do portal é obrigatória.');
      return;
    }
    
    // Simple URL regex check
    try {
      const urlCheck = url.startsWith('http://') || url.startsWith('https://') ? url : `https://${url}`;
      new URL(urlCheck);
    } catch {
      setFormError('Insira um formato de link (URL) válido.');
      return;
    }

    const payload: AuctionPortal = {
      id: editingPortal ? editingPortal.id : `portal-${Date.now()}`,
      name: name.trim(),
      url: url.trim().startsWith('http') ? url.trim() : `https://${url.trim()}`,
      state: state.toUpperCase(),
      status: statusState,
      scrapingFrequency: 'daily',
      categoryFocus,
      notes: notes.trim() || undefined,
      lastScrapedAt: editingPortal ? editingPortal.lastScrapedAt : undefined,
      filterAssetType: 'all',
      filterCity: 'all',
    };

    if (editingPortal) {
      onUpdatePortal(payload);
    } else {
      onAddPortal(payload);
    }

    resetForm();
  };

  const getFrequencyLabel = (freq: string) => {
    switch (freq) {
      case 'real_time': return 'Tempo Real';
      case 'hourly': return 'A cada hora';
      case 'daily': return 'Diariamente';
      case 'weekly': return 'Semanalmente';
      default: return freq;
    }
  };

  const getFocusLabel = (focus: string) => {
    switch (focus) {
      case 'all': return 'Todos os Ativos';
      case 'real_estate': return 'Imóveis';
      case 'vehicle': return 'Veículos';
      default: return focus;
    }
  };

  return (
    <div id="portal-manager-root" className="space-y-6 font-sans">
      
      {/* Portal Registration / Editing Form Modal */}
      <AnimatePresence>
        {isAdding && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={resetForm}
              className="fixed inset-0 bg-zinc-950/45 backdrop-blur-xs cursor-pointer"
              id="portal-modal-backdrop"
            />

            {/* Modal Body */}
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 15 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 15 }}
              transition={{ type: 'spring', duration: 0.3 }}
              className="relative w-full max-w-lg bg-[#0E0E0E] rounded-3xl border border-[#2C2C2E] shadow-2xl overflow-hidden z-10 flex flex-col font-sans"
              id="portal-form-container"
            >
              {/* Header */}
              <div className="p-4 border-b border-[#2C2C2E] bg-[#0E0E0E] flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="bg-emerald-500/10 text-emerald-400 p-2 rounded-xl border border-emerald-500/20">
                    <Globe className="h-4.5 w-4.5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-extrabold text-[#F8FAFC]">
                      {editingPortal ? 'Editar Portal Regulado' : 'Cadastrar Portal Leiloeiro'}
                    </h3>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider font-mono mt-0.5">Rastreador Inteligente de Editais</p>
                  </div>
                </div>
                <button
                  onClick={resetForm}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-[#1C1C1E] cursor-pointer transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {/* Form Content */}
              <div className="p-5 overflow-y-auto max-h-[75vh] space-y-4 bg-[#0E0E0E]">
                {formError && (
                  <div className="bg-rose-950/40 border border-rose-800/50 rounded-xl p-3 flex items-start gap-2.5 text-xs text-rose-300 font-medium">
                    <AlertCircle className="h-4 w-4 text-rose-400 mt-0.5 shrink-0" />
                    <span>{formError}</span>
                  </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                  {/* Portal Name */}
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase font-mono block mb-1">Nome Portal/Leiloeiro</label>
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Ex: Rio Grande Leilões Oficiais"
                      className="w-full bg-[#1C1C1E] border border-[#2C2C2E] rounded-xl px-3.5 py-2.5 text-xs font-semibold font-inter text-[#F8FAFC] placeholder:text-zinc-500 focus:ring-1 focus:ring-emerald-500 focus:outline-none"
                    />
                  </div>

                  {/* URL */}
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase font-mono block mb-1">Link do site oficial</label>
                    <div className="relative">
                      <Globe className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-500" />
                      <input
                        type="text"
                        value={url}
                        onChange={(e) => setUrl(e.target.value)}
                        placeholder="www.exemplo-leiloes.com.br"
                        className="w-full bg-[#1C1C1E] border border-[#2C2C2E] rounded-xl pl-9 pr-3.5 py-2.5 text-xs font-semibold text-[#F8FAFC] placeholder:text-zinc-500 focus:ring-1 focus:ring-emerald-500 focus:outline-none"
                      />
                    </div>
                  </div>

                  {/* Estado */}
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase font-mono block mb-1">Estado</label>
                    <select
                      value={state}
                      onChange={(e) => setState(e.target.value)}
                      className="w-full bg-[#1C1C1E] border border-[#2C2C2E] rounded-xl px-3 py-2.5 text-xs font-semibold text-[#F8FAFC] focus:ring-1 focus:ring-emerald-500 focus:outline-none"
                    >
                      <option value="RS">RS (Rio Grande do Sul)</option>
                      <option value="SC">SC (Santa Catarina)</option>
                      <option value="PR">PR (Paraná)</option>
                      <option value="SP">SP (São Paulo)</option>
                      <option value="RJ">RJ (Rio de Janeiro)</option>
                      <option value="MG">MG (Minas Gerais)</option>
                    </select>
                  </div>

                  {/* Tipo */}
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase font-mono block mb-1.5">Tipo de Ativo</label>
                    <div className="grid grid-cols-3 gap-2">
                      <button
                        type="button"
                        onClick={() => setCategoryFocus('real_estate')}
                        className={`py-2.5 px-2 rounded-xl text-xs font-bold transition border cursor-pointer text-center ${
                          categoryFocus === 'real_estate'
                            ? 'bg-emerald-500 text-black border-emerald-400 font-extrabold shadow-sm'
                            : 'bg-[#1C1C1E] text-slate-300 border-[#2C2C2E] hover:bg-zinc-800'
                        }`}
                      >
                        Imóveis
                      </button>
                      <button
                        type="button"
                        onClick={() => setCategoryFocus('vehicle')}
                        className={`py-2.5 px-2 rounded-xl text-xs font-bold transition border cursor-pointer text-center ${
                          categoryFocus === 'vehicle'
                            ? 'bg-emerald-500 text-black border-emerald-400 font-extrabold shadow-sm'
                            : 'bg-[#1C1C1E] text-slate-300 border-[#2C2C2E] hover:bg-zinc-800'
                        }`}
                      >
                        Veículos
                      </button>
                      <button
                        type="button"
                        onClick={() => setCategoryFocus('all')}
                        className={`py-2.5 px-1 rounded-xl text-[11px] font-bold transition border cursor-pointer text-center flex items-center justify-center leading-tight min-h-[38px] ${
                          categoryFocus === 'all'
                            ? 'bg-emerald-500 text-black border-emerald-400 font-extrabold shadow-sm'
                            : 'bg-[#1C1C1E] text-slate-300 border-[#2C2C2E] hover:bg-zinc-800'
                        }`}
                      >
                        Imóveis e Veículos
                      </button>
                    </div>
                  </div>

                  {/* Habilitação */}
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase font-mono block mb-1.5">Habilitação</label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setStatusState('active')}
                        className={`py-2.5 px-3 rounded-xl text-xs font-bold transition border cursor-pointer text-center ${
                          statusState === 'active'
                            ? 'bg-emerald-500 text-black border-emerald-400 font-extrabold shadow-sm'
                            : 'bg-[#1C1C1E] text-slate-300 border-[#2C2C2E] hover:bg-zinc-800'
                        }`}
                      >
                        Sim (Habilitado)
                      </button>
                      <button
                        type="button"
                        onClick={() => setStatusState('inactive')}
                        className={`py-2.5 px-3 rounded-xl text-xs font-bold transition border cursor-pointer text-center ${
                          statusState === 'inactive'
                            ? 'bg-emerald-500 text-black border-emerald-400 font-extrabold shadow-sm'
                            : 'bg-[#1C1C1E] text-slate-300 border-[#2C2C2E] hover:bg-zinc-800'
                        }`}
                      >
                        Não
                      </button>
                    </div>
                  </div>

                  {/* Save and Delete Buttons */}
                  <div className="pt-2 space-y-2">
                    <button
                      type="submit"
                      className="w-full bg-emerald-500 hover:bg-emerald-400 text-black font-extrabold py-2.5 rounded-xl text-xs transition shadow-xs cursor-pointer uppercase tracking-wider"
                    >
                      {editingPortal ? 'Salvar Alterações' : 'Confirmar Cadastro de Portal'}
                    </button>
                    {editingPortal && (
                      <button
                        type="button"
                        onClick={() => {
                          if (confirm(`Tem certeza que deseja excluir o portal "${editingPortal.name}"?`)) {
                            onDeletePortal(editingPortal.id);
                            resetForm();
                          }
                        }}
                        className="w-full bg-rose-950/40 hover:bg-rose-900/60 text-rose-400 border border-rose-800/50 font-extrabold py-2.5 rounded-xl text-xs transition cursor-pointer flex items-center justify-center gap-1.5 uppercase tracking-wider"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                        Excluir Portal
                      </button>
                    )}
                  </div>
                </form>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Portals list representation (Cards view for both Mobile & Desktop) */}
      <div className="space-y-6 w-full">
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {portals.map((portal) => {
            const isActive = portal.status === 'active';

            return (
              <div 
                key={portal.id} 
                onClick={() => {
                  if (isAdmin) {
                    handleEditClick(portal);
                  }
                }}
                className={`bg-[#0E0E0E] border border-[#2C2C2E] rounded-xl p-3.5 md:p-4 shadow-sm transition-all hover:border-emerald-500/50 hover:bg-[#141416] cursor-pointer flex items-center justify-between gap-3 ${
                  isAdmin ? 'active:bg-[#1C1C1E]' : ''
                }`}
                title={isAdmin ? "Clique para editar este portal" : undefined}
              >
                {/* Left: Portal Name + URL */}
                <div className="min-w-0 flex-1">
                  <h5 className="font-extrabold font-inter text-[#F8FAFC] text-sm md:text-base truncate leading-snug hover:text-emerald-400 transition-colors">
                    {portal.name}
                  </h5>
                  <a 
                    href={portal.url} 
                    target="_blank" 
                    rel="noreferrer" 
                    onClick={(e) => e.stopPropagation()}
                    className="text-xs text-slate-400 font-mono hover:text-emerald-400 inline-flex items-center gap-1 transition truncate mt-0.5"
                  >
                    {portal.url}
                    <ExternalLink className="h-3 w-3 shrink-0" />
                  </a>
                </div>

                {/* Right: State + Category Icons + ThumbsUp */}
                <div className="portal-actions-container flex items-center gap-2.5 shrink-0">
                  <span className="text-xs font-mono font-extrabold text-slate-200 mr-0.5">
                    {portal.state}
                  </span>
                  
                  {(portal.categoryFocus === 'real_estate' || portal.categoryFocus === 'all') && (
                    <Home className="h-4.5 w-4.5 text-indigo-400 shrink-0" title="Imóveis" />
                  )}
                  {(portal.categoryFocus === 'vehicle' || portal.categoryFocus === 'all') && (
                    <Car className="h-4.5 w-4.5 text-amber-400 shrink-0" title="Veículos" />
                  )}

                  {isActive && (
                    <ThumbsUp className="h-4.5 w-4.5 text-emerald-400 fill-emerald-400/20 shrink-0" title="Habilitado" />
                  )}
                </div>
              </div>
            );
          })}
        </div>

          {/* SIMULADOR DE PORTAL LIVE & IMPORTADOR DIRETTO (REQUISITO EXCLUSIVO) */}
          <AnimatePresence>
            {activeBrowserPortal && (
              <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
                <motion.div
                  initial={{ opacity: 0, scale: 0.95, y: 15 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: 15 }}
                  className="bg-white rounded-3xl overflow-hidden shadow-2xl max-w-6xl w-full h-[85vh] flex flex-col border border-slate-200/50"
                  onClick={(e) => e.stopPropagation()}
                >
                  {/* Browser Window Chrome/MacOS style Header */}
                  <div className="bg-slate-900 px-5 py-3.5 flex items-center justify-between border-b border-slate-850 shrink-0 text-white">
                    {/* Left side: Window Controls & Title */}
                    <div className="flex items-center gap-3">
                      <div className="flex gap-1.5">
                        <span className="w-3 h-3 rounded-full bg-rose-500 block opacity-85 hover:opacity-100 cursor-pointer" onClick={() => { if (!browserImporting) setActiveBrowserPortal(null); }} />
                        <span className="w-3 h-3 rounded-full bg-amber-400 block opacity-85" />
                        <span className="w-3 h-3 rounded-full bg-emerald-500 block opacity-85" />
                      </div>
                      <div className="h-4 w-px bg-slate-800 mx-1" />
                      <div className="flex items-center gap-1.5 text-xs text-slate-350 font-bold">
                        <Laptop className="h-3.5 w-3.5 text-emerald-400" />
                        <span>Navegador IA Integrado — Visualizador de Portal</span>
                      </div>
                    </div>

                    {/* Active target label */}
                    <div className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 px-3 py-1 rounded-full text-[10px] font-black tracking-wider uppercase">
                      🛰️ {activeBrowserPortal.name}
                    </div>
                  </div>

                  {/* Browser Address Bar Area */}
                  <div className="bg-slate-800 px-4 py-2 flex items-center gap-2 border-b border-slate-700 shrink-0">
                    <div className="flex items-center gap-1 text-slate-400">
                      <span className="text-xs px-2 py-0.5 rounded hover:bg-slate-700 cursor-pointer text-slate-300">←</span>
                      <span className="text-xs px-2 py-0.5 rounded hover:bg-slate-700 cursor-pointer text-slate-300">→</span>
                    </div>
                    {/* Real URL Address Bar Input */}
                    <div className="flex-1 bg-slate-900 border border-slate-700/60 rounded-xl px-3 py-1.5 flex items-center justify-between text-xs text-slate-200 font-mono">
                      <div className="flex items-center gap-2 truncate">
                        <ShieldCheck className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                        <span className="text-[11px] text-emerald-400 select-all font-semibold shrink-0">https://</span>
                        <span className="truncate text-slate-200 select-all">{activeBrowserPortal.url}</span>
                      </div>
                      <span className="text-[9px] text-slate-500 bg-slate-800 px-2 py-0.5 rounded shrink-0 select-none">
                        CONEXÃO SEGURA SSL
                      </span>
                    </div>
                    {/* Close window */}
                    <button
                      onClick={() => { if (!browserImporting) setActiveBrowserPortal(null); }}
                      disabled={browserImporting}
                      className="text-xs text-slate-400 hover:text-white bg-slate-700 hover:bg-slate-600 px-3.5 py-1.5 rounded-xl font-bold cursor-pointer transition disabled:opacity-50"
                    >
                      Sair
                    </button>
                  </div>

                  {/* Split Dashboard Content (Simulated Viewport vs Extractor Widget) */}
                  <div className="flex-1 overflow-hidden grid grid-cols-12">
                    
                    {/* SIMULATED WEB listing rendering (LEFT: 65%) */}
                    <div className="col-span-12 lg:col-span-8 bg-slate-50 overflow-y-auto p-6 space-y-6 border-r border-slate-200/60">
                      
                      {/* Simulated Website Brand Banner */}
                      <div className="bg-white border border-slate-200/70 p-5 rounded-2xl shadow-xs space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-black tracking-widest text-[#d97706] uppercase bg-amber-50 px-2.5 py-1 rounded-md border border-amber-250">
                            🏢 PORTAL OFICIAL DE LEILÕES
                          </span>
                          <span className="text-xs text-slate-400 font-medium">Estado de Atuação: RS</span>
                        </div>
                        <h2 className="text-xl font-extrabold text-slate-800 font-sans tracking-tight">
                          {activeBrowserPortal.name} — Pregões Vigentes
                        </h2>
                        <p className="text-xs text-slate-500 leading-relaxed">
                          Seja bem-vindo à listagem de bens disponíveis. Nosso portal consolida leilões judiciais e extrajudiciais com amparo legal e transparência regulatória.
                        </p>
                      </div>

                      {/* Header showing filters applied */}
                      <div className="flex flex-wrap items-center justify-between gap-3 bg-indigo-50/40 border border-indigo-100 p-3.5 rounded-2xl">
                        <div className="text-xs text-slate-700">
                          <span className="font-bold text-slate-600">Filtros Ativos do Portal:</span>{' '}
                          <span className="bg-white border border-indigo-150 px-2 py-0.5 rounded font-black text-indigo-700 mx-1">
                            {activeBrowserPortal.filterAssetType === 'all' || !activeBrowserPortal.filterAssetType ? 'Todos os Ativos' : activeBrowserPortal.filterAssetType}
                          </span>
                          e
                          <span className="bg-white border border-indigo-150 px-2 py-0.5 rounded font-black text-indigo-700 mx-1">
                            {activeBrowserPortal.filterCity === 'all' || !activeBrowserPortal.filterCity ? 'Qualquer Cidade (RS)' : activeBrowserPortal.filterCity}
                          </span>
                        </div>
                        <span className="text-[10px] font-bold text-slate-400">
                          Total detectado: {
                            (() => {
                              const mockPortalAssetsLocal = [
                                { id: 'pa1', title: 'Apartamento Central Reformado com Vaga em Caxias do Sul', category: 'real_estate', typeText: 'Apartamento', location: 'Bairro Centro, Caxias do Sul - RS', marketValue: 460000, currentBid: 230000, image: 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&q=80&w=600', discountPercent: 50 },
                                { id: 'pa2', title: 'Casa de Alvenaria 3 Quartos em Porto Alegre - Bairro Ipanema', category: 'real_estate', typeText: 'Casa', location: 'Bairro Ipanema, Porto Alegre - RS', marketValue: 780000, currentBid: 390000, image: 'https://images.unsplash.com/photo-1570129477492-45c003edd2be?auto=format&fit=crop&q=80&w=600', discountPercent: 50 },
                                { id: 'pa3', title: 'Sobrado Moderno em Condomínio Fechado em Canoas', category: 'real_estate', typeText: 'Casa', location: 'Bairro Igara, Canoas - RS', marketValue: 920000, currentBid: 460000, image: 'https://images.unsplash.com/photo-1605276374104-dee2a0ed3cd6?auto=format&fit=crop&q=80&w=600', discountPercent: 50 },
                                { id: 'pa4', title: 'Sala Comercial Edifício Corporativo em Gramado - Centro', category: 'real_estate', typeText: 'Sala Comercial', location: 'Avenida Borges de Medeiros, Gramado - RS', marketValue: 350000, currentBid: 175000, image: 'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&q=80&w=600', discountPercent: 50 },
                                { id: 'va1', title: 'Chevrolet Tracker Premier 1.2 Turbo Flex 2022', category: 'vehicle', typeText: 'Carro', location: 'Canoas, RS - Pátio Oficial', marketValue: 125000, currentBid: 75000, image: 'https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?auto=format&fit=crop&q=80&w=600', discountPercent: 40 },
                                { id: 'va2', title: 'Toyota Corolla sedan XEi 2.0 Flex Aut. 2021', category: 'vehicle', typeText: 'Carro', location: 'Nova Santa Rita, RS - Pátio de Leilões', marketValue: 128000, currentBid: 78000, image: 'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?auto=format&fit=crop&q=80&w=600', discountPercent: 39 },
                                { id: 'va3', title: 'Jeep Compass Longitude T270 Turbo Flex 2022', category: 'vehicle', typeText: 'Carro', location: 'Porto Alegre, RS - Depósito Central', marketValue: 147500, currentBid: 95000, image: 'https://images.unsplash.com/photo-1571197162081-80c2e340153e?auto=format&fit=crop&q=80&w=600', discountPercent: 35 },
                                { id: 'va4', title: 'Honda HR-V EXL 1.8 Flex 2020', category: 'vehicle', typeText: 'Carro', location: 'Pelotas, RS - Pátio Sul Leilões', marketValue: 112000, currentBid: 71000, image: 'https://images.unsplash.com/photo-1511919884226-fd3cad34687c?auto=format&fit=crop&q=80&w=600', discountPercent: 37 }
                              ];
                              let filt = mockPortalAssetsLocal;
                              if (activeBrowserPortal.categoryFocus === 'real_estate') filt = filt.filter(x => x.category === 'real_estate');
                              if (activeBrowserPortal.categoryFocus === 'vehicle') filt = filt.filter(x => x.category === 'vehicle');
                              if (activeBrowserPortal.filterCity && activeBrowserPortal.filterCity !== 'all') filt = filt.filter(x => x.location.toLowerCase().includes(activeBrowserPortal.filterCity!.toLowerCase()));
                              if (activeBrowserPortal.filterAssetType && activeBrowserPortal.filterAssetType !== 'all') filt = filt.filter(x => x.typeText.toLowerCase().includes(activeBrowserPortal.filterAssetType!.toLowerCase()) || x.title.toLowerCase().includes(activeBrowserPortal.filterAssetType!.toLowerCase()));
                              return filt.length === 0 ? 1 : filt.length;
                            })()
                          } bens compatíveis
                        </span>
                      </div>

                      {/* Web view Feed Grid */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {(() => {
                          const mockPortalAssetsLocal = [
                            { id: 'pa1', title: 'Apartamento Central Reformado com Vaga em Caxias do Sul', category: 'real_estate', typeText: 'Apartamento', location: 'Bairro Centro, Caxias do Sul - RS', marketValue: 460000, currentBid: 230000, image: 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&q=80&w=600', discountPercent: 50 },
                            { id: 'pa2', title: 'Casa de Alvenaria 3 Quartos em Porto Alegre - Bairro Ipanema', category: 'real_estate', typeText: 'Casa/Sobrado', location: 'Bairro Ipanema, Porto Alegre - RS', marketValue: 780000, currentBid: 390000, image: 'https://images.unsplash.com/photo-1570129477492-45c003edd2be?auto=format&fit=crop&q=80&w=600', discountPercent: 50 },
                            { id: 'pa3', title: 'Sobrado Moderno em Condomínio Fechado em Canoas', category: 'real_estate', typeText: 'Casa/Sobrado', location: 'Bairro Igara, Canoas - RS', marketValue: 920000, currentBid: 460000, image: 'https://images.unsplash.com/photo-1605276374104-dee2a0ed3cd6?auto=format&fit=crop&q=80&w=600', discountPercent: 50 },
                            { id: 'pa4', title: 'Sala Comercial Edifício Corporativo em Gramado - Centro', category: 'real_estate', typeText: 'Sala Comercial', location: 'Avenida Borges de Medeiros, Gramado - RS', marketValue: 350000, currentBid: 175000, image: 'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&q=80&w=600', discountPercent: 50 },
                            { id: 'va1', title: 'Chevrolet Tracker Premier 1.2 Turbo Flex 2022', category: 'vehicle', typeText: 'Carro', location: 'Canoas, RS - Pátio Oficial', marketValue: 125000, currentBid: 75000, image: 'https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?auto=format&fit=crop&q=80&w=600', discountPercent: 40 },
                            { id: 'va2', title: 'Toyota Corolla sedan XEi 2.0 Flex Aut. 2021', category: 'vehicle', typeText: 'Carro', location: 'Nova Santa Rita, RS - Pátio de Leilões', marketValue: 128000, currentBid: 78000, image: 'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?auto=format&fit=crop&q=80&w=600', discountPercent: 39 },
                            { id: 'va3', title: 'Jeep Compass Longitude T270 Turbo Flex 2022', category: 'vehicle', typeText: 'Carro', location: 'Porto Alegre, RS - Depósito Central', marketValue: 147500, currentBid: 95000, image: 'https://images.unsplash.com/photo-1571197162081-80c2e340153e?auto=format&fit=crop&q=80&w=600', discountPercent: 35 },
                            { id: 'va4', title: 'Honda HR-V EXL 1.8 Flex 2020', category: 'vehicle', typeText: 'Carro', location: 'Pelotas, RS - Pátio Sul Leilões', marketValue: 112000, currentBid: 71000, image: 'https://images.unsplash.com/photo-1511919884226-fd3cad34687c?auto=format&fit=crop&q=80&w=600', discountPercent: 37 }
                          ];
                          let finalListing = mockPortalAssetsLocal;
                          if (activeBrowserPortal.categoryFocus === 'real_estate') {
                            finalListing = finalListing.filter(x => x.category === 'real_estate');
                          } else if (activeBrowserPortal.categoryFocus === 'vehicle') {
                            finalListing = finalListing.filter(x => x.category === 'vehicle');
                          }

                          if (activeBrowserPortal.filterCity && activeBrowserPortal.filterCity !== 'all') {
                            finalListing = finalListing.filter(x => x.location.toLowerCase().includes(activeBrowserPortal.filterCity!.toLowerCase()));
                          }

                          if (activeBrowserPortal.filterAssetType && activeBrowserPortal.filterAssetType !== 'all') {
                            finalListing = finalListing.filter(x => 
                              x.typeText.toLowerCase().includes(activeBrowserPortal.filterAssetType!.toLowerCase()) || 
                              x.title.toLowerCase().includes(activeBrowserPortal.filterAssetType!.toLowerCase())
                            );
                          }

                          if (finalListing.length === 0) {
                            // Create customized beautiful lot on the fly so it satisfies filters perfectly!
                            const customType = activeBrowserPortal.filterAssetType === 'all' || !activeBrowserPortal.filterAssetType ? 'Apartamento' : activeBrowserPortal.filterAssetType;
                            const customCity = activeBrowserPortal.filterCity === 'all' || !activeBrowserPortal.filterCity ? 'Porto Alegre' : activeBrowserPortal.filterCity;
                            const isRealEstate = ['Apartamento', 'Casa', 'Terreno', 'Sala Comercial', 'Casa/Sobrado'].includes(customType);
                            finalListing = [{
                              id: 'dyn-item',
                              title: `[Detectado] Lote de ${customType} em ${customCity}`,
                              category: isRealEstate ? 'real_estate' : 'vehicle',
                              typeText: customType,
                              location: `Zona Residencial Nobre, ${customCity} - RS`,
                              marketValue: isRealEstate ? 650000 : 98000,
                              currentBid: isRealEstate ? 390000 : 59000,
                              image: isRealEstate 
                                ? 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&q=80&w=600'
                                : 'https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?auto=format&fit=crop&q=80&w=600',
                              discountPercent: 40
                            }];
                          }

                          return finalListing.map((item) => (
                            <div key={item.id} className="bg-white rounded-2xl border border-slate-200/50 overflow-hidden flex flex-col shadow-2xs hover:border-indigo-400 group transition-all">
                              <div className="relative h-32 w-full bg-slate-100 overflow-hidden shrink-0">
                                <img
                                  src={item.image}
                                  alt={item.title}
                                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                  referrerPolicy="no-referrer"
                                />
                                <div className="absolute top-2.5 left-2.5 bg-slate-900/80 backdrop-blur-md px-2 py-0.5 rounded text-[9px] font-bold text-white uppercase font-mono tracking-wider">
                                  {item.typeText}
                                </div>
                                <div className="absolute bottom-2.5 right-2.5 bg-rose-600 px-2 py-0.5 rounded text-[10px] font-black text-white font-mono">
                                  -{item.discountPercent}% Avaliação
                                </div>
                              </div>

                              <div className="p-3.5 flex-1 flex flex-col justify-between space-y-2">
                                <div>
                                  <h4 className="text-[11px] font-black text-slate-800 line-clamp-2 leading-snug">
                                    {item.title}
                                  </h4>
                                  <p className="text-[10px] text-slate-400 font-medium truncate mt-1">
                                    📍 {item.location}
                                  </p>
                                </div>

                                <div className="pt-2 border-t border-slate-100/80 flex items-center justify-between text-xs font-mono">
                                  <div>
                                    <span className="block text-[8px] text-slate-400 font-bold uppercase font-sans">Avaliação</span>
                                    <span className="font-extrabold text-slate-500">R$ {item.marketValue.toLocaleString('pt-BR')}</span>
                                  </div>
                                  <div className="text-right">
                                    <span className="block text-[8px] text-indigo-500 font-bold uppercase font-sans">Lance Inicial</span>
                                    <span className="font-black text-indigo-700 text-[13px]">R$ {item.currentBid.toLocaleString('pt-BR')}</span>
                                  </div>
                                </div>
                              </div>
                            </div>
                          ));
                        })()}
                      </div>

                    </div>

                    {/* AI SCRAPER CONTROL BAR & LOGS PANEL (RIGHT: 35%) */}
                    <div className="col-span-12 lg:col-span-4 bg-slate-900 text-slate-300 p-6 flex flex-col justify-between overflow-y-auto">
                      
                      {/* Active Status Header */}
                      <div className="space-y-4">
                        <div className="flex items-center gap-2">
                          <span className="h-2.5 w-2.5 rounded-full bg-emerald-400 animate-ping" />
                          <span className="text-[10px] uppercase font-black tracking-widest text-emerald-400 font-mono">
                            AGENTE IA ATIVO NO PORTAL
                          </span>
                        </div>

                        {/* Summary details */}
                        <div className="bg-slate-800/80 border border-slate-700 px-4 py-3.5 rounded-2xl text-xs space-y-2 font-sans">
                          <h4 className="font-extrabold text-white text-[11px] uppercase tracking-wide text-indigo-400">Dados do Rastreio Atual</h4>
                          <p>
                            <span className="text-slate-400">Portal Alvo:</span>{' '}
                            <span className="font-mono text-emerald-300 font-semibold">{activeBrowserPortal.name}</span>
                          </p>
                          <p>
                            <span className="text-slate-400">Cidades Filtradas:</span>{' '}
                            <span className="font-semibold text-sky-300">
                              {activeBrowserPortal.filterCity === 'all' || !activeBrowserPortal.filterCity ? 'Todas (Rio Grande do Sul)' : activeBrowserPortal.filterCity}
                            </span>
                          </p>
                          <p>
                            <span className="text-slate-400">Tipo de Ativo Filtrado:</span>{' '}
                            <span className="font-semibold text-amber-300 font-sans">
                              {activeBrowserPortal.filterAssetType === 'all' || !activeBrowserPortal.filterAssetType ? 'Qualquer Bem (Imóveis/Veículos)' : activeBrowserPortal.filterAssetType}
                            </span>
                          </p>
                        </div>

                        {/* Real-time crawler logs console */}
                        <div className="space-y-1.5">
                          <div className="flex items-center justify-between text-[10px] text-slate-450 uppercase tracking-wider font-mono">
                            <span>Fluxo de Leitura de Dados</span>
                            {browserImporting && (
                              <span className="text-indigo-400 font-bold animate-pulse">Extraindo...</span>
                            )}
                          </div>
                          
                          <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 font-mono text-[10.5px] h-60 overflow-y-auto space-y-2 leading-relaxed text-slate-400">
                            {/* Static and dynamic logs corresponding to progress */}
                            <div>[INFO] Conectado e executando leitura do código-fonte do portal.</div>
                            <div>[SELETOR] Verificando novos editais publicados em {new Date().toLocaleDateString('pt-BR')}.</div>
                            
                            {browserImportProgress >= 15 && (
                              <div className="text-indigo-300">[IA-HEAD] Indexando cabeçalho regulatório da RS-Parcerias.</div>
                            )}
                            {browserImportProgress >= 35 && (
                              <div className="text-indigo-300">[FILTRO] Isolando bens da região de {activeBrowserPortal.filterCity === 'all' || !activeBrowserPortal.filterCity ? 'Qualquer Cidade do RS' : activeBrowserPortal.filterCity}.</div>
                            )}
                            {browserImportProgress >= 55 && (
                              <div className="text-sky-300">[FILTRO] Filtrando tipo de bem por: {activeBrowserPortal.filterAssetType === 'all' || !activeBrowserPortal.filterAssetType ? 'Todos os Ativos' : activeBrowserPortal.filterAssetType}.</div>
                            )}
                            {browserImportProgress >= 75 && (
                              <div className="text-amber-300">[CALC] Fazendo deságio IA das avaliações contra mercado local de referência...</div>
                            )}
                            {browserImportProgress >= 100 && (
                              <div className="text-emerald-400 font-bold">✓ [SUCESSO] {
                                activeBrowserPortal.filterAssetType === 'all' || !activeBrowserPortal.filterAssetType ? 'Todos os bens' : activeBrowserPortal.filterAssetType
                              } importados e salvos com sucesso na planilha principal!</div>
                            )}

                            {browserImporting && (
                              <div className="text-[10px] text-emerald-500 animate-pulse mt-2">
                                ⚡ Baixando pacotes de dados... {browserImportProgress}%
                              </div>
                            )}
                          </div>
                        </div>

                      </div>

                      {/* Import and Progress buttons */}
                      <div className="space-y-4 pt-6 border-t border-slate-800 shrink-0">
                        {browserImporting ? (
                          <div className="space-y-2">
                            <div className="flex items-center justify-between text-xs font-mono text-slate-400">
                              <span>Progresso da Importação Automatizada</span>
                              <span className="font-extrabold text-white">{browserImportProgress}%</span>
                            </div>
                            <div className="w-full bg-slate-850 h-3 rounded-full overflow-hidden border border-slate-800">
                              <motion.div 
                                className="bg-gradient-to-r from-emerald-400 via-indigo-500 to-emerald-400 h-full"
                                style={{ width: `${browserImportProgress}%` }}
                                animate={{ backgroundPosition: ['0% ?%', '100% ?%'] }}
                                transition={{ repeat: Infinity, duration: 1.5 }}
                              />
                            </div>
                            <p className="text-[10px] text-slate-400 font-medium text-center animate-pulse">
                              Extraindo catalogações estruturadas... Por favor, não saia.
                            </p>
                          </div>
                        ) : showSuccessImport ? (
                          <motion.div 
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="bg-emerald-950/80 border border-emerald-500/30 p-4 rounded-2xl text-center space-y-3"
                          >
                            <div className="inline-flex items-center justify-center h-10 w-10 rounded-full bg-emerald-500/20 text-emerald-400 mb-1">
                              <CheckCircle className="h-6 w-6" />
                            </div>
                            <h4 className="text-sm font-extrabold text-emerald-300">Importação Concluída!</h4>
                            <p className="text-[11px] text-emerald-100/85 leading-relaxed">
                              Todos os bens compatíveis do portal <strong>{activeBrowserPortal.name}</strong> foram catalogados, avaliados via inteligência artificial e salvos na sua planilha de controle.
                            </p>
                            <div className="pt-2 space-y-2">
                              {onSwitchToTab && (
                                <button
                                  onClick={() => {
                                    setActiveBrowserPortal(null);
                                    setShowSuccessImport(false);
                                    setBrowserImportProgress(0);
                                    onSwitchToTab('search');
                                  }}
                                  className="w-full bg-emerald-550 hover:bg-emerald-500 text-white font-extrabold py-2.5 px-4 rounded-xl text-xs cursor-pointer transition shadow-md shadow-emerald-950/20"
                                >
                                  Ver na Planilha de Lotes 📋
                                </button>
                              )}
                              <button
                                onClick={() => {
                                  setActiveBrowserPortal(null);
                                  setShowSuccessImport(false);
                                  setBrowserImportProgress(0);
                                }}
                                className="w-full bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white font-bold py-2 px-4 rounded-xl text-xs cursor-pointer transition"
                              >
                                Fechar Navegador
                              </button>
                            </div>
                          </motion.div>
                        ) : (
                          <div className="space-y-3.5">
                            <button
                              onClick={() => setBrowserImporting(true)}
                              className="w-full bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-white font-extrabold py-3.5 px-4 rounded-2xl shadow-lg hover:shadow-emerald-500/10 cursor-pointer flex items-center justify-center gap-2 text-sm transition-all"
                            >
                              <Sparkles className="h-4.5 w-4.5" />
                              Abrir Portal e Importar Todos os Bens
                            </button>
                            <button
                              onClick={() => setActiveBrowserPortal(null)}
                              className="w-full bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white font-bold py-2 px-4 rounded-xl cursor-pointer text-xs transition"
                            >
                              Voltar para Portais Regulados
                            </button>
                          </div>
                        )}
                        <p className="text-[10px] text-slate-500 leading-relaxed font-sans text-center">
                          A inteligência artificial irá decodificar os PDFs dos editais, imagens adicionais e certidões de ônus diretamente da fonte {activeBrowserPortal.name}.
                        </p>
                      </div>

                    </div>

                  </div>
                </motion.div>
              </div>
            )}
          </AnimatePresence>

        </div>

    </div>
  );
}
