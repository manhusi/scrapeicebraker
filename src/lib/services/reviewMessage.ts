import { prisma } from "@/lib/db";

// Draft-review logika: szerkesztés + jóváhagyás. A jóváhagyás lép a lead-állapotgépen (DRAFTED→APPROVED).

export async function updateMessage(
  leadId: string,
  data: { subject?: string; finalMessage?: string },
) {
  const message = await prisma.message.findUnique({ where: { leadId } });
  if (!message) throw new Error("nincs üzenet ehhez a leadhez");

  return prisma.message.update({
    where: { leadId },
    data: {
      subject: data.subject?.trim() ?? message.subject,
      finalMessage: data.finalMessage?.trim() ?? message.finalMessage,
      edited: true,
    },
  });
}

export async function approveMessage(leadId: string) {
  await prisma.message.update({
    where: { leadId },
    data: { status: "APPROVED", approvedAt: new Date() },
  });
  return prisma.lead.update({
    where: { id: leadId },
    data: { status: "APPROVED" },
  });
}

export async function unapproveMessage(leadId: string) {
  await prisma.message.update({
    where: { leadId },
    data: { status: "DRAFT", approvedAt: null },
  });
  return prisma.lead.update({
    where: { id: leadId },
    data: { status: "DRAFTED" },
  });
}
