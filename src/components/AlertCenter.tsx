import { 
  Bell, BellOff, Trash2, Play, Check, Sparkles, X, 
  HelpCircle, Info, ChevronRight, Sliders, TrendingUp, AlertCircle 
} from 'lucide-react';
import { AuctionItem, LotAlert } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { useState } from 'react';

interface AlertCenterProps {
  isOpen: boolean;
  onClose: () => void;
  alerts: LotAlert[];
  onToggleAlert: (id: string) => void;
  onDeleteAlert: (id: string) => void;
  onUpdateThreshold: (id: string, newThreshold: number) => void;
  onSimulateDiscountDrop: (auctionId: string) => void;
  auctions: AuctionItem[];
}

export default function AlertCenter({
  isOpen,
  onClose,
  alerts,
  onToggleAlert,
  onDeleteAlert,
  onUpdateThreshold,
  onSimulateDiscountDrop,
  auctions,
}: AlertCenterProps) {
  const [editingAlertId, setEditingAlertId] = useState<string | null>(null);
  const [tempThreshold, setTempThreshold] = useState<number>(0);

  const formatBRL = (val: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(val);
  };

  const startEditing = (alert: LotAlert) => {
    setEditingAlertId(alert.id);
    setTempThreshold(alert.targetDiscount);
  };

  const saveEditing = (alertId: string) => {
    onUpdateThreshold(alertId, tempThreshold);
    setEditingAlertId(null);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop Overlay */}
          <motion.div
            id="alert-center-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.4 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-zinc-900 z-50 transition-opacity"
          />

          {/* Drawer Panel */}
          <motion.div
            id="alert-center-panel"
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed inset-y-0 right-0 w-full max-w-md bg-[#1C1C1E] shadow-2xl z-50 flex flex-col h-full border-l border-[#2C2C2E]"
          >
            {/* Header */}
            <div className="p-5 border-b border-[#2C2C2E] flex items-center justify-between bg-[#1C1C1E]/60">
              <div className="flex items-center gap-2.5">
                <div className="bg-[#10B981]/10 text-[#10B981] p-2 rounded-xl">
                  <Bell className="h-4.5 w-4.5 animate-swing" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-[#F8FAFC] font-sans">Monitor de Alertas</h2>
                  <p className="text-[10px] uppercase font-mono font-bold text-slate-450">Ativação de Lotes</p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-2 text-slate-400 hover:text-white hover:bg-[#2C2C2E] rounded-xl transition-all cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Instruction Banner */}
            <div className="p-4 bg-indigo-950/20 border-b border-indigo-900/30 flex gap-2.5 items-start">
              <Sparkles className="h-4 w-4 text-indigo-400 shrink-0 mt-0.5" />
              <div className="text-xs">
                <p className="font-bold text-indigo-300">Como testar seus alertas?</p>
                <p className="text-indigo-300/80 mt-0.5 leading-relaxed">
                  Adicione um alerta em qualquer lote nos cards. Ative-o e clique no botão de simulation <Play className="inline h-3 w-3 mx-0.5" /> para simular que o valor do leilão despencou no mercado. A sua notificação irá disparar na hora!
                </p>
              </div>
            </div>

            {/* Content Body */}
            <div className="flex-1 overflow-y-auto p-5 space-y-5">
              {alerts.length === 0 ? (
                <div className="text-center py-12 px-4 flex flex-col items-center justify-center min-h-[300px]">
                  <div className="h-12 w-12 bg-[#1C1C1E]/60 rounded-2xl flex items-center justify-center border border-[#2C2C2E] mb-3">
                    <BellOff className="h-5 w-5 text-zinc-500" />
                  </div>
                  <h3 className="text-sm font-bold text-[#F8FAFC]">Nenhum lote monitorado</h3>
                  <p className="text-xs text-slate-450 mt-1 max-w-xs px-2 leading-relaxed">
                    Clique no botão de sino (🔔) em qualquer lote da busca para configurar alertas de desconto automático personalizados.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center justify-between text-xs font-bold text-slate-450 uppercase font-mono border-b border-[#2C2C2E] pb-2">
                     <span>Lote Monitorado</span>
                     <span>Meta Desconto</span>
                  </div>

                  {alerts.map((alert) => {
                    const originalAuction = auctions.find(a => a.id === alert.auctionId);
                    const currentDiscount = originalAuction?.discountPercent ?? alert.currentDiscount;
                    const isTriggered = currentDiscount >= alert.targetDiscount;

                    return (
                      <div
                        key={alert.id}
                        id={`alert-monitor-card-${alert.id}`}
                        className={`p-4 rounded-xl border transition-all flex flex-col justify-between ${
                          isTriggered 
                            ? 'bg-[#10B981]/10 border-emerald-500/30 shadow-xs' 
                            : 'bg-[#1C1C1E]/40 border-[#2C2C2E]'
                        }`}
                      >
                        <div className="flex justify-between items-start gap-2 file:mb-3">
                          <div className="flex-1 min-w-0">
                            {/* Meta */}
                            <div className="flex items-center gap-1.5 mb-1.5">
                              <span className={`px-1.5 py-0.5 rounded text-[8px] font-bold uppercase font-mono tracking-wider ${
                                alert.category === 'real_estate' ? 'bg-indigo-950/40 text-indigo-405 border border-indigo-900/30' : 'bg-amber-950/40 text-amber-405 border border-amber-900/30'
                              }`}>
                                {alert.category === 'real_estate' ? 'Móvel' : 'Veículo'}
                              </span>
                              
                              <span className={`h-1.5 w-1.5 rounded-full ${alert.isActive ? 'bg-[#10B981] animate-pulse' : 'bg-[#2C2C2E]'}`} />
                              <span className="text-[10px] font-semibold text-slate-450">
                                {alert.isActive ? 'Monitorando' : 'Inativo'}
                              </span>
                            </div>

                            {/* Title */}
                            <h4 className="text-xs font-bold font-sans text-[#F8FAFC] line-clamp-1 mb-2" title={alert.title}>
                              {alert.title}
                            </h4>

                            {/* Prices or details block */}
                            {originalAuction && (
                              <div className="text-[10.5px] text-slate-450 font-mono space-y-0.5 mb-2.5">
                                <div className="flex justify-between">
                                  <span>FIPE / Mercado:</span>
                                  <span className="font-semibold text-slate-300">{formatBRL(originalAuction.marketValue)}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span>Lance Mínimo:</span>
                                  <span className="font-semibold text-slate-300">{formatBRL(originalAuction.currentBid)}</span>
                                </div>
                              </div>
                            )}

                            {/* Status and Current Discount Indicator */}
                            <div className="flex items-center gap-2 mt-2">
                              <span className="text-[10px] font-bold text-slate-450">DESCONTO ATUAL:</span>
                              <span className={`text-xs font-black font-mono px-2 py-0.5 rounded-lg ${
                                isTriggered ? 'bg-[#10B981] text-black' : 'bg-[#2C2C2E] text-slate-300'
                              }`}>
                                {currentDiscount}% OFF
                              </span>
                            </div>
                          </div>

                          {/* Right Side Control or Actions */}
                          <div className="text-right shrink-0 flex flex-col items-end justify-between self-stretch">
                            {/* Target value column */}
                            <div className="mb-2">
                              {editingAlertId === alert.id ? (
                                <div className="flex items-center gap-1">
                                  <input
                                    type="number"
                                    min="1"
                                    max="99"
                                    value={tempThreshold}
                                    onChange={(e) => setTempThreshold(Number(e.target.value))}
                                    className="w-12 bg-[#2C2C2E] border border-[#2C2C2E] rounded text-center text-xs p-0.5 font-bold font-mono text-[#F8FAFC]"
                                  />
                                  <button
                                    onClick={() => saveEditing(alert.id)}
                                    className="p-1 bg-[#10B981] text-black rounded hover:bg-[#10B981]/90 transition"
                                  >
                                    <Check className="h-3 w-3" />
                                  </button>
                                </div>
                              ) : (
                                <div className="flex flex-col items-end">
                                  <span className="text-[9px] font-bold text-slate-450 uppercase font-mono">Alvo</span>
                                  <button
                                    onClick={() => startEditing(alert)}
                                    className="text-sm font-black font-mono text-indigo-400 hover:underline cursor-pointer"
                                  >
                                    ≥ {alert.targetDiscount}%
                                  </button>
                                </div>
                              )}
                            </div>

                            {/* Enabled Toggle Switch Button */}
                            <button
                              onClick={() => onToggleAlert(alert.id)}
                              className={`w-8 h-4.5 rounded-full transition-colors relative cursor-pointer ${
                                alert.isActive ? 'bg-[#10B981]' : 'bg-[#2C2C2E]'
                              }`}
                            >
                              <div className={`w-3.5 h-3.5 rounded-full bg-zinc-100 absolute top-0.5 shadow-sm transition-transform ${
                                alert.isActive ? 'right-0.5' : 'left-0.5'
                              }`} />
                            </button>
                          </div>
                        </div>

                        {/* Interactive testing and deletion actions footer */}
                        <div className="flex items-center justify-between pt-3 border-t border-[#2C2C2E] mt-3 bg-[#1C1C1E]/60 -mx-4 -mb-4 px-4 py-2.5 rounded-b-xl gap-2">
                          <button
                            onClick={() => onDeleteAlert(alert.id)}
                            className="p-1.5 text-slate-400 hover:text-rose-450 hover:bg-rose-500/10 rounded-lg transition-all cursor-pointer"
                            title="Apagar Alerta"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>

                          {/* Simulation drop action */}
                          <div className="flex items-center gap-1.5">
                            {isTriggered ? (
                              <span className="inline-flex items-center gap-1 text-[10px] font-bold text-[#10B981] bg-[#10B981]/10 border border-[#10B981]/25 px-2 py-0.5 rounded-md">
                                <Check className="h-3 w-3" /> Metas Atingidas
                              </span>
                            ) : (
                              <button
                                onClick={() => onSimulateDiscountDrop(alert.auctionId)}
                                className="inline-flex items-center gap-1 text-[9.5px] font-bold text-indigo-400 hover:text-indigo-350 bg-indigo-950/40 hover:bg-indigo-900/40 border border-indigo-800/40 py-1 px-2.5 rounded-lg transition-colors cursor-pointer"
                                title="Simular flutuação de preço que aumenta o desconto"
                              >
                                <Play className="h-3 w-3 text-indigo-400 fill-current" />
                                Simular Desconto +
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Footer Status Summary */}
            <div className="p-5 border-t border-[#2C2C2E] bg-[#1C1C1E]/60 text-[11px] text-slate-450 leading-relaxed text-center">
              Os alertas utilizam persistência integrada no seu navegador para manter a carteira sincronizada. Lembre-se de reativar se os descontos forem atualizados.
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
