
import { useEffect, useRef, useState } from "react";
import type { ChangeEvent } from "react";
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
  Save,
  Image as ImageIcon,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
} from "lucide-react";

const API_URL = import.meta.env.VITE_API_URL;

interface BannerData {
  id: string;
  image: string;
  isActive: boolean;
  topLabel: string;
  heading: string;
  subtitle: string;
  button1Text: string;
  button1Link: string;
  button2Text: string;
  button2Link: string;
}

const defaultText = {
  topLabel: "NO INVESTMENT, JUST COMFORT",
  heading: "Furnish Your Home in Just 2 Days.",
  subtitle:
    "Delivery, Setup & Support — All Included. Starting at minimal rents across Pune & PCMC.",
  button1Text: "VIEW CATEGORIES",
  button1Link: "#categories",
  button2Text: "CALL HOTLINE",
  button2Link: "tel:+919423838109",
};

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

type Notice = {
  type: "success" | "error";
  message: string;
};

export default function Banner() {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [banner, setBanner] = useState<BannerData | null>(null);
  const [form, setForm] = useState(defaultText);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState("");
  const [fetching, setFetching] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [notice, setNotice] = useState<Notice | null>(null);

  const showNotice = (type: Notice["type"], message: string) => {
    setNotice({ type, message });
  };

  const fetchBanner = async () => {
    try {
      setFetching(true);

      const response = await fetch(`${API_URL}/banners`);

      if (!response.ok) {
        throw new Error("Failed to fetch banner");
      }

      const data: BannerData | null = await response.json();

      setBanner(data);

      if (data) {
        setForm({
          topLabel: data.topLabel || defaultText.topLabel,
          heading: data.heading || defaultText.heading,
          subtitle: data.subtitle || defaultText.subtitle,
          button1Text: data.button1Text || defaultText.button1Text,
          button1Link: data.button1Link || defaultText.button1Link,
          button2Text: data.button2Text || defaultText.button2Text,
          button2Link: data.button2Link || defaultText.button2Link,
        });
      }
    } catch (error) {
      console.error("Error fetching banner:", error);
      showNotice(
        "error",
        "Banner load nahi ho paya. API connection check karein."
      );
    } finally {
      setFetching(false);
    }
  };

  useEffect(() => {
    void fetchBanner();
  }, []);

  useEffect(() => {
    if (!selectedFile) {
      setPreviewUrl("");
      return;
    }

    const url = URL.createObjectURL(selectedFile);
    setPreviewUrl(url);

    return () => URL.revokeObjectURL(url);
  }, [selectedFile]);

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];

    if (!file) return;

    if (!file.type.startsWith("image/")) {
      showNotice("error", "Please select a valid image file.");
      event.target.value = "";
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      showNotice("error", "Image size must be 5 MB or less.");
      event.target.value = "";
      return;
    }

    setSelectedFile(file);
    setNotice(null);
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      showNotice("error", "Pehle banner image select karein.");
      return;
    }

    try {
      setUploading(true);
      setNotice(null);

      const body = new FormData();
      body.append("file", selectedFile);

      const response = await fetch(`${API_URL}/upload/banner`, {
        method: "POST",
        body,
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data.message || "Banner upload failed");
      }

      if (data.banner) {
        const uploaded = data.banner as BannerData;

        setBanner(uploaded);
        setForm({
          topLabel: uploaded.topLabel || form.topLabel,
          heading: uploaded.heading || form.heading,
          subtitle: uploaded.subtitle || form.subtitle,
          button1Text: uploaded.button1Text || form.button1Text,
          button1Link: uploaded.button1Link || form.button1Link,
          button2Text: uploaded.button2Text || form.button2Text,
          button2Link: uploaded.button2Link || form.button2Link,
        });
      } else {
        await fetchBanner();
      }

      setSelectedFile(null);

      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }

      showNotice("success", "Banner image successfully uploaded!");
    } catch (error) {
      console.error("Banner upload error:", error);

      showNotice(
        "error",
        error instanceof Error ? error.message : "Banner upload failed."
      );
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async () => {
    if (!banner) {
      showNotice(
        "error",
        "Text save karne se pehle banner image upload karein."
      );
      return;
    }

    try {
      setSaving(true);
      setNotice(null);

      const response = await fetch(`${API_URL}/banners/active`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(form),
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data.message || "Failed to save banner text");
      }

      setBanner(data);

      setForm({
        topLabel: data.topLabel || defaultText.topLabel,
        heading: data.heading || defaultText.heading,
        subtitle: data.subtitle || defaultText.subtitle,
        button1Text: data.button1Text || defaultText.button1Text,
        button1Link: data.button1Link || defaultText.button1Link,
        button2Text: data.button2Text || defaultText.button2Text,
        button2Link: data.button2Link || defaultText.button2Link,
      });

      showNotice(
        "success",
        "Homepage banner text updated successfully!"
      );
    } catch (error) {
      console.error("Error saving banner:", error);

      showNotice(
        "error",
        error instanceof Error ? error.message : "Failed to save banner text."
      );
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/admin");
  };

  const inputClass =
    "w-full rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm text-[#0F2942] outline-none transition focus:border-[#008A90] focus:ring-2 focus:ring-[#008A90]/10";

  return (
    <div className="min-h-screen bg-[#F5F7FA] text-[#142B43]">
      {/* Mobile sidebar backdrop - same as Products.tsx */}
      {sidebarOpen && (
        <button
          type="button"
          aria-label="Close navigation"
          onClick={() => setSidebarOpen(false)}
          className="fixed inset-0 z-40 bg-[#0F2942]/40 lg:hidden"
        />
      )}

      {/* Sidebar - same as Products.tsx */}
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
            onClick={handleLogout}
            className="flex w-full items-center justify-center gap-2 rounded-lg px-4 py-3 text-sm font-semibold text-red-600 transition hover:bg-red-50"
          >
            <LogOut size={18} />
            Log Out
          </button>
        </div>
      </aside>

      {/* Main layout - same as Products.tsx */}
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
                Store Management / Banners
              </p>
              <h2 className="mt-1 text-base font-bold text-[#0F2942]">
                Banner Management
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
                <Images size={13} />
                Homepage Content
              </span>

              <h1 className="mt-3 text-2xl font-extrabold tracking-tight text-[#0F2942] sm:text-3xl">
                Banner Management
              </h1>

              <p className="mt-2 text-sm text-slate-500">
                Manage your homepage banner image, heading and call-to-action
                buttons.
              </p>
            </div>

            <button
              type="button"
              onClick={() => void fetchBanner()}
              disabled={fetching || uploading || saving}
              className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-[#0F2942] transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <RefreshCw
                size={16}
                className={fetching ? "animate-spin" : ""}
              />
              Refresh Banner
            </button>
          </section>

          {/* Success and error notices */}
          {notice && (
            <div
              role={notice.type === "error" ? "alert" : "status"}
              className={`flex items-start gap-3 rounded-xl border p-4 text-sm ${
                notice.type === "success"
                  ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                  : "border-red-200 bg-red-50 text-red-700"
              }`}
            >
              {notice.type === "success" ? (
                <CheckCircle2 size={19} className="shrink-0" />
              ) : (
                <AlertCircle size={19} className="shrink-0" />
              )}

              <p>{notice.message}</p>
            </div>
          )}

          {/* Current banner preview */}
          <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
            <div className="flex flex-col gap-3 border-b border-slate-200 p-5 sm:flex-row sm:items-center sm:px-6">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-[#0F2942]">
                <ImageIcon size={21} />
              </div>

              <div>
                <h2 className="font-bold text-[#0F2942]">
                  Current Homepage Banner
                </h2>
                <p className="mt-1 text-xs text-slate-500">
                  Preview the currently saved banner.
                </p>
              </div>

              <span
                className={`ml-auto inline-flex w-fit items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold ${
                  banner?.image
                    ? "bg-emerald-50 text-emerald-700"
                    : "bg-slate-100 text-slate-500"
                }`}
              >
                <span
                  className={`h-1.5 w-1.5 rounded-full ${
                    banner?.image ? "bg-emerald-500" : "bg-slate-400"
                  }`}
                />
                {banner?.image ? "Image available" : "No image"}
              </span>
            </div>

            <div className="p-5 sm:p-6">
              {fetching ? (
                <div className="flex h-56 items-center justify-center gap-3 rounded-lg bg-[#F8FAFC] text-sm text-slate-500">
                  <RefreshCw size={18} className="animate-spin" />
                  Loading banner...
                </div>
              ) : banner?.image ? (
                <img
                  src={banner.image}
                  alt="Current homepage banner"
                  className="h-56 w-full rounded-lg border border-slate-100 bg-slate-50 object-cover sm:h-72 lg:h-80"
                />
              ) : (
                <div className="flex h-56 flex-col items-center justify-center rounded-lg border-2 border-dashed border-slate-200 bg-[#F8FAFC] text-center">
                  <ImageIcon size={30} className="text-slate-300" />
                  <p className="mt-3 text-sm font-semibold text-[#0F2942]">
                    No banner uploaded yet
                  </p>
                  <p className="mt-1 text-xs text-slate-500">
                    Upload an image below to get started.
                  </p>
                </div>
              )}
            </div>
          </section>

          {/* Upload banner image */}
          <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-200 p-5 sm:px-6">
              <h2 className="font-bold text-[#0F2942]">
                Upload Banner Image
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                Select a JPG, PNG or WebP image up to 5 MB.
              </p>
            </div>

            <div className="p-5 sm:p-6">
              <input
                ref={fileInputRef}
                id="banner-image"
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="block w-full cursor-pointer rounded-lg border border-slate-200 bg-[#F8FAFC] text-sm file:mr-4 file:border-0 file:bg-[#0F2942] file:px-4 file:py-3 file:font-semibold file:text-white"
              />

              {(previewUrl || selectedFile) && (
                <div className="mt-5 rounded-lg border border-slate-200 bg-[#F8FAFC] p-4">
                  {previewUrl && (
                    <img
                      src={previewUrl}
                      alt="Selected banner preview"
                      className="h-48 w-full rounded-lg object-cover sm:h-56"
                    />
                  )}

                  {selectedFile && (
                    <div className="mt-3 flex flex-col gap-1 text-xs text-slate-500 sm:flex-row sm:items-center sm:justify-between">
                      <span className="break-all">
                        Selected: {selectedFile.name}
                      </span>
                      <span>
                        {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB
                      </span>
                    </div>
                  )}
                </div>
              )}

              <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-xs text-slate-400">
                  Recommended: use a high-quality landscape image.
                </p>

                <button
                  type="button"
                  onClick={() => void handleUpload()}
                  disabled={!selectedFile || uploading}
                  className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#0F2942] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#193D5C] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {uploading ? (
                    <RefreshCw size={17} className="animate-spin" />
                  ) : (
                    <Upload size={17} />
                  )}
                  {uploading ? "Uploading..." : "Upload Banner"}
                </button>
              </div>
            </div>
          </section>

          {/* Banner text and buttons */}
          <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-200 p-5 sm:px-6">
              <h2 className="font-bold text-[#0F2942]">
                Banner Text &amp; Buttons
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                Edit the content displayed over your homepage banner.
              </p>
            </div>

            <div className="p-5 sm:p-6">
              <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                {(
                  [
                    ["topLabel", "Top Label"],
                    ["heading", "Main Heading"],
                    ["subtitle", "Subtitle"],
                    ["button1Text", "First Button Text"],
                    ["button1Link", "First Button Link"],
                    ["button2Text", "Second Button Text"],
                    ["button2Link", "Second Button Link"],
                  ] as const
                ).map(([field, label]) => (
                  <div
                    key={field}
                    className={
                      field === "heading" || field === "subtitle"
                        ? "md:col-span-2"
                        : ""
                    }
                  >
                    <label
                      htmlFor={`banner-${field}`}
                      className="mb-2 block text-sm font-semibold text-[#0F2942]"
                    >
                      {label}
                    </label>

                    {field === "subtitle" ? (
                      <textarea
                        id={`banner-${field}`}
                        rows={3}
                        value={form[field]}
                        onChange={(event) =>
                          setForm((current) => ({
                            ...current,
                            [field]: event.target.value,
                          }))
                        }
                        className={inputClass}
                      />
                    ) : (
                      <input
                        id={`banner-${field}`}
                        value={form[field]}
                        onChange={(event) =>
                          setForm((current) => ({
                            ...current,
                            [field]: event.target.value,
                          }))
                        }
                        className={inputClass}
                      />
                    )}
                  </div>
                ))}
              </div>

              <div className="mt-6 flex flex-col gap-3 border-t border-slate-100 pt-5 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-xs leading-5 text-slate-500">
                  {banner
                    ? "Save changes to update the live homepage banner."
                    : "Upload a banner image before saving its text."}
                </p>

                <button
                  type="button"
                  onClick={() => void handleSave()}
                  disabled={!banner || saving || uploading}
                  className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#008A90] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#00767B] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {saving ? (
                    <RefreshCw size={17} className="animate-spin" />
                  ) : (
                    <Save size={17} />
                  )}
                  {saving ? "Saving Changes..." : "Save Banner Changes"}
                </button>
              </div>
            </div>
          </section>

          {/* Footer */}
          <footer className="flex flex-col gap-2 border-t border-slate-200 py-5 text-xs text-slate-500 sm:flex-row sm:items-center sm:justify-between">
            <p>LIVEAZY Catalogue Management</p>
            <p>Store Management / Banners</p>
          </footer>
        </main>
      </div>
    </div>
  );
}
