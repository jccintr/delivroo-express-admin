import { useCallback, useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Avatar, Badge, Button, Select, Spinner, TextInput } from 'flowbite-react';
import { HiOutlineSearch, HiOutlineChevronLeft, HiOutlineChevronRight } from 'react-icons/hi';
import { listStores } from '../../api/stores';
import { listCities } from '../../api/cities';

const TABS = [
  { key: 'active', label: 'Ativas' },
  { key: 'inactive', label: 'Inativas' },
  { key: 'all', label: 'Todas' },
];

export default function StoresPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const status = searchParams.get('status') || 'active';
  const page = Number(searchParams.get('page') || 1);
  const city = searchParams.get('city') || '';
  const search = searchParams.get('search') || '';

  const [searchInput, setSearchInput] = useState(search);
  const [cities, setCities] = useState([]);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await listStores({
        status: status === 'all' ? undefined : status,
        city: city || undefined,
        search: search || undefined,
        page,
        limit: 10,
      });
      setResult(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [status, city, search, page]);

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

  function handleSearchSubmit(e) {
    e.preventDefault();
    updateParams({ search: searchInput });
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="mb-1 text-xl font-bold">Lojas</h1>
        <p className="text-sm text-ink-soft">Gerencie as contas de lojistas cadastradas na plataforma.</p>
      </div>

      <div className="flex flex-wrap gap-2">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => updateParams({ status: tab.key })}
            className={`rounded-full px-4 py-1.5 text-sm font-medium transition ${
              status === tab.key
                ? 'bg-orange text-white'
                : 'border border-line bg-white text-ink-soft hover:border-orange-dark'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="flex flex-col gap-3 sm:flex-row">
        <form onSubmit={handleSearchSubmit} className="flex flex-1 gap-2">
          <TextInput
            icon={HiOutlineSearch}
            placeholder="Buscar por nome ou e-mail"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="flex-1"
          />
          <Button type="submit" color="light">
            Buscar
          </Button>
        </form>
        <Select value={city} onChange={(e) => updateParams({ city: e.target.value })} className="sm:w-56">
          <option value="">Todas as cidades</option>
          {cities.map((c) => (
            <option key={c._id} value={c._id}>
              {c.name} - {c.state}
            </option>
          ))}
        </Select>
      </div>

      {error && <p className="text-sm text-red">{error}</p>}

      {loading && !result ? (
        <div className="flex justify-center py-16">
          <Spinner color="warning" size="xl" aria-label="Carregando lojas" />
        </div>
      ) : result && result.data.length === 0 ? (
        <p className="py-10 text-center text-sm text-ink-soft">Nenhuma loja encontrada com esses filtros.</p>
      ) : (
        result && (
          <div className="flex flex-col gap-3">
            {result.data.map((store) => (
              <Link
                key={store._id}
                to={`/lojas/${store._id}`}
                className="flex flex-col gap-3 rounded-xl border border-line bg-white p-4 transition hover:border-orange-dark sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <Avatar
                    img={store.avatar || undefined}
                    rounded
                    placeholderInitials={store.name?.charAt(0)?.toUpperCase()}
                  />
                  <div className="min-w-0">
                    <p className="truncate font-medium text-ink">{store.name}</p>
                    <p className="truncate text-sm text-ink-soft">{store.email}</p>
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-3 sm:justify-end">
                  <span className="text-xs text-ink-soft">
                    {store.city?.name} - {store.city?.state}
                  </span>
                  <Badge color={store.active ? 'success' : 'failure'}>
                    {store.active ? 'Ativa' : 'Inativa'}
                  </Badge>
                </div>
              </Link>
            ))}

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
