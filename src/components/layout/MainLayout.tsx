import { ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { Sidebar } from "./Sidebar";
import { Header } from "./Header";
import { useAuth } from "@/hooks/useAuth";

interface MainLayoutProps {
  children: ReactNode;
  title: string;
  subtitle?: string;
}

export function MainLayout({ children, title, subtitle }: MainLayoutProps) {
  const navigate = useNavigate();
  const { signOut } = useAuth();

  const handleLogout = async () => {
    await signOut();
    navigate("/auth");
  };

  return (
    <div className="aurora-bg min-h-screen bg-background page-transition">
      <Sidebar onLogout={handleLogout} />
      <div className="ml-64">
        <Header title={title} subtitle={subtitle} />
        <main className="relative z-10 p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
