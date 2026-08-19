import { useQueryClient } from "@tanstack/react-query";
import { Link, useNavigate } from "@tanstack/react-router";
import {
  BookOpen,
  Home,
  LayoutDashboard,
  LogOut,
  Menu,
  MessageCircle,
  Stethoscope,
  User as UserIcon,
} from "lucide-react";
import { useState, type ReactNode } from "react";
import { toast } from "sonner";

import { Logo } from "@/components/brand";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { displayName, useAuth } from "@/lib/auth";
import { DISCLAIMER_TEXT } from "@/lib/health-data";

const NAV = [
  { to: "/dashboard", label: "Dashboard" },
  { to: "/assessment", label: "Assessment" },
  { to: "/chat", label: "AI Chat" },
  { to: "/education", label: "Health Education" },
  { to: "/tools", label: "Health Tools" },
  { to: "/history", label: "History" },
  { to: "/about", label: "About" },
] as const;

const MOBILE_TABS = [
  { to: "/", label: "Home", Icon: Home },
  { to: "/assessment", label: "Assess", Icon: Stethoscope },
  { to: "/chat", label: "Chat", Icon: MessageCircle },
  { to: "/education", label: "Learn", Icon: BookOpen },
  { to: "/dashboard", label: "Me", Icon: LayoutDashboard },
] as const;

export function SiteShell({ children }: { children: ReactNode }) {
  const { user, profile, signOut } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [menuOpen, setMenuOpen] = useState(false);
  const [signingOut, setSigningOut] = useState(false);

  async function handleSignOut() {
    if (signingOut) return;
    setSigningOut(true);
    try {
      await queryClient.cancelQueries();
      queryClient.clear();
      await signOut();
      setMenuOpen(false);
      toast.success("You have been signed out.");
      void navigate({ to: "/", replace: true });
    } catch {
      toast.error("We couldn't sign you out. Please try again.");
    } finally {
      setSigningOut(false);
    }
  }

  return (
    <div className="flex min-h-screen flex-col">
      <header className="no-print sticky top-0 z-40 border-b border-border bg-background/85 backdrop-blur">
        <div className="mx-auto flex h-16 w-full max-w-7xl items-center gap-4 px-4">
          <Logo />
          <nav aria-label="Main" className="ml-auto hidden items-center gap-1 lg:flex">
            {NAV.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                className="rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
                activeProps={{ className: "bg-secondary text-foreground" }}
              >
                {item.label}
              </Link>
            ))}
          </nav>

          <div className="ml-auto flex items-center gap-2 lg:ml-0">
            <ThemeToggle />
            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="gap-2">
                    <UserIcon className="h-4 w-4" />
                    <span className="hidden sm:inline">{displayName(profile, user)}</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuLabel>My account</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link to="/dashboard">Dashboard</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to="/history">Health History</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to="/profile">Profile</Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onSelect={() => void handleSignOut()}>
                    <LogOut className="mr-2 h-4 w-4" /> Sign out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Button asChild size="sm" className="hidden sm:inline-flex">
                <Link to="/auth">Sign in</Link>
              </Button>
            )}

            <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="lg:hidden" aria-label="Open menu">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-72">
                <SheetTitle className="sr-only">Navigation</SheetTitle>
                <nav aria-label="Mobile" className="mt-8 flex flex-col gap-1">
                  {[{ to: "/", label: "Home" }, ...NAV, { to: "/dashboard", label: "Dashboard" }].map(
                    (item) => (
                      <Link
                        key={item.to}
                        to={item.to}
                        onClick={() => setMenuOpen(false)}
                        className="rounded-md px-3 py-3 text-sm font-medium hover:bg-secondary"
                      >
                        {item.label}
                      </Link>
                    ),
                  )}
                  {!user ? (
                    <Link
                      to="/auth"
                      onClick={() => setMenuOpen(false)}
                      className="mt-2 rounded-md bg-primary px-3 py-3 text-center text-sm font-semibold text-primary-foreground"
                    >
                      Sign in / Sign up
                    </Link>
                  ) : (
                    <button
                      type="button"
                      onClick={() => void handleSignOut()}
                      disabled={signingOut}
                      className="mt-2 flex items-center justify-center gap-2 rounded-md border border-border px-3 py-3 text-sm font-semibold"
                    >
                      <LogOut className="h-4 w-4" /> {signingOut ? "Signing out…" : "Sign out"}
                    </button>
                  )}
                  <div className="mt-2 border-t border-border pt-2">
                    <ThemeToggle showLabel />
                  </div>
                </nav>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </header>

      <main className="flex-1 pb-20 lg:pb-0">{children}</main>

      <footer className="no-print border-t border-border bg-card">
        <div className="mx-auto grid w-full max-w-7xl gap-8 px-4 py-10 md:grid-cols-4">
          <div className="space-y-3">
            <Logo />
            <p className="text-sm text-muted-foreground">
              Ask. Analyze. Understand. Take the Next Step.
            </p>
          </div>
          <FooterCol
            title="Product"
            links={[
              { to: "/assessment", label: "Health Assessment" },
              { to: "/chat", label: "MediSage AI Chat" },
              { to: "/tools", label: "Health Tools" },
              { to: "/insights", label: "AI Health Insights" },
            ]}
          />
          <FooterCol
            title="Learn"
            links={[
              { to: "/education", label: "Health Education" },
              { to: "/about", label: "About MediSage AI" },
              { to: "/privacy", label: "Privacy & Security" },
            ]}
          />
          <div className="space-y-2">
            <p className="text-sm font-semibold">Medical disclaimer</p>
            <p className="text-xs leading-relaxed text-muted-foreground">{DISCLAIMER_TEXT}</p>
          </div>
        </div>
      </footer>

      <nav
        aria-label="Mobile quick navigation"
        className="no-print fixed inset-x-0 bottom-0 z-40 flex border-t border-border bg-background/95 backdrop-blur lg:hidden"
      >
        {MOBILE_TABS.map(({ to, label, Icon }) => (
          <Link
            key={to}
            to={to}
            className="flex flex-1 flex-col items-center gap-1 py-2.5 text-[11px] font-medium text-muted-foreground"
            activeProps={{ className: "text-primary" }}
          >
            <Icon className="h-5 w-5" aria-hidden="true" />
            {label}
          </Link>
        ))}
      </nav>
    </div>
  );
}

function FooterCol({
  title,
  links,
}: {
  title: string;
  links: { to: string; label: string }[];
}) {
  return (
    <div className="space-y-2">
      <p className="text-sm font-semibold">{title}</p>
      <ul className="space-y-1.5">
        {links.map((l) => (
          <li key={l.to}>
            <Link to={l.to} className="text-sm text-muted-foreground hover:text-primary">
              {l.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
