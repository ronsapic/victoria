import Link from "next/link";

import { ModuleHeader } from "@/components/module-header";
import {
  btnPrimaryClass,
  cardClass,
  inputClass,
  labelClass,
  tableClass,
  tdClass,
  thClass,
} from "@/components/form-styles";
import { requireAnyRole } from "@/lib/auth/require-role";
import { prisma } from "@/lib/db";
import { adminUpsertProfile } from "@/actions/residents";

export default async function ResidentsPage() {
  await requireAnyRole(["staff"]);

  const users = await prisma.user.findMany({
    orderBy: { createdAt: "desc" },
    include: { residentProfile: { include: { vehicles: true, occupants: true } } },
    take: 200,
  });

  return (
    <div className="mx-auto max-w-6xl space-y-8">
      <ModuleHeader moduleKey="residents" />

      <section className={`${cardClass} overflow-x-auto`}>
        <h3 className="mb-4 text-sm font-semibold text-zinc-900 dark:text-zinc-50">
          Resident directory (profiles)
        </h3>
        <table className={tableClass}>
          <thead>
            <tr>
              <th className={thClass}>User</th>
              <th className={thClass}>Role</th>
              <th className={thClass}>Profile</th>
              <th className={thClass}>Vehicles</th>
              <th className={thClass}>Occupants</th>
              <th className={thClass}>Ops</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id}>
                <td className={tdClass}>
                  <span className="font-medium">{u.email}</span>
                  <span className="block text-xs text-zinc-500">{u.phone ?? "—"}</span>
                </td>
                <td className={tdClass}>{u.role}</td>
                <td className={tdClass}>{u.residentProfile ? "Yes" : "No"}</td>
                <td className={tdClass}>
                  {u.residentProfile?.vehicles.length ?? 0}
                </td>
                <td className={tdClass}>
                  {u.residentProfile?.occupants.length ?? 0}
                </td>
                <td className={tdClass}>
                  <Link href="/me" className="underline text-sm">
                    View as self (demo)
                  </Link>
                </td>
              </tr>
            ))}
            {users.length === 0 && (
              <tr>
                <td className={tdClass} colSpan={6}>
                  No users yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </section>

      <section className={cardClass}>
        <h3 className="mb-4 text-sm font-semibold text-zinc-900 dark:text-zinc-50">
          Update a profile (staff tool)
        </h3>
        <form action={adminUpsertProfile} className="grid gap-3 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label className={labelClass}>User</label>
            <select name="userId" className={inputClass} required>
              {users.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.email}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className={labelClass}>Alternate contact</label>
            <input name="contactAlt" className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>Notes</label>
            <input name="notes" className={inputClass} />
          </div>
          <button type="submit" className={`${btnPrimaryClass} sm:col-span-2`}>
            Save profile
          </button>
        </form>
      </section>
    </div>
  );
}

