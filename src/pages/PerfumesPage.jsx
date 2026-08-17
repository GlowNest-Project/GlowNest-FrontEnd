import { useEffect, useLayoutEffect, useMemo, useState } from "react";
import { Search } from "lucide-react";
import ProductCard from "../components/ProductCard";
import { getProducts } from "../utils/api";

let cachedPerfumeProducts = null;

export default function PerfumesPage({ onAddToCart }) {
  const [perfumeProducts, setPerfumeProducts] = useState(() => cachedPerfumeProducts || []);
  const [searchQuery, setSearchQuery] = useState("");
  const [status, setStatus] = useState(() => (cachedPerfumeProducts ? "ready" : "loading"));

  const filteredPerfumes = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    if (!query) {
      return perfumeProducts;
    }

    return perfumeProducts.filter((product) => {
      const searchableText = [
        product.name,
        product.brand,
        product.concentration,
        product.type,
        product.shortDescription,
        product.detailDescription,
        product.fragranceFamily,
        product.kokoPay,
        product.price,
        product.priceValue,
        product.decant?.price,
        product.decant?.priceValue,
        product.notes?.map((note) => `${note.label} ${note.value}`).join(" "),
        product.accords?.join(" "),
        product.bestFor?.join(" "),
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return searchableText.includes(query);
    });
  }, [perfumeProducts, searchQuery]);

  useEffect(() => {
    if (cachedPerfumeProducts) {
      return undefined;
    }

    let cancelled = false;

    getProducts("perfumes")
      .then((products) => {
        if (!cancelled) {
          cachedPerfumeProducts = products;
          setPerfumeProducts(products);
          setStatus("ready");
        }
      })
      .catch(() => {
        if (!cancelled) {
          setStatus("error");
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  useLayoutEffect(() => {
    if (status !== "ready") {
      return;
    }

    if (window.history.state?.scrollToProducts) {
      window.history.replaceState({ ...window.history.state, scrollToProducts: false }, "", window.location.pathname);
      window.requestAnimationFrame(() => {
        document.getElementById("perfume-products")?.scrollIntoView({ behavior: "smooth", block: "start" });
      });
      return;
    }

    const shouldRestore = sessionStorage.getItem("glownestRestorePerfumesScroll") === "true";
    const savedScrollY = Number(sessionStorage.getItem("glownestPerfumesScrollY"));

    if (!shouldRestore || Number.isNaN(savedScrollY)) {
      return;
    }

    sessionStorage.removeItem("glownestRestorePerfumesScroll");

    window.requestAnimationFrame(() => {
      window.scrollTo({ top: savedScrollY, behavior: "auto" });
    });
  }, [status]);

  return (
    <main>
      <section className="bg-[linear-gradient(135deg,#ffffff_0%,#fff8f3_55%,#f7eee9_100%)] px-[clamp(18px,5vw,72px)] py-[clamp(54px,8vw,96px)]">
        <div className="max-w-[760px]">
          <p className="collection-kicker section-heading-sweep mb-4">
            GlowNest Collection
          </p>
          <h1 className="section-heading-sweep section-heading-title m-0 font-serif text-[clamp(3.5rem,10vw,7rem)] leading-[0.92] text-[#9b5f45]">
            Perfumes
          </h1>
          <p className="section-description-sweep mt-6 max-w-[620px] text-base leading-[1.8] text-[#5f4c43] md:text-lg">
            Long-lasting scents for daily wear, gifts, and special moments.
          </p>
        </div>
      </section>

      <section className="px-[clamp(18px,5vw,72px)] py-[clamp(54px,8vw,96px)]" id="perfume-products">
        <div className="mb-8 flex flex-col gap-4 rounded-lg border border-[#ead8ce] bg-white p-4 shadow-[0_14px_34px_rgba(143,86,62,0.08)] md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-xs font-extrabold uppercase text-[#d7a17c]">Search Perfumes</p>
            <p className="mt-1 text-sm font-semibold text-[#6f5d54]">
              Find by perfume name, brand, notes, accords, or price.
            </p>
          </div>
          <label className="relative w-full md:max-w-[420px]">
            <Search
              aria-hidden="true"
              className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[#9b5f45]"
              size={22}
            />
            <input
              className="min-h-14 w-full rounded-md border border-[#ead8ce] bg-[#fff8f3] pl-12 pr-4 text-base font-bold text-[#271b16] outline-none transition placeholder:text-[#9d8174] focus:border-[#c88763] focus:bg-white focus:ring-4 focus:ring-[#f7e4d8]"
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="Search any perfume..."
              type="search"
              value={searchQuery}
            />
          </label>
        </div>

        {status === "error" && (
          <p className="text-center font-bold text-[#c04c4c]">
            Could not load perfumes right now. Please try again shortly.
          </p>
        )}
        {status === "ready" && filteredPerfumes.length === 0 && (
          <p className="rounded-lg border border-[#ead8ce] bg-[#fff8f3] px-5 py-6 text-center font-bold text-[#8f563e]">
            No perfumes found for "{searchQuery}". Try another name, brand, note, or price.
          </p>
        )}
        <div className="product-grid grid gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {filteredPerfumes.map((product, index) => (
            <ProductCard
              key={product.slug || product.id}
              product={product}
              onAddToCart={onAddToCart}
              revealIndex={index}
            />
          ))}
        </div>
      </section>
    </main>
  );
}
