"use client";

import { useState, useEffect, useRef } from "react";
import { 
  Bold, 
  Italic, 
  Underline,
  Strikethrough,
  Code, 
  Quote,
  Plus, 
  Trash2, 
  Copy,
  ArrowUp,
  ArrowDown,
  Sparkles, 
  Calculator, 
  Eye, 
  Check, 
  BookOpen,
  HelpCircle,
  CheckCircle2,
  CheckSquare,
  ListOrdered,
  Search,
  X,
  Sigma,
  Atom,
  Binary,
  Compass,
  Layers,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  Edit3,
  ArrowRightLeft,
  Hash,
  FileText,
  XCircle,
  Info,
  SlidersHorizontal,
  Languages,
  Upload,
  Shapes,
  Grid,
  Image as ImageIcon,
  ArrowRight,
  Database,
  FolderUp,
  UploadCloud,
  Cloud,
  Loader2,
  BrainCircuit
} from "lucide-react";
import katex from "katex";
import "katex/dist/katex.min.css";
import { 
  SHAPE_LIBRARY, 
  SHAPE_CATEGORIES, 
  NON_VERBAL_PRESETS, 
  getShapeSvg 
} from "./nonVerbalShapes";
import {
  VERBAL_REASONING_PRESETS,
  VERBAL_SUBTYPES,
  VerbalReasoningSubType,
  VerbalReasoningPreset,
  VerbalOption
} from "./verbalReasoningData";
import QuestionBankDrawer, { convertBankItemToExamQuestion } from "./QuestionBankDrawer";

interface Course {
  id: number;
  title: string;
  code: string;
}

export type QuestionType = 
  | "mcq" 
  | "multi_select" 
  | "true_false" 
  | "fill_blank" 
  | "column_mapping" 
  | "numerical" 
  | "short_answer" 
  | "long_answer"
  | "verbal_reasoning"
  | "non_verbal";

export interface MatchingPair {
  left: string;
  right: string;
}

export interface NonVerbalOption {
  id: string;
  image_url: string;
  label?: string;
  text?: string;
}

export interface Question {
  id: string;
  type: QuestionType;
  text: string;
  marks: number;
  explanation: string;
  // MCQ & Multi-Select
  opt1: string;
  opt2: string;
  opt3: string;
  opt4: string;
  correct: string;
  correct_multi: string[];
  // True / False
  correct_tf: "true" | "false";
  // Fill in the blanks
  blank_answer: string;
  blank_alternatives: string;
  blank_placeholder: string;
  blank_case_sensitive: boolean;
  // Column Mapping
  matching_pairs: MatchingPair[];
  // Numerical
  num_exact: string;
  num_tolerance: string;
  num_unit: string;
  // Short Answer
  short_model_answer: string;
  short_keywords: string;
  // Long Answer
  long_model_answer: string;
  long_rubric: string;
  long_min_words: number;
  // Non-Verbal Intelligence
  nv_sub_type?: "series" | "analogy" | "odd_one_out" | "matrix";
  nv_problem_images?: string[];
  nv_options?: NonVerbalOption[];
  nv_correct?: string;
  nv_matrix_grid?: "2x2" | "3x3";
  // Verbal Reasoning
  vr_sub_type?: VerbalReasoningSubType;
  vr_pair1_left?: string;
  vr_pair1_right?: string;
  vr_pair2_left?: string;
  vr_relationship_type?: string;
  vr_series_type?: "number" | "letter" | "alphanumeric";
  vr_series_tokens?: string[];
  vr_rule_hint?: string;
  vr_words?: string[];
  vr_group_category?: string;
  vr_odd_index?: number;
  vr_source_word?: string;
  vr_coded_word?: string;
  vr_target_word?: string;
  vr_coding_rule?: string;
  vr_premise?: string;
  vr_clues?: string[];
  vr_question_prompt?: string;
  vr_options?: VerbalOption[];
  vr_correct?: string;
  // Language & BiDi Direction
  dir?: "auto" | "rtl" | "ltr" | "urdu" | "arabic";
  // Question Bank Link & Sync
  bank_question_id?: number | null;
  is_modified_from_source?: boolean;
  sync_to_bank?: boolean;
  save_to_bank?: boolean;
  topic?: string;
  difficulty?: "easy" | "medium" | "hard";
  original_snapshot?: string;
}

export const isRTLText = (text?: string): boolean => {
  if (!text) return false;
  // Unicode range for Arabic, Urdu, Persian characters & presentation forms
  return /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]/.test(text);
};

export const isUrduText = (text?: string): boolean => {
  if (!text) return false;
  return /[ٹڈڑںےھچگپژ]/.test(text) || /\b(ہے|ہیں|تھا|تھی|تھے|گا|گی|گے|کا|کی|کے|کو|سے|میں|اور|پر|ہو|اگر|کیا|کیوں|کون|کس|والا|والی|والے|تک|نہ|نہیں|جواب|سوال|کلیہ|مساوات)\b/.test(text);
};

export const isArabicText = (text?: string): boolean => {
  if (!text) return false;
  return isRTLText(text) && !isUrduText(text);
};

export const getScriptInfo = (text?: string, forcedDir?: "auto" | "rtl" | "ltr" | "urdu" | "arabic") => {
  if (forcedDir === "urdu") {
    return { isRtl: true, fontClass: "font-urdu text-right text-base", label: "اردو (Jameel Nastaleeq)", badge: "Jameel Noori Nastaleeq" };
  }
  if (forcedDir === "arabic") {
    return { isRtl: true, fontClass: "font-arabic text-right text-base", label: "العربية (Noto Naskh)", badge: "Noto Naskh Arabic" };
  }
  if (forcedDir === "ltr") {
    return { isRtl: false, fontClass: "font-sans text-left", label: "English (LTR)", badge: "English (LTR)" };
  }
  if (forcedDir === "rtl" || isRTLText(text)) {
    if (isUrduText(text)) {
      return { isRtl: true, fontClass: "font-urdu text-right text-base", label: "اردو (Auto Jameel)", badge: "Jameel Noori Nastaleeq" };
    }
    return { isRtl: true, fontClass: "font-arabic text-right text-base", label: "العربية (Auto Noto Naskh)", badge: "Noto Naskh Arabic" };
  }
  return { isRtl: false, fontClass: "font-sans", label: "Language: Auto", badge: "Auto Detect" };
};

export interface ActiveTarget {
  qIndex: number;
  field: string;
}

export const QUESTION_TYPES: { id: QuestionType; label: string; icon: any; desc: string; badge: string; color: string }[] = [
  { id: "mcq", label: "Multiple Choice", icon: CheckCircle2, desc: "Single correct option from choices", badge: "MCQ", color: "blue" },
  { id: "multi_select", label: "Multi-Select", icon: CheckSquare, desc: "Multiple correct choices (checkboxes)", badge: "Multi", color: "purple" },
  { id: "true_false", label: "True / False", icon: HelpCircle, desc: "Binary factual statement verification", badge: "T/F", color: "emerald" },
  { id: "fill_blank", label: "Fill in Blanks", icon: Edit3, desc: "Missing word, numerical, or formula term", badge: "Blank", color: "amber" },
  { id: "column_mapping", label: "Column Mapping", icon: ArrowRightLeft, desc: "Match items from Column A to Column B", badge: "Match", color: "indigo" },
  { id: "numerical", label: "Numerical Calculation", icon: Hash, desc: "Scientific numeric value with tolerance & unit", badge: "Math", color: "cyan" },
  { id: "short_answer", label: "Short Question", icon: FileText, desc: "Concise 1-2 sentence response with keywords", badge: "Short", color: "rose" },
  { id: "long_answer", label: "Long Essay / Proof", icon: BookOpen, desc: "Comprehensive derivation or essay with rubric", badge: "Essay", color: "violet" },
  { id: "verbal_reasoning", label: "Verbal Reasoning", icon: BrainCircuit, desc: "Verbal analogies, series, coding & odd-word-out (ISSB/IQ)", badge: "Verbal", color: "teal" },
  { id: "non_verbal", label: "Non-Verbal Intelligence", icon: Layers, desc: "Visual shape patterns, sequence, matrix & odd-one-out (ISSB/IQ)", badge: "Non-Verbal", color: "orange" },
];


interface MathSymbolItem {
  id: string;
  cat: "algebra" | "calculus" | "greek" | "trig" | "matrices" | "logic" | "physics" | "urdu";
  label: string;
  insert: string;
  title: string;
  kw: string;
}

const FORMULA_CATEGORIES = [
  { id: "algebra", label: "Algebra", icon: Calculator },
  { id: "calculus", label: "Calculus", icon: Sigma },
  { id: "greek", label: "Greek", icon: Sparkles },
  { id: "trig", label: "Trigonometry", icon: Compass },
  { id: "matrices", label: "Matrices & Vec", icon: Layers },
  { id: "logic", label: "Sets & Logic", icon: Binary },
  { id: "physics", label: "Physics", icon: Atom },
  { id: "urdu", label: "اردو / عربي", icon: Languages },
] as const;

const ALL_MATH_SYMBOLS: MathSymbolItem[] = [
  // --- 1. ALGEBRA & ARITHMETIC ---
  { id: "frac", cat: "algebra", label: "a/b", insert: "$\\frac{a}{b}$", title: "Fraction (a/b)", kw: "fraction divide ratio over" },
  { id: "frac_half", cat: "algebra", label: "½", insert: "$\\frac{1}{2}$", title: "One Half", kw: "half fraction 1/2" },
  { id: "sqrt", cat: "algebra", label: "√x", insert: "$\\sqrt{x}$", title: "Square Root", kw: "sqrt radical root" },
  { id: "nroot", cat: "algebra", label: "ⁿ√x", insert: "$\\sqrt[n]{x}$", title: "N-th Root", kw: "nth root radical" },
  { id: "cuberoot", cat: "algebra", label: "∛x", insert: "$\\sqrt[3]{x}$", title: "Cube Root", kw: "cube root radical" },
  { id: "pow2", cat: "algebra", label: "x²", insert: "$x^{2}$", title: "Square Power", kw: "square power exponent" },
  { id: "pow3", cat: "algebra", label: "x³", insert: "$x^{3}$", title: "Cube Power", kw: "cube power exponent" },
  { id: "pown", cat: "algebra", label: "xⁿ", insert: "$x^{n}$", title: "N-th Power", kw: "power exponent nth" },
  { id: "pow_ab", cat: "algebra", label: "aᵇ", insert: "$a^{b}$", title: "General Exponent", kw: "power exponent" },
  { id: "sub1", cat: "algebra", label: "x₁", insert: "$x_{1}$", title: "Subscript 1", kw: "subscript index" },
  { id: "sub2", cat: "algebra", label: "x₂", insert: "$x_{2}$", title: "Subscript 2", kw: "subscript index" },
  { id: "subi", cat: "algebra", label: "xᵢ", insert: "$x_{i}$", title: "Subscript i", kw: "subscript index" },
  { id: "subn", cat: "algebra", label: "xₙ", insert: "$x_{n}$", title: "Subscript n", kw: "subscript index" },
  { id: "subpow", cat: "algebra", label: "x₁²", insert: "$x_{1}^{2}$", title: "Subscript & Power", kw: "subscript power index" },
  { id: "pm", cat: "algebra", label: "±", insert: "$\\pm$", title: "Plus-Minus", kw: "plus minus" },
  { id: "mp", cat: "algebra", label: "∓", insert: "$\\mp$", title: "Minus-Plus", kw: "minus plus" },
  { id: "times", cat: "algebra", label: "×", insert: "$\\times$", title: "Multiplication Cross", kw: "times multiply cross" },
  { id: "div", cat: "algebra", label: "÷", insert: "$\\div$", title: "Division", kw: "divide division" },
  { id: "cdot", cat: "algebra", label: "·", insert: "$\\cdot$", title: "Center Dot Product", kw: "dot product multiply center" },
  { id: "circ", cat: "algebra", label: "∘", insert: "$\\circ$", title: "Composition / Degree", kw: "circle composition degree" },
  { id: "ast", cat: "algebra", label: "∗", insert: "$\\ast$", title: "Asterisk Operator", kw: "asterisk star" },
  { id: "eq", cat: "algebra", label: "=", insert: "$=$", title: "Equal Sign", kw: "equal equals" },
  { id: "neq", cat: "algebra", label: "≠", insert: "$\\neq$", title: "Not Equal", kw: "not equal unequal" },
  { id: "approx", cat: "algebra", label: "≈", insert: "$\\approx$", title: "Approximately Equal", kw: "approximate approx" },
  { id: "equiv", cat: "algebra", label: "≡", insert: "$\\equiv$", title: "Identically Equal / Congruent", kw: "equivalent congruent identity" },
  { id: "le", cat: "algebra", label: "≤", insert: "$\\le$", title: "Less Than or Equal", kw: "less than equal inequality" },
  { id: "ge", cat: "algebra", label: "≥", insert: "$\\ge$", title: "Greater Than or Equal", kw: "greater than equal inequality" },
  { id: "ll", cat: "algebra", label: "≪", insert: "$\\ll$", title: "Much Less Than", kw: "much less than" },
  { id: "gg", cat: "algebra", label: "≫", insert: "$\\gg$", title: "Much Greater Than", kw: "much greater than" },
  { id: "propto", cat: "algebra", label: "∝", insert: "$\\propto$", title: "Proportional To", kw: "proportional variation" },
  { id: "sim", cat: "algebra", label: "∼", insert: "$\\sim$", title: "Similar To / Asymptote", kw: "similar tilde" },
  { id: "infty", cat: "algebra", label: "∞", insert: "$\\infty$", title: "Infinity", kw: "infinity unbounded infinite" },
  { id: "paren", cat: "algebra", label: "(x)", insert: "$\\left( x \\right)$", title: "Dynamic Parentheses", kw: "brackets parentheses" },
  { id: "bracket", cat: "algebra", label: "[x]", insert: "$\\left[ x \\right]$", title: "Dynamic Square Brackets", kw: "brackets square" },
  { id: "brace", cat: "algebra", label: "{x}", insert: "$\\left\\{ x \\right\\}$", title: "Dynamic Curly Braces", kw: "braces curly set" },
  { id: "abs", cat: "algebra", label: "|x|", insert: "$\\left| x \\right|$", title: "Absolute Value / Modulus", kw: "absolute modulus magnitude" },
  { id: "norm", cat: "algebra", label: "‖x‖", insert: "$\\left\\| x \\right\\|$", title: "Vector / Matrix Norm", kw: "norm vector length" },
  { id: "floor", cat: "algebra", label: "⌊x⌋", insert: "$\\lfloor x \\rfloor$", title: "Floor Function", kw: "floor integer step" },
  { id: "ceil", cat: "algebra", label: "⌈x⌉", insert: "$\\lceil x \\rceil$", title: "Ceiling Function", kw: "ceil ceiling integer" },

  // --- 2. CALCULUS & ANALYSIS ---
  { id: "int", cat: "calculus", label: "∫ dx", insert: "$\\int f(x) \\, dx$", title: "Indefinite Integral", kw: "integral antiderivative calculus" },
  { id: "int_ab", cat: "calculus", label: "∫ₐᵇ", insert: "$\\int_{a}^{b} f(x) \\, dx$", title: "Definite Integral (Limits a to b)", kw: "integral definite limits" },
  { id: "int_0inf", cat: "calculus", label: "∫₀^∞", insert: "$\\int_{0}^{\\infty} f(x) \\, dx$", title: "Improper Integral (0 to Inf)", kw: "integral improper infinity" },
  { id: "iint", cat: "calculus", label: "∬ dA", insert: "$\\iint_{D} f(x,y) \\, dA$", title: "Double Surface Integral", kw: "double integral area surface" },
  { id: "iiint", cat: "calculus", label: "∭ dV", insert: "$\\iiint_{V} f(x,y,z) \\, dV$", title: "Triple Volume Integral", kw: "triple integral volume" },
  { id: "oint", cat: "calculus", label: "∮ dr", insert: "$\\oint_{C} \\vec{F} \\cdot d\\vec{r}$", title: "Contour Closed Loop Integral", kw: "line integral contour closed" },
  { id: "deriv", cat: "calculus", label: "dy/dx", insert: "$\\frac{dy}{dx}$", title: "First Derivative (dy/dx)", kw: "derivative first derivative" },
  { id: "deriv2", cat: "calculus", label: "d²y/dx²", insert: "$\\frac{d^2 y}{dx^2}$", title: "Second Derivative (d²y/dx²)", kw: "second derivative acceleration" },
  { id: "deriv_op", cat: "calculus", label: "d/dx(..)", insert: "$\\frac{d}{dx}\\left( f(x) \\right)$", title: "Derivative Operator", kw: "derivative operator rate of change" },
  { id: "partial", cat: "calculus", label: "∂f/∂x", insert: "$\\frac{\\partial f}{\\partial x}$", title: "Partial Derivative", kw: "partial derivative multivariable" },
  { id: "partial2", cat: "calculus", label: "∂²f/∂x²", insert: "$\\frac{\\partial^2 f}{\\partial x^2}$", title: "Second Partial Derivative", kw: "second partial derivative laplacian" },
  { id: "fprime", cat: "calculus", label: "f'(x)", insert: "$f'(x)$", title: "Function Prime Derivative", kw: "prime first derivative" },
  { id: "fprime2", cat: "calculus", label: "f''(x)", insert: "$f''(x)$", title: "Function Double Prime", kw: "double prime second derivative" },
  { id: "lim0", cat: "calculus", label: "lim x→0", insert: "$\\lim_{x \\to 0} f(x)$", title: "Limit Approaching 0", kw: "limit approaching zero calculus" },
  { id: "liminf", cat: "calculus", label: "lim x→∞", insert: "$\\lim_{x \\to \\infty} f(x)$", title: "Limit Approaching Infinity", kw: "limit infinity calculus" },
  { id: "lim_left", cat: "calculus", label: "lim x→a⁻", insert: "$\\lim_{x \\to a^-} f(x)$", title: "Left-Hand Limit", kw: "left hand limit" },
  { id: "lim_right", cat: "calculus", label: "lim x→a⁺", insert: "$\\lim_{x \\to a^+} f(x)$", title: "Right-Hand Limit", kw: "right hand limit" },
  { id: "sum_n", cat: "calculus", label: "∑₁ⁿ", insert: "$\\sum_{i=1}^{n} x_i$", title: "Finite Summation (Sigma)", kw: "summation sigma series sum" },
  { id: "sum_inf", cat: "calculus", label: "∑₀^∞", insert: "$\\sum_{n=0}^{\\infty} a_n x^n$", title: "Infinite Series / Power Series", kw: "infinite sum series power" },
  { id: "prod_n", cat: "calculus", label: "∏₁ⁿ", insert: "$\\prod_{i=1}^{n} x_i$", title: "Product Operator (Capital Pi)", kw: "product pi multiplication series" },
  { id: "nabla", cat: "calculus", label: "∇", insert: "$\\nabla$", title: "Nabla / Del Operator", kw: "nabla del gradient vector" },
  { id: "grad", cat: "calculus", label: "∇f", insert: "$\\nabla f$", title: "Gradient Vector", kw: "gradient slope vector" },
  { id: "div_op", cat: "calculus", label: "∇·F", insert: "$\\nabla \\cdot \\vec{F}$", title: "Divergence", kw: "divergence flux vector" },
  { id: "curl_op", cat: "calculus", label: "∇×F", insert: "$\\nabla \\times \\vec{F}$", title: "Curl (Vorticity)", kw: "curl rotation vector" },
  { id: "diff_x", cat: "calculus", label: "dx", insert: "$\\mathrm{d}x$", title: "Differential dx", kw: "differential dx" },
  { id: "diff_t", cat: "calculus", label: "dt", insert: "$\\mathrm{d}t$", title: "Differential dt", kw: "differential dt time" },
  { id: "delta_x", cat: "calculus", label: "Δx", insert: "$\\Delta x$", title: "Increment Delta x", kw: "delta change increment" },

  // --- 3. GREEK ALPHABET ---
  { id: "alpha", cat: "greek", label: "α", insert: "$\\alpha$", title: "Alpha (α)", kw: "alpha greek angle" },
  { id: "beta", cat: "greek", label: "β", insert: "$\\beta$", title: "Beta (β)", kw: "beta greek angle" },
  { id: "gamma", cat: "greek", label: "γ", insert: "$\\gamma$", title: "Gamma (γ)", kw: "gamma greek ratio" },
  { id: "delta_g", cat: "greek", label: "δ", insert: "$\\delta$", title: "Delta (δ)", kw: "delta greek small change" },
  { id: "epsilon", cat: "greek", label: "ε", insert: "$\\epsilon$", title: "Epsilon (ε)", kw: "epsilon greek permittivity" },
  { id: "zeta", cat: "greek", label: "ζ", insert: "$\\zeta$", title: "Zeta (ζ)", kw: "zeta greek damping" },
  { id: "eta", cat: "greek", label: "η", insert: "$\\eta$", title: "Eta (η)", kw: "eta greek efficiency viscosity" },
  { id: "theta", cat: "greek", label: "θ", insert: "$\\theta$", title: "Theta (θ)", kw: "theta greek angle polar" },
  { id: "iota", cat: "greek", label: "ι", insert: "$\\iota$", title: "Iota (ι)", kw: "iota greek" },
  { id: "kappa", cat: "greek", label: "κ", insert: "$\\kappa$", title: "Kappa (κ)", kw: "kappa greek curvature" },
  { id: "lambda", cat: "greek", label: "λ", insert: "$\\lambda$", title: "Lambda (λ)", kw: "lambda greek wavelength eigenvalue" },
  { id: "mu", cat: "greek", label: "μ", insert: "$\\mu$", title: "Mu (μ)", kw: "mu greek micro friction" },
  { id: "nu", cat: "greek", label: "ν", insert: "$\\nu$", title: "Nu (ν)", kw: "nu greek frequency kinematic" },
  { id: "xi", cat: "greek", label: "ξ", insert: "$\\xi$", title: "Xi (ξ)", kw: "xi greek" },
  { id: "pi_g", cat: "greek", label: "π", insert: "$\\pi$", title: "Pi (π)", kw: "pi greek 3.14159 circle" },
  { id: "rho", cat: "greek", label: "ρ", insert: "$\\rho$", title: "Rho (ρ)", kw: "rho greek density resistivity" },
  { id: "sigma_g", cat: "greek", label: "σ", insert: "$\\sigma$", title: "Sigma (σ)", kw: "sigma greek standard deviation stress" },
  { id: "tau", cat: "greek", label: "τ", insert: "$\\tau$", title: "Tau (τ)", kw: "tau greek torque shear time constant" },
  { id: "upsilon", cat: "greek", label: "υ", insert: "$\\upsilon$", title: "Upsilon (υ)", kw: "upsilon greek" },
  { id: "phi", cat: "greek", label: "φ", insert: "$\\phi$", title: "Phi (φ)", kw: "phi greek flux phase angle" },
  { id: "chi", cat: "greek", label: "χ", insert: "$\\chi$", title: "Chi (χ)", kw: "chi greek susceptibility" },
  { id: "psi", cat: "greek", label: "ψ", insert: "$\\psi$", title: "Psi (ψ)", kw: "psi greek wave function quantum" },
  { id: "omega", cat: "greek", label: "ω", insert: "$\\omega$", title: "Omega (ω)", kw: "omega greek angular frequency" },
  { id: "Gamma_cap", cat: "greek", label: "Γ", insert: "$\\Gamma$", title: "Capital Gamma (Γ)", kw: "capital gamma function" },
  { id: "Delta_cap", cat: "greek", label: "Δ", insert: "$\\Delta$", title: "Capital Delta (Δ)", kw: "capital delta change discriminant" },
  { id: "Theta_cap", cat: "greek", label: "Θ", insert: "$\\Theta$", title: "Capital Theta (Θ)", kw: "capital theta big O" },
  { id: "Lambda_cap", cat: "greek", label: "Λ", insert: "$\\Lambda$", title: "Capital Lambda (Λ)", kw: "capital lambda cosmological" },
  { id: "Xi_cap", cat: "greek", label: "Ξ", insert: "$\\Xi$", title: "Capital Xi (Ξ)", kw: "capital xi" },
  { id: "Pi_cap", cat: "greek", label: "Π", insert: "$\\Pi$", title: "Capital Pi (Π)", kw: "capital pi product" },
  { id: "Sigma_cap", cat: "greek", label: "Σ", insert: "$\\Sigma$", title: "Capital Sigma (Σ)", kw: "capital sigma summation" },
  { id: "Phi_cap", cat: "greek", label: "Φ", insert: "$\\Phi$", title: "Capital Phi (Φ)", kw: "capital phi magnetic flux" },
  { id: "Psi_cap", cat: "greek", label: "Ψ", insert: "$\\Psi$", title: "Capital Psi (Ψ)", kw: "capital psi wave function" },
  { id: "Omega_cap", cat: "greek", label: "Ω", insert: "$\\Omega$", title: "Capital Omega (Ω)", kw: "capital omega ohm resistance" },

  // --- 4. TRIGONOMETRY & LOG ---
  { id: "sin", cat: "trig", label: "sin θ", insert: "$\\sin\\theta$", title: "Sine function", kw: "sin sine trig" },
  { id: "cos", cat: "trig", label: "cos θ", insert: "$\\cos\\theta$", title: "Cosine function", kw: "cos cosine trig" },
  { id: "tan", cat: "trig", label: "tan θ", insert: "$\\tan\\theta$", title: "Tangent function", kw: "tan tangent trig" },
  { id: "cot", cat: "trig", label: "cot θ", insert: "$\\cot\\theta$", title: "Cotangent function", kw: "cot cotangent trig" },
  { id: "sec", cat: "trig", label: "sec θ", insert: "$\\sec\\theta$", title: "Secant function", kw: "sec secant trig" },
  { id: "csc", cat: "trig", label: "csc θ", insert: "$\\csc\\theta$", title: "Cosecant function", kw: "csc cosecant trig" },
  { id: "asin", cat: "trig", label: "sin⁻¹x", insert: "$\\sin^{-1}(x)$", title: "Inverse Sine (arcsin)", kw: "arcsin inverse sine" },
  { id: "acos", cat: "trig", label: "cos⁻¹x", insert: "$\\cos^{-1}(x)$", title: "Inverse Cosine (arccos)", kw: "arccos inverse cosine" },
  { id: "atan", cat: "trig", label: "tan⁻¹x", insert: "$\\tan^{-1}(x)$", title: "Inverse Tangent (arctan)", kw: "arctan inverse tangent" },
  { id: "sinh", cat: "trig", label: "sinh x", insert: "$\\sinh(x)$", title: "Hyperbolic Sine", kw: "sinh hyperbolic" },
  { id: "cosh", cat: "trig", label: "cosh x", insert: "$\\cosh(x)$", title: "Hyperbolic Cosine", kw: "cosh hyperbolic" },
  { id: "tanh", cat: "trig", label: "tanh x", insert: "$\\tanh(x)$", title: "Hyperbolic Tangent", kw: "tanh hyperbolic" },
  { id: "ln", cat: "trig", label: "ln x", insert: "$\\ln(x)$", title: "Natural Logarithm (base e)", kw: "ln natural log logarithm" },
  { id: "log", cat: "trig", label: "log x", insert: "$\\log(x)$", title: "Common Logarithm (base 10)", kw: "log logarithm base 10" },
  { id: "logb", cat: "trig", label: "log_b(x)", insert: "$\\log_{b}(x)$", title: "Logarithm with Base b", kw: "log logarithm base b" },
  { id: "exp", cat: "trig", label: "eˣ", insert: "$e^{x}$", title: "Exponential e^x", kw: "exp exponential e natural" },
  { id: "exp_neg", cat: "trig", label: "e⁻ˣ", insert: "$e^{-x}$", title: "Exponential Decay e^-x", kw: "exp exponential decay negative" },
  { id: "euler_phase", cat: "trig", label: "e^(iθ)", insert: "$e^{i\\theta} = \\cos\\theta + i\\sin\\theta$", title: "Euler's Formula Phase", kw: "euler formula complex exponential" },
  { id: "id_pyth", cat: "trig", label: "sin²+cos²=1", insert: "$\\sin^2\\theta + \\cos^2\\theta = 1$", title: "Pythagorean Identity", kw: "pythagorean identity sin cos trig" },
  { id: "id_tan", cat: "trig", label: "tan=sin/cos", insert: "$\\tan\\theta = \\frac{\\sin\\theta}{\\cos\\theta}$", title: "Tangent Ratio Identity", kw: "tan identity sine over cosine" },
  { id: "id_double_sin", cat: "trig", label: "sin(2θ)", insert: "$\\sin(2\\theta) = 2\\sin\\theta\\cos\\theta$", title: "Double Angle Sine", kw: "double angle sine" },
  { id: "id_double_cos", cat: "trig", label: "cos(2θ)", insert: "$\\cos(2\\theta) = \\cos^2\\theta - \\sin^2\\theta$", title: "Double Angle Cosine", kw: "double angle cosine" },

  // --- 5. MATRICES & VECTORS ---
  { id: "vec_v", cat: "matrices", label: "v⃗", insert: "$\\vec{v}$", title: "Vector v", kw: "vector velocity arrow" },
  { id: "vec_f", cat: "matrices", label: "F⃗", insert: "$\\vec{F}$", title: "Vector Force", kw: "vector force arrow" },
  { id: "vec_basis", cat: "matrices", label: "î + ĵ + k̂", insert: "$\\hat{i} + \\hat{j} + \\hat{k}$", title: "Basis Unit Vectors (i, j, k)", kw: "unit vector basis cartesian" },
  { id: "dot_prod", cat: "matrices", label: "A⃗ · B⃗", insert: "$\\vec{A} \\cdot \\vec{B}$", title: "Vector Dot Product (Scalar)", kw: "dot product scalar product" },
  { id: "cross_prod", cat: "matrices", label: "A⃗ × B⃗", insert: "$\\vec{A} \\times \\vec{B}$", title: "Vector Cross Product", kw: "cross product vector product" },
  { id: "mat2", cat: "matrices", label: "(2x2)", insert: "$\\begin{pmatrix} a & b \\\\ c & d \\end{pmatrix}$", title: "2x2 Matrix (Parentheses)", kw: "matrix 2x2 two by two" },
  { id: "mat2_b", cat: "matrices", label: "[2x2]", insert: "$\\begin{bmatrix} a & b \\\\ c & d \\end{bmatrix}$", title: "2x2 Matrix (Square Brackets)", kw: "matrix brackets 2x2" },
  { id: "det2", cat: "matrices", label: "|2x2|", insert: "$\\begin{vmatrix} a & b \\\\ c & d \\end{vmatrix}$", title: "2x2 Determinant", kw: "determinant 2x2 vertical bars" },
  { id: "mat3", cat: "matrices", label: "(3x3)", insert: "$\\begin{pmatrix} a & b & c \\\\ d & e & f \\\\ g & h & i \\end{pmatrix}$", title: "3x3 Matrix", kw: "matrix 3x3 three by three" },
  { id: "row_vec", cat: "matrices", label: "[x₁ x₂ x₃]", insert: "$\\begin{pmatrix} x_1 & x_2 & x_3 \\end{pmatrix}$", title: "Row Vector (1x3)", kw: "row vector matrix" },
  { id: "col_vec", cat: "matrices", label: "[x₁:x₂:x₃]", insert: "$\\begin{pmatrix} x_1 \\\\ x_2 \\\\ x_3 \\end{pmatrix}$", title: "Column Vector (3x1)", kw: "column vector matrix" },
  { id: "det_a", cat: "matrices", label: "det(A)", insert: "$\\det(A)$", title: "Determinant Operator", kw: "determinant matrix" },
  { id: "transp", cat: "matrices", label: "Aᵀ", insert: "$A^T$", title: "Matrix Transpose", kw: "transpose matrix" },
  { id: "inv_mat", cat: "matrices", label: "A⁻¹", insert: "$A^{-1}$", title: "Inverse Matrix", kw: "inverse matrix" },
  { id: "ident_mat", cat: "matrices", label: "Iₙ", insert: "$I_n$", title: "Identity Matrix", kw: "identity matrix unit" },

  // --- 6. SET THEORY, LOGIC & ARROWS ---
  { id: "in_set", cat: "logic", label: "∈", insert: "$\\in$", title: "Element of", kw: "in element of member belongs" },
  { id: "notin_set", cat: "logic", label: "∉", insert: "$\\notin$", title: "Not an element of", kw: "not in not member" },
  { id: "subset", cat: "logic", label: "⊂", insert: "$\\subset$", title: "Proper Subset", kw: "subset proper" },
  { id: "subseteq", cat: "logic", label: "⊆", insert: "$\\subseteq$", title: "Subset or Equal", kw: "subset equal" },
  { id: "union", cat: "logic", label: "∪", insert: "$\\cup$", title: "Set Union", kw: "union cup set or" },
  { id: "intersect", cat: "logic", label: "∩", insert: "$\\cap$", title: "Set Intersection", kw: "intersection cap set and" },
  { id: "setminus", cat: "logic", label: "∖", insert: "$\\setminus$", title: "Set Difference (Minus)", kw: "set difference minus complement" },
  { id: "emptyset", cat: "logic", label: "∅", insert: "$\\emptyset$", title: "Empty Set / Null", kw: "empty set null" },
  { id: "set_r", cat: "logic", label: "ℝ", insert: "$\\mathbb{R}$", title: "Real Numbers Set", kw: "real numbers blackboard bold" },
  { id: "set_n", cat: "logic", label: "ℕ", insert: "$\\mathbb{N}$", title: "Natural Numbers Set", kw: "natural numbers integers positive" },
  { id: "set_z", cat: "logic", label: "ℤ", insert: "$\\mathbb{Z}$", title: "Integers Set", kw: "integers whole numbers" },
  { id: "set_q", cat: "logic", label: "ℚ", insert: "$\\mathbb{Q}$", title: "Rational Numbers Set", kw: "rational numbers fractions" },
  { id: "set_c", cat: "logic", label: "ℂ", insert: "$\\mathbb{C}$", title: "Complex Numbers Set", kw: "complex numbers imaginary" },
  { id: "forall", cat: "logic", label: "∀", insert: "$\\forall$", title: "For All (Universal Quantifier)", kw: "for all universal quantifier" },
  { id: "exists", cat: "logic", label: "∃", insert: "$\\exists$", title: "There Exists (Existential)", kw: "there exists existential quantifier" },
  { id: "nexists", cat: "logic", label: "∄", insert: "$\\nexists$", title: "There Does Not Exist", kw: "there does not exist" },
  { id: "neg", cat: "logic", label: "¬", insert: "$\\neg$", title: "Logical NOT (Negation)", kw: "not negation logic" },
  { id: "land", cat: "logic", label: "∧", insert: "$\\land$", title: "Logical AND (Conjunction)", kw: "and conjunction logic wedge" },
  { id: "lor", cat: "logic", label: "∨", insert: "$\\lor$", title: "Logical OR (Disjunction)", kw: "or disjunction logic vee" },
  { id: "implies", cat: "logic", label: "⇒", insert: "$\\implies$", title: "Implies (Conditional)", kw: "implies conditional logic" },
  { id: "iff", cat: "logic", label: "⇔", insert: "$\\iff$", title: "If and only if (Biconditional)", kw: "iff equivalence biconditional" },
  { id: "therefore", cat: "logic", label: "∴", insert: "$\\therefore$", title: "Therefore", kw: "therefore conclusion dots" },
  { id: "because", cat: "logic", label: "∵", insert: "$\\because$", title: "Because / Since", kw: "because reason since" },
  { id: "r_arrow", cat: "logic", label: "→", insert: "$\\to$", title: "Approaches / Right Arrow", kw: "arrow right approaches to" },
  { id: "l_arrow", cat: "logic", label: "←", insert: "$\\leftarrow$", title: "Left Arrow", kw: "arrow left" },
  { id: "lr_arrow", cat: "logic", label: "↔", insert: "$\\leftrightarrow$", title: "Left-Right Arrow", kw: "arrow left right" },
  { id: "mapsto", cat: "logic", label: "↦", insert: "$\\mapsto$", title: "Maps To", kw: "maps to function mapping" },

  // --- 7. PHYSICS & SCIENTIFIC FORMULAS ---
  { id: "kin1", cat: "physics", label: "v=u+at", insert: "$v = u + at$", title: "1st Equation of Motion", kw: "kinematics motion velocity physics" },
  { id: "kin2", cat: "physics", label: "s=ut+½at²", insert: "$s = ut + \\frac{1}{2}at^2$", title: "2nd Equation of Motion", kw: "kinematics displacement physics" },
  { id: "kin3", cat: "physics", label: "v²=u²+2as", insert: "$v^2 = u^2 + 2as$", title: "3rd Equation of Motion", kw: "kinematics motion acceleration physics" },
  { id: "f_ma", cat: "physics", label: "F⃗=ma⃗", insert: "$\\vec{F} = m\\vec{a}$", title: "Newton's 2nd Law of Motion", kw: "force mass acceleration newton physics" },
  { id: "mom", cat: "physics", label: "p=mv", insert: "$p = mv$", title: "Linear Momentum", kw: "momentum physics linear" },
  { id: "work", cat: "physics", label: "W=F⃗·d⃗", insert: "$W = \\vec{F} \\cdot \\vec{d}$", title: "Work Done", kw: "work force displacement energy" },
  { id: "ke", cat: "physics", label: "K.E.=½mv²", insert: "$K.E. = \\frac{1}{2}mv^2$", title: "Kinetic Energy", kw: "kinetic energy work physics" },
  { id: "pe", cat: "physics", label: "P.E.=mgh", insert: "$P.E. = mgh$", title: "Potential Energy", kw: "potential energy gravity physics" },
  { id: "power_w", cat: "physics", label: "P=W/t", insert: "$P = \\frac{W}{t}$", title: "Power (Work / Time)", kw: "power work time watt" },
  { id: "grav", cat: "physics", label: "F_g=G(m₁m₂/r²)", insert: "$F_g = G\\frac{m_1 m_2}{r^2}$", title: "Law of Universal Gravitation", kw: "gravity gravitation newton physics" },
  { id: "centrip", cat: "physics", label: "a_c=v²/r", insert: "$a_c = \\frac{v^2}{r}$", title: "Centripetal Acceleration", kw: "centripetal acceleration circular motion" },
  { id: "ohms", cat: "physics", label: "V=IR", insert: "$V = IR$", title: "Ohm's Law", kw: "ohms law voltage current resistance electricity" },
  { id: "elec_p", cat: "physics", label: "P=VI=I²R", insert: "$P = VI = I^2 R = \\frac{V^2}{R}$", title: "Electrical Power", kw: "electrical power watt circuit" },
  { id: "coulomb", cat: "physics", label: "F=kq₁q₂/r²", insert: "$F = \\frac{1}{4\\pi\\varepsilon_0}\\frac{q_1 q_2}{r^2}$", title: "Coulomb's Electrostatic Law", kw: "coulomb electric charge force" },
  { id: "capac", cat: "physics", label: "C=Q/V", insert: "$C = \\frac{Q}{V}$", title: "Capacitance (Farads)", kw: "capacitance capacitor charge voltage" },
  { id: "mag_b", cat: "physics", label: "B=μ₀I/2πr", insert: "$B = \\frac{\\mu_0 I}{2\\pi r}$", title: "Magnetic Field around Wire", kw: "magnetic field ampere biot savart" },
  { id: "mass_e", cat: "physics", label: "E=mc²", insert: "$E = mc^2$", title: "Einstein Mass-Energy Equivalence", kw: "einstein relativity energy mass" },
  { id: "photon_e", cat: "physics", label: "E=hf=hc/λ", insert: "$E = hf = \\frac{hc}{\\lambda}$", title: "Planck Photon Energy", kw: "photon energy quantum planck light" },
  { id: "debroglie", cat: "physics", label: "λ=h/p", insert: "$\\lambda = \\frac{h}{p}$", title: "de Broglie Wavelength", kw: "de broglie wavelength quantum matter wave" },
  { id: "wave_v", cat: "physics", label: "v=fλ", insert: "$v = f\\lambda$", title: "Wave Speed Equation", kw: "wave speed frequency wavelength sound light" },
  { id: "period_t", cat: "physics", label: "T=1/f", insert: "$T = \\frac{1}{f}$", title: "Wave Time Period", kw: "time period frequency oscillation" },
  { id: "uncertain", cat: "physics", label: "ΔxΔp≥ℏ/2", insert: "$\\Delta x \\cdot \\Delta p \\ge \\frac{\\hbar}{2}$", title: "Heisenberg Uncertainty Principle", kw: "heisenberg uncertainty quantum" },
  { id: "ph_chem", cat: "physics", label: "pH=-log[H⁺]", insert: "$\\text{pH} = -\\log[\\text{H}^+]$", title: "pH Formula (Acid-Base)", kw: "pH chemistry acid base hydrogen" },
  { id: "ideal_gas", cat: "physics", label: "PV=nRT", insert: "$PV = nRT$", title: "Ideal Gas Law", kw: "ideal gas pressure volume temperature chemistry" },
  { id: "unit_deg", cat: "physics", label: "°C", insert: "$^\\circ\\text{C}$", title: "Degrees Celsius Unit", kw: "celsius temperature degree unit" },
  { id: "unit_acc", cat: "physics", label: "m/s²", insert: "$\\text{m/s}^2$", title: "Meters per second squared", kw: "unit acceleration meter second" },
  { id: "unit_ohm", cat: "physics", label: "Ω", insert: "$\\Omega$", title: "Ohm (Resistance Unit)", kw: "ohm resistance unit" },

  // --- 8. URDU & ARABIC ACADEMIC & MATH PHRASES ---
  { id: "ur_hal", cat: "urdu", label: "حل:", insert: "حل: ", title: "Solution (حل)", kw: "hal solution urdu arabic" },
  { id: "ur_saboot", cat: "urdu", label: "ثبوت:", insert: "ثبوت: ", title: "Proof / Derivation (ثبوت)", kw: "saboot proof derivation urdu arabic" },
  { id: "ur_qanoon", cat: "urdu", label: "قانون:", insert: "قانون: ", title: "Law / Principle (قانون)", kw: "qanoon law principle urdu arabic" },
  { id: "ur_musawat", cat: "urdu", label: "مساوات:", insert: "مساوات: ", title: "Equation (مساوات)", kw: "musawat equation formula urdu arabic" },
  { id: "ur_misal", cat: "urdu", label: "مثال:", insert: "مثال: ", title: "Example (مثال)", kw: "misal example urdu arabic" },
  { id: "ur_jawab", cat: "urdu", label: "جواب:", insert: "جواب: ", title: "Answer (جواب)", kw: "jawab answer urdu arabic" },
  { id: "ur_farz", cat: "urdu", label: "فرض کیا:", insert: "فرض کیا کہ ", title: "Assume / Let (فرض کیا)", kw: "farz let assume suppose urdu arabic" },
  { id: "ur_kyunke", cat: "urdu", label: "چونکہ (∵)", insert: "چونکہ (∵) ", title: "Since / Because (چونکہ)", kw: "kyunke since because urdu arabic" },
  { id: "ur_lehaza", cat: "urdu", label: "لہٰذا (∴)", insert: "لہٰذا (∴) ", title: "Therefore (لہٰذا)", kw: "lehaza therefore hence urdu arabic" },
  { id: "ur_kulia", cat: "urdu", label: "کلیہ:", insert: "کلیہ: ", title: "Formula / Rule (کلیہ)", kw: "kulia formula rule theorem urdu arabic" },
  { id: "ur_tareef", cat: "urdu", label: "تعریف:", insert: "تعریف: ", title: "Definition (تعریف)", kw: "tareef definition urdu arabic" },
  { id: "ur_qemat", cat: "urdu", label: "قیمت معلوم کریں", insert: "کی قیمت معلوم کریں: ", title: "Find the value of (قیمت معلوم کریں)", kw: "qemat evaluate calculate find urdu arabic" },
  { id: "ur_durust", cat: "urdu", label: "درست جواب", insert: "درست جواب: ", title: "Correct Answer (درست جواب)", kw: "durust sahih correct answer urdu arabic" },
  { id: "ur_agar", cat: "urdu", label: "اگر ... تو ...", insert: "اگر $...$ ہو تو ", title: "If ... then (شرط)", kw: "agar then if condition urdu arabic" },
  { id: "ur_note", cat: "urdu", label: "نوٹ:", insert: "نوٹ: ", title: "Note (نوٹ)", kw: "note dhyan urdu arabic" }
];

export const createDefaultQuestion = (type: QuestionType = "mcq"): Question => {
  const qId = "q-" + Date.now() + "-" + Math.random().toString(36).substring(2, 7);
  const base: Question = {
    id: qId,
    type,
    text: "",
    marks: 10,
    explanation: "",
    opt1: "",
    opt2: "",
    opt3: "",
    opt4: "",
    correct: "1",
    correct_multi: ["1"],
    correct_tf: "true",
    blank_answer: "",
    blank_alternatives: "",
    blank_placeholder: "Type your answer here...",
    blank_case_sensitive: false,
    matching_pairs: [
      { left: "Item 1", right: "Match 1" },
      { left: "Item 2", right: "Match 2" },
      { left: "Item 3", right: "Match 3" }
    ],
    num_exact: "100",
    num_tolerance: "0",
    num_unit: "",
    short_model_answer: "",
    short_keywords: "",
    long_model_answer: "",
    long_rubric: "",
    long_min_words: 50,
    nv_sub_type: "series",
    nv_problem_images: [
      "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='100' height='100' viewBox='0 0 100 100'><rect width='100' height='100' rx='14' fill='%23f8fafc' stroke='%23cbd5e1' stroke-width='2'/><g transform='rotate(0 50 50)'><path d='M50 20 L50 80 M50 20 L35 35 M50 20 L65 35' stroke='%232563eb' stroke-width='6' stroke-linecap='round' stroke-linejoin='round'/></g></svg>",
      "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='100' height='100' viewBox='0 0 100 100'><rect width='100' height='100' rx='14' fill='%23f8fafc' stroke='%23cbd5e1' stroke-width='2'/><g transform='rotate(45 50 50)'><path d='M50 20 L50 80 M50 20 L35 35 M50 20 L65 35' stroke='%232563eb' stroke-width='6' stroke-linecap='round' stroke-linejoin='round'/></g></svg>",
      "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='100' height='100' viewBox='0 0 100 100'><rect width='100' height='100' rx='14' fill='%23f8fafc' stroke='%23cbd5e1' stroke-width='2'/><g transform='rotate(90 50 50)'><path d='M50 20 L50 80 M50 20 L35 35 M50 20 L65 35' stroke='%232563eb' stroke-width='6' stroke-linecap='round' stroke-linejoin='round'/></g></svg>"
    ],
    nv_options: [
      { id: "1", label: "A", image_url: "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='100' height='100' viewBox='0 0 100 100'><rect width='100' height='100' rx='14' fill='%23f8fafc' stroke='%23cbd5e1' stroke-width='2'/><g transform='rotate(135 50 50)'><path d='M50 20 L50 80 M50 20 L35 35 M50 20 L65 35' stroke='%23059669' stroke-width='6' stroke-linecap='round' stroke-linejoin='round'/></g></svg>", text: "Rotated 135° (Correct Next)" },
      { id: "2", label: "B", image_url: "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='100' height='100' viewBox='0 0 100 100'><rect width='100' height='100' rx='14' fill='%23f8fafc' stroke='%23cbd5e1' stroke-width='2'/><g transform='rotate(180 50 50)'><path d='M50 20 L50 80 M50 20 L35 35 M50 20 L65 35' stroke='%233b82f6' stroke-width='6' stroke-linecap='round' stroke-linejoin='round'/></g></svg>", text: "Rotated 180° Downwards" },
      { id: "3", label: "C", image_url: "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='100' height='100' viewBox='0 0 100 100'><rect width='100' height='100' rx='14' fill='%23f8fafc' stroke='%23cbd5e1' stroke-width='2'/><g transform='rotate(270 50 50)'><path d='M50 20 L50 80 M50 20 L35 35 M50 20 L65 35' stroke='%233b82f6' stroke-width='6' stroke-linecap='round' stroke-linejoin='round'/></g></svg>", text: "Rotated 270° Leftwards" },
      { id: "4", label: "D", image_url: "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='100' height='100' viewBox='0 0 100 100'><rect width='100' height='100' rx='14' fill='%23f8fafc' stroke='%23cbd5e1' stroke-width='2'/><g transform='rotate(315 50 50)'><path d='M50 20 L50 80 M50 20 L35 35 M50 20 L65 35' stroke='%233b82f6' stroke-width='6' stroke-linecap='round' stroke-linejoin='round'/></g></svg>", text: "Rotated 315° Up-Left" }
    ],
    nv_correct: "1",
    nv_matrix_grid: "2x2",
    dir: "auto",
    bank_question_id: null,
    is_modified_from_source: false,
    sync_to_bank: false,
    save_to_bank: false,
    topic: "General",
    difficulty: "medium"
  };

  switch (type) {
    case "mcq":
      base.text = "State your question here. Formulas like $E = mc^2$ render live in KaTeX.";
      base.opt1 = "Option A";
      base.opt2 = "Option B";
      base.opt3 = "Option C";
      base.opt4 = "Option D";
      base.correct = "1";
      break;
    case "multi_select":
      base.text = "Select all correct choices that satisfy the condition:";
      base.opt1 = "Option 1";
      base.opt2 = "Option 2";
      base.opt3 = "Option 3";
      base.opt4 = "Option 4";
      base.correct_multi = ["1", "2"];
      break;
    case "true_false":
      base.text = "Determine whether the following statement is True or False:";
      base.correct_tf = "true";
      break;
    case "fill_blank":
      base.text = "Fill in the blank: The speed of light in vacuum is approximately ____.";
      base.blank_answer = "3x10^8 m/s";
      base.blank_alternatives = "300,000 km/s | 3e8 m/s";
      base.blank_placeholder = "Enter value";
      break;
    case "column_mapping":
      base.text = "Match each item in Column A with its corresponding pair in Column B:";
      base.matching_pairs = [
        { left: "Force ($F$)", right: "Newton (N)" },
        { left: "Energy ($E$)", right: "Joule (J)" },
        { left: "Power ($P$)", right: "Watt (W)" }
      ];
      break;
    case "numerical":
      base.text = "Calculate the following scientific numerical value:";
      base.num_exact = "98";
      base.num_tolerance = "0.5";
      base.num_unit = "N";
      break;
    case "short_answer":
      base.text = "Provide a concise conceptual definition (1-2 sentences):";
      base.short_keywords = "inertia, mass, acceleration";
      base.short_model_answer = "An object continues in its state of rest or uniform motion unless acted upon by a net external force.";
      break;
    case "long_answer":
      base.text = "Provide a comprehensive theoretical proof or essay demonstrating step-by-step working:";
      base.long_min_words = 50;
      base.long_rubric = "Credit breakdown: Derivation steps (5m), Clarity of proof (3m), Final formula (2m)";
      base.long_model_answer = "Full step-by-step mathematical proof and explanation...";
      break;
    case "non_verbal":
      base.text = "Look at the pattern sequence below. Which figure should logically replace the question mark (?) in the series? / پیٹرن کے تسلسل کو دیکھ کر درست شکل کا انتخاب کریں:";
      base.nv_sub_type = "series";
      base.nv_problem_images = [
        getShapeSvg("quad_tr"),
        getShapeSvg("quad_br"),
        getShapeSvg("quad_bl")
      ];
      base.nv_options = [
        { id: "1", label: "A", image_url: getShapeSvg("quad_tl"), text: "Top-Left Shaded (Next)" },
        { id: "2", label: "B", image_url: getShapeSvg("quad_tr"), text: "Top-Right Shaded" },
        { id: "3", label: "C", image_url: getShapeSvg("quad_br"), text: "Bottom-Right Shaded" },
        { id: "4", label: "D", image_url: getShapeSvg("half_top"), text: "Top-Half Shaded" }
      ];
      base.nv_correct = "1";
      base.explanation = "The shaded quadrant moves 90° clockwise in each consecutive figure: Top-Right (Figure 1) ➔ Bottom-Right (Figure 2) ➔ Bottom-Left (Figure 3). The next logical figure must have the Top-Left quadrant shaded (Option A).";
      break;
    case "verbal_reasoning":
      base.text = "Choose the word that has the same relationship to Teacher as Hospital has to Doctor: / وہ لفظ منتخب کریں جس کا استاد کے ساتھ وہی تعلق ہو جو ہسپتال کا ڈاکٹر سے ہے:";
      base.vr_sub_type = "analogy";
      base.vr_pair1_left = "Doctor";
      base.vr_pair1_right = "Hospital";
      base.vr_pair2_left = "Teacher";
      base.vr_relationship_type = "Worker & Workplace (پیشہ اور کام کی جگہ)";
      base.vr_series_type = "number";
      base.vr_series_tokens = ["3", "6", "12", "24", "48"];
      base.vr_rule_hint = "Multiply by 2 at each step (×2 Progression)";
      base.vr_words = ["Copper", "Iron", "Wood", "Silver", "Gold"];
      base.vr_group_category = "Conductive Metallic Elements (دھاتیں)";
      base.vr_odd_index = 2;
      base.vr_source_word = "PEACE";
      base.vr_coded_word = "QFBDF";
      base.vr_target_word = "SMART";
      base.vr_coding_rule = "Each letter is shifted forward by +1 in the alphabet";
      base.vr_premise = "A boy points to a photograph and provides kinship clues:";
      base.vr_clues = [
        "Clue 1: 'My father\\'s only son' = The boy himself",
        "Clue 2: 'Daughter of the boy himself' = His own daughter"
      ];
      base.vr_question_prompt = "Who is the girl in the photograph to the boy?";
      base.vr_options = [
        { id: "1", label: "A", text: "School (اسکول)" },
        { id: "2", label: "B", text: "Chalk (چاک)" },
        { id: "3", label: "C", text: "Student (طالب علم)" },
        { id: "4", label: "D", text: "Book (کتاب)" }
      ];
      base.vr_correct = "1";
      base.explanation = "A Doctor works in a Hospital (Worker : Workplace). Similarly, a Teacher works in a School. Hence, School (Option A) is the correct answer.";
      break;
  }

  return base;
};

export default function ExamEditor({ courses }: { courses: Course[] }) {
  const [questions, setQuestions] = useState<Question[]>([
    {
      ...createDefaultQuestion("mcq"),
      id: "q-1",
      text: "Solve the quadratic equation: $ax^2 + bx + c = 0$ for $x$.",
      marks: 10,
      opt1: "$x = \\frac{-b \\pm \\sqrt{b^2 - 4ac}}{2a}$",
      opt2: "$x = \\frac{-b \\pm \\sqrt{b^2 + 4ac}}{2a}$",
      opt3: "$x = \\frac{b \\pm \\sqrt{b^2 - 4ac}}{2a}$",
      opt4: "$x = \\frac{-b \\pm \\sqrt{2ac - b^2}}{a}$",
      correct: "1",
      explanation: "Applying the standard quadratic formula derived by completing the square."
    },
    {
      ...createDefaultQuestion("mcq"),
      id: "q-2",
      text: "Evaluate the definite calculus integral: $\\int_0^1 (3x^2 + 2x) \\, dx$.",
      marks: 10,
      opt1: "$2$",
      opt2: "$3$",
      opt3: "$1$",
      opt4: "$5$",
      correct: "1",
      explanation: "$\\int (3x^2 + 2x) dx = x^3 + x^2$. Evaluating from 0 to 1 gives $(1^3 + 1^2) - 0 = 2$."
    }
  ]);

  const [examMeta, setExamMeta] = useState({
    title: "Calculus & Advanced Mathematics Assessment",
    courseId: courses[0]?.id ? String(courses[0].id) : "1",
    examType: "quiz",
    duration: "45",
    passMarks: "10"
  });

  const [activeTarget, setActiveTarget] = useState<ActiveTarget>({ qIndex: 0, field: "text" });
  const [activePreviews, setActivePreviews] = useState<Record<number, boolean>>({ 0: true, 1: true });
  const [formulaCategory, setFormulaCategory] = useState<"algebra" | "calculus" | "greek" | "trig" | "matrices" | "logic" | "physics" | "urdu">("algebra");
  const [searchQuery, setSearchQuery] = useState("");
  const [isFormulaDrawerOpen, setIsFormulaDrawerOpen] = useState(false);
  // Close drawer on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setIsFormulaDrawerOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Helper to scroll active question card into center view
  const scrollToQuestion = (idx: number) => {
    if (typeof document !== "undefined") {
      const el = document.getElementById(`question-card-${idx}`);
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "center" });
      }
    }
  };


  const [isSubmitting, setIsSubmitting] = useState(false);
  const [customEquation, setCustomEquation] = useState("\\frac{d}{dx} \\left( e^{2x} \\right) = 2e^{2x}");
  const [showEquationModal, setShowEquationModal] = useState(false);
  const [isBankDrawerOpen, setIsBankDrawerOpen] = useState(false);

  // Pre-load from Question Bank if import_qb_id query param is supplied
  useEffect(() => {
    if (typeof window !== "undefined") {
      const urlParams = new URLSearchParams(window.location.search);
      const qbId = urlParams.get("import_qb_id");
      if (qbId) {
        fetch(`/api/admin/question-bank/${qbId}`)
          .then((res) => res.json())
          .then((data: any) => {
            if (data?.question) {
              const q = convertBankItemToExamQuestion(data.question);
              setQuestions([q]);
              if (data.question.course_id) {
                setExamMeta((prev) => ({ ...prev, courseId: String(data.question.course_id) }));
              }
            }
          })
          .catch((err) => console.error("Failed to load pre-selected question:", err));
      }
    }
  }, []);

  const handleImportBankQuestions = (imported: Question[]) => {
    setQuestions((prev) => [...prev, ...imported]);
  };

  // Non-Verbal Shape Library Modal state
  const [shapePickerTarget, setShapePickerTarget] = useState<{
    qIndex: number;
    targetType: "problem" | "option";
    slotIndex: number;
  } | null>(null);
  const [shapeCategory, setShapeCategory] = useState<string>("all");
  const [shapeSearch, setShapeSearch] = useState<string>("");

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

  const handleUploadShapeFile = async (file: File) => {
    if (!file || !shapePickerTarget) return;
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

      const shapeValue = newShape.svg_content 
        ? `data:image/svg+xml;utf8,${encodeURIComponent(newShape.svg_content)}`
        : newShape.file_url;

      // Apply to active slot
      const { qIndex, targetType, slotIndex } = shapePickerTarget;
      if (targetType === "problem") {
        const copy = [...(questions[qIndex].nv_problem_images || [])];
        copy[slotIndex] = shapeValue;
        updateField(qIndex, "nv_problem_images", copy);
      } else {
        const copy = [...(questions[qIndex].nv_options || [])];
        copy[slotIndex] = { ...copy[slotIndex], image_url: shapeValue };
        updateField(qIndex, "nv_options", copy);
      }
      setShapePickerTarget(null);
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


  // Handle direct file upload for PNG, JPG, SVG
  const handleImageUpload = (
    e: React.ChangeEvent<HTMLInputElement>,
    onLoaded: (dataUrl: string) => void
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        onLoaded(reader.result);
      }
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  // Load dedicated Non-Verbal test presets (Series, Analogy, Matrix, Odd One Out)
  const loadNonVerbalPreset = (qIdx: number, presetKey: string) => {
    const preset = NON_VERBAL_PRESETS[presetKey];
    if (!preset) return;
    setQuestions((prev) => {
      const copy = [...prev];
      const cur = copy[qIdx];
      copy[qIdx] = {
        ...cur,
        nv_sub_type: preset.subType,
        text: preset.prompt,
        nv_problem_images: [...preset.problemImages],
        nv_matrix_grid: preset.matrixGrid || "2x2",
        nv_options: preset.options.map(o => ({ ...o })),
        nv_correct: preset.correct,
        explanation: preset.explanation
      };
      return copy;
    });
  };

  // Switch Non-Verbal Sub-type with tailored defaults
  const switchNonVerbalSubType = (qIdx: number, newSubType: "series" | "analogy" | "matrix" | "odd_one_out") => {
    setQuestions((prev) => {
      const copy = [...prev];
      const q = { ...copy[qIdx] };
      q.nv_sub_type = newSubType;

      if (newSubType === "odd_one_out") {
        q.nv_problem_images = [];
        if (!q.text || q.text.includes("Look at the pattern sequence") || q.text.includes("Figure A is to") || q.text.includes("Examine the rules")) {
          q.text = "Four of the five figures share a common geometric property. Select the ONE figure that is the Odd One Out: / ان پانچ اشکال میں سے چار میں یکسانیت ہے۔ مختلف شکل منتخب کریں:";
        }
        // Ensure 5 choices for Odd One Out
        const curOpts = q.nv_options ? [...q.nv_options] : [];
        if (curOpts.length < 5) {
          while (curOpts.length < 5) {
            const ltr = String.fromCharCode(65 + curOpts.length);
            curOpts.push({ id: String(curOpts.length + 1), label: ltr, image_url: "", text: `Figure ${ltr}` });
          }
        }
        q.nv_options = curOpts;
      } else if (newSubType === "analogy") {
        if (!q.nv_problem_images || q.nv_problem_images.length !== 3) {
          q.nv_problem_images = [
            q.nv_problem_images?.[0] || getShapeSvg("nest_circ_in_sq"),
            q.nv_problem_images?.[1] || getShapeSvg("nest_sq_in_circ"),
            q.nv_problem_images?.[2] || getShapeSvg("nest_tri_in_sq")
          ];
        }
        if (!q.text || q.text.includes("Odd One Out") || q.text.includes("Look at the pattern sequence") || q.text.includes("Examine the rules")) {
          q.text = "Figure A is to Figure B as Figure C is to (?): / شکل A کا تعلق B سے ہے وہی تعلق C کا کس شکل سے ہوگا؟";
        }
      } else if (newSubType === "matrix") {
        const grid = q.nv_matrix_grid || "2x2";
        const req = grid === "3x3" ? 8 : 3;
        if (!q.nv_problem_images || q.nv_problem_images.length !== req) {
          if (grid === "3x3") {
            q.nv_problem_images = [
              getShapeSvg("line_1_vert"), getShapeSvg("line_2_vert"), getShapeSvg("line_3_vert"),
              getShapeSvg("clock_12"), getShapeSvg("clock_3"), getShapeSvg("clock_6"),
              getShapeSvg("dots_1_center"), getShapeSvg("dots_2_diag")
            ];
          } else {
            q.nv_problem_images = [
              getShapeSvg("poly_triangle_eq"),
              getShapeSvg("tri_dot_inside"),
              getShapeSvg("poly_square_hollow")
            ];
          }
        }
        if (!q.text || q.text.includes("Odd One Out") || q.text.includes("Figure A is to") || q.text.includes("Look at the pattern sequence")) {
          q.text = "Examine the rules across rows and columns to find the missing matrix cell (?): / میٹرکس کا ربط دیکھ کر نامعلوم شکل کا انتخاب کریں:";
        }
      } else {
        // series
        if (!q.nv_problem_images || q.nv_problem_images.length < 3) {
          q.nv_problem_images = [
            getShapeSvg("quad_tr"),
            getShapeSvg("quad_br"),
            getShapeSvg("quad_bl")
          ];
        }
        if (!q.text || q.text.includes("Odd One Out") || q.text.includes("Figure A is to") || q.text.includes("Examine the rules")) {
          q.text = "Look at the pattern sequence below. Which figure should logically replace the question mark (?) in the series? / پیٹرن کے تسلسل کو دیکھ کر درست شکل کا انتخاب کریں:";
        }
      }

      copy[qIdx] = q;
      return copy;
    });
  };

  // Switch matrix 2x2 vs 3x3 dimension
  const switchMatrixGrid = (qIdx: number, newGrid: "2x2" | "3x3") => {
    setQuestions((prev) => {
      const copy = [...prev];
      const q = { ...copy[qIdx] };
      q.nv_matrix_grid = newGrid;
      const req = newGrid === "3x3" ? 8 : 3;
      const cur = q.nv_problem_images ? [...q.nv_problem_images] : [];
      if (cur.length < req) {
        while (cur.length < req) cur.push("");
      } else if (cur.length > req) {
        cur.length = req;
      }
      q.nv_problem_images = cur;
      copy[qIdx] = q;
      return copy;
    });
  };

  // Switch Verbal Reasoning Sub-type with tailored defaults
  const switchVerbalSubType = (qIdx: number, newSubType: VerbalReasoningSubType) => {
    setQuestions((prev) => {
      const copy = [...prev];
      const q = { ...copy[qIdx] };
      q.vr_sub_type = newSubType;

      if (newSubType === "odd_one_out") {
        q.text = "Four of the following five words share a common relationship. Choose the ONE word that is the odd one out: / ان پانچ الفاظ میں سے چار میں یکسانیت ہے۔ مختلف لفظ منتخب کریں:";
        q.vr_words = ["Copper (تانبا)", "Iron (لوہا)", "Wood (لکڑی)", "Silver (چاندی)", "Gold (سونا)"];
        q.vr_group_category = "Elemental Metals vs Non-Metal (دھاتیں بمقابلہ غیر دھات)";
        q.vr_odd_index = 2;
        q.vr_options = [
          { id: "1", label: "A", text: "Copper (تانبا)" },
          { id: "2", label: "B", text: "Iron (لوہا)" },
          { id: "3", label: "C", text: "Wood (لکڑی) [ODD]" },
          { id: "4", label: "D", text: "Silver (چاندی)" },
          { id: "5", label: "E", text: "Gold (سونا)" }
        ];
        q.vr_correct = "3";
        q.explanation = "Copper, Iron, Silver, and Gold are metallic conductors; Wood is an organic non-metallic insulator.";
      } else if (newSubType === "series") {
        q.text = "Which term should logically replace the question mark (?) in the sequence: / تسلسل میں سوالیہ نشان (?) کی جگہ کونسا لفظ یا عدد آئے گا؟";
        q.vr_series_type = "number";
        q.vr_series_tokens = ["3", "6", "12", "24", "48"];
        q.vr_rule_hint = "Multiply each term by 2 (×2 Progression)";
        q.vr_options = [
          { id: "1", label: "A", text: "96" },
          { id: "2", label: "B", text: "72" },
          { id: "3", label: "C", text: "84" },
          { id: "4", label: "D", text: "60" }
        ];
        q.vr_correct = "1";
        q.explanation = "Each successive term doubles: 3x2=6, 6x2=12, 12x2=24, 24x2=48, 48x2=96.";
      } else if (newSubType === "coding") {
        q.text = "If in a certain code language PEACE is coded as QFBDF, how will SMART be coded? / اگر کسی خفیہ کوڈ میں PEACE کو QFBDF لکھا جائے تو SMART کو کیا لکھا جائے گا؟";
        q.vr_source_word = "PEACE";
        q.vr_coded_word = "QFBDF";
        q.vr_target_word = "SMART";
        q.vr_coding_rule = "Each letter shifts forward by +1 in the alphabet";
        q.vr_options = [
          { id: "1", label: "A", text: "TNBSU" },
          { id: "2", label: "B", text: "TMBRU" },
          { id: "3", label: "C", text: "RLZQS" },
          { id: "4", label: "D", text: "TOCTU" }
        ];
        q.vr_correct = "1";
        q.explanation = "Shift forward by 1: S->T, M->N, A->B, R->S, T->U = TNBSU.";
      } else if (newSubType === "blood_relations") {
        q.text = "Analyze the kinship clues and determine the logical family relationship: / خاندانی رشتے کا منطقی تجزیہ کر کے درست تعلق کا تعین کریں:";
        q.vr_premise = "A boy points to a girl in a family photograph and provides relationship clues:";
        q.vr_clues = [
          "Clue 1: 'My father\\'s only son' = The boy himself",
          "Clue 2: 'The daughter of the boy himself' = His own daughter"
        ];
        q.vr_question_prompt = "Who is the girl in the photograph to the boy? / تصویر میں موجود لڑکی کا لڑکے سے کیا رشتہ ہے؟";
        q.vr_options = [
          { id: "1", label: "A", text: "Daughter (بیٹی)" },
          { id: "2", label: "B", text: "Sister (بہن)" },
          { id: "3", label: "C", text: "Niece (بھانجی / بھتیجی)" },
          { id: "4", label: "D", text: "Mother (ماں)" }
        ];
        q.vr_correct = "1";
        q.explanation = "The father's only son is the boy himself. Therefore, her daughter is his own daughter.";
      } else {
        // analogy
        q.text = "Choose the word that completes the relationship: / وہ لفظ منتخب کریں جو اس تشبیہ کو مکمل کرے:";
        q.vr_pair1_left = "Doctor";
        q.vr_pair1_right = "Hospital";
        q.vr_pair2_left = "Teacher";
        q.vr_relationship_type = "Worker & Workplace (پیشہ اور کام کی جگہ)";
        q.vr_options = [
          { id: "1", label: "A", text: "School (اسکول)" },
          { id: "2", label: "B", text: "Chalk (چاک)" },
          { id: "3", label: "C", text: "Student (طالب علم)" },
          { id: "4", label: "D", text: "Book (کتاب)" }
        ];
        q.vr_correct = "1";
        q.explanation = "Doctor works in Hospital (Worker:Workplace). Teacher works in School.";
      }

      copy[qIdx] = q;
      return copy;
    });
  };

  // Load a Verbal Preset directly into a question
  const loadVerbalPreset = (qIdx: number, preset: VerbalReasoningPreset) => {
    setQuestions((prev) => {
      const copy = [...prev];
      const q = { ...copy[qIdx] };
      q.vr_sub_type = preset.subType;
      q.text = preset.prompt;
      q.vr_pair1_left = preset.pair1_left || "";
      q.vr_pair1_right = preset.pair1_right || "";
      q.vr_pair2_left = preset.pair2_left || "";
      q.vr_relationship_type = preset.relationship_type || "";
      q.vr_series_type = preset.series_type || "number";
      q.vr_series_tokens = preset.series_tokens ? [...preset.series_tokens] : [];
      q.vr_rule_hint = preset.rule_hint || "";
      q.vr_words = preset.words ? [...preset.words] : [];
      q.vr_group_category = preset.group_category || "";
      q.vr_odd_index = preset.odd_index ?? 0;
      q.vr_source_word = preset.source_word || "";
      q.vr_coded_word = preset.coded_word || "";
      q.vr_target_word = preset.target_word || "";
      q.vr_coding_rule = preset.coding_rule || "";
      q.vr_premise = preset.premise || "";
      q.vr_clues = preset.clues ? [...preset.clues] : [];
      q.vr_question_prompt = preset.question_prompt || "";
      q.vr_options = preset.options.map((o) => ({ ...o }));
      q.vr_correct = preset.correct;
      q.explanation = preset.explanation;

      copy[qIdx] = q;
      return copy;
    });
  };

  // Load KaTeX CDN dynamically for the editor preview
  useEffect(() => {
    if (!document.getElementById("katex-css")) {
      const link = document.createElement("link");
      link.id = "katex-css";
      link.rel = "stylesheet";
      link.href = "https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/katex.min.css";
      document.head.appendChild(link);
    }

    const loadKatexScripts = () => {
      if (!document.getElementById("katex-js")) {
        const script = document.createElement("script");
        script.id = "katex-js";
        script.src = "https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/katex.min.js";
        script.onload = () => {
          const autoRender = document.createElement("script");
          autoRender.id = "katex-autorender";
          autoRender.src = "https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/contrib/auto-render.min.js";
          autoRender.onload = () => triggerMathRender();
          document.head.appendChild(autoRender);
        };
        document.head.appendChild(script);
      } else {
        triggerMathRender();
      }
    };

    loadKatexScripts();
  }, []);

  // Re-run math rendering whenever questions change or target changes
  useEffect(() => {
    triggerMathRender();
  }, [questions, activePreviews, customEquation, activeTarget, isFormulaDrawerOpen]);

  const triggerMathRender = () => {
    if (typeof window !== "undefined" && (window as any).renderMathInElement) {
      setTimeout(() => {
        const previewBoxes = document.querySelectorAll(".render-math-target");
        previewBoxes.forEach((el) => {
          (window as any).renderMathInElement(el, {
            delimiters: [
              { left: "$$", right: "$$", display: true },
              { left: "$", right: "$", display: false },
              { left: "\\(", right: "\\)", display: false },
              { left: "\\[", right: "\\]", display: true }
            ],
            throwOnError: false
          });
        });
      }, 40);
    }
  };


  // Helper to read any target field value dynamically across all 8 question types
  const getFieldVal = (q: Question | undefined, field: string): string => {
    if (!q) return "";
    if (field.startsWith("match_left_")) {
      const pIdx = Number(field.replace("match_left_", ""));
      return q.matching_pairs?.[pIdx]?.left || "";
    }
    if (field.startsWith("match_right_")) {
      const pIdx = Number(field.replace("match_right_", ""));
      return q.matching_pairs?.[pIdx]?.right || "";
    }
    return String((q as any)[field] || "");
  };

  // Helper to update any field value dynamically across all 8 question types
  const updateFieldVal = (qIndex: number, field: string, val: any) => {
    setQuestions((prev) => {
      const copy = [...prev];
      const q = { ...copy[qIndex] };
      if (field.startsWith("match_left_")) {
        const pIdx = Number(field.replace("match_left_", ""));
        const pairs = [...(q.matching_pairs || [])];
        if (pairs[pIdx]) {
          pairs[pIdx] = { ...pairs[pIdx], left: val };
          q.matching_pairs = pairs;
        }
      } else if (field.startsWith("match_right_")) {
        const pIdx = Number(field.replace("match_right_", ""));
        const pairs = [...(q.matching_pairs || [])];
        if (pairs[pIdx]) {
          pairs[pIdx] = { ...pairs[pIdx], right: val };
          q.matching_pairs = pairs;
        }
      } else {
        (q as any)[field] = val;
      }
      if (q.bank_question_id && !field.startsWith("sync_to_bank") && !field.startsWith("save_to_bank")) {
        q.is_modified_from_source = true;
      }
      copy[qIndex] = q;
      return copy;
    });
  };

  // Helper to format markdown and LaTeX text for live preview using direct synchronous KaTeX
  const formatMarkdownPreview = (text: string) => {
    if (!text) return "";
    let s = text;

    // 1. Render display math $$...$$
    s = s.replace(/\$\$([\s\S]*?)\$\$/g, (_, math) => {
      try {
        return `<div class="my-1.5 overflow-x-auto py-1 text-center font-serif" dir="ltr">${katex.renderToString(math.trim(), { displayMode: true, throwOnError: false })}</div>`;
      } catch {
        return `<code class="bg-red-50 text-red-600 px-1 py-0.5 rounded text-xs" dir="ltr">${math}</code>`;
      }
    });

    // 2. Render inline math $...$
    s = s.replace(/\$([^\$\n]+?)\$/g, (_, math) => {
      try {
        return `<span class="inline-block font-serif mx-0.5" dir="ltr">${katex.renderToString(math.trim(), { displayMode: false, throwOnError: false })}</span>`;
      } catch {
        return `<code class="bg-red-50 text-red-600 px-1 py-0.5 rounded text-xs" dir="ltr">${math}</code>`;
      }
    });

    // 3. Render raw LaTeX without $ if commands like \frac or \sqrt are detected
    if (/^\s*\\[a-zA-Z]/.test(s) && !s.includes("<span class=\"katex\">")) {
      try {
        s = `<span class="inline-block font-serif mx-0.5" dir="ltr">${katex.renderToString(s.trim(), { displayMode: false, throwOnError: false })}</span>`;
      } catch {}
    }

    // 4. Standard markdown formatting and embedded images
    return s
      .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
      .replace(/\*(.*?)\*/g, "<em>$1</em>")
      .replace(/<u>(.*?)<\/u>/g, "<u>$1</u>")
      .replace(/~~(.*?)~~/g, "<del>$1</del>")
      .replace(/`([^`]+)`/g, "<code class='bg-slate-100 text-blue-700 px-1 py-0.5 rounded font-mono text-xs'>$1</code>")
      .replace(/!\[(.*?)\]\((.*?)\)/g, "<img src='$2' alt='$1' class='max-h-48 max-w-full rounded-lg border border-slate-200 inline-block my-1 object-contain bg-white p-1' />")
      .replace(/\n/g, "<br/>");
  };

  // Insert snippet intelligently into active target field across any question type
  const insertSnippet = (snippet: string) => {
    const { qIndex, field } = activeTarget;
    if (qIndex >= questions.length) return;

    const currentVal = getFieldVal(questions[qIndex], field).trim();

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

    updateFieldVal(qIndex, field, newVal);
    triggerMathRender();
  };

  // Add question (safe against React synthetic event arguments)
  const addQuestion = (typeOrEvent?: any) => {
    const type: QuestionType = (typeof typeOrEvent === "string" && QUESTION_TYPES.some((t) => t.id === typeOrEvent))
      ? (typeOrEvent as QuestionType)
      : "mcq";
    const newIdx = questions.length;
    const newQ = createDefaultQuestion(type);
    setQuestions((prev) => [...prev, newQ]);
    setActivePreviews((prev) => ({ ...prev, [newIdx]: true }));
    setActiveTarget({ qIndex: newIdx, field: "text" });
    scrollToQuestion(newIdx);
  };

  // Duplicate question
  const duplicateQuestion = (idx: number) => {
    const qToCopy = questions[idx];
    const duplicated: Question = {
      ...qToCopy,
      id: "q-" + Date.now(),
      text: qToCopy.text + " (Copy)"
    };
    const updated = [...questions];
    updated.splice(idx + 1, 0, duplicated);
    setQuestions(updated);
    setActivePreviews((prev) => ({ ...prev, [idx + 1]: true }));
  };

  // Move Question Up
  const moveQuestionUp = (idx: number) => {
    if (idx === 0) return;
    const updated = [...questions];
    const temp = updated[idx];
    updated[idx] = updated[idx - 1];
    updated[idx - 1] = temp;
    setQuestions(updated);
  };

  // Move Question Down
  const moveQuestionDown = (idx: number) => {
    if (idx === questions.length - 1) return;
    const updated = [...questions];
    const temp = updated[idx];
    updated[idx] = updated[idx + 1];
    updated[idx + 1] = temp;
    setQuestions(updated);
  };

  // Remove question
  const removeQuestion = (idx: number) => {
    if (questions.length <= 1) {
      alert("Exam must have at least one question.");
      return;
    }
    const updated = questions.filter((_, i) => i !== idx);
    setQuestions(updated);
    if (activeTarget.qIndex >= updated.length) {
      setActiveTarget({ qIndex: Math.max(0, updated.length - 1), field: "text" });
    }
  };

  // Update specific question field
  const updateField = (idx: number, field: keyof Question, value: any) => {
    setQuestions((prev) => {
      const copy = [...prev];
      const q = { ...copy[idx], [field]: value };
      if (q.bank_question_id && field !== "sync_to_bank" && field !== "save_to_bank" && field !== "is_modified_from_source") {
        q.is_modified_from_source = true;
      }
      copy[idx] = q;
      return copy;
    });
  };

  // Switch question type safely preserving values or applying appropriate defaults
  const switchQuestionType = (idx: number, newType: QuestionType) => {
    const defaults = createDefaultQuestion(newType);
    setQuestions((prev) => {
      const copy = [...prev];
      const current = copy[idx];
      const isDefaultStatement = QUESTION_TYPES.some((t) => createDefaultQuestion(t.id).text === current.text);

      copy[idx] = {
        ...current,
        type: newType,
        text: current.text && !isDefaultStatement ? current.text : defaults.text,
        nv_sub_type: current.nv_sub_type || defaults.nv_sub_type,
        nv_problem_images: (current.nv_problem_images && current.nv_problem_images.length > 0) ? current.nv_problem_images : defaults.nv_problem_images,
        nv_options: (current.nv_options && current.nv_options.length > 0) ? current.nv_options : defaults.nv_options,
        nv_correct: current.nv_correct || defaults.nv_correct,
        matching_pairs: (current.matching_pairs && current.matching_pairs.length > 0) ? current.matching_pairs : defaults.matching_pairs,
        num_exact: current.num_exact || defaults.num_exact,
        blank_answer: current.blank_answer || defaults.blank_answer,
        short_keywords: current.short_keywords || defaults.short_keywords,
        short_model_answer: current.short_model_answer || defaults.short_model_answer,
        long_model_answer: current.long_model_answer || defaults.long_model_answer,
      };
      return copy;
    });

    if (newType === "mcq" || newType === "multi_select") {
      setActiveTarget({ qIndex: idx, field: "opt1" });
    } else if (newType === "fill_blank") {
      setActiveTarget({ qIndex: idx, field: "blank_answer" });
    } else if (newType === "short_answer") {
      setActiveTarget({ qIndex: idx, field: "short_model_answer" });
    } else if (newType === "long_answer") {
      setActiveTarget({ qIndex: idx, field: "long_model_answer" });
    } else if (newType === "column_mapping") {
      setActiveTarget({ qIndex: idx, field: "match_left_0" });
    } else {
      setActiveTarget({ qIndex: idx, field: "text" });
    }
  };

  // Load complete pre-configured assessment template (e.g. Cadet Non-Verbal, Cadet Verbal, MDCAT, etc.)
  const loadExamTemplate = (templateType: "cadet_non_verbal" | "cadet_verbal" | "mdcat_science") => {
    if (templateType === "cadet_non_verbal") {
      const cadetCourse = courses.find((c) => c.code.toLowerCase().includes("cad") || c.title.toLowerCase().includes("cadet")) || courses[0];
      setExamMeta({
        title: "Cadet College & Armed Forces Non-Verbal Intelligence Assessment",
        courseId: cadetCourse ? String(cadetCourse.id) : (courses[0] ? String(courses[0].id) : "1"),
        examType: "quiz",
        duration: "30",
        passMarks: "20"
      });
      // 1. Series Question
      const p1 = NON_VERBAL_PRESETS.series_quadrant;
      const q1: Question = {
        ...createDefaultQuestion("non_verbal"),
        id: "q-nv-series",
        nv_sub_type: "series",
        text: p1.prompt,
        nv_problem_images: [...p1.problemImages],
        nv_options: p1.options.map(o => ({ ...o })),
        nv_correct: p1.correct,
        marks: 10,
        explanation: p1.explanation
      };
      // 2. Analogy Question
      const p2 = NON_VERBAL_PRESETS.analogy_nested;
      const q2: Question = {
        ...createDefaultQuestion("non_verbal"),
        id: "q-nv-analogy",
        nv_sub_type: "analogy",
        text: p2.prompt,
        nv_problem_images: [...p2.problemImages],
        nv_options: p2.options.map(o => ({ ...o })),
        nv_correct: p2.correct,
        marks: 10,
        explanation: p2.explanation
      };
      // 3. Matrix Question
      const p3 = NON_VERBAL_PRESETS.matrix_2x2_dot;
      const q3: Question = {
        ...createDefaultQuestion("non_verbal"),
        id: "q-nv-matrix",
        nv_sub_type: "matrix",
        nv_matrix_grid: "2x2",
        text: p3.prompt,
        nv_problem_images: [...p3.problemImages],
        nv_options: p3.options.map(o => ({ ...o })),
        nv_correct: p3.correct,
        marks: 10,
        explanation: p3.explanation
      };
      // 4. Odd One Out Question
      const p4 = NON_VERBAL_PRESETS.odd_one_out_quads;
      const q4: Question = {
        ...createDefaultQuestion("non_verbal"),
        id: "q-nv-odd",
        nv_sub_type: "odd_one_out",
        text: p4.prompt,
        nv_problem_images: [],
        nv_options: p4.options.map(o => ({ ...o })),
        nv_correct: p4.correct,
        marks: 10,
        explanation: p4.explanation
      };
      setQuestions([q1, q2, q3, q4]);
      setActivePreviews({ 0: true, 1: true, 2: true, 3: true });
    } else if (templateType === "cadet_verbal") {
      const cadetCourse = courses.find((c) => c.code.toLowerCase().includes("cad") || c.title.toLowerCase().includes("cadet")) || courses[0];
      setExamMeta({
        title: "Cadet College & Armed Forces Verbal Reasoning Assessment",
        courseId: cadetCourse ? String(cadetCourse.id) : (courses[0] ? String(courses[0].id) : "1"),
        examType: "quiz",
        duration: "30",
        passMarks: "25"
      });
      const p1 = VERBAL_REASONING_PRESETS.analogy_worker_place;
      const q1: Question = {
        ...createDefaultQuestion("verbal_reasoning"),
        id: "q-vr-analogy",
        vr_sub_type: "analogy",
        text: p1.prompt,
        vr_pair1_left: p1.pair1_left,
        vr_pair1_right: p1.pair1_right,
        vr_pair2_left: p1.pair2_left,
        vr_relationship_type: p1.relationship_type,
        vr_options: p1.options.map(o => ({ ...o })),
        vr_correct: p1.correct,
        marks: 10,
        explanation: p1.explanation
      };
      const p2 = VERBAL_REASONING_PRESETS.series_number_double;
      const q2: Question = {
        ...createDefaultQuestion("verbal_reasoning"),
        id: "q-vr-series",
        vr_sub_type: "series",
        text: p2.prompt,
        vr_series_tokens: [...(p2.series_tokens || [])],
        vr_rule_hint: p2.rule_hint,
        vr_options: p2.options.map(o => ({ ...o })),
        vr_correct: p2.correct,
        marks: 10,
        explanation: p2.explanation
      };
      const p3 = VERBAL_REASONING_PRESETS.odd_words_metals;
      const q3: Question = {
        ...createDefaultQuestion("verbal_reasoning"),
        id: "q-vr-odd",
        vr_sub_type: "odd_one_out",
        text: p3.prompt,
        vr_words: [...(p3.words || [])],
        vr_group_category: p3.group_category,
        vr_odd_index: p3.odd_index,
        vr_options: p3.options.map(o => ({ ...o })),
        vr_correct: p3.correct,
        marks: 10,
        explanation: p3.explanation
      };
      const p4 = VERBAL_REASONING_PRESETS.coding_caesar_plus1;
      const q4: Question = {
        ...createDefaultQuestion("verbal_reasoning"),
        id: "q-vr-coding",
        vr_sub_type: "coding",
        text: p4.prompt,
        vr_source_word: p4.source_word,
        vr_coded_word: p4.coded_word,
        vr_target_word: p4.target_word,
        vr_coding_rule: p4.coding_rule,
        vr_options: p4.options.map(o => ({ ...o })),
        vr_correct: p4.correct,
        marks: 10,
        explanation: p4.explanation
      };
      setQuestions([q1, q2, q3, q4]);
      setActivePreviews({ 0: true, 1: true, 2: true, 3: true });
    } else if (templateType === "mdcat_science") {
      const medCourse = courses.find((c) => c.code.toLowerCase().includes("med") || c.title.toLowerCase().includes("mdcat")) || courses[0];
      setExamMeta({
        title: "MDCAT Conceptual Biology & Chemistry Mock Exam",
        courseId: medCourse ? String(medCourse.id) : (courses[0] ? String(courses[0].id) : "1"),
        examType: "practice_mock",
        duration: "45",
        passMarks: "20"
      });
      setQuestions([createDefaultQuestion("mcq"), createDefaultQuestion("multi_select"), createDefaultQuestion("fill_blank")]);
    }
  };

  // Calculate Total Marks
  const totalCalculatedMarks = questions.reduce((sum, q) => sum + (Number(q.marks) || 0), 0);

  // Submit Handler
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!examMeta.title.trim()) {
      alert("Please provide an Exam Title.");
      return;
    }

    for (let i = 0; i < questions.length; i++) {
      const q = questions[i];
      if (!q.text.trim()) {
        alert(`Question #${i + 1} statement cannot be empty.`);
        return;
      }
      if (q.type === "mcq" || q.type === "multi_select") {
        if (!q.opt1.trim() || !q.opt2.trim() || !q.opt3.trim() || !q.opt4.trim()) {
          alert(`All 4 options must be filled for Question #${i + 1}.`);
          return;
        }
      } else if (q.type === "fill_blank") {
        if (!q.blank_answer.trim()) {
          alert(`Please provide the correct blank answer for Question #${i + 1}.`);
          return;
        }
      } else if (q.type === "column_mapping") {
        if (!q.matching_pairs || q.matching_pairs.length < 2) {
          alert(`Please provide at least 2 matching pairs for Question #${i + 1}.`);
          return;
        }
      } else if (q.type === "numerical") {
        if (!q.num_exact) {
          alert(`Please provide the exact numerical answer for Question #${i + 1}.`);
          return;
        }
      } else if (q.type === "non_verbal") {
        if (!q.nv_options || q.nv_options.length < 2) {
          alert(`Please provide at least 2 answer figure choices for Question #${i + 1}.`);
          return;
        }
      } else if (q.type === "verbal_reasoning") {
        if (!q.vr_options || q.vr_options.length < 2) {
          alert(`Please provide at least 2 answer choices for Question #${i + 1}.`);
          return;
        }
      }
    }

    setIsSubmitting(true);

    try {
      const payload = {
        title: examMeta.title,
        course_id: Number(examMeta.courseId),
        exam_type: examMeta.examType,
        duration: Number(examMeta.duration) || 45,
        total_marks: totalCalculatedMarks,
        pass_marks: Number(examMeta.passMarks) || 10,
        questions: questions.map((q) => ({
          type: q.type || "mcq",
          text: q.text,
          marks: Number(q.marks) || 10,
          explanation: q.explanation || "",
          opt1: q.opt1,
          opt2: q.opt2,
          opt3: q.opt3,
          opt4: q.opt4,
          correct: q.correct,
          correct_multi: q.correct_multi,
          correct_tf: q.correct_tf,
          blank_answer: q.blank_answer,
          blank_alternatives: q.blank_alternatives,
          blank_placeholder: q.blank_placeholder,
          blank_case_sensitive: q.blank_case_sensitive,
          matching_pairs: q.matching_pairs,
          num_exact: q.num_exact,
          num_tolerance: q.num_tolerance,
          num_unit: q.num_unit,
          short_model_answer: q.short_model_answer,
          short_keywords: q.short_keywords,
          long_model_answer: q.long_model_answer,
          long_rubric: q.long_rubric,
          long_min_words: q.long_min_words,
          nv_sub_type: q.nv_sub_type || "series",
          nv_problem_images: q.nv_problem_images || [],
          nv_options: q.nv_options || [],
          nv_correct: q.nv_correct || "1",
          nv_matrix_grid: q.nv_matrix_grid || "2x2",
          vr_sub_type: q.vr_sub_type || "analogy",
          vr_pair1_left: q.vr_pair1_left || "",
          vr_pair1_right: q.vr_pair1_right || "",
          vr_pair2_left: q.vr_pair2_left || "",
          vr_relationship_type: q.vr_relationship_type || "",
          vr_series_type: q.vr_series_type || "number",
          vr_series_tokens: q.vr_series_tokens || [],
          vr_rule_hint: q.vr_rule_hint || "",
          vr_words: q.vr_words || [],
          vr_group_category: q.vr_group_category || "",
          vr_odd_index: q.vr_odd_index,
          vr_source_word: q.vr_source_word || "",
          vr_coded_word: q.vr_coded_word || "",
          vr_target_word: q.vr_target_word || "",
          vr_coding_rule: q.vr_coding_rule || "",
          vr_premise: q.vr_premise || "",
          vr_clues: q.vr_clues || [],
          vr_question_prompt: q.vr_question_prompt || "",
          vr_options: q.vr_options || [],
          vr_correct: q.vr_correct || "1",
          bank_question_id: q.bank_question_id || null,
          is_modified_from_source: !!q.is_modified_from_source,
          sync_to_bank: !!q.sync_to_bank,
          save_to_bank: !!q.save_to_bank,
          topic: q.topic || "General",
          difficulty: q.difficulty || "medium"
        }))
      };

      const res = await fetch("/api/admin/exams", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(errorText || "Failed to create exam");
      }

      window.location.href = "/admin/exams";
    } catch (err: any) {
      alert("Error saving exam: " + err.message);
      setIsSubmitting(false);
    }
  };

  // Dynamic target badge description across all 8 question types
  const targetLabel = () => {
    const qNum = activeTarget.qIndex + 1;
    const q = questions[activeTarget.qIndex];
    if (activeTarget.field === "text") return `Question #${qNum} - Statement`;
    if (activeTarget.field === "explanation") return `Question #${qNum} - Explanation`;
    if (activeTarget.field === "opt1") return `Question #${qNum} - Option A`;
    if (activeTarget.field === "opt2") return `Question #${qNum} - Option B`;
    if (activeTarget.field === "opt3") return `Question #${qNum} - Option C`;
    if (activeTarget.field === "opt4") return `Question #${qNum} - Option D`;
    if (activeTarget.field === "blank_answer") return `Question #${qNum} - Target Blank`;
    if (activeTarget.field === "short_model_answer") return `Question #${qNum} - Model Answer`;
    if (activeTarget.field === "long_model_answer") return `Question #${qNum} - Model Derivation`;
    if (activeTarget.field.startsWith("match_left_")) {
      const pIdx = Number(activeTarget.field.replace("match_left_", "")) + 1;
      return `Question #${qNum} - Col A Item ${pIdx}`;
    }
    if (activeTarget.field.startsWith("match_right_")) {
      const pIdx = Number(activeTarget.field.replace("match_right_", "")) + 1;
      return `Question #${qNum} - Col B Item ${pIdx}`;
    }
    return `Question #${qNum}`;
  };

  return (
    <form onSubmit={handleSubmit} className={`space-y-8 pb-20 transition-[margin] duration-300 ease-in-out ${isFormulaDrawerOpen ? "lg:mr-[530px]" : "mr-0"}`}>

      {/* 1. Exam Metadata Configurations Card */}
      <div className="bg-white p-7 rounded-3xl border border-slate-200/80 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <h2 className="text-base font-bold text-slate-900 font-heading flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-blue-600" />
            <span>1. Exam Header & Assessment Configurations</span>
          </h2>
          <span className="text-xs font-mono font-bold text-slate-500 bg-slate-100 px-2.5 py-1 rounded-lg">
            Calculated Total: {totalCalculatedMarks} Marks
          </span>
        </div>

        {/* Quick Assessment Templates Bar */}
        <div className="flex flex-wrap items-center gap-2 pt-1 border-b border-slate-100 pb-3">
          <span className="text-[11px] font-black text-slate-500 uppercase tracking-wide flex items-center gap-1">
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            Quick Assessment Presets:
          </span>
          <button
            type="button"
            onClick={() => loadExamTemplate("cadet_non_verbal")}
            className="text-xs font-bold px-3 py-1.5 rounded-xl bg-gradient-to-r from-amber-50 to-orange-50 hover:from-amber-100 hover:to-orange-100 text-amber-900 border border-amber-300 transition flex items-center gap-1.5 shadow-2xs"
          >
            <span>🧩 Cadet / ISSB Non-Verbal Test</span>
          </button>
          <button
            type="button"
            onClick={() => loadExamTemplate("cadet_verbal")}
            className="text-xs font-bold px-3 py-1.5 rounded-xl bg-gradient-to-r from-teal-50 to-emerald-50 hover:from-teal-100 hover:to-emerald-100 text-teal-900 border border-teal-300 transition flex items-center gap-1.5 shadow-2xs"
          >
            <span>🧠 Cadet / ISSB Verbal Reasoning Test</span>
          </button>
          <button
            type="button"
            onClick={() => loadExamTemplate("mdcat_science")}
            className="text-xs font-bold px-3 py-1.5 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-900 border border-blue-200 transition flex items-center gap-1.5 shadow-2xs"
          >
            <span>🔬 MDCAT Science Mock</span>
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">Exam Title *</label>
            <input
              type="text"
              required
              value={examMeta.title}
              onChange={(e) => setExamMeta({ ...examMeta, title: e.target.value })}
              placeholder="e.g. Calculus & Analytical Geometry Mock"
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">Course Program *</label>
            <select
              value={examMeta.courseId}
              onChange={(e) => setExamMeta({ ...examMeta, courseId: e.target.value })}
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm bg-white font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {courses.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.title} ({c.code})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">Exam Type</label>
            <select
              value={examMeta.examType}
              onChange={(e) => setExamMeta({ ...examMeta, examType: e.target.value })}
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="quiz">Timed Quiz</option>
              <option value="midterm">Midterm Examination</option>
              <option value="final">Final Term Exam</option>
              <option value="practice_mock">Practice Mock Assessment</option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">Duration (Minutes)</label>
              <input
                type="number"
                value={examMeta.duration}
                onChange={(e) => setExamMeta({ ...examMeta, duration: e.target.value })}
                className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm font-mono"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">Passing Marks</label>
              <input
                type="number"
                value={examMeta.passMarks}
                onChange={(e) => setExamMeta({ ...examMeta, passMarks: e.target.value })}
                className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm font-mono"
              />
            </div>
          </div>
        </div>
      </div>

      {/* 2. DYNAMIC QUESTIONS LIST */}
      <div className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-xl font-black text-slate-900 font-heading flex items-center gap-2">
              <ListOrdered className="w-5 h-5 text-blue-600" />
              <span>Examination Questions ({questions.length} Items)</span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Click any question format button inside each card to change its format (Non-Verbal, MCQ, True/False, etc.)
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              type="button"
              onClick={() => setIsBankDrawerOpen(true)}
              className="flex items-center gap-1.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-bold text-xs px-3.5 py-2.5 rounded-xl shadow-md transition active:scale-95"
            >
              <Database className="w-4 h-4" />
              <span>+ Import from Question Bank</span>
            </button>

            <button
              type="button"
              onClick={() => addQuestion("non_verbal")}
              className="flex items-center gap-1.5 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 text-white font-bold text-xs px-3.5 py-2.5 rounded-xl shadow-md transition active:scale-95"
            >
              <Layers className="w-4 h-4" />
              <span>+ Add Non-Verbal (Diagram / IQ)</span>
            </button>

            <button
              type="button"
              onClick={() => addQuestion("mcq")}
              className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs px-3.5 py-2.5 rounded-xl shadow-sm transition active:scale-95"
            >
              <Plus className="w-4 h-4" />
              <span>+ Add Question (MCQ)</span>
            </button>
          </div>
        </div>

        {questions.map((q, idx) => {
          const isTargetQuestion = activeTarget.qIndex === idx;

          return (
            <div
              key={q.id}
              id={`question-card-${idx}`}
              className={`bg-white rounded-3xl border transition-all duration-300 shadow-sm p-7 space-y-5 ${
                isTargetQuestion && isFormulaDrawerOpen
                  ? "border-blue-500 ring-4 ring-blue-500/15 shadow-xl shadow-blue-500/5 bg-gradient-to-b from-blue-50/20 via-white to-white"
                  : isTargetQuestion
                  ? "border-blue-400 ring-2 ring-blue-500/10"
                  : "border-slate-200/80 hover:border-slate-300"
              }`}
            >
              {/* Question Header Bar */}
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2.5 flex-wrap">
                  <span className="text-xs font-black text-blue-600 uppercase tracking-wider bg-blue-50 px-3 py-1 rounded-lg">
                    Question #{idx + 1}
                  </span>

                  <div className="flex items-center gap-1.5 text-xs text-slate-600">
                    <span className="font-semibold">Marks:</span>
                    <input
                      type="number"
                      value={q.marks}
                      onChange={(e) => updateField(idx, "marks", Number(e.target.value) || 0)}
                      className="w-16 px-2 py-1 rounded-lg border border-slate-200 text-xs font-mono font-bold text-center"
                    />
                  </div>

                  {/* Language / Script Mode Toggle (Urdu, Arabic, English) */}
                  <div className="flex items-center gap-1 bg-slate-100 p-0.5 rounded-lg border border-slate-200">
                    <button
                      type="button"
                      onClick={() => {
                        const modes: ("auto" | "urdu" | "arabic" | "ltr")[] = ["auto", "urdu", "arabic", "ltr"];
                        const current = q.dir || "auto";
                        const currentIndex = modes.indexOf(current as any);
                        const nextMode = modes[(currentIndex + 1) % modes.length];
                        updateField(idx, "dir", nextMode);
                      }}
                      className={`px-2.5 py-1 rounded-md text-[11px] font-bold transition flex items-center gap-1.5 ${
                        q.dir === "urdu" || (q.dir !== "ltr" && q.dir !== "arabic" && isUrduText(q.text))
                          ? "bg-emerald-600 text-white shadow-2xs font-urdu"
                          : q.dir === "arabic" || (q.dir !== "ltr" && isArabicText(q.text))
                          ? "bg-amber-600 text-white shadow-2xs font-arabic"
                          : q.dir === "ltr"
                          ? "bg-white text-slate-700 shadow-2xs font-sans"
                          : "text-slate-600 hover:text-slate-900 font-sans"
                      }`}
                      title="Switch Language: Auto-detect / اردو (Jameel Noori Nastaleeq) / العربية (Noto Naskh Arabic) / English (LTR)"
                    >
                      <Languages className="w-3.5 h-3.5" />
                      <span>{getScriptInfo(q.text, q.dir).label}</span>
                    </button>
                  </div>
                </div>

                <div className="flex items-center gap-1.5">
                  <div className="flex items-center gap-2">
                    {isTargetQuestion && isFormulaDrawerOpen && (
                      <span className="text-[10px] font-black tracking-wider uppercase text-blue-700 bg-blue-100/90 border border-blue-200 px-2.5 py-1 rounded-lg flex items-center gap-1.5 shadow-2xs">
                        <span className="w-2 h-2 rounded-full bg-blue-600 animate-ping"></span>
                        <span>Active in Studio</span>
                      </span>
                    )}
                    <button
                      type="button"
                      onClick={() => {
                        setActiveTarget({ qIndex: idx, field: "text" });
                        setIsFormulaDrawerOpen(true);
                        scrollToQuestion(idx);
                      }}
                      className={`text-xs font-bold flex items-center gap-1.5 px-3 py-1.5 rounded-lg border transition shadow-2xs ${
                        isTargetQuestion && isFormulaDrawerOpen
                          ? "bg-blue-600 text-white border-blue-600 shadow-sm ring-2 ring-blue-400/40"
                          : "bg-blue-50 hover:bg-blue-100 border-blue-200 text-blue-700"
                      }`}
                      title="Open Formula & Symbols Studio for this Question"
                    >
                      <Calculator className="w-3.5 h-3.5" />
                      <span>{isTargetQuestion && isFormulaDrawerOpen ? "Editing in Studio" : "Insert Formulas"}</span>
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setActivePreviews({ ...activePreviews, [idx]: !activePreviews[idx] });
                      triggerMathRender();
                    }}
                    className={`text-xs font-bold flex items-center gap-1 px-2.5 py-1.5 rounded-lg border transition ${activePreviews[idx] ? "bg-blue-50 border-blue-200 text-blue-700" : "bg-slate-50 border-slate-200 text-slate-600"}`}
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>{activePreviews[idx] ? "Live Preview ON" : "Live Preview OFF"}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => moveQuestionUp(idx)}
                    disabled={idx === 0}
                    className="p-1.5 text-slate-400 hover:text-slate-800 disabled:opacity-30 rounded-lg hover:bg-slate-100"
                    title="Move Up"
                  >
                    <ArrowUp className="w-4 h-4" />
                  </button>

                  <button
                    type="button"
                    onClick={() => moveQuestionDown(idx)}
                    disabled={idx === questions.length - 1}
                    className="p-1.5 text-slate-400 hover:text-slate-800 disabled:opacity-30 rounded-lg hover:bg-slate-100"
                    title="Move Down"
                  >
                    <ArrowDown className="w-4 h-4" />
                  </button>

                  <button
                    type="button"
                    onClick={() => duplicateQuestion(idx)}
                    className="p-1.5 text-slate-400 hover:text-blue-600 rounded-lg hover:bg-blue-50"
                    title="Duplicate Question"
                  >
                    <Copy className="w-4 h-4" />
                  </button>

                  {questions.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeQuestion(idx)}
                      className="p-1.5 text-slate-400 hover:text-red-600 rounded-lg hover:bg-red-50"
                      title="Delete Question"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>

              {/* Question Bank Link & Alteration Provision Bar */}
              {q.bank_question_id ? (
                <div className={`p-3.5 rounded-2xl border transition flex flex-col md:flex-row md:items-center justify-between gap-3 ${
                  q.is_modified_from_source 
                    ? "bg-amber-50/80 border-amber-300 text-amber-950" 
                    : "bg-indigo-50/50 border-indigo-200/80 text-indigo-950"
                }`}>
                  <div className="flex items-center gap-2.5 flex-wrap">
                    <span className="font-mono text-xs font-black bg-white px-2.5 py-1 rounded-lg border border-indigo-200 text-indigo-700 flex items-center gap-1.5 shadow-2xs">
                      <Database className="w-3.5 h-3.5 text-indigo-600" />
                      <span>Bank Source #QB-{q.bank_question_id}</span>
                    </span>

                    {q.is_modified_from_source ? (
                      <span className="bg-amber-200 text-amber-950 text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md flex items-center gap-1">
                        <Sparkles className="w-3 h-3 text-amber-700" />
                        <span>Altered for this Paper</span>
                      </span>
                    ) : (
                      <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md flex items-center gap-1">
                        <Check className="w-3 h-3 text-emerald-600" />
                        <span>Original Question Bank Content</span>
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2 flex-wrap">
                    {q.is_modified_from_source && (
                      <div className="flex items-center gap-1.5 bg-white px-3 py-1.5 rounded-xl border border-amber-300 text-xs shadow-2xs">
                        <span className="text-[11px] font-bold text-slate-500">Alteration Provision:</span>
                        <label className="flex items-center gap-1 text-[11px] font-semibold text-slate-700 cursor-pointer hover:text-slate-900">
                          <input
                            type="radio"
                            name={`alter_scope_${idx}`}
                            checked={!q.sync_to_bank}
                            onChange={() => updateField(idx, "sync_to_bank", false)}
                            className="w-3.5 h-3.5 text-amber-600 focus:ring-amber-500"
                          />
                          <span>This Exam Only (Preserve Source)</span>
                        </label>
                        <span className="text-slate-300">|</span>
                        <label className="flex items-center gap-1 text-[11px] font-bold text-indigo-700 cursor-pointer hover:text-indigo-900">
                          <input
                            type="radio"
                            name={`alter_scope_${idx}`}
                            checked={!!q.sync_to_bank}
                            onChange={() => updateField(idx, "sync_to_bank", true)}
                            className="w-3.5 h-3.5 text-indigo-600 focus:ring-indigo-500"
                          />
                          <span>Update Question Bank Source</span>
                        </label>
                      </div>
                    )}

                    <button
                      type="button"
                      onClick={() => {
                        updateField(idx, "bank_question_id", null);
                        updateField(idx, "is_modified_from_source", false);
                        updateField(idx, "sync_to_bank", false);
                      }}
                      className="text-[11px] font-semibold text-slate-500 hover:text-slate-800 hover:bg-white/80 px-2.5 py-1 rounded-lg border border-transparent hover:border-slate-200 transition"
                      title="Detach from Question Bank and convert into independent paper question"
                    >
                      Detach Link
                    </button>
                  </div>
                </div>
              ) : (
                <div className="p-3 rounded-2xl bg-slate-50/90 border border-slate-200/90 flex flex-wrap items-center justify-between gap-3">
                  <label className="flex items-center gap-2 text-xs font-bold text-slate-700 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={!!q.save_to_bank}
                      onChange={(e) => updateField(idx, "save_to_bank", e.target.checked)}
                      className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                    />
                    <Database className="w-3.5 h-3.5 text-indigo-600" />
                    <span>Save newly authored question to Question Bank for future exams</span>
                  </label>

                  {q.save_to_bank && (
                    <div className="flex items-center gap-2.5 flex-wrap text-xs">
                      <div className="flex items-center gap-1.5">
                        <span className="text-[11px] font-bold text-slate-500 uppercase">Topic:</span>
                        <input
                          type="text"
                          value={q.topic || "General"}
                          onChange={(e) => updateField(idx, "topic", e.target.value)}
                          placeholder="e.g. Calculus"
                          className="px-2.5 py-1 bg-white border border-slate-200 rounded-lg text-xs w-32 font-medium"
                        />
                      </div>

                      <div className="flex items-center gap-1.5">
                        <span className="text-[11px] font-bold text-slate-500 uppercase">Difficulty:</span>
                        <select
                          value={q.difficulty || "medium"}
                          onChange={(e) => updateField(idx, "difficulty", e.target.value as any)}
                          className="px-2.5 py-1 bg-white border border-slate-200 rounded-lg text-xs font-medium"
                        >
                          <option value="easy">Easy</option>
                          <option value="medium">Medium</option>
                          <option value="hard">Hard</option>
                        </select>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Question Type Selector Bar - PROMINENTLY AT TOP OF QUESTION CARD */}
              <div className="space-y-2 p-3.5 rounded-2xl bg-slate-50/90 border border-slate-200/90 shadow-2xs">
                <div className="flex flex-wrap items-center justify-between gap-1">
                  <label className="text-xs font-black uppercase text-slate-800 tracking-wider flex items-center gap-1.5">
                    <SlidersHorizontal className="w-3.5 h-3.5 text-blue-600" />
                    <span>Question Format:</span>
                    <span className="text-blue-600 normal-case font-bold ml-1">
                      ({QUESTION_TYPES.find((t) => t.id === (q.type || "mcq"))?.label})
                    </span>
                  </label>
                  <span className="text-[11px] font-bold text-slate-500">
                    {QUESTION_TYPES.find((t) => t.id === (q.type || "mcq"))?.desc}
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 lg:grid-cols-10 gap-1.5">
                  {QUESTION_TYPES.map((t) => {
                    const Icon = t.icon;
                    const isSelected = (q.type || "mcq") === t.id;

                    return (
                      <button
                        key={t.id}
                        type="button"
                        onClick={() => switchQuestionType(idx, t.id)}
                        className={`flex flex-col items-center justify-center p-2 rounded-xl border transition-all duration-150 text-center ${
                          isSelected
                            ? t.id === "non_verbal"
                              ? "bg-amber-600 text-white border-amber-600 shadow-md ring-2 ring-amber-500/30 font-black scale-102"
                              : t.id === "verbal_reasoning"
                              ? "bg-teal-600 text-white border-teal-600 shadow-md ring-2 ring-teal-500/30 font-black scale-102"
                              : "bg-blue-600 text-white border-blue-600 shadow-md ring-2 ring-blue-500/20 font-black scale-102"
                            : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50 hover:text-blue-600 hover:border-blue-300 font-semibold"
                        }`}
                        title={t.desc}
                      >
                        <Icon className="w-4 h-4 mb-1" />
                        <span className="text-[10.5px] leading-tight truncate w-full">{t.label}</span>
                        <span className={`text-[8.5px] px-1.5 py-0.2 rounded-full mt-1 font-mono uppercase font-bold ${
                          isSelected ? "bg-white/25 text-white" : "bg-slate-100 text-slate-500"
                        }`}>
                          {t.badge}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Question Text Area */}
              {(() => {
                const script = getScriptInfo(q.text, q.dir);
                return (
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span>Question Statement (Markdown & LaTeX supported) *</span>
                        {script.isRtl && (
                          <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full ${
                            script.fontClass.includes("font-urdu")
                              ? "bg-emerald-100 text-emerald-800 font-urdu"
                              : "bg-amber-100 text-amber-800 font-arabic"
                          }`}>
                            {script.badge}
                          </span>
                        )}
                      </div>
                      {activeTarget.qIndex === idx && activeTarget.field === "text" && (
                        <span className="text-[10px] text-blue-600 font-bold bg-blue-50 px-2 py-0.5 rounded">Active Target</span>
                      )}
                    </label>
                    <textarea
                      rows={3}
                      required
                      dir={script.isRtl ? "rtl" : "ltr"}
                      value={q.text}
                      onFocus={() => setActiveTarget({ qIndex: idx, field: "text" })}
                      onChange={(e) => updateField(idx, "text", e.target.value)}
                      placeholder="Type question in English, Urdu (Jameel Nastaleeq), or Arabic (Cairo/Amiri) (e.g. اگر $ax^2+bx+c=0$ ہو تو دو درجی کلیہ کیا ہوگا؟)..."
                      className={`w-full px-4 py-3 rounded-2xl border text-sm focus:outline-none transition leading-relaxed ${
                        script.isRtl ? `${script.fontClass} text-lg` : "font-sans"
                      } ${
                        activeTarget.qIndex === idx && activeTarget.field === "text" && isFormulaDrawerOpen
                          ? "border-blue-500 ring-2 ring-blue-500/25 bg-blue-50/15"
                          : "border-slate-200 focus:ring-2 focus:ring-blue-500"
                      }`}
                    />
                  </div>
                );
              })()}

              {/* Live KaTeX Render Preview Box */}
              {activePreviews[idx] && q.text && (() => {
                const script = getScriptInfo(q.text, q.dir);
                return (
                  <div className="bg-slate-50 border border-slate-200/90 rounded-2xl p-4.5 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-black uppercase text-blue-600 tracking-wider flex items-center gap-1">
                        <Sparkles className="w-3 h-3" />
                        Live Formatted Math Preview (Student View):
                      </span>
                      <span className="text-[10px] text-slate-400 font-mono">
                        {script.isRtl ? `${script.badge} + LTR Math` : "KaTeX + Markdown"}
                      </span>
                    </div>
                    <div
                      dir={script.isRtl ? "rtl" : "ltr"}
                      className={`render-math-target text-slate-900 leading-relaxed bg-white p-3.5 rounded-xl border border-slate-200/60 shadow-2xs ${
                        script.isRtl ? `${script.fontClass} text-lg` : "text-sm font-medium"
                      }`}
                      dangerouslySetInnerHTML={{ __html: formatMarkdownPreview(q.text) }}
                    />
                  </div>
                );
              })()}

              {/* Dynamic Type-Specific Form Editor */}
              {/* 1. Multiple Choice (MCQ - Single Select) */}
              {(q.type === "mcq" || !q.type) && (
                <div className="space-y-3 pt-2">
                  <div className="flex items-center justify-between">
                    <label className="block text-xs font-bold text-slate-700 uppercase flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-blue-600" />
                      <span>Multiple-Choice Options (Math supported between $ and $) *</span>
                    </label>
                    <span className="text-[11px] text-slate-400 font-medium">Select one correct radio option</span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                    {[
                      { key: "opt1", num: "1", label: "Option A", badgeBg: "bg-blue-100 text-blue-700" },
                      { key: "opt2", num: "2", label: "Option B", badgeBg: "bg-indigo-100 text-indigo-700" },
                      { key: "opt3", num: "3", label: "Option C", badgeBg: "bg-purple-100 text-purple-700" },
                      { key: "opt4", num: "4", label: "Option D", badgeBg: "bg-cyan-100 text-cyan-700" },
                    ].map((opt) => (
                      <div
                        key={opt.key}
                        className={`p-3.5 rounded-2xl border transition ${
                          activeTarget.qIndex === idx && activeTarget.field === opt.key && isFormulaDrawerOpen
                            ? "border-blue-500 ring-2 ring-blue-500/25 bg-blue-50/30"
                            : q.correct === opt.num
                            ? "border-emerald-500 bg-emerald-50/20"
                            : "border-slate-200 bg-white"
                        }`}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <span className={`w-5 h-5 rounded-md font-bold text-xs flex items-center justify-center ${opt.badgeBg}`}>
                              {opt.label.slice(-1)}
                            </span>
                            <span className="text-xs font-bold text-slate-700">{opt.label}</span>
                          </div>
                          <label className="flex items-center gap-1.5 text-[11px] font-bold text-emerald-700 cursor-pointer hover:underline">
                            <input
                              type="radio"
                              name={`correct_${q.id}`}
                              checked={q.correct === opt.num}
                              onChange={() => updateField(idx, "correct", opt.num)}
                              className="text-emerald-600 focus:ring-emerald-500"
                            />
                            <span>Correct Answer</span>
                          </label>
                        </div>
                        <input
                          type="text"
                          required
                          dir="auto"
                          value={(q as any)[opt.key]}
                          onFocus={() => setActiveTarget({ qIndex: idx, field: opt.key })}
                          onChange={(e) => updateField(idx, opt.key as any, e.target.value)}
                          placeholder={`e.g. Value for ${opt.label}...`}
                          className={`w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-medium focus:outline-none focus:ring-1 focus:ring-blue-500 ${
                            isRTLText((q as any)[opt.key]) ? (isUrduText((q as any)[opt.key]) ? "font-urdu text-right text-base" : "font-arabic text-right text-sm font-semibold") : ""
                          }`}
                        />
                        {(q as any)[opt.key] && ((q as any)[opt.key].includes("$") || /\\[a-zA-Z]+/.test((q as any)[opt.key])) && (
                          <div
                            dir="auto"
                            className={`render-math-target text-xs text-slate-700 font-semibold mt-1.5 px-2 py-1 bg-slate-50 rounded-lg border border-slate-100 ${
                              isRTLText((q as any)[opt.key]) ? (isUrduText((q as any)[opt.key]) ? "font-urdu text-right text-base" : "font-arabic text-right text-sm font-semibold") : ""
                            }`}
                            dangerouslySetInnerHTML={{ __html: formatMarkdownPreview((q as any)[opt.key]) }}
                          />
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 2. Multi-Select (Multiple Correct Answers) */}
              {q.type === "multi_select" && (
                <div className="space-y-3 pt-2">
                  <div className="flex items-center justify-between">
                    <label className="block text-xs font-bold text-purple-700 uppercase flex items-center gap-1.5">
                      <CheckSquare className="w-3.5 h-3.5 text-purple-600" />
                      <span>Multi-Select Options (Check all correct statements) *</span>
                    </label>
                    <span className="text-[11px] text-purple-600 font-bold bg-purple-50 px-2 py-0.5 rounded-full">
                      {(q.correct_multi || []).length} Correct Selected
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                    {[
                      { key: "opt1", num: "1", label: "Option A" },
                      { key: "opt2", num: "2", label: "Option B" },
                      { key: "opt3", num: "3", label: "Option C" },
                      { key: "opt4", num: "4", label: "Option D" },
                    ].map((opt) => {
                      const isChecked = (q.correct_multi || []).includes(opt.num);
                      return (
                        <div
                          key={opt.key}
                          className={`p-3.5 rounded-2xl border transition ${
                            activeTarget.qIndex === idx && activeTarget.field === opt.key && isFormulaDrawerOpen
                              ? "border-purple-500 ring-2 ring-purple-500/25 bg-purple-50/30"
                              : isChecked
                              ? "border-purple-500 bg-purple-50/20"
                              : "border-slate-200 bg-white"
                          }`}
                        >
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-xs font-bold text-slate-700">{opt.label}</span>
                            <label className="flex items-center gap-1.5 text-[11px] font-bold text-purple-700 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={isChecked}
                                onChange={(e) => {
                                  const currentList = q.correct_multi || [];
                                  const updated = e.target.checked
                                    ? [...currentList, opt.num]
                                    : currentList.filter((n) => n !== opt.num);
                                  updateField(idx, "correct_multi", updated);
                                }}
                                className="text-purple-600 rounded focus:ring-purple-500"
                              />
                              <span>Correct Choice</span>
                            </label>
                          </div>
                          <input
                            type="text"
                            required
                            dir="auto"
                            value={(q as any)[opt.key]}
                            onFocus={() => setActiveTarget({ qIndex: idx, field: opt.key })}
                            onChange={(e) => updateField(idx, opt.key as any, e.target.value)}
                            placeholder={`Value for ${opt.label}...`}
                            className={`w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-medium focus:outline-none focus:ring-1 focus:ring-purple-500 ${
                              isRTLText((q as any)[opt.key]) ? (isUrduText((q as any)[opt.key]) ? "font-urdu text-right text-base" : "font-arabic text-right text-sm font-semibold") : ""
                            }`}
                          />
                          {(q as any)[opt.key] && ((q as any)[opt.key].includes("$") || /\\[a-zA-Z]+/.test((q as any)[opt.key])) && (
                            <div
                              dir="auto"
                              className={`render-math-target text-xs text-slate-700 font-semibold mt-1.5 px-2 py-1 bg-slate-50 rounded-lg border border-slate-100 ${
                                isRTLText((q as any)[opt.key]) ? (isUrduText((q as any)[opt.key]) ? "font-urdu text-right text-base" : "font-arabic text-right text-sm font-semibold") : ""
                              }`}
                              dangerouslySetInnerHTML={{ __html: formatMarkdownPreview((q as any)[opt.key]) }}
                            />
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* 3. True / False */}
              {q.type === "true_false" && (
                <div className="space-y-3 pt-2">
                  <label className="block text-xs font-bold text-emerald-800 uppercase flex items-center gap-1.5">
                    <HelpCircle className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Designate Correct Fact Assertion *</span>
                  </label>

                  <div className="grid grid-cols-2 gap-4">
                    <button
                      type="button"
                      onClick={() => updateField(idx, "correct_tf", "true")}
                      className={`p-5 rounded-2xl border-2 flex items-center justify-center gap-3 transition-all ${
                        (q.correct_tf || "true") === "true"
                          ? "border-emerald-500 bg-emerald-50 text-emerald-800 shadow-md ring-2 ring-emerald-500/20 font-black scale-101"
                          : "border-slate-200 bg-slate-50 text-slate-500 hover:bg-white"
                      }`}
                    >
                      <CheckCircle2 className="w-6 h-6 text-emerald-600" />
                      <div className="text-left">
                        <span className="block text-base font-black">TRUE</span>
                        <span className="text-[11px] font-medium opacity-80">Statement is factually correct</span>
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => updateField(idx, "correct_tf", "false")}
                      className={`p-5 rounded-2xl border-2 flex items-center justify-center gap-3 transition-all ${
                        q.correct_tf === "false"
                          ? "border-rose-500 bg-rose-50 text-rose-800 shadow-md ring-2 ring-rose-500/20 font-black scale-101"
                          : "border-slate-200 bg-slate-50 text-slate-500 hover:bg-white"
                      }`}
                    >
                      <XCircle className="w-6 h-6 text-rose-600" />
                      <div className="text-left">
                        <span className="block text-base font-black">FALSE</span>
                        <span className="text-[11px] font-medium opacity-80">Statement is factually incorrect</span>
                      </div>
                    </button>
                  </div>
                </div>
              )}

              {/* 4. Fill in the Blanks */}
              {q.type === "fill_blank" && (
                <div className="space-y-4 pt-2 bg-amber-50/30 p-5 rounded-2xl border border-amber-200/60">
                  <div className="flex items-center gap-2 text-amber-800 text-xs font-bold">
                    <Edit3 className="w-4 h-4 text-amber-600" />
                    <span>Fill in the Blank Configuration</span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">
                        Primary Target Answer *
                      </label>
                      <input
                        type="text"
                        required
                        dir="auto"
                        value={q.blank_answer || ""}
                        onFocus={() => setActiveTarget({ qIndex: idx, field: "blank_answer" })}
                        onChange={(e) => updateField(idx, "blank_answer", e.target.value)}
                        placeholder="e.g. mitochondria, $100^\circ C$ or مائٹوکونڈریا"
                        className={`w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-800 focus:outline-none focus:ring-1 focus:ring-amber-500 bg-white ${
                          isRTLText(q.blank_answer) ? (isUrduText(q.blank_answer) ? "font-urdu text-right text-base" : "font-arabic text-right text-sm") : ""
                        }`}
                      />
                      {q.blank_answer && (
                        <div
                          dir="auto"
                          className={`render-math-target text-xs text-amber-900 font-semibold mt-1 px-2 py-0.5 bg-amber-100/50 rounded ${
                            isRTLText(q.blank_answer) ? (isUrduText(q.blank_answer) ? "font-urdu text-right text-base" : "font-arabic text-right text-sm") : ""
                          }`}
                          dangerouslySetInnerHTML={{ __html: formatMarkdownPreview(q.blank_answer) }}
                        />
                      )}
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">
                        Acceptable Alternative Synonyms (Pipe-separated | )
                      </label>
                      <input
                        type="text"
                        dir="auto"
                        value={q.blank_alternatives || ""}
                        onChange={(e) => updateField(idx, "blank_alternatives", e.target.value)}
                        placeholder="e.g. powerhouse | cell powerhouse or طاقت کا مرکز | پاور ہاؤس"
                        className={`w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-medium focus:outline-none focus:ring-1 focus:ring-amber-500 bg-white ${
                          isRTLText(q.blank_alternatives) ? (isUrduText(q.blank_alternatives) ? "font-urdu text-right text-base" : "font-arabic text-right text-sm") : ""
                        }`}
                      />
                      <span className="text-[10px] text-slate-400 mt-1 block">
                        Students entering any of these synonyms will be awarded full marks.
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-1 border-t border-amber-200/50 text-xs">
                    <label className="flex items-center gap-2 cursor-pointer font-bold text-slate-700">
                      <input
                        type="checkbox"
                        checked={!!q.blank_case_sensitive}
                        onChange={(e) => updateField(idx, "blank_case_sensitive", e.target.checked)}
                        className="text-amber-600 rounded"
                      />
                      <span>Strict Case-Sensitive Evaluation</span>
                    </label>
                    <span className="text-[11px] text-amber-700 font-mono">Tip: Use [blank] in statement above</span>
                  </div>
                </div>
              )}

              {/* 5. Column Mapping / Matching Pairs */}
              {q.type === "column_mapping" && (
                <div className="space-y-4 pt-2 bg-indigo-50/20 p-5 rounded-2xl border border-indigo-200/60">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-indigo-900 text-xs font-bold">
                      <ArrowRightLeft className="w-4 h-4 text-indigo-600" />
                      <span>Column A to Column B Matching Pairs *</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        const pairs = [...(q.matching_pairs || [])];
                        pairs.push({ left: `Item ${pairs.length + 1}`, right: `Match ${pairs.length + 1}` });
                        updateField(idx, "matching_pairs", pairs);
                      }}
                      className="flex items-center gap-1 text-xs font-bold text-indigo-700 hover:text-indigo-900 bg-white px-2.5 py-1 rounded-lg border border-indigo-200 shadow-2xs"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Add Pair Row</span>
                    </button>
                  </div>

                  <div className="space-y-2.5">
                    {(q.matching_pairs || []).map((pair, pIdx) => (
                      <div key={pIdx} className="grid grid-cols-12 gap-2 items-center bg-white p-3 rounded-xl border border-indigo-100 shadow-2xs">
                        <span className="col-span-1 text-xs font-black text-indigo-600 text-center font-mono">
                          #{pIdx + 1}
                        </span>

                        <div className="col-span-5">
                          <label className="block text-[10px] font-bold text-slate-500 uppercase mb-0.5">
                            Column A Item
                          </label>
                          <input
                            type="text"
                            required
                            dir="auto"
                            value={pair.left}
                            onFocus={() => setActiveTarget({ qIndex: idx, field: `match_left_${pIdx}` })}
                            onChange={(e) => updateFieldVal(idx, `match_left_${pIdx}`, e.target.value)}
                            placeholder="e.g. Newton's 2nd Law or نیوٹن کا دوسرا قانون"
                            className={`w-full px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-indigo-500 ${
                              isRTLText(pair.left) ? (isUrduText(pair.left) ? "font-urdu text-right text-base" : "font-arabic text-right text-sm") : ""
                            }`}
                          />
                        </div>

                        <div className="col-span-1 text-center font-bold text-slate-400 text-sm">
                          &harr;
                        </div>

                        <div className="col-span-4">
                          <label className="block text-[10px] font-bold text-slate-500 uppercase mb-0.5">
                            Column B (Matching Answer)
                          </label>
                          <input
                            type="text"
                            required
                            dir="auto"
                            value={pair.right}
                            onFocus={() => setActiveTarget({ qIndex: idx, field: `match_right_${pIdx}` })}
                            onChange={(e) => updateFieldVal(idx, `match_right_${pIdx}`, e.target.value)}
                            placeholder="e.g. $F = ma$"
                            className={`w-full px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-indigo-500 ${
                              isRTLText(pair.right) ? (isUrduText(pair.right) ? "font-urdu text-right text-base" : "font-arabic text-right text-sm") : ""
                            }`}
                          />
                        </div>

                        <div className="col-span-1 text-right">
                          {(q.matching_pairs || []).length > 2 && (
                            <button
                              type="button"
                              onClick={() => {
                                const pairs = (q.matching_pairs || []).filter((_, i) => i !== pIdx);
                                updateField(idx, "matching_pairs", pairs);
                              }}
                              className="p-1.5 text-slate-400 hover:text-red-600 rounded-lg hover:bg-red-50"
                              title="Delete Pair"
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
              {q.type === "numerical" && (
                <div className="space-y-4 pt-2 bg-cyan-50/20 p-5 rounded-2xl border border-cyan-200/60">
                  <div className="flex items-center gap-2 text-cyan-900 text-xs font-bold">
                    <Hash className="w-4 h-4 text-cyan-600" />
                    <span>Scientific Calculation & Tolerance Bounds</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">
                        Exact Target Value *
                      </label>
                      <input
                        type="number"
                        step="any"
                        required
                        value={q.num_exact || ""}
                        onChange={(e) => updateField(idx, "num_exact", e.target.value)}
                        placeholder="e.g. 9.8"
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 font-mono font-bold text-xs bg-white focus:outline-none focus:ring-1 focus:ring-cyan-500"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">
                        Acceptable Error Margin (±)
                      </label>
                      <input
                        type="number"
                        step="any"
                        value={q.num_tolerance || ""}
                        onChange={(e) => updateField(idx, "num_tolerance", e.target.value)}
                        placeholder="e.g. 0.1"
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 font-mono font-bold text-xs bg-white focus:outline-none focus:ring-1 focus:ring-cyan-500"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">
                        Physical Unit of Measure
                      </label>
                      <input
                        type="text"
                        value={q.num_unit || ""}
                        onChange={(e) => updateField(idx, "num_unit", e.target.value)}
                        placeholder="e.g. m/s², Joules, N, Hz"
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold bg-white focus:outline-none focus:ring-1 focus:ring-cyan-500"
                      />
                    </div>
                  </div>

                  {q.num_exact && (
                    <div className="text-xs text-cyan-800 bg-white p-2.5 rounded-xl border border-cyan-100 font-mono">
                      Valid Accepted Student Range: [
                      {Number(q.num_exact) - (Number(q.num_tolerance) || 0)} ... {Number(q.num_exact) + (Number(q.num_tolerance) || 0)}
                      ] {q.num_unit || ""}
                    </div>
                  )}
                </div>
              )}

              {/* 7. Short Answer Question */}
              {q.type === "short_answer" && (
                <div className="space-y-4 pt-2 bg-rose-50/20 p-5 rounded-2xl border border-rose-200/60">
                  <div className="flex items-center gap-2 text-rose-900 text-xs font-bold">
                    <FileText className="w-4 h-4 text-rose-600" />
                    <span>Short Conceptual Question & Auto-Grading Keywords</span>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">
                      Teacher Model Answer / Reference Solution *
                    </label>
                    <textarea
                      rows={2}
                      required
                      dir="auto"
                      value={q.short_model_answer || ""}
                      onFocus={() => setActiveTarget({ qIndex: idx, field: "short_model_answer" })}
                      onChange={(e) => updateField(idx, "short_model_answer", e.target.value)}
                      placeholder="e.g. Photosynthesis converts sunlight, water, and CO2 into glucose or اردو میں ماڈل جواب لکھیں۔"
                      className={`w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-medium focus:outline-none focus:ring-1 focus:ring-rose-500 bg-white leading-relaxed ${
                        isRTLText(q.short_model_answer) ? (isUrduText(q.short_model_answer) ? "font-urdu text-right text-base" : "font-arabic text-right text-sm") : ""
                      }`}
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">
                      Auto-Grading Keywords (Comma-separated)
                    </label>
                    <input
                      type="text"
                      dir="auto"
                      value={q.short_keywords || ""}
                      onChange={(e) => updateField(idx, "short_keywords", e.target.value)}
                      placeholder="e.g. sunlight, water, glucose OR سورج کی روشنی, پانی, گلوکوز"
                      className={`w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-rose-500 bg-white ${
                        isRTLText(q.short_keywords) ? (isUrduText(q.short_keywords) ? "font-urdu text-right text-base" : "font-arabic text-right text-sm") : ""
                      }`}
                    />
                    <span className="text-[10px] text-slate-400 mt-1 block">
                      Student submissions containing these keywords receive automated credit before faculty review.
                    </span>
                  </div>
                </div>
              )}

              {/* 8. Long Essay Question / Derivations */}
              {q.type === "long_answer" && (
                <div className="space-y-4 pt-2 bg-violet-50/20 p-5 rounded-2xl border border-violet-200/60">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-violet-900 text-xs font-bold">
                      <BookOpen className="w-4 h-4 text-violet-600" />
                      <span>Long Descriptive Essay & Theoretical Derivation</span>
                    </div>
                    <div className="flex items-center gap-1 text-xs">
                      <span className="text-slate-500 font-bold">Min Words:</span>
                      <input
                        type="number"
                        value={q.long_min_words || 50}
                        onChange={(e) => updateField(idx, "long_min_words", Number(e.target.value) || 50)}
                        className="w-16 px-2 py-0.5 rounded border border-slate-200 text-xs font-mono font-bold text-center"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">
                      Complete Model Solution & Mathematical Derivations *
                    </label>
                    <textarea
                      rows={3}
                      required
                      dir="auto"
                      value={q.long_model_answer || ""}
                      onFocus={() => setActiveTarget({ qIndex: idx, field: "long_model_answer" })}
                      onChange={(e) => updateField(idx, "long_model_answer", e.target.value)}
                      placeholder="Provide step-by-step mathematical proof, definitions, or تفصیلی اردو ثبوت و وضاحت..."
                      className={`w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-sans focus:outline-none focus:ring-1 focus:ring-violet-500 bg-white leading-relaxed ${
                        isRTLText(q.long_model_answer) ? (isUrduText(q.long_model_answer) ? "font-urdu text-right text-base" : "font-arabic text-right text-sm") : ""
                      }`}
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">
                      Teacher Grading Rubric & Assessment Criteria
                    </label>
                    <input
                      type="text"
                      dir="auto"
                      value={q.long_rubric || ""}
                      onChange={(e) => updateField(idx, "long_rubric", e.target.value)}
                      placeholder="e.g. Diagram (2m), Derivation Steps (5m), Final Formula (3m)"
                      className={`w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-violet-500 bg-white ${
                        isRTLText(q.long_rubric) ? (isUrduText(q.long_rubric) ? "font-urdu text-right text-base" : "font-arabic text-right text-sm") : ""
                      }`}
                    />
                  </div>
                </div>
              )}

              {/* 9. Non-Verbal Intelligence (Visual Shape & Pattern Reasoning) */}
              {/* 9. Non-Verbal Intelligence (Visual Shape & Pattern Reasoning) */}
              {q.type === "non_verbal" && (
                <div className="space-y-5 pt-2 bg-gradient-to-br from-amber-50/60 via-orange-50/30 to-amber-50/20 p-5 rounded-2xl border border-amber-200/90 shadow-2xs">
                  {/* Top Bar: Sub-Type Switcher */}
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-2 text-amber-950 text-xs font-black">
                      <div className="w-7 h-7 rounded-lg bg-amber-500 text-white flex items-center justify-center shadow-xs">
                        <Layers className="w-4 h-4" />
                      </div>
                      <div>
                        <span className="block font-black text-sm">Non-Verbal Intelligence Assessment</span>
                        <span className="text-[11px] font-medium text-amber-800">Cadet College, Armed Forces (ISSB/PAF/Army/Navy) & IQ Testing</span>
                      </div>
                    </div>

                    {/* Sub-type switcher tabs */}
                    <div className="flex items-center gap-1 bg-white p-1 rounded-xl border border-amber-200 text-xs font-bold shadow-2xs">
                      {[
                        { id: "series" as const, label: "Series (تسلسل)", icon: "➡️" },
                        { id: "analogy" as const, label: "Analogy (تشبیہ)", icon: "🔄" },
                        { id: "matrix" as const, label: "Matrix (میٹرکس)", icon: "▦" },
                        { id: "odd_one_out" as const, label: "Odd One Out (مختلف)", icon: "⭐" },
                      ].map((st) => {
                        const isActive = (q.nv_sub_type || "series") === st.id;
                        return (
                          <button
                            key={st.id}
                            type="button"
                            onClick={() => switchNonVerbalSubType(idx, st.id)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
                              isActive
                                ? "bg-amber-600 text-white shadow-xs"
                                : "text-slate-600 hover:bg-slate-50"
                            }`}
                          >
                            <span>{st.icon}</span>
                            <span>{st.label}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Informational Sub-Type Banner & 1-Click Demos */}
                  <div className={`p-4 rounded-xl border flex flex-wrap items-center justify-between gap-3 ${
                    q.nv_sub_type === "analogy"
                      ? "bg-indigo-50/70 border-indigo-200 text-indigo-950"
                      : q.nv_sub_type === "matrix"
                      ? "bg-teal-50/70 border-teal-200 text-teal-950"
                      : q.nv_sub_type === "odd_one_out"
                      ? "bg-rose-50/70 border-rose-200 text-rose-950"
                      : "bg-amber-50/70 border-amber-200 text-amber-950"
                  }`}>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-black uppercase tracking-wider px-2 py-0.5 rounded-md bg-white/80 border border-current shadow-2xs">
                          {q.nv_sub_type === "analogy" && "Analogy: A is to B as C is to ?"}
                          {q.nv_sub_type === "matrix" && `Matrix Grid: ${(q.nv_matrix_grid || "2x2").toUpperCase()} Pattern Canvas`}
                          {q.nv_sub_type === "odd_one_out" && "Classification: 5 Figures (Find The Odd One)"}
                          {(!q.nv_sub_type || q.nv_sub_type === "series") && "Sequential Progress Strip: 1 ➔ 2 ➔ 3 ➔ ?"}
                        </span>
                      </div>
                      <p className="text-xs font-medium text-slate-700 leading-relaxed">
                        {q.nv_sub_type === "analogy" && "Pair 1 (Figures A & B) sets a transformation rule. The candidate applies this same rule to Figure C to identify Figure D."}
                        {q.nv_sub_type === "matrix" && "A 2D visual grid where patterns evolve systematically across rows and columns. The bottom-right cell is missing."}
                        {q.nv_sub_type === "odd_one_out" && "No problem strip is used. Five candidate figures (A, B, C, D, E) are shown directly. Four follow a common rule; one figure is the odd one out."}
                        {(!q.nv_sub_type || q.nv_sub_type === "series") && "Figures follow a continuous step-by-step transformation sequence from left to right. Candidate selects the next figure."}
                      </p>
                    </div>

                    {/* 1-Click Intelligence Presets specific to active sub-type */}
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-[10px] font-black uppercase tracking-wider text-slate-500">Quick Demos:</span>
                      {(!q.nv_sub_type || q.nv_sub_type === "series") && (
                        <>
                          <button
                            type="button"
                            onClick={() => loadNonVerbalPreset(idx, "series_quadrant")}
                            className="text-[11px] font-bold text-amber-900 bg-white hover:bg-amber-100/60 px-2.5 py-1 rounded-lg border border-amber-300 shadow-2xs transition"
                          >
                            ✨ Shaded Quadrant (90° CW)
                          </button>
                          <button
                            type="button"
                            onClick={() => loadNonVerbalPreset(idx, "series_arrow")}
                            className="text-[11px] font-bold text-blue-900 bg-white hover:bg-blue-100/60 px-2.5 py-1 rounded-lg border border-blue-300 shadow-2xs transition"
                          >
                            ✨ Arrow Rotation (45° CW)
                          </button>
                          <button
                            type="button"
                            onClick={() => loadNonVerbalPreset(idx, "series_dots")}
                            className="text-[11px] font-bold text-purple-900 bg-white hover:bg-purple-100/60 px-2.5 py-1 rounded-lg border border-purple-300 shadow-2xs transition"
                          >
                            ✨ Increasing Dots (1➔4)
                          </button>
                        </>
                      )}
                      {q.nv_sub_type === "analogy" && (
                        <>
                          <button
                            type="button"
                            onClick={() => loadNonVerbalPreset(idx, "analogy_nested")}
                            className="text-[11px] font-bold text-indigo-900 bg-white hover:bg-indigo-100/60 px-2.5 py-1 rounded-lg border border-indigo-300 shadow-2xs transition"
                          >
                            ✨ Outer-Inner Shape Inversion
                          </button>
                          <button
                            type="button"
                            onClick={() => loadNonVerbalPreset(idx, "analogy_shading")}
                            className="text-[11px] font-bold text-purple-900 bg-white hover:bg-purple-100/60 px-2.5 py-1 rounded-lg border border-purple-300 shadow-2xs transition"
                          >
                            ✨ Hollow-to-Solid Shading
                          </button>
                        </>
                      )}
                      {q.nv_sub_type === "matrix" && (
                        <>
                          <button
                            type="button"
                            onClick={() => loadNonVerbalPreset(idx, "matrix_2x2_dot")}
                            className="text-[11px] font-bold text-teal-900 bg-white hover:bg-teal-100/60 px-2.5 py-1 rounded-lg border border-teal-300 shadow-2xs transition"
                          >
                            ✨ 2×2 Shape & Dot Matrix
                          </button>
                          <button
                            type="button"
                            onClick={() => loadNonVerbalPreset(idx, "matrix_3x3_lines")}
                            className="text-[11px] font-bold text-blue-900 bg-white hover:bg-blue-100/60 px-2.5 py-1 rounded-lg border border-blue-300 shadow-2xs transition"
                          >
                            ✨ 3×3 Line & Clock Matrix
                          </button>
                        </>
                      )}
                      {q.nv_sub_type === "odd_one_out" && (
                        <>
                          <button
                            type="button"
                            onClick={() => loadNonVerbalPreset(idx, "odd_one_out_quads")}
                            className="text-[11px] font-bold text-rose-900 bg-white hover:bg-rose-100/60 px-2.5 py-1 rounded-lg border border-rose-300 shadow-2xs transition"
                          >
                            ✨ 4 Quadrilaterals vs 1 Triangle
                          </button>
                          <button
                            type="button"
                            onClick={() => loadNonVerbalPreset(idx, "odd_one_out_dots")}
                            className="text-[11px] font-bold text-amber-900 bg-white hover:bg-amber-100/60 px-2.5 py-1 rounded-lg border border-amber-300 shadow-2xs transition"
                          >
                            ✨ 4 Inside Dots vs 1 Outside Dot
                          </button>
                        </>
                      )}
                    </div>
                  </div>

                  {/* ============================================================== */}
                  {/* LAYOUT A: SERIES (تسلسل)                                        */}
                  {/* ============================================================== */}
                  {(!q.nv_sub_type || q.nv_sub_type === "series") && (
                    <div className="bg-white p-4.5 rounded-2xl border border-amber-200/90 space-y-4">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div>
                          <label className="block text-xs font-black text-slate-800 uppercase tracking-wide">
                            Sequential Problem Figures (Timeline)
                          </label>
                          <span className="text-[11px] text-slate-500 font-medium">
                            Upload PNG/SVG diagrams or insert from the Shape Library. The rightmost card automatically renders the missing question mark (?).
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            const cur = q.nv_problem_images || [];
                            updateField(idx, "nv_problem_images", [...cur, ""]);
                          }}
                          className="text-xs font-bold text-blue-600 bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-xl border border-blue-200 flex items-center gap-1.5 transition shadow-2xs"
                        >
                          <Plus className="w-3.5 h-3.5" /> Add Figure Step
                        </button>
                      </div>

                      {/* Visual Horizontal Timeline Strip */}
                      <div className="flex items-center gap-3 overflow-x-auto pb-3 pt-1">
                        {(q.nv_problem_images || []).map((imgUrl, pIdx) => (
                          <div key={pIdx} className="flex items-center gap-3 shrink-0">
                            <div className="flex flex-col items-center p-3 rounded-2xl border-2 border-slate-200 bg-slate-50/60 w-36 shadow-xs">
                              <div className="w-full flex items-center justify-between mb-2">
                                <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md bg-amber-100 text-amber-900">
                                  Figure {pIdx + 1}
                                </span>
                                {(q.nv_problem_images || []).length > 2 && (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      const filtered = (q.nv_problem_images || []).filter((_, i) => i !== pIdx);
                                      updateField(idx, "nv_problem_images", filtered);
                                    }}
                                    className="text-slate-400 hover:text-rose-600 p-0.5 rounded transition"
                                    title="Remove this step"
                                  >
                                    <Trash2 className="w-3 h-3" />
                                  </button>
                                )}
                              </div>

                              {/* Canvas Preview */}
                              <div className="w-24 h-24 rounded-xl border border-slate-200 bg-white p-1 flex items-center justify-center mb-2.5 shadow-2xs overflow-hidden">
                                {imgUrl ? (
                                  <img src={imgUrl} alt={`Problem ${pIdx + 1}`} className="w-full h-full object-contain" />
                                ) : (
                                  <span className="text-[10px] text-slate-300 font-bold text-center px-1">
                                    No Figure
                                  </span>
                                )}
                              </div>

                              {/* Action Buttons: Upload & Shapes */}
                              <div className="flex items-center gap-1.5 w-full">
                                <label className="flex-1 cursor-pointer inline-flex items-center justify-center gap-1 px-2 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-[10px] font-bold transition shadow-2xs">
                                  <Upload className="w-3 h-3 text-blue-600" />
                                  <span>Upload</span>
                                  <input
                                    type="file"
                                    accept="image/*,.svg"
                                    className="hidden"
                                    onChange={(e) =>
                                      handleImageUpload(e, (dataUrl) => {
                                        const copy = [...(q.nv_problem_images || [])];
                                        copy[pIdx] = dataUrl;
                                        updateField(idx, "nv_problem_images", copy);
                                      })
                                    }
                                  />
                                </label>
                                <button
                                  type="button"
                                  onClick={() =>
                                    setShapePickerTarget({
                                      qIndex: idx,
                                      targetType: "problem",
                                      slotIndex: pIdx
                                    })
                                  }
                                  className="flex-1 inline-flex items-center justify-center gap-1 px-2 py-1.5 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 text-[10px] font-bold transition shadow-2xs"
                                >
                                  <Shapes className="w-3 h-3 text-amber-600" />
                                  <span>Shapes</span>
                                </button>
                              </div>
                            </div>

                            {/* Arrow Divider */}
                            <span className="text-slate-400 font-black text-xl select-none">&rarr;</span>
                          </div>
                        ))}

                        {/* Trailing Locked Slot: Next (?) */}
                        <div className="flex flex-col items-center p-3 rounded-2xl border-2 border-dashed border-amber-400 bg-amber-50/70 w-36 shrink-0 shadow-xs">
                          <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md bg-amber-200 text-amber-900 mb-2">
                            Next (?)
                          </span>
                          <div className="w-24 h-24 rounded-xl border border-amber-300 bg-white/80 flex flex-col items-center justify-center text-amber-600 font-black mb-2.5 shadow-2xs animate-pulse">
                            <span className="text-3xl">?</span>
                            <span className="text-[9px] font-bold text-amber-700">Missing</span>
                          </div>
                          <span className="text-[9px] font-bold text-amber-800 text-center leading-tight">
                            Supplied by Answer Choices A-E
                          </span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* ============================================================== */}
                  {/* LAYOUT B: ANALOGY (تشبیہ)                                      */}
                  {/* ============================================================== */}
                  {q.nv_sub_type === "analogy" && (
                    <div className="bg-white p-4.5 rounded-2xl border border-indigo-200/90 space-y-4">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div>
                          <label className="block text-xs font-black text-slate-800 uppercase tracking-wide">
                            Figure Analogy Pairs: [Pair 1: Fig A : Fig B] :: [Pair 2: Fig C : ?]
                          </label>
                          <span className="text-[11px] text-slate-500 font-medium">
                            Set up the given transformation in Pair 1, then specify Figure C in Pair 2. Figure D is selected by the student from the answer choices.
                          </span>
                        </div>
                      </div>

                      {/* Paired Canvas */}
                      <div className="flex flex-col lg:flex-row items-center justify-center gap-4 p-4 bg-slate-50/70 rounded-2xl border border-slate-200">
                        {/* PAIR 1: Given Rule (Figure A : Figure B) */}
                        <div className="flex-1 w-full p-4 rounded-2xl border-2 border-indigo-200 bg-indigo-50/40 space-y-2">
                          <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-md bg-indigo-600 text-white shadow-2xs">
                            Pair 1 (Given Relationship / دیا گیا تعلق)
                          </span>
                          <div className="flex items-center justify-center gap-3 pt-2">
                            {/* Figure A */}
                            <div className="flex flex-col items-center w-32 p-2.5 rounded-xl border border-indigo-200 bg-white shadow-xs">
                              <span className="text-[10px] font-black text-indigo-900 mb-1">Figure A</span>
                              <div className="w-20 h-20 rounded-lg border border-slate-200 p-1 flex items-center justify-center mb-2 overflow-hidden bg-slate-50">
                                {q.nv_problem_images?.[0] ? (
                                  <img src={q.nv_problem_images[0]} alt="Fig A" className="w-full h-full object-contain" />
                                ) : (
                                  <span className="text-[10px] text-slate-300 font-bold">Empty</span>
                                )}
                              </div>
                              <div className="flex items-center gap-1 w-full">
                                <label className="flex-1 cursor-pointer text-center px-1.5 py-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 text-[9px] font-bold shadow-2xs">
                                  Upload
                                  <input
                                    type="file"
                                    accept="image/*,.svg"
                                    className="hidden"
                                    onChange={(e) =>
                                      handleImageUpload(e, (url) => {
                                        const copy = [...(q.nv_problem_images || ["", "", ""])];
                                        copy[0] = url;
                                        updateField(idx, "nv_problem_images", copy);
                                      })
                                    }
                                  />
                                </label>
                                <button
                                  type="button"
                                  onClick={() =>
                                    setShapePickerTarget({
                                      qIndex: idx,
                                      targetType: "problem",
                                      slotIndex: 0
                                    })
                                  }
                                  className="flex-1 text-center px-1.5 py-1 rounded bg-amber-50 hover:bg-amber-100 border border-amber-200 text-amber-800 text-[9px] font-bold shadow-2xs"
                                >
                                  Shapes
                                </button>
                              </div>
                            </div>

                            {/* Colon Badge */}
                            <div className="flex flex-col items-center">
                              <span className="text-2xl font-black text-indigo-600">:</span>
                              <span className="text-[9px] font-bold text-indigo-700">is to</span>
                            </div>

                            {/* Figure B */}
                            <div className="flex flex-col items-center w-32 p-2.5 rounded-xl border border-indigo-200 bg-white shadow-xs">
                              <span className="text-[10px] font-black text-indigo-900 mb-1">Figure B</span>
                              <div className="w-20 h-20 rounded-lg border border-slate-200 p-1 flex items-center justify-center mb-2 overflow-hidden bg-slate-50">
                                {q.nv_problem_images?.[1] ? (
                                  <img src={q.nv_problem_images[1]} alt="Fig B" className="w-full h-full object-contain" />
                                ) : (
                                  <span className="text-[10px] text-slate-300 font-bold">Empty</span>
                                )}
                              </div>
                              <div className="flex items-center gap-1 w-full">
                                <label className="flex-1 cursor-pointer text-center px-1.5 py-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 text-[9px] font-bold shadow-2xs">
                                  Upload
                                  <input
                                    type="file"
                                    accept="image/*,.svg"
                                    className="hidden"
                                    onChange={(e) =>
                                      handleImageUpload(e, (url) => {
                                        const copy = [...(q.nv_problem_images || ["", "", ""])];
                                        copy[1] = url;
                                        updateField(idx, "nv_problem_images", copy);
                                      })
                                    }
                                  />
                                </label>
                                <button
                                  type="button"
                                  onClick={() =>
                                    setShapePickerTarget({
                                      qIndex: idx,
                                      targetType: "problem",
                                      slotIndex: 1
                                    })
                                  }
                                  className="flex-1 text-center px-1.5 py-1 rounded bg-amber-50 hover:bg-amber-100 border border-amber-200 text-amber-800 text-[9px] font-bold shadow-2xs"
                                >
                                  Shapes
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Double Colon Connector */}
                        <div className="flex flex-col items-center px-2 py-1 rounded-xl bg-indigo-600 text-white shadow-sm shrink-0">
                          <span className="text-xl font-black tracking-widest">::</span>
                          <span className="text-[9px] font-black uppercase">AS</span>
                        </div>

                        {/* PAIR 2: Target Rule (Figure C : Figure D) */}
                        <div className="flex-1 w-full p-4 rounded-2xl border-2 border-amber-200 bg-amber-50/40 space-y-2">
                          <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-md bg-amber-600 text-white shadow-2xs">
                            Pair 2 (Target Relationship / حل طلب جوڑا)
                          </span>
                          <div className="flex items-center justify-center gap-3 pt-2">
                            {/* Figure C */}
                            <div className="flex flex-col items-center w-32 p-2.5 rounded-xl border border-amber-200 bg-white shadow-xs">
                              <span className="text-[10px] font-black text-amber-900 mb-1">Figure C</span>
                              <div className="w-20 h-20 rounded-lg border border-slate-200 p-1 flex items-center justify-center mb-2 overflow-hidden bg-slate-50">
                                {q.nv_problem_images?.[2] ? (
                                  <img src={q.nv_problem_images[2]} alt="Fig C" className="w-full h-full object-contain" />
                                ) : (
                                  <span className="text-[10px] text-slate-300 font-bold">Empty</span>
                                )}
                              </div>
                              <div className="flex items-center gap-1 w-full">
                                <label className="flex-1 cursor-pointer text-center px-1.5 py-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 text-[9px] font-bold shadow-2xs">
                                  Upload
                                  <input
                                    type="file"
                                    accept="image/*,.svg"
                                    className="hidden"
                                    onChange={(e) =>
                                      handleImageUpload(e, (url) => {
                                        const copy = [...(q.nv_problem_images || ["", "", ""])];
                                        copy[2] = url;
                                        updateField(idx, "nv_problem_images", copy);
                                      })
                                    }
                                  />
                                </label>
                                <button
                                  type="button"
                                  onClick={() =>
                                    setShapePickerTarget({
                                      qIndex: idx,
                                      targetType: "problem",
                                      slotIndex: 2
                                    })
                                  }
                                  className="flex-1 text-center px-1.5 py-1 rounded bg-amber-50 hover:bg-amber-100 border border-amber-200 text-amber-800 text-[9px] font-bold shadow-2xs"
                                >
                                  Shapes
                                </button>
                              </div>
                            </div>

                            {/* Colon Badge */}
                            <div className="flex flex-col items-center">
                              <span className="text-2xl font-black text-amber-600">:</span>
                              <span className="text-[9px] font-bold text-amber-700">is to</span>
                            </div>

                            {/* Figure D (?) Locked */}
                            <div className="flex flex-col items-center w-32 p-2.5 rounded-xl border-2 border-dashed border-amber-400 bg-amber-100/50 shadow-xs animate-pulse">
                              <span className="text-[10px] font-black text-amber-900 mb-1">Figure D (?)</span>
                              <div className="w-20 h-20 rounded-lg border border-amber-300 bg-white/80 flex flex-col items-center justify-center mb-2">
                                <span className="text-3xl font-black text-amber-600">?</span>
                              </div>
                              <span className="text-[9px] font-bold text-amber-800 text-center leading-tight">
                                Pick from choices
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* ============================================================== */}
                  {/* LAYOUT C: MATRIX (میٹرکس / Raven's Progressive Patterns)       */}
                  {/* ============================================================== */}
                  {q.nv_sub_type === "matrix" && (
                    <div className="bg-white p-4.5 rounded-2xl border border-teal-200/90 space-y-4">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div>
                          <label className="block text-xs font-black text-slate-800 uppercase tracking-wide">
                            Raven's Progressive Matrix Grid Canvas
                          </label>
                          <span className="text-[11px] text-slate-500 font-medium">
                            Set up shapes across rows and columns. The bottom-right cell is locked as the unknown piece (?).
                          </span>
                        </div>

                        {/* Grid size switcher */}
                        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl text-xs font-bold">
                          <button
                            type="button"
                            onClick={() => switchMatrixGrid(idx, "2x2")}
                            className={`px-3 py-1 rounded-lg text-xs font-bold transition ${
                              (q.nv_matrix_grid || "2x2") === "2x2"
                                ? "bg-teal-600 text-white shadow-xs"
                                : "text-slate-600 hover:bg-white"
                            }`}
                          >
                            2 × 2 Grid (4 Cells)
                          </button>
                          <button
                            type="button"
                            onClick={() => switchMatrixGrid(idx, "3x3")}
                            className={`px-3 py-1 rounded-lg text-xs font-bold transition ${
                              q.nv_matrix_grid === "3x3"
                                ? "bg-teal-600 text-white shadow-xs"
                                : "text-slate-600 hover:bg-white"
                            }`}
                          >
                            3 × 3 Grid (9 Cells)
                          </button>
                        </div>
                      </div>

                      {/* The Matrix Canvas */}
                      <div className="p-4 bg-slate-100/70 rounded-2xl border-2 border-slate-300">
                        {q.nv_matrix_grid === "3x3" ? (
                          // 3x3 Grid (8 given + 1 missing)
                          <div className="grid grid-cols-3 gap-3 max-w-xl mx-auto">
                            {Array.from({ length: 8 }).map((_, cIdx) => {
                              const r = Math.floor(cIdx / 3) + 1;
                              const c = (cIdx % 3) + 1;
                              const cellUrl = q.nv_problem_images?.[cIdx] || "";
                              return (
                                <div key={cIdx} className="flex flex-col items-center p-2.5 rounded-xl border border-slate-300 bg-white shadow-xs">
                                  <div className="w-full flex items-center justify-between mb-1.5">
                                    <span className="text-[9px] font-black text-teal-800 bg-teal-50 px-1.5 py-0.5 rounded border border-teal-200">
                                      R{r}, C{c}
                                    </span>
                                  </div>
                                  <div className="w-20 h-20 rounded-lg border border-slate-200 bg-slate-50 p-1 flex items-center justify-center mb-2 overflow-hidden">
                                    {cellUrl ? (
                                      <img src={cellUrl} alt={`R${r}C${c}`} className="w-full h-full object-contain" />
                                    ) : (
                                      <span className="text-[10px] text-slate-300 font-bold">Empty</span>
                                    )}
                                  </div>
                                  <div className="flex items-center gap-1 w-full">
                                    <label className="flex-1 cursor-pointer text-center px-1.5 py-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 text-[9px] font-bold shadow-2xs">
                                      Upload
                                      <input
                                        type="file"
                                        accept="image/*,.svg"
                                        className="hidden"
                                        onChange={(e) =>
                                          handleImageUpload(e, (url) => {
                                            const copy = [...(q.nv_problem_images || [])];
                                            copy[cIdx] = url;
                                            updateField(idx, "nv_problem_images", copy);
                                          })
                                        }
                                      />
                                    </label>
                                    <button
                                      type="button"
                                      onClick={() =>
                                        setShapePickerTarget({
                                          qIndex: idx,
                                          targetType: "problem",
                                          slotIndex: cIdx
                                        })
                                      }
                                      className="flex-1 text-center px-1.5 py-1 rounded bg-amber-50 hover:bg-amber-100 border border-amber-200 text-amber-800 text-[9px] font-bold shadow-2xs"
                                    >
                                      Shapes
                                    </button>
                                  </div>
                                </div>
                              );
                            })}
                            {/* 9th Cell: Missing ? */}
                            <div className="flex flex-col items-center justify-center p-2.5 rounded-xl border-2 border-dashed border-amber-400 bg-amber-100/50 shadow-xs animate-pulse">
                              <span className="text-[9px] font-black text-amber-900 bg-amber-200 px-1.5 py-0.5 rounded mb-1">
                                R3, C3 (?)
                              </span>
                              <div className="w-20 h-20 rounded-lg border border-amber-300 bg-white/80 flex flex-col items-center justify-center">
                                <span className="text-3xl font-black text-amber-600">?</span>
                                <span className="text-[9px] font-bold text-amber-800">Missing Cell</span>
                              </div>
                            </div>
                          </div>
                        ) : (
                          // 2x2 Grid (3 given + 1 missing)
                          <div className="grid grid-cols-2 gap-3.5 max-w-md mx-auto">
                            {[
                              { label: "Row 1, Col 1", r: 1, c: 1, index: 0 },
                              { label: "Row 1, Col 2", r: 1, c: 2, index: 1 },
                              { label: "Row 2, Col 1", r: 2, c: 1, index: 2 },
                            ].map((slot) => {
                              const cellUrl = q.nv_problem_images?.[slot.index] || "";
                              return (
                                <div key={slot.index} className="flex flex-col items-center p-3 rounded-xl border border-slate-300 bg-white shadow-xs">
                                  <div className="w-full flex items-center justify-between mb-2">
                                    <span className="text-[10px] font-black text-teal-800 bg-teal-50 px-2 py-0.5 rounded border border-teal-200">
                                      {slot.label}
                                    </span>
                                  </div>
                                  <div className="w-24 h-24 rounded-lg border border-slate-200 bg-slate-50 p-1 flex items-center justify-center mb-2.5 overflow-hidden">
                                    {cellUrl ? (
                                      <img src={cellUrl} alt={slot.label} className="w-full h-full object-contain" />
                                    ) : (
                                      <span className="text-[11px] text-slate-300 font-bold">Empty</span>
                                    )}
                                  </div>
                                  <div className="flex items-center gap-1.5 w-full">
                                    <label className="flex-1 cursor-pointer text-center px-2 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-[10px] font-bold shadow-2xs">
                                      Upload
                                      <input
                                        type="file"
                                        accept="image/*,.svg"
                                        className="hidden"
                                        onChange={(e) =>
                                          handleImageUpload(e, (url) => {
                                            const copy = [...(q.nv_problem_images || [])];
                                            copy[slot.index] = url;
                                            updateField(idx, "nv_problem_images", copy);
                                          })
                                        }
                                      />
                                    </label>
                                    <button
                                      type="button"
                                      onClick={() =>
                                        setShapePickerTarget({
                                          qIndex: idx,
                                          targetType: "problem",
                                          slotIndex: slot.index
                                        })
                                      }
                                      className="flex-1 text-center px-2 py-1 rounded-lg bg-amber-50 hover:bg-amber-100 border border-amber-200 text-amber-800 text-[10px] font-bold shadow-2xs"
                                    >
                                      Shapes
                                    </button>
                                  </div>
                                </div>
                              );
                            })}
                            {/* 4th Cell: Missing ? */}
                            <div className="flex flex-col items-center justify-center p-3 rounded-xl border-2 border-dashed border-amber-400 bg-amber-100/50 shadow-xs animate-pulse">
                              <span className="text-[10px] font-black text-amber-900 bg-amber-200 px-2 py-0.5 rounded mb-2">
                                Row 2, Col 2 (?)
                              </span>
                              <div className="w-24 h-24 rounded-lg border border-amber-300 bg-white/80 flex flex-col items-center justify-center">
                                <span className="text-3xl font-black text-amber-600">?</span>
                                <span className="text-[10px] font-bold text-amber-800 mt-1">Missing Cell</span>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* ============================================================== */}
                  {/* LAYOUT D: ODD ONE OUT NOTICE (مختلف شکل)                        */}
                  {/* ============================================================== */}
                  {q.nv_sub_type === "odd_one_out" && (
                    <div className="bg-rose-50/60 p-4.5 rounded-2xl border border-rose-200 space-y-2">
                      <div className="flex items-center gap-2 text-rose-900 text-xs font-black">
                        <span className="text-base">⭐</span>
                        <span>Odd One Out Mode Active — Direct 5-Choice Evaluation</span>
                      </div>
                      <p className="text-xs text-rose-800 leading-relaxed font-medium">
                        Odd One Out questions present <strong>5 candidate figures (A, B, C, D, E)</strong> directly to the candidate without any prior sequence strip.
                        Use the cards below to configure all 5 figures and click the radio button on the figure that does NOT belong.
                      </p>
                    </div>
                  )}

                  {/* ============================================================== */}
                  {/* ANSWER FIGURES / CHOICES SECTION                               */}
                  {/* ============================================================== */}
                  <div className="bg-white p-4.5 rounded-2xl border border-amber-200/90 space-y-3.5">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div>
                        <label className="block text-xs font-black text-slate-800 uppercase tracking-wide">
                          {q.nv_sub_type === "odd_one_out"
                            ? "Candidate Figures (A, B, C, D, E) — Select The Odd One Out"
                            : "Answer Figures / Choices (A, B, C, D)"}
                        </label>
                        <span className="text-[11px] text-slate-500 font-medium">
                          {q.nv_sub_type === "odd_one_out"
                            ? "Click the radio button on the figure that is the Odd One Out (Correct Answer)."
                            : "Click the radio button on the card to designate it as the Correct Answer Figure."}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          const currentOpts = q.nv_options || [];
                          const nextNum = currentOpts.length + 1;
                          const nextLetter = String.fromCharCode(64 + nextNum);
                          updateField(idx, "nv_options", [
                            ...currentOpts,
                            { id: String(nextNum), label: nextLetter, image_url: "", text: `Figure ${nextLetter}` }
                          ]);
                        }}
                        className="text-xs font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 px-3 py-1.5 rounded-xl border border-emerald-200 flex items-center gap-1.5 transition shadow-2xs"
                      >
                        <Plus className="w-3.5 h-3.5" /> Add Figure Option
                      </button>
                    </div>

                    {/* Choices Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-3.5">
                      {(q.nv_options || []).map((opt, oIdx) => {
                        const isCorrect = String(q.nv_correct || "1") === String(opt.id);
                        const optLabel = opt.label || String.fromCharCode(65 + oIdx);
                        return (
                          <div
                            key={opt.id}
                            className={`p-3.5 rounded-2xl border-2 transition ${
                              isCorrect
                                ? "border-emerald-500 bg-emerald-50/40 ring-2 ring-emerald-500/20 shadow-md"
                                : "border-slate-200 hover:border-slate-300 bg-slate-50/50"
                            }`}
                          >
                            <div className="flex items-center justify-between mb-2.5">
                              <label className="flex items-center gap-2 cursor-pointer">
                                <input
                                  type="radio"
                                  name={`nv_correct_${q.id}`}
                                  checked={isCorrect}
                                  onChange={() => updateField(idx, "nv_correct", String(opt.id))}
                                  className="w-4 h-4 text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                                />
                                <span className={`text-xs font-black px-2 py-0.5 rounded-lg ${
                                  isCorrect ? "bg-emerald-600 text-white shadow-2xs" : "bg-slate-200 text-slate-700"
                                }`}>
                                  Figure {optLabel}
                                </span>
                              </label>

                              {(q.nv_options || []).length > 2 && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    const filtered = (q.nv_options || []).filter((_, i) => i !== oIdx);
                                    updateField(idx, "nv_options", filtered);
                                  }}
                                  className="text-slate-300 hover:text-rose-600 p-1 rounded transition"
                                  title="Delete this option"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </div>

                            {/* Option Visual Preview */}
                            <div className="w-full h-28 rounded-xl border border-slate-200 bg-white p-1 mb-2.5 flex items-center justify-center overflow-hidden shadow-2xs">
                              {opt.image_url ? (
                                <img src={opt.image_url} alt={optLabel} className="w-full h-full object-contain" />
                              ) : (
                                <span className="text-[11px] text-slate-300 font-bold">No Figure</span>
                              )}
                            </div>

                            {/* Upload & Shape Library Buttons */}
                            <div className="flex items-center gap-1.5 mb-2">
                              <label className="flex-1 cursor-pointer inline-flex items-center justify-center gap-1 px-2 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-[10px] font-bold transition shadow-2xs">
                                <Upload className="w-3 h-3 text-blue-600" />
                                <span>Upload</span>
                                <input
                                  type="file"
                                  accept="image/*,.svg"
                                  className="hidden"
                                  onChange={(e) =>
                                    handleImageUpload(e, (dataUrl) => {
                                      const copy = [...(q.nv_options || [])];
                                      copy[oIdx] = { ...copy[oIdx], image_url: dataUrl };
                                      updateField(idx, "nv_options", copy);
                                    })
                                  }
                                />
                              </label>
                              <button
                                type="button"
                                onClick={() =>
                                  setShapePickerTarget({
                                    qIndex: idx,
                                    targetType: "option",
                                    slotIndex: oIdx
                                  })
                                }
                                className="flex-1 inline-flex items-center justify-center gap-1 px-2 py-1.5 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 text-[10px] font-bold transition shadow-2xs"
                              >
                                <Shapes className="w-3 h-3 text-amber-600" />
                                <span>Shapes</span>
                              </button>
                            </div>

                            {/* Optional caption or notes */}
                            <input
                              type="text"
                              value={opt.text || ""}
                              onChange={(e) => {
                                const copy = [...(q.nv_options || [])];
                                copy[oIdx] = { ...copy[oIdx], text: e.target.value };
                                updateField(idx, "nv_options", copy);
                              }}
                              placeholder={q.nv_sub_type === "odd_one_out" ? "e.g. Triangle (3 sides - Odd)" : "Caption / Description (optional)"}
                              className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 text-[11px] focus:outline-none focus:ring-1 focus:ring-amber-500 bg-white font-medium placeholder:text-slate-400"
                            />
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}

              {/* 10. Verbal Reasoning (Analogies, Series, Odd One Out, Coding, Blood Relations) */}
              {q.type === "verbal_reasoning" && (
                <div className="space-y-5 pt-2 bg-gradient-to-br from-teal-50/60 via-emerald-50/30 to-teal-50/20 p-5 rounded-2xl border border-teal-200/90 shadow-2xs">
                  {/* Top Bar: Sub-Type Switcher */}
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-2 text-teal-950 text-xs font-black">
                      <div className="w-7 h-7 rounded-lg bg-teal-600 text-white flex items-center justify-center shadow-xs">
                        <BrainCircuit className="w-4 h-4" />
                      </div>
                      <div>
                        <span className="block font-black text-sm">Verbal Reasoning Assessment</span>
                        <span className="text-[11px] font-medium text-teal-800">Analogies, Sequence, Coding, Odd Word Out & Logical Relations (Cadet College / ISSB / IQ)</span>
                      </div>
                    </div>

                    {/* Sub-type switcher tabs */}
                    <div className="flex items-center gap-1 bg-white p-1 rounded-xl border border-teal-200 text-xs font-bold shadow-2xs">
                      {[
                        { id: "analogy" as const, label: "Analogy (تشبیہ)", icon: "🔄" },
                        { id: "series" as const, label: "Series (تسلسل)", icon: "🔢" },
                        { id: "odd_one_out" as const, label: "Odd One Out (مختلف لفظ)", icon: "⭐" },
                        { id: "coding" as const, label: "Coding & Decoding (کوڈنگ)", icon: "🔐" },
                        { id: "blood_relations" as const, label: "Blood Relations (رشتے و استدلال)", icon: "👥" },
                      ].map((st) => {
                        const isActive = (q.vr_sub_type || "analogy") === st.id;
                        return (
                          <button
                            key={st.id}
                            type="button"
                            onClick={() => switchVerbalSubType(idx, st.id)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
                              isActive
                                ? "bg-teal-600 text-white shadow-xs"
                                : "text-slate-600 hover:bg-slate-50"
                            }`}
                          >
                            <span>{st.icon}</span>
                            <span>{st.label}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Contextual 1-Click Demos per Subtype */}
                  <div className="flex flex-wrap items-center gap-1.5 pt-1">
                    <span className="text-[10px] font-bold text-slate-400 uppercase">Quick Demos:</span>
                    {(q.vr_sub_type || "analogy") === "analogy" && (
                      <>
                        <button
                          type="button"
                          onClick={() => loadVerbalPreset(idx, VERBAL_REASONING_PRESETS.analogy_worker_place)}
                          className="text-[10px] font-bold text-teal-900 bg-white px-2.5 py-1 rounded-lg border border-teal-300 shadow-2xs hover:bg-teal-50"
                        >
                          Worker & Place (Doctor:Hospital)
                        </button>
                        <button
                          type="button"
                          onClick={() => loadVerbalPreset(idx, VERBAL_REASONING_PRESETS.analogy_antonyms)}
                          className="text-[10px] font-bold text-indigo-900 bg-white px-2.5 py-1 rounded-lg border border-indigo-300 shadow-2xs hover:bg-indigo-50"
                        >
                          Antonyms (Ascend:Descend)
                        </button>
                        <button
                          type="button"
                          onClick={() => loadVerbalPreset(idx, VERBAL_REASONING_PRESETS.analogy_cause_effect)}
                          className="text-[10px] font-bold text-amber-900 bg-white px-2.5 py-1 rounded-lg border border-amber-300 shadow-2xs hover:bg-amber-50"
                        >
                          Cause & Consequence (Fire:Ashes)
                        </button>
                      </>
                    )}
                    {q.vr_sub_type === "series" && (
                      <>
                        <button
                          type="button"
                          onClick={() => loadVerbalPreset(idx, VERBAL_REASONING_PRESETS.series_number_double)}
                          className="text-[10px] font-bold text-teal-900 bg-white px-2.5 py-1 rounded-lg border border-teal-300 shadow-2xs hover:bg-teal-50"
                        >
                          Doubling (3, 6, 12, 24, 48)
                        </button>
                        <button
                          type="button"
                          onClick={() => loadVerbalPreset(idx, VERBAL_REASONING_PRESETS.series_fibonacci)}
                          className="text-[10px] font-bold text-blue-900 bg-white px-2.5 py-1 rounded-lg border border-blue-300 shadow-2xs hover:bg-blue-50"
                        >
                          Fibonacci Sum (2, 3, 5, 8, 13)
                        </button>
                        <button
                          type="button"
                          onClick={() => loadVerbalPreset(idx, VERBAL_REASONING_PRESETS.series_letter_skip)}
                          className="text-[10px] font-bold text-purple-900 bg-white px-2.5 py-1 rounded-lg border border-purple-300 shadow-2xs hover:bg-purple-50"
                        >
                          Letter Jump (B, D, F, H)
                        </button>
                        <button
                          type="button"
                          onClick={() => loadVerbalPreset(idx, VERBAL_REASONING_PRESETS.series_letter_reverse)}
                          className="text-[10px] font-bold text-rose-900 bg-white px-2.5 py-1 rounded-lg border border-rose-300 shadow-2xs hover:bg-rose-50"
                        >
                          Reverse Countdown (Z, X, V, T)
                        </button>
                      </>
                    )}
                    {q.vr_sub_type === "odd_one_out" && (
                      <>
                        <button
                          type="button"
                          onClick={() => loadVerbalPreset(idx, VERBAL_REASONING_PRESETS.odd_words_metals)}
                          className="text-[10px] font-bold text-amber-900 bg-white px-2.5 py-1 rounded-lg border border-amber-300 shadow-2xs hover:bg-amber-50"
                        >
                          Metals vs Wood
                        </button>
                        <button
                          type="button"
                          onClick={() => loadVerbalPreset(idx, VERBAL_REASONING_PRESETS.odd_words_capitals)}
                          className="text-[10px] font-bold text-blue-900 bg-white px-2.5 py-1 rounded-lg border border-blue-300 shadow-2xs hover:bg-blue-50"
                        >
                          Capitals vs Lahore
                        </button>
                        <button
                          type="button"
                          onClick={() => loadVerbalPreset(idx, VERBAL_REASONING_PRESETS.odd_words_planets)}
                          className="text-[10px] font-bold text-purple-900 bg-white px-2.5 py-1 rounded-lg border border-purple-300 shadow-2xs hover:bg-purple-50"
                        >
                          Planets vs Moon
                        </button>
                      </>
                    )}
                    {q.vr_sub_type === "coding" && (
                      <>
                        <button
                          type="button"
                          onClick={() => loadVerbalPreset(idx, VERBAL_REASONING_PRESETS.coding_caesar_plus1)}
                          className="text-[10px] font-bold text-teal-900 bg-white px-2.5 py-1 rounded-lg border border-teal-300 shadow-2xs hover:bg-teal-50"
                        >
                          +1 Caesar Shift (PEACE➔QFBDF)
                        </button>
                        <button
                          type="button"
                          onClick={() => loadVerbalPreset(idx, VERBAL_REASONING_PRESETS.coding_reverse_letters)}
                          className="text-[10px] font-bold text-indigo-900 bg-white px-2.5 py-1 rounded-lg border border-indigo-300 shadow-2xs hover:bg-indigo-50"
                        >
                          Reverse Letters (SYSTEM➔METSYS)
                        </button>
                      </>
                    )}
                    {q.vr_sub_type === "blood_relations" && (
                      <>
                        <button
                          type="button"
                          onClick={() => loadVerbalPreset(idx, VERBAL_REASONING_PRESETS.blood_relations_sister)}
                          className="text-[10px] font-bold text-rose-900 bg-white px-2.5 py-1 rounded-lg border border-rose-300 shadow-2xs hover:bg-rose-50"
                        >
                          Kinship (Father's Only Son)
                        </button>
                        <button
                          type="button"
                          onClick={() => loadVerbalPreset(idx, VERBAL_REASONING_PRESETS.direction_sense_walk)}
                          className="text-[10px] font-bold text-emerald-900 bg-white px-2.5 py-1 rounded-lg border border-emerald-300 shadow-2xs hover:bg-emerald-50"
                        >
                          Direction Tracking (North/East)
                        </button>
                      </>
                    )}
                  </div>

                  {/* ======================================================== */}
                  {/* 1. DEDICATED INTERFACE: VERBAL ANALOGY (تشبیہ)             */}
                  {/* ======================================================== */}
                  {(q.vr_sub_type || "analogy") === "analogy" && (
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
                                value={q.vr_pair1_left || ""}
                                onChange={(e) => updateField(idx, "vr_pair1_left", e.target.value)}
                                placeholder="e.g. Doctor"
                                className="w-full px-2.5 py-1.5 text-xs font-bold text-slate-800 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-teal-500"
                              />
                            </div>
                            <span className="text-xl font-black text-teal-600 pt-4">:</span>
                            <div className="flex-1">
                              <label className="text-[9px] font-bold text-slate-500 uppercase block mb-1">Word B (Right)</label>
                              <input
                                type="text"
                                value={q.vr_pair1_right || ""}
                                onChange={(e) => updateField(idx, "vr_pair1_right", e.target.value)}
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
                                value={q.vr_pair2_left || ""}
                                onChange={(e) => updateField(idx, "vr_pair2_left", e.target.value)}
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
                          value={q.vr_relationship_type || ""}
                          onChange={(e) => updateField(idx, "vr_relationship_type", e.target.value)}
                          placeholder="e.g. Worker & Workplace, Antonyms, Cause & Consequence"
                          className="flex-1 px-2.5 py-1 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:bg-white"
                        />
                      </div>
                    </div>
                  )}

                  {/* ======================================================== */}
                  {/* 2. DEDICATED INTERFACE: LETTER & NUMBER SERIES (تسلسل)     */}
                  {/* ======================================================== */}
                  {q.vr_sub_type === "series" && (
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
                                onClick={() => updateField(idx, "vr_series_type", st)}
                                className={`px-2 py-0.5 rounded-md capitalize transition ${
                                  (q.vr_series_type || "number") === st
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
                              const cur = [...(q.vr_series_tokens || [])];
                              cur.push("");
                              updateField(idx, "vr_series_tokens", cur);
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
                        {(q.vr_series_tokens || []).map((token, tIdx) => (
                          <div key={tIdx} className="flex items-center gap-2 shrink-0">
                            <div className="flex flex-col items-center gap-1 p-2 rounded-xl bg-slate-50 border border-slate-200">
                              <span className="text-[9px] font-bold text-slate-400 uppercase">Term {tIdx + 1}</span>
                              <input
                                type="text"
                                value={token}
                                onChange={(e) => {
                                  const copy = [...(q.vr_series_tokens || [])];
                                  copy[tIdx] = e.target.value;
                                  updateField(idx, "vr_series_tokens", copy);
                                }}
                                placeholder={`Term ${tIdx + 1}`}
                                className="w-16 px-2 py-1 text-center font-mono font-bold text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-teal-500"
                              />
                              {(q.vr_series_tokens || []).length > 2 && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    const next = (q.vr_series_tokens || []).filter((_, i) => i !== tIdx);
                                    updateField(idx, "vr_series_tokens", next);
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
                          value={q.vr_rule_hint || ""}
                          onChange={(e) => updateField(idx, "vr_rule_hint", e.target.value)}
                          placeholder="e.g. Multiply by 2 at each step, or +2 letter skip in alphabet"
                          className="flex-1 px-2.5 py-1 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:bg-white"
                        />
                      </div>
                    </div>
                  )}

                  {/* ======================================================== */}
                  {/* 3. DEDICATED INTERFACE: ODD WORD OUT (غیر متعلق لفظ)       */}
                  {/* ======================================================== */}
                  {q.vr_sub_type === "odd_one_out" && (
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
                            value={q.vr_group_category || ""}
                            onChange={(e) => updateField(idx, "vr_group_category", e.target.value)}
                            placeholder="e.g. Metallic Elements, National Capitals"
                            className="px-2.5 py-1 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:bg-white w-48 font-medium"
                          />
                        </div>
                      </div>

                      {/* 5 Word Evaluation Cards */}
                      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5 pt-1">
                        {(q.vr_words || ["Copper", "Iron", "Wood", "Silver", "Gold"]).map((w, wIdx) => {
                          const isOdd = String(wIdx + 1) === String(q.vr_correct);
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
                                  const copy = [...(q.vr_words || [])];
                                  copy[wIdx] = e.target.value;
                                  updateField(idx, "vr_words", copy);
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
                                  name={`vr_odd_radio_${idx}`}
                                  checked={isOdd}
                                  onChange={() => {
                                    updateField(idx, "vr_correct", String(wIdx + 1));
                                    updateField(idx, "vr_odd_index", wIdx);
                                  }}
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
                  {q.vr_sub_type === "coding" && (
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
                                value={q.vr_source_word || ""}
                                onChange={(e) => updateField(idx, "vr_source_word", e.target.value.toUpperCase())}
                                placeholder="e.g. PEACE"
                                className="w-full px-2.5 py-1.5 text-xs font-mono font-bold text-slate-800 bg-white border border-slate-200 rounded-lg text-center"
                              />
                            </div>
                            <span className="text-teal-600 font-sans font-black text-sm pt-4">➔</span>
                            <div className="flex-1">
                              <label className="text-[9px] font-bold text-slate-500 uppercase block mb-1 font-sans">Coded Output</label>
                              <input
                                type="text"
                                value={q.vr_coded_word || ""}
                                onChange={(e) => updateField(idx, "vr_coded_word", e.target.value.toUpperCase())}
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
                                value={q.vr_target_word || ""}
                                onChange={(e) => updateField(idx, "vr_target_word", e.target.value.toUpperCase())}
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
                          value={q.vr_coding_rule || ""}
                          onChange={(e) => updateField(idx, "vr_coding_rule", e.target.value)}
                          placeholder="e.g. Each letter shifted by +1 position forward (A➔B, B➔C)"
                          className="flex-1 px-2.5 py-1 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:bg-white"
                        />
                      </div>
                    </div>
                  )}

                  {/* ======================================================== */}
                  {/* 5. DEDICATED INTERFACE: BLOOD RELATIONS & LOGIC          */}
                  {/* ======================================================== */}
                  {q.vr_sub_type === "blood_relations" && (
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
                            const cur = [...(q.vr_clues || [])];
                            cur.push(`Clue ${cur.length + 1}: `);
                            updateField(idx, "vr_clues", cur);
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
                          value={q.vr_premise || ""}
                          onChange={(e) => updateField(idx, "vr_premise", e.target.value)}
                          placeholder="e.g. Pointing to a photograph, Ali says: 'She is the daughter of my father's only son.'"
                          className="w-full p-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-1 focus:ring-teal-500 font-medium"
                        />
                      </div>

                      {/* Deductive Clues List */}
                      {(q.vr_clues || []).length > 0 && (
                        <div className="space-y-1.5 pt-1">
                          <label className="text-[10px] font-bold text-slate-500 uppercase">Deduction Clues / Step-by-Step Breakdown:</label>
                          <div className="space-y-1.5">
                            {(q.vr_clues || []).map((clue, cIdx) => (
                              <div key={cIdx} className="flex items-center gap-2">
                                <span className="w-5 h-5 rounded-md bg-teal-50 text-teal-700 text-[10px] font-bold flex items-center justify-center shrink-0">
                                  {cIdx + 1}
                                </span>
                                <input
                                  type="text"
                                  value={clue}
                                  onChange={(e) => {
                                    const copy = [...(q.vr_clues || [])];
                                    copy[cIdx] = e.target.value;
                                    updateField(idx, "vr_clues", copy);
                                  }}
                                  placeholder={`Clue step ${cIdx + 1}`}
                                  className="flex-1 px-2.5 py-1 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-teal-500"
                                />
                                <button
                                  type="button"
                                  onClick={() => {
                                    const next = (q.vr_clues || []).filter((_, i) => i !== cIdx);
                                    updateField(idx, "vr_clues", next);
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
                          value={q.vr_question_prompt || ""}
                          onChange={(e) => updateField(idx, "vr_question_prompt", e.target.value)}
                          placeholder="e.g. How is the girl in the photograph related to Ali?"
                          className="w-full px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:bg-white font-bold text-slate-800"
                        />
                      </div>
                    </div>
                  )}

                  {/* ======================================================== */}
                  {/* CANDIDATE CHOICES: For Analogy, Series, Coding, Logic     */}
                  {/* ======================================================== */}
                  {q.vr_sub_type !== "odd_one_out" && (
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
                        {(q.vr_options || [
                          { id: "1", label: "A", text: "Option A" },
                          { id: "2", label: "B", text: "Option B" },
                          { id: "3", label: "C", text: "Option C" },
                          { id: "4", label: "D", text: "Option D" },
                        ]).map((opt, oIdx) => {
                          const isCorrect = String(q.vr_correct || "1") === String(opt.id);
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
                                  name={`vr_choice_radio_${idx}`}
                                  checked={isCorrect}
                                  onChange={() => updateField(idx, "vr_correct", opt.id)}
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
                                  const copy = [...(q.vr_options || [])];
                                  copy[oIdx] = { ...copy[oIdx], text: e.target.value };
                                  updateField(idx, "vr_options", copy);
                                }}
                                placeholder={`Choice ${opt.label || String.fromCharCode(65 + oIdx)}`}
                                className="flex-1 px-2.5 py-1 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-teal-500 font-semibold"
                              />
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              )}
{/* Solution / Student Explanation */}
              <div className="pt-2">
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">
                  Explanation & Solution for Review (Math formulas allowed)
                </label>
                <input
                  type="text"
                  dir="auto"
                  value={q.explanation}
                  onFocus={() => setActiveTarget({ qIndex: idx, field: "explanation" })}
                  onChange={(e) => updateField(idx, "explanation", e.target.value)}
                  placeholder="e.g. By applying integration by parts: $int u dv = uv - int v du$ or اردو میں وضاحت درج کریں۔"
                  className={`w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 ${
                    isRTLText(q.explanation) ? (isUrduText(q.explanation) ? "font-urdu text-right text-base" : "font-arabic text-right text-sm") : ""
                  }`}
                />
                {q.explanation && (
                  <div
                    dir="auto"
                    className={`render-math-target text-xs text-slate-700 font-medium mt-1.5 px-2.5 py-1.5 bg-slate-50 rounded-lg border border-slate-100 ${
                      isRTLText(q.explanation) ? (isUrduText(q.explanation) ? "font-urdu text-right text-base" : "font-arabic text-right text-sm") : ""
                    }`}
                    dangerouslySetInnerHTML={{ __html: formatMarkdownPreview(q.explanation) }}
                  />
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Floating Bottom Submission Bar */}
      <div className="sticky bottom-6 z-20 bg-white/95 backdrop-blur-md p-4 rounded-3xl border border-slate-200 shadow-2xl flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            type="button"
            onClick={() => addQuestion("non_verbal")}
            className="flex items-center gap-2 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 text-white font-bold text-xs px-4 py-2.5 rounded-2xl shadow-sm transition active:scale-95"
          >
            <Layers className="w-4 h-4" />
            <span>+ Add Non-Verbal Question</span>
          </button>
          <button
            type="button"
            onClick={() => addQuestion("verbal_reasoning")}
            className="flex items-center gap-2 bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 text-white font-bold text-xs px-4 py-2.5 rounded-2xl shadow-sm transition active:scale-95"
          >
            <BrainCircuit className="w-4 h-4" />
            <span>+ Add Verbal Reasoning Question</span>
          </button>
          <button
            type="button"
            onClick={() => addQuestion("mcq")}
            className="flex items-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs px-4 py-2.5 rounded-2xl transition"
          >
            <Plus className="w-4 h-4 text-blue-600" />
            <span>+ Add MCQ Question</span>
          </button>
          <span className="text-xs text-slate-500 font-medium ml-2">
            {questions.length} Questions • {totalCalculatedMarks} Total Marks
          </span>
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-black px-8 py-3.5 rounded-2xl text-sm shadow-xl transition shadow-blue-600/30 flex items-center gap-2"
        >
          {isSubmitting ? (
            <span>Publishing Examination...</span>
          ) : (
            <>
              <Sparkles className="w-4 h-4" />
              <span>Save & Publish Examination to Student Portal</span>
            </>
          )}
        </button>
      </div>

      {/* Floating Cart-Style Slider Trigger: Right Edge Tab */}
      <div className="fixed right-0 top-1/2 -translate-y-1/2 z-40">
        <button
          type="button"
          onClick={() => setIsFormulaDrawerOpen(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white shadow-2xl py-3.5 px-2.5 rounded-l-2xl border-l-2 border-y-2 border-blue-400 flex flex-col items-center gap-2 group transition-all duration-200 hover:px-3.5 active:scale-95"
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

      {/* Mobile-only backdrop (zero blur, hidden on desktop so questions remain fully accessible) */}
      <div 
        className={`fixed inset-0 bg-slate-950/20 z-40 transition-opacity duration-300 lg:hidden ${
          isFormulaDrawerOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        }`}
        onClick={() => setIsFormulaDrawerOpen(false)}
      />

      {/* Slide-over Drawer Panel (Cart Line Items Style) - Optimized High Density */}
      <div 
        className={`fixed inset-y-0 right-0 z-50 w-full sm:w-[520px] md:w-[580px] lg:w-[620px] bg-white shadow-2xl flex flex-col border-l border-slate-200 transform transition-transform duration-300 ease-in-out ${
          isFormulaDrawerOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        {/* Drawer Header - Compact */}
        <div className="p-3 border-b border-slate-100 space-y-2 bg-gradient-to-b from-blue-50/70 via-white to-white shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-8 h-8 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-md shadow-blue-500/30 font-black">
                <Calculator className="w-4 h-4" />
              </span>
              <div>
                <h3 className="text-xs font-black uppercase tracking-wider text-slate-900 font-heading flex items-center gap-1.5">
                  <span>Formula & Symbol Studio</span>
                  <span className="bg-blue-100 text-blue-700 font-mono text-[9px] px-1.5 py-0.2 rounded-full font-bold">
                    200+ Symbols
                  </span>
                </h3>
                <span className="text-[10px] text-slate-500 font-medium">
                  Click any symbol to insert instantly into active target
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setIsFormulaDrawerOpen(false)}
              className="p-1.5 text-slate-400 hover:text-slate-800 rounded-lg hover:bg-slate-100 transition flex items-center gap-1 text-xs font-bold"
              title="Close Slider (Esc)"
            >
              <X className="w-4.5 h-4.5" />
            </button>
          </div>

          {/* In-Drawer Focused Field Live Editor & KaTeX Preview HUD */}
          <div className="bg-slate-900 text-white rounded-xl p-2.5 space-y-1.5 shadow-md border border-slate-800">
            {/* Target Question Switcher & Quick Locate */}
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-1.5 min-w-0">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse shrink-0"></span>
                <span className="text-[9px] font-black uppercase tracking-wider text-slate-400">Target:</span>
                <select
                  value={activeTarget.qIndex}
                  onChange={(e) => {
                    const newQ = Number(e.target.value);
                    setActiveTarget({ ...activeTarget, qIndex: newQ });
                    scrollToQuestion(newQ);
                  }}
                  className="bg-slate-800 text-blue-400 font-bold text-[11px] px-2 py-0.5 rounded-md border border-slate-700 focus:outline-none"
                >
                  {questions.map((_, qI) => (
                    <option key={qI} value={qI}>Question #{qI + 1}</option>
                  ))}
                </select>
              </div>

              <button
                type="button"
                onClick={() => scrollToQuestion(activeTarget.qIndex)}
                className="text-[9px] font-bold text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 px-2 py-0.5 rounded border border-slate-700 transition flex items-center gap-1 shrink-0"
                title="Scroll main page to this question card"
              >
                <span>Locate card</span>
                <ExternalLink className="w-2.5 h-2.5 text-slate-400" />
              </button>
            </div>

            {/* Dynamic Field Switcher Tabs for Active Question Type */}
            {(() => {
              const currentQ = questions[activeTarget.qIndex];
              const qType = currentQ?.type || "mcq";

              const availableFields: { id: string; label: string }[] = [
                { id: "text", label: "Statement" }
              ];

              if (qType === "mcq" || qType === "multi_select") {
                availableFields.push(
                  { id: "opt1", label: "Opt A" },
                  { id: "opt2", label: "Opt B" },
                  { id: "opt3", label: "Opt C" },
                  { id: "opt4", label: "Opt D" }
                );
              } else if (qType === "fill_blank") {
                availableFields.push({ id: "blank_answer", label: "Target Blank" });
              } else if (qType === "column_mapping") {
                (currentQ?.matching_pairs || []).forEach((_, pI) => {
                  availableFields.push({ id: `match_left_${pI}`, label: `Col A #${pI + 1}` });
                  availableFields.push({ id: `match_right_${pI}`, label: `Col B #${pI + 1}` });
                });
              } else if (qType === "short_answer") {
                availableFields.push({ id: "short_model_answer", label: "Model Answer" });
              } else if (qType === "long_answer") {
                availableFields.push({ id: "long_model_answer", label: "Model Derivation" });
              }

              availableFields.push({ id: "explanation", label: "Explanation" });

              return (
                <div className="flex flex-wrap gap-1 bg-slate-950/70 p-1 rounded-lg text-[9px] font-bold max-h-16 overflow-y-auto custom-scrollbar">
                  {availableFields.map((f) => (
                    <button
                      key={f.id}
                      type="button"
                      onClick={() => setActiveTarget({ ...activeTarget, field: f.id })}
                      className={`py-0.5 px-2 rounded transition text-center truncate ${
                        activeTarget.field === f.id
                          ? "bg-blue-600 text-white shadow-xs font-bold"
                          : "text-slate-400 hover:text-slate-200"
                      }`}
                    >
                      {f.label}
                    </button>
                  ))}
                </div>
              );
            })()}

            {/* Live In-Drawer Editable Input */}
            <div className="space-y-1">
              <div className="relative">
                {(() => {
                  const val = getFieldVal(questions[activeTarget.qIndex], activeTarget.field);
                  const isRtl = isRTLText(val);
                  const fontCls = isRtl ? (isUrduText(val) ? "font-urdu text-right text-sm" : "font-arabic text-right text-xs font-semibold") : "font-mono";
                  return (
                    <textarea
                      rows={1}
                      dir="auto"
                      value={val}
                      onChange={(e) => updateFieldVal(activeTarget.qIndex, activeTarget.field, e.target.value)}
                      placeholder="Click any symbol below or type directly..."
                      className={`w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1 text-xs text-emerald-300 placeholder:text-slate-600 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 resize-none leading-tight ${fontCls}`}
                    />
                  );
                })()}
              </div>

              {/* Real-time Live KaTeX Render Output */}
              <div className="bg-slate-950/90 border border-slate-800/80 rounded-lg px-2.5 py-1 min-h-[30px] flex items-center justify-between gap-2">
                {(() => {
                  const val = getFieldVal(questions[activeTarget.qIndex], activeTarget.field);
                  const isRtl = isRTLText(val);
                  const fontCls = isRtl ? (isUrduText(val) ? "font-urdu text-right text-sm" : "font-arabic text-right text-xs font-semibold") : "";
                  return (
                    <div
                      dir="auto"
                      key={`preview-${activeTarget.qIndex}-${activeTarget.field}-${val}`}
                      className={`render-math-target text-slate-100 text-xs font-serif overflow-x-auto py-0.5 leading-normal selection:bg-blue-600 flex-1 truncate ${fontCls}`}
                      dangerouslySetInnerHTML={{
                        __html: formatMarkdownPreview(val || "(empty field)")
                      }}
                    />
                  );
                })()}
                <button
                  type="button"
                  onClick={() => insertSnippet("$")}
                  className="text-[9px] font-bold text-amber-300 hover:text-amber-200 bg-amber-400/10 hover:bg-amber-400/20 px-1.5 py-0.5 rounded border border-amber-400/30 transition shrink-0"
                >
                  Wrap $
                </button>
              </div>
            </div>
          </div>

          {/* Rich Text Quick Formatter Strip */}
          <div className="flex items-center justify-between gap-1 bg-slate-50 px-2 py-1 rounded-lg border border-slate-200">
            <div className="flex items-center gap-0.5">
              <button
                type="button"
                onClick={() => insertSnippet("**bold text**")}
                className="p-1 rounded hover:bg-white text-slate-700 hover:shadow-xs transition"
                title="Bold (**text**)"
              >
                <Bold className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => insertSnippet("*italic text*")}
                className="p-1 rounded hover:bg-white text-slate-700 hover:shadow-xs transition"
                title="Italic (*text*)"
              >
                <Italic className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => insertSnippet("<u>underlined text</u>")}
                className="p-1 rounded hover:bg-white text-slate-700 hover:shadow-xs transition"
                title="Underline (<u>text</u>)"
              >
                <Underline className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => insertSnippet("`code`")}
                className="p-1 rounded hover:bg-white text-slate-700 hover:shadow-xs transition"
                title="Inline Code (`code`)"
              >
                <Code className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => insertSnippet("> quote")}
                className="p-1 rounded hover:bg-white text-slate-700 hover:shadow-xs transition"
                title="Blockquote"
              >
                <Quote className="w-3.5 h-3.5" />
              </button>
            </div>

            <button
              type="button"
              onClick={() => setShowEquationModal(true)}
              className="flex items-center gap-1 text-[11px] font-bold text-blue-700 hover:text-blue-900 bg-white px-2 py-0.5 rounded border border-blue-200 hover:bg-blue-50 transition shadow-2xs"
              title="Open Interactive Equation Composer Modal"
            >
              <Sparkles className="w-3 h-3 text-blue-600" />
              <span>Composer</span>
            </button>
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
                className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>

          {/* Category Switcher Tabs */}
          {!searchQuery && (
            <div className="grid grid-cols-4 sm:grid-cols-7 gap-1 pt-0.5">
              {FORMULA_CATEGORIES.map((cat) => {
                const Icon = cat.icon;
                const isActive = formulaCategory === cat.id;

                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setFormulaCategory(cat.id as any)}
                    className={`py-1 px-1 rounded-lg text-[9.5px] font-bold flex flex-col items-center justify-center gap-0.5 border transition ${
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

        {/* Scrollable Symbol Body - High Density Grid for Maximum Visible Items */}
        <div className="p-3 overflow-y-auto flex-1 space-y-2.5 custom-scrollbar">
          {searchQuery ? (
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider">
                  Search Results
                </span>
                <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">
                  {
                    ALL_MATH_SYMBOLS.filter((s) =>
                      (s.label + " " + s.title + " " + s.kw + " " + s.insert)
                        .toLowerCase()
                        .includes(searchQuery.toLowerCase().trim())
                    ).length
                  } Matches
                </span>
              </div>

              <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 gap-1.5">
                {ALL_MATH_SYMBOLS.filter((s) =>
                  (s.label + " " + s.title + " " + s.kw + " " + s.insert)
                    .toLowerCase()
                    .includes(searchQuery.toLowerCase().trim())
                ).map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => insertSnippet(item.insert)}
                    title={`${item.title}: Click to insert ${item.insert}`}
                    className="h-8 px-1 rounded-lg bg-slate-50/90 hover:bg-blue-50 text-slate-800 hover:text-blue-700 text-[11px] font-serif font-bold border border-slate-200 hover:border-blue-400 transition-all text-center shadow-2xs hover:shadow-xs flex items-center justify-center group active:scale-95"
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
                    ({ALL_MATH_SYMBOLS.filter((s) => s.cat === formulaCategory).length} items)
                  </span>
                </span>
                <span className="text-[10px] font-mono text-slate-400">Click to insert</span>
              </div>

              {/* High Density Symbols Grid */}
              <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 gap-1.5">
                {ALL_MATH_SYMBOLS.filter((s) => s.cat === formulaCategory).map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => insertSnippet(item.insert)}
                    title={`${item.title}: Click to insert ${item.insert}`}
                    className="h-8 px-1 rounded-lg bg-slate-50/90 hover:bg-blue-50 text-slate-800 hover:text-blue-700 text-[11px] font-serif font-bold border border-slate-200 hover:border-blue-400 transition-all text-center shadow-2xs hover:shadow-xs flex items-center justify-center group active:scale-95"
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

        {/* Drawer Footer: Prebuilt Theorems & Close - Compact */}
        <div className="p-2.5 px-3 border-t border-slate-200 bg-slate-50 space-y-1.5 shrink-0">
          <div className="space-y-1">
            <span className="text-[9px] font-bold uppercase tracking-wider text-slate-500 block">
              Prebuilt Theorems & Identities
            </span>
            <select
              onChange={(e) => {
                if (e.target.value) {
                  insertSnippet(e.target.value);
                  e.target.value = "";
                }
              }}
              className="w-full px-2.5 py-1.5 rounded-lg bg-white border border-slate-200 text-xs font-semibold text-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="">+ Insert Complete Theorem...</option>
              <option value="$x = \\frac{-b \\pm \\sqrt{b^2 - 4ac}}{2a}$">Quadratic Formula</option>
              <option value="$a^2 + b^2 = c^2$">Pythagorean Theorem</option>
              <option value="$E = mc^2$">Mass-Energy (E=mc²)</option>
              <option value="$\\vec{F} = m\\vec{a}$">Newton's 2nd Law (F=ma)</option>
              <option value="$\\lim_{x \\to 0} \\frac{\\sin x}{x} = 1$">Calculus Limit Identity</option>
              <option value="$\\int_a^b f(x)\\,dx = F(b) - F(a)$">Fundamental Theorem of Calculus</option>
              <option value="$A = \\pi r^2$">Circle Area Formula</option>
              <option value="$(a+b)^n = \\sum_{k=0}^n \\binom{n}{k} a^{n-k} b^k$">Binomial Theorem</option>
              <option value="$e^{i\\pi} + 1 = 0$">Euler's Identity</option>
              <option value="$\\sigma = \\sqrt{\\frac{1}{N}\\sum_{i=1}^N (x_i - \\mu)^2}$">Standard Deviation</option>
              <option value="$PV = nRT$">Ideal Gas Law (PV=nRT)</option>
              <option value="$V = IR$">Ohm's Law (V=IR)</option>
            </select>
          </div>

          <div className="flex items-center justify-between gap-2 pt-0.5">
            <button
              type="button"
              onClick={() => setShowEquationModal(true)}
              className="text-xs font-bold text-blue-700 hover:text-blue-800 flex items-center gap-1.5"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Custom Composer</span>
            </button>

            <button
              type="button"
              onClick={() => setIsFormulaDrawerOpen(false)}
              className="bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs px-4 py-1.5 rounded-lg transition shadow-sm"
            >
              Done & Close
            </button>
          </div>
        </div>

      </div>



      {/* Interactive Math Equation Modal */}
      {showEquationModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 space-y-4 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900 font-heading flex items-center gap-2">
                <Calculator className="w-5 h-5 text-blue-600" />
                <span>Interactive KaTeX Equation Composer</span>
              </h3>
              <button
                type="button"
                onClick={() => setShowEquationModal(false)}
                className="text-slate-400 hover:text-slate-700 font-bold text-sm"
              >
                ✕
              </button>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">LaTeX Code</label>
              <input
                type="text"
                value={customEquation}
                onChange={(e) => setCustomEquation(e.target.value)}
                placeholder="e.g. \frac{d}{dx} \left( e^x \right) = e^x"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm font-mono"
              />
            </div>

            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 text-center">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-2">Live Math Preview:</span>
              <div
                className="render-math-target text-lg text-slate-900 font-serif"
                dangerouslySetInnerHTML={{ __html: `$${customEquation.startsWith("$") ? customEquation : `$${customEquation}$`}` }}
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowEquationModal(false)}
                className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  const toInsert = customEquation.startsWith("$") ? customEquation : `$${customEquation}$`;
                  insertSnippet(toInsert);
                  setShowEquationModal(false);
                }}
                className="px-4 py-2 text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-sm transition"
              >
                Insert into {targetLabel()}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Visual Shape & Diagram Library Modal */}
      {shapePickerTarget && (
        <div 
          className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6"
          onClick={() => setShapePickerTarget(null)}
        >
          <div 
            className={`bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-4xl w-full max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150 transition-all ${
              isDraggingShape ? "ring-4 ring-amber-500/50 border-amber-400" : ""
            }`}
            onClick={(e) => e.stopPropagation()}
            onDragOver={(e) => {
              e.preventDefault();
              setIsDraggingShape(true);
            }}
            onDragLeave={() => setIsDraggingShape(false)}
            onDrop={(e) => {
              e.preventDefault();
              setIsDraggingShape(false);
              const dropped = e.dataTransfer.files?.[0];
              if (dropped) handleUploadShapeFile(dropped);
            }}
          >
            {/* Modal Header */}
            <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-amber-500/10 via-blue-500/5 to-purple-500/10">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-amber-500 text-white flex items-center justify-center shadow-xs">
                  <Shapes className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900 font-heading">
                    Non-Verbal Intelligence Shape Library
                  </h3>
                  <div className="flex items-center gap-2 text-xs text-slate-500 font-medium">
                    <span>Target:{" "}
                      <strong className="text-amber-700">
                        {shapePickerTarget.targetType === "problem" 
                          ? `Problem Figure #${shapePickerTarget.slotIndex + 1}` 
                          : `Answer Option ${String.fromCharCode(65 + shapePickerTarget.slotIndex)}`}
                      </strong>
                    </span>
                    <span>•</span>
                    <span className="text-emerald-700 font-bold flex items-center gap-0.5">
                      <Cloud className="w-3 h-3" />
                      Cloudflare R2 Synced
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => shapeFileInputRef.current?.click()}
                  disabled={isUploadingShape}
                  className="px-3 py-1.5 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs transition active:scale-95 cursor-pointer disabled:opacity-50"
                  title="Upload SVG, PNG, JPG, or WEBP from local drive"
                >
                  {isUploadingShape ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <FolderUp className="w-3.5 h-3.5" />
                  )}
                  <span>{isUploadingShape ? "Storing in R2..." : "Select from Drive"}</span>
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
                  onClick={() => setShapePickerTarget(null)}
                  className="w-8 h-8 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-800 flex items-center justify-center transition"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Upload Notification */}
            {isUploadingShape && (
              <div className="bg-amber-50 border-b border-amber-200 px-4 py-2 flex items-center gap-2 text-xs text-amber-900 animate-pulse">
                <Loader2 className="w-4 h-4 animate-spin text-amber-600 shrink-0" />
                <span>Storing shape systematically in Cloudflare R2 bucket (<strong>sharp-materials</strong>)...</span>
              </div>
            )}

            {uploadError && (
              <div className="bg-rose-50 border-b border-rose-200 px-4 py-2 flex items-center justify-between text-xs text-rose-800">
                <span className="font-medium">{uploadError}</span>
                <button type="button" onClick={() => setUploadError(null)} className="font-bold text-rose-600 hover:text-rose-800 ml-2">✕</button>
              </div>
            )}

            {/* Filter and Search Bar */}
            <div className="p-4 border-b border-slate-100 space-y-3 bg-slate-50/50">
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={shapeSearch}
                  onChange={(e) => setShapeSearch(e.target.value)}
                  placeholder="Search shapes by name, tags, or custom uploads..."
                  className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-amber-500 bg-white"
                />
                {shapeSearch && (
                  <button
                    type="button"
                    onClick={() => setShapeSearch("")}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Category Pills + Custom Uploads */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
                {/* All Shapes */}
                <button
                  type="button"
                  onClick={() => setShapeCategory("all")}
                  className={`px-3 py-1.5 rounded-xl font-bold whitespace-nowrap transition flex items-center gap-1.5 ${
                    shapeCategory === "all"
                      ? "bg-amber-600 text-white shadow-xs"
                      : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
                  }`}
                >
                  <span>All Shapes</span>
                  <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                    shapeCategory === "all" ? "bg-amber-700 text-amber-100" : "bg-slate-100 text-slate-500"
                  }`}>
                    {SHAPE_LIBRARY.length + customShapes.length}
                  </span>
                </button>

                {/* Custom Uploads */}
                <button
                  type="button"
                  onClick={() => setShapeCategory("custom")}
                  className={`px-3 py-1.5 rounded-xl font-bold whitespace-nowrap transition flex items-center gap-1.5 ${
                    shapeCategory === "custom"
                      ? "bg-orange-600 text-white shadow-xs"
                      : "bg-orange-50 text-orange-800 hover:bg-orange-100 border border-orange-200"
                  }`}
                >
                  <span>📁 Custom Uploads</span>
                  <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                    shapeCategory === "custom" ? "bg-orange-700 text-orange-100" : "bg-orange-200 text-orange-900"
                  }`}>
                    {customShapes.length}
                  </span>
                </button>

                {/* Built-in Categories */}
                {SHAPE_CATEGORIES.filter(cat => cat.id !== "all").map((cat) => {
                  const count = SHAPE_LIBRARY.filter(s => s.category === cat.id).length;
                  const isActive = shapeCategory === cat.id;
                  return (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => setShapeCategory(cat.id)}
                      className={`px-3 py-1.5 rounded-xl font-bold whitespace-nowrap transition flex items-center gap-1.5 ${
                        isActive
                          ? "bg-amber-600 text-white shadow-xs"
                          : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
                      }`}
                    >
                      <span>{cat.label}</span>
                      <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                        isActive ? "bg-amber-700 text-amber-100" : "bg-slate-100 text-slate-500"
                      }`}>
                        {count}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Shapes Grid Canvas */}
            <div className="p-4 sm:p-5 overflow-y-auto flex-1 max-h-[55vh] relative min-h-[220px]">
              {isDraggingShape && (
                <div className="absolute inset-2 z-20 rounded-2xl border-2 border-dashed border-amber-500 bg-amber-50/95 flex flex-col items-center justify-center text-amber-800 pointer-events-none gap-2 animate-in fade-in">
                  <UploadCloud className="w-10 h-10 text-amber-600 animate-bounce" />
                  <p className="font-bold text-sm">Drop shape file here to store in Cloudflare R2!</p>
                  <p className="text-xs text-amber-600">Supports SVG, PNG, JPG, WEBP</p>
                </div>
              )}

              {(() => {
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
                  const matchesCat = shapeCategory === "all" || s.category === shapeCategory;
                  const q = shapeSearch.toLowerCase().trim();
                  const matchesSearch = !q || s.name.toLowerCase().includes(q) || s.tags.some(t => t.toLowerCase().includes(q));
                  return matchesCat && matchesSearch;
                });

                if (filtered.length === 0) {
                  return (
                    <div className="text-center py-10 px-4 flex flex-col items-center justify-center">
                      <div className="w-14 h-14 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mb-3 border border-amber-200 shadow-2xs">
                        <FolderUp className="w-7 h-7" />
                      </div>
                      <h5 className="font-bold text-sm text-slate-800">
                        {shapeCategory === "custom" && customShapes.length === 0
                          ? "No custom shapes uploaded yet"
                          : `No shapes found matching "${shapeSearch}"`}
                      </h5>
                      <p className="text-xs text-slate-500 max-w-sm mt-1 mb-4">
                        If no shape is available in this list, you can select it from your drive. It will be stored systematically at Cloudflare R2 for ongoing usage.
                      </p>
                      <button
                        type="button"
                        onClick={() => shapeFileInputRef.current?.click()}
                        disabled={isUploadingShape}
                        className="px-4 py-2 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 text-white font-bold text-xs rounded-xl flex items-center gap-2 shadow-xs transition"
                      >
                        <FolderUp className="w-4 h-4" />
                        <span>Select Shape from Drive (SVG / PNG / JPG)</span>
                      </button>
                    </div>
                  );
                }

                return (
                  <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-3">
                    {filtered.map((item: any) => (
                      <div
                        key={item.id}
                        onClick={() => {
                          const { qIndex, targetType, slotIndex } = shapePickerTarget;
                          if (targetType === "problem") {
                            const copy = [...(questions[qIndex].nv_problem_images || [])];
                            copy[slotIndex] = item.svg;
                            updateField(qIndex, "nv_problem_images", copy);
                          } else {
                            const copy = [...(questions[qIndex].nv_options || [])];
                            copy[slotIndex] = { ...copy[slotIndex], image_url: item.svg };
                            updateField(qIndex, "nv_options", copy);
                          }
                          setShapePickerTarget(null);
                        }}
                        className="group flex flex-col items-center p-2.5 rounded-2xl border-2 border-slate-200 hover:border-amber-500 hover:bg-amber-50/40 bg-white hover:shadow-md transition text-left relative overflow-hidden cursor-pointer"
                      >
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

                        <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-xl bg-slate-50 group-hover:bg-white p-1 flex items-center justify-center mb-2 transition">
                          <img src={item.svg} alt={item.name} className="w-full h-full object-contain" />
                        </div>
                        <span className="text-[10px] font-bold text-slate-700 group-hover:text-amber-900 leading-tight text-center line-clamp-2 w-full">
                          {item.name}
                        </span>
                        <span className="mt-1 text-[9px] font-black text-amber-600 opacity-0 group-hover:opacity-100 transition">
                          + Insert Shape
                        </span>
                      </div>
                    ))}
                  </div>
                );
              })()}
            </div>

            {/* Footer */}
            <div className="p-3 sm:p-4 border-t border-slate-100 bg-slate-50 flex items-center justify-between text-xs text-slate-500">
              <div className="flex items-center gap-1.5 text-slate-500 text-[11px]">
                <Cloud className="w-3.5 h-3.5 text-blue-500" />
                <span>Cloudflare R2: <strong>shapes/custom/*</strong> • SVG, PNG, JPG, WEBP</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => shapeFileInputRef.current?.click()}
                  className="px-2.5 py-1 text-amber-700 hover:bg-amber-100/60 font-bold rounded-lg transition flex items-center gap-1 text-[11px]"
                >
                  <FolderUp className="w-3 h-3" />
                  <span>Upload More</span>
                </button>
                <button
                  type="button"
                  onClick={() => setShapePickerTarget(null)}
                  className="px-4 py-1.5 rounded-xl bg-slate-200 hover:bg-slate-300 font-bold text-slate-700 transition"
                >
                  Close
                </button>
              </div>
            </div>
          </div>

        </div>
      )}

      {/* 4. Question Bank Import Drawer */}
      <QuestionBankDrawer
        isOpen={isBankDrawerOpen}
        onClose={() => setIsBankDrawerOpen(false)}
        currentCourseId={examMeta.courseId}
        courses={courses}
        onImportQuestions={handleImportBankQuestions}
        alreadyImportedIds={questions.map((q) => q.bank_question_id).filter(Boolean) as number[]}
      />
    </form>
  );
}
