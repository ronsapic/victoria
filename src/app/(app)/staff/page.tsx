import { createStaff } from "@/actions/staff";
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
import { prisma } from "@/lib/db";

export default async function StaffPage() {
  const staff = await prisma.staffMember.findMany({
    orderBy: [{ role: "asc" }, { name: "asc" }],
  });

  return (
    <div className="mx-auto max-w-6xl space-y-8">
      <ModuleHeader moduleKey="staff" />

      <div className="grid gap-6 lg:grid-cols-[340px,1fr]">
        <div className={`${cardClass} h-fit`}>
          <h3 className="mb-4 text-sm font-semibold text-zinc-900 dark:text-zinc-50">
            Hire / register staff
          </h3>
          <form action={createStaff} className="space-y-3">
            <div>
              <label className={labelClass}>Name</label>
              <input name="name" required className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Role</label>
              <select name="role" className={inputClass} required>
                <option value="caretaker">caretaker</option>
                <option value="security">security</option>
                <option value="administration">administration</option>
              </select>
            </div>
            <div>
              <label className={labelClass}>Phone</label>
              <input name="phone" className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Email</label>
              <input name="email" type="email" className={inputClass} />
            </div>
            <button type="submit" className={`${btnPrimaryClass} w-full`}>
              Add to directory
            </button>
          </form>
        </div>

        <div className={`${cardClass} overflow-x-auto`}>
          <h3 className="mb-4 text-sm font-semibold text-zinc-900 dark:text-zinc-50">
            Directory
          </h3>
          <table className={tableClass}>
            <thead>
              <tr>
                <th className={thClass}>Team member</th>
                <th className={thClass}>Role</th>
                <th className={thClass}>Reach</th>
                <th className={thClass}>Status</th>
              </tr>
            </thead>
            <tbody>
              {staff.map((s) => (
                <tr key={s.id}>
                  <td className={tdClass}>{s.name}</td>
                  <td className={tdClass}>{s.role}</td>
                  <td className={`${tdClass} text-sm`}>
                    {s.phone || s.email || "—"}
                  </td>
                  <td className={tdClass}>{s.active ? "Active" : "Archived"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
