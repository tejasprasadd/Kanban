import type { Task } from "@/types/Task";
import type { RefObject } from "react";
import { Pencil, Trash2 } from "lucide-react";
import { formatPriorityDate } from "@/utils/helper";
import { Button } from "./shadcn-components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "./shadcn-components/ui/dialog";
import { Input } from "./shadcn-components/ui/input";
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

type Props = {
  task: Task;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  isEditing: boolean;
  setIsEditing: (next: boolean) => void;
  draft: string;
  setDraft: (next: string) => void;
  onSave: () => void;
  onCancel: () => void;
  detailInputRef: RefObject<HTMLInputElement | null>;
  onDelete: () => void;
};

export function TaskDetailsDialog({
  task,
  open,
  onOpenChange,
  isEditing,
  setIsEditing,
  draft,
  setDraft,
  onSave,
  onCancel,
  detailInputRef,
  onDelete,
}: Props) {
  const priorityLabel = formatPriorityDate(task.priorityDate);

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (!nextOpen) setIsEditing(false);
        onOpenChange(nextOpen);
      }}
    >
      <DialogContent className="max-h-[85vh] overflow-y-auto overflow-x-hidden sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-base">Task Details</DialogTitle>
        </DialogHeader>

        {isEditing ? (
          <Input
            ref={detailInputRef}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") onSave();
              if (e.key === "Escape") onCancel();
            }}
            className="h-9"
            autoFocus
          />
        ) : (
          <p className="min-w-0 whitespace-pre-wrap break-words [overflow-wrap:anywhere] text-sm">
            {task.todo}
          </p>
        )}

        <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
          <span className="rounded bg-muted px-2 py-0.5">status: {task.status}</span>
          {priorityLabel && (
            <span className="rounded bg-muted px-2 py-0.5">priority: {priorityLabel}</span>
          )}
          {typeof task.userId === "number" && (
            <span className="rounded bg-muted px-2 py-0.5">user: {task.userId}</span>
          )}
        </div>

        <DialogFooter className="flex-row gap-2 sm:justify-start">
          {isEditing ? (
            <>
              <Button size="sm" onClick={onSave}>
                Save
              </Button>
              <Button size="sm" variant="ghost" onClick={onCancel}>
                Cancel
              </Button>
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
                    <AlertDialogDescription>This action can't be undone.</AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction variant="destructive" onClick={onDelete}>
                    Delete
                  </AlertDialogAction>
                </AlertDialogContent>
              </AlertDialog>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

