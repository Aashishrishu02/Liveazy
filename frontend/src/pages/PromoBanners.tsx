import React, { useEffect, useRef, useState } from "react";

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

  X,

  Contact,

} from "lucide-react";



const API_URL = (import.meta.env.VITE_API_URL ?? "").replace(/\/+$/, "");



interface PromoBannerData {

  id: string;

  image: string;

  label: string;

  heading: string;

  subtitle: string;

  buttonText: string;

  buttonLink: string;

  isActive: boolean;

  sortOrder: number;
  impressions: number;
  clicks: number;
  placement: string;

  createdAt?: string;

  updatedAt?: string;

}



type BannerForm = Omit<PromoBannerData, "id" | "createdAt" | "updatedAt" | "impressions" | "clicks">;

type SaveMode = "draft" | "publish";

type BannerStatusFilter = "all" | "published" | "draft";



const emptyBanner: BannerForm = {

  image: "",

  label: "NEW COLLECTION",

  heading: "Make your space feel like home.",

  subtitle: "Quality essentials, delivered when you need them.",

  buttonText: "Explore collection",

  buttonLink: "#products",

  // New banners are ready to publish by default; "Save as draft" overrides this.

  isActive: true,

  sortOrder: 0,

  placement: "HOMEPAGE_PROMO",

};



const placements = [

  { value: "HOMEPAGE_PROMO", label: "Homepage promo section" },

  { value: "CATEGORY_SECTION", label: "Category section" },

  { value: "PRODUCT_LISTING", label: "Product listing" },

  { value: "CAMPAIGN_PAGE", label: "Campaign page" },

];



const navigation = [

  { label: "Dashboard", path: "/admin/dashboard", icon: LayoutDashboard },

  { label: "Categories", path: "/admin/categories", icon: Tags },

  { label: "Products", path: "/admin/products", icon: Armchair },

  { label: "Banners", path: "/admin/banner", icon: Images },

  { label: "Promo Banners", path: "/admin/promo-banners", icon: Megaphone },

  { label: "WhatsApp Settings", path: "/admin/settings", icon: MessageCircle },

  { label: "Contact Management", path: "/admin/contact-management", icon: Contact },

];



function AdminAvatar() {

  return (

    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-cyan-50 text-teal-700">

      <span className="text-[10px] font-extrabold">SA</span>

    </div>

  );

}



const inputClass =

  "mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-[#008A90] focus:ring-4 focus:ring-[#008A90]/10";

const labelClass = "block text-sm font-semibold text-slate-700";



function formatPlacement(value: string) {

  return placements.find((placement) => placement.value === value)?.label ?? value;

}



function getErrorMessage(data: any, fallback: string) {

  return Array.isArray(data?.message)

    ? data.message.join(", ")

    : data?.message || fallback;

}



export default function PromoBanners() {

  const navigate = useNavigate();

  const [sidebarOpen, setSidebarOpen] = useState(false);

  const [banners, setBanners] = useState<PromoBannerData[]>([]);

  const [searchTerm, setSearchTerm] = useState("");

  const [statusFilter, setStatusFilter] = useState<BannerStatusFilter>("all");

  const [placementFilter, setPlacementFilter] = useState("ALL");

  const [loading, setLoading] = useState(true);

  const [drawerOpen, setDrawerOpen] = useState(false);

  const [editingId, setEditingId] = useState<string | null>(null);

  const [form, setForm] = useState<BannerForm>({ ...emptyBanner });

  const [busy, setBusy] = useState(false);

  const [uploading, setUploading] = useState(false);

  const [deletingId, setDeletingId] = useState<string | null>(null);

  const [error, setError] = useState("");

  const [success, setSuccess] = useState("");

  const fileInputRef = useRef<HTMLInputElement>(null);



  const getHeaders = (): HeadersInit => {

    const token = localStorage.getItem("token");

    return {

      "Content-Type": "application/json",

      ...(token ? { Authorization: `Bearer ${token}` } : {}),

    };

  };



  const loadBanners = async () => {

    try {

      setLoading(true);

      setError("");

      const response = await fetch(`${API_URL}/promo-banners/admin`, {

        headers: getHeaders(),

      });

      const data = await response.json().catch(() => []);

      if (!response.ok) throw new Error(getErrorMessage(data, "Failed to load promo banners."));

      setBanners(Array.isArray(data) ? data : []);

    } catch (err) {

      setError(err instanceof Error ? err.message : "Something went wrong while loading banners.");

    } finally {

      setLoading(false);

    }

  };



  useEffect(() => {

    void loadBanners();

    // Load once when the admin page mounts.

    // eslint-disable-next-line react-hooks/exhaustive-deps

  }, []);



  const openCreateDrawer = () => {

    setEditingId(null);

    setForm({ ...emptyBanner, sortOrder: banners.length });

    setError("");

    setSuccess("");

    setDrawerOpen(true);

  };



  const openEditDrawer = (banner: PromoBannerData) => {

    setEditingId(banner.id);

    setForm({

      image: banner.image ?? "",

      label: banner.label ?? "",

      heading: banner.heading ?? "",

      subtitle: banner.subtitle ?? "",

      buttonText: banner.buttonText ?? "",

      buttonLink: banner.buttonLink ?? "#products",

      isActive: Boolean(banner.isActive),

      sortOrder: Number(banner.sortOrder ?? 0),

      placement: banner.placement || "HOMEPAGE_PROMO",

    });

    setError("");

    setSuccess("");

    setDrawerOpen(true);

  };



  const updateField = <K extends keyof BannerForm,>(field: K, value: BannerForm[K]) => {

    setForm((current) => ({ ...current, [field]: value }));

  };



  const uploadImage = async (file: File) => {

    if (!file.type.startsWith("image/")) throw new Error("Please select a valid image file.");

    if (file.size > 5 * 1024 * 1024) throw new Error("Image size must be 5 MB or less.");



    const body = new FormData();

    body.append("file", file);

    const token = localStorage.getItem("token");

    const response = await fetch(`${API_URL}/upload/promo-banner`, {

      method: "POST",

      headers: token ? { Authorization: `Bearer ${token}` } : {},

      body,

    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok || !data.url) {

      throw new Error(getErrorMessage(data, "Image upload failed."));

    }

    return String(data.url);

  };



  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {

    const file = event.target.files?.[0];

    event.target.value = "";

    if (!file) return;

    try {

      setUploading(true);

      setError("");

      setSuccess("");

      const url = await uploadImage(file);

      updateField("image", url);

      setSuccess("Image uploaded. Save the banner to apply the change.");

    } catch (err) {

      setError(err instanceof Error ? err.message : "Image upload failed.");

    } finally {

      setUploading(false);

    }

  };



  const saveBanner = async (mode: SaveMode) => {

    // Require the publish-status switch to be enabled before publishing.

    if (mode === "publish" && !form.isActive) {

      setError("Turn on Publish status to publish this banner, or choose Save as draft.");

      return;

    }



    if (!form.image.trim()) {

      setError("Please upload a banner image before saving.");

      return;

    }

    if (![form.label, form.heading, form.subtitle, form.buttonText].every((value) => value.trim())) {

      setError("Please fill in the label, heading, subtitle, and button text.");

      return;

    }

    if (!Number.isInteger(Number(form.sortOrder)) || Number(form.sortOrder) < 0) {

      setError("Display order must be a whole number greater than or equal to 0.");

      return;

    }



    const payload: BannerForm = {

      ...form,

      image: form.image.trim(),

      label: form.label.trim(),

      heading: form.heading.trim(),

      subtitle: form.subtitle.trim(),

      buttonText: form.buttonText.trim(),

      buttonLink: form.buttonLink.trim() || "#products",

      sortOrder: Number(form.sortOrder),

      isActive: mode === "publish",

      placement: form.placement.trim() || "HOMEPAGE_PROMO",

    };



    try {

      setBusy(true);

      setError("");

      setSuccess("");

      const isEditing = Boolean(editingId);

      const response = await fetch(

        isEditing ? `${API_URL}/promo-banners/${editingId}` : `${API_URL}/promo-banners`,

        {

          method: isEditing ? "PATCH" : "POST",

          headers: getHeaders(),

          body: JSON.stringify(payload),

        }

      );

      const data = await response.json().catch(() => ({}));

      if (!response.ok) throw new Error(getErrorMessage(data, "Failed to save promo banner."));



      setBanners((current) => {

        const next = isEditing

          ? current.map((item) => (item.id === editingId ? data : item))

          : [...current, data];

        return next.sort((a, b) => Number(a.sortOrder) - Number(b.sortOrder));

      });

      setDrawerOpen(false);

      setSuccess(mode === "publish" ? "Promo banner published successfully." : "Promo banner saved as draft.");

    } catch (err) {

      setError(err instanceof Error ? err.message : "Failed to save promo banner.");

    } finally {

      setBusy(false);

    }

  };



  const deleteBanner = async (banner: PromoBannerData) => {

    if (!window.confirm(`Delete “${banner.heading || "this promo banner"}”? This cannot be undone.`)) return;

    try {

      setDeletingId(banner.id);

      setError("");

      setSuccess("");

      const response = await fetch(`${API_URL}/promo-banners/${banner.id}`, {

        method: "DELETE",

        headers: getHeaders(),

      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) throw new Error(getErrorMessage(data, "Failed to delete promo banner."));

      setBanners((current) => current.filter((item) => item.id !== banner.id));

      setSuccess("Promo banner deleted.");

      if (editingId === banner.id) setDrawerOpen(false);

    } catch (err) {

      setError(err instanceof Error ? err.message : "Failed to delete promo banner.");

    } finally {

      setDeletingId(null);

    }

  };



  const logout = () => {

    localStorage.removeItem("token");

    navigate("/admin");

  };



  const activeCount = banners.filter((banner) => banner.isActive).length;
  const totalImpressions = banners.reduce(
    (total, banner) => total + (Number(banner.impressions) || 0),
    0,
  );
  const totalClicks = banners.reduce(
    (total, banner) => total + (Number(banner.clicks) || 0),
    0,
  );
  const clickThroughRate =
    totalImpressions > 0 ? ((totalClicks / totalImpressions) * 100).toFixed(2) : "0.00";

  const visibleBanners = banners

    .filter((banner) => {

      const query = searchTerm.trim().toLowerCase();

      const searchableText = `${banner.heading ?? ""} ${banner.label ?? ""} ${banner.subtitle ?? ""}`.toLowerCase();

      const matchesSearch = !query || searchableText.includes(query);

      const matchesStatus =

        statusFilter === "all" ||

        (statusFilter === "published" ? banner.isActive : !banner.isActive);

      const matchesPlacement =

        placementFilter === "ALL" || (banner.placement || "HOMEPAGE_PROMO") === placementFilter;

      return matchesSearch && matchesStatus && matchesPlacement;

    })

    .sort((a, b) => Number(a.sortOrder) - Number(b.sortOrder));



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

            Operations & Catalog

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

              <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-slate-400">Admin / Marketing</p>

              <p className="mt-1 text-sm font-bold text-[#0F2942]">Promo banner management</p>

            </div>

          </div>

          <div className="hidden items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-2 sm:flex">

            <AdminAvatar />

            <div>

              <p className="text-xs font-bold text-[#0F2942]">Super Admin</p>

              <p className="text-[10px] text-slate-500">admin\@liveazy.in</p>

            </div>

          </div>

        </header>



        <main className="mx-auto max-w-[1600px] space-y-6 px-4 py-6 sm:px-6 sm:py-8 lg:px-8">

          <div className="mx-auto max-w-7xl">

        <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">

          <div>

            <div className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.18em] text-[#008A90]">

              <span className="h-2 w-2 rounded-full bg-[#008A90]" /> LIVEAZY ADMIN

            </div>

            <h1 className="text-2xl font-bold tracking-tight text-[#0F2942] sm:text-3xl">Promo banners</h1>

            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">

              Create campaign visuals, edit the message, and choose where each promo appears on your store.

            </p>

          </div>

          <button

            type="button"

            onClick={openCreateDrawer}

            className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#0F2942] px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-[#173a5b] focus:outline-none focus:ring-4 focus:ring-[#0F2942]/15"

          >

            <span className="text-lg leading-none">＋</span> Add promo banner

          </button>

        </div>



        {error && !drawerOpen && (

          <div role="alert" className="mt-5 flex items-start justify-between gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">

            <span>{error}</span>

            <button type="button" aria-label="Dismiss error" onClick={() => setError("")} className="font-bold">×</button>

          </div>

        )}

        {success && !drawerOpen && (

          <div role="status" className="mt-5 flex items-start justify-between gap-3 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">

            <span>{success}</span>

            <button type="button" aria-label="Dismiss message" onClick={() => setSuccess("")} className="font-bold">×</button>

          </div>

        )}



        <div className="mt-7 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">

          <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm shadow-slate-200/30">

            <p className="text-sm font-medium text-slate-500">Total banners</p>

            <div className="mt-2 flex items-end justify-between"><p className="text-3xl font-bold text-[#0F2942]">{banners.length}</p><span className="rounded-lg bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-500">All placements</span></div>

          </div>

          <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm shadow-slate-200/30">

            <p className="text-sm font-medium text-slate-500">Published</p>

            <div className="mt-2 flex items-end justify-between"><p className="text-3xl font-bold text-[#0F2942]">{activeCount}</p><span className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700"><span className="h-1.5 w-1.5 rounded-full bg-emerald-500" /> Live</span></div>

          </div>

          <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm shadow-slate-200/30">

            <p className="text-sm font-medium text-slate-500">Drafts</p>

            <div className="mt-2 flex items-end justify-between"><p className="text-3xl font-bold text-[#0F2942]">{banners.length - activeCount}</p><span className="rounded-lg bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-700">Not published</span></div>

          </div>
          <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm shadow-slate-200/30">
            <p className="text-sm font-medium text-slate-500">Total impressions</p>
            <div className="mt-2 flex items-end justify-between gap-2">
              <p className="text-3xl font-bold text-[#0F2942]">{totalImpressions.toLocaleString()}</p>
              <span className="rounded-lg bg-cyan-50 px-2.5 py-1 text-xs font-semibold text-cyan-700">Views</span>
            </div>
          </div>
          <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm shadow-slate-200/30">
            <p className="text-sm font-medium text-slate-500">Total clicks</p>
            <div className="mt-2 flex items-end justify-between gap-2">
              <p className="text-3xl font-bold text-[#0F2942]">{totalClicks.toLocaleString()}</p>
              <span className="rounded-lg bg-violet-50 px-2.5 py-1 text-xs font-semibold text-violet-700">CTA clicks</span>
            </div>
            <p className="mt-2 text-xs text-slate-500">CTR: {clickThroughRate}%</p>
          </div>
        </div>



        <section className="mt-7 overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm shadow-slate-200/30">

          <div className="flex flex-col gap-3 border-b border-slate-100 px-5 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-6">

            <div>

              <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#008A90]">CAMPAIGN LIBRARY</p>

              <h2 className="mt-1 text-lg font-bold text-[#0F2942]">Your promo banners</h2>

              <p className="mt-1 text-xs text-slate-500">Manage creative, publication status, placement and display order.</p>

            </div>

            <button type="button" onClick={() => void loadBanners()} disabled={loading} className="inline-flex items-center justify-center gap-2 self-start rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs font-semibold text-slate-600 transition hover:border-[#008A90] hover:text-[#008A90] disabled:opacity-50 sm:self-auto">

              <span aria-hidden="true">↻</span> {loading ? "Refreshing…" : "Refresh list"}

            </button>

          </div>



          <div className="border-b border-slate-100 bg-slate-50/70 p-4 sm:p-5">

            <div className="grid grid-cols-1 gap-3 md:grid-cols-[minmax(0,1fr)\_240px]">

              <label className="relative block">

                <span className="sr-only">Search promo banners</span>

                <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" aria-hidden="true">⌕</span>

                <input value={searchTerm} onChange={(event) => setSearchTerm(event.target.value)} placeholder="Search by heading, label or subtitle…" className="w-full rounded-xl border border-slate-200 bg-white py-3 pl-10 pr-4 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-[#008A90] focus:ring-4 focus:ring-[#008A90]/10" />

              </label>

              <label>

                <span className="sr-only">Filter by placement</span>

                <select value={placementFilter} onChange={(event) => setPlacementFilter(event.target.value)} className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-3 text-sm text-slate-700 outline-none transition focus:border-[#008A90] focus:ring-4 focus:ring-[#008A90]/10">

                  <option value="ALL">All placements</option>

                  {placements.map((placement) => <option key={placement.value} value={placement.value}>{placement.label}</option>)}

                </select>

              </label>

            </div>

            <div className="mt-3 flex flex-wrap items-center gap-2">

              {([

                { value: "all", label: `All banners (${banners.length})` },

                { value: "published", label: `Published (${activeCount})` },

                { value: "draft", label: `Drafts (${banners.length - activeCount})` },

              ] as { value: BannerStatusFilter; label: string }[]).map((filter) => (

                <button key={filter.value} type="button" onClick={() => setStatusFilter(filter.value)} className={`rounded-full px-3.5 py-2 text-xs font-semibold transition ${statusFilter === filter.value ? "bg-[#0F2942] text-white shadow-sm" : "border border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:text-[#0F2942]"}`}>

                  {filter.label}

                </button>

              ))}

              <span className="ml-auto text-xs text-slate-400">Showing {visibleBanners.length} of {banners.length}</span>

            </div>

          </div>



          {loading ? (

            <div className="flex items-center justify-center gap-3 px-6 py-16 text-sm text-slate-500"><span className="h-5 w-5 animate-spin rounded-full border-2 border-slate-200 border-t-[#008A90]" /> Loading promo banners…</div>

          ) : banners.length === 0 ? (

            <div className="px-6 py-16 text-center">

              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#EAF6F6] text-2xl text-[#008A90]">▧</div>

              <h3 className="mt-4 font-bold text-[#0F2942]">No promo banners yet</h3>

              <p className="mt-1 text-sm text-slate-500">Add your first banner to start promoting a collection or campaign.</p>

              <button type="button" onClick={openCreateDrawer} className="mt-5 rounded-xl bg-[#0F2942] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#173a5b]">Create first banner</button>

            </div>

          ) : visibleBanners.length === 0 ? (

            <div className="px-6 py-16 text-center">

              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-xl text-slate-400">⌕</div>

              <h3 className="mt-4 font-bold text-[#0F2942]">No matching banners</h3>

              <p className="mt-1 text-sm text-slate-500">Try another search term or reset your filters.</p>

              <button type="button" onClick={() => { setSearchTerm(""); setStatusFilter("all"); setPlacementFilter("ALL"); }} className="mt-4 rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50">Clear filters</button>

            </div>

          ) : (

            <div className="grid grid-cols-1 gap-4 p-4 sm:grid-cols-2 sm:p-5 xl:grid-cols-3">

              {visibleBanners.map((banner) => (

                <article key={banner.id} className="group flex min-w-0 flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white transition duration-200 hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-lg hover:shadow-slate-200/60">

                  <div className="relative aspect-[16/9] overflow-hidden bg-slate-100">

                    {banner.image ? <img src={banner.image} alt={banner.heading || "Promo banner"} className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.03]" /> : <div className="flex h-full items-center justify-center text-xs text-slate-400">No image uploaded</div>}

                    <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-[#0F2942]/45 to-transparent" />

                    <span className="absolute left-3 top-3 rounded-lg bg-white/95 px-2.5 py-1.5 text-[10px] font-bold text-slate-700 shadow-sm">Order {banner.sortOrder}</span>

                    <span className={`absolute right-3 top-3 inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[10px] font-bold shadow-sm ${banner.isActive ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"}`}><span className={`h-1.5 w-1.5 rounded-full ${banner.isActive ? "bg-emerald-500" : "bg-amber-500"}`} />{banner.isActive ? "Published" : "Draft"}</span>

                  </div>

                  <div className="flex flex-1 flex-col p-4">

                    <div className="mb-3"><span className="inline-flex max-w-full rounded-full bg-[#EAF6F6] px-2.5 py-1 text-[10px] font-bold text-[#087C82]">{formatPlacement(banner.placement || "HOMEPAGE_PROMO")}</span></div>

                    <h3 className="line-clamp-2 text-base font-bold leading-6 text-[#0F2942]">{banner.heading || "Untitled promo banner"}</h3>

                    <p className="mt-1.5 line-clamp-2 min-h-10 text-sm leading-5 text-slate-500">{banner.subtitle || "No supporting text added."}</p>

                    <p className="mt-3 truncate text-xs font-medium text-slate-400">Label: {banner.label || "—"}</p>
                    <div className="my-4 grid grid-cols-2 gap-3">
                      <div className="rounded-xl border border-slate-100 bg-slate-50 px-3 py-3">
                        <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">Impressions</p>
                        <p className="mt-1 text-xl font-bold text-[#0F2942]">{(Number(banner.impressions) || 0).toLocaleString()}</p>
                      </div>
                      <div className="rounded-xl border border-slate-100 bg-slate-50 px-3 py-3">
                        <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">Clicks</p>
                        <p className="mt-1 text-xl font-bold text-[#0F2942]">{(Number(banner.clicks) || 0).toLocaleString()}</p>
                      </div>
                    </div>
                    <div className="mt-auto flex gap-2 border-t border-slate-100 pt-4">

                      <button type="button" onClick={() => openEditDrawer(banner)} className="flex-1 rounded-xl bg-[#0F2942] px-3 py-2.5 text-sm font-semibold text-white transition hover:bg-[#173a5b]">Edit banner</button>

                      <button type="button" onClick={() => void deleteBanner(banner)} disabled={deletingId === banner.id} aria-label={`Delete ${banner.heading}`} className="rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm font-semibold text-slate-500 transition hover:border-red-200 hover:bg-red-50 hover:text-red-600 disabled:opacity-50">{deletingId === banner.id ? "…" : "Delete"}</button>

                    </div>

                  </div>

                </article>

              ))}

            </div>

          )}

        </section>

      </div>



      {drawerOpen && (

        <div className="fixed inset-0 z-50 flex justify-end">

          <button type="button" aria-label="Close editor" onClick={() => !busy && !uploading && setDrawerOpen(false)} className="absolute inset-0 cursor-default bg-[#0F2942]/45 backdrop-blur-[2px]" />

          <section role="dialog" aria-modal="true" aria-labelledby="promo-editor-title" className="relative flex h-full w-full max-w-5xl flex-col overflow-hidden bg-white shadow-2xl">

            <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4 sm:px-7">

              <div><p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#008A90]">PROMO CAMPAIGN</p><h2 id="promo-editor-title" className="mt-1 text-lg font-bold text-[#0F2942]">{editingId ? "Edit promo banner" : "Create promo banner"}</h2></div>

              <button type="button" onClick={() => !busy && !uploading && setDrawerOpen(false)} aria-label="Close" className="flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 text-xl text-slate-500 transition hover:bg-slate-100">×</button>

            </div>



            <div className="flex-1 overflow-y-auto">

              <div className="grid min-h-full grid-cols-1 lg:grid-cols-[0.92fr_1.08fr]">

                <div className="border-b border-slate-200 bg-[#F7F9FB] p-5 sm:p-7 lg:border-b-0 lg:border-r">

                  <div className="flex items-start justify-between gap-3"><div><h3 className="text-sm font-bold text-[#0F2942]">Banner creative</h3><p className="mt-1 text-xs leading-5 text-slate-500">Upload a wide image for the best result.</p></div><span className="rounded-lg bg-white px-2 py-1 text-[10px] font-semibold text-slate-500 ring-1 ring-slate-200">5 MB max</span></div>

                  <div className="mt-5 overflow-hidden rounded-2xl border border-dashed border-slate-300 bg-white p-2">

                    <div className="relative flex aspect-[4/3] items-center justify-center overflow-hidden rounded-xl bg-slate-100">

                      {form.image ? <img src={form.image} alt="Promo banner preview" className="absolute inset-0 h-full w-full object-cover" /> : <div className="px-5 text-center"><div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-white text-2xl text-slate-400 shadow-sm">＋</div><p className="mt-3 text-sm font-semibold text-slate-600">Your image preview</p><p className="mt-1 text-xs text-slate-400">JPG, PNG or WebP</p></div>}

                      {uploading && <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#0F2942]/65 text-white"><span className="h-6 w-6 animate-spin rounded-full border-2 border-white/30 border-t-white"/><span className="mt-3 text-sm font-semibold">Uploading image…</span></div>}

                    </div>

                  </div>

                  <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileChange} className="hidden" />

                  <div className="mt-3 flex flex-wrap gap-2">

                    <button type="button" disabled={uploading} onClick={() => fileInputRef.current?.click()} className="rounded-xl bg-[#0F2942] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#173a5b] disabled:opacity-50">{uploading ? "Uploading…" : form.image ? "Change image" : "Upload image"}</button>

                    {form.image && <button type="button" disabled={uploading} onClick={() => updateField("image", "")} className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-600 transition hover:border-red-200 hover:text-red-600 disabled:opacity-50">Remove image</button>}

                  </div>

                  <div className="mt-6 rounded-xl border border-[#D5EAEA] bg-[#ECF7F7] p-4"><p className="text-xs font-bold uppercase tracking-wide text-[#087C82]">Design tip</p><p className="mt-1.5 text-xs leading-5 text-slate-600">Use clear product photography with enough space for text. Keep important details away from the edges so the image crops well on mobile.</p></div>

                  {form.image && <div className="mt-5"><p className="text-[11px] font-bold uppercase tracking-wide text-slate-400">Image URL</p><p className="mt-1 break-all text-xs leading-5 text-slate-500">{form.image}</p></div>}

                </div>



                <div className="p-5 sm:p-7">

                  <div className="mb-5"><h3 className="text-sm font-bold text-[#0F2942]">Content and placement</h3><p className="mt-1 text-xs leading-5 text-slate-500">This copy will be used by the storefront where this placement is rendered.</p></div>

                  {error && <div role="alert" className="mb-4 rounded-xl border border-red-200 bg-red-50 px-3.5 py-3 text-sm text-red-700">{error}</div>}

                  {success && <div role="status" className="mb-4 rounded-xl border border-emerald-200 bg-emerald-50 px-3.5 py-3 text-sm text-emerald-800">{success}</div>}

                  <div className="space-y-4">

                    <div><label className={labelClass} htmlFor="promo-label">Small label <span className="font-normal text-slate-400">(eyebrow text)</span></label><input id="promo-label" className={inputClass} value={form.label} onChange={(e) => updateField("label", e.target.value)} placeholder="e.g. LIMITED-TIME OFFER" maxLength={100} /></div>

                    <div><label className={labelClass} htmlFor="promo-heading">Heading</label><input id="promo-heading" className={inputClass} value={form.heading} onChange={(e) => updateField("heading", e.target.value)} placeholder="Enter a strong headline" maxLength={180} /></div>

                    <div><label className={labelClass} htmlFor="promo-subtitle">Subtitle</label><textarea id="promo-subtitle" className={`${inputClass} min-h-24 resize-y`} value={form.subtitle} onChange={(e) => updateField("subtitle", e.target.value)} placeholder="Add a short supporting message" rows={3} maxLength={500} /></div>

                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2"><div><label className={labelClass} htmlFor="promo-button-text">Button text</label><input id="promo-button-text" className={inputClass} value={form.buttonText} onChange={(e) => updateField("buttonText", e.target.value)} placeholder="Shop now" maxLength={60} /></div><div><label className={labelClass} htmlFor="promo-button-link">Button link</label><input id="promo-button-link" className={inputClass} value={form.buttonLink} onChange={(e) => updateField("buttonLink", e.target.value)} placeholder="#products" maxLength={300} /></div></div>

                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2"><div><label className={labelClass} htmlFor="promo-placement">Placement</label><select id="promo-placement" className={inputClass} value={form.placement} onChange={(e) => updateField("placement", e.target.value)}>{placements.map((placement) => <option key={placement.value} value={placement.value}>{placement.label}</option>)}</select></div><div><label className={labelClass} htmlFor="promo-sort-order">Display order</label><input id="promo-sort-order" type="number" min={0} step={1} className={inputClass} value={form.sortOrder} onChange={(e) => updateField("sortOrder", Number(e.target.value))} /><p className="mt-1.5 text-[11px] text-slate-400">0 appears before 1, 2, and so on.</p></div></div>

                    <div className="flex items-center justify-between rounded-xl border border-slate-200 px-4 py-3.5"><div><p className="text-sm font-semibold text-slate-700">Publish status</p><p className="mt-0.5 text-xs text-slate-500">Only published banners should be shown publicly.</p></div><button type="button" role="switch" aria-checked={form.isActive} onClick={() => updateField("isActive", !form.isActive)} className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition ${form.isActive ? "bg-[#008A90]" : "bg-slate-300"}`}><span className={`inline-block h-4 w-4 rounded-full bg-white shadow-sm transition ${form.isActive ? "translate-x-6" : "translate-x-1"}`} /></button></div>

                    <div className="rounded-xl bg-slate-50 p-4"><div className="flex items-center justify-between gap-3"><p className="text-[10px] font-bold uppercase tracking-[0.16em] text-slate-400">Button preview</p><span className="rounded-md bg-white px-2 py-1 text-[10px] font-semibold text-slate-500 ring-1 ring-slate-200">{formatPlacement(form.placement)}</span></div><div className="mt-3 flex flex-wrap items-center gap-3"><span className="text-xs font-bold uppercase tracking-wider text-[#008A90]">{form.label || "YOUR LABEL"}</span><span className="rounded-lg bg-[#FF6A3D] px-3.5 py-2 text-xs font-bold text-white">{form.buttonText || "Button text"} ↗</span></div><p className="mt-3 text-xs leading-5 text-slate-500">{form.heading || "Your heading will appear here"}</p></div>

                  </div>

                </div>

              </div>

            </div>



            <div className="flex flex-col-reverse gap-3 border-t border-slate-200 bg-white px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-7">

              <div className="text-xs text-slate-400">{editingId ? "Changes apply after you save." : "Your banner will be added to the promo banner list."}</div>

              <div className="flex flex-col-reverse gap-2 sm:flex-row">

                <button type="button" disabled={busy || uploading} onClick={() => setDrawerOpen(false)} className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-600 transition hover:bg-slate-50 disabled:opacity-50">Cancel</button>

                <button type="button" disabled={busy || uploading} onClick={() => void saveBanner("draft")} className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-[#0F2942] transition hover:bg-slate-50 disabled:opacity-50">{busy ? "Saving…" : "Save as draft"}</button>

                <button type="button" disabled={busy || uploading} onClick={() => void saveBanner("publish")} className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#008A90] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#00787D] disabled:opacity-50">{busy ? "Saving…" : "Save & publish"}<span aria-hidden="true">↗</span></button>

              </div>

            </div>

          </section>

        </div>

      )}

    </main>

      </div>

    </div>

  );

}
