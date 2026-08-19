import { Link, createFileRoute, useNavigate } from "@tanstack/react-router";
import {
  ArrowRight,
  BookOpen,
  FileText,
  HeartPulse,
  MessageCircle,
  Sparkles,
  Stethoscope,
  Wrench,
} from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";

import { BrandLoader } from "@/components/brand";
import { MedicalDisclaimer } from "@/components/disclaimer";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { displayName, useAuth } from "@/lib/auth";

import chatImg from "@/assets/feat-chat.jpg";
import educationImg from "@/assets/feat-education.jpg";
import insightsImg from "@/assets/feat-insights.jpg";
import reportsImg from "@/assets/feat-reports.jpg";
import symptomsImg from "@/assets/feat-symptoms.jpg";
import toolsImg from "@/assets/feat-tools.jpg";
import welcomeImg from "@/assets/dash-welcome.jpg";

export const Route = createFileRoute("/dashboard")({
  head: () => ({
    meta: [
      { title: "Your health home | MediSage AI" },
      {
        name: "description",
        content:
          "A simple personal health home screen: check symptoms, chat with MediSage AI, view reports and explore health tools.",
      },
      { property: "og:title", content: "Your health home | MediSage AI" },
      {
        property: "og:description",
        content: "Choose what you need — symptoms, AI chat, reports, insights, learning and tools.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Dashboard,
});

type FeatureTo = "/assessment" | "/chat" | "/history" | "/insights" | "/education" | "/tools";

const FEATURES: {
  to: FeatureTo;
  title: string;
  desc: string;
  image: string;
  icon: ReactNode;
}[] = [
  {
    to: "/assessment",
    title: "Check My Symptoms",
    desc: "Analyze your symptoms with AI.",
    image: symptomsImg,
    icon: <Stethoscope className="h-4 w-4" />,
  },
  {
    to: "/chat",
    title: "Talk to MediSage",
    desc: "Ask your AI health assistant.",
    image: chatImg,
    icon: <MessageCircle className="h-4 w-4" />,
  },
  {
    to: "/history",
    title: "My Health Reports",
    desc: "View your previous assessments.",
    image: reportsImg,
    icon: <FileText className="h-4 w-4" />,
  },
  {
    to: "/insights",
    title: "Health Insights",
    desc: "Understand your health activity.",
    image: insightsImg,
    icon: <HeartPulse className="h-4 w-4" />,
  },
  {
    to: "/education",
    title: "Learn About Health",
    desc: "Explore health information.",
    image: educationImg,
    icon: <BookOpen className="h-4 w-4" />,
  },
  {
    to: "/tools",
    title: "Health Tools",
    desc: "Useful tools for everyday health.",
    image: toolsImg,
    icon: <Wrench className="h-4 w-4" />,
  },
];

type Activity =
  | { kind: "assessment"; id: string; title: string; detail: string; at: string }
  | { kind: "chat"; id: string; title: string; detail: string; at: string };

function relativeDay(iso: string) {
  const d = new Date(iso);
  const today = new Date();
  const days = Math.floor((today.setHours(0, 0, 0, 0) - new Date(iso).setHours(0, 0, 0, 0)) / 86400000);
  if (days <= 0) return "Today";
  if (days === 1) return "Yesterday";
  return d.toLocaleDateString();
}

function Dashboard() {
  const { user, profile, loading } = useAuth();
  const navigate = useNavigate();
  const [activity, setActivity] = useState<Activity[] | null>(null);

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
          .select("id, created_at, summary")
          .order("created_at", { ascending: false })
          .limit(3),
        supabase
          .from("chat_sessions")
          .select("id, updated_at, title")
          .order("updated_at", { ascending: false })
          .limit(3),
      ]);

      const items: Activity[] = [
        ...(assessments.data ?? []).map((a) => ({
          kind: "assessment" as const,
          id: a.id,
          title: "Symptom Assessment",
          detail: a.summary ?? "Saved assessment",
          at: a.created_at,
        })),
        ...(sessions.data ?? []).map((s) => ({
          kind: "chat" as const,
          id: s.id,
          title: "Health Question",
          detail: s.title,
          at: s.updated_at,
        })),
      ]
        .sort((a, b) => +new Date(b.at) - +new Date(a.at))
        .slice(0, 3);

      setActivity(items);
    })();
  }, [user, loading, navigate]);

  if (loading || activity === null) return <BrandLoader label="Loading your dashboard…" />;

  return (
    <div className="dashboard-surface min-h-screen">
      <div className="mx-auto w-full max-w-5xl space-y-10 px-4 py-8 md:py-12">
        {/* Welcome */}
        <header className="flex items-center gap-4 rounded-3xl border border-border/70 bg-card/85 p-5 shadow-sm backdrop-blur md:p-7">
          <div className="min-w-0 flex-1">
            <h1 className="text-2xl font-bold tracking-tight md:text-3xl">
              Welcome back, {displayName(profile, user)} 👋
            </h1>
            <p className="mt-1 text-sm text-muted-foreground md:text-base">
              How can MediSage AI help you today?
            </p>
          </div>
          <img
            src={welcomeImg}
            alt="MediSage AI assistant waving"
            width={768}
            height={768}
            loading="lazy"
            className="h-20 w-20 shrink-0 rounded-2xl object-contain md:h-28 md:w-28"
          />
        </header>

        {/* Features */}
        <section aria-labelledby="features-heading" className="space-y-4">
          <h2 id="features-heading" className="text-lg font-semibold tracking-tight">
            What would you like to do?
          </h2>
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
            {FEATURES.map((f) => (
              <Link key={f.to} to={f.to} className="feature-card group block overflow-hidden">
                <div className="h-36 overflow-hidden bg-secondary/50">
                  <img
                    src={f.image}
                    alt=""
                    width={768}
                    height={512}
                    loading="lazy"
                    className="feature-card-image h-full w-full object-cover"
                  />
                </div>
                <div className="space-y-1.5 p-5">
                  <div className="flex items-center gap-2">
                    <span className="text-primary">{f.icon}</span>
                    <h3 className="text-base font-semibold">{f.title}</h3>
                    <ArrowRight className="feature-card-arrow ml-auto h-4 w-4 text-muted-foreground" />
                  </div>
                  <p className="text-sm text-muted-foreground">{f.desc}</p>
                </div>
              </Link>
            ))}
          </div>
        </section>

        {/* Recent activity */}
        <section aria-labelledby="activity-heading" className="space-y-3">
          <h2 id="activity-heading" className="text-lg font-semibold tracking-tight">
            Recent activity
          </h2>
          {activity.length === 0 ? (
            <div className="flex items-center gap-4 rounded-2xl border border-border bg-card p-6">
              <img
                src={insightsImg}
                alt=""
                width={768}
                height={512}
                loading="lazy"
                className="h-16 w-16 rounded-xl object-contain"
              />
              <p className="text-sm text-muted-foreground">
                Your recent health activity will appear here.
              </p>
            </div>
          ) : (
            <ul className="space-y-2.5">
              {activity.map((a) =>
                a.kind === "assessment" ? (
                  <li key={`a-${a.id}`}>
                    <Link
                      to="/report/$reportId"
                      params={{ reportId: a.id }}
                      className="card-interactive flex items-center gap-3 p-4"
                    >
                      <ActivityRow icon={<Stethoscope className="h-4 w-4" />} item={a} />
                    </Link>
                  </li>
                ) : (
                  <li key={`c-${a.id}`}>
                    <Link
                      to="/chat/$sessionId"
                      params={{ sessionId: a.id }}
                      className="card-interactive flex items-center gap-3 p-4"
                    >
                      <ActivityRow icon={<MessageCircle className="h-4 w-4" />} item={a} />
                    </Link>
                  </li>
                ),
              )}
            </ul>
          )}
        </section>

        {/* Reminder */}
        <section className="rounded-3xl border border-primary/20 bg-primary-soft p-6 md:p-8">
          <h2 className="flex items-center gap-2 text-lg font-semibold">
            <Sparkles className="h-5 w-5 text-primary" aria-hidden="true" />
            Stay health-aware 💙
          </h2>
          <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
            Have symptoms that are bothering you? Start a new assessment and understand what
            information you may want to discuss with a healthcare professional.
          </p>
          <Button asChild className="mt-4">
            <Link to="/assessment">
              Start assessment <ArrowRight className="ml-1 h-4 w-4" />
            </Link>
          </Button>
        </section>

        <MedicalDisclaimer compact />
      </div>
    </div>
  );
}

function ActivityRow({ icon, item }: { icon: ReactNode; item: Activity }) {
  return (
    <>
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary-soft text-primary">
        {icon}
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium">{item.title}</p>
        <p className="truncate text-xs text-muted-foreground">{item.detail}</p>
      </div>
      <span className="shrink-0 text-xs text-muted-foreground">{relativeDay(item.at)}</span>
      <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden="true" />
    </>
  );
}

