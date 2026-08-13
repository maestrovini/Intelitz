import React, { useState, useEffect } from 'react';
import { 
  Globe, Save, RotateCcw, Check, Copy, Link as LinkIcon, 
  ShieldCheck, ExternalLink, HardDrive, Sparkles, AlertCircle, RefreshCw,
  Key, Trash2, Database, Sliders, Server, Info
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { AppUser } from '../types';
import { 
  getCustomDomain, 
  setCustomDomain, 
  resetCustomDomain, 
  formatInternalUrl, 
  sanitizeDomain,
  DEFAULT_DOMAIN,
  DOMAIN_STORAGE_KEY
} from '../utils/domain';
import { safeStorage } from '../utils/safeStorage';

interface SettingsManagerProps {
  currentUser: AppUser | null;
  onSwitchToTab?: (tabId: string) => void;
  onOpenSync?: () => void;
  onResetAllData?: () => void;
}

export default function SettingsManager({
  currentUser,
  onSwitchToTab,
  onOpenSync,
  onResetAllData
}: SettingsManagerProps) {
  const [domainInput, setDomainInput] = useState<string>(() => getCustomDomain());
  const [activeDomain, setActiveDomain] = useState<string>(() => getCustomDomain());
  const [protocol, setProtocol] = useState<'https' | 'http'>('https');
  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'info' | 'error' } | null>(null);
  
  // Interactive link test box state
  const [testPathInput, setTestPathInput] = useState<string>('/imoveis/lote-porto-alegre-402');
  const [convertedTestUrl, setConvertedTestUrl] = useState<string>('');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // Sync state when domain changes
  useEffect(() => {
    const handleDomainChange = (e: any) => {
      const newDom = e.detail || getCustomDomain();
      setActiveDomain(newDom);
      setDomainInput(newDom);
    };
    window.addEventListener('domain-changed', handleDomainChange);
    return () => window.removeEventListener('domain-changed', handleDomainChange);
  }, []);

  // Update converted test URL whenever activeDomain, testPathInput or protocol changes
  useEffect(() => {
    if (!testPathInput) {
      setConvertedTestUrl(`${protocol}://${activeDomain}`);
    } else {
      setConvertedTestUrl(formatInternalUrl(testPathInput, protocol));
    }
  }, [testPathInput, activeDomain, protocol]);

  const showToast = (text: string, type: 'success' | 'info' | 'error' = 'success') => {
    setToastMessage({ text, type });
    setTimeout(() => {
      setToastMessage(null);
    }, 3500);
  };

  const handleSaveDomain = (e: React.FormEvent) => {
    e.preventDefault();
    if (!domainInput.trim()) {
      showToast('Por favor, informe um domínio válido.', 'error');
      return;
    }
    const saved = setCustomDomain(domainInput);
    setActiveDomain(saved);
    setDomainInput(saved);
    showToast(`Domínio "${saved}" salvo com sucesso no LocalStorage! Todos os links internos foram atualizados.`, 'success');
  };

  const handleResetDomain = () => {
    const resetDom = resetCustomDomain();
    setActiveDomain(resetDom);
    setDomainInput(resetDom);
    showToast(`Domínio restaurado para o padrão "${resetDom}".`, 'info');
  };

  const handleCopy = (text: string, key: string) => {
    try {
      navigator.clipboard.writeText(text);
      setCopiedKey(key);
      showToast('Link copiado para a área de transferência!', 'success');
      setTimeout(() => setCopiedKey(null), 2000);
    } catch (err) {
      showToast('Erro ao copiar link.', 'error');
    }
  };

  // Sample internal links
  const sampleLinks = [
    { label: 'Página Inicial & Busca', path: '/imoveis' },
    { label: 'Detalhamento do Lote', path: '/imovel/lote-402?ref=imobhall' },
    { label: 'Consultor de Veículos', path: '/veiculos' },
    { label: 'Painel do Investidor', path: '/meu-painel' },
    { label: 'Endpoint da API', path: '/api/v1/imoveis' },
  ];

  return (
    <div className="space-y-6 md:space-y-8 pb-12 font-sans" id="settings-manager-container">
      {/* Toast Floating Notification */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            className={`fixed top-5 right-5 z-50 px-5 py-3.5 rounded-2xl border shadow-2xl flex items-center gap-3 backdrop-blur-md text-sm font-extrabold ${
              toastMessage.type === 'success' 
                ? 'bg-emerald-950/90 text-emerald-200 border-emerald-500/50'
                : toastMessage.type === 'error'
                ? 'bg-rose-950/90 text-rose-200 border-rose-500/50'
                : 'bg-indigo-950/90 text-indigo-200 border-indigo-500/50'
            }`}
          >
            {toastMessage.type === 'success' && <Check className="h-5 w-5 text-emerald-400 shrink-0" />}
            {toastMessage.type === 'error' && <AlertCircle className="h-5 w-5 text-rose-400 shrink-0" />}
            {toastMessage.type === 'info' && <Info className="h-5 w-5 text-indigo-400 shrink-0" />}
            <span>{toastMessage.text}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Header Banner */}
      <div className="bg-[#1C1C1E] border border-[#2C2C2E] rounded-3xl p-6 md:p-8 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 p-8 opacity-5 pointer-events-none">
          <Globe className="h-64 w-64 text-emerald-500" />
        </div>

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-black uppercase tracking-wider">
              <Sliders className="h-3.5 w-3.5" />
              <span>Configurações do Sistema</span>
            </div>
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-black text-white tracking-tight">
              Gerenciamento de Domínio & Links
            </h1>
            <p className="text-sm md:text-base text-slate-300 font-medium leading-relaxed">
              Defina o domínio personalizado (ex: <strong className="text-emerald-400 font-semibold">imobhall.com.br</strong>) para ser armazenado no LocalStorage. Todos os links internos e URLs geradas pelo sistema utilizarão este endereço.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 shrink-0">
            <div className="bg-[#2C2C2E]/60 border border-[#2C2C2E] rounded-2xl p-4 text-center">
              <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest block font-mono">Domínio Ativo</span>
              <span className="text-base md:text-lg font-black text-emerald-400 font-mono block mt-0.5">
                {activeDomain}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 md:gap-8">
        {/* Left Column: Domain Setup Form & Protocol Options */}
        <div className="lg:col-span-7 space-y-6">
          {/* CARD 1: DOMAIN CONFIGURATION FORM */}
          <div className="bg-[#1C1C1E] border border-[#2C2C2E] rounded-3xl p-6 md:p-8 shadow-xl space-y-6">
            <div className="flex items-center gap-3 border-b border-[#2C2C2E] pb-4">
              <div className="p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
                <Globe className="h-6 w-6" />
              </div>
              <div>
                <h2 className="text-lg md:text-xl font-black text-white">Domínio Principal da Aplicação</h2>
                <p className="text-xs md:text-sm text-slate-400 font-medium">Armazenado no LocalStorage sob a chave <code className="text-emerald-400 font-mono">{DOMAIN_STORAGE_KEY}</code></p>
              </div>
            </div>

            <form onSubmit={handleSaveDomain} className="space-y-5">
              <div>
                <label className="text-xs md:text-sm font-extrabold text-slate-200 block mb-2 uppercase tracking-wide">
                  ENDEREÇO DO DOMÍNIO OU SUBDOMÍNIO *
                </label>
                <div className="relative flex items-center">
                  <span className="absolute left-4 text-slate-500 font-mono text-sm select-none">
                    {protocol}://
                  </span>
                  <input
                    type="text"
                    value={domainInput}
                    onChange={(e) => setDomainInput(e.target.value)}
                    placeholder="ex: imobhall.com.br ou www.imobhall.com.br"
                    className="w-full bg-[#2C2C2E]/60 text-base md:text-lg font-bold border border-[#2C2C2E] rounded-2xl pl-24 pr-4 py-3.5 md:py-4 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono transition-all placeholder:text-zinc-600"
                    required
                    id="input-custom-domain"
                  />
                </div>
                <p className="text-xs text-slate-400 font-medium mt-2 flex items-center gap-1.5">
                  <Info className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
                  Pode ser informado sem protocolo (ex: <span className="text-slate-200 font-mono font-bold">imobhall.com.br</span>). O sistema formata automaticamente.
                </p>
              </div>

              {/* Protocol radio buttons */}
              <div>
                <label className="text-xs md:text-sm font-extrabold text-slate-200 block mb-2 uppercase tracking-wide">
                  PROTOCOLO PADRÃO
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setProtocol('https')}
                    className={`py-3 px-4 rounded-xl text-xs md:text-sm font-extrabold transition-all cursor-pointer flex items-center justify-center gap-2 border ${
                      protocol === 'https'
                        ? 'bg-emerald-600/20 border-emerald-500 text-emerald-400 shadow-md'
                        : 'bg-[#2C2C2E]/40 border-[#2C2C2E] text-slate-400 hover:bg-[#2C2C2E] hover:text-white'
                    }`}
                  >
                    <ShieldCheck className="h-4 w-4" />
                    <span>HTTPS (Seguro)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setProtocol('http')}
                    className={`py-3 px-4 rounded-xl text-xs md:text-sm font-extrabold transition-all cursor-pointer flex items-center justify-center gap-2 border ${
                      protocol === 'http'
                        ? 'bg-emerald-600/20 border-emerald-500 text-emerald-400 shadow-md'
                        : 'bg-[#2C2C2E]/40 border-[#2C2C2E] text-slate-400 hover:bg-[#2C2C2E] hover:text-white'
                    }`}
                  >
                    <Globe className="h-4 w-4" />
                    <span>HTTP (Desenvolvimento)</span>
                  </button>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-3 pt-2">
                <button
                  type="submit"
                  className="flex-1 py-4 px-6 bg-emerald-600 hover:bg-emerald-700 active:scale-98 text-white rounded-2xl text-sm md:text-base font-black shadow-lg shadow-emerald-900/30 transition-all cursor-pointer flex items-center justify-center gap-2"
                  id="btn-save-domain"
                >
                  <Save className="h-5 w-5 text-emerald-200" />
                  <span>Salvar Domínio no LocalStorage</span>
                </button>

                <button
                  type="button"
                  onClick={handleResetDomain}
                  className="py-4 px-5 bg-[#2C2C2E] hover:bg-zinc-800 active:scale-98 text-slate-300 border border-[#2C2C2E] rounded-2xl text-xs md:text-sm font-bold transition-all cursor-pointer flex items-center justify-center gap-2"
                  title="Restaurar para imobhall.com.br"
                  id="btn-reset-domain"
                >
                  <RotateCcw className="h-4 w-4 text-slate-400" />
                  <span>Restaurar Padrão</span>
                </button>
              </div>
            </form>
          </div>

          {/* CARD 2: INTERACTIVE URL CONVERTER & TESTER */}
          <div className="bg-[#1C1C1E] border border-[#2C2C2E] rounded-3xl p-6 md:p-8 shadow-xl space-y-5">
            <div className="flex items-center gap-3 border-b border-[#2C2C2E] pb-4">
              <div className="p-3 rounded-2xl bg-indigo-500/10 border border-indigo-500/30 text-indigo-400">
                <LinkIcon className="h-6 w-6" />
              </div>
              <div>
                <h2 className="text-lg md:text-xl font-black text-white">Simulador de Conversão de Links</h2>
                <p className="text-xs md:text-sm text-slate-400 font-medium">Teste em tempo real como o sistema converte qualquer rota ou link antigo no endereço do domínio salvo.</p>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-xs font-extrabold text-slate-300 block mb-1.5 uppercase tracking-wide">
                  DIGITE UMA ROTA OU LINK INTERNO PARA TESTAR
                </label>
                <input
                  type="text"
                  value={testPathInput}
                  onChange={(e) => setTestPathInput(e.target.value)}
                  placeholder="Ex: /imoveis ou https://usuario.github.io/imovel/123"
                  className="w-full bg-[#2C2C2E]/60 text-sm font-mono border border-[#2C2C2E] rounded-xl p-3 text-white focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-all"
                  id="input-test-link"
                />
              </div>

              <div className="p-4 bg-[#000000] rounded-2xl border border-[#2C2C2E] space-y-2">
                <span className="text-[10px] font-extrabold text-emerald-400 uppercase tracking-widest block font-mono">
                  URL GERADA COM O DOMÍNIO SALVO:
                </span>
                <div className="flex items-center justify-between gap-3 overflow-hidden">
                  <span className="text-sm md:text-base font-black text-white font-mono truncate select-all">
                    {convertedTestUrl}
                  </span>
                  <button
                    onClick={() => handleCopy(convertedTestUrl, 'test-url')}
                    className="p-2 rounded-xl bg-emerald-600/20 hover:bg-emerald-600/40 text-emerald-400 border border-emerald-500/30 transition cursor-pointer shrink-0"
                    title="Copiar URL gerada"
                    id="btn-copy-test-url"
                  >
                    {copiedKey === 'test-url' ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Generated Samples & System Storage Details */}
        <div className="lg:col-span-5 space-y-6">
          {/* CARD 3: SAMPLE GENERATED INTERNAL LINKS */}
          <div className="bg-[#1C1C1E] border border-[#2C2C2E] rounded-3xl p-6 md:p-8 shadow-xl space-y-5">
            <div className="flex items-center gap-3 border-b border-[#2C2C2E] pb-4">
              <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-400">
                <ExternalLink className="h-6 w-6" />
              </div>
              <div>
                <h2 className="text-lg md:text-xl font-black text-white">Exemplos de Links Internos</h2>
                <p className="text-xs md:text-sm text-slate-400 font-medium">Links gerados dinamicamente no sistema</p>
              </div>
            </div>

            <div className="space-y-3">
              {sampleLinks.map((item, idx) => {
                const fullUrl = formatInternalUrl(item.path, protocol);
                const key = `sample-${idx}`;
                return (
                  <div 
                    key={idx}
                    className="p-3.5 bg-[#2C2C2E]/40 border border-[#2C2C2E] rounded-2xl space-y-1 hover:border-emerald-500/40 transition-colors"
                  >
                    <div className="flex items-center justify-between text-xs font-bold text-slate-300">
                      <span>{item.label}</span>
                      <button
                        onClick={() => handleCopy(fullUrl, key)}
                        className="text-emerald-400 hover:text-emerald-300 text-[11px] font-extrabold flex items-center gap-1 cursor-pointer"
                        id={`btn-copy-sample-${idx}`}
                      >
                        {copiedKey === key ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                        <span>{copiedKey === key ? 'Copiado!' : 'Copiar'}</span>
                      </button>
                    </div>
                    <span className="text-xs font-mono text-slate-400 block truncate" title={fullUrl}>
                      {fullUrl}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* CARD 4: STORAGE & LOCAL PERSISTENCE DETAILS */}
          <div className="bg-[#1C1C1E] border border-[#2C2C2E] rounded-3xl p-6 md:p-8 shadow-xl space-y-5">
            <div className="flex items-center gap-3 border-b border-[#2C2C2E] pb-4">
              <div className="p-3 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
                <HardDrive className="h-6 w-6" />
              </div>
              <div>
                <h2 className="text-lg md:text-xl font-black text-white">Armazenamento Local</h2>
                <p className="text-xs md:text-sm text-slate-400 font-medium">Informações de persistência no navegador</p>
              </div>
            </div>

            <div className="space-y-3 text-xs md:text-sm">
              <div className="flex items-center justify-between py-2 border-b border-[#2C2C2E]/60 text-slate-300">
                <span className="font-medium">Chave de Domínio:</span>
                <span className="font-mono font-bold text-emerald-400 bg-emerald-950/40 px-2 py-0.5 rounded border border-emerald-500/30">
                  {DOMAIN_STORAGE_KEY}
                </span>
              </div>

              <div className="flex items-center justify-between py-2 border-b border-[#2C2C2E]/60 text-slate-300">
                <span className="font-medium">Domínio Padrão do Sistema:</span>
                <span className="font-mono font-bold text-white">
                  {DEFAULT_DOMAIN}
                </span>
              </div>

              <div className="flex items-center justify-between py-2 border-b border-[#2C2C2E]/60 text-slate-300">
                <span className="font-medium">Status do LocalStorage:</span>
                <span className="font-extrabold text-emerald-400 flex items-center gap-1">
                  <Check className="h-4 w-4" /> Ativo & Persistido
                </span>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="pt-2 space-y-2">
              <button
                onClick={() => {
                  const event = new CustomEvent('open-api-key-modal');
                  window.dispatchEvent(event);
                }}
                className="w-full py-3 px-4 bg-[#2C2C2E] hover:bg-zinc-800 text-slate-200 border border-[#2C2C2E] rounded-xl text-xs font-extrabold transition cursor-pointer flex items-center justify-center gap-2"
                id="btn-settings-open-api-key"
              >
                <Key className="h-4 w-4 text-emerald-400" />
                <span>Configurar Chave da API Gemini</span>
              </button>

              {onResetAllData && (
                <button
                  onClick={() => {
                    if (confirm('Tem certeza que deseja resetar todos os dados locais do sistema?')) {
                      onResetAllData();
                      showToast('Dados do sistema resetados com sucesso.', 'info');
                    }
                  }}
                  className="w-full py-3 px-4 bg-rose-950/30 hover:bg-rose-900/40 text-rose-300 border border-rose-500/30 rounded-xl text-xs font-extrabold transition cursor-pointer flex items-center justify-center gap-2"
                  id="btn-settings-reset-all-data"
                >
                  <Trash2 className="h-4 w-4 text-rose-400" />
                  <span>Resetar Dados e Limpar Cache Local</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
