import Link from "next/link";
import { GraduationCap, Users, CalendarDays, Receipt, PlusCircle, ArrowUpRight } from "lucide-react";
import { query } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  // Query Live D1 Database
  const studentsCount = await query("SELECT COUNT(*) as c FROM users WHERE role = 'student'");
  const coursesCount = await query("SELECT COUNT(*) as c FROM courses WHERE is_active = 1");
  const batchesCount = await query("SELECT COUNT(*) as c FROM batches WHERE status IN ('enrolling', 'active')");
  const feeSum = await query("SELECT COALESCE(SUM(total_fee_pkr), 0) as s FROM registrations");

  const recentAdmissions = await query(`
    SELECT r.id, r.registration_no, r.status, r.total_fee_pkr, r.created_at,
           u.full_name, c.title as course_title, b.name as batch_name
    FROM registrations r
    JOIN users u ON r.student_id = u.id
    JOIN batches b ON r.batch_id = b.id
    JOIN courses c ON b.course_id = c.id
    ORDER BY r.id DESC
    LIMIT 5
  `);

  const activeBatches = await query(`
    SELECT b.id, b.name, b.batch_code, b.mode, b.start_date, c.title as course_title, u.full_name as instructor_name,
           (SELECT COUNT(*) FROM registrations WHERE batch_id = b.id) as enrolled_count
    FROM batches b
    JOIN courses c ON b.course_id = c.id
    LEFT JOIN users u ON b.instructor_id = u.id
    ORDER BY b.id DESC
    LIMIT 5
  `);

  const stats = [
    { label: "Enrolled Students", value: studentsCount[0]?.c || 0, change: "Active across batches", icon: Users, color: "text-blue-600", bg: "bg-blue-50" },
    { label: "Active Programs", value: coursesCount[0]?.c || 0, change: "Catalog online", icon: GraduationCap, color: "text-emerald-600", bg: "bg-emerald-50" },
    { label: "Running Batches", value: batchesCount[0]?.c || 0, change: "On-campus & Hybrid", icon: CalendarDays, color: "text-purple-600", bg: "bg-purple-50" },
    { label: "Tuition Invoiced", value: `Rs ${Number(feeSum[0]?.s || 0).toLocaleString()}`, change: "Total registration fees", icon: Receipt, color: "text-amber-600", bg: "bg-amber-50" },
  ];

  return (
    <div className="space-y-8">
      {/* Title */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-slate-900 font-heading">Academy Management Dashboard</h1>
          <p className="text-sm text-slate-500 mt-1">Real-time Cloudflare D1 data synchronized with the public student portal.</p>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/admin/courses" className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold px-4 py-2.5 rounded-xl shadow-sm transition">
            <PlusCircle className="w-4 h-4" />
            <span>Manage Courses</span>
          </Link>
          <Link href="/admin/registrations" className="flex items-center gap-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold px-4 py-2.5 rounded-xl transition">
            <Users className="w-4 h-4" />
            <span>Admissions</span>
          </Link>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {stats.map((s) => {
          const Icon = s.icon;
          return (
            <div key={s.label} className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col justify-between">
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs font-bold text-slate-500">{s.label}</span>
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${s.bg} ${s.color}`}>
                  <Icon className="w-5 h-5" />
                </div>
              </div>
              <div>
                <div className="text-2xl font-black text-slate-900 font-heading">{s.value}</div>
                <span className="text-xs font-semibold text-emerald-600 mt-1 block">{s.change}</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Live Activity Tables */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Recent Admissions */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-bold text-slate-900 font-heading">Recent Admissions Pipeline</h2>
            <Link href="/admin/registrations" className="text-xs font-bold text-blue-600 hover:underline flex items-center gap-1">
              <span>View all ({recentAdmissions.length})</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </div>
          {recentAdmissions.length === 0 ? (
            <p className="text-xs text-slate-400 py-6 text-center">No admissions yet.</p>
          ) : (
            <div className="divide-y divide-slate-100 text-xs">
              {recentAdmissions.map((r: any) => (
                <div key={r.id} className="py-3 flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <strong className="text-slate-800">{r.full_name}</strong>
                      <span className="text-[10px] font-mono text-slate-400">({r.registration_no})</span>
                    </div>
                    <span className="text-slate-500 text-[11px]">{r.course_title} • Rs {Number(r.total_fee_pkr).toLocaleString()}</span>
                  </div>
                  <span className={`px-2.5 py-1 rounded-md font-bold text-[10px] uppercase ${
                    r.status === 'approved' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'
                  }`}>
                    {r.status}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Active Batches */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-bold text-slate-900 font-heading">Active Classes & Batches</h2>
            <Link href="/admin/batches" className="text-xs font-bold text-blue-600 hover:underline flex items-center gap-1">
              <span>Manage batches</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </div>
          <div className="divide-y divide-slate-100 text-xs">
            {activeBatches.map((b: any) => (
              <div key={b.id} className="py-3 flex items-center justify-between">
                <div>
                  <strong className="text-slate-800 block">{b.course_title}</strong>
                  <span className="text-slate-400">{b.name} ({b.batch_code}) • {b.instructor_name || 'Faculty'}</span>
                </div>
                <div className="text-right">
                  <span className="px-2.5 py-1 rounded-md font-bold text-[10px] bg-blue-50 text-blue-700 uppercase">
                    {b.mode}
                  </span>
                  <span className="block text-[10px] text-slate-400 mt-1">{b.enrolled_count} Enrolled</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
