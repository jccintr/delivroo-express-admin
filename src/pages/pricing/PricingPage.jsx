import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Alert, Badge, Button, Card, Spinner } from 'flowbite-react';
import { HiOutlineCloud, HiOutlinePencil } from 'react-icons/hi';
import { listCities } from '../../api/cities';
import { listPricingRules, setCityRain } from '../../api/pricing';
import ConfirmModal from '../../components/ui/ConfirmModal';

const rainLabel = (rain) => (rain.kind === 'percent' ? `+${rain.value}%` : `+R$ ${Number(rain.value).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`);

export default function PricingPage() {
  const [cities, setCities] = useState([]);
  const [rules, setRules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [rainTarget, setRainTarget] = useState(null); // { city, turnOn, rain }
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [c, r] = await Promise.all([listCities(), listPricingRules()]);
      setCities(c);
      setRules(r);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const ruleByCity = useMemo(() => Object.fromEntries(rules.map((r) => [String(r.city), r])), [rules]);

  async function confirmRain() {
    setSaving(true);
    setError('');
    try {
      await setCityRain(rainTarget.city._id, { active: rainTarget.turnOn });
      setSuccess(
        rainTarget.turnOn
          ? `Modo chuva ligado em ${rainTarget.city.name}. Vale para as próximas entregas.`
          : `Modo chuva desligado em ${rainTarget.city.name}.`,
      );
      setRainTarget(null);
      await load();
    } catch (err) {
      setError(err.message);
      setRainTarget(null);
    } finally {
      setSaving(false);
    }
  }

  if (loading && cities.length === 0) {
    return (
      <div className="flex justify-center py-16">
        <Spinner color="warning" size="xl" aria-label="Carregando cidades" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="mb-1 text-xl font-bold">Preço da entrega por cidade</h1>
        <p className="text-sm text-ink-soft">
          Define quanto o entregador recebe por entrega em cada cidade. Cidades sem regra própria usam a regra padrão.
          Mudanças valem para as próximas entregas; as já criadas mantêm o valor.
        </p>
      </div>

      {error && <Alert color="failure" onDismiss={() => setError('')}>{error}</Alert>}
      {success && <Alert color="success" onDismiss={() => setSuccess('')}>{success}</Alert>}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {cities.map((city) => {
          const rule = ruleByCity[String(city._id)];
          const raining = !!rule?.rainActive;
          return (
            <Card key={city._id} className="border-line">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="font-medium text-ink">{city.name} - {city.state}</p>
                  {!city.active && <span className="text-xs text-ink-soft">Cidade inativa</span>}
                </div>
                <Badge color={rule ? 'warning' : 'gray'}>{rule ? 'Regra própria' : 'Regra padrão'}</Badge>
              </div>

              {raining && (
                <div className="flex items-center gap-2 rounded-lg bg-amber/10 p-2 text-sm text-ink">
                  <HiOutlineCloud className="h-5 w-5 shrink-0 text-orange-dark" />
                  <span>Modo chuva ligado ({rainLabel(rule.rain)})</span>
                </div>
              )}

              <div className="mt-auto flex flex-wrap gap-2">
                <Button as={Link} to={`/precos/${city._id}`} size="sm" className="bg-orange enabled:hover:bg-orange-dark">
                  <HiOutlinePencil className="mr-2 h-4 w-4" />
                  Editar regras
                </Button>
                <Button
                  size="sm"
                  color="light"
                  onClick={() => {
                    if (raining) setRainTarget({ city, turnOn: false, rain: rule.rain });
                    else if (rule?.rain?.value > 0) setRainTarget({ city, turnOn: true, rain: rule.rain });
                    else setError(`Para ligar o modo chuva em ${city.name}, abra "Editar regras" e informe o adicional de chuva.`);
                  }}
                >
                  <HiOutlineCloud className="mr-2 h-4 w-4" />
                  {raining ? 'Desligar chuva' : 'Ligar chuva'}
                </Button>
              </div>
            </Card>
          );
        })}
        {cities.length === 0 && <p className="text-sm text-ink-soft">Nenhuma cidade cadastrada.</p>}
      </div>

      <ConfirmModal
        show={!!rainTarget}
        title={rainTarget?.turnOn ? 'Ligar modo chuva?' : 'Desligar modo chuva?'}
        message={
          rainTarget?.turnOn
            ? `Em ${rainTarget?.city.name}, as próximas entregas terão ${rainLabel(rainTarget.rain)} no valor do entregador. Entregas já criadas não mudam.`
            : `Em ${rainTarget?.city.name}, as próximas entregas voltam ao valor normal. Entregas já criadas não mudam.`
        }
        confirmLabel={rainTarget?.turnOn ? 'Ligar' : 'Desligar'}
        loading={saving}
        onConfirm={confirmRain}
        onCancel={() => setRainTarget(null)}
      />
    </div>
  );
}
