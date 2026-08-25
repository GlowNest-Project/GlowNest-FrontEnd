import { useState } from "react";
import { Eye, EyeOff, LockKeyhole, Mail, Phone, UserRound } from "lucide-react";
import PasswordStrength from "../components/PasswordStrength";
import { login, signup } from "../utils/api";

const initialForm = {
  name: "",
  phone: "",
  email: "",
  password: "",
  confirmPassword: "",
};

function validateForm(form, mode) {
  const errors = {};

  if (mode === "signup" && form.name.trim().length < 2) {
    errors.name = "Please enter your name.";
  }

  if (mode === "signup" && form.phone.trim().length < 9) {
    errors.phone = "Enter a valid phone number.";
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
    errors.email = "Enter a valid email address.";
  }

  if (form.password.length < 8) {
    errors.password = "Password must be at least 8 characters.";
  }

  if (mode === "signup" && form.confirmPassword !== form.password) {
    errors.confirmPassword = "Passwords do not match.";
  }

  return errors;
}

function LoginInput({ autoComplete, disabled = false, error, icon: Icon, name, onChange, onCopy, onCut, onDrop, onPaste, placeholder, type = "text", value }) {
  const autoCompleteByField = {
    confirmPassword: "new-password",
    email: "email",
    name: "name",
    password: "current-password",
    phone: "tel",
  };

  return (
    <label className="block">
      <span className="login-slide-field flex min-h-12 items-center gap-3 px-4">
        <Icon aria-hidden="true" className="text-[#b67858]" size={18} strokeWidth={2.3} />
        <input
          aria-invalid={Boolean(error)}
          aria-label={placeholder}
          autoComplete={autoComplete || autoCompleteByField[name]}
          className="min-w-0 flex-1 bg-transparent text-sm font-bold text-[#37231b] outline-none placeholder:text-[#9a8074]"
          name={name}
          onChange={onChange}
          onCopy={onCopy}
          onCut={onCut}
          onDrop={onDrop}
          onPaste={onPaste}
          placeholder={placeholder}
          type={type}
          value={value}
          disabled={disabled}
        />
      </span>
      {error && <span className="mt-1.5 block text-xs font-bold text-[#c04c4c]">{error}</span>}
    </label>
  );
}

export default function LoginPage({ onAuthenticated }) {
  const [mode, setMode] = useState("login");
  const [form, setForm] = useState(initialForm);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const [submittedMessage, setSubmittedMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isSignup = mode === "signup";
  const passwordType = showPassword ? "text" : "password";
  const confirmPasswordType = showConfirmPassword ? "text" : "password";
  const confirmPasswordStatus =
    isSignup && form.confirmPassword
      ? form.confirmPassword === form.password
        ? "match"
        : "mismatch"
      : "";

  function blockPasswordTransfer(event) {
    event.preventDefault();
    setErrors((currentErrors) => ({
      ...currentErrors,
      confirmPassword: "Please type the confirmation password manually.",
    }));
  }

  function switchMode(nextMode) {
    setMode(nextMode);
    setErrors({});
    setSubmittedMessage("");
  }

  function updateField(event) {
    const { name, value } = event.target;
    setForm((currentForm) => ({ ...currentForm, [name]: value }));
    setErrors((currentErrors) => ({ ...currentErrors, [name]: "" }));
    setSubmittedMessage("");
  }

  async function submitForm(event) {
    event.preventDefault();
    const nextErrors = validateForm(form, mode);
    setErrors(nextErrors);

    if (Object.keys(nextErrors).length > 0) {
      return;
    }

    setIsSubmitting(true);
    setSubmittedMessage("");

    try {
      const result = isSignup
        ? await signup({
            name: form.name.trim(),
            phone: form.phone.trim(),
            email: form.email.trim(),
            password: form.password,
          })
        : await login({ email: form.email.trim(), password: form.password });

      onAuthenticated?.({ token: result.token, user: result.user });
    } catch (error) {
      setErrors({ submit: error.message });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="login-page customer-login-page min-h-screen px-[clamp(16px,4vw,56px)] py-[clamp(18px,3vh,34px)]">
      <section className="mx-auto max-w-[1080px]">
        <div className="login-page-heading mb-5 text-center">
          <p className="collection-kicker">GlowNest Account</p>
          <h1 className="m-0 mt-3 font-serif text-[clamp(2.4rem,5.8vw,4.8rem)] leading-[0.92] text-[#9b5f45]">
            Sign in / Sign up
          </h1>
        </div>

        <div className={`login-slider-card mx-auto ${isSignup ? "show-signup" : ""}`}>
          <div className="login-form-wrap login-signin">
            <form className="login-slide-form" onSubmit={submitForm}>
              <h2 className="m-0 font-serif text-4xl text-[#271b16]">Sign In</h2>
              <p className="mt-5 text-sm font-semibold text-[#7c655c]">Use your email and password</p>
              <div className="mt-5 grid gap-4">
                <LoginInput
                  error={!isSignup ? errors.email : ""}
                  icon={Mail}
                  name="email"
                  onChange={updateField}
                  placeholder="Email address"
                  type="email"
                  value={form.email}
                />
                <div className="relative">
                  <LoginInput
                    autoComplete="current-password"
                    error={!isSignup ? errors.password : ""}
                    icon={LockKeyhole}
                    name="password"
                    onChange={updateField}
                    placeholder="Password"
                    type={passwordType}
                    value={form.password}
                  />
                  <button
                    className="absolute right-4 top-3.5 cursor-pointer bg-transparent text-[#8f563e]"
                    type="button"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                    onClick={() => setShowPassword((currentValue) => !currentValue)}
                  >
                    {showPassword ? <Eye size={18} /> : <EyeOff size={18} />}
                  </button>
                </div>
              </div>
              <button className="mx-auto mt-4 block cursor-pointer bg-transparent text-sm font-bold text-[#8f563e]" type="button">
                Forgot your password?
              </button>
              {!isSignup && errors.submit && (
                <p className="mt-4 rounded-full bg-[#fdecec] px-4 py-2 text-sm font-bold text-[#c04c4c]">
                  {errors.submit}
                </p>
              )}
              {submittedMessage && !isSignup && (
                <p className="mt-4 rounded-full bg-[#edf9f2] px-4 py-2 text-sm font-bold text-[#2f8f5d]">
                  {submittedMessage}
                </p>
              )}
              <button
                className="login-slide-submit mx-auto mt-5 block min-h-12 cursor-pointer rounded-full px-9 font-black text-white disabled:cursor-not-allowed disabled:opacity-60"
                disabled={isSubmitting}
                type="submit"
              >
                {isSubmitting && !isSignup ? "Signing In..." : "Sign In"}
              </button>
            </form>
          </div>

          <div className="login-form-wrap login-signup">
            <form className="login-slide-form" onSubmit={submitForm}>
              <h2 className="m-0 font-serif text-4xl text-[#271b16]">Create Account</h2>
              <p className="mt-5 text-sm font-semibold text-[#7c655c]">Register with your details</p>
              <div className="mt-5 grid gap-3.5">
                <LoginInput
                  error={isSignup ? errors.name : ""}
                  icon={UserRound}
                  name="name"
                  onChange={updateField}
                  placeholder="Full name"
                  value={form.name}
                />
                <LoginInput
                  error={isSignup ? errors.phone : ""}
                  icon={Phone}
                  name="phone"
                  onChange={updateField}
                  placeholder="Phone number"
                  value={form.phone}
                />
                <LoginInput
                  error={isSignup ? errors.email : ""}
                  icon={Mail}
                  name="email"
                  onChange={updateField}
                  placeholder="Email address"
                  type="email"
                  value={form.email}
                />
                <div>
                  <div className="relative">
                    <LoginInput
                      autoComplete="new-password"
                      error={isSignup ? errors.password : ""}
                      icon={LockKeyhole}
                      name="password"
                      onChange={updateField}
                      onCopy={blockPasswordTransfer}
                      onCut={blockPasswordTransfer}
                      placeholder="Password"
                      type={passwordType}
                      value={form.password}
                    />
                    <button
                      className="absolute right-4 top-3.5 cursor-pointer bg-transparent text-[#8f563e]"
                      type="button"
                      aria-label={showPassword ? "Hide password" : "Show password"}
                      onClick={() => setShowPassword((currentValue) => !currentValue)}
                    >
                      {showPassword ? <Eye size={18} /> : <EyeOff size={18} />}
                    </button>
                  </div>
                  <PasswordStrength password={form.password} />
                </div>
                <div className="relative">
                  <LoginInput
                    error={isSignup ? errors.confirmPassword : ""}
                    icon={LockKeyhole}
                    name="confirmPassword"
                    onChange={updateField}
                    onDrop={blockPasswordTransfer}
                    onPaste={blockPasswordTransfer}
                    placeholder="Confirm password"
                    type={confirmPasswordType}
                    value={form.confirmPassword}
                  />
                  <button
                    className="absolute right-4 top-3.5 cursor-pointer bg-transparent text-[#8f563e]"
                    type="button"
                    aria-label={showConfirmPassword ? "Hide confirm password" : "Show confirm password"}
                    onClick={() => setShowConfirmPassword((currentValue) => !currentValue)}
                  >
                    {showConfirmPassword ? <Eye size={18} /> : <EyeOff size={18} />}
                  </button>
                </div>
                {confirmPasswordStatus && (
                  <p
                    className={`text-sm font-black ${
                      confirmPasswordStatus === "match" ? "text-[#2f9f68]" : "text-[#c04c4c]"
                    }`}
                  >
                    {confirmPasswordStatus === "match"
                      ? "Password match"
                      : "Password mismatch"}
                  </p>
                )}
              </div>
              {isSignup && errors.submit && (
                <p className="mt-4 rounded-full bg-[#fdecec] px-4 py-2 text-sm font-bold text-[#c04c4c]">
                  {errors.submit}
                </p>
              )}
              {submittedMessage && isSignup && (
                <p className="mt-4 rounded-full bg-[#edf9f2] px-4 py-2 text-sm font-bold text-[#2f8f5d]">
                  {submittedMessage}
                </p>
              )}
              <button
                className="login-slide-submit mt-5 min-h-12 cursor-pointer rounded-full px-9 font-black text-white disabled:cursor-not-allowed disabled:opacity-60"
                disabled={isSubmitting}
                type="submit"
              >
                {isSubmitting
                  ? isSignup
                    ? "Creating Account..."
                    : "Signing in..."
                  : isSignup
                    ? "Create Account"
                    : "Sign In"}
              </button>
            </form>
          </div>

          <div className="login-overlay">
            <div className="login-overlay-panel login-overlay-right">
              <img className="mb-5 h-16 w-16 rounded-full object-cover" src="/assets/glownest-logo.png" alt="GlowNest logo" />
              <h2 className="m-0 font-serif text-4xl leading-tight">Hello, Friend!</h2>
              <p className="mt-4 max-w-[280px] text-center leading-[1.7] text-white/88">
                Register with your details to save carts, favorites, and future GlowNest offers.
              </p>
              <button className="login-ghost-button mt-7 min-h-11 cursor-pointer rounded-full px-8 font-black text-white" type="button" onClick={() => switchMode("signup")}>
                Sign Up
              </button>
            </div>
            <div className="login-overlay-panel login-overlay-left">
              <img className="mb-5 h-16 w-16 rounded-full object-cover" src="/assets/glownest-logo.png" alt="GlowNest logo" />
              <h2 className="m-0 font-serif text-4xl leading-tight">Welcome Back!</h2>
              <p className="mt-4 max-w-[280px] text-center leading-[1.7] text-white/88">
                Sign in to continue shopping perfumes, cosmetics, and your saved selections.
              </p>
              <button className="login-ghost-button mt-7 min-h-11 cursor-pointer rounded-full px-8 font-black text-white" type="button" onClick={() => switchMode("login")}>
                Sign In
              </button>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
