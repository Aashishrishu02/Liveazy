import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  House,
  LayoutGrid,
  Tag,
  Heart,
  ShoppingCart,
  type LucideIcon,
} from "lucide-react";
import { useCart } from "../context/CartContext";

interface NavItemConfig {
  id: "home" | "categories" | "deals" | "saved" | "cart";
  label: string;
  icon: LucideIcon;
  ariaLabel: string;
}

const NAV_ITEMS: NavItemConfig[] = [
  { id: "home", label: "Home", icon: House, ariaLabel: "Go to Homepage" },
  { id: "categories", label: "Categories", icon: LayoutGrid, ariaLabel: "View Categories" },
  { id: "deals", label: "Deals", icon: Tag, ariaLabel: "View Deals & Offers" },
  { id: "saved", label: "Saved", icon: Heart, ariaLabel: "View Saved Items" },
  { id: "cart", label: "Cart", icon: ShoppingCart, ariaLabel: "Open Shopping Cart" },
];

export const MobileBottomNav: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { cartCount, isCartOpen, openCart, closeCart } = useCart();

  const [activeSection, setActiveSection] = useState<string | null>(null);

  // If in admin route, never render mobile bottom nav
  if (location.pathname.startsWith("/admin")) {
    return null;
  }

  // Intersection observer to track active section while scrolling on homepage
  useEffect(() => {
    if (location.pathname !== "/") {
      setActiveSection(null);
      return;
    }

    // Reset to home when user scrolls back to the top
    const handleScroll = () => {
      if (window.scrollY < 180 && !location.hash) {
        setActiveSection(null);
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && entry.intersectionRatio >= 0.2) {
            if (entry.target.id === "deals") {
              setActiveSection("deals");
            }
          }
        });
      },
      {
        rootMargin: "-10% 0px -40% 0px",
        threshold: [0.2],
      }
    );

    const dealsEl = document.getElementById("deals");
    if (dealsEl) observer.observe(dealsEl);

    return () => {
      window.removeEventListener("scroll", handleScroll);
      observer.disconnect();
    };
  }, [location.pathname, location.hash]);

  const handleItemClick = (item: NavItemConfig) => {
    switch (item.id) {
      case "home": {
        if (isCartOpen) closeCart();
        setActiveSection(null);
        if (location.pathname === "/") {
          if (location.hash) {
            navigate("/", { replace: true });
          }
          window.scrollTo({ top: 0, behavior: "smooth" });
        } else {
          navigate("/");
          window.scrollTo({ top: 0, behavior: "smooth" });
        }
        break;
      }
      case "categories": {
        if (isCartOpen) closeCart();
        navigate("/categories");
        break;
      }
      case "deals": {
        if (isCartOpen) closeCart();
        setActiveSection("deals");
        if (location.pathname === "/") {
          const el = document.getElementById("deals");
          if (el) {
            el.scrollIntoView({ behavior: "smooth", block: "start" });
            window.history.pushState(null, "", "/#deals");
          } else {
            navigate("/#deals");
          }
        } else {
          navigate("/#deals");
        }
        break;
      }
      case "saved": {
        if (isCartOpen) closeCart();
        navigate("/wishlist");
        break;
      }
      case "cart": {
        openCart();
        break;
      }
    }
  };

  // Determine active item
  const getIsActive = (id: NavItemConfig["id"]): boolean => {
    if (isCartOpen) {
      return id === "cart";
    }

    if (id === "saved") {
      return location.pathname === "/wishlist";
    }

    if (id === "categories") {
      return (
        location.pathname === "/categories" ||
        location.pathname.startsWith("/category")
      );
    }

    if (id === "deals") {
      return (
        location.pathname === "/" &&
        (activeSection === "deals" || location.hash === "#deals")
      );
    }

    if (id === "home") {
      return (
        location.pathname === "/" &&
        activeSection !== "deals" &&
        (!location.hash || location.hash === "#" || location.hash === "")
      );
    }

    return false;
  };

  return (
    <nav
      aria-label="Mobile Bottom Navigation"
      role="navigation"
      className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md rounded-t-2xl border-t border-gray-100 shadow-[0_-3px_20px_rgba(0,0,0,0.06)] select-none transition-all duration-200"
      style={{
        paddingBottom: "max(0.35rem, env(safe-area-inset-bottom, 0px))",
      }}
    >
      <div className="grid grid-cols-5 h-[56px] min-[375px]:h-[58px] min-[390px]:h-[60px] w-full max-w-md mx-auto items-center px-0.5">
        {NAV_ITEMS.map((item) => {
          const isActive = getIsActive(item.id);
          const IconComponent = item.icon;

          return (
            <button
              key={item.id}
              type="button"
              onClick={() => handleItemClick(item)}
              aria-label={item.ariaLabel}
              aria-current={isActive ? "page" : undefined}
              className="flex flex-col items-center justify-center h-full w-full py-1 px-0.5 transition-colors duration-150 relative cursor-pointer group focus:outline-none focus-visible:ring-2 focus-visible:ring-[#007C8A]/40 rounded-xl"
            >
              <div className="relative flex h-[24px] w-[24px] items-center justify-center shrink-0">
                <IconComponent
                  aria-hidden="true"
                  className={`w-[20px] h-[20px] min-[375px]:w-[21px] min-[375px]:h-[21px] min-[414px]:w-[22px] min-[414px]:h-[22px] transition-all duration-150 group-active:scale-95 ${
                    isActive
                      ? "text-[#007C8A] stroke-[2.3]"
                      : "text-[#4B5563] stroke-[1.8] group-hover:text-gray-900"
                  }`}
                />

                {/* Actual Cart Count Badge */}
                {item.id === "cart" && cartCount > 0 && (
                  <span
                    className="absolute -top-1 -right-2 flex h-[17px] min-w-[17px] items-center justify-center rounded-full bg-[#f97316] px-1 text-[10px] font-extrabold text-white shadow-xs pointer-events-none animate-in zoom-in-75 duration-150"
                    aria-label={`${cartCount} items in cart`}
                  >
                    {cartCount > 99 ? "99+" : cartCount}
                  </span>
                )}
              </div>

              <span
                className={`text-[10.5px] min-[360px]:text-[11px] min-[390px]:text-[11.5px] min-[414px]:text-[12px] leading-tight tracking-tight mt-1 text-center truncate max-w-full px-0.5 transition-colors duration-150 ${
                  isActive
                    ? "text-[#007C8A] font-bold"
                    : "text-[#4B5563] font-medium group-hover:text-gray-900"
                }`}
              >
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};

export default MobileBottomNav;

