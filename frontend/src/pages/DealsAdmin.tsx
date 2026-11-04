import { useEffect, useState, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  Plus,
  Pencil,
  Trash2,
  RefreshCw,
  Search,
  Check,
  X,
  Flame,
  Clock,
  Calendar,
  AlertCircle,
  CheckCircle2,
  CircleSlash,
  ChevronDown,
  Layers,
  Package,
  Sparkles,
  Percent,
  Tag,
  Gift,
  Zap,
  Armchair,
  Bed,
  Utensils,
  Tv,
  BookOpen,
  Award,
  Heart,
  Save,
} from "lucide-react";
import { getApiBaseUrl } from "../utils/api";
import AdminSidebar from "../components/AdminSidebar";
import AdminHeader from "../components/AdminHeader";
import ImageUpload from "../components/ImageUpload";

interface Product {
  id: string;
  name: string;
  price: number;
  image?: string | null;
  category?: { name?: string } | string | null;
}

interface DealProductItem {
  id: string;
  productId: string;
  sortOrder: number;
  product: Product;
}

interface Deal {
  id: string;
  title: string;
  subtitle?: string | null;
  description?: string | null;
  image?: string | null;
  originalPrice: number;
  offerPrice: number;
  discountPercent?: number | null;
  startsAt: string;
  endsAt: string;
  isActive: boolean;
  sortOrder: number;
  products: DealProductItem[];
}

type StatusFilter = "all" | "active" | "upcoming" | "expired" | "inactive";
type SortOption = "order" | "discount" | "price_asc" | "price_desc" | "ending_soon";

const CATEGORY_ICON_LIST = [
  { name: "Flame", label: "Flame", icon: Flame },
  { name: "Package", label: "Package", icon: Package },
  { name: "Sparkles", label: "Sparkles", icon: Sparkles },
  { name: "Percent", label: "Percent", icon: Percent },
  { name: "Tag", label: "Tag", icon: Tag },
  { name: "Gift", label: "Gift", icon: Gift },
  { name: "Zap", label: "Flash", icon: Zap },
  { name: "Layers", label: "Layers", icon: Layers },
  { name: "Armchair", label: "Sofa", icon: Armchair },
  { name: "Bed", label: "Bed", icon: Bed },
  { name: "Utensils", label: "Dining", icon: Utensils },
  { name: "Tv", label: "TV", icon: Tv },
  { name: "BookOpen", label: "Study", icon: BookOpen },
  { name: "Award", label: "Award", icon: Award },
  { name: "Heart", label: "Heart", icon: Heart },
];

function renderCategoryIcon(name: string, size = 26) {
  const item = CATEGORY_ICON_LIST.find((i) => i.name.toLowerCase() === (name || "").toLowerCase());
  const IconComp = item ? item.icon : Flame;
  return <IconComp size={size} className="stroke-[2.2]" />;
}

export default function DealsAdmin() {
  const navigate = useNavigate();
  const apiBase = getApiBaseUrl();

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [deals, setDeals] = useState<Deal[]>([]);
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Category Icon & Image Settings State (for circular category on homepage)
  const [categoryIcon, setCategoryIcon] = useState("Flame");
  const [categoryImage, setCategoryImage] = useState<string>("");
  const [savingCategorySettings, setSavingCategorySettings] = useState(false);
  const [categorySettingsSuccess, setCategorySettingsSuccess] = useState<string | null>(null);

  // Search & Filter state
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [sortOption, setSortOption] = useState<SortOption>("order");

  // Modal form state
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [subtitle, setSubtitle] = useState("");
  const [description, setDescription] = useState("");
  const [image, setImage] = useState("");
  const [originalPrice, setOriginalPrice] = useState<number>(0);
  const [offerPrice, setOfferPrice] = useState<number>(0);
  const [discountPercent, setDiscountPercent] = useState<number>(0);
  const [startsAt, setStartsAt] = useState("");
  const [endsAt, setEndsAt] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [sortOrder, setSortOrder] = useState<number>(0);
  const [selectedProductIds, setSelectedProductIds] = useState<string[]>([]);
  const [productSearch, setProductSearch] = useState("");
  const [saving, setSaving] = useState(false);

  const getToken = () => localStorage.getItem("token");

  const loadData = useCallback(async () => {
    const token = getToken();
    if (!token) {
      navigate("/admin");
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const [dealsRes, productsRes, catRes] = await Promise.all([
        fetch(`${apiBase}/deals`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch(`${apiBase}/products`),
        fetch(`${apiBase}/deals/category-settings`).catch(() => null),
      ]);

      if (!dealsRes.ok) {
        if (dealsRes.status === 401 || dealsRes.status === 403) {
          navigate("/admin");
          return;
        }
        throw new Error("Failed to load deals");
      }

      const dealsData = await dealsRes.json();
      setDeals(Array.isArray(dealsData) ? dealsData : []);

      if (productsRes.ok) {
        const prodData = await productsRes.json();
        const list = Array.isArray(prodData)
          ? prodData
          : prodData && typeof prodData === "object" && "data" in prodData
          ? (prodData as { data: Product[] }).data
          : [];
        setAllProducts(list);
      }

      if (catRes && catRes.ok) {
        const catData = await catRes.json();
        if (catData?.icon) setCategoryIcon(catData.icon);
        if (catData?.image) setCategoryImage(catData.image);
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Error loading data");
    } finally {
      setLoading(false);
    }
  }, [apiBase, navigate]);

  const handleSaveCategorySettings = async () => {
    const token = getToken();
    if (!token) return;

    try {
      setSavingCategorySettings(true);
      setError(null);

      const res = await fetch(`${apiBase}/deals/category-settings`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          icon: categoryIcon,
          image: categoryImage.trim() || null,
        }),
      });

      if (!res.ok) {
        throw new Error("Failed to save category icon and image settings");
      }

      setCategorySettingsSuccess("Category settings saved! Customer circular Deals & Offers category updated.");
      setTimeout(() => setCategorySettingsSuccess(null), 4000);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Error saving category settings");
    } finally {
      setSavingCategorySettings(false);
    }
  };

  useEffect(() => {
    void loadData();
  }, [loadData]);

  // Price & discount calculation helpers
  const handleOriginalPriceChange = (val: number) => {
    setOriginalPrice(val);
    if (val > 0 && offerPrice > 0 && val >= offerPrice) {
      setDiscountPercent(Math.round(((val - offerPrice) / val) * 100));
    }
  };

  const handleOfferPriceChange = (val: number) => {
    setOfferPrice(val);
    if (originalPrice > 0 && val > 0 && originalPrice >= val) {
      setDiscountPercent(Math.round(((originalPrice - val) / originalPrice) * 100));
    }
  };

  const toggleProduct = (productId: string) => {
    setSelectedProductIds((prev) => {
      const exists = prev.includes(productId);
      const next = exists ? prev.filter((id) => id !== productId) : [...prev, productId];

      // Auto update original price from regular rents if available
      const sumRent = next.reduce((acc, id) => {
        const prod = allProducts.find((p) => p.id === id);
        return acc + (prod?.price || 0);
      }, 0);

      if (sumRent > 0) {
        setOriginalPrice(sumRent);
        if (offerPrice > 0 && sumRent >= offerPrice) {
          setDiscountPercent(Math.round(((sumRent - offerPrice) / sumRent) * 100));
        }
      }
      return next;
    });
  };

  // Helper to format Date to datetime-local input string
  const toDateTimeLocal = (isoStr?: string | null) => {
    if (!isoStr) return "";
    const date = new Date(isoStr);
    if (Number.isNaN(date.getTime())) return "";
    const pad = (n: number) => String(n).padStart(2, "0");
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(
      date.getHours()
    )}:${pad(date.getMinutes())}`;
  };

  const openCreateModal = () => {
    setEditingId(null);
    setTitle("");
    setSubtitle("");
    setDescription("");
    setImage("");
    setOriginalPrice(0);
    setOfferPrice(0);
    setDiscountPercent(0);

    // Default to this week (Starts now, ends in 7 days)
    const now = new Date();
    const nextWeek = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    setStartsAt(toDateTimeLocal(now.toISOString()));
    setEndsAt(toDateTimeLocal(nextWeek.toISOString()));

    setIsActive(true);
    setSortOrder(deals.length);
    setSelectedProductIds([]);
    setProductSearch("");
    setModalOpen(true);
  };

  const openEditModal = (deal: Deal) => {
    setEditingId(deal.id);
    setTitle(deal.title);
    setSubtitle(deal.subtitle || "");
    setDescription(deal.description || "");
    setImage(deal.image || "");
    setOriginalPrice(deal.originalPrice);
    setOfferPrice(deal.offerPrice);
    setDiscountPercent(deal.discountPercent || 0);
    setStartsAt(toDateTimeLocal(deal.startsAt));
    setEndsAt(toDateTimeLocal(deal.endsAt));
    setIsActive(deal.isActive);
    setSortOrder(deal.sortOrder);
    setSelectedProductIds(deal.products.map((p) => p.productId));
    setProductSearch("");
    setModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const token = getToken();
    if (!token) return;

    if (!title.trim()) {
      setError("Please enter a deal title");
      return;
    }
    if (offerPrice <= 0) {
      setError("Please enter a valid monthly offer price");
      return;
    }
    if (!startsAt || !endsAt) {
      setError("Please specify both start and end dates for the deal schedule");
      return;
    }
    if (new Date(endsAt).getTime() <= new Date(startsAt).getTime()) {
      setError("Deal end date must be after the start date");
      return;
    }

    try {
      setSaving(true);
      setError(null);

      const payload = {
        title: title.trim(),
        subtitle: subtitle.trim() || null,
        description: description.trim() || null,
        image: image || null,
        originalPrice: Number(originalPrice) || Number(offerPrice),
        offerPrice: Number(offerPrice),
        discountPercent: Number(discountPercent) || 0,
        startsAt: new Date(startsAt).toISOString(),
        endsAt: new Date(endsAt).toISOString(),
        isActive,
        sortOrder: Number(sortOrder) || 0,
        productIds: selectedProductIds,
      };

      const url = editingId ? `${apiBase}/deals/${editingId}` : `${apiBase}/deals`;
      const method = editingId ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.message || "Failed to save weekly deal");
      }

      setSuccess(editingId ? "Weekly deal updated successfully" : "Weekly deal scheduled successfully");
      setTimeout(() => setSuccess(null), 4000);
      setModalOpen(false);
      await loadData();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Error saving deal");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string, dealTitle: string) => {
    if (!window.confirm(`Delete deal "${dealTitle}"? This cannot be undone.`)) {
      return;
    }
    const token = getToken();
    if (!token) return;

    try {
      const res = await fetch(`${apiBase}/deals/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) throw new Error("Failed to delete deal");
      setSuccess("Deal deleted successfully");
      setTimeout(() => setSuccess(null), 3000);
      await loadData();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Error deleting deal");
    }
  };

  const handleToggleActive = async (deal: Deal) => {
    const token = getToken();
    if (!token) return;

    try {
      const res = await fetch(`${apiBase}/deals/${deal.id}/status`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ isActive: !deal.isActive }),
      });

      if (!res.ok) throw new Error("Failed to update deal status");
      await loadData();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Error updating status");
    }
  };

  // Status classification helper
  const getDealStatus = (deal: Deal) => {
    const now = Date.now();
    const start = new Date(deal.startsAt).getTime();
    const end = new Date(deal.endsAt).getTime();

    if (!deal.isActive) {
      return { key: "inactive", label: "Inactive", color: "bg-slate-100 text-slate-600", dot: "bg-slate-400" };
    }
    if (now < start) {
      return { key: "upcoming", label: "Upcoming / Scheduled", color: "bg-blue-100 text-blue-800", dot: "bg-blue-600" };
    }
    if (now > end) {
      return { key: "expired", label: "Expired", color: "bg-red-100 text-red-700", dot: "bg-red-500" };
    }
    return { key: "active", label: "Active Now", color: "bg-cyan-100 text-teal-800", dot: "bg-teal-600" };
  };

  // Filtered Products for the modal picker
  const filteredModalProducts = useMemo(() => {
    if (!productSearch.trim()) return allProducts;
    const q = productSearch.toLowerCase();
    return allProducts.filter((p) => p.name.toLowerCase().includes(q));
  }, [allProducts, productSearch]);

  // Statistics (Matching Categories.tsx design)
  const stats = useMemo(() => {
    const now = Date.now();
    let active = 0;
    let upcoming = 0;
    let expired = 0;

    deals.forEach((d) => {
      if (!d.isActive) {
        expired += 1;
      } else {
        const start = new Date(d.startsAt).getTime();
        const end = new Date(d.endsAt).getTime();
        if (now >= start && now <= end) active += 1;
        else if (now < start) upcoming += 1;
        else expired += 1;
      }
    });

    return {
      total: deals.length,
      active,
      upcoming,
      expired,
    };
  }, [deals]);

  // Filtering & Sorting
  const filteredDeals = useMemo(() => {
    const q = search.trim().toLowerCase();

    return deals
      .filter((deal) => {
        const matchesSearch =
          !q ||
          deal.title.toLowerCase().includes(q) ||
          (deal.subtitle && deal.subtitle.toLowerCase().includes(q)) ||
          (deal.description && deal.description.toLowerCase().includes(q)) ||
          deal.products.some((p) => p.product?.name?.toLowerCase().includes(q));

        const status = getDealStatus(deal);
        const matchesStatus =
          statusFilter === "all" ||
          (statusFilter === "active" && status.key === "active") ||
          (statusFilter === "upcoming" && status.key === "upcoming") ||
          (statusFilter === "expired" && status.key === "expired") ||
          (statusFilter === "inactive" && !deal.isActive);

        return matchesSearch && matchesStatus;
      })
      .sort((a, b) => {
        if (sortOption === "discount") return (b.discountPercent || 0) - (a.discountPercent || 0);
        if (sortOption === "price_asc") return a.offerPrice - b.offerPrice;
        if (sortOption === "price_desc") return b.offerPrice - a.offerPrice;
        if (sortOption === "ending_soon") return new Date(a.endsAt).getTime() - new Date(b.endsAt).getTime();
        return a.sortOrder - b.sortOrder;
      });
  }, [deals, search, statusFilter, sortOption]);

  return (
    <div className="min-h-screen bg-[#F6F8FD] text-[#142B43]">
      <AdminSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Main page */}
      <div className="min-h-screen lg:pl-[260px]">
        {/* Global Admin Header */}
        <AdminHeader
          title="This Week Deals Master"
          onOpenSidebar={() => setSidebarOpen(true)}
          searchValue={search}
          onSearchChange={setSearch}
          searchPlaceholder="Search deals, products, or descriptions..."
          actions={
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={loadData}
                disabled={loading}
                className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition disabled:opacity-50"
              >
                <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
                <span className="hidden sm:inline">Refresh</span>
              </button>

              <button
                type="button"
                onClick={openCreateModal}
                className="inline-flex items-center gap-1.5 rounded-lg bg-[#082C45] px-4 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-[#164662]"
              >
                <Plus size={16} />
                <span>Schedule New Deal</span>
              </button>
            </div>
          }
        />

        <main className="mx-auto max-w-[1600px] space-y-6 px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
          {/* Breadcrumb & Heading Section matching Categories.tsx */}
          <section className="flex flex-col justify-between gap-4 xl:flex-row xl:items-center">
            <div>
              <div className="mb-2 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">
                <span>Admin</span>
                <span>/</span>
                <span className="text-teal-700">Marketing Operations</span>
                <span>/</span>
                <span className="text-[#0F2942]">This Week Deals</span>
              </div>

              <h1 className="text-3xl font-extrabold tracking-tight text-[#0F2942] sm:text-4xl">
                This Week Deals
              </h1>

              <p className="mt-2 text-sm text-slate-500">
                Manage weekly promotional offers and featured rental deals.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-2 rounded-full bg-cyan-100 px-3 py-2 text-xs font-semibold text-teal-800">
                <span className="h-2 w-2 rounded-full bg-teal-500" />
                System operational · Deals synced
              </span>

              <button
                type="button"
                onClick={openCreateModal}
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#082C45] px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-[#164662]"
              >
                <Plus size={18} />
                Create New Deal
              </button>
            </div>
          </section>

          {/* Feedback Banners */}
          {error && (
            <div role="status" className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
              <AlertCircle size={18} className="mt-0.5 shrink-0" />
              <span className="flex-1 break-words">{error}</span>
              <button type="button" aria-label="Dismiss error" onClick={() => setError(null)}>
                <X size={16} />
              </button>
            </div>
          )}

          {success && (
            <div role="status" className="flex items-start gap-2 rounded-xl border border-teal-100 bg-white p-3 text-sm text-teal-800 shadow-xs">
              <CheckCircle2 size={18} className="mt-0.5 text-teal-600 shrink-0" />
              <span className="flex-1 break-words font-medium">{success}</span>
              <button type="button" aria-label="Dismiss message" onClick={() => setSuccess(null)}>
                <X size={16} />
              </button>
            </div>
          )}

          {/* Statistics Section (4 Cards matching Categories.tsx design) */}
          <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 2xl:grid-cols-4">
            {[
              {
                label: "Total Deals",
                value: stats.total,
                detail: "All scheduled promotional offers",
                icon: Flame,
                theme: "bg-indigo-50 text-[#0F2942]",
                bar: "bg-[#087477]",
                percentage: 100,
              },
              {
                label: "Active Deals",
                value: stats.active,
                detail: "Currently live on storefront",
                icon: CheckCircle2,
                theme: "bg-cyan-100 text-teal-700",
                bar: "bg-teal-700",
                percentage: stats.total ? (stats.active / stats.total) * 100 : 0,
              },
              {
                label: "Upcoming Deals",
                value: stats.upcoming,
                detail: "Scheduled for future launch",
                icon: Clock,
                theme: "bg-blue-100 text-blue-700",
                bar: "bg-[#0F2942]",
                percentage: stats.total ? (stats.upcoming / stats.total) * 100 : 0,
              },
              {
                label: "Expired / Inactive",
                value: stats.expired,
                detail: "Past or deactivated campaigns",
                icon: CircleSlash,
                theme: "bg-orange-100 text-orange-600",
                bar: "bg-[#FF6A3D]",
                percentage: stats.total ? (stats.expired / stats.total) * 100 : 0,
              },
            ].map((stat) => {
              const Icon = stat.icon;
              return (
                <article key={stat.label} className="rounded-xl border border-slate-100 bg-white p-5 shadow-sm">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-[11px] font-bold uppercase tracking-[0.08em] text-slate-500">
                      {stat.label}
                    </p>
                    <span className={`flex h-9 w-9 items-center justify-center rounded-xl ${stat.theme}`}>
                      <Icon size={18} />
                    </span>
                  </div>

                  <div className="mt-3 flex items-end justify-between gap-2">
                    <p className="text-3xl font-extrabold tracking-tight text-[#101F32]">
                      {loading ? "—" : stat.value}
                    </p>
                    <p className="pb-1 text-[11px] text-slate-500">{stat.detail}</p>
                  </div>

                  <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-slate-100">
                    <div
                      className={`h-full rounded-full ${stat.bar} transition-all duration-300`}
                      style={{ width: `${loading ? 0 : stat.percentage}%` }}
                    />
                  </div>
                </article>
              );
            })}
          </section>

          {/* Category Icon & Image Settings Section */}
          <section className="rounded-xl border border-slate-100 bg-white p-5 sm:p-6 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
              <div>
                <div className="flex items-center gap-2">
                  <span className="rounded-full bg-orange-100 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-orange-800">
                    Homepage Navigation
                  </span>
                  <h2 className="text-base font-extrabold text-[#0F2942]">
                    Category Icon &amp; Image Settings
                  </h2>
                </div>
                <p className="mt-1 text-xs text-slate-500">
                  Configure how <strong>Deals &amp; Offers</strong> appears as a circular category in the customer homepage navigation scroller.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={savingCategorySettings}
                  onClick={handleSaveCategorySettings}
                  className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#082C45] px-4 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-[#164662] disabled:opacity-50"
                >
                  {savingCategorySettings ? (
                    <>
                      <RefreshCw size={14} className="animate-spin" />
                      <span>Saving...</span>
                    </>
                  ) : (
                    <>
                      <Save size={14} />
                      <span>Save Category Settings</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {categorySettingsSuccess && (
              <div className="mt-4 flex items-center gap-2 rounded-xl border border-teal-200 bg-teal-50 p-3 text-xs text-teal-800">
                <CheckCircle2 size={16} className="text-teal-600 shrink-0" />
                <span>{categorySettingsSuccess}</span>
              </div>
            )}

            <div className="mt-5 grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Left Column: Live Customer Preview */}
              <div className="lg:col-span-4 flex flex-col items-center justify-center rounded-xl border border-slate-100 bg-[#FAF9FD] p-6 text-center">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-3">
                  Live Circular Category Preview
                </span>

                <div className="flex flex-col items-center gap-2">
                  <div className="relative flex h-20 w-20 items-center justify-center rounded-full overflow-hidden transition duration-200 border-2 border-[#ede9fe] bg-white shadow-md">
                    {categoryImage ? (
                      <img
                        src={categoryImage}
                        alt="Deals & Offers"
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-[#4a36b3] bg-[#f8f7fc] p-3">
                        {renderCategoryIcon(categoryIcon, 30)}
                      </div>
                    )}
                  </div>
                  <span className="text-xs sm:text-[13px] font-bold text-gray-800">
                    Deals &amp; Offers
                  </span>
                </div>

                <p className="mt-3 text-[11px] text-slate-500 max-w-[220px]">
                  {categoryImage
                    ? "Custom image is active and will be displayed on the homepage."
                    : `Active icon: ${categoryIcon}. Will be displayed on the homepage.`}
                </p>

                {categoryImage && (
                  <button
                    type="button"
                    onClick={() => setCategoryImage("")}
                    className="mt-3 text-xs text-red-600 hover:text-red-700 underline font-medium cursor-pointer"
                  >
                    Remove custom image (revert to icon)
                  </button>
                )}
              </div>

              {/* Right Column: Icon Selector & Image Upload */}
              <div className="lg:col-span-8 space-y-4">
                {/* 1. Icon Library Selector */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-2">
                    1. Select Category Icon
                  </label>
                  <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
                    {CATEGORY_ICON_LIST.map((ic) => {
                      const IconComp = ic.icon;
                      const isSelected = categoryIcon.toLowerCase() === ic.name.toLowerCase();
                      return (
                        <button
                          key={ic.name}
                          type="button"
                          onClick={() => setCategoryIcon(ic.name)}
                          className={`flex flex-col items-center justify-center gap-1.5 p-2.5 rounded-xl border text-xs transition cursor-pointer ${
                            isSelected
                              ? "border-[#4a36b3] bg-[#f0eaff] text-[#4a36b3] font-bold shadow-2xs scale-102"
                              : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50 hover:border-slate-300"
                          }`}
                        >
                          <IconComp size={20} className={isSelected ? "text-[#4a36b3]" : "text-slate-500"} />
                          <span className="text-[11px] truncate w-full text-center">{ic.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* 2. Custom Image Upload */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    2. Upload Custom Circular Category Image (Optional)
                  </label>
                  <ImageUpload
                    value={categoryImage}
                    onChange={(url) => setCategoryImage(url)}
                    aspectRatio="square"
                    label="Upload Deals Category Thumbnail"
                    helperText="Upload a square/circular image from your device (JPG, PNG, WEBP, max 5 MB). When present, it overrides the icon in the navigation bar."
                  />
                </div>
              </div>
            </div>
          </section>

          {/* Directory Toolbar & Promotional Cards */}
          <section className="overflow-hidden rounded-xl border border-slate-100 bg-white shadow-sm">
            {/* Toolbar Header */}
            <div className="flex flex-col gap-4 border-b border-slate-100 p-4 sm:p-5">
              <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <h2 className="text-base font-extrabold text-[#0F2942]">Promotional Deals Directory</h2>
                  <p className="mt-1 text-xs text-slate-500">
                    Control active dates, special rental discounts, and countdown timers for weekly highlights.
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  {/* Status Filter */}
                  <div className="relative">
                    <select
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
                      aria-label="Filter by deal status"
                      className="h-10 appearance-none rounded-lg border border-slate-200 bg-white pl-3.5 pr-8 text-xs font-semibold text-slate-700 outline-none transition focus:border-teal-500"
                    >
                      <option value="all">All Deals ({deals.length})</option>
                      <option value="active">Active Now ({stats.active})</option>
                      <option value="upcoming">Upcoming ({stats.upcoming})</option>
                      <option value="expired">Expired ({stats.expired})</option>
                    </select>
                    <ChevronDown size={14} className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  </div>

                  {/* Sort Order */}
                  <div className="relative">
                    <select
                      value={sortOption}
                      onChange={(e) => setSortOption(e.target.value as SortOption)}
                      aria-label="Sort deals"
                      className="h-10 appearance-none rounded-lg border border-slate-200 bg-white pl-3.5 pr-8 text-xs font-semibold text-slate-700 outline-none transition focus:border-teal-500"
                    >
                      <option value="order">Display Order</option>
                      <option value="discount">Highest Discount</option>
                      <option value="price_asc">Price: Low to High</option>
                      <option value="price_desc">Price: High to Low</option>
                      <option value="ending_soon">Ending Soonest</option>
                    </select>
                    <ChevronDown size={14} className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  </div>
                </div>
              </div>

              {/* Search bar inside container */}
              <div className="relative">
                <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Filter by deal title, subtitle, or included items..."
                  className="h-10 w-full rounded-lg border border-slate-200 bg-slate-50/50 pl-10 pr-4 text-xs outline-none transition placeholder:text-slate-400 focus:border-teal-500 focus:bg-white"
                />
                {search && (
                  <button
                    type="button"
                    onClick={() => setSearch("")}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-slate-400 hover:text-slate-600"
                  >
                    Clear
                  </button>
                )}
              </div>
            </div>

            {/* Content: Loading, Empty, or Cards */}
            <div className="p-4 sm:p-6">
              {loading && deals.length === 0 ? (
                <div className="flex h-64 items-center justify-center">
                  <RefreshCw size={24} className="animate-spin text-[#0F2942]" />
                </div>
              ) : filteredDeals.length === 0 ? (
                <div className="rounded-2xl border-2 border-dashed border-slate-200 p-12 text-center">
                  <Flame size={40} className="mx-auto text-orange-400 mb-3" />
                  <h3 className="text-base font-bold text-slate-900">
                    {search || statusFilter !== "all" ? "No matching weekly deals" : "No Scheduled Deals"}
                  </h3>
                  <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                    {search || statusFilter !== "all"
                      ? "Try adjusting your search query or resetting the status filters."
                      : "Schedule deals with start and end times. Deals automatically activate and expire on schedule."}
                  </p>
                  {search || statusFilter !== "all" ? (
                    <button
                      type="button"
                      onClick={() => {
                        setSearch("");
                        setStatusFilter("all");
                      }}
                      className="mt-4 inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition"
                    >
                      Reset Filters
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={openCreateModal}
                      className="mt-4 inline-flex items-center gap-1.5 rounded-xl bg-[#082C45] px-4 py-2 text-xs font-bold text-white hover:bg-[#164662] transition"
                    >
                      <Plus size={15} />
                      <span>Create First Deal</span>
                    </button>
                  )}
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                  {filteredDeals.map((deal) => {
                    const status = getDealStatus(deal);
                    return (
                      <div
                        key={deal.id}
                        className="group rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-xs hover:shadow-md transition-all duration-200 flex flex-col justify-between"
                      >
                        <div>
                          {/* Image Banner Header */}
                          <div className="relative h-48 bg-slate-100 overflow-hidden">
                            {deal.image ? (
                              <img
                                src={deal.image}
                                alt={deal.title}
                                className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                              />
                            ) : deal.products && deal.products.length > 0 && deal.products[0].product?.image ? (
                              <img
                                src={deal.products[0].product.image}
                                alt={deal.title}
                                className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                              />
                            ) : (
                              <div className="flex h-full w-full items-center justify-center text-slate-300">
                                <Flame size={44} />
                              </div>
                            )}

                            {/* Discount Pill Badge */}
                            {deal.discountPercent && deal.discountPercent > 0 ? (
                              <span className="absolute top-3 left-3 rounded-full bg-red-600 px-2.5 py-1 text-[11px] font-black text-white shadow-sm">
                                {deal.discountPercent}% OFF
                              </span>
                            ) : null}

                            {/* Live Status Pill Badge */}
                            <span
                              className={`absolute top-3 right-3 inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-bold shadow-xs ${status.color}`}
                            >
                              <span className={`h-1.5 w-1.5 rounded-full ${status.dot}`} />
                              {status.label}
                            </span>
                          </div>

                          {/* Details */}
                          <div className="p-5 space-y-3">
                            <div className="flex items-center justify-between text-[11px] text-slate-400 font-semibold">
                              <span>Display Order: #{deal.sortOrder}</span>
                              <button
                                type="button"
                                onClick={() => void handleToggleActive(deal)}
                                className={`text-[10px] font-bold underline hover:no-underline ${
                                  deal.isActive ? "text-slate-500" : "text-teal-700"
                                }`}
                              >
                                {deal.isActive ? "Deactivate" : "Activate"}
                              </button>
                            </div>

                            <div>
                              <h3 className="text-base font-bold text-[#0F2942] leading-snug line-clamp-1">
                                {deal.title}
                              </h3>
                              {deal.subtitle && (
                                <p className="text-xs text-orange-600 font-semibold mt-0.5 line-clamp-1">
                                  {deal.subtitle}
                                </p>
                              )}
                            </div>

                            {deal.description && (
                              <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
                                {deal.description}
                              </p>
                            )}

                            {/* Schedule Times Box */}
                            <div className="rounded-xl border border-slate-100 bg-slate-50/70 p-2.5 text-[11px] text-slate-600 space-y-1">
                              <div className="flex items-center gap-1.5">
                                <Clock size={12} className="text-slate-400 shrink-0" />
                                <span className="truncate">
                                  <strong>Starts:</strong> {new Date(deal.startsAt).toLocaleDateString()} at{" "}
                                  {new Date(deal.startsAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                                </span>
                              </div>
                              <div className="flex items-center gap-1.5">
                                <Calendar size={12} className="text-slate-400 shrink-0" />
                                <span className="truncate">
                                  <strong>Ends:</strong> {new Date(deal.endsAt).toLocaleDateString()} at{" "}
                                  {new Date(deal.endsAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                                </span>
                              </div>
                            </div>

                            {/* Included Products List */}
                            {deal.products && deal.products.length > 0 && (
                              <div className="pt-2 border-t border-slate-100">
                                <span className="text-[11px] font-bold text-slate-500 block mb-1.5">
                                  Featured Items ({deal.products.length}):
                                </span>
                                <div className="flex flex-wrap gap-1.5">
                                  {deal.products.map((item) => (
                                    <div
                                      key={item.id}
                                      className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50/70 py-1 px-2 text-[11px] font-medium text-slate-700"
                                    >
                                      {item.product?.image ? (
                                        <img
                                          src={item.product.image}
                                          alt={item.product.name}
                                          className="h-4 w-4 rounded-md object-cover"
                                        />
                                      ) : (
                                        <Layers size={11} className="text-slate-400" />
                                      )}
                                      <span className="truncate max-w-[140px]">{item.product?.name || "Product"}</span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Pricing & Actions Footer */}
                        <div className="p-5 pt-3 border-t border-slate-100 flex items-center justify-between bg-slate-50/40">
                          <div>
                            <div className="text-lg font-extrabold text-[#0F2942]">
                              ₹{deal.offerPrice.toLocaleString("en-IN")}
                              <span className="text-xs font-normal text-slate-500">/mo</span>
                            </div>
                            {deal.originalPrice > deal.offerPrice && (
                              <div className="text-xs text-slate-400 line-through">
                                ₹{deal.originalPrice.toLocaleString("en-IN")}
                              </div>
                            )}
                          </div>

                          <div className="flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => openEditModal(deal)}
                              title="Edit Deal"
                              className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-[#D9F4F2] hover:text-[#008A90] hover:border-[#008A90]/40 transition shadow-xs"
                            >
                              <Pencil size={14} />
                            </button>
                            <button
                              type="button"
                              onClick={() => void handleDelete(deal.id, deal.title)}
                              title="Delete Deal"
                              className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-red-50 hover:text-red-600 hover:border-red-200 transition shadow-xs"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </section>
        </main>
      </div>

      {/* Create / Edit Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs overflow-y-auto">
          <div className="relative w-full max-w-2xl rounded-2xl bg-white shadow-2xl my-8 overflow-hidden max-h-[90vh] flex flex-col">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-100 p-5 bg-white sticky top-0 z-10">
              <div>
                <h3 className="text-base font-extrabold text-[#0F2942]">
                  {editingId ? "Edit Weekly Deal" : "Schedule New Weekly Deal"}
                </h3>
                <p className="text-xs text-slate-500">Configure promotional timing, discount pricing, and linked products.</p>
              </div>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition"
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={(e) => void handleSave(e)} className="p-6 space-y-5 overflow-y-auto flex-1">
              {/* Title & Subtitle */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Deal Title <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g. Monsoon Mega Living Set, Study Haven"
                    className="w-full rounded-xl border border-slate-200 p-3 text-xs outline-none focus:border-teal-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Subtitle / Catchphrase
                  </label>
                  <input
                    type="text"
                    value={subtitle}
                    onChange={(e) => setSubtitle(e.target.value)}
                    placeholder="e.g. Save 35% this week only"
                    className="w-full rounded-xl border border-slate-200 p-3 text-xs outline-none focus:border-teal-500"
                  />
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Deal Description
                </label>
                <textarea
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Highlight key rental benefits or urgency..."
                  className="w-full rounded-xl border border-slate-200 p-3 text-xs outline-none focus:border-teal-500"
                />
              </div>

              {/* Deal Image Upload */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Promotional Banner Image
                </label>
                <ImageUpload
                  value={image}
                  onChange={setImage}
                  folder="deals"
                  label="Upload Deal Showcase Banner"
                  helperText="Recommended 800x600px banner. JPG, PNG, or WEBP up to 5MB."
                />
              </div>

              {/* Pricing Section */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 bg-slate-50/70 p-4 rounded-xl border border-slate-100">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Original Rent (₹/mo)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={originalPrice || ""}
                    onChange={(e) => handleOriginalPriceChange(Number(e.target.value))}
                    placeholder="e.g. 2499"
                    className="w-full rounded-lg border border-slate-200 bg-white p-2.5 text-xs outline-none focus:border-teal-500"
                  />
                  <span className="text-[10px] text-slate-400 mt-0.5 block">Crossed-out reference price</span>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Special Offer (₹/mo) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    required
                    min="1"
                    value={offerPrice || ""}
                    onChange={(e) => handleOfferPriceChange(Number(e.target.value))}
                    placeholder="e.g. 1799"
                    className="w-full rounded-lg border border-slate-200 bg-white p-2.5 text-xs font-bold text-[#0F2942] outline-none focus:border-teal-500"
                  />
                  <span className="text-[10px] text-slate-400 mt-0.5 block">Actual promotional rent</span>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Discount (% OFF)
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={discountPercent || ""}
                    onChange={(e) => setDiscountPercent(Number(e.target.value))}
                    placeholder="Auto-calculated"
                    className="w-full rounded-lg border border-slate-200 bg-white p-2.5 text-xs font-bold text-orange-600 outline-none focus:border-teal-500"
                  />
                  <span className="text-[10px] text-slate-400 mt-0.5 block">Promotional badge</span>
                </div>
              </div>

              {/* Scheduling Datetimes */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Starts At <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="datetime-local"
                    required
                    value={startsAt}
                    onChange={(e) => setStartsAt(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 p-2.5 text-xs outline-none focus:border-teal-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Ends At <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="datetime-local"
                    required
                    value={endsAt}
                    onChange={(e) => setEndsAt(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 p-2.5 text-xs outline-none focus:border-teal-500"
                  />
                </div>
              </div>

              {/* Display Order & Active Toggle */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Display Order
                  </label>
                  <input
                    type="number"
                    value={sortOrder}
                    onChange={(e) => setSortOrder(Number(e.target.value))}
                    className="w-full rounded-lg border border-slate-200 p-2.5 text-xs outline-none focus:border-teal-500"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Status
                  </label>
                  <div className="flex items-center gap-2 mt-2.5">
                    <input
                      type="checkbox"
                      id="dealActiveToggle"
                      checked={isActive}
                      onChange={(e) => setIsActive(e.target.checked)}
                      className="h-4 w-4 rounded border-slate-300 text-teal-600 focus:ring-teal-500 cursor-pointer"
                    />
                    <label htmlFor="dealActiveToggle" className="text-xs font-semibold text-slate-700 cursor-pointer">
                      Enable Weekly Promotion
                    </label>
                  </div>
                </div>
              </div>

              {/* Product Multi-Select */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                    Linked Products ({selectedProductIds.length} selected)
                  </label>
                  <span className="text-[11px] text-slate-400">Products featured in this deal</span>
                </div>

                <input
                  type="text"
                  value={productSearch}
                  onChange={(e) => setProductSearch(e.target.value)}
                  placeholder="Search catalog products..."
                  className="w-full rounded-lg border border-slate-200 p-2 text-xs outline-none focus:border-teal-500"
                />

                <div className="max-h-48 overflow-y-auto border border-slate-200 rounded-xl divide-y divide-slate-100 bg-slate-50/50">
                  {filteredModalProducts.length === 0 ? (
                    <div className="p-4 text-center text-xs text-slate-400">No products found</div>
                  ) : (
                    filteredModalProducts.map((prod) => {
                      const selected = selectedProductIds.includes(prod.id);
                      return (
                        <div
                          key={prod.id}
                          onClick={() => toggleProduct(prod.id)}
                          className={`flex items-center justify-between p-2.5 cursor-pointer text-xs transition ${
                            selected ? "bg-teal-50/80 font-bold text-teal-900" : "hover:bg-white text-slate-700"
                          }`}
                        >
                          <div className="flex items-center gap-2.5">
                            <input
                              type="checkbox"
                              checked={selected}
                              onChange={() => {}}
                              className="h-4 w-4 rounded border-slate-300 text-teal-600 cursor-pointer"
                            />
                            {prod.image ? (
                              <img src={prod.image} alt={prod.name} className="h-6 w-6 rounded object-cover" />
                            ) : (
                              <div className="h-6 w-6 rounded bg-slate-200 flex items-center justify-center">
                                <Flame size={12} className="text-slate-400" />
                              </div>
                            )}
                            <span>{prod.name}</span>
                          </div>
                          <span className="text-slate-500 font-semibold">₹{prod.price}/mo</span>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

              {/* Modal Actions */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="rounded-xl border border-slate-200 px-4 py-2.5 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-[#082C45] px-5 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-[#164662] transition disabled:opacity-50"
                >
                  {saving ? <RefreshCw size={14} className="animate-spin" /> : <Check size={14} />}
                  <span>{editingId ? "Update Deal" : "Save & Schedule Deal"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
