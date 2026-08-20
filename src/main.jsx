import React, { useEffect, useMemo, useState } from "react";
import { createRoot } from "react-dom/client";
import { ShoppingCart } from "lucide-react";
import Header from "./components/Header";
import Footer from "./components/Footer";
import AccountPage from "./pages/AccountPage";
import AdminLoginPage from "./pages/AdminLoginPage";
import AdminPage from "./pages/AdminPage";
import CartPage from "./pages/CartPage";
import CosmeticDetailPage from "./pages/CosmeticDetailPage";
import CosmeticsPage from "./pages/CosmeticsPage";
import HomePage from "./pages/HomePage";
import LoginPage from "./pages/LoginPage";
import MyOrdersPage from "./pages/MyOrdersPage";
import PerfumeDetailPage from "./pages/PerfumeDetailPage";
import PerfumesPage from "./pages/PerfumesPage";
import { navigateTo, pageFromPath } from "./utils/navigation";
import {
  clearAdminAuth,
  clearAuth,
  loadAdminAuth,
  loadAuth,
  saveAdminAuth,
  saveAuth,
  SESSION_TIMEOUT_MS,
  touchAdminAuthSession,
  touchAuthSession,
} from "./utils/auth";
import "./styles.css";

const PUBLIC_PATH_PATTERNS = [
  /^\/$/,
  /^\/perfumes$/,
  /^\/perfumes\/[^/]+$/,
  /^\/cosmetics$/,
  /^\/cosmetics\/[^/]+$/,
];
const ADMIN_PATH_PATTERNS = [
  /^\/admin$/,
  /^\/admin\/login$/,
  /^\/admin\/products$/,
  /^\/admin\/orders$/,
  /^\/admin\/orders\/delivered$/,
  /^\/admin\/orders\/all$/,
];
const INTERNAL_PATH_PATTERNS = [/^\/login$/, /^\/cart$/, /^\/account$/, /^\/orders$/, ...ADMIN_PATH_PATTERNS];
const PROTECTED_PATH_PATTERNS = [
  /^\/cart$/,
  /^\/account$/,
  /^\/orders$/,
  /^\/admin\/products$/,
  /^\/admin\/orders$/,
  /^\/admin\/orders\/delivered$/,
  /^\/admin\/orders\/all$/,
];
const DIRECT_ENTRY_PATH_PATTERNS = [...ADMIN_PATH_PATTERNS];

function isKnownPath(path) {
  return [...PUBLIC_PATH_PATTERNS, ...INTERNAL_PATH_PATTERNS].some((pattern) => pattern.test(path));
}

function isPublicPath(path) {
  return PUBLIC_PATH_PATTERNS.some((pattern) => pattern.test(path));
}

function isProtectedPath(path) {
  return PROTECTED_PATH_PATTERNS.some((pattern) => pattern.test(path));
}

function isDirectEntryPath(path) {
  return DIRECT_ENTRY_PATH_PATTERNS.some((pattern) => pattern.test(path));
}

function isAdminPath(path) {
  return /^\/admin(?:\/|$)/.test(path);
}

function isReloadNavigation() {
  const navigationEntry = performance.getEntriesByType?.("navigation")?.[0];
  return navigationEntry?.type === "reload";
}

function App() {
  const [page, setPage] = useState(pageFromPath);
  const [routeKey, setRouteKey] = useState(() => window.location.pathname);
  const [cartItems, setCartItems] = useState([]);
  const [flyItems, setFlyItems] = useState([]);
  const [cartPulse, setCartPulse] = useState(false);
  const [auth, setAuth] = useState(() => loadAuth());
  const [adminAuth, setAdminAuth] = useState(() => loadAdminAuth());
  const [authPrompt, setAuthPrompt] = useState("");

  function handleCustomerAuthenticated(authData) {
    const sessionAuth = { ...authData, lastActivity: Date.now() };

    setAuth(sessionAuth);
    saveAuth(sessionAuth);
    navigateTo("/");
  }

  function handleAdminAuthenticated(authData) {
    const sessionAuth = { ...authData, lastActivity: Date.now() };

    setAdminAuth(sessionAuth);
    saveAdminAuth(sessionAuth);
    navigateTo("/admin");
  }

  function handleAccountUpdated(authData) {
    const sessionAuth = { ...authData, lastActivity: Date.now() };

    setAuth(sessionAuth);
    saveAuth(sessionAuth);
  }

  function handleLogout() {
    setAuth(null);
    clearAuth();
    navigateTo("/");
  }

  function handleAdminLogout() {
    setAdminAuth(null);
    clearAdminAuth();
    navigateTo("/admin");
  }

  function requireLogin(message) {
    setAuthPrompt(message);
  }

  function openCart() {
    if (!auth && cartItems.length > 0) {
      requireLogin("Please log in or register to complete your GlowNest order.");
      return;
    }

    navigateTo("/cart");
  }

  const cartCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);
  const cartTotal = useMemo(
    () => cartItems.reduce((sum, item) => sum + item.priceValue * item.quantity, 0),
    [cartItems]
  );

  useEffect(() => {
    const handleRouteChange = () => {
      const path = window.location.pathname;
      const isInternalNavigation = Boolean(window.history.state?.glownestInternal);
      const canStayOnReload = isReloadNavigation();
      const canOpenDirectly = canStayOnReload || isDirectEntryPath(path);

      if (!isKnownPath(path)) {
        navigateTo("/");
        return;
      }

      if (path !== "/admin" && isAdminPath(path)) {
        navigateTo("/admin");
        return;
      }

      if (!isPublicPath(path) && !isInternalNavigation && !canOpenDirectly) {
        navigateTo("/");
        return;
      }

      if (isProtectedPath(path) && !auth) {
        navigateTo(isAdminPath(path) ? "/admin" : "/");
        return;
      }

      if (path === "/login" && auth) {
        navigateTo("/");
        return;
      }

      setPage(pageFromPath());
      setRouteKey(window.location.pathname);
    };

    handleRouteChange();
    window.addEventListener("popstate", handleRouteChange);
    return () => window.removeEventListener("popstate", handleRouteChange);
  }, [auth, adminAuth]);

  useEffect(() => {
    if (!auth) {
      return undefined;
    }

    let timeoutId;

    const logoutForIdle = () => {
      setAuth(null);
      clearAuth();

      if (isProtectedPath(window.location.pathname) && !isAdminPath(window.location.pathname)) {
        navigateTo("/");
      }
    };

    const scheduleIdleLogout = () => {
      window.clearTimeout(timeoutId);
      timeoutId = window.setTimeout(logoutForIdle, SESSION_TIMEOUT_MS);
    };

    const markActive = () => {
      touchAuthSession(auth);
      scheduleIdleLogout();
    };

    const activityEvents = ["click", "keydown", "mousemove", "scroll", "touchstart"];

    activityEvents.forEach((eventName) => {
      window.addEventListener(eventName, markActive, { passive: true });
    });
    scheduleIdleLogout();

    return () => {
      window.clearTimeout(timeoutId);
      activityEvents.forEach((eventName) => {
        window.removeEventListener(eventName, markActive);
      });
    };
  }, [auth]);

  useEffect(() => {
    if (!adminAuth) {
      return undefined;
    }

    let timeoutId;

    const logoutAdminForIdle = () => {
      setAdminAuth(null);
      clearAdminAuth();

      if (isAdminPath(window.location.pathname)) {
        navigateTo("/admin");
      }
    };

    const scheduleAdminIdleLogout = () => {
      window.clearTimeout(timeoutId);
      timeoutId = window.setTimeout(logoutAdminForIdle, SESSION_TIMEOUT_MS);
    };

    const markAdminActive = () => {
      touchAdminAuthSession(adminAuth);
      scheduleAdminIdleLogout();
    };

    const activityEvents = ["click", "keydown", "mousemove", "scroll", "touchstart"];

    activityEvents.forEach((eventName) => {
      window.addEventListener(eventName, markAdminActive, { passive: true });
    });
    scheduleAdminIdleLogout();

    return () => {
      window.clearTimeout(timeoutId);
      activityEvents.forEach((eventName) => {
        window.removeEventListener(eventName, markAdminActive);
      });
    };
  }, [adminAuth]);

  function launchCartFly(product, trigger) {
    if (!trigger) {
      return;
    }

    const sourceImage =
      trigger.closest("[data-cart-source]")?.querySelector("img") ||
      trigger.closest("article")?.querySelector("img");
    const target = document.querySelector(".cart-target");

    if (!target) {
      return;
    }

    const sourceRect = sourceImage?.getBoundingClientRect() || trigger.getBoundingClientRect();
    const targetRect = target.getBoundingClientRect();
    const size = 72;
    const sourceCenterX = sourceRect.left + sourceRect.width / 2;
    const sourceCenterY = sourceRect.top + sourceRect.height / 2;
    const targetCenterX = targetRect.left + targetRect.width / 2;
    const targetCenterY = targetRect.top + targetRect.height / 2;
    const flyId = `${product?.id || product?.name || "item"}-${Date.now()}`;

    setFlyItems((currentItems) => [
      ...currentItems,
      {
        id: flyId,
        image: product?.image,
        left: sourceCenterX - size / 2,
        top: sourceCenterY - size / 2,
        size,
        x: targetCenterX - sourceCenterX,
        y: targetCenterY - sourceCenterY,
      },
    ]);
    window.setTimeout(() => {
      setFlyItems((currentItems) => currentItems.filter((item) => item.id !== flyId));
    }, 1900);
  }

  function addToCart(product, trigger) {
    launchCartFly(product, trigger);
    setCartPulse(true);
    window.setTimeout(() => setCartPulse(false), 900);

    setCartItems((currentItems) => {
      const itemId = product.id || product.name;
      const existingItem = currentItems.find((item) => item.id === itemId);

      if (existingItem) {
        return currentItems.map((item) =>
          item.id === itemId ? { ...item, quantity: item.quantity + 1 } : item
        );
      }

      return [...currentItems, { ...product, id: itemId, quantity: 1 }];
    });
  }

  function decreaseItem(itemId) {
    setCartItems((currentItems) =>
      currentItems
        .map((item) => (item.id === itemId ? { ...item, quantity: item.quantity - 1 } : item))
        .filter((item) => item.quantity > 0)
    );
  }

  function removeItem(itemId) {
    setCartItems((currentItems) => currentItems.filter((item) => item.id !== itemId));
  }

  return (
    <div className="min-h-screen bg-white font-sans text-[#271b16]">
      {page !== "login" && page !== "admin" && (
        <Header
          cartCount={cartCount}
          onCartClick={openCart}
          page={page}
          token={auth?.token}
          user={auth?.user}
          onLogout={handleLogout}
        />
      )}
      <div className="page-transition" key={routeKey}>
        {page === "perfumes" && <PerfumesPage onAddToCart={addToCart} />}
        {page === "perfume-detail" && <PerfumeDetailPage onAddToCart={addToCart} />}
        {page === "cosmetics" && <CosmeticsPage onAddToCart={addToCart} />}
        {page === "cosmetic-detail" && <CosmeticDetailPage onAddToCart={addToCart} />}
        {page === "cart" && (
          <CartPage
            cartItems={cartItems}
            onDecreaseItem={decreaseItem}
            onIncreaseItem={addToCart}
            onRemoveItem={removeItem}
            onOrderPlaced={() => setCartItems([])}
            token={auth?.token}
            user={auth?.user}
          />
        )}
        {page === "login" && <LoginPage onAuthenticated={handleCustomerAuthenticated} />}
        {page === "account" && (
          <AccountPage
            onAuthenticated={handleAccountUpdated}
            token={auth?.token}
            user={auth?.user}
          />
        )}
        {page === "orders" && <MyOrdersPage token={auth?.token} user={auth?.user} />}
        {page === "admin" &&
          (adminAuth?.user?.role === "admin" ? (
            <AdminPage
              onLogout={handleAdminLogout}
              token={adminAuth.token}
              user={adminAuth.user}
            />
          ) : (
            <AdminLoginPage onAuthenticated={handleAdminAuthenticated} />
          ))}
        {page === "home" && <HomePage onAddToCart={addToCart} />}
      </div>
      {page !== "login" && page !== "admin" && <Footer />}
      {cartCount > 0 &&
        page !== "cart" &&
        page !== "login" &&
        page !== "admin" && (
        <button
          className={`cart-float-target fixed bottom-5 left-1/2 z-40 flex min-h-14 w-[min(calc(100%-32px),380px)] cursor-pointer items-center justify-between gap-3 rounded-full bg-linear-to-r from-[#f0446c] to-[#9b5f45] px-5 font-bold text-white shadow-[0_18px_42px_rgba(240,68,108,0.28)] ${
            cartPulse ? "cart-pill-pop" : ""
          }`}
          type="button"
          onClick={openCart}
        >
          <span className="inline-flex items-center gap-2">
            <ShoppingCart aria-hidden="true" size={18} />
            View cart
          </span>
          <span className="rounded-full bg-white/20 px-3 py-1 text-sm">
            {cartCount} item{cartCount > 1 ? "s" : ""} | LKR {cartTotal.toLocaleString()}
          </span>
        </button>
      )}
      {authPrompt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#271b16]/35 px-4 backdrop-blur-sm">
          <section className="w-full max-w-[440px] rounded-lg border border-[#ead8ce] bg-white p-6 text-center shadow-[0_22px_60px_rgba(39,27,22,0.18)]">
            <p className="text-xs font-extrabold uppercase tracking-[0.08em] text-[#d7a17c]">
              GlowNest Account
            </p>
            <h2 className="mt-3 font-serif text-4xl leading-tight text-[#9b5f45]">
              Login required
            </h2>
            <p className="mx-auto mt-3 max-w-[340px] leading-[1.7] text-[#6f5d54]">
              {authPrompt}
            </p>
            <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
              <button
                className="inline-flex min-h-11 cursor-pointer items-center justify-center rounded-md bg-linear-to-br from-[#c88763] to-[#8f563e] px-5 font-bold text-white shadow-sm"
                type="button"
                onClick={() => {
                  setAuthPrompt("");
                  navigateTo("/login");
                }}
              >
                Login or Register
              </button>
              <button
                className="inline-flex min-h-11 cursor-pointer items-center justify-center rounded-md border border-[#ead8ce] bg-white px-5 font-bold text-[#8f563e]"
                type="button"
                onClick={() => setAuthPrompt("")}
              >
                Continue browsing
              </button>
            </div>
          </section>
        </div>
      )}
      {flyItems.map((item) =>
        item.image ? (
          <img
            key={item.id}
            className="cart-fly-image"
            src={item.image}
            alt=""
            aria-hidden="true"
            style={{
              left: `${item.left}px`,
              top: `${item.top}px`,
              width: `${item.size}px`,
              height: `${item.size}px`,
              "--fly-x": `${item.x}px`,
              "--fly-y": `${item.y}px`,
            }}
          />
        ) : (
          <span
            key={item.id}
            className="cart-fly-dot"
            aria-hidden="true"
            style={{
              left: `${item.left}px`,
              top: `${item.top}px`,
              width: `${item.size}px`,
              height: `${item.size}px`,
              "--fly-x": `${item.x}px`,
              "--fly-y": `${item.y}px`,
            }}
          >
            +1
          </span>
        )
      )}
    </div>
  );
}

createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
