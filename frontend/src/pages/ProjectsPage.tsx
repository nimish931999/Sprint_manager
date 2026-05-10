import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { api } from "@/lib/api";
import type { Project } from "@/types";
import { Plus, FolderKanban, Trash2 } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

const COLORS = ["#6366f1", "#ec4899", "#f59e0b", "#10b981", "#3b82f6", "#8b5cf6"];

export default function ProjectsPage() {
  const qc = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: "", description: "", color: COLORS[0] });
  const [error, setError] = useState("");

  const { data: projects = [], isLoading } = useQuery<Project[]>({
    queryKey: ["projects"],
    queryFn: () => api.get("/projects/").then((r) => r.data),
  });

  const createMutation = useMutation({
    mutationFn: (payload: typeof form) => api.post("/projects/", payload).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["projects"] });
      qc.invalidateQueries({ queryKey: ["dashboard"] });
      setShowForm(false);
      setForm({ name: "", description: "", color: COLORS[0] });
    },
    onError: (err: any) => setError(err.response?.data?.detail || "Failed to create project"),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/projects/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["projects"] });
      qc.invalidateQueries({ queryKey: ["dashboard"] });
    },
  });

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    createMutation.mutate(form);
  }

  return (
    <div className="p-8 max-w-5xl">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-semibold">Projects</h1>
          <p className="text-muted-foreground text-sm mt-1">{projects.length} project{projects.length !== 1 ? "s" : ""}</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-md text-sm font-medium hover:opacity-90 transition-opacity"
        >
          <Plus size={16} />
          New Project
        </button>
      </div>

      {/* Create form */}
      {showForm && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-card border rounded-lg p-6 w-full max-w-md shadow-lg">
            <h2 className="font-semibold text-lg mb-4">New Project</h2>
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="text-sm font-medium block mb-1.5">Name</label>
                <input
                  required
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                  placeholder="Project name"
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
              <div>
                <label className="text-sm font-medium block mb-1.5">Color</label>
                <div className="flex gap-2">
                  {COLORS.map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setForm({ ...form, color: c })}
                      className="w-7 h-7 rounded-full transition-transform hover:scale-110"
                      style={{
                        backgroundColor: c,
                        outline: form.color === c ? `2px solid ${c}` : "none",
                        outlineOffset: "2px",
                      }}
                    />
                  ))}
                </div>
              </div>
              {error && <p className="text-destructive text-sm">{error}</p>}
              <div className="flex gap-2 justify-end pt-2">
                <button
                  type="button"
                  onClick={() => { setShowForm(false); setError(""); }}
                  className="px-4 py-2 text-sm border rounded-md hover:bg-muted transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createMutation.isPending}
                  className="px-4 py-2 text-sm bg-primary text-primary-foreground rounded-md hover:opacity-90 disabled:opacity-50 transition-opacity"
                >
                  {createMutation.isPending ? "Creating..." : "Create"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-36 bg-muted rounded-lg animate-pulse" />
          ))}
        </div>
      ) : projects.length === 0 ? (
        <div className="text-center py-20 text-muted-foreground">
          <FolderKanban size={40} className="mx-auto mb-3 opacity-30" />
          <p className="font-medium">No projects yet</p>
          <p className="text-sm mt-1">Create your first project to get started</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {projects.map((p) => (
            <div key={p.id} className="bg-card border rounded-lg p-5 hover:shadow-sm transition-shadow group relative">
              <button
                onClick={(e) => { e.preventDefault(); deleteMutation.mutate(p.id); }}
                className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive transition-all p-1 rounded"
              >
                <Trash2 size={14} />
              </button>
              <Link to={`/projects/${p.id}`} className="block">
                <div className="flex items-center gap-2.5 mb-3">
                  <span className="w-3 h-3 rounded-full" style={{ backgroundColor: p.color }} />
                  <span className="font-medium">{p.name}</span>
                </div>
                {p.description && (
                  <p className="text-sm text-muted-foreground mb-3 line-clamp-2">{p.description}</p>
                )}
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>{p.task_count} task{p.task_count !== 1 ? "s" : ""}</span>
                  <span>{formatDistanceToNow(new Date(p.created_at), { addSuffix: true })}</span>
                </div>
              </Link>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
