import { useEffect, useState } from 'react';
import { FilePlus, ChevronDown, Check, AlertCircle, Menu, Plus, Trash2 } from 'lucide-react';
import { TIPOS } from '../constants.js';
import { listEmpreiteiras } from '../empreiteirasApi.js';

const vazio = {
  numeroProjeto: '',
  tipo: '',
  empreiteira: '',
  responsavel: '',
};

const MAX_LINHAS_LOTE = 10;
const MIN_LINHAS_LOTE = 2;

function linhaLoteVazia() {
  return { numeroProjeto: '', tipo: '', empreiteira: '', responsavel: '' };
}

const corTag = {
  POO: 'bg-purple-50 dark:bg-purple-500/15 text-purple-700 dark:text-purple-400 border border-purple-200 dark:border-purple-500/30',
  CONSUMIDOR: 'bg-copel-cinza text-copel-grafite border border-gray-200 dark:border-white/10',
  PARTICULAR: 'bg-red-50 dark:bg-red-500/15 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-500/30',
};

const inputCls =
  'w-full px-3.5 py-2.5 border border-gray-300 dark:border-white/15 bg-white dark:bg-[#20232a] rounded text-sm text-copel-grafite placeholder:text-copel-cinza-medio focus:border-copel-laranja transition-colors';

export default function AlvaraForm({ onCreate }) {
  const [form, setForm] = useState(vazio);
  const [erro, setErro] = useState('');
  const [sucesso, setSucesso] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [tipoAberto, setTipoAberto] = useState(false);
  const [empreiteiras, setEmpreiteiras] = useState([]);

  const [modoLote, setModoLote] = useState(false);
  const [linhasLote, setLinhasLote] = useState(() => [linhaLoteVazia(), linhaLoteVazia()]);
  const [enviandoLote, setEnviandoLote] = useState(false);

  useEffect(() => {
    listEmpreiteiras({ somenteAtivas: true }).then(setEmpreiteiras).catch(() => setEmpreiteiras([]));
  }, []);

  function escolherTipo(tipo) {
    setForm({ ...form, tipo, empreiteira: tipo === 'PARTICULAR' ? form.empreiteira : '' });
    if (tipo !== 'PARTICULAR') setTipoAberto(false);
  }

  function alternarModoLote() {
    setErro('');
    setSucesso(false);
    setModoLote((v) => !v);
  }

  function atualizarLinhaLote(idx, campo, valor) {
    setLinhasLote((prev) => {
      const linhas = [...prev];
      const atual = { ...linhas[idx], [campo]: valor };
      if (campo === 'tipo' && valor !== 'PARTICULAR') atual.empreiteira = '';
      linhas[idx] = atual;
      return linhas;
    });
  }

  function adicionarLinhaLote() {
    setLinhasLote((prev) => (prev.length >= MAX_LINHAS_LOTE ? prev : [...prev, linhaLoteVazia()]));
  }

  function removerLinhaLote(idx) {
    setLinhasLote((prev) => (prev.length <= MIN_LINHAS_LOTE ? prev : prev.filter((_, i) => i !== idx)));
  }

  const loteValido = linhasLote.every(
    (l) => l.numeroProjeto.trim() && l.tipo && (l.tipo !== 'PARTICULAR' || l.empreiteira)
  );

  async function handleSubmitLote() {
    setErro('');
    setSucesso(false);
    setEnviandoLote(true);
    const falhas = [];
    // Sequencial (não Promise.all) — número do projeto precisa ser único, então
    // criar tudo em paralelo arrisca corrida de validação no backend.
    for (const linha of linhasLote) {
      try {
        await onCreate(linha);
      } catch (err) {
        falhas.push({ numero: linha.numeroProjeto || '(sem número)', mensagem: err.message });
      }
    }
    setEnviandoLote(false);
    if (falhas.length === 0) {
      setLinhasLote([linhaLoteVazia(), linhaLoteVazia()]);
      setSucesso(true);
      setTimeout(() => setSucesso(false), 3000);
    } else {
      const totalOk = linhasLote.length - falhas.length;
      setErro(
        `${totalOk} de ${linhasLote.length} alvará(s) cadastrado(s). Falharam: ${falhas
          .map((f) => `${f.numero} (${f.mensagem})`)
          .join('; ')}`
      );
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (modoLote) {
      await handleSubmitLote();
      return;
    }
    setErro('');
    setSucesso(false);
    setEnviando(true);
    try {
      await onCreate(form);
      setForm(vazio);
      setSucesso(true);
      setTimeout(() => setSucesso(false), 3000);
    } catch (err) {
      setErro(err.message);
    } finally {
      setEnviando(false);
    }
  }

  return (
    <div>
      <div className="pb-6 mb-8 border-b border-gray-200 dark:border-white/10">
        <h1 className="text-xl font-semibold text-copel-grafite">Cadastrar Alvará</h1>
        <p className="mt-1 text-sm text-copel-cinza-medio">
          {modoLote
            ? 'Cadastro em lote — preencha as informações de base de cada alvará.'
            : 'Preencha os dados abaixo para criar um novo registro.'}
        </p>
      </div>

      <div className="bg-white dark:bg-[#1e2127] border border-gray-200 dark:border-white/10 rounded-md shadow-sm">
        <form onSubmit={handleSubmit} className="p-6 sm:p-8">
          {modoLote ? (
          <div className="space-y-3">
            <div className="hidden sm:grid grid-cols-[1fr_1fr_1fr_1fr_28px] gap-2 px-1">
              <span className="text-xs font-medium text-copel-cinza-medio">Nº do projeto</span>
              <span className="text-xs font-medium text-copel-cinza-medio">Modelo</span>
              <span className="text-xs font-medium text-copel-cinza-medio">Empreiteira</span>
              <span className="text-xs font-medium text-copel-cinza-medio">Responsável</span>
              <span />
            </div>
            {linhasLote.map((linha, idx) => (
              <div key={idx} className="grid grid-cols-2 sm:grid-cols-[1fr_1fr_1fr_1fr_28px] gap-2 items-center">
                <input
                  type="text"
                  placeholder="Ex: 12345"
                  value={linha.numeroProjeto}
                  onChange={(e) => atualizarLinhaLote(idx, 'numeroProjeto', e.target.value)}
                  required
                  className={`${inputCls} py-2`}
                />
                <select
                  value={linha.tipo}
                  onChange={(e) => atualizarLinhaLote(idx, 'tipo', e.target.value)}
                  required
                  className={`${inputCls} py-2`}
                >
                  <option value="">Modelo</option>
                  {TIPOS.map((t) => (
                    <option key={t.valor} value={t.valor}>{t.valor}</option>
                  ))}
                </select>
                {linha.tipo === 'PARTICULAR' ? (
                  <select
                    value={linha.empreiteira}
                    onChange={(e) => atualizarLinhaLote(idx, 'empreiteira', e.target.value)}
                    required
                    className={`${inputCls} py-2`}
                  >
                    <option value="">Selecione</option>
                    {empreiteiras.map((emp) => (
                      <option key={emp._id} value={emp.nome}>{emp.nome}</option>
                    ))}
                  </select>
                ) : (
                  <div className={`${inputCls} py-2 text-copel-cinza-medio bg-copel-cinza dark:bg-white/5`}>—</div>
                )}
                <input
                  type="text"
                  maxLength={20}
                  placeholder="Opcional"
                  value={linha.responsavel}
                  onChange={(e) => atualizarLinhaLote(idx, 'responsavel', e.target.value)}
                  className={`${inputCls} py-2`}
                />
                <button
                  type="button"
                  onClick={() => removerLinhaLote(idx)}
                  disabled={linhasLote.length <= MIN_LINHAS_LOTE}
                  title="Remover linha"
                  className="p-1.5 text-copel-cinza-medio hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded transition-colors cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-transparent"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
            {linhasLote.length < MAX_LINHAS_LOTE && (
              <button
                type="button"
                onClick={adicionarLinhaLote}
                className="inline-flex items-center gap-1.5 text-xs font-medium text-copel-laranja hover:underline cursor-pointer"
              >
                <Plus size={14} />
                Adicionar linha ({linhasLote.length}/{MAX_LINHAS_LOTE})
              </button>
            )}
          </div>
          ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div>
              <label className="block mb-1.5 text-xs font-medium text-copel-cinza-medio">
                Número do projeto
              </label>
              <input
                type="text"
                placeholder="Ex: 12345"
                value={form.numeroProjeto}
                onChange={(e) => setForm({ ...form, numeroProjeto: e.target.value })}
                required
                className={inputCls}
              />
            </div>

            <div>
              <label className="block mb-1.5 text-xs font-medium text-copel-cinza-medio">Modelo</label>
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setTipoAberto((v) => !v)}
                  className="w-full flex items-center justify-between px-3.5 py-2.5 border border-gray-300 dark:border-white/15 bg-white dark:bg-[#20232a] rounded text-sm text-left hover:border-gray-400 dark:hover:border-white/25 active:scale-[0.99] transition-all cursor-pointer"
                >
                  {form.tipo ? (
                    <span className={`inline-flex items-center px-2 py-0.5 text-xs font-semibold rounded ${corTag[form.tipo]}`}>
                      {form.tipo}
                    </span>
                  ) : (
                    <span className="text-copel-cinza-medio">Selecione o modelo</span>
                  )}
                  <ChevronDown
                    size={16}
                    className={`text-copel-cinza-medio transition-transform duration-200 ease-[var(--ease-fluid)] ${tipoAberto ? 'rotate-180' : ''}`}
                  />
                </button>

                {tipoAberto && (
                  <div
                    className="absolute top-full left-0 right-0 mt-1.5 bg-white dark:bg-[#20232a] border border-gray-200 dark:border-white/10 rounded shadow-sm z-10 py-1 origin-top animate-[pop-in_160ms_var(--ease-fluid)]"
                  >
                    {TIPOS.map((t) => (
                      <button
                        key={t.valor}
                        type="button"
                        onClick={() => escolherTipo(t.valor)}
                        className={`w-full flex items-center gap-3 px-3.5 py-2.5 text-sm hover:bg-copel-cinza active:bg-copel-cinza transition-colors cursor-pointer ${
                          form.tipo === t.valor ? 'font-medium' : ''
                        }`}
                      >
                        <span className={`inline-flex items-center px-2 py-0.5 text-xs font-semibold rounded ${corTag[t.valor]}`}>
                          {t.valor}
                        </span>
                        <span className="text-xs text-copel-cinza-medio">
                          {t.valor === 'CONSUMIDOR' && 'Cliente direto'}
                          {t.valor === 'PARTICULAR' && 'Via empreiteira'}
                          {t.valor === 'POO' && 'Tipo raro, sem empreiteira'}
                        </span>
                        {form.tipo === t.valor && <Check size={15} className="text-copel-laranja ml-auto" />}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {form.tipo === 'PARTICULAR' && (
              <div>
                <label className="block mb-1.5 text-xs font-medium text-copel-cinza-medio">Empreiteira</label>
                <select
                  value={form.empreiteira}
                  onChange={(e) => setForm({ ...form, empreiteira: e.target.value })}
                  required
                  className={inputCls}
                >
                  <option value="">Selecione a empreiteira</option>
                  {empreiteiras.map((emp) => (
                    <option key={emp._id} value={emp.nome}>{emp.nome}</option>
                  ))}
                </select>
              </div>
            )}

            <div className="sm:col-span-2">
              <label className="block mb-1.5 text-xs font-medium text-copel-cinza-medio">
                Responsável <span className="text-copel-cinza-medio font-normal">(opcional)</span>
              </label>
              <input
                type="text"
                placeholder="Quem vai tratar esse alvará"
                value={form.responsavel}
                onChange={(e) => setForm({ ...form, responsavel: e.target.value })}
                className={inputCls}
              />
            </div>
          </div>
          )}

          {sucesso && (
            <div className="mt-6 flex items-center gap-2 px-3.5 py-2.5 bg-green-50 dark:bg-green-500/10 border border-green-200 dark:border-green-500/30 text-green-700 dark:text-green-400 rounded text-sm">
              <Check size={16} />
              {modoLote ? 'Alvarás cadastrados com sucesso!' : 'Alvará cadastrado com sucesso!'}
            </div>
          )}

          {erro && (
            <div className="mt-6 flex items-center gap-2 px-3.5 py-2.5 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/30 text-red-700 dark:text-red-400 rounded text-sm">
              <AlertCircle size={16} />
              {erro}
            </div>
          )}

          <div className="mt-8 flex items-center justify-end gap-2 border-t border-gray-100 dark:border-white/5 pt-6">
            <button
              type="button"
              onClick={alternarModoLote}
              title={modoLote ? 'Voltar ao cadastro único' : 'Cadastrar vários alvarás de uma vez'}
              className={`p-2.5 rounded border transition-colors cursor-pointer ${
                modoLote
                  ? 'bg-copel-laranja/10 border-copel-laranja/30 text-copel-laranja'
                  : 'bg-white dark:bg-[#20232a] border-gray-300 dark:border-white/15 text-copel-cinza-medio hover:text-copel-grafite hover:bg-copel-cinza'
              }`}
            >
              <Menu size={16} />
            </button>
            <button
              type="submit"
              disabled={modoLote ? enviandoLote || !loteValido : enviando || !form.tipo}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-copel-laranja text-white text-sm font-medium rounded hover:brightness-90 disabled:bg-gray-200 dark:disabled:bg-white/10 disabled:text-copel-cinza-medio disabled:cursor-not-allowed transition-colors cursor-pointer"
            >
              <FilePlus size={16} />
              {modoLote
                ? enviandoLote
                  ? 'Salvando...'
                  : `Cadastrar ${linhasLote.length} alvarás`
                : enviando
                ? 'Salvando...'
                : 'Adicionar Alvará'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}