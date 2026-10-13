const API_VERCEL = "https://supervisionaps.vercel.app";

export const API_URL = (
  process.env.EXPO_PUBLIC_API_URL?.trim() || API_VERCEL
).replace(/\/$/, "");
