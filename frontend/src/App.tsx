
import { useEffect, useState } from "react";
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
import TrendingRentals from "./components/TrendingRentals";
import ProductDetails from "./components/ProductDetails";
import PromoBanner from "./components/PromoBanner";
import Footer from "./components/Footer";
import CustomerReviews from "./components/CustomerReviews";

import AdminLogin from "./pages/AdminLogin";
import AdminDashboard from "./pages/AdminDashboard";
import Categories from "./pages/Categories";
import Products from "./pages/Products";
import Banner from "./pages/Banner";
import WhatsAppSettings from "./pages/WhatsAppSettings";
import PromoBanners from "./pages/PromoBanners";
import ContactUs from "./pages/ContactUs";
import ContactManagement from "./pages/ContactManagement";
import FeedbackMaster from "./pages/FeedbackMaster";
import CategoryProducts from "./pages/CategoryProducts";
import TrendingRentalsAdmin from "./pages/TrendingRentalsAdmin";

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

function HomePage() {
  const location = useLocation();
  const navigate = useNavigate();

  const [selectedCategory, setSelectedCategory] = useState("All");
  const [selectedCity, setSelectedCity] = useState("Pune (All Areas)");
  
  // Handle homepage section links.
  useEffect(() => {
    const sectionIds: Record<string, string> = {
      "#about": "about",
      "#products": "products",
      "#categories": "categories",
    };

    const targetId = sectionIds[location.hash];
    if (!targetId) return;

    const timeoutId = window.setTimeout(() => {
      document.getElementById(targetId)?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }, 100);

    return () => window.clearTimeout(timeoutId);
  }, [location.hash, location.key]);

  // Handle search submitted from another page or component.
  useEffect(() => {
    const state = location.state as { searchQuery?: string } | null;

    if (state?.searchQuery === undefined) return;

    
    setSelectedCategory("All");

    navigate("/", { replace: true, state: null });

    window.setTimeout(() => {
      document.getElementById("products")?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }, 100);
  }, [location.key, location.state, navigate]);

  const handleSearch = (
  _query: string,
  category = "All Categories",
  city?: string
) => {
  if (city) setSelectedCity(city);

  setSelectedCategory(
    category && category !== "All Categories" ? category : "All"
  );

  window.setTimeout(() => {
    document.getElementById("products")?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  }, 0);
};

  const handleSelectCategory = (category: string) => {
    setSelectedCategory(category);
    

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
  const scrollToCategories = () => {
  document.getElementById("categories")?.scrollIntoView({
    behavior: "smooth",
    block: "start",
  });
};

  return (
    <div className="min-h-screen bg-[#faf9f7] font-sans text-gray-900">
      <Navbar onSearchSubmit={(query) => handleSearch(query)} />

      <HeroSection
        onSearchSubmit={(query, category, city) =>
          handleSearch(query, category, city)
        }
        selectedCity={selectedCity}
        onExploreClick={scrollToCategories}
      />

      <section id="categories">
  <CategorySection
    onSelectCategory={handleSelectCategory}
    selectedCategory={selectedCategory}
  />
</section>

      <TrendingRentals />

      <PromoBanner onCtaClick={scrollToProducts} />

      <div id="about" className="scroll-mt-24" />

      <CustomerReviews />
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
        <Route path="/" element={<HomePage />} />
        <Route path="/contact" element={<ContactPage />} />
        <Route path="/product/:id" element={<ProductDetails />} />

        {/* Category-specific product listing */}
        <Route path="/category/:id" element={<CategoryProducts />} />

        {/* Existing admin routes */}
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

        <Route path="/admin/feedback" element={<FeedbackMaster />} />
        <Route path="/admin/trending-rentals" element={<TrendingRentalsAdmin />} />
      </Routes>
    </BrowserRouter>

  );
}

export default App;
