import { createFileRoute } from "@tanstack/react-router";

import { MedicalDisclaimer } from "@/components/disclaimer";

export const Route = createFileRoute("/privacy")({
  head: () => ({
    meta: [
      { title: "Privacy and your health data | MediSage AI" },
      {
        name: "description",
        content:
          "How MediSage AI handles your symptoms, assessments and conversations, and the control you keep.",
      },
      { property: "og:title", content: "Privacy | MediSage AI" },
      { property: "og:description", content: "How we handle your health information." },
    ],
  }),
  component: Privacy,
});

function Privacy() {
  return (
    <div className="mx-auto w-full max-w-3xl space-y-5 px-4 py-8">
      <h1 className="text-2xl font-bold tracking-tight">Privacy and your health data</h1>
      <Section title="What we store">
        If you are signed in, we save the assessments and conversations you choose to keep, plus your
        name and email. Guests can use the assistant without anything being stored.
      </Section>
      <Section title="Who can see it">
        Your records are private to your account and protected by row-level security rules on the
        database. Nobody else can read your assessments or chats.
      </Section>
      <Section title="How AI is used">
        Your symptom descriptions are sent to an AI model to generate follow-up questions and
        summaries. Avoid including details you would not want processed by a third-party model.
      </Section>
      <Section title="Deleting your data">
        You can delete individual conversations at any time, and request full account deletion by
        contacting us.
      </Section>
      <MedicalDisclaimer />
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-1.5">
      <h2 className="text-lg font-semibold">{title}</h2>
      <p className="text-sm text-muted-foreground">{children}</p>
    </section>
  );
}
