import { Router } from 'express';
import Alvara from '../models/Alvara.js';

const router = Router();

router.get('/', async (req, res) => {
  const filtro = {};
  if (req.query.tipo) filtro.tipo = req.query.tipo;
  if (req.query.situacao) filtro.situacao = req.query.situacao;
  if (req.query.busca) filtro.numeroProjeto = { $regex: req.query.busca, $options: 'i' };
  if (req.query.empreiteira) filtro.empreiteira = req.query.empreiteira;

  const alvaras = await Alvara.find(filtro).sort({ createdAt: -1 });
  res.json(alvaras);
});

router.get('/projeto/:numeroProjeto', async (req, res) => {
  const alvara = await Alvara.findOne({ numeroProjeto: req.params.numeroProjeto });
  if (!alvara) return res.status(404).json({ erro: 'Alvará não encontrado.' });
  res.json(alvara);
});

router.post('/', async (req, res) => {
  try {
    const { incluidoPor, numeroProjeto, tipo, empreiteira, situacao, responsavel } = req.body;
    const alvara = await Alvara.create({
      incluidoPor,
      numeroProjeto,
      tipo,
      empreiteira: tipo === 'PARTICULAR' ? empreiteira : undefined,
      situacao,
      responsavel,
    });
    res.status(201).json(alvara);
  } catch (err) {
    if (err.code === 11000) {
      return res.status(409).json({ erro: 'Já existe um alvará com esse número de projeto.' });
    }
    res.status(400).json({ erro: err.message });
  }
});

const CAMPOS_EDITAVEIS = [
  'numeroProjeto',
  'situacao',
  'responsavel',
  'ruaPrincipal',
  'transversal1',
  'transversal2',
  'prioridade',
  'dataMarcada',
  'qtdPostes',
  'qtdCaboM',
];

router.patch('/:id', async (req, res) => {
  try {
    const alteracoes = {};
    for (const campo of CAMPOS_EDITAVEIS) {
      if (req.body[campo] !== undefined) alteracoes[campo] = req.body[campo];
    }
    const alvara = await Alvara.findByIdAndUpdate(req.params.id, alteracoes, {
      new: true,
      runValidators: true,
    });
    if (!alvara) return res.status(404).json({ erro: 'Alvará não encontrado.' });
    res.json(alvara);
  } catch (err) {
    if (err.code === 11000) {
      return res.status(409).json({ erro: 'Já existe um alvará com esse número de projeto.' });
    }
    res.status(400).json({ erro: err.message });
  }
});

router.delete('/:id', async (req, res) => {
  const alvara = await Alvara.findByIdAndDelete(req.params.id);
  if (!alvara) return res.status(404).json({ erro: 'Alvará não encontrado.' });
  res.status(204).end();
});

export default router;
