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
} from 'lucide-react';
import { getAlvaraPorProjeto, updateAlvara, deleteAlvara } from '../api.js';
import { corDoTipo, corDoNumero } from '../cores.js';
import { NATUREZAS_SERVICOS } from '../constants.js';

const SITUACOES = ['A_FAZER', 'ENVIADO', 'RECEBIDO'];

const SITUACAO_BADGE = {
  A_FAZER: 'bg-gray-100 text-gray-600',
  ENVIADO: 'bg-blue-50 text-blue-700',
  RECEBIDO: 'bg-green-50 text-green-700',
};

const COR_TEXTO = {
  preto: 'text-gray-900',
  verde: 'text-green-700',
  vermelho: 'text-red-600',
  roxo: 'text-purple-600',
};

const inputCls =
  'px-3 py-2 border border-gray-300 bg-white rounded text-sm text-gray-900 placeholder:text-gray-400 focus:border-blue-500 transition-colors';

const inputNumCls =
  'px-3 py-2 border border-gray-300 bg-white rounded text-sm text-gray-900 placeholder:text-gray-400 focus:border-blue-500 transition-colors w-full';

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
  return {
    naturezaServico: '5',
    localObra: '',
    transversal1: '',
    transversal2: '',
    qtdExtensao: '',
    larguraM: '',
    pavimento: '',
    areaM2: '',
    folhaNumero: '',
  };
}

function formToState(dados) {
  return {
    numeroProjeto: dados.numeroProjeto,
    situacao: dados.situacao,
    responsavel: dados.responsavel || '',
    enderecos: dados.enderecos && dados.enderecos.length > 0
      ? dados.enderecos.map((e) => ({
          naturezaServico: e.naturezaServico || '5',
          localObra: e.localObra || '',
          transversal1: e.transversal1 || '',
          transversal2: e.transversal2 || '',
          qtdExtensao: e.qtdExtensao !== undefined && e.qtdExtensao !== 0 ? String(e.qtdExtensao) : '',
          larguraM: e.larguraM !== undefined && e.larguraM !== 0 ? String(e.larguraM) : '',
          pavimento: e.pavimento || '',
          areaM2: e.areaM2 !== undefined && e.areaM2 !== 0 ? String(e.areaM2) : '',
          folhaNumero: e.folhaNumero || '',
        }))
      : [novoEnderecoVazio()],
    totalPostes: dados.qtdPostes ? String(dados.qtdPostes) : '',
    totalCaboM: dados.qtdCaboM ? String(dados.qtdCaboM) : '',
  };
}

export default function AlvaraDetalhePainel({ numeroProjeto, onFechar, onRenomeado }) {
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
  const [confirmandoExclusao, setConfirmandoExclusao] = useState(false);
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
      if (e.key === 'Escape' && !confirmandoExclusao) onFechar();
    }
    document.addEventListener('keydown', aoTeclar);
    return () => document.removeEventListener('keydown', aoTeclar);
  }, [numeroProjeto, onFechar, confirmandoExclusao]);

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
    if (confirmandoExclusao) {
      setModalMounted(true);
      const raf = requestAnimationFrame(() => setModalEntered(true));
      return () => cancelAnimationFrame(raf);
    }
    setModalEntered(false);
    const timer = setTimeout(() => setModalMounted(false), 160);
    return () => clearTimeout(timer);
  }, [confirmandoExclusao]);

  useEffect(() => {
    if (!confirmandoExclusao) return;
    function aoTeclar(e) {
      if (e.key === 'Escape') setConfirmandoExclusao(false);
    }
    document.addEventListener('keydown', aoTeclar);
    return () => document.removeEventListener('keydown', aoTeclar);
  }, [confirmandoExclusao]);

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

  async function handleSalvar() {
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
    setConfirmandoExclusao(true);
  }

  async function confirmarExclusao() {
    try {
      await deleteAlvara(alvara._id);
      setConfirmandoExclusao(false);
      onFechar();
    } catch (err) {
      setErro(err.message);
      setConfirmandoExclusao(false);
    }
  }

  function atualizarEndereco(idx, campo, valor) {
    setForm((prev) => {
      const enderecos = [...prev.enderecos];
      enderecos[idx] = { ...enderecos[idx], [campo]: valor };
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
        className={`fixed inset-0 z-30 bg-gray-900/20 transition-opacity ease-[var(--ease-fluid)] ${
          painelEntrou ? 'opacity-100 duration-[240ms]' : 'opacity-0 duration-[180ms]'
        }`}
        onClick={onFechar}
      />

      <div
        className={`fixed inset-y-0 right-0 z-40 bg-white border-l border-gray-200 shadow-xl flex flex-col transition-transform ease-[var(--ease-fluid)] ${
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
          className="absolute left-0 top-0 bottom-0 w-1.5 -translate-x-1/2 cursor-col-resize hover:bg-blue-200/60 active:bg-blue-300/70 transition-colors z-10 touch-none"
        />

        {carregando ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
              <p className="text-sm text-gray-500">Carregando...</p>
            </div>
          </div>
        ) : erro && !alvara ? (
          <div className="flex-1 flex items-center justify-center px-6">
            <div className="text-center">
              <AlertCircle size={36} className="mx-auto text-red-400 mb-3" />
              <p className="text-sm text-red-600">{erro}</p>
              <button
                onClick={onFechar}
                className="mt-4 text-sm text-blue-600 hover:underline cursor-pointer"
              >
                Fechar
              </button>
            </div>
          </div>
        ) : (
          <>
            <div className="flex items-start justify-between gap-3 px-5 py-4 border-b border-gray-200 shrink-0">
              <div className="flex items-center gap-2 flex-wrap min-w-0">
                <h1 className={`text-base font-bold truncate ${COR_TEXTO[corNumero]}`}>
                  Projeto {alvara.numeroProjeto}
                </h1>
                <span className={`inline-flex items-center px-2 py-0.5 text-[11px] font-medium rounded shrink-0 ${SITUACAO_BADGE[alvara.situacao]}`}>
                  {alvara.situacao.replace('_', ' ')}
                </span>
                <span className={`inline-flex items-center px-2 py-0.5 text-[11px] font-medium rounded shrink-0 ${
                  corTipo === 'vermelho' ? 'bg-red-50 text-red-700' :
                  corTipo === 'roxo' ? 'bg-purple-50 text-purple-700' :
                  'bg-gray-100 text-gray-600'
                }`}>
                  {alvara.tipo}
                </span>
              </div>
              <button
                onClick={onFechar}
                aria-label="Fechar painel"
                className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded transition-colors active:scale-90 cursor-pointer shrink-0"
              >
                <X size={18} />
              </button>
            </div>

            <div className="flex items-center gap-2 px-5 py-3 border-b border-gray-100 shrink-0">
              {!editando ? (
                <>
                  <button
                    onClick={() => setEditando(true)}
                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-blue-600 text-white text-xs font-medium rounded hover:bg-blue-700 active:scale-[0.97] transition-all cursor-pointer"
                  >
                    Alterar
                  </button>
                  <button
                    onClick={handleExcluir}
                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-white border border-gray-300 text-red-600 text-xs font-medium rounded hover:bg-red-50 active:scale-[0.97] transition-all cursor-pointer"
                  >
                    <Trash2 size={13} />
                    Excluir
                  </button>
                  <button
                    onClick={() => window.open(`/?imprimir=${encodeURIComponent(alvara.numeroProjeto)}`, '_blank')}
                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-white border border-gray-300 text-gray-700 text-xs font-medium rounded hover:bg-gray-50 active:scale-[0.97] transition-all cursor-pointer"
                  >
                    <Printer size={13} />
                    Imprimir
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={handleCancelar}
                    disabled={salvando}
                    className="px-3.5 py-1.5 bg-white border border-gray-300 text-gray-700 text-xs font-medium rounded hover:bg-gray-50 active:scale-[0.97] transition-all cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={handleSalvar}
                    disabled={salvando}
                    className="px-3.5 py-1.5 bg-blue-600 text-white text-xs font-medium rounded hover:bg-blue-700 disabled:bg-gray-200 disabled:text-gray-400 active:scale-[0.97] transition-all cursor-pointer"
                  >
                    {salvando ? 'Salvando...' : 'Salvar'}
                  </button>
                </>
              )}
            </div>

            <div className="flex-1 min-h-0 overflow-y-auto">
              <div className="px-5 pt-4">
                {sucesso && (
                  <div className="mb-4 flex items-center gap-2 px-3.5 py-2.5 bg-green-50 border border-green-200 text-green-700 rounded text-sm animate-[pop-in_180ms_var(--ease-fluid)]">
                    <Check size={16} />
                    Alterações salvas com sucesso!
                  </div>
                )}
                {erro && (
                  <div className="mb-4 flex items-center gap-2 px-3.5 py-2.5 bg-red-50 border border-red-200 text-red-700 rounded text-sm animate-[pop-in_180ms_var(--ease-fluid)]">
                    <AlertCircle size={16} />
                    {erro}
                  </div>
                )}
              </div>

              <div className="flex border-b border-gray-200 px-5">
                {TABS.map(({ key, label, icon: Icon }) => (
                  <button
                    key={key}
                    onClick={() => setAbaAtiva(key)}
                    className={`inline-flex items-center gap-1.5 px-4 py-3 text-sm font-medium transition-colors active:scale-[0.98] cursor-pointer ${
                      abaAtiva === key
                        ? 'text-blue-700 border-b-2 border-blue-600 -mb-px'
                        : 'text-gray-500 hover:text-gray-800'
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
                        'text-gray-900'
                      }`}>
                        {alvara.tipo}
                        {alvara.empreiteira && <span className="text-gray-500 font-normal ml-2">— {alvara.empreiteira}</span>}
                      </span>
                    </LinhaCampo>
                    <LinhaCampo label="Incluído por">
                      <span className="text-sm text-gray-900">{alvara.incluidoPor}</span>
                    </LinhaCampo>
                    <LinhaCampo label="Criado em">
                      <span className="text-sm text-gray-900">{formatarData(alvara.createdAt)}</span>
                    </LinhaCampo>
                    {alvara.editadoPor && (
                      <LinhaCampo label="Última alteração">
                        <span className="text-sm text-gray-900">
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
                            <option key={s} value={s}>{s.replace('_', ' ')}</option>
                          ))}
                        </select>
                      ) : (
                        <span className={`inline-flex items-center px-2.5 py-1 text-xs font-medium rounded ${SITUACAO_BADGE[alvara.situacao]}`}>
                          {alvara.situacao.replace('_', ' ')}
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
                        <span className="text-sm text-gray-900">{alvara.responsavel || 'Não atribuído'}</span>
                      )}
                    </LinhaCampo>
                  </div>
                )}

                {abaAtiva === 'endereco' && (
                  <div key="endereco" className="animate-[tab-in_200ms_var(--ease-fluid)]">
                    <div className="mb-8">
                      <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
                        Natureza dos Serviços
                      </h3>
                      <div className="grid grid-cols-1 gap-2.5">
                        {NATUREZAS_SERVICOS.map((n) => {
                          const usada = editando && form.enderecos.some((e) => e.naturezaServico === n.valor);
                          return (
                            <div
                              key={n.valor}
                              className={`flex items-start gap-3 px-4 py-3 rounded border transition-colors ${
                                usada ? 'border-blue-200 bg-blue-50' : 'border-gray-200 bg-gray-50'
                              }`}
                            >
                              <div className={`w-8 h-8 rounded flex items-center justify-center text-xs font-bold shrink-0 ${
                                usada ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-500'
                              }`}>
                                {n.label}
                              </div>
                              <span className="text-xs text-gray-600 leading-relaxed pt-1.5">{n.descricao}</span>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                          Endereços
                        </h3>
                        {editando && (
                          <button
                            onClick={adicionarEndereco}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-blue-600 border border-blue-200 rounded hover:bg-blue-50 transition-colors cursor-pointer"
                          >
                            <Plus size={14} />
                            Adicionar endereço
                          </button>
                        )}
                      </div>

                      {editando ? (
                        <div className="space-y-5">
                          {form.enderecos.map((end, idx) => (
                            <div key={idx} className="border border-gray-200 rounded-md overflow-hidden">
                              <div className="flex items-center justify-between px-5 py-3 bg-gray-50 border-b border-gray-200">
                                <span className="text-sm font-medium text-gray-700">
                                  Endereço {idx + 1}
                                </span>
                                <div className="flex items-center gap-3">
                                  <select
                                    value={end.naturezaServico}
                                    onChange={(e) => atualizarEndereco(idx, 'naturezaServico', e.target.value)}
                                    className="px-2.5 py-1.5 border border-gray-300 bg-white rounded text-xs font-medium focus:border-blue-500 transition-colors"
                                  >
                                    {NATUREZAS_SERVICOS.map((n) => (
                                      <option key={n.valor} value={n.valor}>{n.label} — {n.descricao}</option>
                                    ))}
                                  </select>
                                  {form.enderecos.length > 1 && (
                                    <button
                                      onClick={() => removerEndereco(idx)}
                                      className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded transition-colors cursor-pointer"
                                    >
                                      <Trash2 size={14} />
                                    </button>
                                  )}
                                </div>
                              </div>

                              <div className="p-5 space-y-4">
                                <div>
                                  <label className="block mb-1.5 text-xs font-medium text-gray-600">Local da obra</label>
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
                                    <label className="block mb-1.5 text-xs font-medium text-gray-600">Transversal — Rua 1</label>
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
                                    <label className="block mb-1.5 text-xs font-medium text-gray-600">Transversal — Rua 2</label>
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
                                    <label className="block mb-1.5 text-xs font-medium text-gray-600">Qtde/Extensão (m)</label>
                                    <input
                                      id={`InputQtdExtensao_${idx}`}
                                      type="text"
                                      inputMode="decimal"
                                      value={end.qtdExtensao}
                                      onChange={(e) => atualizarEndereco(idx, 'qtdExtensao', e.target.value)}
                                      placeholder="0"
                                      className={`${inputNumCls} text-center`}
                                    />
                                  </div>
                                  <div>
                                    <label className="block mb-1.5 text-xs font-medium text-gray-600">Largura (m)</label>
                                    <input
                                      id={`InputLargura_${idx}`}
                                      type="text"
                                      inputMode="decimal"
                                      value={end.larguraM}
                                      onChange={(e) => atualizarEndereco(idx, 'larguraM', e.target.value)}
                                      placeholder="0"
                                      className={`${inputNumCls} text-center`}
                                    />
                                  </div>
                                  <div>
                                    <label className="block mb-1.5 text-xs font-medium text-gray-600">Pavimento</label>
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
                                    <label className="block mb-1.5 text-xs font-medium text-gray-600">Área (m²)</label>
                                    <input
                                      id={`InputArea_${idx}`}
                                      type="text"
                                      inputMode="decimal"
                                      value={end.areaM2}
                                      onChange={(e) => atualizarEndereco(idx, 'areaM2', e.target.value)}
                                      placeholder="0"
                                      className={`${inputNumCls} text-center`}
                                    />
                                  </div>
                                </div>
                                <div>
                                  <label className="block mb-1.5 text-xs font-medium text-gray-600">Folha N°</label>
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
                          <table className="w-full text-sm border border-gray-200 rounded-md">
                            <thead>
                              <tr className="bg-gray-50 border-b border-gray-200">
                                <th className="px-3 py-2 text-[10px] font-semibold text-gray-500 uppercase text-center">Natureza</th>
                                <th className="px-3 py-2 text-[10px] font-semibold text-gray-500 uppercase text-left">Local da Obra</th>
                                <th className="px-3 py-2 text-[10px] font-semibold text-gray-500 uppercase text-center">Rua 1</th>
                                <th className="px-3 py-2 text-[10px] font-semibold text-gray-500 uppercase text-center">Rua 2</th>
                                <th className="px-3 py-2 text-[10px] font-semibold text-gray-500 uppercase text-center">Qtde/Ext.</th>
                                <th className="px-3 py-2 text-[10px] font-semibold text-gray-500 uppercase text-center">Largura</th>
                                <th className="px-3 py-2 text-[10px] font-semibold text-gray-500 uppercase text-center">Pavimento</th>
                                <th className="px-3 py-2 text-[10px] font-semibold text-gray-500 uppercase text-center">Área</th>
                                <th className="px-3 py-2 text-[10px] font-semibold text-gray-500 uppercase text-center">Folha</th>
                              </tr>
                            </thead>
                            <tbody>
                              {(alvara.enderecos && alvara.enderecos.length > 0
                                ? alvara.enderecos
                                : [{ naturezaServico: '5', localObra: '', transversal1: '', transversal2: '', qtdExtensao: 0, larguraM: 0, pavimento: '', areaM2: 0, folhaNumero: '' }]
                              ).map((end, idx) => (
                                <tr key={idx} className="border-b border-gray-100 last:border-0">
                                  <td className="px-3 py-2.5 text-center text-xs font-semibold">{end.naturezaServico}</td>
                                  <td className="px-3 py-2.5 text-xs">{end.localObra || '—'}</td>
                                  <td className="px-3 py-2.5 text-xs text-center">{end.transversal1 || '—'}</td>
                                  <td className="px-3 py-2.5 text-xs text-center">{end.transversal2 || '—'}</td>
                                  <td className="px-3 py-2.5 text-xs text-center">{end.qtdExtensao}</td>
                                  <td className="px-3 py-2.5 text-xs text-center">{end.larguraM}</td>
                                  <td className="px-3 py-2.5 text-xs text-center">{end.pavimento || '—'}</td>
                                  <td className="px-3 py-2.5 text-xs text-center">{end.areaM2}</td>
                                  <td className="px-3 py-2.5 text-xs text-center">{end.folhaNumero || '—'}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>

                    <div className="mt-6 grid grid-cols-2 gap-4">
                      <div className="border border-gray-200 rounded-md p-4">
                        <label className="block text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
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
                            <span className="text-xl font-bold text-gray-900">{alvara.qtdPostes || 0}</span>
                          )}
                          <span className="text-xs text-gray-500">UND</span>
                        </div>
                      </div>
                      <div className="border border-gray-200 rounded-md p-4">
                        <label className="block text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
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
                            <span className="text-xl font-bold text-gray-900">{alvara.qtdCaboM || 0}</span>
                          )}
                          <span className="text-xs text-gray-500">m</span>
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
          className={`fixed inset-0 z-50 flex items-center justify-center px-4 bg-gray-900/40 backdrop-blur-[2px] transition-opacity ease-[var(--ease-fluid)] ${
            modalEntered ? 'opacity-100 duration-[180ms]' : 'opacity-0 duration-[140ms]'
          }`}
          onClick={() => setConfirmandoExclusao(false)}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="titulo-confirmar-exclusao"
            className={`bg-white rounded-lg shadow-xl max-w-sm w-full p-6 origin-center transition-[transform,opacity] ease-[var(--ease-fluid)] ${
              modalEntered ? 'opacity-100 scale-100 duration-[220ms]' : 'opacity-0 scale-95 duration-[140ms]'
            }`}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-full bg-red-50 text-red-600 flex items-center justify-center shrink-0">
                <AlertCircle size={20} />
              </div>
              <div>
                <h2 id="titulo-confirmar-exclusao" className="text-sm font-semibold text-gray-900">
                  Excluir projeto {alvara?.numeroProjeto}?
                </h2>
                <p className="mt-1 text-sm text-gray-500">Essa ação não pode ser desfeita.</p>
              </div>
            </div>
            <div className="mt-6 flex justify-end gap-2">
              <button
                onClick={() => setConfirmandoExclusao(false)}
                className="px-4 py-2 bg-white border border-gray-300 text-gray-700 text-sm font-medium rounded hover:bg-gray-50 active:scale-[0.97] transition-all cursor-pointer"
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
          </div>
        </div>
      )}
    </>
  );
}

function LinhaCampo({ label, children }) {
  return (
    <div className="flex items-center justify-between py-3 border-b border-gray-100 last:border-0">
      <span className="text-sm text-gray-500">{label}</span>
      <div className="text-sm text-right">{children}</div>
    </div>
  );
}
