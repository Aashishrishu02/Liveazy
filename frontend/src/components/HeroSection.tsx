import React, { useCallback, useEffect, useRef, useState } from "react";

import {

  ArrowLeft,

  ArrowRight,

  PhoneCall,

  Sparkles,

  Pause,

  Play,

} from "lucide-react";

import heroImg from "../assets/hero-banner.jpeg";
import { fetchJsonDeduplicated } from "../utils/api";



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

  images?: Array<{ id?: string; imageUrl?: string; sortOrder?: number } | string>;

  topLabel?: string;

  heading?: string;

  subtitle?: string;

  button1Text?: string;

  button1Link?: string;

  button2Text?: string;

  button2Link?: string;

  isActive?: boolean;

  placement?: string;

  sortOrder?: number;

  startsAt?: string | null;

  endsAt?: string | null;

}



const defaultBanner: BannerData = {

  topLabel: "NO INVESTMENT, JUST COMFORT",

  heading: "Furnish Your Home in Just 2 Days.",

  subtitle:

    "Delivery, Setup & Support — All Included. Enjoy comfortable living with affordable furniture rentals across Pune & PCMC.",

  button1Text: "VIEW CATEGORIES",

  button1Link: "#categories",

  button2Text: "CALL HOTLINE",

  button2Link: "tel:+919423838109",

  image: "",

  isActive: true,

};



const SLIDE_INTERVAL = 4000;



function isWithinSchedule(banner: BannerData, now = Date.now()) {

  if (banner.isActive === false) return false;



  const start = banner.startsAt ? new Date(banner.startsAt).getTime() : null;

  const end = banner.endsAt ? new Date(banner.endsAt).getTime() : null;



  if (start !== null && Number.isFinite(start) && start > now) return false;

  if (end !== null && Number.isFinite(end) && end <= now) return false;



  return true;

}



function normalizeBanners(payload: unknown): BannerData[] {

  const records = Array.isArray(payload)

    ? payload

    : payload && typeof payload === "object"

      ? [payload as BannerData]

      : [];



  return records

    .filter(

      (item): item is BannerData =>

        Boolean(item) && typeof item === "object"

    )

    .filter(

      (item) =>

        !item.placement || item.placement === "HOMEPAGE_HERO"

    )

    .filter((item) => isWithinSchedule(item))

    .filter((item) => Boolean(item.image || (Array.isArray(item.images) && item.images.length)))

    .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));

}



export const HeroSection: React.FC<HeroSectionProps> = ({

  onExploreClick,

}) => {

  const API_URL = (import.meta.env.VITE_API_URL || "").replace(/\/$/, "");



  const [banners, setBanners] = useState<BannerData[]>([]);

  const [activeIndex, setActiveIndex] = useState(0);
  const [activeImageIndex, setActiveImageIndex] = useState(0);

  const [isBannerLoading, setIsBannerLoading] = useState(true);

  const [isPaused, setIsPaused] = useState(false);

  const [imageFailed, setImageFailed] = useState(false);



  // Avoid duplicate impression requests for the same banner during this mount.

  const trackedImpressions = useRef<Set<string>>(new Set());



  const currentBanner = banners[activeIndex] ?? defaultBanner;

  const currentImages = (Array.isArray(currentBanner.images) ? currentBanner.images : [])
    .map((item) => typeof item === "string" ? item : item?.imageUrl || "")
    .filter(Boolean);
  const slideImages = currentImages.length ? currentImages : (currentBanner.image ? [currentBanner.image] : []);
  const bannerImage = slideImages[activeImageIndex % Math.max(slideImages.length, 1)] || heroImg;

  const currentBannerId = currentBanner.id;



  const goToSlide = useCallback(

  (index: number) => {

    const count = banners.length;



    if (count <= 1) {

      setActiveIndex(0);

      return;

    }



    setActiveIndex((index + count) % count);

    setImageFailed(false);

  },

  [banners.length]

);



  const nextSlide = useCallback(() => {

    setActiveIndex((current) =>

      banners.length > 1 ? (current + 1) % banners.length : 0

    );

    setImageFailed(false);

  }, [banners.length]);



  const previousSlide = useCallback(() => {

    setActiveIndex((current) =>

      banners.length > 1

        ? (current - 1 + banners.length) % banners.length

        : 0

    );

    setImageFailed(false);

  }, [banners.length]);



  useEffect(() => {

    let cancelled = false;
    const controller = new AbortController();

    async function fetchBanners() {
      try {
        const payload = await fetchJsonDeduplicated<unknown>(
          `${API_URL}/banners`,
          { signal: controller.signal }
        );

        if (cancelled) return;

        const publicBanners = normalizeBanners(payload);
        setBanners(publicBanners);
        setActiveIndex(0);
      } catch (error) {
        if (controller.signal.aborted) return;
        if (!cancelled) {
          console.error("Failed to fetch banners:", error);
          setBanners([]);
          setActiveIndex(0);
        }
      } finally {
        if (!cancelled) setIsBannerLoading(false);
      }
    }

    void fetchBanners();

    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [API_URL]);



  // Cycle through images within the current banner first; otherwise cycle banners.
  useEffect(() => {
    if (isPaused || banners.length === 0) return;
    const timer = window.setInterval(() => {
      const banner = banners[activeIndex];
      const images = (Array.isArray(banner?.images) ? banner.images : [])
        .map((item) => typeof item === "string" ? item : item?.imageUrl || "")
        .filter(Boolean);
      const count = images.length || (banner?.image ? 1 : 0);
      if (count > 1) {
        setActiveImageIndex((current) => (current + 1) % count);
      } else if (banners.length > 1) {
        setActiveIndex((current) => (current + 1) % banners.length);
        setActiveImageIndex(0);
      }
      setImageFailed(false);
    }, SLIDE_INTERVAL);
    return () => window.clearInterval(timer);
  }, [banners, activeIndex, isPaused]);



  useEffect(() => {
    setActiveImageIndex(0);
    setImageFailed(false);
  }, [activeIndex]);


  // Record one impression for each saved banner shown in this session.

  useEffect(() => {

    if (!currentBannerId || !API_URL) return;

    if (trackedImpressions.current.has(currentBannerId)) return;



    trackedImpressions.current.add(currentBannerId);



    void fetch(`${API_URL}/banners/${currentBannerId}/impression`, {

      method: "POST",

    }).catch((error) => {

      trackedImpressions.current.delete(currentBannerId);

      console.error("Failed to record banner impression:", error);

    });

  }, [currentBannerId, API_URL]);



  const trackBannerClick = () => {

    if (!currentBannerId || !API_URL) return;



    void fetch(`${API_URL}/banners/${currentBannerId}/click`, {

      method: "POST",

    }).catch((error) => {

      console.error("Failed to record banner click:", error);

    });

  };



  const handlePrimaryClick = (

    event: React.MouseEvent<HTMLAnchorElement>

  ) => {

    trackBannerClick();



    if (currentBanner.button1Link === "#categories") {

      event.preventDefault();

      onExploreClick?.();

    }

  };



  if (isBannerLoading) {

    return (

      <section

        id="hero"

        aria-label="Loading banners"

        className="min-h-[500px] animate-pulse bg-[#0F2942] sm:min-h-[540px] lg:min-h-[590px]"

      />

    );

  }



  const displayBanner = banners.length > 0 ? currentBanner : defaultBanner;



  return (

    <section

      id="hero"

      aria-label="Featured rental banners"

      className="relative isolate overflow-hidden bg-[#0F2942]"

      onMouseEnter={() => setIsPaused(true)}

      onMouseLeave={() => setIsPaused(false)}

      onFocusCapture={() => setIsPaused(true)}

      onBlurCapture={(event) => {

        if (!event.currentTarget.contains(event.relatedTarget as Node | null)) {

          setIsPaused(false);

        }

      }}

    >
      

      {/* Background image and overlays */}

      <div className="absolute inset-0">

        <img

          key={bannerImage}

          src={imageFailed ? heroImg : bannerImage}

          alt={displayBanner.heading || "Furniture rental for comfortable living"}

          className="h-full w-full object-cover object-center transition-opacity duration-500"

          fetchPriority="high"

          onError={() => setImageFailed(true)}

        />

        <div className="absolute inset-0 bg-gradient-to-r from-[#071827]/95 via-[#0F2942]/80 to-[#0F2942]/25" />

        <div className="absolute inset-0 bg-gradient-to-t from-[#071827]/45 via-transparent to-transparent" />

      </div>



      {/* Decorative accent */}

      <div className="pointer-events-none absolute -right-24 top-10 h-72 w-72 rounded-full border border-white/10 sm:h-96 sm:w-96" />

      <div className="pointer-events-none absolute -right-12 top-24 h-56 w-56 rounded-full border border-white/10 sm:h-72 sm:w-72" />



      <div className="relative mx-auto flex min-h-[500px] max-w-[1440px] items-center px-5 py-16 sm:min-h-[540px] sm:px-8 sm:py-20 lg:min-h-[590px] lg:px-12">

        <div className="max-w-3xl" key={currentBannerId ?? `default-${activeIndex}`}>

          <div className="mb-7 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-2 text-xs font-bold tracking-[0.14em] text-white backdrop-blur-md sm:text-sm">

            <Sparkles size={15} className="text-[#FF6A3D]" />

            <span>{displayBanner.topLabel || defaultBanner.topLabel}</span>

          </div>



          <h1 className="max-w-3xl text-4xl font-extrabold leading-[1.12] tracking-tight text-white sm:text-5xl md:text-6xl lg:text-7xl">

            {displayBanner.heading || defaultBanner.heading}

          </h1>



          <p className="mt-6 max-w-2xl text-base leading-7 text-white/80 sm:text-lg sm:leading-8">

            {displayBanner.subtitle || defaultBanner.subtitle}

          </p>



          <div className="mt-9 flex flex-col gap-4 sm:flex-row sm:items-center">

            <a

              href={displayBanner.button1Link || defaultBanner.button1Link}

              onClick={handlePrimaryClick}

              className="group inline-flex min-h-14 items-center justify-center gap-3 rounded-xl bg-[#008A90] px-7 py-4 text-sm font-bold text-white shadow-lg shadow-black/15 transition duration-300 hover:-translate-y-0.5 hover:bg-[#00767B] sm:text-base"

            >

              {displayBanner.button1Text || defaultBanner.button1Text}

              <ArrowRight

                size={19}

                className="transition-transform duration-300 group-hover:translate-x-1"

              />

            </a>



            <a

              href={displayBanner.button2Link || defaultBanner.button2Link}

              onClick={trackBannerClick}

              className="inline-flex min-h-14 items-center justify-center gap-3 rounded-xl border border-white/35 bg-white/10 px-7 py-4 text-sm font-bold text-white backdrop-blur-sm transition duration-300 hover:border-white hover:bg-white/20 sm:text-base"

            >

              <PhoneCall size={18} />

              {displayBanner.button2Text || defaultBanner.button2Text}

            </a>

          </div>



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



      {/* Carousel controls appear only when multiple active hero banners exist. */}

      {/* Dots indicate images within the current banner. */}
      {slideImages.length > 1 && (
        <div className="absolute bottom-5 left-1/2 z-20 flex -translate-x-1/2 items-center gap-2 rounded-full border border-white/20 bg-[#071827]/40 px-3 py-2 backdrop-blur sm:bottom-7">
          {slideImages.map((image, index) => (
            <button
              key={`${image}-${index}`}
              type="button"
              aria-label={`Show image ${index + 1} of ${slideImages.length}`}
              aria-current={index === activeImageIndex ? "true" : undefined}
              onClick={() => {
                setActiveImageIndex(index);
                setImageFailed(false);
              }}
              className={`h-2.5 rounded-full transition-all duration-300 ${
                index === activeImageIndex
                  ? "w-7 bg-white"
                  : "w-2.5 bg-white/50 hover:bg-white/90"
              }`}
            />
          ))}
        </div>
      )}

      {banners.length > 1 && (

        <>

          <div className="absolute bottom-5 right-5 z-10 flex items-center gap-2 sm:bottom-7 sm:right-8 lg:right-12">

            <button

              type="button"

              aria-label="Previous banner"

              onClick={previousSlide}

              className="flex h-10 w-10 items-center justify-center rounded-full border border-white/35 bg-[#071827]/40 text-white backdrop-blur transition hover:bg-white/20"

            >

              <ArrowLeft size={18} />

            </button>



            <div className="flex items-center gap-2 rounded-full border border-white/20 bg-[#071827]/40 px-3 py-2 backdrop-blur">

              {banners.map((banner, index) => (

                <button

                  key={banner.id || `${banner.image}-${index}`}

                  type="button"

                  aria-label={`Show banner ${index + 1}`}

                  aria-current={index === activeIndex ? "true" : undefined}

                  onClick={() => { goToSlide(index); setActiveImageIndex(0); setImageFailed(false); }}

                  className={`h-2.5 rounded-full transition-all duration-300 ${

                    index === activeIndex

                      ? "w-7 bg-white"

                      : "w-2.5 bg-white/50 hover:bg-white/80"

                  }`}

                />

              ))}

            </div>



            <button

              type="button"

              aria-label="Next banner"

              onClick={nextSlide}

              className="flex h-10 w-10 items-center justify-center rounded-full border border-white/35 bg-[#071827]/40 text-white backdrop-blur transition hover:bg-white/20"

            >

              <ArrowRight size={18} />

            </button>



            <button

              type="button"

              aria-label={isPaused ? "Resume automatic slideshow" : "Pause automatic slideshow"}

              onClick={() => setIsPaused((paused) => !paused)}

              className="hidden h-10 w-10 items-center justify-center rounded-full border border-white/35 bg-[#071827]/40 text-white backdrop-blur transition hover:bg-white/20 sm:flex"

            >

              {isPaused ? <Play size={16} /> : <Pause size={16} />}

            </button>

          </div>



          <span className="absolute bottom-8 left-5 z-10 text-xs font-semibold tracking-wider text-white/75 sm:left-8 lg:left-12">

            {String(activeIndex + 1).padStart(2, "0")} / {String(banners.length).padStart(2, "0")}

          </span>

        </>

      )}

    </section>

  );

};



export default HeroSection;
