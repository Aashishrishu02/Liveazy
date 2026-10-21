
import { useCallback, useEffect, useState } from "react";
import {
  BrowserRouter,
  Routes,
  Route,
  useLocation,
  useNavigate,
} from "react-router-dom";

import Navbar from "./components/Navbar";
import HeroSection from "./components/HeroSection";
import CategorySection from "./components/CategorySection";
import PopularRentals from "./components/PopularRentals";
import ProductDetails from "./components/ProductDetails";
import PromoBanner from "./components/PromoBanner";
import WhyRentNest from "./components/WhyRentNest";
import Footer from "./components/Footer";

import AdminLogin from "./pages/AdminLogin";
import AdminDashboard from "./pages/AdminDashboard";
import Categories from "./pages/Categories";
import Products from "./pages/Products";
import Banner from "./pages/Banner";
import WhatsAppSettings from "./pages/WhatsAppSettings";
import PromoBanners from "./pages/PromoBanners";
import ContactUs from "./pages/ContactUs";
import ContactManagement from "./pages/ContactManagement";

import type { Product } from "./types/rental";

function ScrollToTop() {
  const { pathname, hash } = useLocation();

  useEffect(() => {
    // Allow intentional anchor navigation, such as /contact#faqs.
    if (hash) return;

    window.scrollTo({
      top: 0,
      left: 0,
      behavior: "instant",
    });
  }, [pathname, hash]);

  return null;
}

function HomePage() {
  const location = useLocation();
  const navigate = useNavigate();

  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [searchFilter, setSearchFilter] = useState<string>("");
  const [selectedCity, setSelectedCity] = useState<string>("Pune (All Areas)");
  const [wishlistIds, setWishlistIds] = useState<Set<string>>(
    new Set(["p-sofa-01", "p-bed-01"])
  );

  // Handle homepage section links.
  useEffect(() => {
    if (location.hash === "#about") {
      const timeoutId = window.setTimeout(() => {
        document.getElementById("about")?.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
      }, 100);

      return () => window.clearTimeout(timeoutId);
    }

    if (location.hash === "#products") {
      const timeoutId = window.setTimeout(() => {
        document.getElementById("products")?.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
      }, 100);

      return () => window.clearTimeout(timeoutId);
    }

    if (location.hash === "#categories") {
      const timeoutId = window.setTimeout(() => {
        document.getElementById("categories")?.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
      }, 100);

      return () => window.clearTimeout(timeoutId);
    }

    return undefined;
  }, [location.hash, location.key]);

  // Preserve a search query when returning from another page.
  useEffect(() => {
    const state = location.state as { searchQuery?: string } | null;

    if (state?.searchQuery !== undefined) {
      setSearchFilter(state.searchQuery);
      setSelectedCategory("All");

      navigate("/", { replace: true, state: null });

      window.setTimeout(() => {
        document.getElementById("products")?.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
      }, 100);
    }
  }, [location.key, location.state, navigate]);

  const handleToggleWishlist = useCallback((product: Product) => {
    setWishlistIds((previous) => {
      const updated = new Set(previous);

      if (updated.has(product.id)) {
        updated.delete(product.id);
      } else {
        updated.add(product.id);
      }

      return updated;
    });
  }, []);

  const handleSearch = (
    query: string,
    category = "All Categories",
    city?: string
  ) => {
    if (city) setSelectedCity(city);

    if (category && category !== "All Categories") {
      setSelectedCategory(category);
    } else {
      setSelectedCategory("All");
    }

    setSearchFilter(query);

    window.setTimeout(() => {
      document.getElementById("products")?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }, 0);
  };

  const handleSelectCategory = (category: string) => {
    setSelectedCategory(category);
    setSearchFilter("");

    window.setTimeout(() => {
      document.getElementById("products")?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }, 0);
  };

  const scrollToProducts = () => {
    document.getElementById("products")?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  };

  const handleRentNow = (product: Product) => {
    window.alert(
      `Booking initiated for ${product.name}. Please continue through the product's WhatsApp rental option.`
    );
  };

  return (
    <div className="min-h-screen bg-[#faf9f7] font-sans text-gray-900">
      <Navbar onSearchSubmit={(query) => handleSearch(query)} />

      <HeroSection
        onSearchSubmit={(query, category, city) =>
          handleSearch(query, category, city)
        }
        selectedCity={selectedCity}
        onExploreClick={scrollToProducts}
      />

      <CategorySection
        onSelectCategory={handleSelectCategory}
        selectedCategory={selectedCategory}
      />

      <PopularRentals
        products={[]}
        selectedCategory={selectedCategory}
        onSelectCategory={setSelectedCategory}
        searchFilter={searchFilter}
        onClearSearch={() => setSearchFilter("")}
        wishlistIds={wishlistIds}
        onToggleWishlist={handleToggleWishlist}
        onRentNow={handleRentNow}
      />

      <PromoBanner onCtaClick={scrollToProducts} />

      <div id="about" className="scroll-mt-24">
        <WhyRentNest />
      </div>

      <Footer />
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

      <Routes>
        {/* Public pages */}
        <Route path="/" element={<HomePage />} />
        <Route path="/contact" element={<ContactPage />} />
        <Route path="/product/:id" element={<ProductDetails />} />

        {/* Admin pages - existing routes preserved */}
        <Route path="/admin" element={<AdminLogin />} />
        <Route path="/admin/dashboard" element={<AdminDashboard />} />
        <Route path="/admin/categories" element={<Categories />} />
        <Route path="/admin/products" element={<Products />} />
        <Route path="/admin/banner" element={<Banner />} />
        <Route path="/admin/settings" element={<WhatsAppSettings />} />
        <Route path="/admin/promo-banners" element={<PromoBanners />} />
        <Route
          path="/admin/contact-management"
          element={<ContactManagement />}
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
