import React from 'react';
import heroBannerImg from '../assets/hero-banner.jpeg';
import table2Img from '../assets/products/table2.jpeg';
import sofaImg from '../assets/products/sofa.jpeg';
import dinnerTableImg from '../assets/products/dinner-table.jpeg';

interface PromoBannerProps {
  onCtaClick: () => void;
}

export const PromoBanner: React.FC<PromoBannerProps> = ({ onCtaClick }) => {
  return (
    <div className="space-y-6">
      
      {/* 1. LIFESTYLE PROMO SECTION 
      */}
      <section className="py-8 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center bg-white rounded-xl shadow-xs border border-gray-100 p-6">
            {/* Large Lifestyle Image (8 Columns) */}
            <div className="lg:col-span-8 overflow-hidden rounded-lg relative group">
              <img
                src={heroBannerImg}
                alt="Living Room Setup Pune"
                className="w-full h-80 object-cover rounded-lg group-hover:scale-102 transition duration-500"
              />
              <div className="absolute bottom-4 left-4 bg-white/95 backdrop-blur-xs px-4 py-2 rounded shadow text-xs font-semibold text-gray-800 flex items-center gap-1.5">
                <span className="text-[#f28e2b] font-bold">●</span>
                <span>Premium Fabric 3 Seater Sofas Available</span>
              </div>
            </div>

            {/* Side Feature Product: Most Popular (4 Columns) */}
            <div className="lg:col-span-4 text-center px-4">
              <span className="text-[11px] font-bold tracking-widest uppercase text-[#f28e2b] block mb-1">
                MOST POPULAR
              </span>
              <h3 className="text-sm text-gray-500 mb-6 font-medium">
                The most rented products by our customers this month.
              </h3>

              <div
                onClick={onCtaClick}
                className="max-w-xs mx-auto bg-gray-50 p-4 rounded-lg border border-gray-100 cursor-pointer hover:border-amber-300 transition"
              >
                <div className="h-44 flex items-center justify-center overflow-hidden mb-3">
                  <img
                    src={table2Img}
                    alt="Shoe Rack Cabinet"
                    className="max-h-full object-contain"
                  />
                </div>
                <h4 className="font-bold text-xs uppercase text-gray-800">Shoe Rack / Cabinet</h4>
                <p className="text-[11px] text-gray-400">Living Room</p>
                <p className="text-[#f28e2b] font-bold text-sm mt-1">
                  ₹400.00 <span className="text-xs text-gray-500 font-normal">/month</span>
                </p>
              </div>

              {/* Dots */}
              <div className="flex justify-center space-x-1.5 mt-4">
                <span className="w-2 h-2 rounded-full bg-gray-800" />
                <span className="w-2 h-2 rounded-full bg-gray-300" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 
      {/* 2. PROMO SPLIT CARDS */}
      
      <section className="py-6 bg-white">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Promo 1: Modern Furniture */}
            <div className="relative rounded-lg overflow-hidden h-44 bg-gray-900 flex items-center p-8 group">
              <img
                src={sofaImg}
                alt="Modern Furniture"
                className="absolute inset-0 w-full h-full object-cover opacity-35 group-hover:scale-105 transition duration-500"
              />
              <div className="relative z-10 space-y-2 text-white">
                <span className="text-[10px] font-bold tracking-widest text-[#f28e2b] uppercase">
                  NEW ARRIVALS
                </span>
                <h4 className="text-xl font-extrabold">Modern Furniture For Every Home</h4>
                <p className="text-xs text-gray-300">Bedroom, Living Room, Dining &amp; Appliances</p>
                <button
                  type="button"
                  onClick={onCtaClick}
                  className="inline-block pt-1 text-xs font-bold text-white uppercase tracking-wider underline hover:text-[#f28e2b] transition"
                >
                  VIEW MORE
                </button>
              </div>
            </div>

            {/* Promo 2: Flat 20% Off */}
            <div className="relative rounded-lg overflow-hidden h-44 bg-gray-900 flex items-center p-8 group">
              <img
                src={dinnerTableImg}
                alt="Flat Discount Offer"
                className="absolute inset-0 w-full h-full object-cover opacity-35 group-hover:scale-105 transition duration-500"
              />
              <div className="relative z-10 space-y-2 text-white">
                <span className="text-[10px] font-bold tracking-widest text-amber-400 uppercase">
                  FESTIVE OFFER
                </span>
                <h4 className="text-xl font-extrabold">Flat 20% Off on First Month</h4>
                <p className="text-xs text-gray-300">
                  Applicable on 6+ months booking tenure across Pune
                </p>
                <a
                  href="https://wa.me/919423838109?text=Hi%20RentNest,%20I%20want%20to%20claim%20the%20flat%2020%25%20off%20festive%20offer"
                  target="_blank"
                  rel="noreferrer"
                  className="inline-block pt-1 text-xs font-bold text-white uppercase tracking-wider underline hover:text-amber-400 transition"
                >
                  CLAIM NOW
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default PromoBanner;
