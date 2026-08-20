export const PERFUME_FULL_BOTTLE_WEIGHT_GRAMS = 600;
export const BASE_DELIVERY_FEE = 500;
export const EXTRA_KILOGRAM_FEE = 100;

export function calculateDelivery(items) {
  if (!items.length) {
    return { deliveryFee: 0, perfumeWeightGrams: 0, billableKilograms: 0 };
  }

  const perfumeWeightGrams = items.reduce((total, item) => {
    const isFullPerfume = item.category === "perfumes" && item.option !== "decant";
    return total + (isFullPerfume ? PERFUME_FULL_BOTTLE_WEIGHT_GRAMS * item.quantity : 0);
  }, 0);
  const billableKilograms = Math.max(1, Math.ceil(perfumeWeightGrams / 1000));

  return {
    perfumeWeightGrams,
    billableKilograms,
    deliveryFee: BASE_DELIVERY_FEE + (billableKilograms - 1) * EXTRA_KILOGRAM_FEE,
  };
}

export function deliveryWeightLabel(grams) {
  if (grams <= 0) return "";
  if (grams <= 1000) return "Up to 1kg";

  return `Exceeds ${Math.floor((grams - 1) / 1000)}kg`;
}
