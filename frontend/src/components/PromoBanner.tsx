
import React, { useEffect, useRef, useState } from "react";
import {
  ArrowRight,
  ArrowUpRight,
  CheckCircle2,
  Sparkles,
} from "lucide-react";

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

  // Track each real promo banner once per component mount.
  // Fallback/demo banners are not stored in the database and must not be counted.
  const trackedImpressions = useRef<Set<string>>(new Set());

  useEffect(() => {
    let cancelled = false;

    const fetchPromoBanners = async () => {
      try {
        if (!API_URL) return;

        const response = await fetch(`${API_URL}/promo-banners?placement=HOMEPAGE_PROMO`);

        if (!response.ok) {
          throw new Error(`Failed to load promo banners: ${response.status}`);
        }

        const data: PromoBannerData[] = await response.json();

        if (cancelled || !Array.isArray(data)) return;

        const activeBanners = data
          .filter((banner) => banner.isActive)
          .sort((a, b) => a.sortOrder - b.sortOrder);

        setBanners(
          activeBanners.length > 0 ? activeBanners : fallbackBanners
        );
      } catch (error) {
        console.error("Error loading promo banners:", error);

        if (!cancelled) {
          setBanners(fallbackBanners);
        }
      }
    };

    void fetchPromoBanners();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!API_URL) return;

    banners.forEach((banner) => {
      if (
        !banner.isActive ||
        !banner.id ||
        banner.id.startsWith("fallback-") ||
        trackedImpressions.current.has(banner.id)
      ) {
        return;
      }

      trackedImpressions.current.add(banner.id);

      void fetch(`${API_URL}/promo-banners/${encodeURIComponent(banner.id)}/impression`, {
        method: "POST",
      }).catch((error) => {
        // Analytics should never break storefront rendering.
        console.error("Failed to record promo banner impression:", error);
      });
    });
  }, [banners]);

  const handleBannerClick = (banner: PromoBannerData) => {
    // Send analytics without waiting, so navigation/CTA behavior stays responsive.
    if (
      API_URL &&
      banner.id &&
      !banner.id.startsWith("fallback-")
    ) {
      void fetch(
        `${API_URL}/promo-banners/${encodeURIComponent(banner.id)}/click`,
        { method: "POST" }
      ).catch((error) => {
        console.error("Failed to record promo banner click:", error);
      });
    }

    const link = banner.buttonLink;

    if (!link || link === "#products") {
      onCtaClick();
      return;
    }

    if (link.startsWith("#")) {
      document
        .getElementById(link.slice(1))
        ?.scrollIntoView({ behavior: "smooth", block: "start" });
      return;
    }

    if (link.startsWith("https://") || link.startsWith("http://")) {
      window.open(link, "_blank", "noopener,noreferrer");
      return;
    }

    if (link.startsWith("tel:")) {
      window.location.href = link;
    }
  };

  return (
    <div className="bg-white">
      {/* Lifestyle feature */}
      <section className="px-5 py-14 sm:px-8 sm:py-20 lg:px-12">
        <div className="mx-auto max-w-[1440px]">
          <div className="grid overflow-hidden rounded-3xl border border-slate-100 bg-[#F5F7FA] lg:grid-cols-12">
            {/* Lifestyle image */}
            <div className="group relative min-h-[280px] overflow-hidden sm:min-h-[380px] lg:col-span-8">
              <img
                src={heroBannerImg}
                alt="Modern living room furnished with rental furniture"
                className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
              />

              <div className="absolute inset-0 bg-gradient-to-t from-[#0F2942]/80 via-[#0F2942]/10 to-transparent" />

              <div className="absolute left-5 top-5 inline-flex items-center gap-2 rounded-full border border-white/25 bg-[#0F2942]/45 px-4 py-2 text-xs font-bold text-white backdrop-blur-md sm:left-7 sm:top-7">
                <Sparkles size={15} className="text-[#FF6A3D]" />
                Live comfortably. Rent smartly.
              </div>

              <div className="absolute bottom-6 left-5 right-5 sm:bottom-8 sm:left-8 sm:right-8">
                <p className="mb-3 text-xs font-bold uppercase tracking-[0.18em] text-[#70E1E4]">
                  YOUR HOME, YOUR WAY
                </p>

                <h3 className="max-w-xl text-3xl font-extrabold leading-tight text-white sm:text-4xl lg:text-5xl">
                  A better home starts with the right furniture.
                </h3>

                <p className="mt-4 max-w-lg text-sm leading-6 text-white/80 sm:text-base">
                  Discover flexible furniture rentals designed around
                  your space, lifestyle and budget.
                </p>

                <button
                  type="button"
                  onClick={onCtaClick}
                  className="mt-6 inline-flex min-h-12 items-center gap-3 rounded-xl bg-white px-5 py-3 text-sm font-bold text-[#0F2942] transition hover:bg-[#70E1E4]"
                >
                  Explore furniture
                  <ArrowRight size={18} />
                </button>
              </div>
            </div>

            {/* Feature panel */}
            <div className="flex flex-col justify-center px-6 py-8 sm:px-9 sm:py-10 lg:col-span-4 lg:px-8">
              <span className="mb-4 inline-flex w-fit items-center gap-2 rounded-full bg-[#E6F5F5] px-3 py-2 text-[10px] font-bold uppercase tracking-[0.15em] text-[#008A90] sm:text-xs">
                <span className="h-2 w-2 rounded-full bg-[#008A90]" />
                Made for modern living
              </span>

              <h3 className="text-2xl font-extrabold leading-tight text-[#0F2942] sm:text-3xl">
                Your space.
                <br />
                Your style.
                <br />
                <span className="text-[#008A90]">Your choice.</span>
              </h3>

              <p className="mt-4 text-sm leading-6 text-slate-500">
                Find the essentials that make your house feel like home.
              </p>

              <div className="mt-7 space-y-4">
                {[
                  "Furniture for everyday living",
                  "Flexible monthly rentals",
                  "Convenient WhatsApp enquiries",
                ].map((item) => (
                  <div key={item} className="flex items-center gap-3">
                    <CheckCircle2
                      size={19}
                      className="shrink-0 text-[#008A90]"
                    />
                    <span className="text-sm font-medium text-[#0F2942]">
                      {item}
                    </span>
                  </div>
                ))}
              </div>

              <button
                type="button"
                onClick={onCtaClick}
                className="mt-8 flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#0F2942] px-5 py-3 text-sm font-bold text-white transition hover:bg-[#008A90]"
              >
                Find your furniture
                <ArrowRight size={17} />
              </button>

              <div className="mt-6 flex items-center gap-3 border-t border-slate-200 pt-5">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white">
                  <img
                    src={table2Img}
                    alt="Storage furniture"
                    className="h-10 w-10 object-contain"
                  />
                </div>
                <div>
                  <p className="text-xs font-bold text-[#0F2942]">
                    Furniture for every corner
                  </p>
                  <p className="mt-1 text-xs text-slate-500">
                    Explore the collection
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Admin-managed promotional banners */}
      {banners.length > 0 && (
        <section className="px-5 pb-16 sm:px-8 sm:pb-20 lg:px-12">
          <div className="mx-auto max-w-[1440px]">
            <div className="mb-7">
              <p className="mb-2 text-xs font-bold uppercase tracking-[0.16em] text-[#008A90]">
                A little inspiration
              </p>
              <h3 className="text-2xl font-extrabold tracking-tight text-[#0F2942] sm:text-3xl">
                More ways to love your space.
              </h3>
            </div>

            <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
              {banners.map((banner) => (
                <article
                  key={banner.id}
                  className="group relative flex min-h-[250px] items-center overflow-hidden rounded-3xl bg-[#0F2942] p-6 sm:min-h-[280px] sm:p-9"
                >
                  <img
                    src={banner.image || sofaImg}
                    alt={banner.heading}
                    onError={(event) => {
                      event.currentTarget.onerror = null;
                      event.currentTarget.src = sofaImg;
                    }}
                    className="absolute inset-0 h-full w-full object-cover opacity-35 transition-transform duration-700 group-hover:scale-105"
                  />

                  <div className="absolute inset-0 bg-gradient-to-r from-[#0F2942]/95 via-[#0F2942]/75 to-[#008A90]/30" />

                  <div className="relative z-10 max-w-lg">
                    <p className="mb-3 text-[10px] font-bold uppercase tracking-[0.18em] text-[#70E1E4] sm:text-xs">
                      {banner.label}
                    </p>

                    <h4 className="text-2xl font-extrabold leading-tight text-white sm:text-3xl">
                      {banner.heading}
                    </h4>

                    <p className="mt-3 max-w-md text-sm leading-6 text-white/80">
                      {banner.subtitle}
                    </p>

                    <button
                      type="button"
                      onClick={() => handleBannerClick(banner)}
                      className="mt-6 inline-flex min-h-11 items-center gap-3 rounded-xl border border-white/25 bg-white/10 px-4 py-3 text-xs font-bold text-white backdrop-blur-sm transition hover:border-white hover:bg-white hover:text-[#0F2942] sm:text-sm"
                    >
                      {banner.buttonText}
                      <ArrowUpRight size={17} />
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
