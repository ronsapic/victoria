import Link from "next/link";

import {
  MODULES,
  modulesByGroup,
  type ModuleKey,
} from "@/lib/modules";
import type { UserRole } from "@/lib/rbac";
import { BrandLogo } from "@/components/brand/logo";

function filterNavKeys(keys: ModuleKey[], role: UserRole): ModuleKey[] {
  if (role === "admin") return keys;
  return keys.filter((key) => MODULES[key].primaryFor.includes(role));
}

function NavLinks({ keys }: { keys: ModuleKey[] }) {
  return (
    <ul className="flex flex-col gap-0.5">
      {keys.map((key) => {
        const m = MODULES[key];
        return (
          <li key={key}>
            <Link
              href={m.path}
              className="block rounded-md px-2 py-1.5 text-sm text-zinc-700 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800"
            >
              {m.title}
            </Link>
          </li>
        );
      })}
    </ul>
  );
}

export function AppSidebar({ userRole }: { userRole: UserRole }) {
  const grouped = modulesByGroup();
  const groupOrder = [
    "Overview",
    "Estate",
    "Finance",
    "Operations",
    "Community",
    "Governance",
    "Administration",
  ];

  const blocks = groupOrder
    .filter((g) => grouped.has(g))
    .map((g) => ({
      group: g,
      keys: filterNavKeys(grouped.get(g)!, userRole),
    }))
    .filter((b) => b.keys.length > 0);

  return (
    <>
      <details className="group border-b border-zinc-200 bg-white px-4 py-3 dark:border-zinc-800 dark:bg-zinc-950 lg:hidden">
        <summary className="cursor-pointer list-none text-sm font-medium text-zinc-900 dark:text-zinc-100">
          <span className="group-open:hidden">Menu</span>
          <span className="hidden group-open:inline">Close menu</span>
        </summary>
        <div className="mt-3 max-h-[60vh] space-y-4 overflow-y-auto pb-2">
          {blocks.map(({ group, keys }) => (
            <div key={group}>
              <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-zinc-500">
                {group}
              </p>
              <NavLinks keys={keys} />
            </div>
          ))}
        </div>
      </details>

      <aside className="hidden w-64 shrink-0 flex-col border-r border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950 lg:flex">
        <div className="border-b border-zinc-200 px-4 py-4 dark:border-zinc-800">
          <BrandLogo />
        </div>
        <nav className="flex-1 space-y-5 overflow-y-auto px-3 py-4">
          {blocks.map(({ group, keys }) => (
            <div key={group}>
              <p className="mb-2 px-2 text-xs font-semibold uppercase tracking-wide text-zinc-500">
                {group}
              </p>
              <NavLinks keys={keys} />
            </div>
          ))}
        </nav>
      </aside>
    </>
  );
}
