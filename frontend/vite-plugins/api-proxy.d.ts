import type { Plugin } from "vite";
/**
 * Vite's built-in server.proxy occasionally fails to intercept /api (SPA fallback serves index.html).
 * This Connect middleware runs early and forwards /api verbatim to Django during dev.
 */
export declare function djangoApiProxyPlugin(targetOrigin: string): Plugin;
