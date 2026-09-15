import { useEffect, useState } from 'react';
import { Users, UserPlus, Trash2, Pencil, AlertCircle, Check } from 'lucide-react';
import { listUsuarios, createUsuario, updateUsuario, deleteUsuario } from '../usuariosApi.js';
import { listEmpreiteiras } from '../empreiteirasApi.js';

const inputCls =
  'w-full px-3.5 py-2.5 border border-gray-300 bg-white rounded text-sm text-copel-grafite placeholder:text-copel-cinza-medio focus:border-copel-laranja transition-colors';

const vazio = { nome: '', email: '', chaveAcesso: '', senha: '', tipo: 'COPEL', empreiteira: '' };

export default function UsuariosAdmin({ usuarioLogado }) {
  const [usuarios, setUsuarios] = useState([]);
  const [empreiteiras, setEmpreiteiras] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState('');
  const [sucesso, setSucesso] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [editandoId, setEditandoId] = useState(null);
  const [form, setForm] = useState(vazio);
  const [confirmandoId, setConfirmandoId] = useState(null);

  async function carregar() {
    setCarregando(true);
    setErro('');
    try {
      setUsuarios(await listUsuarios());
    } catch (err) {
      setErro(err.message);
    } finally {
      setCarregando(false);
    }
  }

  useEffect(() => {
    carregar();
    listEmpreiteiras({ somenteAtivas: true }).then(setEmpreiteiras).catch(() => setEmpreiteiras([]));
  }, []);

  function iniciarEdicao(usuario) {
    setEditandoId(usuario.id);
    setForm({
      nome: usuario.nome,
      email: usuario.email || '',
      chaveAcesso: usuario.chaveAcesso || '',
      senha: '',
      tipo: usuario.tipo,
      empreiteira: usuario.empreiteira || '',
    });
    setErro('');
  }

  function cancelarEdicao() {
    setEditandoId(null);
    setForm(vazio);
    setErro('');
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setErro('');
    setSucesso(false);
    setEnviando(true);
    try {
      const payload = {
        nome: form.nome,
        email: form.email || undefined,
        chaveAcesso: form.chaveAcesso || undefined,
        tipo: form.tipo,
        empreiteira: form.tipo === 'EMPREITEIRA' ? form.empreiteira : undefined,
      };
      if (form.senha) payload.senha = form.senha;

      if (editandoId) {
        await updateUsuario(editandoId, payload);
      } else {
        if (!form.senha) throw new Error('Informe uma senha para o novo usuário.');
        await createUsuario(payload);
      }

      cancelarEdicao();
      setSucesso(true);
      setTimeout(() => setSucesso(false), 3000);
      await carregar();
    } catch (err) {
      setErro(err.message);
    } finally {
      setEnviando(false);
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
      await deleteUsuario(id);
      setConfirmandoId(null);
      if (editandoId === id) cancelarEdicao();
      await carregar();
    } catch (err) {
      setErro(err.message);
    }
  }

  return (
    <div>
      <div className="pb-6 mb-8 border-b border-gray-200">
        <h1 className="text-xl font-semibold text-copel-grafite">Usuários</h1>
        <p className="mt-1 text-sm text-copel-cinza-medio">
          Funcionários COPEL enxergam todos os alvarás. Usuários de empreiteira só veem os alvarás PARTICULAR da própria empreiteira.
        </p>
      </div>

      <div className="bg-white border border-gray-200 rounded-md shadow-sm p-6 sm:p-8 mb-6">
        <h2 className="text-sm font-semibold text-copel-grafite mb-4">
          {editandoId ? 'Editar usuário' : 'Novo usuário'}
        </h2>
        <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block mb-1.5 text-xs font-medium text-copel-cinza-medio">Nome</label>
            <input
              type="text"
              value={form.nome}
              onChange={(e) => setForm({ ...form, nome: e.target.value })}
              required
              className={inputCls}
            />
          </div>

          <div>
            <label className="block mb-1.5 text-xs font-medium text-copel-cinza-medio">Tipo</label>
            <select
              value={form.tipo}
              onChange={(e) => setForm({ ...form, tipo: e.target.value, empreiteira: '' })}
              className={inputCls}
            >
              <option value="COPEL">COPEL (acesso total)</option>
              <option value="EMPREITEIRA">Empreiteira (acesso restrito)</option>
            </select>
          </div>

          <div>
            <label className="block mb-1.5 text-xs font-medium text-copel-cinza-medio">
              E-mail {form.tipo === 'COPEL' ? '' : '(login)'}
            </label>
            <input
              type="email"
              placeholder="nome@copel.com"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              className={inputCls}
            />
          </div>

          {form.tipo === 'COPEL' ? (
            <div>
              <label className="block mb-1.5 text-xs font-medium text-copel-cinza-medio">
                Chave de acesso <span className="font-normal">(opcional)</span>
              </label>
              <input
                type="text"
                placeholder="Ex: C807766"
                value={form.chaveAcesso}
                onChange={(e) => setForm({ ...form, chaveAcesso: e.target.value })}
                className={inputCls}
              />
            </div>
          ) : (
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
              Senha {editandoId ? <span className="font-normal">(deixe em branco para manter a atual)</span> : ''}
            </label>
            <input
              type="password"
              placeholder="••••••••"
              value={form.senha}
              onChange={(e) => setForm({ ...form, senha: e.target.value })}
              className={inputCls}
            />
          </div>

          {sucesso && (
            <div className="sm:col-span-2 flex items-center gap-2 px-3.5 py-2.5 bg-green-50 border border-green-200 text-green-700 rounded text-sm">
              <Check size={16} />
              Usuário salvo com sucesso!
            </div>
          )}
          {erro && (
            <div className="sm:col-span-2 flex items-center gap-2 px-3.5 py-2.5 bg-red-50 border border-red-200 text-red-700 rounded text-sm">
              <AlertCircle size={16} />
              {erro}
            </div>
          )}

          <div className="sm:col-span-2 flex justify-end gap-2 border-t border-gray-100 pt-6">
            {editandoId && (
              <button
                type="button"
                onClick={cancelarEdicao}
                className="px-4 py-2.5 bg-white border border-gray-300 text-copel-grafite text-sm font-medium rounded hover:bg-copel-cinza active:scale-[0.97] transition-all cursor-pointer"
              >
                Cancelar
              </button>
            )}
            <button
              type="submit"
              disabled={enviando}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-copel-laranja text-white text-sm font-medium rounded hover:brightness-90 disabled:bg-gray-200 disabled:text-copel-cinza-medio disabled:cursor-not-allowed transition-colors cursor-pointer"
            >
              <UserPlus size={16} />
              {enviando ? 'Salvando...' : editandoId ? 'Salvar alterações' : 'Adicionar usuário'}
            </button>
          </div>
        </form>
      </div>

      <div className="bg-white border border-gray-200 rounded-md shadow-sm overflow-hidden">
        {carregando ? (
          <div className="p-8 text-center text-sm text-copel-cinza-medio">Carregando...</div>
        ) : usuarios.length === 0 ? (
          <div className="p-8 text-center">
            <Users size={28} className="mx-auto text-gray-300 mb-2" />
            <p className="text-sm text-copel-cinza-medio">Nenhum usuário cadastrado ainda.</p>
          </div>
        ) : (
          <ul>
            {usuarios.map((u) => (
              <li
                key={u.id}
                className="flex items-center justify-between gap-3 px-5 py-3 border-b border-gray-100 last:border-0"
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-medium text-copel-grafite truncate">{u.nome}</span>
                    <span
                      className={`inline-flex items-center px-2 py-0.5 text-[11px] font-medium rounded shrink-0 ${
                        u.tipo === 'COPEL' ? 'bg-copel-laranja/10 text-copel-laranja' : 'bg-blue-50 text-blue-700'
                      }`}
                    >
                      {u.tipo === 'COPEL' ? 'COPEL' : u.empreiteira}
                    </span>
                  </div>
                  <p className="text-xs text-copel-cinza-medio truncate">
                    {[u.email, u.chaveAcesso].filter(Boolean).join(' · ') || '—'}
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => iniciarEdicao(u)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-gray-300 text-copel-grafite text-xs font-medium rounded hover:bg-copel-cinza active:scale-[0.97] transition-all cursor-pointer"
                  >
                    <Pencil size={13} />
                    Editar
                  </button>
                  <button
                    onClick={() => handleExcluir(u.id)}
                    disabled={u.id === usuarioLogado?.id}
                    title={u.id === usuarioLogado?.id ? 'Você não pode excluir o próprio usuário' : undefined}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded active:scale-[0.97] transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed ${
                      confirmandoId === u.id
                        ? 'bg-red-600 text-white hover:bg-red-700'
                        : 'bg-white border border-gray-300 text-red-600 hover:bg-red-50'
                    }`}
                  >
                    {confirmandoId === u.id ? (
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
