import { Component, useEffect } from "react";
import { Navigate, Route, Routes, useLocation } from "react-router-dom";

import { Alert, AlertDescription, AlertTitle } from "./components/ui/alert.jsx";
import Home from "./pages/Home.jsx";
import SubmitIdea from "./pages/SubmitIdea.jsx";
import LiveSession from "./pages/LiveSession.jsx";
import Report from "./pages/Report.jsx";
import { warmBackend } from "./lib/api.js";

class RouteErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidUpdate(previousProps) {
    if (previousProps.locationKey !== this.props.locationKey && this.state.error) {
      this.setState({ error: null });
    }
  }

  render() {
    if (this.state.error) {
      return (
        <main className="min-h-screen bg-background px-5 py-8 text-foreground">
          <div className="mx-auto flex min-h-[70vh] max-w-3xl items-center">
            <Alert variant="destructive">
              <AlertTitle>Something went wrong</AlertTitle>
              <AlertDescription>
                {this.state.error?.message || "The page could not be rendered."}
              </AlertDescription>
            </Alert>
          </div>
        </main>
      );
    }

    return this.props.children;
  }
}

function RoutedApp() {
  const location = useLocation();

  return (
    <RouteErrorBoundary locationKey={location.key}>
      <Routes location={location}>
        <Route path="/" element={<Home />} />
        <Route path="/submit" element={<SubmitIdea />} />
        <Route path="/session/:id" element={<LiveSession />} />
        <Route path="/report/:id" element={<Report />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </RouteErrorBoundary>
  );
}

export default function App() {
  useEffect(() => {
    warmBackend();
  }, []);

  return <RoutedApp />;
}
