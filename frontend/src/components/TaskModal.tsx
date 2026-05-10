import { useState, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { Task } from "@/types";
import { X, Trash2 } from "lucide-react";

interface Props {
  task: Task | null;
  projectId: string;
  onClose: () => void;
}

const STATUSES = ["backlog", "in_progress", "done"] as const;
const PRIORITIES = ["low", "medium", "high"] as const;

export default function TaskModal({ task, projectId, onClose }: Props) {
  const qc = useQueryClient();
  const isNew = !task;

  const [form, setForm] = useState({
    title: "",
    description: "",
    status: "backlog" as string,
    priority: "medium" as string,
    labels: "",
    due_date: "",
    story_points: "",
  });
  const [error, setError] = useState("");

  useEffect(() => {
    if (task) {
      setForm({
        title: task.title,
        description: task.description ?? "",
        status: task.status,
        priority: task.priority,
        labels: task.labels ?? "",
        due_date: task.due_date ?? "",
        story_points: task.story_points?.toString() ?? "",
      });
    }
  }, [task]);

  const saveMutation = useMutation({
    mutationFn: (payload: Record<string, unknown>) =>
      isNew
        ? api.post(`/projects/${projectId}/tasks/`, payload).then((r) => r.data)
        : api.patch(`/projects/${projectId}/tasks/${task!.id}`, payload).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["tasks", projectId] });
      qc.invalidateQueries({ queryKey: ["dashboard"] });
      onClose();
    },
    onError: (err: any) => setError(err.response?.data?.detail || "Failed to save task"),
  });

  const deleteMutation = useMutation({
    mutationFn: () => api.delete(`/projects/${projectId}/tasks/${task!.id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["tasks", projectId] });
      qc.invalidateQueries({ queryKey: ["dashboard"] });
      onClose();
    },
  });

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    const payload: Record<string, unknown> = {
      title: form.title,
      description: form.description || null,
      status: form.status,
      priority: form.priority,
      labels: form.labels || null,
      due_date: form.due_date || null,
      story_points: form.story_points ? parseInt(form.story_points) : null,
    };
    saveMutation.mutate(payload);
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50" onClick={onClose}>
      <div
        className="bg-card border rounded-lg p-6 w-full max-w-lg shadow-lg max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-5">
          <h2 className="font-semibold text-lg">{isNew ? "New Task" : "Edit Task"}</h2>
          <div className="flex items-center gap-2">
            {!isNew && (
              <button
                onClick={() => deleteMutation.mutate()}
                className="text-muted-foreground hover:text-destructive transition-colors p-1 rounded"
              >
                <Trash2 size={16} />
              </button>
            )}
            <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors p-1 rounded">
              <X size={16} />
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-sm font-medium block mb-1.5">Title</label>
            <input
              required
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
              placeholder="Task title"
            />
          </div>

          <div>
            <label className="text-sm font-medium block mb-1.5">Description</label>
            <textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none"
              rows={3}
              placeholder="Optional description"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium block mb-1.5">Status</label>
              <select
                value={form.status}
                onChange={(e) => setForm({ ...form, status: e.target.value })}
                className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 bg-card"
              >
                {STATUSES.map((s) => (
                  <option key={s} value={s}>{s.replace("_", " ")}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-sm font-medium block mb-1.5">Priority</label>
              <select
                value={form.priority}
                onChange={(e) => setForm({ ...form, priority: e.target.value })}
                className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 bg-card"
              >
                {PRIORITIES.map((p) => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium block mb-1.5">Due Date</label>
              <input
                type="date"
                value={form.due_date}
                onChange={(e) => setForm({ ...form, due_date: e.target.value })}
                className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>
            <div>
              <label className="text-sm font-medium block mb-1.5">Story Points</label>
              <input
                type="number"
                min={1}
                value={form.story_points}
                onChange={(e) => setForm({ ...form, story_points: e.target.value })}
                className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                placeholder="e.g. 3"
              />
            </div>
          </div>

          <div>
            <label className="text-sm font-medium block mb-1.5">Labels</label>
            <input
              value={form.labels}
              onChange={(e) => setForm({ ...form, labels: e.target.value })}
              className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
              placeholder="bug, feature, docs (comma-separated)"
            />
          </div>

          {error && <p className="text-destructive text-sm">{error}</p>}

          <div className="flex gap-2 justify-end pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm border rounded-md hover:bg-muted transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saveMutation.isPending}
              className="px-4 py-2 text-sm bg-primary text-primary-foreground rounded-md hover:opacity-90 disabled:opacity-50 transition-opacity"
            >
              {saveMutation.isPending ? "Saving..." : isNew ? "Create Task" : "Save Changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
