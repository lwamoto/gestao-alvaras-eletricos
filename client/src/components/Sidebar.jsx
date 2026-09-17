import { useEffect, useState } from 'react';
import { FilePlus, Search, Menu, PanelLeftClose, PanelLeftOpen, LogOut, Users, Building2, LayoutDashboard, Sun, Moon } from 'lucide-react';
import BrandMark from './BrandMark.jsx';
import NotificacoesSino from './NotificacoesSino.jsx';
import { useTheme } from '../contexts/ThemeContext.jsx';

const NAV_ITEMS_COPEL = [
  { key: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { key: 'cadastrar', label: 'Cadastrar Alvará', icon: FilePlus },
  { key: 'pesquisar', label: 'Pesquisar Alvará', icon: Search },
  { key: 'usuarios', label: 'Usuários', icon: Users },
  { key: 'empreiteiras', label: 'Empreiteiras', icon: Building2 },
];

const NAV_ITEMS_EMPREITEIRA = [
  { key: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { key: 'pesquisar', label: 'Meus Alvarás', icon: Search },
];

export default function Sidebar({ view, onNavigate, collapsed, onToggleCollapse, usuario, onLogout, onAbrirProjeto }) {
  const { tema, alternarTema } = useTheme();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [drawerMounted, setDrawerMounted] = useState(false);
  const [drawerEntered, setDrawerEntered] = useState(false);
  const navItems = usuario?.tipo === 'EMPREITEIRA' ? NAV_ITEMS_EMPREITEIRA : NAV_ITEMS_COPEL;

  // Mount first, then flip to "entered" a frame later so the transition has
  // a starting value to animate from (React can't transition a first paint).
  useEffect(() => {
    if (mobileOpen) {
      setDrawerMounted(true);
      const raf = requestAnimationFrame(() => setDrawerEntered(true));
      return () => cancelAnimationFrame(raf);
    }
    setDrawerEntered(false);
    const timer = setTimeout(() => setDrawerMounted(false), 200);
    return () => clearTimeout(timer);
  }, [mobileOpen]);

  useEffect(() => {
    if (!mobileOpen) return;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, [mobileOpen]);

  const navigate = (key) => {
    onNavigate(key);
    setMobileOpen(false);
  };

  function renderNavContent(recolhida) {
    return (
      <>
        <div
          className={`pt-6 pb-5 ${
            recolhida ? 'px-3 flex flex-col items-center gap-3' : 'px-5 flex items-center justify-between gap-2'
          }`}
        >
          <BrandMark collapsed={recolhida} />
          <div className={`flex items-center ${recolhida ? 'flex-col gap-2' : 'gap-1 shrink-0'}`}>
            {usuario?.tipo === 'EMPREITEIRA' && <NotificacoesSino onAbrirProjeto={onAbrirProjeto} />}
            <button
              onClick={alternarTema}
              aria-label={tema === 'claro' ? 'Ativar tema escuro' : 'Ativar tema claro'}
              title={tema === 'claro' ? 'Tema escuro' : 'Tema claro'}
              className="p-1.5 rounded text-copel-cinza-medio hover:text-copel-grafite hover:bg-copel-cinza active:scale-90 transition-all cursor-pointer shrink-0"
            >
              {tema === 'claro' ? <Moon size={16} /> : <Sun size={16} />}
            </button>
            {onToggleCollapse && (
              <button
                onClick={onToggleCollapse}
                aria-label={recolhida ? 'Expandir menu' : 'Recolher menu'}
                title={recolhida ? 'Expandir menu' : 'Recolher menu'}
                className="p-1.5 rounded text-copel-cinza-medio hover:text-copel-grafite hover:bg-copel-cinza active:scale-90 transition-all cursor-pointer shrink-0"
              >
                {recolhida ? <PanelLeftOpen size={16} /> : <PanelLeftClose size={16} />}
              </button>
            )}
          </div>
        </div>

        <nav className="flex-1 px-3 pb-4">
          <ul className="space-y-0.5">
            {navItems.map(({ key, label, icon: Icon }) => {
              const ativo = view === key;
              return (
                <li key={key}>
                  <button
                    onClick={() => navigate(key)}
                    title={label}
                    aria-label={label}
                    className={`w-full flex items-center py-2.5 text-sm font-medium border-l-2 transition-colors active:scale-[0.98] cursor-pointer ${
                      recolhida ? 'justify-center gap-0 px-0' : 'gap-3 pl-3 pr-4'
                    } ${
                      ativo
                        ? 'bg-copel-laranja/10 border-copel-laranja text-copel-laranja'
                        : 'border-transparent text-copel-cinza-medio hover:bg-copel-cinza hover:text-copel-grafite'
                    }`}
                  >
                    <Icon size={17} className={`shrink-0 ${ativo ? 'text-copel-laranja' : 'text-copel-cinza-medio'}`} />
                    <span
                      className={`whitespace-nowrap overflow-hidden transition-all duration-150 ${
                        recolhida ? 'opacity-0 max-w-0' : 'opacity-100 max-w-[160px]'
                      }`}
                    >
                      {label}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        </nav>

        <div className={`border-t border-gray-100 dark:border-white/10 ${recolhida ? 'px-3 py-3 flex flex-col items-center gap-2' : 'px-5 py-4'}`}>
          {!recolhida && (
            <>
              <p className="text-xs font-medium text-copel-grafite truncate">{usuario?.nome}</p>
              <p className="text-[10px] text-copel-cinza-medio mb-2">
                {usuario?.tipo === 'EMPREITEIRA' ? usuario.empreiteira : 'COPEL Distribuição'}
              </p>
            </>
          )}
          <button
            onClick={onLogout}
            title="Sair"
            aria-label="Sair"
            className={`inline-flex items-center gap-1.5 text-copel-cinza-medio hover:text-red-600 transition-colors cursor-pointer ${
              recolhida ? 'p-1.5 rounded hover:bg-red-50 dark:hover:bg-red-500/10' : 'text-xs'
            }`}
          >
            <LogOut size={recolhida ? 16 : 13} />
            {!recolhida && 'Sair'}
          </button>
        </div>
      </>
    );
  }

  return (
    <>
      <aside
        className={`hidden lg:flex flex-col fixed left-0 top-0 bottom-0 bg-white dark:bg-[#1a1c22] border-r border-gray-200 dark:border-white/10 z-50 transition-[width] duration-200 ease-[var(--ease-fluid)] ${
          collapsed ? 'w-16' : 'w-64'
        }`}
      >
        {renderNavContent(collapsed)}
      </aside>

      <header className="lg:hidden flex items-center justify-between px-4 py-3 bg-white dark:bg-[#1a1c22] border-b border-gray-200 dark:border-white/10 sticky top-0 z-50">
        <BrandMark collapsed={false} />
        <div className="flex items-center gap-1">
          {usuario?.tipo === 'EMPREITEIRA' && <NotificacoesSino onAbrirProjeto={onAbrirProjeto} />}
          <button
            onClick={alternarTema}
            aria-label={tema === 'claro' ? 'Ativar tema escuro' : 'Ativar tema claro'}
            className="p-2 text-copel-cinza-medio hover:text-copel-grafite rounded cursor-pointer active:scale-90 transition-transform"
          >
            {tema === 'claro' ? <Moon size={18} /> : <Sun size={18} />}
          </button>
          <button
            onClick={() => setMobileOpen((v) => !v)}
            className="p-2 text-copel-cinza-medio hover:text-copel-grafite rounded cursor-pointer active:scale-90 transition-transform"
            aria-label="Abrir menu"
            aria-expanded={mobileOpen}
          >
            <Menu size={20} />
          </button>
        </div>
      </header>

      {drawerMounted && (
        <div
          className={`lg:hidden fixed inset-0 z-40 bg-black/30 transition-opacity ease-[var(--ease-fluid)] ${
            drawerEntered ? 'opacity-100 duration-[240ms]' : 'opacity-0 duration-[180ms]'
          }`}
          onClick={() => setMobileOpen(false)}
        >
          <div
            className={`absolute left-0 top-0 bottom-0 w-64 bg-white dark:bg-[#1a1c22] flex flex-col shadow-xl transition-transform ease-[var(--ease-fluid)] ${
              drawerEntered ? 'translate-x-0 duration-[280ms]' : '-translate-x-full duration-[200ms]'
            }`}
            onClick={(e) => e.stopPropagation()}
          >
            {renderNavContent(false)}
          </div>
        </div>
      )}
    </>
  );
}
