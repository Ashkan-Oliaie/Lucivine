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
import http from "node:http";
/**
 * Vite's built-in server.proxy occasionally fails to intercept /api (SPA fallback serves index.html).
 * This Connect middleware runs early and forwards /api verbatim to Django during dev.
 */
export function djangoApiProxyPlugin(targetOrigin) {
    var target = new URL(targetOrigin.startsWith("http") ? targetOrigin : "http://".concat(targetOrigin));
    return {
        name: "django-api-proxy",
        enforce: "pre",
        configureServer: function (server) {
            server.middlewares.use(function (req, res, next) {
                var _a;
                var pathWithQuery = (_a = req.url) !== null && _a !== void 0 ? _a : "";
                if (!pathWithQuery.startsWith("/api")) {
                    next();
                    return;
                }
                var port = target.port !== ""
                    ? Number(target.port)
                    : target.protocol === "https:"
                        ? 443
                        : 80;
                var proxyReq = http.request({
                    hostname: target.hostname,
                    port: port,
                    path: pathWithQuery,
                    method: req.method,
                    headers: __assign(__assign({}, req.headers), { host: target.host }),
                }, function (proxyRes) {
                    var _a;
                    res.writeHead((_a = proxyRes.statusCode) !== null && _a !== void 0 ? _a : 502, proxyRes.headers);
                    proxyRes.pipe(res);
                });
                proxyReq.on("error", function (err) {
                    var _a;
                    res.statusCode = 502;
                    res.setHeader("Content-Type", "text/plain; charset=utf-8");
                    res.end("Dev API proxy could not reach ".concat(targetOrigin, " (").concat((_a = err.code) !== null && _a !== void 0 ? _a : err.message, "). Is Django running?"));
                });
                req.pipe(proxyReq);
            });
        },
    };
}
