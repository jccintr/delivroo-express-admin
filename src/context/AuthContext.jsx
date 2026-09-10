import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { fetchCurrentAdmin, loginAdmin } from '../api/adminAuth';
import { getToken, setToken } from '../api/client';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [admin, setAdmin] = useState(null);
  const [status, setStatus] = useState('loading'); // loading | authenticated | guest

  // Restaura a sessão a partir do token salvo no localStorage — é isso que
  // evita ter que logar toda hora: se o token ainda for válido, o admin
  // continua autenticado mesmo depois de fechar a aba/navegador.
  const loadSession = useCallback(async () => {
    const token = getToken();
    if (!token) {
      setStatus('guest');
      return;
    }
    try {
      const data = await fetchCurrentAdmin();
      setAdmin(data);
      setStatus('authenticated');
    } catch {
      setToken(null);
      setAdmin(null);
      setStatus('guest');
    }
  }, []);

  useEffect(() => {
    loadSession();
  }, [loadSession]);

  async function login({ email, password }) {
    const data = await loginAdmin({ email, password });
    const { token, ...adminData } = data;
    setToken(token);
    setAdmin(adminData);
    setStatus('authenticated');
    return adminData;
  }

  function logout() {
    setToken(null);
    setAdmin(null);
    setStatus('guest');
  }

  return (
    <AuthContext.Provider value={{ admin, status, login, logout, refresh: loadSession }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth precisa ser usado dentro de <AuthProvider>');
  return ctx;
}
