import React, { useState, useEffect } from 'react';
import { jsPDF } from 'jspdf';
import { AuctionItem, EditalAnalysis, ChatMessage } from '../types';
import { SAMPLE_AUCTIONS } from '../data';
import { 
  ShieldCheck, AlertTriangle, CheckSquare, Sparkles, Send, 
  RefreshCw, FileText, Info, HelpCircle, ArrowRight, BookOpen, FileDown
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface AiAnalyzerProps {
  preSelectedForAnalysis: AuctionItem | null;
  onClearPreSelected: () => void;
}

// Sample Paste templates for Brazilian Auction notices (Editais) to make testing seamless
const NOTICE_TEMPLATES = [
  {
    id: 'temp-1',
    label: 'Apartamento Retomado pela Caixa (Extrajudicial)',
    category: 'real_estate',
    text: `EDITAL DE LEILÃO EXTRAJUDICIAL - CAIXA ECONÔMICA FEDERAL
LOTE 12 - Apartamento residencial nº 42, situado na Rua dos Pinheiros, Porto Alegre/RS. 
Área privativa de 72,00m². Matrícula nº 142.980 do 3º CRI de Porto Alegre.
IMÓVEL OCUPADO PELO EX-MUTUÁRIO.
Condições de Venda: Venda sob a égide da Lei Federal 9.514/97 (Alienação Fiduciária).
Débitos do Imóvel: Eventuais débitos de IPTU e condomínio que pesem sobre o imóvel até a data da arrematação correrão por exclusiva conta do comprador/arrematante. O valor acumulado estimado é de aproximadamente R$ 14.500,00.
Comissão do Leiloeiro: Adicional de 5% sobre o valor do lance, pago no ato ao Leiloeiro Oficial Pestana.
Desocupação: A obtenção de posse e desocupação do imóvel judicial ou extrajudicial correrá por conta e risco do arrematante, exonerando-se a Caixa de qualquer encargo referente à imissão da posse.`
  },
  {
    id: 'temp-2',
    label: 'Casa Leilão Judicial (Cobrança de Condomínio)',
    category: 'real_estate',
    text: `EDITAL DE 1º E 2° LEILÃO JUDICIAL - EGRÉGIO TRIBUNAL DE JUSTIÇA DO RS
Processo nº 5022356-42.2023.8.21.0101 - Cumprimento de Sentença (TJRS).
LOTE ÚNICO: Casa nº 5, Residencial Planalto, Gramado/RS, com área construída de 210m². Matrícula nº 44.150 do Registro de Imóveis de Gramado.
Imóvel Ocupado por terceiros.
DÉBITOS DE IPTU E CONDOMÍNIO: Conforme o Artigo 130, parágrafo único do Código Tributário Nacional, e jurisprudência pacífica, os débitos propter rem (condomínio e IPTU acumulados em R$ 98.000,00) sub-rogam-se no preço da arrematação, devendo ser pagos preferencialmente com o produto arrecadado no leilão.
Há recurso interposto pelo Réu pendente de julgamento no TJRS, pugnando pela anulação da penhora por bem de família. O arrematante assume o risco de nulidade caso o recurso seja provido.`
  },
  {
    id: 'temp-3',
    label: 'Carro Leilão Financeiro (Recuperado)',
    category: 'vehicle',
    text: `LEILÃO DE VEÍCULOS - BANCO MULTIPLO S.A.
LOTE 242 - Honda Civic Touring 1.5 Turbo, Ano/Modelo 2021/2021, Cor Cinza, Gasolina. Plca GXX-9900.
Veículo com manual do proprietário e chave reserva no porta-luvas. Motor funcionando.
Condição Geral: Recuperado de Financiamento (Art. 3º do Decreto-Lei 911/69).
Custos do Arrematante: Comissão do leiloeiro oficial de 5% sobre o lance + taxa administrativa de pátio fixa de R$ 1.950,00 referente a despesas de pátio, guincho, vistoria e assessoria.
Multas e IPVA: Eventuais IPVAs anteriores e multas municipais de trânsito vinculadas ao chassi até o dia do leilão correrão por conta do Banco Comitente Vendedor. O licenciamento 2026 e a taxa de transferência Detran correm exclusivamente por conta do comprador.`
  }
];

export const handleExportAiAnalysisPDF = (analysisData: EditalAnalysis, itemTitle?: string) => {
  if (!analysisData) return;
  try {
    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();

    const formatBRL = (v: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v || 0);

    doc.setFillColor(255, 255, 255);
    doc.rect(0, 0, pageWidth, pageHeight, 'F');

    // Header box
    doc.setFillColor(248, 250, 252);
    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.4);
    doc.roundedRect(12, 12, pageWidth - 24, 34, 4, 4, 'FD');

    doc.setFillColor(16, 185, 129);
    doc.rect(12, 12, 2.2, 34, 'F');

    doc.setTextColor(5, 150, 105);
    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.text('PARECER JURÍDICO & ANÁLISE DE IA — LEILÃO EXECUTIVO', pageWidth - 16, 19, { align: 'right' });

    doc.setTextColor(15, 23, 42);
    doc.setFontSize(12);
    doc.text(itemTitle || 'Relatório de Risco da Operação', 18, 24);

    doc.setFontSize(8.5);
    doc.setFont('Helvetica', 'normal');
    doc.setTextColor(71, 85, 105);
    doc.text(`Score de Viabilidade: ${analysisData.score}%  |  Status: ${analysisData.score >= 70 ? 'Altamente Recomendado' : analysisData.score >= 40 ? 'Atenção / Risco Moderado' : 'Crítico / Elevados Riscos'}`, 18, 38);

    let y = 52;

    const drawHeader = (t: string, h: number) => {
      if (y + h > pageHeight - 16) { doc.addPage(); y = 12; }
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
      doc.text(t.toUpperCase(), 17, startY + 7);
      doc.setDrawColor(241, 245, 249);
      doc.setLineWidth(0.35);
      doc.line(12, startY + 11, pageWidth - 12, startY + 11);
      return startY;
    };

    // Executive summary
    if (analysisData.executiveSummary) {
      const summaryLines = doc.splitTextToSize(analysisData.executiveSummary, pageWidth - 36);
      const sumH = 16 + (summaryLines.length * 4.5);
      const s1Y = drawHeader('Resumo Executivo da IA', sumH);
      doc.setFont('Helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(51, 65, 85);
      doc.text(summaryLines, 18, s1Y + 17);
      y += sumH + 5;
    }

    // Financial calculations
    if (analysisData.financialCalculations) {
      const finH = 34;
      const s2Y = drawHeader('Projeções Financeiras Sugeridas', finH);
      doc.setFont('Helvetica', 'bold');
      doc.setFontSize(8);
      doc.setTextColor(100, 116, 139);
      doc.text('CUSTOS EXTRAS ESTIMADOS:', 18, s2Y + 18);
      doc.setTextColor(15, 23, 42);
      doc.text(formatBRL(analysisData.financialCalculations.additionalCostsEstimated), 68, s2Y + 18);

      doc.setTextColor(5, 150, 105);
      doc.text('LANCE MÁXIMO SUGERIDO:', 18, s2Y + 26);
      doc.text(formatBRL(analysisData.financialCalculations.maxViableBid), 68, s2Y + 26);

      y += finH + 5;
    }

    // Legal Risks
    if (analysisData.legalRisks && analysisData.legalRisks.length > 0) {
      const riskCount = analysisData.legalRisks.length;
      const riskH = 16 + (riskCount * 14);
      const s3Y = drawHeader('Alertas & Condições Gravíssimas Mapeadas', riskH);
      let rY = s3Y + 16;
      analysisData.legalRisks.forEach((rk) => {
        doc.setFont('Helvetica', 'bold');
        doc.setFontSize(8);
        doc.setTextColor(rk.severity === 'alto' ? 220 : rk.severity === 'medio' ? 217 : 79, rk.severity === 'alto' ? 38 : rk.severity === 'medio' ? 119 : 70, rk.severity === 'alto' ? 38 : rk.severity === 'medio' ? 6 : 229);
        doc.text(`[${(rk.severity || '').toUpperCase()}] ${rk.title}`, 18, rY);
        doc.setFont('Helvetica', 'normal');
        doc.setFontSize(7.5);
        doc.setTextColor(71, 85, 105);
        doc.text(doc.splitTextToSize(rk.description, pageWidth - 42), 18, rY + 4.5);
        rY += 13;
      });
      y += riskH + 5;
    }

    // Recommended Actions
    if (analysisData.recommendedActions && analysisData.recommendedActions.length > 0) {
      const actH = 16 + (analysisData.recommendedActions.length * 6);
      const s4Y = drawHeader('Ações Obrigatórias Antes do Lance', actH);
      let aY = s4Y + 17;
      analysisData.recommendedActions.forEach((act, idx) => {
        doc.setFont('Helvetica', 'bold');
        doc.setFontSize(8);
        doc.setTextColor(5, 150, 105);
        doc.text(`${idx + 1}.`, 18, aY);
        doc.setFont('Helvetica', 'normal');
        doc.setTextColor(51, 65, 85);
        doc.text(doc.splitTextToSize(act, pageWidth - 46), 24, aY);
        aY += 6;
      });
      y += actH + 5;
    }

    // Footer
    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.35);
    doc.line(12, pageHeight - 14, pageWidth - 12, pageHeight - 14);

    doc.setTextColor(100, 116, 139);
    doc.setFont('Helvetica', 'normal');
    doc.setFontSize(7.5);
    const timestamp = `${new Date().toLocaleDateString('pt-BR')} ${new Date().toLocaleTimeString('pt-BR', {hour: '2-digit', minute:'2-digit'})}`;
    doc.text(`Parecer Jurídico Gerado Eletronicamente em ${timestamp}  |  Analisador de Edital`, 15, pageHeight - 9);

    doc.save('Parecer_Juridico_IA.pdf');
  } catch (err) {
    console.error('Erro ao emitir parecer da IA:', err);
    alert('Não foi possível gerar o relatório PDF da Análise de IA.');
  }
};

export default function AiAnalyzer({ preSelectedForAnalysis, onClearPreSelected }: AiAnalyzerProps) {
  const [inputText, setInputText] = useState<string>('');
  const [category, setCategory] = useState<'real_estate' | 'vehicle'>('real_estate');
  const [marketValueInput, setMarketValueInput] = useState<string>('');
  const [bidValueInput, setBidValueInput] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string>('');

  // Result state
  const [analysis, setAnalysis] = useState<EditalAnalysis | null>(null);

  // Chat state
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [typingMessage, setTypingMessage] = useState<string>('');
  const [sendingChat, setSendingChat] = useState<boolean>(false);

  // Handle load pre-selected auction details
  useEffect(() => {
    if (preSelectedForAnalysis) {
      setCategory(preSelectedForAnalysis.category);
      setMarketValueInput(preSelectedForAnalysis.marketValue.toString());
      setBidValueInput(preSelectedForAnalysis.currentBid.toString());
      
      // Auto-generate some context edital text to make it easy
      const autoText = `EDITAL DE LEILÃO INDIVIDUALIZADO - LOTE ${preSelectedForAnalysis.id.toUpperCase()}
Título do Lote: ${preSelectedForAnalysis.title}
Localização do Bem: ${preSelectedForAnalysis.location}
Leiloeiro/Portal Oficial: ${preSelectedForAnalysis.portalName}
Valor de Mercado Avaliado / Tabela FIPE: R$ ${preSelectedForAnalysis.marketValue}
Lance Mínimo Exigido: R$ ${preSelectedForAnalysis.currentBid}
Estado do Bem: ${preSelectedForAnalysis.occupancyStatus === 'ocupado' ? 'IMÓVEL OCUPADO pelo antigo proprietário.' : 'IMÓVEL DESOCUPADO / PRONTO PARA POSSE.'}
${preSelectedForAnalysis.category === 'vehicle' ? `Mecânica e Condição: Veículo avaliado como ${preSelectedForAnalysis.vehicleCondition}. ${preSelectedForAnalysis.details.chassisState || 'Chassi regular.'}` : ''}
Especificações: ${preSelectedForAnalysis.description}
Problemas Documentais / Gravames no Registro: ${preSelectedForAnalysis.details.documentIssues || 'Nenhuma pendência crítica especificada no anúncio inicial.'}`;
      
      setInputText(autoText);
    }
  }, [preSelectedForAnalysis]);

  const selectTemplate = (templateId: string) => {
    const temp = NOTICE_TEMPLATES.find(t => t.id === templateId);
    if (temp) {
      setCategory(temp.category as 'real_estate' | 'vehicle');
      setInputText(temp.text);
      if (temp.category === 'real_estate') {
        setMarketValueInput(templateId === 'temp-1' ? '850000' : '1600000');
        setBidValueInput(templateId === 'temp-1' ? '442000' : '800000');
      } else {
        setMarketValueInput('148000');
        setBidValueInput('96000');
      }
      setErrorMsg('');
    }
  };

  // Run Gemini analysis via express endpoint
  const runAnalysis = async () => {
    if (!inputText.trim()) {
      setErrorMsg('Por favor, digite ou cole as informações relevantes ou edital para realizar a análise.');
      return;
    }

    setLoading(true);
    setErrorMsg('');
    setAnalysis(null);
    setChatMessages([]);

    try {
      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          inputText,
          category,
          marketValue: Number(marketValueInput) || undefined,
          currentBid: Number(bidValueInput) || undefined,
        })
      });

      const data = await response.json();
      if (!response.ok || data.error) {
        throw new Error(data.error || 'Erro inesperado na resposta do servidor.');
      }

      const completedAnalysis: EditalAnalysis = {
        id: `analysis-${Date.now()}`,
        inputText,
        analyzedAt: new Date().toISOString(),
        category,
        score: data.score,
        legalRisks: data.legalRisks || [],
        financialCalculations: {
          additionalCostsEstimated: data.financialCalculations?.additionalCostsEstimated || 0,
          customTaxDetails: data.financialCalculations?.customTaxDetails || 'Custos tributários padrão.',
          maxViableBid: data.financialCalculations?.maxViableBid || 0,
        },
        recommendedActions: data.recommendedActions || [],
        executiveSummary: data.executiveSummary || '',
      };

      setAnalysis(completedAnalysis);

      // Pre-populate chat with a welcomes from the AI Expert
      setChatMessages([
        {
          id: 'msg-welcome',
          role: 'assistant',
          content: `Olá! Analisei os dados fornecidos sobre este lote de leilão.
Ele obteve um **Índice de Segurança Geral de ${completedAnalysis.score}/100**.

Recomendo focar principalmente nos riscos de nível **Alto** identificados na seção de Riscos Jurídicos e Administrativos.
Sinta-se livre para me perguntar qualquer ponto específico, como:
- *Como lidar com a desocupação neste caso?*
- *Quais são os prazos de regularização jurídica?*
- *O lance que planejo dar vale a pena?*`,
          timestamp: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
        }
      ]);
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || 'Houve uma falha ao conectar com o serviço de Inteligência Artificial. Verifique as configurações de chave.');
    } finally {
      setLoading(false);
    }
  };

  // Context Chat Handler
  const sendChatMessage = async () => {
    if (!typingMessage.trim() || sendingChat) return;

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: typingMessage,
      timestamp: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
    };

    setChatMessages(prev => [...prev, userMsg]);
    setTypingMessage('');
    setSendingChat(true);

    try {
      const chatContext = preSelectedForAnalysis || (analysis ? {
        title: category === 'real_estate' ? 'Lote de Imóvel Analisado' : 'Lote de Veículo Analisado',
        category,
        typeText: category === 'real_estate' ? 'Imóvel' : 'Automóvel',
        location: 'Local informado no texto',
        marketValue: Number(marketValueInput) || 100000,
        currentBid: Number(bidValueInput) || 50000,
        portalName: 'Leiloeiro do edital'
      } : null);

      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [...chatMessages, userMsg],
          auctionContext: chatContext
        })
      });

      const data = await response.json();
      if (data.error) {
        throw new Error(data.error);
      }

      setChatMessages(prev => [...prev, {
        id: `ai-${Date.now()}`,
        role: 'assistant',
        content: data.content,
        timestamp: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
      }]);
    } catch (err: any) {
      setChatMessages(prev => [...prev, {
        id: `ai-err-${Date.now()}`,
        role: 'assistant',
        content: `⚠️ Ocorreu uma instabilidade ao formular posições: ${err.message || 'Verifique se a chave de IA está ativa.'}`,
        timestamp: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
      }]);
    } finally {
      setSendingChat(false);
    }
  };

  // Key formatting helpers
  const formatBRL = (val: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(val);
  };

  return (
    <div id="ai-analyzer-panel" className="space-y-8">
      
      {/* Intro Header */}
      <div className="bg-[#1C1C1E] border border-[#2C2C2E]/80 rounded-3xl p-6 sm:p-8 text-[#F8FAFC] shadow-3xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="p-1 px-2.5 rounded-lg bg-[#10B981]/10 text-[#10B981] border border-[#10B981]/20 text-xs font-bold font-mono">Analista Expert AI v3.5</span>
              <span className="h-2 w-2 rounded-full bg-[#10B981] animate-pulse" />
            </div>
            <h2 className="text-2xl font-black font-sans tracking-tight text-[#F8FAFC]">Análise Inteligente de Editais e Riscos</h2>
            <p className="text-xs text-zinc-400">Cole a descrição do lote ou as regras do edital para calcular a pontuação de risco jurídico e financeiro real</p>
          </div>
          {preSelectedForAnalysis && (
            <div className="bg-[#1C1C1E]/60 border border-[#2C2C2E] p-3 rounded-2xl max-w-sm flex items-center gap-3">
              <div className="truncate text-xs">
                <span className="font-bold text-[#10B981] block">Lote Carregado:</span>
                <span className="font-semibold text-slate-300 block truncate">{preSelectedForAnalysis.title}</span>
              </div>
              <button 
                onClick={onClearPreSelected}
                className="text-[10px] bg-[#2C2C2E] hover:bg-[#3C3C3E] text-slate-300 rounded px-2 py-1 font-bold cursor-pointer shadow-3xs"
              >
                Limpar
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* INPUT FORM PANE */}
        <div className="lg:col-span-5 bg-[#1C1C1E] p-6 sm:p-8 rounded-3xl border border-[#2C2C2E]/80 shadow-sm space-y-6">
          <div className="flex items-center justify-between border-b border-[#2C2C2E] pb-3">
            <h3 className="font-sans font-bold text-[#F8FAFC] text-sm flex items-center gap-2">
              <FileText className="h-4 w-4 text-[#10B981]" />
              Entrada de Documentação
            </h3>
          </div>

          {/* Quick template testing selection */}
          <div className="space-y-1.5">
            <span className="text-[11px] font-bold text-slate-400 font-mono block">TESTE RÁPIDO DISPONÍVEL (CLIQUE PARA AUTO-PREENCHER COM EXEMPLO):</span>
            <div className="flex flex-col gap-2">
              {NOTICE_TEMPLATES.map(temp => (
                <button
                  key={temp.id}
                  onClick={() => selectTemplate(temp.id)}
                  className="w-full text-left p-2.5 bg-[#1C1C1E]/60 border border-[#2C2C2E]/80 hover:border-[#10B981] hover:bg-[#10B981]/5 text-slate-300 rounded-xl text-xs font-medium transition-all duration-150 cursor-pointer flex items-center justify-between"
                >
                  <span className="truncate">{temp.label}</span>
                  <ArrowRight className="h-3 w-3 shrink-0 text-[#10B981] ml-2" />
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-4">
            {/* Lote category choice */}
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => setCategory('real_estate')}
                className={`py-2 px-3 border rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  category === 'real_estate' 
                    ? 'bg-emerald-950/40 border-emerald-800/40 text-emerald-400' 
                    : 'bg-[#1C1C1E]/60 border border-[#2C2C2E] text-slate-400'
                }`}
              >
                🏠 Imóvel
              </button>
              <button
                onClick={() => setCategory('vehicle')}
                className={`py-2 px-3 border rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  category === 'vehicle' 
                    ? 'bg-emerald-950/40 border-emerald-800/40 text-emerald-400' 
                    : 'bg-[#1C1C1E]/60 border border-[#2C2C2E] text-slate-400'
                }`}
              >
                🚗 Veículo
              </button>
            </div>

            {/* Optional Financial Details */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] font-bold text-slate-400 block mb-1">Avaliação / FIPE (R$)</label>
                <input
                  type="number"
                  value={marketValueInput}
                  onChange={(e) => setMarketValueInput(e.target.value)}
                  className="w-full bg-[#1C1C1E]/60 text-xs font-medium border border-[#2C2C2E] rounded-xl p-2.5 text-[#F8FAFC] focus:outline-none focus:ring-1 focus:ring-[#10B981]"
                  placeholder="Opcional. Ex: 850000"
                />
              </div>
              <div>
                <label className="text-[11px] font-bold text-slate-400 block mb-1">Lance Atual Mínimo (R$)</label>
                <input
                  type="number"
                  value={bidValueInput}
                  onChange={(e) => setBidValueInput(e.target.value)}
                  className="w-full bg-[#1C1C1E]/60 text-xs font-medium border border-[#2C2C2E] rounded-xl p-2.5 text-[#F8FAFC] focus:outline-none focus:ring-1 focus:ring-[#10B981]"
                  placeholder="Opcional. Ex: 442000"
                />
              </div>
            </div>

            {/* Pasted text Area */}
            <div>
              <label className="text-[11px] font-bold text-slate-400 block mb-1">Texto do Edital ou Detalhes da Oferta</label>
              <textarea
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                className="w-full h-64 bg-[#1C1C1E]/60 text-xs border border-[#2C2C2E] rounded-2xl p-4 text-[#F8FAFC] focus:outline-none focus:ring-1 focus:ring-[#10B981]"
                placeholder="Cole aqui o extrato do edital de leilão, regulamento de pátio do Detran ou descrição detalhada do imóvel/veículo para análise profunda..."
              />
            </div>
          </div>

          {errorMsg && (
            <div className="p-3 bg-rose-500/10 border border-rose-500/25 text-rose-400 rounded-xl text-xs font-semibold">
              {errorMsg}
            </div>
          )}

          <button
            onClick={runAnalysis}
            disabled={loading}
            className="w-full py-3 px-4 bg-[#10B981] hover:bg-[#10B981]/90 text-black rounded-2xl text-sm font-bold shadow-md hover:shadow-lg transition-all cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {loading ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
            {loading ? 'Inteligência Artificial Examinando...' : 'Iniciar Análise por IA'}
          </button>
        </div>

        {/* RESULTS PANEL & IMAGES */}
        <div className="lg:col-span-7 space-y-8">
          
          <AnimatePresence mode="wait">
            {loading ? (
              <motion.div
                key="loading"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="bg-[#1C1C1E] rounded-3xl border border-[#2C2C2E]/80 p-8 shadow-sm flex flex-col items-center justify-center min-h-[400px] text-center text-[#F8FAFC]"
              >
                <div className="relative h-20 w-20 flex items-center justify-center mb-4">
                  <div className="absolute inset-0 border-4 border-[#2C2C2E] rounded-full" />
                  <div className="absolute inset-0 border-4 border-[#10B981] border-t-transparent rounded-full animate-spin" />
                  <ShieldCheck className="h-8 w-8 text-[#10B981] animate-pulse" />
                </div>
                <h4 className="text-base font-bold text-[#F8FAFC] font-sans">Compilando Jurisprudências & Dados de Edital...</h4>
                <p className="text-xs text-zinc-400 mt-1 max-w-sm">Aguarde. Nossa Inteligência Artificial está calculando impostos (ITBI/IPVA), avaliando perigos de ocupação judicial e projetando lances limites...</p>
              </motion.div>
            ) : analysis ? (
              <motion.div
                key="result"
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                className="space-y-8"
              >
                {/* Result header box */}
                <div className="bg-[#1C1C1E] rounded-3xl border border-[#2C2C2E]/80 p-6 sm:p-8 shadow-sm">
                  <div className="flex flex-col sm:flex-row items-center gap-6 justify-between border-b border-[#2C2C2E] pb-6 mb-6">
                    <div className="flex flex-col sm:flex-row sm:items-center gap-4 justify-between w-full sm:w-auto">
                      <div>
                        <span className="text-[10px] uppercase font-mono font-bold text-slate-400">PARECER JURÍDICO EMITIDO</span>
                        <h3 className="text-lg font-bold text-[#F8FAFC] mt-0.5">Relatório de Risco da Operação</h3>
                      </div>

                      <button
                        onClick={() => handleExportAiAnalysisPDF(analysis)}
                        className="px-3 py-2 bg-[#10B981]/15 hover:bg-[#10B981]/25 border border-[#10B981]/30 text-[#10B981] rounded-xl text-xs font-bold flex items-center gap-2 transition cursor-pointer shadow-xs"
                      >
                        <FileDown className="h-4 w-4" />
                        <span>Exportar Relatório PDF</span>
                      </button>
                    </div>
                    
                    {/* Security gauge rating status */}
                    <div className="flex items-center gap-3">
                      <div className="relative h-16 w-16 flex items-center justify-center shrink-0">
                        <svg className="w-full h-full transform -rotate-90">
                           <circle cx="32" cy="32" r="28" fill="transparent" stroke="#27272A" strokeWidth="6" />
                           <circle cx="32" cy="32" r="28" fill="transparent" stroke={analysis.score >= 70 ? '#10B981' : analysis.score >= 40 ? '#f59e0b' : '#ef4444'} strokeWidth="6" strokeDasharray={175} strokeDashoffset={175 - (175 * analysis.score) / 100} />
                        </svg>
                        <span className="absolute text-sm font-black text-[#F8FAFC] font-mono">{analysis.score}%</span>
                      </div>
                      <div>
                        <span className="text-xs font-bold font-mono text-zinc-400 uppercase">Classificação Geral</span>
                        <p className={`text-sm font-extrabold ${analysis.score >= 70 ? 'text-[#10B981]' : analysis.score >= 40 ? 'text-amber-500' : 'text-rose-500'}`}>
                          {analysis.score >= 70 ? '🏆 Altamente Recomendado' : analysis.score >= 40 ? '🟡 Atenção / Risco Moderado' : '🔴 Crítico / Elevados Riscos'}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Executive summary markdown render */}
                  <div className="prose prose-zinc bg-[#10B981]/5 border border-[#10B981]/20 p-5 rounded-2xl text-xs text-slate-300 leading-relaxed mb-6 font-sans font-medium">
                    <div className="flex items-center gap-2 mb-3 text-[#10B981] font-extrabold text-xs uppercase font-mono">
                      <BookOpen className="h-4 w-4 text-[#10B981]" />
                      Resumo Executivo da IA
                    </div>
                    <div className="whitespace-pre-wrap">{analysis.executiveSummary}</div>
                  </div>

                  {/* Financial projections block cards */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                    <div className="bg-[#1C1C1E]/60 border border-[#2C2C2E] rounded-2xl p-4">
                      <span className="text-[10px] text-slate-400 block font-bold font-mono">CUSTOS EXTRAS MAPEADOS</span>
                      <span className="text-lg font-extrabold text-[#F8FAFC] block mt-1">{formatBRL(analysis.financialCalculations.additionalCostsEstimated)}</span>
                      <span className="text-[10px] text-zinc-400 mt-1 block leading-tight">{analysis.financialCalculations.customTaxDetails}</span>
                    </div>
                    <div className="bg-[#1C1C1E]/60 border border-[#2C2C2E] rounded-2xl p-4">
                      <span className="text-[10px] text-[#10B981] block font-bold font-mono">LANCE MÁXIMO SUGERIDO</span>
                      <span className="text-lg font-extrabold text-[#10B981] block mt-1">{formatBRL(analysis.financialCalculations.maxViableBid)}</span>
                      <span className="text-[10px] text-zinc-400 mt-1 block leading-tight">Valor teto sugerido para reter uma taxa de rentabilidade sadia nesse investimento.</span>
                    </div>
                  </div>

                  {/* Risks List */}
                  <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-400 font-mono mb-3 flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-amber-500" />
                    Condições Gravíssimas & Alertas Mapeados
                  </h4>
                  <div className="space-y-3 mb-6">
                    {analysis.legalRisks && analysis.legalRisks.length > 0 ? (
                      analysis.legalRisks.map((risk, index) => (
                        <div key={index} className="border border-[#2C2C2E] rounded-2xl p-4 flex items-start gap-3 bg-[#1C1C1E]/60">
                          <span className={`px-2 py-0.5 rounded-md text-[9px] font-black uppercase font-mono self-start-mt-0.5 shrink-0 ${
                            risk.severity === 'alto' 
                              ? 'bg-rose-500/15 text-rose-400 border border-rose-500/25' 
                              : risk.severity === 'medio' 
                              ? 'bg-amber-500/15 text-amber-400 border border-amber-500/25' 
                              : 'bg-indigo-500/15 text-indigo-400 border border-indigo-500/25'
                          }`}>
                            {risk.severity}
                          </span>
                          <div>
                            <p className="text-xs font-bold text-[#F8FAFC]">{risk.title}</p>
                            <p className="text-[11px] text-slate-300 leading-normal mt-0.5">{risk.description}</p>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="p-3 bg-[#1C1C1E]/60 border border-[#2C2C2E] text-center rounded-xl text-xs text-zinc-500">
                        Nenhum risco grave explícito foi localizado na descrição preliminar.
                      </div>
                    )}
                  </div>

                  {/* Recomendations Checklist */}
                  <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-400 font-mono mb-3 flex items-center gap-2">
                    <CheckSquare className="h-4 w-4 text-[#10B981]" />
                    Ações Críticas Obrigatórias Antes do Lance
                  </h4>
                  <ul className="space-y-2">
                    {analysis.recommendedActions.map((action, idx) => (
                      <li key={idx} className="flex gap-2.5 items-start text-xs text-slate-300 font-medium">
                        <span className="h-5 w-5 rounded-full bg-[#10B981]/10 border border-[#10B981]/20 text-[#10B981] text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5">{idx + 1}</span>
                        <span className="leading-snug">{action}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* IMERSIVE Q&A CHAT CONSOLE WITH Dr. Leilão */}
                <div id="ai-chat-console" className="bg-[#1C1C1E] border border-[#2C2C2E] rounded-3xl overflow-hidden shadow-3xs flex flex-col h-[522px]">
                  
                  {/* Chat Console brand header */}
                  <div className="bg-[#1C1C1E] p-4 border-b border-[#2C2C2E] flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="h-9 w-9 bg-[#10B981] text-black rounded-xl flex items-center justify-center shadow-md">
                        <ShieldCheck className="h-5 w-5" />
                      </div>
                      <div>
                        <span className="text-xs font-extrabold text-[#F8FAFC] block">Analista virtual (IA Especialista)</span>
                        <span className="text-[10px] font-bold text-[#10B981] flex items-center gap-1">
                          <span className="h-1.5 w-1.5 rounded-full bg-[#10B981] animate-pulse" />
                          Ambiente de assessoria disponível
                        </span>
                      </div>
                    </div>
                    <button 
                      onClick={() => setChatMessages([])} 
                      className="text-[10px] font-bold text-slate-300 hover:text-[#F8FAFC] hover:bg-[#2C2C2E] px-2.5 py-1.5 rounded bg-[#1C1C1E] border border-[#2C2C2E] cursor-pointer"
                    >
                      Reiniciar Chat
                    </button>
                  </div>

                  {/* Bubble scroll container */}
                  <div className="flex-1 p-4 overflow-y-auto space-y-4 font-sans text-xs bg-[#000000]">
                    {chatMessages.map((msg) => {
                      const isAi = msg.role === 'assistant';
                      return (
                        <div
                          key={msg.id}
                          className={`flex ${isAi ? 'justify-start' : 'justify-end'}`}
                        >
                          <div className={`max-w-[85%] rounded-2xl p-3.5 leading-relaxed whitespace-pre-wrap ${
                            isAi 
                              ? 'bg-[#1C1C1E] border border-[#2C2C2E]/80 text-[#F8FAFC] rounded-tl-none shadow-[0_1px_2px_rgba(0,0,0,0.01)]' 
                              : 'bg-[#10B981] text-black rounded-tr-none shadow-xs'
                          }`}>
                            <span className={`font-bold text-[8.5px] block mb-1 font-mono uppercase tracking-wider ${isAi ? 'text-slate-400' : 'text-emerald-900'}`}>
                              {isAi ? 'Analista virtual oficial' : 'Seu Questionamento'}
                            </span>
                            {msg.content}
                            <span className={`text-[8.5px] font-mono block text-right mt-1.5 ${isAi ? 'text-slate-400' : 'text-black/80'}`}>{msg.timestamp}</span>
                          </div>
                        </div>
                      );
                    })}
                    {sendingChat && (
                      <div className="flex justify-start">
                        <div className="bg-[#1C1C1E] border border-[#2C2C2E] rounded-2xl rounded-tl-none p-3.5 max-w-sm flex items-center gap-2.5 text-slate-300 text-xs shadow-3xs">
                          <RefreshCw className="h-3.5 w-3.5 animate-spin text-[#10B981]" />
                          <span className="animate-pulse">Analisando leis e precedentes criminais...</span>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Input form footer */}
                  <div className="p-3 bg-[#1C1C1E] border-t border-[#2C2C2E] flex gap-2">
                    <input
                      type="text"
                      value={typingMessage}
                      onChange={(e) => setTypingMessage(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && sendChatMessage()}
                      className="flex-1 bg-[#1C1C1E]/60 border border-[#2C2C2E] text-[#F8FAFC] text-xs px-3.5 py-2.5 rounded-xl focus:outline-none focus:border-[#10B981] focus:ring-1 focus:ring-[#10B981] font-sans"
                      placeholder="Ex: Como faço para emitir a guia representativa ITBI?"
                    />
                    <button
                      onClick={sendChatMessage}
                      disabled={sendingChat || !typingMessage.trim()}
                      className="px-4 bg-[#10B981] hover:bg-[#10B981]/90 disabled:bg-[#1C1C1E] text-black rounded-xl shadow-xs transition-all flex items-center justify-center cursor-pointer"
                    >
                      <Send className="h-4 w-4" />
                    </button>
                  </div>

                </div>

              </motion.div>
            ) : (
              <motion.div
                key="empty"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="bg-[#1C1C1E] rounded-3xl border border-[#2C2C2E] p-8 shadow-sm flex flex-col items-center justify-center min-h-[460px] text-center text-[#F8FAFC]"
              >
                <HelpCircle className="h-12 w-12 text-zinc-500 mb-3" />
                <h4 className="text-base font-bold text-slate-300 font-sans">Aguardando Entrada</h4>
                <p className="text-xs text-zinc-500 max-w-sm mt-1">Insira as especificações do imóvel ou veículo do lado esquerdo para obter o parecer automatizado do modelo Inteligente.</p>
              </motion.div>
            )}
          </AnimatePresence>

        </div>

      </div>

    </div>
  );
}
