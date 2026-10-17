import React, { useEffect, useMemo, useState } from "react";
import {
  ArrowRight,
  Heart,
  MessageCircle,
  PackageOpen,
  Search,
  Sparkles,
  ShieldCheck,
} from "lucide-react";
import type { Product } from "../types/rental";
const API_URL = import.meta.env.VITE_API_URL;
type RentalDuration = "12M" | "6M" | "3M";
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
  rent12M?: number | null;
  deposit12M?: number | null;
  rent6M?: number | null;
  deposit6M?: number | null;
  rent3M?: number | null;
  deposit3M?: number | null;
}
interface RentalPlan {
  duration: RentalDuration;
  label: string;
  rent: number | null;
  deposit: number | null;
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
const formatPrice = (amount: number) =>
  `₹${Number(amount).toLocaleString("en-IN")}`;

/**
 * Detects the old hardcoded message that appended product details automatically.
 * It must not be sent after switching to the admin-managed message template.
 */
const isLegacyGeneratedWhatsAppMessage = (message: string): boolean => {
  const normalized = message.toLowerCase();
  return (
    normalized.includes("i want to rent this product:") &&
    normalized.includes("product name:") &&
    normalized.includes("product id:") &&
    normalized.includes("rental duration:") &&
    normalized.includes("monthly rent:") &&
    normalized.includes("refundable deposit:")
  );
};
const getRentalPlans = (product: BackendProduct): RentalPlan[] => [
  {
    duration: "12M",
    label: "12 Months",
    rent: product.rent12M ?? null,
    deposit: product.deposit12M ?? null,
  },
  {
    duration: "6M",
    label: "6 Months",
    rent: product.rent6M ?? null,
    deposit: product.deposit6M ?? null,
  },
  {
    duration: "3M",
    label: "3 Months",
    rent: product.rent3M ?? null,
    deposit: product.deposit3M ?? null,
  },
];
const getDefaultPlan = (product: BackendProduct): RentalDuration => {
  const plans = getRentalPlans(product);
  const availablePlan = plans.find(
    (plan) => plan.rent !== null && Number.isFinite(Number(plan.rent))
      && Number(plan.rent) >= 0
  );
  return availablePlan?.duration ?? "12M";
};
const PopularRentals: React.FC<PopularRentalsProps> = ({
  selectedCategory,
  searchFilter = "",
  onClearSearch,
  wishlistIds,
  onToggleWishlist,
}) => {
  const [backendProducts, setBackendProducts] = useState<BackendProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [whatsappNumber, setWhatsappNumber] = useState("");
  const [whatsappMessage, setWhatsappMessage] = useState("");
  const [selectedPlans, setSelectedPlans] = useState<
    Record<string, RentalDuration>
  >({});
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
        setSelectedPlans((previous) => {
          const updated = { ...previous };
          activeProducts.forEach((product) => {
            if (!updated[product.id]) {
              updated[product.id] = getDefaultPlan(product);
            }
          });
          return updated;
        });
      } catch (error) {
        console.error("Error fetching products:", error);
      } finally {
        setLoading(false);
      }
    };
    void fetchProducts();
  }, []);
  useEffect(() => {
    const fetchWhatsAppSettings = async () => {
      try {
        const response = await fetch(`${API_URL}/settings/whatsapp`, { cache: "no-store" });
        if (!response.ok) {
          throw new Error("Failed to fetch WhatsApp settings");
        }
        const data: {
          whatsappNumber?: string;
          whatsappMessage?: string;
        } = await response.json();
        if (data.whatsappNumber) {
          setWhatsappNumber(
            String(data.whatsappNumber).replace(/\D/g, "")
          );
        }
        // No default message: use exactly what the admin saved.
        setWhatsappMessage(
          typeof data.whatsappMessage === "string"
            ? data.whatsappMessage
            : ""
        );
      } catch (error) {
        console.error("Error fetching WhatsApp settings:", error);
      }
    };
    void fetchWhatsAppSettings();
  }, []);
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
  const updateSelectedPlan = (
    productId: string,
    duration: RentalDuration
  ) => {
    setSelectedPlans((previous) => ({
      ...previous,
      [productId]: duration,
    }));
  };
  const getSelectedPlan = (product: BackendProduct): RentalPlan => {
    const plans = getRentalPlans(product);
    const selectedDuration =
      selectedPlans[product.id] ?? getDefaultPlan(product);
    const selected = plans.find(
      (plan) => plan.duration === selectedDuration
    );
    return selected ?? plans[0];
  };
  const isPlanAvailable = (plan: RentalPlan) =>
    plan.rent !== null &&
    Number.isFinite(Number(plan.rent)) &&
    Number(plan.rent) >= 0;
  const handleWhatsApp = (
    product: BackendProduct,
    plan: RentalPlan
  ) => {
    if (!whatsappNumber) {
      alert("WhatsApp number is not available. Please try again.");
      return;
    }
    if (!whatsappMessage.trim()) {
      alert("Please add and save a WhatsApp message template in Admin Settings first.");
      return;
    }
    if (isLegacyGeneratedWhatsAppMessage(whatsappMessage)) {
      alert(
        "The saved WhatsApp message is the old fixed format. Open Admin Settings > WhatsApp Settings, write your new template using {productName}, and save it before trying again."
      );
      return;
    }
    if (!isPlanAvailable(plan)) {
      alert("This rental plan is not available. Please select another plan.");
      return;
    }
    const finalNumber =
      whatsappNumber.length === 10
        ? `91${whatsappNumber}`
        : whatsappNumber;
    // The admin's template is the whole message. Replace only placeholders
    // that the admin includes; do not append a second fixed product-details block.
    const amount = (value: number | null | undefined) =>
      value !== null && value !== undefined && Number.isFinite(Number(value))
        ? formatPrice(Number(value))
        : "Not specified";

    // Some product records may have the product ID accidentally appended to
    // the name (for example, "FRIDGEcmv9eura00004o3ujhkfqyaon"). Remove that
    // trailing ID from the customer-facing product name, but keep the ID in
    // the separate Product ID line below.
    const originalProductName = String(product.name ?? "").trim();
    const productIdToRemove = String(product.id ?? "").trim();

    // Use a direct suffix check instead of a regular expression. If the exact
    // database ID is at the end of the name, strip it from the display name.
    const cleanProductName =
      productIdToRemove &&
      originalProductName
        .toLowerCase()
        .endsWith(productIdToRemove.toLowerCase())
        ? originalProductName.slice(
            0,
            originalProductName.length - productIdToRemove.length
          ).trim()
        : originalProductName;

    const replacements: Record<string, string> = {
      productname: cleanProductName,
      productid: product.id,
      categoryname: product.category?.name ?? "Not specified",
      rentalduration: plan.label,
      monthlyrent: amount(plan.rent),
      refundabledeposit: amount(plan.deposit),
    };
    const template = whatsappMessage.trim();

    // Render only placeholders that the admin added to the template.
    const renderedTemplate = template.replace(
      /\{(productName|productId|categoryName|rentalDuration|monthlyRent|refundableDeposit)\}/gi,
      (placeholder, key: string) =>
        replacements[key.toLowerCase()] ?? placeholder,
    );

    // Always include the product ID so the LIVEAZY owner can identify the exact
    // product. If the admin already included a Product ID line/placeholder,
    // don't append a duplicate.
    const message = /product\s*id\s*:/i.test(renderedTemplate)
      ? renderedTemplate
      : `${renderedTemplate}\n\nProduct ID: ${product.id}`;

    const whatsappUrl = `https://wa.me/${finalNumber}?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, "_blank", "noopener,noreferrer");
  };
  const getWishlistProduct = (product: BackendProduct): Product =>
    ({
      ...product,
      category: product.category,
    }) as unknown as Product;
  return (
    <section
      id="products"
      className="scroll-mt-24 bg-[#F7F9FC] py-16 sm:py-20"
    >
      <div className="mx-auto max-w-[1440px] px-5 sm:px-8 lg:px-12">
        <div className="mb-9 flex flex-col gap-5 sm:mb-12 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="mb-3 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.16em] text-[#008A90] sm:text-sm">
              <Sparkles size={16} />
              Your next favourite
            </p>
            <h2 className="text-3xl font-extrabold tracking-tight text-[#0F2942] sm:text-4xl">
              {selectedCategory === "All"
                ? "Popular Rentals"
                : selectedCategory}
            </h2>
            <p className="mt-3 max-w-xl text-sm leading-6 text-slate-500 sm:text-base">
              Quality furniture, flexible rental plans, and a home that feels
              like yours.
            </p>
          </div>
          <div className="flex w-fit items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-[#0F2942]">
            <PackageOpen size={17} className="text-[#008A90]" />
            {loading ? "Loading..." : `${filteredProducts.length} products`}
          </div>
        </div>
        {searchFilter && (
          <div className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-[#008A90]/15 bg-white px-4 py-4 sm:px-5">
            <div className="flex items-center gap-3">
              <Search size={18} className="text-[#008A90]" />
              <p className="text-sm text-slate-600">
                Results for{" "}
                <span className="font-bold text-[#0F2942]">
                  "{searchFilter}"
                </span>
              </p>
            </div>
            {onClearSearch && (
              <button
                type="button"
                onClick={onClearSearch}
                className="text-sm font-bold text-[#008A90] hover:underline"
              >
                Clear search
              </button>
            )}
          </div>
        )}
        {loading && (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
            {Array.from({ length: 5 }).map((_, index) => (
              <div
                key={index}
                className="animate-pulse overflow-hidden rounded-2xl border border-slate-100 bg-white p-3"
              >
                <div className="h-40 rounded-xl bg-slate-100 sm:h-52" />
                <div className="mt-4 h-4 w-3/4 rounded bg-slate-100" />
                <div className="mt-3 h-4 w-1/2 rounded bg-slate-100" />
                <div className="mt-5 h-10 rounded-xl bg-slate-100" />
              </div>
            ))}
          </div>
        )}
        {!loading && filteredProducts.length > 0 && (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 sm:gap-5 lg:grid-cols-4 xl:grid-cols-5">
            {filteredProducts.map((product) => {
              const wishlistProduct = getWishlistProduct(product);
              const isWishlisted = wishlistIds.has(product.id);
              const plans = getRentalPlans(product);
              const selectedPlan = getSelectedPlan(product);
              const selectedPlanAvailable = isPlanAvailable(selectedPlan);
              return (
                <article
                  key={product.id}
                  className="group flex min-w-0 flex-col overflow-hidden rounded-2xl border border-slate-200/80 bg-white transition-all duration-300 hover:-translate-y-1 hover:border-[#008A90]/35 hover:shadow-xl hover:shadow-[#0F2942]/[0.07]"
                >
                  <div className="relative flex h-36 items-center justify-center overflow-hidden bg-[#F2F5F8] sm:h-48 lg:h-52">
                    {product.image ? (
                      <img
                        src={product.image}
                        alt={product.name}
                        loading="lazy"
                        className="h-full w-full object-contain p-3 transition-transform duration-500 group-hover:scale-105 sm:p-4"
                        onError={(event) => {
                          event.currentTarget.style.visibility = "hidden";
                        }}
                      />
                    ) : (
                      <PackageOpen size={40} className="text-slate-300" />
                    )}
                    <span className="absolute left-2 top-2 rounded-full bg-white/95 px-2.5 py-1 text-[9px] font-bold uppercase tracking-wide text-[#008A90] shadow-sm sm:left-3 sm:top-3 sm:text-[10px]">
                      Available
                    </span>
                    <button
                      type="button"
                      onClick={() => onToggleWishlist(wishlistProduct)}
                      aria-label={
                        isWishlisted
                          ? `Remove ${product.name} from wishlist`
                          : `Add ${product.name} to wishlist`
                      }
                      aria-pressed={isWishlisted}
                      className={`absolute right-2 top-2 flex h-9 w-9 items-center justify-center rounded-full shadow-sm transition sm:right-3 sm:top-3 ${
                        isWishlisted
                          ? "bg-[#FF6A3D] text-white"
                          : "bg-white/95 text-[#0F2942] hover:bg-[#FF6A3D] hover:text-white"
                      }`}
                    >
                      <Heart
                        size={17}
                        fill={isWishlisted ? "currentColor" : "none"}
                      />
                    </button>
                  </div>
                  <div className="flex flex-1 flex-col p-3 sm:p-4">
                    <p className="mb-1.5 truncate text-[10px] font-bold uppercase tracking-wider text-[#008A90] sm:text-xs">
                      {product.category?.name || "Furniture"}
                    </p>
                    <h3 className="line-clamp-2 min-h-10 text-sm font-bold leading-5 text-[#0F2942] transition-colors group-hover:text-[#008A90] sm:text-base">
                      {product.name}
                    </h3>
                    {product.description && (
                      <p className="mt-2 line-clamp-2 text-xs leading-5 text-slate-500">
                        {product.description}
                      </p>
                    )}
                    <div className="mt-4 border-t border-slate-100 pt-3">
                      <p className="text-[10px] font-semibold text-slate-500 sm:text-xs">
                        Choose rental duration
                      </p>
                      <div className="mt-2 grid grid-cols-3 gap-1.5">
                        {plans.map((plan) => {
                          const available = isPlanAvailable(plan);
                          const selected =
                            selectedPlan.duration === plan.duration;
                          return (
                            <button
                              key={plan.duration}
                              type="button"
                              disabled={!available}
                              onClick={() =>
                                updateSelectedPlan(
                                  product.id,
                                  plan.duration
                                )
                              }
                              title={
                                available
                                  ? plan.label
                                  : `${plan.label} pricing not added`
                              }
                              className={`rounded-lg border px-1 py-2 text-[10px] font-bold transition sm:text-xs ${
                                selected
                                  ? "border-[#008A90] bg-[#008A90] text-white"
                                  : available
                                  ? "border-slate-200 bg-white text-[#0F2942] hover:border-[#008A90] hover:text-[#008A90]"
                                  : "cursor-not-allowed border-slate-100 bg-slate-50 text-slate-300"
                              }`}
                            >
                              {plan.duration}
                            </button>
                          );
                        })}
                      </div>
                      {selectedPlanAvailable ? (
                        <>
                          <div className="mt-3">
                            <p className="text-[10px] font-medium text-slate-500 sm:text-xs">
                              Monthly rent · {selectedPlan.label}
                            </p>
                            <div className="mt-1 flex flex-wrap items-baseline gap-x-1">
                              <span className="text-lg font-extrabold text-[#0F2942] sm:text-xl">
                                {formatPrice(Number(selectedPlan.rent))}
                              </span>
                              <span className="text-[10px] text-slate-500 sm:text-xs">
                                /month
                              </span>
                            </div>
                          </div>
                          <div className="mt-2 flex items-start gap-1.5 rounded-lg bg-[#F0F8F8] px-2.5 py-2">
                            <ShieldCheck
                              size={14}
                              className="mt-0.5 shrink-0 text-[#008A90]"
                            />
                            <div className="min-w-0">
                              <p className="text-[10px] font-semibold text-slate-500">
                                Refundable deposit
                              </p>
                              <p className="text-xs font-bold text-[#0F2942]">
                                {selectedPlan.deposit !== null &&
                                Number.isFinite(Number(selectedPlan.deposit))
                                  ? formatPrice(Number(selectedPlan.deposit))
                                  : "Not specified"}
                              </p>
                            </div>
                          </div>
                        </>
                      ) : (
                        <div className="mt-3 rounded-lg bg-slate-50 px-3 py-3">
                          <p className="text-xs font-semibold text-slate-500">
                            Rental pricing not added
                          </p>
                          <p className="mt-1 text-[10px] leading-4 text-slate-400">
                            Please select another duration.
                          </p>
                        </div>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => handleWhatsApp(product, selectedPlan)}
                      disabled={
                        !whatsappNumber ||
                        !whatsappMessage.trim() ||
                        !selectedPlanAvailable
                      }
                      className="mt-4 flex min-h-10 w-full items-center justify-center gap-2 rounded-xl bg-[#0F2942] px-2 py-2.5 text-[11px] font-bold text-white transition duration-200 hover:bg-[#008A90] disabled:cursor-not-allowed disabled:opacity-50 sm:text-xs"
                    >
                      <MessageCircle size={15} />
                      Rent via WhatsApp
                      <ArrowRight size={14} className="hidden sm:block" />
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        )}
        {!loading && filteredProducts.length === 0 && (
          <div className="rounded-3xl border border-dashed border-slate-200 bg-white px-5 py-16 text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-[#F0F8F8]">
              <Search size={28} className="text-[#008A90]" />
            </div>
            <h3 className="text-lg font-bold text-[#0F2942]">
              No products found
            </h3>
            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
              Try another search or choose a different category to discover
              available rentals.
            </p>
            {onClearSearch && searchFilter && (
              <button
                type="button"
                onClick={onClearSearch}
                className="mt-5 rounded-xl bg-[#0F2942] px-5 py-3 text-sm font-bold text-white transition hover:bg-[#008A90]"
              >
                Clear search
              </button>
            )}
          </div>
        )}
        {!loading && filteredProducts.length > 0 && (
          <p className="mt-8 text-center text-xs text-slate-400">
            Showing {filteredProducts.length} active{" "}
            {filteredProducts.length === 1 ? "product" : "products"}
          </p>
        )}
      </div>
    </section>
  );
};
export default PopularRentals;
