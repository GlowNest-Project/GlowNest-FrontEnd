export function getDiscountPricing(item, now = Date.now()) {
  const originalPrice = Number(item?.originalPriceValue ?? item?.priceValue ?? 0);
  const discountType = item?.discountType === "fixed_amount" ? "fixed_amount" : "percentage";
  const discountTarget = ["full", "decant", "both"].includes(item?.discountTarget)
    ? item.discountTarget
    : "both";
  const option = item?.option === "decant" ? "decant" : "full";
  const percentage = Number(item?.discountPercent || 0);
  const amount = Number(item?.discountAmount || 0);
  const discountValue = discountType === "fixed_amount" ? amount : percentage;
  const startsAt = item?.discountStartAt ? new Date(item.discountStartAt).getTime() : NaN;
  const endsAt = item?.discountEndAt ? new Date(item.discountEndAt).getTime() : NaN;
  const hasSchedule =
    discountValue > 0 && Number.isFinite(startsAt) && Number.isFinite(endsAt) && endsAt > startsAt;
  const appliesToOption = discountTarget === "both" || discountTarget === option;
  const isActive = hasSchedule && appliesToOption && now >= startsAt && now < endsAt;

  return {
    originalPrice,
    priceValue: isActive
      ? discountType === "fixed_amount"
        ? Math.max(0, originalPrice - amount)
        : Math.round((originalPrice * (100 - percentage)) / 100)
      : originalPrice,
    discountType,
    discountTarget,
    percentage,
    amount,
    startsAt,
    endsAt,
    isActive,
    status: !hasSchedule ? "none" : now < startsAt ? "upcoming" : now < endsAt ? "active" : "expired",
  };
}

export function nextDiscountBoundary(items, now = Date.now()) {
  return (Array.isArray(items) ? items : [items])
    .flatMap((item) => [item?.discountStartAt, item?.discountEndAt])
    .map((value) => (value ? new Date(value).getTime() : NaN))
    .filter((value) => Number.isFinite(value) && value > now)
    .sort((left, right) => left - right)[0];
}
