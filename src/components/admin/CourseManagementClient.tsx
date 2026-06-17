"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Plus, BookOpen, Pencil, Trash2, X, Save, Loader2,
  Search, ArchiveRestore, Archive, FileEdit, Eye, EyeOff,
} from "lucide-react";
import {
  COURSE_CATEGORIES,
  type CourseLevel, type CourseStatus, type CourseStudyMode,
} from "@/types/courses";

interface Course {
  id:              string;
  college_id:      string;
  title:           string;
  slug:            string;
  category:        string;
  description:     string | null;
  duration_months: number;
  tuition_fee:     number;
  application_fee: number;
  intake_date:     string | null;
  seats_total:     number;
  seats_filled:    number;
  study_mode:      CourseStudyMode;
  level:           CourseLevel;
  status:          CourseStatus;
  is_published:    boolean;
  created_at:      string;
}

interface CollegeOption { id: string; name: string; slug: string; is_active: boolean }

interface Props {
  courses:             Course[];
  colleges:            CollegeOption[];
  applicationCounts:   Record<string, number>;
  initialCollegeFilter: string;
}

const LEVELS:      { value: CourseLevel;     label: string }[] = [
  { value: "diploma",          label: "Diploma" },
  { value: "advanced_diploma", label: "Advanced Diploma" },
  { value: "graduate_diploma", label: "Graduate Diploma" },
  { value: "certificate",      label: "Certificate" },
];
const STUDY_MODES: { value: CourseStudyMode; label: string }[] = [
  { value: "full_time", label: "Full-time" },
  { value: "part_time", label: "Part-time" },
];
const STATUSES:    { value: CourseStatus;    label: string; color: string }[] = [
  { value: "open",   label: "Open",   color: "bg-emerald-500/10 border-emerald-400/30 text-emerald-400" },
  { value: "draft",  label: "Draft",  color: "bg-white/[0.05]  border-white/10        text-white/50"     },
  { value: "closed", label: "Closed", color: "bg-amber-500/10  border-amber-400/30    text-amber-400"    },
];

type FormValues = {
  college_id:      string;
  title:           string;
  slug:            string;
  category:        string;
  description:     string;
  level:           CourseLevel;
  study_mode:      CourseStudyMode;
  status:          CourseStatus;
  duration_months: string;
  tuition_fee:     string;
  application_fee: string;
  seats_total:     string;
  intake_date:     string;
};

const emptyForm = (collegeId: string): FormValues => ({
  college_id:      collegeId,
  title:           "",
  slug:            "",
  category:        "Business",
  description:     "",
  level:           "diploma",
  study_mode:      "full_time",
  status:          "draft",
  duration_months: "12",
  tuition_fee:     "0",
  application_fee: "0",
  seats_total:     "30",
  intake_date:     "",
});

function slugify(s: string) {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

const inputCls    = "w-full px-3 py-2.5 rounded-xl bg-white/[0.06] border border-white/[0.1] text-white placeholder-white/20 font-body text-sm focus:outline-none focus:border-gold-400/50 transition-colors [color-scheme:dark]";
const OPTION_STYLE = { backgroundColor: "#0a1024", color: "#fff" } as const;

export default function CourseManagementClient({
  courses: initial, colleges, applicationCounts, initialCollegeFilter,
}: Props) {
  const router = useRouter();

  const [courses,    setCourses]    = useState(initial);
  const [search,     setSearch]     = useState("");
  const [collegeFilter, setCollegeFilter] = useState(initialCollegeFilter);
  const [statusFilter,  setStatusFilter]  = useState<"" | CourseStatus>("");

  const [showForm,   setShowForm]   = useState(false);
  const [editId,     setEditId]     = useState<string | null>(null);
  const [form,       setForm]       = useState<FormValues>(emptyForm(""));
  const [saving,     setSaving]     = useState(false);
  const [error,      setError]      = useState<string | null>(null);
  const [busyId,     setBusyId]     = useState<string | null>(null);

  const collegeById = useMemo(() => {
    const m: Record<string, CollegeOption> = {};
    for (const c of colleges) m[c.id] = c;
    return m;
  }, [colleges]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return courses.filter(c => {
      if (collegeFilter && c.college_id !== collegeFilter) return false;
      if (statusFilter   && c.status     !== statusFilter)  return false;
      if (q) {
        const hay = `${c.title} ${c.slug} ${c.category}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [courses, search, collegeFilter, statusFilter]);

  const openAdd = () => {
    setForm(emptyForm(collegeFilter || colleges[0]?.id || ""));
    setEditId(null);
    setError(null);
    setShowForm(true);
  };

  const openEdit = (c: Course) => {
    setForm({
      college_id:      c.college_id,
      title:           c.title,
      slug:            c.slug,
      category:        c.category,
      description:     c.description ?? "",
      level:           c.level,
      study_mode:      c.study_mode,
      status:          c.status,
      duration_months: String(c.duration_months),
      tuition_fee:     String(c.tuition_fee),
      application_fee: String(c.application_fee),
      seats_total:     String(c.seats_total),
      intake_date:     c.intake_date ?? "",
    });
    setEditId(c.id);
    setError(null);
    setShowForm(true);
  };

  const setField = <K extends keyof FormValues>(field: K) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
      setForm(f => {
        const next = { ...f, [field]: e.target.value as FormValues[K] };
        if (field === "title" && !editId) next.slug = slugify(e.target.value);
        return next;
      });
    };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const payload = {
        college_id:      form.college_id,
        title:           form.title.trim(),
        slug:            form.slug.trim(),
        category:        form.category,
        description:     form.description.trim() || null,
        level:           form.level,
        study_mode:      form.study_mode,
        status:          form.status,
        duration_months: Number(form.duration_months),
        tuition_fee:     Number(form.tuition_fee),
        application_fee: Number(form.application_fee),
        seats_total:     Number(form.seats_total),
        intake_date:     form.intake_date || null,
      };

      const url    = editId ? `/api/courses/${editId}` : "/api/courses";
      const method = editId ? "PATCH" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json() as Course & { error?: string };
      if (!res.ok) throw new Error(data.error ?? "Failed to save");

      setCourses(cs => editId
        ? cs.map(c => c.id === editId ? data : c)
        : [data, ...cs]);
      setShowForm(false);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  const setStatus = async (course: Course, status: CourseStatus) => {
    setBusyId(course.id);
    try {
      const res = await fetch(`/api/courses/${course.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      const data = await res.json() as Course & { error?: string };
      if (!res.ok) throw new Error(data.error ?? "Failed to update");
      setCourses(cs => cs.map(c => c.id === course.id ? data : c));
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to update");
    } finally {
      setBusyId(null);
    }
  };

  const togglePublished = async (course: Course) => {
    setBusyId(course.id);
    try {
      const res = await fetch(`/api/courses/${course.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_published: !course.is_published }),
      });
      const data = await res.json() as Course & { error?: string };
      if (!res.ok) throw new Error(data.error ?? "Failed to update");
      setCourses(cs => cs.map(c => c.id === course.id ? data : c));
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to update");
    } finally {
      setBusyId(null);
    }
  };

  const handleDelete = async (course: Course) => {
    const apps = applicationCounts[course.id] ?? 0;
    if (apps > 0) {
      alert(`Cannot delete "${course.title}" — it has ${apps} application${apps !== 1 ? "s" : ""}. Archive it instead (set status to Closed).`);
      return;
    }
    if (!confirm(`Delete "${course.title}"? This cannot be undone.`)) return;
    setBusyId(course.id);
    try {
      const res = await fetch(`/api/courses/${course.id}`, { method: "DELETE" });
      const data = await res.json() as { error?: string };
      if (!res.ok) throw new Error(data.error ?? "Failed to delete");
      setCourses(cs => cs.filter(c => c.id !== course.id));
      router.refresh();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to delete");
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="space-y-4">

      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search courses…"
            className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-white/[0.06] border border-white/[0.1] text-white placeholder-white/30 font-body text-sm focus:outline-none focus:border-gold-400/50 transition-colors"
          />
        </div>

        <select
          value={collegeFilter}
          onChange={e => setCollegeFilter(e.target.value)}
          className="px-3 py-2.5 rounded-xl bg-white/[0.06] border border-white/[0.1] text-white font-body text-sm focus:outline-none focus:border-gold-400/50 transition-colors [color-scheme:dark]"
        >
          <option value="" style={OPTION_STYLE}>All colleges</option>
          {colleges.map(c => (
            <option key={c.id} value={c.id} style={OPTION_STYLE}>{c.name}</option>
          ))}
        </select>

        <select
          value={statusFilter}
          onChange={e => setStatusFilter(e.target.value as "" | CourseStatus)}
          className="px-3 py-2.5 rounded-xl bg-white/[0.06] border border-white/[0.1] text-white font-body text-sm focus:outline-none focus:border-gold-400/50 transition-colors [color-scheme:dark]"
        >
          <option value="" style={OPTION_STYLE}>All statuses</option>
          {STATUSES.map(s => <option key={s.value} value={s.value} style={OPTION_STYLE}>{s.label}</option>)}
        </select>

        <button
          onClick={openAdd}
          disabled={colleges.length === 0}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gold-400/15 border border-gold-400/30 text-gold-400 font-body text-sm font-semibold hover:bg-gold-400/25 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
          title={colleges.length === 0 ? "Add a college first" : "Add a new course"}
        >
          <Plus className="w-4 h-4" /> Add Course
        </button>
      </div>

      {/* Add/Edit form */}
      {showForm && (
        <form onSubmit={handleSave} className="p-5 rounded-2xl bg-white/[0.05] border border-gold-400/20 space-y-4">
          <div className="flex items-center justify-between mb-1">
            <p className="font-body text-sm font-semibold text-white/80">
              {editId ? "Edit Course" : "New Course"}
            </p>
            <button type="button" onClick={() => setShowForm(false)} className="text-white/30 hover:text-white/60 transition-colors">
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* College + Title */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-white/40 font-body text-[10px] uppercase tracking-wider mb-1.5">College *</label>
              <select
                value={form.college_id}
                onChange={setField("college_id")}
                required
                disabled={!!editId}
                className={inputCls}
                title={editId ? "College cannot be changed after creation" : undefined}
              >
                <option value="" style={OPTION_STYLE}>Select college…</option>
                {colleges.map(c => (
                  <option key={c.id} value={c.id} style={OPTION_STYLE}>{c.name}{c.is_active ? "" : " (inactive)"}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-white/40 font-body text-[10px] uppercase tracking-wider mb-1.5">Title *</label>
              <input value={form.title} onChange={setField("title")} required placeholder="e.g. Diploma in Business" className={inputCls} />
            </div>
          </div>

          {/* Slug + Category */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-white/40 font-body text-[10px] uppercase tracking-wider mb-1.5">Slug *</label>
              <input value={form.slug} onChange={setField("slug")} required placeholder="e.g. diploma-in-business" className={inputCls} />
            </div>
            <div>
              <label className="block text-white/40 font-body text-[10px] uppercase tracking-wider mb-1.5">Category *</label>
              <select value={form.category} onChange={setField("category")} className={inputCls}>
                {COURSE_CATEGORIES.map(c => <option key={c} value={c} style={OPTION_STYLE}>{c}</option>)}
              </select>
            </div>
          </div>

          {/* Level + Study mode + Status */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-white/40 font-body text-[10px] uppercase tracking-wider mb-1.5">Level</label>
              <select value={form.level} onChange={setField("level")} className={inputCls}>
                {LEVELS.map(l => <option key={l.value} value={l.value} style={OPTION_STYLE}>{l.label}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-white/40 font-body text-[10px] uppercase tracking-wider mb-1.5">Study Mode</label>
              <select value={form.study_mode} onChange={setField("study_mode")} className={inputCls}>
                {STUDY_MODES.map(s => <option key={s.value} value={s.value} style={OPTION_STYLE}>{s.label}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-white/40 font-body text-[10px] uppercase tracking-wider mb-1.5">Status</label>
              <select value={form.status} onChange={setField("status")} className={inputCls}>
                {STATUSES.map(s => <option key={s.value} value={s.value} style={OPTION_STYLE}>{s.label}</option>)}
              </select>
            </div>
          </div>

          {/* Duration + Fees + Seats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div>
              <label className="block text-white/40 font-body text-[10px] uppercase tracking-wider mb-1.5">Duration (months)</label>
              <input type="number" min={1} max={120} value={form.duration_months} onChange={setField("duration_months")} className={inputCls} />
            </div>
            <div>
              <label className="block text-white/40 font-body text-[10px] uppercase tracking-wider mb-1.5">Tuition Fee</label>
              <input type="number" min={0} step="0.01" value={form.tuition_fee} onChange={setField("tuition_fee")} className={inputCls} />
            </div>
            <div>
              <label className="block text-white/40 font-body text-[10px] uppercase tracking-wider mb-1.5">Application Fee</label>
              <input type="number" min={0} step="0.01" value={form.application_fee} onChange={setField("application_fee")} className={inputCls} />
            </div>
            <div>
              <label className="block text-white/40 font-body text-[10px] uppercase tracking-wider mb-1.5">Total Seats</label>
              <input type="number" min={1} value={form.seats_total} onChange={setField("seats_total")} className={inputCls} />
            </div>
          </div>

          {/* Intake date + Description */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-white/40 font-body text-[10px] uppercase tracking-wider mb-1.5">Intake Date</label>
              <input type="date" value={form.intake_date} onChange={setField("intake_date")} className={inputCls} />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-white/40 font-body text-[10px] uppercase tracking-wider mb-1.5">Description</label>
              <textarea
                value={form.description}
                onChange={setField("description")}
                rows={2}
                placeholder="Short description shown to students"
                className={`${inputCls} resize-none`}
              />
            </div>
          </div>

          {error && <p className="text-red-400 font-body text-xs">{error}</p>}

          <div className="flex items-center gap-2 pt-1">
            <button type="button" onClick={() => setShowForm(false)}
              className="px-4 py-2 rounded-xl border border-white/[0.1] text-white/50 font-body text-sm hover:text-white/70 transition-all">
              Cancel
            </button>
            <button type="submit" disabled={saving}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gold-400/15 border border-gold-400/30 text-gold-400 font-body text-sm font-semibold hover:bg-gold-400/25 transition-all disabled:opacity-50">
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              {saving ? "Saving…" : "Save"}
            </button>
          </div>
        </form>
      )}

      {/* Empty state */}
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center py-16 rounded-2xl bg-white/[0.03] border border-white/[0.07] text-white/25">
          <BookOpen className="w-10 h-10 mb-3" />
          <p className="font-body text-sm">
            {courses.length === 0 ? "No courses yet — add the first one above" : "No courses match these filters"}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {filtered.map(course => {
            const status   = STATUSES.find(s => s.value === course.status);
            const apps     = applicationCounts[course.id] ?? 0;
            const college  = collegeById[course.college_id];
            return (
              <div key={course.id} className={`p-5 rounded-2xl border space-y-3 ${course.status === "closed" ? "bg-white/[0.02] border-white/[0.05] opacity-75" : "bg-white/[0.04] border-white/[0.08]"}`}>
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-body font-semibold text-sm text-white/90 leading-snug truncate">{course.title}</p>
                    <p className="text-white/35 font-body text-xs mt-0.5 truncate">
                      {college?.name ?? "Unknown college"} · {course.category}
                    </p>
                  </div>
                  <div className="flex flex-col items-end gap-1 flex-shrink-0">
                    {status && (
                      <span className={`px-2 py-0.5 rounded-full border font-body text-[10px] font-semibold ${status.color}`}>
                        {status.label}
                      </span>
                    )}
                    <span className={`px-2 py-0.5 rounded-full border font-body text-[10px] font-semibold ${
                      course.is_published
                        ? "bg-pathBlue-500/10 border-pathBlue-400/30 text-pathBlue-400"
                        : "bg-white/[0.04] border-white/[0.07] text-white/25"
                    }`}>
                      {course.is_published ? "Published" : "Unpublished"}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2 text-white/50 font-body text-[11px]">
                  <div>
                    <p className="text-white/30 uppercase tracking-wider text-[9px] mb-0.5">Duration</p>
                    <p>{course.duration_months} mo</p>
                  </div>
                  <div>
                    <p className="text-white/30 uppercase tracking-wider text-[9px] mb-0.5">Tuition</p>
                    <p>${course.tuition_fee.toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-white/30 uppercase tracking-wider text-[9px] mb-0.5">Seats</p>
                    <p>{course.seats_filled}/{course.seats_total}</p>
                  </div>
                </div>

                <div className="flex items-center justify-between text-white/40 font-body text-[11px]">
                  <span>
                    {LEVELS.find(l => l.value === course.level)?.label ?? course.level}
                    {" · "}
                    {STUDY_MODES.find(s => s.value === course.study_mode)?.label ?? course.study_mode}
                  </span>
                  <span>{apps} application{apps !== 1 ? "s" : ""}</span>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 pt-1 border-t border-white/[0.06]">
                  <button
                    onClick={() => openEdit(course)}
                    className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-white/[0.1] text-white/45 font-body text-xs hover:text-white/70 hover:border-white/20 transition-all"
                  >
                    <Pencil className="w-3 h-3" /> Edit
                  </button>
                  {course.status === "open" ? (
                    <button
                      onClick={() => {
                        if (confirm(`Archive "${course.title}"? Students won't be able to apply until it's reopened.`)) {
                          setStatus(course, "closed");
                        }
                      }}
                      disabled={busyId === course.id}
                      className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-white/[0.1] text-white/45 font-body text-xs hover:text-amber-400 hover:border-amber-400/25 transition-all disabled:opacity-50"
                    >
                      {busyId === course.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <Archive className="w-3 h-3" />}
                      Archive
                    </button>
                  ) : course.status === "closed" ? (
                    <button
                      onClick={() => setStatus(course, "open")}
                      disabled={busyId === course.id}
                      className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-emerald-400/20 text-emerald-400/70 font-body text-xs hover:text-emerald-400 transition-all disabled:opacity-50"
                    >
                      {busyId === course.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <ArchiveRestore className="w-3 h-3" />}
                      Reopen
                    </button>
                  ) : (
                    <button
                      onClick={() => setStatus(course, "open")}
                      disabled={busyId === course.id}
                      className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-emerald-400/20 text-emerald-400/70 font-body text-xs hover:text-emerald-400 transition-all disabled:opacity-50"
                    >
                      {busyId === course.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <FileEdit className="w-3 h-3" />}
                      Publish
                    </button>
                  )}
                  <button
                    onClick={() => togglePublished(course)}
                    disabled={busyId === course.id}
                    className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border font-body text-xs transition-all disabled:opacity-50 ${
                      course.is_published
                        ? "border-white/[0.1] text-white/45 hover:text-amber-400 hover:border-amber-400/25"
                        : "border-pathBlue-400/20 text-pathBlue-400/60 hover:text-pathBlue-400"
                    }`}
                  >
                    {busyId === course.id ? <Loader2 className="w-3 h-3 animate-spin" /> : course.is_published ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                    {course.is_published ? "Unpublish" : "Publish"}
                  </button>
                  <button
                    onClick={() => handleDelete(course)}
                    disabled={busyId === course.id}
                    className="ml-auto flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-white/[0.08] text-white/20 font-body text-xs hover:border-red-400/20 hover:text-red-400/50 transition-all disabled:opacity-50"
                  >
                    <Trash2 className="w-3 h-3" /> Delete
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
