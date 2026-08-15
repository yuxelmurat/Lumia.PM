import { Link } from "@tanstack/react-router";
import useProjectStore from "@/store/project";

export function Logo({ className = "" }: { className?: string }) {
  const { setProject } = useProjectStore();

  return (
    <Link
      onClick={() => {
        setProject(undefined);
      }}
      to="/dashboard"
      className={`w-auto ${className}`}
    >
      <img
        src="/logo/logo.png"
        alt="Lumia.PM"
        className="h-6 w-auto dark:hidden"
      />
      <img
        src="/logo/logo-white.png"
        alt="Lumia.PM"
        className="hidden h-6 w-auto dark:block"
      />
    </Link>
  );
}
