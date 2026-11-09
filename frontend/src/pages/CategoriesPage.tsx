import { useState, useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import {
  Search,
  ArrowRight,
  Layers,
  Bed,
  Armchair,
  Utensils,
  BookOpen,
  Package,
  Tv,
  Flame,
  Sparkles,
  AlertCircle,
  RefreshCw,
  FolderOpen,
} from "lucide-react";

import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { getApiBaseUrl, fetchCategoriesDeduplicated } from "../utils/api";

interface Category {
  id: string;
  name: string;
  description?: string | null;
  image?: string | null;
  isActive: boolean;
  displayOrder?: number | null;
  _count?: {
    products?: number;
  };
}

// Fallback icon for categories without custom uploaded images
function getCategoryFallbackIcon(name: string, size = 32) {
  const lower = (name || "").toLowerCase();
  if (lower.includes("bed") || lower.includes("mattress") || lower.includes("bedroom")) {
    return <Bed size={size} className="stroke-[1.9]" />;
  }
  if (lower.includes("living") || lower.includes("sofa") || lower.includes("seating") || lower.includes("chair")) {
    return <Armchair size={size} className="stroke-[1.9]" />;
  }
  if (lower.includes("dining") || lower.includes("kitchen") || lower.includes("table")) {
    return <Utensils size={size} className="stroke-[1.9]" />;
  }
  if (lower.includes("study") || lower.includes("office") || lower.includes("desk")) {
    return <BookOpen size={size} className="stroke-[1.9]" />;
  }
  if (lower.includes("combo") || lower.includes("package") || lower.includes("plan") || lower.includes("bundle")) {
    return <Package size={size} className="stroke-[1.9]" />;
  }
  if (lower.includes("appliance") || lower.includes("electronic") || lower.includes("tv")) {
    return <Tv size={size} className="stroke-[1.9]" />;
  }
  if (lower.includes("deal") || lower.includes("offer") || lower.includes("flash")) {
    return <Flame size={size} className="stroke-[1.9]" />;
  }
  return <Layers size={size} className="stroke-[1.9]" />;
}

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [brokenImages, setBrokenImages] = useState<Record<string, boolean>>({});

  const loadCategories = async () => {
    setLoading(true);
    setError(null);
    try {
      const apiBase = getApiBaseUrl();
      const res = await fetchCategoriesDeduplicated(apiBase);

      let list: Category[] = [];
      if (Array.isArray(res)) {
        list = res as Category[];
      } else if (
        res &&
        typeof res === "object" &&
        "data" in res &&
        Array.isArray((res as { data: unknown }).data)
      ) {
        list = (res as { data: Category[] }).data;
      }

      // Filter only active categories and sort by admin displayOrder
      const activeList = list
        .filter((c) => c.isActive !== false)
        .sort((a, b) => (a.displayOrder ?? 999) - (b.displayOrder ?? 999));

      setCategories(activeList);
    } catch (err) {
      console.error("Failed to load categories:", err);
      setError(
        err instanceof Error
          ? err.message
          : "Unable to load categories. Please check your connection and try again."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadCategories();
  }, []);

  const handleImageError = (id: string) => {
    setBrokenImages((prev) => ({ ...prev, [id]: true }));
  };

  // Filter categories by user search query
  const filteredCategories = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return categories;
    return categories.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        (c.description && c.description.toLowerCase().includes(q))
    );
  }, [categories, searchQuery]);

  return (
    <div className="min-h-screen bg-[#fafbfc] font-['Poppins',sans-serif] text-gray-900 flex flex-col justify-between antialiased">
      <div>
        <Navbar />

        <main className="ref-container py-6 sm:py-10">
          {/* Breadcrumb */}
          <nav aria-label="Breadcrumb" className="mb-5 flex items-center gap-2 text-xs text-gray-500">
            <Link to="/" className="hover:text-[#002B62] transition">
              Home
            </Link>
            <span>/</span>
            <span className="font-semibold text-[#002B62]">Categories</span>
          </nav>

          {/* Banner Header */}
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-[#001F47] via-[#002B62] to-[#007C8A] p-6 sm:p-10 text-white shadow-xl mb-8">
            <div className="relative z-10 max-w-2xl">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 border border-white/20 px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-[#E6F5F7]">
                <Sparkles size={13} className="text-[#00A8B5]" />
                Explore All Categories
              </span>

              <h1 className="mt-3 text-2xl sm:text-4xl font-extrabold text-white tracking-tight leading-tight">
                Browse Furniture &amp; Appliance Categories
              </h1>

              <p className="mt-2.5 text-xs sm:text-sm text-[#EBF2FA]/90 leading-relaxed max-w-xl">
                Explore our complete range of room setups and home appliances. Curated, sanitized, and delivered straight to your home with zero hassle.
              </p>
            </div>

            {/* Background Glow */}
            <div className="absolute top-0 right-0 -mr-20 -mt-20 h-64 w-64 rounded-full bg-[#00A8B5]/20 blur-3xl pointer-events-none" />
          </div>

          {/* Search & Counter Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <div className="relative flex-1 max-w-md">
              <Search
                size={18}
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
              />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search categories (e.g. Bed, Living, Dining)..."
                className="w-full rounded-xl border border-[#CBDCE6] bg-white pl-10 pr-4 py-2.5 text-xs sm:text-sm text-gray-800 placeholder-gray-400 shadow-2xs transition focus:border-[#007C8A] focus:outline-none focus:ring-2 focus:ring-[#007C8A]/20"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-gray-400 hover:text-gray-700"
                >
                  Clear
                </button>
              )}
            </div>

            <div className="text-xs sm:text-sm font-semibold text-gray-500">
              {loading ? (
                <span>Loading categories...</span>
              ) : (
                <span>
                  Showing <strong className="text-[#002B62]">{filteredCategories.length}</strong> {filteredCategories.length === 1 ? "category" : "categories"}
                </span>
              )}
            </div>
          </div>

          {/* Loading Skeleton Grid */}
          {loading && (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3.5 sm:gap-5">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((n) => (
                <div
                  key={n}
                  className="rounded-2xl border border-gray-100 bg-white p-3.5 sm:p-4 shadow-xs animate-pulse"
                >
                  <div className="aspect-[4/3] rounded-xl bg-gray-100 mb-3" />
                  <div className="h-4 bg-gray-100 rounded w-3/4 mb-2" />
                  <div className="h-3 bg-gray-100 rounded w-1/2" />
                </div>
              ))}
            </div>
          )}

          {/* Error State */}
          {!loading && error && (
            <div className="rounded-2xl border border-rose-100 bg-rose-50/50 p-8 text-center max-w-md mx-auto my-12">
              <AlertCircle size={36} className="mx-auto text-rose-500 mb-3" />
              <h3 className="text-base font-bold text-gray-900">Failed to load categories</h3>
              <p className="text-xs sm:text-sm text-gray-600 mt-1 mb-4">{error}</p>
              <button
                type="button"
                onClick={() => void loadCategories()}
                className="inline-flex items-center gap-2 rounded-xl bg-[#002B62] px-4 py-2 text-xs sm:text-sm font-bold text-white hover:bg-[#001F47] transition shadow-xs cursor-pointer"
              >
                <RefreshCw size={14} />
                <span>Retry</span>
              </button>
            </div>
          )}

          {/* Empty State */}
          {!loading && !error && filteredCategories.length === 0 && (
            <div className="rounded-2xl border border-dashed border-gray-200 bg-[#F4F8FA] p-10 sm:p-14 text-center max-w-lg mx-auto my-12">
              <FolderOpen size={42} className="mx-auto text-[#007C8A]/60 mb-3" />
              <h3 className="text-base sm:text-lg font-bold text-[#002B62]">
                {searchQuery ? "No matching categories" : "No active categories"}
              </h3>
              <p className="text-xs sm:text-sm text-gray-500 mt-1 max-w-sm mx-auto">
                {searchQuery
                  ? `We couldn't find any category matching "${searchQuery}". Try a different keyword.`
                  : "Categories are currently being updated by the team. Please check back shortly!"}
              </p>
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="mt-4 inline-flex items-center gap-1.5 rounded-xl bg-[#007C8A] px-4 py-2 text-xs font-bold text-white transition hover:bg-[#006a77]"
                >
                  View all categories
                </button>
              )}
            </div>
          )}

          {/* Responsive Categories Grid */}
          {!loading && !error && filteredCategories.length > 0 && (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-2.5 sm:gap-5">
              {filteredCategories.map((item) => {
                const hasValidImage = Boolean(item.image && !brokenImages[item.id]);
                const productCount = item._count?.products;

                return (
                  <Link
                    key={item.id}
                    to={`/category/${item.id}`}
                    className="group relative flex flex-col justify-between rounded-2xl border border-[#E1ECF2] bg-white p-2.5 sm:p-4 shadow-xs transition-all duration-200 hover:-translate-y-1 hover:border-[#007C8A]/40 hover:shadow-lg hover:shadow-[#007C8A]/10 cursor-pointer overflow-hidden"
                  >
                    <div>
                      {/* Image Frame */}
                      <div className="relative aspect-[4/3] w-full rounded-xl overflow-hidden bg-[#F4F8FA] border border-gray-100/80 mb-3 flex items-center justify-center">
                        {hasValidImage ? (
                          <img
                            src={item.image!}
                            alt={item.name}
                            onError={() => handleImageError(item.id)}
                            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                            loading="lazy"
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center text-[#007C8A] bg-[#E6F5F7]/60 group-hover:bg-[#E6F5F7] transition-colors p-4">
                            {getCategoryFallbackIcon(item.name, 34)}
                          </div>
                        )}

                        {/* Product Count Pill */}
                        {productCount !== undefined && productCount > 0 && (
                          <span className="absolute top-2 right-2 rounded-full bg-[#001F47]/75 backdrop-blur-xs px-2 py-0.5 text-[10px] font-bold text-white shadow-xs">
                            {productCount} {productCount === 1 ? "item" : "items"}
                          </span>
                        )}
                      </div>

                      {/* Title & Description */}
                      <div className="space-y-1">
                        <h2 className="text-sm sm:text-[15px] font-bold text-gray-900 group-hover:text-[#007C8A] transition-colors line-clamp-1">
                          {item.name}
                        </h2>

                        {item.description && (
                          <p className="text-[11px] sm:text-xs text-gray-500 line-clamp-2 leading-relaxed">
                            {item.description}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Footer CTA */}
                    <div className="mt-3 pt-2.5 border-t border-gray-50 flex items-center justify-between text-[11px] sm:text-xs font-bold text-[#007C8A] group-hover:underline">
                      <span>Explore</span>
                      <ArrowRight size={13} className="transition-transform group-hover:translate-x-1" />
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </main>
      </div>

      <Footer />
    </div>
  );
}
