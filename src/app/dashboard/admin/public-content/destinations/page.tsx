"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { AlertCircle, Loader2, Plus, Trash2, ChevronDown, ChevronUp } from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

type DestinationStatus = "live" | "coming_soon" | "hidden";
type PublishStatus = "draft" | "published";

interface Destination {
  id: string;
  slug: string;
  name: string;
  flag: string;
  headline: string;
  destination_status: DestinationStatus;
  display_order: number;
  status: PublishStatus;
  created_at: string;
  updated_at: string;
}

interface EditForm {
  slug: string;
  name: string;
  flag: string;
  headline: string;
  display_order: number;
  destination_status: DestinationStatus;
  status: PublishStatus;
}

const EMPTY_FORM: EditForm = {
  slug: "",
  name: "",
  flag: "",
  headline: "",
  display_order: 0,
  destination_status: "coming_soon",
  status: "published",
};

// ─── Status helpers ───────────────────────────────────────────────────────────

const DEST_STATUS_CYCLE: DestinationStatus[] = ["live", "coming_soon", "hidden"];

const DEST_STATUS_META: Record<DestinationStatus, string> = {
  live:         "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
  coming_soon:  "bg-gold-400/15 text-gold-400 border-gold-400/30",
  hidden:       "bg-white/[0.06] text-white/40 border-white/[0.08]",
};

const DEST_STATUS_LABEL: Record<DestinationStatus, string> = {
  live:        "Live",
  coming_soon: "Coming Soon",
  hidden:      "Hidden",
};

const PUB_STATUS_META: Record<PublishStatus, string> = {
  published: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
  draft:     "bg-gold-400/15 text-gold-400 border-gold-400/30",
};

// ─── Component ────────────────────────────────────────────────────────────────

export default function DestinationsPage() {
  const [rows,         setRows]         = useState<Destination[]>([]);
  const [loading,      setLoading]      = useState(true);
  const [error,        setError]        = useState<string | null>(null);
  const [expandedId,   setExpandedId]   = useState<string | null>(null);
  const [editForm,     setEditForm]     = useState<EditForm>(EMPTY_FORM);
  const [showAddForm,  setShowAddForm]  = useState(false);
  const [addForm,      setAddForm]      = useState<EditForm>(EMPTY_FORM);
  const [saving,       setSaving]       = useState(false);
  const [savingAdd,    setSavingAdd]    = useState(false);
  const [toggling,     setToggling]     = useState<string | null>(null);
  const [deleting,     setDeleting]     = useState<string | null>(null);

  const fetchRows = useCallback(async () => {
    setLoading(true);
    setError(null);

    // Hard ceiling so a stalled query can never leave the page on an infinite
    // "Loading…" spinner — surface an actionable error instead.
    const TIMEOUT_MS = 10_000;
    let timed_out = false;
    const timeout = new Promise<never>((_, reject) =>
      setTimeout(() => { timed_out = true; reject(new Error(`Timed out after ${TIMEOUT_MS / 1000}s`)); }, TIMEOUT_MS)
    );

    try {
      const supabase = createClient();
      console.log("[Destinations] querying public_destinations…");

      const { data, error: fetchError } = await Promise.race([
        supabase
          .from("public_destinations")
          .select("*")
          .order("display_order", { ascending: true }),
        timeout,
      ]);

      console.log(
        "[Destinations] result — rows:", data?.length ?? 0,
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
        setRows((data ?? []) as Destination[]);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error("[Destinations] unexpected exception:", msg);
      setError(timed_out
        ? "Query timed out — Supabase did not respond. Check your connection and try Refresh."
        : `Unexpected error: ${msg}`);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchRows(); }, [fetchRows]);

  // ── Expand row for editing ─────────────────────────────────────────────────
  const handleExpandRow = (row: Destination) => {
    if (expandedId === row.id) {
      setExpandedId(null);
      return;
    }
    setExpandedId(row.id);
    setEditForm({
      slug:               row.slug,
      name:               row.name,
      flag:               row.flag,
      headline:           row.headline,
      display_order:      row.display_order,
      destination_status: row.destination_status,
      status:             row.status,
    });
  };

  // ── Save edit ──────────────────────────────────────────────────────────────
  const handleSaveEdit = async (id: string) => {
    setSaving(true);
    try {
      const supabase = createClient();
      const { error: updateError } = await supabase
        .from("public_destinations")
        .update({
          slug:               editForm.slug,
          name:               editForm.name,
          flag:               editForm.flag,
          headline:           editForm.headline,
          display_order:      editForm.display_order,
          destination_status: editForm.destination_status,
          status:             editForm.status,
        })
        .eq("id", id);

      if (updateError) {
        console.error("[Destinations] update error:", updateError.message);
      } else {
        setExpandedId(null);
        await fetchRows();
      }
    } catch (err) {
      console.error("[Destinations] update exception:", err);
    } finally {
      setSaving(false);
    }
  };

  // ── Toggle destination_status ──────────────────────────────────────────────
  const handleToggleDestStatus = async (row: Destination) => {
    setToggling(row.id + "_dest");
    try {
      const supabase = createClient();
      const currentIdx = DEST_STATUS_CYCLE.indexOf(row.destination_status);
      const nextStatus = DEST_STATUS_CYCLE[(currentIdx + 1) % DEST_STATUS_CYCLE.length];

      const { error: updateError } = await supabase
        .from("public_destinations")
        .update({ destination_status: nextStatus })
        .eq("id", row.id);

      if (updateError) {
        console.error("[Destinations] toggle dest_status error:", updateError.message);
      } else {
        await fetchRows();
      }
    } catch (err) {
      console.error("[Destinations] toggle dest_status exception:", err);
    } finally {
      setToggling(null);
    }
  };

  // ── Toggle publish status ──────────────────────────────────────────────────
  const handleTogglePubStatus = async (row: Destination) => {
    setToggling(row.id + "_pub");
    try {
      const supabase = createClient();
      const nextStatus: PublishStatus = row.status === "published" ? "draft" : "published";

      const { error: updateError } = await supabase
        .from("public_destinations")
        .update({ status: nextStatus })
        .eq("id", row.id);

      if (updateError) {
        console.error("[Destinations] toggle pub_status error:", updateError.message);
      } else {
        await fetchRows();
      }
    } catch (err) {
      console.error("[Destinations] toggle pub_status exception:", err);
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
        .from("public_destinations")
        .insert({
          slug:               addForm.slug,
          name:               addForm.name,
          flag:               addForm.flag,
          headline:           addForm.headline,
          display_order:      addForm.display_order,
          destination_status: addForm.destination_status,
          status:             addForm.status,
        });

      if (insertError) {
        console.error("[Destinations] insert error:", insertError.message);
      } else {
        setShowAddForm(false);
        setAddForm(EMPTY_FORM);
        await fetchRows();
      }
    } catch (err) {
      console.error("[Destinations] insert exception:", err);
    } finally {
      setSavingAdd(false);
    }
  };

  // ── Delete ─────────────────────────────────────────────────────────────────
  const handleDelete = async (id: string, name: string) => {
    if (!window.confirm(`Delete destination "${name}"? This cannot be undone.`)) return;
    setDeleting(id);
    try {
      const supabase = createClient();
      const { error: deleteError } = await supabase
        .from("public_destinations")
        .delete()
        .eq("id", id);

      if (deleteError) {
        console.error("[Destinations] delete error:", deleteError.message);
      } else {
        await fetchRows();
      }
    } catch (err) {
      console.error("[Destinations] delete exception:", err);
    } finally {
      setDeleting(null);
    }
  };

  const inputCls = "w-full bg-white/[0.05] border border-white/[0.09] rounded-xl px-3 py-2 font-body text-sm text-white placeholder-white/25 focus:outline-none focus:border-gold-400/50 transition-all";
  const btnPrimary = "px-3.5 py-2 rounded-xl bg-gold-500/20 border border-gold-400/40 text-gold-300 font-body text-xs font-semibold hover:bg-gold-500/30 transition-all";
  const btnSecondary = "px-3.5 py-2 rounded-xl bg-white/[0.04] border border-white/[0.08] text-white/55 hover:text-white/80 font-body text-xs transition-all";
  const btnDanger = "px-3.5 py-2 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500/20 font-body text-xs transition-all";

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
          <h2 className="font-display text-3xl text-white mb-1">Destinations</h2>
          <p className="text-white/45 font-body text-sm">
            {rows.length} destinations · shown on the homepage DestinationPathway section
          </p>
        </div>
        <button
          onClick={() => { setShowAddForm(true); setAddForm(EMPTY_FORM); }}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white/[0.05] border border-white/[0.09] text-white/55 hover:text-white/80 hover:border-white/20 font-body text-sm transition-all"
        >
          <Plus className="w-3.5 h-3.5" />
          Add Destination
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
          <p className="font-body text-sm font-semibold text-white/70 mb-2">New Destination</p>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-body text-xs text-white/40 mb-1">Slug *</label>
              <input type="text" value={addForm.slug} onChange={e => setAddForm(f => ({ ...f, slug: e.target.value }))} placeholder="e.g. singapore" className={inputCls} />
            </div>
            <div>
              <label className="block font-body text-xs text-white/40 mb-1">Name *</label>
              <input type="text" value={addForm.name} onChange={e => setAddForm(f => ({ ...f, name: e.target.value }))} placeholder="e.g. Singapore" className={inputCls} />
            </div>
            <div>
              <label className="block font-body text-xs text-white/40 mb-1">Flag emoji *</label>
              <input type="text" value={addForm.flag} onChange={e => setAddForm(f => ({ ...f, flag: e.target.value }))} placeholder="🇸🇬" className={inputCls} />
            </div>
            <div>
              <label className="block font-body text-xs text-white/40 mb-1">Display order</label>
              <input type="number" value={addForm.display_order} onChange={e => setAddForm(f => ({ ...f, display_order: Number(e.target.value) }))} className={inputCls} />
            </div>
            <div className="col-span-2">
              <label className="block font-body text-xs text-white/40 mb-1">Headline *</label>
              <input type="text" value={addForm.headline} onChange={e => setAddForm(f => ({ ...f, headline: e.target.value }))} placeholder="e.g. Full programme access — apply now." className={inputCls} />
            </div>
            <div>
              <label className="block font-body text-xs text-white/40 mb-1">Destination status</label>
              <select value={addForm.destination_status} onChange={e => setAddForm(f => ({ ...f, destination_status: e.target.value as DestinationStatus }))} className={cn(inputCls, "[&>option]:bg-[#0D1530]")}>
                <option value="live">Live</option>
                <option value="coming_soon">Coming Soon</option>
                <option value="hidden">Hidden</option>
              </select>
            </div>
            <div>
              <label className="block font-body text-xs text-white/40 mb-1">Publish status</label>
              <select value={addForm.status} onChange={e => setAddForm(f => ({ ...f, status: e.target.value as PublishStatus }))} className={cn(inputCls, "[&>option]:bg-[#0D1530]")}>
                <option value="published">Published</option>
                <option value="draft">Draft</option>
              </select>
            </div>
          </div>
          <div className="flex gap-2 pt-1">
            <button onClick={handleAdd} disabled={savingAdd || !addForm.slug || !addForm.name} className={cn(btnPrimary, "disabled:opacity-50")}>
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
            <span className="font-body text-sm">Loading destinations…</span>
          </div>
        ) : rows.length === 0 && !error ? (
          <div className="flex flex-col items-center justify-center py-16 text-white/25">
            <p className="font-body text-sm">No destinations yet. Add one above.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/[0.07]">
                  {["Order", "Flag", "Name", "Headline", "Dest. Status", "Pub. Status", "Actions"].map(h => (
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
                        <span className="text-2xl">{row.flag}</span>
                      </td>
                      <td className="px-4 py-4">
                        <p className="font-body font-semibold text-sm text-white/90">{row.name}</p>
                        <p className="font-body text-xs text-white/45 mt-0.5">{row.slug}</p>
                      </td>
                      <td className="px-4 py-4 max-w-[240px]">
                        <p className="font-body text-xs text-white/55 leading-snug">{row.headline}</p>
                      </td>
                      <td className="px-4 py-4">
                        <button
                          onClick={e => { e.stopPropagation(); handleToggleDestStatus(row); }}
                          disabled={toggling === row.id + "_dest"}
                          className={cn(
                            "px-2.5 py-0.5 rounded-full border font-body text-xs font-semibold transition-all hover:opacity-80",
                            DEST_STATUS_META[row.destination_status]
                          )}
                        >
                          {toggling === row.id + "_dest" ? "…" : DEST_STATUS_LABEL[row.destination_status]}
                        </button>
                      </td>
                      <td className="px-4 py-4">
                        <button
                          onClick={e => { e.stopPropagation(); handleTogglePubStatus(row); }}
                          disabled={toggling === row.id + "_pub"}
                          className={cn(
                            "px-2.5 py-0.5 rounded-full border font-body text-xs font-semibold transition-all hover:opacity-80",
                            PUB_STATUS_META[row.status]
                          )}
                        >
                          {toggling === row.id + "_pub" ? "…" : row.status}
                        </button>
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-2" onClick={e => e.stopPropagation()}>
                          <button
                            onClick={() => handleExpandRow(row)}
                            className="p-1.5 rounded-lg bg-white/[0.04] border border-white/[0.08] text-white/40 hover:text-white/70 transition-all"
                            title="Edit"
                          >
                            {expandedId === row.id ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                          </button>
                          <button
                            onClick={() => handleDelete(row.id, row.name)}
                            disabled={deleting === row.id}
                            className="p-1.5 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500/20 transition-all disabled:opacity-50"
                            title="Delete"
                          >
                            {deleting === row.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                          </button>
                        </div>
                      </td>
                    </tr>

                    {/* Inline edit form */}
                    {expandedId === row.id && (
                      <tr key={row.id + "_edit"} className="border-b border-white/[0.04] bg-white/[0.02]">
                        <td colSpan={7} className="px-4 py-4">
                          <div className="space-y-3">
                            <p className="font-body text-xs font-semibold text-white/50 mb-3">Edit Destination</p>
                            <div className="grid grid-cols-2 gap-3">
                              <div>
                                <label className="block font-body text-xs text-white/40 mb-1">Slug</label>
                                <input type="text" value={editForm.slug} onChange={e => setEditForm(f => ({ ...f, slug: e.target.value }))} className={inputCls} />
                              </div>
                              <div>
                                <label className="block font-body text-xs text-white/40 mb-1">Name</label>
                                <input type="text" value={editForm.name} onChange={e => setEditForm(f => ({ ...f, name: e.target.value }))} className={inputCls} />
                              </div>
                              <div>
                                <label className="block font-body text-xs text-white/40 mb-1">Flag emoji</label>
                                <input type="text" value={editForm.flag} onChange={e => setEditForm(f => ({ ...f, flag: e.target.value }))} className={inputCls} />
                              </div>
                              <div>
                                <label className="block font-body text-xs text-white/40 mb-1">Display order</label>
                                <input type="number" value={editForm.display_order} onChange={e => setEditForm(f => ({ ...f, display_order: Number(e.target.value) }))} className={inputCls} />
                              </div>
                              <div className="col-span-2">
                                <label className="block font-body text-xs text-white/40 mb-1">Headline</label>
                                <input type="text" value={editForm.headline} onChange={e => setEditForm(f => ({ ...f, headline: e.target.value }))} className={inputCls} />
                              </div>
                            </div>
                            <div className="flex gap-2 pt-1">
                              <button onClick={() => handleSaveEdit(row.id)} disabled={saving} className={cn(btnPrimary, "disabled:opacity-50")}>
                                {saving ? "Saving…" : "Save changes"}
                              </button>
                              <button onClick={() => setExpandedId(null)} className={btnSecondary}>
                                Cancel
                              </button>
                              <button onClick={() => handleDelete(row.id, row.name)} disabled={deleting === row.id} className={btnDanger}>
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
            {rows.length} destinations
          </div>
        )}
      </div>
    </div>
  );
}
