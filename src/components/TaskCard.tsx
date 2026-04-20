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
} from "./shadcn-components/ui/dialog";
import type { DraggableAttributes } from "@dnd-kit/core";
import type { SyntheticListenerMap } from "@dnd-kit/core/dist/hooks/utilities";
import { TaskDetailsDialog } from "./TaskDetailsDialog";
import { formatPriorityDate } from "@/utils/helper";

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

  const priorityLabel = formatPriorityDate(task.priorityDate);

  return (
    <>
      <Card className={statusColor}>
        <CardContent className="p-3">
          <div className="flex items-center justify-between gap-2">
            <button
              type="button"
              className="min-w-0 flex-1 cursor-pointer text-left"
              onClick={() => {
                if (!isEditing) setDetailOpen(true);
              }}
              title={task.todo}
            >
              {isEditing && !detailOpen ? (
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
                <div className="line-clamp-2 break-words text-sm font-medium">{task.todo}</div>
              )}
              {priorityLabel && (
                <div className="mt-1 text-xs text-muted-foreground">
                  Priority: <span className="font-medium text-foreground">{priorityLabel}</span>
                </div>
              )}
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

          {/* Inline edit now happens in-place (no extra input below). */}
        </CardContent>
      </Card>

      <TaskDetailsDialog
        task={task}
        open={detailOpen}
        onOpenChange={setDetailOpen}
        isEditing={isEditing}
        setIsEditing={setIsEditing}
        draft={draft}
        setDraft={setDraft}
        onSave={save}
        onCancel={cancel}
        detailInputRef={detailInputRef}
        onDelete={() => {
          deleteTask(task.id);
          setDetailOpen(false);
        }}
      />
    </>
  );
}
