"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { AlertCircle, Loader2, Plus, Trash2, ChevronDown, ChevronUp } from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

type CardStatus = "draft" | "published" | "archived";

interface PathwayCard {
  id: string;
  icon_name: string;
  level: string;
  badge: string;
  what_it_is: string;
  who_its_for: string;
  typical_duration: string;
  subjects: string[];
  whats_next: string;
  filter_param: string;
  display_order: number;
  status: CardStatus;
  created_at: string;
  updated_at: string;
}

interface EditForm {
  icon_name: string;
  level: string;
  badge: string;
  what_it_is: string;
  who_its_for: string;
  typical_duration: string;
  subjects_text: string; // one per line
  whats_next: string;
  filter_param: string;
  display_order: number;
  status: CardStatus;
}

const EMPTY_FORM: EditForm = {
  icon_name: "BookOpen",
  level: "",
  badge: "",
  what_it_is: "",
  who_its_for: "",
  typical_duration: "",
  subjects_text: "",
  whats_next: "",
  filter_param: "",
  display_order: 0,
  status: "published",
};

const ICON_OPTIONS = ["BookOpen", "Award", "GraduationCap", "Star", "Briefcase", "Code"];

// ─── Status helpers ───────────────────────────────────────────────────────────

const STATUS_CYCLE: CardStatus[] = ["published", "draft", "archived"];

const STATUS_META: Record<CardStatus, string> = {
  published: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
  draft:     "bg-gold-400/15 text-gold-400 border-gold-400/30",
  archived:  "bg-white/[0.06] text-white/40 border-white/[0.08]",
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function subjectsToText(subjects: string[] | unknown): string {
  if (!Array.isArray(subjects)) return "";
  return subjects.join("\n");
}

function textToSubjects(text: string): string[] {
  return text.split("\n").map(s => s.trim()).filter(Boolean);
}

function rowToForm(row: PathwayCard): EditForm {
  return {
    icon_name:        row.icon_name,
    level:            row.level,
    badge:            row.badge,
    what_it_is:       row.what_it_is,
    who_its_for:      row.who_its_for,
    typical_duration: row.typical_duration,
    subjects_text:    subjectsToText(row.subjects),
    whats_next:       row.whats_next,
    filter_param:     row.filter_param,
    display_order:    row.display_order,
    status:           row.status,
  };
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function PathwayCardsPage() {
  const [rows,        setRows]        = useState<PathwayCard[]>([]);
  const [loading,     setLoading]     = useState(true);
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
      console.log("[PathwayCards] querying public_pathway_cards…");

      const { data, error: fetchError } = await supabase
        .from("public_pathway_cards")
        .select("*")
        .order("display_order", { ascending: true });

      console.log(
        "[PathwayCards] result — rows:", data?.length ?? 0,
        "| error code:", fetchError?.code ?? "none",
        "| error msg:", fetchError?.message ?? "none"
      );

      if (fetchError) {
        if (fetchError.code === "42P01") {
          setError("Table not found. Run the migration in Supabase SQL Editor.");
        } else {
          setError(`Query failed: ${fetchError.message} (${fetchError.code})`);
        }
      } else {
        setRows((data ?? []) as PathwayCard[]);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error("[PathwayCards] unexpected exception:", msg);
      setError(`Unexpected error: ${msg}`);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchRows(); }, [fetchRows]);

  // ── Expand row ─────────────────────────────────────────────────────────────
  const handleExpandRow = (row: PathwayCard) => {
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
        .from("public_pathway_cards")
        .update({
          icon_name:        editForm.icon_name,
          level:            editForm.level,
          badge:            editForm.badge,
          what_it_is:       editForm.what_it_is,
          who_its_for:      editForm.who_its_for,
          typical_duration: editForm.typical_duration,
          subjects:         textToSubjects(editForm.subjects_text),
          whats_next:       editForm.whats_next,
          filter_param:     editForm.filter_param,
          display_order:    editForm.display_order,
          status:           editForm.status,
        })
        .eq("id", id);

      if (updateError) {
        console.error("[PathwayCards] update error:", updateError.message);
      } else {
        setExpandedId(null);
        await fetchRows();
      }
    } catch (err) {
      console.error("[PathwayCards] update exception:", err);
    } finally {
      setSaving(false);
    }
  };

  // ── Toggle status ──────────────────────────────────────────────────────────
  const handleToggleStatus = async (row: PathwayCard) => {
    setToggling(row.id);
    try {
      const supabase = createClient();
      const currentIdx = STATUS_CYCLE.indexOf(row.status);
      const nextStatus = STATUS_CYCLE[(currentIdx + 1) % STATUS_CYCLE.length];

      const { error: updateError } = await supabase
        .from("public_pathway_cards")
        .update({ status: nextStatus })
        .eq("id", row.id);

      if (updateError) {
        console.error("[PathwayCards] toggle status error:", updateError.message);
      } else {
        await fetchRows();
      }
    } catch (err) {
      console.error("[PathwayCards] toggle status exception:", err);
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
        .from("public_pathway_cards")
        .insert({
          icon_name:        addForm.icon_name,
          level:            addForm.level,
          badge:            addForm.badge,
          what_it_is:       addForm.what_it_is,
          who_its_for:      addForm.who_its_for,
          typical_duration: addForm.typical_duration,
          subjects:         textToSubjects(addForm.subjects_text),
          whats_next:       addForm.whats_next,
          filter_param:     addForm.filter_param,
          display_order:    addForm.display_order,
          status:           addForm.status,
        });

      if (insertError) {
        console.error("[PathwayCards] insert error:", insertError.message);
      } else {
        setShowAddForm(false);
        setAddForm(EMPTY_FORM);
        await fetchRows();
      }
    } catch (err) {
      console.error("[PathwayCards] insert exception:", err);
    } finally {
      setSavingAdd(false);
    }
  };

  // ── Delete ─────────────────────────────────────────────────────────────────
  const handleDelete = async (id: string, level: string) => {
    if (!window.confirm(`Delete pathway card "${level}"? This cannot be undone.`)) return;
    setDeleting(id);
    try {
      const supabase = createClient();
      const { error: deleteError } = await supabase
        .from("public_pathway_cards")
        .delete()
        .eq("id", id);

      if (deleteError) {
        console.error("[PathwayCards] delete error:", deleteError.message);
      } else {
        await fetchRows();
      }
    } catch (err) {
      console.error("[PathwayCards] delete exception:", err);
    } finally {
      setDeleting(null);
    }
  };

  const inputCls = "w-full bg-white/[0.05] border border-white/[0.09] rounded-xl px-3 py-2 font-body text-sm text-white placeholder-white/25 focus:outline-none focus:border-gold-400/50 transition-all";
  const textareaCls = cn(inputCls, "resize-y min-h-[80px]");
  const btnPrimary = "px-3.5 py-2 rounded-xl bg-gold-500/20 border border-gold-400/40 text-gold-300 font-body text-xs font-semibold hover:bg-gold-500/30 transition-all";
  const btnSecondary = "px-3.5 py-2 rounded-xl bg-white/[0.04] border border-white/[0.08] text-white/55 hover:text-white/80 font-body text-xs transition-all";
  const btnDanger = "px-3.5 py-2 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500/20 font-body text-xs transition-all";

  const EditFormFields = ({ form, setForm }: { form: EditForm; setForm: React.Dispatch<React.SetStateAction<EditForm>> }) => (
    <div className="grid grid-cols-2 gap-3">
      <div>
        <label className="block font-body text-xs text-white/40 mb-1">Icon</label>
        <select value={form.icon_name} onChange={e => setForm(f => ({ ...f, icon_name: e.target.value }))} className={cn(inputCls, "[&>option]:bg-[#0D1530]")}>
          {ICON_OPTIONS.map(icon => <option key={icon} value={icon}>{icon}</option>)}
        </select>
      </div>
      <div>
        <label className="block font-body text-xs text-white/40 mb-1">Level *</label>
        <input type="text" value={form.level} onChange={e => setForm(f => ({ ...f, level: e.target.value }))} placeholder="e.g. Diploma" className={inputCls} />
      </div>
      <div>
        <label className="block font-body text-xs text-white/40 mb-1">Badge *</label>
        <input type="text" value={form.badge} onChange={e => setForm(f => ({ ...f, badge: e.target.value }))} placeholder="e.g. Foundation" className={inputCls} />
      </div>
      <div>
        <label className="block font-body text-xs text-white/40 mb-1">Typical duration *</label>
        <input type="text" value={form.typical_duration} onChange={e => setForm(f => ({ ...f, typical_duration: e.target.value }))} placeholder="e.g. 12–18 months typical" className={inputCls} />
      </div>
      <div>
        <label className="block font-body text-xs text-white/40 mb-1">Filter param *</label>
        <input type="text" value={form.filter_param} onChange={e => setForm(f => ({ ...f, filter_param: e.target.value }))} placeholder="e.g. diploma" className={inputCls} />
      </div>
      <div>
        <label className="block font-body text-xs text-white/40 mb-1">Display order</label>
        <input type="number" value={form.display_order} onChange={e => setForm(f => ({ ...f, display_order: Number(e.target.value) }))} className={inputCls} />
      </div>
      <div className="col-span-2">
        <label className="block font-body text-xs text-white/40 mb-1">What it is *</label>
        <textarea value={form.what_it_is} onChange={e => setForm(f => ({ ...f, what_it_is: e.target.value }))} placeholder="Describe the qualification…" className={textareaCls} />
      </div>
      <div className="col-span-2">
        <label className="block font-body text-xs text-white/40 mb-1">Who it's for *</label>
        <textarea value={form.who_its_for} onChange={e => setForm(f => ({ ...f, who_its_for: e.target.value }))} placeholder="Who this qualification suits…" className={textareaCls} />
      </div>
      <div className="col-span-2">
        <label className="block font-body text-xs text-white/40 mb-1">Subjects (one per line)</label>
        <textarea value={form.subjects_text} onChange={e => setForm(f => ({ ...f, subjects_text: e.target.value }))} placeholder={"Business Administration\nInformation Technology\nHospitality Management"} className={textareaCls} />
      </div>
      <div className="col-span-2">
        <label className="block font-body text-xs text-white/40 mb-1">What's next *</label>
        <textarea value={form.whats_next} onChange={e => setForm(f => ({ ...f, whats_next: e.target.value }))} placeholder="Next steps after this qualification…" className={textareaCls} />
      </div>
      <div>
        <label className="block font-body text-xs text-white/40 mb-1">Status</label>
        <select value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value as CardStatus }))} className={cn(inputCls, "[&>option]:bg-[#0D1530]")}>
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
          <h2 className="font-display text-3xl text-white mb-1">Pathway Cards</h2>
          <p className="text-white/45 font-body text-sm">
            {rows.length} cards · shown on the /courses DiplomaTypesExplained section
          </p>
        </div>
        <button
          onClick={() => { setShowAddForm(true); setAddForm(EMPTY_FORM); }}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white/[0.05] border border-white/[0.09] text-white/55 hover:text-white/80 hover:border-white/20 font-body text-sm transition-all"
        >
          <Plus className="w-3.5 h-3.5" />
          Add Card
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
          <p className="font-body text-sm font-semibold text-white/70 mb-2">New Pathway Card</p>
          <EditFormFields form={addForm} setForm={setAddForm} />
          <div className="flex gap-2 pt-1">
            <button onClick={handleAdd} disabled={savingAdd || !addForm.level} className={cn(btnPrimary, "disabled:opacity-50")}>
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
            <span className="font-body text-sm">Loading pathway cards…</span>
          </div>
        ) : rows.length === 0 && !error ? (
          <div className="flex flex-col items-center justify-center py-16 text-white/25">
            <p className="font-body text-sm">No pathway cards yet. Add one above.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/[0.07]">
                  {["Order", "Icon", "Level", "Badge", "Duration", "Filter param", "Status", "Actions"].map(h => (
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
                        <p className="font-body text-xs text-white/55">{row.icon_name}</p>
                      </td>
                      <td className="px-4 py-4">
                        <p className="font-body font-semibold text-sm text-white/90">{row.level}</p>
                      </td>
                      <td className="px-4 py-4">
                        <p className="font-body text-xs text-white/55">{row.badge}</p>
                      </td>
                      <td className="px-4 py-4">
                        <p className="font-body text-xs text-white/55 whitespace-nowrap">{row.typical_duration}</p>
                      </td>
                      <td className="px-4 py-4">
                        <p className="font-body text-xs text-white/45">{row.filter_param}</p>
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
                            onClick={() => handleDelete(row.id, row.level)}
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
                            <p className="font-body text-xs font-semibold text-white/50 mb-3">Edit Pathway Card</p>
                            <EditFormFields form={editForm} setForm={setEditForm} />
                            <div className="flex gap-2 pt-1">
                              <button onClick={() => handleSaveEdit(row.id)} disabled={saving} className={cn(btnPrimary, "disabled:opacity-50")}>
                                {saving ? "Saving…" : "Save changes"}
                              </button>
                              <button onClick={() => setExpandedId(null)} className={btnSecondary}>
                                Cancel
                              </button>
                              <button onClick={() => handleDelete(row.id, row.level)} disabled={deleting === row.id} className={btnDanger}>
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
            {rows.length} pathway cards
          </div>
        )}
      </div>
    </div>
  );
}
