import { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Alert, Avatar, Badge, Button, Card, Spinner } from 'flowbite-react';
import { HiOutlineArrowLeft, HiOutlineCheck, HiOutlineBan, HiOutlineCheckCircle, HiOutlineTruck } from 'react-icons/hi';
import { getRider, approveRider, setRiderActive } from '../../api/riders';
import { formatDateTime } from '../../utils/format';
import ConfirmModal from '../../components/ui/ConfirmModal';

function statusBadge(rider) {
  if (!rider.accountApprovedAt) return { color: 'warning', label: 'Pendente de aprovação' };
  if (!rider.active) return { color: 'failure', label: 'Inativo' };
  return { color: 'success', label: 'Ativo' };
}

export default function RiderDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [rider, setRider] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionError, setActionError] = useState('');
  const [actionSuccess, setActionSuccess] = useState('');
  const [confirmAction, setConfirmAction] = useState(null); // 'approve' | 'activate' | 'deactivate' | null
  const [actionLoading, setActionLoading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await getRider(id);
      setRider(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  async function handleConfirm() {
    setActionLoading(true);
    setActionError('');
    try {
      if (confirmAction === 'approve') {
        const data = await approveRider(id);
        setRider((prev) => ({ ...prev, ...data.rider }));
        setActionSuccess('Conta aprovada com sucesso.');
      } else if (confirmAction === 'activate') {
        const data = await setRiderActive(id, true);
        setRider((prev) => ({ ...prev, ...data.rider }));
        setActionSuccess('Conta ativada com sucesso.');
      } else if (confirmAction === 'deactivate') {
        const data = await setRiderActive(id, false);
        setRider((prev) => ({ ...prev, ...data.rider }));
        setActionSuccess('Conta desativada com sucesso.');
      }
      setConfirmAction(null);
    } catch (err) {
      setActionError(err.message);
    } finally {
      setActionLoading(false);
    }
  }

  if (loading && !rider) {
    return (
      <div className="flex justify-center py-16">
        <Spinner color="warning" size="xl" aria-label="Carregando entregador" />
      </div>
    );
  }

  if (error && !rider) {
    return (
      <div className="flex flex-col gap-4">
        <BackLink navigate={navigate} />
        <Alert color="failure">{error}</Alert>
      </div>
    );
  }

  if (!rider) return null;

  const badge = statusBadge(rider);
  const canApprove = !rider.accountApprovedAt && !!rider.documentImage;

  return (
    <div className="flex flex-col gap-6">
      <BackLink navigate={navigate} />

      {actionError && (
        <Alert color="failure" onDismiss={() => setActionError('')}>
          {actionError}
        </Alert>
      )}
      {actionSuccess && (
        <Alert color="success" onDismiss={() => setActionSuccess('')}>
          {actionSuccess}
        </Alert>
      )}

      {/* Cabeçalho */}
      <Card className="border-line">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <Avatar
              img={rider.avatar || undefined}
              rounded
              size="lg"
              placeholderInitials={rider.name?.charAt(0)?.toUpperCase()}
            />
            <div>
              <p className="font-heading text-lg font-bold text-ink">{rider.name}</p>
              <p className="text-sm text-ink-soft">{rider.email}</p>
              <Badge color={badge.color} className="mt-1 inline-flex w-fit">
                {badge.label}
              </Badge>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <Link to={`/entregas?rider=${rider._id}`}>
              <Button color="light">
                <HiOutlineTruck className="mr-2 h-4 w-4" />
                Ver entregas
              </Button>
            </Link>
            {canApprove && (
              <Button
                color="warning"
                className="bg-orange enabled:hover:bg-orange-dark"
                onClick={() => setConfirmAction('approve')}
              >
                <HiOutlineCheck className="mr-2 h-4 w-4" />
                Aprovar conta
              </Button>
            )}
            {rider.active ? (
              <Button color="failure" onClick={() => setConfirmAction('deactivate')}>
                <HiOutlineBan className="mr-2 h-4 w-4" />
                Desativar conta
              </Button>
            ) : (
              <Button color="success" onClick={() => setConfirmAction('activate')}>
                <HiOutlineCheckCircle className="mr-2 h-4 w-4" />
                Ativar conta
              </Button>
            )}
          </div>
        </div>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Dados pessoais */}
        <Card className="border-line">
          <p className="mb-4 text-sm font-medium text-ink">Dados pessoais</p>
          <dl className="flex flex-col gap-3 text-sm">
            <Field label="Telefone" value={rider.phone} />
            <Field label="CPF" value={rider.doc} />
            <Field label="Cidade" value={rider.city ? `${rider.city.name} - ${rider.city.state}` : '—'} />
            <Field label="Cadastrado em" value={formatDateTime(rider.createdAt)} />
            <Field label="E-mail verificado" value={rider.emailVerifiedAt ? formatDateTime(rider.emailVerifiedAt) : 'Não verificado'} />
            <Field label="Conta aprovada em" value={rider.accountApprovedAt ? formatDateTime(rider.accountApprovedAt) : '—'} />
          </dl>
        </Card>

        {/* Veículo */}
        <Card className="border-line">
          <p className="mb-4 text-sm font-medium text-ink">Veículo</p>
          <dl className="flex flex-col gap-3 text-sm">
            <Field label="Tipo" value={rider.vehicle?.type} />
            <Field label="Modelo" value={rider.vehicle?.model} />
            <Field label="Cor" value={rider.vehicle?.color} />
            <Field label="Placa" value={rider.vehicle?.plate} />
            <Field label="Avaliação" value={rider.rating != null ? `${rider.rating.toFixed(1)} (${rider.votes || 0} avaliações)` : '—'} />
          </dl>
        </Card>
      </div>

      {/* Documento */}
      <Card className="border-line">
        <p className="mb-4 text-sm font-medium text-ink">Documento enviado</p>
        {rider.documentImage ? (
          <a href={rider.documentImage} target="_blank" rel="noreferrer">
            <img
              src={rider.documentImage}
              alt="Documento enviado pelo entregador"
              className="max-h-96 w-full rounded-lg border border-line object-contain"
            />
          </a>
        ) : (
          <p className="text-sm text-ink-soft">O entregador ainda não enviou nenhum documento.</p>
        )}
      </Card>

      <ConfirmModal
        show={confirmAction === 'approve'}
        title="Aprovar conta do entregador"
        message={`Tem certeza que deseja aprovar a conta de ${rider.name}? Ele poderá ficar online e aceitar entregas assim que aprovado.`}
        confirmLabel="Aprovar"
        confirmColor="warning"
        loading={actionLoading}
        onConfirm={handleConfirm}
        onCancel={() => setConfirmAction(null)}
      />
      <ConfirmModal
        show={confirmAction === 'deactivate'}
        title="Desativar conta do entregador"
        message={`Tem certeza que deseja desativar a conta de ${rider.name}? Ele não vai mais conseguir fazer login nem aceitar entregas até ser reativado.`}
        confirmLabel="Desativar"
        confirmColor="failure"
        loading={actionLoading}
        onConfirm={handleConfirm}
        onCancel={() => setConfirmAction(null)}
      />
      <ConfirmModal
        show={confirmAction === 'activate'}
        title="Ativar conta do entregador"
        message={`Tem certeza que deseja reativar a conta de ${rider.name}?`}
        confirmLabel="Ativar"
        confirmColor="success"
        loading={actionLoading}
        onConfirm={handleConfirm}
        onCancel={() => setConfirmAction(null)}
      />
    </div>
  );
}

function Field({ label, value }) {
  return (
    <div className="flex justify-between gap-4">
      <dt className="text-ink-soft">{label}</dt>
      <dd className="text-right font-medium text-ink">{value || '—'}</dd>
    </div>
  );
}

function BackLink({ navigate }) {
  return (
    <Link
      to="/entregadores"
      onClick={(e) => {
        e.preventDefault();
        navigate(-1);
      }}
      className="flex w-fit items-center gap-2 text-sm font-medium text-ink-soft hover:text-orange-dark"
    >
      <HiOutlineArrowLeft className="h-4 w-4" />
      Voltar
    </Link>
  );
}
