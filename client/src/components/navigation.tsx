import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { LogOut, Trophy, Calendar, Target, Users, Settings, MapPin, List, Award, Gamepad2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface NavigationProps {
  currentView: string;
  onViewChange: (view: string) => void;
}

export function BottomNavigation({ currentView, onViewChange }: NavigationProps) {
  const { isAdmin } = useAuth();

  const navItems = [
    { id: "leaderboard", label: "Leaders", icon: Trophy },
    { id: "achievements", label: "Badges", icon: Award },
    { id: "score-entry", label: "Scores", icon: Target, adminOnly: true },
    { id: "players", label: "Players", icon: Users },
    { id: "tournaments", label: "Tournaments", icon: Gamepad2, adminOnly: true },
  ].filter(item => !item.adminOnly || isAdmin);

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-40 sm:hidden">
      <div className={`grid h-16 ${navItems.length === 5 ? 'grid-cols-5' : navItems.length === 4 ? 'grid-cols-4' : 'grid-cols-3'}`}>
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentView === item.id;
          
          return (
            <button
              key={item.id}
              onClick={() => onViewChange(item.id)}
              className={cn(
                "flex flex-col items-center justify-center space-y-1",
                isActive ? "text-golf-green" : "text-gray-500"
              )}
            >
              <Icon className="h-5 w-5" />
              <span className="text-xs font-medium">{item.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}

export function DesktopSidebar({ currentView, onViewChange }: NavigationProps) {
  const { isAdmin } = useAuth();

  const navItems = [
    { id: "leaderboard", label: "Leaderboard", icon: Trophy },
    { id: "daily", label: "Daily Results", icon: Calendar },
    { id: "achievements", label: "Achievements", icon: Award },
    { id: "score-entry", label: "Score Entry", icon: Target, adminOnly: true },
    { id: "players", label: "Players", icon: Users },
    { id: "tournaments", label: "Tournament Management", icon: Gamepad2, adminOnly: true },
    { id: "courses", label: "Courses", icon: MapPin, adminOnly: true },
  ].filter(item => !item.adminOnly || isAdmin);

  return (
    <div className="hidden sm:block fixed left-0 top-16 bottom-0 w-64 bg-white border-r border-gray-200 overflow-y-auto">
      <nav className="p-4 space-y-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentView === item.id;
          
          return (
            <button
              key={item.id}
              onClick={() => onViewChange(item.id)}
              className={cn(
                "w-full flex items-center space-x-3 px-3 py-2 rounded-lg font-medium text-left",
                isActive 
                  ? "bg-golf-green/10 text-golf-green" 
                  : "text-gray-600 hover:bg-gray-50"
              )}
            >
              <Icon className="h-5 w-5" />
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>
    </div>
  );
}

export function Header() {
  const { user, logout } = useAuth();

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  };

  return (
    <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center space-x-4">
            <Target className="text-golf-green h-8 w-8" />
            <h1 className="text-xl font-bold golf-dark">BroGolfTracker</h1>
          </div>
          <div className="flex items-center space-x-4">
            {user?.isAdmin && (
              <div className="hidden sm:flex items-center space-x-2 bg-golf-green/10 px-3 py-1 rounded-full">
                <Settings className="text-golf-green h-4 w-4" />
                <span className="text-sm font-medium text-golf-green">Admin</span>
              </div>
            )}
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-golf-green rounded-full flex items-center justify-center">
                <span className="text-white text-sm font-semibold">
                  {user ? getInitials(user.firstName, user.lastName) : "?"}
                </span>
              </div>
              <span className="hidden sm:block text-sm font-medium text-gray-700">
                {user ? `${user.firstName} ${user.lastName}` : "Guest"}
              </span>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={logout}
              className="text-gray-500 hover:text-gray-700"
            >
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
}
