import { useEffect, useRef, useState } from 'react';
import {
  X,
  Trash2,
  Plus,
  LayoutTemplate,
  Activity,
  MapPin,
  Check,
  AlertCircle,
  Printer,
  Bell,
} from 'lucide-react';
import { getAlvaraPorProjeto, updateAlvara, deleteAlvara } from '../api.js';
import { corDoTipo, corDoNumero } from '../cores.js';
import { NATUREZAS_SERVICOS } from '../constants.js';
import { formatarNumeroPlanilha, calcularLarguraArea } from '../planilha.js';
import { useAuth } from '../contexts/AuthContext.jsx';

const SITUACOES = ['A_FAZER', 'ENVIADO', 'RECEBIDO', 'NAO_NECESSARIO'];

const SITUACAO_BADGE = {
  A_FAZER: 'bg-copel-cinza text-copel-grafite',
  ENVIADO: 'bg-blue-50 dark:bg-blue-500/15 text-blue-700 dark:text-blue-400',
  RECEBIDO: 'bg-green-50 dark:bg-green-500/15 text-green-700 dark:text-green-400',
  NAO_NECESSARIO: 'bg-teal-50 dark:bg-teal-500/15 text-teal-700 dark:text-teal-400',
};

const SITUACAO_LABEL = {
  A_FAZER: 'A FAZER',
  ENVIADO: 'ENVIADO',
  RECEBIDO: 'RECEBIDO',
  NAO_NECESSARIO: 'NÃO NECESSÁRIO',
};

const COR_TEXTO = {
  preto: 'text-copel-grafite',
  verde: 'text-green-700',
  vermelho: 'text-red-600',
  roxo: 'text-purple-600',
};

const inputCls =
  'px-3 py-2 border border-gray-300 dark:border-white/15 bg-white dark:bg-[#20232a] rounded text-sm text-copel-grafite placeholder:text-copel-cinza-medio focus:border-copel-laranja transition-colors';

const inputNumCls =
  'px-3 py-2 border border-gray-300 dark:border-white/15 bg-white dark:bg-[#20232a] rounded text-sm text-copel-grafite placeholder:text-copel-cinza-medio focus:border-copel-laranja transition-colors w-full';

const LARGURA_MIN = 420;
const LARGURA_MAX = 1100;
const LARGURA_PADRAO = 640;

function larguraInicial() {
  try {
    const salva = parseInt(localStorage.getItem('sca:painelLargura'), 10);
    if (Number.isFinite(salva)) return Math.min(LARGURA_MAX, Math.max(LARGURA_MIN, salva));
  } catch {
    /* localStorage indisponível — usa o padrão */
  }
  return LARGURA_PADRAO;
}

function formatarData(iso) {
  return new Date(iso).toLocaleString('pt-BR');
}

function parseFloatSafe(v) {
  const n = parseFloat(String(v).replace(',', '.'));
  return Number.isFinite(n) ? n : 0;
}

function novoEnderecoVazio() {
  const { larguraM, areaM2 } = calcularLarguraArea('5', '');
  return {
    naturezaServico: '5',
    localObra: '',
    transversal1: '',
    transversal2: '',
    qtdExtensao: '',
    larguraM: formatarNumeroPlanilha(larguraM),
    pavimento: '',
    areaM2: formatarNumeroPlanilha(areaM2),
    folhaNumero: '',
  };
}

function formToState(dados) {
  return {
    numeroProjeto: dados.numeroProjeto,
    situacao: dados.situacao,
    responsavel: dados.responsavel || '',
    enderecos: dados.enderecos && dados.enderecos.length > 0
      ? dados.enderecos.map((e) => {
          const naturezaServico = e.naturezaServico || '5';
          const qtdExtensao = e.qtdExtensao !== undefined && e.qtdExtensao !== 0 ? String(e.qtdExtensao) : '';
          // Normaliza largura/área pra regra fixa mesmo em endereços antigos,
          // que podem ter sido salvos antes dessa regra existir.
          const { larguraM, areaM2 } = calcularLarguraArea(naturezaServico, qtdExtensao);
          return {
            naturezaServico,
            localObra: e.localObra || '',
            transversal1: e.transversal1 || '',
            transversal2: e.transversal2 || '',
            qtdExtensao,
            larguraM: formatarNumeroPlanilha(larguraM),
            pavimento: e.pavimento || '',
            areaM2: formatarNumeroPlanilha(areaM2),
            folhaNumero: e.folhaNumero || '',
          };
        })
      : [novoEnderecoVazio()],
    totalPostes: dados.qtdPostes ? String(dados.qtdPostes) : '',
    totalCaboM: dados.qtdCaboM ? String(dados.qtdCaboM) : '',
  };
}

export default function AlvaraDetalhePainel({ numeroProjeto, onFechar, onRenomeado }) {
  const { usuario } = useAuth();
  const podeEditar = usuario?.tipo !== 'EMPREITEIRA';
  const [numeroProjetoExibido, setNumeroProjetoExibido] = useState(numeroProjeto);
  const [painelMontado, setPainelMontado] = useState(!!numeroProjeto);
  const [painelEntrou, setPainelEntrou] = useState(false);
  const [abrirToken, setAbrirToken] = useState(0);
  const [largura, setLargura] = useState(larguraInicial);
  const arrastandoRef = useRef(null);

  const [alvara, setAlvara] = useState(null);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState('');
  const [abaAtiva, setAbaAtiva] = useState('projeto');
  const [editando, setEditando] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const [sucesso, setSucesso] = useState(false);
  const [form, setForm] = useState(null);
  // null | 'excluir' | 'notificar' — só um desses modais por vez, então
  // compartilham a mesma máquina de entrada/saída (modalMounted/Entered).
  const [modalTipo, setModalTipo] = useState(null);
  const [modalMounted, setModalMounted] = useState(false);
  const [modalEntered, setModalEntered] = useState(false);

  // Mantém o painel montado durante a saída (a prop já pode ter virado null) para
  // a transição de slide tocar até o fim, igual ao drawer mobile e ao modal.
  useEffect(() => {
    if (numeroProjeto) {
      // Reseta aba/edição aqui (não no efeito de busca): reabrir o MESMO projeto
      // não muda `numeroProjetoExibido`, então o efeito de busca abaixo não
      // dispararia de novo — isso é o que de fato marca "uma abertura aconteceu".
      setAbaAtiva('projeto');
      setEditando(false);
      setNumeroProjetoExibido(numeroProjeto);
      setAbrirToken((t) => t + 1);
      setPainelMontado(true);
      const raf = requestAnimationFrame(() => setPainelEntrou(true));
      return () => cancelAnimationFrame(raf);
    }
    setPainelEntrou(false);
    const timer = setTimeout(() => setPainelMontado(false), 220);
    return () => clearTimeout(timer);
  }, [numeroProjeto]);

  useEffect(() => {
    if (!numeroProjeto) return;
    function aoTeclar(e) {
      // O modal de exclusão tem seu próprio listener de Esc — se ele estiver
      // aberto, o Esc fecha só ele (camada de cima primeiro), não o painel junto.
      if (e.key === 'Escape' && !modalTipo) onFechar();
    }
    document.addEventListener('keydown', aoTeclar);
    return () => document.removeEventListener('keydown', aoTeclar);
  }, [numeroProjeto, onFechar, modalTipo]);

  useEffect(() => {
    if (!numeroProjetoExibido) return;
    setCarregando(true);
    setErro('');
    (async () => {
      const dados = await getAlvaraPorProjeto(numeroProjetoExibido);
      if (!dados) {
        setErro('Alvará não encontrado.');
      } else {
        setAlvara(dados);
        setForm(formToState(dados));
      }
      setCarregando(false);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [numeroProjetoExibido, abrirToken]);

  useEffect(() => {
    if (modalTipo) {
      setModalMounted(true);
      const raf = requestAnimationFrame(() => setModalEntered(true));
      return () => cancelAnimationFrame(raf);
    }
    setModalEntered(false);
    const timer = setTimeout(() => setModalMounted(false), 160);
    return () => clearTimeout(timer);
  }, [modalTipo]);

  useEffect(() => {
    if (!modalTipo) return;
    function aoTeclar(e) {
      if (e.key === 'Escape') setModalTipo(null);
    }
    document.addEventListener('keydown', aoTeclar);
    return () => document.removeEventListener('keydown', aoTeclar);
  }, [modalTipo]);

  function iniciarArraste(e) {
    arrastandoRef.current = { startX: e.clientX, startWidth: largura, larguraAtual: largura };
    e.currentTarget.setPointerCapture(e.pointerId);
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
  }

  function moverArraste(e) {
    const arr = arrastandoRef.current;
    if (!arr) return;
    const nova = Math.min(LARGURA_MAX, Math.max(LARGURA_MIN, arr.startWidth - (e.clientX - arr.startX)));
    arr.larguraAtual = nova;
    setLargura(nova);
  }

  function finalizarArraste() {
    const arr = arrastandoRef.current;
    if (!arr) return;
    document.body.style.cursor = '';
    document.body.style.userSelect = '';
    try {
      localStorage.setItem('sca:painelLargura', String(arr.larguraAtual));
    } catch {
      /* localStorage indisponível — só não persiste entre sessões */
    }
    arrastandoRef.current = null;
  }

  function handleCancelar() {
    setForm(formToState(alvara));
    setEditando(false);
  }

  function handleSalvarClick() {
    // Só oferece notificar quando a mudança é justamente ENVIADO -> RECEBIDO
    // e existe alguém pra notificar (alvará PARTICULAR com empreiteira).
    const indoParaRecebido =
      alvara.situacao === 'ENVIADO' && form.situacao === 'RECEBIDO' && !!alvara.empreiteira;
    if (indoParaRecebido) {
      setModalTipo('notificar');
      return;
    }
    salvar(false);
  }

  async function salvar(notificar) {
    setModalTipo(null);
    setSalvando(true);
    setErro('');
    try {
      const enderecosPayload = form.enderecos.map((e) => ({
        naturezaServico: e.naturezaServico,
        localObra: e.localObra,
        transversal1: e.transversal1,
        transversal2: e.transversal2,
        qtdExtensao: parseFloatSafe(e.qtdExtensao),
        larguraM: parseFloatSafe(e.larguraM),
        pavimento: e.pavimento,
        areaM2: parseFloatSafe(e.areaM2),
        folhaNumero: e.folhaNumero,
      }));

      const payload = {
        situacao: form.situacao,
        responsavel: form.responsavel,
        enderecos: enderecosPayload,
        qtdPostes: parseFloatSafe(form.totalPostes),
        qtdCaboM: parseFloatSafe(form.totalCaboM),
        notificar,
      };

      if (form.numeroProjeto !== alvara.numeroProjeto) {
        payload.numeroProjeto = form.numeroProjeto;
      }

      const atualizado = await updateAlvara(alvara._id, payload);

      if (atualizado.numeroProjeto !== alvara.numeroProjeto) {
        const params = new URLSearchParams(window.location.search);
        params.set('projeto', atualizado.numeroProjeto);
        window.history.replaceState(null, '', `/?${params.toString()}`);
        setNumeroProjetoExibido(atualizado.numeroProjeto);
        onRenomeado?.(atualizado.numeroProjeto);
      }

      setAlvara(atualizado);
      setForm(formToState(atualizado));
      setEditando(false);
      setSucesso(true);
      setTimeout(() => setSucesso(false), 3000);
    } catch (err) {
      setErro(err.message);
    } finally {
      setSalvando(false);
    }
  }

  function handleExcluir() {
    setModalTipo('excluir');
  }

  async function confirmarExclusao() {
    try {
      await deleteAlvara(alvara._id);
      setModalTipo(null);
      onFechar();
    } catch (err) {
      setErro(err.message);
      setModalTipo(null);
    }
  }

  function atualizarEndereco(idx, campo, valor) {
    setForm((prev) => {
      const enderecos = [...prev.enderecos];
      const atual = { ...enderecos[idx], [campo]: valor };
      // Largura e área não são digitadas — recalculadas a cada mudança de
      // natureza/extensão, seguindo a regra fixa da Planilha de Alvará.
      if (campo === 'naturezaServico' || campo === 'qtdExtensao') {
        const { larguraM, areaM2 } = calcularLarguraArea(atual.naturezaServico, atual.qtdExtensao);
        atual.larguraM = formatarNumeroPlanilha(larguraM);
        atual.areaM2 = formatarNumeroPlanilha(areaM2);
      }
      enderecos[idx] = atual;
      return { ...prev, enderecos };
    });
  }

  function formatarQtdExtensaoAoSair(idx) {
    setForm((prev) => {
      const atual = prev.enderecos[idx];
      if (atual.qtdExtensao === '') return prev;
      const enderecos = [...prev.enderecos];
      enderecos[idx] = { ...atual, qtdExtensao: formatarNumeroPlanilha(atual.qtdExtensao) };
      return { ...prev, enderecos };
    });
  }

  function adicionarEndereco() {
    setForm((prev) => ({
      ...prev,
      enderecos: [...prev.enderecos, novoEnderecoVazio()],
    }));
  }

  function removerEndereco(idx) {
    setForm((prev) => {
      if (prev.enderecos.length <= 1) return prev;
      return { ...prev, enderecos: prev.enderecos.filter((_, i) => i !== idx) };
    });
  }

  if (!painelMontado) return null;

  const corNumero = alvara ? corDoNumero(alvara) : 'preto';
  const corTipo = alvara ? corDoTipo(alvara) : 'preto';

  const TABS = [
    { key: 'projeto', label: 'Projeto', icon: LayoutTemplate },
    { key: 'status', label: 'Status', icon: Activity },
    { key: 'endereco', label: 'Endereço', icon: MapPin },
  ];

  return (
    <>
      <div
        className={`fixed inset-0 z-30 bg-[#000000]/20 dark:bg-black/50 transition-opacity ease-[var(--ease-fluid)] ${
          painelEntrou ? 'opacity-100 duration-[240ms]' : 'opacity-0 duration-[180ms]'
        }`}
        onClick={onFechar}
      />

      <div
        className={`fixed inset-y-0 right-0 z-40 bg-white dark:bg-[#1a1c22] border-l border-gray-200 dark:border-white/10 shadow-xl flex flex-col transition-transform ease-[var(--ease-fluid)] ${
          painelEntrou ? 'translate-x-0 duration-[280ms]' : 'translate-x-full duration-[200ms]'
        }`}
        style={{ width: largura }}
      >
        <div
          onPointerDown={iniciarArraste}
          onPointerMove={moverArraste}
          onPointerUp={finalizarArraste}
          role="separator"
          aria-orientation="vertical"
          aria-label="Redimensionar painel"
          className="absolute left-0 top-0 bottom-0 w-1.5 -translate-x-1/2 cursor-col-resize hover:bg-copel-laranja/20 active:bg-copel-laranja/30 transition-colors z-10 touch-none"
        />

        {carregando ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <div className="w-8 h-8 border-4 border-copel-laranja border-t-transparent rounded-full animate-spin mx-auto mb-3" />
              <p className="text-sm text-copel-cinza-medio">Carregando...</p>
            </div>
          </div>
        ) : erro && !alvara ? (
          <div className="flex-1 flex items-center justify-center px-6">
            <div className="text-center">
              <AlertCircle size={36} className="mx-auto text-red-400 mb-3" />
              <p className="text-sm text-red-600">{erro}</p>
              <button
                onClick={onFechar}
                className="mt-4 text-sm text-copel-laranja hover:underline cursor-pointer"
              >
                Fechar
              </button>
            </div>
          </div>
        ) : (
          <>
            <div className="flex items-start justify-between gap-3 px-5 py-4 border-b border-gray-200 dark:border-white/10 shrink-0">
              <div className="flex items-center gap-2 flex-wrap min-w-0">
                <h1 className={`text-base font-bold truncate ${COR_TEXTO[corNumero]}`}>
                  Projeto {alvara.numeroProjeto}
                </h1>
                <span className={`inline-flex items-center px-2 py-0.5 text-[11px] font-medium rounded shrink-0 ${SITUACAO_BADGE[alvara.situacao]}`}>
                  {SITUACAO_LABEL[alvara.situacao]}
                </span>
                <span className={`inline-flex items-center px-2 py-0.5 text-[11px] font-medium rounded shrink-0 ${
                  corTipo === 'vermelho' ? 'bg-red-50 dark:bg-red-500/15 text-red-700 dark:text-red-400' :
                  corTipo === 'roxo' ? 'bg-purple-50 dark:bg-purple-500/15 text-purple-700 dark:text-purple-400' :
                  'bg-copel-cinza text-copel-grafite'
                }`}>
                  {alvara.tipo}
                </span>
              </div>
              <button
                onClick={onFechar}
                aria-label="Fechar painel"
                className="p-1.5 text-copel-cinza-medio hover:text-copel-grafite hover:bg-copel-cinza rounded transition-colors active:scale-90 cursor-pointer shrink-0"
              >
                <X size={18} />
              </button>
            </div>

            <div className="flex items-center gap-2 px-5 py-3 border-b border-gray-100 dark:border-white/5 shrink-0">
              {!editando ? (
                <>
                  {podeEditar && (
                    <>
                      <button
                        onClick={() => setEditando(true)}
                        className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-copel-laranja text-white text-xs font-medium rounded hover:brightness-90 active:scale-[0.97] transition-all cursor-pointer"
                      >
                        Alterar
                      </button>
                      <button
                        onClick={handleExcluir}
                        className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-white dark:bg-[#20232a] border border-gray-300 dark:border-white/15 text-red-600 dark:text-red-400 text-xs font-medium rounded hover:bg-red-50 dark:hover:bg-red-500/10 active:scale-[0.97] transition-all cursor-pointer"
                      >
                        <Trash2 size={13} />
                        Excluir
                      </button>
                      <button
                        onClick={() => window.open(`/?imprimir=${encodeURIComponent(alvara.numeroProjeto)}`, '_blank')}
                        className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-white dark:bg-[#20232a] border border-gray-300 dark:border-white/15 text-copel-grafite text-xs font-medium rounded hover:bg-copel-cinza active:scale-[0.97] transition-all cursor-pointer"
                      >
                        <Printer size={13} />
                        Imprimir
                      </button>
                    </>
                  )}
                </>
              ) : (
                <>
                  <button
                    onClick={handleCancelar}
                    disabled={salvando}
                    className="px-3.5 py-1.5 bg-white dark:bg-[#20232a] border border-gray-300 dark:border-white/15 text-copel-grafite text-xs font-medium rounded hover:bg-copel-cinza active:scale-[0.97] transition-all cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={handleSalvarClick}
                    disabled={salvando}
                    className="px-3.5 py-1.5 bg-copel-laranja text-white text-xs font-medium rounded hover:brightness-90 disabled:bg-gray-200 dark:disabled:bg-white/10 disabled:text-copel-cinza-medio active:scale-[0.97] transition-all cursor-pointer"
                  >
                    {salvando ? 'Salvando...' : 'Salvar'}
                  </button>
                </>
              )}
            </div>

            <div className="flex-1 min-h-0 overflow-y-auto">
              <div className="px-5 pt-4">
                {sucesso && (
                  <div className="mb-4 flex items-center gap-2 px-3.5 py-2.5 bg-green-50 dark:bg-green-500/10 border border-green-200 dark:border-green-500/30 text-green-700 dark:text-green-400 rounded text-sm animate-[pop-in_180ms_var(--ease-fluid)]">
                    <Check size={16} />
                    Alterações salvas com sucesso!
                  </div>
                )}
                {erro && (
                  <div className="mb-4 flex items-center gap-2 px-3.5 py-2.5 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/30 text-red-700 dark:text-red-400 rounded text-sm animate-[pop-in_180ms_var(--ease-fluid)]">
                    <AlertCircle size={16} />
                    {erro}
                  </div>
                )}
              </div>

              <div className="flex border-b border-gray-200 dark:border-white/10 px-5">
                {TABS.map(({ key, label, icon: Icon }) => (
                  <button
                    key={key}
                    onClick={() => setAbaAtiva(key)}
                    className={`inline-flex items-center gap-1.5 px-4 py-3 text-sm font-medium transition-colors active:scale-[0.98] cursor-pointer ${
                      abaAtiva === key
                        ? 'text-copel-laranja border-b-2 border-copel-laranja -mb-px'
                        : 'text-copel-cinza-medio hover:text-copel-grafite'
                    }`}
                  >
                    <Icon size={15} />
                    {label}
                  </button>
                ))}
              </div>

              <div className="p-5">
                {abaAtiva === 'projeto' && (
                  <div key="projeto" className="space-y-5 animate-[tab-in_200ms_var(--ease-fluid)]">
                    <LinhaCampo label="Número do projeto">
                      {editando ? (
                        <input
                          type="text"
                          value={form.numeroProjeto}
                          onChange={(e) => setForm({ ...form, numeroProjeto: e.target.value })}
                          className={`${inputCls} w-40 text-right`}
                        />
                      ) : (
                        <span className={`text-sm font-semibold ${COR_TEXTO[corNumero]}`}>
                          {alvara.numeroProjeto}
                        </span>
                      )}
                    </LinhaCampo>
                    <LinhaCampo label="Tipo">
                      <span className={`text-sm font-semibold ${
                        corTipo === 'vermelho' ? 'text-red-600' :
                        corTipo === 'roxo' ? 'text-purple-600' :
                        'text-copel-grafite'
                      }`}>
                        {alvara.tipo}
                        {alvara.empreiteira && <span className="text-copel-cinza-medio font-normal ml-2">— {alvara.empreiteira}</span>}
                      </span>
                    </LinhaCampo>
                    <LinhaCampo label="Incluído por">
                      <span className="text-sm text-copel-grafite">{alvara.incluidoPor}</span>
                    </LinhaCampo>
                    <LinhaCampo label="Criado em">
                      <span className="text-sm text-copel-grafite">{formatarData(alvara.createdAt)}</span>
                    </LinhaCampo>
                    {alvara.editadoPor && (
                      <LinhaCampo label="Última alteração">
                        <span className="text-sm text-copel-grafite">
                          {alvara.editadoPor} em {formatarData(alvara.editadoEm)}
                        </span>
                      </LinhaCampo>
                    )}
                  </div>
                )}

                {abaAtiva === 'status' && (
                  <div key="status" className="space-y-5 animate-[tab-in_200ms_var(--ease-fluid)]">
                    <LinhaCampo label="Situação">
                      {editando ? (
                        <select
                          value={form.situacao}
                          onChange={(e) => setForm({ ...form, situacao: e.target.value })}
                          className={`${inputCls} w-48`}
                        >
                          {SITUACOES.map((s) => (
                            <option key={s} value={s}>{SITUACAO_LABEL[s]}</option>
                          ))}
                        </select>
                      ) : (
                        <span className={`inline-flex items-center px-2.5 py-1 text-xs font-medium rounded ${SITUACAO_BADGE[alvara.situacao]}`}>
                          {SITUACAO_LABEL[alvara.situacao]}
                        </span>
                      )}
                    </LinhaCampo>
                    <LinhaCampo label="Responsável">
                      {editando ? (
                        <input
                          type="text"
                          value={form.responsavel}
                          onChange={(e) => setForm({ ...form, responsavel: e.target.value })}
                          placeholder="Quem está tratando"
                          className={`${inputCls} w-64`}
                        />
                      ) : (
                        <span className="text-sm text-copel-grafite">{alvara.responsavel || 'Não atribuído'}</span>
                      )}
                    </LinhaCampo>
                  </div>
                )}

                {abaAtiva === 'endereco' && (
                  <div key="endereco" className="animate-[tab-in_200ms_var(--ease-fluid)]">
                    <div className="mb-8">
                      <h3 className="text-xs font-semibold text-copel-cinza-medio uppercase tracking-wider mb-3">
                        Natureza dos Serviços
                      </h3>
                      <div className="grid grid-cols-1 gap-2.5">
                        {NATUREZAS_SERVICOS.map((n) => {
                          const usada = editando && form.enderecos.some((e) => e.naturezaServico === n.valor);
                          return (
                            <div
                              key={n.valor}
                              className={`flex items-start gap-3 px-4 py-3 rounded border transition-colors ${
                                usada ? 'border-copel-laranja/30 bg-copel-laranja/10' : 'border-gray-200 dark:border-white/10 bg-copel-cinza'
                              }`}
                            >
                              <div className={`w-8 h-8 rounded flex items-center justify-center text-xs font-bold shrink-0 ${
                                usada ? 'bg-copel-laranja text-white' : 'bg-gray-200 dark:bg-white/10 text-copel-cinza-medio'
                              }`}>
                                {n.label}
                              </div>
                              <span className="text-xs text-copel-grafite leading-relaxed pt-1.5">{n.descricao}</span>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-xs font-semibold text-copel-cinza-medio uppercase tracking-wider">
                          Endereços
                        </h3>
                        {editando && (
                          <button
                            onClick={adicionarEndereco}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-copel-laranja border border-copel-laranja/30 rounded hover:bg-copel-laranja/10 transition-colors cursor-pointer"
                          >
                            <Plus size={14} />
                            Adicionar endereço
                          </button>
                        )}
                      </div>

                      {editando ? (
                        <div className="space-y-5">
                          {form.enderecos.map((end, idx) => (
                            <div key={idx} className="border border-gray-200 dark:border-white/10 rounded-md overflow-hidden">
                              <div className="flex items-center justify-between px-5 py-3 bg-copel-cinza border-b border-gray-200 dark:border-white/10">
                                <span className="text-sm font-medium text-copel-grafite">
                                  Endereço {idx + 1}
                                </span>
                                <div className="flex items-center gap-3">
                                  <select
                                    value={end.naturezaServico}
                                    onChange={(e) => atualizarEndereco(idx, 'naturezaServico', e.target.value)}
                                    className="px-2.5 py-1.5 border border-gray-300 dark:border-white/15 bg-white dark:bg-[#20232a] rounded text-xs font-medium focus:border-copel-laranja transition-colors"
                                  >
                                    {NATUREZAS_SERVICOS.map((n) => (
                                      <option key={n.valor} value={n.valor}>{n.label} — {n.descricao}</option>
                                    ))}
                                  </select>
                                  {form.enderecos.length > 1 && (
                                    <button
                                      onClick={() => removerEndereco(idx)}
                                      className="p-1.5 text-copel-cinza-medio hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded transition-colors cursor-pointer"
                                    >
                                      <Trash2 size={14} />
                                    </button>
                                  )}
                                </div>
                              </div>

                              <div className="p-5 space-y-4">
                                <div>
                                  <label className="block mb-1.5 text-xs font-medium text-copel-cinza-medio">Local da obra</label>
                                  <input
                                    id={`InputLocalObra${idx}`}
                                    type="text"
                                    value={end.localObra}
                                    onChange={(e) => atualizarEndereco(idx, 'localObra', e.target.value)}
                                    placeholder="Rua principal"
                                    className={`${inputCls} w-full`}
                                  />
                                </div>

                                <div className="grid grid-cols-1 gap-4">
                                  <div>
                                    <label className="block mb-1.5 text-xs font-medium text-copel-cinza-medio">Transversal — Rua 1</label>
                                    <input
                                      id={`InputTransversal1_${idx}`}
                                      type="text"
                                      value={end.transversal1}
                                      onChange={(e) => atualizarEndereco(idx, 'transversal1', e.target.value)}
                                      placeholder="Rua transversal 1"
                                      className={`${inputCls} w-full`}
                                    />
                                  </div>
                                  <div>
                                    <label className="block mb-1.5 text-xs font-medium text-copel-cinza-medio">Transversal — Rua 2</label>
                                    <input
                                      id={`InputTransversal2_${idx}`}
                                      type="text"
                                      value={end.transversal2}
                                      onChange={(e) => atualizarEndereco(idx, 'transversal2', e.target.value)}
                                      placeholder="Rua transversal 2"
                                      className={`${inputCls} w-full`}
                                    />
                                  </div>
                                </div>

                                <div className="grid grid-cols-2 gap-3">
                                  <div>
                                    <label className="block mb-1.5 text-xs font-medium text-copel-cinza-medio">Qtde/Extensão (m)</label>
                                    <input
                                      id={`InputQtdExtensao_${idx}`}
                                      type="text"
                                      inputMode="decimal"
                                      value={end.qtdExtensao}
                                      onChange={(e) => atualizarEndereco(idx, 'qtdExtensao', e.target.value)}
                                      onBlur={() => formatarQtdExtensaoAoSair(idx)}
                                      placeholder="0"
                                      className={`${inputNumCls} text-center`}
                                    />
                                  </div>
                                  <div>
                                    <label className="block mb-1.5 text-xs font-medium text-copel-cinza-medio">
                                      Largura (m) <span className="font-normal normal-case">— automático</span>
                                    </label>
                                    <input
                                      id={`InputLargura_${idx}`}
                                      type="text"
                                      value={end.larguraM}
                                      disabled
                                      readOnly
                                      className={`${inputNumCls} text-center disabled:bg-copel-cinza dark:disabled:bg-white/5 disabled:cursor-not-allowed`}
                                    />
                                  </div>
                                  <div>
                                    <label className="block mb-1.5 text-xs font-medium text-copel-cinza-medio">Pavimento</label>
                                    <input
                                      id={`InputPavimento_${idx}`}
                                      type="text"
                                      value={end.pavimento}
                                      onChange={(e) => atualizarEndereco(idx, 'pavimento', e.target.value)}
                                      placeholder="Ex: Paver"
                                      className={`${inputCls} w-full`}
                                    />
                                  </div>
                                  <div>
                                    <label className="block mb-1.5 text-xs font-medium text-copel-cinza-medio">
                                      Área (m²) <span className="font-normal normal-case">— automático</span>
                                    </label>
                                    <input
                                      id={`InputArea_${idx}`}
                                      type="text"
                                      value={end.areaM2}
                                      disabled
                                      readOnly
                                      className={`${inputNumCls} text-center disabled:bg-copel-cinza dark:disabled:bg-white/5 disabled:cursor-not-allowed`}
                                    />
                                  </div>
                                </div>
                                <div>
                                  <label className="block mb-1.5 text-xs font-medium text-copel-cinza-medio">Folha N°</label>
                                  <input
                                    id={`InputFolha_${idx}`}
                                    type="text"
                                    value={end.folhaNumero}
                                    onChange={(e) => atualizarEndereco(idx, 'folhaNumero', e.target.value)}
                                    placeholder="FL01"
                                    className={`${inputNumCls}`}
                                  />
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="overflow-x-auto">
                          <table className="w-full text-sm border border-gray-200 dark:border-white/10 rounded-md">
                            <thead>
                              <tr className="bg-copel-cinza border-b border-gray-200 dark:border-white/10">
                                <th className="px-3 py-2 text-[10px] font-semibold text-copel-cinza-medio uppercase text-center">Natureza</th>
                                <th className="px-3 py-2 text-[10px] font-semibold text-copel-cinza-medio uppercase text-left">Local da Obra</th>
                                <th className="px-3 py-2 text-[10px] font-semibold text-copel-cinza-medio uppercase text-center">Rua 1</th>
                                <th className="px-3 py-2 text-[10px] font-semibold text-copel-cinza-medio uppercase text-center">Rua 2</th>
                                <th className="px-3 py-2 text-[10px] font-semibold text-copel-cinza-medio uppercase text-center">Qtde/Ext.</th>
                                <th className="px-3 py-2 text-[10px] font-semibold text-copel-cinza-medio uppercase text-center">Largura</th>
                                <th className="px-3 py-2 text-[10px] font-semibold text-copel-cinza-medio uppercase text-center">Pavimento</th>
                                <th className="px-3 py-2 text-[10px] font-semibold text-copel-cinza-medio uppercase text-center">Área</th>
                                <th className="px-3 py-2 text-[10px] font-semibold text-copel-cinza-medio uppercase text-center">Folha</th>
                              </tr>
                            </thead>
                            <tbody>
                              {(alvara.enderecos && alvara.enderecos.length > 0
                                ? alvara.enderecos
                                : [{ naturezaServico: '5', localObra: '', transversal1: '', transversal2: '', qtdExtensao: 0, larguraM: 0, pavimento: '', areaM2: 0, folhaNumero: '' }]
                              ).map((end, idx) => (
                                <tr key={idx} className="border-b border-gray-100 dark:border-white/5 last:border-0">
                                  <td className="px-3 py-2.5 text-center text-xs font-semibold">{end.naturezaServico}</td>
                                  <td className="px-3 py-2.5 text-xs">{end.localObra || '—'}</td>
                                  <td className="px-3 py-2.5 text-xs text-center">{end.transversal1 || '—'}</td>
                                  <td className="px-3 py-2.5 text-xs text-center">{end.transversal2 || '—'}</td>
                                  <td className="px-3 py-2.5 text-xs text-center">{formatarNumeroPlanilha(end.qtdExtensao)}</td>
                                  <td className="px-3 py-2.5 text-xs text-center">{formatarNumeroPlanilha(end.larguraM)}</td>
                                  <td className="px-3 py-2.5 text-xs text-center">{end.pavimento || '—'}</td>
                                  <td className="px-3 py-2.5 text-xs text-center">{formatarNumeroPlanilha(end.areaM2)}</td>
                                  <td className="px-3 py-2.5 text-xs text-center">{end.folhaNumero || '—'}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>

                    <div className="mt-6 grid grid-cols-2 gap-4">
                      <div className="border border-gray-200 dark:border-white/10 rounded-md p-4">
                        <label className="block text-[10px] font-semibold text-copel-cinza-medio uppercase tracking-wider mb-1.5">
                          Total de Postes
                        </label>
                        <div className="flex items-center gap-2">
                          {editando ? (
                            <input
                              type="text"
                              inputMode="decimal"
                              value={form.totalPostes}
                              onChange={(e) => setForm({ ...form, totalPostes: e.target.value })}
                              placeholder="0"
                              className={`${inputCls} w-24 text-center`}
                            />
                          ) : (
                            <span className="text-xl font-bold text-copel-grafite">{alvara.qtdPostes || 0}</span>
                          )}
                          <span className="text-xs text-copel-cinza-medio">UND</span>
                        </div>
                      </div>
                      <div className="border border-gray-200 dark:border-white/10 rounded-md p-4">
                        <label className="block text-[10px] font-semibold text-copel-cinza-medio uppercase tracking-wider mb-1.5">
                          Total de Cabo
                        </label>
                        <div className="flex items-center gap-2">
                          {editando ? (
                            <input
                              type="text"
                              inputMode="decimal"
                              value={form.totalCaboM}
                              onChange={(e) => setForm({ ...form, totalCaboM: e.target.value })}
                              placeholder="0"
                              className={`${inputCls} w-24 text-center`}
                            />
                          ) : (
                            <span className="text-xl font-bold text-copel-grafite">{alvara.qtdCaboM || 0}</span>
                          )}
                          <span className="text-xs text-copel-cinza-medio">m</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </div>

      {modalMounted && (
        <div
          className={`fixed inset-0 z-50 flex items-center justify-center px-4 bg-black/40 dark:bg-black/60 backdrop-blur-[2px] transition-opacity ease-[var(--ease-fluid)] ${
            modalEntered ? 'opacity-100 duration-[180ms]' : 'opacity-0 duration-[140ms]'
          }`}
          onClick={() => setModalTipo(null)}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="titulo-modal-painel"
            className={`bg-white dark:bg-[#1e2127] rounded-lg shadow-xl max-w-sm w-full p-6 origin-center transition-[transform,opacity] ease-[var(--ease-fluid)] ${
              modalEntered ? 'opacity-100 scale-100 duration-[220ms]' : 'opacity-0 scale-95 duration-[140ms]'
            }`}
            onClick={(e) => e.stopPropagation()}
          >
            {modalTipo === 'excluir' ? (
              <>
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-full bg-red-50 dark:bg-red-500/15 text-red-600 dark:text-red-400 flex items-center justify-center shrink-0">
                    <AlertCircle size={20} />
                  </div>
                  <div>
                    <h2 id="titulo-modal-painel" className="text-sm font-semibold text-copel-grafite">
                      Excluir projeto {alvara?.numeroProjeto}?
                    </h2>
                    <p className="mt-1 text-sm text-copel-cinza-medio">Essa ação não pode ser desfeita.</p>
                  </div>
                </div>
                <div className="mt-6 flex justify-end gap-2">
                  <button
                    onClick={() => setModalTipo(null)}
                    className="px-4 py-2 bg-white dark:bg-[#20232a] border border-gray-300 dark:border-white/15 text-copel-grafite text-sm font-medium rounded hover:bg-copel-cinza active:scale-[0.97] transition-all cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={confirmarExclusao}
                    className="px-4 py-2 bg-red-600 text-white text-sm font-medium rounded hover:bg-red-700 active:scale-[0.97] transition-all cursor-pointer"
                  >
                    Excluir
                  </button>
                </div>
              </>
            ) : (
              <>
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-full bg-copel-laranja/10 text-copel-laranja flex items-center justify-center shrink-0">
                    <Bell size={20} />
                  </div>
                  <div>
                    <h2 id="titulo-modal-painel" className="text-sm font-semibold text-copel-grafite">
                      Deseja notificar a empreiteira?
                    </h2>
                    <p className="mt-1 text-sm text-copel-cinza-medio">
                      A {alvara?.empreiteira} vai receber um aviso de que o projeto {alvara?.numeroProjeto} foi recebido.
                    </p>
                  </div>
                </div>
                <div className="mt-6 flex justify-end gap-2">
                  <button
                    onClick={() => salvar(false)}
                    className="px-4 py-2 bg-white dark:bg-[#20232a] border border-gray-300 dark:border-white/15 text-copel-grafite text-sm font-medium rounded hover:bg-copel-cinza active:scale-[0.97] transition-all cursor-pointer"
                  >
                    Não
                  </button>
                  <button
                    onClick={() => salvar(true)}
                    className="px-4 py-2 bg-copel-laranja text-white text-sm font-medium rounded hover:brightness-90 active:scale-[0.97] transition-all cursor-pointer"
                  >
                    Sim, notificar
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}

function LinhaCampo({ label, children }) {
  return (
    <div className="flex items-center justify-between py-3 border-b border-gray-100 dark:border-white/5 last:border-0">
      <span className="text-sm text-copel-cinza-medio">{label}</span>
      <div className="text-sm text-right">{children}</div>
    </div>
  );
}
