const API_URL = import.meta.env.VITE_API_URL || "http://127.0.0.1:4000";

async function apiFetch(path, { method = "GET", body, token } = {}) {
  let response;

  try {
    response = await fetch(`${API_URL}${path}`, {
      method,
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: body ? JSON.stringify(body) : undefined,
    });
  } catch {
    throw new Error("Backend is not running. Please start the backend server and try again.");
  }

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.error || "Something went wrong. Please try again.");
  }

  return data;
}

async function uploadFetch(path, { file, token } = {}) {
  const formData = new FormData();
  formData.append("image", file);

  let response;

  try {
    response = await fetch(`${API_URL}${path}`, {
      method: "POST",
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: formData,
    });
  } catch {
    throw new Error("Backend is not running. Please start the backend server and try again.");
  }

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.error || "Image upload failed. Please try again.");
  }

  return data;
}

export function getProducts(category) {
  const query = category ? `?category=${encodeURIComponent(category)}` : "";
  return apiFetch(`/api/products${query}`).then((data) => data.products);
}

export function getProduct(slug) {
  return apiFetch(`/api/products/${encodeURIComponent(slug)}`).then((data) => data.product);
}

export function signup(payload) {
  return apiFetch("/api/auth/signup", { method: "POST", body: payload });
}

export function requestSignupOtp(payload) {
  return apiFetch("/api/auth/signup/request-otp", { method: "POST", body: payload });
}

export function verifySignupOtp(payload) {
  return apiFetch("/api/auth/signup/verify", { method: "POST", body: payload });
}

export function login(payload) {
  return apiFetch("/api/auth/login", { method: "POST", body: payload });
}

export function getCurrentUser(token) {
  return apiFetch("/api/auth/me", { token }).then((data) => data.user);
}

export function getAdminSetupStatus() {
  return apiFetch("/api/admin/auth/setup-status");
}

export function adminRegister(payload, token) {
  return apiFetch("/api/admin/auth/register", { method: "POST", body: payload, token });
}

export function adminLogin(payload) {
  return apiFetch("/api/admin/auth/login", { method: "POST", body: payload });
}

export function getCurrentAdmin(token) {
  return apiFetch("/api/admin/auth/me", { token }).then((data) => data.user);
}

export function updateCurrentUser(payload, token) {
  return apiFetch("/api/auth/me", { method: "PUT", body: payload, token }).then((data) => data.user);
}

export function requestEmailVerificationOtp(token) {
  return apiFetch("/api/auth/verify-email/request-otp", { method: "POST", token });
}

export function confirmEmailVerificationOtp(payload, token) {
  return apiFetch("/api/auth/verify-email/confirm", { method: "POST", body: payload, token });
}

export function requestPhoneVerificationOtp(token) {
  return apiFetch("/api/auth/verify-phone/request-otp", { method: "POST", token });
}

export function confirmPhoneVerificationOtp(payload, token) {
  return apiFetch("/api/auth/verify-phone/confirm", { method: "POST", body: payload, token });
}

export function changePassword(payload, token) {
  return apiFetch("/api/auth/change-password", { method: "POST", body: payload, token });
}

export function createOrder(payload, token) {
  return apiFetch("/api/orders", { method: "POST", body: payload, token }).then((data) => data.order);
}

export function getOrders(token) {
  return apiFetch("/api/orders", { token }).then((data) => data.orders);
}

export function getCustomerNotifications(token) {
  return apiFetch("/api/customer/notifications", { token }).then((data) => data.notifications);
}

export function markCustomerNotificationsRead(token) {
  return apiFetch("/api/customer/notifications/read", { method: "PUT", token }).then(
    (data) => data.notifications
  );
}

export function getAdminProducts(token) {
  return apiFetch("/api/admin/products", { token }).then((data) => data.products);
}

export function getAdminOrders(token) {
  return apiFetch("/api/admin/orders", { token }).then((data) => data.orders);
}

export function getAdminNotifications(token) {
  return apiFetch("/api/admin/notifications", { token }).then((data) => data.notifications);
}

export function markAdminNotificationsRead(token) {
  return apiFetch("/api/admin/notifications/read", { method: "PUT", token }).then(
    (data) => data.notifications
  );
}

export function deleteAdminNotification(notificationId, token) {
  return apiFetch(`/api/admin/notifications/${encodeURIComponent(notificationId)}`, {
    method: "DELETE",
    token,
  }).then((data) => data.notifications);
}

export function updateAdminOrderPayment(orderId, payload, token) {
  return apiFetch(`/api/admin/orders/${encodeURIComponent(orderId)}/payment`, {
    method: "PUT",
    body: payload,
    token,
  }).then((data) => data.order);
}

export function updateAdminOrderStatus(orderId, payload, token) {
  return apiFetch(`/api/admin/orders/${encodeURIComponent(orderId)}/status`, {
    method: "PUT",
    body: payload,
    token,
  }).then((data) => data.order);
}

export function deleteAdminOrder(orderId, token) {
  return apiFetch(`/api/admin/orders/${encodeURIComponent(orderId)}`, {
    method: "DELETE",
    token,
  }).then((data) => data.orders);
}

export function createAdminProduct(payload, token) {
  return apiFetch("/api/admin/products", { method: "POST", body: payload, token }).then(
    (data) => data.product
  );
}

export function updateAdminProduct(productId, payload, token) {
  return apiFetch(`/api/admin/products/${encodeURIComponent(productId)}`, {
    method: "PUT",
    body: payload,
    token,
  }).then((data) => data.product);
}

export function updateAdminProductStatus(productId, payload, token) {
  return apiFetch(`/api/admin/products/${encodeURIComponent(productId)}/status`, {
    method: "PUT",
    body: payload,
    token,
  }).then((data) => data.products);
}

export function uploadAdminProductImage(file, token) {
  return uploadFetch("/api/admin/uploads", { file, token }).then((data) => data.imageUrl);
}
