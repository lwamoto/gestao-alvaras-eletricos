import mongoose from 'mongoose';

const historicoAlvaraSchema = new mongoose.Schema(
  {
    alvaraId: { type: mongoose.Schema.Types.ObjectId, ref: 'Alvara', required: true },
    numeroProjeto: { type: String, required: true },
    acao: { type: String, enum: ['criado', 'editado', 'excluido'], required: true },
    usuarioId: { type: mongoose.Schema.Types.ObjectId, ref: 'Usuario', required: true },
    usuarioNome: { type: String, required: true },
    alteracoes: { type: mongoose.Schema.Types.Mixed },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

export default mongoose.model('HistoricoAlvara', historicoAlvaraSchema);
