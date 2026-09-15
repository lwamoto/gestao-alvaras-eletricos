import { Router } from 'express';
import Empreiteira from '../models/Empreiteira.js';
import { requireCopel } from '../middleware/auth.js';

const router = Router();

// Listar é permitido pra qualquer usuário autenticado (o form de alvará
// precisa do combo, inclusive pro fluxo de cadastro só-COPEL). Escrever é
// restrito a COPEL.
router.get('/', async (req, res) => {
  const somenteAtivas = req.query.ativas === '1';
  const filtro = somenteAtivas ? { ativo: true } : {};
  const empreiteiras = await Empreiteira.find(filtro).sort({ nome: 1 });
  res.json(empreiteiras);
});

router.post('/', requireCopel, async (req, res) => {
  try {
    const { nome } = req.body;
    if (!nome || !nome.trim()) {
      return res.status(400).json({ erro: 'Nome da empreiteira é obrigatório.' });
    }
    const empreiteira = await Empreiteira.create({ nome });
    res.status(201).json(empreiteira);
  } catch (err) {
    if (err.code === 11000) {
      return res.status(409).json({ erro: 'Já existe uma empreiteira com esse nome.' });
    }
    res.status(400).json({ erro: err.message });
  }
});

router.patch('/:id', requireCopel, async (req, res) => {
  try {
    const { nome, ativo } = req.body;
    const alteracoes = {};
    if (nome !== undefined) alteracoes.nome = nome;
    if (ativo !== undefined) alteracoes.ativo = ativo;

    const empreiteira = await Empreiteira.findByIdAndUpdate(req.params.id, alteracoes, {
      new: true,
      runValidators: true,
    });
    if (!empreiteira) return res.status(404).json({ erro: 'Empreiteira não encontrada.' });
    res.json(empreiteira);
  } catch (err) {
    if (err.code === 11000) {
      return res.status(409).json({ erro: 'Já existe uma empreiteira com esse nome.' });
    }
    res.status(400).json({ erro: err.message });
  }
});

router.delete('/:id', requireCopel, async (req, res) => {
  const empreiteira = await Empreiteira.findByIdAndDelete(req.params.id);
  if (!empreiteira) return res.status(404).json({ erro: 'Empreiteira não encontrada.' });
  res.status(204).end();
});

export default router;
