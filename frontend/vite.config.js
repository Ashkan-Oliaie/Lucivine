var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import { djangoApiProxyPlugin } from "./vite-plugins/api-proxy";
var __dirname = path.dirname(fileURLToPath(import.meta.url));
/** Monorepo root on disk (host dev). Inside Docker `frontend` is mounted alone at `/app` — no sibling ../backend. */
function resolveRepoRoot() {
    var parent = path.resolve(__dirname, "..");
    var looksLikeMonorepo = fs.existsSync(path.join(parent, "backend", "manage.py"));
    return looksLikeMonorepo ? parent : __dirname;
}
/** Backend URL for the dev-server proxy only (never exposed to the browser). */
function resolveProxyTarget(env) {
    var _a, _b;
    var fallback = "http://127.0.0.1:8000";
    var raw = ((_a = process.env.VITE_PROXY_BACKEND) === null || _a === void 0 ? void 0 : _a.trim()) ||
        ((_b = env.VITE_PROXY_BACKEND) === null || _b === void 0 ? void 0 : _b.trim());
    var runningInContainer = fs.existsSync("/.dockerenv") || fs.existsSync("/run/.containerenv");
    if (runningInContainer) {
        return raw || "http://backend:8000";
    }
    if (!raw)
        return fallback;
    try {
        var u = new URL(raw);
        if (u.hostname === "backend")
            return fallback;
        return raw;
    }
    catch (_c) {
        return fallback;
    }
}
export default defineConfig(function (_a) {
    var mode = _a.mode;
    var repoRoot = resolveRepoRoot();
    var rootEnv = loadEnv(mode, repoRoot, "");
    var feEnv = loadEnv(mode, __dirname, "");
    var mergedEnv = __assign(__assign({}, rootEnv), feEnv);
    var proxyTarget = resolveProxyTarget(mergedEnv);
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
