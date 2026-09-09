import { useState } from 'react';
import { FilePlus, ChevronDown, Check, AlertCircle } from 'lucide-react';
import { TIPOS, EMPREITEIRAS } from '../constants.js';

const vazio = {
  incluidoPor: '',
  numeroProjeto: '',
  tipo: '',
  empreiteira: '',
  responsavel: '',
};

const corTag = {
  POO: 'bg-purple-50 text-purple-700 border border-purple-200',
  CONSUMIDOR: 'bg-gray-100 text-gray-700 border border-gray-200',
  PARTICULAR: 'bg-red-50 text-red-700 border border-red-200',
};

const inputCls =
  'w-full px-3.5 py-2.5 border border-gray-300 bg-white rounded text-sm text-gray-900 placeholder:text-gray-400 focus:border-blue-500 transition-colors';

export default function AlvaraForm({ onCreate }) {
  const [form, setForm] = useState(vazio);
  const [erro, setErro] = useState('');
  const [sucesso, setSucesso] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [tipoAberto, setTipoAberto] = useState(false);

  function escolherTipo(tipo) {
    setForm({ ...form, tipo, empreiteira: tipo === 'PARTICULAR' ? form.empreiteira : '' });
    if (tipo !== 'PARTICULAR') setTipoAberto(false);
  }

  async function handleSubmit(e) {
    e.preventDefault();
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
      <div className="pb-6 mb-8 border-b border-gray-200">
        <h1 className="text-xl font-semibold text-gray-900">Cadastrar Alvará</h1>
        <p className="mt-1 text-sm text-gray-500">
          Preencha os dados abaixo para criar um novo registro.
        </p>
      </div>

      <div className="bg-white border border-gray-200 rounded-md">
        <form onSubmit={handleSubmit} className="p-6 sm:p-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div>
              <label className="block mb-1.5 text-xs font-medium text-gray-600">
                Incluído por
              </label>
              <input
                type="text"
                placeholder="Nome de quem cadastra"
                value={form.incluidoPor}
                onChange={(e) => setForm({ ...form, incluidoPor: e.target.value })}
                required
                className={inputCls}
              />
            </div>

            <div>
              <label className="block mb-1.5 text-xs font-medium text-gray-600">
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
              <label className="block mb-1.5 text-xs font-medium text-gray-600">Modelo</label>
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setTipoAberto((v) => !v)}
                  className="w-full flex items-center justify-between px-3.5 py-2.5 border border-gray-300 bg-white rounded text-sm text-left hover:border-gray-400 transition-colors cursor-pointer"
                >
                  {form.tipo ? (
                    <span className={`inline-flex items-center px-2 py-0.5 text-xs font-semibold rounded ${corTag[form.tipo]}`}>
                      {form.tipo}
                    </span>
                  ) : (
                    <span className="text-gray-400">Selecione o modelo</span>
                  )}
                  <ChevronDown size={16} className={`text-gray-400 transition-transform ${tipoAberto ? 'rotate-180' : ''}`} />
                </button>

                {tipoAberto && (
                  <div className="absolute top-full left-0 right-0 mt-1.5 bg-white border border-gray-200 rounded shadow-sm z-10 py-1">
                    {TIPOS.map((t) => (
                      <button
                        key={t.valor}
                        type="button"
                        onClick={() => escolherTipo(t.valor)}
                        className={`w-full flex items-center gap-3 px-3.5 py-2.5 text-sm hover:bg-gray-50 transition-colors cursor-pointer ${
                          form.tipo === t.valor ? 'font-medium' : ''
                        }`}
                      >
                        <span className={`inline-flex items-center px-2 py-0.5 text-xs font-semibold rounded ${corTag[t.valor]}`}>
                          {t.valor}
                        </span>
                        <span className="text-xs text-gray-500">
                          {t.valor === 'CONSUMIDOR' && 'Cliente direto'}
                          {t.valor === 'PARTICULAR' && 'Via empreiteira'}
                          {t.valor === 'POO' && 'Tipo raro, sem empreiteira'}
                        </span>
                        {form.tipo === t.valor && <Check size={15} className="text-blue-600 ml-auto" />}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {form.tipo === 'PARTICULAR' && (
              <div>
                <label className="block mb-1.5 text-xs font-medium text-gray-600">Empreiteira</label>
                <select
                  value={form.empreiteira}
                  onChange={(e) => setForm({ ...form, empreiteira: e.target.value })}
                  required
                  className={inputCls}
                >
                  <option value="">Selecione a empreiteira</option>
                  {EMPREITEIRAS.map((emp) => (
                    <option key={emp} value={emp}>{emp}</option>
                  ))}
                </select>
              </div>
            )}

            <div className="sm:col-span-2">
              <label className="block mb-1.5 text-xs font-medium text-gray-600">
                Responsável <span className="text-gray-400 font-normal">(opcional)</span>
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

          {sucesso && (
            <div className="mt-6 flex items-center gap-2 px-3.5 py-2.5 bg-green-50 border border-green-200 text-green-700 rounded text-sm">
              <Check size={16} />
              Alvará cadastrado com sucesso!
            </div>
          )}

          {erro && (
            <div className="mt-6 flex items-center gap-2 px-3.5 py-2.5 bg-red-50 border border-red-200 text-red-700 rounded text-sm">
              <AlertCircle size={16} />
              {erro}
            </div>
          )}

          <div className="mt-8 flex justify-end border-t border-gray-100 pt-6">
            <button
              type="submit"
              disabled={enviando || !form.tipo}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white text-sm font-medium rounded hover:bg-blue-700 disabled:bg-gray-200 disabled:text-gray-400 disabled:cursor-not-allowed transition-colors cursor-pointer"
            >
              <FilePlus size={16} />
              {enviando ? 'Salvando...' : 'Adicionar Alvará'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}