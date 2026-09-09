import { useState } from 'react';
import { Shield, FilePlus, Search, Menu } from 'lucide-react';
import { EMPREITEIRAS } from '../constants.js';

const NAV_ITEMS = [
  { key: 'cadastrar', label: 'Cadastrar Alvará', icon: FilePlus },
  { key: 'pesquisar', label: 'Pesquisar Alvará', icon: Search },
];

export default function Sidebar({ view, onNavigate }) {
  const [mobileOpen, setMobileOpen] = useState(false);

  const navigate = (key) => {
    onNavigate(key);
    setMobileOpen(false);
  };

  const NavContent = (
    <>
      <div className="px-5 pt-6 pb-5">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 border border-gray-300 bg-white rounded flex items-center justify-center">
            <Shield size={16} className="text-blue-600" />
          </div>
          <div className="leading-tight">
            <p className="text-[15px] font-bold text-gray-900 tracking-tight">SCA</p>
            <p className="text-[10px] text-gray-400 tracking-wide font-medium">Controle de Alvará</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 px-3 pb-4">
        <ul className="space-y-0.5">
          {NAV_ITEMS.map(({ key, label, icon: Icon }) => {
            const ativo = view === key;
            return (
              <li key={key}>
                <button
                  onClick={() => navigate(key)}
                  className={`w-full flex items-center gap-3 pl-3 pr-4 py-2.5 text-sm font-medium border-l-2 transition-colors cursor-pointer ${
                    ativo
                      ? 'bg-blue-50/60 border-blue-600 text-blue-700'
                      : 'border-transparent text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                  }`}
                >
                  <Icon size={17} className={ativo ? 'text-blue-600' : 'text-gray-400'} />
                  {label}
                </button>
              </li>
            );
          })}
        </ul>

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
      </nav>

      <div className="px-5 py-4 border-t border-gray-100">
        <p className="text-[10px] text-gray-400">COPEL Distribuição</p>
      </div>
    </>
  );

  return (
    <>
      <aside className="hidden lg:flex flex-col fixed left-0 top-0 bottom-0 w-64 bg-white border-r border-gray-200 z-50">
        {NavContent}
      </aside>

      <header className="lg:hidden flex items-center justify-between px-4 py-3 bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 border border-gray-300 bg-white rounded flex items-center justify-center">
            <Shield size={16} className="text-blue-600" />
          </div>
          <p className="text-[15px] font-bold text-gray-900 tracking-tight leading-none">SCA</p>
        </div>
        <button
          onClick={() => setMobileOpen((v) => !v)}
          className="p-2 text-gray-500 hover:text-gray-700 rounded cursor-pointer"
          aria-label="Abrir menu"
        >
          <Menu size={20} />
        </button>
      </header>

      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-40 bg-black/30" onClick={() => setMobileOpen(false)}>
          <div
            className="absolute left-0 top-0 bottom-0 w-64 bg-white flex flex-col shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            {NavContent}
          </div>
        </div>
      )}
    </>
  );
}