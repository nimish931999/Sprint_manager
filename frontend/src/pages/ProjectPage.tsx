import { useState, useRef } from "react";
import { useParams, Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  DndContext,
  DragEndEvent,
  DragOverEvent,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
  closestCenter,
  DragOverlay,
} from "@dnd-kit/core";
import { api } from "@/lib/api";
import type { Project, Task, TaskStatus } from "@/types";
import KanbanColumn from "@/components/KanbanColumn";
import TaskCard from "@/components/TaskCard";
import TaskModal from "@/components/TaskModal";
import { Plus, ArrowLeft } from "lucide-react";

const COLUMNS: { id: TaskStatus; label: string; badgeClass: string }[] = [
  { id: "backlog", label: "Backlog", badgeClass: "bg-slate-100 text-slate-600" },
  { id: "in_progress", label: "In Progress", badgeClass: "bg-yellow-50 text-yellow-700" },
  { id: "done", label: "Done", badgeClass: "bg-green-50 text-green-700" },
];

const COLUMN_IDS = new Set<string>(COLUMNS.map((c) => c.id));

function resolveColumn(itemId: string, taskList: Task[]): TaskStatus | null {
  if (COLUMN_IDS.has(itemId)) return itemId as TaskStatus;
  return taskList.find((t) => t.id === itemId)?.status ?? null;
}

export default function ProjectPage() {
  const { id } = useParams<{ id: string }>();
  const qc = useQueryClient();
  const [selectedTask, setSelectedTask] = useState<Task | null | "new">(null);
  const [activeTask, setActiveTask] = useState<Task | null>(null);
  const [overColumn, setOverColumn] = useState<TaskStatus | null>(null);

  // Refs to track drag state without stale closures
  const dragOriginalStatus = useRef<TaskStatus | null>(null);
  const dragTargetStatus = useRef<TaskStatus | null>(null);

  const { data: project } = useQuery<Project>({
    queryKey: ["project", id],
    queryFn: () => api.get(`/projects/${id}`).then((r) => r.data),
  });

  const { data: tasks = [], isLoading } = useQuery<Task[]>({
    queryKey: ["tasks", id],
    queryFn: () => api.get(`/projects/${id}/tasks/`).then((r) => r.data),
  });

  const updateStatusMutation = useMutation({
    mutationFn: ({ taskId, status }: { taskId: string; status: string }) =>
      api.patch(`/projects/${id}/tasks/${taskId}`, { status }).then((r) => r.data),
    onError: () => {
      // Revert on failure
      qc.invalidateQueries({ queryKey: ["tasks", id] });
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: ["tasks", id] });
      qc.invalidateQueries({ queryKey: ["dashboard"] });
    },
  });

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
  );

  function handleDragStart({ active }: DragStartEvent) {
    const task = tasks.find((t) => t.id === active.id) ?? null;
    setActiveTask(task);
    // Capture original status at drag start — this never changes during the drag
    dragOriginalStatus.current = task?.status ?? null;
    dragTargetStatus.current = task?.status ?? null;
  }

  function handleDragOver({ active, over }: DragOverEvent) {
    if (!over) {
      setOverColumn(null);
      return;
    }

    const activeId = active.id as string;
    // Resolve target column from the ORIGINAL tasks list (not cache)
    const targetCol = resolveColumn(over.id as string, tasks);
    if (!targetCol) return;

    dragTargetStatus.current = targetCol;
    setOverColumn(targetCol);

    // Optimistically move card visually
    if (targetCol !== dragOriginalStatus.current) {
      qc.setQueryData<Task[]>(["tasks", id], (old) =>
        old?.map((t) => (t.id === activeId ? { ...t, status: targetCol } : t)) ?? []
      );
    }
  }

  function handleDragEnd({ active }: DragEndEvent) {
    setActiveTask(null);
    setOverColumn(null);

    const activeId = active.id as string;
    const original = dragOriginalStatus.current;
    const target = dragTargetStatus.current;

    dragOriginalStatus.current = null;
    dragTargetStatus.current = null;

    if (!original || !target) return;

    if (target !== original) {
      // Fire API — optimistic update already applied in handleDragOver
      updateStatusMutation.mutate({ taskId: activeId, status: target });
    } else {
      // Dropped back in same column — revert any visual changes
      qc.invalidateQueries({ queryKey: ["tasks", id] });
    }
  }

  function handleDragCancel() {
    setActiveTask(null);
    setOverColumn(null);
    dragOriginalStatus.current = null;
    dragTargetStatus.current = null;
    qc.invalidateQueries({ queryKey: ["tasks", id] });
  }

  const tasksByStatus = (status: TaskStatus) =>
    (qc.getQueryData<Task[]>(["tasks", id]) ?? tasks).filter((t) => t.status === status);

  return (
    <div className="flex flex-col h-full">
      <div className="px-8 py-5 border-b flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link to="/projects" className="text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft size={18} />
          </Link>
          {project && (
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full" style={{ backgroundColor: project.color }} />
              <h1 className="font-semibold text-lg">{project.name}</h1>
            </div>
          )}
        </div>
        <button
          onClick={() => setSelectedTask("new")}
          className="flex items-center gap-2 bg-primary text-primary-foreground px-3 py-1.5 rounded-md text-sm font-medium hover:opacity-90 transition-opacity"
        >
          <Plus size={15} />
          Add Task
        </button>
      </div>

      <div className="flex-1 overflow-auto p-6">
        {isLoading ? (
          <div className="flex gap-4">
            {COLUMNS.map((c) => (
              <div key={c.id} className="w-72 h-64 bg-muted rounded-lg animate-pulse" />
            ))}
          </div>
        ) : (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragStart={handleDragStart}
            onDragOver={handleDragOver}
            onDragEnd={handleDragEnd}
            onDragCancel={handleDragCancel}
          >
            <div className="flex gap-4 items-start">
              {COLUMNS.map((col) => (
                <KanbanColumn
                  key={col.id}
                  id={col.id}
                  label={col.label}
                  badgeClass={col.badgeClass}
                  tasks={tasksByStatus(col.id)}
                  isOver={overColumn === col.id && activeTask?.status !== col.id}
                  onTaskClick={(task) => setSelectedTask(task)}
                />
              ))}
            </div>

            <DragOverlay dropAnimation={{ duration: 150, easing: "ease" }}>
              {activeTask && <TaskCard task={activeTask} onClick={() => {}} />}
            </DragOverlay>
          </DndContext>
        )}
      </div>

      {selectedTask !== null && (
        <TaskModal
          task={selectedTask === "new" ? null : selectedTask}
          projectId={id!}
          onClose={() => setSelectedTask(null)}
        />
      )}
    </div>
  );
}
