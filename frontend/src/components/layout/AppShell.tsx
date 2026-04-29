import { ReactNode, useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { Header } from "./Header";
import { IslandSidebar } from "./IslandSidebar";
import { PRIMARY_NAV, SECONDARY_NAV } from "./nav";
import { cn } from "@/lib/cn";
import { useSidebarRail } from "@/hooks/useSidebarRail";
import { ChakraPracticeIslandRail } from "@/features/chakras/ChakraPracticeIslandRail";

export function AppShell({ children }: { children: ReactNode }) {
  const location = useLocation();
  const chakraSessionPath =
    /^\/chakras\/[^/]+$/.test(location.pathname) &&
    location.pathname !== "/chakras/browse";
  const [drawerOpen, setDrawerOpen] = useState(false);
  const { expanded: sidebarExpanded, toggle: toggleSidebar } = useSidebarRail(true);

  return (
    <div
      className={cn(
        "flex h-[100dvh] max-h-[100dvh] min-h-0 flex-col",
        chakraSessionPath ? "overflow-visible" : "overflow-hidden",
      )}
    >
      <div
        className={cn(
          "relative z-40 w-full shrink-0 pb-3 md:pb-4",
          "pt-[max(0.65rem,env(safe-area-inset-top))]",
          chakraSessionPath
            ? "px-2 sm:px-3 md:px-4"
            : "px-3 sm:px-4 md:px-6",
        )}
      >
        <Header onOpenDrawer={() => setDrawerOpen(true)} />
      </div>

      <div
        className={cn(
          "flex flex-1 min-h-0 gap-3 items-stretch pb-[max(1rem,env(safe-area-inset-bottom))] md:pb-6",
          chakraSessionPath
            ? "px-2 sm:px-3 md:px-4"
            : "px-3 sm:px-4 md:px-6",
        )}
      >
        <IslandSidebar expanded={sidebarExpanded} onToggle={toggleSidebar} />
        <ChakraPracticeIslandRail />

        {/* Mobile drawer */}
        <AnimatePresence>
          {drawerOpen && (
            <>
              <motion.div
                key="overlay"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                onClick={() => setDrawerOpen(false)}
                className="md:hidden fixed inset-0 z-40 bg-void/70 backdrop-blur-md"
              />
              <motion.div
                key="drawer"
                initial={{ x: "-100%" }}
                animate={{ x: 0 }}
                exit={{ x: "-100%" }}
                transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                className="md:hidden fixed left-0 top-0 bottom-0 z-50 w-[78vw] max-w-xs glass-strong border-r border-white/10 px-5 py-6 overflow-y-auto"
              >
                <p className="ritual-eyebrow mb-6">Navigate</p>
                <nav className="flex flex-col gap-1">
                  {[...PRIMARY_NAV, ...SECONDARY_NAV].map((item) => {
                    const chakraDrawerActive =
                      item.to === "/chakras/root" &&
                      location.pathname.startsWith("/chakras") &&
                      location.pathname !== "/chakras/browse";
                    return (
                    <NavLink
                      key={item.to}
                      to={item.to}
                      end={item.to === "/"}
                      onClick={() => setDrawerOpen(false)}
                      className={({ isActive }) => {
                        const drawerActive =
                          item.to === "/chakras/root" ? chakraDrawerActive : isActive;
                        return cn(
                          "flex items-center gap-3 px-3 py-3 rounded-lg text-base transition-colors",
                          drawerActive
                            ? "bg-accent-amethyst/15 text-ink-primary border border-accent-amethyst/30"
                            : "text-ink-secondary border border-transparent hover:bg-white/5 hover:text-ink-primary",
                        );
                      }}
                    >
                      <span className="text-accent-lavender/80 w-5 text-center text-lg">
                        {item.glyph}
                      </span>
                      <span>{item.label}</span>
                    </NavLink>
                  );
                  })}
                </nav>
              </motion.div>
            </>
          )}
        </AnimatePresence>

        {/* Main content — island shell pushes when sidebar expands */}
        <main
          className={cn(
            "flex-1 min-w-0 min-h-0 flex flex-col pt-3 md:pt-5 pb-28 md:pb-14 transition-[margin] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]",
            chakraSessionPath ? "overflow-visible min-h-0" : "overflow-hidden",
          )}
        >
          <div
            className={cn(
              "w-full flex-1 min-h-0 flex flex-col",
              chakraSessionPath
                ? "max-w-none mx-0 px-0 overflow-visible min-h-0"
                : "mx-auto max-w-6xl px-2 sm:px-3 md:px-5 lg:px-6 overflow-hidden",
            )}
          >
            <AnimatePresence mode="wait">
              <motion.div
                key={location.pathname}
                className={cn(
                  "flex-1 min-h-0 flex flex-col",
                  chakraSessionPath
                    ? "overflow-visible overscroll-none min-h-0"
                    : "overflow-y-auto overflow-x-hidden",
                )}
                {                ...(chakraSessionPath
                  ? {
                      initial: { opacity: 0 },
                      animate: { opacity: 1 },
                      exit: { opacity: 0 },
                      transition: { duration: 0.12 },
                    }
                  : {
                      initial: { opacity: 0, y: 8 },
                      animate: { opacity: 1, y: 0 },
                      exit: { opacity: 0, y: -4 },
                      transition: { duration: 0.28, ease: [0.22, 1, 0.36, 1] },
                    })}
              >
                {children}
              </motion.div>
            </AnimatePresence>
          </div>
        </main>
      </div>

      {/* Mobile bottom tab bar */}
      <nav
        className="md:hidden fixed bottom-3 inset-x-3 z-30 rounded-2xl border border-white/[0.09] backdrop-blur-xl bg-black/55 shadow-[0_12px_40px_-24px_rgba(0,0,0,0.55)] ring-1 ring-white/[0.06]"
        style={{
          paddingBottom: "max(0.65rem, env(safe-area-inset-bottom))",
        }}
      >
        <div className="flex">
          {PRIMARY_NAV.map((item) => {
            const chakraTabActive =
              item.to === "/chakras/root" &&
              location.pathname.startsWith("/chakras") &&
              location.pathname !== "/chakras/browse";
            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === "/"}
                className={({ isActive }) => {
                  const tabActive =
                    item.to === "/chakras/root" ? chakraTabActive : isActive;
                  return cn(
                    "relative flex-1 min-h-[58px] flex flex-col items-center justify-center gap-1 transition-colors",
                    tabActive ? "text-ink-primary" : "text-ink-muted",
                  );
                }}
              >
                {({ isActive }) => {
                  const tabActive =
                    item.to === "/chakras/root" ? chakraTabActive : isActive;
                  return (
                    <>
                      {tabActive && (
                        <motion.span
                          layoutId="tab-active"
                          className="absolute top-0 left-1/2 -translate-x-1/2 w-10 h-[2px] bg-gradient-to-r from-accent-amethyst to-accent-rose rounded-b-full"
                          transition={{
                            type: "spring",
                            stiffness: 380,
                            damping: 30,
                          }}
                        />
                      )}
                      <span
                        className={cn(
                          "text-lg transition-colors",
                          tabActive ? "text-accent-lavender" : "",
                        )}
                      >
                        {item.glyph}
                      </span>
                      <span className=" text-[10px] font-medium uppercase tracking-wide text-ink-muted">
                        {item.label}
                      </span>
                    </>
                  );
                }}
              </NavLink>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
