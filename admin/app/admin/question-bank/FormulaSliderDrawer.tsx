"use client";

import React, { useState, useMemo } from "react";
import {
  Calculator,
  X,
  Search,
  Sparkles,
  Bold,
  Italic,
  Underline,
  Code,
  Quote,
  CheckCircle2,
  BookOpen,
  ArrowRight
} from "lucide-react";
import { formatMarkdownPreview } from "@/lib/renderMath";
import {
  FORMULA_CATEGORIES,
  ALL_MATH_SYMBOLS,
  PREBUILT_THEOREMS,
  FormulaCategory
} from "@/app/admin/exams/new/mathFormulaData";

interface AvailableField {
  id: string;
  label: string;
}

interface FormulaSliderDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  activeTargetField: string;
  setActiveTargetField: (field: string) => void;
  availableFields: AvailableField[];
  fieldValue: string;
  onUpdateFieldValue: (newVal: string) => void;
  onInsertSnippet: (snippet: string) => void;
  isModalOpen: boolean;
  onOpenCreateModal?: () => void;
  questionTypeLabel?: string;
  isEditing?: boolean;
}

export default function FormulaSliderDrawer({
  isOpen,
  onClose,
  activeTargetField,
  setActiveTargetField,
  availableFields,
  fieldValue,
  onUpdateFieldValue,
  onInsertSnippet,
  isModalOpen,
  onOpenCreateModal,
  questionTypeLabel = "Question",
  isEditing = false
}: FormulaSliderDrawerProps) {
  const [formulaCategory, setFormulaCategory] = useState<FormulaCategory>("algebra");
  const [searchQuery, setSearchQuery] = useState("");
  const [lastInserted, setLastInserted] = useState<string | null>(null);

  const handleInsert = (snippet: string) => {
    onInsertSnippet(snippet);
    setLastInserted(snippet);
    setTimeout(() => setLastInserted(null), 1800);
  };

  const filteredSymbols = useMemo(() => {
    if (!searchQuery.trim()) {
      return ALL_MATH_SYMBOLS.filter((s) => s.cat === formulaCategory);
    }
    const q = searchQuery.toLowerCase().trim();
    return ALL_MATH_SYMBOLS.filter(
      (s) =>
        s.label.toLowerCase().includes(q) ||
        s.title.toLowerCase().includes(q) ||
        s.kw.toLowerCase().includes(q) ||
        s.insert.toLowerCase().includes(q)
    );
  }, [searchQuery, formulaCategory]);

  return (
    <>
      {/* Backdrop for Mobile / Tablet */}
      <div
        className={`fixed inset-0 bg-slate-950/30 z-[65] transition-opacity duration-300 lg:hidden ${
          isOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        }`}
        onClick={onClose}
      />

      {/* Slide-over Drawer Panel */}
      <aside
        aria-label="Formula & Symbol Studio"
        className={`fixed inset-y-0 right-0 z-[70] w-full sm:w-[520px] md:w-[580px] lg:w-[620px] bg-white shadow-2xl flex flex-col border-l border-slate-200 transform transition-transform duration-300 ease-in-out ${
          isOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        {/* Drawer Header */}
        <div className="p-3 border-b border-slate-100 space-y-2 bg-gradient-to-b from-blue-50/70 via-white to-white shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-8 h-8 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-md shadow-blue-500/30 font-black">
                <Calculator className="w-4 h-4" />
              </span>
              <div>
                <h3 className="text-xs font-black uppercase tracking-wider text-slate-900 font-heading flex items-center gap-1.5">
                  <span>Formula & Symbol Studio</span>
                  <span className="bg-blue-100 text-blue-700 font-mono text-[9px] px-1.5 py-0.5 rounded-full font-bold">
                    200+ Symbols
                  </span>
                </h3>
                <span className="text-[10px] text-slate-500 font-medium">
                  {isModalOpen
                    ? isEditing
                      ? `Editing Question Bank item (${questionTypeLabel})`
                      : `Creating New Question (${questionTypeLabel})`
                    : "Interactive Math & Symbol Library"}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-1">
              {lastInserted && (
                <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-md flex items-center gap-1 animate-in fade-in duration-150">
                  <CheckCircle2 className="w-3 h-3" />
                  <span>Inserted!</span>
                </span>
              )}
              <button
                type="button"
                onClick={onClose}
                className="p-1.5 text-slate-400 hover:text-slate-800 rounded-lg hover:bg-slate-100 transition flex items-center gap-1 text-xs font-bold cursor-pointer"
                title="Close Slider"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* If Question Modal is NOT open, show helpful CTA */}
          {!isModalOpen && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-2.5 text-xs text-amber-900 flex items-center justify-between gap-2 shadow-2xs">
              <div className="space-y-0.5">
                <p className="font-bold text-[11px] flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                  <span>No question modal currently open</span>
                </p>
                <p className="text-[10px] text-amber-700">
                  Open a question to insert formulas, or create a new question now.
                </p>
              </div>
              {onOpenCreateModal && (
                <button
                  type="button"
                  onClick={() => {
                    onOpenCreateModal();
                  }}
                  className="px-2.5 py-1 text-[11px] font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shrink-0 flex items-center gap-1 shadow-xs cursor-pointer"
                >
                  <span>+ New Question</span>
                  <ArrowRight className="w-3 h-3" />
                </button>
              )}
            </div>
          )}

          {/* In-Drawer Focused Field Live Editor & KaTeX Preview HUD */}
          {isModalOpen && (
            <div className="bg-slate-900 text-white rounded-xl p-2.5 space-y-2 shadow-md border border-slate-800">
              {/* Target Field Switcher Tabs */}
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse shrink-0"></span>
                    <span className="text-[9px] font-black uppercase tracking-wider text-slate-400">
                      Active Target Field:
                    </span>
                  </div>
                  <span className="text-[9px] text-slate-400 font-mono">
                    {availableFields.find((f) => f.id === activeTargetField)?.label || "Field"}
                  </span>
                </div>

                <div className="flex flex-wrap gap-1 bg-slate-950/70 p-1 rounded-lg text-[9px] font-bold max-h-16 overflow-y-auto custom-scrollbar">
                  {availableFields.map((f) => (
                    <button
                      key={f.id}
                      type="button"
                      onClick={() => setActiveTargetField(f.id)}
                      className={`py-0.5 px-2 rounded transition text-center truncate cursor-pointer ${
                        activeTargetField === f.id
                          ? "bg-blue-600 text-white shadow-xs font-bold"
                          : "text-slate-400 hover:text-slate-200"
                      }`}
                    >
                      {f.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Live In-Drawer Editable Input */}
              <div className="space-y-1">
                <textarea
                  rows={2}
                  dir="auto"
                  value={fieldValue}
                  onChange={(e) => onUpdateFieldValue(e.target.value)}
                  placeholder="Click any symbol below or type directly..."
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-emerald-300 placeholder:text-slate-600 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 font-mono resize-none leading-relaxed"
                />

                {/* Real-time Live KaTeX Render Output */}
                <div className="bg-slate-950/90 border border-slate-800/80 rounded-lg px-2.5 py-1 min-h-[30px] flex items-center justify-between gap-2">
                  <div
                    dir="auto"
                    key={`preview-${activeTargetField}-${fieldValue}`}
                    className="render-math-target text-slate-100 text-xs font-serif overflow-x-auto py-0.5 leading-normal selection:bg-blue-600 flex-1 truncate"
                    dangerouslySetInnerHTML={{
                      __html: formatMarkdownPreview(fieldValue || "(empty field)")
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => handleInsert("$")}
                    className="text-[9px] font-bold text-amber-300 hover:text-amber-200 bg-amber-400/10 hover:bg-amber-400/20 px-1.5 py-0.5 rounded border border-amber-400/30 transition shrink-0 cursor-pointer"
                  >
                    Wrap $
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Rich Text Quick Formatter Strip */}
          <div className="flex items-center justify-between gap-1 bg-slate-50 px-2 py-1 rounded-lg border border-slate-200">
            <div className="flex items-center gap-0.5">
              <button
                type="button"
                onClick={() => handleInsert("**bold text**")}
                className="p-1 rounded hover:bg-white text-slate-700 hover:shadow-xs transition cursor-pointer"
                title="Bold (**text**)"
              >
                <Bold className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => handleInsert("*italic text*")}
                className="p-1 rounded hover:bg-white text-slate-700 hover:shadow-xs transition cursor-pointer"
                title="Italic (*text*)"
              >
                <Italic className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => handleInsert("<u>underlined text</u>")}
                className="p-1 rounded hover:bg-white text-slate-700 hover:shadow-xs transition cursor-pointer"
                title="Underline (<u>text</u>)"
              >
                <Underline className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => handleInsert("`code`")}
                className="p-1 rounded hover:bg-white text-slate-700 hover:shadow-xs transition cursor-pointer"
                title="Inline Code (`code`)"
              >
                <Code className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => handleInsert("> quote")}
                className="p-1 rounded hover:bg-white text-slate-700 hover:shadow-xs transition cursor-pointer"
                title="Blockquote"
              >
                <Quote className="w-3.5 h-3.5" />
              </button>
            </div>

            <span className="text-[10px] text-slate-400 font-mono">
              Click symbol below to insert
            </span>
          </div>

          {/* Real-time Search Input */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search 200+ symbols (e.g. integral, alpha, sin, matrix)..."
              className="w-full pl-8 pr-7 py-1.5 rounded-lg border border-slate-200 text-xs font-medium focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white placeholder:text-slate-400"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5 cursor-pointer"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>

          {/* Category Switcher Tabs */}
          {!searchQuery && (
            <div className="grid grid-cols-4 sm:grid-cols-8 gap-1 pt-0.5">
              {FORMULA_CATEGORIES.map((cat) => {
                const Icon = cat.icon;
                const isActive = formulaCategory === cat.id;

                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setFormulaCategory(cat.id as FormulaCategory)}
                    className={`py-1 px-1 rounded-lg text-[9.5px] font-bold flex flex-col items-center justify-center gap-0.5 border transition cursor-pointer ${
                      isActive
                        ? "bg-blue-600 text-white border-blue-600 shadow-xs"
                        : "bg-slate-50 text-slate-600 border-slate-200 hover:bg-white hover:text-blue-600"
                    }`}
                  >
                    <Icon className="w-3 h-3" />
                    <span className="truncate w-full text-center leading-none">{cat.label}</span>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Scrollable Symbol Body */}
        <div className="p-3 overflow-y-auto flex-1 space-y-2.5 custom-scrollbar">
          {searchQuery ? (
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider">
                  Search Results
                </span>
                <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">
                  {filteredSymbols.length} Matches
                </span>
              </div>

              <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 gap-1.5">
                {filteredSymbols.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => handleInsert(item.insert)}
                    title={`${item.title}: Click to insert ${item.insert}`}
                    className="h-8 px-1 rounded-lg bg-slate-50/90 hover:bg-blue-50 text-slate-800 hover:text-blue-700 text-[11px] font-serif font-bold border border-slate-200 hover:border-blue-400 transition-all text-center shadow-2xs hover:shadow-xs flex items-center justify-center group active:scale-95 cursor-pointer"
                  >
                    <span className="truncate w-full leading-none group-hover:text-blue-600 transition">
                      {item.label}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div>
              {/* Active Category Header */}
              <div className="flex items-center justify-between pb-1.5 mb-2 border-b border-slate-100">
                <span className="text-xs font-black uppercase text-blue-600 tracking-wider flex items-center gap-1.5">
                  <span>{FORMULA_CATEGORIES.find((c) => c.id === formulaCategory)?.label}</span>
                  <span className="text-slate-400 font-normal">
                    ({filteredSymbols.length} items)
                  </span>
                </span>
                <span className="text-[10px] font-mono text-slate-400">Click to insert</span>
              </div>

              {/* High Density Symbols Grid */}
              <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 gap-1.5">
                {filteredSymbols.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => handleInsert(item.insert)}
                    title={`${item.title}: Click to insert ${item.insert}`}
                    className="h-8 px-1 rounded-lg bg-slate-50/90 hover:bg-blue-50 text-slate-800 hover:text-blue-700 text-[11px] font-serif font-bold border border-slate-200 hover:border-blue-400 transition-all text-center shadow-2xs hover:shadow-xs flex items-center justify-center group active:scale-95 cursor-pointer"
                  >
                    <span className="truncate w-full leading-none group-hover:text-blue-600 transition">
                      {item.label}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Drawer Footer: Prebuilt Theorems & Close */}
        <div className="p-2.5 px-3 border-t border-slate-200 bg-slate-50 space-y-1.5 shrink-0">
          <div className="space-y-1">
            <span className="text-[9px] font-bold uppercase tracking-wider text-slate-500 block">
              Prebuilt Theorems & Identities
            </span>
            <select
              onChange={(e) => {
                if (e.target.value) {
                  handleInsert(e.target.value);
                  e.target.value = "";
                }
              }}
              className="w-full px-2.5 py-1.5 rounded-lg bg-white border border-slate-200 text-xs font-semibold text-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer"
            >
              <option value="">+ Insert Complete Theorem...</option>
              {PREBUILT_THEOREMS.map((t, idx) => (
                <option key={idx} value={t.value}>
                  {t.label}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center justify-between gap-2 pt-0.5">
            <span className="text-[10px] text-slate-500 font-medium">
              KaTeX LaTeX engine active
            </span>

            <button
              type="button"
              onClick={onClose}
              className="bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs px-4 py-1.5 rounded-lg transition shadow-sm cursor-pointer"
            >
              Done & Close
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
