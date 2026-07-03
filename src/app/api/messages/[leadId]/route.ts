import { NextResponse } from "next/server";
import {
  updateMessage,
  approveMessage,
  unapproveMessage,
} from "@/lib/services/reviewMessage";

// PATCH /api/messages/[leadId] — szerkesztés vagy jóváhagyás.
// body: { action: "save"|"approve"|"unapprove", subject?, finalMessage? }
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
