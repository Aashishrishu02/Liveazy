import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
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
  Search,
  Plus,
  Pencil,
  Trash2,
  X,
  Upload,
  Image as ImageIcon,
  CheckCircle2,
  Package,
  Menu,
  IndianRupee,
  RefreshCw,
  ChevronDown,
  CircleSlash,
  Check,
  AlertCircle,
  SlidersHorizontal,
  Contact,
} from "lucide-react";

const API_URL = (import.meta.env.VITE_API_URL || "").replace(/\/$/, "");
const MAX_IMAGE_SIZE = 5 * 1024 * 1024;

type StatusFilter = "all" | "active" | "inactive";

interface Category {
  id: string;
  name: string;
  isActive: boolean;
  displayOrder?: number | null;
}

interface Product {
  id: string;
  name: string;
  description?: string | null;
  price: number | string;
  image?: string | null;
  categoryId: string;
  isActive: boolean;
  displayOrder?: number | null;
  rent12M?: number | string | null;
  deposit12M?: number | string | null;
  rent6M?: number | string | null;
  deposit6M?: number | string | null;
  rent3M?: number | string | null;
  deposit3M?: number | string | null;
}

const navigation = [
  { label: "Dashboard", path: "/admin/dashboard", icon: LayoutDashboard },
  { label: "Categories", path: "/admin/categories", icon: Tags },
  { label: "Products", path: "/admin/products", icon: Armchair },
  { label: "Banners", path: "/admin/banner", icon: Images },
  { label: "Promo Banners", path: "/admin/promo-banners", icon: Megaphone },
  { label: "WhatsApp Settings", path: "/admin/settings", icon: MessageCircle },
  { label: "Contact Management", path: "/admin/contact-management", icon: Contact },
];

function getErrorMessage(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback;
}

function toNullableNumber(value: string): number | null {
  return value.trim() === "" ? null : Number(value);
}

function formatPrice(value: number | string | null | undefined) {
  const numberValue = Number(value);
  if (!Number.isFinite(numberValue)) return "—";
  return new Intl.NumberFormat("en-IN", {
    maximumFractionDigits: 2,
  }).format(numberValue);
}

function readRentalValue(value: number | string | null | undefined) {
  return value == null || value === "" ? "" : String(value);
}

function StatusPill({ active }: { active: boolean }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1.5 text-xs font-semibold ${
        active ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-500"
      }`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${active ? "bg-emerald-500" : "bg-slate-400"}`} />
      {active ? "Active" : "Inactive"}
    </span>
  );
}

function AdminAvatar() {
  return (
    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-cyan-50 text-teal-700">
      <span className="text-[10px] font-extrabold">SA</span>
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

function RentalNumberField({
  id,
  label,
  value,
  onChange,
  placeholder,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
}) {
  return (
    <div>
      <label htmlFor={id} className="mb-2 block text-xs font-semibold leading-5 text-[#0F2942]">
        {label}
      </label>
      <div className="relative">
        <IndianRupee size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          id={id}
          type="number"
          min="0"
          step="0.01"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder={placeholder}
          className="h-10 w-full rounded-lg border border-slate-200 bg-white pl-8 pr-3 text-sm outline-none transition focus:border-[#008A90] focus:ring-2 focus:ring-[#008A90]/10"
        />
      </div>
    </div>
  );
}

export default function Products() {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const [showModal, setShowModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [image, setImage] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [rent12M, setRent12M] = useState("");
  const [deposit12M, setDeposit12M] = useState("");
  const [rent6M, setRent6M] = useState("");
  const [deposit6M, setDeposit6M] = useState("");
  const [rent3M, setRent3M] = useState("");
  const [deposit3M, setDeposit3M] = useState("");

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [sortBy, setSortBy] = useState<"newest" | "name" | "price-low" | "price-high">("newest");
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [statusUpdatingId, setStatusUpdatingId] = useState<string | null>(null);
  const [orderValues, setOrderValues] = useState<Record<string, string>>({});
  const [orderSavingId, setOrderSavingId] = useState<string | null>(null);
  const [notice, setNotice] = useState("");
  const [noticeError, setNoticeError] = useState(false);

  const showNotice = (message: string, error = false) => {
    setNotice(message);
    setNoticeError(error);
  };

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setLoadError("");
      const [productsResponse, categoriesResponse] = await Promise.all([
        fetch(`${API_URL}/products`),
        fetch(`${API_URL}/categories`),
      ]);

      if (!productsResponse.ok || !categoriesResponse.ok) {
        throw new Error(`Unable to load catalogue (products: ${productsResponse.status}, categories: ${categoriesResponse.status}).`);
      }

      const [productsData, categoriesData] = await Promise.all([
        productsResponse.json(),
        categoriesResponse.json(),
      ]);

      const productsList: Product[] = Array.isArray(productsData) ? productsData : [];
      setProducts(productsList);
      setOrderValues(
        Object.fromEntries(
          productsList.map((product) => [
            product.id,
            String(product.displayOrder ?? 0),
          ]),
        ),
      );
      setCategories(
        (Array.isArray(categoriesData) ? categoriesData as Category[] : [])
          .sort((a, b) => (a.displayOrder ?? Number.MAX_SAFE_INTEGER) - (b.displayOrder ?? Number.MAX_SAFE_INTEGER) || a.name.localeCompare(b.name)),
      );
    } catch (error) {
      console.error("Error fetching products:", error);
      setLoadError(getErrorMessage(error, "Unable to load products. Please check the backend connection."));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchData();
  }, [fetchData]);

  const resetForm = () => {
    setName("");
    setDescription("");
    setPrice("");
    setImage("");
    setCategoryId("");
    setRent12M("");
    setDeposit12M("");
    setRent6M("");
    setDeposit6M("");
    setRent3M("");
    setDeposit3M("");
    setEditingProduct(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const openAddModal = () => {
    resetForm();
    showNotice("");
    setShowModal(true);
  };

  const closeModal = () => {
    if (saving || uploading) return;
    setShowModal(false);
    resetForm();
  };

  const handleEditProduct = (product: Product) => {
    resetForm();
    setEditingProduct(product);
    setName(product.name);
    setDescription(product.description || "");
    setPrice(String(product.price ?? ""));
    setImage(product.image || "");
    setCategoryId(product.categoryId);
    setRent12M(readRentalValue(product.rent12M));
    setDeposit12M(readRentalValue(product.deposit12M));
    setRent6M(readRentalValue(product.rent6M));
    setDeposit6M(readRentalValue(product.deposit6M));
    setRent3M(readRentalValue(product.rent3M));
    setDeposit3M(readRentalValue(product.deposit3M));
    showNotice("");
    setShowModal(true);
  };

  const handleImageUpload = async (file: File) => {
    if (!file.type.startsWith("image/")) {
      showNotice("Please select a valid image file.", true);
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }
    if (file.size > MAX_IMAGE_SIZE) {
      showNotice("Image size must be less than 5 MB.", true);
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }

    try {
      setUploading(true);
      showNotice("");
      const formData = new FormData();
      formData.append("file", file);
      const response = await fetch(`${API_URL}/upload/image`, {
        method: "POST",
        body: formData,
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok || !data.url) {
        throw new Error(data.message || "Image upload failed.");
      }
      setImage(data.url);
      showNotice("Product image uploaded. Save the product to keep this change.");
    } catch (error) {
      console.error("Image upload error:", error);
      showNotice(getErrorMessage(error, "Failed to upload image."), true);
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleSaveProduct = async () => {
    if (!name.trim()) {
      showNotice("Please enter a product name.", true);
      return;
    }
    if (price.trim() === "" || !Number.isFinite(Number(price)) || Number(price) < 0) {
      showNotice("Please enter a valid non-negative base price.", true);
      return;
    }
    if (!categoryId) {
      showNotice("Please select a category.", true);
      return;
    }
    if (!categories.some((category) => category.id === categoryId)) {
      showNotice("The selected category is no longer available. Refresh and choose a category again.", true);
      return;
    }

    const rentalFields = [
      ["12-month rent", rent12M],
      ["12-month refundable deposit", deposit12M],
      ["6-month rent", rent6M],
      ["6-month refundable deposit", deposit6M],
      ["3-month rent", rent3M],
      ["3-month refundable deposit", deposit3M],
    ] as const;
    for (const [label, value] of rentalFields) {
      if (value.trim() !== "" && (!Number.isFinite(Number(value)) || Number(value) < 0)) {
        showNotice(`Enter a valid non-negative amount for ${label}.`, true);
        return;
      }
    }
    if (uploading) {
      showNotice("Please wait for the image upload to finish.", true);
      return;
    }

    const isEditing = Boolean(editingProduct);
    try {
      setSaving(true);
      showNotice("");
      const payload = {
        name: name.trim(),
        description: description.trim(),
        price: Number(price),
        image: image.trim(),
        categoryId,
        rent12M: toNullableNumber(rent12M),
        deposit12M: toNullableNumber(deposit12M),
        rent6M: toNullableNumber(rent6M),
        deposit6M: toNullableNumber(deposit6M),
        rent3M: toNullableNumber(rent3M),
        deposit3M: toNullableNumber(deposit3M),
      };
      const url = isEditing ? `${API_URL}/products/${editingProduct!.id}` : `${API_URL}/products`;
      const response = await fetch(url, {
        method: isEditing ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        const message = Array.isArray(data.message) ? data.message.join(", ") : data.message;
        throw new Error(message || (isEditing ? "Failed to update product." : "Failed to create product."));
      }
      setShowModal(false);
      resetForm();
      showNotice(isEditing ? "Product updated successfully." : "Product created successfully.");
      await fetchData();
    } catch (error) {
      console.error("Error saving product:", error);
      showNotice(getErrorMessage(error, "Unable to save product."), true);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteProduct = async (product: Product) => {
    if (!window.confirm(`Delete “${product.name}”? This action cannot be undone.`)) return;
    try {
      setDeletingId(product.id);
      showNotice("");
      const response = await fetch(`${API_URL}/products/${product.id}`, { method: "DELETE" });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(data.message || "Failed to delete product.");
      }
      setProducts((current) => current.filter((item) => item.id !== product.id));
      showNotice(`“${product.name}” deleted successfully.`);
    } catch (error) {
      console.error("Error deleting product:", error);
      showNotice(getErrorMessage(error, "Unable to delete product."), true);
    } finally {
      setDeletingId(null);
    }
  };

  const handleToggleStatus = async (product: Product) => {
    try {
      setStatusUpdatingId(product.id);
      showNotice("");
      const response = await fetch(`${API_URL}/products/${product.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !product.isActive }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.message || "Failed to update product status.");
      setProducts((current) => current.map((item) => item.id === product.id ? { ...item, isActive: !item.isActive } : item));
      showNotice(`${product.name} is now ${product.isActive ? "inactive" : "active"}.`);
    } catch (error) {
      console.error("Error updating product status:", error);
      showNotice(getErrorMessage(error, "Failed to update product status."), true);
    } finally {
      setStatusUpdatingId(null);
    }
  };

  const handleSaveDisplayOrder = async (product: Product) => {
    const rawOrder = orderValues[product.id] ?? String(product.displayOrder ?? 0);
    const displayOrder = Number(rawOrder);

    if (
      rawOrder.trim() === "" ||
      !Number.isInteger(displayOrder) ||
      displayOrder < 0
    ) {
      showNotice("Enter a valid whole number greater than or equal to 0.", true);
      return;
    }

    try {
      setOrderSavingId(product.id);
      showNotice("");

      const response = await fetch(`${API_URL}/products/${product.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ displayOrder }),
      });
      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        const message = Array.isArray(data.message)
          ? data.message.join(", ")
          : data.message;
        throw new Error(message || "Failed to update product order.");
      }

      await fetchData();
      showNotice(`Display order saved for "${product.name}".`);
    } catch (error) {
      console.error("Error saving product order:", error);
      showNotice(getErrorMessage(error, "Unable to save product order."), true);
    } finally {
      setOrderSavingId(null);
    }
  };

  const filteredProducts = useMemo(() => {
    const query = search.trim().toLowerCase();
    return products
      .filter((product) => {
        const categoryName = categories.find((category) => category.id === product.categoryId)?.name || "";
        const matchesSearch = [product.name, product.description || "", categoryName]
          .join(" ")
          .toLowerCase()
          .includes(query);
        const matchesStatus = statusFilter === "all" || (statusFilter === "active" && product.isActive) || (statusFilter === "inactive" && !product.isActive);
        const matchesCategory = categoryFilter === "all" || product.categoryId === categoryFilter;
        return matchesSearch && matchesStatus && matchesCategory;
      })
      .sort((a, b) => {
        if (sortBy === "name") return a.name.localeCompare(b.name);
        if (sortBy === "price-low") return Number(a.price) - Number(b.price);
        if (sortBy === "price-high") return Number(b.price) - Number(a.price);
        return 0;
      });
  }, [products, categories, search, statusFilter, categoryFilter, sortBy]);

  const activeCount = products.filter((product) => product.isActive).length;
  const inactiveCount = products.length - activeCount;
  const productsWithImage = products.filter((product) => Boolean(product.image)).length;

  const logout = () => {
    localStorage.removeItem("token");
    navigate("/admin");
  };

  return (
    <div className="min-h-screen bg-[#F6F8FD] text-[#142B43]">
      {sidebarOpen && (
        <button type="button" aria-label="Close navigation" onClick={() => setSidebarOpen(false)} className="fixed inset-0 z-40 bg-[#0F2942]/40 lg:hidden" />
      )}

      {/* Shared admin sidebar — consistent across LIVEAZY admin pages */}
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
          <nav className="space-y-1.5">
            {navigation.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink key={item.path} to={item.path} onClick={() => setSidebarOpen(false)} className={({ isActive }) => `flex items-center gap-3 rounded-lg px-3 py-3 text-sm font-semibold transition ${isActive ? "bg-[#0F2942] text-white shadow-sm" : "text-slate-600 hover:bg-slate-100 hover:text-[#0F2942]"}`}>
                  <Icon size={19} strokeWidth={1.8} />{item.label}
                </NavLink>
              );
            })}
          </nav>
          <div className="my-6 border-t border-slate-100" />
          <NavLink to="/" onClick={() => setSidebarOpen(false)} className="flex items-center gap-3 rounded-lg px-3 py-3 text-sm font-semibold text-slate-600 transition hover:bg-slate-100 hover:text-[#0F2942]"><Store size={19} />View Website</NavLink>
        </div>
        <div className="border-t border-slate-100 p-4"><button type="button" onClick={logout} className="flex w-full items-center justify-center gap-2 rounded-lg px-4 py-3 text-sm font-semibold text-red-600 transition hover:bg-red-50"><LogOut size={18} />Log Out</button></div>
      </aside>

      <div className="min-h-screen lg:pl-[260px]">
        <header className="sticky top-0 z-30 flex min-h-[72px] items-center justify-between gap-3 border-b border-slate-200 bg-white/95 px-4 backdrop-blur-md sm:px-6 lg:px-8">
          <div className="flex min-w-0 flex-1 items-center gap-3">
            <button type="button" aria-label="Open navigation" onClick={() => setSidebarOpen(true)} className="rounded-lg border border-slate-200 p-2 hover:bg-slate-50 lg:hidden"><Menu size={20} /></button>
            <div className="relative max-w-[540px] flex-1">
              <Search size={17} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
              <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search product, description or category..." className="h-10 w-full rounded-lg border border-transparent bg-[#F0F4FF] pl-9 pr-4 text-sm outline-none transition placeholder:text-slate-500 focus:border-teal-300 focus:bg-white" />
            </div>
          </div>
          <div className="hidden items-center gap-3 sm:flex">
            <span className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-700"><span className="h-2 w-2 rounded-full bg-emerald-500" />Admin workspace</span>
            <div className="flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-2"><AdminAvatar /><div><p className="text-xs font-bold text-[#0F2942]">Super Admin</p><p className="text-[10px] text-slate-500">admin@liveazy.in</p></div></div>
          </div>
        </header>

        <main className="mx-auto max-w-[1600px] space-y-6 px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
          <section className="flex flex-col justify-between gap-4 xl:flex-row xl:items-center">
            <div>
              <div className="mb-2 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500"><span>Admin</span><span>/</span><span className="text-teal-700">Catalogue Operations</span></div>
              <h1 className="text-3xl font-extrabold tracking-tight text-[#0F2942] sm:text-4xl">Manage Products</h1>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">Manage your product catalogue, images, categories, rental plans and refundable deposits from one place.</p>
            </div>
            <button type="button" onClick={openAddModal} className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#0F2942] px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-[#193D5C]"><Plus size={18} />Add Product</button>
          </section>

          {notice && !showModal && (
            <div role="status" className={`flex items-start gap-2 rounded-xl border p-3 text-sm ${noticeError ? "border-red-200 bg-red-50 text-red-700" : "border-teal-100 bg-white text-[#0F2942]"}`}>
              <AlertCircle size={18} className="mt-0.5 shrink-0" /><span className="flex-1 break-words">{notice}</span><button type="button" aria-label="Dismiss message" onClick={() => showNotice("")}><X size={16} /></button>
            </div>
          )}

          <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard title="Total Products" value={loading ? "—" : products.length} subtitle="All products in the catalogue" icon={<Package size={19} />} iconClass="bg-blue-50 text-[#0F2942]" />
            <StatCard title="Active Products" value={loading ? "—" : activeCount} subtitle="Available on your storefront" icon={<CheckCircle2 size={19} />} iconClass="bg-emerald-50 text-emerald-700" />
            <StatCard title="Inactive Products" value={loading ? "—" : inactiveCount} subtitle="Currently hidden or unavailable" icon={<CircleSlash size={19} />} iconClass="bg-orange-50 text-orange-600" />
            <StatCard title="With Images" value={loading ? "—" : productsWithImage} subtitle="Products with an uploaded image" icon={<ImageIcon size={19} />} iconClass="bg-cyan-50 text-teal-700" />
          </section>

          <section className="overflow-hidden rounded-xl border border-slate-100 bg-white shadow-sm">
            <div className="flex flex-col gap-4 border-b border-slate-100 p-4 sm:p-5">
              <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                <div><h2 className="text-base font-extrabold text-[#0F2942]">Product Directory</h2><p className="mt-1 text-xs text-slate-500">Search and filter products, review rental pricing, or edit catalogue details.</p></div>
                <button type="button" onClick={() => void fetchData()} disabled={loading} className="inline-flex h-10 items-center justify-center gap-2 self-start rounded-lg border border-slate-200 px-3 text-xs font-semibold text-[#0F2942] transition hover:bg-slate-50 disabled:opacity-50 lg:self-auto"><RefreshCw size={15} className={loading ? "animate-spin" : ""} />Refresh catalogue</button>
              </div>

              <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-[1fr_220px_180px_180px]">
                <div className="relative">
                  <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search product or category..." className="h-10 w-full rounded-lg border border-slate-200 bg-white pl-9 pr-3 text-sm outline-none transition focus:border-teal-500" />
                </div>
                <div className="relative">
                  <select value={categoryFilter} onChange={(event) => setCategoryFilter(event.target.value)} aria-label="Filter by category" className="h-10 w-full appearance-none rounded-lg border border-slate-200 bg-white px-3 pr-9 text-sm text-slate-600 outline-none focus:border-teal-500"><option value="all">All categories</option>{categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}</select>
                  <ChevronDown size={15} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
                </div>
                <div className="relative">
                  <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value as StatusFilter)} aria-label="Filter by product status" className="h-10 w-full appearance-none rounded-lg border border-slate-200 bg-white px-3 pr-9 text-sm text-slate-600 outline-none focus:border-teal-500"><option value="all">All statuses</option><option value="active">Active only</option><option value="inactive">Inactive only</option></select>
                  <ChevronDown size={15} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
                </div>
                <div className="relative">
                  <select value={sortBy} onChange={(event) => setSortBy(event.target.value as typeof sortBy)} aria-label="Sort products" className="h-10 w-full appearance-none rounded-lg border border-slate-200 bg-white px-3 pr-9 text-sm text-slate-600 outline-none focus:border-teal-500"><option value="newest">Default order</option><option value="name">Name: A–Z</option><option value="price-low">Price: Low to high</option><option value="price-high">Price: High to low</option></select>
                  <ChevronDown size={15} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
                </div>
              </div>
              <div className="flex items-center justify-between gap-3 text-xs text-slate-500"><span className="inline-flex items-center gap-2"><SlidersHorizontal size={14} />{filteredProducts.length} of {products.length} products shown</span><button type="button" onClick={() => { setSearch(""); setCategoryFilter("all"); setStatusFilter("all"); setSortBy("newest"); }} className="font-semibold text-teal-700 hover:underline">Clear filters</button></div>
            </div>

            {loadError && <div className="m-5 rounded-lg border border-red-100 bg-red-50 p-4 text-sm text-red-700"><p>{loadError}</p><button type="button" onClick={() => void fetchData()} className="mt-2 font-bold underline">Try again</button></div>}

            <div className="overflow-x-auto">
              <table className="w-full min-w-[1320px] text-left">
                <thead className="bg-[#F3F6FE]">
                  <tr className="border-b border-slate-100">
                    {[
                      "Product",
                      "Category",
                      "Display Order",
                      "Base Price",
                      "12-Month Plan",
                      "6-Month Plan",
                      "3-Month Plan",
                      "Status",
                      "Actions",
                    ].map((heading) => <th key={heading} className="px-4 py-4 text-[10px] font-extrabold uppercase tracking-wider text-slate-500">{heading}</th>)}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {loading && <tr><td colSpan={9} className="px-6 py-16 text-center text-sm text-slate-500"><RefreshCw size={18} className="mx-auto mb-2 animate-spin" />Loading products...</td></tr>}
                  {!loading && !loadError && filteredProducts.length === 0 && <tr><td colSpan={9} className="px-6 py-16 text-center"><div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-400"><Package size={23} /></div><p className="mt-3 font-semibold text-[#0F2942]">{products.length === 0 ? "No products yet" : "No matching products"}</p><p className="mt-1 text-sm text-slate-500">{products.length === 0 ? "Add your first product to get started." : "Try another search or clear the filters."}</p>{products.length === 0 && <button type="button" onClick={openAddModal} className="mt-4 inline-flex items-center gap-2 rounded-lg bg-[#0F2942] px-4 py-2 text-sm font-semibold text-white"><Plus size={16} />Add Product</button>}</td></tr>}
                  {!loading && !loadError && filteredProducts.map((product) => {
                    const category = categories.find((item) => item.id === product.categoryId);
                    return (
                      <tr key={product.id} className={`transition hover:bg-[#F8FAFC] ${!product.isActive ? "bg-slate-50/60" : ""}`}>
                        <td className="max-w-[270px] px-4 py-4">
                          <div className="flex items-center gap-3">
                            <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-slate-100 bg-[#F3F6FE]">
                              {product.image ? <img src={product.image} alt={product.name} className="h-full w-full object-cover" onError={(event) => { event.currentTarget.style.display = "none"; }} /> : <ImageIcon size={20} className="text-slate-300" />}
                            </div>
                            <div className="min-w-0"><p className={`truncate font-bold ${product.isActive ? "text-[#0F2942]" : "text-slate-500"}`}>{product.name}</p><p className="mt-1 line-clamp-2 text-xs leading-5 text-slate-500">{product.description || "No description added"}</p></div>
                          </div>
                        </td>
                        <td className="px-4 py-4"><span className="inline-flex max-w-[150px] rounded-md bg-slate-100 px-2.5 py-1.5 text-xs font-semibold text-slate-600">{category?.name || "Unknown category"}</span></td>
                        <td className="px-4 py-4">
                          <div className="flex items-center gap-2">
                            <input
                              type="number"
                              min="0"
                              step="1"
                              aria-label={`Display order for ${product.name}`}
                              value={orderValues[product.id] ?? String(product.displayOrder ?? 0)}
                              onChange={(event) =>
                                setOrderValues((current) => ({
                                  ...current,
                                  [product.id]: event.target.value,
                                }))
                              }
                              className="h-9 w-20 rounded-lg border border-slate-200 px-2 text-sm outline-none focus:border-teal-500"
                            />
                            <button
                              type="button"
                              onClick={() => void handleSaveDisplayOrder(product)}
                              disabled={orderSavingId === product.id}
                              className="inline-flex items-center gap-1.5 rounded-lg bg-[#0F2942] px-3 py-2 text-xs font-semibold text-white transition hover:bg-[#193D5C] disabled:opacity-50"
                            >
                              {orderSavingId === product.id ? (
                                <RefreshCw size={13} className="animate-spin" />
                              ) : (
                                <Check size={13} />
                              )}
                              Save
                            </button>
                          </div>
                        </td>
                        <td className="px-4 py-4"><span className="inline-flex items-center whitespace-nowrap text-sm font-bold text-[#0F2942]"><IndianRupee size={14} />{formatPrice(product.price)}</span></td>
                        <td className="px-4 py-4"><RentalPlanSummary rent={product.rent12M} deposit={product.deposit12M} /></td>
                        <td className="px-4 py-4"><RentalPlanSummary rent={product.rent6M} deposit={product.deposit6M} /></td>
                        <td className="px-4 py-4"><RentalPlanSummary rent={product.rent3M} deposit={product.deposit3M} /></td>
                        <td className="px-4 py-4"><button type="button" disabled={statusUpdatingId === product.id} onClick={() => void handleToggleStatus(product)} title="Click to toggle product availability" className="disabled:opacity-50"><StatusPill active={product.isActive} />{statusUpdatingId === product.id && <RefreshCw size={12} className="ml-2 inline animate-spin" />}</button></td>
                        <td className="px-4 py-4"><div className="flex items-center justify-end gap-1.5"><button type="button" onClick={() => handleEditProduct(product)} title="Edit product" aria-label={`Edit ${product.name}`} className="rounded-lg p-2 text-slate-500 transition hover:bg-cyan-50 hover:text-teal-700"><Pencil size={16} /></button><button type="button" disabled={deletingId === product.id} onClick={() => void handleDeleteProduct(product)} title="Delete product" aria-label={`Delete ${product.name}`} className="rounded-lg p-2 text-slate-500 transition hover:bg-red-50 hover:text-red-600 disabled:opacity-40">{deletingId === product.id ? <RefreshCw size={16} className="animate-spin" /> : <Trash2 size={16} />}</button></div></td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <div className="flex flex-col gap-2 border-t border-slate-100 bg-[#F3F6FE] px-5 py-4 text-xs text-slate-500 sm:flex-row sm:items-center sm:justify-between"><p>Showing {filteredProducts.length} of {products.length} products</p><p>LIVEAZY Catalogue Management</p></div>
          </section>

          <footer className="flex flex-col justify-between gap-2 border-t border-slate-200 py-5 text-xs text-slate-400 sm:flex-row sm:items-center"><p>© {new Date().getFullYear()} LIVEAZY. Rental Commerce Hub.</p><p>Admin Workspace</p></footer>
        </main>
      </div>

      {showModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center overflow-y-auto bg-[#0F2942]/50 p-4 backdrop-blur-sm" onMouseDown={(event) => { if (event.target === event.currentTarget) closeModal(); }}>
          <div className="my-auto flex max-h-[92vh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-200 px-5 py-5 sm:px-6">
              <div><p className="text-[10px] font-bold uppercase tracking-[0.15em] text-teal-700">Catalogue Management</p><h2 className="mt-1 text-xl font-extrabold text-[#0F2942]">{editingProduct ? "Edit Product" : "Add New Product"}</h2><p className="mt-1 text-sm text-slate-500">Update product details, media and rental pricing.</p></div>
              <button type="button" onClick={closeModal} disabled={saving || uploading} aria-label="Close modal" className="rounded-lg p-2 text-slate-400 transition hover:bg-slate-100 disabled:opacity-50"><X size={20} /></button>
            </div>

            <div className="space-y-6 overflow-y-auto p-5 sm:p-6">
              {notice && <div role="status" className={`flex items-start gap-2 rounded-lg p-3 text-sm ${noticeError ? "bg-red-50 text-red-700" : "bg-teal-50 text-teal-800"}`}><AlertCircle size={17} className="mt-0.5 shrink-0" /><span>{notice}</span></div>}

              <section className="space-y-4">
                <div><h3 className="text-sm font-extrabold text-[#0F2942]">Basic information</h3><p className="mt-1 text-xs text-slate-500">Product name, category and base price.</p></div>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div className="md:col-span-2"><label htmlFor="product-name" className="mb-2 block text-sm font-semibold text-[#0F2942]">Product Name <span className="text-red-500">*</span></label><input id="product-name" type="text" value={name} onChange={(event) => setName(event.target.value)} placeholder="e.g. Modern 3-Seater Sofa" maxLength={150} required className="h-11 w-full rounded-lg border border-slate-200 px-4 text-sm outline-none transition placeholder:text-slate-400 focus:border-teal-600 focus:ring-2 focus:ring-teal-600/10" /></div>
                  <div><label htmlFor="product-category" className="mb-2 block text-sm font-semibold text-[#0F2942]">Category <span className="text-red-500">*</span></label><select id="product-category" value={categoryId} onChange={(event) => setCategoryId(event.target.value)} required className="h-11 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm outline-none focus:border-teal-600 focus:ring-2 focus:ring-teal-600/10"><option value="">Select category</option>{categories.filter((category) => category.isActive || category.id === editingProduct?.categoryId).map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}</select>{categories.filter((category) => category.isActive).length === 0 && <p className="mt-1 text-xs text-amber-700">No active categories found. Activate a category before creating a product.</p>}</div>
                  <div><label htmlFor="product-price" className="mb-2 block text-sm font-semibold text-[#0F2942]">Base Price (₹) <span className="text-red-500">*</span></label><div className="relative"><IndianRupee size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" /><input id="product-price" type="number" min="0" step="0.01" value={price} onChange={(event) => setPrice(event.target.value)} placeholder="Enter base price" required className="h-11 w-full rounded-lg border border-slate-200 pl-9 pr-4 text-sm outline-none transition focus:border-teal-600 focus:ring-2 focus:ring-teal-600/10" /></div><p className="mt-1 text-xs text-slate-400">Kept for compatibility with existing product data.</p></div>
                </div>
              </section>

              <section className="space-y-4 rounded-xl border border-slate-200 bg-[#F8FAFC] p-4 sm:p-5">
                <div><h3 className="text-sm font-extrabold text-[#0F2942]">Rental plans</h3><p className="mt-1 text-xs leading-5 text-slate-500">Add monthly rent and refundable deposit for each duration. Leave a field empty if that amount does not apply.</p></div>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <RentalNumberField id="rent-12m" label="12-month plan · Monthly rent (₹)" value={rent12M} onChange={setRent12M} placeholder="e.g. 999" />
                  <RentalNumberField id="deposit-12m" label="12-month plan · Refundable deposit (₹)" value={deposit12M} onChange={setDeposit12M} placeholder="e.g. 3000" />
                  <RentalNumberField id="rent-6m" label="6-month plan · Monthly rent (₹)" value={rent6M} onChange={setRent6M} placeholder="e.g. 1199" />
                  <RentalNumberField id="deposit-6m" label="6-month plan · Refundable deposit (₹)" value={deposit6M} onChange={setDeposit6M} placeholder="e.g. 3000" />
                  <RentalNumberField id="rent-3m" label="3-month plan · Monthly rent (₹)" value={rent3M} onChange={setRent3M} placeholder="e.g. 1499" />
                  <RentalNumberField id="deposit-3m" label="3-month plan · Refundable deposit (₹)" value={deposit3M} onChange={setDeposit3M} placeholder="e.g. 3000" />
                </div>
              </section>

              <section className="space-y-4">
                <div><h3 className="text-sm font-extrabold text-[#0F2942]">Product image</h3><p className="mt-1 text-xs text-slate-500">Upload a clear product image (maximum 5 MB).</p></div>
                <input ref={fileInputRef} id="product-image" type="file" accept="image/jpeg,image/png,image/webp,image/gif" onChange={(event) => { const file = event.target.files?.[0]; if (file) void handleImageUpload(file); }} className="hidden" />
                <div className="rounded-xl border-2 border-dashed border-slate-200 bg-[#F8FAFC] p-4">
                  {image ? <div className="mb-4 flex items-center gap-4"><img src={image} alt="Product preview" className="h-24 w-24 rounded-lg border border-slate-200 bg-white object-cover" onError={(event) => { event.currentTarget.style.display = "none"; }} /><div className="min-w-0 flex-1"><p className="text-sm font-semibold text-[#0F2942]">Image preview</p><p className="mt-1 break-all text-xs text-slate-500">Image URL ready to save</p><button type="button" onClick={() => { setImage(""); if (fileInputRef.current) fileInputRef.current.value = ""; }} className="mt-2 text-xs font-semibold text-red-600 hover:underline">Remove image</button></div></div> : <div className="mb-3 flex h-20 items-center justify-center rounded-lg bg-white text-slate-300"><ImageIcon size={30} /></div>}
                  <label htmlFor="product-image" className="flex cursor-pointer flex-col items-center justify-center rounded-lg px-4 py-4 text-center transition hover:bg-white hover:text-teal-700"><span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-teal-700 shadow-sm">{uploading ? <RefreshCw size={20} className="animate-spin" /> : <Upload size={20} />}</span><span className="mt-3 text-sm font-semibold text-[#0F2942]">{uploading ? "Uploading image…" : image ? "Change product image" : "Click to upload product image"}</span><span className="mt-1 text-xs text-slate-400">JPG, PNG, GIF or WebP · Maximum 5 MB</span></label>
                </div>
              </section>

              <section><label htmlFor="product-description" className="mb-2 block text-sm font-semibold text-[#0F2942]">Description</label><textarea id="product-description" value={description} onChange={(event) => setDescription(event.target.value)} placeholder="Describe the product, condition or key features…" rows={4} maxLength={1500} className="w-full resize-y rounded-lg border border-slate-200 px-4 py-3 text-sm leading-6 outline-none transition placeholder:text-slate-400 focus:border-teal-600 focus:ring-2 focus:ring-teal-600/10" /><p className="mt-1 text-right text-xs text-slate-400">{description.length}/1500</p></section>
            </div>

            <div className="flex flex-col-reverse gap-3 border-t border-slate-200 bg-[#F8FAFC] px-5 py-4 sm:flex-row sm:justify-between sm:px-6">
              <p className="self-center text-xs text-slate-400">Fields marked * are required.</p>
              <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end"><button type="button" onClick={closeModal} disabled={saving || uploading} className="rounded-lg border border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold text-slate-600 transition hover:bg-slate-50 disabled:opacity-50">Cancel</button><button type="button" onClick={() => void handleSaveProduct()} disabled={saving || uploading || !name.trim() || !categoryId || price.trim() === ""} className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#0F2942] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#193D5C] disabled:cursor-not-allowed disabled:opacity-50">{saving ? <><RefreshCw size={16} className="animate-spin" />Saving…</> : <><Check size={16} />{editingProduct ? "Save Changes" : "Create Product"}</>}</button></div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function RentalPlanSummary({
  rent,
  deposit,
}: {
  rent: number | string | null | undefined;
  deposit: number | string | null | undefined;
}) {
  const hasRent = rent !== null && rent !== undefined && rent !== "" && Number(rent) > 0;
  const hasDeposit = deposit !== null && deposit !== undefined && deposit !== "" && Number(deposit) >= 0;
  if (!hasRent && !hasDeposit) {
    return <span className="inline-flex rounded-md bg-slate-100 px-2.5 py-1.5 text-xs font-medium text-slate-400">Not set</span>;
  }
  return (
    <div className="min-w-[112px] space-y-1">
      <p className="whitespace-nowrap text-sm font-bold text-[#0F2942]">{hasRent ? `₹${formatPrice(rent)}/mo` : "Rent not set"}</p>
      <p className="whitespace-nowrap text-[11px] text-slate-500">Deposit: {hasDeposit ? `₹${formatPrice(deposit)}` : "—"}</p>
    </div>
  );
}
