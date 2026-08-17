const whatsappNumber = "94766721584";

export function whatsappLink(message) {
  const text = message ? `?text=${encodeURIComponent(message)}` : "";
  return `https://wa.me/${whatsappNumber}${text}`;
}
