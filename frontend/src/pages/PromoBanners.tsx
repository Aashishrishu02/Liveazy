import { useEffect, useState } from "react";
import type { FormEvent } from "react";
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
  Upload,
  Plus,
  Trash2,
  Save,
  Image as ImageIcon,
  CheckCircle2,
  AlertCircle,
  LoaderCircle,
} from "lucide-react";

const API_URL = import.meta.env.VITE_API_URL;

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
}

const emptyBanner = {
  image: "",
  label: "",
  heading: "",
  subtitle: "",
  buttonText: "",
  buttonLink: "#products",
  isActive: true,
  sortOrder: 0,
};

const navigation = [
  { label: "Dashboard", path: "/admin/dashboard", icon: LayoutDashboard },
  { label: "Categories", path: "/admin/categories", icon: Tags },
  { label: "Products", path: "/admin/products", icon: Armchair },
  { label: "Banners", path: "/admin/banner", icon: Images },
  { label: "Promo Banners", path: "/admin/promo-banners", icon: Megaphone },
  { label: "WhatsApp Settings", path: "/admin/settings", icon: MessageCircle },
];

export default function PromoBanners() {
  const navigate = useNavigate();

  const [banners, setBanners] = useState<PromoBannerData[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [uploadingId, setUploadingId] = useState<string | null>(null);
  const [uploadingNew, setUploadingNew] = useState(false);
  const [adding, setAdding] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [newBanner, setNewBanner] = useState(emptyBanner);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const getHeaders = (): HeadersInit => {
    const token = localStorage.getItem("token");

    return {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };
  };

  const uploadPromoImage = async (file: File): Promise<string> => {
    if (!file.type.startsWith("image/")) {
      throw new Error("Please select a valid image file.");
    }

    if (file.size > 5 * 1024 * 1024) {
      throw new Error("Image size must be 5 MB or less.");
    }

    const formData = new FormData();
    formData.append("file", file);

    const token = localStorage.getItem("token");

    const response = await fetch(`${API_URL}/upload/promo-banner`, {
      method: "POST",
      headers: token
        ? { Authorization: `Bearer ${token}` }
        : {},
      body: formData,
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok || !data.url) {
      throw new Error(
        Array.isArray(data.message)
          ? data.message.join(", ")
          : data.message || "Image upload failed."
      );
    }

    return data.url;
  };

  const loadBanners = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await fetch(`${API_URL}/promo-banners/admin`, {
        headers: getHeaders(),
      });

      if (!response.ok) {
        throw new Error("Failed to load promo banners.");
      }

      const data: PromoBannerData[] = await response.json();

      setBanners(
        Array.isArray(data)
          ? [...data].sort((a, b) => a.sortOrder - b.sortOrder)
          : []
      );
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Something went wrong."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadBanners();
  }, []);

  const updateField = (
    id: string,
    field: keyof PromoBannerData,
    value: string | boolean | number
  ) => {
    setBanners((current) =>
      current.map((banner) =>
        banner.id === id ? { ...banner, [field]: value } : banner
      )
    );
  };

  const handleExistingImageUpload = async (
    bannerId: string,
    file: File
  ) => {
    try {
      setUploadingId(bannerId);
      setError("");
      setSuccess("");

      const imageUrl = await uploadPromoImage(file);

      updateField(bannerId, "image", imageUrl);
      setSuccess("Image uploaded. Click Save Changes to apply it.");
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Image upload failed."
      );
    } finally {
      setUploadingId(null);
    }
  };

  const handleNewImageUpload = async (file: File) => {
    try {
      setUploadingNew(true);
      setError("");
      setSuccess("");

      const imageUrl = await uploadPromoImage(file);

      setNewBanner((current) => ({
        ...current,
        image: imageUrl,
      }));

      setSuccess("Image uploaded successfully.");
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Image upload failed."
      );
    } finally {
      setUploadingNew(false);
    }
  };

  const saveBanner = async (banner: PromoBannerData) => {
    try {
      setSavingId(banner.id);
      setError("");
      setSuccess("");

      const response = await fetch(
        `${API_URL}/promo-banners/${banner.id}`,
        {
          method: "PATCH",
          headers: getHeaders(),
          body: JSON.stringify({
            image: banner.image,
            label: banner.label,
            heading: banner.heading,
            subtitle: banner.subtitle,
            buttonText: banner.buttonText,
            buttonLink: banner.buttonLink,
            isActive: banner.isActive,
            sortOrder: Number(banner.sortOrder),
          }),
        }
      );

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(
          Array.isArray(data.message)
            ? data.message.join(", ")
            : data.message || "Failed to save banner."
        );
      }

      setBanners((current) =>
        current
          .map((item) => (item.id === banner.id ? data : item))
          .sort((a, b) => a.sortOrder - b.sortOrder)
      );

      setSuccess(`"${banner.heading}" saved successfully.`);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to save banner."
      );
    } finally {
      setSavingId(null);
    }
  };

  const createBanner = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!newBanner.image) {
      setError("Please upload a banner image first.");
      return;
    }

    if (!newBanner.heading.trim()) {
      setError("Please enter a banner heading.");
      return;
    }

    try {
      setAdding(true);
      setError("");
      setSuccess("");

      const response = await fetch(`${API_URL}/promo-banners`, {
        method: "POST",
        headers: getHeaders(),
        body: JSON.stringify({
          ...newBanner,
          sortOrder: Number(newBanner.sortOrder),
        }),
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(
          Array.isArray(data.message)
            ? data.message.join(", ")
            : data.message || "Failed to create banner."
        );
      }

      setBanners((current) =>
        [...current, data].sort((a, b) => a.sortOrder - b.sortOrder)
      );

      setNewBanner({
        ...emptyBanner,
        sortOrder: banners.length,
      });

      setSuccess("Promo banner created successfully.");
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to create banner."
      );
    } finally {
      setAdding(false);
    }
  };

  const deleteBanner = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this promo banner?")) {
      return;
    }

    try {
      setDeletingId(id);
      setError("");
      setSuccess("");

      const response = await fetch(`${API_URL}/promo-banners/${id}`, {
        method: "DELETE",
        headers: getHeaders(),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.message || "Failed to delete banner.");
      }

      setBanners((current) =>
        current.filter((banner) => banner.id !== id)
      );

      setSuccess("Promo banner deleted successfully.");
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to delete banner."
      );
    } finally {
      setDeletingId(null);
    }
  };

  const logout = () => {
    localStorage.removeItem("token");
    navigate("/admin");
  };

  const inputClass =
    "w-full rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm text-[#0F2942] outline-none transition placeholder:text-slate-400 focus:border-[#008A90] focus:ring-2 focus:ring-[#008A90]/10";

  const labelClass =
    "mb-2 block text-sm font-semibold text-[#0F2942]";

  return (
    <div className="min-h-screen bg-[#F5F7FA] text-[#142B43]">
      {sidebarOpen && (
        <button
          type="button"
          aria-label="Close navigation"
          onClick={() => setSidebarOpen(false)}
          className="fixed inset-0 z-40 bg-[#0F2942]/40 lg:hidden"
        />
      )}

      {/* Sidebar */}
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
            {navigation.map(({ label, path, icon: Icon }) => (
              <NavLink
                key={path}
                to={path}
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
                {label}
              </NavLink>
            ))}
          </nav>

          <div className="my-6 border-t border-slate-100" />

          <NavLink
            to="/"
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

      {/* Main content */}
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
                Store Management / Promo Banners
              </p>
              <h2 className="mt-1 text-base font-bold text-[#0F2942]">
                Promo Banner Management
              </h2>
            </div>
          </div>

          <div className="hidden items-center gap-2 rounded-full bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-700 sm:flex">
            <span className="h-2 w-2 rounded-full bg-emerald-500" />
            Admin workspace
          </div>
        </header>

        <main className="mx-auto max-w-[1600px] space-y-6 px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
          <section className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
            <div>
              <span className="inline-flex items-center gap-2 rounded-md bg-[#D9F4F2] px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.14em] text-[#00696E]">
                <Megaphone size={13} />
                Homepage Marketing
              </span>

              <h1 className="mt-3 text-2xl font-extrabold tracking-tight text-[#0F2942] sm:text-3xl">
                Promo Banners
              </h1>

              <p className="mt-2 text-sm text-slate-500">
                Manage promotional images, content, visibility and display order.
              </p>
            </div>

            <a
              href="/"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-[#0F2942] hover:bg-slate-50"
            >
              <Store size={17} />
              View Website
            </a>
          </section>

          {error && (
            <div
              role="alert"
              className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700"
            >
              <AlertCircle size={19} className="mt-0.5 shrink-0" />
              {error}
            </div>
          )}

          {success && (
            <div
              role="status"
              className="flex items-start gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800"
            >
              <CheckCircle2 size={19} className="mt-0.5 shrink-0" />
              {success}
            </div>
          )}

          <section className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <StatCard
              title="Total Promo Banners"
              value={loading ? "—" : banners.length}
              subtitle="All saved banners"
              icon={<Images size={20} />}
              iconClass="bg-blue-50 text-[#0F2942]"
            />

            <StatCard
              title="Active Banners"
              value={loading ? "—" : banners.filter((b) => b.isActive).length}
              subtitle="Shown on homepage"
              icon={<CheckCircle2 size={20} />}
              iconClass="bg-emerald-50 text-emerald-700"
            />

            <StatCard
              title="Hidden Banners"
              value={loading ? "—" : banners.filter((b) => !b.isActive).length}
              subtitle="Not shown on homepage"
              icon={<ImageIcon size={20} />}
              iconClass="bg-orange-50 text-[#E96B43]"
            />
          </section>

          {loading ? (
            <section className="flex min-h-64 items-center justify-center rounded-xl border border-slate-200 bg-white">
              <div className="text-center">
                <LoaderCircle className="mx-auto animate-spin text-[#008A90]" size={30} />
                <p className="mt-3 text-sm text-slate-500">
                  Loading promo banners...
                </p>
              </div>
            </section>
          ) : (
            <>
              <section className="space-y-5">
                <div>
                  <h2 className="font-bold text-[#0F2942]">Existing Banners</h2>
                  <p className="mt-1 text-sm text-slate-500">
                    Update each banner and click Save Changes to apply it.
                  </p>
                </div>

                {banners.length === 0 && (
                  <div className="rounded-xl border border-slate-200 bg-white px-6 py-14 text-center shadow-sm">
                    <ImageIcon size={32} className="mx-auto text-slate-300" />
                    <h3 className="mt-3 font-bold text-[#0F2942]">
                      No promo banners yet
                    </h3>
                    <p className="mt-1 text-sm text-slate-500">
                      Add your first promotional banner using the form below.
                    </p>
                  </div>
                )}

                {banners.map((banner) => (
                  <section
                    key={banner.id}
                    className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 bg-[#F8FAFC] px-5 py-4 sm:px-6">
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                          Display Order {banner.sortOrder}
                        </p>
                        <h3 className="mt-1 font-bold text-[#0F2942]">
                          {banner.heading || "Untitled Promo Banner"}
                        </h3>
                      </div>

                      <label className="inline-flex cursor-pointer items-center gap-2 text-sm font-semibold text-[#0F2942]">
                        <input
                          type="checkbox"
                          checked={banner.isActive}
                          onChange={(event) =>
                            updateField(
                              banner.id,
                              "isActive",
                              event.target.checked
                            )
                          }
                          className="h-4 w-4 accent-[#008A90]"
                        />
                        Show on homepage
                      </label>
                    </div>

                    <div className="grid grid-cols-1 gap-6 p-5 sm:p-6 xl:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
                      <div>
                        <div className="mb-3 flex items-center gap-2">
                          <ImageIcon size={17} className="text-[#008A90]" />
                          <h4 className="text-sm font-bold text-[#0F2942]">
                            Banner Image
                          </h4>
                        </div>

                        {banner.image ? (
                          <img
                            src={banner.image}
                            alt={banner.heading || "Promo banner preview"}
                            onError={(event) => {
                              event.currentTarget.style.display = "none";
                            }}
                            className="h-52 w-full rounded-xl border border-slate-100 bg-slate-50 object-cover"
                          />
                        ) : (
                          <div className="flex h-52 flex-col items-center justify-center rounded-xl border-2 border-dashed border-slate-200 bg-[#F8FAFC]">
                            <ImageIcon size={28} className="text-slate-300" />
                            <p className="mt-2 text-sm text-slate-500">
                              No image selected
                            </p>
                          </div>
                        )}

                        <label className="mt-4 flex cursor-pointer items-center justify-center gap-2 rounded-lg border border-slate-200 px-4 py-3 text-sm font-semibold text-[#0F2942] transition hover:border-[#008A90] hover:bg-teal-50">
                          <Upload size={17} />
                          {uploadingId === banner.id
                            ? "Uploading image..."
                            : "Change Promo Image"}
                          <input
                            type="file"
                            accept="image/*"
                            disabled={uploadingId === banner.id}
                            className="hidden"
                            onChange={(event) => {
                              const file = event.target.files?.[0];
                              if (file) {
                                void handleExistingImageUpload(banner.id, file);
                              }
                              event.target.value = "";
                            }}
                          />
                        </label>
                        <p className="mt-2 text-xs text-slate-400">
                          JPG, PNG or WebP · Maximum 5 MB
                        </p>
                      </div>

                      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                        <Field
                          label="Small Label"
                          value={banner.label}
                          placeholder="SPECIAL OFFER"
                          onChange={(value) =>
                            updateField(banner.id, "label", value)
                          }
                        />

                        <Field
                          label="Main Heading"
                          value={banner.heading}
                          placeholder="Your promo heading"
                          onChange={(value) =>
                            updateField(banner.id, "heading", value)
                          }
                        />

                        <div className="md:col-span-2">
                          <label className={labelClass}>Subtitle</label>
                          <textarea
                            rows={3}
                            value={banner.subtitle}
                            onChange={(event) =>
                              updateField(
                                banner.id,
                                "subtitle",
                                event.target.value
                              )
                            }
                            className={inputClass}
                            placeholder="Write a short description..."
                          />
                        </div>

                        <Field
                          label="Button Text"
                          value={banner.buttonText}
                          placeholder="EXPLORE NOW"
                          onChange={(value) =>
                            updateField(banner.id, "buttonText", value)
                          }
                        />

                        <Field
                          label="Button Link"
                          value={banner.buttonLink}
                          placeholder="#products"
                          onChange={(value) =>
                            updateField(banner.id, "buttonLink", value)
                          }
                        />

                        <Field
                          label="Display Order"
                          type="number"
                          value={String(banner.sortOrder)}
                          onChange={(value) =>
                            updateField(banner.id, "sortOrder", Number(value))
                          }
                        />

                        <div className="flex items-end gap-3">
                          <button
                            type="button"
                            onClick={() => void saveBanner(banner)}
                            disabled={
                              savingId === banner.id ||
                              uploadingId === banner.id ||
                              deletingId === banner.id
                            }
                            className="inline-flex min-h-11 flex-1 items-center justify-center gap-2 rounded-lg bg-[#0F2942] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#193D5C] disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            <Save size={16} />
                            {savingId === banner.id ? "Saving..." : "Save Changes"}
                          </button>

                          <button
                            type="button"
                            aria-label="Delete promo banner"
                            title="Delete banner"
                            disabled={
                              deletingId === banner.id ||
                              savingId === banner.id
                            }
                            onClick={() => void deleteBanner(banner.id)}
                            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-red-200 px-4 text-sm font-semibold text-red-600 transition hover:bg-red-50 disabled:opacity-50"
                          >
                            <Trash2 size={17} />
                            {deletingId === banner.id ? "..." : "Delete"}
                          </button>
                        </div>
                      </div>
                    </div>
                  </section>
                ))}
              </section>

              <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
                <div className="border-b border-slate-200 bg-[#F8FAFC] px-5 py-5 sm:px-6">
                  <div className="flex items-center gap-3">
                    <div className="rounded-lg bg-[#D9F4F2] p-2.5 text-[#00696E]">
                      <Plus size={20} />
                    </div>
                    <div>
                      <h2 className="font-bold text-[#0F2942]">
                        Add New Promo Banner
                      </h2>
                      <p className="mt-1 text-sm text-slate-500">
                        Create a new promotional section for your homepage.
                      </p>
                    </div>
                  </div>
                </div>

                <form onSubmit={createBanner} className="space-y-6 p-5 sm:p-6">
                  <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)]">
                    <div>
                      <label className={labelClass}>Promo Image *</label>

                      <div className="rounded-xl border-2 border-dashed border-slate-200 bg-[#F8FAFC] p-4">
                        {newBanner.image ? (
                          <img
                            src={newBanner.image}
                            alt="New promo preview"
                            className="h-48 w-full rounded-lg object-cover"
                          />
                        ) : (
                          <div className="flex h-48 flex-col items-center justify-center text-center">
                            <Upload size={28} className="text-[#008A90]" />
                            <p className="mt-3 text-sm font-semibold text-[#0F2942]">
                              Upload promo image
                            </p>
                            <p className="mt-1 text-xs text-slate-400">
                              JPG, PNG or WebP · Max 5 MB
                            </p>
                          </div>
                        )}

                        <label className="mt-4 flex cursor-pointer items-center justify-center gap-2 rounded-lg bg-[#0F2942] px-4 py-3 text-sm font-semibold text-white hover:bg-[#193D5C]">
                          <Upload size={16} />
                          {uploadingNew ? "Uploading..." : "Choose Image"}
                          <input
                            type="file"
                            accept="image/*"
                            disabled={uploadingNew || adding}
                            className="hidden"
                            onChange={(event) => {
                              const file = event.target.files?.[0];
                              if (file) void handleNewImageUpload(file);
                              event.target.value = "";
                            }}
                          />
                        </label>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                      <Field
                        label="Small Label"
                        value={newBanner.label}
                        placeholder="SPECIAL OFFER"
                        onChange={(value) =>
                          setNewBanner((current) => ({
                            ...current,
                            label: value,
                          }))
                        }
                      />

                      <Field
                        label="Main Heading"
                        value={newBanner.heading}
                        placeholder="Your promo heading"
                        onChange={(value) =>
                          setNewBanner((current) => ({
                            ...current,
                            heading: value,
                          }))
                        }
                      />

                      <div className="md:col-span-2">
                        <label className={labelClass}>Subtitle</label>
                        <textarea
                          required
                          rows={3}
                          value={newBanner.subtitle}
                          onChange={(event) =>
                            setNewBanner((current) => ({
                              ...current,
                              subtitle: event.target.value,
                            }))
                          }
                          className={inputClass}
                          placeholder="Describe your promotion..."
                        />
                      </div>

                      <Field
                        label="Button Text"
                        value={newBanner.buttonText}
                        placeholder="EXPLORE NOW"
                        onChange={(value) =>
                          setNewBanner((current) => ({
                            ...current,
                            buttonText: value,
                          }))
                        }
                      />

                      <Field
                        label="Button Link"
                        value={newBanner.buttonLink}
                        placeholder="#products"
                        onChange={(value) =>
                          setNewBanner((current) => ({
                            ...current,
                            buttonLink: value,
                          }))
                        }
                      />

                      <Field
                        label="Display Order"
                        type="number"
                        value={String(newBanner.sortOrder)}
                        onChange={(value) =>
                          setNewBanner((current) => ({
                            ...current,
                            sortOrder: Number(value),
                          }))
                        }
                      />

                      <label className="flex items-center gap-3 self-center rounded-lg border border-slate-200 p-3 text-sm font-semibold text-[#0F2942]">
                        <input
                          type="checkbox"
                          checked={newBanner.isActive}
                          onChange={(event) =>
                            setNewBanner((current) => ({
                              ...current,
                              isActive: event.target.checked,
                            }))
                          }
                          className="h-4 w-4 accent-[#008A90]"
                        />
                        Show on homepage
                      </label>
                    </div>
                  </div>

                  <div className="flex flex-col-reverse gap-3 border-t border-slate-100 pt-5 sm:flex-row sm:items-center sm:justify-between">
                    <p className="text-xs text-slate-500">
                      Upload an image before creating the promo banner.
                    </p>
                    <button
                      type="submit"
                      disabled={adding || uploadingNew || !newBanner.image}
                      className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#008A90] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#00767B] disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <Plus size={17} />
                      {adding ? "Creating Banner..." : "Create Promo Banner"}
                    </button>
                  </div>
                </form>
              </section>
            </>
          )}
        </main>
      </div>
    </div>
  );
}

interface FieldProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  type?: string;
}

function Field({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
}: FieldProps) {
  return (
    <div>
      <label className="mb-2 block text-sm font-semibold text-[#0F2942]">
        {label}
      </label>
      <input
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        min={type === "number" ? 0 : undefined}
        className="w-full rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm text-[#0F2942] outline-none transition placeholder:text-slate-400 focus:border-[#008A90] focus:ring-2 focus:ring-[#008A90]/10"
      />
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
  value: number | string;
  subtitle: string;
  icon: React.ReactNode;
  iconClass: string;
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-slate-500">{title}</p>
        <div className={`rounded-lg p-2.5 ${iconClass}`}>{icon}</div>
      </div>
      <p className="mt-4 text-3xl font-extrabold text-[#0F2942]">{value}</p>
      <p className="mt-1 text-xs text-slate-400">{subtitle}</p>
    </div>
  );
}