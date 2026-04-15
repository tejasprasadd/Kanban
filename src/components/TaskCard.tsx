import type { Task } from "@/types/Task";
import { useKanbanStore } from "@/store/kanbanStore";
import { Button } from "../shadcn-components/ui/button";
import { Card, CardContent } from "../shadcn-components/ui/card";
import { Pencil, Trash2 } from "lucide-react";

type Props = {
  task: Task;
};

export function TaskCard({ task }: Props) {
  const deleteTask = useKanbanStore((s) => s.deleteTask);

  return (
    <Card>
      <CardContent className="p-3">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <div className="truncate text-sm font-medium">{task.todo}</div>

            <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
              <span className="rounded bg-muted px-2 py-0.5">
                source: {task.source}
              </span>
              {typeof task.userId === "number" ? (
                <span className="rounded bg-muted px-2 py-0.5">
                  user: {task.userId}
                </span>
              ) : null}
            </div>
          </div>

          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              aria-label="Edit task"
              onClick={() => {
                // Later: open edit modal/sheet
                console.log("edit", task.id);
              }}
            >
              <Pencil className="h-4 w-4" />
            </Button>

            <Button
              variant="ghost"
              size="icon"
              aria-label="Delete task"
              onClick={() => deleteTask(task.id)}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}