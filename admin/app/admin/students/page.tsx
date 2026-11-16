import { query, execute } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { UserCheck, Trash2, Camera, UserPlus } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function StudentsPage() {
  const students = await query(`
    SELECT u.*,
      (SELECT COUNT(*) FROM registrations WHERE student_id = u.id) as registrations_count,
      (SELECT COUNT(*) FROM student_lesson_progress WHERE student_id = u.id AND is_completed = 1) as lessons_completed
    FROM users u
    WHERE u.role = 'student'
    ORDER BY u.id ASC
  `);

  // Server Action: Add Student with Avatar
  async function addStudent(formData: FormData) {
    "use server";
    const fullName = formData.get("full_name");
    const email = formData.get("email");
    const phone = formData.get("phone");
    const city = formData.get("city") || "Lahore";
    const avatarUrl = formData.get("avatar_url") || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(String(fullName))}`;

    if (fullName && email && phone) {
      await execute(
        "INSERT INTO users (full_name, email, phone, role, city, avatar_url, password_hash) VALUES (?, ?, ?, 'student', ?, ?, 'student_hash')",
        [fullName, email, phone, city, avatarUrl]
      );
    }
    revalidatePath("/admin/students");
    revalidatePath("/admin/dashboard");
  }

  // Server Action: Update Avatar Image
  async function updateAvatar(formData: FormData) {
    "use server";
    const studentId = formData.get("student_id");
    const avatarUrl = formData.get("avatar_url");
    if (studentId && avatarUrl) {
      await execute("UPDATE users SET avatar_url = ? WHERE id = ?", [avatarUrl, studentId]);
    }
    revalidatePath("/admin/students");
  }

  // Server Action: Delete Student
  async function deleteStudent(formData: FormData) {
    "use server";
    const studentId = formData.get("student_id");
    if (studentId) {
      await execute("DELETE FROM users WHERE id = ? AND role = 'student'", [studentId]);
    }
    revalidatePath("/admin/students");
    revalidatePath("/admin/dashboard");
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-slate-900 font-heading">Enrolled Students & Image Profiles</h1>
          <p className="text-sm text-slate-500 mt-1">Manage student profiles, profile photo avatars, and academic records.</p>
        </div>
        <span className="text-xs font-bold text-slate-700 bg-white border border-slate-200 px-3.5 py-2 rounded-xl shadow-sm">
          Total Students: {students.length}
        </span>
      </div>

      {/* Add New Student Form Drawer/Card */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm space-y-4">
        <h2 className="text-sm font-bold text-slate-900 font-heading flex items-center gap-2">
          <UserPlus className="w-4 h-4 text-blue-600" />
          <span>Register New Student with Avatar</span>
        </h2>
        <form action={addStudent} className="grid grid-cols-1 md:grid-cols-5 gap-3">
          <input type="text" name="full_name" required placeholder="Full Name *" className="px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs" />
          <input type="email" name="email" required placeholder="Email Address *" className="px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs" />
          <input type="tel" name="phone" required placeholder="Phone / WhatsApp *" className="px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-mono" />
          <input type="text" name="city" defaultValue="Lahore" placeholder="City" className="px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs" />
          <input type="url" name="avatar_url" placeholder="Photo URL (Optional)" className="px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs" />
          <div className="md:col-span-5 flex justify-end">
            <button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs px-5 py-2.5 rounded-xl transition shadow-sm">
              Save Student Record
            </button>
          </div>
        </form>
      </div>

      {/* Students Table with Avatars */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm overflow-hidden">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase font-bold tracking-wider">
              <th className="p-4">Student Photo</th>
              <th className="p-4">Roll / Name</th>
              <th className="p-4">Contact Info</th>
              <th className="p-4">City</th>
              <th className="p-4">Enrollments</th>
              <th className="p-4">LMS Progress</th>
              <th className="p-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {students.map((s: any) => {
              const defaultAvatar = `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(s.full_name)}`;
              const avatarSrc = s.avatar_url || defaultAvatar;

              return (
                <tr key={s.id} className="hover:bg-slate-50/50">
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <img
                        src={avatarSrc}
                        alt={s.full_name}
                        className="w-10 h-10 rounded-full object-cover border-2 border-slate-200 shadow-sm shrink-0"
                      />
                      <form action={updateAvatar} className="inline-flex items-center gap-1">
                        <input type="hidden" name="student_id" value={s.id} />
                        <input
                          type="url"
                          name="avatar_url"
                          placeholder="Change URL"
                          defaultValue={s.avatar_url || ""}
                          className="px-2 py-1 rounded-md border border-slate-200 text-[10px] w-24 font-mono"
                        />
                        <button type="submit" className="p-1 rounded bg-slate-100 hover:bg-blue-50 text-slate-600 hover:text-blue-600 transition" title="Save Photo">
                          <Camera className="w-3 h-3" />
                        </button>
                      </form>
                    </div>
                  </td>
                  <td className="p-4">
                    <strong className="text-slate-900 block text-sm">{s.full_name}</strong>
                    <span className="text-[10px] text-slate-400 font-mono">#STU-{String(s.id).padStart(4, '0')}</span>
                  </td>
                  <td className="p-4">
                    <span className="text-slate-800 block font-mono">{s.phone}</span>
                    <span className="text-slate-400 text-[11px]">{s.email}</span>
                  </td>
                  <td className="p-4 text-slate-600 font-medium">{s.city || 'Lahore'}</td>
                  <td className="p-4 font-bold text-blue-600">{s.registrations_count} Course(s)</td>
                  <td className="p-4 font-bold text-emerald-600">{s.lessons_completed} Lessons</td>
                  <td className="p-4 text-right">
                    <form action={deleteStudent} className="inline">
                      <input type="hidden" name="student_id" value={s.id} />
                      <button type="submit" className="p-1.5 text-slate-400 hover:text-red-600 transition" title="Delete Student">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </form>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
