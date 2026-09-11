import Image from "next/image";
import Link from "next/link";

type BrandLogoProps = {
  href?: string;
  className?: string;
  size?: "nav" | "footer" | "lg";
  priority?: boolean;
  /** Show tagline beside the mark (footer). Nav uses the logo artwork alone. */
  showWordmark?: boolean;
};

const sizes = {
  nav: { width: 160, height: 160, className: "h-12 w-12 sm:h-[3.25rem] sm:w-[3.25rem]" },
  footer: { width: 180, height: 180, className: "h-[4.5rem] w-[4.5rem]" },
  lg: { width: 220, height: 220, className: "h-24 w-24" },
} as const;

export function BrandLogo({
  href = "/",
  className = "",
  size = "nav",
  priority = false,
  showWordmark = false,
}: BrandLogoProps) {
  const dims = sizes[size];

  const mark = (
    <span className={`inline-flex items-center gap-3 ${className}`}>
      <Image
        src="/images/brand/logo.jpg"
        alt="MRA Haven Estates"
        width={dims.width}
        height={dims.height}
        priority={priority}
        className={`${dims.className} rounded-sm object-cover shadow-[0_0_0_1px_rgba(196,164,124,0.35)]`}
      />
      {showWordmark ? (
        <span className="flex flex-col leading-tight">
          <span className="font-display text-xl tracking-wide text-white">
            MRA Haven Estates
          </span>
          <span className="mt-1 text-[10px] tracking-[0.28em] text-[color:var(--gold)] uppercase">
            Helping People Move
          </span>
        </span>
      ) : null}
    </span>
  );

  if (!href) return mark;

  return (
    <Link
      href={href}
      aria-label="MRA Haven Estates home"
      className="shrink-0 transition-opacity hover:opacity-90"
    >
      {mark}
    </Link>
  );
}
