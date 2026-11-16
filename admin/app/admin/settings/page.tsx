import { query, execute } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { Building2, Landmark, Plus, Trash2, CheckCircle2, ShieldCheck } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const settingsRows = await query("SELECT key, value FROM site_settings");
  const settingsMap: Record<string, string> = {};
  settingsRows.forEach((r: any) => {
    settingsMap[r.key] = r.value;
  });

  const bankAccounts = await query("SELECT * FROM bank_accounts ORDER BY id ASC");

  // Server Action: Update Site Settings
  async function updateProfile(formData: FormData) {
    "use server";
    const keys = ["academy_name", "tagline", "contact_phone", "contact_email", "address", "current_term"];
    for (const k of keys) {
      const val = formData.get(k);
      if (val !== null) {
        await execute(
          "INSERT INTO site_settings (key, value, updated_at) VALUES (?, ?, CURRENT_TIMESTAMP) ON CONFLICT(key) DO UPDATE SET value = ?, updated_at = CURRENT_TIMESTAMP",
          [k, val, val]
        );
      }
    }
    revalidatePath("/admin/settings");
    revalidatePath("/admin/layout");
  }

  // Server Action: Add Bank Account
  async function addBankAccount(formData: FormData) {
    "use server";
    const bankName = formData.get("bank_name");
    const accountTitle = formData.get("account_title");
    const accountNumber = formData.get("account_number");
    const iban = formData.get("iban") || "";

    if (bankName && accountTitle && accountNumber) {
      await execute(
        "INSERT INTO bank_accounts (bank_name, account_title, account_number, iban, is_active) VALUES (?, ?, ?, ?, 1)",
        [bankName, accountTitle, accountNumber, iban]
      );
    }
    revalidatePath("/admin/settings");
  }

  // Server Action: Delete Bank Account
  async function deleteBankAccount(formData: FormData) {
    "use server";
    const id = formData.get("id");
    if (id) {
      await execute("DELETE FROM bank_accounts WHERE id = ?", [id]);
    }
    revalidatePath("/admin/settings");
  }

  // Server Action: Toggle Bank Account Status
  async function toggleBankStatus(formData: FormData) {
    "use server";
    const id = formData.get("id");
    const current = formData.get("current_status");
    const nextStatus = current === "1" ? 0 : 1;
    if (id) {
      await execute("UPDATE bank_accounts SET is_active = ? WHERE id = ?", [nextStatus, id]);
    }
    revalidatePath("/admin/settings");
  }

  return (
    <div className="space-y-8 max-w-5xl">
      <div>
        <h1 className="text-2xl font-black text-slate-900 font-heading">Academy System Settings</h1>
        <p className="text-sm text-slate-500 mt-1">Configure academy institutional profile, official fee deposit accounts, and Cloudflare edge parameters.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left 2 Cols: Profile Form & Bank Accounts CRUD */}
        <div className="lg:col-span-2 space-y-8">
          {/* Institutional Profile Card */}
          <div className="bg-white p-7 rounded-3xl border border-slate-200/80 shadow-sm space-y-6">
            <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
              <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
                <Building2 className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-bold text-slate-900 font-heading">Institution Identity & Contact Info</h2>
                <p className="text-xs text-slate-500">Public profile displayed across admissions and student portal.</p>
              </div>
            </div>

            <form action={updateProfile} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">Academy Official Name</label>
                  <input type="text" name="academy_name" defaultValue={settingsMap["academy_name"] || "Sharp Academy"} required className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">Active Academic Term</label>
                  <input type="text" name="current_term" defaultValue={settingsMap["current_term"] || "Fall 2026 Session"} required className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold text-blue-600 font-mono" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">Brand Tagline / Mission</label>
                <input type="text" name="tagline" defaultValue={settingsMap["tagline"] || "Empowering Minds, Shaping Futures at the Edge"} className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm" />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">Official Contact Phone</label>
                  <input type="text" name="contact_phone" defaultValue={settingsMap["contact_phone"] || "0300-1234567"} className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-mono" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">Support Email Address</label>
                  <input type="email" name="contact_email" defaultValue={settingsMap["contact_email"] || "info@sharpacademy.pk"} className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-mono" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">Main Campus Address</label>
                <input type="text" name="address" defaultValue={settingsMap["address"] || "Main Campus, Gulberg III, Lahore, Pakistan"} className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm" />
              </div>

              <div className="pt-2">
                <button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs px-6 py-3 rounded-xl transition shadow-sm">
                  Save Changes
                </button>
              </div>
            </form>
          </div>

          {/* Bank Accounts CRUD Card */}
          <div className="bg-white p-7 rounded-3xl border border-slate-200/80 shadow-sm space-y-6">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
                  <Landmark className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-slate-900 font-heading">Fee Deposit Bank Accounts</h2>
                  <p className="text-xs text-slate-500">Official accounts shown to students for tuition vouchers.</p>
                </div>
              </div>
            </div>

            {/* Existing Accounts List */}
            <div className="space-y-3">
              {bankAccounts.map((b: any) => (
                <div key={b.id} className="p-4 rounded-2xl border border-slate-200 flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <strong className="text-slate-900 text-sm">{b.bank_name}</strong>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${
                        b.is_active ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500'
                      }`}>
                        {b.is_active ? 'Active' : 'Disabled'}
                      </span>
                    </div>
                    <span className="text-xs text-slate-600 mt-1 block">Title: {b.account_title} • No: <span className="font-mono font-semibold">{b.account_number}</span></span>
                    {b.iban && <span className="text-[11px] text-slate-400 font-mono block">IBAN: {b.iban}</span>}
                  </div>

                  <div className="flex items-center gap-2">
                    <form action={toggleBankStatus}>
                      <input type="hidden" name="id" value={b.id} />
                      <input type="hidden" name="current_status" value={b.is_active ? "1" : "0"} />
                      <button type="submit" className="text-xs font-bold text-slate-600 hover:text-slate-900 px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 transition">
                        {b.is_active ? "Deactivate" : "Activate"}
                      </button>
                    </form>

                    <form action={deleteBankAccount}>
                      <input type="hidden" name="id" value={b.id} />
                      <button type="submit" className="p-2 text-slate-400 hover:text-red-600 transition">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </form>
                  </div>
                </div>
              ))}
            </div>

            {/* Add Bank Account Form */}
            <form action={addBankAccount} className="bg-slate-50 p-5 rounded-2xl border border-slate-200/80 space-y-3">
              <h3 className="text-xs font-black uppercase text-slate-700 tracking-wider">+ Add New Payment Account</h3>
              <div className="grid grid-cols-2 gap-3">
                <input type="text" name="bank_name" placeholder="Bank Name (e.g. Meezan Bank, JazzCash)" required className="px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs bg-white" />
                <input type="text" name="account_title" placeholder="Account Title (e.g. Sharp Academy)" required className="px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs bg-white" />
                <input type="text" name="account_number" placeholder="Account / Phone Number" required className="px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs bg-white font-mono" />
                <input type="text" name="iban" placeholder="IBAN (Optional)" className="px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs bg-white font-mono" />
              </div>
              <button type="submit" className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-5 py-2.5 rounded-xl transition shadow-sm">
                Add Bank Account
              </button>
            </form>
          </div>
        </div>

        {/* Right Col: Cloudflare Edge Bindings (Live Inspector) */}
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm space-y-4">
            <div className="flex items-center gap-2 text-blue-600 font-bold text-sm">
              <ShieldCheck className="w-5 h-5" />
              <span>Cloudflare Architecture</span>
            </div>
            <p className="text-xs text-slate-500 leading-relaxed">
              Sharp Academy runs on serverless edge compute with dedicated D1 SQLite storage and zero-egress R2 object buckets.
            </p>

            <div className="space-y-2.5 pt-2 text-xs font-mono">
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                <span className="text-[10px] text-slate-400 uppercase block font-sans font-bold">Cloudflare Account</span>
                <span className="text-slate-800 break-all">asifslk2024@gmail.com</span>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                <span className="text-[10px] text-slate-400 uppercase block font-sans font-bold">Account ID</span>
                <span className="text-blue-600 break-all">5c2cc3256370248706dbcde865e3cb6d</span>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                <span className="text-[10px] text-slate-400 uppercase block font-sans font-bold">D1 Database ID</span>
                <span className="text-slate-800 break-all">6aa14e2c-9ad6-48de-ba39-ce28176b77ee</span>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                <span className="text-[10px] text-slate-400 uppercase block font-sans font-bold">R2 Storage Bucket</span>
                <span className="text-slate-800">sharp-materials</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
