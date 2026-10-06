import React from "react";
import { ChevronUp } from "lucide-react";

export const Footer: React.FC = () => {
  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  return (
    <>
      {/* Scroll To Top Button */}
      <button
        aria-label="Back to top"
        onClick={scrollToTop}
        className="
          fixed
          bottom-5
          right-5
          z-40
          bg-white
          hover:bg-[#F0FAFA]
          text-[#123B63]
          hover:text-[#0795A3]
          border
          border-gray-200
          w-11
          h-11
          rounded-full
          shadow-lg
          flex
          items-center
          justify-center
          transition
          duration-300
        "
      >
        <ChevronUp size={19} />
      </button>
    </>
  );
};

export default Footer;