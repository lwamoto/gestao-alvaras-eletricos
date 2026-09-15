import jwt from 'jsonwebtoken';

export function requireAuth(req, res, next) {
  const token = req.cookies?.sca_token;
  if (!token) {
    return res.status(401).json({ erro: 'Não autenticado.' });
  }

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    req.usuario = {
      id: payload.id,
      nome: payload.nome,
      email: payload.email,
      tipo: payload.tipo,
      empreiteira: payload.empreiteira || null,
    };
    next();
  } catch {
    res.status(401).json({ erro: 'Não autenticado.' });
  }
}

// Usuários do tipo EMPREITEIRA têm acesso só de leitura, restrito à própria
// empreiteira — ações de escrita e telas administrativas exigem tipo COPEL.
export function requireCopel(req, res, next) {
  if (req.usuario?.tipo !== 'COPEL') {
    return res.status(403).json({ erro: 'Acesso restrito a usuários COPEL.' });
  }
  next();
}
