import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { Dashboard } from "@/types";
import { CheckCircle2, Circle, Clock, LayoutList } from "lucide-react";
import { useAuthStore } from "@/store/auth";

export default function DashboardPage() {
  const user = useAuthStore((s) => s.user);

  const { data, isLoading } = useQuery<Dashboard>({
    queryKey: ["dashboard"],
    queryFn: () => api.get("/dashboard/").then((r) => r.data),
  });

  if (isLoading) {
    return (
      <div className="p-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-muted rounded w-48" />
          <div className="grid grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-24 bg-muted rounded-lg" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  const stats = [
    { label: "Total Tasks", value: data?.total_tasks ?? 0, icon: LayoutList, color: "text-blue-500" },
    { label: "Completed", value: data?.completed_tasks ?? 0, icon: CheckCircle2, color: "text-green-500" },
    { label: "In Progress", value: data?.in_progress_tasks ?? 0, icon: Clock, color: "text-yellow-500" },
    { label: "Backlog", value: data?.pending_tasks ?? 0, icon: Circle, color: "text-muted-foreground" },
  ];

  return (
    <div className="p-8 max-w-5xl">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold">Good to see you, {user?.name?.split(" ")[0]}</h1>
        <p className="text-muted-foreground text-sm mt-1">Here's what's happening across your projects</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {stats.map((s) => (
          <div key={s.label} className="bg-card border rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-muted-foreground">{s.label}</span>
              <s.icon size={16} className={s.color} />
            </div>
            <span className="text-3xl font-semibold">{s.value}</span>
          </div>
        ))}
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* By Priority */}
        <div className="bg-card border rounded-lg p-5">
          <h2 className="font-medium mb-4">Tasks by Priority</h2>
          <div className="space-y-3">
            {(["high", "medium", "low"] as const).map((p) => {
              const count = data?.by_priority[p] ?? 0;
              const total = data?.total_tasks ?? 1;
              const pct = total > 0 ? Math.round((count / total) * 100) : 0;
              const colors = { high: "bg-red-500", medium: "bg-yellow-500", low: "bg-green-500" };
              return (
                <div key={p}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="capitalize text-muted-foreground">{p}</span>
                    <span className="font-medium">{count}</span>
                  </div>
                  <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                    <div className={`h-full ${colors[p]} rounded-full transition-all`} style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* By Project */}
        <div className="bg-card border rounded-lg p-5">
          <h2 className="font-medium mb-4">Projects</h2>
          {data?.by_project.length === 0 ? (
            <p className="text-sm text-muted-foreground">No projects yet</p>
          ) : (
            <div className="space-y-3">
              {data?.by_project.map((p) => {
                const pct = p.total > 0 ? Math.round((p.done / p.total) * 100) : 0;
                return (
                  <div key={p.id}>
                    <div className="flex justify-between text-sm mb-1">
                      <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: p.color }} />
                        <span className="font-medium">{p.name}</span>
                      </div>
                      <span className="text-muted-foreground">{p.done}/{p.total}</span>
                    </div>
                    <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                      <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
