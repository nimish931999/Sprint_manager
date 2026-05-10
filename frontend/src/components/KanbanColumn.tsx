import { useDroppable } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import type { Task, TaskStatus } from "@/types";
import TaskCard from "@/components/TaskCard";
import { cn } from "@/lib/utils";

interface Props {
  id: TaskStatus;
  label: string;
  badgeClass: string;
  tasks: Task[];
  isOver: boolean;
  onTaskClick: (task: Task) => void;
}

export default function KanbanColumn({ id, label, badgeClass, tasks, isOver, onTaskClick }: Props) {
  const { setNodeRef } = useDroppable({ id });

  return (
    <div className="w-72 flex-shrink-0 flex flex-col">
      <div className="flex items-center gap-2 mb-3">
        <span className={cn("text-xs font-medium px-2 py-0.5 rounded-full", badgeClass)}>
          {label}
        </span>
        <span className="text-xs text-muted-foreground">{tasks.length}</span>
      </div>

      <SortableContext id={id} items={tasks.map((t) => t.id)} strategy={verticalListSortingStrategy}>
        <div
          ref={setNodeRef}
          className={cn(
            "flex-1 min-h-32 space-y-2 p-2 rounded-lg border-2 border-dashed transition-colors",
            isOver ? "border-primary/50 bg-primary/5" : "border-transparent bg-muted/40"
          )}
        >
          {tasks.map((task) => (
            <TaskCard key={task.id} task={task} onClick={() => onTaskClick(task)} />
          ))}
          {tasks.length === 0 && (
            <p className="text-xs text-muted-foreground text-center py-8">Drop tasks here</p>
          )}
        </div>
      </SortableContext>
    </div>
  );
}
