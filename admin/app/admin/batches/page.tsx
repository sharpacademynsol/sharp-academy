import { query, execute } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { CalendarPlus, Clock, Trash2 } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function BatchesPage() {
  const batches = await query(`
    SELECT b.*, c.title as course_title, c.code as course_code, u.full_name as instructor_name,
      (SELECT COUNT(*) FROM registrations WHERE batch_id = b.id) as enrolled_count
    FROM batches b
    JOIN courses c ON b.course_id = c.id
    LEFT JOIN users u ON b.instructor_id = u.id
    ORDER BY b.id ASC
  `);

  const courses = await query("SELECT id, title, code FROM courses WHERE is_active = 1");
  const instructors = await query("SELECT id, full_name FROM users WHERE role IN ('instructor', 'superadmin')");

  const schedules = await query(`
    SELECT s.*, b.name as batch_name, b.batch_code, c.title as course_title
    FROM batch_schedules s
    JOIN batches b ON s.batch_id = b.id
    JOIN courses c ON b.course_id = c.id
    ORDER BY s.id ASC
  `);

  // Server Action: Add Batch
  async function addBatch(formData: FormData) {
    "use server";
    const courseId = formData.get("course_id");
    const instructorId = formData.get("instructor_id") || 2;
    const name = formData.get("name");
    const batchCode = formData.get("batch_code");
    const mode = formData.get("mode") || "hybrid";
    const startDate = formData.get("start_date") || "2026-11-01";
    const maxCapacity = formData.get("max_capacity") || 35;

    if (courseId && name && batchCode) {
      await execute(`
        INSERT INTO batches (course_id, instructor_id, name, batch_code, mode, start_date, max_capacity, status)
        VALUES (?, ?, ?, ?, ?, ?, ?, 'enrolling')
      `, [courseId, instructorId, name, batchCode, mode, startDate, maxCapacity]);
    }
    revalidatePath("/admin/batches");
    revalidatePath("/admin/dashboard");
  }

  // Server Action: Add Schedule Slot
  async function addSchedule(formData: FormData) {
    "use server";
    const batchId = formData.get("batch_id");
    const day = formData.get("day_of_week") || "Monday";
    const startTime = formData.get("start_time") || "18:00";
    const endTime = formData.get("end_time") || "20:00";
    const room = formData.get("room_number") || "Lab 1";
    const meetUrl = formData.get("live_meeting_url") || "";

    if (batchId) {
      await execute(`
        INSERT INTO batch_schedules (batch_id, day_of_week, start_time, end_time, room_number, live_meeting_url)
        VALUES (?, ?, ?, ?, ?, ?)
      `, [batchId, day, startTime, endTime, room, meetUrl]);
    }
    revalidatePath("/admin/batches");
  }

  // Server Action: Delete Schedule
  async function deleteSchedule(formData: FormData) {
    "use server";
    const id = formData.get("id");
    if (id) {
      await execute("DELETE FROM batch_schedules WHERE id = ?", [id]);
    }
    revalidatePath("/admin/batches");
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-black text-slate-900 font-heading">Batches & Class Timetables</h1>
        <p className="text-sm text-slate-500 mt-1">Manage physical classrooms, Google Meet slots, and batch capacities.</p>
      </div>

      {/* Add Batch Form */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm space-y-4">
        <h2 className="text-sm font-bold text-slate-900 font-heading flex items-center gap-2">
          <CalendarPlus className="w-4 h-4 text-blue-600" />
          <span>Launch New Class Batch</span>
        </h2>
        <form action={addBatch} className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <select name="course_id" required className="px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs bg-white md:col-span-2">
            {courses.map((c: any) => (
              <option key={c.id} value={c.id}>{c.title} ({c.code})</option>
            ))}
          </select>
          <input type="text" name="name" required placeholder="Batch Name (e.g. Fall Evening Batch)" className="px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs" />
          <input type="text" name="batch_code" required placeholder="Batch Code (e.g. FSW-2026-B)" className="px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-mono" />
          <select name="instructor_id" className="px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs bg-white">
            {instructors.map((i: any) => (
              <option key={i.id} value={i.id}>{i.full_name}</option>
            ))}
          </select>
          <select name="mode" className="px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs bg-white">
            <option value="hybrid">Hybrid (On-Campus + Online)</option>
            <option value="on_campus">On-Campus Physical</option>
            <option value="online">Online Distance</option>
          </select>
          <input type="date" name="start_date" defaultValue="2026-11-01" className="px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs" />
          <input type="number" name="max_capacity" defaultValue="35" placeholder="Max Capacity" className="px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-mono" />
          <div className="md:col-span-4 flex justify-end">
            <button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs px-5 py-2.5 rounded-xl transition shadow-sm">
              Create Batch
            </button>
          </div>
        </form>
      </div>

      {/* Batches Table */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-slate-100 font-bold text-sm text-slate-800">Active Academic Batches</div>
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase font-bold tracking-wider">
              <th className="p-4">Batch Code</th>
              <th className="p-4">Batch Name & Course</th>
              <th className="p-4">Instructor</th>
              <th className="p-4">Mode</th>
              <th className="p-4">Capacity</th>
              <th className="p-4">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {batches.map((b: any) => (
              <tr key={b.id} className="hover:bg-slate-50/50">
                <td className="p-4 font-mono font-bold text-blue-600">{b.batch_code}</td>
                <td className="p-4">
                  <strong className="text-slate-900 block text-sm">{b.name}</strong>
                  <span className="text-slate-400 text-[11px]">{b.course_title} ({b.course_code})</span>
                </td>
                <td className="p-4 font-medium text-slate-700">{b.instructor_name || 'Faculty Lead'}</td>
                <td className="p-4">
                  <span className="bg-blue-50 text-blue-700 px-2 py-0.5 rounded text-[10px] font-bold uppercase">{b.mode}</span>
                </td>
                <td className="p-4 text-slate-700 font-semibold">{b.enrolled_count} / {b.max_capacity} Seats</td>
                <td className="p-4">
                  <span className="bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded text-[10px] font-bold uppercase">{b.status}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Schedules CRUD */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm space-y-4">
        <h2 className="text-sm font-bold text-slate-900 font-heading flex items-center gap-2">
          <Clock className="w-4 h-4 text-blue-600" />
          <span>Add Weekly Timetable Slot</span>
        </h2>
        <form action={addSchedule} className="grid grid-cols-1 md:grid-cols-6 gap-3">
          <select name="batch_id" required className="px-3 py-2 rounded-xl border border-slate-200 text-xs bg-white md:col-span-2">
            {batches.map((b: any) => (
              <option key={b.id} value={b.id}>{b.name} ({b.batch_code})</option>
            ))}
          </select>
          <select name="day_of_week" className="px-3 py-2 rounded-xl border border-slate-200 text-xs bg-white">
            <option value="Monday">Monday</option>
            <option value="Tuesday">Tuesday</option>
            <option value="Wednesday">Wednesday</option>
            <option value="Thursday">Thursday</option>
            <option value="Friday">Friday</option>
            <option value="Saturday">Saturday</option>
            <option value="Sunday">Sunday</option>
          </select>
          <input type="text" name="start_time" defaultValue="18:00" placeholder="Start (18:00)" className="px-3 py-2 rounded-xl border border-slate-200 text-xs font-mono" />
          <input type="text" name="end_time" defaultValue="20:00" placeholder="End (20:00)" className="px-3 py-2 rounded-xl border border-slate-200 text-xs font-mono" />
          <input type="text" name="room_number" defaultValue="Lab 1" placeholder="Room / Meet URL" className="px-3 py-2 rounded-xl border border-slate-200 text-xs" />
          <div className="md:col-span-6 flex justify-end">
            <button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs px-5 py-2.5 rounded-xl transition shadow-sm">
              Save Timetable Slot
            </button>
          </div>
        </form>

        <div className="border border-slate-100 rounded-xl overflow-hidden mt-4">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase font-bold tracking-wider">
                <th className="p-3">Day</th>
                <th className="p-3">Time</th>
                <th className="p-3">Batch & Course</th>
                <th className="p-3">Location / Link</th>
                <th className="p-3 text-right">Delete</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {schedules.map((s: any) => (
                <tr key={s.id} className="hover:bg-slate-50/50">
                  <td className="p-3 font-bold text-slate-800">{s.day_of_week}</td>
                  <td className="p-3 font-mono text-blue-600 font-semibold">{s.start_time} - {s.end_time}</td>
                  <td className="p-3">
                    <strong className="text-slate-800 block">{s.course_title}</strong>
                    <span className="text-slate-400 text-[11px]">{s.batch_name} ({s.batch_code})</span>
                  </td>
                  <td className="p-3 text-slate-700">{s.room_number || "Google Meet"}</td>
                  <td className="p-3 text-right">
                    <form action={deleteSchedule} className="inline">
                      <input type="hidden" name="id" value={s.id} />
                      <button type="submit" className="text-slate-400 hover:text-red-600 transition p-1">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </form>
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
