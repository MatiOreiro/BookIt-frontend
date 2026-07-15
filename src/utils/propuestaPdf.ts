import { jsPDF } from 'jspdf';
import type { PropuestaDto, PropuestaItemDto } from '../types/service';

const currencyFormatter = new Intl.NumberFormat('es-UY');
const dateFormatter = new Intl.DateTimeFormat('es-UY', { dateStyle: 'long' });

const addContactLines = (doc: jsPDF, item: PropuestaItemDto, startY: number): number => {
  let y = startY;
  if (item.vendorNombre) {
    doc.text(`Contacto: ${item.vendorNombre}`, 14, y);
    y += 6;
  }
  if (item.vendorEmail) {
    doc.text(`Email: ${item.vendorEmail}`, 14, y);
    y += 6;
  }
  if (item.vendorTelefono) {
    doc.text(`Teléfono: ${item.vendorTelefono}`, 14, y);
    y += 6;
  }
  return y;
};

export const buildPropuestaPdf = (propuesta: PropuestaDto): Blob => {
  const doc = new jsPDF();
  let y = 20;

  doc.setFontSize(18);
  doc.text(propuesta.nombre, 14, y);
  y += 8;

  doc.setFontSize(10);
  doc.text(`Generado el ${dateFormatter.format(new Date(propuesta.fechaCreacion))}`, 14, y);
  y += 12;

  doc.setFontSize(14);
  doc.text('Salón', 14, y);
  y += 7;
  doc.setFontSize(11);
  doc.text(
    `${propuesta.salon.nombre} — desde $ ${currencyFormatter.format(propuesta.salon.precioMinimo)}`,
    14,
    y,
  );
  y += 6;
  y = addContactLines(doc, propuesta.salon, y);
  y += 6;

  doc.setFontSize(14);
  doc.text('Servicios', 14, y);
  y += 7;
  doc.setFontSize(11);
  propuesta.servicios.forEach((servicio) => {
    doc.text(
      `${servicio.nombre} (${servicio.tipoServicio}) — desde $ ${currencyFormatter.format(servicio.precioMinimo)}`,
      14,
      y,
    );
    y += 6;
    y = addContactLines(doc, servicio, y);
    y += 4;
  });

  y += 4;
  doc.setFontSize(13);
  doc.text(`Total estimado: $ ${currencyFormatter.format(propuesta.totalEstimado)}`, 14, y);

  doc.setFontSize(9);
  doc.text('Generado desde BookIt', 14, 285);

  return doc.output('blob');
};
