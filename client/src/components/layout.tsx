import { useAuth } from "@/hooks/use-auth";
import { Header, BottomNavigation, DesktopSidebar } from "./navigation";

interface LayoutProps {
  children: React.ReactNode;
  currentView: string;
  onViewChange: (view: string) => void;
}

export function Layout({ children, currentView, onViewChange }: LayoutProps) {
  const { user } = useAuth();

  if (!user) {
    return children;
  }

  return (
    <div className="min-h-screen bg-golf-light">
      <Header />
      <BottomNavigation currentView={currentView} onViewChange={onViewChange} />
      <DesktopSidebar currentView={currentView} onViewChange={onViewChange} />
      
      <main className="sm:ml-64 pt-4 pb-20 sm:pb-4 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
}
