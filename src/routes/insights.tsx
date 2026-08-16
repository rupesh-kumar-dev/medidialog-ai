import { Link, createFileRoute, useNavigate } from "@tanstack/react-router";
import { Activity, ArrowRight, CalendarDays, MessageCircle } from "lucide-react";
import { useEffect, useState } from "react";

import { BrandLoader } from "@/components/brand";
import { MedicalDisclaimer } from "@/components/disclaimer";
import { RiskBadge, type RiskLevel } from "@/components/risk";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";

export const Route = createFileRoute("/insights")({
  head: () => ({
    meta: [
      { title: "Health insights | MediSage AI" },
      {
        name: "description",
        content:
          "A simple overview of your MediSage AI activity: assessments saved, questions asked and your most recent risk level.",
      },
      { property: "og:title", content: "Health insights | MediSage AI" },
      { property: "og:description", content: "Understand your health activity at a glance." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Insights,
});

type Row = { id: string; created_at: string; risk_level: string; summary: string };

function Insights() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [rows, setRows] = useState<Row[] | null>(null);
  const [chatCount, setChatCount] = useState(0);

  useEffect(() => {
    if (loading) return;
    if (!user) {
      void navigate({ to: "/auth", replace: true });
      return;
    }
    void (async () => {
      const [assessments, sessions] = await Promise.all([
        supabase
          .from("assessments")
          .select("id, created_at, risk_level, summary")
          .order("created_at", { ascending: false }),
        supabase.from("chat_sessions").select("id"),
      ]);
      setRows((assessments.data ?? []) as Row[]);
      setChatCount(sessions.data?.length ?? 0);
    })();
  }, [user, loading, navigate]);

  if (loading || rows === null) return <BrandLoader label="Loading your insights…" />;

  const latest = rows[0];

  return (
    <div className="dashboard-surface min-h-screen">
      <div className="mx-auto w-full max-w-4xl space-y-8 px-4 py-8 md:py-12">
        <header>
          <h1 className="text-2xl font-bold tracking-tight md:text-3xl">Health insights</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            A simple look at how you have been using MediSage AI.
          </p>
        </header>

        <div className="grid gap-4 sm:grid-cols-3">
          <Stat icon={<Activity className="h-5 w-5" />} value={rows.length} label="Assessments saved" />
          <Stat icon={<MessageCircle className="h-5 w-5" />} value={chatCount} label="AI conversations" />
          <Stat
            icon={<CalendarDays className="h-5 w-5" />}
            value={latest ? new Date(latest.created_at).toLocaleDateString() : "—"}
            label="Last check-in"
          />
        </div>

        <section className="rounded-2xl border border-border bg-card p-6">
          <h2 className="text-lg font-semibold">Most recent assessment</h2>
          {latest ? (
            <Link
              to="/report/$reportId"
              params={{ reportId: latest.id }}
              className="mt-4 flex items-center gap-3 rounded-xl border border-border p-4 hover:border-primary"
            >
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{latest.summary}</p>
                <p className="text-xs text-muted-foreground">
                  {new Date(latest.created_at).toLocaleString()}
                </p>
              </div>
              <RiskBadge level={latest.risk_level as RiskLevel} />
              <ArrowRight className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
            </Link>
          ) : (
            <p className="mt-3 text-sm text-muted-foreground">
              You have not saved an assessment yet.
            </p>
          )}
          <Button asChild variant="outline" className="mt-4">
            <Link to="/assessment">Start a new assessment</Link>
          </Button>
        </section>

        <MedicalDisclaimer compact />
      </div>
    </div>
  );
}

function Stat({
  icon,
  value,
  label,
}: {
  icon: React.ReactNode;
  value: string | number;
  label: string;
}) {
  return (
    <div className="rounded-2xl border border-border bg-card p-5">
      <span className="text-primary">{icon}</span>
      <p className="mt-2 text-2xl font-bold tracking-tight">{value}</p>
      <p className="text-xs text-muted-foreground">{label}</p>
    </div>
  );
}
