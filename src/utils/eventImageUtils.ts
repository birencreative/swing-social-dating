import { getOptimizedImageUrl } from "@/utils/profileUtils";

export function isValidEventFlyer(url: string | null | undefined): boolean {
  if (!url || typeof url !== "string") return false;
  const cleanUrl = url.trim().toLowerCase();
  if (!cleanUrl || cleanUrl === "null" || cleanUrl === "undefined") return false;

  if (
    !cleanUrl.startsWith("http://") &&
    !cleanUrl.startsWith("https://") &&
    !cleanUrl.startsWith("data:") &&
    !cleanUrl.startsWith("/")
  ) {
    return false;
  }

  // Filter out dummy/logo/icon assets, sample placeholders, and 1x1 blank pixels
  if (
    cleanUrl.includes("logo") ||
    cleanUrl.includes("noavatar") ||
    cleanUrl.includes("bannerdefault") ||
    cleanUrl.includes("photocamera") ||
    cleanUrl.includes("resort_event_sample") ||
    cleanUrl.includes("fallback") ||
    cleanUrl.includes("removebg-preview") ||
    cleanUrl.includes("verified-badge") ||
    cleanUrl.endsWith(".svg") ||
    cleanUrl.includes("cud5lj13shr03vxzpniy") ||
    cleanUrl.includes("q4r2hwywto9bowy0sl5g") ||
    cleanUrl.includes("mmj2evexatmyny3yz36l")
  ) {
    return false;
  }

  return true;
}

export function filterValidVenuePics(pics?: string[] | null): string[] {
  if (!Array.isArray(pics)) return [];
  return pics
    .filter((url) => isValidEventFlyer(url))
    .map((url) => getOptimizedImageUrl(url, 600));
}
