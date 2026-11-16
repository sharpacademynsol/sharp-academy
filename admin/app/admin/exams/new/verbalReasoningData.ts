export type VerbalReasoningSubType = 
  | "analogy" 
  | "series" 
  | "odd_one_out" 
  | "coding" 
  | "blood_relations";

export interface VerbalOption {
  id: string;
  label: string;
  text: string;
}

export interface VerbalReasoningPreset {
  id: string;
  title: string;
  subType: VerbalReasoningSubType;
  prompt: string;
  topic?: string;
  // Subtype-specific fields
  pair1_left?: string;
  pair1_right?: string;
  pair2_left?: string;
  relationship_type?: string;

  series_type?: "number" | "letter" | "alphanumeric";
  series_tokens?: string[];
  rule_hint?: string;

  words?: string[];
  odd_index?: number;
  group_category?: string;

  source_word?: string;
  coded_word?: string;
  target_word?: string;
  coding_rule?: string;

  premise?: string;
  clues?: string[];
  question_prompt?: string;

  options: VerbalOption[];
  correct: string;
  explanation: string;
}

export const VERBAL_SUBTYPES: {
  id: VerbalReasoningSubType;
  label: string;
  labelUrdu: string;
  icon: string;
  desc: string;
  example: string;
}[] = [
  {
    id: "analogy",
    label: "Verbal Analogy",
    labelUrdu: "الفاظ کی تشبیہ",
    icon: "🔄",
    desc: "Word A is to Word B as Word C is to [ ? ] based on a defined semantic relationship",
    example: "Doctor : Hospital :: Teacher : [ School ]"
  },
  {
    id: "series",
    label: "Letter & Number Series",
    labelUrdu: "حروف و اعداد کا تسلسل",
    icon: "🔢",
    desc: "Progressive numerical or alphabetic sequences leading to a missing target term [ ? ]",
    example: "3, 6, 12, 24, 48, [ ? ]"
  },
  {
    id: "odd_one_out",
    label: "Odd Word Out / Classification",
    labelUrdu: "غیر متعلق لفظ کی نشاندہی",
    icon: "⭐",
    desc: "Find the single word that does not belong to the category formed by the other items",
    example: "Copper, Iron, Silver, Wood, Gold ➔ Wood (Non-metal)"
  },
  {
    id: "coding",
    label: "Coding & Decoding",
    labelUrdu: "کوڈنگ اور ڈیکوڈینگ",
    icon: "🔐",
    desc: "Cryptic letter shifts, reversals, or positional substitutions",
    example: "If PEACE = QFBDF (+1), then SMART = [ TNBUS ]"
  },
  {
    id: "blood_relations",
    label: "Blood Relations & Logic",
    labelUrdu: "رشتے اور منطقی استدلال",
    icon: "👥",
    desc: "Deductive puzzles regarding family kinship and cardinal directions",
    example: "Ali's father's only daughter = [ Ali's Sister ]"
  }
];

export const VERBAL_REASONING_PRESETS: Record<string, VerbalReasoningPreset> = {
  // --- 1. VERBAL ANALOGIES ---
  analogy_worker_place: {
    id: "analogy_worker_place",
    title: "Worker & Workplace Analogy (Doctor : Hospital :: Teacher : ?)",
    subType: "analogy",
    prompt: "Choose the word that has the same relationship to Teacher as Hospital has to Doctor: / وہ لفظ منتخب کریں جس کا استاد کے ساتھ وہی تعلق ہو جو ہسپتال کا ڈاکٹر سے ہے:",
    topic: "Verbal Reasoning - Analogies",
    pair1_left: "Doctor",
    pair1_right: "Hospital",
    pair2_left: "Teacher",
    relationship_type: "Worker & Workplace (پیشہ اور کام کی جگہ)",
    options: [
      { id: "1", label: "A", text: "School (اسکول)" },
      { id: "2", label: "B", text: "Chalk (چاک)" },
      { id: "3", label: "C", text: "Student (طالب علم)" },
      { id: "4", label: "D", text: "Book (کتاب)" }
    ],
    correct: "1",
    explanation: "A Doctor works in a Hospital (Worker : Workplace). Similarly, a Teacher works in a School. Hence, School (Option A) is the correct answer."
  },

  analogy_antonyms: {
    id: "analogy_antonyms",
    title: "Antonym Pairs (Expand : Contract :: Ascend : ?)",
    subType: "analogy",
    prompt: "Identify the antonym relationship in the first pair and apply it to the second: / پہلے جوڑے کے متضاد تعلق کو سمجھتے ہوئے دوسرا جوڑا مکمل کریں:",
    topic: "Verbal Reasoning - Analogies",
    pair1_left: "Expand",
    pair1_right: "Contract",
    pair2_left: "Ascend",
    relationship_type: "Antonyms / Opposite Meaning (متضاد الفاظ)",
    options: [
      { id: "1", label: "A", text: "Descend (نیچے اترنا)" },
      { id: "2", label: "B", text: "Climb (چڑھنا)" },
      { id: "3", label: "C", text: "Soar (بلند پرواز)" },
      { id: "4", label: "D", text: "Hover (منڈلانا)" }
    ],
    correct: "1",
    explanation: "'Expand' is the exact antonym of 'Contract'. Similarly, 'Ascend' (to go up) is the exact antonym of 'Descend' (to go down)."
  },

  analogy_cause_effect: {
    id: "analogy_cause_effect",
    title: "Cause & Effect (Fire : Ashes :: Explosion : ?)",
    subType: "analogy",
    prompt: "What is the logical consequence of the second term: / دوسرے لفظ کا منطقی نتیجہ کیا ہوگا؟",
    topic: "Verbal Reasoning - Analogies",
    pair1_left: "Fire",
    pair1_right: "Ashes",
    pair2_left: "Explosion",
    relationship_type: "Cause & Consequence (سبب اور نتیجہ)",
    options: [
      { id: "1", label: "A", text: "Debris (ملبہ)" },
      { id: "2", label: "B", text: "Flame (شعلہ)" },
      { id: "3", label: "C", text: "Sound (آواز)" },
      { id: "4", label: "D", text: "Heat (حرارت)" }
    ],
    correct: "1",
    explanation: "Fire leaves behind Ashes as its residue/aftermath. An Explosion leaves behind Debris (Option A) as its residue/aftermath."
  },

  // --- 2. NUMBER & LETTER SERIES ---
  series_number_double: {
    id: "series_number_double",
    title: "Geometric Doubling Series (3, 6, 12, 24, 48, ?)",
    subType: "series",
    prompt: "Find the next missing number in the sequence: / نیچے دیے گئے تسلسل میں اگلا عدد معلوم کریں:",
    topic: "Verbal Reasoning - Number Series",
    series_type: "number",
    series_tokens: ["3", "6", "12", "24", "48"],
    rule_hint: "Multiply by 2 at each consecutive step (×2 Progression)",
    options: [
      { id: "1", label: "A", text: "96" },
      { id: "2", label: "B", text: "72" },
      { id: "3", label: "C", text: "84" },
      { id: "4", label: "D", text: "108" }
    ],
    correct: "1",
    explanation: "Each number is multiplied by 2: 3 × 2 = 6, 6 × 2 = 12, 12 × 2 = 24, 24 × 2 = 48. The next number must be 48 × 2 = 96 (Option A)."
  },

  series_fibonacci: {
    id: "series_fibonacci",
    title: "Fibonacci Sum Series (2, 3, 5, 8, 13, ?)",
    subType: "series",
    prompt: "Determine the logical next number in this addition progression: / اس ریاضیاتی تسلسل کا اگلا عدد بتائیں:",
    topic: "Verbal Reasoning - Number Series",
    series_type: "number",
    series_tokens: ["2", "3", "5", "8", "13"],
    rule_hint: "Each term is the sum of the two preceding terms (T_n = T_{n-1} + T_{n-2})",
    options: [
      { id: "1", label: "A", text: "21" },
      { id: "2", label: "B", text: "19" },
      { id: "3", label: "C", text: "18" },
      { id: "4", label: "D", text: "26" }
    ],
    correct: "1",
    explanation: "Each term is the sum of the two preceding terms: 2 + 3 = 5, 3 + 5 = 8, 5 + 8 = 13. The next term is 8 + 13 = 21 (Option A)."
  },

  series_letter_skip: {
    id: "series_letter_skip",
    title: "Alphabet Alternate Skip Series (B, D, F, H, ?)",
    subType: "series",
    prompt: "Which letter logically comes next in this English alphabet series? / انگریزی حروف تہجی کے اس تسلسل میں اگلا حرف کون سا ہوگا؟",
    topic: "Verbal Reasoning - Letter Series",
    series_type: "letter",
    series_tokens: ["B", "D", "F", "H"],
    rule_hint: "Skip 1 letter forward (+2 position in Alphabet)",
    options: [
      { id: "1", label: "A", text: "J" },
      { id: "2", label: "B", text: "I" },
      { id: "3", label: "C", text: "K" },
      { id: "4", label: "D", text: "L" }
    ],
    correct: "1",
    explanation: "Letters progress with a +2 jump (skipping one letter): B(+2) = D, D(+2) = F, F(+2) = H. The next letter is H(+2) = J (Option A)."
  },

  series_letter_reverse: {
    id: "series_letter_reverse",
    title: "Reverse Alphabet Skip Series (Z, X, V, T, ?)",
    subType: "series",
    prompt: "Find the next letter in the countdown alphabet series: / الٹے حروف تہجی کے تسلسل کا اگلا حرف معلوم کریں:",
    topic: "Verbal Reasoning - Letter Series",
    series_type: "letter",
    series_tokens: ["Z", "X", "V", "T"],
    rule_hint: "Subtract 2 positions backwards (-2 Countdown)",
    options: [
      { id: "1", label: "A", text: "R" },
      { id: "2", label: "B", text: "S" },
      { id: "3", label: "C", text: "Q" },
      { id: "4", label: "D", text: "P" }
    ],
    correct: "1",
    explanation: "Letters countdown backwards by skipping 1 letter: Z(-2) = X, X(-2) = V, V(-2) = T. The next letter is T(-2) = R (Option A)."
  },

  // --- 3. ODD WORD OUT / CLASSIFICATION ---
  odd_words_metals: {
    id: "odd_words_metals",
    title: "Metals vs Insulator (Copper, Iron, Silver, Wood, Gold)",
    subType: "odd_one_out",
    prompt: "Identify the word that does NOT belong to the same group as the others: / نیچے دیے گئے الفاظ میں سے غیر متعلق لفظ کی نشاندہی کریں:",
    topic: "Verbal Reasoning - Classification",
    group_category: "Conductive Metallic Elements (دھاتیں)",
    words: ["Copper", "Iron", "Wood", "Silver", "Gold"],
    odd_index: 2,
    options: [
      { id: "1", label: "A", text: "Copper (تانبا)" },
      { id: "2", label: "B", text: "Iron (لوہا)" },
      { id: "3", label: "C", text: "Wood (لکڑی - غیر متعلق)" },
      { id: "4", label: "D", text: "Silver (چاندی)" },
      { id: "5", label: "E", text: "Gold (سونا)" }
    ],
    correct: "3",
    explanation: "Copper, Iron, Silver, and Gold are all metallic elements and electrical conductors. Wood is an organic non-metal and insulator, making it the Odd One Out."
  },

  odd_words_capitals: {
    id: "odd_words_capitals",
    title: "National Capitals vs City (Tokyo, Paris, London, Lahore, Berlin)",
    subType: "odd_one_out",
    prompt: "Select the city that does not belong to the set of national capitals: / ان میں سے کون سا شہر قومی دارالحکومت نہیں ہے؟",
    topic: "Verbal Reasoning - Classification",
    group_category: "Sovereign National Capitals (قومی دارالحکومت)",
    words: ["Tokyo", "Paris", "Lahore", "London", "Berlin"],
    odd_index: 2,
    options: [
      { id: "1", label: "A", text: "Tokyo (Japan Capital)" },
      { id: "2", label: "B", text: "Paris (France Capital)" },
      { id: "3", label: "C", text: "Lahore (Provincial City - Odd)" },
      { id: "4", label: "D", text: "London (UK Capital)" },
      { id: "5", label: "E", text: "Berlin (Germany Capital)" }
    ],
    correct: "3",
    explanation: "Tokyo, Paris, London, and Berlin are national capital cities. Lahore is a provincial capital (Punjab, Pakistan), not a national sovereign capital."
  },

  odd_words_planets: {
    id: "odd_words_planets",
    title: "Planets vs Satellite (Mars, Venus, Moon, Jupiter, Saturn)",
    subType: "odd_one_out",
    prompt: "Find the odd celestial object out from the list below: / درج ذیل میں سے مختلف اجرام فلکی کا انتخاب کریں:",
    topic: "Verbal Reasoning - Classification",
    group_category: "Major Solar System Planets (نظام شمسی کے سیارے)",
    words: ["Mars", "Venus", "Moon", "Jupiter", "Saturn"],
    odd_index: 2,
    options: [
      { id: "1", label: "A", text: "Mars (مریخ)" },
      { id: "2", label: "B", text: "Venus (زہرہ)" },
      { id: "3", label: "C", text: "Moon (چاند - سیارچہ/سیٹلائٹ)" },
      { id: "4", label: "D", text: "Jupiter (مشتری)" },
      { id: "5", label: "E", text: "Saturn (زحل)" }
    ],
    correct: "3",
    explanation: "Mars, Venus, Jupiter, and Saturn are major planets orbiting the Sun directly. The Moon is a natural satellite orbiting Earth, not a planet."
  },

  // --- 4. CODING & DECODING ---
  coding_caesar_plus1: {
    id: "coding_caesar_plus1",
    title: "+1 Forward Alphabet Shift (PEACE ➔ QFBDF, SMART ➔ ?)",
    subType: "coding",
    prompt: "If in a certain code language 'PEACE' is written as 'QFBDF', how will 'SMART' be coded in that same language? / اگر کسی کوڈ زبان میں PEACE کو QFBDF لکھا جائے تو SMART کو کیا لکھا جائے گا؟",
    topic: "Verbal Reasoning - Coding & Decoding",
    source_word: "PEACE",
    coded_word: "QFBDF",
    target_word: "SMART",
    coding_rule: "Each letter is shifted forward by +1 position (P+1=Q, E+1=F, A+1=B, C+1=D, E+1=F)",
    options: [
      { id: "1", label: "A", text: "TNBUS" },
      { id: "2", label: "B", text: "TOBVT" },
      { id: "3", label: "C", text: "RLZQS" },
      { id: "4", label: "D", text: "TNBVR" }
    ],
    correct: "1",
    explanation: "Applying +1 shift to each letter of SMART: S ➔ T, M ➔ N, A ➔ B, R ➔ U, T ➔ S. The resulting coded word is TNBUS (Option A)."
  },

  coding_reverse_letters: {
    id: "coding_reverse_letters",
    title: "Letter Sequence Reversal (SYSTEM ➔ METSYS, ACTION ➔ ?)",
    subType: "coding",
    prompt: "In a secret cipher, 'SYSTEM' is coded as 'METSYS'. How is 'ACTION' encrypted? / ایک خفیہ کوڈ میں SYSTEM کو METSYS لکھا جاتا ہے، تو ACTION کا کوڈ کیا ہوگا؟",
    topic: "Verbal Reasoning - Coding & Decoding",
    source_word: "SYSTEM",
    coded_word: "METSYS",
    target_word: "ACTION",
    coding_rule: "The letters of the word are written in completely reverse order from right to left",
    options: [
      { id: "1", label: "A", text: "NOITCA" },
      { id: "2", label: "B", text: "NOICTA" },
      { id: "3", label: "C", text: "NIOTCA" },
      { id: "4", label: "D", text: "NOTICA" }
    ],
    correct: "1",
    explanation: "The coding rule simply reverses all letters: A-C-T-I-O-N reversed from back to front produces N-O-I-T-C-A (Option A)."
  },

  // --- 5. BLOOD RELATIONS & DIRECTION SENSE ---
  blood_relations_sister: {
    id: "blood_relations_sister",
    title: "Kinship Deduction (Daughter of my father's only son)",
    subType: "blood_relations",
    prompt: "Pointing to a photograph, a boy said: 'She is the daughter of my father's only son.' How is the girl in the photograph related to the boy? / ایک تصویر کی طرف اشارہ کرتے ہوئے ایک لڑکے نے کہا: 'وہ میرے باپ کے اکلوتے بیٹے کی بیٹی ہے۔' اس لڑکی کا لڑکے سے کیا رشتہ ہے؟",
    topic: "Verbal Reasoning - Blood Relations",
    premise: "A boy points to a photo and states kinship clues:",
    clues: [
      "Clue 1: 'My father's only son' = The boy himself (since he has no other brothers)",
      "Clue 2: 'The daughter of the boy himself' = The boy's daughter"
    ],
    question_prompt: "Who is the girl to the boy?",
    options: [
      { id: "1", label: "A", text: "His Daughter (اس کی بیٹی)" },
      { id: "2", label: "B", text: "His Sister (اس کی بہن)" },
      { id: "3", label: "C", text: "His Niece (اس کی بھانجی)" },
      { id: "4", label: "D", text: "His Mother (اس کی ماں)" }
    ],
    correct: "1",
    explanation: "The boy's father's only son is the boy himself. Therefore, the daughter of his father's only son is his own daughter (Option A)."
  },

  direction_sense_walk: {
    id: "direction_sense_walk",
    title: "Cardinal Direction & Distance Tracking",
    subType: "blood_relations",
    prompt: "Ali walks 10 meters North, then turns right and walks 5 meters, and finally turns right again and walks 10 meters. In which direction is he now from his starting point? / علی 10 میٹر شمال کی طرف چلتا ہے، پھر دائیں مڑ کر 5 میٹر چلتا ہے، اور پھر دائیں مڑ کر 10 میٹر چلتا ہے۔ اب وہ اپنے ابتدائی مقام سے کس سمت میں ہے؟",
    topic: "Verbal Reasoning - Direction Sense",
    premise: "Ali's movement path step-by-step:",
    clues: [
      "Step 1: Walk 10m North (0, +10)",
      "Step 2: Turn Right (East) and walk 5m (+5, +10)",
      "Step 3: Turn Right (South) and walk 10m (+5, 0)"
    ],
    question_prompt: "In which direction is he located relative to his starting point (0,0)?",
    options: [
      { id: "1", label: "A", text: "East (مشرق)" },
      { id: "2", label: "B", text: "West (مغرب)" },
      { id: "3", label: "C", text: "North (شمال)" },
      { id: "4", label: "D", text: "South (جنوب)" }
    ],
    correct: "1",
    explanation: "After walking 10m North and then 10m South, his vertical displacement is zero (10m - 10m = 0). His horizontal displacement is 5m to the Right (East). Thus, he is directly East (Option A) of his starting point."
  }
};
