import { useEffect, useState } from "react";
import {
  ArrowLeft,
  Eye,
  EyeOff,
  LoaderCircle,
  LockKeyhole,
  Mail,
  Phone,
  ShieldCheck,
  UserRound,
} from "lucide-react";
import PasswordStrength from "../components/PasswordStrength";
import { adminLogin, adminRegister, getAdminSetupStatus } from "../utils/api";
import { navigateTo } from "../utils/navigation";

const initialForm = {
  name: "",
  phone: "",
  email: "",
  password: "",
  confirmPassword: "",
};

function AdminField({ autoComplete, icon: Icon, label, name, onChange, placeholder, type = "text", value }) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-bold text-[#6f5d54]">{label}</span>
      <span className="login-slide-field flex min-h-12 items-center gap-3 px-4">
        <Icon aria-hidden="true" className="text-[#b67858]" size={18} />
        <input
          aria-label={label}
          autoComplete={autoComplete}
          className="min-w-0 flex-1 bg-transparent text-sm font-bold text-[#37231b] outline-none placeholder:text-[#9a8074]"
          name={name}
          onChange={onChange}
          placeholder={placeholder}
          type={type}
          value={value}
        />
      </span>
    </label>
  );
}

export default function AdminLoginPage({ onAuthenticated }) {
  const [form, setForm] = useState(initialForm);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [setupStatus, setSetupStatus] = useState("loading");

  const requiresSetup = setupStatus === "required";

  useEffect(() => {
    let cancelled = false;

    getAdminSetupStatus()
      .then(({ requiresSetup: needsSetup }) => {
        if (!cancelled) {
          setSetupStatus(needsSetup ? "required" : "ready");
        }
      })
      .catch((requestError) => {
        if (!cancelled) {
          setSetupStatus("error");
          setError(requestError.message);
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  function updateField(event) {
    const { name, value } = event.target;
    setForm((currentForm) => ({ ...currentForm, [name]: value }));
    setError("");
  }

  async function submitForm(event) {
    event.preventDefault();
    const email = form.email.trim();

    if (requiresSetup && form.name.trim().length < 2) {
      setError("Enter the administrator's full name.");
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError("Enter a valid admin email address.");
      return;
    }

    if (form.password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }

    if (requiresSetup && form.password !== form.confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setIsSubmitting(true);
    setError("");

    try {
      const result = requiresSetup
        ? await adminRegister({
            name: form.name.trim(),
            phone: form.phone.trim(),
            email,
            password: form.password,
          })
        : await adminLogin({ email, password: form.password });

      if (result.user?.role !== "admin") {
        throw new Error("This account does not have administrator access.");
      }

      onAuthenticated?.({ token: result.token, user: result.user });
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="login-page flex min-h-screen items-center justify-center px-4 py-10 sm:px-6">
      <section className="w-full max-w-[480px] overflow-hidden rounded-[30px] border border-[#ead8ce] bg-white shadow-[0_24px_60px_rgba(65,41,31,0.16)]">
        <div className="bg-[linear-gradient(135deg,#c88763_0%,#9b5f45_48%,#6f3f30_100%)] px-7 py-9 text-center text-white sm:px-10">
          <img
            className="mx-auto h-20 w-20 rounded-full object-cover shadow-[0_12px_30px_rgba(39,27,22,0.24)]"
            src="/assets/glownest-logo.png"
            alt="GlowNest logo"
          />
          <p className="mt-5 text-xs font-black uppercase tracking-[0.18em] text-white/75">
            Secure management portal
          </p>
          <h1 className="mt-2 font-serif text-4xl leading-tight">
            {requiresSetup ? "Create First Admin" : "Admin Sign In"}
          </h1>
          {requiresSetup && (
            <p className="mx-auto mt-3 max-w-[340px] text-sm font-semibold leading-[1.6] text-white/80">
              Set up the first administrator account for this GlowNest installation.
            </p>
          )}
        </div>

        {setupStatus === "loading" ? (
          <div className="flex items-center justify-center gap-3 px-7 py-14 font-bold text-[#8f563e]">
            <LoaderCircle aria-hidden="true" className="animate-spin" size={22} />
            Checking admin database...
          </div>
        ) : setupStatus === "error" ? (
          <div className="px-7 py-10 text-center sm:px-10">
            <ShieldCheck aria-hidden="true" className="mx-auto text-[#c04c4c]" size={34} />
            <h2 className="mt-4 font-serif text-3xl text-[#9b5f45]">Admin database unavailable</h2>
            <p className="mt-3 rounded-md bg-[#fdecec] px-4 py-3 text-sm font-bold leading-[1.6] text-[#c04c4c]">
              {error}
            </p>
            <button
              className="login-slide-submit mt-6 min-h-11 cursor-pointer rounded-full px-8 font-black text-white"
              type="button"
              onClick={() => window.location.reload()}
            >
              Try Again
            </button>
          </div>
        ) : (
          <form className="px-7 py-8 sm:px-10" onSubmit={submitForm}>
            <div className="mb-6 flex items-center justify-center gap-2 text-[#9b5f45]">
              <ShieldCheck aria-hidden="true" size={20} strokeWidth={2.3} />
              <p className="text-sm font-black uppercase tracking-[0.1em]">
                {requiresSetup ? "Administrator setup" : "Authorized access only"}
              </p>
            </div>

            <div className="grid gap-4">
              {requiresSetup && (
                <>
                  <AdminField
                    autoComplete="name"
                    icon={UserRound}
                    label="Full name"
                    name="name"
                    onChange={updateField}
                    placeholder="Administrator name"
                    value={form.name}
                  />
                  <AdminField
                    autoComplete="tel"
                    icon={Phone}
                    label="Phone number"
                    name="phone"
                    onChange={updateField}
                    placeholder="Optional phone number"
                    value={form.phone}
                  />
                </>
              )}

              <AdminField
                autoComplete="email"
                icon={Mail}
                label="Admin email"
                name="email"
                onChange={updateField}
                placeholder="admin@example.com"
                type="email"
                value={form.email}
              />

              <label className="block">
                <span className="mb-2 block text-sm font-bold text-[#6f5d54]">Password</span>
                <span className="login-slide-field flex min-h-12 items-center gap-3 px-4">
                  <LockKeyhole aria-hidden="true" className="text-[#b67858]" size={18} />
                  <input
                    aria-label="Password"
                    autoComplete={requiresSetup ? "new-password" : "current-password"}
                    className="min-w-0 flex-1 bg-transparent text-sm font-bold text-[#37231b] outline-none placeholder:text-[#9a8074]"
                    name="password"
                    onChange={updateField}
                    placeholder="Enter your password"
                    type={showPassword ? "text" : "password"}
                    value={form.password}
                  />
                  <button
                    aria-label={showPassword ? "Hide password" : "Show password"}
                    className="cursor-pointer bg-transparent text-[#8f563e]"
                    type="button"
                    onClick={() => setShowPassword((currentValue) => !currentValue)}
                  >
                    {showPassword ? <Eye size={18} /> : <EyeOff size={18} />}
                  </button>
                </span>
              </label>

              {requiresSetup && <PasswordStrength password={form.password} />}

              {requiresSetup && (
                <AdminField
                  autoComplete="new-password"
                  icon={LockKeyhole}
                  label="Confirm password"
                  name="confirmPassword"
                  onChange={updateField}
                  placeholder="Repeat your password"
                  type={showPassword ? "text" : "password"}
                  value={form.confirmPassword}
                />
              )}
            </div>

            {error && (
              <p className="mt-5 rounded-md bg-[#fdecec] px-4 py-3 text-center text-sm font-bold text-[#c04c4c]">
                {error}
              </p>
            )}

            <button
              className="login-slide-submit mt-7 min-h-12 w-full cursor-pointer rounded-full px-8 font-black text-white disabled:cursor-wait disabled:opacity-60"
              disabled={isSubmitting}
              type="submit"
            >
              {isSubmitting
                ? requiresSetup
                  ? "Creating Admin..."
                  : "Signing In..."
                : requiresSetup
                  ? "Create Admin Account"
                  : "Sign In to Dashboard"}
            </button>

            <button
              className="mx-auto mt-5 flex cursor-pointer items-center gap-2 bg-transparent text-sm font-bold text-[#8f563e]"
              type="button"
              onClick={() => navigateTo("/")}
            >
              <ArrowLeft aria-hidden="true" size={16} />
              Back to store
            </button>
          </form>
        )}
      </section>
    </main>
  );
}
