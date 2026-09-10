import { useCallback, useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Badge, Button, Select, Spinner } from 'flowbite-react';
import { HiOutlineChevronLeft, HiOutlineChevronRight, HiOutlineX } from 'react-icons/hi';
import { listDeliveries } from '../../api/deliveries';
import { listCities } from '../../api/cities';
import { formatCurrency, formatDateTime } from '../../utils/format';
import { getDeliveryStatusInfo, DELIVERY_STATUS_INFO } from '../../utils/deliveryStatus';

export default function DeliveriesPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const status = searchParams.get('status') ?? '';
  const city = searchParams.get('city') || '';
  const store = searchParams.get('store') || '';
  const rider = searchParams.get('rider') || '';
  const page = Number(searchParams.get('page') || 1);

  const [cities, setCities] = useState([]);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await listDeliveries({
        status: status !== '' ? status : undefined,
        city: city || undefined,
        store: store || undefined,
        rider: rider || undefined,
        page,
        limit: 15,
      });
      setResult(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [status, city, store, rider, page]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    listCities().then(setCities).catch(() => {});
  }, []);

  function updateParams(patch) {
    const next = new URLSearchParams(searchParams);
    Object.entries(patch).forEach(([key, value]) => {
      if (value) next.set(key, value);
      else next.delete(key);
    });
    if (!('page' in patch)) next.delete('page');
    setSearchParams(next);
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="mb-1 text-xl font-bold">Entregas</h1>
        <p className="text-sm text-ink-soft">Monitor de todas as entregas da plataforma, de qualquer loja ou cidade.</p>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row">
        <Select value={status} onChange={(e) => updateParams({ status: e.target.value })} className="sm:w-56">
          <option value="">Todos os status</option>
          {Object.entries(DELIVERY_STATUS_INFO).map(([value, info]) => (
            <option key={value} value={value}>
              {info.label}
            </option>
          ))}
        </Select>
        <Select value={city} onChange={(e) => updateParams({ city: e.target.value })} className="sm:w-56">
          <option value="">Todas as cidades</option>
          {cities.map((c) => (
            <option key={c._id} value={c._id}>
              {c.name} - {c.state}
            </option>
          ))}
        </Select>

        {/* Filtros de loja/rider chegam via link (ex: da tela de detalhe da
            loja/entregador) — sem seletor dedicado aqui, mas mostrados como
            chip removível quando presentes na URL. */}
        {store && (
          <button
            type="button"
            onClick={() => updateParams({ store: '' })}
            className="flex w-fit items-center gap-1.5 rounded-full border border-line bg-white px-3 py-1.5 text-sm text-ink-soft"
          >
            Filtrando por loja <HiOutlineX className="h-4 w-4" />
          </button>
        )}
        {rider && (
          <button
            type="button"
            onClick={() => updateParams({ rider: '' })}
            className="flex w-fit items-center gap-1.5 rounded-full border border-line bg-white px-3 py-1.5 text-sm text-ink-soft"
          >
            Filtrando por entregador <HiOutlineX className="h-4 w-4" />
          </button>
        )}
      </div>

      {error && <p className="text-sm text-red">{error}</p>}

      {loading && !result ? (
        <div className="flex justify-center py-16">
          <Spinner color="warning" size="xl" aria-label="Carregando entregas" />
        </div>
      ) : result && result.data.length === 0 ? (
        <p className="py-10 text-center text-sm text-ink-soft">Nenhuma entrega encontrada com esses filtros.</p>
      ) : (
        result && (
          <div className="flex flex-col gap-3">
            {result.data.map((delivery) => {
              const info = getDeliveryStatusInfo(delivery.status);
              return (
                <div key={delivery._id} className="rounded-xl border border-line bg-white p-4">
                  <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                    <Badge color={info.badgeColor}>{info.label}</Badge>
                    <span className="text-xs text-ink-soft">{formatDateTime(delivery.createdAt)}</span>
                  </div>
                  <div className="grid gap-x-6 gap-y-1 sm:grid-cols-2">
                    <p className="text-sm text-ink">
                      <span className="text-ink-soft">Loja: </span>
                      {delivery.store?.name || '—'}
                    </p>
                    <p className="text-sm text-ink">
                      <span className="text-ink-soft">Cliente: </span>
                      {delivery.destino?.nome || '—'}
                    </p>
                    <p className="text-sm text-ink">
                      <span className="text-ink-soft">Entregador: </span>
                      {delivery.rider?.name || 'Aguardando'}
                    </p>
                    <p className="text-sm text-ink">
                      <span className="text-ink-soft">Cidade: </span>
                      {delivery.city ? `${delivery.city.name} - ${delivery.city.state}` : '—'}
                    </p>
                    <p className="text-sm text-ink">
                      <span className="text-ink-soft">Repasse: </span>
                      {formatCurrency(delivery.riderPayout)}
                    </p>
                    <p className="text-sm text-ink">
                      <span className="text-ink-soft">Distância: </span>
                      {delivery.distancia != null ? `${delivery.distancia} km` : '—'}
                    </p>
                  </div>
                </div>
              );
            })}

            {result.totalPages > 1 && (
              <div className="flex items-center justify-center gap-3 pt-2">
                <Button
                  size="sm"
                  color="light"
                  disabled={page <= 1}
                  onClick={() => updateParams({ page: String(page - 1) })}
                >
                  <HiOutlineChevronLeft className="h-4 w-4" />
                </Button>
                <span className="text-sm text-ink-soft">
                  Página {result.page} de {result.totalPages}
                </span>
                <Button
                  size="sm"
                  color="light"
                  disabled={page >= result.totalPages}
                  onClick={() => updateParams({ page: String(page + 1) })}
                >
                  <HiOutlineChevronRight className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>
        )
      )}
    </div>
  );
}
