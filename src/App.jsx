import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { RechargeProvider } from './context/RechargeContext';
import RequireAuth from './routes/RequireAuth';
import RequireGuest from './routes/RequireGuest';

import AuthLayout from './components/layout/AuthLayout';
import AppLayout from './components/layout/AppLayout';

import LoginPage from './pages/auth/LoginPage';
import DashboardPage from './pages/dashboard/DashboardPage';
import RidersPage from './pages/riders/RidersPage';
import RiderDetailPage from './pages/riders/RiderDetailPage';
import StoresPage from './pages/stores/StoresPage';
import StoreDetailPage from './pages/stores/StoreDetailPage';
import DeliveriesPage from './pages/deliveries/DeliveriesPage';
import PackagesPage from './pages/packages/PackagesPage';
import RechargesPage from './pages/recharges/RechargesPage';
import PlatformSettingsPage from './pages/settings/PlatformSettingsPage';
import NotFoundPage from './pages/NotFoundPage';

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <RechargeProvider>
        <Routes>
          <Route index element={<Navigate to="/dashboard" replace />} />

          {/* Rota pública — só login, sem cadastro (contas de admin são
              criadas via POST /admin/create por outro admin já autenticado,
              não tem tela própria pra isso ainda). */}
          <Route element={<RequireGuest />}>
            <Route element={<AuthLayout />}>
              <Route path="/login" element={<LoginPage />} />
            </Route>
          </Route>

          {/* Rotas autenticadas */}
          <Route element={<RequireAuth />}>
            <Route element={<AppLayout />}>
              <Route path="/dashboard" element={<DashboardPage />} />
              <Route path="/entregadores" element={<RidersPage />} />
              <Route path="/entregadores/:id" element={<RiderDetailPage />} />
              <Route path="/lojas" element={<StoresPage />} />
              <Route path="/lojas/:id" element={<StoreDetailPage />} />
              <Route path="/entregas" element={<DeliveriesPage />} />
              <Route path="/recargas" element={<RechargesPage />} />
              <Route path="/pacotes" element={<PackagesPage />} />
              <Route path="/faturamento" element={<PlatformSettingsPage />} />
            </Route>
          </Route>

          <Route path="*" element={<NotFoundPage />} />
        </Routes>
        </RechargeProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
