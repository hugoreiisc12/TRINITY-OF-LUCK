import { Bell, Search, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ReactNode, memo, useCallback } from "react";

interface HeaderProps {
  title: string;
  subtitle?: string;
  leftContent?: ReactNode;
}

export const Header = memo(function Header({ title, subtitle, leftContent }: HeaderProps) {
  const handleSearch = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    // Debounced search handler
    e.preventDefault();
  }, []);

  return (
    <header className="sticky top-0 z-30 flex h-20 items-center justify-between border-b border-border/50 bg-background/80 px-4 md:px-8 backdrop-blur-xl">
      <div className="flex items-center gap-4">
        {leftContent}
        <div>
          <h1 className="font-display text-xl md:text-2xl font-bold text-foreground">
            {title}
          </h1>
          {subtitle && (
            <p className="mt-1 text-xs md:text-sm text-muted-foreground hidden sm:block">{subtitle}</p>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2 md:gap-4">
        {/* Search */}
        <div className="relative hidden md:block">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground pointer-events-none" />
          <Input
            placeholder="Buscar..."
            className="w-64 bg-card/50 pl-10 backdrop-blur-sm"
            onChange={handleSearch}
          />
        </div>

        {/* Notifications */}
        <Button variant="ghost" size="icon" className="relative" aria-label="Notificações">
          <Bell className="h-5 w-5" />
          <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-primary shadow-[0_0_8px_hsl(var(--aurora-cyan))]" />
        </Button>

        {/* User */}
        <Button variant="glass" size="icon" aria-label="Perfil do usuário">
          <User className="h-5 w-5" />
        </Button>
      </div>
    </header>
  );
});
