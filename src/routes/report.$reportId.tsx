import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";

import { BrandLoader } from "@/components/brand";
import { MedicalDisclaimer } from "@/components/disclaimer";
import { RiskCard } from "@/components/risk";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";

export const Route = createFileRoute("/report/$reportId")({
  head: () => ({
    meta: [
      { title: "Health report | MediSage AI" },
      {
        name: "description",
        content: "Review a saved MediSage AI health report with risk level and next steps.",
      },
      { property: "og:title", content: "Health report | MediSage AI" },
      { property: "og:description", content: "Your saved AI-generated health report." },
    ],
  }),
  component: ReportPage,
});

type Report = {
  id: string;
  created_at: string;
  symptoms: string;
  risk_level: string;
  summary: string;
  analysis: {
    possibleConditions?: { name: string; likelihood: string; description: string }[];
    recommendations?: string[];
    seekCareIf?: string[];
    selfCare?: string[];
  } | null;
};

function ReportPage() {
  const { reportId } = Route.useParams();
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [report, setReport] = useState<Report | null | "missing">(null);

  useEffect(() => {
    if (loading) return;
    if (!user) {
      void navigate({ to: "/auth", replace: true });
      return;
    }
    void (async () => {
      const { data } = await supabase
        .from("assessments")
        .select("id, created_at, symptoms, risk_level, summary, analysis")
        .eq("id", reportId)
        .maybeSingle();
      setReport((data as Report | null) ?? "missing");
    })();
  }, [reportId, user, loading, navigate]);

  if (report === null || loading) return <BrandLoader label="Loading your report…" />;

  if (report === "missing") {
    return (
      <div className="mx-auto max-w-lg px-4 py-16 text-center">
        <h1 className="text-xl font-semibold">Report not found</h1>
        <Button className="mt-4" onClick={() => void navigate({ to: "/history" })}>
          Back to history
        </Button>
      </div>
    );
  }

  const analysis = report.analysis ?? {};

  return (
    <div className="mx-auto w-full max-w-3xl space-y-6 px-4 py-8">
      <header className="space-y-1">
        <h1 className="text-2xl font-bold tracking-tight">Health report</h1>
        <p className="text-sm text-muted-foreground">
          {new Date(report.created_at).toLocaleString()}
        </p>
      </header>

      <RiskCard level={report.risk_level} summary={report.summary} />

      <Card>
        <CardHeader>
          <CardTitle>Reported symptoms</CardTitle>
        </CardHeader>
        <CardContent className="text-sm whitespace-pre-wrap">{report.symptoms}</CardContent>
      </Card>

      {analysis.possibleConditions?.length ? (
        <Card>
          <CardHeader>
            <CardTitle>Possible explanations</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {analysis.possibleConditions.map((c) => (
              <div key={c.name} className="rounded-xl border border-border p-3">
                <p className="text-sm font-medium">
                  {c.name} · <span className="text-muted-foreground">{c.likelihood}</span>
                </p>
                <p className="text-sm text-muted-foreground">{c.description}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      ) : null}

      <ListCard title="Recommended next steps" items={analysis.recommendations} />
      <ListCard title="Self-care suggestions" items={analysis.selfCare} />
      <ListCard title="Seek medical care if" items={analysis.seekCareIf} />

      <div className="flex flex-wrap gap-2">
        <Button variant="outline" onClick={() => window.print()}>
          Print or save as PDF
        </Button>
        <Button variant="ghost" onClick={() => void navigate({ to: "/history" })}>
          Back to history
        </Button>
      </div>
      <MedicalDisclaimer />
    </div>
  );
}

function ListCard({ title, items }: { title: string; items?: string[] }) {
  if (!items?.length) return null;
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <ul className="list-disc space-y-1.5 pl-5 text-sm">
          {items.map((i) => (
            <li key={i}>{i}</li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}
