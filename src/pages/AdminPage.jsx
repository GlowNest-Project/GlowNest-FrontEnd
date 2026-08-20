import { useEffect, useMemo, useRef, useState } from "react";
import {
  Bell,
  Boxes,
  CheckCircle2,
  CreditCard,
  Edit3,
  ImageUp,
  LogOut,
  PackageCheck,
  PackageX,
  ReceiptText,
  RefreshCw,
  Save,
  ShieldCheck,
  Trash2,
  Truck,
} from "lucide-react";
import {
  createAdminProduct,
  deleteAdminNotification,
  deleteAdminOrder,
  getAdminNotifications,
  getAdminOrders,
  getAdminProducts,
  markAdminNotificationsRead,
  updateAdminOrderPayment,
  updateAdminOrderStatus,
  updateAdminProduct,
  updateAdminProductStatus,
  uploadAdminProductImage,
} from "../utils/api";
import { formatPrice } from "../utils/format";
import { getDiscountPricing } from "../utils/discount";
import { useDiscountClock } from "../hooks/useDiscountClock";
import { navigateTo } from "../utils/navigation";

const emptyForm = {
  category: "perfumes",
  name: "",
  brand: "",
  type: "Perfume",
  concentration: "",
  gender: "",
  volume: "",
  fragranceFamily: "",
  releaseYear: "",
  perfumers: "",
  priceValue: "",
  discountEnabled: false,
  discountType: "percentage",
  discountTarget: "both",
  discountPercent: "",
  discountAmount: "",
  discountStartAt: "",
  discountEndAt: "",
  decantPriceValue: "",
  decantSize: "10mL",
  kokoPay: "",
  shortDescription: "",
  detailDescription: "",
  image: "",
  detailImage: "",
  popImage: "",
  stockStatus: "in_stock",
  stockQuantity: 1,
  isActive: true,
  topNotes: "",
  heartNotes: "",
  baseNotes: "",
  accords: "",
  bestFor: "",
  keyIngredients: "",
  mainBenefits: "",
  skinType: "",
  skinConcerns: "",
  howToUse: "",
};

function emptyFormForCategory(category) {
  const isCosmetic = category === "cosmetics";

  return {
    ...emptyForm,
    category: isCosmetic ? "cosmetics" : "perfumes",
    type: isCosmetic ? "Cosmetic" : "Perfume",
    discountTarget: isCosmetic ? "full" : "both",
    decantSize: isCosmetic ? "" : "10mL",
  };
}

function fieldValue(product, fieldName) {
  if (fieldName === "category") return product.category || "perfumes";
  if (fieldName === "priceValue") return product.originalPriceValue || product.priceValue || "";
  if (fieldName === "discountEnabled") return product.discountEnabled === true;
  if (fieldName === "discountType") return product.discountType || "percentage";
  if (fieldName === "discountTarget") return product.discountTarget || "both";
  if (fieldName === "discountPercent") return product.discountPercent || "";
  if (fieldName === "discountAmount") return product.discountAmount || "";
  if (fieldName === "discountStartAt") return toDateInput(product.discountStartAt);
  if (fieldName === "discountEndAt") return toDateInput(product.discountEndAt, -1);
  if (fieldName === "decantPriceValue") {
    return product.decant?.originalPriceValue || product.decant?.priceValue || "";
  }
  if (fieldName === "decantSize") return product.decant?.size || "10mL";
  if (fieldName === "kokoPay") return product.kokoPay || "";
  if (fieldName === "shortDescription") return product.shortDescription || "";
  if (fieldName === "detailDescription") return product.detailDescription || "";
  if (fieldName === "fragranceFamily") return product.fragranceFamily || "";
  if (fieldName === "releaseYear") return product.releaseYear || "";
  if (fieldName === "image") return product.image || "";
  if (fieldName === "detailImage") return product.detailImage || "";
  if (fieldName === "popImage") return product.popImage || "";
  if (fieldName === "stockStatus") return product.isInStock ? "in_stock" : "out_of_stock";
  if (fieldName === "stockQuantity") return product.stockQuantity || 0;
  if (fieldName === "isActive") return product.isActive !== false;
  if (fieldName === "topNotes") {
    return product.notes?.find((note) => note.label === "Top Notes")?.value || "";
  }
  if (fieldName === "heartNotes") {
    return product.notes?.find((note) => ["Heart Notes", "Middle Notes"].includes(note.label))?.value || "";
  }
  if (fieldName === "baseNotes") {
    return product.notes?.find((note) => note.label === "Base Notes")?.value || "";
  }
  if (fieldName === "accords") return product.accords?.join(", ") || "";
  if (fieldName === "bestFor") return product.bestFor?.join(", ") || "";
  return product[fieldName] || "";
}

function toDateInput(value, dayAdjustment = 0) {
  if (!value) return "";
  const date = new Date(value);
  date.setDate(date.getDate() + dayAdjustment);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(
    date.getDate()
  ).padStart(2, "0")}`;
}

function formFromProduct(product) {
  return Object.keys(emptyForm).reduce(
    (form, fieldName) => ({ ...form, [fieldName]: fieldValue(product, fieldName) }),
    {}
  );
}

function AdminField({ label, name, onChange, type = "text", value, ...inputProps }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-extrabold uppercase text-[#d7a17c]">{label}</span>
      <input
        className="min-h-11 w-full rounded-md border border-[#ead8ce] bg-white px-3 font-semibold text-[#271b16] outline-none transition focus:border-[#c88763] focus:ring-4 focus:ring-[#f7e4d8]"
        name={name}
        onChange={onChange}
        type={type}
        value={value}
        {...inputProps}
      />
    </label>
  );
}

function AdminTextarea({ label, name, onChange, value }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-extrabold uppercase text-[#d7a17c]">{label}</span>
      <textarea
        className="min-h-24 w-full rounded-md border border-[#ead8ce] bg-white px-3 py-2 font-semibold text-[#271b16] outline-none transition focus:border-[#c88763] focus:ring-4 focus:ring-[#f7e4d8]"
        name={name}
        onChange={onChange}
        value={value}
      />
    </label>
  );
}

function AdminImageUpload({ label, name, onFileChange, onUrlChange, uploading, value }) {
  return (
    <div className="rounded-lg border border-[#ead8ce] bg-[#fff8f3] p-3">
      <span className="mb-2 block text-xs font-extrabold uppercase text-[#d7a17c]">{label}</span>
      <div className="grid gap-3 sm:grid-cols-[140px_minmax(0,1fr)]">
        {value ? (
          <img className="h-32 w-full rounded-md border border-[#ead8ce] bg-white object-cover" src={value} alt={label} />
        ) : (
          <div className="flex h-32 items-center justify-center rounded-md border border-dashed border-[#d8b49f] bg-white text-xs font-bold text-[#8f563e]">
            No image
          </div>
        )}
        <div className="grid content-start gap-2">
          <label className="inline-flex min-h-11 cursor-pointer items-center justify-center gap-2 rounded-md bg-linear-to-br from-[#c88763] to-[#8f563e] px-4 font-bold text-white shadow-sm">
            <ImageUp aria-hidden="true" size={18} />
            {uploading ? "Uploading..." : "Choose Image"}
            <input
              accept="image/*"
              className="sr-only"
              disabled={uploading}
              onChange={(event) => onFileChange(name, event.target.files?.[0])}
              type="file"
            />
          </label>
          <input
            className="min-h-10 w-full rounded-md border border-[#ead8ce] bg-white px-3 text-xs font-semibold text-[#6f5d54] outline-none transition focus:border-[#c88763] focus:ring-4 focus:ring-[#f7e4d8]"
            name={name}
            onChange={onUrlChange}
            placeholder="/uploads/products/image.png"
            value={value}
          />
        </div>
      </div>
    </div>
  );
}

function formatDateTime(value) {
  if (!value) return "Not available";
  return new Intl.DateTimeFormat("en-LK", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function formatDiscountDay(value, dayAdjustment = 0) {
  if (!value) return "Not available";
  const date = new Date(value);
  date.setDate(date.getDate() + dayAdjustment);
  return new Intl.DateTimeFormat("en-LK", { dateStyle: "medium" }).format(date);
}

function paymentLabel(method) {
  if (method === "card") return "Online card payment";
  if (method === "cash_on_delivery") return "Cash on delivery";
  if (method === "koko_pay") return "KOKO Pay";
  return method || "Payment";
}

function orderStatusLabel(status) {
  if (status === "delivered") return "Order delivered";
  if (status === "cancelled") return "Order cancelled";
  return "Order received";
}

function statusClass(status) {
  if (status === "paid" || status === "confirmed" || status === "delivered") {
    return "bg-[#effaf4] text-[#2f8b5b]";
  }

  if (status === "failed" || status === "cancelled") {
    return "bg-[#fff0f0] text-[#c04c4c]";
  }

  return "bg-[#fff8f3] text-[#9b5f45]";
}

function ProductDiscountSummary({ now, product }) {
  const pricing = getDiscountPricing(product, now);

  if (pricing.status === "none") return null;

  const label =
    pricing.status === "active"
      ? pricing.discountType === "fixed_amount"
        ? `${formatPrice(pricing.amount)} off now`
        : `${pricing.percentage}% off now`
      : pricing.status === "upcoming"
        ? pricing.discountType === "fixed_amount"
          ? `${formatPrice(pricing.amount)} off scheduled`
          : `${pricing.percentage}% off scheduled`
        : "Discount expired";
  const targetLabel =
    product.discountTarget === "full"
      ? "Full bottle"
      : product.discountTarget === "decant"
        ? "Decant"
        : "Full bottle + decant";

  return (
    <div className="mt-2 flex flex-wrap items-center gap-2 text-xs font-bold">
      <span
        className={`rounded-full px-2.5 py-1 ${
          pricing.status === "active"
            ? "bg-[#fff0f0] text-[#c04c4c]"
            : pricing.status === "upcoming"
              ? "bg-[#fff6dc] text-[#9a6a00]"
              : "bg-[#f3efed] text-[#806f67]"
        }`}
      >
        {label}
      </span>
      <span className="rounded-full bg-[#fff8f3] px-2.5 py-1 text-[#8f563e]">
        {targetLabel}
      </span>
      <span className="text-[#6f5d54]">
        {formatDiscountDay(product.discountStartAt)} – {formatDiscountDay(product.discountEndAt, -1)}
      </span>
    </div>
  );
}

export default function AdminPage({ onLogout, token, user }) {
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [popupNotification, setPopupNotification] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [activeProductCategory, setActiveProductCategory] = useState("perfumes");
  const [editingProductId, setEditingProductId] = useState(null);
  const [activeSection, setActiveSection] = useState("products");
  const [activeOrderView, setActiveOrderView] = useState("new");
  const [status, setStatus] = useState("loading");
  const [ordersStatus, setOrdersStatus] = useState("idle");
  const [uploadingField, setUploadingField] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [orderMessage, setOrderMessage] = useState("");
  const [orderError, setOrderError] = useState("");
  const notificationIdsRef = useRef(new Set());
  const discountClock = useDiscountClock(products);

  const productCounts = useMemo(
    () =>
      products.reduce(
        (counts, product) => ({
          ...counts,
          [product.category]: (counts[product.category] || 0) + 1,
        }),
        {}
      ),
    [products]
  );

  const visibleProducts = useMemo(
    () => products.filter((product) => product.category === activeProductCategory),
    [activeProductCategory, products]
  );

  const pendingOnlineOrders = useMemo(
    () =>
      orders.filter(
        (order) => order.paymentMethod === "card" && order.paymentStatus === "pending"
      ),
    [orders]
  );

  const unreadNotificationCount = useMemo(
    () => notifications.filter((notification) => !notification.isRead).length,
    [notifications]
  );

  const totalOrderValue = useMemo(
    () => orders.reduce((total, order) => total + Number(order.total || 0), 0),
    [orders]
  );

  const newOrders = useMemo(
    () => orders.filter((order) => order.orderStatus !== "delivered" && order.orderStatus !== "cancelled"),
    [orders]
  );

  const deliveredOrders = useMemo(
    () => orders.filter((order) => order.orderStatus === "delivered"),
    [orders]
  );

  const activeOrderOrders = useMemo(() => {
    if (activeOrderView === "delivered") return deliveredOrders;
    if (activeOrderView === "all") return orders;
    return newOrders;
  }, [activeOrderView, deliveredOrders, newOrders, orders]);

  const activeOrderHeading = useMemo(() => {
    if (activeOrderView === "delivered") {
      return { title: "Delivered Orders", subtitle: "Completed deliveries" };
    }
    if (activeOrderView === "all") {
      return { title: "All Orders", subtitle: "Complete order history" };
    }
    return { title: "New Orders", subtitle: "Order received queue" };
  }, [activeOrderView]);

  useEffect(() => {
    if (!token || user?.role !== "admin") {
      setStatus("forbidden");
      return;
    }

    let cancelled = false;
    setStatus("loading");

    Promise.all([getAdminProducts(token), getAdminOrders(token), getAdminNotifications(token)])
      .then(([productData, orderData, notificationData]) => {
        if (!cancelled) {
          setProducts(productData);
          setOrders(orderData);
          setNotifications(notificationData);
          notificationIdsRef.current = new Set(notificationData.map((notification) => notification.id));
          setStatus("ready");
        }
      })
      .catch((loadError) => {
        if (!cancelled) {
          setError(loadError.message);
          setStatus("error");
        }
      });

    return () => {
      cancelled = true;
    };
  }, [token, user?.role]);

  useEffect(() => {
    if (!token || user?.role !== "admin") {
      return undefined;
    }

    const intervalId = window.setInterval(() => {
      Promise.all([getAdminOrders(token), getAdminProducts(token), getAdminNotifications(token)])
        .then(([orderData, productData, notificationData]) => {
          setOrders(orderData);
          setProducts(productData);
          const newNotification = notificationData.find(
            (notification) => !notificationIdsRef.current.has(notification.id)
          );
          notificationIdsRef.current = new Set(notificationData.map((notification) => notification.id));
          setNotifications(notificationData);
          if (newNotification) setPopupNotification(newNotification);
        })
        .catch(() => {});
    }, 15000);

    return () => window.clearInterval(intervalId);
  }, [token, user?.role]);

  useEffect(() => {
    if (!popupNotification) return undefined;

    const timerId = window.setTimeout(() => setPopupNotification(null), 7000);
    return () => window.clearTimeout(timerId);
  }, [popupNotification]);

  function updateField(event) {
    const { checked, name, type, value } = event.target;

    if (name === "category") {
      selectProductCategory(value);
      return;
    }

    setForm((currentForm) => {
      const nextValue = type === "checkbox" ? checked : value;

      return {
        ...currentForm,
        [name]: nextValue,
        ...(name === "discountEnabled" && !checked
          ? {
              discountType: "percentage",
              discountTarget: currentForm.category === "cosmetics" ? "full" : "both",
              discountPercent: "",
              discountAmount: "",
              discountStartAt: "",
              discountEndAt: "",
            }
          : {}),
      };
    });
  }

  function resetForm() {
    setEditingProductId(null);
    setForm(emptyFormForCategory(activeProductCategory));
    setMessage("");
    setError("");
  }

  function selectProductCategory(category) {
    setActiveProductCategory(category);
    setEditingProductId(null);
    setForm(emptyFormForCategory(category));
    setMessage("");
    setError("");
  }

  async function saveProduct(event) {
    event.preventDefault();
    setStatus("saving");
    setError("");
    setMessage("");

    try {
      const savedProduct = editingProductId
        ? await updateAdminProduct(editingProductId, form, token)
        : await createAdminProduct(form, token);

      setProducts((currentProducts) => {
        const exists = currentProducts.some((product) => product.id === savedProduct.id);

        if (exists) {
          return currentProducts.map((product) =>
            product.id === savedProduct.id ? savedProduct : product
          );
        }

        return [savedProduct, ...currentProducts];
      });
      setMessage(editingProductId ? "Product updated." : "Product uploaded.");
      setEditingProductId(null);
      setActiveProductCategory(savedProduct.category);
      setForm(emptyFormForCategory(savedProduct.category));
      setStatus("ready");
    } catch (saveError) {
      setError(saveError.message);
      setStatus("ready");
    }
  }

  async function uploadImage(fieldName, file) {
    if (!file) {
      return;
    }

    setUploadingField(fieldName);
    setError("");
    setMessage("");

    try {
      const imageUrl = await uploadAdminProductImage(file, token);
      setForm((currentForm) => ({ ...currentForm, [fieldName]: imageUrl }));
      setMessage(`${fieldName === "image" ? "Main image" : "Detail image"} uploaded.`);
    } catch (uploadError) {
      setError(uploadError.message);
    } finally {
      setUploadingField("");
    }
  }

  async function changeStockStatus(product, nextStatus) {
    setError("");
    setMessage("");

    try {
      const updatedProducts = await updateAdminProductStatus(
        product.id,
        {
          stockStatus: nextStatus,
          stockQuantity: nextStatus === "in_stock" ? product.stockQuantity || 1 : 0,
          isActive: product.isActive,
        },
        token
      );
      setProducts(updatedProducts);
      setMessage(`${product.name} marked ${nextStatus === "in_stock" ? "in stock" : "out of stock"}.`);
    } catch (stockError) {
      setError(stockError.message);
    }
  }

  async function refreshOrders() {
    setOrdersStatus("loading");
    setOrderError("");
    setOrderMessage("");

    try {
      setOrders(await getAdminOrders(token));
      setOrderMessage("Orders refreshed.");
    } catch (loadError) {
      setOrderError(loadError.message);
    } finally {
      setOrdersStatus("idle");
    }
  }

  async function openNotifications() {
    setActiveSection("notifications");
    setPopupNotification(null);
    setNotifications((current) =>
      current.map((notification) => ({ ...notification, isRead: true }))
    );

    try {
      const updatedNotifications = await markAdminNotificationsRead(token);
      setNotifications(updatedNotifications);
      notificationIdsRef.current = new Set(
        updatedNotifications.map((notification) => notification.id)
      );
    } catch (notificationError) {
      setError(notificationError.message);
    }
  }

  async function removeNotification(notificationId) {
    try {
      const updatedNotifications = await deleteAdminNotification(notificationId, token);
      setNotifications(updatedNotifications);
      notificationIdsRef.current = new Set(
        updatedNotifications.map((notification) => notification.id)
      );
    } catch (notificationError) {
      setError(notificationError.message);
    }
  }

  async function updatePayment(order, paymentStatus) {
    setOrdersStatus("saving");
    setOrderError("");
    setOrderMessage("");

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
      setOrders((currentOrders) =>
        currentOrders.map((currentOrder) =>
          currentOrder.id === updatedOrder.id ? updatedOrder : currentOrder
        )
      );
      setOrderMessage(
        `${updatedOrder.orderNumber} marked ${paymentStatus === "paid" ? "paid" : paymentStatus}.`
      );
    } catch (updateError) {
      setOrderError(updateError.message);
    } finally {
      setOrdersStatus("idle");
    }
  }

  async function updateOrderStatus(order, orderStatus) {
    setOrdersStatus("saving");
    setOrderError("");
    setOrderMessage("");

    try {
      const updatedOrder = await updateAdminOrderStatus(order.id, { orderStatus }, token);
      setOrders((currentOrders) =>
        currentOrders.map((currentOrder) =>
          currentOrder.id === updatedOrder.id ? updatedOrder : currentOrder
        )
      );
      setOrderMessage(`${updatedOrder.orderNumber} marked ${orderStatusLabel(updatedOrder.orderStatus)}.`);
    } catch (updateError) {
      setOrderError(updateError.message);
    } finally {
      setOrdersStatus("idle");
    }
  }

  async function deleteOrder(order) {
    if (!window.confirm(`Delete order ${order.orderNumber}? This cannot be undone.`)) {
      return;
    }

    setOrdersStatus("saving");
    setOrderError("");
    setOrderMessage("");

    try {
      setOrders(await deleteAdminOrder(order.id, token));
      setOrderMessage(`${order.orderNumber} deleted.`);
    } catch (deleteError) {
      setOrderError(deleteError.message);
    } finally {
      setOrdersStatus("idle");
    }
  }

  function renderOrderCard(order) {
    return (
      <article
        className="rounded-lg border border-[#ead8ce] bg-white p-5 shadow-[0_14px_34px_rgba(143,86,62,0.07)]"
        key={order.id}
      >
        <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_auto]">
          <div>
            <p className="text-xs font-extrabold uppercase text-[#d7a17c]">
              {order.orderNumber} | {formatDateTime(order.createdAt)}
            </p>
            <h3 className="mt-1 text-2xl font-extrabold text-[#271b16]">{order.customerName}</h3>
            <p className="mt-1 text-sm font-bold text-[#6f5d54]">
              {order.customerPhone} | {order.customerEmail || "No email"}
            </p>
            <p className="mt-1 text-sm text-[#6f5d54]">{order.deliveryAddress || "No address added"}</p>
          </div>
          <div className="flex flex-wrap items-start gap-2 lg:justify-end">
            <span className={`rounded-full px-3 py-1 text-sm font-extrabold ${statusClass(order.paymentStatus)}`}>
              Payment: {order.paymentStatus}
            </span>
            <span className={`rounded-full px-3 py-1 text-sm font-extrabold ${statusClass(order.orderStatus)}`}>
              {orderStatusLabel(order.orderStatus)}
            </span>
          </div>
        </div>

        <div className="mt-4 grid gap-2 rounded-md bg-[#fff8f3] p-4">
          {order.items.map((item) => (
            <div className="grid gap-2 text-sm font-bold text-[#5f4c43] sm:grid-cols-[minmax(0,1fr)_80px_130px]" key={item.id}>
              <span>{item.productName}</span>
              <span>Qty {item.quantity}</span>
              <span>{formatPrice(item.lineTotal)}</span>
            </div>
          ))}
        </div>

        <div className="mt-4 ml-auto grid max-w-[420px] gap-2 rounded-md border border-[#ead8ce] bg-white p-4 text-sm">
          <div className="flex items-center justify-between gap-4 text-[#6f5d54]">
            <span>Original subtotal</span>
            <strong className="text-[#271b16]">{formatPrice(order.subtotal)}</strong>
          </div>
          {order.discount > 0 && (
            <>
              <div className="flex items-center justify-between gap-4 rounded-md bg-[#effaf4] px-3 py-2 text-[#2f8b5b]">
                <span className="font-extrabold">Discount applied</span>
                <strong>-{formatPrice(order.discount)}</strong>
              </div>
              <div className="flex items-center justify-between gap-4 text-[#6f5d54]">
                <span>After discount</span>
                <strong className="text-[#271b16]">{formatPrice(order.subtotal - order.discount)}</strong>
              </div>
            </>
          )}
          <div className="flex items-center justify-between gap-4 text-[#6f5d54]">
            <span>Delivery</span>
            <strong className="text-[#271b16]">{formatPrice(order.deliveryFee)}</strong>
          </div>
          <div className="flex items-center justify-between gap-4 border-t border-[#ead8ce] pt-2 text-base font-extrabold text-[#9b5f45]">
            <span>Final total</span>
            <strong>{formatPrice(order.total)}</strong>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
          <p className="inline-flex items-center gap-2 font-bold text-[#6f5d54]">
            <CreditCard aria-hidden="true" size={18} />
            {paymentLabel(order.paymentMethod)} | Total {formatPrice(order.total)}
          </p>
          <div className="flex flex-wrap gap-2">
            <button
              className="inline-flex min-h-10 cursor-pointer items-center gap-2 rounded-md border border-[#ead8ce] bg-white px-4 font-bold text-[#8f563e] disabled:opacity-60"
              disabled={ordersStatus === "saving" || order.orderStatus === "confirmed"}
              type="button"
              onClick={() => updateOrderStatus(order, "confirmed")}
            >
              <CheckCircle2 aria-hidden="true" size={17} />
              Order Received
            </button>
            <button
              className="inline-flex min-h-10 cursor-pointer items-center gap-2 rounded-md border border-[#ead8ce] bg-white px-4 font-bold text-[#8f563e] disabled:opacity-60"
              disabled={ordersStatus === "saving" || order.orderStatus === "packed"}
              type="button"
              onClick={() => updateOrderStatus(order, "packed")}
            >
              <PackageCheck aria-hidden="true" size={17} />
              Packed
            </button>
            <button
              className="inline-flex min-h-10 cursor-pointer items-center gap-2 rounded-md bg-[#2f8b5b] px-4 font-bold text-white disabled:opacity-60"
              disabled={ordersStatus === "saving" || order.orderStatus === "delivered"}
              type="button"
              onClick={() => updateOrderStatus(order, "delivered")}
            >
              <Truck aria-hidden="true" size={17} />
              Order Delivered
            </button>
            <button
              className="min-h-10 cursor-pointer rounded-md border border-[#ead8ce] bg-white px-4 font-bold text-[#2f8b5b] disabled:opacity-60"
              disabled={ordersStatus === "saving" || order.paymentStatus === "paid"}
              type="button"
              onClick={() => updatePayment(order, "paid")}
            >
              Mark Paid
            </button>
            <button
              className="min-h-10 cursor-pointer rounded-md border border-[#ead8ce] bg-white px-4 font-bold text-[#c04c4c] disabled:opacity-60"
              disabled={ordersStatus === "saving" || order.paymentStatus === "failed"}
              type="button"
              onClick={() => updatePayment(order, "failed")}
            >
              Mark Failed
            </button>
            <button
              className="inline-flex min-h-10 cursor-pointer items-center gap-2 rounded-md bg-[#c04c4c] px-4 font-bold text-white disabled:opacity-60"
              disabled={ordersStatus === "saving"}
              type="button"
              onClick={() => deleteOrder(order)}
            >
              <Trash2 aria-hidden="true" size={17} />
              Delete
            </button>
          </div>
        </div>
      </article>
    );
  }

  function renderOrderSection(title, subtitle, sectionOrders) {
    return (
      <div className="mt-6 rounded-lg border border-[#ead8ce] bg-[#fffdfb] p-5">
        <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-xs font-extrabold uppercase text-[#d7a17c]">{subtitle}</p>
            <h2 className="font-serif text-4xl text-[#9b5f45]">{title}</h2>
          </div>
          <span className="rounded-full bg-[#fff8f3] px-4 py-2 text-sm font-extrabold text-[#8f563e]">
            {sectionOrders.length} order{sectionOrders.length === 1 ? "" : "s"}
          </span>
        </div>
        <div className="grid gap-4">
          {sectionOrders.length === 0 ? (
            <p className="rounded-md bg-white px-4 py-4 font-bold text-[#6f5d54]">No orders in this section.</p>
          ) : (
            sectionOrders.map(renderOrderCard)
          )}
        </div>
      </div>
    );
  }

  if (status === "forbidden") {
    return (
      <main className="px-[clamp(18px,5vw,72px)] py-[clamp(72px,10vw,120px)]">
        <div className="mx-auto max-w-[620px] rounded-lg border border-[#ead8ce] bg-white p-8 text-center shadow-[0_18px_45px_rgba(143,86,62,0.09)]">
          <ShieldCheck className="mx-auto text-[#9b5f45]" size={42} />
          <h1 className="mt-4 font-serif text-5xl text-[#9b5f45]">Admin Login Required</h1>
          <p className="mt-3 leading-[1.7] text-[#6f5d54]">
            Login with an admin account to upload products and update stock.
          </p>
          <button
            className="mt-6 inline-flex min-h-11 cursor-pointer items-center justify-center rounded-md bg-linear-to-br from-[#c88763] to-[#8f563e] px-5 font-bold text-white"
            type="button"
            onClick={() => navigateTo("/admin")}
          >
            Go to Login
          </button>
        </div>
      </main>
    );
  }

  return (
    <main>
      <section className="bg-[linear-gradient(135deg,#ffffff_0%,#fff8f3_55%,#f7eee9_100%)] px-[clamp(18px,5vw,72px)] py-[clamp(54px,8vw,96px)]">
        <div className="mb-5 flex justify-end">
          <button
            className="inline-flex min-h-11 cursor-pointer items-center gap-2 rounded-md border border-[#ead8ce] bg-white px-5 font-bold text-[#8f563e] shadow-sm transition hover:bg-[#fff8f3]"
            type="button"
            onClick={onLogout}
          >
            <LogOut aria-hidden="true" size={18} />
            Admin Logout
          </button>
        </div>
        <p className="mb-4 text-base font-extrabold uppercase text-[#d7a17c] md:text-lg">
          GlowNest Admin
        </p>
        <h1 className="m-0 flex items-center gap-4 font-serif text-[clamp(3.5rem,10vw,7rem)] leading-[0.92] text-[#9b5f45]">
          {activeSection === "notifications" ? (
            <Bell aria-hidden="true" className="h-12 w-12 sm:h-16 sm:w-16" />
          ) : activeSection === "orders" ? (
            <ReceiptText aria-hidden="true" className="h-12 w-12 sm:h-16 sm:w-16" />
          ) : (
            <Boxes aria-hidden="true" className="h-12 w-12 sm:h-16 sm:w-16" />
          )}
          {activeSection === "notifications"
            ? "Notifications"
            : activeSection === "orders"
              ? "Orders"
              : "Products"}
        </h1>
        <p className="mt-6 max-w-[680px] text-base leading-[1.8] text-[#5f4c43] md:text-lg">
          {activeSection === "notifications"
            ? "See every new-order alert and remove notifications you no longer need."
            : activeSection === "orders"
            ? "View customer orders, track online payment notifications, and update payment status."
            : "Upload perfume and cosmetic items, update prices, and control in-stock or out-of-stock status."}
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <button
            className={`inline-flex min-h-11 cursor-pointer items-center gap-2 rounded-md px-5 font-bold transition ${
              activeSection === "products"
                ? "bg-[#9b5f45] text-white shadow-sm"
                : "border border-[#ead8ce] bg-white text-[#8f563e]"
            }`}
            type="button"
            onClick={() => setActiveSection("products")}
          >
            <Boxes aria-hidden="true" size={18} />
            Products
          </button>
          <button
            className={`inline-flex min-h-11 cursor-pointer items-center gap-2 rounded-md px-5 font-bold transition ${
              activeSection === "orders"
                ? "bg-[#9b5f45] text-white shadow-sm"
                : "border border-[#ead8ce] bg-white text-[#8f563e]"
            }`}
            type="button"
            onClick={() => setActiveSection("orders")}
          >
            <ReceiptText aria-hidden="true" size={18} />
            Orders
            {pendingOnlineOrders.length > 0 && (
              <span className="rounded-full bg-[#c04c4c] px-2 py-0.5 text-xs text-white">
                {pendingOnlineOrders.length}
              </span>
            )}
          </button>
          <button
            className={`relative inline-flex min-h-11 cursor-pointer items-center gap-2 rounded-md px-5 font-bold transition ${
              activeSection === "notifications"
                ? "bg-[#9b5f45] text-white shadow-sm"
                : "border border-[#ead8ce] bg-white text-[#8f563e]"
            }`}
            type="button"
            onClick={openNotifications}
          >
            <Bell aria-hidden="true" size={18} />
            Notifications
            {unreadNotificationCount > 0 && (
              <span className="rounded-full bg-[#c04c4c] px-2 py-0.5 text-xs text-white">
                {unreadNotificationCount}
              </span>
            )}
          </button>
        </div>

      </section>

      {activeSection === "products" && (
      <>
      <section className="grid gap-6 px-[clamp(18px,5vw,72px)] py-[clamp(42px,7vw,82px)] xl:grid-cols-[minmax(0,1fr)_420px]">
        <form
          className="rounded-lg border border-[#ead8ce] bg-white p-5 shadow-[0_18px_45px_rgba(143,86,62,0.08)]"
          onSubmit={saveProduct}
        >
          <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs font-extrabold uppercase text-[#d7a17c]">
                {editingProductId ? "Edit Product" : "Upload Product"}
              </p>
              <h2 className="font-serif text-4xl text-[#9b5f45]">
                {editingProductId ? "Update item" : "New item"}
              </h2>
            </div>
            {editingProductId && (
              <button
                className="min-h-10 cursor-pointer rounded-md border border-[#ead8ce] bg-white px-4 font-bold text-[#8f563e]"
                type="button"
                onClick={resetForm}
              >
                Cancel Edit
              </button>
            )}
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <label className="block">
              <span className="mb-1.5 block text-xs font-extrabold uppercase text-[#d7a17c]">
                Category
              </span>
              <select
                className="min-h-11 w-full rounded-md border border-[#ead8ce] bg-white px-3 font-semibold text-[#271b16] outline-none transition focus:border-[#c88763] focus:ring-4 focus:ring-[#f7e4d8]"
                name="category"
                onChange={updateField}
                value={form.category}
              >
                <option value="perfumes">Perfumes</option>
                <option value="cosmetics">Cosmetics</option>
              </select>
            </label>
            <AdminField label="Product name" name="name" onChange={updateField} value={form.name} />
            <AdminField label="Brand" name="brand" onChange={updateField} value={form.brand} />
            <AdminField label="Type" name="type" onChange={updateField} value={form.type} />
            <AdminField
              label={form.category === "cosmetics" ? "Price" : "Full bottle price"}
              name="priceValue"
              onChange={updateField}
              type="number"
              value={form.priceValue}
            />
            <label className="flex min-h-11 cursor-pointer items-center gap-3 rounded-md border border-[#ead8ce] bg-[#fff8f3] px-4 md:col-span-2">
              <input
                checked={form.discountEnabled}
                className="h-5 w-5 accent-[#9b5f45]"
                name="discountEnabled"
                onChange={updateField}
                type="checkbox"
              />
              <span className="font-extrabold text-[#8f563e]">
                {form.discountEnabled ? "Discount is on" : "Turn on a scheduled discount"}
              </span>
            </label>
            {form.discountEnabled && (
              <>
            <label className="block">
              <span className="mb-1.5 block text-xs font-extrabold uppercase text-[#d7a17c]">
                Discount method
              </span>
              <select
                className="min-h-11 w-full rounded-md border border-[#ead8ce] bg-white px-3 font-semibold text-[#271b16] outline-none transition focus:border-[#c88763] focus:ring-4 focus:ring-[#f7e4d8]"
                name="discountType"
                onChange={updateField}
                value={form.discountType}
              >
                <option value="percentage">Percentage (%)</option>
                <option value="fixed_amount">Fixed amount (LKR)</option>
              </select>
            </label>
            {form.category === "perfumes" && (
              <label className="block">
                <span className="mb-1.5 block text-xs font-extrabold uppercase text-[#d7a17c]">
                  Apply discount to
                </span>
                <select
                  className="min-h-11 w-full rounded-md border border-[#ead8ce] bg-white px-3 font-semibold text-[#271b16] outline-none transition focus:border-[#c88763] focus:ring-4 focus:ring-[#f7e4d8]"
                  name="discountTarget"
                  onChange={updateField}
                  value={form.discountTarget}
                >
                  <option value="full">Full bottle only</option>
                  <option value="decant">Decant only</option>
                  <option value="both">Full bottle and decant</option>
                </select>
              </label>
            )}
            {form.discountType === "fixed_amount" ? (
              <AdminField
                label="Discount amount (LKR)"
                min="0"
                name="discountAmount"
                onChange={updateField}
                placeholder="0"
                step="0.01"
                type="number"
                value={form.discountAmount}
              />
            ) : (
              <AdminField
                label="Discount (%)"
                max="99"
                min="0"
                name="discountPercent"
                onChange={updateField}
                placeholder="0"
                step="0.01"
                type="number"
                value={form.discountPercent}
              />
            )}
            <AdminField
              label="First discount day"
              name="discountStartAt"
              onChange={updateField}
              type="date"
              value={form.discountStartAt}
            />
            <AdminField
              label="Last discount day"
              min={form.discountStartAt || undefined}
              name="discountEndAt"
              onChange={updateField}
              type="date"
              value={form.discountEndAt}
            />
              </>
            )}
            <AdminField label="KOKO Pay text" name="kokoPay" onChange={updateField} value={form.kokoPay} />
            {form.category === "perfumes" && (
              <>
                <AdminField label="Decant price" name="decantPriceValue" onChange={updateField} type="number" value={form.decantPriceValue} />
                <AdminField label="Decant size" name="decantSize" onChange={updateField} value={form.decantSize} />
                <AdminField label="Concentration" name="concentration" onChange={updateField} value={form.concentration} />
              </>
            )}
            <AdminField label="Volume" name="volume" onChange={updateField} value={form.volume} />
            <AdminField label="Gender" name="gender" onChange={updateField} value={form.gender} />
            {form.category === "perfumes" && (
              <>
                <AdminField label="Fragrance family" name="fragranceFamily" onChange={updateField} value={form.fragranceFamily} />
                <AdminField label="Release year" name="releaseYear" onChange={updateField} value={form.releaseYear} />
                <AdminField label="Perfumers" name="perfumers" onChange={updateField} value={form.perfumers} />
              </>
            )}
            <label className="block">
              <span className="mb-1.5 block text-xs font-extrabold uppercase text-[#d7a17c]">
                Stock Status
              </span>
              <select
                className="min-h-11 w-full rounded-md border border-[#ead8ce] bg-white px-3 font-semibold text-[#271b16] outline-none transition focus:border-[#c88763] focus:ring-4 focus:ring-[#f7e4d8]"
                name="stockStatus"
                onChange={updateField}
                value={form.stockStatus}
              >
                <option value="in_stock">In stock</option>
                <option value="out_of_stock">Out of stock</option>
              </select>
            </label>
            <AdminField label="Stock quantity" name="stockQuantity" onChange={updateField} type="number" value={form.stockQuantity} />
          </div>

          <div className="mt-4 grid gap-4 lg:grid-cols-2">
            <AdminImageUpload
              label="Main product image"
              name="image"
              onFileChange={uploadImage}
              onUrlChange={updateField}
              uploading={uploadingField === "image"}
              value={form.image}
            />
            <AdminImageUpload
              label="Detail image"
              name="detailImage"
              onFileChange={uploadImage}
              onUrlChange={updateField}
              uploading={uploadingField === "detailImage"}
              value={form.detailImage}
            />
            <AdminImageUpload
              label={form.category === "cosmetics" ? "Pop-up product image" : "Pop-up bottle / box image"}
              name="popImage"
              onFileChange={uploadImage}
              onUrlChange={updateField}
              uploading={uploadingField === "popImage"}
              value={form.popImage}
            />
          </div>

          <div className="mt-4 grid gap-4 lg:grid-cols-2">
            <AdminTextarea label="Short description" name="shortDescription" onChange={updateField} value={form.shortDescription} />
            <AdminTextarea label="Full detail description" name="detailDescription" onChange={updateField} value={form.detailDescription} />
            {form.category === "perfumes" ? (
              <>
                <AdminTextarea label="Top notes, comma separated" name="topNotes" onChange={updateField} value={form.topNotes} />
                <AdminTextarea label="Heart notes, comma separated" name="heartNotes" onChange={updateField} value={form.heartNotes} />
                <AdminTextarea label="Base notes, comma separated" name="baseNotes" onChange={updateField} value={form.baseNotes} />
                <AdminTextarea label="Main accords, comma separated" name="accords" onChange={updateField} value={form.accords} />
                <AdminTextarea label="Best for, comma separated" name="bestFor" onChange={updateField} value={form.bestFor} />
              </>
            ) : (
              <>
                <AdminTextarea label="Key Ingredients" name="keyIngredients" onChange={updateField} value={form.keyIngredients} />
                <AdminTextarea label="Main Benefits" name="mainBenefits" onChange={updateField} value={form.mainBenefits} />
                <AdminTextarea label="Skin Type" name="skinType" onChange={updateField} value={form.skinType} />
                <AdminTextarea label="Skin Concerns" name="skinConcerns" onChange={updateField} value={form.skinConcerns} />
                <AdminTextarea label="How to Use" name="howToUse" onChange={updateField} value={form.howToUse} />
              </>
            )}
          </div>

          <label className="mt-4 flex items-center gap-3 text-sm font-bold text-[#6f5d54]">
            <input
              checked={form.isActive}
              className="h-5 w-5 accent-[#9b5f45]"
              name="isActive"
              onChange={updateField}
              type="checkbox"
            />
            Show this product on the website
          </label>

          {error && <p className="mt-4 rounded-md bg-[#fff0f0] px-4 py-3 font-bold text-[#c04c4c]">{error}</p>}
          {message && <p className="mt-4 rounded-md bg-[#effaf4] px-4 py-3 font-bold text-[#2f8b5b]">{message}</p>}

          <button
            className="mt-5 inline-flex min-h-11 w-full cursor-pointer items-center justify-center gap-2 rounded-md bg-linear-to-br from-[#c88763] to-[#8f563e] px-5 font-bold text-white shadow-sm disabled:opacity-60"
            disabled={status === "saving"}
            type="submit"
          >
            <Save aria-hidden="true" size={18} />
            {status === "saving" ? "Saving..." : editingProductId ? "Update Product" : "Upload Product"}
          </button>
        </form>

        <aside className="h-fit rounded-lg border border-[#ead8ce] bg-[#fff8f3] p-5 shadow-[0_18px_45px_rgba(143,86,62,0.08)]">
          <p className="text-xs font-extrabold uppercase text-[#d7a17c]">Product Overview</p>
          <div className="mt-4 grid gap-3">
            <div className="rounded-md bg-white p-4">
              <strong className="block text-2xl text-[#9b5f45]">{products.length}</strong>
              <span className="text-sm font-bold text-[#6f5d54]">Total products</span>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-md bg-white p-4">
                <strong className="block text-xl text-[#9b5f45]">{productCounts.perfumes || 0}</strong>
                <span className="text-xs font-bold text-[#6f5d54]">Perfumes</span>
              </div>
              <div className="rounded-md bg-white p-4">
                <strong className="block text-xl text-[#9b5f45]">{productCounts.cosmetics || 0}</strong>
                <span className="text-xs font-bold text-[#6f5d54]">Cosmetics</span>
              </div>
            </div>
          </div>
        </aside>
      </section>

      <section className="px-[clamp(18px,5vw,72px)] pb-[clamp(54px,8vw,96px)]">
        <div className="mb-5 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-xs font-extrabold uppercase text-[#d7a17c]">Manage Products</p>
            <h2 className="mt-1 font-serif text-3xl text-[#9b5f45]">
              {activeProductCategory === "perfumes" ? "Perfumes" : "Cosmetics"}
            </h2>
          </div>
          <div className="flex rounded-lg border border-[#ead8ce] bg-[#fff8f3] p-1">
            <button
              className={`min-h-10 cursor-pointer rounded-md px-4 text-sm font-extrabold transition ${
                activeProductCategory === "perfumes"
                  ? "bg-[#9b5f45] text-white shadow-sm"
                  : "bg-transparent text-[#8f563e]"
              }`}
              type="button"
              onClick={() => selectProductCategory("perfumes")}
            >
              Perfumes ({productCounts.perfumes || 0})
            </button>
            <button
              className={`min-h-10 cursor-pointer rounded-md px-4 text-sm font-extrabold transition ${
                activeProductCategory === "cosmetics"
                  ? "bg-[#9b5f45] text-white shadow-sm"
                  : "bg-transparent text-[#8f563e]"
              }`}
              type="button"
              onClick={() => selectProductCategory("cosmetics")}
            >
              Cosmetics ({productCounts.cosmetics || 0})
            </button>
          </div>
        </div>
        <div className="grid gap-3">
          {visibleProducts.length === 0 && (
            <p className="rounded-lg border border-[#ead8ce] bg-[#fff8f3] px-5 py-8 text-center font-bold text-[#6f5d54]">
              No {activeProductCategory} have been added yet.
            </p>
          )}
          {visibleProducts.map((product) => (
            <article
              className="grid gap-4 rounded-lg border border-[#ead8ce] bg-white p-4 shadow-[0_14px_34px_rgba(143,86,62,0.07)] md:grid-cols-[88px_minmax(0,1fr)_auto]"
              key={product.id}
            >
              {product.image ? (
                <img className="h-24 w-full rounded-md object-cover md:h-20" src={product.image} alt={product.name} />
              ) : (
                <div className="h-24 rounded-md bg-[#fff8f3] md:h-20" />
              )}
              <div>
                <p className="text-xs font-extrabold uppercase text-[#d7a17c]">
                  {product.category} | {product.isInStock ? "In stock" : "Out of stock"}
                </p>
                <h3 className="mt-1 text-lg font-bold text-[#271b16]">{product.name}</h3>
                <p className="mt-1 text-sm text-[#6f5d54]">
                  {formatPrice(getDiscountPricing(product, discountClock).priceValue)} | Qty {product.stockQuantity}
                </p>
                <ProductDiscountSummary now={discountClock} product={product} />
              </div>
              <div className="flex flex-wrap items-center gap-2 md:justify-end">
                <button
                  className="inline-flex min-h-10 cursor-pointer items-center gap-2 rounded-md border border-[#ead8ce] bg-white px-3 font-bold text-[#8f563e]"
                  type="button"
                  onClick={() => {
                    setEditingProductId(product.id);
                    setActiveProductCategory(product.category);
                    setForm(formFromProduct(product));
                    window.scrollTo({ top: 0, behavior: "smooth" });
                  }}
                >
                  <Edit3 aria-hidden="true" size={16} />
                  Edit
                </button>
                <button
                  className={`inline-flex min-h-10 cursor-pointer items-center gap-2 rounded-md px-3 font-bold text-white ${
                    product.isInStock ? "bg-[#c04c4c]" : "bg-[#30a66a]"
                  }`}
                  type="button"
                  onClick={() =>
                    changeStockStatus(product, product.isInStock ? "out_of_stock" : "in_stock")
                  }
                >
                  {product.isInStock ? (
                    <PackageX aria-hidden="true" size={16} />
                  ) : (
                    <PackageCheck aria-hidden="true" size={16} />
                  )}
                  {product.isInStock ? "Mark Out" : "Mark In"}
                </button>
              </div>
            </article>
          ))}
        </div>
      </section>
      </>
      )}

      {activeSection === "orders" && (
        <section className="px-[clamp(18px,5vw,72px)] py-[clamp(42px,7vw,82px)]">
          <div className="grid gap-5 lg:grid-cols-2">
            <div className="rounded-lg border border-[#ead8ce] bg-white p-5 shadow-[0_18px_45px_rgba(143,86,62,0.08)]">
              <p className="text-xs font-extrabold uppercase text-[#d7a17c]">Total orders</p>
              <strong className="mt-2 block text-4xl text-[#9b5f45]">{orders.length}</strong>
            </div>
            <div className="rounded-lg border border-[#ead8ce] bg-white p-5 shadow-[0_18px_45px_rgba(143,86,62,0.08)]">
              <p className="text-xs font-extrabold uppercase text-[#d7a17c]">Order value</p>
              <strong className="mt-2 block text-4xl text-[#9b5f45]">{formatPrice(totalOrderValue)}</strong>
            </div>
          </div>

          <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap gap-3">
              {[
                { count: newOrders.length, label: "New Orders", value: "new" },
                { count: deliveredOrders.length, label: "Delivered Orders", value: "delivered" },
                { count: orders.length, label: "All Orders", value: "all" },
              ].map((tab) => (
                <button
                  className={`inline-flex min-h-11 cursor-pointer items-center gap-2 rounded-md px-5 font-bold transition ${
                    activeOrderView === tab.value
                      ? "bg-[#9b5f45] text-white shadow-sm"
                      : "border border-[#ead8ce] bg-white text-[#8f563e]"
                  }`}
                  key={tab.value}
                  type="button"
                  onClick={() => setActiveOrderView(tab.value)}
                >
                  {tab.label}
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs ${
                      activeOrderView === tab.value ? "bg-white/20 text-white" : "bg-[#fff8f3] text-[#8f563e]"
                    }`}
                  >
                    {tab.count}
                  </span>
                </button>
              ))}
            </div>
            <button
              className="inline-flex min-h-11 cursor-pointer items-center gap-2 rounded-md border border-[#ead8ce] bg-white px-4 font-bold text-[#8f563e] disabled:opacity-60"
              disabled={ordersStatus === "loading"}
              type="button"
              onClick={refreshOrders}
            >
              <RefreshCw aria-hidden="true" size={18} />
              Refresh
            </button>
          </div>

          {orderError && <p className="mt-4 rounded-md bg-[#fff0f0] px-4 py-3 font-bold text-[#c04c4c]">{orderError}</p>}
          {orderMessage && <p className="mt-4 rounded-md bg-[#effaf4] px-4 py-3 font-bold text-[#2f8b5b]">{orderMessage}</p>}

          {renderOrderSection(activeOrderHeading.title, activeOrderHeading.subtitle, activeOrderOrders)}
        </section>
      )}

      {activeSection === "notifications" && (
        <section className="px-[clamp(18px,5vw,72px)] py-[clamp(42px,7vw,82px)]">
          <div className="mx-auto max-w-[980px] rounded-lg border border-[#ead8ce] bg-[#fffdfb] p-5 shadow-[0_18px_45px_rgba(143,86,62,0.08)]">
            <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
              <div>
                <p className="text-xs font-extrabold uppercase text-[#d7a17c]">Admin Alerts</p>
                <h2 className="font-serif text-4xl text-[#9b5f45]">All Notifications</h2>
              </div>
              <span className="rounded-full bg-[#fff8f3] px-4 py-2 text-sm font-extrabold text-[#8f563e]">
                {notifications.length} total
              </span>
            </div>

            <div className="grid gap-3">
              {notifications.length === 0 ? (
                <p className="rounded-md bg-white px-4 py-8 text-center font-bold text-[#6f5d54]">
                  No notifications yet.
                </p>
              ) : (
                notifications.map((notification) => (
                  <article
                    className="grid gap-4 rounded-lg border border-[#ead8ce] bg-white p-4 sm:grid-cols-[auto_minmax(0,1fr)_auto] sm:items-center"
                    key={notification.id}
                  >
                    <span className="flex h-11 w-11 items-center justify-center rounded-full bg-[#fff0e8] text-[#9b5f45]">
                      <Bell aria-hidden="true" size={20} />
                    </span>
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="font-extrabold text-[#271b16]">{notification.title}</h3>
                        {!notification.isRead && (
                          <span className="rounded-full bg-[#c04c4c] px-2 py-0.5 text-[0.65rem] font-extrabold uppercase text-white">New</span>
                        )}
                      </div>
                      <p className="mt-1 text-sm leading-[1.6] text-[#6f5d54]">{notification.message}</p>
                      <p className="mt-2 text-xs font-bold text-[#a08477]">{formatDateTime(notification.createdAt)}</p>
                    </div>
                    <button
                      aria-label={`Delete ${notification.title}`}
                      className="inline-flex min-h-10 cursor-pointer items-center justify-center gap-2 rounded-md border border-[#f0cccc] bg-[#fff7f7] px-3 font-bold text-[#c04c4c]"
                      type="button"
                      onClick={() => removeNotification(notification.id)}
                    >
                      <Trash2 aria-hidden="true" size={17} />
                      Delete
                    </button>
                  </article>
                ))
              )}
            </div>
          </div>
        </section>
      )}

      {popupNotification && (
        <aside className="admin-notification-popup fixed top-5 right-5 z-50 w-[min(390px,calc(100vw-40px))] rounded-xl border border-[#ead8ce] bg-white p-5 shadow-[0_28px_70px_rgba(39,27,22,0.24)]" role="status">
          <div className="flex items-start gap-3">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#fff0e8] text-[#9b5f45]">
              <Bell aria-hidden="true" size={21} />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-extrabold uppercase tracking-wide text-[#d7a17c]">New order notification</p>
              <h2 className="mt-1 text-lg font-extrabold text-[#271b16]">{popupNotification.title}</h2>
              <p className="mt-2 text-sm leading-[1.6] text-[#6f5d54]">{popupNotification.message}</p>
              <div className="mt-4 flex flex-wrap gap-2">
                <button className="rounded-md bg-[#9b5f45] px-4 py-2 text-sm font-bold text-white" type="button" onClick={openNotifications}>
                  View notifications
                </button>
                <button className="rounded-md border border-[#ead8ce] bg-white px-4 py-2 text-sm font-bold text-[#8f563e]" type="button" onClick={() => setPopupNotification(null)}>
                  Close
                </button>
              </div>
            </div>
          </div>
        </aside>
      )}
    </main>
  );
}
