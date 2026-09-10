import { useEffect, useState } from 'react';
import { NavLink } from 'react-router-dom';
import {
  HiOutlineViewGrid,
  HiOutlineUserGroup,
  HiOutlineOfficeBuilding,
  HiOutlineTruck,
} from 'react-icons/hi';
import Logo from '../Logo';
import { fetchDashboardStats } from '../../api/dashboard';

const links = [
  { to: '/dashboard', label: 'Dashboard', icon: HiOutlineViewGrid },
  { to: '/entregadores', label: 'Entregadores', icon: HiOutlineUserGroup, showPendingBadge: true },
  { to: '/lojas', label: 'Lojas', icon: HiOutlineOfficeBuilding },
  { to: '/entregas', label: 'Entregas', icon: HiOutlineTruck },
];

// Intervalo de atualização do indicador de pendentes na sidebar — não
// precisa ser em tempo real, só não deixar o número ficar velho por muito
// tempo enquanto o admin navega entre as telas.
const POLLING_INTERVAL_MS = 30000;

export default function AppSidebar({ onNavigate }) {
  const [pendingCount, setPendingCount] = useState(0);

  useEffect(() => {
    let active = true;

    async function loadPending() {
      try {
        const data = await fetchDashboardStats();
        if (active) setPendingCount(data.riders.pendingApproval);
      } catch {
        // Best-effort: badge da sidebar não é crítico o bastante pra
        // exibir erro — a tela de Entregadores mostra o mesmo dado.
      }
    }

    loadPending();
    const intervalId = setInterval(loadPending, POLLING_INTERVAL_MS);
    return () => {
      active = false;
      clearInterval(intervalId);
    };
  }, []);

  return (
    <div className="flex h-full w-64 flex-col border-r border-line bg-white">
      <div className="flex items-center gap-2 px-2 py-5 mb-4">
        <Logo />
      </div>

      <nav className="flex-1 space-y-1 px-3">
        {links.map(({ to, label, icon: Icon, showPendingBadge }) => (
          <NavLink
            key={to}
            to={to}
            onClick={onNavigate}
            className={({ isActive }) =>
              `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-orange/10 text-orange-dark'
                  : 'text-ink-soft hover:bg-cream hover:text-ink'
              }`
            }
          >
            <Icon className="h-5 w-5 shrink-0" />
            <span className="flex-1">{label}</span>
            {showPendingBadge && pendingCount > 0 && (
              <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-amber px-1.5 text-xs font-semibold text-white">
                {pendingCount > 9 ? '9+' : pendingCount}
              </span>
            )}
          </NavLink>
        ))}
      </nav>

      <div className="border-t border-line px-6 py-4 font-mono text-xs text-ink-soft">
        Delivroo Admin · v1.0
      </div>
    </div>
  );
}
