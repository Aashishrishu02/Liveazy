import { useCallback, useEffect, useState } from "react";
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
  RefreshCw,
  Save,
  Star,
  ArrowUp,
  ArrowDown,
  CheckCircle2,
  AlertCircle,
  X,
  Contact,
  MessageSquareText,
} from "lucide-react";
const API_URL = (import.meta.env.VITE_API_URL || "").replace(/\/$/, "");
const MAX_PRODUCTS = 4;
interface Product {
  id: string;
  name: string;
  image?: string | null;
  price?: number | string | null;
  rent3M?: number | string | null;
  rent6M?: number | string | null;
  rent12M?: number | string | null;
  category?: { name?: string } | string | null;
  categoryId?: string;
  isActive?: boolean;
}
interface TrendingSettings {
  heading: string;
  subtitle: string;
  isActive: boolean;
}
interface TrendingAdminResponse {
  heading?: string;
  subtitle?: string;
  isActive?: boolean;
  setting?: {
    heading?: string;
    subtitle?: string;
    isActive?: boolean;
  };
  settings?: {
    heading?: string;
    subtitle?: string;
    isActive?: boolean;
  };
  products?: Array<Product & {
    productId?: string;
    displayOrder?: number;
    product?: Product;
  }>;
}
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
];
function AdminAvatar() {
  return (
    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-cyan-50 text-teal-700">
      <span className="text-[10px] font-extrabold">SA</span>
    </div>
  );
}

function getRent(product: Product): number | null {
  const values = [product.rent3M, product.rent6M, product.rent12M]
    .map(Number)
    .filter((value) => Number.isFinite(value) && value > 0);
  return values.length ? Math.min(...values) : null;
}
function getCategory(product: Product): string {
  if (typeof product.category === "string") return product.category;
  return product.category?.name || "Furniture";
}
export default function TrendingRentalsAdmin() {
  const navigate = useNavigate();
  const [settings, setSettings] = useState<TrendingSettings>({
    heading: "Trending Rentals in Your City",
    subtitle: "Discover popular furniture and appliances for your home.",
    isActive: true,
  });
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingSettings, setSavingSettings] = useState(false);
  const [savingProducts, setSavingProducts] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [notice, setNotice] = useState("");
  const [noticeError, setNoticeError] = useState(false);
  const token = localStorage.getItem("token");
  const authHeaders = (): HeadersInit => ({
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  });
  const showNotice = (message: string, error = false) => {
    setNotice(message);
    setNoticeError(error);
  };
  const fetchData = useCallback(async () => {
    setLoading(true);
    showNotice("");
    try {
      const [settingsResponse, productsResponse] = await Promise.all([
        fetch(`${API_URL}/trending-rentals/admin`, {
          headers: authHeaders(),
        }),
        fetch(`${API_URL}/products`, {
          headers: authHeaders(),
        }),
      ]);
      if (!settingsResponse.ok) {
        throw new Error(
          `Trending settings request failed (${settingsResponse.status})`,
        );
      }
      if (!productsResponse.ok) {
        throw new Error(`Products request failed (${productsResponse.status})`);
      }
      const adminData =
        (await settingsResponse.json()) as TrendingAdminResponse;
      const productData = await productsResponse.json();
      const savedSettings =
        adminData.setting || adminData.settings || adminData;
      setSettings({
        heading: savedSettings.heading || "Trending Rentals in Your City",
        subtitle:
          savedSettings.subtitle ||
          "Discover popular furniture and appliances for your home.",
        isActive: savedSettings.isActive ?? true,
      });
      const allProducts: Product[] = Array.isArray(productData)
        ? productData
        : Array.isArray(productData?.data)
          ? productData.data
          : [];
      setProducts(allProducts);
      const savedProducts = Array.isArray(adminData.products)
        ? [...adminData.products].sort(
            (a, b) => (a.displayOrder ?? 0) - (b.displayOrder ?? 0),
          )
        : [];
      setSelectedIds(
        savedProducts
          .map((item) => item.productId || item.product?.id || item.id)
          .filter((id): id is string => Boolean(id)),
      );
    } catch (error) {
      console.error("Trending Rentals admin error:", error);
      showNotice(
        error instanceof Error
          ? error.message
          : "Could not load Trending Rentals settings.",
        true,
      );
    } finally {
      setLoading(false);
    }
  }, []);
  useEffect(() => {
    void fetchData();
  }, [fetchData]);
  const toggleProduct = (id: string) => {
    setSelectedIds((current) => {
      if (current.includes(id)) {
        return current.filter((item) => item !== id);
      }
      if (current.length >= MAX_PRODUCTS) {
        showNotice("You can select a maximum of 4 products.", true);
        return current;
      }
      return [...current, id];
    });
    showNotice("");
  };
  const moveProduct = (index: number, direction: -1 | 1) => {
    const nextIndex = index + direction;
    if (nextIndex < 0 || nextIndex >= selectedIds.length) return;
    setSelectedIds((current) => {
      const next = [...current];
      [next[index], next[nextIndex]] = [next[nextIndex], next[index]];
      return next;
    });
  };
  const saveSettings = async () => {
    if (!settings.heading.trim()) {
      showNotice("Please enter a section heading.", true);
      return;
    }
    if (!token) {
      showNotice("Admin session not found. Please log in again.", true);
      return;
    }
    try {
      setSavingSettings(true);
      showNotice("");
      const response = await fetch(
        `${API_URL}/trending-rentals/admin/settings`,
        {
          method: "PUT",
          headers: authHeaders(),
          body: JSON.stringify({
            heading: settings.heading.trim(),
            subtitle: settings.subtitle.trim(),
            isActive: settings.isActive,
          }),
        },
      );
      const result = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(
          result.message || `Settings save failed (${response.status})`,
        );
      }
      showNotice("Trending Rentals settings saved successfully.");
    } catch (error) {
      showNotice(
        error instanceof Error ? error.message : "Settings could not be saved.",
        true,
      );
    } finally {
      setSavingSettings(false);
    }
  };
  const saveProducts = async () => {
    if (!token) {
      showNotice("Admin session not found. Please log in again.", true);
      return;
    }
    if (selectedIds.length > MAX_PRODUCTS) {
      showNotice("You can select a maximum of 4 products.", true);
      return;
    }
    try {
      setSavingProducts(true);
      showNotice("");
      const response = await fetch(
        `${API_URL}/trending-rentals/admin/products`,
        {
          method: "PUT",
          headers: authHeaders(),
          body: JSON.stringify({
            productIds: selectedIds,
          }),
        },
      );
      const result = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(
          result.message || `Products save failed (${response.status})`,
        );
      }
      showNotice("Trending Rentals products saved successfully.");
      await fetchData();
    } catch (error) {
      showNotice(
        error instanceof Error ? error.message : "Products could not be saved.",
        true,
      );
    } finally {
      setSavingProducts(false);
    }
  };
  const logout = () => {
    localStorage.removeItem("token");
    navigate("/admin");
  };
  const selectedProducts = selectedIds
    .map((id) => products.find((product) => product.id === id))
    .filter((product): product is Product => Boolean(product));
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
              <h1 className="text-xl font-extrabold tracking-tight text-[#0F2942]">
                LIVEAZY
              </h1>
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
            className="flex items-center gap-3 rounded-lg px-3 py-3 text-sm font-semibold text-slate-600 transition hover:bg-slate-100 hover:text-[#0F2942]"
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
          <div className="flex min-w-0 flex-1 items-center gap-3">
            <button
              type="button"
              aria-label="Open navigation"
              onClick={() => setSidebarOpen(true)}
              className="rounded-lg border border-slate-200 p-2 hover:bg-slate-50 lg:hidden"
            >
              <Menu size={20} />
            </button>
            <div className="relative max-w-[540px] flex-1">
              <Search
                size={17}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500"
              />
              <input
                aria-label="Search admin workspace"
                placeholder="Search products, categories, SKU, customer inquiries"
                className="h-10 w-full rounded-lg border border-transparent bg-[#F0F4FF] pl-9 pr-4 text-sm outline-none transition placeholder:text-slate-500 focus:border-teal-300 focus:bg-white"
              />
            </div>
          </div>
          <div className="hidden items-center gap-3 sm:flex">
            <div className="flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-2">
              <AdminAvatar />
              <div>
                <p className="text-xs font-bold text-[#0F2942]">Super Admin</p>
                <p className="text-[10px] text-slate-500">admin@liveazy.in</p>
              </div>
            </div>
          </div>
        </header>
        <main className="mx-auto max-w-[1600px] space-y-6 px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
          <section className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
            <div>
              <h1 className="text-3xl font-extrabold tracking-tight text-[#0F2942]">
                Manage Trending Rentals
              </h1>
              <p className="mt-2 text-sm leading-6 text-slate-500">
                Manage the homepage section content, visibility, and product order.
              </p>
            </div>
            <button
              type="button"
              onClick={() => void fetchData()}
              disabled={loading}
              className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm font-semibold hover:bg-slate-50 disabled:opacity-50"
            >
              <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
              Refresh
            </button>
          </section>
          {notice && (
            <div
              role="status"
              className={`flex items-start gap-2 rounded-xl border p-4 text-sm ${
                noticeError
                  ? "border-red-200 bg-red-50 text-red-700"
                  : "border-teal-100 bg-white text-[#0F2942]"
              }`}
            >
              {noticeError ? (
                <AlertCircle size={18} className="mt-0.5 shrink-0" />
              ) : (
                <CheckCircle2 size={18} className="mt-0.5 shrink-0 text-teal-700" />
              )}
              <span className="flex-1">{notice}</span>
              <button
                type="button"
                onClick={() => setNotice("")}
                aria-label="Dismiss message"
              >
                <X size={16} />
              </button>
            </div>
          )}
          <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
            <div className="mb-5 flex items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-bold text-[#0F2942]">
                  Section Settings
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  Edit the heading and subtitle displayed on the homepage.
                </p>
              </div>
              <span
                className={`rounded-full px-3 py-1.5 text-xs font-bold ${
                  settings.isActive
                    ? "bg-emerald-50 text-emerald-700"
                    : "bg-slate-100 text-slate-600"
                }`}
              >
                {settings.isActive ? "Active" : "Inactive"}
              </span>
            </div>
            <div className="space-y-5">
              <div>
                <label
                  htmlFor="trending-heading"
                  className="mb-2 block text-sm font-semibold text-[#0F2942]"
                >
                  Section heading
                </label>
                <input
                  id="trending-heading"
                  value={settings.heading}
                  maxLength={120}
                  onChange={(event) =>
                    setSettings((current) => ({
                      ...current,
                      heading: event.target.value,
                    }))
                  }
                  placeholder="Trending Rentals in Your City"
                  className="h-11 w-full rounded-lg border border-slate-200 px-4 text-sm outline-none focus:border-teal-600 focus:ring-2 focus:ring-teal-600/10"
                />
              </div>
              <div>
                <label
                  htmlFor="trending-subtitle"
                  className="mb-2 block text-sm font-semibold text-[#0F2942]"
                >
                  Section subtitle
                </label>
                <textarea
                  id="trending-subtitle"
                  value={settings.subtitle}
                  maxLength={300}
                  rows={3}
                  onChange={(event) =>
                    setSettings((current) => ({
                      ...current,
                      subtitle: event.target.value,
                    }))
                  }
                  placeholder="Write a short description for customers"
                  className="w-full rounded-lg border border-slate-200 px-4 py-3 text-sm outline-none focus:border-teal-600 focus:ring-2 focus:ring-teal-600/10"
                />
                <p className="mt-1 text-right text-xs text-slate-400">
                  {settings.subtitle.length}/300
                </p>
              </div>
              <label className="flex cursor-pointer items-center justify-between gap-4 rounded-lg border border-slate-200 bg-[#F8FAFC] p-4">
                <span>
                  <span className="block text-sm font-bold text-[#0F2942]">
                    Show on homepage
                  </span>
                  <span className="mt-1 block text-xs text-slate-500">
                    When inactive, this section will be hidden from the public homepage.
                  </span>
                </span>
                <input
                  type="checkbox"
                  checked={settings.isActive}
                  onChange={(event) =>
                    setSettings((current) => ({
                      ...current,
                      isActive: event.target.checked,
                    }))
                  }
                  className="h-5 w-5 accent-teal-700"
                />
              </label>
              <button
                type="button"
                onClick={() => void saveSettings()}
                disabled={savingSettings || loading}
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#0F2942] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#193D5C] disabled:opacity-50"
              >
                {savingSettings ? (
                  <RefreshCw size={16} className="animate-spin" />
                ) : (
                  <Save size={16} />
                )}
                Save Section Settings
              </button>
            </div>
          </section>
          <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
            <div className="flex flex-col justify-between gap-3 border-b border-slate-100 p-5 sm:flex-row sm:items-center sm:p-6">
              <div>
                <h2 className="text-lg font-bold text-[#0F2942]">
                  Select Trending Products
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  Maximum 4 products. Use the order buttons to set the display order on the homepage.
                </p>
              </div>
              <span className="w-fit rounded-full bg-[#D9F4F2] px-3 py-1.5 text-xs font-bold text-[#00696E]">
                {selectedIds.length}/{MAX_PRODUCTS} selected
              </span>
            </div>
            {loading ? (
              <div className="p-12 text-center text-sm text-slate-500">
                <RefreshCw size={20} className="mx-auto mb-3 animate-spin" />
                Loading products...
              </div>
            ) : products.length === 0 ? (
              <div className="p-12 text-center text-sm text-slate-500">
                No products found. Add products from the Products page first.
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4 p-5 sm:grid-cols-2 xl:grid-cols-3 sm:p-6">
                {products.map((product) => {
                  const selected = selectedIds.includes(product.id);
                  const rent = getRent(product);
                  return (
                    <button
                      type="button"
                      key={product.id}
                      onClick={() => toggleProduct(product.id)}
                      disabled={!selected && selectedIds.length >= MAX_PRODUCTS}
                      className={`relative flex min-w-0 gap-4 rounded-xl border p-4 text-left transition ${
                        selected
                          ? "border-teal-500 bg-[#F2FBFA] ring-1 ring-teal-500/20"
                          : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50"
                      } disabled:cursor-not-allowed disabled:opacity-50`}
                    >
                      <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-[#F3F6FE]">
                        {product.image ? (
                          <img
                            src={product.image}
                            alt={product.name}
                            className="h-full w-full object-contain"
                          />
                        ) : (
                          <Armchair size={26} className="text-slate-300" />
                        )}
                      </div>
                      <div className="min-w-0 flex-1 pr-5">
                        <p className="line-clamp-2 text-sm font-bold text-[#0F2942]">
                          {product.name}
                        </p>
                        <p className="mt-1 text-xs text-slate-500">
                          {getCategory(product)}
                        </p>
                        <p className="mt-2 text-sm font-extrabold text-teal-700">
                          {rent !== null
                            ? `₹${rent.toLocaleString("en-IN")}/mo`
                            : "Rent not set"}
                        </p>
                        {product.isActive === false && (
                          <p className="mt-1 text-xs font-semibold text-amber-700">
                            Product inactive
                          </p>
                        )}
                      </div>
                      <span
                        className={`absolute right-3 top-3 flex h-5 w-5 items-center justify-center rounded-full border ${
                          selected
                            ? "border-teal-700 bg-teal-700 text-white"
                            : "border-slate-300 bg-white"
                        }`}
                      >
                        {selected && <CheckCircle2 size={14} />}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}
            <div className="border-t border-slate-100 bg-[#F8FAFC] p-5 sm:p-6">
              <h3 className="mb-4 text-sm font-bold text-[#0F2942]">
                Homepage display order
              </h3>
              {selectedProducts.length === 0 ? (
                <p className="rounded-lg border border-dashed border-slate-300 bg-white p-5 text-sm text-slate-500">
                  No products selected yet.
                </p>
              ) : (
                <div className="space-y-2">
                  {selectedProducts.map((product, index) => (
                    <div
                      key={product.id}
                      className="flex items-center gap-3 rounded-lg border border-slate-200 bg-white p-3"
                    >
                      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#D9F4F2] text-sm font-extrabold text-[#00696E]">
                        {index + 1}
                      </span>
                      {product.image && (
                        <img
                          src={product.image}
                          alt=""
                          className="h-11 w-11 shrink-0 rounded-md bg-slate-50 object-contain"
                        />
                      )}
                      <span className="min-w-0 flex-1 truncate text-sm font-semibold text-[#0F2942]">
                        {product.name}
                      </span>
                      <button
                        type="button"
                        title="Move up"
                        aria-label={`Move ${product.name} up`}
                        disabled={index === 0}
                        onClick={() => moveProduct(index, -1)}
                        className="rounded-md border border-slate-200 p-2 text-slate-600 hover:bg-slate-50 disabled:opacity-30"
                      >
                        <ArrowUp size={16} />
                      </button>
                      <button
                        type="button"
                        title="Move down"
                        aria-label={`Move ${product.name} down`}
                        disabled={index === selectedProducts.length - 1}
                        onClick={() => moveProduct(index, 1)}
                        className="rounded-md border border-slate-200 p-2 text-slate-600 hover:bg-slate-50 disabled:opacity-30"
                      >
                        <ArrowDown size={16} />
                      </button>
                      <button
                        type="button"
                        title="Remove"
                        aria-label={`Remove ${product.name}`}
                        onClick={() => toggleProduct(product.id)}
                        className="rounded-md p-2 text-red-600 hover:bg-red-50"
                      >
                        <X size={16} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
              <div className="mt-5 flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
                <p className="text-xs leading-5 text-slate-500">
                  Save the order to apply the selected sequence to the homepage.
                </p>
                <button
                  type="button"
                  onClick={() => void saveProducts()}
                  disabled={savingProducts || loading}
                  className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#0F2942] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#193D5C] disabled:opacity-50"
                >
                  {savingProducts ? (
                    <RefreshCw size={16} className="animate-spin" />
                  ) : (
                    <Save size={16} />
                  )}
                  Save Selected Products
                </button>
              </div>
            </div>
          </section>
          <footer className="flex flex-col justify-between gap-2 border-t border-slate-200 py-5 text-xs text-slate-400 sm:flex-row">
            <p>© {new Date().getFullYear()} LIVEAZY. Rental Commerce Hub.</p>
            <p>Admin Workspace</p>
          </footer>
        </main>
      </div>
    </div>
  );
}
