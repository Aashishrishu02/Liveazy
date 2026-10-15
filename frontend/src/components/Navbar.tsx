
import { Search, Menu, X, ArrowRight } from "lucide-react";
import { useState, type FormEvent } from "react";

interface NavbarProps {
  onSearchSubmit?: (query: string) => void;
}

export default function Navbar({ onSearchSubmit }: NavbarProps) {
  const [mobileMenu, setMobileMenu] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const handleSearch = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    onSearchSubmit?.(searchQuery.trim());
    setMobileMenu(false);

    document.getElementById("products")?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  };

  const closeMenu = () => setMobileMenu(false);

  const linkClass =
    "relative whitespace-nowrap text-sm font-semibold text-[#0F2942] transition-colors duration-200 hover:text-[#008A90]";

  return (
    <header id="home" className="sticky top-0 z-50 w-full">
      {/* Announcement bar */}
      <div className="bg-[#0F2942] px-4 py-2 text-center text-xs font-medium tracking-wide text-white sm:text-sm">
        Make your space feel like home, without the heavy investment.
      </div>

      <nav className="border-b border-slate-200 bg-white/95 shadow-sm backdrop-blur-xl">
        <div className="mx-auto flex min-h-[78px] max-w-[1440px] items-center gap-4 px-4 sm:px-6 lg:px-8">
          {/* Logo */}
          <a
            href="/"
            aria-label="LIVEAZY home"
            onClick={closeMenu}
            className="
              w-[200px]
              sm:w-[230px]
              md:w-[260px]
              lg:w-[290px]
              h-16
              md:h-20
              flex
              items-center
              overflow-hidden
              shrink-0
            "
          >
            <img
              src="/liveazy-logo.png"
              alt="LIVEAZY Furniture Rental"
              className="
                w-full
                h-full
                object-cover
                object-[center_55%]
              "
            />
          </a>

          {/* Desktop navigation */}
          <div className="ml-auto hidden items-center gap-6 xl:gap-8 lg:flex">
            <a href="#home" className={linkClass}>
              Home
            </a>
            <a href="#categories" className={linkClass}>
              Categories
            </a>
            <a href="#products" className={linkClass}>
              Products
            </a>
            <a href="#about" className={linkClass}>
              About Us
            </a>
            <a href="#contact" className={linkClass}>
              Contact
            </a>
          </div>

          {/* Desktop search */}
          <form
            onSubmit={handleSearch}
            className="ml-5 hidden w-[210px] shrink-0 xl:w-[250px] lg:block"
          >
            <div className="relative">
              <Search
                size={18}
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#008A90]"
              />
              <input
                type="search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search furniture..."
                aria-label="Search furniture"
                className="h-11 w-full rounded-xl border border-slate-200 bg-[#F5F7FA] pl-10 pr-4 text-sm text-[#0F2942] outline-none transition placeholder:text-slate-400 focus:border-[#008A90] focus:bg-white focus:ring-4 focus:ring-[#008A90]/10"
              />
            </div>
          </form>

          {/* Mobile menu button */}
          <button
            type="button"
            onClick={() => setMobileMenu((open) => !open)}
            className="ml-auto flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-slate-200 text-[#0F2942] transition hover:border-[#008A90] hover:bg-[#008A90]/5 lg:hidden"
            aria-label={mobileMenu ? "Close menu" : "Open menu"}
            aria-expanded={mobileMenu}
          >
            {mobileMenu ? <X size={23} /> : <Menu size={23} />}
          </button>
        </div>

        {/* Mobile menu */}
        {mobileMenu && (
          <div className="border-t border-slate-100 bg-white px-4 pb-5 pt-4 shadow-lg lg:hidden sm:px-6">
            <form onSubmit={handleSearch} className="mb-4">
              <div className="relative">
                <Search
                  size={18}
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#008A90]"
                />
                <input
                  type="search"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search furniture..."
                  aria-label="Search furniture"
                  className="h-12 w-full rounded-xl border border-slate-200 bg-[#F5F7FA] pl-10 pr-4 text-sm outline-none focus:border-[#008A90] focus:ring-4 focus:ring-[#008A90]/10"
                />
              </div>
              <button
                type="submit"
                className="mt-2 flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-[#0F2942] text-sm font-semibold text-white transition hover:bg-[#008A90]"
              >
                Search products <ArrowRight size={17} />
              </button>
            </form>

            <div className="flex flex-col gap-1">
              {[
                { label: "Home", href: "#home" },
                { label: "Categories", href: "#categories" },
                { label: "Products", href: "#products" },
                { label: "About Us", href: "#about" },
                { label: "Contact", href: "#contact" },
              ].map((item) => (
                <a
                  key={item.label}
                  href={item.href}
                  onClick={closeMenu}
                  className="rounded-xl px-4 py-3 text-sm font-semibold text-[#0F2942] transition hover:bg-[#008A90]/5 hover:text-[#008A90]"
                >
                  {item.label}
                </a>
              ))}
            </div>
          </div>
        )}
      </nav>
    </header>
  );
}
