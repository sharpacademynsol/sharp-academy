import { query, execute } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { UserCheck, Trash2, UserPlus } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function StaffPage() {
  const staff = await query(`
    SELECT id, full_name, email, phone, role, city, created_at
    FROM users
    WHERE role IN ('superadmin', 'admin', 'instructor')
    ORDER BY id ASC
  `);

  // Server Action: Add Staff Member
  async function addStaff(formData: FormData) {
    "use server";
    const fullName = formData.get("full_name");
    const email = formData.get("email");
    const phone = formData.get("phone");
    const role = formData.get("role") || "instructor";
    const city = formData.get("city") || "Lahore";

    if (fullName && email) {
      await execute(
        "INSERT INTO users (full_name, email, phone, role, city, password_hash) VALUES (?, ?, ?, ?, ?, 'staff_hash')",
        [fullName, email, phone, role, city]
      );
    }
    revalidatePath("/admin/staff");
  }

  // Server Action: Delete Staff
  async function deleteStaff(formData: FormData) {
    "use server";
    const id = formData.get("id");
    if (id && String(id) !== "1") {
      await execute("DELETE FROM users WHERE id = ?", [id]);
    }
    revalidatePath("/admin/staff");
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-slate-900 font-heading">Faculty & Staff Management</h1>
          <p className="text-sm text-slate-500 mt-1">Manage teaching professors, administrative roles, and privileges.</p>
        </div>
        <span className="text-xs font-bold text-slate-700 bg-white border border-slate-200 px-3.5 py-2 rounded-xl shadow-sm">
          Total Faculty: {staff.length}
        </span>
      </div>

      {/* Add Staff Form */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm space-y-4">
        <h2 className="text-sm font-bold text-slate-900 font-heading flex items-center gap-2">
          <UserPlus className="w-4 h-4 text-blue-600" />
          <span>Add Faculty Member / Instructor</span>
        </h2>
        <form action={addStaff} className="grid grid-cols-1 md:grid-cols-5 gap-3">
          <input type="text" name="full_name" required placeholder="Professor / Staff Name *" className="px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs" />
          <input type="email" name="email" required placeholder="Email Address *" className="px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs" />
          <input type="tel" name="phone" placeholder="Phone Number" className="px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-mono" />
          <select name="role" className="px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs bg-white font-bold">
            <option value="instructor">Instructor / Faculty</option>
            <option value="admin">Operations Admin</option>
          </select>
          <input type="text" name="city" defaultValue="Lahore" placeholder="City" className="px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs" />
          <div className="md:col-span-5 flex justify-end">
            <button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs px-5 py-2.5 rounded-xl transition shadow-sm">
              Save Staff Member
            </button>
          </div>
        </form>
      </div>

      {/* Staff Table */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm overflow-hidden">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase font-bold tracking-wider">
              <th className="p-4">Name</th>
              <th className="p-4">Email Address</th>
              <th className="p-4">Phone Number</th>
              <th className="p-4">Role</th>
              <th className="p-4">Campus City</th>
              <th className="p-4 text-right">Delete</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {staff.map((s: any) => (
              <tr key={s.id} className="hover:bg-slate-50/50">
                <td className="p-4 font-bold text-slate-900 text-sm">{s.full_name}</td>
                <td className="p-4 text-slate-600 font-mono">{s.email}</td>
                <td className="p-4 text-slate-600 font-mono">{s.phone}</td>
                <td className="p-4">
                  <span className={`px-2.5 py-1 rounded-md font-bold text-[10px] uppercase ${
                    s.role === 'superadmin' ? 'bg-purple-50 text-purple-700' : 'bg-blue-50 text-blue-700'
                  }`}>
                    {s.role}
                  </span>
                </td>
                <td className="p-4 text-slate-600 font-medium">{s.city}</td>
                <td className="p-4 text-right">
                  {s.role !== 'superadmin' && (
                    <form action={deleteStaff} className="inline">
                      <input type="hidden" name="id" value={s.id} />
                      <button type="submit" className="p-1.5 text-slate-400 hover:text-red-600 transition">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </form>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
