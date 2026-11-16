import { query, execute } from "@/lib/db";
import { revalidatePath } from "next/cache";

export const dynamic = "force-dynamic";

export default async function RegistrationsPage() {
  const registrations = await query(`
    SELECT r.*, u.full_name, u.email, u.phone, u.city,
           c.title as course_title, c.code as course_code, b.name as batch_name, b.batch_code,
           (SELECT slip_attachment_url FROM payment_transactions pt JOIN fee_invoices fi ON pt.invoice_id = fi.id WHERE fi.registration_id = r.id LIMIT 1) as slip_url
    FROM registrations r
    JOIN users u ON r.student_id = u.id
    JOIN batches b ON r.batch_id = b.id
    JOIN courses c ON b.course_id = c.id
    ORDER BY r.id DESC
  `);

  // Server Action to Approve Admission
  async function updateStatus(formData: FormData) {
    "use server";
    const regId = formData.get("reg_id");
    const newStatus = formData.get("status") || "approved";

    await execute("UPDATE registrations SET status = ? WHERE id = ?", [newStatus, regId]);
    revalidatePath("/admin/registrations");
    revalidatePath("/admin/dashboard");
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-slate-900 font-heading">Admissions Pipeline & Verification</h1>
          <p className="text-sm text-slate-500 mt-1">Review student applications, view Cloudflare R2 payment slips, and verify admission.</p>
        </div>
        <span className="text-xs font-bold text-slate-700 bg-white border border-slate-200 px-3 py-1.5 rounded-xl shadow-sm">
          Total Applications: {registrations.length}
        </span>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase font-bold tracking-wider">
              <th className="p-4">Application No</th>
              <th className="p-4">Student Profile</th>
              <th className="p-4">Contact Info</th>
              <th className="p-4">Selected Program</th>
              <th className="p-4">Fee / Slip</th>
              <th className="p-4">Status</th>
              <th className="p-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {registrations.map((r: any) => (
              <tr key={r.id} className="hover:bg-slate-50/50">
                <td className="p-4 font-mono font-bold text-blue-600">{r.registration_no}</td>
                <td className="p-4">
                  <strong className="text-slate-900 block text-sm">{r.full_name}</strong>
                  <span className="text-slate-400 text-[11px]">{r.city || 'Lahore, PK'}</span>
                </td>
                <td className="p-4">
                  <span className="text-slate-800 block font-mono">{r.phone}</span>
                  <span className="text-slate-400 text-[11px]">{r.email}</span>
                </td>
                <td className="p-4">
                  <strong className="text-slate-800 block">{r.course_title}</strong>
                  <span className="text-slate-400 text-[11px]">{r.batch_name} ({r.batch_code})</span>
                </td>
                <td className="p-4">
                  <div className="font-bold text-slate-900 font-mono">Rs {Number(r.net_payable_pkr).toLocaleString()}</div>
                  {r.slip_url ? (
                    <a href={`http://localhost:8787${r.slip_url}`} target="_blank" rel="noreferrer" className="text-[10px] text-blue-600 font-bold hover:underline flex items-center gap-1 mt-0.5">
                      <span>View R2 Slip ↗</span>
                    </a>
                  ) : (
                    <span className="text-[10px] text-slate-400 block mt-0.5">Slip not uploaded</span>
                  )}
                </td>
                <td className="p-4">
                  <span className={`px-2.5 py-1 rounded-md font-bold text-[10px] uppercase ${
                    r.status === 'approved' ? 'bg-emerald-50 text-emerald-700' :
                    r.status === 'rejected' ? 'bg-red-50 text-red-700' :
                    'bg-amber-50 text-amber-700'
                  }`}>
                    {r.status}
                  </span>
                </td>
                <td className="p-4 text-right">
                  <div className="inline-flex items-center gap-1.5">
                    {r.status !== 'approved' && (
                      <form action={updateStatus} className="inline">
                        <input type="hidden" name="reg_id" value={r.id} />
                        <input type="hidden" name="status" value="approved" />
                        <button type="submit" className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-3 py-1.5 rounded-lg text-[11px] shadow-sm transition">
                          Approve
                        </button>
                      </form>
                    )}
                    {r.status !== 'rejected' && (
                      <form action={updateStatus} className="inline">
                        <input type="hidden" name="reg_id" value={r.id} />
                        <input type="hidden" name="status" value="rejected" />
                        <button type="submit" className="bg-slate-100 hover:bg-red-100 text-slate-600 hover:text-red-700 font-bold px-2.5 py-1.5 rounded-lg text-[11px] transition">
                          Reject
                        </button>
                      </form>
                    )}
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
