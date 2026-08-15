import { createFileRoute } from "@tanstack/react-router";

import { MedicalDisclaimer } from "@/components/disclaimer";
import { RISK_META, RiskBadge, type RiskLevel } from "@/components/risk";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const Route = createFileRoute("/risk")({
  head: () => ({
    meta: [
      { title: "Understanding risk levels | MediSage AI" },
      {
        name: "description",
        content:
          "What low, moderate and urgent risk levels mean in a MediSage AI assessment, and what to do next.",
      },
      { property: "og:title", content: "Risk levels explained | MediSage AI" },
      { property: "og:description", content: "How to read your MediSage AI risk indicator." },
    ],
  }),
  component: RiskGuide,
});

const GUIDE: Record<RiskLevel, string> = {
  low: "Your symptoms look like something you can usually manage at home. Keep an eye on how you feel and book a routine appointment if things change.",
  moderate:
    "Your symptoms deserve a professional opinion soon. Contact your doctor or a clinic within the next day or two.",
  urgent:
    "Your symptoms may need immediate attention. Contact emergency services or go to the nearest emergency department now.",
};

function RiskGuide() {
  const levels = Object.keys(RISK_META) as RiskLevel[];
  return (
    <div className="mx-auto w-full max-w-3xl space-y-6 px-4 py-8">
      <header className="space-y-2">
        <h1 className="text-2xl font-bold tracking-tight">Understanding risk levels</h1>
        <p className="text-sm text-muted-foreground">
          Every assessment ends with one of three indicators. Here's what each one means.
        </p>
      </header>
      <div className="space-y-4">
        {levels.map((level) => (
          <Card key={level}>
            <CardHeader className="flex flex-row items-center justify-between gap-3">
              <CardTitle className="capitalize">{level}</CardTitle>
              <RiskBadge level={level} />
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">{GUIDE[level]}</CardContent>
          </Card>
        ))}
      </div>
      <MedicalDisclaimer />
    </div>
  );
}
