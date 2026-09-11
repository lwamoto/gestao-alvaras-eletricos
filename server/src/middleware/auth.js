import jwt from 'jsonwebtoken';

export function requireAuth(req, res, next) {
  const token = req.cookies?.sca_token;
  if (!token) {
    return res.status(401).json({ erro: 'Não autenticado.' });
  }

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    req.usuario = { id: payload.id, nome: payload.nome, email: payload.email };
    next();
  } catch {
    res.status(401).json({ erro: 'Não autenticado.' });
  }
}
