"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  LayoutDashboard, 
  GraduationCap, 
  CalendarDays, 
  Users, 
  ClipboardCheck, 
  FileQuestion, 
  Receipt, 
  UserCheck, 
  Settings, 
  Database,
  Globe,
  ExternalLink 
} from "lucide-react";

const navItems = [
  { name: "Dashboard", href: "/admin/dashboard", icon: LayoutDashboard },
  { name: "Courses & Programs", href: "/admin/courses", icon: GraduationCap },
  { name: "Batches & Schedules", href: "/admin/batches", icon: CalendarDays },
  { name: "Students Directory", href: "/admin/students", icon: Users },
  { name: "Admissions Pipeline", href: "/admin/registrations", icon: ClipboardCheck },
  { name: "Daily Attendance", href: "/admin/attendance", icon: ClipboardCheck },
  { name: "Question Bank", href: "/admin/question-bank", icon: Database },
  { name: "Exams & Quizzes", href: "/admin/exams", icon: FileQuestion },
  { name: "Fee & Finance Ledger", href: "/admin/finance", icon: Receipt },
  { name: "Staff & Faculty", href: "/admin/staff", icon: UserCheck },
  { name: "Website CMS", href: "/admin/cms", icon: Globe },
  { name: "Settings", href: "/admin/settings", icon: Settings },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="flex min-h-screen bg-slate-100 print:block print:bg-white print:min-h-0 print:p-0 print:m-0">
      {/* Sidebar (Hidden on Print) */}
      <aside className="w-64 bg-slate-900 text-white flex flex-col shrink-0 border-r border-slate-800 print:hidden">
        <div className="p-6 border-b border-slate-800 flex items-center gap-3">
          <div className="w-10 h-10 bg-white rounded-xl p-1 flex items-center justify-center shadow-md border border-white/20 shrink-0">
            <img src="/images/logo.png" alt="Sharp Academy Crest" className="w-full h-full object-contain" />
          </div>
          <div>
            <h1 className="font-heading font-black text-base tracking-tight leading-tight">SHARP ACADEMY</h1>
            <span className="text-[11px] text-amber-400 font-bold uppercase tracking-wider">Admin ERP</span>
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold transition ${
                  isActive 
                    ? "bg-blue-600 text-white shadow-sm" 
                    : "text-slate-400 hover:text-white hover:bg-slate-800/80"
                }`}
              >
                <Icon className="w-4 h-4 shrink-0" />
                <span>{item.name}</span>
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-slate-800">
          <a
            href="http://localhost:8787"
            target="_blank"
            rel="noreferrer"
            className="flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 transition"
          >
            <span>Open Student Portal</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
      </aside>

      {/* Main Area */}
      <div className="flex-1 flex flex-col min-w-0 print:block print:w-full print:p-0 print:m-0">
        <header className="h-16 bg-white border-b border-slate-200 px-8 flex items-center justify-between print:hidden">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Academic Term:</span>
            <span className="text-xs font-extrabold text-blue-600 bg-blue-50 px-2.5 py-1 rounded-md">Fall 2026 Session</span>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-slate-800 text-white text-xs font-bold flex items-center justify-center">
                SA
              </div>
              <div className="text-left">
                <span className="block text-xs font-bold text-slate-800">Superadmin</span>
                <span className="block text-[10px] text-slate-400">admin@sharpacademy.pk</span>
              </div>
            </div>
          </div>
        </header>

        <main className="flex-1 p-8 overflow-y-auto print:p-0 print:m-0 print:overflow-visible print:w-full print:block">
          {children}
        </main>
      </div>
    </div>
  );
}
