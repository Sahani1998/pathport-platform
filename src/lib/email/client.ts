import { Resend } from "resend";

let instance: Resend | null = null;

export function getEmailClient(): Resend | null {
  const key = process.env.RESEND_API_KEY;
  if (!key) return null;
  if (!instance) instance = new Resend(key);
  return instance;
}

export const FROM_ADDRESS =
  process.env.RESEND_FROM_EMAIL ?? "PathPort <noreply@pathport.sg>";

export const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://pathport.sg";
