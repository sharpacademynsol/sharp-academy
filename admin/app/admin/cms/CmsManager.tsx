"use client";

import React, { useState, useRef, useEffect } from "react";
import { 
  Globe, 
  Layers, 
  Image as ImageIcon, 
  Plus, 
  Edit3, 
  Trash2, 
  Eye, 
  Upload, 
  ArrowUp, 
  ArrowDown, 
  Check, 
  Copy, 
  ExternalLink, 
  Sparkles, 
  Save, 
  X,
  Sliders,
  CheckCircle2,
  AlertCircle,
  Loader2,
  FolderOpen
} from "lucide-react";

interface HeroSlide {
  id: number;
  badge: string;
  title: string;
  highlight_text?: string;
  description: string;
  features_json?: string;
  primary_cta_text?: string;
  primary_cta_url?: string;
  secondary_cta_text?: string;
  secondary_cta_url?: string;
  image_url: string;
  tab_label: string;
  tab_title: string;
  sort_order: number;
  is_active: number;
}

interface ActivityItem {
  id: number;
  category_badge: string;
  badge_color: string;
  title: string;
  description: string;
  tags_json?: string;
  image_url: string;
  link_text?: string;
  link_url?: string;
  sort_order: number;
  is_active: number;
}

const PRESET_IMAGES = [
  { url: "/images/cadets-drill.jpg", label: "Cadets Drill & Physical Stamina" },
  { url: "/images/computer-literacy.jpg", label: "Computer Literacy & PC Lab" },
  { url: "/images/cadets-classroom.jpg", label: "Classroom Coaching & Board Prep" },
  { url: "/images/cadets-obstacle.jpg", label: "Confidence Obstacle & Interview Prep" },
];

interface ImagePickerFieldProps {
  label: string;
  value: string;
  onChange: (url: string) => void;
  recentUploads: string[];
  onImageUploaded: (url: string) => void;
  showNotification: (text: string, type?: "success" | "error") => void;
  helperText?: string;
}

function ImagePickerField({
  label,
  value,
  onChange,
  recentUploads,
  onImageUploaded,
  showNotification,
  helperText = "Upload your own photo or pick from presets"
}: ImagePickerFieldProps) {
  const [uploading, setUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [showLibrary, setShowLibrary] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = async (file: File) => {
    if (!file) return;
    if (!file.type.startsWith("image/") && !/\.(jpe?g|png|webp|svg)$/i.test(file.name)) {
      showNotification("Please select an image file (PNG, JPG, JPEG, WEBP, SVG)", "error");
      return;
    }

    setUploading(true);
    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch("/api/admin/homepage/upload", {
        method: "POST",
        body: formData,
      });
      const data = (await res.json()) as any;
      if (data.success && data.url) {
        onChange(data.url);
        onImageUploaded(data.url);
        showNotification("Image uploaded and selected successfully!");
      } else {
        showNotification(data.error || "Failed to upload image", "error");
      }
    } catch (err: any) {
      showNotification(err.message || "Failed to upload image", "error");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleFile(file);
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="block text-xs font-bold text-slate-700 uppercase">{label}</label>
        <span className="text-[11px] text-slate-400">{helperText}</span>
      </div>

      <div
        onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        className={`p-3 rounded-2xl border-2 transition-all bg-white flex flex-col gap-3 ${
          isDragging 
            ? "border-blue-500 bg-blue-50/40 ring-4 ring-blue-500/10" 
            : "border-slate-200/90 hover:border-slate-300"
        }`}
      >
        <div className="flex flex-col sm:flex-row items-center gap-3">
          {/* Visual Preview Box */}
          <div className="relative w-24 h-16 sm:w-28 sm:h-20 rounded-xl overflow-hidden bg-slate-900 border border-slate-200 shrink-0 flex items-center justify-center group shadow-xs">
            {value ? (
              <>
                <img
                  src={value}
                  alt="Selected preview"
                  className="w-full h-full object-cover transition-transform group-hover:scale-105 duration-300"
                  onError={(e) => {
                    (e.currentTarget as HTMLElement).style.display = "none";
                  }}
                />
                <a
                  href={value}
                  target="_blank"
                  rel="noreferrer"
                  className="absolute inset-0 bg-slate-950/60 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white transition-opacity text-[10px] font-bold gap-1"
                  title="View full image in new tab"
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>Preview</span>
                </a>
              </>
            ) : (
              <div className="flex flex-col items-center justify-center text-slate-400 text-center p-1">
                <ImageIcon className="w-5 h-5 text-slate-400 mb-0.5" />
                <span className="text-[9px] font-bold">No Image</span>
              </div>
            )}
          </div>

          {/* Input & Action Buttons */}
          <div className="flex-1 w-full space-y-2">
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={value || ""}
                onChange={(e) => onChange(e.target.value)}
                placeholder="/images/cadets-drill.jpg or /uploads/..."
                required
                className="flex-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              />

              {value && (
                <button
                  type="button"
                  onClick={() => onChange("")}
                  className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                  title="Clear image URL"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Action Buttons: Upload New & Browse Library */}
            <div className="flex items-center gap-2 flex-wrap">
              <input
                type="file"
                ref={fileInputRef}
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleFile(file);
                }}
                accept="image/png,image/jpeg,image/jpg,image/webp,image/svg+xml"
                className="hidden"
              />

              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="px-3.5 py-1.5 rounded-xl text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 transition flex items-center gap-1.5 shadow-xs disabled:opacity-50"
              >
                {uploading ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Uploading...</span>
                  </>
                ) : (
                  <>
                    <Upload className="w-3.5 h-3.5" />
                    <span>Upload New Image</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={() => setShowLibrary(!showLibrary)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold border transition flex items-center gap-1.5 ${
                  showLibrary
                    ? "bg-slate-800 text-white border-slate-800"
                    : "bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200"
                }`}
              >
                <FolderOpen className="w-3.5 h-3.5" />
                <span>{showLibrary ? "Hide Library" : "Browse Library"}</span>
              </button>

              <span className="text-[11px] text-slate-400 hidden sm:inline">
                or drag & drop image here
              </span>
            </div>
          </div>
        </div>

        {/* Collapsible Visual Media Library Picker */}
        {showLibrary && (
          <div className="pt-3 border-t border-slate-100 space-y-2 animate-in fade-in duration-150">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-800">Choose from Available Photos</span>
              <span className="text-[11px] text-slate-400">Click any image to select</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 max-h-48 overflow-y-auto p-1 bg-slate-50/60 rounded-xl border border-slate-200/60">
              {PRESET_IMAGES.map((img) => {
                const isSelected = value === img.url;
                return (
                  <button
                    type="button"
                    key={img.url}
                    onClick={() => {
                      onChange(img.url);
                      setShowLibrary(false);
                    }}
                    className={`relative rounded-xl overflow-hidden border-2 text-left group transition-all p-1 bg-white flex flex-col justify-between ${
                      isSelected ? "border-blue-600 ring-2 ring-blue-500/20" : "border-slate-200 hover:border-blue-400"
                    }`}
                  >
                    <div className="relative h-16 w-full rounded-lg overflow-hidden bg-slate-900">
                      <img src={img.url} alt={img.label} className="w-full h-full object-cover group-hover:scale-105 transition" />
                      {isSelected && (
                        <div className="absolute top-1 right-1 bg-blue-600 text-white rounded-full p-0.5">
                          <Check className="w-3 h-3" />
                        </div>
                      )}
                    </div>
                    <span className="text-[10px] font-bold text-slate-700 mt-1 truncate block px-0.5">{img.label}</span>
                  </button>
                );
              })}

              {recentUploads.map((url) => {
                const isSelected = value === url;
                return (
                  <button
                    type="button"
                    key={url}
                    onClick={() => {
                      onChange(url);
                      setShowLibrary(false);
                    }}
                    className={`relative rounded-xl overflow-hidden border-2 text-left group transition-all p-1 bg-white flex flex-col justify-between ${
                      isSelected ? "border-blue-600 ring-2 ring-blue-500/20" : "border-slate-200 hover:border-blue-400"
                    }`}
                  >
                    <div className="relative h-16 w-full rounded-lg overflow-hidden bg-slate-900">
                      <img src={url} alt="Uploaded" className="w-full h-full object-cover group-hover:scale-105 transition" />
                      {isSelected && (
                        <div className="absolute top-1 right-1 bg-blue-600 text-white rounded-full p-0.5">
                          <Check className="w-3 h-3" />
                        </div>
                      )}
                    </div>
                    <span className="text-[10px] font-bold text-slate-700 mt-1 truncate block px-0.5">Custom Upload</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Quick Select Pills */}
        <div className="flex items-center gap-1.5 flex-wrap pt-1 border-t border-slate-100">
          <span className="text-[11px] text-slate-400 font-semibold mr-1">Quick Select:</span>
          {PRESET_IMAGES.map((img) => (
            <button
              type="button"
              key={img.url}
              onClick={() => onChange(img.url)}
              className={`text-[10px] px-2.5 py-1 rounded-lg border font-semibold transition ${
                value === img.url 
                  ? "bg-blue-600 text-white border-blue-600" 
                  : "bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200"
              }`}
            >
              {img.label.split(" ")[0]}
            </button>
          ))}
          {recentUploads.slice(0, 3).map((url, idx) => (
            <button
              type="button"
              key={url}
              onClick={() => onChange(url)}
              className={`text-[10px] px-2.5 py-1 rounded-lg border font-semibold transition ${
                value === url 
                  ? "bg-blue-600 text-white border-blue-600" 
                  : "bg-purple-50 hover:bg-purple-100 text-purple-700 border-purple-200"
              }`}
            >
              Upload {idx + 1}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function CmsManager({
  initialSlides,
  initialActivities,
  initialSettings
}: {
  initialSlides: HeroSlide[];
  initialActivities: ActivityItem[];
  initialSettings: Record<string, string>;
}) {
  const [activeTab, setActiveTab] = useState<"hero" | "activities" | "media">("hero");
  
  // Slides state
  const [slides, setSlides] = useState<HeroSlide[]>(initialSlides);
  const [slideModalOpen, setSlideModalOpen] = useState(false);
  const [editingSlide, setEditingSlide] = useState<Partial<HeroSlide> | null>(null);

  // Activities state
  const [activities, setActivities] = useState<ActivityItem[]>(initialActivities);
  const [actModalOpen, setActModalOpen] = useState(false);
  const [editingActivity, setEditingActivity] = useState<Partial<ActivityItem> | null>(null);

  // Settings state (Activities section header)
  const [settings, setSettings] = useState(initialSettings);
  const [isSavingSettings, setIsSavingSettings] = useState(false);
  const [settingsSavedMsg, setSettingsSavedMsg] = useState(false);

  // Media upload state
  const [uploadedImages, setUploadedImages] = useState<string[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [copiedUrl, setCopiedUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Status message
  const [notification, setNotification] = useState<{ text: string; type: "success" | "error" } | null>(null);

  const showNotification = (text: string, type: "success" | "error" = "success") => {
    setNotification({ text, type });
    setTimeout(() => setNotification(null), 3500);
  };

  // Load existing uploaded files from server on mount
  useEffect(() => {
    fetch("/api/admin/homepage/upload")
      .then((r) => r.json())
      .then((data: any) => {
        if (data.success && Array.isArray(data.files)) {
          setUploadedImages(data.files);
        }
      })
      .catch((err) => console.warn("Notice: could not load existing uploads:", err));
  }, []);

  // ==========================================
  // SLIDE ACTIONS
  // ==========================================
  const handleOpenAddSlide = () => {
    setEditingSlide({
      badge: "Premier Admission & Academic Coaching",
      title: "Empowering Academic Ambitions &",
      highlight_text: "Entrance Test Success",
      description: "Specialized coaching for competitive college, university, and Cadet College admissions.",
      features_json: JSON.stringify([
        { icon: "★", text: "98.6% Pass Rate", color: "text-amber-400" },
        { icon: "✓", text: "Computerized Mock Tests", color: "text-blue-400" }
      ]),
      primary_cta_text: "Explore Coaching",
      primary_cta_url: "/courses",
      secondary_cta_text: "Apply for Admission",
      secondary_cta_url: "/admissions",
      image_url: "/images/cadets-drill.jpg",
      tab_label: "Entrance Prep",
      tab_title: "Admissions Coaching",
      sort_order: slides.length,
      is_active: 1
    });
    setSlideModalOpen(true);
  };

  const handleOpenEditSlide = (slide: HeroSlide) => {
    setEditingSlide({ ...slide });
    setSlideModalOpen(true);
  };

  const handleSaveSlide = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingSlide?.title || !editingSlide?.description || !editingSlide?.image_url) {
      showNotification("Please fill in the required fields (Title, Description, Image)", "error");
      return;
    }

    try {
      const isNew = !editingSlide.id;
      const url = "/api/admin/homepage/slides";
      const method = isNew ? "POST" : "PUT";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editingSlide)
      });
      const data = (await res.json()) as any;

      if (!data.success) {
        showNotification(data.error || "Failed to save slide", "error");
        return;
      }

      if (isNew) {
        setSlides([...slides, { ...editingSlide, id: data.id } as HeroSlide]);
      } else {
        setSlides(slides.map(s => s.id === editingSlide.id ? { ...editingSlide } as HeroSlide : s));
      }

      setSlideModalOpen(false);
      setEditingSlide(null);
      showNotification(isNew ? "New slide created successfully!" : "Slide updated successfully!");
    } catch (err: any) {
      showNotification(err.message || "Failed to save slide", "error");
    }
  };

  const handleDeleteSlide = async (id: number) => {
    if (!confirm("Are you sure you want to delete this hero slide?")) return;
    try {
      const res = await fetch(`/api/admin/homepage/slides?id=${id}`, { method: "DELETE" });
      const data = (await res.json()) as any;
      if (data.success) {
        setSlides(slides.filter(s => s.id !== id));
        showNotification("Slide deleted successfully!");
      } else {
        showNotification(data.error || "Failed to delete slide", "error");
      }
    } catch (err: any) {
      showNotification(err.message || "Failed to delete slide", "error");
    }
  };

  const handleToggleSlideActive = async (slide: HeroSlide) => {
    const updated = { ...slide, is_active: slide.is_active ? 0 : 1 };
    try {
      await fetch("/api/admin/homepage/slides", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updated)
      });
      setSlides(slides.map(s => s.id === slide.id ? updated : s));
      showNotification(`Slide is now ${updated.is_active ? "Visible" : "Hidden"} on portal!`);
    } catch (err) {
      showNotification("Failed to toggle status", "error");
    }
  };

  const handleMoveSlide = async (index: number, direction: "up" | "down") => {
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= slides.length) return;

    const newSlides = [...slides];
    const current = newSlides[index];
    const target = newSlides[targetIndex];

    const currentOrder = current.sort_order;
    current.sort_order = target.sort_order;
    target.sort_order = currentOrder;

    newSlides[index] = target;
    newSlides[targetIndex] = current;
    setSlides(newSlides);

    // Save orders
    await fetch("/api/admin/homepage/slides", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...current, sort_order: current.sort_order })
    });
    await fetch("/api/admin/homepage/slides", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...target, sort_order: target.sort_order })
    });
    showNotification("Slide reordered!");
  };

  // ==========================================
  // ACTIVITIES ACTIONS
  // ==========================================
  const handleOpenAddActivity = () => {
    setEditingActivity({
      category_badge: "Academic Coaching",
      badge_color: "emerald",
      title: "Interactive Academy Training Sessions",
      description: "Concept-first problem solving drills with master mentors.",
      tags_json: JSON.stringify(["Concept Mastery", "Practice Quizzes", "Mentorship"]),
      image_url: "/images/cadets-classroom.jpg",
      link_text: "View Syllabus",
      link_url: "/courses",
      sort_order: activities.length,
      is_active: 1
    });
    setActModalOpen(true);
  };

  const handleOpenEditActivity = (act: ActivityItem) => {
    setEditingActivity({ ...act });
    setActModalOpen(true);
  };

  const handleSaveActivity = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingActivity?.title || !editingActivity?.description || !editingActivity?.image_url) {
      showNotification("Please fill in Title, Description, and Image URL", "error");
      return;
    }

    try {
      const isNew = !editingActivity.id;
      const url = "/api/admin/homepage/activities";
      const method = isNew ? "POST" : "PUT";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editingActivity)
      });
      const data = (await res.json()) as any;

      if (!data.success) {
        showNotification(data.error || "Failed to save activity", "error");
        return;
      }

      if (isNew) {
        setActivities([...activities, { ...editingActivity, id: data.id } as ActivityItem]);
      } else {
        setActivities(activities.map(a => a.id === editingActivity.id ? { ...editingActivity } as ActivityItem : a));
      }

      setActModalOpen(false);
      setEditingActivity(null);
      showNotification(isNew ? "New activity card created!" : "Activity updated successfully!");
    } catch (err: any) {
      showNotification(err.message || "Failed to save activity", "error");
    }
  };

  const handleDeleteActivity = async (id: number) => {
    if (!confirm("Are you sure you want to delete this activity card?")) return;
    try {
      const res = await fetch(`/api/admin/homepage/activities?id=${id}`, { method: "DELETE" });
      const data = (await res.json()) as any;
      if (data.success) {
        setActivities(activities.filter(a => a.id !== id));
        showNotification("Activity card deleted!");
      } else {
        showNotification(data.error || "Failed to delete activity", "error");
      }
    } catch (err: any) {
      showNotification(err.message || "Failed to delete", "error");
    }
  };

  const handleToggleActivityActive = async (act: ActivityItem) => {
    const updated = { ...act, is_active: act.is_active ? 0 : 1 };
    try {
      await fetch("/api/admin/homepage/activities", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updated)
      });
      setActivities(activities.map(a => a.id === act.id ? updated : a));
      showNotification(`Activity is now ${updated.is_active ? "Visible" : "Hidden"}!`);
    } catch {
      showNotification("Failed to toggle status", "error");
    }
  };

  // ==========================================
  // SETTINGS SAVE (Activities Header)
  // ==========================================
  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingSettings(true);
    try {
      const res = await fetch("/api/admin/homepage/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings)
      });
      const data = (await res.json()) as any;
      if (data.success) {
        setSettingsSavedMsg(true);
        setTimeout(() => setSettingsSavedMsg(false), 3000);
        showNotification("Activities section header updated!");
      } else {
        showNotification(data.error || "Failed to save settings", "error");
      }
    } catch (err: any) {
      showNotification(err.message || "Failed to save", "error");
    } finally {
      setIsSavingSettings(false);
    }
  };

  // ==========================================
  // MEDIA UPLOAD
  // ==========================================
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setUploadError(null);

    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch("/api/admin/homepage/upload", {
        method: "POST",
        body: formData
      });
      const data = (await res.json()) as any;

      if (!data.success) {
        setUploadError(data.error || "Upload failed");
        showNotification(data.error || "Upload failed", "error");
      } else {
        setUploadedImages(prev => [data.url, ...prev]);
        showNotification("Image uploaded successfully! Copied to library.");
      }
    } catch (err: any) {
      setUploadError(err.message || "Upload failed");
      showNotification("Upload failed", "error");
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedUrl(text);
    setTimeout(() => setCopiedUrl(null), 2500);
    showNotification("Image URL copied to clipboard!");
  };

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {notification && (
        <div className={`fixed bottom-6 right-6 z-50 px-4 py-3 rounded-2xl shadow-xl border flex items-center gap-2.5 text-xs font-bold animate-in slide-in-from-bottom-4 duration-200 ${
          notification.type === "success" 
            ? "bg-slate-900 text-white border-slate-700" 
            : "bg-rose-600 text-white border-rose-500"
        }`}>
          {notification.type === "success" ? <CheckCircle2 className="w-4 h-4 text-emerald-400" /> : <AlertCircle className="w-4 h-4 text-white" />}
          <span>{notification.text}</span>
        </div>
      )}

      {/* 1. Header & Live Portal Shortcut */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-blue-500/20">
              <Globe className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-2xl font-black text-slate-900 font-heading">Portal Home Page CMS</h1>
              <p className="text-xs text-slate-500 mt-0.5">
                Dynamic control for Hero Slider, Activities of Learning & Training in Action, and media assets.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <a
            href="http://localhost:8787"
            target="_blank"
            rel="noreferrer"
            className="text-xs font-bold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200/80 px-4 py-2.5 rounded-xl transition shadow-xs flex items-center gap-1.5 active:scale-95"
          >
            <span>Preview Live Portal</span>
            <ExternalLink className="w-3.5 h-3.5 text-blue-600" />
          </a>
        </div>
      </div>

      {/* 2. Top Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
        <button
          onClick={() => setActiveTab("hero")}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition ${
            activeTab === "hero"
              ? "bg-blue-600 text-white shadow-sm"
              : "text-slate-600 hover:bg-slate-100"
          }`}
        >
          <Sparkles className="w-4 h-4" />
          <span>Hero Section Slider ({slides.length})</span>
        </button>

        <button
          onClick={() => setActiveTab("activities")}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition ${
            activeTab === "activities"
              ? "bg-blue-600 text-white shadow-sm"
              : "text-slate-600 hover:bg-slate-100"
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>Activities of Learning ({activities.length})</span>
        </button>

        <button
          onClick={() => setActiveTab("media")}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition ${
            activeTab === "media"
              ? "bg-blue-600 text-white shadow-sm"
              : "text-slate-600 hover:bg-slate-100"
          }`}
        >
          <ImageIcon className="w-4 h-4" />
          <span>Image & Media Library</span>
        </button>
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: HERO SECTION SLIDER */}
      {/* ========================================================================= */}
      {activeTab === "hero" && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
            <div>
              <h2 className="text-sm font-bold text-slate-900">Hero Section Slides</h2>
              <p className="text-xs text-slate-500">
                Interactive full-screen slider on the portal home page with smooth Ken-Burns background animations and bottom progress tabs.
              </p>
            </div>
            <button
              onClick={handleOpenAddSlide}
              className="text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 px-4 py-2.5 rounded-xl transition shadow-xs flex items-center gap-1.5 self-start sm:self-auto active:scale-95"
            >
              <Plus className="w-4 h-4" />
              <span>+ Add Hero Slide</span>
            </button>
          </div>

          {/* Slides List */}
          <div className="grid grid-cols-1 gap-4">
            {slides.map((slide, idx) => {
              const features = (() => {
                try {
                  return slide.features_json ? JSON.parse(slide.features_json) : [];
                } catch {
                  return [];
                }
              })();

              return (
                <div 
                  key={slide.id}
                  className={`bg-white rounded-2xl border transition p-4 sm:p-5 shadow-xs flex flex-col lg:flex-row gap-5 items-stretch ${
                    slide.is_active ? "border-slate-200/90" : "border-slate-200 opacity-60 bg-slate-50/50"
                  }`}
                >
                  {/* Thumbnail Preview */}
                  <div className="relative w-full lg:w-72 h-44 rounded-xl overflow-hidden bg-slate-950 shrink-0 border border-slate-200 shadow-inner group">
                    <img 
                      src={slide.image_url} 
                      alt={slide.title} 
                      className="w-full h-full object-cover brightness-75 group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent"></div>
                    <div className="absolute top-2.5 left-2.5">
                      <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-md bg-blue-600 text-white shadow-xs">
                        Slide {idx + 1}
                      </span>
                    </div>
                    <div className="absolute bottom-2.5 left-2.5 right-2.5">
                      <span className="text-[10px] text-amber-300 font-bold block truncate">
                        {slide.tab_label} • {slide.tab_title}
                      </span>
                    </div>
                  </div>

                  {/* Content Details */}
                  <div className="flex-1 space-y-2.5 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-[10px] font-bold text-blue-700 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded-full">
                        {slide.badge}
                      </span>
                      {!slide.is_active && (
                        <span className="text-[10px] font-bold text-slate-500 bg-slate-200 px-2 py-0.5 rounded-full">
                          Hidden from Portal
                        </span>
                      )}
                    </div>

                    <h3 className="text-base sm:text-lg font-black text-slate-900 leading-snug">
                      {slide.title} <span className="text-blue-600">{slide.highlight_text}</span>
                    </h3>

                    <p className="text-xs text-slate-600 leading-relaxed line-clamp-2">
                      {slide.description}
                    </p>

                    {/* Features Badges Preview */}
                    {features.length > 0 && (
                      <div className="flex items-center gap-1.5 flex-wrap pt-1">
                        {features.map((f: any, fIdx: number) => (
                          <span key={fIdx} className="text-[11px] bg-slate-100 text-slate-700 px-2 py-0.5 rounded-md font-medium border border-slate-200">
                            {f.icon} {f.text}
                          </span>
                        ))}
                      </div>
                    )}

                    {/* CTAs */}
                    <div className="flex items-center gap-3 pt-1 text-xs font-semibold text-slate-500">
                      <span>Primary: <strong className="text-slate-800">{slide.primary_cta_text}</strong> ({slide.primary_cta_url})</span>
                      <span>•</span>
                      <span>Secondary: <strong className="text-slate-800">{slide.secondary_cta_text}</strong> ({slide.secondary_cta_url})</span>
                    </div>
                  </div>

                  {/* Right Actions & Controls */}
                  <div className="flex lg:flex-col items-center justify-between lg:justify-center gap-2 shrink-0 border-t lg:border-t-0 lg:border-l border-slate-100 pt-3 lg:pt-0 lg:pl-4">
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleMoveSlide(idx, "up")}
                        disabled={idx === 0}
                        className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 disabled:opacity-30 transition"
                        title="Move Up"
                      >
                        <ArrowUp className="w-3.5 h-3.5 text-slate-600" />
                      </button>
                      <button
                        onClick={() => handleMoveSlide(idx, "down")}
                        disabled={idx === slides.length - 1}
                        className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 disabled:opacity-30 transition"
                        title="Move Down"
                      >
                        <ArrowDown className="w-3.5 h-3.5 text-slate-600" />
                      </button>
                    </div>

                    <button
                      onClick={() => handleToggleSlideActive(slide)}
                      className={`text-[11px] font-bold px-3 py-1.5 rounded-xl border transition ${
                        slide.is_active 
                          ? "bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100" 
                          : "bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-200"
                      }`}
                    >
                      {slide.is_active ? "Active" : "Inactive"}
                    </button>

                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => handleOpenEditSlide(slide)}
                        className="p-2 rounded-xl text-xs font-bold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 transition"
                        title="Edit Slide"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDeleteSlide(slide.id)}
                        className="p-2 rounded-xl text-xs font-bold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 transition"
                        title="Delete Slide"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: ACTIVITIES OF LEARNING & TRAINING IN ACTION */}
      {/* ========================================================================= */}
      {activeTab === "activities" && (
        <div className="space-y-6">
          {/* Section 2 Header Settings Card */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h2 className="text-sm font-bold text-slate-900">Section Header & Description</h2>
                <p className="text-xs text-slate-500">Configure the title, badge, and intro text displayed above the activities grid on the portal.</p>
              </div>
              {settingsSavedMsg && (
                <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-3 py-1 rounded-lg border border-emerald-200 flex items-center gap-1">
                  <Check className="w-3.5 h-3.5" /> Saved
                </span>
              )}
            </div>

            <form onSubmit={handleSaveSettings} className="space-y-3.5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Section Badge</label>
                  <input
                    type="text"
                    value={settings.activities_badge || ""}
                    onChange={(e) => setSettings({ ...settings, activities_badge: e.target.value })}
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                    placeholder="e.g. Real Academy Life & Methodology"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Section Main Heading</label>
                  <input
                    type="text"
                    value={settings.activities_title || ""}
                    onChange={(e) => setSettings({ ...settings, activities_title: e.target.value })}
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                    placeholder="e.g. Activities of Learning & Training in Action"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Section Subtitle / Description</label>
                <textarea
                  rows={2}
                  value={settings.activities_description || ""}
                  onChange={(e) => setSettings({ ...settings, activities_description: e.target.value })}
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  placeholder="Introductory paragraph explaining academy methodology..."
                />
              </div>

              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={isSavingSettings}
                  className="text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 px-4 py-2 rounded-xl transition shadow-xs flex items-center gap-1.5"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>{isSavingSettings ? "Saving..." : "Save Section Header"}</span>
                </button>
              </div>
            </form>
          </div>

          {/* Activities Cards Management */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
            <div>
              <h2 className="text-sm font-bold text-slate-900">Activity Cards ({activities.length})</h2>
              <p className="text-xs text-slate-500">
                Cards displayed in the 4-column responsive grid showing academy training, lab sessions, and campus life.
              </p>
            </div>
            <button
              onClick={handleOpenAddActivity}
              className="text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 px-4 py-2.5 rounded-xl transition shadow-xs flex items-center gap-1.5 self-start sm:self-auto active:scale-95"
            >
              <Plus className="w-4 h-4" />
              <span>+ Add Activity Card</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
            {activities.map((act) => {
              const tags = (() => {
                try {
                  return act.tags_json ? JSON.parse(act.tags_json) : [];
                } catch {
                  return [];
                }
              })();

              return (
                <div 
                  key={act.id}
                  className={`bg-white rounded-2xl border overflow-hidden shadow-xs hover:shadow-md transition flex flex-col justify-between ${
                    act.is_active ? "border-slate-200/90" : "border-slate-200 opacity-60 bg-slate-50/50"
                  }`}
                >
                  <div>
                    {/* Image with Tag */}
                    <div className="relative h-44 overflow-hidden bg-slate-950">
                      <img 
                        src={act.image_url} 
                        alt={act.title}
                        className="w-full h-full object-cover" 
                      />
                      <div className="absolute top-2.5 left-2.5 bg-slate-950/80 backdrop-blur-md text-amber-300 text-[11px] font-bold px-2 py-0.5 rounded-lg border border-amber-400/20">
                        {act.category_badge}
                      </div>
                      <div className="absolute top-2.5 right-2.5">
                        <button
                          onClick={() => handleToggleActivityActive(act)}
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-md shadow ${
                            act.is_active ? "bg-emerald-500 text-white" : "bg-slate-700 text-white"
                          }`}
                        >
                          {act.is_active ? "Active" : "Hidden"}
                        </button>
                      </div>
                    </div>

                    <div className="p-4 space-y-2">
                      <h3 className="text-sm font-black text-slate-900 leading-snug">
                        {act.title}
                      </h3>
                      <p className="text-xs text-slate-600 line-clamp-3 leading-relaxed">
                        {act.description}
                      </p>

                      {tags.length > 0 && (
                        <div className="flex flex-wrap gap-1 pt-1">
                          {tags.map((t: string, tIdx: number) => (
                            <span key={tIdx} className="text-[10px] bg-slate-100 text-slate-700 px-2 py-0.5 rounded font-medium">
                              {t}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="p-4 pt-0 border-t border-slate-100 mt-2 flex items-center justify-between">
                    <span className="text-[11px] font-bold text-blue-600 truncate max-w-[120px]">
                      {act.link_text} &rarr;
                    </span>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleOpenEditActivity(act)}
                        className="p-1.5 rounded-lg text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 transition"
                        title="Edit Activity"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDeleteActivity(act.id)}
                        className="p-1.5 rounded-lg text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 transition"
                        title="Delete Activity"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: IMAGE & MEDIA ASSET LIBRARY */}
      {/* ========================================================================= */}
      {activeTab === "media" && (
        <div className="space-y-6">
          {/* Upload Card */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
            <div>
              <h2 className="text-sm font-bold text-slate-900">Upload New Image Asset</h2>
              <p className="text-xs text-slate-500">
                Upload custom academy photos, campus pictures, student drills, or lab graphics. Automatically synced to the web portal.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-4">
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileUpload}
                accept="image/*"
                className="hidden"
                id="homepage-media-upload"
              />
              <label
                htmlFor="homepage-media-upload"
                className={`cursor-pointer px-5 py-3 rounded-xl border border-dashed border-blue-400 bg-blue-50/50 hover:bg-blue-100/60 text-blue-700 text-xs font-bold flex items-center gap-2 transition ${
                  isUploading ? "opacity-50 pointer-events-none" : ""
                }`}
              >
                <Upload className="w-4 h-4 text-blue-600" />
                <span>{isUploading ? "Uploading to Cloud..." : "Choose Image File (JPG, PNG, WEBP, SVG)"}</span>
              </label>

              {uploadError && (
                <span className="text-xs text-rose-600 font-semibold">{uploadError}</span>
              )}
            </div>
          </div>

          {/* Preset Images Gallery */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
            <div>
              <h2 className="text-sm font-bold text-slate-900">Official High-Resolution Academy Photos</h2>
              <p className="text-xs text-slate-500">Click &apos;Copy URL&apos; to paste into any hero slide or activity card.</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {PRESET_IMAGES.map((img) => (
                <div key={img.url} className="rounded-xl border border-slate-200 overflow-hidden bg-slate-900 shadow-xs flex flex-col justify-between group">
                  <div className="relative h-40 overflow-hidden">
                    <img 
                      src={img.url} 
                      alt={img.label} 
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  </div>
                  <div className="p-3 bg-white space-y-2">
                    <span className="text-xs font-bold text-slate-800 block truncate">{img.label}</span>
                    <span className="text-[10px] text-slate-400 font-mono block truncate">{img.url}</span>
                    <button
                      onClick={() => copyToClipboard(img.url)}
                      className="w-full py-1.5 rounded-lg text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 transition flex items-center justify-center gap-1.5"
                    >
                      {copiedUrl === img.url ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copiedUrl === img.url ? "Copied!" : "Copy Image Path"}</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Uploaded Images List if any */}
          {uploadedImages.length > 0 && (
            <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
              <div>
                <h2 className="text-sm font-bold text-slate-900">Recently Uploaded Media</h2>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {uploadedImages.map((url) => (
                  <div key={url} className="rounded-xl border border-slate-200 overflow-hidden bg-slate-900 shadow-xs flex flex-col justify-between">
                    <div className="relative h-40 overflow-hidden">
                      <img src={url} alt="Uploaded" className="w-full h-full object-cover" />
                    </div>
                    <div className="p-3 bg-white space-y-2">
                      <span className="text-[10px] text-slate-400 font-mono block truncate">{url}</span>
                      <button
                        onClick={() => copyToClipboard(url)}
                        className="w-full py-1.5 rounded-lg text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 transition flex items-center justify-center gap-1.5"
                      >
                        {copiedUrl === url ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                        <span>{copiedUrl === url ? "Copied!" : "Copy URL"}</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: ADD / EDIT HERO SLIDE */}
      {/* ========================================================================= */}
      {slideModalOpen && editingSlide && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-2xl w-full max-h-[90vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-150">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h2 className="text-base font-black text-slate-900 font-heading">
                  {editingSlide.id ? "Edit Hero Slide" : "Create New Hero Slide"}
                </h2>
                <p className="text-xs text-slate-500">Configure text, images, and CTAs for this hero presentation.</p>
              </div>
              <button 
                onClick={() => setSlideModalOpen(false)}
                className="p-1 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveSlide} className="p-6 space-y-4 overflow-y-auto flex-1">
              {/* Badge */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Badge Text</label>
                <input
                  type="text"
                  value={editingSlide.badge || ""}
                  onChange={(e) => setEditingSlide({ ...editingSlide, badge: e.target.value })}
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  placeholder="e.g. Premier Entrance Test Preparation"
                />
              </div>

              {/* Title & Highlight */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Main Headline Part</label>
                  <input
                    type="text"
                    value={editingSlide.title || ""}
                    onChange={(e) => setEditingSlide({ ...editingSlide, title: e.target.value })}
                    required
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                    placeholder="e.g. Empowering Academic Ambitions &"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Highlighted Text (Accent color)</label>
                  <input
                    type="text"
                    value={editingSlide.highlight_text || ""}
                    onChange={(e) => setEditingSlide({ ...editingSlide, highlight_text: e.target.value })}
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-blue-600 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                    placeholder="e.g. Entrance Test Success"
                  />
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Slide Description</label>
                <textarea
                  rows={3}
                  value={editingSlide.description || ""}
                  onChange={(e) => setEditingSlide({ ...editingSlide, description: e.target.value })}
                  required
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  placeholder="Comprehensive description of this coaching or skills track..."
                />
              </div>

              {/* Background Image with Integrated Upload Utility */}
              <ImagePickerField
                label="Background Image Asset"
                value={editingSlide.image_url || ""}
                onChange={(url) => setEditingSlide({ ...editingSlide, image_url: url })}
                recentUploads={uploadedImages}
                onImageUploaded={(url) => setUploadedImages((prev) => [url, ...prev])}
                showNotification={showNotification}
                helperText="High-res banner photo displayed in hero carousel"
              />

              {/* CTAs */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <div className="space-y-2 bg-slate-50 p-3 rounded-xl border border-slate-200">
                  <span className="text-[11px] font-bold text-blue-700 block">Primary Action Button</span>
                  <input
                    type="text"
                    value={editingSlide.primary_cta_text || ""}
                    onChange={(e) => setEditingSlide({ ...editingSlide, primary_cta_text: e.target.value })}
                    className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs"
                    placeholder="Button Text: e.g. Explore Coaching"
                  />
                  <input
                    type="text"
                    value={editingSlide.primary_cta_url || ""}
                    onChange={(e) => setEditingSlide({ ...editingSlide, primary_cta_url: e.target.value })}
                    className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-mono"
                    placeholder="URL: e.g. /courses/..."
                  />
                </div>

                <div className="space-y-2 bg-slate-50 p-3 rounded-xl border border-slate-200">
                  <span className="text-[11px] font-bold text-slate-700 block">Secondary Action Button</span>
                  <input
                    type="text"
                    value={editingSlide.secondary_cta_text || ""}
                    onChange={(e) => setEditingSlide({ ...editingSlide, secondary_cta_text: e.target.value })}
                    className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs"
                    placeholder="Button Text: e.g. Apply for Admission"
                  />
                  <input
                    type="text"
                    value={editingSlide.secondary_cta_url || ""}
                    onChange={(e) => setEditingSlide({ ...editingSlide, secondary_cta_url: e.target.value })}
                    className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-mono"
                    placeholder="URL: e.g. /admissions"
                  />
                </div>
              </div>

              {/* Bottom Tab Config */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Bottom Tab Label</label>
                  <input
                    type="text"
                    value={editingSlide.tab_label || ""}
                    onChange={(e) => setEditingSlide({ ...editingSlide, tab_label: e.target.value })}
                    required
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:bg-white"
                    placeholder="e.g. Entrance Prep"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Bottom Tab Sub-title</label>
                  <input
                    type="text"
                    value={editingSlide.tab_title || ""}
                    onChange={(e) => setEditingSlide({ ...editingSlide, tab_title: e.target.value })}
                    required
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:bg-white"
                    placeholder="e.g. Colleges & University Entry"
                  />
                </div>
              </div>

              <div className="pt-2 flex items-center justify-between border-t border-slate-100">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={editingSlide.is_active === 1}
                    onChange={(e) => setEditingSlide({ ...editingSlide, is_active: e.target.checked ? 1 : 0 })}
                    className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-xs font-bold text-slate-700">Slide is Active on Portal</span>
                </label>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setSlideModalOpen(false)}
                    className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 transition shadow-xs"
                  >
                    Save Slide
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: ADD / EDIT ACTIVITY CARD */}
      {/* ========================================================================= */}
      {actModalOpen && editingActivity && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-xl w-full max-h-[90vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-150">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h2 className="text-base font-black text-slate-900 font-heading">
                  {editingActivity.id ? "Edit Activity Card" : "New Activity of Learning"}
                </h2>
                <p className="text-xs text-slate-500">Configure visual card for the methodology and campus life section.</p>
              </div>
              <button 
                onClick={() => setActModalOpen(false)}
                className="p-1 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveActivity} className="p-6 space-y-4 overflow-y-auto flex-1">
              {/* Category Badge & Color */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Category Badge</label>
                  <input
                    type="text"
                    value={editingActivity.category_badge || ""}
                    onChange={(e) => setEditingActivity({ ...editingActivity, category_badge: e.target.value })}
                    required
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                    placeholder="e.g. Physical Stamina & Health"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Badge Theme Color</label>
                  <select
                    value={editingActivity.badge_color || "amber"}
                    onChange={(e) => setEditingActivity({ ...editingActivity, badge_color: e.target.value })}
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:bg-white"
                  >
                    <option value="amber">Amber / Gold</option>
                    <option value="cyan">Cyan / Tech Blue</option>
                    <option value="emerald">Emerald / Green</option>
                    <option value="blue">Blue / Navy</option>
                    <option value="rose">Rose / Red</option>
                  </select>
                </div>
              </div>

              {/* Title */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Activity Title</label>
                <input
                  type="text"
                  value={editingActivity.title || ""}
                  onChange={(e) => setEditingActivity({ ...editingActivity, title: e.target.value })}
                  required
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  placeholder="e.g. Morning Physical Fitness & Stamina Drills"
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Description</label>
                <textarea
                  rows={3}
                  value={editingActivity.description || ""}
                  onChange={(e) => setEditingActivity({ ...editingActivity, description: e.target.value })}
                  required
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  placeholder="Describe the training, routine, or methodology..."
                />
              </div>

              {/* Tags comma separated */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Tags (Comma-separated)</label>
                <input
                  type="text"
                  value={(() => {
                    try {
                      const parsed = editingActivity.tags_json ? JSON.parse(editingActivity.tags_json) : [];
                      return Array.isArray(parsed) ? parsed.join(", ") : "";
                    } catch {
                      return "";
                    }
                  })()}
                  onChange={(e) => {
                    const arr = e.target.value.split(",").map(t => t.trim()).filter(Boolean);
                    setEditingActivity({ ...editingActivity, tags_json: JSON.stringify(arr) });
                  }}
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:bg-white"
                  placeholder="Endurance Run, Agility Drill, Peak Stamina"
                />
              </div>

              {/* Activity Card Image with Integrated Upload Utility */}
              <ImagePickerField
                label="Activity Card Image Asset"
                value={editingActivity.image_url || ""}
                onChange={(url) => setEditingActivity({ ...editingActivity, image_url: url })}
                recentUploads={uploadedImages}
                onImageUploaded={(url) => setUploadedImages((prev) => [url, ...prev])}
                showNotification={showNotification}
                helperText="Card photo (e.g. drill grounds, PC lab, classroom)"
              />

              {/* Link Text and URL */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Card Link Text</label>
                  <input
                    type="text"
                    value={editingActivity.link_text || ""}
                    onChange={(e) => setEditingActivity({ ...editingActivity, link_text: e.target.value })}
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:bg-white"
                    placeholder="e.g. View Fitness Routines"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Card Link URL</label>
                  <input
                    type="text"
                    value={editingActivity.link_url || ""}
                    onChange={(e) => setEditingActivity({ ...editingActivity, link_url: e.target.value })}
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono focus:bg-white"
                    placeholder="e.g. /courses/cadet-college..."
                  />
                </div>
              </div>

              <div className="pt-2 flex items-center justify-between border-t border-slate-100">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={editingActivity.is_active === 1}
                    onChange={(e) => setEditingActivity({ ...editingActivity, is_active: e.target.checked ? 1 : 0 })}
                    className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-xs font-bold text-slate-700">Active on Portal</span>
                </label>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setActModalOpen(false)}
                    className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 transition shadow-xs"
                  >
                    Save Activity
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
