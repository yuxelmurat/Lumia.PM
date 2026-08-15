import Image from "next/image";

export function Logo() {
  return (
    <span className="inline-flex items-center">
      <Image
        src="/logo-nav.png"
        alt="Lumia.PM"
        className="h-6 w-auto dark:hidden"
        width={181}
        height={60}
      />
      <Image
        src="/logo-nav-white.png"
        alt="Lumia.PM"
        className="hidden h-6 w-auto dark:block"
        width={181}
        height={60}
      />
    </span>
  );
}
