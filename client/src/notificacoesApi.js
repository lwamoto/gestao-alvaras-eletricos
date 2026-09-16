const API_URL = '/api/notificacoes';

async function request(path, options = {}, fallback = 'Falha na requisição.') {
  const res = await fetch(path, { credentials: 'include', ...options });
  if (res.status === 204) return null;
  const contentType = res.headers.get('content-type') || '';
  const body = contentType.includes('application/json') ? await res.json() : null;
  if (!res.ok) throw new Error(body?.erro || fallback);
  return body;
}

export async function listNotificacoes() {
  return request(API_URL, {}, 'Falha ao buscar notificações');
}

export async function contarNaoLidas() {
  const { total } = await request(`${API_URL}/nao-lidas`, {}, 'Falha ao buscar notificações');
  return total;
}

export async function marcarLida(id) {
  return request(`${API_URL}/${id}/marcar-lida`, { method: 'PATCH' }, 'Falha ao marcar notificação como lida');
}

export async function marcarTodasLidas() {
  return request(`${API_URL}/marcar-todas-lidas`, { method: 'PATCH' }, 'Falha ao marcar notificações como lidas');
}
