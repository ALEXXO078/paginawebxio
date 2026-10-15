// Número de WhatsApp de la tienda (formato internacional, sin + ni espacios)
export const WHATSAPP_NUMBER = "51972234360";

export const waLink = (text: string) =>
  `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(text)}`;

export const buildProductWhatsAppLink = ({
  productName,
  slug,
  price,
  size,
  qty = 1,
  url,
}: {
  productName: string;
  slug: string;
  price?: number | string;
  size?: string | null;
  qty?: number;
  url?: string;
}) => {
  const message = [
    `Hola, estoy interesado en el producto ${productName}.`,
    `Código: ${slug}`,
    size ? `Talla: ${size}` : null,
    `Cantidad: ${qty}`,
    price != null ? `Precio: S/ ${Number(price).toFixed(2)}` : null,
    url ? `Enlace: ${url}` : null,
    "¿Podrían confirmarme disponibilidad y cómo puedo comprarlo?",
  ].filter(Boolean).join("\n");

  return waLink(message);
};
