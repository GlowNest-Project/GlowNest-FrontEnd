export function navigateTo(path, options = {}) {
  const { scrollToTop = true, state = {} } = options;

  window.history.pushState({ ...state, glownestInternal: true }, "", path);
  window.dispatchEvent(new PopStateEvent("popstate"));

  if (scrollToTop) {
    window.requestAnimationFrame(() => {
      window.scrollTo({ top: 0, behavior: "auto" });
    });
  }
}

export function navigateToSection(sectionId) {
  window.history.pushState({ glownestInternal: true }, "", "/");
  window.dispatchEvent(new PopStateEvent("popstate"));
  window.setTimeout(() => {
    document.getElementById(sectionId)?.scrollIntoView({ behavior: "smooth" });
  }, 0);
}

export function pageFromPath() {
  const path = window.location.pathname;

  if (path.startsWith("/perfumes/")) {
    return "perfume-detail";
  }

  if (path === "/perfumes") {
    return "perfumes";
  }

  if (path.startsWith("/cosmetics/")) {
    return "cosmetic-detail";
  }

  if (path === "/cosmetics") {
    return "cosmetics";
  }

  if (path === "/cart") {
    return "cart";
  }

  if (path === "/login") {
    return "login";
  }

  if (path === "/account") {
    return "account";
  }

  if (path === "/orders") {
    return "orders";
  }

  if (path.startsWith("/admin")) {
    return "admin";
  }

  return "home";
}
