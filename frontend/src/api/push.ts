import { api } from "./client";

export type PushSubscriptionRecord = {
  id: string;
  endpoint: string;
  p256dh: string;
  auth: string;
  user_agent: string;
  created_at: string;
};

export async function fetchVapidPublicKey(): Promise<string> {
  const { data } = await api.get<{ public_key: string }>("/push/vapid-public-key/");
  return data.public_key;
}

export async function listMySubscriptions(): Promise<{ count: number; results: PushSubscriptionRecord[] }> {
  const { data } = await api.get<{ count: number; results: PushSubscriptionRecord[] }>(
    "/push/subscriptions/",
  );
  return data;
}

export async function registerPushSubscription(
  sub: PushSubscriptionJSON,
  userAgent: string,
): Promise<PushSubscriptionRecord> {
  const { data } = await api.post<PushSubscriptionRecord>("/push/subscriptions/", {
    endpoint: sub.endpoint,
    p256dh: sub.keys?.p256dh ?? "",
    auth: sub.keys?.auth ?? "",
    user_agent: userAgent,
  });
  return data;
}

export async function unregisterPushSubscription(endpoint: string): Promise<void> {
  await api.post("/push/subscriptions/unsubscribe/", { endpoint });
}

export async function sendTestPush(): Promise<{ delivered: number; errors: string[] }> {
  const { data } = await api.post<{ delivered: number; errors: string[] }>(
    "/push/subscriptions/test/",
  );
  return data;
}
