import { useEffect, useMemo, useState } from "react";
import { nextDiscountBoundary } from "../utils/discount";

export function useDiscountClock(items) {
  const [now, setNow] = useState(() => Date.now());
  const scheduleKey = useMemo(
    () =>
      (Array.isArray(items) ? items : [items])
        .map((item) => `${item?.discountStartAt || ""}|${item?.discountEndAt || ""}`)
        .join(","),
    [items]
  );

  useEffect(() => {
    const currentTime = Date.now();
    const nextBoundary = nextDiscountBoundary(items, currentTime);

    if (!nextBoundary) {
      return undefined;
    }

    const timerId = window.setTimeout(
      () => setNow(Date.now()),
      Math.min(nextBoundary - currentTime + 100, 2_147_000_000)
    );

    return () => window.clearTimeout(timerId);
  }, [scheduleKey, now]);

  return now;
}
