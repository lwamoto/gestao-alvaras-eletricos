import { useState } from 'react';
import Sidebar from './components/Sidebar.jsx';
import AlvaraForm from './components/AlvaraForm.jsx';
import PesquisarAlvara from './components/PesquisarAlvara.jsx';
import AlvaraDetalhePage from './components/AlvaraDetalhePage.jsx';
import { createAlvara } from './api.js';

const parametrosUrl = new URLSearchParams(window.location.search);
const projetoNaUrl = parametrosUrl.get('projeto');
const viewInicial = parametrosUrl.get('view') === 'pesquisar' ? 'pesquisar' : 'cadastrar';

export default function App() {
  const [view, setView] = useState(viewInicial);

  if (projetoNaUrl) {
    return <AlvaraDetalhePage numeroProjeto={projetoNaUrl} />;
  }

  async function handleCreate(data) {
    await createAlvara(data);
  }

  return (
    <div className="app-shell">
      <Sidebar view={view} onNavigate={setView} />
      <main className="app-main">
        {view === 'cadastrar' ? (
          <AlvaraForm onCreate={handleCreate} />
        ) : (
          <PesquisarAlvara />
        )}
      </main>
    </div>
  );
}
