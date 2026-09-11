import { Router } from 'express';
import jwt from 'jsonwebtoken';
import Usuario from '../models/Usuario.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

const COOKIE_OPTS = {
  httpOnly: true,
  sameSite: 'lax',
  secure: process.env.NODE_ENV === 'production',
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 dias
};

function paraCliente(usuario) {
  return { id: usuario._id, nome: usuario.nome, email: usuario.email || null, chaveAcesso: usuario.chaveAcesso || null };
}

router.post('/login', async (req, res) => {
  const { identificador, senha } = req.body;
  if (!identificador || !senha) {
    return res.status(400).json({ erro: 'Informe o e-mail (ou chave de acesso) e a senha.' });
  }

  const usuario = await Usuario.autenticar(identificador, senha);
  if (!usuario) {
    return res.status(401).json({ erro: 'E-mail/chave ou senha inválidos.' });
  }

  const token = jwt.sign(
    { id: usuario._id, nome: usuario.nome, email: usuario.email },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  );

  res.cookie('sca_token', token, COOKIE_OPTS);
  res.json({ usuario: paraCliente(usuario) });
});

router.post('/logout', (req, res) => {
  res.clearCookie('sca_token', COOKIE_OPTS);
  res.status(204).end();
});

router.get('/me', requireAuth, async (req, res) => {
  const usuario = await Usuario.findById(req.usuario.id);
  if (!usuario) return res.status(401).json({ erro: 'Não autenticado.' });
  res.json({ usuario: paraCliente(usuario) });
});

export default router;
