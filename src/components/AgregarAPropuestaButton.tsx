import usePropuestaDraft from '../hooks/usePropuestaDraft';
import { isSalonType } from '../utils/serviceType';
import type { Service } from '../types/service';

interface AgregarAPropuestaButtonProps {
  service: Service;
  className?: string;
}

const AgregarAPropuestaButton = ({ service, className }: AgregarAPropuestaButtonProps) => {
  const { draft, addSalon, addServicio, removeSalon, removeServicio } = usePropuestaDraft();

  const esSalon = isSalonType(service.tipoServicio);
  const yaAgregado = esSalon
    ? draft.salon?.id === service.id
    : draft.servicios.some((s) => s.id === service.id);
  const hayOtroSalon = esSalon && draft.salon != null && draft.salon.id !== service.id;

  const item = {
    id: service.id,
    nombre: service.nombre,
    tipoServicio: service.tipoServicio,
    precioMinimo: service.precioMinimo,
  };

  const handleClick = () => {
    if (esSalon) {
      if (yaAgregado) removeSalon();
      else addSalon(item);
      return;
    }
    if (yaAgregado) removeServicio(service.id);
    else addServicio(item);
  };

  const label = yaAgregado
    ? '✓ En tu propuesta'
    : hayOtroSalon
    ? 'Salón ya elegido'
    : '+ Agregar a propuesta';

  return (
    <button
      type="button"
      className={`propuesta-add-btn${yaAgregado ? ' propuesta-add-btn--added' : ''}${className ? ` ${className}` : ''}`}
      onClick={handleClick}
      disabled={hayOtroSalon}
      title={hayOtroSalon ? 'Ya tenés un salón en tu propuesta. Quitalo para cambiarlo.' : undefined}
    >
      {label}
    </button>
  );
};

export default AgregarAPropuestaButton;
