import { useMemo } from "react";
import { useKanbanStore } from "@/store/kanbanStore";
import type { Task } from "@/types/Task";
import type { TaskStatus } from "@/types/TaskStatus";
import { KanbanColumn } from "./KanbanColumn";

type TasksByStatus = Record<TaskStatus, Task[]>;

export function KanbanBoard() {

//Reading the normalized task dictonary from the zustand store. 
  const tasksById = useKanbanStore((s) => s.tasksById);
  const columnOrder = useKanbanStore((s) => s.columnOrder);

  const tasksByStatus: TasksByStatus = useMemo(() => {
    const todo = columnOrder.todo
      .map((id) => tasksById[id])
      .filter((t): t is Task => Boolean(t));

    const done = columnOrder.done
      .map((id) => tasksById[id])
      .filter((t): t is Task => Boolean(t));

    return { todo, done };
  }, [columnOrder.done, columnOrder.todo, tasksById]);

  return (
    <div className="mx-auto w-full max-w-5xl p-4 sm:p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight">Kanban</h1>
        <p className="text-sm text-muted-foreground">
          Drag-and-drop comes later. For now: view + basic actions.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <KanbanColumn title="To Do" status="todo" tasks={tasksByStatus.todo} />
        <KanbanColumn title="Done" status="done" tasks={tasksByStatus.done} />
      </div>
    </div>
  );
}