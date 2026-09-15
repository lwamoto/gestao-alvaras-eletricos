import { Router } from 'express';
import bcrypt from 'bcryptjs';
import Usuario from '../models/Usuario.js';
import Empreiteira from '../models/Empreiteira.js';
import { requireCopel } from '../middleware/auth.js';

const router = Router();

// Toda a administração de usuários é restrita a COPEL — usuários EMPREITEIRA
// nunca acessam essas rotas (nem a tela correspondente no front).
router.use(requireCopel);

function paraCliente(usuario) {
  return {
    id: usuario._id,
    nome: usuario.nome,
    email: usuario.email || null,
    chaveAcesso: usuario.chaveAcesso || null,
    tipo: usuario.tipo,
    empreiteira: usuario.empreiteira || null,
    createdAt: usuario.createdAt,
  };
}

router.get('/', async (req, res) => {
  const usuarios = await Usuario.find().sort({ nome: 1 });
  res.json(usuarios.map(paraCliente));
});

router.post('/', async (req, res) => {
  try {
    const { nome, email, chaveAcesso, senha, tipo, empreiteira } = req.body;

    if (!nome || !senha) {
      return res.status(400).json({ erro: 'Nome e senha são obrigatórios.' });
    }
    if (!email && !chaveAcesso) {
      return res.status(400).json({ erro: 'Informe pelo menos um e-mail ou uma chave de acesso.' });
    }
    if (senha.length < 6) {
      return res.status(400).json({ erro: 'A senha precisa ter pelo menos 6 caracteres.' });
    }
    if (tipo === 'EMPREITEIRA') {
      const existe = await Empreiteira.findOne({ nome: String(empreiteira || '').toUpperCase(), ativo: true });
      if (!existe) return res.status(400).json({ erro: 'Empreiteira inválida ou inativa.' });
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

    res.status(201).json(paraCliente(usuario));
  } catch (err) {
    if (err.code === 11000) {
      return res.status(409).json({ erro: 'Já existe um usuário com esse e-mail ou chave de acesso.' });
    }
    res.status(400).json({ erro: err.message });
  }
});

router.patch('/:id', async (req, res) => {
  try {
    const { nome, email, chaveAcesso, senha, tipo, empreiteira } = req.body;

    if (tipo === 'EMPREITEIRA') {
      const existe = await Empreiteira.findOne({ nome: String(empreiteira || '').toUpperCase(), ativo: true });
      if (!existe) return res.status(400).json({ erro: 'Empreiteira inválida ou inativa.' });
    }

    const alteracoes = {
      nome,
      email: email || undefined,
      chaveAcesso: chaveAcesso || undefined,
      tipo,
      empreiteira: tipo === 'EMPREITEIRA' ? empreiteira : undefined,
    };
    if (senha) {
      if (senha.length < 6) {
        return res.status(400).json({ erro: 'A senha precisa ter pelo menos 6 caracteres.' });
      }
      alteracoes.senhaHash = await bcrypt.hash(senha, 10);
    }

    const usuario = await Usuario.findByIdAndUpdate(req.params.id, alteracoes, {
      new: true,
      runValidators: true,
    });
    if (!usuario) return res.status(404).json({ erro: 'Usuário não encontrado.' });

    res.json(paraCliente(usuario));
  } catch (err) {
    if (err.code === 11000) {
      return res.status(409).json({ erro: 'Já existe um usuário com esse e-mail ou chave de acesso.' });
    }
    res.status(400).json({ erro: err.message });
  }
});

router.delete('/:id', async (req, res) => {
  if (req.params.id === req.usuario.id) {
    return res.status(400).json({ erro: 'Você não pode excluir o próprio usuário.' });
  }
  const usuario = await Usuario.findByIdAndDelete(req.params.id);
  if (!usuario) return res.status(404).json({ erro: 'Usuário não encontrado.' });
  res.status(204).end();
});

export default router;
