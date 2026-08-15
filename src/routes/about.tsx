import { createFileRoute } from "@tanstack/react-router";

import { MedicalDisclaimer } from "@/components/disclaimer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "About MediSage AI | Your personal healthcare assistant" },
      {
        name: "description",
        content:
          "MediSage AI explains symptoms in plain language, highlights risk and points you to the right next step.",
      },
      { property: "og:title", content: "About MediSage AI" },
      { property: "og:description", content: "How our AI healthcare assistant works." },
    ],
  }),
  component: About,
});

function About() {
  return (
    <div className="mx-auto w-full max-w-3xl space-y-6 px-4 py-8">
      <h1 className="text-2xl font-bold tracking-tight">About MediSage AI</h1>
      <p className="text-sm text-muted-foreground">
        MediSage AI turns confusing symptoms into clear, calm guidance. Describe how you feel, answer
        a few adaptive follow-up questions, and receive an easy-to-read summary with a risk
        indicator, possible explanations and practical next steps.
      </p>
      <div className="grid gap-4 sm:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>What it does</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            Symptom assessments, a conversational health assistant, saved reports and everyday
            health education.
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>What it does not do</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            It never diagnoses, prescribes, or replaces a qualified clinician. In an emergency, call
            your local emergency number.
          </CardContent>
        </Card>
      </div>
      <MedicalDisclaimer />
    </div>
  );
}
