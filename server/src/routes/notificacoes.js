import { Router } from 'express';
import Notificacao from '../models/Notificacao.js';

const router = Router();

// Notificação hoje só existe no sentido COPEL → empreiteira. Um usuário
// COPEL (sem `empreiteira` no token) nunca tem nada endereçado a ele aqui —
// a query com empreiteira=null simplesmente não bate com nada, então a
// rota já "funciona vazia" pra ele sem precisar de um bloqueio explícito.
router.get('/', async (req, res) => {
  const notificacoes = await Notificacao.find({ empreiteira: req.usuario.empreiteira })
    .sort({ createdAt: -1 })
    .limit(50);
  res.json(notificacoes);
});

router.get('/nao-lidas', async (req, res) => {
  const total = await Notificacao.countDocuments({ empreiteira: req.usuario.empreiteira, lida: false });
  res.json({ total });
});

router.patch('/:id/marcar-lida', async (req, res) => {
  const notificacao = await Notificacao.findOneAndUpdate(
    { _id: req.params.id, empreiteira: req.usuario.empreiteira },
    { lida: true },
    { new: true }
  );
  if (!notificacao) return res.status(404).json({ erro: 'Notificação não encontrada.' });
  res.json(notificacao);
});

router.patch('/marcar-todas-lidas', async (req, res) => {
  await Notificacao.updateMany({ empreiteira: req.usuario.empreiteira, lida: false }, { lida: true });
  res.status(204).end();
});

export default router;
