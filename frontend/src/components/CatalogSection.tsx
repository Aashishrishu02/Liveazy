import React, { useEffect, useMemo, useState } from "react";
import { ChevronRight } from "lucide-react";
import ProductCard from "./ProductCard";
import type { Product } from "../types/rental";
import { getApiBaseUrl, fetchJsonDeduplicated, fetchCategoriesDeduplicated } from "../utils/api";
import { getWishlist, subscribeWishlist, toggleWishlist } from "../utils/wishlist";

interface CatalogSectionProps {
  selectedCategory: string;
  onSelectCategory: (categoryId: string) => void;
  onQuickView: (product: Product, defaultTenure?: number) => void;
  onAddToCart: (product: Product, tenure: number) => void;
  searchQuery?: string;
}

interface BackendCategory {
  id: string;
  name: string;
  isActive?: boolean;
  displayOrder?: number | null;
}

interface BackendProduct {
  id: string;
  name: string;
  description?: string | null;
  price: number;
  image?: string | null;
  images?: Array<{ id: string; imageUrl: string; sortOrder?: number }>;
  category?: { id: string; name: string } | string | null;
  categoryId: string;
  isActive: boolean;
  rent12M?: number | null;
  deposit12M?: number | null;
  rent6M?: number | null;
  deposit6M?: number | null;
  rent3M?: number | null;
  deposit3M?: number | null;
}

export const CatalogSection: React.FC<CatalogSectionProps> = ({
  selectedCategory,
  onSelectCategory,
  onQuickView,
  onAddToCart,
  searchQuery = "",
}) => {
  const [categories, setCategories] = useState<BackendCategory[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortOption, setSortOption] = useState<string>("popular");
  const [wishlistIds, setWishlistIds] = useState<Set<string>>(() => new Set(getWishlist()));

  // Subscribe to live wishlist changes
  useEffect(() => {
    return subscribeWishlist((ids) => {
      setWishlistIds(new Set(ids));
    });
  }, []);

  // Fetch categories and products from backend APIs
  useEffect(() => {
    let cancelled = false;
    const apiBase = getApiBaseUrl();

    async function loadData() {
      try {
        setLoading(true);

        // Fetch categories
        const catRes = await fetchCategoriesDeduplicated(apiBase);
        let catList: BackendCategory[] = [];
        if (Array.isArray(catRes)) {
          catList = catRes as BackendCategory[];
        } else if (catRes && typeof catRes === "object" && "data" in catRes && Array.isArray((catRes as { data: unknown }).data)) {
          catList = (catRes as { data: BackendCategory[] }).data;
        }

        if (!cancelled) {
          const activeCats = catList
            .filter((c) => c.isActive !== false)
            .sort((a, b) => (a.displayOrder ?? 999) - (b.displayOrder ?? 999));
          setCategories(activeCats);
        }

        // Fetch products
        const prodRes = await fetchJsonDeduplicated<unknown>(`${apiBase}/products`);
        let prodList: BackendProduct[] = [];
        if (Array.isArray(prodRes)) {
          prodList = prodRes as BackendProduct[];
        } else if (prodRes && typeof prodRes === "object" && "data" in prodRes && Array.isArray((prodRes as { data: unknown }).data)) {
          prodList = (prodRes as { data: BackendProduct[] }).data;
        }

        if (!cancelled) {
          const mapped: Product[] = prodList
            .filter((p) => p.isActive !== false)
            .map((p) => {
              const catName =
                typeof p.category === "object" && p.category
                  ? p.category.name
                  : typeof p.category === "string"
                  ? p.category
                  : "Furniture";

              const baseMonthly = Number(p.rent12M || p.price || 499);
              const originalPrice = p.price && p.price > baseMonthly ? Math.round(p.price) : Math.round(baseMonthly * 1.5);

              // Gather extra gallery photos if uploaded
              const extraSpecs: string[] = [];
              if (p.description) {
                extraSpecs.push(p.description);
              }

              return {
                id: String(p.id),
                name: p.name,
                category: (catName as Product["category"]) || "Furniture",
                monthlyPrice: baseMonthly,
                originalPrice,
                rating: 4.8,
                reviewsCount: 45,
                image: p.image || "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&w=600&q=80",
                images: p.images,
                tag: p.rent12M && p.price && p.price > p.rent12M ? "Trending" : undefined,
                deposit: Number(p.deposit12M || 0),
                availableTenures: [3, 6, 12],
                specs: extraSpecs,
                // Extra fields for tenure calculations
                rent12M: p.rent12M,
                rent6M: p.rent6M,
                rent3M: p.rent3M,
                deposit12M: p.deposit12M,
                deposit6M: p.deposit6M,
                deposit3M: p.deposit3M,
                categoryId: p.categoryId,
              } as Product & Record<string, unknown>;
            });

          setProducts(mapped);
        }
      } catch (e) {
        console.warn("Failed to load catalog products:", e);
        if (!cancelled) {
          setProducts([]);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void loadData();
    return () => {
      cancelled = true;
    };
  }, []);

  const handleToggleWishlist = (product: Product) => {
    toggleWishlist(product.id);
  };

  // Filter products by selected category and search query
  const filteredProducts = useMemo(() => {
    let list = [...products];

    // Filter by category
    const cat = selectedCategory.trim().toLowerCase();
    if (cat && cat !== "all") {
      list = list.filter((p) => {
        const pRecord = p as unknown as { categoryId?: string };
        const matchesId = pRecord.categoryId && pRecord.categoryId.toLowerCase() === cat;
        const matchesName = (p.category || "").toLowerCase() === cat;
        return matchesId || matchesName;
      });
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          (p.category && p.category.toLowerCase().includes(q))
      );
    }

    // Sort products
    if (sortOption === "price-asc") {
      list.sort((a, b) => a.monthlyPrice - b.monthlyPrice);
    } else if (sortOption === "price-desc") {
      list.sort((a, b) => b.monthlyPrice - a.monthlyPrice);
    } else if (sortOption === "rating") {
      list.sort((a, b) => (b.rating || 0) - (a.rating || 0));
    }

    return list;
  }, [products, selectedCategory, searchQuery, sortOption]);

  const activeCategoryObj = useMemo(() => {
    if (selectedCategory.toLowerCase() === "all") return null;
    return categories.find(
      (c) =>
        c.id.toLowerCase() === selectedCategory.toLowerCase() ||
        c.name.toLowerCase() === selectedCategory.toLowerCase()
    );
  }, [categories, selectedCategory]);

  const categoryTitle = activeCategoryObj
    ? `${activeCategoryObj.name} Products`
    : "All Products";

  return (
    <section id="trending" className="scroll-mt-24 py-8 sm:py-12 bg-[#fafbfc]">
      <div className="ref-container">
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-6">
          <div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-[#002B62] leading-tight">
              {categoryTitle}
            </h2>
            <p className="mt-1 text-xs sm:text-sm text-gray-500">
              Hand-picked furniture, appliances &amp; combos rented across India
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 sm:gap-3">
            <span className="rounded-full bg-[#E6F5F7] px-3 py-1 text-xs font-bold text-[#007C8A]">
              {filteredProducts.length} {filteredProducts.length === 1 ? "Product" : "Products"}
            </span>

            <select
              value={sortOption}
              onChange={(e) => setSortOption(e.target.value)}
              aria-label="Sort Products"
              className="rounded-xl border border-gray-200 bg-white px-3 py-1.5 text-xs font-semibold text-gray-700 outline-none transition focus:border-[#007C8A]"
            >
              <option value="popular">Sort: Popular</option>
              <option value="price-asc">Price: Low to High</option>
              <option value="price-desc">Price: High to Low</option>
              <option value="rating">Customer Rating</option>
            </select>

            <button
              type="button"
              onClick={() => onSelectCategory("all")}
              className="flex items-center gap-1 text-xs font-semibold text-[#007C8A] hover:underline"
            >
              View All <ChevronRight size={14} />
            </button>
          </div>
        </div>

        {/* Dynamic Category Tabs From Database */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 mb-6 no-scrollbar">
          <button
            type="button"
            onClick={() => onSelectCategory("all")}
            className={`shrink-0 rounded-lg px-4 py-2 text-xs sm:text-sm font-semibold transition border ${
              selectedCategory.toLowerCase() === "all"
                ? "border-[#002B62] bg-[#002B62] text-white shadow-md shadow-[#002B62]/20"
                : "border-gray-200 bg-white text-gray-700 hover:border-[#007C8A] hover:bg-[#E6F5F7] hover:text-[#002B62]"
            }`}
          >
            All
          </button>

          {categories.map((cat) => {
            const isActive =
              selectedCategory.toLowerCase() === cat.id.toLowerCase() ||
              selectedCategory.toLowerCase() === cat.name.toLowerCase();
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => onSelectCategory(cat.id)}
                className={`shrink-0 rounded-lg px-4 py-2 text-xs sm:text-sm font-semibold transition border ${
                  isActive
                    ? "border-[#002B62] bg-[#002B62] text-white shadow-md shadow-[#002B62]/20"
                    : "border-gray-200 bg-white text-gray-700 hover:border-[#007C8A] hover:bg-[#E6F5F7] hover:text-[#002B62]"
                }`}
              >
                {cat.name}
              </button>
            );
          })}
        </div>

        {/* Loading State */}
        {loading && (
          <div className="grid grid-cols-2 gap-2.5 sm:gap-5 md:grid-cols-3 lg:grid-cols-4">
            {[1, 2, 3, 4].map((n) => (
              <div key={n} className="rounded-2xl border border-gray-200 bg-white p-4 animate-pulse">
                <div className="aspect-[4/3] rounded-xl bg-gray-200 mb-3" />
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2" />
                <div className="h-3 bg-gray-200 rounded w-1/2" />
              </div>
            ))}
          </div>
        )}

        {/* Products Grid */}
        {!loading && filteredProducts.length > 0 ? (
          <div className="grid grid-cols-2 gap-2.5 sm:gap-5 md:grid-cols-3 lg:grid-cols-4">
            {filteredProducts.map((p) => (
              <ProductCard
                key={p.id}
                product={p}
                isWishlisted={wishlistIds.has(p.id)}
                onToggleWishlist={handleToggleWishlist}
                onQuickView={onQuickView}
                onAddToCart={onAddToCart}
              />
            ))}
          </div>
        ) : !loading ? (
          <div className="rounded-2xl border border-gray-100 bg-white py-14 text-center">
            <p className="text-base font-bold text-gray-800">
              No products found in this category
            </p>
            <p className="mt-1 text-xs text-gray-400">
              Try selecting another category or resetting your filter.
            </p>
            <button
              type="button"
              onClick={() => onSelectCategory("all")}
              className="mt-4 rounded-xl bg-[#002B62] px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-[#001F47]"
            >
              Reset to All Products
            </button>
          </div>
        ) : null}
      </div>
    </section>
  );
};

export default CatalogSection;
