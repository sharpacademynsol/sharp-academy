import type { Child } from 'hono/jsx';
import { raw } from 'hono/html';

interface LayoutProps {
  title?: string;
  description?: string;
  hideHeaderFooter?: boolean;
  children: Child;
}

export function Layout({ 
  title = 'Sharp Academy — Admission & Entrance Test Preparation and Digital Skills', 
  description = 'Premier academy for admission and entrance test preparation, comprehensive academic coaching, and high-impact practical digital skills in modern PC laboratories.', 
  hideHeaderFooter = false,
  children 
}: LayoutProps) {
  return (
    <html lang="en">
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>{title}</title>
        <meta name="description" content={description} />
        
        {/* Official Academy Favicon & Web App Icons */}
        <link rel="icon" type="image/png" sizes="32x32" href="/images/logo.png?v=3" />
        <link rel="icon" type="image/png" sizes="16x16" href="/images/logo.png?v=3" />
        <link rel="shortcut icon" href="/favicon.png?v=3" />
        <link rel="apple-touch-icon" sizes="180x180" href="/images/logo.png?v=3" />
        <meta name="theme-color" content="#0f172a" />

        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Amiri:ital,wght@0,400;0,700;1,400;1,700&family=Inter:wght@400;500;600;700;800&family=Noto+Naskh+Arabic:wght@400;500;600;700&family=Noto+Nastaliq+Urdu:wght@400;600;700&family=Outfit:wght@600;700;800;900&display=swap" rel="stylesheet" />
        <link rel="stylesheet" href="/css/tailwind.css" />
        <link rel="stylesheet" href="/css/katex.min.css" />
        <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/KaTeX/0.16.9/katex.min.css" />
        <script defer src="/js/katex.min.js"></script>
        <script defer src="/js/auto-render.min.js"></script>
        <style>{raw(`
          /* Noto Naskh Arabic Local & Webfont */
          @font-face {
            font-family: 'Noto Naskh Arabic';
            src: local('Noto Naskh Arabic'),
                 local('NotoNaskhArabic'),
                 local('Noto Naskh Arabic Regular'),
                 url('/fonts/NotoNaskhArabic-Regular.ttf') format('truetype');
            font-weight: 400;
            font-style: normal;
            font-display: swap;
          }
          @font-face {
            font-family: 'Noto Naskh Arabic';
            src: local('Noto Naskh Arabic Bold'),
                 local('NotoNaskhArabic-Bold'),
                 url('/fonts/NotoNaskhArabic-Bold.ttf') format('truetype');
            font-weight: 700;
            font-style: normal;
            font-display: swap;
          }
          @font-face {
            font-family: 'Jameel Noori Nastaleeq';
            src: local('Jameel Noori Nastaleeq'),
                 local('Jameel Noori Nastaleeq Regular'),
                 local('JameelNooriNastaleeq'),
                 url('/fonts/jameel-noori-nastaleeq.woff2') format('woff2'),
                 url('https://cdn.jsdelivr.net/npm/jameel-noori/fonts/jameel-noori-nastaleeq4.woff2') format('woff2');
            font-weight: 400;
            font-style: normal;
            font-display: swap;
          }
          @font-face {
            font-family: 'Jameel Noori Nastaleeq Kasheeda';
            src: local('Jameel Noori Nastaleeq Kasheeda'),
                 local('JameelNooriNastaleeqKasheeda'),
                 local('Jameel Noori Nastaleeq');
            font-weight: 400;
            font-style: normal;
            font-display: swap;
          }
          body { font-family: 'Inter', 'Noto Naskh Arabic', sans-serif; }
          h1, h2, h3, h4, .font-heading { font-family: 'Outfit', 'Noto Naskh Arabic', sans-serif; }
          .font-urdu { 
            font-family: 'Jameel Noori Nastaleeq', 'JameelNooriNastaleeq', 'Noto Nastaliq Urdu', 'Urdu Typesetting', serif !important; 
            line-height: 2.2 !important; 
            word-spacing: 2px;
          }
          .font-arabic { 
            font-family: 'Noto Naskh Arabic', 'Segoe UI', Tahoma, Arial, sans-serif !important; 
            line-height: 1.9 !important; 
            letter-spacing: 0;
          }
          .font-arabic-classical {
            font-family: 'Amiri', 'Traditional Arabic', serif !important;
            line-height: 2 !important;
          }
          .font-arabic-modern {
            font-family: 'Cairo', 'Noto Sans Arabic', sans-serif !important;
            line-height: 1.7 !important;
          }
          [dir="rtl"], .rtl-mode { direction: rtl; text-align: right; }
          [dir="auto"] { unicode-bidi: plaintext; }
          [dir="rtl"] .katex, [dir="rtl"] .render-math-target .katex, .rtl-mode .katex {
            direction: ltr !important;
            unicode-bidi: isolate !important;
            display: inline-block;
            text-align: left;
          }
        `)}</style>
      </head>
      <body class="bg-slate-50 text-slate-900 min-h-screen flex flex-col antialiased selection:bg-blue-600 selection:text-white">
        
        {/* Top Info & Helpline Bar */}
        {!hideHeaderFooter && (
          <div class="bg-slate-950 text-slate-300 text-xs border-b border-slate-800/90 shadow-2xs">
            <div class="max-w-7xl mx-auto px-4 py-2 flex flex-wrap items-center justify-between gap-2.5">
              <div class="flex items-center gap-3.5 flex-wrap">
                <span class="inline-flex items-center gap-1.5 text-amber-400 font-bold bg-amber-400/10 px-2.5 py-0.5 rounded-full border border-amber-400/25 text-[11px] tracking-wide">
                  <span class="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse"></span>
                  Fall 2026 Admissions Open
                </span>
                <span class="hidden md:inline text-slate-400 text-xs">
                  Premier Tracks: <strong class="text-white font-semibold">Admission & Entrance Test Preparation</strong> & <strong class="text-white font-semibold">Digital Skills Labs</strong>
                </span>
              </div>
              
              <div class="flex items-center gap-5 text-slate-300 text-xs">
                <span class="hidden lg:flex items-center gap-1.5 text-slate-400">
                  <svg class="w-3.5 h-3.5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
                  Main Campus: Lahore
                </span>
                <a href="tel:04235889900" class="flex items-center gap-1.5 hover:text-white transition font-semibold text-slate-300">
                  <svg class="w-3.5 h-3.5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"/></svg>
                  (042) 3588-9900
                </a>
                <a href="https://wa.me/923001234567" target="_blank" class="flex items-center gap-1.5 text-emerald-400 hover:text-emerald-300 transition font-bold bg-emerald-500/10 px-2.5 py-0.5 rounded-full border border-emerald-500/20">
                  <span>💬</span> WhatsApp: 0300-1234567
                </a>
              </div>
            </div>
          </div>
        )}

        {/* Main Academy Header & Sleek Navigation */}
        {!hideHeaderFooter && (
          <header class="bg-white/95 backdrop-blur-md border-b border-slate-200/90 sticky top-0 z-50 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.06)] transition-all duration-200">
            <div class="max-w-7xl mx-auto px-4 h-20 flex items-center justify-between gap-4">
              
              {/* Academy Crest & Title */}
              <a href="/" class="flex items-center gap-3.5 group shrink-0">
                <img 
                  src="/images/logo.png?v=3" 
                  alt="Sharp Academy Crest" 
                  class="h-12 w-12 sm:h-14 sm:w-14 object-contain shrink-0 group-hover:scale-105 transition-transform duration-200" 
                />
                <div class="flex flex-col justify-center">
                  <div class="flex items-center gap-1.5 leading-none">
                    <span class="text-xl sm:text-2xl font-black text-slate-950 tracking-tight font-heading group-hover:text-blue-900 transition-colors">SHARP</span>
                    <span class="text-xl sm:text-2xl font-black text-blue-600 tracking-tight font-heading">ACADEMY</span>
                    <span class="text-[9px] font-bold text-amber-700 bg-amber-400/15 border border-amber-500/20 px-1.5 py-0.5 rounded">EST. 2010</span>
                  </div>
                  {/* Slogan: strictly 4 words */}
                  <span class="text-[10px] sm:text-[11px] font-bold text-slate-500 uppercase tracking-wider mt-1 block">
                    Admission Prep & Digital Skills
                  </span>
                </div>
              </a>

              {/* Clean, Non-Overflowing Desktop Navigation */}
              <nav class="hidden lg:flex items-center gap-5 xl:gap-7 text-[13.5px] font-semibold text-slate-700">
                <a href="/" class="hover:text-blue-600 transition px-2 py-1 rounded-lg hover:bg-slate-50 font-bold">
                  Home
                </a>

                {/* Programs Dropdown */}
                <div class="relative group">
                  <button type="button" class="hover:text-blue-600 transition px-2 py-1 rounded-lg hover:bg-slate-50 flex items-center gap-1 font-semibold focus:outline-none">
                    <span>Programs</span>
                    <svg class="w-3.5 h-3.5 text-slate-400 group-hover:text-blue-600 transition-transform group-hover:rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" /></svg>
                  </button>
                  <div class="absolute top-full left-0 mt-1 w-68 bg-white/95 backdrop-blur-xl border border-slate-200/90 rounded-2xl shadow-xl p-2 opacity-0 invisible group-hover:opacity-100 group-hover:visible translate-y-2 group-hover:translate-y-0 transition-all duration-200 z-50">
                    <a href="/courses/cadet-college-admission-coaching" class="flex items-center gap-2.5 p-2 rounded-xl hover:bg-blue-50 text-slate-800 hover:text-blue-700 transition">
                      <span class="text-base">🎯</span>
                      <div>
                        <div class="text-xs font-bold leading-tight">Admission & Entrance Prep</div>
                        <div class="text-[10px] text-slate-500 font-normal">Colleges, Universities & Cadet Entry</div>
                      </div>
                    </a>
                    <a href="/courses/practical-computer-literacy" class="flex items-center gap-2.5 p-2 rounded-xl hover:bg-emerald-50 text-slate-800 hover:text-emerald-800 transition">
                      <span class="text-base">💻</span>
                      <div>
                        <div class="text-xs font-bold leading-tight">Digital Skills & IT Lab</div>
                        <div class="text-[10px] text-slate-500 font-normal">100% Practical PC Workstations</div>
                      </div>
                    </a>
                    <a href="/courses" class="flex items-center gap-2.5 p-2 rounded-xl hover:bg-slate-100 text-slate-800 transition border-t border-slate-100 mt-1 pt-1.5">
                      <span class="text-base">📋</span>
                      <div class="text-xs font-bold">View All Academic Tracks &rarr;</div>
                    </a>
                  </div>
                </div>

                <a href="/schedules" class="hover:text-blue-600 transition px-2 py-1 rounded-lg hover:bg-slate-50">
                  Timetables
                </a>

                <a href="/admissions" class="hover:text-blue-600 transition px-2 py-1 rounded-lg hover:bg-slate-50">
                  Admissions
                </a>

                <a href="/portfolio/" class="hover:text-blue-600 transition px-2 py-1 rounded-lg hover:bg-slate-50">
                  Portfolio
                </a>

                <a href="/portal/lms" class="hover:text-blue-600 transition px-2 py-1 rounded-lg hover:bg-slate-50 flex items-center gap-1">
                  <span>Student LMS</span>
                  <span class="text-[9px] font-black uppercase tracking-wider px-1.5 py-0.2 bg-blue-100 text-blue-700 rounded-full">v2.0</span>
                </a>
              </nav>

              {/* Action Buttons */}
              <div class="flex items-center gap-2.5 shrink-0">
                <a href="/portal/login" class="text-xs font-bold text-slate-700 hover:text-blue-600 px-3.5 py-2.5 rounded-xl hover:bg-slate-100 border border-transparent hover:border-slate-200 transition hidden sm:inline-flex items-center gap-1.5">
                  <svg class="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  <span>Portal Login</span>
                </a>
                <a href="/admissions" class="relative group overflow-hidden bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 hover:from-blue-700 hover:to-indigo-800 text-white text-xs font-black uppercase tracking-wider px-4 sm:px-4.5 py-2.5 rounded-xl shadow-md shadow-blue-600/25 hover:shadow-lg hover:shadow-blue-600/35 transition-all duration-200 flex items-center gap-1.5">
                  <span>Apply for Admission</span>
                  <span class="group-hover:translate-x-1 transition-transform duration-200">&rarr;</span>
                </a>

                {/* Mobile Menu Toggle Button */}
                <button 
                  type="button" 
                  id="mobile-menu-toggle-btn" 
                  aria-label="Toggle navigation menu"
                  class="lg:hidden w-10 h-10 rounded-xl bg-slate-100 hover:bg-slate-200 border border-slate-200/80 flex items-center justify-center text-slate-700 focus:outline-none transition shrink-0"
                >
                  <svg class="w-5 h-5 block" id="menu-icon-bars" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" />
                  </svg>
                  <svg class="w-5 h-5 hidden" id="menu-icon-close" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Mobile Responsive Navigation Drawer */}
            <div id="mobile-menu-drawer" class="hidden lg:hidden border-t border-slate-200 bg-white/98 backdrop-blur-xl px-4 py-6 shadow-2xl transition-all duration-300">
              <div class="flex flex-col gap-2.5 max-w-lg mx-auto">
                <div class="pb-2.5 border-b border-slate-100 flex items-center justify-between">
                  <span class="text-xs font-bold text-slate-400 uppercase tracking-wider">Academy Navigation</span>
                  <span class="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-amber-100 text-amber-800">Admissions 2026-27</span>
                </div>
                <a href="/" class="flex items-center justify-between py-2 text-sm font-bold text-slate-800 hover:text-blue-600 px-2 rounded-lg hover:bg-slate-50 transition">
                  <span>Home</span>
                  <span class="text-slate-400">&rarr;</span>
                </a>
                <a href="/courses" class="flex items-center justify-between py-2 text-sm font-bold text-slate-800 hover:text-blue-600 px-2 rounded-lg hover:bg-slate-50 transition">
                  <span>All Academic Programs</span>
                  <span class="text-slate-400">&rarr;</span>
                </a>
                <a href="/courses/cadet-college-admission-coaching" class="flex items-center justify-between py-2.5 px-3 rounded-xl bg-blue-50 text-blue-800 font-bold text-sm border border-blue-100">
                  <div class="flex items-center gap-2">
                    <span>🎯</span>
                    <span>Admission & Entrance Prep</span>
                  </div>
                  <span class="text-xs bg-blue-600 text-white px-2 py-0.5 rounded-md font-bold">Prep</span>
                </a>
                <a href="/courses/practical-computer-literacy" class="flex items-center justify-between py-2.5 px-3 rounded-xl bg-emerald-50 text-emerald-800 font-bold text-sm border border-emerald-100">
                  <div class="flex items-center gap-2">
                    <span>💻</span>
                    <span>Digital Skills & IT Lab</span>
                  </div>
                  <span class="text-xs bg-emerald-600 text-white px-2 py-0.5 rounded-md font-bold">Lab</span>
                </a>
                <a href="/schedules" class="flex items-center justify-between py-2 text-sm font-bold text-slate-800 hover:text-blue-600 px-2 rounded-lg hover:bg-slate-50 transition">
                  <span>Class & Timetables</span>
                  <span class="text-slate-400">&rarr;</span>
                </a>
                <a href="/admissions" class="flex items-center justify-between py-2 text-sm font-bold text-slate-800 hover:text-blue-600 px-2 rounded-lg hover:bg-slate-50 transition">
                  <span>Admissions & Eligibility</span>
                  <span class="text-slate-400">&rarr;</span>
                </a>
                <a href="/portfolio/" class="flex items-center justify-between py-2.5 px-3 rounded-xl bg-slate-50 text-slate-800 font-bold text-sm border border-slate-200">
                  <div class="flex items-center gap-2">
                    <span>💼</span>
                    <span>Portfolio</span>
                  </div>
                  <span class="text-xs text-blue-600 font-bold">&rarr;</span>
                </a>
                <a href="/portal/lms" class="flex items-center justify-between py-2 text-sm font-bold text-slate-800 hover:text-blue-600 px-2 rounded-lg hover:bg-slate-50 transition">
                  <span>Student LMS Portal</span>
                  <span class="text-xs text-blue-600 font-bold">Access &rarr;</span>
                </a>
                
                <div class="pt-4 mt-2 border-t border-slate-100 flex flex-col gap-2.5">
                  <a href="/portal/login" class="w-full text-center py-2.5 rounded-xl border border-slate-200 text-sm font-bold text-slate-700 hover:bg-slate-50 transition flex items-center justify-center gap-2">
                    <span>Portal Login (Student / Faculty)</span>
                  </a>
                  <a href="/admissions" class="w-full text-center py-3 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-sm font-black uppercase tracking-wider shadow-md shadow-blue-600/30 flex items-center justify-center gap-2">
                    <span>Apply for Fall 2026 Admission</span>
                    <span>&rarr;</span>
                  </a>
                </div>
              </div>
            </div>
          </header>
        )}

        {/* Main Content Area */}
        <main class="flex-1">
          {children}
        </main>

        {/* Sleek Academy Footer */}
        {!hideHeaderFooter && (
          <footer class="bg-slate-950 text-slate-400 py-16 border-t border-slate-800 text-sm">
            <div class="max-w-7xl mx-auto px-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10">
              
              {/* Col 1: Identity & Crest */}
              <div class="lg:col-span-2 space-y-4">
                <div class="flex items-center gap-3.5">
                  <div class="w-12 h-12 rounded-2xl bg-white p-1 flex items-center justify-center shadow-lg border border-white/20 shrink-0">
                    <img src="/images/logo.png?v=3" alt="Sharp Academy Crest" class="w-full h-full object-contain" />
                  </div>
                  <div>
                    <div class="flex items-center gap-2">
                      <span class="text-white font-black text-xl font-heading tracking-tight">Sharp Academy</span>
                      <span class="text-[10px] font-black uppercase tracking-wider text-amber-400 bg-amber-400/10 border border-amber-400/20 px-2 py-0.5 rounded">ESTD. 2010</span>
                    </div>
                    <span class="block text-[11px] font-bold text-amber-400 uppercase tracking-wider">Centre of Admission Prep & Digital Skills</span>
                  </div>
                </div>
                <p class="text-slate-400 text-sm leading-relaxed max-w-md">
                  Empowering students with rigorous admission and entrance test preparation, comprehensive academic coaching, and 100% hands-on practical digital skills and computer literacy training in modern PC laboratories.
                </p>
                <div class="pt-2 flex flex-wrap items-center gap-3 text-xs">
                  <span class="bg-slate-900 border border-slate-800 text-slate-300 px-3 py-1.5 rounded-lg font-semibold">
                    ✓ Reg. BISE & Entrance Prep
                  </span>
                  <span class="bg-slate-900 border border-slate-800 text-slate-300 px-3 py-1.5 rounded-lg font-semibold">
                    ✓ 50-Seat High-Tech PC Lab
                  </span>
                  <span class="bg-slate-900 border border-slate-800 text-slate-300 px-3 py-1.5 rounded-lg font-semibold">
                    ✓ 3,200+ Successful Admissions
                  </span>
                </div>
              </div>

              {/* Col 2: Flagship Academic Programs */}
              <div>
                <h4 class="text-white font-black text-sm uppercase tracking-wider font-heading mb-4">Core Programs</h4>
                <ul class="space-y-2.5 text-sm">
                  <li>
                    <a href="/courses/cadet-college-admission-coaching" class="text-blue-400 hover:text-blue-300 transition font-semibold flex items-center gap-1.5">
                      <span>🎯</span> Admission & Entrance Prep
                    </a>
                  </li>
                  <li>
                    <a href="/courses/practical-computer-literacy" class="text-cyan-300 hover:text-cyan-200 transition font-semibold flex items-center gap-1.5">
                      <span>💻</span> Digital Skills & IT Lab
                    </a>
                  </li>
                  <li>
                    <a href="/courses/mdcat-crash-course" class="hover:text-white transition">
                      MDCAT Medical Prep Crash Course
                    </a>
                  </li>
                  <li>
                    <a href="/courses/full-stack-web-engineering" class="hover:text-white transition">
                      Full-Stack Web Engineering
                    </a>
                  </li>
                  <li>
                    <a href="/courses/financial-accounting" class="hover:text-white transition">
                      Financial Accounting & Cost
                    </a>
                  </li>
                </ul>
              </div>

              {/* Col 3: Academy Hubs & Portals */}
              <div>
                <h4 class="text-white font-black text-sm uppercase tracking-wider font-heading mb-4">Academy Portals</h4>
                <ul class="space-y-2.5 text-sm">
                  <li>
                    <a href="/admissions" class="hover:text-white transition flex items-center gap-1.5">
                      <span>📝</span> Online Admission Form
                    </a>
                  </li>
                  <li>
                    <a href="/schedules" class="hover:text-white transition flex items-center gap-1.5">
                      <span>📅</span> Class & Drill Timetables
                    </a>
                  </li>
                  <li>
                    <a href="/portal/lms" class="hover:text-white transition flex items-center gap-1.5">
                      <span>🎓</span> Student Learning Portal (LMS)
                    </a>
                  </li>
                  <li>
                    <a href="/exam/1" class="hover:text-white transition flex items-center gap-1.5">
                      <span>⏱️</span> Live Simulated Exam Engine
                    </a>
                  </li>
                  <li>
                    <a href="http://localhost:3000" class="hover:text-white transition flex items-center gap-1.5">
                      <span>🛡️</span> Faculty & Admin Backoffice
                    </a>
                  </li>
                  <li>
                    <a href="/portfolio/" class="text-amber-400 hover:text-amber-300 transition flex items-center gap-1.5 font-semibold">
                      <span>💼</span> Director & Faculty Portfolio
                    </a>
                  </li>
                </ul>
              </div>

              {/* Col 4: Campus Desk & Contact */}
              <div>
                <h4 class="text-white font-black text-sm uppercase tracking-wider font-heading mb-4">Admissions Desk</h4>
                <div class="space-y-3 text-sm">
                  <div>
                    <span class="text-xs text-slate-500 uppercase font-bold block">Campus Address</span>
                    <span class="text-slate-300 font-medium">84-Main Boulevard, Gulberg III, Lahore, Pakistan</span>
                  </div>
                  <div>
                    <span class="text-xs text-slate-500 uppercase font-bold block">Admissions Helpline</span>
                    <a href="tel:04235889900" class="text-white font-bold hover:text-blue-400 transition block">
                      (042) 3588-9900 / 0300-1234567
                    </a>
                  </div>
                  <div>
                    <span class="text-xs text-slate-500 uppercase font-bold block">Visiting Hours</span>
                    <span class="text-slate-300">Mon - Sat: 7:00 AM - 8:00 PM</span>
                  </div>
                </div>
              </div>

            </div>

            <div class="max-w-7xl mx-auto px-4 pt-12 mt-12 border-t border-slate-900 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-slate-500">
              <div>
                &copy; {new Date().getFullYear()} Sharp Academy. All Rights Reserved. Reg. BISE Lahore.
              </div>
              <div class="flex items-center gap-6">
                <a href="/admissions" class="hover:text-slate-400 transition">Admissions Policy</a>
                <a href="/courses" class="hover:text-slate-400 transition">Academic Rules</a>
                <a href="/portal/lms" class="hover:text-slate-400 transition">Academy Code of Conduct</a>
              </div>
            </div>
          </footer>
        )}

        {/* KaTeX Auto-Renderer Script */}
        <script dangerouslySetInnerHTML={{ __html: `
          function triggerKatex() {
            if (typeof window.renderMathInElement === 'function') {
              try {
                window.renderMathInElement(document.body, {
                  delimiters: [
                    { left: '$$', right: '$$', display: true },
                    { left: '$', right: '$', display: false },
                    { left: '\\\\(', right: '\\\\)', display: false },
                    { left: '\\\\[', right: '\\\\]', display: true }
                  ],
                  ignoredTags: ['script', 'noscript', 'style', 'textarea', 'pre', 'code'],
                  throwOnError: false
                });
              } catch (e) {
                console.warn('[KaTeX Render Warning]', e);
              }
            } else {
              setTimeout(triggerKatex, 60);
            }
          }
          window.__renderAllMath = triggerKatex;

          if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', triggerKatex);
          } else {
            triggerKatex();
          }
          window.addEventListener('load', triggerKatex);
          setTimeout(triggerKatex, 150);
          setTimeout(triggerKatex, 600);

          // Mobile Navigation Menu Toggle
          document.addEventListener('DOMContentLoaded', function() {
            var toggleBtn = document.getElementById('mobile-menu-toggle-btn');
            var drawer = document.getElementById('mobile-menu-drawer');
            var iconBars = document.getElementById('menu-icon-bars');
            var iconClose = document.getElementById('menu-icon-close');

            if (toggleBtn && drawer) {
              toggleBtn.addEventListener('click', function() {
                var isHidden = drawer.classList.contains('hidden');
                if (isHidden) {
                  drawer.classList.remove('hidden');
                  if (iconBars) iconBars.classList.add('hidden');
                  if (iconClose) iconClose.classList.remove('hidden');
                } else {
                  drawer.classList.add('hidden');
                  if (iconBars) iconBars.classList.remove('hidden');
                  if (iconClose) iconClose.classList.add('hidden');
                }
              });
            }
          });
        ` }} />
      </body>
    </html>
  );
}
