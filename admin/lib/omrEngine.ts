export interface OmrOption {
  id: string;
  label: string; // "A", "B", "C", "D", "E"
  text?: string;
  image_url?: string;
  is_correct: boolean;
}

export interface OmrQuestion {
  id: number;
  original_number: number;
  set_number?: number;
  question_text: string;
  question_type: string;
  marks: number;
  explanation?: string;
  options: OmrOption[];
  correct_answer_raw: string;
  correct_letter: string; // "A", "B", "C", "D", or "E"
  sub_type?: string;
  metadata?: any;
}

export interface OmrSet {
  id?: number;
  exam_id: number;
  set_code: string;       // e.g. "SET-A", "CODE-B"
  set_number: number;     // 1 to K
  seed: number;
  questions: OmrQuestion[];
  answer_key: Record<number, string>; // { 1: "B", 2: "D", 3: "A", ... }
  questions_order: number[];          // Original question IDs in this set's order
}

export interface OmrCandidate {
  student_id?: number;
  registration_no?: string;
  student_name: string;
  roll_number?: string;
  father_name?: string;
  seat_number?: string;
  set_code?: string;
  barcode?: string;
}

export interface OmrExamPack {
  exam: {
    id: number;
    title: string;
    course_title?: string;
    course_code?: string;
    duration_minutes: number;
    total_marks: number;
    passing_marks: number;
    bubble_count: number; // 5 for A-E
    set_count: number;
  };
  sets: OmrSet[];
  allocations: Array<OmrCandidate & { set_code: string; barcode: string; omr_set_id?: number }>;
}

// Reproducible Mulberry32 PRNG for deterministic set generation
function createPRNG(seed: number) {
  let a = seed >>> 0;
  return function () {
    let t = (a += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Fisher-Yates shuffle with custom PRNG
function shuffleArray<T>(array: T[], prng: () => number): T[] {
  const result = [...array];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(prng() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

// Generate Standard Set Labels: "SET-A", "SET-B", "SET-C", "SET-D"... or "BATCH-01"
export function getSetCode(index: number, totalSets: number): string {
  if (totalSets <= 26) {
    const letter = String.fromCharCode(65 + index); // A, B, C, D...
    return `SET-${letter}`;
  }
  return `BATCH-${String(index + 1).padStart(2, "0")}`;
}

// Parse Raw Question into Standardized OmrQuestion
export function parseRawExamQuestion(q: any, originalIndex: number): OmrQuestion {
  let optData: any = null;
  try {
    optData = q.options_json ? (typeof q.options_json === "string" ? JSON.parse(q.options_json) : q.options_json) : null;
  } catch {
    optData = null;
  }

  const qType = q.question_type || "mcq";
  const options: OmrOption[] = [];
  const correctAnswerRaw = String(q.correct_answer || "").trim();
  let correctLetter = "A";

  if (qType === "mcq" && Array.isArray(optData)) {
    optData.forEach((opt: any, idx: number) => {
      const label = String.fromCharCode(65 + idx); // A, B, C, D, E
      const isCorrect = String(opt.id) === correctAnswerRaw || String(idx + 1) === correctAnswerRaw || label === correctAnswerRaw.toUpperCase();
      if (isCorrect) correctLetter = label;
      options.push({
        id: String(opt.id || idx + 1),
        label,
        text: opt.text || "",
        image_url: opt.image_url,
        is_correct: isCorrect
      });
    });
  } else if (qType === "true_false") {
    const isTrue = correctAnswerRaw.toLowerCase() === "true";
    correctLetter = isTrue ? "A" : "B";
    options.push(
      { id: "true", label: "A", text: "True (صحیح)", is_correct: isTrue },
      { id: "false", label: "B", text: "False (غلط)", is_correct: !isTrue }
    );
  } else if (qType === "non_verbal") {
    const rawOpts = Array.isArray(optData?.options) ? optData.options : [];
    rawOpts.forEach((opt: any, idx: number) => {
      const label = String.fromCharCode(65 + idx);
      const isCorrect = String(opt.id) === correctAnswerRaw || String(idx + 1) === correctAnswerRaw || label === correctAnswerRaw.toUpperCase();
      if (isCorrect) correctLetter = label;
      options.push({
        id: String(opt.id || idx + 1),
        label,
        text: opt.text || `Option ${label}`,
        image_url: opt.image_url,
        is_correct: isCorrect
      });
    });
  } else if (qType === "verbal_reasoning") {
    const rawOpts = Array.isArray(optData?.options) ? optData.options : [];
    rawOpts.forEach((opt: any, idx: number) => {
      const label = String.fromCharCode(65 + idx);
      const isCorrect = String(opt.id) === correctAnswerRaw || String(idx + 1) === correctAnswerRaw || label === correctAnswerRaw.toUpperCase();
      if (isCorrect) correctLetter = label;
      options.push({
        id: String(opt.id || idx + 1),
        label,
        text: opt.text || "",
        is_correct: isCorrect
      });
    });
  } else {
    // Fallback default options A-D
    for (let i = 0; i < 4; i++) {
      const label = String.fromCharCode(65 + i);
      const isCorrect = label === correctAnswerRaw.toUpperCase();
      if (isCorrect) correctLetter = label;
      options.push({
        id: String(i + 1),
        label,
        text: `Option ${label}`,
        is_correct: isCorrect
      });
    }
  }

  // Ensure options have up to 5 items if padded, or retain their count
  return {
    id: q.id,
    original_number: originalIndex + 1,
    question_text: q.question_text || "",
    question_type: qType,
    marks: q.marks || 1,
    explanation: q.explanation || "",
    options,
    correct_answer_raw: correctAnswerRaw,
    correct_letter: correctLetter,
    sub_type: optData?.sub_type,
    metadata: optData
  };
}

// Generate K Shuffled Sets with accurate answer key mappings
export function generateOmrSets(
  examId: number,
  rawQuestions: any[],
  setCount: number = 4,
  shuffleOptions: boolean = true
): OmrSet[] {
  const masterQuestions = rawQuestions.map((q, idx) => parseRawExamQuestion(q, idx));
  const sets: OmrSet[] = [];

  for (let s = 0; s < setCount; s++) {
    const setCode = getSetCode(s, setCount);
    const setSeed = examId * 7919 + (s + 1) * 31337;
    const prng = createPRNG(setSeed);

    // 1. Permute questions for this set
    // Set 0 (Set A) can keep original sequence for baseline verification, or shuffle all sets
    const shuffledQuestions = s === 0 ? [...masterQuestions] : shuffleArray(masterQuestions, prng);

    const setQuestions: OmrQuestion[] = [];
    const answerKey: Record<number, string> = {};
    const questionsOrder: number[] = [];

    shuffledQuestions.forEach((q, qIdx) => {
      const newQuestionNumber = qIdx + 1;
      questionsOrder.push(q.id);

      let finalOptions = [...q.options];
      if (shuffleOptions && q.question_type !== "true_false") {
        // Circular shift or Fisher-Yates permutation for options based on set seed and question ID
        const optPrng = createPRNG(setSeed + q.id * 101);
        finalOptions = shuffleArray(finalOptions, optPrng);
      }

      // Re-assign letter labels A, B, C, D, E based on new positions
      let newCorrectLetter = "A";
      const relabeledOptions: OmrOption[] = finalOptions.map((opt, optIdx) => {
        const letter = String.fromCharCode(65 + optIdx);
        if (opt.is_correct) {
          newCorrectLetter = letter;
        }
        return {
          ...opt,
          label: letter
        };
      });

      answerKey[newQuestionNumber] = newCorrectLetter;

      setQuestions.push({
        ...q,
        set_number: newQuestionNumber,
        options: relabeledOptions,
        correct_letter: newCorrectLetter
      });
    });

    sets.push({
      exam_id: examId,
      set_code: setCode,
      set_number: s + 1,
      seed: setSeed,
      questions: setQuestions,
      answer_key: answerKey,
      questions_order: questionsOrder
    });
  }

  return sets;
}

// Allocate candidates to sets in round-robin sequence to guarantee adjacent seat diversity
export function allocateCandidatesToSets(
  examId: number,
  candidates: OmrCandidate[],
  sets: OmrSet[]
): Array<OmrCandidate & { set_code: string; barcode: string; omr_set_id?: number }> {
  if (sets.length === 0) return [];

  return candidates.map((cand, idx) => {
    const setIndex = idx % sets.length;
    const assignedSet = sets[setIndex];
    const seatNumber = cand.seat_number || String(idx + 1).padStart(3, "0");
    const safeStudentId = cand.student_id ? `ST${cand.student_id}` : `CAND${idx + 1}`;
    const barcode = `OMR-EX${examId}-${safeStudentId}-${assignedSet.set_code}`;

    return {
      ...cand,
      seat_number: seatNumber,
      set_code: assignedSet.set_code,
      barcode,
      omr_set_id: assignedSet.id
    };
  });
}
