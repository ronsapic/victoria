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
import { formatDate } from "@/lib/format";
import { prisma } from "@/lib/db";
import { UploadWidget } from "@/components/files/upload-widget";
import { createDocumentEntry } from "@/actions/documents2";
import { requireAnyRole } from "@/lib/auth/require-role";

type Props = {
  searchParams: Promise<{ q?: string; category?: string; visibility?: string }>;
};

export default async function DocumentsPage({ searchParams }: Props) {
  await requireAnyRole(["auditor"]);

  const sp = await searchParams;
  const q = (sp.q ?? "").trim();
  const category = (sp.category ?? "").trim().toUpperCase();
  const visibility = (sp.visibility ?? "").trim().toUpperCase();

  const rows = await prisma.documentEntry.findMany({
    where: {
      ...(q
        ? {
            OR: [
              { title: { contains: q } },
              { file: { originalName: { contains: q } } },
            ],
          }
        : {}),
      ...(category ? { category } : {}),
      ...(visibility === "PRIVATE" || visibility === "RESIDENTS"
        ? { visibility }
        : {}),
    },
    orderBy: { createdAt: "desc" },
    include: { file: true },
    take: 100,
  });

  return (
    <div className="mx-auto max-w-6xl space-y-8">
      <ModuleHeader moduleKey="documents" />

      <div className="grid gap-6 lg:grid-cols-[340px,1fr]">
        <div className={`${cardClass} h-fit`}>
          <h3 className="mb-4 text-sm font-semibold text-zinc-900 dark:text-zinc-50">
            Upload document
          </h3>
          <UploadWidget onUploaded={() => {}} category="DOCUMENT" visibility="PRIVATE" />
          <form action={createDocumentEntry} className="mt-6 space-y-3 border-t border-zinc-200 pt-4 dark:border-zinc-800">
            <div>
              <label className={labelClass}>Title</label>
              <input name="title" required className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Category</label>
              <select name="category" className={inputClass}>
                <option value="LEGAL">Legal</option>
                <option value="FINANCIAL">Financial</option>
                <option value="MAINTENANCE">Maintenance</option>
                <option value="OTHER">Other</option>
              </select>
            </div>
            <div>
              <label className={labelClass}>Visibility</label>
              <select name="visibility" className={inputClass} defaultValue="PRIVATE">
                <option value="PRIVATE">Private (committee/audit)</option>
                <option value="RESIDENTS">Residents can download</option>
              </select>
            </div>
            <div>
              <label className={labelClass}>File ID</label>
              <input name="fileId" required className={inputClass} placeholder="paste File ID from upload" />
            </div>
            <button type="submit" className={`${btnPrimaryClass} w-full`}>
              Save to register
            </button>
          </form>
          <p className="mt-4 text-xs text-zinc-500">
            In production, swap `storage/` to cloud storage and keep the same DB shape.
          </p>
        </div>

        <div className={`${cardClass} overflow-x-auto`}>
          <h3 className="mb-4 text-sm font-semibold text-zinc-900 dark:text-zinc-50">
            Document register
          </h3>
          <form method="GET" className="mb-4 grid gap-3 sm:grid-cols-3">
            <div>
              <label className={labelClass}>Search</label>
              <input
                name="q"
                defaultValue={q}
                placeholder="title or filename"
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>Category</label>
              <select name="category" defaultValue={category} className={inputClass}>
                <option value="">All</option>
                <option value="LEGAL">Legal</option>
                <option value="FINANCIAL">Financial</option>
                <option value="MAINTENANCE">Maintenance</option>
                <option value="OTHER">Other</option>
              </select>
            </div>
            <div>
              <label className={labelClass}>Visibility</label>
              <select name="visibility" defaultValue={visibility} className={inputClass}>
                <option value="">All</option>
                <option value="PRIVATE">Private</option>
                <option value="RESIDENTS">Residents</option>
              </select>
            </div>
            <button type="submit" className={`${btnPrimaryClass} sm:col-span-3`}>
              Apply filters
            </button>
          </form>
          <table className={tableClass}>
            <thead>
              <tr>
                <th className={thClass}>Captured</th>
                <th className={thClass}>Title</th>
                <th className={thClass}>Category</th>
                <th className={thClass}>Visibility</th>
                <th className={thClass}>Download</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((d) => (
                <tr key={d.id}>
                  <td className={tdClass}>{formatDate(d.createdAt)}</td>
                  <td className={tdClass}>{d.title}</td>
                  <td className={tdClass}>{d.category}</td>
                  <td className={tdClass}>{d.visibility}</td>
                  <td className={tdClass}>
                    <a className="underline" href={`/api/files/${d.fileId}/download`}>
                      {d.file.originalName}
                    </a>
                  </td>
                </tr>
              ))}
              {rows.length === 0 && (
                <tr>
                  <td className={tdClass} colSpan={5}>
                    No matching documents.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
