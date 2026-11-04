import { useEffect, useState, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Heart, Trash2, ArrowLeft, Sparkles } from "lucide-react";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { ProductCard } from "../components/ProductCard";
import QuickViewModal from "../components/QuickViewModal";
import CartDrawer from "../components/CartDrawer";
import type { CartItem, Product } from "../types/rental";
import { getApiBaseUrl, fetchJsonDeduplicated } from "../utils/api";
import {
  getWishlist,
  subscribeWishlist,
  clearWishlist,
} from "../utils/wishlist";

export default function WishlistPage() {
  const navigate = useNavigate();

  const [wishlistIds, setWishlistIds] = useState<string[]>(() => getWishlist());
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  // Cart and modal state
  const [cartOpen, setCartOpen] = useState(false);
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [quickViewProduct, setQuickViewProduct] = useState<Product | null>(null);
  const [quickViewOpen, setQuickViewOpen] = useState(false);

  // Subscribe to live wishlist changes (e.g., toggled on card)
  useEffect(() => {
    const unsubscribe = subscribeWishlist((ids) => {
      setWishlistIds(ids);
    });
    return unsubscribe;
  }, []);

  // Fetch products from backend API
  useEffect(() => {
    let cancelled = false;
    const apiBase = getApiBaseUrl();

    async function loadProducts() {
      try {
        setLoading(true);
        const res = await fetchJsonDeduplicated<unknown>(`${apiBase}/products`);
        const rawList = Array.isArray(res)
          ? res
          : res && typeof res === "object" && "data" in res && Array.isArray((res as { data: unknown }).data)
          ? (res as { data: unknown[] }).data
          : [];

        const mapped: Product[] = (rawList as Record<string, unknown>[]).map((p) => {
          const catName =
            typeof p.category === "object" && p.category && "name" in (p.category as object)
              ? String((p.category as { name: string }).name)
              : typeof p.category === "string"
              ? p.category
              : "Furniture";

          const baseMonthly = Number(p.rent12M || p.price || 499);
          const originalPrice =
            Number(p.price) && Number(p.price) > baseMonthly
              ? Math.round(Number(p.price))
              : Math.round(baseMonthly * 1.5);

          return {
            id: String(p.id ?? "").trim(),
            name: String(p.name ?? ""),
            category: (catName as Product["category"]) || "Furniture",
            monthlyPrice: baseMonthly,
            originalPrice,
            rating: 4.8,
            reviewsCount: 45,
            image: String(
              p.image ||
                "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&w=600&q=80"
            ),
            images: Array.isArray(p.images) ? (p.images as Product["images"]) : undefined,
            tag: p.rent12M && p.price && Number(p.price) > Number(p.rent12M) ? "Trending" : undefined,
            deposit: Number(p.deposit12M || 0),
            availableTenures: [3, 6, 12],
            specs: p.description ? [String(p.description)] : [],
            rent12M: p.rent12M as number | undefined,
            rent6M: p.rent6M as number | undefined,
            rent3M: p.rent3M as number | undefined,
            deposit12M: p.deposit12M as number | undefined,
            deposit6M: p.deposit6M as number | undefined,
            deposit3M: p.deposit3M as number | undefined,
            categoryId: p.categoryId as string | undefined,
          } as Product;
        });

        if (!cancelled) {
          setAllProducts(mapped);
        }
      } catch (err) {
        console.error("Could not fetch products for Wishlist:", err);
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void loadProducts();
    return () => {
      cancelled = true;
    };
  }, []);

  // Filter products matching current wishlist IDs
  const wishlistedProducts = useMemo(() => {
    const idSet = new Set(wishlistIds.map((id) => String(id).trim()));
    return allProducts.filter((p) => idSet.has(String(p.id).trim()));
  }, [allProducts, wishlistIds]);

  const handleAddToCart = (product: Product, tenure: number, quantity = 1) => {
    setCartItems((prev) => {
      const existing = prev.find((item) => item.product.id === product.id);
      if (existing) {
        return prev.map((item) =>
          item.product.id === product.id
            ? { ...item, quantity: item.quantity + quantity, selectedTenure: tenure }
            : item
        );
      }
      return [...prev, { product, selectedTenure: tenure, quantity }];
    });
    setCartOpen(true);
  };

  const handleRemoveCartItem = (productId: string) => {
    setCartItems((prev) => prev.filter((item) => item.product.id !== productId));
  };

  const handleUpdateCartTenure = (productId: string, tenure: number) => {
    setCartItems((prev) =>
      prev.map((item) =>
        item.product.id === productId ? { ...item, selectedTenure: tenure } : item
      )
    );
  };

  const handleCartProceedCheckout = () => {
    const lines = cartItems.map(
      (item) => `• ${item.product.name} (${item.selectedTenure}M tenure) x ${item.quantity}`
    );
    const message = `Hello LIVEAZY! I would like to book rental for:\n${lines.join(
      "\n"
    )}\nPlease share rental booking confirmation!`;
    const waUrl = `https://wa.me/917061460429?text=${encodeURIComponent(message)}`;
    window.open(waUrl, "_blank", "noopener,noreferrer");
  };

  const handleRentNow = (product: Product, tenure = 12) => {
    const message = `Hello LIVEAZY! I am interested in renting: *${product.name}* (${tenure} Months plan). Please share rental details & delivery schedule!`;
    const waUrl = `https://wa.me/917061460429?text=${encodeURIComponent(message)}`;
    window.open(waUrl, "_blank", "noopener,noreferrer");
  };

  const handleClearAll = () => {
    if (window.confirm("Are you sure you want to remove all items from your wishlist?")) {
      clearWishlist();
    }
  };

  return (
    <div className="min-h-screen bg-[#fafbfc] font-['Poppins',sans-serif] text-[#27272a] antialiased flex flex-col justify-between">
      <div>
        <Navbar
          cartCount={cartItems.reduce((acc, item) => acc + item.quantity, 0)}
          onOpenCart={() => setCartOpen(true)}
        />

        <main className="ref-container py-6 sm:py-10">
          {/* Breadcrumb */}
          <nav aria-label="Breadcrumb" className="mb-6 flex items-center gap-2 text-xs text-gray-500">
            <Link to="/" className="hover:text-[#0F2942] transition">
              Home
            </Link>
            <span>/</span>
            <span className="font-medium text-[#0F2942]">Wishlist</span>
          </nav>

          {/* Header Row */}
          <div className="mb-8 flex flex-wrap items-center justify-between gap-4 border-b border-gray-200 pb-5">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-rose-50 text-rose-500 shadow-xs">
                <Heart size={22} className="fill-rose-500 stroke-rose-500" />
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[#0F2942]">
                  My Saved Wishlist
                </h1>
                <p className="text-xs sm:text-sm text-gray-500">
                  {wishlistIds.length === 1
                    ? "1 item saved for later"
                    : `${wishlistIds.length} items saved for later`}
                </p>
              </div>
            </div>

            {wishlistIds.length > 0 && (
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={handleClearAll}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-gray-200 bg-white px-3.5 py-2 text-xs font-semibold text-rose-600 shadow-2xs transition hover:bg-rose-50 hover:border-rose-200"
                >
                  <Trash2 size={14} />
                  <span>Clear All</span>
                </button>
                <Link
                  to="/"
                  className="hidden sm:inline-flex items-center gap-1.5 rounded-xl bg-[#0F2942] px-4 py-2 text-xs font-semibold text-white shadow-xs transition hover:bg-[#163857]"
                >
                  <Sparkles size={14} />
                  <span>Explore More</span>
                </Link>
              </div>
            )}
          </div>

          {/* Content Area */}
          {loading ? (
            <div className="flex min-h-[360px] flex-col items-center justify-center gap-3">
              <div className="h-8 w-8 animate-spin rounded-full border-3 border-[#0F2942] border-t-transparent" />
              <p className="text-xs font-medium text-gray-500">Loading your saved items...</p>
            </div>
          ) : wishlistIds.length === 0 ? (
            /* Empty State */
            <div className="mx-auto my-12 max-w-md rounded-3xl border border-gray-100 bg-white p-8 sm:p-12 text-center shadow-xs">
              <div className="mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-full bg-rose-50 text-rose-400">
                <Heart size={36} className="stroke-[1.7]" />
              </div>
              <h2 className="text-lg sm:text-xl font-bold text-[#0F2942] mb-2">
                Your wishlist is empty
              </h2>
              <p className="text-xs sm:text-sm text-gray-500 leading-relaxed mb-6">
                Explore our catalog of premium furniture and home appliances. Click the heart icon on any product to save your favorites here.
              </p>
              <button
                type="button"
                onClick={() => navigate("/")}
                className="inline-flex items-center gap-2 rounded-xl bg-[#0F2942] px-6 py-3 text-xs sm:text-sm font-semibold text-white shadow-md shadow-[#0F2942]/15 transition hover:bg-[#163857] hover:scale-[1.02]"
              >
                <ArrowLeft size={16} />
                <span>Explore Furniture &amp; Appliances</span>
              </button>
            </div>
          ) : (
            /* Wishlist Products Grid */
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
              {wishlistedProducts.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  isWishlisted={true}
                  onQuickView={(p) => {
                    setQuickViewProduct(p);
                    setQuickViewOpen(true);
                  }}
                  onAddToCart={handleAddToCart}
                  onRentNow={handleRentNow}
                />
              ))}
            </div>
          )}
        </main>
      </div>

      <Footer />

      {/* Quick View Modal */}
      <QuickViewModal
        product={quickViewProduct}
        isOpen={quickViewOpen}
        onClose={() => setQuickViewOpen(false)}
        onAddToCart={handleAddToCart}
      />

      {/* Cart Drawer */}
      <CartDrawer
        isOpen={cartOpen}
        onClose={() => setCartOpen(false)}
        cartItems={cartItems}
        onRemoveItem={handleRemoveCartItem}
        onUpdateTenure={handleUpdateCartTenure}
        onProceedToCheckout={handleCartProceedCheckout}
      />
    </div>
  );
}
