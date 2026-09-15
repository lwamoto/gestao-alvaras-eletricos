// Cria um usuário do SCA por linha de comando (bootstrap — depois disso,
// use a tela "Usuários" dentro do sistema, logado como um usuário COPEL).
// Uso COPEL:      node scripts/criarUsuario.js "Nome Completo" email@copel.com C807766 senha123
// Uso EMPREITEIRA: node scripts/criarUsuario.js "Nome Completo" email@jb.com "" senha123 EMPREITEIRA JB
import 'dotenv/config';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import Usuario from '../src/models/Usuario.js';
import Empreiteira from '../src/models/Empreiteira.js';

const [nome, email, chaveAcesso, senha, tipoArg, empreiteiraArg] = process.argv.slice(2);
const tipo = tipoArg || 'COPEL';
const empreiteira = empreiteiraArg || '';

function uso() {
  console.log('Uso: node scripts/criarUsuario.js "Nome Completo" email@copel.com C807766 senha123 [COPEL|EMPREITEIRA] [NomeEmpreiteira]');
}

async function main() {
  if (!nome || !senha) {
    uso();
    process.exit(1);
  }
  if (!email && !chaveAcesso) {
    console.error('Informe pelo menos um e-mail ou uma chave de acesso.');
    process.exit(1);
  }
  if (email && !/^\S+@\S+\.\S+$/.test(email)) {
    console.error('E-mail inválido.');
    process.exit(1);
  }
  if (senha.length < 6) {
    console.error('A senha precisa ter pelo menos 6 caracteres.');
    process.exit(1);
  }
  if (!['COPEL', 'EMPREITEIRA'].includes(tipo)) {
    console.error('Tipo inválido — use COPEL ou EMPREITEIRA.');
    process.exit(1);
  }
  if (tipo === 'EMPREITEIRA' && !empreiteira) {
    console.error('Informe o nome da empreiteira (6º argumento) para tipo EMPREITEIRA.');
    process.exit(1);
  }

  await mongoose.connect(process.env.MONGODB_URI);

  if (tipo === 'EMPREITEIRA') {
    const existeEmpreiteira = await Empreiteira.findOne({ nome: empreiteira.toUpperCase() });
    if (!existeEmpreiteira) {
      console.error(`Empreiteira "${empreiteira}" não cadastrada. Cadastre-a antes (tela Empreiteiras ou diretamente no banco).`);
      await mongoose.disconnect();
      process.exit(1);
    }
  }

  const existente = await Usuario.findOne({
    $or: [
      ...(email ? [{ email: email.toLowerCase() }] : []),
      ...(chaveAcesso ? [{ chaveAcesso: chaveAcesso.toUpperCase() }] : []),
    ],
  });
  if (existente) {
    console.error('Já existe um usuário com esse e-mail ou chave de acesso.');
    await mongoose.disconnect();
    process.exit(1);
  }

  const senhaHash = await bcrypt.hash(senha, 10);
  const usuario = await Usuario.create({
    nome,
    email: email || undefined,
    chaveAcesso: chaveAcesso || undefined,
    senhaHash,
    tipo,
    empreiteira: tipo === 'EMPREITEIRA' ? empreiteira : undefined,
  });

  console.log(`Usuário criado: ${usuario.nome} (${usuario.tipo}${usuario.empreiteira ? ' — ' + usuario.empreiteira : ''})`);
  await mongoose.disconnect();
  process.exit(0);
}

main().catch((err) => {
  console.error('Erro ao criar usuário:', err.message);
  process.exit(1);
});
