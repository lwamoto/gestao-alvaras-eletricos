import mongoose from 'mongoose';

// Notificação simples, dirigida a uma empreiteira inteira (não a um usuário
// específico) — hoje cada empreiteira tem no máximo um usuário vinculado,
// então isso é suficiente sem precisar de uma tabela de leitura por usuário.
const notificacaoSchema = new mongoose.Schema(
  {
    empreiteira: { type: String, required: true, trim: true, uppercase: true },
    alvaraId: { type: mongoose.Schema.Types.ObjectId, ref: 'Alvara', required: true },
    numeroProjeto: { type: String, required: true },
    mensagem: { type: String, required: true },
    lida: { type: Boolean, default: false },
    criadoPor: { type: String, required: true },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

export default mongoose.model('Notificacao', notificacaoSchema);
