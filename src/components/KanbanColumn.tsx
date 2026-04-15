import type { Task } from "@/types/Task";
import type { TaskStatus } from "@/types/TaskStatus";
import { Card, CardContent, CardHeader, CardTitle } from "./shadcn-components/ui/card";

import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { useDroppable } from "@dnd-kit/core";
import { columnId } from "@/types/dnd/dndTypes";
import { SortableTaskCard } from "./SortableTaskCard";

type Props = {
  title: string;
  status: TaskStatus;
  tasks: Task[];
};

export function KanbanColumn({ title, status, tasks }: Props) {
  const droppableId = columnId(status);
  const { setNodeRef, isOver } = useDroppable({
    id: droppableId,
    data: { type: "column", status },
  });

  return (
    <Card className={isOver ? "h-full ring-2 ring-ring" : "h-full"}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0">
        <CardTitle className="text-base">{title}</CardTitle>
        <div className="rounded-md bg-muted px-2 py-1 text-xs text-muted-foreground">
          {tasks.length}
        </div>
      </CardHeader>

      <CardContent ref={setNodeRef} className="min-h-[120px]">
        <SortableContext
          items={tasks.map((t) => t.id)}
          strategy={verticalListSortingStrategy}
        >
          {tasks.length === 0 ? (
            <div className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
              {status === "todo"
                ? "Drop here or create a task."
                : "Drop completed tasks here."}
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {tasks.map((task) => (
                <SortableTaskCard key={task.id} task={task} />
              ))}
            </div>
          )}
        </SortableContext>
      </CardContent>
    </Card>
  );
}