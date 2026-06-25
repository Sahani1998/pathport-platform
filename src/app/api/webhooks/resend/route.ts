// POST /api/webhooks/resend
//
// Receives bounce and complaint events from Resend webhooks.
// Verified via HMAC-SHA256 using RESEND_WEBHOOK_SECRET env var.
// On bounce/complaint: sets profiles.do_not_contact = true and marks
// email_log rows for that address as failed so no further mail is sent.
//
// Resend webhook docs: https://resend.com/docs/dashboard/webhooks/event-types

import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin-client";

type ResendWebhookEvent = {
  type: string;
  data: {
    email_id?: string;
    to?: string[];
    from?: string;
    created_at?: string;
  };
};

async function verifySignature(
  body: string,
  svixId: string | null,
  svixTimestamp: string | null,
  svixSignature: string | null,
): Promise<boolean> {
  const secret = process.env.RESEND_WEBHOOK_SECRET;
  if (!secret) {
    console.warn("[ResendWebhook] RESEND_WEBHOOK_SECRET not set — skipping HMAC verification");
    return true;
  }
  if (!svixId || !svixTimestamp || !svixSignature) return false;

  const toSign = `${svixId}.${svixTimestamp}.${body}`;
  const encoder = new TextEncoder();
  const keyData = encoder.encode(secret.replace(/^whsec_/, ""));
  const key = await crypto.subtle.importKey("raw", keyData, { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const sig = await crypto.subtle.sign("HMAC", key, encoder.encode(toSign));
  const computed = `v1,${btoa(Array.from(new Uint8Array(sig)).map(b => String.fromCharCode(b)).join(""))}`;
  return svixSignature.split(" ").some(s => s === computed);
}

export async function POST(request: NextRequest) {
  const body = await request.text();
  const svixId        = request.headers.get("svix-id");
  const svixTimestamp = request.headers.get("svix-timestamp");
  const svixSignature = request.headers.get("svix-signature");

  const valid = await verifySignature(body, svixId, svixTimestamp, svixSignature);
  if (!valid) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  let event: ResendWebhookEvent;
  try {
    event = JSON.parse(body) as ResendWebhookEvent;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const actionableTypes = new Set(["email.bounced", "email.complained"]);
  if (!actionableTypes.has(event.type)) {
    return NextResponse.json({ received: true });
  }

  const toAddresses = event.data?.to ?? [];
  if (toAddresses.length === 0) {
    return NextResponse.json({ received: true });
  }

  const adminDb = createAdminClient();

  await Promise.all(
    toAddresses.map(async (address) => {
      const email = address.toLowerCase().trim();

      await adminDb
        .from("profiles")
        .update({ do_not_contact: true })
        .eq("email", email);

      await adminDb
        .from("email_log")
        .update({
          status: "failed",
          error_message: `suppressed:${event.type}`,
        })
        .eq("to_email", email)
        .in("status", ["queued", "sent"]);

      console.log(`[ResendWebhook] ${event.type} → suppressed ${email}`);
    }),
  );

  return NextResponse.json({ received: true });
}
