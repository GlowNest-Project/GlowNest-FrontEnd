export function formatPrice(value) {
  return `LKR ${Number(value || 0).toLocaleString("en-US")}`;
}

export function formatDecant(decant) {
  if (!decant) {
    return "";
  }

  return `${decant.size} decant - ${formatPrice(decant.priceValue)}`;
}
