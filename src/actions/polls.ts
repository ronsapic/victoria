"use server";

import { revalidatePath } from "next/cache";
import { logActivity } from "@/lib/activity";
import { prisma } from "@/lib/db";
import { requireAnyRole } from "@/lib/auth/require-role";

export async function createPoll(formData: FormData) {
  await requireAnyRole(["auditor"]);
  const title = String(formData.get("title") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const opt1 = String(formData.get("opt1") ?? "").trim();
  const opt2 = String(formData.get("opt2") ?? "").trim();
  const anonymous = String(formData.get("anonymous") ?? "") === "on";

  const options = [opt1, opt2].filter(Boolean);
  if (!title || options.length < 2) return;

  const poll = await prisma.poll.create({
    data: {
      title,
      description,
      anonymous,
      options: { create: options.map((label) => ({ label })) },
    },
  });

  await logActivity({
    action: "create_poll",
    entity: "poll",
    entityId: poll.id,
  });
  revalidatePath("/voting");
}

export async function castVote(formData: FormData) {
  const pollId = String(formData.get("pollId") ?? "");
  const optionId = String(formData.get("optionId") ?? "");
  const unitId = String(formData.get("unitId") ?? "");
  if (!pollId || !optionId || !unitId) return;

  try {
    await prisma.vote.create({
      data: { pollId, optionId, unitId },
    });
  } catch {
    /* unique constraint poll+unit — ignore duplicate UX */
    return;
  }

  await logActivity({
    action: "vote",
    entity: "poll",
    entityId: pollId,
    metadata: { unitId },
  });
  revalidatePath("/voting");
  revalidatePath(`/voting/${pollId}`);
}

export async function closePoll(formData: FormData) {
  await requireAnyRole(["auditor"]);
  const id = String(formData.get("id") ?? "");
  if (!id) return;

  await prisma.poll.update({ where: { id }, data: { closed: true } });
  await logActivity({ action: "close_poll", entity: "poll", entityId: id });
  revalidatePath("/voting");
  revalidatePath(`/voting/${id}`);
}
