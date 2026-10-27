
import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";

import Navbar from "../components/Navbar";
import PopularRentals from "../components/PopularRentals";
import Footer from "../components/Footer";

import type { Product } from "../types/rental";
import { fetchCategoriesDeduplicated } from "../utils/api";

const API_URL = import.meta.env.VITE_API_URL;

interface Category {
  id: string;
  name: string;
  description?: string | null;
  image?: string | null;
  isActive: boolean;
}

export default function CategoryProducts() {
  const { id } = useParams<{ id: string }>();

  const [category, setCategory] = useState<Category | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [wishlistIds, setWishlistIds] = useState<Set<string>>(
    new Set(["p-sofa-01", "p-bed-01"])
  );

  useEffect(() => {
    let cancelled = false;

    const fetchCategory = async () => {
      if (!id) {
        setError("Category not found.");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError("");

        const result: unknown = await fetchCategoriesDeduplicated(API_URL);
        const data: Category[] = Array.isArray(result)
          ? (result as Category[])
          : result && typeof result === "object" && "data" in result && Array.isArray((result as { data: unknown }).data)
            ? ((result as { data: Category[] }).data)
            : [];

        const foundCategory = data.find(
          (item) => item.id === id && item.isActive
        );

        if (!foundCategory) {
          throw new Error("This category is unavailable.");
        }

        if (!cancelled) {
          setCategory(foundCategory);
        }
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof Error
              ? err.message
              : "Something went wrong while loading this category."
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    void fetchCategory();

    return () => {
      cancelled = true;
    };
  }, [id]);

  const handleToggleWishlist = (product: Product) => {
    setWishlistIds((previous) => {
      const updated = new Set(previous);

      if (updated.has(product.id)) {
        updated.delete(product.id);
      } else {
        updated.add(product.id);
      }

      return updated;
    });
  };

  const handleRentNow = (product: Product) => {
    window.alert(
      `Booking initiated for ${product.name}. Please continue through the product's WhatsApp rental option.`
    );
  };

  return (
    <div className="min-h-screen bg-[#faf9f7] font-sans text-gray-900">
      <Navbar onSearchSubmit={(query) => {
        window.location.href = `/?search=${encodeURIComponent(query)}#products`;
      }} />

      <main className="min-h-[60vh]">
        <div className="mx-auto max-w-[1440px] px-5 pt-6 sm:px-8 lg:px-12">
          <Link
            to="/#categories"
            className="inline-flex items-center gap-2 text-sm font-semibold text-[#008A90] hover:underline"
          >
            ← Back to categories
          </Link>
        </div>

        {loading && (
          <div className="mx-auto max-w-[1440px] px-5 py-16 sm:px-8 lg:px-12">
            <div className="animate-pulse">
              <div className="h-8 w-64 rounded bg-slate-200" />
              <div className="mt-4 h-4 w-96 max-w-full rounded bg-slate-200" />
            </div>
          </div>
        )}

        {!loading && error && (
          <div className="mx-auto max-w-[1440px] px-5 py-16 sm:px-8 lg:px-12">
            <div className="rounded-2xl border border-red-100 bg-white p-8 text-center">
              <h1 className="text-xl font-bold text-[#0F2942]">
                Category unavailable
              </h1>
              <p className="mt-2 text-sm text-slate-600">{error}</p>
              <Link
                to="/#categories"
                className="mt-5 inline-flex rounded-xl bg-[#008A90] px-5 py-3 text-sm font-bold text-white hover:bg-[#006f74]"
              >
                Browse categories
              </Link>
            </div>
          </div>
        )}

        {!loading && !error && category && (
          <>
            <section className="mx-auto max-w-[1440px] px-5 pb-2 pt-8 sm:px-8 lg:px-12">
              <div className="overflow-hidden rounded-3xl bg-gradient-to-r from-[#0F2942] to-[#087E83] px-6 py-8 text-white sm:px-10 sm:py-10">
                <p className="text-xs font-bold uppercase tracking-[0.16em] text-teal-100">
                  Explore our collection
                </p>

                <h1 className="mt-3 text-3xl font-extrabold sm:text-4xl">
                  {category.name}
                </h1>

                <p className="mt-3 max-w-2xl text-sm leading-6 text-white/80 sm:text-base">
                  {category.description?.trim() ||
                    `Explore available ${category.name.toLowerCase()} products with flexible rental plans.`}
                </p>
              </div>
            </section>

            <PopularRentals
              products={[]}
              selectedCategory={category.name}
              onSelectCategory={() => {}}
              searchFilter=""
              onClearSearch={() => {}}
              wishlistIds={wishlistIds}
              onToggleWishlist={handleToggleWishlist}
              onRentNow={handleRentNow}
            />
          </>
        )}
      </main>

      <Footer />
    </div>
  );
}
