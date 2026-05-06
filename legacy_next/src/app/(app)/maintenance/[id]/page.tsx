import Link from "next/link";
import { notFound } from "next/navigation";
import {
  deleteMaintenanceTicket,
  updateMaintenanceTicket,
} from "@/actions/maintenance";
import { ModuleHeader } from "@/components/module-header";
import {
  btnGhostClass,
  btnPrimaryClass,
  cardClass,
  inputClass,
  labelClass,
} from "@/components/form-styles";
import { prisma } from "@/lib/db";

type Props = { params: Promise<{ id: string }> };

export default async function MaintenanceDetailPage({ params }: Props) {
  const { id } = await params;
  const ticket = await prisma.maintenanceTicket.findUnique({
    where: { id },
    include: { unit: true },
  });
  if (!ticket) notFound();

  return (
    <div className="mx-auto max-w-6xl space-y-8">
      <ModuleHeader moduleKey="maintenance" />
      <p>
        <Link href="/maintenance" className="text-sm underline text-zinc-600">
          ← Tickets
        </Link>
      </p>

      <div className="grid gap-6 lg:grid-cols-[1fr,360px]">
        <article className={cardClass}>
          <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
            {ticket.title}
          </h3>
          <p className="mt-1 text-xs text-zinc-500">
            Area: {ticket.unit ? ticket.unit.number : "Estate"}
          </p>
          <p className="mt-4 whitespace-pre-wrap text-sm text-zinc-700 dark:text-zinc-300">
            {ticket.description}
          </p>
        </article>

        <div className={`${cardClass} space-y-6`}>
          <form action={updateMaintenanceTicket} className="space-y-3">
            <input type="hidden" name="id" value={ticket.id} />
            <div>
              <label className={labelClass}>Status</label>
              <select
                name="status"
                className={inputClass}
                defaultValue={ticket.status}
              >
                <option value="OPEN">OPEN</option>
                <option value="IN_PROGRESS">IN_PROGRESS</option>
                <option value="DONE">DONE</option>
              </select>
            </div>
            <div>
              <label className={labelClass}>Contractor</label>
              <input
                name="contractor"
                defaultValue={ticket.contractor ?? ""}
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>Cost estimate (TZS)</label>
              <input
                name="costEstimate"
                type="number"
                step="any"
                defaultValue={ticket.costEstimate ?? ""}
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>Actual cost (TZS)</label>
              <input
                name="costActual"
                type="number"
                step="any"
                defaultValue={ticket.costActual ?? ""}
                className={inputClass}
              />
            </div>
            <label className="flex items-center gap-2 text-sm text-zinc-700 dark:text-zinc-300">
              <input
                type="checkbox"
                name="markComplete"
                defaultChecked={
                  ticket.completedAt != null ||
                  ticket.status === "DONE"
                }
              />
              Mark completed today
            </label>
            <button type="submit" className={`${btnPrimaryClass} w-full`}>
              Save work order
            </button>
          </form>
          <form action={deleteMaintenanceTicket}>
            <input type="hidden" name="id" value={ticket.id} />
            <button type="submit" className={`${btnGhostClass} w-full text-red-600`}>
              Delete ticket
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
