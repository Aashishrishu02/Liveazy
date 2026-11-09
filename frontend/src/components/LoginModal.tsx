import React, { useState, useEffect, useRef } from "react";
import {
  X,
  ShieldCheck,
  ArrowRight,
  RefreshCw,
  Edit2,
  CheckCircle2,
  AlertCircle,
  Truck,
  Lock,
} from "lucide-react";
import {
  requestOtp,
  verifyOtpCode,
  isValidIndianMobile,
  formatDisplayMobile,
  type CustomerUser,
} from "../utils/authService";
import { useCustomerAuth } from "../context/CustomerAuthContext";

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (user: CustomerUser) => void;
}

type AuthStep = "PHONE" | "OTP";

export const LoginModal: React.FC<LoginModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const { login } = useCustomerAuth();

  const [step, setStep] = useState<AuthStep>("PHONE");
  const [mobile, setMobile] = useState("");
  const [otp, setOtp] = useState<string[]>(["", "", "", "", "", ""]);
  const [requestId, setRequestId] = useState<string | undefined>(undefined);

  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [infoMessage, setInfoMessage] = useState<string | null>(null);
  const [isPendingApi, setIsPendingApi] = useState(false);

  // Resend OTP Countdown Timer (seconds)
  const [countdown, setCountdown] = useState(30);
  const [canResend, setCanResend] = useState(false);

  const otpInputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const phoneInputRef = useRef<HTMLInputElement | null>(null);

  // Reset modal state when opened/closed
  useEffect(() => {
    if (isOpen) {
      setStep("PHONE");
      setMobile("");
      setOtp(["", "", "", "", "", ""]);
      setErrorMessage(null);
      setInfoMessage(null);
      setIsPendingApi(false);
      setCountdown(30);
      setCanResend(false);

      // Auto focus mobile input
      setTimeout(() => {
        phoneInputRef.current?.focus();
      }, 100);
    }
  }, [isOpen]);

  // Countdown timer effect
  useEffect(() => {
    if (step !== "OTP") return;

    if (countdown > 0) {
      const timer = setInterval(() => {
        setCountdown((prev) => prev - 1);
      }, 1000);
      return () => clearInterval(timer);
    } else {
      setCanResend(true);
    }
  }, [step, countdown]);

  if (!isOpen) return null;

  // Handle Mobile input changes
  const handleMobileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawVal = e.target.value.replace(/\D/g, "");
    if (rawVal.length <= 10) {
      setMobile(rawVal);
      if (errorMessage) setErrorMessage(null);
    }
  };

  // Step 1: Send OTP
  const handleSendOtp = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    if (!isValidIndianMobile(mobile)) {
      setErrorMessage("Please enter a valid 10-digit Indian mobile number starting with 6, 7, 8, or 9.");
      return;
    }

    try {
      setLoading(true);
      setErrorMessage(null);
      setInfoMessage(null);
      setIsPendingApi(false);

      const res = await requestOtp(mobile);

      if (res.success) {
        setRequestId(res.requestId);
        setStep("OTP");
        setCountdown(res.retryAfterSeconds || 30);
        setCanResend(false);
        setInfoMessage(res.message);
        // Focus first OTP box
        setTimeout(() => {
          otpInputRefs.current[0]?.focus();
        }, 150);
      } else {
        setErrorMessage(res.message);
        if (res.isEndpointPending) {
          setIsPendingApi(true);
        }
      }
    } finally {
      setLoading(false);
    }
  };

  // Resend OTP
  const handleResendOtp = async () => {
    if (!canResend || loading) return;

    try {
      setLoading(true);
      setErrorMessage(null);
      setInfoMessage(null);

      const res = await requestOtp(mobile);

      if (res.success) {
        setRequestId(res.requestId);
        setCountdown(res.retryAfterSeconds || 30);
        setCanResend(false);
        setInfoMessage("A new verification code has been dispatched.");
        setOtp(["", "", "", "", "", ""]);
        otpInputRefs.current[0]?.focus();
      } else {
        setErrorMessage(res.message);
        if (res.isEndpointPending) {
          setIsPendingApi(true);
        }
      }
    } finally {
      setLoading(false);
    }
  };

  // Step 2: Handle OTP input
  const handleOtpChange = (index: number, value: string) => {
    // Only accept numeric digit
    const cleaned = value.replace(/\D/g, "");
    const lastChar = cleaned.slice(-1);

    const newOtp = [...otp];
    newOtp[index] = lastChar;
    setOtp(newOtp);
    if (errorMessage) setErrorMessage(null);

    // Auto advance to next box
    if (lastChar && index < 5) {
      otpInputRefs.current[index + 1]?.focus();
    }

    // Auto submit if all 6 digits entered
    if (lastChar && index === 5 && newOtp.every((digit) => digit !== "")) {
      const fullOtp = newOtp.join("");
      void performVerification(fullOtp);
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace") {
      if (!otp[index] && index > 0) {
        otpInputRefs.current[index - 1]?.focus();
      }
    } else if (e.key === "ArrowLeft" && index > 0) {
      otpInputRefs.current[index - 1]?.focus();
    } else if (e.key === "ArrowRight" && index < 5) {
      otpInputRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpPaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (!pastedData) return;

    const newOtp = [...otp];
    for (let i = 0; i < 6; i++) {
      newOtp[i] = pastedData[i] || "";
    }
    setOtp(newOtp);

    // Focus on the next empty or last filled
    const targetIdx = Math.min(pastedData.length, 5);
    otpInputRefs.current[targetIdx]?.focus();

    if (pastedData.length === 6) {
      void performVerification(pastedData);
    }
  };

  // Step 2: Verify OTP
  const performVerification = async (otpCodeString: string) => {
    if (otpCodeString.length !== 6) {
      setErrorMessage("Please enter all 6 digits of the OTP code.");
      return;
    }

    try {
      setLoading(true);
      setErrorMessage(null);
      setIsPendingApi(false);

      const res = await verifyOtpCode(mobile, otpCodeString, requestId);

      if (res.success && res.access_token && res.user) {
        login(res.access_token, res.user);
        onSuccess?.(res.user);
        onClose();
      } else {
        setErrorMessage(res.message);
        if (res.isEndpointPending) {
          setIsPendingApi(true);
        }
      }
    } finally {
      setLoading(false);
    }
  };

  const handleVerifySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const fullOtp = otp.join("");
    void performVerification(fullOtp);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="login-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-[#001F47]/60 backdrop-blur-xs animate-in fade-in duration-200"
    >
      <div className="relative w-full max-w-md overflow-hidden rounded-3xl bg-white shadow-2xl border border-[#E1ECF2] animate-in zoom-in-95 duration-200">
        {/* Top Accent Strip */}
        <div className="h-1.5 w-full bg-gradient-to-r from-[#002B62] via-[#007C8A] to-[#00A8B5]" />

        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          aria-label="Close login dialog"
          className="absolute right-4 top-4 z-10 flex h-8 w-8 items-center justify-center rounded-full text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 cursor-pointer"
        >
          <X size={18} />
        </button>

        <div className="p-4 sm:p-8">
          {/* Brand Header */}
          <div className="flex flex-col items-center text-center">
            <div className="flex items-center justify-center rounded-2xl bg-[#EBF2FA] p-3 border border-[#CBDCE6] mb-4">
              <img
                src="/liveazy-logo-cropped.png"
                alt="LIVEAZY"
                className="h-7 w-auto object-contain"
              />
            </div>

            {step === "PHONE" ? (
              <>
                <h3
                  id="login-modal-title"
                  className="text-xl sm:text-2xl font-black text-[#002B62] tracking-tight"
                >
                  Login or Sign Up
                </h3>
                <p className="mt-1 text-xs sm:text-sm text-slate-500 max-w-xs">
                  Enter your 10-digit mobile number to verify your account and manage rentals
                </p>
              </>
            ) : (
              <>
                <h3
                  id="login-modal-title"
                  className="text-xl sm:text-2xl font-black text-[#002B62] tracking-tight"
                >
                  Verify Mobile Number
                </h3>
                <div className="mt-1.5 flex items-center justify-center gap-2 text-xs sm:text-sm text-slate-600">
                  <span>Code sent to <strong>{formatDisplayMobile(mobile)}</strong></span>
                  <button
                    type="button"
                    onClick={() => {
                      setStep("PHONE");
                      setErrorMessage(null);
                      setInfoMessage(null);
                      setIsPendingApi(false);
                    }}
                    className="inline-flex items-center gap-1 font-bold text-[#007C8A] hover:underline cursor-pointer"
                    title="Change mobile number"
                  >
                    <Edit2 size={12} />
                    <span>Change</span>
                  </button>
                </div>
              </>
            )}
          </div>

          {/* Info Banner */}
          {infoMessage && (
            <div className="mt-4 flex items-center gap-2 rounded-xl bg-[#E6F5F7] border border-[#CBDCE6] p-3 text-xs text-[#007C8A]">
              <CheckCircle2 size={16} className="shrink-0 text-[#007C8A]" />
              <span>{infoMessage}</span>
            </div>
          )}

          {/* Error Banner */}
          {errorMessage && (
            <div
              role="alert"
              className={`mt-4 rounded-xl p-3 text-xs flex items-start gap-2.5 ${
                isPendingApi
                  ? "bg-amber-50 border border-amber-200 text-amber-900"
                  : "bg-rose-50 border border-rose-200 text-rose-800"
              }`}
            >
              <AlertCircle size={16} className="shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold">{errorMessage}</p>
                {isPendingApi && (
                  <p className="mt-1 text-[11px] text-amber-700">
                    API integration specification prepared in service layer. Real OTP transmission will activate once the API team connects the external SMS gateway.
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Step 1: Mobile Form */}
          {step === "PHONE" && (
            <form onSubmit={handleSendOtp} className="mt-6 space-y-4">
              <div>
                <label
                  htmlFor="customer-mobile-input"
                  className="block text-xs font-bold text-[#002B62] uppercase tracking-wider mb-2"
                >
                  Mobile Number
                </label>

                <div className="relative flex items-center rounded-2xl border border-[#CBDCE6] bg-white transition-all focus-within:border-[#007C8A] focus-within:ring-3 focus-within:ring-[#007C8A]/15 shadow-2xs">
                  {/* +91 Country Code Box */}
                  <div className="flex items-center gap-1.5 border-r border-[#CBDCE6] bg-[#F4F8FA] px-3.5 py-3 text-xs font-bold text-[#002B62] select-none rounded-l-2xl">
                    <span className="text-base leading-none">🇮🇳</span>
                    <span>+91</span>
                  </div>

                  <input
                    ref={phoneInputRef}
                    id="customer-mobile-input"
                    type="tel"
                    inputMode="numeric"
                    autoComplete="tel"
                    value={mobile}
                    onChange={handleMobileChange}
                    placeholder="Enter 10-digit number"
                    maxLength={10}
                    className="w-full bg-transparent px-3.5 py-3 text-sm font-semibold text-slate-900 placeholder:text-slate-400 outline-none"
                  />

                  {mobile.length > 0 && (
                    <button
                      type="button"
                      onClick={() => setMobile("")}
                      className="mr-3 text-slate-400 hover:text-slate-600 p-1"
                      title="Clear"
                    >
                      <X size={14} />
                    </button>
                  )}
                </div>

                <div className="mt-1.5 flex items-center justify-between text-[11px] text-slate-400">
                  <span>Enter 10 digits without +91 or 0</span>
                  <span className={mobile.length === 10 ? "text-[#007C8A] font-bold" : ""}>
                    {mobile.length}/10 digits
                  </span>
                </div>
              </div>

              {/* Submit CTA */}
              <button
                type="submit"
                disabled={loading || mobile.length !== 10}
                className="mt-2 flex w-full items-center justify-center gap-2 rounded-2xl bg-[#002B62] py-3.5 text-xs sm:text-sm font-bold text-white shadow-md shadow-[#002B62]/20 transition-all hover:bg-[#001F47] hover:shadow-lg active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer"
              >
                {loading ? (
                  <>
                    <RefreshCw size={16} className="animate-spin" />
                    <span>Sending OTP...</span>
                  </>
                ) : (
                  <>
                    <span>Send Verification Code</span>
                    <ArrowRight size={16} />
                  </>
                )}
              </button>

              {/* Trust Value Props */}
              <div className="mt-5 pt-4 border-t border-[#E1ECF2] grid grid-cols-2 gap-2 text-[11px] text-slate-600 font-medium">
                <div className="flex items-center gap-1.5">
                  <ShieldCheck size={14} className="text-[#007C8A] shrink-0" />
                  <span>100% Verified Profile</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Truck size={14} className="text-[#007C8A] shrink-0" />
                  <span>Free Doorstep Setup</span>
                </div>
              </div>

              {/* Terms notice */}
              <p className="mt-3 text-center text-[10.5px] text-slate-400 leading-normal">
                By continuing, you agree to LIVEAZY&apos;s{" "}
                <a href="/contact" className="underline hover:text-slate-700">
                  Terms of Service
                </a>{" "}
                &amp;{" "}
                <a href="/contact" className="underline hover:text-slate-700">
                  Privacy Policy
                </a>.
              </p>
            </form>
          )}

          {/* Step 2: OTP Verification Form */}
          {step === "OTP" && (
            <form onSubmit={handleVerifySubmit} className="mt-6 space-y-5">
              <div>
                <label className="block text-center text-xs font-bold text-[#002B62] uppercase tracking-wider mb-3">
                  Enter 6-Digit OTP
                </label>

                {/* 6 Digit Input Boxes */}
                <div className="flex items-center justify-center gap-1.5 sm:gap-2.5">
                  {otp.map((digit, idx) => (
                    <input
                      key={idx}
                      ref={(el) => {
                        otpInputRefs.current[idx] = el;
                      }}
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      maxLength={1}
                      value={digit}
                      onChange={(e) => handleOtpChange(idx, e.target.value)}
                      onKeyDown={(e) => handleOtpKeyDown(idx, e)}
                      onPaste={handleOtpPaste}
                      className={`h-11 w-9 sm:h-13 sm:w-12 rounded-xl text-center text-base sm:text-xl font-black outline-none transition-all border ${
                        digit
                          ? "border-[#007C8A] bg-[#E6F5F7] text-[#002B62] shadow-2xs"
                          : "border-[#CBDCE6] bg-[#F4F8FA] text-slate-900 focus:border-[#007C8A] focus:bg-white focus:ring-2 focus:ring-[#007C8A]/20"
                      }`}
                    />
                  ))}
                </div>
              </div>

              {/* Resend Code / Timer */}
              <div className="flex items-center justify-between text-xs pt-1">
                <span className="text-slate-400 font-medium">Didn&apos;t receive code?</span>
                {canResend ? (
                  <button
                    type="button"
                    onClick={handleResendOtp}
                    disabled={loading}
                    className="font-bold text-[#007C8A] hover:underline cursor-pointer disabled:opacity-50"
                  >
                    Resend OTP
                  </button>
                ) : (
                  <span className="font-semibold text-slate-500">
                    Resend in <strong className="text-[#002B62] font-mono">{countdown}s</strong>
                  </span>
                )}
              </div>

              {/* Verify CTA */}
              <button
                type="submit"
                disabled={loading || otp.some((d) => d === "")}
                className="flex w-full items-center justify-center gap-2 rounded-2xl bg-[#002B62] py-3.5 text-xs sm:text-sm font-bold text-white shadow-md shadow-[#002B62]/20 transition-all hover:bg-[#001F47] hover:shadow-lg active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer"
              >
                {loading ? (
                  <>
                    <RefreshCw size={16} className="animate-spin" />
                    <span>Verifying OTP...</span>
                  </>
                ) : (
                  <>
                    <Lock size={15} />
                    <span>Verify &amp; Login</span>
                  </>
                )}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default LoginModal;
