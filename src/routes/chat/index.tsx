import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";

import { BrandLoader } from "@/components/brand";
import { ChatPanel } from "@/components/chat-panel";
import { MedicalDisclaimer } from "@/components/disclaimer";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";

export const Route = createFileRoute("/chat/")({
  head: () => ({
    meta: [
      { title: "MediSage AI Chat | Your Personal Healthcare Assistant" },
      {
        name: "description",
        content: "Chat with MediSage AI about symptoms, health questions and next steps.",
      },
      { property: "og:title", content: "MediSage AI Chat" },
      { property: "og:description", content: "Have a natural conversation about your health." },
    ],
  }),
  component: ChatIndex,
});

function ChatIndex() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (loading) return;
    if (!user) {
      setReady(true);
      return;
    }
    let cancelled = false;
    void (async () => {
      const { data } = await supabase
        .from("chat_sessions")
        .select("id")
        .order("updated_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (cancelled) return;
      if (data?.id) {
        void navigate({ to: "/chat/$sessionId", params: { sessionId: data.id }, replace: true });
        return;
      }
      const { data: created } = await supabase
        .from("chat_sessions")
        .insert({ user_id: user.id })
        .select("id")
        .maybeSingle();
      if (created?.id && !cancelled) {
        void navigate({
          to: "/chat/$sessionId",
          params: { sessionId: created.id },
          replace: true,
        });
      } else if (!cancelled) {
        setReady(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [user, loading, navigate]);

  if (!ready) return <BrandLoader label="Opening MediSage AI…" />;

  return (
    <div className="mx-auto w-full max-w-4xl space-y-4 px-4 py-8">
      <h1 className="text-2xl font-bold tracking-tight">MediSage AI Chat</h1>
      <p className="text-sm text-muted-foreground">
        You are chatting as a guest. Sign in to keep your conversation history.
      </p>
      <ChatPanel sessionId="guest" />
      <MedicalDisclaimer compact />
    </div>
  );
}
