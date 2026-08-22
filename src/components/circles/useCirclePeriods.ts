import { useCallback, useState } from "react";

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

export interface CircleDef {
  id: string;
  name: string;
  shortName: string;
  definition: string;
  fill: string;
  fillSel: string;
  stroke: string;
}

export interface Period {
  id: string;
  label: string;
  numbers: Record<string, number>;
  narrative?: string; // pattern-of-activity description, for LSA reports
  goals?: string; // stated goals for the period, for LSA reports
}

// ─────────────────────────────────────────────────────────────────────────────
// Circle definitions — outer → inner
// ─────────────────────────────────────────────────────────────────────────────

export const CIRCLES: CircleDef[] = [
  {
    id: "widest",
    name: "Widest Circle",
    shortName: "Neighborhood",
    definition:
      "Neighborhood total number — the broadest boundary of your community outreach.",
    fill: "rgba(0, 212, 255, 0.06)",
    fillSel: "rgba(0, 212, 255, 0.18)",
    stroke: "#00d4ff",
  },
  {
    id: "conversation",
    name: "Conversation",
    shortName: "Conversation",
    definition:
      "Anyone currently or previously interacting with the Word of God at any level — devotions, home visits, activities, coloring sheet, etc.",
    fill: "rgba(20, 170, 255, 0.08)",
    fillSel: "rgba(20, 170, 255, 0.20)",
    stroke: "#14aaff",
  },
  {
    id: "protagonists",
    name: "Protagonists",
    shortName: "Protagonists",
    definition:
      "Friends at any level who show a sense of ownership in the process — expanding to others, hosting devotionals, sharing coloring sheets, helping with festivals and home visits.",
    fill: "rgba(80, 130, 255, 0.10)",
    fillSel: "rgba(80, 130, 255, 0.22)",
    stroke: "#5082ff",
  },
  {
    id: "institute",
    name: "Institute Participants",
    shortName: "Institute",
    definition:
      "Anyone at any stage or mode in a class, group or study circle.",
    fill: "rgba(130, 100, 255, 0.12)",
    fillSel: "rgba(130, 100, 255, 0.24)",
    stroke: "#8264ff",
  },
  {
    id: "facilitating",
    name: "Facilitating Education",
    shortName: "Facilitating",
    definition:
      "Youth and Adults assisting or facilitating the educational programs at any stage or training level.",
    fill: "rgba(160, 85, 247, 0.14)",
    fillSel: "rgba(160, 85, 247, 0.26)",
    stroke: "#a055f7",
  },
  {
    id: "accompanying",
    name: "Accompanying",
    shortName: "Accompanying",
    definition:
      "Friends accompanying — the tutor/animator or tutor/teacher concept. Those guiding and mentoring others through the process.",
    fill: "rgba(168, 85, 247, 0.20)",
    fillSel: "rgba(168, 85, 247, 0.35)",
    stroke: "#a855f7",
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// Period persistence — shared by the Circles diagram and the LSA report
// ─────────────────────────────────────────────────────────────────────────────

const STORAGE_KEY = "cc-periods-v1";

function currentPeriodLabel(): string {
  const d = new Date();
  return `${d.getMonth() < 6 ? "H1" : "H2"} ${d.getFullYear()}`;
}

function mkPeriod(label: string): Period {
  return {
    id: `p${Date.now()}${Math.random().toString(36).slice(2, 5)}`,
    label,
    numbers: Object.fromEntries(CIRCLES.map((c) => [c.id, 0])),
    narrative: "",
    goals: "",
  };
}

function loadPeriods(): Period[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Period[];
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch {}
  return [mkPeriod(currentPeriodLabel())];
}

function savePeriods(p: Period[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(p));
}

export function useCirclePeriods() {
  const [periods, setPeriods] = useState<Period[]>(loadPeriods);
  const [activePId, setActivePId] = useState<string>(
    () => periods[periods.length - 1]!.id,
  );

  const activePeriod =
    periods.find((p) => p.id === activePId) ?? periods[periods.length - 1]!;

  const setNumber = useCallback(
    (circleId: string, n: number) => {
      setPeriods((prev) => {
        const next = prev.map((p) =>
          p.id === activePId
            ? { ...p, numbers: { ...p.numbers, [circleId]: n } }
            : p,
        );
        savePeriods(next);
        return next;
      });
    },
    [activePId],
  );

  const setNarrative = useCallback(
    (text: string) => {
      setPeriods((prev) => {
        const next = prev.map((p) =>
          p.id === activePId ? { ...p, narrative: text } : p,
        );
        savePeriods(next);
        return next;
      });
    },
    [activePId],
  );

  const setGoals = useCallback(
    (text: string) => {
      setPeriods((prev) => {
        const next = prev.map((p) =>
          p.id === activePId ? { ...p, goals: text } : p,
        );
        savePeriods(next);
        return next;
      });
    },
    [activePId],
  );

  const addPeriod = useCallback((label: string) => {
    const lbl = label.trim();
    if (!lbl) return;
    const p = mkPeriod(lbl);
    setPeriods((prev) => {
      const next = [...prev, p];
      savePeriods(next);
      return next;
    });
    setActivePId(p.id);
  }, []);

  const removePeriod = useCallback(
    (id: string) => {
      setPeriods((prev) => {
        if (prev.length <= 1) return prev;
        const next = prev.filter((p) => p.id !== id);
        savePeriods(next);
        if (activePId === id) setActivePId(next[next.length - 1]!.id);
        return next;
      });
    },
    [activePId],
  );

  return {
    periods,
    activePId,
    setActivePId,
    activePeriod,
    setNumber,
    setNarrative,
    setGoals,
    addPeriod,
    removePeriod,
  };
}
