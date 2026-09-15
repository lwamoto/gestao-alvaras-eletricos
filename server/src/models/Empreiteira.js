import mongoose from 'mongoose';

const empreiteiraSchema = new mongoose.Schema(
  {
    nome: { type: String, required: true, trim: true, uppercase: true, unique: true },
    ativo: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export default mongoose.model('Empreiteira', empreiteiraSchema);
