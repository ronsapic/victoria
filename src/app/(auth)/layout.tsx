export const dynamic = "force-dynamic";

export default function AuthLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-zinc-50 px-4 py-16 dark:bg-zinc-950">
      <div className="mb-8 flex items-center gap-3">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/logo.png"
          alt="Victoria Place logo"
          width={44}
          height={44}
          className="h-11 w-11 rounded-md bg-white object-contain"
        />
        <div>
          <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
            Victoria Place
          </p>
          <p className="text-xs text-zinc-500">Association portal</p>
        </div>
      </div>
      {children}
    </div>
  );
}
