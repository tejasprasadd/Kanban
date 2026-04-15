export const TASK_SOURCES = ["api", "local"] as const;

export type TaskSource = (typeof TASK_SOURCES)[number];