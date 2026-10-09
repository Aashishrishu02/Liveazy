import React, { useEffect, useState } from 'react';
import heroImg from '../assets/hero-banner.jpeg';

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

const defaultBanner: Required<
  Pick<
    BannerData,
    | 'topLabel'
    | 'heading'
    | 'subtitle'
    | 'button1Text'
    | 'button1Link'
    | 'button2Text'
    | 'button2Link'
  >
> = {
  topLabel: 'NO INVESTMENT, JUST COMFORT',
  heading: 'Furnish Your Home in Just 2 Days.',
  subtitle:
    'Delivery, Setup & Support — All Included. Starting at minimal rents across Pune & PCMC.',
  button1Text: 'VIEW CATEGORIES',
  button1Link: '#categories',
  button2Text: 'CALL HOTLINE',
  button2Link: 'tel:+919423838109',
};

export const HeroSection: React.FC<HeroSectionProps> = ({
  onExploreClick,
}) => {
  const API_URL = import.meta.env.VITE_API_URL;

  const [bannerImage, setBannerImage] = useState(heroImg);
  const [bannerText, setBannerText] =
    useState(defaultBanner);

  useEffect(() => {
    const fetchBanner = async () => {
      try {
        const response = await fetch(`${API_URL}/banners`);

        if (!response.ok) {
          return;
        }

        const banner: BannerData | null = await response.json();

        if (!banner) {
          return;
        }

        if (banner.image) {
          setBannerImage(banner.image);
        }

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
      } catch (error) {
        console.error('Failed to fetch banner:', error);
      }
    };

    void fetchBanner();
  }, [API_URL]);

  return (
    <section className="relative overflow-hidden bg-gray-900">
      <div className="relative h-[460px] w-full sm:h-[480px]">
        {/* Background Image */}
        <img
          src={bannerImage}
          alt="Furnish Your Home With RentNest"
          className="h-full w-full object-cover object-center opacity-45"
        />

        {/* Dark Overlay */}
        <div className="absolute inset-0 bg-gradient-to-r from-black/85 via-black/60 to-transparent" />

        {/* Hero Content */}
        <div className="absolute inset-0 flex items-center">
          <div className="mx-auto w-full max-w-7xl px-6">
            <div className="max-w-2xl space-y-5 text-white">
              {/* Top Label */}
              <div className="inline-flex items-center space-x-2 rounded border border-[#0795A3]/50 bg-[#0795A3]/20 px-3 py-1 text-xs font-extrabold uppercase tracking-widest text-[#35C6CF]">
                <span className="h-2 w-2 animate-pulse rounded-full bg-[#35C6CF]" />
                <span>{bannerText.topLabel}</span>
              </div>

              {/* Heading */}
              <h1 className="text-4xl font-extrabold leading-tight tracking-tight text-white md:text-5xl lg:text-6xl">
                {bannerText.heading}
              </h1>

              {/* Subtitle */}
              <p className="max-w-xl text-base font-light leading-relaxed text-gray-200 md:text-lg">
                {bannerText.subtitle}
              </p>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center gap-4 pt-2">
                <a
                  className="rounded bg-[#123B63] px-7 py-3.5 text-xs font-bold uppercase tracking-wider text-white shadow-lg transition duration-200 hover:bg-[#0795A3] md:text-sm"
                  href={bannerText.button1Link}
                  onClick={
                    bannerText.button1Link === '#categories'
                      ? onExploreClick
                      : undefined
                  }
                >
                  {bannerText.button1Text}
                </a>

                <a
                  className="rounded border border-white/80 px-7 py-3.5 text-xs font-bold uppercase tracking-wider text-white backdrop-blur-sm transition duration-200 hover:bg-white hover:text-gray-900 md:text-sm"
                  href={bannerText.button2Link}
                >
                  {bannerText.button2Text}
                </a>
              </div>

              {/* Existing Slide Indicators */}
              <div className="flex items-center space-x-4 pt-4 text-xs font-semibold text-gray-400 sm:pt-6">
                <span className="text-sm font-bold text-white">
                  01
                </span>

                <div className="h-0.5 w-16 overflow-hidden bg-gray-600">
                  <div className="h-full w-1/2 bg-[#0795A3]" />
                </div>

                <span>02</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
