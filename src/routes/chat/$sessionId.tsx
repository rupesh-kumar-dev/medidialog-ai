import { Link, createFileRoute, useNavigate } from "@tanstack/react-router";
import type { UIMessage } from "ai";
import { Plus, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { BrandLoader } from "@/components/brand";
import { ChatPanel } from "@/components/chat-panel";
import { MedicalDisclaimer } from "@/components/disclaimer";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";

export const Route = createFileRoute("/chat/$sessionId")({
  head: () => ({
    meta: [
      { title: "Conversation | MediSage AI Chat" },
      {
        name: "description",
        content: "Continue your saved conversation with the MediSage AI healthcare assistant.",
      },
      { property: "og:title", content: "Conversation | MediSage AI" },
      { property: "og:description", content: "Your saved AI health conversation." },
    ],
  }),
  component: ChatThread,
});

type SessionRow = { id: string; title: string; updated_at: string };

function ChatThread() {
  const { sessionId } = Route.useParams();
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [sessions, setSessions] = useState<SessionRow[]>([]);
  const [messages, setMessages] = useState<UIMessage[] | null>(null);

  useEffect(() => {
    if (loading) return;
    if (!user) {
      void navigate({ to: "/auth", replace: true });
      return;
    }
    let cancelled = false;
    void (async () => {
      const [{ data: list }, { data: msgs }] = await Promise.all([
        supabase
          .from("chat_sessions")
          .select("id, title, updated_at")
          .order("updated_at", { ascending: false }),
        supabase
          .from("chat_messages")
          .select("id, role, content")
          .eq("session_id", sessionId)
          .order("created_at", { ascending: true }),
      ]);
      if (cancelled) return;
      setSessions((list ?? []) as SessionRow[]);
      setMessages(
        (msgs ?? []).map((m) => ({
          id: m.id,
          role: m.role === "assistant" ? "assistant" : "user",
          parts: [{ type: "text", text: m.content }],
        })) as UIMessage[],
      );
    })();
    return () => {
      cancelled = true;
    };
  }, [sessionId, user, loading, navigate]);

  async function newConversation() {
    if (!user) return;
    const { data } = await supabase
      .from("chat_sessions")
      .insert({ user_id: user.id })
      .select("id")
      .maybeSingle();
    if (!data?.id) {
      toast.error("We couldn't start a new conversation.");
      return;
    }
    void navigate({ to: "/chat/$sessionId", params: { sessionId: data.id } });
  }

  async function deleteSession(id: string) {
    await supabase.from("chat_sessions").delete().eq("id", id);
    setSessions((prev) => prev.filter((s) => s.id !== id));
    if (id === sessionId) void navigate({ to: "/chat", replace: true });
  }

  if (loading || messages === null) return <BrandLoader label="Loading your conversation…" />;

  return (
    <div className="mx-auto grid w-full max-w-7xl gap-6 px-4 py-8 lg:grid-cols-[260px_1fr]">
      <aside className="space-y-3">
        <Button className="w-full" onClick={() => void newConversation()}>
          <Plus className="mr-2 h-4 w-4" /> New conversation
        </Button>
        <ul className="space-y-1">
          {sessions.map((s) => (
            <li
              key={s.id}
              className={`flex items-center gap-1 rounded-lg border px-2 py-1.5 ${
                s.id === sessionId ? "border-primary bg-primary-soft" : "border-border"
              }`}
            >
              <Link
                to="/chat/$sessionId"
                params={{ sessionId: s.id }}
                className="flex-1 truncate text-left text-sm"
              >
                {s.title}
              </Link>
              <button
                type="button"
                aria-label={`Delete ${s.title}`}
                onClick={() => void deleteSession(s.id)}
                className="text-muted-foreground hover:text-destructive"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </li>
          ))}
        </ul>
      </aside>

      <div className="space-y-4">
        <ChatPanel
          key={sessionId}
          sessionId={sessionId}
          initialMessages={messages}
          persist
          userId={user?.id}
          onFirstMessage={(text) => {
            const title = text.slice(0, 48);
            void supabase.from("chat_sessions").update({ title }).eq("id", sessionId);
            setSessions((prev) => prev.map((s) => (s.id === sessionId ? { ...s, title } : s)));
          }}
        />
        <MedicalDisclaimer compact />
      </div>
    </div>
  );
}
