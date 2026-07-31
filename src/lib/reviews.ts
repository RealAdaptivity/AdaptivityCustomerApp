/** Swap for your live Google Business “Write a review” URL when ready. */
export const GOOGLE_REVIEW_URL =
  (typeof process !== 'undefined' &&
    process.env.EXPO_PUBLIC_GOOGLE_REVIEW_URL?.trim()) ||
  'https://g.page/r/CaIynDu9Qo0SEBM/review';
