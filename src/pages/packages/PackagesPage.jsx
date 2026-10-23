import { useCallback, useEffect, useState } from 'react';
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
  TextInput,
} from 'flowbite-react';
import { HiOutlinePlus } from 'react-icons/hi';
import { createPackage, deletePackage, listPackages, updatePackage } from '../../api/credits';
import { formatCurrency } from '../../utils/format';
import ConfirmModal from '../../components/ui/ConfirmModal';

const EMPTY_FORM = { name: '', deliveries: '', price: '' };

function PackageFormModal({ pkg, onClose, onSaved }) {
  const [form, setForm] = useState(
    pkg ? { name: pkg.name, deliveries: String(pkg.deliveries), price: String(pkg.price) } : EMPTY_FORM,
  );
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  function change(e) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  }

  async function submit(e) {
    e.preventDefault();
    setError('');
    const payload = {
      name: form.name.trim(),
      deliveries: Number(form.deliveries),
      price: Number(String(form.price).replace(',', '.')),
    };
    setSaving(true);
    try {
      if (pkg) await updatePackage(pkg.id, payload);
      else await createPackage(payload);
      onSaved();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal show onClose={onClose} size="md">
      <ModalHeader>{pkg ? 'Editar pacote' : 'Novo pacote'}</ModalHeader>
      <ModalBody>
        <form className="flex flex-col gap-4" onSubmit={submit}>
          {error && <Alert color="failure">{error}</Alert>}
          <div>
            <Label htmlFor="name" className="mb-1 block">
              Nome
            </Label>
            <TextInput id="name" name="name" value={form.name} onChange={change} maxLength={60} required />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="deliveries" className="mb-1 block">
                Entregas
              </Label>
              <TextInput
                id="deliveries"
                name="deliveries"
                type="number"
                min="1"
                step="1"
                value={form.deliveries}
                onChange={change}
                required
              />
            </div>
            <div>
              <Label htmlFor="price" className="mb-1 block">
                Preço (R$)
              </Label>
              <TextInput
                id="price"
                name="price"
                type="number"
                min="0.01"
                step="0.01"
                value={form.price}
                onChange={change}
                required
              />
            </div>
          </div>
          <p className="text-xs text-ink-soft">
            Mudar o pacote não altera pedidos que já foram feitos: eles guardam o valor da época.
          </p>
          <div className="flex justify-end gap-2">
            <Button color="light" onClick={onClose} disabled={saving}>
              Cancelar
            </Button>
            <Button type="submit" className="bg-orange enabled:hover:bg-orange-dark" disabled={saving}>
              {saving ? <Spinner size="sm" /> : 'Salvar'}
            </Button>
          </div>
        </form>
      </ModalBody>
    </Modal>
  );
}

export default function PackagesPage() {
  const [packages, setPackages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editing, setEditing] = useState(null); // null | 'new' | package
  const [toDelete, setToDelete] = useState(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    setError('');
    try {
      const data = await listPackages();
      setPackages(data.data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function toggleActive(pkg) {
    setError('');
    try {
      await updatePackage(pkg.id, { active: !pkg.active });
      await load();
    } catch (err) {
      setError(err.message);
    }
  }

  async function confirmDelete() {
    setBusy(true);
    try {
      await deletePackage(toDelete.id);
      setToDelete(null);
      await load();
    } catch (err) {
      setError(err.message);
      setToDelete(null);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="mb-1 text-xl font-bold">Pacotes de entregas</h1>
          <p className="text-sm text-ink-soft">
            O que as lojas podem comprar. Pacotes desabilitados somem da tela de compra, mas continuam
            aqui.
          </p>
        </div>
        <Button className="bg-orange enabled:hover:bg-orange-dark" onClick={() => setEditing('new')}>
          <HiOutlinePlus className="mr-2 h-4 w-4" />
          Novo pacote
        </Button>
      </div>

      {error && (
        <Alert color="failure" onDismiss={() => setError('')}>
          {error}
        </Alert>
      )}

      {loading ? (
        <div className="flex justify-center py-16">
          <Spinner color="warning" size="xl" aria-label="Carregando pacotes" />
        </div>
      ) : packages.length === 0 ? (
        <Card className="border-line">
          <p className="text-sm text-ink-soft">
            Nenhum pacote ainda. Crie o primeiro para as lojas poderem comprar entregas.
          </p>
        </Card>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-line bg-white">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-line bg-cream text-xs text-ink-soft">
              <tr>
                <th className="px-4 py-3">Nome</th>
                <th className="px-4 py-3">Entregas</th>
                <th className="px-4 py-3">Preço</th>
                <th className="px-4 py-3">Por entrega</th>
                <th className="px-4 py-3">Situação</th>
                <th className="px-4 py-3 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {packages.map((pkg) => (
                <tr key={pkg.id} className={pkg.active ? '' : 'opacity-60'}>
                  <td className="px-4 py-3 font-medium">{pkg.name}</td>
                  <td className="px-4 py-3">{pkg.deliveries}</td>
                  <td className="px-4 py-3">{formatCurrency(pkg.price)}</td>
                  <td className="px-4 py-3">{formatCurrency(pkg.unitPrice)}</td>
                  <td className="px-4 py-3">
                    <Badge color={pkg.active ? 'success' : 'gray'} className="w-fit">
                      {pkg.active ? 'Ativo' : 'Desabilitado'}
                    </Badge>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-2">
                      <Button size="xs" color="light" onClick={() => setEditing(pkg)}>
                        Editar
                      </Button>
                      <Button size="xs" color="light" onClick={() => toggleActive(pkg)}>
                        {pkg.active ? 'Desabilitar' : 'Habilitar'}
                      </Button>
                      <Button size="xs" color="failure" onClick={() => setToDelete(pkg)}>
                        Excluir
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {editing && (
        <PackageFormModal
          pkg={editing === 'new' ? null : editing}
          onClose={() => setEditing(null)}
          onSaved={() => {
            setEditing(null);
            load();
          }}
        />
      )}

      <ConfirmModal
        show={!!toDelete}
        title="Excluir pacote"
        message={`Excluir "${toDelete?.name}"? Pedidos já feitos não são afetados. Se só quer tirar da venda por um tempo, prefira Desabilitar.`}
        confirmLabel="Excluir"
        confirmColor="failure"
        loading={busy}
        onConfirm={confirmDelete}
        onCancel={() => setToDelete(null)}
      />
    </div>
  );
}
