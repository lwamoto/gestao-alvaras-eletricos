const API_URL = '/api/alvaras';

async function request(path, options = {}, fallback = 'Falha na requisição.') {
  const res = await fetch(path, { credentials: 'include', ...options });
  if (res.status === 204) return null;
  const contentType = res.headers.get('content-type') || '';
  const body = contentType.includes('application/json') ? await res.json() : null;
  if (!res.ok) throw new Error(body?.erro || fallback);
  return body;
}

export async function listAlvaras(filtros = {}) {
  const params = new URLSearchParams();
  if (filtros.tipo) params.set('tipo', filtros.tipo);
  if (filtros.situacao) params.set('situacao', filtros.situacao);
  if (filtros.busca) params.set('busca', filtros.busca);
  if (filtros.empreiteira) params.set('empreiteira', filtros.empreiteira);
  if (filtros.pagina) params.set('pagina', filtros.pagina);
  if (filtros.limite) params.set('limite', filtros.limite);

  const query = params.toString();
  return request(query ? `${API_URL}?${query}` : API_URL, {}, 'Falha ao buscar alvarás');
}

export async function createAlvara(data) {
  return request(API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  }, 'Falha ao criar alvará');
}

export async function getAlvaraPorProjeto(numeroProjeto) {
  const res = await fetch(`${API_URL}/projeto/${encodeURIComponent(numeroProjeto)}`, {
    credentials: 'include',
  });
  if (!res.ok) return null;
  return res.json();
}

export async function updateAlvara(id, alteracoes) {
  return request(`${API_URL}/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(alteracoes),
  }, 'Falha ao atualizar alvará');
}

export async function deleteAlvara(id) {
  return request(`${API_URL}/${id}`, { method: 'DELETE' }, 'Falha ao excluir alvará');
}
