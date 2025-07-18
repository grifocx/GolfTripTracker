import { Target } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function Login() {
  return (
    <div className="min-h-screen bg-golf-light flex items-center justify-center px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <Target className="h-12 w-12 text-golf-green" />
          </div>
          <CardTitle className="text-2xl font-bold golf-dark">Stick-IT</CardTitle>
          <CardDescription>Welcome to your golf tournament management system</CardDescription>
        </CardHeader>
        <CardContent className="text-center">
          <div className="space-y-4">
            <p className="text-sm text-golf-dark/70">
              Sign in with your Replit account to access the tournament features
            </p>
            <Button 
              onClick={() => window.location.href = '/api/login'}
              className="w-full bg-golf-green hover:bg-golf-green/90 text-white"
              size="lg"
            >
              Sign in with Replit
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}