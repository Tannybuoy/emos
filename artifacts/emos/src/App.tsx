import { Switch, Route, Router as WouterRouter, useLocation } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "sonner";
import MagneticGrid from "@/components/magnetic-grid";
import LandingPage from "@/pages/landing";
import WheelPage from "@/pages/wheel";
import ResultsPage from "@/pages/results";
import { capturePageView } from "@/lib/posthog";
import { useEffect } from "react";

// Configure react query client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
      refetchOnWindowFocus: false,
    },
  },
});

function PageViewTracker() {
  const [location] = useLocation();
  useEffect(() => {
    capturePageView(location);
  }, [location]);
  return null;
}

function Router() {
  return (
    <Switch>
      <Route path="/" component={LandingPage} />
      <Route path="/wheel" component={WheelPage} />
      <Route path="/results" component={ResultsPage} />
      <Route>
        <div className="flex flex-col items-center justify-center min-h-screen text-white relative z-10 w-full text-center p-6">
          <h1 className="text-5xl font-display font-extrabold mb-4">Lost in the void</h1>
          <p className="text-white/50 mb-8">This frequency does not exist.</p>
          <a href="/" className="px-6 py-3 rounded-full bg-primary text-black font-bold hover:scale-105 transition-transform">
            Return to safety
          </a>
        </div>
      </Route>
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
        <MagneticGrid />
        <PageViewTracker />
        <Router />
      </WouterRouter>
      <p className="fixed bottom-2 left-0 right-0 text-center text-[11px] text-white/20 z-50 pointer-events-none select-none">
        emos uses PostHog to analyze user interaction<br className="md:hidden" /> to improve website functionality.
      </p>
      <Toaster 
        theme="dark" 
        position="bottom-center" 
        toastOptions={{
          className: 'bg-card border-border text-foreground font-sans'
        }} 
      />
    </QueryClientProvider>
  );
}

export default App;
