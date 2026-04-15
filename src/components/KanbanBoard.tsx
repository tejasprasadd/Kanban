import { useMemo, useState } from "react";
import { useKanbanStore } from "@/store/kanbanStore";
import type { Task } from "@/types/Task";
import type { TaskStatus } from "@/types/TaskStatus";
import { KanbanColumn } from "./KanbanColumn";
import { CreateTaskDialog } from "./CreateTaskDialog";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";

import { isColumnId, statusFromColumnId } from "@/types/dnd/dndTypes";
import { TaskCard } from "./TaskCard";

type TasksByStatus = Record<TaskStatus, Task[]>;

export function KanbanBoard() {
  // Reading the normalized task dictionary from the zustand store.
  const tasksById = useKanbanStore((s) => s.tasksById);
  // Reads the tasks from the store keyed by its status.
  const columnOrder = useKanbanStore((s) => s.columnOrder);

  const [activeTaskId, setActiveTaskId] = useState<string | null>(null);
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 12, // drag starts only after moving 12px
      },
    }),
  );

  function findStatusOfTask(order: typeof columnOrder, taskId: string): TaskStatus | null {
    if (order.todo.includes(taskId)) return "todo";
    if (order.done.includes(taskId)) return "done";
    return null;
  }

  function indexInStatus(order: typeof columnOrder, status: TaskStatus, taskId: string) {
    return order[status].indexOf(taskId);
  }

  function onDragStart(event: DragStartEvent) {
    setActiveTaskId(String(event.active.id));
  }

  function onDragEnd(event: DragEndEvent) {
    setActiveTaskId(null);

    const activeId = String(event.active.id);
    const overId = event.over?.id ? String(event.over.id) : null;
    if (!overId) return;

    // Use the latest state at the moment drag ends.
    const state = useKanbanStore.getState();
    const order = state.columnOrder;

    const fromStatus = findStatusOfTask(order, activeId);
    if (!fromStatus) return;

    let toStatus: TaskStatus;
    let toIndex: number;

    if (isColumnId(overId)) {
      toStatus = statusFromColumnId(overId);
      toIndex = order[toStatus].length; // append
    } else {
      const overTaskId = overId;
      const overStatus = findStatusOfTask(order, overTaskId);
      if (!overStatus) return;
      toStatus = overStatus;
      toIndex = indexInStatus(order, overStatus, overTaskId);
    }

    const fromIndex = indexInStatus(order, fromStatus, activeId);
    if (fromIndex < 0) return;

    if (fromStatus === toStatus) {
      if (fromIndex !== toIndex) state.reorderTask(fromStatus, fromIndex, toIndex);
    } else {
      state.moveTask(activeId, toStatus, toIndex);
    }
  }

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
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Kanban</h1>
          <p className="text-sm text-muted-foreground">
            Drag-and-drop is enabled. Create/edit/delete are supported.
          </p>
        </div>
        <CreateTaskDialog />
      </div>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={onDragStart}
        onDragEnd={onDragEnd}
      >
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <KanbanColumn title="To Do" status="todo" tasks={tasksByStatus.todo} />
          <KanbanColumn title="Done" status="done" tasks={tasksByStatus.done} />
        </div>

        <DragOverlay>
          {activeTaskId && tasksById[activeTaskId] ? (
            <TaskCard task={tasksById[activeTaskId]} />
          ) : null}
        </DragOverlay>
      </DndContext>
    </div>
  );
}