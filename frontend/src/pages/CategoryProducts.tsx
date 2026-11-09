import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

import Navbar from "../components/Navbar";
import PopularRentals from "../components/PopularRentals";
import Footer from "../components/Footer";

import type { Product } from "../types/rental";
import { getApiBaseUrl, fetchCategoriesDeduplicated } from "../utils/api";
import { getWishlist, subscribeWishlist, toggleWishlist } from "../utils/wishlist";
import { fetchConfiguredWhatsAppNumber } from "../utils/whatsappCheckout";

interface Category {
  id: string;
  name: string;
  description?: string | null;
  image?: string | null;
  isActive: boolean;
  _count?: {
    products?: number;
  };
}

const slugify = (value: string) =>
  value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

export default function CategoryProducts() {
  const { id } = useParams<{ id: string }>();

  const [category, setCategory] = useState<Category | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [selectedProductCategory, setSelectedProductCategory] = useState("All");
  const [wishlistIds, setWishlistIds] = useState<Set<string>>(() => new Set(getWishlist()));

  useEffect(() => {
    return subscribeWishlist((ids) => {
      setWishlistIds(new Set(ids));
    });
  }, []);

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

        const apiBase = getApiBaseUrl();
        const result: unknown = await fetchCategoriesDeduplicated(apiBase);

        const data: Category[] = Array.isArray(result)
          ? (result as Category[])
          : result &&
              typeof result === "object" &&
              "data" in result &&
              Array.isArray((result as { data: unknown }).data)
            ? (result as { data: Category[] }).data
            : [];

        const target = id.toLowerCase().trim();
        const foundCategory = data.find(
          (item) =>
            (item.id === id ||
              item.name.toLowerCase().trim() === target ||
              slugify(item.name) === target) &&
            item.isActive
        );

        if (!foundCategory) {
          throw new Error("This category is unavailable or currently inactive.");
        }

        if (!cancelled) {
          setCategory(foundCategory);
          setSelectedProductCategory(foundCategory.name);
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
    toggleWishlist(product.id);
  };

  const handleRentNow = async (product: Product) => {
    try {
      const num = await fetchConfiguredWhatsAppNumber({ forceFresh: true });
      const waUrl = `https://wa.me/${num}?text=${encodeURIComponent(
        `Hello LIVEAZY! I would like to rent "${product.name}". Please share booking details.`
      )}`;
      window.open(waUrl, "_blank", "noopener,noreferrer");
    } catch (err) {
      alert(
        err instanceof Error
          ? err.message
          : "WhatsApp checkout is currently unavailable. Please try again."
      );
    }
  };

  return (
    <div className="min-h-screen bg-[#fafbfc] font-['Poppins',sans-serif] text-gray-900">
      <Navbar />

      <main className="min-h-[60vh]">
        <div className="ref-container pt-6">
          <nav aria-label="Breadcrumb" className="mb-3 flex items-center gap-2 text-xs text-gray-500">
            <Link to="/" className="hover:text-[#002B62] transition">
              Home
            </Link>
            <span>/</span>
            <Link to="/categories" className="hover:text-[#002B62] transition">
              Categories
            </Link>
            {category && (
              <>
                <span>/</span>
                <span className="font-semibold text-[#002B62]">{category.name}</span>
              </>
            )}
          </nav>

          <Link
            to="/categories"
            className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-[#007C8A] hover:underline"
          >
            <ArrowLeft size={16} /> Back to all categories
          </Link>
        </div>

        {loading && (
          <div className="ref-container py-16">
            <div className="animate-pulse">
              <div className="h-8 w-64 rounded bg-slate-200" />
              <div className="mt-4 h-4 w-96 max-w-full rounded bg-slate-200" />
            </div>
          </div>
        )}

        {!loading && error && (
          <div className="ref-container py-16">
            <div className="rounded-2xl border border-red-100 bg-white p-8 text-center max-w-lg mx-auto shadow-sm">
              <h1 className="text-xl font-bold text-gray-900">
                Category unavailable
              </h1>
              <p className="mt-2 text-sm text-gray-500">{error}</p>
              <Link
                to="/categories"
                className="mt-5 inline-flex rounded-xl bg-[#002B62] px-5 py-2.5 text-xs sm:text-sm font-bold text-white hover:bg-[#001F47]"
              >
                Browse all categories
              </Link>
            </div>
          </div>
        )}

        {!loading && !error && category && (
          <>
            <section className="ref-container pb-2 pt-6">
              <div className="overflow-hidden rounded-2xl bg-gradient-to-r from-[#001F47] via-[#002B62] to-[#007C8A] px-6 py-8 text-white sm:px-10 sm:py-10 shadow-md flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                  <span className="rounded-full bg-white/15 px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-[#E6F5F7]">
                    Category Collection
                  </span>

                  <h1 className="mt-3 text-2xl sm:text-4xl font-extrabold text-white">
                    {category.name}
                  </h1>

                  <p className="mt-2.5 max-w-2xl text-xs sm:text-sm leading-relaxed text-[#E6F5F7]/90">
                    {category.description?.trim() ||
                      `Explore available ${category.name.toLowerCase()} products with flexible rental plans, zero deposit, and free delivery.`}
                  </p>
                </div>

                {category.image && (
                  <div className="shrink-0 hidden sm:block">
                    <img
                      src={category.image}
                      alt={category.name}
                      className="h-24 w-24 sm:h-28 sm:w-28 rounded-2xl object-cover border-2 border-white/20 shadow-lg"
                    />
                  </div>
                )}
              </div>
            </section>

            <PopularRentals
              products={[]}
              selectedCategory={selectedProductCategory}
              onSelectCategory={setSelectedProductCategory}
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
