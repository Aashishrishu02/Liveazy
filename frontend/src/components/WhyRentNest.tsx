import React from "react";
import {
  Truck,
  MessageCircle,
  CreditCard,
  Clock,
  ChevronUp,
} from "lucide-react";

export const Footer: React.FC = () => {
  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  return (
    <>
      
      

      <section
  id="contact"
  className="w-full bg-[#123B63] text-white border-t border-[#0795A3]/30"
>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">

            {/* ================= FREE SHIPPING ================= */}
            <div className="flex items-center gap-4 py-6 lg:py-7">

              <div
                className="
                  w-12
                  h-12
                  rounded-xl
                  bg-[#0795A3]/15
                  border
                  border-[#0795A3]/30
                  flex
                  items-center
                  justify-center
                  shrink-0
                "
              >
                <Truck
                  size={25}
                  strokeWidth={2}
                  className="text-[#35C6CF]"
                />
              </div>

              <div>
                <h3 className="text-white font-semibold text-sm sm:text-base">
                  Free Shipping
                </h3>

                <p className="text-white/65 text-xs sm:text-sm mt-1">
                  Free delivery, first order
                </p>
              </div>

            </div>


            {/*  24/7 SUPPORT  */}
            <div className="flex items-center gap-4 py-6 lg:py-7">

              <div
                className="
                  w-12
                  h-12
                  rounded-xl
                  bg-[#0795A3]/15
                  border
                  border-[#0795A3]/30
                  flex
                  items-center
                  justify-center
                  shrink-0
                "
              >
                <MessageCircle
                  size={25}
                  strokeWidth={2}
                  className="text-[#35C6CF]"
                />
              </div>

              <div>
                <h3 className="text-white font-semibold text-sm sm:text-base">
                  24/7 Support
                </h3>

                <p className="text-white/65 text-xs sm:text-sm mt-1">
                  Quick reply on WhatsApp
                </p>
              </div>

            </div>


            {/* ================= ONLINE PAYMENT ================= */}
            <div className="flex items-center gap-4 py-6 lg:py-7">

              <div
                className="
                  w-12
                  h-12
                  rounded-xl
                  bg-[#0795A3]/15
                  border
                  border-[#0795A3]/30
                  flex
                  items-center
                  justify-center
                  shrink-0
                "
              >
                <CreditCard
                  size={25}
                  strokeWidth={2}
                  className="text-[#35C6CF]"
                />
              </div>

              <div>
                <h3 className="text-white font-semibold text-sm sm:text-base">
                  Online Payment
                </h3>

                <p className="text-white/65 text-xs sm:text-sm mt-1">
                  Pay easily via UPI / Cards
                </p>
              </div>

            </div>


            {/* ================= FAST DELIVERY ================= */}
            <div className="flex items-center gap-4 py-6 lg:py-7">

              <div
                className="
                  w-12
                  h-12
                  rounded-xl
                  bg-[#0795A3]/15
                  border
                  border-[#0795A3]/30
                  flex
                  items-center
                  justify-center
                  shrink-0
                "
              >
                <Clock
                  size={25}
                  strokeWidth={2}
                  className="text-[#35C6CF]"
                />
              </div>

              <div>
                <h3 className="text-white font-semibold text-sm sm:text-base">
                  Fast Delivery
                </h3>

                <p className="text-white/65 text-xs sm:text-sm mt-1">
                  Delivered within 2–4 days
                </p>
              </div>

            </div>

          </div>

        </div>
      </section>


      {/* ========================================================= */}
      {/* SCROLL TO TOP                                             */}
      {/* ========================================================= */}

      <button
        aria-label="Back to top"
        onClick={scrollToTop}
        className="
          fixed
          bottom-5
          right-5
          z-40
          w-11
          h-11
          rounded-full
          bg-white
          text-[#123B63]
          border
          border-gray-200
          shadow-lg
          flex
          items-center
          justify-center
          hover:bg-[#F0FAFA]
          hover:text-[#0795A3]
          transition-all
          duration-300
        "
      >
        <ChevronUp size={19} />
      </button>
    </>
  );
};

export default Footer;