# Service Gallery Reorder + Lightbox Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let the vendor reorder a service's uploaded images with move buttons in the upload picker, and let visitors click any image in a service's detail page to open it in a full-screen, navigable lightbox.

**Architecture:** Both features operate purely on the existing `imagenes: string[]` / `imageUrls: string[]` arrays that already travel end-to-end (backend `ServiceDto.Imagenes` → `normalizeService` → `service.imagenes`) — no backend or type changes. Reordering swaps adjacent array entries via the picker's existing `onImageUrlsChange` callback. The lightbox is a new local component inside `src/routes/AppRouter.tsx` (co-located with `ServiceDetailPage`, following that file's existing pattern of page-scoped components), opened by clicking the main image or a thumbnail, holding its own `currentIndex` state seeded from the clicked image's real index in the full array.

**Tech Stack:** React 18, TypeScript, CSS in `src/App.css`. No new dependencies (no drag-and-drop library, no lightbox library).

## Global Constraints

- No backend changes — image order is just array position in the already-persisted `Images`/`Imagenes` list
- No new npm dependencies
- Reorder UI: buttons only (←/→ per thumbnail), not drag-and-drop
- Reorder buttons only render when `multiple` is true and there are 2+ images; the first image never shows `←`, the last never shows `→` (hidden, not just disabled)
- Lightbox opens on click of the main image OR any thumbnail; navigation is circular (wraps from last to first and back); closes via ✕ button, `Escape` key, or click on the overlay backdrop (not on the image itself); supports `ArrowLeft`/`ArrowRight` keyboard navigation while open
- Lightbox image uses `object-fit: contain` (not `cover`) so nothing is cropped
- Out of scope: zoom/pan, touch swipe, image preloading, thumbnail strip inside the lightbox itself
- Spec: `BookIt-frontend/docs/superpowers/specs/2026-07-09-service-gallery-reorder-and-lightbox-design.md`

---

## File Map

| Acción | Archivo | Responsabilidad |
|--------|---------|-----------------|
| Modificar | `BookIt-frontend/src/components/CloudinaryImagePicker.tsx` | Botones ←/→ para reordenar imágenes en el picker de alta/edición |
| Modificar | `BookIt-frontend/src/App.css` | Estilos de los botones de reordenar + estilos del lightbox + `cursor: pointer` en imagen principal/miniaturas |
| Modificar | `BookIt-frontend/src/routes/AppRouter.tsx` | Componente `ServiceGalleryLightbox` + hacerlo clickeable desde `ServiceDetailPage` |

---

## Task 1: Botones de reordenar en `CloudinaryImagePicker.tsx`

**Files:**
- Modificar: `BookIt-frontend/src/components/CloudinaryImagePicker.tsx` (reemplazo completo del archivo)

**Interfaces:**
- No cambia la interfaz pública del componente (`CloudinaryImagePickerProps` se mantiene igual)
- Produce (interno, no exportado): `moveImage(index: number, direction: -1 | 1): void`

- [ ] **Step 1: Reemplazar el contenido completo de `CloudinaryImagePicker.tsx`**

Reemplazar el archivo completo con:

```tsx
import { useRef } from 'react';
import { CldUploadButton, type CloudinaryUploadWidgetResults } from 'next-cloudinary';

interface CloudinaryImagePickerProps {
  label: string;
  hint?: string;
  imageUrls: string[];
  onImageUrlsChange: (imageUrls: string[]) => void;
  multiple?: boolean;
  disabled?: boolean;
}

const uploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET;

const extractSecureUrl = (results: CloudinaryUploadWidgetResults): string | null => {
  const info = results.info;
  if (!info || typeof info === 'string') return null;
  return info.secure_url ?? null;
};

const CloudinaryImagePicker = ({
  label,
  hint,
  imageUrls,
  onImageUrlsChange,
  multiple = false,
  disabled = false,
}: CloudinaryImagePickerProps) => {
  // Ref so onSuccess always sees the latest imageUrls even when multiple
  // uploads fire before React re-renders (stale closure fix).
  const imageUrlsRef = useRef(imageUrls);
  imageUrlsRef.current = imageUrls;

  const handleSuccess = (results: CloudinaryUploadWidgetResults) => {
    const uploadedUrl = extractSecureUrl(results);
    if (!uploadedUrl) return;

    if (multiple) {
      if (imageUrlsRef.current.includes(uploadedUrl)) return;
      onImageUrlsChange([...imageUrlsRef.current, uploadedUrl]);
      return;
    }

    onImageUrlsChange([uploadedUrl]);
  };

  const handleRemove = (imageUrl: string) => {
    onImageUrlsChange(imageUrls.filter((url) => url !== imageUrl));
  };

  const moveImage = (index: number, direction: -1 | 1) => {
    const targetIndex = index + direction;
    if (targetIndex < 0 || targetIndex >= imageUrls.length) return;

    const reordered = [...imageUrls];
    [reordered[index], reordered[targetIndex]] = [reordered[targetIndex], reordered[index]];
    onImageUrlsChange(reordered);
  };

  const hasUploadConfig = Boolean(uploadPreset);
  const canUpload = hasUploadConfig && !disabled;
  const canReorder = multiple && imageUrls.length > 1;

  return (
    <div className="cloudinary-image-picker">
      <div className="cloudinary-image-picker__header">
        <label className="cloudinary-image-picker__label">{label}</label>

        {hasUploadConfig ? (
          <CldUploadButton
            className="btn-secondary cloudinary-image-picker__upload"
            uploadPreset={uploadPreset ?? ''}
            options={{ multiple }}
            onSuccess={handleSuccess}
            disabled={!canUpload}
          >
            {multiple ? 'Subir imágenes' : 'Subir imagen'}
          </CldUploadButton>
        ) : (
          <span className="cloudinary-image-picker__missing-config">
            Configurá Cloudinary para habilitar la subida.
          </span>
        )}
      </div>

      {hint && <span className="form-group__hint">{hint}</span>}

      {imageUrls.length > 0 ? (
        <div className="service-image-preview-grid cloudinary-image-picker__grid" aria-label={label}>
          {imageUrls.map((imageUrl, index) => (
            <div key={imageUrl} className="cloudinary-image-picker__item">
              <img src={imageUrl} alt={label} className="service-image-preview-grid__item" />

              {canReorder && (
                <div className="cloudinary-image-picker__move-buttons">
                  {index > 0 && (
                    <button
                      type="button"
                      className="cloudinary-image-picker__move cloudinary-image-picker__move--left"
                      onClick={() => moveImage(index, -1)}
                      disabled={disabled}
                      aria-label="Mover imagen a la izquierda"
                    >
                      ←
                    </button>
                  )}
                  {index < imageUrls.length - 1 && (
                    <button
                      type="button"
                      className="cloudinary-image-picker__move cloudinary-image-picker__move--right"
                      onClick={() => moveImage(index, 1)}
                      disabled={disabled}
                      aria-label="Mover imagen a la derecha"
                    >
                      →
                    </button>
                  )}
                </div>
              )}

              <button
                type="button"
                className="cloudinary-image-picker__remove btn-secondary"
                onClick={() => handleRemove(imageUrl)}
                disabled={disabled}
              >
                Quitar
              </button>
            </div>
          ))}
        </div>
      ) : (
        <span className="form-group__hint cloudinary-image-picker__empty">
          Todavía no agregaste imágenes.
        </span>
      )}

      {!hasUploadConfig && (
        <span className="form-group__hint cloudinary-image-picker__config-warning">
          Falta la variable NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET.
        </span>
      )}
    </div>
  );
};

export default CloudinaryImagePicker;
```

- [ ] **Step 2: Verificar que TypeScript no reporta errores**

```bash
cd BookIt-frontend && npx tsc --noEmit
```

Salida esperada: sin errores nuevos (los mismos preexistentes de siempre en `pages/_app.tsx`, `src/main.tsx`, y la ya conocida `CldUploadButton`'s `disabled` prop en este mismo archivo — ese error preexistente en la línea del `CldUploadButton` no cambia con este edit).

- [ ] **Step 3: Verificar lint**

```bash
cd BookIt-frontend && npm run lint
```

Salida esperada: sin errores nuevos en `CloudinaryImagePicker.tsx` más allá de los que ya existían antes de este cambio.

- [ ] **Step 4: Commit**

```bash
git -C BookIt-frontend add src/components/CloudinaryImagePicker.tsx
git -C BookIt-frontend commit -m "feat: add move left/right buttons to reorder service images in the picker"
```

---

## Task 2: Estilos de los botones de reordenar en `App.css`

**Files:**
- Modificar: `BookIt-frontend/src/App.css`

**Interfaces:**
- Produce: clases `.cloudinary-image-picker__move-buttons`, `.cloudinary-image-picker__move`, `.cloudinary-image-picker__move--left`, `.cloudinary-image-picker__move--right`

- [ ] **Step 1: Agregar los estilos justo después de `.cloudinary-image-picker__item`**

Buscar en `BookIt-frontend/src/App.css` el bloque:

```css
.cloudinary-image-picker__item {
  position: relative;
}
```

Y agregar inmediatamente después:

```css

.cloudinary-image-picker__move-buttons {
  position: absolute;
  inset: 0.5rem 0.5rem auto 0.5rem;
  display: grid;
  grid-template-columns: 1fr 1fr;
  pointer-events: none;
}

.cloudinary-image-picker__move {
  pointer-events: auto;
  border: 0;
  border-radius: 999px;
  width: 1.75rem;
  height: 1.75rem;
  display: inline-grid;
  place-items: center;
  background: rgba(15, 23, 42, 0.55);
  color: #fff;
  font-size: 0.9rem;
  cursor: pointer;
}

.cloudinary-image-picker__move:hover:not(:disabled) {
  background: rgba(15, 23, 42, 0.75);
}

.cloudinary-image-picker__move:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.cloudinary-image-picker__move--left {
  grid-column: 1;
  justify-self: start;
}

.cloudinary-image-picker__move--right {
  grid-column: 2;
  justify-self: end;
}
```

- [ ] **Step 2: Commit**

```bash
git -C BookIt-frontend add src/App.css
git -C BookIt-frontend commit -m "feat: add styles for image picker reorder buttons"
```

---

## Task 3: Lightbox clickeable en `ServiceDetailPage` (`AppRouter.tsx`)

**Files:**
- Modificar: `BookIt-frontend/src/routes/AppRouter.tsx`

**Interfaces:**
- Consume: `useState`, `useEffect` de `react` (ya importados en el archivo)
- Produce (interno, no exportado): componente `ServiceGalleryLightbox({ images, initialIndex, serviceName, onClose })`

- [ ] **Step 1: Agregar el componente `ServiceGalleryLightbox` antes de `const ServiceDetailPage = () => {`**

Buscar en `BookIt-frontend/src/routes/AppRouter.tsx` la línea:

```tsx
const ServiceDetailPage = () => {
```

E insertar inmediatamente antes (dejando la línea de arriba intacta):

```tsx
interface ServiceGalleryLightboxProps {
  images: string[];
  initialIndex: number;
  serviceName: string;
  onClose: () => void;
}

const ServiceGalleryLightbox = ({ images, initialIndex, serviceName, onClose }: ServiceGalleryLightboxProps) => {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const hasMultiple = images.length > 1;

  const goToPrevious = () => {
    setCurrentIndex((current) => (current === 0 ? images.length - 1 : current - 1));
  };

  const goToNext = () => {
    setCurrentIndex((current) => (current === images.length - 1 ? 0 : current + 1));
  };

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      } else if (event.key === 'ArrowLeft') {
        setCurrentIndex((current) => (current === 0 ? images.length - 1 : current - 1));
      } else if (event.key === 'ArrowRight') {
        setCurrentIndex((current) => (current === images.length - 1 ? 0 : current + 1));
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [images.length, onClose]);

  return (
    <div
      className="service-detail__lightbox-overlay"
      role="dialog"
      aria-modal="true"
      aria-label={`Galería de ${serviceName}`}
      onClick={onClose}
    >
      <button type="button" className="service-detail__lightbox-close" onClick={onClose} aria-label="Cerrar">
        ✕
      </button>

      {hasMultiple && (
        <button
          type="button"
          className="service-detail__lightbox-nav service-detail__lightbox-nav--prev"
          onClick={(event) => {
            event.stopPropagation();
            goToPrevious();
          }}
          aria-label="Imagen anterior"
        >
          ←
        </button>
      )}

      <img
        src={images[currentIndex]}
        alt={`${serviceName} ${currentIndex + 1}`}
        className="service-detail__lightbox-image"
        onClick={(event) => event.stopPropagation()}
      />

      {hasMultiple && (
        <button
          type="button"
          className="service-detail__lightbox-nav service-detail__lightbox-nav--next"
          onClick={(event) => {
            event.stopPropagation();
            goToNext();
          }}
          aria-label="Imagen siguiente"
        >
          →
        </button>
      )}

      {hasMultiple && (
        <span className="service-detail__lightbox-counter">
          {currentIndex + 1} / {images.length}
        </span>
      )}
    </div>
  );
};

const ServiceDetailPage = () => {
```

- [ ] **Step 2: Agregar el estado del lightbox dentro de `ServiceDetailPage`**

Buscar en `BookIt-frontend/src/routes/AppRouter.tsx`:

```tsx
  const [service, setService] = useState<Service | null>(serviceFromState ?? null);
  const [loading, setLoading] = useState(!serviceFromState);
  const [error, setError] = useState<string | null>(null);
```

Reemplazar por:

```tsx
  const [service, setService] = useState<Service | null>(serviceFromState ?? null);
  const [loading, setLoading] = useState(!serviceFromState);
  const [error, setError] = useState<string | null>(null);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
```

- [ ] **Step 3: Hacer clickeable la imagen principal y las miniaturas**

Buscar el bloque:

```tsx
                {getServiceGalleryImages(service).length === 0 ? (
                  <div className="service-detail__gallery-empty service-detail__gallery-empty--full">
                    <span aria-hidden="true">📷</span>
                    <p>No tiene imágenes cargadas aún.</p>
                  </div>
                ) : (
                  <>
                    <div className="service-detail__main-image">
                      <img src={getServiceMainImage(service) ?? undefined} alt={service.nombre} />
                      <div className="service-detail__main-image-overlay">
                        <span className="service-detail__eyebrow">{service.tipoServicio || 'Salón para eventos'}</span>
                        <h1>{service.nombre}</h1>
                        <p>{service.ubicacion || 'Ubicación no especificada'}</p>
                      </div>
                    </div>

                    {getServiceGalleryImages(service).length > 1 && (
                      <div className="service-detail__thumbs" aria-label="Galería del servicio">
                        {getServiceGalleryImages(service)
                          .slice(1, 6)
                          .map((imageUrl, index) => (
                            <div key={imageUrl} className={`service-detail__thumb service-detail__thumb--${index + 1}`}>
                              <img src={imageUrl} alt={`${service.nombre} ${index + 2}`} />
                            </div>
                          ))}
                      </div>
                    )}
                  </>
                )}
```

Reemplazar por:

```tsx
                {getServiceGalleryImages(service).length === 0 ? (
                  <div className="service-detail__gallery-empty service-detail__gallery-empty--full">
                    <span aria-hidden="true">📷</span>
                    <p>No tiene imágenes cargadas aún.</p>
                  </div>
                ) : (
                  <>
                    <div
                      className="service-detail__main-image"
                      role="button"
                      tabIndex={0}
                      onClick={() => setLightboxIndex(0)}
                      onKeyDown={(event) => {
                        if (event.key === 'Enter' || event.key === ' ') {
                          event.preventDefault();
                          setLightboxIndex(0);
                        }
                      }}
                    >
                      <img src={getServiceMainImage(service) ?? undefined} alt={service.nombre} />
                      <div className="service-detail__main-image-overlay">
                        <span className="service-detail__eyebrow">{service.tipoServicio || 'Salón para eventos'}</span>
                        <h1>{service.nombre}</h1>
                        <p>{service.ubicacion || 'Ubicación no especificada'}</p>
                      </div>
                    </div>

                    {getServiceGalleryImages(service).length > 1 && (
                      <div className="service-detail__thumbs" aria-label="Galería del servicio">
                        {getServiceGalleryImages(service)
                          .slice(1, 6)
                          .map((imageUrl, sliceIndex) => {
                            const fullIndex = sliceIndex + 1;
                            return (
                              <div
                                key={imageUrl}
                                className={`service-detail__thumb service-detail__thumb--${sliceIndex + 1}`}
                                role="button"
                                tabIndex={0}
                                onClick={() => setLightboxIndex(fullIndex)}
                                onKeyDown={(event) => {
                                  if (event.key === 'Enter' || event.key === ' ') {
                                    event.preventDefault();
                                    setLightboxIndex(fullIndex);
                                  }
                                }}
                              >
                                <img src={imageUrl} alt={`${service.nombre} ${sliceIndex + 2}`} />
                              </div>
                            );
                          })}
                      </div>
                    )}
                  </>
                )}

                {lightboxIndex !== null && (
                  <ServiceGalleryLightbox
                    images={getServiceGalleryImages(service)}
                    initialIndex={lightboxIndex}
                    serviceName={service.nombre}
                    onClose={() => setLightboxIndex(null)}
                  />
                )}
```

- [ ] **Step 4: Verificar que TypeScript no reporta errores**

```bash
cd BookIt-frontend && npx tsc --noEmit
```

Salida esperada: sin errores nuevos.

- [ ] **Step 5: Verificar lint**

```bash
cd BookIt-frontend && npm run lint
```

Salida esperada: sin errores nuevos en `AppRouter.tsx` (el archivo ya tiene un error preexistente no relacionado sobre `setState` síncrono en un efecto — no lo toques, es de código existente fuera de este cambio).

- [ ] **Step 6: Commit**

```bash
git -C BookIt-frontend add src/routes/AppRouter.tsx
git -C BookIt-frontend commit -m "feat: add clickable lightbox to service detail gallery"
```

---

## Task 4: Estilos del lightbox en `App.css`

**Files:**
- Modificar: `BookIt-frontend/src/App.css`

**Interfaces:**
- Produce: clases `.service-detail__lightbox-overlay`, `.service-detail__lightbox-image`, `.service-detail__lightbox-close`, `.service-detail__lightbox-nav`, `.service-detail__lightbox-nav--prev`, `.service-detail__lightbox-nav--next`, `.service-detail__lightbox-counter`
- Modifica (agrega una declaración, no reestructura): las reglas ya existentes `.service-detail__main-image` y `.service-detail__thumb` (la segunda definición, la que tiene `min-height`) reciben `cursor: pointer;`

- [ ] **Step 1: Agregar `cursor: pointer` a la imagen principal**

Buscar:

```css
.service-detail__main-image {
  position: relative;
  min-height: 440px;
  border-radius: 1.35rem;
  overflow: hidden;
  background:
    linear-gradient(180deg, rgba(10, 10, 18, 0.08), rgba(10, 10, 18, 0.52)),
    radial-gradient(circle at top left, rgba(255, 255, 255, 0.18), transparent 30%),
    linear-gradient(135deg, #2b2238, #493058 42%, #7d6c84 75%, #e1d5c7);
  box-shadow: var(--shadow);
}
```

Reemplazar por:

```css
.service-detail__main-image {
  position: relative;
  min-height: 440px;
  border-radius: 1.35rem;
  overflow: hidden;
  cursor: pointer;
  background:
    linear-gradient(180deg, rgba(10, 10, 18, 0.08), rgba(10, 10, 18, 0.52)),
    radial-gradient(circle at top left, rgba(255, 255, 255, 0.18), transparent 30%),
    linear-gradient(135deg, #2b2238, #493058 42%, #7d6c84 75%, #e1d5c7);
  box-shadow: var(--shadow);
}
```

- [ ] **Step 2: Agregar `cursor: pointer` a las miniaturas**

Buscar (es la segunda definición de `.service-detail__thumb` en el archivo, la que tiene `min-height: 78px`):

```css
.service-detail__thumb {
  position: relative;
  min-height: 78px;
  overflow: hidden;
  border-radius: 0.95rem;
  border: 1px solid rgba(122, 44, 255, 0.1);
  box-shadow: 0 10px 28px rgba(41, 23, 71, 0.08);
}
```

Reemplazar por:

```css
.service-detail__thumb {
  position: relative;
  min-height: 78px;
  overflow: hidden;
  cursor: pointer;
  border-radius: 0.95rem;
  border: 1px solid rgba(122, 44, 255, 0.1);
  box-shadow: 0 10px 28px rgba(41, 23, 71, 0.08);
}
```

- [ ] **Step 3: Agregar los estilos del lightbox después de `.service-detail__thumb--5`**

Buscar:

```css
.service-detail__thumb--5 {
  background: linear-gradient(135deg, #5f5347, #f3d2a6);
}
```

Y agregar inmediatamente después:

```css

.service-detail__lightbox-overlay {
  position: fixed;
  inset: 0;
  background: rgba(10, 10, 18, 0.92);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 2rem;
}

.service-detail__lightbox-image {
  max-width: min(90vw, 1100px);
  max-height: 85vh;
  object-fit: contain;
  border-radius: 0.75rem;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
  cursor: default;
}

.service-detail__lightbox-close {
  position: absolute;
  top: 1.5rem;
  right: 1.5rem;
  width: 2.5rem;
  height: 2.5rem;
  border-radius: 999px;
  border: 0;
  background: rgba(255, 255, 255, 0.12);
  color: #fff;
  font-size: 1.1rem;
  cursor: pointer;
  display: inline-grid;
  place-items: center;
}

.service-detail__lightbox-close:hover {
  background: rgba(255, 255, 255, 0.22);
}

.service-detail__lightbox-nav {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  width: 3rem;
  height: 3rem;
  border-radius: 999px;
  border: 0;
  background: rgba(255, 255, 255, 0.12);
  color: #fff;
  font-size: 1.4rem;
  cursor: pointer;
  display: inline-grid;
  place-items: center;
}

.service-detail__lightbox-nav:hover {
  background: rgba(255, 255, 255, 0.22);
}

.service-detail__lightbox-nav--prev {
  left: 1.5rem;
}

.service-detail__lightbox-nav--next {
  right: 1.5rem;
}

.service-detail__lightbox-counter {
  position: absolute;
  bottom: 1.5rem;
  left: 50%;
  transform: translateX(-50%);
  padding: 0.35rem 0.85rem;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.12);
  color: #fff;
  font-size: 0.85rem;
  font-weight: 600;
}

@media (max-width: 640px) {
  .service-detail__lightbox-overlay {
    padding: 1rem;
  }

  .service-detail__lightbox-nav {
    width: 2.4rem;
    height: 2.4rem;
    font-size: 1.1rem;
  }

  .service-detail__lightbox-close {
    top: 1rem;
    right: 1rem;
  }
}
```

- [ ] **Step 4: Commit**

```bash
git -C BookIt-frontend add src/App.css
git -C BookIt-frontend commit -m "feat: add lightbox styles and pointer cursor to clickable gallery images"
```

---

## Task 5: Verificación manual en el navegador

**Files:** Ninguno (solo verificación)

- [ ] **Step 1: Arrancar el servidor de desarrollo**

```bash
cd BookIt-frontend && npm run dev
```

- [ ] **Step 2: Probar el reordenamiento de imágenes**

1. Ir a editar un servicio existente que ya tenga 3+ imágenes (o crear uno nuevo y subir 3+ imágenes de prueba).
2. Verificar que la primera imagen de la grilla NO tiene botón `←`, y la última NO tiene botón `→`; todas las del medio tienen ambos.
3. Clickear `→` en la primera imagen y confirmar que pasa a la segunda posición (y la que estaba segunda pasa a ser la primera).
4. Guardar el servicio y volver a entrar a editarlo: confirmar que el nuevo orden persistió.
5. Ir al detalle público de ese servicio y al listado de servicios: confirmar que la imagen que ahora es la primera del array es la que se ve como portada/imagen principal en ambos lados.

- [ ] **Step 3: Probar el lightbox**

1. En el detalle de un servicio con 2+ imágenes, clickear la imagen principal: debe abrirse el lightbox mostrando esa misma imagen agrandada, con `object-fit: contain` (sin recortar).
2. Clickear una miniatura (por ejemplo la 3ra): el lightbox debe abrir mostrando exactamente esa imagen (no la primera).
3. Usar las flechas `←`/`→` del lightbox y confirmar que navega correctamente y que es circular (desde la última pasa a la primera).
4. Usar las flechas de teclado `ArrowLeft`/`ArrowRight` y confirmar que también navegan.
5. Cerrar con el botón `✕`, con la tecla `Escape`, y clickeando fuera de la imagen (el fondo oscuro) — las tres formas deben cerrar el lightbox. Clickear la imagen misma NO debe cerrarlo.
6. Probar en un servicio con una sola imagen: el lightbox debe abrir igual al clickear la imagen principal, pero sin flechas de navegación ni contador.
7. Probar en mobile width (~375px): confirmar que los botones de navegación y cierre no se salen de la pantalla ni tapan la imagen de forma molesta.

- [ ] **Step 4: Anotar cualquier ajuste visual necesario y corregir**

Si algo no calza, ajustar directamente en `App.css` o los componentes y commitear el fix:

```bash
git -C BookIt-frontend add -A
git -C BookIt-frontend commit -m "fix: adjust gallery reorder/lightbox after manual QA"
```
