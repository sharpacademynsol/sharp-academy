import { query, execute } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { PlusCircle, Trash2, CheckCircle2, XCircle } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function CoursesPage() {
  const courses = await query(`
    SELECT c.*, cat.name as category_name,
      (SELECT COUNT(*) FROM course_modules WHERE course_id = c.id) as modules_count,
      (SELECT COUNT(*) FROM batches WHERE course_id = c.id) as batches_count,
      (SELECT COUNT(*) FROM registrations r JOIN batches b ON r.batch_id = b.id WHERE b.course_id = c.id) as total_enrolled
    FROM courses c
    JOIN course_categories cat ON c.category_id = cat.id
    ORDER BY c.id ASC
  `);

  const categories = await query("SELECT id, name FROM course_categories");

  // Server Action: Add Course
  async function addCourse(formData: FormData) {
    "use server";
    const title = formData.get("title");
    const code = formData.get("code");
    const slug = String(code).toLowerCase().replace(/[^a-z0-9]/g, '-');
    const categoryId = formData.get("category_id") || 1;
    const fee = formData.get("fee") || 25000;
    const duration = formData.get("duration") || 12;
    const level = formData.get("level") || "Beginner";
    const summary = formData.get("summary") || "Professional program curriculum.";

    if (title && code) {
      await execute(`
        INSERT INTO courses (category_id, title, slug, code, summary, regular_fee_pkr, duration_weeks, level, is_active)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1)
      `, [categoryId, title, slug, code, summary, fee, duration, level]);
    }
    revalidatePath("/admin/courses");
    revalidatePath("/admin/dashboard");
  }

  // Server Action: Toggle Course Active Status
  async function toggleStatus(formData: FormData) {
    "use server";
    const id = formData.get("id");
    const current = formData.get("current_status");
    const nextStatus = current === "1" ? 0 : 1;
    if (id) {
      await execute("UPDATE courses SET is_active = ? WHERE id = ?", [nextStatus, id]);
    }
    revalidatePath("/admin/courses");
  }

  // Server Action: Delete Course
  async function deleteCourse(formData: FormData) {
    "use server";
    const id = formData.get("id");
    if (id) {
      await execute("DELETE FROM courses WHERE id = ?", [id]);
    }
    revalidatePath("/admin/courses");
    revalidatePath("/admin/dashboard");
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-slate-900 font-heading">Course Curriculum & Programs</h1>
          <p className="text-sm text-slate-500 mt-1">Manage academic courses, module chapters, tuition fees, and syllabi.</p>
        </div>
        <a href="http://localhost:8787/courses" target="_blank" rel="noreferrer" className="text-xs font-bold text-blue-600 bg-blue-50 px-3.5 py-2 rounded-xl hover:bg-blue-100 transition">
          View on Portal &rarr;
        </a>
      </div>

      {/* Add Course Form */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm space-y-4">
        <h2 className="text-sm font-bold text-slate-900 font-heading flex items-center gap-2">
          <PlusCircle className="w-4 h-4 text-blue-600" />
          <span>Add New Academic Program</span>
        </h2>
        <form action={addCourse} className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <input type="text" name="title" required placeholder="Course Title *" className="px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs md:col-span-2" />
          <input type="text" name="code" required placeholder="Course Code (e.g. AI-101) *" className="px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-mono" />
          <select name="category_id" className="px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs bg-white">
            {categories.map((cat: any) => (
              <option key={cat.id} value={cat.id}>{cat.name}</option>
            ))}
          </select>
          <input type="number" name="fee" defaultValue="30000" placeholder="Fee PKR" className="px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-mono" />
          <input type="number" name="duration" defaultValue="12" placeholder="Duration Weeks" className="px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs" />
          <select name="level" className="px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs bg-white">
            <option value="Beginner">Beginner</option>
            <option value="Intermediate">Intermediate</option>
            <option value="Advanced">Advanced</option>
          </select>
          <input type="text" name="summary" placeholder="Summary sentence" className="px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs md:col-span-4" />
          <div className="md:col-span-4 flex justify-end">
            <button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs px-5 py-2.5 rounded-xl transition shadow-sm">
              Save & Publish Course
            </button>
          </div>
        </form>
      </div>

      {/* Courses Table */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm overflow-hidden">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase font-bold tracking-wider">
              <th className="p-4">Code</th>
              <th className="p-4">Course Program</th>
              <th className="p-4">Category</th>
              <th className="p-4">Tuition Fee</th>
              <th className="p-4">Modules / Batches</th>
              <th className="p-4">Enrolled</th>
              <th className="p-4">Status</th>
              <th className="p-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {courses.map((c: any) => (
              <tr key={c.id} className="hover:bg-slate-50/50">
                <td className="p-4 font-mono font-bold text-blue-600">{c.code}</td>
                <td className="p-4">
                  <strong className="text-slate-900 block text-sm">{c.title}</strong>
                  <span className="text-slate-400 text-[11px]">{c.duration_weeks} Weeks • {c.level || 'All Levels'}</span>
                </td>
                <td className="p-4 text-slate-600 font-medium">{c.category_name}</td>
                <td className="p-4 font-bold text-slate-900 font-mono">Rs {Number(c.regular_fee_pkr).toLocaleString()}</td>
                <td className="p-4 text-slate-600">
                  <span className="font-semibold">{c.modules_count} Modules</span> / {c.batches_count} Batches
                </td>
                <td className="p-4 font-bold text-blue-600">{c.total_enrolled} Students</td>
                <td className="p-4">
                  <span className={`px-2.5 py-1 rounded-md font-bold text-[10px] uppercase ${
                    c.is_active ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-600'
                  }`}>
                    {c.is_active ? 'Active' : 'Draft'}
                  </span>
                </td>
                <td className="p-4 text-right">
                  <div className="inline-flex items-center gap-1.5">
                    <form action={toggleStatus}>
                      <input type="hidden" name="id" value={c.id} />
                      <input type="hidden" name="current_status" value={c.is_active ? "1" : "0"} />
                      <button type="submit" className="text-[11px] font-bold text-slate-600 hover:text-slate-900 px-2 py-1 rounded border border-slate-200">
                        {c.is_active ? "Pause" : "Activate"}
                      </button>
                    </form>

                    <form action={deleteCourse}>
                      <input type="hidden" name="id" value={c.id} />
                      <button type="submit" className="p-1.5 text-slate-400 hover:text-red-600 transition" title="Delete Course">
                        <Trash2 className="w-4 h-4" />
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
  );
}
