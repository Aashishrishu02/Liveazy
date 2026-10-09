
import { useEffect, useState } from "react";

const API_URL = import.meta.env.VITE_API_URL;
const DEFAULT_MESSAGE = "Hi LIVEAZY!";

export default function WhatsAppSettings() {
  const [whatsappNumber, setWhatsappNumber] = useState("");
  const [whatsappMessage, setWhatsappMessage] =
    useState(DEFAULT_MESSAGE);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        setLoading(true);
        setError("");

        const response = await fetch(
          `${API_URL}/settings/whatsapp`
        );

        if (!response.ok) {
          throw new Error("Failed to load WhatsApp settings.");
        }

        const data = await response.json();

        setWhatsappNumber(data.whatsappNumber ?? "");
        setWhatsappMessage(
          data.whatsappMessage || DEFAULT_MESSAGE
        );
      } catch (err) {
        console.error("Error loading WhatsApp settings:", err);
        setError(
          "Failed to load WhatsApp settings. Please check the backend."
        );
      } finally {
        setLoading(false);
      }
    };

    fetchSettings();
  }, []);

  const handleSave = async (
    event: React.FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();

    setError("");
    setSuccess("");

    const digits = whatsappNumber.replace(/\D/g, "");
    const message = whatsappMessage.trim();

    if (digits.length < 10 || digits.length > 15) {
      setError(
        "Enter a valid WhatsApp number with or without the country code."
      );
      return;
    }

    if (!message) {
      setError("WhatsApp message cannot be empty.");
      return;
    }

    try {
      setSaving(true);

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
            whatsappMessage: message,
          }),
        }
      );

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(
          data.message || "Failed to save WhatsApp settings."
        );
      }

      setWhatsappNumber(data.whatsappNumber ?? digits);
      setWhatsappMessage(
        data.whatsappMessage ?? message
      );

      setSuccess("WhatsApp settings saved successfully!");
    } catch (err) {
      console.error("Error saving WhatsApp settings:", err);

      setError(
        err instanceof Error
          ? err.message
          : "An error occurred while saving settings."
      );
    } finally {
      setSaving(false);
    }
  };

  const previewMessage = whatsappMessage.replace(
    /\{productName\}/gi,
    "Comfortable Sofa"
  );

  if (loading) {
    return (
      <div className="flex min-h-[300px] items-center justify-center">
        <p className="text-gray-500">
          Loading WhatsApp settings...
        </p>
      </div>
    );
  }

  return (
    <section className="min-h-screen bg-gray-50 px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-3xl">
        <div className="mb-8">
          <p className="text-sm font-semibold uppercase tracking-wider text-[#0795A3]">
            LIVEAZY Admin
          </p>

          <h1 className="mt-2 text-2xl font-bold text-gray-900 sm:text-3xl">
            WhatsApp Settings
          </h1>

          <p className="mt-2 text-sm text-gray-600">
            Manage the WhatsApp number and customer message displayed
            on the homepage.
          </p>
        </div>

        <form
          onSubmit={handleSave}
          className="space-y-6 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm sm:p-8"
        >
          <div>
            <label
              htmlFor="whatsappNumber"
              className="mb-2 block text-sm font-semibold text-gray-800"
            >
              WhatsApp Number
            </label>

            <input
              id="whatsappNumber"
              type="tel"
              value={whatsappNumber}
              onChange={(event) =>
                setWhatsappNumber(event.target.value)
              }
              placeholder="e.g. 919876543210"
              required
              className="w-full rounded-lg border border-gray-300 px-4 py-3 text-sm outline-none transition focus:border-[#0795A3] focus:ring-2 focus:ring-[#0795A3]/20"
            />

            <p className="mt-2 text-xs text-gray-500">
              Enter the number with or without the country code.
            </p>
          </div>

          <div>
            <label
              htmlFor="whatsappMessage"
              className="mb-2 block text-sm font-semibold text-gray-800"
            >
              Default WhatsApp Message
            </label>

            <textarea
              id="whatsappMessage"
              value={whatsappMessage}
              onChange={(event) =>
                setWhatsappMessage(event.target.value)
              }
              rows={5}
              required
              placeholder="Enter the message customers will send..."
              className="w-full resize-y rounded-lg border border-gray-300 px-4 py-3 text-sm leading-6 outline-none transition focus:border-[#0795A3] focus:ring-2 focus:ring-[#0795A3]/20"
            />

            <p className="mt-2 text-xs text-gray-500">
              Use{" "}
              <code className="rounded bg-gray-100 px-1 py-0.5 text-[#0795A3]">
                {"{productName}"}
              </code>{" "}
              to insert the product name into the message.
            </p>
          </div>

          <div className="rounded-xl border border-[#0795A3]/20 bg-[#F5FAFA] p-4">
            <p className="mb-2 text-sm font-semibold text-gray-800">
              Message Preview
            </p>

            <p className="whitespace-pre-wrap break-words text-sm leading-6 text-gray-600">
              {previewMessage ||
                "Your message preview will appear here."}
            </p>
          </div>

          {error && (
            <div
              role="alert"
              className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
            >
              {error}
            </div>
          )}

          {success && (
            <div
              role="status"
              className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700"
            >
              {success}
            </div>
          )}

          <button
            type="submit"
            disabled={saving}
            className="flex w-full items-center justify-center rounded-lg bg-[#0795A3] px-5 py-3 font-semibold text-white transition hover:bg-[#067985] disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
          >
            {saving ? "Saving..." : "Save WhatsApp Settings"}
          </button>
        </form>
      </div>
    </section>
  );
}
