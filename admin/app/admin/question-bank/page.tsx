import { query } from "@/lib/db";
import QuestionBankManager from "./QuestionBankManager";

export const dynamic = "force-dynamic";

export default async function QuestionBankPage() {
  const coursesRaw = await query("SELECT id, title, code FROM courses WHERE is_active = 1 ORDER BY title ASC");
  const courses = Array.isArray(coursesRaw) ? coursesRaw : [];

  const statsRaw = await query(`
    SELECT 
      COUNT(*) as total,
      SUM(CASE WHEN difficulty = 'easy' THEN 1 ELSE 0 END) as easy_count,
      SUM(CASE WHEN difficulty = 'medium' THEN 1 ELSE 0 END) as medium_count,
      SUM(CASE WHEN difficulty = 'hard' THEN 1 ELSE 0 END) as hard_count,
      SUM(CASE WHEN question_type = 'mcq' THEN 1 ELSE 0 END) as mcq_count,
      SUM(CASE WHEN question_type = 'non_verbal' THEN 1 ELSE 0 END) as non_verbal_count,
      SUM(CASE WHEN question_type = 'verbal_reasoning' THEN 1 ELSE 0 END) as verbal_count,
      SUM(CASE WHEN question_type = 'fill_blank' THEN 1 ELSE 0 END) as blank_count,
      SUM(CASE WHEN question_type = 'numerical' THEN 1 ELSE 0 END) as num_count,
      SUM(usage_count) as total_usages
    FROM question_bank
  `);
  const stats = statsRaw[0] || {
    total: 0,
    easy_count: 0,
    medium_count: 0,
    hard_count: 0,
    mcq_count: 0,
    non_verbal_count: 0,
    verbal_count: 0,
    blank_count: 0,
    num_count: 0,
    total_usages: 0
  };

  // By default, questions are not loaded on initial page load for instant performance
  // They are loaded on demand based on user-selected filter criteria
  const initialQuestions: any[] = [];

  return (
    <div className="w-full max-w-[1600px] mx-auto px-2 sm:px-4 space-y-6">
      <QuestionBankManager 
        courses={courses} 
        stats={stats} 
        initialQuestions={initialQuestions} 
      />
    </div>
  );
}
