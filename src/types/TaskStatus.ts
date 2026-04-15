export const TASK_STATUSES = ["todo",  "done"] as const;

export type TaskStatus = (typeof TASK_STATUSES)[number];