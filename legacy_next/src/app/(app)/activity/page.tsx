import { ModuleHeader } from "@/components/module-header";
import {
  cardClass,
  tableClass,
  tdClass,
  thClass,
} from "@/components/form-styles";
import { formatDateTime } from "@/lib/format";
import { prisma } from "@/lib/db";

export default async function ActivityPage() {
  const rows = await prisma.activityLog.findMany({
    orderBy: { createdAt: "desc" },
    take: 120,
  });

  return (
    <div className="mx-auto max-w-6xl space-y-8">
      <ModuleHeader moduleKey="activity" />

      <div className={`${cardClass} overflow-x-auto`}>
        <table className={tableClass}>
          <thead>
            <tr>
              <th className={thClass}>Timestamp</th>
              <th className={thClass}>Action</th>
              <th className={thClass}>Subject</th>
              <th className={thClass}>Entity id</th>
              <th className={thClass}>Payload</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id}>
                <td className={tdClass}>{formatDateTime(row.createdAt)}</td>
                <td className={tdClass}>{row.action}</td>
                <td className={tdClass}>{row.entity}</td>
                <td className={`${tdClass} font-mono text-xs`}>{row.entityId ?? "—"}</td>
                <td className={`${tdClass} max-w-xs truncate font-mono text-xs text-zinc-500`}>
                  {row.metadata
                    ? JSON.stringify(row.metadata)
                    : "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {rows.length === 0 && (
          <p className="py-16 text-center text-sm text-zinc-500">
            No audited events captured yet — actions above feed this ledger.
          </p>
        )}
      </div>
    </div>
  );
}
