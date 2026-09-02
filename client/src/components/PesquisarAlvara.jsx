import { useEffect, useState, useCallback } from 'react';
import { listAlvaras, updateAlvara } from '../api.js';
import { TIPOS, EMPREITEIRAS } from '../constants.js';
import { corDoTipo, corDoNumero } from '../cores.js';

function abrirDetalhe(numeroProjeto) {
  window.open(`/?projeto=${encodeURIComponent(numeroProjeto)}`, '_blank');
}

function paraInputDate(iso) {
  return new Date(iso).toISOString().slice(0, 10);
}

export default function PesquisarAlvara() {
  const [busca, setBusca] = useState('');
  const [filtros, setFiltros] = useState({ tipo: '', empreiteira: '' });
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

  return (
    <div className="pagina-pesquisar">
      <h1>Controle de Alvará</h1>

      <label className="pesquisar-label">PESQUISAR PROJETO:</label>
      <input
        className="pesquisar-input"
        placeholder="Número do projeto..."
        value={busca}
        onChange={(e) => setBusca(e.target.value)}
      />

      <div className="filtrar-por">
        <span>FILTRAR POR:</span>
        <select value={filtros.tipo} onChange={(e) => setFiltros({ ...filtros, tipo: e.target.value })}>
          <option value="">Modelo</option>
          {TIPOS.map((t) => (
            <option key={t.valor} value={t.valor}>
              {t.valor}
            </option>
          ))}
        </select>
        <select
          value={filtros.empreiteira}
          onChange={(e) => setFiltros({ ...filtros, empreiteira: e.target.value })}
        >
          <option value="">Empreiteira</option>
          {EMPREITEIRAS.map((emp) => (
            <option key={emp} value={emp}>
              {emp}
            </option>
          ))}
        </select>
      </div>

      {erro && <p className="erro">{erro}</p>}
      {carregando ? (
        <p>Carregando...</p>
      ) : resultados.length === 0 ? (
        <p className="vazio">Nenhum alvará encontrado.</p>
      ) : (
        <ul className="resultados-lista">
          {resultados.map((a) => (
            <li key={a._id}>
              <span className="resultado-clicavel" onClick={() => abrirDetalhe(a.numeroProjeto)}>
                <span className={`cor-${corDoNumero(a)}`}>{a.situacao.replace('_', ' ')}</span>
                {' | '}
                <span className={`cor-${corDoNumero(a)}`}>{a.numeroProjeto}</span>
                {' | '}
                <span className={`cor-${corDoTipo(a)}`}>
                  {a.tipo}
                  {a.empreiteira && ` (${a.empreiteira})`}
                </span>
                {' | '}
              </span>
              <input
                type="date"
                className="data-marcada"
                value={paraInputDate(a.dataMarcada || a.createdAt)}
                onClick={(e) => e.stopPropagation()}
                onChange={(e) => handleChangeData(a._id, e.target.value)}
              />
              <span className="resultado-clicavel" onClick={() => abrirDetalhe(a.numeroProjeto)}>
                {' | '}
                {a.responsavel || 'Não atribuído'}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
