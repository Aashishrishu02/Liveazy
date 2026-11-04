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
  Package,
  Layers,
  Calendar,
  AlertCircle,
  CheckCircle2,
  CircleSlash,
  ChevronDown,
  Layers3,
  Flame,
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

interface ComboProductItem {
  id: string;
  productId: string;
  sortOrder: number;
  product: Product;
}

interface ComboOffer {
  id: string;
  title: string;
  description?: string | null;
  image?: string | null;
  originalPrice: number;
  specialPrice: number;
  discountPercent?: number | null;
  isActive: boolean;
  sortOrder: number;
  validUntil?: string | null;
  products: ComboProductItem[];
}

type StatusFilter = "all" | "active" | "inactive";
type SortOption = "order" | "price_asc" | "price_desc" | "discount";

const CATEGORY_ICON_LIST = [
  { name: "Package", label: "Package", icon: Package },
  { name: "Flame", label: "Flame", icon: Flame },
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
  const IconComp = item ? item.icon : Package;
  return <IconComp size={size} className="stroke-[2.2]" />;
}

export default function ComboOffersAdmin() {
  const navigate = useNavigate();
  const apiBase = getApiBaseUrl();

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [combos, setCombos] = useState<ComboOffer[]>([]);
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Category Icon & Image Settings State (for circular category on homepage)
  const [categoryIcon, setCategoryIcon] = useState("Package");
  const [categoryImage, setCategoryImage] = useState<string>("");
  const [savingCategorySettings, setSavingCategorySettings] = useState(false);
  const [categorySettingsSuccess, setCategorySettingsSuccess] = useState<string | null>(null);

  // Filter & Search state
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [sortOption, setSortOption] = useState<SortOption>("order");

  // Modal form state
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [image, setImage] = useState("");
  const [originalPrice, setOriginalPrice] = useState<number>(0);
  const [specialPrice, setSpecialPrice] = useState<number>(0);
  const [discountPercent, setDiscountPercent] = useState<number>(0);
  const [isActive, setIsActive] = useState(true);
  const [sortOrder, setSortOrder] = useState<number>(0);
  const [validUntil, setValidUntil] = useState("");
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

      const [combosRes, productsRes, catRes] = await Promise.all([
        fetch(`${apiBase}/combos`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch(`${apiBase}/products`),
        fetch(`${apiBase}/combos/category-settings`).catch(() => null),
      ]);

      if (!combosRes.ok) {
        if (combosRes.status === 401 || combosRes.status === 403) {
          navigate("/admin");
          return;
        }
        throw new Error("Failed to load combos");
      }

      const combosData = await combosRes.json();
      setCombos(Array.isArray(combosData) ? combosData : []);

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

      const res = await fetch(`${apiBase}/combos/category-settings`, {
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

      setCategorySettingsSuccess("Category settings saved! Customer circular Combos category updated.");
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

  // Pricing & discount auto-calculation
  const handleOriginalPriceChange = (val: number) => {
    setOriginalPrice(val);
    if (val > 0 && specialPrice > 0 && val >= specialPrice) {
      const disc = Math.round(((val - specialPrice) / val) * 100);
      setDiscountPercent(disc);
    }
  };

  const handleSpecialPriceChange = (val: number) => {
    setSpecialPrice(val);
    if (originalPrice > 0 && val > 0 && originalPrice >= val) {
      const disc = Math.round(((originalPrice - val) / originalPrice) * 100);
      setDiscountPercent(disc);
    }
  };

  // Toggle product selection
  const toggleProduct = (productId: string) => {
    setSelectedProductIds((prev) => {
      const exists = prev.includes(productId);
      const next = exists ? prev.filter((id) => id !== productId) : [...prev, productId];

      // Auto-update original price based on selected products' regular rent
      const sumRent = next.reduce((acc, id) => {
        const prod = allProducts.find((p) => p.id === id);
        return acc + (prod?.price || 0);
      }, 0);

      if (sumRent > 0) {
        setOriginalPrice(sumRent);
        if (specialPrice > 0 && sumRent >= specialPrice) {
          setDiscountPercent(Math.round(((sumRent - specialPrice) / sumRent) * 100));
        }
      }
      return next;
    });
  };

  const openCreateModal = () => {
    setEditingId(null);
    setTitle("");
    setDescription("");
    setImage("");
    setOriginalPrice(0);
    setSpecialPrice(0);
    setDiscountPercent(0);
    setIsActive(true);
    setSortOrder(combos.length);
    setValidUntil("");
    setSelectedProductIds([]);
    setProductSearch("");
    setModalOpen(true);
  };

  const openEditModal = (combo: ComboOffer) => {
    setEditingId(combo.id);
    setTitle(combo.title);
    setDescription(combo.description || "");
    setImage(combo.image || "");
    setOriginalPrice(combo.originalPrice);
    setSpecialPrice(combo.specialPrice);
    setDiscountPercent(combo.discountPercent || 0);
    setIsActive(combo.isActive);
    setSortOrder(combo.sortOrder);
    setValidUntil(combo.validUntil ? combo.validUntil.split("T")[0] : "");
    setSelectedProductIds(combo.products.map((p) => p.productId));
    setProductSearch("");
    setModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const token = getToken();
    if (!token) return;

    if (!title.trim()) {
      setError("Please enter a combo title");
      return;
    }
    if (specialPrice <= 0) {
      setError("Please enter a valid monthly special price");
      return;
    }
    if (selectedProductIds.length === 0) {
      setError("Please select at least 1 product included in this combo");
      return;
    }

    try {
      setSaving(true);
      setError(null);

      const payload = {
        title: title.trim(),
        description: description.trim() || null,
        image: image || null,
        originalPrice: Number(originalPrice) || Number(specialPrice),
        specialPrice: Number(specialPrice),
        discountPercent: Number(discountPercent) || 0,
        isActive,
        sortOrder: Number(sortOrder) || 0,
        validUntil: validUntil ? new Date(validUntil).toISOString() : null,
        productIds: selectedProductIds,
      };

      const url = editingId ? `${apiBase}/combos/${editingId}` : `${apiBase}/combos`;
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
        throw new Error(errData.message || "Failed to save combo offer");
      }

      setSuccess(editingId ? "Combo offer updated successfully" : "Combo offer created successfully");
      setTimeout(() => setSuccess(null), 4000);
      setModalOpen(false);
      await loadData();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Error saving combo");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string, comboTitle: string) => {
    if (!window.confirm(`Are you sure you want to delete "${comboTitle}"? This cannot be undone.`)) {
      return;
    }
    const token = getToken();
    if (!token) return;

    try {
      const res = await fetch(`${apiBase}/combos/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) {
        throw new Error("Failed to delete combo offer");
      }

      setSuccess("Combo offer deleted successfully");
      setTimeout(() => setSuccess(null), 3000);
      await loadData();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Error deleting combo");
    }
  };

  const handleToggleActive = async (combo: ComboOffer) => {
    const token = getToken();
    if (!token) return;

    try {
      const res = await fetch(`${apiBase}/combos/${combo.id}/status`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ isActive: !combo.isActive }),
      });

      if (!res.ok) throw new Error("Failed to update status");
      await loadData();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Error updating status");
    }
  };

  // Filtered Products for the modal picker
  const filteredModalProducts = useMemo(() => {
    if (!productSearch.trim()) return allProducts;
    const q = productSearch.toLowerCase();
    return allProducts.filter((p) => p.name.toLowerCase().includes(q));
  }, [allProducts, productSearch]);

  // Statistics calculations (Matching Categories.tsx)
  const activeCount = useMemo(() => combos.filter((c) => c.isActive).length, [combos]);
  const inactiveCount = useMemo(() => combos.length - activeCount, [combos]);
  const linkedProductsCount = useMemo(
    () => combos.reduce((sum, c) => sum + (c.products?.length || 0), 0),
    [combos]
  );

  // Search & Filtering
  const filteredCombos = useMemo(() => {
    const q = search.trim().toLowerCase();

    return combos
      .filter((combo) => {
        const matchesSearch =
          !q ||
          combo.title.toLowerCase().includes(q) ||
          (combo.description && combo.description.toLowerCase().includes(q)) ||
          combo.products.some((p) => p.product?.name?.toLowerCase().includes(q));

        const matchesStatus =
          statusFilter === "all" ||
          (statusFilter === "active" && combo.isActive) ||
          (statusFilter === "inactive" && !combo.isActive);

        return matchesSearch && matchesStatus;
      })
      .sort((a, b) => {
        if (sortOption === "price_asc") return a.specialPrice - b.specialPrice;
        if (sortOption === "price_desc") return b.specialPrice - a.specialPrice;
        if (sortOption === "discount") return (b.discountPercent || 0) - (a.discountPercent || 0);
        return a.sortOrder - b.sortOrder;
      });
  }, [combos, search, statusFilter, sortOption]);

  return (
    <div className="min-h-screen bg-[#F6F8FD] text-[#142B43]">
      <AdminSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Main page */}
      <div className="min-h-screen lg:pl-[260px]">
        {/* Global Admin Header */}
        <AdminHeader
          title="Combo Offers Master"
          onOpenSidebar={() => setSidebarOpen(true)}
          searchValue={search}
          onSearchChange={setSearch}
          searchPlaceholder="Search combos, descriptions or included products..."
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
                <span>New Combo Offer</span>
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
                <span className="text-teal-700">Catalog Operations</span>
                <span>/</span>
                <span className="text-[#0F2942]">Combo Offers Master</span>
              </div>

              <h1 className="text-3xl font-extrabold tracking-tight text-[#0F2942] sm:text-4xl">
                Manage Combo Offers
              </h1>

              <p className="mt-2 text-sm text-slate-500">
                Create curated room bundles and packages with special multi-product rental discounts.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-2 rounded-full bg-cyan-100 px-3 py-2 text-xs font-semibold text-teal-800">
                <span className="h-2 w-2 rounded-full bg-teal-500" />
                System operational · Catalog synced
              </span>

              <button
                type="button"
                onClick={openCreateModal}
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#082C45] px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-[#164662]"
              >
                <Plus size={18} />
                Add Combo Offer
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
                label: "Total Combos",
                value: combos.length,
                detail: "All configured room bundles",
                icon: Package,
                theme: "bg-indigo-50 text-[#0F2942]",
                bar: "bg-[#087477]",
                percentage: 100,
              },
              {
                label: "Active Combos",
                value: activeCount,
                detail: "Visible on storefront catalog",
                icon: CheckCircle2,
                theme: "bg-cyan-100 text-teal-700",
                bar: "bg-teal-700",
                percentage: combos.length ? (activeCount / combos.length) * 100 : 0,
              },
              {
                label: "Inactive / Draft",
                value: inactiveCount,
                detail: "Hidden from customer view",
                icon: CircleSlash,
                theme: "bg-orange-100 text-orange-600",
                bar: "bg-[#FF6A3D]",
                percentage: combos.length ? (inactiveCount / combos.length) * 100 : 0,
              },
              {
                label: "Linked Products",
                value: linkedProductsCount,
                detail: "Total products bundled in combos",
                icon: Layers3,
                theme: "bg-blue-100 text-blue-700",
                bar: "bg-[#0F2942]",
                percentage: Math.min(100, linkedProductsCount * 10),
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
                  Configure how <strong>Combos</strong> appears as a circular category in the customer homepage navigation scroller.
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
                        alt="Combos"
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-[#4a36b3] bg-[#f8f7fc] p-3">
                        {renderCategoryIcon(categoryIcon, 30)}
                      </div>
                    )}
                  </div>
                  <span className="text-xs sm:text-[13px] font-bold text-gray-800">
                    Combos
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
                    label="Upload Combos Category Thumbnail"
                    helperText="Upload a square/circular image from your device (JPG, PNG, WEBP, max 5 MB). When present, it overrides the icon in the navigation bar."
                  />
                </div>
              </div>
            </div>
          </section>

          {/* Directory Toolbar & Cards Grid */}
          <section className="overflow-hidden rounded-xl border border-slate-100 bg-white shadow-sm">
            {/* Toolbar Header */}
            <div className="flex flex-col gap-4 border-b border-slate-100 p-4 sm:p-5">
              <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <h2 className="text-base font-extrabold text-[#0F2942]">Combo Packages Directory</h2>
                  <p className="mt-1 text-xs text-slate-500">
                    Search and manage your multi-product rental bundles with live discount pricing.
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  {/* Status Filter */}
                  <div className="relative">
                    <select
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
                      aria-label="Filter by status"
                      className="h-10 appearance-none rounded-lg border border-slate-200 bg-white pl-3.5 pr-8 text-xs font-semibold text-slate-700 outline-none transition focus:border-teal-500"
                    >
                      <option value="all">All Statuses ({combos.length})</option>
                      <option value="active">Active Only ({activeCount})</option>
                      <option value="inactive">Inactive Only ({inactiveCount})</option>
                    </select>
                    <ChevronDown size={14} className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  </div>

                  {/* Sort Order */}
                  <div className="relative">
                    <select
                      value={sortOption}
                      onChange={(e) => setSortOption(e.target.value as SortOption)}
                      aria-label="Sort combos"
                      className="h-10 appearance-none rounded-lg border border-slate-200 bg-white pl-3.5 pr-8 text-xs font-semibold text-slate-700 outline-none transition focus:border-teal-500"
                    >
                      <option value="order">Display Order</option>
                      <option value="price_asc">Price: Low to High</option>
                      <option value="price_desc">Price: High to Low</option>
                      <option value="discount">Highest Discount</option>
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
                  placeholder="Filter by combo title, description, or included items..."
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
              {loading && combos.length === 0 ? (
                <div className="flex h-64 items-center justify-center">
                  <RefreshCw size={24} className="animate-spin text-[#0F2942]" />
                </div>
              ) : filteredCombos.length === 0 ? (
                <div className="rounded-2xl border-2 border-dashed border-slate-200 p-12 text-center">
                  <Package size={40} className="mx-auto text-slate-400 mb-3" />
                  <h3 className="text-base font-bold text-slate-900">
                    {search || statusFilter !== "all" ? "No matching combo offers" : "No Combo Offers Configured"}
                  </h3>
                  <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                    {search || statusFilter !== "all"
                      ? "Try adjusting your search criteria or resetting the status filters."
                      : "Create dedicated room combos or multi-item packages with bundle discounts for customers."}
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
                      <span>Create First Combo</span>
                    </button>
                  )}
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                  {filteredCombos.map((combo) => (
                    <div
                      key={combo.id}
                      className="group rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-xs hover:shadow-md transition-all duration-200 flex flex-col justify-between"
                    >
                      <div>
                        {/* Image Banner Header */}
                        <div className="relative h-48 bg-slate-100 overflow-hidden">
                          {combo.image ? (
                            <img
                              src={combo.image}
                              alt={combo.title}
                              className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                            />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center text-slate-300">
                              <Package size={44} />
                            </div>
                          )}

                          {/* Discount Pill Badge */}
                          {combo.discountPercent && combo.discountPercent > 0 ? (
                            <span className="absolute top-3 left-3 rounded-full bg-red-600 px-2.5 py-1 text-[11px] font-black text-white shadow-sm">
                              {combo.discountPercent}% OFF
                            </span>
                          ) : null}

                          {/* Active Status Pill */}
                          <button
                            type="button"
                            onClick={() => void handleToggleActive(combo)}
                            title="Click to toggle active status"
                            className={`absolute top-3 right-3 inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-bold shadow-xs transition hover:scale-105 ${
                              combo.isActive ? "bg-cyan-100 text-teal-800" : "bg-slate-100 text-slate-600"
                            }`}
                          >
                            <span className={`h-1.5 w-1.5 rounded-full ${combo.isActive ? "bg-teal-600" : "bg-slate-400"}`} />
                            {combo.isActive ? "Active" : "Inactive"}
                          </button>
                        </div>

                        {/* Details */}
                        <div className="p-5 space-y-3">
                          <div className="flex items-center justify-between text-[11px] text-slate-400 font-semibold">
                            <span>Display Order: #{combo.sortOrder}</span>
                            {combo.validUntil && (
                              <span className="flex items-center gap-1 text-orange-600">
                                <Calendar size={12} />
                                Valid till {new Date(combo.validUntil).toLocaleDateString()}
                              </span>
                            )}
                          </div>

                          <h3 className="text-base font-bold text-[#0F2942] leading-snug line-clamp-1">
                            {combo.title}
                          </h3>

                          {combo.description && (
                            <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
                              {combo.description}
                            </p>
                          )}

                          {/* Included Products List with Thumbnails */}
                          <div className="pt-2 border-t border-slate-100">
                            <span className="text-[11px] font-bold text-slate-500 block mb-2">
                              Included Items ({combo.products.length}):
                            </span>
                            <div className="flex flex-wrap gap-1.5">
                              {combo.products.map((item) => (
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
                        </div>
                      </div>

                      {/* Pricing & Actions Footer */}
                      <div className="p-5 pt-3 border-t border-slate-100 flex items-center justify-between bg-slate-50/40">
                        <div>
                          <div className="text-lg font-extrabold text-[#0F2942]">
                            ₹{combo.specialPrice.toLocaleString("en-IN")}
                            <span className="text-xs font-normal text-slate-500">/mo</span>
                          </div>
                          {combo.originalPrice > combo.specialPrice && (
                            <div className="text-xs text-slate-400 line-through">
                              ₹{combo.originalPrice.toLocaleString("en-IN")}
                            </div>
                          )}
                        </div>

                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => openEditModal(combo)}
                            title="Edit Combo"
                            className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-[#D9F4F2] hover:text-[#008A90] hover:border-[#008A90]/40 transition shadow-xs"
                          >
                            <Pencil size={14} />
                          </button>
                          <button
                            type="button"
                            onClick={() => void handleDelete(combo.id, combo.title)}
                            title="Delete Combo"
                            className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-red-50 hover:text-red-600 hover:border-red-200 transition shadow-xs"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
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
                  {editingId ? "Edit Combo Offer" : "Create New Combo Offer"}
                </h3>
                <p className="text-xs text-slate-500">Configure bundle details, bundled items, and rental pricing.</p>
              </div>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition"
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Form Body */}
            <form onSubmit={(e) => void handleSave(e)} className="p-6 space-y-5 overflow-y-auto flex-1">
              {/* Combo Title */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Combo Title <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. 1BHK Solid Wood Starter Pack, Complete Study Combo"
                  className="w-full rounded-xl border border-slate-200 p-3 text-xs outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500"
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Description
                </label>
                <textarea
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Explain what is included and who this bundle is ideal for..."
                  className="w-full rounded-xl border border-slate-200 p-3 text-xs outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500"
                />
              </div>

              {/* Combo Image Upload */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Combo Banner Image
                </label>
                <ImageUpload
                  value={image}
                  onChange={setImage}
                  folder="combos"
                  label="Upload High-Resolution Bundle Banner"
                  helperText="Recommended 800x600px. PNG, JPG or WEBP up to 5MB."
                />
              </div>

              {/* Pricing Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 bg-slate-50/70 p-4 rounded-xl border border-slate-100">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Original Price (₹)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={originalPrice || ""}
                    onChange={(e) => handleOriginalPriceChange(Number(e.target.value))}
                    placeholder="e.g. 1999"
                    className="w-full rounded-lg border border-slate-200 bg-white p-2.5 text-xs outline-none focus:border-teal-500"
                  />
                  <span className="text-[10px] text-slate-400 mt-0.5 block">Standard combined monthly price</span>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Special Rent (₹/mo) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    required
                    min="1"
                    value={specialPrice || ""}
                    onChange={(e) => handleSpecialPriceChange(Number(e.target.value))}
                    placeholder="e.g. 1499"
                    className="w-full rounded-lg border border-slate-200 bg-white p-2.5 text-xs font-bold text-[#0F2942] outline-none focus:border-teal-500"
                  />
                  <span className="text-[10px] text-slate-400 mt-0.5 block">Discounted bundle price</span>
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
                    className="w-full rounded-lg border border-slate-200 bg-white p-2.5 text-xs font-bold text-red-600 outline-none focus:border-teal-500"
                  />
                  <span className="text-[10px] text-slate-400 mt-0.5 block">Badge shown on card</span>
                </div>
              </div>

              {/* Status, Display Order & Valid Until */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
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
                    Valid Until (Optional)
                  </label>
                  <input
                    type="date"
                    value={validUntil}
                    onChange={(e) => setValidUntil(e.target.value)}
                    className="w-full rounded-lg border border-slate-200 p-2.5 text-xs outline-none focus:border-teal-500"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Status
                  </label>
                  <div className="flex items-center gap-2 mt-2">
                    <input
                      type="checkbox"
                      id="comboActiveToggle"
                      checked={isActive}
                      onChange={(e) => setIsActive(e.target.checked)}
                      className="h-4 w-4 rounded border-slate-300 text-teal-600 focus:ring-teal-500 cursor-pointer"
                    />
                    <label htmlFor="comboActiveToggle" className="text-xs font-semibold text-slate-700 cursor-pointer">
                      Visible on Website
                    </label>
                  </div>
                </div>
              </div>

              {/* Multi-Select Products Picker */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                    Select Included Products ({selectedProductIds.length} selected) <span className="text-red-500">*</span>
                  </label>
                  <span className="text-[11px] text-slate-400">Click products to add/remove</span>
                </div>

                {/* Product Search */}
                <input
                  type="text"
                  value={productSearch}
                  onChange={(e) => setProductSearch(e.target.value)}
                  placeholder="Filter available products by name..."
                  className="w-full rounded-lg border border-slate-200 p-2 text-xs outline-none focus:border-teal-500"
                />

                <div className="max-h-52 overflow-y-auto border border-slate-200 rounded-xl divide-y divide-slate-100 bg-slate-50/50">
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
                                <Package size={12} className="text-slate-400" />
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
                  <span>{editingId ? "Update Combo Offer" : "Save Combo Offer"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
