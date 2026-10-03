import React, { useState } from "react";

interface LoginModalProps {
  onClose: () => void;
  onLoginSuccess: () => void;
}

const API_URL = import.meta.env.VITE_API_URL;

// Images from src/assets/products
const productImages = Object.values(
  import.meta.glob("../assets/products/*.{png,jpg,jpeg,webp,avif}", {
    eager: true,
    query: "?url",
    import: "default",
  })
) as string[];

const LoginModal: React.FC<LoginModalProps> = ({
  onClose,
  onLoginSuccess,
}) => {
  const [isRegister, setIsRegister] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email || !password || (isRegister && !name)) {
      alert("Please fill all required fields");
      return;
    }

    try {
      setLoading(true);

      const endpoint = isRegister
        ? "/auth/register"
        : "/auth/login";

      const body = isRegister
        ? { name, email, password }
        : { email, password };

      const response = await fetch(`${API_URL}${endpoint}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      });

      const data = await response.json();

      if (!response.ok) {
        alert(data.message || "Something went wrong");
        return;
      }

      if (isRegister) {
        alert("Registration successful. Please login.");

        setIsRegister(false);
        setName("");
        setEmail("");
        setPassword("");
      } else {
        localStorage.setItem("token", data.access_token);
        onLoginSuccess();
        onClose();
      }
    } catch (error) {
      console.error(error);
      alert("Unable to connect to server");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = () => {
    window.location.href = `${API_URL}/auth/google`;
  };

  // Divide products into 4 columns
  const columns = [
    productImages.slice(0, 8),
    productImages.slice(8, 16),
    productImages.slice(16, 24),
    productImages.slice(24, 32),
  ];

  return (
    <>
      <style>
        {`
          @keyframes moveUp {
            from {
              transform: translateY(0);
            }
            to {
              transform: translateY(-50%);
            }
          }

          @keyframes moveDown {
            from {
              transform: translateY(-50%);
            }
            to {
              transform: translateY(0);
            }
          }

          .move-up {
            animation: moveUp 28s linear infinite;
          }

          .move-down {
            animation: moveDown 32s linear infinite;
          }

          .move-up-slow {
            animation: moveUp 35s linear infinite;
          }

          .move-down-slow {
            animation: moveDown 30s linear infinite;
          }

          .move-up:hover,
          .move-down:hover,
          .move-up-slow:hover,
          .move-down-slow:hover {
            animation-play-state: paused;
          }
        `}
      </style>

      {/* Overlay */}
      <div
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4 py-5 backdrop-blur-sm"
        onClick={onClose}
      >
        {/* Main Modal */}
        <div
          className="relative flex h-[680px] w-full max-w-4xl overflow-hidden rounded-[26px] bg-white shadow-2xl"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Close */}
          <button
            onClick={onClose}
            className="absolute right-4 top-4 z-50 flex h-9 w-9 items-center justify-center rounded-full bg-white text-xl text-gray-500 shadow-sm transition hover:bg-gray-100 hover:text-black"
          >
            ×
          </button>

          {/* ================================= */}
          {/* LEFT ANIMATED SECTION */}
          {/* ================================= */}

          <div className="relative hidden w-[45%] overflow-hidden bg-[#f7f4ef] lg:block">
            {/* Soft overlay */}
            <div className="pointer-events-none absolute inset-0 z-20 bg-gradient-to-b from-[#f7f4ef]/80 via-transparent to-[#f7f4ef]/90" />

            {/* Logo + Heading */}
            <div className="absolute left-7 top-7 z-30">
              <div className="flex items-center gap-2.5">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-500 text-lg font-bold text-white">
                  R
                </div>

                <span className="text-xl font-bold text-gray-900">
                  RentNest
                </span>
              </div>

              <h2 className="mt-5 text-3xl font-bold leading-tight tracking-tight text-gray-900">
                
              </h2>

              <p className="mt-2 max-w-xs text-xs leading-5 text-gray-500">
                
              </p>
            </div>

            {/* Animated Products */}
            <div className="absolute -inset-x-3 -bottom-36 -top-24 flex gap-2.5">
              {columns.map((column, columnIndex) => {
                const images = [...column, ...column];

                return (
                  <div
                    key={columnIndex}
                    className="w-1/4 shrink-0"
                  >
                    <div
                      className={`flex flex-col gap-2.5 ${
                        columnIndex === 0
                          ? "move-up"
                          : columnIndex === 1
                            ? "move-down"
                            : columnIndex === 2
                              ? "move-up-slow"
                              : "move-down-slow"
                      }`}
                    >
                      {images.map((image, index) => (
                        <div
                          key={`${columnIndex}-${index}`}
                          className="h-32 overflow-hidden rounded-xl bg-white shadow-sm"
                        >
                          <img
                            src={image}
                            alt="RentNest product"
                            className="h-full w-full object-cover transition duration-500 hover:scale-105"
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Bottom */}
            <div className="absolute bottom-6 left-7 z-30">
              <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-gray-400">
                Rent • Live • Enjoy
              </p>
            </div>
          </div>

          {/* ================================= */}
          {/* RIGHT FORM */}
          {/* ================================= */}

          <div className="flex w-full items-center justify-center overflow-y-auto px-6 py-8 sm:px-10 lg:w-[55%] lg:px-12">
            <div className="w-full max-w-sm">

              {/* Mobile Logo */}
              <div className="mb-8 flex items-center gap-2.5 lg:hidden">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-orange-500 font-bold text-white">
                  R
                </div>

                <span className="text-xl font-bold text-gray-900">
                  RentNest
                </span>
              </div>

              {/* Heading */}
              <div className="mb-7">
                <p className="mb-2 text-[11px] font-semibold tracking-[0.18em] text-orange-500">
                  {isRegister ? "CREATE ACCOUNT" : "HELLO"}
                </p>

                <h1 className="text-3xl font-bold tracking-tight text-gray-900">
                  {isRegister
                    ? "Create your account"
                    : "Welcome to RentNest"}
                </h1>

                <p className="mt-2 text-sm leading-5 text-gray-500">
                  {isRegister
                    ? "Join RentNest and discover your next perfect space."
                    : "Sign in to continue your rental journey."}
                </p>
              </div>

              {/* Form */}
              <form
                onSubmit={handleSubmit}
                className="space-y-4"
              >
                {/* Name */}
                {isRegister && (
                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-gray-700">
                      Full name
                    </label>

                    <input
                      type="text"
                      value={name}
                      onChange={(e) =>
                        setName(e.target.value)
                      }
                      placeholder="Enter your full name"
                      className="h-11 w-full rounded-xl border border-gray-200 bg-gray-50 px-4 text-sm outline-none transition placeholder:text-gray-400 focus:border-orange-400 focus:bg-white focus:ring-4 focus:ring-orange-100"
                    />
                  </div>
                )}

                {/* Email */}
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-gray-700">
                    Email address
                  </label>

                  <input
                    type="email"
                    value={email}
                    onChange={(e) =>
                      setEmail(e.target.value)
                    }
                    placeholder="you@example.com"
                    className="h-11 w-full rounded-xl border border-gray-200 bg-gray-50 px-4 text-sm outline-none transition placeholder:text-gray-400 focus:border-orange-400 focus:bg-white focus:ring-4 focus:ring-orange-100"
                  />
                </div>

                {/* Password */}
                <div>
                  <div className="mb-1.5 flex items-center justify-between">
                    <label className="text-sm font-medium text-gray-700">
                      Password
                    </label>

                    {!isRegister && (
                      <button
                        type="button"
                        className="text-xs font-medium text-orange-500 hover:text-orange-600"
                      >
                        Forgot password?
                      </button>
                    )}
                  </div>

                  <div className="relative">
                    <input
                      type={
                        showPassword
                          ? "text"
                          : "password"
                      }
                      value={password}
                      onChange={(e) =>
                        setPassword(e.target.value)
                      }
                      placeholder="Enter your password"
                      className="h-11 w-full rounded-xl border border-gray-200 bg-gray-50 px-4 pr-16 text-sm outline-none transition placeholder:text-gray-400 focus:border-orange-400 focus:bg-white focus:ring-4 focus:ring-orange-100"
                    />

                    <button
                      type="button"
                      onClick={() =>
                        setShowPassword(!showPassword)
                      }
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-medium text-gray-500 hover:text-gray-900"
                    >
                      {showPassword ? "Hide" : "Show"}
                    </button>
                  </div>
                </div>

                {/* Submit */}
                <button
                  type="submit"
                  disabled={loading}
                  className="h-11 w-full rounded-xl bg-orange-500 text-sm font-semibold text-white shadow-md shadow-orange-100 transition hover:bg-orange-600 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {loading
                    ? "Please wait..."
                    : isRegister
                      ? "Create account"
                      : "Sign in"}
                </button>
              </form>

              {/* Divider */}
              <div className="my-5 flex items-center gap-3">
                <div className="h-px flex-1 bg-gray-200" />

                <span className="text-[11px] text-gray-400">
                  OR
                </span>

                <div className="h-px flex-1 bg-gray-200" />
              </div>

              {/* Google */}
              <button
                type="button"
                onClick={handleGoogleLogin}
                className="flex h-11 w-full items-center justify-center gap-3 rounded-xl border border-gray-200 bg-white text-sm font-medium text-gray-700 transition hover:bg-gray-50"
              >
                <span className="font-bold">G</span>
                Continue with Google
              </button>

              {/* Switch */}
              <p className="mt-6 text-center text-sm text-gray-500">
                {isRegister
                  ? "Already have an account?"
                  : "Don't have an account?"}{" "}

                <button
                  type="button"
                  onClick={() => {
                    setIsRegister(!isRegister);
                    setPassword("");
                  }}
                  className="font-semibold text-orange-500 hover:text-orange-600"
                >
                  {isRegister
                    ? "Sign in"
                    : "Create account"}
                </button>
              </p>

              {/* Terms */}
              <p className="mt-4 text-center text-[10px] leading-4 text-gray-400">
                By continuing, you agree to RentNest's
                Terms of Service and Privacy Policy.
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default LoginModal;