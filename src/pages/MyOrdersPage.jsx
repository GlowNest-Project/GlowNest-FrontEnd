import { useEffect, useMemo, useState } from "react";
import { PackageCheck, ReceiptText, RefreshCw, Truck } from "lucide-react";
import { getOrders } from "../utils/api";
import { formatPrice } from "../utils/format";

function formatDateTime(value) {
  if (!value) return "Not available";

  return new Intl.DateTimeFormat("en-LK", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function normalizeOrder(order) {
  const statusHistory = order.statusHistory || order.status_history || [];

  return {
    id: order.id,
    orderNumber: order.orderNumber || order.order_number || `Order ${order.id}`,
    createdAt: order.createdAt || order.created_at,
    updatedAt: order.updatedAt || order.updated_at,
    customerName: order.customerName || order.customer_name || "",
    customerPhone: order.customerPhone || order.customer_phone || "",
    customerEmail: order.customerEmail || order.customer_email || "",
    deliveryAddress: order.deliveryAddress || order.delivery_address || "",
    subtotal: Number(order.subtotal ?? order.subtotal_lkr ?? 0),
    discount: Number(order.discount ?? order.discount_lkr ?? 0),
    deliveryFee: Number(order.deliveryFee ?? order.delivery_fee_lkr ?? 0),
    total: Number(order.total ?? order.total_lkr ?? 0),
    paymentMethod: order.paymentMethod || order.payment_method || "cash_on_delivery",
    paymentStatus: order.paymentStatus || order.payment_status || "pending",
    transactionReference: order.transactionReference || order.transaction_reference || "",
    paidAt: order.paidAt || order.paid_at,
    paymentUpdatedAt: order.paymentUpdatedAt || order.payment_updated_at,
    orderStatus: order.orderStatus || order.order_status || "new",
    statusHistory: statusHistory.map((event) => ({
      id: event.id,
      status: event.status || event.order_status || "confirmed",
      note: event.note || "",
      createdAt: event.createdAt || event.created_at,
    })),
    items: (order.items || []).map((item) => {
      const unitPrice = Number(item.unitPrice ?? item.unit_price_lkr ?? item.priceValue ?? 0);
      const quantity = Number(item.quantity || 0);

      return {
        id: item.id,
        productName: item.productName || item.product_name || item.name || "GlowNest item",
        quantity,
        unitPrice,
        lineTotal: Number(item.lineTotal ?? item.line_total_lkr ?? unitPrice * quantity),
      };
    }),
  };
}

function orderStatusLabel(status) {
  if (status === "delivered") return "Order delivered";
  if (status === "cancelled") return "Cancelled";
  if (status === "packed") return "Packed";
  return "Order received";
}

function paymentLabel(method) {
  if (method === "card") return "Online card payment";
  if (method === "koko_pay") return "Koko Pay";
  if (method === "bank_transfer") return "Bank transfer";
  return "Cash on delivery";
}

function paymentStatusLabel(status) {
  if (status === "paid") return "Paid";
  if (status === "failed") return "Payment failed";
  if (status === "refunded") return "Refunded";
  return "Pending";
}

function statusClass(status) {
  if (status === "delivered") return "border-[#b9dcc8] bg-[#effaf3] text-[#2f8b5b]";
  if (status === "cancelled") return "border-[#f1c8c8] bg-[#fff2f2] text-[#c04c4c]";
  return "border-[#ead8ce] bg-[#fff8f3] text-[#8f563e]";
}

const trackingSteps = [
  { status: "confirmed", label: "Order received" },
  { status: "packed", label: "Packed" },
  { status: "delivered", label: "Delivered" },
];

function trackingIndex(status) {
  if (status === "delivered") return 2;
  if (status === "packed") return 1;
  if (status === "cancelled") return -1;
  return 0;
}

export default function MyOrdersPage({ token, user }) {
  const [orders, setOrders] = useState([]);
  const [status, setStatus] = useState("loading");
  const [error, setError] = useState("");

  const normalizedOrders = useMemo(() => orders.map(normalizeOrder), [orders]);

  function loadOrders() {
    if (!token) {
      setStatus("error");
      setError("Please log in to view your orders.");
      return;
    }

    setStatus("loading");
    setError("");

    getOrders(token)
      .then((data) => {
        setOrders(data);
        setStatus("ready");
      })
      .catch((loadError) => {
        setError(loadError.message);
        setStatus("error");
      });
  }

  useEffect(() => {
    loadOrders();

    if (!token) {
      return undefined;
    }

    let cancelled = false;
    const intervalId = window.setInterval(() => {
      getOrders(token)
        .then((data) => {
          if (!cancelled) {
            setOrders(data);
            setStatus("ready");
            setError("");
          }
        })
        .catch(() => {
          // Keep the last successfully loaded order details visible.
        });
    }, 30000);

    return () => {
      cancelled = true;
      window.clearInterval(intervalId);
    };
  }, [token]);

  return (
    <main>
      <section className="bg-[linear-gradient(135deg,#ffffff_0%,#fff8f3_55%,#f7eee9_100%)] px-[clamp(18px,5vw,72px)] py-[clamp(54px,8vw,96px)]">
        <div className="max-w-[820px]">
          <p className="mb-4 text-base font-extrabold uppercase text-[#d7a17c] md:text-lg">
            GlowNest Customer
          </p>
          <h1 className="m-0 flex items-center gap-4 font-serif text-[clamp(3.5rem,10vw,7rem)] leading-[0.92] text-[#9b5f45]">
            <ReceiptText aria-hidden="true" className="h-12 w-12 sm:h-16 sm:w-16" />
            My Orders
          </h1>
          <p className="mt-6 max-w-[660px] text-base leading-[1.8] text-[#5f4c43] md:text-lg">
            Track your GlowNest orders, ordered items, payment method, and delivery status.
          </p>
        </div>
      </section>

      <section className="px-[clamp(18px,5vw,72px)] py-[clamp(48px,7vw,82px)]">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs font-extrabold uppercase text-[#d7a17c]">Order history</p>
            <h2 className="font-serif text-4xl text-[#9b5f45]">
              {user?.name ? `${user.name}'s orders` : "Your orders"}
            </h2>
          </div>
          <button
            className="inline-flex min-h-11 cursor-pointer items-center justify-center gap-2 rounded-md border border-[#ead8ce] bg-white px-5 font-bold text-[#8f563e] shadow-sm transition hover:-translate-y-0.5 hover:bg-[#fff8f3]"
            type="button"
            onClick={loadOrders}
          >
            <RefreshCw aria-hidden="true" size={18} />
            Refresh
          </button>
        </div>

        {status === "loading" && (
          <p className="rounded-lg border border-[#ead8ce] bg-white px-5 py-6 font-bold text-[#8f563e]">
            Loading your orders...
          </p>
        )}

        {status === "error" && (
          <p className="rounded-lg border border-[#f1c8c8] bg-[#fff2f2] px-5 py-6 font-bold text-[#c04c4c]">
            {error || "Could not load your orders right now."}
          </p>
        )}

        {status === "ready" && normalizedOrders.length === 0 && (
          <div className="rounded-lg border border-[#ead8ce] bg-white p-8 text-center shadow-[0_18px_45px_rgba(143,86,62,0.08)]">
            <PackageCheck aria-hidden="true" className="mx-auto text-[#d7a17c]" size={42} />
            <h3 className="mt-4 font-serif text-4xl text-[#9b5f45]">No orders yet</h3>
            <p className="mx-auto mt-2 max-w-[520px] leading-[1.7] text-[#6f5d54]">
              When you place an order, it will appear here with the current order status.
            </p>
          </div>
        )}

        {status === "ready" && normalizedOrders.length > 0 && (
          <div className="grid gap-5">
            {normalizedOrders.map((order) => (
              <article
                className="rounded-lg border border-[#ead8ce] bg-white p-5 shadow-[0_18px_45px_rgba(143,86,62,0.08)]"
                key={order.id}
              >
                <div className="flex flex-wrap items-start justify-between gap-4 border-b border-[#ead8ce] pb-4">
                  <div>
                    <p className="text-xs font-extrabold uppercase text-[#d7a17c]">
                      {order.orderNumber}
                    </p>
                    <h3 className="mt-2 text-2xl font-extrabold text-[#271b16]">
                      {formatPrice(order.total)}
                    </h3>
                    <p className="mt-1 text-sm font-semibold text-[#6f5d54]">
                      Ordered: {formatDateTime(order.createdAt)}
                    </p>
                    <p className="mt-1 text-xs font-bold text-[#8f756f]">
                      Last updated: {formatDateTime(order.updatedAt)}
                    </p>
                  </div>
                  <span
                    className={`inline-flex min-h-10 items-center gap-2 rounded-md border px-4 text-sm font-extrabold ${statusClass(
                      order.orderStatus
                    )}`}
                  >
                    <Truck aria-hidden="true" size={17} />
                    {orderStatusLabel(order.orderStatus)}
                  </span>
                </div>

                <div className="grid gap-4 py-4 lg:grid-cols-[1fr_300px]">
                  <div className="grid gap-3">
                    <p className="text-xs font-extrabold uppercase text-[#d7a17c]">Ordered items</p>
                    {order.items.map((item) => (
                      <div
                        className="grid gap-2 rounded-md bg-[#fff8f3] px-4 py-3 text-[#6f5d54] sm:grid-cols-[1fr_auto_auto_auto]"
                        key={item.id || item.productName}
                      >
                        <span className="font-bold text-[#271b16]">{item.productName}</span>
                        <span className="font-semibold">Qty {item.quantity}</span>
                        <span className="font-semibold">{formatPrice(item.unitPrice)} each</span>
                        <span className="font-extrabold text-[#9b5f45]">
                          {formatPrice(item.lineTotal)}
                        </span>
                      </div>
                    ))}
                  </div>

                  <aside className="rounded-md border border-[#ead8ce] p-4">
                    <p className="text-xs font-extrabold uppercase text-[#d7a17c]">Payment</p>
                    <p className="mt-2 font-bold text-[#271b16]">{paymentLabel(order.paymentMethod)}</p>
                    <p className="mt-1 text-sm font-semibold text-[#6f5d54]">
                      Status: {paymentStatusLabel(order.paymentStatus)}
                    </p>
                    {order.transactionReference && (
                      <p className="mt-2 break-all text-sm font-semibold text-[#6f5d54]">
                        Reference: {order.transactionReference}
                      </p>
                    )}
                    {order.paidAt && (
                      <p className="mt-1 text-sm font-semibold text-[#6f5d54]">
                        Paid: {formatDateTime(order.paidAt)}
                      </p>
                    )}
                    <p className="mt-4 text-xs font-extrabold uppercase text-[#d7a17c]">
                      Customer details
                    </p>
                    <p className="mt-2 text-sm font-bold text-[#271b16]">
                      {order.customerName || user?.name || "Not available"}
                    </p>
                    <p className="mt-1 text-sm font-semibold text-[#6f5d54]">
                      {order.customerPhone || "Phone not available"}
                    </p>
                    <p className="mt-1 break-all text-sm font-semibold text-[#6f5d54]">
                      {order.customerEmail || user?.email || "Email not available"}
                    </p>
                    <p className="mt-4 text-xs font-extrabold uppercase text-[#d7a17c]">
                      Delivery address
                    </p>
                    <p className="mt-2 whitespace-pre-line text-sm font-semibold leading-[1.6] text-[#6f5d54]">
                      {order.deliveryAddress || "Not available"}
                    </p>
                  </aside>
                </div>

                <div className="mb-4 rounded-md border border-[#ead8ce] bg-[#fffdfb] p-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="text-xs font-extrabold uppercase text-[#d7a17c]">
                      Order tracking
                    </p>
                    <span className={`rounded-full border px-3 py-1 text-xs font-extrabold ${statusClass(order.orderStatus)}`}>
                      {orderStatusLabel(order.orderStatus)}
                    </span>
                  </div>
                  {order.orderStatus === "cancelled" ? (
                    <p className="mt-3 rounded-md bg-[#fff2f2] px-4 py-3 font-bold text-[#c04c4c]">
                      This order was cancelled. Please contact GlowNest if you need help.
                    </p>
                  ) : (
                    <div className="mt-4 grid gap-3 sm:grid-cols-3">
                      {trackingSteps.map((step, index) => {
                        const isActive = index <= trackingIndex(order.orderStatus);

                        return (
                          <div
                            className={`rounded-md border px-4 py-3 transition ${
                              isActive
                                ? "border-[#b9dcc8] bg-[#effaf3] text-[#2f8b5b]"
                                : "border-[#ead8ce] bg-white text-[#8f756f]"
                            }`}
                            key={step.status}
                          >
                            <p className="text-sm font-extrabold">{step.label}</p>
                            <p className="mt-1 text-xs font-semibold">
                              {isActive ? "Completed" : "Waiting"}
                            </p>
                          </div>
                        );
                      })}
                    </div>
                  )}
                  {order.statusHistory.length > 0 && (
                    <div className="mt-4 grid gap-2 border-t border-[#ead8ce] pt-4">
                      {order.statusHistory
                        .slice()
                        .reverse()
                        .map((event) => (
                          <div
                            className="flex flex-wrap items-center justify-between gap-2 text-sm"
                            key={event.id || `${event.status}-${event.createdAt}`}
                          >
                            <span className="font-bold text-[#271b16]">
                              {event.note || orderStatusLabel(event.status)}
                            </span>
                            <span className="font-semibold text-[#6f5d54]">
                              {formatDateTime(event.createdAt)}
                            </span>
                          </div>
                        ))}
                    </div>
                  )}
                </div>

                <div className="ml-auto grid max-w-[360px] gap-2 border-t border-[#ead8ce] pt-4 text-[#6f5d54]">
                  <div className="flex justify-between">
                    <span>Subtotal</span>
                    <strong className="text-[#271b16]">{formatPrice(order.subtotal)}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span>Discount</span>
                    <strong className="text-[#c04c4c]">-{formatPrice(order.discount)}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span>Delivery charge</span>
                    <strong className="text-[#271b16]">{formatPrice(order.deliveryFee)}</strong>
                  </div>
                  <div className="flex justify-between text-lg font-extrabold text-[#9b5f45]">
                    <span>Total</span>
                    <span>{formatPrice(order.total)}</span>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
