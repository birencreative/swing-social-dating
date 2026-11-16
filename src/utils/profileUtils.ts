// utils/profileUtils.ts

export const getAge = (dob?: string): number | null => {
    if (!dob) return null;
    const birthDate = new Date(dob);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();

    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
        age--;
    }

    return age;
};

export const getOptimizedImageUrl = (url?: string, width = 600): string => {
  if (!url || typeof url !== "string" || url.trim() === "") return "/noavatar.png";
  const trimmed = url.trim();

  if (trimmed.startsWith("/") || trimmed.startsWith("data:")) {
    return trimmed;
  }

  if (trimmed.includes("res.cloudinary.com") && trimmed.includes("/image/upload/")) {
    if (!trimmed.includes("f_auto")) {
      return trimmed.replace("/image/upload/", `/image/upload/f_auto,q_auto:good,w_${width},c_scale/`);
    }
  }

  return trimmed;
};

export const getPreloadImages = (
    profile: any,
    canAccessPrivate: boolean
): string[] => {
    const urls: string[] = [];

    if (profile?.Avatar) urls.push(getOptimizedImageUrl(profile.Avatar));

    // Public images
    for (let i = 1; i <= 6; i++) {
        const img = profile[`imgpub${i}`];
        if (img) urls.push(getOptimizedImageUrl(img));
    }

    // Private images (only if premium)
    if (canAccessPrivate) {
        for (let i = 1; i <= 6; i++) {
            const img = profile[`imgpriv${i}`];
            if (img) urls.push(getOptimizedImageUrl(img));
        }
    }

    return urls;
};

/**
 * Returns the ordered photo URLs for a profile (Avatar + public images).
 * Matches the same logic used in SwipeProfileCard's `photos` memo.
 */
export const getProfilePhotos = (profile: any): string[] => {
    const urls: string[] = [];
    if (profile?.Avatar) urls.push(getOptimizedImageUrl(profile.Avatar));
    for (let i = 1; i <= 6; i++) {
        const key = `imgpub${i}`;
        const url = profile?.[key];
        if (url && typeof url === 'string' && url.trim() !== '') {
            urls.push(getOptimizedImageUrl(url));
        }
    }
    return urls;
};