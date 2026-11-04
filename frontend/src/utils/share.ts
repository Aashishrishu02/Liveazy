export interface ShareProductPayload {
  id: string;
  name: string;
  price?: number | string | null;
  image?: string | null;
}

export async function shareProduct(
  product: ShareProductPayload
): Promise<{ success: boolean; method: "native" | "whatsapp" | "clipboard"; message: string }> {
  const shareUrl = `${window.location.origin}/products/${product.id}`;
  const shareText = `Check out ${product.name} on LIVEAZY Furniture Rental: ${shareUrl}`;

  // 1. Try native navigator.share if supported on mobile/supported desktop
  if (navigator.share) {
    try {
      await navigator.share({
        title: `${product.name} | LIVEAZY`,
        text: `Rent ${product.name} on LIVEAZY`,
        url: shareUrl,
      });
      return { success: true, method: "native", message: "Shared successfully!" };
    } catch (err: unknown) {
      // If user cancelled, don't fall back to clipboard
      if (err instanceof Error && err.name === "AbortError") {
        return { success: false, method: "native", message: "Share cancelled" };
      }
      // Otherwise fall through to clipboard
    }
  }

  // 2. Fallback to copying URL to clipboard
  try {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      await navigator.clipboard.writeText(shareUrl);
      return { success: true, method: "clipboard", message: "Link copied to clipboard!" };
    }
  } catch {
    // If clipboard fails, try execCommand
    try {
      const textarea = document.createElement("textarea");
      textarea.value = shareUrl;
      textarea.style.position = "fixed";
      textarea.style.opacity = "0";
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      document.body.removeChild(textarea);
      return { success: true, method: "clipboard", message: "Link copied to clipboard!" };
    } catch {
      // Last resort: Open WhatsApp share
      const whatsappUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(shareText)}`;
      window.open(whatsappUrl, "_blank", "noopener,noreferrer");
      return { success: true, method: "whatsapp", message: "Opening WhatsApp to share..." };
    }
  }

  return { success: true, method: "clipboard", message: "Link copied to clipboard!" };
}
