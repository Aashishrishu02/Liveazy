import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, CalendarDays, Search } from "lucide-react";

const API_URL = (import.meta.env.VITE_API_URL || "").replace(/\/$/, "");

interface Blog {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  featuredImage: string;
  imageAlt?: string | null;
  category: string;
  tags: string[];
  authorName: string;
  featured: boolean;
  publishedAt: string | null;
}

function formatDate(date: string | null) {
  if (!date) return "Recently published";

  return new Date(date).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export default function BlogListing() {
  const [blogs, setBlogs] = useState<Blog[]>([]);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const controller = new AbortController();

    async function loadBlogs() {
      setLoading(true);
      setError("");

      try {
        if (!API_URL) {
          throw new Error("API URL configured nahi hai.");
        }

        const params = new URLSearchParams();
        if (search.trim()) params.set("q", search.trim());
        if (category) params.set("category", category);

        const suffix = params.toString();
        const response = await fetch(
          `${API_URL}/blogs${suffix ? `?${suffix}` : ""}`,
          { signal: controller.signal },
        );

        if (!response.ok) {
          throw new Error("Blogs load nahi ho paaye.");
        }

        const result: unknown = await response.json();

        const list = Array.isArray(result)
          ? result
          : result &&
              typeof result === "object" &&
              "data" in result &&
              Array.isArray(result.data)
            ? result.data
            : [];

        setBlogs(list as Blog[]);
      } catch (err) {
        if (err instanceof Error && err.name === "AbortError") return;

        setError(
          err instanceof Error ? err.message : "Kuch galat ho gaya.",
        );
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }

    const timeout = window.setTimeout(loadBlogs, 250);

    return () => {
      window.clearTimeout(timeout);
      controller.abort();
    };
  }, [search, category]);

  const categories = [...new Set(blogs.map((blog) => blog.category))];

  return (
    <main className="min-h-screen bg-[#F6F8FD]">
      <section className="bg-[#0F2942] px-4 py-16 text-white sm:py-20">
        <div className="mx-auto max-w-6xl">
          <p className="mb-3 text-sm font-semibold uppercase tracking-[0.2em] text-teal-300">
            The LIVEAZY Journal
          </p>
          <h1 className="max-w-3xl text-4xl font-bold leading-tight sm:text-5xl">
            Ideas for better living and smarter renting.
          </h1>
          <p className="mt-5 max-w-2xl text-base leading-7 text-slate-200">
            Discover home styling tips, furniture guides and practical ideas
            to make your space feel like home.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="mb-8 flex flex-col gap-4 sm:flex-row">
          <div className="relative flex-1">
            <Search
              size={18}
              className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search articles..."
              aria-label="Search blogs"
              className="h-12 w-full rounded-xl border border-slate-200 bg-white pl-11 pr-4 outline-none focus:border-[#008A90] focus:ring-4 focus:ring-[#008A90]/10"
            />
          </div>

          <select
            value={category}
            onChange={(event) => setCategory(event.target.value)}
            aria-label="Filter by category"
            className="h-12 rounded-xl border border-slate-200 bg-white px-4 text-sm text-[#0F2942] outline-none focus:border-[#008A90]"
          >
            <option value="">All categories</option>
            {categories.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
        </div>

        {loading ? (
          <p className="py-16 text-center text-slate-500">
            Loading articles...
          </p>
        ) : error ? (
          <div className="rounded-xl bg-white p-8 text-center text-red-600">
            {error}
            <p className="mt-2 text-sm text-slate-500">
              Backend status aur VITE_API_URL check karo.
            </p>
          </div>
        ) : blogs.length === 0 ? (
          <div className="rounded-xl bg-white px-6 py-16 text-center">
            <h2 className="text-xl font-semibold text-[#0F2942]">
              No articles found
            </h2>
            <p className="mt-2 text-sm text-slate-500">
              Abhi koi published blog available nahi hai, ya search se match
              nahi mila.
            </p>
          </div>
        ) : (
          <div className="grid gap-7 sm:grid-cols-2 lg:grid-cols-3">
            {blogs.map((blog) => (
              <article
                key={blog.id}
                className="group overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-lg"
              >
                <Link
                  to={`/blogs/${encodeURIComponent(blog.slug)}`}
                  className="block"
                >
                  <div className="aspect-[16/10] overflow-hidden bg-slate-100">
                    <img
                      src={blog.featuredImage}
                      alt={blog.imageAlt || blog.title}
                      loading="lazy"
                      className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                    />
                  </div>

                  <div className="p-5">
                    <div className="mb-3 flex flex-wrap items-center gap-3 text-xs text-slate-500">
                      <span className="rounded-full bg-[#008A90]/10 px-3 py-1 font-semibold text-[#008A90]">
                        {blog.category}
                      </span>
                      <span className="flex items-center gap-1">
                        <CalendarDays size={14} />
                        {formatDate(blog.publishedAt)}
                      </span>
                    </div>

                    <h2 className="line-clamp-2 text-xl font-bold text-[#0F2942] transition group-hover:text-[#008A90]">
                      {blog.title}
                    </h2>

                    <p className="mt-3 line-clamp-3 text-sm leading-6 text-slate-600">
                      {blog.excerpt}
                    </p>

                    <span className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-[#008A90]">
                      Read article <ArrowRight size={16} />
                    </span>
                  </div>
                </Link>
              </article>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}