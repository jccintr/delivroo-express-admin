import { Drawer, DrawerHeader, DrawerItems, Avatar, Badge } from 'flowbite-react';
import {
  HiOutlineTruck,
  HiOutlineLocationMarker,
  HiOutlineOfficeBuilding,
  HiOutlineUser,
  HiOutlineCube,
  HiOutlineCurrencyDollar,
  HiOutlineClock,
  HiOutlineExclamationCircle,
  HiOutlineExternalLink,
} from 'react-icons/hi';
import { formatCurrency, formatDateTime } from '../../utils/format';
import { getDeliveryStatusInfo } from '../../utils/deliveryStatus';

function mapsLink(latitude, longitude) {
  if (latitude == null || longitude == null) return null;
  return `https://www.google.com/maps?q=${latitude},${longitude}`;
}

const PACKAGE_CATEGORY_LABELS = {
  Comida: 'Comida',
  Documentos: 'Documentos',
  Pacote: 'Pacote',
  Medicamentos: 'Medicamentos',
  Peças: 'Peças',
  Outros: 'Outros',
};

export default function DeliveryDetailsDrawer({ delivery, onClose }) {
  const open = !!delivery;

  return (
    <Drawer open={open} onClose={onClose} position="right" className="w-full max-w-xl">
      <DrawerHeader title="Detalhes da entrega" titleIcon={HiOutlineTruck} />
      {delivery && (
        <DrawerItems>
          <div className="flex flex-col gap-6 pb-6">
            {/* Status e datas-chave */}
            <Section>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <Badge color={getDeliveryStatusInfo(delivery.status).badgeColor} size="sm">
                  {getDeliveryStatusInfo(delivery.status).label}
                </Badge>
                <span className="font-mono text-xs text-ink-soft">#{delivery._id}</span>
              </div>
              {delivery.cancelReason && (
                <div className="mt-3 flex gap-2 rounded-lg bg-red-bg p-3 text-sm text-red">
                  <HiOutlineExclamationCircle className="h-5 w-5 shrink-0" />
                  <span>{delivery.cancelReason}</span>
                </div>
              )}
            </Section>

            {/* Valores */}
            <Section icon={HiOutlineCurrencyDollar} title="Valores">
              <Field label="Repasse ao entregador" value={formatCurrency(delivery.riderPayout)} />
              <Field label="Distância" value={delivery.distancia != null ? `${delivery.distancia} km` : '—'} />
              <PayoutBreakdown breakdown={delivery.payoutBreakdown} />
            </Section>

            {/* Loja */}
            <Section icon={HiOutlineOfficeBuilding} title="Loja">
              <div className="mb-2 flex items-center gap-3">
                <Avatar
                  img={delivery.store?.avatar || undefined}
                  rounded
                  size="sm"
                  placeholderInitials={delivery.store?.name?.charAt(0)?.toUpperCase()}
                />
                <span className="font-medium text-ink">{delivery.store?.name || '—'}</span>
              </div>
              <Field label="Telefone" value={delivery.store?.phone} />
              <Field label="E-mail" value={delivery.store?.email} />
              <Field label="Cidade" value={delivery.city ? `${delivery.city.name} - ${delivery.city.state}` : '—'} />
              <AddressField label="Endereço de origem" address={delivery.origem?.address} lat={delivery.origem?.latitude} lng={delivery.origem?.longitude} />
            </Section>

            {/* Cliente / destino */}
            <Section icon={HiOutlineLocationMarker} title="Cliente e destino">
              <Field label="Nome" value={delivery.destino?.nome} />
              <Field label="Telefone" value={delivery.destino?.telefone} />
              <AddressField label="Endereço de entrega" address={delivery.destino?.address} lat={delivery.destino?.latitude} lng={delivery.destino?.longitude} />
            </Section>

            {/* Entregador */}
            <Section icon={HiOutlineUser} title="Entregador">
              {delivery.rider ? (
                <>
                  <div className="mb-2 flex items-center gap-3">
                    <Avatar
                      img={delivery.rider.avatar || undefined}
                      rounded
                      size="sm"
                      placeholderInitials={delivery.rider.name?.charAt(0)?.toUpperCase()}
                    />
                    <span className="font-medium text-ink">{delivery.rider.name}</span>
                  </div>
                  <Field label="Telefone" value={delivery.rider.phone} />
                  <Field label="E-mail" value={delivery.rider.email} />
                  <Field label="Veículo" value={delivery.rider.vehicle?.type} />
                  <Field
                    label="Avaliação"
                    value={delivery.rider.rating != null ? delivery.rider.rating.toFixed(1) : '—'}
                  />
                </>
              ) : (
                <p className="text-sm text-ink-soft">Aguardando entregador aceitar.</p>
              )}
            </Section>

            {/* Pacote */}
            <Section icon={HiOutlineCube} title="Pacote">
              <Field label="Descrição" value={delivery.package?.description} />
              <Field label="Categoria" value={PACKAGE_CATEGORY_LABELS[delivery.package?.category] || delivery.package?.category} />
              <Field label="Quantidade" value={delivery.package?.quantity} />
              <Field label="Peso" value={delivery.package?.weight != null ? `${delivery.package.weight} kg` : '—'} />
              <Field label="Valor declarado" value={formatCurrency(delivery.package?.declaredvalue)} />
              <Field label="Forma de pagamento" value={delivery.package?.payment} />
              <Field label="Troco para" value={delivery.package?.cashChange > 0 ? formatCurrency(delivery.package.cashChange) : '—'} />
              <Field label="Valor a cobrar" value={delivery.package?.amountDue > 0 ? formatCurrency(delivery.package.amountDue) : '—'} />
              {delivery.package?.notes && (
                <div className="mt-1">
                  <p className="text-xs text-ink-soft">Observações</p>
                  <p className="text-sm text-ink">{delivery.package.notes}</p>
                </div>
              )}
            </Section>

            {/* Linha do tempo */}
            <Section icon={HiOutlineClock} title="Linha do tempo">
              {delivery.events?.length > 0 ? (
                <ol className="flex flex-col gap-4">
                  {delivery.events.map((event, index) => (
                    <li key={`${event.data}-${index}`} className="flex gap-3">
                      <div className="flex flex-col items-center">
                        <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-orange" />
                        {index < delivery.events.length - 1 && <span className="w-px flex-1 bg-line" />}
                      </div>
                      <div className="pb-1">
                        <p className="text-sm text-ink">{event.descricao}</p>
                        <p className="text-xs text-ink-soft">{formatDateTime(event.data)}</p>
                      </div>
                    </li>
                  ))}
                </ol>
              ) : (
                <p className="text-sm text-ink-soft">Nenhum evento registrado ainda.</p>
              )}
            </Section>

            {/* Registro técnico */}
            <Section title="Registro">
              <Field label="Criada em" value={formatDateTime(delivery.createdAt)} />
              <Field label="Última atualização" value={formatDateTime(delivery.updatedAt)} />
            </Section>
          </div>
        </DrawerItems>
      )}
    </Drawer>
  );
}

function Section({ icon: Icon, title, children }) {
  return (
    <div className="rounded-xl border border-line p-4">
      {title && (
        <p className="mb-3 flex items-center gap-2 text-sm font-medium text-ink">
          {Icon && <Icon className="h-4 w-4 text-orange-dark" />}
          {title}
        </p>
      )}
      <div className="flex flex-col gap-2">{children}</div>
    </div>
  );
}

// Como o repasse foi calculado (gravado na criação da entrega; entregas antigas não têm)
function PayoutBreakdown({ breakdown }) {
  if (!breakdown) return null;
  return (
    <div className="mt-1 flex flex-col gap-1 rounded-lg bg-cream p-3 text-xs text-ink-soft">
      <p className="font-medium text-ink">Como foi calculado ({breakdown.source === 'city' ? 'regra da cidade' : 'regra padrão'})</p>
      <div className="flex justify-between"><span>Valor base</span><span>{formatCurrency(breakdown.baseFee)}</span></div>
      <div className="flex justify-between"><span>Distância ({breakdown.distanceKm} km × {formatCurrency(breakdown.perKm)})</span><span>{formatCurrency(breakdown.distanceFee)}</span></div>
      {breakdown.longDistanceExtra > 0 && <div className="flex justify-between"><span>Adicional de distância longa</span><span>{formatCurrency(breakdown.longDistanceExtra)}</span></div>}
      {breakdown.minimumApplied && <div className="flex justify-between"><span>Valor mínimo aplicado</span><span>{formatCurrency(breakdown.minimumFee)}</span></div>}
      {breakdown.adjustments?.map((a, i) => (
        <div key={i} className="flex justify-between"><span>{a.origin === 'rain' ? 'Modo chuva' : a.name}{a.kind === 'percent' ? ` (${a.value}%)` : ''}</span><span>+ {formatCurrency(a.amount)}</span></div>
      ))}
      {breakdown.maximumApplied && <div className="flex justify-between"><span>Teto aplicado</span><span>{formatCurrency(breakdown.maximumFee)}</span></div>}
    </div>
  );
}

function Field({ label, value }) {
  return (
    <div className="flex items-start justify-between gap-4 text-sm">
      <span className="text-ink-soft">{label}</span>
      <span className="text-right font-medium text-ink">{value || value === 0 ? value : '—'}</span>
    </div>
  );
}

function AddressField({ label, address, lat, lng }) {
  const link = mapsLink(lat, lng);
  return (
    <div>
      <p className="text-xs text-ink-soft">{label}</p>
      <div className="flex items-start justify-between gap-3">
        <p className="text-sm text-ink">{address || '—'}</p>
        {link && (
          <a
            href={link}
            target="_blank"
            rel="noreferrer"
            className="flex shrink-0 items-center gap-1 text-xs font-medium text-orange-dark hover:underline"
          >
            Mapa <HiOutlineExternalLink className="h-3.5 w-3.5" />
          </a>
        )}
      </div>
    </div>
  );
}
