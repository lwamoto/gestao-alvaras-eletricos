const API_URL = '/api/usuarios';

async function request(path, options = {}, fallback = 'Falha na requisição.') {
  const res = await fetch(path, { credentials: 'include', ...options });
  if (res.status === 204) return null;
  const contentType = res.headers.get('content-type') || '';
  const body = contentType.includes('application/json') ? await res.json() : null;
  if (!res.ok) throw new Error(body?.erro || fallback);
  return body;
}

export async function listUsuarios() {
  return request(API_URL, {}, 'Falha ao buscar usuários');
}

export async function createUsuario(dados) {
  return request(API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(dados),
  }, 'Falha ao criar usuário');
}

export async function updateUsuario(id, alteracoes) {
  return request(`${API_URL}/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(alteracoes),
  }, 'Falha ao atualizar usuário');
}

export async function deleteUsuario(id) {
  return request(`${API_URL}/${id}`, { method: 'DELETE' }, 'Falha ao excluir usuário');
}
