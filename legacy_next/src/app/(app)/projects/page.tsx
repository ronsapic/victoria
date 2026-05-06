import { createProject, updateProjectStatus } from "@/actions/projects";
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
import { prisma } from "@/lib/db";

export default async function ProjectsPage() {
  const projects = await prisma.project.findMany({
    orderBy: { updatedAt: "desc" },
  });

  return (
    <div className="mx-auto max-w-6xl space-y-8">
      <ModuleHeader moduleKey="projects" />

      <div className="grid gap-6 lg:grid-cols-[340px,1fr]">
        <div className={`${cardClass} h-fit`}>
          <h3 className="mb-4 text-sm font-semibold text-zinc-900 dark:text-zinc-50">
            Raise improvement stream
          </h3>
          <form action={createProject} className="space-y-3">
            <div>
              <label className={labelClass}>Project name</label>
              <input name="name" required className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Briefing</label>
              <textarea name="description" rows={3} className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Stage</label>
              <select name="status" className={inputClass} defaultValue="PLANNED">
                <option value="PLANNED">Planned</option>
                <option value="IN_PROGRESS">Under construction</option>
                <option value="BLOCKED">Blocked</option>
              </select>
            </div>
            <div>
              <label className={labelClass}>Timing note</label>
              <input
                name="timelineNote"
                placeholder="Targeting Q4 handover ..."
                className={inputClass}
              />
            </div>
            <button type="submit" className={`${btnPrimaryClass} w-full`}>
              Spin up tracker
            </button>
          </form>
        </div>

        <div className={`${cardClass} overflow-x-auto`}>
          <h3 className="mb-4 text-sm font-semibold text-zinc-900 dark:text-zinc-50">
            Execution board
          </h3>
          <table className={tableClass}>
            <thead>
              <tr>
                <th className={thClass}>Deliverable</th>
                <th className={thClass}>Brief</th>
                <th className={thClass}>Stage</th>
                <th className={thClass}>Ops</th>
              </tr>
            </thead>
            <tbody>
              {projects.map((p) => (
                <tr key={p.id}>
                  <td className={tdClass}>{p.name}</td>
                  <td className={`${tdClass} max-w-xs text-xs`}>{p.description}</td>
                  <td className={tdClass}>{p.status}</td>
                  <td className={tdClass}>
                    <form action={updateProjectStatus} className="flex flex-wrap gap-1">
                      <input type="hidden" name="id" value={p.id} />
                      <select name="status" className="rounded border px-1 py-0.5 text-xs dark:bg-zinc-950">
                        <option value="PLANNED">PLANNED</option>
                        <option value="IN_PROGRESS">IN_PROGRESS</option>
                        <option value="BLOCKED">BLOCKED</option>
                        <option value="DONE">DONE</option>
                      </select>
                      <input
                        name="timelineNote"
                        placeholder="milestone ..."
                        defaultValue={p.timelineNote ?? ""}
                        className="w-32 rounded border px-2 py-0.5 text-xs dark:bg-zinc-950"
                      />
                      <button type="submit" className={`${btnGhostClass} px-2 py-1 text-xs`}>
                        Refresh
                      </button>
                    </form>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
