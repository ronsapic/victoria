import Link from "next/link";
import { notFound } from "next/navigation";
import { castVote } from "@/actions/polls";
import { ModuleHeader } from "@/components/module-header";
import { btnPrimaryClass, cardClass, inputClass, labelClass } from "@/components/form-styles";
import { prisma } from "@/lib/db";

type Props = { params: Promise<{ id: string }> };

export default async function PollVotePage({ params }: Props) {
  const { id } = await params;

  const poll = await prisma.poll.findUnique({
    where: { id },
    include: {
      options: {
        include: { _count: { select: { votes: true } } },
      },
    },
  });

  if (!poll) notFound();

  const units = await prisma.unit.findMany({ orderBy: { number: "asc" } });
  const totalVotes = poll.options.reduce(
    (s, o) => s + o._count.votes,
    0,
  );

  return (
    <div className="mx-auto max-w-6xl space-y-8">
      <ModuleHeader moduleKey="voting" />
      <Link href="/voting" className="text-sm underline text-zinc-600">
        ← Voting home
      </Link>

      <div className="grid gap-6 lg:grid-cols-[1fr,360px]">
        <article className={cardClass}>
          <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50">
            {poll.title}
          </h2>
          {poll.description && (
            <p className="mt-3 text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
              {poll.description}
            </p>
          )}
          <p className="mt-4 text-xs text-zinc-500">
            {poll.closed
              ? "Ballot sealed — tally below is final snapshot."
              : "Each participating unit casts once via the ballot form."}
          </p>
          <dl className="mt-8 space-y-3">
            {poll.options.map((opt) => {
              const pct =
                totalVotes > 0 ? Math.round((opt._count.votes / totalVotes) * 100) : 0;
              return (
                <div key={opt.id}>
                  <dt className="flex justify-between text-sm font-medium text-zinc-800 dark:text-zinc-200">
                    <span>{opt.label}</span>
                    <span>
                      {opt._count.votes} votes ({pct}%)
                    </span>
                  </dt>
                  <dd className="mt-2 h-2 rounded-full bg-zinc-100 dark:bg-zinc-800">
                    <div
                      className="h-2 rounded-full bg-zinc-900 dark:bg-zinc-50"
                      style={{ width: `${pct}%` }}
                    />
                  </dd>
                </div>
              );
            })}
          </dl>
        </article>

        {!poll.closed && (
          <div className={`${cardClass} h-fit`}>
            <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
              Vote as a unit delegate
            </h3>
            <form action={castVote} className="mt-4 space-y-3">
              <input type="hidden" name="pollId" value={poll.id} />
              <div>
                <label className={labelClass}>Unit</label>
                <select name="unitId" required className={inputClass}>
                  {units.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.number}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className={labelClass}>Decision</label>
                <select name="optionId" required className={inputClass}>
                  {poll.options.map((o) => (
                    <option key={o.id} value={o.id}>
                      {o.label}
                    </option>
                  ))}
                </select>
              </div>
              <button type="submit" className={`${btnPrimaryClass} w-full`}>
                Submit vote (one per poll / unit pair)
              </button>
              <p className="text-xs text-zinc-500">
                Duplicates silently skip — tighten UX with toast after auth arrives.
              </p>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
