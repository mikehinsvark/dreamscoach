import { useAuth } from "@/_core/hooks/useAuth";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { useIsMobile } from "@/hooks/useMobile";
import { BarChart3, ClipboardList, Home, LogOut, PanelLeft, Settings2, Target, Users } from "lucide-react";
import { useLocation } from "wouter";
import { DashboardLayoutSkeleton } from "./DashboardLayoutSkeleton";
import { Button } from "./ui/button";

const menuItems = [
  { icon: Target, label: "Weekly Plan", path: "/app" },
  { icon: ClipboardList, label: "Submit Results", path: "/app/results" },
  { icon: BarChart3, label: "My Dashboard", path: "/app/dashboard" },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { loading, user, logout, signIn } = useAuth();

  if (loading) return <DashboardLayoutSkeleton />;

  if (!user) {
    return (
      <div className="workspace-login">
        <div className="workspace-login-card">
          <div className="workspace-mark">P</div>
          <p className="workspace-overline">Private workspace</p>
          <h1>Sign in to your<br /><em>weekly practice.</em></h1>
          <p>Your goals, results, coaching notes, and team views are available only through your secure account.</p>
          <Button onClick={signIn} className="workspace-login-action">Secure sign in</Button>
          <a href="/">Return to the framework <Home className="h-3.5 w-3.5" /></a>
        </div>
      </div>
    );
  }

  const isManager = user.role === "manager" || user.role === "admin";
  const visibleItems = [
    ...menuItems,
    ...(isManager ? [{ icon: Users, label: "Team Overview", path: "/app/manager" }] : []),
    ...(user.role === "admin" ? [{ icon: Settings2, label: "CRM Settings", path: "/app/settings" }] : []),
  ];
  return (
    <SidebarProvider className="workspace-root">
      <Sidebar collapsible="icon" className="workspace-sidebar">
          <SidebarHeader className="workspace-sidebar-brand">
            <a href="/" className="workspace-brand"><b>P</b><span><strong>PROSPECT</strong><small>COACH</small></span></a>
            <SidebarTrigger className="workspace-sidebar-trigger" aria-label="Toggle sidebar"><PanelLeft className="h-4 w-4" /></SidebarTrigger>
          </SidebarHeader>
          <SidebarContent>
            <SidebarMenu className="workspace-menu">
              {visibleItems.map((item) => <WorkspaceNavItem item={item} key={item.path} />)}
            </SidebarMenu>
          </SidebarContent>
          <SidebarFooter className="workspace-sidebar-footer">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="workspace-profile">
                  <Avatar className="h-8 w-8"><AvatarFallback>{user.name?.charAt(0).toUpperCase() ?? "R"}</AvatarFallback></Avatar>
                  <span><strong>{user.name ?? "Prospect Member"}</strong><small>{user.role === "user" ? "Rep" : user.role}</small></span>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end"><DropdownMenuItem onClick={logout} className="text-destructive"><LogOut className="mr-2 h-4 w-4" />Sign out</DropdownMenuItem></DropdownMenuContent>
            </DropdownMenu>
          </SidebarFooter>
        </Sidebar>
      <WorkspaceTopBar />
      <SidebarInset className="workspace-inset"><main className="workspace-main">{children}</main></SidebarInset>
    </SidebarProvider>
  );
}

function WorkspaceNavItem({ item }: { item: { icon: typeof Target; label: string; path: string } }) {
  const [location, setLocation] = useLocation();
  return (
    <SidebarMenuItem>
      <SidebarMenuButton isActive={location === item.path} onClick={() => setLocation(item.path)} tooltip={item.label}>
        <item.icon className="h-4 w-4" /><span>{item.label}</span>
      </SidebarMenuButton>
    </SidebarMenuItem>
  );
}

function WorkspaceTopBar() {
  const { user } = useAuth();
  const isMobile = useIsMobile();
  if (!isMobile) return null;
  return <div className="workspace-mobile-bar"><SidebarTrigger /><span>PROSPECT <em>{user?.role === "manager" ? "Manager" : "Coach"}</em></span></div>;
}
