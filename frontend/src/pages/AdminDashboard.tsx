
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

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

export default function AdminDashboard() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  const navigate = useNavigate();

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const [categoriesResponse, productsResponse] =
          await Promise.all([
            fetch(`${API_URL}/categories`),
            fetch(`${API_URL}/products`),
          ]);

        if (!categoriesResponse.ok || !productsResponse.ok) {
          throw new Error("Failed to fetch dashboard data");
        }

        const categoriesData = await categoriesResponse.json();
        const productsData = await productsResponse.json();

        setCategories(
          Array.isArray(categoriesData) ? categoriesData : []
        );

        setProducts(
          Array.isArray(productsData) ? productsData : []
        );
      } catch (error) {
        console.error("Error fetching dashboard data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  const totalCategories = categories.length;
  const totalProducts = products.length;

  const activeCategories = categories.filter(
    (category) => category.isActive
  ).length;

  const activeProducts = products.filter(
    (product) => product.isActive
  ).length;

  const managementCards = [
    {
      title: "Categories Master",
      description: "Add, edit and manage furniture categories",
      icon: "📂",
      detail: "Total Categories",
      count: totalCategories,
      route: "/admin/categories",
      button: "Manage Categories",
    },
    {
      title: "Products Master",
      description: "Add, edit and manage furniture products",
      icon: "🛋️",
      detail: "Total Products",
      count: totalProducts,
      route: "/admin/products",
      button: "Manage Products",
    },
    {
      title: "Banner Management",
      description: "Change and manage your main homepage banner",
      icon: "🖼️",
      detail: "Main Homepage Banner",
      route: "/admin/banner",
      button: "Manage Banner",
    },
    {
      title: "Promo Banner Management",
      description:
        "Edit promo images, headings, subtitles, buttons and links",
      icon: "🎯",
      detail: "Homepage Promotional Cards",
      route: "/admin/promo-banners",
      button: "Manage Promo Banners",
    },
    {
      title: "WhatsApp Settings",
      description: "Change the WhatsApp contact number and message",
      icon: "📱",
      detail: "Website Contact",
      route: "/admin/settings",
      button: "Manage WhatsApp",
    },
  ];

  return (
    <div className="min-h-screen bg-[#F5FAFA] p-6 md:p-8">
      {/* Header */}
      <div className="mb-8">
        <p className="mb-2 text-sm font-semibold uppercase tracking-wider text-[#0795A3]">
          LIVEAZY Admin Panel
        </p>

        <h1 className="text-3xl font-bold text-[#123B63]">
          Dashboard
        </h1>

        <p className="mt-1 text-gray-500">
          Welcome to LIVEAZY Admin Panel
        </p>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Categories"
          value={loading ? "..." : totalCategories}
          color="text-[#123B63]"
        />

        <StatCard
          title="Total Products"
          value={loading ? "..." : totalProducts}
          color="text-[#123B63]"
        />

        <StatCard
          title="Active Categories"
          value={loading ? "..." : activeCategories}
          color="text-[#0795A3]"
        />

        <StatCard
          title="Active Products"
          value={loading ? "..." : activeProducts}
          color="text-[#0795A3]"
        />
      </div>

      {/* Management Sections */}
      <div className="mt-10">
        <div className="mb-5">
          <h2 className="text-xl font-bold text-[#123B63]">
            Manage Store
          </h2>

          <p className="mt-1 text-sm text-gray-500">
            Manage your LIVEAZY website content from one place.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
          {managementCards.map((card) => (
            <div
              key={card.route}
              className="rounded-xl border border-[#D8EEF0] bg-white p-6 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h3 className="text-lg font-bold text-[#123B63]">
                    {card.title}
                  </h3>

                  <p className="mt-2 text-sm leading-6 text-gray-500">
                    {card.description}
                  </p>
                </div>

                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[#0795A3]/10">
                  <span className="text-xl">{card.icon}</span>
                </div>
              </div>

              <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-gray-100 pt-4">
                <p className="text-sm text-gray-500">
                  {card.detail}

                  {card.count !== undefined && (
                    <span className="ml-2 font-bold text-[#123B63]">
                      {loading ? "..." : card.count}
                    </span>
                  )}
                </p>

                <button
                  type="button"
                  onClick={() => navigate(card.route)}
                  className="rounded-lg bg-[#123B63] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#0795A3]"
                >
                  {card.button}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

interface StatCardProps {
  title: string;
  value: string | number;
  color: string;
}

function StatCard({ title, value, color }: StatCardProps) {
  return (
    <div className="rounded-xl border border-[#D8EEF0] bg-white p-6 shadow-sm">
      <p className="text-sm text-gray-500">{title}</p>

      <h2 className={`mt-2 text-3xl font-bold ${color}`}>
        {value}
      </h2>
    </div>
  );
}
