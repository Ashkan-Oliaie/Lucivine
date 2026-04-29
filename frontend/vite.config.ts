import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import { djangoApiProxyPlugin } from "./vite-plugins/api-proxy";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/** Monorepo root on disk (host dev). Inside Docker `frontend` is mounted alone at `/app` — no sibling ../backend. */
function resolveRepoRoot(): string {
  const parent = path.resolve(__dirname, "..");
  const looksLikeMonorepo = fs.existsSync(path.join(parent, "backend", "manage.py"));
  return looksLikeMonorepo ? parent : __dirname;
}

/** Backend URL for the dev-server proxy only (never exposed to the browser). */
function resolveProxyTarget(env: Record<string, string>): string {
  const fallback = "http://127.0.0.1:8000";
  const raw =
    process.env.VITE_PROXY_BACKEND?.trim() ||
    env.VITE_PROXY_BACKEND?.trim();

  const runningInContainer =
    fs.existsSync("/.dockerenv") || fs.existsSync("/run/.containerenv");

  if (runningInContainer) {
    return raw || "http://backend:8000";
  }

  if (!raw) return fallback;

  try {
    const u = new URL(raw);
    if (u.hostname === "backend") return fallback;
    return raw;
  } catch {
    return fallback;
  }
}

export default defineConfig(({ mode }) => {
  const repoRoot = resolveRepoRoot();
  const rootEnv = loadEnv(mode, repoRoot, "");
  const feEnv = loadEnv(mode, __dirname, "");
  const mergedEnv = { ...rootEnv, ...feEnv };

  const proxyTarget = resolveProxyTarget(mergedEnv);

  return {
    envDir: repoRoot,
    plugins: [
      djangoApiProxyPlugin(proxyTarget),
      react(),
    ],
    server: {
      host: true,
      port: 5173,
      watch: { usePolling: true },
    },
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "src"),
      },
    },
  };
});
