import { useRef } from 'react';
import { CldUploadButton, type CloudinaryUploadWidgetResults } from 'next-cloudinary';

interface MediaItem {
  url: string;
  isVideo: boolean;
}

interface CloudinaryMediaPickerProps {
  label: string;
  hint?: string;
  mediaUrls: string[];
  onMediaUrlsChange: (mediaUrls: string[]) => void;
  maxFiles?: number;
  disabled?: boolean;
}

const uploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET;

const isVideoUrl = (url: string): boolean => /\/video\/upload\//.test(url) || /\.(mp4|mov|webm|ogg)$/i.test(url);

const extractMediaItem = (results: CloudinaryUploadWidgetResults): MediaItem | null => {
  const info = results.info;
  if (!info || typeof info === 'string') return null;
  if (!info.secure_url) return null;

  return {
    url: info.secure_url,
    isVideo: info.resource_type === 'video' || isVideoUrl(info.secure_url),
  };
};

const CloudinaryMediaPicker = ({
  label,
  hint,
  mediaUrls,
  onMediaUrlsChange,
  maxFiles = 6,
  disabled = false,
}: CloudinaryMediaPickerProps) => {
  // Ref so onSuccess always sees the latest mediaUrls even when multiple
  // uploads fire before React re-renders (stale closure fix).
  const mediaUrlsRef = useRef(mediaUrls);
  mediaUrlsRef.current = mediaUrls;

  const handleSuccess = (results: CloudinaryUploadWidgetResults) => {
    const uploaded = extractMediaItem(results);
    if (!uploaded) return;
    if (mediaUrlsRef.current.includes(uploaded.url)) return;
    if (mediaUrlsRef.current.length >= maxFiles) return;

    onMediaUrlsChange([...mediaUrlsRef.current, uploaded.url]);
  };

  const handleRemove = (url: string) => {
    onMediaUrlsChange(mediaUrls.filter((existingUrl) => existingUrl !== url));
  };

  const hasUploadConfig = Boolean(uploadPreset);
  const reachedLimit = mediaUrls.length >= maxFiles;
  const canUpload = hasUploadConfig && !disabled && !reachedLimit;

  return (
    <div className="cloudinary-image-picker">
      <div className="cloudinary-image-picker__header">
        <label className="cloudinary-image-picker__label">{label}</label>

        {hasUploadConfig ? (
          <CldUploadButton
            className="btn-secondary cloudinary-image-picker__upload"
            uploadPreset={uploadPreset ?? ''}
            options={{ multiple: true, resourceType: 'auto', maxFiles }}
            onSuccess={handleSuccess}
            disabled={!canUpload}
          >
            Subir fotos o videos
          </CldUploadButton>
        ) : (
          <span className="cloudinary-image-picker__missing-config">
            Configurá Cloudinary para habilitar la subida.
          </span>
        )}
      </div>

      {hint && <span className="form-group__hint">{hint}</span>}
      {reachedLimit && (
        <span className="form-group__hint">Alcanzaste el máximo de {maxFiles} archivos.</span>
      )}

      {mediaUrls.length > 0 ? (
        <div className="service-image-preview-grid cloudinary-image-picker__grid" aria-label={label}>
          {mediaUrls.map((url) => (
            <div key={url} className="cloudinary-image-picker__item">
              {isVideoUrl(url) ? (
                <video src={url} controls className="service-image-preview-grid__item" />
              ) : (
                <img src={url} alt={label} className="service-image-preview-grid__item" />
              )}
              <button
                type="button"
                className="cloudinary-image-picker__remove btn-secondary"
                onClick={() => handleRemove(url)}
                disabled={disabled}
              >
                Quitar
              </button>
            </div>
          ))}
        </div>
      ) : (
        <span className="form-group__hint cloudinary-image-picker__empty">
          Todavía no agregaste fotos ni videos.
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

export default CloudinaryMediaPicker;
