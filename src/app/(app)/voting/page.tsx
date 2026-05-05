import Link from "next/link";
import { closePoll, createPoll } from "@/actions/polls";
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

export default async function VotingPage() {
  const polls = await prisma.poll.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      options: { select: { id: true, label: true } },
      _count: { select: { votes: true } },
    },
  });

  return (
    <div className="mx-auto max-w-6xl space-y-8">
      <ModuleHeader moduleKey="voting" />

      <div className="grid gap-6 lg:grid-cols-[340px,1fr]">
        <div className={`${cardClass} h-fit`}>
          <h3 className="mb-4 text-sm font-semibold text-zinc-900 dark:text-zinc-50">
            Convene ballot
          </h3>
          <form action={createPoll} className="space-y-3">
            <div>
              <label className={labelClass}>Prompt</label>
              <input name="title" required className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Context</label>
              <textarea name="description" rows={3} className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Choice A</label>
              <input name="opt1" required className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Choice B</label>
              <input name="opt2" required className={inputClass} />
            </div>
            <label className="flex gap-2 text-sm text-zinc-700 dark:text-zinc-300">
              <input type="checkbox" name="anonymous" />
              Prefer anonymous ballots (stored without names next phase)
            </label>
            <button type="submit" className={`${btnPrimaryClass} w-full`}>
              Publish poll
            </button>
          </form>
        </div>

        <div className={`${cardClass} overflow-x-auto`}>
          <h3 className="mb-4 text-sm font-semibold text-zinc-900 dark:text-zinc-50">
            Agenda
          </h3>
          <table className={tableClass}>
            <thead>
              <tr>
                <th className={thClass}>Question</th>
                <th className={thClass}>Choices</th>
                <th className={thClass}>Votes recorded</th>
                <th className={thClass}>State</th>
                <th className={thClass} />
              </tr>
            </thead>
            <tbody>
              {polls.map((p) => (
                <tr key={p.id}>
                  <td className={`${tdClass} max-w-[200px]`}>{p.title}</td>
                  <td className={tdClass}>{p.options.length}</td>
                  <td className={tdClass}>{p._count.votes}</td>
                  <td className={tdClass}>{p.closed ? "Closed" : "Open"}</td>
                  <td className={`${tdClass} flex flex-wrap gap-1`}>
                    <Link
                      href={`/voting/${p.id}`}
                      className="text-sm underline font-medium"
                    >
                      Ballot booth
                    </Link>
                    {!p.closed && (
                      <form action={closePoll}>
                        <input type="hidden" name="id" value={p.id} />
                        <button type="submit" className={btnGhostClass}>
                          Close voting
                        </button>
                      </form>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {polls.length === 0 && (
            <p className="py-10 text-center text-sm text-zinc-500">
              No ballots yet — create one to test one-vote-per-unit logic.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
