import { FeasibilityCalculation } from '../types';
import { 
  Trash2, TrendingUp, Calendar, ArrowRight, FolderClosed, 
  CheckCircle, AlertTriangle, ShieldAlert, Info, ExternalLink 
} from 'lucide-react';
import { motion } from 'motion/react';

interface SavedSimulationsProps {
  simulations: FeasibilityCalculation[];
  onDelete: (id: string) => void;
  onSelectToRecalculate: (sim: FeasibilityCalculation) => void;
}

export default function SavedSimulations({ simulations, onDelete, onSelectToRecalculate }: SavedSimulationsProps) {
  
  const formatBRL = (val: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(val);
  };

  const formatDate = (isoString: string) => {
    return new Date(isoString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const verdictConfig = {
    excelente: { bg: 'bg-emerald-50 text-emerald-800 border-emerald-200/60', text: 'Excelente', icon: CheckCircle, color: 'text-emerald-600' },
    bom: { bg: 'bg-teal-50 text-teal-800 border-teal-200/60', text: 'Boa', icon: CheckCircle, color: 'text-teal-600' },
    regular: { bg: 'bg-amber-50 text-amber-800 border-amber-200/60', text: 'Regular', icon: Info, color: 'text-amber-600' },
    risco_alto: { bg: 'bg-orange-50 text-orange-850 border-orange-200/60', text: 'Risco Alto', icon: AlertTriangle, color: 'text-orange-600' },
    inviavel: { bg: 'bg-rose-50 text-rose-800 border-rose-200/60', text: 'Inviável', icon: ShieldAlert, color: 'text-rose-650 text-rose-600' },
  };
  if (simulations.length === 0) {
    return (
      <div id="saved-empty-state" className="bg-white rounded-3xl border border-zinc-150 p-12 text-center flex flex-col items-center justify-center min-h-[400px]">
        <FolderClosed className="h-12 w-12 text-zinc-300 mb-3" />
        <h4 className="text-base font-bold text-zinc-700 font-sans">Nenhuma simulação salva ainda</h4>
        <p className="text-xs text-zinc-550 max-w-sm mt-1">Navegue pelas ofertas, use nosso <strong>Simulador Financeiro</strong> e guarde os negócios mais promissores aqui para fazer seu portfólio.</p>
      </div>
    );
  }

  return (
    <div id="saved-simulations-view" className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold font-sans text-zinc-800">Meus Negócios Salvos</h2>
          <p className="text-xs text-zinc-550">Total de {simulations.length} {simulations.length === 1 ? 'negócio monitorado' : 'negócios monitorados'}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {simulations.map((sim) => {
          const isRealEstate = sim.category === 'real_estate';
          const ActiveIcon = verdictConfig[sim.verdict].icon;

          return (
            <motion.div
              key={sim.id}
              id={`saved-item-${sim.id}`}
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              whileHover={{ y: -5, scale: 1.025, boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.05), 0 10px 10px -5px rgba(0, 0, 0, 0.02)" }}
              className="bg-white rounded-2xl border border-zinc-150 p-5 shadow-xs transition-all flex flex-col justify-between"
            >
              <div>
                {/* Meta header */}
                <div className="flex items-center justify-between mb-3 font-sans">
                  <span className={`px-2.5 py-0.5 rounded-lg text-[9px] font-bold uppercase font-mono tracking-wider ${
                    isRealEstate ? 'bg-indigo-50 text-indigo-700' : 'bg-amber-50 text-amber-700'
                  }`}>
                    {isRealEstate ? '🏠 Imóvel' : '🚗 Veículo'}
                  </span>
                  
                  <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[9px] font-bold border ${verdictConfig[sim.verdict].bg}`}>
                    <ActiveIcon className="h-3 w-3 shrink-0" />
                    Viabilidade {verdictConfig[sim.verdict].text}
                  </span>
                </div>

                <h3 className="font-sans font-bold text-zinc-800 text-sm leading-tight line-clamp-2 h-10 mb-4" title={sim.title}>
                  {sim.title}
                </h3>

                {/* Key financial rates rows */}
                <div className="space-y-2 border-b border-dashed border-zinc-150 pb-4 mb-4">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-zinc-500">Investimento Total:</span>
                    <span className="font-bold text-zinc-700 font-mono">{formatBRL(sim.totalInvestment)}</span>
                  </div>
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-zinc-500">Retorno p/ revenda:</span>
                    <span className="font-bold text-zinc-700 font-mono">{formatBRL(sim.expectedResaleValue)}</span>
                  </div>
                  <div className="flex justify-between items-center text-xs bg-zinc-50 p-2 rounded-lg">
                    <span className="font-bold text-zinc-600">Lucro Líquido Esperado:</span>
                    <span className={`font-black font-mono ${sim.netProfit >= 0 ? 'text-emerald-700' : 'text-rose-600'}`}>
                      {formatBRL(sim.netProfit)}
                    </span>
                  </div>
                </div>

                {/* ROI Gauge */}
                <div className="flex items-center justify-between mt-2 mb-4">
                  <div className="flex items-center gap-1.5 text-xs text-zinc-550">
                    <Calendar className="h-3.5 w-3.5 text-zinc-400" />
                    <span>Salvo em {formatDate(sim.date)}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] text-zinc-400 block font-mono uppercase font-bold">ROI Esperado</span>
                    <span className={`text-base font-black font-sans leading-none ${sim.roiPercent >= 20 ? 'text-emerald-600' : sim.roiPercent >= 0 ? 'text-amber-500' : 'text-rose-600'}`}>
                      {sim.roiPercent.toFixed(1)}%
                    </span>
                  </div>
                </div>
              </div>

              {/* Edit / Trash Actions footer */}
              <div className="flex gap-2.5 pt-3 border-t border-zinc-150 mt-auto">
                <button
                  onClick={() => onDelete(sim.id)}
                  className="p-1.5 text-zinc-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all cursor-pointer"
                  title="Apagar simulação"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
                <button
                  onClick={() => onSelectToRecalculate(sim)}
                  className="flex-1 flex items-center justify-center gap-1.5 py-1.5 px-3 bg-zinc-50 border border-zinc-200 text-zinc-600 hover:border-emerald-500 hover:bg-emerald-50 hover:text-emerald-700 rounded-xl text-xs font-bold transition-all cursor-pointer"
                >
                  Modificar Dados
                  <ArrowRight className="h-3 w-3" />
                </button>
              </div>

            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
