
import { useCallback, useEffect, useMemo, useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  LayoutDashboard,
  Tags,
  Armchair,
  Images,
  Megaphone,
  Contact,
  MessageCircle,
  MessageSquareText,
  Store,
  LogOut,
  Menu,
  CheckCircle2,
  RefreshCw,
  Star,
  ThumbsDown,
  ThumbsUp,
  MessageSquare,
  Clock,
  AlertCircle,
  Plus,
  Pencil,
  Trash2,
  X,
  FileText,
} from "lucide-react";

const API_URL = import.meta.env.VITE_API_URL;

type FeedbackStatus = "PENDING" | "APPROVED" | "REJECTED";
type FilterStatus = "ALL" | FeedbackStatus;
type FormMode = "add" | "edit";

interface Feedback {
  id: string;
  customerName: string;
  rating: number;
  message: string;
  status: FeedbackStatus;
  createdAt: string;
}

interface FeedbackForm {
  customerName: string;
  rating: number;
  message: string;
}

const filters: FilterStatus[] = [
  "ALL",
  "PENDING",
  "APPROVED",
  "REJECTED",
];

const emptyForm: FeedbackForm = {
  customerName: "",
  rating: 5,
  message: "",
};

const FEEDBACK_ADMIN_SIDEBAR = [
  { label: "Dashboard", path: "/admin/dashboard", icon: LayoutDashboard },
  { label: "Categories", path: "/admin/categories", icon: Tags },
  { label: "Products", path: "/admin/products", icon: Armchair },
  { label: "Banners", path: "/admin/banner", icon: Images },
  { label: "Promo Banners", path: "/admin/promo-banners", icon: Megaphone },
  { label: "WhatsApp Settings", path: "/admin/settings", icon: MessageCircle },
  { label: "Contact Management", path: "/admin/contact-management", icon: Contact },
  { label: "Feedback Master", path: "/admin/feedback", icon: MessageSquareText },
  { label: "Trending Rentals", path: "/admin/trending-rentals", icon: Star },
  { label: "Blog Management", path: "/admin/blogs", icon: FileText }
];

export default function FeedbackMaster() {
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const [feedbacks, setFeedbacks] = useState<Feedback[]>([]);
  const [filter, setFilter] = useState<FilterStatus>("ALL");
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [showForm, setShowForm] = useState(false);
  const [formMode, setFormMode] = useState<FormMode>("add");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FeedbackForm>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const getToken = () => localStorage.getItem("token");

  const loadFeedback = useCallback(async () => {
    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const token = getToken();

      if (!token) {
        navigate("/admin");
        return;
      }

      const response = await fetch(`${API_URL}/feedback/admin`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.status === 401 || response.status === 403) {
        setError("Access denied. Please log in again.");
        return;
      }

      if (!response.ok) {
        throw new Error(`Failed to load feedback (${response.status})`);
      }

      const data: unknown = await response.json();

      const list = Array.isArray(data)
        ? data
        : data &&
            typeof data === "object" &&
            "data" in data &&
            Array.isArray(data.data)
          ? data.data
          : [];

      setFeedbacks(list as Feedback[]);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to load feedback. Check your backend connection.",
      );
    } finally {
      setLoading(false);
    }
  }, [navigate]);

  useEffect(() => {
    void loadFeedback();
  }, [loadFeedback]);

  function openAddForm() {
    setFormMode("add");
    setEditingId(null);
    setForm(emptyForm);
    setError("");
    setSuccess("");
    setShowForm(true);
  }

  function openEditForm(feedback: Feedback) {
    setFormMode("edit");
    setEditingId(feedback.id);
    setForm({
      customerName: feedback.customerName || "",
      rating: feedback.rating,
      message: feedback.message || "",
    });
    setError("");
    setSuccess("");
    setShowForm(true);
  }

  function closeForm() {
    if (saving) return;

    setShowForm(false);
    setEditingId(null);
    setForm(emptyForm);
  }

  async function handleFormSubmit(
    event: React.FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    const customerName = form.customerName.trim();
    const message = form.message.trim();
    const rating = Number(form.rating);

    if (!customerName || !message) {
      setError("Customer name and feedback message are required.");
      return;
    }

    if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
      setError("Please select a rating between 1 and 5.");
      return;
    }

    setSaving(true);
    setError("");
    setSuccess("");

    try {
      const token = getToken();

      if (!token) {
        navigate("/admin");
        return;
      }

      const isEditing = formMode === "edit";

      if (isEditing && !editingId) {
        throw new Error("Feedback ID is missing.");
      }

      const url = isEditing
        ? `${API_URL}/feedback/admin/${editingId}`
        : `${API_URL}/feedback`;

      const response = await fetch(url, {
        method: isEditing ? "PATCH" : "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          customerName,
          rating,
          message,
        }),
      });

      if (response.status === 401 || response.status === 403) {
        throw new Error("Access denied. Please log in again.");
      }

      if (!response.ok) {
        const messageText = await response.text();
        throw new Error(
          messageText || `Unable to save feedback (${response.status})`,
        );
      }

      const savedFeedback = (await response.json()) as Feedback;

      if (isEditing) {
        setFeedbacks((current) =>
          current.map((item) =>
            item.id === editingId
              ? { ...item, ...savedFeedback }
              : item,
          ),
        );

        setSuccess("Feedback updated successfully.");
      } else {
        setFeedbacks((current) => [
          {
            ...savedFeedback,
            status: savedFeedback.status || "PENDING",
          },
          ...current,
        ]);

        setSuccess("Feedback added successfully.");
      }

      setShowForm(false);
      setEditingId(null);
      setForm(emptyForm);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to save feedback.",
      );
    } finally {
      setSaving(false);
    }
  }

  async function updateStatus(
    feedback: Feedback,
    status: "APPROVED" | "REJECTED",
  ) {
    const action = status === "APPROVED" ? "approve" : "reject";

    if (!window.confirm(`Are you sure you want to ${action} this feedback?`)) {
      return;
    }

    setUpdatingId(feedback.id);
    setError("");
    setSuccess("");

    try {
      const token = getToken();

      if (!token) {
        navigate("/admin");
        return;
      }

      const response = await fetch(
        `${API_URL}/feedback/admin/${feedback.id}/status`,
        {
          method: "PATCH",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ status }),
        },
      );

      if (response.status === 401 || response.status === 403) {
        throw new Error("Access denied. Please log in again.");
      }

      if (!response.ok) {
        const messageText = await response.text();
        throw new Error(
          messageText || `Update failed (${response.status})`,
        );
      }

      const updatedFeedback = (await response.json()) as Feedback;

      setFeedbacks((current) =>
        current.map((item) =>
          item.id === feedback.id
            ? { ...item, ...updatedFeedback, status }
            : item,
        ),
      );

      setSuccess(
        `Feedback ${status === "APPROVED" ? "approved" : "rejected"} successfully.`,
      );
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to update feedback.",
      );
    } finally {
      setUpdatingId(null);
    }
  }

  async function deleteFeedback(feedback: Feedback) {
    const confirmed = window.confirm(
      `Delete feedback from "${feedback.customerName}"?\n\nThis action cannot be undone.`,
    );

    if (!confirmed) return;

    setDeletingId(feedback.id);
    setError("");
    setSuccess("");

    try {
      const token = getToken();

      if (!token) {
        navigate("/admin");
        return;
      }

      const response = await fetch(
        `${API_URL}/feedback/admin/${feedback.id}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      if (response.status === 401 || response.status === 403) {
        throw new Error("Access denied. Please log in again.");
      }

      if (!response.ok) {
        const messageText = await response.text();
        throw new Error(
          messageText || `Unable to delete feedback (${response.status})`,
        );
      }

      setFeedbacks((current) =>
        current.filter((item) => item.id !== feedback.id),
      );

      setSuccess("Feedback deleted successfully.");
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to delete feedback.",
      );
    } finally {
      setDeletingId(null);
    }
  }

  const stats = useMemo(
    () => ({
      total: feedbacks.length,
      pending: feedbacks.filter((item) => item.status === "PENDING").length,
      approved: feedbacks.filter((item) => item.status === "APPROVED").length,
      rejected: feedbacks.filter((item) => item.status === "REJECTED").length,
    }),
    [feedbacks],
  );

  const filteredFeedbacks = feedbacks.filter(
    (item) => filter === "ALL" || item.status === filter,
  );

  function formatDate(value: string) {
    const date = new Date(value);

    return Number.isNaN(date.getTime())
      ? "Date unavailable"
      : date.toLocaleString("en-IN", {
          day: "2-digit",
          month: "short",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        });
  }

  function statusStyle(status: FeedbackStatus) {
    switch (status) {
      case "APPROVED":
        return "bg-emerald-50 text-emerald-700";
      case "REJECTED":
        return "bg-red-50 text-red-700";
      default:
        return "bg-amber-50 text-amber-700";
    }
  }

  return (
    <div className="min-h-screen bg-[#F5F7FA] text-[#142B43]">
      {sidebarOpen && (
        <button
          type="button"
          aria-label="Close navigation"
          onClick={() => setSidebarOpen(false)}
          className="fixed inset-0 z-40 bg-[#0F2942]/40 lg:hidden"
        />
      )}

      <aside className={`fixed inset-y-0 left-0 z-50 flex w-[260px] flex-col border-r border-slate-200 bg-white transition-transform duration-200 ${
        sidebarOpen ? "translate-x-0" : "-translate-x-full"
      } lg:translate-x-0`}>
        <div className="border-b border-slate-100 bg-[#F8FAFC] px-6 py-6">
          <div className="flex items-center gap-3">
            <img
              src="/liveazy-logo.png"
              alt="LIVEAZY"
              className="h-11 w-11 rounded-xl bg-white object-contain p-1"
              onError={(event) => { event.currentTarget.style.display = "none"; }}
            />
            <div>
              <h1 className="text-xl font-extrabold tracking-tight text-[#0F2942]">LIVEAZY</h1>
              <p className="mt-0.5 text-xs text-slate-500">Rental Commerce Hub</p>
            </div>
            <button
              type="button"
              aria-label="Close sidebar"
              onClick={() => setSidebarOpen(false)}
              className="ml-auto rounded-lg p-2 hover:bg-slate-200 lg:hidden"
            >
              <X size={18} />
            </button>
          </div>
          <span className="mt-5 inline-flex rounded-md bg-[#D9F4F2] px-3 py-1.5 text-[10px] font-bold tracking-[0.14em] text-[#00696E]">
            ADMIN CONSOLE
          </span>
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-6">
          <p className="mb-3 px-3 text-[10px] font-bold uppercase tracking-[0.16em] text-slate-400">
            Operations &amp; Catalog
          </p>
          <nav className="space-y-1.5">
            {FEEDBACK_ADMIN_SIDEBAR.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  onClick={() => setSidebarOpen(false)}
                  className={({ isActive }) =>
                    `flex items-center gap-3 rounded-lg px-3 py-3 text-sm font-semibold transition ${
                      isActive
                        ? "bg-[#0F2942] text-white shadow-sm"
                        : "text-slate-600 hover:bg-slate-100 hover:text-[#0F2942]"
                    }`
                  }
                >
                  <Icon size={19} strokeWidth={1.8} />
                  {item.label}
                </NavLink>
              );
            })}
          </nav>
          <div className="my-6 border-t border-slate-100" />
          <NavLink
            to="/"
            onClick={() => setSidebarOpen(false)}
            className="flex items-center gap-3 rounded-lg px-3 py-3 text-sm font-semibold text-slate-600 hover:bg-slate-100"
          >
            <Store size={19} />
            View Website
          </NavLink>
        </div>

        <div className="border-t border-slate-100 p-4">
          <button
            type="button"
            onClick={() => {
              localStorage.removeItem("token");
              navigate("/admin");
            }}
            className="flex w-full items-center justify-center gap-2 rounded-lg px-4 py-3 text-sm font-semibold text-red-600 hover:bg-red-50"
          >
            <LogOut size={18} />
            Log Out
          </button>
        </div>
      </aside>

      <div className="min-h-screen lg:pl-[260px]">
        <header className="sticky top-0 z-30 flex h-[72px] items-center justify-between gap-4 border-b border-slate-200 bg-white/95 px-4 backdrop-blur-md sm:px-6 lg:px-8">
          <div className="flex min-w-0 items-center gap-3">
            <button
              type="button"
              aria-label="Open sidebar"
              onClick={() => setSidebarOpen(true)}
              className="rounded-lg border border-slate-200 p-2 hover:bg-slate-50 lg:hidden"
            >
              <Menu size={20} />
            </button>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.15em] text-[#008A90]">Website content</p>
              <h2 className="text-lg font-extrabold text-[#0F2942]">Feedback Master</h2>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="hidden rounded-full bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-700 sm:inline-flex">
              <span className="mr-2 h-2 w-2 rounded-full bg-emerald-500" />
              Admin workspace
            </span>
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#D9F4F2] text-sm font-bold text-[#00696E]">A</div>
          </div>
        </header>
        <div className="px-4 py-6 text-[#142B43] sm:px-6 lg:px-8">
      <div className="mx-auto max-w-[1400px]">
        <header className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => navigate("/admin/dashboard")}
              className="rounded-lg border border-slate-200 bg-white p-2.5 hover:bg-slate-50"
              aria-label="Back to dashboard"
            >
              <ArrowLeft size={19} />
            </button>

            <div>
              <h1 className="text-2xl font-extrabold sm:text-3xl">
                Feedback Master
              </h1>
              <p className="mt-1 text-sm text-slate-500">
                Add, edit, delete and manage customer feedback.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={openAddForm}
              className="inline-flex items-center gap-2 rounded-lg bg-[#008A90] px-4 py-2.5 text-sm font-bold text-white transition hover:bg-[#006F74]"
            >
              <Plus size={17} />
              Add Feedback
            </button>

            <button
              type="button"
              onClick={() => void loadFeedback()}
              disabled={loading}
              className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold hover:bg-slate-50 disabled:opacity-50"
            >
              <RefreshCw
                size={16}
                className={loading ? "animate-spin" : ""}
              />
              Refresh
            </button>
          </div>
        </header>

        {error && (
          <div className="mb-5 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            <AlertCircle size={19} className="mt-0.5 shrink-0" />
            <div className="min-w-0 flex-1">
              <p className="font-semibold">Something went wrong</p>
              <p className="mt-1 break-words">{error}</p>
            </div>
            <button
              type="button"
              onClick={() => setError("")}
              aria-label="Dismiss error"
            >
              <X size={17} />
            </button>
          </div>
        )}

        {success && (
          <div className="mb-5 flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-medium text-emerald-700">
            <CheckCircle2 size={18} />
            <span className="flex-1">{success}</span>
            <button
              type="button"
              onClick={() => setSuccess("")}
              aria-label="Dismiss success message"
            >
              <X size={17} />
            </button>
          </div>
        )}

        <section className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {[
            {
              label: "Total Feedback",
              value: stats.total,
              icon: MessageSquare,
              style: "bg-blue-50 text-blue-700",
            },
            {
              label: "Pending Review",
              value: stats.pending,
              icon: Clock,
              style: "bg-amber-50 text-amber-700",
            },
            {
              label: "Approved",
              value: stats.approved,
              icon: ThumbsUp,
              style: "bg-emerald-50 text-emerald-700",
            },
            {
              label: "Rejected",
              value: stats.rejected,
              icon: ThumbsDown,
              style: "bg-red-50 text-red-700",
            },
          ].map((stat) => {
            const Icon = stat.icon;

            return (
              <div
                key={stat.label}
                className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"
              >
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm font-medium text-slate-500">
                    {stat.label}
                  </p>
                  <span className={`rounded-xl p-3 ${stat.style}`}>
                    <Icon size={20} />
                  </span>
                </div>
                <p className="mt-3 text-3xl font-extrabold">
                  {loading ? "—" : stat.value}
                </p>
              </div>
            );
          })}
        </section>

        <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="flex flex-col justify-between gap-4 border-b border-slate-100 p-5 sm:flex-row sm:items-center">
            <div>
              <h2 className="text-lg font-bold">Customer Feedback</h2>
              <p className="mt-1 text-sm text-slate-500">
                Approve feedback to make it eligible for the public website.
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              {filters.map((item) => (
                <button
                  key={item}
                  type="button"
                  onClick={() => setFilter(item)}
                  className={`rounded-lg px-3 py-2 text-xs font-bold transition ${
                    filter === item
                      ? "bg-[#0F2942] text-white"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  }`}
                >
                  {item === "ALL"
                    ? "All"
                    : item.charAt(0) + item.slice(1).toLowerCase()}
                  {item === "ALL" && ` (${stats.total})`}
                  {item === "PENDING" && ` (${stats.pending})`}
                  {item === "APPROVED" && ` (${stats.approved})`}
                  {item === "REJECTED" && ` (${stats.rejected})`}
                </button>
              ))}
            </div>
          </div>

          {loading ? (
            <div className="p-12 text-center text-sm text-slate-500">
              Loading customer feedback...
            </div>
          ) : filteredFeedbacks.length === 0 ? (
            <div className="p-12 text-center">
              <MessageSquare
                size={34}
                className="mx-auto mb-3 text-slate-300"
              />
              <p className="font-semibold text-slate-600">
                No feedback found
              </p>
              <p className="mt-1 text-sm text-slate-400">
                Feedback matching this filter will appear here.
              </p>
              {filter === "ALL" && (
                <button
                  type="button"
                  onClick={openAddForm}
                  className="mt-4 inline-flex items-center gap-2 rounded-lg bg-[#008A90] px-4 py-2.5 text-sm font-bold text-white hover:bg-[#006F74]"
                >
                  <Plus size={16} />
                  Add First Feedback
                </button>
              )}
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {filteredFeedbacks.map((feedback) => (
                <article
                  key={feedback.id}
                  className="p-5 transition hover:bg-slate-50/70 sm:p-6"
                >
                  <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-start">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-3">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#D9F4F2] font-bold text-[#00696E]">
                          {feedback.customerName?.charAt(0)?.toUpperCase() || "C"}
                        </div>

                        <div>
                          <h3 className="font-bold">
                            {feedback.customerName || "Anonymous"}
                          </h3>
                          <p className="mt-0.5 text-xs text-slate-400">
                            {formatDate(feedback.createdAt)}
                          </p>
                        </div>

                        <span
                          className={`rounded-full px-3 py-1 text-[10px] font-bold ${statusStyle(feedback.status)}`}
                        >
                          {feedback.status}
                        </span>
                      </div>

                      <div className="mt-4 flex items-center gap-1">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <Star
                            key={star}
                            size={17}
                            className={
                              star <= feedback.rating
                                ? "fill-amber-400 text-amber-400"
                                : "text-slate-200"
                            }
                          />
                        ))}
                        <span className="ml-2 text-xs font-bold text-slate-500">
                          {feedback.rating}/5
                        </span>
                      </div>

                      <p className="mt-3 whitespace-pre-wrap break-words text-sm leading-6 text-slate-600">
                        {feedback.message}
                      </p>

                      <p className="mt-3 break-all font-mono text-[10px] text-slate-400">
                        ID: {feedback.id}
                      </p>
                    </div>

                    <div className="flex shrink-0 flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => openEditForm(feedback)}
                        disabled={
                          saving ||
                          updatingId === feedback.id ||
                          deletingId === feedback.id
                        }
                        className="inline-flex items-center justify-center gap-2 rounded-lg border border-blue-200 bg-white px-3 py-2.5 text-xs font-bold text-blue-700 transition hover:bg-blue-50 disabled:opacity-50"
                      >
                        <Pencil size={15} />
                        Edit
                      </button>

                      {feedback.status !== "APPROVED" && (
                        <button
                          type="button"
                          onClick={() =>
                            void updateStatus(feedback, "APPROVED")
                          }
                          disabled={
                            updatingId === feedback.id ||
                            deletingId === feedback.id
                          }
                          className="inline-flex items-center justify-center gap-2 rounded-lg bg-emerald-600 px-3 py-2.5 text-xs font-bold text-white transition hover:bg-emerald-700 disabled:opacity-50"
                        >
                          <ThumbsUp size={15} />
                          {updatingId === feedback.id
                            ? "Updating..."
                            : "Approve"}
                        </button>
                      )}

                      {feedback.status !== "REJECTED" && (
                        <button
                          type="button"
                          onClick={() =>
                            void updateStatus(feedback, "REJECTED")
                          }
                          disabled={
                            updatingId === feedback.id ||
                            deletingId === feedback.id
                          }
                          className="inline-flex items-center justify-center gap-2 rounded-lg border border-red-200 bg-white px-3 py-2.5 text-xs font-bold text-red-600 transition hover:bg-red-50 disabled:opacity-50"
                        >
                          <ThumbsDown size={15} />
                          Reject
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={() => void deleteFeedback(feedback)}
                        disabled={
                          deletingId === feedback.id ||
                          updatingId === feedback.id
                        }
                        className="inline-flex items-center justify-center gap-2 rounded-lg border border-red-200 bg-white px-3 py-2.5 text-xs font-bold text-red-700 transition hover:bg-red-50 disabled:opacity-50"
                      >
                        <Trash2 size={15} />
                        {deletingId === feedback.id
                          ? "Deleting..."
                          : "Delete"}
                      </button>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}

          <div className="border-t border-slate-100 px-5 py-4 text-xs text-slate-400">
            Showing {loading ? 0 : filteredFeedbacks.length} of{" "}
            {feedbacks.length} feedback entries
          </div>
        </section>

        <footer className="mt-6 border-t border-slate-200 py-5 text-xs text-slate-400">
          © {new Date().getFullYear()} LIVEAZY · Feedback Management
        </footer>
      </div>

      {showForm && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-slate-950/50 p-4"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) closeForm();
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="feedback-form-title"
            className="my-auto w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl"
          >
            <div className="mb-5 flex items-start justify-between gap-4">
              <div>
                <h2
                  id="feedback-form-title"
                  className="text-xl font-extrabold text-[#142B43]"
                >
                  {formMode === "add" ? "Add Feedback" : "Edit Feedback"}
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  {formMode === "add"
                    ? "Enter the customer feedback details."
                    : "Update the customer feedback details."}
                </p>
              </div>

              <button
                type="button"
                onClick={closeForm}
                disabled={saving}
                className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 disabled:opacity-50"
                aria-label="Close form"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleFormSubmit} className="space-y-5">
              <div>
                <label
                  htmlFor="customerName"
                  className="mb-2 block text-sm font-semibold text-slate-700"
                >
                  Customer Name
                </label>
                <input
                  id="customerName"
                  type="text"
                  required
                  maxLength={100}
                  value={form.customerName}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      customerName: event.target.value,
                    }))
                  }
                  placeholder="Enter customer name"
                  className="w-full rounded-lg border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-[#008A90] focus:ring-2 focus:ring-[#008A90]/15"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  Rating
                </label>
                <div className="flex items-center gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() =>
                        setForm((current) => ({
                          ...current,
                          rating: star,
                        }))
                      }
                      aria-label={`Set rating to ${star}`}
                      aria-pressed={form.rating === star}
                      className="rounded-md p-1 transition hover:scale-110"
                    >
                      <Star
                        size={28}
                        className={
                          star <= form.rating
                            ? "fill-amber-400 text-amber-400"
                            : "text-slate-300"
                        }
                      />
                    </button>
                  ))}
                  <span className="ml-2 text-sm font-bold text-slate-500">
                    {form.rating}/5
                  </span>
                </div>
              </div>

              <div>
                <label
                  htmlFor="feedbackMessage"
                  className="mb-2 block text-sm font-semibold text-slate-700"
                >
                  Feedback Message
                </label>
                <textarea
                  id="feedbackMessage"
                  required
                  rows={5}
                  maxLength={2000}
                  value={form.message}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      message: event.target.value,
                    }))
                  }
                  placeholder="Enter feedback message"
                  className="w-full resize-y rounded-lg border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-[#008A90] focus:ring-2 focus:ring-[#008A90]/15"
                />
                <p className="mt-1 text-right text-xs text-slate-400">
                  {form.message.length}/2000
                </p>
              </div>

              {error && (
                <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                  {error}
                </div>
              )}

              <div className="flex flex-wrap justify-end gap-3 border-t border-slate-100 pt-4">
                <button
                  type="button"
                  onClick={closeForm}
                  disabled={saving}
                  className="rounded-lg border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-50 disabled:opacity-50"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={saving}
                  className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#008A90] px-5 py-2.5 text-sm font-bold text-white transition hover:bg-[#006F74] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {saving && (
                    <RefreshCw size={15} className="animate-spin" />
                  )}
                  {saving
                    ? "Saving..."
                    : formMode === "add"
                      ? "Create Feedback"
                      : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
         </div>
      </div>
    </div>
  );
}
