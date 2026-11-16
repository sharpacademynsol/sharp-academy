"use client";

import { useState, useRef, useEffect } from "react";
import * as XLSX from "xlsx";
import { 
  FileSpreadsheet, 
  Download, 
  Upload, 
  CheckCircle2, 
  AlertTriangle, 
  X, 
  Check, 
  FileText, 
  Info, 
  Sparkles,
  Layers,
  HelpCircle,
  BrainCircuit,
  Loader2,
  ArrowRight
} from "lucide-react";
import { 
  generateQuestionBankTemplate, 
  parseQuestionBankExcel, 
  CourseRef, 
  ParsedQuestionRow 
} from "@/lib/excelTemplate";
import { formatMarkdownPreview } from "@/lib/renderMath";

const TEMPLATE_TYPES = [
  { id: "mcq", label: "Multiple Choice (MCQ)", desc: "Standard 4-option single correct questions" },
  { id: "multi_select", label: "Multi-Select", desc: "Multiple checkboxes correct (e.g. 1, 3)" },
  { id: "true_false", label: "True / False", desc: "Binary factual statements" },
  { id: "fill_blank", label: "Fill in Blanks", desc: "Missing words with alternative valid spellings" },
  { id: "numerical", label: "Numerical Calculation", desc: "Exact target value, tolerance, and unit" },
  { id: "column_mapping", label: "Column Mapping", desc: "Match items from Column A to Column B" },
  { id: "non_verbal", label: "Non-Verbal Intelligence (Shapes & IQ)", desc: "Pattern series, analogies & matrices with explicit '?' target slot and built-in shape keys" },
  { id: "verbal_reasoning", label: "Verbal Reasoning (Analogies, Series & Coding)", desc: "Verbal analogies, letter/number series, odd word out, coding & blood relations" },
  { id: "universal", label: "Universal Multi-Format Sheet", desc: "Mix multiple question types in a single sheet" },
];

export default function BulkImportModal({
  isOpen,
  onClose,
  courses,
  onImportSuccess,
  defaultType = "mcq"
}: {
  isOpen: boolean;
  onClose: () => void;
  courses: CourseRef[];
  onImportSuccess: () => void;
  defaultType?: string;
}) {
  const [selectedCourseId, setSelectedCourseId] = useState<string>(
    courses[0]?.id ? String(courses[0].id) : "1"
  );
  const [selectedType, setSelectedType] = useState<string>(
    defaultType && defaultType !== "all" ? defaultType : "mcq"
  );

  useEffect(() => {
    if (defaultType && defaultType !== "all") {
      setSelectedType(defaultType);
    }
  }, [defaultType, isOpen]);
  
  // File upload & parsing state
  const [file, setFile] = useState<File | null>(null);
  const [parsedRows, setParsedRows] = useState<ParsedQuestionRow[]>([]);
  const [isParsing, setIsParsing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [importSuccess, setImportSuccess] = useState<{ count: number } | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  // Handle Template Download
  const handleDownloadTemplate = () => {
    const wb = generateQuestionBankTemplate(selectedType, courses, selectedCourseId);
    const filename = `question_bank_template_${selectedType}.xlsx`;
    XLSX.writeFile(wb, filename);
  };

  // Handle File Change & Parse
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const uploadedFile = e.target.files?.[0];
    if (!uploadedFile) return;

    setFile(uploadedFile);
    setIsParsing(true);

    try {
      const buffer = await uploadedFile.arrayBuffer();
      const results = parseQuestionBankExcel(
        buffer,
        courses,
        Number(selectedCourseId),
        selectedType === "universal" ? undefined : selectedType
      );
      setParsedRows(results);
    } catch (err: any) {
      setErrorMessage("Error parsing spreadsheet: " + err.message);
      setParsedRows([]);
    } finally {
      setIsParsing(false);
    }
  };

  // Drag and Drop support
  const handleDrop = async (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const droppedFile = e.dataTransfer.files?.[0];
    if (!droppedFile) return;

    setFile(droppedFile);
    setIsParsing(true);

    try {
      const buffer = await droppedFile.arrayBuffer();
      const results = parseQuestionBankExcel(
        buffer,
        courses,
        Number(selectedCourseId),
        selectedType === "universal" ? undefined : selectedType
      );
      setParsedRows(results);
    } catch (err: any) {
      setErrorMessage("Error parsing spreadsheet: " + err.message);
      setParsedRows([]);
    } finally {
      setIsParsing(false);
    }
  };

  // Submit valid rows to backend API
  const handleConfirmImport = async () => {
    const validQuestions = parsedRows.filter(r => r.isValid);
    if (validQuestions.length === 0) {
      setErrorMessage("No valid questions found to import. Please ensure your Excel spreadsheet contains rows marked as Valid.");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch("/api/admin/question-bank/bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ questions: validQuestions })
      });

      if (!res.ok) {
        const errText = await res.text();
        throw new Error(errText || "Failed to bulk import questions");
      }

      const data = (await res.json()) as any;
      setImportSuccess({ count: data.count || validQuestions.length });
    } catch (err: any) {
      setErrorMessage("Import failed: " + (err.message || "Server error while importing"));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFinishSuccess = () => {
    setImportSuccess(null);
    onImportSuccess();
    onClose();
  };

  const validCount = parsedRows.filter(r => r.isValid).length;
  const invalidCount = parsedRows.filter(r => !r.isValid).length;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl w-full max-w-4xl overflow-hidden my-6 animate-in fade-in zoom-in-95 duration-150 flex flex-col max-h-[90vh] relative">
        
        {/* Lateral Data Load Progress Spinner Overlay */}
        {isSubmitting && (
          <div className="absolute inset-0 z-50 bg-white/95 backdrop-blur-xs flex flex-col items-center justify-center p-6 text-center space-y-4 animate-in fade-in duration-150">
            <div className="w-16 h-16 rounded-2xl bg-blue-50 border border-blue-200 text-blue-600 flex items-center justify-center shadow-xs">
              <Loader2 className="w-8 h-8 animate-spin" />
            </div>
            <div className="space-y-1">
              <span className="text-[10px] font-bold tracking-wider text-blue-700 bg-blue-100 uppercase px-2.5 py-0.5 rounded-full border border-blue-200">
                Lateral Data Load in Progress
              </span>
              <h4 className="text-base font-black text-slate-900 font-heading pt-1">
                Saving & Indexing Questions...
              </h4>
              <p className="text-xs text-slate-500 max-w-sm mx-auto leading-relaxed">
                Writing <strong>{validCount.toLocaleString()} questions</strong> into the database in optimized batch chunks. Please wait...
              </p>
            </div>
            <div className="w-64 bg-slate-100 rounded-full h-2 overflow-hidden shadow-inner">
              <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-emerald-500 h-full rounded-full animate-pulse w-3/4"></div>
            </div>
          </div>
        )}
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/70 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-xs">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-base font-heading">
                Bulk Import Questions via Excel
              </h3>
              <p className="text-xs text-slate-500">
                Download a pre-formatted Excel template, populate your questions offline, and upload in bulk.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 flex items-center justify-center"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-6 overflow-y-auto flex-1">
          
          {/* STEP 1: Template Configuration & Download */}
          <div className="bg-emerald-50/40 p-5 rounded-2xl border border-emerald-200/80 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-emerald-950 font-bold text-xs uppercase tracking-wider">
                <span className="w-5 h-5 rounded-full bg-emerald-600 text-white text-[10px] flex items-center justify-center font-black">1</span>
                <span>Select Criteria & Download Customized Template</span>
              </div>
              <span className="text-[11px] text-emerald-700 font-semibold bg-emerald-100/60 px-2 py-0.5 rounded-md">
                .xlsx Format
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Target Course */}
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-600 uppercase">Target Program / Course</label>
                <select
                  value={selectedCourseId}
                  onChange={(e) => setSelectedCourseId(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                >
                  {courses.map(c => (
                    <option key={c.id} value={String(c.id)}>{c.code} - {c.title}</option>
                  ))}
                </select>
              </div>

              {/* Question Type Selection */}
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-600 uppercase">Question Format / Type</label>
                <select
                  value={selectedType}
                  onChange={(e) => setSelectedType(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                >
                  {TEMPLATE_TYPES.map(t => (
                    <option key={t.id} value={t.id}>{t.label}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex items-center justify-between pt-1">
              <p className="text-[11px] text-slate-500">
                {TEMPLATE_TYPES.find(t => t.id === selectedType)?.desc}
              </p>

              <button
                type="button"
                onClick={handleDownloadTemplate}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs transition flex items-center gap-1.5 active:scale-95 shrink-0"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download Excel Template</span>
              </button>
            </div>
          </div>

          {/* STEP 2: Upload Completed File */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-slate-800 font-bold text-xs uppercase tracking-wider">
              <span className="w-5 h-5 rounded-full bg-blue-600 text-white text-[10px] flex items-center justify-center font-black">2</span>
              <span>Upload Completed Excel File (.xlsx, .xls, .csv)</span>
            </div>

            {/* Drop Zone */}
            <div
              onDragOver={(e) => e.preventDefault()}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`p-6 border-2 border-dashed rounded-2xl text-center cursor-pointer transition flex flex-col items-center justify-center gap-2 ${
                file 
                  ? "border-emerald-400 bg-emerald-50/20" 
                  : "border-slate-300 hover:border-blue-400 bg-slate-50/60 hover:bg-blue-50/20"
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx,.xls,.csv"
                onChange={handleFileChange}
                className="hidden"
              />

              <div className="w-12 h-12 rounded-2xl bg-white border border-slate-200 shadow-xs flex items-center justify-center text-slate-600">
                <Upload className="w-5 h-5 text-blue-600" />
              </div>

              {file ? (
                <div>
                  <span className="text-xs font-bold text-slate-800 block">{file.name}</span>
                  <span className="text-[11px] text-slate-400">
                    {(file.size / 1024).toFixed(1)} KB • Click or drop another file to replace
                  </span>
                </div>
              ) : (
                <div>
                  <span className="text-xs font-bold text-slate-700 block">
                    Click to browse or drag and drop your completed spreadsheet
                  </span>
                  <span className="text-[11px] text-slate-400">
                    Supports Microsoft Excel (.xlsx, .xls) and CSV files
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* STEP 3: Parse Results & Validation Table */}
          {isParsing ? (
            <div className="py-8 text-center text-xs text-slate-400 space-y-2">
              <FileSpreadsheet className="w-6 h-6 animate-pulse text-emerald-500 mx-auto" />
              <span>Analyzing spreadsheet rows & validating formatting...</span>
            </div>
          ) : parsedRows.length > 0 ? (
            <div className="space-y-3">
              {/* Validation Summary Pills */}
              <div className="flex items-center justify-between bg-slate-50 p-3 rounded-xl border border-slate-200 text-xs">
                <div className="flex items-center gap-3">
                  <span className="font-bold text-slate-700">Total Rows: {parsedRows.length}</span>
                  <span className="text-emerald-700 font-semibold flex items-center gap-1 bg-emerald-100/70 px-2 py-0.5 rounded-md">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    {validCount} Valid
                  </span>
                  {invalidCount > 0 && (
                    <span className="text-rose-700 font-semibold flex items-center gap-1 bg-rose-100/70 px-2 py-0.5 rounded-md">
                      <AlertTriangle className="w-3.5 h-3.5" />
                      {invalidCount} Invalid
                    </span>
                  )}
                </div>

                <span className="text-[11px] text-slate-400">
                  Only rows marked "Valid" will be inserted
                </span>
              </div>

              {/* Preview Table */}
              <div className="border border-slate-200 rounded-xl overflow-hidden max-h-60 overflow-y-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="bg-slate-100 text-slate-600 font-bold uppercase text-[10px] sticky top-0">
                    <tr>
                      <th className="p-2.5">Row</th>
                      <th className="p-2.5">Course</th>
                      <th className="p-2.5">Format</th>
                      <th className="p-2.5">Question Statement</th>
                      <th className="p-2.5">Correct Answer</th>
                      <th className="p-2.5">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 bg-white">
                    {parsedRows.map((r, i) => (
                      <tr key={i} className={`hover:bg-slate-50/50 ${!r.isValid ? "bg-rose-50/30" : ""}`}>
                        <td className="p-2.5 font-mono text-[10px] text-slate-400 font-bold">
                          #{r.rowNumber}
                        </td>
                        <td className="p-2.5 font-semibold text-slate-700">
                          {r.course_code}
                        </td>
                        <td className="p-2.5">
                          {r.question_type === "non_verbal" ? (
                            <span className="bg-orange-50 text-orange-700 border border-orange-200 px-1.5 py-0.5 rounded text-[10px] font-bold uppercase flex items-center gap-1 w-fit">
                              <Layers className="w-2.5 h-2.5" />
                              <span>Non-Verbal</span>
                            </span>
                          ) : r.question_type === "verbal_reasoning" ? (
                            <span className="bg-teal-50 text-teal-700 border border-teal-200 px-1.5 py-0.5 rounded text-[10px] font-bold uppercase flex items-center gap-1 w-fit">
                              <BrainCircuit className="w-2.5 h-2.5" />
                              <span>Verbal Reasoning</span>
                            </span>
                          ) : (
                            <span className="bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded text-[10px] font-bold uppercase">
                              {r.question_type}
                            </span>
                          )}
                        </td>
                        <td className="p-2.5 max-w-sm">
                          <div className="font-medium text-slate-900 truncate">{r.question_text}</div>
                          {r.question_type === "non_verbal" && (() => {
                            try {
                              const parsed = JSON.parse(r.options_json);
                              const figsCount = parsed.problem_images?.length || 0;
                              const subType = parsed.sub_type || "series";
                              return (
                                <div className="flex items-center gap-1.5 mt-1 text-[10px]">
                                  <span className="bg-slate-100 text-slate-700 font-bold px-1.5 py-0.5 rounded">
                                    {subType.toUpperCase()}
                                  </span>
                                  {subType !== "odd_one_out" && (
                                    <>
                                      <span className="text-slate-500 font-semibold">{figsCount} Figures</span>
                                      <span className="text-slate-300">➔</span>
                                      <span className="bg-amber-100 text-amber-800 font-black px-1.5 py-0.5 rounded border border-amber-300 flex items-center gap-0.5">
                                        <span>[ ? ]</span>
                                        <span className="text-[9px] font-bold">Target Slot</span>
                                      </span>
                                      <span className="text-slate-300">➔</span>
                                    </>
                                  )}
                                  <span className="bg-blue-50 text-blue-700 font-semibold px-1.5 py-0.5 rounded">
                                    {parsed.options?.length || 4} Choices
                                  </span>
                                </div>
                              );
                            } catch {
                              return null;
                            }
                          })()}
                          {r.question_type === "verbal_reasoning" && (() => {
                            try {
                              const parsed = JSON.parse(r.options_json);
                              const subType = parsed.sub_type || "analogy";
                              return (
                                <div className="flex flex-wrap items-center gap-1.5 mt-1 text-[10px]">
                                  <span className="bg-teal-100 text-teal-800 font-bold px-1.5 py-0.5 rounded">
                                    {subType === "odd_one_out" ? "ODD WORD OUT" : subType.toUpperCase()}
                                  </span>
                                  {subType === "analogy" && parsed.pair1_left && (
                                    <span className="text-slate-600 font-mono bg-slate-100 px-1.5 py-0.5 rounded">
                                      {parsed.pair1_left} : {parsed.pair1_right} :: {parsed.pair2_left} : ?
                                    </span>
                                  )}
                                  {subType === "series" && Array.isArray(parsed.series_tokens) && (
                                    <span className="text-slate-600 font-mono bg-slate-100 px-1.5 py-0.5 rounded">
                                      {parsed.series_tokens.slice(0, 4).join(" ➔ ")} ➔ [ ? ]
                                    </span>
                                  )}
                                  {subType === "coding" && parsed.source_word && (
                                    <span className="text-slate-600 font-mono bg-slate-100 px-1.5 py-0.5 rounded">
                                      {parsed.source_word} ➔ {parsed.coded_word} | {parsed.target_word} ➔ ?
                                    </span>
                                  )}
                                  {subType === "odd_one_out" && Array.isArray(parsed.words) && (
                                    <span className="text-slate-600 font-mono bg-slate-100 px-1.5 py-0.5 rounded">
                                      {parsed.words.slice(0, 3).join(", ")}...
                                    </span>
                                  )}
                                  <span className="bg-emerald-50 text-emerald-700 font-semibold px-1.5 py-0.5 rounded">
                                    {parsed.options?.length || 4} Choices
                                  </span>
                                </div>
                              );
                            } catch {
                              return null;
                            }
                          })()}
                        </td>
                        <td className="p-2.5 font-mono text-emerald-700 font-bold max-w-[130px] truncate">
                          {r.question_type === "non_verbal" || r.question_type === "verbal_reasoning" ? (
                            <span className="bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded border border-emerald-200 text-[11px] inline-block">
                              Option {String.fromCharCode(64 + (Number(r.correct_answer) || 1))} (#{r.correct_answer})
                            </span>
                          ) : (
                            r.correct_answer
                          )}
                        </td>
                        <td className="p-2.5">
                          {r.isValid ? (
                            <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded text-[10px] font-bold">
                              ✓ Valid
                            </span>
                          ) : (
                            <span 
                              className="bg-rose-50 text-rose-700 border border-rose-200 px-2 py-0.5 rounded text-[10px] font-bold"
                              title={r.errors.join("; ")}
                            >
                              ✕ {r.errors[0] || "Invalid"}
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : null}

        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 border-t border-slate-100 bg-slate-50 flex items-center justify-between shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-200 transition"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={handleConfirmImport}
            disabled={validCount === 0 || isSubmitting}
            className="px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 transition shadow-sm disabled:opacity-40 flex items-center gap-1.5"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Importing Questions...</span>
              </>
            ) : (
              <>
                <Check className="w-4 h-4" />
                <span>Import {validCount > 0 ? `(${validCount}) Questions` : ""} to Bank</span>
              </>
            )}
          </button>
        </div>

      </div>

      {/* THEMED SUCCESS DIALOGUE BOX (According to Website Theme) */}
      {importSuccess && (
        <div className="fixed inset-0 z-[60] bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-md w-full p-6 text-center space-y-5 animate-in zoom-in-95 duration-200">
            <div className="w-16 h-16 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-600 flex items-center justify-center mx-auto shadow-xs">
              <CheckCircle2 className="w-9 h-9" />
            </div>

            <div className="space-y-1.5">
              <span className="text-[11px] font-bold tracking-wider text-emerald-700 bg-emerald-100 uppercase px-2.5 py-0.5 rounded-full border border-emerald-200">
                Bulk Import Successful
              </span>
              <h3 className="text-xl font-black text-slate-900 font-heading pt-1">
                Questions Live in Bank!
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Successfully imported <strong className="text-slate-900 font-black">{importSuccess.count.toLocaleString()} questions</strong> into the Question Bank. The lateral data has been indexed and synced with your database.
              </p>
            </div>

            <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-3.5 flex items-center justify-around text-xs">
              <div>
                <span className="text-slate-400 block text-[10px] font-bold uppercase tracking-wider">Format</span>
                <span className="font-bold text-slate-800 text-xs block mt-0.5 truncate max-w-[110px]">
                  {TEMPLATE_TYPES.find(t => t.id === selectedType)?.label.split(" ")[0] || "Questions"}
                </span>
              </div>
              <div className="w-px h-8 bg-slate-200"></div>
              <div>
                <span className="text-slate-400 block text-[10px] font-bold uppercase tracking-wider">Total Rows</span>
                <span className="font-black text-emerald-600 text-sm block mt-0.5">
                  {importSuccess.count.toLocaleString()}
                </span>
              </div>
              <div className="w-px h-8 bg-slate-200"></div>
              <div>
                <span className="text-slate-400 block text-[10px] font-bold uppercase tracking-wider">Status</span>
                <span className="font-bold text-blue-600 text-xs block mt-0.5">
                  Active
                </span>
              </div>
            </div>

            <button
              onClick={handleFinishSuccess}
              className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition shadow-xs flex items-center justify-center gap-1.5 active:scale-98 cursor-pointer"
            >
              <span>View Questions in Bank</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* THEMED ERROR / NOTICE DIALOGUE BOX */}
      {errorMessage && (
        <div className="fixed inset-0 z-[60] bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-md w-full p-6 text-center space-y-4 animate-in zoom-in-95 duration-200">
            <div className="w-14 h-14 rounded-2xl bg-rose-50 border border-rose-200 text-rose-600 flex items-center justify-center mx-auto shadow-xs">
              <AlertTriangle className="w-7 h-7" />
            </div>
            <div className="space-y-1">
              <h3 className="text-base font-black text-slate-900 font-heading">
                Spreadsheet Import Notice
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                {errorMessage}
              </p>
            </div>
            <button
              onClick={() => setErrorMessage(null)}
              className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition cursor-pointer"
            >
              Understood / Dismiss
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
