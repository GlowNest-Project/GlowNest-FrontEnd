import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import {
  AlertCircle,
  CheckCircle2,
  Lock,
  Mail,
  Phone,
  RefreshCw,
  Sparkles,
  X,
} from "lucide-react";

export default function OtpVerificationModal({
  devOtp = "",
  isOpen,
  onClose,
  onResend,
  onVerify,
  target = "",
  type = "email", // "email" | "phone"
}) {
  const [digits, setDigits] = useState(["", "", "", "", "", ""]);
  const [status, setStatus] = useState("idle"); // "idle" | "verifying" | "success" | "error"
  const [errorMessage, setErrorMessage] = useState("");
  const [timer, setTimer] = useState(60);
  const [isShaking, setIsShaking] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [currentDevOtp, setCurrentDevOtp] = useState(devOtp);

  const inputRefs = useRef([]);

  // Reset and auto-focus when modal opens + lock body scroll
  useEffect(() => {
    if (isOpen) {
      setDigits(["", "", "", "", "", ""]);
      setStatus("idle");
      setErrorMessage("");
      setTimer(60);
      setIsShaking(false);
      setCurrentDevOtp(devOtp);

      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = "hidden";

      const focusTimer = setTimeout(() => {
        inputRefs.current[0]?.focus();
      }, 120);

      return () => {
        document.body.style.overflow = originalOverflow;
        clearTimeout(focusTimer);
      };
    }
  }, [isOpen, devOtp]);

  // Countdown timer
  useEffect(() => {
    if (!isOpen || timer <= 0) return;
    const interval = setInterval(() => {
      setTimer((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [isOpen, timer]);

  if (!isOpen) return null;

  const isEmail = type === "email";
  const otpCode = digits.join("");
  const isComplete = otpCode.length === 6;

  function triggerShake() {
    setIsShaking(true);
    setTimeout(() => setIsShaking(false), 500);
  }

  async function handleVerify(codeToVerify) {
    const finalCode = codeToVerify || otpCode;
    if (finalCode.length !== 6) return;

    setStatus("verifying");
    setErrorMessage("");

    try {
      await onVerify(finalCode);
      setStatus("success");
      setTimeout(() => {
        onClose();
      }, 1500);
    } catch (error) {
      setStatus("error");
      setErrorMessage(error?.message || "Incorrect verification code. Please try again.");
      triggerShake();
      setTimeout(() => {
        inputRefs.current[0]?.focus();
        inputRefs.current[0]?.select();
      }, 250);
    }
  }

  function handleDigitChange(index, value) {
    const cleaned = value.replace(/\D/g, "");
    if (!cleaned) {
      const next = [...digits];
      next[index] = "";
      setDigits(next);
      setErrorMessage("");
      if (status === "error") setStatus("idle");
      return;
    }

    const lastDigit = cleaned.slice(-1);
    const next = [...digits];
    next[index] = lastDigit;
    setDigits(next);
    setErrorMessage("");
    if (status === "error") setStatus("idle");

    // Advance to next input box without auto-verifying
    if (index < 5) {
      inputRefs.current[index + 1]?.focus();
      inputRefs.current[index + 1]?.select();
    }
  }

  function handleKeyDown(index, e) {
    if (e.key === "Backspace") {
      if (!digits[index] && index > 0) {
        const next = [...digits];
        next[index - 1] = "";
        setDigits(next);
        inputRefs.current[index - 1]?.focus();
      }
    } else if (e.key === "ArrowLeft" && index > 0) {
      inputRefs.current[index - 1]?.focus();
    } else if (e.key === "ArrowRight" && index < 5) {
      inputRefs.current[index + 1]?.focus();
    } else if (e.key === "Enter" && isComplete) {
      handleVerify();
    }
  }

  function handlePaste(e) {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (!pasted) return;

    const next = ["", "", "", "", "", ""];
    for (let i = 0; i < pasted.length; i++) {
      next[i] = pasted[i];
    }
    setDigits(next);
    setErrorMessage("");
    if (status === "error") setStatus("idle");

    const nextFocusIndex = Math.min(pasted.length, 5);
    inputRefs.current[nextFocusIndex]?.focus();
  }

  async function handleResendCode() {
    if (timer > 0 || isResending) return;
    setIsResending(true);
    setErrorMessage("");
    setStatus("idle");

    try {
      const res = await onResend();
      setTimer(60);
      setDigits(["", "", "", "", "", ""]);
      if (res?.devOtp) {
        setCurrentDevOtp(res.devOtp);
      }
      setTimeout(() => {
        inputRefs.current[0]?.focus();
      }, 50);
    } catch (error) {
      setErrorMessage(error?.message || "Failed to resend verification code.");
    } finally {
      setIsResending(false);
    }
  }

  const modalContent = (
    <div
      aria-modal="true"
      className="fixed inset-0 z-9999 flex min-h-screen items-center justify-center p-3 sm:p-4"
      role="dialog"
    >
      {/* Dark backdrop with blur */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity duration-300"
        onClick={status !== "verifying" && status !== "success" ? onClose : undefined}
      />

      {/* Modal Card Centered Perfectly in Viewport */}
      <div
        className={`relative z-10000 my-auto w-full max-w-[440px] overflow-hidden rounded-3xl border bg-white p-6 shadow-[0_25px_70px_rgba(39,27,22,0.3)] transition-all sm:p-7 ${
          status === "success"
            ? "border-[#27ae60] ring-4 ring-[#27ae60]/20"
            : status === "error"
              ? "border-[#e74c3c] ring-4 ring-[#e74c3c]/20"
              : "border-[#ecdcd3]"
        }`}
      >
        {/* Top glow ambient effect */}
        <div
          className={`pointer-events-none absolute -top-24 left-1/2 h-40 w-64 -translate-x-1/2 rounded-full blur-3xl transition-colors duration-500 ${
            status === "success"
              ? "bg-[#27ae60]/25"
              : status === "error"
                ? "bg-[#e74c3c]/25"
                : "bg-[#c88763]/20"
          }`}
        />

        {/* Close Button */}
        <button
          aria-label="Close verification modal"
          className="absolute right-3.5 top-3.5 flex h-8 w-8 cursor-pointer items-center justify-center rounded-full text-[#8e746a] transition hover:bg-[#f6eee8] hover:text-[#271b16]"
          disabled={status === "verifying" || status === "success"}
          onClick={onClose}
          type="button"
        >
          <X size={18} strokeWidth={2.3} />
        </button>

        {/* Header Icon */}
        <div className="relative text-center">
          <div
            className={`mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl transition-all duration-400 ${
              status === "success"
                ? "animate-otp-pop bg-[#e8f8ef] text-[#27ae60] shadow-[0_6px_18px_rgba(39,174,96,0.3)]"
                : status === "error"
                  ? "bg-[#fdedeb] text-[#e74c3c] shadow-[0_6px_18px_rgba(231,76,60,0.25)]"
                  : "bg-linear-to-tr from-[#9b5f45] to-[#c88763] text-white shadow-[0_6px_20px_rgba(155,95,69,0.28)]"
            }`}
          >
            {status === "success" ? (
              <CheckCircle2 size={30} strokeWidth={2.5} />
            ) : status === "error" ? (
              <AlertCircle size={30} strokeWidth={2.5} />
            ) : isEmail ? (
              <Mail size={26} strokeWidth={2.2} />
            ) : (
              <Phone size={26} strokeWidth={2.2} />
            )}
          </div>

          <h3 className="font-serif text-2xl font-bold text-[#271b16]">
            {status === "success"
              ? "Verified Successfully!"
              : isEmail
                ? "Verify Your Email"
                : "Verify Mobile Number"}
          </h3>

          <p className="mx-auto mt-1.5 max-w-[320px] text-xs font-semibold leading-relaxed text-[#7c655c]">
            {status === "success" ? (
              <span className="font-bold text-[#1e824c]">
                Your {isEmail ? "email address" : "phone number"} has been verified!
              </span>
            ) : (
              <>
                Enter the 6-digit PIN code sent to{" "}
                <span className="font-bold text-[#271b16]">{target}</span>
              </>
            )}
          </p>
        </div>

        {/* 6 Digit PIN Boxes */}
        <div className="mt-5">
          <div
            className={`grid grid-cols-6 gap-2 sm:gap-2.5 ${
              isShaking ? "animate-otp-shake" : status === "success" ? "animate-otp-pop" : ""
            }`}
            onPaste={handlePaste}
          >
            {digits.map((digit, idx) => (
              <input
                aria-label={`Digit ${idx + 1}`}
                autoComplete="off"
                className={`h-12 w-full sm:h-13 rounded-2xl border text-center font-mono text-xl sm:text-2xl font-black transition-all outline-none ${
                  status === "error"
                    ? "border-[#e74c3c] bg-[#fff5f5] text-[#c0392b] ring-2 ring-[#e74c3c]/40 shadow-[0_0_12px_rgba(231,76,60,0.3)]"
                    : status === "success"
                      ? "border-[#27ae60] bg-[#eafaf1] text-[#1e824c] ring-2 ring-[#27ae60]/40 shadow-[0_0_12px_rgba(39,174,96,0.3)]"
                      : digit
                        ? "border-[#9b5f45] bg-[#fffaf6] text-[#271b16] shadow-2xs"
                        : "border-[#e2cdc1] bg-white text-[#271b16] focus:border-[#9b5f45] focus:bg-[#fffcf9] focus:ring-3 focus:ring-[#9b5f45]/15"
                }`}
                disabled={status === "verifying" || status === "success"}
                inputMode="numeric"
                key={idx}
                maxLength={1}
                onChange={(e) => handleDigitChange(idx, e.target.value)}
                onKeyDown={(e) => handleKeyDown(idx, e)}
                ref={(el) => (inputRefs.current[idx] = el)}
                type="text"
                value={digit}
              />
            ))}
          </div>

          {/* Success Banner */}
          {status === "success" && (
            <div className="animate-otp-pop mt-4 rounded-2xl border border-[#c1edd5] bg-[#f0faf4] p-3 text-center">
              <div className="inline-flex items-center gap-1.5 text-xs font-black uppercase tracking-wider text-[#1a7f47]">
                <Sparkles size={16} />
                Verification Complete
              </div>
            </div>
          )}

          {/* Error Message with Shake Animation */}
          {errorMessage && (
            <div className="animate-otp-shake mt-3.5 flex items-center justify-center gap-2 rounded-xl border border-[#f5c6cb] bg-[#fdecec] px-3 py-2 text-center text-xs font-bold text-[#c0392b]">
              <AlertCircle size={15} />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Dev Test Code Helper */}
          {currentDevOtp && status !== "success" && (
            <p className="mt-3 rounded-xl border border-[#edd5c6] bg-[#fff6f0] px-3 py-1.5 text-center text-xs font-bold text-[#9b5f45]">
              Test Mode OTP: <span className="font-mono tracking-widest">{currentDevOtp}</span>
            </p>
          )}

          {/* Submit Button */}
          {status !== "success" && (
            <button
              className={`mt-5 flex min-h-11 w-full cursor-pointer items-center justify-center gap-2 rounded-xl font-black text-white shadow-md transition duration-300 disabled:cursor-not-allowed disabled:opacity-60 ${
                status === "error"
                  ? "bg-[#c0392b] hover:bg-[#a93226]"
                  : "bg-linear-to-r from-[#9b5f45] via-[#b67352] to-[#c88763] hover:shadow-[0_8px_20px_rgba(155,95,69,0.35)]"
              }`}
              disabled={!isComplete || status === "verifying"}
              onClick={() => handleVerify()}
              type="button"
            >
              {status === "verifying" ? (
                <>
                  <RefreshCw className="animate-spin" size={17} />
                  <span>Verifying Code...</span>
                </>
              ) : (
                <>
                  <Lock size={16} strokeWidth={2.3} />
                  <span>Confirm & Verify</span>
                </>
              )}
            </button>
          )}

          {/* Footer / Resend Timer */}
          {status !== "success" && (
            <div className="mt-4 flex items-center justify-between border-t border-[#f2e5dc] pt-3 text-xs">
              <span className="font-medium text-[#8c746a]">
                Didn&apos;t receive code?
              </span>

              {timer > 0 ? (
                <span className="font-bold text-[#9b5f45]">
                  Resend in <span className="font-mono">{timer}s</span>
                </span>
              ) : (
                <button
                  className="cursor-pointer font-extrabold text-[#9b5f45] underline transition hover:text-[#7d4833]"
                  disabled={isResending}
                  onClick={handleResendCode}
                  type="button"
                >
                  {isResending ? "Sending new code..." : "Resend Code"}
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );

  return typeof document !== "undefined"
    ? createPortal(modalContent, document.body)
    : modalContent;
}
