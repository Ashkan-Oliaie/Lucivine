import { api } from "./client";
import type { GrimoireEntry, Paginated, SpellCast, SpellList } from "./types";

export async function fetchSpellList(): Promise<SpellList> {
  const { data } = await api.get<SpellList>("/spells/");
  return data;
}

export async function castSpell(input: {
  spell: string;
  dream_entry?: string | null;
  success_rating: number;
  notes?: string;
}): Promise<SpellCast> {
  const { data } = await api.post<SpellCast>("/spells/cast/", input);
  return data;
}

export async function listSpellCasts(): Promise<Paginated<SpellCast>> {
  const { data } = await api.get<Paginated<SpellCast>>("/spells/cast/");
  return data;
}

export async function fetchGrimoire(): Promise<GrimoireEntry[]> {
  const { data } = await api.get<GrimoireEntry[]>("/spells/grimoire/");
  return data;
}
