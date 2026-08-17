import { useEffect, useState } from "react";
import { Mail, Phone, Save, UserRound } from "lucide-react";
import { updateCurrentUser } from "../utils/api";
import { navigateTo } from "../utils/navigation";

const emptyForm = {
  name: "",
  phone: "",
  email: "",
};

function AccountField({ icon: Icon, label, name, onChange, type = "text", value }) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-bold text-[#6f5d54]">{label}</span>
      <span className="flex min-h-12 items-center gap-3 rounded-md border border-[#ead8ce] bg-white px-4 shadow-sm">
        <Icon aria-hidden="true" className="text-[#b67858]" size={19} strokeWidth={2.3} />
        <input
          className="min-w-0 flex-1 bg-transparent text-sm font-bold text-[#271b16] outline-none"
          name={name}
          onChange={onChange}
          type={type}
          value={value}
        />
      </span>
    </label>
  );
}

export default function AccountPage({ onAuthenticated, token, user }) {
  const [form, setForm] = useState(emptyForm);
  const [status, setStatus] = useState("idle");
  const [message, setMessage] = useState("");

  useEffect(() => {
    setForm({
      name: user?.name || "",
      phone: user?.phone || "",
      email: user?.email || "",
    });
  }, [user]);

  function updateField(event) {
    const { name, value } = event.target;
    setForm((currentForm) => ({ ...currentForm, [name]: value }));
    setMessage("");
  }

  async function saveAccount(event) {
    event.preventDefault();
    setStatus("saving");
    setMessage("");

    try {
      const updatedUser = await updateCurrentUser(
        {
          name: form.name.trim(),
          phone: form.phone.trim(),
          email: form.email.trim(),
        },
        token
      );

      onAuthenticated?.({ token, user: updatedUser });
      setStatus("saved");
      setMessage("Account details updated successfully.");
    } catch (error) {
      setStatus("idle");
      setMessage(error.message);
    }
  }

  if (!user || !token) {
    return (
      <main className="px-[clamp(18px,5vw,72px)] py-[clamp(72px,10vw,120px)]">
        <section className="mx-auto max-w-[560px] rounded-lg border border-[#ead8ce] bg-white p-8 text-center shadow-[0_18px_45px_rgba(143,86,62,0.09)]">
          <h1 className="font-serif text-4xl text-[#9b5f45]">My Account</h1>
          <p className="mt-3 text-[#6f5d54]">Please login first to view and edit your account details.</p>
          <button
            className="mt-6 inline-flex min-h-11 cursor-pointer items-center justify-center rounded-md bg-linear-to-br from-[#c88763] to-[#8f563e] px-6 font-bold text-white"
            type="button"
            onClick={() => navigateTo("/login")}
          >
            Go to Login
          </button>
        </section>
      </main>
    );
  }

  return (
    <main>
      <section className="bg-[linear-gradient(135deg,#ffffff_0%,#fff8f3_55%,#f7eee9_100%)] px-[clamp(18px,5vw,72px)] py-[clamp(54px,8vw,96px)]">
        <div className="max-w-[760px]">
          <p className="mb-4 text-base font-extrabold uppercase text-[#d7a17c] md:text-lg">
            GlowNest Customer
          </p>
          <h1 className="m-0 flex items-center gap-4 font-serif text-[clamp(3.5rem,10vw,7rem)] leading-[0.92] text-[#9b5f45]">
            <UserRound aria-hidden="true" className="h-12 w-12 sm:h-16 sm:w-16" />
            My Account
          </h1>
          <p className="mt-6 max-w-[620px] text-base leading-[1.8] text-[#5f4c43] md:text-lg">
            View and update your GlowNest account details for faster checkout and order confirmation.
          </p>
        </div>
      </section>

      <section className="px-[clamp(18px,5vw,72px)] py-[clamp(54px,8vw,96px)]">
        <form
          className="mx-auto grid max-w-[720px] gap-5 rounded-lg border border-[#ead8ce] bg-[#fff8f3] p-6 shadow-[0_18px_45px_rgba(143,86,62,0.09)] sm:p-8"
          onSubmit={saveAccount}
        >
          <AccountField icon={UserRound} label="Full name" name="name" onChange={updateField} value={form.name} />
          <AccountField icon={Phone} label="Phone number" name="phone" onChange={updateField} value={form.phone} />
          <AccountField icon={Mail} label="Email address" name="email" onChange={updateField} type="email" value={form.email} />

          {message && (
            <p
              className={`rounded-md px-4 py-3 text-sm font-bold ${
                status === "saved" ? "bg-[#edf9f2] text-[#2f8f5d]" : "bg-[#fdecec] text-[#c04c4c]"
              }`}
            >
              {message}
            </p>
          )}

          <button
            className="inline-flex min-h-12 cursor-pointer items-center justify-center gap-2 rounded-md bg-linear-to-br from-[#c88763] to-[#8f563e] px-6 font-bold text-white shadow-sm disabled:cursor-wait disabled:opacity-70"
            disabled={status === "saving"}
            type="submit"
          >
            <Save aria-hidden="true" size={18} />
            {status === "saving" ? "Saving..." : "Save Changes"}
          </button>
        </form>
      </section>
    </main>
  );
}
