import React, { useEffect, useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, MessageCircle } from "lucide-react";
import type { Product } from "../types/rental";

const API_URL = import.meta.env.VITE_API_URL;

interface BackendProduct {
  id: string;
  name: string;
  description?: string;
  price: number;
  image?: string;
  categoryId: string;
  isActive: boolean;
  category?: {
    id: string;
    name: string;
  };
}

interface PopularRentalsProps {
  products: Product[];
  selectedCategory: string;
  onSelectCategory: (category: string) => void;
  searchFilter?: string;
  onClearSearch?: () => void;
  wishlistIds: Set<string>;
  onToggleWishlist: (product: Product) => void;
  onRentNow: (product: Product) => void;
}

const PopularRentals: React.FC<PopularRentalsProps> = ({
  selectedCategory,
  searchFilter = "",
}) => {
  const [backendProducts, setBackendProducts] = useState<BackendProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [whatsappNumber, setWhatsappNumber] = useState("");

  // Fetch products from the backend.
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true);

        const response = await fetch(`${API_URL}/products`);

        if (!response.ok) {
          throw new Error("Failed to fetch products");
        }

        const data: BackendProduct[] = await response.json();
        const activeProducts = data.filter((product) => product.isActive);

        setBackendProducts(activeProducts);
      } catch (error) {
        console.error("Error fetching products:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

  // Fetch the WhatsApp number saved by the admin.
  // The message is fixed to "Hi LIVEAZY!".
  useEffect(() => {
    const fetchWhatsAppSettings = async () => {
      try {
        const response = await fetch(`${API_URL}/settings/whatsapp`);

        if (!response.ok) {
          throw new Error("Failed to fetch WhatsApp settings");
        }

        const data: { whatsappNumber?: string } = await response.json();

        if (data.whatsappNumber) {
          const digits = String(data.whatsappNumber).replace(/\D/g, "");
          setWhatsappNumber(digits);
        }
      } catch (error) {
        console.error("Error fetching WhatsApp settings:", error);
      }
    };

    fetchWhatsAppSettings();
  }, []);

  // Filter products by category and search text.
  const filteredProducts = useMemo(() => {
    return backendProducts.filter((product) => {
      const categoryMatch =
        selectedCategory === "All" ||
        product.category?.name === selectedCategory;

      const searchText = searchFilter.toLowerCase().trim();

      const searchMatch =
        !searchText ||
        product.name.toLowerCase().includes(searchText) ||
        product.description?.toLowerCase().includes(searchText) ||
        product.category?.name.toLowerCase().includes(searchText);

      return categoryMatch && searchMatch;
    });
  }, [backendProducts, selectedCategory, searchFilter]);

  // Open WhatsApp with only the fixed default greeting.
  const handleWhatsApp = () => {
    if (!whatsappNumber) {
      alert("WhatsApp number is not available. Please try again.");
      return;
    }

    const digits = whatsappNumber.replace(/\D/g, "");

    // Add India's country code only when the number has 10 digits.
    const finalNumber = digits.length === 10 ? `91${digits}` : digits;

    const message = "Hi LIVEAZY!";

    const whatsappUrl = `https://wa.me/${finalNumber}?text=${encodeURIComponent(
      message
    )}`;

    window.open(whatsappUrl, "_blank", "noopener,noreferrer");
  };

  // Loading state.
  if (loading) {
    return (
      <section id="products" className="bg-white py-12">
        <div className="mx-auto max-w-7xl px-4">
          <div className="flex min-h-[250px] items-center justify-center">
            <div className="text-center">
              <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-4 border-gray-200 border-t-[#0795A3]" />
              <p className="text-sm text-gray-500">
                Loading products...
              </p>
            </div>
          </div>
        </div>
      </section>
    );
  }

  // Main UI.
  return (
    <section id="products" className="space-y-10 bg-white py-10">
      <div className="mx-auto max-w-7xl px-4">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between border-b border-gray-200 pb-4">
          <div>
            <p className="mb-1 text-xs font-semibold uppercase tracking-[0.15em] text-[#0795A3]">
              LIVEAZY Furniture Rental
            </p>

            <h2 className="text-2xl font-bold tracking-tight text-gray-900">
              Popular Rentals
            </h2>

            {selectedCategory !== "All" && (
              <p className="mt-1 text-sm text-gray-500">
                Showing products from{" "}
                <span className="font-semibold text-[#0795A3]">
                  {selectedCategory}
                </span>
              </p>
            )}
          </div>

          <div className="hidden items-center gap-2 md:flex">
            <button
              type="button"
              className="rounded-full border border-gray-200 p-2 text-gray-500 transition hover:border-[#0795A3] hover:text-[#0795A3]"
              aria-label="Previous products"
            >
              <ChevronLeft size={18} />
            </button>

            <button
              type="button"
              className="rounded-full border border-gray-200 p-2 text-gray-500 transition hover:border-[#0795A3] hover:text-[#0795A3]"
              aria-label="Next products"
            >
              <ChevronRight size={18} />
            </button>
          </div>
        </div>

        {/* Search results */}
        {searchFilter && (
          <div className="mb-6 flex items-center justify-between rounded-lg bg-[#F5FAFA] px-4 py-3">
            <p className="text-sm text-gray-600">
              Search results for{" "}
              <span className="font-semibold text-gray-900">
                "{searchFilter}"
              </span>
            </p>

            <span className="text-sm font-semibold text-[#0795A3]">
              {filteredProducts.length} product
              {filteredProducts.length !== 1 ? "s" : ""}
            </span>
          </div>
        )}

        {/* No products or products grid */}
        {filteredProducts.length === 0 ? (
          <div className="flex min-h-[300px] items-center justify-center rounded-xl border border-dashed border-gray-300 bg-gray-50">
            <div className="text-center">
              <div className="mb-3 text-4xl">🛋️</div>

              <h3 className="text-lg font-semibold text-gray-800">
                No products found
              </h3>

              <p className="mt-1 text-sm text-gray-500">
                Try another category or search for something else.
              </p>
            </div>
          </div>
        ) : (
          <>
            {/* Products grid */}
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
              {filteredProducts.map((product) => (
                <div
                  key={product.id}
                  className="group flex flex-col overflow-hidden rounded-xl border border-gray-200 bg-white transition duration-300 hover:-translate-y-1 hover:border-[#35C6CF] hover:shadow-lg"
                >
                  {/* Product image */}
                  <div className="relative flex h-48 items-center justify-center overflow-hidden bg-[#F5FAFA]">
                    {product.image ? (
                      <img
                        src={product.image}
                        alt={product.name}
                        className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                        onError={(event) => {
                          event.currentTarget.style.display = "none";
                        }}
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-4xl">
                        🛋️
                      </div>
                    )}

                    {/* Availability badge */}
                    <span className="absolute left-3 top-3 rounded-full bg-[#0795A3] px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-white">
                      Available
                    </span>
                  </div>

                  {/* Product information */}
                  <div className="flex flex-1 flex-col p-4">
                    {/* Category */}
                    <p className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-gray-400">
                      {product.category?.name || "Furniture"}
                    </p>

                    {/* Name */}
                    <h3 className="line-clamp-2 min-h-[40px] text-sm font-bold text-gray-900 transition group-hover:text-[#0795A3]">
                      {product.name}
                    </h3>

                    {/* Description */}
                    {product.description && (
                      <p className="mt-2 line-clamp-2 text-xs leading-5 text-gray-500">
                        {product.description}
                      </p>
                    )}

                    {/* Price */}
                    <div className="mt-3">
                      <span className="text-lg font-extrabold text-[#0795A3]">
                        ₹{Number(product.price).toLocaleString("en-IN")}
                      </span>

                      <span className="ml-1 text-xs text-gray-500">
                        /month
                      </span>
                    </div>

                    {/* WhatsApp button */}
                    <button
                      type="button"
                      onClick={handleWhatsApp}
                      disabled={!whatsappNumber}
                      className="mt-4 flex w-full items-center justify-center gap-2 rounded-lg bg-[#123B63] px-3 py-2.5 text-xs font-bold text-white transition hover:bg-[#0795A3] disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <MessageCircle size={15} />
                      Rent via WhatsApp
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Product count */}
            <div className="mt-6 text-center">
              <p className="text-xs text-gray-400">
                Showing {filteredProducts.length} active product
                {filteredProducts.length !== 1 ? "s" : ""}
              </p>
            </div>
          </>
        )}
      </div>
    </section>
  );
};

export default PopularRentals;