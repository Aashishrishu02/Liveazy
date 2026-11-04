import { lazy, Suspense, useEffect, useState } from "react";
import {
  BrowserRouter,
  Routes,
  Route,
  useLocation,
  useNavigate,
} from "react-router-dom";

import Navbar from "./components/Navbar";
import CategorySection from "./components/CategorySection";
import ValuePropositionStrip from "./components/ValuePropositionStrip";
import HeroSection from "./components/HeroSection";
import TrendingRentals from "./components/TrendingRentals";
import CatalogSection from "./components/CatalogSection";
import PremiumPillars from "./components/PremiumPillars";
import ComboPlans from "./components/ComboPlans";
import DealsSection from "./components/DealsSection";
import PromoBanner from "./components/PromoBanner";
import HowItWorks from "./components/HowItWorks";
import CustomerStories from "./components/CustomerStories";
import WhyRent from "./components/WhyRent";
import FaqSection from "./components/FaqSection";
import RentalGuideSection from "./components/RentalGuideSection";
import Footer from "./components/Footer";
import QuickViewModal from "./components/QuickViewModal";
import CartDrawer from "./components/CartDrawer";
import type { CartItem, Product } from "./types/rental";
import { getApiBaseUrl, fetchJsonDeduplicated } from "./utils/api";

const ProductDetails = lazy(() => import("./components/ProductDetails"));
const ContactUs = lazy(() => import("./pages/ContactUs"));
const CategoryProducts = lazy(() => import("./pages/CategoryProducts"));
const BlogListing = lazy(() => import("./pages/BlogListing"));
const BlogDetails = lazy(() => import("./pages/BlogDetails"));
const WishlistPage = lazy(() => import("./pages/WishlistPage"));

const AdminLogin = lazy(() => import("./pages/AdminLogin"));
const AdminDashboard = lazy(() => import("./pages/AdminDashboard"));
const Categories = lazy(() => import("./pages/Categories"));
const Products = lazy(() => import("./pages/Products"));
const Banner = lazy(() => import("./pages/Banner"));
const WhatsAppSettings = lazy(() => import("./pages/WhatsAppSettings"));
const SocialMediaSettings = lazy(() => import("./pages/SocialMediaSettings"));
const PromoBanners = lazy(() => import("./pages/PromoBanners"));
const ContactManagement = lazy(() => import("./pages/ContactManagement"));
const FeedbackMaster = lazy(() => import("./pages/FeedbackMaster"));
const TrendingRentalsAdmin = lazy(() => import("./pages/TrendingRentalsAdmin"));
const Blogs = lazy(() => import("./pages/Blogs"));
const ComboOffersAdmin = lazy(() => import("./pages/ComboOffersAdmin"));
const DealsAdmin = lazy(() => import("./pages/DealsAdmin"));
const CustomerStoriesAdmin = lazy(() => import("./pages/CustomerStoriesAdmin"));
const HomepageSectionsAdmin = lazy(() => import("./pages/HomepageSectionsAdmin"));

function ScrollToTop() {
  const { pathname, hash } = useLocation();

  useEffect(() => {
    if (hash) return;

    window.scrollTo({
      top: 0,
      left: 0,
      behavior: "instant",
    });
  }, [pathname, hash]);

  return null;
}

interface SectionItem {
  id?: string;
  title: string;
  subtitle?: string | null;
  description?: string | null;
  icon?: string | null;
  image?: string | null;
  badge?: string | null;
  linkUrl?: string | null;
  sortOrder?: number;
  isActive?: boolean;
}

interface HomepageSectionData {
  id?: string;
  sectionKey: string;
  title: string;
  subtitle?: string | null;
  badge?: string | null;
  description?: string | null;
  sortOrder: number;
  isVisible: boolean;
  items: SectionItem[];
}

const DEFAULT_HOMEPAGE_SECTIONS: HomepageSectionData[] = [
  { sectionKey: "CATEGORIES", title: "Explore by Category", sortOrder: 0, isVisible: true, items: [] },
  { sectionKey: "VALUE_PROP", title: "Why Rent with LIVEAZY", sortOrder: 1, isVisible: true, items: [] },
  { sectionKey: "HERO", title: "Homepage Hero Banner Carousel", sortOrder: 2, isVisible: true, items: [] },
  { sectionKey: "TRENDING", title: "Trending Rentals in Your City", sortOrder: 3, isVisible: true, items: [] },
  { sectionKey: "CATALOG", title: "Trending Products & Category Catalog", sortOrder: 4, isVisible: true, items: [] },
  { sectionKey: "PREMIUM_PILLARS", title: "Looks premium. Feels premium.", sortOrder: 5, isVisible: true, items: [] },
  { sectionKey: "COMBOS", title: "Value Combo Packages", sortOrder: 6, isVisible: true, items: [] },
  { sectionKey: "DEALS", title: "This Week's Deals", sortOrder: 7, isVisible: true, items: [] },
  { sectionKey: "PROMO_BANNER", title: "Promo Banners & Deals", sortOrder: 8, isVisible: true, items: [] },
  { sectionKey: "HOW_IT_WORKS", title: "How it works", sortOrder: 9, isVisible: true, items: [] },
  { sectionKey: "CUSTOMER_STORIES", title: "Customer stories", sortOrder: 10, isVisible: true, items: [] },
  { sectionKey: "WHY_RENT", title: "Why rent with LIVEAZY?", sortOrder: 11, isVisible: true, items: [] },
  { sectionKey: "FAQS", title: "Frequently Asked Questions", sortOrder: 12, isVisible: true, items: [] },
  { sectionKey: "RENTAL_GUIDE", title: "Rent Furniture & Appliances Online with LIVEAZY", sortOrder: 13, isVisible: true, items: [] },
];

function HomePage() {
  const location = useLocation();
  const navigate = useNavigate();

  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedCity, setSelectedCity] = useState("Pune");
  const [searchQuery, setSearchQuery] = useState("");

  // Cart state
  const [cartOpen, setCartOpen] = useState(false);
  const [cartItems, setCartItems] = useState<CartItem[]>([]);

  // Quick View Modal state
  const [quickViewProduct, setQuickViewProduct] = useState<Product | null>(null);
  const [quickViewOpen, setQuickViewOpen] = useState(false);

  // Dynamic Homepage Sections (Admin-controlled order & visibility)
  const [sections, setSections] = useState<HomepageSectionData[]>(DEFAULT_HOMEPAGE_SECTIONS);

  useEffect(() => {
    let cancelled = false;
    const apiBase = getApiBaseUrl();

    async function loadSections() {
      try {
        const res = await fetchJsonDeduplicated<unknown>(`${apiBase}/homepage-sections/public`);
        if (Array.isArray(res) && res.length > 0 && !cancelled) {
          const sorted = (res as HomepageSectionData[])
            .filter((s) => s.isVisible !== false)
            .sort((a, b) => a.sortOrder - b.sortOrder);
          setSections(sorted);
        }
      } catch (err) {
        console.warn("Could not load homepage sections order:", err);
      }
    }

    void loadSections();
    return () => {
      cancelled = true;
    };
  }, []);

  // Handle hash scrolling with multi-stage retry for dynamic sections
  useEffect(() => {
    const hash = location.hash;
    if (!hash) return;

    const targetId = hash.replace(/^#/, "");
    const scrollToTarget = () => {
      const el = document.getElementById(targetId) || document.querySelector(hash);
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "start" });
        return true;
      }
      return false;
    };

    // Attempt immediately
    if (scrollToTarget()) return;

    // Retry with gentle timeouts to accommodate dynamic component fetching/rendering
    const t1 = window.setTimeout(scrollToTarget, 100);
    const t2 = window.setTimeout(scrollToTarget, 300);
    const t3 = window.setTimeout(scrollToTarget, 600);

    return () => {
      window.clearTimeout(t1);
      window.clearTimeout(t2);
      window.clearTimeout(t3);
    };
  }, [location.hash, location.key, sections]);

  // Handle search or category from navigation state
  useEffect(() => {
    const state = location.state as { searchQuery?: string; category?: string } | null;
    if (state?.searchQuery !== undefined) {
      setSearchQuery(state.searchQuery);
      setSelectedCategory("all");
      navigate("/", { replace: true, state: null });
      window.setTimeout(() => {
        document.getElementById("trending")?.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 100);
    } else if (state?.category !== undefined) {
      setSelectedCategory(state.category);
      navigate("/", { replace: true, state: null });
      window.setTimeout(() => {
        document.getElementById("trending")?.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 100);
    }
  }, [location.key, location.state, navigate]);

  const handleSearch = (query: string, categoryId?: string) => {
    if (categoryId) {
      setSelectedCategory(categoryId);
    }
    setSearchQuery(query);
  };

  const handleSelectCategory = (categoryId: string) => {
    setSelectedCategory(categoryId);
  };

  const handleQuickView = (product: Product) => {
    setQuickViewProduct(product);
    setQuickViewOpen(true);
  };

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
    )}\n\nDelivery City: ${selectedCity}\nPlease share rental booking confirmation!`;
    const waUrl = `https://wa.me/917061460429?text=${encodeURIComponent(message)}`;
    window.open(waUrl, "_blank", "noopener,noreferrer");
  };

  const renderSection = (sec: HomepageSectionData) => {
    switch (sec.sectionKey) {
      case "CATEGORIES":
        return (
          <CategorySection
            key="CATEGORIES"
            selectedCategory={selectedCategory}
            onSelectCategory={handleSelectCategory}
          />
        );
      case "VALUE_PROP":
        return <ValuePropositionStrip key="VALUE_PROP" sectionData={sec} />;
      case "HERO":
        return (
          <HeroSection
            key="HERO"
            selectedCity={selectedCity}
            onExploreClick={() => {
              document.getElementById("trending")?.scrollIntoView({ behavior: "smooth" });
            }}
          />
        );
      case "TRENDING":
        return (
          <TrendingRentals
            key="TRENDING"
            onQuickView={handleQuickView}
            onAddToCart={handleAddToCart}
          />
        );
      case "CATALOG":
        return (
          <CatalogSection
            key="CATALOG"
            selectedCategory={selectedCategory}
            onSelectCategory={handleSelectCategory}
            onQuickView={handleQuickView}
            onAddToCart={handleAddToCart}
            searchQuery={searchQuery}
          />
        );
      case "PREMIUM_PILLARS":
        return <PremiumPillars key="PREMIUM_PILLARS" sectionData={sec} />;
      case "COMBOS":
        return (
          <ComboPlans
            key="COMBOS"
            onQuickView={handleQuickView}
            onAddToCart={handleAddToCart}
            onSelectCategory={handleSelectCategory}
          />
        );
      case "DEALS":
        return (
          <DealsSection
            key="DEALS"
            onQuickView={handleQuickView}
            onAddToCart={handleAddToCart}
          />
        );
      case "PROMO_BANNER":
        return (
          <PromoBanner
            key="PROMO_BANNER"
            onCtaClick={() => {
              document.getElementById("trending")?.scrollIntoView({ behavior: "smooth" });
            }}
          />
        );
      case "HOW_IT_WORKS":
        return <HowItWorks key="HOW_IT_WORKS" sectionData={sec} />;
      case "CUSTOMER_STORIES":
        return <CustomerStories key="CUSTOMER_STORIES" />;
      case "WHY_RENT":
        return <WhyRent key="WHY_RENT" sectionData={sec} />;
      case "FAQS":
        return <FaqSection key="FAQS" />;
      case "RENTAL_GUIDE":
        return <RentalGuideSection key="RENTAL_GUIDE" sectionData={sec} />;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-[#fafbfc] font-['Poppins',sans-serif] text-[#27272a] antialiased">
      {/* 1 & 2: Top announcement & Main Header */}
      <Navbar
        selectedCity={selectedCity}
        onSelectCity={setSelectedCity}
        selectedCategory={selectedCategory}
        onSelectCategory={handleSelectCategory}
        onSearchSubmit={handleSearch}
        cartCount={cartItems.reduce((acc, item) => acc + item.quantity, 0)}
        onOpenCart={() => setCartOpen(true)}
      />

      {/* 3. Homepage Category Circular Navigation Bar */}
      <CategorySection
        selectedCategory={selectedCategory}
        onSelectCategory={handleSelectCategory}
      />

      {/* Admin Controlled Dynamic Homepage Sections */}
      {sections
        .filter((sec) => sec.sectionKey !== "CATEGORIES")
        .map((sec) => renderSection(sec))}

      {/* Main Footer (DB Social, WhatsApp, Categories, Contact Settings) */}
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

function ContactPage() {
  const location = useLocation();

  useEffect(() => {
    if (location.hash !== "#faqs") return;

    const timeoutId = window.setTimeout(() => {
      document.getElementById("faqs")?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }, 150);

    return () => window.clearTimeout(timeoutId);
  }, [location.hash, location.key]);

  return (
    <ContactUs
      onSearchSubmit={() => {
        window.location.href = "/";
      }}
    />
  );
}

function App() {
  return (
    <BrowserRouter>
      <ScrollToTop />

      <Suspense fallback={<div className="min-h-screen bg-[#fafbfc]" />}>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/contact" element={<ContactPage />} />
          <Route path="/wishlist" element={<WishlistPage />} />
          <Route path="/product/:id" element={<ProductDetails />} />

          {/* Category-specific product listing */}
          <Route path="/category/:id" element={<CategoryProducts />} />

          {/* Existing admin routes (strictly preserved) */}
          <Route path="/admin" element={<AdminLogin />} />
          <Route path="/admin/dashboard" element={<AdminDashboard />} />
          <Route path="/admin/categories" element={<Categories />} />
          <Route path="/admin/products" element={<Products />} />
          <Route path="/admin/banner" element={<Banner />} />
          <Route path="/admin/settings" element={<WhatsAppSettings />} />
          <Route path="/admin/social-media" element={<SocialMediaSettings />} />
          <Route path="/admin/social-settings" element={<SocialMediaSettings />} />
          <Route path="/admin/promo-banners" element={<PromoBanners />} />

          <Route
            path="/admin/contact-management"
            element={<ContactManagement />}
          />

          <Route path="/admin/feedback" element={<FeedbackMaster />} />
          <Route path="/admin/trending-rentals" element={<TrendingRentalsAdmin />} />
          <Route path="/admin/combos" element={<ComboOffersAdmin />} />
          <Route path="/admin/deals" element={<DealsAdmin />} />
          <Route path="/admin/customer-stories" element={<CustomerStoriesAdmin />} />
          <Route path="/admin/sections" element={<HomepageSectionsAdmin />} />
          <Route path="/admin/homepage-sections" element={<HomepageSectionsAdmin />} />
          <Route path="/admin/blogs" element={<Blogs />} />
          <Route path="/blogs" element={<BlogListing />} />
          <Route path="/blogs/:slug" element={<BlogDetails />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}

export default App;
