import { query } from "@/lib/db";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function ExamsPage() {
  const exams = await query(`
    SELECT e.*, c.title as course_title, c.code as course_code,
      (SELECT COUNT(*) FROM exam_questions WHERE exam_id = e.id) as questions_count,
      (SELECT COUNT(*) FROM exam_submissions WHERE exam_id = e.id) as submissions_count
    FROM exams e
    JOIN courses c ON e.course_id = c.id
    ORDER BY e.id ASC
  `);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-slate-900 font-heading">Online Examination & Question Bank Engine</h1>
          <p className="text-sm text-slate-500 mt-1">Configure timed MCQs, passing thresholds, and view auto-graded scorecards.</p>
        </div>
        <Link href="/admin/exams/new" className="text-xs font-bold text-white bg-blue-600 px-4 py-2.5 rounded-xl hover:bg-blue-700 transition shadow-sm mr-3">
          + Create New Exam
        </Link>
        <a href="http://localhost:8787/exam/1" target="_blank" rel="noreferrer" className="text-xs font-bold text-emerald-600 bg-emerald-50 px-3.5 py-2 rounded-xl hover:bg-emerald-100 transition">
          Test Live Quiz &rarr;
        </a>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase font-bold tracking-wider">
              <th className="p-4">Exam Title</th>
              <th className="p-4">Course Program</th>
              <th className="p-4">Type</th>
              <th className="p-4">Duration</th>
              <th className="p-4">Total Marks</th>
              <th className="p-4">Questions</th>
              <th className="p-4">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {exams.map((e: any) => (
              <tr key={e.id} className="hover:bg-slate-50/50">
                <td className="p-4">
                  <strong className="text-slate-900 block text-sm">{e.title}</strong>
                  <span className="text-slate-400 text-[10px]">Pass threshold: {e.passing_marks} marks</span>
                </td>
                <td className="p-4">
                  <span className="text-slate-800 font-semibold block">{e.course_title}</span>
                  <span className="text-slate-400 font-mono text-[10px]">{e.course_code}</span>
                </td>
                <td className="p-4">
                  <span className="bg-purple-50 text-purple-700 px-2 py-0.5 rounded font-bold uppercase text-[10px]">{e.exam_type}</span>
                </td>
                <td className="p-4 font-mono font-semibold text-slate-700">{e.duration_minutes} Mins</td>
                <td className="p-4 font-bold text-slate-900">{e.total_marks} Marks</td>
                <td className="p-4 font-bold text-blue-600">{e.questions_count} MCQs</td>
                <td className="p-4">
                  <div className="flex items-center gap-2">
                    <span className="bg-emerald-50 text-emerald-700 px-2.5 py-1 rounded-md font-bold text-[10px] uppercase">
                      Published
                    </span>
                    <Link
                      href={`/admin/exams/${e.id}/omr`}
                      className="bg-purple-50 text-purple-700 hover:bg-purple-100 px-2.5 py-1 rounded-md font-bold text-[10px] border border-purple-200 transition flex items-center gap-1"
                      title="Generate Paper Question Booklets & OMR Sheets"
                    >
                      <span>📄 OMR Center</span>
                    </Link>
                    <a href={`http://localhost:8787/exam/${e.id}`} target="_blank" rel="noreferrer" className="text-blue-600 hover:text-blue-800 font-bold text-[11px] underline">
                      CBT &rarr;
                    </a>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
