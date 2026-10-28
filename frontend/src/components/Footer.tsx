import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  ArrowRight,
  ChevronUp,
  Clock,
  Mail,
  MapPin,
  MessageCircle,
  Phone,
} from "lucide-react";

import { getApiBaseUrl, fetchJsonDeduplicated } from "../utils/api";

interface ContactSettings {
  supportEmail?: string;
  supportPhone?: string;
  serviceLocations?: string;
  supportHours?: string;
}

const DEFAULT_CONTACT: Required<ContactSettings> = {
  supportEmail: "help@liveazy.in",
  supportPhone: "919423838109",
  serviceLocations: "Pune & PCMC",
  supportHours: "Contact us for current support hours",
};

export default function Footer() {
  const [contact, setContact] =
    useState<Required<ContactSettings>>(DEFAULT_CONTACT);

  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    let cancelled = false;

    const fetchContactSettings = async () => {
      try {
        const base = getApiBaseUrl();
        const data = await fetchJsonDeduplicated<ContactSettings>(`${base}/contact-settings`);

        if (!cancelled && data) {
          setContact({
            supportEmail:
              data.supportEmail || DEFAULT_CONTACT.supportEmail,
            supportPhone:
              data.supportPhone || DEFAULT_CONTACT.supportPhone,
            serviceLocations:
              data.serviceLocations || DEFAULT_CONTACT.serviceLocations,
            supportHours:
              data.supportHours || DEFAULT_CONTACT.supportHours,
          });
        }
      } catch (error) {
        if (!cancelled && !(error instanceof Error && error.name === "AbortError")) {
          // Fall back gracefully to default contact details
        }
      }
    };

    void fetchContactSettings();

    return () => {
      cancelled = true;
    };
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const navigateToSection = (
  section: "about" | "products" | "categories" | "faqs"
) => {
  if (section === "faqs") {
  if (location.pathname === "/contact") {
    window.setTimeout(() => {
      document.getElementById("faqs")?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }, 300);
  } else {
    navigate("/contact#faqs");
  }
  return;
}

  if (location.pathname === "/") {
    window.setTimeout(() => {
      document.getElementById(section)?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }, 0);
  } else {
    navigate(`/#${section}`);
  }
};

  

  const phoneDigits = contact.supportPhone.replace(/\D/g, "");
  const whatsappNumber =
    phoneDigits.length === 10 ? `91${phoneDigits}` : phoneDigits;
  const whatsappUrl = whatsappNumber
    ? `https://wa.me/${whatsappNumber}`
    : undefined;

  return (
    <footer className="relative border-t border-slate-200 bg-[#071D33] text-white">
      <div className="mx-auto max-w-7xl px-5 py-12 sm:px-8 lg:py-14">
        <div className="grid grid-cols-1 gap-10 sm:grid-cols-2 lg:grid-cols-4">
          {/* Brand */}
          <div>
            <Link
              to="/"
              aria-label="LIVEAZY home"
              className="inline-flex items-center gap-2"
            >
              <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#42DADA] text-lg font-black text-[#071D33]">
                L
              </span>
              <span className="text-2xl font-extrabold tracking-tight">
                LIVE<span className="text-[#42DADA]">AZY</span>
              </span>
            </Link>

            <p className="mt-4 max-w-xs text-sm leading-6 text-slate-300">
              Rent smarter, live better. Find the right products for your
              space with flexible rental options from LIVEAZY.
            </p>

            <button
              type="button"
              onClick={() => navigateToSection("categories")}
              className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-[#42DADA] transition hover:text-white"
            >
              Explore rentals <ArrowRight size={16} />
            </button>
          </div>

          {/* Quick links */}
          <div>
            <h3 className="text-sm font-bold uppercase tracking-wider">
              Quick Links
            </h3>
            <ul className="mt-5 space-y-3 text-sm text-slate-300">
              <li>
                <Link to="/" className="transition hover:text-[#42DADA]">
                  Home
                </Link>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => navigateToSection("categories")}
                  className="transition hover:text-[#42DADA]"
                >
                  Browse Rentals
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => navigateToSection("about")}
                  className="transition hover:text-[#42DADA]"
                >
                  About Us
                </button>
              </li>
              <li>
                <Link
                  to="/contact"
                  className="transition hover:text-[#42DADA]"
                >
                  Contact Us
                </Link>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => navigateToSection("faqs")}
                  className="transition hover:text-[#42DADA]"
                >
                  FAQs &amp; Support
                </button>
              </li>
            </ul>
          </div>

          {/* Contact information */}
          <div>
            <h3 className="text-sm font-bold uppercase tracking-wider">
              Contact Us
            </h3>
            <ul className="mt-5 space-y-4 text-sm text-slate-300">
              <li className="flex items-start gap-3">
                <Mail
                  size={18}
                  className="mt-0.5 shrink-0 text-[#42DADA]"
                />
                <a
                  href={`mailto:${contact.supportEmail}`}
                  className="break-all transition hover:text-[#42DADA]"
                >
                  {contact.supportEmail}
                </a>
              </li>
              <li className="flex items-start gap-3">
                <Phone
                  size={18}
                  className="mt-0.5 shrink-0 text-[#42DADA]"
                />
                <a
                  href={phoneDigits ? `tel:+${phoneDigits}` : undefined}
                  className="transition hover:text-[#42DADA]"
                >
                  {contact.supportPhone}
                </a>
              </li>
              <li className="flex items-start gap-3">
                <MapPin
                  size={18}
                  className="mt-0.5 shrink-0 text-[#42DADA]"
                />
                <span>{contact.serviceLocations}</span>
              </li>
              <li className="flex items-start gap-3">
                <Clock
                  size={18}
                  className="mt-0.5 shrink-0 text-[#42DADA]"
                />
                <span>{contact.supportHours}</span>
              </li>
            </ul>

            {whatsappUrl && (
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-5 inline-flex items-center gap-2 rounded-lg bg-[#087F75] px-4 py-2.5 text-sm font-semibold transition hover:bg-[#09988B]"
              >
                <MessageCircle size={17} />
                Chat on WhatsApp
              </a>
            )}
          </div>

          {/* Support */}
          <div>
            <h3 className="text-sm font-bold uppercase tracking-wider">
              FAQs &amp; Support
            </h3>
            <p className="mt-5 text-sm leading-6 text-slate-300">
              Have questions about products, rental plans, delivery, or
              existing enquiries? Our support team is here to help.
            </p>
            <button
              type="button"
              onClick={() => navigate("/contact")}
              className="mt-5 inline-flex items-center gap-2 rounded-lg border border-[#42DADA]/50 px-4 py-2.5 text-sm font-semibold text-[#42DADA] transition hover:bg-[#42DADA] hover:text-[#071D33]"
            >
              Visit Help Centre <ArrowRight size={16} />
            </button>
          </div>
        </div>

        <div className="mt-10 flex flex-col gap-3 border-t border-white/15 pt-6 text-xs text-slate-400 sm:flex-row sm:items-center sm:justify-between">
          <p>© {new Date().getFullYear()} LIVEAZY. All rights reserved.</p>
          <Link
            to="/contact"
            className="w-fit transition hover:text-[#42DADA]"
          >
            Need help? Contact our team
          </Link>
        </div>
      </div>

      <button
        type="button"
        aria-label="Back to top"
        onClick={scrollToTop}
        className="fixed bottom-5 right-5 z-40 flex h-11 w-11 items-center justify-center rounded-full border border-gray-200 bg-white text-[#123B63] shadow-lg transition duration-300 hover:bg-[#F0FAFA] hover:text-[#0795A3]"
      >
        <ChevronUp size={19} />
      </button>
    </footer>
  );
}
