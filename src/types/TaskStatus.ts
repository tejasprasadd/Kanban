export const TASK_STATUSES = ["todo", "in-progress", "done"] as const;

export type TaskStatus = (typeof TASK_STATUSES)[number];