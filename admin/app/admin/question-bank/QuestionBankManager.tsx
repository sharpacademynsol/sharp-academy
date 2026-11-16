"use client";

import { useState, useMemo, useEffect, useRef } from "react";
import Link from "next/link";
import { 
  Database, 
  Plus, 
  Search, 
  Filter, 
  CheckCircle2, 
  CheckSquare, 
  HelpCircle, 
  Edit3, 
  ArrowRightLeft, 
  Hash, 
  FileText, 
  BookOpen, 
  Layers, 
  Trash2, 
  Edit, 
  ExternalLink, 
  Sparkles, 
  Eye, 
  X, 
  Check, 
  AlertCircle,
  Tag,
  GraduationCap,
  FileSpreadsheet,
  XCircle,
  Palette,
  Image as ImageIcon,
  FolderUp,
  UploadCloud,
  Cloud,
  Loader2,
  BrainCircuit,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  Calculator
} from "lucide-react";

import { formatMarkdownPreview } from "@/lib/renderMath";
import { 
  getShapeSvg, 
  SHAPE_LIBRARY, 
  SHAPE_CATEGORIES, 
  NON_VERBAL_PRESETS,
  NON_VERBAL_SUBTYPES,
  NonVerbalSubType
} from "@/app/admin/exams/new/nonVerbalShapes";
import {
  VERBAL_REASONING_PRESETS,
  VERBAL_SUBTYPES,
  VerbalReasoningSubType,
  VerbalReasoningPreset
} from "@/app/admin/exams/new/verbalReasoningData";
import BulkImportModal from "./BulkImportModal";
import FormulaSliderDrawer from "./FormulaSliderDrawer";

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
  created_at?: string;
}

interface Stats {
  total: number;
  easy_count: number;
  medium_count: number;
  hard_count: number;
  mcq_count: number;
  non_verbal_count: number;
  verbal_count?: number;
  blank_count: number;
  num_count: number;
  total_usages: number;
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

export function getQuestionSubType(q: QuestionBankItem): string | null {
  if (q.question_type !== "verbal_reasoning" && q.question_type !== "non_verbal") {
    return null;
  }
  try {
    if (!q.options_json) return null;
    const parsed = typeof q.options_json === "string" ? JSON.parse(q.options_json) : q.options_json;
    if (parsed?.sub_type) return parsed.sub_type;
    return q.question_type === "verbal_reasoning" ? "analogy" : "series";
  } catch {
    return q.question_type === "verbal_reasoning" ? "analogy" : "series";
  }
}

export default function QuestionBankManager({
  courses,
  stats,
  initialQuestions
}: {
  courses: Course[];
  stats: Stats;
  initialQuestions: QuestionBankItem[];
}) {
  const [questions, setQuestions] = useState<QuestionBankItem[]>(initialQuestions);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCourse, setSelectedCourse] = useState<string>("");
  const [selectedType, setSelectedType] = useState<string>("");
  const [selectedSubType, setSelectedSubType] = useState<string>("");
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>("");

  // Determine if any filter or search query is currently active
  const hasActiveFilter = Boolean(
    (selectedCourse && selectedCourse !== "") ||
    (selectedType && selectedType !== "") ||
    (selectedSubType && selectedSubType !== "") ||
    (selectedDifficulty && selectedDifficulty !== "") ||
    searchQuery.trim()
  );

  // Modal State for Add / Edit
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isBulkImportOpen, setIsBulkImportOpen] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<QuestionBankItem | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Formula & Symbol Studio Slider Drawer State
  const [isFormulaDrawerOpen, setIsFormulaDrawerOpen] = useState(false);
  const [activeFormulaTarget, setActiveFormulaTarget] = useState<string>("question_text");

  // Shape Picker Modal State (for Non-Verbal questions)
  const [isShapePickerOpen, setIsShapePickerOpen] = useState(false);
  const [shapePickerTarget, setShapePickerTarget] = useState<{
    targetType: "problem" | "option";
    slotIndex: number;
  }>({ targetType: "problem", slotIndex: 0 });
  const [shapeCategory, setShapeCategory] = useState<string>("all");
  const [shapeSearch, setShapeSearch] = useState("");

  // Custom Shapes Stored Systematically in Cloudflare R2
  const [customShapes, setCustomShapes] = useState<Array<{
    id: number;
    name: string;
    file_url: string;
    r2_key?: string;
    mime_type?: string;
    svg_content?: string | null;
    tags?: string;
    created_at?: string;
  }>>([]);
  const [isUploadingShape, setIsUploadingShape] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [isDraggingShape, setIsDraggingShape] = useState(false);
  const shapeFileInputRef = useRef<HTMLInputElement>(null);

  const fetchCustomShapes = async () => {
    try {
      const res = await fetch("/api/admin/shapes");
      const data = (await res.json()) as any;
      if (data?.success && Array.isArray(data.shapes)) {
        setCustomShapes(data.shapes);
      }
    } catch (err) {
      console.error("Failed to load custom shapes:", err);
    }
  };

  useEffect(() => {
    fetchCustomShapes();
  }, []);

  // Lateral Data Load & Pagination State
  const [isDataLoading, setIsDataLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(50);

  // Themed Notice State
  const [actionNotice, setActionNotice] = useState<{ text: string; type: "success" | "error" } | null>(null);
  const showNotice = (text: string, type: "success" | "error" = "success") => {
    setActionNotice({ text, type });
    setTimeout(() => setActionNotice(null), 3500);
  };

  // Reset pagination on filter change
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedCourse, selectedType, selectedSubType, selectedDifficulty, searchQuery]);

  // Fetch questions on-demand from API based on active filter selections
  const fetchQuestions = async () => {
    const hasFilter = Boolean(
      (selectedCourse && selectedCourse !== "") ||
      (selectedType && selectedType !== "") ||
      (selectedSubType && selectedSubType !== "") ||
      (selectedDifficulty && selectedDifficulty !== "") ||
      searchQuery.trim()
    );

    if (!hasFilter) {
      setQuestions([]);
      setIsDataLoading(false);
      return;
    }

    setIsDataLoading(true);
    try {
      const params = new URLSearchParams();
      if (selectedCourse && selectedCourse !== "all") params.set("course_id", selectedCourse);
      if (selectedType && selectedType !== "all") params.set("type", selectedType);
      if (selectedSubType && selectedSubType !== "all") params.set("sub_type", selectedSubType);
      if (selectedDifficulty && selectedDifficulty !== "all") params.set("difficulty", selectedDifficulty);
      if (searchQuery.trim()) params.set("search", searchQuery.trim());
      params.set("limit", "all");

      const res = await fetch(`/api/admin/question-bank?${params.toString()}`);
      const data = (await res.json()) as any;
      if (data?.questions) {
        setQuestions(data.questions);
      }
    } catch (e: any) {
      console.error("Failed to load questions:", e);
      showNotice(e.message || "Failed to sync question bank", "error");
    } finally {
      setIsDataLoading(false);
    }
  };

  // Debounced reactive data loading when filter criteria changes
  useEffect(() => {
    if (!hasActiveFilter) {
      setQuestions([]);
      setIsDataLoading(false);
      return;
    }

    const timer = setTimeout(() => {
      fetchQuestions();
    }, searchQuery.trim() ? 300 : 0);

    return () => clearTimeout(timer);
  }, [selectedCourse, selectedType, selectedSubType, selectedDifficulty, searchQuery]);

  // Refresh Question Bank list
  const refreshQuestions = async () => {
    if (!hasActiveFilter) {
      // If user clicks refresh without an active filter, load all questions
      setSelectedType("all");
      return;
    }
    await fetchQuestions();
    showNotice("Questions synchronized from database.");
  };

  // Comprehensive Form State for ALL Question Types
  const [formData, setFormData] = useState({
    course_id: courses[0]?.id ? String(courses[0].id) : "1",
    topic: "General",
    difficulty: "medium" as "easy" | "medium" | "hard",
    question_type: "mcq",
    marks: 10,
    question_text: "",
    explanation: "",
    tags: "",

    // MCQ
    options: [
      { id: "1", text: "Option A" },
      { id: "2", text: "Option B" },
      { id: "3", text: "Option C" },
      { id: "4", text: "Option D" },
    ],
    correct_mcq: "1",

    // Multi-Select
    correct_multi: ["1"] as string[],

    // True / False
    correct_tf: "true" as "true" | "false",

    // Fill in Blanks
    blank_answer: "Ohm",
    blank_alternatives: "ohms | Ω",
    blank_case_sensitive: false,

    // Column Mapping
    matching_pairs: [
      { left: "Force ($F$)", right: "Newton (N)" },
      { left: "Energy ($E$)", right: "Joule (J)" },
      { left: "Power ($P$)", right: "Watt (W)" },
      { left: "Frequency ($f$)", right: "Hertz (Hz)" },
    ] as { left: string; right: string }[],

    // Numerical
    num_exact: "10",
    num_tolerance: "0.2",
    num_unit: "m/s²",

    // Short Answer
    short_model_answer: "Mitochondria produce ATP through aerobic cellular respiration.",
    short_keywords: "ATP, cellular respiration, powerhouse",

    // Long Answer
    long_model_answer: "Detailed step-by-step mathematical derivation showing momentum rate of change.",
    long_rubric: "Law Statement (2m), Vector Notation (3m), Final Proof (5m)",
    long_min_words: 50,

    // Non-Verbal
    nv_sub_type: "series" as "series" | "analogy" | "matrix" | "odd_one_out",
    nv_matrix_grid: "2x2" as "2x2" | "3x3",
    nv_problem_images: [
      getShapeSvg("quad_tr"),
      getShapeSvg("quad_br"),
      getShapeSvg("quad_bl")
    ] as string[],
    nv_options: [
      { id: "1", label: "A", image_url: getShapeSvg("quad_tl"), text: "Top-Left Shaded (Next)" },
      { id: "2", label: "B", image_url: getShapeSvg("quad_tr"), text: "Top-Right Shaded" },
      { id: "3", label: "C", image_url: getShapeSvg("quad_br"), text: "Bottom-Right Shaded" },
      { id: "4", label: "D", image_url: getShapeSvg("half_top"), text: "Top-Half Shaded" }
    ] as { id: string; label: string; image_url: string; text: string }[],
    nv_correct: "1",

    // Verbal Reasoning
    vr_sub_type: "analogy" as VerbalReasoningSubType,
    vr_pair1_left: "Doctor",
    vr_pair1_right: "Hospital",
    vr_pair2_left: "Teacher",
    vr_relationship_type: "Worker & Workplace (پیشہ اور کام کی جگہ)",

    vr_series_type: "number" as "number" | "letter" | "alphanumeric",
    vr_series_tokens: ["3", "6", "12", "24", "48"] as string[],
    vr_rule_hint: "Multiply by 2 at each step (×2 Progression)",

    vr_words: ["Copper", "Iron", "Wood", "Silver", "Gold"] as string[],
    vr_group_category: "Conductive Metallic Elements (دھاتیں)",
    vr_odd_index: 2,

    vr_source_word: "PEACE",
    vr_coded_word: "QFBDF",
    vr_target_word: "SMART",
    vr_coding_rule: "Each letter is shifted forward by +1 in the alphabet",

    vr_premise: "A boy points to a photograph and provides kinship clues:",
    vr_clues: [
      "Clue 1: 'My father\\'s only son' = The boy himself",
      "Clue 2: 'Daughter of the boy himself' = His own daughter"
    ] as string[],
    vr_question_prompt: "Who is the girl in the photograph to the boy?",

    vr_options: [
      { id: "1", label: "A", text: "School (اسکول)" },
      { id: "2", label: "B", text: "Chalk (چاک)" },
      { id: "3", label: "C", text: "Student (طالب علم)" },
      { id: "4", label: "D", text: "Book (کتاب)" }
    ] as { id: string; label: string; text: string }[],
    vr_correct: "1",
  });

  // Dynamic Available Fields for Formula Target Selection
  const availableFormulaFields = useMemo(() => {
    const fields: { id: string; label: string }[] = [
      { id: "question_text", label: "Statement" }
    ];

    if (formData.question_type === "mcq" || formData.question_type === "multi_select") {
      formData.options.forEach((_, idx) => {
        fields.push({ id: `option_${idx}`, label: `Option ${String.fromCharCode(65 + idx)}` });
      });
    } else if (formData.question_type === "fill_blank") {
      fields.push({ id: "blank_answer", label: "Target Blank" });
      fields.push({ id: "blank_alternatives", label: "Alternatives" });
    } else if (formData.question_type === "numerical") {
      fields.push({ id: "num_exact", label: "Exact Number" });
      fields.push({ id: "num_unit", label: "Unit" });
    } else if (formData.question_type === "column_mapping") {
      formData.matching_pairs.forEach((_, idx) => {
        fields.push({ id: `match_left_${idx}`, label: `Col A #${idx + 1}` });
        fields.push({ id: `match_right_${idx}`, label: `Col B #${idx + 1}` });
      });
    } else if (formData.question_type === "short_answer") {
      fields.push({ id: "short_model_answer", label: "Model Answer" });
      fields.push({ id: "short_keywords", label: "Keywords" });
    } else if (formData.question_type === "long_answer") {
      fields.push({ id: "long_model_answer", label: "Proof / Derivation" });
      fields.push({ id: "long_rubric", label: "Rubric" });
    }

    fields.push({ id: "explanation", label: "Explanation" });
    return fields;
  }, [formData.question_type, formData.options, formData.matching_pairs]);

  // Read current text value of active formula target
  const getTargetFieldVal = (fieldKey: string): string => {
    if (fieldKey === "question_text") return formData.question_text || "";
    if (fieldKey === "explanation") return formData.explanation || "";
    if (fieldKey === "blank_answer") return formData.blank_answer || "";
    if (fieldKey === "blank_alternatives") return formData.blank_alternatives || "";
    if (fieldKey === "num_exact") return formData.num_exact || "";
    if (fieldKey === "num_unit") return formData.num_unit || "";
    if (fieldKey === "short_model_answer") return formData.short_model_answer || "";
    if (fieldKey === "short_keywords") return formData.short_keywords || "";
    if (fieldKey === "long_model_answer") return formData.long_model_answer || "";
    if (fieldKey === "long_rubric") return formData.long_rubric || "";

    if (fieldKey.startsWith("option_")) {
      const idx = parseInt(fieldKey.replace("option_", ""), 10);
      return formData.options[idx]?.text || "";
    }

    if (fieldKey.startsWith("match_left_")) {
      const idx = parseInt(fieldKey.replace("match_left_", ""), 10);
      return formData.matching_pairs[idx]?.left || "";
    }

    if (fieldKey.startsWith("match_right_")) {
      const idx = parseInt(fieldKey.replace("match_right_", ""), 10);
      return formData.matching_pairs[idx]?.right || "";
    }

    return "";
  };

  // Update text value of active formula target
  const updateTargetFieldVal = (fieldKey: string, newVal: string) => {
    if (fieldKey === "question_text") {
      setFormData(prev => ({ ...prev, question_text: newVal }));
      return;
    }
    if (fieldKey === "explanation") {
      setFormData(prev => ({ ...prev, explanation: newVal }));
      return;
    }
    if (fieldKey === "blank_answer") {
      setFormData(prev => ({ ...prev, blank_answer: newVal }));
      return;
    }
    if (fieldKey === "blank_alternatives") {
      setFormData(prev => ({ ...prev, blank_alternatives: newVal }));
      return;
    }
    if (fieldKey === "num_exact") {
      setFormData(prev => ({ ...prev, num_exact: newVal }));
      return;
    }
    if (fieldKey === "num_unit") {
      setFormData(prev => ({ ...prev, num_unit: newVal }));
      return;
    }
    if (fieldKey === "short_model_answer") {
      setFormData(prev => ({ ...prev, short_model_answer: newVal }));
      return;
    }
    if (fieldKey === "short_keywords") {
      setFormData(prev => ({ ...prev, short_keywords: newVal }));
      return;
    }
    if (fieldKey === "long_model_answer") {
      setFormData(prev => ({ ...prev, long_model_answer: newVal }));
      return;
    }
    if (fieldKey === "long_rubric") {
      setFormData(prev => ({ ...prev, long_rubric: newVal }));
      return;
    }

    if (fieldKey.startsWith("option_")) {
      const idx = parseInt(fieldKey.replace("option_", ""), 10);
      setFormData(prev => ({
        ...prev,
        options: prev.options.map((opt, i) => i === idx ? { ...opt, text: newVal } : opt)
      }));
      return;
    }

    if (fieldKey.startsWith("match_left_")) {
      const idx = parseInt(fieldKey.replace("match_left_", ""), 10);
      setFormData(prev => ({
        ...prev,
        matching_pairs: prev.matching_pairs.map((p, i) => i === idx ? { ...p, left: newVal } : p)
      }));
      return;
    }

    if (fieldKey.startsWith("match_right_")) {
      const idx = parseInt(fieldKey.replace("match_right_", ""), 10);
      setFormData(prev => ({
        ...prev,
        matching_pairs: prev.matching_pairs.map((p, i) => i === idx ? { ...p, right: newVal } : p)
      }));
      return;
    }
  };

  // Intelligent snippet insertion with KaTeX dollar sign wrapping logic
  const insertFormulaSnippet = (snippet: string) => {
    const currentVal = getTargetFieldVal(activeFormulaTarget).trim();

    // Count unescaped dollar signs
    const dollarMatches = currentVal.match(/(?<!\\)\$/g);
    const count = dollarMatches ? dollarMatches.length : 0;
    const isInsideMath = count % 2 === 1;

    let textToInsert = snippet;
    let newVal = "";

    if (isInsideMath) {
      if (snippet.startsWith("$") && snippet.endsWith("$")) {
        textToInsert = snippet.slice(1, -1);
      }
      newVal = currentVal + (currentVal ? " " : "") + textToInsert;
    } else if (currentVal.endsWith("$") && snippet.startsWith("$") && snippet.endsWith("$")) {
      const base = currentVal.slice(0, -1).trim();
      const inner = snippet.slice(1);
      newVal = base + " " + inner;
    } else {
      newVal = (currentVal ? currentVal + " " : "") + textToInsert;
    }

    updateTargetFieldVal(activeFormulaTarget, newVal);
  };

  // Filtered Questions (Calculated only when a filter is active)
  const filteredQuestions = useMemo(() => {
    if (!hasActiveFilter) return [];
    return questions.filter((q) => {
      if (selectedCourse && selectedCourse !== "all" && String(q.course_id) !== selectedCourse) return false;
      if (selectedType && selectedType !== "all" && q.question_type !== selectedType) return false;
      if (selectedDifficulty && selectedDifficulty !== "all" && q.difficulty !== selectedDifficulty) return false;

      // Subtype Filter
      if (selectedSubType && selectedSubType !== "all") {
        const sub = getQuestionSubType(q);
        if (sub !== selectedSubType) return false;
      }

      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const textMatch = q.question_text?.toLowerCase().includes(query);
        const topicMatch = q.topic?.toLowerCase().includes(query);
        const tagMatch = q.tags?.toLowerCase().includes(query);
        const codeMatch = q.course_code?.toLowerCase().includes(query);
        if (!textMatch && !topicMatch && !tagMatch && !codeMatch) return false;
      }

      return true;
    });
  }, [questions, selectedCourse, selectedType, selectedSubType, selectedDifficulty, searchQuery, hasActiveFilter]);

  // Lateral Paginated Windowing for High-Performance Rendering
  const totalPages = Math.max(1, Math.ceil(filteredQuestions.length / pageSize));
  const paginatedQuestions = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredQuestions.slice(start, start + pageSize);
  }, [filteredQuestions, currentPage, pageSize]);

  // Subtype counts for Verbal Reasoning (dynamically respecting Course & Difficulty filters)
  const verbalSubCounts = useMemo(() => {
    const counts: Record<string, number> = { all: 0 };
    VERBAL_SUBTYPES.forEach(s => { counts[s.id] = 0; });
    questions.forEach(q => {
      if (q.question_type === "verbal_reasoning") {
        if (selectedCourse !== "all" && String(q.course_id) !== selectedCourse) return;
        if (selectedDifficulty !== "all" && q.difficulty !== selectedDifficulty) return;
        counts.all++;
        const sub = getQuestionSubType(q) || "analogy";
        counts[sub] = (counts[sub] || 0) + 1;
      }
    });
    return counts;
  }, [questions, selectedCourse, selectedDifficulty]);

  // Subtype counts for Non-Verbal (dynamically respecting Course & Difficulty filters)
  const nonVerbalSubCounts = useMemo(() => {
    const counts: Record<string, number> = { all: 0 };
    NON_VERBAL_SUBTYPES.forEach(s => { counts[s.id] = 0; });
    questions.forEach(q => {
      if (q.question_type === "non_verbal") {
        if (selectedCourse !== "all" && String(q.course_id) !== selectedCourse) return;
        if (selectedDifficulty !== "all" && q.difficulty !== selectedDifficulty) return;
        counts.all++;
        const sub = getQuestionSubType(q) || "series";
        counts[sub] = (counts[sub] || 0) + 1;
      }
    });
    return counts;
  }, [questions, selectedCourse, selectedDifficulty]);

  // Open modal for Create (with initial question type and subtype matching filter)
  const handleOpenCreate = (initialType: string = "mcq", initialSubType?: string) => {
    setEditingQuestion(null);
    setActiveFormulaTarget("question_text");
    let defaultStatement = "State your question here. Formulas like $E = mc^2$ or $\\int x dx$ render in KaTeX.";
    let defaultTopic = "General Concepts";

    if (initialType === "non_verbal") {
      defaultStatement = "Look at the pattern sequence below. Which figure should logically replace the question mark (?) in the series? / پیٹرن کے تسلسل کو دیکھ کر درست شکل کا انتخاب کریں:";
      defaultTopic = "Non-Verbal Intelligence";
    } else if (initialType === "multi_select") {
      defaultStatement = "Select all correct options from the choices below:";
      defaultTopic = "Multi-Select Concepts";
    } else if (initialType === "true_false") {
      defaultStatement = "Determine whether the following statement is factually True or False:";
      defaultTopic = "Factual Knowledge";
    } else if (initialType === "fill_blank") {
      defaultStatement = "The physical unit of electrical resistance in the SI system is the ____.";
      defaultTopic = "Units & Constants";
    } else if (initialType === "column_mapping") {
      defaultStatement = "Match each item in Column A with its corresponding pair in Column B:";
      defaultTopic = "Concepts Mapping";
    } else if (initialType === "numerical") {
      defaultStatement = "Calculate the acceleration ($a$) of a 5 kg mass subjected to a net force of 50 N.";
      defaultTopic = "Mechanics Calculation";
    } else if (initialType === "short_answer") {
      defaultStatement = "Briefly explain the primary function of mitochondria in eukaryotic cells.";
      defaultTopic = "Cell Biology";
    } else if (initialType === "long_answer") {
      defaultStatement = "State and derive Newton's Second Law of Motion ($F = ma$) from first principles.";
      defaultTopic = "Theoretical Physics";
    } else if (initialType === "verbal_reasoning") {
      defaultStatement = "Choose the word that has the same relationship to Teacher as Hospital has to Doctor: / وہ لفظ منتخب کریں جس کا استاد کے ساتھ وہی تعلق ہو جو ہسپتال کا ڈاکٹر سے ہے:";
      defaultTopic = "Verbal Reasoning - Analogies";
    }

    // Verbal Subtype Customizations
    let vrSubType: VerbalReasoningSubType = "analogy";
    let vrTokens = ["3", "6", "12", "24", "48"];
    let vrRuleHint = "Multiply by 2 at each step (×2 Progression)";
    let vrWords = ["Copper", "Iron", "Wood", "Silver", "Gold"];
    let vrGroupCat = "Conductive Metallic Elements (دھاتیں)";
    let vrOddIdx = 2;
    let vrSourceWord = "PEACE";
    let vrCodedWord = "QFBDF";
    let vrTargetWord = "SMART";
    let vrCodingRule = "Each letter is shifted forward by +1 in the alphabet";
    let vrPremise = "A boy points to a photograph and provides kinship clues:";
    let vrClues = [
      "Clue 1: 'My father\\'s only son' = The boy himself",
      "Clue 2: 'Daughter of the boy himself' = His own daughter"
    ];
    let vrQuestionPrompt = "Who is the girl in the photograph to the boy?";
    let vrOpts = [
      { id: "1", label: "A", text: "School (اسکول)" },
      { id: "2", label: "B", text: "Chalk (چاک)" },
      { id: "3", label: "C", text: "Student (طالب علم)" },
      { id: "4", label: "D", text: "Book (کتاب)" }
    ];
    let vrCorrect = "1";

    if (initialType === "verbal_reasoning") {
      if (initialSubType && initialSubType !== "all") {
        vrSubType = initialSubType as VerbalReasoningSubType;
      }
      if (vrSubType === "series") {
        defaultStatement = "Find the next missing number in the sequence: / نیچے دیے گئے تسلسل میں اگلا عدد معلوم کریں:";
        defaultTopic = "Verbal Reasoning - Number Series";
        vrTokens = ["3", "6", "12", "24", "48"];
        vrRuleHint = "Multiply each term by 2 (Geometric ×2 progression)";
        vrOpts = [
          { id: "1", label: "A", text: "96" },
          { id: "2", label: "B", text: "72" },
          { id: "3", label: "C", text: "84" },
          { id: "4", label: "D", text: "108" }
        ];
        vrCorrect = "1";
      } else if (vrSubType === "odd_one_out") {
        defaultStatement = "Identify the word that does NOT belong to the same group as the others: / نیچے دیے گئے الفاظ میں سے غیر متعلق لفظ کی نشاندہی کریں:";
        defaultTopic = "Verbal Reasoning - Classification";
        vrWords = ["Copper", "Iron", "Wood", "Silver", "Gold"];
        vrGroupCat = "Conductive Metallic Elements (دھاتیں)";
        vrOddIdx = 2;
        vrOpts = [
          { id: "1", label: "A", text: "Copper (تانبا)" },
          { id: "2", label: "B", text: "Iron (لوہا)" },
          { id: "3", label: "C", text: "Wood (لکڑی - غیر متعلق)" },
          { id: "4", label: "D", text: "Silver (چاندی)" },
          { id: "5", label: "E", text: "Gold (سونا)" }
        ];
        vrCorrect = "3";
      } else if (vrSubType === "coding") {
        defaultStatement = "If PEACE is coded as QFBDF, what will be the code for SMART? / اگر PEACE کا کوڈ QFBDF ہے تو SMART کا کوڈ کیا ہوگا؟";
        defaultTopic = "Verbal Reasoning - Coding & Decoding";
        vrSourceWord = "PEACE";
        vrCodedWord = "QFBDF";
        vrTargetWord = "SMART";
        vrCodingRule = "Each letter is shifted forward by +1 in the alphabet (Caesar +1)";
        vrOpts = [
          { id: "1", label: "A", text: "TNBSU" },
          { id: "2", label: "B", text: "TMCST" },
          { id: "3", label: "C", text: "RNBQS" },
          { id: "4", label: "D", text: "SMBRT" }
        ];
        vrCorrect = "1";
      } else if (vrSubType === "blood_relations") {
        defaultStatement = "Pointing towards a person, a man said: 'His only brother is the father of my daughter\\'s father.' How is the person related to the man? / ایک شخص کی طرف اشارہ کرتے ہوئے ایک آدمی نے کہا: 'اس کا اکلوتا بھائی میری بیٹی کے والد کا والد ہے۔' وہ شخص اس آدمی کا کیا لگتا ہے؟";
        defaultTopic = "Verbal Reasoning - Blood Relations";
        vrPremise = "Pointing to a man, a speaker deduces relations:";
        vrClues = [
          "Clue 1: 'My daughter\\'s father' = The speaker himself",
          "Clue 2: 'Father of the speaker' = The speaker's father",
          "Clue 3: 'His only brother is speaker\\'s father' = Paternal Uncle"
        ];
        vrQuestionPrompt = "What is the relationship of the person to the speaker?";
        vrOpts = [
          { id: "1", label: "A", text: "Uncle (چچا / تایا)" },
          { id: "2", label: "B", text: "Father (والد)" },
          { id: "3", label: "C", text: "Brother (بھائی)" },
          { id: "4", label: "D", text: "Grandfather (دادا)" }
        ];
        vrCorrect = "1";
      }
    }

    // Non-Verbal Subtype Customizations
    let nvSubType: "series" | "analogy" | "matrix" | "odd_one_out" = "series";
    let nvMatrixGrid: "2x2" | "3x3" = "2x2";
    let nvProblemImages: string[] = [
      getShapeSvg("quad_tr"),
      getShapeSvg("quad_br"),
      getShapeSvg("quad_bl")
    ];
    let nvOptions = [
      { id: "1", label: "A", image_url: getShapeSvg("quad_tl"), text: "Top-Left Shaded (Next)" },
      { id: "2", label: "B", image_url: getShapeSvg("quad_tr"), text: "Top-Right Shaded" },
      { id: "3", label: "C", image_url: getShapeSvg("quad_br"), text: "Bottom-Right Shaded" },
      { id: "4", label: "D", image_url: getShapeSvg("half_top"), text: "Top-Half Shaded" }
    ];
    let nvCorrect = "1";

    if (initialType === "non_verbal") {
      if (initialSubType && initialSubType !== "all") {
        nvSubType = initialSubType as any;
      }
      if (nvSubType === "analogy") {
        defaultStatement = "Figure A is related to Figure B in a certain way. By following the same relationship, select the correct figure from options (A-D) that replaces the question mark (?) for Figure C: / شکل A کا شکل B سے ایک خاص تعلق ہے۔ اسی اصول پر شکل C کیلئے متبادل شکل تلاش کریں:";
        defaultTopic = "Non-Verbal Intelligence - Analogies";
        nvProblemImages = [getShapeSvg("sq_white"), getShapeSvg("sq_black"), getShapeSvg("cir_white"), getShapeSvg("placeholder_qmark")];
        nvOptions = [
          { id: "1", label: "A", image_url: getShapeSvg("cir_black"), text: "Solid Shaded Circle" },
          { id: "2", label: "B", image_url: getShapeSvg("sq_white"), text: "Hollow Square" },
          { id: "3", label: "C", image_url: getShapeSvg("tri_white"), text: "Hollow Triangle" },
          { id: "4", label: "D", image_url: getShapeSvg("cir_white"), text: "Hollow Circle" },
        ];
        nvCorrect = "1";
      } else if (nvSubType === "matrix") {
        defaultStatement = "Complete the 2×2 matrix puzzle by discovering the transformation rules across rows and columns. Select the missing figure: / میٹرکس کی نامکمل جگہ پر آنے والی درست شکل کا انتخاب کریں:";
        defaultTopic = "Non-Verbal Intelligence - Matrix Completion";
        nvMatrixGrid = "2x2";
        nvProblemImages = [getShapeSvg("cir_white"), getShapeSvg("cir_black"), getShapeSvg("sq_white"), getShapeSvg("placeholder_qmark")];
        nvOptions = [
          { id: "1", label: "A", image_url: getShapeSvg("sq_black"), text: "Solid Black Square" },
          { id: "2", label: "B", image_url: getShapeSvg("tri_white"), text: "Hollow Triangle" },
          { id: "3", label: "C", image_url: getShapeSvg("half_top"), text: "Top-Half Shaded" },
          { id: "4", label: "D", image_url: getShapeSvg("star_white"), text: "Hollow Star" },
        ];
        nvCorrect = "1";
      } else if (nvSubType === "odd_one_out") {
        defaultStatement = "Four of the five figures share a common geometric property. Select the ONE figure that is the Odd One Out: / ان پانچ اشکال میں سے چار میں یکسانیت ہے۔ مختلف شکل منتخب کریں:";
        defaultTopic = "Non-Verbal Intelligence - Odd One Out";
        nvProblemImages = [];
        nvOptions = [
          { id: "1", label: "A", image_url: getShapeSvg("sq_white"), text: "Figure A (Hollow Square)" },
          { id: "2", label: "B", image_url: getShapeSvg("cir_white"), text: "Figure B (Hollow Circle)" },
          { id: "3", label: "C", image_url: getShapeSvg("tri_white"), text: "Figure C (Hollow Triangle)" },
          { id: "4", label: "D", image_url: getShapeSvg("star_white"), text: "Figure D (Hollow Star)" },
          { id: "5", label: "E", image_url: getShapeSvg("poly_shaded"), text: "Figure E (Shaded Polygon - Odd)" },
        ];
        nvCorrect = "5";
      }
    }

    setFormData({
      course_id: courses[0]?.id ? String(courses[0].id) : "1",
      topic: defaultTopic,
      difficulty: "medium",
      question_type: initialType,
      marks: 10,
      question_text: defaultStatement,
      explanation: "",
      tags: `${initialType}, general`,

      options: [
        { id: "1", text: "Option A" },
        { id: "2", text: "Option B" },
        { id: "3", text: "Option C" },
        { id: "4", text: "Option D" },
      ],
      correct_mcq: "1",
      correct_multi: ["1"],
      correct_tf: "true",

      blank_answer: "Ohm",
      blank_alternatives: "ohms | Ω",
      blank_case_sensitive: false,

      matching_pairs: [
        { left: "Force ($F$)", right: "Newton (N)" },
        { left: "Energy ($E$)", right: "Joule (J)" },
        { left: "Power ($P$)", right: "Watt (W)" },
        { left: "Frequency ($f$)", right: "Hertz (Hz)" },
      ],

      num_exact: "10",
      num_tolerance: "0.2",
      num_unit: "m/s²",

      short_model_answer: "Mitochondria produce ATP through aerobic cellular respiration.",
      short_keywords: "ATP, cellular respiration, powerhouse",

      long_model_answer: "Detailed derivation showing momentum rate of change: dp/dt = m(dv/dt) = ma.",
      long_rubric: "Law Statement (2m), Vector Notation (3m), Final Proof (5m)",
      long_min_words: 50,

      nv_sub_type: nvSubType,
      nv_matrix_grid: nvMatrixGrid,
      nv_problem_images: nvProblemImages,
      nv_options: nvOptions,
      nv_correct: nvCorrect,

      // Verbal Reasoning
      vr_sub_type: vrSubType,
      vr_pair1_left: "Doctor",
      vr_pair1_right: "Hospital",
      vr_pair2_left: "Teacher",
      vr_relationship_type: "Worker & Workplace (پیشہ اور کام کی جگہ)",
      vr_series_type: "number",
      vr_series_tokens: vrTokens,
      vr_rule_hint: vrRuleHint,
      vr_words: vrWords,
      vr_group_category: vrGroupCat,
      vr_odd_index: vrOddIdx,
      vr_source_word: vrSourceWord,
      vr_coded_word: vrCodedWord,
      vr_target_word: vrTargetWord,
      vr_coding_rule: vrCodingRule,
      vr_premise: vrPremise,
      vr_clues: vrClues,
      vr_question_prompt: vrQuestionPrompt,
      vr_options: vrOpts,
      vr_correct: vrCorrect,
    });

    setIsModalOpen(true);
  };

  // Open modal for Edit
  const handleOpenEdit = (q: QuestionBankItem) => {
    setEditingQuestion(q);
    setActiveFormulaTarget("question_text");
    let parsedOpts: any = {};
    try {
      parsedOpts = q.options_json ? JSON.parse(q.options_json) : {};
    } catch {}

    const qType = q.question_type || "mcq";

    // Options for MCQ / Multi-select
    let options = [
      { id: "1", text: "Option A" },
      { id: "2", text: "Option B" },
      { id: "3", text: "Option C" },
      { id: "4", text: "Option D" },
    ];
    if (Array.isArray(parsedOpts)) {
      options = parsedOpts.map((o: any, idx: number) => ({
        id: String(o.id || idx + 1),
        text: o.text || ""
      }));
    }

    // Multi-Select correct
    let correctMulti: string[] = ["1"];
    try {
      if (q.correct_answer && q.correct_answer.startsWith("[")) {
        correctMulti = JSON.parse(q.correct_answer);
      } else if (q.correct_answer) {
        correctMulti = [q.correct_answer];
      }
    } catch {
      correctMulti = [q.correct_answer || "1"];
    }

    // Fill in blanks
    let blankAns = q.correct_answer || "";
    let blankAlts = "";
    let blankCaseSensitive = false;
    if (parsedOpts && typeof parsedOpts === "object" && !Array.isArray(parsedOpts)) {
      if (Array.isArray(parsedOpts.accepted)) {
        blankAns = parsedOpts.accepted[0] || q.correct_answer || "";
        blankAlts = parsedOpts.accepted.slice(1).join(" | ");
      }
      blankCaseSensitive = !!parsedOpts.case_sensitive;
    }

    // Column mapping
    let matchingPairs = [
      { left: "Item 1", right: "Match 1" },
      { left: "Item 2", right: "Match 2" },
    ];
    if (parsedOpts?.left && parsedOpts?.right && Array.isArray(parsedOpts.left) && Array.isArray(parsedOpts.right)) {
      matchingPairs = parsedOpts.left.map((l: any, i: number) => ({
        left: l.text || "",
        right: parsedOpts.right[i]?.text || ""
      }));
    }

    // Numerical
    const numExact = parsedOpts?.exact !== undefined ? String(parsedOpts.exact) : (q.correct_answer?.replace(/[^0-9.-]/g, "") || "");
    const numTolerance = parsedOpts?.tolerance !== undefined ? String(parsedOpts.tolerance) : "0";
    const numUnit = parsedOpts?.unit || "";

    // Short & Long answer
    const shortModel = parsedOpts?.model_answer || q.correct_answer || "";
    const shortKw = Array.isArray(parsedOpts?.keywords) ? parsedOpts.keywords.join(", ") : "";
    const longModel = parsedOpts?.model_answer || q.correct_answer || "";
    const longRub = parsedOpts?.rubric || "";
    const longMin = parsedOpts?.min_words || 50;

    // Non-Verbal
    const nvSubType = (parsedOpts?.sub_type || "series") as "series" | "analogy" | "matrix" | "odd_one_out";
    const nvMatrixGrid = (parsedOpts?.matrix_grid || "2x2") as "2x2" | "3x3";
    const nvProblemImages = Array.isArray(parsedOpts?.problem_images) ? parsedOpts.problem_images : [];
    const nvOptions = Array.isArray(parsedOpts?.options) ? parsedOpts.options : [
      { id: "1", label: "A", image_url: "", text: "Option A" },
      { id: "2", label: "B", image_url: "", text: "Option B" },
      { id: "3", label: "C", image_url: "", text: "Option C" },
      { id: "4", label: "D", image_url: "", text: "Option D" },
    ];
    const nvCorrect = q.correct_answer || "1";

    setFormData({
      course_id: String(q.course_id),
      topic: q.topic || "General",
      difficulty: q.difficulty || "medium",
      question_type: qType,
      marks: q.marks || 10,
      question_text: q.question_text || "",
      explanation: q.explanation || "",
      tags: q.tags || "",

      options,
      correct_mcq: q.correct_answer || "1",
      correct_multi: correctMulti,
      correct_tf: q.correct_answer === "false" ? "false" : "true",

      blank_answer: blankAns,
      blank_alternatives: blankAlts,
      blank_case_sensitive: blankCaseSensitive,

      matching_pairs: matchingPairs,

      num_exact: numExact,
      num_tolerance: numTolerance,
      num_unit: numUnit,

      short_model_answer: shortModel,
      short_keywords: shortKw,

      long_model_answer: longModel,
      long_rubric: longRub,
      long_min_words: longMin,

      nv_sub_type: nvSubType,
      nv_matrix_grid: nvMatrixGrid,
      nv_problem_images: nvProblemImages,
      nv_options: nvOptions,
      nv_correct: nvCorrect,

      // Verbal Reasoning
      vr_sub_type: (parsedOpts?.sub_type || "analogy") as VerbalReasoningSubType,
      vr_pair1_left: parsedOpts?.pair1_left || "Doctor",
      vr_pair1_right: parsedOpts?.pair1_right || "Hospital",
      vr_pair2_left: parsedOpts?.pair2_left || "Teacher",
      vr_relationship_type: parsedOpts?.relationship_type || "Worker & Workplace (پیشہ اور کام کی جگہ)",
      vr_series_type: (parsedOpts?.series_type || "number") as "number" | "letter" | "alphanumeric",
      vr_series_tokens: Array.isArray(parsedOpts?.series_tokens) ? parsedOpts.series_tokens : ["3", "6", "12", "24", "48"],
      vr_rule_hint: parsedOpts?.rule_hint || "",
      vr_words: Array.isArray(parsedOpts?.words) ? parsedOpts.words : ["Copper", "Iron", "Wood", "Silver", "Gold"],
      vr_group_category: parsedOpts?.group_category || "",
      vr_odd_index: typeof parsedOpts?.odd_index === "number" ? parsedOpts.odd_index : 2,
      vr_source_word: parsedOpts?.source_word || "PEACE",
      vr_coded_word: parsedOpts?.coded_word || "QFBDF",
      vr_target_word: parsedOpts?.target_word || "SMART",
      vr_coding_rule: parsedOpts?.coding_rule || "",
      vr_premise: parsedOpts?.premise || "",
      vr_clues: Array.isArray(parsedOpts?.clues) ? parsedOpts.clues : [],
      vr_question_prompt: parsedOpts?.question_prompt || "",
      vr_options: Array.isArray(parsedOpts?.options) && parsedOpts.options.length > 0 ? parsedOpts.options : [
        { id: "1", label: "A", text: "Option A" },
        { id: "2", label: "B", text: "Option B" },
        { id: "3", label: "C", text: "Option C" },
        { id: "4", label: "D", text: "Option D" },
      ],
      vr_correct: q.correct_answer || "1",
    });

    setIsModalOpen(true);
  };

  // Switch Non-Verbal Sub-Type with dedicated defaults & interfaces
  const switchNonVerbalSubType = (newSubType: "series" | "analogy" | "matrix" | "odd_one_out") => {
    setFormData(prev => {
      let problemImages = [...prev.nv_problem_images];
      let options = [...prev.nv_options];
      let correct = prev.nv_correct;
      let questionText = prev.question_text;
      const matrixGrid = prev.nv_matrix_grid || "2x2";

      if (newSubType === "odd_one_out") {
        problemImages = [];
        if (!questionText || questionText.includes("pattern sequence") || questionText.includes("Figure A is to") || questionText.includes("rules across rows")) {
          questionText = "Four of the five figures share a common geometric property. Select the ONE figure that is the Odd One Out: / ان پانچ اشکال میں سے چار میں یکسانیت ہے۔ مختلف شکل منتخب کریں:";
        }
        if (options.length < 5) {
          while (options.length < 5) {
            const ltr = String.fromCharCode(65 + options.length);
            options.push({
              id: String(options.length + 1),
              label: ltr,
              image_url: "",
              text: `Figure ${ltr}`
            });
          }
        }
        if (!options.some(o => o.id === correct)) {
          correct = options[options.length - 1]?.id || "5";
        }
      } else if (newSubType === "analogy") {
        if (problemImages.length !== 3) {
          problemImages = [
            getShapeSvg("nest_circ_in_sq"),
            getShapeSvg("nest_sq_in_circ"),
            getShapeSvg("nest_tri_in_sq")
          ];
        }
        if (!questionText || questionText.includes("Odd One Out") || questionText.includes("pattern sequence") || questionText.includes("rules across rows")) {
          questionText = "Figure A is to Figure B as Figure C is to (?): / شکل A کا تعلق B سے ہے وہی تعلق C کا کس شکل سے ہوگا؟";
        }
        if (options.length > 4) {
          options = options.slice(0, 4);
        }
      } else if (newSubType === "matrix") {
        const req = matrixGrid === "3x3" ? 8 : 3;
        if (problemImages.length !== req) {
          if (matrixGrid === "3x3") {
            problemImages = [
              getShapeSvg("line_1_vert"), getShapeSvg("line_2_vert"), getShapeSvg("line_3_vert"),
              getShapeSvg("clock_12"), getShapeSvg("clock_3"), getShapeSvg("clock_6"),
              getShapeSvg("dots_1_center"), getShapeSvg("dots_2_diag")
            ];
          } else {
            problemImages = [
              getShapeSvg("poly_triangle_eq"),
              getShapeSvg("tri_dot_inside"),
              getShapeSvg("poly_square_hollow")
            ];
          }
        }
        if (!questionText || questionText.includes("Odd One Out") || questionText.includes("Figure A is to") || questionText.includes("pattern sequence")) {
          questionText = "Examine the rules across rows and columns to find the missing matrix cell (?): / میٹرکس کا ربط دیکھ کر نامعلوم شکل کا انتخاب کریں:";
        }
        if (options.length > 4) {
          options = options.slice(0, 4);
        }
      } else {
        // series
        if (problemImages.length < 3) {
          problemImages = [
            getShapeSvg("quad_tr"),
            getShapeSvg("quad_br"),
            getShapeSvg("quad_bl")
          ];
        }
        if (!questionText || questionText.includes("Odd One Out") || questionText.includes("Figure A is to") || questionText.includes("rules across rows")) {
          questionText = "Look at the pattern sequence below. Which figure should logically replace the question mark (?) in the series? / پیٹرن کے تسلسل کو دیکھ کر درست شکل کا انتخاب کریں:";
        }
        if (options.length > 4) {
          options = options.slice(0, 4);
        }
      }

      return {
        ...prev,
        nv_sub_type: newSubType,
        nv_problem_images: problemImages,
        nv_options: options,
        nv_correct: correct,
        question_text: questionText
      };
    });
  };

  // Non-Verbal Preset Loader
  const loadNonVerbalPreset = (presetKey: string) => {
    const preset = (NON_VERBAL_PRESETS as any)[presetKey];
    if (!preset) return;
    setFormData(prev => ({
      ...prev,
      question_text: preset.prompt || prev.question_text,
      nv_sub_type: preset.subType || prev.nv_sub_type,
      nv_matrix_grid: preset.matrixGrid || "2x2",
      nv_problem_images: [...(preset.problemImages || [])],
      nv_options: (preset.options || []).map((o: any) => ({ ...o })),
      nv_correct: preset.correct || "1",
      explanation: preset.explanation || prev.explanation
    }));
  };

  // Switch Verbal Reasoning Sub-Type with dedicated defaults & interfaces
  const switchVerbalSubType = (newSubType: VerbalReasoningSubType) => {
    setFormData(prev => {
      let options = [...prev.vr_options];
      let correct = prev.vr_correct;
      let questionText = prev.question_text;
      let topic = prev.topic;

      if (newSubType === "analogy") {
        questionText = "Choose the word that has the same relationship to Teacher as Hospital has to Doctor: / وہ لفظ منتخب کریں جس کا استاد کے ساتھ وہی تعلق ہو جو ہسپتال کا ڈاکٹر سے ہے:";
        topic = "Verbal Reasoning - Analogies";
        options = [
          { id: "1", label: "A", text: "School (اسکول)" },
          { id: "2", label: "B", text: "Chalk (چاک)" },
          { id: "3", label: "C", text: "Student (طالب علم)" },
          { id: "4", label: "D", text: "Book (کتاب)" }
        ];
        correct = "1";
      } else if (newSubType === "series") {
        questionText = "Find the next missing number in the sequence: / نیچے دیے گئے تسلسل میں اگلا عدد معلوم کریں:";
        topic = "Verbal Reasoning - Number Series";
        options = [
          { id: "1", label: "A", text: "96" },
          { id: "2", label: "B", text: "72" },
          { id: "3", label: "C", text: "84" },
          { id: "4", label: "D", text: "108" }
        ];
        correct = "1";
      } else if (newSubType === "odd_one_out") {
        questionText = "Identify the word that does NOT belong to the same group as the others: / نیچے دیے گئے الفاظ میں سے غیر متعلق لفظ کی نشاندہی کریں:";
        topic = "Verbal Reasoning - Classification";
        options = [
          { id: "1", label: "A", text: "Copper (تانبا)" },
          { id: "2", label: "B", text: "Iron (لوہا)" },
          { id: "3", label: "C", text: "Wood (لکڑی - غیر متعلق)" },
          { id: "4", label: "D", text: "Silver (چاندی)" },
          { id: "5", label: "E", text: "Gold (سونا)" }
        ];
        correct = "3";
      } else if (newSubType === "coding") {
        questionText = "If in a certain code language 'PEACE' is written as 'QFBDF', how will 'SMART' be coded in that same language? / اگر کسی کوڈ زبان میں PEACE کو QFBDF لکھا جائے تو SMART کو کیا لکھا جائے گا؟";
        topic = "Verbal Reasoning - Coding & Decoding";
        options = [
          { id: "1", label: "A", text: "TNBUS" },
          { id: "2", label: "B", text: "TOBVT" },
          { id: "3", label: "C", text: "RLZQS" },
          { id: "4", label: "D", text: "TNBVR" }
        ];
        correct = "1";
      } else if (newSubType === "blood_relations") {
        questionText = "Pointing to a photograph, a boy said: 'She is the daughter of my father\\'s only son.' How is the girl in the photograph related to the boy? / ایک تصویر کی طرف اشارہ کرتے ہوئے ایک لڑکے نے کہا: 'وہ میرے باپ کے اکلوتے بیٹے کی بیٹی ہے۔' اس لڑکی کا لڑکے سے کیا رشتہ ہے؟";
        topic = "Verbal Reasoning - Blood Relations";
        options = [
          { id: "1", label: "A", text: "His Daughter (اس کی بیٹی)" },
          { id: "2", label: "B", text: "His Sister (اس کی بہن)" },
          { id: "3", label: "C", text: "His Niece (اس کی بھانجی)" },
          { id: "4", label: "D", text: "His Mother (اس کی ماں)" }
        ];
        correct = "1";
      }

      return {
        ...prev,
        vr_sub_type: newSubType,
        vr_options: options,
        vr_correct: correct,
        question_text: questionText,
        topic
      };
    });
  };

  // Verbal Reasoning Preset Loader
  const loadVerbalPreset = (presetKey: string) => {
    const preset = VERBAL_REASONING_PRESETS[presetKey];
    if (!preset) return;
    setFormData(prev => ({
      ...prev,
      question_text: preset.prompt || prev.question_text,
      topic: preset.topic || prev.topic,
      vr_sub_type: preset.subType,
      vr_pair1_left: preset.pair1_left || prev.vr_pair1_left,
      vr_pair1_right: preset.pair1_right || prev.vr_pair1_right,
      vr_pair2_left: preset.pair2_left || prev.vr_pair2_left,
      vr_relationship_type: preset.relationship_type || prev.vr_relationship_type,
      vr_series_type: preset.series_type || prev.vr_series_type,
      vr_series_tokens: preset.series_tokens ? [...preset.series_tokens] : prev.vr_series_tokens,
      vr_rule_hint: preset.rule_hint || prev.vr_rule_hint,
      vr_words: preset.words ? [...preset.words] : prev.vr_words,
      vr_group_category: preset.group_category || prev.vr_group_category,
      vr_odd_index: typeof preset.odd_index === "number" ? preset.odd_index : prev.vr_odd_index,
      vr_source_word: preset.source_word || prev.vr_source_word,
      vr_coded_word: preset.coded_word || prev.vr_coded_word,
      vr_target_word: preset.target_word || prev.vr_target_word,
      vr_coding_rule: preset.coding_rule || prev.vr_coding_rule,
      vr_premise: preset.premise || prev.vr_premise,
      vr_clues: preset.clues ? [...preset.clues] : prev.vr_clues,
      vr_question_prompt: preset.question_prompt || prev.vr_question_prompt,
      vr_options: preset.options.map(o => ({ ...o })),
      vr_correct: preset.correct || "1",
      explanation: preset.explanation || prev.explanation
    }));
  };

  // Shape Picker Selection Handler
  const handleSelectShape = (shapeSvg: string) => {
    if (shapePickerTarget.targetType === "problem") {
      const nextImages = [...formData.nv_problem_images];
      nextImages[shapePickerTarget.slotIndex] = shapeSvg;
      setFormData(prev => ({ ...prev, nv_problem_images: nextImages }));
    } else {
      const nextOpts = [...formData.nv_options];
      if (nextOpts[shapePickerTarget.slotIndex]) {
        nextOpts[shapePickerTarget.slotIndex] = {
          ...nextOpts[shapePickerTarget.slotIndex],
          image_url: shapeSvg
        };
        setFormData(prev => ({ ...prev, nv_options: nextOpts }));
      }
    }
    setIsShapePickerOpen(false);
  };

  // Upload shape file from local Drive to Cloudflare R2 & Immediate Onward Usage
  const handleUploadShapeFile = async (file: File) => {
    if (!file) return;
    setIsUploadingShape(true);
    setUploadError(null);

    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/admin/shapes/upload", {
        method: "POST",
        body: fd
      });
      const data = (await res.json()) as any;
      if (!res.ok || !data?.success) {
        throw new Error(data?.error || "Failed to upload shape to Cloudflare");
      }

      const newShape = data.shape;
      setCustomShapes(prev => [newShape, ...prev.filter(s => s.id !== newShape.id)]);

      // Prefer inline data-uri SVG or direct file URL
      const shapeValue = newShape.svg_content 
        ? `data:image/svg+xml;utf8,${encodeURIComponent(newShape.svg_content)}`
        : newShape.file_url;

      // Select it immediately for the targeted slot!
      handleSelectShape(shapeValue);
    } catch (err: any) {
      setUploadError(err.message || "Failed to upload file from drive.");
    } finally {
      setIsUploadingShape(false);
      if (shapeFileInputRef.current) {
        shapeFileInputRef.current.value = "";
      }
    }
  };

  const handleDeleteCustomShape = async (e: React.MouseEvent, shapeId: number) => {
    e.stopPropagation();
    if (!confirm("Are you sure you want to delete this custom shape from Cloudflare storage?")) return;
    try {
      const res = await fetch(`/api/admin/shapes?id=${shapeId}`, { method: "DELETE" });
      const data = (await res.json()) as any;
      if (data?.success) {
        setCustomShapes(prev => prev.filter(s => s.id !== shapeId));
      }
    } catch (err) {
      console.error("Failed to delete shape:", err);
    }
  };

  // Save Modal (Create or Update)
  const handleSaveModal = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    try {
      let optionsJson = "";
      let correctAnswer = "";

      const qType = formData.question_type;

      if (qType === "mcq") {
        optionsJson = JSON.stringify(formData.options);
        correctAnswer = formData.correct_mcq;
      } else if (qType === "multi_select") {
        optionsJson = JSON.stringify(formData.options);
        correctAnswer = JSON.stringify(formData.correct_multi.length > 0 ? formData.correct_multi : ["1"]);
      } else if (qType === "true_false") {
        optionsJson = JSON.stringify([
          { id: "true", text: "True" },
          { id: "false", text: "False" }
        ]);
        correctAnswer = formData.correct_tf;
      } else if (qType === "fill_blank") {
        const alts = formData.blank_alternatives
          ? formData.blank_alternatives.split("|").map(s => s.trim()).filter(Boolean)
          : [];
        const accepted = [formData.blank_answer, ...alts.filter(a => a !== formData.blank_answer)];
        optionsJson = JSON.stringify({
          accepted,
          case_sensitive: formData.blank_case_sensitive,
          placeholder: "Type your answer here..."
        });
        correctAnswer = formData.blank_answer;
      } else if (qType === "column_mapping") {
        const leftItems = formData.matching_pairs.map((p, i) => ({ id: `L${i + 1}`, text: p.left }));
        const rightItems = formData.matching_pairs.map((p, i) => ({ id: `R${i + 1}`, text: p.right }));
        optionsJson = JSON.stringify({ left: leftItems, right: rightItems });
        const pairMap: Record<string, string> = {};
        formData.matching_pairs.forEach((_, i) => {
          pairMap[`L${i + 1}`] = `R${i + 1}`;
        });
        correctAnswer = JSON.stringify(pairMap);
      } else if (qType === "numerical") {
        optionsJson = JSON.stringify({
          exact: Number(formData.num_exact) || 0,
          tolerance: Number(formData.num_tolerance) || 0,
          unit: formData.num_unit
        });
        correctAnswer = `${formData.num_exact}${formData.num_unit ? " " + formData.num_unit : ""}`;
      } else if (qType === "short_answer") {
        const kw = formData.short_keywords ? formData.short_keywords.split(",").map(s => s.trim()).filter(Boolean) : [];
        optionsJson = JSON.stringify({
          model_answer: formData.short_model_answer,
          keywords: kw
        });
        correctAnswer = formData.short_model_answer;
      } else if (qType === "long_answer") {
        optionsJson = JSON.stringify({
          model_answer: formData.long_model_answer,
          rubric: formData.long_rubric,
          min_words: Number(formData.long_min_words) || 50
        });
        correctAnswer = formData.long_model_answer;
      } else if (qType === "non_verbal") {
        optionsJson = JSON.stringify({
          sub_type: formData.nv_sub_type,
          problem_images: formData.nv_problem_images,
          target_placeholder: "?",
          options: formData.nv_options,
          ...(formData.nv_sub_type === "matrix" ? { matrix_grid: formData.nv_matrix_grid || "2x2" } : {})
        });
        correctAnswer = String(formData.nv_correct);
      } else if (qType === "verbal_reasoning") {
        optionsJson = JSON.stringify({
          sub_type: formData.vr_sub_type,
          pair1_left: formData.vr_pair1_left,
          pair1_right: formData.vr_pair1_right,
          pair2_left: formData.vr_pair2_left,
          relationship_type: formData.vr_relationship_type,
          series_type: formData.vr_series_type,
          series_tokens: formData.vr_series_tokens,
          rule_hint: formData.vr_rule_hint,
          words: formData.vr_words,
          group_category: formData.vr_group_category,
          odd_index: formData.vr_odd_index,
          source_word: formData.vr_source_word,
          coded_word: formData.vr_coded_word,
          target_word: formData.vr_target_word,
          coding_rule: formData.vr_coding_rule,
          premise: formData.vr_premise,
          clues: formData.vr_clues,
          question_prompt: formData.vr_question_prompt,
          target_placeholder: "?",
          options: formData.vr_options
        });
        correctAnswer = String(formData.vr_correct);
      }

      const payload = {
        course_id: Number(formData.course_id),
        topic: formData.topic,
        difficulty: formData.difficulty,
        question_type: qType,
        marks: Number(formData.marks) || 10,
        question_text: formData.question_text,
        options_json: optionsJson,
        correct_answer: correctAnswer,
        explanation: formData.explanation,
        tags: formData.tags
      };

      if (editingQuestion) {
        // PUT
        const res = await fetch(`/api/admin/question-bank/${editingQuestion.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload)
        });
        if (!res.ok) throw new Error("Failed to update question");

        const matchedCourse = courses.find(c => c.id === Number(formData.course_id));
        setQuestions(prev => prev.map(item => item.id === editingQuestion.id ? {
          ...item,
          ...payload,
          course_title: matchedCourse?.title,
          course_code: matchedCourse?.code
        } : item));
      } else {
        // POST
        const res = await fetch("/api/admin/question-bank", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload)
        });
        if (!res.ok) throw new Error("Failed to create question");
        const data = (await res.json()) as any;

        const matchedCourse = courses.find(c => c.id === Number(formData.course_id));
        const newItem: QuestionBankItem = {
          id: data.id,
          ...payload,
          usage_count: 0,
          course_title: matchedCourse?.title,
          course_code: matchedCourse?.code,
          created_at: new Date().toISOString()
        };
        setQuestions(prev => [newItem, ...prev]);
        showNotice("Question saved to bank!");
      }

      setIsModalOpen(false);
    } catch (err: any) {
      showNotice("Error saving question: " + err.message, "error");
    } finally {
      setIsSaving(false);
    }
  };

  // Delete Question
  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure you want to delete this question from the Question Bank? (Existing exams will retain their saved snapshot).")) {
      return;
    }

    try {
      const res = await fetch(`/api/admin/question-bank/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete question");
      setQuestions(prev => prev.filter(q => q.id !== id));
      showNotice("Question deleted from bank.");
    } catch (err: any) {
      showNotice("Error deleting question: " + err.message, "error");
    }
  };

  // Render options preview based on type
  const renderOptionsPreview = (q: QuestionBankItem) => {
    let optData: any = null;
    try {
      optData = q.options_json ? JSON.parse(q.options_json) : null;
    } catch {
      optData = null;
    }

    if (!optData) return null;

    if (q.question_type === "mcq" && Array.isArray(optData)) {
      return (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-3 text-xs">
          {optData.map((opt: any) => {
            const isCorrect = String(opt.id) === String(q.correct_answer);
            return (
              <div
                key={opt.id}
                className={`flex items-start gap-2 p-2.5 rounded-xl border ${
                  isCorrect
                    ? "bg-emerald-50/70 border-emerald-300 text-emerald-900 font-medium"
                    : "bg-slate-50 border-slate-200/80 text-slate-700"
                }`}
              >
                <span className={`w-5 h-5 rounded-full flex items-center justify-center font-bold text-[10px] shrink-0 ${
                  isCorrect ? "bg-emerald-600 text-white" : "bg-slate-200 text-slate-600"
                }`}>
                  {opt.id}
                </span>
                <div 
                  className="overflow-x-auto"
                  dangerouslySetInnerHTML={{ __html: formatMarkdownPreview(opt.text) }} 
                />
              </div>
            );
          })}
        </div>
      );
    }

    if (q.question_type === "true_false") {
      return (
        <div className="flex gap-2 mt-2">
          <span className={`px-3 py-1 rounded-lg text-xs font-bold border ${
            String(q.correct_answer).toLowerCase() === "true" 
              ? "bg-emerald-100 border-emerald-300 text-emerald-800" 
              : "bg-slate-50 border-slate-200 text-slate-400"
          }`}>
            True {String(q.correct_answer).toLowerCase() === "true" && "✓"}
          </span>
          <span className={`px-3 py-1 rounded-lg text-xs font-bold border ${
            String(q.correct_answer).toLowerCase() === "false" 
              ? "bg-emerald-100 border-emerald-300 text-emerald-800" 
              : "bg-slate-50 border-slate-200 text-slate-400"
          }`}>
            False {String(q.correct_answer).toLowerCase() === "false" && "✓"}
          </span>
        </div>
      );
    }

    if (q.question_type === "fill_blank") {
      return (
        <div className="mt-2 text-xs bg-amber-50/60 p-2.5 rounded-xl border border-amber-200 text-amber-900 flex items-center gap-2">
          <span className="font-bold text-amber-700">Accepted Answer:</span>
          <span className="font-mono bg-white px-2 py-0.5 rounded border border-amber-200">{q.correct_answer}</span>
        </div>
      );
    }

    if (q.question_type === "numerical") {
      return (
        <div className="mt-2 text-xs bg-cyan-50/60 p-2.5 rounded-xl border border-cyan-200 text-cyan-900 flex items-center gap-3">
          <span className="font-bold text-cyan-800">Target Value:</span>
          <span className="font-mono bg-white px-2 py-0.5 rounded border border-cyan-200">{q.correct_answer}</span>
          {optData.tolerance ? <span className="text-slate-500 text-[11px]">(± {optData.tolerance})</span> : null}
        </div>
      );
    }

    if (q.question_type === "non_verbal") {
      const problemImages = optData.problem_images || [];
      const options = optData.options || [];
      const subType = optData.sub_type || "series";

      return (
        <div className="mt-3 space-y-3 bg-slate-50/80 p-3.5 rounded-2xl border border-slate-200/90">
          {/* PROBLEM SEQUENCE STRIP */}
          {subType === "series" && problemImages.length > 0 && (
            <div>
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1.5">
                Pattern Sequence (1 ➔ 2 ➔ 3 ➔ ?):
              </span>
              <div className="flex items-center gap-2 overflow-x-auto py-1">
                {problemImages.map((img: string, iIdx: number) => (
                  <div key={iIdx} className="flex items-center gap-2 shrink-0">
                    <div className="flex flex-col items-center">
                      <span className="text-[9px] font-bold text-slate-400 mb-0.5">Fig {iIdx + 1}</span>
                      <div className="w-14 h-14 bg-white rounded-xl border border-slate-200 flex items-center justify-center p-1.5 shadow-2xs">
                        <img src={img} alt={`Figure ${iIdx + 1}`} className="max-w-full max-h-full object-contain" />
                      </div>
                    </div>
                    {iIdx < problemImages.length - 1 && (
                      <span className="text-slate-300 font-bold text-sm select-none">→</span>
                    )}
                  </div>
                ))}

                {/* Question Mark (?) Target Placeholder */}
                <span className="text-amber-500 font-bold text-base select-none">→</span>
                <div className="flex flex-col items-center shrink-0">
                  <span className="text-[9px] font-black text-amber-600 mb-0.5">Next (?)</span>
                  <div className="w-14 h-14 bg-amber-50 rounded-xl border-2 border-dashed border-amber-400 flex flex-col items-center justify-center text-amber-600 shadow-2xs animate-pulse">
                    <span className="text-xl font-black">?</span>
                    <span className="text-[8px] font-bold text-amber-700">Missing</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ANALOGY SUB-TYPE */}
          {subType === "analogy" && (
            <div>
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1.5">
                Figure Analogy: (Fig A : Fig B :: Fig C : ?)
              </span>
              <div className="flex items-center gap-2 overflow-x-auto py-1">
                {/* Pair 1 */}
                <div className="flex items-center gap-1.5 p-1.5 rounded-xl bg-white border border-slate-200">
                  <div className="w-12 h-12 flex items-center justify-center p-1">
                    {problemImages[0] ? <img src={problemImages[0]} alt="Fig A" className="max-w-full max-h-full object-contain" /> : <span className="text-[9px] text-slate-300">Empty</span>}
                  </div>
                  <span className="font-black text-slate-400">:</span>
                  <div className="w-12 h-12 flex items-center justify-center p-1">
                    {problemImages[1] ? <img src={problemImages[1]} alt="Fig B" className="max-w-full max-h-full object-contain" /> : <span className="text-[9px] text-slate-300">Empty</span>}
                  </div>
                </div>

                <span className="text-xs font-black text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded">::</span>

                {/* Pair 2 */}
                <div className="flex items-center gap-1.5 p-1.5 rounded-xl bg-white border border-slate-200">
                  <div className="w-12 h-12 flex items-center justify-center p-1">
                    {problemImages[2] ? <img src={problemImages[2]} alt="Fig C" className="max-w-full max-h-full object-contain" /> : <span className="text-[9px] text-slate-300">Empty</span>}
                  </div>
                  <span className="font-black text-slate-400">:</span>
                  <div className="w-12 h-12 rounded-lg border-2 border-dashed border-amber-400 bg-amber-50 flex flex-col items-center justify-center text-amber-600 animate-pulse">
                    <span className="text-base font-black">?</span>
                    <span className="text-[7px] font-bold">Missing</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* MATRIX SUB-TYPE */}
          {subType === "matrix" && (
            <div>
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1.5">
                Matrix Pattern Canvas ({optData.matrix_grid || "2x2"}):
              </span>
              {(() => {
                const is3x3 = optData.matrix_grid === "3x3";
                const totalCells = is3x3 ? 9 : 4;
                return (
                  <div className={`grid ${is3x3 ? "grid-cols-3 w-48" : "grid-cols-2 w-32"} gap-1.5 p-2 bg-white rounded-xl border border-slate-200`}>
                    {Array.from({ length: totalCells }).map((_, cIdx) => {
                      const isMissing = cIdx === totalCells - 1;
                      const cellImg = problemImages[cIdx];
                      return isMissing ? (
                        <div key={cIdx} className="w-14 h-14 rounded-lg border-2 border-dashed border-amber-400 bg-amber-50 flex flex-col items-center justify-center text-amber-600 animate-pulse">
                          <span className="text-lg font-black">?</span>
                          <span className="text-[7px] font-bold">Missing</span>
                        </div>
                      ) : (
                        <div key={cIdx} className="w-14 h-14 rounded-lg border border-slate-200 p-1 flex items-center justify-center bg-slate-50">
                          {cellImg ? <img src={cellImg} alt={`Cell ${cIdx + 1}`} className="max-w-full max-h-full object-contain" /> : <span className="text-[9px] text-slate-300">Empty</span>}
                        </div>
                      );
                    })}
                  </div>
                );
              })()}
            </div>
          )}

          {/* CHOICES GRID */}
          {options.length > 0 && (
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                Choices (Correct highlighted):
              </span>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {options.map((opt: any) => {
                  const isCorrect = String(opt.id) === String(q.correct_answer);
                  return (
                    <div key={opt.id} className={`p-2 rounded-xl border flex flex-col items-center gap-1 text-center ${
                      isCorrect ? "bg-emerald-50 border-emerald-300 ring-2 ring-emerald-500/20" : "bg-white border-slate-200"
                    }`}>
                      <span className={`w-4 h-4 rounded-full text-[10px] font-bold flex items-center justify-center ${
                        isCorrect ? "bg-emerald-600 text-white" : "bg-slate-100 text-slate-600"
                      }`}>{opt.label || opt.id}</span>
                      <img src={opt.image_url} alt={opt.label} className="w-10 h-10 object-contain my-1" />
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      );
    }

    if (q.question_type === "verbal_reasoning") {
      const subType = optData.sub_type || "analogy";
      const options = optData.options || [];

      return (
        <div className="mt-3 space-y-3 bg-teal-50/40 p-3.5 rounded-2xl border border-teal-200/80">
          {/* Subtype Badge & Topic */}
          <div className="flex items-center justify-between pb-1 border-b border-teal-100">
            <span className="text-[10px] font-black uppercase text-teal-900 tracking-wider flex items-center gap-1.5">
              <BrainCircuit className="w-3.5 h-3.5 text-teal-600" />
              <span>Verbal Reasoning ({subType.toUpperCase()})</span>
            </span>
            <span className="text-[10px] font-bold text-teal-700 bg-white px-2 py-0.5 rounded-md border border-teal-200 shadow-2xs">
              {subType === "analogy" && "Verbal Analogy (تشبیہ)"}
              {subType === "series" && "Letter & Number Series (تسلسل)"}
              {subType === "odd_one_out" && "Odd Word Out (غیر متعلق لفظ)"}
              {subType === "coding" && "Coding & Decoding (کوڈنگ)"}
              {subType === "blood_relations" && "Blood Relations & Logic (رشتے و استدلال)"}
            </span>
          </div>

          {/* 1. ANALOGY CARD PREVIEW */}
          {subType === "analogy" && (
            <div className="flex flex-wrap items-center gap-2 text-xs">
              <div className="flex items-center gap-1.5 bg-white px-2.5 py-1.5 rounded-xl border border-teal-200 shadow-2xs font-bold text-slate-800">
                <span className="text-teal-700">{optData.pair1_left || "Word A"}</span>
                <span className="text-slate-400 font-black">:</span>
                <span className="text-teal-700">{optData.pair1_right || "Word B"}</span>
              </div>
              <span className="text-teal-600 font-black text-sm">::</span>
              <div className="flex items-center gap-1.5 bg-white px-2.5 py-1.5 rounded-xl border border-teal-200 shadow-2xs font-bold text-slate-800">
                <span className="text-teal-700">{optData.pair2_left || "Word C"}</span>
                <span className="text-slate-400 font-black">:</span>
                <span className="bg-amber-100 text-amber-800 px-2 py-0.5 rounded-lg border border-amber-300 font-black flex items-center gap-1">
                  <span>?</span>
                  <span className="text-[9px]">Target</span>
                </span>
              </div>
              {optData.relationship_type && (
                <span className="text-[10px] text-teal-800 bg-teal-100/80 px-2 py-0.5 rounded-lg font-medium">
                  {optData.relationship_type}
                </span>
              )}
            </div>
          )}

          {/* 2. SERIES PREVIEW */}
          {subType === "series" && (
            <div className="space-y-1.5">
              <div className="flex items-center gap-1.5 overflow-x-auto py-1">
                {(optData.series_tokens || []).map((token: string, sIdx: number) => (
                  <div key={sIdx} className="flex items-center gap-1.5 shrink-0">
                    <span className="bg-white border border-teal-200 text-slate-800 px-2.5 py-1 rounded-xl font-mono font-bold text-xs shadow-2xs">
                      {token}
                    </span>
                    <span className="text-slate-300 font-black text-xs">➔</span>
                  </div>
                ))}
                <span className="bg-amber-100 text-amber-800 border-2 border-dashed border-amber-400 px-2.5 py-1 rounded-xl font-mono font-black text-xs shadow-2xs animate-pulse">
                  ? Target
                </span>
              </div>
              {optData.rule_hint && (
                <p className="text-[10px] text-teal-700 font-medium">
                  Rule: {optData.rule_hint}
                </p>
              )}
            </div>
          )}

          {/* 3. ODD ONE OUT PREVIEW */}
          {subType === "odd_one_out" && (
            <div className="space-y-2">
              <div className="flex flex-wrap items-center gap-1.5">
                {(optData.words || []).map((w: string, wIdx: number) => {
                  const isOdd = String(wIdx + 1) === String(q.correct_answer) || wIdx === optData.odd_index;
                  return (
                    <span
                      key={wIdx}
                      className={`px-2.5 py-1 rounded-xl text-xs font-bold border transition ${
                        isOdd
                          ? "bg-amber-100 text-amber-900 border-amber-300 shadow-2xs ring-2 ring-amber-400/30"
                          : "bg-white text-slate-700 border-slate-200"
                      }`}
                    >
                      {w} {isOdd && "★ (Odd)"}
                    </span>
                  );
                })}
              </div>
              {optData.group_category && (
                <p className="text-[10px] text-teal-800 font-medium">
                  Category: {optData.group_category}
                </p>
              )}
            </div>
          )}

          {/* 4. CODING PREVIEW */}
          {subType === "coding" && (
            <div className="flex flex-wrap items-center gap-2 text-xs">
              <div className="flex items-center gap-1.5 bg-white px-2.5 py-1.5 rounded-xl border border-teal-200 shadow-2xs font-mono font-bold">
                <span className="text-slate-800">{optData.source_word}</span>
                <span className="text-teal-600 font-sans font-bold">➔</span>
                <span className="text-teal-700">{optData.coded_word}</span>
              </div>
              <span className="text-teal-600 font-black text-sm">::</span>
              <div className="flex items-center gap-1.5 bg-white px-2.5 py-1.5 rounded-xl border border-teal-200 shadow-2xs font-mono font-bold">
                <span className="text-slate-800">{optData.target_word}</span>
                <span className="text-teal-600 font-sans font-bold">➔</span>
                <span className="bg-amber-100 text-amber-800 px-2 py-0.5 rounded border border-amber-300">
                  ?
                </span>
              </div>
              {optData.coding_rule && (
                <span className="text-[10px] text-teal-800 bg-teal-100/70 px-2 py-0.5 rounded-md font-sans">
                  {optData.coding_rule}
                </span>
              )}
            </div>
          )}

          {/* 5. BLOOD RELATIONS PREVIEW */}
          {subType === "blood_relations" && (
            <div className="space-y-1.5 bg-white/80 p-2.5 rounded-xl border border-teal-200 text-xs">
              {optData.premise && <p className="font-semibold text-slate-800">{optData.premise}</p>}
              {Array.isArray(optData.clues) && optData.clues.length > 0 && (
                <ul className="text-[10px] text-slate-600 space-y-0.5 list-disc pl-4">
                  {optData.clues.map((clue: string, cIdx: number) => (
                    <li key={cIdx}>{clue}</li>
                  ))}
                </ul>
              )}
              {optData.question_prompt && (
                <p className="text-[11px] font-bold text-teal-900 pt-0.5">
                  Question: {optData.question_prompt}
                </p>
              )}
            </div>
          )}

          {/* CHOICES GRID */}
          {options.length > 0 && (
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                Choices (Correct highlighted):
              </span>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {options.map((opt: any) => {
                  const isCorrect = String(opt.id) === String(q.correct_answer);
                  return (
                    <div
                      key={opt.id}
                      className={`p-2 rounded-xl border flex items-center gap-2 text-xs ${
                        isCorrect
                          ? "bg-emerald-50 border-emerald-300 text-emerald-900 font-bold ring-2 ring-emerald-500/20"
                          : "bg-white border-slate-200 text-slate-700"
                      }`}
                    >
                      <span
                        className={`w-5 h-5 rounded-lg text-[10px] font-bold flex items-center justify-center shrink-0 ${
                          isCorrect ? "bg-emerald-600 text-white" : "bg-slate-100 text-slate-600"
                        }`}
                      >
                        {opt.label || opt.id}
                      </span>
                      <span className="truncate">{opt.text}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      );
    }

    return null;
  };

  return (
    <div className="space-y-6">
      {/* 1. Header & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-blue-500/20">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-2xl font-black text-slate-900 font-heading">Question Bank Asset Library</h1>
              <p className="text-xs text-slate-500 mt-0.5">
                Centralized question bank with LaTeX KaTeX notation, non-verbal shapes, and difficulty thresholds.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <Link
            href="/admin/exams/new"
            className="text-xs font-bold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200/80 px-4 py-2.5 rounded-xl transition shadow-xs flex items-center gap-1.5 active:scale-95"
          >
            <BookOpen className="w-4 h-4 text-blue-600" />
            <span>Create Exam</span>
          </Link>
        </div>
      </div>

      {/* 2. Key Metrics Cards (Clickable quick filters) */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3.5">
        <button
          onClick={() => {
            setSelectedType(selectedType === "all" ? "" : "all");
            setSelectedSubType("");
          }}
          className={`text-left p-4 rounded-2xl border transition shadow-xs active:scale-[0.99] cursor-pointer ${
            selectedType === "all" ? "bg-blue-50/60 border-blue-400 ring-2 ring-blue-500/20" : "bg-white border-slate-200/80 hover:border-slate-300 hover:shadow-sm"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500">Total Bank Questions</span>
            <Database className="w-4 h-4 text-blue-600" />
          </div>
          <div className="mt-2 text-2xl font-black text-slate-900 font-heading">
            {(stats.total || questions.length).toLocaleString()}
          </div>
          <div className="text-[11px] text-slate-400 mt-1 flex items-center gap-2">
            <span className="text-emerald-600 font-semibold">{(stats.easy_count || 0).toLocaleString()} Easy</span>
            <span>•</span>
            <span className="text-amber-600 font-semibold">{(stats.medium_count || 0).toLocaleString()} Med</span>
            <span>•</span>
            <span className="text-rose-600 font-semibold">{(stats.hard_count || 0).toLocaleString()} Hard</span>
          </div>
        </button>

        <button
          onClick={() => {
            setSelectedType(selectedType === "mcq" ? "" : "mcq");
            setSelectedSubType("");
          }}
          className={`text-left p-4 rounded-2xl border transition shadow-xs active:scale-[0.99] cursor-pointer ${
            selectedType === "mcq" ? "bg-purple-50/60 border-purple-400 ring-2 ring-purple-500/20" : "bg-white border-slate-200/80 hover:border-slate-300 hover:shadow-sm"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500">Multiple Choice (MCQ)</span>
            <CheckCircle2 className="w-4 h-4 text-purple-600" />
          </div>
          <div className="mt-2 text-2xl font-black text-slate-900 font-heading">
            {(stats.mcq_count ?? questions.filter(q => q.question_type === "mcq").length).toLocaleString()}
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Single & Multi-Select options</p>
        </button>

        <button
          onClick={() => {
            setSelectedType(selectedType === "verbal_reasoning" ? "" : "verbal_reasoning");
            setSelectedSubType("");
          }}
          className={`text-left p-4 rounded-2xl border transition shadow-xs active:scale-[0.99] cursor-pointer ${
            selectedType === "verbal_reasoning" ? "bg-teal-50/60 border-teal-400 ring-2 ring-teal-500/20" : "bg-white border-slate-200/80 hover:border-slate-300 hover:shadow-sm"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500">Verbal Reasoning</span>
            <BrainCircuit className="w-4 h-4 text-teal-600" />
          </div>
          <div className="mt-2 text-2xl font-black text-slate-900 font-heading">
            {(stats.verbal_count ?? questions.filter(q => q.question_type === "verbal_reasoning").length).toLocaleString()}
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Analogies, series & coding</p>
        </button>

        <button
          onClick={() => {
            setSelectedType(selectedType === "non_verbal" ? "" : "non_verbal");
            setSelectedSubType("");
          }}
          className={`text-left p-4 rounded-2xl border transition shadow-xs active:scale-[0.99] cursor-pointer ${
            selectedType === "non_verbal" ? "bg-orange-50/60 border-orange-400 ring-2 ring-orange-500/20" : "bg-white border-slate-200/80 hover:border-slate-300 hover:shadow-sm"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500">Non-Verbal / Intelligence</span>
            <Layers className="w-4 h-4 text-orange-600" />
          </div>
          <div className="mt-2 text-2xl font-black text-slate-900 font-heading">
            {(stats.non_verbal_count ?? questions.filter(q => q.question_type === "non_verbal").length).toLocaleString()}
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Shape patterns & ISSB series</p>
        </button>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs col-span-2 lg:col-span-1">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500">Total Paper Usages</span>
            <BookOpen className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="mt-2 text-2xl font-black text-slate-900 font-heading">
            {(stats.total_usages ?? questions.reduce((acc, curr) => acc + (curr.usage_count || 0), 0)).toLocaleString()}
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Times inserted into exams</p>
        </div>
      </div>

      {/* 3. Search & Multi-Level Filters */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs space-y-3">
        <div className="flex flex-col md:flex-row gap-3">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
            <input
              type="text"
              placeholder="Search statements, formulas, topics, or tags..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition"
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery("")} className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600">
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Course Dropdown */}
          <div className="w-full md:w-64">
            <select
              value={selectedCourse}
              onChange={(e) => setSelectedCourse(e.target.value)}
              className={`w-full px-3 py-2 border rounded-xl text-xs font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition cursor-pointer ${
                selectedCourse ? "bg-blue-50/60 border-blue-300 text-blue-900 font-bold" : "bg-slate-50 border-slate-200 text-slate-700"
              }`}
            >
              <option value="">Select Academic Program</option>
              <option value="all">All Academic Programs</option>
              {courses.map((c) => (
                <option key={c.id} value={String(c.id)}>
                  {c.code} - {c.title}
                </option>
              ))}
            </select>
          </div>

          {/* Question Type Dropdown */}
          <div className="w-full md:w-56">
            <select
              value={selectedType}
              onChange={(e) => {
                const newType = e.target.value;
                setSelectedType(newType);
                setSelectedSubType("");
              }}
              className={`w-full px-3 py-2 border rounded-xl text-xs font-semibold focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition cursor-pointer ${
                selectedType ? "bg-purple-50/60 border-purple-300 text-purple-900 font-bold" : "bg-slate-50 border-slate-200 text-slate-700"
              }`}
            >
              <option value="">Select Question Type</option>
              <option value="all">All Question Types ({(stats.total || questions.length).toLocaleString()})</option>
              {Object.entries(TYPE_CONFIG).map(([typeKey, cfg]) => {
                const count = (stats as any)[`${typeKey}_count`] ?? (questions.length > 0 ? questions.filter(q => q.question_type === typeKey).length : null);
                return (
                  <option key={typeKey} value={typeKey}>
                    {cfg.label} {count !== null && count !== undefined ? `(${Number(count).toLocaleString()})` : ""}
                  </option>
                );
              })}
            </select>
          </div>

          {/* Subtype Dropdown (Available for verbal/non-verbal or when no specific type chosen) */}
          {(!selectedType || selectedType === "all" || selectedType === "verbal_reasoning" || selectedType === "non_verbal") && (
            <div className="w-full md:w-60 animate-in fade-in duration-150">
              <select
                value={selectedSubType}
                onChange={(e) => {
                  const val = e.target.value;
                  setSelectedSubType(val);
                  if (val && val !== "all" && (!selectedType || selectedType === "all")) {
                    const isVerbal = VERBAL_SUBTYPES.some(s => s.id === val);
                    const isNonVerbal = NON_VERBAL_SUBTYPES.some(s => s.id === val);
                    if (isVerbal) setSelectedType("verbal_reasoning");
                    else if (isNonVerbal) setSelectedType("non_verbal");
                  }
                }}
                className={`w-full px-3 py-2 border rounded-xl text-xs font-medium focus:outline-none focus:ring-2 transition cursor-pointer ${
                  selectedSubType
                    ? "bg-teal-50/70 border-teal-300 text-teal-900 font-bold focus:ring-teal-500/20 focus:border-teal-500"
                    : "bg-slate-50 border-slate-200 text-slate-700 focus:bg-white focus:ring-blue-500/20 focus:border-blue-500"
                }`}
              >
                <option value="">Select Question Subtype</option>
                <option value="all">
                  {selectedType === "verbal_reasoning"
                    ? `All Verbal Subtypes (${verbalSubCounts.all})`
                    : selectedType === "non_verbal"
                    ? `All Non-Verbal Subtypes (${nonVerbalSubCounts.all})`
                    : "All Question Subtypes"}
                </option>
                {selectedType === "verbal_reasoning" ? (
                  VERBAL_SUBTYPES.map(sub => (
                    <option key={sub.id} value={sub.id}>
                      {sub.icon} {sub.label} ({sub.labelUrdu}) {verbalSubCounts[sub.id] ? `(${verbalSubCounts[sub.id]})` : ""}
                    </option>
                  ))
                ) : selectedType === "non_verbal" ? (
                  NON_VERBAL_SUBTYPES.map(sub => (
                    <option key={sub.id} value={sub.id}>
                      {sub.icon} {sub.label} ({sub.labelUrdu}) {nonVerbalSubCounts[sub.id] ? `(${nonVerbalSubCounts[sub.id]})` : ""}
                    </option>
                  ))
                ) : (
                  <>
                    <optgroup label="🧠 Verbal Reasoning Subtypes">
                      {VERBAL_SUBTYPES.map(sub => (
                        <option key={`vr_${sub.id}`} value={sub.id}>
                          {sub.icon} {sub.label} ({sub.labelUrdu})
                        </option>
                      ))}
                    </optgroup>
                    <optgroup label="📐 Non-Verbal Subtypes">
                      {NON_VERBAL_SUBTYPES.map(sub => (
                        <option key={`nv_${sub.id}`} value={sub.id}>
                          {sub.icon} {sub.label} ({sub.labelUrdu})
                        </option>
                      ))}
                    </optgroup>
                  </>
                )}
              </select>
            </div>
          )}

          {/* Difficulty Dropdown */}
          <div className="w-full md:w-44">
            <select
              value={selectedDifficulty}
              onChange={(e) => setSelectedDifficulty(e.target.value)}
              className={`w-full px-3 py-2 border rounded-xl text-xs font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition cursor-pointer ${
                selectedDifficulty ? "bg-amber-50/60 border-amber-300 text-amber-900 font-bold" : "bg-slate-50 border-slate-200 text-slate-700"
              }`}
            >
              <option value="">Select Difficulty Level</option>
              <option value="all">All Difficulties</option>
              <option value="easy">Easy (Fundamentals)</option>
              <option value="medium">Medium (Standard)</option>
              <option value="hard">Hard (Advanced)</option>
            </select>
          </div>

          {/* Reset Filters Button (Shown if any filter is active) */}
          {hasActiveFilter && (
            <button
              onClick={() => {
                setSearchQuery("");
                setSelectedCourse("");
                setSelectedType("");
                setSelectedSubType("");
                setSelectedDifficulty("");
                setQuestions([]);
              }}
              className="px-3 py-2 rounded-xl text-xs font-bold text-slate-500 hover:text-rose-600 hover:bg-rose-50 border border-slate-200/80 transition flex items-center gap-1.5 shrink-0 cursor-pointer"
              title="Reset all filters"
            >
              <X className="w-3.5 h-3.5" />
              <span>Reset</span>
            </button>
          )}
        </div>
      </div>

      {/* 4. Question Cards Grid */}
      {/* 4. Question Cards Grid with Contextual Action Bar */}
      <div className="space-y-4">
        {/* Action Bar Aligned with Selected Filter (Moved as Requested) */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-3.5 rounded-2xl border border-slate-200/80 shadow-2xs">
          <div className="text-xs text-slate-500 font-medium flex items-center gap-2 flex-wrap">
            {hasActiveFilter ? (
              <span>Showing <strong>{filteredQuestions.length.toLocaleString()}</strong> matching questions in bank</span>
            ) : (
              <span className="text-slate-400 font-semibold flex items-center gap-1.5">
                <Filter className="w-3.5 h-3.5 text-blue-500" />
                <span>Select filter criteria above to display questions</span>
              </span>
            )}
            {selectedType && selectedType !== "all" && (
              <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-lg border flex items-center gap-1 ${
                TYPE_CONFIG[selectedType]?.bg || "bg-blue-50 text-blue-700 border-blue-200"
              }`}>
                {(() => {
                  const Icon = TYPE_CONFIG[selectedType]?.icon || CheckCircle2;
                  return <Icon className="w-3 h-3" />;
                })()}
                <span>{TYPE_CONFIG[selectedType]?.label || selectedType}</span>
              </span>
            )}
            {selectedSubType && selectedSubType !== "all" && (
              <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-lg border flex items-center gap-1.5 ${
                selectedType === "verbal_reasoning"
                  ? "bg-teal-50 text-teal-800 border-teal-200"
                  : "bg-orange-50 text-orange-800 border-orange-200"
              }`}>
                <span>Subtype:</span>
                <span className="underline font-black">
                  {selectedType === "verbal_reasoning"
                    ? VERBAL_SUBTYPES.find(s => s.id === selectedSubType)?.label || selectedSubType
                    : NON_VERBAL_SUBTYPES.find(s => s.id === selectedSubType)?.label || selectedSubType}
                </span>
                <button
                  onClick={() => setSelectedSubType("")}
                  className="hover:text-red-600 transition p-0.5 cursor-pointer"
                  title="Clear subtype filter"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={refreshQuestions}
              disabled={isDataLoading}
              className="text-xs font-bold text-slate-700 bg-slate-50 hover:bg-slate-100 border border-slate-200/80 px-3.5 py-2 rounded-xl transition shadow-2xs flex items-center gap-1.5 disabled:opacity-50 active:scale-95 cursor-pointer"
              title="Refresh and sync questions from database"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-blue-600 ${isDataLoading ? "animate-spin" : ""}`} />
              <span>{isDataLoading ? "Syncing..." : "Refresh Bank"}</span>
            </button>

            <button
              onClick={() => setIsBulkImportOpen(true)}
              className="text-xs font-bold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200/80 px-3.5 py-2 rounded-xl transition shadow-2xs flex items-center gap-1.5 active:scale-95 cursor-pointer"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
              <span>Bulk Import {selectedType && selectedType !== "all" ? `(${TYPE_CONFIG[selectedType]?.label || selectedType})` : "(Excel)"}</span>
            </button>

            <button
              onClick={() => handleOpenCreate(selectedType && selectedType !== "all" ? selectedType : "mcq", selectedSubType && selectedSubType !== "all" ? selectedSubType : undefined)}
              className="text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-xl transition shadow-xs flex items-center gap-1.5 active:scale-95 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>
                + Add {selectedSubType && selectedSubType !== "all" ? (
                  selectedType === "verbal_reasoning"
                    ? `Verbal (${VERBAL_SUBTYPES.find(s => s.id === selectedSubType)?.label || selectedSubType})`
                    : `Non-Verbal (${NON_VERBAL_SUBTYPES.find(s => s.id === selectedSubType)?.label || selectedSubType})`
                ) : selectedType && selectedType !== "all" ? (
                  `${TYPE_CONFIG[selectedType]?.label || selectedType} Question`
                ) : (
                  "Question to Bank"
                )}
              </span>
            </button>
          </div>
        </div>

        {/* Loading Progress Spinner, Filter Guidance Prompt, or Question Cards Grid */}
        {isDataLoading ? (
          <div className="bg-white p-12 text-center rounded-2xl border border-slate-200 shadow-xs space-y-4 animate-in fade-in duration-150">
            <div className="w-14 h-14 rounded-2xl bg-blue-50 border border-blue-200 text-blue-600 flex items-center justify-center mx-auto shadow-xs">
              <Loader2 className="w-7 h-7 animate-spin" />
            </div>
            <div className="space-y-1">
              <span className="text-[10px] font-bold tracking-wider text-blue-700 bg-blue-100 uppercase px-2.5 py-0.5 rounded-full border border-blue-200">
                Lateral Data Load
              </span>
              <h3 className="text-base font-black text-slate-800 pt-0.5 font-heading">
                Syncing Question Bank Data...
              </h3>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                Retrieving and indexing questions from database. Please hold on a moment...
              </p>
            </div>
            <div className="w-56 bg-slate-100 rounded-full h-1.5 mx-auto overflow-hidden">
              <div className="bg-gradient-to-r from-blue-600 to-indigo-600 h-full rounded-full animate-pulse w-3/4"></div>
            </div>
          </div>
        ) : !hasActiveFilter ? (
          <div className="bg-white p-10 sm:p-14 text-center rounded-2xl border border-slate-200/90 shadow-xs space-y-5">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-blue-50 to-indigo-50 border border-blue-200/80 text-blue-600 flex items-center justify-center mx-auto shadow-xs">
              <Filter className="w-8 h-8" />
            </div>
            <div className="space-y-2 max-w-lg mx-auto">
              <span className="text-[10px] font-black tracking-wider text-indigo-700 bg-indigo-50 uppercase px-3 py-1 rounded-full border border-indigo-200">
                On-Demand Lateral Loading
              </span>
              <h3 className="text-lg font-black text-slate-900 font-heading">
                Select Filters to Display Questions
              </h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                To maintain optimal browser responsiveness and instant navigation, questions from the bank are loaded on demand. 
                Select an <strong>Academic Program</strong>, <strong>Question Type</strong>, <strong>Subtype</strong>, or <strong>Difficulty</strong> from the dropdowns above to fetch items.
              </p>
            </div>

            {/* Quick Filter Shortcuts */}
            <div className="pt-2 flex items-center justify-center gap-2 flex-wrap max-w-2xl mx-auto">
              <button
                type="button"
                onClick={() => setSelectedType("mcq")}
                className="px-3.5 py-2 rounded-xl text-xs font-bold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 transition flex items-center gap-1.5 active:scale-95 cursor-pointer"
              >
                <CheckCircle2 className="w-3.5 h-3.5 text-blue-600" />
                <span>Browse MCQs {stats.mcq_count ? `(${stats.mcq_count.toLocaleString()})` : ""}</span>
              </button>

              <button
                type="button"
                onClick={() => setSelectedType("verbal_reasoning")}
                className="px-3.5 py-2 rounded-xl text-xs font-bold text-teal-800 bg-teal-50 hover:bg-teal-100 border border-teal-200 transition flex items-center gap-1.5 active:scale-95 cursor-pointer"
              >
                <BrainCircuit className="w-3.5 h-3.5 text-teal-600" />
                <span>Verbal Reasoning {stats.verbal_count ? `(${stats.verbal_count.toLocaleString()})` : ""}</span>
              </button>

              <button
                type="button"
                onClick={() => setSelectedType("non_verbal")}
                className="px-3.5 py-2 rounded-xl text-xs font-bold text-orange-800 bg-orange-50 hover:bg-orange-100 border border-orange-200 transition flex items-center gap-1.5 active:scale-95 cursor-pointer"
              >
                <Layers className="w-3.5 h-3.5 text-orange-600" />
                <span>Non-Verbal {stats.non_verbal_count ? `(${stats.non_verbal_count.toLocaleString()})` : ""}</span>
              </button>

              <button
                type="button"
                onClick={() => setSelectedType("all")}
                className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 transition flex items-center gap-1.5 shadow-xs active:scale-95 cursor-pointer"
              >
                <Database className="w-3.5 h-3.5 text-blue-400" />
                <span>Load All Questions {stats.total ? `(${stats.total.toLocaleString()})` : ""}</span>
              </button>
            </div>
          </div>
        ) : filteredQuestions.length === 0 ? (
          <div className="bg-white p-12 text-center rounded-2xl border border-slate-200 shadow-xs space-y-3">
            <Database className="w-10 h-10 text-slate-300 mx-auto" />
            <h3 className="text-base font-bold text-slate-800">No questions found matching your filter</h3>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              Try adjusting your search criteria, course, or question type, or create a new question for the bank.
            </p>
            <button
              onClick={() => handleOpenCreate(selectedType && selectedType !== "all" ? selectedType : "mcq", selectedSubType && selectedSubType !== "all" ? selectedSubType : undefined)}
              className="text-xs font-bold text-white bg-blue-600 px-4 py-2 rounded-xl hover:bg-blue-700 transition cursor-pointer"
            >
              + Create New {selectedType && selectedType !== "all" ? `${TYPE_CONFIG[selectedType]?.label || selectedType}` : "Bank"} Question
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="grid grid-cols-1 gap-4">
              {paginatedQuestions.map((q) => {
              const typeCfg = TYPE_CONFIG[q.question_type] || {
                label: q.question_type,
                icon: HelpCircle,
                bg: "bg-slate-50 text-slate-700 border-slate-200"
              };
              const TypeIcon = typeCfg.icon;

              const diffColor = 
                q.difficulty === "easy" 
                  ? "bg-emerald-50 text-emerald-700 border-emerald-200" 
                  : q.difficulty === "hard" 
                  ? "bg-rose-50 text-rose-700 border-rose-200" 
                  : "bg-amber-50 text-amber-700 border-amber-200";

              return (
                <div
                  key={q.id}
                  className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs hover:border-slate-300 transition space-y-3"
                >
                  {/* Top Bar: Metadata Badges */}
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono text-[11px] font-black text-slate-400 bg-slate-100 px-2 py-0.5 rounded-md">
                        #QB-{q.id}
                      </span>

                      {q.course_code && (
                        <span className="text-[11px] font-bold text-slate-700 bg-slate-50 border border-slate-200 px-2 py-0.5 rounded-md flex items-center gap-1">
                          <GraduationCap className="w-3 h-3 text-blue-600" />
                          {q.course_code}
                        </span>
                      )}

                      {q.topic && (
                        <span className="text-[11px] font-semibold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-md">
                          {q.topic}
                        </span>
                      )}

                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md border flex items-center gap-1 ${typeCfg.bg}`}>
                        <TypeIcon className="w-3 h-3" />
                        {typeCfg.label}
                      </span>

                      {/* Verbal Reasoning Subtype Badge */}
                      {q.question_type === "verbal_reasoning" && (() => {
                        const sub = getQuestionSubType(q) || "analogy";
                        const subMeta = VERBAL_SUBTYPES.find(s => s.id === sub);
                        return (
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedType("verbal_reasoning");
                              setSelectedSubType(sub);
                            }}
                            title={`Filter by Verbal Subtype: ${subMeta?.label || sub}`}
                            className="text-[10px] font-bold px-2 py-0.5 rounded-md border bg-teal-50 hover:bg-teal-100 text-teal-800 border-teal-200 transition flex items-center gap-1 active:scale-95 shadow-2xs cursor-pointer"
                          >
                            <span>{subMeta?.icon || "🧠"}</span>
                            <span>{subMeta?.label || sub}</span>
                            <span className="opacity-70 text-[9px] font-arabic">({subMeta?.labelUrdu})</span>
                          </button>
                        );
                      })()}

                      {/* Non-Verbal Subtype Badge */}
                      {q.question_type === "non_verbal" && (() => {
                        const sub = getQuestionSubType(q) || "series";
                        const subMeta = NON_VERBAL_SUBTYPES.find(s => s.id === sub);
                        return (
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedType("non_verbal");
                              setSelectedSubType(sub);
                            }}
                            title={`Filter by Non-Verbal Subtype: ${subMeta?.label || sub}`}
                            className="text-[10px] font-bold px-2 py-0.5 rounded-md border bg-orange-50 hover:bg-orange-100 text-orange-800 border-orange-200 transition flex items-center gap-1 active:scale-95 shadow-2xs cursor-pointer"
                          >
                            <span>{subMeta?.icon || "📐"}</span>
                            <span>{subMeta?.label || sub}</span>
                            <span className="opacity-70 text-[9px] font-arabic">({subMeta?.labelUrdu})</span>
                          </button>
                        );
                      })()}

                      <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md border ${diffColor}`}>
                        {q.difficulty}
                      </span>

                      <span className="text-[11px] font-semibold text-slate-500">
                        {q.marks} Marks
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-[11px] text-slate-400 font-medium">
                        Used in <strong className="text-slate-700">{q.usage_count || 0}</strong> exams
                      </span>

                      <button
                        onClick={() => handleOpenEdit(q)}
                        className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition"
                        title="Edit question in bank"
                      >
                        <Edit className="w-4 h-4" />
                      </button>

                      <button
                        onClick={() => handleDelete(q.id)}
                        className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                        title="Delete question from bank"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Statement with KaTeX math */}
                  <div
                    className="text-sm font-semibold text-slate-900 leading-relaxed overflow-x-auto"
                    dangerouslySetInnerHTML={{ __html: formatMarkdownPreview(q.question_text) }}
                  />

                  {/* Options Preview */}
                  {renderOptionsPreview(q)}

                  {/* Explanation if exists */}
                  {q.explanation && (
                    <div className="text-xs text-slate-600 bg-slate-50/80 p-2.5 rounded-xl border border-slate-200/60 flex items-start gap-2">
                      <Sparkles className="w-3.5 h-3.5 text-amber-500 shrink-0 mt-0.5" />
                      <div>
                        <strong className="text-slate-800">Explanation: </strong>
                        <span dangerouslySetInnerHTML={{ __html: formatMarkdownPreview(q.explanation) }} />
                      </div>
                    </div>
                  )}

                  {/* Bottom Tags */}
                  {q.tags && (
                    <div className="flex items-center gap-1 pt-1 text-[11px] text-slate-400">
                      <Tag className="w-3 h-3" />
                      <span>{q.tags}</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Pagination Controls for High-Performance Lateral Windowing */}
          {totalPages > 1 && (
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs flex flex-col sm:flex-row items-center justify-between gap-3 mt-4">
              <div className="text-xs text-slate-500 font-medium">
                Showing <strong>{(currentPage - 1) * pageSize + 1}</strong> – <strong>{Math.min(currentPage * pageSize, filteredQuestions.length)}</strong> of <strong>{filteredQuestions.length.toLocaleString()}</strong> questions
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                <button
                  onClick={() => {
                    setCurrentPage(prev => Math.max(1, prev - 1));
                    window.scrollTo({ top: 350, behavior: "smooth" });
                  }}
                  disabled={currentPage === 1}
                  className="px-3 py-1.5 rounded-xl border text-xs font-bold transition disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50 text-slate-700 border-slate-200 flex items-center gap-1 cursor-pointer"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                  <span>Previous</span>
                </button>

                <div className="flex items-center gap-1">
                  <span className="text-xs font-bold text-slate-700 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl">
                    Page {currentPage} of {totalPages}
                  </span>
                </div>

                <button
                  onClick={() => {
                    setCurrentPage(prev => Math.min(totalPages, prev + 1));
                    window.scrollTo({ top: 350, behavior: "smooth" });
                  }}
                  disabled={currentPage === totalPages}
                  className="px-3 py-1.5 rounded-xl border text-xs font-bold transition disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50 text-slate-700 border-slate-200 flex items-center gap-1 cursor-pointer"
                >
                  <span>Next</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>

                {/* Page size dropdown */}
                <div className="flex items-center gap-1.5 ml-2 border-l border-slate-200 pl-3">
                  <span className="text-[11px] text-slate-400 font-bold uppercase">Rows:</span>
                  <select
                    value={pageSize}
                    onChange={(e) => {
                      setPageSize(Number(e.target.value));
                      setCurrentPage(1);
                    }}
                    className="px-2 py-1 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-slate-700 focus:bg-white focus:outline-none"
                  >
                    <option value={25}>25 / page</option>
                    <option value={50}>50 / page</option>
                    <option value={100}>100 / page</option>
                    <option value={200}>200 / page</option>
                  </select>
                </div>
              </div>
            </div>
          )}
          </div>
        )}
      </div>

      {/* 5. Create / Edit Question Modal (Universal Multi-Type) */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl w-full max-w-3xl overflow-hidden my-6 animate-in fade-in zoom-in-95 duration-150 flex flex-col max-h-[92vh]">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/70 shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-xs">
                  <Database className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-base font-heading">
                    {editingQuestion ? `Edit Question #QB-${editingQuestion.id}` : "Add New Question to Question Bank"}
                  </h3>
                  <p className="text-xs text-slate-500">
                    Configure question parameters, LaTeX KaTeX formulas, and grading options.
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsFormulaDrawerOpen(prev => !prev)}
                  className={`px-3 py-1.5 rounded-xl border text-xs font-bold transition flex items-center gap-1.5 shadow-2xs active:scale-95 cursor-pointer ${
                    isFormulaDrawerOpen
                      ? "bg-blue-600 text-white border-blue-600 shadow-md shadow-blue-500/20"
                      : "bg-blue-50 hover:bg-blue-100 text-blue-700 border-blue-200"
                  }`}
                  title="Open Formula & Symbol Slider (200+ Symbols)"
                >
                  <Calculator className="w-4 h-4" />
                  <span>Formula Slider (200+)</span>
                </button>
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="w-8 h-8 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 flex items-center justify-center cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSaveModal} className="p-6 space-y-5 overflow-y-auto flex-1">
              {/* Type Switcher Tab Strip at Top of Modal */}
              <div className="space-y-1.5 bg-slate-50/60 p-3 rounded-2xl border border-slate-200/80">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                  Select Question Format & Type:
                </label>
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
                  {Object.entries(TYPE_CONFIG).map(([typeKey, cfg]) => {
                    const Icon = cfg.icon;
                    const isActive = formData.question_type === typeKey;
                    return (
                      <button
                        key={typeKey}
                        type="button"
                        onClick={() => setFormData(prev => ({ ...prev, question_type: typeKey }))}
                        className={`px-3 py-1.5 rounded-xl font-bold transition flex items-center gap-1.5 shrink-0 ${
                          isActive
                            ? "bg-blue-600 text-white shadow-xs"
                            : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
                        }`}
                      >
                        <Icon className="w-3.5 h-3.5" />
                        <span>{cfg.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Category, Topic, Difficulty & Marks */}
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-600 uppercase">Program / Course</label>
                  <select
                    value={formData.course_id}
                    onChange={(e) => setFormData({ ...formData, course_id: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  >
                    {courses.map(c => (
                      <option key={c.id} value={String(c.id)}>{c.code} - {c.title}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-600 uppercase">Topic / Chapter</label>
                  <input
                    type="text"
                    value={formData.topic}
                    onChange={(e) => setFormData({ ...formData, topic: e.target.value })}
                    placeholder="e.g. Kinematics"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-600 uppercase">Difficulty</label>
                  <select
                    value={formData.difficulty}
                    onChange={(e) => setFormData({ ...formData, difficulty: e.target.value as any })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  >
                    <option value="easy">Easy (Fundamentals)</option>
                    <option value="medium">Medium (Standard)</option>
                    <option value="hard">Hard (Advanced)</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-600 uppercase">Marks</label>
                  <input
                    type="number"
                    value={formData.marks}
                    onChange={(e) => setFormData({ ...formData, marks: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  />
                </div>
              </div>

              {/* Question Statement */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-[11px] font-bold text-slate-600 uppercase">
                    Question Statement (KaTeX LaTeX Supported)
                  </label>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setActiveFormulaTarget("question_text");
                        setIsFormulaDrawerOpen(true);
                      }}
                      className="text-[11px] font-bold text-blue-700 hover:text-blue-900 bg-blue-50 hover:bg-blue-100 border border-blue-200 px-2.5 py-0.5 rounded-lg flex items-center gap-1 transition shadow-2xs active:scale-95 cursor-pointer"
                      title="Open Formula Slider for Question Statement"
                    >
                      <Calculator className="w-3.5 h-3.5 text-blue-600" />
                      <span>Formula Slider</span>
                    </button>
                    <span className="text-[11px] text-blue-600 font-mono">Use $inline$ or $$block$$</span>
                  </div>
                </div>
                <textarea
                  rows={3}
                  value={formData.question_text}
                  onFocus={() => setActiveFormulaTarget("question_text")}
                  onChange={(e) => setFormData({ ...formData, question_text: e.target.value })}
                  placeholder="Type question statement. e.g. Solve: $\int_0^1 x^2 dx$."
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-mono focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  required
                />
              </div>

              {/* KaTeX Live Preview */}
              {formData.question_text && (
                <div className="bg-slate-50/70 p-3.5 rounded-2xl border border-slate-200/80 space-y-1">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Live LaTeX Preview:</span>
                  <div
                    className="text-xs text-slate-800"
                    dangerouslySetInnerHTML={{ __html: formatMarkdownPreview(formData.question_text) }}
                  />
                </div>
              )}

              {/* ======================================================== */}
              {/* DEDICATED QUESTION TYPE INTERFACES                       */}
              {/* ======================================================== */}

              {/* 1. Multiple Choice (MCQ) */}
              {formData.question_type === "mcq" && (
                <div className="space-y-3 bg-blue-50/20 p-4 rounded-2xl border border-blue-200/60">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-blue-900 uppercase flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4 text-blue-600" />
                      <span>Multiple Choice Options (Select Single Correct Answer)</span>
                    </label>
                    <button
                      type="button"
                      onClick={() => {
                        const nextId = String(formData.options.length + 1);
                        setFormData(prev => ({
                          ...prev,
                          options: [...prev.options, { id: nextId, text: `Option ${String.fromCharCode(64 + Number(nextId))}` }]
                        }));
                      }}
                      className="text-[11px] font-bold text-blue-700 bg-white px-2.5 py-1 rounded-lg border border-blue-200 shadow-2xs hover:bg-blue-50 flex items-center gap-1"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Add Option</span>
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {formData.options.map((opt, oIdx) => (
                      <div key={opt.id} className="flex items-center gap-2 bg-white p-2.5 rounded-xl border border-slate-200 shadow-2xs">
                        <input
                          type="radio"
                          name="mcq_correct"
                          checked={formData.correct_mcq === opt.id}
                          onChange={() => setFormData({ ...formData, correct_mcq: opt.id })}
                          title="Select as correct answer"
                          className="w-4 h-4 text-emerald-600 focus:ring-emerald-500"
                        />
                        <span className="w-5 h-5 rounded-full bg-slate-100 text-slate-600 text-[10px] font-bold flex items-center justify-center shrink-0">
                          {String.fromCharCode(65 + oIdx)}
                        </span>
                        <input
                          type="text"
                          value={opt.text}
                          onFocus={() => setActiveFormulaTarget(`option_${oIdx}`)}
                          onChange={(e) => {
                            const copy = [...formData.options];
                            copy[oIdx].text = e.target.value;
                            setFormData({ ...formData, options: copy });
                          }}
                          placeholder={`Option ${String.fromCharCode(65 + oIdx)}`}
                          className="flex-1 px-2.5 py-1 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 font-mono"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            setActiveFormulaTarget(`option_${oIdx}`);
                            setIsFormulaDrawerOpen(true);
                          }}
                          className="p-1 text-slate-400 hover:text-blue-600 rounded hover:bg-blue-50 transition cursor-pointer"
                          title={`Open Formula Slider for Option ${String.fromCharCode(65 + oIdx)}`}
                        >
                          <Calculator className="w-3.5 h-3.5" />
                        </button>
                        {formData.options.length > 2 && (
                          <button
                            type="button"
                            onClick={() => {
                              const copy = formData.options.filter((_, i) => i !== oIdx);
                              setFormData({ ...formData, options: copy });
                            }}
                            className="p-1 text-slate-400 hover:text-rose-600"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                  <p className="text-[11px] text-slate-400">Radio button selects the correct answer for automated grading.</p>
                </div>
              )}

              {/* 2. Multi-Select */}
              {formData.question_type === "multi_select" && (
                <div className="space-y-3 bg-purple-50/20 p-4 rounded-2xl border border-purple-200/60">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-purple-900 uppercase flex items-center gap-1.5">
                      <CheckSquare className="w-4 h-4 text-purple-600" />
                      <span>Multi-Select Options (Check Multiple Correct Answers)</span>
                    </label>
                    <button
                      type="button"
                      onClick={() => {
                        const nextId = String(formData.options.length + 1);
                        setFormData(prev => ({
                          ...prev,
                          options: [...prev.options, { id: nextId, text: `Option ${String.fromCharCode(64 + Number(nextId))}` }]
                        }));
                      }}
                      className="text-[11px] font-bold text-purple-700 bg-white px-2.5 py-1 rounded-lg border border-purple-200 shadow-2xs hover:bg-purple-50 flex items-center gap-1"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Add Option</span>
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {formData.options.map((opt, oIdx) => {
                      const isChecked = formData.correct_multi.includes(opt.id);
                      return (
                        <div key={opt.id} className={`flex items-center gap-2 p-2.5 rounded-xl border transition ${
                          isChecked ? "bg-purple-50/40 border-purple-300" : "bg-white border-slate-200"
                        }`}>
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={(e) => {
                              const current = formData.correct_multi;
                              const updated = e.target.checked
                                ? [...current, opt.id]
                                : current.filter(id => id !== opt.id);
                              setFormData({ ...formData, correct_multi: updated });
                            }}
                            className="w-4 h-4 text-purple-600 rounded focus:ring-purple-500"
                          />
                          <span className="w-5 h-5 rounded-full bg-slate-100 text-slate-600 text-[10px] font-bold flex items-center justify-center shrink-0">
                            {String.fromCharCode(65 + oIdx)}
                          </span>
                          <input
                            type="text"
                            value={opt.text}
                            onFocus={() => setActiveFormulaTarget(`option_${oIdx}`)}
                            onChange={(e) => {
                              const copy = [...formData.options];
                              copy[oIdx].text = e.target.value;
                              setFormData({ ...formData, options: copy });
                            }}
                            placeholder={`Option ${String.fromCharCode(65 + oIdx)}`}
                            className="flex-1 px-2.5 py-1 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium focus:bg-white focus:outline-none focus:ring-1 focus:ring-purple-500 font-mono"
                          />
                          <button
                            type="button"
                            onClick={() => {
                              setActiveFormulaTarget(`option_${oIdx}`);
                              setIsFormulaDrawerOpen(true);
                            }}
                            className="p-1 text-slate-400 hover:text-purple-600 rounded hover:bg-purple-50 transition cursor-pointer"
                            title={`Open Formula Slider for Option ${String.fromCharCode(65 + oIdx)}`}
                          >
                            <Calculator className="w-3.5 h-3.5" />
                          </button>
                          {formData.options.length > 2 && (
                            <button
                              type="button"
                              onClick={() => {
                                const copy = formData.options.filter((_, i) => i !== oIdx);
                                setFormData({ ...formData, options: copy });
                              }}
                              className="p-1 text-slate-400 hover:text-rose-600"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                  <p className="text-[11px] text-purple-700 font-medium">Checkboxes select all options that students must check to receive credit.</p>
                </div>
              )}

              {/* 3. True / False */}
              {formData.question_type === "true_false" && (
                <div className="space-y-3 bg-emerald-50/20 p-4 rounded-2xl border border-emerald-200/60">
                  <label className="text-xs font-bold text-emerald-900 uppercase flex items-center gap-1.5">
                    <HelpCircle className="w-4 h-4 text-emerald-600" />
                    <span>Designate Correct Fact Assertion *</span>
                  </label>

                  <div className="grid grid-cols-2 gap-4">
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, correct_tf: "true" })}
                      className={`p-4 rounded-2xl border-2 flex items-center justify-center gap-3 transition-all ${
                        formData.correct_tf === "true"
                          ? "border-emerald-500 bg-emerald-50 text-emerald-900 shadow-md ring-2 ring-emerald-500/20 font-black"
                          : "border-slate-200 bg-white text-slate-500 hover:bg-slate-50"
                      }`}
                    >
                      <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                      <div className="text-left">
                        <span className="block text-sm font-black">TRUE</span>
                        <span className="text-[10px] opacity-80">Statement is factually correct</span>
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, correct_tf: "false" })}
                      className={`p-4 rounded-2xl border-2 flex items-center justify-center gap-3 transition-all ${
                        formData.correct_tf === "false"
                          ? "border-rose-500 bg-rose-50 text-rose-900 shadow-md ring-2 ring-rose-500/20 font-black"
                          : "border-slate-200 bg-white text-slate-500 hover:bg-slate-50"
                      }`}
                    >
                      <XCircle className="w-5 h-5 text-rose-600" />
                      <div className="text-left">
                        <span className="block text-sm font-black">FALSE</span>
                        <span className="text-[10px] opacity-80">Statement is factually incorrect</span>
                      </div>
                    </button>
                  </div>
                </div>
              )}

              {/* 4. Fill in the Blanks */}
              {formData.question_type === "fill_blank" && (
                <div className="space-y-4 bg-amber-50/30 p-4 rounded-2xl border border-amber-200/60">
                  <label className="text-xs font-bold text-amber-900 uppercase flex items-center gap-1.5">
                    <Edit3 className="w-4 h-4 text-amber-600" />
                    <span>Fill in the Blank Configuration</span>
                  </label>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
                        Primary Target Answer *
                      </label>
                      <input
                        type="text"
                        required
                        value={formData.blank_answer}
                        onChange={(e) => setFormData({ ...formData, blank_answer: e.target.value })}
                        placeholder="e.g. Ohm, mitochondria, or 100°C"
                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold focus:outline-none focus:ring-1 focus:ring-amber-500"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
                        Alternative Valid Synonyms (Pipe | Separated)
                      </label>
                      <input
                        type="text"
                        value={formData.blank_alternatives}
                        onChange={(e) => setFormData({ ...formData, blank_alternatives: e.target.value })}
                        placeholder="e.g. ohms | Ω or powerhouse"
                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-amber-500"
                      />
                    </div>
                  </div>

                  <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-slate-700">
                    <input
                      type="checkbox"
                      checked={formData.blank_case_sensitive}
                      onChange={(e) => setFormData({ ...formData, blank_case_sensitive: e.target.checked })}
                      className="text-amber-600 rounded"
                    />
                    <span>Strict Case-Sensitive Evaluation</span>
                  </label>
                </div>
              )}

              {/* 5. Column Mapping */}
              {formData.question_type === "column_mapping" && (
                <div className="space-y-3 bg-indigo-50/20 p-4 rounded-2xl border border-indigo-200/60">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-indigo-900 uppercase flex items-center gap-1.5">
                      <ArrowRightLeft className="w-4 h-4 text-indigo-600" />
                      <span>Column A to Column B Matching Pairs *</span>
                    </label>
                    <button
                      type="button"
                      onClick={() => {
                        const pairs = [...formData.matching_pairs];
                        pairs.push({ left: `Item ${pairs.length + 1}`, right: `Match ${pairs.length + 1}` });
                        setFormData({ ...formData, matching_pairs: pairs });
                      }}
                      className="text-[11px] font-bold text-indigo-700 bg-white px-2.5 py-1 rounded-lg border border-indigo-200 shadow-2xs hover:bg-indigo-50 flex items-center gap-1"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Add Pair Row</span>
                    </button>
                  </div>

                  <div className="space-y-2">
                    {formData.matching_pairs.map((pair, pIdx) => (
                      <div key={pIdx} className="grid grid-cols-12 gap-2 items-center bg-white p-2.5 rounded-xl border border-slate-200 shadow-2xs">
                        <span className="col-span-1 text-xs font-black text-indigo-600 text-center font-mono">
                          #{pIdx + 1}
                        </span>
                        <div className="col-span-5">
                          <input
                            type="text"
                            required
                            value={pair.left}
                            onChange={(e) => {
                              const copy = [...formData.matching_pairs];
                              copy[pIdx].left = e.target.value;
                              setFormData({ ...formData, matching_pairs: copy });
                            }}
                            placeholder="Column A Item (e.g. Force)"
                            className="w-full px-2.5 py-1 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold focus:bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                          />
                        </div>
                        <span className="col-span-1 text-center font-bold text-slate-400 text-xs">↔</span>
                        <div className="col-span-4">
                          <input
                            type="text"
                            required
                            value={pair.right}
                            onChange={(e) => {
                              const copy = [...formData.matching_pairs];
                              copy[pIdx].right = e.target.value;
                              setFormData({ ...formData, matching_pairs: copy });
                            }}
                            placeholder="Column B Match (e.g. Newton)"
                            className="w-full px-2.5 py-1 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold focus:bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                          />
                        </div>
                        <div className="col-span-1 text-right">
                          {formData.matching_pairs.length > 2 && (
                            <button
                              type="button"
                              onClick={() => {
                                const copy = formData.matching_pairs.filter((_, i) => i !== pIdx);
                                setFormData({ ...formData, matching_pairs: copy });
                              }}
                              className="p-1 text-slate-400 hover:text-rose-600"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 6. Numerical Problem */}
              {formData.question_type === "numerical" && (
                <div className="space-y-3 bg-cyan-50/20 p-4 rounded-2xl border border-cyan-200/60">
                  <label className="text-xs font-bold text-cyan-900 uppercase flex items-center gap-1.5">
                    <Hash className="w-4 h-4 text-cyan-600" />
                    <span>Scientific Calculation & Tolerance Bounds</span>
                  </label>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
                        Exact Target Value *
                      </label>
                      <input
                        type="number"
                        step="any"
                        required
                        value={formData.num_exact}
                        onChange={(e) => setFormData({ ...formData, num_exact: e.target.value })}
                        placeholder="e.g. 9.8"
                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-mono font-bold focus:outline-none focus:ring-1 focus:ring-cyan-500"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
                        Acceptable Margin (±)
                      </label>
                      <input
                        type="number"
                        step="any"
                        value={formData.num_tolerance}
                        onChange={(e) => setFormData({ ...formData, num_tolerance: e.target.value })}
                        placeholder="e.g. 0.1"
                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-mono font-bold focus:outline-none focus:ring-1 focus:ring-cyan-500"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
                        Physical Unit
                      </label>
                      <input
                        type="text"
                        value={formData.num_unit}
                        onChange={(e) => setFormData({ ...formData, num_unit: e.target.value })}
                        placeholder="e.g. m/s², N, Joules"
                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-cyan-500"
                      />
                    </div>
                  </div>

                  {formData.num_exact && (
                    <div className="text-[11px] text-cyan-900 bg-white p-2 rounded-xl border border-cyan-100 font-mono">
                      Accepted Student Range: [
                      {Number(formData.num_exact) - (Number(formData.num_tolerance) || 0)} ... {Number(formData.num_exact) + (Number(formData.num_tolerance) || 0)}
                      ] {formData.num_unit}
                    </div>
                  )}
                </div>
              )}

              {/* 7. Short Answer */}
              {formData.question_type === "short_answer" && (
                <div className="space-y-3 bg-rose-50/20 p-4 rounded-2xl border border-rose-200/60">
                  <label className="text-xs font-bold text-rose-900 uppercase flex items-center gap-1.5">
                    <FileText className="w-4 h-4 text-rose-600" />
                    <span>Short Conceptual Question & Auto-Grading Keywords</span>
                  </label>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
                      Teacher Model Answer / Reference Solution *
                    </label>
                    <textarea
                      rows={2}
                      required
                      value={formData.short_model_answer}
                      onChange={(e) => setFormData({ ...formData, short_model_answer: e.target.value })}
                      placeholder="e.g. Photosynthesis converts sunlight, water, and CO2 into glucose."
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-1 focus:ring-rose-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
                      Auto-Grading Keywords (Comma-separated)
                    </label>
                    <input
                      type="text"
                      value={formData.short_keywords}
                      onChange={(e) => setFormData({ ...formData, short_keywords: e.target.value })}
                      placeholder="e.g. sunlight, glucose, chloroplast"
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-rose-500"
                    />
                  </div>
                </div>
              )}

              {/* 8. Long Essay Question */}
              {formData.question_type === "long_answer" && (
                <div className="space-y-3 bg-violet-50/20 p-4 rounded-2xl border border-violet-200/60">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-violet-900 uppercase flex items-center gap-1.5">
                      <BookOpen className="w-4 h-4 text-violet-600" />
                      <span>Long Descriptive Essay & Theoretical Derivations</span>
                    </label>
                    <div className="flex items-center gap-1 text-xs">
                      <span className="text-slate-500 font-bold">Min Words:</span>
                      <input
                        type="number"
                        value={formData.long_min_words}
                        onChange={(e) => setFormData({ ...formData, long_min_words: Number(e.target.value) || 50 })}
                        className="w-14 px-2 py-0.5 rounded border border-slate-200 text-xs font-mono font-bold text-center"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
                      Complete Model Solution & Steps *
                    </label>
                    <textarea
                      rows={3}
                      required
                      value={formData.long_model_answer}
                      onChange={(e) => setFormData({ ...formData, long_model_answer: e.target.value })}
                      placeholder="Step-by-step mathematical proof, definitions, or rubric solution."
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-sans focus:outline-none focus:ring-1 focus:ring-violet-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
                      Teacher Grading Rubric & Assessment Criteria
                    </label>
                    <input
                      type="text"
                      value={formData.long_rubric}
                      onChange={(e) => setFormData({ ...formData, long_rubric: e.target.value })}
                      placeholder="e.g. Diagram (2m), Derivation (5m), Final Formula (3m)"
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-violet-500"
                    />
                  </div>
                </div>
              )}

              {/* 9. Non-Verbal Visual Pattern Sequence */}
              {formData.question_type === "non_verbal" && (
                <div className="space-y-4 bg-orange-50/30 p-4 rounded-2xl border border-orange-200/80">
                  {/* Subtype Switcher */}
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5 text-orange-950 text-xs font-bold">
                      <Layers className="w-4 h-4 text-orange-600" />
                      <span>Non-Verbal Sub-Type:</span>
                    </div>

                    <div className="flex items-center gap-1 bg-white p-1 rounded-xl border border-orange-200 text-xs font-bold">
                      {[
                        { id: "series" as const, label: "Series (تسلسل)", icon: "➡️" },
                        { id: "analogy" as const, label: "Analogy (تشبیہ)", icon: "🔄" },
                        { id: "matrix" as const, label: "Matrix (میٹرکس)", icon: "▦" },
                        { id: "odd_one_out" as const, label: "Odd One Out (مختلف)", icon: "⭐" },
                      ].map((st) => (
                        <button
                          key={st.id}
                          type="button"
                          onClick={() => switchNonVerbalSubType(st.id)}
                          className={`px-2.5 py-1 rounded-lg text-xs font-bold transition flex items-center gap-1 ${
                            formData.nv_sub_type === st.id
                              ? "bg-orange-600 text-white shadow-2xs"
                              : "text-slate-600 hover:bg-slate-50"
                          }`}
                        >
                          <span>{st.icon}</span>
                          <span>{st.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Contextual 1-Click Demos per Subtype */}
                  <div className="flex flex-wrap items-center gap-1.5 pt-1">
                    <span className="text-[10px] font-bold text-slate-400 uppercase">Quick Demos:</span>
                    {formData.nv_sub_type === "series" && (
                      <>
                        <button
                          type="button"
                          onClick={() => loadNonVerbalPreset("series_quadrant")}
                          className="text-[10px] font-bold text-amber-900 bg-white px-2 py-0.5 rounded-lg border border-amber-300 shadow-2xs hover:bg-amber-50"
                        >
                          Quadrant 90° CW
                        </button>
                        <button
                          type="button"
                          onClick={() => loadNonVerbalPreset("series_arrow")}
                          className="text-[10px] font-bold text-blue-900 bg-white px-2 py-0.5 rounded-lg border border-blue-300 shadow-2xs hover:bg-blue-50"
                        >
                          Arrow Rotation
                        </button>
                        <button
                          type="button"
                          onClick={() => loadNonVerbalPreset("series_dots")}
                          className="text-[10px] font-bold text-purple-900 bg-white px-2 py-0.5 rounded-lg border border-purple-300 shadow-2xs hover:bg-purple-50"
                        >
                          Increasing Dots
                        </button>
                      </>
                    )}
                    {formData.nv_sub_type === "analogy" && (
                      <>
                        <button
                          type="button"
                          onClick={() => loadNonVerbalPreset("analogy_nested")}
                          className="text-[10px] font-bold text-indigo-900 bg-white px-2 py-0.5 rounded-lg border border-indigo-300 shadow-2xs hover:bg-indigo-50"
                        >
                          Inversion Analogy
                        </button>
                        <button
                          type="button"
                          onClick={() => loadNonVerbalPreset("analogy_shading")}
                          className="text-[10px] font-bold text-amber-900 bg-white px-2 py-0.5 rounded-lg border border-amber-300 shadow-2xs hover:bg-amber-50"
                        >
                          Shading Analogy
                        </button>
                      </>
                    )}
                    {formData.nv_sub_type === "matrix" && (
                      <>
                        <button
                          type="button"
                          onClick={() => loadNonVerbalPreset("matrix_2x2_dot")}
                          className="text-[10px] font-bold text-purple-900 bg-white px-2 py-0.5 rounded-lg border border-purple-300 shadow-2xs hover:bg-purple-50"
                        >
                          2×2 Dot Matrix
                        </button>
                        <button
                          type="button"
                          onClick={() => loadNonVerbalPreset("matrix_3x3_lines")}
                          className="text-[10px] font-bold text-indigo-900 bg-white px-2 py-0.5 rounded-lg border border-indigo-300 shadow-2xs hover:bg-indigo-50"
                        >
                          3×3 Line Matrix
                        </button>
                      </>
                    )}
                    {formData.nv_sub_type === "odd_one_out" && (
                      <>
                        <button
                          type="button"
                          onClick={() => loadNonVerbalPreset("odd_one_out_quads")}
                          className="text-[10px] font-bold text-amber-900 bg-white px-2 py-0.5 rounded-lg border border-amber-300 shadow-2xs hover:bg-amber-50"
                        >
                          4 Quads vs 1 Triangle
                        </button>
                        <button
                          type="button"
                          onClick={() => loadNonVerbalPreset("odd_one_out_dots")}
                          className="text-[10px] font-bold text-rose-900 bg-white px-2 py-0.5 rounded-lg border border-rose-300 shadow-2xs hover:bg-rose-50"
                        >
                          Dot Inside vs Outside
                        </button>
                      </>
                    )}
                  </div>

                  {/* ======================================================== */}
                  {/* 1. DEDICATED INTERFACE: SERIES (تسلسل)                     */}
                  {/* ======================================================== */}
                  {formData.nv_sub_type === "series" && (
                    <div className="space-y-3 bg-white p-4 rounded-2xl border border-orange-200/90 shadow-2xs">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="w-6 h-6 rounded-lg bg-orange-100 text-orange-700 flex items-center justify-center font-black text-xs">
                            ➡️
                          </span>
                          <div>
                            <h5 className="text-xs font-bold text-slate-800 uppercase tracking-wide">
                              Series Sequence Strip (1 ➔ 2 ➔ 3 ➔ ?)
                            </h5>
                            <p className="text-[10px] text-slate-400">
                              Figures progress sequentially from left to right leading to target slot [ ? ]
                            </p>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            setFormData(prev => ({
                              ...prev,
                              nv_problem_images: [...prev.nv_problem_images, getShapeSvg("poly_square_hollow")]
                            }));
                          }}
                          className="text-[10px] font-bold text-orange-700 bg-orange-50 hover:bg-orange-100 px-2.5 py-1 rounded-lg border border-orange-200 flex items-center gap-1 transition"
                        >
                          <Plus className="w-3 h-3" />
                          <span>Add Figure</span>
                        </button>
                      </div>

                      {/* Horizontal Strip */}
                      <div className="flex items-center gap-2.5 overflow-x-auto py-2 px-1">
                        {formData.nv_problem_images.map((img, fIdx) => (
                          <div key={fIdx} className="flex items-center gap-2.5 shrink-0">
                            <div className="flex flex-col items-center gap-1.5 p-2 rounded-xl bg-slate-50 border border-slate-200 hover:border-orange-300 transition">
                              <span className="text-[10px] font-black text-slate-500 uppercase">Fig {fIdx + 1}</span>
                              <div className="w-16 h-16 bg-white rounded-lg border border-slate-200 p-1 flex items-center justify-center shadow-2xs">
                                {img ? (
                                  <img src={img} alt={`Fig ${fIdx + 1}`} className="max-w-full max-h-full object-contain" />
                                ) : (
                                  <span className="text-[10px] text-slate-300">Empty</span>
                                )}
                              </div>
                              <div className="flex items-center gap-1 w-full justify-center">
                                <button
                                  type="button"
                                  onClick={() => {
                                    setShapePickerTarget({ targetType: "problem", slotIndex: fIdx });
                                    setIsShapePickerOpen(true);
                                  }}
                                  className="text-[10px] font-bold text-blue-600 hover:text-blue-800 bg-blue-50 px-2 py-0.5 rounded border border-blue-200/60"
                                >
                                  Shape
                                </button>
                                {formData.nv_problem_images.length > 2 && (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      const next = formData.nv_problem_images.filter((_, i) => i !== fIdx);
                                      setFormData({ ...formData, nv_problem_images: next });
                                    }}
                                    className="text-[10px] text-slate-400 hover:text-rose-600 px-1 py-0.5"
                                    title="Remove figure"
                                  >
                                    ✕
                                  </button>
                                )}
                              </div>
                            </div>
                            <span className="text-slate-300 font-black text-base">➔</span>
                          </div>
                        ))}

                        {/* Explicit [ ? ] Target Slot */}
                        <div className="flex flex-col items-center gap-1.5 p-2 rounded-xl bg-amber-50/70 border-2 border-dashed border-amber-400 shrink-0 shadow-2xs animate-pulse">
                          <span className="text-[10px] font-black text-amber-800 uppercase">Next (?)</span>
                          <div className="w-16 h-16 bg-white/80 rounded-lg flex flex-col items-center justify-center text-amber-600">
                            <span className="text-2xl font-black">?</span>
                            <span className="text-[8px] font-bold text-amber-700">Missing</span>
                          </div>
                          <span className="text-[9px] font-bold text-amber-700">Target Slot</span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* ======================================================== */}
                  {/* 2. DEDICATED INTERFACE: ANALOGY (تشبیہ)                   */}
                  {/* ======================================================== */}
                  {formData.nv_sub_type === "analogy" && (
                    <div className="space-y-3 bg-white p-4 rounded-2xl border border-indigo-200/90 shadow-2xs">
                      <div className="flex items-center gap-2">
                        <span className="w-6 h-6 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center font-black text-xs">
                          🔄
                        </span>
                        <div>
                          <h5 className="text-xs font-bold text-indigo-950 uppercase tracking-wide">
                            Geometric Analogy (Figure A : Figure B :: Figure C : ?)
                          </h5>
                          <p className="text-[10px] text-slate-400">
                            Pair 1 establishes the rule (A is to B). That exact transformation is applied to Figure C to find target [ ? ].
                          </p>
                        </div>
                      </div>

                      <div className="flex flex-col md:flex-row items-center justify-between gap-3 pt-1">
                        {/* Pair 1: Given Relationship (Fig A : Fig B) */}
                        <div className="flex-1 w-full p-3 rounded-xl border border-indigo-200 bg-indigo-50/40 space-y-2">
                          <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded bg-indigo-600 text-white shadow-2xs inline-block">
                            Pair 1 (Given Relationship / معلوم جوڑا)
                          </span>
                          <div className="flex items-center justify-center gap-3 pt-1">
                            {/* Figure A */}
                            <div className="flex flex-col items-center p-2 rounded-xl border border-indigo-200 bg-white shadow-xs w-24">
                              <span className="text-[10px] font-black text-indigo-900 mb-1">Figure A</span>
                              <div className="w-14 h-14 rounded-lg border border-slate-200 p-1 flex items-center justify-center mb-1.5 bg-slate-50">
                                {formData.nv_problem_images[0] ? (
                                  <img src={formData.nv_problem_images[0]} alt="Fig A" className="max-w-full max-h-full object-contain" />
                                ) : (
                                  <span className="text-[10px] text-slate-300">Empty</span>
                                )}
                              </div>
                              <button
                                type="button"
                                onClick={() => {
                                  setShapePickerTarget({ targetType: "problem", slotIndex: 0 });
                                  setIsShapePickerOpen(true);
                                }}
                                className="w-full text-center px-1.5 py-0.5 rounded bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-[10px] font-bold border border-indigo-200"
                              >
                                Shape
                              </button>
                            </div>

                            {/* Colon : */}
                            <div className="flex flex-col items-center">
                              <span className="text-2xl font-black text-indigo-600 leading-none">:</span>
                              <span className="text-[9px] font-bold text-indigo-500">is to</span>
                            </div>

                            {/* Figure B */}
                            <div className="flex flex-col items-center p-2 rounded-xl border border-indigo-200 bg-white shadow-xs w-24">
                              <span className="text-[10px] font-black text-indigo-900 mb-1">Figure B</span>
                              <div className="w-14 h-14 rounded-lg border border-slate-200 p-1 flex items-center justify-center mb-1.5 bg-slate-50">
                                {formData.nv_problem_images[1] ? (
                                  <img src={formData.nv_problem_images[1]} alt="Fig B" className="max-w-full max-h-full object-contain" />
                                ) : (
                                  <span className="text-[10px] text-slate-300">Empty</span>
                                )}
                              </div>
                              <button
                                type="button"
                                onClick={() => {
                                  setShapePickerTarget({ targetType: "problem", slotIndex: 1 });
                                  setIsShapePickerOpen(true);
                                }}
                                className="w-full text-center px-1.5 py-0.5 rounded bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-[10px] font-bold border border-indigo-200"
                              >
                                Shape
                              </button>
                            </div>
                          </div>
                        </div>

                        {/* Connector :: (AS) */}
                        <div className="flex flex-col items-center px-3 py-1.5 rounded-xl bg-indigo-600 text-white shadow-xs shrink-0">
                          <span className="text-lg font-black tracking-widest leading-none">::</span>
                          <span className="text-[8px] font-black uppercase">AS</span>
                        </div>

                        {/* Pair 2: Target Relationship (Fig C : Target ?) */}
                        <div className="flex-1 w-full p-3 rounded-xl border-2 border-amber-300 bg-amber-50/50 space-y-2">
                          <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded bg-amber-600 text-white shadow-2xs inline-block">
                            Pair 2 (Target Relationship / حل طلب جوڑا)
                          </span>
                          <div className="flex items-center justify-center gap-3 pt-1">
                            {/* Figure C */}
                            <div className="flex flex-col items-center p-2 rounded-xl border border-amber-200 bg-white shadow-xs w-24">
                              <span className="text-[10px] font-black text-amber-900 mb-1">Figure C</span>
                              <div className="w-14 h-14 rounded-lg border border-slate-200 p-1 flex items-center justify-center mb-1.5 bg-slate-50">
                                {formData.nv_problem_images[2] ? (
                                  <img src={formData.nv_problem_images[2]} alt="Fig C" className="max-w-full max-h-full object-contain" />
                                ) : (
                                  <span className="text-[10px] text-slate-300">Empty</span>
                                )}
                              </div>
                              <button
                                type="button"
                                onClick={() => {
                                  setShapePickerTarget({ targetType: "problem", slotIndex: 2 });
                                  setIsShapePickerOpen(true);
                                }}
                                className="w-full text-center px-1.5 py-0.5 rounded bg-amber-50 hover:bg-amber-100 text-amber-800 text-[10px] font-bold border border-amber-200"
                              >
                                Shape
                              </button>
                            </div>

                            {/* Colon : */}
                            <div className="flex flex-col items-center">
                              <span className="text-2xl font-black text-amber-600 leading-none">:</span>
                              <span className="text-[9px] font-bold text-amber-600">is to</span>
                            </div>

                            {/* Figure D: Missing Target [ ? ] */}
                            <div className="flex flex-col items-center p-2 rounded-xl border-2 border-dashed border-amber-400 bg-white shadow-xs w-24 animate-pulse">
                              <span className="text-[10px] font-black text-amber-700 mb-1">Figure D (?)</span>
                              <div className="w-14 h-14 rounded-lg bg-amber-50 border border-amber-300 flex flex-col items-center justify-center text-amber-600 mb-1.5">
                                <span className="text-xl font-black leading-none">?</span>
                                <span className="text-[8px] font-bold text-amber-700">Missing</span>
                              </div>
                              <span className="text-[9px] font-bold text-amber-600">Choices A-D</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* ======================================================== */}
                  {/* 3. DEDICATED INTERFACE: MATRIX (میٹرکس)                    */}
                  {/* ======================================================== */}
                  {formData.nv_sub_type === "matrix" && (
                    <div className="space-y-3 bg-white p-4 rounded-2xl border border-purple-200/90 shadow-2xs">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="w-6 h-6 rounded-lg bg-purple-100 text-purple-700 flex items-center justify-center font-black text-xs">
                            ▦
                          </span>
                          <div>
                            <h5 className="text-xs font-bold text-purple-950 uppercase tracking-wide">
                              Pattern Matrix Grid (شبکہ / میٹرکس)
                            </h5>
                            <p className="text-[10px] text-slate-400">
                              Logical rules operate across rows (➔) and columns (↓). The bottom-right cell is missing [ ? ].
                            </p>
                          </div>
                        </div>

                        {/* 2x2 vs 3x3 Grid Toggle */}
                        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl text-xs font-bold">
                          <button
                            type="button"
                            onClick={() => {
                              setFormData(prev => {
                                const req = 3; // 3 figures + ?
                                let imgs = [...prev.nv_problem_images];
                                if (imgs.length < req) {
                                  while (imgs.length < req) imgs.push(getShapeSvg("poly_triangle_eq"));
                                } else if (imgs.length > req) {
                                  imgs = imgs.slice(0, req);
                                }
                                return { ...prev, nv_matrix_grid: "2x2", nv_problem_images: imgs };
                              });
                            }}
                            className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition ${
                              formData.nv_matrix_grid === "2x2"
                                ? "bg-purple-600 text-white shadow-2xs"
                                : "text-slate-600 hover:text-slate-900"
                            }`}
                          >
                            2×2 Grid
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setFormData(prev => {
                                const req = 8; // 8 figures + ?
                                let imgs = [...prev.nv_problem_images];
                                if (imgs.length < req) {
                                  const default3x3 = [
                                    getShapeSvg("line_1_vert"), getShapeSvg("line_2_vert"), getShapeSvg("line_3_vert"),
                                    getShapeSvg("clock_12"), getShapeSvg("clock_3"), getShapeSvg("clock_6"),
                                    getShapeSvg("dots_1_center"), getShapeSvg("dots_2_diag")
                                  ];
                                  imgs = [...imgs, ...default3x3.slice(imgs.length, req)];
                                  while (imgs.length < req) imgs.push(getShapeSvg("poly_square_hollow"));
                                }
                                return { ...prev, nv_matrix_grid: "3x3", nv_problem_images: imgs };
                              });
                            }}
                            className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition ${
                              formData.nv_matrix_grid === "3x3"
                                ? "bg-purple-600 text-white shadow-2xs"
                                : "text-slate-600 hover:text-slate-900"
                            }`}
                          >
                            3×3 Grid
                          </button>
                        </div>
                      </div>

                      {/* Matrix Canvas */}
                      <div className="flex justify-center py-2">
                        {formData.nv_matrix_grid === "3x3" ? (
                          /* 3x3 Grid: 8 cells + 1 Target Cell */
                          <div className="grid grid-cols-3 gap-2.5 p-3 rounded-2xl bg-purple-50/40 border border-purple-200">
                            {[0, 1, 2, 3, 4, 5, 6, 7].map((cellIdx) => {
                              const row = Math.floor(cellIdx / 3) + 1;
                              const col = (cellIdx % 3) + 1;
                              const img = formData.nv_problem_images[cellIdx];
                              return (
                                <div key={cellIdx} className="flex flex-col items-center p-2 rounded-xl bg-white border border-slate-200 shadow-2xs w-20">
                                  <span className="text-[9px] font-bold text-slate-400 mb-0.5">({row},{col})</span>
                                  <div className="w-12 h-12 rounded border border-slate-200 p-0.5 flex items-center justify-center bg-slate-50 mb-1">
                                    {img ? (
                                      <img src={img} alt={`Cell ${row},${col}`} className="max-w-full max-h-full object-contain" />
                                    ) : (
                                      <span className="text-[9px] text-slate-300">Empty</span>
                                    )}
                                  </div>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setShapePickerTarget({ targetType: "problem", slotIndex: cellIdx });
                                      setIsShapePickerOpen(true);
                                    }}
                                    className="text-[9px] font-bold text-purple-700 bg-purple-50 hover:bg-purple-100 px-1.5 py-0.5 rounded border border-purple-200/60 w-full text-center"
                                  >
                                    Shape
                                  </button>
                                </div>
                              );
                            })}
                            {/* Cell (3,3) - The Target Question Mark */}
                            <div className="flex flex-col items-center p-2 rounded-xl bg-amber-50 border-2 border-dashed border-amber-400 shadow-2xs w-20 animate-pulse justify-center">
                              <span className="text-[9px] font-black text-amber-700 mb-0.5">(3,3) Target</span>
                              <div className="w-12 h-12 rounded bg-white/80 border border-amber-300 flex flex-col items-center justify-center text-amber-600 mb-1">
                                <span className="text-xl font-black leading-none">?</span>
                                <span className="text-[7px] font-bold text-amber-700">Missing</span>
                              </div>
                              <span className="text-[8px] font-bold text-amber-600">Answer Slot</span>
                            </div>
                          </div>
                        ) : (
                          /* 2x2 Grid: 3 cells + 1 Target Cell */
                          <div className="grid grid-cols-2 gap-3 p-3.5 rounded-2xl bg-purple-50/40 border border-purple-200">
                            {[0, 1, 2].map((cellIdx) => {
                              const row = Math.floor(cellIdx / 2) + 1;
                              const col = (cellIdx % 2) + 1;
                              const img = formData.nv_problem_images[cellIdx];
                              return (
                                <div key={cellIdx} className="flex flex-col items-center p-2.5 rounded-xl bg-white border border-slate-200 shadow-2xs w-28">
                                  <span className="text-[10px] font-bold text-slate-400 mb-1">Cell ({row},{col})</span>
                                  <div className="w-16 h-16 rounded-lg border border-slate-200 p-1 flex items-center justify-center bg-slate-50 mb-1.5">
                                    {img ? (
                                      <img src={img} alt={`Cell ${row},${col}`} className="max-w-full max-h-full object-contain" />
                                    ) : (
                                      <span className="text-[9px] text-slate-300">Empty</span>
                                    )}
                                  </div>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setShapePickerTarget({ targetType: "problem", slotIndex: cellIdx });
                                      setIsShapePickerOpen(true);
                                    }}
                                    className="w-full text-center text-[10px] font-bold text-purple-700 bg-purple-50 hover:bg-purple-100 px-2 py-0.5 rounded border border-purple-200"
                                  >
                                    Pick Shape
                                  </button>
                                </div>
                              );
                            })}
                            {/* Cell (2,2) - The Target Question Mark */}
                            <div className="flex flex-col items-center p-2.5 rounded-xl bg-amber-50 border-2 border-dashed border-amber-400 shadow-2xs w-28 animate-pulse justify-center">
                              <span className="text-[10px] font-black text-amber-800 mb-1">Cell (2,2) Missing</span>
                              <div className="w-16 h-16 rounded-lg bg-white/80 border border-amber-300 flex flex-col items-center justify-center text-amber-600 mb-1.5">
                                <span className="text-2xl font-black leading-none">?</span>
                                <span className="text-[9px] font-bold text-amber-700">Missing Target</span>
                              </div>
                              <span className="text-[9px] font-bold text-amber-700">Answer Slot</span>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* ======================================================== */}
                  {/* 4. DEDICATED INTERFACE: ODD ONE OUT (مختلف)               */}
                  {/* ======================================================== */}
                  {formData.nv_sub_type === "odd_one_out" && (
                    <div className="space-y-3 bg-white p-4 rounded-2xl border border-amber-200/90 shadow-2xs">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="w-6 h-6 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center font-black text-xs">
                            ⭐
                          </span>
                          <div>
                            <h5 className="text-xs font-bold text-amber-950 uppercase tracking-wide">
                              Figure Evaluation (Select The ONE Odd / Different Figure Out)
                            </h5>
                            <p className="text-[10px] text-slate-400">
                              Four figures share a common geometric property. Mark the ONE figure that violates the group rule.
                            </p>
                          </div>
                        </div>

                        {formData.nv_options.length < 5 && (
                          <button
                            type="button"
                            onClick={() => {
                              const ltr = String.fromCharCode(65 + formData.nv_options.length);
                              setFormData(prev => ({
                                ...prev,
                                nv_options: [
                                  ...prev.nv_options,
                                  { id: String(prev.nv_options.length + 1), label: ltr, image_url: "", text: `Figure ${ltr}` }
                                ]
                              }));
                            }}
                            className="text-[10px] font-bold text-amber-800 bg-amber-50 hover:bg-amber-100 px-2.5 py-1 rounded-lg border border-amber-200 flex items-center gap-1 transition"
                          >
                            <Plus className="w-3 h-3" />
                            <span>Add Figure {String.fromCharCode(65 + formData.nv_options.length)}</span>
                          </button>
                        )}
                      </div>

                      {/* 5 Figure Evaluation Cards */}
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3 pt-1">
                        {formData.nv_options.map((opt, oIdx) => {
                          const isOdd = formData.nv_correct === opt.id;
                          return (
                            <div
                              key={opt.id}
                              className={`p-3 rounded-2xl border-2 flex flex-col items-center gap-2 text-center transition relative ${
                                isOdd
                                  ? "bg-amber-50/70 border-amber-500 shadow-sm ring-2 ring-amber-500/20"
                                  : "bg-slate-50/50 border-slate-200 hover:border-slate-300"
                              }`}
                            >
                              {/* Header with Letter and Delete button if extra */}
                              <div className="flex items-center justify-between w-full">
                                <span className={`w-6 h-6 rounded-full text-xs font-black flex items-center justify-center ${
                                  isOdd ? "bg-amber-600 text-white" : "bg-slate-200 text-slate-700"
                                }`}>
                                  {opt.label || String.fromCharCode(65 + oIdx)}
                                </span>
                                {formData.nv_options.length > 4 && (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      const filtered = formData.nv_options.filter((_, i) => i !== oIdx);
                                      setFormData({ ...formData, nv_options: filtered });
                                    }}
                                    className="text-slate-400 hover:text-rose-600 text-xs"
                                    title="Remove figure"
                                  >
                                    ✕
                                  </button>
                                )}
                              </div>

                              {/* Shape Preview Box */}
                              <div className="w-16 h-16 bg-white rounded-xl border border-slate-200 p-1 flex items-center justify-center shadow-2xs my-0.5">
                                {opt.image_url ? (
                                  <img src={opt.image_url} alt={opt.label} className="max-w-full max-h-full object-contain" />
                                ) : (
                                  <span className="text-[9px] text-slate-300 font-bold">Empty</span>
                                )}
                              </div>

                              {/* Pick Shape Button */}
                              <button
                                type="button"
                                onClick={() => {
                                  setShapePickerTarget({ targetType: "option", slotIndex: oIdx });
                                  setIsShapePickerOpen(true);
                                }}
                                className="text-[10px] font-bold text-blue-600 hover:text-blue-800 bg-blue-50 px-2 py-0.5 rounded border border-blue-200/60 w-full"
                              >
                                Pick Shape
                              </button>

                              {/* Odd One Out Radio Button Selector */}
                              <label className={`w-full py-1.5 px-2 rounded-xl border text-[10px] font-black flex items-center justify-center gap-1.5 cursor-pointer transition ${
                                isOdd
                                  ? "bg-amber-600 text-white border-amber-600 shadow-2xs"
                                  : "bg-white text-slate-600 border-slate-200 hover:bg-slate-100"
                              }`}>
                                <input
                                  type="radio"
                                  name="nv_odd_choice"
                                  checked={isOdd}
                                  onChange={() => setFormData({ ...formData, nv_correct: opt.id })}
                                  className="hidden"
                                />
                                <span>{isOdd ? "★ ODD ONE OUT" : "Mark as Odd"}</span>
                              </label>

                              {/* Description / Property Field */}
                              <input
                                type="text"
                                value={opt.text}
                                onChange={(e) => {
                                  const copy = [...formData.nv_options];
                                  copy[oIdx].text = e.target.value;
                                  setFormData({ ...formData, nv_options: copy });
                                }}
                                placeholder="Geometric Property"
                                className="w-full px-2 py-1 text-[10px] bg-white border border-slate-200 rounded-lg text-center"
                              />
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* ======================================================== */}
                  {/* CANDIDATE CHOICES: For Series, Analogy, and Matrix        */}
                  {/* ======================================================== */}
                  {formData.nv_sub_type !== "odd_one_out" && (
                    <div className="space-y-2 bg-white p-3.5 rounded-xl border border-orange-200">
                      <div className="flex items-center justify-between">
                        <label className="text-[11px] font-bold text-slate-700 uppercase block">
                          {formData.nv_sub_type === "series" && "Candidate Choices (Select The Correct Shape Replacing Next [ ? ])"}
                          {formData.nv_sub_type === "analogy" && "Candidate Choices (Select The Shape Replacing Figure D [ ? ] in Pair 2)"}
                          {formData.nv_sub_type === "matrix" && "Candidate Choices (Select The Shape Replacing Missing Matrix Cell [ ? ])"}
                        </label>
                        <span className="text-[10px] text-slate-400">Radio button marks the correct answer</span>
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                        {formData.nv_options.map((opt, oIdx) => {
                          const isCorrect = formData.nv_correct === opt.id;
                          return (
                            <div
                              key={opt.id}
                              className={`p-2.5 rounded-xl border flex flex-col items-center gap-1 text-center transition ${
                                isCorrect ? "bg-emerald-50 border-emerald-400 ring-2 ring-emerald-500/20" : "bg-slate-50/50 border-slate-200"
                              }`}
                            >
                              <div className="flex items-center justify-between w-full">
                                <span className="w-4 h-4 rounded-full bg-slate-200 text-slate-700 text-[10px] font-bold flex items-center justify-center">
                                  {opt.label || String.fromCharCode(65 + oIdx)}
                                </span>
                                <input
                                  type="radio"
                                  name="nv_correct"
                                  checked={isCorrect}
                                  onChange={() => setFormData({ ...formData, nv_correct: opt.id })}
                                  title="Mark as correct solution"
                                  className="w-4 h-4 text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                                />
                              </div>

                              <div className="w-14 h-14 bg-white rounded-lg border border-slate-200 p-1 flex items-center justify-center shadow-2xs my-0.5">
                                {opt.image_url ? (
                                  <img src={opt.image_url} alt={opt.label} className="max-w-full max-h-full object-contain" />
                                ) : (
                                  <span className="text-[9px] text-slate-300">Empty</span>
                                )}
                              </div>

                              <button
                                type="button"
                                onClick={() => {
                                  setShapePickerTarget({ targetType: "option", slotIndex: oIdx });
                                  setIsShapePickerOpen(true);
                                }}
                                className="text-[10px] font-bold text-blue-600 hover:underline"
                              >
                                Pick Shape
                              </button>

                              <input
                                type="text"
                                value={opt.text}
                                onChange={(e) => {
                                  const copy = [...formData.nv_options];
                                  copy[oIdx].text = e.target.value;
                                  setFormData({ ...formData, nv_options: copy });
                                }}
                                placeholder="Description"
                                className="w-full px-1.5 py-0.5 text-[10px] bg-white border border-slate-200 rounded text-center"
                              />
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* 10. Verbal Reasoning Dedicated Subtype Interfaces */}
              {formData.question_type === "verbal_reasoning" && (
                <div className="space-y-4 bg-teal-50/40 p-4 rounded-2xl border border-teal-200/90">
                  {/* Subtype Switcher Bar */}
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5 text-teal-950 text-xs font-bold">
                      <BrainCircuit className="w-4 h-4 text-teal-600" />
                      <span>Verbal Reasoning Sub-Type:</span>
                    </div>

                    <div className="flex items-center gap-1 bg-white p-1 rounded-xl border border-teal-200 text-xs font-bold">
                      {[
                        { id: "analogy" as const, label: "Analogy (تشبیہ)", icon: "🔄" },
                        { id: "series" as const, label: "Series (تسلسل)", icon: "🔢" },
                        { id: "odd_one_out" as const, label: "Odd One Out (غیر متعلق لفظ)", icon: "⭐" },
                        { id: "coding" as const, label: "Coding & Decoding (کوڈنگ)", icon: "🔐" },
                        { id: "blood_relations" as const, label: "Blood Relations (رشتے و استدلال)", icon: "👥" },
                      ].map((st) => (
                        <button
                          key={st.id}
                          type="button"
                          onClick={() => switchVerbalSubType(st.id)}
                          className={`px-2.5 py-1 rounded-lg text-xs font-bold transition flex items-center gap-1 ${
                            formData.vr_sub_type === st.id
                              ? "bg-teal-600 text-white shadow-2xs"
                              : "text-slate-600 hover:bg-slate-50"
                          }`}
                        >
                          <span>{st.icon}</span>
                          <span>{st.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Contextual Quick Demos per Subtype */}
                  <div className="flex flex-wrap items-center gap-1.5 pt-1">
                    <span className="text-[10px] font-bold text-slate-400 uppercase">Quick Demos:</span>
                    {formData.vr_sub_type === "analogy" && (
                      <>
                        <button
                          type="button"
                          onClick={() => loadVerbalPreset("analogy_worker_place")}
                          className="text-[10px] font-bold text-teal-900 bg-white px-2 py-0.5 rounded-lg border border-teal-300 shadow-2xs hover:bg-teal-50"
                        >
                          Worker & Place (Doctor:Hospital)
                        </button>
                        <button
                          type="button"
                          onClick={() => loadVerbalPreset("analogy_antonyms")}
                          className="text-[10px] font-bold text-indigo-900 bg-white px-2 py-0.5 rounded-lg border border-indigo-300 shadow-2xs hover:bg-indigo-50"
                        >
                          Antonyms (Ascend:Descend)
                        </button>
                        <button
                          type="button"
                          onClick={() => loadVerbalPreset("analogy_cause_effect")}
                          className="text-[10px] font-bold text-amber-900 bg-white px-2 py-0.5 rounded-lg border border-amber-300 shadow-2xs hover:bg-amber-50"
                        >
                          Cause & Consequence (Fire:Ashes)
                        </button>
                      </>
                    )}
                    {formData.vr_sub_type === "series" && (
                      <>
                        <button
                          type="button"
                          onClick={() => loadVerbalPreset("series_number_double")}
                          className="text-[10px] font-bold text-teal-900 bg-white px-2 py-0.5 rounded-lg border border-teal-300 shadow-2xs hover:bg-teal-50"
                        >
                          Doubling (3, 6, 12, 24, 48)
                        </button>
                        <button
                          type="button"
                          onClick={() => loadVerbalPreset("series_fibonacci")}
                          className="text-[10px] font-bold text-blue-900 bg-white px-2 py-0.5 rounded-lg border border-blue-300 shadow-2xs hover:bg-blue-50"
                        >
                          Fibonacci Sum (2, 3, 5, 8, 13)
                        </button>
                        <button
                          type="button"
                          onClick={() => loadVerbalPreset("series_letter_skip")}
                          className="text-[10px] font-bold text-purple-900 bg-white px-2 py-0.5 rounded-lg border border-purple-300 shadow-2xs hover:bg-purple-50"
                        >
                          Letter Jump (B, D, F, H)
                        </button>
                        <button
                          type="button"
                          onClick={() => loadVerbalPreset("series_letter_reverse")}
                          className="text-[10px] font-bold text-rose-900 bg-white px-2 py-0.5 rounded-lg border border-rose-300 shadow-2xs hover:bg-rose-50"
                        >
                          Reverse Countdown (Z, X, V, T)
                        </button>
                      </>
                    )}
                    {formData.vr_sub_type === "odd_one_out" && (
                      <>
                        <button
                          type="button"
                          onClick={() => loadVerbalPreset("odd_words_metals")}
                          className="text-[10px] font-bold text-amber-900 bg-white px-2 py-0.5 rounded-lg border border-amber-300 shadow-2xs hover:bg-amber-50"
                        >
                          Metals vs Wood
                        </button>
                        <button
                          type="button"
                          onClick={() => loadVerbalPreset("odd_words_capitals")}
                          className="text-[10px] font-bold text-blue-900 bg-white px-2 py-0.5 rounded-lg border border-blue-300 shadow-2xs hover:bg-blue-50"
                        >
                          Capitals vs Lahore
                        </button>
                        <button
                          type="button"
                          onClick={() => loadVerbalPreset("odd_words_planets")}
                          className="text-[10px] font-bold text-purple-900 bg-white px-2 py-0.5 rounded-lg border border-purple-300 shadow-2xs hover:bg-purple-50"
                        >
                          Planets vs Moon
                        </button>
                      </>
                    )}
                    {formData.vr_sub_type === "coding" && (
                      <>
                        <button
                          type="button"
                          onClick={() => loadVerbalPreset("coding_caesar_plus1")}
                          className="text-[10px] font-bold text-teal-900 bg-white px-2 py-0.5 rounded-lg border border-teal-300 shadow-2xs hover:bg-teal-50"
                        >
                          +1 Caesar Shift (PEACE➔QFBDF)
                        </button>
                        <button
                          type="button"
                          onClick={() => loadVerbalPreset("coding_reverse_letters")}
                          className="text-[10px] font-bold text-indigo-900 bg-white px-2 py-0.5 rounded-lg border border-indigo-300 shadow-2xs hover:bg-indigo-50"
                        >
                          Reverse Letters (SYSTEM➔METSYS)
                        </button>
                      </>
                    )}
                    {formData.vr_sub_type === "blood_relations" && (
                      <>
                        <button
                          type="button"
                          onClick={() => loadVerbalPreset("blood_relations_sister")}
                          className="text-[10px] font-bold text-rose-900 bg-white px-2 py-0.5 rounded-lg border border-rose-300 shadow-2xs hover:bg-rose-50"
                        >
                          Kinship (Father's Only Son)
                        </button>
                        <button
                          type="button"
                          onClick={() => loadVerbalPreset("direction_sense_walk")}
                          className="text-[10px] font-bold text-emerald-900 bg-white px-2 py-0.5 rounded-lg border border-emerald-300 shadow-2xs hover:bg-emerald-50"
                        >
                          Direction Tracking (North/East)
                        </button>
                      </>
                    )}
                  </div>

                  {/* ======================================================== */}
                  {/* 1. DEDICATED INTERFACE: VERBAL ANALOGY (تشبیہ)             */}
                  {/* ======================================================== */}
                  {formData.vr_sub_type === "analogy" && (
                    <div className="space-y-3 bg-white p-4 rounded-2xl border border-teal-200/90 shadow-2xs">
                      <div className="flex items-center gap-2">
                        <span className="w-6 h-6 rounded-lg bg-teal-100 text-teal-700 flex items-center justify-center font-black text-xs">
                          🔄
                        </span>
                        <div>
                          <h5 className="text-xs font-bold text-teal-950 uppercase tracking-wide">
                            Verbal Analogy Structure: (Word A : Word B :: Word C : [ ? ])
                          </h5>
                          <p className="text-[10px] text-slate-400">
                            Pair 1 establishes the semantic relationship. The student applies that exact rule to Word C to find target [ ? ].
                          </p>
                        </div>
                      </div>

                      <div className="flex flex-col md:flex-row items-center justify-between gap-3 pt-1">
                        {/* Pair 1: Established Relationship */}
                        <div className="flex-1 w-full p-3 rounded-xl border border-teal-200 bg-teal-50/40 space-y-2">
                          <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded bg-teal-600 text-white shadow-2xs inline-block">
                            Pair 1 (Given Relationship / معلوم جوڑا)
                          </span>
                          <div className="flex items-center gap-2 pt-1">
                            <div className="flex-1">
                              <label className="text-[9px] font-bold text-slate-500 uppercase block mb-1">Word A (Left)</label>
                              <input
                                type="text"
                                value={formData.vr_pair1_left}
                                onChange={(e) => setFormData({ ...formData, vr_pair1_left: e.target.value })}
                                placeholder="e.g. Doctor"
                                className="w-full px-2.5 py-1.5 text-xs font-bold text-slate-800 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-teal-500"
                              />
                            </div>
                            <span className="text-xl font-black text-teal-600 pt-4">:</span>
                            <div className="flex-1">
                              <label className="text-[9px] font-bold text-slate-500 uppercase block mb-1">Word B (Right)</label>
                              <input
                                type="text"
                                value={formData.vr_pair1_right}
                                onChange={(e) => setFormData({ ...formData, vr_pair1_right: e.target.value })}
                                placeholder="e.g. Hospital"
                                className="w-full px-2.5 py-1.5 text-xs font-bold text-slate-800 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-teal-500"
                              />
                            </div>
                          </div>
                        </div>

                        {/* Connector :: */}
                        <div className="flex flex-col items-center px-3 py-1.5 rounded-xl bg-teal-600 text-white shadow-xs shrink-0">
                          <span className="text-lg font-black tracking-widest leading-none">::</span>
                          <span className="text-[8px] font-black uppercase">AS</span>
                        </div>

                        {/* Pair 2: Target Relationship */}
                        <div className="flex-1 w-full p-3 rounded-xl border-2 border-amber-300 bg-amber-50/50 space-y-2">
                          <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded bg-amber-600 text-white shadow-2xs inline-block">
                            Pair 2 (Target Relationship / حل طلب جوڑا)
                          </span>
                          <div className="flex items-center gap-2 pt-1">
                            <div className="flex-1">
                              <label className="text-[9px] font-bold text-amber-800 uppercase block mb-1">Word C (Given)</label>
                              <input
                                type="text"
                                value={formData.vr_pair2_left}
                                onChange={(e) => setFormData({ ...formData, vr_pair2_left: e.target.value })}
                                placeholder="e.g. Teacher"
                                className="w-full px-2.5 py-1.5 text-xs font-bold text-slate-800 bg-white border border-amber-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-amber-500"
                              />
                            </div>
                            <span className="text-xl font-black text-amber-600 pt-4">:</span>
                            <div className="flex-1">
                              <label className="text-[9px] font-bold text-amber-800 uppercase block mb-1">Word D (Missing ?)</label>
                              <div className="px-2.5 py-1.5 text-xs font-black text-amber-800 bg-amber-100/90 border-2 border-dashed border-amber-400 rounded-lg flex items-center justify-between animate-pulse">
                                <span>[ ? ] Target Slot</span>
                                <span className="text-[9px] font-bold text-amber-600">Pick Option</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Relationship Rule Tag */}
                      <div className="flex items-center gap-2 pt-1">
                        <label className="text-[10px] font-bold text-slate-500 shrink-0">Relationship Category:</label>
                        <input
                          type="text"
                          value={formData.vr_relationship_type}
                          onChange={(e) => setFormData({ ...formData, vr_relationship_type: e.target.value })}
                          placeholder="e.g. Worker & Workplace, Antonyms, Cause & Consequence"
                          className="flex-1 px-2.5 py-1 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:bg-white"
                        />
                      </div>
                    </div>
                  )}

                  {/* ======================================================== */}
                  {/* 2. DEDICATED INTERFACE: LETTER & NUMBER SERIES (تسلسل)     */}
                  {/* ======================================================== */}
                  {formData.vr_sub_type === "series" && (
                    <div className="space-y-3 bg-white p-4 rounded-2xl border border-teal-200/90 shadow-2xs">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="w-6 h-6 rounded-lg bg-teal-100 text-teal-700 flex items-center justify-center font-black text-xs">
                            🔢
                          </span>
                          <div>
                            <h5 className="text-xs font-bold text-slate-800 uppercase tracking-wide">
                              Sequence Progression Strip (1 ➔ 2 ➔ 3 ➔ 4 ➔ ?)
                            </h5>
                            <p className="text-[10px] text-slate-400">
                              Define sequential terms progressing towards the missing target slot [ ? ].
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          {/* Series Type Selector */}
                          <div className="flex items-center bg-slate-100 p-0.5 rounded-lg text-[10px] font-bold">
                            {(["number", "letter", "alphanumeric"] as const).map(st => (
                              <button
                                key={st}
                                type="button"
                                onClick={() => setFormData({ ...formData, vr_series_type: st })}
                                className={`px-2 py-0.5 rounded-md capitalize transition ${
                                  formData.vr_series_type === st
                                    ? "bg-teal-600 text-white shadow-2xs"
                                    : "text-slate-600 hover:text-slate-900"
                                }`}
                              >
                                {st}
                              </button>
                            ))}
                          </div>

                          <button
                            type="button"
                            onClick={() => {
                              setFormData(prev => ({
                                ...prev,
                                vr_series_tokens: [...prev.vr_series_tokens, ""]
                              }));
                            }}
                            className="text-[10px] font-bold text-teal-700 bg-teal-50 hover:bg-teal-100 px-2.5 py-1 rounded-lg border border-teal-200 flex items-center gap-1 transition"
                          >
                            <Plus className="w-3 h-3" />
                            <span>Add Step</span>
                          </button>
                        </div>
                      </div>

                      {/* Horizontal Strip of Step Tokens */}
                      <div className="flex items-center gap-2 overflow-x-auto py-2 px-1">
                        {formData.vr_series_tokens.map((token, tIdx) => (
                          <div key={tIdx} className="flex items-center gap-2 shrink-0">
                            <div className="flex flex-col items-center gap-1 p-2 rounded-xl bg-slate-50 border border-slate-200">
                              <span className="text-[9px] font-bold text-slate-400 uppercase">Term {tIdx + 1}</span>
                              <input
                                type="text"
                                value={token}
                                onChange={(e) => {
                                  const copy = [...formData.vr_series_tokens];
                                  copy[tIdx] = e.target.value;
                                  setFormData({ ...formData, vr_series_tokens: copy });
                                }}
                                placeholder={`Term ${tIdx + 1}`}
                                className="w-16 px-2 py-1 text-center font-mono font-bold text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-teal-500"
                              />
                              {formData.vr_series_tokens.length > 2 && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    const next = formData.vr_series_tokens.filter((_, i) => i !== tIdx);
                                    setFormData({ ...formData, vr_series_tokens: next });
                                  }}
                                  className="text-[9px] text-slate-400 hover:text-rose-600 px-1"
                                  title="Remove term"
                                >
                                  ✕ Remove
                                </button>
                              )}
                            </div>
                            <span className="text-slate-300 font-black text-sm">➔</span>
                          </div>
                        ))}

                        {/* Explicit [ ? ] Target Slot */}
                        <div className="flex flex-col items-center gap-1 p-2 rounded-xl bg-amber-50/80 border-2 border-dashed border-amber-400 shrink-0 shadow-2xs animate-pulse">
                          <span className="text-[9px] font-black text-amber-800 uppercase">Target (?)</span>
                          <div className="w-16 h-8 bg-white/90 rounded-lg flex items-center justify-center text-amber-700 font-mono font-black text-sm border border-amber-300">
                            ? Target
                          </div>
                          <span className="text-[8px] font-bold text-amber-700">Solved by Choices</span>
                        </div>
                      </div>

                      {/* Rule Description Hint */}
                      <div className="flex items-center gap-2 pt-1">
                        <label className="text-[10px] font-bold text-slate-500 shrink-0">Progression Rule / Pattern:</label>
                        <input
                          type="text"
                          value={formData.vr_rule_hint}
                          onChange={(e) => setFormData({ ...formData, vr_rule_hint: e.target.value })}
                          placeholder="e.g. Multiply by 2 at each step, or +2 letter skip in alphabet"
                          className="flex-1 px-2.5 py-1 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:bg-white"
                        />
                      </div>
                    </div>
                  )}

                  {/* ======================================================== */}
                  {/* 3. DEDICATED INTERFACE: ODD WORD OUT (غیر متعلق لفظ)       */}
                  {/* ======================================================== */}
                  {formData.vr_sub_type === "odd_one_out" && (
                    <div className="space-y-3 bg-white p-4 rounded-2xl border border-teal-200/90 shadow-2xs">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="w-6 h-6 rounded-lg bg-teal-100 text-teal-700 flex items-center justify-center font-black text-xs">
                            ⭐
                          </span>
                          <div>
                            <h5 className="text-xs font-bold text-slate-800 uppercase tracking-wide">
                              Odd Word Out / Classification Cards
                            </h5>
                            <p className="text-[10px] text-slate-400">
                              Provide 4 or 5 terms where 1 term is conceptually different from the group.
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <label className="text-[10px] font-bold text-slate-500">Common Category:</label>
                          <input
                            type="text"
                            value={formData.vr_group_category}
                            onChange={(e) => setFormData({ ...formData, vr_group_category: e.target.value })}
                            placeholder="e.g. Metallic Elements, National Capitals"
                            className="px-2.5 py-1 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:bg-white w-48 font-medium"
                          />
                        </div>
                      </div>

                      {/* 5 Word Evaluation Cards */}
                      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5 pt-1">
                        {formData.vr_words.map((w, wIdx) => {
                          const isOdd = String(wIdx + 1) === String(formData.vr_correct);
                          return (
                            <div
                              key={wIdx}
                              className={`p-3 rounded-xl border flex flex-col items-center gap-2 transition ${
                                isOdd
                                  ? "bg-amber-50/70 border-amber-400 ring-2 ring-amber-400/30 shadow-xs"
                                  : "bg-slate-50/70 border-slate-200"
                              }`}
                            >
                              <div className="flex items-center justify-between w-full">
                                <span className={`w-5 h-5 rounded-md text-[10px] font-bold flex items-center justify-center ${
                                  isOdd ? "bg-amber-600 text-white" : "bg-slate-200 text-slate-600"
                                }`}>
                                  {String.fromCharCode(65 + wIdx)}
                                </span>
                                {isOdd && (
                                  <span className="text-[9px] font-black text-amber-700 bg-amber-100 px-1.5 py-0.2 rounded border border-amber-300">
                                    ODD OUT
                                  </span>
                                )}
                              </div>

                              <input
                                type="text"
                                value={w}
                                onChange={(e) => {
                                  const copy = [...formData.vr_words];
                                  copy[wIdx] = e.target.value;
                                  setFormData({ ...formData, vr_words: copy });
                                }}
                                placeholder={`Word ${String.fromCharCode(65 + wIdx)}`}
                                className="w-full px-2 py-1 text-xs font-bold text-slate-800 bg-white border border-slate-200 rounded text-center focus:outline-none focus:ring-1 focus:ring-teal-500"
                              />

                              <label className={`w-full py-1 px-1.5 rounded-lg border text-[9px] font-black flex items-center justify-center gap-1 cursor-pointer transition ${
                                isOdd
                                  ? "bg-amber-600 text-white border-amber-600 shadow-2xs"
                                  : "bg-white text-slate-600 border-slate-200 hover:bg-slate-100"
                              }`}>
                                <input
                                  type="radio"
                                  name="vr_odd_radio"
                                  checked={isOdd}
                                  onChange={() => setFormData({ ...formData, vr_correct: String(wIdx + 1), vr_odd_index: wIdx })}
                                  className="hidden"
                                />
                                <span>{isOdd ? "★ MARKED ODD" : "Mark as Odd"}</span>
                              </label>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* ======================================================== */}
                  {/* 4. DEDICATED INTERFACE: CODING & DECODING (کوڈنگ)        */}
                  {/* ======================================================== */}
                  {formData.vr_sub_type === "coding" && (
                    <div className="space-y-3 bg-white p-4 rounded-2xl border border-teal-200/90 shadow-2xs">
                      <div className="flex items-center gap-2">
                        <span className="w-6 h-6 rounded-lg bg-teal-100 text-teal-700 flex items-center justify-center font-black text-xs">
                          🔐
                        </span>
                        <div>
                          <h5 className="text-xs font-bold text-slate-800 uppercase tracking-wide">
                            Coding & Cipher Transformation
                          </h5>
                          <p className="text-[10px] text-slate-400">
                            Establish the coding pattern on the exemplar word, and challenge the student to decode the target word.
                          </p>
                        </div>
                      </div>

                      <div className="flex flex-col md:flex-row items-center justify-between gap-3 pt-1">
                        {/* Given Cipher Rule Card */}
                        <div className="flex-1 w-full p-3 rounded-xl border border-teal-200 bg-teal-50/40 space-y-2">
                          <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded bg-teal-600 text-white shadow-2xs inline-block">
                            Exemplar Transformation (معلوم کوڈ)
                          </span>
                          <div className="flex items-center gap-2 pt-1 font-mono">
                            <div className="flex-1">
                              <label className="text-[9px] font-bold text-slate-500 uppercase block mb-1 font-sans">Source Word</label>
                              <input
                                type="text"
                                value={formData.vr_source_word}
                                onChange={(e) => setFormData({ ...formData, vr_source_word: e.target.value.toUpperCase() })}
                                placeholder="e.g. PEACE"
                                className="w-full px-2.5 py-1.5 text-xs font-mono font-bold text-slate-800 bg-white border border-slate-200 rounded-lg text-center"
                              />
                            </div>
                            <span className="text-teal-600 font-sans font-black text-sm pt-4">➔</span>
                            <div className="flex-1">
                              <label className="text-[9px] font-bold text-slate-500 uppercase block mb-1 font-sans">Coded Output</label>
                              <input
                                type="text"
                                value={formData.vr_coded_word}
                                onChange={(e) => setFormData({ ...formData, vr_coded_word: e.target.value.toUpperCase() })}
                                placeholder="e.g. QFBDF"
                                className="w-full px-2.5 py-1.5 text-xs font-mono font-bold text-teal-700 bg-white border border-teal-200 rounded-lg text-center"
                              />
                            </div>
                          </div>
                        </div>

                        {/* Connector :: */}
                        <div className="flex flex-col items-center px-3 py-1.5 rounded-xl bg-teal-600 text-white shadow-xs shrink-0">
                          <span className="text-lg font-black tracking-widest leading-none">::</span>
                          <span className="text-[8px] font-black uppercase">APPLY TO</span>
                        </div>

                        {/* Target Word Card */}
                        <div className="flex-1 w-full p-3 rounded-xl border-2 border-amber-300 bg-amber-50/50 space-y-2">
                          <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded bg-amber-600 text-white shadow-2xs inline-block">
                            Target to Decode (حل طلب لفظ)
                          </span>
                          <div className="flex items-center gap-2 pt-1 font-mono">
                            <div className="flex-1">
                              <label className="text-[9px] font-bold text-amber-800 uppercase block mb-1 font-sans">Target Word</label>
                              <input
                                type="text"
                                value={formData.vr_target_word}
                                onChange={(e) => setFormData({ ...formData, vr_target_word: e.target.value.toUpperCase() })}
                                placeholder="e.g. SMART"
                                className="w-full px-2.5 py-1.5 text-xs font-mono font-bold text-slate-800 bg-white border border-amber-300 rounded-lg text-center"
                              />
                            </div>
                            <span className="text-amber-600 font-sans font-black text-sm pt-4">➔</span>
                            <div className="flex-1">
                              <label className="text-[9px] font-bold text-amber-800 uppercase block mb-1 font-sans">Target Code (?)</label>
                              <div className="px-2.5 py-1.5 text-xs font-mono font-black text-amber-800 bg-amber-100 border-2 border-dashed border-amber-400 rounded-lg flex items-center justify-center animate-pulse">
                                [ ? ] Target Code
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Rule Description */}
                      <div className="flex items-center gap-2 pt-1">
                        <label className="text-[10px] font-bold text-slate-500 shrink-0">Cipher / Shift Rule:</label>
                        <input
                          type="text"
                          value={formData.vr_coding_rule}
                          onChange={(e) => setFormData({ ...formData, vr_coding_rule: e.target.value })}
                          placeholder="e.g. Each letter shifted by +1 position forward (A➔B, B➔C)"
                          className="flex-1 px-2.5 py-1 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:bg-white"
                        />
                      </div>
                    </div>
                  )}

                  {/* ======================================================== */}
                  {/* 5. DEDICATED INTERFACE: BLOOD RELATIONS & LOGIC          */}
                  {/* ======================================================== */}
                  {formData.vr_sub_type === "blood_relations" && (
                    <div className="space-y-3 bg-white p-4 rounded-2xl border border-teal-200/90 shadow-2xs">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="w-6 h-6 rounded-lg bg-teal-100 text-teal-700 flex items-center justify-center font-black text-xs">
                            👥
                          </span>
                          <div>
                            <h5 className="text-xs font-bold text-slate-800 uppercase tracking-wide">
                              Blood Relations & Deductive Logic
                            </h5>
                            <p className="text-[10px] text-slate-400">
                              Kinship puzzles, pedigree clues, and cardinal direction reasoning steps.
                            </p>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => {
                            setFormData(prev => ({
                              ...prev,
                              vr_clues: [...prev.vr_clues, `Clue ${prev.vr_clues.length + 1}: `]
                            }));
                          }}
                          className="text-[10px] font-bold text-teal-700 bg-teal-50 hover:bg-teal-100 px-2.5 py-1 rounded-lg border border-teal-200 flex items-center gap-1 transition"
                        >
                          <Plus className="w-3 h-3" />
                          <span>Add Clue</span>
                        </button>
                      </div>

                      {/* Premise Statement */}
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-500 uppercase">Premise / Statement Scenario:</label>
                        <textarea
                          rows={2}
                          value={formData.vr_premise}
                          onChange={(e) => setFormData({ ...formData, vr_premise: e.target.value })}
                          placeholder="e.g. Pointing to a photograph, Ali says: 'She is the daughter of my father's only son.'"
                          className="w-full p-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-1 focus:ring-teal-500 font-medium"
                        />
                      </div>

                      {/* Deductive Clues List */}
                      {formData.vr_clues.length > 0 && (
                        <div className="space-y-1.5 pt-1">
                          <label className="text-[10px] font-bold text-slate-500 uppercase">Deduction Clues / Step-by-Step Breakdown:</label>
                          <div className="space-y-1.5">
                            {formData.vr_clues.map((clue, cIdx) => (
                              <div key={cIdx} className="flex items-center gap-2">
                                <span className="w-5 h-5 rounded-md bg-teal-50 text-teal-700 text-[10px] font-bold flex items-center justify-center shrink-0">
                                  {cIdx + 1}
                                </span>
                                <input
                                  type="text"
                                  value={clue}
                                  onChange={(e) => {
                                    const copy = [...formData.vr_clues];
                                    copy[cIdx] = e.target.value;
                                    setFormData({ ...formData, vr_clues: copy });
                                  }}
                                  placeholder={`Clue step ${cIdx + 1}`}
                                  className="flex-1 px-2.5 py-1 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-teal-500"
                                />
                                <button
                                  type="button"
                                  onClick={() => {
                                    const next = formData.vr_clues.filter((_, i) => i !== cIdx);
                                    setFormData({ ...formData, vr_clues: next });
                                  }}
                                  className="text-slate-400 hover:text-rose-600 text-xs px-1"
                                >
                                  ✕
                                </button>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Question Prompt */}
                      <div className="space-y-1 pt-1">
                        <label className="text-[10px] font-bold text-slate-500 uppercase">Question Target Prompt:</label>
                        <input
                          type="text"
                          value={formData.vr_question_prompt}
                          onChange={(e) => setFormData({ ...formData, vr_question_prompt: e.target.value })}
                          placeholder="e.g. How is the girl in the photograph related to Ali?"
                          className="w-full px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:bg-white font-bold text-slate-800"
                        />
                      </div>
                    </div>
                  )}

                  {/* ======================================================== */}
                  {/* CANDIDATE CHOICES: For Analogy, Series, Coding, Logic     */}
                  {/* ======================================================== */}
                  {formData.vr_sub_type !== "odd_one_out" && (
                    <div className="space-y-2 bg-white p-3.5 rounded-xl border border-teal-200">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-700 uppercase tracking-wide">
                          Answer Choices (Option A to D):
                        </span>
                        <span className="text-[10px] text-teal-700 font-bold bg-teal-50 px-2 py-0.5 rounded border border-teal-200">
                          Click radio button to mark correct answer
                        </span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                        {formData.vr_options.map((opt, oIdx) => {
                          const isCorrect = String(formData.vr_correct) === String(opt.id);
                          return (
                            <div
                              key={opt.id}
                              className={`p-2 rounded-xl border flex items-center gap-2 transition ${
                                isCorrect
                                  ? "bg-emerald-50/70 border-emerald-400 ring-2 ring-emerald-500/20"
                                  : "bg-slate-50 border-slate-200"
                              }`}
                            >
                              <label className="flex items-center gap-1.5 cursor-pointer shrink-0">
                                <input
                                  type="radio"
                                  name="vr_choice_radio"
                                  checked={isCorrect}
                                  onChange={() => setFormData({ ...formData, vr_correct: opt.id })}
                                  className="w-3.5 h-3.5 text-emerald-600 focus:ring-emerald-500"
                                />
                                <span className={`w-5 h-5 rounded-md text-[10px] font-bold flex items-center justify-center ${
                                  isCorrect ? "bg-emerald-600 text-white" : "bg-slate-200 text-slate-600"
                                }`}>
                                  {opt.label || String.fromCharCode(65 + oIdx)}
                                </span>
                              </label>

                              <input
                                type="text"
                                value={opt.text}
                                onChange={(e) => {
                                  const copy = [...formData.vr_options];
                                  copy[oIdx].text = e.target.value;
                                  setFormData({ ...formData, vr_options: copy });
                                }}
                                placeholder={`Choice ${opt.label || String.fromCharCode(65 + oIdx)}`}
                                className="flex-1 px-2.5 py-1 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-teal-500 font-semibold"
                              />

                              {isCorrect && (
                                <span className="text-[9px] font-black text-emerald-700 bg-emerald-100 px-1.5 py-0.5 rounded border border-emerald-300 shrink-0">
                                  CORRECT
                                </span>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Explanation & Tags */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 border-t border-slate-100 pt-3">
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <label className="text-[11px] font-bold text-slate-600 uppercase">Explanation / Solution Notes</label>
                    <button
                      type="button"
                      onClick={() => {
                        setActiveFormulaTarget("explanation");
                        setIsFormulaDrawerOpen(true);
                      }}
                      className="text-[11px] font-bold text-blue-700 hover:text-blue-900 bg-blue-50 hover:bg-blue-100 border border-blue-200 px-2 py-0.5 rounded-md flex items-center gap-1 transition shadow-2xs active:scale-95 cursor-pointer"
                      title="Open Formula Slider for Explanation"
                    >
                      <Calculator className="w-3 h-3 text-blue-600" />
                      <span>Formula Slider</span>
                    </button>
                  </div>
                  <textarea
                    rows={2}
                    value={formData.explanation}
                    onFocus={() => setActiveFormulaTarget("explanation")}
                    onChange={(e) => setFormData({ ...formData, explanation: e.target.value })}
                    placeholder="Step-by-step reasoning shown to students after evaluation."
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-600 uppercase">Tags</label>
                  <input
                    type="text"
                    value={formData.tags}
                    onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                    placeholder="e.g. physics, kinematics, past-paper-2025"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  />
                  <p className="text-[10px] text-slate-400">Comma-separated keywords for instant search</p>
                </div>
              </div>

              {/* Modal Buttons */}
              <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 transition shadow-sm disabled:opacity-50"
                >
                  {isSaving ? "Saving..." : editingQuestion ? "Update Bank Question" : "Save to Question Bank"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 6. Built-in Shape Picker Modal with Cloudflare R2 Upload from Drive */}
      {isShapePickerOpen && (
        <div className="fixed inset-0 z-[60] bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div 
            className={`bg-white rounded-3xl border border-slate-200 shadow-2xl w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150 flex flex-col max-h-[85vh] transition-all ${
              isDraggingShape ? "ring-4 ring-orange-500/50 border-orange-400" : ""
            }`}
            onDragOver={(e) => {
              e.preventDefault();
              setIsDraggingShape(true);
            }}
            onDragLeave={() => setIsDraggingShape(false)}
            onDrop={(e) => {
              e.preventDefault();
              setIsDraggingShape(false);
              const droppedFile = e.dataTransfer.files?.[0];
              if (droppedFile) {
                handleUploadShapeFile(droppedFile);
              }
            }}
          >
            {/* Header */}
            <div className="px-5 py-3.5 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-orange-100 text-orange-600 flex items-center justify-center shadow-2xs">
                  <Palette className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="font-bold text-sm text-slate-900">Select Shape from Library</h4>
                  <div className="flex items-center gap-1.5 text-[10px] text-slate-500 font-medium">
                    <span>Target: {shapePickerTarget.targetType === "problem" ? `Problem Fig ${shapePickerTarget.slotIndex + 1}` : `Option ${String.fromCharCode(65 + shapePickerTarget.slotIndex)}`}</span>
                    <span>•</span>
                    <span className="text-emerald-700 font-bold flex items-center gap-0.5">
                      <Cloud className="w-2.5 h-2.5" />
                      Cloudflare R2 Synced
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {/* Upload from Drive Button */}
                <button
                  type="button"
                  onClick={() => shapeFileInputRef.current?.click()}
                  disabled={isUploadingShape}
                  className="px-3 py-1.5 bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-700 hover:to-amber-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs transition active:scale-95 cursor-pointer disabled:opacity-50"
                  title="Upload SVG, PNG, JPG, or WEBP from your computer drive"
                >
                  {isUploadingShape ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <FolderUp className="w-3.5 h-3.5" />
                  )}
                  <span>{isUploadingShape ? "Uploading..." : "Select from Drive"}</span>
                </button>

                <input
                  ref={shapeFileInputRef}
                  type="file"
                  accept=".svg,.png,.jpg,.jpeg,.webp,image/*"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleUploadShapeFile(file);
                  }}
                />

                <button
                  type="button"
                  onClick={() => setIsShapePickerOpen(false)}
                  className="w-7 h-7 rounded-full text-slate-400 hover:bg-slate-200/60 flex items-center justify-center transition"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Upload Notification / Progress Banner */}
            {isUploadingShape && (
              <div className="bg-orange-50 border-b border-orange-200 px-4 py-2 flex items-center gap-2 text-xs text-orange-800 animate-pulse">
                <Loader2 className="w-4 h-4 animate-spin text-orange-600 shrink-0" />
                <span>Storing shape in Cloudflare R2 bucket (<strong>sharp-materials</strong>) and local cache for onward usage...</span>
              </div>
            )}

            {uploadError && (
              <div className="bg-rose-50 border-b border-rose-200 px-4 py-2 flex items-center justify-between text-xs text-rose-800">
                <div className="flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>{uploadError}</span>
                </div>
                <button 
                  type="button" 
                  onClick={() => setUploadError(null)} 
                  className="text-rose-600 hover:text-rose-800 font-bold ml-2"
                >
                  ✕
                </button>
              </div>
            )}

            {/* Filter & Search */}
            <div className="p-4 border-b border-slate-100 space-y-2.5">
              <div className="relative">
                <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search shapes (e.g. arrow, quadrant, square, dot, or custom uploads)..."
                  value={shapeSearch}
                  onChange={(e) => setShapeSearch(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:outline-none focus:ring-1 focus:ring-orange-500"
                />
                {shapeSearch && (
                  <button
                    type="button"
                    onClick={() => setShapeSearch("")}
                    className="absolute right-3 top-2 text-slate-400 hover:text-slate-600"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Categories + Custom Uploads Tab */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
                {/* 1. All Shapes */}
                <button
                  type="button"
                  onClick={() => setShapeCategory("all")}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-bold whitespace-nowrap transition flex items-center gap-1.5 ${
                    shapeCategory === "all"
                      ? "bg-orange-600 text-white shadow-2xs"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  }`}
                >
                  <span>All Shapes</span>
                  <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                    shapeCategory === "all" ? "bg-orange-700 text-orange-100" : "bg-slate-200 text-slate-600"
                  }`}>
                    {SHAPE_LIBRARY.length + customShapes.length}
                  </span>
                </button>

                {/* 2. Custom Uploads Tab */}
                <button
                  type="button"
                  onClick={() => setShapeCategory("custom")}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-bold whitespace-nowrap transition flex items-center gap-1.5 ${
                    shapeCategory === "custom"
                      ? "bg-amber-600 text-white shadow-2xs"
                      : "bg-amber-50 text-amber-800 hover:bg-amber-100 border border-amber-200/60"
                  }`}
                >
                  <span>📁 Custom Uploads</span>
                  <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                    shapeCategory === "custom" ? "bg-amber-700 text-amber-100" : "bg-amber-200/80 text-amber-900"
                  }`}>
                    {customShapes.length}
                  </span>
                </button>

                {/* Built-in Categories */}
                {SHAPE_CATEGORIES.filter(cat => cat.id !== "all").map((cat) => {
                  const isActive = shapeCategory === cat.id;
                  const count = SHAPE_LIBRARY.filter(s => s.category === cat.id).length;
                  return (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => setShapeCategory(cat.id)}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-bold whitespace-nowrap transition flex items-center gap-1 ${
                        isActive
                          ? "bg-orange-600 text-white shadow-2xs"
                          : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                      }`}
                    >
                      <span>{cat.label}</span>
                      <span className={`text-[10px] px-1 py-0.2 rounded-full ${
                        isActive ? "bg-orange-700 text-orange-100" : "bg-slate-200 text-slate-500"
                      }`}>
                        {count}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Grid & Drag-Drop Canvas */}
            <div className="p-4 overflow-y-auto flex-1 relative min-h-[220px]">
              {/* Drag overlay */}
              {isDraggingShape && (
                <div className="absolute inset-2 z-20 rounded-2xl border-2 border-dashed border-orange-500 bg-orange-50/95 flex flex-col items-center justify-center text-orange-800 pointer-events-none gap-2 animate-in fade-in">
                  <UploadCloud className="w-10 h-10 text-orange-600 animate-bounce" />
                  <p className="font-bold text-sm">Drop shape file here to store in Cloudflare R2!</p>
                  <p className="text-xs text-orange-600">Supports SVG, PNG, JPG, WEBP</p>
                </div>
              )}

              {(() => {
                // Combine built-in shapes with custom shapes from DB
                const customItems = customShapes.map(cs => ({
                  id: `custom_${cs.id}`,
                  rawId: cs.id,
                  name: cs.name,
                  category: "custom",
                  tags: ["custom", "upload", "drive", ...(cs.tags ? cs.tags.split(",") : [])],
                  svg: cs.svg_content ? `data:image/svg+xml;utf8,${encodeURIComponent(cs.svg_content)}` : cs.file_url,
                  isCustom: true,
                  r2_key: cs.r2_key,
                  file_url: cs.file_url,
                  created_at: cs.created_at
                }));

                const allItems = [...customItems, ...SHAPE_LIBRARY];

                const filtered = allItems.filter((s) => {
                  const matchCat = shapeCategory === "all" || s.category === shapeCategory;
                  const q = shapeSearch.toLowerCase().trim();
                  const matchSearch = !q || s.name.toLowerCase().includes(q) || s.tags.some(t => t.toLowerCase().includes(q));
                  return matchCat && matchSearch;
                });

                // Empty State with Drive Upload Option
                if (filtered.length === 0) {
                  return (
                    <div className="py-10 px-4 flex flex-col items-center justify-center text-center">
                      <div className="w-14 h-14 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mb-3 border border-amber-200/80 shadow-2xs">
                        <FolderUp className="w-7 h-7" />
                      </div>
                      <h5 className="font-bold text-sm text-slate-800">
                        {shapeCategory === "custom" && customShapes.length === 0
                          ? "No custom shapes uploaded yet"
                          : `No shapes found matching "${shapeSearch}"`}
                      </h5>
                      <p className="text-xs text-slate-500 max-w-sm mt-1 mb-4">
                        If the shape you need is not available in the library, select it from your local drive. It will be stored systematically in Cloudflare R2 storage for ongoing usage across all questions.
                      </p>
                      <button
                        type="button"
                        onClick={() => shapeFileInputRef.current?.click()}
                        disabled={isUploadingShape}
                        className="px-4 py-2 bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-700 hover:to-amber-700 text-white font-bold text-xs rounded-xl flex items-center gap-2 shadow-xs transition"
                      >
                        <FolderUp className="w-4 h-4" />
                        <span>Select Shape from Drive (SVG / PNG / JPG)</span>
                      </button>
                    </div>
                  );
                }

                return (
                  <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2.5">
                    {filtered.map((item: any) => (
                      <div
                        key={item.id}
                        className="relative group p-2 rounded-xl border border-slate-200 hover:border-orange-500 hover:bg-orange-50/30 flex flex-col items-center gap-1.5 transition text-center cursor-pointer bg-white"
                        onClick={() => handleSelectShape(item.svg)}
                      >
                        {/* Custom R2 Badge & Delete button */}
                        {item.isCustom && (
                          <div className="absolute top-1 right-1 flex items-center gap-1 z-10">
                            <span className="text-[8px] font-bold px-1 py-0.2 rounded bg-amber-100 text-amber-800 border border-amber-200">
                              R2
                            </span>
                            <button
                              type="button"
                              onClick={(e) => handleDeleteCustomShape(e, item.rawId)}
                              title="Delete from Cloudflare storage"
                              className="opacity-0 group-hover:opacity-100 p-0.5 rounded text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                        )}

                        <div className="w-12 h-12 flex items-center justify-center p-1 bg-slate-50 rounded-lg border border-slate-100 group-hover:bg-white transition">
                          <img 
                            src={item.svg} 
                            alt={item.name} 
                            className="max-w-full max-h-full object-contain group-hover:scale-105 transition" 
                          />
                        </div>

                        <span className="text-[10px] font-medium text-slate-700 line-clamp-1 w-full" title={item.name}>
                          {item.name}
                        </span>
                      </div>
                    ))}
                  </div>
                );
              })()}
            </div>

            {/* Footer */}
            <div className="p-3 border-t border-slate-100 bg-slate-50 flex items-center justify-between text-xs">
              <div className="flex items-center gap-1.5 text-slate-500 text-[11px]">
                <Cloud className="w-3.5 h-3.5 text-blue-500" />
                <span>Cloudflare R2: <strong>shapes/custom/*</strong> • SVG, PNG, JPG, WEBP</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => shapeFileInputRef.current?.click()}
                  className="px-2.5 py-1 text-orange-700 hover:bg-orange-100/60 font-bold rounded-lg transition flex items-center gap-1 text-[11px]"
                >
                  <FolderUp className="w-3 h-3" />
                  <span>Upload More</span>
                </button>
                <button
                  type="button"
                  onClick={() => setIsShapePickerOpen(false)}
                  className="px-3 py-1.5 bg-slate-200 text-slate-700 font-bold rounded-lg hover:bg-slate-300 transition"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}


      {/* Floating Cart-Style Formula Slider Trigger: Right Edge Tab */}
      <div className="fixed right-0 top-1/2 -translate-y-1/2 z-40">
        <button
          type="button"
          onClick={() => setIsFormulaDrawerOpen(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white shadow-2xl py-3.5 px-2.5 rounded-l-2xl border-l-2 border-y-2 border-blue-400 flex flex-col items-center gap-2 group transition-all duration-200 hover:px-3.5 active:scale-95 cursor-pointer"
          title="Open Formula & Symbol Slider (200+ Symbols)"
        >
          <div className="relative">
            <Calculator className="w-5 h-5 text-white group-hover:rotate-12 transition-transform" />
            <span className="absolute -top-2 -right-2.5 bg-amber-400 text-slate-950 font-black text-[9px] px-1 py-0.2 rounded-full shadow-sm">
              200+
            </span>
          </div>
          <span className="[writing-mode:vertical-rl] font-black text-xs tracking-wider uppercase">
            Formula Slider
          </span>
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
        </button>
      </div>

      {/* Formula & Symbol Studio Slider Drawer */}
      <FormulaSliderDrawer
        isOpen={isFormulaDrawerOpen}
        onClose={() => setIsFormulaDrawerOpen(false)}
        activeTargetField={activeFormulaTarget}
        setActiveTargetField={setActiveFormulaTarget}
        availableFields={availableFormulaFields}
        fieldValue={getTargetFieldVal(activeFormulaTarget)}
        onUpdateFieldValue={(val) => updateTargetFieldVal(activeFormulaTarget, val)}
        onInsertSnippet={insertFormulaSnippet}
        isModalOpen={isModalOpen}
        onOpenCreateModal={() => {
          handleOpenCreate("mcq");
          setActiveFormulaTarget("question_text");
        }}
        questionTypeLabel={TYPE_CONFIG[formData.question_type]?.label || formData.question_type}
        isEditing={Boolean(editingQuestion)}
      />

      {/* Bulk Import Modal */}
      <BulkImportModal
        isOpen={isBulkImportOpen}
        onClose={() => setIsBulkImportOpen(false)}
        courses={courses}
        onImportSuccess={refreshQuestions}
        defaultType={selectedType}
      />

      {/* Floating Themed Action Toast */}
      {actionNotice && (
        <div className={`fixed bottom-6 right-6 z-50 px-4 py-3 rounded-2xl shadow-xl border flex items-center gap-2.5 text-xs font-bold animate-in slide-in-from-bottom-4 duration-200 ${
          actionNotice.type === "success" 
            ? "bg-slate-900 text-white border-slate-700" 
            : "bg-rose-600 text-white border-rose-500"
        }`}>
          {actionNotice.type === "success" ? <CheckCircle2 className="w-4 h-4 text-emerald-400" /> : <AlertCircle className="w-4 h-4 text-white" />}
          <span>{actionNotice.text}</span>
        </div>
      )}
    </div>
  );
}
