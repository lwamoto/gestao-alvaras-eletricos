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
    <div className="min-h-screen bg-gray-50">
      <Sidebar view={view} onNavigate={setView} />
      <main className="lg:pl-64">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {view === 'cadastrar' ? (
            <AlvaraForm onCreate={handleCreate} />
          ) : (
            <PesquisarAlvara />
          )}
        </div>
      </main>
    </div>
  );
}