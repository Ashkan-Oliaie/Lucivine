import { api } from "./client";
import type { Chakra, ChakraSession, ChakraStats, Paginated } from "./types";

export async function fetchChakras(): Promise<Chakra[]> {
  const { data } = await api.get<Chakra[]>("/meditation/chakras/");
  return data;
}

export async function listChakraSessions(): Promise<Paginated<ChakraSession>> {
  const { data } = await api.get<Paginated<ChakraSession>>("/meditation/sessions/");
  return data;
}

export async function createChakraSession(input: {
  chakra_id: string;
  duration_seconds: number;
  frequency_hz?: number;
  mantra?: string;
  notes?: string;
}): Promise<ChakraSession> {
  const { data } = await api.post<ChakraSession>("/meditation/sessions/", input);
  return data;
}

export async function fetchChakraStats(): Promise<ChakraStats> {
  const { data } = await api.get<ChakraStats>("/meditation/sessions/stats/");
  return data;
}
