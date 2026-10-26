import { api } from './client';

// Regras de cálculo do valor da entrega (o que o entregador recebe), por cidade.

// GET /admin/pricing-rules — resumo: [{ city, rainActive, rain: { active, kind, value }, updatedAt }]
// Só traz as cidades que têm regra própria; as demais usam a regra padrão.
export function listPricingRules() {
  return api.get('/admin/pricing-rules', { auth: true });
}

// GET /admin/cities/:id/pricing — { city, custom, rule, updatedAt }
export function getCityPricing(cityId) {
  return api.get(`/admin/cities/${cityId}/pricing`, { auth: true });
}

// PUT /admin/cities/:id/pricing — grava a regra inteira
export function saveCityPricing(cityId, rule) {
  return api.put(`/admin/cities/${cityId}/pricing`, rule, { auth: true });
}

// DELETE /admin/cities/:id/pricing — volta para a regra padrão
export function resetCityPricing(cityId) {
  return api.delete(`/admin/cities/${cityId}/pricing`, { auth: true });
}

// PATCH /admin/cities/:id/pricing/rain — { active, kind?, value? }
export function setCityRain(cityId, payload) {
  return api.patch(`/admin/cities/${cityId}/pricing/rain`, payload, { auth: true });
}

// POST /admin/cities/:id/pricing/simulate — { km, at?, rule? } -> { total, breakdown }
export function simulateCityPricing(cityId, payload) {
  return api.post(`/admin/cities/${cityId}/pricing/simulate`, payload, { auth: true });
}
