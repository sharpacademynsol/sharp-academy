"use client";

import { useState, useEffect, useMemo } from "react";
import { 
  Database, 
  Search, 
  Filter, 
  Check, 
  X, 
  CheckCircle2, 
  CheckSquare, 
  HelpCircle, 
  Edit3, 
  ArrowRightLeft, 
  Hash, 
  FileText, 
  BookOpen, 
  Layers, 
  GraduationCap, 
  Tag, 
  Sparkles,
  ChevronDown,
  BrainCircuit
} from "lucide-react";
import { formatMarkdownPreview } from "@/lib/renderMath";
import { Question, QuestionType, createDefaultQuestion } from "./ExamEditor";
import { VERBAL_SUBTYPES } from "./verbalReasoningData";
import { NON_VERBAL_SUBTYPES } from "./nonVerbalShapes";

interface Course {
  id: number;
  title: string;
  code: string;
}

interface QuestionBankItem {
  id: number;
  course_id: number;
  course_title?: string;
  course_code?: string;
  topic?: string;
  difficulty: "easy" | "medium" | "hard";
  question_text: string;
  question_type: string;
  marks: number;
  options_json: string;
  correct_answer: string;
  explanation?: string;
  tags?: string;
  usage_count: number;
}

const TYPE_CONFIG: Record<string, { label: string; icon: any; color: string; bg: string }> = {
  mcq: { label: "Multiple Choice", icon: CheckCircle2, color: "text-blue-600", bg: "bg-blue-50 border-blue-200 text-blue-700" },
  multi_select: { label: "Multi-Select", icon: CheckSquare, color: "text-purple-600", bg: "bg-purple-50 border-purple-200 text-purple-700" },
  true_false: { label: "True / False", icon: HelpCircle, color: "text-emerald-600", bg: "bg-emerald-50 border-emerald-200 text-emerald-700" },
  fill_blank: { label: "Fill in Blanks", icon: Edit3, color: "text-amber-600", bg: "bg-amber-50 border-amber-200 text-amber-700" },
  column_mapping: { label: "Column Mapping", icon: ArrowRightLeft, color: "text-indigo-600", bg: "bg-indigo-50 border-indigo-200 text-indigo-700" },
  numerical: { label: "Numerical Calculation", icon: Hash, color: "text-cyan-600", bg: "bg-cyan-50 border-cyan-200 text-cyan-700" },
  short_answer: { label: "Short Answer", icon: FileText, color: "text-rose-600", bg: "bg-rose-50 border-rose-200 text-rose-700" },
  long_answer: { label: "Long Essay / Proof", icon: BookOpen, color: "text-violet-600", bg: "bg-violet-50 border-violet-200 text-violet-700" },
  verbal_reasoning: { label: "Verbal Reasoning", icon: BrainCircuit, color: "text-teal-600", bg: "bg-teal-50 border-teal-200 text-teal-700" },
  non_verbal: { label: "Non-Verbal Intelligence", icon: Layers, color: "text-orange-600", bg: "bg-orange-50 border-orange-200 text-orange-700" },
};

export function convertBankItemToExamQuestion(item: QuestionBankItem): Question {
  const base = createDefaultQuestion(item.question_type as QuestionType);
  const qId = "q-" + Date.now() + "-" + Math.random().toString(36).substring(2, 7);

  let optData: any = {};
  try {
    optData = item.options_json ? JSON.parse(item.options_json) : {};
  } catch {
    optData = {};
  }

  const q: Question = {
    ...base,
    id: qId,
    type: (item.question_type as QuestionType) || "mcq",
    text: item.question_text || "",
    marks: item.marks || 10,
    explanation: item.explanation || "",
    bank_question_id: item.id,
    is_modified_from_source: false,
    sync_to_bank: false,
    save_to_bank: false,
    topic: item.topic || "General",
    difficulty: item.difficulty || "medium",
    original_snapshot: JSON.stringify({
      text: item.question_text,
      marks: item.marks,
      explanation: item.explanation,
      options: item.options_json,
      correct: item.correct_answer
    })
  };

  const qType = item.question_type;

  if (qType === "mcq" || qType === "multi_select") {
    if (Array.isArray(optData)) {
      q.opt1 = optData[0]?.text || "";
      q.opt2 = optData[1]?.text || "";
      q.opt3 = optData[2]?.text || "";
      q.opt4 = optData[3]?.text || "";
    }
    if (qType === "mcq") {
      q.correct = String(item.correct_answer || "1");
    } else {
      try {
        q.correct_multi = Array.isArray(JSON.parse(item.correct_answer)) ? JSON.parse(item.correct_answer) : ["1"];
      } catch {
        q.correct_multi = ["1"];
      }
    }
  } else if (qType === "true_false") {
    q.correct_tf = String(item.correct_answer).toLowerCase() === "false" ? "false" : "true";
  } else if (qType === "fill_blank") {
    q.blank_answer = item.correct_answer || "";
    q.blank_alternatives = Array.isArray(optData.accepted) ? optData.accepted.join(" | ") : "";
    q.blank_placeholder = optData.placeholder || "Type your answer here...";
    q.blank_case_sensitive = !!optData.case_sensitive;
  } else if (qType === "column_mapping") {
    const leftArr = optData.left || [];
    const rightArr = optData.right || [];
    q.matching_pairs = leftArr.map((l: any, idx: number) => ({
      left: l.text || "",
      right: rightArr[idx]?.text || ""
    }));
  } else if (qType === "numerical") {
    q.num_exact = String(optData.exact ?? item.correct_answer ?? "0");
    q.num_tolerance = String(optData.tolerance ?? "0");
    q.num_unit = optData.unit || "";
  } else if (qType === "short_answer") {
    q.short_keywords = Array.isArray(optData.keywords) ? optData.keywords.join(", ") : "";
    q.short_model_answer = optData.model_answer || item.correct_answer || "";
  } else if (qType === "long_answer") {
    q.long_min_words = Number(optData.min_words) || 50;
    q.long_rubric = optData.rubric || "";
    q.long_model_answer = optData.model_answer || item.correct_answer || "";
  } else if (qType === "non_verbal") {
    q.nv_sub_type = optData.sub_type || "series";
    q.nv_problem_images = optData.problem_images || [];
    q.nv_options = optData.options || [];
    q.nv_correct = String(item.correct_answer || "1");
    q.nv_matrix_grid = optData.matrix_grid || "2x2";
  } else if (qType === "verbal_reasoning") {
    q.vr_sub_type = optData.sub_type || "analogy";
    q.vr_pair1_left = optData.pair1_left || "";
    q.vr_pair1_right = optData.pair1_right || "";
    q.vr_pair2_left = optData.pair2_left || "";
    q.vr_relationship_type = optData.relationship_type || "";
    q.vr_series_type = optData.series_type || "number";
    q.vr_series_tokens = Array.isArray(optData.series_tokens) ? optData.series_tokens : [];
    q.vr_rule_hint = optData.rule_hint || "";
    q.vr_words = Array.isArray(optData.words) ? optData.words : [];
    q.vr_group_category = optData.group_category || "";
    q.vr_odd_index = optData.odd_index;
    q.vr_source_word = optData.source_word || "";
    q.vr_coded_word = optData.coded_word || "";
    q.vr_target_word = optData.target_word || "";
    q.vr_coding_rule = optData.coding_rule || "";
    q.vr_premise = optData.premise || "";
    q.vr_clues = Array.isArray(optData.clues) ? optData.clues : [];
    q.vr_question_prompt = optData.question_prompt || "";
    q.vr_options = Array.isArray(optData.options) ? optData.options : [];
    q.vr_correct = String(item.correct_answer || "1");
  }

  return q;
}

export default function QuestionBankDrawer({
  isOpen,
  onClose,
  currentCourseId,
  courses,
  onImportQuestions,
  alreadyImportedIds
}: {
  isOpen: boolean;
  onClose: () => void;
  currentCourseId: string;
  courses: Course[];
  onImportQuestions: (questions: Question[]) => void;
  alreadyImportedIds: number[];
}) {
  const [items, setItems] = useState<QuestionBankItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Record<number, boolean>>({});
  
  // Filter States
  const [filterCourse, setFilterCourse] = useState<string>(currentCourseId || "all");
  const [filterType, setFilterType] = useState<string>("all");
  const [filterSubType, setFilterSubType] = useState<string>("all");
  const [filterDifficulty, setFilterDifficulty] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");

  // Sync filterCourse when currentCourseId changes
  useEffect(() => {
    if (currentCourseId) {
      setFilterCourse(currentCourseId);
    }
  }, [currentCourseId]);

  // Fetch Questions from API
  useEffect(() => {
    if (!isOpen) return;
    
    async function loadBank() {
      setIsLoading(true);
      try {
        const params = new URLSearchParams();
        if (filterCourse && filterCourse !== "all") params.set("course_id", filterCourse);
        if (filterType && filterType !== "all") params.set("type", filterType);
        if (filterSubType && filterSubType !== "all") params.set("sub_type", filterSubType);
        if (filterDifficulty && filterDifficulty !== "all") params.set("difficulty", filterDifficulty);
        if (searchQuery.trim()) params.set("search", searchQuery.trim());

        const res = await fetch(`/api/admin/question-bank?${params.toString()}`);
        if (!res.ok) throw new Error("Failed to load questions");
        const data = (await res.json()) as any;
        setItems(data.questions || []);
      } catch (err) {
        console.error("Failed to load question bank:", err);
      } finally {
        setIsLoading(false);
      }
    }

    const timer = setTimeout(loadBank, 200);
    return () => clearTimeout(timer);
  }, [isOpen, filterCourse, filterType, filterSubType, filterDifficulty, searchQuery]);

  // Toggle selection
  const toggleSelect = (id: number) => {
    setSelectedIds(prev => ({ ...prev, [id]: !prev[id] }));
  };

  // Select all visible
  const selectAll = () => {
    const next: Record<number, boolean> = { ...selectedIds };
    items.forEach(it => {
      if (!alreadyImportedIds.includes(it.id)) {
        next[it.id] = true;
      }
    });
    setSelectedIds(next);
  };

  // Deselect all
  const deselectAll = () => {
    setSelectedIds({});
  };

  // Import selected
  const handleImport = () => {
    const selectedItems = items.filter(it => selectedIds[it.id]);
    if (selectedItems.length === 0) return;

    const converted = selectedItems.map(convertBankItemToExamQuestion);
    onImportQuestions(converted);
    setSelectedIds({});
    onClose();
  };

  const selectedCount = Object.values(selectedIds).filter(Boolean).length;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-end animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-4xl h-full shadow-2xl flex flex-col border-l border-slate-200">
        
        {/* Drawer Header */}
        <div className="p-5 border-b border-slate-200 bg-slate-50 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-indigo-600 to-purple-600 text-white flex items-center justify-center shadow-md shadow-indigo-500/20">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-black text-slate-900 font-heading">
                Import from Question Bank
              </h2>
              <p className="text-xs text-slate-500">
                Browse, search, and select pre-approved questions into this question paper.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 flex items-center justify-center transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Filter Toolbar */}
        <div className="p-4 border-b border-slate-200 bg-white space-y-3 shrink-0">
          <div className="flex flex-col sm:flex-row gap-2.5">
            {/* Search */}
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                placeholder="Search statements, topics, formulas..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              />
              {searchQuery && (
                <button onClick={() => setSearchQuery("")} className="absolute right-2.5 top-2 text-slate-400 hover:text-slate-600">
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Course Filter */}
            <div className="w-full sm:w-56">
              <select
                value={filterCourse}
                onChange={(e) => setFilterCourse(e.target.value)}
                className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              >
                <option value="all">All Courses</option>
                {courses.map(c => (
                  <option key={c.id} value={String(c.id)}>{c.code} - {c.title}</option>
                ))}
              </select>
            </div>

            {/* Difficulty Filter */}
            <div className="w-full sm:w-36">
              <select
                value={filterDifficulty}
                onChange={(e) => setFilterDifficulty(e.target.value)}
                className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              >
                <option value="all">All Difficulties</option>
                <option value="easy">Easy</option>
                <option value="medium">Medium</option>
                <option value="hard">Hard</option>
              </select>
            </div>
          </div>

          {/* Type Filter Pills */}
          <div className="flex items-center justify-between gap-2 pt-1 border-t border-slate-100">
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
              <button
                onClick={() => {
                  setFilterType("all");
                  setFilterSubType("all");
                }}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition shrink-0 ${
                  filterType === "all" ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                All Formats
              </button>

              {Object.entries(TYPE_CONFIG).map(([typeKey, cfg]) => {
                const isSelected = filterType === typeKey;
                return (
                  <button
                    key={typeKey}
                    onClick={() => {
                      setFilterType(typeKey);
                      setFilterSubType("all");
                    }}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition shrink-0 ${
                      isSelected ? "bg-indigo-600 text-white" : "bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200"
                    }`}
                  >
                    {cfg.label}
                  </button>
                );
              })}
            </div>

            <div className="flex items-center gap-2 shrink-0 text-xs">
              <button
                onClick={selectAll}
                className="text-indigo-600 hover:underline font-bold text-[11px]"
              >
                Select All
              </button>
              <span className="text-slate-300">•</span>
              <button
                onClick={deselectAll}
                className="text-slate-500 hover:underline font-semibold text-[11px]"
              >
                Clear
              </button>
            </div>
          </div>

          {/* Subtype Filter Pills (When Verbal Reasoning is selected) */}
          {filterType === "verbal_reasoning" && (
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1.5 pt-1.5 border-t border-teal-100 bg-teal-50/50 -mx-4 px-4">
              <span className="text-[10px] font-bold text-teal-800 uppercase tracking-wider shrink-0 mr-1 flex items-center gap-1">
                <BrainCircuit className="w-3 h-3 text-teal-600" />
                <span>Subtype:</span>
              </span>
              <button
                onClick={() => setFilterSubType("all")}
                className={`px-2.5 py-0.5 rounded-lg text-[11px] font-bold transition shrink-0 ${
                  filterSubType === "all" ? "bg-teal-700 text-white shadow-2xs" : "bg-white text-teal-800 hover:bg-teal-100 border border-teal-200"
                }`}
              >
                All Verbal Subtypes
              </button>
              {VERBAL_SUBTYPES.map(sub => {
                const isSubSelected = filterSubType === sub.id;
                return (
                  <button
                    key={sub.id}
                    onClick={() => setFilterSubType(sub.id)}
                    className={`px-2.5 py-0.5 rounded-lg text-[11px] font-semibold transition shrink-0 flex items-center gap-1 ${
                      isSubSelected
                        ? "bg-teal-600 text-white shadow-2xs"
                        : "bg-white text-slate-700 hover:bg-teal-50 border border-teal-200/80"
                    }`}
                  >
                    <span>{sub.icon}</span>
                    <span>{sub.label}</span>
                  </button>
                );
              })}
            </div>
          )}

          {/* Subtype Filter Pills (When Non-Verbal is selected) */}
          {filterType === "non_verbal" && (
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1.5 pt-1.5 border-t border-orange-100 bg-orange-50/50 -mx-4 px-4">
              <span className="text-[10px] font-bold text-orange-800 uppercase tracking-wider shrink-0 mr-1 flex items-center gap-1">
                <Layers className="w-3 h-3 text-orange-600" />
                <span>Subtype:</span>
              </span>
              <button
                onClick={() => setFilterSubType("all")}
                className={`px-2.5 py-0.5 rounded-lg text-[11px] font-bold transition shrink-0 ${
                  filterSubType === "all" ? "bg-orange-700 text-white shadow-2xs" : "bg-white text-orange-800 hover:bg-orange-100 border border-orange-200"
                }`}
              >
                All Non-Verbal Subtypes
              </button>
              {NON_VERBAL_SUBTYPES.map(sub => {
                const isSubSelected = filterSubType === sub.id;
                return (
                  <button
                    key={sub.id}
                    onClick={() => setFilterSubType(sub.id)}
                    className={`px-2.5 py-0.5 rounded-lg text-[11px] font-semibold transition shrink-0 flex items-center gap-1 ${
                      isSubSelected
                        ? "bg-orange-600 text-white shadow-2xs"
                        : "bg-white text-slate-700 hover:bg-orange-50 border border-orange-200/80"
                    }`}
                  >
                    <span>{sub.icon}</span>
                    <span>{sub.label}</span>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Question List View */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-50/50">
          {isLoading ? (
            <div className="py-20 text-center text-xs text-slate-400">
              <Database className="w-8 h-8 mx-auto mb-2 text-indigo-400 animate-pulse" />
              <span>Loading questions from Question Bank...</span>
            </div>
          ) : items.length === 0 ? (
            <div className="py-20 text-center text-xs text-slate-400 bg-white rounded-2xl border border-slate-200 p-8">
              <Database className="w-8 h-8 mx-auto mb-2 text-slate-300" />
              <p className="font-bold text-slate-700 text-sm">No questions matched</p>
              <p className="text-slate-400 mt-1">Try modifying your search or filter settings.</p>
            </div>
          ) : (
            items.map((it) => {
              const isSelected = !!selectedIds[it.id];
              const isAlreadyInPaper = alreadyImportedIds.includes(it.id);
              const typeCfg = TYPE_CONFIG[it.question_type] || {
                label: it.question_type,
                icon: HelpCircle,
                bg: "bg-slate-50 text-slate-700 border-slate-200"
              };
              const TypeIcon = typeCfg.icon;

              const diffColor = 
                it.difficulty === "easy" 
                  ? "bg-emerald-50 text-emerald-700 border-emerald-200" 
                  : it.difficulty === "hard" 
                  ? "bg-rose-50 text-rose-700 border-rose-200" 
                  : "bg-amber-50 text-amber-700 border-amber-200";

              return (
                <div
                  key={it.id}
                  onClick={() => !isAlreadyInPaper && toggleSelect(it.id)}
                  className={`p-4 rounded-2xl border transition-all cursor-pointer relative ${
                    isAlreadyInPaper
                      ? "bg-slate-100/70 border-slate-200 opacity-60 cursor-not-allowed"
                      : isSelected
                      ? "bg-indigo-50/40 border-indigo-400 ring-2 ring-indigo-500/10 shadow-xs"
                      : "bg-white border-slate-200 hover:border-slate-300 shadow-xs"
                  }`}
                >
                  <div className="flex items-start gap-3">
                    {/* Checkbox */}
                    <div className="pt-0.5 shrink-0">
                      <div className={`w-5 h-5 rounded-lg border flex items-center justify-center transition ${
                        isAlreadyInPaper
                          ? "bg-slate-300 border-slate-400 text-slate-600"
                          : isSelected
                          ? "bg-indigo-600 border-indigo-600 text-white shadow-xs"
                          : "border-slate-300 bg-white"
                      }`}>
                        {(isSelected || isAlreadyInPaper) && <Check className="w-3.5 h-3.5" />}
                      </div>
                    </div>

                    <div className="flex-1 space-y-2 min-w-0">
                      {/* Meta Header */}
                      <div className="flex flex-wrap items-center gap-1.5 text-[10px]">
                        <span className="font-mono font-bold text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded">
                          #QB-{it.id}
                        </span>

                        {it.course_code && (
                          <span className="font-bold text-slate-700 bg-slate-50 border border-slate-200 px-1.5 py-0.5 rounded flex items-center gap-1">
                            <GraduationCap className="w-3 h-3 text-indigo-600" />
                            {it.course_code}
                          </span>
                        )}

                        {it.topic && (
                          <span className="font-medium text-slate-600 bg-slate-100 px-1.5 py-0.5 rounded">
                            {it.topic}
                          </span>
                        )}

                        <span className={`font-bold px-1.5 py-0.5 rounded border flex items-center gap-1 ${typeCfg.bg}`}>
                          <TypeIcon className="w-3 h-3" />
                          {typeCfg.label}
                        </span>

                        {it.question_type === "verbal_reasoning" && (() => {
                          let sub = "analogy";
                          try {
                            const parsed = it.options_json ? JSON.parse(it.options_json) : null;
                            if (parsed?.sub_type) sub = parsed.sub_type;
                          } catch {}
                          const subMeta = VERBAL_SUBTYPES.find(s => s.id === sub);
                          return (
                            <span className="font-bold px-1.5 py-0.5 rounded border text-[10px] bg-teal-50 text-teal-800 border-teal-200 flex items-center gap-1">
                              <span>{subMeta?.icon || "🧠"}</span>
                              <span>{subMeta?.label || sub}</span>
                            </span>
                          );
                        })()}

                        {it.question_type === "non_verbal" && (() => {
                          let sub = "series";
                          try {
                            const parsed = it.options_json ? JSON.parse(it.options_json) : null;
                            if (parsed?.sub_type) sub = parsed.sub_type;
                          } catch {}
                          const subMeta = NON_VERBAL_SUBTYPES.find(s => s.id === sub);
                          return (
                            <span className="font-bold px-1.5 py-0.5 rounded border text-[10px] bg-orange-50 text-orange-800 border-orange-200 flex items-center gap-1">
                              <span>{subMeta?.icon || "📐"}</span>
                              <span>{subMeta?.label || sub}</span>
                            </span>
                          );
                        })()}

                        <span className={`font-bold uppercase tracking-wider px-1.5 py-0.5 rounded border ${diffColor}`}>
                          {it.difficulty}
                        </span>

                        <span className="font-semibold text-slate-500 ml-auto">
                          {it.marks} Marks
                        </span>

                        {isAlreadyInPaper && (
                          <span className="bg-slate-200 text-slate-700 px-2 py-0.5 rounded font-bold text-[10px]">
                            Already in Paper
                          </span>
                        )}
                      </div>

                      {/* Statement Preview */}
                      <div
                        className="text-xs font-semibold text-slate-900 leading-relaxed overflow-x-auto"
                        dangerouslySetInnerHTML={{ __html: formatMarkdownPreview(it.question_text) }}
                      />

                      {/* Snippet for Non-Verbal or Answer */}
                      {it.question_type === "mcq" && it.correct_answer && (
                        <div className="text-[11px] text-slate-500 flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                          <span>Correct Option: <strong>Option {it.correct_answer}</strong></span>
                        </div>
                      )}

                      {/* Snippet for Non-Verbal Intelligence */}
                      {it.question_type === "non_verbal" && (() => {
                        let optData: any = {};
                        try { optData = it.options_json ? JSON.parse(it.options_json) : {}; } catch {}
                        const problemImages = optData.problem_images || [];

                        return (
                          <div className="mt-2 bg-slate-50 p-2 rounded-xl border border-slate-200/80 space-y-1.5">
                            {problemImages.length > 0 && (
                              <div className="flex items-center gap-1.5 overflow-x-auto py-0.5">
                                {problemImages.map((img: string, pIdx: number) => (
                                  <div key={pIdx} className="flex items-center gap-1.5 shrink-0">
                                    <div className="w-10 h-10 bg-white rounded-lg border border-slate-200 flex items-center justify-center p-1 shadow-2xs">
                                      <img src={img} alt={`Fig ${pIdx + 1}`} className="max-w-full max-h-full object-contain" />
                                    </div>
                                    <span className="text-slate-300 text-xs">→</span>
                                  </div>
                                ))}
                                <div className="w-10 h-10 bg-amber-50 rounded-lg border-2 border-dashed border-amber-400 flex flex-col items-center justify-center text-amber-600 shrink-0">
                                  <span className="text-sm font-black">?</span>
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })()}

                      {/* Snippet for Verbal Reasoning */}
                      {it.question_type === "verbal_reasoning" && (() => {
                        let optData: any = {};
                        try { optData = it.options_json ? JSON.parse(it.options_json) : {}; } catch {}
                        const subType = optData.sub_type || "analogy";

                        return (
                          <div className="mt-2 bg-teal-50/50 p-2 rounded-xl border border-teal-200/80 space-y-1 text-xs">
                            <div className="flex items-center gap-1.5 font-bold text-teal-800 text-[11px]">
                              <BrainCircuit className="w-3 h-3 text-teal-600" />
                              <span className="capitalize">{subType.replace(/_/g, " ")}</span>
                            </div>
                            {subType === "analogy" && (
                              <div className="text-[11px] font-medium text-slate-700">
                                {optData.pair1_left} : {optData.pair1_right} :: {optData.pair2_left} : [ ? ]
                              </div>
                            )}
                            {subType === "series" && Array.isArray(optData.series_tokens) && (
                              <div className="text-[11px] font-mono text-slate-700 flex items-center gap-1">
                                {optData.series_tokens.join(" ➔ ")} ➔ <span className="text-amber-700 font-bold">[ ? ]</span>
                              </div>
                            )}
                            {subType === "coding" && (
                              <div className="text-[11px] font-mono text-slate-700">
                                {optData.source_word} ➔ {optData.coded_word} :: {optData.target_word} ➔ [ ? ]
                              </div>
                            )}
                            {subType === "odd_one_out" && Array.isArray(optData.words) && (
                              <div className="text-[11px] text-slate-700">
                                Words: {optData.words.join(", ")}
                              </div>
                            )}
                          </div>
                        );
                      })()}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Bottom Action Footer */}
        <div className="p-4 border-t border-slate-200 bg-white flex items-center justify-between shrink-0">
          <div className="text-xs text-slate-600">
            <strong>{selectedCount}</strong> questions selected
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition"
            >
              Cancel
            </button>
            <button
              onClick={handleImport}
              disabled={selectedCount === 0}
              className="px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 transition shadow-sm disabled:opacity-40 flex items-center gap-1.5"
            >
              <Database className="w-4 h-4" />
              <span>Import {selectedCount > 0 ? `(${selectedCount}) Questions` : ""} to Exam</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
