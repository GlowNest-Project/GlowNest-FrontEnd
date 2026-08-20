import { useEffect, useState } from "react";
import { categories, offers } from "../data/products";
import { navigateTo } from "../utils/navigation";
import { whatsappLink } from "../utils/whatsapp";
import { useScrollReveal } from "../hooks/useScrollReveal";
import { getProducts } from "../utils/api";
import { formatPrice } from "../utils/format";

function Hero() {
  return (
    <section
      className="grid min-h-auto items-center gap-[clamp(32px,6vw,80px)] bg-[radial-gradient(circle_at_78%_32%,rgba(215,161,124,0.22),transparent_34%),linear-gradient(135deg,#ffffff_0%,#fff8f3_55%,#f7eee9_100%)] px-[clamp(18px,5vw,72px)] py-[clamp(48px,8vw,96px)] md:min-h-[calc(100vh-73px)] lg:grid-cols-[minmax(0,1fr)_minmax(280px,540px)]"
      id="home"
    >
      <div className="home-hero-copy max-w-[720px]">
        <p className="mb-3 text-sm font-extrabold uppercase text-[#d7a17c] md:text-base">
          Perfumes | Cosmetics | Beauty Essentials
        </p>
        <h1 className="m-0 font-serif text-[4.2rem] leading-[0.86] text-[#9b5f45] sm:text-[clamp(4.5rem,12vw,9.5rem)]">
          GlowNest
        </h1>
        <p className="my-7 max-w-[590px] text-base leading-[1.8] text-[#5f4c43] md:text-[clamp(1rem,2vw,1.22rem)]">
          Discover luxury-inspired fragrances and everyday cosmetics selected to make your beauty
          routine feel elegant, confident, and effortless.
        </p>
        <div className="flex flex-wrap gap-3.5">
          <a
            className="inline-flex min-h-11 items-center justify-center rounded-md bg-linear-to-br from-[#c88763] to-[#8f563e] px-5 font-bold text-white shadow-sm"
            href={whatsappLink()}
            target="_blank"
            rel="noreferrer"
          >
            Order on WhatsApp
          </a>
          <button
            className="inline-flex min-h-11 cursor-pointer items-center justify-center rounded-md border border-[#d8b49f] bg-white px-5 font-bold text-[#8f563e]"
            type="button"
            onClick={() => navigateTo("/perfumes")}
          >
            View Products
          </button>
        </div>
      </div>

      <div className="home-hero-visual relative isolate overflow-hidden rounded-[28px] border border-white/70 bg-white/70 p-2 shadow-[0_34px_90px_rgba(143,86,62,0.18)]">
        <span className="home-hero-orb home-hero-orb-one" aria-hidden="true" />
        <span className="home-hero-orb home-hero-orb-two" aria-hidden="true" />
        <div className="home-hero-image-wrap relative overflow-hidden rounded-[22px]">
          <img
            className="home-hero-image h-full min-h-[420px] w-full object-cover"
            src="/assets/glownest-hero-perfumes.png"
            alt="Luxury perfume bottles in warm golden light"
          />
          <span className="home-hero-shimmer" aria-hidden="true" />
          <div className="absolute inset-x-4 bottom-4 rounded-2xl border border-white/60 bg-white/75 p-4 shadow-lg backdrop-blur-md">
            <p className="text-xs font-extrabold uppercase tracking-[0.16em] text-[#c88763]">
              Curated by GlowNest
            </p>
            <p className="mt-1 font-serif text-2xl leading-tight text-[#8f563e]">
              Find a scent that feels like you.
            </p>
          </div>
        </div>
        <span className="home-floating-badge home-floating-badge-one">Premium scents</span>
        <span className="home-floating-badge home-floating-badge-two">New arrivals</span>
      </div>
    </section>
  );
}

function CategoryCard({ category, index }) {
  const revealRef = useScrollReveal();

  return (
    <article
      className="home-reveal min-h-auto border-b border-[#ead8ce] p-[clamp(24px,4vw,42px)] lg:min-h-[230px] lg:border-r lg:border-b-0 last:border-b-0 lg:last:border-r-0"
      key={category.title}
      ref={revealRef}
      style={{ "--home-reveal-delay": `${index * 110}ms` }}
    >
      <h2
        className="my-3 font-serif text-[clamp(2rem,4vw,3.3rem)] leading-none text-[#9b5f45]"
        id={category.title.toLowerCase()}
      >
        {category.title}
      </h2>
      <p className="leading-[1.7] text-[#6f5d54]">{category.copy}</p>
    </article>
  );
}

function CategoryStrip() {
  return (
    <section className="grid border-y border-[#ead8ce] bg-white lg:grid-cols-3" aria-label="Product categories">
      {categories.map((category, index) => (
        <CategoryCard category={category} index={index} key={category.title} />
      ))}
    </section>
  );
}

function FeaturedProductCard({ product, index }) {
  const revealRef = useScrollReveal();
  const detailPath = `/${product.category}/${product.slug}`;

  return (
    <button
      className="home-photo-card home-reveal group relative isolate min-h-[360px] cursor-pointer overflow-hidden rounded-[24px] bg-[#f7eee9] shadow-[0_20px_50px_rgba(143,86,62,0.12)]"
      onClick={() => navigateTo(detailPath)}
      ref={revealRef}
      type="button"
      style={{
        "--home-reveal-delay": `${index * 120}ms`,
        "--home-photo-rotate": `${index % 2 === 0 ? "-2deg" : "2deg"}`,
      }}
    >
      <img
        className="home-photo-image absolute inset-0 h-full w-full object-cover"
        src={product.image}
        alt={product.name}
      />
      <span className="home-photo-glow" aria-hidden="true" />
      <div className="absolute inset-x-3 bottom-3 z-10 rounded-2xl border border-white/60 bg-white/82 p-4 shadow-lg backdrop-blur-md">
        <p className="text-[0.68rem] font-extrabold uppercase tracking-[0.14em] text-[#c88763]">
          {product.category === "perfumes" ? "Perfume" : "Cosmetic"}
        </p>
        <h3 className="mt-1 line-clamp-2 text-lg font-extrabold leading-tight text-[#271b16]">
          {product.name}
        </h3>
        <div className="mt-3 flex items-center justify-between gap-3">
          <span className="font-extrabold text-[#9b5f45]">{formatPrice(product.priceValue)}</span>
          <span className="text-xs font-bold uppercase tracking-wide text-[#8f563e]">View details →</span>
        </div>
      </div>
    </button>
  );
}

function FeaturedProducts() {
  const [products, setProducts] = useState([]);

  useEffect(() => {
    let cancelled = false;

    Promise.all([getProducts("perfumes"), getProducts("cosmetics")])
      .then(([perfumes, cosmetics]) => {
        if (cancelled) return;

        const perfumePhotos = perfumes.filter((product) => product.image).slice(0, 4);
        const cosmeticPhotos = cosmetics.filter((product) => product.image).slice(0, 4);
        const mixedProducts = [];
        const longestList = Math.max(perfumePhotos.length, cosmeticPhotos.length);

        for (let index = 0; index < longestList; index += 1) {
          if (perfumePhotos[index]) mixedProducts.push(perfumePhotos[index]);
          if (cosmeticPhotos[index]) mixedProducts.push(cosmeticPhotos[index]);
        }

        setProducts(mixedProducts.slice(0, 6));
      })
      .catch(() => {});

    return () => {
      cancelled = true;
    };
  }, []);

  if (products.length === 0) return null;

  return (
    <section className="overflow-hidden bg-white px-[clamp(18px,5vw,72px)] py-[clamp(54px,8vw,96px)]">
      <div className="mb-9 max-w-[760px]">
        <p className="mb-3 text-xs font-extrabold uppercase tracking-[0.14em] text-[#d7a17c]">Fresh from GlowNest</p>
        <h2 className="font-serif text-[clamp(2.4rem,6vw,5.2rem)] leading-[0.95] text-[#9b5f45]">Discover the collection</h2>
        <p className="mt-4 max-w-[620px] leading-[1.7] text-[#6f5d54]">
          Scroll through our latest perfume and cosmetic selections. Tap any photo to see the full product details.
        </p>
      </div>
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {products.map((product, index) => (
          <FeaturedProductCard index={index} key={`${product.category}-${product.id}`} product={product} />
        ))}
      </div>
    </section>
  );
}

function OfferCard({ offer, index }) {
  const revealRef = useScrollReveal();

  return (
    <article
      className="home-reveal home-offer-card flex min-h-[250px] flex-col justify-end rounded-lg border border-dashed border-[#d8b49f] bg-linear-to-br from-white to-[#f7e4d8] p-6"
      ref={revealRef}
      style={{ "--home-reveal-delay": `${index * 120}ms` }}
    >
      <p className="font-extrabold text-[#d7a17c]">{offer.label}</p>
      <h3 className="m-0 text-xl text-[#271b16]">{offer.title}</h3>
      <span className="text-[#6f5d54]">{offer.copy}</span>
    </article>
  );
}

function Offers() {
  return (
    <section className="bg-[#fff8f3] px-[clamp(18px,5vw,72px)] py-[clamp(54px,8vw,96px)]" id="offers">
      <div className="mb-8 max-w-[720px]">
        <p className="mb-3 text-xs font-extrabold uppercase text-[#d7a17c]">Advertisement Posts</p>
        <h2 className="my-3 font-serif text-[clamp(2rem,4vw,3.3rem)] leading-none text-[#9b5f45]">
          Latest Offers
        </h2>
        <p className="leading-[1.7] text-[#6f5d54]">
          Seasonal selections, beauty bundles, and fresh arrivals from GlowNest.
        </p>
      </div>

      <div className="grid gap-[18px] lg:grid-cols-3">
        {offers.map((offer, index) => (
          <OfferCard index={index} key={offer.label} offer={offer} />
        ))}
      </div>
    </section>
  );
}

export default function HomePage() {
  return (
    <main>
      <Hero />
      <CategoryStrip />
      <FeaturedProducts />
      <Offers />
    </main>
  );
}
