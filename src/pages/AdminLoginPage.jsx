import { useState } from "react";
import { ArrowLeft, Eye, EyeOff, LockKeyhole, Mail, Phone, ShieldCheck, UserRound } from "lucide-react";
import PasswordStrength from "../components/PasswordStrength";
import { adminLogin, adminRegister } from "../utils/api";
import { navigateTo } from "../utils/navigation";

const initialForm = {
  name: "",
  phone: "",
  email: "",
  password: "",
  confirmPassword: "",
};

function AdminInput({ autoComplete, icon: Icon, name, onChange, placeholder, type = "text", value }) {
  return (
    <label className="block">
      <span className="login-slide-field flex min-h-12 items-center gap-3 px-4">
        <Icon aria-hidden="true" className="text-[#b67858]" size={18} strokeWidth={2.3} />
        <input
          aria-label={placeholder}
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
  const [mode, setMode] = useState("login");
  const [form, setForm] = useState(initialForm);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const isSignup = mode === "signup";

  function switchMode(nextMode) {
    setMode(nextMode);
    setError("");
  }

  function updateField(event) {
    const { name, value } = event.target;
    setForm((currentForm) => ({ ...currentForm, [name]: value }));
    setError("");
  }

  async function submitForm(event) {
    event.preventDefault();
    const email = form.email.trim().toLowerCase();

    if (isSignup && form.name.trim().length < 2) {
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
    if (isSignup && form.password !== form.confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setIsSubmitting(true);
    setError("");

    try {
      const result = isSignup
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
    <main className="login-page customer-login-page admin-auth-page min-h-screen px-[clamp(16px,4vw,56px)] py-[clamp(18px,3vh,34px)]">
      <span className="admin-auth-orb admin-auth-orb-one" aria-hidden="true" />
      <span className="admin-auth-orb admin-auth-orb-two" aria-hidden="true" />
      <section className="relative z-10 mx-auto max-w-[1080px]">
        <div className="login-page-heading mb-5 text-center">
          <p className="collection-kicker">GlowNest Secure Portal</p>
          <h1 className="m-0 mt-3 font-serif text-[clamp(2.4rem,5.8vw,4.8rem)] leading-[0.92] text-[#9b5f45]">
            Admin Sign in / Sign up
          </h1>
        </div>

        <div className={`login-slider-card admin-login-slider mx-auto ${isSignup ? "show-signup" : ""}`}>
          <div className="login-form-wrap login-signin">
            <form className="login-slide-form" onSubmit={submitForm}>
              <ShieldCheck aria-hidden="true" className="admin-form-shield mx-auto mb-3 text-[#9b5f45]" size={38} />
              <h2 className="m-0 font-serif text-4xl text-[#271b16]">Admin Sign In</h2>
              <p className="mt-4 text-sm font-semibold text-[#7c655c]">Access your secure management dashboard</p>
              <div className="mt-5 grid gap-4">
                <AdminInput autoComplete="email" icon={Mail} name="email" onChange={updateField} placeholder="Admin email" type="email" value={form.email} />
                <div className="relative">
                  <AdminInput autoComplete="current-password" icon={LockKeyhole} name="password" onChange={updateField} placeholder="Password" type={showPassword ? "text" : "password"} value={form.password} />
                  <button aria-label={showPassword ? "Hide password" : "Show password"} className="absolute right-4 top-3.5 cursor-pointer bg-transparent text-[#8f563e]" type="button" onClick={() => setShowPassword((current) => !current)}>
                    {showPassword ? <Eye size={18} /> : <EyeOff size={18} />}
                  </button>
                </div>
              </div>
              {!isSignup && error && <p className="mt-4 rounded-full bg-[#fdecec] px-4 py-2 text-sm font-bold text-[#c04c4c]">{error}</p>}
              <button className="login-slide-submit mx-auto mt-6 block min-h-12 cursor-pointer rounded-full px-9 font-black text-white disabled:cursor-wait disabled:opacity-60" disabled={isSubmitting} type="submit">
                {isSubmitting && !isSignup ? "Signing In..." : "Sign In"}
              </button>
            </form>
          </div>

          <div className="login-form-wrap login-signup">
            <form className="login-slide-form" onSubmit={submitForm}>
              <h2 className="m-0 font-serif text-4xl text-[#271b16]">Create Admin</h2>
              <p className="mt-4 text-sm font-semibold text-[#7c655c]">Register a new administrator account</p>
              <div className="mt-4 grid gap-3">
                <AdminInput autoComplete="name" icon={UserRound} name="name" onChange={updateField} placeholder="Full name" value={form.name} />
                <AdminInput autoComplete="tel" icon={Phone} name="phone" onChange={updateField} placeholder="Phone number (optional)" value={form.phone} />
                <AdminInput autoComplete="email" icon={Mail} name="email" onChange={updateField} placeholder="Admin email" type="email" value={form.email} />
                <div>
                  <div className="relative">
                    <AdminInput autoComplete="new-password" icon={LockKeyhole} name="password" onChange={updateField} placeholder="Password" type={showPassword ? "text" : "password"} value={form.password} />
                    <button aria-label={showPassword ? "Hide password" : "Show password"} className="absolute right-4 top-3.5 cursor-pointer bg-transparent text-[#8f563e]" type="button" onClick={() => setShowPassword((current) => !current)}>
                      {showPassword ? <Eye size={18} /> : <EyeOff size={18} />}
                    </button>
                  </div>
                  <PasswordStrength password={form.password} />
                </div>
                <div className="relative">
                  <AdminInput autoComplete="new-password" icon={LockKeyhole} name="confirmPassword" onChange={updateField} placeholder="Confirm password" type={showConfirmPassword ? "text" : "password"} value={form.confirmPassword} />
                  <button aria-label={showConfirmPassword ? "Hide confirm password" : "Show confirm password"} className="absolute right-4 top-3.5 cursor-pointer bg-transparent text-[#8f563e]" type="button" onClick={() => setShowConfirmPassword((current) => !current)}>
                    {showConfirmPassword ? <Eye size={18} /> : <EyeOff size={18} />}
                  </button>
                </div>
              </div>
              {isSignup && error && <p className="mt-3 rounded-full bg-[#fdecec] px-4 py-2 text-sm font-bold text-[#c04c4c]">{error}</p>}
              <button className="login-slide-submit mt-4 min-h-12 cursor-pointer rounded-full px-9 font-black text-white disabled:cursor-wait disabled:opacity-60" disabled={isSubmitting} type="submit">
                {isSubmitting && isSignup ? "Creating Admin..." : "Sign Up"}
              </button>
            </form>
          </div>

          <div className="login-overlay">
            <div className="login-overlay-panel login-overlay-right">
              <img className="mb-5 h-16 w-16 rounded-full object-cover shadow-lg" src="/assets/glownest-logo.png" alt="GlowNest logo" />
              <h2 className="m-0 font-serif text-4xl leading-tight">New Administrator?</h2>
              <p className="mt-4 max-w-[290px] leading-[1.7] text-white/88">Create a protected admin account to manage products, orders, discounts, and notifications.</p>
              <button className="login-ghost-button mt-7 min-h-11 cursor-pointer rounded-full px-8 font-black text-white" type="button" onClick={() => switchMode("signup")}>Sign Up</button>
            </div>
            <div className="login-overlay-panel login-overlay-left">
              <img className="mb-5 h-16 w-16 rounded-full object-cover shadow-lg" src="/assets/glownest-logo.png" alt="GlowNest logo" />
              <h2 className="m-0 font-serif text-4xl leading-tight">Welcome Back!</h2>
              <p className="mt-4 max-w-[290px] leading-[1.7] text-white/88">Sign in with your administrator credentials to return to the GlowNest dashboard.</p>
              <button className="login-ghost-button mt-7 min-h-11 cursor-pointer rounded-full px-8 font-black text-white" type="button" onClick={() => switchMode("login")}>Sign In</button>
            </div>
          </div>
        </div>

        <button className="mx-auto mt-4 flex cursor-pointer items-center gap-2 bg-transparent text-sm font-bold text-[#8f563e]" type="button" onClick={() => navigateTo("/") }>
          <ArrowLeft aria-hidden="true" size={16} />
          Back to store
        </button>
      </section>
    </main>
  );
}
