import type { ComponentType } from "react";
import {
  IconAnalytics,
  IconBell,
  IconChakras,
  IconInsights,
  IconJournal,
  IconProgram,
  IconQuests,
  IconReality,
  IconSettings,
  IconTransition,
  type IconProps,
} from "@/components/icons";

const MAP: Record<string, ComponentType<IconProps>> = {
  "/": IconProgram,
  "/journal": IconJournal,
  "/dashboard": IconInsights,
  "/chakras/root": IconChakras,
  "/quests": IconQuests,
  "/reality": IconReality,
  "/transition": IconTransition,
  "/analytics": IconAnalytics,
  "/reminders": IconBell,
  "/settings": IconSettings,
};

export function iconForNav(to: string): ComponentType<IconProps> | undefined {
  return MAP[to];
}
