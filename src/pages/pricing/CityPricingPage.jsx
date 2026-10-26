import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Alert, Button, Card, Label, Select, Spinner, TextInput, ToggleSwitch } from 'flowbite-react';
import { HiOutlineArrowLeft, HiOutlinePlus, HiOutlineTrash } from 'react-icons/hi';
import { getCityPricing, resetCityPricing, saveCityPricing, simulateCityPricing } from '../../api/pricing';
import { formatCurrency } from '../../utils/format';
import { WEEKDAYS, formToPayload, newAdjustment, ruleToForm, toNumber } from '../../utils/pricingForm';
import ConfirmModal from '../../components/ui/ConfirmModal';

// "agora" em Brasília no formato do <input type="datetime-local">
function nowInBrazil() {
  return new Date().toLocaleString('sv-SE', { timeZone: 'America/Sao_Paulo' }).slice(0, 16).replace(' ', 'T');
}

function NumberField({ id, label, value, onChange, error, hint, suffix, placeholder }) {
  return (
    <div className="flex flex-col gap-1">
      <Label htmlFor={id}>{label}</Label>
      <TextInput
        id={id}
        inputMode="decimal"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        color={error ? 'failure' : undefined}
        rightIcon={suffix ? () => <span className="text-xs text-ink-soft">{suffix}</span> : undefined}
      />
      {error ? <p className="text-xs text-red">{error}</p> : hint && <p className="text-xs text-ink-soft">{hint}</p>}
    </div>
  );
}

function Simulator({ cityId, form }) {
  const [km, setKm] = useState('8');
  const [at, setAt] = useState(nowInBrazil);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

  const parsed = useMemo(() => formToPayload(form), [form]);
  const kmNumber = toNumber(km);
  const kmValid = Number.isFinite(kmNumber) && kmNumber >= 0 && kmNumber <= 500;

  useEffect(() => {
    if (!parsed.payload || !kmValid) {
      setResult(null);
      return undefined;
    }
    let cancelled = false;
    const timer = setTimeout(async () => {
      try {
        const data = await simulateCityPricing(cityId, { km: kmNumber, at: at ? `${at}:00-03:00` : undefined, rule: parsed.payload });
        if (!cancelled) {
          setResult(data);
          setError('');
        }
      } catch (err) {
        if (!cancelled) {
          setResult(null);
          setError(err.message);
        }
      }
    }, 400);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [cityId, parsed, kmValid, kmNumber, at]);

  const b = result?.breakdown;
  return (
    <Card className="border-line">
      <p className="text-sm font-medium text-ink">Simulador</p>
      <p className="text-xs text-ink-soft">Testa o que está na tela agora, mesmo sem salvar.</p>
      <div className="grid gap-3 sm:grid-cols-2">
        <NumberField id="sim-km" label="Distância" value={km} onChange={setKm} suffix="km" error={km.trim() !== '' && !kmValid ? 'Informe de 0 a 500' : ''} />
        <div className="flex flex-col gap-1">
          <Label htmlFor="sim-at">Dia e hora (Brasília)</Label>
          <TextInput id="sim-at" type="datetime-local" value={at} onChange={(e) => setAt(e.target.value)} />
        </div>
      </div>

      {parsed.errors && <p className="text-sm text-ink-soft">Corrija os campos do formulário para simular.</p>}
      {error && <p className="text-sm text-red">{error}</p>}

      {b && (
        <div className="flex flex-col gap-1 rounded-lg bg-cream p-3 text-sm" data-testid="sim-result">
          <Line label="Valor base" value={formatCurrency(b.baseFee)} />
          <Line label={`Distância (${b.distanceKm} km × ${formatCurrency(b.perKm)})`} value={formatCurrency(b.distanceFee)} />
          {b.longDistanceExtra > 0 && <Line label="Adicional de distância longa" value={formatCurrency(b.longDistanceExtra)} />}
          {b.minimumApplied && <Line label={`Valor mínimo aplicado`} value={formatCurrency(b.minimumFee)} />}
          {b.adjustments.map((a, i) => (
            <Line key={i} label={`${a.name}${a.kind === 'percent' ? ` (${a.value}%)` : ''}`} value={`+ ${formatCurrency(a.amount)}`} />
          ))}
          {b.adjustments.length === 0 && <Line label="Adicionais ativos" value="nenhum" muted />}
          {b.maximumApplied && <Line label={`Teto aplicado (${formatCurrency(b.maximumFee)})`} value="" muted />}
          <div className="mt-1 flex justify-between border-t border-line pt-2 text-base font-bold text-ink">
            <span>Entregador recebe</span>
            <span>{formatCurrency(result.total)}</span>
          </div>
        </div>
      )}
    </Card>
  );
}

function Line({ label, value, muted }) {
  return (
    <div className={`flex justify-between gap-4 ${muted ? 'text-ink-soft' : 'text-ink'}`}>
      <span>{label}</span>
      <span className="font-medium">{value}</span>
    </div>
  );
}

function AdjustmentRow({ adj, index, errors, onChange, onRemove }) {
  const set = (patch) => onChange({ ...adj, ...patch });
  const toggleDay = (d) => set({ days: adj.days.includes(d) ? adj.days.filter((x) => x !== d) : [...adj.days, d].sort() });
  return (
    <div className="flex flex-col gap-3 rounded-lg border border-line p-3">
      <div className="grid gap-3 sm:grid-cols-4">
        <div className="flex flex-col gap-1 sm:col-span-2">
          <Label htmlFor={`adj-name-${index}`}>Nome da faixa</Label>
          <TextInput id={`adj-name-${index}`} value={adj.name} maxLength={60} placeholder="Ex.: Noite de fim de semana"
            onChange={(e) => set({ name: e.target.value })} color={errors[`adjustments.${index}.name`] ? 'failure' : undefined} />
          {errors[`adjustments.${index}.name`] && <p className="text-xs text-red">{errors[`adjustments.${index}.name`]}</p>}
        </div>
        <div className="flex flex-col gap-1">
          <Label htmlFor={`adj-kind-${index}`}>Tipo</Label>
          <Select id={`adj-kind-${index}`} value={adj.kind} onChange={(e) => set({ kind: e.target.value })}>
            <option value="percent">Porcentagem (%)</option>
            <option value="fixed">Valor fixo (R$)</option>
          </Select>
        </div>
        <NumberField id={`adj-value-${index}`} label={adj.kind === 'percent' ? 'Adicional (%)' : 'Adicional (R$)'} value={adj.value}
          onChange={(v) => set({ value: v })} error={errors[`adjustments.${index}.value`]} />
      </div>

      <div className="grid gap-3 sm:grid-cols-4">
        <div className="flex flex-col gap-1">
          <Label htmlFor={`adj-from-${index}`}>Das</Label>
          <TextInput id={`adj-from-${index}`} type="time" value={adj.from} onChange={(e) => set({ from: e.target.value })} />
        </div>
        <div className="flex flex-col gap-1">
          <Label htmlFor={`adj-to-${index}`}>Até</Label>
          <TextInput id={`adj-to-${index}`} type="time" value={adj.to} onChange={(e) => set({ to: e.target.value })} color={errors[`adjustments.${index}.to`] ? 'failure' : undefined} />
          {errors[`adjustments.${index}.to`] && <p className="text-xs text-red">{errors[`adjustments.${index}.to`]}</p>}
        </div>
        <div className="flex flex-col gap-1 sm:col-span-2">
          <Label>Dias da semana <span className="font-normal text-ink-soft">(nenhum marcado = todos)</span></Label>
          <div className="flex flex-wrap gap-1">
            {WEEKDAYS.map((name, d) => (
              <button
                key={d}
                type="button"
                aria-pressed={adj.days.includes(d)}
                onClick={() => toggleDay(d)}
                className={`rounded-full border px-2.5 py-1 text-xs font-medium ${adj.days.includes(d) ? 'border-orange bg-orange text-white' : 'border-line text-ink-soft hover:bg-cream'}`}
              >
                {name}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <ToggleSwitch checked={adj.active} label={adj.active ? 'Ativa' : 'Desativada'} onChange={(v) => set({ active: v })} />
        <Button size="xs" color="light" onClick={onRemove}>
          <HiOutlineTrash className="mr-1 h-4 w-4" />
          Remover
        </Button>
      </div>
      <p className="text-xs text-ink-soft">Se o horário final for menor que o inicial (ex.: 22:00 até 02:00), a faixa passa da meia-noite e conta pelo dia em que começa.</p>
    </div>
  );
}

export default function CityPricingPage() {
  const { id } = useParams();
  const [data, setData] = useState(null);
  const [form, setForm] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [confirmSave, setConfirmSave] = useState(false);
  const [confirmReset, setConfirmReset] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [success, setSuccess] = useState('');
  const [showErrors, setShowErrors] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setLoadError('');
    try {
      const d = await getCityPricing(id);
      setData(d);
      setForm(ruleToForm(d.rule));
    } catch (err) {
      setLoadError(err.message);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  const parsed = useMemo(() => (form ? formToPayload(form) : { errors: {} }), [form]);
  const errors = showErrors ? parsed.errors ?? {} : {};
  const dirty = useMemo(() => !!data && !!form && JSON.stringify(form) !== JSON.stringify(ruleToForm(data.rule)), [data, form]);

  const setField = (name) => (value) => setForm((f) => ({ ...f, [name]: value }));

  function askSave() {
    setShowErrors(true);
    setSaveError('');
    if (parsed.errors) return;
    setConfirmSave(true);
  }

  async function doSave() {
    setSaving(true);
    setSaveError('');
    try {
      const d = await saveCityPricing(id, parsed.payload);
      setData(d);
      setForm(ruleToForm(d.rule));
      setShowErrors(false);
      setSuccess('Regras salvas. Valem para as próximas entregas desta cidade.');
      setConfirmSave(false);
    } catch (err) {
      setSaveError(err.details?.details?.map((x) => x.message).join(' · ') || err.message);
      setConfirmSave(false);
    } finally {
      setSaving(false);
    }
  }

  async function doReset() {
    setSaving(true);
    setSaveError('');
    try {
      const d = await resetCityPricing(id);
      setData(d);
      setForm(ruleToForm(d.rule));
      setShowErrors(false);
      setSuccess('A cidade voltou a usar a regra padrão.');
      setConfirmReset(false);
    } catch (err) {
      setSaveError(err.message);
      setConfirmReset(false);
    } finally {
      setSaving(false);
    }
  }

  if (loading && !data) {
    return (
      <div className="flex justify-center py-16">
        <Spinner color="warning" size="xl" aria-label="Carregando regras" />
      </div>
    );
  }
  if (loadError && !data) return <Alert color="failure">{loadError}</Alert>;
  if (!data || !form) return null;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <Link to="/precos" className="mb-2 inline-flex items-center gap-1 text-sm text-ink-soft hover:text-ink">
          <HiOutlineArrowLeft className="h-4 w-4" /> Voltar
        </Link>
        <h1 className="mb-1 text-xl font-bold">Preço da entrega · {data.city.name} - {data.city.state}</h1>
        <p className="text-sm text-ink-soft">
          {data.custom ? 'Esta cidade tem regra própria.' : 'Esta cidade usa a regra padrão. Ao salvar, ela passa a ter regra própria.'}
          {' '}Vale para as próximas entregas; as já criadas mantêm o valor.
        </p>
      </div>

      {saveError && <Alert color="failure" onDismiss={() => setSaveError('')}>{saveError}</Alert>}
      {success && <Alert color="success" onDismiss={() => setSuccess('')}>{success}</Alert>}

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_24rem]">
        <div className="flex flex-col gap-6">
          <Card className="border-line">
            <p className="text-sm font-medium text-ink">Cálculo pela distância</p>
            <p className="text-xs text-ink-soft">Valor = base + (preço por km × km). Depois aplica o mínimo e os adicionais.</p>
            <div className="grid gap-4 sm:grid-cols-2">
              <NumberField id="baseFee" label="Valor base (R$)" value={form.baseFee} onChange={setField('baseFee')} error={errors.baseFee} />
              <NumberField id="perKm" label="Preço por km (R$)" value={form.perKm} onChange={setField('perKm')} error={errors.perKm} />
              <NumberField id="minimumFee" label="Valor mínimo (R$)" value={form.minimumFee} onChange={setField('minimumFee')} error={errors.minimumFee}
                hint="Nenhuma entrega paga menos que isso." />
              <NumberField id="maximumFee" label="Teto (R$) — opcional" value={form.maximumFee} onChange={setField('maximumFee')} error={errors.maximumFee}
                hint="Nenhuma entrega paga mais que isso, nem com adicionais. Em branco = sem teto." />
            </div>
            <div className="flex flex-col gap-1 sm:max-w-xs">
              <Label htmlFor="rounding">Arredondamento</Label>
              <Select id="rounding" value={form.rounding} onChange={(e) => setField('rounding')(e.target.value)}>
                <option value="integer">Para o real inteiro (ex.: R$ 17)</option>
                <option value="cents">Em centavos (ex.: R$ 16,55)</option>
              </Select>
            </div>
          </Card>

          <Card className="border-line">
            <p className="text-sm font-medium text-ink">Distância longa</p>
            <p className="text-xs text-ink-soft">Acima de certa distância, soma um adicional a cada bloco de km. Coloque 0 no adicional para desligar.</p>
            <div className="grid gap-4 sm:grid-cols-3">
              <NumberField id="longFrom" label="A partir de (km)" value={form.longDistanceFromKm} onChange={setField('longDistanceFromKm')} error={errors.longDistanceFromKm} />
              <NumberField id="longBlock" label="A cada (km)" value={form.longDistanceBlockKm} onChange={setField('longDistanceBlockKm')} error={errors.longDistanceBlockKm} />
              <NumberField id="longExtra" label="Soma (R$)" value={form.longDistanceExtra} onChange={setField('longDistanceExtra')} error={errors.longDistanceExtra} />
            </div>
          </Card>

          <Card className="border-line">
            <p className="text-sm font-medium text-ink">Modo chuva</p>
            <p className="text-xs text-ink-soft">Você liga e desliga na mão. Enquanto estiver ligado, todas as entregas novas desta cidade ganham o adicional.</p>
            <ToggleSwitch checked={form.rainActive} label={form.rainActive ? 'Ligado' : 'Desligado'} onChange={setField('rainActive')} />
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="flex flex-col gap-1">
                <Label htmlFor="rainKind">Tipo do adicional</Label>
                <Select id="rainKind" value={form.rainKind} onChange={(e) => setField('rainKind')(e.target.value)}>
                  <option value="percent">Porcentagem (%)</option>
                  <option value="fixed">Valor fixo (R$)</option>
                </Select>
              </div>
              <NumberField id="rainValue" label={form.rainKind === 'percent' ? 'Adicional (%)' : 'Adicional (R$)'} value={form.rainValue}
                onChange={setField('rainValue')} error={errors.rainValue} />
            </div>
          </Card>

          <Card className="border-line">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-medium text-ink">Faixas de horário</p>
                <p className="text-xs text-ink-soft">Adicionais que valem em dias e horários escolhidos (horário de Brasília), como noite e fim de semana.</p>
              </div>
              <Button size="xs" className="bg-orange enabled:hover:bg-orange-dark"
                onClick={() => setForm((f) => ({ ...f, adjustments: [...f.adjustments, newAdjustment()] }))}>
                <HiOutlinePlus className="mr-1 h-4 w-4" /> Adicionar faixa
              </Button>
            </div>
            {form.adjustments.length === 0 && <p className="text-sm text-ink-soft">Nenhuma faixa cadastrada.</p>}
            {form.adjustments.map((adj, i) => (
              <AdjustmentRow
                key={i}
                adj={adj}
                index={i}
                errors={errors}
                onChange={(next) => setForm((f) => ({ ...f, adjustments: f.adjustments.map((x, j) => (j === i ? next : x)) }))}
                onRemove={() => setForm((f) => ({ ...f, adjustments: f.adjustments.filter((_, j) => j !== i) }))}
              />
            ))}
          </Card>

          <div className="flex flex-wrap gap-3">
            <Button className="bg-orange enabled:hover:bg-orange-dark" disabled={!dirty || saving} onClick={askSave}>Salvar regras</Button>
            {data.custom && <Button color="light" disabled={saving} onClick={() => setConfirmReset(true)}>Voltar para a regra padrão</Button>}
            {showErrors && parsed.errors && <p className="self-center text-sm text-red">Há campos para corrigir.</p>}
          </div>
        </div>

        <div className="xl:sticky xl:top-4 xl:self-start">
          <Simulator cityId={id} form={form} />
        </div>
      </div>

      <ConfirmModal
        show={confirmSave}
        title="Salvar regras desta cidade?"
        message={`Vale para as próximas entregas em ${data.city.name}. As entregas já criadas mantêm o valor.`}
        confirmLabel="Salvar"
        loading={saving}
        onConfirm={doSave}
        onCancel={() => setConfirmSave(false)}
      />
      <ConfirmModal
        show={confirmReset}
        title="Voltar para a regra padrão?"
        message={`As regras próprias de ${data.city.name} serão apagadas (valores, faixas de horário e modo chuva). Entregas já criadas não mudam.`}
        confirmLabel="Voltar ao padrão"
        loading={saving}
        onConfirm={doReset}
        onCancel={() => setConfirmReset(false)}
      />
    </div>
  );
}
