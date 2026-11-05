import { getApiBaseUrl } from "./api";
import type { CartItem } from "../types/rental";

export interface WhatsAppSettings {
  whatsappNumber?: string;
  whatsappMessage?: string;
}

/**
 * Normalizes a raw phone number for WhatsApp wa.me links.
 * - Strips all non-digit characters.
 * - If 10-digit standard Indian mobile number is provided, automatically prefixes 91.
 * - Validates length is between 10 and 15 digits (E.164 standard).
 * - Returns digits-only string, or null if invalid.
 */
export function normalizeWhatsAppNumber(rawNumber?: string | null): string | null {
  if (!rawNumber) return null;
  const digits = String(rawNumber).replace(/\D/g, "");
  if (!digits) return null;

  // Standard 10-digit Indian mobile number without country code
  const normalized = digits.length === 10 ? `91${digits}` : digits;

  if (normalized.length >= 10 && normalized.length <= 15) {
    return normalized;
  }
  return null;
}

/**
 * Short-lived in-memory cache to debounce rapid repeated clicks
 * while guaranteeing fresh updates when admin changes configuration.
 */
let cachedNumber: { number: string; timestamp: number } | null = null;
const CACHE_TTL_MS = 3000;

export function invalidateWhatsAppNumberCache(): void {
  cachedNumber = null;
}

/**
 * Fetches the latest configured WhatsApp number from the backend settings API.
 * Uses GET /settings/whatsapp with cache-busting timestamp to prevent stale numbers.
 * Falls back to GET /settings/social if needed.
 * Throws an Error if no valid WhatsApp number could be retrieved.
 */
export async function fetchConfiguredWhatsAppNumber(options?: {
  forceFresh?: boolean;
  signal?: AbortSignal;
}): Promise<string> {
  const now = Date.now();
  if (
    !options?.forceFresh &&
    cachedNumber &&
    now - cachedNumber.timestamp < CACHE_TTL_MS
  ) {
    return cachedNumber.number;
  }

  const apiBase = getApiBaseUrl();
  const timestamp = Date.now();
  let candidateNumber: string | null = null;
  let lastError: unknown = null;

  // 1. Try primary endpoint /settings/whatsapp
  try {
    const res = await fetch(`${apiBase}/settings/whatsapp?_t=${timestamp}`, {
      method: "GET",
      headers: {
        Accept: "application/json",
        "Cache-Control": "no-cache, no-store, must-revalidate",
        Pragma: "no-cache",
      },
      signal: options?.signal,
    });

    if (res.ok) {
      const data = (await res.json()) as WhatsAppSettings;
      candidateNumber = normalizeWhatsAppNumber(data?.whatsappNumber);
    }
  } catch (err) {
    lastError = err;
  }

  // 2. Fallback to /settings/social if primary returned invalid/empty number
  if (!candidateNumber) {
    try {
      const res = await fetch(`${apiBase}/settings/social?_t=${timestamp}`, {
        method: "GET",
        headers: {
          Accept: "application/json",
          "Cache-Control": "no-cache, no-store, must-revalidate",
          Pragma: "no-cache",
        },
        signal: options?.signal,
      });

      if (res.ok) {
        const data = (await res.json()) as { whatsappNumber?: string };
        candidateNumber = normalizeWhatsAppNumber(data?.whatsappNumber);
      }
    } catch (err) {
      lastError = err;
    }
  }

  if (!candidateNumber) {
    const detail =
      lastError instanceof Error
        ? lastError.message
        : "No valid WhatsApp checkout number is currently configured in Settings.";
    throw new Error(
      `WhatsApp checkout is currently unavailable. (${detail})`
    );
  }

  cachedNumber = { number: candidateNumber, timestamp: now };
  return candidateNumber;
}

/**
 * Formats the exact customer cart message for WhatsApp checkout:
 * - List of items with tenure and quantity
 * - Delivery city (if specified)
 * - Confirmation request
 */
export function formatCartCheckoutMessage(
  cartItems: CartItem[],
  selectedCity?: string
): string {
  const lines = cartItems.map(
    (item) =>
      `• ${item.product.name} (${item.selectedTenure}M tenure) x ${item.quantity}`
  );

  const citySection = selectedCity ? `\n\nDelivery City: ${selectedCity}` : "";

  return `Hello LIVEAZY! I would like to book rental for:\n${lines.join(
    "\n"
  )}${citySection}\nPlease share rental booking confirmation!`;
}

/**
 * Builds the official wa.me checkout link.
 */
export function generateWhatsAppCheckoutUrl(
  whatsappNumber: string,
  cartItems: CartItem[],
  selectedCity?: string
): string {
  const normalized = normalizeWhatsAppNumber(whatsappNumber);
  if (!normalized) {
    throw new Error("Invalid WhatsApp number configured.");
  }

  const message = formatCartCheckoutMessage(cartItems, selectedCity);
  return `https://wa.me/${normalized}?text=${encodeURIComponent(message)}`;
}

/**
 * Initiates the checkout redirect to WhatsApp:
 * 1. Checks that cart has items
 * 2. Fetches the latest fresh number from backend
 * 3. Builds the formatted WhatsApp checkout URL
 * 4. Opens WhatsApp in a new tab
 * Returns { success: boolean, url?: string, error?: string }
 */
export async function proceedToWhatsAppCheckout(
  cartItems: CartItem[],
  selectedCity?: string
): Promise<{ success: boolean; url?: string; error?: string }> {
  if (!cartItems || cartItems.length === 0) {
    return { success: false, error: "Your cart is empty." };
  }

  try {
    const configuredNumber = await fetchConfiguredWhatsAppNumber({ forceFresh: true });
    const url = generateWhatsAppCheckoutUrl(configuredNumber, cartItems, selectedCity);

    // Open WhatsApp link
    window.open(url, "_blank", "noopener,noreferrer");
    return { success: true, url };
  } catch (err) {
    const message =
      err instanceof Error
        ? err.message
        : "Failed to initiate WhatsApp checkout. Please try again.";
    return { success: false, error: message };
  }
}

