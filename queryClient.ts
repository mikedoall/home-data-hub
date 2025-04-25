import { QueryClient, QueryFunction } from "@tanstack/react-query";

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    try {
      // Try to parse JSON error response
      const contentType = res.headers.get("content-type");
      if (contentType && contentType.includes("application/json")) {
        const errorData = await res.json();
        
        // Check for database configuration errors
        if (errorData.details && (
          errorData.details.includes("DATABASE_URL") || 
          errorData.message === "Database error" ||
          errorData.message === "Database configuration error"
        )) {
          console.error("Database configuration error detected:", errorData);
          
          // Show a friendly error message in development mode
          if (process.env.NODE_ENV === "development") {
            alert(
              "Database configuration error: The DATABASE_URL environment variable may be missing or invalid.\n\n" +
              "To fix this:\n" +
              "1. Go to the Replit Deployments tab\n" +
              "2. Navigate to Configuration > Secrets\n" +
              "3. Add or update the DATABASE_URL secret\n" +
              "4. Redeploy your application"
            );
          }
        }
        
        throw new Error(`${res.status}: ${errorData.message || JSON.stringify(errorData)}`);
      }
    } catch (jsonError) {
      // If JSON parsing fails, fall back to text
      const text = await res.text() || res.statusText;
      throw new Error(`${res.status}: ${text}`);
    }
  }
}

export async function apiRequest(
  method: string,
  url: string,
  data?: unknown | undefined,
): Promise<Response> {
  try {
    const res = await fetch(url, {
      method,
      headers: data ? { "Content-Type": "application/json" } : {},
      body: data ? JSON.stringify(data) : undefined,
      credentials: "include",
    });

    await throwIfResNotOk(res);
    return res;
  } catch (error) {
    console.error(`API request error for ${method} ${url}:`, error);
    
    // Rethrow to allow handling by the calling code
    throw error;
  }
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    console.log("TanStack Query - API call to:", queryKey[0]);
    
    try {
      const res = await fetch(queryKey[0] as string, {
        credentials: "include",
      });
      
      console.log("TanStack Query - Response status:", res.status);
      
      if (unauthorizedBehavior === "returnNull" && res.status === 401) {
        console.log("TanStack Query - 401 Unauthorized, returning null");
        return null;
      }
      
      await throwIfResNotOk(res);
      const data = await res.json();
      console.log("TanStack Query - Response data:", data);
      return data;
    } catch (error) {
      console.error("TanStack Query - Error:", error);
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
