import { useAuth } from "@/hooks/use-auth";
import { Header, BottomNavigation, DesktopSidebar } from "./navigation";

interface LayoutProps {
  children: React.ReactNode;
  currentView: string;
  onViewChange: (view: string) => void;
}

export function Layout({ children, currentView, onViewChange }: LayoutProps) {
  const { user } = useAuth();

  console.log("Layout render - user:", user, "currentView:", currentView);

  if (!user) {
    console.log("Layout: No user, returning children directly");
    return <>{children}</>;
  }

  try {
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
  } catch (error) {
    console.error("Error in Layout component:", error);
    return (
      <div className="min-h-screen bg-golf-light p-4">
        <div className="max-w-7xl mx-auto">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-center">
            <p className="text-red-600">Error loading layout. Please refresh the page.</p>
          </div>
        </div>
      </div>
    );
  }
}
