import React, { useEffect , useState } from 'react';
import heroImg from '../assets/hero-banner.jpeg';

interface HeroSectionProps {
  onSearchSubmit?: (query: string, category?: string, city?: string) => void;
  selectedCity?: string;
  onExploreClick?: () => void;
}

export const HeroSection: React.FC<HeroSectionProps> = ({ onExploreClick }) => {
    const API_URL = import.meta.env.VITE_API_URL;
  const [bannerImage, setBannerImage] = useState(heroImg);

  useEffect(() => {
    const fetchBanner = async () => {
      try {
        const response = await fetch(`${API_URL}/banners`);

        if (!response.ok) {
          return;
        }

        const banner = await response.json();

        if (banner?.image) {
          setBannerImage(banner.image);
        }
      } catch (error) {
        console.error('Failed to fetch banner:', error);
      }
    };

    fetchBanner();
  }, [API_URL]);
  return (
    <section className="relative bg-gray-900 overflow-hidden">
      <div className="relative h-[460px] sm:h-[480px] w-full">
        {/* Background Image with Overlay */}
        <img
          src={bannerImage}
          alt="Furnish Your Home With RentNest"
          className="w-full h-full object-cover object-center opacity-45"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-black/85 via-black/60 to-transparent" />

        {/* Hero Content Overlay */}
        <div className="absolute inset-0 flex items-center">
          <div className="max-w-7xl mx-auto px-6 w-full">
            <div className="max-w-2xl text-white space-y-5">
              <div className="inline-flex items-center space-x-2 bg-amber-[#0795A3]/20 border border-[#0795A3]/50 px-3 py-1 rounded text-[#35C6CF] text-xs font-extrabold tracking-widest uppercase">
                <span className="w-2 h-2 rounded-full bg-[#35C6CF] animate-pulse" />
                <span>NO INVESTMENT, JUST COMFORT</span>
              </div>

              <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold leading-tight tracking-tight text-white">
                Furnish Your Home in Just 2 Days.
              </h1>

              <p className="text-gray-200 text-base md:text-lg font-light leading-relaxed max-w-xl">
                Delivery, Setup & Support — All Included. Starting at minimal rents across Pune & PCMC.
              </p>

              <div className="pt-2 flex flex-wrap items-center gap-4">
                <a
                  className="bg-[#123B63] hover:bg-[#0795A3] text-white text-xs md:text-sm font-bold uppercase tracking-wider px-7 py-3.5 rounded shadow-lg transition duration-200"
                  href="#categories"
                  onClick={onExploreClick}
                >
                  VIEW CATEGORIES
                </a>

                <a
                  className="border border-white/80 hover:bg-white hover:text-gray-900 text-white text-xs md:text-sm font-bold uppercase tracking-wider px-7 py-3.5 rounded backdrop-blur-xs transition duration-200"
                  href="tel:+919423838109"
                >
                  CALL HOTLINE
                </a>
              </div>

              {/* Slide Indicators */}
              <div className="pt-4 sm:pt-6 flex items-center space-x-4 text-xs font-semibold text-gray-400">
                <span className="text-white font-bold text-sm">01</span>
                <div className="w-16 h-0.5 bg-gray-600 overflow-hidden">
                  <div className="w-1/2 h-full bg-[#0795A3]" />
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
