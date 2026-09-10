import { api } from './client';

// GET /admin/cities — lista todas as cidades (ativas e inativas),
// usada pra popular filtros nas telas de riders/stores/deliveries.
export function listCities() {
  return api.get('/admin/cities', { auth: true });
}
