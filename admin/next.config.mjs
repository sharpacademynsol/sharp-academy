import { initAdminCloudflareDev } from "./cloudflare-dev-init.mjs";

initAdminCloudflareDev();

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
};

export default nextConfig;
