import mongoose from 'mongoose';

const enderecoSchema = {
  naturezaServico: { type: String, enum: ['5', '9', '290', 'Z'], default: '5' },
  localObra: { type: String, trim: true, default: '' },
  transversal1: { type: String, trim: true, default: '' },
  transversal2: { type: String, trim: true, default: '' },
  qtdExtensao: { type: Number, default: 0 },
  larguraM: { type: Number, default: 0 },
  pavimento: { type: String, trim: true, default: '' },
  areaM2: { type: Number, default: 0 },
  folhaNumero: { type: String, trim: true, default: '' },
};

const alvaraSchema = new mongoose.Schema(
  {
    incluidoPor: { type: String, required: true, trim: true },
    numeroProjeto: { type: String, required: true, unique: true, trim: true },
    tipo: { type: String, required: true, enum: ['CONSUMIDOR', 'PARTICULAR', 'POO'] },
    // Validada contra a coleção Empreiteira nas rotas de criação/edição
    // (server/src/routes/alvaras.js) — não usamos mongoose `enum` aqui porque
    // a lista agora é gerenciável via CRUD, não fixa no schema.
    empreiteira: {
      type: String,
      trim: true,
      uppercase: true,
      required: [function () { return this.tipo === 'PARTICULAR'; }, 'Empreiteira é obrigatória para alvará PARTICULAR'],
    },
    situacao: {
      type: String,
      required: true,
      enum: ['A_FAZER', 'ENVIADO', 'RECEBIDO', 'NAO_NECESSARIO'],
      default: 'A_FAZER',
    },
    dataMarcada: { type: Date, default: Date.now },
    // Data em que o número do alvará (abaixo) foi efetivamente recebido —
    // só faz sentido quando situacao === 'RECEBIDO', mas fica livre pra
    // não travar edição fora de ordem.
    dataRecebimentoAlvara: { type: Date },
    // Número real emitido pela prefeitura (ex: "2026/0017734").
    numeroAlvara: { type: String, trim: true, default: '' },
    // Protocolo interno da empreiteira (padrão "01.<código>") — só relevante
    // pra alvará PARTICULAR, mas não é obrigatório.
    protocolo: { type: String, trim: true, default: '' },
    // uppercase:true evita "gustavo"/"GUSTAVO"/"Gustavo" quebrando o
    // agrupamento por responsável no Dashboard.
    responsavel: { type: String, trim: true, uppercase: true, default: '' },
    ruaPrincipal: { type: String, trim: true, default: '' },
    transversal1: { type: String, trim: true, default: '' },
    transversal2: { type: String, trim: true, default: '' },
    qtdPostes: { type: Number, default: 0 },
    qtdCaboM: { type: Number, default: 0 },
    enderecos: { type: [enderecoSchema], default: [] },
    editadoPor: { type: String },
    editadoEm: { type: Date },
  },
  { timestamps: true }
);

export default mongoose.model('Alvara', alvaraSchema);
