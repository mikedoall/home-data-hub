import React from "react";
import { Switch, Route, Link } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";

// Import pages
import TailwindCleanPage from "./pages/tailwind-clean";
import TailwindTestPage from "./pages/tailwind-test";

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <div>
        <nav className="bg-gray-800 text-white p-4">
          <ul className="flex space-x-4">
            <li><Link href="/">Home</Link></li>
            <li><Link href="/test">Test Page</Link></li>
          </ul>
        </nav>
        
        <Switch>
          <Route path="/" component={TailwindCleanPage} />
          <Route path="/test" component={TailwindTestPage} />
        </Switch>
      </div>
    </QueryClientProvider>
  );
}

export default App;