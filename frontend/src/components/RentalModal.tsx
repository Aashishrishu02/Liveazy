import React, { useState } from 'react';
import { X, ShieldCheck, Truck, Sparkles, Star, Calendar, ArrowRight } from 'lucide-react';
import type { Product } from '../types/rental';

interface RentalModalProps {
  product: Product | null;
  onClose: () => void;
  onAddToCart: (product: Product, tenure: number) => void;
}

const TENURES = [
  { months: 3, label: '3 Months', discount: 0, tag: 'Standard' },
  { months: 6, label: '6 Months', discount: 0.05, tag: '5% OFF' },
  { months: 12, label: '12 Months', discount: 0.15, tag: 'BEST VALUE (15% OFF)' },
  { months: 24, label: '24 Months', discount: 0.25, tag: 'MAX SAVINGS (25% OFF)' },
];

export const RentalModal: React.FC<RentalModalProps> = ({
  product,
  onClose,
  onAddToCart,
}) => {
  if (!product) return null;

  const [selectedTenure, setSelectedTenure] = useState(12);

  const tenureObj = TENURES.find((t) => t.months === selectedTenure) || TENURES[2];
  const discountedMonthly = Math.round(product.monthlyPrice * (1 - tenureObj.discount));

  const handleConfirm = () => {
    onAddToCart(product, selectedTenure);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div
        className="relative w-full max-w-2xl overflow-hidden rounded-3xl bg-white shadow-2xl animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* MODAL HEADER */}
        <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
          <div className="flex items-center gap-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-orange-100 text-orange-600 font-bold text-xs">
              <Sparkles size={14} />
            </span>
            <span className="text-xs font-bold uppercase tracking-wider text-orange-600">
              Customize Your Rental Plan
            </span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-full text-gray-400 hover:bg-gray-100 hover:text-gray-700 transition"
          >
            <X size={18} />
          </button>
        </div>

        {/* MODAL BODY */}
        <div className="max-h-[75vh] overflow-y-auto p-6 space-y-6">
          {/* PRODUCT SUMMARY */}
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 p-4 rounded-2xl bg-[#faf9f7] border border-gray-100">
            <div className="h-28 w-28 shrink-0 overflow-hidden rounded-xl bg-white border border-gray-200">
              <img
                src={product.image}
                alt={product.name}
                className="h-full w-full object-cover"
              />
            </div>
            <div className="flex-1 text-center sm:text-left">
              <span className="inline-block rounded-md bg-white px-2 py-0.5 text-[10px] font-bold text-gray-600 border border-gray-200 uppercase">
                {product.category}
              </span>
              <h3 className="mt-1 text-base font-bold text-gray-900 leading-snug">
                {product.name}
              </h3>
              <div className="mt-1 flex items-center justify-center sm:justify-start gap-2 text-xs text-gray-500">
                <span className="flex items-center gap-0.5 text-amber-600 font-bold">
                  <Star size={12} className="fill-amber-400 text-amber-400" />
                  {product.rating}
                </span>
                <span>•</span>
                <span>{product.reviewsCount} reviews</span>
                <span>•</span>
                <span className="text-emerald-600 font-medium">In Stock (Pune)</span>
              </div>
            </div>
          </div>

          {/* TENURE SELECTOR */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <label className="text-xs font-bold uppercase tracking-wider text-gray-700 flex items-center gap-1.5">
                <Calendar size={14} className="text-orange-500" />
                Select Rental Duration
              </label>
              <span className="text-xs text-orange-600 font-semibold">
                Longer duration = Lower monthly rent
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {TENURES.map((t) => {
                const isSelected = selectedTenure === t.months;
                const monthlyPriceForTenure = Math.round(product.monthlyPrice * (1 - t.discount));

                return (
                  <button
                    key={t.months}
                    type="button"
                    onClick={() => setSelectedTenure(t.months)}
                    className={`relative flex flex-col items-center justify-between rounded-2xl p-3 text-center transition-all ${
                      isSelected
                        ? 'border-2 border-orange-500 bg-orange-50/50 shadow-md ring-2 ring-orange-500/20'
                        : 'border border-gray-200 bg-white hover:border-orange-300 hover:bg-gray-50'
                    }`}
                  >
                    <span className="text-xs font-bold text-gray-800">{t.label}</span>
                    <span className="mt-2 text-sm font-extrabold text-orange-600">
                      ₹{monthlyPriceForTenure}/mo
                    </span>
                    <span
                      className={`mt-1 rounded-full px-1.5 py-0.5 text-[9px] font-extrabold ${
                        isSelected
                          ? 'bg-orange-500 text-white'
                          : 'bg-gray-100 text-gray-600'
                      }`}
                    >
                      {t.tag}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* PRICING BREAKDOWN */}
          <div className="rounded-2xl border border-gray-100 bg-gray-50/60 p-4 space-y-2.5 text-xs">
            <div className="flex items-center justify-between text-gray-600">
              <span>Monthly Rental ({selectedTenure} Months plan)</span>
              <span className="font-bold text-gray-900">₹{discountedMonthly}/mo</span>
            </div>
            <div className="flex items-center justify-between text-gray-600">
              <span className="flex items-center gap-1">
                <ShieldCheck size={14} className="text-emerald-500" />
                Refundable Security Deposit
              </span>
              <span className="font-bold text-emerald-600">₹0 (Waived)</span>
            </div>
            <div className="flex items-center justify-between text-gray-600">
              <span className="flex items-center gap-1">
                <Truck size={14} className="text-orange-500" />
                Delivery & Assembly in Pune
              </span>
              <span className="font-bold text-emerald-600">FREE</span>
            </div>
            <div className="border-t border-gray-200 pt-2 flex items-center justify-between text-sm font-bold text-gray-950">
              <span>First Month Payable:</span>
              <span className="text-base text-orange-600">₹{discountedMonthly}</span>
            </div>
          </div>
        </div>

        {/* MODAL FOOTER */}
        <div className="border-t border-gray-100 bg-[#fbfaf8] px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="text-center sm:text-left">
            <p className="text-[11px] text-gray-400">Lock-in tenure: {selectedTenure} months</p>
            <p className="text-xs font-semibold text-gray-700">Cancel or upgrade after tenure anytime</p>
          </div>

          <button
            type="button"
            onClick={handleConfirm}
            className="w-full sm:w-auto flex items-center justify-center gap-2 rounded-xl bg-orange-500 px-6 py-3 text-xs sm:text-sm font-bold text-white shadow-md shadow-orange-500/25 transition hover:bg-orange-600 active:scale-95"
          >
            <span>Add to Rental Cart</span>
            <ArrowRight size={16} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default RentalModal;
