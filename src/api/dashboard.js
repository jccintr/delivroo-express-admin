import { api } from './client';

// GET /admin/dashboard — indicadores gerais da plataforma: riders
// (total/ativos/inativos/pendentes de aprovação), lojas (total/ativas/
// inativas) e entregas de hoje (solicitadas/concluídas/canceladas).
export function fetchDashboardStats() {
  return api.get('/admin/dashboard', { auth: true });
}
