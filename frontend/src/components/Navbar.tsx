import { useEffect, useState, useCallback } from 'react';
import {
  Search,
  Heart,
  ShoppingBag,
  User,
  Menu,
  X,
  Phone,
  ChevronDown,
  LogOut,
  RotateCcw,
  Truck,
} from 'lucide-react';

import LoginModal from './LoginModal';

// Helper to decode user info from JWT
function parseUserFromToken(token: string | null): { name: string; email: string } | null {
  if (!token) return null;
  try {
    const parts = token.split('.');
    if (parts.length < 2) return { name: 'User', email: '' };
    const base64Url = parts[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    const parsed = JSON.parse(jsonPayload);
    const email = parsed.email || '';
    const rawName = parsed.name || (email ? email.split('@')[0] : 'User');
    const name = rawName.charAt(0).toUpperCase() + rawName.slice(1);
    return { name, email };
  } catch {
    return { name: 'User', email: '' };
  }
}

interface NavbarProps {
  onSearch?: (query: string) => void;
  selectedCity?: string;
  onSelectCity?: (city: string) => void;
  wishlistCount?: number;
  cartCount?: number;
  onOpenWishlist?: () => void;
  onOpenCart?: () => void;
}

export function Navbar({
  onSearch,
  selectedCity: _selectedCity,
  onSelectCity: _onSelectCity,
  wishlistCount = 0,
  cartCount = 0,
  onOpenWishlist,
  onOpenCart,
}: NavbarProps) {
  const [showLogin, setShowLogin] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userName, setUserName] = useState('');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [browseOpen, setBrowseOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('SELECT CATEGORY');

  // Sync auth state with localStorage
  const updateAuth = useCallback(() => {
    const token = localStorage.getItem('token');
    if (token) {
      setIsLoggedIn(true);
      const user = parseUserFromToken(token);
      setUserName(user?.name || 'User');
    } else {
      setIsLoggedIn(false);
      setUserName('');
    }
  }, []);

  useEffect(() => {
    updateAuth();
    window.addEventListener('storage', updateAuth);
    return () => window.removeEventListener('storage', updateAuth);
  }, [updateAuth]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (onSearch) {
      onSearch(searchQuery);
    }
    const target = document.getElementById('products');
    if (target) {
      target.scrollIntoView({ behavior: 'smooth' });
    }
  };

  // Logout handler: removes auth token from localStorage and updates state immediately
  const handleLogout = () => {
    localStorage.removeItem('token');
    setIsLoggedIn(false);
    setUserName('');
  };

  // Login success handler
  const handleLoginSuccess = () => {
    updateAuth();
    setShowLogin(false);
  };

  return (
    <>
      <header className="sticky top-0 z-40 w-full bg-white shadow-xs">
        {/* 1. TOP ANNOUNCEMENT BAR (EXACT STITCH STYLE) */}
        <div className="bg-[#f28e2b] text-white text-xs font-medium py-2 px-4 border-b border-amber-600/30">
          <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-2">
            <div className="flex items-center space-x-2 font-semibold tracking-wide">
              <Truck size={14} className="text-white" />
              <span>FREE DELIVERY ON YOUR FIRST BOOKING — PUNE ONLY</span>
            </div>

            <div className="flex items-center space-x-5">
              <div className="flex items-center space-x-3 text-white/90 text-xs">
                <a className="hover:text-white transition" href="#contact" aria-label="Facebook">
                  f
                </a>
                <a className="hover:text-white transition" href="#contact" aria-label="Twitter">
                  𝕏
                </a>
                <a className="hover:text-white transition" href="#contact" aria-label="LinkedIn">
                  in
                </a>
              </div>
              <span className="text-white/40">|</span>
              <a
                className="hover:underline text-[11px] font-semibold uppercase tracking-wider"
                href="#contact"
              >
                Contact Us
              </a>
            </div>
          </div>
        </div>

        {/* 2. MAIN HEADER (STITCH STYLE + AUTH LOGIN/LOGOUT) */}
        <div className="border-b border-gray-100 bg-white">
          <div className="max-w-7xl mx-auto px-4 py-3.5 flex items-center justify-between gap-4">
            {/* BRAND LOGO */}
            <a className="flex items-center space-x-2 shrink-0" href="/">
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 rounded-lg bg-[#f28e2b] flex items-center justify-center text-white font-black text-2xl shadow-sm">
                  R
                </div>
                <div>
                  <span className="text-2xl font-black tracking-tight text-gray-900 block leading-tight font-sans">
                    RentNest<span className="text-[#f28e2b]">.in</span>
                  </span>
                  <span className="text-[10px] text-gray-500 font-medium block uppercase tracking-wider">
                    Why invest? Just enjoy!
                  </span>
                </div>
              </div>
            </a>

            {/* SEARCH BAR & CATEGORY DROPDOWN */}
            <div className="hidden lg:flex flex-1 max-w-2xl mx-6">
              <form
                onSubmit={handleSearchSubmit}
                className="flex w-full border-2 border-[#f28e2b] rounded-md overflow-hidden bg-white shadow-xs"
              >
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search for products..."
                  className="flex-1 px-4 py-2 text-sm text-gray-700 outline-none border-none focus:ring-0"
                />
                <div className="border-l border-gray-200">
                  <select
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    className="h-full bg-gray-50 text-gray-600 text-xs px-3 border-none focus:ring-0 font-medium cursor-pointer"
                  >
                    <option value="SELECT CATEGORY">SELECT CATEGORY</option>
                    <option value="Bedroom">Bedroom Furniture</option>
                    <option value="Living Room">Living Room</option>
                    <option value="Appliances">Appliances</option>
                    <option value="Dining">Dining Sets</option>
                    <option value="Study">Work From Home</option>
                  </select>
                </div>
                <button
                  type="submit"
                  aria-label="Search"
                  className="bg-[#f28e2b] hover:bg-[#d97718] text-white px-5 flex items-center justify-center transition"
                >
                  <Search size={16} />
                </button>
              </form>
            </div>

            {/* QUICK ACTIONS & AUTH SECTION */}
            <div className="flex items-center space-x-4 sm:space-x-6 shrink-0">
              {/* Wishlist */}
              <a
                className="relative text-gray-700 hover:text-[#f28e2b] flex flex-col items-center text-xs group transition cursor-pointer"
                href="#products"
                onClick={onOpenWishlist}
                aria-label="Wishlist"
              >
                <div className="relative">
                  <Heart size={20} />
                  <span className="absolute -top-1.5 -right-2 bg-[#f28e2b] text-white text-[10px] font-bold rounded-full h-4 w-4 flex items-center justify-center">
                    {wishlistCount}
                  </span>
                </div>
              </a>

              {/* Compare */}
              <a
                className="relative text-gray-700 hover:text-[#f28e2b] hidden sm:flex flex-col items-center text-xs group transition"
                href="#products"
                aria-label="Compare"
              >
                <div className="relative">
                  <RotateCcw size={19} />
                  <span className="absolute -top-1.5 -right-2 bg-gray-600 text-white text-[10px] font-bold rounded-full h-4 w-4 flex items-center justify-center">
                    0
                  </span>
                </div>
              </a>

              {/* Cart */}
              <a
                className="flex items-center space-x-2 text-gray-700 hover:text-[#f28e2b] group transition cursor-pointer"
                href="#products"
                onClick={onOpenCart}
                aria-label="Cart"
              >
                <div className="relative">
                  <ShoppingBag size={20} />
                  <span className="absolute -top-1.5 -right-2 bg-[#f28e2b] text-white text-[10px] font-bold rounded-full h-4 w-4 flex items-center justify-center">
                    {cartCount}
                  </span>
                </div>
                <div className="hidden sm:block text-left text-xs leading-tight font-semibold">
                  <span className="text-gray-400 block text-[10px] uppercase font-bold">
                    Cart
                  </span>
                  <span>₹0.00</span>
                </div>
              </a>

              {/* Phone Direct */}
              <div className="hidden xl:flex items-center space-x-3 border-l pl-5 border-gray-200">
                <div className="w-9 h-9 rounded-full bg-amber-50 text-[#f28e2b] flex items-center justify-center text-sm">
                  <Phone size={15} />
                </div>
                <div>
                  <span className="text-[10px] text-gray-400 uppercase font-bold block">
                    Rent Hotline
                  </span>
                  <a
                    className="text-xs font-bold text-gray-900 hover:text-[#f28e2b]"
                    href="tel:+919423838109"
                  >
                    +91 94238 38109
                  </a>
                </div>
              </div>

              {/* ======================================================== */}
              {/* AUTH SECTION: LOGIN / USER PROFILE & LOGOUT               */}
              {/* ======================================================== */}
              <div className="border-l border-gray-200 pl-3 sm:pl-5">
                {isLoggedIn ? (
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-2 rounded-md bg-gray-50 border border-gray-200 px-2.5 py-1 text-xs font-semibold text-gray-800">
                      <div className="w-6 h-6 rounded bg-[#f28e2b] text-white flex items-center justify-center font-bold text-[11px]">
                        {userName ? userName.charAt(0).toUpperCase() : 'U'}
                      </div>
                      <span className="max-w-[100px] truncate">{userName || 'User'}</span>
                    </div>

                    <button
                      type="button"
                      onClick={handleLogout}
                      className="flex items-center gap-1 rounded-md border border-gray-200 bg-white px-2.5 py-1 text-xs font-semibold text-gray-700 hover:bg-red-50 hover:text-red-600 transition"
                    >
                      <LogOut size={13} />
                      <span>Logout</span>
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setShowLogin(true)}
                    className="flex items-center gap-1.5 rounded-md bg-[#f28e2b] hover:bg-[#d97718] text-white px-3.5 py-1.5 text-xs font-bold uppercase tracking-wider shadow-xs transition active:scale-95"
                  >
                    <User size={13} />
                    <span>Login</span>
                  </button>
                )}
              </div>

              {/* Mobile menu hamburger */}
              <button
                type="button"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                aria-label="Toggle mobile menu"
                className="lg:hidden p-2 text-gray-700 hover:text-[#f28e2b]"
              >
                {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
              </button>
            </div>
          </div>
        </div>

        {/* 3. SECONDARY CATEGORY NAVIGATION BAR (STITCH STYLE) */}
        <div className="border-t border-gray-100 bg-white">
          <div className="max-w-7xl mx-auto px-4 flex items-center justify-between">
            <div className="flex items-center space-x-6 sm:space-x-8">
              {/* Browse Categories Button */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setBrowseOpen(!browseOpen)}
                  className="bg-[#232f3e] hover:bg-black text-white px-4 sm:px-5 py-3 text-xs font-bold uppercase tracking-wider flex items-center space-x-3 rounded-t-sm transition"
                >
                  <Menu size={14} />
                  <span>BROWSE CATEGORIES</span>
                  <ChevronDown size={11} className="ml-1" />
                </button>

                {browseOpen && (
                  <div className="absolute left-0 top-full mt-0 w-60 bg-white border border-gray-200 shadow-xl z-50 py-1">
                    {[
                      { name: 'Bedroom Furniture', href: '#categories' },
                      { name: 'Living Room Furniture', href: '#categories' },
                      { name: 'Dining Sets', href: '#categories' },
                      { name: 'Study / WFH', href: '#categories' },
                      { name: 'Home Appliances', href: '#categories' },
                      { name: 'Combo Offers', href: '#categories' },
                    ].map((item) => (
                      <a
                        key={item.name}
                        href={item.href}
                        onClick={() => setBrowseOpen(false)}
                        className="block px-4 py-2 text-xs font-semibold text-gray-700 hover:bg-amber-50 hover:text-[#f28e2b] transition"
                      >
                        {item.name}
                      </a>
                    ))}
                  </div>
                )}
              </div>

              {/* Main Nav Links */}
              <nav className="hidden md:flex items-center space-x-6 text-[13px] font-semibold text-gray-700 uppercase tracking-wide">
                <a className="text-[#f28e2b] border-b-2 border-[#f28e2b] py-3.5" href="#">
                  HOME
                </a>
                <a className="hover:text-[#f28e2b] py-3.5 transition" href="#about">
                  ABOUT US
                </a>
                <a className="hover:text-[#f28e2b] py-3.5 transition" href="#categories">
                  RENT FURNITURE
                </a>
                <a className="hover:text-[#f28e2b] py-3.5 transition" href="#categories">
                  RENT APPLIANCES
                </a>
                <a className="hover:text-[#f28e2b] py-3.5 transition" href="#categories">
                  COMBO OFFERS
                </a>
                <a className="hover:text-[#f28e2b] py-3.5 transition" href="#categories">
                  STUDY
                </a>
              </nav>
            </div>

            {/* Secondary Support Action */}
            <div className="text-xs font-bold text-gray-700 py-3 hidden sm:flex items-center gap-1.5">
              <span>Instant Quote:</span>
              <a
                className="text-[#f28e2b] hover:underline"
                href="tel:+919423838109"
              >
                +91 94238 38109
              </a>
            </div>
          </div>
        </div>

        {/* Mobile menu drawer */}
        {mobileMenuOpen && (
          <div className="lg:hidden border-t border-gray-200 bg-white px-4 py-4 space-y-3">
            <form onSubmit={handleSearchSubmit} className="flex border border-[#f28e2b] rounded-md overflow-hidden">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search products..."
                className="w-full px-3 py-2 text-xs text-gray-700 outline-none"
              />
              <button type="submit" className="bg-[#f28e2b] text-white px-3">
                <Search size={14} />
              </button>
            </form>

            <div className="grid grid-cols-2 gap-2 text-xs font-semibold text-gray-700 pt-2">
              <a href="#" className="py-1.5 text-[#f28e2b]">HOME</a>
              <a href="#about" className="py-1.5">ABOUT US</a>
              <a href="#categories" className="py-1.5">RENT FURNITURE</a>
              <a href="#categories" className="py-1.5">RENT APPLIANCES</a>
              <a href="#categories" className="py-1.5">COMBO OFFERS</a>
              <a href="#categories" className="py-1.5">STUDY</a>
            </div>

            <div className="pt-2 border-t border-gray-100 flex items-center justify-between text-xs font-semibold">
              <span>Hotline: +91 94238 38109</span>
              {isLoggedIn ? (
                <button
                  type="button"
                  onClick={() => {
                    handleLogout();
                    setMobileMenuOpen(false);
                  }}
                  className="text-red-600 font-bold"
                >
                  Logout
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    setMobileMenuOpen(false);
                    setShowLogin(true);
                  }}
                  className="text-[#f28e2b] font-bold"
                >
                  Login
                </button>
              )}
            </div>
          </div>
        )}
      </header>

      {/* LOGIN MODAL INTEGRATION */}
      {showLogin && (
        <LoginModal
          onClose={() => setShowLogin(false)}
          onLoginSuccess={handleLoginSuccess}
        />
      )}
    </>
  );
}

export default Navbar;