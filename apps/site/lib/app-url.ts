// The actual Lumia.PM app is self-hosted by its operator; there is no fixed
// production URL baked into this repo. Set NEXT_PUBLIC_APP_URL once a real
// deployment exists (e.g. https://app.lumiapm.com). Until then, every
// call-to-action that would otherwise need that URL falls back to the
// pricing page instead of guessing a domain — sending a prospect to an
// unrelated, unowned URL is worse than a slightly less specific CTA.
const configuredAppUrl = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "");

export const APP_URL_CONFIGURED = Boolean(configuredAppUrl);

export function appUrl(path = ""): string {
  if (!configuredAppUrl) {
    return "/pricing";
  }
  return `${configuredAppUrl}${path}`;
}
