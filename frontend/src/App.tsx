import { Navigate, Route, Routes, useLocation } from "react-router-dom";
import { AnimatePresence } from "framer-motion";
import { ProtectedRoute } from "@/routes/ProtectedRoute";
import { AppShell } from "@/components/layout/AppShell";
import { AuroraBackdrop } from "@/components/visuals/AuroraBackdrop";
import { StarField } from "@/components/visuals/StarField";
import Login from "@/features/auth/Login";
import Register from "@/features/auth/Register";
import VerifyEmailPage from "@/features/auth/VerifyEmailPage";
import Dashboard from "@/features/dashboard/Dashboard";
import RealityPage from "@/features/reality/RealityPage";
import ProgramPage from "@/features/program/ProgramPage";
import JournalListPage from "@/features/journal/JournalListPage";
import JournalEditorPage from "@/features/journal/JournalEditorPage";
import ChakraListPage from "@/features/chakras/ChakraListPage";
import ChakraSessionPage from "@/features/chakras/ChakraSessionPage";
import SpellsPage from "@/features/spells/SpellsPage";
import RemindersPage from "@/features/reminders/RemindersPage";
import AnalyticsPage from "@/features/analytics/AnalyticsPage";
import TransitionPage from "@/features/transition/TransitionPage";
import SettingsPage from "@/features/settings/SettingsPage";
import OnboardingPage from "@/features/onboarding/OnboardingPage";
import { useAuthStore } from "@/stores/auth";
import { ReactNode, useEffect } from "react";
import { useReminderDueFlush } from "@/hooks/useReminderDueFlush";

function Protected({ children }: { children: ReactNode }) {
  return (
    <ProtectedRoute>
      <AppShell>{children}</AppShell>
    </ProtectedRoute>
  );
}

function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen flex items-center justify-center px-5 py-16">
      <div className="w-full max-w-md">
        <div className="mb-8 flex flex-col items-center gap-3 text-center">
          <span className="relative w-14 h-14 flex items-center justify-center">
            <span className="absolute inset-0 rounded-full bg-gradient-to-br from-accent-amethyst via-accent-rose/70 to-accent-azure/60 blur-lg opacity-80 animate-breathe" />
            <span className="absolute inset-[3px] rounded-full bg-void/80 border border-white/10" />
            <span className="relative text-2xl text-ink-primary">✷</span>
          </span>
          <p className="text-2xl text-gradient">Lucivine</p>
          <p className="ritual-eyebrow">Cross the threshold</p>
        </div>
        {children}
      </div>
    </div>
  );
}

export default function App() {
  const location = useLocation();
  const access = useAuthStore((s) => s.access);
  const chakraRoute = location.pathname.startsWith("/chakras");

  useReminderDueFlush(Boolean(access));

  useEffect(() => {
    document.documentElement.toggleAttribute("data-chakra-route", chakraRoute);
  }, [chakraRoute]);

  return (
    <>
      <AuroraBackdrop boostChakraRoute={chakraRoute} />
      <StarField />
      {/* Practice fog portals here — inside #root, between aurora/stars (z-1/2) and routes (z-10).
          Body-only portals stack under #root z-40 and looked clipped/absent. */}
      <div
        id="chakra-ambient-root"
        className="pointer-events-none fixed inset-0 z-[5] overflow-visible"
        aria-hidden
      />
      <div className="relative z-[10] flex min-h-[100dvh] flex-col">
        <AnimatePresence mode="wait">
          <Routes location={location} key={location.pathname}>
          <Route
            path="/login"
            element={access ? <Navigate to="/" replace /> : <AuthLayout><Login /></AuthLayout>}
          />
          <Route
            path="/register"
            element={access ? <Navigate to="/" replace /> : <AuthLayout><Register /></AuthLayout>}
          />

          <Route
            path="/verify-email"
            element={
              access ? (
                <AuthLayout><VerifyEmailPage /></AuthLayout>
              ) : (
                <Navigate to="/login" replace />
              )
            }
          />

          <Route
            path="/onboarding"
            element={
              <ProtectedRoute>
                <OnboardingPage />
              </ProtectedRoute>
            }
          />

          <Route path="/" element={<Protected><ProgramPage /></Protected>} />
          <Route path="/dashboard" element={<Protected><Dashboard /></Protected>} />
          <Route path="/reality" element={<Protected><RealityPage /></Protected>} />
          <Route path="/program" element={<Navigate to="/" replace />} />
          <Route path="/journal" element={<Protected><JournalListPage /></Protected>} />
          <Route path="/journal/new" element={<Protected><JournalEditorPage /></Protected>} />
          <Route path="/journal/:id" element={<Protected><JournalEditorPage /></Protected>} />
          <Route path="/chakras/browse" element={<Protected><ChakraListPage /></Protected>} />
          <Route path="/chakras/:id" element={<Protected><ChakraSessionPage /></Protected>} />
          <Route path="/chakras" element={<Navigate to="/chakras/root" replace />} />
          <Route path="/spells" element={<Protected><SpellsPage /></Protected>} />
          <Route path="/reminders" element={<Protected><RemindersPage /></Protected>} />
          <Route path="/analytics" element={<Protected><AnalyticsPage /></Protected>} />
          <Route path="/transition" element={<Protected><TransitionPage /></Protected>} />
          <Route path="/settings" element={<Protected><SettingsPage /></Protected>} />

          <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </AnimatePresence>
      </div>
    </>
  );
}
