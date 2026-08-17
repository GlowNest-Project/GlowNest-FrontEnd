import { useState } from "react";
import { Mail } from "lucide-react";
import { whatsappLink } from "../utils/whatsapp";

export default function Footer() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");

  function sendEmailRequest(event) {
    event.preventDefault();
    const cleanEmail = email.trim();

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      setError("Please enter a valid email address.");
      return;
    }

    setError("");
    window.open(
      whatsappLink(`Hi GlowNest, please contact me at ${cleanEmail}.`),
      "_blank",
      "noopener,noreferrer"
    );
  }

  return (
    <footer
      className="grid items-center gap-[clamp(28px,6vw,80px)] border-t border-[#ead8ce] bg-[#fff8f3] px-[clamp(18px,5vw,72px)] py-[clamp(44px,7vw,84px)] print:hidden lg:grid-cols-[minmax(0,1fr)_minmax(320px,520px)]"
      id="contact"
    >
      <div>
        <h2 className="my-3 font-serif text-[clamp(2rem,4vw,3rem)] leading-none text-[#9b5f45]">
          Ready to order?
        </h2>
        <p className="mb-0 leading-[1.7] text-[#6f5d54]">
          Message GlowNest on WhatsApp for availability, prices, and delivery details.
        </p>
      </div>
      <div className="w-full">
        <label className="mb-2 block text-sm font-extrabold uppercase tracking-[0.08em] text-[#9b5f45]" htmlFor="footer-email">
          Request a reply by email
        </label>
        <form className="footer-email-form" onSubmit={sendEmailRequest}>
          <Mail aria-hidden="true" className="footer-email-icon" size={19} strokeWidth={2.2} />
          <input
            aria-describedby={error ? "footer-email-error" : undefined}
            aria-invalid={Boolean(error)}
            autoComplete="email"
            className="footer-email-field"
            id="footer-email"
            onChange={(event) => {
              setEmail(event.target.value);
              setError("");
            }}
            placeholder="Your email address"
            type="email"
            value={email}
          />
          <button className="footer-email-send" type="submit">Send</button>
        </form>
        {error && (
          <p className="mt-2 text-sm font-bold text-[#c04c4c]" id="footer-email-error">
            {error}
          </p>
        )}
        <a
          className="mt-3 inline-flex font-bold text-[#8f563e] underline decoration-[#d7a17c] underline-offset-4"
          href={whatsappLink()}
          target="_blank"
          rel="noreferrer"
        >
          Or message 076 672 1584 directly
        </a>
      </div>
    </footer>
  );
}
