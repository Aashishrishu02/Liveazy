import React, { useEffect, useState } from "react";
import { Sparkles, ArrowRight } from "lucide-react";
import ProductCard from "./ProductCard";
import type { Product } from "../types/rental";
import { getApiBaseUrl, fetchJsonDeduplicated } from "../utils/api";

interface TrendingProduct {
  id: string | number;
  name: string;
  image?: string | null;
  category?: string | { name?: string } | null;
  rent3M?: number | string | null;
  rent6M?: number | string | null;
  rent12M?: number | string | null;
  deposit12M?: number | string | null;
  price?: number | null;
  description?: string | null;
}

interface TrendingRentalsResponse {
  heading?: string;
  subtitle?: string;
  isActive?: boolean;
  products?: TrendingProduct[];
}

interface TrendingRentalsProps {
  onQuickView?: (product: Product, defaultTenure?: number) => void;
  onAddToCart?: (product: Product, tenure: number) => void;
}

export const TrendingRentals: React.FC<TrendingRentalsProps> = ({
  onQuickView,
  onAddToCart,
}) => {
  const [data, setData] = useState<TrendingRentalsResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    const apiBase = getApiBaseUrl();

    async function fetchTrendingRentals() {
      try {
        setLoading(true);
        const result = await fetchJsonDeduplicated<TrendingRentalsResponse>(
          `${apiBase}/trending-rentals`
        );
        if (!cancelled) {
          setData(result);
        }
      } catch (error) {
        if (!cancelled) {
          console.warn("Trending rentals error:", error);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void fetchTrendingRentals();
    return () => {
      cancelled = true;
    };
  }, []);

  if (loading || !data?.isActive || !data.products?.length) {
    return null;
  }

  const mappedProducts: Product[] = data.products.map((p) => {
    const baseMonthly = Number(p.rent12M || p.price || 499);
    const catName =
      typeof p.category === "object" && p.category
        ? p.category.name
        : typeof p.category === "string"
        ? p.category
        : "Furniture";

    return {
      id: String(p.id),
      name: p.name,
      category: (catName as Product["category"]) || "Furniture",
      monthlyPrice: baseMonthly,
      originalPrice: p.price && p.price > baseMonthly ? Math.round(p.price) : Math.round(baseMonthly * 1.5),
      rating: 4.8,
      reviewsCount: 68,
      image: p.image || "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&w=600&q=80",
      tag: "Trending",
      deposit: Number(p.deposit12M || 0),
      availableTenures: [3, 6, 12],
      specs: p.description ? [p.description] : [],
      rent12M: p.rent12M ? Number(p.rent12M) : null,
      rent6M: p.rent6M ? Number(p.rent6M) : null,
      rent3M: p.rent3M ? Number(p.rent3M) : null,
      deposit12M: p.deposit12M ? Number(p.deposit12M) : null,
    } as Product & Record<string, unknown>;
  });

  return (
    <section
      aria-labelledby="trending-rentals-heading"
      className="border-t border-gray-100 bg-[#f8f7fc] py-10 sm:py-14"
    >
      <div className="ref-container">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-6 sm:mb-8">
          <div>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-[#f0eaff] px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-[#4a36b3]">
              <Sparkles size={13} className="text-[#4a36b3]" />
              Curated Picks
            </span>

            <h2
              id="trending-rentals-heading"
              className="mt-2 text-2xl sm:text-3xl font-extrabold text-gray-900 leading-tight"
            >
              {data.heading || "Trending Rentals in Your City"}
            </h2>

            <p className="mt-1 text-xs sm:text-sm text-gray-500 max-w-xl">
              {data.subtitle ||
                "Handpicked furniture and appliances rented across your city."}
            </p>
          </div>

          <a
            href="#trending"
            className="flex items-center gap-1.5 text-xs sm:text-sm font-bold text-[#4a36b3] hover:underline shrink-0"
          >
            <span>View all products</span>
            <ArrowRight size={16} />
          </a>
        </div>

        {/* Products Grid */}
        <div className="grid grid-cols-2 gap-3 sm:gap-5 md:grid-cols-3 lg:grid-cols-4">
          {mappedProducts.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              onQuickView={onQuickView}
              onAddToCart={onAddToCart}
            />
          ))}
        </div>
      </div>
    </section>
  );
};

export default TrendingRentals;
