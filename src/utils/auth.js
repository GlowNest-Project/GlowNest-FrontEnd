const CUSTOMER_STORAGE_KEY = "glownestCustomerAuth";
const ADMIN_STORAGE_KEY = "glownestAdminAuth";
const LEGACY_SESSION_KEY = "glownestAuth";
const LEGACY_LOCAL_KEY = "glownestAuth";
const SESSION_TIMEOUT_MS = 30 * 60 * 1000;

function isExpired(auth) {
  return !auth?.lastActivity || Date.now() - auth.lastActivity > SESSION_TIMEOUT_MS;
}

function readSession(storageKey, expectedRole) {
  try {
    const raw = sessionStorage.getItem(storageKey);
    const auth = raw ? JSON.parse(raw) : null;

    if (!auth || auth.user?.role !== expectedRole || isExpired(auth)) {
      sessionStorage.removeItem(storageKey);
      return null;
    }

    return auth;
  } catch {
    return null;
  }
}

function migrateLegacySession(expectedRole, storageKey) {
  try {
    const raw = sessionStorage.getItem(LEGACY_SESSION_KEY);
    const auth = raw ? JSON.parse(raw) : null;

    if (auth?.user?.role === expectedRole && !isExpired(auth)) {
      sessionStorage.setItem(storageKey, JSON.stringify(auth));
      return auth;
    }
  } catch {
    return null;
  }

  return null;
}

function loadSession(storageKey, expectedRole) {
  localStorage.removeItem(LEGACY_LOCAL_KEY);
  return readSession(storageKey, expectedRole) || migrateLegacySession(expectedRole, storageKey);
}

function saveSession(storageKey, auth) {
  sessionStorage.setItem(
    storageKey,
    JSON.stringify({ ...auth, lastActivity: auth.lastActivity || Date.now() })
  );
}

function touchSession(storageKey, auth) {
  if (!auth) return null;
  const nextAuth = { ...auth, lastActivity: Date.now() };
  saveSession(storageKey, nextAuth);
  return nextAuth;
}

export function loadAuth() {
  return loadSession(CUSTOMER_STORAGE_KEY, "customer");
}

export function saveAuth(auth) {
  saveSession(CUSTOMER_STORAGE_KEY, auth);
}

export function clearAuth() {
  sessionStorage.removeItem(CUSTOMER_STORAGE_KEY);
  localStorage.removeItem(LEGACY_LOCAL_KEY);
}

export function touchAuthSession(auth) {
  return touchSession(CUSTOMER_STORAGE_KEY, auth);
}

export function loadAdminAuth() {
  return loadSession(ADMIN_STORAGE_KEY, "admin");
}

export function saveAdminAuth(auth) {
  saveSession(ADMIN_STORAGE_KEY, auth);
}

export function clearAdminAuth() {
  sessionStorage.removeItem(ADMIN_STORAGE_KEY);
}

export function touchAdminAuthSession(auth) {
  return touchSession(ADMIN_STORAGE_KEY, auth);
}

export { SESSION_TIMEOUT_MS };
