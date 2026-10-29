import {
  useEffect,
  useMemo,
  useState,
  type FormEvent,
  type ReactNode,
} from "react";
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
  Settings,
  ExternalLink,
  ShieldCheck,
  Info,
  X,
  Contact,
  MessageSquareText,
  Star,
  FileText,
  Share2,
  Globe,
} from "lucide-react";
import { getApiBaseUrl, fetchJsonDeduplicated } from "../utils/api";

const API_URL = getApiBaseUrl();

const navigation = [
  { label: "Dashboard", path: "/admin/dashboard", icon: LayoutDashboard },
  { label: "Categories", path: "/admin/categories", icon: Tags },
  { label: "Products", path: "/admin/products", icon: Armchair },
  { label: "Banners", path: "/admin/banner", icon: Images },
  { label: "Promo Banners", path: "/admin/promo-banners", icon: Megaphone },
  { label: "WhatsApp Settings", path: "/admin/settings", icon: MessageCircle },
  { label: "Social Media Settings", path: "/admin/social-media", icon: Share2 },
  { label: "Contact Management", path: "/admin/contact-management", icon: Contact },
  { label: "Feedback Master", path: "/admin/feedback", icon: MessageSquareText },
  { label: "Trending Rentals", path: "/admin/trending-rentals", icon: Star },
  { label: "Blog Management", path: "/admin/blogs", icon: FileText },
];

const countryCodes = [
  { code: "+91", name: "India", flag: "🇮🇳" },
  { code: "+1", name: "United States / Canada", flag: "🇺🇸" },
  { code: "+44", name: "United Kingdom", flag: "🇬🇧" },
  { code: "+971", name: "United Arab Emirates", flag: "🇦🇪" },
  { code: "+61", name: "Australia", flag: "🇦🇺" },
];

interface SocialSettingsData {
  facebookUrl?: string;
  instagramUrl?: string;
  youtubeUrl?: string;
  whatsappNumber?: string;
}

type Notice = { type: "success" | "error"; message: string };

function digitsOnly(value: string) {
  return value.replace(/\D/g, "");
}

function normalizeSavedNumber(value: string) {
  const digits = digitsOnly(value);
  if (!digits) {
    return { countryCode: "+91", localNumber: "" };
  }
  const matchedCode = [...countryCodes]
    .sort((a, b) => b.code.length - a.code.length)
    .find((item) => {
      const codeDigits = item.code.replace("+", "");
      return digits.startsWith(codeDigits) && digits.length >= codeDigits.length + 10;
    });
  if (matchedCode) {
    const codeDigits = matchedCode.code.replace("+", "");
    return {
      countryCode: matchedCode.code,
      localNumber: digits.slice(codeDigits.length),
    };
  }
  return { countryCode: "+91", localNumber: digits };
}

function getErrorMessage(data: unknown, fallback: string): string {
  if (data && typeof data === "object" && "message" in data) {
    const message = (data as { message?: unknown }).message;
    if (Array.isArray(message)) return message.join(", ");
    if (typeof message === "string" && message) return message;
  }
  return fallback;
}

function isValidHttpUrl(input: string): boolean {
  const trimmed = input.trim();
  if (!trimmed) return true; // empty is allowed
  const candidate =
    trimmed.startsWith("http://") || trimmed.startsWith("https://")
      ? trimmed
      : `https://${trimmed}`;
  try {
    const parsed = new URL(candidate);
    return (
      (parsed.protocol === "http:" || parsed.protocol === "https:") &&
      Boolean(parsed.hostname && parsed.hostname.includes("."))
    );
  } catch {
    return false;
  }
}

function normalizeUrlForOpen(input: string): string {
  const trimmed = input.trim();
  if (!trimmed) return "";
  return trimmed.startsWith("http://") || trimmed.startsWith("https://")
    ? trimmed
    : `https://${trimmed}`;
}

function FacebookIconSvg({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg className={className} fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path
        fillRule="evenodd"
        d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z"
        clipRule="evenodd"
      />
    </svg>
  );
}

function InstagramIconSvg({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg className={className} fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path
        fillRule="evenodd"
        d="M12.315 2c2.43 0 2.784.013 3.808.06 1.064.049 1.791.218 2.427.465a4.902 4.902 0 011.772 1.153 4.902 4.902 0 011.153 1.772c.247.636.416 1.363.465 2.427.048 1.067.06 1.407.06 4.123v.08c0 2.643-.012 2.987-.06 4.043-.049 1.064-.218 1.791-.465 2.427a4.902 4.902 0 01-1.153 1.772 4.902 4.902 0 01-1.772 1.153c-.636.247-1.363.416-2.427.465-1.067.048-1.407.06-4.123.06h-.08c-2.643 0-2.987-.012-4.043-.06-1.064-.049-1.791-.218-2.427-.465a4.902 4.902 0 01-1.772-1.153 4.902 4.902 0 01-1.153-1.772c-.247-.636-.416-1.363-.465-2.427-.047-1.024-.06-1.379-.06-3.808v-.63c0-2.43.013-2.784.06-3.808.049-1.064.218-1.791.465-2.427a4.902 4.902 0 011.153-1.772A4.902 4.902 0 015.45 2.525c.636-.247 1.363-.416 2.427-.465C8.901 2.013 9.256 2 11.685 2h.63zm-.081 1.802h-.468c-2.456 0-2.784.011-3.807.058-.975.045-1.504.207-1.857.344-.467.182-.8.398-1.15.748-.35.35-.566.683-.748 1.15-.137.353-.3.882-.344 1.857-.047 1.023-.058 1.351-.058 3.807v.468c0 2.456.011 2.784.058 3.807.045.975.207 1.504.344 1.857.182.466.399.8.748 1.15.35.35.683.566 1.15.748.353.137.882.3 1.857.344 1.054.048 1.37.058 4.041.058h.08c2.597 0 2.917-.01 3.96-.058.976-.045 1.505-.207 1.858-.344.466-.182.8-.398 1.15-.748.35-.35.566-.683.748-1.15.137-.353.3-.882.344-1.857.048-1.055.058-1.37.058-4.041v-.08c0-2.597-.01-2.917-.058-3.96-.045-.976-.207-1.505-.344-1.858a3.097 3.097 0 00-.748-1.15 3.098 3.098 0 00-1.15-.748c-.353-.137-.882-.3-1.857-.344-1.023-.047-1.351-.058-3.807-.058zM12 6.865a5.135 5.135 0 110 10.27 5.135 5.135 0 010-10.27zm0 1.802a3.333 3.333 0 100 6.666 3.333 3.333 0 000-6.666zm5.338-3.205a1.2 1.2 0 110 2.4 1.2 1.2 0 010-2.4z"
        clipRule="evenodd"
      />
    </svg>
  );
}

function YouTubeIconSvg({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg className={className} fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M23.5 6.2a3 3 0 0 0-2.1-2.1C19.5 3.6 12 3.6 12 3.6s-7.5 0-9.4.5A3 3 0 0 0 .5 6.2 31 31 0 0 0 0 12a31 31 0 0 0 .5 5.8 3 3 0 0 0 2.1 2.1c1.9.5 9.4.5 9.4.5s7.5 0 9.4-.5a3 3 0 0 0 2.1-2.1A31 31 0 0 0 24 12a31 31 0 0 0-.5-5.8ZM9.6 15.6V8.4l6.3 3.6-6.3 3.6Z" />
    </svg>
  );
}

function WhatsAppIconSvg({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg className={className} fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path
        fillRule="evenodd"
        d="M12 2C6.477 2 2 6.477 2 12c0 1.892.525 3.663 1.438 5.18L2 22l4.985-1.408A9.957 9.957 0 0012 22c5.523 0 10-4.477 10-10S17.523 2 12 2zm5.42 14.15c-.23.65-1.15 1.24-1.6 1.28-.42.04-.96.06-2.78-.69-2.33-.96-3.83-3.32-3.95-3.48-.12-.16-.95-1.26-.95-2.4 0-1.14.6-1.7.81-1.93.22-.23.48-.29.64-.29.16 0 .32 0 .46.01.15.01.35-.06.55.42.2.48.69 1.68.75 1.8.06.12.1.26.02.42-.08.16-.12.26-.24.4-.12.14-.25.31-.36.42-.12.12-.24.25-.1.5.14.25.62 1.02 1.33 1.65.91.81 1.68 1.06 1.93 1.18.25.12.4.1.55-.07.15-.17.64-.75.81-1.01.17-.26.34-.22.57-.13.23.09 1.46.69 1.71.81.25.12.42.18.48.28.06.1.06.58-.17 1.23z"
        clipRule="evenodd"
      />
    </svg>
  );
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

export default function SocialMediaSettings() {
  const navigate = useNavigate();

  const [facebookUrl, setFacebookUrl] = useState("");
  const [instagramUrl, setInstagramUrl] = useState("");
  const [youtubeUrl, setYoutubeUrl] = useState("");
  const [countryCode, setCountryCode] = useState("+91");
  const [localNumber, setLocalNumber] = useState("");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [notice, setNotice] = useState<Notice | null>(null);

  const savedNumberDigits = digitsOnly(localNumber)
    ? `${countryCode.replace("+", "")}${digitsOnly(localNumber)}`
    : "";

  const whatsappValid =
    !savedNumberDigits || (savedNumberDigits.length >= 10 && savedNumberDigits.length <= 15);
  const facebookValid = isValidHttpUrl(facebookUrl);
  const instagramValid = isValidHttpUrl(instagramUrl);
  const youtubeValid = isValidHttpUrl(youtubeUrl);

  const hasFacebook = Boolean(facebookUrl.trim() && facebookValid);
  const hasInstagram = Boolean(instagramUrl.trim() && instagramValid);
  const hasYouTube = Boolean(youtubeUrl.trim() && youtubeValid);
  const hasWhatsApp = Boolean(savedNumberDigits && whatsappValid);

  const activeIconsCount = [hasFacebook, hasInstagram, hasYouTube, hasWhatsApp].filter(Boolean).length;

  const whatsappLink = useMemo(() => {
    if (!savedNumberDigits || !whatsappValid) return "";
    return `https://wa.me/${savedNumberDigits}`;
  }, [savedNumberDigits, whatsappValid]);

  const showNotice = (type: Notice["type"], message: string) => setNotice({ type, message });

  const getHeaders = (json = false): HeadersInit => {
    const token = localStorage.getItem("token");
    return {
      ...(json ? { "Content-Type": "application/json" } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };
  };

  useEffect(() => {
    let cancelled = false;

    async function load() {
      if (!API_URL) {
        setNotice({
          type: "error",
          message: "API URL is not configured. Check the frontend environment file.",
        });
        setLoading(false);
        return;
      }

      try {
        const data = await fetchJsonDeduplicated<SocialSettingsData>(
          `${API_URL}/settings/social`,
          { headers: getHeaders() },
        );

        if (!cancelled) {
          setFacebookUrl(data.facebookUrl || "");
          setInstagramUrl(data.instagramUrl || "");
          setYoutubeUrl(data.youtubeUrl || "");

          const parts = normalizeSavedNumber(data.whatsappNumber || "");
          setCountryCode(parts.countryCode);
          setLocalNumber(parts.localNumber);
        }
      } catch (error) {
        console.error("Failed to load social media settings in Admin:", error);
        if (!cancelled) {
          setNotice({
            type: "error",
            message:
              error instanceof Error
                ? error.message
                : "Unable to load social media settings.",
          });
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void load();

    return () => {
      cancelled = true;
    };
  }, []);

  const handleSave = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setNotice(null);

    // URL validations
    if (!facebookValid) {
      showNotice("error", "Please enter a valid URL for Facebook (e.g. https://facebook.com/liveazy) or leave it blank.");
      return;
    }

    if (!instagramValid) {
      showNotice("error", "Please enter a valid URL for Instagram (e.g. https://instagram.com/liveazy) or leave it blank.");
      return;
    }

    if (!youtubeValid) {
      showNotice("error", "Please enter a valid YouTube URL or leave it blank.");
      return;
    }

    if (savedNumberDigits && !whatsappValid) {
      showNotice("error", "Please enter a valid WhatsApp number with 10–15 digits including country code, or clear it.");
      return;
    }

    try {
      setSaving(true);

      const response = await fetch(`${API_URL}/settings/social`, {
        method: "PATCH",
        headers: getHeaders(true),
        body: JSON.stringify({
          facebookUrl: facebookUrl.trim(),
          instagramUrl: instagramUrl.trim(),
          youtubeUrl: youtubeUrl.trim(),
          whatsappNumber: savedNumberDigits,
        }),
      });

      const data = (await response.json().catch(() => ({}))) as SocialSettingsData & {
        message?: string | string[];
      };

      if (!response.ok) {
        if (response.status === 401 || response.status === 403) {
          throw new Error("Admin session expired or access denied. Please log in again.");
        }
        throw new Error(getErrorMessage(data, "Failed to save social media settings."));
      }

      setFacebookUrl(data.facebookUrl ?? facebookUrl.trim());
      setInstagramUrl(data.instagramUrl ?? instagramUrl.trim());
      setYoutubeUrl(data.youtubeUrl ?? youtubeUrl.trim());

      const parts = normalizeSavedNumber(data.whatsappNumber ?? savedNumberDigits);
      setCountryCode(parts.countryCode);
      setLocalNumber(parts.localNumber);

      showNotice("success", "Social media settings and public links saved successfully.");
    } catch (error) {
      console.error("Failed to save social media settings in Admin:", error);
      showNotice("error", error instanceof Error ? error.message : "Unable to save social media settings.");
    } finally {
      setSaving(false);
    }
  };

  const logout = () => {
    localStorage.removeItem("token");
    navigate("/admin");
  };

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

      {/* Shared Admin Sidebar */}
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

      {/* Main Content Area */}
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
              <p className="mt-1 text-sm font-bold text-[#0F2942]">Social Media Settings</p>
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
          {/* Top Heading & Actions */}
          <section className="flex flex-col justify-between gap-4 xl:flex-row xl:items-end">
            <div>
              <div className="mb-2 inline-flex items-center gap-2 text-[10px] font-extrabold uppercase tracking-[0.2em] text-[#008A90]">
                <span className="h-2 w-2 rounded-full bg-[#008A90]" /> LIVEAZY ADMIN
              </div>
              <h2 className="text-2xl font-extrabold tracking-tight text-[#0F2942] sm:text-3xl">
                Social Media Settings
              </h2>
              <p className="mt-2 max-w-3xl text-xs leading-5 text-slate-500 sm:text-sm sm:leading-6">
                Configure your public Facebook URL, Instagram profile URL, and WhatsApp number. Configured social channels appear automatically in the storefront footer.
              </p>
            </div>
            <div className="flex flex-col gap-2 sm:flex-row">
              {whatsappLink && (
                <a
                  href={whatsappLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-xs font-bold text-[#0F2942] shadow-sm transition hover:border-[#008A90] hover:text-[#008A90]"
                >
                  <MessageCircle size={15} /> Test WhatsApp <ExternalLink size={13} />
                </a>
              )}
              <button
                type="submit"
                form="social-settings-form"
                disabled={saving || loading}
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#0F2942] px-5 py-2.5 text-xs font-bold text-white shadow-sm transition hover:bg-[#173A5B] disabled:cursor-not-allowed disabled:opacity-50"
              >
                {saving ? <RefreshCw size={15} className="animate-spin" /> : <Save size={15} />}
                {saving ? "Saving…" : "Save Settings"}
              </button>
            </div>
          </section>

          {/* Alert Notice */}
          {notice && (
            <div
              role={notice.type === "error" ? "alert" : "status"}
              className={`flex items-start gap-3 rounded-xl border px-4 py-3 text-xs ${
                notice.type === "error"
                  ? "border-red-200 bg-red-50 text-red-700"
                  : "border-emerald-200 bg-emerald-50 text-emerald-800"
              }`}
            >
              {notice.type === "error" ? (
                <AlertCircle size={17} className="mt-0.5 shrink-0" />
              ) : (
                <CheckCircle2 size={17} className="mt-0.5 shrink-0" />
              )}
              <span className="flex-1 font-medium">{notice.message}</span>
              <button type="button" onClick={() => setNotice(null)} aria-label="Dismiss notice">
                <X size={15} />
              </button>
            </div>
          )}

          {/* Stat Cards */}
          <section className="grid grid-cols-1 gap-3 sm:grid-cols-2 2xl:grid-cols-4">
            <StatCard
              title="Facebook Link"
              value={hasFacebook ? "Configured" : "Hidden"}
              detail={hasFacebook ? "Active icon in footer" : "Leave blank to hide icon"}
              icon={<FacebookIconSvg className="h-4 w-4" />}
              tone={hasFacebook ? "bg-blue-50 text-blue-700" : "bg-slate-100 text-slate-500"}
            />
            <StatCard
              title="Instagram Link"
              value={hasInstagram ? "Configured" : "Hidden"}
              detail={hasInstagram ? "Active icon in footer" : "Leave blank to hide icon"}
              icon={<InstagramIconSvg className="h-4 w-4" />}
              tone={hasInstagram ? "bg-pink-50 text-pink-700" : "bg-slate-100 text-slate-500"}
            />
            <StatCard
              title="WhatsApp Contact"
              value={hasWhatsApp ? `+${savedNumberDigits}` : "Inactive"}
              detail={hasWhatsApp ? "Official click-to-chat active" : "Add number with country code"}
              icon={<WhatsAppIconSvg className="h-4 w-4" />}
              tone={hasWhatsApp ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"}
            />
            <StatCard
              title="Footer Visibility"
              value={`${activeIconsCount} of 4 active`}
              detail="Updated in real time across the website"
              icon={<Globe size={18} />}
              tone={activeIconsCount > 0 ? "bg-teal-50 text-[#008A90]" : "bg-slate-100 text-slate-600"}
            />
          </section>

          {/* Form and Preview Layout */}
          <div className="grid grid-cols-1 items-start gap-5 2xl:grid-cols-[minmax(0,1.15fr)_minmax(380px,0.85fr)]">
            {/* Form Section */}
            <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
              <SectionTitle
                icon={<Settings size={18} />}
                title="Social Media & Contact Links"
                subtitle="Specify URLs for Facebook, Instagram, and YouTube. Social icons automatically appear in the footer when configured, and remain hidden when left blank."
              />

              {loading ? (
                <div className="flex min-h-[360px] items-center justify-center gap-3 text-sm text-slate-500">
                  <RefreshCw size={18} className="animate-spin text-[#008A90]" /> Loading settings…
                </div>
              ) : (
                <form id="social-settings-form" onSubmit={handleSave} className="space-y-6 p-5 sm:p-6">
                  {/* Notice Box */}
                  <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3.5 py-3">
                    <div className="flex items-center gap-2.5">
                      <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700">
                        <ShieldCheck size={17} />
                      </span>
                      <div>
                        <p className="text-xs font-bold text-[#0F2942]">Storefront Footer Sync</p>
                        <p className="mt-0.5 text-[10px] text-slate-500">
                          Changes persist to SiteSetting and immediately update the public footer
                        </p>
                      </div>
                    </div>
                    <span
                      className={`rounded-full px-2.5 py-1 text-[10px] font-bold ${
                        activeIconsCount > 0 ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-800"
                      }`}
                    >
                      {activeIconsCount > 0 ? `${activeIconsCount} ACTIVE` : "NO ICONS DISPLAYED"}
                    </span>
                  </div>

                  {/* Facebook URL */}
                  <div>
                    <div className="mb-2 flex items-center justify-between gap-3">
                      <label htmlFor="facebook-url" className="flex items-center gap-2 text-xs font-bold text-[#0F2942]">
                        <FacebookIconSvg className="h-3.5 w-3.5 text-blue-600" /> Facebook Page URL
                      </label>
                      <span className="text-[10px] font-semibold text-slate-400">Optional · Blank hides icon</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        id="facebook-url"
                        type="url"
                        value={facebookUrl}
                        onChange={(e) => setFacebookUrl(e.target.value)}
                        placeholder="https://facebook.com/liveazy"
                        className={`w-full rounded-lg border px-3.5 py-2.5 text-xs outline-none transition focus:ring-2 focus:ring-[#008A90]/15 ${
                          facebookUrl && !facebookValid
                            ? "border-red-300 focus:border-red-500"
                            : "border-slate-200 focus:border-[#008A90]"
                        }`}
                      />
                      {facebookUrl.trim() && (
                        <button
                          type="button"
                          onClick={() => setFacebookUrl("")}
                          className="shrink-0 rounded-lg border border-slate-200 px-2.5 py-2 text-xs text-slate-500 hover:bg-slate-100"
                          title="Clear Facebook URL"
                        >
                          Clear
                        </button>
                      )}
                    </div>
                    <p className="mt-1.5 text-[10px] leading-4 text-slate-400">
                      Full URL to your official Facebook page (e.g. <code>https://facebook.com/liveazy</code>).
                    </p>
                    {facebookUrl && !facebookValid && (
                      <p className="mt-1 text-[10px] text-red-600">Please enter a valid URL.</p>
                    )}
                  </div>

                  {/* Instagram URL */}
                  <div>
                    <div className="mb-2 flex items-center justify-between gap-3">
                      <label htmlFor="instagram-url" className="flex items-center gap-2 text-xs font-bold text-[#0F2942]">
                        <InstagramIconSvg className="h-3.5 w-3.5 text-pink-600" /> Instagram Profile URL
                      </label>
                      <span className="text-[10px] font-semibold text-slate-400">Optional · Blank hides icon</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        id="instagram-url"
                        type="url"
                        value={instagramUrl}
                        onChange={(e) => setInstagramUrl(e.target.value)}
                        placeholder="https://instagram.com/liveazy"
                        className={`w-full rounded-lg border px-3.5 py-2.5 text-xs outline-none transition focus:ring-2 focus:ring-[#008A90]/15 ${
                          instagramUrl && !instagramValid
                            ? "border-red-300 focus:border-red-500"
                            : "border-slate-200 focus:border-[#008A90]"
                        }`}
                      />
                      {instagramUrl.trim() && (
                        <button
                          type="button"
                          onClick={() => setInstagramUrl("")}
                          className="shrink-0 rounded-lg border border-slate-200 px-2.5 py-2 text-xs text-slate-500 hover:bg-slate-100"
                          title="Clear Instagram URL"
                        >
                          Clear
                        </button>
                      )}
                    </div>
                    <p className="mt-1.5 text-[10px] leading-4 text-slate-400">
                      Full URL to your Instagram profile (e.g. <code>https://instagram.com/liveazy</code>).
                    </p>
                    {instagramUrl && !instagramValid && (
                      <p className="mt-1 text-[10px] text-red-600">Please enter a valid URL.</p>
                    )}
                  </div>

                  {/* YouTube URL */}
                  <div>
                    <div className="mb-2 flex items-center justify-between gap-3">
                      <label htmlFor="youtube-url" className="flex items-center gap-2 text-xs font-bold text-[#0F2942]">
                        <YouTubeIconSvg className="h-3.5 w-3.5 text-red-600" /> YouTube Channel URL
                      </label>
                      <span className="text-[10px] font-semibold text-slate-400">Optional · Blank hides icon</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        id="youtube-url"
                        type="url"
                        value={youtubeUrl}
                        onChange={(e) => setYoutubeUrl(e.target.value)}
                        placeholder="https://youtube.com/@liveazy"
                        className={`w-full rounded-lg border px-3.5 py-2.5 text-xs outline-none transition focus:ring-2 focus:ring-[#008A90]/15 ${
                          youtubeUrl && !youtubeValid
                            ? "border-red-300 focus:border-red-500"
                            : "border-slate-200 focus:border-[#008A90]"
                        }`}
                      />
                      {youtubeUrl.trim() && (
                        <button
                          type="button"
                          onClick={() => setYoutubeUrl("")}
                          className="shrink-0 rounded-lg border border-slate-200 px-2.5 py-2 text-xs text-slate-500 hover:bg-slate-100"
                          title="Clear YouTube URL"
                        >
                          Clear
                        </button>
                      )}
                    </div>
                    <p className="mt-1.5 text-[10px] leading-4 text-slate-400">
                      Full URL to your official YouTube channel (e.g. <code>https://youtube.com/@liveazy</code>).
                    </p>
                    {youtubeUrl && !youtubeValid && (
                      <p className="mt-1 text-[10px] text-red-600">Please enter a valid URL.</p>
                    )}
                  </div>

                  {/* WhatsApp Business Number */}
                  <div>
                    <div className="mb-2 flex items-center justify-between gap-3">
                      <label htmlFor="whatsapp-number" className="flex items-center gap-2 text-xs font-bold text-[#0F2942]">
                        <WhatsAppIconSvg className="h-3.5 w-3.5 text-emerald-600" /> Official WhatsApp Number
                      </label>
                      <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-slate-400">
                        <Info size={12} /> Country code required
                      </span>
                    </div>
                    <div className="grid grid-cols-[150px_minmax(0,1fr)] overflow-hidden rounded-lg border border-slate-200 focus-within:border-[#008A90] focus-within:ring-2 focus-within:ring-[#008A90]/10 sm:grid-cols-[180px_minmax(0,1fr)]">
                      <label className="flex items-center gap-2 border-r border-slate-200 bg-slate-50 px-3">
                        <span className="text-sm">
                          {countryCodes.find((item) => item.code === countryCode)?.flag ?? "🌐"}
                        </span>
                        <select
                          aria-label="Country calling code"
                          value={countryCode}
                          onChange={(e) => setCountryCode(e.target.value)}
                          className="w-full min-w-0 bg-transparent py-3 text-xs font-semibold outline-none"
                        >
                          <option value="+91">+91 India</option>
                          <option value="+1">+1 US/Canada</option>
                          <option value="+44">+44 UK</option>
                          <option value="+971">+971 UAE</option>
                          <option value="+61">+61 Australia</option>
                        </select>
                      </label>
                      <input
                        id="whatsapp-number"
                        type="tel"
                        inputMode="numeric"
                        autoComplete="tel-national"
                        value={localNumber}
                        onChange={(e) => setLocalNumber(e.target.value.replace(/[^\d\s()-]/g, ""))}
                        placeholder="94238 38109"
                        className="min-w-0 px-3.5 py-2.5 text-sm outline-none"
                      />
                    </div>
                    <p className="mt-1.5 text-[10px] leading-4 text-slate-400">
                      Reuses the official WhatsApp business contact. For India, enter the 10-digit mobile number after +91.
                    </p>
                    {localNumber && !whatsappValid && (
                      <p className="mt-1 text-[10px] text-amber-700">
                        Check that the complete number contains 10–15 digits including country code.
                      </p>
                    )}
                  </div>

                  {/* Actions Bar */}
                  <div className="flex flex-col-reverse gap-2 border-t border-slate-100 pt-4 sm:flex-row sm:items-center sm:justify-between">
                    <button
                      type="button"
                      onClick={() => {
                        setFacebookUrl("");
                        setInstagramUrl("");
                        setYoutubeUrl("");
                        showNotice("success", "Cleared social links. Click Save Settings to persist.");
                      }}
                      disabled={saving}
                      className="rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-600 transition hover:bg-slate-50 disabled:opacity-50"
                    >
                      Clear Social Links
                    </button>
                    <button
                      type="submit"
                      disabled={saving}
                      className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#0F2942] px-5 py-2.5 text-xs font-bold text-white transition hover:bg-[#173A5B] disabled:opacity-50"
                    >
                      {saving ? <RefreshCw size={15} className="animate-spin" /> : <Save size={15} />}
                      {saving ? "Saving settings…" : "Save Settings"}
                    </button>
                  </div>
                </form>
              )}
            </section>

            {/* Live Storefront Footer Preview Section */}
            <div className="space-y-5">
              <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
                <div className="flex items-start justify-between gap-3 border-b border-slate-100 px-5 py-4 sm:px-6">
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="text-sm font-bold text-[#0F2942]">Storefront Footer Preview</h2>
                      <span className="rounded-full bg-cyan-50 px-2 py-0.5 text-[9px] font-bold text-[#087D82]">
                        LIVE PREVIEW
                      </span>
                    </div>
                    <p className="mt-1 text-xs text-slate-500">
                      Shows how configured links render in the public LIVEAZY footer.
                    </p>
                  </div>
                  <span className="shrink-0 rounded-full bg-emerald-50 px-2 py-1 text-[9px] font-bold text-emerald-700">
                    {activeIconsCount} Active
                  </span>
                </div>

                <div className="p-5">
                  {/* Mock Footer Brand Box */}
                  <div className="rounded-xl border border-slate-800 bg-[#071D33] p-5 text-white shadow-inner">
                    <div className="flex items-center gap-2">
                      <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#42DADA] text-sm font-black text-[#071D33]">
                        L
                      </span>
                      <span className="text-lg font-extrabold tracking-tight">
                        LIVE<span className="text-[#42DADA]">AZY</span>
                      </span>
                    </div>
                    <p className="mt-3 text-xs leading-5 text-slate-300">
                      Rent smarter, live better. Flexible rental options across Pune &amp; PCMC.
                    </p>

                    <div className="mt-5 border-t border-white/10 pt-4">
                      <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                        Follow Us
                      </p>

                      {activeIconsCount === 0 ? (
                        <div className="mt-3 rounded-lg border border-dashed border-white/20 p-3 text-center text-[11px] text-slate-400">
                          No social icons configured yet. Add Facebook, Instagram, YouTube, or WhatsApp above to display icons here.
                        </div>
                      ) : (
                        <div className="mt-3 flex items-center gap-2.5">
                          {hasFacebook && (
                            <a
                              href={normalizeUrlForOpen(facebookUrl)}
                              target="_blank"
                              rel="noopener noreferrer"
                              aria-label="Facebook"
                              className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/10 text-slate-300 transition duration-200 hover:bg-[#42DADA] hover:text-[#071D33]"
                              title={`Facebook: ${facebookUrl}`}
                            >
                              <FacebookIconSvg className="h-4 w-4" />
                            </a>
                          )}

                          {hasInstagram && (
                            <a
                              href={normalizeUrlForOpen(instagramUrl)}
                              target="_blank"
                              rel="noopener noreferrer"
                              aria-label="Instagram"
                              className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/10 text-slate-300 transition duration-200 hover:bg-[#42DADA] hover:text-[#071D33]"
                              title={`Instagram: ${instagramUrl}`}
                            >
                              <InstagramIconSvg className="h-4 w-4" />
                            </a>
                          )}

                          {hasYouTube && (
                            <a
                              href={normalizeUrlForOpen(youtubeUrl)}
                              target="_blank"
                              rel="noopener noreferrer"
                              aria-label="YouTube"
                              className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/10 text-slate-300 transition duration-200 hover:bg-[#42DADA] hover:text-[#071D33]"
                              title={`YouTube: ${youtubeUrl}`}
                            >
                              <YouTubeIconSvg className="h-4 w-4" />
                            </a>
                          )}

                          {hasWhatsApp && whatsappLink && (
                            <a
                              href={whatsappLink}
                              target="_blank"
                              rel="noopener noreferrer"
                              aria-label="WhatsApp"
                              className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/10 text-slate-300 transition duration-200 hover:bg-[#42DADA] hover:text-[#071D33]"
                              title={`WhatsApp: +${savedNumberDigits}`}
                            >
                              <WhatsAppIconSvg className="h-4 w-4" />
                            </a>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Summary of links */}
                  <div className="mt-4 space-y-2 rounded-lg border border-slate-100 bg-slate-50 p-3 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-slate-500">Facebook:</span>
                      <span className="max-w-[200px] truncate font-mono text-[11px] text-slate-700">
                        {facebookUrl || "— (hidden)"}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-slate-500">Instagram:</span>
                      <span className="max-w-[200px] truncate font-mono text-[11px] text-slate-700">
                        {instagramUrl || "— (hidden)"}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-slate-500">YouTube:</span>
                      <span className="max-w-[200px] truncate font-mono text-[11px] text-slate-700">
                        {youtubeUrl || "— (hidden)"}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-slate-500">WhatsApp:</span>
                      <span className="max-w-[200px] truncate font-mono text-[11px] text-slate-700">
                        {savedNumberDigits ? `+${savedNumberDigits}` : "— (hidden)"}
                      </span>
                    </div>
                  </div>
                </div>
              </section>
            </div>
          </div>

          {/* Admin Page Footer */}
          <footer className="flex flex-col gap-2 border-t border-slate-200 py-4 text-[10px] text-slate-400 sm:flex-row sm:items-center sm:justify-between">
            <span>LIVEAZY Admin Console</span>
            <span>Social settings are stored in SiteSetting and publicly accessible for footer integration.</span>
          </footer>
        </main>
      </div>
    </div>
  );
}
