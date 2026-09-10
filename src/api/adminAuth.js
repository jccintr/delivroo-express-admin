import { api } from './client';

// POST /admin/login — { email, password } -> { ...admin, token }
export function loginAdmin(payload) {
  return api.post('/admin/login', payload);
}

// GET /admin/me — retorna o admin autenticado
export function fetchCurrentAdmin() {
  return api.get('/admin/me', { auth: true });
}
