import { Link, createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";

import { BrandLoader } from "@/components/brand";
import { MedicalDisclaimer } from "@/components/disclaimer";
import { RiskBadge } from "@/components/risk";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";

export const Route = createFileRoute("/history")({
  head: () => ({
    meta: [
      { title: "Assessment history | MediSage AI" },
      {
        name: "description",
        content: "Browse every AI health assessment you have saved with MediSage AI.",
      },
      { property: "og:title", content: "Assessment history | MediSage AI" },
      { property: "og:description", content: "All of your saved health reports in one place." },
    ],
  }),
  component: History,
});

type Row = { id: string; created_at: string; risk_level: string; summary: string };

function History() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [rows, setRows] = useState<Row[] | null>(null);

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
        .order("created_at", { ascending: false });
      setRows((data ?? []) as Row[]);
    })();
  }, [user, loading, navigate]);

  if (loading || rows === null) return <BrandLoader label="Loading your history…" />;

  return (
    <div className="mx-auto w-full max-w-4xl space-y-6 px-4 py-8">
      <h1 className="text-2xl font-bold tracking-tight">Assessment history</h1>
      {rows.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          Nothing saved yet.{" "}
          <Link to="/assessment" className="text-primary underline">
            Run an assessment
          </Link>
          .
        </p>
      ) : (
        <ul className="space-y-3">
          {rows.map((r) => (
            <li key={r.id}>
              <Link
                to="/report/$reportId"
                params={{ reportId: r.id }}
                className="flex items-start justify-between gap-3 rounded-xl border border-border bg-card p-4 hover:border-primary"
              >
                <div>
                  <p className="text-sm font-medium">{r.summary}</p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(r.created_at).toLocaleString()}
                  </p>
                </div>
                <RiskBadge level={r.risk_level} />
              </Link>
            </li>
          ))}
        </ul>
      )}
      <MedicalDisclaimer compact />
    </div>
  );
}
