import React, { useEffect, useState } from "react";

const API_URL = import.meta.env.VITE_API_URL;

interface PromoBannerData {
  id: string;
  image: string;
  label: string;
  heading: string;
  subtitle: string;
  buttonText: string;
  buttonLink: string;
  isActive: boolean;
  sortOrder: number;
}

const emptyBanner = {
  image: "",
  label: "",
  heading: "",
  subtitle: "",
  buttonText: "",
  buttonLink: "#products",
  isActive: true,
  sortOrder: 0,
};

export default function PromoBanners() {
  const [banners, setBanners] = useState<PromoBannerData[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [uploadingId, setUploadingId] = useState<string | null>(null);
  const [uploadingNew, setUploadingNew] = useState(false);
  const [adding, setAdding] = useState(false);
  const [newBanner, setNewBanner] = useState(emptyBanner);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const getHeaders = (): HeadersInit => {
    const token = localStorage.getItem("token");
    return {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };
  };

  const uploadPromoImage = async (file: File): Promise<string> => {
    if (!file.type.startsWith("image/")) {
      throw new Error("Please select a valid image file.");
    }

    if (file.size > 5 * 1024 * 1024) {
      throw new Error("Image size must be 5 MB or less.");
    }

    const formData = new FormData();
    formData.append("file", file);

    const token = localStorage.getItem("token");
    const response = await fetch(`${API_URL}/upload/promo-banner`, {
      method: "POST",
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body: formData,
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok || !data.url) {
      throw new Error(
        Array.isArray(data.message)
          ? data.message.join(", ")
          : data.message || "Image upload failed."
      );
    }

    return data.url;
  };

  const loadBanners = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await fetch(`${API_URL}/promo-banners/admin`, {
        headers: getHeaders(),
      });

      if (!response.ok) {
        throw new Error("Failed to load promo banners.");
      }

      const data: PromoBannerData[] = await response.json();
      setBanners(data);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Something went wrong."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadBanners();
  }, []);

  const updateField = (
    id: string,
    field: keyof PromoBannerData,
    value: string | boolean | number
  ) => {
    setBanners((current) =>
      current.map((banner) =>
        banner.id === id ? { ...banner, [field]: value } : banner
      )
    );
  };

  const handleExistingImageUpload = async (
    bannerId: string,
    file: File
  ) => {
    try {
      setUploadingId(bannerId);
      setError("");
      setSuccess("");

      const imageUrl = await uploadPromoImage(file);
      updateField(bannerId, "image", imageUrl);
      setSuccess("Image uploaded. Click Save Changes to apply it.");
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Image upload failed."
      );
    } finally {
      setUploadingId(null);
    }
  };

  const handleNewImageUpload = async (file: File) => {
    try {
      setUploadingNew(true);
      setError("");
      setSuccess("");

      const imageUrl = await uploadPromoImage(file);
      setNewBanner((current) => ({ ...current, image: imageUrl }));
      setSuccess("Image uploaded successfully.");
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Image upload failed."
      );
    } finally {
      setUploadingNew(false);
    }
  };

  const saveBanner = async (banner: PromoBannerData) => {
    try {
      setSavingId(banner.id);
      setError("");
      setSuccess("");

      const response = await fetch(`${API_URL}/promo-banners/${banner.id}`, {
        method: "PATCH",
        headers: getHeaders(),
        body: JSON.stringify({
          image: banner.image,
          label: banner.label,
          heading: banner.heading,
          subtitle: banner.subtitle,
          buttonText: banner.buttonText,
          buttonLink: banner.buttonLink,
          isActive: banner.isActive,
          sortOrder: Number(banner.sortOrder),
        }),
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(
          Array.isArray(data.message)
            ? data.message.join(", ")
            : data.message || "Failed to save banner."
        );
      }

      setBanners((current) =>
        current.map((item) => (item.id === banner.id ? data : item))
      );
      setSuccess(`"${banner.heading}" saved successfully.`);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to save banner."
      );
    } finally {
      setSavingId(null);
    }
  };

  const createBanner = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!newBanner.image) {
      setError("Please upload a banner image first.");
      return;
    }

    try {
      setAdding(true);
      setError("");
      setSuccess("");

      const response = await fetch(`${API_URL}/promo-banners`, {
        method: "POST",
        headers: getHeaders(),
        body: JSON.stringify({
          ...newBanner,
          sortOrder: Number(newBanner.sortOrder),
        }),
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(
          Array.isArray(data.message)
            ? data.message.join(", ")
            : data.message || "Failed to create banner."
        );
      }

      setBanners((current) =>
        [...current, data].sort((a, b) => a.sortOrder - b.sortOrder)
      );
      setNewBanner({
        ...emptyBanner,
        sortOrder: banners.length,
      });
      setSuccess("Promo banner created successfully.");
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to create banner."
      );
    } finally {
      setAdding(false);
    }
  };

  const deleteBanner = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this promo banner?")) {
      return;
    }

    try {
      setError("");
      setSuccess("");

      const response = await fetch(`${API_URL}/promo-banners/${id}`, {
        method: "DELETE",
        headers: getHeaders(),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.message || "Failed to delete banner.");
      }

      setBanners((current) =>
        current.filter((banner) => banner.id !== id)
      );
      setSuccess("Promo banner deleted successfully.");
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to delete banner."
      );
    }
  };

  if (loading) {
    return (
      <div className="p-8 text-center text-gray-500">
        Loading promo banners...
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50 px-4 py-8 sm:px-6">
      <div className="mx-auto max-w-5xl">
        <p className="text-sm font-semibold uppercase tracking-wider text-[#0795A3]">
          LIVEAZY Admin
        </p>

        <h1 className="mt-2 text-2xl font-bold text-gray-900 sm:text-3xl">
          Promo Banner Management
        </h1>

        <p className="mt-2 text-sm text-gray-600">
          Manage homepage promo images and content.
        </p>

        {error && (
          <div
            role="alert"
            className="mt-5 rounded-lg bg-red-50 p-3 text-sm text-red-700"
          >
            {error}
          </div>
        )}

        {success && (
          <div
            role="status"
            className="mt-5 rounded-lg bg-green-50 p-3 text-sm text-green-700"
          >
            {success}
          </div>
        )}

        <div className="mt-6 space-y-6">
          {banners.length === 0 && (
            <div className="rounded-xl border border-gray-200 bg-white p-6 text-sm text-gray-500">
              No promo banners found. Add one below.
            </div>
          )}

          {banners.map((banner) => (
            <section
              key={banner.id}
              className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm sm:p-6"
            >
              <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
                <h2 className="text-lg font-bold text-gray-900">
                  Promo Banner {banner.sortOrder + 1}
                </h2>

                <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                  <input
                    type="checkbox"
                    checked={banner.isActive}
                    onChange={(event) =>
                      updateField(banner.id, "isActive", event.target.checked)
                    }
                    className="h-4 w-4 accent-[#0795A3]"
                  />
                  Show on homepage
                </label>
              </div>

              {banner.image && (
                <img
                  src={banner.image}
                  alt={banner.heading || "Promo preview"}
                  onError={(event) => {
                    event.currentTarget.style.display = "none";
                  }}
                  className="mb-5 h-44 w-full rounded-lg bg-gray-100 object-cover"
                />
              )}

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="md:col-span-2">
                  <label className="mb-2 block text-sm font-medium text-gray-700">
                    Change Promo Image
                  </label>
                  <input
                    type="file"
                    accept="image/*"
                    disabled={uploadingId === banner.id}
                    onChange={(event) => {
                      const file = event.target.files?.[0];
                      if (file) {
                        void handleExistingImageUpload(banner.id, file);
                      }
                      event.target.value = "";
                    }}
                    className="block w-full rounded-lg border border-gray-300 p-2 text-sm file:mr-4 file:rounded-md file:border-0 file:bg-[#0795A3] file:px-3 file:py-2 file:text-sm file:font-semibold file:text-white"
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    JPG, PNG or WebP. Maximum file size: 5 MB.
                  </p>
                  {uploadingId === banner.id && (
                    <p className="mt-2 text-sm font-medium text-[#0795A3]">
                      Uploading image...
                    </p>
                  )}
                </div>

                <Field
                  label="Small Label"
                  value={banner.label}
                  onChange={(value) => updateField(banner.id, "label", value)}
                  placeholder="NEW ARRIVALS"
                />

                <Field
                  label="Heading"
                  value={banner.heading}
                  onChange={(value) => updateField(banner.id, "heading", value)}
                  placeholder="Modern Furniture For Every Home"
                />

                <Field
                  label="Button Text"
                  value={banner.buttonText}
                  onChange={(value) =>
                    updateField(banner.id, "buttonText", value)
                  }
                  placeholder="VIEW MORE"
                />

                <Field
                  label="Button Link"
                  value={banner.buttonLink}
                  onChange={(value) =>
                    updateField(banner.id, "buttonLink", value)
                  }
                  placeholder="#products or https://example.com"
                />

                <Field
                  label="Display Order (0 comes first)"
                  type="number"
                  value={String(banner.sortOrder)}
                  onChange={(value) =>
                    updateField(banner.id, "sortOrder", Number(value))
                  }
                />

                <div className="md:col-span-2">
                  <label className="mb-1 block text-sm font-medium text-gray-700">
                    Subtitle
                  </label>
                  <textarea
                    value={banner.subtitle}
                    onChange={(event) =>
                      updateField(banner.id, "subtitle", event.target.value)
                    }
                    rows={3}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-[#0795A3] focus:ring-2 focus:ring-[#0795A3]/20"
                  />
                </div>
              </div>

              <div className="mt-5 flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={() => void saveBanner(banner)}
                  disabled={
                    savingId === banner.id || uploadingId === banner.id
                  }
                  className="rounded-lg bg-[#0795A3] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#067985] disabled:opacity-60"
                >
                  {savingId === banner.id ? "Saving..." : "Save Changes"}
                </button>

                <button
                  type="button"
                  onClick={() => void deleteBanner(banner.id)}
                  className="rounded-lg border border-red-200 px-5 py-2.5 text-sm font-semibold text-red-600 hover:bg-red-50"
                >
                  Delete
                </button>
              </div>
            </section>
          ))}
        </div>

        <section className="mt-8 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm sm:p-6">
          <h2 className="text-lg font-bold text-gray-900">
            Add New Promo Banner
          </h2>

          <form onSubmit={createBanner} className="mt-5 space-y-4">
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Promo Image
              </label>
              <input
                type="file"
                accept="image/*"
                disabled={uploadingNew}
                onChange={(event) => {
                  const file = event.target.files?.[0];
                  if (file) {
                    void handleNewImageUpload(file);
                  }
                  event.target.value = "";
                }}
                className="block w-full rounded-lg border border-gray-300 p-2 text-sm file:mr-4 file:rounded-md file:border-0 file:bg-[#0795A3] file:px-3 file:py-2 file:text-sm file:font-semibold file:text-white"
              />
              <p className="mt-1 text-xs text-gray-500">
                JPG, PNG or WebP. Maximum file size: 5 MB.
              </p>
              {uploadingNew && (
                <p className="mt-2 text-sm font-medium text-[#0795A3]">
                  Uploading image...
                </p>
              )}
              {newBanner.image && (
                <img
                  src={newBanner.image}
                  alt={newBanner.heading || "New promo preview"}
                  className="mt-3 h-44 w-full rounded-lg bg-gray-100 object-cover"
                />
              )}
            </div>

            <Field
              label="Small Label"
              value={newBanner.label}
              onChange={(value) =>
                setNewBanner((old) => ({ ...old, label: value }))
              }
              placeholder="SPECIAL OFFER"
            />

            <Field
              label="Heading"
              value={newBanner.heading}
              onChange={(value) =>
                setNewBanner((old) => ({ ...old, heading: value }))
              }
              placeholder="Your promo heading"
            />

            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Subtitle
              </label>
              <textarea
                required
                value={newBanner.subtitle}
                onChange={(event) =>
                  setNewBanner((old) => ({
                    ...old,
                    subtitle: event.target.value,
                  }))
                }
                rows={3}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-[#0795A3]"
              />
            </div>

            <Field
              label="Button Text"
              value={newBanner.buttonText}
              onChange={(value) =>
                setNewBanner((old) => ({ ...old, buttonText: value }))
              }
              placeholder="CLAIM NOW"
            />

            <Field
              label="Button Link"
              value={newBanner.buttonLink}
              onChange={(value) =>
                setNewBanner((old) => ({ ...old, buttonLink: value }))
              }
              placeholder="#products"
            />

            <Field
              label="Display Order"
              type="number"
              value={String(newBanner.sortOrder)}
              onChange={(value) =>
                setNewBanner((old) => ({
                  ...old,
                  sortOrder: Number(value),
                }))
              }
            />

            <button
              type="submit"
              disabled={adding || uploadingNew || !newBanner.image}
              className="rounded-lg bg-[#123B63] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#0795A3] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {uploadingNew
                ? "Uploading Image..."
                : adding
                  ? "Creating..."
                  : "Add Promo Banner"}
            </button>
          </form>
        </section>
      </div>
    </main>
  );
}

interface FieldProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  type?: string;
}

function Field({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
}: FieldProps) {
  return (
    <div>
      <label className="mb-1 block text-sm font-medium text-gray-700">
        {label}
      </label>
      <input
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        required={type !== "number"}
        min={type === "number" ? 0 : undefined}
        className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none focus:border-[#0795A3] focus:ring-2 focus:ring-[#0795A3]/20"
      />
    </div>
  );
}
