import React, { useEffect, useState } from "react";
import heroBannerImg from "../assets/hero-banner.jpeg";
import table2Img from "../assets/products/table2.jpeg";
import sofaImg from "../assets/products/sofa.jpeg";
import dinnerTableImg from "../assets/products/dinner-table.jpeg";

const API_URL = import.meta.env.VITE_API_URL;

interface PromoBannerData {
  id: string;
  image: string;
  label: string;
  heading: string;
  subtitle: string;
  buttonText: string;
  buttonLink: string;
  isActive: boolean;
  sortOrder: number;
}

interface PromoBannerProps {
  onCtaClick: () => void;
}

// Default banners shown when no active admin banners are available.
const fallbackBanners: PromoBannerData[] = [
  {
    id: "fallback-1",
    image: sofaImg,
    label: "FURNITURE FOR EVERY HOME",
    heading: "Make Your Space Feel Like Home",
    subtitle: "Premium furniture rentals for modern living.",
    buttonText: "EXPLORE COLLECTION",
    buttonLink: "#products",
    isActive: true,
    sortOrder: 0,
  },
  {
    id: "fallback-2",
    image: dinnerTableImg,
    label: "FLEXIBLE RENTALS",
    heading: "Style Your Home for Less",
    subtitle: "Furniture that fits your lifestyle and budget.",
    buttonText: "VIEW PRODUCTS",
    buttonLink: "#products",
    isActive: true,
    sortOrder: 1,
  },
];

const PromoBanner: React.FC<PromoBannerProps> = ({ onCtaClick }) => {
  const [banners, setBanners] =
    useState<PromoBannerData[]>(fallbackBanners);

  useEffect(() => {
    let cancelled = false;

    const fetchPromoBanners = async () => {
      try {
        if (!API_URL) {
          console.warn(
            "VITE_API_URL is not configured. Showing default promo banners."
          );
          return;
        }

        const response = await fetch(`${API_URL}/promo-banners`);

        if (!response.ok) {
          throw new Error(
            `Failed to load promo banners: ${response.status}`
          );
        }

        const data: PromoBannerData[] = await response.json();

        if (cancelled || !Array.isArray(data)) {
          return;
        }

        // Sort and display active banners from the admin panel.
        const activeBanners = data
          .filter((banner) => banner.isActive)
          .sort((a, b) => a.sortOrder - b.sortOrder);

        // IMPORTANT:
        // If there are no active banners, restore the old default banners.
        setBanners(
          activeBanners.length > 0
            ? activeBanners
            : fallbackBanners
        );
      } catch (error) {
        console.error(
          "Error loading promo banners. Showing default banners:",
          error
        );

        // Keep the default banners visible if the API fails.
        if (!cancelled) {
          setBanners(fallbackBanners);
        }
      }
    };

    fetchPromoBanners();

    return () => {
      cancelled = true;
    };
  }, []);

  const handleBannerClick = (link: string) => {
    if (!link || link === "#products") {
      onCtaClick();
      return;
    }

    if (link.startsWith("#")) {
      document
        .getElementById(link.slice(1))
        ?.scrollIntoView({ behavior: "smooth" });
      return;
    }

    if (
      link.startsWith("https://") ||
      link.startsWith("http://")
    ) {
      window.open(link, "_blank", "noopener,noreferrer");
      return;
    }

    if (link.startsWith("tel:")) {
      window.location.href = link;
    }
  };

  return (
    <div className="space-y-6">
      {/* LIVEAZY Lifestyle Hero Section */}
      <section className="bg-[#F5F8FA] py-8 sm:py-10">
        <div className="mx-auto max-w-7xl px-4">
          <div className="grid grid-cols-1 items-center gap-6 rounded-2xl border border-[#E2EBF0] bg-white p-4 shadow-sm sm:p-6 lg:grid-cols-12">
            {/* Hero Image */}
            <div className="group relative overflow-hidden rounded-xl lg:col-span-8">
              <img
                src={heroBannerImg}
                alt="Modern living room with premium rental furniture"
                className="h-64 w-full rounded-xl object-cover transition duration-500 group-hover:scale-105 sm:h-80"
              />

              <div className="absolute inset-0 bg-gradient-to-t from-[#0B2545]/50 via-transparent to-transparent" />

              <div className="absolute bottom-4 left-4 right-4 flex items-center gap-2 rounded-lg border border-white/50 bg-white/95 px-3 py-3 shadow-lg sm:bottom-5 sm:left-5 sm:right-auto sm:px-4">
                <span className="h-2.5 w-2.5 shrink-0 rounded-full bg-[#0795A3]" />

                <span className="text-xs font-bold text-[#123B63] sm:text-sm">
                  Premium Furniture. Flexible Rentals.
                </span>
              </div>
            </div>

            {/* Popular Product */}
            <div className="px-2 py-3 text-center sm:px-4 lg:col-span-4">
              <span className="mb-2 inline-flex items-center gap-2 rounded-full bg-[#E7F6F6] px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.18em] text-[#07838E]">
                <span className="h-1.5 w-1.5 rounded-full bg-[#0795A3]" />
                Customer Favourite
              </span>

              <h3 className="mx-auto mb-5 max-w-xs text-sm leading-6 text-[#64748B]">
                Thoughtfully selected furniture to make your house feel
                like home.
              </h3>

              <button
                type="button"
                onClick={onCtaClick}
                className="mx-auto block w-full max-w-xs rounded-xl border border-[#E2EBF0] bg-[#F8FAFC] p-4 transition duration-300 hover:-translate-y-1 hover:border-[#0795A3] hover:shadow-md"
              >
                <div className="mb-3 flex h-40 items-center justify-center overflow-hidden rounded-lg bg-white sm:h-44">
                  <img
                    src={table2Img}
                    alt="Modern shoe rack cabinet available for rent"
                    className="h-full w-full object-contain p-2 transition duration-300 hover:scale-105"
                  />
                </div>

                <h4 className="text-sm font-bold uppercase tracking-wide text-[#123B63]">
                  Shoe Rack / Cabinet
                </h4>

                <p className="mt-1 text-xs text-[#64748B]">
                  Smart Storage Solutions
                </p>

                <div className="mt-3 flex items-center justify-center gap-1">
                  <span className="text-lg font-extrabold text-[#0795A3]">
                    ₹400
                  </span>

                  <span className="text-xs text-[#64748B]">
                    / month
                  </span>
                </div>

                <span className="mt-3 inline-flex items-center justify-center gap-2 rounded-lg bg-[#123B63] px-4 py-2.5 text-xs font-semibold text-white transition hover:bg-[#0795A3]">
                  Explore Furniture
                  <span aria-hidden="true">→</span>
                </span>
              </button>

              <div className="mt-4 flex justify-center gap-2">
                <span className="h-2 w-6 rounded-full bg-[#0795A3]" />
                <span className="h-2 w-2 rounded-full bg-[#CBD5E1]" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Dynamic Promo Cards with Default Fallback */}
      {banners.length > 0 && (
        <section className="bg-white py-6">
          <div className="mx-auto max-w-7xl px-4">
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              {banners.map((banner) => (
                <article
                  key={banner.id}
                  className="group relative flex min-h-48 items-center overflow-hidden rounded-xl bg-[#123B63] p-6 sm:p-8"
                >
                  <img
                    src={banner.image || sofaImg}
                    alt={banner.heading}
                    onError={(event) => {
                      event.currentTarget.onerror = null;
                      event.currentTarget.src = sofaImg;
                    }}
                    className="absolute inset-0 h-full w-full object-cover opacity-30 transition duration-500 group-hover:scale-105"
                  />

                  <div className="absolute inset-0 bg-gradient-to-r from-[#0B2545]/95 via-[#123B63]/75 to-[#0795A3]/30" />

                  <div className="relative z-10 max-w-lg space-y-2 text-white">
                    <span className="block text-[10px] font-bold uppercase tracking-[0.18em] text-[#70E1E4]">
                      {banner.label}
                    </span>

                    <h4 className="text-lg font-extrabold sm:text-xl">
                      {banner.heading}
                    </h4>

                    <p className="text-xs leading-5 text-gray-100 sm:text-sm">
                      {banner.subtitle}
                    </p>

                    <button
                      type="button"
                      onClick={() =>
                        handleBannerClick(banner.buttonLink)
                      }
                      className="inline-flex items-center gap-2 pt-2 text-xs font-bold uppercase tracking-wider text-white underline decoration-[#70E1E4] underline-offset-4 transition hover:text-[#70E1E4]"
                    >
                      {banner.buttonText}
                      <span aria-hidden="true">→</span>
                    </button>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>
      )}
    </div>
  );
};

export default PromoBanner;