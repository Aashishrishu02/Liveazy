import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { ChangeEvent, FormEvent, ReactNode } from "react";
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
  Search,
  Plus,
  Pencil,
  Trash2,
  X,
  Upload,
  Save,
  Image as ImageIcon,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Eye,
  MousePointerClick,
  CalendarClock,
  ArrowUpDown,
  ExternalLink,
  ToggleLeft,
  ToggleRight,
  Clock3,
} from "lucide-react";

const API_URL = (import.meta.env.VITE_API_URL || "").replace(/\/$/, "");
const MAX_IMAGE_SIZE = 5 * 1024 * 1024;

interface BannerRecord {
  id: string;
  image: string;
  topLabel: string;
  heading: string;
  subtitle: string;
  button1Text: string;
  button1Link: string;
  button2Text: string;
  button2Link: string;
  isActive: boolean;
  placement: string;
  sortOrder: number;
  startsAt: string | null;
  endsAt: string | null;
  impressions: number;
  clicks: number;
  createdAt: string;
  updatedAt: string;
}

type BannerForm = {
  image: string;
  topLabel: string;
  heading: string;
  subtitle: string;
  button1Text: string;
  button1Link: string;
  button2Text: string;
  button2Link: string;
  isActive: boolean;
  placement: string;
  sortOrder: string;
  startsAt: string;
  endsAt: string;
};

type Notice = { type: "success" | "error"; message: string };
type StatusFilter = "all" | "active" | "inactive";

const defaultForm: BannerForm = {
  image: "",
  topLabel: "NO INVESTMENT, JUST COMFORT",
  heading: "Furnish Your Home in Just 2 Days.",
  subtitle: "Delivery, Setup & Support — All Included. Starting at minimal rents across Pune & PCMC.",
  button1Text: "VIEW CATEGORIES",
  button1Link: "#categories",
  button2Text: "CALL HOTLINE",
  button2Link: "tel:+919423838109",
  isActive: true,
  placement: "HOMEPAGE_HERO",
  sortOrder: "0",
  startsAt: "",
  endsAt: "",
};

const navigation = [
  { label: "Dashboard", path: "/admin/dashboard", icon: LayoutDashboard },
  { label: "Categories", path: "/admin/categories", icon: Tags },
  { label: "Products", path: "/admin/products", icon: Armchair },
  { label: "Banners", path: "/admin/banner", icon: Images },
  { label: "Promo Banners", path: "/admin/promo-banners", icon: Megaphone },
  { label: "WhatsApp Settings", path: "/admin/settings", icon: MessageCircle },
];

function getErrorMessage(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback;
}

function localDateTimeValue(value: string | null | undefined) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60_000);
  return local.toISOString().slice(0, 16);
}

function getBannerStatus(banner: BannerRecord) {
  if (!banner.isActive) return "Inactive";
  const now = Date.now();
  if (banner.startsAt && new Date(banner.startsAt).getTime() > now) return "Scheduled";
  if (banner.endsAt && new Date(banner.endsAt).getTime() <= now) return "Expired";
  return "Published";
}

function StatusPill({ status }: { status: string }) {
  const classes: Record<string, string> = {
    Published: "bg-emerald-50 text-emerald-700",
    Scheduled: "bg-blue-50 text-blue-700",
    Expired: "bg-orange-50 text-orange-700",
    Inactive: "bg-slate-100 text-slate-500",
  };
  const dot: Record<string, string> = {
    Published: "bg-emerald-500",
    Scheduled: "bg-blue-500",
    Expired: "bg-orange-500",
    Inactive: "bg-slate-400",
  };
  return (
    <span className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-1.5 text-xs font-semibold ${classes[status] || classes.Inactive}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${dot[status] || dot.Inactive}`} />
      {status}
    </span>
  );
}

function AdminAvatar() {
  return <span className="flex h-8 w-8 items-center justify-center rounded-full bg-cyan-50 text-[10px] font-extrabold text-teal-700">SA</span>;
}

function StatCard({ title, value, subtitle, icon, iconClass }: {
  title: string;
  value: string | number;
  subtitle: string;
  icon: ReactNode;
  iconClass: string;
}) {
  return (
    <article className="rounded-xl border border-slate-100 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
      <div className="flex items-center justify-between gap-3">
        <p className="text-[11px] font-bold uppercase tracking-[0.08em] text-slate-500">{title}</p>
        <span className={`flex h-10 w-10 items-center justify-center rounded-xl ${iconClass}`}>{icon}</span>
      </div>
      <p className="mt-4 text-3xl font-extrabold tracking-tight text-[#101F32]">{value}</p>
      <p className="mt-1 text-xs text-slate-500">{subtitle}</p>
    </article>
  );
}

async function readResponse(response: Response) {
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const message = Array.isArray(data.message) ? data.message.join(", ") : data.message;
    throw new Error(message || `Request failed with status ${response.status}`);
  }
  return data;
}

export default function Banner() {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [banners, setBanners] = useState<BannerRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [notice, setNotice] = useState<Notice | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [editingBanner, setEditingBanner] = useState<BannerRecord | null>(null);
  const [form, setForm] = useState<BannerForm>(defaultForm);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState("");
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [statusUpdatingId, setStatusUpdatingId] = useState<string | null>(null);
  const [orderDrafts, setOrderDrafts] = useState<Record<string, string>>({});
  const [savingOrderId, setSavingOrderId] = useState<string | null>(null);

  const showNotice = (type: Notice["type"], message: string) => setNotice({ type, message });

  const getHeaders = (json = false): HeadersInit => {
    const token = localStorage.getItem("token");
    return {
      ...(json ? { "Content-Type": "application/json" } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };
  };

  const loadBanners = useCallback(async () => {
    try {
      setLoading(true);
      setLoadError("");
      const response = await fetch(`${API_URL}/banners/admin`, { headers: getHeaders() });
      const data = await readResponse(response);
      const list = (Array.isArray(data) ? data : []) as BannerRecord[];
      setBanners(list);
      setOrderDrafts(Object.fromEntries(list.map((banner) => [banner.id, String(banner.sortOrder ?? 0)])));
    } catch (error) {
      console.error("Failed to load banners:", error);
      const message = getErrorMessage(error, "Unable to load banners.");
      setLoadError(message);
      showNotice("error", message);
    } finally {
      setLoading(false);
    }
  // getHeaders is stable in behavior; loading is intentionally tied to API_URL.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [API_URL]);

  useEffect(() => {
    void loadBanners();
  }, [loadBanners]);

  useEffect(() => {
    if (!selectedFile) {
      setPreviewUrl("");
      return;
    }
    const url = URL.createObjectURL(selectedFile);
    setPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [selectedFile]);

  const filteredBanners = useMemo(() => {
    const query = search.trim().toLowerCase();
    return [...banners]
      .filter((banner) => {
        const matchesSearch = [banner.heading, banner.topLabel, banner.subtitle, banner.placement]
          .join(" ").toLowerCase().includes(query);
        const status = getBannerStatus(banner);
        const matchesStatus = statusFilter === "all"
          || (statusFilter === "active" && status !== "Inactive")
          || (statusFilter === "inactive" && status === "Inactive");
        return matchesSearch && matchesStatus;
      })
      .sort((a, b) => a.sortOrder - b.sortOrder || new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [banners, search, statusFilter]);


  const publishableCount = banners.filter((banner) => getBannerStatus(banner) === "Published").length;
  const totalImpressions = banners.reduce((sum, banner) => sum + (banner.impressions || 0), 0);
  const totalClicks = banners.reduce((sum, banner) => sum + (banner.clicks || 0), 0);

  const resetForm = () => {
    setForm({ ...defaultForm, sortOrder: String(banners.length) });
    setEditingBanner(null);
    setSelectedFile(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const openCreateModal = () => {
    resetForm();
    setNotice(null);
    setShowModal(true);
  };

  const openEditModal = (banner: BannerRecord) => {
    setEditingBanner(banner);
    setSelectedFile(null);
    setForm({
      image: banner.image || "",
      topLabel: banner.topLabel || "",
      heading: banner.heading || "",
      subtitle: banner.subtitle || "",
      button1Text: banner.button1Text || "",
      button1Link: banner.button1Link || "",
      button2Text: banner.button2Text || "",
      button2Link: banner.button2Link || "",
      isActive: banner.isActive,
      placement: banner.placement || "HOMEPAGE_HERO",
      sortOrder: String(banner.sortOrder ?? 0),
      startsAt: localDateTimeValue(banner.startsAt),
      endsAt: localDateTimeValue(banner.endsAt),
    });
    setNotice(null);
    setShowModal(true);
  };

  const closeModal = () => {
    if (saving || uploading) return;
    setShowModal(false);
    resetForm();
  };

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      showNotice("error", "Please select a valid image file.");
      event.target.value = "";
      return;
    }
    if (file.size > MAX_IMAGE_SIZE) {
      showNotice("error", "Image size must be 5 MB or less.");
      event.target.value = "";
      return;
    }
    setSelectedFile(file);
    setNotice(null);
  };

  const uploadBannerImage = async (file: File): Promise<string> => {
    const body = new FormData();
    body.append("file", file);
    const response = await fetch(`${API_URL}/upload/banner-image`, {
      method: "POST",
      headers: getHeaders(),
      body,
    });
    const data = await readResponse(response);
    if (!data.url) throw new Error("Image uploaded but no image URL was returned.");
    return data.url as string;
  };

  const handleSaveBanner = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!form.heading.trim()) {
      showNotice("error", "Please enter a banner heading.");
      return;
    }
    if (!form.image.trim() && !selectedFile) {
      showNotice("error", "Please upload a banner image before saving.");
      return;
    }
    const sortOrder = Number(form.sortOrder);
    if (!Number.isInteger(sortOrder) || sortOrder < 0) {
      showNotice("error", "Display order must be a whole number greater than or equal to 0.");
      return;
    }
    const startsAt = form.startsAt ? new Date(form.startsAt) : null;
    const endsAt = form.endsAt ? new Date(form.endsAt) : null;
    if (startsAt && Number.isNaN(startsAt.getTime())) {
      showNotice("error", "Please enter a valid start date.");
      return;
    }
    if (endsAt && Number.isNaN(endsAt.getTime())) {
      showNotice("error", "Please enter a valid end date.");
      return;
    }
    if (startsAt && endsAt && endsAt <= startsAt) {
      showNotice("error", "End date must be later than start date.");
      return;
    }

    try {
      setSaving(true);
      setNotice(null);
      let image = form.image.trim();
      if (selectedFile) {
        setUploading(true);
        image = await uploadBannerImage(selectedFile);
        setUploading(false);
      }
      const payload = {
        image,
        topLabel: form.topLabel.trim(),
        heading: form.heading.trim(),
        subtitle: form.subtitle.trim(),
        button1Text: form.button1Text.trim(),
        button1Link: form.button1Link.trim(),
        button2Text: form.button2Text.trim(),
        button2Link: form.button2Link.trim(),
        isActive: form.isActive,
        placement: form.placement,
        sortOrder,
        startsAt: startsAt ? startsAt.toISOString() : null,
        endsAt: endsAt ? endsAt.toISOString() : null,
      };
      const isEditing = Boolean(editingBanner);
      const url = isEditing
        ? `${API_URL}/banners/${editingBanner!.id}`
        : `${API_URL}/banners`;
      const response = await fetch(url, {
        method: isEditing ? "PATCH" : "POST",
        headers: getHeaders(true),
        body: JSON.stringify(payload),
      });
      await readResponse(response);
      setShowModal(false);
      resetForm();
      showNotice("success", isEditing ? "Banner changes saved successfully." : "Banner created successfully.");
      await loadBanners();
    } catch (error) {
      console.error("Failed to save banner:", error);
      showNotice("error", getErrorMessage(error, "Failed to save banner."));
    } finally {
      setSaving(false);
      setUploading(false);
    }
  };

  const toggleBannerStatus = async (banner: BannerRecord) => {
    try {
      setStatusUpdatingId(banner.id);
      setNotice(null);
      const response = await fetch(`${API_URL}/banners/${banner.id}`, {
        method: "PATCH",
        headers: getHeaders(true),
        body: JSON.stringify({ isActive: !banner.isActive }),
      });
      await readResponse(response);
      showNotice("success", `${banner.heading} ${banner.isActive ? "unpublished" : "published"} successfully.`);
      await loadBanners();
    } catch (error) {
      showNotice("error", getErrorMessage(error, "Unable to update banner status."));
    } finally {
      setStatusUpdatingId(null);
    }
  };

  const saveOrder = async (banner: BannerRecord) => {
    const raw = orderDrafts[banner.id] ?? String(banner.sortOrder);
    const sortOrder = Number(raw);
    if (raw.trim() === "" || !Number.isInteger(sortOrder) || sortOrder < 0) {
      showNotice("error", "Display order must be a non-negative whole number.");
      return;
    }
    try {
      setSavingOrderId(banner.id);
      const response = await fetch(`${API_URL}/banners/${banner.id}`, {
        method: "PATCH",
        headers: getHeaders(true),
        body: JSON.stringify({ sortOrder }),
      });
      await readResponse(response);
      showNotice("success", `Display order saved for “${banner.heading}”.`);
      await loadBanners();
    } catch (error) {
      showNotice("error", getErrorMessage(error, "Unable to save display order."));
    } finally {
      setSavingOrderId(null);
    }
  };

  const deleteBanner = async (banner: BannerRecord) => {
    if (!window.confirm(`Delete “${banner.heading}”? This action cannot be undone.`)) return;
    try {
      setDeletingId(banner.id);
      const response = await fetch(`${API_URL}/banners/${banner.id}`, {
        method: "DELETE",
        headers: getHeaders(),
      });
      await readResponse(response);
      setBanners((current) => current.filter((item) => item.id !== banner.id));
      showNotice("success", "Banner deleted successfully.");
    } catch (error) {
      showNotice("error", getErrorMessage(error, "Unable to delete banner."));
    } finally {
      setDeletingId(null);
    }
  };

  const logout = () => {
    localStorage.removeItem("token");
    navigate("/admin");
  };

  const inputClass = "h-11 w-full rounded-lg border border-slate-200 bg-white px-3.5 text-sm text-[#0F2942] outline-none transition placeholder:text-slate-400 focus:border-[#008A90] focus:ring-2 focus:ring-[#008A90]/10";
  const labelClass = "mb-2 block text-xs font-bold uppercase tracking-wide text-slate-600";

  return (
    <div className="min-h-screen bg-[#F6F8FD] text-[#142B43]">
      {sidebarOpen && <button type="button" aria-label="Close navigation" onClick={() => setSidebarOpen(false)} className="fixed inset-0 z-40 bg-[#0F2942]/40 lg:hidden" />}

      <aside className={`fixed inset-y-0 left-0 z-50 flex w-[260px] flex-col border-r border-slate-200 bg-white transition-transform duration-200 ${sidebarOpen ? "translate-x-0" : "-translate-x-full"} lg:translate-x-0`}>
        <div className="border-b border-slate-100 bg-[#F8FAFC] px-6 py-6">
          <div className="flex items-center gap-3">
            <img src="/liveazy-logo.png" alt="LIVEAZY" className="h-11 w-11 rounded-xl bg-white object-contain p-1" onError={(event) => { event.currentTarget.style.display = "none"; }} />
            <div><h1 className="text-xl font-extrabold tracking-tight text-[#0F2942]">LIVEAZY</h1><p className="mt-0.5 text-xs text-slate-500">Rental Commerce Hub</p></div>
            <button type="button" aria-label="Close sidebar" onClick={() => setSidebarOpen(false)} className="ml-auto rounded-lg p-2 hover:bg-slate-200 lg:hidden"><X size={18} /></button>
          </div>
          <span className="mt-5 inline-flex rounded-md bg-[#D9F4F2] px-3 py-1.5 text-[10px] font-bold tracking-[0.14em] text-[#00696E]">ADMIN CONSOLE</span>
        </div>
        <div className="flex-1 overflow-y-auto px-4 py-6">
          <p className="mb-3 px-3 text-[10px] font-bold uppercase tracking-[0.16em] text-slate-400">Operations &amp; Catalog</p>
          <nav className="space-y-1.5">{navigation.map(({ label, path, icon: Icon }) => <NavLink key={path} to={path} onClick={() => setSidebarOpen(false)} className={({ isActive }) => `flex items-center gap-3 rounded-lg px-3 py-3 text-sm font-semibold transition ${isActive ? "bg-[#0F2942] text-white shadow-sm" : "text-slate-600 hover:bg-slate-100 hover:text-[#0F2942]"}`}><Icon size={19} strokeWidth={1.8} />{label}</NavLink>)}</nav>
          <div className="my-6 border-t border-slate-100" />
          <NavLink to="/" onClick={() => setSidebarOpen(false)} className="flex items-center gap-3 rounded-lg px-3 py-3 text-sm font-semibold text-slate-600 transition hover:bg-slate-100 hover:text-[#0F2942]"><Store size={19} />View Website</NavLink>
        </div>
        <div className="border-t border-slate-100 p-4"><button type="button" onClick={logout} className="flex w-full items-center justify-center gap-2 rounded-lg px-4 py-3 text-sm font-semibold text-red-600 transition hover:bg-red-50"><LogOut size={18} />Log Out</button></div>
      </aside>

      <div className="min-h-screen lg:pl-[260px]">
        <header className="sticky top-0 z-30 flex min-h-[72px] items-center justify-between gap-3 border-b border-slate-200 bg-white/95 px-4 backdrop-blur-md sm:px-6 lg:px-8">
          <div className="flex min-w-0 items-center gap-3"><button type="button" aria-label="Open navigation" onClick={() => setSidebarOpen(true)} className="rounded-lg border border-slate-200 p-2 hover:bg-slate-50 lg:hidden"><Menu size={20} /></button><div><p className="text-xs font-medium text-slate-400">Store Management / Homepage Content</p><h2 className="mt-1 text-base font-bold text-[#0F2942]">Banner Management</h2></div></div>
          <div className="hidden items-center gap-3 sm:flex"><span className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-700"><span className="h-2 w-2 rounded-full bg-emerald-500" />Admin workspace</span><div className="flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-2"><AdminAvatar /><div><p className="text-xs font-bold text-[#0F2942]">Super Admin</p><p className="text-[10px] text-slate-500">admin@liveazy.in</p></div></div></div>
        </header>

        <main className="mx-auto max-w-[1600px] space-y-6 px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
          <section className="flex flex-col justify-between gap-4 xl:flex-row xl:items-center">
            <div><div className="mb-2 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500"><span>Admin</span><span>/</span><span className="text-teal-700">Homepage Banners</span></div><h1 className="text-3xl font-extrabold tracking-tight text-[#0F2942] sm:text-4xl">Manage Homepage Banners</h1><p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">Create multiple hero banners, edit their content, control publishing, set display priority and schedule when banners should appear.</p></div>
            <div className="flex flex-wrap gap-2"><button type="button" onClick={() => void loadBanners()} disabled={loading} className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-[#0F2942] transition hover:bg-slate-50 disabled:opacity-50"><RefreshCw size={16} className={loading ? "animate-spin" : ""} />Refresh</button><button type="button" onClick={openCreateModal} className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#0F2942] px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-[#193D5C]"><Plus size={18} />Add Banner</button></div>
          </section>

          {notice && <div role={notice.type === "error" ? "alert" : "status"} className={`flex items-start gap-3 rounded-xl border p-4 text-sm ${notice.type === "success" ? "border-emerald-200 bg-emerald-50 text-emerald-800" : "border-red-200 bg-red-50 text-red-700"}`}>{notice.type === "success" ? <CheckCircle2 size={19} className="mt-0.5 shrink-0" /> : <AlertCircle size={19} className="mt-0.5 shrink-0" />}<p className="flex-1">{notice.message}</p><button type="button" onClick={() => setNotice(null)} aria-label="Dismiss message"><X size={16} /></button></div>}

          <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard title="Total Banners" value={loading ? "—" : banners.length} subtitle="All saved banner records" icon={<Images size={19} />} iconClass="bg-blue-50 text-[#0F2942]" />
            <StatCard title="Published Now" value={loading ? "—" : publishableCount} subtitle="Active and inside schedule" icon={<CheckCircle2 size={19} />} iconClass="bg-emerald-50 text-emerald-700" />
            <StatCard title="Impressions" value={loading ? "—" : totalImpressions.toLocaleString("en-IN")} subtitle="Tracked banner views" icon={<Eye size={19} />} iconClass="bg-cyan-50 text-teal-700" />
            <StatCard title="Clicks" value={loading ? "—" : totalClicks.toLocaleString("en-IN")} subtitle="Tracked banner interactions" icon={<MousePointerClick size={19} />} iconClass="bg-orange-50 text-orange-600" />
          </section>

          <section className="overflow-hidden rounded-xl border border-slate-100 bg-white shadow-sm">
            <div className="flex flex-col gap-4 border-b border-slate-100 p-4 sm:p-5">
              <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between"><div><h2 className="text-base font-extrabold text-[#0F2942]">Banner Directory</h2><p className="mt-1 text-xs text-slate-500">Manage artwork, content, publishing status and display order for each banner.</p></div><span className="inline-flex w-fit items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-600"><Images size={14} />{filteredBanners.length} shown</span></div>
              <div className="grid grid-cols-1 gap-3 md:grid-cols-[1fr_220px]"><div className="relative"><Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search banner heading, label or placement..." className={`${inputClass} pl-9`} /></div><select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value as StatusFilter)} aria-label="Filter banners by status" className={inputClass}><option value="all">All statuses</option><option value="active">Active / scheduled</option><option value="inactive">Inactive</option></select></div>
            </div>

            {loadError && <div className="m-5 rounded-lg border border-red-100 bg-red-50 p-4 text-sm text-red-700"><p>{loadError}</p><button type="button" onClick={() => void loadBanners()} className="mt-2 font-bold underline">Try again</button></div>}

            <div className="overflow-x-auto">
              <table className="w-full min-w-[1180px] text-left">
                <thead className="bg-[#F3F6FE]"><tr className="border-b border-slate-100">{["Banner", "Placement", "Display order", "Schedule", "Engagement", "Status", "Actions"].map((heading) => <th key={heading} className="px-4 py-4 text-[10px] font-extrabold uppercase tracking-wider text-slate-500">{heading}</th>)}</tr></thead>
                <tbody className="divide-y divide-slate-100">
                  {loading && <tr><td colSpan={7} className="px-6 py-16 text-center text-sm text-slate-500"><RefreshCw size={18} className="mx-auto mb-2 animate-spin" />Loading banners...</td></tr>}
                  {!loading && !loadError && filteredBanners.length === 0 && <tr><td colSpan={7} className="px-6 py-16 text-center"><div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-400"><Images size={23} /></div><p className="mt-3 font-semibold text-[#0F2942]">{banners.length === 0 ? "No banners yet" : "No matching banners"}</p><p className="mt-1 text-sm text-slate-500">{banners.length === 0 ? "Create your first homepage banner to get started." : "Try another search or filter."}</p>{banners.length === 0 && <button type="button" onClick={openCreateModal} className="mt-4 inline-flex items-center gap-2 rounded-lg bg-[#0F2942] px-4 py-2 text-sm font-semibold text-white"><Plus size={16} />Add Banner</button>}</td></tr>}
                  {!loading && !loadError && filteredBanners.map((banner) => {
                    const status = getBannerStatus(banner);
                    return <tr key={banner.id} className="transition hover:bg-[#F8FAFC]">
                      <td className="max-w-[360px] px-4 py-4"><div className="flex items-center gap-3"><div className="flex h-[70px] w-[112px] shrink-0 items-center justify-center overflow-hidden rounded-lg border border-slate-100 bg-slate-50">{banner.image ? <img src={banner.image} alt={banner.heading} className="h-full w-full object-cover" onError={(event) => { event.currentTarget.style.display = "none"; }} /> : <ImageIcon size={20} className="text-slate-300" />}</div><div className="min-w-0"><p className="line-clamp-2 font-bold text-[#0F2942]">{banner.heading || "Untitled banner"}</p><p className="mt-1 truncate text-[10px] font-bold uppercase tracking-wide text-teal-700">{banner.topLabel || "No top label"}</p><p className="mt-1 line-clamp-2 text-xs text-slate-500">{banner.subtitle || "No subtitle"}</p></div></div></td>
                      <td className="px-4 py-4"><span className="inline-flex rounded-md bg-slate-100 px-2.5 py-1.5 text-xs font-semibold text-slate-600">{banner.placement || "HOMEPAGE_HERO"}</span></td>
                      <td className="px-4 py-4"><div className="flex items-center gap-2"><input type="number" min="0" step="1" aria-label={`Display order for ${banner.heading}`} value={orderDrafts[banner.id] ?? String(banner.sortOrder)} onChange={(event) => setOrderDrafts((current) => ({ ...current, [banner.id]: event.target.value }))} className="h-9 w-20 rounded-lg border border-slate-200 px-2 text-sm outline-none focus:border-teal-500" /><button type="button" onClick={() => void saveOrder(banner)} disabled={savingOrderId === banner.id} className="inline-flex h-9 items-center justify-center rounded-lg border border-slate-200 px-2.5 text-xs font-semibold text-[#0F2942] hover:bg-slate-50 disabled:opacity-50">{savingOrderId === banner.id ? <RefreshCw size={13} className="animate-spin" /> : <Save size={13} />}</button></div></td>
                      <td className="px-4 py-4"><div className="min-w-[155px] space-y-1 text-xs text-slate-500"><p className="flex items-center gap-1.5"><CalendarClock size={13} />Start: {banner.startsAt ? new Date(banner.startsAt).toLocaleString() : "Immediately"}</p><p className="flex items-center gap-1.5"><Clock3 size={13} />End: {banner.endsAt ? new Date(banner.endsAt).toLocaleString() : "No end date"}</p></div></td>
                      <td className="px-4 py-4"><div className="space-y-1 text-xs"><p className="flex items-center gap-1.5 font-semibold text-[#0F2942]"><Eye size={13} className="text-slate-400" />{(banner.impressions || 0).toLocaleString("en-IN")} views</p><p className="flex items-center gap-1.5 text-slate-500"><MousePointerClick size={13} />{(banner.clicks || 0).toLocaleString("en-IN")} clicks</p></div></td>
                      <td className="px-4 py-4"><StatusPill status={status} /></td>
                      <td className="px-4 py-4"><div className="flex items-center justify-end gap-1"><button type="button" disabled={statusUpdatingId === banner.id} onClick={() => void toggleBannerStatus(banner)} title={banner.isActive ? "Unpublish banner" : "Publish banner"} aria-label={banner.isActive ? `Unpublish ${banner.heading}` : `Publish ${banner.heading}`} className="rounded-lg p-2 text-slate-500 transition hover:bg-teal-50 hover:text-teal-700 disabled:opacity-40">{statusUpdatingId === banner.id ? <RefreshCw size={16} className="animate-spin" /> : banner.isActive ? <ToggleRight size={19} /> : <ToggleLeft size={19} />}</button><button type="button" onClick={() => openEditModal(banner)} title="Edit banner" aria-label={`Edit ${banner.heading}`} className="rounded-lg p-2 text-slate-500 transition hover:bg-cyan-50 hover:text-teal-700"><Pencil size={16} /></button><a href={banner.button1Link || "#"} target={banner.button1Link?.startsWith("http") ? "_blank" : undefined} rel="noreferrer" title="Open first call-to-action link" aria-label={`Open link for ${banner.heading}`} className="rounded-lg p-2 text-slate-500 transition hover:bg-blue-50 hover:text-blue-700"><ExternalLink size={16} /></a><button type="button" disabled={deletingId === banner.id} onClick={() => void deleteBanner(banner)} title="Delete banner" aria-label={`Delete ${banner.heading}`} className="rounded-lg p-2 text-slate-500 transition hover:bg-red-50 hover:text-red-600 disabled:opacity-40">{deletingId === banner.id ? <RefreshCw size={16} className="animate-spin" /> : <Trash2 size={16} />}</button></div></td>
                    </tr>;
                  })}
                </tbody>
              </table>
            </div>
            <div className="flex flex-col gap-2 border-t border-slate-100 bg-[#F3F6FE] px-5 py-4 text-xs text-slate-500 sm:flex-row sm:items-center sm:justify-between"><p>Showing {filteredBanners.length} of {banners.length} banners</p><p className="inline-flex items-center gap-1.5"><ArrowUpDown size={13} />Lower display order appears first</p></div>
          </section>

          <footer className="flex flex-col justify-between gap-2 border-t border-slate-200 py-5 text-xs text-slate-400 sm:flex-row sm:items-center"><p>© {new Date().getFullYear()} LIVEAZY. Rental Commerce Hub.</p><p>Admin Workspace · Banner Management</p></footer>
        </main>
      </div>

      {showModal && <div className="fixed inset-0 z-[60] flex items-center justify-center overflow-y-auto bg-[#0F2942]/55 p-3 backdrop-blur-sm sm:p-5" onMouseDown={(event) => { if (event.target === event.currentTarget) closeModal(); }}>
        <form onSubmit={(event) => void handleSaveBanner(event)} className="my-auto flex max-h-[95vh] w-full max-w-5xl flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl">
          <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4 sm:px-6"><div><p className="text-[10px] font-bold uppercase tracking-[0.15em] text-teal-700">Homepage Content</p><h2 className="mt-1 text-xl font-extrabold text-[#0F2942]">{editingBanner ? "Edit Banner" : "Create New Banner"}</h2><p className="mt-1 text-xs text-slate-500">Upload artwork, configure content, and set publishing dates.</p></div><button type="button" onClick={closeModal} disabled={saving || uploading} aria-label="Close modal" className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 disabled:opacity-50"><X size={20} /></button></div>
          <div className="space-y-6 overflow-y-auto p-5 sm:p-6">
            {notice && <div role="status" className={`rounded-lg p-3 text-sm ${notice.type === "error" ? "bg-red-50 text-red-700" : "bg-teal-50 text-teal-800"}`}>{notice.message}</div>}
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1.4fr_0.9fr]">
              <div className="space-y-5">
                <section className="space-y-4"><div><h3 className="text-sm font-extrabold text-[#0F2942]">Banner content</h3><p className="mt-1 text-xs text-slate-500">These fields appear over the hero banner on the website.</p></div>
                  <div><label className={labelClass} htmlFor="banner-top-label">Top label</label><input id="banner-top-label" value={form.topLabel} onChange={(event) => setForm((current) => ({ ...current, topLabel: event.target.value }))} className={inputClass} placeholder="NO INVESTMENT, JUST COMFORT" /></div>
                  <div><label className={labelClass} htmlFor="banner-heading">Main heading *</label><input id="banner-heading" required maxLength={180} value={form.heading} onChange={(event) => setForm((current) => ({ ...current, heading: event.target.value }))} className={inputClass} placeholder="Furnish your home..." /></div>
                  <div><label className={labelClass} htmlFor="banner-subtitle">Subtitle</label><textarea id="banner-subtitle" rows={3} maxLength={1200} value={form.subtitle} onChange={(event) => setForm((current) => ({ ...current, subtitle: event.target.value }))} className={`${inputClass} h-auto py-3`} placeholder="Short supporting description..." /></div>
                </section>
                <section className="space-y-4 rounded-xl border border-slate-200 bg-[#F8FAFC] p-4"><div><h3 className="text-sm font-extrabold text-[#0F2942]">Call-to-action buttons</h3><p className="mt-1 text-xs text-slate-500">Set the label and destination for each button.</p></div>
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2"><div><label className={labelClass} htmlFor="banner-button1-text">First button text</label><input id="banner-button1-text" value={form.button1Text} onChange={(event) => setForm((current) => ({ ...current, button1Text: event.target.value }))} className={inputClass} /></div><div><label className={labelClass} htmlFor="banner-button1-link">First button link</label><input id="banner-button1-link" value={form.button1Link} onChange={(event) => setForm((current) => ({ ...current, button1Link: event.target.value }))} className={inputClass} placeholder="#categories or /contact" /></div><div><label className={labelClass} htmlFor="banner-button2-text">Second button text</label><input id="banner-button2-text" value={form.button2Text} onChange={(event) => setForm((current) => ({ ...current, button2Text: event.target.value }))} className={inputClass} /></div><div><label className={labelClass} htmlFor="banner-button2-link">Second button link</label><input id="banner-button2-link" value={form.button2Link} onChange={(event) => setForm((current) => ({ ...current, button2Link: event.target.value }))} className={inputClass} placeholder="tel:+91... or /products" /></div></div>
                </section>
                <section className="space-y-4"><div><h3 className="text-sm font-extrabold text-[#0F2942]">Publishing and ordering</h3><p className="mt-1 text-xs text-slate-500">Inactive banners stay saved but will not appear publicly.</p></div>
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2"><div><label className={labelClass} htmlFor="banner-placement">Placement</label><select id="banner-placement" value={form.placement} onChange={(event) => setForm((current) => ({ ...current, placement: event.target.value }))} className={inputClass}><option value="HOMEPAGE_HERO">Homepage hero</option><option value="HOMEPAGE_SECONDARY">Homepage secondary</option><option value="CATEGORY_FEATURED">Category feature</option></select><p className="mt-1 text-[11px] text-slate-400">Homepage hero will be connected to the customer carousel.</p></div><div><label className={labelClass} htmlFor="banner-sort-order">Display order</label><input id="banner-sort-order" type="number" min="0" step="1" required value={form.sortOrder} onChange={(event) => setForm((current) => ({ ...current, sortOrder: event.target.value }))} className={inputClass} /><p className="mt-1 text-[11px] text-slate-400">A lower number appears first.</p></div></div>
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2"><div><label className={labelClass} htmlFor="banner-starts-at">Start date (optional)</label><input id="banner-starts-at" type="datetime-local" value={form.startsAt} onChange={(event) => setForm((current) => ({ ...current, startsAt: event.target.value }))} className={inputClass} /></div><div><label className={labelClass} htmlFor="banner-ends-at">End date (optional)</label><input id="banner-ends-at" type="datetime-local" value={form.endsAt} onChange={(event) => setForm((current) => ({ ...current, endsAt: event.target.value }))} className={inputClass} /></div></div>
                  <label className="flex cursor-pointer items-center gap-3 rounded-lg border border-slate-200 bg-white p-3"><input type="checkbox" checked={form.isActive} onChange={(event) => setForm((current) => ({ ...current, isActive: event.target.checked }))} className="h-4 w-4 accent-[#008A90]" /><span><span className="block text-sm font-semibold text-[#0F2942]">Publish banner</span><span className="mt-0.5 block text-xs text-slate-500">The banner must also be inside its scheduled dates to appear publicly.</span></span></label>
                </section>
              </div>
              <div className="space-y-4">
                <section className="space-y-3"><div><h3 className="text-sm font-extrabold text-[#0F2942]">Banner image</h3><p className="mt-1 text-xs text-slate-500">JPG, PNG, WebP or other image format; maximum 5 MB.</p></div>
                  <input ref={fileInputRef} id="banner-file" type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
                  <div className="overflow-hidden rounded-xl border border-slate-200 bg-[#F8FAFC]">
                    {(previewUrl || form.image) ? <img src={previewUrl || form.image} alt="Banner preview" className="h-52 w-full object-cover" onError={(event) => { event.currentTarget.style.display = "none"; }} /> : <div className="flex h-52 flex-col items-center justify-center text-slate-400"><ImageIcon size={32} /><p className="mt-3 text-sm font-semibold">Image preview</p><p className="mt-1 text-xs">Choose an image below</p></div>}
                    <div className="p-3"><button type="button" onClick={() => fileInputRef.current?.click()} className="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-[#0F2942] transition hover:bg-slate-50"><Upload size={16} />{selectedFile ? "Choose a different image" : form.image ? "Replace image" : "Select image"}</button>{selectedFile && <div className="mt-2 flex items-start justify-between gap-3 text-xs text-slate-500"><span className="break-all">{selectedFile.name}</span><span className="shrink-0">{(selectedFile.size / (1024 * 1024)).toFixed(2)} MB</span></div>}{form.image && !selectedFile && <button type="button" onClick={() => setForm((current) => ({ ...current, image: "" }))} className="mt-2 text-xs font-semibold text-red-600 hover:underline">Remove image</button>}</div>
                  </div>
                </section>
                <section className="overflow-hidden rounded-xl border border-slate-200 bg-white"><div className="border-b border-slate-100 px-4 py-3"><h3 className="text-sm font-extrabold text-[#0F2942]">Content preview</h3><p className="mt-1 text-xs text-slate-500">Approximate display based on the content fields.</p></div><div className="relative min-h-[220px] overflow-hidden bg-[#0F2942] p-5 text-white"><div className="absolute inset-0 bg-gradient-to-r from-[#0F2942]/95 via-[#0F2942]/75 to-transparent" />{(previewUrl || form.image) && <img src={previewUrl || form.image} alt="" className="absolute inset-0 h-full w-full object-cover opacity-30" onError={(event) => { event.currentTarget.style.display = "none"; }} />}<div className="relative"><p className="text-[9px] font-extrabold uppercase tracking-[0.16em] text-cyan-300">{form.topLabel || "YOUR TOP LABEL"}</p><h4 className="mt-3 line-clamp-3 text-xl font-extrabold leading-tight">{form.heading || "Your banner heading"}</h4><p className="mt-3 line-clamp-3 text-xs leading-5 text-slate-200">{form.subtitle || "Your supporting subtitle will appear here."}</p><div className="mt-4 flex flex-wrap gap-2">{form.button1Text && <span className="rounded-md bg-[#008A90] px-3 py-2 text-[9px] font-bold uppercase tracking-wide">{form.button1Text}</span>}{form.button2Text && <span className="rounded-md border border-white/60 px-3 py-2 text-[9px] font-bold uppercase tracking-wide">{form.button2Text}</span>}</div></div></div></section>
                {editingBanner && <div className="rounded-xl bg-slate-50 p-4 text-xs text-slate-500"><p className="font-semibold text-[#0F2942]">Banner engagement</p><div className="mt-2 flex justify-between"><span>Impressions</span><strong className="text-[#0F2942]">{(editingBanner.impressions || 0).toLocaleString("en-IN")}</strong></div><div className="mt-1 flex justify-between"><span>Clicks</span><strong className="text-[#0F2942]">{(editingBanner.clicks || 0).toLocaleString("en-IN")}</strong></div></div>}
              </div>
            </div>
          </div>
          <div className="flex flex-col-reverse gap-3 border-t border-slate-200 bg-[#F8FAFC] px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6"><p className="self-center text-xs text-slate-400">Changes are saved to the Banner database record.</p><div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end"><button type="button" onClick={closeModal} disabled={saving || uploading} className="rounded-lg border border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold text-slate-600 transition hover:bg-slate-50 disabled:opacity-50">Cancel</button><button type="submit" disabled={saving || uploading || !form.heading.trim()} className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#0F2942] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#193D5C] disabled:cursor-not-allowed disabled:opacity-50">{saving || uploading ? <RefreshCw size={16} className="animate-spin" /> : <Save size={16} />}{uploading ? "Uploading image…" : saving ? "Saving…" : editingBanner ? "Save Changes" : "Create Banner"}</button></div></div>
        </form>
      </div>}
    </div>
  );
}
