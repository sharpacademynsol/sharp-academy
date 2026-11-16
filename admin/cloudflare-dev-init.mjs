import path from "node:path";
import fs from "node:fs";
import { fileURLToPath } from "node:url";
import { initOpenNextCloudflareForDev } from "@opennextjs/cloudflare";

const adminDir = path.dirname(fileURLToPath(import.meta.url));

export function ensureSharedWranglerState(fromDir = adminDir) {
  const v3Path = path.resolve(fromDir, "../.wrangler/state/v3");
  if (!fs.existsSync(v3Path)) {
    try {
      fs.mkdirSync(v3Path, { recursive: true });
    } catch {}
  }
  return v3Path;
}

export function initAdminCloudflareDev() {
  if (
    process.env.NODE_ENV === "production" ||
    process.env.NEXT_PHASE === "phase-production-build"
  ) {
    return;
  }

  const sharedWranglerPersist = ensureSharedWranglerState(adminDir);

  initOpenNextCloudflareForDev({
    configPath: path.join(adminDir, "wrangler.toml"),
    persist: { path: sharedWranglerPersist },
    remoteBindings: false,
  });
}
