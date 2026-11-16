import * as XLSX from "xlsx";
import { getShapeSvg, SHAPE_LIBRARY } from "@/app/admin/exams/new/nonVerbalShapes";

export interface CourseRef {
  id: number;
  title: string;
  code: string;
}

export interface ParsedQuestionRow {
  rowNumber: number;
  course_id: number;
  course_code: string;
  topic: string;
  difficulty: "easy" | "medium" | "hard";
  question_type: string;
  marks: number;
  question_text: string;
  options_json: string;
  correct_answer: string;
  explanation: string;
  tags: string;
  isValid: boolean;
  errors: string[];
}

// Generate Excel Template tailored to Question Type
export function generateQuestionBankTemplate(
  questionType: string,
  courses: CourseRef[],
  selectedCourseId?: string
) {
  const wb = XLSX.utils.book_new();
  const selectedCourse = courses.find(c => String(c.id) === selectedCourseId) || courses[0];
  const sampleCode = selectedCourse ? selectedCourse.code : "CS-101";

  let headers: string[] = [];
  let sampleRows: any[] = [];

  if (questionType === "mcq") {
    headers = [
      "Course Code",
      "Topic",
      "Difficulty",
      "Marks",
      "Question Statement",
      "Option 1",
      "Option 2",
      "Option 3",
      "Option 4",
      "Correct Option (1-4)",
      "Explanation",
      "Tags"
    ];
    sampleRows = [
      {
        "Course Code": sampleCode,
        "Topic": "Calculus - Derivatives",
        "Difficulty": "medium",
        "Marks": 10,
        "Question Statement": "What is the first derivative of $f(x) = x^3 + 4x$ with respect to $x$?",
        "Option 1": "$3x^2 + 4$",
        "Option 2": "$3x^2$",
        "Option 3": "$x^2 + 4$",
        "Option 4": "$3x + 4$",
        "Correct Option (1-4)": "1",
        "Explanation": "Applying the power rule: d/dx(x^3) = 3x^2 and d/dx(4x) = 4.",
        "Tags": "calculus, derivatives, power-rule"
      },
      {
        "Course Code": sampleCode,
        "Topic": "Physics - Mechanics",
        "Difficulty": "easy",
        "Marks": 5,
        "Question Statement": "Which physical quantity is represented by the formula $\\vec{F} = m\\vec{a}$?",
        "Option 1": "Force",
        "Option 2": "Velocity",
        "Option 3": "Momentum",
        "Option 4": "Energy",
        "Correct Option (1-4)": "1",
        "Explanation": "Newton's Second Law defines Net Force as mass times acceleration.",
        "Tags": "physics, newton-laws"
      }
    ];
  } else if (questionType === "multi_select") {
    headers = [
      "Course Code",
      "Topic",
      "Difficulty",
      "Marks",
      "Question Statement",
      "Option 1",
      "Option 2",
      "Option 3",
      "Option 4",
      "Correct Options (e.g. 1, 3)",
      "Explanation",
      "Tags"
    ];
    sampleRows = [
      {
        "Course Code": sampleCode,
        "Topic": "Mathematics - Prime Numbers",
        "Difficulty": "medium",
        "Marks": 10,
        "Question Statement": "Select all prime numbers from the options below:",
        "Option 1": "2",
        "Option 2": "4",
        "Option 3": "17",
        "Option 4": "21",
        "Correct Options (e.g. 1, 3)": "1, 3",
        "Explanation": "2 and 17 have only two divisors: 1 and themselves.",
        "Tags": "numbers, primes"
      }
    ];
  } else if (questionType === "true_false") {
    headers = [
      "Course Code",
      "Topic",
      "Difficulty",
      "Marks",
      "Question Statement",
      "Correct Answer (True/False)",
      "Explanation",
      "Tags"
    ];
    sampleRows = [
      {
        "Course Code": sampleCode,
        "Topic": "Physics - Light",
        "Difficulty": "easy",
        "Marks": 5,
        "Question Statement": "The speed of light in vacuum is approximately $3 \\times 10^8 \\text{ m/s}$.",
        "Correct Answer (True/False)": "True",
        "Explanation": "In vacuum, light travels at constant c ≈ 299,792,458 m/s.",
        "Tags": "physics, optics, light"
      },
      {
        "Course Code": sampleCode,
        "Topic": "Chemistry - Elements",
        "Difficulty": "easy",
        "Marks": 5,
        "Question Statement": "Water molecule ($H_2O$) consists of two Oxygen atoms and one Hydrogen atom.",
        "Correct Answer (True/False)": "False",
        "Explanation": "Water has two Hydrogen atoms and one Oxygen atom.",
        "Tags": "chemistry, molecules"
      }
    ];
  } else if (questionType === "fill_blank") {
    headers = [
      "Course Code",
      "Topic",
      "Difficulty",
      "Marks",
      "Question Statement",
      "Blank Answer",
      "Alternative Answers (pipe separated | )",
      "Explanation",
      "Tags"
    ];
    sampleRows = [
      {
        "Course Code": sampleCode,
        "Topic": "Physics - Units",
        "Difficulty": "medium",
        "Marks": 5,
        "Question Statement": "The SI unit of electrical resistance is the ____.",
        "Blank Answer": "Ohm",
        "Alternative Answers (pipe separated | )": "ohms | Ω",
        "Explanation": "Resistance is measured in Ohms (symbol: Ω).",
        "Tags": "electricity, units"
      }
    ];
  } else if (questionType === "numerical") {
    headers = [
      "Course Code",
      "Topic",
      "Difficulty",
      "Marks",
      "Question Statement",
      "Exact Value",
      "Tolerance",
      "Unit",
      "Explanation",
      "Tags"
    ];
    sampleRows = [
      {
        "Course Code": sampleCode,
        "Topic": "Physics - Gravitation",
        "Difficulty": "easy",
        "Marks": 10,
        "Question Statement": "Calculate the weight in Newtons of a 10 kg mass on Earth ($g = 9.8 \\text{ m/s}^2$).",
        "Exact Value": "98",
        "Tolerance": "0.5",
        "Unit": "N",
        "Explanation": "W = m * g = 10 * 9.8 = 98 N.",
        "Tags": "physics, gravity, weight"
      }
    ];
  } else if (questionType === "column_mapping") {
    headers = [
      "Course Code",
      "Topic",
      "Difficulty",
      "Marks",
      "Question Statement",
      "Pair 1 Left",
      "Pair 1 Right",
      "Pair 2 Left",
      "Pair 2 Right",
      "Pair 3 Left",
      "Pair 3 Right",
      "Pair 4 Left",
      "Pair 4 Right",
      "Explanation",
      "Tags"
    ];
    sampleRows = [
      {
        "Course Code": sampleCode,
        "Topic": "Physics - Units Mapping",
        "Difficulty": "medium",
        "Marks": 10,
        "Question Statement": "Match each physical quantity in Column A with its SI unit in Column B:",
        "Pair 1 Left": "Force ($F$)",
        "Pair 1 Right": "Newton (N)",
        "Pair 2 Left": "Energy ($E$)",
        "Pair 2 Right": "Joule (J)",
        "Pair 3 Left": "Power ($P$)",
        "Pair 3 Right": "Watt (W)",
        "Pair 4 Left": "Frequency ($f$)",
        "Pair 4 Right": "Hertz (Hz)",
        "Explanation": "Standard SI base and derived physical units.",
        "Tags": "physics, units, matching"
      }
    ];
  } else if (questionType === "non_verbal") {
    headers = [
      "Course Code",
      "Topic",
      "Difficulty",
      "Marks",
      "Question Statement",
      "Sub Type (series / analogy / matrix / odd_one_out)",
      "Problem Figure 1 (Shape Key or URL)",
      "Problem Figure 2 (Shape Key or URL)",
      "Problem Figure 3 (Shape Key or URL)",
      "Target Slot (?) Placeholder",
      "Option A (Shape Key or URL)",
      "Option B (Shape Key or URL)",
      "Option C (Shape Key or URL)",
      "Option D (Shape Key or URL)",
      "Correct Option (A-D or 1-4)",
      "Explanation",
      "Tags"
    ];
    sampleRows = [
      {
        "Course Code": sampleCode,
        "Topic": "Non-Verbal - Series Rotations",
        "Difficulty": "medium",
        "Marks": 10,
        "Question Statement": "Look at the pattern sequence below. Which figure should logically replace the question mark (?) in the series?",
        "Sub Type (series / analogy / matrix / odd_one_out)": "series",
        "Problem Figure 1 (Shape Key or URL)": "quad_tr",
        "Problem Figure 2 (Shape Key or URL)": "quad_br",
        "Problem Figure 3 (Shape Key or URL)": "quad_bl",
        "Target Slot (?) Placeholder": "[?] Next Missing Shape (Solved by Option A-D)",
        "Option A (Shape Key or URL)": "quad_tl",
        "Option B (Shape Key or URL)": "quad_tr",
        "Option C (Shape Key or URL)": "quad_br",
        "Option D (Shape Key or URL)": "half_top",
        "Correct Option (A-D or 1-4)": "A",
        "Explanation": "The shaded quadrant moves 90° clockwise in each consecutive figure: Top-Right (Fig 1) ➔ Bottom-Right (Fig 2) ➔ Bottom-Left (Fig 3). The next figure at the [?] target slot must have the Top-Left quadrant shaded (Option A).",
        "Tags": "non-verbal, series, rotation, quadrants"
      },
      {
        "Course Code": sampleCode,
        "Topic": "Non-Verbal - Directional Arrows",
        "Difficulty": "medium",
        "Marks": 10,
        "Question Statement": "Which figure logically completes the arrow rotation series at the question mark (?) position?",
        "Sub Type (series / analogy / matrix / odd_one_out)": "series",
        "Problem Figure 1 (Shape Key or URL)": "arrow_0",
        "Problem Figure 2 (Shape Key or URL)": "arrow_45",
        "Problem Figure 3 (Shape Key or URL)": "arrow_90",
        "Target Slot (?) Placeholder": "[?] Next Missing Shape (Solved by Option A-D)",
        "Option A (Shape Key or URL)": "arrow_135",
        "Option B (Shape Key or URL)": "arrow_180",
        "Option C (Shape Key or URL)": "arrow_270",
        "Option D (Shape Key or URL)": "arrow_315",
        "Correct Option (A-D or 1-4)": "A",
        "Explanation": "Each arrow rotates 45° clockwise: 0° Up ➔ 45° Up-Right ➔ 90° Right. The next figure at [?] must be rotated 135° Down-Right (Option A).",
        "Tags": "non-verbal, arrows, rotation"
      },
      {
        "Course Code": sampleCode,
        "Topic": "Non-Verbal - Figure Analogy",
        "Difficulty": "easy",
        "Marks": 10,
        "Question Statement": "Figure A is to Figure B as Figure C is to [?]. Select the figure that completes the analogy:",
        "Sub Type (series / analogy / matrix / odd_one_out)": "analogy",
        "Problem Figure 1 (Shape Key or URL)": "poly_square_hollow",
        "Problem Figure 2 (Shape Key or URL)": "nest_circ_in_sq",
        "Problem Figure 3 (Shape Key or URL)": "poly_triangle_eq",
        "Target Slot (?) Placeholder": "[?] Missing Analogous Shape (Solved by Option A-D)",
        "Option A (Shape Key or URL)": "nest_circ_in_tri",
        "Option B (Shape Key or URL)": "poly_circle_hollow",
        "Option C (Shape Key or URL)": "poly_square_hollow",
        "Option D (Shape Key or URL)": "dots_1_center",
        "Correct Option (A-D or 1-4)": "A",
        "Explanation": "A circle is placed inside the square (Fig A : Fig B). By analogy, placing a circle inside the triangle (Fig C) yields Circle-in-Triangle at [?] (Option A).",
        "Tags": "non-verbal, analogy, nested"
      },
      {
        "Course Code": sampleCode,
        "Topic": "Non-Verbal - 2x2 Matrix",
        "Difficulty": "hard",
        "Marks": 10,
        "Question Statement": "Analyze the 2x2 matrix pattern. Which figure replaces the question mark (?) in the bottom-right cell?",
        "Sub Type (series / analogy / matrix / odd_one_out)": "matrix",
        "Problem Figure 1 (Shape Key or URL)": "sq_dot_tl",
        "Problem Figure 2 (Shape Key or URL)": "sq_dot_tr",
        "Problem Figure 3 (Shape Key or URL)": "sq_dot_bl",
        "Target Slot (?) Placeholder": "[?] Target Cell (2,2) Question Mark (Solved by Option A-D)",
        "Option A (Shape Key or URL)": "sq_dot_br",
        "Option B (Shape Key or URL)": "sq_dot_tl",
        "Option C (Shape Key or URL)": "sq_dot_center",
        "Option D (Shape Key or URL)": "dots_4_corners",
        "Correct Option (A-D or 1-4)": "A",
        "Explanation": "In the 2x2 matrix, the dot travels clockwise around the square corners: Top-Left (1,1) ➔ Top-Right (1,2) ➔ Bottom-Left (2,1). The bottom-right cell [?] must have the dot in the Bottom-Right corner (Option A).",
        "Tags": "non-verbal, matrix, dots"
      },
      {
        "Course Code": sampleCode,
        "Topic": "Non-Verbal - Odd One Out",
        "Difficulty": "easy",
        "Marks": 10,
        "Question Statement": "Four of the five figures share a common property. Select the ONE figure that is the Odd One Out:",
        "Sub Type (series / analogy / matrix / odd_one_out)": "odd_one_out",
        "Problem Figure 1 (Shape Key or URL)": "",
        "Problem Figure 2 (Shape Key or URL)": "",
        "Problem Figure 3 (Shape Key or URL)": "",
        "Target Slot (?) Placeholder": "N/A (Odd One Out evaluates Choices directly)",
        "Option A (Shape Key or URL)": "poly_square_hollow",
        "Option B (Shape Key or URL)": "poly_rect_hollow",
        "Option C (Shape Key or URL)": "poly_rhombus",
        "Option D (Shape Key or URL)": "poly_triangle_eq",
        "Correct Option (A-D or 1-4)": "D",
        "Explanation": "Figures A, B, and C are 4-sided quadrilaterals. Figure D is a 3-sided triangle, making it the odd one out.",
        "Tags": "non-verbal, odd-one-out, polygons"
      }
    ];
  } else if (questionType === "verbal_reasoning") {
    headers = [
      "Course Code",
      "Topic",
      "Difficulty",
      "Marks",
      "Question Statement",
      "Sub Type (analogy / series / odd_one_out / coding / blood_relations)",
      "Pair 1 Word A (or Source Word / Premise)",
      "Pair 1 Word B (or Coded Word)",
      "Pair 2 Word C (or Target Word / Series Sequence)",
      "Rule or Relationship Description",
      "Option A",
      "Option B",
      "Option C",
      "Option D",
      "Option E (Optional)",
      "Correct Option (A-E or 1-5)",
      "Explanation",
      "Tags"
    ];
    sampleRows = [
      {
        "Course Code": sampleCode,
        "Topic": "Verbal - Word Analogy",
        "Difficulty": "easy",
        "Marks": 10,
        "Question Statement": "Doctor is to Hospital as Teacher is to [ ? ]. Select the word that best completes the analogy:",
        "Sub Type (analogy / series / odd_one_out / coding / blood_relations)": "analogy",
        "Pair 1 Word A (or Source Word / Premise)": "Doctor",
        "Pair 1 Word B (or Coded Word)": "Hospital",
        "Pair 2 Word C (or Target Word / Series Sequence)": "Teacher",
        "Rule or Relationship Description": "Profession to Workplace Relationship (پیشہ اور کام کی جگہ)",
        "Option A": "School",
        "Option B": "Student",
        "Option C": "Book",
        "Option D": "Classroom",
        "Option E (Optional)": "",
        "Correct Option (A-E or 1-5)": "A",
        "Explanation": "A doctor works in a hospital; similarly, a teacher works in a school.",
        "Tags": "verbal, analogy, workplace"
      },
      {
        "Course Code": sampleCode,
        "Topic": "Verbal - Number Series",
        "Difficulty": "medium",
        "Marks": 10,
        "Question Statement": "Which number should logically replace the question mark (?) in the sequence: 3, 6, 12, 24, 48, [ ? ]?",
        "Sub Type (analogy / series / odd_one_out / coding / blood_relations)": "series",
        "Pair 1 Word A (or Source Word / Premise)": "",
        "Pair 1 Word B (or Coded Word)": "",
        "Pair 2 Word C (or Target Word / Series Sequence)": "3, 6, 12, 24, 48",
        "Rule or Relationship Description": "Geometric progression (multiply previous term by 2)",
        "Option A": "96",
        "Option B": "72",
        "Option C": "84",
        "Option D": "60",
        "Option E (Optional)": "",
        "Correct Option (A-E or 1-5)": "A",
        "Explanation": "Each number in the sequence doubles: 3x2=6, 6x2=12, 12x2=24, 24x2=48, 48x2=96. Therefore, the missing term is 96.",
        "Tags": "verbal, series, numbers, doubling"
      },
      {
        "Course Code": sampleCode,
        "Topic": "Verbal - Odd Word Out",
        "Difficulty": "easy",
        "Marks": 10,
        "Question Statement": "Four of the following five words share a common classification. Select the ONE word that is the Odd One Out:",
        "Sub Type (analogy / series / odd_one_out / coding / blood_relations)": "odd_one_out",
        "Pair 1 Word A (or Source Word / Premise)": "",
        "Pair 1 Word B (or Coded Word)": "",
        "Pair 2 Word C (or Target Word / Series Sequence)": "",
        "Rule or Relationship Description": "Elemental metals vs alloy",
        "Option A": "Gold",
        "Option B": "Silver",
        "Option C": "Copper",
        "Option D": "Bronze",
        "Option E (Optional)": "Iron",
        "Correct Option (A-E or 1-5)": "D",
        "Explanation": "Gold, Silver, Copper, and Iron are pure elemental metals. Bronze is an alloy consisting primarily of copper and tin.",
        "Tags": "verbal, classification, odd-one-out, metals"
      },
      {
        "Course Code": sampleCode,
        "Topic": "Verbal - Coding & Decoding",
        "Difficulty": "medium",
        "Marks": 10,
        "Question Statement": "In a certain secret code, PEACE is written as QFBDF. How will SMART be written in that same code?",
        "Sub Type (analogy / series / odd_one_out / coding / blood_relations)": "coding",
        "Pair 1 Word A (or Source Word / Premise)": "PEACE",
        "Pair 1 Word B (or Coded Word)": "QFBDF",
        "Pair 2 Word C (or Target Word / Series Sequence)": "SMART",
        "Rule or Relationship Description": "Each letter is shifted forward by +1 in the alphabet (P->Q, E->F, A->B, C->D, E->F)",
        "Option A": "TNBSU",
        "Option B": "TMBRU",
        "Option C": "RLZQS",
        "Option D": "TOCTU",
        "Option E (Optional)": "",
        "Correct Option (A-E or 1-5)": "A",
        "Explanation": "Applying +1 shift: S->T, M->N, A->B, R->S, T->U. The decoded output is TNBSU.",
        "Tags": "verbal, coding-decoding, caesar-shift"
      },
      {
        "Course Code": sampleCode,
        "Topic": "Verbal - Blood Relations",
        "Difficulty": "medium",
        "Marks": 10,
        "Question Statement": "Pointing to a photograph of a boy, Suresh said, 'He is the son of the only son of my mother.' How is Suresh related to the boy?",
        "Sub Type (analogy / series / odd_one_out / coding / blood_relations)": "blood_relations",
        "Pair 1 Word A (or Source Word / Premise)": "Only son of Suresh's mother = Suresh himself",
        "Pair 1 Word B (or Coded Word)": "The boy is the son of Suresh",
        "Pair 2 Word C (or Target Word / Series Sequence)": "",
        "Rule or Relationship Description": "Kinship deduction through matrilineal reference",
        "Option A": "Brother",
        "Option B": "Uncle",
        "Option C": "Father",
        "Option D": "Grandfather",
        "Option E (Optional)": "",
        "Correct Option (A-E or 1-5)": "C",
        "Explanation": "Suresh's mother's only son is Suresh himself. Therefore, the boy is Suresh's son, which makes Suresh his Father.",
        "Tags": "verbal, blood-relations, family-tree"
      }
    ];
  } else {
    // Universal Multi-Format Template
    headers = [
      "Course Code",
      "Topic",
      "Question Type (mcq/multi_select/true_false/fill_blank/numerical/short_answer)",
      "Difficulty",
      "Marks",
      "Question Statement",
      "Option 1",
      "Option 2",
      "Option 3",
      "Option 4",
      "Correct Answer",
      "Tolerance (For Numerical)",
      "Unit",
      "Explanation",
      "Tags"
    ];
    sampleRows = [
      {
        "Course Code": sampleCode,
        "Topic": "Algebra",
        "Question Type (mcq/multi_select/true_false/fill_blank/numerical/short_answer)": "mcq",
        "Difficulty": "medium",
        "Marks": 10,
        "Question Statement": "Solve for $x$: $2x + 6 = 14$.",
        "Option 1": "4",
        "Option 2": "5",
        "Option 3": "3",
        "Option 4": "8",
        "Correct Answer": "1",
        "Tolerance (For Numerical)": "",
        "Unit": "",
        "Explanation": "2x = 8 => x = 4.",
        "Tags": "algebra, linear-equation"
      },
      {
        "Course Code": sampleCode,
        "Topic": "Physics",
        "Question Type (mcq/multi_select/true_false/fill_blank/numerical/short_answer)": "true_false",
        "Difficulty": "easy",
        "Marks": 5,
        "Question Statement": "Sound travels faster in solids than in gases.",
        "Option 1": "",
        "Option 2": "",
        "Option 3": "",
        "Option 4": "",
        "Correct Answer": "True",
        "Tolerance (For Numerical)": "",
        "Unit": "",
        "Explanation": "Sound waves propagate more rapidly through denser elastic media.",
        "Tags": "physics, sound"
      },
      {
        "Course Code": sampleCode,
        "Topic": "Physics",
        "Question Type (mcq/multi_select/true_false/fill_blank/numerical/short_answer)": "numerical",
        "Difficulty": "medium",
        "Marks": 10,
        "Question Statement": "Find kinetic energy of 2kg mass moving at 3 m/s.",
        "Option 1": "",
        "Option 2": "",
        "Option 3": "",
        "Option 4": "",
        "Correct Answer": "9",
        "Tolerance (For Numerical)": "0.1",
        "Unit": "J",
        "Explanation": "K.E. = 0.5 * m * v^2 = 0.5 * 2 * 9 = 9 Joules.",
        "Tags": "physics, energy"
      },
      {
        "Course Code": sampleCode,
        "Topic": "Non-Verbal Intelligence",
        "Question Type (mcq/multi_select/true_false/fill_blank/numerical/short_answer)": "non_verbal",
        "Difficulty": "medium",
        "Marks": 10,
        "Question Statement": "Look at the pattern sequence: quad_tr ➔ quad_br ➔ quad_bl ➔ [?]. Which figure replaces the question mark (?)?",
        "Option 1": "quad_tl",
        "Option 2": "quad_tr",
        "Option 3": "quad_br",
        "Option 4": "half_top",
        "Correct Answer": "1",
        "Tolerance (For Numerical)": "",
        "Unit": "",
        "Explanation": "The shaded quadrant rotates 90° clockwise. The next shape replacing [?] is quad_tl (Option 1).",
        "Tags": "non-verbal, series, rotation"
      },
      {
        "Course Code": sampleCode,
        "Topic": "Verbal Reasoning",
        "Question Type (mcq/multi_select/true_false/fill_blank/numerical/short_answer)": "verbal_reasoning",
        "Difficulty": "easy",
        "Marks": 10,
        "Question Statement": "Doctor is to Hospital as Teacher is to [ ? ]. Select the word that completes the analogy:",
        "Option 1": "School",
        "Option 2": "Student",
        "Option 3": "Book",
        "Option 4": "Classroom",
        "Correct Answer": "1",
        "Tolerance (For Numerical)": "",
        "Unit": "",
        "Explanation": "Doctor works in hospital, teacher works in school.",
        "Tags": "verbal, analogy, workplace"
      }
    ];
  }

  // 1. Data Sheet
  const ws = XLSX.utils.json_to_sheet(sampleRows, { header: headers });
  
  // Column Widths for readability
  ws["!cols"] = headers.map(h => {
    if (h.includes("Statement")) return { wch: 45 };
    if (h.includes("Target Slot") || h.includes("Placeholder")) return { wch: 32 };
    if (h.includes("Pair") || h.includes("Rule") || h.includes("Figure") || h.includes("Option") || h.includes("Explanation")) return { wch: 25 };
    if (h.includes("Course") || h.includes("Topic")) return { wch: 20 };
    return { wch: 15 };
  });

  XLSX.utils.book_append_sheet(wb, ws, "Questions Data");

  // 2. Instructions Sheet
  const instructions = [
    { "Instructions & Guidelines": "SHARP ACADEMY - QUESTION BANK BULK IMPORT GUIDE" },
    { "Instructions & Guidelines": "--------------------------------------------------------" },
    { "Instructions & Guidelines": "1. Do NOT rename or delete column headers in row 1 of 'Questions Data'." },
    { "Instructions & Guidelines": "2. Course Code: Must match an active course in the academy system (e.g. " + courses.map(c => c.code).join(", ") + ")." },
    { "Instructions & Guidelines": "3. Difficulty: Valid values are 'easy', 'medium', or 'hard'." },
    { "Instructions & Guidelines": "4. Mathematical Formulas: Supported using LaTeX KaTeX formatting. Enclose inline math in $...$ (e.g. $E = mc^2$ or $\\frac{a}{b}$)." },
    { "Instructions & Guidelines": "5. MCQ Correct Answer: Enter option number '1', '2', '3', or '4'." },
    { "Instructions & Guidelines": "6. True/False Correct Answer: Enter 'True' or 'False'." },
    { "Instructions & Guidelines": "7. Multi-Select: Enter comma-separated option numbers e.g. '1, 3'." },
    { "Instructions & Guidelines": "8. Fill in Blanks Alternatives: Separate alternative valid answers with pipe | (e.g. 'Ohm | ohms | Ω')." },
    { "Instructions & Guidelines": "9. Save this file as .xlsx and upload it using the 'Bulk Import' window in the admin portal." },
    { "Instructions & Guidelines": "--------------------------------------------------------" },
    { "Instructions & Guidelines": "NON-VERBAL INTELLIGENCE & PATTERN SEQUENCE GUIDELINES:" },
    { "Instructions & Guidelines": "10. Sequence Flow & Target Slot (?): In pattern series, analogies, and matrices, specify 'Problem Figure 1', 'Figure 2', and 'Figure 3'. The 'Target Slot (?) Placeholder' explicitly marks the question mark slot that candidates must solve using Choices A-D." },
    { "Instructions & Guidelines": "11. Built-in Shape Keys: Enter any of the 40+ built-in shape keys or provide external image URLs (https://... or data:image/svg+xml;...):" },
    { "Instructions & Guidelines": "    - Directional Arrows: arrow_0, arrow_45, arrow_90, arrow_135, arrow_180, arrow_225, arrow_270, arrow_315, arrow_double_h, arrow_curved_cw" },
    { "Instructions & Guidelines": "    - Shaded Quadrants: quad_tr, quad_br, quad_bl, quad_tl, half_top, half_bottom, half_left, half_right, sq_quad_tr, sq_quad_br, sq_quad_bl, sq_quad_tl" },
    { "Instructions & Guidelines": "    - Polygons: poly_triangle_eq, poly_square_hollow, poly_circle_hollow, poly_pentagon, poly_hexagon, poly_rhombus, poly_star_5, poly_cross_plus" },
    { "Instructions & Guidelines": "    - Nested Shapes: nest_circ_in_sq, nest_sq_in_circ, nest_tri_in_sq, nest_sq_in_tri, nest_circ_in_tri" },
    { "Instructions & Guidelines": "    - Dots & Tracking: dots_1_center, dots_2_diag, dots_3_diag, dots_4_corners, dots_5_dice, sq_dot_tl, sq_dot_tr, sq_dot_bl, sq_dot_br, sq_dot_center, circ_dot_center, tri_dot_inside, tri_dot_outside" },
    { "Instructions & Guidelines": "    - Lines & Clocks: line_1_vert, line_2_vert, line_3_vert, line_cross, clock_12, clock_3, clock_6, clock_9" },
    { "Instructions & Guidelines": "12. Non-Verbal Correct Answer: Enter 'A', 'B', 'C', or 'D' (or numbers '1', '2', '3', '4')." },
    { "Instructions & Guidelines": "--------------------------------------------------------" },
    { "Instructions & Guidelines": "VERBAL REASONING GUIDELINES:" },
    { "Instructions & Guidelines": "13. Subtypes: Enter 'analogy', 'series', 'odd_one_out', 'coding', or 'blood_relations'." },
    { "Instructions & Guidelines": "14. Analogy: Pair 1 Word A & B form the exemplar relationship. Pair 2 Word C is given and the candidate deduces the 4th term from Options A-D." },
    { "Instructions & Guidelines": "15. Series: Provide sequence tokens separated by comma in 'Pair 2 Word C' (e.g. '3, 6, 12, 24, 48' or 'B, D, F, H'). The target slot [?] is appended automatically." },
    { "Instructions & Guidelines": "16. Odd One Out: Provide 4 to 5 words across Options A to E. The candidate selects the option that does not belong to the group." },
    { "Instructions & Guidelines": "17. Coding: Enter Source Word (e.g. 'PEACE') in Pair 1 Word A, Coded Word (e.g. 'QFBDF') in Pair 1 Word B, and Target Word (e.g. 'SMART') in Pair 2 Word C." },
    { "Instructions & Guidelines": "18. Blood Relations: Enter premises and relationship clues in Pair 1 / Rule columns, and candidate kinship answers in Options A-D." },
    { "Instructions & Guidelines": "19. Verbal Correct Answer: Enter 'A', 'B', 'C', 'D' or 'E' (or numbers '1', '2', '3', '4', '5')." }
  ];
  const wsGuide = XLSX.utils.json_to_sheet(instructions);
  wsGuide["!cols"] = [{ wch: 95 }];
  XLSX.utils.book_append_sheet(wb, wsGuide, "Help & Guidelines");

  return wb;
}

// Helper to normalize strings
function norm(val: any): string {
  if (val === undefined || val === null) return "";
  return String(val).trim();
}

// Parse Excel / CSV file into validated question objects
export function parseQuestionBankExcel(
  binaryData: ArrayBuffer | string,
  courses: CourseRef[],
  fallbackCourseId?: number,
  fallbackType?: string
): ParsedQuestionRow[] {
  const wb = XLSX.read(binaryData, { type: typeof binaryData === "string" ? "binary" : "array" });
  const firstSheetName = wb.SheetNames[0];
  const ws = wb.Sheets[firstSheetName];
  const rows = XLSX.utils.sheet_to_json<Record<string, any>>(ws, { defval: "" });

  const parsedList: ParsedQuestionRow[] = [];

  rows.forEach((row, idx) => {
    const rowNum = idx + 2; // Row 1 is header

    // Map loose header keys
    const getVal = (...keys: string[]): string => {
      for (const k of keys) {
        if (row[k] !== undefined && row[k] !== "") return norm(row[k]);
      }
      return "";
    };

    const courseCodeRaw = getVal("Course Code", "course_code", "course", "Course");
    const topic = getVal("Topic", "topic", "Chapter", "chapter") || "General";
    const difficultyRaw = getVal("Difficulty", "difficulty").toLowerCase();
    const difficulty: "easy" | "medium" | "hard" = 
      difficultyRaw === "easy" || difficultyRaw === "hard" ? difficultyRaw : "medium";

    const marksRaw = getVal("Marks", "marks");
    const marks = Number(marksRaw) > 0 ? Number(marksRaw) : 10;

    const questionText = getVal("Question Statement", "question_text", "Statement", "Question", "text");
    const explanation = getVal("Explanation", "explanation", "Solution Notes");
    const tags = getVal("Tags", "tags", "Keywords");

    // Determine Course ID
    let courseId = fallbackCourseId || courses[0]?.id || 1;
    let matchedCourse = courses.find(c => c.code.toLowerCase() === courseCodeRaw.toLowerCase());
    if (matchedCourse) {
      courseId = matchedCourse.id;
    }

    // Determine Question Type
    let qType = fallbackType || "mcq";
    const typeInRow = getVal("Question Type", "question_type", "Type", "type").toLowerCase();
    if (typeInRow.includes("verbal_reasoning") || typeInRow.includes("verbal") || typeInRow.includes("analog") || typeInRow.includes("coding") || typeInRow.includes("blood_rel")) qType = "verbal_reasoning";
    else if (typeInRow.includes("non_verbal") || typeInRow.includes("nonverbal") || typeInRow.includes("spatial") || typeInRow.includes("pattern") || typeInRow.includes("shape")) qType = "non_verbal";
    else if (typeInRow.includes("multi_select") || typeInRow.includes("multi")) qType = "multi_select";
    else if (typeInRow.includes("true") || typeInRow.includes("false") || typeInRow.includes("tf")) qType = "true_false";
    else if (typeInRow.includes("blank") || typeInRow.includes("fill")) qType = "fill_blank";
    else if (typeInRow.includes("num") || typeInRow.includes("calc")) qType = "numerical";
    else if (typeInRow.includes("match") || typeInRow.includes("column")) qType = "column_mapping";
    else if (typeInRow.includes("short")) qType = "short_answer";
    else if (typeInRow.includes("long") || typeInRow.includes("essay")) qType = "long_answer";
    else if (typeInRow.includes("mcq")) qType = "mcq";

    // Auto-detect verbal reasoning from headers if type is default mcq
    if (qType === "mcq" && (
      row["Sub Type (analogy / series / odd_one_out / coding / blood_relations)"] ||
      row["Pair 1 Word A (or Source Word / Premise)"] ||
      row["Pair 1 Word B (or Coded Word)"] ||
      row["Pair 2 Word C (or Target Word / Series Sequence)"] ||
      row["Rule or Relationship Description"]
    )) {
      qType = "verbal_reasoning";
    }

    // Auto-detect non-verbal from headers if type is default mcq
    if (qType === "mcq" && (
      row["Problem Figure 1 (Shape Key or URL)"] ||
      row["Problem Figure 1"] || 
      row["Figure 1"] || 
      row["Target Slot (?) Placeholder"] || 
      row["Target Slot (?)"] || 
      row["Sub Type (series / analogy / matrix / odd_one_out)"] ||
      (row["Sub Type"] && !row["Pair 1 Word A (or Source Word / Premise)"])
    )) {
      qType = "non_verbal";
    }

    const errors: string[] = [];
    if (!questionText) {
      errors.push("Question statement is missing.");
    }

    let optionsJson = "";
    let correctAnswer = "";

    if (qType === "mcq") {
      const opt1 = getVal("Option 1", "opt1", "A", "Option A");
      const opt2 = getVal("Option 2", "opt2", "B", "Option B");
      const opt3 = getVal("Option 3", "opt3", "C", "Option C");
      const opt4 = getVal("Option 4", "opt4", "D", "Option D");

      if (!opt1 || !opt2) {
        errors.push("MCQ must have at least Option 1 and Option 2.");
      }

      optionsJson = JSON.stringify([
        { id: 1, text: opt1 },
        { id: 2, text: opt2 },
        { id: 3, text: opt3 },
        { id: 4, text: opt4 },
      ]);

      const correctRaw = getVal("Correct Option (1-4)", "Correct Option", "Correct Answer", "correct", "Answer");
      let cNum = "1";
      if (/^[1-4]$/.test(correctRaw)) {
        cNum = correctRaw;
      } else if (/^[a-dA-D]$/.test(correctRaw)) {
        cNum = String(correctRaw.toUpperCase().charCodeAt(0) - 64);
      } else if (correctRaw.toLowerCase() === opt1.toLowerCase()) cNum = "1";
      else if (correctRaw.toLowerCase() === opt2.toLowerCase()) cNum = "2";
      else if (correctRaw.toLowerCase() === opt3.toLowerCase()) cNum = "3";
      else if (correctRaw.toLowerCase() === opt4.toLowerCase()) cNum = "4";

      correctAnswer = cNum;
    } else if (qType === "multi_select") {
      const opt1 = getVal("Option 1", "opt1");
      const opt2 = getVal("Option 2", "opt2");
      const opt3 = getVal("Option 3", "opt3");
      const opt4 = getVal("Option 4", "opt4");

      optionsJson = JSON.stringify([
        { id: 1, text: opt1 },
        { id: 2, text: opt2 },
        { id: 3, text: opt3 },
        { id: 4, text: opt4 },
      ]);

      const correctRaw = getVal("Correct Options (e.g. 1, 3)", "Correct Options", "Correct Answer", "correct");
      const nums = correctRaw.split(/[,| ]+/).map(s => s.trim()).filter(s => /^[1-4]$/.test(s));
      correctAnswer = JSON.stringify(nums.length > 0 ? nums : ["1"]);
    } else if (qType === "true_false") {
      optionsJson = JSON.stringify([
        { id: "true", text: "True" },
        { id: "false", text: "False" }
      ]);
      const ansRaw = getVal("Correct Answer (True/False)", "Correct Answer", "correct").toLowerCase();
      correctAnswer = (ansRaw === "false" || ansRaw === "f" || ansRaw === "0") ? "false" : "true";
    } else if (qType === "fill_blank") {
      const blankAns = getVal("Blank Answer", "Correct Answer", "correct");
      const altsRaw = getVal("Alternative Answers (pipe separated | )", "Alternative Answers", "Alternatives");
      const alts = altsRaw ? altsRaw.split("|").map(s => s.trim()).filter(Boolean) : [];
      if (blankAns && !alts.includes(blankAns)) {
        alts.unshift(blankAns);
      }
      optionsJson = JSON.stringify({
        accepted: alts.length > 0 ? alts : [blankAns],
        case_sensitive: false,
        placeholder: "Type your answer here..."
      });
      correctAnswer = blankAns;
      if (!blankAns) errors.push("Blank answer is missing.");
    } else if (qType === "numerical") {
      const exactVal = getVal("Exact Value", "Correct Answer", "exact", "correct");
      const tolerance = getVal("Tolerance", "tolerance") || "0";
      const unit = getVal("Unit", "unit");
      optionsJson = JSON.stringify({
        exact: Number(exactVal) || 0,
        tolerance: Number(tolerance) || 0,
        unit: unit
      });
      correctAnswer = `${exactVal}${unit ? " " + unit : ""}`;
      if (!exactVal) errors.push("Numerical target value is missing.");
    } else if (qType === "column_mapping") {
      const pairs: { left: string; right: string }[] = [];
      for (let p = 1; p <= 6; p++) {
        const l = getVal(`Pair ${p} Left`, `L${p}`, `Pair ${p} A`);
        const r = getVal(`Pair ${p} Right`, `R${p}`, `Pair ${p} B`);
        if (l && r) {
          pairs.push({ left: l, right: r });
        }
      }
      if (pairs.length < 2) {
        errors.push("Column mapping requires at least 2 pairs.");
      }
      optionsJson = JSON.stringify({
        left: pairs.map((p, pIdx) => ({ id: `L${pIdx + 1}`, text: p.left })),
        right: pairs.map((p, pIdx) => ({ id: `R${pIdx + 1}`, text: p.right }))
      });
      const pairMap: Record<string, string> = {};
      pairs.forEach((_, pIdx) => {
        pairMap[`L${pIdx + 1}`] = `R${pIdx + 1}`;
      });
      correctAnswer = JSON.stringify(pairMap);
    } else if (qType === "non_verbal") {
      const subTypeRaw = getVal("Sub Type (series / analogy / matrix / odd_one_out)", "Sub Type", "sub_type", "Sub-Type", "Pattern Type", "SubType").toLowerCase();
      let subType: "series" | "analogy" | "matrix" | "odd_one_out" = "series";
      if (subTypeRaw.includes("analogy")) subType = "analogy";
      else if (subTypeRaw.includes("matrix")) subType = "matrix";
      else if (subTypeRaw.includes("odd")) subType = "odd_one_out";
      else subType = "series";

      // Helper to resolve shape string or key
      const resolveShapeImage = (val: string): string => {
        if (!val) return "";
        const clean = val.trim();
        // Check if already an SVG data URI or http/https URL
        if (clean.startsWith("data:image/") || clean.startsWith("http://") || clean.startsWith("https://") || clean.startsWith("<svg")) {
          return clean;
        }
        // Check built-in shape library
        const svgFromLib = getShapeSvg(clean.toLowerCase());
        if (svgFromLib) return svgFromLib;
        return clean;
      };

      // Collect Problem Figures
      const problemFigures: string[] = [];
      const figKeys = [
        ["Problem Figure 1 (Shape Key or URL)", "Problem Figure 1", "Figure 1", "Fig 1", "Problem 1", "Figure1"],
        ["Problem Figure 2 (Shape Key or URL)", "Problem Figure 2", "Figure 2", "Fig 2", "Problem 2", "Figure2"],
        ["Problem Figure 3 (Shape Key or URL)", "Problem Figure 3", "Figure 3", "Fig 3", "Problem 3", "Figure3"],
        ["Problem Figure 4 (Shape Key or URL)", "Problem Figure 4", "Figure 4", "Fig 4", "Problem 4", "Figure4"],
        ["Problem Figure 5 (Shape Key or URL)", "Problem Figure 5", "Figure 5", "Fig 5", "Problem 5", "Figure5"],
        ["Problem Figure 6 (Shape Key or URL)", "Problem Figure 6", "Figure 6", "Fig 6", "Problem 6", "Figure6"],
        ["Problem Figure 7 (Shape Key or URL)", "Problem Figure 7", "Figure 7", "Fig 7", "Problem 7", "Figure7"],
        ["Problem Figure 8 (Shape Key or URL)", "Problem Figure 8", "Figure 8", "Fig 8", "Problem 8", "Figure8"],
      ];

      for (const kList of figKeys) {
        const rawVal = getVal(...kList);
        if (rawVal) {
          problemFigures.push(resolveShapeImage(rawVal));
        }
      }

      // Collect Options A-E / 1-5
      const rawOptA = getVal("Option A (Shape Key or URL)", "Option A", "Option 1", "Opt A", "Opt 1", "A");
      const rawOptB = getVal("Option B (Shape Key or URL)", "Option B", "Option 2", "Opt B", "Opt 2", "B");
      const rawOptC = getVal("Option C (Shape Key or URL)", "Option C", "Option 3", "Opt C", "Opt 3", "C");
      const rawOptD = getVal("Option D (Shape Key or URL)", "Option D", "Option 4", "Opt D", "Opt 4", "D");
      const rawOptE = getVal("Option E (Shape Key or URL)", "Option E", "Option 5", "Opt E", "Opt 5", "E");

      const rawOptionsList = [
        { label: "A", raw: rawOptA },
        { label: "B", raw: rawOptB },
        { label: "C", raw: rawOptC },
        { label: "D", raw: rawOptD },
        ...(rawOptE ? [{ label: "E", raw: rawOptE }] : [])
      ];

      const options = rawOptionsList
        .filter(o => Boolean(o.raw))
        .map((o, idx) => {
          const resolved = resolveShapeImage(o.raw);
          const shapeItem = SHAPE_LIBRARY.find(s => s.id.toLowerCase() === o.raw.toLowerCase());
          const descText = shapeItem ? shapeItem.name : `Option ${o.label}`;
          return {
            id: String(idx + 1),
            label: o.label,
            image_url: resolved,
            text: descText
          };
        });

      if (subType !== "odd_one_out" && problemFigures.length < 2) {
        errors.push(`Non-verbal ${subType} questions require at least 2 problem figures.`);
      }

      if (options.length < 2) {
        errors.push("Non-verbal questions require at least 2 candidate options (Choices A and B).");
      }

      // Build options_json with explicit target_placeholder: "?"
      optionsJson = JSON.stringify({
        sub_type: subType,
        problem_images: problemFigures,
        target_placeholder: "?",
        options: options,
        ...(subType === "matrix" ? { matrix_grid: "2x2" } : {})
      });

      // Determine correct answer
      const correctRaw = getVal("Correct Option (A-D or 1-4)", "Correct Option", "Correct Answer", "correct", "Answer");
      let cNum = "1";
      if (/^[1-5]$/.test(correctRaw)) {
        cNum = correctRaw;
      } else if (/^[a-eA-E]$/.test(correctRaw)) {
        cNum = String(correctRaw.toUpperCase().charCodeAt(0) - 64);
      } else {
        const matchIdx = options.findIndex(
          o => o.label.toLowerCase() === correctRaw.toLowerCase() ||
               o.text.toLowerCase().includes(correctRaw.toLowerCase()) ||
               o.image_url === resolveShapeImage(correctRaw)
        );
        if (matchIdx >= 0) {
          cNum = String(matchIdx + 1);
        }
      }
      correctAnswer = cNum;
    } else if (qType === "verbal_reasoning") {
      const subTypeRaw = getVal(
        "Sub Type (analogy / series / odd_one_out / coding / blood_relations)",
        "Sub Type",
        "sub_type",
        "Sub-Type",
        "SubType"
      ).toLowerCase();

      let subType: "analogy" | "series" | "odd_one_out" | "coding" | "blood_relations" = "analogy";
      if (subTypeRaw.includes("series") || subTypeRaw.includes("sequence")) subType = "series";
      else if (subTypeRaw.includes("odd") || subTypeRaw.includes("classification")) subType = "odd_one_out";
      else if (subTypeRaw.includes("coding") || subTypeRaw.includes("cipher") || subTypeRaw.includes("code")) subType = "coding";
      else if (subTypeRaw.includes("blood") || subTypeRaw.includes("relation") || subTypeRaw.includes("direction") || subTypeRaw.includes("kinship")) subType = "blood_relations";
      else subType = "analogy";

      const pair1Left = getVal("Pair 1 Word A (or Source Word / Premise)", "Pair 1 Word A", "Word A", "Source Word", "Premise 1");
      const pair1Right = getVal("Pair 1 Word B (or Coded Word)", "Pair 1 Word B", "Word B", "Coded Word", "Premise 2");
      const pair2Left = getVal("Pair 2 Word C (or Target Word / Series Sequence)", "Pair 2 Word C", "Word C", "Target Word", "Series Sequence", "Series");
      const ruleDesc = getVal("Rule or Relationship Description", "Rule Description", "Rule", "Relationship", "Pattern Rule");

      // Candidate Options A-E
      const rawOptA = getVal("Option A", "Option 1", "Opt A", "Opt 1", "A");
      const rawOptB = getVal("Option B", "Option 2", "Opt B", "Opt 2", "B");
      const rawOptC = getVal("Option C", "Option 3", "Opt C", "Opt 3", "C");
      const rawOptD = getVal("Option D", "Option 4", "Opt D", "Opt 4", "D");
      const rawOptE = getVal("Option E (Optional)", "Option E", "Option 5", "Opt E", "Opt 5", "E");

      const rawOptionsList = [
        { label: "A", text: rawOptA },
        { label: "B", text: rawOptB },
        { label: "C", text: rawOptC },
        { label: "D", text: rawOptD },
        ...(rawOptE ? [{ label: "E", text: rawOptE }] : [])
      ];

      const options = rawOptionsList
        .filter(o => Boolean(o.text))
        .map((o, idx) => ({
          id: String(idx + 1),
          label: o.label,
          text: o.text
        }));

      if (options.length < 2) {
        errors.push("Verbal reasoning questions require at least 2 candidate options (Choices A and B).");
      }

      // Subtype-specific extra parsing
      let seriesTokens: string[] = [];
      let seriesType: "number" | "letter" | "alphanumeric" = "number";
      let wordsList: string[] = [];
      let oddIndex = 0;
      let sourceWord = "";
      let codedWord = "";
      let targetWord = "";
      let codingRule = "";
      let premise = "";
      let cluesList: string[] = [];

      if (subType === "series") {
        const seqStr = pair2Left || pair1Left || "";
        if (seqStr) {
          seriesTokens = seqStr.split(/[,➔\->]+/).map(s => s.trim()).filter(Boolean);
        }
        if (seriesTokens.length === 0) {
          const matchNums = questionText.match(/(\d+(?:\s*,\s*\d+)+)/);
          if (matchNums) {
            seriesTokens = matchNums[1].split(",").map(s => s.trim());
          }
        }
        const hasLetters = seriesTokens.some(t => /[a-zA-Z]/.test(t));
        const hasDigits = seriesTokens.some(t => /[0-9]/.test(t));
        if (hasLetters && hasDigits) seriesType = "alphanumeric";
        else if (hasLetters) seriesType = "letter";
        else seriesType = "number";
      } else if (subType === "odd_one_out") {
        wordsList = options.map(o => o.text);
      } else if (subType === "coding") {
        sourceWord = pair1Left;
        codedWord = pair1Right;
        targetWord = pair2Left;
        codingRule = ruleDesc;
      } else if (subType === "blood_relations") {
        premise = pair1Left || questionText;
        cluesList = [pair1Left, pair1Right].filter(Boolean);
      }

      // Resolve correct answer
      const correctRaw = getVal("Correct Option (A-E or 1-5)", "Correct Option", "Correct Answer", "correct", "Answer");
      let cNum = "1";
      if (/^[1-5]$/.test(correctRaw)) {
        cNum = correctRaw;
      } else if (/^[a-eA-E]$/.test(correctRaw)) {
        cNum = String(correctRaw.toUpperCase().charCodeAt(0) - 64);
      } else {
        const matchIdx = options.findIndex(
          o => o.label.toLowerCase() === correctRaw.toLowerCase() ||
               o.text.toLowerCase() === correctRaw.toLowerCase()
        );
        if (matchIdx >= 0) {
          cNum = String(matchIdx + 1);
        }
      }
      correctAnswer = cNum;

      if (subType === "odd_one_out") {
        oddIndex = Math.max(0, Number(cNum) - 1);
      }

      optionsJson = JSON.stringify({
        sub_type: subType,
        pair1_left: pair1Left,
        pair1_right: pair1Right,
        pair2_left: pair2Left,
        relationship_type: ruleDesc,
        series_type: seriesType,
        series_tokens: seriesTokens,
        rule_hint: ruleDesc,
        words: wordsList.length > 0 ? wordsList : options.map(o => o.text),
        group_category: ruleDesc,
        odd_index: oddIndex,
        source_word: sourceWord,
        coded_word: codedWord,
        target_word: targetWord,
        coding_rule: codingRule,
        premise: premise,
        clues: cluesList,
        question_prompt: questionText,
        target_placeholder: "?",
        options: options
      });
    } else {
      // Short or Long answer
      const modelAns = getVal("Model Answer", "Correct Answer", "model_answer", "correct");
      const kwOrRubric = getVal("Keywords or Rubric", "Keywords", "Rubric", "tags");
      optionsJson = JSON.stringify({
        keywords: kwOrRubric ? kwOrRubric.split(",").map(s => s.trim()) : [],
        model_answer: modelAns
      });
      correctAnswer = modelAns;
    }

    parsedList.push({
      rowNumber: rowNum,
      course_id: courseId,
      course_code: matchedCourse ? matchedCourse.code : courseCodeRaw || "GEN",
      topic,
      difficulty,
      question_type: qType,
      marks,
      question_text: questionText,
      options_json: optionsJson,
      correct_answer: correctAnswer,
      explanation,
      tags,
      isValid: errors.length === 0,
      errors
    });
  });

  return parsedList;
}
