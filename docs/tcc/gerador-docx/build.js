const fs = require('fs');
const path = require('path');
const {
  Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType,
  Table, TableRow, TableCell, WidthType, ShadingType, BorderStyle,
  ImageRun, PageBreak, TableOfContents, LevelFormat, convertInchesToTwip,
  VerticalAlign, PageNumber, Footer, Header,
} = require('docx');

const SHOTS = path.join(__dirname, '..', 'screenshots');

// ---------- dimensões reais (px) de cada print/diagrama ----------
const DIMS = {
  '01-login.png': [1440, 900],
  '02-cadastrar-unico.png': [1440, 900],
  '03-cadastrar-lote.png': [1440, 900],
  '04-pesquisar.png': [1440, 900],
  '05-detalhe-projeto.png': [1440, 900],
  '06-detalhe-status.png': [1440, 900],
  '07-detalhe-endereco.png': [1440, 900],
  '08-editar-endereco.png': [1440, 900],
  '09-editar-status.png': [1440, 900],
  '10-dashboard.png': [1440, 900],
  '11-usuarios.png': [1440, 900],
  '12-empreiteiras.png': [1440, 900],
  '13-empreiteira-dashboard.png': [1440, 900],
  '14-notificacoes.png': [1440, 900],
  '15-meus-alvaras.png': [1440, 900],
  '16-impressao-solicitacao.png': [1440, 900],
  '16b-impressao-completa.png': [1432, 2574],
  '17-tema-escuro-pesquisar.png': [1440, 900],
  '18-tema-escuro-dashboard.png': [1440, 900],
  '19-estrutura-backend.png': [667, 635],
  '20-estrutura-frontend.png': [699, 605],
  '21-diagrama-er.png': [1252, 864],
  '22-diagrama-casos-uso.png': [1376, 792],
};

let figCount = 0;
let tableCount = 0;

function fit(name, maxW = 560, maxH = 680) {
  const [w, h] = DIMS[name];
  let width = maxW;
  let height = (h * maxW) / w;
  if (height > maxH) {
    height = maxH;
    width = (w * maxH) / h;
  }
  return { width: Math.round(width), height: Math.round(height) };
}

function figure(name, legenda) {
  figCount += 1;
  const { width, height } = fit(name);
  return [
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 200, after: 80 },
      children: [
        new ImageRun({
          data: fs.readFileSync(path.join(SHOTS, name)),
          transformation: { width, height },
          type: 'png',
        }),
      ],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 200 },
      children: [
        new TextRun({ text: `Figura ${figCount} — ${legenda}`, italics: true, size: 20, color: '595959' }),
      ],
    }),
  ];
}

function h1(text) {
  return new Paragraph({ heading: HeadingLevel.HEADING_1, spacing: { before: 360, after: 200 }, children: [new TextRun(text)] });
}
function h2(text) {
  return new Paragraph({ heading: HeadingLevel.HEADING_2, spacing: { before: 260, after: 160 }, children: [new TextRun(text)] });
}
function h3(text) {
  return new Paragraph({ heading: HeadingLevel.HEADING_3, spacing: { before: 200, after: 120 }, children: [new TextRun(text)] });
}
function p(text, opts = {}) {
  return new Paragraph({
    spacing: { after: 160, line: 300 },
    alignment: opts.align || AlignmentType.JUSTIFIED,
    children: Array.isArray(text) ? text : [new TextRun({ text, ...opts })],
  });
}
function bold(text) {
  return new TextRun({ text, bold: true });
}
function bullet(text) {
  return new Paragraph({ text, bullet: { level: 0 }, spacing: { after: 80 } });
}
function pageBreak() {
  return new Paragraph({ children: [new PageBreak()] });
}

const CELL_SHADE = { type: ShadingType.CLEAR, fill: 'B45309', color: 'auto' };
const CELL_BORDERS = {
  top: { style: BorderStyle.SINGLE, size: 2, color: 'CCCCCC' },
  bottom: { style: BorderStyle.SINGLE, size: 2, color: 'CCCCCC' },
  left: { style: BorderStyle.SINGLE, size: 2, color: 'CCCCCC' },
  right: { style: BorderStyle.SINGLE, size: 2, color: 'CCCCCC' },
};

function headerCell(text, width) {
  return new TableCell({
    width: { size: width, type: WidthType.DXA },
    shading: CELL_SHADE,
    borders: CELL_BORDERS,
    verticalAlign: VerticalAlign.CENTER,
    margins: { top: 60, bottom: 60, left: 100, right: 100 },
    children: [new Paragraph({ children: [new TextRun({ text, bold: true, color: 'FFFFFF', size: 21 })] })],
  });
}
function bodyCell(text, width, opts = {}) {
  return new TableCell({
    width: { size: width, type: WidthType.DXA },
    borders: CELL_BORDERS,
    verticalAlign: VerticalAlign.CENTER,
    margins: { top: 60, bottom: 60, left: 100, right: 100 },
    children: [new Paragraph({ children: [new TextRun({ text: String(text), size: 21, bold: !!opts.bold })] })],
  });
}

function dataTable(titulo, headers, rows, widths) {
  tableCount += 1;
  const total = widths.reduce((a, b) => a + b, 0);
  return [
    new Paragraph({
      spacing: { before: 200, after: 100 },
      children: [new TextRun({ text: `Tabela ${tableCount} — ${titulo}`, bold: true, size: 21 })],
    }),
    new Table({
      width: { size: total, type: WidthType.DXA },
      columnWidths: widths,
      rows: [
        new TableRow({ children: headers.map((htxt, i) => headerCell(htxt, widths[i])) }),
        ...rows.map((r) => new TableRow({ children: r.map((c, i) => bodyCell(c, widths[i])) })),
      ],
    }),
    new Paragraph({ spacing: { after: 200 }, children: [] }),
  ];
}

// ============================================================
// CAPA
// ============================================================
const capa = [
  new Paragraph({ spacing: { before: 600 }, alignment: AlignmentType.CENTER, children: [new TextRun({ text: 'Serviço Nacional de Aprendizagem Industrial — SENAI', bold: true, size: 26 })] }),
  new Paragraph({ spacing: { before: 120 }, alignment: AlignmentType.CENTER, children: [new TextRun({ text: 'Curso Técnico em Desenvolvimento de Sistemas', size: 24 })] }),
  new Paragraph({ spacing: { before: 1400 }, alignment: AlignmentType.CENTER, children: [new TextRun({ text: 'TRABALHO DE CONCLUSÃO DE CURSO', bold: true, size: 30 })] }),
  new Paragraph({ spacing: { before: 300 }, alignment: AlignmentType.CENTER, children: [new TextRun({ text: 'Sistema de Controle de Alvará', bold: true, size: 36, color: 'B45309' })] }),
  new Paragraph({ spacing: { before: 1600 }, alignment: AlignmentType.CENTER, children: [new TextRun({ text: 'Gustavo Yuji Iwamoto', size: 24 })] }),
  new Paragraph({ spacing: { before: 80 }, alignment: AlignmentType.CENTER, children: [new TextRun({ text: 'Orientador: Samuel Cunha', size: 22 })] }),
  new Paragraph({ spacing: { before: 1600 }, alignment: AlignmentType.CENTER, children: [new TextRun({ text: 'Curitiba', size: 22 })] }),
  new Paragraph({ spacing: { before: 60 }, alignment: AlignmentType.CENTER, children: [new TextRun({ text: '2026', size: 22 })] }),
  pageBreak(),
];

// ============================================================
// SUMÁRIO
// ============================================================
const sumario = [
  h1('SUMÁRIO'),
  new TableOfContents('Sumário', { hyperlink: true, headingStyleRange: '1-3' }),
  p([new TextRun({ text: 'No Word: clique com o botão direito sobre o sumário acima e selecione "Atualizar campo" para gerar os números de página automaticamente.', italics: true, size: 20, color: '595959' })]),
  pageBreak(),
];

// ============================================================
// 1. INTRODUÇÃO
// ============================================================
const introducao = [
  h1('1. INTRODUÇÃO'),
  p('O presente trabalho descreve o desenvolvimento do Sistema de Controle de Alvará (SCA), uma aplicação web full stack construída para digitalizar e organizar o processo de acompanhamento de alvarás de obra utilizado pela COPEL Distribuição em conjunto com suas empresas empreiteiras parceiras.'),
  p('Antes da existência do sistema, o controle desses alvarás era feito por meio de planilhas eletrônicas preenchidas manualmente, sem histórico de alterações, sem controle de acesso entre a concessionária e as empreiteiras, e sem nenhuma automação no preenchimento dos documentos formais exigidos (Solicitação de Alvará e Planilha de Alvará). O SCA foi desenvolvido para substituir esse processo manual por uma ferramenta centralizada, auditável e de acesso controlado.'),
  p('O sistema foi desenvolvido para dois públicos distintos: (1) funcionários da COPEL, que têm acesso total ao cadastro, edição, exclusão e emissão dos documentos de todos os alvarás do sistema; e (2) usuários das empresas empreiteiras (ex.: AVANTI, CONSTRUCEL, ELETROCHESKI, ENERGY, JB, entre outras), que têm acesso restrito apenas aos alvarás do tipo PARTICULAR pertencentes à própria empreiteira, em modo de consulta e acompanhamento de status.'),
  p('A necessidade atendida pelo sistema é dupla: reduzir o retrabalho manual (com o cadastro em lote, o cálculo automático dos valores da Planilha de Alvará e a geração automática dos documentos de impressão) e aumentar a confiabilidade do processo (com trilha de auditoria de alterações, controle de acesso por papel de usuário e notificação automática às empreiteiras quando um alvará é recebido).'),
  pageBreak(),
];

// ============================================================
// 2. OBJETIVOS
// ============================================================
const objetivos = [
  h1('2. OBJETIVOS'),
  h2('2.1 Objetivo Geral'),
  p('Desenvolver um sistema web capaz de digitalizar o controle de alvarás de obra da COPEL Distribuição, permitindo o cadastro, acompanhamento e emissão de documentos relacionados aos alvarás, com controle de acesso diferenciado entre a concessionária e as empresas empreiteiras.'),
  h2('2.2 Objetivos Específicos'),
  bullet('Desenvolver uma API REST em Node.js/Express para as operações de autenticação, cadastro, edição, exclusão e consulta de alvarás.'),
  bullet('Modelar e persistir os dados em um banco de dados MongoDB, usando Mongoose para validação de schema.'),
  bullet('Implementar autenticação por sessão via cookie JWT, com dois perfis de acesso (COPEL e EMPREITEIRA).'),
  bullet('Restringir o acesso das empreiteiras somente aos próprios alvarás do tipo PARTICULAR.'),
  bullet('Criar uma interface web em React capaz de cadastrar alvarás individualmente ou em lote (até 10 por vez).'),
  bullet('Automatizar o cálculo dos campos numéricos da Planilha de Alvará (largura e área) a partir da natureza do serviço.'),
  bullet('Gerar automaticamente os documentos de Solicitação de Alvará e Planilha de Alvará para impressão.'),
  bullet('Registrar uma trilha de auditoria (criação, edição e exclusão) para cada alvará.'),
  bullet('Notificar a empreiteira responsável quando o status de um alvará mudar para RECEBIDO.'),
  bullet('Apresentar um painel (Dashboard) com estatísticas de alvarás por situação, responsável e empreiteira.'),
  bullet('Oferecer suporte a tema claro e escuro em toda a aplicação.'),
  pageBreak(),
];

// ============================================================
// 3. DESCRIÇÃO DO PROBLEMA
// ============================================================
const problema = [
  h1('3. DESCRIÇÃO DO PROBLEMA'),
  p('O controle de alvarás de obra é um processo obrigatório sempre que a COPEL Distribuição ou uma empresa empreiteira contratada precisa executar serviços de instalação ou substituição de postes e cabos de energia elétrica em vias públicas. Esse processo depende de autorização formal emitida pela prefeitura do município, mediante a apresentação de uma Solicitação de Alvará acompanhada de uma Planilha de Alvará com as medidas técnicas do serviço.'),
  p('Antes deste sistema, esse acompanhamento era feito por planilhas eletrônicas isoladas, mantidas manualmente por cada responsável. Esse formato apresentava problemas recorrentes: (1) risco de dados inconsistentes, já que qualquer pessoa podia alterar qualquer campo sem histórico; (2) ausência de controle de acesso — não havia forma de restringir o que cada empreiteira podia ver; (3) preenchimento manual e repetitivo da Solicitação de Alvará e da Planilha de Alvará a cada novo projeto; e (4) falta de visibilidade consolidada sobre quantos alvarás estavam pendentes, enviados ou recebidos.'),
  p('Quem sofre com esse problema é, principalmente, o time da COPEL responsável por acompanhar centenas de alvarás simultaneamente, e as empreiteiras, que não tinham nenhuma visibilidade própria sobre o andamento dos alvarás que dependiam delas.'),
  p('O SCA resolve esse problema centralizando os dados em um banco único, aplicando regras de negócio automáticas (como o cálculo padronizado da Planilha de Alvará) e diferenciando o que cada tipo de usuário pode ver e alterar, sem exigir nenhuma ferramenta externa de controle de acesso.'),
  pageBreak(),
];

// ============================================================
// 4. TECNOLOGIAS UTILIZADAS
// ============================================================
const tecnologias = [
  h1('4. TECNOLOGIAS UTILIZADAS'),
  p('A tabela a seguir apresenta as principais tecnologias utilizadas no desenvolvimento do sistema, tanto no back-end quanto no front-end.'),
  ...dataTable(
    'Tecnologias utilizadas no projeto',
    ['Tecnologia', 'Finalidade'],
    [
      ['React', 'Construção da interface do usuário (front-end)'],
      ['Vite', 'Ambiente de desenvolvimento e build do front-end'],
      ['Tailwind CSS v4', 'Estilização utilitária e tema claro/escuro'],
      ['Recharts', 'Gráficos do Dashboard (pizza e barras)'],
      ['lucide-react', 'Biblioteca de ícones da interface'],
      ['Node.js', 'Ambiente de execução do servidor'],
      ['Express', 'Framework para construção da API REST'],
      ['MongoDB', 'Banco de dados NoSQL (documentos)'],
      ['Mongoose', 'Modelagem de schema e validação de dados'],
      ['jsonwebtoken (JWT)', 'Autenticação por sessão via cookie httpOnly'],
      ['bcryptjs', 'Hash de senhas dos usuários'],
      ['cookie-parser', 'Leitura do cookie de sessão nas requisições'],
      ['Git / GitHub', 'Controle de versão do código-fonte'],
      ['Playwright', 'Testes manuais/exploratórios automatizados via navegador'],
    ],
    [3000, 6026]
  ),
  pageBreak(),
];

// ============================================================
// 5. LEVANTAMENTO DE REQUISITOS
// ============================================================
const requisitos = [
  h1('5. LEVANTAMENTO DE REQUISITOS'),
  h2('5.1 Requisitos Funcionais'),
  ...dataTable(
    'Requisitos funcionais do sistema',
    ['Código', 'Descrição'],
    [
      ['RF01', 'Autenticar usuário por e-mail ou por chave de acesso (login).'],
      ['RF02', 'Cadastrar um novo alvará individualmente.'],
      ['RF03', 'Cadastrar de 2 a 10 alvarás de uma só vez (cadastro em lote).'],
      ['RF04', 'Editar dados do alvará: situação, responsável, protocolo, número do alvará, data de recebimento e endereços.'],
      ['RF05', 'Excluir um alvará.'],
      ['RF06', 'Pesquisar e filtrar alvarás por número, tipo, situação e empreiteira.'],
      ['RF07', 'Gerar e imprimir a Solicitação de Alvará e a Planilha de Alvará (exclusivo COPEL).'],
      ['RF08', 'Gerenciar usuários do sistema (cadastrar, editar, excluir) — exclusivo COPEL.'],
      ['RF09', 'Gerenciar empresas empreiteiras (cadastrar, ativar/desativar, excluir) — exclusivo COPEL.'],
      ['RF10', 'Restringir o acesso de usuários EMPREITEIRA somente aos próprios alvarás do tipo PARTICULAR.'],
      ['RF11', 'Notificar a empreiteira responsável quando o alvará mudar de ENVIADO para RECEBIDO.'],
      ['RF12', 'Exibir notificações não lidas para o usuário EMPREITEIRA.'],
      ['RF13', 'Exibir painel (Dashboard) com estatísticas por situação, responsável e empreiteira.'],
      ['RF14', 'Alternar entre tema claro e tema escuro.'],
      ['RF15', 'Registrar histórico de auditoria (criação, edição e exclusão) de cada alvará.'],
      ['RF16', 'Marcar um alvará como "Não necessário", ocultando-o da pesquisa padrão.'],
    ],
    [1300, 7726]
  ),
  h2('5.2 Requisitos Não Funcionais'),
  bullet('Interface responsiva, adaptada a diferentes tamanhos de tela.'),
  bullet('Persistência dos dados em banco de dados MongoDB.'),
  bullet('Comunicação entre front-end e back-end via API REST em JSON.'),
  bullet('Autenticação stateless via cookie JWT httpOnly (7 dias de validade).'),
  bullet('Controle de acesso baseado em papel de usuário (RBAC): COPEL e EMPREITEIRA.'),
  bullet('Senhas de usuário armazenadas apenas como hash (bcrypt), nunca em texto puro.'),
  bullet('Padronização de nomes de responsável em caixa alta, para evitar duplicidade de agrupamento por grafia (ex.: "gustavo" vs. "GUSTAVO").'),
  bullet('Tempo de resposta adequado para uso interno (sem necessidade de escala para milhões de usuários simultâneos).'),
  pageBreak(),
];

// ============================================================
// 6. MODELAGEM DO SISTEMA
// ============================================================
const modelagem = [
  h1('6. MODELAGEM DO SISTEMA'),
  p('Esta seção apresenta os diagramas que representam o comportamento e a estrutura de dados do sistema: o Diagrama de Casos de Uso e o Modelo do Banco de Dados. Os diagramas de fluxograma e de classes, marcados como opcionais no modelo de documentação, não foram incluídos por não agregarem informação além do que já é representado pelos dois diagramas a seguir.'),
  h2('6.1 Diagrama de Casos de Uso'),
  p('O diagrama abaixo representa as interações entre os dois tipos de usuário do sistema (COPEL e EMPREITEIRA) e as principais funcionalidades disponíveis para cada um. Casos de uso em azul são exclusivos do usuário COPEL; em verde, exclusivos do usuário EMPREITEIRA; em amarelo, compartilhados por ambos.'),
  ...figure('22-diagrama-casos-uso.png', 'Diagrama de Casos de Uso do Sistema de Controle de Alvará'),
  h2('6.2 Modelo do Banco de Dados'),
  p('O sistema utiliza cinco coleções no MongoDB: Usuario, Empreiteira, Alvara, Notificacao e HistoricoAlvara. A coleção Alvara é a entidade central do sistema; os endereços de cada alvará são armazenados como um array de subdocumentos embutido (não uma coleção separada), já que sempre são lidos e gravados junto com o alvará. As demais coleções se relacionam a ela por referência (ObjectId) ou por igualdade do nome da empreiteira.'),
  ...figure('21-diagrama-er.png', 'Modelo de dados (coleções e relacionamentos) do MongoDB'),
  pageBreak(),
];

// ============================================================
// 7. BANCO DE DADOS
// ============================================================
const bancoDeDados = [
  h1('7. BANCO DE DADOS'),
  p('Esta seção detalha os campos de cada coleção do banco de dados MongoDB, definidos por schemas Mongoose no back-end.'),
  h3('Usuario'),
  ...dataTable('Campos da coleção Usuario', ['Campo', 'Tipo', 'Obrigatório'], [
    ['nome', 'String', 'Sim'],
    ['email', 'String (único, minúsculo)', 'Não (exige e-mail ou chave)'],
    ['chaveAcesso', 'String (único, maiúsculo)', 'Não (exige e-mail ou chave)'],
    ['senhaHash', 'String', 'Sim'],
    ['tipo', 'String — COPEL | EMPREITEIRA', 'Sim'],
    ['empreiteira', 'String (maiúsculo)', 'Sim, se tipo = EMPREITEIRA'],
  ], [2800, 3800, 2426]),
  h3('Empreiteira'),
  ...dataTable('Campos da coleção Empreiteira', ['Campo', 'Tipo', 'Obrigatório'], [
    ['nome', 'String (único, maiúsculo)', 'Sim'],
    ['ativo', 'Boolean', 'Sim (padrão: true)'],
  ], [2800, 3800, 2426]),
  h3('Alvara'),
  ...dataTable('Campos da coleção Alvara', ['Campo', 'Tipo', 'Obrigatório'], [
    ['numeroProjeto', 'String (único)', 'Sim'],
    ['tipo', 'String — CONSUMIDOR | PARTICULAR | POO', 'Sim'],
    ['empreiteira', 'String (maiúsculo)', 'Sim, se tipo = PARTICULAR'],
    ['situacao', 'String — A_FAZER | ENVIADO | RECEBIDO | NAO_NECESSARIO', 'Sim (padrão: A_FAZER)'],
    ['responsavel', 'String (maiúsculo)', 'Não'],
    ['protocolo', 'String', 'Não'],
    ['numeroAlvara', 'String', 'Não'],
    ['dataMarcada', 'Date', 'Sim (padrão: data atual)'],
    ['dataRecebimentoAlvara', 'Date', 'Não'],
    ['enderecos', 'Array de subdocumentos', 'Não'],
    ['qtdPostes / qtdCaboM', 'Number', 'Não'],
    ['incluidoPor', 'String', 'Sim'],
    ['editadoPor / editadoEm', 'String / Date', 'Não'],
  ], [2800, 3800, 2426]),
  h3('Endereço (subdocumento de Alvara.enderecos)'),
  ...dataTable('Campos do subdocumento de endereço', ['Campo', 'Tipo', 'Obrigatório'], [
    ['naturezaServico', 'String — 5 | 9 | 290 | Z', 'Sim (padrão: 5)'],
    ['localObra / transversal1 / transversal2', 'String', 'Não'],
    ['qtdExtensao', 'Number', 'Não'],
    ['larguraM', 'Number (calculado automaticamente)', 'Não'],
    ['pavimento', 'String', 'Não'],
    ['areaM2', 'Number (calculado automaticamente)', 'Não'],
    ['folhaNumero', 'String', 'Não'],
  ], [2800, 3800, 2426]),
  h3('Notificacao'),
  ...dataTable('Campos da coleção Notificacao', ['Campo', 'Tipo', 'Obrigatório'], [
    ['empreiteira', 'String', 'Sim'],
    ['alvaraId', 'ObjectId → Alvara', 'Sim'],
    ['numeroProjeto', 'String', 'Sim'],
    ['mensagem', 'String', 'Sim'],
    ['lida', 'Boolean', 'Sim (padrão: false)'],
    ['criadoPor', 'String', 'Sim'],
  ], [2800, 3800, 2426]),
  h3('HistoricoAlvara'),
  ...dataTable('Campos da coleção HistoricoAlvara', ['Campo', 'Tipo', 'Obrigatório'], [
    ['alvaraId', 'ObjectId → Alvara', 'Sim'],
    ['numeroProjeto', 'String', 'Sim'],
    ['acao', 'String — criado | editado | excluido', 'Sim'],
    ['usuarioId', 'ObjectId → Usuario', 'Sim'],
    ['usuarioNome', 'String', 'Sim'],
    ['alteracoes', 'Mixed (JSON livre)', 'Não'],
  ], [2800, 3800, 2426]),
  pageBreak(),
];

// ============================================================
// 8. DESENVOLVIMENTO DO BACK-END
// ============================================================
const backend = [
  h1('8. DESENVOLVIMENTO DO BACK-END'),
  p('O back-end foi construído em Node.js com o framework Express, seguindo uma separação em três camadas: models (schemas Mongoose), routes (lógica de negócio e endpoints) e middleware (autenticação). O projeto não utiliza uma camada separada de "controllers" — a lógica de cada rota fica diretamente no arquivo de rotas correspondente, já que o volume de regras de negócio por recurso não justificou essa camada extra.'),
  ...figure('19-estrutura-backend.png', 'Estrutura de pastas do back-end (server/)'),
  h2('8.1 Middlewares'),
  p([bold('requireAuth'), new TextRun(' — lê o cookie JWT (sca_token), valida a assinatura e popula req.usuario (id, nome, tipo, empreiteira). Aplicado a todas as rotas de /api/alvaras, /api/usuarios, /api/empreiteiras e /api/notificacoes.')]),
  p([bold('requireCopel'), new TextRun(' — bloqueia com 403 qualquer requisição feita por um usuário do tipo EMPREITEIRA em rotas exclusivas da COPEL (ex.: excluir alvará, gerenciar usuários).')]),
  h2('8.2 Principais rotas da API'),
  ...dataTable('Principais rotas da API REST', ['Método', 'Rota', 'Descrição'], [
    ['POST', '/api/auth/login', 'Autentica por e-mail ou chave de acesso'],
    ['POST', '/api/auth/logout', 'Encerra a sessão'],
    ['GET', '/api/auth/me', 'Retorna o usuário autenticado'],
    ['GET', '/api/alvaras', 'Lista alvarás (com filtros e paginação)'],
    ['GET', '/api/alvaras/estatisticas', 'Estatísticas para o Dashboard'],
    ['GET', '/api/alvaras/projeto/:numeroProjeto', 'Busca um alvará pelo número do projeto'],
    ['GET', '/api/alvaras/:id/historico', 'Histórico de auditoria do alvará'],
    ['POST', '/api/alvaras', 'Cadastra um novo alvará'],
    ['PATCH', '/api/alvaras/:id', 'Edita um alvará existente'],
    ['DELETE', '/api/alvaras/:id', 'Exclui um alvará'],
    ['GET / POST', '/api/usuarios', 'Lista / cadastra usuários (exclusivo COPEL)'],
    ['PATCH / DELETE', '/api/usuarios/:id', 'Edita / exclui usuário (exclusivo COPEL)'],
    ['GET / POST', '/api/empreiteiras', 'Lista / cadastra empreiteiras'],
    ['PATCH / DELETE', '/api/empreiteiras/:id', 'Edita / exclui empreiteira (exclusivo COPEL)'],
    ['GET', '/api/notificacoes', 'Lista notificações do usuário'],
    ['GET', '/api/notificacoes/nao-lidas', 'Contagem de notificações não lidas'],
    ['PATCH', '/api/notificacoes/:id/marcar-lida', 'Marca uma notificação como lida'],
    ['PATCH', '/api/notificacoes/marcar-todas-lidas', 'Marca todas como lidas'],
  ], [1400, 3200, 4426]),
  p('Um ponto de atenção resolvido durante o desenvolvimento foi a rota GET /api/alvaras/estatisticas: o filtro de escopo (que restringe o que uma empreiteira pode ver) precisou usar o operador $and do MongoDB em vez de espalhar (spread) os objetos de filtro, pois o spread sobrescrevia silenciosamente a chave empreiteira e vazava dados de outras empreiteiras na agregação.'),
  pageBreak(),
];

// ============================================================
// 9. DESENVOLVIMENTO DO FRONT-END
// ============================================================
const frontend = [
  h1('9. DESENVOLVIMENTO DO FRONT-END'),
  p('O front-end foi construído em React com Vite, usando Context API para estado global (sessão do usuário e tema claro/escuro) e Tailwind CSS v4 para estilização.'),
  ...figure('20-estrutura-frontend.png', 'Estrutura de pastas do front-end (client/src)'),
  h2('9.1 Organização'),
  p([bold('components/'), new TextRun(' — um componente por tela ou bloco de interface (Login, Sidebar, AlvaraForm, PesquisarAlvara, AlvaraDetalhePainel, Dashboard, UsuariosAdmin, EmpreiteirasAdmin, NotificacoesSino, SolicitacaoImpressao).')]),
  p([bold('contexts/'), new TextRun(' — AuthContext (sessão/usuário logado) e ThemeContext (tema claro/escuro, persistido em localStorage).')]),
  p([bold('serviços (api.js, authApi.js, usuariosApi.js, empreiteirasApi.js, notificacoesApi.js)'), new TextRun(' — funções que encapsulam as chamadas fetch para a API, cada uma correspondendo a um recurso do back-end.')]),
  h2('9.2 Principais telas'),
  p('A seguir, as capturas de tela das principais interfaces do sistema.'),
  ...figure('01-login.png', 'Tela de login'),
  ...figure('02-cadastrar-unico.png', 'Cadastro de alvará (modo único)'),
  ...figure('04-pesquisar.png', 'Pesquisa de alvarás com filtros e paginação'),
  ...figure('05-detalhe-projeto.png', 'Painel de detalhe do alvará — aba Projeto'),
  ...figure('10-dashboard.png', 'Dashboard com estatísticas'),
  pageBreak(),
];

// ============================================================
// 10. FUNCIONALIDADES DO SISTEMA
// ============================================================
function funcionalidade(titulo, objetivo, descricao, imgName, legenda, resultado) {
  return [
    h2(titulo),
    p([bold('Objetivo: '), new TextRun(objetivo)]),
    p([bold('Descrição: '), new TextRun(descricao)]),
    ...figure(imgName, legenda),
    p([bold('Resultado esperado: '), new TextRun(resultado)]),
  ];
}

const funcionalidades = [
  h1('10. FUNCIONALIDADES DO SISTEMA'),
  ...funcionalidade(
    '10.1 Login',
    'Autenticar o usuário e redirecioná-lo para a área correspondente ao seu papel.',
    'A tela de login aceita e-mail ou chave de acesso (chave alfanumérica usada internamente pela COPEL) e senha. O sistema também permite alternar entre tema claro e escuro já nesta tela.',
    '01-login.png', 'Tela de login do sistema',
    'Usuário autenticado é redirecionado ao Dashboard (ou à Pesquisa, se for EMPREITEIRA); credenciais inválidas exibem mensagem de erro genérica.'
  ),
  ...funcionalidade(
    '10.2 Cadastro de Alvará (único)',
    'Permitir que um usuário COPEL registre um novo alvará no sistema.',
    'O formulário exige número do projeto e modelo (CONSUMIDOR, PARTICULAR ou POO). Quando o modelo é PARTICULAR, os campos Empreiteira e Protocolo passam a ser exibidos — o Protocolo aceita apenas o código numérico e o sistema completa automaticamente o prefixo padrão "01." quando ausente.',
    '02-cadastrar-unico.png', 'Formulário de cadastro de alvará do tipo PARTICULAR',
    'Novo alvará aparece na Pesquisa de Alvarás com situação inicial A_FAZER.'
  ),
  ...funcionalidade(
    '10.3 Cadastro de Alvará em Lote',
    'Agilizar o cadastro de vários alvarás semelhantes de uma só vez.',
    'Um botão de menu ao lado de "Adicionar Alvará" alterna para uma tabela compacta com 2 a 10 linhas, cada uma com número do projeto, modelo, empreiteira, protocolo e responsável. O envio cadastra as linhas sequencialmente e relata falhas individualmente, sem interromper o restante do lote.',
    '03-cadastrar-lote.png', 'Cadastro de alvarás em lote',
    'Todos os alvarás válidos do lote são criados; linhas com erro (ex.: número de projeto duplicado) são reportadas sem impedir a criação das demais.'
  ),
  ...funcionalidade(
    '10.4 Pesquisa e Filtro de Alvarás',
    'Permitir localizar rapidamente qualquer alvará cadastrado.',
    'A tabela principal permite busca por número do projeto e filtros por tipo, situação e empreiteira. Por padrão, alvarás marcados como "Não necessário" ficam ocultos, aparecendo apenas quando esse filtro é selecionado explicitamente.',
    '04-pesquisar.png', 'Tela de pesquisa de alvarás',
    'Lista filtrada é atualizada instantaneamente conforme os critérios de busca.'
  ),
  ...funcionalidade(
    '10.5 Detalhe do Alvará e Edição do Status',
    'Consultar e atualizar os dados de acompanhamento de um alvará específico.',
    'Ao clicar em um alvará, um painel lateral exibe três abas: Projeto (dados gerais e histórico), Status (situação, responsável, protocolo, número do alvará e data de recebimento) e Endereço (planilha técnica). O protocolo só é exibido para alvarás do tipo PARTICULAR.',
    '09-editar-status.png', 'Edição da aba Status, com protocolo e número do alvará',
    'Alterações são salvas e refletidas imediatamente na lista, com evento de auditoria registrado no histórico do alvará.'
  ),
  ...funcionalidade(
    '10.6 Cálculo Automático da Planilha de Alvará',
    'Padronizar os valores numéricos da planilha técnica sem depender de digitação manual.',
    'Para postes (natureza "5"), largura e área são fixadas em 1,0. Para cabos (naturezas "9", "290" e "Z"), a largura é fixada em 0,1 e a área é calculada como a extensão em metros × 0,1, arredondada para o múltiplo de 0,05 mais próximo. Todos os campos numéricos são exibidos sempre com ponto decimal e no mínimo uma casa decimal.',
    '08-editar-endereco.png', 'Edição de endereço com largura e área calculadas automaticamente',
    'Largura e área nunca ficam inconsistentes com a natureza do serviço, eliminando erro de digitação nesses dois campos.'
  ),
  ...funcionalidade(
    '10.7 Impressão da Solicitação e Planilha de Alvará',
    'Gerar o documento formal exigido pela prefeitura a partir dos dados já cadastrados no sistema.',
    'O botão "Imprimir" (exclusivo COPEL) abre uma versão do documento pronta para impressão em A4, com moldura azul de destaque e os campos-chave (número do projeto, natureza do serviço e local da obra) em vermelho, seguida da Planilha de Alvará com a tabela de endereços.',
    '16-impressao-solicitacao.png', 'Documento de Solicitação de Alvará pronto para impressão',
    'Documento gerado automaticamente reproduz os dados do alvará sem necessidade de preenchimento manual.'
  ),
  ...funcionalidade(
    '10.8 Dashboard e Estatísticas',
    'Dar visibilidade consolidada da carteira de alvarás.',
    'O Dashboard mostra totais por situação (A Fazer, Enviado, Recebido, Não necessário), um gráfico de pizza por situação, um gráfico de barras por responsável e, para usuários COPEL, um gráfico de barras por empreiteira.',
    '10-dashboard.png', 'Dashboard com gráficos de situação, responsável e empreiteira',
    'Usuário COPEL vê o panorama geral; usuário EMPREITEIRA vê apenas os números da própria empreiteira.'
  ),
  ...funcionalidade(
    '10.9 Gestão de Usuários e Empreiteiras',
    'Permitir que a COPEL administre quem tem acesso ao sistema e quais empreiteiras estão ativas.',
    'As telas de Usuários e Empreiteiras (exclusivas COPEL) permitem cadastrar, editar e excluir usuários, e cadastrar, ativar/desativar e excluir empreiteiras — que alimentam automaticamente os menus de seleção usados no cadastro de alvará.',
    '11-usuarios.png', 'Tela de gestão de usuários',
    'Somente empreiteiras ativas ficam disponíveis para seleção ao cadastrar um alvará PARTICULAR.'
  ),
  ...funcionalidade(
    '10.10 Notificações para a Empreiteira',
    'Avisar a empreiteira responsável no momento em que seu alvará é oficialmente recebido.',
    'Quando um usuário COPEL muda a situação de um alvará de ENVIADO para RECEBIDO, o sistema pergunta se deseja notificar a empreiteira. Se confirmado, a empreiteira vê um sino com contagem de não lidas; ao clicar na notificação, é levada direto ao alvará correspondente.',
    '14-notificacoes.png', 'Sino de notificações do usuário EMPREITEIRA',
    'Empreiteira é avisada em tempo real (na próxima atualização da página) sem precisar consultar a planilha manualmente.'
  ),
  ...funcionalidade(
    '10.11 Restrição de Acesso por Papel de Usuário (RBAC)',
    'Garantir que uma empreiteira nunca veja dados de outra empreiteira ou de alvarás que não são seus.',
    'O menu lateral e as rotas da API mudam de acordo com o tipo de usuário: EMPREITEIRA só vê "Dashboard" e "Meus Alvarás", e todo filtro é forçado no back-end (nunca confiando em parâmetros vindos do cliente).',
    '15-meus-alvaras.png', 'Visão restrita do usuário EMPREITEIRA (menu reduzido)',
    'Usuário EMPREITEIRA nunca consegue visualizar ou editar alvarás de outra empresa, mesmo manipulando a URL diretamente.'
  ),
  ...funcionalidade(
    '10.12 Tema Claro/Escuro',
    'Adaptar a interface à preferência visual do usuário.',
    'Um botão no cabeçalho alterna entre tema claro e escuro em toda a aplicação, incluindo gráficos do Dashboard. A preferência é salva no navegador. O documento de impressão permanece sempre no tema claro, independentemente do tema ativo na tela, pois é impresso em papel branco.',
    '18-tema-escuro-dashboard.png', 'Dashboard no tema escuro',
    'Toda a interface (exceto o documento de impressão) respeita o tema escolhido, sem perda de legibilidade ou contraste.'
  ),
  pageBreak(),
];

// ============================================================
// 11. TESTES REALIZADOS
// ============================================================
const testes = [
  h1('11. TESTES REALIZADOS'),
  p('Os testes foram realizados de forma manual e exploratória, utilizando automação de navegador (Playwright/Claude Browser) para reproduzir os fluxos de uso reais com os dois perfis de usuário (COPEL e EMPREITEIRA), incluindo a verificação do console do navegador em busca de erros/avisos durante a navegação.'),
  ...dataTable('Testes realizados e resultados', ['Teste', 'Resultado'], [
    ['Login com e-mail e com chave de acesso', 'Aprovado'],
    ['Cadastro de alvará único (CONSUMIDOR / PARTICULAR / POO)', 'Aprovado'],
    ['Cadastro de alvarás em lote (2 a 10 linhas)', 'Aprovado'],
    ['Edição de situação, responsável, protocolo e número do alvará', 'Aprovado'],
    ['Exclusão de alvará com confirmação', 'Aprovado'],
    ['Pesquisa e filtros (tipo, situação, empreiteira)', 'Aprovado'],
    ['Cálculo automático de largura/área da planilha (postes e cabos)', 'Aprovado'],
    ['Impressão da Solicitação e Planilha de Alvará', 'Aprovado'],
    ['Notificação da empreiteira ao mudar para RECEBIDO', 'Aprovado'],
    ['Restrição de acesso do usuário EMPREITEIRA (dados de outra empresa)', 'Aprovado'],
    ['Dashboard — estatísticas por situação/responsável/empreiteira', 'Aprovado'],
    ['Alternância de tema claro/escuro em todas as telas', 'Aprovado'],
    ['Aviso do React ao alternar cadastro único/lote (setState impuro)', 'Corrigido durante os testes'],
    ['Exibição de "Data Recebimento" com um dia de defasagem (fuso horário)', 'Corrigido durante os testes'],
  ], [4200, 4826]),
  pageBreak(),
];

// ============================================================
// 12. DIFICULDADES ENCONTRADAS
// ============================================================
const dificuldades = [
  h1('12. DIFICULDADES ENCONTRADAS'),
  bullet('Vazamento de escopo em agregação MongoDB: o uso de spread de objetos no filtro da rota de estatísticas sobrescrevia silenciosamente a restrição de empreiteira, exigindo o uso de $and para compor filtros com segurança.'),
  bullet('Consistência de tema escuro: como os tokens de cor do Tailwind são reaproveitados em todo o app (incluindo o documento de impressão), foi necessário fixar manualmente os valores de cor no componente de impressão para que ele nunca herdasse o tema escuro da aplicação.'),
  bullet('Regra de cálculo da Planilha de Alvará: a regra de arredondamento da área (múltiplo de 0,05 mais próximo, com formatação de no mínimo uma casa decimal) precisou ser deduzida e validada manualmente contra vários exemplos numéricos fornecidos antes da implementação.'),
  bullet('Exibição de datas "puras" (sem hora): datas gravadas à meia-noite UTC apareciam um dia antes quando formatadas com o fuso horário local do navegador, exigindo uma função de formatação específica baseada nos componentes UTC da data.'),
  bullet('Padronização de texto livre: o campo "responsável" era digitado livremente, o que gerava entradas como "gustavo", "GUSTAVO" e "Gustavo" sendo tratadas como pessoas diferentes nos gráficos do Dashboard — resolvido com normalização para caixa alta tanto no cadastro quanto nos dados já existentes.'),
  bullet('Atualização de estado entre componentes: o botão de alternância do modo de cadastro em lote inicialmente chamava o setState do componente pai dentro do "updater" do próprio estado local, o que o React sinaliza como atualização durante a renderização — corrigido movendo a chamada para fora do updater.'),
  pageBreak(),
];

// ============================================================
// 13. MELHORIAS FUTURAS
// ============================================================
const melhorias = [
  h1('13. MELHORIAS FUTURAS'),
  p('Durante o levantamento de requisitos, duas funcionalidades foram conscientemente adiadas para uma fase futura, por dependerem de armazenamento de arquivos em nível corporativo — fora do escopo deste TCC:'),
  bullet('Upload de Documentos/Anexos: anexar ao alvará arquivos como ART, Carta Acordo, Termo de Cessão de Crédito e Projeto.'),
  bullet('Solicitação de Alvará pela Empreiteira: fluxo em que a própria empreiteira sugere um novo alvará (sem número de projeto definido ainda), anexando documentos para a COPEL avaliar, aprovar ou recusar com uma lista de pendências.'),
  p('Outras melhorias identificadas como possíveis extensões futuras:'),
  bullet('Autenticação com renovação de token (refresh token), hoje limitada a uma sessão fixa de 7 dias.'),
  bullet('Relatórios exportáveis em PDF/Excel a partir do Dashboard.'),
  bullet('Permissões mais granulares dentro do próprio papel COPEL (ex.: apenas leitura para alguns funcionários).'),
  bullet('Histórico de alterações navegável diretamente na interface (hoje a rota existe na API, mas ainda não tem tela própria).'),
  pageBreak(),
];

// ============================================================
// 14. CONCLUSÃO
// ============================================================
const conclusao = [
  h1('14. CONCLUSÃO'),
  p('O desenvolvimento do Sistema de Controle de Alvará atingiu os objetivos definidos no início do projeto: o controle de alvarás, antes feito em planilhas isoladas e sem controle de acesso, passou a ser feito em uma aplicação web centralizada, com autenticação, controle de acesso por papel de usuário, trilha de auditoria e geração automática dos documentos formais exigidos pela prefeitura.'),
  p('Os requisitos funcionais levantados no início do trabalho foram implementados em sua totalidade; as duas funcionalidades que dependiam de armazenamento de arquivos corporativo foram conscientemente documentadas como melhorias futuras, decisão tomada em conjunto com o usuário final do sistema para manter o escopo do TCC viável dentro do prazo disponível.'),
  p('Entre os conhecimentos adquiridos ao longo do desenvolvimento, destacam-se: a modelagem de dados orientada a documentos no MongoDB, a construção de autenticação e controle de acesso por papel de usuário sem depender de bibliotecas prontas de terceiros, o cuidado necessário ao lidar com fuso horário em datas persistidas, e a importância de validar regras de negócio numéricas contra casos concretos antes de codificá-las.'),
  pageBreak(),
];

// ============================================================
// 15. REFERÊNCIAS
// ============================================================
const referencias = [
  h1('15. REFERÊNCIAS'),
  bullet('REACT. Documentação oficial. Disponível em: https://react.dev'),
  bullet('VITE. Documentação oficial. Disponível em: https://vitejs.dev'),
  bullet('NODE.JS. Documentação oficial. Disponível em: https://nodejs.org'),
  bullet('EXPRESS. Documentação oficial. Disponível em: https://expressjs.com'),
  bullet('MONGODB. Documentação oficial. Disponível em: https://www.mongodb.com/docs'),
  bullet('MONGOOSE. Documentação oficial. Disponível em: https://mongoosejs.com'),
  bullet('TAILWIND CSS. Documentação oficial. Disponível em: https://tailwindcss.com'),
  bullet('JSON WEB TOKENS (JWT). Introdução e especificação. Disponível em: https://jwt.io'),
  bullet('RECHARTS. Documentação oficial. Disponível em: https://recharts.org'),
  bullet('PLAYWRIGHT. Documentação oficial. Disponível em: https://playwright.dev'),
  bullet('Material didático do curso Técnico em Desenvolvimento de Sistemas — SENAI.'),
];

// ============================================================
// Documento final
// ============================================================
const doc = new Document({
  creator: 'Gustavo Yuji Iwamoto',
  title: 'Sistema de Controle de Alvará — Documentação do TCC',
  description: 'Documentação do Trabalho de Conclusão de Curso — SENAI',
  styles: {
    default: {
      document: { run: { font: 'Calibri', size: 22 } },
    },
    paragraphStyles: [
      { id: 'Heading1', name: 'Heading 1', basedOn: 'Normal', next: 'Normal', quickFormat: true, run: { size: 30, bold: true, color: 'B45309' }, paragraph: { spacing: { before: 240, after: 160 } } },
      { id: 'Heading2', name: 'Heading 2', basedOn: 'Normal', next: 'Normal', quickFormat: true, run: { size: 26, bold: true, color: '222222' }, paragraph: { spacing: { before: 200, after: 120 } } },
      { id: 'Heading3', name: 'Heading 3', basedOn: 'Normal', next: 'Normal', quickFormat: true, run: { size: 23, bold: true, italics: true, color: '444444' }, paragraph: { spacing: { before: 160, after: 100 } } },
    ],
  },
  sections: [
    {
      properties: {
        page: {
          size: { width: 11906, height: 16838 },
          margin: { top: 1440, bottom: 1440, left: 1440, right: 1440 },
        },
        titlePage: true,
      },
      headers: {
        default: new Header({
          children: [new Paragraph({ alignment: AlignmentType.RIGHT, children: [new TextRun({ text: 'Sistema de Controle de Alvará — TCC', size: 16, color: '999999' })] })],
        }),
        first: new Header({ children: [new Paragraph({ children: [] })] }),
      },
      footers: {
        default: new Footer({
          children: [new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [new TextRun({ text: 'Página ', size: 18, color: '999999' }), new TextRun({ children: [PageNumber.CURRENT], size: 18, color: '999999' })],
          })],
        }),
        first: new Footer({ children: [new Paragraph({ children: [] })] }),
      },
      children: [
        ...capa,
        ...sumario,
        ...introducao,
        ...objetivos,
        ...problema,
        ...tecnologias,
        ...requisitos,
        ...modelagem,
        ...bancoDeDados,
        ...backend,
        ...frontend,
        ...funcionalidades,
        ...testes,
        ...dificuldades,
        ...melhorias,
        ...conclusao,
        ...referencias,
      ],
    },
  ],
});

Packer.toBuffer(doc).then((buffer) => {
  const outPath = path.join(__dirname, '..', 'TCC_Gestao_Alvaras_Eletricos.docx');
  fs.writeFileSync(outPath, buffer);
  console.log('Gerado:', outPath, '(' + (buffer.length / 1024).toFixed(0) + ' KB)');
});
