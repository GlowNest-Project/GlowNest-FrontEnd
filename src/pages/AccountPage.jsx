import { useEffect, useState } from "react";
import {
  AlertCircle,
  ArrowRight,
  BadgeCheck,
  Check,
  CheckCircle2,
  KeyRound,
  Lock,
  Mail,
  Pencil,
  Phone,
  RefreshCw,
  Save,
  ShieldCheck,
  ShoppingBag,
  ShoppingCart,
  Sparkles,
  UserPen,
  UserRound,
  X,
} from "lucide-react";
import OtpVerificationModal from "../components/OtpVerificationModal";
import {
  changePassword,
  confirmEmailVerificationOtp,
  confirmPhoneVerificationOtp,
  requestEmailVerificationOtp,
  requestPhoneVerificationOtp,
  updateCurrentUser,
} from "../utils/api";
import { navigateTo } from "../utils/navigation";

function getInitials(name) {
  if (!name) return "GN";
  const parts = name.trim().split(" ");
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function formatDate(dateString) {
  if (!dateString) return "Recently joined";
  try {
    const d = new Date(dateString);
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  } catch {
    return "Recently joined";
  }
}

export default function AccountPage({ onAuthenticated, token, user }) {
  const [profileForm, setProfileForm] = useState({
    name: "",
    phone: "",
    email: "",
  });
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [profileStatus, setProfileStatus] = useState("idle");
  const [profileMessage, setProfileMessage] = useState("");

  // Password state
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [passwordStatus, setPasswordStatus] = useState("idle");
  const [passwordMessage, setPasswordMessage] = useState("");

  // Modal State
  const [modalConfig, setModalConfig] = useState({
    isOpen: false,
    type: "email", // "email" | "phone"
    target: "",
    devOtp: "",
  });
  const [isSendingEmailOtp, setIsSendingEmailOtp] = useState(false);
  const [isSendingPhoneOtp, setIsSendingPhoneOtp] = useState(false);
  const [actionError, setActionError] = useState("");

  useEffect(() => {
    setProfileForm({
      name: user?.name || "",
      phone: user?.phone || "",
      email: user?.email || "",
    });
  }, [user]);

  // Profile Form Handlers
  function updateProfileField(e) {
    const { name, value } = e.target;
    setProfileForm((prev) => ({ ...prev, [name]: value }));
    setProfileMessage("");
  }

  async function handleSaveProfile(e) {
    e.preventDefault();
    if (!isEditingProfile) return;
    setProfileStatus("saving");
    setProfileMessage("");

    try {
      const updatedUser = await updateCurrentUser(
        {
          name: profileForm.name.trim(),
          phone: profileForm.phone.trim(),
          email: profileForm.email.trim(),
        },
        token
      );

      onAuthenticated?.({ token, user: updatedUser });
      setProfileStatus("saved");
      setProfileMessage("Profile updated successfully!");
      setIsEditingProfile(false);
    } catch (error) {
      setProfileStatus("error");
      setProfileMessage(error.message);
    }
  }

  function handleCancelEditProfile() {
    setProfileForm({
      name: user?.name || "",
      phone: user?.phone || "",
      email: user?.email || "",
    });
    setIsEditingProfile(false);
    setProfileMessage("");
    setProfileStatus("idle");
  }

  // Password Form Handlers
  function updatePasswordField(e) {
    const { name, value } = e.target;
    setPasswordForm((prev) => ({ ...prev, [name]: value }));
    setPasswordMessage("");
  }

  async function handleSavePassword(e) {
    e.preventDefault();
    if (passwordForm.newPassword.length < 8) {
      setPasswordStatus("error");
      setPasswordMessage("New password must be at least 8 characters.");
      return;
    }
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setPasswordStatus("error");
      setPasswordMessage("New passwords do not match.");
      return;
    }

    setPasswordStatus("saving");
    setPasswordMessage("");

    try {
      await changePassword(
        {
          currentPassword: passwordForm.currentPassword,
          newPassword: passwordForm.newPassword,
        },
        token
      );
      setPasswordStatus("saved");
      setPasswordMessage("Password changed successfully!");
      setPasswordForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
    } catch (error) {
      setPasswordStatus("error");
      setPasswordMessage(error.message);
    }
  }

  // Open Email OTP Modal
  async function handleOpenEmailVerification() {
    setIsSendingEmailOtp(true);
    setActionError("");

    try {
      const res = await requestEmailVerificationOtp(token);
      setModalConfig({
        isOpen: true,
        type: "email",
        target: user.email,
        devOtp: res.devOtp || "",
      });
    } catch (error) {
      setActionError(`Email OTP Error: ${error.message}`);
    } finally {
      setIsSendingEmailOtp(false);
    }
  }

  // Open Phone OTP Modal
  async function handleOpenPhoneVerification() {
    setIsSendingPhoneOtp(true);
    setActionError("");

    try {
      const res = await requestPhoneVerificationOtp(token);
      setModalConfig({
        isOpen: true,
        type: "phone",
        target: user.phone,
        devOtp: res.devOtp || "",
      });
    } catch (error) {
      setActionError(`SMS OTP Error: ${error.message}`);
    } finally {
      setIsSendingPhoneOtp(false);
    }
  }

  // Handle Verify in Modal
  async function handleModalVerify(otpCode) {
    if (modalConfig.type === "email") {
      const res = await confirmEmailVerificationOtp({ otp: otpCode }, token);
      onAuthenticated?.({ token, user: res.user });
      return res;
    } else {
      const res = await confirmPhoneVerificationOtp({ otp: otpCode }, token);
      onAuthenticated?.({ token, user: res.user });
      return res;
    }
  }

  // Handle Resend in Modal
  async function handleModalResend() {
    if (modalConfig.type === "email") {
      return await requestEmailVerificationOtp(token);
    } else {
      return await requestPhoneVerificationOtp(token);
    }
  }

  function scrollToEditProfile() {
    setIsEditingProfile(true);
    setProfileMessage("");
    const el = document.getElementById("personal-information-section");
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "center" });
      const input = document.getElementById("profile-name-input");
      setTimeout(() => {
        input?.focus();
        input?.select();
      }, 450);
    }
  }

  if (!user || !token) {
    return (
      <main className="px-[clamp(18px,5vw,72px)] py-[clamp(72px,10vw,120px)]">
        <section className="mx-auto max-w-[560px] rounded-2xl border border-[#ead8ce] bg-white p-8 text-center shadow-[0_18px_45px_rgba(143,86,62,0.09)] sm:p-12">
          <div className="mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-full bg-[#fff5ef] text-[#9b5f45]">
            <UserRound size={36} strokeWidth={2} />
          </div>
          <h1 className="font-serif text-3xl font-bold text-[#9b5f45] sm:text-4xl">My Account</h1>
          <p className="mt-3 text-base text-[#6f5d54]">
            Please sign in to view and manage your GlowNest account, orders, and verification status.
          </p>
          <button
            className="mt-7 inline-flex min-h-12 cursor-pointer items-center justify-center rounded-full bg-linear-to-br from-[#c88763] to-[#8f563e] px-8 font-bold text-white shadow-md transition-transform hover:scale-[1.02]"
            type="button"
            onClick={() => navigateTo("/login")}
          >
            Go to Login
          </button>
        </section>
      </main>
    );
  }

  const isEmailVerified = Boolean(user.isEmailVerified);
  const isPhoneVerified = Boolean(user.isPhoneVerified);
  const isFullyVerified = Boolean(user.isVerified || (isEmailVerified && isPhoneVerified));

  return (
    <main className="min-h-screen bg-[#faf6f2] pb-24 text-[#271b16]">
      {/* OTP Verification Modal */}
      <OtpVerificationModal
        devOtp={modalConfig.devOtp}
        isOpen={modalConfig.isOpen}
        onClose={() => setModalConfig((prev) => ({ ...prev, isOpen: false }))}
        onResend={handleModalResend}
        onVerify={handleModalVerify}
        target={modalConfig.target}
        type={modalConfig.type}
      />

      {/* Hero Header */}
      <section className="relative overflow-hidden border-b border-[#ebdcd3] bg-[linear-gradient(135deg,#ffffff_0%,#fff7f2_50%,#fbf0e8_100%)] px-[clamp(18px,5vw,72px)] py-12 sm:py-16">
        <div className="mx-auto flex max-w-[1100px] flex-col items-start justify-between gap-6 md:flex-row md:items-center">
          <div className="flex flex-col items-start gap-5 sm:flex-row sm:items-center">
            {/* Avatar Initials */}
            <div className="relative flex h-20 w-20 shrink-0 items-center justify-center rounded-full bg-linear-to-tr from-[#9b5f45] to-[#c88763] font-serif text-2xl font-bold text-white shadow-lg ring-4 ring-white">
              {getInitials(user.name)}
              {isFullyVerified && (
                <span
                  className="absolute -bottom-1 -right-1 flex h-7 w-7 items-center justify-center rounded-full bg-[#1e965b] text-white ring-2 ring-white"
                  title="Verified Account"
                >
                  <Check size={16} strokeWidth={3} />
                </span>
              )}
            </div>

            <div>
              <div className="flex flex-wrap items-center gap-3">
                <h1 className="font-serif text-3xl font-bold tracking-tight text-[#271b16] sm:text-4xl">
                  {user.name}
                </h1>

                {/* Primary Status Badge */}
                {isFullyVerified ? (
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-[#27ae60]/30 bg-[#edf9f2] px-3.5 py-1 text-xs font-black uppercase tracking-wider text-[#1e824c] shadow-xs">
                    <BadgeCheck className="text-[#27ae60]" size={16} />
                    Verified User
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-[#f39c12]/30 bg-[#fffaf0] px-3.5 py-1 text-xs font-black uppercase tracking-wider text-[#c07d10] shadow-xs">
                    <AlertCircle size={15} />
                    Pending Verification ({[isEmailVerified, isPhoneVerified].filter(Boolean).length}/2)
                  </span>
                )}
              </div>

              <p className="mt-1 text-sm font-semibold text-[#7c655c]">
                {user.email} &bull; Member since {formatDate(user.createdAt)}
              </p>
            </div>
          </div>

          {/* Quick Shortcuts */}
          <div className="flex flex-wrap gap-2.5 sm:gap-3">
            <button
              className="inline-flex items-center gap-2 rounded-full border border-[#e3d1c6] bg-white px-4.5 py-2.5 text-sm font-bold text-[#724a37] shadow-xs transition hover:bg-[#fff6f0] hover:text-[#9b5f45]"
              type="button"
              onClick={scrollToEditProfile}
            >
              <UserPen size={16} />
              Edit Profile
            </button>
            <button
              className="inline-flex items-center gap-2 rounded-full border border-[#e3d1c6] bg-white px-4.5 py-2.5 text-sm font-bold text-[#724a37] shadow-xs transition hover:bg-[#fff6f0] hover:text-[#9b5f45]"
              type="button"
              onClick={() => navigateTo("/orders")}
            >
              <ShoppingBag size={16} />
              My Orders
            </button>
            <button
              className="inline-flex items-center gap-2 rounded-full border border-[#e3d1c6] bg-white px-4.5 py-2.5 text-sm font-bold text-[#724a37] shadow-xs transition hover:bg-[#fff6f0] hover:text-[#9b5f45]"
              type="button"
              onClick={() => navigateTo("/cart")}
            >
              <ShoppingCart size={16} />
              My Cart
            </button>
          </div>
        </div>
      </section>

      {/* Main Content Layout */}
      <div className="mx-auto mt-8 grid max-w-[1100px] gap-8 px-[clamp(18px,5vw,72px)]">
        {actionError && (
          <div className="flex items-center gap-2 rounded-xl border border-[#f5c6cb] bg-[#fdecec] p-4 text-xs font-bold text-[#c0392b]">
            <AlertCircle size={16} />
            <span>{actionError}</span>
          </div>
        )}

        {/* Verification Hub Card */}
        <section className="rounded-2xl border border-[#ead8ce] bg-white p-6 shadow-[0_12px_35px_rgba(143,86,62,0.06)] sm:p-8">
          <div className="flex flex-col justify-between gap-2 border-b border-[#f3e7e0] pb-5 sm:flex-row sm:items-center">
            <div>
              <h2 className="flex items-center gap-2.5 font-serif text-2xl font-bold text-[#9b5f45]">
                <ShieldCheck className="text-[#c88763]" size={26} />
                Verification Center
              </h2>
              <p className="mt-1 text-sm text-[#7c655c]">
                Verify both your email address and mobile number to unlock verified customer benefits.
              </p>
            </div>

            {isFullyVerified && (
              <div className="flex items-center gap-2 rounded-xl bg-[#edf9f2] px-4 py-2 text-xs font-extrabold uppercase text-[#1e824c]">
                <CheckCircle2 size={18} />
                All Verifications Complete
              </div>
            )}
          </div>

          {/* Verification Cards Grid */}
          <div className="mt-6 grid gap-6 md:grid-cols-2">
            {/* EMAIL VERIFICATION CARD */}
            <div
              className={`flex flex-col justify-between rounded-2xl border p-6 transition-all ${
                isEmailVerified
                  ? "border-[#d1f2dd] bg-[#f7fdf9]"
                  : "border-[#f1dfd5] bg-[#fffaf6] shadow-2xs"
              }`}
            >
              <div>
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-3">
                    <div
                      className={`flex h-11 w-11 items-center justify-center rounded-2xl ${
                        isEmailVerified
                          ? "bg-[#e2f7ea] text-[#1e824c]"
                          : "bg-[#fff0e6] text-[#b67858]"
                      }`}
                    >
                      <Mail size={22} />
                    </div>
                    <div>
                      <h3 className="text-sm font-black uppercase tracking-wider text-[#4a342b]">
                        Email Verification
                      </h3>
                      <p className="text-xs font-semibold text-[#80695f]">{user.email}</p>
                    </div>
                  </div>

                  {isEmailVerified ? (
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-[#dcf5e5] px-3 py-1 text-xs font-black text-[#1a7f47]">
                      <Check size={14} strokeWidth={3} />
                      Verified
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 rounded-full bg-[#fff1d6] px-3 py-1 text-xs font-bold text-[#b5730a]">
                      Unverified
                    </span>
                  )}
                </div>

                <p className="mt-4 text-xs leading-relaxed text-[#7c655c]">
                  {isEmailVerified
                    ? "Your email address is verified. You will receive official order confirmations and receipts here."
                    : "Receive a 6-digit PIN code via Gmail to verify and secure your account."}
                </p>
              </div>

              {!isEmailVerified && (
                <div className="mt-5 pt-4 border-t border-[#f4e6dc]">
                  <button
                    className="inline-flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-linear-to-r from-[#9b5f45] to-[#c88763] px-5 py-2.5 text-xs font-bold text-white shadow-xs transition hover:opacity-95 disabled:cursor-wait disabled:opacity-60 sm:w-auto"
                    disabled={isSendingEmailOtp}
                    onClick={handleOpenEmailVerification}
                    type="button"
                  >
                    {isSendingEmailOtp ? (
                      <>
                        <RefreshCw className="animate-spin" size={14} />
                        Sending code...
                      </>
                    ) : (
                      <>
                        <span>Verify Email</span>
                        <ArrowRight size={14} />
                      </>
                    )}
                  </button>
                </div>
              )}
            </div>

            {/* PHONE / SMS VERIFICATION CARD */}
            <div
              className={`flex flex-col justify-between rounded-2xl border p-6 transition-all ${
                isPhoneVerified
                  ? "border-[#d1f2dd] bg-[#f7fdf9]"
                  : "border-[#f1dfd5] bg-[#fffaf6] shadow-2xs"
              }`}
            >
              <div>
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-3">
                    <div
                      className={`flex h-11 w-11 items-center justify-center rounded-2xl ${
                        isPhoneVerified
                          ? "bg-[#e2f7ea] text-[#1e824c]"
                          : "bg-[#fff0e6] text-[#b67858]"
                      }`}
                    >
                      <Phone size={22} />
                    </div>
                    <div>
                      <h3 className="text-sm font-black uppercase tracking-wider text-[#4a342b]">
                        Mobile SMS Verification
                      </h3>
                      <p className="text-xs font-semibold text-[#80695f]">{user.phone}</p>
                    </div>
                  </div>

                  {isPhoneVerified ? (
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-[#dcf5e5] px-3 py-1 text-xs font-black text-[#1a7f47]">
                      <Check size={14} strokeWidth={3} />
                      Verified
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 rounded-full bg-[#fff1d6] px-3 py-1 text-xs font-bold text-[#b5730a]">
                      Unverified
                    </span>
                  )}
                </div>

                <p className="mt-4 text-xs leading-relaxed text-[#7c655c]">
                  {isPhoneVerified
                    ? "Your phone number is verified. You will receive SMS dispatch notifications and delivery updates."
                    : "Receive a 6-digit PIN code via SMS to confirm your mobile number."}
                </p>
              </div>

              {!isPhoneVerified && (
                <div className="mt-5 pt-4 border-t border-[#f4e6dc]">
                  <button
                    className="inline-flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-linear-to-r from-[#9b5f45] to-[#c88763] px-5 py-2.5 text-xs font-bold text-white shadow-xs transition hover:opacity-95 disabled:cursor-wait disabled:opacity-60 sm:w-auto"
                    disabled={isSendingPhoneOtp}
                    onClick={handleOpenPhoneVerification}
                    type="button"
                  >
                    {isSendingPhoneOtp ? (
                      <>
                        <RefreshCw className="animate-spin" size={14} />
                        Sending SMS...
                      </>
                    ) : (
                      <>
                        <span>Verify Phone Number</span>
                        <ArrowRight size={14} />
                      </>
                    )}
                  </button>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* Profile Details & Password Grid */}
        <div className="grid gap-8 lg:grid-cols-12">
          {/* Edit Profile Form (7 cols) */}
          <section
            className={`rounded-2xl border bg-white p-6 shadow-[0_12px_35px_rgba(143,86,62,0.06)] sm:p-8 lg:col-span-7 scroll-mt-24 transition-all ${
              isEditingProfile
                ? "border-[#9b5f45] ring-2 ring-[#9b5f45]/15"
                : "border-[#ead8ce]"
            }`}
            id="personal-information-section"
          >
            <div className="flex flex-col justify-between gap-3 border-b border-[#f3e7e0] pb-4 sm:flex-row sm:items-center">
              <div>
                <h2 className="flex items-center gap-2.5 font-serif text-2xl font-bold text-[#9b5f45]">
                  <UserRound className="text-[#c88763]" size={24} />
                  Personal Information
                </h2>
                <p className="mt-1 text-sm text-[#7c655c]">
                  {isEditingProfile
                    ? "Editing enabled. Make your changes and save below."
                    : "Your name, primary contact number, and delivery email address."}
                </p>
              </div>

              {isEditingProfile && (
                <button
                  className="inline-flex cursor-pointer items-center gap-1.5 rounded-xl border border-[#d6c2b7] bg-[#fbf6f3] px-3.5 py-1.5 text-xs font-bold text-[#725a50] transition hover:bg-[#f1e5dd]"
                  onClick={handleCancelEditProfile}
                  type="button"
                >
                  <X size={14} />
                  <span>Cancel Edit</span>
                </button>
              )}
            </div>

            <form className="mt-6 space-y-4" onSubmit={handleSaveProfile}>
              <label className="block">
                <span className="mb-1.5 block text-xs font-black uppercase tracking-wider text-[#6f5d54]">
                  Full Name
                </span>
                <span
                  className={`flex min-h-12 items-center gap-3 rounded-xl border px-4 shadow-2xs transition ${
                    isEditingProfile
                      ? "border-[#9b5f45] bg-white ring-1 ring-[#9b5f45]"
                      : "border-[#ead8ce] bg-[#fdfaf7] cursor-not-allowed opacity-90"
                  }`}
                >
                  <UserRound aria-hidden="true" className="text-[#b67858]" size={18} strokeWidth={2.3} />
                  <input
                    className={`min-w-0 flex-1 bg-transparent text-sm font-bold outline-none ${
                      isEditingProfile
                        ? "text-[#271b16]"
                        : "text-[#554037] cursor-not-allowed select-text"
                    }`}
                    disabled={!isEditingProfile}
                    id="profile-name-input"
                    name="name"
                    onChange={updateProfileField}
                    placeholder="e.g. John Doe"
                    type="text"
                    value={profileForm.name}
                  />
                </span>
              </label>

              <label className="block">
                <span className="mb-1.5 block text-xs font-black uppercase tracking-wider text-[#6f5d54]">
                  Phone Number
                </span>
                <span
                  className={`flex min-h-12 items-center gap-3 rounded-xl border px-4 shadow-2xs transition ${
                    isEditingProfile
                      ? "border-[#9b5f45] bg-white ring-1 ring-[#9b5f45]"
                      : "border-[#ead8ce] bg-[#fdfaf7] cursor-not-allowed opacity-90"
                  }`}
                >
                  <Phone aria-hidden="true" className="text-[#b67858]" size={18} strokeWidth={2.3} />
                  <input
                    className={`min-w-0 flex-1 bg-transparent text-sm font-bold outline-none ${
                      isEditingProfile
                        ? "text-[#271b16]"
                        : "text-[#554037] cursor-not-allowed select-text"
                    }`}
                    disabled={!isEditingProfile}
                    name="phone"
                    onChange={updateProfileField}
                    placeholder="e.g. 0771234567"
                    type="tel"
                    value={profileForm.phone}
                  />
                </span>
                <span className="mt-1 block text-xs text-[#a08b81]">
                  Note: Editing phone number resets mobile verification.
                </span>
              </label>

              <label className="block">
                <span className="mb-1.5 block text-xs font-black uppercase tracking-wider text-[#6f5d54]">
                  Email Address
                </span>
                <span
                  className={`flex min-h-12 items-center gap-3 rounded-xl border px-4 shadow-2xs transition ${
                    isEditingProfile
                      ? "border-[#9b5f45] bg-white ring-1 ring-[#9b5f45]"
                      : "border-[#ead8ce] bg-[#fdfaf7] cursor-not-allowed opacity-90"
                  }`}
                >
                  <Mail aria-hidden="true" className="text-[#b67858]" size={18} strokeWidth={2.3} />
                  <input
                    className={`min-w-0 flex-1 bg-transparent text-sm font-bold outline-none ${
                      isEditingProfile
                        ? "text-[#271b16]"
                        : "text-[#554037] cursor-not-allowed select-text"
                    }`}
                    disabled={!isEditingProfile}
                    name="email"
                    onChange={updateProfileField}
                    placeholder="e.g. user@gmail.com"
                    type="email"
                    value={profileForm.email}
                  />
                </span>
                <span className="mt-1 block text-xs text-[#a08b81]">
                  Note: Editing email address resets email verification.
                </span>
              </label>

              {profileMessage && (
                <p
                  className={`rounded-xl px-4 py-3 text-xs font-bold ${
                    profileStatus === "saved"
                      ? "bg-[#edf9f2] text-[#2f8f5d]"
                      : "bg-[#fdecec] text-[#c04c4c]"
                  }`}
                >
                  {profileMessage}
                </p>
              )}

              {isEditingProfile && (
                <div className="mt-3 flex flex-wrap items-center gap-3">
                  <button
                    className="inline-flex min-h-11 cursor-pointer items-center justify-center gap-2 rounded-xl bg-linear-to-br from-[#c88763] to-[#8f563e] px-7 font-bold text-white shadow-sm transition hover:opacity-95 disabled:cursor-wait disabled:opacity-70"
                    disabled={profileStatus === "saving"}
                    type="submit"
                  >
                    <Save size={17} />
                    {profileStatus === "saving" ? "Saving Changes..." : "Save Profile Details"}
                  </button>
                  <button
                    className="inline-flex min-h-11 cursor-pointer items-center justify-center gap-2 rounded-xl border border-[#d6c2b7] bg-white px-6 font-bold text-[#725a50] shadow-2xs transition hover:bg-[#fbf6f3]"
                    disabled={profileStatus === "saving"}
                    onClick={handleCancelEditProfile}
                    type="button"
                  >
                    <X size={16} />
                    Cancel
                  </button>
                </div>
              )}
            </form>
          </section>

          {/* Change Password Form (5 cols) */}
          <section className="rounded-2xl border border-[#ead8ce] bg-white p-6 shadow-[0_12px_35px_rgba(143,86,62,0.06)] sm:p-8 lg:col-span-5">
            <h2 className="flex items-center gap-2.5 font-serif text-2xl font-bold text-[#9b5f45]">
              <KeyRound className="text-[#c88763]" size={24} />
              Security
            </h2>
            <p className="mt-1 text-sm text-[#7c655c]">
              Change your password to keep your account safe.
            </p>

            <form className="mt-6 space-y-4" onSubmit={handleSavePassword}>
              <label className="block">
                <span className="mb-1.5 block text-xs font-black uppercase tracking-wider text-[#6f5d54]">
                  Current Password
                </span>
                <span className="flex min-h-12 items-center gap-3 rounded-xl border border-[#ead8ce] bg-[#fffaf7] px-4 shadow-2xs transition focus-within:border-[#9b5f45] focus-within:bg-white focus-within:ring-1 focus-within:ring-[#9b5f45]">
                  <Lock aria-hidden="true" className="text-[#b67858]" size={18} strokeWidth={2.3} />
                  <input
                    className="min-w-0 flex-1 bg-transparent text-sm font-bold text-[#271b16] outline-none"
                    name="currentPassword"
                    onChange={updatePasswordField}
                    placeholder="Enter current password"
                    type="password"
                    value={passwordForm.currentPassword}
                  />
                </span>
              </label>

              <label className="block">
                <span className="mb-1.5 block text-xs font-black uppercase tracking-wider text-[#6f5d54]">
                  New Password
                </span>
                <span className="flex min-h-12 items-center gap-3 rounded-xl border border-[#ead8ce] bg-[#fffaf7] px-4 shadow-2xs transition focus-within:border-[#9b5f45] focus-within:bg-white focus-within:ring-1 focus-within:ring-[#9b5f45]">
                  <Lock aria-hidden="true" className="text-[#b67858]" size={18} strokeWidth={2.3} />
                  <input
                    className="min-w-0 flex-1 bg-transparent text-sm font-bold text-[#271b16] outline-none"
                    name="newPassword"
                    onChange={updatePasswordField}
                    placeholder="Min 8 characters"
                    type="password"
                    value={passwordForm.newPassword}
                  />
                </span>
              </label>

              <label className="block">
                <span className="mb-1.5 block text-xs font-black uppercase tracking-wider text-[#6f5d54]">
                  Confirm New Password
                </span>
                <span className="flex min-h-12 items-center gap-3 rounded-xl border border-[#ead8ce] bg-[#fffaf7] px-4 shadow-2xs transition focus-within:border-[#9b5f45] focus-within:bg-white focus-within:ring-1 focus-within:ring-[#9b5f45]">
                  <Lock aria-hidden="true" className="text-[#b67858]" size={18} strokeWidth={2.3} />
                  <input
                    className="min-w-0 flex-1 bg-transparent text-sm font-bold text-[#271b16] outline-none"
                    name="confirmPassword"
                    onChange={updatePasswordField}
                    placeholder="Re-type new password"
                    type="password"
                    value={passwordForm.confirmPassword}
                  />
                </span>
              </label>

              {passwordMessage && (
                <p
                  className={`rounded-xl px-4 py-3 text-xs font-bold ${
                    passwordStatus === "saved"
                      ? "bg-[#edf9f2] text-[#2f8f5d]"
                      : "bg-[#fdecec] text-[#c04c4c]"
                  }`}
                >
                  {passwordMessage}
                </p>
              )}

              <button
                className="mt-2 inline-flex min-h-11 cursor-pointer items-center justify-center gap-2 rounded-xl border border-[#9b5f45] bg-white px-7 font-bold text-[#9b5f45] shadow-xs transition hover:bg-[#fff7f2] disabled:cursor-wait disabled:opacity-70"
                disabled={passwordStatus === "saving"}
                type="submit"
              >
                <KeyRound size={17} />
                {passwordStatus === "saving" ? "Updating..." : "Update Password"}
              </button>
            </form>
          </section>
        </div>
      </div>
    </main>
  );
}
