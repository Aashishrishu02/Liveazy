import { useEffect, useState } from 'react';
import {
  Search,
  Heart,
  ShoppingBag,
  User,
  Menu,
  Phone,
  ChevronDown,
  GitCompareArrows,
  Armchair,
} from 'lucide-react';

import LoginModal from './LoginModal';

function Navbar() {
  const [showLogin, setShowLogin] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

useEffect(() => {
  const token = localStorage.getItem('token');

  if (token) {
    setIsLoggedIn(true);
  }
}, []);

  return (
    <>
      <header className="w-full">

        {/* TOP BAR */}
        <div className="bg-orange-500 text-white">
          <div className="mx-auto flex h-10 max-w-1250px items-center justify-between px-5">

            <p className="text-xs font-medium">
              FREE DELIVERY ON YOUR FIRST BOOKING — PUNE ONLY
            </p>

            <div className="flex items-center gap-5 text-sm">
              <span>f</span>
              <span>𝕏</span>
              <span>in</span>
              <span>◎</span>
              <span>◉</span>

              <span className="border-l border-orange-300 pl-5">
                CONTACT US
              </span>
            </div>

          </div>
        </div>

        {/* MAIN ORANGE NAVBAR */}
        <div className="bg-orange-500 text-white">

          <div className="mx-auto flex h-110px max-w-1250px items-center gap-8 px-5">

            {/* LOGO */}
            <div className="flex min-w-205px items-center gap-3">

              <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-white text-orange-500">
                <Armchair size={34} strokeWidth={2} />
              </div>

              <div>
                <h1 className="text-3xl font-bold leading-none">
                  RentNest
                </h1>

                <p className="mt-1 text-xs text-white">
                  Why invest? Just enjoy!
                </p>
              </div>

            </div>

            {/* SEARCH */}
            <div className="flex h-12 flex-1 overflow-hidden rounded-full bg-white">

              <input
                type="text"
                placeholder="Search for products"
                className="min-w-0 flex-1 px-5 text-sm text-gray-700 outline-none"
              />

              <div className="flex w-48 items-center justify-center gap-3 border-l border-gray-200 text-xs text-gray-500">
                <span>
                  SELECT CATEGORY
                </span>

                <ChevronDown size={16} />
              </div>

              <button className="flex w-14 items-center justify-center bg-orange-500 text-white hover:bg-orange-600">
                <Search size={21} />
              </button>

            </div>

            {/* ACTION ICONS */}
            <div className="flex items-center gap-5">

              <button className="transition hover:scale-110">
                <Heart size={23} />
              </button>

              <button className="transition hover:scale-110">
                <GitCompareArrows size={23} />
              </button>

              <button className="relative transition hover:scale-110">
                <ShoppingBag size={23} />

                <span className="absolute -right-2 -top-3 text-[9px]">
                  0
                </span>
              </button>

              <span className="text-sm font-medium">
                ₹0.00
              </span>

              {isLoggedIn ? (
  <div className="flex items-center gap-3">
    <span className="text-sm font-semibold">
      User
    </span>

    <button
      onClick={() => {
        localStorage.removeItem('token');
        setIsLoggedIn(false);
      }}
      className="rounded-lg bg-white px-3 py-2 text-xs font-semibold text-orange-500 hover:bg-gray-100"
    >
      Logout
    </button>
  </div>
) : (
  <button
    onClick={() => setShowLogin(true)}
    className="transition hover:scale-110"
  >
    <User size={23} />
  </button>
)}

            </div>

          </div>

        </div>

        {/* WHITE NAVIGATION */}
        <div className="border-b border-gray-200 bg-white">

          <div className="mx-auto flex h-54px max-w-1250px items-center px-5">

            {/* BROWSE */}
            <button className="flex h-full items-center gap-3 border-r border-gray-200 pr-7 text-sm font-semibold text-gray-700">
              <Menu size={21} />

              <span>
                BROWSE CATEGORIES
              </span>

              <ChevronDown size={16} />
            </button>

            {/* LINKS */}
            <nav className="ml-7 flex items-center gap-7">

              <a
                href="#"
                className="text-sm font-semibold text-orange-500"
              >
                HOME
              </a>

              <a
                href="#"
                className="text-sm font-medium text-gray-700 transition hover:text-orange-500"
              >
                ABOUT US
              </a>

              <a
                href="#"
                className="flex items-center gap-1 text-sm font-medium text-gray-700 transition hover:text-orange-500"
              >
                RENT FURNITURE
                <ChevronDown size={14} />
              </a>

              <a
                href="#"
                className="flex items-center gap-1 text-sm font-medium text-gray-700 transition hover:text-orange-500"
              >
                RENT APPLIANCES
                <ChevronDown size={14} />
              </a>

              <a
                href="#"
                className="text-sm font-medium text-gray-700 transition hover:text-orange-500"
              >
                COMBO OFFERS
              </a>

            </nav>

            {/* PHONE */}
            <div className="ml-auto flex items-center gap-3">

              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-orange-500 text-white">
                <Phone size={17} />
              </div>

              <span className="text-sm font-semibold text-gray-700">
                +91 987654XXX
              </span>

            </div>

          </div>

        </div>

      </header>

      {/* LOGIN */}
      {showLogin && (
       <LoginModal
  onClose={() => setShowLogin(false)}
  onLoginSuccess={() => setIsLoggedIn(true)}
/>
      )}

    </>
  );
}

export default Navbar;