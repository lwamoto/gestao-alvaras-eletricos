import { useEffect, useState } from 'react';
import { AlertCircle, Printer } from 'lucide-react';
import { getAlvaraPorProjeto } from '../api.js';
import { NATUREZAS_SERVICOS } from '../constants.js';

// Dados fixos da COPEL/engenheiro responsável — os mesmos em toda Solicitação
// de Alvará (confirmado com o usuário). Editar aqui se o responsável técnico
// ou o contato da prefeitura mudar no futuro.
const COPEL_INFO = {
  razaoSocial: 'COPEL DISTRIBUIÇÃO',
  cnpj: '04.368.898/0001-06',
  endereco: 'R Prof. Brasílio Ovídio da Costa',
  numero: '1703',
  cidadeUf: 'Curitiba/PR',
  bairro: 'Santa Quitéria',
  telefone: '(41) 98859-5265',
  email: 'projetos.cta@copel.com',
  responsavelTecnico: 'Fábio Vitória Rodrigues',
  crea: 'PR-185849/D',
  estado: 'Paraná',
};

const DESTINATARIO = {
  orgao: 'Secretaria de Trânsito - SETRAN',
  coordenadoria: 'Coordenadoria de Obras de Curitiba - COC.',
  engenheira: 'Engª Mirian Voss',
};

const LEI_MUNICIPAL = '11095/2004';
const PRAZO_EXECUCAO_DIAS = 90;

function dataExtenso(data = new Date()) {
  const formatado = data.toLocaleDateString('pt-BR', { day: 'numeric', month: 'long', year: 'numeric' });
  const partes = formatado.split(' de ');
  const mes = partes[1].charAt(0).toUpperCase() + partes[1].slice(1);
  return `Curitiba, ${partes[0]} de ${mes} de ${partes[2]}`;
}

function fraseServicos(qtdPostes, qtdCaboM) {
  const temPoste = qtdPostes > 0;
  const temCabo = qtdCaboM > 0;
  if (temPoste && temCabo) {
    return `${qtdPostes} poste${qtdPostes === 1 ? '' : 's'} e de ${qtdCaboM} m de cabos`;
  }
  if (temPoste) return `${qtdPostes} poste${qtdPostes === 1 ? '' : 's'}`;
  if (temCabo) return `${qtdCaboM} m de cabos`;
  return 'serviços conforme planilha em anexo';
}

export default function SolicitacaoImpressao({ numeroProjeto }) {
  const [alvara, setAlvara] = useState(null);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState('');

  useEffect(() => {
    (async () => {
      setCarregando(true);
      setErro('');
      const dados = await getAlvaraPorProjeto(numeroProjeto);
      if (!dados) setErro('Alvará não encontrado (ou sessão expirada).');
      else setAlvara(dados);
      setCarregando(false);
    })();
  }, [numeroProjeto]);

  if (carregando) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (erro || !alvara) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="text-center">
          <AlertCircle size={36} className="mx-auto text-red-400 mb-3" />
          <p className="text-sm text-red-600">{erro || 'Alvará não encontrado.'}</p>
        </div>
      </div>
    );
  }

  const primeiroEndereco = alvara.enderecos?.[0];
  const naturezasUsadas = new Set((alvara.enderecos || []).map((e) => e.naturezaServico));

  return (
    <div className="bg-white min-h-screen text-gray-900">
      <div className="print:hidden sticky top-0 z-10 flex items-center justify-between px-6 py-3 bg-gray-900 text-white">
        <span className="text-sm font-medium">
          Solicitação de Alvará — Projeto {alvara.numeroProjeto}
        </span>
        <button
          onClick={() => window.print()}
          className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded text-sm font-medium transition-colors cursor-pointer"
        >
          <Printer size={16} />
          Imprimir
        </button>
      </div>

      <PaginaSolicitacao alvara={alvara} primeiroEndereco={primeiroEndereco} via="1ª via" />
      <PaginaSolicitacao alvara={alvara} primeiroEndereco={primeiroEndereco} via="2ª via" quebrarAntes />
      <PaginaPlanilha alvara={alvara} naturezasUsadas={naturezasUsadas} />
    </div>
  );
}

function LabelValor({ label, valor }) {
  return (
    <p className="text-sm">
      <span className="font-semibold">{label}:</span> {valor}
    </p>
  );
}

function PaginaSolicitacao({ alvara, primeiroEndereco, via, quebrarAntes }) {
  return (
    <div className={`max-w-[190mm] mx-auto px-10 py-10 ${quebrarAntes ? 'break-before-page' : ''}`}>
      <p className="text-right text-[10px] text-gray-400 mb-2">{via}</p>
      <h1 className="text-center text-lg font-bold tracking-wide mb-8">SOLICITAÇÃO DE ALVARÁ</h1>

      <p className="text-sm mb-1">
        <span className="font-semibold">ALVARÁ Nº</span> ____________________
      </p>
      <p className="text-sm mb-6">
        <span className="font-semibold">PROJETO:</span> {alvara.numeroProjeto}
      </p>

      <p className="text-sm mb-4">{dataExtenso()}</p>
      <p className="text-sm">À {DESTINATARIO.orgao}</p>
      <p className="text-sm">{DESTINATARIO.coordenadoria}</p>
      <p className="text-sm mb-4">{DESTINATARIO.engenheira}</p>

      <p className="text-sm leading-relaxed text-justify mb-6">
        Solicitamos autorização para executar serviços de{' '}
        <strong>
          instalação/Substituição de {fraseServicos(alvara.qtdPostes, alvara.qtdCaboM)}
        </strong>
        , conforme planilha em anexo, para a contratante <strong>{COPEL_INFO.razaoSocial}</strong>,
        nos comprometendo a cumprir as determinações da Municipalidade no que se refere às normas
        e posturas a serem estabelecidas por este Núcleo, de conformidade com a Lei Municipal nº{' '}
        {LEI_MUNICIPAL}.
        <br />
        Anexamos croqui de localização e o cronograma físico de execução da(s) obras(s).
        <br />
        Atenciosamente:
      </p>

      <div className="border border-gray-900 p-4 mb-6 space-y-1">
        <LabelValor label="Razão Social" valor={COPEL_INFO.razaoSocial} />
        <LabelValor label="CNPJ/CPF" valor={COPEL_INFO.cnpj} />
        <div className="flex flex-wrap gap-x-8">
          <LabelValor label="Endereço" valor={COPEL_INFO.endereco} />
          <LabelValor label="Nº" valor={COPEL_INFO.numero} />
        </div>
        <div className="flex flex-wrap gap-x-8">
          <LabelValor label="Cidade/UF" valor={COPEL_INFO.cidadeUf} />
          <LabelValor label="Bairro" valor={COPEL_INFO.bairro} />
        </div>
        <LabelValor label="Telefone" valor={COPEL_INFO.telefone} />
        <LabelValor label="E-mail" valor={COPEL_INFO.email} />
        <LabelValor label="Responsável Técnico" valor={COPEL_INFO.responsavelTecnico} />
        <div className="flex flex-wrap gap-x-8">
          <LabelValor label="Número do CREA" valor={COPEL_INFO.crea} />
          <LabelValor label="Estado" valor={COPEL_INFO.estado} />
        </div>
      </div>

      <div className="border border-gray-900 p-4 space-y-1">
        <p className="text-sm font-semibold">Local da obra:</p>
        <p className="text-sm">{primeiroEndereco?.localObra || '—'}</p>
        <LabelValor label="Tipo de Pavimento" valor={primeiroEndereco?.pavimento || '—'} />
        <LabelValor label="Metragem" valor="CONFORME PLANILHA EM ANEXO" />
        <p className="text-sm">
          <span className="font-semibold">Data de execução:</span> CONFORME PLANILHA EM ANEXO (
          {PRAZO_EXECUCAO_DIAS} dias)
        </p>
        <p className="text-sm pt-2">
          Obs: Autorização de trânsito será solicitada posteriormente.
        </p>
      </div>
    </div>
  );
}

const thCls = 'border border-gray-900 px-2 py-1.5 font-semibold';
const tdCls = 'border border-gray-900 px-2 py-1.5';

function PaginaPlanilha({ alvara, naturezasUsadas }) {
  const enderecos = alvara.enderecos?.length ? alvara.enderecos : [];

  return (
    <div className="max-w-[190mm] mx-auto px-10 py-10 break-before-page">
      <h1 className="text-center text-base font-bold mb-6">PLANILHA DE ALVARÁ</h1>

      <table className="w-full border-collapse border border-gray-900 text-xs mb-4">
        <tbody>
          <tr>
            <td className={`${thCls} w-1/6`}>CONCESSIONÁRIA</td>
            <td className={tdCls}>{COPEL_INFO.razaoSocial}</td>
            <td className={`${thCls} w-1/6`}>EXECUTORA</td>
            <td className={tdCls}>{alvara.tipo === 'PARTICULAR' ? alvara.empreiteira : 'COPEL'}</td>
          </tr>
          <tr>
            <td className={thCls}>ENGº RESP.</td>
            <td className={tdCls}>{COPEL_INFO.responsavelTecnico}</td>
            <td className={thCls}>Nº CREA</td>
            <td className={tdCls}>{COPEL_INFO.crea}</td>
          </tr>
        </tbody>
      </table>

      <p className="text-xs font-semibold mb-1.5">NATUREZA DOS SERVIÇOS:</p>
      <div className="mb-5 space-y-0.5">
        {NATUREZAS_SERVICOS.map((n) => (
          <p key={n.valor} className="text-xs flex items-center gap-2">
            <span className="inline-flex items-center justify-center w-4 h-4 border border-gray-900 text-[10px] shrink-0">
              {naturezasUsadas.has(n.valor) ? 'X' : ''}
            </span>
            {n.label}-{n.descricao.toUpperCase()}
          </p>
        ))}
      </div>

      <table className="w-full border-collapse border border-gray-900 text-xs table-fixed">
        <colgroup>
          <col className="w-[6%]" />
          <col className="w-[19%]" />
          <col className="w-[19%]" />
          <col className="w-[19%]" />
          <col className="w-[10%]" />
          <col className="w-[9%]" />
          <col className="w-[10%]" />
          <col className="w-[8%]" />
        </colgroup>
        <thead>
          <tr>
            <th className={thCls}>Natureza</th>
            <th className={thCls}>Local da Obra</th>
            <th className={thCls}>Transversal — Rua 1</th>
            <th className={thCls}>Transversal — Rua 2</th>
            <th className={thCls}>Qtde/Ext. (m)</th>
            <th className={thCls}>Largura (m)</th>
            <th className={thCls}>Pavimento</th>
            <th className={thCls}>Área (m²)</th>
          </tr>
        </thead>
        <tbody>
          {enderecos.map((e, i) => (
            <tr key={i}>
              <td className={`${tdCls} text-center`}>{e.naturezaServico}</td>
              <td className={`${tdCls} break-words`}>{e.localObra || '—'}</td>
              <td className={`${tdCls} break-words`}>{e.transversal1 || '—'}</td>
              <td className={`${tdCls} break-words`}>{e.transversal2 || '—'}</td>
              <td className={`${tdCls} text-center`}>{e.qtdExtensao}</td>
              <td className={`${tdCls} text-center`}>{e.larguraM}</td>
              <td className={tdCls}>{e.pavimento || '—'}</td>
              <td className={`${tdCls} text-center`}>{e.areaM2}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <table className="mt-4 border-collapse border border-gray-900 text-xs">
        <tbody>
          <tr>
            <td className={thCls}>TOTAL DE POSTES:</td>
            <td className={`${tdCls} w-16 text-center`}>{alvara.qtdPostes || 0}</td>
            <td className={tdCls}>UND</td>
          </tr>
          <tr>
            <td className={thCls}>TOTAL DE CABOS:</td>
            <td className={`${tdCls} text-center`}>{alvara.qtdCaboM || 0}</td>
            <td className={tdCls}>m</td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}
