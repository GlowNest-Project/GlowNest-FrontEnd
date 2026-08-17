import { useEffect, useState } from "react";
import { ArrowLeft, ShoppingCart } from "lucide-react";
import { getProduct } from "../utils/api";
import { navigateTo } from "../utils/navigation";
import { formatDecant, formatPrice } from "../utils/format";
import { openKokoPayInfo } from "../utils/kokoPay";
import { getDiscountPricing } from "../utils/discount";
import { useDiscountClock } from "../hooks/useDiscountClock";

function InfoTile({ label, value }) {
  return (
    <div className="rounded-lg border border-[#ead8ce] bg-white p-5">
      <p className="text-xs font-extrabold uppercase text-[#d7a17c]">{label}</p>
      <p className="mt-2 font-bold leading-[1.5] text-[#271b16]">{value}</p>
    </div>
  );
}

export default function PerfumeDetailPage({ onAddToCart }) {
  const slug = window.location.pathname.split("/").filter(Boolean).at(-1);
  const [product, setProduct] = useState(null);
  const [status, setStatus] = useState("loading");
  const [isOptionPickerOpen, setIsOptionPickerOpen] = useState(false);
  const discountClock = useDiscountClock(product);
  const fullBottlePricing = getDiscountPricing(product, discountClock);
  const decantPricing = product?.decant
    ? getDiscountPricing(
        {
          ...product,
          option: "decant",
          originalPriceValue: product.decant.originalPriceValue ?? product.decant.priceValue,
        },
        discountClock
      )
    : null;

  useEffect(() => {
    let cancelled = false;
    setStatus("loading");
    setProduct(null);

    getProduct(slug)
      .then((data) => {
        if (!cancelled) {
          setProduct(data);
          setStatus("ready");
        }
      })
      .catch(() => {
        if (!cancelled) {
          setStatus("error");
        }
      });

    window.requestAnimationFrame(() => {
      window.scrollTo({ top: 0, behavior: "auto" });
    });

    return () => {
      cancelled = true;
    };
  }, [slug]);

  function backToPerfumes() {
    sessionStorage.setItem("glownestRestorePerfumesScroll", "true");
    if (product?.id) {
      sessionStorage.setItem("glownestPerfumesSelectedProduct", String(product.id));
    }
    navigateTo("/perfumes", { scrollToTop: false });
  }

  function selectedProductForCart(option) {
    const hasDecantOption = Boolean(product?.decant?.priceValue);

    if (option === "decant" && hasDecantOption) {
      const decantSize = product.decant.size || "10mL";

      return {
        ...product,
        id: `${product.id || product.slug || product.name}-decant`,
        name: `${product.name} - ${decantSize} decant`,
        priceValue: decantPricing.priceValue,
        originalPriceValue: decantPricing.originalPrice,
        option: "decant",
      };
    }

    return {
      ...product,
      id: `${product.id || product.slug || product.name}-full-bottle`,
      name: `${product.name} - Full bottle`,
      priceValue: fullBottlePricing.priceValue,
      originalPriceValue: fullBottlePricing.originalPrice,
      option: "full",
    };
  }

  function addSelectedProductToCart(event, option) {
    if (product?.isInStock === false) {
      return;
    }

    setIsOptionPickerOpen(false);
    onAddToCart(selectedProductForCart(option), event.currentTarget);
  }

  if (status === "loading") {
    return (
      <main className="px-[clamp(18px,5vw,72px)] py-[clamp(54px,8vw,96px)]">
        <p className="font-bold text-[#8f563e]">Loading...</p>
      </main>
    );
  }

  if (!product) {
    return (
      <main className="px-[clamp(18px,5vw,72px)] py-[clamp(54px,8vw,96px)]">
        <h1 className="font-serif text-5xl text-[#9b5f45]">Perfume not found</h1>
        <button
          className="mt-6 inline-flex min-h-11 cursor-pointer items-center justify-center rounded-md bg-linear-to-br from-[#c88763] to-[#8f563e] px-5 font-bold text-white"
          type="button"
          onClick={backToPerfumes}
        >
          Back to Perfumes
        </button>
      </main>
    );
  }

  return (
    <main>
      <section className="bg-[linear-gradient(135deg,#ffffff_0%,#fff8f3_55%,#f7eee9_100%)] px-[clamp(18px,5vw,72px)] py-[clamp(38px,7vw,82px)]">
        <button
          className="mb-8 inline-flex cursor-pointer items-center gap-2 bg-transparent p-0 text-lg font-extrabold text-[#8f563e] transition hover:text-[#6f3f2e] md:text-xl"
          type="button"
          onClick={backToPerfumes}
        >
          <ArrowLeft aria-hidden="true" size={22} />
          Back to Perfumes
        </button>

        <div
          className="grid items-start gap-8 lg:grid-cols-[minmax(320px,0.85fr)_minmax(0,1fr)]"
          data-cart-source
        >
          <img
            className="w-full rounded-lg border border-[#ead8ce] bg-white object-cover shadow-[0_28px_80px_rgba(143,86,62,0.12)]"
            src={product.detailImage || product.image}
            alt={`${product.name} full fragrance details`}
          />

          <div>
            <p className="mb-4 text-base font-extrabold uppercase tracking-wide text-[#d7a17c] md:text-lg">
              {product.brand} | {product.concentration}
            </p>
            <h1 className="m-0 font-serif text-[clamp(3rem,8vw,6rem)] leading-[0.95] text-[#9b5f45]">
              {product.name}
            </h1>
            <p className="mt-6 max-w-[680px] text-base leading-[1.8] text-[#5f4c43] md:text-lg">
              {product.detailDescription}
            </p>

            <div className="mt-8 flex flex-wrap items-center gap-3">
              <span className="rounded-md bg-[#fff7f1] px-4 py-3 text-xl font-extrabold text-[#9b5f45]">
                {formatPrice(fullBottlePricing.priceValue)}
              </span>
              {fullBottlePricing.isActive && (
                <>
                  <span className="font-bold text-[#8f756f] line-through">
                    {formatPrice(fullBottlePricing.originalPrice)}
                  </span>
                  <span className="rounded-full bg-[#d52f45] px-3 py-1 text-sm font-extrabold text-white">
                    {fullBottlePricing.discountType === "fixed_amount"
                      ? `${formatPrice(fullBottlePricing.amount)} OFF`
                      : `${fullBottlePricing.percentage}% OFF`}
                  </span>
                </>
              )}
              {product.isInStock === false && (
                <span className="rounded-md bg-[#fff0f0] px-4 py-3 font-extrabold text-[#c04c4c]">
                  Out of stock
                </span>
              )}
              {product.decant && (
                <>
                  <span className="rounded-md border border-[#ead8ce] bg-white px-4 py-3 font-bold text-[#8f563e]">
                    {formatDecant({ ...product.decant, priceValue: decantPricing.priceValue })}
                  </span>
                  {decantPricing.isActive && (
                    <>
                      <span className="font-bold text-[#8f756f] line-through">
                        {formatPrice(decantPricing.originalPrice)}
                      </span>
                      <span className="rounded-full bg-[#d52f45] px-3 py-1 text-sm font-extrabold text-white">
                        DECANT OFFER
                      </span>
                    </>
                  )}
                </>
              )}
            </div>

            {product.kokoPay && (
              <button
                className="koko-pay-button mt-4 flex max-w-max cursor-pointer items-center gap-3 rounded-md border border-[#ead8ce] bg-white px-4 py-3 text-left"
                type="button"
                onClick={() => openKokoPayInfo(fullBottlePricing.priceValue)}
                aria-label={`Open KOKO Pay for ${product.name}`}
              >
                <img className="h-9 w-auto object-contain" src="/assets/koko-pay.png" alt="KOKO Pay" />
                <span className="font-bold text-[#8f563e]">{product.kokoPay}</span>
              </button>
            )}

            <div
              className="relative mt-6 inline-block"
              onMouseEnter={() =>
                product.isInStock !== false && product.decant?.priceValue && setIsOptionPickerOpen(true)
              }
              onMouseLeave={() => product.decant?.priceValue && setIsOptionPickerOpen(false)}
            >
              {product.isInStock !== false && product.decant?.priceValue && isOptionPickerOpen && (
                <div className="cart-option-pop absolute bottom-[calc(100%-1px)] left-0 z-10 w-[min(320px,calc(100vw-40px))] rounded-lg border border-[#ead8ce] bg-white p-3 shadow-[0_18px_44px_rgba(143,86,62,0.18)]">
                  <p className="mb-2 text-center text-xs font-extrabold uppercase text-[#d7a17c]">
                    Select option
                  </p>
                  <div className="grid gap-2">
                    <button
                      className="cart-option-choice rounded-md px-4 py-3 text-sm font-black"
                      type="button"
                      onClick={(event) => addSelectedProductToCart(event, "decant")}
                    >
                      {product.decant.size || "10mL"} decant - {formatPrice(decantPricing.priceValue)}
                    </button>
                    <button
                      className="cart-option-choice rounded-md px-4 py-3 text-sm font-black"
                      type="button"
                      onClick={(event) => addSelectedProductToCart(event, "full")}
                    >
                      Full bottle - {formatPrice(fullBottlePricing.priceValue)}
                    </button>
                  </div>
                </div>
              )}
              <button
                className={`inline-flex min-h-11 items-center justify-center gap-2 rounded-md px-5 font-bold shadow-sm ${
                  product.isInStock === false
                    ? "cursor-not-allowed bg-[#f7eee9] text-[#a8948a]"
                    : "cursor-pointer bg-linear-to-br from-[#c88763] to-[#8f563e] text-white"
                }`}
                type="button"
                onClick={(event) =>
                  product.isInStock === false
                    ? null
                    : product.decant?.priceValue
                    ? setIsOptionPickerOpen((currentValue) => !currentValue)
                    : addSelectedProductToCart(event, "full")
                }
                disabled={product.isInStock === false}
                aria-expanded={product.decant?.priceValue ? isOptionPickerOpen : undefined}
              >
                <ShoppingCart aria-hidden="true" size={18} />
                {product.isInStock === false ? "Out of Stock" : "Add to Cart"}
              </button>
            </div>
          </div>
        </div>
      </section>

      <section className="px-[clamp(18px,5vw,72px)] py-[clamp(54px,8vw,96px)]">
        <div className="grid gap-5 lg:grid-cols-3">
          <InfoTile label="Fragrance Family" value={product.fragranceFamily} />
          <InfoTile label="Release Year" value={product.releaseYear} />
          <InfoTile label="Available Sizes" value={product.volume} />
        </div>

        <div className="mt-8 grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
          <section className="rounded-lg border border-[#ead8ce] bg-white p-6 shadow-[0_18px_45px_rgba(143,86,62,0.08)]">
            <p className="mb-3 text-xs font-extrabold uppercase text-[#d7a17c]">Fragrance Notes</p>
            <div className="grid gap-4">
              {product.notes.map((note) => (
                <div className="border-l-2 border-[#d7a17c] pl-4" key={note.label}>
                  <h2 className="font-serif text-2xl text-[#9b5f45]">{note.label}</h2>
                  <p className="mt-1 text-[#5f4c43]">{note.value}</p>
                </div>
              ))}
            </div>
          </section>

          <section className="rounded-lg border border-[#ead8ce] bg-[#fff8f3] p-6 shadow-[0_18px_45px_rgba(143,86,62,0.08)]">
            <p className="mb-3 text-xs font-extrabold uppercase text-[#d7a17c]">Main Accords</p>
            <div className="flex flex-wrap gap-3">
              {product.accords.map((accord) => (
                <span
                  className="rounded-full border border-[#d8b49f] bg-white px-4 py-2 font-bold text-[#8f563e]"
                  key={accord}
                >
                  {accord}
                </span>
              ))}
            </div>
            {product.perfumers && (
              <p className="mt-6 text-sm leading-[1.7] text-[#6f5d54]">Perfumers: {product.perfumers}</p>
            )}
          </section>
        </div>

        {product.bestFor.length > 0 && (
          <section className="mt-8 rounded-lg border border-[#ead8ce] bg-white p-6 shadow-[0_18px_45px_rgba(143,86,62,0.08)]">
            <p className="mb-3 text-xs font-extrabold uppercase text-[#d7a17c]">Best For</p>
            <div className="flex flex-wrap gap-3">
              {product.bestFor.map((occasion) => (
                <span className="rounded-md bg-[#fff7f1] px-4 py-2 font-bold text-[#8f563e]" key={occasion}>
                  {occasion}
                </span>
              ))}
            </div>
          </section>
        )}
      </section>
    </main>
  );
}
