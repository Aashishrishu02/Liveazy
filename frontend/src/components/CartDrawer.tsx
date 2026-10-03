import React from 'react';
import { X, Trash2, ShieldCheck, Truck, ArrowRight, ShoppingBag } from 'lucide-react';
import type { CartItem } from '../types/rental';

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  cartItems: CartItem[];
  onRemoveItem: (productId: string) => void;
  onUpdateTenure: (productId: string, tenure: number) => void;
  onProceedToCheckout: () => void;
}

export const CartDrawer: React.FC<CartDrawerProps> = ({
  isOpen,
  onClose,
  cartItems,
  onRemoveItem,
  onUpdateTenure,
  onProceedToCheckout,
}) => {
  if (!isOpen) return null;

  const totalMonthly = cartItems.reduce((acc, item) => {
    // Discount based on tenure
    const discount = item.selectedTenure >= 24 ? 0.25 : item.selectedTenure >= 12 ? 0.15 : item.selectedTenure >= 6 ? 0.05 : 0;
    const price = Math.round(item.product.monthlyPrice * (1 - discount));
    return acc + price * item.quantity;
  }, 0);

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-black/50 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="absolute inset-y-0 right-0 flex max-w-full pl-10">
        <div className="w-screen max-w-md bg-white shadow-2xl flex flex-col justify-between animate-in slide-in-from-right duration-300">
          {/* HEADER */}
          <div className="flex items-center justify-between border-b border-gray-100 px-6 py-5">
            <div className="flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-orange-100 text-orange-600">
                <ShoppingBag size={18} />
              </div>
              <div>
                <h3 className="text-base font-bold text-gray-900">Your Rental Cart</h3>
                <p className="text-xs text-gray-400">{cartItems.length} item{cartItems.length === 1 ? '' : 's'} in cart</p>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="flex h-8 w-8 items-center justify-center rounded-full text-gray-400 hover:bg-gray-100 hover:text-gray-700 transition"
            >
              <X size={18} />
            </button>
          </div>

          {/* CART ITEMS LIST */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            {cartItems.length > 0 ? (
              cartItems.map((item) => {
                const discount = item.selectedTenure >= 24 ? 0.25 : item.selectedTenure >= 12 ? 0.15 : item.selectedTenure >= 6 ? 0.05 : 0;
                const monthlyPrice = Math.round(item.product.monthlyPrice * (1 - discount));

                return (
                  <div
                    key={item.product.id}
                    className="flex gap-4 rounded-2xl border border-gray-100 bg-[#faf9f7] p-3.5"
                  >
                    <div className="h-20 w-20 shrink-0 overflow-hidden rounded-xl border border-gray-200 bg-white">
                      <img
                        src={item.product.image}
                        alt={item.product.name}
                        className="h-full w-full object-cover"
                      />
                    </div>

                    <div className="flex flex-1 flex-col justify-between min-w-0">
                      <div>
                        <div className="flex items-start justify-between gap-1">
                          <h4 className="text-xs font-bold text-gray-900 truncate">
                            {item.product.name}
                          </h4>
                          <button
                            type="button"
                            onClick={() => onRemoveItem(item.product.id)}
                            className="text-gray-400 hover:text-red-500 transition"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                        <span className="text-[10px] text-gray-500 block mt-0.5">
                          Category: {item.product.category}
                        </span>
                      </div>

                      <div className="mt-2 flex items-center justify-between">
                        <select
                          value={item.selectedTenure}
                          onChange={(e) =>
                            onUpdateTenure(item.product.id, Number(e.target.value))
                          }
                          className="rounded-lg border border-gray-200 bg-white px-2 py-1 text-[11px] font-semibold text-gray-700"
                        >
                          <option value={3}>3 Mo</option>
                          <option value={6}>6 Mo (5% off)</option>
                          <option value={12}>12 Mo (15% off)</option>
                          <option value={24}>24 Mo (25% off)</option>
                        </select>

                        <div className="text-right">
                          <span className="text-xs font-bold text-orange-600">
                            ₹{monthlyPrice}/mo
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="text-center py-12">
                <ShoppingBag size={36} className="mx-auto text-gray-300 mb-3" />
                <p className="text-sm font-bold text-gray-700">Your cart is empty</p>
                <p className="text-xs text-gray-400 mt-1">
                  Explore our popular rentals and add items with zero security deposit.
                </p>
              </div>
            )}

            {/* TRUST BADGES IN CART */}
            <div className="rounded-2xl border border-gray-100 bg-white p-3 space-y-2 text-[11px] text-gray-600">
              <div className="flex items-center gap-2">
                <ShieldCheck size={14} className="text-emerald-500" />
                <span>₹0 Security Deposit with quick KYC</span>
              </div>
              <div className="flex items-center gap-2">
                <Truck size={14} className="text-orange-500" />
                <span>Free doorstep delivery & installation in Pune</span>
              </div>
            </div>
          </div>

          {/* FOOTER TOTAL & CHECKOUT */}
          {cartItems.length > 0 && (
            <div className="border-t border-gray-100 bg-[#fbfaf8] p-6 space-y-3">
              <div className="flex items-center justify-between text-xs text-gray-600">
                <span>Total Monthly Rent</span>
                <span className="text-lg font-extrabold text-gray-950">
                  ₹{totalMonthly.toLocaleString('en-IN')}/mo
                </span>
              </div>
              <div className="flex items-center justify-between text-xs text-emerald-600 font-medium">
                <span>Security Deposit</span>
                <span>FREE (₹0)</span>
              </div>

              <button
                type="button"
                onClick={onProceedToCheckout}
                className="w-full flex items-center justify-center gap-2 rounded-2xl bg-orange-500 py-3.5 text-xs sm:text-sm font-bold text-white shadow-md shadow-orange-500/25 hover:bg-orange-600 transition active:scale-95"
              >
                <span>Proceed to Rental Checkout</span>
                <ArrowRight size={16} />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CartDrawer;
