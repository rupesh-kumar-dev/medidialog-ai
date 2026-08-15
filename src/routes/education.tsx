import { createFileRoute } from "@tanstack/react-router";

import { MedicalDisclaimer } from "@/components/disclaimer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const Route = createFileRoute("/education")({
  head: () => ({
    meta: [
      { title: "Health education centre | MediSage AI" },
      {
        name: "description",
        content:
          "Plain-language guides on prevention, nutrition, sleep, mental wellbeing and when to seek care.",
      },
      { property: "og:title", content: "Health education | MediSage AI" },
      { property: "og:description", content: "Trusted, easy-to-read health guidance." },
    ],
  }),
  component: Education,
});

const TOPICS = [
  {
    title: "Everyday prevention",
    points: [
      "Aim for 150 minutes of moderate activity each week.",
      "Keep vaccinations and routine screenings up to date.",
      "Wash hands well to reduce common infections.",
    ],
  },
  {
    title: "Nutrition basics",
    points: [
      "Fill half your plate with vegetables and fruit.",
      "Choose whole grains and lean protein where possible.",
      "Limit added sugar, salt and ultra-processed foods.",
    ],
  },
  {
    title: "Sleep and recovery",
    points: [
      "Most adults need 7-9 hours of sleep.",
      "Keep a consistent bedtime and wake time.",
      "Avoid screens and caffeine late in the evening.",
    ],
  },
  {
    title: "Mental wellbeing",
    points: [
      "Short daily walks and breathing exercises lower stress.",
      "Stay connected with people you trust.",
      "Ask for professional support when low mood persists.",
    ],
  },
  {
    title: "When to seek urgent care",
    points: [
      "Chest pain, trouble breathing or fainting.",
      "Sudden weakness, confusion or slurred speech.",
      "Severe bleeding, severe pain or a very high fever.",
    ],
  },
];

function Education() {
  return (
    <div className="mx-auto w-full max-w-5xl space-y-6 px-4 py-8">
      <header className="space-y-2">
        <h1 className="text-2xl font-bold tracking-tight">Health education centre</h1>
        <p className="text-sm text-muted-foreground">
          Simple, practical guidance to help you stay well between doctor visits.
        </p>
      </header>
      <div className="grid gap-4 md:grid-cols-2">
        {TOPICS.map((t) => (
          <Card key={t.title}>
            <CardHeader>
              <CardTitle>{t.title}</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="list-disc space-y-1.5 pl-5 text-sm text-muted-foreground">
                {t.points.map((p) => (
                  <li key={p}>{p}</li>
                ))}
              </ul>
            </CardContent>
          </Card>
        ))}
      </div>
      <MedicalDisclaimer />
    </div>
  );
}
