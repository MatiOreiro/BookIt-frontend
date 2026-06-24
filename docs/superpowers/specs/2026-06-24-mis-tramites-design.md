# Mis Trámites — Design Spec

**Date:** 2026-06-24
**Status:** Approved

---

## Objetivo

Implementar la sección "Mis Trámites" para el cliente: una página que muestra en una lista unificada todas las reservas y visitas que el usuario realizó, con información del servicio, del vendedor, el estado y el estado de pago. Incluye una calculadora de presupuesto que permite al usuario estimar el total de sus reservas seleccionadas.

---

## Archivos afectados

### Frontend

| Archivo | Acción | Responsabilidad |
|---|---|---|
| `src/pages/MisTramitesPage.tsx` | Crear | Página principal con tabs, lista y calculadora |
| `src/services/serviceService.ts` | Modificar | Agregar `getMyReservas()` y `getMyVisitas()` |
| `src/types/service.ts` | Modificar | Extender `ReservationDto` y `VisitDto` con campos de servicio y vendedor |
| `src/routes/AppRouter.tsx` | Modificar | Agregar ruta `/mis-tramites` protegida |
| `src/components/layout/UserAvatarMenu.tsx` | Modificar | Habilitar ítem "Mis trámites" (NavLink real, quitar disabled) |
| `src/App.css` | Modificar | Agregar estilos para la página de trámites |

### Backend

| Archivo | Acción | Responsabilidad |
|---|---|---|
| `BookIt.API/DTOs/ReservaDto.cs` | Modificar | Agregar campos de servicio y vendedor |
| `BookIt.API/DTOs/VisitaDto.cs` | Modificar | Agregar campos de vendedor |
| `BookIt.API/Services/ReservaService.cs` | Modificar | Incluir datos de servicio y vendedor al mapear a `ReservaDto` |
| `BookIt.API/Services/VisitaService.cs` | Modificar | Incluir datos de vendedor al mapear a `VisitaDto` |

---

## Sección 1: Arquitectura y backend

### Ruta nueva

`/mis-tramites` — ruta protegida en `AppRouter.tsx` (cualquier usuario autenticado). Se registra bajo el layout existente igual que `/profile` y `/change-password`.

### `UserAvatarMenu.tsx`

El ítem "Mis trámites" pasa de ser un `<span>` no interactivo con `pointer-events: none` a un `<NavLink to="/mis-tramites">` normal, idéntico en estilo a los demás ítems del menú. Se eliminan las clases `app-user-menu__item--disabled` y el badge "(próximamente)".

### Nuevas funciones en `serviceService.ts`

```ts
export const getMyReservas = async (): Promise<ReservationDto[]> => {
  const response = await apiClient.get<unknown>('/reservas/mis-reservas');
  const items = Array.isArray(response.data) ? response.data : [];
  return items.map(normalizeReservation);
};

export const getMyVisitas = async (): Promise<VisitDto[]> => {
  const response = await apiClient.get<unknown>('/visitas/mis-visitas');
  const items = Array.isArray(response.data) ? response.data : [];
  return items.map(normalizeVisit);
};
```

### Extensión de tipos en `types/service.ts`

**`ReservationDto`** — agregar:
```ts
serviceNombre?: string | null;
precioMinimo?: number | null;
precioMaximo?: number | null;
vendorNombre?: string | null;
vendorEmail?: string | null;
vendorTelefono?: string | null;
```

**`VisitDto`** — agregar:
```ts
vendorNombre?: string | null;
vendorEmail?: string | null;
vendorTelefono?: string | null;
```

### Extensión de DTOs en el backend

**`ReservaDto.cs`** — agregar:
```csharp
public string? ServiceNombre { get; set; }
public decimal PrecioMinimo { get; set; }
public decimal PrecioMaximo { get; set; }
public string? VendorNombre { get; set; }
public string? VendorEmail { get; set; }
public string? VendorTelefono { get; set; }
```

**`VisitaDto.cs`** — agregar:
```csharp
public string? VendorNombre { get; set; }
public string? VendorEmail { get; set; }
public string? VendorTelefono { get; set; }
```

Los servicios de backend (`ReservaService`, `VisitaService`) ya tienen acceso a la entidad `Service` con su `Vendor` incluido mediante EF Core. El cambio es solo mapear los nuevos campos en el método que popula el DTO.

### Normalización en frontend (`normalizeReservation` y `normalizeVisit`)

`normalizeReservation` — agregar al objeto resultante:
```ts
serviceNombre: pickString(item.serviceNombre ?? item.ServiceNombre) || null,
precioMinimo: pickNullableNumber(item.precioMinimo ?? item.PrecioMinimo),
precioMaximo: pickNullableNumber(item.precioMaximo ?? item.PrecioMaximo),
vendorNombre: pickString(item.vendorNombre ?? item.VendorNombre) || null,
vendorEmail: pickString(item.vendorEmail ?? item.VendorEmail) || null,
vendorTelefono: pickString(item.vendorTelefono ?? item.VendorTelefono) || null,
```

`normalizeVisit` — agregar:
```ts
vendorNombre: pickString(item.vendorNombre ?? item.VendorNombre) || null,
vendorEmail: pickString(item.vendorEmail ?? item.VendorEmail) || null,
vendorTelefono: pickString(item.vendorTelefono ?? item.VendorTelefono) || null,
```

---

## Sección 2: Página y lista de trámites

### `MisTramitesPage.tsx`

**Estado del componente:**
```ts
const [reservas, setReservas] = useState<ReservationDto[]>([]);
const [visitas, setVisitas] = useState<VisitDto[]>([]);
const [loading, setLoading] = useState(true);
const [error, setError] = useState<string | null>(null);
const [activeTab, setActiveTab] = useState<'todo' | 'reservas' | 'visitas'>('todo');
```

**Carga de datos:** `Promise.all([getMyReservas(), getMyVisitas()])` en un `useEffect` al montar.

**Lista unificada:** Se construye un array de ítems tipados:
```ts
type TramiteItem =
  | { tipo: 'reserva'; data: ReservationDto; fecha: Date }
  | { tipo: 'visita'; data: VisitDto; fecha: Date };
```
Ordenado por `fecha` descendente. El filtro de tabs se aplica con un `useMemo` sobre este array.

### Tarjeta de Reserva

- **Badge "Reserva"** — color primario (violeta)
- **Badge de estado:**
  - `confirmada === false` → "Pendiente" (gris)
  - `confirmada === true` → "Confirmada" (verde)
- **Badge de pago** (solo si `confirmada === true` y `pagos` no es vacío):
  - Algún pago con `tipoPago === 'Total'` → "Pagado en su totalidad" (verde)
  - Algún pago con `tipoPago === 'Parcial'` (sin Total) → "Pago parcial" (azul)
  - Solo pagos con `tipoPago === 'Seña'` → "Seña pagada" (amarillo/amber)
- **Nombre del servicio:** `serviceNombre` (tipografía destacada)
- **Fecha:** `fechaReservaCliente` formateada con `Intl.DateTimeFormat('es-UY', { dateStyle: 'long', timeStyle: 'short' })`
- **Monto acordado** (solo si `confirmada === true` y `montoAcordado !== null`): "Monto acordado: $ X.XXX"
- **Info del vendedor:** nombre, email, teléfono (si están disponibles)

### Tarjeta de Visita

- **Badge "Visita"** — color accent (naranja, `--accent`)
- **Badge de estado** basado en `estado`:
  - `"Pendiente"` → gris
  - `"Confirmada"` → verde
  - Cualquier otro valor → gris neutro
- **Nombre del servicio:** `serviceNombre`
- **Fecha:** `fechaHoraSolicitada` formateada igual que las reservas
- **Info del vendedor:** nombre, email, teléfono

### Estado vacío

Si el array filtrado está vacío:
- Tab "Todo": "Todavía no tenés trámites. Explorá los servicios disponibles."
- Tab "Reservas": "Todavía no tenés reservas."
- Tab "Visitas": "Todavía no tenés visitas."

---

## Sección 3: Calculadora de presupuesto

La calculadora aparece **debajo de la lista** únicamente si `reservas.length > 0`. No depende del tab activo — siempre trabaja sobre todas las reservas.

### Estado de la calculadora

```ts
// Ids de reservas incluidas (por defecto todas)
const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set(reservas.map(r => r.id)));
// Para reservas pendientes: 'min' o 'max' por id
const [priceChoice, setPriceChoice] = useState<Record<string, 'min' | 'max'>>({});
```

### Lógica de monto por reserva

```ts
const getMontoForReserva = (r: ReservationDto): number => {
  if (r.confirmada && r.montoAcordado !== null && r.montoAcordado !== undefined) {
    return r.montoAcordado;
  }
  const choice = priceChoice[r.id] ?? 'min';
  return choice === 'min' ? (r.precioMinimo ?? 0) : (r.precioMaximo ?? 0);
};
```

### Total

```ts
const total = reservas
  .filter(r => selectedIds.has(r.id))
  .reduce((sum, r) => sum + getMontoForReserva(r), 0);
```

### Layout de la tabla

Una fila por cada reserva:

| Columna | Contenido |
|---|---|
| Checkbox | Incluir/excluir del total |
| Servicio | `serviceNombre` + fecha corta |
| Monto | Si confirmada: monto fijo. Si pendiente: radio "Mín $X / Máx $Y" |

**Pie de la tabla:** "Total estimado: $ X.XXX" en tipografía grande y destacada.

Si ninguna reserva está seleccionada: "Total estimado: $ 0".

---

## Notas de implementación

- El formateador de moneda se instancia una vez: `const moneyFmt = new Intl.NumberFormat('es-UY')`.
- El formateador de fecha: `new Intl.DateTimeFormat('es-UY', { dateStyle: 'long', timeStyle: 'short' })`.
- La calculadora no requiere llamadas adicionales al servidor — trabaja solo con los datos ya cargados.
- Los pagos (`PagoDto[]`) solo se muestran como badge de estado. No se muestran montos individuales de pagos al cliente.
- Si la API devuelve un campo de vendedor como string vacío, se trata como `null` (el `|| null` en la normalización lo cubre).
