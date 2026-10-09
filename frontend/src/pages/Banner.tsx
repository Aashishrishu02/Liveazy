import { useEffect, useState } from "react";

const API_URL = import.meta.env.VITE_API_URL;

interface BannerData {
  id: string;
  image: string;
  isActive: boolean;
  topLabel: string;
  heading: string;
  subtitle: string;
  button1Text: string;
  button1Link: string;
  button2Text: string;
  button2Link: string;
}

const defaultText = {
  topLabel: "NO INVESTMENT, JUST COMFORT",
  heading: "Furnish Your Home in Just 2 Days.",
  subtitle:
    "Delivery, Setup & Support — All Included. Starting at minimal rents across Pune & PCMC.",
  button1Text: "VIEW CATEGORIES",
  button1Link: "#categories",
  button2Text: "CALL HOTLINE",
  button2Link: "tel:+919423838109",
};

export default function Banner() {
  const [banner, setBanner] = useState<BannerData | null>(null);
  const [form, setForm] = useState(defaultText);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [savingText, setSavingText] = useState(false);
  const [fetching, setFetching] = useState(true);

  const fetchBanner = async () => {
    try {
      const response = await fetch(`${API_URL}/banners`);

      if (!response.ok) {
        throw new Error("Failed to fetch banner");
      }

      const data: BannerData | null = await response.json();
      setBanner(data);

      if (data) {
        setForm({
          topLabel: data.topLabel || defaultText.topLabel,
          heading: data.heading || defaultText.heading,
          subtitle: data.subtitle || defaultText.subtitle,
          button1Text: data.button1Text || defaultText.button1Text,
          button1Link: data.button1Link || defaultText.button1Link,
          button2Text: data.button2Text || defaultText.button2Text,
          button2Link: data.button2Link || defaultText.button2Link,
        });
      }
    } catch (error) {
      console.error("Error fetching banner:", error);
    } finally {
      setFetching(false);
    }
  };

  useEffect(() => {
    void fetchBanner();
  }, []);

  const handleFileChange = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];

    if (file) {
      setSelectedFile(file);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      alert("Please select a banner image first.");
      return;
    }

    try {
      setLoading(true);

      const formData = new FormData();
      formData.append("file", selectedFile);

      const response = await fetch(`${API_URL}/upload/banner`, {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Banner upload failed");
      }

      const data = await response.json();

      if (data.banner) {
        setBanner(data.banner);

        const uploaded = data.banner as BannerData;

        setForm({
          topLabel: uploaded.topLabel || form.topLabel,
          heading: uploaded.heading || form.heading,
          subtitle: uploaded.subtitle || form.subtitle,
          button1Text: uploaded.button1Text || form.button1Text,
          button1Link: uploaded.button1Link || form.button1Link,
          button2Text: uploaded.button2Text || form.button2Text,
          button2Link: uploaded.button2Link || form.button2Link,
        });
      } else {
        await fetchBanner();
      }

      setSelectedFile(null);
      alert("Banner uploaded successfully!");
    } catch (error) {
      console.error("Error uploading banner:", error);
      alert("Failed to upload banner.");
    } finally {
      setLoading(false);
    }
  };

  const handleTextSave = async () => {
    if (!banner) {
      alert("Please upload a banner image first.");
      return;
    }

    try {
      setSavingText(true);

      const response = await fetch(`${API_URL}/banners/active`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(form),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(errorData?.message || "Failed to save banner text");
      }

      const updatedBanner: BannerData = await response.json();
      setBanner(updatedBanner);

      setForm({
        topLabel: updatedBanner.topLabel,
        heading: updatedBanner.heading,
        subtitle: updatedBanner.subtitle,
        button1Text: updatedBanner.button1Text,
        button1Link: updatedBanner.button1Link,
        button2Text: updatedBanner.button2Text,
        button2Link: updatedBanner.button2Link,
      });

      alert("Homepage banner text updated successfully!");
    } catch (error) {
      console.error("Error saving banner text:", error);
      alert(
        error instanceof Error
          ? error.message
          : "Failed to save banner text."
      );
    } finally {
      setSavingText(false);
    }
  };

  const handleChange = (
    field: keyof typeof defaultText,
    value: string
  ) => {
    setForm((previous) => ({
      ...previous,
      [field]: value,
    }));
  };

  const inputClass =
    "w-full rounded-lg border border-[#D8EEF0] px-4 py-3 outline-none focus:border-[#0795A3] focus:ring-2 focus:ring-[#0795A3]/20";

  return (
    <div className="min-h-screen bg-[#F5FAFA] p-6 md:p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-[#123B63]">
          Banner Management
        </h1>
        <p className="mt-1 text-gray-500">
          Manage the homepage banner image and text from here.
        </p>
      </div>

      <div className="max-w-5xl space-y-6">
        {/* CURRENT BANNER */}
        <div className="rounded-xl border border-[#D8EEF0] bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-xl font-bold text-[#123B63]">
            Current Banner
          </h2>

          {fetching ? (
            <p className="text-gray-500">Loading banner...</p>
          ) : banner?.image ? (
            <img
              src={banner.image}
              alt="Current homepage banner"
              className="h-64 w-full rounded-lg object-cover md:h-80"
            />
          ) : (
            <div className="flex h-64 w-full items-center justify-center rounded-lg bg-gray-100 text-gray-500 md:h-80">
              No uploaded banner. Upload an image to enable text editing.
            </div>
          )}
        </div>

        {/* IMAGE UPLOAD */}
        <div className="rounded-xl border border-[#D8EEF0] bg-white p-6 shadow-sm">
          <h2 className="mb-2 text-xl font-bold text-[#123B63]">
            Change Banner Image
          </h2>

          <p className="mb-5 text-sm text-gray-500">
            Upload a new image to replace the current homepage banner.
          </p>

          <input
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            className="block w-full text-sm text-gray-600 file:mr-4 file:rounded-lg file:border-0 file:bg-[#123B63] file:px-4 file:py-2 file:font-semibold file:text-white hover:file:bg-[#0795A3]"
          />

          {selectedFile && (
            <p className="mt-3 text-sm text-gray-600">
              Selected: <span className="font-semibold">{selectedFile.name}</span>
            </p>
          )}

          <button
            type="button"
            onClick={handleUpload}
            disabled={loading || !selectedFile}
            className="mt-5 rounded-lg bg-[#123B63] px-6 py-3 font-semibold text-white transition hover:bg-[#0795A3] disabled:cursor-not-allowed disabled:bg-gray-400"
          >
            {loading ? "Uploading..." : "Upload Banner"}
          </button>
        </div>

        {/* EDIT BANNER TEXT */}
        <div className="rounded-xl border border-[#D8EEF0] bg-white p-6 shadow-sm">
          <h2 className="mb-2 text-xl font-bold text-[#123B63]">
            Edit Homepage Banner Text
          </h2>

          <p className="mb-6 text-sm text-gray-500">
            Changes will appear on the homepage after you save and the
            homepage fetches the updated banner.
          </p>

          <div className="space-y-5">
            <div>
              <label className="mb-2 block text-sm font-semibold text-gray-700">
                Top Label
              </label>
              <input
                className={inputClass}
                value={form.topLabel}
                onChange={(e) => handleChange("topLabel", e.target.value)}
                placeholder="NO INVESTMENT, JUST COMFORT"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-gray-700">
                Main Heading
              </label>
              <textarea
                className={inputClass}
                rows={2}
                value={form.heading}
                onChange={(e) => handleChange("heading", e.target.value)}
                placeholder="Furnish Your Home in Just 2 Days."
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-gray-700">
                Subtitle / Description
              </label>
              <textarea
                className={inputClass}
                rows={3}
                value={form.subtitle}
                onChange={(e) => handleChange("subtitle", e.target.value)}
                placeholder="Enter banner description"
              />
            </div>

            <div className="grid gap-5 md:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-semibold text-gray-700">
                  Button 1 Text
                </label>
                <input
                  className={inputClass}
                  value={form.button1Text}
                  onChange={(e) =>
                    handleChange("button1Text", e.target.value)
                  }
                  placeholder="VIEW CATEGORIES"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-gray-700">
                  Button 1 Link
                </label>
                <input
                  className={inputClass}
                  value={form.button1Link}
                  onChange={(e) =>
                    handleChange("button1Link", e.target.value)
                  }
                  placeholder="#categories"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-gray-700">
                  Button 2 Text
                </label>
                <input
                  className={inputClass}
                  value={form.button2Text}
                  onChange={(e) =>
                    handleChange("button2Text", e.target.value)
                  }
                  placeholder="CALL HOTLINE"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-gray-700">
                  Button 2 Link
                </label>
                <input
                  className={inputClass}
                  value={form.button2Link}
                  onChange={(e) =>
                    handleChange("button2Link", e.target.value)
                  }
                  placeholder="tel:+919423838109"
                />
              </div>
            </div>

            <button
              type="button"
              onClick={handleTextSave}
              disabled={savingText || fetching || !banner}
              className="rounded-lg bg-[#0795A3] px-6 py-3 font-semibold text-white transition hover:bg-[#123B63] disabled:cursor-not-allowed disabled:bg-gray-400"
            >
              {savingText ? "Saving Changes..." : "Save Banner Text"}
            </button>

            {!banner && !fetching && (
              <p className="text-sm text-amber-700">
                Upload a banner image first, then you can save the text.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
