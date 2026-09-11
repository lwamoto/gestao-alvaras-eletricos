import { useEffect, useState } from 'react';
import { Globe, FilePlus, Search, Menu, PanelLeftClose, PanelLeftOpen } from 'lucide-react';
import { EMPREITEIRAS } from '../constants.js';

const NAV_ITEMS = [
  { key: 'cadastrar', label: 'Cadastrar Alvará', icon: FilePlus },
  { key: 'pesquisar', label: 'Pesquisar Alvará', icon: Search },
];

function BrandMark({ collapsed = false }) {
  return (
    <div className="flex items-center gap-2.5">
      <div className="w-8 h-8 border border-gray-300 bg-white rounded flex items-center justify-center shrink-0">
        <Globe size={16} className="text-blue-600" />
      </div>
      {!collapsed && (
        <p className="text-[15px] font-bold text-gray-900 tracking-tight leading-none whitespace-nowrap">
          Sistema de Alvará
        </p>
      )}
    </div>
  );
}

export default function Sidebar({ view, onNavigate, collapsed, onToggleCollapse }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [drawerMounted, setDrawerMounted] = useState(false);
  const [drawerEntered, setDrawerEntered] = useState(false);

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
          {onToggleCollapse && (
            <button
              onClick={onToggleCollapse}
              aria-label={recolhida ? 'Expandir menu' : 'Recolher menu'}
              title={recolhida ? 'Expandir menu' : 'Recolher menu'}
              className="p-1.5 rounded text-gray-400 hover:text-gray-600 hover:bg-gray-100 active:scale-90 transition-all cursor-pointer shrink-0"
            >
              {recolhida ? <PanelLeftOpen size={16} /> : <PanelLeftClose size={16} />}
            </button>
          )}
        </div>

        <nav className="flex-1 px-3 pb-4">
          <ul className="space-y-0.5">
            {NAV_ITEMS.map(({ key, label, icon: Icon }) => {
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
                        ? 'bg-blue-50/60 border-blue-600 text-blue-700'
                        : 'border-transparent text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                    }`}
                  >
                    <Icon size={17} className={`shrink-0 ${ativo ? 'text-blue-600' : 'text-gray-400'}`} />
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

          {!recolhida && (
            <>
              <h3 className="mt-8 mb-2 pl-3 text-[10px] font-semibold text-gray-400 uppercase tracking-wider">
                Empreiteiras
              </h3>
              <ul>
                {EMPREITEIRAS.map((emp) => (
                  <li
                    key={emp}
                    className="pl-3 pr-4 py-1.5 text-xs text-gray-500 hover:text-gray-700 transition-colors"
                  >
                    {emp}
                  </li>
                ))}
              </ul>
            </>
          )}
        </nav>

        {!recolhida && (
          <div className="px-5 py-4 border-t border-gray-100">
            <p className="text-[10px] text-gray-400">COPEL Distribuição</p>
          </div>
        )}
      </>
    );
  }

  return (
    <>
      <aside
        className={`hidden lg:flex flex-col fixed left-0 top-0 bottom-0 bg-white border-r border-gray-200 z-50 transition-[width] duration-200 ease-[var(--ease-fluid)] ${
          collapsed ? 'w-16' : 'w-64'
        }`}
      >
        {renderNavContent(collapsed)}
      </aside>

      <header className="lg:hidden flex items-center justify-between px-4 py-3 bg-white border-b border-gray-200 sticky top-0 z-50">
        <BrandMark collapsed={false} />
        <button
          onClick={() => setMobileOpen((v) => !v)}
          className="p-2 text-gray-500 hover:text-gray-700 rounded cursor-pointer active:scale-90 transition-transform"
          aria-label="Abrir menu"
          aria-expanded={mobileOpen}
        >
          <Menu size={20} />
        </button>
      </header>

      {drawerMounted && (
        <div
          className={`lg:hidden fixed inset-0 z-40 bg-black/30 transition-opacity ease-[var(--ease-fluid)] ${
            drawerEntered ? 'opacity-100 duration-[240ms]' : 'opacity-0 duration-[180ms]'
          }`}
          onClick={() => setMobileOpen(false)}
        >
          <div
            className={`absolute left-0 top-0 bottom-0 w-64 bg-white flex flex-col shadow-xl transition-transform ease-[var(--ease-fluid)] ${
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
