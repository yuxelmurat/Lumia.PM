import { Link } from "@tanstack/react-router";
import { useState } from "react";
import useProjectStore from "@/store/project";

type LogoProps = {
  className?: string;
};

// Falls back to a text wordmark until real brand SVGs are dropped into
// apps/web/public/logo/ (see the README there) — keeps the auth/nav chrome
// from showing a broken-image icon in the meantime.
export function Logo({ className = "" }: LogoProps) {
  const { setProject } = useProjectStore();
  const [imagesFailed, setImagesFailed] = useState(false);

  return (
    <Link
      onClick={() => {
        setProject(undefined);
      }}
      to="/dashboard"
      className={`w-auto ${className}`}
    >
      {imagesFailed ? (
        <span className="text-lg font-semibold tracking-tight text-foreground">
          Lumia.PM
        </span>
      ) : (
        <>
          <img
            src="/logo/logo-dark.svg"
            alt="Lumia.PM"
            className="h-6 w-auto dark:hidden"
            onError={() => setImagesFailed(true)}
          />
          <img
            src="/logo/logo-light.svg"
            alt="Lumia.PM"
            className="hidden h-6 w-auto dark:block"
            onError={() => setImagesFailed(true)}
          />
        </>
      )}
    </Link>
  );
}
