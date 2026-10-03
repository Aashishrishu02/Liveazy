import { useState, useCallback, useEffect} from 'react';
import Navbar from './components/Navbar';
import HeroSection from './components/HeroSection';
import CategorySection from './components/CategorySection';
import PopularRentals from './components/PopularRentals';
import PromoBanner from './components/PromoBanner';
import WhyRentNest from './components/WhyRentNest';
import Footer from './components/Footer';
import { PRODUCTS_DATA } from './data/rentalData';
import type { Product } from './types/rental';

function App() {
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get('token');

    if (token) {
      // Save JWT token
      localStorage.setItem('token', token);

      // Remove token from URL
      window.history.replaceState(
        {},
        document.title,
        window.location.pathname
      );

      // Tell Navbar that authentication has changed
      window.dispatchEvent(new Event('auth-change'));
    }
  }, []);
  
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [searchFilter, setSearchFilter] = useState<string>('');
  const [selectedCity, setSelectedCity] = useState<string>('Pune (All Areas)');

  // Wishlist state
  const [wishlistIds, setWishlistIds] = useState<Set<string>>(
    new Set(['p-sofa-01', 'p-bed-01'])
  );

  // Toggle wishlist handler
  const handleToggleWishlist = useCallback((product: Product) => {
    setWishlistIds((prev) => {
      const next = new Set(prev);
      if (next.has(product.id)) {
        next.delete(product.id);
      } else {
        next.add(product.id);
      }
      return next;
    });
  }, []);

  // Search from hero or navbar
  const handleSearch = (query: string, category = 'All Categories', city?: string) => {
    if (city) {
      setSelectedCity(city);
    }
    if (category && category !== 'All Categories') {
      setSelectedCategory(category);
    } else {
      setSelectedCategory('All');
    }
    setSearchFilter(query);

    const target = document.getElementById('products');
    if (target) {
      target.scrollIntoView({ behavior: 'smooth' });
    }
  };

  // Category select handler
  const handleSelectCategory = (cat: string) => {
    setSelectedCategory(cat);
    setSearchFilter('');
    const target = document.getElementById('products');
    if (target) {
      target.scrollIntoView({ behavior: 'smooth' });
    }
  };

  // Scroll to products
  const scrollToProducts = () => {
    const target = document.getElementById('products');
    if (target) {
      target.scrollIntoView({ behavior: 'smooth' });
    }
  };

  // Rent now action
  const handleRentNow = (_product: Product) => {
    const token = localStorage.getItem('token');
    if (!token) {
      // Trigger login prompt or scroll
      const loginBtn = document.querySelector('header button') as HTMLButtonElement;
      if (loginBtn) {
        loginBtn.click();
      }
    } else {
      alert(`Booking initiated for ${_product.name}. Our Pune team will contact you for delivery scheduling!`);
    }
  };

  return (
    <div className="min-h-screen bg-[#faf9f7] text-gray-900 font-sans selection:bg-orange-500 selection:text-white">
      {/* 1. ANNOUNCEMENT BAR + NAVBAR WITH LOGIN/LOGOUT + CATEGORY NAVIGATION */}
      <Navbar
        onSearch={(query) => handleSearch(query)}
        selectedCity={selectedCity}
        onSelectCity={(city: string) => setSelectedCity(city)}
        wishlistCount={wishlistIds.size}
        cartCount={1}
        onOpenWishlist={scrollToProducts}
        onOpenCart={scrollToProducts}
      />

      {/* 2. HERO */}
      <HeroSection
        onSearchSubmit={(q, cat, city) => handleSearch(q, cat, city)}
        selectedCity={selectedCity}
        onExploreClick={scrollToProducts}
      />

      {/* 3. CATEGORIES */}
      <CategorySection
        onSelectCategory={handleSelectCategory}
        selectedCategory={selectedCategory}
      />

      {/* 4. PRODUCTS / POPULAR RENTALS */}
      <PopularRentals
        products={PRODUCTS_DATA}
        selectedCategory={selectedCategory}
        onSelectCategory={setSelectedCategory}
        searchFilter={searchFilter}
        onClearSearch={() => setSearchFilter('')}
        wishlistIds={wishlistIds}
        onToggleWishlist={handleToggleWishlist}
        onRentNow={handleRentNow}
      />

      {/* 5. SIMPLE PROMO */}
      <PromoBanner onCtaClick={scrollToProducts} />

      {/* 6. BENEFITS (WHY RENTNEST) */}
      <WhyRentNest />

      {/* 7. FOOTER */}
      <Footer />
    </div>
  );
}

export default App;