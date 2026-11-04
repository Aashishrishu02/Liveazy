const WISHLIST_STORAGE_KEY = "liveazy_wishlist";
const WISHLIST_EVENT = "liveazy_wishlist_updated";

function cleanId(id: unknown): string {
  return String(id ?? "").trim();
}

export function getWishlist(): string[] {
  try {
    const data = localStorage.getItem(WISHLIST_STORAGE_KEY);
    if (!data) return [];
    const parsed = JSON.parse(data);
    if (!Array.isArray(parsed)) return [];
    return Array.from(new Set(parsed.map(cleanId).filter((id) => id.length > 0)));
  } catch {
    return [];
  }
}

export function isInWishlist(productId: string): boolean {
  const target = cleanId(productId);
  if (!target) return false;
  const list = getWishlist();
  return list.includes(target);
}

export function toggleWishlist(productId: string): boolean {
  const target = cleanId(productId);
  if (!target) return false;
  const list = getWishlist();
  const exists = list.includes(target);
  let updated: string[];

  if (exists) {
    updated = list.filter((id) => id !== target);
  } else {
    updated = [...list, target];
  }

  try {
    localStorage.setItem(WISHLIST_STORAGE_KEY, JSON.stringify(updated));
  } catch (err) {
    console.warn("Could not write wishlist to localStorage:", err);
  }

  window.dispatchEvent(
    new CustomEvent(WISHLIST_EVENT, { detail: { ids: updated, changedId: target, added: !exists } })
  );

  return !exists;
}

export function removeFromWishlist(productId: string): void {
  const target = cleanId(productId);
  if (!target) return;
  const list = getWishlist();
  const updated = list.filter((id) => id !== target);

  try {
    localStorage.setItem(WISHLIST_STORAGE_KEY, JSON.stringify(updated));
  } catch (err) {
    console.warn("Could not write wishlist to localStorage:", err);
  }

  window.dispatchEvent(
    new CustomEvent(WISHLIST_EVENT, { detail: { ids: updated, changedId: target, added: false } })
  );
}

export function clearWishlist(): void {
  try {
    localStorage.removeItem(WISHLIST_STORAGE_KEY);
  } catch (err) {
    console.warn("Could not clear wishlist:", err);
  }

  window.dispatchEvent(
    new CustomEvent(WISHLIST_EVENT, { detail: { ids: [], added: false } })
  );
}

export function getWishlistCount(): number {
  return getWishlist().length;
}

export function subscribeWishlist(callback: (ids: string[]) => void): () => void {
  const handler = () => {
    callback(getWishlist());
  };

  window.addEventListener(WISHLIST_EVENT, handler);
  window.addEventListener("storage", handler);

  return () => {
    window.removeEventListener(WISHLIST_EVENT, handler);
    window.removeEventListener("storage", handler);
  };
}
