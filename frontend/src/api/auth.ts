import { api } from "./client";
import type { OnboardingInput, TokenPair, User } from "./types";

export async function register(input: {
  email: string;
  password: string;
  display_name?: string;
  timezone?: string;
}): Promise<TokenPair> {
  const { data } = await api.post<TokenPair>("/auth/register/", input);
  return data;
}

export async function login(input: { email: string; password: string }): Promise<TokenPair> {
  const { data } = await api.post<TokenPair>("/auth/login/", input);
  return data;
}

export async function fetchMe(): Promise<User> {
  const { data } = await api.get<User>("/auth/me/");
  return data;
}

export async function updateMe(input: Partial<Pick<User, "display_name" | "timezone" | "avatar_url">>): Promise<User> {
  const { data } = await api.patch<User>("/auth/me/", input);
  return data;
}

export async function logout(refresh: string): Promise<void> {
  await api.post("/auth/logout/", { refresh });
}

export async function verifyEmail(code: string): Promise<User> {
  const { data } = await api.post<User>("/auth/verify-email/", { code });
  return data;
}

export async function submitOnboarding(input: OnboardingInput): Promise<User> {
  const { data } = await api.post<User>("/auth/onboarding/", input);
  return data;
}

export async function skipOnboarding(): Promise<User> {
  const { data } = await api.post<User>("/auth/onboarding/skip/");
  return data;
}
