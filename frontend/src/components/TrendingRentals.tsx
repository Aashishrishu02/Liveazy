
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

interface TrendingProduct {
  id: string | number;
  name: string;
  image?: string | null;
  category?: string | { name?: string } | null;
  rent3M?: number | string | null;
  rent6M?: number | string | null;
  rent12M?: number | string | null;
  [key: string]: unknown;
}

interface TrendingRentalsResponse {
  heading?: string;
  subtitle?: string;
  isActive?: boolean;
  products?: TrendingProduct[];
}

const API_URL = (
  import.meta.env.VITE_API_URL || "http://localhost:3000"
).replace(/\/$/, "");

function getMonthlyRent(product: TrendingProduct): number | null {
  const possibleRents = [
    product.rent3M,
    product.rent6M,
    product.rent12M,
  ]
    .map(Number)
    .filter((rent) => Number.isFinite(rent) && rent > 0);

  return possibleRents.length ? Math.min(...possibleRents) : null;
}

function getCategoryName(product: TrendingProduct): string {
  if (typeof product.category === "string") {
    return product.category;
  }

  return product.category?.name || "Furniture Rental";
}

export default function TrendingRentals() {
  const navigate = useNavigate();

  const [data, setData] = useState<TrendingRentalsResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const controller = new AbortController();

    async function fetchTrendingRentals() {
      try {
        const response = await fetch(`${API_URL}/trending-rentals`, {
          signal: controller.signal,
        });

        if (!response.ok) {
          throw new Error("Failed to load trending rentals");
        }

        const result: TrendingRentalsResponse = await response.json();
        setData(result);
      } catch (error) {
        if (error instanceof Error && error.name !== "AbortError") {
          console.error("Trending rentals error:", error.message);
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    }

    fetchTrendingRentals();

    return () => controller.abort();
  }, []);

  if (loading || !data?.isActive || !data.products?.length) {
    return null;
  }

  const products = data.products.slice(0, 4);

  return (
    <section
      aria-labelledby="trending-rentals-heading"
      className="border-t border-slate-200/70 bg-[#F6F7FD] px-5 py-14 sm:px-8 sm:py-16 lg:px-12 lg:py-20"
    >
      <div className="mx-auto max-w-7xl">
        {/* Section heading */}
        <div className="mb-9 flex flex-col gap-5 md:mb-10 md:flex-row md:items-end md:justify-between">
          <div className="max-w-2xl">
            <span className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-xs font-bold uppercase tracking-[0.16em] text-[#087F8C] ring-1 ring-slate-200">
              <span className="h-2 w-2 rounded-full bg-[#087F8C]" />
              Trending Collections
            </span>

            <h2
              id="trending-rentals-heading"
              className="mt-5 text-3xl font-bold tracking-tight text-[#14243B] sm:text-4xl lg:text-[42px]"
            >
              {data.heading || "Trending Rentals in Your City"}
            </h2>

            <p className="mt-3 max-w-xl text-sm leading-7 text-slate-600 sm:text-base">
              {data.subtitle ||
                "Discover furniture and appliances for comfortable living, without the heavy investment."}
            </p>
          </div>

          <button
            type="button"
            onClick={() => navigate("/#categories")}
            className="inline-flex w-fit shrink-0 items-center justify-center gap-2 rounded-xl border border-[#087F8C]/25 bg-white px-5 py-3 text-sm font-semibold text-[#087F8C] transition hover:border-[#087F8C] hover:bg-[#087F8C] hover:text-white focus:outline-none focus:ring-2 focus:ring-[#087F8C]/30"
          >
            Explore rentals
            <span aria-hidden="true">→</span>
          </button>
        </div>

        {/* Product cards */}
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4 lg:gap-6">
          {products.map((product) => {
            const monthlyRent = getMonthlyRent(product);
            const categoryName = getCategoryName(product);

            return (
              <article
                key={product.id}
                className="group flex min-w-0 flex-col overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm transition duration-300 hover:-translate-y-1 hover:border-[#087F8C]/30 hover:shadow-lg hover:shadow-slate-900/5"
              >
                {/* Product image */}
                <button
                  type="button"
                  onClick={() =>
                    navigate(
                      `/product/${encodeURIComponent(String(product.id))}`
                    )
                  }
                  aria-label={`View ${product.name}`}
                  className="relative block aspect-[4/3] w-full overflow-hidden bg-white p-4 text-left"
                >
                  {product.image ? (
                    <img
                      src={product.image}
                      alt={product.name}
                      loading="lazy"
                      className="h-full w-full rounded-xl object-contain transition duration-500 group-hover:scale-105"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center rounded-xl bg-[#F6F7FD] text-sm text-slate-400">
                      Image unavailable
                    </div>
                  )}

                  <span className="absolute left-6 top-6 rounded-full bg-[#E5F5F5] px-3 py-1 text-[11px] font-bold uppercase tracking-wide text-[#087F8C]">
                    Trending
                  </span>
                </button>

                {/* Product information */}
                <div className="flex flex-1 flex-col px-5 pb-5 pt-2">
                  <p className="text-xs font-semibold uppercase tracking-wider text-[#087F8C]">
                    {categoryName}
                  </p>

                  <h3 className="mt-2 line-clamp-2 min-h-12 text-base font-bold leading-6 text-[#14243B]">
                    {product.name}
                  </h3>

                  <div className="mt-4 flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <p className="text-xs text-slate-500">
                        Monthly rent
                      </p>
                      <p className="mt-1 text-xl font-bold text-[#14243B]">
                        {monthlyRent !== null
                          ? `₹${monthlyRent.toLocaleString("en-IN")}`
                          : "View details"}
                        {monthlyRent !== null && (
                          <span className="text-sm font-medium text-slate-500">
                            /mo
                          </span>
                        )}
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() =>
                      navigate(
                        `/product/${encodeURIComponent(String(product.id))}`
                      )
                    }
                    className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-[#087F8C] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#066873] focus:outline-none focus:ring-2 focus:ring-[#087F8C]/40 focus:ring-offset-2"
                  >
                    View details
                    <span aria-hidden="true">→</span>
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
