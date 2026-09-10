import { api } from './client';

// GET /admin/deliveries — monitor de entregas da PLATAFORMA INTEIRA
// (todas as lojas/cidades), diferente das telas de loja/rider que só
// veem o próprio recorte.
// { status?: 0-6, city?, store?, rider?, page?, limit? }
export function listDeliveries({ status, city, store, rider, page, limit } = {}) {
  const params = new URLSearchParams();
  if (status !== undefined && status !== null && status !== '') params.set('status', status);
  if (city) params.set('city', city);
  if (store) params.set('store', store);
  if (rider) params.set('rider', rider);
  if (page) params.set('page', page);
  if (limit) params.set('limit', limit);

  const query = params.toString();
  return api.get(`/admin/deliveries${query ? `?${query}` : ''}`, { auth: true });
}
