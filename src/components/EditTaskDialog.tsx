import { useMemo, useState } from "react";
import type { Task } from "@/types/Task";
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

type Props = {
  task: Task;
};

export function EditTaskDialog({ task }: Props) {
  const updateTask = useKanbanStore((s) => s.updateTask);

  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState(task.todo);

  const canSubmit = useMemo(() => title.trim().length > 0, [title]);

  function onOpenChange(next: boolean) {
    setOpen(next);
    if (next) {
      // reset form fields whenever dialog opens
      setTitle(task.todo);
    }
  }

  function onSubmit(e: React.SubmitEvent) {
    e.preventDefault();
    if (!canSubmit) return;

    updateTask(task.id, { todo: title.trim() });
    setOpen(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" aria-label="Edit task">
          Edit
        </Button>
      </DialogTrigger>

      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit task</DialogTitle>
        </DialogHeader>

        <form onSubmit={onSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor={`edit-title-${task.id}`}>Title</Label>
            <Input
              id={`edit-title-${task.id}`}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              autoFocus
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={!canSubmit}>
              Save
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}