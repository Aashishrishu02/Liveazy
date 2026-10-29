
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

interface SocialSettings {
  facebookUrl?: string;
  instagramUrl?: string;
  youtubeUrl?: string;
  whatsappNumber?: string;
}

const DEFAULT_CONTACT: Required<ContactSettings> = {
  supportEmail: "help@liveazy.in",
  supportPhone: "919423838109",
  serviceLocations: "Pune & PCMC",
  supportHours: "Contact us for current support hours",
};

function normalizeWhatsAppNumber(raw: string): string {
  const digits = raw.replace(/\D/g, "");

  if (!digits) return "";

  if (digits.length === 10) {
    return `91${digits}`;
  }

  if (digits.length === 11 && digits.startsWith("0")) {
    return `91${digits.slice(1)}`;
  }

  if (digits.length >= 10 && digits.length <= 15) {
    return digits;
  }

  return "";
}

function FacebookIcon({
  className = "h-4 w-4",
}: {
  className?: string;
}) {
  return (
    <svg
      className={className}
      fill="currentColor"
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <path
        fillRule="evenodd"
        d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z"
        clipRule="evenodd"
      />
    </svg>
  );
}

function InstagramIcon({
  className = "h-4 w-4",
}: {
  className?: string;
}) {
  return (
    <svg
      className={className}
      fill="currentColor"
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <path
        fillRule="evenodd"
        d="M12.315 2c2.43 0 2.784.013 3.808.06 1.064.049 1.791.218 2.427.465a4.902 4.902 0 011.772 1.153 4.902 4.902 0 011.153 1.772c.247.636.416 1.363.465 2.427.048 1.067.06 1.407.06 4.123v.08c0 2.643-.012 2.987-.06 4.043-.049 1.064-.218 1.791-.465 2.427a4.902 4.902 0 01-1.153 1.772 4.902 4.902 0 01-1.772 1.153c-.636.247-1.363.416-2.427.465-1.067.048-1.407.06-4.123.06h-.08c-2.643 0-2.987-.012-4.043-.06-1.064-.049-1.791-.218-2.427-.465a4.902 4.902 0 01-1.772-1.153 4.902 4.902 0 01-1.153-1.772c-.247-.636-.416-1.363-.465-2.427-.047-1.024-.06-1.379-.06-3.808v-.63c0-2.43.013-2.784.06-3.808.049-1.064.218-1.791.465-2.427a4.902 4.902 0 011.153-1.772A4.902 4.902 0 015.45 2.525c.636-.247 1.363-.416 2.427-.465C8.901 2.013 9.256 2 11.685 2h.63zm-.081 1.802h-.468c-2.456 0-2.784.011-3.807.058-.975.045-1.504.207-1.857.344-.467.182-.8.398-1.15.748-.35.35-.566.683-.748 1.15-.137.353-.3.882-.344 1.857-.047 1.023-.058 1.351-.058 3.807v.468c0 2.456.011 2.784.058 3.807.045.975.207 1.504.344 1.857.182.466.399.8.748 1.15.35.35.683.566 1.15.748.353.137.882.3 1.857.344 1.054.048 1.37.058 4.041.058h.08c2.597 0 2.917-.01 3.96-.058.976-.045 1.505-.207 1.858-.344.466-.182.8-.398 1.15-.748.35-.35.566-.683.748-1.15.137-.353.3-.882.344-1.857.048-1.055.058-1.37.058-4.041v-.08c0-2.597-.01-2.917-.058-3.96-.045-.976-.207-1.505-.344-1.858a3.097 3.097 0 00-.748-1.15 3.098 3.098 0 00-1.15-.748c-.353-.137-.882-.3-1.857-.344-1.023-.047-1.351-.058-3.807-.058zM12 6.865a5.135 5.135 0 110 10.27 5.135 5.135 0 010-10.27zm0 1.802a3.333 3.333 0 100 6.666 3.333 3.333 0 000-6.666zm5.338-3.205a1.2 1.2 0 110 2.4 1.2 1.2 0 010-2.4z"
        clipRule="evenodd"
      />
    </svg>
  );
}

function YouTubeIcon({
  className = "h-4 w-4",
}: {
  className?: string;
}) {
  return (
    <svg
      className={className}
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
    >
      <path d="M23.5 6.2a3 3 0 0 0-2.1-2.1C19.5 3.6 12 3.6 12 3.6s-7.5 0-9.4.5A3 3 0 0 0 .5 6.2 31 31 0 0 0 0 12a31 31 0 0 0 .5 5.8 3 3 0 0 0 2.1 2.1c1.9.5 9.4.5 9.4.5s7.5 0 9.4-.5a3 3 0 0 0 2.1-2.1A31 31 0 0 0 24 12a31 31 0 0 0-.5-5.8ZM9.6 15.6V8.4l6.3 3.6-6.3 3.6Z" />
    </svg>
  );
}

function WhatsAppIcon({
  className = "h-4 w-4",
}: {
  className?: string;
}) {
  return (
    <svg
      className={className}
      fill="currentColor"
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <path
        fillRule="evenodd"
        d="M12 2C6.477 2 2 6.477 2 12c0 1.892.525 3.663 1.438 5.18L2 22l4.985-1.408A9.957 9.957 0 0012 22c5.523 0 10-4.477 10-10S17.523 2 12 2zm5.42 14.15c-.23.65-1.15 1.24-1.6 1.28-.42.04-.96.06-2.78-.69-2.33-.96-3.83-3.32-3.95-3.48-.12-.16-.95-1.26-.95-2.4 0-1.14.6-1.7.81-1.93.22-.23.48-.29.64-.29.16 0 .32 0 .46.01.15.01.35-.06.55.42.2.48.69 1.68.75 1.8.06.12.1.26.02.42-.08.16-.12.26-.24.4-.12.14-.25.31-.36.42-.12.12-.25.31-.1.5.14.25.62 1.02 1.33 1.65.91.81 1.68 1.06 1.93 1.18.25.12.4.1.55-.07.15-.17.64-.75.81-1.01.17-.26.34-.22.57-.13.23.09 1.46.69 1.71.81.25.12.42.18.48.28.06.1-.17.58-.17 1.23z"
        clipRule="evenodd"
      />
    </svg>
  );
}

export default function Footer() {
  const [contact, setContact] =
    useState<Required<ContactSettings>>(DEFAULT_CONTACT);

  const [socialSettings, setSocialSettings] =
    useState<SocialSettings>({});

  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    let cancelled = false;

    const fetchAllSettings = async () => {
      const base = getApiBaseUrl();

      try {
        const contactData =
          await fetchJsonDeduplicated<ContactSettings>(
            `${base}/contact-settings`,
          );

        if (!cancelled && contactData) {
          setContact({
            supportEmail:
              contactData.supportEmail ||
              DEFAULT_CONTACT.supportEmail,
            supportPhone:
              contactData.supportPhone ||
              DEFAULT_CONTACT.supportPhone,
            serviceLocations:
              contactData.serviceLocations ||
              DEFAULT_CONTACT.serviceLocations,
            supportHours:
              contactData.supportHours ||
              DEFAULT_CONTACT.supportHours,
          });
        }
      } catch (error) {
        if (
          !cancelled &&
          !(error instanceof Error && error.name === "AbortError")
        ) {
          console.error(
            "Failed to fetch contact settings in Footer:",
            error,
          );
        }
      }

      try {
        const socialData =
          await fetchJsonDeduplicated<SocialSettings>(
            `${base}/settings/social`,
          );

        if (!cancelled && socialData) {
          setSocialSettings({
            facebookUrl: socialData.facebookUrl || "",
            instagramUrl: socialData.instagramUrl || "",
            youtubeUrl: socialData.youtubeUrl || "",
            whatsappNumber: socialData.whatsappNumber || "",
          });
        }
      } catch (error) {
        if (
          !cancelled &&
          !(error instanceof Error && error.name === "AbortError")
        ) {
          console.error(
            "Failed to fetch social media settings in Footer:",
            error,
          );
        }
      }
    };

    void fetchAllSettings();

    return () => {
      cancelled = true;
    };
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const navigateToSection = (
    section: "about" | "products" | "categories" | "faqs",
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

  const configuredWhatsapp =
    socialSettings.whatsappNumber?.trim() || "";

  const normalizedSocialWhatsapp =
    normalizeWhatsAppNumber(configuredWhatsapp);

  const socialWhatsappUrl = normalizedSocialWhatsapp
    ? `https://wa.me/${normalizedSocialWhatsapp}`
    : undefined;

  const fallbackWhatsapp =
    normalizeWhatsAppNumber(contact.supportPhone || "");

  const chatWhatsappUrl =
    socialWhatsappUrl ||
    (fallbackWhatsapp
      ? `https://wa.me/${fallbackWhatsapp}`
      : undefined);

  const contactPhoneDigits =
    contact.supportPhone.replace(/\D/g, "");

  const hasFacebook =
    Boolean(socialSettings.facebookUrl?.trim());

  const hasInstagram =
    Boolean(socialSettings.instagramUrl?.trim());

  const hasYouTube =
    Boolean(socialSettings.youtubeUrl?.trim());

  const hasWhatsApp =
    Boolean(configuredWhatsapp && socialWhatsappUrl);

  const hasAnySocial =
    hasFacebook || hasInstagram || hasYouTube || hasWhatsApp;

  return (
    <footer className="relative border-t border-slate-200 bg-[#071D33] text-white">
      <div className="mx-auto max-w-7xl px-5 py-12 sm:px-8 lg:py-14">
        <div className="grid grid-cols-1 gap-10 sm:grid-cols-2 lg:grid-cols-4">
          {/* Brand & Socials */}
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
              Rent smarter, live better. Find the right products
              for your space with flexible rental options from LIVEAZY.
            </p>

            <button
              type="button"
              onClick={() => navigateToSection("categories")}
              className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-[#42DADA] transition hover:text-white"
            >
              Explore rentals <ArrowRight size={16} />
            </button>

            {/* Social Media Links */}
            {hasAnySocial && (
              <div className="mt-6 border-t border-white/10 pt-5">
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                  Follow Us
                </p>

                <div className="mt-3 flex items-center gap-2.5">
                  {hasFacebook && (
                    <a
                      href={socialSettings.facebookUrl?.trim()}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label="Follow LIVEAZY on Facebook"
                      className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/10 text-slate-300 transition duration-200 hover:bg-[#42DADA] hover:text-[#071D33]"
                    >
                      <FacebookIcon className="h-4 w-4" />
                    </a>
                  )}

                  {hasInstagram && (
                    <a
                      href={socialSettings.instagramUrl?.trim()}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label="Follow LIVEAZY on Instagram"
                      className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/10 text-slate-300 transition duration-200 hover:bg-[#42DADA] hover:text-[#071D33]"
                    >
                      <InstagramIcon className="h-4 w-4" />
                    </a>
                  )}

                  {hasYouTube && (
                    <a
                      href={socialSettings.youtubeUrl?.trim()}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label="Subscribe to LIVEAZY on YouTube"
                      className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/10 text-slate-300 transition duration-200 hover:bg-[#42DADA] hover:text-[#071D33]"
                    >
                      <YouTubeIcon className="h-4 w-4" />
                    </a>
                  )}

                  {hasWhatsApp && socialWhatsappUrl && (
                    <a
                      href={socialWhatsappUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label="Chat with LIVEAZY on WhatsApp"
                      className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/10 text-slate-300 transition duration-200 hover:bg-[#42DADA] hover:text-[#071D33]"
                    >
                      <WhatsAppIcon className="h-4 w-4" />
                    </a>
                  )}
                </div>
              </div>
            )}
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
                  href={
                    contactPhoneDigits
                      ? `tel:+${contactPhoneDigits}`
                      : undefined
                  }
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

            {chatWhatsappUrl && (
              <a
                href={chatWhatsappUrl}
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
              Have questions about products, rental plans, delivery,
              or existing enquiries? Our support team is here to help.
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
          <p>
            © {new Date().getFullYear()} LIVEAZY. All rights reserved.
          </p>

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
