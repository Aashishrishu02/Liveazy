import { useEffect, useMemo, useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  Tags,
  Armchair,
  Images,
  Megaphone,
  MessageCircle,
  MessageSquareText,
  Store,
  LogOut,
  Search,
  Bell,
  Plus,
  Package,
  Layers3,
  CheckCircle2,
  Menu,
  ArrowUpRight,
  RefreshCw,
  ChevronRight,
  ExternalLink,
  Settings,
  ShieldCheck,
  AlertCircle,
  Contact,
  Star,
  FileText,
} from "lucide-react";

const API_URL = import.meta.env.VITE_API_URL;

interface Category {
  id: string;
  name: string;
  isActive?: boolean;
}

interface Product {
  id: string;
  name: string;
  description?: string | null;
  image?: string | null;
  price?: number | null;
  rent12M?: number | null;
  rent6M?: number | null;
  rent3M?: number | null;
  categoryId?: string;
  category?: { id?: string; name?: string } | string | null;
  isActive?: boolean;
  createdAt?: string;
}

interface Banner {
  id?: string;
  image?: string;
  heading?: string;
  title?: string;
  subtitle?: string;
  description?: string;
  topLabel?: string;
  isActive?: boolean;
  status?: string;
}

interface PromoBanner {
  id?: string;
  label?: string;
  heading?: string;
  title?: string;
  image?: string;
  isActive?: boolean;
  isPublished?: boolean;
  status?: string;
}

interface WhatsAppSettings {
  whatsappNumber?: string;
  whatsappMessage?: string;
}

const navigation = [
  {
    label: "Dashboard",
    path: "/admin/dashboard",
    icon: LayoutDashboard,
  },
  {
    label: "Categories",
    path: "/admin/categories",
    icon: Tags,
  },
  {
    label: "Products",
    path: "/admin/products",
    icon: Armchair,
  },
  {
    label: "Banners",
    path: "/admin/banner",
    icon: Images,
  },
  {
    label: "Promo Banners",
    path: "/admin/promo-banners",
    icon: Megaphone,
  },
  {
    label: "WhatsApp Settings",
    path: "/admin/settings",
    icon: MessageCircle,
  },
  {
    label: "Contact Management",
    path: "/admin/contact-management",
    icon: Contact,
  },
    
  {
    label: "Feedback Master",
    path: "/admin/feedback",
    icon: MessageSquareText,
  },
  { label: "Trending Rentals", path: "/admin/trending-rentals", icon: Star },
  {
  label: "Blog Management",
  path: "/admin/blogs",
  icon: FileText,
},
];

async function fetchJson<T>(path: string): Promise<T> {
  const response = await fetch(`${API_URL}${path}`);

  if (!response.ok) {
    throw new Error(`${path} request failed (${response.status})`);
  }

  return (await response.json()) as T;
}

function toArray<T>(value: unknown): T[] {
  if (Array.isArray(value)) {
    return value as T[];
  }

  if (value && typeof value === "object" && "data" in value) {
    const data = (value as { data?: unknown }).data;

    if (Array.isArray(data)) {
      return data as T[];
    }
  }

  return [];
}

function toObject<T>(value: unknown): T | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return null;
  }

  if ("data" in value) {
    const data = (value as { data?: unknown }).data;

    if (data && typeof data === "object" && !Array.isArray(data)) {
      return data as T;
    }
  }

  return value as T;
}

function toBanner(value: unknown): Banner | null {
  if (Array.isArray(value)) {
    return (
      (value.find(
        (item) =>
          item &&
          typeof item === "object" &&
          (item as Banner).isActive !== false,
      ) as Banner | undefined) ?? null
    );
  }

  return toObject<Banner>(value);
}

function isEnabled(item: {
  isActive?: boolean;
  isPublished?: boolean;
  status?: string;
}): boolean {
  if (typeof item.isActive === "boolean") {
    return item.isActive;
  }

  if (typeof item.isPublished === "boolean") {
    return item.isPublished;
  }

  if (item.status) {
    return ["active", "published", "live"].includes(
      item.status.toLowerCase(),
    );
  }

  return true;
}

function getCategoryName(
  product: Product,
  categories: Category[],
): string {
  if (
    product.category &&
    typeof product.category === "object" &&
    product.category.name
  ) {
    return product.category.name;
  }

  return (
    categories.find((category) => category.id === product.categoryId)?.name ??
    "Uncategorised"
  );
}

function getMonthlyRent(product: Product): number | null {
  const planPrices = [
    product.rent12M,
    product.rent6M,
    product.rent3M,
  ].filter(
    (value): value is number =>
      typeof value === "number" &&
      Number.isFinite(value) &&
      value > 0,
  );

  if (planPrices.length > 0) {
    return Math.min(...planPrices);
  }

  if (
    typeof product.price === "number" &&
    Number.isFinite(product.price) &&
    product.price > 0
  ) {
    return product.price;
  }

  return null;
}

function formatCurrency(value: number | null | undefined): string {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return "—";
  }

  return `₹${value.toLocaleString("en-IN", {
    maximumFractionDigits: 2,
  })}`;
}

function formatDate(value?: string): string {
  if (!value) return "Date unavailable";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Date unavailable";
  }

  return date.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export default function AdminDashboard() {
  const navigate = useNavigate();

  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [banner, setBanner] = useState<Banner | null>(null);
  const [promoBanners, setPromoBanners] = useState<PromoBanner[]>([]);
  const [whatsapp, setWhatsapp] = useState<WhatsAppSettings | null>(null);

  const [loading, setLoading] = useState(true);
  const [apiError, setApiError] = useState(false);
  const [search, setSearch] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    let cancelled = false;

    async function loadDashboard() {
      setLoading(true);
      setApiError(false);

      const results = await Promise.allSettled([
        fetchJson<unknown>("/categories"),
        fetchJson<unknown>("/products"),
        fetchJson<unknown>("/banners"),
        fetchJson<unknown>("/promo-banners"),
        fetchJson<unknown>("/settings/whatsapp"),
      ]);

      if (cancelled) return;

      const [
        categoryResult,
        productResult,
        bannerResult,
        promoResult,
        whatsappResult,
      ] = results;

      if (categoryResult.status === "fulfilled") {
        setCategories(toArray<Category>(categoryResult.value));
      } else {
        setCategories([]);
        setApiError(true);
        console.error(
          "Dashboard categories error:",
          categoryResult.reason,
        );
      }

      if (productResult.status === "fulfilled") {
        setProducts(toArray<Product>(productResult.value));
      } else {
        setProducts([]);
        setApiError(true);
        console.error(
          "Dashboard products error:",
          productResult.reason,
        );
      }

      if (bannerResult.status === "fulfilled") {
        setBanner(toBanner(bannerResult.value));
      } else {
        setBanner(null);
        console.error(
          "Dashboard banner error:",
          bannerResult.reason,
        );
      }

      if (promoResult.status === "fulfilled") {
        setPromoBanners(toArray<PromoBanner>(promoResult.value));
      } else {
        setPromoBanners([]);
        console.error(
          "Dashboard promo banner error:",
          promoResult.reason,
        );
      }

      if (whatsappResult.status === "fulfilled") {
        setWhatsapp(toObject<WhatsAppSettings>(whatsappResult.value));
      } else {
        setWhatsapp(null);
        console.error(
          "Dashboard WhatsApp settings error:",
          whatsappResult.reason,
        );
      }

      setLoading(false);
    }

    void loadDashboard();

    return () => {
      cancelled = true;
    };
  }, [refreshKey]);

  const activeCategories = categories.filter(
    (category) => category.isActive !== false,
  ).length;

  const activeProducts = products.filter(
    (product) => product.isActive !== false,
  ).length;

  const activePromoBanners = promoBanners.filter(isEnabled).length;
  const activeHeroBanner = banner ? isEnabled(banner) : false;

  const filteredProducts = useMemo(() => {
    const query = search.trim().toLowerCase();

    const latestProducts = [...products].sort((a, b) => {
      const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return dateB - dateA;
    });

    if (!query) {
      return latestProducts.slice(0, 5);
    }

    return latestProducts
      .filter((product) => {
        const categoryName = getCategoryName(product, categories);

        return (
          product.name.toLowerCase().includes(query) ||
          product.id.toLowerCase().includes(query) ||
          categoryName.toLowerCase().includes(query)
        );
      })
      .slice(0, 8);
  }, [products, categories, search]);

  const stats = [
    {
      title: "Total Products",
      value: products.length,
      detail: `${activeProducts} active products`,
      icon: Package,
      iconClass: "bg-blue-50 text-[#0F2942]",
      path: "/admin/products",
    },
    {
      title: "Total Categories",
      value: categories.length,
      detail: `${activeCategories} active categories`,
      icon: Layers3,
      iconClass: "bg-teal-50 text-[#008A90]",
      path: "/admin/categories",
    },
    {
      title: "Homepage Banner",
      value: activeHeroBanner ? 1 : 0,
      detail: activeHeroBanner ? "Active banner" : "No active banner detected",
      icon: Images,
      iconClass: "bg-indigo-50 text-indigo-700",
      path: "/admin/banner",
    },
    {
      title: "Active Promotions",
      value: activePromoBanners,
      detail: `${promoBanners.length} total campaigns`,
      icon: Megaphone,
      iconClass: "bg-orange-50 text-[#E96B43]",
      path: "/admin/promo-banners",
    },
  ];

  const heroTitle =
    banner?.heading ||
    banner?.title ||
    "Your next chapter starts here";

  const heroDescription =
    banner?.subtitle ||
    banner?.description ||
    "Manage the message shown on your homepage.";

  function logout() {
    localStorage.removeItem("token");
    navigate("/admin");
  }

  return (
    <div className="min-h-screen bg-[#F5F7FA] text-[#142B43]">
      {/* Mobile sidebar backdrop */}
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

      {/* Main area */}
      <div className="min-h-screen lg:pl-[260px]">
        {/* Top bar */}
        <header className="sticky top-0 z-30 flex h-[72px] items-center justify-between gap-4 border-b border-slate-200 bg-white/95 px-4 backdrop-blur-md sm:px-6 lg:px-8">
          <div className="flex min-w-0 items-center gap-3">
            <button
              type="button"
              aria-label="Open navigation"
              onClick={() => setSidebarOpen(true)}
              className="rounded-lg border border-slate-200 p-2 hover:bg-slate-50 lg:hidden"
            >
              <Menu size={20} />
            </button>

            <div className="relative w-full max-w-[420px]">
              <Search
                size={17}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              />
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search products, categories or ID..."
                className="h-10 w-full rounded-lg border border-transparent bg-[#F5F7FA] pl-10 pr-4 text-sm outline-none transition focus:border-[#008A90] focus:bg-white"
              />
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-3 sm:gap-5">
            <div className="hidden items-center gap-2 rounded-full bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-700 sm:flex">
              <span className="h-2 w-2 rounded-full bg-emerald-500" />
              Admin workspace
            </div>

            <div className="relative">
              <button
                type="button"
                aria-label="Notifications"
                onClick={() => setNotificationsOpen((previous) => !previous)}
                className="relative rounded-full p-2 text-slate-500 transition hover:bg-slate-100"
              >
                <Bell size={20} />

                {apiError && (
                  <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-red-500" />
                )}
              </button>

              {notificationsOpen && (
                <div className="absolute right-0 top-12 z-50 w-72 rounded-xl border border-slate-200 bg-white p-4 shadow-xl">
                  <h3 className="text-sm font-bold text-[#0F2942]">
                    Notifications
                  </h3>

                  {apiError ? (
                    <p className="mt-2 text-xs leading-5 text-amber-700">
                      Product or category data could not be loaded. Check the
                      backend connection and retry.
                    </p>
                  ) : (
                    <p className="mt-2 text-xs leading-5 text-slate-500">
                      No new dashboard notifications.
                    </p>
                  )}
                </div>
              )}
            </div>

            <div className="flex items-center gap-2 border-l border-slate-200 pl-3 sm:pl-5">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#D9F4F2] text-sm font-bold text-[#00696E]">
                A
              </div>

              <div className="hidden sm:block">
                <p className="text-sm font-bold text-[#0F2942]">Admin</p>
                <p className="text-xs text-slate-500">LIVEAZY Console</p>
              </div>
            </div>
          </div>
        </header>

        <main className="mx-auto max-w-[1600px] space-y-6 px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
          {/* Welcome section */}
          <section className="flex flex-col justify-between gap-5 rounded-xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6 xl:flex-row xl:items-center">
            <div>
              <div className="mb-3 flex flex-wrap items-center gap-3">
                <span className="rounded-md bg-[#E3F5F4] px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.15em] text-[#00777C]">
                  Dashboard Overview
                </span>

                <span className="flex items-center gap-1.5 text-xs font-medium text-slate-500">
                  <span className="h-2 w-2 rounded-full bg-emerald-500" />
                  Store management
                </span>
              </div>

              <h2 className="text-2xl font-extrabold tracking-tight text-[#0F2942] sm:text-3xl">
                Welcome to LIVEAZY
              </h2>

              <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
                Manage your rental catalogue, categories, homepage banners and
                customer enquiry settings from one place.
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => navigate("/admin/products")}
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#0F2942] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#193D5C]"
              >
                <Plus size={16} />
                Manage Products
              </button>

              <button
                type="button"
                onClick={() => navigate("/admin/categories")}
                className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-[#0F2942] transition hover:bg-slate-50"
              >
                <Plus size={16} />
                Add Category
              </button>
            </div>
          </section>

          {/* API error */}
          {apiError && (
            <div className="flex flex-col gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-start gap-3">
                <AlertCircle
                  size={19}
                  className="mt-0.5 shrink-0 text-amber-700"
                />

                <div>
                  <p className="text-sm font-bold text-amber-900">
                    Some dashboard data could not be loaded
                  </p>
                  <p className="mt-1 text-xs text-amber-800">
                    Check your backend connection and API URL.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setRefreshKey((previous) => previous + 1)}
                disabled={loading}
                className="inline-flex items-center justify-center gap-2 rounded-lg border border-amber-300 bg-white px-3 py-2 text-xs font-bold text-amber-900 hover:bg-amber-100 disabled:opacity-50"
              >
                <RefreshCw size={14} />
                Retry
              </button>
            </div>
          )}

          {/* Statistics */}
          <section>
            <div className="mb-4 flex items-end justify-between gap-3">
              <div>
                <h3 className="text-lg font-bold text-[#0F2942]">
                  Store Statistics
                </h3>

                <p className="mt-1 text-sm text-slate-500">
                  Current store data from your backend.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setRefreshKey((previous) => previous + 1)}
                disabled={loading}
                className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-600 transition hover:bg-slate-50 disabled:opacity-50"
              >
                <RefreshCw
                  size={14}
                  className={loading ? "animate-spin" : ""}
                />
                Refresh
              </button>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
              {stats.map((stat) => {
                const Icon = stat.icon;

                return (
                  <button
                    type="button"
                    key={stat.title}
                    onClick={() => navigate(stat.path)}
                    className="rounded-xl border border-slate-200 bg-white p-5 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-medium text-slate-500">
                          {stat.title}
                        </p>

                        <p className="mt-3 text-3xl font-extrabold tracking-tight text-[#0F2942]">
                          {loading ? "—" : stat.value}
                        </p>
                      </div>

                      <div
                        className={`flex h-11 w-11 items-center justify-center rounded-xl ${stat.iconClass}`}
                      >
                        <Icon size={21} strokeWidth={1.8} />
                      </div>
                    </div>

                    <div className="mt-5 flex items-center justify-between gap-2 border-t border-slate-100 pt-3">
                      <span className="text-xs text-slate-500">
                        {stat.detail}
                      </span>

                      <ArrowUpRight size={15} className="text-slate-400" />
                    </div>
                  </button>
                );
              })}
            </div>
          </section>

          {/* Recent products and management panels */}
          <section className="grid grid-cols-1 items-start gap-5 2xl:grid-cols-[minmax(0,1.7fr)_minmax(300px,0.9fr)]">
            {/* Recent products table */}
            <div className="min-w-0 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 p-5">
                <div>
                  <h3 className="text-lg font-bold text-[#0F2942]">
                    Recent Products
                  </h3>

                  <p className="mt-1 text-xs text-slate-500">
                    Latest products in your rental catalogue.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => navigate("/admin/products")}
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-[#00777C] hover:underline"
                >
                  View All
                  <ArrowUpRight size={14} />
                </button>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-3">
                <span className="rounded-md bg-slate-100 px-2.5 py-1.5 text-[10px] font-semibold text-slate-600">
                  {products.length} total products
                </span>

                <button
                  type="button"
                  onClick={() => navigate("/admin/products")}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-[#0F2942] px-3 py-2 text-xs font-bold text-white transition hover:bg-[#193D5C]"
                >
                  <Plus size={14} />
                  Manage Products
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full min-w-[600px] text-left">
                  <thead>
                    <tr className="border-y border-slate-100 bg-[#F8FAFC]">
                      <th className="px-5 py-3 text-[10px] font-bold uppercase tracking-wider text-slate-500">
                        Product
                      </th>

                      <th className="px-3 py-3 text-[10px] font-bold uppercase tracking-wider text-slate-500">
                        Category
                      </th>

                      <th className="px-3 py-3 text-[10px] font-bold uppercase tracking-wider text-slate-500">
                        Rent / Month
                      </th>

                      <th className="px-5 py-3 text-[10px] font-bold uppercase tracking-wider text-slate-500">
                        Status
                      </th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-slate-100">
                    {loading ? (
                      <tr>
                        <td
                          colSpan={4}
                          className="px-5 py-12 text-center text-sm text-slate-400"
                        >
                          Loading products...
                        </td>
                      </tr>
                    ) : filteredProducts.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="px-5 py-12 text-center">
                          <Package
                            size={28}
                            className="mx-auto mb-2 text-slate-300"
                          />

                          <p className="text-sm font-semibold text-slate-500">
                            {search
                              ? "No matching products found"
                              : "No products available yet"}
                          </p>

                          {!search && (
                            <button
                              type="button"
                              onClick={() => navigate("/admin/products")}
                              className="mt-3 text-xs font-bold text-[#00777C] hover:underline"
                            >
                              Add your first product
                            </button>
                          )}
                        </td>
                      </tr>
                    ) : (
                      filteredProducts.map((product) => {
                        const rent = getMonthlyRent(product);

                        const categoryName = getCategoryName(
                          product,
                          categories,
                        );

                        const active = product.isActive !== false;

                        return (
                          <tr
                            key={product.id}
                            className="transition hover:bg-slate-50"
                          >
                            <td className="px-5 py-3">
                              <div className="flex min-w-0 items-center gap-3">
                                {product.image ? (
                                  <img
                                    src={product.image}
                                    alt={product.name}
                                    className="h-11 w-11 shrink-0 rounded-lg border border-slate-100 bg-slate-50 object-cover"
                                    onError={(event) => {
                                      event.currentTarget.style.visibility =
                                        "hidden";
                                    }}
                                  />
                                ) : (
                                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-[#EEF3F8] text-[#0F2942]">
                                    <Package size={19} />
                                  </div>
                                )}

                                <div className="min-w-0">
                                  <button
                                    type="button"
                                    onClick={() =>
                                      navigate("/admin/products")
                                    }
                                    className="block max-w-[210px] truncate text-left text-xs font-bold text-[#0F2942] hover:text-[#008A90]"
                                  >
                                    {product.name}
                                  </button>

                                  <p className="mt-1 max-w-[210px] truncate font-mono text-[9px] text-slate-400">
                                    ID: {product.id}
                                  </p>
                                </div>
                              </div>
                            </td>

                            <td className="px-3 py-3">
                              <span className="inline-flex max-w-[135px] truncate rounded-md bg-blue-50 px-2 py-1.5 text-[10px] font-semibold text-blue-700">
                                {categoryName}
                              </span>
                            </td>

                            <td className="px-3 py-3">
                              <p className="text-xs font-extrabold text-[#0F2942]">
                                {formatCurrency(rent)}
                              </p>

                              <p className="mt-1 text-[9px] text-slate-400">
                                {product.createdAt
                                  ? formatDate(product.createdAt)
                                  : "Monthly rental"}
                              </p>
                            </td>

                            <td className="px-5 py-3">
                              <span
                                className={`inline-flex items-center gap-1.5 rounded-full px-2 py-1 text-[9px] font-bold ${
                                  active
                                    ? "bg-emerald-50 text-emerald-700"
                                    : "bg-slate-100 text-slate-500"
                                }`}
                              >
                                <span
                                  className={`h-1.5 w-1.5 rounded-full ${
                                    active ? "bg-emerald-500" : "bg-slate-400"
                                  }`}
                                />

                                {active ? "Active" : "Inactive"}
                              </span>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 px-5 py-3 text-[10px] text-slate-400">
                <span>
                  Showing {loading ? 0 : filteredProducts.length} of{" "}
                  {products.length} products
                </span>

                <button
                  type="button"
                  onClick={() => navigate("/admin/products")}
                  className="font-bold text-[#00777C] hover:underline"
                >
                  Open product management
                </button>
              </div>
            </div>

            {/* Right-side panels */}
            <div className="grid grid-cols-1 gap-5 md:grid-cols-2 2xl:grid-cols-1">
              {/* Homepage banner */}
              <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
                <div className="flex items-center justify-between gap-3 border-b border-slate-100 px-5 py-4">
                  <div>
                    <h3 className="text-base font-bold text-[#0F2942]">
                      Homepage Banner
                    </h3>

                    <p className="mt-1 text-xs text-slate-500">
                      Homepage hero preview
                    </p>
                  </div>

                  <button
                    type="button"
                    aria-label="Manage homepage banner"
                    onClick={() => navigate("/admin/banner")}
                    className="rounded-lg p-2 text-slate-500 transition hover:bg-slate-100 hover:text-[#008A90]"
                  >
                    <ArrowUpRight size={17} />
                  </button>
                </div>

                <div className="p-4">
                  <div className="relative flex min-h-[180px] flex-col justify-between overflow-hidden rounded-xl bg-[#0F2942] p-5 text-white">
                    {banner?.image && (
                      <img
                        src={banner.image}
                        alt="Homepage banner"
                        className="absolute inset-0 h-full w-full object-cover"
                        onError={(event) => {
                          event.currentTarget.style.display = "none";
                        }}
                      />
                    )}

                    <div className="absolute inset-0 bg-gradient-to-r from-[#0F2942]/90 via-[#0F2942]/65 to-[#0F2942]/20" />

                    <div className="relative z-10">
                      <span className="inline-flex rounded-md bg-white/15 px-2 py-1 text-[9px] font-bold uppercase tracking-wider">
                        {activeHeroBanner ? "Active Banner" : "Banner Preview"}
                      </span>

                      <h4 className="mt-4 max-w-[260px] text-lg font-extrabold leading-6">
                        {heroTitle}
                      </h4>

                      <p className="mt-2 max-w-[280px] text-[11px] leading-5 text-white/80">
                        {heroDescription}
                      </p>
                    </div>

                    <div className="relative z-10 mt-4 flex items-center justify-between gap-2">
                      <span className="text-[10px] text-white/80">
                        LIVEAZY Homepage
                      </span>

                      <span className="rounded-md bg-white px-3 py-1.5 text-[10px] font-bold text-[#0F2942]">
                        Preview
                      </span>
                    </div>
                  </div>

                  <div className="mt-4 flex items-center justify-between gap-3">
                    <div>
                      <p className="text-xs font-bold text-[#0F2942]">
                        Banner status
                      </p>

                      <p className="mt-1 text-[10px] text-slate-500">
                        {activeHeroBanner
                          ? "Active banner found"
                          : "Check banner configuration"}
                      </p>
                    </div>

                    <span
                      className={`rounded-full px-2.5 py-1 text-[9px] font-bold ${
                        activeHeroBanner
                          ? "bg-emerald-50 text-emerald-700"
                          : "bg-amber-50 text-amber-700"
                      }`}
                    >
                      {activeHeroBanner ? "Active" : "Check"}
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => navigate("/admin/banner")}
                    className="mt-4 flex w-full items-center justify-center gap-2 rounded-lg border border-slate-200 px-3 py-2.5 text-xs font-bold text-[#0F2942] transition hover:bg-slate-50"
                  >
                    <Images size={15} />
                    Edit Homepage Banner
                  </button>
                </div>
              </div>

              {/* WhatsApp gateway */}
              <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
                <div className="flex items-center justify-between gap-3 border-b border-slate-100 px-5 py-4">
                  <div>
                    <h3 className="text-base font-bold text-[#0F2942]">
                      WhatsApp Gateway
                    </h3>

                    <p className="mt-1 text-xs text-slate-500">
                      Customer enquiry settings
                    </p>
                  </div>

                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700">
                    <MessageCircle size={21} />
                  </div>
                </div>

                <div className="space-y-4 p-5">
                  <div className="rounded-lg border border-slate-100 bg-[#F8FAFC] p-3">
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                      Configured number
                    </p>

                    <p className="mt-2 break-all text-lg font-extrabold text-[#0F2942]">
                      {whatsapp?.whatsappNumber || "Not configured"}
                    </p>
                  </div>

                  <div className="flex items-start gap-2.5">
                    <div
                      className={`mt-0.5 rounded-full p-1 ${
                        whatsapp?.whatsappNumber
                          ? "bg-emerald-50 text-emerald-700"
                          : "bg-amber-50 text-amber-700"
                      }`}
                    >
                      {whatsapp?.whatsappNumber ? (
                        <CheckCircle2 size={14} />
                      ) : (
                        <AlertCircle size={14} />
                      )}
                    </div>

                    <div>
                      <p className="text-xs font-bold text-[#0F2942]">
                        {whatsapp?.whatsappNumber
                          ? "Contact number configured"
                          : "Contact number needs attention"}
                      </p>

                      <p className="mt-1 text-[10px] leading-5 text-slate-500">
                        Used to open WhatsApp for customer rental enquiries.
                      </p>
                    </div>
                  </div>

                  <div className="rounded-lg border border-emerald-100 bg-[#F3FBF8] p-3">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-800">
                      Default enquiry message
                    </p>

                    <p className="mt-2 line-clamp-4 whitespace-pre-wrap break-words text-xs leading-5 text-slate-600">
                      {whatsapp?.whatsappMessage || "No message configured."}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => navigate("/admin/settings")}
                    className="flex w-full items-center justify-center gap-2 rounded-lg bg-[#0F2942] px-3 py-2.5 text-xs font-bold text-white transition hover:bg-[#193D5C]"
                  >
                    <Settings size={15} />
                    Configure WhatsApp
                    <ArrowUpRight size={14} />
                  </button>

                  <p className="text-[10px] leading-4 text-slate-400">
                    This panel shows the saved contact and enquiry message. It
                    does not indicate a verified Meta API connection.
                  </p>
                </div>
              </div>

              {/* Quick actions */}
              <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm md:col-span-2 2xl:col-span-1">
                <h3 className="text-base font-bold text-[#0F2942]">
                  Quick Actions
                </h3>

                <p className="mt-1 text-xs text-slate-500">
                  Jump directly to a store management section.
                </p>

                <div className="mt-4 space-y-2">
                  <button
                    type="button"
                    onClick={() => navigate("/admin/categories")}
                    className="flex w-full items-center justify-between gap-3 rounded-lg border border-slate-100 p-3 text-left transition hover:border-[#B6E4E2] hover:bg-[#F4FBFA]"
                  >
                    <span className="flex items-center gap-3">
                      <span className="rounded-lg bg-teal-50 p-2 text-[#008A90]">
                        <Tags size={17} />
                      </span>

                      <span>
                        <span className="block text-xs font-bold text-[#0F2942]">
                          Categories
                        </span>

                        <span className="mt-1 block text-[10px] text-slate-500">
                          Organise your catalogue
                        </span>
                      </span>
                    </span>

                    <ChevronRight size={16} className="text-slate-400" />
                  </button>

                  <button
                    type="button"
                    onClick={() => navigate("/admin/promo-banners")}
                    className="flex w-full items-center justify-between gap-3 rounded-lg border border-slate-100 p-3 text-left transition hover:border-[#B6E4E2] hover:bg-[#F4FBFA]"
                  >
                    <span className="flex items-center gap-3">
                      <span className="rounded-lg bg-orange-50 p-2 text-[#E96B43]">
                        <Megaphone size={17} />
                      </span>

                      <span>
                        <span className="block text-xs font-bold text-[#0F2942]">
                          Promo Banners
                        </span>

                        <span className="mt-1 block text-[10px] text-slate-500">
                          Manage promotions and campaigns
                        </span>
                      </span>
                    </span>

                    <ChevronRight size={16} className="text-slate-400" />
                  </button>

                  <button
                    type="button"
                    onClick={() => navigate("/admin/settings")}
                    className="flex w-full items-center justify-between gap-3 rounded-lg border border-slate-100 p-3 text-left transition hover:border-[#B6E4E2] hover:bg-[#F4FBFA]"
                  >
                    <span className="flex items-center gap-3">
                      <span className="rounded-lg bg-emerald-50 p-2 text-emerald-700">
                        <ShieldCheck size={17} />
                      </span>

                      <span>
                        <span className="block text-xs font-bold text-[#0F2942]">
                          WhatsApp Settings
                        </span>

                        <span className="mt-1 block text-[10px] text-slate-500">
                          Update contact number and message
                        </span>
                      </span>
                    </span>

                    <ChevronRight size={16} className="text-slate-400" />
                  </button>

                  {/* Contact Management Quick Action */}
                  <button
                    type="button"
                    onClick={() =>
                      navigate("/admin/contact-management")
                    }
                    className="flex w-full items-center justify-between gap-3 rounded-lg border border-slate-100 p-3 text-left transition hover:border-[#B6E4E2] hover:bg-[#F4FBFA]"
                  >
                    <span className="flex items-center gap-3">
                      <span className="rounded-lg bg-teal-50 p-2 text-[#008A90]">
                        <Contact size={17} />
                      </span>

                      <span>
                        <span className="block text-xs font-bold text-[#0F2942]">
                          Contact Management
                        </span>

                        <span className="mt-1 block text-[10px] text-slate-500">
                          Manage contact details, FAQs and enquiries
                        </span>
                      </span>
                    </span>

                    <ChevronRight size={16} className="text-slate-400" />
                  </button>

                  <a
                    href="/"
                    className="flex w-full items-center justify-between gap-3 rounded-lg border border-slate-100 p-3 text-left transition hover:border-[#B6E4E2] hover:bg-[#F4FBFA]"
                  >
                    <span className="flex items-center gap-3">
                      <span className="rounded-lg bg-blue-50 p-2 text-blue-700">
                        <Store size={17} />
                      </span>

                      <span>
                        <span className="block text-xs font-bold text-[#0F2942]">
                          View Website
                        </span>

                        <span className="mt-1 block text-[10px] text-slate-500">
                          Open customer-facing website
                        </span>
                      </span>
                    </span>

                    <ExternalLink size={14} className="text-slate-400" />
                  </a>
                </div>
              </div>
            </div>
          </section>

          {/* Footer */}
          <footer className="flex flex-col justify-between gap-2 border-t border-slate-200 py-5 text-xs text-slate-400 sm:flex-row sm:items-center">
            <p>
              © {new Date().getFullYear()} LIVEAZY. Rental Commerce Hub.
            </p>

            <p>Admin Workspace</p>
          </footer>
        </main>
      </div>
    </div>
  );
}