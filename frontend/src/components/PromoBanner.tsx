import React, { useEffect, useRef, useState } from "react";
import { ArrowRight, Sparkles } from "lucide-react";
import { getApiBaseUrl, fetchJsonDeduplicated } from "../utils/api";

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
  onCtaClick?: () => void;
}

export const PromoBanner: React.FC<PromoBannerProps> = ({ onCtaClick }) => {
  const [banners, setBanners] = useState<PromoBannerData[]>([]);
  const [loading, setLoading] = useState(true);
  const impressionTracked = useRef<Set<string>>(new Set());

  useEffect(() => {
    let cancelled = false;
    const apiBase = getApiBaseUrl();

    async function loadPromos() {
      try {
        setLoading(true);
        const res = await fetchJsonDeduplicated<unknown>(`${apiBase}/promo-banners`);
        let list: PromoBannerData[] = [];
        if (Array.isArray(res)) {
          list = res as PromoBannerData[];
        } else if (res && typeof res === "object" && "data" in res && Array.isArray((res as { data: unknown }).data)) {
          list = (res as { data: PromoBannerData[] }).data;
        }

        if (!cancelled) {
          const active = list
            .filter((b) => b.isActive !== false)
            .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));
          setBanners(active);
        }
      } catch (e) {
        console.warn("Could not load promo banners from backend:", e);
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void loadPromos();
    return () => {
      cancelled = true;
    };
  }, []);

  // Track impressions
  const currentBanner = banners[0];
  useEffect(() => {
    if (!currentBanner || !currentBanner.id || impressionTracked.current.has(currentBanner.id)) return;
    impressionTracked.current.add(currentBanner.id);

    const apiBase = getApiBaseUrl();
    void fetch(`${apiBase}/promo-banners/${currentBanner.id}/impression`, {
      method: "POST",
    }).catch(() => {});
  }, [currentBanner]);

  if (loading || banners.length === 0) {
    return null;
  }

  const banner = banners[0];

  const handleCta = () => {
    const apiBase = getApiBaseUrl();
    if (banner.id) {
      void fetch(`${apiBase}/promo-banners/${banner.id}/click`, {
        method: "POST",
      }).catch(() => {});
    }

    if (banner.buttonLink?.startsWith("#")) {
      const el = document.querySelector(banner.buttonLink);
      el?.scrollIntoView({ behavior: "smooth" });
    } else if (banner.buttonLink) {
      window.location.href = banner.buttonLink;
    } else if (onCtaClick) {
      onCtaClick();
    }
  };

  return (
    <section aria-label="Promotional Showcase" className="py-8 sm:py-12">
      <div className="ref-container">
        <div className="relative overflow-hidden rounded-2xl sm:rounded-3xl bg-gradient-to-r from-[#1c1836] via-[#2d2358] to-[#3a27a0] p-6 sm:p-10 md:p-12 text-white shadow-xl flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="max-w-xl z-10">
            {banner.label && (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-[#fb923c]/20 px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-[#fb923c] mb-3">
                <Sparkles size={13} />
                {banner.label}
              </span>
            )}

            <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold leading-tight text-white">
              {banner.heading || "Make Your Space Feel Like Home"}
            </h2>

            <p className="mt-3 text-xs sm:text-sm text-[#c4bcdc] leading-relaxed">
              {banner.subtitle ||
                "Enjoy complete freedom and comfort with our flexible monthly furniture rentals."}
            </p>

            <button
              type="button"
              onClick={handleCta}
              className="mt-6 inline-flex items-center gap-2 rounded-xl bg-[#ff6b35] px-5 py-3 text-xs sm:text-sm font-bold text-white shadow-md transition hover:bg-[#e5531d] hover:scale-105 active:scale-95"
            >
              <span>{banner.buttonText || "Explore Collection"}</span>
              <ArrowRight size={16} />
            </button>
          </div>

          {banner.image && (
            <div className="relative w-full md:w-1/2 aspect-[16/10] overflow-hidden rounded-2xl shadow-lg border border-white/10 z-10">
              <img
                src={banner.image}
                alt={banner.heading}
                className="h-full w-full object-cover"
                loading="lazy"
              />
            </div>
          )}

          {/* Background decorative glows */}
          <div className="absolute -right-20 -bottom-20 h-64 w-64 rounded-full bg-[#4a36b3]/30 blur-3xl pointer-events-none" />
          <div className="absolute -left-20 -top-20 h-64 w-64 rounded-full bg-[#ff6b35]/20 blur-3xl pointer-events-none" />
        </div>
      </div>
    </section>
  );
};

export default PromoBanner;
