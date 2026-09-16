import { useEffect, useRef, useState } from 'react';
import { Bell, CheckCheck, Inbox } from 'lucide-react';
import { listNotificacoes, contarNaoLidas, marcarLida, marcarTodasLidas } from '../notificacoesApi.js';

function tempoRelativo(iso) {
  const diffMs = Date.now() - new Date(iso).getTime();
  const min = Math.floor(diffMs / 60000);
  if (min < 1) return 'agora';
  if (min < 60) return `há ${min} min`;
  const h = Math.floor(min / 60);
  if (h < 24) return `há ${h}h`;
  const d = Math.floor(h / 24);
  return `há ${d}d`;
}

export default function NotificacoesSino({ onAbrirProjeto }) {
  const [aberto, setAberto] = useState(false);
  const [notificacoes, setNotificacoes] = useState([]);
  const [naoLidas, setNaoLidas] = useState(0);
  const [carregado, setCarregado] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    contarNaoLidas().then(setNaoLidas).catch(() => {});
    const id = setInterval(() => {
      contarNaoLidas().then(setNaoLidas).catch(() => {});
    }, 30000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    if (!aberto) return;
    listNotificacoes()
      .then((lista) => {
        setNotificacoes(lista);
        setCarregado(true);
      })
      .catch(() => {});

    function aoClicarFora(e) {
      if (ref.current && !ref.current.contains(e.target)) setAberto(false);
    }
    document.addEventListener('mousedown', aoClicarFora);
    return () => document.removeEventListener('mousedown', aoClicarFora);
  }, [aberto]);

  async function handleClicarNotificacao(notif) {
    setAberto(false);
    if (!notif.lida) {
      setNaoLidas((n) => Math.max(0, n - 1));
      marcarLida(notif._id).catch(() => {});
    }
    onAbrirProjeto(notif.numeroProjeto);
  }

  async function handleMarcarTodasLidas() {
    setNotificacoes((lista) => lista.map((n) => ({ ...n, lida: true })));
    setNaoLidas(0);
    try {
      await marcarTodasLidas();
    } catch {
      /* melhor esforço — próxima abertura corrige o estado */
    }
  }

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setAberto((v) => !v)}
        aria-label="Notificações"
        className="relative p-1.5 rounded text-copel-cinza-medio hover:text-copel-grafite hover:bg-copel-cinza active:scale-90 transition-all cursor-pointer"
      >
        <Bell size={17} />
        {naoLidas > 0 && (
          <span className="absolute top-0.5 right-0.5 w-2 h-2 rounded-full bg-red-500 ring-2 ring-white" />
        )}
      </button>

      {aberto && (
        <div className="absolute left-0 mt-1.5 w-80 max-w-[90vw] bg-white border border-gray-200 rounded-md shadow-lg z-30 origin-top-left animate-[pop-in_160ms_var(--ease-fluid)]">
          <div className="flex items-center justify-between px-4 py-2.5 border-b border-gray-100">
            <span className="text-xs font-semibold text-copel-grafite uppercase tracking-wider">Notificações</span>
            {naoLidas > 0 && (
              <button
                onClick={handleMarcarTodasLidas}
                className="inline-flex items-center gap-1 text-[11px] text-copel-laranja hover:underline cursor-pointer"
              >
                <CheckCheck size={12} />
                Marcar todas como lidas
              </button>
            )}
          </div>

          <div className="max-h-80 overflow-y-auto">
            {!carregado ? (
              <div className="py-8 text-center text-xs text-copel-cinza-medio">Carregando...</div>
            ) : notificacoes.length === 0 ? (
              <div className="py-10 text-center">
                <Inbox size={24} className="mx-auto text-gray-300 mb-2" />
                <p className="text-xs text-copel-cinza-medio">Nenhuma notificação ainda.</p>
              </div>
            ) : (
              <ul>
                {notificacoes.map((n) => (
                  <li key={n._id}>
                    <button
                      onClick={() => handleClicarNotificacao(n)}
                      className={`w-full text-left px-4 py-3 border-b border-gray-100 last:border-0 hover:bg-copel-cinza transition-colors cursor-pointer flex items-start gap-2 ${
                        n.lida ? '' : 'bg-copel-laranja/5'
                      }`}
                    >
                      {!n.lida && <span className="w-1.5 h-1.5 rounded-full bg-copel-laranja mt-1.5 shrink-0" />}
                      <div className={n.lida ? 'pl-3.5' : ''}>
                        <p className="text-xs text-copel-grafite">{n.mensagem}</p>
                        <p className="text-[10px] text-copel-cinza-medio mt-0.5">{tempoRelativo(n.createdAt)}</p>
                      </div>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
