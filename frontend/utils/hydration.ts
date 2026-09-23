/** Default daily water goal in milliliters. */
export const DEFAULT_HYDRATION_GOAL_ML = 2500;

/** One glass / quick-add amount in milliliters. */
export const HYDRATION_GLASS_ML = 250;

/** Hard cap so storage and UI stay sane. */
export const MAX_HYDRATION_ML = 10000;

export type HydrationSnapshot = {
  date: string;
  intakeMl: number;
  goalMl: number;
};

export function buildHydrationStorageKey(
  userId: string,
  date: string
): string {
  return `hydration:${userId}:${date}`;
}

export function clampHydrationMl(value: number): number {
  if (!Number.isFinite(value) || value < 0) {
    return 0;
  }
  return Math.min(Math.round(value), MAX_HYDRATION_ML);
}

export function calculateHydrationProgress(
  intakeMl: number,
  goalMl: number = DEFAULT_HYDRATION_GOAL_ML
): number {
  const safeGoal = goalMl > 0 ? goalMl : DEFAULT_HYDRATION_GOAL_ML;
  const safeIntake = clampHydrationMl(intakeMl);
  return Math.min(100, Math.round((safeIntake / safeGoal) * 100));
}

export function formatHydrationLiters(ml: number): string {
  const liters = clampHydrationMl(ml) / 1000;
  return `${liters.toFixed(liters % 1 === 0 ? 0 : 1)}L`;
}

export function applyHydrationDelta(
  currentMl: number,
  deltaMl: number
): number {
  return clampHydrationMl(currentMl + deltaMl);
}

export function parseHydrationSnapshot(
  raw: string | null,
  fallbackDate: string,
  fallbackGoalMl: number = DEFAULT_HYDRATION_GOAL_ML
): HydrationSnapshot {
  if (!raw) {
    return {
      date: fallbackDate,
      intakeMl: 0,
      goalMl: fallbackGoalMl,
    };
  }

  try {
    const parsed = JSON.parse(raw) as Partial<HydrationSnapshot>;
    return {
      date:
        typeof parsed.date === "string" && parsed.date.length > 0
          ? parsed.date
          : fallbackDate,
      intakeMl: clampHydrationMl(Number(parsed.intakeMl ?? 0)),
      goalMl:
        Number(parsed.goalMl) > 0
          ? clampHydrationMl(Number(parsed.goalMl))
          : fallbackGoalMl,
    };
  } catch {
    return {
      date: fallbackDate,
      intakeMl: 0,
      goalMl: fallbackGoalMl,
    };
  }
}
