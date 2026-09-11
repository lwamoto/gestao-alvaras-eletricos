import { useEffect, useRef, useState, useCallback } from 'react';
import { Search, Inbox, Calendar, ChevronLeft, ChevronRight, ChevronDown, SlidersHorizontal } from 'lucide-react';
import { listAlvaras, updateAlvara } from '../api.js';
import { TIPOS, EMPREITEIRAS } from '../constants.js';
import { corDoTipo, corDoNumero } from '../cores.js';

const LIMITE = 50;

const COR_TEXTO = {
  preto: 'text-gray-900',
  verde: 'text-green-700',
  vermelho: 'text-red-600',
  roxo: 'text-purple-600',
};

const SITUACAO_LABEL = {
  A_FAZER: 'A FAZER',
  ENVIADO: 'ENVIADO',
  RECEBIDO: 'RECEBIDO',
};

const SITUACAO_BADGE = {
  A_FAZER: 'bg-gray-100 text-gray-600',
  ENVIADO: 'bg-blue-50 text-blue-700',
  RECEBIDO: 'bg-green-50 text-green-700',
};

const selectCls =
  'w-full px-2.5 py-1.5 border border-gray-200 bg-white rounded text-sm text-gray-700 focus:border-blue-500 transition-colors';

const filtroLabelCls = 'block mb-1 text-[10px] font-semibold text-gray-500 uppercase tracking-wider';

const thCls = 'px-3 py-2 text-[10px] font-semibold text-gray-500 uppercase';

function paraInputDate(iso) {
  return new Date(iso).toISOString().slice(0, 10);
}

function formatarDataCurta(iso) {
  return new Date(iso).toLocaleDateString('pt-BR');
}

function paginasVisiveis(paginaAtual, totalPaginas) {
  const paginas = new Set(
    [1, totalPaginas, paginaAtual - 1, paginaAtual, paginaAtual + 1].filter(
      (p) => p >= 1 && p <= totalPaginas
    )
  );
  return [...paginas].sort((a, b) => a - b);
}

export default function PesquisarAlvara({ onAbrirDetalhe, refreshKey }) {
  const [busca, setBusca] = useState('');
  const [buscaAtiva, setBuscaAtiva] = useState('');
  const [filtros, setFiltros] = useState({ tipo: '', empreiteira: '', situacao: '' });
  const [pagina, setPagina] = useState(1);
  const [resultados, setResultados] = useState([]);
  const [paginacao, setPaginacao] = useState({ total: 0, totalPaginas: 1, limite: LIMITE });
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState('');
  const [filtrosAbertos, setFiltrosAbertos] = useState(false);
  const filtrosRef = useRef(null);

  const carregar = useCallback(async (params) => {
    setCarregando(true);
    setErro('');
    try {
      const resposta = await listAlvaras(params);
      setResultados(resposta.dados);
      setPaginacao(resposta.paginacao);
    } catch (err) {
      setErro(err.message);
    } finally {
      setCarregando(false);
    }
  }, []);

  // Debounce só o texto digitado — filtros e paginação respondem na hora.
  useEffect(() => {
    const timer = setTimeout(() => setBuscaAtiva(busca), 300);
    return () => clearTimeout(timer);
  }, [busca]);

  useEffect(() => {
    setPagina(1);
  }, [buscaAtiva, filtros]);

  useEffect(() => {
    carregar({ ...filtros, busca: buscaAtiva, pagina, limite: LIMITE });
  }, [buscaAtiva, filtros, pagina, refreshKey, carregar]);

  useEffect(() => {
    if (!filtrosAbertos) return;
    function aoClicarFora(e) {
      if (filtrosRef.current && !filtrosRef.current.contains(e.target)) setFiltrosAbertos(false);
    }
    function aoTeclar(e) {
      if (e.key === 'Escape') setFiltrosAbertos(false);
    }
    document.addEventListener('mousedown', aoClicarFora);
    document.addEventListener('keydown', aoTeclar);
    return () => {
      document.removeEventListener('mousedown', aoClicarFora);
      document.removeEventListener('keydown', aoTeclar);
    };
  }, [filtrosAbertos]);

  async function handleChangeData(id, novaData) {
    const atualizado = await updateAlvara(id, { dataMarcada: novaData });
    setResultados((atual) => atual.map((a) => (a._id === id ? atualizado : a)));
  }

  function limparFiltros() {
    setBusca('');
    setFiltros({ tipo: '', empreiteira: '', situacao: '' });
  }

  const qtdFiltrosAtivos = [filtros.tipo, filtros.empreiteira, filtros.situacao].filter(Boolean).length;
  const temFiltros = busca || qtdFiltrosAtivos > 0;
  const { total, totalPaginas } = paginacao;
  const inicio = total === 0 ? 0 : (pagina - 1) * LIMITE + 1;
  const fim = Math.min(pagina * LIMITE, total);

  return (
    <div className="flex flex-col h-full min-h-0">
      <div className="shrink-0 flex items-center gap-2.5 px-4 sm:px-6 py-3 border-b border-gray-200 bg-white">
        <div className="relative flex-1 max-w-sm">
          <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar por número do projeto..."
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 text-sm border border-gray-200 rounded-md placeholder:text-gray-400 focus:border-blue-500 transition-colors"
          />
        </div>

        <div className="relative shrink-0" ref={filtrosRef}>
          <button
            onClick={() => setFiltrosAbertos((v) => !v)}
            className="relative inline-flex items-center gap-1.5 px-3 py-1.5 text-sm border border-gray-200 rounded-md text-gray-600 hover:bg-gray-50 active:scale-[0.98] transition-all cursor-pointer"
          >
            <SlidersHorizontal size={14} />
            Filtros
            <ChevronDown size={13} className={`text-gray-400 transition-transform duration-150 ${filtrosAbertos ? 'rotate-180' : ''}`} />
            {qtdFiltrosAtivos > 0 && (
              <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-blue-600 ring-2 ring-white" />
            )}
          </button>

          {filtrosAbertos && (
            <div className="absolute right-0 mt-1.5 w-64 bg-white border border-gray-200 rounded-md shadow-lg p-3 z-20 flex flex-col gap-3 origin-top-right animate-[pop-in_160ms_var(--ease-fluid)]">
              <div>
                <label className={filtroLabelCls}>Modelo</label>
                <select
                  value={filtros.tipo}
                  onChange={(e) => setFiltros({ ...filtros, tipo: e.target.value })}
                  className={selectCls}
                >
                  <option value="">Todos os modelos</option>
                  {TIPOS.map((t) => (
                    <option key={t.valor} value={t.valor}>{t.valor}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className={filtroLabelCls}>Empreiteira</label>
                <select
                  value={filtros.empreiteira}
                  onChange={(e) => setFiltros({ ...filtros, empreiteira: e.target.value })}
                  className={selectCls}
                >
                  <option value="">Todas as empreiteiras</option>
                  {EMPREITEIRAS.map((emp) => (
                    <option key={emp} value={emp}>{emp}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className={filtroLabelCls}>Situação</label>
                <select
                  value={filtros.situacao}
                  onChange={(e) => setFiltros({ ...filtros, situacao: e.target.value })}
                  className={selectCls}
                >
                  <option value="">Todas as situações</option>
                  <option value="A_FAZER">A fazer</option>
                  <option value="ENVIADO">Enviado</option>
                  <option value="RECEBIDO">Recebido</option>
                </select>
              </div>

              {qtdFiltrosAtivos > 0 && (
                <button
                  onClick={() => setFiltros({ tipo: '', empreiteira: '', situacao: '' })}
                  className="text-xs text-blue-600 hover:underline self-start cursor-pointer"
                >
                  Limpar filtros
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {erro && (
        <div className="shrink-0 mx-4 sm:mx-6 mt-3 px-4 py-3 bg-red-50 border border-red-200 text-red-700 rounded text-sm">
          {erro}
        </div>
      )}

      <div className="flex-1 min-h-0 overflow-y-auto">
        {!carregando && resultados.length === 0 ? (
          <div className="h-full flex items-center justify-center text-center p-14">
            <div>
              <Inbox size={36} className="mx-auto text-gray-300 mb-3" />
              <p className="text-gray-500 text-sm">
                {temFiltros ? 'Nenhum alvará encontrado com esses filtros.' : 'Nenhum alvará cadastrado ainda.'}
              </p>
              {temFiltros && (
                <button
                  onClick={limparFiltros}
                  className="mt-3 text-sm text-blue-600 hover:underline cursor-pointer"
                >
                  Limpar filtros
                </button>
              )}
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="sticky top-0 z-10">
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className={`${thCls} text-left`}>Nº Projeto</th>
                  <th className={`${thCls} text-left`}>Tipo</th>
                  <th className={`${thCls} text-left`}>Situação</th>
                  <th className={`${thCls} text-left`}>Responsável</th>
                  <th className={`${thCls} text-left`}>Endereço</th>
                  <th className={`${thCls} text-center`}>Data marcada</th>
                  <th className={`${thCls} text-center`}>Criado em</th>
                </tr>
              </thead>
              <tbody>
                {carregando
                  ? Array.from({ length: 12 }).map((_, i) => (
                      <tr key={i} className="border-b border-gray-100 last:border-0 animate-pulse">
                        {Array.from({ length: 7 }).map((__, j) => (
                          <td key={j} className="px-3 py-2.5">
                            <div className="h-3 bg-gray-100 rounded" style={{ width: j === 0 ? '70%' : '85%' }} />
                          </td>
                        ))}
                      </tr>
                    ))
                  : resultados.map((a) => {
                      const corNumero = corDoNumero(a);
                      const corTipo = corDoTipo(a);
                      const primeiroEndereco = a.enderecos?.[0]?.localObra;
                      const enderecosExtras = (a.enderecos?.length || 0) - 1;

                      return (
                        <tr
                          key={a._id}
                          onClick={() => onAbrirDetalhe(a.numeroProjeto)}
                          className="border-b border-gray-100 last:border-0 hover:bg-gray-50 cursor-pointer transition-colors"
                        >
                          <td className="px-3 py-2.5">
                            <span className={`text-sm font-semibold ${COR_TEXTO[corNumero]}`}>
                              {a.numeroProjeto}
                            </span>
                          </td>
                          <td className="px-3 py-2.5">
                            <span className={`inline-flex items-center px-2 py-0.5 text-[11px] font-medium rounded ${
                              corTipo === 'vermelho' ? 'bg-red-50 text-red-700' :
                              corTipo === 'roxo' ? 'bg-purple-50 text-purple-700' :
                              'bg-gray-100 text-gray-600'
                            }`}>
                              {a.tipo}
                            </span>
                            {a.empreiteira && (
                              <span className="ml-1.5 text-xs text-gray-500">{a.empreiteira}</span>
                            )}
                          </td>
                          <td className="px-3 py-2.5">
                            <span className={`inline-flex items-center px-2 py-0.5 text-[11px] font-medium rounded ${SITUACAO_BADGE[a.situacao]}`}>
                              {SITUACAO_LABEL[a.situacao]}
                            </span>
                          </td>
                          <td className="px-3 py-2.5 text-xs text-gray-700 whitespace-nowrap">
                            {a.responsavel || '—'}
                          </td>
                          <td className="px-3 py-2.5 text-xs text-gray-700 max-w-[220px] truncate">
                            {primeiroEndereco || '—'}
                            {enderecosExtras > 0 && (
                              <span className="ml-1.5 text-[11px] text-gray-400">+{enderecosExtras}</span>
                            )}
                          </td>
                          <td className="px-3 py-2 text-center">
                            <div className="inline-flex items-center gap-1.5">
                              <Calendar size={13} className="text-gray-400" />
                              <input
                                type="date"
                                value={paraInputDate(a.dataMarcada || a.createdAt)}
                                onClick={(e) => e.stopPropagation()}
                                onChange={(e) => handleChangeData(a._id, e.target.value)}
                                className="border border-gray-300 rounded px-1.5 py-1 text-xs font-medium text-gray-600 focus:border-blue-500 transition-colors"
                              />
                            </div>
                          </td>
                          <td className="px-3 py-2.5 text-xs text-gray-400 text-center whitespace-nowrap">
                            {formatarDataCurta(a.createdAt)}
                          </td>
                        </tr>
                      );
                    })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {!carregando && resultados.length > 0 && (
        <div className="shrink-0 flex items-center justify-between flex-wrap gap-3 px-4 sm:px-6 py-3 border-t border-gray-200 bg-white">
          <p className="text-xs text-gray-500">
            Mostrando {inicio}–{fim} de {total} alvará{total !== 1 ? 's' : ''}
          </p>

          {totalPaginas > 1 && (
            <div className="flex items-center gap-1">
              <button
                onClick={() => setPagina((p) => Math.max(1, p - 1))}
                disabled={pagina === 1}
                className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-gray-600 border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
              >
                <ChevronLeft size={14} />
                Anterior
              </button>

              {paginasVisiveis(pagina, totalPaginas).map((p, idx, arr) => (
                <span key={p} className="flex items-center">
                  {idx > 0 && p - arr[idx - 1] > 1 && (
                    <span className="px-1.5 text-xs text-gray-300">…</span>
                  )}
                  <button
                    onClick={() => setPagina(p)}
                    className={`min-w-[28px] px-2 py-1.5 text-xs font-medium rounded transition-colors cursor-pointer ${
                      p === pagina
                        ? 'bg-blue-50 text-blue-700 border border-blue-200'
                        : 'text-gray-600 border border-transparent hover:bg-gray-50'
                    }`}
                  >
                    {p}
                  </button>
                </span>
              ))}

              <button
                onClick={() => setPagina((p) => Math.min(totalPaginas, p + 1))}
                disabled={pagina === totalPaginas}
                className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-gray-600 border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
              >
                Próxima
                <ChevronRight size={14} />
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
