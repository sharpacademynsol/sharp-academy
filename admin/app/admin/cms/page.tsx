import { query } from "@/lib/db";
import CmsManager from "./CmsManager";

export const dynamic = "force-dynamic";

export default async function CmsPage() {
  const slidesRaw = await query("SELECT * FROM homepage_hero_slides ORDER BY sort_order ASC, id ASC");
  const activitiesRaw = await query("SELECT * FROM homepage_activities ORDER BY sort_order ASC, id ASC");
  const settingsRows = await query("SELECT key, value FROM site_settings WHERE key LIKE 'activities_%'");

  const initialSettings: Record<string, string> = {
    activities_badge: "Real Academy Life & Methodology",
    activities_title: "Activities of Learning & Training in Action",
    activities_description: "Education at Sharp Academy extends far beyond passive memorization. We integrate physical fitness drills, 1-to-1 computer lab practice, and interactive academic problem solving."
  };
  settingsRows.forEach((r: any) => {
    initialSettings[r.key] = r.value;
  });

  const initialSlides = Array.isArray(slidesRaw) ? JSON.parse(JSON.stringify(slidesRaw)) : [];
  const initialActivities = Array.isArray(activitiesRaw) ? JSON.parse(JSON.stringify(activitiesRaw)) : [];

  return (
    <div className="w-full max-w-[1600px] mx-auto px-2 sm:px-4 py-4 space-y-6">
      <CmsManager 
        initialSlides={initialSlides} 
        initialActivities={initialActivities} 
        initialSettings={initialSettings} 
      />
    </div>
  );
}
