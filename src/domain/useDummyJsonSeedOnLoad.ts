import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useKanbanStore } from "@/store/kanbanStore";
import { fetchDummyJsonSeedTasks } from "./fetchDummyJsonSeedTasks";

type SeedState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "done" }
  | { status: "error"; message: string };

function getErrorMessage(err: unknown): string {
  if (err instanceof Error) return err.message;
  return "Failed to load seed tasks.";
}


//Hydration her is the rehydration of the persisted Zustand state from localStorage to memory. 
//This is a hook that DECIDES wheter we should seed the tasks from the API or not. . 
export function useDummyJsonSeedOnLoad(limit = 30) {
  const hasHydrated = useKanbanStore((s) => s.hasHydrated);
  const seedApplied = useKanbanStore((s) => s.seed.applied);
  const tasksCount = useKanbanStore((s) => Object.keys(s.tasksById).length);
  const seedFromApi = useKanbanStore((s) => s.seedFromApi);
    //useMemo used to ensure value is stable and only recalculates when the 3 inputs is change. 
  const shouldSeed = useMemo(() => {
    return hasHydrated && !seedApplied && tasksCount === 0;
  }, [hasHydrated, seedApplied, tasksCount]);

  const [state, setState] = useState<SeedState>({ status: "idle" });

  // Prevent duplicate effect runs in dev StrictMode
  const startedRef = useRef(false);

  const run = useCallback(async () => {
    if (!hasHydrated) return;

    if (!shouldSeed) {
      setState({ status: "done" });
      return;
    }

    setState({ status: "loading" });
    try {
      const tasks = await fetchDummyJsonSeedTasks(limit);
      seedFromApi(tasks);
      setState({ status: "done" });
    } catch (e) {
      setState({ status: "error", message: getErrorMessage(e) });
    }
  }, [hasHydrated, limit, seedFromApi, shouldSeed]);

  useEffect(() => {
    if (!hasHydrated) return;
    if (startedRef.current) return;
    startedRef.current = true;

    void run();
  }, [hasHydrated, run]);

  return {
    isLoading: state.status === "loading",
    isError: state.status === "error",
    errorMessage: state.status === "error" ? state.message : null,
    retry: run,
    shouldSeed,
    hasHydrated,
  };
}