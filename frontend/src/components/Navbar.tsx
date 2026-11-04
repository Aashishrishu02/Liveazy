import { useState, useEffect, useRef, type SyntheticEvent, type MouseEvent } from "react";
import {
  Search,
  Menu,
  X,
  MapPin,
  ChevronDown,
  ShoppingBag,
  MessageCircle,
  ArrowRight,
  Heart,
} from "lucide-react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { getApiBaseUrl, fetchCategoriesDeduplicated, fetchJsonDeduplicated } from "../utils/api";
import { getWishlistCount, subscribeWishlist } from "../utils/wishlist";
import CityModal from "./CityModal";

interface NavbarProps {
  onSearchSubmit?: (query: string, categoryId?: string) => void;
  selectedCity?: string;
  onSelectCity?: (city: string) => void;
  selectedCategory?: string;
  onSelectCategory?: (categoryId: string) => void;
  cartCount?: number;
  onOpenCart?: () => void;
}

interface Category {
  id: string;
  name: string;
  isActive?: boolean;
  displayOrder?: number | null;
}

interface SocialSettings {
  whatsappNumber?: string;
}

export default function Navbar({
  onSearchSubmit,
  selectedCity = "Pune",
  onSelectCity,
  selectedCategory = "all",
  onSelectCategory,
  cartCount = 0,
  onOpenCart,
}: NavbarProps) {
  const [mobileMenu, setMobileMenu] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [categories, setCategories] = useState<Category[]>([]);
  const [cityModalOpen, setCityModalOpen] = useState(false);
  const [whatsappNumber, setWhatsappNumber] = useState("");
  const [wishlistCount, setWishlistCount] = useState<number>(() => getWishlistCount());

  // Subscribe to live wishlist changes
  useEffect(() => {
    const unsubscribe = subscribeWishlist((ids) => {
      setWishlistCount(ids.length);
    });
    return unsubscribe;
  }, []);

  const location = useLocation();
  const navigate = useNavigate();
  const isHomePage = location.pathname === "/";
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Normalize WhatsApp number
  const cleanPhone = (whatsappNumber || "917061460429").replace(/\D/g, "");
  const normalizedWa = cleanPhone.length === 10 ? `91${cleanPhone}` : cleanPhone;
  const whatsappUrl = `https://wa.me/${normalizedWa}?text=${encodeURIComponent(
    "Hello LIVEAZY, I'm interested in renting furniture & appliances. Please share available packages!"
  )}`;

  // Fetch categories and social settings from backend APIs
  useEffect(() => {
    let cancelled = false;
    const apiBase = getApiBaseUrl();

    async function loadData() {
      try {
        const catResult = await fetchCategoriesDeduplicated(apiBase);
        let list: Category[] = [];
        if (Array.isArray(catResult)) {
          list = catResult as Category[];
        } else if (catResult && typeof catResult === "object" && "data" in catResult) {
          list = (catResult as { data: Category[] }).data;
        }

        if (!cancelled && list.length > 0) {
          setCategories(
            list
              .filter((c) => c.isActive !== false)
              .sort((a, b) => (a.displayOrder ?? 999) - (b.displayOrder ?? 999))
          );
        }
      } catch (e) {
        console.warn("Could not fetch categories in Navbar:", e);
      }

      try {
        const social = await fetchJsonDeduplicated<SocialSettings>(`${apiBase}/settings/social`);
        if (!cancelled && social?.whatsappNumber) {
          setWhatsappNumber(social.whatsappNumber);
        }
      } catch (e) {
        console.warn("Could not fetch whatsapp number:", e);
      }
    }

    void loadData();
    return () => {
      cancelled = true;
    };
  }, []);

  const closeMenu = () => {
    setMobileMenu(false);
  };

  const handleHomeClick = (event: MouseEvent<HTMLAnchorElement>) => {
    closeMenu();
    if (isHomePage && !location.hash) {
      event.preventDefault();
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const handleSearch = (event: SyntheticEvent<HTMLFormElement>) => {
    event.preventDefault();
    const query = searchQuery.trim();
    closeMenu();
    if (!query) return;

    if (isHomePage) {
      onSearchSubmit?.(query);
      const target = document.getElementById("trending") || document.getElementById("products");
      target?.scrollIntoView({ behavior: "smooth", block: "start" });
    } else {
      navigate("/", { state: { searchQuery: query } });
    }
  };

  const handleCategoryClick = (categoryId: string) => {
    closeMenu();
    if (onSelectCategory) {
      onSelectCategory(categoryId);
    }
    if (isHomePage) {
      const target = document.getElementById("trending") || document.getElementById("products");
      target?.scrollIntoView({ behavior: "smooth", block: "start" });
    } else {
      navigate("/", { state: { category: categoryId } });
    }
  };

  return (
    <>
      {/* 1. TOP ANNOUNCEMENT BAR */}
      <aside className="border-b border-[#e9e3f7] bg-[#f4f1fc] py-1.5 text-xs text-[#3f3f46]">
        <div className="ref-container flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2 font-medium">
            <span className="rounded-full bg-[#4a36b3] px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white">
              LIVE
            </span>
            <span className="truncate">
              Upgrade Your Lifestyle, Not Your Expenses! | Rent Smart with <strong className="text-gray-900 font-semibold">LIVEAZY</strong>
            </span>
          </div>

          <div className="hidden sm:flex items-center gap-4 text-xs">
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 font-semibold text-[#166634] hover:underline"
            >
              <MessageCircle size={14} className="stroke-[2.2]" />
              WhatsApp Enquiry
            </a>
            <span className="text-gray-300">|</span>
            <Link to="/contact" className="font-medium text-[#4a36b3] hover:underline">
              Help &amp; Support
            </Link>
          </div>
        </div>
      </aside>

      {/* 2. MAIN HEADER */}
      <header className="sticky top-0 z-40 bg-white shadow-xs">
        <div className="ref-container">
          <div className="flex h-18 sm:h-20 items-center justify-between gap-3 md:gap-6 py-2.5">
            {/* Brand Logo */}
            <Link
              to="/"
              onClick={handleHomeClick}
              aria-label="LIVEAZY Home"
              className="flex shrink-0 items-center group py-1"
            >
              <img
                src="/liveazy-logo-cropped.png"
                alt="LIVEAZY Furniture Rental"
                className="h-9 sm:h-11 md:h-12 w-auto max-w-[180px] sm:max-w-[220px] md:max-w-[250px] object-contain transition group-hover:opacity-95"
              />
            </Link>

            {/* City Selector Button */}
            <button
              type="button"
              onClick={() => setCityModalOpen(true)}
              aria-label="Select City"
              className="hidden md:flex items-center gap-1.5 rounded-full border border-[#dcd4fa] bg-[#f0eaff] px-3.5 py-1.5 text-xs font-semibold text-[#4a36b3] transition hover:bg-[#e7defa] hover:border-[#4a36b3]"
            >
              <MapPin size={15} className="text-[#4a36b3] stroke-[2.2]" />
              <span className="truncate">
                Deliver to <strong className="font-bold">{selectedCity}</strong>
              </span>
              <ChevronDown size={14} className="text-[#4a36b3] stroke-[2.2]" />
            </button>

            {/* Search Bar */}
            <form onSubmit={handleSearch} className="flex-1 max-w-md hidden sm:block">
              <div className="relative">
                <Search
                  size={17}
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 stroke-[2]"
                />
                <input
                  ref={searchInputRef}
                  type="search"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder='Search "Bed", "Sofa", "Washing Machine"...'
                  aria-label="Search furniture and appliances"
                  className="h-10 w-full rounded-full border border-transparent bg-[#f4f4f5] pl-10 pr-4 text-xs sm:text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-[#4a36b3] focus:bg-white focus:ring-3 focus:ring-[#4a36b3]/15"
                />
              </div>
            </form>

            {/* Header Actions */}
            <div className="flex items-center gap-2 sm:gap-3">
              {/* WhatsApp Fast Connect */}
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                title="Chat with Rental Advisor on WhatsApp"
                className="hidden lg:flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700 transition hover:bg-emerald-100"
              >
                <MessageCircle size={15} className="text-emerald-600 stroke-[2.2]" />
                <span>Instant Rent</span>
              </a>

              {/* Wishlist Button */}
              <Link
                to="/wishlist"
                title="View Saved Wishlist"
                aria-label="View Saved Wishlist"
                className="relative flex items-center gap-1.5 rounded-xl border border-gray-200 bg-white px-2.5 sm:px-3 py-2 text-xs sm:text-sm font-semibold text-gray-700 transition hover:border-[#0F2942] hover:bg-slate-50 hover:text-[#0F2942]"
              >
                <Heart size={18} className="text-[#0F2942] stroke-[2]" />
                <span className="hidden sm:inline">Wishlist</span>
                {wishlistCount > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 flex h-4.5 min-w-[18px] items-center justify-center rounded-full bg-rose-500 px-1 text-[10px] font-bold text-white shadow-xs">
                    {wishlistCount}
                  </span>
                )}
              </Link>

              {/* Cart Button */}
              <button
                type="button"
                onClick={onOpenCart}
                title="View Rental Cart"
                aria-label="View Cart"
                className="relative flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs sm:text-sm font-semibold text-gray-700 transition hover:border-[#4a36b3] hover:bg-[#f0eaff] hover:text-[#4a36b3]"
              >
                <ShoppingBag size={18} className="stroke-[2]" />
                <span className="hidden sm:inline">Cart</span>
                {cartCount > 0 && (
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#ff6b35] text-[10px] font-bold text-white shadow-xs">
                    {cartCount}
                  </span>
                )}
              </button>

              {/* Mobile Menu Toggle */}
              <button
                type="button"
                onClick={() => setMobileMenu((prev) => !prev)}
                aria-label={mobileMenu ? "Close menu" : "Open menu"}
                aria-expanded={mobileMenu}
                className="flex h-10 w-10 items-center justify-center rounded-xl border border-gray-200 text-gray-700 transition hover:border-[#4a36b3] hover:text-[#4a36b3] md:hidden"
              >
                {mobileMenu ? <X size={20} /> : <Menu size={20} />}
              </button>
            </div>
          </div>
        </div>

        {/* Category Navigation Sub-bar - Dynamic from Database */}
        <nav
          aria-label="Product Categories Navigation"
          className="border-t border-gray-100 bg-white"
        >
          <div className="ref-container">
            <ul className="flex items-center gap-4 sm:gap-6 overflow-x-auto py-2.5 no-scrollbar whitespace-nowrap text-xs sm:text-[13.5px]">
              <li className="shrink-0">
                <button
                  type="button"
                  onClick={() => handleCategoryClick("all")}
                  className={`flex items-center gap-1.5 font-medium transition py-1 border-b-2 ${
                    selectedCategory.toLowerCase() === "all"
                      ? "border-[#4a36b3] text-[#4a36b3] font-bold"
                      : "border-transparent text-gray-600 hover:text-[#4a36b3]"
                  }`}
                >
                  All Products
                </button>
              </li>

              {categories.map((item) => {
                const isActive =
                  selectedCategory.toLowerCase() === item.id.toLowerCase() ||
                  selectedCategory.toLowerCase() === item.name.toLowerCase();
                return (
                  <li key={item.id} className="shrink-0">
                    <button
                      type="button"
                      onClick={() => handleCategoryClick(item.id)}
                      className={`flex items-center gap-1.5 font-medium transition py-1 border-b-2 ${
                        isActive
                          ? "border-[#4a36b3] text-[#4a36b3] font-bold"
                          : "border-transparent text-gray-600 hover:text-[#4a36b3]"
                      }`}
                    >
                      {item.name}
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
        </nav>

        {/* Mobile Dropdown Menu */}
        {mobileMenu && (
          <div className="border-t border-gray-100 bg-white px-4 py-4 shadow-xl md:hidden animate-in slide-in-from-top-2 duration-200">
            {/* Mobile City Selector */}
            <div className="mb-3">
              <button
                type="button"
                onClick={() => {
                  setCityModalOpen(true);
                  setMobileMenu(false);
                }}
                className="flex w-full items-center justify-between rounded-xl border border-[#dcd4fa] bg-[#f0eaff] p-3 text-xs font-semibold text-[#4a36b3]"
              >
                <div className="flex items-center gap-2">
                  <MapPin size={16} />
                  <span>Deliver to: <strong>{selectedCity}</strong></span>
                </div>
                <ChevronDown size={14} />
              </button>
            </div>

            {/* Mobile Search */}
            <form onSubmit={handleSearch} className="mb-4">
              <div className="relative">
                <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="search"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search furniture & appliances..."
                  className="h-10 w-full rounded-xl border border-gray-200 bg-[#f4f4f5] pl-10 pr-3 text-xs text-gray-900 outline-none focus:border-[#4a36b3]"
                />
              </div>
            </form>

            {/* Navigation Links - Database Categories Only */}
            <div className="space-y-1 border-t border-gray-100 pt-3">
              <div className="text-[11px] font-bold uppercase tracking-wider text-gray-400 px-2 mb-1">
                Explore Categories
              </div>

              <button
                type="button"
                onClick={() => handleCategoryClick("all")}
                className="flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-xs font-semibold text-gray-700 hover:bg-[#f0eaff] hover:text-[#4a36b3]"
              >
                <span>All Products</span>
                <ArrowRight size={14} className="text-gray-400" />
              </button>

              {categories.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => handleCategoryClick(item.id)}
                  className="flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-xs font-semibold text-gray-700 hover:bg-[#f0eaff] hover:text-[#4a36b3]"
                >
                  <span>{item.name}</span>
                  <ArrowRight size={14} className="text-gray-400" />
                </button>
              ))}

              <div className="border-t border-gray-100 my-2 pt-2">
                <Link
                  to="/wishlist"
                  onClick={closeMenu}
                  className="flex w-full items-center justify-between rounded-lg px-3 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50"
                >
                  <span className="flex items-center gap-2">
                    <Heart size={15} className="text-rose-500 fill-rose-500" />
                    <span>My Wishlist</span>
                  </span>
                  {wishlistCount > 0 ? (
                    <span className="rounded-full bg-rose-500 px-2 py-0.5 text-[10px] font-bold text-white">
                      {wishlistCount}
                    </span>
                  ) : (
                    <ArrowRight size={14} className="text-gray-400" />
                  )}
                </Link>
                <Link
                  to="/blogs"
                  onClick={closeMenu}
                  className="flex w-full items-center justify-between rounded-lg px-3 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50"
                >
                  <span>Blogs &amp; Rental Tips</span>
                  <ArrowRight size={14} className="text-gray-400" />
                </Link>
                <Link
                  to="/contact"
                  onClick={closeMenu}
                  className="flex w-full items-center justify-between rounded-lg px-3 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50"
                >
                  <span>Contact &amp; FAQs</span>
                  <ArrowRight size={14} className="text-gray-400" />
                </Link>
                <a
                  href={whatsappUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl bg-[#166634] py-2.5 text-xs font-bold text-white shadow-sm"
                >
                  <MessageCircle size={16} />
                  <span>Chat on WhatsApp</span>
                </a>
              </div>
            </div>
          </div>
        )}
      </header>

      {/* City Selector Modal */}
      <CityModal
        isOpen={cityModalOpen}
        onClose={() => setCityModalOpen(false)}
        selectedCity={selectedCity}
        onSelectCity={(city) => {
          onSelectCity?.(city);
          setCityModalOpen(false);
        }}
      />
    </>
  );
}
