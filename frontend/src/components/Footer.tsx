import React from 'react';
import { ChevronUp } from 'lucide-react';

export const Footer: React.FC = () => {
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <>
      {/* ========================================================= */}
      {/* MAIN FOOTER (Stitch: MainFooter)                          */}
      {/* ========================================================= */}
      <footer className="bg-[#f28e2b] text-white pt-12 pb-8">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8 pb-10 border-b border-amber-500/50">
            {/* Col 1: Brand Info (2 columns on lg) */}
            <div className="lg:col-span-2 space-y-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded bg-white text-[#f28e2b] flex items-center justify-center font-black text-xl shadow-xs">
                  R
                </div>
                <span className="text-2xl font-black tracking-tight text-white font-sans">
                  RentNest<span className="text-gray-900">.in</span>
                </span>
              </div>
              <p className="text-xs text-white/90 leading-relaxed max-w-sm">
                Furniture &amp; Home Appliances on Rent in Pune. Affordable monthly rental plans with
                doorstep delivery, complimentary installation, and dedicated maintenance support.
              </p>
              <div className="flex items-center space-x-3 text-lg text-white pt-2">
                <a
                  href="#"
                  className="w-8 h-8 rounded-full bg-white/20 hover:bg-white hover:text-[#f28e2b] flex items-center justify-center transition text-xs font-bold"
                  aria-label="Facebook"
                >
                  f
                </a>
                <a
                  href="#"
                  className="w-8 h-8 rounded-full bg-white/20 hover:bg-white hover:text-[#f28e2b] flex items-center justify-center transition text-xs font-bold"
                  aria-label="X Twitter"
                >
                  𝕏
                </a>
                <a
                  href="#"
                  className="w-8 h-8 rounded-full bg-white/20 hover:bg-white hover:text-[#f28e2b] flex items-center justify-center transition text-xs font-bold"
                  aria-label="Instagram"
                >
                  ig
                </a>
                <a
                  href="#"
                  className="w-8 h-8 rounded-full bg-white/20 hover:bg-white hover:text-[#f28e2b] flex items-center justify-center transition text-xs font-bold"
                  aria-label="LinkedIn"
                >
                  in
                </a>
              </div>
            </div>

            {/* Col 2: Useful Links */}
            <div className="space-y-3">
              <h4 className="font-bold text-xs uppercase tracking-wider text-gray-900">
                USEFUL LINKS
              </h4>
              <ul className="text-xs space-y-2 text-white/90 font-medium">
                <li><a className="hover:underline" href="#">Privacy Policy</a></li>
                <li><a className="hover:underline" href="#">Refund and Returns</a></li>
                <li><a className="hover:underline" href="#">Terms &amp; Conditions</a></li>
                <li><a className="hover:underline" href="#about">About Us</a></li>
                <li><a className="hover:underline" href="#contact">Contact Us</a></li>
              </ul>
            </div>

            {/* Col 3: Categories */}
            <div className="space-y-3">
              <h4 className="font-bold text-xs uppercase tracking-wider text-gray-900">
                CATEGORIES
              </h4>
              <ul className="text-xs space-y-2 text-white/90 font-medium">
                <li><a className="hover:underline" href="#bedroom">Bedroom</a></li>
                <li><a className="hover:underline" href="#living">Living Room</a></li>
                <li><a className="hover:underline" href="#dining">Dining</a></li>
                <li><a className="hover:underline" href="#study">Study</a></li>
                <li><a className="hover:underline" href="#appliances">Appliances</a></li>
                <li><a className="hover:underline" href="#combos">Combo Offers</a></li>
              </ul>
            </div>

            {/* Col 4: Service Areas Summary */}
            <div className="space-y-3">
              <h4 className="font-bold text-xs uppercase tracking-wider text-gray-900">
                SERVICE AREAS
              </h4>
              <ul className="text-xs space-y-2 text-white/90 font-medium">
                <li><a className="hover:underline" href="#">West Pune (Baner, Wakad, Hinjewadi)</a></li>
                <li><a className="hover:underline" href="#">East Pune (Kharadi, Viman Nagar)</a></li>
                <li><a className="hover:underline" href="#">North Pune (Pimpri, Chinchwad)</a></li>
                <li><a className="hover:underline" href="#">South Pune (Kondhwa, Katraj)</a></li>
                <li><a className="hover:underline" href="#">Central Pune (Kothrud, Shivaji Nagar)</a></li>
              </ul>
            </div>
          </div>

          {/* Bottom Bar with Copyright & Payment Badges */}
          <div className="pt-6 flex flex-col sm:flex-row items-center justify-between text-xs text-white/80 gap-4">
            <div>
              © 2026 RentNest.in — Furniture &amp; Home Appliances on Rent | Pune, Maharashtra.
            </div>
            {/* Payment Badges Representation */}
            <div className="flex items-center space-x-2 text-xs bg-white/10 px-3 py-1.5 rounded text-white">
              <span className="font-semibold">VISA</span>
              <span>•</span>
              <span className="font-semibold">MasterCard</span>
              <span>•</span>
              <span className="font-semibold">RuPay</span>
              <span>•</span>
              <span className="text-[10px] font-bold uppercase tracking-wider">UPI Accepted</span>
            </div>
          </div>
        </div>
      </footer>

      {/* Floating Sticky WhatsApp Trigger Button (Stitch reference) */}
      <a
        aria-label="Chat with RentNest on WhatsApp"
        className="fixed bottom-5 left-5 z-40 bg-[#25D366] hover:bg-[#20ba59] text-white w-12 h-12 rounded-full shadow-2xl flex items-center justify-center text-2xl transition duration-300 transform hover:scale-110"
        href="https://wa.me/919423838109?text=Hi%20RentNest,%20I%20have%20an%20inquiry%20about%20renting%20furniture%20in%20Pune"
        target="_blank"
        rel="noreferrer"
      >
        <span className="text-xl">💬</span>
      </a>

      {/* Scroll-to-Top Button (Stitch reference) */}
      <button
        aria-label="Back to top"
        onClick={scrollToTop}
        className="fixed bottom-5 right-5 z-40 bg-white/90 hover:bg-white text-gray-800 border border-gray-200 w-10 h-10 rounded-full shadow-lg flex items-center justify-center text-sm transition duration-300"
      >
        <ChevronUp size={18} />
      </button>
    </>
  );
};

export default Footer;
