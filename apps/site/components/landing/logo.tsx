import { BRAND_NAME } from "@/lib/site-config";

export function Logo() {
  return (
    <span className="inline-flex items-center gap-2">
      <span
        aria-hidden="true"
        className="flex size-6 items-center justify-center rounded-md bg-primary font-heading font-semibold text-primary-foreground text-xs"
      >
        L
      </span>
      <span className="font-heading font-semibold text-base text-foreground tracking-tight">
        {BRAND_NAME}
      </span>
    </span>
  );
}
