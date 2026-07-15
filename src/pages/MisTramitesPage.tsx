import { useEffect, useMemo, useState } from 'react';
import { getMyReservas, getMyVisitas } from '../services/serviceService';
import { deletePropuesta, getMyPropuestas } from '../services/propuestaService';
import type { PropuestaDto, ReservationDto, ResenaDto, VisitDto } from '../types/service';
import ReviewForm from '../components/ReviewForm';
import { buildPropuestaPdf } from '../utils/propuestaPdf';
import { slugify } from '../utils/slugify';

type TramiteItem =
  | { tipo: 'reserva'; data: ReservationDto; fecha: Date }
  | { tipo: 'visita'; data: VisitDto; fecha: Date };

type TabId = 'todo' | 'reservas' | 'visitas' | 'propuestas';

type ShareableNavigator = Navigator & {
  share?: (data: { files?: File[]; title?: string }) => Promise<void>;
  canShare?: (data: { files?: File[] }) => boolean;
};

const moneyFmt = new Intl.NumberFormat('es-UY');
const dateFmt = new Intl.DateTimeFormat('es-UY', { dateStyle: 'long', timeStyle: 'short' });
const dateFmtShort = new Intl.DateTimeFormat('es-UY', { dateStyle: 'medium' });

function getPagoBadge(data: ReservationDto): { label: string; cls: string } | null {
  if (!data.confirmada || !data.pagos?.length) return null;
  if (data.pagos.some(p => p.tipoPago === 'Total')) return { label: 'Pagado en su totalidad', cls: 'tramite-card__badge--pago-total' };
  if (data.pagos.some(p => p.tipoPago === 'Parcial')) return { label: 'Pago parcial', cls: 'tramite-card__badge--pago-parcial' };
  return { label: 'Seña pagada', cls: 'tramite-card__badge--pago-seña' };
}

const ReservaCard = ({
  data,
  onOpenReview,
}: {
  data: ReservationDto;
  onOpenReview: (reservaId: string) => void;
}) => {
  const pagoBadge = getPagoBadge(data);
  const estadoLabel = data.confirmada ? 'Confirmada' : 'Pendiente';
  const estadoCls = data.confirmada ? 'tramite-card__badge--confirmada' : 'tramite-card__badge--pendiente';

  return (
    <article className="tramite-card">
      <div className="tramite-card__badges">
        <span className="tramite-card__badge tramite-card__badge--reserva">Reserva</span>
        <span className={`tramite-card__badge ${estadoCls}`}>{estadoLabel}</span>
        {pagoBadge && <span className={`tramite-card__badge ${pagoBadge.cls}`}>{pagoBadge.label}</span>}
      </div>
      <h3 className="tramite-card__title">{data.serviceNombre ?? 'Servicio'}</h3>
      <p className="tramite-card__date">{dateFmt.format(new Date(data.fechaReservaCliente))}</p>
      {data.confirmada && data.montoAcordado != null && (
        <p className="tramite-card__monto">Monto acordado: $ {moneyFmt.format(data.montoAcordado)}</p>
      )}
      {(data.vendorNombre || data.vendorEmail || data.vendorTelefono) && (
        <div className="tramite-card__vendor">
          {data.vendorNombre && <span className="tramite-card__vendor-row">👤 {data.vendorNombre}</span>}
          {data.vendorEmail && <span className="tramite-card__vendor-row">✉️ {data.vendorEmail}</span>}
          {data.vendorTelefono && <span className="tramite-card__vendor-row">📞 {data.vendorTelefono}</span>}
        </div>
      )}
      {data.realizada && (
        <div className="tramite-card__review-cta">
          {data.resenaId ? (
            <span className="tramite-card__badge tramite-card__badge--reseñada">Ya reseñaste esta reserva</span>
          ) : (
            <button type="button" className="btn-secondary" onClick={() => onOpenReview(data.id)}>
              Dejar reseña
            </button>
          )}
        </div>
      )}
    </article>
  );
};

const VisitaCard = ({ data }: { data: VisitDto }) => {
  const estadoCls = data.estado === 'Confirmada' ? 'tramite-card__badge--confirmada' : 'tramite-card__badge--pendiente';
  return (
    <article className="tramite-card">
      <div className="tramite-card__badges">
        <span className="tramite-card__badge tramite-card__badge--visita">Visita</span>
        <span className={`tramite-card__badge ${estadoCls}`}>{data.estado}</span>
      </div>
      <h3 className="tramite-card__title">{data.serviceNombre ?? 'Servicio'}</h3>
      <p className="tramite-card__date">{dateFmt.format(new Date(data.fechaHoraSolicitada))}</p>
      {(data.vendorNombre || data.vendorEmail || data.vendorTelefono) && (
        <div className="tramite-card__vendor">
          {data.vendorNombre && <span className="tramite-card__vendor-row">👤 {data.vendorNombre}</span>}
          {data.vendorEmail && <span className="tramite-card__vendor-row">✉️ {data.vendorEmail}</span>}
          {data.vendorTelefono && <span className="tramite-card__vendor-row">📞 {data.vendorTelefono}</span>}
        </div>
      )}
    </article>
  );
};

const handleCompartirPropuesta = async (propuesta: PropuestaDto) => {
  const blob = buildPropuestaPdf(propuesta);
  const filename = `propuesta-${slugify(propuesta.nombre)}.pdf`;
  const file = new File([blob], filename, { type: 'application/pdf' });

  const nav = navigator as ShareableNavigator;
  if (nav.canShare?.({ files: [file] })) {
    try {
      await nav.share?.({ files: [file], title: propuesta.nombre });
      return;
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') return;
    }
  }

  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
};

const PropuestaCard = ({
  data,
  onCompartir,
  onEliminar,
}: {
  data: PropuestaDto;
  onCompartir: (propuesta: PropuestaDto) => void;
  onEliminar: (id: string) => void;
}) => (
  <article className="tramite-card">
    <div className="tramite-card__badges">
      <span className="tramite-card__badge tramite-card__badge--propuesta">Propuesta</span>
    </div>
    <h3 className="tramite-card__title">{data.nombre}</h3>
    <p className="tramite-card__date">{dateFmtShort.format(new Date(data.fechaCreacion))}</p>

    <div className="propuesta-card__salon">
      <strong>{data.salon.nombre}</strong>
      <span> — desde $ {moneyFmt.format(data.salon.precioMinimo)}</span>
    </div>

    {data.servicios.length > 0 && (
      <ul className="propuesta-card__servicios">
        {data.servicios.map((s) => (
          <li key={s.id}>
            {s.nombre} <span className="propuesta-card__servicio-tipo">({s.tipoServicio})</span> — desde $ {moneyFmt.format(s.precioMinimo)}
          </li>
        ))}
      </ul>
    )}

    <p className="propuesta-card__total">Total estimado: $ {moneyFmt.format(data.totalEstimado)}</p>

    <div className="propuesta-card__actions">
      <button type="button" className="btn-secondary" onClick={() => onCompartir(data)}>
        Compartir
      </button>
      <button type="button" className="tramite-card__delete" onClick={() => onEliminar(data.id)}>
        Eliminar propuesta
      </button>
    </div>
  </article>
);

const MisTramitesPage = () => {
  const [reservas, setReservas] = useState<ReservationDto[]>([]);
  const [visitas, setVisitas] = useState<VisitDto[]>([]);
  const [propuestas, setPropuestas] = useState<PropuestaDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TabId>('todo');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [priceChoice, setPriceChoice] = useState<Record<string, 'min' | 'max'>>({});
  const [isCalculatorOpen, setIsCalculatorOpen] = useState(false);
  const [reviewingReservaId, setReviewingReservaId] = useState<string | null>(null);

  const handleReviewSubmitted = (resena: ResenaDto) => {
    setReservas(prev => prev.map(r => (r.id === resena.reservaId ? { ...r, resenaId: resena.id } : r)));
    setReviewingReservaId(null);
  };

  const handleEliminarPropuesta = async (id: string) => {
    const confirmed = globalThis.confirm('¿Querés eliminar esta propuesta?');
    if (!confirmed) return;
    try {
      await deletePropuesta(id);
      setPropuestas(prev => prev.filter(p => p.id !== id));
    } catch {
      setError('No se pudo eliminar la propuesta.');
    }
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsCalculatorOpen(false);
        setReviewingReservaId(null);
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        const [fetchedReservas, fetchedVisitas, fetchedPropuestas] = await Promise.all([
          getMyReservas(),
          getMyVisitas(),
          getMyPropuestas(),
        ]);
        setReservas(fetchedReservas);
        setVisitas(fetchedVisitas);
        setPropuestas(fetchedPropuestas);
        setSelectedIds(new Set(fetchedReservas.map(r => r.id)));
      } catch {
        setError('No se pudieron cargar tus trámites. Intentá de nuevo más tarde.');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const allItems = useMemo<TramiteItem[]>(() => {
    const reservaItems: TramiteItem[] = reservas.map(r => ({
      tipo: 'reserva',
      data: r,
      fecha: new Date(r.fechaReservaCliente),
    }));
    const visitaItems: TramiteItem[] = visitas.map(v => ({
      tipo: 'visita',
      data: v,
      fecha: new Date(v.fechaHoraSolicitada),
    }));
    return [...reservaItems, ...visitaItems].sort((a, b) => b.fecha.getTime() - a.fecha.getTime());
  }, [reservas, visitas]);

  const filteredItems = useMemo<TramiteItem[]>(() => {
    if (activeTab === 'todo') return allItems;
    if (activeTab === 'reservas') return allItems.filter(i => i.tipo === 'reserva');
    return allItems.filter(i => i.tipo === 'visita');
  }, [allItems, activeTab]);

  const toggleSelected = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const getMontoForReserva = (r: ReservationDto): number => {
    if (r.confirmada && r.montoAcordado != null) return r.montoAcordado;
    const choice = priceChoice[r.id] ?? 'min';
    return choice === 'min' ? (r.precioMinimo ?? 0) : (r.precioMaximo ?? 0);
  };

  const total = reservas
    .filter(r => selectedIds.has(r.id))
    .reduce((sum, r) => sum + getMontoForReserva(r), 0);

  const emptyMessage =
    activeTab === 'todo'
      ? 'Todavía no tenés trámites. Explorá los servicios disponibles.'
      : activeTab === 'reservas'
      ? 'Todavía no tenés reservas.'
      : 'Todavía no tenés visitas.';

  return (
    <div className="mis-tramites">
      <div className="app-shell mis-tramites__shell">
        <header className="mis-tramites__header">
          <h1>Mis trámites</h1>
          <p className="mis-tramites__subtitle">Tus reservas y visitas en un solo lugar.</p>
        </header>

        {loading && <p className="mis-tramites__state">Cargando trámites...</p>}

        {!loading && error && (
          <p className="mis-tramites__state mis-tramites__state--error" role="alert">
            {error}
          </p>
        )}

        {!loading && !error && (
          <>
            <nav className="mis-tramites__tabs" aria-label="Filtrar trámites">
              {(['todo', 'reservas', 'visitas', 'propuestas'] as const).map(tab => (
                <button
                  key={tab}
                  type="button"
                  className={`mis-tramites__tab${activeTab === tab ? ' is-active' : ''}`}
                  onClick={() => setActiveTab(tab)}
                >
                  {tab === 'todo' ? 'Todo' : tab === 'reservas' ? 'Reservas' : tab === 'visitas' ? 'Visitas' : 'Propuestas'}
                </button>
              ))}
            </nav>

            {activeTab === 'propuestas' ? (
              propuestas.length === 0 ? (
                <p className="mis-tramites__empty">Todavía no tenés propuestas guardadas.</p>
              ) : (
                <ul className="mis-tramites__list" role="list">
                  {propuestas.map(propuesta => (
                    <li key={propuesta.id}>
                      <PropuestaCard
                        data={propuesta}
                        onCompartir={handleCompartirPropuesta}
                        onEliminar={handleEliminarPropuesta}
                      />
                    </li>
                  ))}
                </ul>
              )
            ) : filteredItems.length === 0 ? (
              <p className="mis-tramites__empty">{emptyMessage}</p>
            ) : (
              <ul className="mis-tramites__list" role="list">
                {filteredItems.map(item =>
                  item.tipo === 'reserva' ? (
                    <li key={`r-${item.data.id}`}>
                      <ReservaCard data={item.data} onOpenReview={setReviewingReservaId} />
                    </li>
                  ) : (
                    <li key={`v-${item.data.id}`}>
                      <VisitaCard data={item.data} />
                    </li>
                  ),
                )}
              </ul>
            )}

            {reservas.length > 0 && (
              <div className="mis-tramites__calculator-trigger">
                <button
                  type="button"
                  className="mis-tramites__calculator-btn"
                  onClick={() => setIsCalculatorOpen(true)}
                >
                  Calculadora de presupuesto
                </button>
              </div>
            )}

            {isCalculatorOpen && (
              <div className="calculator-modal">
                <button
                  type="button"
                  className="calculator-modal__backdrop"
                  aria-label="Cerrar calculadora"
                  onClick={() => setIsCalculatorOpen(false)}
                />
                <dialog open className="calculator-modal__box" aria-label="Calculadora de presupuesto">
                  <div className="calculator-modal__header">
                    <h2 className="calculator__title">Calculadora de presupuesto</h2>
                    <button
                      type="button"
                      className="calculator-modal__close"
                      onClick={() => setIsCalculatorOpen(false)}
                      aria-label="Cerrar calculadora"
                    >
                      ✕
                    </button>
                  </div>
                  <p className="calculator__subtitle">
                    Seleccioná las reservas que querés incluir y elegí el rango de precio para las pendientes.
                  </p>
                  <div className="calculator__table-wrapper">
                    <table className="calculator__table">
                      <thead>
                        <tr>
                          <th></th>
                          <th>Servicio</th>
                          <th>Monto</th>
                        </tr>
                      </thead>
                      <tbody>
                        {reservas.map(r => (
                          <tr
                            key={r.id}
                            className={selectedIds.has(r.id) ? 'calculator__row--selected' : ''}
                          >
                            <td>
                              <input
                                type="checkbox"
                                checked={selectedIds.has(r.id)}
                                onChange={() => toggleSelected(r.id)}
                                aria-label={`Incluir ${r.serviceNombre ?? 'reserva'}`}
                              />
                            </td>
                            <td className="calculator__service-cell">
                              <span className="calculator__service-name">
                                {r.serviceNombre ?? 'Servicio'}
                              </span>
                              <span className="calculator__service-date">
                                {dateFmtShort.format(new Date(r.fechaReservaCliente))}
                              </span>
                            </td>
                            <td className="calculator__amount-cell">
                              {r.confirmada && r.montoAcordado != null ? (
                                <span className="calculator__fixed-amount">
                                  $ {moneyFmt.format(r.montoAcordado)}
                                </span>
                              ) : (
                                <div className="calculator__radio-group">
                                  <label className="calculator__radio-label">
                                    <input
                                      type="radio"
                                      name={`price-${r.id}`}
                                      value="min"
                                      checked={(priceChoice[r.id] ?? 'min') === 'min'}
                                      onChange={() =>
                                        setPriceChoice(prev => ({ ...prev, [r.id]: 'min' }))
                                      }
                                    />
                                    Mín $ {moneyFmt.format(r.precioMinimo ?? 0)}
                                  </label>
                                  <label className="calculator__radio-label">
                                    <input
                                      type="radio"
                                      name={`price-${r.id}`}
                                      value="max"
                                      checked={(priceChoice[r.id] ?? 'min') === 'max'}
                                      onChange={() =>
                                        setPriceChoice(prev => ({ ...prev, [r.id]: 'max' }))
                                      }
                                    />
                                    Máx $ {moneyFmt.format(r.precioMaximo ?? 0)}
                                  </label>
                                </div>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <div className="calculator__total">
                    <span>Total estimado</span>
                    <span className="calculator__total-amount">$ {moneyFmt.format(total)}</span>
                  </div>
                </dialog>
              </div>
            )}

            {reviewingReservaId && (
              <ReviewForm
                reservaId={reviewingReservaId}
                onClose={() => setReviewingReservaId(null)}
                onSubmitted={handleReviewSubmitted}
              />
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default MisTramitesPage;
