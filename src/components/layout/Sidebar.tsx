
import { SidebarContent } from "./SidebarContent";

interface SidebarProps {
  onLogout?: () => void;
}

export function Sidebar({ onLogout }: SidebarProps) {
  return (
    <aside className="fixed left-0 top-0 z-40 hidden h-screen w-64 border-r border-border/50 bg-background md:flex">
      <SidebarContent onLogout={onLogout} />
    </aside>
  );
}
