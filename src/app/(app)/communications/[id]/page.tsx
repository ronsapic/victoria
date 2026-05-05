import Link from "next/link";
import { notFound } from "next/navigation";

import { ModuleHeader } from "@/components/module-header";
import { btnPrimaryClass, cardClass, inputClass, labelClass } from "@/components/form-styles";
import { addComplaintComment, updateComplaintStatus } from "@/actions/complaints";
import { getSessionUser } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { formatDateTime } from "@/lib/format";

type Props = { params: Promise<{ id: string }> };

export default async function ComplaintDetailPage({ params }: Props) {
  const sessionUser = await getSessionUser();
  if (!sessionUser) return null;

  const { id } = await params;
  const complaint = await prisma.complaint.findUnique({
    where: { id },
    include: {
      unit: true,
      createdBy: true,
      comments: { orderBy: { createdAt: "asc" } },
    },
  });
  if (!complaint) notFound();

  // Residents can only open their own complaints for now.
  if (sessionUser.role === "resident" && complaint.createdById !== sessionUser.id) {
    notFound();
  }

  const isStaff = sessionUser.role === "admin" || sessionUser.role === "staff";

  return (
    <div className="mx-auto max-w-6xl space-y-8">
      <ModuleHeader moduleKey="communications" />
      <p className="text-sm text-zinc-600 dark:text-zinc-400">
        <Link href="/communications" className="underline">
          ← Communications
        </Link>
      </p>

      <div className="grid gap-6 lg:grid-cols-[1fr,360px]">
        <div className="space-y-6">
          <article className={cardClass}>
            <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50">
              {complaint.title}
            </h2>
            <p className="mt-1 text-xs text-zinc-500">
              {formatDateTime(complaint.createdAt)} · unit{" "}
              {complaint.unit?.number ?? "—"} · status{" "}
              <strong>{complaint.status}</strong>
            </p>
            <p className="mt-4 whitespace-pre-wrap text-sm text-zinc-700 dark:text-zinc-300">
              {complaint.body}
            </p>
          </article>

          <section className={cardClass}>
            <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
              Thread
            </h3>
            <ul className="mt-4 space-y-4">
              {complaint.comments.map((c) => (
                <li
                  key={c.id}
                  className="rounded-lg border border-zinc-100 bg-zinc-50 px-3 py-2 text-sm dark:border-zinc-800 dark:bg-zinc-950"
                >
                  <div className="flex justify-between text-xs text-zinc-500">
                    <span>{c.authorRole}</span>
                    <span>{formatDateTime(c.createdAt)}</span>
                  </div>
                  <p className="mt-1 text-zinc-800 dark:text-zinc-200">{c.body}</p>
                </li>
              ))}
              {complaint.comments.length === 0 && (
                <li className="text-sm text-zinc-500">No replies yet.</li>
              )}
            </ul>

            <form action={addComplaintComment} className="mt-6 space-y-3 border-t border-zinc-100 pt-4 dark:border-zinc-800">
              <input type="hidden" name="complaintId" value={complaint.id} />
              <div>
                <label className={labelClass}>Message</label>
                <textarea name="body" rows={3} required className={`${inputClass} min-h-[80px]`} />
              </div>
              <button type="submit" className={btnPrimaryClass}>
                Post
              </button>
            </form>
          </section>
        </div>

        {isStaff && (
          <aside className={cardClass}>
            <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
              Triage
            </h3>
            <form action={updateComplaintStatus} className="mt-4 space-y-3">
              <input type="hidden" name="id" value={complaint.id} />
              <div>
                <label className={labelClass}>Status</label>
                <select name="status" className={inputClass} defaultValue={complaint.status}>
                  <option value="OPEN">OPEN</option>
                  <option value="IN_PROGRESS">IN_PROGRESS</option>
                  <option value="RESOLVED">RESOLVED</option>
                  <option value="CLOSED">CLOSED</option>
                </select>
              </div>
              <button type="submit" className={`${btnPrimaryClass} w-full`}>
                Save
              </button>
            </form>
          </aside>
        )}
      </div>
    </div>
  );
}

