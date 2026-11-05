/**
 * LIVEAZY Customer Mobile OTP Authentication Service
 * 
 * Centralized service layer for customer authentication via Mobile Number + OTP.
 * Keeps API base URL centralized and follows secure session management.
 * 
 * API CONTRACT DOCUMENTATION FOR API TEAM:
 * --------------------------------------------------------------------------
 * 1. SEND OTP ENDPOINT:
 *    POST ${VITE_API_URL}/auth/send-otp
 *    Request Body (JSON):
 *    {
 *      "mobile": "9876543210",       // Required: 10-digit Indian mobile number
 *      "countryCode": "+91"          // Optional: Defaults to "+91"
 *    }
 *    Expected Success Response (HTTP 200 / 201):
 *    {
 *      "success": true,
 *      "message": "OTP sent successfully to +91 98765 43210",
 *      "requestId": "optional-request-or-session-id",
 *      "retryAfterSeconds": 30
 *    }
 *    Expected Error Response (HTTP 400 / 429 / 500):
 *    {
 *      "success": false,
 *      "message": "Invalid mobile number or rate limit exceeded."
 *    }
 * 
 * 2. VERIFY OTP ENDPOINT:
 *    POST ${VITE_API_URL}/auth/verify-otp
 *    Request Body (JSON):
 *    {
 *      "mobile": "9876543210",       // Required: 10-digit Indian mobile number
 *      "otp": "123456",              // Required: 6-digit numeric OTP code
 *      "requestId": "optional-id"    // Optional: session/request tracking
 *    }
 *    Expected Success Response (HTTP 200 / 201):
 *    {
 *      "success": true,
 *      "message": "Authentication successful",
 *      "access_token": "jwt-token-string-here",
 *      "user": {
 *        "id": "user-uuid-or-id",
 *        "mobile": "9876543210",
 *        "name": "Customer Name or null",
 *        "email": "customer@example.com or null"
 *      }
 *    }
 *    Expected Error Response (HTTP 400 / 401 / 404):
 *    {
 *      "success": false,
 *      "message": "Invalid or expired OTP. Please try again."
 *    }
 * --------------------------------------------------------------------------
 */

import { getApiBaseUrl } from "./api";

export interface SendOtpRequest {
  mobile: string;
  countryCode?: string;
}

export interface SendOtpResponse {
  success: boolean;
  message: string;
  requestId?: string;
  retryAfterSeconds?: number;
  isEndpointPending?: boolean;
}

export interface VerifyOtpRequest {
  mobile: string;
  otp: string;
  requestId?: string;
}

export interface CustomerUser {
  id?: string | number;
  mobile: string;
  name?: string;
  email?: string;
  createdAt?: string;
}

export interface VerifyOtpResponse {
  success: boolean;
  message: string;
  access_token?: string;
  user?: CustomerUser;
  isEndpointPending?: boolean;
}

const CUSTOMER_TOKEN_KEY = "liveazy_customer_token";
const CUSTOMER_USER_KEY = "liveazy_customer_user";

/**
 * Validates whether the given string is a valid 10-digit Indian mobile number.
 */
export function isValidIndianMobile(mobile: string): boolean {
  const digits = mobile.replace(/\D/g, "");
  // Standard Indian 10-digit mobile begins with 6, 7, 8, or 9
  return /^[6-9]\d{9}$/.test(digits);
}

/**
 * Formats 10 digits as "+91 XXXXX XXXXX" for clean display
 */
export function formatDisplayMobile(mobile: string): string {
  const digits = mobile.replace(/\D/g, "");
  if (digits.length === 10) {
    return `+91 ${digits.slice(0, 5)} ${digits.slice(5)}`;
  }
  return mobile;
}

/**
 * Send OTP via backend API
 */
export async function requestOtp(mobile: string): Promise<SendOtpResponse> {
  const cleanMobile = mobile.replace(/\D/g, "");
  if (!isValidIndianMobile(cleanMobile)) {
    return {
      success: false,
      message: "Please enter a valid 10-digit Indian mobile number (e.g. 9876543210).",
    };
  }

  const baseUrl = getApiBaseUrl();
  const endpoint = `${baseUrl}/auth/send-otp`;

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 12000);

    const res = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        mobile: cleanMobile,
        countryCode: "+91",
      }),
      signal: controller.signal,
    });

    clearTimeout(timeout);

    // If backend returns 404 or 501, the API provider has not deployed the endpoint yet
    if (res.status === 404 || res.status === 501) {
      return {
        success: false,
        message: "The OTP service endpoint (/auth/send-otp) is currently being configured by the API team. Backend endpoint will be activated upon SMS provider provisioning.",
        isEndpointPending: true,
      };
    }

    const data = await res.json().catch(() => null);

    if (!res.ok) {
      return {
        success: false,
        message: data?.message || `Failed to send OTP (HTTP ${res.status}). Please try again.`,
      };
    }

    return {
      success: true,
      message: data?.message || `OTP sent successfully to +91 ${cleanMobile}`,
      requestId: data?.requestId,
      retryAfterSeconds: data?.retryAfterSeconds || 30,
    };
  } catch (err: unknown) {
    const isAbort = (err as { name?: string })?.name === "AbortError";
    return {
      success: false,
      message: isAbort
        ? "Request timed out connecting to authentication server. Please check your connection."
        : "The OTP service endpoint is currently being configured by the API team. Please check back shortly or connect on WhatsApp.",
      isEndpointPending: true,
    };
  }
}

/**
 * Verify OTP via backend API
 */
export async function verifyOtpCode(
  mobile: string,
  otp: string,
  requestId?: string
): Promise<VerifyOtpResponse> {
  const cleanMobile = mobile.replace(/\D/g, "");
  const cleanOtp = otp.replace(/\D/g, "");

  if (cleanOtp.length !== 6) {
    return {
      success: false,
      message: "Please enter the complete 6-digit OTP code.",
    };
  }

  const baseUrl = getApiBaseUrl();
  const endpoint = `${baseUrl}/auth/verify-otp`;

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 12000);

    const res = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        mobile: cleanMobile,
        otp: cleanOtp,
        requestId,
      }),
      signal: controller.signal,
    });

    clearTimeout(timeout);

    // If backend returns 404 or 501, the API endpoint is pending from the API team
    if (res.status === 404 || res.status === 501) {
      return {
        success: false,
        message: "The OTP verification endpoint (/auth/verify-otp) is currently being configured by the API team.",
        isEndpointPending: true,
      };
    }

    const data = await res.json().catch(() => null);

    if (!res.ok) {
      return {
        success: false,
        message: data?.message || "Invalid or expired OTP. Please verify and try again.",
      };
    }

    const token = data?.access_token || data?.token;
    const user = data?.user || { mobile: cleanMobile };

    if (token) {
      saveCustomerSession(token, user);
    }

    return {
      success: true,
      message: data?.message || "Verification successful!",
      access_token: token,
      user,
    };
  } catch (err: unknown) {
    const isAbort = (err as { name?: string })?.name === "AbortError";
    return {
      success: false,
      message: isAbort
        ? "Verification request timed out. Please try again."
        : "The OTP verification endpoint is currently being configured by the API team.",
      isEndpointPending: true,
    };
  }
}

/**
 * Session storage helpers for Customer Authentication
 */
export function saveCustomerSession(token: string, user: CustomerUser): void {
  try {
    localStorage.setItem(CUSTOMER_TOKEN_KEY, token);
    localStorage.setItem(CUSTOMER_USER_KEY, JSON.stringify(user));
  } catch (e) {
    console.warn("Unable to save customer session to localStorage:", e);
  }
}

export function getCustomerSession(): { token: string | null; user: CustomerUser | null } {
  try {
    const token = localStorage.getItem(CUSTOMER_TOKEN_KEY);
    const userStr = localStorage.getItem(CUSTOMER_USER_KEY);
    const user = userStr ? (JSON.parse(userStr) as CustomerUser) : null;
    return { token, user };
  } catch {
    return { token: null, user: null };
  }
}

export function clearCustomerSession(): void {
  try {
    localStorage.removeItem(CUSTOMER_TOKEN_KEY);
    localStorage.removeItem(CUSTOMER_USER_KEY);
  } catch (e) {
    console.warn("Unable to clear customer session from localStorage:", e);
  }
}

