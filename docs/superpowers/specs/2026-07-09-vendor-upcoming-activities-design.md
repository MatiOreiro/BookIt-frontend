# Próximas actividades en el panel de dueño

## Contexto

`VendorDashboardPage.tsx` (el panel de control del dueño) hoy muestra dos bloques: métricas agregadas (`vendor-metrics`) y la lista de servicios asociados (`vendor-dashboard__services`). Cuando el dueño tiene varios servicios, no hay forma de ver de un vistazo qué reservas o visitas requieren su atención pronto sin entrar servicio por servicio.

`ServiceOwnerDashboardPage.tsx` ya resuelve esto para **un solo servicio** con su vista de lista (`ServiceOwnerListView`, componentes `VisitCard` / `ReservationCard`), incluyendo tabs, badges de estado y metadatos (fecha, hora, cliente, mensaje).

## Objetivo

Agregar una sección "Próximas actividades" en `VendorDashboardPage.tsx`, entre las métricas y los servicios asociados, que agrega **visitas y reservas de todos los servicios del dueño** que estén pendientes o próximas, reutilizando el diseño visual de las tarjetas de `ServiceOwnerDashboardPage`.

## Ubicación

Nueva `<section className="vendor-dashboard__upcoming">` insertada en el JSX de `VendorDashboardPage` entre `vendor-metrics` y `vendor-dashboard__services`.

## Filtrado

Ventana de "próximos días" = **7 días** desde el momento actual (`now` a `now + 7d`).

- **Visita** incluida si: `estado.toLowerCase() === 'pendiente'` (sin importar la fecha, incluso vencidas) **O** `fechaHoraSolicitada` cae dentro de la ventana de 7 días.
- **Reserva** incluida si: `!confirmada` **O** (`confirmada` y saldo pendiente > 0, donde saldo = `montoAcordado - sum(pagos.importe)`) **O** `fechaReservaCliente` cae dentro de la ventana de 7 días.

Los datos salen de `services` (ya cargado por el dashboard vía `getServices()` filtrado por `vendorId`), usando `service.visitas` y `service.reservas` de cada servicio. No se agrega ningún fetch nuevo.

## Tabs

Switcher de 3 opciones (mismo patrón visual que `service-owner-dashboard__switcher`):

- **Ambas** (default): mezcla visitas y reservas filtradas, ordenadas por fecha ascendente (más próxima primero).
- **Reservas**: solo reservas filtradas, ordenadas por fecha ascendente.
- **Visitas**: solo visitas filtradas, ordenadas por fecha ascendente.

## Tarjetas

Se crean dos componentes locales de solo lectura en `VendorDashboardPage.tsx`, calcados visualmente de `VisitCard` / `ReservationCard` (mismas clases CSS: `service-owner-dashboard__reservation-card`, `--list`, headline, badge, meta, contact) pero **sin botones de acción**:

- `UpcomingVisitCard`: nombre del cliente, badge de estado, 🕒 hora, 📅 fecha, 📝 mensaje, 🏷 nombre del servicio (ya existe este campo en `VisitDto.serviceNombre`).
- `UpcomingReservationCard`: nombre del cliente, badge (Confirmada/Pendiente), 🕒 hora, 📅 fecha, ✉️ email, 📞 teléfono, **🏷 nombre del servicio** (se agrega esta línea, hoy ausente en `ReservationCard` porque en su contexto original el servicio ya es implícito).

Helpers de fecha/hora (`dateFormatter`, `timeFormatter`, `parseReservationDate`) se declaran localmente en `VendorDashboardPage.tsx`, igual que ya ocurre con `currencyFormatter` — no se extraen a un módulo compartido (estos mismos helpers ya están duplicados de forma equivalente en `ServiceOwnerDashboardPage.tsx`; seguimos la convención existente en vez de introducir una nueva abstracción).

## Contenedor de lista

`max-height` + `overflow-y: auto` (scroll interno) sobre el contenedor de la lista, sin paginado ni límite de cantidad — se muestran todos los ítems que cumplen el filtro de la tab activa.

## Interacción

Cada tarjeta es clickeable (`role="button"` / `onClick`) y navega a `/vendor/services/{serviceId}`, pasando `{ state: { service } }` con el `Service` completo correspondiente (mismo patrón que el botón "Ver detalle dueño" de la tarjeta de servicio). No hay acciones inline (confirmar/rechazar/pagos) en esta lista agregada; esas acciones siguen viviendo únicamente en `ServiceOwnerDashboardPage`.

## Estado vacío

Si no hay ítems que cumplan el criterio en la tab activa: mensaje "No tenés actividades pendientes ni próximas por ahora." con el estilo de `service-owner-dashboard__empty-state`.

## Fuera de alcance

- No se modifica `ServiceOwnerDashboardPage.tsx` ni sus componentes existentes.
- No se agregan nuevos endpoints ni cambios de backend.
- No hay acciones (confirmar/rechazar/pago) inline en la nueva sección.
