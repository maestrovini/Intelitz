import React from 'react';
import { safeStorage } from '../utils/safeStorage';

interface Props {
  children: React.ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export default class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null
    };
  }

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('[Intelitz ErrorBoundary] Uncaught React Error:', error, errorInfo);
  }

  private handleReload = () => {
    window.location.reload();
  };

  private handleClearCacheAndReload = () => {
    try {
      safeStorage.clear();
      if (typeof window !== 'undefined') {
        window.localStorage?.clear?.();
        window.sessionStorage?.clear?.();
      }
    } catch (e) {
      console.warn('Erro ao limpar cache:', e);
    }
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div 
          className="min-h-screen w-full bg-[#0E0E0E] text-[#F8FAFC] flex flex-col items-center justify-center p-4 sm:p-6 text-center font-sans select-none"
          id="error-boundary-screen"
        >
          <div className="max-w-md w-full bg-[#1A1A1E] border border-emerald-500/30 rounded-2xl p-6 shadow-2xl space-y-4">
            {/* Logo / Header */}
            <div className="flex items-center justify-center gap-2">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 font-black text-xl">
                I
              </div>
              <span className="text-xl font-black tracking-tight text-white font-inter">
                Intelitz
              </span>
            </div>

            <div className="space-y-2">
              <h2 className="text-lg font-bold text-white">
                Ocorreu uma instabilidade no carregamento
              </h2>
              <p className="text-xs text-slate-400 leading-relaxed">
                Detectamos uma falha ao renderizar a interface no seu navegador. Você pode recarregar ou reiniciar a sessão.
              </p>
            </div>

            {/* Error detail */}
            {this.state.error && (
              <div className="bg-black/50 border border-white/10 rounded-lg p-2.5 text-left text-[11px] font-mono text-rose-300 max-h-24 overflow-y-auto break-all">
                {this.state.error.message || String(this.state.error)}
              </div>
            )}

            {/* Actions */}
            <div className="flex flex-col gap-2.5 pt-2">
              <button
                type="button"
                onClick={this.handleReload}
                className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-lg transition-colors cursor-pointer"
                id="btn-error-reload"
              >
                Recarregar Aplicativo
              </button>

              <button
                type="button"
                onClick={this.handleClearCacheAndReload}
                className="w-full py-2.5 px-4 bg-white/5 hover:bg-white/10 text-slate-300 font-semibold text-xs rounded-xl border border-white/10 transition-colors cursor-pointer"
                id="btn-error-clear-cache"
              >
                Limpar Cache Local e Recarregar
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
