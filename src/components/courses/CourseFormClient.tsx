"use client";

import { useState, type FormEvent, type ChangeEvent } from "react";
import { createClient } from "@/lib/supabase/client";
import GoldButton from "@/components/ui/GoldButton";
import { Loader2, ArrowLeft, ChevronDown, ChevronRight, Image, Video, Briefcase, Link2 } from "lucide-react";
import type { Course } from "@/types/courses";
import { COURSE_CATEGORIES } from "@/types/courses";
import Link from "next/link";
import { cn } from "@/lib/utils";

const INPUT       = "w-full bg-white/[0.06] border border-white/[0.10] rounded-xl px-4 py-3 font-body text-sm text-white placeholder-white/25 focus:outline-none focus:border-gold-400/60 transition-all [color-scheme:dark] [&>option]:bg-navy-800";
const LABEL       = "block text-white/55 font-body text-sm mb-1.5 font-medium";
const OPT_HINT    = "text-white/25 font-body text-xs ml-2 font-normal";
const OPTION_STYLE = { backgroundColor: "#0a1024", color: "#fff" } as const;

interface CourseFormClientProps {
  collegeId:   string;
  collegeName: string;
  course?:     Course | null;
}

type FormState = {
  // ── Required core fields ──────────────────────────────────────────────────
  title:           string;
  category:        string;
  description:     string;
  duration_months: string;
  tuition_fee:     string;
  application_fee: string;
  intake_date:     string;
  seats_total:     string;
  study_mode:      string;
  level:           string;
  status:          string;

  // ── Optional: Media & Assets ──────────────────────────────────────────────
  thumbnail_url:  string;
  video_url:      string;
  brochure_url:   string;
  gallery_images: string;  // one URL per line in UI → string[] in DB

  // ── Optional: Career Outcomes ─────────────────────────────────────────────
  career_outcomes:                string;  // one outcome per line → string[]
  industries:                     string;  // comma-separated → string[]
  internship_available:           boolean;
  internship_duration_months:     string;
  estimated_internship_allowance: string;
  pathway_description:            string;
  job_outlook_description:        string;
};

function slugify(text: string): string {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

// Convert newline-separated textarea value to trimmed string array (filter empties)
function lines(val: string): string[] {
  return val.split("\n").map(s => s.trim()).filter(Boolean);
}

// Convert comma-separated value to trimmed string array
function commas(val: string): string[] {
  return val.split(",").map(s => s.trim()).filter(Boolean);
}

export default function CourseFormClient({ collegeId, collegeName, course }: CourseFormClientProps) {
  const isEdit = !!course;

  const [form, setForm] = useState<FormState>({
    title:           course?.title           ?? "",
    category:        course?.category        ?? "Business",
    description:     course?.description     ?? "",
    duration_months: String(course?.duration_months ?? 12),
    tuition_fee:     String(course?.tuition_fee      ?? ""),
    application_fee: String(course?.application_fee  ?? "109"),
    intake_date:     course?.intake_date     ? course.intake_date.slice(0, 10) : "",
    seats_total:     String(course?.seats_total ?? 30),
    study_mode:      course?.study_mode      ?? "full_time",
    level:           course?.level           ?? "diploma",
    status:          course?.status          ?? "open",

    // optional — media
    thumbnail_url:  course?.thumbnail_url  ?? "",
    video_url:      course?.video_url      ?? "",
    brochure_url:   course?.brochure_url   ?? "",
    gallery_images: (course?.gallery_images ?? []).join("\n"),

    // optional — career
    career_outcomes:                (course?.career_outcomes ?? []).join("\n"),
    industries:                     (course?.industries ?? []).join(", "),
    internship_available:           course?.internship_available ?? false,
    internship_duration_months:     String(course?.internship_duration_months ?? ""),
    estimated_internship_allowance: String(course?.estimated_internship_allowance ?? ""),
    pathway_description:            course?.pathway_description    ?? "",
    job_outlook_description:        course?.job_outlook_description ?? "",
  });

  const [loading,      setLoading]      = useState(false);
  const [error,        setError]        = useState<string | null>(null);
  const [showMedia,    setShowMedia]    = useState(!!(
    course?.thumbnail_url || course?.video_url || course?.brochure_url || course?.gallery_images?.length
  ));
  const [showCareer,   setShowCareer]   = useState(!!(
    course?.career_outcomes?.length || course?.industries?.length ||
    course?.internship_available || course?.pathway_description
  ));

  const onChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    setForm(p => ({
      ...p,
      [name]: type === "checkbox" ? (e.target as HTMLInputElement).checked : value,
    }));
  };

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const supabase = createClient();

      // Build the payload — always include core fields
      const corePayload = {
        college_id:      collegeId,
        title:           form.title.trim(),
        slug:            isEdit ? course!.slug : `${slugify(form.title)}-${Date.now().toString(36)}`,
        category:        form.category,
        description:     form.description.trim() || null,
        duration_months: parseInt(form.duration_months) || 12,
        tuition_fee:     parseFloat(form.tuition_fee) || 0,
        application_fee: parseFloat(form.application_fee) || 109,
        intake_date:     form.intake_date || null,
        seats_total:     parseInt(form.seats_total) || 30,
        study_mode:      form.study_mode,
        level:           form.level,
        status:          form.status,
      };

      // Optional fields: only include if non-empty to avoid overwriting with nulls
      const optionalPayload = {
        thumbnail_url:                form.thumbnail_url.trim()  || null,
        video_url:                    form.video_url.trim()       || null,
        brochure_url:                 form.brochure_url.trim()    || null,
        gallery_images:               lines(form.gallery_images).length  ? lines(form.gallery_images)  : null,
        career_outcomes:              lines(form.career_outcomes).length  ? lines(form.career_outcomes) : null,
        industries:                   commas(form.industries).length      ? commas(form.industries)      : null,
        internship_available:         form.internship_available,
        internship_duration_months:   parseInt(form.internship_duration_months) || null,
        estimated_internship_allowance: parseFloat(form.estimated_internship_allowance) || null,
        pathway_description:          form.pathway_description.trim()    || null,
        job_outlook_description:      form.job_outlook_description.trim() || null,
      };

      const payload = { ...corePayload, ...optionalPayload };

      if (isEdit) {
        console.log("[InstitutionPortal] updating course:", course!.id);
        const { error: updateError } = await supabase.from("courses").update(payload).eq("id", course!.id);
        if (updateError) throw new Error(updateError.message);
      } else {
        console.log("[InstitutionPortal] creating course for college:", collegeId);
        const { error: insertError } = await supabase.from("courses").insert(payload);
        if (insertError) throw new Error(insertError.message);
      }

      window.location.href = "/dashboard/institution/courses";
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error("[InstitutionPortal] course form error:", msg);
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl">
      {/* Back */}
      <div className="flex items-center gap-3 mb-6">
        <Link href="/dashboard/institution/courses" className="p-2 rounded-xl text-white/40 hover:text-white/70 hover:bg-white/[0.05] border border-transparent hover:border-white/[0.08] transition-all">
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div>
          <h2 className="font-display text-2xl text-white">{isEdit ? "Edit Course" : "New Course"}</h2>
          <p className="text-white/40 font-body text-sm">{collegeName}</p>
        </div>
      </div>

      <form onSubmit={onSubmit} method="POST" action="#" noValidate className="space-y-6">

        {error && (
          <div className="p-4 rounded-xl bg-red-500/10 border border-red-400/30 text-red-400 font-body text-sm">
            {error}
          </div>
        )}

        {/* ── Required Core Fields ─────────────────────────────────────────── */}
        <div className="bg-white/[0.03] border border-white/[0.08] rounded-2xl p-5 space-y-5">
          <p className="text-white/55 font-body text-xs uppercase tracking-widest">Course Details</p>

          {/* Title */}
          <div>
            <label className={LABEL}>Course Title <span className="text-gold-400">*</span></label>
            <input name="title" required value={form.title} onChange={onChange} placeholder="e.g. Diploma in Business Administration" className={INPUT} />
          </div>

          {/* Category + Level */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={LABEL}>Category <span className="text-gold-400">*</span></label>
              <select name="category" value={form.category} onChange={onChange} className={INPUT}>
                {COURSE_CATEGORIES.map(c => <option key={c} value={c} style={OPTION_STYLE}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className={LABEL}>Level <span className="text-gold-400">*</span></label>
              <select name="level" value={form.level} onChange={onChange} className={INPUT}>
                <option value="diploma" style={OPTION_STYLE}>Diploma</option>
                <option value="advanced_diploma" style={OPTION_STYLE}>Advanced Diploma</option>
                <option value="graduate_diploma" style={OPTION_STYLE}>Graduate Diploma</option>
                <option value="certificate" style={OPTION_STYLE}>Certificate</option>
              </select>
            </div>
          </div>

          {/* Description */}
          <div>
            <label className={LABEL}>Description</label>
            <textarea name="description" value={form.description} onChange={onChange} rows={4} placeholder="Programme overview, key modules, career outcomes…" className={cn(INPUT, "resize-none")} />
          </div>

          {/* Duration + Mode */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={LABEL}>Duration (months) <span className="text-gold-400">*</span></label>
              <input name="duration_months" type="number" min={1} max={48} value={form.duration_months} onChange={onChange} className={INPUT} />
            </div>
            <div>
              <label className={LABEL}>Study Mode</label>
              <select name="study_mode" value={form.study_mode} onChange={onChange} className={INPUT}>
                <option value="full_time" style={OPTION_STYLE}>Full-Time</option>
                <option value="part_time" style={OPTION_STYLE}>Part-Time</option>
              </select>
            </div>
          </div>

          {/* Fees */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={LABEL}>Tuition Fee (SGD) <span className="text-gold-400">*</span></label>
              <input name="tuition_fee" type="number" min={0} step={50} value={form.tuition_fee} onChange={onChange} placeholder="4000" className={INPUT} />
            </div>
            <div>
              <label className={LABEL}>Application Fee (SGD)</label>
              <input name="application_fee" type="number" min={0} step={1} value={form.application_fee} onChange={onChange} placeholder="109" className={INPUT} />
            </div>
          </div>

          {/* Intake + Seats */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={LABEL}>Intake Date</label>
              <input name="intake_date" type="date" value={form.intake_date} onChange={onChange} className={INPUT} />
            </div>
            <div>
              <label className={LABEL}>Total Seats</label>
              <input name="seats_total" type="number" min={1} value={form.seats_total} onChange={onChange} className={INPUT} />
            </div>
          </div>

          {/* Status */}
          <div>
            <label className={LABEL}>Status</label>
            <select name="status" value={form.status} onChange={onChange} className={INPUT}>
              <option value="open" style={OPTION_STYLE}>Open — accepting applications</option>
              <option value="draft" style={OPTION_STYLE}>Draft — not visible to students</option>
              <option value="closed" style={OPTION_STYLE}>Closed — intake full</option>
            </select>
          </div>
        </div>

        {/* ── Optional: Media & Assets ──────────────────────────────────────── */}
        <div className="border border-white/[0.08] rounded-2xl overflow-hidden">
          <button
            type="button"
            onClick={() => setShowMedia(v => !v)}
            className="w-full flex items-center justify-between px-5 py-4 bg-white/[0.02] hover:bg-white/[0.04] transition-colors"
          >
            <div className="flex items-center gap-3">
              <Image className="w-4 h-4 text-pathBlue-400" />
              <span className="font-body text-sm font-semibold text-white/70">Media &amp; Assets</span>
              <span className="px-2 py-0.5 rounded-full bg-white/[0.06] border border-white/[0.09] text-white/35 font-body text-[10px] uppercase tracking-wider">Optional</span>
            </div>
            {showMedia ? <ChevronDown className="w-4 h-4 text-white/35" /> : <ChevronRight className="w-4 h-4 text-white/35" />}
          </button>

          {showMedia && (
            <div className="p-5 space-y-4 border-t border-white/[0.07]">
              <p className="text-white/35 font-body text-xs">
                Add a thumbnail, intro video, and brochure to make your listing stand out. All fields are optional — courses publish fine without them.
              </p>

              {/* Thumbnail */}
              <div>
                <label className={LABEL}>Thumbnail Image URL <span className={OPT_HINT}>(optional)</span></label>
                <input name="thumbnail_url" type="url" value={form.thumbnail_url} onChange={onChange} placeholder="https://…/thumbnail.jpg" className={INPUT} />
                <p className="text-white/25 font-body text-xs mt-1">Recommended: 1200×630px JPG or PNG</p>
              </div>

              {/* Video */}
              <div>
                <label className={LABEL}>
                  <Video className="w-3.5 h-3.5 inline mr-1.5 text-white/40" />
                  Intro Video URL <span className={OPT_HINT}>(optional)</span>
                </label>
                <input name="video_url" type="url" value={form.video_url} onChange={onChange} placeholder="https://youtube.com/watch?v=… or https://vimeo.com/…" className={INPUT} />
              </div>

              {/* Brochure */}
              <div>
                <label className={LABEL}>
                  <Link2 className="w-3.5 h-3.5 inline mr-1.5 text-white/40" />
                  Brochure / PDF URL <span className={OPT_HINT}>(optional)</span>
                </label>
                <input name="brochure_url" type="url" value={form.brochure_url} onChange={onChange} placeholder="https://…/brochure.pdf" className={INPUT} />
              </div>

              {/* Gallery */}
              <div>
                <label className={LABEL}>Gallery Image URLs <span className={OPT_HINT}>(optional — one URL per line)</span></label>
                <textarea
                  name="gallery_images"
                  value={form.gallery_images}
                  onChange={onChange}
                  rows={4}
                  placeholder={"https://…/campus-1.jpg\nhttps://…/campus-2.jpg\nhttps://…/classroom.jpg"}
                  className={cn(INPUT, "resize-none font-mono text-xs")}
                />
                <p className="text-white/25 font-body text-xs mt-1">
                  {lines(form.gallery_images).length > 0 ? `${lines(form.gallery_images).length} image${lines(form.gallery_images).length !== 1 ? "s" : ""}` : "No images added yet"}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* ── Optional: Career Outcomes ─────────────────────────────────────── */}
        <div className="border border-white/[0.08] rounded-2xl overflow-hidden">
          <button
            type="button"
            onClick={() => setShowCareer(v => !v)}
            className="w-full flex items-center justify-between px-5 py-4 bg-white/[0.02] hover:bg-white/[0.04] transition-colors"
          >
            <div className="flex items-center gap-3">
              <Briefcase className="w-4 h-4 text-gold-400/70" />
              <span className="font-body text-sm font-semibold text-white/70">Career Outcomes &amp; Internship</span>
              <span className="px-2 py-0.5 rounded-full bg-white/[0.06] border border-white/[0.09] text-white/35 font-body text-[10px] uppercase tracking-wider">Optional</span>
            </div>
            {showCareer ? <ChevronDown className="w-4 h-4 text-white/35" /> : <ChevronRight className="w-4 h-4 text-white/35" />}
          </button>

          {showCareer && (
            <div className="p-5 space-y-4 border-t border-white/[0.07]">
              <p className="text-white/35 font-body text-xs">
                Help students understand where this diploma can take them. All career fields are optional.
              </p>

              {/* Career outcomes */}
              <div>
                <label className={LABEL}>Career Outcomes <span className={OPT_HINT}>(one role per line)</span></label>
                <textarea
                  name="career_outcomes"
                  value={form.career_outcomes}
                  onChange={onChange}
                  rows={5}
                  placeholder={"Business Manager\nMarketing Executive\nOperations Analyst\nEntrepreneur"}
                  className={cn(INPUT, "resize-none")}
                />
              </div>

              {/* Industries */}
              <div>
                <label className={LABEL}>Industries <span className={OPT_HINT}>(comma-separated)</span></label>
                <input
                  name="industries"
                  type="text"
                  value={form.industries}
                  onChange={onChange}
                  placeholder="Finance, Consulting, Retail, Technology"
                  className={INPUT}
                />
              </div>

              {/* Internship */}
              <div className="p-4 rounded-xl bg-white/[0.03] border border-white/[0.07] space-y-4">
                <label className="flex items-center gap-3 cursor-pointer">
                  <div className={cn(
                    "w-10 h-6 rounded-full transition-colors flex-shrink-0 relative",
                    form.internship_available ? "bg-gold-500" : "bg-white/[0.10]"
                  )}>
                    <span className={cn(
                      "absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform",
                      form.internship_available ? "translate-x-5" : "translate-x-1"
                    )} />
                    <input
                      name="internship_available"
                      type="checkbox"
                      checked={form.internship_available}
                      onChange={onChange}
                      className="sr-only"
                    />
                  </div>
                  <span className="font-body text-sm text-white/70">Internship Included</span>
                </label>

                {form.internship_available && (
                  <div className="grid grid-cols-2 gap-4 pt-1">
                    <div>
                      <label className={LABEL}>Internship Duration (months)</label>
                      <input name="internship_duration_months" type="number" min={1} max={24} value={form.internship_duration_months} onChange={onChange} placeholder="6" className={INPUT} />
                    </div>
                    <div>
                      <label className={LABEL}>Est. Monthly Allowance (SGD)</label>
                      <input name="estimated_internship_allowance" type="number" min={0} step={50} value={form.estimated_internship_allowance} onChange={onChange} placeholder="1000" className={INPUT} />
                    </div>
                  </div>
                )}
              </div>

              {/* Pathway description */}
              <div>
                <label className={LABEL}>Study Pathway <span className={OPT_HINT}>(e.g. progression to degree)</span></label>
                <textarea
                  name="pathway_description"
                  value={form.pathway_description}
                  onChange={onChange}
                  rows={3}
                  placeholder="Graduates can progress to the Bachelor of Business at SIM University or transfer credits to an overseas partner institution…"
                  className={cn(INPUT, "resize-none")}
                />
              </div>

              {/* Job outlook */}
              <div>
                <label className={LABEL}>Job Outlook <span className={OPT_HINT}>(market context)</span></label>
                <textarea
                  name="job_outlook_description"
                  value={form.job_outlook_description}
                  onChange={onChange}
                  rows={3}
                  placeholder="Singapore's business sector employs over 500,000 professionals. Demand for business diploma holders grew 12% in 2024…"
                  className={cn(INPUT, "resize-none")}
                />
              </div>
            </div>
          )}
        </div>

        {/* ── Submit ────────────────────────────────────────────────────────── */}
        <div className="flex gap-3 pt-2">
          <GoldButton type="submit" variant="solid-gold" size="md" disabled={loading} className="flex items-center gap-2">
            {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Saving…</> : isEdit ? "Save Changes" : "Publish Course"}
          </GoldButton>
          <Link href="/dashboard/institution/courses">
            <GoldButton type="button" variant="ghost" size="md">Cancel</GoldButton>
          </Link>
        </div>
      </form>
    </div>
  );
}
