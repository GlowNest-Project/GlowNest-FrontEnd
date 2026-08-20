import { useEffect, useLayoutEffect, useState } from "react";
import ProductCard from "../components/ProductCard";
import { getProducts } from "../utils/api";

export default function CosmeticsPage({ onAddToCart }) {
  const [cosmeticProducts, setCosmeticProducts] = useState([]);
  const [status, setStatus] = useState("loading");

  useEffect(() => {
    let cancelled = false;

    getProducts("cosmetics")
      .then((products) => {
        if (!cancelled) {
          setCosmeticProducts(products);
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
    if (status !== "ready") return;

    const shouldRestore = sessionStorage.getItem("glownestRestoreCosmeticsScroll") === "true";
    const savedScrollY = Number(sessionStorage.getItem("glownestCosmeticsScrollY"));

    if (!shouldRestore || Number.isNaN(savedScrollY)) return;

    sessionStorage.removeItem("glownestRestoreCosmeticsScroll");
    window.requestAnimationFrame(() => window.scrollTo({ top: savedScrollY, behavior: "auto" }));
  }, [status]);

  return (
    <main>
      <section className="bg-[linear-gradient(135deg,#ffffff_0%,#fff8f3_55%,#f7eee9_100%)] px-[clamp(18px,5vw,72px)] py-[clamp(54px,8vw,96px)]">
        <div className="max-w-[760px]">
          <p className="collection-kicker section-heading-sweep mb-4">
            GlowNest Collection
          </p>
          <h1 className="section-heading-sweep section-heading-title m-0 font-serif text-[clamp(3.5rem,10vw,7rem)] leading-[0.92] text-[#9b5f45]">
            Cosmetics
          </h1>
          <p className="section-description-sweep mt-6 max-w-[620px] text-base leading-[1.8] text-[#5f4c43] md:text-lg">
            Makeup and beauty picks for soft glam, clean looks, and touch-ups.
          </p>
        </div>
      </section>

      <section className="px-[clamp(18px,5vw,72px)] py-[clamp(54px,8vw,96px)]">
        {status === "error" && (
          <p className="text-center font-bold text-[#c04c4c]">
            Could not load cosmetics right now. Please try again shortly.
          </p>
        )}
        <div className="product-grid grid gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {cosmeticProducts.map((product, index) => (
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
