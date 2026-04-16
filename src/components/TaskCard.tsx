import type { Task } from "@/types/Task";
import { useKanbanStore } from "@/store/kanbanStore";
import { Button } from "./shadcn-components/ui/button";
import { Card, CardContent } from "./shadcn-components/ui/card";
import { Pencil, Trash2 } from "lucide-react";
import { Input } from "./shadcn-components/ui/input";
import { useEffect, useState, useRef } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "./shadcn-components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "./shadcn-components/ui/dialog";
import type { DraggableAttributes } from "@dnd-kit/core";
import type { SyntheticListenerMap } from "@dnd-kit/core/dist/hooks/utilities";

type Props = {
  task: Task;
  dragListeners?: SyntheticListenerMap;
  dragAttributes?: DraggableAttributes;
  setDragHandleRef?: (element: HTMLElement | null) => void;
};

export function TaskCard({ task, dragListeners, dragAttributes, setDragHandleRef }: Props) {
  const deleteTask = useKanbanStore((s) => s.deleteTask);
  const updateTask = useKanbanStore((s) => s.updateTask);

  const [isEditing, setIsEditing] = useState(false);
  const [draft, setDraft] = useState(task.todo);
  const [detailOpen, setDetailOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const detailInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (!isEditing) setDraft(task.todo);
  }, [isEditing, task.todo]);

  useEffect(() => {
    if (isEditing && !detailOpen) inputRef.current?.focus();
    if (isEditing && detailOpen) detailInputRef.current?.focus();
  }, [isEditing, detailOpen]);

  function save() {
    const next = draft.trim();
    if (next.length === 0) {
      setDraft(task.todo);
      setIsEditing(false);
      return;
    }
    if (next !== task.todo) updateTask(task.id, { todo: next });
    setIsEditing(false);
  }

  function cancel() {
    setDraft(task.todo);
    setIsEditing(false);
  }

  const statusColor =
    task.status === "done"
      ? "bg-green-50 ring-green-200/60"
      : task.status === "in-progress"
        ? "bg-yellow-50 ring-yellow-200/60"
        : "bg-red-50 ring-red-200/60";

  return (
    <>
      <Card className={statusColor}>
        <CardContent className="p-3">
          <div className="flex items-center justify-between gap-2">
            <button
              type="button"
              className="min-w-0 flex-1 cursor-pointer text-left"
              onClick={() => setDetailOpen(true)}
            >
              <div className="line-clamp-2 text-sm font-medium">{task.todo}</div>
            </button>

            <div className="flex shrink-0 items-center gap-1">
              <Button
                variant="ghost"
                size="icon"
                aria-label="Edit task"
                onClick={() => setIsEditing(true)}
                disabled={isEditing}
              >
                <Pencil className="h-4 w-4" />
              </Button>

              <div
                ref={setDragHandleRef}
                {...dragAttributes}
                {...dragListeners}
                role="button"
                tabIndex={0}
                className="select-none touch-none cursor-grab active:cursor-grabbing rounded-md p-2.5 min-h-10 min-w-10 inline-flex items-center justify-center hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
                aria-label="Drag task"
                title="Drag"
              >
                <span className="text-sm leading-none opacity-80">⋮⋮</span>
              </div>

              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="ghost" size="icon" aria-label="Delete task">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete task?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This action can't be undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    variant="destructive"
                    onClick={() => deleteTask(task.id)}
                  >
                    Delete
                  </AlertDialogAction>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </div>

          {isEditing && !detailOpen && (
            <Input
              ref={inputRef}
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onBlur={save}
              onKeyDown={(e) => {
                if (e.key === "Enter") save();
                if (e.key === "Escape") cancel();
              }}
              className="mt-2 h-8"
            />
          )}
        </CardContent>
      </Card>

      <Dialog open={detailOpen} onOpenChange={(open) => {
        if (!open) setIsEditing(false);
        setDetailOpen(open);
      }}>
        <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base">Task Details</DialogTitle>
          </DialogHeader>

          {isEditing ? (
            <Input
              ref={detailInputRef}
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") save();
                if (e.key === "Escape") cancel();
              }}
              className="h-9"
              autoFocus
            />
          ) : (
            <p className="whitespace-pre-wrap break-words text-sm">{task.todo}</p>
          )}

          <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
            <span className="rounded bg-muted px-2 py-0.5">
              status: {task.status}
            </span>
            {typeof task.userId === "number" && (
              <span className="rounded bg-muted px-2 py-0.5">
                user: {task.userId}
              </span>
            )}
          </div>

          <DialogFooter className="flex-row gap-2 sm:justify-start">
            {isEditing ? (
              <>
                <Button size="sm" onClick={save}>Save</Button>
                <Button size="sm" variant="ghost" onClick={cancel}>Cancel</Button>
              </>
            ) : (
              <>
                <Button size="sm" onClick={() => setIsEditing(true)}>
                  <Pencil className="mr-1.5 h-3.5 w-3.5" />
                  Edit
                </Button>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button size="sm" variant="destructive">
                      <Trash2 className="mr-1.5 h-3.5 w-3.5" />
                      Delete
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Delete task?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This action can't be undone.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      variant="destructive"
                      onClick={() => {
                        deleteTask(task.id);
                        setDetailOpen(false);
                      }}
                    >
                      Delete
                    </AlertDialogAction>
                  </AlertDialogContent>
                </AlertDialog>
              </>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
