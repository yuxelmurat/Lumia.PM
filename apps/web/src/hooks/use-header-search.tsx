import { Search } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { Input } from "@/components/ui/input";

/**
 * The single search affordance shared by all four task views: hidden by
 * default, opened with Cmd/Ctrl+F, animates in as a small input rendered in
 * the project header (`ProjectLayout`'s `headerActions` slot). Closes itself
 * on blur or Escape once the query is empty again.
 */
export function useHeaderSearch(placeholder: string) {
  const [query, setQuery] = useState("");
  const [isMounted, setIsMounted] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const [inputEl, setInputEl] = useState<HTMLInputElement | null>(null);

  const open = useCallback(() => {
    setIsMounted(true);
    window.requestAnimationFrame(() => setIsVisible(true));
  }, []);

  const close = useCallback(() => {
    setIsVisible(false);
    window.setTimeout(() => setIsMounted(false), 180);
  }, []);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const isFindShortcut =
        (event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "f";

      if (!isFindShortcut) return;

      event.preventDefault();
      open();
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open]);

  useEffect(() => {
    if (!isMounted) return;
    window.requestAnimationFrame(() => inputEl?.focus());
  }, [isMounted, inputEl]);

  const searchNode = isMounted ? (
    <div
      className={`relative w-[240px] origin-top transition-[translate,scale,opacity] duration-180 ease-out ${
        isVisible
          ? "translate-y-0 scale-y-100 opacity-100"
          : "pointer-events-none -translate-y-1 scale-y-95 opacity-0"
      }`}
    >
      <Search className="-translate-y-1/2 pointer-events-none absolute top-1/2 left-2.5 h-3.5 w-3.5 text-muted-foreground" />
      <Input
        ref={setInputEl}
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === "Escape" && !query.trim()) {
            close();
          }
        }}
        onBlur={() => {
          if (!query.trim()) {
            close();
          }
        }}
        placeholder={placeholder}
        className="h-7.5 [&_[data-slot=input]]:h-7 [&_[data-slot=input]]:leading-7 [&_[data-slot=input]]:pl-8 [&_[data-slot=input]]:text-xs [&_[data-slot=input]]:placeholder:text-xs [&_[data-slot=input]]:placeholder:leading-7"
      />
    </div>
  ) : null;

  return { query, searchNode, openSearch: open, closeSearch: close };
}
