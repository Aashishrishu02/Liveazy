
import { useCallback, useEffect, useState } from "react";
import type { FormEvent, ReactNode } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  Tags,
  Armchair,
  Images,
  Megaphone,
  MessageCircle,
  Store,
  LogOut,
  Menu,
  Smartphone,
  Save,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  Eye,
  Send,
  Settings,
  ExternalLink,

} from "lucide-react";

const API_URL = import.meta.env.VITE_API_URL;

const DEFAULT_MESSAGE =
  "Hello! I am interested in renting {productName}. Please share more details.";

const navigation = [
  { label: "Dashboard", path: "/admin/dashboard", icon: LayoutDashboard },
  { label: "Categories", path: "/admin/categories", icon: Tags },
  { label: "Products", path: "/admin/products", icon: Armchair },
  { label: "Banners", path: "/admin/banner", icon: Images },
  { label: "Promo Banners", path: "/admin/promo-banners", icon: Megaphone },
  {
    label: "WhatsApp Settings",
    path: "/admin/settings",
    icon: MessageCircle,
  },
];

interface WhatsAppSettingsData {
  whatsappNumber?: string;
  whatsappMessage?: string;
}

export default function WhatsAppSettings() {
  const navigate = useNavigate();

  const [whatsappNumber, setWhatsappNumber] = useState("");
  const [whatsappMessage, setWhatsappMessage] = useState(DEFAULT_MESSAGE);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const fetchSettings = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const response = await fetch(`${API_URL}/settings/whatsapp`);

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.message || "Failed to load WhatsApp settings.");
      }

      const data: WhatsAppSettingsData = await response.json();

      setWhatsappNumber(data.whatsappNumber ?? "");
      setWhatsappMessage(data.whatsappMessage || DEFAULT_MESSAGE);
    } catch (err) {
      console.error("Error loading WhatsApp settings:", err);
      setError(
        err instanceof Error
          ? err.message
          : "Unable to load WhatsApp settings."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchSettings();
  }, [fetchSettings]);

  const handleSave = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    setError("");
    setSuccess("");

    const digits = whatsappNumber.replace(/\D/g, "");
    const message = whatsappMessage.trim();

    if (digits.length < 10 || digits.length > 15) {
      setError(
        "Enter a valid WhatsApp number with country code. For India, use 91 followed by your mobile number."
      );
      return;
    }

    if (!message) {
      setError("Please enter a WhatsApp message.");
      return;
    }

    try {
      setSaving(true);

      const response = await fetch(`${API_URL}/settings/whatsapp`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          whatsappNumber: digits,
          whatsappMessage: message,
        }),
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data.message || "Failed to save WhatsApp settings.");
      }

      setWhatsappNumber(data.whatsappNumber ?? digits);
      setWhatsappMessage(data.whatsappMessage ?? message);
      setSuccess("WhatsApp settings saved successfully.");
    } catch (err) {
      console.error("Error saving WhatsApp settings:", err);
      setError(
        err instanceof Error
          ? err.message
          : "Unable to save WhatsApp settings."
      );
    } finally {
      setSaving(false);
    }
  };

  const logout = () => {
    localStorage.removeItem("token");
    navigate("/admin");
  };

  const previewMessage = whatsappMessage.replace(
    /\{productName\}/g,
    "Premium Camera"
  );

  const previewNumber = whatsappNumber.replace(/\D/g, "");

  const previewUrl = previewNumber
    ? `https://wa.me/${previewNumber}?text=${encodeURIComponent(
        previewMessage
      )}`
    : "";

  return (
    <div className="min-h-screen bg-[#F5F7FA] text-[#142B43]">
      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <button
          type="button"
          aria-label="Close navigation"
          onClick={() => setSidebarOpen(false)}
          className="fixed inset-0 z-40 bg-[#0F2942]/40 lg:hidden"
        />
      )}

      {/* Sidebar: same layout as Products.tsx */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-[260px] flex-col border-r border-slate-200 bg-white transition-transform duration-200 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        } lg:translate-x-0`}
      >
        <div className="border-b border-slate-100 bg-[#F8FAFC] px-6 py-6">
          <div className="flex items-center gap-3">
            <img
              src="/liveazy-logo.png"
              alt="LIVEAZY"
              className="h-11 w-11 rounded-xl bg-white object-contain p-1"
            />

            <div>
              <h1 className="text-xl font-extrabold tracking-tight text-[#0F2942]">
                LIVEAZY
              </h1>
              <p className="mt-0.5 text-xs text-slate-500">
                Rental Commerce Hub
              </p>
            </div>
          </div>

          <span className="mt-5 inline-flex rounded-md bg-[#D9F4F2] px-3 py-1.5 text-[10px] font-bold tracking-[0.14em] text-[#00696E]">
            ADMIN CONSOLE
          </span>
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-6">
          <p className="mb-3 px-3 text-[10px] font-bold uppercase tracking-[0.16em] text-slate-400">
            Operations &amp; Catalog
          </p>

          <nav className="space-y-1.5">
            {navigation.map((item) => {
              const Icon = item.icon;

              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  onClick={() => setSidebarOpen(false)}
                  className={({ isActive }) =>
                    `flex items-center gap-3 rounded-lg px-3 py-3 text-sm font-semibold transition ${
                      isActive
                        ? "bg-[#0F2942] text-white shadow-sm"
                        : "text-slate-600 hover:bg-slate-100 hover:text-[#0F2942]"
                    }`
                  }
                >
                  <Icon size={19} strokeWidth={1.8} />
                  {item.label}
                </NavLink>
              );
            })}
          </nav>

          <div className="my-6 border-t border-slate-100" />

          <NavLink
            to="/"
            onClick={() => setSidebarOpen(false)}
            className="flex items-center gap-3 rounded-lg px-3 py-3 text-sm font-semibold text-slate-600 transition hover:bg-slate-100"
          >
            <Store size={19} />
            View Website
          </NavLink>
        </div>

        <div className="border-t border-slate-100 p-4">
          <button
            type="button"
            onClick={logout}
            className="flex w-full items-center justify-center gap-2 rounded-lg px-4 py-3 text-sm font-semibold text-red-600 transition hover:bg-red-50"
          >
            <LogOut size={18} />
            Log Out
          </button>
        </div>
      </aside>

      {/* Main layout: same as Products.tsx */}
      <div className="min-h-screen lg:pl-[260px]">
        <header className="sticky top-0 z-30 flex h-[72px] items-center justify-between gap-4 border-b border-slate-200 bg-white/95 px-4 backdrop-blur-md sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <button
              type="button"
              aria-label="Open navigation"
              onClick={() => setSidebarOpen(true)}
              className="rounded-lg border border-slate-200 p-2 hover:bg-slate-50 lg:hidden"
            >
              <Menu size={20} />
            </button>

            <div>
              <p className="text-xs font-medium text-slate-400">
                Store Management / WhatsApp Settings
              </p>
              <h2 className="mt-1 text-base font-bold text-[#0F2942]">
                WhatsApp Settings
              </h2>
            </div>
          </div>

          <div className="hidden items-center gap-2 rounded-full bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-700 sm:flex">
            <span className="h-2 w-2 rounded-full bg-emerald-500" />
            Admin workspace
          </div>
        </header>

        <main className="mx-auto max-w-[1600px] space-y-6 px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
          {/* Page heading */}
          <section className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
            <div>
              <span className="inline-flex items-center gap-2 rounded-md bg-[#D9F4F2] px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.14em] text-[#00696E]">
                <Settings size={13} />
                Store Configuration
              </span>

              <h1 className="mt-3 text-2xl font-extrabold tracking-tight text-[#0F2942] sm:text-3xl">
                WhatsApp Configuration
              </h1>

              <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
                Manage the WhatsApp contact number and customer enquiry
                message for your rental store.
              </p>
            </div>

            <button
              type="button"
              onClick={() => void fetchSettings()}
              disabled={loading || saving}
              className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-[#0F2942] transition hover:bg-slate-50 disabled:opacity-50"
            >
              <RefreshCw
                size={16}
                className={loading ? "animate-spin" : ""}
              />
              Refresh Settings
            </button>
          </section>

          {/* Status messages */}
          {error && (
            <div
              role="alert"
              className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3.5 text-sm text-red-700"
            >
              <AlertCircle size={19} className="mt-0.5 shrink-0" />
              <p>{error}</p>
            </div>
          )}

          {success && (
            <div
              role="status"
              className="flex items-start gap-3 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3.5 text-sm text-emerald-700"
            >
              <CheckCircle2 size={19} className="mt-0.5 shrink-0" />
              <p>{success}</p>
            </div>
          )}

          {/* Summary cards */}
          <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
            <StatCard
              title="WhatsApp Number"
              value={loading ? "Loading..." : whatsappNumber || "Not configured"}
              subtitle="Customer contact number"
              icon={<MessageCircle size={20} />}
              iconClass="bg-emerald-50 text-emerald-700"
            />

            <StatCard
              title="Message Status"
              value={whatsappMessage.trim() ? "Configured" : "Not configured"}
              subtitle="Automatic enquiry message"
              icon={<Send size={20} />}
              iconClass="bg-[#D9F4F2] text-[#00696E]"
            />

            <StatCard
              title="Customer Channel"
              value="WhatsApp"
              subtitle="Direct customer enquiries"
              icon={<Smartphone size={20} />}
              iconClass="bg-orange-50 text-[#E96B43]"
            />
          </section>

          {/* Settings form and preview */}
          <section className="grid grid-cols-1 items-start gap-6 xl:grid-cols-[minmax(0,1.1fr)_minmax(340px,0.9fr)]">
            <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
              <div className="border-b border-slate-200 px-5 py-5 sm:px-6">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#D9F4F2] text-[#00696E]">
                    <Settings size={20} />
                  </div>
                  <div>
                    <h3 className="font-bold text-[#0F2942]">
                      Contact Configuration
                    </h3>
                    <p className="mt-1 text-xs text-slate-500">
                      Update the details used for customer enquiries.
                    </p>
                  </div>
                </div>
              </div>

              {loading ? (
                <div className="flex min-h-[300px] items-center justify-center gap-3 text-sm text-slate-500">
                  <RefreshCw
                    size={18}
                    className="animate-spin text-[#008A90]"
                  />
                  Loading WhatsApp settings...
                </div>
              ) : (
                <form onSubmit={handleSave} className="space-y-6 p-5 sm:p-6">
                  <div>
                    <label
                      htmlFor="whatsapp-number"
                      className="mb-2 block text-sm font-semibold text-[#0F2942]"
                    >
                      WhatsApp Number
                    </label>

                    <div className="flex overflow-hidden rounded-lg border border-slate-200 transition focus-within:border-[#008A90] focus-within:ring-2 focus-within:ring-[#008A90]/10">
                      <span className="flex items-center border-r border-slate-200 bg-[#F8FAFC] px-3 text-slate-500">
                        <MessageCircle size={18} />
                      </span>

                      <input
                        id="whatsapp-number"
                        type="tel"
                        inputMode="tel"
                        autoComplete="tel"
                        value={whatsappNumber}
                        onChange={(event) =>
                          setWhatsappNumber(event.target.value)
                        }
                        placeholder="e.g. 919876543210"
                        required
                        className="h-12 min-w-0 flex-1 px-4 text-sm outline-none"
                      />
                    </div>

                    <p className="mt-2 text-xs leading-5 text-slate-400">
                      Include your country code. For India, use 91 followed by
                      your mobile number.
                    </p>
                  </div>

                  <div>
                    <div className="mb-2 flex items-center justify-between gap-3">
                      <label
                        htmlFor="whatsapp-message"
                        className="block text-sm font-semibold text-[#0F2942]"
                      >
                        Customer Enquiry Message
                      </label>
                      <span className="text-xs text-slate-400">
                        {whatsappMessage.length}/1000
                      </span>
                    </div>

                    <textarea
                      id="whatsapp-message"
                      value={whatsappMessage}
                      onChange={(event) =>
                        setWhatsappMessage(event.target.value)
                      }
                      rows={5}
                      maxLength={1000}
                      required
                      placeholder="Write the message customers will send..."
                      className="w-full resize-y rounded-lg border border-slate-200 px-4 py-3 text-sm leading-6 outline-none transition placeholder:text-slate-400 focus:border-[#008A90] focus:ring-2 focus:ring-[#008A90]/10"
                    />

                    <div className="mt-3 rounded-lg bg-[#F8FAFC] p-4">
                      <p className="text-xs font-bold text-[#0F2942]">
                        Dynamic product name
                      </p>
                      <p className="mt-1 text-xs leading-5 text-slate-500">
                        Add{" "}
                        <code className="rounded bg-white px-1.5 py-0.5 font-semibold text-[#00696E]">
                          {"{productName}"}
                        </code>{" "}
                        in the message to insert the product name.
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-col-reverse gap-3 border-t border-slate-100 pt-5 sm:flex-row sm:justify-end">
                    <button
                      type="button"
                      disabled={saving}
                      onClick={() => {
                        setWhatsappMessage(DEFAULT_MESSAGE);
                        setError("");
                        setSuccess("");
                      }}
                      className="rounded-lg border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-600 transition hover:bg-slate-50 disabled:opacity-50"
                    >
                      Reset Message
                    </button>

                    <button
                      type="submit"
                      disabled={saving}
                      className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#0F2942] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#193D5C] disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {saving ? (
                        <RefreshCw size={17} className="animate-spin" />
                      ) : (
                        <Save size={17} />
                      )}
                      {saving ? "Saving..." : "Save Settings"}
                    </button>
                  </div>
                </form>
              )}
            </div>

            {/* WhatsApp preview */}
            <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
              <div className="border-b border-slate-200 px-5 py-5 sm:px-6">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700">
                    <Eye size={20} />
                  </div>
                  <div>
                    <h3 className="font-bold text-[#0F2942]">
                      Customer Message Preview
                    </h3>
                    <p className="mt-1 text-xs text-slate-500">
                      Preview how the enquiry message will look.
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-[#E8F0E9] p-4 sm:p-6">
                <div className="mx-auto max-w-[380px] overflow-hidden rounded-xl bg-[#EFEAE2] shadow-sm">
                  <div className="flex items-center gap-3 bg-[#075E54] px-4 py-3 text-white">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/15">
                      <MessageCircle size={21} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-bold">
                        LIVEAZY Store
                      </p>
                      <p className="mt-0.5 text-[10px] text-white/75">
                        WhatsApp Business
                      </p>
                    </div>
                    <MessageCircle size={18} />
                  </div>

                  <div className="min-h-[230px] space-y-4 bg-[radial-gradient(#D6D0C6_0.7px,transparent_0.7px)] bg-[size:12px_12px] p-4">
                    <div className="mx-auto w-fit rounded-md bg-[#FDF4C5] px-3 py-1 text-[10px] text-slate-600 shadow-sm">
                      Customer enquiry
                    </div>

                    <div className="ml-auto max-w-[95%] rounded-xl rounded-tr-sm bg-[#D9FDD3] p-3 shadow-sm">
                      <p className="whitespace-pre-wrap break-words text-xs leading-5 text-[#25332D]">
                        {previewMessage}
                      </p>
                      <p className="mt-2 text-right text-[9px] text-slate-500">
                        Now ✓✓
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 bg-white p-3">
                    <div className="flex-1 rounded-full bg-slate-100 px-4 py-2.5 text-[11px] text-slate-400">
                      Message
                    </div>
                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#008A90] text-white">
                      <Send size={15} />
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-4 p-5">
                <div className="rounded-lg border border-slate-200 p-4">
                  <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">
                    <Smartphone size={15} />
                    Configured WhatsApp Number
                  </div>
                  <p className="mt-2 break-all text-sm font-bold text-[#0F2942]">
                    {whatsappNumber || "No number configured"}
                  </p>
                </div>

                <p className="text-xs leading-5 text-slate-500">
                  Save your settings before testing the customer enquiry link.
                </p>

                <a
                  href={previewUrl || undefined}
                  target="_blank"
                  rel="noreferrer"
                  onClick={(event) => {
                    if (!previewUrl) event.preventDefault();
                  }}
                  aria-disabled={!previewUrl}
                  className={`flex w-full items-center justify-center gap-2 rounded-lg px-4 py-3 text-sm font-semibold transition ${
                    previewUrl
                      ? "bg-[#25D366] text-white hover:bg-[#1DB954]"
                      : "cursor-not-allowed bg-slate-100 text-slate-400"
                  }`}
                >
                  <MessageCircle size={18} />
                  Test WhatsApp Link
                  <ExternalLink size={15} />
                </a>
              </div>
            </div>
          </section>

          {/* Footer */}
          <footer className="flex flex-col gap-2 border-t border-slate-200 py-5 text-xs text-slate-400 sm:flex-row sm:items-center sm:justify-between">
            <p>LIVEAZY Admin Console</p>
            <p>Store Management / WhatsApp Settings</p>
          </footer>
        </main>
      </div>
    </div>
  );
}

function StatCard({
  title,
  value,
  subtitle,
  icon,
  iconClass,
}: {
  title: string;
  value: string;
  subtitle: string;
  icon: ReactNode;
  iconClass: string;
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-medium text-slate-500">{title}</p>
        <div className={`rounded-lg p-2.5 ${iconClass}`}>{icon}</div>
      </div>
      <p className="mt-4 break-words text-xl font-extrabold text-[#0F2942]">
        {value}
      </p>
      <p className="mt-1 text-xs text-slate-400">{subtitle}</p>
    </div>
  );
}
