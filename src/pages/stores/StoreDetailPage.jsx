import { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Alert, Avatar, Badge, Button, Card, Label, Modal, ModalBody, ModalHeader, Spinner, TextInput } from 'flowbite-react';
import { HiOutlineArrowLeft, HiOutlineBan, HiOutlineCheckCircle, HiOutlineTruck } from 'react-icons/hi';
import { getStore, setStoreActive } from '../../api/stores';
import { adjustStoreCredits, getStoreCredits } from '../../api/credits';
import { formatDateTime } from '../../utils/format';
import ConfirmModal from '../../components/ui/ConfirmModal';

export default function StoreDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [store, setStore] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionError, setActionError] = useState('');
  const [actionSuccess, setActionSuccess] = useState('');
  const [confirmAction, setConfirmAction] = useState(null); // 'activate' | 'deactivate' | null
  const [actionLoading, setActionLoading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await getStore(id);
      setStore(data);
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
      const data = await setStoreActive(id, confirmAction === 'activate');
      setStore((prev) => ({ ...prev, ...data.store }));
      setActionSuccess(confirmAction === 'activate' ? 'Conta ativada com sucesso.' : 'Conta desativada com sucesso.');
      setConfirmAction(null);
    } catch (err) {
      setActionError(err.message);
    } finally {
      setActionLoading(false);
    }
  }

  if (loading && !store) {
    return (
      <div className="flex justify-center py-16">
        <Spinner color="warning" size="xl" aria-label="Carregando loja" />
      </div>
    );
  }

  if (error && !store) {
    return (
      <div className="flex flex-col gap-4">
        <BackLink navigate={navigate} />
        <Alert color="failure">{error}</Alert>
      </div>
    );
  }

  if (!store) return null;

  const address = store.address || {};
  const fullAddress = [
    [address.street, address.number].filter(Boolean).join(', '),
    address.complement,
    address.district,
    address.zipCode,
  ]
    .filter(Boolean)
    .join(' - ');

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

      <Card className="border-line">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <Avatar
              img={store.avatar || undefined}
              rounded
              size="lg"
              placeholderInitials={store.name?.charAt(0)?.toUpperCase()}
            />
            <div>
              <p className="font-heading text-lg font-bold text-ink">{store.name}</p>
              <p className="text-sm text-ink-soft">{store.email}</p>
              <Badge color={store.active ? 'success' : 'failure'} className="mt-1 inline-flex w-fit">
                {store.active ? 'Ativa' : 'Inativa'}
              </Badge>
            </div>
          </div>

          {store.active ? (
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
      </Card>

      <Link to={`/entregas?store=${store._id}`} className="w-fit">
        <Button color="light">
          <HiOutlineTruck className="mr-2 h-4 w-4" />
          Ver entregas desta loja
        </Button>
      </Link>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="border-line">
          <p className="mb-4 text-sm font-medium text-ink">Dados da loja</p>
          <dl className="flex flex-col gap-3 text-sm">
            <Field label="Telefone" value={store.phone} />
            <Field label="CNPJ/CPF" value={store.doc} />
            <Field label="Cidade" value={store.city ? `${store.city.name} - ${store.city.state}` : '—'} />
            <Field label="Cadastrada em" value={formatDateTime(store.createdAt)} />
            <Field
              label="E-mail verificado"
              value={store.emailVerifiedAt ? formatDateTime(store.emailVerifiedAt) : 'Não verificado'}
            />
          </dl>
        </Card>

        <Card className="border-line">
          <p className="mb-4 text-sm font-medium text-ink">Endereço</p>
          <dl className="flex flex-col gap-3 text-sm">
            <Field label="Endereço" value={fullAddress || '—'} />
            <Field
              label="Localização"
              value={
                address.latitude != null && address.longitude != null
                  ? `${address.latitude.toFixed(5)}, ${address.longitude.toFixed(5)}`
                  : 'Não geocodificado'
              }
            />
          </dl>
        </Card>
      </div>

      <CreditsCard storeId={id} storeName={store.name} />

      <ConfirmModal
        show={confirmAction === 'deactivate'}
        title="Desativar conta da loja"
        message={`Tem certeza que deseja desativar a conta de ${store.name}? Ela não vai mais conseguir fazer login nem solicitar entregas até ser reativada.`}
        confirmLabel="Desativar"
        confirmColor="failure"
        loading={actionLoading}
        onConfirm={handleConfirm}
        onCancel={() => setConfirmAction(null)}
      />
      <ConfirmModal
        show={confirmAction === 'activate'}
        title="Ativar conta da loja"
        message={`Tem certeza que deseja reativar a conta de ${store.name}?`}
        confirmLabel="Ativar"
        confirmColor="success"
        loading={actionLoading}
        onConfirm={handleConfirm}
        onCancel={() => setConfirmAction(null)}
      />
    </div>
  );
}

const TYPE_LABELS = { purchase: 'Compra', delivery: 'Entrega', adjustment: 'Ajuste' };

// Saldo de entregas da loja + ajuste manual (cortesia ou correção).
function CreditsCard({ storeId, storeName }) {
  const [credits, setCredits] = useState(null);
  const [error, setError] = useState('');
  const [adjusting, setAdjusting] = useState(false);
  const [form, setForm] = useState({ delta: '', note: '' });
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');

  const load = useCallback(async () => {
    try {
      setCredits(await getStoreCredits(storeId));
    } catch (err) {
      setError(err.message);
    }
  }, [storeId]);

  useEffect(() => {
    load();
  }, [load]);

  async function submit(e) {
    e.preventDefault();
    setFormError('');
    setSaving(true);
    try {
      await adjustStoreCredits(storeId, { delta: Number(form.delta), note: form.note.trim() });
      setAdjusting(false);
      setForm({ delta: '', note: '' });
      await load();
    } catch (err) {
      setFormError(err.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <Card className="border-line">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm font-medium text-ink">Saldo de entregas</p>
        <Button size="xs" color="light" onClick={() => setAdjusting(true)} disabled={!credits}>
          Ajustar saldo
        </Button>
      </div>
      {error && <Alert color="failure">{error}</Alert>}
      {credits && (
        <>
          <dl className="grid grid-cols-3 gap-3 text-sm">
            <Field label="Compradas" value={String(credits.purchased)} />
            <Field label="Grátis" value={String(credits.free)} />
            <Field label="Total" value={String(credits.available)} />
          </dl>
          {credits.transactions.length > 0 && (
            <ul className="divide-y divide-line text-sm">
              {credits.transactions.slice(0, 10).map((t) => (
                <li key={t._id} className="flex justify-between gap-3 py-2">
                  <span className="text-ink-soft">
                    {formatDateTime(t.createdAt)} · {TYPE_LABELS[t.type] || t.type}
                    {t.note ? ` · ${t.note}` : ''}
                  </span>
                  <span className={`font-medium ${t.delta > 0 ? 'text-green' : 'text-red'}`}>
                    {t.delta > 0 ? `+${t.delta}` : t.delta}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </>
      )}

      {adjusting && (
        <Modal show onClose={() => setAdjusting(false)} size="md">
          <ModalHeader>Ajustar saldo de {storeName}</ModalHeader>
          <ModalBody>
            <form className="flex flex-col gap-4" onSubmit={submit}>
              {formError && <Alert color="failure">{formError}</Alert>}
              <div>
                <Label htmlFor="delta" className="mb-1 block">
                  Entregas a somar (use negativo para tirar)
                </Label>
                <TextInput
                  id="delta"
                  type="number"
                  step="1"
                  value={form.delta}
                  onChange={(e) => setForm((p) => ({ ...p, delta: e.target.value }))}
                  required
                />
              </div>
              <div>
                <Label htmlFor="note" className="mb-1 block">
                  Motivo
                </Label>
                <TextInput
                  id="note"
                  maxLength={200}
                  placeholder="Ex: cortesia de boas-vindas"
                  value={form.note}
                  onChange={(e) => setForm((p) => ({ ...p, note: e.target.value }))}
                  required
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button color="light" onClick={() => setAdjusting(false)} disabled={saving}>
                  Cancelar
                </Button>
                <Button type="submit" className="bg-orange enabled:hover:bg-orange-dark" disabled={saving}>
                  {saving ? <Spinner size="sm" /> : 'Aplicar'}
                </Button>
              </div>
            </form>
          </ModalBody>
        </Modal>
      )}
    </Card>
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
      to="/lojas"
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
