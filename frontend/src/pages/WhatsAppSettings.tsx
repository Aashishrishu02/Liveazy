import {
  useCallback, useEffect, useMemo, useRef, useState } from "react";
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
  Save,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  Send,
  Settings,
  ExternalLink,
  Copy,
  Clock3,
  Activity,
  ShieldCheck,
  Info,
  Smartphone,
  X,
  Link2,
  
  Contact, MessageSquareText, Star,
  FileText } from "lucide-react";
import { getApiBaseUrl, fetchJsonDeduplicated } from "../utils/api";

const API_URL = getApiBaseUrl();
const MAX_MESSAGE_LENGTH = 1024;
const navigation = [
  { label: "Dashboard", path: "/admin/dashboard", icon: LayoutDashboard },
  { label: "Categories", path: "/admin/categories", icon: Tags },
  { label: "Products", path: "/admin/products", icon: Armchair },
  { label: "Banners", path: "/admin/banner", icon: Images },
  { label: "Promo Banners", path: "/admin/promo-banners", icon: Megaphone },
  { label: "WhatsApp Settings", path: "/admin/settings", icon: MessageCircle },
  { label: "Contact Management", path: "/admin/contact-management", icon: Contact },
  { label: "Feedback Master", path: "/admin/feedback", icon: MessageSquareText },
  { label: "Trending Rentals", path: "/admin/trending-rentals", icon: Star },
  { label: "Blog Management", path: "/admin/blogs", icon: FileText }
];
const countryCodes = [
  { code: "+91", name: "India", flag: "🇮🇳" },
  { code: "+1", name: "United States / Canada", flag: "🇺🇸" },
  { code: "+44", name: "United Kingdom", flag: "🇬🇧" },
  { code: "+971", name: "United Arab Emirates", flag: "🇦🇪" },
  { code: "+61", name: "Australia", flag: "🇦🇺" },
];
interface WhatsAppSettingsData {
  whatsappNumber?: string;
  whatsappMessage?: string;
}
type RentalDuration = "12M" | "6M" | "3M";
interface ProductPreview {
  id: string;
  name: string;
  price?: number | string | null;
  rent12M?: number | null;
  deposit12M?: number | null;
  rent6M?: number | null;
  deposit6M?: number | null;
  rent3M?: number | null;
  deposit3M?: number | null;
  isActive?: boolean;
  category?: { name?: string } | null;
}
type Notice = { type: "success" | "error"; message: string };
function digitsOnly(value: string) {
  return value.replace(/\D/g, "");
}
function normalizeSavedNumber(value: string) {
  const digits = digitsOnly(value);
  const matchedCode = [...countryCodes]
    .sort((a, b) => b.code.length - a.code.length)
    .find((item) => {
      const codeDigits = item.code.replace("+", "");
      return digits.startsWith(codeDigits) && digits.length >= codeDigits.length + 10;
    });
  if (matchedCode) {
    return {
      countryCode: matchedCode.code,
      localNumber: digits.slice(matchedCode.code.length - 1),
    };
  }
  return { countryCode: "+91", localNumber: digits };
}
function formatPrice(value: number | string | null | undefined) {
  const amount = Number(value);
  if (value == null || value === "" || !Number.isFinite(amount)) return "Price on request";
  return `₹${amount.toLocaleString("en-IN")}/mo`;
}
function getErrorMessage(data: unknown, fallback: string) {
  if (data && typeof data === "object" && "message" in data) {
    const message = (data as { message?: unknown }).message;
    if (Array.isArray(message)) return message.join(", ");
    if (typeof message === "string" && message) return message;
  }
  return fallback;
}
function StatCard({
  title,
  value,
  detail,
  icon,
  tone,
}: {
  title: string;
  value: string;
  detail: string;
  icon: ReactNode;
  tone: string;
}) {
  return (
    <article className="min-w-0 rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
      <div className="flex items-start justify-between gap-3">
        <p className="text-xs font-semibold text-slate-500 sm:text-sm">{title}</p>
        <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${tone}`}>{icon}</span>
      </div>
      <p className="mt-3 break-words text-xl font-extrabold tracking-tight text-[#0F2942] sm:text-2xl">{value}</p>
      <p className="mt-1.5 text-[11px] leading-4 text-slate-500 sm:text-xs">{detail}</p>
    </article>
  );
}
function SectionTitle({
  icon,
  title,
  subtitle,
}: {
  icon: ReactNode;
  title: string;
  subtitle: string;
}) {
  return (
    <div className="flex items-start gap-3 border-b border-slate-100 px-5 py-4 sm:px-6">
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#E4F5F4] text-[#087D82]">{icon}</span>
      <div className="min-w-0">
        <h2 className="text-sm font-bold text-[#0F2942] sm:text-base">{title}</h2>
        <p className="mt-1 text-xs leading-5 text-slate-500">{subtitle}</p>
      </div>
    </div>
  );
}
function AdminAvatar() {
  return (
    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-cyan-50 text-teal-700">
      <span className="text-[10px] font-extrabold">SA</span>
    </div>
  );
}
export default function WhatsAppSettings() {
  const navigate = useNavigate();
  const messageRef = useRef<HTMLTextAreaElement>(null);
  const [countryCode, setCountryCode] = useState("+91");
  const [localNumber, setLocalNumber] = useState("");
  const [whatsappMessage, setWhatsappMessage] = useState("");
  const [products, setProducts] = useState<ProductPreview[]>([]);
  const [selectedProductId, setSelectedProductId] = useState("");
  const [previewDuration, setPreviewDuration] = useState<RentalDuration>("12M");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
 
  const [notice, setNotice] = useState<Notice | null>(null);
  const savedNumber = `${countryCode.replace("+", "")}${digitsOnly(localNumber)}`;
  const numberIsValid = savedNumber.length >= 10 && savedNumber.length <= 15;
  const messageIsValid = Boolean(whatsappMessage.trim());
  const linkIsReady = numberIsValid && messageIsValid;
  const selectedProduct = useMemo(
    () => products.find((product) => product.id === selectedProductId) ?? products[0] ?? null,
    [products, selectedProductId],
  );
  const previewPlan = useMemo(() => {
    if (!selectedProduct) {
      return { label: "12 Months", rent: null as number | null, deposit: null as number | null };
    }
    const plans: Record<RentalDuration, { label: string; rent: number | null; deposit: number | null }> = {
      "12M": { label: "12 Months", rent: selectedProduct.rent12M ?? null, deposit: selectedProduct.deposit12M ?? null },
      "6M": { label: "6 Months", rent: selectedProduct.rent6M ?? null, deposit: selectedProduct.deposit6M ?? null },
      "3M": { label: "3 Months", rent: selectedProduct.rent3M ?? null, deposit: selectedProduct.deposit3M ?? null },
    };
    return plans[previewDuration];
  }, [selectedProduct, previewDuration]);
  const previewMessage = useMemo(() => {
    const amount = (value: number | string | null | undefined) => {
      const number = Number(value);
      return value == null || value === "" || !Number.isFinite(number)
        ? "Not specified"
        : `₹${number.toLocaleString("en-IN")}`;
    };
    const replacements: Record<string, string> = {
      productname: selectedProduct?.name ?? "Example product",
      productid: selectedProduct?.id ?? "example-product-id",
      categoryname: selectedProduct?.category?.name ?? "Not specified",
      rentalduration: previewPlan.label,
      monthlyrent: amount(previewPlan.rent),
      refundabledeposit: amount(previewPlan.deposit),
    };
    return whatsappMessage.replace(
      /\{(productName|productId|categoryName|rentalDuration|monthlyRent|refundableDeposit)\}/gi,
      (placeholder, key: string) => replacements[key.toLowerCase()] ?? placeholder,
    );
  }, [whatsappMessage, selectedProduct, previewPlan]);
  const previewUrl = useMemo(() => {
    if (!linkIsReady) return "";
    return `https://wa.me/${savedNumber}?text=${encodeURIComponent(previewMessage)}`;
  }, [linkIsReady, savedNumber, previewMessage]);
  const showNotice = (type: Notice["type"], message: string) => setNotice({ type, message });
  const getHeaders = (json = false): HeadersInit => {
    const token = localStorage.getItem("token");
    return {
      ...(json ? { "Content-Type": "application/json" } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };
  };
  const fetchSettings = useCallback(async () => {
    if (!API_URL) {
      showNotice("error", "VITE_API_URL is not configured. Check the frontend environment file.");
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      setNotice(null);
      const data = await fetchJsonDeduplicated<WhatsAppSettingsData>(
        `${API_URL}/settings/whatsapp`,
        { headers: getHeaders() },
      );
      const numberParts = normalizeSavedNumber(data.whatsappNumber ?? "");
      setCountryCode(numberParts.countryCode);
      setLocalNumber(numberParts.localNumber);
      // An empty message is intentional: the admin writes the template.
      setWhatsappMessage(
        typeof data.whatsappMessage === "string" ? data.whatsappMessage : "",
      );
    } catch (error) {
      showNotice("error", error instanceof Error ? error.message : "Unable to load WhatsApp settings.");
    } finally {
      setLoading(false);
    }
  }, []);
  useEffect(() => {
    void fetchSettings();
    if (!API_URL) return;
    const controller = new AbortController();
    fetchJsonDeduplicated<ProductPreview[]>(
      `${API_URL}/products`,
      { signal: controller.signal },
    )
      .then((data) => {
        const activeProducts = Array.isArray(data) ? data.filter((item) => item.isActive !== false) : [];
        setProducts(activeProducts);
        if (activeProducts.length) setSelectedProductId(activeProducts[0].id);
      })
      .catch((error: unknown) => {
        if (error instanceof Error && error.name !== "AbortError") {
          console.info("Product preview unavailable; using the sample product.");
        }
      });
    return () => controller.abort();
  }, [fetchSettings]);
  const handleSave = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setNotice(null);
    const digits = savedNumber;
    const message = whatsappMessage.trim();
    if (digits.length < 10 || digits.length > 15) {
      showNotice("error", "Enter a valid WhatsApp number with country code. Check the country code and mobile number.");
      return;
    }
    if (!message) {
      showNotice("error", "Please enter a customer message template.");
      return;
    }
    if (message.length > MAX_MESSAGE_LENGTH) {
      showNotice("error", `Message must be ${MAX_MESSAGE_LENGTH} characters or fewer.`);
      return;
    }
    try {
      setSaving(true);
      const response = await fetch(`${API_URL}/settings/whatsapp`, {
        method: "PATCH",
        headers: getHeaders(true),
        body: JSON.stringify({ whatsappNumber: digits, whatsappMessage: message }),
      });
      const data = (await response.json().catch(() => ({}))) as WhatsAppSettingsData & { message?: string | string[] };
      if (!response.ok) throw new Error(getErrorMessage(data, "Failed to save WhatsApp settings."));
      const saved = digitsOnly(data.whatsappNumber ?? digits);
      const numberParts = normalizeSavedNumber(saved);
      setCountryCode(numberParts.countryCode);
      setLocalNumber(numberParts.localNumber);
      setWhatsappMessage(
        typeof data.whatsappMessage === "string" ? data.whatsappMessage : message,
      );
      showNotice("success", "WhatsApp number and customer message saved successfully.");
    } catch (error) {
      showNotice("error", error instanceof Error ? error.message : "Unable to save WhatsApp settings.");
    } finally {
      setSaving(false);
    }
  };
  const testRedirect = () => {
    if (!previewUrl) {
      showNotice("error", "Add a valid WhatsApp number and message before testing the redirect.");
      return;
    }
    window.open(previewUrl, "_blank", "noopener,noreferrer");
    showNotice("success", "WhatsApp click-to-chat link opened. This confirms the redirect link, not message delivery.");
  };
  const copyLink = async () => {
    if (!previewUrl) {
      showNotice("error", "A valid number and message are required to create the deep link.");
      return;
    }
    try {
      await navigator.clipboard.writeText(previewUrl);
      showNotice("success", "WhatsApp deep link copied to clipboard.");
    } catch {
      showNotice("error", "Clipboard access is unavailable in this browser. Use Test WhatsApp Redirect instead.");
    }
  };
  const insertPlaceholder = (placeholder: string) => {
    const textarea = messageRef.current;
    const start = textarea?.selectionStart ?? whatsappMessage.length;
    const end = textarea?.selectionEnd ?? whatsappMessage.length;
    const next = `${whatsappMessage.slice(0, start)}${placeholder}${whatsappMessage.slice(end)}`;
    setWhatsappMessage(next);
    requestAnimationFrame(() => {
      textarea?.focus();
      const cursor = start + placeholder.length;
      textarea?.setSelectionRange(cursor, cursor);
    });
  };
  const resetMessage = () => {
    setWhatsappMessage("");
    showNotice("success", "Message cleared. Enter your template and save settings.");
  };
  const logout = () => {
    localStorage.removeItem("token");
    navigate("/admin");
  };
  const storefrontReady = linkIsReady;
  return (
    <div className="min-h-screen bg-[#F6F8FD] text-[#142B43]">
      {sidebarOpen && (
        <button
          type="button"
          aria-label="Close navigation"
          onClick={() => setSidebarOpen(false)}
          className="fixed inset-0 z-40 bg-[#0F2942]/40 lg:hidden"
        />
      )}
      {/* Shared admin sidebar — kept consistent with Promo Banners and Categories. */}
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
              onError={(event) => {
                event.currentTarget.style.display = "none";
              }}
            />
            <div>
              <h1 className="text-xl font-extrabold tracking-tight text-[#0F2942]">LIVEAZY</h1>
              <p className="mt-0.5 text-xs text-slate-500">Rental Commerce Hub</p>
            </div>
            <button
              type="button"
              aria-label="Close sidebar"
              onClick={() => setSidebarOpen(false)}
              className="ml-auto rounded-lg p-2 hover:bg-slate-200 lg:hidden"
            >
              <X size={18} />
            </button>
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
      <div className="min-h-screen lg:pl-[260px]">
        <header className="sticky top-0 z-30 flex min-h-[72px] items-center justify-between gap-3 border-b border-slate-200 bg-white/95 px-4 backdrop-blur-md sm:px-6 lg:px-8">
          <div className="flex min-w-0 items-center gap-3">
            <button
              type="button"
              aria-label="Open navigation"
              onClick={() => setSidebarOpen(true)}
              className="rounded-lg border border-slate-200 p-2 hover:bg-slate-50 lg:hidden"
            >
              <Menu size={20} />
            </button>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-slate-400">Admin / Store Settings</p>
              <p className="mt-1 text-sm font-bold text-[#0F2942]">WhatsApp Settings</p>
            </div>
          </div>
          <div className="hidden items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-2 sm:flex">
            <AdminAvatar />
            <div>
              <p className="text-xs font-bold text-[#0F2942]">Super Admin</p>
              <p className="text-[10px] text-slate-500">admin@liveazy.in</p>
            </div>
          </div>
        </header>
        <main className="mx-auto max-w-[1600px] space-y-6 px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
          <section className="flex flex-col justify-between gap-4 xl:flex-row xl:items-end">
            <div>
              <div className="mb-2 inline-flex items-center gap-2 text-[10px] font-extrabold uppercase tracking-[0.2em] text-[#008A90]"><span className="h-2 w-2 rounded-full bg-[#008A90]" /> LIVEAZY ADMIN</div>
              <h2 className="text-2xl font-extrabold tracking-tight text-[#0F2942] sm:text-3xl">WhatsApp Settings</h2>
              <p className="mt-2 max-w-3xl text-xs leading-5 text-slate-500 sm:text-sm sm:leading-6">Configure the WhatsApp Business contact, customer message template, and storefront click-to-chat redirect.</p>
            </div>
            <div className="flex flex-col gap-2 sm:flex-row">
              <button type="button" onClick={testRedirect} disabled={!linkIsReady} className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-xs font-bold text-[#0F2942] shadow-sm transition hover:border-[#008A90] hover:text-[#008A90] disabled:cursor-not-allowed disabled:opacity-50"><MessageCircle size={15} /> Test WhatsApp Redirect</button>
              <button type="submit" form="whatsapp-settings-form" disabled={saving || loading} className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#0F2942] px-4 py-2.5 text-xs font-bold text-white shadow-sm transition hover:bg-[#173A5B] disabled:cursor-not-allowed disabled:opacity-50">{saving ? <RefreshCw size={15} className="animate-spin" /> : <Save size={15} />}{saving ? "Saving..." : "Save Changes"}</button>
            </div>
          </section>
          {notice && <div role={notice.type === "error" ? "alert" : "status"} className={`flex items-start gap-3 rounded-xl border px-4 py-3 text-xs ${notice.type === "error" ? "border-red-200 bg-red-50 text-red-700" : "border-emerald-200 bg-emerald-50 text-emerald-800"}`}>
            {notice.type === "error" ? <AlertCircle size={17} className="mt-0.5 shrink-0" /> : <CheckCircle2 size={17} className="mt-0.5 shrink-0" />}
            <span className="flex-1">{notice.message}</span>
            <button type="button" onClick={() => setNotice(null)} aria-label="Dismiss notice"><X size={15} /></button>
          </div>}
          <section className="grid grid-cols-1 gap-3 sm:grid-cols-2 2xl:grid-cols-4">
            <StatCard title="Gateway status" value={loading ? "Checking…" : linkIsReady ? "Click-to-chat ready" : "Setup required"} detail={linkIsReady ? "A WhatsApp redirect can be generated" : "Enter a valid number and message"} icon={<Activity size={18} />} tone={linkIsReady ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"} />
            <StatCard title="Message delivery rate" value="Not tracked" detail="wa.me links don't return delivery receipts" icon={<CheckCircle2 size={18} />} tone="bg-blue-50 text-blue-700" />
            <StatCard title="Average first response" value="Not tracked" detail="Requires incoming-message events or a webhook" icon={<Clock3 size={18} />} tone="bg-violet-50 text-violet-700" />
            <StatCard title="Storefront redirect" value={storefrontReady ? "Configured" : "Needs setup"} detail="Customer product enquiries use the saved settings" icon={<Smartphone size={18} />} tone={storefrontReady ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-600"} />
          </section>
          <div className="grid grid-cols-1 items-start gap-5 2xl:grid-cols-[minmax(0,1.08fr)_minmax(360px,0.92fr)]">
            <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
              <SectionTitle icon={<Settings size={18} />} title="Gateway & Template Configuration" subtitle="Set the business number and pre-filled customer enquiry message." />
              {loading ? <div className="flex min-h-[360px] items-center justify-center gap-3 text-sm text-slate-500"><RefreshCw size={18} className="animate-spin text-[#008A90]" /> Loading WhatsApp settings…</div> : (
                <form id="whatsapp-settings-form" onSubmit={handleSave} className="space-y-5 p-5 sm:p-6">
                  <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3.5 py-3">
                    <div className="flex items-center gap-2.5"><span className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700"><ShieldCheck size={17} /></span><div><p className="text-xs font-bold text-[#0F2942]">WhatsApp click-to-chat</p><p className="mt-0.5 text-[10px] text-slate-500">Uses the official wa.me redirect</p></div></div>
                    <span className={`rounded-full px-2.5 py-1 text-[10px] font-bold ${linkIsReady ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-800"}`}>{linkIsReady ? "READY" : "NEEDS SETUP"}</span>
                  </div>
                  <div>
                    <div className="mb-2 flex items-center justify-between gap-3"><label htmlFor="whatsapp-number" className="text-xs font-bold text-[#0F2942]">Official Business Phone Number</label><span className="inline-flex items-center gap-1 text-[10px] font-semibold text-slate-400"><Info size={12} /> Country code required</span></div>
                    <div className="grid grid-cols-[150px_minmax(0,1fr)] overflow-hidden rounded-lg border border-slate-200 focus-within:border-[#008A90] focus-within:ring-2 focus-within:ring-[#008A90]/10 sm:grid-cols-[180px_minmax(0,1fr)]">
                      <label className="flex items-center gap-2 border-r border-slate-200 bg-slate-50 px-3"><span className="text-sm">{countryCodes.find((item) => item.code === countryCode)?.flag ?? "🌐"}</span><select aria-label="Country calling code" value={countryCode} onChange={(event) => setCountryCode(event.target.value)} className="w-full min-w-0 bg-transparent py-3 text-xs font-semibold outline-none"><option value="+91">+91 India</option><option value="+1">+1 US/Canada</option><option value="+44">+44 UK</option><option value="+971">+971 UAE</option><option value="+61">+61 Australia</option></select></label>
                      <input id="whatsapp-number" type="tel" inputMode="numeric" autoComplete="tel-national" value={localNumber} onChange={(event) => setLocalNumber(event.target.value.replace(/[^\d\s()-]/g, ""))} placeholder="94238 38109" required className="min-w-0 px-3.5 py-3 text-sm outline-none" />
                    </div>
                    <p className="mt-1.5 text-[10px] leading-4 text-slate-400">Saved as digits with country code. For India, enter the 10-digit mobile number after +91.</p>
                    {localNumber && !numberIsValid && <p className="mt-1 text-[10px] text-amber-700">Check that the complete number includes 10–15 digits including the country code.</p>}
                  </div>
                  <div>
                    <div className="mb-2 flex items-center justify-between gap-3"><label htmlFor="whatsapp-message" className="text-xs font-bold text-[#0F2942]">Pre-filled Customer Message Template</label><span className={`text-[10px] font-semibold ${whatsappMessage.length > MAX_MESSAGE_LENGTH ? "text-red-600" : "text-slate-400"}`}>{whatsappMessage.length}/{MAX_MESSAGE_LENGTH} characters</span></div>
                    <textarea ref={messageRef} id="whatsapp-message" value={whatsappMessage} maxLength={MAX_MESSAGE_LENGTH} onChange={(event) => setWhatsappMessage(event.target.value)} rows={5} required className="w-full resize-y rounded-lg border border-slate-200 px-3.5 py-3 text-xs leading-5 outline-none transition focus:border-[#008A90] focus:ring-2 focus:ring-[#008A90]/10" placeholder="Example: Hi LIVEAZY! I am interested in renting the {productName}. Could you please share tenure options, security deposit, and delivery details?" />
                    <div className="mt-3 flex flex-wrap items-center gap-2">
                      <span className="mr-1 text-[10px] font-bold text-slate-500">Insert placeholder:</span>
                      {[
                        "{productName}",
                        "{productId}",
                        "{categoryName}",
                        "{rentalDuration}",
                        "{monthlyRent}",
                        "{refundableDeposit}",
                      ].map((placeholder) => (
                        <button
                          key={placeholder}
                          type="button"
                          onClick={() => insertPlaceholder(placeholder)}
                          className="rounded-md border border-[#CFE8E6] bg-[#F0FAF9] px-2.5 py-1.5 text-[10px] font-bold text-[#087D82] transition hover:bg-[#DFF4F2]"
                        >
                          + {placeholder}
                        </button>
                      ))}
                    </div>
                    <p className="mt-3 text-[10px] leading-4 text-slate-500">Write your own message. The placeholders below are optional and are replaced with the selected product and rental-plan details. Nothing is automatically appended to your message.</p>
                  </div>
                  <div className="rounded-lg border border-[#D7E8FA] bg-[#F1F7FF] p-4">
                    <div className="flex items-start gap-2.5"><Info size={16} className="mt-0.5 shrink-0 text-blue-700" /><div><p className="text-xs font-bold text-[#0F2942]">Redirect compatibility</p><p className="mt-1 text-[10px] leading-4 text-slate-600">This setup opens WhatsApp using a pre-filled message. It does not connect to Meta Cloud API, receive delivery receipts, or measure customer replies.</p></div></div>
                  </div>
                  <div className="flex flex-col-reverse gap-2 border-t border-slate-100 pt-4 sm:flex-row sm:items-center sm:justify-between">
                    <button type="button" onClick={resetMessage} disabled={saving} className="rounded-lg border border-slate-200 bg-white px-3.5 py-2.5 text-xs font-semibold text-slate-600 transition hover:bg-slate-50 disabled:opacity-50">Clear message</button>
                    <button type="submit" disabled={saving} className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#0F2942] px-4 py-2.5 text-xs font-bold text-white transition hover:bg-[#173A5B] disabled:opacity-50">{saving ? <RefreshCw size={15} className="animate-spin" /> : <Save size={15} />}{saving ? "Saving settings…" : "Save settings"}</button>
                  </div>
                </form>
              )}
            </section>
            <div className="space-y-5">
              <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
                <div className="flex items-start justify-between gap-3 border-b border-slate-100 px-5 py-4 sm:px-6">
                  <div><div className="flex items-center gap-2"><h2 className="text-sm font-bold text-[#0F2942]">Storefront Redirect Preview</h2><span className="rounded-full bg-cyan-50 px-2 py-1 text-[9px] font-bold text-[#087D82]">LIVE PREVIEW</span></div><p className="mt-1 text-xs leading-5 text-slate-500">Preview the customer message and test the generated link.</p></div>
                  <span className="shrink-0 rounded-full bg-emerald-50 px-2 py-1 text-[9px] font-bold text-emerald-700">Click-to-chat</span>
                </div>
                <div className="p-4 sm:p-5">
                  <label htmlFor="preview-product" className="mb-1.5 block text-[10px] font-bold uppercase tracking-wide text-slate-500">Sample product</label>
                  {products.length > 0 ? <select id="preview-product" value={selectedProduct?.id ?? ""} onChange={(event) => setSelectedProductId(event.target.value)} className="mb-3 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-700 outline-none focus:border-[#008A90]"><option value="">Select a product</option>{products.map((product) => <option key={product.id} value={product.id}>{product.name}</option>)}</select> : <p className="mb-3 rounded-lg bg-slate-50 px-3 py-2 text-[10px] text-slate-500">Using sample product for preview; the product list could not be loaded.</p>}
                  {selectedProduct && <div className="mb-3 flex items-center justify-between gap-3 rounded-lg border border-slate-100 bg-slate-50 px-3 py-2.5"><div className="min-w-0"><p className="truncate text-xs font-bold text-[#0F2942]">{selectedProduct.name}</p><p className="mt-0.5 text-[10px] text-slate-500">{selectedProduct.category?.name ?? "LIVEAZY product"}</p></div><span className="shrink-0 rounded-md bg-white px-2 py-1 text-[10px] font-bold text-[#0F2942]">{formatPrice(selectedProduct.price)}</span></div>}
                  {selectedProduct && (
                    <div className="mb-3">
                      <label htmlFor="preview-duration" className="mb-1.5 block text-[10px] font-bold uppercase tracking-wide text-slate-500">Preview rental duration</label>
                      <select id="preview-duration" value={previewDuration} onChange={(event) => setPreviewDuration(event.target.value as RentalDuration)} className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-700 outline-none focus:border-[#008A90]">
                        <option value="12M">12 Months</option>
                        <option value="6M">6 Months</option>
                        <option value="3M">3 Months</option>
                      </select>
                    </div>
                  )}
                  <div className="mx-auto max-w-[430px] overflow-hidden rounded-xl border border-slate-200 bg-[#E7E2D9] shadow-sm">
                    <div className="flex items-center gap-2.5 bg-[#075E54] px-3.5 py-3 text-white"><div className="flex h-9 w-9 items-center justify-center rounded-full bg-white/15"><MessageCircle size={19} /></div><div className="min-w-0 flex-1"><p className="truncate text-xs font-bold">LIVEAZY Rentals</p><p className="mt-0.5 text-[9px] text-white/75">Business chat preview · not a live chat</p></div><span className="rounded-full bg-white/15 px-2 py-1 text-[9px] font-semibold">WhatsApp</span></div>
                    <div className="min-h-[230px] space-y-3 bg-[radial-gradient(#D4CEC4_0.65px,transparent_0.65px)] bg-[size:12px_12px] p-3.5 sm:p-4">
                      <div className="mx-auto w-fit rounded-md bg-[#FFF4C7] px-2.5 py-1 text-[9px] text-slate-600 shadow-sm">TODAY</div>
                      <div className="ml-auto max-w-[96%] rounded-xl rounded-tr-sm bg-[#D9FDD3] p-3 shadow-sm"><p className="whitespace-pre-wrap break-words text-[11px] leading-5 text-[#24352E]">{previewMessage || "Your customer message will appear here."}</p><p className="mt-1.5 text-right text-[9px] text-slate-500">Preview ✓✓</p></div>
                      <div className="max-w-[94%] rounded-xl rounded-tl-sm bg-white p-3 shadow-sm"><p className="text-[10px] font-bold text-[#0F2942]">LIVEAZY Support</p><p className="mt-1 text-[10px] leading-4 text-slate-600">Thanks for contacting LIVEAZY! Our team will share availability and rental details.</p><p className="mt-1 text-right text-[9px] text-slate-400">Sample only</p></div>
                    </div>
                    <div className="flex items-center gap-2 bg-white p-3"><div className="flex-1 rounded-full bg-slate-100 px-3.5 py-2.5 text-[10px] text-slate-400">Message</div><span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#008A90] text-white"><Send size={14} /></span></div>
                  </div>
                  <div className="mt-4 rounded-lg border border-slate-200 p-3.5"><div className="flex items-center justify-between gap-3"><div className="flex items-center gap-2 text-[10px] font-bold text-slate-500"><Link2 size={14} /> GENERATED DEEP LINK</div><button type="button" onClick={() => void copyLink()} disabled={!previewUrl} className="inline-flex items-center gap-1.5 text-[10px] font-bold text-[#087D82] hover:underline disabled:cursor-not-allowed disabled:opacity-40"><Copy size={12} /> Copy URL</button></div><p className="mt-2 max-h-20 overflow-auto break-all rounded-md bg-slate-50 p-2.5 font-mono text-[9px] leading-4 text-slate-600">{previewUrl || "Enter a valid WhatsApp phone number and message to generate the link."}</p><button type="button" onClick={testRedirect} disabled={!previewUrl} className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-[#00B95C] px-4 py-3 text-xs font-bold text-white transition hover:bg-[#009E4F] disabled:cursor-not-allowed disabled:opacity-50"><MessageCircle size={16} /> Test WhatsApp Redirect <ExternalLink size={14} /></button><p className="mt-2 text-[9px] leading-4 text-slate-400">Testing opens WhatsApp with a draft message. It will not send the message automatically.</p></div>
                </div>
              </section>
              <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
                
              </section>
            </div>
          </div>
          <footer className="flex flex-col gap-2 border-t border-slate-200 py-4 text-[10px] text-slate-400 sm:flex-row sm:items-center sm:justify-between"><span>LIVEAZY Admin Console</span><span>WhatsApp link settings are saved through the existing backend API.</span></footer>
        </main>
      </div>
    </div>
  );
}
