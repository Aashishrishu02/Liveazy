import React, { useEffect, useState, useCallback } from "react";
import { Flame, Clock, ArrowRight, ShieldCheck, Truck } from "lucide-react";
import type { Product } from "../types/rental";
import { getApiBaseUrl, fetchJsonDeduplicated } from "../utils/api";

interface DealsSectionProps {
  onQuickView: (product: Product, defaultTenure?: number) => void;
  onAddToCart: (product: Product, tenure: number) => void;
}

interface DealProductItem {
  id: string;
  productId: string;
  sortOrder: number;
  product: {
    id: string;
    name: string;
    price: number;
    image?: string | null;
    rent12M?: number | null;
    rent6M?: number | null;
    rent3M?: number | null;
    deposit12M?: number | null;
    category?: { name?: string } | string | null;
  };
}

interface DealData {
  id: string;
  title: string;
  subtitle?: string | null;
  description?: string | null;
  image?: string | null;
  originalPrice: number;
  offerPrice: number;
  discountPercent?: number | null;
  startsAt: string;
  endsAt: string;
  isActive: boolean;
  products: DealProductItem[];
}

interface DealApiResponse {
  deal: DealData | null;
  status: "ACTIVE" | "UPCOMING" | "NONE";
  expiresAt: string | null;
  startsAt?: string | null;
  serverTime?: string;
}

export const DealsSection: React.FC<DealsSectionProps> = () => {
  const [deal, setDeal] = useState<DealData | null>(null);
  const [loading, setLoading] = useState(true);
  const [siteWhatsApp, setSiteWhatsApp] = useState("917061460429");

  // Live countdown state calculated from actual DB endsAt
  const [timeLeft, setTimeLeft] = useState<{
    hours: number;
    minutes: number;
    seconds: number;
  }>({ hours: 0, minutes: 0, seconds: 0 });

  const loadCurrentDeal = useCallback(async () => {
    const apiBase = getApiBaseUrl();
    try {
      const [res, socialRes] = await Promise.all([
        fetch(`${apiBase}/deals/current`).then((r) => r.json()),
        fetchJsonDeduplicated<{ whatsappNumber?: string }>(`${apiBase}/settings/social`).catch(() => null),
      ]);

      if (socialRes?.whatsappNumber) {
        setSiteWhatsApp(socialRes.whatsappNumber.replace(/[^0-9]/g, ""));
      }

      const data = res as DealApiResponse;
      if (data && data.status === "ACTIVE" && data.deal) {
        setDeal(data.deal);
      } else {
        setDeal(null);
      }
    } catch (e) {
      console.warn("Could not load current deal:", e);
      setDeal(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadCurrentDeal();
  }, [loadCurrentDeal]);

  // Live countdown timer connected directly to deal.endsAt
  useEffect(() => {
    if (!deal?.endsAt) return;

    const calculateTimeLeft = () => {
      const diff = new Date(deal.endsAt).getTime() - new Date().getTime();
      if (diff <= 0) {
        // Expired! Reload to check for next scheduled deal
        setTimeLeft({ hours: 0, minutes: 0, seconds: 0 });
        void loadCurrentDeal();
        return;
      }

      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

      setTimeLeft({ hours, minutes, seconds });
    };

    calculateTimeLeft();
    const interval = setInterval(calculateTimeLeft, 1000);
    return () => clearInterval(interval);
  }, [deal?.endsAt, loadCurrentDeal]);

  const handleInquireDeal = () => {
    if (!deal) return;
    const msg = `Hello LIVEAZY! I saw this week's deal: *${deal.title}* (₹${deal.offerPrice}/mo). Please confirm availability and booking!`;
    const waUrl = `https://wa.me/${siteWhatsApp}?text=${encodeURIComponent(msg)}`;
    window.open(waUrl, "_blank", "noopener,noreferrer");
  };

  return (
    <section
      id="deals"
      aria-label="This Week Deals"
      className="py-8 sm:py-12 bg-[#fffdfa] border-t border-orange-100/60 scroll-mt-24"
    >
      <div className="ref-container">
        {loading ? (
          <div className="h-64 rounded-3xl bg-orange-50/50 animate-pulse border border-orange-100" />
        ) : deal ? (
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#2e1d10] via-[#1f1610] to-[#120e0b] p-6 sm:p-10 text-white shadow-xl">
            {/* Background Glow */}
            <div className="absolute top-0 right-0 -mr-20 -mt-20 h-72 w-72 rounded-full bg-orange-500/10 blur-3xl pointer-events-none" />

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
              {/* Left Column: Deal Info & Live Countdown */}
              <div className="lg:col-span-7 space-y-5">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-orange-500/20 border border-orange-500/30 px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-orange-400">
                    <Flame size={14} className="text-orange-400 animate-bounce" />
                    This Week's Deal
                  </span>
                  {deal.discountPercent && deal.discountPercent > 0 && (
                    <span className="rounded-full bg-red-600 px-3 py-1 text-[11px] font-extrabold text-white">
                      {deal.discountPercent}% OFF
                    </span>
                  )}
                </div>

                <div>
                  <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-white leading-tight">
                    {deal.title}
                  </h2>
                  {deal.subtitle && (
                    <p className="text-sm sm:text-base font-semibold text-orange-300 mt-1">
                      {deal.subtitle}
                    </p>
                  )}
                  {deal.description && (
                    <p className="text-xs sm:text-sm text-gray-300 mt-2 max-w-xl leading-relaxed">
                      {deal.description}
                    </p>
                  )}
                </div>

                {/* Actual Expiry Countdown Clock */}
                <div className="flex items-center gap-2 sm:gap-3 pt-2">
                  <div className="flex items-center gap-1.5 text-xs text-orange-300 font-bold mr-2">
                    <Clock size={16} />
                    <span>Ends In:</span>
                  </div>

                  <div className="flex items-center gap-1.5 font-mono text-center">
                    <div className="rounded-xl bg-white/10 px-3 py-2 border border-white/10">
                      <div className="text-lg sm:text-xl font-black text-white">
                        {String(timeLeft.hours).padStart(2, "0")}
                      </div>
                      <div className="text-[9px] uppercase tracking-wider text-gray-400">Hrs</div>
                    </div>
                    <span className="text-orange-400 font-bold text-lg">:</span>
                    <div className="rounded-xl bg-white/10 px-3 py-2 border border-white/10">
                      <div className="text-lg sm:text-xl font-black text-white">
                        {String(timeLeft.minutes).padStart(2, "0")}
                      </div>
                      <div className="text-[9px] uppercase tracking-wider text-gray-400">Min</div>
                    </div>
                    <span className="text-orange-400 font-bold text-lg">:</span>
                    <div className="rounded-xl bg-white/10 px-3 py-2 border border-white/10">
                      <div className="text-lg sm:text-xl font-black text-white">
                        {String(timeLeft.seconds).padStart(2, "0")}
                      </div>
                      <div className="text-[9px] uppercase tracking-wider text-gray-400">Sec</div>
                    </div>
                  </div>
                </div>

                {/* Price and CTA */}
                <div className="pt-4 flex flex-wrap items-center gap-4">
                  <div>
                    <div className="text-xs text-gray-400">Offer Rental Price</div>
                    <div className="flex items-baseline gap-2">
                      <span className="text-2xl sm:text-3xl font-black text-orange-400">
                        ₹{deal.offerPrice.toLocaleString()}
                      </span>
                      <span className="text-xs font-normal text-gray-400">/mo</span>
                      {deal.originalPrice > deal.offerPrice && (
                        <span className="text-xs text-gray-500 line-through">
                          ₹{deal.originalPrice.toLocaleString()}
                        </span>
                      )}
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handleInquireDeal}
                    className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 px-5 py-3 text-xs sm:text-sm font-bold text-white shadow-lg shadow-orange-500/25 transition hover:brightness-110 active:scale-95"
                  >
                    <span>Claim Deal Now</span>
                    <ArrowRight size={16} />
                  </button>
                </div>

                {/* Trust perks */}
                <div className="pt-2 flex flex-wrap items-center gap-4 text-[11px] text-gray-400 font-medium">
                  <span className="flex items-center gap-1.5">
                    <Truck size={14} className="text-orange-400" /> Free 72-hr Delivery
                  </span>
                  <span className="flex items-center gap-1.5">
                    <ShieldCheck size={14} className="text-orange-400" /> Deep Sanitised
                  </span>
                </div>
              </div>

              {/* Right Column: Featured Image or Featured Products */}
              <div className="lg:col-span-5">
                <div className="relative rounded-2xl overflow-hidden bg-black/40 border border-white/10 p-3 sm:p-4 shadow-2xl">
                  {deal.image ? (
                    <img
                      src={deal.image}
                      alt={deal.title}
                      className="h-64 sm:h-72 w-full object-cover rounded-xl"
                    />
                  ) : deal.products && deal.products.length > 0 && deal.products[0].product?.image ? (
                    <img
                      src={deal.products[0].product.image}
                      alt={deal.products[0].product.name}
                      className="h-64 sm:h-72 w-full object-cover rounded-xl"
                    />
                  ) : (
                    <div className="h-64 sm:h-72 w-full flex items-center justify-center text-orange-400/50">
                      <Flame size={64} />
                    </div>
                  )}

                  {deal.products && deal.products.length > 0 && (
                    <div className="mt-3 grid grid-cols-2 gap-2">
                      {deal.products.slice(0, 2).map((item) => (
                        <div
                          key={item.id}
                          className="rounded-lg bg-white/5 border border-white/10 p-2 text-xs flex items-center justify-between"
                        >
                          <span className="truncate font-semibold text-white">
                            {item.product?.name}
                          </span>
                          <span className="text-[10px] text-orange-300 font-bold shrink-0 ml-1">
                            ₹{item.product?.price}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#2e1d10] via-[#1f1610] to-[#120e0b] p-6 sm:p-10 text-white shadow-xl">
            <div className="absolute top-0 right-0 -mr-20 -mt-20 h-72 w-72 rounded-full bg-orange-500/10 blur-3xl pointer-events-none" />
            <div className="flex flex-col lg:flex-row items-center justify-between gap-6">
              <div className="space-y-3 max-w-xl text-center lg:text-left">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-orange-500/20 border border-orange-500/30 px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-orange-400">
                  <Flame size={14} className="text-orange-400" />
                  Flash Deals &amp; Offers
                </span>
                <h2 className="text-2xl sm:text-3xl font-extrabold text-white leading-tight">
                  Fresh Flash Deals Dropping Soon!
                </h2>
                <p className="text-xs sm:text-sm text-gray-300 leading-relaxed">
                  We curate exclusive limited-time flash discounts on premium furniture and home appliance setups. Check back often or explore our active Value Combo Plans for instant bundled savings!
                </p>
              </div>
              <div className="shrink-0 flex flex-wrap gap-3">
                <a
                  href="#combos"
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-orange-500 px-5 py-2.5 text-xs sm:text-sm font-bold text-white shadow-lg shadow-orange-500/25 transition hover:bg-orange-600"
                >
                  <span>Explore Combo Plans</span>
                  <ArrowRight size={15} />
                </a>
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
};

export default DealsSection;
