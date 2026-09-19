import { api } from './client';

// GET /admin/platform-settings — configuração global de faturamento vigente
// (taxa por entrega e estado da promoção de entregas grátis).
export function getPlatformSettings() {
  return api.get('/admin/platform-settings', { auth: true });
}

// PATCH /admin/platform-settings — atualiza a configuração global.
// Todos os campos são opcionais; envie só o que mudou.
// { deliveryFee?, freeDeliveriesPromoActive?, freeDeliveriesGranted? }
export function updatePlatformSettings(payload) {
  return api.patch('/admin/platform-settings', payload, { auth: true });
}