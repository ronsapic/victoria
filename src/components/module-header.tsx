import type { ModuleKey } from "@/lib/modules";
import { MODULES } from "@/lib/modules";

export function ModuleHeader({ moduleKey }: { moduleKey: ModuleKey }) {
  const m = MODULES[moduleKey];
  return (
    <div className="mb-6 border-b border-zinc-200 pb-4 dark:border-zinc-800">
      <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50">
        {m.title}
      </h2>
      <p className="mt-1 max-w-3xl text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
        {m.description}
      </p>
    </div>
  );
}
