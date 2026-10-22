
import { useEffect, useState } from "react";
import { Star, MessageSquare, RefreshCw } from "lucide-react";

const API_URL = import.meta.env.VITE_API_URL;

interface Feedback {
  id: string;
  customerName: string;
  rating: number;
  message: string;
  createdAt: string;
}

export default function CustomerReviews() {
  const [feedbacks, setFeedbacks] = useState<Feedback[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const controller = new AbortController();

    async function loadReviews() {
      try {
        const response = await fetch(`${API_URL}/feedback/approved`, {
          signal: controller.signal,
        });

        if (!response.ok) {
          throw new Error("Unable to load customer reviews");
        }

        const data: unknown = await response.json();

        const reviews = Array.isArray(data)
          ? data
          : data &&
              typeof data === "object" &&
              "data" in data &&
              Array.isArray(data.data)
            ? data.data
            : [];

        setFeedbacks(reviews as Feedback[]);
      } catch (error) {
        if (error instanceof Error && error.name === "AbortError") {
          return;
        }

        console.error("Failed to load customer reviews:", error);
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    }

    void loadReviews();

    return () => controller.abort();
  }, []);

  const formatDate = (value: string) => {
    const date = new Date(value);

    if (Number.isNaN(date.getTime())) return "";

    return date.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  return (
    <section
      id="customer-reviews"
      className="bg-white px-4 py-16 sm:px-6 lg:px-8"
    >
      <div className="mx-auto max-w-7xl">
        <div className="mx-auto mb-10 max-w-2xl text-center">
          <span className="inline-block rounded-full bg-teal-50 px-4 py-2 text-xs font-bold uppercase tracking-widest text-teal-700">
            Customer Love
          </span>

          <h2 className="mt-4 text-3xl font-extrabold tracking-tight text-gray-900 sm:text-4xl">
            What Our Customers Say
          </h2>

          <p className="mt-3 text-sm leading-6 text-gray-500 sm:text-base">
            Real feedback from customers about their LIVEAZY rental experience.
          </p>
        </div>

        {loading ? (
          <div className="flex items-center justify-center gap-2 py-12 text-sm text-gray-500">
            <RefreshCw size={18} className="animate-spin" />
            Loading customer reviews...
          </div>
        ) : feedbacks.length === 0 ? (
          <div className="mx-auto max-w-lg rounded-2xl border border-dashed border-gray-200 px-6 py-10 text-center">
            <MessageSquare
              size={32}
              className="mx-auto mb-3 text-teal-600"
            />

            <h3 className="font-bold text-gray-800">
              Reviews coming soon
            </h3>

            <p className="mt-2 text-sm text-gray-500">
              Customer reviews will appear here once they are approved.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {feedbacks.map((feedback) => (
              <article
                key={feedback.id}
                className="flex h-full flex-col rounded-2xl border border-gray-100 bg-[#faf9f7] p-6 shadow-sm transition duration-200 hover:-translate-y-1 hover:shadow-md"
              >
                <div className="flex items-center gap-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                      key={star}
                      size={18}
                      className={
                        star <= feedback.rating
                          ? "fill-amber-400 text-amber-400"
                          : "text-gray-200"
                      }
                    />
                  ))}

                  <span className="ml-2 text-xs font-semibold text-gray-500">
                    {feedback.rating}/5
                  </span>
                </div>

                <p className="mt-5 flex-1 whitespace-pre-wrap break-words text-sm leading-7 text-gray-600">
                  “{feedback.message}”
                </p>

                <div className="mt-6 flex items-center gap-3 border-t border-gray-200 pt-4">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-teal-100 text-lg font-bold text-teal-800">
                    {feedback.customerName?.trim().charAt(0).toUpperCase() || "C"}
                  </div>

                  <div className="min-w-0">
                    <h3 className="truncate text-sm font-bold text-gray-900">
                      {feedback.customerName || "Customer"}
                    </h3>

                    <p className="mt-1 text-xs text-gray-400">
                      {formatDate(feedback.createdAt)}
                    </p>
                  </div>

                  <div className="ml-auto shrink-0 rounded-full bg-teal-50 px-2.5 py-1 text-[10px] font-bold text-teal-700">
                    Verified Feedback
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
