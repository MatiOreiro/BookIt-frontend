# Reordenar imágenes del servicio + lightbox en el detalle

## Contexto

Se acaba de arreglar un CSS corrupto que impedía ver correctamente la grilla de previews al subir varias imágenes a un servicio (commit `a4ac5a6` en `fix/service-gallery-multi-image-css`, ya mergeado a `main`). Con eso resuelto, quedan dos limitaciones:

1. El orden de las imágenes queda fijo según el orden de subida — el dueño no puede reordenarlas después.
2. En el detalle del servicio (`ServiceDetailPage`, dentro de `src/routes/AppRouter.tsx`), solo la primera imagen (`imagenes[0]`) se ve en grande; las miniaturas de abajo no son clickeables.

Ambas cosas comparten el mismo dato subyacente: `service.imagenes: string[]`, que ya viaja completo end-to-end (backend `ServiceDto.Imagenes: List<string>` → frontend `normalizeService` → `service.imagenes`). Además `imagenes[0]` también es la portada usada en `ServicesListPage` (`service-card__image`), así que reordenar también le da al dueño control sobre la foto de portada del listado.

## Objetivo

1. Permitir reordenar las imágenes en el picker de alta/edición de servicio (`CloudinaryImagePicker.tsx`).
2. Permitir hacer click en la imagen principal o en cualquier miniatura del detalle del servicio para abrir un lightbox (visor a pantalla completa) navegable entre todas las imágenes.

## Parte 1: Reordenar imágenes

**Dónde:** `src/components/CloudinaryImagePicker.tsx`, en la grilla de previews (`cloudinary-image-picker__grid` / `cloudinary-image-picker__item`), usada tanto para crear como editar un servicio vía `RegisterServicePage.tsx`.

**Mecanismo:** botones, no drag-and-drop (no hay librería de DnD instalada en el proyecto y no se agrega una para esto). Cada `cloudinary-image-picker__item` suma dos botones pequeños superpuestos a la imagen: `←` (mover a la posición anterior) y `→` (mover a la posición siguiente).

- El primer ítem del array no muestra `←`.
- El último ítem del array no muestra `→`.
- Al clickear, se intercambian de posición el elemento actual y su vecino inmediato dentro del array `imageUrls`, y se llama a `onImageUrlsChange` con el nuevo array — mismo callback que ya usan las subidas y el botón "Quitar", así que el guardado (`Images: serviceImageUrls` en `RegisterServicePage.tsx`) no cambia.
- No hay cambios de backend: el orden es simplemente la posición dentro del array JSON que ya se persiste tal cual.
- Los botones de mover se deshabilitan mientras `disabled` (prop existente del componente) sea `true`, igual que "Quitar".

**No aplica** cuando `multiple` es `false` (imagen única, ej. si en el futuro se reusara el picker para foto de perfil) — con 0 o 1 imagen no se muestran botones de mover (no hay nada que reordenar).

## Parte 2: Lightbox en el detalle del servicio

**Dónde:** `ServiceDetailPage` dentro de `src/routes/AppRouter.tsx` — el bloque `service-detail__gallery` (imagen principal `service-detail__main-image` + miniaturas `service-detail__thumbs`).

**Disparador:** click en la imagen principal, o click en cualquier miniatura. Ambas quedan con `role="button"`/`tabIndex`/manejo de Enter-Espacio para accesibilidad de teclado, igual que el patrón ya usado en las tarjetas de "Próximas actividades" del panel de dueño.

**Estado:** un nuevo estado local en `ServiceDetailPage`, `lightboxIndex: number | null` — `null` significa cerrado; un número es el índice dentro de `service.imagenes` que se está mostrando. Click en la imagen principal abre con índice `0`; click en una miniatura abre con su índice real dentro del array completo (no solo dentro del slice de miniaturas mostradas).

**Contenido del modal:**
- Overlay a pantalla completa (mismo patrón visual que los modales existentes de `service-owner-dashboard__modal-overlay`, adaptado con su propia clase `service-detail__lightbox-overlay` ya que es una página distinta).
- Imagen actual (`service.imagenes[lightboxIndex]`) centrada, con `object-fit: contain` (a diferencia de la miniatura/portada que usan `cover`) para no recortar la imagen en la vista ampliada.
- Flecha `←` y `→` para navegar; deshabilitadas/ocultas si solo hay 1 imagen. La navegación es circular (desde la última pasa a la primera y viceversa) para no tener que deshabilitar bordes.
- Contador de texto, ej. "2 / 5", visible solo si hay más de 1 imagen.
- Botón "✕" para cerrar.
- Cierre también con tecla `Escape` y con click en el overlay (fuera de la imagen).
- Navegación también con flechas de teclado (`ArrowLeft` / `ArrowRight`) mientras el lightbox está abierto.

**Fuera de alcance:** zoom/pan dentro de la imagen ampliada, swipe táctil, precarga de imágenes adyacentes, miniaturas dentro del propio lightbox — el lightbox es solo imagen + flechas + contador + cierre.

## Fuera de alcance (general)

- No se modifica el backend (el orden y el conjunto de imágenes ya son un array persistido tal cual).
- No se agrega ninguna librería nueva (ni drag-and-drop ni de lightbox) — todo se construye con los mismos patrones ya usados en el proyecto (botones, modales con overlay, manejo de teclado).
- No se toca `ServicesListPage` más allá del efecto natural de que `imagenes[0]` cambie según el nuevo orden.
