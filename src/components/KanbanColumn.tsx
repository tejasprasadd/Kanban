import type { Task } from "@/types/Task";
import type { TaskStatus } from "@/types/TaskStatus";
import { Card, CardContent, CardHeader, CardTitle } from "../shadcn-components/ui/card";
import { TaskCard } from "./TaskCard";

type Props = {
  title: string;
  status: TaskStatus;
  tasks: Task[];
};

export function KanbanColumn({ title, status, tasks }: Props) {
  return (
    <Card className="h-full">
      <CardHeader className="flex flex-row items-center justify-between space-y-0">
        <CardTitle className="text-base">{title}</CardTitle>
        <div className="rounded-md bg-muted px-2 py-1 text-xs text-muted-foreground">
          {tasks.length}
        </div>
      </CardHeader>

      <CardContent>
        {tasks.length === 0 ? (
          <div className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
            {status === "todo"
              ? "No tasks yet. Create one in Phase 5."
              : "Nothing completed yet."}
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {tasks.map((task) => (
              <TaskCard key={task.id} task={task} />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}