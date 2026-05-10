import { Outlet, NavLink, useNavigate } from "react-router-dom";
import { LayoutDashboard, FolderKanban, LogOut } from "lucide-react";
import { useAuthStore } from "@/store/auth";
import { cn } from "@/lib/utils";

export default function Layout() {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate("/login");
  }

  return (
    <div className="flex h-screen bg-background">
      {/* Sidebar */}
      <aside className="w-56 border-r flex flex-col bg-card">
        <div className="px-5 py-4 border-b">
          <span className="font-semibold text-primary text-lg">SprintFlow</span>
        </div>

        <nav className="flex-1 p-3 space-y-1">
          <NavLink
            to="/dashboard"
            className={({ isActive }) =>
              cn(
                "flex items-center gap-2.5 px-3 py-2 rounded-md text-sm transition-colors",
                isActive
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )
            }
          >
            <LayoutDashboard size={16} />
            Dashboard
          </NavLink>
          <NavLink
            to="/projects"
            className={({ isActive }) =>
              cn(
                "flex items-center gap-2.5 px-3 py-2 rounded-md text-sm transition-colors",
                isActive
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )
            }
          >
            <FolderKanban size={16} />
            Projects
          </NavLink>
        </nav>

        <div className="p-3 border-t">
          <div className="flex items-center gap-2.5 px-3 py-2 mb-1">
            <div className="w-7 h-7 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-xs font-medium">
              {user?.name?.[0]?.toUpperCase()}
            </div>
            <span className="text-sm font-medium truncate">{user?.name}</span>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2.5 px-3 py-2 rounded-md text-sm text-muted-foreground hover:bg-muted hover:text-foreground w-full transition-colors"
          >
            <LogOut size={16} />
            Log out
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-auto">
        <Outlet />
      </main>
    </div>
  );
}
