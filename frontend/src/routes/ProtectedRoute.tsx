import { ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuthStore } from "@/stores/auth";

/** Routes inside the app shell.
 * Requires: logged in + onboarded (unless already on /onboarding or /settings).
 */
export function ProtectedRoute({ children }: { children: ReactNode }) {
  const access = useAuthStore((s) => s.access);
  const user = useAuthStore((s) => s.user);
  const location = useLocation();

  if (!access) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  // First-time users land on /onboarding before anything else.
  // /settings stays accessible so users can edit profile mid-flow if needed.
  const onboardingRequired = user && !user.onboarded_at;
  const isOnboardingRoute = location.pathname.startsWith("/onboarding");
  const isSettingsRoute = location.pathname.startsWith("/settings");
  if (onboardingRequired && !isOnboardingRoute && !isSettingsRoute) {
    return <Navigate to="/onboarding" replace />;
  }

  return <>{children}</>;
}
