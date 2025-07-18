import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { Layout } from "@/components/layout";
import Leaderboard from "./leaderboard";
import ScoreEntry from "./score-entry";
import Players from "./players";
import Admin from "./admin";
import Achievements from "./achievements";
import TournamentManagement from "./tournament-management";

export default function Dashboard() {
  const { user } = useAuth();
  const [currentView, setCurrentView] = useState("leaderboard");

  console.log("Dashboard render - user:", user, "currentView:", currentView);

  if (!user) {
    console.log("Dashboard: No user, redirecting to login");
    return null;
  }

  const renderView = () => {
    try {
      switch (currentView) {
        case "leaderboard":
        case "daily":
          return <Leaderboard />;
        case "achievements":
          return <Achievements />;
        case "score-entry":
          return <ScoreEntry />;
        case "players":
          return <Players />;
        case "tournaments":
          return <TournamentManagement />;
        case "admin":
        case "courses":
          return <Admin />;
        default:
          return <Leaderboard />;
      }
    } catch (error) {
      console.error("Error rendering view:", error);
      return (
        <div className="p-4 text-center">
          <p className="text-red-600">Error loading view. Please try refreshing.</p>
        </div>
      );
    }
  };

  return (
    <Layout currentView={currentView} onViewChange={setCurrentView}>
      {renderView()}
    </Layout>
  );
}
