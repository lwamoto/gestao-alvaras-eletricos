import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const usuarioSchema = new mongoose.Schema(
  {
    nome: { type: String, required: true, trim: true },
    email: {
      type: String,
      trim: true,
      lowercase: true,
      unique: true,
      sparse: true, // permite múltiplos docs sem email, mas único quando presente
    },
    chaveAcesso: {
      type: String,
      trim: true,
      uppercase: true,
      unique: true,
      sparse: true,
    },
    senhaHash: { type: String, required: true, select: false },
  },
  { timestamps: true }
);

usuarioSchema.pre('validate', function (next) {
  if (!this.email && !this.chaveAcesso) {
    next(new Error('Informe pelo menos um e-mail ou uma chave de acesso.'));
    return;
  }
  next();
});

usuarioSchema.statics.autenticar = async function (identificador, senha) {
  const valor = String(identificador || '').trim().toLowerCase();
  if (!valor) return null;

  const usuario = await this.findOne({
    $or: [{ email: valor }, { chaveAcesso: valor.toUpperCase() }],
  }).select('+senhaHash');

  if (!usuario) return null;

  const confere = await bcrypt.compare(senha, usuario.senhaHash);
  return confere ? usuario : null;
};

export default mongoose.model('Usuario', usuarioSchema);
