import { useEffect, useState } from "react";

const API_URL = import.meta.env.VITE_API_URL;

interface BannerData {
  id: string;
  image: string;
  isActive: boolean;
}

export default function Banner() {
  const [banner, setBanner] = useState<BannerData | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);

  // Current banner fetch krega
  useEffect(() => {
    const fetchBanner = async () => {
      try {
        const response = await fetch(`${API_URL}/banners`);

        if (!response.ok) {
          throw new Error("Failed to fetch banner");
        }

        const data = await response.json();
        setBanner(data);
      } catch (error) {
        console.error("Error fetching banner:", error);
      } finally {
        setFetching(false);
      }
    };

    fetchBanner();
  }, []);

  // File select
  const handleFileChange = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];

    if (file) {
      setSelectedFile(file);
    }
  };

  // Upload banner
  const handleUpload = async () => {
    if (!selectedFile) {
      alert("Please select a banner image first.");
      return;
    }

    try {
      setLoading(true);

      const formData = new FormData();
      formData.append("file", selectedFile);

      const response = await fetch(
        `${API_URL}/upload/banner`,
        {
          method: "POST",
          body: formData,
        }
      );

      if (!response.ok) {
        throw new Error("Banner upload failed");
      }

      const data = await response.json();

      setBanner(data.banner);
      setSelectedFile(null);

      alert("Banner uploaded successfully!");
    } catch (error) {
      console.error("Error uploading banner:", error);
      alert("Failed to upload banner.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F5FAFA] p-6 md:p-8">

      {/* HEADER */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-[#123B63]">
          Banner Management
        </h1>

        <p className="text-gray-500 mt-1">
          Manage the homepage banner from here.
        </p>
      </div>

      <div className="max-w-5xl">

        {/* CURRENT BANNER */}
        <div className="bg-white rounded-xl border border-[#D8EEF0] p-6 shadow-sm">

          <h2 className="text-xl font-bold text-[#123B63] mb-4">
            Current Banner
          </h2>

          {fetching ? (
            <p className="text-gray-500">
              Loading banner...
            </p>
          ) : banner?.image ? (
            <img
              src={banner.image}
              alt="Current homepage banner"
              className="w-full h-64 md:h-80 object-cover rounded-lg"
            />
          ) : (
            <div className="w-full h-64 md:h-80 rounded-lg bg-gray-100 flex items-center justify-center text-gray-500">
              No uploaded banner
            </div>
          )}

        </div>

        {/* UPLOAD */}
        <div className="bg-white rounded-xl border border-[#D8EEF0] p-6 shadow-sm mt-6">

          <h2 className="text-xl font-bold text-[#123B63] mb-2">
            Change Banner
          </h2>

          <p className="text-sm text-gray-500 mb-5">
            Upload a new image to replace the current homepage banner.
          </p>

          <input
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            className="block w-full text-sm text-gray-600
              file:mr-4 file:py-2 file:px-4
              file:rounded-lg file:border-0
              file:bg-[#123B63] file:text-white
              file:font-semibold
              hover:file:bg-[#0795A3]"
          />

          {selectedFile && (
            <p className="text-sm text-gray-600 mt-3">
              Selected:{" "}
              <span className="font-semibold">
                {selectedFile.name}
              </span>
            </p>
          )}

          <button
            onClick={handleUpload}
            disabled={loading || !selectedFile}
            className="mt-5 bg-[#123B63] hover:bg-[#0795A3]
              disabled:bg-gray-400
              text-white px-6 py-3 rounded-lg
              font-semibold transition"
          >
            {loading ? "Uploading..." : "Upload Banner"}
          </button>

        </div>

      </div>
    </div>
  );
}