import { useCallback, useEffect, useState } from 'react';
import { Alert, Button, Card, Label, Spinner, TextInput, ToggleSwitch } from 'flowbite-react';
import { HiOutlineCurrencyDollar } from 'react-icons/hi';
import { getPlatformSettings, updatePlatformSettings } from '../../api/platformSettings';
import { formatCurrency, formatDateTime } from '../../utils/format';
import ConfirmModal from '../../components/ui/ConfirmModal';

export default function PlatformSettingsPage() {
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');

  // Estado do formulário — separado de `settings` pra não misturar o que
  // está gravado no banco com o que o admin está editando na tela.
  const [deliveryFeeInput, setDeliveryFeeInput] = useState('');
  const [promoActive, setPromoActive] = useState(true);
  const [freeDeliveriesGrantedInput, setFreeDeliveriesGrantedInput] = useState('');

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [saveSuccess, setSaveSuccess] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setLoadError('');
    try {
      const data = await getPlatformSettings();
      setSettings(data);
      setDeliveryFeeInput(String(data.deliveryFee));
      setPromoActive(data.freeDeliveriesPromoActive);
      setFreeDeliveriesGrantedInput(String(data.freeDeliveriesGranted));
    } catch (err) {
      setLoadError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const deliveryFee = Number(deliveryFeeInput.replace(',', '.'));
  const freeDeliveriesGranted = Number(freeDeliveriesGrantedInput);

  const deliveryFeeValid = deliveryFeeInput.trim() !== '' && Number.isFinite(deliveryFee) && deliveryFee >= 0;
  const freeDeliveriesGrantedValid =
    freeDeliveriesGrantedInput.trim() !== '' && Number.isInteger(freeDeliveriesGranted) && freeDeliveriesGranted >= 0;
  const formValid = deliveryFeeValid && freeDeliveriesGrantedValid;

  const hasChanges =
    settings != null &&
    (deliveryFee !== settings.deliveryFee ||
      promoActive !== settings.freeDeliveriesPromoActive ||
      freeDeliveriesGranted !== settings.freeDeliveriesGranted);

  async function handleConfirmSave() {
    setSaving(true);
    setSaveError('');
    try {
      const data = await updatePlatformSettings({
        deliveryFee,
        freeDeliveriesPromoActive: promoActive,
        freeDeliveriesGranted,
      });
      setSettings(data);
      setSaveSuccess('Configurações atualizadas com sucesso.');
      setConfirmOpen(false);
    } catch (err) {
      setSaveError(err.message);
    } finally {
      setSaving(false);
    }
  }

  if (loading && !settings) {
    return (
      <div className="flex justify-center py-16">
        <Spinner color="warning" size="xl" aria-label="Carregando configurações" />
      </div>
    );
  }

  if (loadError && !settings) {
    return (
      <div className="flex flex-col gap-4">
        <Alert color="failure">{loadError}</Alert>
      </div>
    );
  }

  if (!settings) return null;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="mb-1 text-xl font-bold">Faturamento da plataforma</h1>
        <p className="text-sm text-ink-soft">
          Taxa cobrada das lojas por entrega concluída e a promoção de entregas grátis para novos cadastros.
        </p>
      </div>

      {saveError && (
        <Alert color="failure" onDismiss={() => setSaveError('')}>
          {saveError}
        </Alert>
      )}
      {saveSuccess && (
        <Alert color="success" onDismiss={() => setSaveSuccess('')}>
          {saveSuccess}
        </Alert>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="border-line">
          <p className="mb-4 text-sm font-medium text-ink">Taxa por entrega</p>

          <div className="flex flex-col gap-2">
            <Label htmlFor="deliveryFee">Valor cobrado da loja por entrega concluída (R$)</Label>
            <TextInput
              id="deliveryFee"
              icon={HiOutlineCurrencyDollar}
              value={deliveryFeeInput}
              onChange={(e) => setDeliveryFeeInput(e.target.value)}
              placeholder="1.50"
              color={deliveryFeeInput.trim() !== '' && !deliveryFeeValid ? 'failure' : undefined}
            />
            {deliveryFeeInput.trim() !== '' && !deliveryFeeValid && (
              <p className="text-xs text-red">Informe um valor válido, maior ou igual a 0.</p>
            )}
            <p className="text-xs text-ink-soft">
              Vale a partir da próxima entrega concluída — não muda o valor de entregas já finalizadas.
            </p>
          </div>
        </Card>

        <Card className="border-line">
          <p className="mb-4 text-sm font-medium text-ink">Promoção de entregas grátis</p>

          <div className="flex flex-col gap-4">
            <ToggleSwitch
              checked={promoActive}
              label={promoActive ? 'Ativa para novos cadastros' : 'Desativada para novos cadastros'}
              onChange={setPromoActive}
            />

            <div className="flex flex-col gap-2">
              <Label htmlFor="freeDeliveriesGranted">Entregas grátis concedidas no cadastro</Label>
              <TextInput
                id="freeDeliveriesGranted"
                type="number"
                min={0}
                step={1}
                value={freeDeliveriesGrantedInput}
                onChange={(e) => setFreeDeliveriesGrantedInput(e.target.value)}
                disabled={!promoActive}
                color={freeDeliveriesGrantedInput.trim() !== '' && !freeDeliveriesGrantedValid ? 'failure' : undefined}
              />
              {freeDeliveriesGrantedInput.trim() !== '' && !freeDeliveriesGrantedValid && (
                <p className="text-xs text-red">Informe um número inteiro maior ou igual a 0.</p>
              )}
            </div>

            <p className="text-xs text-ink-soft">
              Desativar a promoção só afeta lojas cadastradas a partir de agora — quem já tem saldo de entregas
              grátis concedido mantém esse saldo normalmente.
            </p>
          </div>
        </Card>
      </div>

      <Card className="border-line">
        <p className="text-xs text-ink-soft">Última atualização: {formatDateTime(settings.updatedAt)}</p>
      </Card>

      <div>
        <Button
          className="bg-orange enabled:hover:bg-orange-dark"
          disabled={!formValid || !hasChanges}
          onClick={() => setConfirmOpen(true)}
        >
          Salvar alterações
        </Button>
      </div>

      <ConfirmModal
        show={confirmOpen}
        title="Confirmar alteração no faturamento"
        message={
          <>
            Isto muda a cobrança de <strong>todas as lojas</strong> a partir de agora:
            <br />• Taxa por entrega: {formatCurrency(settings.deliveryFee)} → {formatCurrency(deliveryFee)}
            <br />• Promoção de entregas grátis: {settings.freeDeliveriesPromoActive ? 'Ativa' : 'Desativada'} →{' '}
            {promoActive ? 'Ativa' : 'Desativada'}
            <br />• Entregas grátis concedidas: {settings.freeDeliveriesGranted} → {freeDeliveriesGranted}
          </>
        }
        confirmLabel="Confirmar e salvar"
        confirmColor="warning"
        loading={saving}
        onConfirm={handleConfirmSave}
        onCancel={() => setConfirmOpen(false)}
      />
    </div>
  );
}
