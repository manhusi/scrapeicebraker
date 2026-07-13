import { NextResponse } from "next/server";
import {
  updateMessage,
  approveMessage,
  unapproveMessage,
  banLead,
} from "@/lib/services/reviewMessage";

// PATCH /api/messages/[leadId] — szerkesztés, jóváhagyás vagy kézi eldobás (ban).
// body: { action: "save"|"approve"|"unapprove"|"ban", subject?, finalMessage? }
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ leadId: string }> },
) {
  try {
    const { leadId } = await params;
    const body = await request.json().catch(() => ({}));

    switch (body.action) {
      case "save":
        await updateMessage(leadId, {
          subject: body.subject,
          finalMessage: body.finalMessage,
        });
        break;
      case "approve":
        // Mentsük is a szerkesztést jóváhagyás előtt, ha jött.
        if (body.subject !== undefined || body.finalMessage !== undefined) {
          await updateMessage(leadId, {
            subject: body.subject,
            finalMessage: body.finalMessage,
          });
        }
        await approveMessage(leadId);
        break;
      case "unapprove":
        await unapproveMessage(leadId);
        break;
      case "ban":
        await banLead(leadId);
        break;
      default:
        return NextResponse.json(
          { ok: false, error: "Érvénytelen 'action'." },
          { status: 400 },
        );
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "hiba" },
      { status: 500 },
    );
  }
}
