import { query } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function FinancePage() {
  const registrations = await query(`
    SELECT r.id, r.registration_no, r.status, r.total_fee_pkr, r.net_payable_pkr, r.created_at,
           u.full_name, c.title as course_title
    FROM registrations r
    JOIN users u ON r.student_id = u.id
    JOIN batches b ON r.batch_id = b.id
    JOIN courses c ON b.course_id = c.id
    ORDER BY r.id DESC
  `);

  const totalBilled = registrations.reduce((acc: number, r: any) => acc + (Number(r.net_payable_pkr) || 0), 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-slate-900 font-heading">Tuition Fees & Financial Ledger</h1>
          <p className="text-sm text-slate-500 mt-1">Track fee invoices, payments collected, and outstanding balances.</p>
        </div>
        <div className="bg-white border border-slate-200 px-4 py-2.5 rounded-xl shadow-sm text-right">
          <span className="text-[10px] text-slate-400 font-bold uppercase block">Total Net Invoiced</span>
          <strong className="text-lg font-black text-slate-900 font-heading">Rs {totalBilled.toLocaleString()}</strong>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase font-bold tracking-wider">
              <th className="p-4">Voucher No</th>
              <th className="p-4">Student Name</th>
              <th className="p-4">Program</th>
              <th className="p-4">Amount</th>
              <th className="p-4">Payment Method</th>
              <th className="p-4">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {registrations.map((r: any) => (
              <tr key={r.id} className="hover:bg-slate-50/50">
                <td className="p-4 font-mono font-bold text-blue-600">{r.registration_no}</td>
                <td className="p-4 font-bold text-slate-900 text-sm">{r.full_name}</td>
                <td className="p-4 text-slate-600">{r.course_title}</td>
                <td className="p-4 font-bold text-slate-900 font-mono">Rs {Number(r.net_payable_pkr).toLocaleString()}</td>
                <td className="p-4 text-slate-500 font-medium">Bank Transfer / JazzCash</td>
                <td className="p-4">
                  <span className={`px-2.5 py-1 rounded-md font-bold text-[10px] uppercase ${
                    r.status === 'approved' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'
                  }`}>
                    {r.status === 'approved' ? 'Paid & Verified' : 'Awaiting Payment'}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
