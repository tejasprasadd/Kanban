import type { Task } from "@/types/Task";
import { CSS } from "@dnd-kit/utilities";
import { useSortable } from "@dnd-kit/sortable";

import { TaskCard } from "./TaskCard";

type Props = {
  task: Task;
};

export function SortableTaskCard({ task }: Props) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: task.id,
    data: {
      type: "task",
      taskId: task.id,
    },
  });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
    ref={setNodeRef}
    style={style}
    {...attributes}
  >
    <TaskCard task={task} />
  </div>
  );
}