import { useCallback, useEffect, useState } from 'react';
import Sidebar from './components/Sidebar.jsx';
import AlvaraForm from './components/AlvaraForm.jsx';
import PesquisarAlvara from './components/PesquisarAlvara.jsx';
import AlvaraDetalhePainel from './components/AlvaraDetalhePainel.jsx';
import { createAlvara } from './api.js';
import { FUNDOS_CADASTRO, indiceFundoAtual } from './fundoCadastro.js';

function lerEstadoUrl() {
  const params = new URLSearchParams(window.location.search);
  return {
    view: params.get('view') === 'pesquisar' ? 'pesquisar' : 'cadastrar',
    projeto: params.get('projeto'),
  };
}

function lerSidebarRecolhida() {
  try {
    return localStorage.getItem('sca:sidebarRecolhida') === '1';
  } catch {
    return false;
  }
}

export default function App() {
  const [{ view, projetoAberto }, setEstado] = useState(() => {
    const inicial = lerEstadoUrl();
    return { view: inicial.view, projetoAberto: inicial.projeto };
  });
  const [refreshKey, setRefreshKey] = useState(0);
  const [sidebarRecolhida, setSidebarRecolhida] = useState(lerSidebarRecolhida);
  const [indiceFundo, setIndiceFundo] = useState(indiceFundoAtual);

  // Reavalia a janela de 6h periodicamente — cobre o caso de a aba ficar
  // aberta atravessando a virada, sem precisar recarregar a página.
  useEffect(() => {
    const id = setInterval(() => setIndiceFundo(indiceFundoAtual()), 5 * 60 * 1000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    function aoNavegar() {
      const atual = lerEstadoUrl();
      setEstado({ view: atual.view, projetoAberto: atual.projeto });
    }
    window.addEventListener('popstate', aoNavegar);
    return () => window.removeEventListener('popstate', aoNavegar);
  }, []);

  function setView(novaView) {
    setEstado((prev) => ({ ...prev, view: novaView }));
    const params = new URLSearchParams(window.location.search);
    params.set('view', novaView);
    params.delete('projeto');
    window.history.pushState(null, '', `/?${params.toString()}`);
  }

  const abrirDetalhe = useCallback((numeroProjeto) => {
    setEstado((prev) => ({ ...prev, projetoAberto: numeroProjeto }));
    const params = new URLSearchParams(window.location.search);
    params.set('projeto', numeroProjeto);
    params.set('view', 'pesquisar');
    window.history.pushState(null, '', `/?${params.toString()}`);
  }, []);

  const fecharDetalhe = useCallback(() => {
    setEstado((prev) => ({ ...prev, projetoAberto: null }));
    setRefreshKey((k) => k + 1);
    const params = new URLSearchParams(window.location.search);
    params.delete('projeto');
    window.history.pushState(null, '', `/?${params.toString()}`);
  }, []);

  const renomearDetalhe = useCallback((novoNumero) => {
    setEstado((prev) => ({ ...prev, projetoAberto: novoNumero }));
  }, []);

  function alternarSidebar() {
    setSidebarRecolhida((atual) => {
      const proximo = !atual;
      try {
        localStorage.setItem('sca:sidebarRecolhida', proximo ? '1' : '0');
      } catch {
        /* localStorage indisponível — só não persiste entre sessões */
      }
      return proximo;
    });
  }

  async function handleCreate(data) {
    await createAlvara(data);
  }

  const ePesquisar = view === 'pesquisar';
  const eCadastrar = view === 'cadastrar';

  return (
    <div className={ePesquisar ? 'h-screen overflow-hidden flex flex-col bg-gray-50' : 'min-h-screen'}>
      {eCadastrar && (
        <div className="fixed inset-0 -z-10">
          <div
            className="absolute inset-0 bg-cover bg-center"
            style={{ backgroundImage: `url(${FUNDOS_CADASTRO[indiceFundo]})` }}
          />
          <div className="absolute inset-0 bg-white/75" />
        </div>
      )}

      <Sidebar view={view} onNavigate={setView} collapsed={sidebarRecolhida} onToggleCollapse={alternarSidebar} />
      <main
        className={`transition-[padding-left] duration-200 ${sidebarRecolhida ? 'lg:pl-16' : 'lg:pl-64'} ${
          ePesquisar ? 'flex-1 min-h-0 flex flex-col' : ''
        }`}
      >
        {view === 'cadastrar' ? (
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <AlvaraForm onCreate={handleCreate} />
          </div>
        ) : (
          <div className="flex-1 min-h-0 flex flex-col">
            <PesquisarAlvara onAbrirDetalhe={abrirDetalhe} refreshKey={refreshKey} />
          </div>
        )}
      </main>

      <AlvaraDetalhePainel
        numeroProjeto={projetoAberto}
        onFechar={fecharDetalhe}
        onRenomeado={renomearDetalhe}
      />
    </div>
  );
}
