import { api } from './client';

// GET /admin/stores — lista paginada de lojas.
// { status?: 'active'|'inactive'|'all', city?, search?, page?, limit? }
export function listStores({ status, city, search, page, limit } = {}) {
  const params = new URLSearchParams();
  if (status) params.set('status', status);
  if (city) params.set('city', city);
  if (search) params.set('search', search);
  if (page) params.set('page', page);
  if (limit) params.set('limit', limit);

  const query = params.toString();
  return api.get(`/admin/stores${query ? `?${query}` : ''}`, { auth: true });
}

// GET /admin/stores/:id — detalhe de uma loja.
export function getStore(id) {
  return api.get(`/admin/stores/${id}`, { auth: true });
}

// PATCH /admin/stores/:id/active — { active: boolean } — ativa/desativa
// a conta da loja.
export function setStoreActive(id, active) {
  return api.patch(`/admin/stores/${id}/active`, { active }, { auth: true });
}
