"use client";

import { useState, type FormEvent, type ChangeEvent } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import GoldButton from "@/components/ui/GoldButton";
import { Loader2, ArrowLeft } from "lucide-react";
import type { Course } from "@/types/courses";
import { COURSE_CATEGORIES } from "@/types/courses";
import Link from "next/link";

const INPUT = "w-full bg-white/[0.06] border border-white/[0.10] rounded-xl px-4 py-3 font-body text-sm text-white placeholder-white/25 focus:outline-none focus:border-gold-400/60 transition-all [&>option]:bg-navy-800";
const LABEL = "block text-white/55 font-body text-sm mb-1.5 font-medium";

interface CourseFormClientProps {
  collegeId:    string;
  collegeName:  string;
  course?:      Course | null;   // null = create mode
}

type FormState = {
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
};

function slugify(text: string): string {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

export default function CourseFormClient({ collegeId, collegeName, course }: CourseFormClientProps) {
  const router  = useRouter();
  const isEdit  = !!course;

  const [form, setForm] = useState<FormState>({
    title:           course?.title           ?? "",
    category:        course?.category        ?? "Business",
    description:     course?.description     ?? "",
    duration_months: String(course?.duration_months ?? 12),
    tuition_fee:     String(course?.tuition_fee      ?? ""),
    application_fee: String(course?.application_fee  ?? ""),
    intake_date:     course?.intake_date     ? course.intake_date.slice(0, 10) : "",
    seats_total:     String(course?.seats_total ?? 30),
    study_mode:      course?.study_mode      ?? "full_time",
    level:           course?.level           ?? "diploma",
    status:          course?.status          ?? "open",
  });

  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState<string | null>(null);

  const onChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setForm(p => ({ ...p, [e.target.name]: e.target.value }));

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const supabase = createClient();
      const payload = {
        college_id:      collegeId,
        title:           form.title.trim(),
        slug:            isEdit ? course!.slug : `${slugify(form.title)}-${Date.now().toString(36)}`,
        category:        form.category,
        description:     form.description.trim() || null,
        duration_months: parseInt(form.duration_months) || 12,
        tuition_fee:     parseFloat(form.tuition_fee) || 0,
        application_fee: parseFloat(form.application_fee) || 0,
        intake_date:     form.intake_date || null,
        seats_total:     parseInt(form.seats_total) || 30,
        study_mode:      form.study_mode,
        level:           form.level,
        status:          form.status,
      };

      if (isEdit) {
        console.log("[InstitutionPortal] updating course:", course!.id);
        const { error: updateError } = await supabase
          .from("courses").update(payload).eq("id", course!.id);
        if (updateError) throw new Error(updateError.message);
      } else {
        console.log("[InstitutionPortal] creating course for college:", collegeId);
        const { error: insertError } = await supabase
          .from("courses").insert(payload);
        if (insertError) throw new Error(insertError.message);
      }

      router.push("/dashboard/institution/courses");
      router.refresh();
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
      <div className="flex items-center gap-3 mb-6">
        <Link href="/dashboard/institution/courses" className="p-2 rounded-xl text-white/40 hover:text-white/70 hover:bg-white/[0.05] border border-transparent hover:border-white/[0.08] transition-all">
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div>
          <h2 className="font-display text-2xl text-white">{isEdit ? "Edit Course" : "New Course"}</h2>
          <p className="text-white/40 font-body text-sm">{collegeName}</p>
        </div>
      </div>

      <form onSubmit={onSubmit} method="POST" action="#" noValidate className="space-y-5">

        {error && (
          <div className="p-4 rounded-xl bg-red-500/10 border border-red-400/30 text-red-400 font-body text-sm">
            {error}
          </div>
        )}

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
              {COURSE_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label className={LABEL}>Level <span className="text-gold-400">*</span></label>
            <select name="level" value={form.level} onChange={onChange} className={INPUT}>
              <option value="diploma">Diploma</option>
              <option value="advanced_diploma">Advanced Diploma</option>
              <option value="graduate_diploma">Graduate Diploma</option>
              <option value="certificate">Certificate</option>
            </select>
          </div>
        </div>

        {/* Description */}
        <div>
          <label className={LABEL}>Description</label>
          <textarea name="description" value={form.description} onChange={onChange} rows={4} placeholder="Programme overview, key modules, career outcomes…" className={INPUT + " resize-none"} />
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
              <option value="full_time">Full-Time</option>
              <option value="part_time">Part-Time</option>
            </select>
          </div>
        </div>

        {/* Fees */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={LABEL}>Tuition Fee (SGD) <span className="text-gold-400">*</span></label>
            <input name="tuition_fee" type="number" min={0} step={50} value={form.tuition_fee} onChange={onChange} placeholder="6500" className={INPUT} />
          </div>
          <div>
            <label className={LABEL}>Application Fee (SGD)</label>
            <input name="application_fee" type="number" min={0} step={10} value={form.application_fee} onChange={onChange} placeholder="200" className={INPUT} />
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
            <option value="open">Open — accepting applications</option>
            <option value="draft">Draft — not visible to students</option>
            <option value="closed">Closed — intake full</option>
          </select>
        </div>

        {/* Submit */}
        <div className="flex gap-3 pt-2">
          <GoldButton type="submit" variant="solid-gold" size="md" disabled={loading} className="flex items-center gap-2">
            {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Saving…</> : isEdit ? "Save Changes" : "Create Course"}
          </GoldButton>
          <Link href="/dashboard/institution/courses">
            <GoldButton type="button" variant="ghost" size="md">Cancel</GoldButton>
          </Link>
        </div>
      </form>
    </div>
  );
}
