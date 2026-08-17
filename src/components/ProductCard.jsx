import { useState } from "react";
import { useScrollReveal } from "../hooks/useScrollReveal";
import { navigateTo } from "../utils/navigation";
import { formatDecant, formatPrice } from "../utils/format";
import { openKokoPayInfo } from "../utils/kokoPay";
import { getDiscountPricing } from "../utils/discount";
import { useDiscountClock } from "../hooks/useDiscountClock";

const popImageTuning = {
  "azzaro-the-most-wanted-parfum": { height: "88%", width: "54%", hoverScale: 0.96 },
  "azzaro-the-most-wanted-eau-de-parfum-intense": { height: "88%", width: "52%", hoverScale: 0.96 },
  "lattafa-khamrah-eau-de-parfum": { height: "88%", width: "54%", hoverScale: 0.96 },
  "lattafa-khamrah-qahwa-eau-de-parfum": { height: "94%", width: "60%", hoverScale: 0.98 },
  "lattafa-hayaati-gold-elixir-eau-de-parfum": { height: "88%", width: "52%", hoverScale: 0.96 },
  "yves-saint-laurent-y-eau-de-parfum-ysl-y-edp": { height: "90%", width: "54%", hoverScale: 0.98 },
  "afnan-9pm-eau-de-parfum": { height: "96%", width: "62%", hoverScale: 1 },
  "afnan-9pm-night-out-extrait-de-parfum": { height: "106%", width: "72%", hoverScale: 1.04 },
  "afnan-9pm-rebel-eau-de-parfum": { height: "92%", width: "58%", hoverScale: 0.98 },
  "rasasi-hawas-fire-for-him-eau-de-parfum": { height: "112%", width: "78%", hoverScale: 1.02 },
  "afnan-supremacy-collector-s-edition-eau-de-parfum": { height: "92%", width: "58%", hoverScale: 0.98 },
  "rasasi-hawas-ice-for-him-eau-de-parfum": { height: "100%", width: "66%", hoverScale: 1.02 },
};

function popImageStyle(product) {
  const tuning = popImageTuning[product.slug] || {};

  return {
    "--pop-height": tuning.height || "88%",
    "--pop-hover-scale": tuning.hoverScale || 0.98,
    "--pop-width": tuning.width || "54%",
  };
}

export default function ProductCard({ product, onAddToCart, revealIndex = 0 }) {
  const [isAdded, setIsAdded] = useState(false);
  const [isOptionPickerOpen, setIsOptionPickerOpen] = useState(false);
  const revealRef = useScrollReveal();
  const detailPath =
    product.category === "perfumes" && product.slug ? `/perfumes/${product.slug}` : null;
  const hasDecantOption = Boolean(product.decant?.priceValue);
  const isInStock = product.isInStock !== false;
  const tunedPopImageStyle = product.popImage ? popImageStyle(product) : undefined;
  const discountClock = useDiscountClock(product);
  const fullBottlePricing = getDiscountPricing(product, discountClock);
  const decantPricing = product.decant
    ? getDiscountPricing(
        {
          ...product,
          option: "decant",
          originalPriceValue: product.decant.originalPriceValue ?? product.decant.priceValue,
        },
        discountClock
      )
    : null;

  function openProductDetails() {
    if (product.category === "perfumes") {
      sessionStorage.setItem("glownestPerfumesScrollY", String(window.scrollY));
      sessionStorage.setItem("glownestPerfumesSelectedProduct", product.id || product.name);
    }

    navigateTo(detailPath);
  }

  function selectedProductForCart(option) {
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

  function addProductToCart(event, option = "full") {
    const button = event.currentTarget;
    const selectedProduct = selectedProductForCart(option);

    setIsAdded(true);
    setIsOptionPickerOpen(false);
    onAddToCart(selectedProduct, button);
    window.setTimeout(() => setIsAdded(false), 1200);
  }

  function handleAddButtonClick(event) {
    if (!isInStock) {
      return;
    }

    if (hasDecantOption) {
      setIsOptionPickerOpen((currentValue) => !currentValue);
      return;
    }

    addProductToCart(event);
  }

  return (
    <article
      className="product-card scroll-reveal group flex h-full flex-col overflow-visible rounded-lg border border-[#ead8ce] bg-white shadow-[0_14px_34px_rgba(143,86,62,0.08)]"
      data-cart-source
      id={product.id ? `product-${product.id}` : undefined}
      ref={revealRef}
      style={{ "--reveal-delay": `${(revealIndex % 10) * 125}ms` }}
    >
      {product.image ? (
        <div
          className="product-pop-stage relative h-[185px] w-full flex-none overflow-visible rounded-t-lg bg-[#fff8f3] sm:h-[200px] xl:h-[215px]"
          style={tunedPopImageStyle}
        >
          <div className="product-poster-wrap absolute inset-0 rounded-t-lg">
            <img
              className="product-poster-image h-full w-full rounded-t-lg object-cover object-center"
              src={product.image}
              alt={product.name}
            />
          </div>
          {product.popImage && (
            <img
              className="product-pop-image pointer-events-none absolute left-1/2 object-contain"
              src={product.popImage}
              alt=""
              aria-hidden="true"
            />
          )}
        </div>
      ) : (
        <div className={`product-image ${product.shape}`} />
      )}
      <div className="flex flex-1 flex-col p-3">
        <p className="mb-1.5 text-[0.62rem] font-extrabold uppercase text-[#d7a17c]">{product.type}</p>
        {!isInStock && (
          <span className="mb-2 inline-flex w-max rounded-full bg-[#fff0f0] px-2.5 py-1 text-[0.65rem] font-extrabold uppercase text-[#c04c4c]">
            Out of stock
          </span>
        )}
        {detailPath ? (
          <button
            className="m-0 min-h-[2.65rem] cursor-pointer bg-transparent p-0 text-left text-[0.94rem] font-bold leading-snug text-[#271b16] hover:text-[#9b5f45]"
            type="button"
            onClick={openProductDetails}
          >
            {product.name}
          </button>
        ) : (
          <h3 className="m-0 min-h-[2.65rem] text-[0.94rem] leading-snug text-[#271b16]">{product.name}</h3>
        )}
        {product.shortDescription && (
          <p className="mt-2 min-h-[6rem] text-[0.8rem] leading-[1.5] text-[#6f5d54]">
            {product.shortDescription}
          </p>
        )}
        <div className="mt-auto pt-3">
          {product.decant && (
            <div className="flex flex-wrap items-center gap-2 rounded-md border border-[#ead8ce] bg-[#fff8f3] px-3 py-2 text-xs font-bold text-[#8f563e]">
              <span>{formatDecant({ ...product.decant, priceValue: decantPricing.priceValue })}</span>
              {decantPricing.isActive && (
                <>
                  <span className="text-[#8f756f] line-through">
                    {formatPrice(decantPricing.originalPrice)}
                  </span>
                  <span className="rounded-full bg-[#d52f45] px-2 py-0.5 text-[0.6rem] text-white">
                    DECANT OFFER
                  </span>
                </>
              )}
            </div>
          )}
          {product.kokoPay && (
            <button
              className="koko-pay-button mt-2 flex min-h-[3rem] w-full cursor-pointer items-center gap-2 rounded-md border border-[#ead8ce] bg-white px-3 py-2 text-left"
              type="button"
              onClick={() => openKokoPayInfo(fullBottlePricing.priceValue)}
              aria-label={`Open KOKO Pay for ${product.name}`}
            >
              <img className="h-5 w-auto flex-none object-contain" src="/assets/koko-pay.png" alt="KOKO Pay" />
              <span className="text-xs font-bold leading-snug text-[#8f563e]">{product.kokoPay}</span>
            </button>
          )}
          <div className="my-2.5 flex flex-wrap items-center gap-2">
            <p className="text-base font-extrabold text-[#9b5f45]">
              {formatPrice(fullBottlePricing.priceValue)}
            </p>
            {fullBottlePricing.isActive && (
              <>
                <span className="text-xs font-bold text-[#8f756f] line-through">
                  {formatPrice(fullBottlePricing.originalPrice)}
                </span>
                <span className="rounded-full bg-[#d52f45] px-2 py-0.5 text-[0.65rem] font-extrabold text-white">
                  {fullBottlePricing.discountType === "fixed_amount"
                    ? `${formatPrice(fullBottlePricing.amount)} OFF`
                    : `${fullBottlePricing.percentage}% OFF`}
                </span>
              </>
            )}
          </div>
          <div
            className="relative"
            onMouseEnter={() => isInStock && hasDecantOption && setIsOptionPickerOpen(true)}
            onMouseLeave={() => hasDecantOption && setIsOptionPickerOpen(false)}
          >
            {isInStock && hasDecantOption && isOptionPickerOpen && (
              <div className="cart-option-pop absolute right-0 bottom-[calc(100%-1px)] left-0 z-10 rounded-lg border border-[#ead8ce] bg-white p-2 shadow-[0_18px_44px_rgba(143,86,62,0.18)]">
                <p className="mb-2 text-center text-[0.68rem] font-extrabold uppercase text-[#d7a17c]">
                  Select option
                </p>
                <div className="grid gap-2">
                  <button
                    className="cart-option-choice rounded-md px-3 py-2 text-xs font-black"
                    type="button"
                    onClick={(event) => addProductToCart(event, "decant")}
                  >
                      {product.decant.size || "10mL"} decant - {formatPrice(decantPricing.priceValue)}
                  </button>
                  <button
                    className="cart-option-choice rounded-md px-3 py-2 text-xs font-black"
                    type="button"
                    onClick={(event) => addProductToCart(event, "full")}
                  >
                    Full bottle - {formatPrice(fullBottlePricing.priceValue)}
                  </button>
                </div>
              </div>
            )}
            <button
              className={`inline-flex min-h-10 w-full cursor-pointer items-center justify-center rounded-md border text-sm font-bold transition-all duration-300 ${
                !isInStock
                  ? "cursor-not-allowed border-[#ead8ce] bg-[#f7eee9] text-[#a8948a]"
                  : isAdded
                  ? "border-[#30b46f] bg-[#30b46f] text-white shadow-[0_12px_28px_rgba(48,180,111,0.26)]"
                  : "border-[#d8b49f] bg-[#fff7f1] text-[#8f563e] hover:bg-[#f7e4d8]"
              }`}
              type="button"
              onClick={handleAddButtonClick}
              disabled={!isInStock}
              aria-expanded={hasDecantOption ? isOptionPickerOpen : undefined}
            >
              {isInStock ? (isAdded ? "✓ Added" : "Add to Cart") : "Out of Stock"}
            </button>
          </div>
        </div>
      </div>
    </article>
  );
}
