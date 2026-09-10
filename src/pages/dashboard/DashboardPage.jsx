import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Alert, Button, Card, Spinner } from 'flowbite-react';
import {
  HiOutlineExclamationCircle,
  HiOutlineUserGroup,
  HiOutlineOfficeBuilding,
  HiOutlineTruck,
  HiOutlineCheckCircle,
  HiOutlineXCircle,
  HiOutlineRefresh,
  HiArrowRight,
} from 'react-icons/hi';
import { useAuth } from '../../context/AuthContext';
import { fetchDashboardStats } from '../../api/dashboard';

export default function DashboardPage() {
  const { admin } = useAuth();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadStats = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await fetchDashboardStats();
      setStats(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadStats();
  }, [loadStats]);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="mb-1 text-xl font-bold">Olá, {admin?.name?.split(' ')[0] || 'admin'} 👋</h1>
          <p className="text-sm text-ink-soft">Visão geral da plataforma Delivroo Express.</p>
        </div>
        <Button color="light" onClick={loadStats} disabled={loading}>
          <HiOutlineRefresh className="mr-2 h-4 w-4" />
          Atualizar
        </Button>
      </div>

      {error && (
        <Alert color="failure" onDismiss={() => setError('')}>
          {error}
        </Alert>
      )}

      {loading && !stats ? (
        <div className="flex justify-center py-16">
          <Spinner color="warning" size="xl" aria-label="Carregando dashboard" />
        </div>
      ) : stats ? (
        <>
          {/* Indicador de entregadores pendentes — o dado mais acionável do
              painel, por isso ganha destaque visual próprio, não é só mais
              um card no grid. */}
          {stats.riders.pendingApproval > 0 && (
            <Link to="/entregadores?status=pending">
              <Card className="border-2 border-amber bg-amber-bg transition hover:border-orange-dark">
                <div className="flex items-center gap-4">
                  <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-amber/20 text-amber">
                    <HiOutlineExclamationCircle className="h-7 w-7" />
                  </span>
                  <div className="flex-1">
                    <p className="font-heading text-lg font-bold text-ink">
                      {stats.riders.pendingApproval}{' '}
                      {stats.riders.pendingApproval === 1
                        ? 'entregador aguardando aprovação'
                        : 'entregadores aguardando aprovação'}
                    </p>
                    <p className="text-sm text-ink-soft">Revise os documentos e aprove as contas pendentes.</p>
                  </div>
                  <HiArrowRight className="h-5 w-5 shrink-0 text-ink-soft" />
                </div>
              </Card>
            </Link>
          )}

          {/* Entregadores */}
          <div>
            <p className="mb-3 text-sm font-medium text-ink">Entregadores</p>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
              <StatCard
                icon={HiOutlineUserGroup}
                color="bg-orange/10 text-orange-dark"
                label="Total"
                value={stats.riders.total}
              />
              <StatCard
                icon={HiOutlineCheckCircle}
                color="bg-green-bg text-green"
                label="Ativos"
                value={stats.riders.active}
              />
              <StatCard
                icon={HiOutlineXCircle}
                color="bg-red-bg text-red"
                label="Inativos"
                value={stats.riders.inactive}
              />
              <StatCard
                icon={HiOutlineExclamationCircle}
                color="bg-amber-bg text-amber"
                label="Pendentes"
                value={stats.riders.pendingApproval}
              />
            </div>
          </div>

          {/* Lojas */}
          <div>
            <p className="mb-3 text-sm font-medium text-ink">Lojas</p>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <StatCard
                icon={HiOutlineOfficeBuilding}
                color="bg-orange/10 text-orange-dark"
                label="Total"
                value={stats.stores.total}
              />
              <StatCard
                icon={HiOutlineCheckCircle}
                color="bg-green-bg text-green"
                label="Ativas"
                value={stats.stores.active}
              />
              <StatCard
                icon={HiOutlineXCircle}
                color="bg-red-bg text-red"
                label="Inativas"
                value={stats.stores.inactive}
              />
            </div>
          </div>

          {/* Entregas de hoje */}
          <div>
            <p className="mb-3 text-sm font-medium text-ink">Entregas de hoje</p>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <StatCard
                icon={HiOutlineTruck}
                color="bg-orange/10 text-orange-dark"
                label="Solicitadas"
                value={stats.deliveriesToday.requested}
              />
              <StatCard
                icon={HiOutlineCheckCircle}
                color="bg-green-bg text-green"
                label="Concluídas"
                value={stats.deliveriesToday.completed}
              />
              <StatCard
                icon={HiOutlineXCircle}
                color="bg-red-bg text-red"
                label="Canceladas/devolvidas"
                value={stats.deliveriesToday.cancelledOrReturned}
              />
            </div>
          </div>
        </>
      ) : null}
    </div>
  );
}

function StatCard({ icon: Icon, color, label, value }) {
  return (
    <Card className="border-line">
      <div className="flex items-center gap-3">
        <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${color}`}>
          <Icon className="h-5 w-5" />
        </span>
        <div className="min-w-0">
          <p className="text-xs text-ink-soft">{label}</p>
          <p className="truncate font-heading text-lg font-bold text-ink">{value}</p>
        </div>
      </div>
    </Card>
  );
}
