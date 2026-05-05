import { ModuleHeader } from "@/components/module-header";
import {
  btnGhostClass,
  btnPrimaryClass,
  cardClass,
  inputClass,
  labelClass,
  tableClass,
  tdClass,
  thClass,
} from "@/components/form-styles";

import { addUnitMembership, endMembership, setUserRole } from "@/actions/access";
import { requireAnyRole } from "@/lib/auth/require-role";
import { prisma } from "@/lib/db";
import { ROLE_LABELS, USER_ROLES } from "@/lib/rbac";
import { formatDate } from "@/lib/format";

export default async function AccessPage() {
  await requireAnyRole(["admin"]);

  const [users, units, memberships] = await Promise.all([
    prisma.user.findMany({ orderBy: { createdAt: "desc" }, take: 200 }),
    prisma.unit.findMany({ orderBy: { number: "asc" } }),
    prisma.unitMembership.findMany({
      orderBy: { startDate: "desc" },
      include: { unit: true, user: true },
      take: 200,
    }),
  ]);

  return (
    <div className="mx-auto max-w-6xl space-y-8">
      <ModuleHeader moduleKey="access" />

      <section className="grid gap-6 lg:grid-cols-[1fr,360px]">
        <div className={`${cardClass} overflow-x-auto`}>
          <h3 className="mb-4 text-sm font-semibold text-zinc-900 dark:text-zinc-50">
            Users
          </h3>
          <table className={tableClass}>
            <thead>
              <tr>
                <th className={thClass}>Email</th>
                <th className={thClass}>Role</th>
                <th className={thClass}>Created</th>
                <th className={thClass}>Set role</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id}>
                  <td className={tdClass}>
                    <span className="font-medium">{u.email}</span>
                    <span className="block text-xs text-zinc-500">
                      {u.displayName ?? "—"} · {u.firebaseUid}
                    </span>
                  </td>
                  <td className={tdClass}>
                    {ROLE_LABELS[(u.role as keyof typeof ROLE_LABELS) ?? "resident"] ??
                      u.role}
                  </td>
                  <td className={tdClass}>{formatDate(u.createdAt)}</td>
                  <td className={tdClass}>
                    <form action={setUserRole} className="flex gap-2">
                      <input type="hidden" name="userId" value={u.id} />
                      <select name="role" className={inputClass} defaultValue={u.role}>
                        {USER_ROLES.map((r) => (
                          <option key={r} value={r}>
                            {ROLE_LABELS[r]}
                          </option>
                        ))}
                      </select>
                      <button type="submit" className={btnGhostClass}>
                        Apply
                      </button>
                    </form>
                  </td>
                </tr>
              ))}
              {users.length === 0 && (
                <tr>
                  <td className={tdClass} colSpan={4}>
                    No users yet — sign up on `/signup` first.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className={`${cardClass} h-fit`}>
          <h3 className="mb-4 text-sm font-semibold text-zinc-900 dark:text-zinc-50">
            Assign unit membership
          </h3>
          <form action={addUnitMembership} className="space-y-3">
            <div>
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
              <label className={labelClass}>Unit</label>
              <select name="unitId" className={inputClass} required>
                {units.map((unit) => (
                  <option key={unit.id} value={unit.id}>
                    {unit.number}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className={labelClass}>Relationship</label>
              <select name="kind" className={inputClass} defaultValue="OWNER">
                <option value="OWNER">Owner</option>
                <option value="TENANT">Tenant</option>
              </select>
            </div>
            <button type="submit" className={`${btnPrimaryClass} w-full`}>
              Add membership
            </button>
          </form>
        </div>
      </section>

      <section className={`${cardClass} overflow-x-auto`}>
        <h3 className="mb-4 text-sm font-semibold text-zinc-900 dark:text-zinc-50">
          Unit membership register
        </h3>
        <table className={tableClass}>
          <thead>
            <tr>
              <th className={thClass}>Unit</th>
              <th className={thClass}>User</th>
              <th className={thClass}>Kind</th>
              <th className={thClass}>From</th>
              <th className={thClass}>To</th>
              <th className={thClass} />
            </tr>
          </thead>
          <tbody>
            {memberships.map((m) => (
              <tr key={m.id}>
                <td className={tdClass}>{m.unit.number}</td>
                <td className={tdClass}>{m.user.email}</td>
                <td className={tdClass}>{m.kind}</td>
                <td className={tdClass}>{formatDate(m.startDate)}</td>
                <td className={tdClass}>{m.endDate ? formatDate(m.endDate) : "—"}</td>
                <td className={tdClass}>
                  {!m.endDate && (
                    <form action={endMembership}>
                      <input type="hidden" name="membershipId" value={m.id} />
                      <button type="submit" className={btnGhostClass}>
                        End
                      </button>
                    </form>
                  )}
                </td>
              </tr>
            ))}
            {memberships.length === 0 && (
              <tr>
                <td className={tdClass} colSpan={6}>
                  No memberships yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </section>
    </div>
  );
}

