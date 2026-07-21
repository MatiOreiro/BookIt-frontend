export const isSalonType = (tipoServicio: string): boolean => {
  const normalized = tipoServicio.toLowerCase().trim();
  return normalized.includes('salón') || normalized.includes('salon');
};
