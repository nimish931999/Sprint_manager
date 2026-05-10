export interface User {
  id: string;
  email: string;
  name: string;
  created_at: string;
}

export interface Project {
  id: string;
  name: string;
  description: string | null;
  color: string;
  archived: boolean;
  created_at: string;
  owner_id: string;
  task_count: number;
}

export type TaskStatus = "backlog" | "in_progress" | "done";
export type TaskPriority = "low" | "medium" | "high";

export interface Task {
  id: string;
  title: string;
  description: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  labels: string | null;
  due_date: string | null;
  story_points: number | null;
  project_id: string;
  assignee_id: string | null;
  assignee: User | null;
  created_at: string;
  updated_at: string;
}

export interface Dashboard {
  total_tasks: number;
  completed_tasks: number;
  pending_tasks: number;
  in_progress_tasks: number;
  by_priority: Record<string, number>;
  by_project: Array<{
    id: string;
    name: string;
    color: string;
    total: number;
    done: number;
  }>;
}
