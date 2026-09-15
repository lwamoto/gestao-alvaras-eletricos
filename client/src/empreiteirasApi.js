const API_URL = '/api/empreiteiras';

async function request(path, options = {}, fallback = 'Falha na requisição.') {
  const res = await fetch(path, { credentials: 'include', ...options });
  if (res.status === 204) return null;
  const contentType = res.headers.get('content-type') || '';
  const body = contentType.includes('application/json') ? await res.json() : null;
  if (!res.ok) throw new Error(body?.erro || fallback);
  return body;
}

export async function listEmpreiteiras({ somenteAtivas = false } = {}) {
  const query = somenteAtivas ? '?ativas=1' : '';
  return request(`${API_URL}${query}`, {}, 'Falha ao buscar empreiteiras');
}

export async function createEmpreiteira(nome) {
  return request(API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ nome }),
  }, 'Falha ao criar empreiteira');
}

export async function updateEmpreiteira(id, alteracoes) {
  return request(`${API_URL}/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(alteracoes),
  }, 'Falha ao atualizar empreiteira');
}

export async function deleteEmpreiteira(id) {
  return request(`${API_URL}/${id}`, { method: 'DELETE' }, 'Falha ao excluir empreiteira');
}
