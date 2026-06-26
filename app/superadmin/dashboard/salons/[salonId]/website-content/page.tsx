"use client";

/* eslint-disable react-hooks/refs, react-hooks/set-state-in-effect */

import Link from "next/link";
import { useEffect, useReducer, useState, useCallback, useRef } from "react";
import { useParams } from "next/navigation";

import {
  fetchSalonWebsiteContent,
  updateSalonWebsiteContent,
  fetchSalonWebsitePage,
  updateSalonWebsitePage,
  updateSalonWebsiteSection,
  resetSalonWebsiteContent,
  type SalonWebsiteContent,
  type WebsiteContentPage,
  type WebsiteContentSection,
  type WebsiteContentTheme,
  type WebsiteContentGlobal,
  type WebsiteContentImage,
  type WebsiteContentButton,
} from "@/src/lib/superadmin-api";
import { LoadingState } from "@/src/components/superadmin/LoadingState";
import { ErrorState } from "@/src/components/superadmin/ErrorState";

// ── Constants ──

const PAGE_KEYS = ["home", "services", "about", "gallery", "contact", "booking"] as const;
const PAGE_LABELS: Record<string, string> = { home: "Home", services: "Services", about: "About", gallery: "Gallery", contact: "Contact", booking: "Booking" };
const PAGE_SLUGS: Record<string, string> = { home: "/", services: "/services", about: "/about", gallery: "/gallery", contact: "/contact", booking: "/book-appointment" };
const BUTTON_TYPES = ["primary", "secondary", "whatsapp", "phone", "link"] as const;

function formatSectionTitle(key: string): string {
  return key.replace(/([A-Z])/g, " $1").replace(/^./, (c) => c.toUpperCase()).trim();
}

function sectionPreviewText(sec: WebsiteContentSection): string {
  const c = sec.content as Record<string, unknown>;
  return String(c?.title || c?.heading || c?.eyebrow || c?.subtitle || "").slice(0, 60);
}

function timeString(): string {
  return new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });
}

// ── State ──

type FetchState = { content: SalonWebsiteContent | null; loading: boolean; error: string; fetchKey: number };
type FetchAction = { type: "SUCCESS"; content: SalonWebsiteContent } | { type: "ERROR"; error: string } | { type: "REFETCH" };
function reducer(s: FetchState, a: FetchAction): FetchState {
  if (a.type === "SUCCESS") return { ...s, content: a.content, error: "", loading: false };
  if (a.type === "ERROR") return { ...s, error: a.error, loading: false };
  return { ...s, loading: true, error: "", fetchKey: s.fetchKey + 1 };
}

// ── Shared classes ──

const inputCls = "w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20";
const labelCls = "block text-sm font-medium text-slate-700 mb-1";
const btnPrimary = "rounded-xl bg-indigo-600 px-5 py-2 text-sm font-semibold text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60";
const btnSecondary = "rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 shadow-sm transition hover:bg-slate-50 disabled:opacity-60";
const btnDanger = "rounded-xl border border-red-200 px-4 py-2 text-sm font-medium text-red-600 transition hover:bg-red-50 disabled:opacity-60";
const btnSmall = "rounded-lg border border-slate-200 px-2.5 py-1 text-xs font-medium text-slate-500 transition hover:bg-slate-50";
const cardCls = "rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm";

// ── Alert ──

function Alert({ type, message }: { type: "success" | "error" | "warn"; message: string }) {
  const cls = type === "success" ? "border-emerald-200 bg-emerald-50 text-emerald-700" : type === "warn" ? "border-amber-200 bg-amber-50 text-amber-700" : "border-red-200 bg-red-50 text-red-700";
  return <div className={`rounded-xl border px-4 py-3 text-sm ${cls}`}>{message}</div>;
}

// ── Structured Content Editors ──

type EditableRecord = Record<string, unknown>;

function isEditableRecord(value: unknown): value is EditableRecord {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function cloneRecord(value: unknown): EditableRecord {
  return isEditableRecord(value) ? JSON.parse(JSON.stringify(value)) as EditableRecord : {};
}

function cloneItems(value: unknown): EditableRecord[] {
  if (!Array.isArray(value)) return [];
  return value.map((item) => isEditableRecord(item) ? JSON.parse(JSON.stringify(item)) as EditableRecord : { value: String(item ?? "") });
}

function fieldLabel(key: string): string {
  return key
    .replace(/([A-Z])/g, " $1")
    .replace(/[_-]+/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase())
    .trim();
}

function shouldUseTextarea(key: string, value: unknown): boolean {
  const k = key.toLowerCase();
  return String(value ?? "").length > 70 || ["description", "subtitle", "review", "message", "address", "answer", "content", "tagline"].some((word) => k.includes(word));
}

function emptyValueFrom(value: unknown): unknown {
  if (typeof value === "boolean") return false;
  if (typeof value === "number") return 0;
  if (Array.isArray(value)) return [];
  if (isEditableRecord(value)) return {};
  return "";
}

function createItemTemplate(section: WebsiteContentSection, items: EditableRecord[]): EditableRecord {
  const firstItem = items[0];
  if (firstItem) {
    return Object.fromEntries(Object.entries(firstItem).map(([key, value]) => [key, emptyValueFrom(value)]));
  }

  const templates: Record<string, EditableRecord> = {
    "stats-bar": { icon: "StarIcon", value: "", label: "" },
    "services-grid": { icon: "SparklesIcon", title: "", description: "", price: "" },
    "features-grid": { icon: "SparklesIcon", title: "", description: "" },
    "testimonials-carousel": { name: "", rating: 5, service: "", review: "", initials: "" },
    "category-tabs": { key: "", label: "" },
    "faq-accordion": { question: "", answer: "", category: "General" },
  };

  return templates[section.sectionType] || { title: "", description: "" };
}

function PrimitiveInput({ fieldKey, value, onChange }: { fieldKey: string; value: unknown; onChange: (value: unknown) => void }) {
  if (typeof value === "boolean") {
    return (
      <label className="flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700">
        <input type="checkbox" checked={value} onChange={(e) => onChange(e.target.checked)} className="h-4 w-4 rounded border-slate-300 text-indigo-500" />
        {fieldLabel(fieldKey)}
      </label>
    );
  }

  if (typeof value === "number") {
    return (
      <div>
        <label className={labelCls}>{fieldLabel(fieldKey)}</label>
        <input type="number" value={value} onChange={(e) => onChange(Number(e.target.value))} className={inputCls} />
      </div>
    );
  }

  if (shouldUseTextarea(fieldKey, value)) {
    return (
      <div>
        <label className={labelCls}>{fieldLabel(fieldKey)}</label>
        <textarea value={String(value ?? "")} onChange={(e) => onChange(e.target.value)} rows={3} className={inputCls} />
      </div>
    );
  }

  return (
    <div>
      <label className={labelCls}>{fieldLabel(fieldKey)}</label>
      <input value={String(value ?? "")} onChange={(e) => onChange(e.target.value)} className={inputCls} />
    </div>
  );
}

function StringListEditor({ label, values, onChange }: { label: string; values: unknown[]; onChange: (values: string[]) => void }) {
  const strings = values.map((value) => String(value ?? ""));
  return (
    <div>
      <label className={labelCls}>{label}</label>
      <div className="space-y-2">
        {strings.map((value, index) => (
          <div key={index} className="flex gap-2">
            <input value={value} onChange={(e) => onChange(strings.map((item, i) => i === index ? e.target.value : item))} className={inputCls} />
            <button type="button" onClick={() => onChange(strings.filter((_, i) => i !== index))} className={btnSmall}>Remove</button>
          </div>
        ))}
      </div>
      <button type="button" onClick={() => onChange([...strings, ""])} className="mt-2 text-xs font-medium text-indigo-600 hover:text-indigo-800">+ Add {label}</button>
    </div>
  );
}

function ObjectFieldsEditor({ title, value, onChange, emptyText }: {
  title: string; value: EditableRecord; onChange: (value: EditableRecord) => void; emptyText: string;
}) {
  const entries = Object.entries(value);
  const [newKey, setNewKey] = useState("");

  function updateField(key: string, nextValue: unknown) {
    onChange({ ...value, [key]: nextValue });
  }

  function removeField(key: string) {
    const next = { ...value };
    delete next[key];
    onChange(next);
  }

  function addField() {
    const key = newKey.trim();
    if (!key || Object.prototype.hasOwnProperty.call(value, key)) return;
    onChange({ ...value, [key]: "" });
    setNewKey("");
  }

  return (
    <div>
      <div className="mb-3 flex items-center justify-between gap-3">
        <label className={labelCls}>{title}</label>
        <span className="text-[10px] text-slate-400">Saved internally as structured data</span>
      </div>

      {entries.length ? (
        <div className="grid gap-4">
          {entries.map(([key, fieldValue]) => {
            if (Array.isArray(fieldValue)) {
              const isObjectList = fieldValue.some(isEditableRecord);
              return (
                <div key={key} className="rounded-lg border border-slate-200 p-3">
                  <div className="mb-2 flex items-center justify-between">
                    <span className="text-sm font-medium text-slate-700">{fieldLabel(key)}</span>
                    <button type="button" onClick={() => removeField(key)} className="text-xs text-red-500 hover:text-red-700">Remove</button>
                  </div>
                  {isObjectList ? (
                    <ItemsEditor
                      section={{ sectionKey: key, sectionType: key, enabled: true, sortOrder: 0, content: {}, images: [], buttons: [], items: fieldValue, settings: {} }}
                      items={cloneItems(fieldValue)}
                      onChange={(items) => updateField(key, items)}
                      compact
                    />
                  ) : (
                    <StringListEditor label={fieldLabel(key)} values={fieldValue} onChange={(items) => updateField(key, items)} />
                  )}
                </div>
              );
            }

            if (isEditableRecord(fieldValue)) {
              return (
                <div key={key} className="rounded-lg border border-slate-200 p-3">
                  <div className="mb-2 flex items-center justify-between">
                    <span className="text-sm font-medium text-slate-700">{fieldLabel(key)}</span>
                    <button type="button" onClick={() => removeField(key)} className="text-xs text-red-500 hover:text-red-700">Remove</button>
                  </div>
                  <ObjectFieldsEditor title={fieldLabel(key)} value={fieldValue} onChange={(next) => updateField(key, next)} emptyText="No nested fields yet." />
                </div>
              );
            }

            return (
              <div key={key} className="grid gap-2 sm:grid-cols-[1fr_auto] sm:items-end">
                <PrimitiveInput fieldKey={key} value={fieldValue} onChange={(next) => updateField(key, next)} />
                <button type="button" onClick={() => removeField(key)} className={`${btnSmall} mb-0.5`}>Remove</button>
              </div>
            );
          })}
        </div>
      ) : (
        <p className="rounded-lg border border-dashed border-slate-200 px-3 py-4 text-sm text-slate-400">{emptyText}</p>
      )}

      <div className="mt-3 flex gap-2">
        <input value={newKey} onChange={(e) => setNewKey(e.target.value)} placeholder="Add field name, e.g. title" className={`${inputCls} text-xs`} />
        <button type="button" onClick={addField} className={btnSecondary}>Add Field</button>
      </div>
    </div>
  );
}

function ItemsEditor({ section, items, onChange, compact = false }: {
  section: WebsiteContentSection; items: EditableRecord[]; onChange: (items: EditableRecord[]) => void; compact?: boolean;
}) {
  function updateItem(index: number, key: string, value: unknown) {
    onChange(items.map((item, i) => i === index ? { ...item, [key]: value } : item));
  }

  function removeItem(index: number) {
    onChange(items.filter((_, i) => i !== index));
  }

  function addItem() {
    onChange([...items, createItemTemplate(section, items)]);
  }

  return (
    <div>
      {!compact ? <label className={labelCls}>Items ({items.length})</label> : null}
      <div className="space-y-3">
        {items.map((item, index) => (
          <div key={index} className="rounded-lg border border-slate-200 p-3">
            <div className="mb-3 flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wide text-slate-400">Item {index + 1}</span>
              <button type="button" onClick={() => removeItem(index)} className="text-xs text-red-500 hover:text-red-700">Remove</button>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              {Object.entries(item).map(([key, value]) => (
                <PrimitiveInput key={key} fieldKey={key} value={value} onChange={(next) => updateItem(index, key, next)} />
              ))}
            </div>
          </div>
        ))}
      </div>
      {items.length === 0 ? <p className="rounded-lg border border-dashed border-slate-200 px-3 py-4 text-sm text-slate-400">No repeatable items for this section yet.</p> : null}
      <button type="button" onClick={addItem} className="mt-2 text-xs font-medium text-indigo-600 hover:text-indigo-800">+ Add Item</button>
    </div>
  );
}

// ── Image List Editor ──

function ImageListEditor({ images, onChange }: { images: WebsiteContentImage[]; onChange: (imgs: WebsiteContentImage[]) => void }) {
  function update(i: number, key: keyof WebsiteContentImage, val: string | number) {
    const next = [...images]; next[i] = { ...next[i], [key]: val }; onChange(next);
  }
  return (
    <div>
      <label className={labelCls}>Images ({images.length})</label>
      <div className="space-y-3">
        {images.map((img, i) => (
          <div key={i} className="rounded-lg border border-slate-200 p-3">
            <div className="flex gap-3">
              {img.url ? (
                <div className="w-16 h-16 rounded border border-slate-200 bg-slate-50 shrink-0 overflow-hidden">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={img.url} alt={img.alt || ""} className="w-full h-full object-cover" onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
                </div>
              ) : null}
              <div className="flex-1 grid gap-2 sm:grid-cols-2">
                <input placeholder="Key" value={img.key} onChange={(e) => update(i, "key", e.target.value)} className={`${inputCls} text-xs`} />
                <input placeholder="Image URL" value={img.url} onChange={(e) => update(i, "url", e.target.value)} className={`${inputCls} text-xs`} />
                <div>
                  <input placeholder="Alt text" value={img.alt || ""} onChange={(e) => update(i, "alt", e.target.value)} className={`${inputCls} text-xs`} />
                  {img.url && !img.alt?.trim() ? <p className="mt-0.5 text-[10px] text-amber-600">Alt text recommended for SEO</p> : null}
                </div>
                <div className="flex items-center gap-2">
                  <input placeholder="Sort" type="number" value={img.sortOrder ?? 0} onChange={(e) => update(i, "sortOrder", Number(e.target.value))} className={`${inputCls} w-20 text-xs`} />
                  {img.url ? <a href={img.url} target="_blank" rel="noopener noreferrer" className="text-[10px] text-indigo-500 hover:underline">Open</a> : null}
                  <button type="button" onClick={() => onChange(images.filter((_, j) => j !== i))} className="text-xs text-red-500 hover:text-red-700 ml-auto">Remove</button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
      <button type="button" onClick={() => onChange([...images, { key: "", url: "", alt: "", title: "", sortOrder: images.length }])} className="mt-2 text-xs font-medium text-indigo-600 hover:text-indigo-800">+ Add Image</button>
    </div>
  );
}

// ── Button List Editor ──

function ButtonListEditor({ buttons, onChange }: { buttons: WebsiteContentButton[]; onChange: (btns: WebsiteContentButton[]) => void }) {
  function update(i: number, key: keyof WebsiteContentButton, val: unknown) {
    const next = [...buttons]; next[i] = { ...next[i], [key]: val }; onChange(next);
  }
  return (
    <div>
      <label className={labelCls}>Buttons ({buttons.length})</label>
      <div className="space-y-3">
        {buttons.map((btn, i) => (
          <div key={i} className="rounded-lg border border-slate-200 p-3">
            <div className="flex items-center gap-2 mb-2">
              <span className={`inline-flex items-center rounded px-1.5 py-0.5 text-[10px] font-semibold ${btn.enabled !== false ? "bg-indigo-100 text-indigo-700" : "bg-slate-100 text-slate-500 line-through"}`}>{btn.label || "—"}</span>
              <span className="text-[10px] text-slate-400 truncate">{btn.href || "no href"}</span>
              <span className="text-[10px] text-slate-400">{btn.type || "primary"}</span>
              {btn.enabled === false ? <span className="text-[10px] font-medium text-red-400">Disabled</span> : null}
            </div>
            <div className="grid gap-2 sm:grid-cols-2">
              <input placeholder="Label" value={btn.label} onChange={(e) => update(i, "label", e.target.value)} className={`${inputCls} text-xs`} />
              <div>
                <input placeholder="Href" value={btn.href} onChange={(e) => update(i, "href", e.target.value)} className={`${inputCls} text-xs`} />
                {btn.label && !btn.href?.trim() ? <p className="mt-0.5 text-[10px] text-amber-600">Href is empty</p> : null}
              </div>
              <select value={btn.type || "primary"} onChange={(e) => update(i, "type", e.target.value)} className={`${inputCls} text-xs`}>
                {BUTTON_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
              <div className="flex items-center gap-3">
                <label className="flex items-center gap-1.5 text-xs text-slate-600">
                  <input type="checkbox" checked={btn.enabled !== false} onChange={(e) => update(i, "enabled", e.target.checked)} className="h-3.5 w-3.5 rounded border-slate-300 text-indigo-500" />
                  Enabled
                </label>
                <button type="button" onClick={() => onChange(buttons.filter((_, j) => j !== i))} className="text-xs text-red-500 hover:text-red-700 ml-auto">Remove</button>
              </div>
            </div>
          </div>
        ))}
      </div>
      <button type="button" onClick={() => onChange([...buttons, { label: "", href: "", type: "primary", enabled: true }])} className="mt-2 text-xs font-medium text-indigo-600 hover:text-indigo-800">+ Add Button</button>
    </div>
  );
}

// ── Section Editor Modal ──

function SectionEditorModal({ section, salonId, pageKey, onClose, onSaved }: {
  section: WebsiteContentSection; salonId: string; pageKey: string; onClose: () => void; onSaved: () => void;
}) {
  const origContent = useRef(cloneRecord(section.content));
  const origItems = useRef(cloneItems(section.items));
  const origSettings = useRef(cloneRecord(section.settings));

  const [enabled, setEnabled] = useState(section.enabled);
  const [sortOrder, setSortOrder] = useState(section.sortOrder);
  const [content, setContent] = useState<EditableRecord>(origContent.current);
  const [items, setItems] = useState<EditableRecord[]>(origItems.current);
  const [settings, setSettings] = useState<EditableRecord>(origSettings.current);
  const [images, setImages] = useState<WebsiteContentImage[]>([...section.images]);
  const [buttons, setButtons] = useState<WebsiteContentButton[]>([...section.buttons]);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [showDiscard, setShowDiscard] = useState(false);

  const isDirty = JSON.stringify(content) !== JSON.stringify(origContent.current)
    || JSON.stringify(items) !== JSON.stringify(origItems.current)
    || JSON.stringify(settings) !== JSON.stringify(origSettings.current)
    || enabled !== section.enabled
    || sortOrder !== section.sortOrder
    || JSON.stringify(images) !== JSON.stringify(section.images)
    || JSON.stringify(buttons) !== JSON.stringify(section.buttons);

  function tryClose() {
    if (isDirty) { setShowDiscard(true); return; }
    onClose();
  }

  async function handleSave() {
    setSaving(true); setMsg(null);
    try {
      await updateSalonWebsiteSection(salonId, pageKey, section.sectionKey, {
        enabled, sortOrder,
        content, images, buttons, items, settings,
      });
      setMsg({ type: "success", text: "Section saved." });
      onSaved();
      setTimeout(onClose, 500);
    } catch (err) { setMsg({ type: "error", text: (err as Error).message }); }
    finally { setSaving(false); }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto py-8">
      <div className="absolute inset-0 bg-slate-900/50" onClick={saving ? undefined : tryClose} />
      <div className="relative mx-4 w-full max-w-3xl rounded-xl border border-slate-200 bg-white shadow-xl">
        {/* Header */}
        <div className="sticky top-0 z-10 rounded-t-xl border-b border-slate-100 bg-white px-6 py-4">
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-semibold text-slate-900">{formatSectionTitle(section.sectionKey)}</h3>
                <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${enabled ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-500"}`}>{enabled ? "Enabled" : "Disabled"}</span>
              </div>
              <p className="text-xs text-slate-500">{section.sectionKey} &middot; {section.sectionType} &middot; {PAGE_LABELS[pageKey]} page</p>
            </div>
            <button type="button" onClick={tryClose} className="text-slate-400 hover:text-slate-600 text-xl leading-none">&times;</button>
          </div>
          <p className="mt-2 text-[11px] text-amber-600">Changes here will affect the public salon website after save.</p>
        </div>

        {/* Body */}
        <div className="max-h-[70vh] space-y-5 overflow-y-auto p-6">
          <div className="flex flex-wrap items-center gap-4">
            <label className="flex items-center gap-2 text-sm text-slate-700">
              <input type="checkbox" checked={enabled} onChange={(e) => setEnabled(e.target.checked)} className="h-4 w-4 rounded border-slate-300 text-indigo-500" />
              Enabled
            </label>
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium text-slate-700">Sort Order</label>
              <input type="number" value={sortOrder} onChange={(e) => setSortOrder(Number(e.target.value))} className={`${inputCls} w-24 text-xs`} />
            </div>
          </div>

          <ObjectFieldsEditor title="Content" value={content} onChange={setContent} emptyText="No content fields for this section." />
          <ImageListEditor images={images} onChange={setImages} />
          <ButtonListEditor buttons={buttons} onChange={setButtons} />
          <ItemsEditor section={section} items={items} onChange={setItems} />
          <ObjectFieldsEditor title="Settings" value={settings} onChange={setSettings} emptyText="No settings for this section." />
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-slate-100 px-6 py-4">
          {msg ? <Alert type={msg.type} message={msg.text} /> : <span />}
          <div className="flex gap-3">
            <button type="button" onClick={tryClose} disabled={saving} className={btnSecondary}>Cancel</button>
            <button type="button" onClick={handleSave} disabled={saving} className={btnPrimary}>{saving ? "Saving..." : "Save Section"}</button>
          </div>
        </div>
      </div>

      {/* Discard confirmation */}
      {showDiscard ? (
        <div className="fixed inset-0 z-[60] flex items-center justify-center">
          <div className="absolute inset-0 bg-slate-900/40" />
          <div className="relative mx-4 w-full max-w-sm rounded-xl border border-slate-200 bg-white p-6 shadow-xl">
            <h4 className="text-base font-semibold text-slate-900">Discard unsaved changes?</h4>
            <p className="mt-2 text-sm text-slate-500">Your changes will be lost.</p>
            <div className="mt-5 flex justify-end gap-3">
              <button type="button" onClick={() => setShowDiscard(false)} className={btnSecondary}>Keep Editing</button>
              <button type="button" onClick={onClose} className="rounded-xl bg-red-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-700">Discard</button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

// ── Global Tab ──

function GlobalTab({ global, salonId, onSaved }: { global: WebsiteContentGlobal; salonId: string; onSaved: () => void }) {
  const [form, setForm] = useState<WebsiteContentGlobal>({ ...global });
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<{ type: "success" | "error" | "warn"; text: string } | null>(null);

  useEffect(() => { setForm({ ...global }); }, [global]);

  function set(key: keyof WebsiteContentGlobal, val: string) { setForm((f) => ({ ...f, [key]: val })); }

  function validate(): string[] {
    const w: string[] = [];
    if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) w.push("Email format looks invalid.");
    for (const k of ["logoUrl", "faviconUrl", "instagramUrl", "facebookUrl", "googleMapUrl"] as const) {
      if (form[k] && !form[k].startsWith("http") && !form[k].startsWith("/")) w.push(`${k} should start with http or /.`);
    }
    return w;
  }

  async function handleSave() {
    const warnings = validate();
    if (warnings.length > 0) { setMsg({ type: "warn", text: warnings.join(" ") }); }
    setSaving(true);
    try {
      await updateSalonWebsiteContent(salonId, { global: form });
      setMsg({ type: "success", text: `Global content saved at ${timeString()}.` });
      onSaved();
    } catch (err) { setMsg({ type: "error", text: (err as Error).message }); }
    finally { setSaving(false); }
  }

  const fields: { key: keyof WebsiteContentGlobal; label: string; type?: string }[] = [
    { key: "salonName", label: "Salon Name" }, { key: "tagline", label: "Tagline" },
    { key: "logoUrl", label: "Logo URL" }, { key: "faviconUrl", label: "Favicon URL" },
    { key: "phone", label: "Phone" }, { key: "whatsapp", label: "WhatsApp" },
    { key: "email", label: "Email", type: "email" }, { key: "address", label: "Address" },
    { key: "city", label: "City" }, { key: "state", label: "State" },
    { key: "instagramUrl", label: "Instagram URL" }, { key: "facebookUrl", label: "Facebook URL" },
    { key: "googleMapUrl", label: "Google Map URL" }, { key: "openingHours", label: "Opening Hours" },
  ];

  return (
    <div className={cardCls}>
      <h2 className="text-base font-semibold text-slate-900">Global Content</h2>
      <p className="mt-1 text-sm text-slate-500">Salon-wide information shared across all pages.</p>
      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        {fields.map((f) => (
          <div key={f.key}>
            <label className={labelCls}>{f.label}</label>
            <input type={f.type || "text"} value={form[f.key]} onChange={(e) => set(f.key, e.target.value)} className={inputCls} />
          </div>
        ))}
      </div>
      {msg ? <div className="mt-4"><Alert type={msg.type} message={msg.text} /></div> : null}
      <div className="mt-5">
        <button type="button" onClick={handleSave} disabled={saving} className={btnPrimary}>{saving ? "Saving..." : "Save Global"}</button>
      </div>
    </div>
  );
}

// ── Theme Tab ──

function ThemeTab({ theme, salonId, onSaved }: { theme: WebsiteContentTheme; salonId: string; onSaved: () => void }) {
  const [form, setForm] = useState<WebsiteContentTheme>({ ...theme });
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<{ type: "success" | "error" | "warn"; text: string } | null>(null);

  useEffect(() => { setForm({ ...theme }); }, [theme]);

  function set(key: keyof WebsiteContentTheme, val: string) { setForm((f) => ({ ...f, [key]: val })); }

  async function handleSave() {
    const colorKeys: (keyof WebsiteContentTheme)[] = ["primaryColor", "secondaryColor", "accentColor", "backgroundColor", "textColor"];
    const warnings: string[] = [];
    for (const k of colorKeys) {
      if (form[k] && !form[k].startsWith("#") && !form[k].startsWith("rgb")) warnings.push(`${k} should start with # or rgb.`);
    }
    if (warnings.length > 0) setMsg({ type: "warn", text: warnings.join(" ") });
    setSaving(true);
    try {
      await updateSalonWebsiteContent(salonId, { theme: form });
      setMsg({ type: "success", text: `Theme saved at ${timeString()}.` });
      onSaved();
    } catch (err) { setMsg({ type: "error", text: (err as Error).message }); }
    finally { setSaving(false); }
  }

  const colorFields: { key: keyof WebsiteContentTheme; label: string }[] = [
    { key: "primaryColor", label: "Primary Color" }, { key: "secondaryColor", label: "Secondary Color" },
    { key: "accentColor", label: "Accent Color" }, { key: "backgroundColor", label: "Background Color" },
    { key: "textColor", label: "Text Color" },
  ];

  return (
    <div className={cardCls}>
      <h2 className="text-base font-semibold text-slate-900">Theme</h2>
      <p className="mt-1 text-sm text-slate-500">Colors and typography for the salon website.</p>
      <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {colorFields.map((f) => (
          <div key={f.key}>
            <label className={labelCls}>{f.label}</label>
            <div className="flex items-center gap-2">
              <input type="color" value={form[f.key]} onChange={(e) => set(f.key, e.target.value)} className="h-9 w-12 cursor-pointer rounded border border-slate-300" />
              <input type="text" value={form[f.key]} onChange={(e) => set(f.key, e.target.value)} className={`${inputCls} font-mono text-xs`} />
            </div>
          </div>
        ))}
        <div>
          <label className={labelCls}>Font Family</label>
          <input type="text" value={form.fontFamily} onChange={(e) => set("fontFamily", e.target.value)} className={inputCls} placeholder="e.g. Inter, sans-serif" />
        </div>
      </div>
      {msg ? <div className="mt-4"><Alert type={msg.type} message={msg.text} /></div> : null}
      <div className="mt-5">
        <button type="button" onClick={handleSave} disabled={saving} className={btnPrimary}>{saving ? "Saving..." : "Save Theme"}</button>
      </div>
    </div>
  );
}

// ── Pages Tab ──

function PagesTab({ content, salonId, onContentRefresh }: { content: SalonWebsiteContent; salonId: string; onContentRefresh: () => void }) {
  const [activePageKey, setActivePageKey] = useState<string>("home");
  const [page, setPage] = useState<WebsiteContentPage | null>(null);
  const [pageLoading, setPageLoading] = useState(false);
  const [pageError, setPageError] = useState("");

  const [seoTitle, setSeoTitle] = useState("");
  const [seoSlug, setSeoSlug] = useState("");
  const [metaTitle, setMetaTitle] = useState("");
  const [metaDesc, setMetaDesc] = useState("");
  const [keywords, setKeywords] = useState("");
  const [ogImage, setOgImage] = useState("");
  const [seoSaving, setSeoSaving] = useState(false);
  const [seoMsg, setSeoMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [editSection, setEditSection] = useState<WebsiteContentSection | null>(null);

  const loadPage = useCallback(async (pk: string) => {
    setPageLoading(true); setPageError(""); setSeoMsg(null);
    try {
      const res = await fetchSalonWebsitePage(salonId, pk);
      const p = res.data!.page;
      setPage(p); setSeoTitle(p.title); setSeoSlug(p.slug);
      setMetaTitle(p.seo?.metaTitle || ""); setMetaDesc(p.seo?.metaDescription || "");
      setKeywords((p.seo?.keywords || []).join(", ")); setOgImage(p.seo?.ogImageUrl || "");
    } catch (err) { setPageError((err as Error).message); }
    finally { setPageLoading(false); }
  }, [salonId]);

  useEffect(() => { loadPage(activePageKey); }, [activePageKey, loadPage]);

  async function handleSaveSeo() {
    setSeoSaving(true); setSeoMsg(null);
    try {
      await updateSalonWebsitePage(salonId, activePageKey, {
        title: seoTitle, slug: seoSlug,
        seo: { metaTitle, metaDescription: metaDesc, keywords: keywords.split(",").map((k) => k.trim()).filter(Boolean), ogImageUrl: ogImage },
      });
      setSeoMsg({ type: "success", text: `Page SEO saved at ${timeString()}.` });
      onContentRefresh();
    } catch (err) { setSeoMsg({ type: "error", text: (err as Error).message }); }
    finally { setSeoSaving(false); }
  }

  async function handleToggleSection(sec: WebsiteContentSection) {
    try { await updateSalonWebsiteSection(salonId, activePageKey, sec.sectionKey, { enabled: !sec.enabled }); loadPage(activePageKey); } catch { /* silent */ }
  }

  const sections = page?.sections ? [...page.sections].sort((a, b) => a.sortOrder - b.sortOrder) : [];

  return (
    <div className="grid gap-6 lg:grid-cols-[220px_1fr]">
      {/* Page selector */}
      <div className={`${cardCls} lg:sticky lg:top-4 lg:self-start`}>
        <h3 className="text-sm font-semibold text-slate-900 mb-3">Pages</h3>
        <nav className="flex flex-row flex-wrap gap-1.5 lg:flex-col">
          {PAGE_KEYS.map((pk) => (
            <button key={pk} type="button" onClick={() => setActivePageKey(pk)}
              className={`rounded-lg px-3 py-2 text-left text-sm font-medium transition ${activePageKey === pk ? "bg-indigo-600 text-white shadow-sm" : "text-slate-600 hover:bg-slate-100"}`}
            >{PAGE_LABELS[pk]}</button>
          ))}
        </nav>
      </div>

      {/* Page editor */}
      <div className="space-y-6">
        {/* Public page link */}
        <div className="flex items-center gap-3">
          <a href={PAGE_SLUGS[activePageKey] || "/"} target="_blank" rel="noopener noreferrer" className={btnSecondary}>
            Open Public Page &rarr;
          </a>
          <span className="text-xs text-slate-400">Opens the salon frontend page in a new tab</span>
        </div>

        {pageLoading ? <LoadingState message="Loading page..." /> : pageError ? <ErrorState message={pageError} onRetry={() => loadPage(activePageKey)} /> : page ? (
          <>
            {/* SEO / Meta */}
            <div className={cardCls}>
              <h3 className="text-base font-semibold text-slate-900">{PAGE_LABELS[activePageKey]} &mdash; Page &amp; SEO</h3>
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <div><label className={labelCls}>Page Title</label><input value={seoTitle} onChange={(e) => setSeoTitle(e.target.value)} className={inputCls} /></div>
                <div><label className={labelCls}>Slug</label><input value={seoSlug} onChange={(e) => setSeoSlug(e.target.value)} className={inputCls} /></div>
                <div><label className={labelCls}>Meta Title</label><input value={metaTitle} onChange={(e) => setMetaTitle(e.target.value)} className={inputCls} /></div>
                <div><label className={labelCls}>OG Image URL</label><input value={ogImage} onChange={(e) => setOgImage(e.target.value)} className={inputCls} /></div>
                <div className="sm:col-span-2"><label className={labelCls}>Meta Description</label><textarea value={metaDesc} onChange={(e) => setMetaDesc(e.target.value)} rows={2} className={inputCls} /></div>
                <div className="sm:col-span-2"><label className={labelCls}>Keywords (comma-separated)</label><input value={keywords} onChange={(e) => setKeywords(e.target.value)} className={inputCls} /></div>
              </div>
              {seoMsg ? <div className="mt-3"><Alert type={seoMsg.type} message={seoMsg.text} /></div> : null}
              <div className="mt-4"><button type="button" onClick={handleSaveSeo} disabled={seoSaving} className={btnPrimary}>{seoSaving ? "Saving..." : "Save Page SEO"}</button></div>
            </div>

            {/* Sections */}
            <div className={cardCls}>
              <h3 className="text-base font-semibold text-slate-900">Sections ({sections.length})</h3>
              <div className="mt-4 space-y-2">
                {sections.map((sec) => {
                  const preview = sectionPreviewText(sec);
                  return (
                    <div key={sec.sectionKey} className={`rounded-xl border px-4 py-3 transition ${sec.enabled ? "border-slate-200" : "border-slate-100 bg-slate-50/50"}`}>
                      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className={`inline-block h-2 w-2 rounded-full shrink-0 ${sec.enabled ? "bg-emerald-500" : "bg-slate-300"}`} />
                            <span className="text-sm font-semibold text-slate-900">{formatSectionTitle(sec.sectionKey)}</span>
                          </div>
                          <p className="mt-0.5 text-xs text-slate-400">{sec.sectionKey} &middot; {sec.sectionType} &middot; Sort: {sec.sortOrder}</p>
                          {preview ? <p className="mt-0.5 text-xs text-slate-500 truncate">{preview}</p> : null}
                          <p className="mt-0.5 text-[10px] text-slate-400">
                            Images: {sec.images?.length || 0} &middot; Buttons: {sec.buttons?.length || 0} &middot; Items: {(sec.items as unknown[])?.length || 0}
                          </p>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <button type="button" onClick={() => handleToggleSection(sec)}
                            className={`rounded px-2.5 py-1 text-xs font-medium transition ${sec.enabled ? "border border-emerald-200 text-emerald-700 hover:bg-emerald-50" : "border border-slate-200 text-slate-500 hover:bg-slate-50"}`}
                          >{sec.enabled ? "Enabled" : "Disabled"}</button>
                          <button type="button" onClick={() => setEditSection(sec)} className="rounded border border-indigo-200 px-2.5 py-1 text-xs font-medium text-indigo-600 transition hover:bg-indigo-50">Edit</button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </>
        ) : null}
      </div>

      {editSection ? <SectionEditorModal section={editSection} salonId={salonId} pageKey={activePageKey} onClose={() => setEditSection(null)} onSaved={() => loadPage(activePageKey)} /> : null}
    </div>
  );
}

// ── Reset Modal ──

function ResetModal({ salonId, open, loading, onConfirm, onCancel }: {
  salonId: string; open: boolean; loading: boolean; onConfirm: () => void; onCancel: () => void;
}) {
  const [typed, setTyped] = useState("");
  useEffect(() => { if (open) setTyped(""); }, [open]);
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-slate-900/50" onClick={loading ? undefined : onCancel} />
      <div className="relative mx-4 w-full max-w-md rounded-xl border border-slate-200 bg-white p-6 shadow-xl">
        <h3 className="text-base font-semibold text-slate-900">Reset to default content?</h3>
        <p className="mt-2 text-sm leading-relaxed text-slate-500">
          This will replace <strong>all</strong> website content for <span className="font-mono text-xs text-slate-700">{salonId}</span> with the default template. All customizations (theme, global, pages, sections) will be lost. This cannot be undone.
        </p>
        <div className="mt-4">
          <label className="text-sm font-medium text-slate-700">Type <span className="font-mono font-bold text-red-600">RESET</span> to confirm</label>
          <input value={typed} onChange={(e) => setTyped(e.target.value)} placeholder="RESET" className={`${inputCls} mt-1`} />
        </div>
        <div className="mt-6 flex items-center justify-end gap-3">
          <button type="button" onClick={onCancel} disabled={loading} className={btnSecondary}>Cancel</button>
          <button type="button" onClick={onConfirm} disabled={loading || typed !== "RESET"} className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-red-700 disabled:opacity-60 disabled:cursor-not-allowed">
            {loading ? "Resetting..." : "Reset to Default"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Main Page ──

export default function WebsiteContentPage() {
  const params = useParams<{ salonId: string }>();
  const salonId = params.salonId;

  const [state, dispatch] = useReducer(reducer, { content: null, loading: true, error: "", fetchKey: 0 });
  const [activeTab, setActiveTab] = useState<"global" | "theme" | "pages">("pages");
  const [showReset, setShowReset] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [lastSaved, setLastSaved] = useState("");

  useEffect(() => {
    fetchSalonWebsiteContent(salonId)
      .then((res) => dispatch({ type: "SUCCESS", content: res.data!.content }))
      .catch((err: Error) => dispatch({ type: "ERROR", error: err.message }));
  }, [salonId, state.fetchKey]);

  async function handleReset() {
    setResetting(true);
    try {
      const res = await resetSalonWebsiteContent(salonId);
      dispatch({ type: "SUCCESS", content: res.data!.content });
      setShowReset(false);
      setLastSaved(timeString());
    } catch (err) { dispatch({ type: "ERROR", error: (err as Error).message }); setShowReset(false); }
    finally { setResetting(false); }
  }

  async function handleToggleStatus() {
    if (!state.content) return;
    const newStatus = state.content.status === "published" ? "draft" : "published";
    try { await updateSalonWebsiteContent(salonId, { status: newStatus }); setLastSaved(timeString()); dispatch({ type: "REFETCH" }); } catch { /* silent */ }
  }

  function handleSaved() { setLastSaved(timeString()); dispatch({ type: "REFETCH" }); }

  const { content, loading, error } = state;
  if (loading) return <LoadingState message="Loading website content..." />;
  if (error) return <ErrorState message={error} onRetry={() => dispatch({ type: "REFETCH" })} />;
  if (!content) return <ErrorState message="Content not found." />;

  const tabs = [
    { key: "pages" as const, label: "Pages" },
    { key: "global" as const, label: "Global" },
    { key: "theme" as const, label: "Theme" },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <section>
        <div className="flex items-center gap-2 text-sm text-slate-500">
          <Link href="/superadmin/dashboard/salons" className="hover:text-slate-700">Salons</Link>
          <span>/</span>
          <Link href={`/superadmin/dashboard/salons/${salonId}`} className="hover:text-slate-700">{salonId}</Link>
          <span>/</span>
          <span className="text-slate-900">Website Content</span>
        </div>
        <div className="mt-2 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-slate-900">Website Content</h1>
            <p className="mt-1 text-sm text-slate-500">
              Manage public website content for <span className="font-mono text-xs text-slate-700">{salonId}</span>
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {lastSaved ? <span className="text-xs text-slate-400">Saved {lastSaved}</span> : null}
            <span className="text-xs text-slate-400">v{content.version}</span>
            <button type="button" onClick={handleToggleStatus} className={`rounded-full px-3 py-1 text-xs font-semibold cursor-pointer ${content.status === "published" ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"}`}>
              {content.status}
            </button>
            <button type="button" onClick={() => setShowReset(true)} className={btnDanger}>Reset Default</button>
          </div>
        </div>
        {content.status === "draft" ? (
          <div className="mt-3"><Alert type="warn" message="Public website API only returns published content. Draft content will not appear publicly." /></div>
        ) : null}
      </section>

      {/* Tabs */}
      <div className="flex gap-1 rounded-xl border border-slate-200 bg-slate-50 p-1">
        {tabs.map((t) => (
          <button key={t.key} type="button" onClick={() => setActiveTab(t.key)}
            className={`rounded-lg px-4 py-2 text-sm font-medium transition ${activeTab === t.key ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}
          >{t.label}</button>
        ))}
      </div>

      {/* Tab content */}
      {activeTab === "global" ? <GlobalTab global={content.global} salonId={salonId} onSaved={handleSaved} /> :
       activeTab === "theme" ? <ThemeTab theme={content.theme} salonId={salonId} onSaved={handleSaved} /> :
       <PagesTab content={content} salonId={salonId} onContentRefresh={handleSaved} />}

      {/* Reset modal */}
      <ResetModal salonId={salonId} open={showReset} loading={resetting} onConfirm={handleReset} onCancel={() => setShowReset(false)} />
    </div>
  );
}
