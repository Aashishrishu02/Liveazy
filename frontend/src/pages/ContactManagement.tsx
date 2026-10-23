import { useCallback, useEffect, useState, type SyntheticEvent } from "react";
import { NavLink } from "react-router-dom";
import { LayoutDashboard,
  Tags,
  Armchair,
  Images,
  Megaphone,
  MessageCircle,
  Store,
  LogOut,
  Menu,
  X,
  Contact,
  HelpCircle,
  Inbox,
  Save,
  Plus,
  Trash2,
  RefreshCw,
  CheckCircle2,
  Clock3,
  Search, MessageSquareText, Star } from "lucide-react";
import { useNavigate } from "react-router-dom";

const API_URL = import.meta.env.VITE_API_URL;

type Tab = "settings" | "faqs" | "enquiries";
type EnquiryStatus = "PENDING" | "CONTACTED" | "RESOLVED";

interface ContactSettings {
  pageTitle: string;
  pageDescription: string;
  supportEmail: string;
  supportPhone: string;
  serviceLocations: string;
  supportHours: string;
}

interface Faq {
  id: string;
  label: string;
  question: string;
  answer: string;
  foot?: string | null;
  iconName: string;
  isActive: boolean;
  sortOrder: number;
}

interface Enquiry {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  category: string;
  message: string;
  status: EnquiryStatus;
  adminNotes?: string | null;
  createdAt: string;
}

const emptySettings: ContactSettings = {
  pageTitle: "We're Here to Help",
  pageDescription: "Contact LIVEAZY for help with rental plans, product availability, delivery, and support.",
  supportEmail: "help@liveazy.in",
  supportPhone: "919423838109",
  serviceLocations: "Pune & PCMC",
  supportHours: "Contact us for current support hours",
};

const navigation = [
  { label: "Dashboard", path: "/admin/dashboard", icon: LayoutDashboard },
  { label: "Categories", path: "/admin/categories", icon: Tags },
  { label: "Products", path: "/admin/products", icon: Armchair },
  { label: "Banners", path: "/admin/banner", icon: Images },
  { label: "Promo Banners", path: "/admin/promo-banners", icon: Megaphone },
  { label: "WhatsApp Settings", path: "/admin/settings", icon: MessageCircle },
  { label: "Contact Management", path: "/admin/contact-management", icon: Contact },
  { label: "Feedback Master", path: "/admin/feedback", icon: MessageSquareText },
  { label: "Trending Rentals", path: "/admin/trending-rentals", icon: Star },
];

const tabItems: { id: Tab; label: string; icon: typeof Contact }[] = [
  { id: "settings", label: "Contact Settings", icon: Contact },
  { id: "faqs", label: "FAQ Master", icon: HelpCircle },
  { id: "enquiries", label: "Contact Enquiries", icon: Inbox },
];

export default function ContactManagement() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<Tab>("settings");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");

  const [settings, setSettings] = useState<ContactSettings>(emptySettings);
  const [faqs, setFaqs] = useState<Faq[]>([]);
  const [enquiries, setEnquiries] = useState<Enquiry[]>([]);

  const [faqLabel, setFaqLabel] = useState("GENERAL");
  const [faqQuestion, setFaqQuestion] = useState("");
  const [faqAnswer, setFaqAnswer] = useState("");
  const [faqFoot, setFaqFoot] = useState("");
  const [faqSaving, setFaqSaving] = useState(false);
  const [enquirySearch, setEnquirySearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"ALL" | EnquiryStatus>("ALL");

  const token = () => localStorage.getItem("token") ?? "";

  const requestHeaders = (json = false): HeadersInit => ({
    ...(json ? { "Content-Type": "application/json" } : {}),
    ...(token() ? { Authorization: `Bearer ${token()}` } : {}),
  });

  const readError = async (response: Response, fallback: string) => {
    try {
      const data = await response.json();
      return Array.isArray(data.message)
        ? data.message.join(", ")
        : data.message || fallback;
    } catch {
      return fallback;
    }
  };

  const fetchSettings = useCallback(async () => {
    const response = await fetch(`${API_URL}/contact-settings`, { cache: "no-store" });
    if (!response.ok) throw new Error(await readError(response, "Unable to load contact settings."));
    const data = await response.json();
    setSettings({
      pageTitle: data.pageTitle ?? emptySettings.pageTitle,
      pageDescription: data.pageDescription ?? emptySettings.pageDescription,
      supportEmail: data.supportEmail ?? emptySettings.supportEmail,
      supportPhone: data.supportPhone ?? emptySettings.supportPhone,
      serviceLocations: data.serviceLocations ?? emptySettings.serviceLocations,
      supportHours: data.supportHours ?? emptySettings.supportHours,
    });
  }, []);

  const fetchFaqs = useCallback(async () => {
    const response = await fetch(`${API_URL}/faqs/admin`, {
      headers: requestHeaders(),
      cache: "no-store",
    });
    if (!response.ok) throw new Error(await readError(response, "Unable to load FAQs. Check your admin login and token."));
    const data = await response.json();
    setFaqs(Array.isArray(data) ? data : []);
  }, []);

  const fetchEnquiries = useCallback(async () => {
    const endpoint = statusFilter === "ALL"
      ? `${API_URL}/contact-enquiries`
      : `${API_URL}/contact-enquiries?status=${statusFilter}`;
    const response = await fetch(endpoint, {
      headers: requestHeaders(),
      cache: "no-store",
    });
    if (!response.ok) throw new Error(await readError(response, "Unable to load enquiries. Check your admin login and token."));
    const data = await response.json();
    setEnquiries(Array.isArray(data) ? data : []);
  }, [statusFilter]);

  const loadCurrentTab = useCallback(async () => {
    if (!API_URL) {
      setError("VITE_API_URL is not configured in the frontend environment.");
      return;
    }

    setLoading(true);
    setError("");
    setNotice("");
    try {
      if (activeTab === "settings") await fetchSettings();
      if (activeTab === "faqs") await fetchFaqs();
      if (activeTab === "enquiries") await fetchEnquiries();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to load Contact Management data.");
    } finally {
      setLoading(false);
    }
  }, [activeTab, fetchSettings, fetchFaqs, fetchEnquiries]);

  useEffect(() => {
    void loadCurrentTab();
  }, [loadCurrentTab]);

  const saveSettings = async (event: SyntheticEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSaving(true);
    setError("");
    setNotice("");
    try {
      const response = await fetch(`${API_URL}/contact-settings`, {
        method: "PATCH",
        headers: requestHeaders(true),
        body: JSON.stringify(settings),
      });
      if (!response.ok) throw new Error(await readError(response, "Unable to save contact settings."));
      const data = await response.json();
      setSettings({
        pageTitle: data.pageTitle ?? settings.pageTitle,
        pageDescription: data.pageDescription ?? settings.pageDescription,
        supportEmail: data.supportEmail ?? settings.supportEmail,
        supportPhone: data.supportPhone ?? settings.supportPhone,
        serviceLocations: data.serviceLocations ?? settings.serviceLocations,
        supportHours: data.supportHours ?? settings.supportHours,
      });
      setNotice("Contact settings saved successfully.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to save contact settings.");
    } finally {
      setSaving(false);
    }
  };

  const createFaq = async (event: SyntheticEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFaqSaving(true);
    setError("");
    setNotice("");
    try {
      const response = await fetch(`${API_URL}/faqs`, {
        method: "POST",
        headers: requestHeaders(true),
        body: JSON.stringify({
          label: faqLabel.trim() || "GENERAL",
          question: faqQuestion.trim(),
          answer: faqAnswer.trim(),
          foot: faqFoot.trim() || undefined,
          iconName: "help-circle",
          isActive: true,
          sortOrder: faqs.length,
        }),
      });
      if (!response.ok) throw new Error(await readError(response, "Unable to create FAQ."));
      setFaqQuestion("");
      setFaqAnswer("");
      setFaqFoot("");
      await fetchFaqs();
      setNotice("FAQ created successfully.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to create FAQ.");
    } finally {
      setFaqSaving(false);
    }
  };

  const editFaq = async (faq: Faq) => {
    const question = window.prompt("Edit FAQ question", faq.question);
    if (question === null) return;
    const answer = window.prompt("Edit FAQ answer", faq.answer);
    if (answer === null) return;
    if (!question.trim() || !answer.trim()) {
      setError("FAQ question and answer cannot be empty.");
      return;
    }

    setError("");
    setNotice("");
    try {
      const response = await fetch(`${API_URL}/faqs/${encodeURIComponent(faq.id)}`, {
        method: "PATCH",
        headers: requestHeaders(true),
        body: JSON.stringify({ question: question.trim(), answer: answer.trim() }),
      });
      if (!response.ok) throw new Error(await readError(response, "Unable to update FAQ."));
      await fetchFaqs();
      setNotice("FAQ updated successfully.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to update FAQ.");
    }
  };

  const toggleFaq = async (faq: Faq) => {
    setError("");
    setNotice("");
    try {
      const response = await fetch(`${API_URL}/faqs/${encodeURIComponent(faq.id)}`, {
        method: "PATCH",
        headers: requestHeaders(true),
        body: JSON.stringify({ isActive: !faq.isActive }),
      });
      if (!response.ok) throw new Error(await readError(response, "Unable to update FAQ status."));
      await fetchFaqs();
      setNotice(`FAQ ${faq.isActive ? "deactivated" : "activated"}.`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to update FAQ status.");
    }
  };

  const deleteFaq = async (faq: Faq) => {
    if (!window.confirm(`Delete this FAQ?\n\n${faq.question}`)) return;
    setError("");
    setNotice("");
    try {
      const response = await fetch(`${API_URL}/faqs/${encodeURIComponent(faq.id)}`, {
        method: "DELETE",
        headers: requestHeaders(),
      });
      if (!response.ok) throw new Error(await readError(response, "Unable to delete FAQ."));
      await fetchFaqs();
      setNotice("FAQ deleted successfully.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to delete FAQ.");
    }
  };

  const updateEnquiry = async (
    enquiry: Enquiry,
    changes: { status?: EnquiryStatus; adminNotes?: string | null },
  ) => {
    setError("");
    setNotice("");
    try {
      const response = await fetch(`${API_URL}/contact-enquiries/${encodeURIComponent(enquiry.id)}`, {
        method: "PATCH",
        headers: requestHeaders(true),
        body: JSON.stringify(changes),
      });
      if (!response.ok) throw new Error(await readError(response, "Unable to update enquiry."));
      await fetchEnquiries();
      setNotice("Enquiry updated successfully.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to update enquiry.");
    }
  };

  const logout = () => {
    localStorage.removeItem("token");
    navigate("/admin");
  };

  const visibleEnquiries = enquiries.filter((item) => {
    const query = enquirySearch.toLowerCase().trim();
    return !query || [item.fullName, item.email, item.phone, item.category, item.message]
      .join(" ")
      .toLowerCase()
      .includes(query);
  });

  const setSettingsField = (field: keyof ContactSettings, value: string) => {
    setSettings((previous) => ({ ...previous, [field]: value }));
  };

  return (
    <div className="min-h-screen bg-[#F6F8FD] text-[#142B43]">
      {sidebarOpen && (
        <button type="button" aria-label="Close sidebar" onClick={() => setSidebarOpen(false)} className="fixed inset-0 z-40 bg-[#0F2942]/40 lg:hidden" />
      )}

      <aside className={`fixed inset-y-0 left-0 z-50 flex w-[260px] flex-col border-r border-slate-200 bg-white transition-transform duration-200 ${sidebarOpen ? "translate-x-0" : "-translate-x-full"} lg:translate-x-0`}>
        <div className="border-b border-slate-100 bg-[#F8FAFC] px-6 py-6">
          <div className="flex items-center gap-3">
            <img src="/liveazy-logo.png" alt="LIVEAZY" className="h-11 w-11 rounded-xl bg-white object-contain p-1" onError={(event) => { event.currentTarget.style.display = "none"; }} />
            <div><h1 className="text-xl font-extrabold tracking-tight text-[#0F2942]">LIVEAZY</h1><p className="mt-0.5 text-xs text-slate-500">Rental Commerce Hub</p></div>
            <button type="button" aria-label="Close sidebar" onClick={() => setSidebarOpen(false)} className="ml-auto rounded-lg p-2 hover:bg-slate-200 lg:hidden"><X size={18} /></button>
          </div>
          <span className="mt-5 inline-flex rounded-md bg-[#D9F4F2] px-3 py-1.5 text-[10px] font-bold tracking-[0.14em] text-[#00696E]">ADMIN CONSOLE</span>
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-6">
          <p className="mb-3 px-3 text-[10px] font-bold uppercase tracking-[0.16em] text-slate-400">Operations &amp; Catalog</p>
          <nav className="space-y-1.5">
            {navigation.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink key={item.path} to={item.path} onClick={() => setSidebarOpen(false)} className={({ isActive }) => `flex items-center gap-3 rounded-lg px-3 py-3 text-sm font-semibold transition ${isActive ? "bg-[#0F2942] text-white shadow-sm" : "text-slate-600 hover:bg-slate-100 hover:text-[#0F2942]"}`}>
                  <Icon size={19} strokeWidth={1.8} /><span>{item.label}</span>
                </NavLink>
              );
            })}
          </nav>
          <div className="my-6 border-t border-slate-100" />
          <a href="/" className="flex items-center gap-3 rounded-lg px-3 py-3 text-sm font-semibold text-slate-600 transition hover:bg-slate-100 hover:text-[#0F2942]"><Store size={19} strokeWidth={1.8} /><span>View Website</span></a>
        </div>

        <div className="border-t border-slate-100 p-4">
          <button type="button" onClick={logout} className="flex w-full items-center justify-center gap-2 rounded-lg px-4 py-3 text-sm font-semibold text-red-600 transition hover:bg-red-50"><LogOut size={18} />Log Out</button>
        </div>
      </aside>

      <div className="min-h-screen lg:pl-[260px]">
        <header className="sticky top-0 z-30 flex h-[72px] items-center justify-between gap-4 border-b border-slate-200 bg-white/95 px-4 backdrop-blur-md sm:px-6 lg:px-8">
          <div className="flex min-w-0 items-center gap-3">
            <button type="button" aria-label="Open sidebar" onClick={() => setSidebarOpen(true)} className="rounded-lg border border-slate-200 p-2 hover:bg-slate-50 lg:hidden"><Menu size={20} /></button>
            <div><p className="text-xs font-semibold uppercase tracking-[0.15em] text-[#008A90]">Website content</p><h2 className="text-lg font-extrabold text-[#0F2942]">Contact Management</h2></div>
          </div>
          <div className="flex items-center gap-3"><span className="hidden rounded-full bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-700 sm:inline-flex"><span className="mr-2 h-2 w-2 rounded-full bg-emerald-500" />Admin workspace</span><div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#D9F4F2] text-sm font-bold text-[#00696E]">A</div></div>
        </header>

        <main className="mx-auto max-w-[1500px] space-y-6 px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
            <span className="rounded-md bg-[#E3F5F4] px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.15em] text-[#00777C]">Contact Us Master</span>
            <h1 className="mt-3 text-2xl font-extrabold tracking-tight text-[#0F2942] sm:text-3xl">Manage your customer support content</h1>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-500">Update public contact details, manage FAQs, and track enquiries submitted from the website. Customers do not need to log in.</p>
          </section>

          <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
            {tabItems.map(({ id, label, icon: Icon }) => (
              <button key={id} type="button" onClick={() => { setActiveTab(id); setError(""); setNotice(""); }} className={`flex items-center gap-3 rounded-xl border px-4 py-4 text-left text-sm font-bold transition ${activeTab === id ? "border-[#008A90] bg-[#E8F7F6] text-[#00696E]" : "border-slate-200 bg-white text-slate-600 hover:border-[#B6E4E2] hover:bg-white"}`}>
                <span className={`flex h-10 w-10 items-center justify-center rounded-lg ${activeTab === id ? "bg-white" : "bg-slate-50"}`}><Icon size={20} /></span>
                <span>{label}</span>
              </button>
            ))}
          </div>

          {error && <div role="alert" className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}
          {notice && <div role="status" className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{notice}</div>}

          {loading ? (
            <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center text-sm text-slate-500"><RefreshCw size={20} className="mx-auto mb-3 animate-spin" />Loading management data…</div>
          ) : (
            <>
              {activeTab === "settings" && (
                <form onSubmit={saveSettings} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
                  <div className="mb-6"><h3 className="text-lg font-extrabold text-[#0F2942]">Contact page settings</h3><p className="mt-1 text-sm text-slate-500">These values are shown on the public Contact Us page.</p></div>
                  <div className="grid gap-5 md:grid-cols-2">
                    <label className="text-sm font-semibold text-[#0F2942]">Page title<input value={settings.pageTitle} onChange={(e) => setSettingsField("pageTitle", e.target.value)} required maxLength={200} className="mt-2 h-11 w-full rounded-xl border border-slate-200 bg-[#F8FAFC] px-3 text-sm font-normal outline-none focus:border-[#008A90]" /></label>
                    <label className="text-sm font-semibold text-[#0F2942]">Support email<input type="email" value={settings.supportEmail} onChange={(e) => setSettingsField("supportEmail", e.target.value)} required maxLength={160} className="mt-2 h-11 w-full rounded-xl border border-slate-200 bg-[#F8FAFC] px-3 text-sm font-normal outline-none focus:border-[#008A90]" /></label>
                    <label className="text-sm font-semibold text-[#0F2942]">Support phone / WhatsApp<input value={settings.supportPhone} onChange={(e) => setSettingsField("supportPhone", e.target.value)} required maxLength={20} className="mt-2 h-11 w-full rounded-xl border border-slate-200 bg-[#F8FAFC] px-3 text-sm font-normal outline-none focus:border-[#008A90]" /></label>
                    <label className="text-sm font-semibold text-[#0F2942]">Service locations<input value={settings.serviceLocations} onChange={(e) => setSettingsField("serviceLocations", e.target.value)} required maxLength={200} className="mt-2 h-11 w-full rounded-xl border border-slate-200 bg-[#F8FAFC] px-3 text-sm font-normal outline-none focus:border-[#008A90]" /></label>
                    <label className="text-sm font-semibold text-[#0F2942] md:col-span-2">Page description<textarea value={settings.pageDescription} onChange={(e) => setSettingsField("pageDescription", e.target.value)} required maxLength={2000} rows={3} className="mt-2 w-full rounded-xl border border-slate-200 bg-[#F8FAFC] px-3 py-3 text-sm font-normal outline-none focus:border-[#008A90]" /></label>
                    <label className="text-sm font-semibold text-[#0F2942] md:col-span-2">Support hours<input value={settings.supportHours} onChange={(e) => setSettingsField("supportHours", e.target.value)} required maxLength={200} className="mt-2 h-11 w-full rounded-xl border border-slate-200 bg-[#F8FAFC] px-3 text-sm font-normal outline-none focus:border-[#008A90]" /></label>
                  </div>
                  <button type="submit" disabled={saving} className="mt-6 inline-flex items-center gap-2 rounded-xl bg-[#0F2942] px-5 py-3 text-sm font-bold text-white transition hover:bg-[#008A90] disabled:opacity-60"><Save size={16} />{saving ? "Saving…" : "Save Contact Settings"}</button>
                </form>
              )}

              {activeTab === "faqs" && (
                <div className="space-y-5">
                  <form onSubmit={createFaq} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
                    <div className="mb-5"><h3 className="text-lg font-extrabold text-[#0F2942]">Add a FAQ</h3><p className="mt-1 text-sm text-slate-500">Active questions appear on the public Contact Us page.</p></div>
                    <div className="grid gap-4 md:grid-cols-2">
                      <label className="text-sm font-semibold text-[#0F2942]">Label<input value={faqLabel} onChange={(e) => setFaqLabel(e.target.value)} maxLength={80} placeholder="GENERAL" className="mt-2 h-11 w-full rounded-xl border border-slate-200 bg-[#F8FAFC] px-3 text-sm font-normal outline-none focus:border-[#008A90]" /></label>
                      <label className="text-sm font-semibold text-[#0F2942]">Footer note (optional)<input value={faqFoot} onChange={(e) => setFaqFoot(e.target.value)} maxLength={180} placeholder="Check details with our team" className="mt-2 h-11 w-full rounded-xl border border-slate-200 bg-[#F8FAFC] px-3 text-sm font-normal outline-none focus:border-[#008A90]" /></label>
                      <label className="text-sm font-semibold text-[#0F2942] md:col-span-2">Question<input value={faqQuestion} onChange={(e) => setFaqQuestion(e.target.value)} required maxLength={300} placeholder="How does rental delivery work?" className="mt-2 h-11 w-full rounded-xl border border-slate-200 bg-[#F8FAFC] px-3 text-sm font-normal outline-none focus:border-[#008A90]" /></label>
                      <label className="text-sm font-semibold text-[#0F2942] md:col-span-2">Answer<textarea value={faqAnswer} onChange={(e) => setFaqAnswer(e.target.value)} required maxLength={2000} rows={3} placeholder="Write the answer shown to customers…" className="mt-2 w-full rounded-xl border border-slate-200 bg-[#F8FAFC] px-3 py-3 text-sm font-normal outline-none focus:border-[#008A90]" /></label>
                    </div>
                    <button type="submit" disabled={faqSaving} className="mt-5 inline-flex items-center gap-2 rounded-xl bg-[#0F2942] px-5 py-3 text-sm font-bold text-white transition hover:bg-[#008A90] disabled:opacity-60"><Plus size={16} />{faqSaving ? "Adding…" : "Add FAQ"}</button>
                  </form>

                  <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                    <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4"><div><h3 className="font-extrabold text-[#0F2942]">FAQ entries</h3><p className="mt-1 text-xs text-slate-500">{faqs.length} total</p></div><button type="button" onClick={() => void fetchFaqs()} className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-xs font-bold hover:bg-slate-50"><RefreshCw size={14} />Refresh</button></div>
                    {faqs.length === 0 ? <div className="p-10 text-center text-sm text-slate-500">No FAQs created yet.</div> : <div className="divide-y divide-slate-100">{faqs.map((faq) => <article key={faq.id} className="p-5"><div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between"><div className="min-w-0"><div className="mb-2 flex flex-wrap items-center gap-2"><span className="rounded-full bg-[#E8F7F6] px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-wide text-[#007B80]">{faq.label}</span><span className={`rounded-full px-2.5 py-1 text-[10px] font-bold ${faq.isActive ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-500"}`}>{faq.isActive ? "Active" : "Inactive"}</span></div><h4 className="font-bold text-[#0F2942]">{faq.question}</h4><p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-600">{faq.answer}</p>{faq.foot && <p className="mt-3 text-xs font-semibold text-slate-400">{faq.foot}</p>}</div><div className="flex shrink-0 flex-wrap gap-2"><button type="button" onClick={() => void editFaq(faq)} className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-bold text-[#0F2942] hover:bg-slate-50">Edit</button><button type="button" onClick={() => void toggleFaq(faq)} className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-bold text-[#0F2942] hover:bg-slate-50">{faq.isActive ? "Deactivate" : "Activate"}</button><button type="button" onClick={() => void deleteFaq(faq)} aria-label="Delete FAQ" className="rounded-lg border border-red-100 px-3 py-2 text-xs font-bold text-red-600 hover:bg-red-50"><Trash2 size={14} /></button></div></div></article>)}</div>}
                  </section>
                </div>
              )}

              {activeTab === "enquiries" && (
                <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                  <div className="flex flex-col gap-4 border-b border-slate-100 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6"><div><h3 className="text-lg font-extrabold text-[#0F2942]">Contact enquiries</h3><p className="mt-1 text-sm text-slate-500">Customer messages submitted through the public website.</p></div><button type="button" onClick={() => void fetchEnquiries()} className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-xs font-bold hover:bg-slate-50"><RefreshCw size={14} />Refresh</button></div>
                  <div className="grid gap-3 border-b border-slate-100 p-5 md:grid-cols-[minmax(0,1fr)_200px]"><div className="relative"><Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" /><input value={enquirySearch} onChange={(e) => setEnquirySearch(e.target.value)} placeholder="Search name, email, phone or message" className="h-10 w-full rounded-lg border border-slate-200 bg-[#F8FAFC] pl-9 pr-3 text-sm outline-none focus:border-[#008A90]" /></div><select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as "ALL" | EnquiryStatus)} className="h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm outline-none focus:border-[#008A90]"><option value="ALL">All statuses</option><option value="PENDING">Pending</option><option value="CONTACTED">Contacted</option><option value="RESOLVED">Resolved</option></select></div>
                  {visibleEnquiries.length === 0 ? <div className="p-10 text-center"><Inbox size={28} className="mx-auto mb-3 text-slate-300" /><h4 className="font-bold text-[#0F2942]">No enquiries found</h4><p className="mt-1 text-sm text-slate-500">New submissions from the Contact Us form will appear here.</p></div> : <div className="divide-y divide-slate-100">{visibleEnquiries.map((enquiry) => <article key={enquiry.id} className="p-5 sm:p-6"><div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between"><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><h4 className="text-base font-extrabold text-[#0F2942]">{enquiry.fullName}</h4><span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-bold ${enquiry.status === "RESOLVED" ? "bg-emerald-50 text-emerald-700" : enquiry.status === "CONTACTED" ? "bg-blue-50 text-blue-700" : "bg-amber-50 text-amber-700"}`}>{enquiry.status === "PENDING" ? <Clock3 size={11} /> : <CheckCircle2 size={11} />}{enquiry.status}</span></div><p className="mt-1 text-xs text-slate-500">{new Date(enquiry.createdAt).toLocaleString()} · {enquiry.category}</p><div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-sm"><a className="font-medium text-[#008A90] hover:underline" href={`mailto:${enquiry.email}`}>{enquiry.email}</a><a className="font-medium text-[#008A90] hover:underline" href={`tel:${enquiry.phone}`}>{enquiry.phone}</a></div><p className="mt-4 whitespace-pre-wrap text-sm leading-6 text-slate-700">{enquiry.message}</p><label className="mt-4 block text-xs font-bold text-slate-500">Internal admin notes<textarea key={`${enquiry.id}-${enquiry.adminNotes ?? ""}`} defaultValue={enquiry.adminNotes ?? ""} rows={2} maxLength={2000} onBlur={(e) => { const value = e.target.value.trim(); if (value !== (enquiry.adminNotes ?? "")) void updateEnquiry(enquiry, { adminNotes: value || null }); }} placeholder="Add an internal follow-up note…" className="mt-1.5 w-full rounded-lg border border-slate-200 bg-[#F8FAFC] px-3 py-2 text-sm font-normal outline-none focus:border-[#008A90]" /></label></div><div className="w-full xl:w-44"><label className="block text-xs font-bold text-slate-500">Update status<select value={enquiry.status} onChange={(e) => void updateEnquiry(enquiry, { status: e.target.value as EnquiryStatus })} className="mt-1.5 h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm font-semibold text-[#0F2942] outline-none focus:border-[#008A90]"><option value="PENDING">Pending</option><option value="CONTACTED">Contacted</option><option value="RESOLVED">Resolved</option></select></label><p className="mt-2 break-all text-[10px] text-slate-400">ID: {enquiry.id}</p></div></div></article>)}</div>}
                </section>
              )}
            </>
          )}
        </main>
      </div>
    </div>
  );
}
