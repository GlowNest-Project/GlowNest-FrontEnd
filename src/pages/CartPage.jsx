import { useMemo, useState } from "react";
import {
  Banknote,
  CreditCard,
  FileText,
  Minus,
  Plus,
  Printer,
  ShoppingCart,
  Trash2,
  Truck,
} from "lucide-react";
import { navigateTo } from "../utils/navigation";
import { whatsappLink } from "../utils/whatsapp";
import { createOrder } from "../utils/api";
import { formatPrice } from "../utils/format";
import { getDiscountPricing } from "../utils/discount";
import { useDiscountClock } from "../hooks/useDiscountClock";

const DELIVERY_FEE = 500;

function paymentLabel(method) {
  return method === "card" ? "Online payment via debit or credit card" : "Cash on delivery";
}

function invoiceNumber(order) {
  return order?.order_number || order?.orderNumber || "Pending";
}

function cartMessage(order) {
  const items = order.items || [];
  const itemLines = items
    .map((item) => `${item.quantity} x ${item.name} - ${formatPrice(item.priceValue * item.quantity)}`)
    .join("\n");

  return `Hi GlowNest, I placed order ${invoiceNumber(order)}:\n${itemLines}\nDiscount: ${formatPrice(
    order.discount
  )}\nDelivery: ${formatPrice(order.deliveryFee)}\nTotal: ${formatPrice(order.total)}\nPayment: ${paymentLabel(
    order.paymentMethod
  )}`;
}

function redirectToPayHere(paymentGateway) {
  if (!paymentGateway?.endpoint || !paymentGateway?.fields) {
    throw new Error("Payment gateway details are missing. Please try again.");
  }

  const form = document.createElement("form");
  form.method = "POST";
  form.action = paymentGateway.endpoint;
  form.style.display = "none";

  Object.entries(paymentGateway.fields).forEach(([name, value]) => {
    const input = document.createElement("input");
    input.type = "hidden";
    input.name = name;
    input.value = value ?? "";
    form.appendChild(input);
  });

  document.body.appendChild(form);
  form.submit();
}

function Invoice({ order }) {
  const items = order.items || [];

  return (
    <section className="invoice-card mx-auto max-w-[920px] rounded-lg border border-[#ead8ce] bg-white p-6 shadow-[0_18px_45px_rgba(143,86,62,0.09)] print:shadow-none">
      <div className="flex flex-wrap items-start justify-between gap-5 border-b border-[#ead8ce] pb-5">
        <div className="flex items-center gap-3">
          <img
            className="h-16 w-16 rounded-full object-cover"
            src="/assets/glownest-logo.png"
            alt="GlowNest logo"
          />
          <div>
            <p className="text-xs font-extrabold uppercase text-[#d7a17c]">GlowNest</p>
            <h2 className="font-serif text-4xl leading-none text-[#9b5f45]">Invoice</h2>
          </div>
        </div>
        <div className="text-right text-sm font-semibold text-[#6f5d54]">
          <p>
            Invoice No: <strong className="text-[#271b16]">{invoiceNumber(order)}</strong>
          </p>
          <p>{new Date().toLocaleDateString("en-LK")}</p>
          <p>{paymentLabel(order.paymentMethod)}</p>
        </div>
      </div>

      <div className="grid gap-4 border-b border-[#ead8ce] py-5 md:grid-cols-2">
        <div className="rounded-lg bg-[#fff8f3] p-4">
          <p className="text-xs font-extrabold uppercase text-[#d7a17c]">Customer</p>
          <p className="mt-2 font-bold text-[#271b16]">{order.customer.name}</p>
          <p className="mt-1 text-[#6f5d54]">{order.customer.phone}</p>
        </div>
        <div className="rounded-lg bg-[#fff8f3] p-4">
          <p className="text-xs font-extrabold uppercase text-[#d7a17c]">Delivery Address</p>
          <p className="mt-2 whitespace-pre-line font-semibold leading-[1.6] text-[#6f5d54]">
            {order.customer.address}
          </p>
        </div>
      </div>

      <div className="invoice-table-wrap overflow-x-auto py-5">
        <table className="invoice-table w-full min-w-[620px] border-collapse text-left">
          <thead>
            <tr className="border-b border-[#ead8ce] text-xs font-extrabold uppercase text-[#d7a17c]">
              <th className="py-3">Order Item</th>
              <th className="py-3 text-center">Qty</th>
              <th className="py-3 text-right">Price</th>
              <th className="py-3 text-right">Line Total</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <tr className="border-b border-[#f2e4dc] text-[#271b16]" key={item.id || item.name}>
                <td className="py-4 font-bold">{item.name}</td>
                <td className="py-4 text-center font-semibold">{item.quantity}</td>
                <td className="py-4 text-right font-semibold">{formatPrice(item.priceValue)}</td>
                <td className="py-4 text-right font-extrabold">
                  {formatPrice(item.priceValue * item.quantity)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="ml-auto grid max-w-[360px] gap-3 border-t border-[#ead8ce] pt-5 text-[#6f5d54]">
        <div className="flex justify-between">
          <span>Subtotal</span>
          <strong className="text-[#271b16]">{formatPrice(order.subtotal)}</strong>
        </div>
        <div className="flex justify-between">
          <span>Discount</span>
          <strong className="text-[#271b16]">{formatPrice(order.discount)}</strong>
        </div>
        <div className="flex justify-between">
          <span>Delivery charge</span>
          <strong className="text-[#271b16]">{formatPrice(order.deliveryFee)}</strong>
        </div>
        <div className="flex justify-between border-t border-[#ead8ce] pt-3 text-xl font-extrabold text-[#9b5f45]">
          <span>Total price</span>
          <span>{formatPrice(order.total)}</span>
        </div>
      </div>
    </section>
  );
}

export default function CartPage({
  cartItems,
  onDecreaseItem,
  onIncreaseItem,
  onOrderPlaced,
  onRemoveItem,
  token,
  user,
}) {
  const [delivery, setDelivery] = useState({
    name: user?.name || "",
    phone: user?.phone || "",
    email: user?.email || "",
    address: "",
  });
  const [paymentMethod, setPaymentMethod] = useState("cash_on_delivery");
  const [status, setStatus] = useState("idle");
  const [error, setError] = useState("");
  const [placedOrder, setPlacedOrder] = useState(null);
  const discountClock = useDiscountClock(cartItems);
  const pricedCartItems = useMemo(
    () =>
      cartItems.map((item) => ({
        ...item,
        priceValue: getDiscountPricing(item, discountClock).priceValue,
      })),
    [cartItems, discountClock]
  );

  const totals = useMemo(() => {
    const itemCount = pricedCartItems.reduce((sum, item) => sum + item.quantity, 0);
    const subtotal = pricedCartItems.reduce(
      (sum, item) => sum + Number(item.originalPriceValue ?? item.priceValue) * item.quantity,
      0
    );
    const discountedSubtotal = pricedCartItems.reduce(
      (sum, item) => sum + item.priceValue * item.quantity,
      0
    );
    const deliveryFee = pricedCartItems.length > 0 ? DELIVERY_FEE : 0;
    const discount = subtotal - discountedSubtotal;

    return {
      itemCount,
      subtotal,
      deliveryFee,
      discount,
      total: Math.max(0, discountedSubtotal + deliveryFee),
    };
  }, [pricedCartItems]);
  const paymentReturn = useMemo(() => {
    const params = new URLSearchParams(window.location.search);
    const status = params.get("payment");
    const order = params.get("order");

    return status ? { status, order } : null;
  }, []);

  function updateDeliveryField(event) {
    const { name, value } = event.target;
    setDelivery((current) => ({ ...current, [name]: value }));
  }

  async function placeOrder(event) {
    event.preventDefault();

    if (!delivery.name.trim() || !delivery.phone.trim() || !delivery.address.trim()) {
      setError("Please fill in your name, phone, and delivery address.");
      return;
    }

    if (paymentMethod === "card" && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(delivery.email.trim())) {
      setError("Please enter a valid email address for online card payment.");
      return;
    }

    setStatus("placing");
    setError("");

    const invoiceItems = pricedCartItems.map((item) => ({
      id: item.slug || item.id,
      name: item.name,
      quantity: item.quantity,
      priceValue: item.priceValue,
      type: item.type,
      option: item.option || "full",
    }));

    try {
      const order = await createOrder(
        {
          customer: {
            name: delivery.name.trim(),
            phone: delivery.phone.trim(),
            email: delivery.email.trim(),
            address: delivery.address.trim(),
          },
          deliveryFee: DELIVERY_FEE,
          discount: totals.discount,
          paymentMethod,
          items: invoiceItems,
        },
        token
      );

      if (paymentMethod === "card") {
        setStatus("redirecting");
        redirectToPayHere(order.paymentGateway);
        return;
      }

      setPlacedOrder({
        ...order,
        customer: {
          name: delivery.name.trim(),
          phone: delivery.phone.trim(),
          email: delivery.email.trim(),
          address: delivery.address.trim(),
        },
        deliveryFee: Number(order.delivery_fee_lkr ?? DELIVERY_FEE),
        discount: Number(order.discount_lkr ?? totals.discount),
        items: order.items || invoiceItems,
        paymentMethod,
        subtotal: Number(order.subtotal_lkr ?? totals.subtotal),
        total: Number(order.total_lkr ?? totals.total),
      });
      setStatus("placed");
      onOrderPlaced?.();
    } catch (submitError) {
      setError(submitError.message);
      setStatus("idle");
    }
  }

  function printInvoice() {
    const scrollX = window.scrollX;
    const scrollY = window.scrollY;
    const previousScrollBehavior = document.documentElement.style.scrollBehavior;
    let restoreTimer;

    const restoreScroll = () => {
      window.requestAnimationFrame(() => {
        window.scrollTo({ left: scrollX, top: scrollY, behavior: "auto" });
      });
    };

    const cleanupAfterPrint = () => {
      restoreScroll();
      window.clearTimeout(restoreTimer);
      restoreTimer = window.setTimeout(() => {
        restoreScroll();
        document.documentElement.style.scrollBehavior = previousScrollBehavior;
        window.removeEventListener("afterprint", cleanupAfterPrint);
        window.removeEventListener("focus", cleanupAfterPrint);
      }, 180);
    };

    document.documentElement.style.scrollBehavior = "auto";
    window.addEventListener("afterprint", cleanupAfterPrint);
    window.addEventListener("focus", cleanupAfterPrint);
    window.print();

    [150, 450, 950, 1600].forEach((delay) => window.setTimeout(restoreScroll, delay));
  }

  if (status === "placed" && placedOrder) {
    return (
      <main>
        <section className="invoice-screen-hero bg-[linear-gradient(135deg,#ffffff_0%,#fff8f3_55%,#f7eee9_100%)] px-[clamp(18px,5vw,72px)] py-[clamp(54px,8vw,96px)] print:hidden">
          <div className="max-w-[760px]">
            <p className="mb-4 text-base font-extrabold uppercase text-[#d7a17c] md:text-lg">
              GlowNest Orders
            </p>
            <h1 className="m-0 flex items-center gap-4 font-serif text-[clamp(3.5rem,10vw,7rem)] leading-[0.92] text-[#9b5f45]">
              <FileText aria-hidden="true" className="h-12 w-12 sm:h-16 sm:w-16" />
              Invoice
            </h1>
            <p className="mt-6 max-w-[620px] text-base leading-[1.8] text-[#5f4c43] md:text-lg">
              Your order has been placed and the invoice is ready.
            </p>
          </div>
        </section>

        <section className="invoice-print-shell px-[clamp(18px,5vw,72px)] py-[clamp(36px,6vw,72px)]">
          <Invoice order={placedOrder} />

          <div className="invoice-actions mx-auto mt-6 flex max-w-[920px] flex-wrap gap-3 print:hidden">
            <button
              className="inline-flex min-h-11 cursor-pointer items-center justify-center gap-2 rounded-md bg-linear-to-br from-[#c88763] to-[#8f563e] px-5 font-bold text-white shadow-sm"
              type="button"
              onClick={printInvoice}
            >
              <Printer aria-hidden="true" size={18} />
              Print Invoice
            </button>
            <a
              className="inline-flex min-h-11 items-center justify-center rounded-md border border-[#ead8ce] bg-white px-5 font-bold text-[#8f563e]"
              href={whatsappLink(cartMessage(placedOrder))}
              target="_blank"
              rel="noreferrer"
            >
              Send Invoice on WhatsApp
            </a>
            <button
              className="inline-flex min-h-11 cursor-pointer items-center justify-center rounded-md border border-[#ead8ce] bg-white px-5 font-bold text-[#8f563e]"
              type="button"
              onClick={() => navigateTo("/")}
            >
              Continue Shopping
            </button>
          </div>
        </section>
      </main>
    );
  }

  return (
    <main>
      <section className="bg-[linear-gradient(135deg,#ffffff_0%,#fff8f3_55%,#f7eee9_100%)] px-[clamp(18px,5vw,72px)] py-[clamp(54px,8vw,96px)]">
        <div className="max-w-[760px]">
          <p className="mb-4 text-base font-extrabold uppercase text-[#d7a17c] md:text-lg">
            GlowNest Orders
          </p>
          <h1 className="m-0 flex items-center gap-4 font-serif text-[clamp(3.5rem,10vw,7rem)] leading-[0.92] text-[#9b5f45]">
            <ShoppingCart aria-hidden="true" className="h-12 w-12 sm:h-16 sm:w-16" />
            Order
          </h1>
          <p className="mt-6 max-w-[620px] text-base leading-[1.8] text-[#5f4c43] md:text-lg">
            Review selected items, choose your payment method, and generate your GlowNest invoice.
          </p>
        </div>
      </section>

      <section className="px-[clamp(18px,5vw,72px)] py-[clamp(54px,8vw,96px)]">
        {paymentReturn ? (
          <div className="rounded-lg border border-[#ead8ce] bg-white p-8 text-center shadow-[0_18px_45px_rgba(143,86,62,0.09)]">
            <p className="text-xs font-extrabold uppercase text-[#d7a17c]">
              {paymentReturn.status === "success" ? "Payment Submitted" : "Payment Cancelled"}
            </p>
            <h2 className="mt-3 font-serif text-4xl text-[#9b5f45]">
              {paymentReturn.status === "success" ? "Thank you for your order" : "Payment was not completed"}
            </h2>
            <p className="mx-auto mt-3 max-w-[620px] leading-[1.7] text-[#6f5d54]">
              {paymentReturn.status === "success"
                ? "PayHere will confirm the payment with GlowNest automatically. We will prepare your order after the payment status is confirmed."
                : "You can return to your cart and try online payment again, or choose cash on delivery."}
            </p>
            {paymentReturn.order && (
              <p className="mt-4 font-bold text-[#271b16]">Order No: {paymentReturn.order}</p>
            )}
            <button
              className="mt-6 inline-flex min-h-11 cursor-pointer items-center justify-center rounded-md bg-linear-to-br from-[#c88763] to-[#8f563e] px-5 font-bold text-white shadow-sm"
              type="button"
              onClick={() => navigateTo("/perfumes")}
            >
              Continue Shopping
            </button>
          </div>
        ) : cartItems.length === 0 ? (
          <div className="rounded-lg border border-[#ead8ce] bg-white p-8 text-center shadow-[0_18px_45px_rgba(143,86,62,0.09)]">
            <h2 className="font-serif text-4xl text-[#9b5f45]">Your cart is empty</h2>
            <p className="mx-auto mt-3 max-w-[520px] leading-[1.7] text-[#6f5d54]">
              Add perfumes or cosmetics to your cart first, then come back here to confirm the order.
            </p>
            <button
              className="mt-6 inline-flex min-h-11 cursor-pointer items-center justify-center rounded-md bg-linear-to-br from-[#c88763] to-[#8f563e] px-5 font-bold text-white shadow-sm"
              type="button"
              onClick={() => navigateTo("/perfumes")}
            >
              Browse Products
            </button>
          </div>
        ) : (
          <form className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_400px]" onSubmit={placeOrder}>
            <div className="grid h-fit content-start gap-3">
              {pricedCartItems.map((item) => (
                <article
                  className="grid items-center gap-3 rounded-lg border border-[#ead8ce] bg-white p-4 shadow-[0_14px_32px_rgba(143,86,62,0.07)] sm:grid-cols-[minmax(0,1fr)_auto]"
                  key={item.id}
                >
                  <div>
                    <p className="mb-1 text-xs font-extrabold uppercase text-[#d7a17c]">{item.type}</p>
                    <h2 className="m-0 text-lg font-bold leading-snug text-[#271b16]">{item.name}</h2>
                    <p className="mt-1 text-sm text-[#6f5d54]">{formatPrice(item.priceValue)}</p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2 sm:justify-end">
                    <div className="flex min-h-10 items-center overflow-hidden rounded-md border border-[#d8b49f]">
                      <button
                        aria-label={`Decrease ${item.name}`}
                        className="flex h-10 w-10 cursor-pointer items-center justify-center bg-[#fff7f1] text-[#8f563e]"
                        type="button"
                        onClick={() => onDecreaseItem(item.id)}
                      >
                        <Minus aria-hidden="true" size={18} />
                      </button>
                      <span className="min-w-10 text-center font-bold text-[#271b16]">{item.quantity}</span>
                      <button
                        aria-label={`Increase ${item.name}`}
                        className="flex h-10 w-10 cursor-pointer items-center justify-center bg-[#fff7f1] text-[#8f563e]"
                        type="button"
                        onClick={() => onIncreaseItem(item)}
                      >
                        <Plus aria-hidden="true" size={18} />
                      </button>
                    </div>
                    <button
                      aria-label={`Remove ${item.name}`}
                      className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-md border border-[#ead8ce] text-[#8f563e]"
                      type="button"
                      onClick={() => onRemoveItem(item.id)}
                    >
                      <Trash2 aria-hidden="true" size={18} />
                    </button>
                  </div>
                </article>
              ))}
            </div>

            <aside className="h-fit rounded-lg border border-[#ead8ce] bg-[#fff8f3] p-6 shadow-[0_18px_45px_rgba(143,86,62,0.09)]">
              <p className="text-xs font-extrabold uppercase text-[#d7a17c]">Order Summary</p>

              <div className="mt-5 grid gap-3">
                <div className="flex justify-between text-[#6f5d54]">
                  <span>Items</span>
                  <strong className="text-[#271b16]">{totals.itemCount}</strong>
                </div>
                <div className="flex justify-between text-[#6f5d54]">
                  <span>Subtotal</span>
                  <strong className="text-[#271b16]">{formatPrice(totals.subtotal)}</strong>
                </div>
                <div className="flex justify-between text-[#6f5d54]">
                  <span>Discount</span>
                  <strong className="text-[#271b16]">{formatPrice(totals.discount)}</strong>
                </div>
                <div className="flex justify-between text-[#6f5d54]">
                  <span className="inline-flex items-center gap-2">
                    <Truck aria-hidden="true" size={17} />
                    Delivery charge
                  </span>
                  <strong className="text-[#271b16]">{formatPrice(totals.deliveryFee)}</strong>
                </div>
                <div className="flex justify-between border-y border-[#ead8ce] py-4 text-xl font-extrabold text-[#9b5f45]">
                  <span>Total</span>
                  <span>{formatPrice(totals.total)}</span>
                </div>
              </div>

              <div className="mt-5 grid gap-3">
                <p className="text-xs font-extrabold uppercase text-[#d7a17c]">Payment Method</p>
                <label className="flex cursor-pointer items-center gap-3 rounded-md border border-[#ead8ce] bg-white p-3 font-bold text-[#6f5d54] has-checked:border-[#c88763] has-checked:bg-[#fff0e8] has-checked:text-[#8f563e]">
                  <input
                    checked={paymentMethod === "cash_on_delivery"}
                    className="accent-[#9b5f45]"
                    name="paymentMethod"
                    onChange={() => setPaymentMethod("cash_on_delivery")}
                    type="radio"
                  />
                  <Banknote aria-hidden="true" size={20} />
                  Cash on delivery
                </label>
                <label className="flex cursor-pointer items-center gap-3 rounded-md border border-[#ead8ce] bg-white p-3 font-bold text-[#6f5d54] has-checked:border-[#c88763] has-checked:bg-[#fff0e8] has-checked:text-[#8f563e]">
                  <input
                    checked={paymentMethod === "card"}
                    className="accent-[#9b5f45]"
                    name="paymentMethod"
                    onChange={() => setPaymentMethod("card")}
                    type="radio"
                  />
                  <CreditCard aria-hidden="true" size={20} />
                  Online payment via debit or credit card
                </label>
                {paymentMethod === "card" && (
                  <p className="rounded-md bg-white px-3 py-2 text-xs font-semibold leading-[1.6] text-[#6f5d54]">
                    You will be redirected to PayHere secure checkout. After payment, GlowNest will
                    receive the payment status automatically.
                  </p>
                )}
              </div>

              <div className="mt-5 grid gap-3">
                <label className="block">
                  <span className="mb-1 block text-xs font-bold text-[#6f5d54]">Customer name</span>
                  <input
                    className="min-h-11 w-full rounded-md border border-[#ead8ce] bg-white px-3 text-sm font-semibold text-[#271b16] outline-none focus:border-[#c88763]"
                    name="name"
                    onChange={updateDeliveryField}
                    value={delivery.name}
                  />
                </label>
                <label className="block">
                  <span className="mb-1 block text-xs font-bold text-[#6f5d54]">Mobile number</span>
                  <input
                    className="min-h-11 w-full rounded-md border border-[#ead8ce] bg-white px-3 text-sm font-semibold text-[#271b16] outline-none focus:border-[#c88763]"
                    name="phone"
                    onChange={updateDeliveryField}
                    value={delivery.phone}
                  />
                </label>
                <label className="block">
                  <span className="mb-1 block text-xs font-bold text-[#6f5d54]">
                    Email address <span className="font-semibold text-[#9b7d6f]">(for online payment)</span>
                  </span>
                  <input
                    className="min-h-11 w-full rounded-md border border-[#ead8ce] bg-white px-3 text-sm font-semibold text-[#271b16] outline-none focus:border-[#c88763]"
                    name="email"
                    onChange={updateDeliveryField}
                    type="email"
                    value={delivery.email}
                  />
                </label>
                <label className="block">
                  <span className="mb-1 block text-xs font-bold text-[#6f5d54]">Delivery address</span>
                  <textarea
                    className="min-h-24 w-full rounded-md border border-[#ead8ce] bg-white px-3 py-2 text-sm font-semibold text-[#271b16] outline-none focus:border-[#c88763]"
                    name="address"
                    onChange={updateDeliveryField}
                    value={delivery.address}
                  />
                </label>
              </div>

              {error && <p className="mt-3 text-sm font-bold text-[#c04c4c]">{error}</p>}

              <button
                className="mt-5 inline-flex min-h-12 w-full cursor-pointer items-center justify-center rounded-md bg-linear-to-br from-[#c88763] to-[#8f563e] px-5 font-bold text-white shadow-sm disabled:cursor-not-allowed disabled:opacity-60"
                disabled={status === "placing" || status === "redirecting"}
                type="submit"
              >
                {status === "placing"
                  ? "Placing Order..."
                  : status === "redirecting"
                    ? "Opening Secure Payment..."
                  : paymentMethod === "card"
                    ? "Pay Online and Generate Invoice"
                    : "Place COD Order and Generate Invoice"}
              </button>
            </aside>
          </form>
        )}
      </section>
    </main>
  );
}
