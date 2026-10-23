import { api } from './client';

// ---- Pacotes de entregas (CRUD) ----
export function listPackages() {
  return api.get('/admin/credit-packages', { auth: true });
}
export function createPackage({ name, deliveries, price }) {
  return api.post('/admin/credit-packages', { name, deliveries, price }, { auth: true });
}
export function updatePackage(id, changes) {
  return api.patch(`/admin/credit-packages/${id}`, changes, { auth: true });
}
export function deletePackage(id) {
  return api.delete(`/admin/credit-packages/${id}`, { auth: true });
}

// ---- Pedidos de recarga ----
// Contadores { informed, pending } para o destaque do painel.
export function getRechargeSummary() {
  return api.get('/admin/recharge-orders/summary', { auth: true });
}
export function listRechargeOrders({ status, page = 1, limit = 20 } = {}) {
  const params = new URLSearchParams({ page, limit });
  if (status) params.set('status', status);
  return api.get(`/admin/recharge-orders?${params}`, { auth: true });
}
export function confirmRechargeOrder(id) {
  return api.post(`/admin/recharge-orders/${id}/confirm`, {}, { auth: true });
}
export function rejectRechargeOrder(id, reason) {
  return api.post(`/admin/recharge-orders/${id}/reject`, { reason }, { auth: true });
}

// ---- Saldo de uma loja ----
export function getStoreCredits(storeId) {
  return api.get(`/admin/stores/${storeId}/credits`, { auth: true });
}
// delta positivo soma, negativo tira; note = motivo (obrigatório).
export function adjustStoreCredits(storeId, { delta, note }) {
  return api.post(`/admin/stores/${storeId}/credits`, { delta, note }, { auth: true });
}
