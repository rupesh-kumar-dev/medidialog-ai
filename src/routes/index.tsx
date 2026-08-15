import { Link, createFileRoute } from "@tanstack/react-router";
import {
  Activity,
  BookOpen,
  Brain,
  ClipboardList,
  History,
  MessageCircle,
  ShieldAlert,
  Sparkles,
} from "lucide-react";
import { useState } from "react";

import heroImage from "@/assets/hero-ai-assistant.jpg";
import { MedicalDisclaimer } from "@/components/disclaimer";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { DEMO_SCENARIOS } from "@/lib/health-data";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "MediSage AI — Smarter Health Conversations, Powered by AI" },
      {
        name: "description",
        content:
          "Describe your symptoms, ask health questions and receive intelligent, easy-to-understand guidance with MediSage AI.",
      },
      { property: "og:title", content: "MediSage AI — Smarter Health Conversations" },
      {
        property: "og:description",
        content: "Ask. Analyze. Understand. Take the Next Step.",
      },
    ],
  }),
  component: Landing,
});

const FEATURES = [
  {
    to: "/assessment",
    Icon: ClipboardList,
    title: "AI Symptom Analysis",
    text: "Describe how you feel and let MediSage AI organize your symptoms.",
  },
  {
    to: "/chat",
    Icon: MessageCircle,
    title: "AI Health Chat",
    text: "Have a natural conversation with your AI healthcare assistant.",
  },
  {
    to: "/risk",
    Icon: ShieldAlert,
    title: "Risk Awareness",
    text: "Understand whether your symptoms may require professional attention.",
  },
  {
    to: "/education",
    Icon: BookOpen,
    title: "Health Insights",
    text: "Explore understandable information about common health topics.",
  },
  {
    to: "/history",
    Icon: History,
    title: "Personal Health History",
    text: "Keep track of your previous assessments in one place.",
  },
  {
    to: "/assessment",
    Icon: Sparkles,
    title: "Personalized Guidance",
    text: "Receive general next-step guidance based on the information you provide.",
  },
] as const;

const STEPS = [
  {
    n: 1,
    title: "Tell Us How You Feel",
    short: "Describe symptoms naturally or select them manually.",
    detail:
      "You can type freely — for example \"I have had a headache and mild fever for two days\" — or pick symptoms from organised categories. Add severity, duration, frequency and onset for a clearer picture.",
  },
  {
    n: 2,
    title: "AI Asks Questions",
    short: "MediSage AI asks relevant follow-up questions.",
    detail:
      "Instead of jumping to conclusions, MediSage AI asks short clarifying questions that adapt to your answers, so the summary reflects your actual situation.",
  },
  {
    n: 3,
    title: "AI Analyzes",
    short: "Your information is organised into possible conditions and risk indicators.",
    detail:
      "MediSage AI groups what you shared, highlights patterns, lists possible conditions with a relevance indicator, and checks for recognised warning signs. This is information support, never a diagnosis.",
  },
  {
    n: 4,
    title: "Understand Your Next Step",
    short: "A clear summary, risk level, warning signs and next steps.",
    detail:
      "You receive a plain-language report you can save, print or share with a healthcare professional, plus guidance on when professional attention may be appropriate.",
  },
];

function Landing() {
  const [openStep, setOpenStep] = useState<(typeof STEPS)[number] | null>(null);

  return (
    <div>
      <section className="gradient-soft border-b border-border">
        <div className="mx-auto grid w-full max-w-7xl items-center gap-10 px-4 py-14 lg:grid-cols-2 lg:py-20">
          <div className="space-y-6">
            <Badge className="gap-1.5 bg-accent-soft text-accent-foreground">
              <Sparkles className="h-3.5 w-3.5" /> Ask. Analyze. Understand. Take the Next Step.
            </Badge>
            <h1 className="text-4xl leading-tight font-bold tracking-tight sm:text-5xl">
              Smarter Health Conversations,{" "}
              <span className="text-gradient-brand">Powered by AI.</span>
            </h1>
            <p className="max-w-xl text-lg text-muted-foreground">
              Describe your symptoms, ask health questions, and receive intelligent,
              easy-to-understand health guidance with MediSage AI.
            </p>
            <div className="flex flex-wrap items-center gap-3">
              <Button asChild size="lg">
                <Link to="/assessment">Start Health Assessment</Link>
              </Button>
              <Button asChild size="lg" variant="outline">
                <Link to="/chat">Talk to MediSage AI</Link>
              </Button>
              <Button asChild variant="ghost" size="sm">
                <a href="#how-it-works">Explore How It Works</a>
              </Button>
            </div>
            <MedicalDisclaimer compact className="max-w-xl" />
          </div>
          <div className="relative">
            <img
              src={heroImage}
              alt="A friendly AI healthcare assistant talking with a person about their health"
              width={1280}
              height={960}
              className="w-full rounded-3xl border border-border shadow-lift"
            />
          </div>
        </div>
      </section>

      <section className="mx-auto w-full max-w-7xl px-4 py-14" aria-labelledby="features-title">
        <h2 id="features-title" className="text-2xl font-bold tracking-tight sm:text-3xl">
          Everything you need to understand your health
        </h2>
        <p className="mt-2 max-w-2xl text-muted-foreground">
          Every card below opens a real, working part of MediSage AI.
        </p>
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map(({ to, Icon, title, text }) => (
            <Link
              key={title}
              to={to}
              className="card-interactive group block p-5 focus-visible:ring-2 focus-visible:ring-ring"
            >
              <span className="gradient-brand mb-4 inline-flex h-11 w-11 items-center justify-center rounded-xl text-primary-foreground">
                <Icon className="h-5 w-5" aria-hidden="true" />
              </span>
              <h3 className="text-base font-semibold">{title}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{text}</p>
              <span className="mt-3 inline-block text-sm font-medium text-primary">Open →</span>
            </Link>
          ))}
        </div>
      </section>

      <section
        id="how-it-works"
        className="border-y border-border bg-card py-14"
        aria-labelledby="how-title"
      >
        <div className="mx-auto w-full max-w-7xl px-4">
          <h2 id="how-title" className="text-2xl font-bold tracking-tight sm:text-3xl">
            How MediSage AI works
          </h2>
          <p className="mt-2 text-muted-foreground">Click any step to learn more.</p>
          <ol className="mt-8 grid gap-4 md:grid-cols-4">
            {STEPS.map((step) => (
              <li key={step.n}>
                <button
                  type="button"
                  onClick={() => setOpenStep(step)}
                  className="card-interactive h-full w-full p-5 text-left"
                >
                  <span className="gradient-brand inline-flex h-9 w-9 items-center justify-center rounded-full text-sm font-bold text-primary-foreground">
                    {step.n}
                  </span>
                  <h3 className="mt-3 text-base font-semibold">{step.title}</h3>
                  <p className="mt-1 text-sm text-muted-foreground">{step.short}</p>
                </button>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="mx-auto w-full max-w-7xl px-4 py-14" aria-labelledby="demo-title">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 id="demo-title" className="text-2xl font-bold tracking-tight sm:text-3xl">
              Try MediSage AI
            </h2>
            <p className="mt-2 text-muted-foreground">
              Pick a sample scenario to populate the assessment instantly.
            </p>
          </div>
          <Button asChild variant="outline">
            <Link to="/assessment">Open assessment</Link>
          </Button>
        </div>
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {DEMO_SCENARIOS.map((s) => (
            <Link
              key={s.id}
              to="/assessment"
              search={{ demo: s.id }}
              className="card-interactive block p-5"
            >
              <Activity className="h-5 w-5 text-accent" aria-hidden="true" />
              <h3 className="mt-3 text-sm font-semibold">{s.title}</h3>
              <p className="mt-1 text-xs text-muted-foreground">{s.description}</p>
              <span className="mt-3 inline-block text-xs font-medium text-primary">
                Try this scenario →
              </span>
            </Link>
          ))}
        </div>
      </section>

      <section className="border-t border-border bg-primary-soft py-14">
        <div className="mx-auto flex w-full max-w-4xl flex-col items-center gap-4 px-4 text-center">
          <Brain className="h-8 w-8 text-primary" aria-hidden="true" />
          <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">
            Responsible AI, built for understanding
          </h2>
          <p className="max-w-2xl text-muted-foreground">
            MediSage AI is an AI-powered health information and decision-support assistant. It does
            not provide definitive medical diagnoses and does not replace qualified healthcare
            professionals.
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <Button asChild>
              <Link to="/about">About MediSage AI</Link>
            </Button>
            <Button asChild variant="outline">
              <Link to="/privacy">Privacy & Security</Link>
            </Button>
          </div>
        </div>
      </section>

      <Dialog open={openStep !== null} onOpenChange={(o) => !o && setOpenStep(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              Step {openStep?.n}: {openStep?.title}
            </DialogTitle>
            <DialogDescription>{openStep?.short}</DialogDescription>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">{openStep?.detail}</p>
          <Button asChild className="mt-2">
            <Link to="/assessment" onClick={() => setOpenStep(null)}>
              Start an assessment
            </Link>
          </Button>
        </DialogContent>
      </Dialog>
    </div>
  );
}
