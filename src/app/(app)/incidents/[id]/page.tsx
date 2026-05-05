import Link from "next/link";
import { notFound } from "next/navigation";
import {
  addIncidentComment,
  updateIncidentStatus,
} from "@/actions/incidents";
import { attachFileToIncident } from "@/actions/incidents-attachments";
import { ModuleHeader } from "@/components/module-header";
import {
  btnPrimaryClass,
  btnGhostClass,
  cardClass,
  inputClass,
  labelClass,
} from "@/components/form-styles";
import { formatDateTime } from "@/lib/format";
import { prisma } from "@/lib/db";
import { getSessionUser } from "@/lib/auth/session";
import { UploadWidget } from "@/components/files/upload-widget";

type Props = { params: Promise<{ id: string }> };

export default async function IncidentDetailPage({ params }: Props) {
  const { id } = await params;
  const sessionUser = await getSessionUser();
  if (!sessionUser) return null;

  const incident = await prisma.incident.findUnique({
    where: { id },
    include: {
      unit: true,
      comments: { orderBy: { createdAt: "asc" } },
      attachments: { include: { file: true }, orderBy: { createdAt: "desc" } },
    },
  });

  if (!incident) notFound();

  return (
    <div className="mx-auto max-w-6xl space-y-8">
      <ModuleHeader moduleKey="incidents" />
      <p>
        <Link href="/incidents" className="text-sm underline text-zinc-600">
          ← Incidents list
        </Link>
      </p>

      <div className="grid gap-6 lg:grid-cols-[1fr,320px]">
        <div className="space-y-6">
          <article className={cardClass}>
            <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
              {incident.title}
            </h3>
            <p className="mt-2 text-xs text-zinc-500">
              {formatDateTime(incident.createdAt)} · {incident.category} · Unit{" "}
              {incident.unit ? incident.unit.number : "common areas"}
            </p>
            <p className="mt-4 whitespace-pre-wrap text-sm leading-relaxed text-zinc-700 dark:text-zinc-300">
              {incident.description}
            </p>
          </article>

          <section className={cardClass}>
            <h4 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
              Conversation
            </h4>
            <ul className="mt-4 space-y-4">
              {incident.comments.map((c) => (
                <li
                  key={c.id}
                  className="rounded-lg border border-zinc-100 bg-zinc-50 px-3 py-2 text-sm dark:border-zinc-800 dark:bg-zinc-950"
                >
                  <div className="flex justify-between text-xs text-zinc-500">
                    <span>{c.authorRole}</span>
                    <span>{formatDateTime(c.createdAt)}</span>
                  </div>
                  <p className="mt-1 text-zinc-800 dark:text-zinc-200">
                    {c.body}
                  </p>
                </li>
              ))}
              {incident.comments.length === 0 && (
                <li className="text-sm text-zinc-500">No replies yet.</li>
              )}
            </ul>
            <form action={addIncidentComment} className="mt-6 space-y-3 border-t border-zinc-100 pt-4 dark:border-zinc-800">
              <input type="hidden" name="incidentId" value={incident.id} />
              <div>
                <label className={labelClass}>Reply as</label>
                <select name="authorRole" className={inputClass}>
                  <option value="resident">resident</option>
                  <option value="admin">admin</option>
                  <option value="staff">staff</option>
                </select>
              </div>
              <div>
                <label className={labelClass}>Comment</label>
                <textarea
                  name="body"
                  rows={3}
                  required
                  className={`${inputClass} min-h-[80px]`}
                />
              </div>
              <button type="submit" className={btnPrimaryClass}>
                Post comment
              </button>
            </form>
          </section>

          <section className={cardClass}>
            <h4 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
              Attachments
            </h4>
            <p className="mt-1 text-xs text-zinc-500">
              Upload uses local `storage/` in dev. Replace with cloud storage later.
            </p>

            <div className="mt-4 grid gap-2">
              {incident.attachments.map((a) => {
                const isImage = a.file.mimeType.startsWith("image/");
                return (
                  <div
                    key={a.id}
                    className="rounded-md border border-zinc-200 bg-white p-3 dark:border-zinc-800 dark:bg-zinc-950"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <span className="truncate text-sm">{a.file.originalName}</span>
                      <span className="text-xs text-zinc-500">
                        {Math.round(a.file.sizeBytes / 1024)} KB
                      </span>
                    </div>
                    {isImage && (
                      <a
                        href={`/api/files/${a.fileId}/view`}
                        className="mt-3 block overflow-hidden rounded-md border border-zinc-100 dark:border-zinc-800"
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={`/api/files/${a.fileId}/view`}
                          alt={a.file.originalName}
                          className="max-h-64 w-full object-contain bg-zinc-50 dark:bg-black"
                        />
                      </a>
                    )}
                    <div className="mt-3 flex flex-wrap gap-2 text-sm">
                      <a className="underline" href={`/api/files/${a.fileId}/download`}>
                        Download
                      </a>
                      <a className="underline" href={`/api/files/${a.fileId}/view`}>
                        View
                      </a>
                    </div>
                  </div>
                );
              })}
              {incident.attachments.length === 0 && (
                <p className="text-sm text-zinc-500">No attachments yet.</p>
              )}
            </div>

            {sessionUser.role !== "resident" && (
              <IncidentAttachForm incidentId={incident.id} />
            )}
          </section>
        </div>

        <div className={cardClass}>
          <h4 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
            Assignment & workflow
          </h4>
          <form action={updateIncidentStatus} className="mt-4 space-y-3">
            <input type="hidden" name="id" value={incident.id} />
            <div>
              <label className={labelClass}>Status</label>
              <select
                name="status"
                className={inputClass}
                defaultValue={incident.status}
              >
                <option value="OPEN">OPEN</option>
                <option value="IN_PROGRESS">IN_PROGRESS</option>
                <option value="RESOLVED">RESOLVED</option>
              </select>
            </div>
            <div>
              <label className={labelClass}>Assignee</label>
              <input
                name="assignee"
                placeholder="Caretaker name"
                defaultValue={incident.assignee ?? ""}
                className={inputClass}
              />
            </div>
            <button type="submit" className={`${btnPrimaryClass} w-full`}>
              Save
            </button>
          </form>
          <dl className="mt-6 space-y-2 border-t border-zinc-100 pt-4 text-sm dark:border-zinc-800">
            <dt className="font-medium text-zinc-500">Last updated</dt>
            <dd>{formatDateTime(incident.updatedAt)}</dd>
          </dl>
        </div>
      </div>
    </div>
  );
}

function IncidentAttachForm({ incidentId }: { incidentId: string }) {
  return (
    <div className="mt-6 border-t border-zinc-100 pt-4 dark:border-zinc-800">
      <p className="text-sm font-medium text-zinc-900 dark:text-zinc-50">
        Add an image/file
      </p>
      <p className="mt-1 text-xs text-zinc-500">
        Step 1 uploads the file and returns a File ID. Step 2 attaches it.
      </p>

      <div className="mt-4">
        <UploadWidget onUploaded={() => {}} category="INCIDENT" visibility="PRIVATE" />
      </div>

      <form action={attachFileToIncident} className="mt-4 flex flex-wrap gap-2">
        <input type="hidden" name="incidentId" value={incidentId} />
        <input
          name="fileId"
          placeholder="Paste File ID"
          className={`${inputClass} w-56`}
          required
        />
        <button type="submit" className={btnGhostClass}>
          Attach
        </button>
      </form>
    </div>
  );
}
