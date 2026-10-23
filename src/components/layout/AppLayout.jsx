import { useState } from 'react';
import { Link, Outlet, useLocation } from 'react-router-dom';
import { Drawer, DrawerItems } from 'flowbite-react';
import AppSidebar from './AppSidebar';
import AppHeader from './AppHeader';
import { useRecharges } from '../../context/RechargeContext';

// Faixa fixa quando alguma loja avisou que pagou — some ao conferir tudo.
function RechargeBanner() {
  const { counts } = useRecharges();
  const { pathname } = useLocation();
  if (counts.informed <= 0 || pathname.startsWith('/recargas')) return null;
  return (
    <div
      role="alert"
      className="flex flex-wrap items-center justify-between gap-2 bg-amber px-4 py-2 text-sm text-white sm:px-6 lg:px-8"
    >
      <span>
        {counts.informed === 1
          ? '1 loja informou que pagou e aguarda sua conferência.'
          : `${counts.informed} lojas informaram que pagaram e aguardam sua conferência.`}
      </span>
      <Link to="/recargas" className="font-semibold underline">
        Conferir agora
      </Link>
    </div>
  );
}

export default function AppLayout() {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="flex min-h-screen bg-cream">
      {/* Sidebar fixa (desktop) */}
      <div className="hidden lg:block">
        <AppSidebar />
      </div>

      {/* Drawer (mobile) */}
      <Drawer open={mobileOpen} onClose={() => setMobileOpen(false)} className="p-0">
        <DrawerItems>
          <AppSidebar onNavigate={() => setMobileOpen(false)} />
        </DrawerItems>
      </Drawer>

      <div className="flex min-h-screen flex-1 flex-col">
        <AppHeader onOpenMenu={() => setMobileOpen(true)} />
        <RechargeBanner />

        <main className="flex-1 px-4 py-6 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-6xl">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
