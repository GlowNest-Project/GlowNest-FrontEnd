const KOKO_CUSTOMER_INFO_URL = "https://paykoko.com/customer-education";

export function openKokoPayInfo(amount) {
  const paymentUrl = new URL(KOKO_CUSTOMER_INFO_URL);

  if (amount) {
    paymentUrl.searchParams.set("Amount", String(amount));
  }

  window.open(paymentUrl.toString(), "_blank", "noopener,noreferrer");
}
