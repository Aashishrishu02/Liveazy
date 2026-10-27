import React, { useEffect, useState } from "react";
import {
  ArrowRight,
  CalendarClock,
  CheckCircle2,
  ChevronRight,
  Headphones,
  HelpCircle,
  LifeBuoy,
  Mail,
  MapPin,
  MessageCircle,
  Phone,
  RefreshCw,
  Send,
  ShieldCheck,
  Truck,
  Wrench,
  type LucideIcon,
} from "lucide-react";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { fetchJsonDeduplicated } from "../utils/api";

const API_URL = import.meta.env.VITE_API_URL;

interface ContactUsProps {
  onSearchSubmit?: (query: string) => void;
}

interface ContactPageSettings {
  pageTitle: string;
  pageDescription: string;
  supportEmail: string;
  supportPhone: string;
  serviceLocations: string;
  supportHours: string;
}

interface FaqItem {
  id?: string;
  label?: string;
  question: string;
  answer: string;
  foot?: string | null;
  iconName?: string;
  isActive?: boolean;
  sortOrder?: number;
}

interface EnquiryPayload {
  fullName: string;
  email: string;
  phone: string;
  category: string;
  message: string;
}

const DEFAULT_SETTINGS: ContactPageSettings = {
  pageTitle: "We're Here to Help",
  pageDescription:
    "Whether you have questions about rental tenures, delivery and assembly schedules, verification, or need help selecting the right furniture for your home, our team is here to help.",
  supportEmail: "help@liveazy.in",
  supportPhone: "919423838109",
  serviceLocations: "Pune & PCMC",
  supportHours: "Contact us for current support hours",
};

// Shown only if the FAQ endpoint is temporarily unavailable or returns no FAQs.
const FALLBACK_FAQS: FaqItem[] = [
  {
    label: "SECURITY DEPOSIT",
    question: "How does the security deposit work?",
    answer:
      "Your rental plan and verification status determine the applicable deposit. Our support team can explain the amount before you confirm your rental.",
    foot: "Know the amount before confirming",
    iconName: "shield-check",
    sortOrder: 1,
  },
  {
    label: "TURNAROUND",
    question: "How fast is delivery and assembly in my city?",
    answer:
      "Delivery timing depends on your location, product availability, and selected rental plan. Contact our team to check the current schedule for your area.",
    foot: "Delivery slots confirmed by our team",
    iconName: "truck",
    sortOrder: 2,
  },
  {
    label: "RELOCATION",
    question: "What happens if I relocate to another city?",
    answer:
      "Tell us your current and new locations. Our team will check service availability and help you understand the options for moving your rental.",
    foot: "Location availability needs confirmation",
    iconName: "map-pin",
    sortOrder: 3,
  },
  {
    label: "UPGRADES",
    question: "Can I swap or upgrade before my tenure ends?",
    answer:
      "Swap and upgrade options depend on your active plan, product availability, and applicable terms. Contact our rental advisor to review your options.",
    foot: "Options depend on your rental plan",
    iconName: "refresh-cw",
    sortOrder: 4,
  },
  {
    label: "HOLIDAY SUPPORT",
    question: "How do I contact support during holidays?",
    answer:
      "You can send an enquiry through WhatsApp or email at any time. Our team will respond during support hours or as soon as an advisor is available.",
    foot: "Send an enquiry anytime",
    iconName: "calendar-clock",
    sortOrder: 5,
  },
  {
    label: "MAINTENANCE",
    question: "What is included in maintenance?",
    answer:
      "Maintenance coverage depends on the product and rental terms. Contact us with your product details so our team can explain the available support.",
    foot: "Coverage depends on rental terms",
    iconName: "wrench",
    sortOrder: 6,
  },
];

const FAQ_ICONS: Record<string, LucideIcon> = {
  "shield-check": ShieldCheck,
  truck: Truck,
  "map-pin": MapPin,
  "refresh-cw": RefreshCw,
  "calendar-clock": CalendarClock,
  wrench: Wrench,
  "help-circle": HelpCircle,
  "life-buoy": LifeBuoy,
};

const formatPhone = (phone: string) => {
  const digits = phone.replace(/\D/g, "");
  if (!digits) return "Contact support";
  if (digits.startsWith("91") && digits.length === 12) {
    return `+91 ${digits.slice(2, 7)} ${digits.slice(7)}`;
  }
  if (digits.length === 10) {
    return `${digits.slice(0, 5)} ${digits.slice(5)}`;
  }
  return `+${digits}`;
};

const getErrorMessage = (body: unknown, fallback: string): string => {
  if (typeof body === "object" && body !== null && "message" in body) {
    const message = (body as { message?: unknown }).message;
    if (typeof message === "string") return message;
    if (Array.isArray(message)) return message.join(", ");
  }
  return fallback;
};

const ContactUs: React.FC<ContactUsProps> = ({ onSearchSubmit }) => {
  const [settings, setSettings] = useState<ContactPageSettings>(DEFAULT_SETTINGS);
  const [whatsappNumber, setWhatsappNumber] = useState("919423838109");
  const [faqs, setFaqs] = useState<FaqItem[]>([]);
  const [faqUsingFallback, setFaqUsingFallback] = useState(false);
  const [faqsLoading, setFaqsLoading] = useState(true);
  
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [inquiryCategory, setInquiryCategory] = useState("");
  const [message, setMessage] = useState("");
  const [consent, setConsent] = useState(true);

  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [submitSuccess, setSubmitSuccess] = useState("");
  const [savedEnquiry, setSavedEnquiry] = useState<EnquiryPayload | null>(null);

  // Public contact details are managed from the backend Contact Settings master.
  useEffect(() => {
    let cancelled = false;
    const controller = new AbortController();

    const fetchContactSettings = async () => {
      if (!API_URL) return;

      try {
        const data = await fetchJsonDeduplicated<Partial<ContactPageSettings>>(
          `${API_URL}/contact-settings`,
          { signal: controller.signal }
        );
        if (cancelled) return;

        setSettings((previous) => ({
          pageTitle: data.pageTitle ?? previous.pageTitle,
          pageDescription: data.pageDescription ?? previous.pageDescription,
          supportEmail: data.supportEmail ?? previous.supportEmail,
          supportPhone: data.supportPhone ?? previous.supportPhone,
          serviceLocations: data.serviceLocations ?? previous.serviceLocations,
          supportHours: data.supportHours ?? previous.supportHours,
        }));
      } catch (error) {
        if (controller.signal.aborted) return;
        console.error("Unable to load Contact Us settings:", error);
      }
    };

    void fetchContactSettings();
    return () => {
      cancelled = true;
      controller.abort();
    };
  }, []);

  // Keep WhatsApp number controlled by the existing WhatsApp Settings master.
  useEffect(() => {
    let cancelled = false;
    const controller = new AbortController();

    const fetchWhatsAppSettings = async () => {
      if (!API_URL) return;

      try {
        const data = await fetchJsonDeduplicated<{ whatsappNumber?: string }>(
          `${API_URL}/settings/whatsapp`,
          { signal: controller.signal }
        );
        if (!cancelled && data.whatsappNumber) {
          setWhatsappNumber(String(data.whatsappNumber).replace(/\D/g, ""));
        }
      } catch (error) {
        if (controller.signal.aborted) return;
        console.error("Unable to load WhatsApp contact settings:", error);
      }
    };

    void fetchWhatsAppSettings();
    return () => {
      cancelled = true;
      controller.abort();
    };
  }, []);

  // The public endpoint returns only active FAQs maintained in the FAQ Master.
  useEffect(() => {
    let cancelled = false;
    const controller = new AbortController();

    const fetchFaqs = async () => {
      if (!API_URL) {
        setFaqUsingFallback(true);
        setFaqsLoading(false);
        return;
      }

      try {
        const data = await fetchJsonDeduplicated<FaqItem[]>(
          `${API_URL}/faqs`,
          { signal: controller.signal }
        );
        if (cancelled) return;

        if (Array.isArray(data) && data.length > 0) {
          setFaqs(data);
          setFaqUsingFallback(false);
        } else {
          setFaqs([]);
          setFaqUsingFallback(false);
        }
      } catch (error) {
        if (controller.signal.aborted) return;
        console.error("Unable to load FAQs:", error);
        if (!cancelled) setFaqUsingFallback(true);
      } finally {
        if (!cancelled) {
          setFaqsLoading(false);
        }
      }
    };

    void fetchFaqs();
    return () => {
      cancelled = true;
      controller.abort();
    };
  }, []);

  const getWhatsAppUrl = (text: string) => {
    const digits = whatsappNumber.replace(/\D/g, "");
    const finalNumber = digits.length === 10 ? `91${digits}` : digits;
    return `https://wa.me/${finalNumber}?text=${encodeURIComponent(text)}`;
  };

  const openGeneralWhatsApp = () => {
    if (!whatsappNumber) {
      window.alert("WhatsApp support number is currently unavailable. Please email us.");
      return;
    }

    const text = "Hi LIVEAZY! I need help with a rental enquiry. Could you please assist me?";
    window.open(getWhatsAppUrl(text), "_blank", "noopener,noreferrer");
  };

  // Save the enquiry in PostgreSQL first. WhatsApp remains an optional next step.
  const handleSubmit = async (event: React.SyntheticEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitError("");
    setSubmitSuccess("");
    setSavedEnquiry(null);

    if (!consent) {
      setSubmitError("Please confirm that you agree to be contacted about this enquiry.");
      return;
    }

    if (!API_URL) {
      setSubmitError("The contact service is not configured. Please try again later or contact us on WhatsApp.");
      return;
    }

    const payload: EnquiryPayload = {
      fullName: fullName.trim(),
      email: email.trim(),
      phone: phone.trim(),
      category: inquiryCategory,
      message: message.trim(),
    };

    setSubmitting(true);

    try {
      const response = await fetch(`${API_URL}/contact-enquiries`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const responseBody: unknown = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(
          getErrorMessage(responseBody, "Unable to submit your enquiry. Please try again.")
        );
      }

      setSavedEnquiry(payload);
      setSubmitSuccess(
        "Your enquiry has been saved successfully. You can now continue to WhatsApp if you would like to contact our team there too."
      );
    } catch (error) {
      console.error("Contact enquiry submission failed:", error);
      setSubmitError(
        error instanceof Error
          ? error.message
          : "Unable to submit your enquiry. Please try again."
      );
    } finally {
      setSubmitting(false);
    }
  };

  const openSavedEnquiryOnWhatsApp = () => {
    if (!savedEnquiry || !whatsappNumber) {
      openGeneralWhatsApp();
      return;
    }

    const text = [
      "Hi LIVEAZY! I have submitted a rental enquiry on your website.",
      "",
      `Full Name: ${savedEnquiry.fullName}`,
      `Email: ${savedEnquiry.email}`,
      `Phone: ${savedEnquiry.phone}`,
      `Inquiry Category: ${savedEnquiry.category}`,
      "",
      "Enquiry Details:",
      savedEnquiry.message,
    ].join("\n");

    window.open(getWhatsAppUrl(text), "_blank", "noopener,noreferrer");
  };

  const phoneDigits = settings.supportPhone.replace(/\D/g, "");
  const displayFaqs = faqUsingFallback ? FALLBACK_FAQS : faqs;

  return (
    <div className="min-h-screen bg-[#F6F8FF] font-sans text-[#0F2942]">
      <Navbar onSearchSubmit={onSearchSubmit ?? (() => undefined)} />

      <main>
        <section className="mx-auto max-w-[1200px] px-4 pb-12 pt-5 sm:px-6 lg:px-8">
          {/* Breadcrumb */}
          <div className="mb-6 flex flex-wrap items-center justify-between gap-3 text-[11px] text-slate-500 sm:text-xs">
            <p>
              <a href="/" className="hover:text-[#008A90]">Home</a>
              <span className="mx-2">/</span>
              <span className="font-semibold text-[#0F2942]">Contact Us</span>
            </p>
            <span className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-1.5 font-medium shadow-sm">
              <span className="h-2 w-2 rounded-full bg-[#008A90]" />
              LIVEAZY Concierge · Support enquiries welcome
            </span>
          </div>

          {/* Dynamic page heading */}
          <div className="max-w-3xl">
            <span className="inline-flex items-center gap-2 rounded-full bg-[#DDEBFF] px-3 py-1.5 text-[10px] font-extrabold uppercase tracking-[0.12em] text-[#315D9B]">
              <Headphones size={13} /> LIVEAZY Concierge &amp; Support
            </span>
            <h1 className="mt-3 text-3xl font-extrabold tracking-tight text-[#071D33] sm:text-4xl lg:text-5xl">
              {settings.pageTitle}
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600 sm:text-base">
              {settings.pageDescription}
            </p>
          </div>

          {/* Contact channel cards */}
          <div className="mt-7 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <div className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#E5EEFF] text-[#315D9B]"><Mail size={18} /></div>
              <p className="mt-3 text-[9px] font-extrabold uppercase tracking-[0.14em] text-slate-400">Email assistance</p>
              <p className="mt-1 break-words text-sm font-bold text-[#0F2942]">{settings.supportEmail}</p>
              <p className="mt-1 min-h-10 text-[11px] leading-5 text-slate-500">Send your questions to our support inbox.</p>
              <a href={`mailto:${settings.supportEmail}`} className="mt-3 inline-flex items-center gap-1 text-xs font-bold text-[#008A90] hover:underline">Send Email <ArrowRight size={13} /></a>
            </div>

            <div className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#E5EEFF] text-[#315D9B]"><Phone size={18} /></div>
              <p className="mt-3 text-[9px] font-extrabold uppercase tracking-[0.14em] text-slate-400">Dedicated hotline</p>
              <p className="mt-1 text-sm font-bold text-[#0F2942]">{formatPhone(settings.supportPhone)}</p>
              <p className="mt-1 min-h-10 text-[11px] leading-5 text-slate-500">Call our team to discuss your rental enquiry.</p>
              <a href={phoneDigits ? `tel:+${phoneDigits}` : undefined} className="mt-3 inline-flex items-center gap-1 text-xs font-bold text-[#008A90] hover:underline">Call Now <ArrowRight size={13} /></a>
              <p className="mt-2 text-[10px] leading-4 text-slate-400">{settings.supportHours}</p>
            </div>

            <div className="rounded-2xl border border-[#A8EEEE] bg-[#E8FBFB] p-4 shadow-sm">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#42DADA] text-[#064E55]"><MessageCircle size={18} /></div>
              <p className="mt-3 text-[9px] font-extrabold uppercase tracking-[0.14em] text-[#008A90]">WhatsApp concierge</p>
              <p className="mt-1 text-sm font-bold text-[#0F2942]">Live Desk Chat</p>
              <p className="mt-1 min-h-10 text-[11px] leading-5 text-slate-600">Get help with product details, rental plans, and availability.</p>
              <button type="button" onClick={openGeneralWhatsApp} className="mt-3 flex w-full items-center justify-center gap-2 rounded-lg bg-[#006F73] px-3 py-2.5 text-xs font-bold text-white transition hover:bg-[#005B5E]"><MessageCircle size={14} /> Open WhatsApp Chat</button>
            </div>

            <div className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#E5EEFF] text-[#315D9B]"><MapPin size={18} /></div>
              <p className="mt-3 text-[9px] font-extrabold uppercase tracking-[0.14em] text-slate-400">Service locations</p>
              <p className="mt-1 text-sm font-bold text-[#0F2942]">{settings.serviceLocations}</p>
              <p className="mt-1 min-h-10 text-[11px] leading-5 text-slate-500">Service coverage depends on your location and product.</p>
              <span className="mt-3 inline-flex items-center gap-1 text-xs font-bold text-[#008A90]"><CheckCircle2 size={13} /> Check availability with us</span>
            </div>
          </div>

          {/* Contact form + live assistance */}
          <div className="mt-8 grid items-start gap-5 lg:grid-cols-[1.08fr_0.92fr]">
            <form onSubmit={handleSubmit} className="rounded-2xl border border-slate-100 bg-white p-5 shadow-md sm:p-7">
              <p className="text-[9px] font-extrabold uppercase tracking-[0.16em] text-[#008A90]">Direct inquiry form</p>
              <h2 className="mt-1 text-2xl font-extrabold tracking-tight text-[#071D33]">Send Us a Message</h2>
              <p className="mt-2 text-xs leading-5 text-slate-500">Submit this form to save your enquiry with our team. You can then choose to continue on WhatsApp too.</p>

              {submitError && (
                <div role="alert" className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-xs leading-5 text-red-700">
                  {submitError}
                </div>
              )}

              {submitSuccess && (
                <div role="status" className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-4 text-xs leading-5 text-emerald-800">
                  <p className="font-bold">Enquiry saved successfully</p>
                  <p className="mt-1">{submitSuccess}</p>
                  <button type="button" onClick={openSavedEnquiryOnWhatsApp} className="mt-3 inline-flex items-center gap-2 rounded-lg bg-[#006F73] px-3 py-2.5 font-bold text-white transition hover:bg-[#005B5E]">
                    <MessageCircle size={14} /> Continue on WhatsApp
                  </button>
                </div>
              )}

              <div className="mt-5 grid gap-4 sm:grid-cols-2">
                <label className="block text-xs font-bold text-[#0F2942]">Full Name *
                  <input value={fullName} onChange={(event) => setFullName(event.target.value)} required maxLength={100} autoComplete="name" placeholder="e.g. Rahul Sharma" className="mt-1.5 w-full rounded-lg border border-slate-200 bg-[#F3F6FF] px-3 py-3 text-xs font-normal outline-none transition focus:border-[#008A90] focus:bg-white" />
                </label>
                <label className="block text-xs font-bold text-[#0F2942]">Email Address *
                  <input type="email" value={email} onChange={(event) => setEmail(event.target.value)} required maxLength={160} autoComplete="email" placeholder="you@example.com" className="mt-1.5 w-full rounded-lg border border-slate-200 bg-[#F3F6FF] px-3 py-3 text-xs font-normal outline-none transition focus:border-[#008A90] focus:bg-white" />
                </label>
                <label className="block text-xs font-bold text-[#0F2942]">Phone Number *
                  <input type="tel" value={phone} onChange={(event) => setPhone(event.target.value)} required maxLength={30} autoComplete="tel" placeholder="+91 98765 43210" className="mt-1.5 w-full rounded-lg border border-slate-200 bg-[#F3F6FF] px-3 py-3 text-xs font-normal outline-none transition focus:border-[#008A90] focus:bg-white" />
                </label>
                <label className="block text-xs font-bold text-[#0F2942]">Inquiry Category *
                  <select value={inquiryCategory} onChange={(event) => setInquiryCategory(event.target.value)} required className="mt-1.5 w-full rounded-lg border border-slate-200 bg-[#F3F6FF] px-3 py-3 text-xs font-normal outline-none transition focus:border-[#008A90] focus:bg-white">
                    <option value="" disabled>Select reason for inquiry</option>
                    <option>Product availability</option>
                    <option>Rental tenure and pricing</option>
                    <option>Delivery and assembly</option>
                    <option>Deposit and verification</option>
                    <option>Existing rental support</option>
                    <option>Other</option>
                  </select>
                </label>
                <label className="block text-xs font-bold text-[#0F2942] sm:col-span-2">How Can We Help? *
                  <textarea value={message} onChange={(event) => setMessage(event.target.value)} required minLength={5} maxLength={3000} rows={4} placeholder="Tell us how we can help with your rental, delivery timing, product selection, or configuration..." className="mt-1.5 w-full resize-y rounded-lg border border-slate-200 bg-[#F3F6FF] px-3 py-3 text-xs font-normal leading-5 outline-none transition focus:border-[#008A90] focus:bg-white" />
                </label>
              </div>

              <label className="mt-4 flex cursor-pointer items-start gap-2 text-[10px] leading-4 text-slate-500">
                <input type="checkbox" checked={consent} onChange={(event) => setConsent(event.target.checked)} className="mt-0.5 accent-[#008A90]" />
                <span>I'm happy to be contacted about this enquiry. Submitting this form saves my enquiry with LIVEAZY; WhatsApp is optional.</span>
              </label>

              <button type="submit" disabled={submitting} className="mt-5 inline-flex items-center gap-2 rounded-xl bg-[#071D33] px-5 py-3 text-xs font-bold text-white shadow-sm transition hover:bg-[#008A90] disabled:cursor-not-allowed disabled:opacity-60">
                <Send size={14} />
                {submitting ? "Submitting enquiry..." : "Submit Message"}
                {!submitting && <ArrowRight size={13} />}
              </button>
            </form>

            <div className="space-y-4">
              <div className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-md">
                <div className="relative min-h-[210px] overflow-hidden bg-gradient-to-br from-[#0F2942] via-[#176B75] to-[#42DADA]">
                  <img src="https://images.unsplash.com/photo-1521737711867-e3b97375f902?auto=format&fit=crop&w=1200&q=80" alt="Customer support team discussing a request" className="absolute inset-0 h-full w-full object-cover opacity-55" loading="lazy" />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#061B2D]/90 via-[#061B2D]/15 to-transparent" />
                  <div className="relative flex min-h-[210px] flex-col justify-end p-5 text-white">
                    <span className="w-fit rounded-full bg-[#42DADA] px-2.5 py-1 text-[9px] font-extrabold uppercase tracking-wide text-[#064E55]">Concierge desk</span>
                    <h3 className="mt-3 text-xl font-extrabold">Need Immediate Assistance?</h3>
                    <p className="mt-1 max-w-md text-xs leading-5 text-white/85">Connect with our team for help with product selection, rental plans, and delivery questions.</p>
                  </div>
                </div>
                <div className="p-5">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-[9px] font-extrabold uppercase tracking-[0.14em] text-[#008A90]">Live channel</p>
                      <p className="mt-1 text-base font-extrabold text-[#0F2942]">Chat with us on WhatsApp</p>
                    </div>
                    <span className="rounded-full bg-[#E8F7F6] px-2.5 py-1 text-[9px] font-bold text-[#007B80]">Message us</span>
                  </div>
                  <p className="mt-2 text-xs leading-5 text-slate-500">A quick way to ask about product availability, rental tenure, deposits, or support.</p>
                  <button type="button" onClick={openGeneralWhatsApp} className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-[#006F73] px-4 py-3 text-xs font-extrabold text-white transition hover:bg-[#005B5E]"><MessageCircle size={15} /> Chat with Us on WhatsApp</button>
                  <div className="mt-4 space-y-2 border-t border-slate-100 pt-4 text-[10px] text-slate-500">
                    <p className="flex items-start gap-2"><ShieldCheck size={13} className="shrink-0 text-[#008A90]" /> Deposit and verification terms can be confirmed before you book.</p>
                    <p className="flex items-start gap-2"><Truck size={13} className="shrink-0 text-[#008A90]" /> Delivery and assembly schedules depend on location and availability.</p>
                    <p className="flex items-start gap-2"><CheckCircle2 size={13} className="shrink-0 text-[#008A90]" /> Our team can help you choose a suitable rental plan.</p>
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border border-[#D9E7FF] bg-[#EAF1FF] p-5">
                <div className="flex items-start gap-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white text-[#315D9B]"><LifeBuoy size={17} /></div>
                  <div>
                    <h3 className="text-sm font-extrabold text-[#0F2942]">Need a Dedicated Rental Advisor?</h3>
                    <p className="mt-2 text-xs leading-5 text-slate-600">Tell us your space, preferred products, and rental duration. Our team can help you explore suitable options.</p>
                    <button type="button" onClick={openGeneralWhatsApp} className="mt-3 inline-flex items-center gap-1 text-xs font-extrabold text-[#007B80] hover:underline">Ask for an advisor <ChevronRight size={14} /></button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* FAQs load from the FAQ Master API. */}
        <section
  id="faqs"
  className="scroll-mt-24 border-y border-[#E4EBFB] bg-[#EEF3FF] py-12 sm:py-16"
>
          <div className="mx-auto max-w-[1200px] px-4 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-2xl text-center">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-[#D7E7FF] px-3 py-1.5 text-[9px] font-extrabold uppercase tracking-[0.14em] text-[#315D9B]"><CheckCircle2 size={12} /> Instant clarity</span>
              <h2 className="mt-3 text-2xl font-extrabold tracking-tight text-[#071D33] sm:text-3xl">Frequently Asked Questions</h2>
              <p className="mt-2 text-xs leading-5 text-slate-500 sm:text-sm">Quick answers to common questions about booking, payments, delivery times, and rental tenures.</p>
            </div>

            {faqsLoading ? (
              <div
                role="status"
                aria-live="polite"
                className="mt-8 py-8 text-center text-sm text-slate-500"
              >
                Loading FAQs...
              </div>
            ) : displayFaqs.length > 0 ? (
              <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {displayFaqs.map((faq, index) => {
                  const Icon = FAQ_ICONS[(faq.iconName ?? "help-circle").toLowerCase()] ?? HelpCircle;
                  return (
                    <article key={faq.id ?? faq.question ?? index} className="rounded-2xl border border-white bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
                      <p className="flex items-center gap-2 text-[9px] font-extrabold uppercase tracking-[0.13em] text-[#008A90]"><Icon size={13} /> {faq.label || "GENERAL"}</p>
                      <h3 className="mt-3 text-sm font-extrabold leading-5 text-[#0F2942]">{faq.question}</h3>
                      <p className="mt-2 text-xs leading-5 text-slate-500">{faq.answer}</p>
                      {faq.foot && <p className="mt-4 border-t border-slate-100 pt-3 text-[10px] font-semibold text-slate-400">{faq.foot}</p>}
                    </article>
                  );
                })}
              </div>
            ) : (
              <div className="mt-8 rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center text-sm text-slate-500">
                FAQs will appear here when the administrator publishes them.
              </div>
            )}

            <div className="mt-7 flex flex-col gap-4 rounded-2xl bg-[#061B2D] p-5 text-white shadow-lg sm:flex-row sm:items-center sm:justify-between sm:px-7">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#163B51] text-[#42DADA]"><MessageCircle size={19} /></div>
                <div>
                  <h3 className="text-sm font-extrabold">Still have an unanswered question?</h3>
                  <p className="mt-1 text-[11px] leading-5 text-slate-300">Contact our team for help with rental options, delivery timing, and product details.</p>
                </div>
              </div>
              <button type="button" onClick={openGeneralWhatsApp} className="inline-flex shrink-0 items-center justify-center gap-2 rounded-lg bg-[#008A90] px-4 py-3 text-xs font-extrabold text-white transition hover:bg-[#00A0A6]"><MessageCircle size={14} /> Live WhatsApp Chat</button>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default ContactUs;
