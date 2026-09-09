import { useEffect, useState, useCallback } from 'react';
import { Search, Inbox, Calendar } from 'lucide-react';
import { listAlvaras, updateAlvara } from '../api.js';
import { TIPOS, EMPREITEIRAS } from '../constants.js';
import { corDoTipo, corDoNumero } from '../cores.js';

const COR_BAR = {
  preto: 'border-l-gray-800',
  verde: 'border-l-green-600',
  vermelho: 'border-l-red-600',
  roxo: 'border-l-purple-500',
};

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
  'px-3 py-2 border border-gray-300 bg-white rounded text-sm text-gray-700 focus:border-blue-500 transition-colors';

function abrirDetalhe(numeroProjeto) {
  window.open(`/?projeto=${encodeURIComponent(numeroProjeto)}`, '_blank');
}

function paraInputDate(iso) {
  return new Date(iso).toISOString().slice(0, 10);
}

export default function PesquisarAlvara() {
  const [busca, setBusca] = useState('');
  const [filtros, setFiltros] = useState({ tipo: '', empreiteira: '', situacao: '' });
  const [resultados, setResultados] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState('');

  const carregar = useCallback(async (params) => {
    setCarregando(true);
    setErro('');
    try {
      const dados = await listAlvaras(params);
      setResultados(dados);
    } catch (err) {
      setErro(err.message);
    } finally {
      setCarregando(false);
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      carregar({ ...filtros, busca });
    }, 300);
    return () => clearTimeout(timer);
  }, [busca, filtros, carregar]);

  async function handleChangeData(id, novaData) {
    const atualizado = await updateAlvara(id, { dataMarcada: novaData });
    setResultados((atual) => atual.map((a) => (a._id === id ? atualizado : a)));
  }

  const temFiltros = busca || filtros.tipo || filtros.empreiteira || filtros.situacao;

  return (
    <div>
      <div className="pb-6 mb-8 border-b border-gray-200 flex items-end justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Pesquisar Alvará</h1>
          <p className="mt-1 text-sm text-gray-500">Busque por número, modelo, empreiteira ou situação.</p>
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-md p-5 mb-6">
        <div className="relative">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar por número do projeto..."
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 border border-gray-300 bg-white rounded text-sm placeholder:text-gray-400 focus:border-blue-500 transition-colors"
          />
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-2.5">
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

          {temFiltros && (
            <button
              onClick={() => { setBusca(''); setFiltros({ tipo: '', empreiteira: '', situacao: '' }); }}
              className="px-3 py-2 text-sm text-gray-500 hover:text-gray-800 transition-colors cursor-pointer"
            >
              Limpar filtros
            </button>
          )}
        </div>
      </div>

      {erro && (
        <div className="mb-4 px-4 py-3 bg-red-50 border border-red-200 text-red-700 rounded text-sm">{erro}</div>
      )}

      {carregando ? (
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white border border-gray-200 rounded p-5 animate-pulse">
              <div className="flex items-center gap-4">
                <div className="w-1 h-10 bg-gray-100 rounded" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-gray-100 rounded w-1/4" />
                  <div className="h-3 bg-gray-100 rounded w-1/3" />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : resultados.length === 0 ? (
        <div className="bg-white border border-gray-200 rounded-md p-14 text-center">
          <Inbox size={36} className="mx-auto text-gray-300 mb-3" />
          <p className="text-gray-500 text-sm">
            {temFiltros ? 'Nenhum alvará encontrado com esses filtros.' : 'Nenhum alvará cadastrado ainda.'}
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {resultados.map((a) => {
            const corNumero = corDoNumero(a);
            const corTipo = corDoTipo(a);

            return (
              <div
                key={a._id}
                onClick={() => abrirDetalhe(a.numeroProjeto)}
                className={`flex items-center justify-between gap-4 bg-white border border-gray-200 border-l-4 rounded px-5 py-4 cursor-pointer hover:border-gray-300 transition-colors ${COR_BAR[corNumero]}`}
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2.5 mb-1.5 flex-wrap">
                    <span className={`text-sm font-semibold ${COR_TEXTO[corNumero]}`}>
                      {a.numeroProjeto}
                    </span>
                    <span className={`inline-flex items-center px-2 py-0.5 text-[11px] font-medium rounded ${SITUACAO_BADGE[a.situacao]}`}>
                      {SITUACAO_LABEL[a.situacao]}
                    </span>
                    <span className={`inline-flex items-center px-2 py-0.5 text-[11px] font-medium rounded ${
                      corTipo === 'vermelho' ? 'bg-red-50 text-red-700' :
                      corTipo === 'roxo' ? 'bg-purple-50 text-purple-700' :
                      'bg-gray-100 text-gray-600'
                    }`}>
                      {a.tipo}
                    </span>
                    {a.empreiteira && (
                      <span className="text-xs text-gray-500">({a.empreiteira})</span>
                    )}
                  </div>
                  <p className="text-xs text-gray-500 truncate">
                    {a.responsavel ? `Responsável: ${a.responsavel}` : 'Sem responsável atribuído'}
                  </p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <Calendar size={14} className="text-gray-400" />
                  <input
                    type="date"
                    value={paraInputDate(a.dataMarcada || a.createdAt)}
                    onClick={(e) => e.stopPropagation()}
                    onChange={(e) => handleChangeData(a._id, e.target.value)}
                    className="border border-gray-300 rounded px-2 py-1.5 text-xs font-medium text-gray-600 focus:border-blue-500 transition-colors"
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}

      {!carregando && resultados.length > 0 && (
        <p className="mt-4 text-xs text-gray-400 text-right">
          {resultados.length} alvará{resultados.length !== 1 ? 's' : ''}
        </p>
      )}
    </div>
  );
}