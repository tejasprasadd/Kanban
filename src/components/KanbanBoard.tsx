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
    TouchSensor,
    MouseSensor,
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
    // Mouse drag (desktop)
    useSensor(MouseSensor, {
      activationConstraint: { distance: 8 },
    }),
  
    // Touch drag (mobile)
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 200,     // long-press a bit before drag starts
        tolerance: 8,   // allow slight finger movement during long-press
      },
    }),
  
    // PointerSensor is optional if you already use Mouse+Touch,
    // but you can keep it if you want:
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    }),
  );

  //Finding which columnt the task belongs to. 
  function findStatusOfTask(order: typeof columnOrder, taskId: string): TaskStatus | null {
    if (order.todo.includes(taskId)) return "todo";
    if (order["in-progress"].includes(taskId)) return "in-progress";
    if (order.done.includes(taskId)) return "done";
    return null;
  }

  function indexInStatus(order: typeof columnOrder, status: TaskStatus, taskId: string) {
    return order[status].indexOf(taskId);
  }
  //Which is the id of the task being dragged. 
  function onDragStart(event: DragStartEvent) {
    setActiveTaskId(String(event.active.id));
  }
  //To modify the status of the task that was dragged based on fetching the latest state of that particular task. 
  function onDragEnd(event: DragEndEvent) {
    setActiveTaskId(null);
    //Which is the id of the task that was dragged. 
    const activeId = String(event.active.id);
    const overId = event.over?.id ? String(event.over.id) : null;
    if (!overId) return;

    // Use the latest state at the moment drag ends.
    const state = useKanbanStore.getState();
    const order = state.columnOrder;

    const fromStatus = findStatusOfTask(order, activeId);
    if (!fromStatus) return;

    //Figure out the status of the task in the destination column. 
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

    //If dragging within the same column, just reorder the task. 
    if (fromStatus === toStatus) {
      if (fromIndex !== toIndex) state.reorderTask(fromStatus, fromIndex, toIndex);
    } else {
      state.moveTask(activeId, toStatus, toIndex);
    }
  }

  //Get the tasks by index from the store. 
  const tasksByStatus: TasksByStatus = useMemo(() => {
    const todo = columnOrder.todo
      .map((id) => tasksById[id])
      .filter((t): t is Task => Boolean(t));

    const inProgress = columnOrder["in-progress"]
      .map((id) => tasksById[id])
      .filter((t): t is Task => Boolean(t));

    const done = columnOrder.done
      .map((id) => tasksById[id])
      .filter((t): t is Task => Boolean(t));

    return { todo, "in-progress": inProgress, done };
  }, [columnOrder.todo, columnOrder["in-progress"], columnOrder.done, tasksById]);

  return (
    <div className="mx-auto w-full max-w-7xl p-4 sm:p-6">
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
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <KanbanColumn title="To Do" status="todo" tasks={tasksByStatus.todo} />
          <KanbanColumn title="In Progress" status="in-progress" tasks={tasksByStatus["in-progress"]} />
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