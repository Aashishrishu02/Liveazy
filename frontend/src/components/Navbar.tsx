
import {
  Search,
  Menu,
  X,
  ArrowRight,
  ChevronDown,
} from "lucide-react";
import {
  useState,
  useEffect,
  useRef,
  type SyntheticEvent,
  type MouseEvent,
} from "react";
import {
  Link,
  useLocation,
  useNavigate,
} from "react-router-dom";

interface NavbarProps {
  onSearchSubmit?: (query: string) => void;
}

interface Category {
  id: string;
  name: string;
  isActive?: boolean;
  displayOrder?: number | null;
}

const API_URL = import.meta.env.VITE_API_URL;

export default function Navbar({
  onSearchSubmit,
}: NavbarProps) {
  const [mobileMenu, setMobileMenu] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [categories, setCategories] = useState<Category[]>([]);
  const [categoriesOpen, setCategoriesOpen] = useState(false);
  const [mobileCategoriesOpen, setMobileCategoriesOpen] = useState(false);

  const categoryDropdownRef = useRef<HTMLDivElement>(null);

  const location = useLocation();
  const navigate = useNavigate();

  const isHomePage = location.pathname === "/";

  const closeMenu = () => {
    setMobileMenu(false);
    setMobileCategoriesOpen(false);
    setCategoriesOpen(false);
  };

  // Fetch active categories from the existing API.
  useEffect(() => {
    let cancelled = false;

    const fetchCategories = async () => {
      if (!API_URL) {
        console.error("VITE_API_URL is not configured.");
        return;
      }

      try {
        const response = await fetch(`${API_URL}/categories`);

        if (!response.ok) {
          throw new Error(`Failed to fetch categories: ${response.status}`);
        }

        const result: unknown = await response.json();

        // Supports both an array and a { data: [...] } response.
        let categoryList: Category[] = [];

        if (Array.isArray(result)) {
          categoryList = result as Category[];
        } else if (
          result &&
          typeof result === "object" &&
          "data" in result &&
          Array.isArray((result as { data: unknown }).data)
        ) {
          categoryList = (result as { data: Category[] }).data;
        }

        const activeCategories = categoryList
          .filter(
            (category) =>
              category.isActive !== false &&
              typeof category.id === "string" &&
              typeof category.name === "string"
          )
          .sort((a, b) => {
            const orderA = a.displayOrder ?? Number.MAX_SAFE_INTEGER;
            const orderB = b.displayOrder ?? Number.MAX_SAFE_INTEGER;

            return orderA !== orderB
              ? orderA - orderB
              : a.name.localeCompare(b.name);
          });

        if (!cancelled) {
          setCategories(activeCategories);
        }
      } catch (error) {
        console.error("Failed to load categories:", error);

        if (!cancelled) {
          setCategories([]);
        }
      }
    };

    fetchCategories();

    return () => {
      cancelled = true;
    };
  }, []);

  // Close desktop dropdown when clicking outside.
  useEffect(() => {
    const handleOutsideClick = (event: globalThis.MouseEvent) => {
      if (
        categoryDropdownRef.current &&
        !categoryDropdownRef.current.contains(event.target as Node)
      ) {
        setCategoriesOpen(false);
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setCategoriesOpen(false);
        setMobileCategoriesOpen(false);
      }
    };

    document.addEventListener("mousedown", handleOutsideClick);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
      document.removeEventListener("keydown", handleEscape);
    };
  }, []);

  // Navigate to the homepage and scroll to the top.
  const handleHomeClick = (
    event: MouseEvent<HTMLAnchorElement>
  ) => {
    closeMenu();

    if (isHomePage && !location.hash) {
      event.preventDefault();

      window.scrollTo({
        top: 0,
        behavior: "smooth",
      });
    }
  };

  const handleSearch = (
    event: SyntheticEvent<HTMLFormElement>
  ) => {
    event.preventDefault();

    const query = searchQuery.trim();

    closeMenu();

    if (!query) return;

    if (isHomePage) {
      onSearchSubmit?.(query);

      window.setTimeout(() => {
        document.getElementById("products")?.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
      }, 0);
    } else {
      navigate("/", {
        state: { searchQuery: query },
      });
    }
  };

  const handleCategorySelect = (categoryId: string) => {
    closeMenu();
    navigate(`/category/${encodeURIComponent(categoryId)}`);
  };

  const sectionHref = (section: string) =>
    isHomePage ? `#${section}` : `/#${section}`;

  const linkClass =
    "relative whitespace-nowrap text-sm font-semibold text-[#0F2942] transition-colors duration-200 hover:text-[#008A90]";

  const navigationLinks = [
    { label: "Home", href: "/" },
    { label: "Categories", href: sectionHref("categories") },
    { label: "Products", href: "/#categories" },
    { label: "About Us", href: sectionHref("about") },
    { label: "Blog", href: "/blogs" },
  ];

  return (
    <header className="sticky top-0 z-50 w-full">
      {/* Announcement bar - unchanged */}
      <div className="bg-[#0F2942] px-4 py-2 text-center text-xs font-medium tracking-wide text-white sm:text-sm">
        Make your space feel like home, without the heavy investment.
      </div>

      <nav className="border-b border-slate-200 bg-white/95 shadow-sm backdrop-blur-xl">
        <div className="mx-auto flex min-h-[78px] max-w-[1440px] items-center gap-4 px-4 sm:px-6 lg:px-8">
          {/* Logo - unchanged */}
          <Link
            to="/"
            aria-label="LIVEAZY home"
            onClick={handleHomeClick}
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
            {navigationLinks.map((item) => {
              if (item.label === "Categories") {
                return (
                  <div
                    key={item.label}
                    ref={categoryDropdownRef}
                    className="relative"
                    onMouseEnter={() => setCategoriesOpen(true)}
                    onMouseLeave={() => setCategoriesOpen(false)}
                  >
                    <button
                      type="button"
                      aria-haspopup="true"
                      aria-expanded={categoriesOpen}
                      onClick={() =>
                        setCategoriesOpen((open) => !open)
                      }
                      className={`${linkClass} flex items-center gap-1`}
                    >
                      Categories
                      <ChevronDown
                        size={15}
                        className={`transition-transform duration-200 ${
                          categoriesOpen ? "rotate-180" : ""
                        }`}
                      />
                    </button>

                    {categoriesOpen && (
                      <div className="absolute left-0 top-full z-50 w-64 pt-3">
                        <div className="overflow-hidden rounded-xl border border-slate-100 bg-white py-2 shadow-xl">
                          {categories.length > 0 ? (
                            <div className="max-h-80 overflow-y-auto">
                              {categories.map((category) => (
                                <button
                                  key={category.id}
                                  type="button"
                                  onClick={() =>
                                    handleCategorySelect(category.id)
                                  }
                                  className="flex w-full items-center justify-between px-4 py-3 text-left text-sm font-medium text-[#0F2942] transition-colors hover:bg-[#008A90]/5 hover:text-[#008A90]"
                                >
                                  <span>{category.name}</span>
                                  <ArrowRight
                                    size={15}
                                    className="shrink-0"
                                  />
                                </button>
                              ))}
                            </div>
                          ) : (
                            <p className="px-4 py-3 text-sm text-slate-500">
                              No categories available.
                            </p>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                );
              }

              return item.label === "Home" ? (
                <Link
                  key={item.label}
                  to={item.href}
                  onClick={handleHomeClick}
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
              );
            })}

            {/* Contact page - unchanged */}
            <Link to="/contact" className={linkClass}>
              Contact
            </Link>
          </div>

          {/* Desktop search - unchanged */}
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

          {/* Mobile menu toggle - unchanged */}
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
          <div className="border-t border-slate-100 bg-white px-4 pb-5 pt-4 shadow-lg sm:px-6 lg:hidden">
            <form onSubmit={handleSearch} className="mb-4">
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
              {navigationLinks.map((item) => {
                if (item.label === "Categories") {
                  return (
                    <div key={item.label}>
                      <button
                        type="button"
                        onClick={() =>
                          setMobileCategoriesOpen((open) => !open)
                        }
                        aria-expanded={mobileCategoriesOpen}
                        className="flex w-full items-center justify-between rounded-xl px-4 py-3 text-left text-sm font-semibold text-[#0F2942] transition hover:bg-[#008A90]/5 hover:text-[#008A90]"
                      >
                        Categories
                        <ChevronDown
                          size={17}
                          className={`transition-transform duration-200 ${
                            mobileCategoriesOpen ? "rotate-180" : ""
                          }`}
                        />
                      </button>

                      {mobileCategoriesOpen && (
                        <div className="mb-2 ml-4 border-l-2 border-[#008A90]/20 pl-2">
                          {categories.length > 0 ? (
                            categories.map((category) => (
                              <button
                                key={category.id}
                                type="button"
                                onClick={() =>
                                  handleCategorySelect(category.id)
                                }
                                className="flex w-full items-center justify-between rounded-lg px-4 py-3 text-left text-sm text-[#0F2942] transition hover:bg-[#008A90]/5 hover:text-[#008A90]"
                              >
                                <span>{category.name}</span>
                                <ArrowRight size={15} />
                              </button>
                            ))
                          ) : (
                            <p className="px-4 py-3 text-sm text-slate-500">
                              No categories available.
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  );
                }

                return item.label === "Home" ? (
                  <Link
                    key={item.label}
                    to={item.href}
                    onClick={handleHomeClick}
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
                );
              })}

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
