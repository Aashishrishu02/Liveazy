
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

const API_URL = import.meta.env.VITE_API_URL;

export default function WhatsAppSettings() {
  const [whatsappNumber, setWhatsappNumber] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const navigate = useNavigate();

  // Fetch current WhatsApp number
  useEffect(() => {
    const fetchWhatsAppNumber = async () => {
      try {
        const response = await fetch(
          `${API_URL}/settings/whatsapp`
        );

        const data = await response.json();

        if (!response.ok) {
          throw new Error(
            data.message || "Failed to load WhatsApp number"
          );
        }

        setWhatsappNumber(data.whatsappNumber || "");
      } catch (err) {
        console.error("Error fetching WhatsApp number:", err);
        setError("Unable to load WhatsApp number. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    fetchWhatsAppNumber();
  }, []);

  // Save updated WhatsApp number
  const handleSave = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    setError("");
    setSuccess("");

    const digits = whatsappNumber.replace(/\D/g, "");

    if (digits.length < 10 || digits.length > 15) {
      setError(
        "Please enter a valid WhatsApp number with country code."
      );
      return;
    }

    setSaving(true);

    try {
      const token = localStorage.getItem("token");

      const response = await fetch(
        `${API_URL}/settings/whatsapp`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            ...(token
              ? { Authorization: `Bearer ${token}` }
              : {}),
          },
          body: JSON.stringify({
            whatsappNumber: digits,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || "Failed to update WhatsApp number"
        );
      }

      setWhatsappNumber(data.whatsappNumber);
      setSuccess("WhatsApp number updated successfully!");
    } catch (err) {
      console.error("Error updating WhatsApp number:", err);

      setError(
        err instanceof Error
          ? err.message
          : "Unable to update WhatsApp number."
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F5FAFA] p-6 md:p-8">
      {/* HEADER */}
      <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-[#123B63]">
            WhatsApp Settings
          </h1>

          <p className="mt-1 text-gray-500">
            Manage the WhatsApp contact number for your website.
          </p>
        </div>

        <button
          type="button"
          onClick={() => navigate("/admin/dashboard")}
          className="rounded-lg border border-[#D8EEF0] bg-white px-4 py-2 text-sm font-semibold text-[#123B63] transition hover:bg-gray-50"
        >
          ← Back to Dashboard
        </button>
      </div>

      {/* SETTINGS CARD */}
      <div className="max-w-2xl rounded-xl border border-[#D8EEF0] bg-white p-6 shadow-sm md:p-8">
        <div className="mb-6 flex items-center gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-[#0795A3]/10 text-2xl">
            📱
          </div>

          <div>
            <h2 className="text-xl font-bold text-[#123B63]">
              Website Contact Number
            </h2>

            <p className="mt-1 text-sm text-gray-500">
              Include the country code, for example 91 for India.
            </p>
          </div>
        </div>

        {loading ? (
          <p className="py-6 text-gray-500">
            Loading WhatsApp settings...
          </p>
        ) : (
          <form onSubmit={handleSave}>
            <label
              htmlFor="whatsappNumber"
              className="mb-2 block text-sm font-semibold text-[#123B63]"
            >
              WhatsApp Number
            </label>

            <input
              id="whatsappNumber"
              type="tel"
              value={whatsappNumber}
              onChange={(e) => {
                setWhatsappNumber(e.target.value);
                setError("");
                setSuccess("");
              }}
              placeholder="919876543210"
              required
              maxLength={20}
              className="h-12 w-full rounded-lg border border-gray-300 px-4 text-gray-800 outline-none transition focus:border-[#0795A3] focus:ring-2 focus:ring-[#0795A3]/10"
            />

            <p className="mt-2 text-xs text-gray-500">
              Enter 10–15 digits including the country code. Spaces
              and the + sign are allowed.
            </p>

            {error && (
              <p
                role="alert"
                className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-700"
              >
                {error}
              </p>
            )}

            {success && (
              <p
                role="status"
                className="mt-4 rounded-lg bg-green-50 p-3 text-sm text-green-700"
              >
                {success}
              </p>
            )}

            <button
              type="submit"
              disabled={saving}
              className="mt-6 w-full rounded-lg bg-[#123B63] px-5 py-3 font-semibold text-white transition hover:bg-[#0795A3] disabled:cursor-not-allowed disabled:bg-gray-400 sm:w-auto"
            >
              {saving ? "Saving..." : "Save WhatsApp Number"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
