import { useState } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useAuthStore } from "@/stores/auth";
import { logout as apiLogout } from "@/api/auth";
import { QuickJournal } from "@/components/quick/QuickJournal";
import { QuickRC } from "@/components/quick/QuickRC";
import { LogoMark, LucivineWordmark } from "@/components/brand/LogoMark";
import { iconForNav } from "@/components/layout/navIcons";
import { IconEye, IconMoon } from "@/components/icons";
import { SECONDARY_NAV } from "./nav";
import { cn } from "@/lib/cn";

type Props = {
  onOpenDrawer: () => void;
};

export function Header({ onOpenDrawer }: Props) {
  const user = useAuthStore((s) => s.user);
  const refresh = useAuthStore((s) => s.refresh);
  const clear = useAuthStore((s) => s.clear);
  const navigate = useNavigate();

  const [journalOpen, setJournalOpen] = useState(false);
  const [rcOpen, setRcOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  async function onLogout() {
    if (refresh) {
      try {
        await apiLogout(refresh);
      } catch {
        // ignore
      }
    }
    clear();
    navigate("/login", { replace: true });
  }

  return (
    <>
      <header className="relative z-40 w-full rounded-[1.35rem] border border-white/[0.12] bg-black/[0.46] backdrop-blur-lg backdrop-saturate-110 shadow-[0_16px_52px_-32px_rgba(0,0,0,0.72)] ring-1 ring-white/[0.08]">
        <div className="flex h-[58px] w-full items-center gap-2 px-3 sm:px-5 md:h-[68px] md:gap-3 md:px-7">
          {/* Mobile nav toggle */}
          <button
            type="button"
            onClick={onOpenDrawer}
            className="md:hidden w-10 h-10 -ml-2 rounded-full flex items-center justify-center text-ink-secondary hover:text-ink-primary hover:bg-white/5 transition-colors focus-ring"
            aria-label="Open menu"
          >
            <span className="block w-5 h-[1.5px] bg-current relative before:absolute before:content-[''] before:left-0 before:right-0 before:h-[1.5px] before:bg-current before:-top-1.5 after:absolute after:content-[''] after:left-0 after:right-0 after:h-[1.5px] after:bg-current after:top-1.5" />
          </button>

          {/* Logo — interlocking-moons mark + Lucivine wordmark with breathing aurora halo */}
          <Link
            to="/"
            className="flex items-center gap-3 group focus-ring rounded-md"
          >
            <span className="relative w-9 h-9 md:w-10 md:h-10 flex items-center justify-center text-ink-primary">
              <span className="absolute inset-0 rounded-full bg-gradient-to-br from-accent-amethyst via-accent-rose/60 to-accent-azure/40 blur-md opacity-50 group-hover:opacity-90 transition-opacity animate-breathe" />
              <LogoMark size={32} className="relative" />
            </span>
            <span className="hidden sm:flex flex-col leading-none">
              <LucivineWordmark className="text-base md:text-lg text-ink-primary font-medium" />
              <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-ink-muted mt-1">
                Dream practice
              </span>
            </span>
          </Link>

          <div className="flex-1" />

          {/* Quick actions */}
          <QuickActionButton
            label="Reality check"
            onClick={() => setRcOpen(true)}
            icon={<IconEye size={16} />}
          />
          <QuickActionButton
            label="Inscribe dream"
            onClick={() => setJournalOpen(true)}
            icon={<IconMoon size={16} />}
            primary
          />

          {/* Avatar / menu */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setMenuOpen((o) => !o)}
              className="ml-1 md:ml-2 w-9 h-9 md:w-10 md:h-10 rounded-full bg-gradient-to-br from-accent-amethyst/40 to-accent-rose/30 border border-white/10 flex items-center justify-center focus-ring hover:border-accent-lavender/50 transition-colors"
              aria-label="Account"
            >
              <span className=" text-sm text-ink-primary">
                {(user?.display_name || user?.email || "?").slice(0, 1).toUpperCase()}
              </span>
            </button>
            <AnimatePresence>
              {menuOpen && (
                <>
                  <div
                    className="fixed inset-0 z-30"
                    onClick={() => setMenuOpen(false)}
                  />
                  <motion.div
                    initial={{ opacity: 0, y: -6, scale: 0.97 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -4, scale: 0.97 }}
                    transition={{ duration: 0.18 }}
                    className="absolute right-0 top-full mt-2 z-40 w-56 glass-strong rounded-xl shadow-glow overflow-hidden"
                  >
                    <div className="px-4 py-3 border-b border-white/5">
                      <p className=" text-ink-primary truncate">
                        {user?.display_name || "Seeker"}
                      </p>
                      <p className=" text-xs text-ink-muted truncate mt-0.5">
                        {user?.email}
                      </p>
                    </div>
                    <nav className="py-1.5">
                      {SECONDARY_NAV.map((item) => {
                        const Ico = iconForNav(item.to);
                        return (
                          <NavLink
                            key={item.to}
                            to={item.to}
                            onClick={() => setMenuOpen(false)}
                            className={({ isActive }) =>
                              cn(
                                "flex items-center gap-3 px-4 py-2 text-sm transition-colors",
                                isActive
                                  ? "text-ink-primary bg-white/5"
                                  : "text-ink-secondary hover:text-ink-primary hover:bg-white/5",
                              )
                            }
                          >
                            <span className="text-accent-lavender/80 w-4 flex items-center justify-center">
                              {Ico ? <Ico size={15} /> : <span>{item.glyph}</span>}
                            </span>
                            <span>{item.label}</span>
                          </NavLink>
                        );
                      })}
                    </nav>
                    <button
                      type="button"
                      onClick={() => {
                        setMenuOpen(false);
                        onLogout();
                      }}
                      className="w-full px-4 py-3 border-t border-white/5 text-left text-xs font-semibold uppercase tracking-wide text-accent-rose hover:bg-accent-rose/5 transition-colors"
                    >
                      Depart
                    </button>
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </div>
        </div>
      </header>

      <QuickJournal open={journalOpen} onClose={() => setJournalOpen(false)} />
      <QuickRC open={rcOpen} onClose={() => setRcOpen(false)} />
    </>
  );
}

function QuickActionButton({
  label,
  icon,
  onClick,
  primary = false,
}: {
  label: string;
  icon: React.ReactNode;
  onClick: () => void;
  primary?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "group relative inline-flex items-center gap-2 rounded-full transition-all focus-ring",
        primary
          ? "h-10 md:h-11 pl-3 pr-4 md:pl-4 md:pr-5 bg-gradient-to-br from-accent-amethyst to-accent-rose/80 text-ink-primary shadow-[0_8px_24px_-12px_rgba(124,92,255,0.7)] hover:shadow-[0_12px_32px_-10px_rgba(255,137,184,0.6)] hover:brightness-110 active:scale-[0.97]"
          : "h-10 md:h-11 px-3 md:px-4 bg-white/[0.06] border border-white/10 text-ink-secondary hover:text-ink-primary hover:bg-white/[0.1] hover:border-accent-lavender/40 active:scale-[0.97]",
      )}
      aria-label={label}
    >
      <span className={cn(primary ? "text-ink-primary" : "text-accent-lavender")}>
        {icon}
      </span>
      <span className="hidden sm:inline text-xs font-semibold tracking-wide">
        {label}
      </span>
    </button>
  );
}
