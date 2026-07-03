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

  const hasUploadConfig = Boolean(uploadPreset);
  const canUpload = hasUploadConfig && !disabled;

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
          {imageUrls.map((imageUrl) => (
            <div key={imageUrl} className="cloudinary-image-picker__item">
              <img src={imageUrl} alt={label} className="service-image-preview-grid__item" />
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
