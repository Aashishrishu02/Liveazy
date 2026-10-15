
import { useEffect, useState } from "react";
import { useNavigate, NavLink } from "react-router-dom";
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
  Bell,
  Plus,
  Package,
  Layers3,
  CheckCircle2,
  Menu,
  X,
  ArrowUpRight,
} from "lucide-react";

const API_URL = import.meta.env.VITE_API_URL;

interface Category {
  id: string;
  name: string;
  isActive: boolean;
}

interface Product {
  id: string;
  name: string;
  isActive: boolean;
}

const navigation = [
  { label: "Dashboard", path: "/admin/dashboard", icon: LayoutDashboard },
  { label: "Categories", path: "/admin/categories", icon: Tags },
  { label: "Products", path: "/admin/products", icon: Armchair },
  { label: "Banners", path: "/admin/banner", icon: Images },
  { label: "Promo Banners", path: "/admin/promo-banners", icon: Megaphone },
  { label: "WhatsApp Settings", path: "/admin/settings", icon: MessageCircle },
];

export default function AdminDashboard() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const navigate = useNavigate();

  useEffect(() => {
    let cancelled = false;

    async function loadDashboard() {
      try {
        const [categoryResponse, productResponse] = await Promise.all([
          fetch(`${API_URL}/categories`),
          fetch(`${API_URL}/products`),
        ]);

        if (!categoryResponse.ok || !productResponse.ok) {
          throw new Error("Unable to load dashboard data");
        }

        const [categoryData, productData] = await Promise.all([
          categoryResponse.json(),
          productResponse.json(),
        ]);

        if (!cancelled) {
          setCategories(Array.isArray(categoryData) ? categoryData : []);
          setProducts(Array.isArray(productData) ? productData : []);
        }
      } catch (error) {
        console.error("Dashboard loading error:", error);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadDashboard();

    return () => {
      cancelled = true;
    };
  }, []);

  const activeCategories = categories.filter((item) => item.isActive).length;
  const activeProducts = products.filter((item) => item.isActive).length;

  const stats = [
    {
      label: "Total Products",
      value: products.length,
      detail: "Products in your catalogue",
      icon: Package,
      iconStyle: "bg-blue-50 text-[#0F2942]",
    },
    {
      label: "Total Categories",
      value: categories.length,
      detail: "Categories in your store",
      icon: Layers3,
      iconStyle: "bg-teal-50 text-[#008A90]",
    },
    {
      label: "Active Products",
      value: activeProducts,
      detail: "Currently marked active",
      icon: CheckCircle2,
      iconStyle: "bg-emerald-50 text-emerald-700",
    },
    {
      label: "Active Categories",
      value: activeCategories,
      detail: "Available categories",
      icon: Tags,
      iconStyle: "bg-orange-50 text-[#E96B43]",
    },
  ];

  const managementCards = [
    {
      title: "Manage Products",
      description: "Add products, update rental prices and manage availability.",
      path: "/admin/products",
      icon: Armchair,
      color: "bg-blue-50 text-[#0F2942]",
      action: "View products",
    },
    {
      title: "Manage Categories",
      description: "Organise your furniture and appliance categories.",
      path: "/admin/categories",
      icon: Tags,
      color: "bg-teal-50 text-[#008A90]",
      action: "View categories",
    },
    {
      title: "Homepage Banners",
      description: "Manage your main homepage banner and its content.",
      path: "/admin/banner",
      icon: Images,
      color: "bg-orange-50 text-[#E96B43]",
      action: "Manage banners",
    },
    {
      title: "Promotional Banners",
      description: "Update promotional images, text and call-to-action links.",
      path: "/admin/promo-banners",
      icon: Megaphone,
      color: "bg-purple-50 text-purple-700",
      action: "Manage promotions",
    },
    {
      title: "WhatsApp Settings",
      description: "Manage the contact number and enquiry message.",
      path: "/admin/settings",
      icon: MessageCircle,
      color: "bg-green-50 text-green-700",
      action: "Open settings",
    },
  ];

  function logout() {
    localStorage.removeItem("token");
    navigate("/admin");
  }

  const filteredCards = managementCards.filter((card) =>
    `${card.title} ${card.description}`
      .toLowerCase()
      .includes(search.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-[#F5F7FA] text-[#142B43]">
      {sidebarOpen && (
        <button
          type="button"
          aria-label="Close sidebar"
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
              <p className="mt-0.5 text-xs text-slate-500">
                Rental Commerce Hub
              </p>
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
                  <span>{item.label}</span>
                </NavLink>
              );
            })}
          </nav>

          <div className="my-6 border-t border-slate-100" />

          <a
            href="/"
            className="flex items-center gap-3 rounded-lg px-3 py-3 text-sm font-semibold text-slate-600 transition hover:bg-slate-100 hover:text-[#0F2942]"
          >
            <Store size={19} strokeWidth={1.8} />
            <span>View Website</span>
            <ArrowUpRight size={15} className="ml-auto" />
          </a>
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
        <header className="sticky top-0 z-30 flex h-[72px] items-center justify-between gap-4 border-b border-slate-200 bg-white/95 px-4 backdrop-blur-md sm:px-6 lg:px-8">
          <div className="flex min-w-0 items-center gap-3">
            <button
              type="button"
              aria-label="Open sidebar"
              onClick={() => setSidebarOpen(true)}
              className="rounded-lg border border-slate-200 p-2 hover:bg-slate-50 lg:hidden"
            >
              <Menu size={20} />
            </button>

            <div className="relative hidden sm:block">
              <Search
                size={17}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              />
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search management sections..."
                className="h-10 w-64 rounded-lg border border-transparent bg-[#F5F7FA] pl-10 pr-4 text-sm outline-none transition focus:border-[#008A90] focus:bg-white lg:w-[340px]"
              />
            </div>
          </div>

          <div className="flex items-center gap-3 sm:gap-5">
            <div className="hidden items-center gap-2 rounded-full bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-700 sm:flex">
              <span className="h-2 w-2 rounded-full bg-emerald-500" />
              Admin workspace
            </div>

            <button
              type="button"
              aria-label="Notifications"
              className="relative rounded-full p-2 text-slate-500 transition hover:bg-slate-100"
            >
              <Bell size={20} />
            </button>

            <div className="flex items-center gap-2 border-l border-slate-200 pl-3 sm:pl-5">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#D9F4F2] text-sm font-bold text-[#00696E]">
                A
              </div>
              <div className="hidden sm:block">
                <p className="text-sm font-bold text-[#0F2942]">
                  Admin
                </p>
                <p className="text-xs text-slate-500">
                  LIVEAZY Console
                </p>
              </div>
            </div>
          </div>
        </header>

        <main className="mx-auto max-w-[1600px] space-y-7 px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
          <section className="flex flex-col justify-between gap-5 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7 xl:flex-row xl:items-center">
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
                Manage your rental catalogue, categories, homepage banners
                and customer enquiry settings from one place.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => navigate("/admin/products")}
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#0F2942] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#193D5C]"
              >
                <Plus size={17} />
                Manage Products
              </button>

              <button
                type="button"
                onClick={() => navigate("/admin/categories")}
                className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-[#0F2942] transition hover:bg-slate-50"
              >
                <Plus size={17} />
                Add Category
              </button>
            </div>
          </section>

          <section>
            <div className="mb-4 flex items-end justify-between gap-3">
              <div>
                <h3 className="text-lg font-bold text-[#0F2942]">
                  Store Statistics
                </h3>
                <p className="mt-1 text-sm text-slate-500">
                  Current catalogue counts from your backend.
                </p>
              </div>
              <span className="text-xs text-slate-400">
                {loading ? "Updating..." : "Latest API response"}
              </span>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
              {stats.map((stat) => {
                const Icon = stat.icon;

                return (
                  <div
                    key={stat.label}
                    className="group rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition duration-200 hover:-translate-y-1 hover:shadow-md sm:p-6"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-medium text-slate-500">
                          {stat.label}
                        </p>
                        <p className="mt-3 text-3xl font-extrabold tracking-tight text-[#0F2942]">
                          {loading ? "—" : stat.value}
                        </p>
                      </div>

                      <div
                        className={`flex h-11 w-11 items-center justify-center rounded-xl ${stat.iconStyle}`}
                      >
                        <Icon size={21} strokeWidth={1.8} />
                      </div>
                    </div>

                    <div className="mt-5 border-t border-slate-100 pt-3">
                      <p className="text-xs text-slate-500">{stat.detail}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          <section>
            <div className="mb-4">
              <h3 className="text-lg font-bold text-[#0F2942]">
                Manage Your Store
              </h3>
              <p className="mt-1 text-sm text-slate-500">
                Choose a section to manage your website content.
              </p>
            </div>

            {filteredCards.length === 0 ? (
              <div className="rounded-xl border border-dashed border-slate-300 bg-white p-10 text-center text-sm text-slate-500">
                No management sections match "{search}".
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 2xl:grid-cols-3">
                {filteredCards.map((card) => {
                  const Icon = card.icon;

                  return (
                    <article
                      key={card.path}
                      className="group flex min-h-[210px] flex-col rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition duration-200 hover:-translate-y-1 hover:border-[#B6E4E2] hover:shadow-md sm:p-6"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div
                          className={`flex h-12 w-12 items-center justify-center rounded-xl ${card.color}`}
                        >
                          <Icon size={23} strokeWidth={1.8} />
                        </div>
                        <button
                          type="button"
                          aria-label={card.action}
                          onClick={() => navigate(card.path)}
                          className="rounded-lg p-2 text-slate-400 transition hover:bg-slate-100 hover:text-[#008A90]"
                        >
                          <ArrowUpRight size={19} />
                        </button>
                      </div>

                      <h4 className="mt-5 text-base font-bold text-[#0F2942]">
                        {card.title}
                      </h4>
                      <p className="mt-2 flex-1 text-sm leading-6 text-slate-500">
                        {card.description}
                      </p>

                      <button
                        type="button"
                        onClick={() => navigate(card.path)}
                        className="mt-5 flex w-fit items-center gap-2 text-sm font-bold text-[#00777C] transition hover:gap-3"
                      >
                        {card.action}
                        <ArrowUpRight size={15} />
                      </button>
                    </article>
                  );
                })}
              </div>
            )}
          </section>

          <footer className="flex flex-col justify-between gap-2 border-t border-slate-200 py-5 text-xs text-slate-400 sm:flex-row sm:items-center">
            <p>© {new Date().getFullYear()} LIVEAZY. Rental Commerce Hub.</p>
            <p>Admin Workspace</p>
          </footer>
        </main>
      </div>
    </div>
  );
}
