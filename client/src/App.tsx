import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/hooks/use-auth";
import { ErrorBoundary } from "@/components/error-boundary";
import Login from "@/pages/login";
import Dashboard from "@/pages/dashboard";
import NotFound from "@/pages/not-found";

function AppContent() {
  const { user } = useAuth();

  console.log("AppContent render - user:", user);

  if (!user) {
    return <Login />;
  }

  return (
    <ErrorBoundary>
      <Switch>
        <Route path="/" component={Dashboard} />
        <Route component={NotFound} />
      </Switch>
    </ErrorBoundary>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <AuthProvider>
            <AppContent />
            <Toaster />
          </AuthProvider>
        </TooltipProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

export default App;
