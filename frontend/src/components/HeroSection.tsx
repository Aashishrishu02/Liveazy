import React, { useEffect, useState, useRef, useCallback } from "react";
import { ChevronLeft, ChevronRight, ArrowRight } from "lucide-react";
import { getApiBaseUrl, fetchJsonDeduplicated } from "../utils/api";

interface HeroSectionProps {
  onSearchSubmit?: (query: string, category?: string, city?: string) => void;
  selectedCity?: string;
  onExploreClick?: () => void;
}

interface BannerItem {
  id: string;
  image: string;
  heading?: string;
  subtitle?: string;
  topLabel?: string;
  button1Text?: string;
  button1Link?: string;
  button2Text?: string;
  button2Link?: string;
  isActive?: boolean;
  sortOrder?: number;
}

export const HeroSection: React.FC<HeroSectionProps> = ({
  onExploreClick,
}) => {
  const [banners, setBanners] = useState<BannerItem[]>([]);
  const [activeIndex, setActiveIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [loading, setLoading] = useState(true);
  const impressionTracked = useRef<Set<string>>(new Set());

  useEffect(() => {
    let cancelled = false;
    const apiBase = getApiBaseUrl();

    async function loadBanners() {
      try {
        setLoading(true);
        // Try public active banners endpoint first
        let result: unknown;
        try {
          result = await fetchJsonDeduplicated<unknown>(`${apiBase}/banners/public`);
        } catch {
          result = await fetchJsonDeduplicated<unknown>(`${apiBase}/banners`);
        }

        let list: unknown[] = [];
        if (Array.isArray(result)) {
          list = result;
        } else if (result && typeof result === "object" && "data" in result && Array.isArray((result as { data: unknown }).data)) {
          list = (result as { data: unknown[] }).data;
        }

        const validBanners: BannerItem[] = list
          .filter((b): b is Record<string, unknown> => typeof b === "object" && b !== null)
          .filter((b) => b.isActive !== false)
          .map((b) => {
            const image = String(
              b.image ||
              (Array.isArray(b.images) && b.images[0]
                ? typeof b.images[0] === "string"
                  ? b.images[0]
                  : (b.images[0] as { imageUrl?: string }).imageUrl
                : "") ||
              ""
            );
            return {
              id: String(b.id || ""),
              image,
              heading: typeof b.heading === "string" ? b.heading : undefined,
              subtitle: typeof b.subtitle === "string" ? b.subtitle : undefined,
              topLabel: typeof b.topLabel === "string" ? b.topLabel : undefined,
              button1Text: typeof b.button1Text === "string" ? b.button1Text : undefined,
              button1Link: typeof b.button1Link === "string" ? b.button1Link : "#trending",
              button2Text: typeof b.button2Text === "string" ? b.button2Text : undefined,
              button2Link: typeof b.button2Link === "string" ? b.button2Link : undefined,
              sortOrder: typeof b.sortOrder === "number" ? b.sortOrder : 0,
            };
          })
          .filter((b) => b.image.length > 0)
          .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));

        if (!cancelled) {
          setBanners(validBanners);
          setActiveIndex(0);
        }
      } catch (e) {
        console.warn("Failed to load backend banners:", e);
        if (!cancelled) {
          setBanners([]);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void loadBanners();
    return () => {
      cancelled = true;
    };
  }, []);

  // Impression tracking
  const currentBanner = banners[activeIndex];
  useEffect(() => {
    if (!currentBanner || !currentBanner.id || impressionTracked.current.has(currentBanner.id)) return;
    impressionTracked.current.add(currentBanner.id);

    const apiBase = getApiBaseUrl();
    void fetch(`${apiBase}/banners/${currentBanner.id}/impression`, {
      method: "POST",
    }).catch(() => {});
  }, [currentBanner]);

  const handleNext = useCallback(() => {
    setActiveIndex((prev) => (banners.length > 0 ? (prev + 1) % banners.length : 0));
  }, [banners.length]);

  const handlePrev = useCallback(() => {
    setActiveIndex((prev) => (banners.length > 0 ? (prev - 1 + banners.length) % banners.length : 0));
  }, [banners.length]);

  // Autoplay - exactly 2000ms (2 seconds), resets cleanly when slide changes
  useEffect(() => {
    if (isPaused || banners.length <= 1) return;
    const interval = setInterval(handleNext, 2000);
    return () => clearInterval(interval);
  }, [isPaused, banners.length, handleNext, activeIndex]);

  const handleBannerClick = (banner: BannerItem) => {
    const apiBase = getApiBaseUrl();
    if (banner.id) {
      void fetch(`${apiBase}/banners/${banner.id}/click`, {
        method: "POST",
      }).catch(() => {});
    }

    if (banner.button1Link?.startsWith("#")) {
      const target = document.querySelector(banner.button1Link);
      target?.scrollIntoView({ behavior: "smooth" });
    } else if (banner.button1Link) {
      window.location.href = banner.button1Link;
    } else if (onExploreClick) {
      onExploreClick();
    }
  };

  // Never render demo banners when database has no active banners!
  if (!loading && banners.length === 0) {
    return (
      <section aria-label="Welcome" className="py-3 sm:py-5">
        <div className="ref-container">
          <div className="rounded-2xl bg-gradient-to-r from-[#002B62] to-[#007C8A] p-8 sm:p-12 text-white shadow-md flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="max-w-xl">
              <span className="rounded-full bg-white/20 px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-[#00C2CB]">
                NO INVESTMENT, JUST COMFORT
              </span>
              <h2 className="mt-3 text-2xl sm:text-4xl font-extrabold leading-tight">
                Furnish Your Home in Just 2 Days.
              </h2>
              <p className="mt-2 text-xs sm:text-sm text-[#E1ECF2] leading-relaxed">
                Delivery, Setup &amp; Support — All Included. Enjoy comfortable living with affordable furniture rentals.
              </p>
            </div>
            <button
              type="button"
              onClick={onExploreClick}
              className="rounded-xl bg-[#00A8B5] px-6 py-3 text-sm font-bold text-white transition hover:bg-[#0095A6] shadow-md flex items-center gap-2"
            >
              <span>Explore Collection</span>
              <ArrowRight size={16} />
            </button>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section
      aria-label="Featured Offers"
      className="py-3 sm:py-5"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      <div className="ref-container">
        <div className="relative overflow-hidden rounded-xl sm:rounded-2xl shadow-md bg-[#F4F8FA] aspect-[16/8] sm:aspect-[1920/600]">
          {/* Banner Slides */}
          <div
            className="flex h-full w-full transition-transform duration-500 ease-in-out"
            style={{ transform: `translateX(-${activeIndex * 100}%)` }}
          >
            {banners.map((b, i) => (
              <div
                key={b.id || i}
                onClick={() => handleBannerClick(b)}
                className="relative h-full w-full shrink-0 cursor-pointer"
              >
                <img
                  src={b.image}
                  alt={b.heading || "LIVEAZY furniture rental banner"}
                  className="h-full w-full object-cover"
                  loading={i === 0 ? "eager" : "lazy"}
                />
              </div>
            ))}
          </div>

          {/* Navigation Arrows */}
          {banners.length > 1 && (
            <>
              <button
                type="button"
                onClick={handlePrev}
                aria-label="Previous Slide"
                className="absolute left-3 sm:left-5 top-1/2 -translate-y-1/2 flex h-9 w-9 sm:h-11 sm:w-11 items-center justify-center rounded-full bg-white/85 text-gray-800 shadow-md backdrop-blur-xs transition hover:bg-white hover:text-[#007C8A] hover:scale-110"
              >
                <ChevronLeft size={22} className="stroke-[2.5]" />
              </button>
              <button
                type="button"
                onClick={handleNext}
                aria-label="Next Slide"
                className="absolute right-3 sm:right-5 top-1/2 -translate-y-1/2 flex h-9 w-9 sm:h-11 sm:w-11 items-center justify-center rounded-full bg-white/85 text-gray-800 shadow-md backdrop-blur-xs transition hover:bg-white hover:text-[#007C8A] hover:scale-110"
              >
                <ChevronRight size={22} className="stroke-[2.5]" />
              </button>
            </>
          )}

          {/* Indicator Dots */}
          {banners.length > 1 && (
            <div className="absolute bottom-3 sm:bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-2 z-10">
              {banners.map((_, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setActiveIndex(i)}
                  aria-label={`Go to slide ${i + 1}`}
                  className={`h-2.5 rounded-full transition-all duration-300 ${
                    i === activeIndex
                      ? "w-7 bg-[#007C8A]"
                      : "w-2.5 bg-white/70 hover:bg-white"
                  }`}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
