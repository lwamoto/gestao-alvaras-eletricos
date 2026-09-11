import { Router } from 'express';
import Alvara from '../models/Alvara.js';
import HistoricoAlvara from '../models/HistoricoAlvara.js';

const router = Router();

router.get('/', async (req, res) => {
  const filtro = {};
  if (req.query.tipo) filtro.tipo = req.query.tipo;
  if (req.query.situacao) filtro.situacao = req.query.situacao;
  if (req.query.busca) filtro.numeroProjeto = { $regex: req.query.busca, $options: 'i' };
  if (req.query.empreiteira) filtro.empreiteira = req.query.empreiteira;

  const pagina = Math.max(1, parseInt(req.query.pagina, 10) || 1);
  const limite = Math.min(200, Math.max(1, parseInt(req.query.limite, 10) || 50));

  const [total, dados] = await Promise.all([
    Alvara.countDocuments(filtro),
    Alvara.find(filtro)
      .sort({ createdAt: -1 })
      .skip((pagina - 1) * limite)
      .limit(limite),
  ]);

  res.json({
    dados,
    paginacao: { pagina, limite, total, totalPaginas: Math.max(1, Math.ceil(total / limite)) },
  });
});

router.get('/projeto/:numeroProjeto', async (req, res) => {
  const alvara = await Alvara.findOne({ numeroProjeto: req.params.numeroProjeto });
  if (!alvara) return res.status(404).json({ erro: 'Alvará não encontrado.' });
  res.json(alvara);
});

router.get('/:id/historico', async (req, res) => {
  const eventos = await HistoricoAlvara.find({ alvaraId: req.params.id }).sort({ createdAt: -1 });
  res.json(eventos);
});

router.post('/', async (req, res) => {
  try {
    const { numeroProjeto, tipo, empreiteira, situacao, responsavel } = req.body;
    const alvara = await Alvara.create({
      incluidoPor: req.usuario.nome,
      numeroProjeto,
      tipo,
      empreiteira: tipo === 'PARTICULAR' ? empreiteira : undefined,
      situacao,
      responsavel,
    });

    try {
      await HistoricoAlvara.create({
        alvaraId: alvara._id,
        numeroProjeto: alvara.numeroProjeto,
        acao: 'criado',
        usuarioId: req.usuario.id,
        usuarioNome: req.usuario.nome,
      });
    } catch (histErr) {
      console.error('Falha ao gravar histórico (criado):', histErr.message);
    }

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
  'dataMarcada',
  'qtdPostes',
  'qtdCaboM',
  'enderecos',
];

function valoresIguais(a, b) {
  if (a instanceof Date || b instanceof Date) {
    return new Date(a).getTime() === new Date(b).getTime();
  }
  return JSON.stringify(a) === JSON.stringify(b);
}

router.patch('/:id', async (req, res) => {
  try {
    const antes = await Alvara.findById(req.params.id);
    if (!antes) return res.status(404).json({ erro: 'Alvará não encontrado.' });

    const alteracoes = {};
    const diff = {};
    for (const campo of CAMPOS_EDITAVEIS) {
      if (req.body[campo] === undefined) continue;
      alteracoes[campo] = req.body[campo];
      if (!valoresIguais(antes[campo], req.body[campo])) {
        diff[campo] = { de: antes[campo], para: req.body[campo] };
      }
    }

    alteracoes.editadoPor = req.usuario.nome;
    alteracoes.editadoEm = new Date();

    const alvara = await Alvara.findByIdAndUpdate(req.params.id, alteracoes, {
      new: true,
      runValidators: true,
    });

    if (Object.keys(diff).length > 0) {
      try {
        await HistoricoAlvara.create({
          alvaraId: alvara._id,
          numeroProjeto: alvara.numeroProjeto,
          acao: 'editado',
          usuarioId: req.usuario.id,
          usuarioNome: req.usuario.nome,
          alteracoes: diff,
        });
      } catch (histErr) {
        console.error('Falha ao gravar histórico (editado):', histErr.message);
      }
    }

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

  try {
    await HistoricoAlvara.create({
      alvaraId: alvara._id,
      numeroProjeto: alvara.numeroProjeto,
      acao: 'excluido',
      usuarioId: req.usuario.id,
      usuarioNome: req.usuario.nome,
      alteracoes: {
        snapshot: {
          tipo: alvara.tipo,
          situacao: alvara.situacao,
          empreiteira: alvara.empreiteira,
          responsavel: alvara.responsavel,
        },
      },
    });
  } catch (histErr) {
    console.error('Falha ao gravar histórico (excluido):', histErr.message);
  }

  res.status(204).end();
});

export default router;
