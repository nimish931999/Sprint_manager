import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import type { Task } from "@/types";
import { cn } from "@/lib/utils";
import { Calendar, Flag } from "lucide-react";
import { format } from "date-fns";

const priorityColors: Record<string, string> = {
  high: "text-red-500",
  medium: "text-yellow-500",
  low: "text-green-500",
};

interface Props {
  task: Task;
  onClick: () => void;
}

export default function TaskCard({ task, onClick }: Props) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: task.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  function handleClick() {
    // Don't open modal if we just finished dragging
    if (!isDragging) onClick();
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      onClick={handleClick}
      className={cn(
        "bg-card border rounded-md p-3 cursor-grab active:cursor-grabbing hover:shadow-sm transition-shadow select-none",
        isDragging && "opacity-40 shadow-lg"
      )}
    >
      <p className="text-sm font-medium mb-2 leading-snug">{task.title}</p>

      {task.description && (
        <p className="text-xs text-muted-foreground mb-2 line-clamp-2">{task.description}</p>
      )}

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Flag size={12} className={priorityColors[task.priority]} />
          {task.labels && (
            <span className="text-xs bg-muted px-1.5 py-0.5 rounded text-muted-foreground">
              {task.labels.split(",")[0].trim()}
            </span>
          )}
        </div>
        {task.due_date && (
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <Calendar size={11} />
            {format(new Date(task.due_date), "MMM d")}
          </div>
        )}
      </div>

      {task.assignee && (
        <div className="mt-2 flex items-center gap-1.5">
          <div className="w-5 h-5 rounded-full bg-primary/20 flex items-center justify-center text-primary text-xs font-medium">
            {task.assignee.name[0].toUpperCase()}
          </div>
          <span className="text-xs text-muted-foreground">{task.assignee.name}</span>
        </div>
      )}
    </div>
  );
}
