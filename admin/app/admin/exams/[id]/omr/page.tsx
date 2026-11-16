"use client";

import { useEffect, useState, use } from "react";
import Link from "next/link";
import {
  Printer,
  FileText,
  CheckCircle2,
  Layers,
  Users,
  KeyRound,
  RefreshCw,
  QrCode,
  ArrowLeft,
  Settings,
  Sparkles,
  Download,
  AlertCircle
} from "lucide-react";
import { formatMarkdownPreview } from "@/lib/renderMath";

interface OmrQuestion {
  id: number;
  original_number: number;
  set_number?: number;
  question_text: string;
  question_type: string;
  marks: number;
  explanation?: string;
  options: Array<{
    id: string;
    label: string;
    text?: string;
    image_url?: string;
    is_correct: boolean;
  }>;
  correct_letter: string;
  sub_type?: string;
}

interface OmrSet {
  id?: number;
  exam_id: number;
  set_code: string;
  set_number: number;
  questions: OmrQuestion[];
  answer_key: Record<number, string>;
  questions_order: number[];
}

interface Allocation {
  id?: number;
  student_id?: number;
  registration_no?: string;
  roll_number?: string;
  student_name: string;
  seat_number: string;
  set_code: string;
  barcode: string;
}

export default function ExamOmrHubPage({
  params
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = use(params);
  const examId = Number(id);

  const [isLoading, setIsLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [exam, setExam] = useState<any>(null);
  const [sets, setSets] = useState<OmrSet[]>([]);
  const [allocations, setAllocations] = useState<Allocation[]>([]);
  const [enrolledStudents, setEnrolledStudents] = useState<any[]>([]);

  // Generator Config
  const [setCount, setSetCount] = useState<number>(4);
  const [shuffleOptions, setShuffleOptions] = useState<boolean>(true);
  const [candidateScope, setCandidateScope] = useState<"enrolled" | "custom_count">("enrolled");
  const [customCount, setCustomCount] = useState<number>(50);

  // Active View Tab & Print Filters
  const [activeTab, setActiveTab] = useState<"booklets" | "omr_sheets" | "solution_keys" | "roster">("booklets");
  const [selectedSetFilter, setSelectedSetFilter] = useState<string>("all");
  const [selectedCandidateFilter, setSelectedCandidateFilter] = useState<string>("all");

  const fetchOmrData = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/admin/exams/${examId}/omr`);
      const data = (await res.json()) as any;
      if (data?.success) {
        setExam(data.exam);
        setSets(data.sets || []);
        setAllocations(data.allocations || []);
        setEnrolledStudents(data.enrolledStudents || []);
        if (data.exam?.omr_set_count) {
          setSetCount(data.exam.omr_set_count);
        }
      }
    } catch (err) {
      console.error("Failed to load OMR data:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchOmrData();
  }, [examId]);

  const handleGeneratePack = async () => {
    setIsGenerating(true);
    try {
      const res = await fetch(`/api/admin/exams/${examId}/omr`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          setCount,
          shuffleOptions,
          candidateScope,
          customCount
        })
      });
      const data = (await res.json()) as any;
      if (data?.success) {
        setSets(data.sets);
        setAllocations(data.allocations);
        alert(data.message || "OMR Pack generated successfully!");
      } else {
        alert(data?.error || "Failed to generate OMR pack.");
      }
    } catch (err: any) {
      alert("Error generating OMR: " + err.message);
    } finally {
      setIsGenerating(false);
    }
  };

  const handlePrint = (
    tabKey: "booklets" | "omr_sheets" | "solution_keys" | "roster",
    specificSet?: string,
    specificCandidate?: string
  ) => {
    setActiveTab(tabKey);
    if (specificSet) {
      setSelectedSetFilter(specificSet);
    }
    if (specificCandidate) {
      setSelectedCandidateFilter(specificCandidate);
    }
    setTimeout(() => {
      window.print();
    }, 150);
  };

  if (isLoading) {
    return (
      <div className="min-h-[500px] flex items-center justify-center text-slate-500 gap-3">
        <RefreshCw className="w-5 h-5 animate-spin text-blue-600" />
        <span>Loading Examination & OMR Engine...</span>
      </div>
    );
  }

  if (!exam) {
    return (
      <div className="p-8 text-center bg-white rounded-2xl border border-slate-200">
        <AlertCircle className="w-8 h-8 text-rose-500 mx-auto mb-2" />
        <h2 className="text-lg font-bold text-slate-800">Examination Not Found</h2>
        <Link href="/admin/exams" className="text-blue-600 hover:underline text-xs mt-3 inline-block">
          &larr; Back to Exams List
        </Link>
      </div>
    );
  }

  const visibleSets = selectedSetFilter === "all" ? sets : sets.filter(s => s.set_code === selectedSetFilter);
  const visibleAllocations = selectedCandidateFilter === "all" ? allocations : allocations.filter(a => a.barcode === selectedCandidateFilter);

  return (
    <div className="space-y-6">
      {/* 1. Header (Strictly hidden during browser print) */}
      <div className="print:hidden flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <Link
              href="/admin/exams"
              className="text-xs font-bold text-slate-500 hover:text-slate-800 flex items-center gap-1 transition"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Exams</span>
            </Link>
            <span className="text-slate-300">•</span>
            <span className="text-xs font-bold text-blue-600 font-mono">
              {exam.course_code}
            </span>
          </div>
          <h1 className="text-2xl font-black text-slate-900 font-heading mt-1 flex items-center gap-2.5">
            <span>OMR Paper Testing Center</span>
            <span className="bg-purple-100 text-purple-800 text-xs font-bold px-2.5 py-0.5 rounded-full">
              Batch Shuffling Engine
            </span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Exam: <strong>{exam.title}</strong> • Duration: {exam.duration_minutes} Mins • Total Marks: {exam.total_marks}
          </p>
        </div>

        {/* 1-Click Targeted Print Hub Buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => handlePrint("booklets")}
            className="text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 px-3.5 py-2.5 rounded-xl transition flex items-center gap-1.5 shadow-2xs"
            title="Print Question Booklets (Clean A4 Paper)"
          >
            <FileText className="w-4 h-4 text-blue-600" />
            <span>Print {selectedSetFilter === "all" ? "All Booklets" : `${selectedSetFilter} Booklet`}</span>
          </button>

          <button
            onClick={() => handlePrint("omr_sheets")}
            className="text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 px-3.5 py-2.5 rounded-xl transition flex items-center gap-1.5 shadow-2xs"
            title="Print Candidate OMR Sheets (1 Page Per Candidate)"
          >
            <QrCode className="w-4 h-4 text-emerald-600" />
            <span>Print {selectedCandidateFilter === "all" ? "All OMR Sheets" : "Candidate OMR Sheet"}</span>
          </button>

          <button
            onClick={() => handlePrint("solution_keys")}
            className="text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 px-3.5 py-2.5 rounded-xl transition flex items-center gap-1.5 shadow-2xs"
            title="Print Master Keys for Overlay"
          >
            <KeyRound className="w-4 h-4 text-purple-600" />
            <span>Print {selectedSetFilter === "all" ? "All Master Keys" : `${selectedSetFilter} Key`}</span>
          </button>

          <button
            onClick={() => handlePrint("roster")}
            className="text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 px-4 py-2.5 rounded-xl transition flex items-center gap-1.5 shadow-sm active:scale-95"
            title="Print Seating Allocation Roster"
          >
            <Users className="w-4 h-4" />
            <span>Print Seating Roster</span>
          </button>
        </div>
      </div>

      {/* 2. Configuration & Generation Card (Hidden during print) */}
      <div className="print:hidden bg-gradient-to-r from-blue-50/60 via-indigo-50/40 to-white p-5 rounded-2xl border border-blue-200/70 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Settings className="w-4 h-4 text-blue-600" />
            <h3 className="text-sm font-bold text-slate-900 font-heading">
              Paper Sets & Anti-Cheating Shuffling Configuration
            </h3>
          </div>
          <span className="text-xs text-slate-500 font-medium">
            Active Sets: <strong className="text-blue-700">{sets.length} Sets Generated</strong>
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 pt-1">
          {/* Sets Count */}
          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1">
              Number of Paper Sets:
            </label>
            <select
              value={setCount}
              onChange={(e) => setSetCount(Number(e.target.value))}
              className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-blue-500/20 focus:outline-none"
            >
              <option value="2">2 Sets (Set A, Set B)</option>
              <option value="4">4 Sets (Set A, B, C, D) - Standard</option>
              <option value="6">6 Sets (Set A through F)</option>
              <option value="8">8 Sets (Set A through H)</option>
              <option value="10">10 Batches (Batch 01 to 10)</option>
            </select>
            <p className="text-[10px] text-slate-500 mt-1">Distributed round-robin to adjacent candidates.</p>
          </div>

          {/* Option Shuffling */}
          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1">
              Option Randomization:
            </label>
            <div className="flex items-center gap-2 pt-1.5">
              <input
                type="checkbox"
                id="chk-shuffle-opts"
                checked={shuffleOptions}
                onChange={(e) => setShuffleOptions(e.target.checked)}
                className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500"
              />
              <label htmlFor="chk-shuffle-opts" className="text-xs font-semibold text-slate-800 cursor-pointer">
                Shuffle options (A-E) per set
              </label>
            </div>
            <p className="text-[10px] text-slate-500 mt-1">Options A, B, C, D, E rotate across codes.</p>
          </div>

          {/* Candidate Allocation Scope */}
          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1">
              Candidate Scope:
            </label>
            <select
              value={candidateScope}
              onChange={(e) => setCandidateScope(e.target.value as any)}
              className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-blue-500/20 focus:outline-none"
            >
              <option value="enrolled">
                Enrolled Students ({enrolledStudents.length} Students)
              </option>
              <option value="custom_count">
                Custom Candidate Count (e.g. 200 candidates)
              </option>
            </select>
            <p className="text-[10px] text-slate-500 mt-1">Generates personalized OMR sheets.</p>
          </div>

          {/* Custom Count if applicable */}
          {candidateScope === "custom_count" ? (
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                Candidate Hall Seats:
              </label>
              <input
                type="number"
                min="10"
                max="1000"
                value={customCount}
                onChange={(e) => setCustomCount(Number(e.target.value))}
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-blue-500/20 focus:outline-none"
              />
              <p className="text-[10px] text-slate-500 mt-1">Total seats to distribute sets across.</p>
            </div>
          ) : (
            <div className="flex items-end">
              <button
                onClick={handleGeneratePack}
                disabled={isGenerating}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs py-2.5 px-4 rounded-xl transition shadow-xs flex items-center justify-center gap-1.5 disabled:opacity-50"
              >
                {isGenerating ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Generating Sets & Keys...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Regenerate OMR Exam Pack</span>
                  </>
                )}
              </button>
            </div>
          )}
        </div>

        {candidateScope === "custom_count" && (
          <div className="pt-2 flex justify-end">
            <button
              onClick={handleGeneratePack}
              disabled={isGenerating}
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs py-2 px-5 rounded-xl transition shadow-xs flex items-center gap-1.5 disabled:opacity-50"
            >
              {isGenerating ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
              <span>Generate OMR Exam Pack for {customCount} Candidates</span>
            </button>
          </div>
        )}
      </div>

      {/* 3. Navigation Tabs (Hidden during print) */}
      <div className="print:hidden flex items-center justify-between border-b border-slate-200 pb-2">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab("booklets")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
              activeTab === "booklets"
                ? "bg-slate-900 text-white shadow-xs"
                : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Question Booklets ({sets.length} Sets)</span>
          </button>

          <button
            onClick={() => setActiveTab("omr_sheets")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
              activeTab === "omr_sheets"
                ? "bg-slate-900 text-white shadow-xs"
                : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
            }`}
          >
            <QrCode className="w-3.5 h-3.5" />
            <span>Candidate OMR Sheets ({allocations.length})</span>
          </button>

          <button
            onClick={() => setActiveTab("solution_keys")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
              activeTab === "solution_keys"
                ? "bg-slate-900 text-white shadow-xs"
                : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
            }`}
          >
            <KeyRound className="w-3.5 h-3.5" />
            <span>Master Answer Keys ({sets.length})</span>
          </button>

          <button
            onClick={() => setActiveTab("roster")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
              activeTab === "roster"
                ? "bg-slate-900 text-white shadow-xs"
                : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>Seating Allocation Roster</span>
          </button>
        </div>

        {/* Set Filter Dropdown */}
        {(activeTab === "booklets" || activeTab === "solution_keys") && (
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-400">Filter View:</span>
            <select
              value={selectedSetFilter}
              onChange={(e) => setSelectedSetFilter(e.target.value)}
              className="px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none"
            >
              <option value="all">All Sets ({sets.length})</option>
              {sets.map(s => (
                <option key={s.set_code} value={s.set_code}>
                  {s.set_code} (Set #{s.set_number})
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Candidate Filter Dropdown for OMR Sheets */}
        {activeTab === "omr_sheets" && (
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-400">Filter Candidate:</span>
            <select
              value={selectedCandidateFilter}
              onChange={(e) => setSelectedCandidateFilter(e.target.value)}
              className="px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none max-w-[240px]"
            >
              <option value="all">All Candidates ({allocations.length})</option>
              {allocations.map((a, idx) => (
                <option key={a.barcode || idx} value={a.barcode}>
                  Seat {a.seat_number}: {a.student_name} ({a.set_code})
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: QUESTION BOOKLETS (A4 Printable) */}
      {/* ========================================================================= */}
      {activeTab === "booklets" && (
        <div className="space-y-8">
          {visibleSets.map((s) => (
            <div key={s.set_code} className="space-y-3">
              {/* Screen-Only Set Action Header */}
              <div className="print:hidden flex items-center justify-between bg-blue-50/80 border border-blue-200 px-5 py-3 rounded-2xl shadow-2xs">
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-1 bg-blue-600 text-white font-mono font-bold text-xs rounded-lg">
                    {s.set_code}
                  </span>
                  <span className="text-xs font-bold text-slate-800">
                    Question Booklet ({s.questions.length} Questions)
                  </span>
                </div>
                <button
                  onClick={() => handlePrint("booklets", s.set_code)}
                  className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-2xs transition active:scale-95"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Print Only {s.set_code} Booklet</span>
                </button>
              </div>

              {/* Printable Question Paper Document */}
              <div
                className="printable-document bg-white p-8 sm:p-12 rounded-3xl border border-slate-300 shadow-md print:shadow-none print:border-none print:p-0 print:m-0 break-after-page page-break-after"
              >
                {/* Question Paper Header */}
                <div className="border-b-2 border-slate-900 pb-4 mb-6">
                  <div className="flex items-start justify-between">
                    <div>
                      <h2 className="text-2xl font-black text-slate-900 tracking-tight font-heading">
                        SHARP ACADEMY & CADET PREPARATORY SYSTEM
                      </h2>
                      <h3 className="text-lg font-bold text-slate-800 mt-0.5">
                        {exam.title}
                      </h3>
                      <p className="text-xs text-slate-600 font-medium">
                        Course: <strong>{exam.course_title || exam.course_code}</strong> • Time Allowed: <strong>{exam.duration_minutes} Minutes</strong> • Total Marks: <strong>{exam.total_marks}</strong>
                      </p>
                    </div>

                    {/* Large High-Contrast Paper Code Box */}
                    <div className="text-center border-2 border-slate-900 bg-slate-50 px-5 py-2.5 rounded-xl shrink-0">
                      <span className="text-[10px] font-black uppercase tracking-widest text-slate-500 block">
                        PAPER CODE
                      </span>
                      <span className="text-2xl font-black text-slate-900 font-mono tracking-wider block">
                        {s.set_code}
                      </span>
                    </div>
                  </div>

                  {/* Candidate Info Input Box for Paper Test */}
                  <div className="grid grid-cols-3 gap-3 border border-slate-300 rounded-xl p-2.5 mt-4 text-xs font-semibold bg-slate-50/50">
                    <div>Candidate Name: _______________________</div>
                    <div>Roll Number: _________________________</div>
                    <div>Center / Room: ________________________</div>
                  </div>

                  {/* Instructions */}
                  <div className="mt-3 text-[11px] text-slate-600 bg-amber-50/60 p-2 rounded-lg border border-amber-200/60 flex items-center justify-between">
                    <span>
                      <strong>INSTRUCTIONS:</strong> Mark all answers on the separate OMR Answer Sheet provided using Black/Blue ballpoint pen. Do not write or mark answers on this question paper. Ensure your Paper Code matches the code on your OMR sheet.
                    </span>
                  </div>
                </div>

                {/* Questions Grid (2 Columns on Print, 1 Column on Mobile) */}
                <div className="grid grid-cols-1 md:grid-cols-2 print:grid-cols-2 gap-x-8 gap-y-6">
                  {s.questions.map((q, qIndex) => (
                    <div key={q.id} className="break-inside-avoid print:break-inside-avoid space-y-2 border-b border-slate-100 pb-4 print:pb-3">
                      <div className="flex items-start gap-2">
                        <span className="w-6 h-6 rounded-md bg-slate-900 text-white font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
                          {qIndex + 1}
                        </span>
                        <div className="flex-1">
                          <div
                            className="text-xs font-semibold text-slate-900 leading-relaxed overflow-hidden print:overflow-visible"
                            dangerouslySetInnerHTML={{ __html: formatMarkdownPreview(q.question_text) }}
                          />
                        </div>
                        <span className="text-[10px] font-mono text-slate-400 shrink-0">
                          [{q.marks}m]
                        </span>
                      </div>

                      {/* Options (5 options A-E) */}
                      <div className="space-y-1.5 pl-8 text-xs">
                        {q.options.map((opt) => (
                          <div key={opt.id} className="flex items-start gap-2">
                            <span className="w-5 h-5 rounded-full border border-slate-400 font-bold text-[11px] flex items-center justify-center shrink-0">
                              {opt.label}
                            </span>
                            <div className="flex-1 text-slate-700">
                              {opt.image_url ? (
                                <div className="space-y-1">
                                  {opt.text && <div>{opt.text}</div>}
                                  <img
                                    src={opt.image_url}
                                    alt={`Option ${opt.label}`}
                                    className="w-14 h-14 border border-slate-300 rounded bg-white object-contain p-1"
                                  />
                                </div>
                              ) : (
                                <span dangerouslySetInnerHTML={{ __html: formatMarkdownPreview(opt.text || "") }} />
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>

                {/* End of paper banner */}
                <div className="mt-8 pt-4 border-t border-slate-300 text-center text-xs font-bold text-slate-400 uppercase tracking-widest">
                  *** END OF QUESTION PAPER ({s.set_code}) ***
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: CANDIDATE OMR ANSWER SHEETS (Personalized & 5-Bubble Grid) */}
      {/* ========================================================================= */}
      {activeTab === "omr_sheets" && (
        <div className="space-y-8">
          {(visibleAllocations.length > 0 ? visibleAllocations : [
            { student_name: "Sample Candidate", roll_number: "ROLL-001", seat_number: "001", set_code: "SET-A", barcode: "OMR-SAMPLE-01" }
          ]).map((cand, candIdx) => (
            <div key={candIdx} className="space-y-3">
              {/* Screen-Only Action Header */}
              <div className="print:hidden flex items-center justify-between bg-emerald-50/80 border border-emerald-200 px-5 py-3 rounded-2xl shadow-2xs max-w-[800px] mx-auto">
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 bg-emerald-700 text-white font-mono font-bold text-xs rounded-md">
                    Seat {cand.seat_number}
                  </span>
                  <span className="text-xs font-bold text-slate-800">
                    {cand.student_name} • {cand.set_code}
                  </span>
                </div>
                <button
                  onClick={() => handlePrint("omr_sheets", undefined, cand.barcode)}
                  className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-2xs transition active:scale-95"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Print This Sheet Only</span>
                </button>
              </div>

              {/* Printable OMR Sheet */}
              <div
                className="printable-document bg-white p-8 sm:p-10 rounded-3xl border border-slate-300 shadow-md print:shadow-none print:border-none print:p-0 print:m-0 break-after-page page-break-after break-inside-avoid print:break-inside-avoid max-w-[800px] mx-auto"
              >
                {/* OMR Header with Alignment Markers */}
                <div className="flex items-center justify-between border-b-2 border-slate-900 pb-3">
                  {/* Top-Left Alignment Box */}
                  <div className="w-5 h-5 bg-black" />

                  <div className="text-center">
                    <h3 className="text-lg font-black text-slate-900 uppercase tracking-wide">
                      SHARP ACADEMY • OPTICAL MARK RECOGNITION (OMR) SHEET
                    </h3>
                    <p className="text-[11px] font-bold text-slate-600">
                      {exam.title} ({exam.course_code})
                    </p>
                  </div>

                  {/* Top-Right Alignment Box */}
                  <div className="w-5 h-5 bg-black" />
                </div>

                {/* Candidate Info & Set Code Block */}
                <div className="grid grid-cols-3 gap-3 my-4 p-3 border-2 border-slate-900 rounded-xl text-xs bg-slate-50">
                  <div className="space-y-1">
                    <div>Candidate Name: <strong className="text-slate-900 block text-sm">{cand.student_name}</strong></div>
                    <div>Seat Number: <strong>{cand.seat_number}</strong></div>
                  </div>

                  <div className="space-y-1">
                    <div>Roll Number: <strong className="text-slate-900 block text-sm font-mono">{cand.roll_number || cand.registration_no || "N/A"}</strong></div>
                    <div>Date: <strong>{new Date().toLocaleDateString()}</strong></div>
                  </div>

                  {/* Highlighted Set Code */}
                  <div className="border border-slate-400 bg-white rounded-lg p-2 text-center flex flex-col justify-center items-center">
                    <span className="text-[10px] font-bold text-slate-500 uppercase">Assigned Paper Code</span>
                    <span className="text-xl font-black text-slate-900 font-mono tracking-wider">
                      {cand.set_code}
                    </span>
                    <span className="text-[9px] font-mono text-slate-400">{cand.barcode}</span>
                  </div>
                </div>

                {/* Instructions Bar */}
                <div className="text-[10px] text-slate-600 border border-slate-300 bg-slate-100 p-2 rounded-lg mb-4 flex items-center justify-between">
                  <span>
                    <strong>HOW TO FILL BUBBLES:</strong> Fill bubble completely like this: ●. Do not tick ✓, cross ✕, or make half marks. Use Black or Blue ballpoint pen only.
                  </span>
                  <span className="font-bold text-slate-800">5 Options: (A) (B) (C) (D) (E)</span>
                </div>

                {/* OMR 5-Bubble Matrix (Arranged in 2 or 3 Columns for 50-100 questions) */}
                <div className="grid grid-cols-2 gap-6 border-2 border-slate-900 p-4 rounded-xl">
                  {/* Column 1 (Q 1 to 25) */}
                  <div className="space-y-1 divide-y divide-slate-100">
                    {Array.from({ length: Math.min(25, (sets[0]?.questions.length || 25)) }).map((_, i) => (
                      <div key={i} className="flex items-center justify-between py-1 text-xs">
                        <span className="w-7 font-mono font-bold text-slate-700">
                          {String(i + 1).padStart(2, "0")}
                        </span>
                        <div className="flex items-center gap-2">
                          {["A", "B", "C", "D", "E"].map((letter) => (
                            <div
                              key={letter}
                              className="w-6 h-6 rounded-full border-2 border-slate-800 font-bold text-[10px] flex items-center justify-center text-slate-700"
                            >
                              {letter}
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Column 2 (Q 26 to 50) */}
                  <div className="space-y-1 divide-y divide-slate-100">
                    {Array.from({ length: Math.max(0, (sets[0]?.questions.length || 25) - 25) }).map((_, i) => {
                      const qNum = i + 26;
                      return (
                        <div key={qNum} className="flex items-center justify-between py-1 text-xs">
                          <span className="w-7 font-mono font-bold text-slate-700">
                            {String(qNum).padStart(2, "0")}
                          </span>
                          <div className="flex items-center gap-2">
                            {["A", "B", "C", "D", "E"].map((letter) => (
                              <div
                                key={letter}
                                className="w-6 h-6 rounded-full border-2 border-slate-800 font-bold text-[10px] flex items-center justify-center text-slate-700"
                              >
                                {letter}
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Signatures & Bottom Alignment Markers */}
                <div className="grid grid-cols-2 gap-8 mt-6 pt-6 border-t-2 border-slate-900 text-xs font-bold text-slate-700">
                  <div className="border-t border-dashed border-slate-400 pt-1 text-center">
                    Candidate Signature
                  </div>
                  <div className="border-t border-dashed border-slate-400 pt-1 text-center">
                    Invigilator Signature & Stamp
                  </div>
                </div>

                {/* Bottom Alignment Markers */}
                <div className="flex items-center justify-between pt-4 mt-2">
                  <div className="w-5 h-5 bg-black" />
                  <span className="text-[9px] font-mono text-slate-400 font-bold">
                    OMR TEMPLATE REV 2.4 • SHARP ACADEMY CBT-PBT ENGINE
                  </span>
                  <div className="w-5 h-5 bg-black" />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: MASTER SOLUTION KEYS (With Solid Filled Bubbles for Overlay) */}
      {/* ========================================================================= */}
      {activeTab === "solution_keys" && (
        <div className="space-y-8">
          {visibleSets.map((s) => (
            <div key={s.set_code} className="space-y-3">
              {/* Screen-Only Set Action Header */}
              <div className="print:hidden flex items-center justify-between bg-purple-50/80 border border-purple-200 px-5 py-3 rounded-2xl shadow-2xs max-w-[800px] mx-auto">
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-1 bg-purple-700 text-white font-mono font-bold text-xs rounded-lg">
                    {s.set_code}
                  </span>
                  <span className="text-xs font-bold text-slate-800">
                    Master Solution Key ({Object.keys(s.answer_key).length} Answers)
                  </span>
                </div>
                <button
                  onClick={() => handlePrint("solution_keys", s.set_code)}
                  className="px-3.5 py-1.5 bg-purple-700 hover:bg-purple-800 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-2xs transition active:scale-95"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Print Only {s.set_code} Key</span>
                </button>
              </div>

              {/* Printable Solution Key Card */}
              <div
                className="printable-document bg-white p-8 sm:p-10 rounded-3xl border border-slate-300 shadow-md print:shadow-none print:border-none print:p-0 print:m-0 break-after-page page-break-after break-inside-avoid print:break-inside-avoid max-w-[800px] mx-auto"
              >
                {/* Header */}
                <div className="border-b-2 border-slate-900 pb-3 flex items-center justify-between">
                  <div>
                    <h3 className="text-xl font-black text-slate-900 uppercase">
                      MASTER SCORING & SOLUTION KEY
                    </h3>
                    <p className="text-xs text-slate-600 font-semibold">
                      Exam: {exam.title} ({exam.course_code}) • Set Code: <strong>{s.set_code}</strong>
                    </p>
                  </div>
                  <div className="text-center bg-purple-100 border-2 border-purple-800 text-purple-950 px-4 py-1.5 rounded-xl font-mono text-xl font-black">
                    {s.set_code}
                  </div>
                </div>

                <div className="my-3 text-xs bg-purple-50 text-purple-900 p-2.5 rounded-xl border border-purple-200">
                  <strong>TRANSPARENCY OVERLAY TEMPLATE:</strong> Print on standard acetate or paper. Correct bubbles are marked solid black. Use for immediate overlay grading or manual key-in.
                </div>

                {/* Marked OMR Grid */}
                <div className="grid grid-cols-2 gap-6 border-2 border-slate-900 p-4 rounded-xl my-4">
                  {/* Column 1 (Q 1 to 25) */}
                  <div className="space-y-1 divide-y divide-slate-100">
                    {Array.from({ length: Math.min(25, s.questions.length) }).map((_, i) => {
                      const qNum = i + 1;
                      const correctLetter = s.answer_key[qNum] || "A";
                      return (
                        <div key={qNum} className="flex items-center justify-between py-1 text-xs">
                          <span className="w-8 font-mono font-bold text-slate-700">
                            {String(qNum).padStart(2, "0")}
                            <strong className="text-purple-700 ml-1">({correctLetter})</strong>
                          </span>
                          <div className="flex items-center gap-2">
                            {["A", "B", "C", "D", "E"].map((letter) => {
                              const isCorrect = letter === correctLetter;
                              return (
                                <div
                                  key={letter}
                                  className={`w-6 h-6 rounded-full font-bold text-[10px] flex items-center justify-center transition ${
                                    isCorrect
                                      ? "bg-black text-white border-2 border-black ring-2 ring-purple-600/30"
                                      : "border-2 border-slate-300 text-slate-400"
                                  }`}
                                >
                                  {letter}
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Column 2 (Q 26 to 50) */}
                  <div className="space-y-1 divide-y divide-slate-100">
                    {Array.from({ length: Math.max(0, s.questions.length - 25) }).map((_, i) => {
                      const qNum = i + 26;
                      const correctLetter = s.answer_key[qNum] || "A";
                      return (
                        <div key={qNum} className="flex items-center justify-between py-1 text-xs">
                          <span className="w-8 font-mono font-bold text-slate-700">
                            {String(qNum).padStart(2, "0")}
                            <strong className="text-purple-700 ml-1">({correctLetter})</strong>
                          </span>
                          <div className="flex items-center gap-2">
                            {["A", "B", "C", "D", "E"].map((letter) => {
                              const isCorrect = letter === correctLetter;
                              return (
                                <div
                                  key={letter}
                                  className={`w-6 h-6 rounded-full font-bold text-[10px] flex items-center justify-center transition ${
                                    isCorrect
                                      ? "bg-black text-white border-2 border-black ring-2 ring-purple-600/30"
                                      : "border-2 border-slate-300 text-slate-400"
                                  }`}
                                >
                                  {letter}
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Solution Mapping Table Summary */}
                <div className="mt-4 pt-3 border-t border-slate-200">
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">
                    Quick Mapping Sequence:
                  </span>
                  <div className="flex flex-wrap gap-1 text-[11px] font-mono">
                    {Object.entries(s.answer_key).map(([num, letter]) => (
                      <span key={num} className="bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                        Q{num}:<strong>{letter}</strong>
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 4: SEATING & ALLOCATION ROSTER */}
      {/* ========================================================================= */}
      {activeTab === "roster" && (
        <div className="space-y-3">
          <div className="print:hidden flex items-center justify-between bg-blue-50/80 border border-blue-200 px-5 py-3 rounded-2xl shadow-2xs">
            <span className="text-xs font-bold text-slate-800">
              Complete Seating Allocation Roster ({allocations.length} Candidates)
            </span>
            <button
              onClick={() => handlePrint("roster")}
              className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-2xs transition active:scale-95"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print Seating Roster</span>
            </button>
          </div>

          <div className="printable-document bg-white p-8 rounded-3xl border border-slate-200 shadow-sm print:shadow-none print:border-none print:p-0">
            <div className="border-b-2 border-slate-900 pb-3 mb-4 flex items-center justify-between">
              <div>
                <h3 className="text-xl font-black text-slate-900 font-heading">
                  EXAMINATION SEATING & PAPER CODE ROSTER
                </h3>
                <p className="text-xs text-slate-600 font-medium">
                  Exam: <strong>{exam.title}</strong> • Total Registered Candidates: <strong>{allocations.length}</strong>
                </p>
              </div>
              <div className="text-right text-xs text-slate-500 font-mono">
                Sets Rotated: <strong>{sets.map(s => s.set_code).join(", ")}</strong>
              </div>
            </div>

            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-100 border-b border-slate-300 text-slate-700 font-bold uppercase tracking-wider">
                  <th className="p-2.5 border">Seat #</th>
                  <th className="p-2.5 border">Roll Number</th>
                  <th className="p-2.5 border">Candidate Name</th>
                  <th className="p-2.5 border text-center">Assigned Paper Code</th>
                  <th className="p-2.5 border">Tracking Barcode</th>
                  <th className="p-2.5 border text-center">Invigilator Check</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 font-medium">
                {allocations.map((a, idx) => (
                  <tr key={idx} className={idx % 2 === 0 ? "bg-white" : "bg-slate-50/50"}>
                    <td className="p-2.5 border font-mono font-bold text-slate-800">{a.seat_number}</td>
                    <td className="p-2.5 border font-mono">{a.registration_no || "N/A"}</td>
                    <td className="p-2.5 border font-semibold text-slate-900">{a.student_name}</td>
                    <td className="p-2.5 border text-center font-bold font-mono">
                      <span className="bg-purple-100 text-purple-900 px-2 py-0.5 rounded border border-purple-300">
                        {a.set_code}
                      </span>
                    </td>
                    <td className="p-2.5 border font-mono text-[10px] text-slate-500">{a.barcode}</td>
                    <td className="p-2.5 border text-center">
                      <div className="w-4 h-4 border border-slate-400 rounded mx-auto" />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
