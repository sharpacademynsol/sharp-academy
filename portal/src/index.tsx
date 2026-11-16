import { raw } from 'hono/html';
import { Layout } from './Layout';
import { Hono } from 'hono';
import { getCookie, setCookie } from 'hono/cookie';
import katex from 'katex';

const app = new Hono<{ Bindings: { DB: D1Database; FILES: R2Bucket } }>();

// RTL detection regex for Arabic, Urdu, Persian, Pashto, Hebrew
function isRTLText(text?: string): boolean {
  if (!text) return false;
  return /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]/.test(text);
}

// Urdu specific detection (Nastaliq cursive script - Jameel Noori Nastaleeq)
function isUrduText(text?: string): boolean {
  if (!text) return false;
  return /[ٹڈڑںےھچگپژ]/.test(text) || /\b(ہے|ہیں|تھا|تھی|تھے|گا|گی|گے|کا|کی|کے|کو|سے|میں|اور|پر|ہو|اگر|کیا|کیوں|کون|کس|والا|والی|والے|تک|نہ|نہیں|جواب|سوال|کلیہ|مساوات)\b/.test(text);
}

// Standard Arabic detection (Noto Naskh Arabic)
function isArabicText(text?: string): boolean {
  if (!text) return false;
  return isRTLText(text) && !isUrduText(text);
}

function getScriptFontClass(text?: string, fallback = 'font-sans'): string {
  if (!text || !isRTLText(text)) return fallback;
  return isUrduText(text) ? 'font-urdu' : 'font-arabic';
}

// Helper to render math via KaTeX (Server-Side Rendering) and format markdown bold, italic, code
function renderRichText(str?: string) {
  if (!str) return '';
  let text = str;

  // Auto-balance or wrap LaTeX if commands are found without proper $ delimiters
  if (/\\[a-zA-Z]+/.test(text)) {
    const dollarMatches = text.match(/(?<!\\)\$/g);
    const count = dollarMatches ? dollarMatches.length : 0;
    if (count % 2 === 1) {
      if (text.endsWith('$') && !text.startsWith('$')) {
        text = '$' + text;
      } else if (text.startsWith('$') && !text.endsWith('$')) {
        text = text + '$';
      }
    } else if (count === 0) {
      text = '$' + text + '$';
    }
  }

  // 1. SSR KaTeX Display Math ($$ ... $$) - strictly isolated in LTR
  text = text.replace(/\$\$([\s\S]+?)\$\$/g, (_, math) => {
    try {
      const rendered = katex.renderToString(math.trim(), { displayMode: true, throwOnError: false });
      return `<div dir="ltr" class="katex-ltr-container my-2 overflow-x-auto text-center" style="direction: ltr !important; unicode-bidi: isolate !important;">${rendered}</div>`;
    } catch (e) {
      return `$$${math}$$`;
    }
  });

  // 2. SSR KaTeX Inline Math ($ ... $) - strictly isolated in LTR
  text = text.replace(/(?<!\\)\$([^\$]+?)(?<!\\)\$/g, (_, math) => {
    try {
      const rendered = katex.renderToString(math.trim(), { displayMode: false, throwOnError: false });
      return `<span dir="ltr" class="katex-ltr-container inline-block mx-0.5" style="direction: ltr !important; unicode-bidi: isolate !important;">${rendered}</span>`;
    } catch (e) {
      return `$${math}$`;
    }
  });

  // 3. SSR KaTeX LaTeX Environments or \( ... \) - strictly isolated in LTR
  text = text.replace(/\\\(([\s\S]+?)\\\)/g, (_, math) => {
    try {
      const rendered = katex.renderToString(math.trim(), { displayMode: false, throwOnError: false });
      return `<span dir="ltr" class="katex-ltr-container inline-block mx-0.5" style="direction: ltr !important; unicode-bidi: isolate !important;">${rendered}</span>`;
    } catch (e) {
      return `\\(${math}\\)`;
    }
  });

  const formatted = text
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    .replace(/<u>(.*?)<\/u>/g, '<u>$1</u>')
    .replace(/`([^\`]+)`/g, '<code class="bg-slate-100 text-blue-700 px-1 py-0.5 rounded font-mono text-xs">$1</code>')
    .replace(/!\[(.*?)\]\((.*?)\)/g, '<img src="$2" alt="$1" class="max-h-56 max-w-full rounded-xl border border-slate-200 my-2 object-contain bg-white p-1 shadow-sm" />');
  return raw(formatted);
}

// 1. Edge-Stream Proxy for Educational Materials & Images from Cloudflare R2
app.get('/cdn/*', async (c) => {
  const key = c.req.path.replace(/^\/cdn\//, '');
  const object = await c.env.FILES?.get(key);
  if (!object) return c.text('Not Found', 404);

  return c.body(object.body, 200, {
    'Content-Type': object.httpMetadata?.contentType || 'application/octet-stream',
    'Cache-Control': 'public, max-age=31536000, immutable',
    'ETag': object.httpEtag
  });
});

// ============================================================================
// 2. HOMEPAGE (/) — Sleek Educational Academy Showcase
// ============================================================================
app.get('/', async (c) => {
  const db = c.env.DB;
  
  let courses: any[] = [];
  let schedules: any[] = [];
  let cadetCourse: any = null;
  let compCourse: any = null;
  let heroSlides: any[] = [];
  let activities: any[] = [];
  let activitiesBadge = "Real Academy Life & Methodology";
  let activitiesTitle = "Activities of Learning & Training in Action";
  let activitiesDesc = "Education at Sharp Academy extends far beyond passive memorization. We integrate physical fitness drills, 1-to-1 computer lab practice, and interactive academic problem solving.";
  
  try {
    const coursesRes = await db.prepare(`
      SELECT c.*, cat.name as category_name 
      FROM courses c 
      JOIN course_categories cat ON c.category_id = cat.id 
      WHERE c.is_active = 1 
      ORDER BY c.is_featured DESC, c.id ASC
    `).all();
    courses = coursesRes.results || [];

    cadetCourse = courses.find((x: any) => x.code === 'CAD-101') || courses[0];
    compCourse = courses.find((x: any) => x.code === 'COMP-101') || courses[1];

    const schedulesRes = await db.prepare(`
      SELECT b.name as batch_name, b.batch_code, b.mode, s.day_of_week, s.start_time, s.end_time, s.room_number, c.title as course_title, c.code as course_code
      FROM batch_schedules s
      JOIN batches b ON s.batch_id = b.id
      JOIN courses c ON b.course_id = c.id
      ORDER BY s.id ASC
      LIMIT 8
    `).all();
    schedules = schedulesRes.results || [];

    // Query dynamic hero slides from admin CMS
    try {
      const slidesRes = await db.prepare(`
        SELECT * FROM homepage_hero_slides WHERE is_active = 1 ORDER BY sort_order ASC, id ASC
      `).all();
      if (slidesRes.results && slidesRes.results.length > 0) {
        heroSlides = slidesRes.results;
      }
    } catch (e) {
      console.warn('[D1] Slides query notice:', e);
    }

    // Query dynamic activities from admin CMS
    try {
      const actRes = await db.prepare(`
        SELECT * FROM homepage_activities WHERE is_active = 1 ORDER BY sort_order ASC, id ASC
      `).all();
      if (actRes.results && actRes.results.length > 0) {
        activities = actRes.results;
      }
    } catch (e) {
      console.warn('[D1] Activities query notice:', e);
    }

    // Query dynamic activities section settings
    try {
      const settingsRes = await db.prepare(`
        SELECT key, value FROM site_settings WHERE key LIKE 'activities_%'
      `).all();
      if (settingsRes.results) {
        settingsRes.results.forEach((r: any) => {
          if (r.key === 'activities_badge' && r.value) activitiesBadge = r.value;
          if (r.key === 'activities_title' && r.value) activitiesTitle = r.value;
          if (r.key === 'activities_description' && r.value) activitiesDesc = r.value;
        });
      }
    } catch (e) {
      console.warn('[D1] Settings query notice:', e);
    }
  } catch (err) {
    console.warn('[D1] Query notice:', err);
  }

  // Graceful fallback if tables are empty
  if (heroSlides.length === 0) {
    heroSlides = [
      {
        badge: "Premier Entrance Test Preparation & Academic Coaching",
        title: "Empowering Academic Ambitions &",
        highlight_text: "Entrance Test Success",
        description: "Specialized coaching for competitive college, university, and Cadet College admissions. Systematic concept mastery, daily intelligence (IQ) tests, computerized mock exams, and personalized interview mentoring.",
        features_json: JSON.stringify([
          { icon: "★", text: "98.6% Pass Rate", color: "text-amber-400" },
          { icon: "✓", text: "Computerized Mock Tests", color: "text-blue-400" },
          { icon: "●", text: "Master Faculty Mentorship", color: "text-emerald-400" }
        ]),
        primary_cta_text: "Explore Entrance Coaching",
        primary_cta_url: "/courses/cadet-college-admission-coaching",
        secondary_cta_text: "Apply for Admission",
        secondary_cta_url: "/admissions",
        image_url: "/images/cadets-drill.jpg",
        tab_label: "Entrance Prep",
        tab_title: "Colleges & University Entry"
      },
      {
        badge: "100% Practical Workstations • Digital Skills Lab",
        title: "Empowering Students with",
        highlight_text: "In-Demand Digital Skills",
        description: "State-of-the-art 50-workstation multimedia computing laboratory. Hands-on touch typing mastery (40+ WPM guaranteed), Microsoft Office productivity, web skills, and practical computer literacy.",
        features_json: JSON.stringify([
          { icon: "🖥️", text: "1:1 Dedicated PC Station", color: "text-cyan-400" },
          { icon: "⚡", text: "40+ WPM Touch Typing", color: "text-emerald-400" },
          { icon: "📜", text: "Recognized Certification", color: "text-amber-400" }
        ]),
        primary_cta_text: "Explore Digital Skills Lab",
        primary_cta_url: "/courses/practical-computer-literacy",
        secondary_cta_text: "Enroll for Fall 2026",
        secondary_cta_url: "/admissions",
        image_url: "/images/computer-literacy.jpg",
        tab_label: "Digital Skills",
        tab_title: "100% Practical PC Lab"
      },
      {
        badge: "Concept-First Curriculum • Grades 6–8, Matric & FSc",
        title: "Rigorous Academic Coaching for",
        highlight_text: "Peak Board Exam Results",
        description: "Systematic concept-building in Mathematics, Sciences, English, and analytical problem-solving. Daily computerized practice quizzes and simulated exam engines to guarantee top board results.",
        features_json: JSON.stringify([
          { icon: "⏱️", text: "CBT Simulated Exam Engine", color: "text-blue-400" },
          { icon: "👨‍🏫", text: "Master Subject Specialists", color: "text-indigo-400" },
          { icon: "📊", text: "Bi-Weekly Progress Reports", color: "text-amber-400" }
        ]),
        primary_cta_text: "View Academic Programs",
        primary_cta_url: "/courses",
        secondary_cta_text: "Try Simulated Exam",
        secondary_cta_url: "/exam/1",
        image_url: "/images/cadets-classroom.jpg",
        tab_label: "Academic Coaching",
        tab_title: "Matric & FSc Board Prep"
      },
      {
        badge: "Personality Grooming & Physical Fitness",
        title: "Building Iron Discipline &",
        highlight_text: "Interview Confidence",
        description: "Holistic student development combining morning physical stamina conditioning, confidence workshops, English communication, and mock interview panels.",
        features_json: JSON.stringify([
          { icon: "🏃", text: "Morning Fitness & Stamina", color: "text-amber-400" },
          { icon: "🧠", text: "IQ & Interview Readiness", color: "text-cyan-400" },
          { icon: "🗣️", text: "Communication Skills", color: "text-emerald-400" }
        ]),
        primary_cta_text: "View Drills & Campus Life",
        primary_cta_url: "/courses/cadet-college-admission-coaching",
        secondary_cta_text: "Apply for Admission",
        secondary_cta_url: "/admissions",
        image_url: "/images/cadets-obstacle.jpg",
        tab_label: "Campus Drills",
        tab_title: "Stamina & Interview Prep"
      }
    ];
  }

  if (activities.length === 0) {
    activities = [
      {
        category_badge: "Physical Stamina & Health",
        badge_color: "amber",
        title: "Morning Physical Fitness & Stamina Drills",
        description: "Daily morning endurance runs, agility exercises, push-ups, and structured stamina routines to build discipline, mental sharpness, and test readiness.",
        tags_json: JSON.stringify(["Endurance Run", "Agility Drill", "Peak Stamina"]),
        image_url: "/images/cadets-drill.jpg",
        link_text: "View Fitness Routines",
        link_url: "/courses/cadet-college-admission-coaching"
      },
      {
        category_badge: "Practical Tech Lab",
        badge_color: "cyan",
        title: "Hands-On PC Lab & Touch Typing",
        description: "Individual desktop workstation per student. Daily typing speed tracking (aiming 40+ WPM), Windows OS, MS Word, Excel formulas, and PowerPoint design.",
        tags_json: JSON.stringify(["40+ WPM Typing", "MS Office Suite", "1-to-1 Workstations"]),
        image_url: "/images/computer-literacy.jpg",
        link_text: "Explore Computer Lab",
        link_url: "/courses/practical-computer-literacy"
      },
      {
        category_badge: "Entrance Academics",
        badge_color: "emerald",
        title: "Intelligence (IQ) & Academic Test Coaching",
        description: "Specialized classroom sessions for Verbal & Non-Verbal IQ matrix patterns, mathematics shortcuts, English essay writing, science concepts, and past-paper drills.",
        tags_json: JSON.stringify(["Verbal/Non-Verbal IQ", "Math Shortcuts", "Past Papers"]),
        image_url: "/images/cadets-classroom.jpg",
        link_text: "View Academic Syllabus",
        link_url: "/courses/cadet-college-admission-coaching"
      },
      {
        category_badge: "Personality Grooming",
        badge_color: "amber",
        title: "Interview Grooming & Confidence Building",
        description: "Panel mock interviews, communication skills, confidence drills, and team coordination to ensure total readiness for competitive college and university selections.",
        tags_json: JSON.stringify(["Mock Interviews", "Mental Toughness", "Public Speaking"]),
        image_url: "/images/cadets-obstacle.jpg",
        link_text: "Register for Batch",
        link_url: "/admissions"
      }
    ];
  }

  return c.html(
    <Layout title="Sharp Academy — Admission & Entrance Test Preparation with Digital Skills">
      {/* HERO SECTION: EDUCATIONAL INSTITUTION INTERACTIVE SLIDER */}
      <section class="relative bg-slate-950 text-white overflow-hidden border-b border-slate-800" id="hero-slider-section">
        
        {/* Slides Track Container */}
        <div class="relative w-full min-h-[580px] sm:min-h-[620px] lg:min-h-[660px] flex items-center" id="hero-slider-viewport">
          {heroSlides.map((slide, sIdx) => {
            const features = (() => {
              try {
                return slide.features_json ? JSON.parse(slide.features_json) : [];
              } catch {
                return [];
              }
            })();

            return (
              <div 
                class={`hero-slide absolute inset-0 w-full h-full transition-opacity duration-1000 ease-in-out flex items-center ${
                  sIdx === 0 ? "opacity-100 z-10" : "opacity-0 z-0 pointer-events-none"
                }`}
                data-slide-index={String(sIdx)}
              >
                {/* Background Image with Ken-Burns Motion */}
                <div class="absolute inset-0 overflow-hidden">
                  <img 
                    src={slide.image_url} 
                    alt={slide.title} 
                    class={`slide-bg-img w-full h-full object-cover object-center transition-transform duration-[7000ms] ease-out brightness-[0.40] ${
                      sIdx === 0 ? "scale-105" : "scale-100"
                    }`}
                  />
                  <div class="absolute inset-0 bg-gradient-to-r from-slate-950 via-slate-950/85 to-transparent"></div>
                  <div class="absolute inset-0 bg-radial-at-c from-transparent via-slate-950/40 to-slate-950/90"></div>
                </div>

                {/* Slide Content */}
                <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20 relative z-20 w-full">
                  <div class="max-w-3xl space-y-6">
                    
                    {slide.badge && (
                      <div class="inline-flex items-center gap-2 bg-blue-500/15 border border-blue-400/30 backdrop-blur-md px-3.5 py-1.5 rounded-full text-blue-300 text-xs font-semibold tracking-wide">
                        <span class="w-2 h-2 rounded-full bg-amber-400 animate-pulse"></span>
                        <span>{slide.badge}</span>
                      </div>
                    )}

                    <h1 class="text-3xl sm:text-5xl lg:text-6xl font-black tracking-tight leading-[1.14] font-heading drop-shadow-md text-white">
                      {slide.title}{' '}
                      {slide.highlight_text && (
                        <>
                          <br class="hidden sm:inline" />
                          <span class="text-amber-400">{slide.highlight_text}</span>
                        </>
                      )}
                    </h1>

                    <p class="text-sm sm:text-base text-slate-300 leading-relaxed font-normal max-w-2xl drop-shadow-xs">
                      {slide.description}
                    </p>

                    {/* Unified, Balanced Feature Badges */}
                    {features.length > 0 && (
                      <div class="flex flex-wrap gap-2.5 pt-1 text-xs font-medium text-slate-200">
                        {features.map((f: any, fIdx: number) => (
                          <span key={fIdx} class="bg-white/10 backdrop-blur-md border border-white/15 px-3 py-1.5 rounded-lg flex items-center gap-1.5">
                            <span class={f.color || "text-amber-400"}>{f.icon || "✓"}</span> {f.text}
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Streamlined, Non-Congested CTAs */}
                    {(slide.primary_cta_text || slide.secondary_cta_text) && (
                      <div class="pt-2 flex flex-wrap items-center gap-4">
                        {slide.primary_cta_text && (
                          <a 
                            href={slide.primary_cta_url || "/courses"} 
                            class="bg-blue-600 hover:bg-blue-500 text-white px-6 py-3.5 rounded-xl font-bold text-sm shadow-lg shadow-blue-600/30 transition-all duration-150 flex items-center gap-2 group"
                          >
                            <span>{slide.primary_cta_text}</span>
                            <span class="group-hover:translate-x-1 transition-transform">&rarr;</span>
                          </a>
                        )}
                        {slide.secondary_cta_text && (
                          <a 
                            href={slide.secondary_cta_url || "/admissions"} 
                            class="bg-white/10 hover:bg-white/20 text-white border border-white/25 backdrop-blur-md px-6 py-3.5 rounded-xl font-semibold text-sm transition"
                          >
                            {slide.secondary_cta_text}
                          </a>
                        )}
                      </div>
                    )}

                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* SLIDER NAVIGATION ARROWS (Left & Right) */}
        <button 
          type="button" 
          id="hero-prev-btn" 
          aria-label="Previous slide"
          class="absolute left-3 sm:left-6 top-1/2 -translate-y-1/2 z-30 w-11 h-11 sm:w-13 sm:h-13 rounded-full bg-slate-950/60 hover:bg-blue-600 border border-white/20 text-white backdrop-blur-md flex items-center justify-center transition-all duration-200 shadow-xl hover:scale-105 hover:border-white/40 focus:outline-none"
        >
          <svg class="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M15 19l-7-7 7-7" /></svg>
        </button>

        <button 
          type="button" 
          id="hero-next-btn" 
          aria-label="Next slide"
          class="absolute right-3 sm:right-6 top-1/2 -translate-y-1/2 z-30 w-11 h-11 sm:w-13 sm:h-13 rounded-full bg-slate-950/60 hover:bg-blue-600 border border-white/20 text-white backdrop-blur-md flex items-center justify-center transition-all duration-200 shadow-xl hover:scale-105 hover:border-white/40 focus:outline-none"
        >
          <svg class="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M9 5l7 7-7 7" /></svg>
        </button>

        {/* BOTTOM INSTITUTIONAL SLIDER TABS WITH PROGRESS BARS */}
        <div class="relative z-30 bg-slate-950/90 backdrop-blur-md border-t border-slate-800/80 px-4 py-3">
          <div class="max-w-7xl mx-auto">
            {/* Desktop / Tablet Tabs */}
            <div 
              class="hidden sm:grid gap-3 lg:gap-4" 
              style={`grid-template-columns: repeat(${heroSlides.length}, minmax(0, 1fr));`} 
              id="hero-slider-tabs"
            >
              {heroSlides.map((slide, sIdx) => (
                <button 
                  type="button" 
                  class={`hero-tab text-left p-3.5 rounded-xl transition-all duration-300 ${
                    sIdx === 0 
                      ? "bg-white/15 border-t-2 border-t-amber-400 border-x border-b border-white/20 opacity-100 shadow-xl shadow-black/40 ring-1 ring-white/20" 
                      : "bg-slate-950/70 border border-white/10 opacity-35 hover:opacity-75"
                  } group focus:outline-none cursor-pointer`}
                  data-tab-target={String(sIdx)}
                >
                  <div class="w-full bg-slate-800/80 h-1 rounded-full overflow-hidden mb-2.5">
                    <div 
                      class={`hero-progress-bar h-full transition-all duration-100 ease-linear ${sIdx === 0 ? "bg-amber-400 w-full" : "bg-white/20 w-0"}`} 
                      data-progress-target={String(sIdx)}
                    />
                  </div>
                  <div class={`hero-tab-label text-[11px] uppercase tracking-wider flex items-center gap-1.5 transition-colors ${
                    sIdx === 0 ? "font-bold text-amber-400" : "font-medium text-slate-400"
                  }`}>
                    <span>{String(sIdx + 1).padStart(2, '0')}</span>
                    <span>•</span>
                    <span>{slide.tab_label}</span>
                  </div>
                  <div class={`hero-tab-title text-xs truncate mt-0.5 transition-colors ${
                    sIdx === 0 ? "font-bold text-white" : "font-medium text-slate-400"
                  }`}>
                    {slide.tab_title}
                  </div>
                </button>
              ))}
            </div>

            {/* Mobile Dots Indicator */}
            <div class="sm:hidden flex items-center justify-center gap-2 py-1" id="hero-mobile-dots">
              {heroSlides.map((_, sIdx) => (
                <button 
                  type="button" 
                  class={`hero-dot rounded-full transition-all ${sIdx === 0 ? "w-6 h-2 bg-amber-400" : "w-2 h-2 bg-slate-700"}`} 
                  data-dot-target={String(sIdx)} 
                  aria-label={`Slide ${sIdx + 1}`}
                />
              ))}
            </div>
          </div>
        </div>

        {/* KEY ACADEMY METRICS & TRUST BAR */}
        <div class="bg-slate-900 border-t border-slate-800/80 py-5 px-4">
          <div class="max-w-7xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-6 text-center md:text-left">
            <div class="flex items-center gap-3.5 justify-center md:justify-start">
              <div class="w-11 h-11 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400 flex items-center justify-center text-xl shrink-0 font-bold">
                🎯
              </div>
              <div>
                <div class="text-xl sm:text-2xl font-black text-white font-heading leading-tight">3,200+</div>
                <div class="text-xs text-slate-400 font-medium">Successful Admissions Across Pakistan</div>
              </div>
            </div>

            <div class="flex items-center gap-3.5 justify-center md:justify-start">
              <div class="w-11 h-11 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 flex items-center justify-center text-xl shrink-0 font-bold">
                💻
              </div>
              <div>
                <div class="text-xl sm:text-2xl font-black text-cyan-300 font-heading leading-tight">100%</div>
                <div class="text-xs text-slate-400 font-medium">1:1 Dedicated PC Workstations</div>
              </div>
            </div>

            <div class="flex items-center gap-3.5 justify-center md:justify-start">
              <div class="w-11 h-11 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center text-xl shrink-0 font-bold">
                ⚡
              </div>
              <div>
                <div class="text-xl sm:text-2xl font-black text-amber-400 font-heading leading-tight">98.6%</div>
                <div class="text-xs text-slate-400 font-medium">Entrance Test & Board Pass Rate</div>
              </div>
            </div>

            <div class="flex items-center gap-3.5 justify-center md:justify-start">
              <div class="w-11 h-11 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center text-xl shrink-0 font-bold">
                🏛️
              </div>
              <div>
                <div class="text-xl sm:text-2xl font-black text-indigo-300 font-heading leading-tight">15+ Yrs</div>
                <div class="text-xs text-slate-400 font-medium">Legacy of Academic Excellence</div>
              </div>
            </div>
          </div>
        </div>

      </section>

      {/* VANILLA JS HERO SLIDER ENGINE */}
      <script dangerouslySetInnerHTML={{ __html: `
        (function() {
          function initHeroSlider() {
            var sliderSection = document.getElementById('hero-slider-section');
            if (!sliderSection) return;

            var slides = sliderSection.querySelectorAll('.hero-slide');
            var tabs = sliderSection.querySelectorAll('.hero-tab');
            var progressBars = sliderSection.querySelectorAll('.hero-progress-bar');
            var dots = sliderSection.querySelectorAll('.hero-dot');
            var prevBtn = document.getElementById('hero-prev-btn');
            var nextBtn = document.getElementById('hero-next-btn');

            if (!slides || slides.length === 0) return;

            var currentIndex = 0;
            var totalSlides = slides.length;
            var slideDuration = 6500; // 6.5s per slide
            var startTime = Date.now();
            var animFrameId = null;
            var isPaused = false;

            function showSlide(index) {
              if (index < 0) index = totalSlides - 1;
              if (index >= totalSlides) index = 0;
              currentIndex = index;

              // Update slides opacity & z-index
              slides.forEach(function(slide, idx) {
                var bgImg = slide.querySelector('.slide-bg-img');
                if (idx === currentIndex) {
                  slide.classList.remove('opacity-0', 'pointer-events-none');
                  slide.classList.add('opacity-100', 'z-10');
                  if (bgImg) bgImg.classList.add('scale-105');
                } else {
                  slide.classList.remove('opacity-100', 'z-10');
                  slide.classList.add('opacity-0', 'pointer-events-none');
                  if (bgImg) bgImg.classList.remove('scale-105');
                }
              });

              // Update desktop tabs: lighten current, hold others dimmed
              tabs.forEach(function(tab, idx) {
                var progressBar = tab.querySelector('.hero-progress-bar');
                var label = tab.querySelector('.hero-tab-label');
                var title = tab.querySelector('.hero-tab-title');

                if (idx === currentIndex) {
                  // Lighten active slide card
                  tab.className = 'hero-tab text-left p-3.5 rounded-xl transition-all duration-300 bg-white/15 border-t-2 border-t-amber-400 border-x border-b border-white/20 opacity-100 shadow-xl shadow-black/40 ring-1 ring-white/20 group focus:outline-none cursor-pointer';
                  if (label) {
                    label.className = 'hero-tab-label text-[11px] font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5 transition-colors';
                  }
                  if (title) {
                    title.className = 'hero-tab-title text-xs font-bold text-white truncate mt-0.5 transition-colors';
                  }
                  if (progressBar) {
                    progressBar.className = 'hero-progress-bar bg-amber-400 h-full transition-all duration-100 ease-linear';
                  }
                } else {
                  // Hold other slide cards dim
                  tab.className = 'hero-tab text-left p-3.5 rounded-xl transition-all duration-300 bg-slate-950/70 border border-white/10 opacity-35 hover:opacity-75 group focus:outline-none cursor-pointer';
                  if (label) {
                    label.className = 'hero-tab-label text-[11px] font-medium text-slate-400 uppercase tracking-wider flex items-center gap-1.5 transition-colors';
                  }
                  if (title) {
                    title.className = 'hero-tab-title text-xs font-medium text-slate-400 truncate mt-0.5 transition-colors';
                  }
                  if (progressBar) {
                    progressBar.className = 'hero-progress-bar bg-white/20 h-full transition-all duration-100 ease-linear';
                    progressBar.style.width = '0%';
                  }
                }
              });

              // Update mobile dots
              dots.forEach(function(dot, idx) {
                if (idx === currentIndex) {
                  dot.classList.add('w-6', 'bg-amber-400');
                  dot.classList.remove('w-2', 'bg-slate-700');
                } else {
                  dot.classList.remove('w-6', 'bg-amber-400');
                  dot.classList.add('w-2', 'bg-slate-700');
                }
              });

              startTime = Date.now();
            }

            function updateProgress() {
              if (!isPaused) {
                var elapsed = Date.now() - startTime;
                var progress = Math.min((elapsed / slideDuration) * 100, 100);

                progressBars.forEach(function(bar, idx) {
                  if (idx === currentIndex) {
                    bar.style.width = progress + '%';
                  } else if (idx < currentIndex) {
                    bar.style.width = '100%';
                  } else {
                    bar.style.width = '0%';
                  }
                });

                if (elapsed >= slideDuration) {
                  showSlide(currentIndex + 1);
                }
              }
              animFrameId = requestAnimationFrame(updateProgress);
            }

            // Next & Prev buttons
            if (nextBtn) {
              nextBtn.addEventListener('click', function(e) {
                e.preventDefault();
                showSlide(currentIndex + 1);
              });
            }

            if (prevBtn) {
              prevBtn.addEventListener('click', function(e) {
                e.preventDefault();
                showSlide(currentIndex - 1);
              });
            }

            // Tab click
            tabs.forEach(function(tab) {
              tab.addEventListener('click', function() {
                var target = parseInt(tab.getAttribute('data-tab-target'), 10);
                if (!isNaN(target)) {
                  showSlide(target);
                }
              });
            });

            // Dot click
            dots.forEach(function(dot) {
              dot.addEventListener('click', function() {
                var target = parseInt(dot.getAttribute('data-dot-target'), 10);
                if (!isNaN(target)) {
                  showSlide(target);
                }
              });
            });

            // Pause on hover
            sliderSection.addEventListener('mouseenter', function() {
              isPaused = true;
            });
            sliderSection.addEventListener('mouseleave', function() {
              isPaused = false;
              startTime = Date.now() - (parseFloat(progressBars[currentIndex]?.style?.width || 0) / 100 * slideDuration);
            });

            // Touch Swipe support
            var touchStartX = 0;
            var touchEndX = 0;
            sliderSection.addEventListener('touchstart', function(e) {
              touchStartX = e.changedTouches[0].screenX;
            }, { passive: true });

            sliderSection.addEventListener('touchend', function(e) {
              touchEndX = e.changedTouches[0].screenX;
              var diff = touchStartX - touchEndX;
              if (Math.abs(diff) > 40) {
                if (diff > 0) {
                  showSlide(currentIndex + 1);
                } else {
                  showSlide(currentIndex - 1);
                }
              }
            }, { passive: true });

            // Keyboard navigation
            window.addEventListener('keydown', function(e) {
              if (e.key === 'ArrowRight') {
                showSlide(currentIndex + 1);
              } else if (e.key === 'ArrowLeft') {
                showSlide(currentIndex - 1);
              }
            });

            // Start loop
            showSlide(0);
            animFrameId = requestAnimationFrame(updateProgress);
          }

          if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', initHeroSlider);
          } else {
            initHeroSlider();
          }
        })();
      ` }} />

      {/* SECTION 2: INSIDE SHARP ACADEMY — ACTIVITIES OF LEARNING & TRAINING PROCESS */}
      <section class="py-20 px-4 max-w-7xl mx-auto">
        <div class="text-center max-w-3xl mx-auto mb-16">
          <span class="inline-flex items-center gap-1.5 text-blue-700 bg-blue-100 font-bold text-xs uppercase tracking-widest px-3 py-1 rounded-full border border-blue-200">
            {activitiesBadge}
          </span>
          <h2 class="text-3xl sm:text-4xl font-black text-slate-900 font-heading mt-3">
            {activitiesTitle}
          </h2>
          <p class="text-slate-600 text-sm sm:text-base mt-3 leading-relaxed">
            {activitiesDesc}
          </p>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {activities.map((act) => {
            const badgeClasses = (() => {
              switch (act.badge_color) {
                case "cyan":
                  return "text-cyan-300 border-cyan-400/20";
                case "emerald":
                  return "text-emerald-300 border-emerald-400/20";
                case "blue":
                  return "text-blue-300 border-blue-400/20";
                case "indigo":
                  return "text-indigo-300 border-indigo-400/20";
                case "purple":
                  return "text-purple-300 border-purple-400/20";
                case "rose":
                  return "text-rose-300 border-rose-400/20";
                case "amber":
                default:
                  return "text-amber-300 border-amber-400/20";
              }
            })();

            const tags: string[] = (() => {
              try {
                if (!act.tags_json) return [];
                return typeof act.tags_json === "string" ? JSON.parse(act.tags_json) : act.tags_json;
              } catch {
                return [];
              }
            })();

            return (
              <div class="bg-white rounded-2xl border border-slate-200/90 shadow-sm overflow-hidden hover:shadow-xl hover:-translate-y-1 transition duration-300 flex flex-col justify-between group">
                <div>
                  <div class="relative h-52 overflow-hidden bg-slate-900">
                    <img 
                      src={act.image_url || "/images/cadets-drill.jpg"} 
                      alt={act.title} 
                      class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div class={`absolute top-3 left-3 bg-slate-950/80 backdrop-blur-md text-xs font-bold px-2.5 py-1 rounded-lg border ${badgeClasses}`}>
                      {act.category_badge}
                    </div>
                  </div>
                  <div class="p-5">
                    <h3 class="text-base font-bold text-slate-900 font-heading">
                      {act.title}
                    </h3>
                    <p class="text-xs text-slate-600 mt-2 leading-relaxed">
                      {act.description}
                    </p>
                    {tags.length > 0 && (
                      <div class="mt-4 flex flex-wrap gap-1.5 text-[11px] font-bold text-slate-700">
                        {tags.map((t) => (
                          <span class="bg-slate-100 px-2 py-0.5 rounded">{t}</span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
                <div class="p-5 pt-0">
                  <a href={act.link_url || "/admissions"} class="text-xs font-bold text-blue-600 hover:text-blue-800 transition flex items-center gap-1">
                    <span>{act.link_text || "Learn More"}</span> &rarr;
                  </a>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* SECTION 3: CORE FEATURED COURSES SPOTLIGHT (Cadet Coaching & Computer Literacy) */}
      <section class="py-20 px-4 bg-slate-100/70 border-y border-slate-200">
        <div class="max-w-7xl mx-auto">
          <div class="flex flex-col md:flex-row md:items-end justify-between mb-12">
            <div>
              <span class="text-blue-700 font-black text-xs uppercase tracking-widest bg-blue-100 px-3 py-1 rounded-full border border-blue-200">
                Flagship Academic Pillars
              </span>
              <h2 class="text-3xl sm:text-4xl font-black text-slate-900 font-heading mt-3">
                Core Training Programs
              </h2>
              <p class="text-slate-600 text-sm mt-1">
                Comprehensive training tracks designed for distinct academic milestones.
              </p>
            </div>
            <a href="/courses" class="text-blue-600 font-bold text-sm hover:underline mt-4 md:mt-0 flex items-center gap-1">
              <span>View All 5 Programs & Degrees</span> &rarr;
            </a>
          </div>

          <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
            
            {/* Spotlight 1: Admission & Entrance Test Preparation */}
            <div class="bg-white rounded-3xl border-2 border-blue-200/80 shadow-md overflow-hidden hover:shadow-xl transition flex flex-col justify-between">
              <div>
                <div class="relative h-64 overflow-hidden bg-slate-900">
                  <img 
                    src="/images/cadets-drill.jpg" 
                    alt="Admission coaching classes and test prep" 
                    class="w-full h-full object-cover"
                  />
                  <div class="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent"></div>
                  <div class="absolute top-4 left-4 flex gap-2">
                    <span class="bg-amber-500 text-slate-950 text-xs font-black px-3 py-1 rounded-full uppercase tracking-wider shadow">
                      🎯 Flagship Coaching Track
                    </span>
                    <span class="bg-slate-950/80 backdrop-blur-md text-white text-xs font-bold px-3 py-1 rounded-full">
                      Colleges & Uni Entry
                    </span>
                  </div>
                  <div class="absolute bottom-4 left-4 right-4">
                    <span class="text-xs font-bold text-blue-300 font-mono">CODE: PREP-101 • 16 WEEKS</span>
                    <h3 class="text-2xl font-black text-white font-heading mt-0.5">
                      Admission & Entrance Test Preparation Program
                    </h3>
                  </div>
                </div>

                <div class="p-6 sm:p-8 space-y-6">
                  <p class="text-slate-600 text-sm leading-relaxed">
                    Pakistan's premier coaching program for admission and entrance examinations of <strong>prestigious colleges, universities, Cadet Colleges, and competitive institutions</strong> across Pakistan.
                  </p>

                  {/* Highlights checklist */}
                  <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs text-slate-700 font-medium">
                    <div class="flex items-center gap-2">
                      <span class="text-emerald-500 font-bold">✓</span> Conceptual Mastery (Math, English, Science & Urdu)
                    </div>
                    <div class="flex items-center gap-2">
                      <span class="text-emerald-500 font-bold">✓</span> Verbal & Non-Verbal Intelligence (IQ) Tests
                    </div>
                    <div class="flex items-center gap-2">
                      <span class="text-emerald-500 font-bold">✓</span> Computerized Mock Tests & Itemized Reports
                    </div>
                    <div class="flex items-center gap-2">
                      <span class="text-emerald-500 font-bold">✓</span> Panel Mock Interviews & Confidence Building
                    </div>
                  </div>

                  <div class="bg-blue-50/70 p-4 rounded-2xl border border-blue-100 flex items-center justify-between">
                    <div>
                      <span class="text-[11px] text-blue-600 font-bold uppercase tracking-wider block">Target Institutions</span>
                      <span class="text-xs font-bold text-slate-800">Top Colleges • Cadet Colleges • Medical / Eng. Entry • Boards</span>
                    </div>
                    <span class="text-xs font-extrabold bg-blue-600 text-white px-2.5 py-1 rounded-lg">
                      Enrolling
                    </span>
                  </div>
                </div>
              </div>

              <div class="p-6 sm:p-8 pt-0 border-t border-slate-100 mt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <span class="text-xs text-slate-400 block font-medium">Full Tuition & Training Fee</span>
                  <div class="flex items-baseline gap-2">
                    <span class="text-2xl font-black text-slate-900">Rs 25,000</span>
                    <span class="text-xs text-slate-500">+ Rs 3,000 admission</span>
                  </div>
                </div>
                <div class="flex items-center gap-3">
                  <a href="/courses/cadet-college-admission-coaching" class="bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs px-4 py-3 rounded-xl transition">
                    View Syllabus
                  </a>
                  <a href="/admissions?course=4" class="bg-blue-600 hover:bg-blue-700 text-white font-black text-xs px-5 py-3 rounded-xl transition shadow-md shadow-blue-600/30">
                    Apply for Admission Batch &rarr;
                  </a>
                </div>
              </div>
            </div>

            {/* Spotlight 2: Practical Computer Literacy & Digital Office Skills */}
            <div class="bg-white rounded-3xl border-2 border-cyan-200/80 shadow-md overflow-hidden hover:shadow-xl transition flex flex-col justify-between">
              <div>
                <div class="relative h-64 overflow-hidden bg-slate-900">
                  <img 
                    src="/images/computer-literacy.jpg" 
                    alt="Practical computer literacy laboratory" 
                    class="w-full h-full object-cover"
                  />
                  <div class="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent"></div>
                  <div class="absolute top-4 left-4 flex gap-2">
                    <span class="bg-cyan-400 text-slate-950 text-xs font-black px-3 py-1 rounded-full uppercase tracking-wider shadow">
                      💻 High-Tech Lab Track
                    </span>
                    <span class="bg-slate-950/80 backdrop-blur-md text-white text-xs font-bold px-3 py-1 rounded-full">
                      All Ages & Job Seekers
                    </span>
                  </div>
                  <div class="absolute bottom-4 left-4 right-4">
                    <span class="text-xs font-bold text-cyan-300 font-mono">CODE: COMP-101 • 8 WEEKS</span>
                    <h3 class="text-2xl font-black text-white font-heading mt-0.5">
                      Practical Computer Literacy & Digital Office Skills
                    </h3>
                  </div>
                </div>

                <div class="p-6 sm:p-8 space-y-6">
                  <p class="text-slate-600 text-sm leading-relaxed">
                    100% hands-on laboratory course designed to transform beginners into confident computer operators. Learn touch typing, Windows 11, Microsoft Office suite, safe browsing, and workplace digital tools.
                  </p>

                  {/* Highlights checklist */}
                  <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs text-slate-700 font-medium">
                    <div class="flex items-center gap-2">
                      <span class="text-cyan-600 font-bold">✓</span> 1-to-1 Individual PC Workstation Guarantee
                    </div>
                    <div class="flex items-center gap-2">
                      <span class="text-cyan-600 font-bold">✓</span> Touch Typing Drills to achieve 40+ WPM
                    </div>
                    <div class="flex items-center gap-2">
                      <span class="text-cyan-600 font-bold">✓</span> MS Word, Excel Formulas & PowerPoint Mastery
                    </div>
                    <div class="flex items-center gap-2">
                      <span class="text-cyan-600 font-bold">✓</span> Email Etiquette, Cloud Storage & AI Tools
                    </div>
                  </div>

                  <div class="bg-cyan-50/70 p-4 rounded-2xl border border-cyan-100 flex items-center justify-between">
                    <div>
                      <span class="text-[11px] text-cyan-700 font-bold uppercase tracking-wider block">Lab Facility</span>
                      <span class="text-xs font-bold text-slate-800">50 High-Performance Core-i7 Desktop Systems</span>
                    </div>
                    <span class="text-xs font-extrabold bg-cyan-600 text-white px-2.5 py-1 rounded-lg">
                      Morning & Evening
                    </span>
                  </div>
                </div>
              </div>

              <div class="p-6 sm:p-8 pt-0 border-t border-slate-100 mt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <span class="text-xs text-slate-400 block font-medium">Full Tuition & Lab Fee</span>
                  <div class="flex items-baseline gap-2">
                    <span class="text-2xl font-black text-slate-900">Rs 15,000</span>
                    <span class="text-xs text-slate-500">+ Rs 2,000 admission</span>
                  </div>
                </div>
                <div class="flex items-center gap-3">
                  <a href="/courses/practical-computer-literacy" class="bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs px-4 py-3 rounded-xl transition">
                    View Lab Syllabus
                  </a>
                  <a href="/admissions?course=5" class="bg-cyan-600 hover:bg-cyan-700 text-white font-black text-xs px-5 py-3 rounded-xl transition shadow-md shadow-cyan-600/30">
                    Enroll in PC Lab &rarr;
                  </a>
                </div>
              </div>
            </div>

          </div>

          {/* Secondary programs preview row */}
          <div class="mt-12 pt-8 border-t border-slate-200">
            <h4 class="text-xs font-black uppercase tracking-wider text-slate-500 mb-4">Other Academic & Professional Programs</h4>
            <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
              {courses.filter((c: any) => c.code !== 'CAD-101' && c.code !== 'COMP-101').map((c: any) => (
                <div class="bg-white p-5 rounded-2xl border border-slate-200 flex flex-col justify-between hover:shadow-md transition">
                  <div>
                    <span class="text-[11px] font-bold text-blue-600 uppercase font-mono">{c.code} • {c.category_name}</span>
                    <h5 class="text-sm font-bold text-slate-900 mt-1">{c.title}</h5>
                    <p class="text-xs text-slate-500 mt-2 line-clamp-2">{c.summary}</p>
                  </div>
                  <div class="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                    <span class="text-sm font-black text-slate-900">Rs {Number(c.regular_fee_pkr).toLocaleString()}</span>
                    <a href={`/courses/${c.slug}`} class="text-xs font-bold text-blue-600 hover:underline">
                      Details &rarr;
                    </a>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>
      </section>

      {/* SECTION 4: LIVE BATCH TIMETABLE MATRIX */}
      <section class="py-20 px-4 max-w-7xl mx-auto">
        <div class="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
          
          <div class="lg:col-span-5 space-y-4">
            <span class="text-blue-700 font-black text-xs uppercase tracking-widest bg-blue-100 px-3 py-1 rounded-full border border-blue-200">
              Weekly Schedule
            </span>
            <h2 class="text-3xl font-black text-slate-900 font-heading">
              Active Batch Timetable & Room Locations
            </h2>
            <p class="text-slate-600 text-sm leading-relaxed">
              Find morning parade drill times, afternoon computer lab allocations, and hybrid lecture slots. Classes are strictly scheduled to maximize student concentration and physical endurance.
            </p>

            <div class="pt-4 space-y-3">
              <div class="flex items-center gap-3 text-xs text-slate-700 bg-white p-3 rounded-xl border border-slate-200 shadow-xs">
                <span class="w-8 h-8 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center font-bold text-base">🏃</span>
                <div>
                  <strong class="block text-slate-900">Academic Grounds & Drill Arena</strong>
                  <span>Morning 06:30 - 10:30 AM (Physical + Academic)</span>
                </div>
              </div>
              <div class="flex items-center gap-3 text-xs text-slate-700 bg-white p-3 rounded-xl border border-slate-200 shadow-xs">
                <span class="w-8 h-8 rounded-lg bg-cyan-100 text-cyan-700 flex items-center justify-center font-bold text-base">🖥️</span>
                <div>
                  <strong class="block text-slate-900">High-Tech PC Lab A & B</strong>
                  <span>10:00 AM - 12:00 PM & 04:00 - 06:00 PM Slots</span>
                </div>
              </div>
            </div>

            <div class="pt-2">
              <a href="/schedules" class="inline-block bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs px-5 py-3 rounded-xl transition shadow">
                View Full Timetable Grid &rarr;
              </a>
            </div>
          </div>

          <div class="lg:col-span-7 bg-white rounded-3xl border border-slate-200/90 shadow-sm overflow-hidden">
            <div class="p-6 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
              <div>
                <h3 class="text-base font-bold text-slate-900 font-heading">Current Enrolling Batches</h3>
                <p class="text-xs text-slate-500">Live roster from Sharp Academy scheduling system</p>
              </div>
              <span class="text-xs font-bold text-emerald-700 bg-emerald-100 px-2.5 py-1 rounded-full">
                ● Live Slots
              </span>
            </div>

            <div class="divide-y divide-slate-100 text-xs">
              {schedules.map((s: any) => (
                <div class="p-4 hover:bg-slate-50/70 transition flex items-center justify-between gap-4">
                  <div>
                    <div class="flex items-center gap-2">
                      <span class="font-bold text-blue-600 uppercase font-mono">{s.day_of_week}</span>
                      <span class="text-slate-400">•</span>
                      <span class="font-bold text-slate-700 font-mono">{s.start_time} - {s.end_time}</span>
                    </div>
                    <h4 class="font-bold text-slate-900 text-sm mt-0.5">{s.course_title}</h4>
                    <p class="text-slate-500 mt-0.5">
                      {s.batch_name} • <span class="text-slate-800 font-medium">{s.room_number || 'Room TBA'}</span>
                    </p>
                  </div>
                  <div class="text-right flex flex-col items-end gap-1">
                    <span class="bg-slate-100 text-slate-700 font-bold px-2.5 py-1 rounded-md uppercase text-[10px]">
                      {s.mode}
                    </span>
                    <a href="/admissions" class="text-blue-600 hover:underline font-bold text-[11px]">
                      Register &rarr;
                    </a>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>
      </section>

      {/* SECTION 5: WHY PARENTS & STUDENTS CHOOSE SHARP ACADEMY */}
      <section class="py-20 px-4 bg-slate-950 text-white relative overflow-hidden">
        <div class="max-w-7xl mx-auto relative z-10">
          <div class="text-center max-w-3xl mx-auto mb-16">
            <span class="text-amber-400 font-bold text-xs uppercase tracking-widest bg-amber-400/10 px-3 py-1 rounded-full border border-amber-400/20">
              Our Core Standards
            </span>
            <h2 class="text-3xl sm:text-4xl font-black font-heading mt-3">
              Why Parents & Aspirants Trust Sharp Academy
            </h2>
            <p class="text-slate-400 text-sm sm:text-base mt-2">
              Building disciplined character, strong physical stamina, and practical digital competence.
            </p>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            
            <div class="bg-slate-900/80 p-6 rounded-2xl border border-slate-800 hover:border-blue-500/50 transition">
              <div class="w-12 h-12 rounded-xl bg-blue-600/20 text-blue-400 flex items-center justify-center text-xl font-bold mb-4">
                👨‍🏫
              </div>
              <h3 class="text-lg font-bold text-white font-heading">Senior Educators & Entrance Exam Masters</h3>
              <p class="text-slate-400 text-xs sm:text-sm mt-2 leading-relaxed">
                Trained by seasoned educators, senior subject specialists, and interview coaches who understand the exact selection standards of competitive college and university admission boards.
              </p>
            </div>

            <div class="bg-slate-900/80 p-6 rounded-2xl border border-slate-800 hover:border-cyan-500/50 transition">
              <div class="w-12 h-12 rounded-xl bg-cyan-600/20 text-cyan-400 flex items-center justify-center text-xl font-bold mb-4">
                💻
              </div>
              <h3 class="text-lg font-bold text-white font-heading">Individual 1-to-1 PC Workstations</h3>
              <p class="text-slate-400 text-xs sm:text-sm mt-2 leading-relaxed">
                No sharing computers. Every student has an assigned desktop workstation with high-speed internet, ergonomic keyboard, and licensed office software.
              </p>
            </div>

            <div class="bg-slate-900/80 p-6 rounded-2xl border border-slate-800 hover:border-amber-500/50 transition">
              <div class="w-12 h-12 rounded-xl bg-amber-600/20 text-amber-400 flex items-center justify-center text-xl font-bold mb-4">
                🏃
              </div>
              <h3 class="text-lg font-bold text-white font-heading">Dedicated Fitness & Practice Grounds</h3>
              <p class="text-slate-400 text-xs sm:text-sm mt-2 leading-relaxed">
                Equipped with running track, stamina hurdles, and outdoor activity spaces to build physical fitness, mental sharpness, and disciplined health habits.
              </p>
            </div>

            <div class="bg-slate-900/80 p-6 rounded-2xl border border-slate-800 hover:border-emerald-500/50 transition">
              <div class="w-12 h-12 rounded-xl bg-emerald-600/20 text-emerald-400 flex items-center justify-center text-xl font-bold mb-4">
                📊
              </div>
              <h3 class="text-lg font-bold text-white font-heading">Weekly Mock Exams & Parent SMS</h3>
              <p class="text-slate-400 text-xs sm:text-sm mt-2 leading-relaxed">
                Simulated entrance tests every Saturday. Parents receive biometric attendance and itemized progress reports on their mobile phones weekly.
              </p>
            </div>

            <div class="bg-slate-900/80 p-6 rounded-2xl border border-slate-800 hover:border-purple-500/50 transition">
              <div class="w-12 h-12 rounded-xl bg-purple-600/20 text-purple-400 flex items-center justify-center text-xl font-bold mb-4">
                🧠
              </div>
              <h3 class="text-lg font-bold text-white font-heading">IQ & Interview Personality Grooming</h3>
              <p class="text-slate-400 text-xs sm:text-sm mt-2 leading-relaxed">
                Comprehensive training for Verbal & Non-Verbal reasoning tests, rapid problem solving, English confidence, and mock interview panels.
              </p>
            </div>

            <div class="bg-slate-900/80 p-6 rounded-2xl border border-slate-800 hover:border-rose-500/50 transition">
              <div class="w-12 h-12 rounded-xl bg-rose-600/20 text-rose-400 flex items-center justify-center text-xl font-bold mb-4">
                🛡️
              </div>
              <h3 class="text-lg font-bold text-white font-heading">Hostel & Day-Scholar Boarding</h3>
              <p class="text-slate-400 text-xs sm:text-sm mt-2 leading-relaxed">
                Disciplined hostel facilities with hygienic mess, study prep hours, and round-the-clock wardens for outstation students across Pakistan.
              </p>
            </div>

          </div>
        </div>
      </section>

      {/* SECTION 6: SUCCESS STORIES & TESTIMONIALS */}
      <section class="py-20 px-4 max-w-7xl mx-auto">
        <div class="text-center max-w-3xl mx-auto mb-16">
          <span class="text-blue-700 font-bold text-xs uppercase tracking-widest bg-blue-100 px-3 py-1 rounded-full border border-blue-200">
            Student & Aspirant Wall of Fame
          </span>
          <h2 class="text-3xl font-black text-slate-900 font-heading mt-3">
            Real Stories of Selection & Transformation
          </h2>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-3 gap-8">
          
          <div class="bg-white p-6 rounded-2xl border border-slate-200/90 shadow-sm flex flex-col justify-between">
            <div>
              <div class="text-amber-400 text-sm mb-3">★★★★★</div>
              <p class="text-xs sm:text-sm text-slate-600 leading-relaxed italic">
                "The morning stamina drills, daily Non-Verbal IQ tests, and conceptual test series at Sharp Academy gave me the exact edge needed to clear competitive college entrance exams on my first attempt."
              </p>
            </div>
            <div class="mt-6 pt-4 border-t border-slate-100 flex items-center gap-3">
              <div class="w-10 h-10 rounded-full bg-blue-600 text-white font-bold flex items-center justify-center text-xs">
                BA
              </div>
              <div>
                <h4 class="text-sm font-bold text-slate-900">Bilal Ahmad</h4>
                <p class="text-[11px] text-blue-600 font-semibold">Top College Entrance Merit Selection</p>
              </div>
            </div>
          </div>

          <div class="bg-white p-6 rounded-2xl border border-slate-200/90 shadow-sm flex flex-col justify-between">
            <div>
              <div class="text-cyan-400 text-sm mb-3">★★★★★</div>
              <p class="text-xs sm:text-sm text-slate-600 leading-relaxed italic">
                "I started with zero typing speed. In 8 weeks at the Sharp Academy Computer Lab, my touch typing reached 48 WPM, and I learned Excel formulas and PowerPoint that immediately helped me in my office job."
              </p>
            </div>
            <div class="mt-6 pt-4 border-t border-slate-100 flex items-center gap-3">
              <div class="w-10 h-10 rounded-full bg-cyan-600 text-white font-bold flex items-center justify-center text-xs">
                ZT
              </div>
              <div>
                <h4 class="text-sm font-bold text-slate-900">Zainab Tariq</h4>
                <p class="text-[11px] text-cyan-600 font-semibold">Computer Literacy & Office Diploma Graduate</p>
              </div>
            </div>
          </div>

          <div class="bg-white p-6 rounded-2xl border border-slate-200/90 shadow-sm flex flex-col justify-between">
            <div>
              <div class="text-amber-400 text-sm mb-3">★★★★★</div>
              <p class="text-xs sm:text-sm text-slate-600 leading-relaxed italic">
                "The mock interview sessions, speed mathematics shortcuts, and guidance from expert instructors prepared me mentally. The admission panel was impressed by my conceptual clarity and quick answers."
              </p>
            </div>
            <div class="mt-6 pt-4 border-t border-slate-100 flex items-center gap-3">
              <div class="w-10 h-10 rounded-full bg-indigo-600 text-white font-bold flex items-center justify-center text-xs">
                FR
              </div>
              <div>
                <h4 class="text-sm font-bold text-slate-900">Farhan Raza</h4>
                <p class="text-[11px] text-indigo-600 font-semibold">Pre-Engineering University Admission</p>
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* SECTION 7: FINAL ADMISSIONS CALL TO ACTION */}
      <section class="py-16 px-4 bg-gradient-to-r from-blue-900 via-blue-800 to-indigo-900 text-white border-t border-blue-700">
        <div class="max-w-5xl mx-auto text-center space-y-6">
          <span class="inline-block bg-amber-400 text-slate-950 font-black text-xs uppercase tracking-wider px-3 py-1 rounded-full">
            Limited Seats for Fall 2026 Batches
          </span>
          <h2 class="text-3xl sm:text-5xl font-black font-heading tracking-tight">
            Reserve Your Place at Sharp Academy Today
          </h2>
          <p class="text-blue-200 text-sm sm:text-base max-w-2xl mx-auto leading-relaxed">
            Join the ranks of successful admission holders and tech-savvy students. Submit your application online or visit our Lahore campus for free counseling and lab tour.
          </p>
          <div class="pt-2 flex flex-wrap items-center justify-center gap-4">
            <a href="/admissions" class="bg-white text-blue-900 hover:bg-blue-50 font-black px-8 py-4 rounded-xl text-sm shadow-xl transition">
              Online Admission Form &rarr;
            </a>
            <a href="tel:04235889900" class="bg-blue-950/60 hover:bg-blue-950 border border-blue-400/30 text-white font-bold px-6 py-4 rounded-xl text-sm transition">
              Call Admissions: (042) 3588-9900
            </a>
          </div>
        </div>
      </section>
    </Layout>
  );
});

// ============================================================================
// 3. COURSE CATALOG (/courses)
// ============================================================================
app.get('/courses', async (c) => {
  const db = c.env.DB;
  const { results: courses } = await db.prepare(`
    SELECT c.*, cat.name as category_name 
    FROM courses c 
    JOIN course_categories cat ON c.category_id = cat.id 
    WHERE c.is_active = 1 
    ORDER BY c.is_featured DESC, c.id ASC
  `).all();

  return c.html(
    <Layout title="All Academic Programs, Admission Prep & Digital Skills | Sharp Academy">
      <div class="max-w-7xl mx-auto px-4 py-12">
        
        {/* Header */}
        <div class="mb-10 text-center max-w-2xl mx-auto">
          <span class="text-blue-700 bg-blue-100 font-bold text-xs uppercase tracking-wider px-3 py-1 rounded-full border border-blue-200">
            Academy Catalog
          </span>
          <h1 class="text-3xl md:text-5xl font-black text-slate-900 font-heading mt-3">
            Our Academic & Training Programs
          </h1>
          <p class="text-slate-600 text-sm mt-2">
            Structured syllabi, senior faculty, outdoor practice grounds, and 50-workstation PC lab.
          </p>
        </div>

        {/* Quick Filter Tags */}
        <div class="mb-10 flex flex-wrap items-center justify-center gap-2 text-xs font-bold">
          <a href="/courses" class="bg-blue-600 text-white px-4 py-2 rounded-xl shadow-xs">
            All Programs ({courses?.length || 0})
          </a>
          <a href="/courses/cadet-college-admission-coaching" class="bg-white hover:bg-slate-100 text-slate-700 px-4 py-2 rounded-xl border border-slate-200 transition flex items-center gap-1.5">
            <span>🎯</span> Admission & Entrance Prep
          </a>
          <a href="/courses/practical-computer-literacy" class="bg-white hover:bg-slate-100 text-slate-700 px-4 py-2 rounded-xl border border-slate-200 transition flex items-center gap-1.5">
            <span>💻</span> Digital Skills & IT
          </a>
          <a href="/schedules" class="bg-white hover:bg-slate-100 text-slate-700 px-4 py-2 rounded-xl border border-slate-200 transition flex items-center gap-1.5">
            <span>📅</span> View Timetables
          </a>
        </div>

        {/* Course Cards Grid */}
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {(courses || []).map((course: any) => (
            <div class="bg-white rounded-2xl shadow-sm border border-slate-200/90 overflow-hidden hover:shadow-xl hover:-translate-y-1 transition duration-300 flex flex-col justify-between group">
              <div>
                <div class="relative h-48 overflow-hidden bg-slate-900">
                  <img 
                    src={course.cover_image_url || '/images/campus-life.jpg'} 
                    alt={course.title}
                    class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div class="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent"></div>
                  
                  <div class="absolute top-3 left-3 flex gap-1.5">
                    <span class="text-[11px] font-bold text-white uppercase tracking-wide bg-slate-950/70 backdrop-blur-md px-2.5 py-0.5 rounded-full border border-white/20">
                      {course.category_name}
                    </span>
                    {course.is_featured === 1 && (
                      <span class="text-[11px] font-black text-amber-300 uppercase tracking-wide bg-amber-500/30 backdrop-blur-md px-2.5 py-0.5 rounded-full border border-amber-400/30">
                        ★ Featured
                      </span>
                    )}
                  </div>

                  <div class="absolute bottom-3 left-3 right-3">
                    <span class="text-[11px] text-blue-300 font-mono font-bold block">{course.code}</span>
                    <h2 class="text-base font-bold text-white mt-0.5 leading-snug font-heading">{course.title}</h2>
                  </div>
                </div>

                <div class="p-6">
                  <p class="text-slate-600 text-xs sm:text-sm line-clamp-3 leading-relaxed">{course.summary}</p>
                  
                  <div class="mt-4 pt-4 border-t border-slate-100 grid grid-cols-2 gap-2 text-xs font-semibold text-slate-500">
                    <div class="flex items-center gap-1.5">
                      <span>⏱</span> <span>{course.duration_weeks} Weeks</span>
                    </div>
                    <div class="flex items-center gap-1.5">
                      <span>🎓</span> <span>{course.level || 'Beginner'}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div class="p-6 pt-0 border-t border-slate-100 mt-2 flex items-center justify-between">
                <div>
                  <span class="text-[11px] text-slate-400 block font-medium">Tuition Fee</span>
                  <span class="text-xl font-black text-slate-900">Rs {Number(course.regular_fee_pkr).toLocaleString()}</span>
                </div>
                <a href={`/courses/${course.slug}`} class="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-xl font-bold text-xs shadow-sm transition">
                  Details & Enroll &rarr;
                </a>
              </div>
            </div>
          ))}
        </div>
      </div>
    </Layout>
  );
});

// ============================================================================
// 4. SINGLE COURSE DETAIL ROUTE (/courses/:slug)
// ============================================================================
app.get('/courses/:slug', async (c) => {
  const slug = c.req.param('slug');
  const db = c.env.DB;

  const course: any = await db.prepare(`
    SELECT c.*, cat.name as category_name
    FROM courses c
    JOIN course_categories cat ON c.category_id = cat.id
    WHERE c.slug = ?
  `).bind(slug).first();

  if (!course) return c.text('Course not found', 404);

  const { results: batches } = await db.prepare(`
    SELECT b.*, u.full_name as instructor_name
    FROM batches b
    LEFT JOIN users u ON b.instructor_id = u.id
    WHERE b.course_id = ? AND b.status IN ('enrolling', 'upcoming')
  `).bind(course.id).all();

  const { results: modules } = await db.prepare(`
    SELECT m.*, (SELECT COUNT(*) FROM lessons l WHERE l.module_id = m.id) as lesson_count
    FROM course_modules m
    WHERE m.course_id = ?
    ORDER BY m.sort_order ASC
  `).bind(course.id).all();

  const isCadet = course.code === 'CAD-101';
  const isComp = course.code === 'COMP-101';

  return c.html(
    <Layout title={`${course.title} | Sharp Academy`}>
      {/* Course Hero Banner */}
      <section class="bg-gradient-to-b from-slate-950 via-slate-900 to-blue-950 text-white py-14 px-4 border-b border-slate-800">
        <div class="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          
          <div class="lg:col-span-8 space-y-4">
            <div class="flex items-center gap-2 flex-wrap">
              <a href="/courses" class="text-xs text-blue-400 hover:underline font-bold">&larr; Back to Programs</a>
              <span class="text-slate-500">•</span>
              <span class="text-xs bg-blue-500/20 text-blue-300 font-bold px-2.5 py-0.5 rounded-full border border-blue-400/30">
                {course.category_name}
              </span>
              <span class="text-xs text-amber-400 font-mono font-bold">{course.code}</span>
            </div>

            <h1 class="text-3xl sm:text-4xl lg:text-5xl font-black text-white font-heading leading-tight">
              {course.title}
            </h1>
            
            <p class="text-slate-300 text-sm sm:text-base leading-relaxed max-w-3xl">
              {course.summary}
            </p>

            <div class="pt-2 flex flex-wrap items-center gap-6 text-xs text-slate-300">
              <div><strong class="text-white">Duration:</strong> {course.duration_weeks} Weeks</div>
              <div><strong class="text-white">Level:</strong> {course.level || 'All Levels'}</div>
              <div><strong class="text-white">Certification:</strong> Verified Academy Diploma</div>
              <div><strong class="text-white">Campus:</strong> Lahore Parade Ground & Labs</div>
            </div>
          </div>

          <div class="lg:col-span-4">
            <div class="rounded-2xl overflow-hidden border border-slate-800 shadow-2xl">
              <img 
                src={course.cover_image_url || '/images/campus-life.jpg'} 
                alt={course.title} 
                class="w-full h-56 object-cover"
              />
            </div>
          </div>

        </div>
      </section>

      {/* Main Course Details Body */}
      <div class="max-w-7xl mx-auto px-4 py-12">
        <div class="grid grid-cols-1 lg:grid-cols-12 gap-10">
          
          {/* Left Column: Syllabus, Modules & Activities */}
          <div class="lg:col-span-8 space-y-10">
            
            {/* Course Description */}
            <div class="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-sm space-y-4">
              <h2 class="text-xl font-black text-slate-900 font-heading">Program Overview & Training Process</h2>
              <div class="text-sm text-slate-600 leading-relaxed space-y-3">
                {renderRichText(course.description || course.summary)}
              </div>
            </div>

            {/* Specialized Training Routine for Cadets or Computer Literacy */}
            {isCadet && (
              <div class="bg-gradient-to-br from-amber-50 to-orange-50 p-6 sm:p-8 rounded-2xl border border-amber-200 space-y-4">
                <span class="text-xs font-black text-amber-800 uppercase tracking-wider bg-amber-200/80 px-2.5 py-1 rounded-md">
                  🎯 Daily Admission & Entrance Prep Routine
                </span>
                <h3 class="text-lg font-black text-slate-900 font-heading">
                  Comprehensive 4-Stage Selection Matrix
                </h3>
                <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs text-slate-700">
                  <div class="bg-white p-4 rounded-xl border border-amber-200/80 shadow-xs">
                    <strong class="block text-slate-900 text-sm mb-1">1. Morning Physical Drill</strong>
                    <span>06:30 - 08:00 AM daily. 1.6km endurance run, pushups, situps, and military parade posture.</span>
                  </div>
                  <div class="bg-white p-4 rounded-xl border border-amber-200/80 shadow-xs">
                    <strong class="block text-slate-900 text-sm mb-1">2. Intelligence (IQ) Coaching</strong>
                    <span>Daily Verbal and Non-Verbal pattern recognition drills with 10+ years past paper analysis.</span>
                  </div>
                  <div class="bg-white p-4 rounded-xl border border-amber-200/80 shadow-xs">
                    <strong class="block text-slate-900 text-sm mb-1">3. Academic Subject Mastery</strong>
                    <span>Rigorous classes in Mathematics, General Science, English Composition, and Urdu grammar.</span>
                  </div>
                  <div class="bg-white p-4 rounded-xl border border-amber-200/80 shadow-xs">
                    <strong class="block text-slate-900 text-sm mb-1">4. Interview & Medical Panels</strong>
                    <span>Mock interviews with retired officers, posture grooming, and psychological confidence drills.</span>
                  </div>
                </div>
              </div>
            )}

            {isComp && (
              <div class="bg-gradient-to-br from-cyan-50 to-blue-50 p-6 sm:p-8 rounded-2xl border border-cyan-200 space-y-4">
                <span class="text-xs font-black text-cyan-800 uppercase tracking-wider bg-cyan-200/80 px-2.5 py-1 rounded-md">
                  💻 Laboratory Specifications & Standards
                </span>
                <h3 class="text-lg font-black text-slate-900 font-heading">
                  100% Practical Computer Lab Modules
                </h3>
                <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs text-slate-700">
                  <div class="bg-white p-4 rounded-xl border border-cyan-200/80 shadow-xs">
                    <strong class="block text-slate-900 text-sm mb-1">1. Individual PC Workstation</strong>
                    <span>Dedicated Dell/HP Core-i7 desktop per student with mechanical typing keyboard.</span>
                  </div>
                  <div class="bg-white p-4 rounded-xl border border-cyan-200/80 shadow-xs">
                    <strong class="block text-slate-900 text-sm mb-1">2. Touch Typing Benchmark</strong>
                    <span>Daily speed tracker aiming for 40+ words per minute with 95%+ accuracy certification.</span>
                  </div>
                  <div class="bg-white p-4 rounded-xl border border-cyan-200/80 shadow-xs">
                    <strong class="block text-slate-900 text-sm mb-1">3. Microsoft Office Mastery</strong>
                    <span>Word (letters & reports), Excel (formulas, budgets & charts), and PowerPoint slides.</span>
                  </div>
                  <div class="bg-white p-4 rounded-xl border border-cyan-200/80 shadow-xs">
                    <strong class="block text-slate-900 text-sm mb-1">4. Workplace Digital Tools</strong>
                    <span>Professional email writing, Google Drive, cyber hygiene, and productivity AI tools.</span>
                  </div>
                </div>
              </div>
            )}

            {/* Course Modules Accordion / List */}
            {modules && modules.length > 0 && (
              <div class="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-sm space-y-4">
                <h2 class="text-xl font-black text-slate-900 font-heading">
                  Curriculum Modules & Lesson Plan
                </h2>
                <div class="space-y-3">
                  {modules.map((m: any, idx: number) => (
                    <div class="p-4 rounded-xl bg-slate-50 border border-slate-200/70">
                      <div class="flex items-center justify-between">
                        <span class="text-xs font-bold text-blue-600 uppercase font-mono">Module {idx + 1}</span>
                        <span class="text-xs font-semibold text-slate-500">{m.lesson_count} Lessons</span>
                      </div>
                      <h4 class="text-sm font-bold text-slate-900 mt-1">{m.title}</h4>
                      <p class="text-xs text-slate-600 mt-1">{m.summary}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Available Batches */}
            <div class="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-sm space-y-4">
              <h2 class="text-xl font-black text-slate-900 font-heading">Enrolling Batches for this Program</h2>
              <div class="space-y-3">
                {(batches && batches.length > 0) ? (
                  batches.map((b: any) => (
                    <div class="p-4 rounded-xl border border-slate-200 flex items-center justify-between hover:border-blue-400 transition">
                      <div>
                        <div class="flex items-center gap-2">
                          <h4 class="font-bold text-slate-900 text-sm">{b.name}</h4>
                          <span class="text-xs bg-blue-100 text-blue-700 font-bold px-2 py-0.5 rounded uppercase">{b.mode}</span>
                        </div>
                        <p class="text-xs text-slate-500 mt-1">Code: {b.batch_code} • Starts: {b.start_date}</p>
                      </div>
                      <a href={`/admissions?batch=${b.id}`} class="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs px-4 py-2 rounded-xl transition">
                        Register for Batch &rarr;
                      </a>
                    </div>
                  ))
                ) : (
                  <p class="text-xs text-slate-500">Contact admissions desk for the upcoming batch schedule.</p>
                )}
              </div>
            </div>

          </div>

          {/* Right Column: Sticky Tuition & Enrollment Card */}
          <div class="lg:col-span-4">
            <div class="bg-white p-6 rounded-2xl border border-slate-200 shadow-lg sticky top-24 space-y-6">
              
              <div>
                <span class="text-xs text-slate-400 block font-bold uppercase tracking-wider">Tuition Fee</span>
                <div class="text-3xl font-black text-slate-900 mt-1">
                  Rs {Number(course.regular_fee_pkr).toLocaleString()}
                </div>
                <p class="text-xs text-slate-500 mt-1">
                  + Rs {Number(course.admission_fee_pkr || 0).toLocaleString()} registration & lab fee
                </p>
              </div>

              <div class="space-y-3 text-xs text-slate-600 border-y border-slate-100 py-4">
                <div class="flex justify-between">
                  <span>Duration</span>
                  <strong class="text-slate-900">{course.duration_weeks} Weeks</strong>
                </div>
                <div class="flex justify-between">
                  <span>Target Class</span>
                  <strong class="text-slate-900">{course.level || 'All Levels'}</strong>
                </div>
                <div class="flex justify-between">
                  <span>Class Format</span>
                  <strong class="text-slate-900">On-Campus Labs & Drills</strong>
                </div>
                <div class="flex justify-between">
                  <span>Certificate</span>
                  <strong class="text-slate-900">Verified Academy Credential</strong>
                </div>
              </div>

              <div class="space-y-3">
                <a href={`/admissions?course=${course.id}`} class="block text-center w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-black py-3.5 rounded-xl text-sm transition shadow-md shadow-blue-600/30">
                  Apply for Admission Now
                </a>
                <a href="/schedules" class="block text-center w-full bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold py-3 rounded-xl text-xs transition">
                  Check Class Timetables
                </a>
              </div>

              {/* Campus Desk Help */}
              <div class="bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs text-slate-600 space-y-1">
                <strong class="block text-slate-900">Need Guidance?</strong>
                <p>Call our admission counselors:</p>
                <a href="tel:04235889900" class="text-blue-600 font-bold hover:underline block">
                  📞 (042) 3588-9900
                </a>
              </div>

            </div>
          </div>

        </div>
      </div>
    </Layout>
  );
});

// ============================================================================
// 5. TIMETABLES & SCHEDULES MATRIX (/schedules)
// ============================================================================
app.get('/schedules', async (c) => {
  const db = c.env.DB;
  const { results: schedules } = await db.prepare(`
    SELECT b.name as batch_name, b.batch_code, b.mode, s.day_of_week, s.start_time, s.end_time, s.room_number, s.live_meeting_url, c.title as course_title, c.code as course_code
    FROM batch_schedules s
    JOIN batches b ON s.batch_id = b.id
    JOIN courses c ON b.course_id = c.id
    ORDER BY s.id ASC
  `).all();

  return c.html(
    <Layout title="Weekly Class Schedules, Drill Timings & PC Lab Slots | Sharp Academy">
      <div class="max-w-7xl mx-auto px-4 py-12">
        
        <div class="mb-10 text-center max-w-2xl mx-auto">
          <span class="text-blue-700 bg-blue-100 font-bold text-xs uppercase tracking-wider px-3 py-1 rounded-full border border-blue-200">
            Academy Timetable
          </span>
          <h1 class="text-3xl md:text-5xl font-black text-slate-900 font-heading mt-3">
            Weekly Class & Drill Schedules
          </h1>
          <p class="text-slate-600 text-sm mt-2">
            Parade ground drills, high-tech PC lab slots, and classroom coaching timetables.
          </p>
        </div>

        <div class="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
          <div class="overflow-x-auto">
            <table class="w-full text-left border-collapse">
              <thead>
                <tr class="bg-slate-50 border-b border-slate-200 text-xs font-bold text-slate-500 uppercase tracking-wider">
                  <th class="p-4">Day</th>
                  <th class="p-4">Time Slot</th>
                  <th class="p-4">Program & Course</th>
                  <th class="p-4">Batch Code</th>
                  <th class="p-4">Facility / Room</th>
                  <th class="p-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-100 text-xs">
                {(schedules || []).map((s: any) => (
                  <tr class="hover:bg-slate-50/70 transition">
                    <td class="p-4 font-bold text-slate-900 font-mono">{s.day_of_week}</td>
                    <td class="p-4 font-mono font-bold text-blue-600">{s.start_time} - {s.end_time}</td>
                    <td class="p-4 font-bold text-slate-900">
                      <span class="text-[11px] text-blue-600 block font-mono">{s.course_code}</span>
                      {s.course_title}
                    </td>
                    <td class="p-4 text-slate-600 font-mono">{s.batch_name}</td>
                    <td class="p-4">
                      <span class="inline-block bg-slate-100 text-slate-800 text-xs font-bold px-2.5 py-1 rounded-md">
                        📍 {s.room_number || 'Room TBA'}
                      </span>
                    </td>
                    <td class="p-4 text-right">
                      <a href="/admissions" class="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs px-3 py-1.5 rounded-lg transition">
                        Register
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </Layout>
  );
});

// ============================================================================
// 6. ADMISSION REGISTRATION FORM (/admissions)
// ============================================================================
app.get('/admissions', async (c) => {
  const db = c.env.DB;
  const courseParam = c.req.query('course');
  const batchParam = c.req.query('batch');

  const { results: batches } = await db.prepare(`
    SELECT b.id, b.name, b.batch_code, b.mode, c.id as course_id, c.title as course_title, c.regular_fee_pkr, c.code as course_code
    FROM batches b
    JOIN courses c ON b.course_id = c.id
    WHERE b.status IN ('enrolling', 'upcoming')
    ORDER BY b.id ASC
  `).all();

  return c.html(
    <Layout title="Online Student Admission Registration | Sharp Academy">
      <div class="max-w-4xl mx-auto px-4 py-12">
        
        <div class="text-center mb-10 max-w-2xl mx-auto">
          <span class="text-blue-700 bg-blue-100 font-bold text-xs uppercase tracking-wider px-3 py-1 rounded-full border border-blue-200">
            Admissions Fall 2026
          </span>
          <h1 class="text-3xl md:text-5xl font-black text-slate-900 font-heading mt-3">
            Student Admission Application
          </h1>
          <p class="text-slate-600 text-sm mt-2">
            Reserve your seat in the upcoming Admission Prep, Academic Coaching, or Digital Skills batch.
          </p>
        </div>

        <div class="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Left: Application Form */}
          <div class="lg:col-span-8">
            <form action="/api/admissions/submit" method="post" class="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-sm space-y-6">
              
              <div class="border-b border-slate-100 pb-4">
                <h3 class="text-base font-bold text-slate-900 font-heading">Applicant Information</h3>
                <p class="text-xs text-slate-500">Provide accurate details for registration and roll number allocation.</p>
              </div>

              <div class="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <label class="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Student Full Name *</label>
                  <input type="text" name="full_name" required placeholder="e.g. Hamza Tariq" class="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm" />
                </div>
                <div>
                  <label class="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Email Address *</label>
                  <input type="email" name="email" required placeholder="student@example.com" class="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm" />
                </div>
                <div>
                  <label class="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">WhatsApp / Mobile Number *</label>
                  <input type="tel" name="phone" required placeholder="03001234567" class="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm" />
                </div>
                <div>
                  <label class="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">City of Residence *</label>
                  <input type="text" name="city" required value="Lahore" class="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm" />
                </div>
              </div>

              <div>
                <label class="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Select Target Program & Batch *</label>
                <select name="batch_id" required class="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm bg-white font-medium">
                  <option value="">-- Choose an Enrolling Batch --</option>
                  {(batches || []).map((b: any) => (
                    <option value={b.id} selected={batchParam === String(b.id) || courseParam === String(b.course_id)}>
                      [{b.course_code}] {b.course_title} - {b.name} ({b.mode}) - Rs {Number(b.regular_fee_pkr).toLocaleString()}
                    </option>
                  ))}
                </select>
              </div>

              <div class="bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs text-slate-600">
                <span class="font-bold text-slate-900 block mb-1">Fee & Registration Note</span>
                Upon submission, you will receive your unique Student Registration Number and fee voucher. Payment slips can be uploaded online or deposited at our campus desk.
              </div>

              <button type="submit" class="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-black py-4 rounded-xl shadow-lg shadow-blue-600/30 transition text-base">
                Submit Admission Application &rarr;
              </button>
            </form>
          </div>

          {/* Right: Academy Standards & Guarantees */}
          <div class="lg:col-span-4 space-y-4">
            <div class="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
              <h3 class="text-sm font-black text-slate-900 font-heading uppercase tracking-wider">What's Included</h3>
              <ul class="space-y-3 text-xs text-slate-600">
                <li class="flex items-start gap-2">
                  <span class="text-emerald-500 font-bold">✓</span>
                  <span><strong>Entrance Track:</strong> Complete past-paper dossier, stamina routine & interview guides.</span>
                </li>
                <li class="flex items-start gap-2">
                  <span class="text-cyan-600 font-bold">✓</span>
                  <span><strong>Digital Skills Track:</strong> Assigned desktop workstation & certificate of completion.</span>
                </li>
                <li class="flex items-start gap-2">
                  <span class="text-blue-600 font-bold">✓</span>
                  <span><strong>LMS Access:</strong> Video lectures, downloadable notes, and simulated mock exams.</span>
                </li>
              </ul>
            </div>

            <div class="bg-gradient-to-br from-slate-900 to-blue-950 text-white p-6 rounded-3xl border border-slate-800 space-y-3">
              <span class="text-amber-400 font-bold text-xs uppercase">Helpline</span>
              <h4 class="text-base font-bold font-heading">Need Assistance?</h4>
              <p class="text-slate-300 text-xs leading-relaxed">
                Our admissions counselors are available Monday through Saturday to guide you through course selection.
              </p>
              <div class="pt-1">
                <a href="tel:04235889900" class="text-white font-bold text-sm hover:text-blue-300 transition block">
                  📞 (042) 3588-9900
                </a>
              </div>
            </div>
          </div>

        </div>

      </div>
    </Layout>
  );
});


app.post('/api/admissions/submit', async (c) => {
  const body = await c.req.parseBody();
  const db = c.env.DB;
  const regNo = 'REG-' + Math.floor(100000 + Math.random() * 900000);

  try {
    // 1. Insert or get student user
    let user: any = await db.prepare('SELECT id FROM users WHERE email = ?').bind(body.email).first();
    if (!user) {
      const res = await db.prepare(`
        INSERT INTO users (email, phone, password_hash, full_name, role, city) 
        VALUES (?, ?, 'student_temp_hash', ?, 'student', ?)
      `).bind(body.email, body.phone, body.full_name, body.city || 'Lahore').run();
      user = { id: res.meta.last_row_id };
    }

    // 2. Get batch fee
    const batch: any = await db.prepare(`
      SELECT b.id, c.regular_fee_pkr FROM batches b JOIN courses c ON b.course_id = c.id WHERE b.id = ?
    `).bind(body.batch_id).first();

    const fee = batch?.regular_fee_pkr || 25000;

    // 3. Create registration
    await db.prepare(`
      INSERT INTO registrations (registration_no, student_id, batch_id, status, total_fee_pkr, net_payable_pkr)
      VALUES (?, ?, ?, 'pending', ?, ?)
    `).bind(regNo, user.id, body.batch_id, fee, fee).run();

    return c.html(
      <Layout title="Registration Received | Sharp Academy">
        <div class="max-w-xl mx-auto px-4 py-20 text-center">
          <div class="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto text-2xl font-black mb-4">
            ✓
          </div>
          <h1 class="text-3xl font-black text-slate-900 font-heading">Application Submitted!</h1>
          <p class="text-slate-600 mt-2 text-sm">Your admission registration has been successfully recorded.</p>
          <div class="bg-slate-50 border border-slate-200 rounded-2xl p-6 mt-6 font-mono text-left text-xs space-y-2">
            <div><span class="text-slate-400">Application No:</span> <strong class="text-slate-900">{regNo}</strong></div>
            <div><span class="text-slate-400">Student:</span> <strong class="text-slate-900">{body.full_name}</strong></div>
            <div><span class="text-slate-400">Status:</span> <strong class="text-amber-600 font-sans uppercase">Pending Fee Verification</strong></div>
          </div>
          <div class="mt-8">
            <a href={`/admissions/upload?reg=${regNo}`} class="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-6 py-3 rounded-xl text-sm transition shadow-md inline-block mr-3">Upload Payment Slip Now &rarr;</a><a href="/" class="bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold px-6 py-3 rounded-xl text-sm transition inline-block">
              Back to Home
            </a>
          </div>
        </div>
      </Layout>
    );
  } catch (err: any) {
    return c.text('Registration failed: ' + err.message, 500);
  }
});

// ============================================================================
// 6. ONLINE CBT EXAMINATION CONSOLE & QUIZ ENGINE (/exam/:examId)
// ============================================================================

function deterministicShuffle<T>(arr: T[], seed: number): T[] {
  const result = [...arr];
  let s = seed;
  const nextRandom = () => {
    s |= 0; s = s + 0x6D2B79F5 | 0;
    let t = Math.imul(s ^ s >>> 15, 1 | s);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(nextRandom() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

app.get('/exam/:examId', async (c) => {
  const examId = c.req.param('examId');
  const db = c.env.DB;

  const exam: any = await db.prepare('SELECT * FROM exams WHERE id = ? AND is_published = 1').bind(examId).first();
  if (!exam) return c.text('Exam not found or not published.', 404);

  // 1. Resolve Candidate Session (logged in student or fallback to demo student Hamza Ali)
  let student: any = null;
  try {
    student = await db.prepare('SELECT id, full_name, email, city, avatar_url, phone FROM users WHERE role = "student" LIMIT 1').first();
  } catch {}
  if (!student) {
    student = { id: 3, full_name: "Hamza Ali", email: "hamza.cadet@sharpacademy.pk", roll_number: "CAD-2026-003", avatar_url: "" };
  }
  const studentRollNo = student.roll_number || `CAD-2026-${String(student.id).padStart(3, '0')}`;

  // 2. Fetch OMR Set Allocation (if paper/hybrid set is generated for this exam)
  let allocation: any = null;
  try {
    allocation = await db.prepare(`
      SELECT a.*, s.set_code, s.questions_order_json, s.answer_key_json
      FROM student_omr_allocations a
      JOIN exam_omr_sets s ON a.omr_set_id = s.id
      WHERE a.exam_id = ? AND a.student_id = ?
    `).bind(Number(examId), Number(student.id)).first();
  } catch (e: any) {
    console.error('[Allocation Fetch Error]', e?.message);
  }

  // 3. Fetch All Questions
  const { results: rawQuestions } = await db.prepare(`
    SELECT id, question_text, question_type, marks, options_json 
    FROM exam_questions 
    WHERE exam_id = ? 
    ORDER BY sort_order ASC
  `).bind(examId).all();

  let questions = [...((rawQuestions || []) as any[])];

  // 4. Anti-Cheating Dynamic Question Shuffling
  let assignedSetCode = "Standard (Set A)";
  let assignedSeatNumber: number | null = null;

  if (allocation && allocation.set_code) {
    assignedSetCode = allocation.set_code.startsWith("SET-") ? `Paper ${allocation.set_code}` : `Set ${allocation.set_code}`;
    assignedSeatNumber = allocation.seat_number;
    if (allocation.questions_order_json) {
      try {
        const order: number[] = JSON.parse(allocation.questions_order_json);
        questions.sort((a: any, b: any) => {
          const idxA = order.indexOf(a.id);
          const idxB = order.indexOf(b.id);
          return (idxA >= 0 ? idxA : 999) - (idxB >= 0 ? idxB : 999);
        });
      } catch {}
    }
  } else if (exam.shuffle_questions === 1) {
    // Deterministic per-student pseudo-random permutation
    const seed = (Number(student.id) * 7919) + (Number(examId) * 31337);
    questions = deterministicShuffle(questions, seed);
    assignedSetCode = "Shuffled (CBT Mode)";
  }

  const totalQuestions = questions.length;

  return c.html(
    <Layout title={`${exam.title} — CBT Online Examination Console`} hideHeaderFooter={true}>
      <div class="min-h-screen bg-slate-100/70 text-slate-900 flex flex-col font-sans" id="cbt-app">
        
        {/* ==================================================================== */}
        {/* STICKY CBT EXAMINATION CONSOLE HEADER (Academic Institutional Theme) */}
        {/* ==================================================================== */}
        <header class="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200/90 shadow-xs">
          <div class="max-w-7xl mx-auto px-4 py-3 flex flex-col sm:flex-row items-center justify-between gap-3">
            
            {/* Left: Academy Crest & Exam Meta */}
            <div class="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-start">
              <div class="flex items-center gap-3">
                <div class="w-10 h-10 rounded-xl bg-white p-0.5 flex items-center justify-center shadow-sm border border-slate-200/90 shrink-0">
                  <img src="/images/logo.png" alt="Sharp Academy Crest" class="w-full h-full object-contain" />
                </div>
                <div>
                  <div class="flex items-center gap-2">
                    <span class="text-xs font-black uppercase tracking-wider text-blue-900 font-heading">Sharp Academy CBT</span>
                    <span class="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                      Live Assessment
                    </span>
                  </div>
                  <h1 class="text-sm sm:text-base font-bold text-slate-900 tracking-tight truncate max-w-xs sm:max-w-md font-heading">
                    {exam.title}
                  </h1>
                </div>
              </div>

              {/* Mobile timer trigger */}
              <div class="sm:hidden flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 border border-emerald-300 font-mono font-bold text-sm text-emerald-800" id="timer-box-mobile">
                <span>⏱️</span>
                <span class="timer-display">{exam.duration_minutes}:00</span>
              </div>
            </div>

            {/* Center: Candidate Identity Badge */}
            <div class="hidden md:flex items-center gap-3 px-4 py-1.5 rounded-2xl bg-slate-50 border border-slate-200 shadow-2xs">
              <div class="w-8 h-8 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 text-white font-bold text-xs flex items-center justify-center shrink-0 shadow-2xs">
                {student.full_name?.charAt(0) || "C"}
              </div>
              <div class="text-left">
                <span class="text-xs font-bold text-slate-900 block leading-tight">{student.full_name}</span>
                <span class="text-[10px] font-mono font-medium text-slate-500">Roll: {studentRollNo}</span>
              </div>
              <div class="h-6 w-px bg-slate-200 mx-0.5"></div>
              <div class="text-right">
                <span class="text-[10px] font-bold text-blue-700 uppercase tracking-wider block leading-tight bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                  {assignedSetCode}
                </span>
                {assignedSeatNumber && (
                  <span class="text-[10px] font-mono font-bold text-slate-600 block mt-0.5">Seat #{assignedSeatNumber}</span>
                )}
              </div>
            </div>

            {/* Right: Live Visual Countdown Clock & Finish Button */}
            <div class="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
              
              {/* Desktop Countdown Clock */}
              <div 
                id="timer-box" 
                class="hidden sm:flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-50 border-2 border-emerald-500/70 text-emerald-800 font-mono font-black text-lg shadow-2xs transition-colors duration-300"
              >
                <span class="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" id="timer-dot"></span>
                <span class="timer-display">{exam.duration_minutes}:00</span>
              </div>

              {/* Review & Finish Button */}
              <button 
                type="button" 
                id="open-submit-modal-btn"
                class="flex-1 sm:flex-none bg-gradient-to-r from-blue-700 to-indigo-700 hover:from-blue-800 hover:to-indigo-800 text-white font-extrabold text-xs sm:text-sm px-5 py-2.5 rounded-xl transition shadow-md shadow-blue-700/20 flex items-center justify-center gap-2 active:scale-95 cursor-pointer"
              >
                <span>Finish & Submit</span>
                <span>&rarr;</span>
              </button>
            </div>

          </div>

          {/* Subheader: Real-time Progress Bar & Status Badges */}
          <div class="bg-slate-50/90 border-t border-slate-200 px-4 py-2">
            <div class="max-w-7xl mx-auto flex items-center justify-between gap-4 text-xs">
              <div class="flex items-center gap-3 flex-1 max-w-xl">
                <span class="text-slate-500 font-bold shrink-0">Progress:</span>
                <div class="flex-1 h-2.5 rounded-full bg-slate-200 overflow-hidden shadow-inner">
                  <div id="progress-bar-fill" class="h-full bg-gradient-to-r from-blue-600 via-indigo-600 to-emerald-500 rounded-full transition-all duration-300 w-0"></div>
                </div>
                <span id="answered-counter-text" class="text-slate-700 font-mono font-bold shrink-0">
                  0 / {totalQuestions} Answered
                </span>
              </div>
              <div class="hidden sm:flex items-center gap-4 text-[11px] font-semibold">
                <span class="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200">
                  <span class="w-2 h-2 rounded-full bg-emerald-500"></span> Answered: <strong id="stat-answered" class="text-emerald-900 ml-0.5">0</strong>
                </span>
                <span class="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200">
                  <span class="w-2 h-2 rounded-full bg-amber-500"></span> Flagged: <strong id="stat-flagged" class="text-amber-900 ml-0.5">0</strong>
                </span>
                <span class="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                  <span class="w-2 h-2 rounded-full bg-slate-400"></span> Remaining: <strong id="stat-unanswered" class="text-slate-900 ml-0.5">{totalQuestions}</strong>
                </span>
              </div>
            </div>
          </div>
        </header>

        {/* ==================================================================== */}
        {/* MAIN STAGE: TWO-COLUMN CBT ENVIRONMENT                                */}
        {/* ==================================================================== */}
        <main class="flex-1 max-w-7xl mx-auto w-full px-4 py-6 sm:py-8">
          <form id="exam-form" action={`/api/exams/${examId}/submit`} method="post">
            <div class="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              
              {/* LEFT COLUMN: QUESTION STREAM (col-span-8) */}
              <div class="lg:col-span-8 space-y-6" id="questions-container">
                {questions.map((q: any, idx: number) => {
                  const qType = q.question_type || "mcq";
                  let optData: any = {};
                  try { optData = q.options_json ? JSON.parse(q.options_json) : {}; } catch { optData = {}; }

                  let rawOptions: any[] = [];
                  if (Array.isArray(optData)) {
                    rawOptions = optData;
                  } else if (Array.isArray(optData.options)) {
                    rawOptions = optData.options;
                  }

                  return (
                    <article 
                      id={`qcard-${idx}`} 
                      data-qidx={idx} 
                      data-qid={q.id}
                      class="question-card bg-white rounded-2xl sm:rounded-3xl border border-slate-200/90 p-6 sm:p-8 shadow-sm hover:shadow-md transition-all duration-200 relative group"
                    >
                      {/* Flag Ribbon Indicator (active via JS) */}
                      <div class="flag-indicator hidden absolute -top-2.5 -right-2 bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider shadow-md flex items-center gap-1 z-10 border border-amber-300">
                        <span>⭐</span> Flagged for Review
                      </div>

                      {/* Question Card Top Bar */}
                      <div class="flex flex-wrap items-center justify-between gap-3 pb-4 mb-5 border-b border-slate-100">
                        <div class="flex items-center gap-2.5 flex-wrap">
                          <span class="w-8 h-8 rounded-xl bg-blue-600 text-white font-black text-xs flex items-center justify-center shadow-xs">
                            {idx + 1}
                          </span>
                          <span class="text-xs font-bold text-slate-600">
                            Question {idx + 1} of {totalQuestions}
                          </span>
                          <span class="text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 border border-slate-200">
                            {qType === "mcq" && "Multiple Choice (5 Options A-E)"}
                            {qType === "multi_select" && "Multiple Answers (Checkboxes)"}
                            {qType === "true_false" && "True / False"}
                            {qType === "fill_blank" && "Fill in the Blank"}
                            {qType === "column_mapping" && "Column Mapping"}
                            {qType === "numerical" && "Numerical Calculation"}
                            {qType === "short_answer" && "Short Question"}
                            {qType === "long_answer" && "Long Essay"}
                            {qType === "non_verbal" && (
                              optData.sub_type === "analogy" ? "Non-Verbal: Analogy (تشبیہ)" :
                              optData.sub_type === "matrix" ? `Non-Verbal: Matrix (${optData.matrix_grid || "2x2"})` :
                              optData.sub_type === "odd_one_out" ? "Non-Verbal: Odd One Out (مختلف شکل)" :
                              "Non-Verbal: Series (تسلسل)"
                            )}
                            {qType === "verbal_reasoning" && (
                              optData.sub_type === "analogy" ? "Verbal: Analogy (الفاظ کی تشبیہ)" :
                              optData.sub_type === "series" ? "Verbal: Sequence (تسلسل)" :
                              optData.sub_type === "odd_one_out" ? "Verbal: Odd Word Out (غیر متعلق لفظ)" :
                              optData.sub_type === "coding" ? "Verbal: Coding & Decoding (کوڈنگ)" :
                              "Verbal: Blood Relations & Kinship"
                            )}
                          </span>
                        </div>

                        {/* Top-Right Tools: Flag Button & Marks */}
                        <div class="flex items-center gap-2">
                          <button 
                            type="button" 
                            data-action="toggle-flag" 
                            data-idx={idx}
                            class="flag-btn text-xs font-bold text-slate-600 hover:text-amber-700 px-3 py-1.5 rounded-xl bg-slate-50 hover:bg-amber-50 border border-slate-200 transition flex items-center gap-1.5 shadow-2xs cursor-pointer"
                          >
                            <span>⭐</span>
                            <span class="flag-label">Flag</span>
                          </button>
                          <button 
                            type="button" 
                            data-action="clear-answer" 
                            data-idx={idx}
                            data-qid={q.id}
                            class="text-xs font-bold text-slate-500 hover:text-rose-600 hover:bg-rose-50 px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200 transition shadow-2xs cursor-pointer"
                            title="Clear answer for this question"
                          >
                            Clear
                          </button>
                          <span class="text-xs font-mono font-bold bg-blue-50 text-blue-700 border border-blue-200 px-3 py-1.5 rounded-xl shadow-2xs">
                            {q.marks} Mark{q.marks > 1 ? 's' : ''}
                          </span>
                        </div>
                      </div>

                      {/* Question Statement (High Contrast, KaTeX & Urdu Nastaliq) */}
                      {(() => {
                        const isRtl = isRTLText(q.question_text);
                        const isUrdu = isUrduText(q.question_text);
                        const fontClass = isRtl 
                          ? (isUrdu ? 'font-urdu text-right text-xl font-normal leading-loose' : 'font-arabic text-right text-lg font-bold leading-relaxed') 
                          : 'text-base sm:text-lg font-semibold leading-relaxed';
                        return (
                          <div 
                            dir="auto" 
                            class={`text-slate-900 mb-6 ${fontClass}`}
                          >
                            {renderRichText(q.question_text)}
                          </div>
                        );
                      })()}

                      {/* ==================================================== */}
                      {/* 1. MCQ (5 OPTIONS A-E SUPPORT)                       */}
                      {/* ==================================================== */}
                      {qType === "mcq" && (
                        <div class="space-y-3 pt-1">
                          {rawOptions.map((opt: any, oIdx: number) => {
                            const optLetter = String.fromCharCode(65 + oIdx);
                            const isOptRtl = isRTLText(opt.text);
                            const isOptUrdu = isUrduText(opt.text);
                            const optFontClass = isOptRtl 
                              ? (isOptUrdu ? 'font-urdu text-right text-lg' : 'font-arabic text-right text-sm font-semibold') 
                              : 'text-sm font-medium';
                            return (
                              <label 
                                dir="auto" 
                                class="option-label flex items-center gap-3.5 p-4 rounded-xl border-2 border-slate-200 bg-white hover:bg-blue-50/50 hover:border-blue-400 cursor-pointer transition select-none group shadow-2xs"
                              >
                                <input 
                                  type="radio" 
                                  name={`question_${q.id}`} 
                                  value={opt.id} 
                                  class="w-4 h-4 text-blue-600 bg-white border-slate-300 focus:ring-blue-500 shrink-0" 
                                />
                                <span class="option-bubble w-8 h-8 rounded-xl bg-slate-100 border border-slate-200 text-slate-700 font-extrabold text-xs flex items-center justify-center shrink-0 group-hover:bg-blue-600 group-hover:text-white group-hover:border-blue-600 transition shadow-2xs">
                                  {optLetter}
                                </span>
                                <span dir="auto" class={`text-slate-800 group-hover:text-slate-900 flex-1 leading-relaxed ${optFontClass}`}>
                                  {renderRichText(opt.text)}
                                </span>
                              </label>
                            );
                          })}
                        </div>
                      )}

                      {/* ==================================================== */}
                      {/* 2. MULTI-SELECT (CHECKBOXES)                         */}
                      {/* ==================================================== */}
                      {qType === "multi_select" && (
                        <div class="space-y-3 pt-1">
                          <p class="text-xs font-bold text-purple-700 bg-purple-50 border border-purple-200 p-2.5 rounded-xl flex items-center gap-1.5 mb-2">
                            <span>☑️</span>
                            <span>Select all correct statements that apply:</span>
                          </p>
                          {rawOptions.map((opt: any, oIdx: number) => {
                            const optLetter = String.fromCharCode(65 + oIdx);
                            const isOptRtl = isRTLText(opt.text);
                            const isOptUrdu = isUrduText(opt.text);
                            const optFontClass = isOptRtl 
                              ? (isOptUrdu ? 'font-urdu text-right text-lg' : 'font-arabic text-right text-sm font-semibold') 
                              : 'text-sm font-medium';
                            return (
                              <label 
                                dir="auto" 
                                class="option-label flex items-center gap-3.5 p-4 rounded-xl border-2 border-slate-200 bg-white hover:bg-purple-50/50 hover:border-purple-400 cursor-pointer transition select-none group shadow-2xs"
                              >
                                <input 
                                  type="checkbox" 
                                  name={`question_${q.id}`} 
                                  value={opt.id} 
                                  class="w-4 h-4 text-purple-600 bg-white border-slate-300 rounded focus:ring-purple-500 shrink-0" 
                                />
                                <span class="option-bubble w-8 h-8 rounded-xl bg-purple-50 text-purple-700 border border-purple-200 font-extrabold text-xs flex items-center justify-center shrink-0 group-hover:bg-purple-600 group-hover:text-white group-hover:border-purple-600 transition shadow-2xs">
                                  {optLetter}
                                </span>
                                <span dir="auto" class={`text-slate-800 group-hover:text-slate-900 flex-1 leading-relaxed ${optFontClass}`}>
                                  {renderRichText(opt.text)}
                                </span>
                              </label>
                            );
                          })}
                        </div>
                      )}

                      {/* ==================================================== */}
                      {/* 3. TRUE / FALSE                                      */}
                      {/* ==================================================== */}
                      {qType === "true_false" && (
                        <div class="grid grid-cols-2 gap-4 pt-1">
                          <label class="option-label flex items-center justify-center gap-3 p-4 rounded-xl border-2 border-slate-200 bg-white hover:border-emerald-500 hover:bg-emerald-50/60 cursor-pointer transition select-none shadow-2xs">
                            <input type="radio" name={`question_${q.id}`} value="true" class="w-4 h-4 text-emerald-600 bg-white border-slate-300" />
                            <div class="text-center">
                              <span class="font-black text-sm text-emerald-700 block">✓ TRUE / درست</span>
                            </div>
                          </label>
                          <label class="option-label flex items-center justify-center gap-3 p-4 rounded-xl border-2 border-slate-200 bg-white hover:border-rose-500 hover:bg-rose-50/60 cursor-pointer transition select-none shadow-2xs">
                            <input type="radio" name={`question_${q.id}`} value="false" class="w-4 h-4 text-rose-600 bg-white border-slate-300" />
                            <div class="text-center">
                              <span class="font-black text-sm text-rose-700 block">✗ FALSE / غلط</span>
                            </div>
                          </label>
                        </div>
                      )}

                      {/* ==================================================== */}
                      {/* 4. FILL IN THE BLANK                                 */}
                      {/* ==================================================== */}
                      {qType === "fill_blank" && (
                        <div class="pt-1 space-y-2">
                          <label class="block text-xs font-bold uppercase text-slate-500 tracking-wider">
                            Type Your Answer Below:
                          </label>
                          <input 
                            type="text" 
                            name={`question_${q.id}`} 
                            dir="auto"
                            placeholder={optData.placeholder || "Type missing word or phrase / خالی جگہ پر کریں..."} 
                            class="w-full px-4 py-3 rounded-xl border-2 border-slate-200 bg-white text-slate-900 font-semibold text-sm focus:border-blue-600 focus:outline-none shadow-2xs"
                          />
                        </div>
                      )}

                      {/* ==================================================== */}
                      {/* 5. COLUMN MAPPING                                    */}
                      {/* ==================================================== */}
                      {qType === "column_mapping" && (
                        <div class="pt-1 space-y-3">
                          <p class="text-xs font-bold text-indigo-700 bg-indigo-50 border border-indigo-200 p-2.5 rounded-xl">
                            🔄 Match each item in Column A with its corresponding pair in Column B:
                          </p>
                          <div class="grid grid-cols-1 gap-2.5">
                            {(optData.left || []).map((lItem: any, lIdx: number) => (
                              <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-xl border border-slate-200 bg-slate-50/70 shadow-2xs">
                                <div dir="auto" class="flex items-center gap-2.5 text-sm font-semibold text-slate-800">
                                  <span class="w-6 h-6 rounded-md bg-indigo-100 text-indigo-800 border border-indigo-200 font-bold text-xs flex items-center justify-center shrink-0">
                                    {lIdx + 1}
                                  </span>
                                  <span>{renderRichText(lItem.text)}</span>
                                </div>
                                <div class="flex items-center gap-2">
                                  <span class="text-slate-400 text-xs font-bold">&rarr;</span>
                                  <select 
                                    name={`question_${q.id}_match_${lItem.id}`} 
                                    class="px-3.5 py-2 rounded-xl bg-white border border-slate-300 text-xs font-semibold text-slate-800 focus:ring-2 focus:ring-indigo-500 min-w-[200px] shadow-2xs"
                                  >
                                    <option value="">-- Choose Match --</option>
                                    {(optData.right || []).map((rItem: any, rIdx: number) => (
                                      <option value={rItem.id}>
                                        {String.fromCharCode(65 + rIdx)}: {rItem.text}
                                      </option>
                                    ))}
                                  </select>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* ==================================================== */}
                      {/* 6. NUMERICAL                                         */}
                      {/* ==================================================== */}
                      {qType === "numerical" && (
                        <div class="pt-1 space-y-2">
                          <label class="block text-xs font-bold uppercase text-slate-500 tracking-wider">
                            Calculated Numeric Value {optData.unit ? `(${optData.unit})` : ""}:
                          </label>
                          <div class="flex items-center gap-3">
                            <input 
                              type="number" 
                              step="any" 
                              name={`question_${q.id}`} 
                              placeholder="e.g. 9.8" 
                              class="flex-1 px-4 py-3 rounded-xl border-2 border-slate-200 bg-white font-mono font-bold text-slate-900 text-sm focus:border-blue-600 focus:outline-none shadow-2xs"
                            />
                            {optData.unit && (
                              <span class="px-4 py-3 bg-slate-100 border border-slate-200 rounded-xl font-mono text-sm font-bold text-slate-700 shadow-2xs">
                                {optData.unit}
                              </span>
                            )}
                          </div>
                        </div>
                      )}

                      {/* ==================================================== */}
                      {/* 7. SHORT ANSWER                                      */}
                      {/* ==================================================== */}
                      {qType === "short_answer" && (
                        <div class="pt-1 space-y-2">
                          <label class="block text-xs font-bold uppercase text-slate-500 tracking-wider">
                            Short Response:
                          </label>
                          <textarea 
                            name={`question_${q.id}`} 
                            rows={3} 
                            dir="auto"
                            placeholder="Write a concise 1-2 sentence response / مختصر جواب تحریر کریں..." 
                            class="w-full px-4 py-3 rounded-xl border-2 border-slate-200 bg-white font-medium text-slate-900 text-sm focus:border-blue-600 focus:outline-none leading-relaxed shadow-2xs"
                          />
                        </div>
                      )}

                      {/* ==================================================== */}
                      {/* 8. LONG ANSWER / ESSAY                               */}
                      {/* ==================================================== */}
                      {qType === "long_answer" && (
                        <div class="pt-1 space-y-2">
                          <div class="flex items-center justify-between">
                            <label class="block text-xs font-bold uppercase text-slate-500 tracking-wider">
                              Comprehensive Response & Derivation:
                            </label>
                            {optData.min_words && (
                              <span class="text-[11px] text-slate-500 font-medium">
                                Target: {optData.min_words}+ words
                              </span>
                            )}
                          </div>
                          <textarea 
                            name={`question_${q.id}`} 
                            rows={6} 
                            dir="auto"
                            placeholder="Write your comprehensive analysis, mathematical derivations, or essay here / تفصیلی جواب یا ثبوت یہاں درج کریں..." 
                            class="w-full px-4 py-3 rounded-xl border-2 border-slate-200 bg-white font-sans text-slate-900 text-sm focus:border-blue-600 focus:outline-none leading-relaxed shadow-2xs"
                          />
                        </div>
                      )}

                      {/* ==================================================== */}
                      {/* 9. NON-VERBAL INTELLIGENCE (AUTHENTIC CLEAN RENDERING) */}
                      {/* ==================================================== */}
                      {qType === "non_verbal" && (
                        <div class="pt-2 space-y-4">
                          
                          {/* SUBTYPE 1: SERIES */}
                          {(!optData.sub_type || optData.sub_type === "series") && (
                            <div class="p-4 sm:p-5 rounded-2xl bg-amber-50/50 border border-amber-200 space-y-3">
                              <span class="text-[11px] font-black uppercase tracking-wider text-amber-900 block">
                                Problem Sequence Strip (Left to Right Transformation):
                              </span>
                              <div class="flex items-center gap-2.5 sm:gap-4 overflow-x-auto pb-2 pt-1">
                                {(Array.isArray(optData.problem_images) ? optData.problem_images : []).map((imgUrl: string, pIdx: number) => (
                                  <div class="flex items-center gap-2 sm:gap-3 shrink-0">
                                    <div class="flex flex-col items-center">
                                      <span class="text-[10px] font-bold text-slate-500 mb-1">Figure {pIdx + 1}</span>
                                      <div class="w-20 h-20 sm:w-24 sm:h-24 rounded-xl border border-slate-200 bg-white p-2 flex items-center justify-center shadow-xs">
                                        {imgUrl ? (
                                          <img src={imgUrl} alt={`Problem ${pIdx + 1}`} class="max-h-full max-w-full object-contain" />
                                        ) : (
                                          <span class="text-xs text-slate-400 font-bold">Fig {pIdx + 1}</span>
                                        )}
                                      </div>
                                    </div>
                                    {pIdx < (optData.problem_images || []).length - 1 && (
                                      <span class="text-slate-400 font-bold text-lg select-none">&rarr;</span>
                                    )}
                                  </div>
                                ))}
                                <span class="text-amber-600 font-black text-xl select-none">&rarr;</span>
                                <div class="flex flex-col items-center shrink-0">
                                  <span class="text-[10px] font-bold text-amber-800 mb-1">Next (?)</span>
                                  <div class="w-20 h-20 sm:w-24 sm:h-24 rounded-xl border-2 border-dashed border-amber-500 bg-amber-100/60 flex flex-col items-center justify-center text-amber-700 animate-pulse">
                                    <span class="text-2xl font-black">?</span>
                                    <span class="text-[9px] font-bold text-amber-800">Missing</span>
                                  </div>
                                </div>
                              </div>
                            </div>
                          )}

                          {/* SUBTYPE 2: ANALOGY */}
                          {optData.sub_type === "analogy" && (
                            <div class="p-4 sm:p-5 rounded-2xl bg-indigo-50/50 border border-indigo-200 space-y-3">
                              <span class="text-[11px] font-black uppercase tracking-wider text-indigo-900 block">
                                Figure Analogy: Figure A is to Figure B as Figure C is to (?)
                              </span>
                              <div class="flex flex-col sm:flex-row items-center justify-center gap-4 py-2">
                                <div class="p-3.5 rounded-2xl border border-indigo-200 bg-white shadow-xs">
                                  <span class="text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded bg-indigo-50 text-indigo-800 block mb-2 text-center border border-indigo-100">
                                    Given Pair (دیا گیا تعلق)
                                  </span>
                                  <div class="flex items-center gap-3">
                                    <div class="flex flex-col items-center">
                                      <span class="text-[10px] font-bold text-slate-500 mb-1">Fig A</span>
                                      <div class="w-20 h-20 rounded-xl border border-slate-200 bg-slate-50/50 p-1.5 flex items-center justify-center">
                                        {optData.problem_images?.[0] ? (
                                          <img src={optData.problem_images[0]} alt="Fig A" class="max-h-full max-w-full object-contain" />
                                        ) : (<span class="text-xs text-slate-400">A</span>)}
                                      </div>
                                    </div>
                                    <span class="text-xl font-black text-indigo-600">:</span>
                                    <div class="flex flex-col items-center">
                                      <span class="text-[10px] font-bold text-slate-500 mb-1">Fig B</span>
                                      <div class="w-20 h-20 rounded-xl border border-slate-200 bg-slate-50/50 p-1.5 flex items-center justify-center">
                                        {optData.problem_images?.[1] ? (
                                          <img src={optData.problem_images[1]} alt="Fig B" class="max-h-full max-w-full object-contain" />
                                        ) : (<span class="text-xs text-slate-400">B</span>)}
                                      </div>
                                    </div>
                                  </div>
                                </div>

                                <div class="flex flex-col items-center px-3 py-1.5 rounded-xl bg-indigo-600 text-white shadow-xs shrink-0 font-black">
                                  <span class="text-xl leading-none">::</span>
                                  <span class="text-[9px] uppercase">AS</span>
                                </div>

                                <div class="p-3.5 rounded-2xl border border-amber-200 bg-white shadow-xs">
                                  <span class="text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded bg-amber-50 text-amber-800 block mb-2 text-center border border-amber-100">
                                    Target Pair (حل طلب تعلق)
                                  </span>
                                  <div class="flex items-center gap-3">
                                    <div class="flex flex-col items-center">
                                      <span class="text-[10px] font-bold text-slate-500 mb-1">Fig C</span>
                                      <div class="w-20 h-20 rounded-xl border border-slate-200 bg-slate-50/50 p-1.5 flex items-center justify-center">
                                        {optData.problem_images?.[2] ? (
                                          <img src={optData.problem_images[2]} alt="Fig C" class="max-h-full max-w-full object-contain" />
                                        ) : (<span class="text-xs text-slate-400">C</span>)}
                                      </div>
                                    </div>
                                    <span class="text-xl font-black text-amber-600">:</span>
                                    <div class="flex flex-col items-center">
                                      <span class="text-[10px] font-bold text-amber-800 mb-1">Fig D (?)</span>
                                      <div class="w-20 h-20 rounded-xl border-2 border-dashed border-amber-500 bg-amber-100/60 flex flex-col items-center justify-center text-amber-700 animate-pulse">
                                        <span class="text-2xl font-black">?</span>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>
                          )}

                          {/* SUBTYPE 3: MATRIX */}
                          {optData.sub_type === "matrix" && (
                            <div class="p-4 sm:p-5 rounded-2xl bg-teal-50/50 border border-teal-200 space-y-3">
                              <span class="text-[11px] font-black uppercase tracking-wider text-teal-900 block text-center">
                                Pattern Matrix ({optData.matrix_grid === "3x3" ? "3 × 3 Grid" : "2 × 2 Grid"}):
                              </span>
                              {optData.matrix_grid === "3x3" ? (
                                <div class="grid grid-cols-3 gap-2.5 max-w-xs mx-auto p-3.5 bg-white border border-slate-200 rounded-2xl shadow-xs">
                                  {Array.from({ length: 8 }).map((_, cIdx) => {
                                    const cellUrl = (Array.isArray(optData.problem_images) ? optData.problem_images : [])[cIdx] || "";
                                    return (
                                      <div class="w-20 h-20 rounded-xl border border-slate-200 bg-slate-50/60 p-1.5 flex items-center justify-center overflow-hidden">
                                        {cellUrl ? (
                                          <img src={cellUrl} alt={`Cell ${cIdx + 1}`} class="max-h-full max-w-full object-contain" />
                                        ) : (<span class="text-[10px] text-slate-400 font-bold">{cIdx + 1}</span>)}
                                      </div>
                                    );
                                  })}
                                  <div class="w-20 h-20 rounded-xl border-2 border-dashed border-amber-500 bg-amber-100/60 flex flex-col items-center justify-center text-amber-700 animate-pulse">
                                    <span class="text-2xl font-black">?</span>
                                  </div>
                                </div>
                              ) : (
                                <div class="grid grid-cols-2 gap-3 max-w-xs mx-auto p-3.5 bg-white border border-slate-200 rounded-2xl shadow-xs">
                                  {Array.from({ length: 3 }).map((_, cIdx) => {
                                    const cellUrl = (Array.isArray(optData.problem_images) ? optData.problem_images : [])[cIdx] || "";
                                    return (
                                      <div class="w-24 h-24 rounded-xl border border-slate-200 bg-slate-50/60 p-2 flex items-center justify-center overflow-hidden">
                                        {cellUrl ? (
                                          <img src={cellUrl} alt={`Cell ${cIdx + 1}`} class="max-h-full max-w-full object-contain" />
                                        ) : (<span class="text-xs text-slate-400 font-bold">{cIdx + 1}</span>)}
                                      </div>
                                    );
                                  })}
                                  <div class="w-24 h-24 rounded-xl border-2 border-dashed border-amber-500 bg-amber-100/60 flex flex-col items-center justify-center text-amber-700 animate-pulse">
                                    <span class="text-3xl font-black">?</span>
                                  </div>
                                </div>
                              )}
                            </div>
                          )}

                          {/* SUBTYPE 4: ODD ONE OUT NOTICE */}
                          {optData.sub_type === "odd_one_out" && (
                            <div class="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 flex items-center gap-2 text-rose-900 text-xs font-semibold">
                              <span class="text-base">⭐</span>
                              <span>
                                <strong>مختلف شکل کی نشاندہی کریں:</strong> Four figures below share a geometric or spatial property. Select the ONE figure that is the Odd One Out (5 Options A-E).
                              </span>
                            </div>
                          )}

                          {/* 5-Option Figure Grid (A-E) */}
                          <div class="space-y-2 pt-2">
                            <label class="block text-xs font-black uppercase text-slate-600 tracking-wider">
                              {optData.sub_type === "odd_one_out"
                                ? "Select The Odd One Out / مختلف شکل کا انتخاب کریں (A-E):"
                                : "Select The Correct Answer Figure / درست جواب چنیں (A-E):"}
                            </label>
                            <div class="grid grid-cols-2 sm:grid-cols-5 gap-3">
                              {(Array.isArray(optData.options) ? optData.options : []).map((opt: any, oIdx: number) => {
                                const optLetter = opt.label || String.fromCharCode(65 + oIdx);
                                return (
                                  <label class="option-label relative flex flex-col items-center p-3 rounded-2xl border-2 border-slate-200 bg-white hover:border-blue-500 hover:bg-blue-50/30 cursor-pointer transition group shadow-2xs">
                                    <div class="w-full flex items-center justify-between mb-2">
                                      <span class="option-bubble w-7 h-7 rounded-lg bg-slate-100 border border-slate-200 text-slate-700 font-black text-xs flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white group-hover:border-blue-600 transition">
                                        {optLetter}
                                      </span>
                                      <input 
                                        type="radio" 
                                        name={`question_${q.id}`} 
                                        value={opt.id} 
                                        class="w-4 h-4 text-blue-600 bg-white border-slate-300 focus:ring-blue-500" 
                                      />
                                    </div>
                                    <div class="w-full h-24 sm:h-28 rounded-xl border border-slate-200 bg-slate-50/60 p-2 flex items-center justify-center mb-2 overflow-hidden">
                                      {opt.image_url ? (
                                        <img src={opt.image_url} alt={optLetter} class="max-h-full max-w-full object-contain" />
                                      ) : (
                                        <span class="text-xs text-slate-400 font-medium">Figure {optLetter}</span>
                                      )}
                                    </div>
                                    {opt.text && (
                                      <span class="text-[11px] font-semibold text-slate-600 text-center leading-tight truncate w-full">
                                        {opt.text}
                                      </span>
                                    )}
                                  </label>
                                );
                              })}
                            </div>
                          </div>
                        </div>
                      )}

                      {/* ==================================================== */}
                      {/* 10. VERBAL REASONING (5 OPTIONS A-E SUPPORT)         */}
                      {/* ==================================================== */}
                      {qType === "verbal_reasoning" && (
                        <div class="pt-2 space-y-4">
                          
                          {/* SUBTYPE 1: ANALOGY */}
                          {optData.sub_type === "analogy" && (
                            <div class="p-4 sm:p-5 rounded-2xl bg-teal-50/50 border border-teal-200 space-y-3">
                              <span class="text-[11px] font-black uppercase tracking-wider text-teal-900 block">
                                Analogy Transformation (Pair 1 :: Pair 2):
                              </span>
                              <div class="flex flex-col sm:flex-row items-center justify-between gap-3 pt-1">
                                <div class="flex-1 w-full p-3.5 rounded-xl bg-white border border-slate-200 text-center shadow-xs">
                                  <span class="text-[10px] font-black uppercase tracking-wider text-teal-700 block mb-1">
                                    Established Pair
                                  </span>
                                  <div class="flex items-center justify-center gap-2 text-base font-black text-slate-900">
                                    <span>{optData.pair1_left}</span>
                                    <span class="text-teal-600">:</span>
                                    <span>{optData.pair1_right}</span>
                                  </div>
                                </div>
                                <div class="px-3 py-1.5 rounded-xl bg-teal-600 text-white font-black text-xs shrink-0 shadow-2xs">
                                  :: AS
                                </div>
                                <div class="flex-1 w-full p-3.5 rounded-xl bg-amber-50/70 border border-amber-200 text-center shadow-xs">
                                  <span class="text-[10px] font-black uppercase tracking-wider text-amber-800 block mb-1">
                                    Target Pair
                                  </span>
                                  <div class="flex items-center justify-center gap-2 text-base font-black text-slate-900">
                                    <span>{optData.pair2_left}</span>
                                    <span class="text-amber-600">:</span>
                                    <span class="text-amber-800 bg-amber-100 px-2.5 py-0.5 rounded border border-amber-300 font-mono text-sm animate-pulse">
                                      [ ? ]
                                    </span>
                                  </div>
                                </div>
                              </div>
                            </div>
                          )}

                          {/* SUBTYPE 2: SERIES */}
                          {optData.sub_type === "series" && (
                            <div class="p-4 sm:p-5 rounded-2xl bg-teal-50/50 border border-teal-200 space-y-3">
                              <span class="text-[11px] font-black uppercase tracking-wider text-teal-900 block">
                                Sequence Progression Strip:
                              </span>
                              <div class="flex items-center gap-2 sm:gap-3 overflow-x-auto pb-2 pt-1">
                                {(Array.isArray(optData.series_tokens) ? optData.series_tokens : []).map((token: string, sIdx: number) => (
                                  <div class="flex items-center gap-2 sm:gap-3 shrink-0">
                                    <div class="flex flex-col items-center">
                                      <span class="text-[10px] font-bold text-slate-500 mb-1">Term {sIdx + 1}</span>
                                      <div class="px-4 py-2.5 rounded-xl border border-slate-200 bg-white font-mono font-black text-base text-slate-800 min-w-[50px] text-center shadow-xs">
                                        {token}
                                      </div>
                                    </div>
                                    <span class="text-slate-400 font-bold text-lg select-none">&rarr;</span>
                                  </div>
                                ))}
                                <div class="flex flex-col items-center shrink-0">
                                  <span class="text-[10px] font-bold text-amber-800 mb-1">Target (?)</span>
                                  <div class="px-4 py-2.5 rounded-xl border-2 border-dashed border-amber-500 bg-amber-100/60 text-amber-800 font-mono font-black text-base animate-pulse">
                                    ? Target
                                  </div>
                                </div>
                              </div>
                            </div>
                          )}

                          {/* SUBTYPE 3: ODD ONE OUT NOTICE */}
                          {optData.sub_type === "odd_one_out" && (
                            <div class="p-3.5 rounded-2xl bg-amber-50 border border-amber-200 flex items-center gap-2 text-amber-900 text-xs font-semibold">
                              <span class="text-base">⭐</span>
                              <span>
                                <strong>غیر متعلق لفظ کی نشاندہی کریں:</strong> Four terms belong to a shared grammatical or semantic class. Pick the ONE term that does not belong (5 Options A-E).
                              </span>
                            </div>
                          )}

                          {/* SUBTYPE 4: CODING */}
                          {optData.sub_type === "coding" && (
                            <div class="p-4 sm:p-5 rounded-2xl bg-teal-50/50 border border-teal-200 space-y-3 font-mono">
                              <span class="text-[11px] font-black uppercase tracking-wider text-teal-900 block font-sans">
                                Coding Transformation Rule:
                              </span>
                              <div class="flex flex-col sm:flex-row items-center justify-between gap-3 pt-1">
                                <div class="flex-1 w-full p-3.5 rounded-xl bg-white border border-slate-200 text-center shadow-xs">
                                  <span class="text-[10px] font-black uppercase tracking-wider text-teal-700 block mb-1 font-sans">
                                    Exemplar Code
                                  </span>
                                  <div class="flex items-center justify-center gap-2 text-base font-black text-slate-900">
                                    <span>{optData.source_word}</span>
                                    <span class="text-teal-600 font-sans">&rarr;</span>
                                    <span class="text-teal-800">{optData.coded_word}</span>
                                  </div>
                                </div>
                                <div class="px-3 py-1.5 rounded-xl bg-teal-600 text-white font-black text-xs shrink-0 font-sans shadow-2xs">
                                  :: AS
                                </div>
                                <div class="flex-1 w-full p-3.5 rounded-xl bg-amber-50/70 border border-amber-200 text-center shadow-xs">
                                  <span class="text-[10px] font-black uppercase tracking-wider text-amber-800 block mb-1 font-sans">
                                    Target Word
                                  </span>
                                  <div class="flex items-center justify-center gap-2 text-base font-black text-slate-900">
                                    <span>{optData.target_word}</span>
                                    <span class="text-amber-600 font-sans">&rarr;</span>
                                    <span class="text-amber-800 bg-amber-100 px-2.5 py-0.5 rounded border border-amber-300 text-sm animate-pulse">
                                      [ ? ]
                                    </span>
                                  </div>
                                </div>
                              </div>
                            </div>
                          )}

                          {/* SUBTYPE 5: BLOOD RELATIONS */}
                          {optData.sub_type === "blood_relations" && (
                            <div class="p-4 sm:p-5 rounded-2xl bg-teal-50/50 border border-teal-200 space-y-3">
                              <span class="text-[11px] font-black uppercase tracking-wider text-teal-900 block">
                                Kinship Logic Clues:
                              </span>
                              {optData.premise && (
                                <div class="p-3.5 bg-white rounded-xl border border-slate-200 text-xs font-semibold text-slate-800 leading-relaxed shadow-xs">
                                  {optData.premise}
                                </div>
                              )}
                              {Array.isArray(optData.clues) && optData.clues.length > 0 && (
                                <div class="space-y-1.5 pt-1">
                                  {optData.clues.map((clue: string, cIdx: number) => (
                                    <div class="flex items-center gap-2 text-xs text-slate-800 bg-white px-3 py-1.5 rounded-lg border border-slate-200 font-medium shadow-2xs">
                                      <span class="w-4 h-4 rounded-full bg-teal-100 text-teal-800 text-[10px] font-bold flex items-center justify-center shrink-0">
                                        {cIdx + 1}
                                      </span>
                                      <span>{clue}</span>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          )}

                          {/* 5-Option Grid (A-E) for Verbal Reasoning */}
                          <div class="space-y-2 pt-1">
                            <label class="block text-xs font-black uppercase text-slate-600 tracking-wider">
                              {optData.sub_type === "odd_one_out"
                                ? "Select The Odd One Out / مختلف لفظ کا انتخاب کریں (5 Options A-E):"
                                : "Select The Correct Answer / درست جواب چنیں (5 Options A-E):"}
                            </label>
                            <div class="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                              {(Array.isArray(optData.options) ? optData.options : []).map((opt: any, oIdx: number) => {
                                const optLetter = opt.label || String.fromCharCode(65 + oIdx);
                                return (
                                  <label class="option-label flex items-center gap-3 p-3.5 rounded-xl border-2 border-slate-200 bg-white hover:border-blue-500 hover:bg-blue-50/30 cursor-pointer transition select-none group shadow-2xs">
                                    <input 
                                      type="radio" 
                                      name={`question_${q.id}`} 
                                      value={opt.id} 
                                      class="w-4 h-4 text-blue-600 bg-white border-slate-300 focus:ring-blue-500 shrink-0" 
                                    />
                                    <span class="option-bubble w-7 h-7 rounded-lg bg-slate-100 border border-slate-200 text-slate-700 font-black text-xs flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white group-hover:border-blue-600 transition shrink-0">
                                      {optLetter}
                                    </span>
                                    <span class="text-sm font-bold text-slate-800 flex-1 leading-relaxed">
                                      {opt.text}
                                    </span>
                                  </label>
                                );
                              })}
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Card Footer: Navigation Jump Buttons */}
                      <div class="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between text-xs">
                        {idx > 0 ? (
                          <button 
                            type="button" 
                            data-action="scroll-to" 
                            data-target={`qcard-${idx - 1}`}
                            class="text-slate-600 hover:text-slate-900 font-bold flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 transition shadow-2xs cursor-pointer"
                          >
                            <span>&larr;</span> Previous (Q{idx})
                          </button>
                        ) : (<div></div>)}
                        {idx < totalQuestions - 1 ? (
                          <button 
                            type="button" 
                            data-action="scroll-to" 
                            data-target={`qcard-${idx + 1}`}
                            class="text-blue-700 hover:text-blue-800 font-bold flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-blue-200 bg-blue-50/60 hover:bg-blue-100/60 transition shadow-2xs cursor-pointer"
                          >
                            Next (Q{idx + 2}) <span>&rarr;</span>
                          </button>
                        ) : (
                          <button 
                            type="button" 
                            id="bottom-submit-trigger"
                            class="bg-gradient-to-r from-blue-700 to-indigo-700 hover:from-blue-800 hover:to-indigo-800 text-white font-extrabold px-5 py-2.5 rounded-xl transition shadow-sm cursor-pointer"
                          >
                            Review & Submit Exam &rarr;
                          </button>
                        )}
                      </div>

                    </article>
                  );
                })}
              </div>

              {/* RIGHT COLUMN: QUESTION PALETTE / NAVIGATOR TRAY (col-span-4) */}
              <div class="lg:col-span-4 sticky top-28 space-y-4">
                
                {/* Palette Box */}
                <div class="bg-white rounded-3xl border border-slate-200/90 p-5 shadow-sm">
                  
                  <div class="flex items-center justify-between mb-3.5">
                    <div>
                      <h3 class="text-sm font-black text-slate-900 uppercase tracking-wider flex items-center gap-2 font-heading">
                        <span>📑</span> Question Palette
                      </h3>
                      <p class="text-[11px] text-slate-500 font-medium">Click any number to jump directly</p>
                    </div>
                    <span class="text-xs font-mono font-bold bg-blue-50 text-blue-700 border border-blue-200 px-2.5 py-1 rounded-xl">
                      {totalQuestions} Qs
                    </span>
                  </div>

                  {/* Filter Pills */}
                  <div class="flex items-center gap-1.5 mb-4 p-1 rounded-xl bg-slate-100 border border-slate-200 text-[11px]">
                    <button type="button" data-filter="all" class="palette-filter-btn flex-1 py-1 rounded-lg font-bold text-center bg-slate-900 text-white transition shadow-2xs cursor-pointer">
                      All ({totalQuestions})
                    </button>
                    <button type="button" data-filter="unanswered" class="palette-filter-btn flex-1 py-1 rounded-lg font-medium text-center text-slate-600 hover:text-slate-900 transition cursor-pointer">
                      Left
                    </button>
                    <button type="button" data-filter="flagged" class="palette-filter-btn flex-1 py-1 rounded-lg font-medium text-center text-slate-600 hover:text-slate-900 transition cursor-pointer">
                      Flagged
                    </button>
                  </div>

                  {/* 5-Column Grid of Numbered Buttons */}
                  <div class="grid grid-cols-5 gap-2 max-h-[360px] overflow-y-auto pr-1" id="palette-grid">
                    {questions.map((_: any, idx: number) => (
                      <button 
                        type="button" 
                        id={`palette-btn-${idx}`}
                        data-action="scroll-to" 
                        data-target={`qcard-${idx}`}
                        data-idx={idx}
                        class="palette-num-btn h-10 rounded-xl bg-slate-100 text-slate-700 hover:bg-slate-200 font-bold text-xs flex items-center justify-center transition border border-slate-200 relative group cursor-pointer"
                      >
                        <span>{idx + 1}</span>
                        <span class="flag-dot hidden absolute top-1 right-1 w-2 h-2 rounded-full bg-amber-400"></span>
                      </button>
                    ))}
                  </div>

                  {/* Quick Action: Next Unanswered */}
                  <div class="mt-4 pt-4 border-t border-slate-100 space-y-2">
                    <button 
                      type="button" 
                      id="jump-next-unanswered-btn"
                      class="w-full bg-slate-50 hover:bg-slate-100 text-slate-800 font-bold text-xs py-2.5 rounded-xl transition flex items-center justify-center gap-2 border border-slate-200 shadow-2xs cursor-pointer"
                    >
                      <span>⚡ Jump to Next Unanswered</span>
                    </button>
                    <button 
                      type="button" 
                      id="sidebar-finish-btn"
                      class="w-full bg-gradient-to-r from-blue-700 to-indigo-700 hover:from-blue-800 hover:to-indigo-800 text-white font-extrabold text-xs py-3 rounded-xl transition shadow-md shadow-blue-700/20 flex items-center justify-center gap-2 cursor-pointer active:scale-95"
                    >
                      <span>Final Submit Examination &rarr;</span>
                    </button>
                  </div>

                  {/* Palette Color Legend */}
                  <div class="mt-4 pt-3 border-t border-slate-100 grid grid-cols-3 gap-2 text-[10px] text-slate-600 font-medium">
                    <div class="flex items-center gap-1.5">
                      <span class="w-3 h-3 rounded-md bg-emerald-600"></span> Answered
                    </div>
                    <div class="flex items-center gap-1.5">
                      <span class="w-3 h-3 rounded-md bg-amber-400"></span> Flagged
                    </div>
                    <div class="flex items-center gap-1.5">
                      <span class="w-3 h-3 rounded-md bg-slate-100 border border-slate-300"></span> Left
                    </div>
                  </div>

                </div>

                {/* Candidate & Autosave Card */}
                <div class="bg-emerald-50/70 rounded-2xl border border-emerald-200 p-4 text-xs space-y-2">
                  <div class="flex items-center justify-between text-slate-600">
                    <span class="flex items-center gap-1.5 text-emerald-800 font-bold">
                      <span class="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
                      Autosave Active
                    </span>
                    <span class="font-mono text-[10px] text-emerald-700" id="autosave-time">Synced</span>
                  </div>
                  <p class="text-[11px] text-slate-600 leading-relaxed font-medium">
                    Your answers are saved in real-time to your local browser storage. If your session or power disconnects, your responses will be restored.
                  </p>
                </div>

              </div>

            </div>
          </form>
        </main>

        {/* ==================================================================== */}
        {/* SUBMIT CONFIRMATION MODAL OVERLAY (Academic Presentation)            */}
        {/* ==================================================================== */}
        <div id="submit-confirm-modal" class="hidden fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div class="bg-white border border-slate-200 max-w-md w-full rounded-3xl p-6 sm:p-7 shadow-2xl space-y-5 animate-in fade-in zoom-in duration-200">
            
            <div class="text-center space-y-2">
              <div class="w-14 h-14 rounded-2xl bg-blue-50 text-blue-700 border border-blue-200 flex items-center justify-center font-black text-2xl mx-auto shadow-xs">
                📝
              </div>
              <h3 class="text-xl font-black text-slate-900 font-heading">Submit Examination?</h3>
              <p class="text-xs text-slate-500">
                Please review your progress before completing your final submission.
              </p>
            </div>

            {/* Score Readiness Summary */}
            <div class="grid grid-cols-3 gap-2.5 p-4 rounded-2xl bg-slate-50 border border-slate-200 text-center">
              <div class="p-2.5 rounded-xl bg-white border border-slate-200 shadow-2xs">
                <span class="text-[10px] uppercase font-bold text-slate-500 block">Total</span>
                <span class="text-lg font-black text-slate-900 font-mono">{totalQuestions}</span>
              </div>
              <div class="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 shadow-2xs">
                <span class="text-[10px] uppercase font-bold text-emerald-800 block">Answered</span>
                <span class="text-lg font-black text-emerald-700 font-mono" id="modal-stat-answered">0</span>
              </div>
              <div class="p-2.5 rounded-xl bg-amber-50 border border-amber-200 shadow-2xs">
                <span class="text-[10px] uppercase font-bold text-amber-800 block">Left</span>
                <span class="text-lg font-black text-amber-700 font-mono" id="modal-stat-left">{totalQuestions}</span>
              </div>
            </div>

            {/* Warning banner if unanswered questions exist */}
            <div id="modal-unanswered-warning" class="hidden p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-center gap-2.5">
              <span class="text-base shrink-0">⚠️</span>
              <span>You have unanswered questions remaining! Unanswered questions receive zero marks.</span>
            </div>

            {/* Modal Actions */}
            <div class="flex items-center gap-3 pt-2">
              <button 
                type="button" 
                id="close-modal-btn"
                class="flex-1 px-4 py-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition cursor-pointer"
              >
                Return to Exam
              </button>
              <button 
                type="button" 
                id="final-submit-trigger"
                class="flex-1 px-4 py-3 rounded-xl bg-gradient-to-r from-blue-700 to-indigo-700 hover:from-blue-800 hover:to-indigo-800 text-white font-black text-xs transition shadow-md shadow-blue-700/20 cursor-pointer"
              >
                Confirm & Submit
              </button>
            </div>

          </div>
        </div>

      </div>

      {/* ==================================================================== */}
      {/* HIGH-PERFORMANCE CLIENT INTERACTIVITY SCRIPT                         */}
      {/* ==================================================================== */}
      <script dangerouslySetInnerHTML={{ __html: `
        (function() {
          const totalQuestions = ${totalQuestions};
          const examId = "${examId}";
          const storageKey = 'sharp_cbt_draft_' + examId;
          const form = document.getElementById('exam-form');
          const submitModal = document.getElementById('submit-confirm-modal');
          let flaggedSet = new Set();
          let isSubmitting = false;

          // 1. Live Countdown Timer with Academic Alerts
          let totalSeconds = ${exam.duration_minutes * 60};
          const timerBox = document.getElementById('timer-box');
          const timerDot = document.getElementById('timer-dot');
          const timerDisplays = document.querySelectorAll('.timer-display');

          function updateTimer() {
            totalSeconds--;
            if (totalSeconds <= 0) {
              clearInterval(timerInterval);
              alert('Time has expired! Submitting your examination answers automatically.');
              isSubmitting = true;
              form.submit();
              return;
            }

            const mins = Math.floor(totalSeconds / 60);
            const secs = totalSeconds % 60;
            const str = String(mins).padStart(2, '0') + ':' + String(secs).padStart(2, '0');
            timerDisplays.forEach(el => el.textContent = str);

            // Phase 2: Warning (<= 10 mins)
            if (totalSeconds <= 600 && totalSeconds > 180) {
              if (timerBox) {
                timerBox.className = 'hidden sm:flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-50 border-2 border-amber-500 text-amber-800 font-mono font-black text-lg shadow-inner';
              }
              if (timerDot) timerDot.className = 'w-2.5 h-2.5 rounded-full bg-amber-500 animate-ping';
            }
            // Phase 3: Critical Alert (<= 3 mins)
            else if (totalSeconds <= 180) {
              if (timerBox) {
                timerBox.className = 'hidden sm:flex items-center gap-2 px-4 py-2 rounded-xl bg-rose-50 border-2 border-rose-500 text-rose-800 font-mono font-black text-lg shadow-inner animate-pulse';
              }
              if (timerDot) timerDot.className = 'w-2.5 h-2.5 rounded-full bg-rose-600 animate-ping';
            }
          }
          const timerInterval = setInterval(updateTimer, 1000);

          // 2. Real-time Selection Highlight
          function updateSelectedOptionStyles() {
            document.querySelectorAll('.option-label').forEach(label => {
              const input = label.querySelector('input');
              const bubble = label.querySelector('.option-bubble');
              if (input && input.checked) {
                label.classList.add('border-blue-600', 'bg-blue-50/70', 'ring-1', 'ring-blue-500/20');
                label.classList.remove('border-slate-200');
                if (bubble) {
                  bubble.classList.add('bg-blue-600', 'text-white', 'border-blue-600');
                  bubble.classList.remove('bg-slate-100', 'text-slate-700');
                }
              } else if (input) {
                label.classList.remove('border-blue-600', 'bg-blue-50/70', 'ring-1', 'ring-blue-500/20');
                label.classList.add('border-slate-200');
                if (bubble) {
                  bubble.classList.remove('bg-blue-600', 'text-white', 'border-blue-600');
                  bubble.classList.add('bg-slate-100', 'text-slate-700');
                }
              }
            });
          }

          // 3. Real-time Answer Tracking & Palette State Update
          function updateProgressAndPalette() {
            let answeredCount = 0;
            const answeredIndices = new Set();

            const cards = document.querySelectorAll('.question-card');
            cards.forEach((card, idx) => {
              const qid = card.getAttribute('data-qid');
              let isAnswered = false;

              // Check radios
              const radios = card.querySelectorAll('input[type="radio"]:checked');
              if (radios.length > 0) isAnswered = true;

              // Check checkboxes
              const checkboxes = card.querySelectorAll('input[type="checkbox"]:checked');
              if (checkboxes.length > 0) isAnswered = true;

              // Check text/number inputs
              const texts = card.querySelectorAll('input[type="text"], input[type="number"], textarea');
              texts.forEach(t => {
                if (t.value && t.value.trim().length > 0) isAnswered = true;
              });

              // Check selects
              const selects = card.querySelectorAll('select');
              if (selects.length > 0) {
                let allFilled = true;
                selects.forEach(s => { if (!s.value) allFilled = false; });
                if (allFilled) isAnswered = true;
              }

              const btn = document.getElementById('palette-btn-' + idx);
              const isFlagged = flaggedSet.has(idx);

              if (btn) {
                btn.classList.remove(
                  'bg-emerald-600', 'text-white', 'border-emerald-600',
                  'bg-amber-400', 'text-slate-900', 'border-amber-400',
                  'bg-slate-100', 'text-slate-700', 'border-slate-200'
                );
                if (isFlagged && isAnswered) {
                  btn.classList.add('bg-emerald-600', 'text-white', 'border-2', 'border-amber-400', 'font-black');
                } else if (isFlagged) {
                  btn.classList.add('bg-amber-400', 'text-slate-900', 'border-amber-400', 'font-black');
                } else if (isAnswered) {
                  btn.classList.add('bg-emerald-600', 'text-white', 'border-emerald-600', 'font-bold');
                } else {
                  btn.classList.add('bg-slate-100', 'text-slate-700', 'border-slate-200');
                }
              }

              if (isAnswered) {
                answeredCount++;
                answeredIndices.add(idx);
              }
            });

            // Update Option highlight styles
            updateSelectedOptionStyles();

            // Update Header & Stats
            const fill = document.getElementById('progress-bar-fill');
            const pct = Math.round((answeredCount / totalQuestions) * 100);
            if (fill) fill.style.width = pct + '%';

            const counterText = document.getElementById('answered-counter-text');
            if (counterText) counterText.textContent = answeredCount + ' / ' + totalQuestions + ' Answered (' + pct + '%)';

            const statAnswered = document.getElementById('stat-answered');
            if (statAnswered) statAnswered.textContent = answeredCount;

            const statFlagged = document.getElementById('stat-flagged');
            if (statFlagged) statFlagged.textContent = flaggedSet.size;

            const statUnanswered = document.getElementById('stat-unanswered');
            const left = totalQuestions - answeredCount;
            if (statUnanswered) statUnanswered.textContent = left;

            // Modal stats
            const mAns = document.getElementById('modal-stat-answered');
            if (mAns) mAns.textContent = answeredCount;
            const mLeft = document.getElementById('modal-stat-left');
            if (mLeft) mLeft.textContent = left;

            const mWarn = document.getElementById('modal-unanswered-warning');
            if (mWarn) {
              if (left > 0) mWarn.classList.remove('hidden');
              else mWarn.classList.add('hidden');
            }

            // Autosave snapshot
            saveDraft();
          }

          // 4. LocalStorage Autosave Engine
          function saveDraft() {
            try {
              const formData = new FormData(form);
              const draftObj = {
                answers: {},
                flags: Array.from(flaggedSet),
                updatedAt: new Date().toLocaleTimeString()
              };
              for (const [key, val] of formData.entries()) {
                if (draftObj.answers[key]) {
                  if (Array.isArray(draftObj.answers[key])) {
                    draftObj.answers[key].push(val);
                  } else {
                    draftObj.answers[key] = [draftObj.answers[key], val];
                  }
                } else {
                  draftObj.answers[key] = val;
                }
              }
              localStorage.setItem(storageKey, JSON.stringify(draftObj));
              const tEl = document.getElementById('autosave-time');
              if (tEl) tEl.textContent = 'Saved ' + draftObj.updatedAt;
            } catch (e) {}
          }

          // 5. LocalStorage Auto-Restore
          function restoreDraft() {
            try {
              const raw = localStorage.getItem(storageKey);
              if (!raw) return;
              const draft = JSON.parse(raw);
              if (draft.flags && Array.isArray(draft.flags)) {
                draft.flags.forEach(fIdx => {
                  flaggedSet.add(fIdx);
                  const card = document.getElementById('qcard-' + fIdx);
                  if (card) {
                    const badge = card.querySelector('.flag-indicator');
                    if (badge) badge.classList.remove('hidden');
                    const dot = document.querySelector('#palette-btn-' + fIdx + ' .flag-dot');
                    if (dot) dot.classList.remove('hidden');
                    const flagBtn = card.querySelector('.flag-btn .flag-label');
                    if (flagBtn) flagBtn.textContent = 'Flagged';
                  }
                });
              }
              if (draft.answers) {
                Object.entries(draft.answers).forEach(([name, val]) => {
                  if (Array.isArray(val)) {
                    val.forEach(v => {
                      const input = form.querySelector('input[name="' + name + '"][value="' + v + '"]');
                      if (input) input.checked = true;
                    });
                  } else {
                    const radio = form.querySelector('input[type="radio"][name="' + name + '"][value="' + val + '"]');
                    if (radio) {
                      radio.checked = true;
                    } else {
                      const other = form.querySelector('[name="' + name + '"]');
                      if (other) other.value = val;
                    }
                  }
                });
              }
            } catch (e) {}
          }

          // Form change listener
          form.addEventListener('change', updateProgressAndPalette);
          form.addEventListener('input', updateProgressAndPalette);

          // 6. Action Delegates: Smooth Scroll, Clear Answer, Flag Toggle
          document.addEventListener('click', function(e) {
            const target = e.target.closest('[data-action]');
            if (!target) return;
            const action = target.getAttribute('data-action');

            if (action === 'scroll-to') {
              const targetId = target.getAttribute('data-target');
              const el = document.getElementById(targetId);
              if (el) {
                el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                el.classList.add('ring-2', 'ring-blue-600', 'border-blue-600');
                setTimeout(() => el.classList.remove('ring-2', 'ring-blue-600', 'border-blue-600'), 1500);
              }
            } else if (action === 'toggle-flag') {
              const idx = parseInt(target.getAttribute('data-idx'), 10);
              const card = document.getElementById('qcard-' + idx);
              const dot = document.querySelector('#palette-btn-' + idx + ' .flag-dot');
              const ribbon = card ? card.querySelector('.flag-indicator') : null;
              const label = target.querySelector('.flag-label');

              if (flaggedSet.has(idx)) {
                flaggedSet.delete(idx);
                if (ribbon) ribbon.classList.add('hidden');
                if (dot) dot.classList.add('hidden');
                if (label) label.textContent = 'Flag';
                target.classList.remove('bg-amber-50', 'border-amber-300', 'text-amber-800');
                target.classList.add('bg-slate-50', 'text-slate-600');
              } else {
                flaggedSet.add(idx);
                if (ribbon) ribbon.classList.remove('hidden');
                if (dot) dot.classList.remove('hidden');
                if (label) label.textContent = 'Flagged';
                target.classList.add('bg-amber-50', 'border-amber-300', 'text-amber-800');
                target.classList.remove('bg-slate-50', 'text-slate-600');
              }
              updateProgressAndPalette();
            } else if (action === 'clear-answer') {
              const idx = parseInt(target.getAttribute('data-idx'), 10);
              const card = document.getElementById('qcard-' + idx);
              if (card) {
                card.querySelectorAll('input[type="radio"], input[type="checkbox"]').forEach(i => i.checked = false);
                card.querySelectorAll('input[type="text"], input[type="number"], textarea').forEach(t => t.value = '');
                card.querySelectorAll('select').forEach(s => s.selectedIndex = 0);
              }
              updateProgressAndPalette();
            }
          });

          // 7. Palette Filter Switching
          const filterBtns = document.querySelectorAll('.palette-filter-btn');
          filterBtns.forEach(btn => {
            btn.addEventListener('click', function() {
              const filter = this.getAttribute('data-filter');
              filterBtns.forEach(b => {
                b.classList.remove('bg-slate-900', 'text-white', 'font-bold', 'shadow-2xs');
                b.classList.add('text-slate-600', 'font-medium');
              });
              this.classList.add('bg-slate-900', 'text-white', 'font-bold', 'shadow-2xs');
              this.classList.remove('text-slate-600', 'font-medium');

              const numBtns = document.querySelectorAll('.palette-num-btn');
              numBtns.forEach(nb => {
                const idx = parseInt(nb.getAttribute('data-idx'), 10);
                const isFlagged = flaggedSet.has(idx);
                const isAns = nb.classList.contains('bg-emerald-600');
                if (filter === 'all') {
                  nb.classList.remove('hidden');
                } else if (filter === 'unanswered') {
                  if (!isAns) nb.classList.remove('hidden');
                  else nb.classList.add('hidden');
                } else if (filter === 'flagged') {
                  if (isFlagged) nb.classList.remove('hidden');
                  else nb.classList.add('hidden');
                }
              });
            });
          });

          // 8. Jump to Next Unanswered
          const jumpNextBtn = document.getElementById('jump-next-unanswered-btn');
          if (jumpNextBtn) {
            jumpNextBtn.addEventListener('click', function() {
              const cards = document.querySelectorAll('.question-card');
              for (let i = 0; i < cards.length; i++) {
                const card = cards[i];
                const checked = card.querySelector('input:checked');
                const text = card.querySelector('input[type="text"], textarea');
                const hasText = text && text.value.trim().length > 0;
                if (!checked && !hasText) {
                  card.scrollIntoView({ behavior: 'smooth', block: 'center' });
                  card.classList.add('ring-2', 'ring-blue-600', 'border-blue-600');
                  setTimeout(() => card.classList.remove('ring-2', 'ring-blue-600', 'border-blue-600'), 1500);
                  return;
                }
              }
              alert('All questions are answered! You can now submit your exam.');
            });
          }

          // 9. Modals: Open & Close
          function openSubmitModal() {
            if (submitModal) submitModal.classList.remove('hidden');
          }
          function closeSubmitModal() {
            if (submitModal) submitModal.classList.add('hidden');
          }

          const openModalBtn = document.getElementById('open-submit-modal-btn');
          const bottomSubmitTrigger = document.getElementById('bottom-submit-trigger');
          const sidebarFinishBtn = document.getElementById('sidebar-finish-btn');
          const closeModalBtn = document.getElementById('close-modal-btn');
          const finalSubmitTrigger = document.getElementById('final-submit-trigger');

          if (openModalBtn) openModalBtn.addEventListener('click', openSubmitModal);
          if (bottomSubmitTrigger) bottomSubmitTrigger.addEventListener('click', openSubmitModal);
          if (sidebarFinishBtn) sidebarFinishBtn.addEventListener('click', openSubmitModal);
          if (closeModalBtn) closeModalBtn.addEventListener('click', closeSubmitModal);

          if (finalSubmitTrigger) {
            finalSubmitTrigger.addEventListener('click', function() {
              isSubmitting = true;
              localStorage.removeItem(storageKey);
              form.submit();
            });
          }

          // 10. Prevent accidental leave
          window.addEventListener('beforeunload', function(e) {
            if (!isSubmitting) {
              e.preventDefault();
              e.returnValue = '';
            }
          });

          // Initialize on mount
          restoreDraft();
          updateProgressAndPalette();
          if (typeof window.__renderAllMath === 'function') window.__renderAllMath();
        })();
      ` }} />
    </Layout>
  );
});

// Auto-Grading & Exam Evaluation API (Supports All 8 Question Types)
app.post('/api/exams/:examId/submit', async (c) => {
  const examId = c.req.param('examId');
  const body = (await c.req.parseBody()) as Record<string, any>;
  const db = c.env.DB;

  const { results: questions } = await db.prepare(`
    SELECT id, question_text, question_type, options_json, correct_answer, marks, explanation 
    FROM exam_questions 
    WHERE exam_id = ?
    ORDER BY sort_order ASC
  `).bind(examId).all();

  let score = 0;
  let totalPossible = 0;
  const review: any[] = [];

  for (const q of ((questions || []) as any[])) {
    const qType = q.question_type || "mcq";
    let isCorrect = false;
    let marksAwarded = 0;
    let studentDisplay = "";
    let correctDisplay = q.correct_answer;
    let evalStatus: "correct" | "incorrect" | "partial" | "pending_review" = "incorrect";

    let optConfig: any = {};
    try { optConfig = q.options_json ? JSON.parse(q.options_json) : {}; } catch { optConfig = {}; }

    if (qType === "mcq") {
      const studentAns = body[`question_${q.id}`];
      isCorrect = String(studentAns) === String(q.correct_answer);
      marksAwarded = isCorrect ? q.marks : 0;
      evalStatus = isCorrect ? "correct" : "incorrect";
      const matchedOpt = Array.isArray(optConfig) ? optConfig.find((o: any) => String(o.id) === String(studentAns)) : null;
      studentDisplay = matchedOpt ? `${matchedOpt.text}` : `Option ${studentAns || "(None)"}`;
      const correctOpt = Array.isArray(optConfig) ? optConfig.find((o: any) => String(o.id) === String(q.correct_answer)) : null;
      correctDisplay = correctOpt ? `${correctOpt.text}` : `Option ${q.correct_answer}`;
    } else if (qType === "multi_select") {
      let studentAns = body[`question_${q.id}`];
      if (!Array.isArray(studentAns)) {
        studentAns = studentAns ? [studentAns] : [];
      }
      let correctList: string[] = [];
      try { correctList = JSON.parse(q.correct_answer); } catch { correctList = [q.correct_answer]; }
      const studentSorted = [...studentAns].map(String).sort().join(",");
      const correctSorted = [...correctList].map(String).sort().join(",");
      isCorrect = studentSorted === correctSorted;
      marksAwarded = isCorrect ? q.marks : 0;
      evalStatus = isCorrect ? "correct" : "incorrect";
      studentDisplay = studentAns.length > 0 ? studentAns.map((id: any) => `Option ${id}`).join(", ") : "(None selected)";
      correctDisplay = correctList.map((id: any) => `Option ${id}`).join(", ");
    } else if (qType === "true_false") {
      const studentAns = body[`question_${q.id}`];
      isCorrect = String(studentAns).toLowerCase() === String(q.correct_answer).toLowerCase();
      marksAwarded = isCorrect ? q.marks : 0;
      evalStatus = isCorrect ? "correct" : "incorrect";
      studentDisplay = String(studentAns).toLowerCase() === "true" ? "True" : String(studentAns).toLowerCase() === "false" ? "False" : "(None)";
      correctDisplay = String(q.correct_answer).toLowerCase() === "true" ? "True" : "False";
    } else if (qType === "fill_blank") {
      const studentAns = String(body[`question_${q.id}`] || "").trim();
      const accepted: string[] = optConfig.accepted || [q.correct_answer];
      if (optConfig.case_sensitive) {
        isCorrect = accepted.some((a: string) => a.trim() === studentAns);
      } else {
        isCorrect = accepted.some((a: string) => a.trim().toLowerCase() === studentAns.toLowerCase());
      }
      marksAwarded = isCorrect ? q.marks : 0;
      evalStatus = isCorrect ? "correct" : "incorrect";
      studentDisplay = studentAns || "(Blank)";
      correctDisplay = accepted.join(" OR ");
    } else if (qType === "column_mapping") {
      let correctMap: Record<string, string> = {};
      try { correctMap = JSON.parse(q.correct_answer); } catch {}
      const keys = Object.keys(correctMap);
      let matchesCorrect = 0;
      const studentPairs: string[] = [];
      keys.forEach((lKey) => {
        const studentChoice = body[`question_${q.id}_match_${lKey}`];
        studentPairs.push(`${lKey} -> ${studentChoice || "?"}`);
        if (studentChoice === correctMap[lKey]) {
          matchesCorrect++;
        }
      });
      isCorrect = matchesCorrect === keys.length;
      marksAwarded = keys.length > 0 ? Math.round((matchesCorrect / keys.length) * q.marks) : 0;
      evalStatus = isCorrect ? "correct" : matchesCorrect > 0 ? "partial" : "incorrect";
      studentDisplay = studentPairs.join(", ");
      correctDisplay = Object.entries(correctMap).map(([l, r]) => `${l} -> ${r}`).join(", ");
    } else if (qType === "numerical") {
      const studentAns = parseFloat(String(body[`question_${q.id}`] || ""));
      const exact = Number(optConfig.exact) || 0;
      const tol = Number(optConfig.tolerance) || 0;
      if (!isNaN(studentAns)) {
        isCorrect = Math.abs(studentAns - exact) <= tol;
      }
      marksAwarded = isCorrect ? q.marks : 0;
      evalStatus = isCorrect ? "correct" : "incorrect";
      studentDisplay = isNaN(studentAns) ? "(None)" : `${studentAns} ${optConfig.unit || ""}`;
      correctDisplay = `${exact} (±${tol}) ${optConfig.unit || ""}`;
    } else if (qType === "short_answer") {
      const studentAns = String(body[`question_${q.id}`] || "").trim();
      const keywords: string[] = optConfig.keywords || [];
      const studentLower = studentAns.toLowerCase();
      let kwFound = 0;
      keywords.forEach((kw: string) => {
        if (studentLower.includes(kw.toLowerCase().trim())) kwFound++;
      });
      if (keywords.length > 0) {
        const ratio = kwFound / keywords.length;
        isCorrect = ratio >= 0.5;
        marksAwarded = Math.round(ratio * q.marks);
        evalStatus = ratio >= 0.8 ? "correct" : ratio > 0 ? "partial" : "incorrect";
      } else {
        isCorrect = studentAns.length > 5;
        marksAwarded = isCorrect ? q.marks : 0;
        evalStatus = isCorrect ? "correct" : "incorrect";
      }
      studentDisplay = studentAns || "(No response)";
      correctDisplay = `Model: ${optConfig.model_answer || q.correct_answer}${keywords.length > 0 ? ` [Key terms: ${keywords.join(", ")}]` : ""}`;
    } else if (qType === "long_answer") {
      const studentAns = String(body[`question_${q.id}`] || "").trim();
      const wordCount = studentAns ? studentAns.split(/\s+/).length : 0;
      const hasSubstance = wordCount >= 10;
      marksAwarded = hasSubstance ? Math.round(q.marks * 0.8) : 0;
      isCorrect = hasSubstance;
      evalStatus = "pending_review";
      studentDisplay = `${studentAns || "(No response)"} (${wordCount} words)`;
      correctDisplay = `Solution Guide: ${optConfig.model_answer || q.correct_answer}${optConfig.rubric ? ` | Rubric: ${optConfig.rubric}` : ""}`;
    } else if (qType === "non_verbal") {
      const studentAns = body[`question_${q.id}`];
      isCorrect = String(studentAns) === String(q.correct_answer);
      marksAwarded = isCorrect ? q.marks : 0;
      evalStatus = isCorrect ? "correct" : "incorrect";
      const opts = Array.isArray(optConfig.options) ? optConfig.options : [];
      const matchedOpt = opts.find((o: any) => String(o.id) === String(studentAns));
      const correctOpt = opts.find((o: any) => String(o.id) === String(q.correct_answer));
      studentDisplay = matchedOpt ? `Figure ${matchedOpt.label || matchedOpt.id}${matchedOpt.text ? ` - ${matchedOpt.text}` : ''}` : `Figure ${studentAns || '(None selected)'}`;
      correctDisplay = correctOpt ? `Figure ${correctOpt.label || correctOpt.id}${correctOpt.text ? ` - ${correctOpt.text}` : ''}` : `Figure ${q.correct_answer}`;
    } else if (qType === "verbal_reasoning") {
      const studentAns = body[`question_${q.id}`];
      isCorrect = String(studentAns) === String(q.correct_answer);
      marksAwarded = isCorrect ? q.marks : 0;
      evalStatus = isCorrect ? "correct" : "incorrect";
      const opts = Array.isArray(optConfig.options) ? optConfig.options : [];
      const matchedOpt = opts.find((o: any) => String(o.id) === String(studentAns));
      const correctOpt = opts.find((o: any) => String(o.id) === String(q.correct_answer));
      studentDisplay = matchedOpt ? `Option ${matchedOpt.label || matchedOpt.id}: ${matchedOpt.text}` : `Option ${studentAns || '(None selected)'}`;
      correctDisplay = correctOpt ? `Option ${correctOpt.label || correctOpt.id}: ${correctOpt.text}` : `Option ${q.correct_answer}`;
    }

    score += marksAwarded;
    totalPossible += q.marks;

    review.push({
      question: q.question_text,
      type: qType,
      studentAns: studentDisplay,
      correctAns: correctDisplay,
      isCorrect,
      evalStatus,
      marks: marksAwarded,
      maxMarks: q.marks,
      explanation: q.explanation
    });
  }

  const passed = score >= (totalPossible * 0.5);

  return c.html(
    <Layout title="Exam Result & Performance Report | Sharp Academy">
      <div class="max-w-3xl mx-auto px-4 py-12">
        <div class="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm text-center mb-8">
          <div class={`w-20 h-20 rounded-full mx-auto flex items-center justify-center text-3xl font-black mb-4 ${passed ? 'bg-emerald-100 text-emerald-600' : 'bg-red-100 text-red-600'}`}>
            {passed ? '🏆' : '⚠️'}
          </div>
          <h1 class="text-3xl font-black text-slate-900 font-heading">
            {passed ? 'Congratulations, You Passed!' : 'Evaluation Completed'}
          </h1>
          <p class="text-slate-500 text-sm mt-1">Multi-Format Assessment Engine Evaluation</p>
          <div class="text-5xl font-black text-slate-900 my-6 font-heading">
            {score} <span class="text-2xl text-slate-400 font-normal">/ {totalPossible}</span>
          </div>
          <div class="inline-block px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider bg-slate-100 text-slate-700">
            Score: {Math.round((score / totalPossible) * 100)}%
          </div>
        </div>

        <h2 class="text-xl font-bold text-slate-900 mb-4 font-heading">Answer Key & Performance Breakdown</h2>
        <div class="space-y-4">
          {review.map((r, i) => (
            <div class={`p-6 rounded-2xl border ${
              r.evalStatus === 'correct' 
                ? 'bg-emerald-50/40 border-emerald-200' 
                : r.evalStatus === 'partial'
                ? 'bg-amber-50/40 border-amber-200'
                : r.evalStatus === 'pending_review'
                ? 'bg-purple-50/40 border-purple-200'
                : 'bg-red-50/40 border-red-200'
            }`}>
              <div class="flex justify-between items-center mb-2">
                <span class="font-bold text-xs uppercase text-slate-600">Question {i + 1} ({r.type.replace('_', ' ')})</span>
                <span class={`text-xs font-bold px-2 py-0.5 rounded ${
                  r.evalStatus === 'correct'
                    ? 'bg-emerald-600 text-white'
                    : r.evalStatus === 'partial'
                    ? 'bg-amber-600 text-white'
                    : r.evalStatus === 'pending_review'
                    ? 'bg-purple-600 text-white'
                    : 'bg-red-600 text-white'
                }`}>
                  {r.evalStatus === 'correct' && `✓ Correct (+${r.marks}/${r.maxMarks})`}
                  {r.evalStatus === 'partial' && `⚠️ Partial (+${r.marks}/${r.maxMarks})`}
                  {r.evalStatus === 'pending_review' && `⏳ Faculty Review Pending (+${r.marks}/${r.maxMarks})`}
                  {r.evalStatus === 'incorrect' && `✗ Incorrect (0/${r.maxMarks})`}
                </span>
              </div>
              <div dir="auto" class={`font-bold text-slate-900 leading-relaxed mb-3 ${isRTLText(r.question) ? (isUrduText(r.question) ? 'font-urdu text-right text-lg' : 'font-arabic text-right text-base') : 'text-sm'}`}>
                {renderRichText(r.question)}
              </div>
              
              <div class="space-y-1.5 text-xs mb-3 bg-white p-3 rounded-xl border border-slate-200/60">
                <p dir="auto" class={`text-slate-700 leading-relaxed ${isRTLText(r.studentAns) ? (isUrduText(r.studentAns) ? 'font-urdu text-right text-base' : 'font-arabic text-right text-sm') : ''}`}>
                  <strong class="text-slate-900">Your Answer:</strong> {r.studentAns}
                </p>
                <p dir="auto" class={`text-blue-700 leading-relaxed ${isRTLText(r.correctAns) ? (isUrduText(r.correctAns) ? 'font-urdu text-right text-base' : 'font-arabic text-right text-sm') : ''}`}>
                  <strong class="text-slate-900">Correct / Model Answer:</strong> {r.correctAns}
                </p>
              </div>

              {r.explanation && (
                <p dir="auto" class={`text-xs text-slate-600 leading-relaxed border-t border-slate-200/50 pt-2 ${isRTLText(r.explanation) ? (isUrduText(r.explanation) ? 'font-urdu text-right text-base' : 'font-arabic text-right text-sm') : ''}`}>
                  <strong class="text-slate-800">Explanation & Walkthrough:</strong> {renderRichText(r.explanation)}
                </p>
              )}
            </div>
          ))}
        </div>

        <div class="mt-8 text-center">
          <a href="/" class="bg-blue-600 hover:bg-blue-700 text-white font-bold px-6 py-3 rounded-xl text-sm transition shadow-md">
            Back to Academy Home
          </a>
        </div>
      </div>
    </Layout>
  );
});


// ============================================================================
// 7. STUDENT AUTHENTICATION & LOGIN (/portal/login)
// ============================================================================
app.get('/portal/login', (c) => {
  return c.html(
    <Layout title="Student & Faculty Portal Sign In | Sharp Academy">
      <div class="max-w-md mx-auto px-4 py-20">
        <div class="bg-white p-8 rounded-3xl border border-slate-200 shadow-xl">
          <div class="text-center mb-6">
            <div class="w-12 h-12 bg-blue-600 text-white rounded-2xl flex items-center justify-center font-black text-xl mx-auto shadow-md">
              S
            </div>
            <h1 class="text-2xl font-black text-slate-900 font-heading mt-4">Student LMS Portal</h1>
            <p class="text-xs text-slate-500 mt-1">Sign in to access your digital classroom and exams.</p>
          </div>

          <form action="/api/auth/login" method="post" class="space-y-4">
            <div>
              <label class="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Student Email</label>
              <input type="email" name="email" value="student@sharpacademy.pk" required class="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label class="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Password</label>
              <input type="password" name="password" value="student123" required class="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <button type="submit" class="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3.5 rounded-xl text-sm transition shadow-md">
              Sign In to LMS
            </button>
          </form>

          <div class="mt-6 pt-6 border-t border-slate-100 text-center">
            <a href="/portal/lms" class="inline-flex items-center gap-2 text-xs font-bold text-blue-600 bg-blue-50 hover:bg-blue-100 px-4 py-2.5 rounded-xl transition">
              <span>🚀 1-Click Instant Student Demo</span>
            </a>
          </div>
        </div>
      </div>
    </Layout>
  );
});

app.post('/api/auth/login', async (c) => {
  setCookie(c, 'sharp_student_session', 'student_demo_token', {
    path: '/',
    maxAge: 86400 * 7,
    httpOnly: true
  });
  return c.redirect('/portal/lms');
});

// ============================================================================
// 8. STUDENT LMS DASHBOARD (/portal/lms)
// ============================================================================
app.get('/portal/lms', async (c) => {
  const db = c.env.DB;

  let student: any = null;
  let enrolledCourses: any[] = [];
  let nextSchedule: any = null;

  try {
    // 1. Fetch student info (Hamza Ali, id: 3)
    student = await db.prepare('SELECT id, full_name, email, city, avatar_url FROM users WHERE role = "student" LIMIT 1').first();
    const studentId = student?.id || 3;

    // 2. Fetch enrolled courses with progress
    const coursesRes = await db.prepare(`
      SELECT c.id, c.title, c.code, c.duration_weeks, b.name as batch_name, b.batch_code, b.mode,
        (SELECT COUNT(*) FROM lessons l JOIN course_modules m ON l.module_id = m.id WHERE m.course_id = c.id) as total_lessons,
        (SELECT COUNT(*) FROM student_lesson_progress p JOIN lessons l ON p.lesson_id = l.id JOIN course_modules m ON l.module_id = m.id WHERE m.course_id = c.id AND p.student_id = ? AND p.is_completed = 1) as completed_lessons
      FROM registrations r
      JOIN batches b ON r.batch_id = b.id
      JOIN courses c ON b.course_id = c.id
      WHERE r.student_id = ?
    `).bind(studentId, studentId).all();
    enrolledCourses = coursesRes.results || [];

    // Fallback if no registration exists
    if (enrolledCourses.length === 0) {
      const fallbackCourse: any = await db.prepare('SELECT id, title, code, duration_weeks FROM courses WHERE id = 1').first();
      if (fallbackCourse) {
        enrolledCourses = [{
          ...fallbackCourse,
          batch_name: 'Evening Batch Alpha',
          batch_code: 'FSW-2026-A',
          mode: 'hybrid',
          total_lessons: 4,
          completed_lessons: 1
        }];
      }
    }

    // 3. Upcoming Schedule for Student
    nextSchedule = await db.prepare(`
      SELECT s.day_of_week, s.start_time, s.end_time, s.room_number, s.live_meeting_url, c.title as course_title
      FROM batch_schedules s
      JOIN batches b ON s.batch_id = b.id
      JOIN courses c ON b.course_id = c.id
      LIMIT 1
    `).first();
  } catch (err) {
    console.warn('[LMS D1]', err);
  }

  return c.html(
    <Layout title="Student Learning Management System (LMS) | Sharp Academy">
      <div class="max-w-7xl mx-auto px-4 py-10">
        {/* Welcome Header */}
        <div class="bg-gradient-to-r from-blue-900 via-slate-900 to-indigo-950 rounded-3xl p-8 md:p-10 text-white shadow-xl mb-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <span class="text-xs font-bold text-blue-300 uppercase tracking-widest bg-blue-500/20 px-3 py-1 rounded-full border border-blue-400/20">
              Active Student Portal
            </span>
            <div class="flex items-center gap-4 mt-3">
              <img
                src={student?.avatar_url || "https://api.dicebear.com/7.x/initials/svg?seed=Hamza%20Ali"}
                alt={student?.full_name || "Student"}
                class="w-14 h-14 rounded-full object-cover border-2 border-blue-400 shadow-md shrink-0"
              />
              <div>
                <h1 class="text-3xl md:text-4xl font-black font-heading leading-tight">
                  Welcome back, {student?.full_name || 'Hamza Ali'}! 👋
                </h1>
                <span class="text-xs font-mono text-blue-300 font-bold">Student ID: #STU-0003</span>
              </div>
            </div>
            <p class="text-slate-300 text-sm mt-1">
              You are enrolled in active Fall 2026 academic sessions. Continue your classroom lectures below.
            </p>
          </div>
          <div class="flex items-center gap-3">
            <a href="/portal/exams" class="bg-blue-600 hover:bg-blue-500 text-white px-5 py-3 rounded-2xl font-bold text-sm transition shadow-md flex items-center gap-2">
              <span>Online Exams Hub</span>
              <span class="text-xs bg-white/20 px-2 py-0.5 rounded-full">1 Due</span>
            </a>
          </div>
        </div>

        {/* Next Live Class Alert */}
        {nextSchedule && (
          <div class="bg-amber-50 border border-amber-200/80 rounded-2xl p-5 mb-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div class="flex items-center gap-3">
              <div class="w-10 h-10 bg-amber-500 text-white rounded-xl flex items-center justify-center font-bold text-lg shrink-0">
                🗓️
              </div>
              <div>
                <span class="text-[11px] font-black uppercase tracking-wider text-amber-800 block">Upcoming Live Class</span>
                <strong class="text-sm text-slate-900">{nextSchedule.course_title}</strong>
                <p class="text-xs text-slate-600 mt-0.5">{nextSchedule.day_of_week} at {nextSchedule.start_time} - {nextSchedule.end_time} • Room: {nextSchedule.room_number || 'Online Google Meet'}</p>
              </div>
            </div>
            {nextSchedule.live_meeting_url && (
              <a href={nextSchedule.live_meeting_url} target="_blank" rel="noreferrer" class="bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold px-4 py-2.5 rounded-xl transition shadow-sm whitespace-nowrap">
                Join Google Meet Class &rarr;
              </a>
            )}
          </div>
        )}

        {/* Enrolled Courses Grid */}
        <div class="mb-12">
          <div class="flex items-center justify-between mb-6">
            <div>
              <h2 class="text-2xl font-black text-slate-900 font-heading">My Enrolled Programs & Classroom</h2>
              <p class="text-xs text-slate-500 mt-0.5">Access lecture videos, study handouts, and track your progress.</p>
            </div>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
            {enrolledCourses.map((c: any) => {
              const total = c.total_lessons || 4;
              const done = c.completed_lessons || 0;
              const pct = Math.round((done / total) * 100);

              return (
                <div class="bg-white rounded-3xl border border-slate-200/80 p-8 shadow-sm hover:shadow-md transition flex flex-col justify-between">
                  <div>
                    <div class="flex items-center justify-between mb-3">
                      <span class="text-xs font-bold text-blue-600 uppercase tracking-wider bg-blue-50 px-3 py-1 rounded-lg">
                        {c.code} • {c.mode || 'Hybrid'}
                      </span>
                      <span class="text-xs font-mono font-bold text-slate-400">{c.batch_code || 'Batch Alpha'}</span>
                    </div>

                    <h3 class="text-xl font-bold text-slate-900 font-heading mt-2">{c.title}</h3>
                    <p class="text-xs text-slate-500 mt-1">{c.batch_name || 'Evening Session'} • {c.duration_weeks || 12} Weeks Program</p>

                    {/* Progress Bar */}
                    <div class="mt-6">
                      <div class="flex justify-between text-xs font-bold text-slate-700 mb-2">
                        <span>Curriculum Progress</span>
                        <span>{done} of {total} Lectures ({pct}%)</span>
                      </div>
                      <div class="w-full h-3 bg-slate-100 rounded-full overflow-hidden">
                        <div class="h-full bg-blue-600 rounded-full transition-all duration-500" style={`width: ${pct}%`}></div>
                      </div>
                    </div>
                  </div>

                  <div class="mt-8 pt-6 border-t border-slate-100 flex items-center justify-between">
                    <a href={`/portal/lms/course/${c.id}`} class="w-full text-center bg-blue-600 hover:bg-blue-700 text-white font-bold py-3.5 rounded-xl text-sm transition shadow-md shadow-blue-600/20">
                      Enter Digital Classroom &rarr;
                    </a>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Academic Quick Actions */}
        <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div class="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-start gap-4">
            <div class="w-12 h-12 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center font-bold text-xl shrink-0">
              📝
            </div>
            <div>
              <h4 class="font-bold text-slate-900 text-sm">Examinations & Mock Tests</h4>
              <p class="text-xs text-slate-500 mt-1">Timed assessments with auto-grading evaluations.</p>
              <a href="/portal/exams" class="inline-block mt-3 text-xs font-bold text-blue-600 hover:underline">Go to Tests &rarr;</a>
            </div>
          </div>

          <div class="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-start gap-4">
            <div class="w-12 h-12 bg-purple-50 text-purple-600 rounded-xl flex items-center justify-center font-bold text-xl shrink-0">
              📂
            </div>
            <div>
              <h4 class="font-bold text-slate-900 text-sm">Downloadable Handouts</h4>
              <p class="text-xs text-slate-500 mt-1">Lecture slides, PDF notes, and past exam papers.</p>
              <a href="/portal/lms/course/1" class="inline-block mt-3 text-xs font-bold text-purple-600 hover:underline">Browse Notes &rarr;</a>
            </div>
          </div>

          <div class="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-start gap-4">
            <div class="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center font-bold text-xl shrink-0">
              📊
            </div>
            <div>
              <h4 class="font-bold text-slate-900 text-sm">Academic Timetable</h4>
              <p class="text-xs text-slate-500 mt-1">Weekly schedule of all campus rooms and online slots.</p>
              <a href="/schedules" class="inline-block mt-3 text-xs font-bold text-emerald-600 hover:underline">View Timetable &rarr;</a>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
});

// ============================================================================
// 9. DIGITAL CLASSROOM PLAYER (/portal/lms/course/:courseId)
// ============================================================================
app.get('/portal/lms/course/:courseId', async (c) => {
  const courseId = c.req.param('courseId');
  const activeLessonId = c.req.query('lesson');
  const db = c.env.DB;

  // 1. Course Details
  const course: any = await db.prepare('SELECT * FROM courses WHERE id = ?').bind(courseId).first();
  if (!course) return c.text('Course not found', 404);

  // 2. Fetch Modules with their Lessons
  const { results: modules } = await db.prepare(`
    SELECT * FROM course_modules WHERE course_id = ? ORDER BY sort_order ASC
  `).bind(courseId).all();

  const { results: allLessons } = await db.prepare(`
    SELECT l.*, m.id as module_id
    FROM lessons l
    JOIN course_modules m ON l.module_id = m.id
    WHERE m.course_id = ?
    ORDER BY m.sort_order ASC, l.sort_order ASC
  `).bind(courseId).all();

  // 3. Current active lesson
  let currentLesson: any = null;
  if (activeLessonId) {
    currentLesson = allLessons?.find((l: any) => String(l.id) === String(activeLessonId));
  }
  if (!currentLesson && allLessons && allLessons.length > 0) {
    currentLesson = allLessons[0];
  }

  // 4. Attachments for current lesson
  let attachments: any[] = [];
  if (currentLesson) {
    const attachRes = await db.prepare(`
      SELECT * FROM lesson_attachments WHERE lesson_id = ?
    `).bind(currentLesson.id).all();
    attachments = attachRes.results || [];
  }

  // 5. Completion Status
  let isCompleted = false;
  if (currentLesson) {
    const prog: any = await db.prepare(`
      SELECT is_completed FROM student_lesson_progress WHERE student_id = 3 AND lesson_id = ?
    `).bind(currentLesson.id).first();
    isCompleted = Boolean(prog?.is_completed);
  }

  return c.html(
    <Layout title={`Classroom: ${course.title} | Sharp Academy LMS`}>
      <div class="bg-slate-900 text-white py-4 px-6 border-b border-slate-800 flex items-center justify-between">
        <div class="flex items-center gap-3">
          <a href="/portal/lms" class="text-xs font-bold text-slate-400 hover:text-white transition flex items-center gap-1">
            &larr; Back to LMS
          </a>
          <span class="text-slate-600">|</span>
          <span class="text-xs font-bold text-blue-400 uppercase tracking-wider">{course.code}</span>
          <h1 class="text-sm font-bold text-white hidden md:block">{course.title}</h1>
        </div>
        <div class="flex items-center gap-2">
          <span class="text-xs text-slate-400 font-mono">Interactive Classroom Mode</span>
        </div>
      </div>

      <div class="max-w-7xl mx-auto px-4 py-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left 2 Cols: Video Player & Lecture Content */}
        <div class="lg:col-span-2 space-y-6">
          {currentLesson ? (
            <div>
              {/* Media Player Box */}
              {currentLesson.lesson_type === 'video' ? (
                <div class="bg-black rounded-2xl overflow-hidden aspect-video shadow-2xl relative border border-slate-800">
                  <iframe
                    src={currentLesson.video_url || "https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ"}
                    title={currentLesson.title}
                    class="w-full h-full"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowfullscreen
                  ></iframe>
                </div>
              ) : (
                <div class="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm text-center py-16">
                  <div class="w-16 h-16 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center font-bold text-2xl mx-auto mb-4">
                    📄
                  </div>
                  <h3 class="text-xl font-bold text-slate-900 font-heading">Document Reading & Code Exercise</h3>
                  <p class="text-xs text-slate-500 mt-1">Review the lecture summary notes and attached guide below.</p>
                </div>
              )}

              {/* Lesson Control Bar */}
              <div class="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm mt-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <span class="text-xs font-bold text-blue-600 uppercase tracking-wider">Lesson {currentLesson.sort_order} • {currentLesson.duration_minutes} Mins</span>
                  <h2 class="text-xl font-black text-slate-900 font-heading mt-0.5">{currentLesson.title}</h2>
                </div>

                <form action="/api/lms/toggle-progress" method="post">
                  <input type="hidden" name="course_id" value={courseId} />
                  <input type="hidden" name="lesson_id" value={currentLesson.id} />
                  <input type="hidden" name="current_status" value={isCompleted ? "1" : "0"} />
                  <button type="submit" class={`px-5 py-2.5 rounded-xl font-bold text-xs transition shadow-sm flex items-center gap-2 ${
                    isCompleted 
                      ? "bg-emerald-100 text-emerald-800 hover:bg-emerald-200" 
                      : "bg-blue-600 hover:bg-blue-700 text-white"
                  }`}>
                    <span>{isCompleted ? "✓ Completed" : "Mark as Completed"}</span>
                  </button>
                </form>
              </div>

              {/* Lesson Description & Notes */}
              <div class="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm mt-6">
                <h3 class="text-base font-bold text-slate-900 font-heading mb-3">Lecture Notes & Concepts</h3>
                <div class="text-slate-700 text-sm leading-relaxed whitespace-pre-line font-sans">
                  {currentLesson.content_markdown || "Review core concepts presented in this lecture."}
                </div>
              </div>

              {/* Lesson Attachments & Downloads */}
              {attachments.length > 0 && (
                <div class="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm mt-6">
                  <h3 class="text-base font-bold text-slate-900 font-heading mb-3">Lecture Downloads & Handouts</h3>
                  <div class="space-y-2">
                    {attachments.map((att: any) => (
                      <div class="p-3.5 rounded-xl border border-slate-100 hover:bg-slate-50 flex items-center justify-between">
                        <div class="flex items-center gap-3">
                          <span class="text-lg">📎</span>
                          <div>
                            <strong class="text-xs text-slate-800 block">{att.title}</strong>
                            <span class="text-[10px] text-slate-400 font-mono">{(Number(att.file_size_bytes || 0) / 1024 / 1024).toFixed(1)} MB • PDF Document</span>
                          </div>
                        </div>
                        <a href={att.file_url} download class="bg-slate-100 hover:bg-slate-200 text-slate-700 px-3 py-1.5 rounded-lg text-xs font-bold transition">
                          Download
                        </a>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div class="bg-white p-12 rounded-2xl border border-slate-200 text-center">
              <p class="text-slate-500 text-sm">No lesson selected.</p>
            </div>
          )}
        </div>

        {/* Right Col: Curriculum Modules & Lessons Sidebar */}
        <div>
          <div class="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden sticky top-6">
            <div class="p-4 bg-slate-50 border-b border-slate-200">
              <h3 class="font-bold text-slate-900 text-sm font-heading">Course Curriculum</h3>
              <p class="text-[11px] text-slate-500">{allLessons?.length || 0} Lessons in this program</p>
            </div>

            <div class="divide-y divide-slate-100 max-h-[600px] overflow-y-auto">
              {(modules || []).map((m: any) => {
                const moduleLessons = allLessons?.filter((l: any) => l.module_id === m.id) || [];
                return (
                  <div class="p-4">
                    <span class="text-[10px] font-black uppercase text-blue-600 tracking-wider block">{m.title}</span>
                    <div class="mt-2 space-y-1">
                      {moduleLessons.map((l: any) => {
                        const isCurrent = String(l.id) === String(currentLesson?.id);
                        return (
                          <a
                            href={`/portal/lms/course/${courseId}?lesson=${l.id}`}
                            class={`block p-2.5 rounded-xl text-xs font-semibold transition ${
                              isCurrent 
                                ? "bg-blue-600 text-white shadow-sm" 
                                : "text-slate-700 hover:bg-slate-100"
                            }`}
                          >
                            <div class="flex items-center justify-between">
                              <span>{l.sort_order}. {l.title}</span>
                              <span class={`text-[10px] font-mono ${isCurrent ? "text-blue-200" : "text-slate-400"}`}>
                                {l.duration_minutes}m
                              </span>
                            </div>
                          </a>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
});

// Toggle Lesson Progress
app.post('/api/lms/toggle-progress', async (c) => {
  const body = await c.req.parseBody();
  const db = c.env.DB;
  const courseId = body.course_id;
  const lessonId = body.lesson_id;
  const currentStatus = body.current_status;
  const newStatus = currentStatus === "1" ? 0 : 1;

  try {
    await db.prepare(`
      INSERT INTO student_lesson_progress (student_id, lesson_id, is_completed, completed_at)
      VALUES (3, ?, ?, CURRENT_TIMESTAMP)
      ON CONFLICT(student_id, lesson_id) DO UPDATE SET is_completed = ?, completed_at = CURRENT_TIMESTAMP
    `).bind(lessonId, newStatus, newStatus).run();
  } catch (err) {
    console.warn('[LMS Progress Toggle Error]', err);
  }

  return c.redirect(`/portal/lms/course/${courseId}?lesson=${lessonId}`);
});

// ============================================================================
// 10. EXAMINATIONS HUB (/portal/exams)
// ============================================================================
app.get('/portal/exams', async (c) => {
  const db = c.env.DB;
  const { results: exams } = await db.prepare(`
    SELECT e.*, c.title as course_title, c.code as course_code
    FROM exams e
    JOIN courses c ON e.course_id = c.id
    WHERE e.is_published = 1
  `).all();

  return c.html(
    <Layout title="Student Online Examinations & Assessments | Sharp Academy">
      <div class="max-w-5xl mx-auto px-4 py-12">
        <div class="mb-8">
          <a href="/portal/lms" class="text-xs font-bold text-blue-600 hover:underline">&larr; Back to LMS Dashboard</a>
          <h1 class="text-3xl font-black text-slate-900 font-heading mt-2">Active Assessments & Quizzes</h1>
          <p class="text-xs text-slate-500 mt-1">Timed examinations designed to test your mastery. Grades are generated instantly.</p>
        </div>

        <div class="space-y-4">
          {(exams || []).map((exam: any) => (
            <div class="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <span class="text-xs font-bold text-blue-600 uppercase tracking-wider">{exam.course_code} • {exam.exam_type}</span>
                <h3 class="text-lg font-bold text-slate-900 mt-1">{exam.title}</h3>
                <p class="text-xs text-slate-500 mt-0.5">Program: {exam.course_title} • Duration: <strong>{exam.duration_minutes} Mins</strong> • Total: <strong>{exam.total_marks} Marks</strong></p>
              </div>
              <a href={`/exam/${exam.id}`} class="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-5 py-3 rounded-xl transition shadow-sm whitespace-nowrap">
                Start Examination &rarr;
              </a>
            </div>
          ))}
        </div>
      </div>
    </Layout>
  );
});


// ============================================================================
// 11. PAYMENT SLIP UPLOAD TO CLOUDFLARE R2 (/admissions/upload)
// ============================================================================
app.get('/admissions/upload', async (c) => {
  const regNo = c.req.query('reg') || '';
  const db = c.env.DB;
  
  let reg: any = null;
  if (regNo) {
    reg = await db.prepare(`
      SELECT r.*, u.full_name, c.title as course_title 
      FROM registrations r
      JOIN users u ON r.student_id = u.id
      JOIN batches b ON r.batch_id = b.id
      JOIN courses c ON b.course_id = c.id
      WHERE r.registration_no = ?
    `).bind(regNo).first();
  }

  return c.html(
    <Layout title="Upload Fee Payment Slip | Sharp Academy">
      <div class="max-w-xl mx-auto px-4 py-16">
        <div class="bg-white p-8 rounded-3xl border border-slate-200 shadow-xl">
          <div class="text-center mb-6">
            <div class="w-12 h-12 bg-blue-100 text-blue-600 rounded-2xl flex items-center justify-center text-xl font-black mx-auto mb-3">
              💳
            </div>
            <h1 class="text-2xl font-black text-slate-900 font-heading">Submit Proof of Fee Payment</h1>
            <p class="text-xs text-slate-500 mt-1">Upload your bank deposit slip, ATM receipt, or JazzCash / EasyPaisa screenshot.</p>
          </div>

          {reg && (
            <div class="bg-blue-50 border border-blue-200 rounded-2xl p-4 mb-6 text-xs font-mono space-y-1">
              <div><span class="text-slate-500">Reg No:</span> <strong class="text-slate-900">{reg.registration_no}</strong></div>
              <div><span class="text-slate-500">Student:</span> <strong class="text-slate-900">{reg.full_name}</strong></div>
              <div><span class="text-slate-500">Program:</span> <strong class="text-slate-900">{reg.course_title}</strong></div>
              <div><span class="text-slate-500">Payable Fee:</span> <strong class="text-blue-700">Rs {Number(reg.net_payable_pkr).toLocaleString()}</strong></div>
            </div>
          )}

          <form action="/api/admissions/upload-slip" method="post" enctype="multipart/form-data" class="space-y-4">
            <div>
              <label class="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Application Registration No *</label>
              <input type="text" name="registration_no" value={regNo} required placeholder="REG-XXXXXX" class="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>

            <div>
              <label class="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Payment Method *</label>
              <select name="payment_method" required class="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option value="bank_transfer">Bank Transfer (Meezan Bank)</option>
                <option value="jazzcash">JazzCash / EasyPaisa</option>
                <option value="cash">Cash at Campus Counter</option>
              </select>
            </div>

            <div>
              <label class="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Transaction ID / Reference No</label>
              <input type="text" name="transaction_ref" placeholder="e.g. TID-98234823 or Slip #" class="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>

            <div>
              <label class="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Select Slip / Receipt Image *</label>
              <input type="file" name="slip_file" accept="image/*,.pdf" required class="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-xs file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-bold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100" />
              <span class="text-[10px] text-slate-400 mt-1 block">Supports JPG, PNG, WEBP or PDF (Stored directly in Cloudflare R2).</span>
            </div>

            <button type="submit" class="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3.5 rounded-xl text-sm transition shadow-md">
              Upload Payment Slip to Cloudflare R2
            </button>
          </form>
        </div>
      </div>
    </Layout>
  );
});

// Handle R2 Slip Upload
app.post('/api/admissions/upload-slip', async (c) => {
  const body = await c.req.parseBody();
  const db = c.env.DB;
  const filesBucket = c.env.FILES;
  const regNo = String(body.registration_no || '').trim();
  const paymentMethod = String(body.payment_method || 'bank_transfer');
  const txnRef = String(body.transaction_ref || '');
  const slipFile = body['slip_file'];

  let slipUrl = '/cdn/slips/default-slip.png';

  // 1. Upload to Cloudflare R2 if file provided
  if (slipFile && typeof slipFile === 'object' && 'arrayBuffer' in slipFile) {
    const file = slipFile as File;
    const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg';
    const key = `slips/${regNo}-${Date.now()}.${ext}`;
    const buffer = await file.arrayBuffer();

    if (filesBucket) {
      await filesBucket.put(key, buffer, {
        httpMetadata: { contentType: file.type || 'image/jpeg' }
      });
      slipUrl = `/cdn/${key}`;
    }
  }

  // 2. Fetch Registration
  const reg: any = await db.prepare('SELECT id, student_id, net_payable_pkr FROM registrations WHERE registration_no = ?').bind(regNo).first();

  if (reg) {
    // 3. Create Fee Invoice if not exists
    const invRes = await db.prepare(`
      INSERT INTO fee_invoices (invoice_no, registration_id, student_id, title, amount_pkr, due_date, status)
      VALUES (?, ?, ?, 'Tuition Fee Voucher', ?, CURRENT_TIMESTAMP, 'partially_paid')
    `).bind('INV-' + regNo.replace('REG-', ''), reg.id, reg.student_id, reg.net_payable_pkr).run();

    const invId = invRes.meta?.last_row_id || 1;

    // 4. Record Payment Transaction with R2 URL
    await db.prepare(`
      INSERT INTO payment_transactions (invoice_id, amount_pkr, payment_method, transaction_ref, slip_attachment_url, status)
      VALUES (?, ?, ?, ?, ?, 'pending_verification')
    `).bind(invId, reg.net_payable_pkr, paymentMethod, txnRef, slipUrl).run();
  }

  return c.html(
    <Layout title="Payment Slip Uploaded | Sharp Academy">
      <div class="max-w-md mx-auto px-4 py-20 text-center">
        <div class="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto text-2xl font-black mb-4">
          ✓
        </div>
        <h1 class="text-2xl font-black text-slate-900 font-heading">Payment Slip Received!</h1>
        <p class="text-xs text-slate-500 mt-2">Your deposit slip has been stored in Cloudflare R2 and submitted to administration for verification.</p>
        <div class="bg-slate-50 border border-slate-200 rounded-2xl p-4 mt-6 text-xs font-mono text-left space-y-1">
          <div><span class="text-slate-400">Application:</span> <strong class="text-slate-800">{regNo}</strong></div>
          <div><span class="text-slate-400">Method:</span> <strong class="text-slate-800">{paymentMethod}</strong></div>
          <div><span class="text-slate-400">R2 Slip File:</span> <strong class="text-blue-600">{slipUrl}</strong></div>
          <div><span class="text-slate-400">Status:</span> <strong class="text-amber-600">Pending Admin Verification</strong></div>
        </div>
        <div class="mt-8 flex gap-3 justify-center">
          <a href="/portal/lms" class="bg-blue-600 text-white font-bold text-xs px-5 py-3 rounded-xl transition shadow-md">
            Go to Student LMS
          </a>
          <a href="/" class="bg-slate-100 text-slate-700 font-bold text-xs px-5 py-3 rounded-xl hover:bg-slate-200 transition">
            Home
          </a>
        </div>
      </div>
    </Layout>
  );
});

export default app;
