import React, { useState, useEffect } from 'react';
import { AuctionItem, FeasibilityCalculation } from '../types';
import { formatPercentBR } from '../utils/formatters';
import { SAMPLE_AUCTIONS } from '../data';
import { 
  DollarSign, Percent, TrendingUp, AlertTriangle, 
  CheckCircle, ShieldAlert, Heart, RefreshCw, Star, Info, PieChart as ChartIcon,
  ShieldCheck
} from 'lucide-react';
import { motion } from 'motion/react';
import { ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

interface CalculatorProps {
  preSelectedItem: AuctionItem | null;
  onSaveSimulation: (sim: FeasibilityCalculation) => void;
  savedSimulations: FeasibilityCalculation[];
}

export default function Calculator({ preSelectedItem, onSaveSimulation, savedSimulations }: CalculatorProps) {
  // Active doughnut chart slice index
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  // Option lists
  const [selectedItemId, setSelectedItemId] = useState<string>(preSelectedItem?.id || 'custom-estate');
  const [category, setCategory] = useState<'real_estate' | 'vehicle'>('real_estate');
  const [title, setTitle] = useState<string>('Simulação Personalizada de Imóvel');

  // Input States
  const [marketValue, setMarketValue] = useState<number>(850000);
  const [bidValue, setBidValue] = useState<number>(442000);
  const [auctioneerFee, setAuctioneerFee] = useState<number>(5); // %
  const [itbiOrTransferPct, setItbiOrTransferPct] = useState<number>(2); // % (ITBI p/ imóvel, p/ veículo transferência geralmente R$ 400 fixos convertidos em %)
  const [registryOrRegistrationFix, setRegistryOrRegistrationFix] = useState<number>(5500); // Cartório ou taxas licenciamento
  const [repairCosts, setRepairCosts] = useState<number>(30000); // Reforma ou mecânica
  const [outstandingDebts, setOutstandingDebts] = useState<number>(14500); // Condomínio, IPTU ou IPVA atrasados
  const [judicialOrLegalCosts, setJudicialOrLegalCosts] = useState<number>(5000); // Advogado / assessoria
  const [holdingExpenses, setHoldingExpenses] = useState<number>(6000); // Condomínio/carregar veículo enquanto não vende
  const [expectedResaleDiscount, setExpectedResaleDiscount] = useState<number>(6); // Comissão imobiliária ou desconto de resale de leilão
  const [irTaxRate, setIrTaxRate] = useState<number>(15); // % Imposto de Renda s/ lucro

  const [aiOpinion, setAiOpinion] = useState<string>('');
  const [loadingAi, setLoadingAi] = useState<boolean>(false);
  const [saveSuccess, setSaveSuccess] = useState<boolean>(false);

  // Sync inputs if dropdown or pre-selected item changes
  useEffect(() => {
    if (preSelectedItem) {
      applyItem(preSelectedItem);
      setSelectedItemId(preSelectedItem.id);
    } else {
      applyItemSelection(selectedItemId);
    }
  }, [preSelectedItem, selectedItemId]);

  const applyItem = (item: AuctionItem) => {
    setCategory(item.category);
    setTitle(item.title);
    setMarketValue(item.marketValue);
    setBidValue(item.currentBid);
    setAuctioneerFee(5);
    
    if (item.category === 'real_estate') {
      setItbiOrTransferPct(2.5); // Médias padrão no BR
      setRegistryOrRegistrationFix(6500); 
      setOutstandingDebts(item.occupancyStatus === 'ocupado' ? 12000 : 3500);
      setRepairCosts(item.typeText === 'Terreno' ? 2000 : 25000);
      setJudicialOrLegalCosts(item.occupancyStatus === 'ocupado' ? 8000 : 1500);
      setHoldingExpenses(8000);
      setExpectedResaleDiscount(6); // Comissão padrão corretor re-venda
    } else {
      setItbiOrTransferPct(1); // Taxagem de transferência
      setRegistryOrRegistrationFix(450); // Licenciamento fixo Detran
      setOutstandingDebts(item.debtsPaidByBuyer ? 3500 : 0);
      setRepairCosts(item.vehicleCondition === 'recuperado' ? 2500 : item.vehicleCondition === 'sinistro' ? 12000 : 1200);
      setJudicialOrLegalCosts(800); // despachante
      setHoldingExpenses(1200); // pátio / seguro
      setExpectedResaleDiscount(18); // Desvalorização natural de carro proveniente de leilão (normalmente 15% a 25% abaixo da FIPE ao revender)
    }
    setAiOpinion('');
  };

  const applyItemSelection = (id: string) => {
    if (id === 'custom-estate') {
      setCategory('real_estate');
      setTitle('Simulação Personalizada de Imóvel');
      setMarketValue(600000);
      setBidValue(300000);
      setAuctioneerFee(5);
      setItbiOrTransferPct(2);
      setRegistryOrRegistrationFix(4500);
      setRepairCosts(20000);
      setOutstandingDebts(5000);
      setJudicialOrLegalCosts(4000);
      setHoldingExpenses(5000);
      setExpectedResaleDiscount(5);
      setAiOpinion('');
    } else if (id === 'custom-vehicle') {
      setCategory('vehicle');
      setTitle('Simulação Personalizada de Veículo');
      setMarketValue(75000);
      setBidValue(45000);
      setAuctioneerFee(5);
      setItbiOrTransferPct(1);
      setRegistryOrRegistrationFix(300);
      setRepairCosts(3500);
      setOutstandingDebts(1500);
      setJudicialOrLegalCosts(500);
      setHoldingExpenses(900);
      setExpectedResaleDiscount(15);
      setAiOpinion('');
    } else {
      const found = SAMPLE_AUCTIONS.find(a => a.id === id);
      if (found) applyItem(found);
    }
  };

  // FINANCIAL FORMULAS
  const leiloeiroValue = bidValue * (auctioneerFee / 100);
  const itbiValue = bidValue * (itbiOrTransferPct / 100);
  
  const totalCostsBeforeIR = 
    bidValue + 
    leiloeiroValue + 
    itbiValue + 
    Number(registryOrRegistrationFix) + 
    Number(repairCosts) + 
    Number(outstandingDebts) + 
    Number(judicialOrLegalCosts) + 
    Number(holdingExpenses);

  // Expected Selling Revenue (Market value - transaction discount/broker fees)
  const expectedResaleValue = marketValue * (1 - expectedResaleDiscount / 100);
  const profitBeforeIR = Math.max(0, expectedResaleValue - totalCostsBeforeIR);
  const irTaxValue = category === 'real_estate' ? profitBeforeIR * (irTaxRate / 100) : 0;

  const totalInvestment = totalCostsBeforeIR + irTaxValue;
  const netProfit = profitBeforeIR - irTaxValue;
  const roiPercent = totalInvestment > 0 ? (netProfit / totalInvestment) * 100 : 0;

  // Diagnostic Verdict
  let verdict: 'excelente' | 'bom' | 'regular' | 'risco_alto' | 'inviavel' = 'regular';
  if (roiPercent >= 35) verdict = 'excelente';
  else if (roiPercent >= 20) verdict = 'bom';
  else if (roiPercent >= 8) verdict = 'regular';
  else if (roiPercent >= 0) verdict = 'risco_alto';
  else verdict = 'inviavel';

  const verdictConfig = {
    excelente: { bg: 'bg-emerald-50 text-emerald-800 border-emerald-200', text: 'Excelente Oportunidade', icon: CheckCircle, color: 'text-emerald-600' },
    bom: { bg: 'bg-teal-50 text-teal-800 border-teal-200', text: 'Boa Viabilidade', icon: CheckCircle, color: 'text-teal-600' },
    regular: { bg: 'bg-amber-50 text-amber-800 border-amber-200', text: 'Retorno Regular / Margem Estreita', icon: Info, color: 'text-amber-600' },
    risco_alto: { bg: 'bg-orange-50 text-orange-850 border-orange-200', text: 'Risco Elevado / Pouco Lucro', icon: AlertTriangle, color: 'text-orange-600' },
    inviavel: { bg: 'bg-rose-50 text-rose-800 border-rose-200', text: 'Inviável / Prejuízo Projetado', icon: ShieldAlert, color: 'text-rose-600' },
  };

  // Helper formatting BRL
  const formatBRL = (val: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(val);
  };

  // Trigger Gemini Verdict via backend
  const requestAiOpinion = async () => {
    setLoadingAi(true);
    setAiOpinion('');
    try {
      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          inputText: `
            Simulador Financeiro preenchido com os seguintes detalhes:
            - Tipo: ${category === 'real_estate' ? 'Imóvel' : 'Veículo'}
            - Título do bem: ${title}
            - Valor de Mercado FIPE: R$ ${marketValue}
            - Valor de Lance Estipulado: R$ ${bidValue}
            - Comissão Leiloeiro: R$ ${leiloeiroValue}
            - Impostos/ITBI: R$ ${itbiValue}
            - Taxas de Cartório/Transferência: R$ ${registryOrRegistrationFix}
            - Custos estimados de Reforma/Reparo: R$ ${repairCosts}
            - Dívidas anteriores a assumir (IPVA/condomínio): R$ ${outstandingDebts}
            - Custos Judiciais/Advogado/Assessoria: R$ ${judicialOrLegalCosts}
            - Despesas carregando o bem (Mensalidade/Holding): R$ ${holdingExpenses}
            - Margem de desconto na revenda esperada: ${expectedResaleDiscount}% (Valor final estimado de revenda: R$ ${expectedResaleValue})
            - Total de investimento projetado: R$ ${totalInvestment}
            - Lucro Líquido Calculado: R$ ${netProfit}
            - Retorno sobre Investimento (ROI): ${formatPercentBR(roiPercent)}%
          `,
          category: category,
          marketValue: marketValue,
          currentBid: bidValue
        })
      });

      const data = await response.json();
      if (data.error) {
        setAiOpinion(`Não foi possível gerar o parecer da IA: ${data.error}`);
      } else {
        setAiOpinion(data.executiveSummary || `A IA estimou que o risco deste lote está classificado com segurança geral de ${data.score}/100.
Max lance sugerido: ${formatBRL(data.financialCalculations.maxViableBid || 0)}. Recomendação: Verifique os editais.`);
      }
    } catch (err: any) {
      setAiOpinion('Houve uma falha na comunicação com o servidor de IA. Verifique se o servidor está ativo.');
    } finally {
      setLoadingAi(false);
    }
  };

  const handleSave = () => {
    const simulation: FeasibilityCalculation = {
      id: `calc-${Date.now()}`,
      title: title || 'Simulação sem nome',
      category: category,
      date: new Date().toISOString(),
      marketValue,
      bidValue,
      auctioneerFee,
      itbiOrTransferPct,
      registryOrRegistrationFix,
      repairCosts,
      outstandingDebts,
      judicialOrLegalCosts,
      holdingExpenses,
      expectedResaleDiscount,
      totalInvestment,
      expectedResaleValue,
      netProfit,
      roiPercent,
      verdict,
      aiRecommendation: aiOpinion || undefined
    };

    onSaveSimulation(simulation);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  const ActiveVerdictIcon = verdictConfig[verdict].icon;

  return (
    <div id="calculator-view" className="grid grid-cols-1 lg:grid-cols-12 gap-8">
      
      {/* LEFT: SLIDERS & FORM VALUES */}
      <div className="lg:col-span-7 bg-white p-6 sm:p-8 rounded-3xl border border-zinc-150 shadow-sm flex flex-col justify-between">
        <div>
          <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
            <div>
              <h2 className="text-xl font-bold font-sans text-zinc-800">Simulador de Viabilidade e ROI</h2>
              <p className="text-xs text-zinc-500">Arraste os sliders para projetar a rentabilidade líquida real da arrematação</p>
            </div>
            
            {/* Quick selectors dropdown */}
            <select
              id="calc-selector"
              value={selectedItemId}
              onChange={(e) => setSelectedItemId(e.target.value)}
              className="bg-zinc-50 border border-zinc-200 rounded-xl px-3.5 py-2 text-xs font-semibold text-zinc-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer"
            >
              <option value="custom-estate">🏠 Imóvel Personalizado</option>
              <option value="custom-vehicle">🚗 Veículo Personalizado</option>
              <optgroup label="Lotes Conhecidos">
                {SAMPLE_AUCTIONS.map(item => (
                  <option key={item.id} value={item.id}>
                    {item.category === 'real_estate' ? '🏠' : '🚗'} {item.title.substring(0, 32)}...
                  </option>
                ))}
              </optgroup>
            </select>
          </div>

          <div className="border border-zinc-150 rounded-2xl p-4 bg-zinc-50/50 mb-6 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className={`h-2.5 w-2.5 rounded-full ${category === 'real_estate' ? 'bg-indigo-600' : 'bg-amber-600'}`} />
              <span className="text-xs font-bold text-zinc-500 font-mono uppercase tracking-wider">{category === 'real_estate' ? 'Imóvel' : 'Veículo'}</span>
            </div>
            <input
              type="text"
              id="calc-title-input"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="text-xs font-semibold bg-white border border-zinc-200 outline-none rounded p-1 text-zinc-700 w-2/3 focus:border-emerald-500"
              placeholder="Nome desta simulação..."
            />
          </div>

          <div className="space-y-5">
            {/* 1. Market Value */}
            <div>
              <div className="flex justify-between text-xs font-bold text-zinc-700 mb-1.5">
                <span className="flex items-center gap-1"><Star className="h-3.5 w-3.5 text-amber-500" /> Valor de Avaliação / Tabela FIPE</span>
                <span className="text-zinc-900">{formatBRL(marketValue)}</span>
              </div>
              <input
                type="range"
                min={category === 'real_estate' ? 100000 : 10000}
                max={category === 'real_estate' ? 3000000 : 500000}
                step={category === 'real_estate' ? 10000 : 1000}
                value={marketValue}
                onChange={(e) => setMarketValue(Number(e.target.value))}
                className="w-full accent-emerald-600"
              />
            </div>

            {/* 2. Estimated Bidding Target */}
            <div>
              <div className="flex justify-between text-xs font-bold text-zinc-700 mb-1.5">
                <span className="flex items-center gap-1 text-emerald-600"><TrendingUp className="h-3.5 w-3.5" /> Valor Pretendido do Lance</span>
                <span className="text-emerald-700 font-extrabold">{formatBRL(bidValue)}</span>
              </div>
              <input
                type="range"
                min={category === 'real_estate' ? 50000 : 5000}
                max={marketValue * 1.1} // Permite testar lance até acima da FIPE
                step={category === 'real_estate' ? 5000 : 500}
                value={bidValue}
                onChange={(e) => setBidValue(Number(e.target.value))}
                className="w-full accent-emerald-600"
              />
              <span className="text-[10px] text-zinc-400 block mt-1">Este lance equivale a {formatPercentBR(marketValue > 0 ? (bidValue / marketValue * 100) : 0)}% do valor avaliado.</span>
            </div>

            {/* EXPENSES EXPANSION GRID */}
            <h3 className="text-xs font-bold font-mono text-zinc-500 uppercase tracking-wider pt-2 border-t border-zinc-150 font-sans">Despesas Adicionais e Taxas Legais</h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              
              {/* Leiloeiro % (fixo 5% mas editável) */}
              <div className="bg-zinc-50/50 p-2.5 rounded-xl border border-zinc-150">
                <label className="text-[11px] font-bold text-zinc-600 block mb-1">Comissão Leiloeiro (%)</label>
                <div className="flex items-center gap-2">
                  <Percent className="h-3.5 w-3.5 text-zinc-400" />
                  <input
                    type="number"
                    value={auctioneerFee}
                    onChange={(e) => setAuctioneerFee(Number(e.target.value))}
                    className="w-full bg-white text-xs text-zinc-800 border border-zinc-200 rounded p-1 font-mono font-medium outline-none focus:border-emerald-500"
                    placeholder="5%"
                  />
                </div>
                <span className="text-[10px] text-zinc-400 block mt-1 font-mono">Total: {formatBRL(leiloeiroValue)}</span>
              </div>

              {/* Imposto de Transmissão / ITBI ou Registro */}
              <div className="bg-zinc-50/50 p-2.5 rounded-xl border border-zinc-150">
                <label className="text-[11px] font-bold text-zinc-600 block mb-1">{category === 'real_estate' ? 'ITBI da Cidade (%)' : 'Imposto Transferência (%)'}</label>
                <div className="flex items-center gap-2">
                  <Percent className="h-3.5 w-3.5 text-zinc-400" />
                  <input
                    type="number"
                    value={itbiOrTransferPct}
                    onChange={(e) => setItbiOrTransferPct(Number(e.target.value))}
                    className="w-full bg-white text-xs text-zinc-800 border border-zinc-200 rounded p-1 font-mono font-medium outline-none"
                    placeholder="2%"
                  />
                </div>
                <span className="text-[10px] text-zinc-400 block mt-1 font-mono">Est: {formatBRL(itbiValue)}</span>
              </div>

              {/* Custos fixos cartório ou despachante */}
              <div className="bg-zinc-50/50 p-2.5 rounded-xl border border-zinc-150">
                <label className="text-[11px] font-bold text-zinc-600 block mb-1">{category === 'real_estate' ? 'Escritura & Registro de Imóvel' : 'Licenciamento & Emissão Detran'}</label>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-zinc-400 font-mono">R$</span>
                  <input
                    type="number"
                    value={registryOrRegistrationFix}
                    onChange={(e) => setRegistryOrRegistrationFix(Number(e.target.value))}
                    className="w-full bg-white text-xs text-zinc-800 border border-zinc-200 rounded p-1 font-mono font-medium outline-none"
                    placeholder="R$ 5.000"
                  />
                </div>
              </div>

              {/* Custos de Reforma ou Mecânica */}
              <div className="bg-zinc-50/50 p-2.5 rounded-xl border border-zinc-150">
                <label className="text-[11px] font-bold text-zinc-600 block mb-1">{category === 'real_estate' ? 'Custos Estimados de Reforma' : 'Reparos Mecânica & Funilaria'}</label>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-zinc-400 font-mono">R$</span>
                  <input
                    type="number"
                    value={repairCosts}
                    onChange={(e) => setRepairCosts(Number(e.target.value))}
                    className="w-full bg-white text-xs text-zinc-800 border border-zinc-200 rounded p-1 font-mono font-medium outline-none"
                    placeholder="R$ 15.000"
                  />
                </div>
              </div>

              {/* Dívidas do imóvel IPTU / condomínio acumulado */}
              <div className="bg-zinc-50/50 p-2.5 rounded-xl border border-zinc-150">
                <label className="text-[11px] font-bold text-zinc-600 block mb-1">{category === 'real_estate' ? 'Condomínio e IPTU atrasados' : 'IPVA, multas e pátio atrasado'}</label>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-zinc-400 font-mono">R$</span>
                  <input
                    type="number"
                    value={outstandingDebts}
                    onChange={(e) => setOutstandingDebts(Number(e.target.value))}
                    className="w-full bg-white text-xs text-zinc-800 border border-zinc-200 rounded p-1 font-mono font-medium outline-none"
                    placeholder="R$ 4.000"
                  />
                </div>
              </div>

              {/* Advogados / judiciais ou assessoria de leilão */}
              <div className="bg-zinc-50/50 p-2.5 rounded-xl border border-zinc-150">
                <label className="text-[11px] font-bold text-zinc-600 block mb-1">Custos Assessoria / Assessoria Jurídica</label>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-zinc-400 font-mono">R$</span>
                  <input
                    type="number"
                    value={judicialOrLegalCosts}
                    onChange={(e) => setJudicialOrLegalCosts(Number(e.target.value))}
                    className="w-full bg-white text-xs text-zinc-800 border border-zinc-200 rounded p-1 font-mono font-medium outline-none"
                    placeholder="R$ 3.000"
                  />
                </div>
              </div>

              {/* Holding costs */}
              <div className="bg-zinc-50/50 p-2.5 rounded-xl border border-zinc-150">
                <label className="text-[11px] font-bold text-zinc-600 block mb-1">Custos Mensais de Carregar (IPTU/Seguro/Pátio)</label>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-zinc-400 font-mono">R$</span>
                  <input
                    type="number"
                    value={holdingExpenses}
                    onChange={(e) => setHoldingExpenses(Number(e.target.value))}
                    className="w-full bg-white text-xs text-zinc-800 border border-zinc-200 rounded p-1 font-mono font-medium outline-none"
                    placeholder="R$ 2.000"
                  />
                </div>
              </div>

              {/* Discount on resell / broker rates */}
              <div className="bg-zinc-50/50 p-2.5 rounded-xl border border-zinc-150">
                <label className="text-[11px] font-bold text-zinc-600 block mb-1">{category === 'real_estate' ? 'Comissão Corretor Venda (%)' : 'Depreciação de Leilão / Margem Loja (%)'}</label>
                <div className="flex items-center gap-2">
                  <Percent className="h-3.5 w-3.5 text-zinc-400" />
                  <input
                    type="number"
                    value={expectedResaleDiscount}
                    onChange={(e) => setExpectedResaleDiscount(Number(e.target.value))}
                    className="w-full bg-white text-xs text-zinc-800 border border-zinc-200 rounded p-1 font-mono font-medium outline-none"
                    placeholder="6%"
                  />
                </div>
                <span className="text-[10.5px] text-zinc-500 block mt-1 font-mono">Valor Líquido Venda: {formatBRL(expectedResaleValue)}</span>
              </div>

              {/* Imposto de Renda - IR */}
              {category === 'real_estate' && (
                <div className="bg-zinc-50/50 p-2.5 rounded-xl border border-zinc-150">
                  <label className="text-[11px] font-bold text-zinc-600 block mb-1">Imposto de Renda - IR (% s/ Lucro)</label>
                  <div className="flex items-center gap-2">
                    <Percent className="h-3.5 w-3.5 text-emerald-500" />
                    <input
                      type="number"
                      value={irTaxRate}
                      onChange={(e) => setIrTaxRate(Number(e.target.value))}
                      className="w-full bg-white text-xs text-zinc-800 border border-zinc-200 rounded p-1 font-mono font-medium outline-none focus:border-emerald-500"
                      placeholder="15%"
                    />
                  </div>
                  <span className="text-[10.5px] text-zinc-500 block mt-1 font-mono">IR Estimado: {formatBRL(irTaxValue)}</span>
                </div>
              )}

            </div>
          </div>
        </div>

        {/* BOTTOM: Action triggers */}
        <div className="mt-8 pt-6 border-t border-zinc-150 flex flex-wrap gap-4 items-center justify-between">
          <button
            onClick={requestAiOpinion}
            disabled={loadingAi}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold bg-indigo-50 border border-indigo-150 hover:bg-indigo-100 text-indigo-700 transition-all cursor-pointer disabled:opacity-50"
          >
            {loadingAi ? <RefreshCw className="h-4 w-4 animate-spin" /> : <DollarSign className="h-4 w-4" />}
            🤖 {loadingAi ? 'IA Avaliando Números...' : 'Obter Parecer da IA'}
          </button>

          <button
            onClick={handleSave}
            className={`px-6 py-2.5 rounded-xl text-sm font-bold text-white shadow-md transition-all cursor-pointer ${
              saveSuccess 
                ? 'bg-emerald-500 shadow-emerald-500/20' 
                : 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-600/20'
            }`}
          >
            {saveSuccess ? '✓ Negócio Salvo' : 'Salvar Simulação'}
          </button>
        </div>
      </div>

      {/* RIGHT: LIVE RESULT GAUGES */}
      <div className="lg:col-span-5 space-y-6">
        
        {/* Visual ROI Display */}
        <div className="bg-white text-zinc-800 p-6 sm:p-8 rounded-3xl border border-zinc-200 shadow-sm relative overflow-hidden">
          {/* Subtle glow decorative circles */}
          <div className="absolute top-0 right-0 h-40 w-40 bg-emerald-500/5 rounded-full blur-3xl -z-10" />
          <div className="absolute bottom-0 left-0 h-32 w-32 bg-indigo-500/5 rounded-full blur-3xl -z-10" />

          <span className="text-[10px] uppercase font-mono tracking-wider font-semibold text-zinc-400">PARECER FINANCEIRO PROJETADO</span>
          
          <h3 className="text-3xl font-extrabold font-sans mt-0.5 text-zinc-800 mb-6">
            Rendimento Estimado
          </h3>

          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="bg-zinc-50 rounded-2xl p-4 border border-zinc-150">
              <span className="text-[10px] text-zinc-500 block font-mono">INVESTIMENTO TOTAL</span>
              <span className="text-xl font-bold text-zinc-800 font-sans block mt-1">{formatBRL(totalInvestment)}</span>
              <p className="text-[9px] text-zinc-400 font-mono mt-1">Lance + Despesas Totais</p>
            </div>
            <div className="bg-zinc-50 rounded-2xl p-4 border border-zinc-150">
              <span className="text-[10px] text-zinc-500 block font-mono">LUCRO LÍQUIDO</span>
              <span className={`text-xl font-bold font-sans block mt-1 ${netProfit >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                {formatBRL(netProfit)}
              </span>
              <p className="text-[9px] text-zinc-400 font-mono mt-1">Margem Líquida Limpa</p>
            </div>
          </div>

          <div className="bg-zinc-50 rounded-2xl p-6 border border-zinc-150 mb-6 flex flex-col items-center justify-center">
            <span className="text-[11px] text-zinc-500 font-mono">RETORNO SOBRE INVESTIMENTO</span>
            <span className={`text-4xl font-black font-sans my-1 ${netProfit >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
              {formatPercentBR(roiPercent)}%
            </span>
            <p className="text-xs text-zinc-500 text-center font-medium">Você receberá no bolso cerca de {formatBRL(netProfit)} para cada {formatBRL(totalInvestment)} empacotados.</p>
          </div>

          {/* Verdict badge status banner */}
          <div className={`p-4 rounded-xl border flex items-center gap-3 ${verdictConfig[verdict].bg}`}>
            <ActiveVerdictIcon className={`h-5 w-5 shrink-0 ${verdictConfig[verdict].color}`} />
            <div>
              <p className="text-xs font-bold leading-tight uppercase font-sans text-zinc-800">{verdictConfig[verdict].text}</p>
              <p className="text-[10px] font-medium text-zinc-550 mt-0.5">
                {verdict === 'excelente' && 'Excelente margem. Praticamente invulnerável a pequenas flutuações de reforma.'}
                {verdict === 'bom' && 'Margem de segurança saudável de mercado. Cumpre premissas padrão.'}
                {verdict === 'regular' && 'Rentabilidade mediana. Muito sensível a atrasos nos cartórios ou reformas adicionais.'}
                {verdict === 'risco_alto' && 'Atenção. Você pode empatar ou ter lucro pífio se houver qualquer despesa extra.'}
                {verdict === 'inviavel' && 'Inviável. O lance ultrapassou a viabilidade comercial devido a juros/reformas.'}
              </p>
            </div>
          </div>
        </div>

        {/* Investment Profile Classification Section (ROI Category) */}
        <div className="bg-white p-6 sm:p-8 rounded-3xl border border-zinc-200 shadow-sm relative overflow-hidden">
          <div className="flex items-center gap-2 mb-4">
            <span className="p-2 bg-indigo-50 rounded-lg text-indigo-600">
              <ShieldCheck className="h-4 w-4" />
            </span>
            <div>
              <h3 className="font-sans font-bold text-zinc-850 text-base">Classificação do Perfil do Investimento</h3>
              <p className="text-[10px] text-zinc-400">Classificação de risco e retorno baseada no ROI projetado</p>
            </div>
          </div>

          <div className="space-y-3.5">
            {/* Conservador (ROI < 10%) */}
            <div className={`p-4 rounded-2xl border transition-all duration-200 ${
              roiPercent < 10 
                ? 'border-blue-400 bg-blue-50/20 shadow-xs ring-1 ring-blue-400/15' 
                : 'border-zinc-100 opacity-60'
            }`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-lg text-[10px] font-extrabold uppercase tracking-wider border ${
                    roiPercent < 10 
                      ? 'bg-blue-50 text-blue-700 border-blue-200' 
                      : 'bg-zinc-50 text-zinc-500 border-zinc-200'
                  }`}>
                    Conservador
                  </span>
                  <span className="text-[10px] font-mono font-bold text-zinc-400">(ROI &lt; 10%)</span>
                </div>
                {roiPercent < 10 && (
                  <span className="flex items-center gap-1 text-[10.5px] font-bold text-blue-600 animate-pulse">
                    <span className="h-1.5 w-1.5 rounded-full bg-blue-500" />
                    Perfil Ativo
                  </span>
                )}
              </div>
              <p className="text-[11px] text-zinc-600 mt-2 leading-relaxed">
                Retorno moderado com foco na preservação e segurança do capital. Estratégia defensiva ideal para ativos de alta liquidez e baixo risco operacional.
              </p>
            </div>

            {/* Moderado (ROI 10-25%) */}
            <div className={`p-4 rounded-2xl border transition-all duration-200 ${
              roiPercent >= 10 && roiPercent <= 25 
                ? 'border-amber-400 bg-amber-50/20 shadow-xs ring-1 ring-amber-400/15' 
                : 'border-zinc-100 opacity-60'
            }`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-lg text-[10px] font-extrabold uppercase tracking-wider border ${
                    roiPercent >= 10 && roiPercent <= 25 
                      ? 'bg-amber-50 text-amber-700 border-amber-200' 
                      : 'bg-zinc-50 text-zinc-500 border-zinc-200'
                  }`}>
                    Moderado
                  </span>
                  <span className="text-[10px] font-mono font-bold text-zinc-400">(ROI 10-25%)</span>
                </div>
                {roiPercent >= 10 && roiPercent <= 25 && (
                  <span className="flex items-center gap-1 text-[10.5px] font-bold text-amber-600 animate-pulse">
                    <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
                    Perfil Ativo
                  </span>
                )}
              </div>
              <p className="text-[11px] text-zinc-600 mt-2 leading-relaxed">
                Relação equilibrada entre risco e rentabilidade. O retorno supera com folga as taxas de mercado convencionais, mantendo margens de segurança adequadas.
              </p>
            </div>

            {/* Agressivo (ROI > 25%) */}
            <div className={`p-4 rounded-2xl border transition-all duration-200 ${
              roiPercent > 25 
                ? 'border-emerald-400 bg-emerald-50/20 shadow-xs ring-1 ring-emerald-400/15' 
                : 'border-zinc-100 opacity-60'
            }`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-lg text-[10px] font-extrabold uppercase tracking-wider border ${
                    roiPercent > 25 
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                      : 'bg-zinc-50 text-zinc-500 border-zinc-200'
                  }`}>
                    Agressivo
                  </span>
                  <span className="text-[10px] font-mono font-bold text-zinc-400">(ROI &gt; 25%)</span>
                </div>
                {roiPercent > 25 && (
                  <span className="flex items-center gap-1 text-[10.5px] font-bold text-emerald-600 animate-pulse">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                    Perfil Ativo
                  </span>
                )}
              </div>
              <p className="text-[11px] text-zinc-600 mt-2 leading-relaxed">
                Alto potencial de valorização e ganhos substanciais. Exige análise minuciosa de custos imprevistos, tributação e riscos de liquidez.
              </p>
            </div>
          </div>
        </div>

        {/* Cost Composition Doughnut Chart */}
        <div className="bg-white p-6 sm:p-8 rounded-3xl border border-zinc-200 shadow-sm relative overflow-hidden">
          <div className="flex items-center gap-2 mb-4">
            <span className="p-2 bg-emerald-50 rounded-lg text-emerald-600">
              <ChartIcon className="h-4 w-4" />
            </span>
            <div>
              <h3 className="font-sans font-bold text-zinc-850 text-base">Composição do Custo</h3>
              <p className="text-[10px] text-zinc-400">Distribuição e peso de cada custo na arrematação</p>
            </div>
          </div>

          {/* Interactive Ring / Doughnut Chart Container */}
          <div className="relative h-56 flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={[
                    { name: 'Lance (Arrematação)', value: bidValue, color: '#10B981' },
                    { name: 'Comissão Leiloeiro', value: leiloeiroValue, color: '#3B82F6' },
                    { name: 'Impostos e ITBI', value: itbiValue, color: '#F59E0B' },
                    { name: 'Cartório / Licenciamento', value: Number(registryOrRegistrationFix), color: '#8B5CF6' },
                    { name: 'Reforma e Ajustes', value: Number(repairCosts), color: '#EC4899' },
                    { name: 'Dívidas Pendentes', value: Number(outstandingDebts), color: '#EF4444' },
                    { name: 'Custos Judiciais / Assessoria', value: Number(judicialOrLegalCosts), color: '#6366F1' },
                    { name: 'Despesas de Carregamento', value: Number(holdingExpenses), color: '#14B8A6' },
                    { name: 'Imposto de Renda (IR)', value: irTaxValue, color: '#0EA5E9' },
                  ].filter(item => item.value > 0)}
                  cx="50%"
                  cy="50%"
                  innerRadius={65}
                  outerRadius={85}
                  paddingAngle={2}
                  dataKey="value"
                  onMouseEnter={(_, index) => setActiveIndex(index)}
                  onMouseLeave={() => setActiveIndex(null)}
                >
                  {[
                    { name: 'Lance (Arrematação)', value: bidValue, color: '#10B981' },
                    { name: 'Comissão Leiloeiro', value: leiloeiroValue, color: '#3B82F6' },
                    { name: 'Impostos e ITBI', value: itbiValue, color: '#F59E0B' },
                    { name: 'Cartório / Licenciamento', value: Number(registryOrRegistrationFix), color: '#8B5CF6' },
                    { name: 'Reforma e Ajustes', value: Number(repairCosts), color: '#EC4899' },
                    { name: 'Dívidas Pendentes', value: Number(outstandingDebts), color: '#EF4444' },
                    { name: 'Custos Judiciais / Assessoria', value: Number(judicialOrLegalCosts), color: '#6366F1' },
                    { name: 'Despesas de Carregamento', value: Number(holdingExpenses), color: '#14B8A6' },
                    { name: 'Imposto de Renda (IR)', value: irTaxValue, color: '#0EA5E9' },
                  ].filter(item => item.value > 0).map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={entry.color} 
                      style={{
                        outline: 'none',
                        filter: activeIndex === index ? 'brightness(1.05) drop-shadow(0px 2px 4px rgba(0,0,0,0.1))' : 'none',
                        transition: 'all 0.15s ease-in-out',
                        cursor: 'pointer'
                      }}
                    />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>

            {/* Inner text content displaying hovered details or total */}
            {activeIndex !== null && [
              { name: 'Lance (Arrematação)', value: bidValue, color: '#10B981' },
              { name: 'Comissão Leiloeiro', value: leiloeiroValue, color: '#3B82F6' },
              { name: 'Impostos e ITBI', value: itbiValue, color: '#F59E0B' },
              { name: 'Cartório / Licenciamento', value: Number(registryOrRegistrationFix), color: '#8B5CF6' },
              { name: 'Reforma e Ajustes', value: Number(repairCosts), color: '#EC4899' },
              { name: 'Dívidas Pendentes', value: Number(outstandingDebts), color: '#EF4444' },
              { name: 'Custos Judiciais / Assessoria', value: Number(judicialOrLegalCosts), color: '#6366F1' },
              { name: 'Despesas de Carregamento', value: Number(holdingExpenses), color: '#14B8A6' },
              { name: 'Imposto de Renda (IR)', value: irTaxValue, color: '#0EA5E9' },
            ].filter(item => item.value > 0)[activeIndex] ? (
              (() => {
                const item = [
                  { name: 'Lance (Arrematação)', value: bidValue, color: '#10B981' },
                  { name: 'Comissão Leiloeiro', value: leiloeiroValue, color: '#3B82F6' },
                  { name: 'Impostos e ITBI', value: itbiValue, color: '#F59E0B' },
                  { name: 'Cartório / Licenciamento', value: Number(registryOrRegistrationFix), color: '#8B5CF6' },
                  { name: 'Reforma e Ajustes', value: Number(repairCosts), color: '#EC4899' },
                  { name: 'Dívidas Pendentes', value: Number(outstandingDebts), color: '#EF4444' },
                  { name: 'Custos Judiciais / Assessoria', value: Number(judicialOrLegalCosts), color: '#6366F1' },
                  { name: 'Despesas de Carregamento', value: Number(holdingExpenses), color: '#14B8A6' },
                  { name: 'Imposto de Renda (IR)', value: irTaxValue, color: '#0EA5E9' },
                ].filter(item => item.value > 0)[activeIndex];
                const pct = totalInvestment > 0 ? (item.value / totalInvestment) * 100 : 0;
                return (
                  <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-center p-4">
                    <span className="text-[10px] uppercase font-bold tracking-wider text-zinc-400 truncate max-w-[150px]">
                      {item.name}
                    </span>
                    <span className="text-base font-black text-zinc-850 font-sans mt-0.5">
                      {formatBRL(item.value)}
                    </span>
                    <span className="text-[11px] font-mono font-bold text-zinc-500 mt-0.5">
                      {formatPercentBR(pct)}% do total
                    </span>
                  </div>
                );
              })()
            ) : (
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-center p-4">
                <span className="text-[10px] uppercase font-bold tracking-wider text-zinc-400">
                  Custo Total
                </span>
                <span className="text-lg font-black text-zinc-850 font-sans mt-0.5">
                  {formatBRL(totalInvestment)}
                </span>
                <span className="text-[10px] text-zinc-400 mt-0.5">
                  100% Investido
                </span>
              </div>
            )}
          </div>

          {/* Detailed legend items with custom hover states */}
          <div className="grid grid-cols-1 gap-2 mt-4 max-h-[220px] overflow-y-auto pr-1">
            {[
              { name: 'Lance (Arrematação)', value: bidValue, color: '#10B981' },
              { name: 'Comissão Leiloeiro', value: leiloeiroValue, color: '#3B82F6' },
              { name: 'Impostos e ITBI', value: itbiValue, color: '#F59E0B' },
              { name: 'Cartório / Licenciamento', value: Number(registryOrRegistrationFix), color: '#8B5CF6' },
              { name: 'Reforma e Ajustes', value: Number(repairCosts), color: '#EC4899' },
              { name: 'Dívidas Pendentes', value: Number(outstandingDebts), color: '#EF4444' },
              { name: 'Custos Judiciais / Assessoria', value: Number(judicialOrLegalCosts), color: '#6366F1' },
              { name: 'Despesas de Carregamento', value: Number(holdingExpenses), color: '#14B8A6' },
            ].filter(item => item.value > 0).map((item, idx) => {
              const isSelected = activeIndex === idx;
              const itemPct = totalInvestment > 0 ? (item.value / totalInvestment) * 100 : 0;
              return (
                <div 
                  key={idx}
                  onMouseEnter={() => setActiveIndex(idx)}
                  onMouseLeave={() => setActiveIndex(null)}
                  className={`flex items-center justify-between p-2 rounded-xl transition-all border cursor-pointer ${
                    isSelected 
                      ? 'bg-zinc-50 border-zinc-200' 
                      : 'bg-transparent border-transparent hover:bg-zinc-50/50'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span 
                      className="h-2.5 w-2.5 rounded-full shrink-0" 
                      style={{ backgroundColor: item.color }} 
                    />
                    <span className="text-[11px] font-bold text-zinc-700 truncate">{item.name}</span>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <span className="text-[11px] font-mono text-zinc-600 font-medium">{formatBRL(item.value)}</span>
                    <span className="text-[10px] font-mono font-bold text-zinc-400 bg-zinc-100/75 px-1.5 py-0.5 rounded-md min-w-[40px] text-center">{formatPercentBR(itemPct)}%</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* AI opinion audit log box */}
        <div className="bg-white p-6 sm:p-8 rounded-3xl border border-zinc-150 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <span className="p-2 bg-indigo-50 rounded-lg text-indigo-600"><DollarSign className="h-4 w-4" /></span>
            <h3 className="font-sans font-bold text-zinc-850 text-base">Parecer de Inteligência Artificial</h3>
          </div>

          {loadingAi ? (
            <div className="py-6 flex flex-col items-center justify-center gap-3">
              <RefreshCw className="h-6 w-6 text-indigo-600 animate-spin" />
              <p className="text-xs font-medium text-zinc-500 animate-pulse">O Assistente de IA está calculando as premissas...</p>
            </div>
          ) : aiOpinion ? (
            <div className="bg-zinc-50/70 rounded-2xl p-4 border border-zinc-150 text-xs text-zinc-750 leading-relaxed max-h-72 overflow-y-auto whitespace-pre-wrap font-sans">
              {aiOpinion}
            </div>
          ) : (
            <div className="text-center py-6 text-zinc-400 text-xs">
              <p className="font-medium mb-1">Deseja uma recomendação jurídica da IA para esta estrutura de preços?</p>
              <p className="text-[10px] text-zinc-500">Clique em <strong>"Obter Parecer da IA"</strong> acima para gerar um relatório resumido.</p>
            </div>
          )}
        </div>

      </div>

    </div>
  );
}
