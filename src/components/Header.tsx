import { 
  Gavel, Search, Calculator, ShieldCheck, Heart, Bell, Globe, 
  Database, Trash2, Menu, X, ChevronLeft, ChevronRight, Building, Sparkles, Plus, Filter,
  Sun, Moon, Users, LogOut, LayoutGrid, Key
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { AppUser } from '../types';

interface HeaderProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  savedCount: number;
  alertsCount: number;
  onOpenAlerts: () => void;
  firebaseSynced?: boolean;
  onResetAllData?: () => void;
  isSidebarCollapsed: boolean;
  setIsSidebarCollapsed: (collapsed: boolean) => void;
  isMobileMenuOpen: boolean;
  setIsMobileMenuOpen: (open: boolean) => void;
  onOpenSync?: () => void;
  theme: 'light' | 'dark';
  onToggleTheme: () => void;
  currentUser: AppUser | null;
  onLogout?: () => void;
}

export default function Header({ 
  activeTab, 
  setActiveTab, 
  savedCount, 
  alertsCount, 
  onOpenAlerts, 
  firebaseSynced = false,
  onResetAllData,
  isSidebarCollapsed,
  setIsSidebarCollapsed,
  isMobileMenuOpen,
  setIsMobileMenuOpen,
  onOpenSync,
  theme,
  onToggleTheme,
  currentUser,
  onLogout
}: HeaderProps) {
  const menuItems: { id: string; label: string; icon: any; badge?: number }[] = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutGrid },
    { id: 'imoveis', label: 'Consultor Imóveis', icon: Building },
    { id: 'lotes', label: 'Consultor Veículos', icon: Gavel },
    { id: 'portals', label: 'Portais/Leiloeiros', icon: Globe },
  ];

  if (currentUser && currentUser.role === 'admin') {
    menuItems.push({ id: 'users', label: 'Gestão de Usuários', icon: Users });
  }

  const currentItem = menuItems.find(item => item.id === activeTab) || menuItems[0];
  const CurrentIcon = currentItem.icon;

  return (
    <>
      {/* --- DESKTOP COLLAPSIBLE PERSISTENT LATERAL SIDEBAR --- */}
      <aside 
        id="desktop-sidebar"
        className={`hidden md:flex flex-col fixed inset-y-0 left-0 z-40 bg-white dark:bg-zinc-900 border-r border-zinc-200 dark:border-zinc-800 transition-all duration-300 ease-in-out select-none ${
          isSidebarCollapsed ? 'w-20' : 'w-64'
        }`}
      >
        {/* Sidebar Active Tab Title Header */}
        <div className="h-16 flex items-center justify-between px-4 border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50 shrink-0">
          {isSidebarCollapsed ? (
            <div className="w-full flex justify-center">
              <button
                onClick={() => setIsSidebarCollapsed(false)}
                className="p-2 text-zinc-500 dark:text-zinc-400 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-zinc-100 dark:hover:bg-zinc-850 rounded-xl transition cursor-pointer flex items-center justify-center border border-zinc-200 dark:border-zinc-800 shadow-3xs"
                title="Expandir Menu (Clique para abrir)"
                id="btn-sidebar-hamburger-expand"
              >
                <Menu className="h-4.5 w-4.5" />
              </button>
            </div>
          ) : (
            <>
              <div 
                className="flex items-center gap-2.5 cursor-pointer min-w-0"
                onClick={() => setActiveTab('search')}
              >
                <div className="bg-emerald-600 text-white p-2 rounded-xl shadow-md shadow-emerald-600/10 shrink-0 flex items-center justify-center">
                  <CurrentIcon className="h-5 w-5" />
                </div>
                <motion.div 
                  key={activeTab}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0 }}
                  className="overflow-hidden whitespace-nowrap min-w-0 flex-1"
                >
                  <span className="font-sans font-extrabold text-sm tracking-tight text-zinc-850 dark:text-zinc-100 flex items-center gap-0.5 truncate">
                    {currentItem.label}
                  </span>
                  <p className="text-[9px] font-mono font-bold text-emerald-600 tracking-wider uppercase leading-none mt-0.5">Aba Ativa</p>
                </motion.div>
              </div>
 
              {/* Quick Collapse Arrow Button */}
              <button
                onClick={() => setIsSidebarCollapsed(true)}
                className="p-1.5 rounded-lg border border-zinc-200 dark:border-zinc-700 text-zinc-500 dark:text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 cursor-pointer self-center shrink-0"
                title="Recolher Menu"
                id="btn-collapse-sidebar"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
            </>
          )}
        </div>
 
        {/* Sidebar Navigation Links */}
        <nav className="flex-1 px-3 py-4 space-y-1.5 overflow-y-auto bg-white dark:bg-zinc-900">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                id={`sidebar-tab-${item.id}`}
                onClick={() => setActiveTab(item.id)}
                className={`relative w-full flex items-center gap-3.5 px-3 py-2.5 rounded-xl text-sm transition-all duration-200 cursor-pointer text-left group ${
                  isActive
                    ? 'text-emerald-600 dark:text-emerald-400 bg-emerald-50/70 dark:bg-emerald-950/30 border-l-[3px] border-emerald-500 font-bold'
                    : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 font-medium'
                }`}
                title={isSidebarCollapsed ? item.label : undefined}
              >
                <Icon className={`h-4.5 w-4.5 shrink-0 transition-colors ${isActive ? 'text-emerald-600' : 'text-zinc-400 dark:text-zinc-500 group-hover:text-zinc-600 dark:group-hover:text-zinc-350'}`} />
                
                {!isSidebarCollapsed ? (
                  <span className="truncate block flex-1">{item.label}</span>
                ) : (
                  // Small bubble tooltip for collapsed sidebar links
                  <span className="absolute left-16 bg-zinc-800 text-white text-[10px] font-bold px-2.5 py-1.5 rounded-lg shadow-xl opacity-0 group-hover:opacity-100 transition-opacity duration-150 pointer-events-none whitespace-nowrap z-50">
                    {item.label}
                  </span>
                )}
 
                {item.badge !== undefined && (
                  <span className={`flex h-4.5 min-w-4.5 items-center justify-center rounded-full bg-emerald-600 text-[10px] font-black text-white px-1 ${
                    isSidebarCollapsed ? 'absolute top-1 right-2 scale-90' : ''
                  }`}>
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Sidebar Foot Indicators */}
        <div className="p-3 border-t border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50 space-y-2 shrink-0">
          <div
            className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-zinc-950 border border-emerald-500/30 text-emerald-400 rounded-xl font-bold text-[10px] uppercase tracking-wider font-mono shadow-sm shadow-emerald-500/10 shrink-0"
            title="Premium Dark Mode Ativo"
            id="premium-dark-mode-badge"
          >
            <Sparkles className="h-3.5 w-3.5 text-emerald-400 animate-pulse shrink-0" />
            {!isSidebarCollapsed && <span>Premium Dark</span>}
          </div>

          {isSidebarCollapsed && (
            <button
              onClick={() => setIsSidebarCollapsed(false)}
              className="w-full flex items-center justify-center p-2 rounded-xl hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-500 cursor-pointer transition border border-dashed border-zinc-200 dark:border-zinc-800 mt-1"
              title="Expandir Menu"
              id="btn-expand-sidebar"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          )}
        </div>
      </aside>
 
      {/* --- MOBILE COLLAPSIBLE DRAWER & FLOATING TOPBAR --- */}
      {/* Responsive mobile header frame */}
      <header 
        id="mobile-header"
        className="md:hidden sticky top-0 z-40 bg-white dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800 shadow-sm flex h-14 items-center justify-between px-4"
      >
        <button
          onClick={() => setIsMobileMenuOpen(true)}
          className="p-2 -ml-1 text-zinc-500 dark:text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-xl cursor-pointer transition flex items-center justify-center"
          title="Abrir Menu Lateral"
          id="btn-mobile-hamburger"
        >
          <Menu className="h-5 w-5" />
        </button>

        {/* Active Tab Title instead of Intelitz */}
        <div className="flex items-center gap-2 min-w-0 px-2 flex-1 justify-start">
          <span className="font-sans font-extrabold text-sm tracking-tight text-zinc-850 dark:text-zinc-100 truncate">
            {currentItem.label}
          </span>
        </div>
 
        {/* Alert Bell Trigger & Sync Status mini block */}
        <div className="flex items-center gap-2">
          {activeTab === 'imoveis' && (
            <>
              {/* Mobile Search Button */}
              <button
                onClick={() => {
                  window.dispatchEvent(new CustomEvent('toggle-imovel-search'));
                }}
                className="h-9 w-9 p-2 rounded-xl border border-zinc-200 bg-white hover:bg-zinc-50 text-zinc-550 hover:text-emerald-600 transition flex items-center justify-center cursor-pointer shadow-3xs"
                title="Pesquisar Imóveis"
                id="mobile-btn-toggle-search"
              >
                <Search className="h-4.5 w-4.5" />
              </button>

              {/* Mobile Filter Button */}
              <button
                onClick={() => {
                  window.dispatchEvent(new CustomEvent('toggle-imovel-filters'));
                }}
                className="h-9 w-9 p-2 rounded-xl border border-zinc-200 bg-white hover:bg-zinc-50 text-zinc-550 hover:text-emerald-600 transition flex items-center justify-center cursor-pointer shadow-3xs"
                title="Filtrar por Categoria"
                id="mobile-btn-toggle-filters"
              >
                <Filter className="h-4.5 w-4.5" />
              </button>

              {/* Mobile Novo Imóvel Button */}
              {currentUser?.role === 'admin' && (
                <button
                  onClick={() => {
                    const event = new CustomEvent('open-analyze-imovel-modal');
                    window.dispatchEvent(event);
                  }}
                  className="h-9 w-9 p-2 rounded-xl border border-emerald-500 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white transition flex items-center justify-center cursor-pointer shadow-3xs"
                  title="Novo Imóvel"
                  id="mobile-btn-novo-imovel"
                >
                  <Sparkles className="h-4.5 w-4.5 text-emerald-100 animate-pulse" />
                </button>
              )}
            </>
          )}

          {activeTab === 'portals' && currentUser?.role === 'admin' && (
            <button
              onClick={() => {
                const event = new CustomEvent('open-new-portal-modal');
                window.dispatchEvent(event);
              }}
              className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-lg cursor-pointer transition flex items-center justify-center border border-emerald-100 bg-emerald-50 active:scale-95"
              title="Novo Portal"
              id="mobile-btn-novo-portal"
            >
              <Plus className="h-4 w-4 text-emerald-600" />
            </button>
          )}

          {onLogout && activeTab === 'dashboard' && (
            <button
              onClick={onLogout}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-500/10 text-rose-500 hover:bg-rose-500/20 rounded-xl text-xs font-black transition cursor-pointer"
              title="Sair da Conta"
              id="mobile-header-logout"
            >
              <LogOut className="h-3.5 w-3.5" />
              Sair
            </button>
          )}
        </div>
      </header>
 
      {/* Slide-over Drawer Portal on Mobile */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <div className="md:hidden fixed inset-0 z-50 overflow-hidden">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMobileMenuOpen(false)}
              className="fixed inset-0 bg-zinc-950/40 backdrop-blur-xs transition-opacity cursor-pointer"
              id="mobile-drawer-backdrop"
            />
 
            {/* Mobile Sidebar Frame container */}
            <div className="fixed inset-y-0 left-0 max-w-xs w-full flex">
              <motion.div
                initial={{ x: '-100%' }}
                animate={{ x: 0 }}
                exit={{ x: '-100%' }}
                transition={{ type: 'spring', damping: 25, stiffness: 220 }}
                className="relative flex-1 flex flex-col max-w-xs w-full bg-white dark:bg-zinc-900 shadow-2xl focus:outline-none border-r border-zinc-200 dark:border-zinc-800"
                id="mobile-drawer-body"
              >
                {/* Header item with close action */}
                <div className="h-14 flex items-center justify-between px-4 border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50">
                  <div className="flex items-center gap-2 min-w-0 pr-2">
                    <div className="bg-emerald-600 text-white p-1.5 rounded-lg shrink-0">
                      <CurrentIcon className="h-4.5 w-4.5" />
                    </div>
                    <div className="min-w-0">
                      <span className="font-sans font-extrabold text-xs tracking-tight text-zinc-850 dark:text-zinc-100 block truncate">
                        {currentItem.label}
                      </span>
                    </div>
                  </div>
 
                  <button
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="p-1.5 rounded-lg text-zinc-500 dark:text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 cursor-pointer"
                    id="btn-close-mobile-drawer"
                  >
                    <X className="h-4.5 w-4.5" />
                  </button>
                </div>
 
                {/* Vertical menu content listing in light Drawer */}
                <nav className="flex-1 px-3 py-4 space-y-1.5 overflow-y-auto bg-white dark:bg-zinc-900">
                  {menuItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = activeTab === item.id;
                    return (
                      <button
                        key={item.id}
                        onClick={() => {
                          setActiveTab(item.id);
                          setTimeout(() => setIsMobileMenuOpen(false), 90);
                        }}
                        className={`w-full flex items-center gap-3.5 px-3 py-3 rounded-xl text-xs transition-all duration-155 cursor-pointer ${
                          isActive
                            ? 'text-emerald-600 dark:text-emerald-400 font-bold bg-emerald-50/70 dark:bg-emerald-950/30 border-l-[3px] border-emerald-500'
                            : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 font-semibold'
                        }`}
                        id={`drawer-tab-${item.id}`}
                      >
                        <Icon className={`h-4.5 w-4.5 shrink-0 ${isActive ? 'text-emerald-600' : 'text-zinc-400 dark:text-zinc-500'}`} />
                        <span className="truncate block flex-grow text-left">{item.label}</span>
                        
                        {item.badge !== undefined && (
                          <span className="flex h-4.5 min-w-4.5 items-center justify-center rounded-full bg-emerald-600 text-[9px] font-black text-white px-1 shadow-xs">
                            {item.badge}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </nav>
              </motion.div>
            </div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
