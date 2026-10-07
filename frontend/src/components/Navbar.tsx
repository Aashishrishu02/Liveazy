import { Search, Menu, X } from "lucide-react";
import { useState } from "react";

export default function Navbar() {
  const [mobileMenu, setMobileMenu] = useState(false);

  return (
    <nav className="w-full bg-white sticky top-0 z-50 border-b border-[#D8EEF0]">

      {/* Main Container */}
      <div className="w-full px-4 sm:px-6 lg:px-8">

        {/*  MAIN NAVBAR  */}
        <div className="min-h-20 flex items-center">

          {/* LOGO  */}
          <a
            href="/"
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
              alt="LIVEZY Furniture Rental"
              className="
                w-full
                h-full
                object-cover
                object-[center_55%]
              "
            />
          </a>

          {/* DESKTOP NAVIGATION  */}
          <div
            className="
              hidden
              lg:flex
              items-center
              ml-auto
              gap-7
              xl:gap-9
            "
          >

            <a
              href="/"
              className="
                relative
                text-[15px]
                font-semibold
                text-[#123B63]
                hover:text-[#0795A3]
                transition-colors
                whitespace-nowrap
                after:absolute
                after:left-0
                after:-bottom-2
                after:w-0
                after:h-[2px]
                after:bg-[#0795A3]
                hover:after:w-full
                after:transition-all
              "
            >
              Home
            </a>

            <a
              href="/categories"
              className="
                relative
                text-[15px]
                font-semibold
                text-[#123B63]
                hover:text-[#0795A3]
                transition-colors
                whitespace-nowrap
                after:absolute
                after:left-0
                after:-bottom-2
                after:w-0
                after:h-[2px]
                after:bg-[#0795A3]
                hover:after:w-full
                after:transition-all
              "
            >
              Categories
            </a>

            <a
              href="/products"
              className="
                relative
                text-[15px]
                font-semibold
                text-[#123B63]
                hover:text-[#0795A3]
                transition-colors
                whitespace-nowrap
                after:absolute
                after:left-0
                after:-bottom-2
                after:w-0
                after:h-[2px]
                after:bg-[#0795A3]
                hover:after:w-full
                after:transition-all
              "
            >
              Products
            </a>

            <a
              href="/about"
              className="
                relative
                text-[15px]
                font-semibold
                text-[#123B63]
                hover:text-[#0795A3]
                transition-colors
                whitespace-nowrap
                after:absolute
                after:left-0
                after:-bottom-2
                after:w-0
                after:h-[2px]
                after:bg-[#0795A3]
                hover:after:w-full
                after:transition-all
              "
            >
              About Us
            </a>

            <a
              href="/contact"
              className="
                relative
                text-[15px]
                font-semibold
                text-[#123B63]
                hover:text-[#0795A3]
                transition-colors
                whitespace-nowrap
                after:absolute
                after:left-0
                after:-bottom-2
                after:w-0
                after:h-[2px]
                after:bg-[#0795A3]
                hover:after:w-full
                after:transition-all
              "
            >
              Contact
            </a>

          </div>

          {/*  SEARCH  */}
          <div className="hidden lg:block ml-8 xl:ml-10">

            <div className="relative w-[220px] xl:w-[270px]">

              <Search
                size={19}
                className="
                  absolute
                  left-3
                  top-1/2
                  -translate-y-1/2
                  text-[#0795A3]
                "
              />

              <input
                type="text"
                placeholder="Search furniture..."
                className="
                  w-full
                  h-11
                  pl-10
                  pr-4
                  text-sm
                  text-[#123B63]
                  bg-[#F5FAFA]
                  border
                  border-[#CDE7EA]
                  rounded-xl
                  outline-none
                  placeholder:text-gray-400
                  focus:border-[#0795A3]
                  focus:ring-2
                  focus:ring-[#0795A3]/10
                  transition
                "
              />

            </div>

          </div>

          {/*MOBILE BUTTON  */}
          <button
            type="button"
            onClick={() => setMobileMenu(!mobileMenu)}
            className="
              lg:hidden
              ml-auto
              w-10
              h-10
              flex
              items-center
              justify-center
              rounded-lg
              text-[#123B63]
              hover:bg-[#F0FAFA]
              hover:text-[#0795A3]
              transition
            "
            aria-label="Toggle menu"
          >
            {mobileMenu ? (
              <X size={26} />
            ) : (
              <Menu size={26} />
            )}
          </button>

        </div>

        {/* MOBILE MENU  */}
        {mobileMenu && (
          <div className="lg:hidden border-t border-[#D8EEF0] py-5">

            <div className="flex flex-col gap-2">

              <a
                href="/"
                onClick={() => setMobileMenu(false)}
                className="
                  px-3
                  py-3
                  rounded-lg
                  text-[15px]
                  font-semibold
                  text-[#123B63]
                  hover:text-[#0795A3]
                  hover:bg-[#F0FAFA]
                  transition
                "
              >
                Home
              </a>

              <a
                href="/categories"
                onClick={() => setMobileMenu(false)}
                className="
                  px-3
                  py-3
                  rounded-lg
                  text-[15px]
                  font-semibold
                  text-[#123B63]
                  hover:text-[#0795A3]
                  hover:bg-[#F0FAFA]
                  transition
                "
              >
                Categories
              </a>

              <a
                href="/products"
                onClick={() => setMobileMenu(false)}
                className="
                  px-3
                  py-3
                  rounded-lg
                  text-[15px]
                  font-semibold
                  text-[#123B63]
                  hover:text-[#0795A3]
                  hover:bg-[#F0FAFA]
                  transition
                "
              >
                Products
              </a>

              <a
                href="/about"
                onClick={() => setMobileMenu(false)}
                className="
                  px-3
                  py-3
                  rounded-lg
                  text-[15px]
                  font-semibold
                  text-[#123B63]
                  hover:text-[#0795A3]
                  hover:bg-[#F0FAFA]
                  transition
                "
              >
                About Us
              </a>

              <a
                href="/contact"
                onClick={() => setMobileMenu(false)}
                className="
                  px-3
                  py-3
                  rounded-lg
                  text-[15px]
                  font-semibold
                  text-[#123B63]
                  hover:text-[#0795A3]
                  hover:bg-[#F0FAFA]
                  transition
                "
              >
                Contact
              </a>

              {/* Mobile Search */}
              <div className="relative mt-3">

                <Search
                  size={19}
                  className="
                    absolute
                    left-3
                    top-1/2
                    -translate-y-1/2
                    text-[#0795A3]
                  "
                />

                <input
                  type="text"
                  placeholder="Search furniture..."
                  className="
                    w-full
                    h-11
                    pl-10
                    pr-4
                    text-sm
                    text-[#123B63]
                    bg-[#F5FAFA]
                    border
                    border-[#CDE7EA]
                    rounded-xl
                    outline-none
                    placeholder:text-gray-400
                    focus:border-[#0795A3]
                    focus:ring-2
                    focus:ring-[#0795A3]/10
                  "
                />

              </div>

            </div>

          </div>
        )}

      </div>
    </nav>
  );
}