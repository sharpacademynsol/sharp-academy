import { query, execute } from "@/lib/db";
import { revalidatePath } from "next/cache";

export const dynamic = "force-dynamic";

export default async function AttendancePage() {
  const batches = await query("SELECT id, name, batch_code FROM batches ORDER BY id ASC");
  const selectedBatchId = batches[0]?.id || 1;
  const today = new Date().toISOString().split('T')[0];

  // Fetch enrolled students
  const students = await query(`
    SELECT u.id, u.full_name, u.phone, u.email,
      (SELECT status FROM attendance WHERE student_id = u.id AND batch_id = ? AND class_date = ?) as current_status
    FROM registrations r
    JOIN users u ON r.student_id = u.id
    WHERE r.batch_id = ?
    ORDER BY u.full_name ASC
  `, [selectedBatchId, today, selectedBatchId]);

  // Server Action to Mark Attendance
  async function markAttendance(formData: FormData) {
    "use server";
    const studentId = formData.get("student_id");
    const status = formData.get("status");
    const batchId = formData.get("batch_id") || 1;
    const date = formData.get("date") || today;

    await execute(`
      INSERT INTO attendance (batch_id, student_id, class_date, status, marked_by)
      VALUES (?, ?, ?, ?, 1)
      ON CONFLICT(batch_id, student_id, class_date) DO UPDATE SET status = ?
    `, [batchId, studentId, date, status, status]);

    revalidatePath("/admin/attendance");
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-slate-900 font-heading">Digital Attendance Register</h1>
          <p className="text-sm text-slate-500 mt-1">Daily roll-call attendance for classes and labs.</p>
        </div>
        <div className="bg-white border border-slate-200 px-4 py-2 rounded-xl text-xs font-mono font-bold text-slate-800">
          Date: {today}
        </div>
      </div>

      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm space-y-4">
        <div className="flex items-center gap-4">
          <label className="text-xs font-bold text-slate-700 uppercase">Selected Batch:</label>
          <span className="text-xs font-bold bg-blue-50 text-blue-700 px-3 py-1.5 rounded-lg border border-blue-200">
            {batches[0]?.name || "Evening Batch Alpha"} ({batches[0]?.batch_code || "FSW-2026-A"})
          </span>
        </div>

        <div className="border border-slate-100 rounded-xl overflow-hidden mt-4">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase font-bold tracking-wider">
                <th className="p-4">Student Name</th>
                <th className="p-4">Contact</th>
                <th className="p-4">Current Status</th>
                <th className="p-4 text-right">Quick Mark Attendance</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {students.map((s: any) => (
                <tr key={s.id} className="hover:bg-slate-50/50">
                  <td className="p-4">
                    <strong className="text-slate-900 block text-sm">{s.full_name}</strong>
                    <span className="text-[10px] text-slate-400 font-mono">ID: #STU-{s.id}</span>
                  </td>
                  <td className="p-4 font-mono text-slate-600">{s.phone}</td>
                  <td className="p-4">
                    <span className={`px-2.5 py-1 rounded-md font-bold text-[10px] uppercase ${
                      s.current_status === 'present' ? 'bg-emerald-100 text-emerald-800' :
                      s.current_status === 'absent' ? 'bg-red-100 text-red-800' :
                      s.current_status === 'late' ? 'bg-amber-100 text-amber-800' :
                      'bg-slate-100 text-slate-600'
                    }`}>
                      {s.current_status || "Not Marked"}
                    </span>
                  </td>
                  <td className="p-4 text-right">
                    <div className="inline-flex items-center gap-1.5">
                      <form action={markAttendance} className="inline">
                        <input type="hidden" name="student_id" value={s.id} />
                        <input type="hidden" name="batch_id" value={selectedBatchId} />
                        <input type="hidden" name="status" value="present" />
                        <button type="submit" className="bg-emerald-50 hover:bg-emerald-600 hover:text-white text-emerald-700 font-bold px-2.5 py-1.5 rounded-lg border border-emerald-200 text-[11px] transition">
                          Present
                        </button>
                      </form>

                      <form action={markAttendance} className="inline">
                        <input type="hidden" name="student_id" value={s.id} />
                        <input type="hidden" name="batch_id" value={selectedBatchId} />
                        <input type="hidden" name="status" value="absent" />
                        <button type="submit" className="bg-red-50 hover:bg-red-600 hover:text-white text-red-700 font-bold px-2.5 py-1.5 rounded-lg border border-red-200 text-[11px] transition">
                          Absent
                        </button>
                      </form>

                      <form action={markAttendance} className="inline">
                        <input type="hidden" name="student_id" value={s.id} />
                        <input type="hidden" name="batch_id" value={selectedBatchId} />
                        <input type="hidden" name="status" value="late" />
                        <button type="submit" className="bg-amber-50 hover:bg-amber-600 hover:text-white text-amber-700 font-bold px-2.5 py-1.5 rounded-lg border border-amber-200 text-[11px] transition">
                          Late
                        </button>
                      </form>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
