# Mis Trámites — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implementar la página `/mis-tramites` donde el cliente ve sus reservas y visitas en una lista unificada con detalles del vendedor, estado de pago y una calculadora de presupuesto.

**Architecture:** El backend extiende `ReservaDto` y `VisitaDto` con datos de servicio y vendedor, cargados mediante EF Core `.ThenInclude()` en los repositorios. El frontend crea `MisTramitesPage` con tabs Todo/Reservas/Visitas, tarjetas por tipo y una sección de calculadora que opera sobre los datos ya cargados (sin llamadas extra al servidor).

**Tech Stack:** .NET 8 / ASP.NET Core (backend), React 18 + TypeScript + React Router DOM v7 + CSS vanilla (frontend).

## Global Constraints

- Sin librerías externas de UI — vanilla CSS con variables `--primary`, `--primary-soft`, `--accent`, `--border`, `--text`, `--text-muted`, `--shadow`, `--shadow-soft`
- Sin test runner en frontend — verificación manual con `npm run dev`
- El git repo del backend está en `BookIt-backend/` y el del frontend en `BookIt-frontend/` — branches separadas en cada repo
- No modificar `AuthContext.tsx`, `useAuth.ts` ni ningún tipo en `types/auth.ts`
- No agregar dependencias npm — el único check automatizado es `npx tsc --noEmit`
- Los 4–5 errores TS preexistentes en `pages/_app.tsx`, `src/components/CloudinaryImagePicker.tsx`, `src/main.tsx` son conocidos y no deben bloquearte
- BEM-like class naming: `.bloque__elemento--modificador`
- Las ramas feature se crean en ambos repos: `feature/mis-tramites`

---

## File Map

### Backend (`BookIt-backend/`)

| Archivo | Acción | Responsabilidad |
|---|---|---|
| `BookIt.API/DTOs/ReservaDto.cs` | Modificar | Agregar `ServiceNombre`, `PrecioMinimo`, `PrecioMaximo`, `VendorNombre`, `VendorEmail`, `VendorTelefono` |
| `BookIt.API/DTOs/VisitaDto.cs` | Modificar | Agregar `VendorNombre`, `VendorEmail`, `VendorTelefono` |
| `BookIt.API/Repositories/ReservaRepository.cs` | Modificar | Agregar `.ThenInclude(s => s.Vendor)` en `GetByUserIdAsync` |
| `BookIt.API/Repositories/VisitaRepository.cs` | Modificar | Agregar `.ThenInclude(s => s.Vendor)` en `GetByUserIdAsync` |
| `BookIt.API/Services/ReservaService.cs` | Modificar | Mapear nuevos campos en `MapToDto` |
| `BookIt.API/Services/VisitaService.cs` | Modificar | Mapear nuevos campos en `MapToDto` |

### Frontend (`BookIt-frontend/`)

| Archivo | Acción | Responsabilidad |
|---|---|---|
| `src/types/service.ts` | Modificar | Extender `ReservationDto` y `VisitDto` con campos de servicio y vendedor |
| `src/services/serviceService.ts` | Modificar | Actualizar `normalizeReservation`, `normalizeVisit`, agregar `getMyReservas`, `getMyVisitas` |
| `src/pages/MisTramitesPage.tsx` | Crear | Página principal con tabs, lista unificada y calculadora |
| `src/App.css` | Modificar | Estilos para la página y tarjetas |
| `src/routes/AppRouter.tsx` | Modificar | Agregar ruta protegida `/mis-tramites` |
| `src/components/layout/UserAvatarMenu.tsx` | Modificar | Habilitar ítem "Mis trámites" (reemplazar span disabled por NavLink) |

---

## Task 1: Crear branches de trabajo

**Files:** (ninguno — solo git)

- [ ] **Step 1: Crear branch en el backend**

Desde `BookIt-backend/`:
```bash
git checkout -b feature/mis-tramites
```
Salida esperada: `Switched to a new branch 'feature/mis-tramites'`

- [ ] **Step 2: Crear branch en el frontend**

Desde `BookIt-frontend/`:
```bash
git checkout -b feature/mis-tramites
```
Salida esperada: `Switched to a new branch 'feature/mis-tramites'`

- [ ] **Step 3: Verificar ambas branches**

```bash
# Backend
cd BookIt-backend && git branch
# Debe mostrar * feature/mis-tramites

# Frontend
cd BookIt-frontend && git branch
# Debe mostrar * feature/mis-tramites
```

---

## Task 2: Backend — Extender DTOs, Repositorios y MapToDto

**Files:**
- Modify: `BookIt-backend/BookIt.API/DTOs/ReservaDto.cs`
- Modify: `BookIt-backend/BookIt.API/DTOs/VisitaDto.cs`
- Modify: `BookIt-backend/BookIt.API/Repositories/ReservaRepository.cs`
- Modify: `BookIt-backend/BookIt.API/Repositories/VisitaRepository.cs`
- Modify: `BookIt-backend/BookIt.API/Services/ReservaService.cs`
- Modify: `BookIt-backend/BookIt.API/Services/VisitaService.cs`

**Interfaces:**
- Produce: `GET /reservas/mis-reservas` y `GET /visitas/mis-visitas` devuelven DTOs con campos de vendedor y precio — usados en Task 3 (frontend normalizers)

- [ ] **Step 1: Extender `ReservaDto.cs`**

El archivo actual tiene estos campos:
```csharp
public class ReservaDto {
    public Guid Id { get; set; }
    public Guid ServiceId { get; set; }
    public Guid UserId { get; set; }
    public bool Confirmada { get; set; }
    public DateTime FechaReservaCliente { get; set; }
    public decimal? MontoAcordado { get; set; }
    public decimal? HorasReservadas { get; set; }
    public UserDto? Usuario { get; set; }
    public List<PagoDto> Pagos { get; set; } = [];
}
```

Agregar los siguientes campos después de `HorasReservadas`:
```csharp
public string? ServiceNombre { get; set; }
public decimal PrecioMinimo { get; set; }
public decimal PrecioMaximo { get; set; }
public string? VendorNombre { get; set; }
public string? VendorEmail { get; set; }
public string? VendorTelefono { get; set; }
```

- [ ] **Step 2: Extender `VisitaDto.cs`**

El archivo actual tiene estos campos (entre otros):
```csharp
public string Estado { get; set; } = string.Empty;
public string? Mensaje { get; set; }
public DateTime FechaCreacion { get; set; }
```

Agregar después de `FechaCreacion`:
```csharp
public string? VendorNombre { get; set; }
public string? VendorEmail { get; set; }
public string? VendorTelefono { get; set; }
```

- [ ] **Step 3: Agregar `.ThenInclude` en `ReservaRepository.GetByUserIdAsync`**

El método actual en `BookIt.API/Repositories/ReservaRepository.cs` (línea 33):
```csharp
public async Task<IEnumerable<Reserva>> GetByUserIdAsync(Guid userId)
{
    return await _context.Reservas
        .Include(r => r.Service)
        .Include(r => r.User)
        .Include(r => r.Pagos)
        .Where(r => r.UserId == userId)
        .OrderByDescending(r => r.FechaReservaCliente)
        .ToListAsync();
}
```

Reemplazar con:
```csharp
public async Task<IEnumerable<Reserva>> GetByUserIdAsync(Guid userId)
{
    return await _context.Reservas
        .Include(r => r.Service).ThenInclude(s => s.Vendor)
        .Include(r => r.User)
        .Include(r => r.Pagos)
        .Where(r => r.UserId == userId)
        .OrderByDescending(r => r.FechaReservaCliente)
        .ToListAsync();
}
```

- [ ] **Step 4: Agregar `.ThenInclude` en `VisitaRepository.GetByUserIdAsync`**

El método actual en `BookIt.API/Repositories/VisitaRepository.cs` (línea 39):
```csharp
public async Task<IEnumerable<Visita>> GetByUserIdAsync(Guid userId)
{
    return await _context.Visitas
        .Include(v => v.Service)
        .Include(v => v.User)
        .Where(v => v.UserId == userId)
        .OrderByDescending(v => v.FechaCreacion)
        .ToListAsync();
}
```

Reemplazar con:
```csharp
public async Task<IEnumerable<Visita>> GetByUserIdAsync(Guid userId)
{
    return await _context.Visitas
        .Include(v => v.Service).ThenInclude(s => s.Vendor)
        .Include(v => v.User)
        .Where(v => v.UserId == userId)
        .OrderByDescending(v => v.FechaCreacion)
        .ToListAsync();
}
```

- [ ] **Step 5: Actualizar `ReservaService.MapToDto`**

El método estático `MapToDto` en `BookIt.API/Services/ReservaService.cs` (línea 263) actualmente es:
```csharp
private static ReservaDto MapToDto(Reserva reserva) => new()
{
    Id = reserva.Id,
    ServiceId = reserva.ServiceId,
    UserId = reserva.UserId,
    Confirmada = reserva.Confirmada,
    FechaReservaCliente = reserva.FechaReservaCliente,
    MontoAcordado = reserva.MontoAcordado,
    HorasReservadas = reserva.HorasReservadas,
    Usuario = reserva.User == null ? null : new UserDto
    {
        Id = reserva.User.Id,
        Nombre = reserva.User.Nombre,
        Telefono = reserva.User.Telefono,
        Email = reserva.User.Email,
        Rol = reserva.User.Rol,
        Activo = reserva.User.Activo,
        FechaCreacion = reserva.User.FechaCreacion,
        FechaActualizacion = reserva.User.FechaActualizacion
    },
    Pagos = (reserva.Pagos ?? []).Select(p => new PagoDto
    {
        Id = p.Id,
        ReservaId = p.ReservaId,
        TipoPago = p.TipoPago,
        Importe = p.Importe,
        FechaPago = p.FechaPago,
        FechaCreacion = p.FechaCreacion,
        FechaActualizacion = p.FechaActualizacion
    }).ToList()
};
```

Reemplazar con (se agregan los 6 campos nuevos después de `HorasReservadas`):
```csharp
private static ReservaDto MapToDto(Reserva reserva) => new()
{
    Id = reserva.Id,
    ServiceId = reserva.ServiceId,
    UserId = reserva.UserId,
    Confirmada = reserva.Confirmada,
    FechaReservaCliente = reserva.FechaReservaCliente,
    MontoAcordado = reserva.MontoAcordado,
    HorasReservadas = reserva.HorasReservadas,
    ServiceNombre = reserva.Service?.Nombre,
    PrecioMinimo = reserva.Service?.PrecioMinimo ?? 0,
    PrecioMaximo = reserva.Service?.PrecioMaximo ?? 0,
    VendorNombre = reserva.Service?.Vendor?.Nombre,
    VendorEmail = reserva.Service?.Vendor?.Email,
    VendorTelefono = reserva.Service?.Vendor?.Telefono,
    Usuario = reserva.User == null ? null : new UserDto
    {
        Id = reserva.User.Id,
        Nombre = reserva.User.Nombre,
        Telefono = reserva.User.Telefono,
        Email = reserva.User.Email,
        Rol = reserva.User.Rol,
        Activo = reserva.User.Activo,
        FechaCreacion = reserva.User.FechaCreacion,
        FechaActualizacion = reserva.User.FechaActualizacion
    },
    Pagos = (reserva.Pagos ?? []).Select(p => new PagoDto
    {
        Id = p.Id,
        ReservaId = p.ReservaId,
        TipoPago = p.TipoPago,
        Importe = p.Importe,
        FechaPago = p.FechaPago,
        FechaCreacion = p.FechaCreacion,
        FechaActualizacion = p.FechaActualizacion
    }).ToList()
};
```

- [ ] **Step 6: Actualizar `VisitaService.MapToDto`**

El método estático en `BookIt.API/Services/VisitaService.cs` (línea 160) actualmente es:
```csharp
private static VisitaDto MapToDto(Visita visita) => new()
{
    Id = visita.Id,
    ServiceId = visita.ServiceId,
    ServiceNombre = visita.Service?.Nombre,
    UserId = visita.UserId,
    UserNombre = visita.User?.Nombre,
    UserEmail = visita.User?.Email,
    FechaHoraSolicitada = visita.FechaHoraSolicitada,
    Estado = visita.Estado,
    Mensaje = visita.Mensaje,
    FechaCreacion = visita.FechaCreacion
};
```

Reemplazar con:
```csharp
private static VisitaDto MapToDto(Visita visita) => new()
{
    Id = visita.Id,
    ServiceId = visita.ServiceId,
    ServiceNombre = visita.Service?.Nombre,
    UserId = visita.UserId,
    UserNombre = visita.User?.Nombre,
    UserEmail = visita.User?.Email,
    FechaHoraSolicitada = visita.FechaHoraSolicitada,
    Estado = visita.Estado,
    Mensaje = visita.Mensaje,
    FechaCreacion = visita.FechaCreacion,
    VendorNombre = visita.Service?.Vendor?.Nombre,
    VendorEmail = visita.Service?.Vendor?.Email,
    VendorTelefono = visita.Service?.Vendor?.Telefono
};
```

- [ ] **Step 7: Compilar el backend**

Desde `BookIt-backend/`:
```bash
dotnet build BookIt.API/BookIt.API.csproj
```

Salida esperada: `Build succeeded.` sin errores (warnings de nullable son OK).

- [ ] **Step 8: Commit**

```bash
cd BookIt-backend
git add BookIt.API/DTOs/ReservaDto.cs BookIt.API/DTOs/VisitaDto.cs
git add BookIt.API/Repositories/ReservaRepository.cs BookIt.API/Repositories/VisitaRepository.cs
git add BookIt.API/Services/ReservaService.cs BookIt.API/Services/VisitaService.cs
git commit -m "feat: extend ReservaDto and VisitaDto with service and vendor info"
```

---

## Task 3: Frontend — Extender tipos, normalizers y agregar funciones de servicio

**Files:**
- Modify: `BookIt-frontend/src/types/service.ts`
- Modify: `BookIt-frontend/src/services/serviceService.ts`

**Interfaces:**
- Produce: `getMyReservas(): Promise<ReservationDto[]>` — usada en Task 4
- Produce: `getMyVisitas(): Promise<VisitDto[]>` — usada en Task 4
- Produce: `ReservationDto` con campos `serviceNombre`, `precioMinimo`, `precioMaximo`, `vendorNombre`, `vendorEmail`, `vendorTelefono` — usados en Task 4
- Produce: `VisitDto` con campos `vendorNombre`, `vendorEmail`, `vendorTelefono` — usados en Task 4

- [ ] **Step 1: Extender `ReservationDto` en `src/types/service.ts`**

Localizar la interfaz `ReservationDto` (línea 75 aproximadamente):
```ts
export interface ReservationDto {
  id: string;
  serviceId: string;
  userId: string;
  confirmada: boolean;
  fechaReservaCliente: string;
  usuario?: ReservationUserDto | null;
  montoAcordado?: number | null;
  horasReservadas?: number | null;
  pagos?: PagoDto[];
}
```

Reemplazar con:
```ts
export interface ReservationDto {
  id: string;
  serviceId: string;
  userId: string;
  confirmada: boolean;
  fechaReservaCliente: string;
  usuario?: ReservationUserDto | null;
  montoAcordado?: number | null;
  horasReservadas?: number | null;
  pagos?: PagoDto[];
  serviceNombre?: string | null;
  precioMinimo?: number | null;
  precioMaximo?: number | null;
  vendorNombre?: string | null;
  vendorEmail?: string | null;
  vendorTelefono?: string | null;
}
```

- [ ] **Step 2: Extender `VisitDto` en `src/types/service.ts`**

Localizar la interfaz `VisitDto` (línea 87 aproximadamente):
```ts
export interface VisitDto {
  id: string;
  serviceId: string;
  serviceNombre?: string | null;
  userId: string;
  userNombre?: string | null;
  userEmail?: string | null;
  fechaHoraSolicitada: string;
  estado: string;
  mensaje?: string | null;
  fechaCreacion: string;
}
```

Reemplazar con:
```ts
export interface VisitDto {
  id: string;
  serviceId: string;
  serviceNombre?: string | null;
  userId: string;
  userNombre?: string | null;
  userEmail?: string | null;
  fechaHoraSolicitada: string;
  estado: string;
  mensaje?: string | null;
  fechaCreacion: string;
  vendorNombre?: string | null;
  vendorEmail?: string | null;
  vendorTelefono?: string | null;
}
```

- [ ] **Step 3: Actualizar `normalizeReservation` en `src/services/serviceService.ts`**

La función `normalizeReservation` (línea 90 aproximadamente) actualmente devuelve:
```ts
const normalizeReservation = (raw: unknown): ReservationDto => {
  const item = (raw ?? {}) as Record<string, unknown>;
  return {
    id: pickString(item.id ?? item.Id),
    serviceId: pickString(item.serviceId ?? item.ServiceId),
    userId: pickString(item.userId ?? item.UserId),
    confirmada: Boolean(item.confirmada ?? item.Confirmada),
    fechaReservaCliente: pickString(item.fechaReservaCliente ?? item.FechaReservaCliente),
    usuario: normalizeReservationUser(item.usuario ?? item.Usuario),
    montoAcordado: pickNullableNumber(item.montoAcordado ?? item.MontoAcordado),
    horasReservadas: pickNullableNumber(item.horasReservadas ?? item.HorasReservadas),
    pagos: getArray(item.pagos ?? item.Pagos).map(normalizePago),
  };
};
```

Reemplazar con:
```ts
const normalizeReservation = (raw: unknown): ReservationDto => {
  const item = (raw ?? {}) as Record<string, unknown>;
  return {
    id: pickString(item.id ?? item.Id),
    serviceId: pickString(item.serviceId ?? item.ServiceId),
    userId: pickString(item.userId ?? item.UserId),
    confirmada: Boolean(item.confirmada ?? item.Confirmada),
    fechaReservaCliente: pickString(item.fechaReservaCliente ?? item.FechaReservaCliente),
    usuario: normalizeReservationUser(item.usuario ?? item.Usuario),
    montoAcordado: pickNullableNumber(item.montoAcordado ?? item.MontoAcordado),
    horasReservadas: pickNullableNumber(item.horasReservadas ?? item.HorasReservadas),
    pagos: getArray(item.pagos ?? item.Pagos).map(normalizePago),
    serviceNombre: pickString(item.serviceNombre ?? item.ServiceNombre) || null,
    precioMinimo: pickNullableNumber(item.precioMinimo ?? item.PrecioMinimo),
    precioMaximo: pickNullableNumber(item.precioMaximo ?? item.PrecioMaximo),
    vendorNombre: pickString(item.vendorNombre ?? item.VendorNombre) || null,
    vendorEmail: pickString(item.vendorEmail ?? item.VendorEmail) || null,
    vendorTelefono: pickString(item.vendorTelefono ?? item.VendorTelefono) || null,
  };
};
```

- [ ] **Step 4: Actualizar `normalizeVisit` en `src/services/serviceService.ts`**

La función `normalizeVisit` (línea 105 aproximadamente) actualmente devuelve:
```ts
const normalizeVisit = (raw: unknown): VisitDto => {
  const item = (raw ?? {}) as Record<string, unknown>;
  return {
    id: pickString(item.id ?? item.Id),
    serviceId: pickString(item.serviceId ?? item.ServiceId),
    serviceNombre: pickString(item.serviceNombre ?? item.ServiceNombre) || null,
    userId: pickString(item.userId ?? item.UserId),
    userNombre: pickString(item.userNombre ?? item.UserNombre) || null,
    userEmail: pickString(item.userEmail ?? item.UserEmail) || null,
    fechaHoraSolicitada: pickString(item.fechaHoraSolicitada ?? item.FechaHoraSolicitada),
    estado: pickString(item.estado ?? item.Estado),
    mensaje: pickString(item.mensaje ?? item.Mensaje) || null,
    fechaCreacion: pickString(item.fechaCreacion ?? item.FechaCreacion),
  };
};
```

Reemplazar con:
```ts
const normalizeVisit = (raw: unknown): VisitDto => {
  const item = (raw ?? {}) as Record<string, unknown>;
  return {
    id: pickString(item.id ?? item.Id),
    serviceId: pickString(item.serviceId ?? item.ServiceId),
    serviceNombre: pickString(item.serviceNombre ?? item.ServiceNombre) || null,
    userId: pickString(item.userId ?? item.UserId),
    userNombre: pickString(item.userNombre ?? item.UserNombre) || null,
    userEmail: pickString(item.userEmail ?? item.UserEmail) || null,
    fechaHoraSolicitada: pickString(item.fechaHoraSolicitada ?? item.FechaHoraSolicitada),
    estado: pickString(item.estado ?? item.Estado),
    mensaje: pickString(item.mensaje ?? item.Mensaje) || null,
    fechaCreacion: pickString(item.fechaCreacion ?? item.FechaCreacion),
    vendorNombre: pickString(item.vendorNombre ?? item.VendorNombre) || null,
    vendorEmail: pickString(item.vendorEmail ?? item.VendorEmail) || null,
    vendorTelefono: pickString(item.vendorTelefono ?? item.VendorTelefono) || null,
  };
};
```

- [ ] **Step 5: Agregar `getMyReservas` y `getMyVisitas` en `src/services/serviceService.ts`**

Al final del archivo (después de la última función exportada), agregar:
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

- [ ] **Step 6: Verificar TypeScript**

```bash
cd BookIt-frontend
npx tsc --noEmit
```

Salida esperada: sin output nuevo (los 4-5 errores preexistentes en `_app.tsx`, `CloudinaryImagePicker.tsx`, `main.tsx` son OK y no deben aumentar).

- [ ] **Step 7: Commit**

```bash
cd BookIt-frontend
git add src/types/service.ts src/services/serviceService.ts
git commit -m "feat: extend ReservationDto and VisitDto types, add getMyReservas/getMyVisitas"
```

---

## Task 4: Frontend — Crear `MisTramitesPage.tsx` y agregar CSS

**Files:**
- Create: `BookIt-frontend/src/pages/MisTramitesPage.tsx`
- Modify: `BookIt-frontend/src/App.css`

**Interfaces:**
- Consume: `getMyReservas(): Promise<ReservationDto[]>` de `../services/serviceService` (producida en Task 3)
- Consume: `getMyVisitas(): Promise<VisitDto[]>` de `../services/serviceService` (producida en Task 3)
- Consume: `ReservationDto`, `VisitDto` de `../types/service` (extendidos en Task 3)
- Produce: `export default MisTramitesPage` — componente React sin props, importado en Task 5

- [ ] **Step 1: Crear `src/pages/MisTramitesPage.tsx`**

Crear el archivo con el siguiente contenido completo:

```tsx
import { useEffect, useMemo, useState } from 'react';
import { getMyReservas, getMyVisitas } from '../services/serviceService';
import type { ReservationDto, VisitDto } from '../types/service';

type TramiteItem =
  | { tipo: 'reserva'; data: ReservationDto; fecha: Date }
  | { tipo: 'visita'; data: VisitDto; fecha: Date };

type TabId = 'todo' | 'reservas' | 'visitas';

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
}: {
  data: ReservationDto;
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

const MisTramitesPage = () => {
  const [reservas, setReservas] = useState<ReservationDto[]>([]);
  const [visitas, setVisitas] = useState<VisitDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TabId>('todo');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [priceChoice, setPriceChoice] = useState<Record<string, 'min' | 'max'>>({});

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        const [fetchedReservas, fetchedVisitas] = await Promise.all([
          getMyReservas(),
          getMyVisitas(),
        ]);
        setReservas(fetchedReservas);
        setVisitas(fetchedVisitas);
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
              {(['todo', 'reservas', 'visitas'] as const).map(tab => (
                <button
                  key={tab}
                  type="button"
                  className={`mis-tramites__tab${activeTab === tab ? ' is-active' : ''}`}
                  onClick={() => setActiveTab(tab)}
                >
                  {tab === 'todo' ? 'Todo' : tab === 'reservas' ? 'Reservas' : 'Visitas'}
                </button>
              ))}
            </nav>

            {filteredItems.length === 0 ? (
              <p className="mis-tramites__empty">{emptyMessage}</p>
            ) : (
              <ul className="mis-tramites__list" role="list">
                {filteredItems.map(item =>
                  item.tipo === 'reserva' ? (
                    <li key={`r-${item.data.id}`}>
                      <ReservaCard data={item.data} />
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
              <section className="mis-tramites__calculator">
                <h2 className="calculator__title">Calculadora de presupuesto</h2>
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
              </section>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default MisTramitesPage;
```

- [ ] **Step 2: Agregar CSS en `src/App.css`**

Agregar el siguiente bloque al final del archivo (antes del último comentario de cierre si lo hubiera, o simplemente al final):

```css
/* ===== Mis Trámites ===== */

.mis-tramites {
  min-height: 60vh;
  padding: 3rem 0 5rem;
}

.mis-tramites__shell {
  display: flex;
  flex-direction: column;
  gap: 2rem;
}

.mis-tramites__header h1 {
  font-size: 2rem;
  font-weight: 800;
  letter-spacing: -0.03em;
  color: var(--text);
  margin: 0 0 0.35rem;
}

.mis-tramites__subtitle {
  color: var(--text-muted);
  margin: 0;
}

.mis-tramites__state {
  color: var(--text-muted);
  text-align: center;
  padding: 3rem 0;
}

.mis-tramites__state--error {
  color: #dc2626;
}

.mis-tramites__tabs {
  display: flex;
  gap: 0.5rem;
  border-bottom: 1px solid var(--border);
  padding-bottom: 0;
}

.mis-tramites__tab {
  padding: 0.6rem 1.2rem;
  border: 0;
  border-bottom: 2px solid transparent;
  background: transparent;
  color: var(--text-muted);
  font-weight: 600;
  font-size: 0.95rem;
  cursor: pointer;
  border-radius: 0.5rem 0.5rem 0 0;
  transition: color 150ms ease, border-color 150ms ease;
  margin-bottom: -1px;
}

.mis-tramites__tab:hover {
  color: var(--text);
}

.mis-tramites__tab.is-active {
  color: var(--primary);
  border-bottom-color: var(--primary);
}

.mis-tramites__empty {
  color: var(--text-muted);
  text-align: center;
  padding: 3rem 0;
}

.mis-tramites__list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

/* Tramite cards */

.tramite-card {
  background: #fff;
  border: 1px solid var(--border);
  border-radius: 1rem;
  padding: 1.25rem 1.4rem;
  box-shadow: var(--shadow-soft);
  display: flex;
  flex-direction: column;
  gap: 0.6rem;
}

.tramite-card__badges {
  display: flex;
  flex-wrap: wrap;
  gap: 0.4rem;
}

.tramite-card__badge {
  display: inline-block;
  padding: 0.2rem 0.65rem;
  border-radius: 999px;
  font-size: 0.78rem;
  font-weight: 700;
  letter-spacing: 0.01em;
}

.tramite-card__badge--reserva {
  background: var(--primary-soft);
  color: var(--primary);
}

.tramite-card__badge--visita {
  background: rgba(255, 184, 108, 0.18);
  color: #c07000;
}

.tramite-card__badge--pendiente {
  background: rgba(120, 87, 167, 0.1);
  color: var(--text-muted);
}

.tramite-card__badge--confirmada {
  background: rgba(22, 163, 74, 0.1);
  color: #16a34a;
}

.tramite-card__badge--pago-seña {
  background: rgba(234, 179, 8, 0.12);
  color: #a16207;
}

.tramite-card__badge--pago-parcial {
  background: rgba(37, 99, 235, 0.1);
  color: #1d4ed8;
}

.tramite-card__badge--pago-total {
  background: rgba(22, 163, 74, 0.12);
  color: #15803d;
}

.tramite-card__title {
  font-size: 1.1rem;
  font-weight: 700;
  color: var(--text);
  margin: 0;
}

.tramite-card__date {
  color: var(--text-muted);
  font-size: 0.9rem;
  margin: 0;
}

.tramite-card__monto {
  color: var(--text);
  font-weight: 600;
  font-size: 0.95rem;
  margin: 0;
}

.tramite-card__vendor {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  margin-top: 0.2rem;
  padding-top: 0.6rem;
  border-top: 1px solid var(--border);
}

.tramite-card__vendor-row {
  font-size: 0.88rem;
  color: var(--text-muted);
}

/* Calculator */

.mis-tramites__calculator {
  background: #fff;
  border: 1px solid var(--border);
  border-radius: 1rem;
  padding: 1.5rem 1.5rem 1.75rem;
  box-shadow: var(--shadow-soft);
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.calculator__title {
  font-size: 1.2rem;
  font-weight: 800;
  color: var(--text);
  margin: 0;
}

.calculator__subtitle {
  color: var(--text-muted);
  font-size: 0.9rem;
  margin: 0;
}

.calculator__table-wrapper {
  overflow-x: auto;
}

.calculator__table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.92rem;
}

.calculator__table th {
  text-align: left;
  padding: 0.5rem 0.75rem;
  color: var(--text-muted);
  font-weight: 600;
  border-bottom: 1px solid var(--border);
}

.calculator__table td {
  padding: 0.75rem;
  border-bottom: 1px solid var(--border);
  vertical-align: middle;
}

.calculator__table tr:last-child td {
  border-bottom: 0;
}

.calculator__row--selected td {
  background: var(--primary-soft);
}

.calculator__service-cell {
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
}

.calculator__service-name {
  font-weight: 600;
  color: var(--text);
}

.calculator__service-date {
  font-size: 0.82rem;
  color: var(--text-muted);
}

.calculator__amount-cell {
  min-width: 180px;
}

.calculator__fixed-amount {
  font-weight: 700;
  color: var(--text);
}

.calculator__radio-group {
  display: flex;
  flex-direction: column;
  gap: 0.3rem;
}

.calculator__radio-label {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  font-size: 0.88rem;
  cursor: pointer;
  color: var(--text);
}

.calculator__total {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-top: 1rem;
  border-top: 2px solid var(--border-strong);
  font-weight: 700;
  font-size: 1rem;
  color: var(--text);
}

.calculator__total-amount {
  font-size: 1.5rem;
  font-weight: 800;
  color: var(--primary);
  letter-spacing: -0.02em;
}
```

- [ ] **Step 3: Verificar TypeScript**

```bash
cd BookIt-frontend
npx tsc --noEmit
```

Salida esperada: sin errores nuevos.

- [ ] **Step 4: Commit**

```bash
cd BookIt-frontend
git add src/pages/MisTramitesPage.tsx src/App.css
git commit -m "feat: add MisTramitesPage with tabbed list and budget calculator"
```

---

## Task 5: Frontend — Agregar ruta y habilitar ítem de navegación

**Files:**
- Modify: `BookIt-frontend/src/routes/AppRouter.tsx`
- Modify: `BookIt-frontend/src/components/layout/UserAvatarMenu.tsx`

**Interfaces:**
- Consume: `MisTramitesPage` de `../pages/MisTramitesPage` (producido en Task 4)

- [ ] **Step 1: Agregar ruta en `AppRouter.tsx`**

Agregar el import de `MisTramitesPage` al inicio del archivo junto a los demás imports de páginas. Actualmente la última importación de página es `ServicesListPage`. Agregar:
```ts
import MisTramitesPage from '../pages/MisTramitesPage';
```

Luego, dentro del bloque `<Routes>`, después de la ruta `/profile`:
```tsx
<Route
  path="/profile"
  element={
    <ProtectedRoute>
      <ProfilePage />
    </ProtectedRoute>
  }
/>
```

Agregar inmediatamente después:
```tsx
<Route
  path="/mis-tramites"
  element={
    <ProtectedRoute>
      <MisTramitesPage />
    </ProtectedRoute>
  }
/>
```

- [ ] **Step 2: Habilitar ítem "Mis trámites" en `UserAvatarMenu.tsx`**

Localizar el elemento disabled actual (aproximadamente línea 154 en el archivo creado durante el feature anterior):
```tsx
<span className="app-user-menu__item--disabled" aria-disabled="true">
  Mis trámites
  <span className="app-user-menu__item-badge">(próximamente)</span>
</span>
```

Reemplazar con:
```tsx
<NavLink
  to="/mis-tramites"
  className="app-user-menu__item"
  role="menuitem"
  onClick={close}
>
  Mis trámites
</NavLink>
```

- [ ] **Step 3: Verificar TypeScript**

```bash
cd BookIt-frontend
npx tsc --noEmit
```

Salida esperada: sin errores nuevos.

- [ ] **Step 4: Commit**

```bash
cd BookIt-frontend
git add src/routes/AppRouter.tsx src/components/layout/UserAvatarMenu.tsx
git commit -m "feat: add /mis-tramites route and enable nav link in user menu"
```

---

## Task 6: Verificación manual en browser

- [ ] **Step 1: Levantar el backend**

```bash
cd BookIt-backend
dotnet run --project BookIt.API/BookIt.API.csproj
```

- [ ] **Step 2: Levantar el frontend**

```bash
cd BookIt-frontend
npm run dev
```

Abrir `http://localhost:3000` (o el puerto que muestre el dev server).

- [ ] **Step 3: Verificar navegación**

Iniciar sesión con un usuario cliente. Abrir el menú de avatar (círculo en el header). El ítem "Mis trámites" debe aparecer como enlace habilitado, sin badge "(próximamente)". Hacer clic → debe navegar a `/mis-tramites`.

- [ ] **Step 4: Verificar estado vacío**

Si el usuario no tiene reservas ni visitas, verificar que el tab "Todo" muestra el mensaje "Todavía no tenés trámites. Explorá los servicios disponibles." y que los tabs "Reservas" y "Visitas" muestran sus mensajes correspondientes.

- [ ] **Step 5: Verificar lista con datos**

Con un usuario que tenga reservas y/o visitas creadas:
- Las tarjetas de reserva muestran badge violeta "Reserva", badge de estado (Pendiente/Confirmada), nombre del servicio, fecha y datos del vendedor.
- Las tarjetas de visita muestran badge naranja "Visita", badge de estado, nombre del servicio, fecha y datos del vendedor.
- Las tarjetas aparecen ordenadas de más reciente a más antiguo.
- Las reservas confirmadas con `montoAcordado` muestran "Monto acordado: $ X".
- Las reservas confirmadas con pagos muestran el badge de pago correspondiente.

- [ ] **Step 6: Verificar tabs**

- Tab "Todo" (activo por defecto): muestra reservas y visitas intercaladas por fecha.
- Tab "Reservas": muestra solo tarjetas de reserva.
- Tab "Visitas": muestra solo tarjetas de visita.
- El tab activo tiene borde violeta en la parte inferior.

- [ ] **Step 7: Verificar calculadora**

Si el usuario tiene al menos una reserva:
- La sección calculadora aparece debajo de la lista, con el título "Calculadora de presupuesto".
- Todas las reservas están marcadas con checkbox por defecto.
- Las reservas pendientes muestran radio "Mín $X / Máx $Y".
- Las reservas confirmadas con `montoAcordado` muestran el monto fijo (sin radio).
- El total se actualiza al cambiar checkboxes o selecciones de radio.
- Desmarcar todas las reservas → total muestra $ 0.

- [ ] **Step 8: Verificar que no hay regresiones**

Navegar a otras páginas (Inicio, Servicios, Perfil, Panel Dueño si aplica) y verificar que el header y el menú de usuario siguen funcionando correctamente.
