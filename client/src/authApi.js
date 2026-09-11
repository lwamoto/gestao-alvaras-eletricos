const AUTH_URL = '/api/auth';

async function request(path, options = {}, fallback = 'Falha na requisição.') {
  const res = await fetch(path, { credentials: 'include', ...options });
  if (res.status === 204) return null;
  const contentType = res.headers.get('content-type') || '';
  const body = contentType.includes('application/json') ? await res.json() : null;
  if (!res.ok) throw new Error(body?.erro || fallback);
  return body;
}

export async function login(identificador, senha) {
  const { usuario } = await request(
    `${AUTH_URL}/login`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ identificador, senha }),
    },
    'Falha ao entrar.'
  );
  return usuario;
}

export async function logout() {
  await request(`${AUTH_URL}/logout`, { method: 'POST' }, 'Falha ao sair.');
}

export async function me() {
  const { usuario } = await request(`${AUTH_URL}/me`, {}, 'Não autenticado.');
  return usuario;
}
