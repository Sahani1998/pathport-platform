"use client";

import { useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { AlertCircle, Loader2, Plus, Trash2, ChevronDown, ChevronUp } from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

export type SectionStatus = "draft" | "published" | "archived";

export interface DurationGuideData {
  level_label?: string;
  full_time?: string;
  part_time?: string;
  internship?: string;
  [key: string]: string | undefined;
}

export interface PageSection {
  id: string;
  section_key: string;
  item_key: string;
  data: DurationGuideData;
  display_order: number;
  status: SectionStatus;
  created_at: string;
  updated_at: string;
}

interface EditForm {
  item_key: string;
  level_label: string;
  full_time: string;
  part_time: string;
  internship: string;
  display_order: number;
  status: SectionStatus;
}

const EMPTY_FORM: EditForm = {
  item_key: "",
  level_label: "",
  full_time: "",
  part_time: "",
  internship: "",
  display_order: 0,
  status: "published",
};

// ─── Status helpers ───────────────────────────────────────────────────────────

const STATUS_CYCLE: SectionStatus[] = ["published", "draft", "archived"];

const STATUS_META: Record<SectionStatus, string> = {
  published: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
  draft:     "bg-gold-400/15 text-gold-400 border-gold-400/30",
  archived:  "bg-white/[0.06] text-white/40 border-white/[0.08]",
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function rowToForm(row: PageSection): EditForm {
  return {
    item_key:      row.item_key,
    level_label:   row.data.level_label ?? "",
    full_time:     row.data.full_time ?? "",
    part_time:     row.data.part_time ?? "",
    internship:    row.data.internship ?? "",
    display_order: row.display_order,
    status:        row.status,
  };
}

function formToData(form: EditForm): DurationGuideData {
  return {
    level_label: form.level_label,
    full_time:   form.full_time,
    part_time:   form.part_time,
    internship:  form.internship,
  };
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function DurationGuideClient({ initialRows }: { initialRows: PageSection[] }) {
  const [rows,        setRows]        = useState<PageSection[]>(initialRows);
  const [loading,     setLoading]     = useState(false);
  const [error,       setError]       = useState<string | null>(null);
  const [expandedId,  setExpandedId]  = useState<string | null>(null);
  const [editForm,    setEditForm]    = useState<EditForm>(EMPTY_FORM);
  const [showAddForm, setShowAddForm] = useState(false);
  const [addForm,     setAddForm]     = useState<EditForm>(EMPTY_FORM);
  const [saving,      setSaving]      = useState(false);
  const [savingAdd,   setSavingAdd]   = useState(false);
  const [toggling,    setToggling]    = useState<string | null>(null);
  const [deleting,    setDeleting]    = useState<string | null>(null);

  const fetchRows = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const supabase = createClient();
      const { data, error: fetchError } = await supabase
        .from("public_page_sections")
        .select("*")
        .eq("section_key", "duration_guide")
        .order("display_order", { ascending: true });

      if (fetchError) {
        if (fetchError.code === "42P01") {
          setError("Table not found. Run the migration in Supabase SQL Editor.");
        } else {
          setError(`Query failed: ${fetchError.message} (${fetchError.code})`);
        }
      } else {
        setRows((data ?? []) as PageSection[]);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setError(`Unexpected error: ${msg}`);
    } finally {
      setLoading(false);
    }
  }, []);

  // ── Expand row ─────────────────────────────────────────────────────────────
  const handleExpandRow = (row: PageSection) => {
    if (expandedId === row.id) {
      setExpandedId(null);
      return;
    }
    setExpandedId(row.id);
    setEditForm(rowToForm(row));
  };

  // ── Save edit ──────────────────────────────────────────────────────────────
  const handleSaveEdit = async (id: string) => {
    setSaving(true);
    try {
      const supabase = createClient();
      const { error: updateError } = await supabase
        .from("public_page_sections")
        .update({
          item_key:      editForm.item_key,
          data:          formToData(editForm),
          display_order: editForm.display_order,
          status:        editForm.status,
        })
        .eq("id", id);

      if (updateError) {
        console.error("[DurationGuide] update error:", updateError.message);
      } else {
        setExpandedId(null);
        await fetchRows();
      }
    } catch (err) {
      console.error("[DurationGuide] update exception:", err);
    } finally {
      setSaving(false);
    }
  };

  // ── Toggle status ──────────────────────────────────────────────────────────
  const handleToggleStatus = async (row: PageSection) => {
    setToggling(row.id);
    try {
      const supabase = createClient();
      const currentIdx = STATUS_CYCLE.indexOf(row.status);
      const nextStatus = STATUS_CYCLE[(currentIdx + 1) % STATUS_CYCLE.length];

      const { error: updateError } = await supabase
        .from("public_page_sections")
        .update({ status: nextStatus })
        .eq("id", row.id);

      if (updateError) {
        console.error("[DurationGuide] toggle status error:", updateError.message);
      } else {
        await fetchRows();
      }
    } catch (err) {
      console.error("[DurationGuide] toggle status exception:", err);
    } finally {
      setToggling(null);
    }
  };

  // ── Add new ────────────────────────────────────────────────────────────────
  const handleAdd = async () => {
    setSavingAdd(true);
    try {
      const supabase = createClient();
      const { error: insertError } = await supabase
        .from("public_page_sections")
        .insert({
          section_key:   "duration_guide",
          item_key:      addForm.item_key,
          data:          formToData(addForm),
          display_order: addForm.display_order,
          status:        addForm.status,
        });

      if (insertError) {
        console.error("[DurationGuide] insert error:", insertError.message);
      } else {
        setShowAddForm(false);
        setAddForm(EMPTY_FORM);
        await fetchRows();
      }
    } catch (err) {
      console.error("[DurationGuide] insert exception:", err);
    } finally {
      setSavingAdd(false);
    }
  };

  // ── Delete ─────────────────────────────────────────────────────────────────
  const handleDelete = async (id: string, itemKey: string) => {
    if (!window.confirm(`Delete duration guide row "${itemKey}"? This cannot be undone.`)) return;
    setDeleting(id);
    try {
      const supabase = createClient();
      const { error: deleteError } = await supabase
        .from("public_page_sections")
        .delete()
        .eq("id", id);

      if (deleteError) {
        console.error("[DurationGuide] delete error:", deleteError.message);
      } else {
        await fetchRows();
      }
    } catch (err) {
      console.error("[DurationGuide] delete exception:", err);
    } finally {
      setDeleting(null);
    }
  };

  const inputCls = "w-full bg-white/[0.05] border border-white/[0.09] rounded-xl px-3 py-2 font-body text-sm text-white placeholder-white/25 focus:outline-none focus:border-gold-400/50 transition-all";
  const btnPrimary = "px-3.5 py-2 rounded-xl bg-gold-500/20 border border-gold-400/40 text-gold-300 font-body text-xs font-semibold hover:bg-gold-500/30 transition-all";
  const btnSecondary = "px-3.5 py-2 rounded-xl bg-white/[0.04] border border-white/[0.08] text-white/55 hover:text-white/80 font-body text-xs transition-all";
  const btnDanger = "px-3.5 py-2 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500/20 font-body text-xs transition-all";

  const FormFields = ({ form, setForm }: { form: EditForm; setForm: React.Dispatch<React.SetStateAction<EditForm>> }) => (
    <div className="grid grid-cols-2 gap-3">
      <div>
        <label className="block font-body text-xs text-white/40 mb-1">Item key * (unique within section)</label>
        <input type="text" value={form.item_key} onChange={e => setForm(f => ({ ...f, item_key: e.target.value }))} placeholder="e.g. diploma" className={inputCls} />
      </div>
      <div>
        <label className="block font-body text-xs text-white/40 mb-1">Level label *</label>
        <input type="text" value={form.level_label} onChange={e => setForm(f => ({ ...f, level_label: e.target.value }))} placeholder="e.g. Diploma" className={inputCls} />
      </div>
      <div>
        <label className="block font-body text-xs text-white/40 mb-1">Full time duration *</label>
        <input type="text" value={form.full_time} onChange={e => setForm(f => ({ ...f, full_time: e.target.value }))} placeholder="e.g. 12 – 18 months" className={inputCls} />
      </div>
      <div>
        <label className="block font-body text-xs text-white/40 mb-1">Part time duration *</label>
        <input type="text" value={form.part_time} onChange={e => setForm(f => ({ ...f, part_time: e.target.value }))} placeholder="e.g. 18 – 24 months" className={inputCls} />
      </div>
      <div>
        <label className="block font-body text-xs text-white/40 mb-1">Internship *</label>
        <input type="text" value={form.internship} onChange={e => setForm(f => ({ ...f, internship: e.target.value }))} placeholder="e.g. Optional, structured" className={inputCls} />
      </div>
      <div>
        <label className="block font-body text-xs text-white/40 mb-1">Display order</label>
        <input type="number" value={form.display_order} onChange={e => setForm(f => ({ ...f, display_order: Number(e.target.value) }))} className={inputCls} />
      </div>
      <div>
        <label className="block font-body text-xs text-white/40 mb-1">Status</label>
        <select value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value as SectionStatus }))} className={cn(inputCls, "[&>option]:bg-[#0D1530]")}>
          <option value="published">Published</option>
          <option value="draft">Draft</option>
          <option value="archived">Archived</option>
        </select>
      </div>
    </div>
  );

  return (
    <div className="space-y-6 max-w-7xl">

      {/* ── Back link ────────────────────────────────────────────────── */}
      <Link
        href="/dashboard/admin/public-content"
        className="inline-flex items-center gap-1.5 text-white/40 hover:text-white/70 font-body text-sm transition-colors"
      >
        ← Public Content
      </Link>

      {/* ── Page header ─────────────────────────────────────────────── */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h2 className="font-display text-3xl text-white mb-1">Duration Guide</h2>
          <p className="text-white/45 font-body text-sm">
            {rows.length} rows · section_key = &apos;duration_guide&apos; in public_page_sections
          </p>
        </div>
        <button
          onClick={() => { setShowAddForm(true); setAddForm(EMPTY_FORM); }}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white/[0.05] border border-white/[0.09] text-white/55 hover:text-white/80 hover:border-white/20 font-body text-sm transition-all"
        >
          <Plus className="w-3.5 h-3.5" />
          Add Row
        </button>
      </div>

      {/* ── Error banner ────────────────────────────────────────────── */}
      {error && (
        <div className="flex items-start gap-3 p-5 rounded-2xl bg-gold-400/[0.07] border border-gold-400/25">
          <AlertCircle className="w-5 h-5 text-gold-400 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-white/75 font-body text-sm font-semibold mb-1">Table not set up</p>
            <p className="text-white/50 font-body text-sm">{error}</p>
            <p className="text-white/40 font-body text-xs mt-2">
              File:{" "}
              <code className="text-gold-300">src/lib/supabase/sprint31_public_content.sql</code>
            </p>
          </div>
        </div>
      )}

      {/* ── Add new form ─────────────────────────────────────────────── */}
      {showAddForm && (
        <div className="bg-white/[0.03] border border-white/[0.07] rounded-2xl p-5 space-y-4">
          <p className="font-body text-sm font-semibold text-white/70 mb-2">New Duration Guide Row</p>
          <FormFields form={addForm} setForm={setAddForm} />
          <div className="flex gap-2 pt-1">
            <button onClick={handleAdd} disabled={savingAdd || !addForm.item_key} className={cn(btnPrimary, "disabled:opacity-50")}>
              {savingAdd ? "Saving…" : "Save"}
            </button>
            <button onClick={() => { setShowAddForm(false); setAddForm(EMPTY_FORM); }} className={btnSecondary}>
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* ── Table ───────────────────────────────────────────────────── */}
      <div className="bg-white/[0.03] border border-white/[0.07] rounded-2xl overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-20 gap-3 text-white/35">
            <Loader2 className="w-5 h-5 animate-spin" />
            <span className="font-body text-sm">Refreshing duration guide rows…</span>
          </div>
        ) : rows.length === 0 && !error ? (
          <div className="flex flex-col items-center justify-center py-16 text-white/25">
            <p className="font-body text-sm">No duration guide rows yet. Add one above.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/[0.07]">
                  {["Order", "Item key", "Level label", "Full time", "Part time", "Internship", "Status", "Actions"].map(h => (
                    <th key={h} className="text-left px-4 py-3.5 text-white/30 font-body text-xs uppercase tracking-wider whitespace-nowrap">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <>
                    <tr
                      key={row.id}
                      className="border-b border-white/[0.04] hover:bg-white/[0.02] transition-colors cursor-pointer"
                      onClick={() => handleExpandRow(row)}
                    >
                      <td className="px-4 py-4">
                        <p className="font-body text-sm text-white/45">{row.display_order}</p>
                      </td>
                      <td className="px-4 py-4">
                        <p className="font-body font-semibold text-sm text-white/90">{row.item_key}</p>
                      </td>
                      <td className="px-4 py-4">
                        <p className="font-body text-sm text-white/70">{row.data.level_label ?? "—"}</p>
                      </td>
                      <td className="px-4 py-4">
                        <p className="font-body text-xs text-white/55 whitespace-nowrap">{row.data.full_time ?? "—"}</p>
                      </td>
                      <td className="px-4 py-4">
                        <p className="font-body text-xs text-white/55 whitespace-nowrap">{row.data.part_time ?? "—"}</p>
                      </td>
                      <td className="px-4 py-4">
                        <p className="font-body text-xs text-white/45">{row.data.internship ?? "—"}</p>
                      </td>
                      <td className="px-4 py-4">
                        <button
                          onClick={e => { e.stopPropagation(); handleToggleStatus(row); }}
                          disabled={toggling === row.id}
                          className={cn(
                            "px-2.5 py-0.5 rounded-full border font-body text-xs font-semibold transition-all hover:opacity-80",
                            STATUS_META[row.status]
                          )}
                        >
                          {toggling === row.id ? "…" : row.status}
                        </button>
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-2" onClick={e => e.stopPropagation()}>
                          <button
                            onClick={() => handleExpandRow(row)}
                            className="p-1.5 rounded-lg bg-white/[0.04] border border-white/[0.08] text-white/40 hover:text-white/70 transition-all"
                          >
                            {expandedId === row.id ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                          </button>
                          <button
                            onClick={() => handleDelete(row.id, row.item_key)}
                            disabled={deleting === row.id}
                            className="p-1.5 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500/20 transition-all disabled:opacity-50"
                          >
                            {deleting === row.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                          </button>
                        </div>
                      </td>
                    </tr>

                    {/* Inline edit form */}
                    {expandedId === row.id && (
                      <tr key={row.id + "_edit"} className="border-b border-white/[0.04] bg-white/[0.02]">
                        <td colSpan={8} className="px-4 py-4">
                          <div className="space-y-3">
                            <p className="font-body text-xs font-semibold text-white/50 mb-3">Edit Duration Guide Row</p>
                            <FormFields form={editForm} setForm={setEditForm} />
                            <div className="flex gap-2 pt-1">
                              <button onClick={() => handleSaveEdit(row.id)} disabled={saving} className={cn(btnPrimary, "disabled:opacity-50")}>
                                {saving ? "Saving…" : "Save changes"}
                              </button>
                              <button onClick={() => setExpandedId(null)} className={btnSecondary}>
                                Cancel
                              </button>
                              <button onClick={() => handleDelete(row.id, row.item_key)} disabled={deleting === row.id} className={btnDanger}>
                                Delete
                              </button>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {rows.length > 0 && (
          <div className="px-4 py-3 border-t border-white/[0.06] text-white/28 font-body text-xs">
            {rows.length} duration guide rows
          </div>
        )}
      </div>
    </div>
  );
}
