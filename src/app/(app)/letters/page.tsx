import { createLetter } from "@/actions/letters";
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

export default async function LettersPage() {
  const letters = await prisma.letter.findMany({ orderBy: { createdAt: "desc" } });

  return (
    <div className="mx-auto max-w-6xl space-y-8">
      <ModuleHeader moduleKey="letters" />

      <div className="grid gap-6 lg:grid-cols-[340px,1fr]">
        <div className={`${cardClass} h-fit`}>
          <h3 className="mb-4 text-sm font-semibold text-zinc-900 dark:text-zinc-50">
            Compose notice
          </h3>
          <form action={createLetter} className="space-y-3">
            <div>
              <label className={labelClass}>Subject</label>
              <input name="title" required className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Body copy</label>
              <textarea
                name="body"
                rows={8}
                required
                className={`${inputClass} min-h-[160px]`}
              />
            </div>
            <div>
              <label className={labelClass}>Distribution</label>
              <select name="scope" className={inputClass} defaultValue="all">
                <option value="all">Global estate post</option>
                <option value="committee">Restricted board pack</option>
              </select>
            </div>
            <button type="submit" className={`${btnPrimaryClass} w-full`}>
              Archive letter draft
            </button>
          </form>
          <p className="mt-4 text-xs text-zinc-500">
            Targeting specific balconies will map to roster filters later.
          </p>
        </div>

        <div className={`${cardClass} overflow-x-auto`}>
          <h3 className="mb-4 text-sm font-semibold text-zinc-900 dark:text-zinc-50">
            Register
          </h3>
          <table className={tableClass}>
            <thead>
              <tr>
                <th className={thClass}>Issued</th>
                <th className={thClass}>Reference</th>
                <th className={thClass}>Scope</th>
              </tr>
            </thead>
            <tbody>
              {letters.map((l) => (
                <tr key={l.id}>
                  <td className={tdClass}>{formatDate(l.createdAt)}</td>
                  <td className={`${tdClass} max-w-sm`}>{l.title}</td>
                  <td className={tdClass}>{l.scope}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
