import Image from "next/image";
import Link from "next/link";

export function BrandLogo({
  size = 32,
  href = "/",
  label = "Victoria Place",
}: {
  size?: number;
  href?: string;
  label?: string;
}) {
  return (
    <Link href={href} className="flex items-center gap-3">
      <Image
        src="/logo.png"
        alt="Victoria Place logo"
        width={size}
        height={size}
        className="rounded-md bg-white object-contain"
        priority
      />
      <div className="min-w-0">
        <span className="block text-sm font-semibold text-zinc-900 dark:text-zinc-50">
          {label}
        </span>
        <span className="block text-xs text-zinc-500">Association portal</span>
      </div>
    </Link>
  );
}

