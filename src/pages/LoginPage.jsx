import { useState } from "react";
import { Eye, EyeOff, LockKeyhole, Mail, Phone, ShieldCheck, UserRound } from "lucide-react";
import PasswordStrength from "../components/PasswordStrength";
import { login, requestSignupOtp, verifySignupOtp } from "../utils/api";

const initialForm = {
  name: "",
  phone: "",
  email: "",
  password: "",
  confirmPassword: "",
  emailOtp: "",
  phoneOtp: "",
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

function LoginInput({ autoComplete, disabled = false, error, icon: Icon, name, onChange, placeholder, type = "text", value }) {
  const autoCompleteByField = {
    confirmPassword: "new-password",
    email: "email",
    emailOtp: "one-time-code",
    name: "name",
    password: "current-password",
    phone: "tel",
    phoneOtp: "one-time-code",
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
  const [signupVerification, setSignupVerification] = useState(null);

  const isSignup = mode === "signup";
  const passwordType = showPassword ? "text" : "password";
  const confirmPasswordType = showConfirmPassword ? "text" : "password";
  const confirmPasswordStatus =
    isSignup && form.confirmPassword
      ? form.confirmPassword === form.password
        ? "match"
        : "mismatch"
      : "";

  function switchMode(nextMode) {
    setMode(nextMode);
    setErrors({});
    setSubmittedMessage("");
    setSignupVerification(null);
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

    if (isSignup && signupVerification) {
      const otpErrors = {};

      if (!/^\d{6}$/.test(form.emailOtp.trim())) {
        otpErrors.emailOtp = "Enter the 6-digit email OTP.";
      }

      if (!/^\d{6}$/.test(form.phoneOtp.trim())) {
        otpErrors.phoneOtp = "Enter the 6-digit phone OTP.";
      }

      if (Object.keys(otpErrors).length > 0) {
        setErrors(otpErrors);
        return;
      }
    }

    setIsSubmitting(true);
    setSubmittedMessage("");

    try {
      if (isSignup && !signupVerification) {
        const result = await requestSignupOtp({
          name: form.name.trim(),
          phone: form.phone.trim(),
          email: form.email.trim(),
          password: form.password,
        });

        setSignupVerification(result);
        setSubmittedMessage(
          `OTP sent to your email and phone. It expires in ${result.expiresInMinutes || 10} minutes.`
        );
        return;
      }

      const result = isSignup
        ? await verifySignupOtp({
            verificationId: signupVerification.verificationId,
            emailOtp: form.emailOtp.trim(),
            phoneOtp: form.phoneOtp.trim(),
          })
        : await login({ email: form.email.trim(), password: form.password });

      onAuthenticated?.({ token: result.token, user: result.user });
    } catch (error) {
      setErrors({ submit: error.message });
    } finally {
      setIsSubmitting(false);
    }
  }

  if (isSignup && signupVerification) {
    return (
      <main className="login-page min-h-screen px-[clamp(16px,5vw,72px)] py-[clamp(42px,7vw,82px)]">
        <section className="mx-auto max-w-[760px]">
          <div className="mb-8 text-center">
            <p className="collection-kicker">GlowNest Verification</p>
            <h1 className="m-0 mt-4 font-serif text-[clamp(2.7rem,7vw,5rem)] leading-[0.95] text-[#9b5f45]">
              Verify email & phone
            </h1>
            <p className="mx-auto mt-5 max-w-[580px] text-base font-semibold leading-[1.75] text-[#6f5d54]">
              Enter the OTP codes sent to {form.email} and {form.phone}. This keeps your GlowNest
              account secure before checkout.
            </p>
          </div>

          <form
            className="rounded-lg border border-[#ead8ce] bg-white p-[clamp(20px,5vw,42px)] shadow-[0_18px_45px_rgba(143,86,62,0.09)]"
            onSubmit={submitForm}
          >
            <div className="mb-6 flex items-center justify-center gap-3 text-center">
              <ShieldCheck aria-hidden="true" className="text-[#b67858]" size={28} strokeWidth={2.2} />
              <p className="m-0 text-lg font-black uppercase tracking-[0.14em] text-[#d7a17c]">
                Verify email and phone
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <LoginInput
                error={errors.emailOtp}
                icon={Mail}
                name="emailOtp"
                onChange={updateField}
                placeholder="Email OTP"
                value={form.emailOtp}
              />
              <LoginInput
                error={errors.phoneOtp}
                icon={Phone}
                name="phoneOtp"
                onChange={updateField}
                placeholder="Phone OTP"
                value={form.phoneOtp}
              />
            </div>

            {signupVerification.devOtp && (
              <p className="mt-5 rounded-md bg-[#fff8f3] px-4 py-3 text-sm font-bold leading-[1.7] text-[#8f563e]">
                Test OTPs: Email {signupVerification.devOtp.email} / Phone {signupVerification.devOtp.phone}
              </p>
            )}

            {errors.submit && (
              <p className="mt-5 rounded-full bg-[#fdecec] px-4 py-2 text-center text-sm font-bold text-[#c04c4c]">
                {errors.submit}
              </p>
            )}
            {submittedMessage && (
              <p className="mt-5 rounded-full bg-[#edf9f2] px-4 py-2 text-center text-sm font-bold text-[#2f8f5d]">
                {submittedMessage}
              </p>
            )}

            <div className="mt-7 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <button
                className="login-slide-submit min-h-12 w-full cursor-pointer rounded-full px-9 font-black text-white disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
                disabled={isSubmitting}
                type="submit"
              >
                {isSubmitting ? "Verifying OTP..." : "Verify and Create Account"}
              </button>
              <button
                className="min-h-12 w-full cursor-pointer rounded-full border border-[#e7cbbd] bg-white px-9 font-black text-[#8f563e] transition hover:bg-[#fff8f3] sm:w-auto"
                type="button"
                onClick={() => {
                  setSignupVerification(null);
                  setForm((currentForm) => ({ ...currentForm, emailOtp: "", phoneOtp: "" }));
                  setErrors({});
                  setSubmittedMessage("");
                }}
              >
                Edit details
              </button>
            </div>
          </form>
        </section>
      </main>
    );
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
                  disabled={Boolean(signupVerification)}
                />
                <LoginInput
                  error={isSignup ? errors.phone : ""}
                  icon={Phone}
                  name="phone"
                  onChange={updateField}
                  placeholder="Phone number"
                  value={form.phone}
                  disabled={Boolean(signupVerification)}
                />
                <LoginInput
                  error={isSignup ? errors.email : ""}
                  icon={Mail}
                  name="email"
                  onChange={updateField}
                  placeholder="Email address"
                  type="email"
                  value={form.email}
                  disabled={Boolean(signupVerification)}
                />
                <div>
                  <div className="relative">
                    <LoginInput
                      autoComplete="new-password"
                      error={isSignup ? errors.password : ""}
                      icon={LockKeyhole}
                      name="password"
                      onChange={updateField}
                      placeholder="Password"
                      type={passwordType}
                      value={form.password}
                      disabled={Boolean(signupVerification)}
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
                    placeholder="Confirm password"
                    type={confirmPasswordType}
                    value={form.confirmPassword}
                    disabled={Boolean(signupVerification)}
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
                {isSubmitting && isSignup
                  ? "Sending OTP..."
                  : "Register"}
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
