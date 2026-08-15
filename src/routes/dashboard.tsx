import { Link, createFileRoute, useNavigate } from "@tanstack/react-router";
import { Activity, FileText, MessageCircle } from "lucide-react";
import { useEffect, useState } from "react";

import { BrandLoader } from "@/components/brand";
import { MedicalDisclaimer } from "@/components/disclaimer";
import { RiskBadge, type RiskLevel } from "@/components/risk";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";

export const Route = createFileRoute("/dashboard")({
  head: () => ({
    meta: [
      { title: "Your health dashboard | MediSage AI" },
      {
        name: "description",
        content: "See your recent AI health assessments, risk trends and saved conversations.",
      },
      { property: "og:title", content: "Health dashboard | MediSage AI" },
      { property: "og:description", content: "Your personal health overview." },
    ],
  }),
  component: Dashboard,
});

type AssessmentRow = {
  id: string;
  created_at: string;
  risk_level: string;
  summary: string;
};

function Dashboard() {
  const { user, profile, loading } = useAuth();
  const navigate = useNavigate();
  const [rows, setRows] = useState<AssessmentRow[] | null>(null);

  useEffect(() => {
    if (loading) return;
    if (!user) {
      void navigate({ to: "/auth", replace: true });
      return;
    }
    void (async () => {
      const { data } = await supabase
        .from("assessments")
        .select("id, created_at, risk_level, summary")
        .order("created_at", { ascending: false })
        .limit(5);
      setRows((data ?? []) as AssessmentRow[]);
    })();
  }, [user, loading, navigate]);

  if (loading || rows === null) return <BrandLoader label="Loading your dashboard…" />;

  return (
    <div className="mx-auto w-full max-w-5xl space-y-6 px-4 py-8">
      <header>
        <h1 className="text-2xl font-bold tracking-tight">
          Welcome back{profile?.full_name ? `, ${profile.full_name}` : ""}
        </h1>
        <p className="text-sm text-muted-foreground">Here's a snapshot of your health activity.</p>
      </header>

      <div className="grid gap-4 sm:grid-cols-3">
        <QuickCard to="/assessment" icon={<Activity className="h-5 w-5" />} label="New assessment" />
        <QuickCard to="/chat" icon={<MessageCircle className="h-5 w-5" />} label="Ask MediSage AI" />
        <QuickCard to="/history" icon={<FileText className="h-5 w-5" />} label="All reports" />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent assessments</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {rows.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No assessments yet.{" "}
              <Link to="/assessment" className="text-primary underline">
                Start your first one
              </Link>
              .
            </p>
          ) : (
            rows.map((r) => (
              <Link
                key={r.id}
                to="/report/$reportId"
                params={{ reportId: r.id }}
                className="flex items-start justify-between gap-3 rounded-xl border border-border p-3 hover:border-primary"
              >
                <div>
                  <p className="text-sm font-medium">{r.summary}</p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(r.created_at).toLocaleString()}
                  </p>
                </div>
                <RiskBadge level={r.risk_level as RiskLevel} />
              </Link>
            ))
          )}
        </CardContent>
      </Card>

      <Button variant="outline" onClick={() => void navigate({ to: "/history" })}>
        View full history
      </Button>
      <MedicalDisclaimer compact />
    </div>
  );
}

function QuickCard({
  to,
  icon,
  label,
}: {
  to: "/assessment" | "/chat" | "/history";
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <Link
      to={to}
      className="flex items-center gap-3 rounded-2xl border border-border bg-card p-4 transition-colors hover:border-primary"
    >
      <span className="text-primary">{icon}</span>
      <span className="text-sm font-medium">{label}</span>
    </Link>
  );
}
