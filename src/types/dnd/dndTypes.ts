import type { TaskStatus } from "@/types/TaskStatus";

export type ColumnId = `column:${TaskStatus}`;

export function columnId(status: TaskStatus): ColumnId {
  return `column:${status}`;
}

export function isColumnId(id: string): id is ColumnId {
  return id.startsWith("column:") && (id === "column:todo" || id === "column:done");
}

export function statusFromColumnId(id: ColumnId): TaskStatus {
  return id.replace("column:", "") as TaskStatus;
}