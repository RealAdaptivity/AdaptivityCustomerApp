/** Swap for your live Google Business “Write a review” URL when ready. */
export const GOOGLE_REVIEW_URL =
  (typeof process !== 'undefined' &&
    process.env.EXPO_PUBLIC_GOOGLE_REVIEW_URL?.trim()) ||
  'https://www.google.com/search?q=Adaptivity+Performance+Justin+TX+reviews';
