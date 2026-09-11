// Cria um usuário do SCA por linha de comando (sem tela de auto-cadastro).
// Uso: node scripts/criarUsuario.js "Nome Completo" email@copel.com C807766 senha123
import 'dotenv/config';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import Usuario from '../src/models/Usuario.js';

const [nome, email, chaveAcesso, senha] = process.argv.slice(2);

function uso() {
  console.log('Uso: node scripts/criarUsuario.js "Nome Completo" email@copel.com C807766 senha123');
}

async function main() {
  if (!nome || !email || !chaveAcesso || !senha) {
    uso();
    process.exit(1);
  }
  if (!/^\S+@\S+\.\S+$/.test(email)) {
    console.error('E-mail inválido.');
    process.exit(1);
  }
  if (senha.length < 6) {
    console.error('A senha precisa ter pelo menos 6 caracteres.');
    process.exit(1);
  }

  await mongoose.connect(process.env.MONGODB_URI);

  const existente = await Usuario.findOne({
    $or: [{ email: email.toLowerCase() }, { chaveAcesso: chaveAcesso.toUpperCase() }],
  });
  if (existente) {
    console.error('Já existe um usuário com esse e-mail ou chave de acesso.');
    await mongoose.disconnect();
    process.exit(1);
  }

  const senhaHash = await bcrypt.hash(senha, 10);
  const usuario = await Usuario.create({ nome, email, chaveAcesso, senhaHash });

  console.log(`Usuário criado: ${usuario.nome} (${usuario.email} / ${usuario.chaveAcesso})`);
  await mongoose.disconnect();
  process.exit(0);
}

main().catch((err) => {
  console.error('Erro ao criar usuário:', err.message);
  process.exit(1);
});
