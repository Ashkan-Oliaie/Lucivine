import http from "node:http";
import type { IncomingMessage, ServerResponse } from "node:http";
import type { Plugin } from "vite";

/**
 * Vite's built-in server.proxy occasionally fails to intercept /api (SPA fallback serves index.html).
 * This Connect middleware runs early and forwards /api verbatim to Django during dev.
 */
export function djangoApiProxyPlugin(targetOrigin: string): Plugin {
  const target = new URL(targetOrigin.startsWith("http") ? targetOrigin : `http://${targetOrigin}`);

  return {
    name: "django-api-proxy",
    enforce: "pre",
    configureServer(server) {
      server.middlewares.use((req: IncomingMessage, res: ServerResponse, next: () => void) => {
        const pathWithQuery = req.url ?? "";
        if (!pathWithQuery.startsWith("/api")) {
          next();
          return;
        }

        const port =
          target.port !== ""
            ? Number(target.port)
            : target.protocol === "https:"
              ? 443
              : 80;

        const proxyReq = http.request(
          {
            hostname: target.hostname,
            port,
            path: pathWithQuery,
            method: req.method,
            headers: {
              ...req.headers,
              host: target.host,
            },
          },
          (proxyRes: http.IncomingMessage) => {
            res.writeHead(proxyRes.statusCode ?? 502, proxyRes.headers);
            proxyRes.pipe(res);
          },
        );

        proxyReq.on("error", (err: Error & { code?: string }) => {
          res.statusCode = 502;
          res.setHeader("Content-Type", "text/plain; charset=utf-8");
          res.end(
            `Dev API proxy could not reach ${targetOrigin} (${err.code ?? err.message}). Is Django running?`,
          );
        });

        req.pipe(proxyReq);
      });
    },
  };
}
