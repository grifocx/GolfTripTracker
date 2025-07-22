import { QueryClient, QueryFunction } from "@tanstack/react-query";

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    let errorMessage = res.statusText || "Unknown error";
    try {
      const text = await res.text();
      if (text && typeof text === 'string') {
        try {
          const errorData = JSON.parse(text);
          // Handle nested error structures from the backend
          if (errorData.error && errorData.error.message) {
            errorMessage = errorData.error.message;
          } else if (errorData.message) {
            errorMessage = errorData.message;
          } else if (typeof errorData === 'string') {
            errorMessage = errorData;
          } else {
            errorMessage = text;
          }
        } catch {
          errorMessage = text;
        }
      }
    } catch {
      // Use default status text if unable to read response
      errorMessage = res.statusText || "Network error";
    }
    throw new Error(errorMessage);
  }
}

export async function apiRequest(
  method: string,
  url: string,
  data?: unknown | undefined,
): Promise<Response> {
  try {
    // For static deployment, use mock data
    if (window.location.hostname.includes('netlify.app')) {
      return mockApiRequest(method, url, data);
    }
    
    const headers: Record<string, string> = {};
    if (data) {
      headers["Content-Type"] = "application/json";
    }
    
    const res = await fetch(url, {
      method,
      headers,
      body: data ? JSON.stringify(data) : undefined,
      credentials: "include",
      // Add Safari compatibility
      mode: "cors",
      cache: "no-cache",
    });

    await throwIfResNotOk(res);
    return res;
  } catch (error) {
    console.error("API request failed:", error);
    throw error;
  }
}

// Mock API for static deployment
async function mockApiRequest(method: string, url: string, data?: unknown): Promise<Response> {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 100));
  
  const mockData = getMockData(url, method);
  
  return new Response(JSON.stringify(mockData), {
    status: 200,
    headers: { 'Content-Type': 'application/json' }
  });
}

function getMockData(url: string, method: string) {
  // Mock tournament data
  if (url.includes('/api/tournament/active')) {
    return {
      id: 1,
      name: "Demo Golf Tournament 2025",
      startDate: "2025-01-20",
      endDate: "2025-01-22",
      dailyBuyIn: "50.00",
      overallBuyIn: "125.00",
      status: "in_progress",
      courseId: 1
    };
  }
  
  // Mock leaderboard data
  if (url.includes('/api/tournaments/') && url.includes('/leaderboard')) {
    return [
      {
        userId: 1,
        firstName: "John",
        lastName: "Doe",
        handicapIndex: "12.5",
        netScore: -2,
        totalStrokes: 142,
        roundsPlayed: 2,
        position: 1
      },
      {
        userId: 2,
        firstName: "Jane",
        lastName: "Smith",
        handicapIndex: "8.3",
        netScore: 1,
        totalStrokes: 145,
        roundsPlayed: 2,
        position: 2
      }
    ];
  }
  
  // Mock users data
  if (url.includes('/api/users')) {
    return [
      {
        id: 1,
        username: "demo_admin",
        firstName: "Demo",
        lastName: "Admin",
        email: "admin@demo.com",
        handicapIndex: "0.0",
        isAdmin: true
      },
      {
        id: 2,
        username: "demo_player",
        firstName: "Demo",
        lastName: "Player",
        email: "player@demo.com",
        handicapIndex: "15.2",
        isAdmin: false
      }
    ];
  }
  
  // Mock courses data
  if (url.includes('/api/courses')) {
    return [
      {
        id: 1,
        name: "Demo Golf Course",
        location: "Demo City, Demo State",
        par: 72,
        yardage: 6800,
        courseRating: 72.1,
        slopeRating: 113
      }
    ];
  }
  
  // Default empty response
  return [];
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    try {
      const res = await fetch(queryKey.join("/") as string, {
        credentials: "include",
        mode: "cors",
        cache: "no-cache",
      });

      if (unauthorizedBehavior === "returnNull" && res.status === 401) {
        return null;
      }

      await throwIfResNotOk(res);
      return await res.json();
    } catch (error) {
      console.error("Query fetch failed:", error);
      throw error;
    }
  };

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      refetchInterval: false,
      refetchOnWindowFocus: false,
      staleTime: Infinity,
      retry: false,
    },
    mutations: {
      retry: false,
    },
  },
});