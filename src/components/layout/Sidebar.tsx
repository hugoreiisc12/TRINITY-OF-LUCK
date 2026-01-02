import { Link, useLocation } from "react-router-dom";
import { 
  Home, 
  BarChart3, 
  FileBarChart, 
  History, 
  Settings, 
  LogOut,
  TrendingUp
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

const navItems = [
  { path: "/", label: "Dashboard", icon: Home },
  { path: "/analysis", label: "Análise", icon: BarChart3 },
  { path: "/results", label: "Resultados", icon: FileBarChart },
  { path: "/history", label: "Histórico", icon: History },
  { path: "/settings", label: "Configurações", icon: Settings },
];

interface SidebarProps {
  onLogout?: () => void;
}

export function Sidebar({ onLogout }: SidebarProps) {
  const location = useLocation();

  return (
    <aside className="fixed left-0 top-0 z-40 h-screen w-64 border-r border-border/50 bg-sidebar/80 backdrop-blur-xl">
      <div className="flex h-full flex-col">
        {/* Logo */}
        <div className="flex h-20 items-center gap-3 border-b border-border/50 px-6">
          <div className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-aurora-gradient shadow-lg">
            <TrendingUp className="h-5 w-5 text-primary-foreground" />
            <div className="absolute inset-0 rounded-xl bg-aurora-gradient opacity-50 blur-md" />
          </div>
          <div>
            <h1 className="font-display text-lg font-bold text-foreground">
              Trinity
            </h1>
            <span className="text-xs text-muted-foreground">of Luck</span>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-1 p-4">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            const Icon = item.icon;
            
            return (
              <Link
                key={item.path}
                to={item.path}
                className={cn(
                  "group flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium transition-all duration-300",
                  isActive
                    ? "bg-primary/20 text-primary shadow-[0_0_20px_hsl(var(--aurora-cyan)/0.2)]"
                    : "text-muted-foreground hover:bg-accent/50 hover:text-foreground"
                )}
              >
                <Icon 
                  className={cn(
                    "h-5 w-5 transition-all duration-300",
                    isActive 
                      ? "text-primary drop-shadow-[0_0_8px_hsl(var(--aurora-cyan))]" 
                      : "group-hover:text-primary"
                  )} 
                />
                <span>{item.label}</span>
                {isActive && (
                  <div className="ml-auto h-2 w-2 rounded-full bg-primary shadow-[0_0_8px_hsl(var(--aurora-cyan))]" />
                )}
              </Link>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="border-t border-border/50 p-4">
          <Button
            variant="ghost"
            className="w-full justify-start gap-3 text-muted-foreground hover:text-destructive"
            onClick={onLogout}
          >
            <LogOut className="h-5 w-5" />
            <span>Sair</span>
          </Button>
        </div>
      </div>
    </aside>
  );
}
