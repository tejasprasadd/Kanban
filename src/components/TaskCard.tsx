import type { Task } from "@/types/Task";
import { useKanbanStore } from "@/store/kanbanStore";
import { Button } from "./shadcn-components/ui/button";
import { Card, CardContent } from "./shadcn-components/ui/card";
import { Pencil, Trash2 } from "lucide-react";
import { Input } from "./shadcn-components/ui/input";
import { useEffect, useState } from "react";
import { useRef } from "react";
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
  const inputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    // keep draft in sync if task.todo changes from elsewhere
    if (!isEditing) setDraft(task.todo);
  }, [isEditing, task.todo]);
  useEffect(() => {
    if (isEditing) inputRef.current?.focus();
  }, [isEditing]);

  function save() {
    const next = draft.trim();
    if (next.length === 0) {
      // don’t allow empty title; revert
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
  
  return (
    <Card
    className={
        task.status === "done"
          ? "bg-green-50 ring-green-200/60"
          : "bg-red-50 ring-red-200/60"
      }>
      <CardContent className="p-3">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
          {isEditing ? (
            <Input
                ref={inputRef}
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                onBlur={save}
                onKeyDown={(e) => {
                if (e.key === "Enter") save();
                if (e.key === "Escape") cancel();
                }}
                className="h-8"
            />
            ) : (
            <div className="truncate text-sm font-medium">{task.todo}</div>
            )}

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
            onClick={() => setIsEditing(true)}
            disabled={isEditing}
            >
            <Pencil className="h-4 w-4" />
            </Button>

            <div
              ref={setDragHandleRef}
              {...dragAttributes}
              {...dragListeners}
              className="cursor-grab active:cursor-grabbing rounded-md p-2 hover:bg-muted touch-none"
              aria-label="Drag task"
            >
              ⋮⋮
            </div>

            <Button
              variant="ghost"
              size="icon"
              aria-label="Delete task"
            >
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <span className="inline-flex">
                    <Trash2 className="h-4 w-4" />
                  </span>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete task?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This action can’t be undone.
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
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}