import { Loader2, Database, Layers, Sparkles } from "lucide-react";

export default function QuestionBankLoading() {
  return (
    <div className="w-full max-w-[1600px] mx-auto px-2 sm:px-4 space-y-6 animate-in fade-in duration-150">
      {/* 1. Header & Live Indicator Skeleton */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-blue-500/20">
            <Database className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-black text-slate-900 font-heading">
                Comprehensive Question Bank
              </h1>
              <span className="text-[10px] font-bold text-blue-700 bg-blue-100 px-2 py-0.5 rounded-full border border-blue-200 flex items-center gap-1">
                <Loader2 className="w-3 h-3 animate-spin" />
                <span>Syncing Data...</span>
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Multi-format testing engine: LaTeX math formulas, non-verbal matrices, verbal reasoning & CBT items.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <div className="h-9 w-32 bg-slate-200/80 rounded-xl animate-pulse"></div>
          <div className="h-9 w-36 bg-blue-600/30 rounded-xl animate-pulse"></div>
        </div>
      </div>

      {/* 2. Stats Cards Skeleton */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {[...Array(6)].map((_, i) => (
          <div 
            key={i} 
            className="bg-white p-3.5 rounded-2xl border border-slate-200/80 shadow-2xs space-y-2 animate-pulse"
          >
            <div className="flex items-center justify-between">
              <div className="w-4 h-4 bg-slate-200 rounded"></div>
              <div className="w-12 h-3 bg-slate-200 rounded"></div>
            </div>
            <div className="w-16 h-6 bg-slate-300 rounded-md"></div>
          </div>
        ))}
      </div>

      {/* 3. Central Lateral Data Load Progress Spinner Card */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-12 text-center space-y-4">
        <div className="w-16 h-16 rounded-2xl bg-blue-50 border border-blue-200 text-blue-600 flex items-center justify-center mx-auto shadow-xs">
          <Loader2 className="w-8 h-8 animate-spin" />
        </div>

        <div className="space-y-1.5">
          <span className="text-[11px] font-bold tracking-wider text-blue-700 bg-blue-100 uppercase px-3 py-1 rounded-full border border-blue-200 inline-block">
            Lateral Data Load in Progress
          </span>
          <h2 className="text-xl font-black text-slate-900 font-heading pt-1">
            Loading Question Bank Database...
          </h2>
          <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed">
            Synchronizing thousands of questions, KaTeX formula representations, and visual shape matrices. Please hold on a moment...
          </p>
        </div>

        {/* Progress Bar Animation */}
        <div className="w-72 bg-slate-100 rounded-full h-2 mx-auto overflow-hidden shadow-inner">
          <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-emerald-500 h-full rounded-full animate-pulse w-4/5"></div>
        </div>
      </div>

      {/* 4. Skeleton Question Cards */}
      <div className="space-y-4 opacity-60">
        {[...Array(3)].map((_, i) => (
          <div 
            key={i} 
            className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs space-y-3 animate-pulse"
          >
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-16 h-5 bg-slate-200 rounded"></div>
                <div className="w-20 h-5 bg-slate-200 rounded"></div>
                <div className="w-14 h-5 bg-slate-200 rounded"></div>
              </div>
              <div className="w-16 h-6 bg-slate-200 rounded"></div>
            </div>
            <div className="space-y-2">
              <div className="w-3/4 h-4 bg-slate-200 rounded"></div>
              <div className="w-1/2 h-4 bg-slate-200 rounded"></div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
