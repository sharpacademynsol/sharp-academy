import { query } from "@/lib/db";
import Link from "next/link";
import ExamEditor from "./ExamEditor";

export const dynamic = "force-dynamic";

export default async function NewExamPage() {
  const rawCourses = await query("SELECT id, title, code FROM courses WHERE is_active = 1 ORDER BY title ASC");
  const courses = Array.isArray(rawCourses) ? JSON.parse(JSON.stringify(rawCourses)) : [];

  return (
    <div className="w-full max-w-[1600px] mx-auto px-2 sm:px-4 space-y-6">
      <div>
        <Link href="/admin/exams" className="text-xs font-bold text-blue-600 hover:underline">&larr; Back to Exams</Link>
        <h1 className="text-2xl font-black text-slate-900 font-heading mt-2">Enhanced Examination & Equation Builder</h1>
        <p className="text-sm text-slate-500 mt-0.5">
          Rich text editor with formatting bars, mathematical formulas, LaTeX / KaTeX notation, and live equation previews.
        </p>
      </div>

      <ExamEditor courses={courses} />
    </div>
  );
}
