import { useEffect, useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import {
  Mail,
  Phone,
  MessageCircle,
  Clock,
} from "lucide-react";
import { getApiBaseUrl, fetchJsonDeduplicated, fetchCategoriesDeduplicated } from "../utils/api";

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

interface Category {
  id: string;
  name: string;
  isActive?: boolean;
}

const DEFAULT_CONTACT: Required<ContactSettings> = {
  supportEmail: "help@liveazy.in",
  supportPhone: "919423838109",
  serviceLocations: "Pune, Bangalore, Mumbai, Delhi NCR, Hyderabad",
  supportHours: "Mon - Sat: 9:30 AM - 7:30 PM",
};

function normalizeWhatsAppNumber(raw: string): string {
  const digits = raw.replace(/\D/g, "");
  if (!digits) return "";
  if (digits.length === 10) return `91${digits}`;
  if (digits.length === 11 && digits.startsWith("0")) return `91${digits.slice(1)}`;
  if (digits.length >= 10 && digits.length <= 15) return digits;
  return "";
}

function FacebookIcon({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg className={className} fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path
        fillRule="evenodd"
        d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z"
        clipRule="evenodd"
      />
    </svg>
  );
}

function InstagramIcon({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg className={className} fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path
        fillRule="evenodd"
        d="M12.315 2c2.43 0 2.784.013 3.808.06 1.064.049 1.791.218 2.427.465a4.902 4.902 0 011.772 1.153 4.902 4.902 0 011.153 1.772c.247.636.416 1.363.465 2.427.048 1.067.06 1.407.06 4.123v.08c0 2.643-.012 2.987-.06 4.043-.049 1.064-.218 1.791-.465 2.427a4.902 4.902 0 01-1.153 1.772 4.902 4.902 0 01-1.772 1.153c-.636.247-1.363.416-2.427.465-1.067.048-1.407.06-4.123.06h-.08c-2.643 0-2.987-.012-4.043-.06-1.064-.049-1.791-.218-2.427-.465a4.902 4.902 0 01-1.772-1.153 4.902 4.902 0 01-1.153-1.772c-.247-.636-.416-1.363-.465-2.427-.047-1.024-.06-1.379-.06-3.808v-.63c0-2.43.013-2.784.06-3.808.049-1.064.218-1.791.465-2.427a4.902 4.902 0 011.153-1.772A4.902 4.902 0 015.45 2.525c.636-.247 1.363-.416 2.427-.465C8.901 2.013 9.256 2 11.685 2h.63zm-.081 1.802h-.468c-2.456 0-2.784.011-3.807.058-.975.045-1.504.207-1.857.344-.467.182-.8.398-1.15.748-.35.35-.566.683-.748 1.15-.137.353-.3.882-.344 1.857-.047 1.023-.058 1.351-.058 3.807v.468c0 2.456.011 2.784.058 3.807.045.975.207 1.504.344 1.857.182.466.399.8.748 1.15.35.35.683.566 1.15.748.353.137.882.3 1.857.344 1.054.048 1.37.058 4.041.058h.08c2.597 0 2.917-.01 3.96-.058.976-.045 1.505-.207 1.858-.344.466-.182.8-.398 1.15-.748.35-.35.566-.683.748-1.15.137-.353.3-.882.344-1.857.048-1.055.058-1.37.058-4.041v-.08c0-2.597-.01-2.917-.058-3.96-.045-.976-.207-1.505-.344-1.858a3.097 3.097 0 00-.748-1.15 3.098 3.098 0 00-1.15-.748c-.353-.137-.882-.3-1.857-.344-1.023-.047-1.351-.058-3.807-.058zM12 6.865a5.135 5.135 0 110 10.27 5.135 5.135 0 010-10.27zm0 1.802a3.333 3.333 0 100 6.666 3.333 3.333 0 000-6.666zm5.338-3.205a1.2 1.2 0 110 2.4 1.2 1.2 0 010-2.4z"
        clipRule="evenodd"
      />
    </svg>
  );
}

function YouTubeIcon({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg className={className} fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
    </svg>
  );
}

export default function Footer() {
  const navigate = useNavigate();
  const location = useLocation();

  const [contact, setContact] = useState<ContactSettings>(DEFAULT_CONTACT);
  const [social, setSocial] = useState<SocialSettings>({});
  const [categories, setCategories] = useState<Category[]>([]);

  const handleSectionClick = (
    e: React.MouseEvent<HTMLAnchorElement>,
    sectionId: string
  ) => {
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) {
      return;
    }
    e.preventDefault();
    const cleanId = sectionId.replace(/^#/, "");

    if (location.pathname === "/") {
      const el = document.getElementById(cleanId);
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "start" });
        window.history.pushState(null, "", `/#${cleanId}`);
      } else {
        window.location.hash = cleanId;
      }
    } else {
      navigate(`/#${cleanId}`);
    }
  };

  useEffect(() => {
    let cancelled = false;
    const apiBaseUrl = getApiBaseUrl();

    async function loadSettings() {
      try {
        const contactData = await fetchJsonDeduplicated<ContactSettings>(
          `${apiBaseUrl}/contact-settings`
        );
        if (!cancelled && contactData) {
          setContact((prev) => ({ ...prev, ...contactData }));
        }
      } catch (e) {
        console.warn("Using default contact settings in footer:", e);
      }

      try {
        const socialData = await fetchJsonDeduplicated<SocialSettings>(
          `${apiBaseUrl}/settings/social`
        );
        if (!cancelled && socialData) {
          setSocial(socialData);
        }
      } catch (e) {
        console.warn("Using default social settings in footer:", e);
      }

      try {
        const catRes = await fetchCategoriesDeduplicated(apiBaseUrl);
        let list: Category[] = [];
        if (Array.isArray(catRes)) {
          list = catRes as Category[];
        } else if (catRes && typeof catRes === "object" && "data" in catRes && Array.isArray((catRes as { data: unknown }).data)) {
          list = (catRes as { data: Category[] }).data;
        }
        if (!cancelled) {
          setCategories(list.filter((c) => c.isActive !== false));
        }
      } catch (e) {
        console.warn("Using fallback categories in footer:", e);
      }
    }

    void loadSettings();
    return () => {
      cancelled = true;
    };
  }, []);

  const rawPhone = social.whatsappNumber || contact.supportPhone || DEFAULT_CONTACT.supportPhone;
  const normalizedPhone = normalizeWhatsAppNumber(rawPhone);
  const waUrl = normalizedPhone ? `https://wa.me/${normalizedPhone}` : "https://wa.me/917061460429";

  return (
    <footer className="bg-[#001F47] text-[#CBDCE6] pt-14 pb-8 text-xs sm:text-[13px] border-t border-[#002B62]">
      <div className="ref-container">
        {/* Top Columns Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-8 sm:gap-10 pb-10 border-b border-[#002B62]">
          {/* Brand Info */}
          <div className="lg:col-span-2 space-y-4">
            <Link to="/" className="inline-flex items-center group">
              <div className="bg-white rounded-xl px-3 py-1.5 shadow-md">
                <img
                  src="/liveazy-logo-cropped.png"
                  alt="LIVEAZY Furniture Rental"
                  className="h-8 sm:h-9 w-auto object-contain"
                />
              </div>
            </Link>

            <p className="text-[#9ca3af] leading-relaxed text-xs sm:text-sm max-w-sm">
              India&apos;s trusted brand for renting solid wood furniture &amp; smart appliances. Flexible tenures, free doorstep delivery, setup, and relocation across Pune and metropolitan India.
            </p>

            <div className="pt-2">
              <a
                href={waUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-xl bg-[#166634] px-4 py-2.5 text-xs font-bold text-white shadow-md transition hover:bg-[#12532a]"
              >
                <MessageCircle size={16} />
                <span>Chat on WhatsApp</span>
              </a>
            </div>

            <div className="space-y-1.5 text-xs text-[#9ca3af] pt-1">
              <div className="flex items-center gap-2">
                <Mail size={13} className="text-gray-400" />
                <span>{contact.supportEmail || DEFAULT_CONTACT.supportEmail}</span>
              </div>
              <div className="flex items-center gap-2">
                <Phone size={13} className="text-gray-400" />
                <span>{contact.supportPhone || "+91 94238 38109"}</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock size={13} className="text-gray-400" />
                <span>{contact.supportHours || DEFAULT_CONTACT.supportHours}</span>
              </div>
            </div>
          </div>

          {/* Dynamic Database Categories Column */}
          <div className="space-y-3">
            <h4 className="text-sm font-bold text-white uppercase tracking-wider">
              Rent by Category
            </h4>
            <ul className="space-y-2 text-[#9ca3af]">
              {categories.slice(0, 6).map((cat) => (
                <li key={cat.id}>
                  <a
                    href="/#trending"
                    onClick={(e) => handleSectionClick(e, "trending")}
                    className="hover:text-white transition"
                  >
                    {cat.name}
                  </a>
                </li>
              ))}
              {categories.length === 0 && (
                <>
                  <li>
                    <a
                      href="/#trending"
                      onClick={(e) => handleSectionClick(e, "trending")}
                      className="hover:text-white transition"
                    >
                      Living Room
                    </a>
                  </li>
                  <li>
                    <a
                      href="/#trending"
                      onClick={(e) => handleSectionClick(e, "trending")}
                      className="hover:text-white transition"
                    >
                      Bedroom
                    </a>
                  </li>
                  <li>
                    <a
                      href="/#trending"
                      onClick={(e) => handleSectionClick(e, "trending")}
                      className="hover:text-white transition"
                    >
                      Electronics
                    </a>
                  </li>
                  <li>
                    <a
                      href="/#trending"
                      onClick={(e) => handleSectionClick(e, "trending")}
                      className="hover:text-white transition"
                    >
                      Study Room
                    </a>
                  </li>
                </>
              )}
            </ul>
          </div>

          {/* Featured Rental Solutions */}
          <div className="space-y-3">
            <h4 className="text-sm font-bold text-white uppercase tracking-wider">
              Rental Benefits
            </h4>
            <ul className="space-y-2 text-[#9ca3af]">
              <li><span className="text-gray-400">Zero Security Deposit</span></li>
              <li><span className="text-gray-400">Free Doorstep Delivery</span></li>
              <li><span className="text-gray-400">Professional Assembly</span></li>
              <li><span className="text-gray-400">Free Relocation Service</span></li>
              <li><span className="text-gray-400">Damage Waiver Included</span></li>
              <li><span className="text-gray-400">Annual Product Upgrades</span></li>
            </ul>
          </div>

          {/* Company */}
          <div className="space-y-3">
            <h4 className="text-sm font-bold text-white uppercase tracking-wider">
              Company
            </h4>
            <ul className="space-y-2 text-[#9ca3af]">
              <li>
                <a
                  href="/#about"
                  onClick={(e) => handleSectionClick(e, "about")}
                  className="hover:text-white transition"
                >
                  About Us
                </a>
              </li>
              <li><Link to="/wishlist" className="hover:text-white transition">My Wishlist</Link></li>
              <li><Link to="/blogs" className="hover:text-white transition">Blog &amp; Inspirations</Link></li>
              <li><Link to="/contact" className="hover:text-white transition">Contact Support</Link></li>
              <li>
                <a
                  href="/#how-it-works"
                  onClick={(e) => handleSectionClick(e, "how-it-works")}
                  className="hover:text-white transition"
                >
                  How it Works
                </a>
              </li>
              <li>
                <a
                  href="/#deals"
                  onClick={(e) => handleSectionClick(e, "deals")}
                  className="hover:text-white transition"
                >
                  Flash Deals
                </a>
              </li>
            </ul>
          </div>

          {/* Policies & Help */}
          <div className="space-y-3">
            <h4 className="text-sm font-bold text-white uppercase tracking-wider">
              Policies &amp; Help
            </h4>
            <ul className="space-y-2 text-[#9ca3af]">
              <li>
                <a
                  href="/#faqs"
                  onClick={(e) => handleSectionClick(e, "faqs")}
                  className="hover:text-white transition"
                >
                  Frequently Asked Questions
                </a>
              </li>
              <li><Link to="/contact" className="hover:text-white transition">Rental Terms &amp; Conditions</Link></li>
              <li><Link to="/contact" className="hover:text-white transition">Privacy Policy</Link></li>
              <li><Link to="/contact" className="hover:text-white transition">Damage Waiver Policy</Link></li>
              <li><Link to="/contact" className="hover:text-white transition">Free Relocation Guide</Link></li>
            </ul>
          </div>
        </div>

        {/* Footer Bottom */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[#CBDCE6]">
          <div>
            &copy; {new Date().getFullYear()} LIVEAZY Furniture India Pvt. Ltd. All Rights Reserved.
          </div>

          {/* Social Icons (Dynamic Backend Settings) */}
          <div className="flex items-center gap-3">
            {social.facebookUrl && (
              <a
                href={social.facebookUrl}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Facebook"
                className="flex h-8 w-8 items-center justify-center rounded-full bg-[#002B62] text-gray-200 transition hover:bg-[#007C8A] hover:text-white"
              >
                <FacebookIcon className="h-4 w-4" />
              </a>
            )}

            {social.instagramUrl && (
              <a
                href={social.instagramUrl}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Instagram"
                className="flex h-8 w-8 items-center justify-center rounded-full bg-[#002B62] text-gray-200 transition hover:bg-[#e1306c] hover:text-white"
              >
                <InstagramIcon className="h-4 w-4" />
              </a>
            )}

            {social.youtubeUrl && (
              <a
                href={social.youtubeUrl}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="YouTube"
                className="flex h-8 w-8 items-center justify-center rounded-full bg-[#002B62] text-gray-200 transition hover:bg-[#ff0000] hover:text-white"
              >
                <YouTubeIcon className="h-4 w-4" />
              </a>
            )}

            {normalizedPhone && (
              <a
                href={`https://wa.me/${normalizedPhone}`}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="WhatsApp"
                className="flex h-8 w-8 items-center justify-center rounded-full bg-[#002B62] text-gray-200 transition hover:bg-[#166634] hover:text-white"
              >
                <MessageCircle size={16} />
              </a>
            )}
          </div>
        </div>
      </div>
    </footer>
  );
}
