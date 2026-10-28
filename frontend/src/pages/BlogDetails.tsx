
import { useEffect, useState } from "react";
import DOMPurify from "dompurify";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft, CalendarDays } from "lucide-react";
import { getApiBaseUrl } from "../utils/api";

const API_URL = getApiBaseUrl();

interface Blog {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  featuredImage: string;
  imageAlt?: string | null;
  category: string;
  tags: string[];
  authorName: string;
  publishedAt: string | null;
}

function sanitizeBlogContent(content: string): string {
  const sanitized = DOMPurify.sanitize(content, {
    USE_PROFILES: { html: true },
    ADD_TAGS: ["iframe"],
    ADD_ATTR: [
      "src",
      "width",
      "height",
      "title",
      "allow",
      "allowfullscreen",
      "frameborder",
      "loading",
      "referrerpolicy",
    ],
  });

  const parsedContent = new DOMParser().parseFromString(
    sanitized,
    "text/html",
  );

  parsedContent.querySelectorAll("iframe").forEach((iframe) => {
    try {
      const url = new URL(iframe.getAttribute("src") || "");

      const allowedHosts = [
        "www.youtube.com",
        "youtube.com",
        "www.youtube-nocookie.com",
      ];

      if (
        url.protocol !== "https:" ||
        !allowedHosts.includes(url.hostname) ||
        !url.pathname.startsWith("/embed/")
      ) {
        iframe.remove();
        return;
      }

      iframe.setAttribute("loading", "lazy");
      iframe.setAttribute(
        "referrerpolicy",
        "strict-origin-when-cross-origin",
      );
      iframe.setAttribute(
        "allow",
        "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share",
      );
      iframe.setAttribute("allowfullscreen", "");
      iframe.setAttribute("title", "YouTube video");
    } catch {
      iframe.remove();
    }
  });

  return parsedContent.body.innerHTML;
}

export default function BlogDetails() {
  const { slug } = useParams<{ slug: string }>();

  const [blog, setBlog] = useState<Blog | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const controller = new AbortController();

    async function loadBlog() {
      setLoading(true);
      setError("");
      setBlog(null);

      try {
        if (!API_URL || !slug) {
          throw new Error("The blog URL or API configuration is invalid.");
        }

        const response = await fetch(
          `${API_URL}/blogs/slug/${encodeURIComponent(slug)}`,
          { signal: controller.signal },
        );

        if (response.status === 404) {
          throw new Error("This article is not available.");
        }

        if (!response.ok) {
          throw new Error("Unable to load the article. Please try again.");
        }

        const result: unknown = await response.json();

        const data =
          result &&
          typeof result === "object" &&
          "data" in result &&
          result.data &&
          typeof result.data === "object"
            ? result.data
            : result;

        setBlog(data as Blog);
      } catch (err) {
        if (err instanceof Error && err.name === "AbortError") {
          return;
        }

        setError(
          err instanceof Error
            ? err.message
            : "Something went wrong.",
        );
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    }

    loadBlog();

    return () => controller.abort();
  }, [slug]);

  if (loading) {
    return (
      <main className="min-h-[50vh] px-4 py-20 text-center text-slate-500">
        Loading article...
      </main>
    );
  }

  if (error || !blog) {
    return (
      <main className="min-h-[50vh] px-4 py-20 text-center">
        <h1 className="text-2xl font-bold text-[#0F2942]">
          Article not found
        </h1>

        <p className="mt-3 text-slate-600">
          {error || "This article is not available."}
        </p>

        <Link
          to="/blogs"
          className="mt-6 inline-flex rounded-xl bg-[#0F2942] px-5 py-3 font-semibold text-white hover:bg-[#008A90]"
        >
          <ArrowLeft className="mr-2" size={18} />
          Back to Blog
        </Link>
      </main>
    );
  }

  const safeContent = sanitizeBlogContent(blog.content || "");

  return (
    <main className="min-h-screen bg-white">
      <article className="mx-auto max-w-4xl px-4 py-10 sm:px-6 sm:py-14">
        <Link
          to="/blogs"
          className="inline-flex items-center gap-2 text-sm font-semibold text-[#008A90] hover:underline"
        >
          <ArrowLeft size={17} />
          All articles
        </Link>

        <div className="mt-8">
          <span className="inline-flex rounded-full bg-[#008A90]/10 px-3 py-1 text-sm font-semibold text-[#008A90]">
            {blog.category}
          </span>

          <h1 className="mt-5 text-3xl font-bold leading-tight text-[#0F2942] sm:text-5xl">
            {blog.title}
          </h1>

          <p className="mt-5 text-lg leading-8 text-slate-600">
            {blog.excerpt}
          </p>

          <div className="mt-5 flex flex-wrap items-center gap-4 text-sm text-slate-500">
            <span>By {blog.authorName}</span>

            {blog.publishedAt && (
              <span className="flex items-center gap-2">
                <CalendarDays size={16} />
                {new Date(blog.publishedAt).toLocaleDateString("en-IN", {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                })}
              </span>
            )}
          </div>
        </div>

        {blog.featuredImage && (
          <img
            src={blog.featuredImage}
            alt={blog.imageAlt || blog.title}
            className="mt-9 max-h-[520px] w-full rounded-2xl bg-slate-100 object-cover"
          />
        )}

        <div
          className="blog-content mt-10 break-words text-base leading-8 text-slate-700"
          dangerouslySetInnerHTML={{ __html: safeContent }}
        />

        {blog.tags?.length > 0 && (
          <div className="mt-10 flex flex-wrap gap-2 border-t border-slate-200 pt-6">
            {blog.tags.map((tag) => (
              <span
                key={tag}
                className="rounded-full bg-slate-100 px-3 py-1 text-sm text-slate-600"
              >
                #{tag}
              </span>
            ))}
          </div>
        )}

        <div className="mt-12 rounded-2xl bg-[#F6F8FD] p-6 sm:p-8">
          <h2 className="text-xl font-bold text-[#0F2942]">
            Explore more from LIVEAZY
          </h2>

          <p className="mt-2 text-slate-600">
            Discover rental furniture and ideas for your space.
          </p>

          <Link
            to="/blogs"
            className="mt-5 inline-flex items-center gap-2 font-semibold text-[#008A90]"
          >
            Explore all articles
            <ArrowLeft className="rotate-180" size={17} />
          </Link>
        </div>
      </article>
    </main>
  );
}
