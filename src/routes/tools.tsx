import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";

import { MedicalDisclaimer } from "@/components/disclaimer";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const Route = createFileRoute("/tools")({
  head: () => ({
    meta: [
      { title: "Health tools | MediSage AI" },
      {
        name: "description",
        content: "Quick health tools: BMI calculator, hydration guide and sleep planner.",
      },
      { property: "og:title", content: "Health tools | MediSage AI" },
      { property: "og:description", content: "Simple calculators for everyday health." },
    ],
  }),
  component: Tools,
});

function Tools() {
  const [height, setHeight] = useState("170");
  const [weight, setWeight] = useState("70");
  const [bedtime, setBedtime] = useState("23:00");

  const h = Number(height) / 100;
  const w = Number(weight);
  const bmi = h > 0 && w > 0 ? w / (h * h) : 0;
  const category =
    bmi === 0
      ? "—"
      : bmi < 18.5
        ? "Underweight"
        : bmi < 25
          ? "Healthy range"
          : bmi < 30
            ? "Overweight"
            : "Obesity range";

  const water = w > 0 ? Math.round(w * 33) : 0;

  const wake = (() => {
    const [hh, mm] = bedtime.split(":").map(Number);
    if (hh === undefined || mm === undefined || Number.isNaN(hh)) return "—";
    const total = (hh * 60 + mm + 8 * 60) % (24 * 60);
    return `${String(Math.floor(total / 60)).padStart(2, "0")}:${String(total % 60).padStart(2, "0")}`;
  })();

  return (
    <div className="mx-auto w-full max-w-4xl space-y-6 px-4 py-8">
      <header className="space-y-2">
        <h1 className="text-2xl font-bold tracking-tight">Health tools</h1>
        <p className="text-sm text-muted-foreground">
          Quick estimates to support — not replace — professional advice.
        </p>
      </header>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>BMI calculator</CardTitle>
            <CardDescription>Body mass index from height and weight.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="height">Height (cm)</Label>
              <Input
                id="height"
                inputMode="numeric"
                value={height}
                onChange={(e) => setHeight(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="weight">Weight (kg)</Label>
              <Input
                id="weight"
                inputMode="numeric"
                value={weight}
                onChange={(e) => setWeight(e.target.value)}
              />
            </div>
            <p className="text-sm">
              BMI: <strong>{bmi ? bmi.toFixed(1) : "—"}</strong> · {category}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Hydration guide</CardTitle>
            <CardDescription>A general daily water target.</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm">
              Around <strong>{water ? `${(water / 1000).toFixed(1)} litres` : "—"}</strong> per day,
              more in hot weather or with exercise.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Sleep planner</CardTitle>
            <CardDescription>Eight hours from your chosen bedtime.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="bedtime">Bedtime</Label>
              <Input
                id="bedtime"
                type="time"
                value={bedtime}
                onChange={(e) => setBedtime(e.target.value)}
              />
            </div>
            <p className="text-sm">
              Suggested wake time: <strong>{wake}</strong>
            </p>
          </CardContent>
        </Card>
      </div>
      <MedicalDisclaimer />
    </div>
  );
}
