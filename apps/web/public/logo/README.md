# Lumia.PM logo assets

Drop the two brand files here with these exact names:

- `logo-dark.svg` — shown in light mode (should read clearly on a light background)
- `logo-light.svg` — shown in dark mode (should read clearly on a dark background)

`apps/web/src/components/common/logo.tsx` already points at `/logo/logo-dark.svg`
and `/logo/logo-light.svg`. Once both files land here, no code changes are
needed — they'll be picked up automatically (Vite serves everything under
`apps/web/public/` from the site root).

Until real files are added, the app falls back to a plain text "Lumia.PM"
wordmark so nothing breaks in the meantime.
