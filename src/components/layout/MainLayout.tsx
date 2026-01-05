
import { ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { Sidebar } from "./Sidebar";
import { MobileNav } from "./MobileNav";
import { Header } from "./Header";
import { useAuth } from "@/hooks/useAuth";
import MatrixBackground from "@/components/animations/MatrixBackground";
import PageTransition from "@/components/animations/PageTransition";

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
    <div className="aurora-bg min-h-screen bg-background page-transition overflow-x-hidden">
      <Sidebar onLogout={handleLogout} />
      <div className="ml-0 md:ml-64 min-h-screen flex flex-col transition-all duration-300">
        <Header 
          title={title} 
          subtitle={subtitle} 
          leftContent={<MobileNav onLogout={handleLogout} />}
        />
        <MatrixBackground opacity={0.15} speed={1} fontSize={14} />
        <main className="relative z-10 flex-1 p-4 md:p-8 overflow-x-hidden w-full">
          <PageTransition>
            <div className="mx-auto max-w-7xl w-full">
              {children}
            </div>
          </PageTransition>
        </main>
      </div>
    </div>
  );
}
