"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import {
  Scale,
  LayoutDashboard,
  LogIn,
  UserPlus,
  Weight,
  PackageCheck,
  Receipt,
  DoorOpen,
  Wallet,
  Menu,
  X,
  ShoppingCart,
  MessageSquare,
  Star,
  ShieldCheck,
} from "lucide-react"
import { DashboardView } from "@/components/dashboard-view"
import { GateEntryView } from "@/components/gate-entry-view"
import { FirstWeightView } from "@/components/first-weight-view"
import { LoadVehicleView } from "@/components/load-vehicle-view"
import { SecondWeightView } from "@/components/second-weight-view"
import { GenerateInvoiceView } from "@/components/generate-invoice-view"
import { GateOutView } from "@/components/gate-out-view"
import { PaymentView } from "@/components/payment-view"
import { OrdersView } from "@/components/order-view"
import { ComplaintDetailsView } from "@/components/complaint-details-view"
import { PartyFeedbackView } from "@/components/party-feedback-view"
import { RegisterView } from "@/components/register-view"
import { PermissionsView } from "@/components/permissions-view"
import { LoginForm } from "@/components/login-form"
import { useAuth } from "@/components/auth-context"
import Image from "next/image"
import logo from "@/public/Screenshot_2025-08-13_at_1.45.14_PM-removebg-preview.png"

const sidebarItems = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { id: "orders", label: "Orders", icon: ShoppingCart },
  { id: "gate-entry", label: "Gate Entry", icon: LogIn },
  { id: "first-weight", label: "First Weight", icon: Weight },
  { id: "load-vehicle", label: "Load Vehicle", icon: PackageCheck },
  { id: "second-weight", label: "Second Weight", icon: Scale },
  { id: "generate-invoice", label: "Generate Invoice", icon: Receipt },
  { id: "gate-out", label: "Gate Out Entry", icon: DoorOpen },
  { id: "payment", label: "Payment", icon: Wallet },
  { id: "complaint-details", label: "Complaint Details", icon: MessageSquare },
  { id: "party-feedback", label: "Party Feedback", icon: Star },
  { id: "permissions", label: "Permissions", icon: ShieldCheck },
  { id: "register", label: "User Register", icon: UserPlus },
]

export default function O2DSystem() {
  const { isAuthenticated, access: userAccess, logout: authLogout, loading: authLoading, user } = useAuth()
  // ✅ Initialize activeView as null, will be set based on user access
  const [activeView, setActiveView] = useState<string | null>(null)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const isAdmin =
    user?.role?.toLowerCase?.() === "admin" ||
    userAccess.includes("admin") ||
    userAccess.length === sidebarItems.length

  useEffect(() => {
    const savedView = localStorage.getItem("o2d_active_view");

    if (!isAuthenticated) {
      setActiveView(null);
      return;
    }

    const savedIsValid =
      savedView && (isAdmin || userAccess.includes(savedView));

    if (savedIsValid) {
      setActiveView(savedView);
      return;
    }

    const dashboardAvailable = isAdmin || userAccess.includes("dashboard");
    if (dashboardAvailable) {
      setActiveView("dashboard");
      localStorage.setItem("o2d_active_view", "dashboard");
      return;
    }

    const firstAccessibleView = sidebarItems.find(
      (item) => item.id !== "register" && userAccess.includes(item.id)
    )?.id;

    if (firstAccessibleView) {
      setActiveView(firstAccessibleView);
      localStorage.setItem("o2d_active_view", firstAccessibleView);
    }
  }, [isAuthenticated, userAccess]);

  const handleLogout = async () => {
    await authLogout()
    setActiveView(null)
    localStorage.removeItem("o2d_active_view")
  }

  const handleViewChange = (viewId: string) => {
    setActiveView(viewId);
    localStorage.setItem("o2d_active_view", viewId);
    setIsMobileMenuOpen(false);
  };

  const accessibleItems = sidebarItems.filter((item) => {
    if (isAdmin) return true;
    return userAccess.includes(item.id);
  });

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    )
  }

  if (!isAuthenticated) {
    return <LoginForm />
  }

  const renderActiveView = () => {
    // ✅ Fixed: Handle loading state when activeView is null
    if (!activeView) {
      return (
        <div className="flex items-center justify-center h-full">
          <p className="text-muted-foreground">Loading...</p>
        </div>
      )
    }

    const canAccess = isAdmin || userAccess.includes(activeView);
    // ✅ Fixed: Check if user has access to the current view (admins bypass)
    if (!canAccess) {
      return (
        <div className="flex items-center justify-center h-full">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-destructive mb-2">Access Denied</h2>
            <p className="text-muted-foreground">You don't have permission to access this page.</p>
          </div>
        </div>
      )
    }

    switch (activeView) {
      case "dashboard":
        return <DashboardView />
      case "orders":
        return <OrdersView />
      case "gate-entry":
        return <GateEntryView />
      case "first-weight":
        return <FirstWeightView />
      case "load-vehicle":
        return <LoadVehicleView />
      case "second-weight":
        return <SecondWeightView />
      case "generate-invoice":
        return <GenerateInvoiceView />
      case "gate-out":
        return <GateOutView />
      case "payment":
        return <PaymentView />
      case "complaint-details":
        return <ComplaintDetailsView />
      case "party-feedback":
        return <PartyFeedbackView />
      case "permissions":
        return <PermissionsView />
      case "register":
        return <RegisterView />
      default:
        return (
          <div className="flex items-center justify-center h-full">
            <p className="text-muted-foreground">Page not found</p>
          </div>
        )
    }
  }

  return (
    <div className="flex h-screen bg-background">
      {isMobileMenuOpen && (
        <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={() => setIsMobileMenuOpen(false)} />
      )}

      <div
        className={`
        fixed lg:static inset-y-0 left-0 z-50 w-64 bg-sidebar text-sidebar-foreground border-r border-sidebar-border
        transform transition-transform duration-300 ease-in-out lg:transform-none
        ${isMobileMenuOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
      `}
      >
        <div className="flex h-full flex-col">
          <div className="p-4 lg:p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Image
                  src={logo}
                  alt="O2D Logo"
                  width={72}
                  height={72}
                  className="rounded-md w-[72px] h-[72px]"
                  priority
                />
                <div>
                  <h1 className="text-lg lg:text-xl font-bold text-black">O2D System</h1>
                  <p className="text-xs lg:text-sm text-sidebar-foreground/70 mt-1">Order to Dispatch</p>
                </div>
              </div>

              <Button
                variant="ghost"
                size="sm"
                className="lg:hidden text-sidebar-foreground"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <nav className="px-3 lg:px-4 space-y-1 lg:space-y-2 flex-1 overflow-y-auto pb-16">
            {accessibleItems.map((item) => {
              const Icon = item.icon
              return (
                <Button
                  key={item.id}
                  variant={activeView === item.id ? "secondary" : "ghost"}
                  className={`w-full justify-start gap-2 lg:gap-3 text-sm lg:text-base py-2 lg:py-2.5 ${
                    activeView === item.id
                      ? "bg-sidebar-accent text-sidebar-accent-foreground"
                      : "text-sidebar-foreground hover:bg-sidebar-accent/50"
                  }`}
                  onClick={() => handleViewChange(item.id)}
                >
                  <Icon className="h-4 w-4 flex-shrink-0" />
                  <span className="truncate">{item.label}</span>
                </Button>
              )
            })}
          </nav>

          <div className="px-4 pb-4">
            <Button
              variant="outline"
              className="w-full justify-start gap-2 text-sm bg-transparent"
              onClick={handleLogout}
            >
              <LogIn className="h-4 w-4" />
              Logout
            </Button>
          </div>
        </div>
      </div>

      <div className="flex-1 flex flex-col min-w-0">
        <div className="lg:hidden bg-background border-b border-border p-4">
          <div className="flex items-center justify-between">
            <Button variant="ghost" size="sm" onClick={() => setIsMobileMenuOpen(true)}>
              <Menu className="h-5 w-5" />
            </Button>
            <h2 className="font-semibold text-foreground capitalize">
              {sidebarItems.find((item) => item.id === activeView)?.label || "Loading..."}
            </h2>
            <div className="w-9" />
          </div>
        </div>

        <div className="flex-1 overflow-auto">
          <div className="p-4 lg:p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-sm text-muted-foreground">Welcome back</p>
                <p className="text-base font-semibold text-foreground">{user?.username || "User"}</p>
              </div>
            </div>
            {renderActiveView()}
          </div>
        </div>

        <footer className="bg-background border-t border-border p-3 lg:p-4">
          <div className="text-center">
            <p className="text-xs lg:text-sm text-muted-foreground">
              Powered by{" "}
              <a
                href="https://botivate.in"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:text-primary/80 font-medium transition-colors duration-200"
              >
                Botivate
              </a>
            </p>
          </div>
        </footer>
      </div>
    </div>
  )
}
