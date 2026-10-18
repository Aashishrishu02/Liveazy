import {
  Search,
  Menu,
  X,
  ArrowRight,
} from "lucide-react";
import {
  useState,
  type SyntheticEvent,
} from "react";
import {
  Link,
  useLocation,
  useNavigate,
} from "react-router-dom";

interface NavbarProps {
  onSearchSubmit?: (query: string) => void;
}

export default function Navbar({
  onSearchSubmit,
}: NavbarProps) {
  const [mobileMenu, setMobileMenu] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const location = useLocation();
  const navigate = useNavigate();

  const isHomePage = location.pathname === "/";

  const closeMenu = () => setMobileMenu(false);

  const handleSearch = (
    event: SyntheticEvent<HTMLFormElement>
  ) => {
    event.preventDefault();

    const query = searchQuery.trim();

    closeMenu();

    if (isHomePage) {
      onSearchSubmit?.(query);

      setTimeout(() => {
        document.getElementById("products")?.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
      }, 0);
    } else {
      // Return to the homepage when searching from another page.
      navigate("/", {
        state: { searchQuery: query },
      });
    }
  };

  const sectionHref = (section: string) =>
    isHomePage ? `#${section}` : `/#${section}`;

  const linkClass =
    "relative whitespace-nowrap text-sm font-semibold text-[#0F2942] transition-colors duration-200 hover:text-[#008A90]";

  const navigationLinks = [
    { label: "Home", href: "/" },
    { label: "Categories", href: sectionHref("categories") },
    { label: "Products", href: sectionHref("products") },
    { label: "About Us", href: sectionHref("about") },
  ];

  return (
    <header className="sticky top-0 z-50 w-full">
      {/* Announcement bar */}
      <div className="bg-[#0F2942] px-4 py-2 text-center text-xs font-medium tracking-wide text-white sm:text-sm">
        Make your space feel like home, without the heavy investment.
      </div>

      <nav className="border-b border-slate-200 bg-white/95 shadow-sm backdrop-blur-xl">
        <div className="mx-auto flex min-h-[78px] max-w-[1440px] items-center gap-4 px-4 sm:px-6 lg:px-8">
          {/* Logo */}
          <Link
            to="/"
            aria-label="LIVEAZY home"
            onClick={closeMenu}
            className="flex h-16 w-[200px] shrink-0 items-center overflow-hidden sm:w-[230px] md:h-20 md:w-[260px] lg:w-[290px]"
          >
            <img
              src="/liveazy-logo.png"
              alt="LIVEAZY Furniture Rental"
              className="h-full w-full object-cover object-[center_55%]"
            />
          </Link>

          {/* Desktop navigation */}
          <div className="ml-auto hidden items-center gap-6 lg:flex xl:gap-8">
            {navigationLinks.map((item) =>
              item.label === "Home" ? (
                <Link
                  key={item.label}
                  to={item.href}
                  className={linkClass}
                >
                  {item.label}
                </Link>
              ) : (
                <a
                  key={item.label}
                  href={item.href}
                  className={linkClass}
                >
                  {item.label}
                </a>
              )
            )}

            {/* Contact opens the separate page */}
            <Link
              to="/contact"
              className={linkClass}
            >
              Contact
            </Link>
          </div>

          {/* Desktop search */}
          <form
            onSubmit={handleSearch}
            className="ml-5 hidden w-[210px] shrink-0 lg:block xl:w-[250px]"
          >
            <div className="relative">
              <Search
                size={18}
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#008A90]"
              />

              <input
                type="search"
                value={searchQuery}
                onChange={(event) =>
                  setSearchQuery(event.target.value)
                }
                placeholder="Search furniture..."
                aria-label="Search furniture"
                className="h-11 w-full rounded-xl border border-slate-200 bg-[#F5F7FA] pl-10 pr-4 text-sm text-[#0F2942] outline-none transition placeholder:text-slate-400 focus:border-[#008A90] focus:bg-white focus:ring-4 focus:ring-[#008A90]/10"
              />
            </div>
          </form>

          {/* Mobile menu toggle */}
          <button
            type="button"
            onClick={() =>
              setMobileMenu((open) => !open)
            }
            className="ml-auto flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-slate-200 text-[#0F2942] transition hover:border-[#008A90] hover:bg-[#008A90]/5 lg:hidden"
            aria-label={
              mobileMenu ? "Close menu" : "Open menu"
            }
            aria-expanded={mobileMenu}
          >
            {mobileMenu ? (
              <X size={23} />
            ) : (
              <Menu size={23} />
            )}
          </button>
        </div>

        {/* Mobile menu */}
        {mobileMenu && (
          <div className="border-t border-slate-100 bg-white px-4 pb-5 pt-4 shadow-lg sm:px-6 lg:hidden">
            <form
              onSubmit={handleSearch}
              className="mb-4"
            >
              <div className="relative">
                <Search
                  size={18}
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#008A90]"
                />

                <input
                  type="search"
                  value={searchQuery}
                  onChange={(event) =>
                    setSearchQuery(event.target.value)
                  }
                  placeholder="Search furniture..."
                  aria-label="Search furniture"
                  className="h-12 w-full rounded-xl border border-slate-200 bg-[#F5F7FA] pl-10 pr-4 text-sm outline-none focus:border-[#008A90] focus:ring-4 focus:ring-[#008A90]/10"
                />
              </div>

              <button
                type="submit"
                className="mt-2 flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-[#0F2942] text-sm font-semibold text-white transition hover:bg-[#008A90]"
              >
                Search products
                <ArrowRight size={17} />
              </button>
            </form>

            <div className="flex flex-col gap-1">
              {navigationLinks.map((item) =>
                item.label === "Home" ? (
                  <Link
                    key={item.label}
                    to={item.href}
                    onClick={closeMenu}
                    className="rounded-xl px-4 py-3 text-sm font-semibold text-[#0F2942] transition hover:bg-[#008A90]/5 hover:text-[#008A90]"
                  >
                    {item.label}
                  </Link>
                ) : (
                  <a
                    key={item.label}
                    href={item.href}
                    onClick={closeMenu}
                    className="rounded-xl px-4 py-3 text-sm font-semibold text-[#0F2942] transition hover:bg-[#008A90]/5 hover:text-[#008A90]"
                  >
                    {item.label}
                  </a>
                )
              )}

              <Link
                to="/contact"
                onClick={closeMenu}
                className="rounded-xl px-4 py-3 text-sm font-semibold text-[#0F2942] transition hover:bg-[#008A90]/5 hover:text-[#008A90]"
              >
                Contact
              </Link>
            </div>
          </div>
        )}
      </nav>
    </header>
  );
}