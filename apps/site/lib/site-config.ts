export const BRAND_NAME = "Lumia.PM";

// The actual product app (apps/web) lives at a separate domain/deployment.
// Set NEXT_PUBLIC_APP_URL once it's deployed; this placeholder keeps the
// site buildable and the CTAs wired to the right paths in the meantime.
export const APP_URL =
  process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") ?? "https://app.lumia.pm";

export const SIGN_UP_URL = `${APP_URL}/auth/sign-up`;
export const SIGN_IN_URL = `${APP_URL}/auth/sign-in`;

export const SUPPORT_EMAIL = "destek@lumia.pm";

export const SITE_URL = "https://lumia.pm";
