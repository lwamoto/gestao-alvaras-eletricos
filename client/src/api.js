const API_URL = '/api/alvaras';

export async function listAlvaras(filtros = {}) {
  const params = new URLSearchParams();
  if (filtros.tipo) params.set('tipo', filtros.tipo);
  if (filtros.situacao) params.set('situacao', filtros.situacao);
  if (filtros.busca) params.set('busca', filtros.busca);
  if (filtros.empreiteira) params.set('empreiteira', filtros.empreiteira);

  const query = params.toString();
  const res = await fetch(query ? `${API_URL}?${query}` : API_URL);
  if (!res.ok) throw new Error('Falha ao buscar alvarás');
  return res.json();
}

export async function createAlvara(data) {
  const res = await fetch(API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  const body = await res.json();
  if (!res.ok) throw new Error(body.erro || 'Falha ao criar alvará');
  return body;
}

export async function getAlvaraPorProjeto(numeroProjeto) {
  const res = await fetch(`${API_URL}/projeto/${encodeURIComponent(numeroProjeto)}`);
  if (!res.ok) return null;
  return res.json();
}

export async function updateAlvara(id, alteracoes) {
  const res = await fetch(`${API_URL}/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(alteracoes),
  });
  if (!res.ok) throw new Error('Falha ao atualizar alvará');
  return res.json();
}

export async function deleteAlvara(id) {
  const res = await fetch(`${API_URL}/${id}`, { method: 'DELETE' });
  if (!res.ok) throw new Error('Falha ao excluir alvará');
}
