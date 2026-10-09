import { useState, useCallback } from "react";

import Navbar from "./components/Navbar";
import HeroSection from "./components/HeroSection";
import CategorySection from "./components/CategorySection";
import PopularRentals from "./components/PopularRentals";
import PromoBanner from "./components/PromoBanner";
import WhyRentNest from "./components/WhyRentNest";
import Footer from "./components/Footer";

import type { Product } from "./types/rental";

import {
  BrowserRouter,
  Routes,
  Route,
} from "react-router-dom";

import AdminLogin from "./pages/AdminLogin";
import AdminDashboard from "./pages/AdminDashboard";
import Categories from "./pages/Categories";
import Products from "./pages/Products";
import Banner from "./pages/Banner";
import WhatsAppSettings from "./pages/WhatsAppSettings";

function App() {
  const [selectedCategory, setSelectedCategory] =
    useState<string>("All");

  const [searchFilter, setSearchFilter] =
    useState<string>("");

  const [selectedCity, setSelectedCity] =
    useState<string>("Pune (All Areas)");

  const [wishlistIds, setWishlistIds] =
    useState<Set<string>>(
      new Set(["p-sofa-01", "p-bed-01"])
    );

  //  WISHLIST 
  const handleToggleWishlist = useCallback(
    (product: Product) => {
      setWishlistIds((prev) => {
        const next = new Set(prev);

        if (next.has(product.id)) {
          next.delete(product.id);
        } else {
          next.add(product.id);
        }

        return next;
      });
    },
    []
  );

  // SEARCH 

  const handleSearch = (
    query: string,
    category = "All Categories",
    city?: string
  ) => {
    if (city) {
      setSelectedCity(city);
    }

    if (
      category &&
      category !== "All Categories"
    ) {
      setSelectedCategory(category);
    } else {
      setSelectedCategory("All");
    }

    setSearchFilter(query);

    const target =
      document.getElementById("products");

    if (target) {
      target.scrollIntoView({
        behavior: "smooth",
      });
    }
  };

  //  CATEGORY 
  const handleSelectCategory = (
    category: string
  ) => {
    setSelectedCategory(category);
    setSearchFilter("");

    const target =
      document.getElementById("products");

    if (target) {
      target.scrollIntoView({
        behavior: "smooth",
      });
    }
  };

  // SCROLL 

  const scrollToProducts = () => {
    const target =
      document.getElementById("products");

    if (target) {
      target.scrollIntoView({
        behavior: "smooth",
      });
    }
  };

  //  RENT NOW 
  const handleRentNow = (
    product: Product
  ) => {
    alert(
      `Booking initiated for ${product.name}. Our Pune team will contact you for delivery scheduling!`
    );
  };

  return (
    <BrowserRouter>
      <Routes>

        {/* PUBLIC CUSTOMER WEBSITE */}

        <Route
          path="/"
          element={
            <div className="min-h-screen bg-[#faf9f7] text-gray-900 font-sans">

              <Navbar />

              <HeroSection
                onSearchSubmit={(
                  query,
                  category,
                  city
                ) =>
                  handleSearch(
                    query,
                    category,
                    city
                  )
                }
                selectedCity={selectedCity}
                onExploreClick={
                  scrollToProducts
                }
              />

              <CategorySection
                onSelectCategory={
                  handleSelectCategory
                }
                selectedCategory={
                  selectedCategory
                }
              />

              <PopularRentals
                products={[]}
                selectedCategory={
                  selectedCategory
                }
                onSelectCategory={
                  setSelectedCategory
                }
                searchFilter={
                  searchFilter
                }
                onClearSearch={() =>
                  setSearchFilter("")
                }
                wishlistIds={
                  wishlistIds
                }
                onToggleWishlist={
                  handleToggleWishlist
                }
                onRentNow={
                  handleRentNow
                }
              />

              <PromoBanner
                onCtaClick={
                  scrollToProducts
                }
              />

              <div id="about" className="scroll-mt-24">
  <WhyRentNest />
</div>

              <Footer />

            </div>
          }
        />

        {/*  ADMIN LOGIN  */}

        <Route
          path="/admin"
          element={<AdminLogin />}
        />

        {/*  ADMIN DASHBOARD */}

        <Route
          path="/admin/dashboard"
          element={<AdminDashboard />}
        />

        {/*  CATEGORIES MASTER  */}

        <Route
          path="/admin/categories"
          element={<Categories />}
        />

        {/*  PRODUCTS MASTER  */}

        <Route
          path="/admin/products"
          element={<Products />}
        />

        {/* BANNER MANAGEMENT  */}

        <Route
          path="/admin/banner"
          element={<Banner />}
        />

        {/* WHATSAPP SETTINGS */}

<Route
  path="/admin/settings"
  element={<WhatsAppSettings />}
/>

      </Routes>
    </BrowserRouter>
  );
}

export default App;