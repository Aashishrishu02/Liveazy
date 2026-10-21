
import React, { useEffect, useRef, useState } from "react";
import { ArrowRight, PhoneCall, Sparkles } from "lucide-react";
import heroImg from "../assets/hero-banner.jpeg";

interface HeroSectionProps {
  onSearchSubmit?: (
    query: string,
    category?: string,
    city?: string
  ) => void;
  selectedCity?: string;
  onExploreClick?: () => void;
}

interface BannerData {
  id?: string;
  image?: string;
  topLabel?: string;
  heading?: string;
  subtitle?: string;
  button1Text?: string;
  button1Link?: string;
  button2Text?: string;
  button2Link?: string;
  isActive?: boolean;
}

const defaultBanner = {
  topLabel: "NO INVESTMENT, JUST COMFORT",
  heading: "Furnish Your Home in Just 2 Days.",
  subtitle:
    "Delivery, Setup & Support — All Included. Enjoy comfortable living with affordable furniture rentals across Pune & PCMC.",
  button1Text: "VIEW CATEGORIES",
  button1Link: "#categories",
  button2Text: "CALL HOTLINE",
  button2Link: "tel:+919423838109",
};

export const HeroSection: React.FC<HeroSectionProps> = ({
  onExploreClick,
}) => {
  const API_URL = import.meta.env.VITE_API_URL;

  const [bannerImage, setBannerImage] = useState(heroImg);
  const [bannerText, setBannerText] = useState(defaultBanner);
  const [bannerId, setBannerId] = useState<string | null>(null);
  const [isBannerLoading, setIsBannerLoading] = useState(true);

  // Prevent duplicate impression requests for the same banner
  // during this component's current mounted session.
  const trackedImpressions = useRef<Set<string>>(new Set());

  useEffect(() => {
    let cancelled = false;

    async function fetchBanner() {
      try {
        const response = await fetch(`${API_URL}/banners`);

        if (!response.ok) {
          throw new Error("Failed to fetch banner");
        }

        const banner: BannerData | null = await response.json();

        if (cancelled) return;

        if (banner) {
          setBannerId(banner.id || null);
          setBannerImage(banner.image || heroImg);

          setBannerText({
            topLabel: banner.topLabel || defaultBanner.topLabel,
            heading: banner.heading || defaultBanner.heading,
            subtitle: banner.subtitle || defaultBanner.subtitle,
            button1Text:
              banner.button1Text || defaultBanner.button1Text,
            button1Link:
              banner.button1Link || defaultBanner.button1Link,
            button2Text:
              banner.button2Text || defaultBanner.button2Text,
            button2Link:
              banner.button2Link || defaultBanner.button2Link,
          });
        } else {
          setBannerId(null);
          setBannerImage(heroImg);
          setBannerText(defaultBanner);
        }
      } catch (error) {
        if (!cancelled) {
          console.error("Failed to fetch banner:", error);
          setBannerId(null);
          setBannerImage(heroImg);
          setBannerText(defaultBanner);
        }
      } finally {
        if (!cancelled) {
          setIsBannerLoading(false);
        }
      }
    }

    void fetchBanner();

    return () => {
      cancelled = true;
    };
  }, [API_URL]);

  // Record an impression for the saved normal banner.
  useEffect(() => {
    if (!bannerId || !API_URL) return;

    if (trackedImpressions.current.has(bannerId)) return;

    trackedImpressions.current.add(bannerId);

    void fetch(`${API_URL}/banners/${bannerId}/impression`, {
      method: "POST",
    }).catch((error) => {
      trackedImpressions.current.delete(bannerId);
      console.error("Failed to record banner impression:", error);
    });
  }, [bannerId, API_URL]);

  // Record clicks without blocking the existing button navigation.
  const trackBannerClick = () => {
    if (!bannerId || !API_URL) return;

    void fetch(`${API_URL}/banners/${bannerId}/click`, {
      method: "POST",
    }).catch((error) => {
      console.error("Failed to record banner click:", error);
    });
  };

  const handlePrimaryClick = (
    event: React.MouseEvent<HTMLAnchorElement>
  ) => {
    trackBannerClick();

    if (bannerText.button1Link === "#categories") {
      event.preventDefault();
      onExploreClick?.();
    }
  };

  // Keep the hero area stable while the saved banner is loading.
  if (isBannerLoading) {
    return (
      <section
        id="hero"
        aria-label="Loading banner"
        className="min-h-[500px] animate-pulse bg-[#0F2942] sm:min-h-[540px] lg:min-h-[590px]"
      />
    );
  }

  return (
    <section
      id="hero"
      className="relative isolate overflow-hidden bg-[#0F2942]"
    >
      {/* Background image */}
      <div className="absolute inset-0">
        <img
          src={bannerImage}
          alt="Furniture rental for comfortable living"
          className="h-full w-full object-cover object-center"
          fetchPriority="high"
          onError={() => {
            setBannerImage((currentImage) =>
              currentImage === heroImg ? currentImage : heroImg
            );
          }}
        />

        <div className="absolute inset-0 bg-gradient-to-r from-[#071827]/95 via-[#0F2942]/80 to-[#0F2942]/25" />

        <div className="absolute inset-0 bg-gradient-to-t from-[#071827]/45 via-transparent to-transparent" />
      </div>

      {/* Decorative accent */}
      <div className="pointer-events-none absolute -right-24 top-10 h-72 w-72 rounded-full border border-white/10 sm:h-96 sm:w-96" />
      <div className="pointer-events-none absolute -right-12 top-24 h-56 w-56 rounded-full border border-white/10 sm:h-72 sm:w-72" />

      <div className="relative mx-auto flex min-h-[500px] max-w-[1440px] items-center px-5 py-16 sm:min-h-[540px] sm:px-8 sm:py-20 lg:min-h-[590px] lg:px-12">
        <div className="max-w-3xl">
          {/* Eyebrow label */}
          <div className="mb-7 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-2 text-xs font-bold tracking-[0.14em] text-white backdrop-blur-md sm:text-sm">
            <Sparkles size={15} className="text-[#FF6A3D]" />
            <span>{bannerText.topLabel}</span>
          </div>

          {/* Main heading */}
          <h1 className="max-w-3xl text-4xl font-extrabold leading-[1.12] tracking-tight text-white sm:text-5xl md:text-6xl lg:text-7xl">
            {bannerText.heading}
          </h1>

          {/* Description */}
          <p className="mt-6 max-w-2xl text-base leading-7 text-white/80 sm:text-lg sm:leading-8">
            {bannerText.subtitle}
          </p>

          {/* Action buttons */}
          <div className="mt-9 flex flex-col gap-4 sm:flex-row sm:items-center">
            <a
              href={bannerText.button1Link}
              onClick={handlePrimaryClick}
              className="group inline-flex min-h-14 items-center justify-center gap-3 rounded-xl bg-[#008A90] px-7 py-4 text-sm font-bold text-white shadow-lg shadow-black/15 transition duration-300 hover:-translate-y-0.5 hover:bg-[#00767B] sm:text-base"
            >
              {bannerText.button1Text}
              <ArrowRight
                size={19}
                className="transition-transform duration-300 group-hover:translate-x-1"
              />
            </a>

            <a
              href={bannerText.button2Link}
              onClick={trackBannerClick}
              className="inline-flex min-h-14 items-center justify-center gap-3 rounded-xl border border-white/35 bg-white/10 px-7 py-4 text-sm font-bold text-white backdrop-blur-sm transition duration-300 hover:border-white hover:bg-white/20 sm:text-base"
            >
              <PhoneCall size={18} />
              {bannerText.button2Text}
            </a>
          </div>

          {/* Trust points */}
          <div className="mt-10 flex flex-wrap gap-x-7 gap-y-3 text-sm font-medium text-white/80">
            <span className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-[#008A90]" />
              Affordable rentals
            </span>

            <span className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-[#008A90]" />
              Convenient delivery
            </span>

            <span className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-[#008A90]" />
              Hassle-free setup
            </span>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
