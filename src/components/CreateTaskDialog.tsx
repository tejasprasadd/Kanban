import { useMemo, useState } from "react";
import { useKanbanStore } from "@/store/kanbanStore";

import { Button } from "./shadcn-components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "./shadcn-components/ui/dialog";
import { Input } from "./shadcn-components/ui/input";
import { Label } from "./shadcn-components/ui/label";

function newLocalTaskId() {
  // Deterministic prefix prevents collision with api ids
  return `local:${crypto.randomUUID()}`;
}

export function CreateTaskDialog() {
  const createTask = useKanbanStore((s) => s.createTask);

  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [priorityDate, setPriorityDate] = useState<string>("");
//Checking if the title is empty or not thereby validating for a valid task .
  const canSubmit = useMemo(() => title.trim().length > 0, [title]);

  function onSubmit(e: React.SubmitEvent) {
    e.preventDefault();
    if (!canSubmit) return;

    createTask({
      id: newLocalTaskId(),
      todo: title.trim(),
      status: "todo",
      source: "local",
      priorityDate: priorityDate.trim().length > 0 ? priorityDate : undefined,
    });

    setTitle("");
    setPriorityDate("");
    setOpen(false);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="h-12 rounded-full px-5 shadow-lg">Create task</Button>
      </DialogTrigger>

      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create task</DialogTitle>
        </DialogHeader>

        <form onSubmit={onSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="task-title">Title</Label>
            <Input
              id="task-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Watch Dhurandhar 2"
              autoFocus
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="task-priority-date">Priority date</Label>
            <Input
              id="task-priority-date"
              type="date"
              value={priorityDate}
              onChange={(e) => setPriorityDate(e.target.value)}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={!canSubmit}>
              Create
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}