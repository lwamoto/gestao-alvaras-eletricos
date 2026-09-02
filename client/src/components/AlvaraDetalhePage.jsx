import { useEffect, useState } from 'react';
import { getAlvaraPorProjeto, updateAlvara, deleteAlvara } from '../api.js';
import { corDoTipo, corDoNumero } from '../cores.js';

const SITUACOES = ['A_FAZER', 'ENVIADO', 'RECEBIDO'];

function formatarData(iso) {
  return new Date(iso).toLocaleString('pt-BR');
}

function formToState(dados) {
  return {
    numeroProjeto: dados.numeroProjeto,
    situacao: dados.situacao,
    responsavel: dados.responsavel || '',
    ruaPrincipal: dados.ruaPrincipal || '',
    transversal1: dados.transversal1 || '',
    transversal2: dados.transversal2 || '',
    qtdPostes: dados.qtdPostes || 0,
    qtdCaboM: dados.qtdCaboM || 0,
    prioridade: dados.prioridade || false,
  };
}

export default function AlvaraDetalhePage({ numeroProjeto }) {
  const [alvara, setAlvara] = useState(null);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState('');
  const [editando, setEditando] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const [form, setForm] = useState(null);

  useEffect(() => {
    (async () => {
      const dados = await getAlvaraPorProjeto(numeroProjeto);
      if (!dados) {
        setErro('Alvará não encontrado.');
      } else {
        setAlvara(dados);
        setForm(formToState(dados));
      }
      setCarregando(false);
    })();
  }, [numeroProjeto]);

  function handleCancelar() {
    setForm(formToState(alvara));
    setEditando(false);
  }

  async function handleSalvar() {
    setSalvando(true);
    try {
      const atualizado = await updateAlvara(alvara._id, form);
      if (atualizado.numeroProjeto !== alvara.numeroProjeto) {
        window.history.replaceState(null, '', `/?projeto=${encodeURIComponent(atualizado.numeroProjeto)}`);
      }
      setAlvara(atualizado);
      setEditando(false);
    } catch (err) {
      setErro(err.message);
    } finally {
      setSalvando(false);
    }
  }

  async function handleExcluir() {
    if (!window.confirm(`Excluir o projeto ${alvara.numeroProjeto}?`)) return;
    await deleteAlvara(alvara._id);
    window.location.href = '/?view=pesquisar';
  }

  if (carregando) return <div className="container">Carregando...</div>;
  if (erro && !alvara) return <div className="container erro">{erro}</div>;

  return (
    <div className="container detalhe-page">
      <button className="voltar" onClick={() => (window.location.href = '/?view=pesquisar')}>
        ← Voltar para a lista
      </button>

      <h1 className={`cor-${corDoNumero(alvara)}`}>Projeto {alvara.numeroProjeto}</h1>
      <span className={`badge cor-${corDoTipo(alvara)}`}>{alvara.tipo}</span>
      {alvara.prioridade && alvara.situacao !== 'RECEBIDO' && (
        <span className="badge cor-vermelho">PRIORIDADE</span>
      )}

      <div className="detalhe-secao">
        <div className="modal-linha">
          <span className="modal-label">Número do projeto</span>
          {editando ? (
            <input
              value={form.numeroProjeto}
              onChange={(e) => setForm({ ...form, numeroProjeto: e.target.value })}
            />
          ) : (
            <span className="modal-valor">{alvara.numeroProjeto}</span>
          )}
        </div>
        <div className="modal-linha">
          <span className="modal-label">Incluído por</span>
          <span className="modal-valor">{alvara.incluidoPor}</span>
        </div>
        {alvara.tipo === 'PARTICULAR' && (
          <div className="modal-linha">
            <span className="modal-label">Empreiteira</span>
            <span className="modal-valor">{alvara.empreiteira}</span>
          </div>
        )}
        <div className="modal-linha">
          <span className="modal-label">Criado em</span>
          <span className="modal-valor">{formatarData(alvara.createdAt)}</span>
        </div>
      </div>

      <div className="detalhe-secao">
        <div className="modal-linha">
          <span className="modal-label">Situação</span>
          {editando ? (
            <select
              value={form.situacao}
              onChange={(e) => setForm({ ...form, situacao: e.target.value })}
            >
              {SITUACOES.map((s) => (
                <option key={s} value={s}>
                  {s.replace('_', ' ')}
                </option>
              ))}
            </select>
          ) : (
            <span className="modal-valor">{alvara.situacao.replace('_', ' ')}</span>
          )}
        </div>
        <div className="modal-linha">
          <span className="modal-label">Prioridade</span>
          {editando ? (
            <input
              type="checkbox"
              checked={form.prioridade}
              onChange={(e) => setForm({ ...form, prioridade: e.target.checked })}
            />
          ) : (
            <span className="modal-valor">{alvara.prioridade ? 'Sim' : 'Não'}</span>
          )}
        </div>
        <div className="modal-linha">
          <span className="modal-label">Responsável</span>
          {editando ? (
            <input
              value={form.responsavel}
              onChange={(e) => setForm({ ...form, responsavel: e.target.value })}
              placeholder="Quem está tratando esse alvará"
            />
          ) : (
            <span className="modal-valor">{alvara.responsavel || 'Não atribuído'}</span>
          )}
        </div>
      </div>

      <div className="detalhe-secao">
        <h2>Endereço e quantitativo</h2>
        <div className="modal-linha">
          <span className="modal-label">Rua Principal</span>
          {editando ? (
            <input
              value={form.ruaPrincipal}
              onChange={(e) => setForm({ ...form, ruaPrincipal: e.target.value })}
            />
          ) : (
            <span className="modal-valor">{alvara.ruaPrincipal || '—'}</span>
          )}
        </div>
        <div className="modal-linha">
          <span className="modal-label">Rua Transversal 1</span>
          {editando ? (
            <input
              value={form.transversal1}
              onChange={(e) => setForm({ ...form, transversal1: e.target.value })}
            />
          ) : (
            <span className="modal-valor">{alvara.transversal1 || '—'}</span>
          )}
        </div>
        <div className="modal-linha">
          <span className="modal-label">Rua Transversal 2</span>
          {editando ? (
            <input
              value={form.transversal2}
              onChange={(e) => setForm({ ...form, transversal2: e.target.value })}
            />
          ) : (
            <span className="modal-valor">{alvara.transversal2 || '—'}</span>
          )}
        </div>
        <div className="modal-linha">
          <span className="modal-label">Qtd total de postes</span>
          {editando ? (
            <input
              type="number"
              min="0"
              value={form.qtdPostes}
              onChange={(e) => setForm({ ...form, qtdPostes: Number(e.target.value) })}
            />
          ) : (
            <span className="modal-valor">{alvara.qtdPostes}</span>
          )}
        </div>
        <div className="modal-linha">
          <span className="modal-label">Qtd (m) de cabo</span>
          {editando ? (
            <input
              type="number"
              min="0"
              step="0.01"
              value={form.qtdCaboM}
              onChange={(e) => setForm({ ...form, qtdCaboM: Number(e.target.value) })}
            />
          ) : (
            <span className="modal-valor">{alvara.qtdCaboM}</span>
          )}
        </div>
      </div>

      {erro && <p className="erro">{erro}</p>}

      <div className="modal-acoes">
        {editando ? (
          <>
            <button className="botao-secundario" onClick={handleCancelar} disabled={salvando}>
              Cancelar
            </button>
            <button className="botao-primario" onClick={handleSalvar} disabled={salvando}>
              {salvando ? 'Salvando...' : 'Salvar'}
            </button>
          </>
        ) : (
          <>
            <button className="botao-primario" onClick={() => setEditando(true)}>
              Alterar
            </button>
            <button className="excluir" onClick={handleExcluir}>
              Excluir
            </button>
          </>
        )}
      </div>
    </div>
  );
}
