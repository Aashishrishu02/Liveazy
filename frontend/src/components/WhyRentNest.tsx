import React from 'react';
import { Truck, MessageCircle, CreditCard, Clock } from 'lucide-react';

export const WhyRentNest: React.FC = () => {
  return (
    <div className="w-full">
      {/* ========================================================= */}
      {/* 1. FOUR VALUE PILLARS (Stitch: FourValuePillars)          */}
      {/* ========================================================= */}
      <section className="py-10 bg-white border-y border-gray-100">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Pillar 1 */}
            <div className="flex items-start space-x-4">
              <span className="text-3xl font-black text-[#f28e2b] leading-none">1.</span>
              <div>
                <h4 className="text-sm font-bold text-gray-900">Free Delivery</h4>
                <p className="text-xs text-gray-500 mt-0.5">Doorstep across Pune &amp; PCMC</p>
              </div>
            </div>

            {/* Pillar 2 */}
            <div className="flex items-start space-x-4">
              <span className="text-3xl font-black text-[#f28e2b] leading-none">2.</span>
              <div>
                <h4 className="text-sm font-bold text-gray-900">Easy Rentals</h4>
                <p className="text-xs text-gray-500 mt-0.5">Flexible budget-friendly plans</p>
              </div>
            </div>

            {/* Pillar 3 */}
            <div className="flex items-start space-x-4">
              <span className="text-3xl font-black text-[#f28e2b] leading-none">3.</span>
              <div>
                <h4 className="text-sm font-bold text-gray-900">Best Quality</h4>
                <p className="text-xs text-gray-500 mt-0.5">Thoroughly clean &amp; inspected</p>
              </div>
            </div>

            {/* Pillar 4 */}
            <div className="flex items-start space-x-4">
              <span className="text-3xl font-black text-[#f28e2b] leading-none">4.</span>
              <div>
                <h4 className="text-sm font-bold text-gray-900">Quick Support</h4>
                <p className="text-xs text-gray-500 mt-0.5">Always here to help you relocate</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================= */}
      {/* 2. TRUST PILLARS STRIP (Stitch: TrustPillarsStrip)         */}
      {/* ========================================================= */}
      <div className="bg-[#f28e2b] text-white py-8 border-y border-amber-600">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center md:text-left">
            {/* Free Shipping */}
            <div className="flex flex-col md:flex-row items-center md:items-start space-y-2 md:space-y-0 md:space-x-4">
              <div className="p-2 rounded-lg bg-white/10 text-white">
                <Truck size={28} />
              </div>
              <div>
                <h5 className="font-bold text-sm leading-tight">Free Shipping</h5>
                <p className="text-xs text-white/85">Free delivery, first order</p>
              </div>
            </div>

            {/* 24/7 Support */}
            <div className="flex flex-col md:flex-row items-center md:items-start space-y-2 md:space-y-0 md:space-x-4">
              <div className="p-2 rounded-lg bg-white/10 text-white">
                <MessageCircle size={28} />
              </div>
              <div>
                <h5 className="font-bold text-sm leading-tight">24/7 Support</h5>
                <p className="text-xs text-white/85">Quick reply on WhatsApp</p>
              </div>
            </div>

            {/* Online Payment */}
            <div className="flex flex-col md:flex-row items-center md:items-start space-y-2 md:space-y-0 md:space-x-4">
              <div className="p-2 rounded-lg bg-white/10 text-white">
                <CreditCard size={28} />
              </div>
              <div>
                <h5 className="font-bold text-sm leading-tight">Online Payment</h5>
                <p className="text-xs text-white/85">Pay easily via UPI / Cards</p>
              </div>
            </div>

            {/* Fast Delivery */}
            <div className="flex flex-col md:flex-row items-center md:items-start space-y-2 md:space-y-0 md:space-x-4">
              <div className="p-2 rounded-lg bg-white/10 text-white">
                <Clock size={28} />
              </div>
              <div>
                <h5 className="font-bold text-sm leading-tight">Fast Delivery</h5>
                <p className="text-xs text-white/85">Delivered within 2–4 days</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WhyRentNest;
