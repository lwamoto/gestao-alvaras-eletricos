import { useState } from 'react';
import { TIPOS, EMPREITEIRAS } from '../constants.js';

const vazio = {
  incluidoPor: '',
  numeroProjeto: '',
  tipo: '',
  empreiteira: '',
  responsavel: '',
};

export default function AlvaraForm({ onCreate }) {
  const [form, setForm] = useState(vazio);
  const [erro, setErro] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [modeloAberto, setModeloAberto] = useState(false);

  function escolherTipo(tipo) {
    setForm({ ...form, tipo, empreiteira: tipo === 'PARTICULAR' ? form.empreiteira : '' });
    if (tipo !== 'PARTICULAR') setModeloAberto(false);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setErro('');
    setEnviando(true);
    try {
      await onCreate(form);
      setForm(vazio);
    } catch (err) {
      setErro(err.message);
    } finally {
      setEnviando(false);
    }
  }

  return (
    <div className="pagina-cadastrar">
      <h1>Controle de Alvará</h1>
      <form className="alvara-form" onSubmit={handleSubmit}>
        <input
          placeholder="Incluído por"
          value={form.incluidoPor}
          onChange={(e) => setForm({ ...form, incluidoPor: e.target.value })}
          required
        />
        <input
          placeholder="Número do projeto"
          value={form.numeroProjeto}
          onChange={(e) => setForm({ ...form, numeroProjeto: e.target.value })}
          required
        />

        <div className="modelo-campo">
          <button
            type="button"
            className={`modelo-botao cor-${TIPOS.find((t) => t.valor === form.tipo)?.cor || ''}`}
            onClick={() => setModeloAberto((v) => !v)}
          >
            {form.tipo || 'Modelo'} <span className="seta">▾</span>
          </button>

          {modeloAberto && (
            <div className="modelo-painel">
              {TIPOS.map((t) => (
                <label key={t.valor} className={`cor-${t.cor}`}>
                  <input
                    type="radio"
                    name="tipo"
                    checked={form.tipo === t.valor}
                    onChange={() => escolherTipo(t.valor)}
                  />
                  {t.valor}
                </label>
              ))}
            </div>
          )}

          {modeloAberto && form.tipo === 'PARTICULAR' && (
            <div className="empreiteira-painel">
              <button
                type="button"
                className="empreiteira-fechar"
                onClick={() => setModeloAberto(false)}
              >
                ×
              </button>
              <span className="empreiteira-titulo">EMPREITEIRA</span>
              {EMPREITEIRAS.map((emp) => (
                <label key={emp}>
                  <input
                    type="radio"
                    name="empreiteira"
                    checked={form.empreiteira === emp}
                    onChange={() => setForm({ ...form, empreiteira: emp })}
                  />
                  {emp}
                </label>
              ))}
            </div>
          )}
        </div>

        <input
          placeholder="Responsável (opcional)"
          value={form.responsavel}
          onChange={(e) => setForm({ ...form, responsavel: e.target.value })}
        />
        <button type="submit" className="botao-adicionar" disabled={enviando || !form.tipo}>
          {enviando ? 'Salvando...' : 'Adicionar Alvará'}
        </button>
        {erro && <span className="erro">{erro}</span>}
      </form>
    </div>
  );
}
