"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, Loader2, AlertCircle } from "lucide-react";
import MediaUploadWidget from "@/components/media/MediaUploadWidget";
import type { College } from "@/types/courses";

interface Props {
  college: College;
}

type BrandingDraft = {
  tagline:                string;
  brand_colour_primary:   string;
  brand_colour_secondary: string;
  short_description:      string;
  mission:                string;
  vision:                 string;
  introduction:           string;
};

export default function BrandingForm({ college }: Props) {
  const router = useRouter();
  const [draft, setDraft] = useState<BrandingDraft>({
    tagline:                college.tagline                ?? "",
    brand_colour_primary:   college.brand_colour_primary   ?? "",
    brand_colour_secondary: college.brand_colour_secondary ?? "",
    short_description:      college.short_description      ?? "",
    mission:                college.mission                ?? "",
    vision:                 college.vision                 ?? "",
    introduction:           college.introduction           ?? "",
  });
  const [busy,    setBusy]    = useState(false);
  const [error,   setError]   = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const set = (k: keyof BrandingDraft) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setDraft(d => ({ ...d, [k]: e.target.value }));

  const handleSave = async () => {
    setError(null);
    setSuccess(null);

    const hexRe = /^#[0-9a-fA-F]{6}$/;
    if (draft.brand_colour_primary && !hexRe.test(draft.brand_colour_primary)) {
      setError("Primary brand colour must be a valid hex value (e.g. #1a2b3c)");
      return;
    }
    if (draft.brand_colour_secondary && !hexRe.test(draft.brand_colour_secondary)) {
      setError("Secondary brand colour must be a valid hex value (e.g. #ffffff)");
      return;
    }
    if (draft.tagline.length > 120) {
      setError("Tagline must be 120 characters or fewer");
      return;
    }

    setBusy(true);
    try {
      const body: Record<string, string | null> = {
        tagline:                draft.tagline                || null,
        brand_colour_primary:   draft.brand_colour_primary   || null,
        brand_colour_secondary: draft.brand_colour_secondary || null,
        short_description:      draft.short_description      || null,
        mission:                draft.mission                || null,
        vision:                 draft.vision                 || null,
        introduction:           draft.introduction           || null,
      };
      const res = await fetch(`/api/colleges/${college.id}/branding`, {
        method:  "PATCH",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify(body),
      });
      const data = await res.json() as { error?: string };
      if (!res.ok) throw new Error(data.error ?? "Save failed");
      setSuccess("Branding saved.");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Save failed");
    } finally {
      setBusy(false);
    }
  };

  const inputCls = "w-full bg-white/[0.06] border border-white/[0.10] rounded-xl px-3 py-2.5 font-body text-sm text-white placeholder-white/25 focus:outline-none focus:border-gold-400/50 transition-colors";
  const textareaCls = `${inputCls} resize-none`;
  const labelCls = "block text-white/40 font-body text-[10px] uppercase tracking-wider mb-1.5";

  return (
    <div className="space-y-8">

      {/* Logo + Cover */}
      <section className="bg-white/[0.04] border border-white/[0.08] rounded-2xl p-5 space-y-5">
        <h3 className="font-display text-lg text-white">Logo &amp; Cover Image</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <MediaUploadWidget
            label="College Logo"
            endpoint={`/api/colleges/${college.id}/logo`}
            currentUrl={college.logo_url}
            aspectHint="Square, min 200×200px"
            onUploaded={() => router.refresh()}
          />
          <MediaUploadWidget
            label="Cover Image"
            endpoint={`/api/colleges/${college.id}/cover`}
            currentUrl={college.cover_image_url}
            aspectHint="16:9 recommended, min 1200×675px"
            onUploaded={() => router.refresh()}
          />
        </div>
      </section>

      {/* Text identity */}
      <section className="bg-white/[0.04] border border-white/[0.08] rounded-2xl p-5 space-y-4">
        <h3 className="font-display text-lg text-white">Identity</h3>

        <div>
          <label className={labelCls}>Tagline <span className="text-white/20 normal-case">(max 120 chars)</span></label>
          <input
            type="text"
            value={draft.tagline}
            onChange={set("tagline")}
            maxLength={120}
            placeholder="e.g. Shaping Singapore's Future Leaders"
            className={inputCls}
          />
          <p className="text-white/20 font-body text-[10px] mt-1 text-right">{draft.tagline.length}/120</p>
        </div>

        <div>
          <label className={labelCls}>Short Description <span className="text-white/20 normal-case">(used in college cards, ~280 chars)</span></label>
          <textarea
            value={draft.short_description}
            onChange={set("short_description")}
            rows={2}
            maxLength={400}
            placeholder="A concise blurb shown on the college listing cards."
            className={textareaCls}
          />
        </div>

        <div>
          <label className={labelCls}>Introduction <span className="text-white/20 normal-case">(shown on public college page)</span></label>
          <textarea
            value={draft.introduction}
            onChange={set("introduction")}
            rows={4}
            placeholder="A richer narrative about the college's history, reputation, and programmes."
            className={textareaCls}
          />
        </div>
      </section>

      {/* Mission + Vision */}
      <section className="bg-white/[0.04] border border-white/[0.08] rounded-2xl p-5 space-y-4">
        <h3 className="font-display text-lg text-white">Mission &amp; Vision</h3>
        <div>
          <label className={labelCls}>Mission Statement</label>
          <textarea
            value={draft.mission}
            onChange={set("mission")}
            rows={3}
            placeholder="e.g. To empower students with industry-relevant skills and global perspectives."
            className={textareaCls}
          />
        </div>
        <div>
          <label className={labelCls}>Vision Statement</label>
          <textarea
            value={draft.vision}
            onChange={set("vision")}
            rows={3}
            placeholder="e.g. To be Singapore's most trusted pathway institution by 2030."
            className={textareaCls}
          />
        </div>
      </section>

      {/* Brand Colours */}
      <section className="bg-white/[0.04] border border-white/[0.08] rounded-2xl p-5 space-y-4">
        <h3 className="font-display text-lg text-white">Brand Colours <span className="text-white/25 font-body text-sm font-normal">(optional — used for accent styling on public page)</span></h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className={labelCls}>Primary Colour</label>
            <div className="flex gap-2">
              <input
                type="color"
                value={draft.brand_colour_primary || "#1a2b3c"}
                onChange={e => setDraft(d => ({ ...d, brand_colour_primary: e.target.value }))}
                className="h-10 w-12 rounded-lg border border-white/[0.10] bg-white/[0.06] cursor-pointer [color-scheme:dark]"
              />
              <input
                type="text"
                value={draft.brand_colour_primary}
                onChange={set("brand_colour_primary")}
                placeholder="#1a2b3c"
                maxLength={7}
                className={`${inputCls} flex-1`}
              />
            </div>
          </div>
          <div>
            <label className={labelCls}>Secondary Colour</label>
            <div className="flex gap-2">
              <input
                type="color"
                value={draft.brand_colour_secondary || "#ffffff"}
                onChange={e => setDraft(d => ({ ...d, brand_colour_secondary: e.target.value }))}
                className="h-10 w-12 rounded-lg border border-white/[0.10] bg-white/[0.06] cursor-pointer [color-scheme:dark]"
              />
              <input
                type="text"
                value={draft.brand_colour_secondary}
                onChange={set("brand_colour_secondary")}
                placeholder="#ffffff"
                maxLength={7}
                className={`${inputCls} flex-1`}
              />
            </div>
          </div>
        </div>
        {(draft.brand_colour_primary || draft.brand_colour_secondary) && (
          <div className="flex gap-3">
            {draft.brand_colour_primary && (
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 rounded-md border border-white/10" style={{ backgroundColor: draft.brand_colour_primary }} />
                <span className="font-body text-xs text-white/40">Primary</span>
              </div>
            )}
            {draft.brand_colour_secondary && (
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 rounded-md border border-white/10" style={{ backgroundColor: draft.brand_colour_secondary }} />
                <span className="font-body text-xs text-white/40">Secondary</span>
              </div>
            )}
          </div>
        )}
      </section>

      {/* Save */}
      <div className="flex items-center gap-4">
        <button
          type="button"
          onClick={handleSave}
          disabled={busy}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gold-500/15 border border-gold-400/30 text-gold-400 font-body text-sm font-semibold hover:bg-gold-500/25 transition-all disabled:opacity-50"
        >
          {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
          Save Branding
        </button>
        {error && (
          <div className="flex items-center gap-1.5 text-red-400 font-body text-xs">
            <AlertCircle className="w-3.5 h-3.5" /> {error}
          </div>
        )}
        {success && (
          <div className="flex items-center gap-1.5 text-emerald-400 font-body text-xs">
            <CheckCircle2 className="w-3.5 h-3.5" /> {success}
          </div>
        )}
      </div>
    </div>
  );
}
