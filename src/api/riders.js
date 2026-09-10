import { api } from './client';

// GET /admin/riders — lista paginada de entregadores.
// { status?: 'pending'|'active'|'inactive'|'all', city?, search?, page?, limit? }
// -> { data, page, limit, total, totalPages }
export function listRiders({ status, city, search, page, limit } = {}) {
  const params = new URLSearchParams();
  if (status) params.set('status', status);
  if (city) params.set('city', city);
  if (search) params.set('search', search);
  if (page) params.set('page', page);
  if (limit) params.set('limit', limit);

  const query = params.toString();
  return api.get(`/admin/riders${query ? `?${query}` : ''}`, { auth: true });
}

// GET /admin/riders/:id — detalhe de um entregador (documento incluso,
// pra revisar antes de aprovar).
export function getRider(id) {
  return api.get(`/admin/riders/${id}`, { auth: true });
}

// PATCH /admin/riders/:id/approve — aprova a conta (accountApprovedAt).
// Exige que o entregador já tenha enviado o documento.
export function approveRider(id) {
  return api.patch(`/admin/riders/${id}/approve`, {}, { auth: true });
}

// PATCH /admin/riders/:id/active — { active: boolean } — ativa/desativa
// a conta do entregador.
export function setRiderActive(id, active) {
  return api.patch(`/admin/riders/${id}/active`, { active }, { auth: true });
}
