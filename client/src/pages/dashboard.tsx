import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { Layout } from "@/components/layout";
import Leaderboard from "./leaderboard";
import ScoreEntry from "./score-entry";
import Players from "./players";
import Admin from "./admin";

export default function Dashboard() {
  const { user } = useAuth();
  const [currentView, setCurrentView] = useState("leaderboard");

  const renderView = () => {
    switch (currentView) {
      case "leaderboard":
      case "daily":
        return <Leaderboard />;
      case "score-entry":
        return <ScoreEntry />;
      case "players":
        return <Players />;
      case "admin":
      case "courses":
      case "rounds":
        return <Admin />;
      default:
        return <Leaderboard />;
    }
  };

  return (
    <Layout currentView={currentView} onViewChange={setCurrentView}>
      {renderView()}
    </Layout>
  );
}
