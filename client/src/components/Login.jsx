import { useState } from 'react';
import { AlertCircle, LogIn } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext.jsx';
import { FUNDOS_CADASTRO, indiceFundoAtual } from '../fundoCadastro.js';
import BrandMark from './BrandMark.jsx';

const inputCls =
  'w-full px-3.5 py-2.5 border border-gray-300 bg-white rounded text-sm text-copel-grafite placeholder:text-copel-cinza-medio focus:border-copel-laranja transition-colors';

export default function Login() {
  const { login } = useAuth();
  const [identificador, setIdentificador] = useState('');
  const [senha, setSenha] = useState('');
  const [erro, setErro] = useState('');
  const [enviando, setEnviando] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setErro('');
    setEnviando(true);
    try {
      await login(identificador, senha);
    } catch (err) {
      setErro(err.message);
    } finally {
      setEnviando(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="fixed inset-0 -z-10">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url(${FUNDOS_CADASTRO[indiceFundoAtual()]})` }}
        />
        <div className="absolute inset-0 bg-white/75" />
      </div>

      <div className="w-full max-w-sm bg-white border border-gray-200 rounded-md shadow-sm p-6 sm:p-8 animate-[rise-in_400ms_var(--ease-fluid)]">
        <div className="flex justify-center mb-6">
          <BrandMark />
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block mb-1.5 text-xs font-medium text-copel-cinza-medio">
              E-mail ou chave de acesso
            </label>
            <input
              type="text"
              placeholder="nome@copel.com ou C807766"
              value={identificador}
              onChange={(e) => setIdentificador(e.target.value)}
              required
              autoFocus
              className={inputCls}
            />
          </div>

          <div>
            <label className="block mb-1.5 text-xs font-medium text-copel-cinza-medio">Senha</label>
            <input
              type="password"
              placeholder="••••••••"
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
              required
              className={inputCls}
            />
          </div>

          {erro && (
            <div className="flex items-center gap-2 px-3.5 py-2.5 bg-red-50 border border-red-200 text-red-700 rounded text-sm animate-[pop-in_180ms_var(--ease-fluid)]">
              <AlertCircle size={16} />
              {erro}
            </div>
          )}

          <button
            type="submit"
            disabled={enviando}
            className="w-full inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-copel-laranja text-white text-sm font-medium rounded hover:brightness-90 disabled:bg-gray-200 disabled:text-copel-cinza-medio disabled:cursor-not-allowed transition-colors cursor-pointer"
          >
            <LogIn size={16} />
            {enviando ? 'Entrando...' : 'Entrar'}
          </button>
        </form>
      </div>
    </div>
  );
}
