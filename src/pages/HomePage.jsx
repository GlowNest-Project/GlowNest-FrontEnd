import { categories, offers } from "../data/products";
import { navigateTo } from "../utils/navigation";
import { whatsappLink } from "../utils/whatsapp";

function Hero() {
  return (
    <section
      className="grid min-h-auto items-center gap-[clamp(32px,6vw,80px)] bg-[radial-gradient(circle_at_78%_32%,rgba(215,161,124,0.22),transparent_34%),linear-gradient(135deg,#ffffff_0%,#fff8f3_55%,#f7eee9_100%)] px-[clamp(18px,5vw,72px)] py-[clamp(48px,8vw,96px)] md:min-h-[calc(100vh-73px)] lg:grid-cols-[minmax(0,1fr)_minmax(280px,540px)]"
      id="home"
    >
      <div className="max-w-[720px]">
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

      <div className="rounded-lg border border-[#ead8ce] bg-white/80 p-[clamp(24px,4vw,42px)] shadow-[0_28px_80px_rgba(143,86,62,0.12)]">
        <p className="mb-3 text-sm font-extrabold uppercase text-[#d7a17c] md:text-base">
          About GlowNest
        </p>
        <h2 className="my-3 font-serif text-[clamp(2rem,4vw,3.4rem)] leading-none text-[#9b5f45]">
          Beauty products chosen with a premium touch.
        </h2>
        <p className="mt-5 leading-[1.8] text-[#5f4c43]">
          GlowNest brings perfumes and cosmetics together in one elegant place, helping customers
          find beautiful products for daily confidence, thoughtful gifting, and special occasions.
        </p>
        <div className="mt-8 grid gap-3 sm:grid-cols-3 lg:grid-cols-1 xl:grid-cols-3">
          <div className="border-l-2 border-[#d7a17c] pl-4">
            <strong className="block text-[#271b16]">Perfumes</strong>
            <span className="text-sm text-[#6f5d54]">Daily and gift scents</span>
          </div>
          <div className="border-l-2 border-[#d7a17c] pl-4">
            <strong className="block text-[#271b16]">Cosmetics</strong>
            <span className="text-sm text-[#6f5d54]">Everyday beauty picks</span>
          </div>
          <div className="border-l-2 border-[#d7a17c] pl-4">
            <strong className="block text-[#271b16]">Orders</strong>
            <span className="text-sm text-[#6f5d54]">Easy WhatsApp support</span>
          </div>
        </div>
      </div>
    </section>
  );
}

function CategoryStrip() {
  return (
    <section className="grid border-y border-[#ead8ce] bg-white lg:grid-cols-3" aria-label="Product categories">
      {categories.map((category) => (
        <article
          className="min-h-auto border-b border-[#ead8ce] p-[clamp(24px,4vw,42px)] lg:min-h-[230px] lg:border-r lg:border-b-0 last:border-b-0 lg:last:border-r-0"
          key={category.title}
        >
          <h2
            className="my-3 font-serif text-[clamp(2rem,4vw,3.3rem)] leading-none text-[#9b5f45]"
            id={category.title.toLowerCase()}
          >
            {category.title}
          </h2>
          <p className="leading-[1.7] text-[#6f5d54]">{category.copy}</p>
        </article>
      ))}
    </section>
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
        {offers.map((offer) => (
          <article
            className="flex min-h-[250px] flex-col justify-end rounded-lg border border-dashed border-[#d8b49f] bg-linear-to-br from-white to-[#f7e4d8] p-6"
            key={offer.label}
          >
            <p className="font-extrabold text-[#d7a17c]">{offer.label}</p>
            <h3 className="m-0 text-xl text-[#271b16]">{offer.title}</h3>
            <span className="text-[#6f5d54]">{offer.copy}</span>
          </article>
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
      <Offers />
    </main>
  );
}
