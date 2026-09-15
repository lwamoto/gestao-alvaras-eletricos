import { useEffect, useState } from 'react';
import { Building2, Plus, Trash2, AlertCircle, Check } from 'lucide-react';
import { listEmpreiteiras, createEmpreiteira, updateEmpreiteira, deleteEmpreiteira } from '../empreiteirasApi.js';

const inputCls =
  'w-full px-3.5 py-2.5 border border-gray-300 bg-white rounded text-sm text-copel-grafite placeholder:text-copel-cinza-medio focus:border-copel-laranja transition-colors';

export default function EmpreiteirasAdmin() {
  const [empreiteiras, setEmpreiteiras] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState('');
  const [nome, setNome] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [confirmandoId, setConfirmandoId] = useState(null);

  async function carregar() {
    setCarregando(true);
    setErro('');
    try {
      setEmpreiteiras(await listEmpreiteiras());
    } catch (err) {
      setErro(err.message);
    } finally {
      setCarregando(false);
    }
  }

  useEffect(() => {
    carregar();
  }, []);

  async function handleAdicionar(e) {
    e.preventDefault();
    if (!nome.trim()) return;
    setEnviando(true);
    setErro('');
    try {
      await createEmpreiteira(nome.trim());
      setNome('');
      await carregar();
    } catch (err) {
      setErro(err.message);
    } finally {
      setEnviando(false);
    }
  }

  async function handleAlternarAtivo(emp) {
    setErro('');
    try {
      await updateEmpreiteira(emp._id, { ativo: !emp.ativo });
      await carregar();
    } catch (err) {
      setErro(err.message);
    }
  }

  async function handleExcluir(id) {
    if (confirmandoId !== id) {
      setConfirmandoId(id);
      setTimeout(() => setConfirmandoId((atual) => (atual === id ? null : atual)), 3000);
      return;
    }
    setErro('');
    try {
      await deleteEmpreiteira(id);
      setConfirmandoId(null);
      await carregar();
    } catch (err) {
      setErro(err.message);
    }
  }

  return (
    <div>
      <div className="pb-6 mb-8 border-b border-gray-200">
        <h1 className="text-xl font-semibold text-copel-grafite">Empreiteiras</h1>
        <p className="mt-1 text-sm text-copel-cinza-medio">
          Empreiteiras disponíveis para alvarás PARTICULAR e para vincular usuários.
        </p>
      </div>

      <div className="bg-white border border-gray-200 rounded-md shadow-sm p-6 sm:p-8 mb-6">
        <form onSubmit={handleAdicionar} className="flex items-end gap-3">
          <div className="flex-1">
            <label className="block mb-1.5 text-xs font-medium text-copel-cinza-medio">Nova empreiteira</label>
            <input
              type="text"
              placeholder="Ex: FELTRIN"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              className={inputCls}
            />
          </div>
          <button
            type="submit"
            disabled={enviando || !nome.trim()}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-copel-laranja text-white text-sm font-medium rounded hover:brightness-90 disabled:bg-gray-200 disabled:text-copel-cinza-medio disabled:cursor-not-allowed transition-colors cursor-pointer shrink-0"
          >
            <Plus size={16} />
            Adicionar
          </button>
        </form>

        {erro && (
          <div className="mt-4 flex items-center gap-2 px-3.5 py-2.5 bg-red-50 border border-red-200 text-red-700 rounded text-sm">
            <AlertCircle size={16} />
            {erro}
          </div>
        )}
      </div>

      <div className="bg-white border border-gray-200 rounded-md shadow-sm overflow-hidden">
        {carregando ? (
          <div className="p-8 text-center text-sm text-copel-cinza-medio">Carregando...</div>
        ) : empreiteiras.length === 0 ? (
          <div className="p-8 text-center">
            <Building2 size={28} className="mx-auto text-gray-300 mb-2" />
            <p className="text-sm text-copel-cinza-medio">Nenhuma empreiteira cadastrada ainda.</p>
          </div>
        ) : (
          <ul>
            {empreiteiras.map((emp) => (
              <li
                key={emp._id}
                className="flex items-center justify-between gap-3 px-5 py-3 border-b border-gray-100 last:border-0"
              >
                <div className="flex items-center gap-3">
                  <span className="text-sm font-medium text-copel-grafite">{emp.nome}</span>
                  <span
                    className={`inline-flex items-center px-2 py-0.5 text-[11px] font-medium rounded ${
                      emp.ativo ? 'bg-green-50 text-green-700' : 'bg-copel-cinza text-copel-cinza-medio'
                    }`}
                  >
                    {emp.ativo ? 'Ativa' : 'Inativa'}
                  </span>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => handleAlternarAtivo(emp)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-gray-300 text-copel-grafite text-xs font-medium rounded hover:bg-copel-cinza active:scale-[0.97] transition-all cursor-pointer"
                  >
                    {emp.ativo ? 'Desativar' : 'Ativar'}
                  </button>
                  <button
                    onClick={() => handleExcluir(emp._id)}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded active:scale-[0.97] transition-all cursor-pointer ${
                      confirmandoId === emp._id
                        ? 'bg-red-600 text-white hover:bg-red-700'
                        : 'bg-white border border-gray-300 text-red-600 hover:bg-red-50'
                    }`}
                  >
                    {confirmandoId === emp._id ? (
                      <>
                        <Check size={13} />
                        Confirmar?
                      </>
                    ) : (
                      <>
                        <Trash2 size={13} />
                        Excluir
                      </>
                    )}
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
