import { useCallback, useEffect, useMemo, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useAuth } from "@/contexts/AuthContext";
import {
  DEFAULT_HYDRATION_GOAL_ML,
  HYDRATION_GLASS_ML,
  applyHydrationDelta,
  buildHydrationStorageKey,
  calculateHydrationProgress,
  clampHydrationMl,
  parseHydrationSnapshot,
  type HydrationSnapshot,
} from "@/utils/hydration";

type UseHydrationResult = {
  intakeMl: number;
  goalMl: number;
  progressPercent: number;
  isLoading: boolean;
  isSaving: boolean;
  addGlass: () => Promise<void>;
  removeGlass: () => Promise<void>;
  setIntakeMl: (ml: number) => Promise<void>;
  resetDay: () => Promise<void>;
};

export function useHydration(date: string): UseHydrationResult {
  const { session } = useAuth();
  const userId = session?.user?.id;

  const [snapshot, setSnapshot] = useState<HydrationSnapshot>({
    date,
    intakeMl: 0,
    goalMl: DEFAULT_HYDRATION_GOAL_ML,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const storageKey = useMemo(() => {
    if (!userId || !date) {
      return null;
    }
    return buildHydrationStorageKey(userId, date);
  }, [userId, date]);

  const persist = useCallback(
    async (next: HydrationSnapshot) => {
      if (!storageKey) {
        setSnapshot(next);
        return;
      }

      setIsSaving(true);
      try {
        await AsyncStorage.setItem(storageKey, JSON.stringify(next));
        setSnapshot(next);
      } catch (error) {
        console.error("Failed to save hydration data:", error);
        throw error;
      } finally {
        setIsSaving(false);
      }
    },
    [storageKey]
  );

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      if (!storageKey) {
        if (!cancelled) {
          setSnapshot({
            date,
            intakeMl: 0,
            goalMl: DEFAULT_HYDRATION_GOAL_ML,
          });
          setIsLoading(false);
        }
        return;
      }

      setIsLoading(true);
      try {
        const raw = await AsyncStorage.getItem(storageKey);
        if (cancelled) return;
        setSnapshot(
          parseHydrationSnapshot(raw, date, DEFAULT_HYDRATION_GOAL_ML)
        );
      } catch (error) {
        console.error("Failed to load hydration data:", error);
        if (!cancelled) {
          setSnapshot({
            date,
            intakeMl: 0,
            goalMl: DEFAULT_HYDRATION_GOAL_ML,
          });
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    };

    load();
    return () => {
      cancelled = true;
    };
  }, [storageKey, date]);

  const addGlass = useCallback(async () => {
    const nextIntake = applyHydrationDelta(
      snapshot.intakeMl,
      HYDRATION_GLASS_ML
    );
    await persist({
      ...snapshot,
      date,
      intakeMl: nextIntake,
    });
  }, [persist, snapshot, date]);

  const removeGlass = useCallback(async () => {
    const nextIntake = applyHydrationDelta(
      snapshot.intakeMl,
      -HYDRATION_GLASS_ML
    );
    await persist({
      ...snapshot,
      date,
      intakeMl: nextIntake,
    });
  }, [persist, snapshot, date]);

  const setIntakeMl = useCallback(
    async (ml: number) => {
      await persist({
        ...snapshot,
        date,
        intakeMl: clampHydrationMl(ml),
      });
    },
    [persist, snapshot, date]
  );

  const resetDay = useCallback(async () => {
    await persist({
      date,
      intakeMl: 0,
      goalMl: snapshot.goalMl || DEFAULT_HYDRATION_GOAL_ML,
    });
  }, [persist, snapshot.goalMl, date]);

  return {
    intakeMl: snapshot.intakeMl,
    goalMl: snapshot.goalMl || DEFAULT_HYDRATION_GOAL_ML,
    progressPercent: calculateHydrationProgress(
      snapshot.intakeMl,
      snapshot.goalMl || DEFAULT_HYDRATION_GOAL_ML
    ),
    isLoading,
    isSaving,
    addGlass,
    removeGlass,
    setIntakeMl,
    resetDay,
  };
}
