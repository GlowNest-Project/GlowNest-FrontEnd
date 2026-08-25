import { useEffect, useMemo, useRef, useState } from "react";
import {
  AlertTriangle,
  BadgePercent,
  Bell,
  Check,
  CheckCircle2,
  LogOut,
  ReceiptText,
  Send,
  ShoppingCart,
  UserRound,
  XCircle,
} from "lucide-react";
import {
  getAdminOrders,
  getCustomerNotifications,
  markCustomerNotificationsRead,
  updateAdminOrderPayment,
} from "../utils/api";
import { formatPrice } from "../utils/format";
import { navigateTo, navigateToSection } from "../utils/navigation";

function NavLink({ children, icon: Icon, page, path }) {
  const isActive = page === path.replace("/", "");

  return (
    <button
      className={`inline-flex min-h-10 cursor-pointer items-center justify-center gap-2 rounded-md border px-3 text-sm font-extrabold transition duration-300 hover:-translate-y-0.5 hover:border-[#ead8ce] hover:bg-[#fff8f3] hover:text-[#9b5f45] ${
        isActive
          ? "border-[#ead8ce] bg-[#fff8f3] text-[#9b5f45] shadow-[0_6px_16px_rgba(143,86,62,0.10)]"
          : "border-transparent text-[#6f5d54]"
      }`}
      type="button"
      onClick={() => navigateTo(path)}
    >
      {Icon && <Icon aria-hidden="true" size={16} strokeWidth={2.4} />}
      {children}
    </button>
  );
}

function PerfumeBottleIcon({ size = 16 }) {
  return (
    <svg
      aria-hidden="true"
      fill="none"
      height={size}
      viewBox="0 0 24 24"
      width={size}
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M9.2 2.8h5.6v3.1H9.2V2.8Z"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2.2"
      />
      <path
        d="M10.2 5.9h3.6v2.5c0 .5.25.95.67 1.22l1.44.9A4.4 4.4 0 0 1 18 14.24v4.02A3.74 3.74 0 0 1 14.26 22H9.74A3.74 3.74 0 0 1 6 18.26v-4.02a4.4 4.4 0 0 1 2.09-3.72l1.44-.9c.42-.27.67-.72.67-1.22V5.9Z"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2.2"
      />
      <path
        d="M9.1 15.2h5.8M9.1 18h5.8"
        stroke="currentColor"
        strokeLinecap="round"
        strokeWidth="2.2"
      />
    </svg>
  );
}

function SerumBottleIcon({ size = 16 }) {
  return (
    <svg
      aria-hidden="true"
      fill="none"
      height={size}
      viewBox="0 0 24 24"
      width={size}
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M10.4 2.8h3.2a1.6 1.6 0 0 1 1.6 1.6v4.8H8.8V4.4a1.6 1.6 0 0 1 1.6-1.6Z"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
      />
      <path
        d="M7.2 9.2h9.6v3.1H7.2V9.2Z"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
      />
      <path
        d="M5.6 12.3h12.8v6.1A3.6 3.6 0 0 1 14.8 22H9.2a3.6 3.6 0 0 1-3.6-3.6v-6.1Z"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
      />
      <path
        d="M12 12.3v6.4"
        stroke="currentColor"
        strokeLinecap="round"
        strokeWidth="2"
      />
    </svg>
  );
}

function formatDateTime(value) {
  if (!value) return "Not available";
  return new Intl.DateTimeFormat("en-LK", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

export default function Header({ cartCount, onCartClick, onLogout, page, token, user }) {
  const [adminOrders, setAdminOrders] = useState([]);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [notificationStatus, setNotificationStatus] = useState("idle");
  const [seenOrderIds, setSeenOrderIds] = useState(() => {
    try {
      return JSON.parse(window.localStorage.getItem("glownest_seen_order_alerts") || "[]");
    } catch {
      return [];
    }
  });
  const [newOrderToast, setNewOrderToast] = useState(null);
  const [customerNotifications, setCustomerNotifications] = useState([]);
  const knownOrderIdsRef = useRef(new Set());
  const hasLoadedOrdersRef = useRef(false);
  const toastTimerRef = useRef(null);

  const pendingOnlineOrders = useMemo(
    () =>
      adminOrders.filter(
        (order) => order.paymentMethod === "card" && order.paymentStatus === "pending"
      ),
    [adminOrders]
  );

  const newOrderAlerts = useMemo(
    () => adminOrders.filter((order) => !seenOrderIds.includes(String(order.id))),
    [adminOrders, seenOrderIds]
  );

  const hasUnreadNotifications = newOrderAlerts.length > 0 || pendingOnlineOrders.length > 0;
  const unreadCustomerNotifications = useMemo(
    () => customerNotifications.filter((notification) => !notification.isRead),
    [customerNotifications]
  );

  useEffect(() => {
    if (!token || user?.role !== "admin") {
      setAdminOrders([]);
      setNotificationsOpen(false);
      knownOrderIdsRef.current = new Set();
      hasLoadedOrdersRef.current = false;
      return undefined;
    }

    let cancelled = false;

    const loadOrders = () => {
      getAdminOrders(token)
        .then((orders) => {
          if (cancelled) return;

          const nextOrderIds = new Set(orders.map((order) => String(order.id)));
          const freshOrders = orders.filter(
            (order) => hasLoadedOrdersRef.current && !knownOrderIdsRef.current.has(String(order.id))
          );

          knownOrderIdsRef.current = nextOrderIds;
          hasLoadedOrdersRef.current = true;
          setAdminOrders(orders);

          if (freshOrders.length > 0) {
            setNewOrderToast(freshOrders[0]);
            window.clearTimeout(toastTimerRef.current);
            toastTimerRef.current = window.setTimeout(() => {
              setNewOrderToast(null);
            }, 4500);
          }
        })
        .catch(() => {});
    };

    loadOrders();
    const intervalId = window.setInterval(loadOrders, 30000);

    return () => {
      cancelled = true;
      window.clearInterval(intervalId);
      window.clearTimeout(toastTimerRef.current);
    };
  }, [token, user?.role]);

  useEffect(() => {
    if (!token || !user || user.role === "admin") {
      setCustomerNotifications([]);
      return undefined;
    }

    let cancelled = false;

    const loadNotifications = () => {
      getCustomerNotifications(token)
        .then((notifications) => {
          if (!cancelled) {
            setCustomerNotifications(notifications);
          }
        })
        .catch(() => {});
    };

    loadNotifications();
    const intervalId = window.setInterval(loadNotifications, 30000);

    return () => {
      cancelled = true;
      window.clearInterval(intervalId);
    };
  }, [token, user]);

  useEffect(() => {
    if (page !== "orders" || !token || unreadCustomerNotifications.length === 0) {
      return undefined;
    }

    let cancelled = false;
    setCustomerNotifications((currentNotifications) =>
      currentNotifications.map((notification) => ({ ...notification, isRead: true }))
    );

    markCustomerNotificationsRead(token)
      .then((notifications) => {
        if (!cancelled) {
          setCustomerNotifications(notifications);
        }
      })
      .catch(() => {
        // The next polling cycle restores the red dot if the read receipt was not saved.
      });

    return () => {
      cancelled = true;
    };
  }, [page, token, unreadCustomerNotifications.length]);

  function markOrdersSeen() {
    const nextSeenOrderIds = Array.from(
      new Set([...seenOrderIds, ...adminOrders.map((order) => String(order.id))])
    );

    setSeenOrderIds(nextSeenOrderIds);
    window.localStorage.setItem("glownest_seen_order_alerts", JSON.stringify(nextSeenOrderIds));
    setNewOrderToast(null);
  }

  async function updateNotificationPayment(order, paymentStatus) {
    setNotificationStatus("saving");

    try {
      const updatedOrder = await updateAdminOrderPayment(
        order.id,
        {
          paymentStatus,
          orderStatus:
            paymentStatus === "paid"
              ? "confirmed"
              : paymentStatus === "failed"
                ? "cancelled"
                : order.orderStatus,
        },
        token
      );

      setAdminOrders((currentOrders) =>
        currentOrders.map((currentOrder) =>
          currentOrder.id === updatedOrder.id ? updatedOrder : currentOrder
        )
      );
    } catch {
      // Header notifications stay quiet; the admin page still shows detailed order errors.
    } finally {
      setNotificationStatus("idle");
    }
  }

  return (
    <header className="sticky top-0 z-50 border-b border-[#ead8ce] bg-white/90 px-[clamp(10px,3vw,28px)] py-2 shadow-[0_8px_24px_rgba(143,86,62,0.08)] backdrop-blur-xl print:hidden">
      <div className="mx-auto flex max-w-[1360px] items-center gap-3">
        <button
          className="brand flex min-w-max cursor-pointer items-center gap-2 py-1 text-[#9b5f45] transition duration-300 hover:-translate-y-0.5"
          type="button"
          onClick={() => navigateTo("/")}
          aria-label="GlowNest home"
        >
          <img
            className="h-10 w-10 rounded-full object-cover shadow-[0_6px_16px_rgba(39,27,22,0.16)]"
            src="/assets/glownest-logo.png"
            alt="GlowNest logo"
          />
          <span className="font-serif text-[1.15rem] font-bold sm:text-[1.35rem]">
            GlowNest
          </span>
        </button>

        <nav
          className="-my-2 ml-auto flex min-w-0 items-center justify-start gap-1 overflow-x-auto py-2 text-[#6f5d54]"
          aria-label="Main navigation"
        >
          <NavLink icon={PerfumeBottleIcon} page={page} path="/perfumes">
            Perfumes
          </NavLink>
          <NavLink icon={SerumBottleIcon} page={page} path="/cosmetics">
            Cosmetics
          </NavLink>
          <button
            className="inline-flex min-h-10 cursor-pointer items-center justify-center gap-2 rounded-md border border-transparent px-3 text-sm font-extrabold text-[#6f5d54] transition duration-300 hover:-translate-y-0.5 hover:border-[#ead8ce] hover:bg-[#fff8f3] hover:text-[#9b5f45]"
            type="button"
            onClick={() => navigateToSection("offers")}
          >
            <BadgePercent aria-hidden="true" size={16} strokeWidth={2.4} />
            Offers
          </button>
          <button
            className="inline-flex min-h-10 cursor-pointer items-center justify-center gap-2 rounded-md border border-transparent px-3 text-sm font-extrabold text-[#6f5d54] transition duration-300 hover:-translate-y-0.5 hover:border-[#ead8ce] hover:bg-[#fff8f3] hover:text-[#9b5f45]"
            type="button"
            onClick={() => navigateToSection("contact")}
          >
            <Send aria-hidden="true" size={16} strokeWidth={2.4} />
            Contact
          </button>
        </nav>

        <div className="-my-2 flex min-w-max items-center gap-1.5 py-2">
        {user ? (
          <>
            {user.role === "admin" && (
              <div className="relative">
                <button
                  aria-label="Admin notifications"
                  className="relative inline-flex min-h-10 cursor-pointer items-center justify-center rounded-md border border-[#ead8ce] bg-white px-3 font-bold text-[#6f5d54] shadow-[0_6px_16px_rgba(143,86,62,0.08)] transition duration-300 hover:-translate-y-0.5 hover:bg-[#fff8f3] hover:text-[#9b5f45]"
                  type="button"
                  onClick={() => setNotificationsOpen((isOpen) => !isOpen)}
                >
                  <Bell aria-hidden="true" size={18} strokeWidth={2.4} />
                  {hasUnreadNotifications && (
                    <span className="absolute right-2 top-2 h-2.5 w-2.5 rounded-full bg-[#c04c4c] ring-2 ring-white" />
                  )}
                </button>
                {newOrderToast && (
                  <div className="fixed right-5 top-[72px] z-60 w-[min(92vw,340px)] rounded-lg border border-[#ead8ce] bg-white px-4 py-3 shadow-[0_22px_60px_rgba(39,27,22,0.18)]">
                    <p className="text-xs font-extrabold uppercase text-[#d7a17c]">New order</p>
                    <h3 className="mt-1 text-lg font-extrabold text-[#271b16]">You have a new order</h3>
                    <p className="mt-1 text-sm font-bold text-[#6f5d54]">
                      {newOrderToast.customerName} | {formatPrice(newOrderToast.total)}
                    </p>
                  </div>
                )}
                {notificationsOpen && (
                  <div className="absolute right-0 top-[calc(100%+10px)] z-50 w-[min(92vw,390px)] rounded-lg border border-[#ead8ce] bg-white p-4 shadow-[0_22px_60px_rgba(39,27,22,0.18)]">
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-sm font-extrabold uppercase text-[#d7a17c]">Order Notifications</p>
                      <button
                        className="cursor-pointer rounded-md px-2 py-1 text-sm font-bold text-[#8f563e]"
                        type="button"
                        onClick={() => {
                          setNotificationsOpen(false);
                          markOrdersSeen();
                        }}
                      >
                        Close
                      </button>
                    </div>
                    <div className="mt-3 grid max-h-[360px] gap-3 overflow-auto">
                      {newOrderAlerts.length === 0 && pendingOnlineOrders.length === 0 ? (
                        <p className="rounded-md bg-[#fff8f3] px-3 py-3 text-sm font-bold text-[#6f5d54]">
                          No new order alerts right now.
                        </p>
                      ) : (
                        <>
                        {newOrderAlerts.map((order) => (
                          <article className="rounded-md border border-[#ead8ce] bg-[#fff8f3] p-3" key={`new-${order.id}`}>
                            <p className="text-xs font-extrabold uppercase text-[#d7a17c]">
                              New order received
                            </p>
                            <h3 className="mt-1 font-extrabold text-[#271b16]">
                              {order.customerName} | {formatPrice(order.total)}
                            </h3>
                            <p className="mt-1 text-sm font-bold text-[#6f5d54]">
                              {order.customerPhone} | {formatDateTime(order.createdAt)}
                            </p>
                          </article>
                        ))}
                        {pendingOnlineOrders.map((order) => (
                          <article className="rounded-md border border-[#f1c8c8] bg-[#fffafa] p-3" key={`payment-${order.id}`}>
                            <p className="text-xs font-extrabold uppercase text-[#d7a17c]">
                              Pending online payment | {order.orderNumber}
                            </p>
                            <h3 className="mt-1 font-extrabold text-[#271b16]">
                              {order.customerName} | {formatPrice(order.total)}
                            </h3>
                            <p className="mt-1 text-sm font-bold text-[#6f5d54]">
                              {order.customerPhone} | {formatDateTime(order.createdAt)}
                            </p>
                            <div className="mt-3 flex flex-wrap gap-2">
                              <button
                                className="inline-flex min-h-9 cursor-pointer items-center gap-2 rounded-md bg-[#2f8b5b] px-3 text-sm font-bold text-white disabled:opacity-60"
                                disabled={notificationStatus === "saving"}
                                type="button"
                                onClick={() => updateNotificationPayment(order, "paid")}
                              >
                                <CheckCircle2 aria-hidden="true" size={15} />
                                Mark Paid
                              </button>
                              <button
                                className="inline-flex min-h-9 cursor-pointer items-center gap-2 rounded-md bg-[#c04c4c] px-3 text-sm font-bold text-white disabled:opacity-60"
                                disabled={notificationStatus === "saving"}
                                type="button"
                                onClick={() => updateNotificationPayment(order, "failed")}
                              >
                                <XCircle aria-hidden="true" size={15} />
                                Mark Failed
                              </button>
                            </div>
                          </article>
                        ))}
                        </>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}
            <button
              className={`relative inline-flex min-h-10 cursor-pointer items-center justify-center gap-2 rounded-md border border-[#ead8ce] bg-white px-3 font-bold shadow-[0_6px_16px_rgba(143,86,62,0.08)] transition duration-300 hover:-translate-y-0.5 hover:bg-[#fff8f3] sm:px-3.5 ${
                page === "account" ? "text-[#9b5f45]" : "text-[#6f5d54]"
              }`}
              type="button"
              onClick={() => navigateTo("/account")}
            >
              <UserRound aria-hidden="true" size={18} strokeWidth={2.4} />
              <span className="hidden sm:inline">My Account</span>
              {user?.isVerified ? (
                <span
                  className="flex h-4.5 w-4.5 shrink-0 items-center justify-center rounded-full bg-[#27ae60] text-white shadow-[0_0_8px_rgba(39,174,96,0.5)]"
                  title="Verified Account"
                >
                  <Check size={11} strokeWidth={3.5} />
                </span>
              ) : (
                <span
                  className="flex h-4.5 w-4.5 shrink-0 items-center justify-center text-[#e67e22]"
                  title="Pending Verification"
                >
                  <AlertTriangle size={15} strokeWidth={2.4} />
                </span>
              )}
            </button>
            <button
              className={`relative inline-flex min-h-10 cursor-pointer items-center justify-center gap-2 rounded-md border border-[#ead8ce] bg-white px-3 font-bold shadow-[0_6px_16px_rgba(143,86,62,0.08)] transition duration-300 hover:-translate-y-0.5 hover:bg-[#fff8f3] sm:px-3.5 ${
                page === "orders" ? "text-[#9b5f45]" : "text-[#6f5d54]"
              }`}
              aria-label={
                unreadCustomerNotifications.length > 0
                  ? `My Orders, ${unreadCustomerNotifications.length} new update${
                      unreadCustomerNotifications.length === 1 ? "" : "s"
                    }`
                  : "My Orders"
              }
              type="button"
              onClick={() => navigateTo("/orders")}
            >
              <ReceiptText aria-hidden="true" size={18} strokeWidth={2.4} />
              <span className="hidden xl:inline">My Orders</span>
              {unreadCustomerNotifications.length > 0 && page !== "orders" && (
                <span
                  aria-hidden="true"
                  className="absolute right-1.5 top-1.5 h-2.5 w-2.5 rounded-full bg-[#d52f45] shadow-[0_0_0_2px_white,0_0_10px_rgba(213,47,69,0.45)]"
                />
              )}
            </button>
            <button
              className="inline-flex min-h-10 cursor-pointer items-center justify-center gap-2 rounded-md border border-[#ead8ce] bg-white px-3 font-bold text-[#6f5d54] shadow-[0_6px_16px_rgba(143,86,62,0.08)] transition duration-300 hover:-translate-y-0.5 hover:bg-[#fff8f3] hover:text-[#9b5f45] sm:px-3.5"
              type="button"
              onClick={onLogout}
              title={`Logged in as ${user.name}`}
            >
              <LogOut aria-hidden="true" size={18} strokeWidth={2.4} />
              <span className="hidden sm:inline">Logout</span>
            </button>
          </>
        ) : (
          <button
            className={`inline-flex min-h-10 cursor-pointer items-center justify-center gap-2 rounded-md border border-[#ead8ce] bg-white px-3 font-bold shadow-[0_6px_16px_rgba(143,86,62,0.08)] transition duration-300 hover:-translate-y-0.5 hover:bg-[#fff8f3] sm:px-3.5 ${
              page === "login" ? "text-[#9b5f45]" : "text-[#6f5d54]"
            }`}
            type="button"
            onClick={() => navigateTo("/login")}
          >
            <UserRound aria-hidden="true" size={18} strokeWidth={2.4} />
            <span className="hidden sm:inline">Login</span>
          </button>
        )}
        <button
          className="cart-target inline-flex min-h-10 cursor-pointer items-center justify-center gap-2 rounded-md bg-linear-to-br from-[#c88763] to-[#8f563e] px-3.5 font-bold text-white shadow-[0_8px_20px_rgba(143,86,62,0.28)] transition duration-300 hover:-translate-y-0.5 hover:shadow-[0_14px_28px_rgba(143,86,62,0.38)] sm:px-4"
          type="button"
          onClick={onCartClick}
        >
          <ShoppingCart aria-hidden="true" size={18} strokeWidth={2.4} />
          <span>Cart</span>
          {cartCount > 0 && (
            <span className="rounded-full bg-white px-2 py-0.5 text-xs text-[#8f563e]">{cartCount}</span>
          )}
        </button>
        </div>
      </div>
    </header>
  );
}
