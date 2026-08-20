import { useEffect, useState } from "react";
import { ArrowLeft, ShoppingCart } from "lucide-react";
import { getProduct } from "../utils/api";
import { navigateTo } from "../utils/navigation";
import { formatPrice } from "../utils/format";
import { openKokoPayInfo } from "../utils/kokoPay";
import { getDiscountPricing } from "../utils/discount";
import { useDiscountClock } from "../hooks/useDiscountClock";

function InfoTile({ label, value }) {
  if (!value) return null;

  return (
    <div className="rounded-lg border border-[#ead8ce] bg-white p-5">
      <p className="text-xs font-extrabold uppercase text-[#d7a17c]">{label}</p>
      <p className="mt-2 whitespace-pre-line text-sm font-bold leading-[1.6] text-[#271b16] md:text-base">{value}</p>
    </div>
  );
}

function DetailSection({ label, value }) {
  if (!value) return null;

  return (
    <section className="rounded-lg border border-[#ead8ce] bg-white p-6 shadow-[0_18px_45px_rgba(143,86,62,0.08)]">
      <p className="mb-3 text-xs font-extrabold uppercase text-[#d7a17c]">{label}</p>
      <p className="whitespace-pre-line text-sm leading-[1.75] text-[#5f4c43] md:text-base">{value}</p>
    </section>
  );
}

export default function CosmeticDetailPage({ onAddToCart }) {
  const slug = window.location.pathname.split("/").filter(Boolean).at(-1);
  const [product, setProduct] = useState(null);
  const [status, setStatus] = useState("loading");
  const [isAdded, setIsAdded] = useState(false);
  const discountClock = useDiscountClock(product);
  const pricing = getDiscountPricing(product, discountClock);

  useEffect(() => {
    let cancelled = false;

    setStatus("loading");
    setProduct(null);
    getProduct(slug)
      .then((data) => {
        if (!cancelled && data.category === "cosmetics") {
          setProduct(data);
          setStatus("ready");
        } else if (!cancelled) {
          setStatus("error");
        }
      })
      .catch(() => {
        if (!cancelled) setStatus("error");
      });

    window.requestAnimationFrame(() => window.scrollTo({ top: 0, behavior: "auto" }));
    return () => {
      cancelled = true;
    };
  }, [slug]);

  function backToCosmetics() {
    sessionStorage.setItem("glownestRestoreCosmeticsScroll", "true");
    navigateTo("/cosmetics", { scrollToTop: false });
  }

  function addToCart(event) {
    if (product?.isInStock === false) return;

    setIsAdded(true);
    onAddToCart(
      {
        ...product,
        id: `${product.id || product.slug || product.name}-product`,
        name: product.name,
        priceValue: pricing.priceValue,
        originalPriceValue: pricing.originalPrice,
        option: "full",
      },
      event.currentTarget
    );
    window.setTimeout(() => setIsAdded(false), 1200);
  }

  if (status === "loading") {
    return <main className="px-[clamp(18px,5vw,72px)] py-[clamp(54px,8vw,96px)] font-bold text-[#8f563e]">Loading...</main>;
  }

  if (!product) {
    return (
      <main className="px-[clamp(18px,5vw,72px)] py-[clamp(54px,8vw,96px)]">
        <h1 className="font-serif text-5xl text-[#9b5f45]">Cosmetic product not found</h1>
        <button className="mt-6 rounded-md bg-[#9b5f45] px-5 py-3 font-bold text-white" type="button" onClick={backToCosmetics}>
          Back to Cosmetics
        </button>
      </main>
    );
  }

  return (
    <main>
      <section className="bg-[linear-gradient(135deg,#ffffff_0%,#fff8f3_55%,#f7eee9_100%)] px-[clamp(18px,5vw,72px)] py-[clamp(38px,7vw,82px)]">
        <button className="mb-8 inline-flex cursor-pointer items-center gap-2 bg-transparent p-0 text-base font-extrabold text-[#8f563e] md:text-lg" type="button" onClick={backToCosmetics}>
          <ArrowLeft aria-hidden="true" size={22} />
          Back to Cosmetics
        </button>

        <div className="grid items-start gap-8 lg:grid-cols-[minmax(320px,0.85fr)_minmax(0,1fr)]" data-cart-source>
          <img
            className="w-full rounded-lg border border-[#ead8ce] bg-white object-cover shadow-[0_28px_80px_rgba(143,86,62,0.12)]"
            src={product.detailImage || product.image}
            alt={`${product.name} product details`}
          />
          <div>
            <p className="mb-3 text-sm font-extrabold uppercase tracking-wide text-[#d7a17c] md:text-base">
              {[product.brand, product.type].filter(Boolean).join(" | ")}
            </p>
            <h1 className="m-0 max-w-[760px] font-serif text-[clamp(2.25rem,5vw,4rem)] leading-[1] text-[#9b5f45]">{product.name}</h1>
            {product.detailDescription && (
              <p className="mt-5 max-w-[680px] whitespace-pre-line text-sm leading-[1.75] text-[#5f4c43] md:text-base">{product.detailDescription}</p>
            )}

            <div className="mt-8 flex flex-wrap items-center gap-3">
              <span className="rounded-md bg-[#fff7f1] px-4 py-3 text-lg font-extrabold text-[#9b5f45]">{formatPrice(pricing.priceValue)}</span>
              {pricing.isActive && (
                <>
                  <span className="font-bold text-[#8f756f] line-through">{formatPrice(pricing.originalPrice)}</span>
                  <span className="rounded-full bg-[#d52f45] px-3 py-1 text-sm font-extrabold text-white">
                    {pricing.discountType === "fixed_amount" ? `${formatPrice(pricing.amount)} OFF` : `${pricing.percentage}% OFF`}
                  </span>
                </>
              )}
              {product.isInStock === false && <span className="rounded-md bg-[#fff0f0] px-4 py-3 font-extrabold text-[#c04c4c]">Out of stock</span>}
            </div>

            {product.kokoPay && (
              <button className="koko-pay-button mt-4 flex max-w-max cursor-pointer items-center gap-3 rounded-md border border-[#ead8ce] bg-white px-4 py-3 text-left" type="button" onClick={() => openKokoPayInfo(pricing.priceValue)}>
                <img className="h-9 w-auto object-contain" src="/assets/koko-pay.png" alt="KOKO Pay" />
                <span className="font-bold text-[#8f563e]">{product.kokoPay}</span>
              </button>
            )}

            <button
              className={`mt-6 inline-flex min-h-11 items-center justify-center gap-2 rounded-md px-5 font-bold shadow-sm ${product.isInStock === false ? "cursor-not-allowed bg-[#f7eee9] text-[#a8948a]" : isAdded ? "bg-[#30b46f] text-white" : "cursor-pointer bg-linear-to-br from-[#c88763] to-[#8f563e] text-white"}`}
              type="button"
              onClick={addToCart}
              disabled={product.isInStock === false}
            >
              <ShoppingCart aria-hidden="true" size={18} />
              {product.isInStock === false ? "Out of Stock" : isAdded ? "Added" : "Add to Cart"}
            </button>
          </div>
        </div>
      </section>

      <section className="px-[clamp(18px,5vw,72px)] py-[clamp(54px,8vw,96px)]">
        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          <InfoTile label="Skin Type" value={product.skinType} />
          <InfoTile label="Skin Concerns" value={product.skinConcerns} />
          <InfoTile label="Available Size" value={product.volume} />
        </div>
        <div className="mt-8 grid gap-6 lg:grid-cols-2">
          <DetailSection label="Key Ingredients" value={product.keyIngredients} />
          <DetailSection label="Main Benefits" value={product.mainBenefits} />
          <DetailSection label="How to Use" value={product.howToUse} />
        </div>
      </section>
    </main>
  );
}
