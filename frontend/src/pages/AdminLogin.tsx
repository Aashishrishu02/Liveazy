
import { useState } from "react";
import type { FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { Eye, EyeOff, LockKeyhole, Mail, ShieldCheck } from "lucide-react";

export default function AdminLogin() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const navigate = useNavigate();

  const handleLogin = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);

    try {
      const API_URL = import.meta.env.VITE_API_URL;

      const response = await fetch(`${API_URL}/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        alert(data.message || "Invalid email or password");
        return;
      }

      // Existing authentication flow preserved
      localStorage.setItem("token", data.access_token);
      navigate("/admin/dashboard");
    } catch (error) {
      console.error("Login error:", error);
      alert("Unable to connect to server");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#F5F7FA] px-4 py-10 sm:px-6">
      {/* Background decoration */}
      <div className="pointer-events-none absolute -left-32 -top-32 h-80 w-80 rounded-full bg-[#008A90]/10 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-40 -right-24 h-96 w-96 rounded-full bg-[#0F2942]/10 blur-3xl" />

      <div className="relative grid w-full max-w-5xl overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl shadow-[#0F2942]/10 lg:grid-cols-2">
        {/* Branding panel */}
        <section className="relative flex flex-col justify-between overflow-hidden bg-[#0F2942] p-8 text-white sm:p-10 lg:min-h-[610px] lg:p-12">
          <div className="absolute -right-20 top-24 h-64 w-64 rounded-full border border-white/10" />
          <div className="absolute -right-10 top-36 h-44 w-44 rounded-full border border-white/10" />
          <div className="absolute -bottom-24 -left-16 h-64 w-64 rounded-full bg-[#008A90]/20 blur-2xl" />

          <div className="relative z-10">
            <img
              src="/liveazy-logo.png"
              alt="LIVEAZY"
              className="mb-10 h-16 w-auto max-w-[220px] rounded-lg bg-white p-2 object-contain"
            />

            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1.5 text-xs font-medium text-teal-100">
              <ShieldCheck size={15} />
              Secure Admin Portal
            </div>

            <h1 className="max-w-sm text-3xl font-bold leading-tight tracking-tight sm:text-4xl">
              Manage your rental business with confidence.
            </h1>

            <p className="mt-5 max-w-sm text-sm leading-7 text-slate-300 sm:text-base">
              Manage products, categories, banners and customer enquiries
              from one central workspace.
            </p>
          </div>

          <div className="relative z-10 mt-12 border-t border-white/15 pt-5">
            <p className="text-sm font-medium text-white">
              LIVEAZY Rental Commerce Hub
            </p>
            <p className="mt-1 text-xs text-slate-400">
              Administration & content management
            </p>
          </div>
        </section>

        {/* Login form */}
        <section className="flex items-center justify-center p-7 sm:p-12 lg:p-14">
          <div className="w-full max-w-sm">
            <div className="mb-8">
              <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-[#008A90]/10 text-[#008A90]">
                <LockKeyhole size={24} />
              </div>

              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#008A90]">
                Admin Access
              </p>

              <h2 className="mt-2 text-3xl font-bold tracking-tight text-[#0F2942]">
                Welcome back
              </h2>

              <p className="mt-3 text-sm leading-6 text-slate-500">
                Sign in with your administrator credentials to continue.
              </p>
            </div>

            <form onSubmit={handleLogin} className="space-y-5">
              <div>
                <label
                  htmlFor="admin-email"
                  className="mb-2 block text-sm font-semibold text-[#0F2942]"
                >
                  Email address
                </label>

                <div className="relative">
                  <Mail
                    size={18}
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                  />
                  <input
                    id="admin-email"
                    type="email"
                    autoComplete="username"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="admin@example.com"
                    required
                    className="h-12 w-full rounded-xl border border-slate-200 bg-slate-50 pl-11 pr-4 text-sm text-[#0F2942] outline-none transition placeholder:text-slate-400 focus:border-[#008A90] focus:bg-white focus:ring-4 focus:ring-[#008A90]/10"
                  />
                </div>
              </div>

              <div>
                <div className="mb-2 flex items-center justify-between">
                  <label
                    htmlFor="admin-password"
                    className="block text-sm font-semibold text-[#0F2942]"
                  >
                    Password
                  </label>
                </div>

                <div className="relative">
                  <LockKeyhole
                    size={18}
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                  />
                  <input
                    id="admin-password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="current-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    required
                    className="h-12 w-full rounded-xl border border-slate-200 bg-slate-50 pl-11 pr-12 text-sm text-[#0F2942] outline-none transition placeholder:text-slate-400 focus:border-[#008A90] focus:bg-white focus:ring-4 focus:ring-[#008A90]/10"
                  />

                  <button
                    type="button"
                    onClick={() => setShowPassword((value) => !value)}
                    aria-label={showPassword ? "Hide password" : "Show password"}
                    className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-2 text-slate-400 transition hover:bg-slate-100 hover:text-[#0F2942]"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#0F2942] px-4 text-sm font-semibold text-white shadow-lg shadow-[#0F2942]/15 transition hover:bg-[#008A90] focus:outline-none focus:ring-4 focus:ring-[#008A90]/20 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? "Signing in..." : "Sign in to dashboard"}
                {!loading && <span aria-hidden="true">→</span>}
              </button>
            </form>

            <div className="mt-7 flex items-start gap-3 rounded-xl border border-slate-100 bg-slate-50 p-4">
              <ShieldCheck
                size={19}
                className="mt-0.5 shrink-0 text-[#008A90]"
              />
              <p className="text-xs leading-5 text-slate-500">
                This area is intended for authorized administrators only.
                Keep your login credentials secure.
              </p>
            </div>

            <p className="mt-8 text-center text-xs text-slate-400">
              © {new Date().getFullYear()} LIVEAZY. All rights reserved.
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}
