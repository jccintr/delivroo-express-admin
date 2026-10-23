import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Alert,
  Badge,
  Button,
  Card,
  Label,
  Modal,
  ModalBody,
  ModalHeader,
  Spinner,
  Textarea,
} from 'flowbite-react';
import {
  confirmRechargeOrder,
  listRechargeOrders,
  rejectRechargeOrder,
} from '../../api/credits';
import { useRecharges } from '../../context/RechargeContext';
import { formatCurrency, formatDateTime } from '../../utils/format';
import ConfirmModal from '../../components/ui/ConfirmModal';

const TABS = [
  { key: 'informed', label: 'Para conferir' },
  { key: 'pending', label: 'Aguardando pagamento' },
  { key: 'confirmed', label: 'Confirmados' },
  { key: 'rejected', label: 'Recusados' },
  { key: 'cancelled', label: 'Cancelados' },
  { key: '', label: 'Todos' },
];

const STATUS = {
  pending: { label: 'Aguardando pagamento', color: 'warning' },
  informed: { label: 'Pagamento informado', color: 'info' },
  confirmed: { label: 'Confirmado', color: 'success' },
  rejected: { label: 'Recusado', color: 'failure' },
  cancelled: { label: 'Cancelado', color: 'gray' },
};

function RejectModal({ order, onClose, onDone }) {
  const [reason, setReason] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  async function submit(e) {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      await rejectRechargeOrder(order.id, reason.trim());
      onDone();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal show onClose={onClose} size="md">
      <ModalHeader>Recusar pagamento</ModalHeader>
      <ModalBody>
        <form className="flex flex-col gap-4" onSubmit={submit}>
          <p className="text-sm text-ink-soft">
            Pedido {order.code} de {order.store.name}. A loja recebe o motivo por e-mail e no painel.
          </p>
          {error && <Alert color="failure">{error}</Alert>}
          <div>
            <Label htmlFor="reason" className="mb-1 block">
              Motivo
            </Label>
            <Textarea
              id="reason"
              rows={3}
              maxLength={200}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Ex: não encontrei o Pix de R$ 28,00 na minha conta"
              required
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button color="light" onClick={onClose} disabled={saving}>
              Voltar
            </Button>
            <Button type="submit" color="failure" disabled={saving}>
              {saving ? <Spinner size="sm" /> : 'Recusar'}
            </Button>
          </div>
        </form>
      </ModalBody>
    </Modal>
  );
}

export default function RechargesPage() {
  const { version, refresh } = useRecharges();
  const [tab, setTab] = useState('informed');
  const [page, setPage] = useState(1);
  const [data, setData] = useState({ data: [], totalPages: 1 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [confirming, setConfirming] = useState(null);
  const [rejecting, setRejecting] = useState(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    setError('');
    try {
      setData(await listRechargeOrders({ status: tab, page }));
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [tab, page]);

  useEffect(() => {
    setLoading(true);
    load();
  }, [load, version]);

  function changeTab(key) {
    setTab(key);
    setPage(1);
  }

  async function handleConfirm() {
    setBusy(true);
    setError('');
    try {
      await confirmRechargeOrder(confirming.id);
      setSuccess(`Pedido ${confirming.code} confirmado: ${confirming.package.deliveries} entregas creditadas.`);
      setConfirming(null);
      await Promise.all([load(), refresh()]);
    } catch (err) {
      setError(err.message);
      setConfirming(null);
    } finally {
      setBusy(false);
    }
  }

  async function handleRejected() {
    setSuccess(`Pedido ${rejecting.code} recusado.`);
    setRejecting(null);
    await Promise.all([load(), refresh()]);
  }

  const orders = data.data || [];

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="mb-1 text-xl font-bold">Recargas</h1>
        <p className="text-sm text-ink-soft">
          Confira o Pix na sua conta e confirme. As entregas só entram no saldo da loja depois de
          confirmar aqui.
        </p>
      </div>

      {error && (
        <Alert color="failure" onDismiss={() => setError('')}>
          {error}
        </Alert>
      )}
      {success && (
        <Alert color="success" onDismiss={() => setSuccess('')}>
          {success}
        </Alert>
      )}

      <div className="flex flex-wrap gap-2">
        {TABS.map((t) => {
          const count = t.key === 'informed' ? data.counts?.informed : t.key === 'pending' ? data.counts?.pending : null;
          return (
            <Button
              key={t.key || 'all'}
              size="sm"
              color={tab === t.key ? 'warning' : 'light'}
              className={tab === t.key ? 'bg-orange text-white' : ''}
              onClick={() => changeTab(t.key)}
            >
              {t.label}
              {count > 0 && (
                <span className="ml-2 rounded-full bg-amber px-1.5 text-xs font-semibold text-white">
                  {count}
                </span>
              )}
            </Button>
          );
        })}
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <Spinner color="warning" size="xl" aria-label="Carregando recargas" />
        </div>
      ) : orders.length === 0 ? (
        <Card className="border-line">
          <p className="text-sm text-ink-soft">Nenhum pedido nesta aba.</p>
        </Card>
      ) : (
        <ul className="flex flex-col gap-3">
          {orders.map((o) => (
            <li
              key={o.id}
              className={`rounded-lg border bg-white p-4 ${
                o.status === 'informed' ? 'border-2 border-amber bg-amber-bg' : 'border-line'
              }`}
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-heading font-bold text-ink">
                    {o.code} · {formatCurrency(o.package.price)}
                  </p>
                  <p className="text-sm">
                    <Link to={`/lojas/${o.store.id}`} className="font-medium text-orange-dark underline">
                      {o.store.name || 'Loja'}
                    </Link>
                    {o.store.phone ? ` · ${o.store.phone}` : ''}
                  </p>
                  <p className="text-sm text-ink-soft">
                    {o.package.name} · {o.package.deliveries} entregas · pedido em{' '}
                    {formatDateTime(o.createdAt)}
                  </p>
                  {o.informedAt && (
                    <p className="text-sm text-ink-soft">
                      Informou pagamento em {formatDateTime(o.informedAt)}
                    </p>
                  )}
                  {o.payerNote && <p className="text-sm">“{o.payerNote}”</p>}
                  {o.receiptUrl && (
                    <a
                      href={o.receiptUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="text-sm font-medium text-orange-dark underline"
                    >
                      Ver comprovante
                    </a>
                  )}
                  {o.status === 'rejected' && o.rejectionReason && (
                    <p className="text-sm text-red">Motivo: {o.rejectionReason}</p>
                  )}
                </div>
                <div className="flex flex-col items-end gap-2">
                  <Badge color={STATUS[o.status]?.color || 'gray'}>{STATUS[o.status]?.label || o.status}</Badge>
                  {(o.status === 'informed' || o.status === 'pending') && (
                    <div className="flex gap-2">
                      <Button size="xs" color="success" onClick={() => setConfirming(o)}>
                        Confirmar
                      </Button>
                      <Button size="xs" color="failure" onClick={() => setRejecting(o)}>
                        Recusar
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}

      {data.totalPages > 1 && (
        <div className="flex items-center justify-center gap-3 text-sm">
          <Button size="xs" color="light" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
            Anterior
          </Button>
          <span>
            Página {page} de {data.totalPages}
          </span>
          <Button
            size="xs"
            color="light"
            disabled={page >= data.totalPages}
            onClick={() => setPage((p) => p + 1)}
          >
            Próxima
          </Button>
        </div>
      )}

      <ConfirmModal
        show={!!confirming}
        title="Confirmar pagamento"
        message={
          confirming
            ? `Você conferiu o Pix de ${formatCurrency(confirming.package.price)} de ${confirming.store.name}? Ao confirmar, ${confirming.package.deliveries} entregas entram no saldo dela.`
            : ''
        }
        confirmLabel="Confirmar e creditar"
        confirmColor="success"
        loading={busy}
        onConfirm={handleConfirm}
        onCancel={() => setConfirming(null)}
      />

      {rejecting && (
        <RejectModal order={rejecting} onClose={() => setRejecting(null)} onDone={handleRejected} />
      )}
    </div>
  );
}
