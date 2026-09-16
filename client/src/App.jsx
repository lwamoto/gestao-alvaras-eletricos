import { useCallback, useEffect, useState } from 'react';
import Sidebar from './components/Sidebar.jsx';
import AlvaraForm from './components/AlvaraForm.jsx';
import PesquisarAlvara from './components/PesquisarAlvara.jsx';
import AlvaraDetalhePainel from './components/AlvaraDetalhePainel.jsx';
import Login from './components/Login.jsx';
import SolicitacaoImpressao from './components/SolicitacaoImpressao.jsx';
import UsuariosAdmin from './components/UsuariosAdmin.jsx';
import EmpreiteirasAdmin from './components/EmpreiteirasAdmin.jsx';
import Dashboard from './components/Dashboard.jsx';
import { createAlvara } from './api.js';
import { FUNDOS_CADASTRO, indiceFundoAtual } from './fundoCadastro.js';
import { AuthProvider, useAuth } from './contexts/AuthContext.jsx';

const VIEWS_VALIDAS = ['dashboard', 'cadastrar', 'pesquisar', 'usuarios', 'empreiteiras'];

function lerEstadoUrl() {
  const params = new URLSearchParams(window.location.search);
  const view = params.get('view');
  return {
    view: VIEWS_VALIDAS.includes(view) ? view : 'cadastrar',
    projeto: params.get('projeto'),
    imprimir: params.get('imprimir'),
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
  return (
    <AuthProvider>
      <AppShell />
    </AuthProvider>
  );
}

function AppShell() {
  const { usuario, carregando, logout } = useAuth();
  const [{ view, projetoAberto, imprimirProjeto }, setEstado] = useState(() => {
    const inicial = lerEstadoUrl();
    return { view: inicial.view, projetoAberto: inicial.projeto, imprimirProjeto: inicial.imprimir };
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
      setEstado({ view: atual.view, projetoAberto: atual.projeto, imprimirProjeto: atual.imprimir });
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
    // Também troca `view` aqui (não só na URL) — necessário pra quem chama
    // isso estando em outra tela, como o sino de notificações no dashboard.
    setEstado((prev) => ({ ...prev, projetoAberto: numeroProjeto, view: 'pesquisar' }));
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

  if (carregando) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-copel-laranja border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!usuario) {
    return <Login />;
  }

  // Impressão é exclusiva de usuário COPEL — empreiteira não pode gerar o
  // documento, nem digitando a URL direto (mesma regra já vale no botão).
  if (imprimirProjeto && usuario.tipo === 'COPEL') {
    return <SolicitacaoImpressao numeroProjeto={imprimirProjeto} />;
  }

  // Usuário EMPREITEIRA só enxerga a pesquisa (só leitura, escopada à própria
  // empreiteira no backend) — qualquer outra view cai pra pesquisar.
  const viewsPermitidas = usuario.tipo === 'EMPREITEIRA' ? ['dashboard', 'pesquisar'] : VIEWS_VALIDAS;
  const viewEfetiva = viewsPermitidas.includes(view) ? view : 'pesquisar';

  const ePesquisar = viewEfetiva === 'pesquisar';
  const eCadastrar = viewEfetiva === 'cadastrar';

  return (
    <div className={ePesquisar ? 'h-screen overflow-hidden flex flex-col bg-copel-cinza' : 'min-h-screen'}>
      {eCadastrar && (
        <div className="fixed inset-0 -z-10">
          <div
            className="absolute inset-0 bg-cover bg-center"
            style={{ backgroundImage: `url(${FUNDOS_CADASTRO[indiceFundo]})` }}
          />
          <div className="absolute inset-0 bg-white/75" />
        </div>
      )}

      <Sidebar
        view={viewEfetiva}
        onNavigate={setView}
        collapsed={sidebarRecolhida}
        onToggleCollapse={alternarSidebar}
        usuario={usuario}
        onLogout={logout}
        onAbrirProjeto={abrirDetalhe}
      />
      <main
        className={`transition-[padding-left] duration-200 ${sidebarRecolhida ? 'lg:pl-16' : 'lg:pl-64'} ${
          ePesquisar ? 'flex-1 min-h-0 flex flex-col' : ''
        }`}
      >
        {viewEfetiva === 'dashboard' && (
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <Dashboard usuario={usuario} />
          </div>
        )}
        {viewEfetiva === 'cadastrar' && (
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <AlvaraForm onCreate={handleCreate} />
          </div>
        )}
        {viewEfetiva === 'pesquisar' && (
          <div className="flex-1 min-h-0 flex flex-col">
            <PesquisarAlvara onAbrirDetalhe={abrirDetalhe} refreshKey={refreshKey} />
          </div>
        )}
        {viewEfetiva === 'usuarios' && (
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <UsuariosAdmin usuarioLogado={usuario} />
          </div>
        )}
        {viewEfetiva === 'empreiteiras' && (
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <EmpreiteirasAdmin />
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
