/**
 * Performance Ledger style reminder: public coaching content and protected workspaces
 * belong in one coherent system with clear routes between marketing and private practice.
 */
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Route, Switch } from "wouter";
import DashboardLayout from "./components/DashboardLayout";
import ErrorBoundary from "./components/ErrorBoundary";
import { useAuth } from "./_core/hooks/useAuth";
import { ThemeProvider } from "./contexts/ThemeContext";
import "./app.css";
import "./review.css";
import Home from "./pages/Home";
import CrmSettings from "./pages/CrmSettings";
import ManagerDashboard from "./pages/ManagerDashboard";
import RepDashboard from "./pages/RepDashboard";
import Results from "./pages/Results";
import Workspace from "./pages/Workspace";

function SecurePage({ children }: { children: React.ReactNode }) {
  return <DashboardLayout>{children}</DashboardLayout>;
}

function AdminPage({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) return <DashboardLayout><div className="workspace-state">Checking administrator access…</div></DashboardLayout>;
  if (user?.role !== "admin") return <DashboardLayout><div className="workspace-empty"><h1>Administrator access required.</h1><p>Company CRM controls are limited to the designated administrator.</p></div></DashboardLayout>;
  return <DashboardLayout>{children}</DashboardLayout>;
}

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/goals" component={Home} />
      <Route path="/app">{() => <SecurePage><Workspace /></SecurePage>}</Route>
      <Route path="/app/results">{() => <SecurePage><Results /></SecurePage>}</Route>
      <Route path="/app/dashboard">{() => <SecurePage><RepDashboard /></SecurePage>}</Route>
      <Route path="/app/manager">{() => <SecurePage><ManagerDashboard /></SecurePage>}</Route>
      <Route path="/app/settings">{() => <AdminPage><CrmSettings /></AdminPage>}</Route>
      <Route component={Home} />
    </Switch>
  );
}

export default function App() {
  return <ErrorBoundary><ThemeProvider defaultTheme="dark"><TooltipProvider><Toaster /><Router /></TooltipProvider></ThemeProvider></ErrorBoundary>;
}
